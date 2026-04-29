#!/usr/bin/env node
// peer-handshake.mjs — bilateral peer first-contact handshake (acer-side)
//
// Three subcommands:
//   initiate --peer <name> --peer-bus-url <url>
//     Build & POST a HANDSHAKE_HELLO envelope to the peer's bus.
//   respond --peer <name>
//     Drain pending HANDSHAKE_HELLO envelopes from inbox.ndjson where
//     from=<peer> & to=acer, reply with HANDSHAKE_ACK to peer's bus_url
//     (read from envelope.payload.peer_bus_url, optional).
//   status [--peer <name>]
//     Print recorded handshake state from
//     data/behcs/state/peer-handshakes.json.
//
// Envelope shape (matches the canon-load-on-session-start pattern so the
// existing bus accepts it without schema-ingress complaints):
//   {
//     id, ts, from, to, mode: "real",
//     type: "HANDSHAKE_HELLO" | "HANDSHAKE_ACK",
//     verb: "EVT-PEER-HANDSHAKE",
//     payload: {
//       peer_name, sig_key_id, bus_version,
//       current_canon_version, current_canon_sha256_8, ts,
//       peer_bus_url? (initiate only — lets responder reach back),
//       accepted? (ACK only),
//       in_reply_to? (ACK only — id of the HELLO),
//       notes? (ACK only)
//     },
//     body: { signed_envelope: { payload, signature: {...} } }
//   }
//
// Signing reuses the dev-acer-4abb0a9c pattern from
// canon-load-on-session-start.mjs (raw seed → PKCS8 DER → ed25519 KeyObject,
// pubkey verified against C:\asolaria-acer\kernel\ed25519-registry.json).
//
// Persistence: data/behcs/state/peer-handshakes.json
//   {
//     "peers": {
//       "<peer_name>": {
//         last_handshake_at, peer_sig_key_id, peer_bus_version,
//         peer_canon_version, peer_canon_sha256_8?,
//         direction: "initiated" | "responded",
//         last_envelope_id, accepted?, notes?
//       }
//     }
//   }

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const INBOX = path.join(ROOT, "data", "behcs", "inbox.ndjson");
const OUTBOX = path.join(ROOT, "data", "behcs", "outbox.ndjson");
const STATE_DIR = path.join(ROOT, "data", "behcs", "state");
const HANDSHAKE_STATE = path.join(STATE_DIR, "peer-handshakes.json");
const CANON_CURSOR = path.join(STATE_DIR, "canon-cursor.json");
const AUDIT_LOG = path.join(ROOT, "logs", "peer-handshake.log");

// Local identity. bus_version pins the protocol shape this code emits and
// expects in return — bump if the envelope shape changes incompatibly.
const SELF_NAME = "acer";
const BUS_VERSION = "behcs-bus/1.0";
const ACER_KEY_ID = "dev-acer-4abb0a9c";
const ACER_KEY_CANDIDATES = [
  path.join(ROOT, "data", "vault", "owner", "ed25519", `${ACER_KEY_ID}.private.b64`),
  `C:\\asolaria-acer\\kernel\\ed25519-keys\\${ACER_KEY_ID}.private.b64`,
  `C:\\asolaria-acer\\kernel\\${ACER_KEY_ID}.private.b64`,
  `C:\\asolaria-acer\\kernel\\${ACER_KEY_ID}.pem`,
];
const REGISTRY_PATH = "C:\\asolaria-acer\\kernel\\ed25519-registry.json";

const SEND_TIMEOUT_MS = 2500;
const SCAN_TAIL_LINES = 500;

// PKCS8 DER prefix for a raw 32-byte ed25519 seed → 48 bytes total.
const ED25519_PKCS8_PREFIX = Buffer.from(
  "302e020100300506032b657004220420",
  "hex"
);

function audit(...parts) {
  try {
    fs.mkdirSync(path.dirname(AUDIT_LOG), { recursive: true });
    fs.appendFileSync(
      AUDIT_LOG,
      `[${new Date().toISOString()}] ${parts.join(" ")}\n`,
      "utf8"
    );
  } catch (e) {
    process.stderr.write(`peer-handshake: audit_failed ${e.message}\n`);
  }
}

