#!/usr/bin/env node
// registry-mirror-sync.mjs
//
// ed25519-registry mirror tool. Keeps the canonical key registry on acer
// (C:/asolaria-acer/kernel/ed25519-registry.json) and the peer-side mirror
// (e.g. liris) aligned without manual intervention. Drift = silent
// verification failures: a key is added on acer, peer rejects acer's
// envelopes because the new key_id is not in their copy.
//
// Two CLI verbs:
//
//   publish [--target <peer>]
//     Read local registry, package as a signed envelope
//     (type=REGISTRY_MIRROR verb=EVT-REGISTRY-PUBLISH), append to outbox,
//     POST to acer's bus addressed to <target> (default liris). Peer polls
//     /behcs/inbox and runs `apply` on their side.
//
//   apply --envelope-id <id>
//     Fetch the named REGISTRY_MIRROR envelope from local inbox, validate
//     its ed25519 signature, then MERGE additively into the local registry:
//       - never delete a key that is local but not in peer's set
//       - never overwrite a local key whose rotated_at is newer than peer's
//       - add unknown keys from peer
//       - if peer reports a newer rotated_at for an existing key, accept
//         the rotation (forward-only)
//
// Signed with dev-acer-4abb0a9c. Audit log at logs/registry-sync.ndjson.
//
// Strict additive / forward-only merge. Never destructive.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

// ---- Paths --------------------------------------------------------------

const REGISTRY_PATH =
  process.env.ED25519_REGISTRY ||
  "C:/asolaria-acer/kernel/ed25519-registry.json";

const INBOX = path.join(ROOT, "data", "behcs", "inbox.ndjson");
const OUTBOX = path.join(ROOT, "data", "behcs", "outbox.ndjson");
const AUDIT_LOG = path.join(ROOT, "logs", "registry-sync.ndjson");

const ACER_BUS_URL = "http://127.0.0.1:4947/behcs/send";
const POST_TIMEOUT_MS = 5000;

// ---- Signing constants (mirrors canon-load-on-session-start.mjs) --------

const ACER_KEY_ID = "dev-acer-4abb0a9c";
const ACER_KEY_CANDIDATES = [
  path.join(ROOT, "data", "vault", "owner", "ed25519", `${ACER_KEY_ID}.private.b64`),
  `C:\\asolaria-acer\\kernel\\ed25519-keys\\${ACER_KEY_ID}.private.b64`,
  `C:\\asolaria-acer\\kernel\\${ACER_KEY_ID}.private.b64`,
  `C:\\asolaria-acer\\kernel\\${ACER_KEY_ID}.pem`,
];

// PKCS8 DER prefix for raw 32-byte ed25519 seed.
const ED25519_PKCS8_PREFIX = Buffer.from(
  "302e020100300506032b657004220420",
  "hex"
);

// SPKI prefix for raw 32-byte ed25519 pubkey (used to verify peer envelopes).
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

// ---- Audit log ----------------------------------------------------------

function audit(entry) {
  try {
    fs.mkdirSync(path.dirname(AUDIT_LOG), { recursive: true });
    fs.appendFileSync(
      AUDIT_LOG,
      JSON.stringify({ ts: new Date().toISOString(), ...entry }) + "\n",
      "utf8"
    );
  } catch (e) {
    process.stderr.write(`registry-mirror-sync: audit_failed ${e.message}\n`);
  }
}

// ---- Registry I/O -------------------------------------------------------

function readRegistry() {
  const raw = fs.readFileSync(REGISTRY_PATH, "utf8");
  const reg = JSON.parse(raw);
  if (!reg || !Array.isArray(reg.keys)) {
    throw new Error(
      `registry malformed: missing 'keys' array at ${REGISTRY_PATH}`
    );
  }
  return reg;
}

function writeRegistry(reg) {
  const out = JSON.stringify(reg, null, 2) + "\n";
  fs.writeFileSync(REGISTRY_PATH, out, "utf8");
}

