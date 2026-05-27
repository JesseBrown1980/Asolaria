#!/usr/bin/env node
// dispatch-canon.mjs — acer-side outbound canon dispatcher.
//
// Symmetric counterpart to liris's `dispatch-preamble-to-acer.mjs`. Reads a
// FIRST_MESSAGE_CANON payload from disk, validates structure via the C17
// validator, signs it with the dev-acer-4abb0a9c key, and POSTs a fully-shaped
// envelope to the target peer's behcs bus.
//
// CLI
//   node dispatch-canon.mjs --target <peer>
//                            [--canon-file <path>]
//                            [--bus-url <http://host:port/behcs/send>]
//                            [--canon-version <string>]
//                            [--unsigned]
//                            [--dry-run]
//                            [--no-validate]
//
// DEFAULTS
//   --canon-file : C:\Users\acer\Asolaria\data\canon\OPERATOR-FIRST-MESSAGE-acer.txt
//                  (errors if missing — explicit-or-fail per task spec)
//   --bus-url    : http://192.168.100.2:4947/behcs/send  for --target liris
//                  http://127.0.0.1:4947/behcs/send       for --target acer
//                  (otherwise required)
//
// ENVELOPE SHAPE (mirrors liris's dispatcher)
//   {
//     id, ts, from:"acer", to:"<target>", mode:"real",
//     type:"FIRST_MESSAGE_CANON",
//     verb:"EVT-PRIME-INFRA-PRELOAD-REASSERT",
//     canon_version, payload_sha256, payload, cube,
//     body: { signed_envelope: { payload:<inner>, signature:{...} } }
//   }
// The inner signed-payload is a routing+sha subset to keep verification
// cheap and stable. With --unsigned, body is omitted.
//
// EXIT CODES
//   0 — dispatch succeeded (or --dry-run completed cleanly)
//   1 — validation failed, signer required but unavailable, or HTTP non-2xx
//   2 — argument error / canon file missing
//
// NB. Per memory feedback_orbital_routing_liris_to_falcon.md, liris does not
// yet run an inbound bus receiver. A POST to liris is therefore expected to
// fail at the network layer until L3; that's by design — the script still
// reports the failure cleanly.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { validateCanon } from "./canon-validate.mjs";
import {
  ACER_KEY_ID,
  loadAcerSigner,
  signPayload,
} from "./acer-signer.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const DEFAULT_CANON_FILE = path.join(
  ROOT,
  "data",
  "canon",
  "OPERATOR-FIRST-MESSAGE-acer.txt"
);

const TARGET_BUS_DEFAULTS = {
  liris: "http://192.168.100.2:4947/behcs/send",
  acer: "http://127.0.0.1:4947/behcs/send",
};

const SEND_TIMEOUT_MS = 5000;

// ───────────────────────── arg parsing ─────────────────────────
function parseArgs(argv) {
  const out = {
    target: null,
    canonFile: null,
    busUrl: null,
    canonVersion: null,
    unsigned: false,
    dryRun: false,
    skipValidate: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      const v = argv[i + 1];
      if (v == null || v.startsWith("--")) {
        die(2, `flag ${a} requires a value`);
      }
      i += 1;
      return v;
    };
    switch (a) {
      case "--target":
        out.target = next();
        break;
      case "--canon-file":
        out.canonFile = next();
        break;
      case "--bus-url":
        out.busUrl = next();
        break;
      case "--canon-version":
        out.canonVersion = next();
        break;
      case "--unsigned":
        out.unsigned = true;
        break;
      case "--dry-run":
        out.dryRun = true;
        break;
      case "--no-validate":
        out.skipValidate = true;
        break;
      case "-h":
      case "--help":
        out.help = true;
        break;
      default:
        die(2, `unknown flag: ${a}`);
    }
  }
  return out;
}

function printUsage() {
  process.stderr.write(
    [
      "usage: node dispatch-canon.mjs --target <peer>",
      "                                [--canon-file <path>]",
      "                                [--bus-url <url>]",
      "                                [--canon-version <string>]",
      "                                [--unsigned]",
      "                                [--dry-run]",
      "                                [--no-validate]",
      "",
      "default canon-file : " + DEFAULT_CANON_FILE,
      "default bus-url    : liris -> " + TARGET_BUS_DEFAULTS.liris,
      "                     acer  -> " + TARGET_BUS_DEFAULTS.acer,
      "",
    ].join("\n")
  );
}

function die(code, msg) {
  process.stderr.write(`dispatch-canon: ${msg}\n`);
  if (code === 2) printUsage();
  process.exit(code);
}

// ───────────────────────── core ─────────────────────────
function sha256Hex(s) {
  return crypto.createHash("sha256").update(s, "utf8").digest("hex");
}

function nowIso() {
  return new Date().toISOString();
}