function loadAcerSigner() {
  let seed = null;
  let source = null;
  let asPem = false;
  for (const p of ACER_KEY_CANDIDATES) {
    if (!fs.existsSync(p)) continue;
    try {
      const raw = fs.readFileSync(p, "utf8").trim();
      if (raw.startsWith("-----BEGIN")) {
        seed = raw;
        source = p;
        asPem = true;
        break;
      }
      const seedBytes = Buffer.from(raw, "base64");
      if (seedBytes.length !== 32) continue;
      seed = seedBytes;
      source = p;
      break;
    } catch {
      continue;
    }
  }
  if (!seed) return null;

  let keyObject;
  let pubKeyB64;
  try {
    if (asPem) {
      keyObject = crypto.createPrivateKey({ key: seed, format: "pem" });
    } else {
      const pkcs8 = Buffer.concat([ED25519_PKCS8_PREFIX, seed]);
      keyObject = crypto.createPrivateKey({
        key: pkcs8,
        format: "der",
        type: "pkcs8",
      });
    }
    const pub = crypto.createPublicKey(keyObject);
    const spki = pub.export({ format: "der", type: "spki" });
    pubKeyB64 = spki.subarray(spki.length - 32).toString("base64");
  } catch (e) {
    audit("signer_load_exception", `source=${source}`, `err=${e.message || e}`);
    return null;
  }

  try {
    const reg = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
    const entry = (reg.keys || []).find((k) => k.key_id === ACER_KEY_ID);
    if (!entry) {
      audit("signer_no_registry_entry", `key_id=${ACER_KEY_ID}`);
      return null;
    }
    if (entry.public_key_b64 !== pubKeyB64) {
      audit(
        "signer_pubkey_mismatch",
        `derived=${pubKeyB64.slice(0, 12)}`,
        `registry=${entry.public_key_b64.slice(0, 12)}`
      );
      return null;
    }
  } catch (e) {
    audit("signer_registry_read_failed", `err=${e.message || e}`);
    return null;
  }

  return { keyObject, pubKeyB64, source };
}

function signPayload(signer, payloadObject) {
  const bytes = Buffer.from(JSON.stringify(payloadObject), "utf8");
  const sig = crypto.sign(null, bytes, signer.keyObject);
  return {
    payload: payloadObject,
    signature: {
      key_id: ACER_KEY_ID,
      sig_b64: sig.toString("base64"),
      alg: "ed25519",
      signed_at: new Date().toISOString(),
    },
  };
}

// Read current local canon version + sha8 from the canon cursor. Both
// optional — falls back to "unknown" so a peer that hasn't ingested a canon
// yet still completes the handshake.
function readLocalCanon() {
  try {
    const c = JSON.parse(fs.readFileSync(CANON_CURSOR, "utf8"));
    const version = c.last_canon_version || "unknown";
    let sha8 = null;
    if (Array.isArray(c.sessions) && c.sessions.length > 0) {
      const last = c.sessions[c.sessions.length - 1];
      sha8 = last.payload_sha256_8 || null;
    }
    return { version, sha8 };
  } catch {
    return { version: "unknown", sha8: null };
  }
}

function readHandshakeState() {
  try {
    return JSON.parse(fs.readFileSync(HANDSHAKE_STATE, "utf8"));
  } catch {
    return { peers: {} };
  }
}

function writeHandshakeState(state) {
  fs.mkdirSync(path.dirname(HANDSHAKE_STATE), { recursive: true });
  fs.writeFileSync(
    HANDSHAKE_STATE,
    JSON.stringify(state, null, 2) + "\n",
    "utf8"
  );
}

function appendOutbox(envelope) {
  try {
    fs.mkdirSync(path.dirname(OUTBOX), { recursive: true });
    fs.appendFileSync(OUTBOX, JSON.stringify(envelope) + "\n", "utf8");
  } catch (e) {
    process.stderr.write(`peer-handshake: outbox_write_failed ${e.message}\n`);
  }
}

function tailLines(filePath, maxLines) {
  if (!fs.existsSync(filePath)) return [];
  const data = fs.readFileSync(filePath, "utf8");
  const lines = data.split(/\r?\n/).filter((l) => l.trim());
  return lines.slice(-maxLines);
}

function parseSafe(line) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

function buildHelloPayload(peerName, peerBusUrl) {
  const ts = new Date().toISOString();
  const canon = readLocalCanon();
  return {
    peer_name: SELF_NAME,
    sig_key_id: ACER_KEY_ID,
    bus_version: BUS_VERSION,
    current_canon_version: canon.version,
    current_canon_sha256_8: canon.sha8,
    peer_bus_url: peerBusUrl || null,
    target_peer_name: peerName,
    ts,
  };
}