// ---- Signer -------------------------------------------------------------

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
    audit({ event: "signer_load_exception", source, err: e.message });
    return null;
  }

  // Verify pubkey matches registry entry.
  try {
    const reg = readRegistry();
    const entry = (reg.keys || []).find((k) => k.key_id === ACER_KEY_ID);
    if (!entry) {
      audit({ event: "signer_no_registry_entry", key_id: ACER_KEY_ID });
      return null;
    }
    if (entry.public_key_b64 !== pubKeyB64) {
      audit({
        event: "signer_pubkey_mismatch",
        derived: pubKeyB64.slice(0, 12),
        registry: entry.public_key_b64.slice(0, 12),
      });
      return null;
    }
  } catch (e) {
    audit({ event: "signer_registry_read_failed", err: e.message });
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

function rawPubKeyToKeyObject(b64) {
  const raw = Buffer.from(b64, "base64");
  const der = Buffer.concat([ED25519_SPKI_PREFIX, raw]);
  return crypto.createPublicKey({ key: der, format: "der", type: "spki" });
}

// ---- Envelope helpers ---------------------------------------------------

function buildPublishEnvelope({ target, signer, registrySnapshot }) {
  const ts = new Date().toISOString();

  // Inner signed payload — keep lean and stable so peer can re-verify cheaply.
  const innerPayload = {
    type: "REGISTRY_MIRROR",
    verb: "EVT-REGISTRY-PUBLISH",
    from: "acer",
    to: target,
    registry_version: registrySnapshot.version || null,
    registry_updated_at: registrySnapshot.updated_at || null,
    keys: registrySnapshot.keys, // additive set; merge logic enforces non-destructive
    notes: registrySnapshot.notes || null,
    ts,
  };

  const signed = signer ? signPayload(signer, innerPayload) : null;

  // Deterministic id over (target + registry_updated_at + ts) to dedupe
  // re-publishes that share the same source registry timestamp.
  const id = crypto
    .createHash("sha256")
    .update(`${target}\n${registrySnapshot.updated_at || ""}\n${ts}`)
    .digest("hex")
    .slice(0, 32);

  const env = {
    id,
    ts,
    from: "acer",
    to: target,
    mode: "real",
    type: "REGISTRY_MIRROR",
    verb: "EVT-REGISTRY-PUBLISH",
    payload: {
      registry_version: innerPayload.registry_version,
      registry_updated_at: innerPayload.registry_updated_at,
      key_count: registrySnapshot.keys.length,
      key_ids: registrySnapshot.keys.map((k) => k.key_id),
    },
    cube: {
      D1_ACTOR: "acer",
      D3_TARGET: target,
      D7_STATE: "executing",
      D20_TIME: ts,
      D26_OMNIDIRECTIONAL: "bilateral",
      D34_CROSS_COLONY: "cross_host_lan",
      D38_ENCRYPTION: "plaintext",
    },
  };

  if (signed) {
    env.body = { signed_envelope: signed };
    env.sig_owner = ACER_KEY_ID;
  }

  return env;
}

async function postEnvelope(env) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), POST_TIMEOUT_MS);
  try {
    const res = await fetch(ACER_BUS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(env),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    const text = await res.text().catch(() => "");
    return {
      ok: res.ok,
      status: res.status,
      body: text.slice(0, 400),
    };
  } catch (e) {
    clearTimeout(timer);
    return {
      ok: false,
      status: 0,
      error: e.name === "AbortError" ? "timeout" : e.message || String(e),
    };
  }
}

function appendOutbox(envelope) {
  fs.mkdirSync(path.dirname(OUTBOX), { recursive: true });
  fs.appendFileSync(OUTBOX, JSON.stringify(envelope) + "\n", "utf8");
}

// ---- Inbox lookup (apply path) -----------------------------------------