function buildEnvelope({
  target,
  payload,
  payloadSha256,
  canonVersion,
  ts,
  signer,
}) {
  // Deterministic id: sha256 over (target + sha + ts) prefix. Same family of
  // ids the canon-load hook already uses, scaled-down to 32 hex chars.
  const id = crypto
    .createHash("sha256")
    .update(`acer\n${target}\n${payloadSha256}\n${ts}`)
    .digest("hex")
    .slice(0, 32);

  const env = {
    id,
    ts,
    from: "acer",
    to: target,
    mode: "real",
    type: "FIRST_MESSAGE_CANON",
    verb: "EVT-PRIME-INFRA-PRELOAD-REASSERT",
    canon_version: canonVersion,
    payload_sha256: payloadSha256,
    payload,
    cube: {
      D1_ACTOR: "acer",
      D3_TARGET: target,
      D7_STATE: "dispatch",
      D20_TIME: ts,
      D26_OMNIDIRECTIONAL: "bilateral",
      D34_CROSS_COLONY: "cross_host_lan",
      D38_ENCRYPTION: "plaintext",
    },
  };

  if (signer) {
    // Inner signed payload is a lean routing+sha subset, mirroring the ack
    // shape used by canon-load-on-session-start.mjs so verifiers on either
    // side need not learn a new layout.
    const signedPayload = {
      id,
      ts,
      from: "acer",
      to: target,
      type: "FIRST_MESSAGE_CANON",
      verb: "EVT-PRIME-INFRA-PRELOAD-REASSERT",
      canon_version: canonVersion,
      payload_sha256: payloadSha256,
    };
    env.body = { signed_envelope: signPayload(signer, signedPayload) };
    env.sig_owner = ACER_KEY_ID;
  }

  return env;
}

async function postEnvelope(busUrl, envelope) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), SEND_TIMEOUT_MS);
  try {
    const res = await fetch(busUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(envelope),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    const text = await res.text();
    let body = null;
    try {
      body = JSON.parse(text);
    } catch {
      // not all errors are JSON
    }
    return { ok: res.ok, status: res.status, body, raw: text };
  } catch (e) {
    clearTimeout(timer);
    if (e.name === "AbortError")
      return { ok: false, status: 0, body: null, raw: "", error: "timeout" };
    return {
      ok: false,
      status: 0,
      body: null,
      raw: "",
      error: e.message || String(e),
    };
  }
}

// ───────────────────────── main ─────────────────────────
(async () => {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    process.exit(0);
  }
  if (!args.target) die(2, "--target is required");

  const canonFile = args.canonFile || DEFAULT_CANON_FILE;
  if (!fs.existsSync(canonFile)) {
    die(2, `canon-file not found: ${canonFile}`);
  }

  let payload;
  try {
    payload = fs.readFileSync(canonFile, "utf8");
  } catch (e) {
    die(2, `canon-file read failed: ${e.message || e}`);
  }
  if (!payload || payload.length === 0) {
    die(2, `canon-file is empty: ${canonFile}`);
  }

  // C17 structural validation — gate the dispatch.
  let validation = { ok: true, version: null, errors: [], warnings: [] };
  if (!args.skipValidate) {
    validation = validateCanon(payload);
    if (!validation.ok) {
      process.stderr.write(
        `dispatch-canon: canon validation FAILED — refusing to dispatch\n`
      );
      process.stderr.write(
        JSON.stringify({ ok: false, errors: validation.errors }, null, 2) + "\n"
      );
      process.exit(1);
    }
  }

  const canonVersion =
    args.canonVersion ||
    validation.version ||
    "unknown";

  const payloadSha256 = sha256Hex(payload);
  const ts = nowIso();

  // Signer — required unless --unsigned.
  let signer = null;
  if (!args.unsigned) {
    signer = loadAcerSigner((...parts) => {
      process.stderr.write(`dispatch-canon: signer ${parts.join(" ")}\n`);
    });
    if (!signer) {
      die(
        1,
        `signer unavailable for ${ACER_KEY_ID} (key/registry mismatch); pass --unsigned to skip`
      );
    }
  }

  const envelope = buildEnvelope({
    target: args.target,
    payload,
    payloadSha256,
    canonVersion,
    ts,
    signer,
  });

  const busUrl =
    args.busUrl ||
    TARGET_BUS_DEFAULTS[args.target] ||
    null;
  if (!busUrl) {
    die(
      2,
      `--bus-url required for unknown target "${args.target}" (no default mapping)`
    );
  }

  // Dispatch summary — printed always, before any network call.
  const summary = {
    ok: true,
    dry_run: args.dryRun,
    target: args.target,
    bus_url: busUrl,
    canon_file: canonFile,
    canon_version: canonVersion,
    payload_bytes: payload.length,
    payload_sha256: payloadSha256,
    payload_sha256_8: payloadSha256.slice(0, 8),
    envelope_id: envelope.id,
    signed: Boolean(signer),
    sig_key_id: signer ? ACER_KEY_ID : null,
    validation: {
      checked: !args.skipValidate,
      ok: validation.ok,
      version: validation.version,
      warnings: validation.warnings,
    },
    cube: envelope.cube,
  };

  if (args.dryRun) {
    summary.dispatched = false;
    summary.note = "dry-run; envelope built and signed but NOT posted";
    process.stdout.write(JSON.stringify(summary, null, 2) + "\n");
    process.exit(0);
  }

  const sendRes = await postEnvelope(busUrl, envelope);
  summary.dispatched = sendRes.ok;
  summary.http_status = sendRes.status;
  summary.bus_response = sendRes.body || sendRes.raw.slice(0, 200);
  if (!sendRes.ok) {
    summary.ok = false;
    summary.error = sendRes.error || `http_${sendRes.status}`;
  }

  process.stdout.write(JSON.stringify(summary, null, 2) + "\n");
  process.exit(summary.ok ? 0 : 1);
})().catch((e) => {
  process.stderr.write(
    `dispatch-canon: crashed ${e.message || String(e)}\n${e.stack || ""}\n`
  );
  process.exit(1);
});