function buildAckPayload(peerName, accepted, notes, inReplyTo) {
  const ts = new Date().toISOString();
  const canon = readLocalCanon();
  return {
    peer_name: SELF_NAME,
    sig_key_id: ACER_KEY_ID,
    bus_version: BUS_VERSION,
    current_canon_version: canon.version,
    current_canon_sha256_8: canon.sha8,
    target_peer_name: peerName,
    accepted: !!accepted,
    notes: notes || "",
    in_reply_to: inReplyTo || null,
    ts,
  };
}

function buildEnvelope({ type, peerName, payload, signer }) {
  const ts = new Date().toISOString();
  const id = crypto.randomBytes(16).toString("hex");
  const env = {
    id,
    ts,
    from: SELF_NAME,
    to: peerName,
    mode: "real",
    type,
    verb: "EVT-PEER-HANDSHAKE",
    payload,
    cube: {
      D1_ACTOR: SELF_NAME,
      D3_TARGET: peerName,
      D7_STATE: type === "HANDSHAKE_HELLO" ? "initiated" : "completed",
      D20_TIME: ts,
      D26_OMNIDIRECTIONAL: "bilateral",
      D34_CROSS_COLONY: "cross_host_lan",
      D38_ENCRYPTION: "plaintext",
    },
  };
  if (signer) {
    const signedSubset = {
      id,
      ts,
      from: SELF_NAME,
      to: peerName,
      type,
      verb: "EVT-PEER-HANDSHAKE",
      ...payload,
    };
    env.body = { signed_envelope: signPayload(signer, signedSubset) };
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
    const body = await res.text().catch(() => "");
    return { ok: res.ok, status: res.status, body: body.slice(0, 200) };
  } catch (e) {
    clearTimeout(timer);
    if (e.name === "AbortError") return { ok: false, status: 0, body: "timeout" };
    return { ok: false, status: 0, body: (e.message || String(e)).slice(0, 200) };
  }
}

function recordHandshake(peerName, peerPayload, direction, envelopeId, extra) {
  const state = readHandshakeState();
  state.peers = state.peers || {};
  state.peers[peerName] = {
    last_handshake_at: new Date().toISOString(),
    peer_sig_key_id: peerPayload?.sig_key_id || null,
    peer_bus_version: peerPayload?.bus_version || null,
    peer_canon_version: peerPayload?.current_canon_version || null,
    peer_canon_sha256_8: peerPayload?.current_canon_sha256_8 || null,
    direction,
    last_envelope_id: envelopeId,
    ...(extra || {}),
  };
  writeHandshakeState(state);
}

// --- subcommands -----------------------------------------------------------

async function cmdInitiate(args) {
  const peer = args["--peer"];
  const peerBusUrl = args["--peer-bus-url"];
  if (!peer || !peerBusUrl) {
    process.stderr.write(
      "usage: initiate --peer <name> --peer-bus-url <url>\n"
    );
    process.exit(2);
  }
  const signer = loadAcerSigner();
  if (!signer) {
    audit("initiate_unsigned", `peer=${peer}`);
    process.stderr.write(
      "peer-handshake: warning — signer unavailable, sending UNSIGNED HELLO\n"
    );
  }
  const payload = buildHelloPayload(peer, peerBusUrl);
  const envelope = buildEnvelope({
    type: "HANDSHAKE_HELLO",
    peerName: peer,
    payload,
    signer,
  });
  appendOutbox(envelope);
  const result = await postEnvelope(peerBusUrl, envelope);
  audit(
    "initiate",
    `peer=${peer}`,
    `bus_url=${peerBusUrl}`,
    `envelope_id=${envelope.id}`,
    `signed=${signer ? "true" : "false"}`,
    `dispatch_ok=${result.ok}`,
    `status=${result.status}`,
    `body=${result.body}`
  );
  // Record an "initiated" stub even on dispatch failure — operator wants
  // a record that the path was exercised and which envelope id was minted.
  recordHandshake(peer, null, "initiated", envelope.id, {
    initiate_dispatch_ok: result.ok,
    initiate_dispatch_status: result.status,
    initiate_dispatch_detail: result.body,
    initiate_target_url: peerBusUrl,
    awaiting_ack: true,
  });
  process.stdout.write(
    JSON.stringify(
      {
        action: "initiate",
        peer,
        envelope_id: envelope.id,
        signed: !!signer,
        dispatch_ok: result.ok,
        dispatch_status: result.status,
        dispatch_detail: result.body,
      },
      null,
      2
    ) + "\n"
  );
}