function findInboxEnvelope(envelopeId) {
  if (!fs.existsSync(INBOX)) return null;
  const data = fs.readFileSync(INBOX, "utf8");
  const lines = data.split(/\r?\n/).filter((l) => l.trim());
  // Walk newest-first.
  for (let i = lines.length - 1; i >= 0; i--) {
    let row;
    try {
      row = JSON.parse(lines[i]);
    } catch {
      continue;
    }
    if (!row || row.id !== envelopeId) continue;
    if (row.type !== "REGISTRY_MIRROR") continue;
    return row;
  }
  return null;
}

function extractSignedEnvelope(env) {
  // Mirrors behcs-bus.verifyIngressEnvelope acceptance shapes.
  if (env && env.signature && env.payload) return env;
  if (env && env.body && typeof env.body === "object") {
    for (const k of Object.keys(env.body)) {
      const v = env.body[k];
      if (v && typeof v === "object" && v.signature && v.payload) return v;
    }
  }
  return null;
}

function verifySignedEnvelope(signed, registry) {
  const sig = signed.signature;
  if (!sig || !sig.key_id || !sig.sig_b64) {
    return { ok: false, reason: "missing_sig_fields" };
  }
  if (sig.alg && sig.alg !== "ed25519") {
    return { ok: false, reason: "wrong_alg" };
  }
  const entry = (registry.keys || []).find((k) => k.key_id === sig.key_id);
  if (!entry) return { ok: false, reason: "key_not_in_local_registry", key_id: sig.key_id };
  if (entry.rotated_at) return { ok: false, reason: "key_rotated_out", key_id: sig.key_id };
  try {
    const pub = rawPubKeyToKeyObject(entry.public_key_b64);
    const ok = crypto.verify(
      null,
      Buffer.from(JSON.stringify(signed.payload), "utf8"),
      pub,
      Buffer.from(sig.sig_b64, "base64")
    );
    if (!ok) return { ok: false, reason: "signature_mismatch", key_id: sig.key_id };
    return { ok: true, key_id: sig.key_id, owner_glyph: entry.owner_glyph };
  } catch (e) {
    return { ok: false, reason: "verify_exception:" + (e.message || String(e)) };
  }
}

// ---- Merge (additive / forward-only) ------------------------------------

function isNewer(aIso, bIso) {
  // Returns true iff aIso is strictly newer than bIso. Null/undefined values
  // are treated as "no rotation" = oldest. Unparseable timestamps lose.
  const aT = aIso ? Date.parse(aIso) : 0;
  const bT = bIso ? Date.parse(bIso) : 0;
  if (Number.isNaN(aT)) return false;
  if (Number.isNaN(bT)) return true;
  return aT > bT;
}

function mergeRegistry(local, peerKeys) {
  const localByKeyId = new Map(local.keys.map((k) => [k.key_id, k]));
  const summary = {
    added: [],
    rotation_forward: [],
    skipped_older_rotation: [],
    skipped_pubkey_conflict: [],
    skipped_unchanged: [],
  };

  for (const peerKey of peerKeys) {
    if (!peerKey || typeof peerKey.key_id !== "string") continue;
    const localKey = localByKeyId.get(peerKey.key_id);

    if (!localKey) {
      // Net-new key from peer — additive.
      local.keys.push({ ...peerKey });
      localByKeyId.set(peerKey.key_id, peerKey);
      summary.added.push(peerKey.key_id);
      continue;
    }

    // Existing key — never overwrite blindly. Pubkey must match.
    if (peerKey.public_key_b64 && peerKey.public_key_b64 !== localKey.public_key_b64) {
      summary.skipped_pubkey_conflict.push(peerKey.key_id);
      continue;
    }

    // Forward-only rotation: only update rotated_at if peer's is strictly newer.
    if (peerKey.rotated_at && isNewer(peerKey.rotated_at, localKey.rotated_at)) {
      localKey.rotated_at = peerKey.rotated_at;
      summary.rotation_forward.push(peerKey.key_id);
      continue;
    }

    // Peer's rotated_at is older or absent and pubkey matches — nothing to do.
    if (peerKey.rotated_at && !isNewer(peerKey.rotated_at, localKey.rotated_at)) {
      summary.skipped_older_rotation.push(peerKey.key_id);
      continue;
    }

    summary.skipped_unchanged.push(peerKey.key_id);
  }

  // NB: keys present locally but absent from peer are PRESERVED. Strict
  // additive: we never delete.
  return summary;
}

// ---- CLI ----------------------------------------------------------------

function parseArgs(argv) {
  const args = { _verb: argv[0] || null };
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--target") args.target = argv[++i];
    else if (a === "--envelope-id") args.envelopeId = argv[++i];
    else if (a === "--dry-run") args.dryRun = true;
    else if (a === "-h" || a === "--help") {
      printUsage();
      process.exit(0);
    } else {
      console.error(`registry-mirror-sync: unknown arg: ${a}`);
      printUsage();
      process.exit(2);
    }
  }
  return args;
}

function printUsage() {
  console.error(
    [
      "Usage:",
      "  node registry-mirror-sync.mjs publish [--target <peer>] [--dry-run]",
      "  node registry-mirror-sync.mjs apply --envelope-id <id> [--dry-run]",
      "",
      "  publish     package local registry as signed REGISTRY_MIRROR envelope,",
      "              addressed to <peer> (default: liris). Outbox + bus POST.",
      "  apply       merge a peer-published REGISTRY_MIRROR envelope into the",
      "              local registry. Strict additive / forward-only.",
    ].join("\n")
  );
}

// ---- Verb: publish ------------------------------------------------------

async function runPublish(args) {
  const target = args.target || "liris";
  const ts = new Date().toISOString();

  let registry;
  try {
    registry = readRegistry();
  } catch (e) {
    audit({ event: "publish_registry_read_failed", err: e.message });
    console.error(`publish: cannot read registry: ${e.message}`);
    process.exit(1);
  }

  const signer = loadAcerSigner();
  if (!signer) {
    audit({ event: "publish_signer_unavailable", key_id: ACER_KEY_ID });
    console.error(
      "publish: signer unavailable for key " +
        ACER_KEY_ID +
        " — refusing to publish unsigned registry mirror"
    );
    process.exit(1);
  }

  const env = buildPublishEnvelope({
    target,
    signer,
    registrySnapshot: registry,
  });

  if (args.dryRun) {
    console.log(
      JSON.stringify(
        {
          mode: "DRY-RUN",
          envelope_id: env.id,
          target,
          key_count: registry.keys.length,
          key_ids: registry.keys.map((k) => k.key_id),
          registry_updated_at: registry.updated_at,
          signed: true,
          signer_source: signer.source,
          ts,
        },
        null,
        2
      )
    );
    return;
  }

  // Outbox first — durable record even if bus is down.
  appendOutbox(env);

  const post = await postEnvelope(env);

  const receipt = {
    verb: "publish",
    envelope_id: env.id,
    target,
    registry_path: REGISTRY_PATH,
    registry_version: registry.version || null,
    registry_updated_at: registry.updated_at || null,
    key_count: registry.keys.length,
    key_ids: registry.keys.map((k) => k.key_id),
    signed: true,
    signer_key_id: ACER_KEY_ID,
    signer_source: signer.source,
    outbox_path: OUTBOX,
    bus_url: ACER_BUS_URL,
    bus_post_ok: post.ok,
    bus_post_status: post.status,
    bus_post_body: post.body,
    bus_post_error: post.error || null,
    ts,
  };

  audit({ event: "EVT-REGISTRY-PUBLISH", ...receipt });

  console.log(JSON.stringify(receipt, null, 2));

  if (!post.ok) {
    // Outbox is durable — operator can replay with outbox-replay.mjs. Exit 1
    // so callers/CI notice the bus did not accept.
    process.exit(1);
  }
}

// ---- Verb: apply --------------------------------------------------------