async function cmdRespond(args) {
  const peer = args["--peer"];
  if (!peer) {
    process.stderr.write("usage: respond --peer <name>\n");
    process.exit(2);
  }
  const lines = tailLines(INBOX, SCAN_TAIL_LINES);
  // Find newest unprocessed HANDSHAKE_HELLO from <peer> to acer.
  let hello = null;
  for (let i = lines.length - 1; i >= 0; i--) {
    const row = parseSafe(lines[i]);
    if (!row) continue;
    if (row.type !== "HANDSHAKE_HELLO") continue;
    if (row.from !== peer) continue;
    if (row.to !== SELF_NAME) continue;
    hello = row;
    break;
  }
  if (!hello) {
    audit("respond_no_hello", `peer=${peer}`);
    process.stdout.write(
      JSON.stringify(
        { action: "respond", peer, found: false, reason: "no_hello_in_inbox" },
        null,
        2
      ) + "\n"
    );
    process.exit(0);
  }

  const peerPayload =
    hello?.body?.signed_envelope?.payload || hello?.payload || {};
  const sigVerdict = hello?._sig_check?.verdict || "UNSIGNED";

  // Acceptance policy: accept VERIFIED or UNSIGNED. Reject REJECTED.
  let accepted = sigVerdict !== "REJECTED";
  let notes = `sig_verdict=${sigVerdict}; bus_version_match=${peerPayload.bus_version === BUS_VERSION}`;
  if (peerPayload.bus_version && peerPayload.bus_version !== BUS_VERSION) {
    notes += `; warning_bus_version_skew=${peerPayload.bus_version}_vs_${BUS_VERSION}`;
  }

  const peerBusUrl =
    peerPayload.peer_bus_url || hello?.payload?.peer_bus_url || null;

  const signer = loadAcerSigner();
  const ackPayload = buildAckPayload(peer, accepted, notes, hello.id);
  const ackEnv = buildEnvelope({
    type: "HANDSHAKE_ACK",
    peerName: peer,
    payload: ackPayload,
    signer,
  });
  appendOutbox(ackEnv);

  let dispatch = { ok: false, status: 0, body: "no_peer_bus_url" };
  if (peerBusUrl) {
    dispatch = await postEnvelope(peerBusUrl, ackEnv);
  }

  recordHandshake(peer, peerPayload, "responded", ackEnv.id, {
    accepted,
    notes,
    in_reply_to: hello.id,
    peer_sig_verdict: sigVerdict,
    ack_dispatch_ok: dispatch.ok,
    ack_dispatch_status: dispatch.status,
    ack_dispatch_detail: dispatch.body,
  });

  audit(
    "respond",
    `peer=${peer}`,
    `hello_id=${hello.id}`,
    `ack_id=${ackEnv.id}`,
    `accepted=${accepted}`,
    `verdict=${sigVerdict}`,
    `dispatch_ok=${dispatch.ok}`,
    `dispatch_status=${dispatch.status}`
  );

  process.stdout.write(
    JSON.stringify(
      {
        action: "respond",
        peer,
        hello_id: hello.id,
        ack_id: ackEnv.id,
        accepted,
        peer_sig_verdict: sigVerdict,
        notes,
        dispatch_ok: dispatch.ok,
        dispatch_status: dispatch.status,
        dispatch_detail: dispatch.body,
      },
      null,
      2
    ) + "\n"
  );
}

function cmdStatus(args) {
  const peer = args["--peer"];
  const state = readHandshakeState();
  if (peer) {
    const entry = state.peers?.[peer] || null;
    process.stdout.write(
      JSON.stringify({ peer, entry: entry || "<none>" }, null, 2) + "\n"
    );
    return;
  }
  process.stdout.write(JSON.stringify(state, null, 2) + "\n");
}

// --- arg parsing -----------------------------------------------------------

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) {
        args[a] = true;
      } else {
        args[a] = next;
        i++;
      }
    }
  }
  return args;
}

const sub = process.argv[2];
const rest = process.argv.slice(3);
const args = parseArgs(rest);

(async () => {
  try {
    switch (sub) {
      case "initiate":
        await cmdInitiate(args);
        break;
      case "respond":
        await cmdRespond(args);
        break;
      case "status":
        cmdStatus(args);
        break;
      default:
        process.stderr.write(
          "peer-handshake.mjs <initiate|respond|status> [args]\n" +
            "  initiate --peer <name> --peer-bus-url <url>\n" +
            "  respond  --peer <name>\n" +
            "  status   [--peer <name>]\n"
        );
        process.exit(2);
    }
  } catch (e) {
    audit("crashed", e.message || String(e));
    process.stderr.write(`peer-handshake: crashed ${e.message || e}\n`);
    process.exit(1);
  }
})();