async function runApply(args) {
  if (!args.envelopeId) {
    console.error("apply: --envelope-id is required");
    printUsage();
    process.exit(2);
  }

  let registry;
  try {
    registry = readRegistry();
  } catch (e) {
    audit({ event: "apply_registry_read_failed", err: e.message });
    console.error(`apply: cannot read registry: ${e.message}`);
    process.exit(1);
  }

  const env = findInboxEnvelope(args.envelopeId);
  if (!env) {
    audit({ event: "apply_envelope_not_found", envelope_id: args.envelopeId });
    console.error(
      `apply: REGISTRY_MIRROR envelope not found in inbox: ${args.envelopeId}`
    );
    process.exit(1);
  }

  const signed = extractSignedEnvelope(env);
  if (!signed) {
    audit({
      event: "apply_envelope_unsigned",
      envelope_id: args.envelopeId,
    });
    console.error(
      `apply: envelope ${args.envelopeId} carries no signed_envelope; refusing`
    );
    process.exit(1);
  }

  const verify = verifySignedEnvelope(signed, registry);
  if (!verify.ok) {
    audit({
      event: "apply_signature_invalid",
      envelope_id: args.envelopeId,
      reason: verify.reason,
      key_id: verify.key_id || null,
    });
    console.error(
      `apply: signature invalid (${verify.reason}); refusing to merge`
    );
    process.exit(1);
  }

  const peerKeys = Array.isArray(signed.payload && signed.payload.keys)
    ? signed.payload.keys
    : [];
  if (peerKeys.length === 0) {
    audit({
      event: "apply_empty_keys",
      envelope_id: args.envelopeId,
    });
    console.error("apply: signed payload carries no keys[]; nothing to merge");
    process.exit(1);
  }

  // Snapshot pre-merge state so the audit trail captures both sides.
  const beforeKeyIds = registry.keys.map((k) => k.key_id);
  const summary = mergeRegistry(registry, peerKeys);

  const willMutate =
    summary.added.length > 0 || summary.rotation_forward.length > 0;

  if (args.dryRun) {
    console.log(
      JSON.stringify(
        {
          mode: "DRY-RUN",
          envelope_id: args.envelopeId,
          signer_key_id: verify.key_id,
          signer_owner: verify.owner_glyph,
          before_key_count: beforeKeyIds.length,
          peer_key_count: peerKeys.length,
          merge_summary: summary,
          would_mutate: willMutate,
        },
        null,
        2
      )
    );
    return;
  }

  if (willMutate) {
    registry.updated_at = new Date().toISOString();
    writeRegistry(registry);
  }

  const receipt = {
    verb: "apply",
    envelope_id: args.envelopeId,
    signer_key_id: verify.key_id,
    signer_owner: verify.owner_glyph,
    registry_path: REGISTRY_PATH,
    before_key_count: beforeKeyIds.length,
    peer_key_count: peerKeys.length,
    after_key_count: registry.keys.length,
    merge_summary: summary,
    mutated: willMutate,
    ts: new Date().toISOString(),
  };
  audit({ event: "EVT-REGISTRY-APPLY", ...receipt });
  console.log(JSON.stringify(receipt, null, 2));
}

// ---- Main ---------------------------------------------------------------

(async () => {
  const args = parseArgs(process.argv.slice(2));
  switch (args._verb) {
    case "publish":
      await runPublish(args);
      break;
    case "apply":
      await runApply(args);
      break;
    case null:
    case undefined:
      console.error("registry-mirror-sync: missing verb");
      printUsage();
      process.exit(2);
      break;
    default:
      console.error(`registry-mirror-sync: unknown verb: ${args._verb}`);
      printUsage();
      process.exit(2);
  }
})().catch((e) => {
  audit({ event: "fatal", err: e.message || String(e) });
  console.error(`registry-mirror-sync: FATAL ${e && e.stack ? e.stack : e}`);
  process.exit(1);
});
