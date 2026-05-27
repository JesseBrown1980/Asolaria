#!/usr/bin/env node
// Case-A bus-route preamble dispatcher.
// Re-asserts FIRST_MESSAGE_CANON to an already-running acer Claude.
// Lands in acer/data/behcs/inbox.ndjson; acer Claude reads on next inbox cycle.
// For seeding a brand-new acer Claude session at boot, see Case-B startup-hook
// spec (separate WO) — bus delivery alone won't fire as the literal first
// stdin message.

import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import crypto from "node:crypto";
import { buildSignedEnvelope, LIRIS_KEY_ID } from "./bus-sign.mjs";
import { retryWithBackoff } from "./retry-with-backoff.mjs";
import { validateCanon } from "./canon-validate.mjs";

const PREAMBLE_PATH = "C:/Users/rayss/Asolaria/OPERATOR-FIRST-MESSAGE.txt";
const ACER_BUS = "http://192.168.100.1:4947/behcs/send";
const OUTBOX_PATH = "C:/Users/rayss/Asolaria/data/behcs/outbox.ndjson";
const CANON_LOG_PATH = "C:/Users/rayss/Asolaria/logs/canon-validation.ndjson";
const FROM = "liris";
const TO = "acer";
const SIGN = process.env.LIRIS_BUS_UNSIGNED !== "1";

function appendOutbox(row) {
  try {
    fs.mkdirSync(path.dirname(OUTBOX_PATH), { recursive: true });
    fs.appendFileSync(OUTBOX_PATH, JSON.stringify(row) + "\n");
  } catch (e) {
    console.error(`[outbox] append failed: ${e.message}`);
  }
}

function appendCanonLog(row) {
  try {
    fs.mkdirSync(path.dirname(CANON_LOG_PATH), { recursive: true });
    fs.appendFileSync(CANON_LOG_PATH, JSON.stringify(row) + "\n");
  } catch (e) {
    console.error(`[canon-log] append failed: ${e.message}`);
  }
}

// WO-L8: Pre-canon validate BEFORE reading payload / writing outbox / POSTing.
// Refuse to dispatch if !ok. Always append the result to canon-validation.ndjson.
const canonResult = validateCanon(PREAMBLE_PATH);
appendCanonLog({
  ts: new Date().toISOString(),
  named_agent: "liris-cascade-W4-2-L8-pre-canon-validator",
  preamble_path: PREAMBLE_PATH,
  ...canonResult,
});
console.log(`[canon-validate] ok=${canonResult.ok} version=${canonResult.version} bytes=${canonResult.bytes} sha256=${canonResult.sha256.slice(0, 12)}…`);
if (!canonResult.ok) {
  console.error(`[canon-validate] REFUSE-DISPATCH violations=${canonResult.violations.length}`);
  for (const v of canonResult.violations) {
    console.error(`  - ${v.rule}: ${v.detail}`);
  }
  process.exit(2);
}

const payload = fs.readFileSync(PREAMBLE_PATH, "utf-8");

// Extract canon_version from [PRIME-INFRA-PRELOADED:v<X>] header.
const versionMatch = payload.match(/\[PRIME-INFRA-PRELOADED:([^\]]+)\]/);
const canonVersion = versionMatch ? versionMatch[1] : "unknown";

const payloadSha256 = crypto.createHash("sha256").update(payload).digest("hex");
const ts = new Date().toISOString();

// envelope_id is deterministic over (canon_version + payload + ts). Same canon
// + same minute = same id (still mostly idempotent), but a fresh dispatch
// produces a fresh id so the bus doesn't dedupe a re-run against an earlier
// landing. Drop ts from the hash if you want strict canon-keyed dedup.
const envelopeId = crypto.createHash("sha256")
  .update(canonVersion + "\n" + payloadSha256 + "\n" + ts)
  .digest("hex").slice(0, 32);

const env = {
  id: envelopeId,
  ts,
  from: FROM,
  to: TO,
  mode: "real",
  type: "FIRST_MESSAGE_CANON",
  verb: "EVT-PRIME-INFRA-PRELOAD-REASSERT",
  canon_version: canonVersion,
  payload_sha256: payloadSha256,
  payload,
  cube: {
    D1_ACTOR: FROM,
    D3_TARGET: TO,
    D7_STATE: "executing",
    D20_TIME: ts,
    D26_OMNIDIRECTIONAL: "bilateral",
    D34_CROSS_COLONY: "cross_host_lan",
    D38_ENCRYPTION: "plaintext",
  },
  sig: null,
  sig_owner: null,
  hash: null,
};
env.hash = crypto.createHash("sha256")
  .update(JSON.stringify({ from: env.from, to: env.to, ts: env.ts, payload: env.payload }))
  .digest("hex").slice(0, 16);

// Acer bus verifyIngressEnvelope iterates msg.body[k] looking for {payload,
// signature}; top-level signed_envelope is invisible to it. Sign a small
// manifest (not the 4734-byte preamble) — manifest carries payload_sha256
// covering preamble integrity by reference. Bus stores both the verified
// manifest and the flat envelope with full preamble text.
let body;
if (SIGN) {
  const manifest = {
    id: env.id,
    ts: env.ts,
    from: env.from,
    to: env.to,
    type: env.type,
    verb: env.verb,
    canon_version: env.canon_version,
    payload_sha256: env.payload_sha256,
  };
  const { signed_envelope } = buildSignedEnvelope(manifest, LIRIS_KEY_ID);
  body = { ...env, body: { signed_envelope } };
  env.sig_owner = LIRIS_KEY_ID;
} else {
  body = env;
}
const data = JSON.stringify(body);
const url = new URL(ACER_BUS);

console.log(`[dispatch] canon_version=${canonVersion} bytes=${Buffer.byteLength(payload)} sha256=${payloadSha256.slice(0, 12)}…`);
console.log(`[dispatch] envelope_id=${envelopeId} (deterministic, idempotent)`);
console.log(`[dispatch] signing=${SIGN ? `ed25519 key_id=${LIRIS_KEY_ID}` : "OFF (LIRIS_BUS_UNSIGNED=1)"}`);
console.log(`[dispatch] POST ${ACER_BUS} body_bytes=${Buffer.byteLength(data)}`);

// Durable pre-call ledger row. Response fields stay null until POST returns.
const dispatchedAt = new Date().toISOString();
const outboxRow = {
  id: envelopeId,
  ts,
  from: FROM,
  to: TO,
  type: env.type,
  verb: env.verb,
  canon_version: canonVersion,
  payload_sha256: payloadSha256,
  sig_owner: SIGN ? LIRIS_KEY_ID : null,
  dispatched_at: dispatchedAt,
  response_status: null,
  response_body_received_id: null,
  response_sig_verdict: null,
  response_error: null,
};
appendOutbox(outboxRow);
console.log(`[outbox] appended pre-call row id=${envelopeId} -> ${OUTBOX_PATH}`);

function doPost() {
  return new Promise((resolve) => {
    const req = http.request({
      host: url.hostname,
      port: url.port,
      path: url.pathname,
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) },
      timeout: 15000,
    }, (res) => {
      let body = "";
      res.on("data", (c) => body += c);
      res.on("end", () => {
        let parsed;
        try { parsed = JSON.parse(body); } catch { parsed = body; }
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, body: parsed });
      });
    });
    req.on("error", (e) => resolve({ ok: false, error: e.message }));
    req.on("timeout", () => { req.destroy(); resolve({ ok: false, error: "timeout" }); });
    req.write(data);
    req.end();
  });
}

const retryWrap = await retryWithBackoff(doPost, {
  label: "dispatch-canon",
  max_attempts: 5,
  on_attempt: (n, r) => {
    console.log(`[retry] attempt=${n} ok=${!!r.ok} status=${r.status ?? ""} err=${r.error ?? ""}`);
  },
});
const result = retryWrap.result ?? { ok: false, error: "retry-no-result" };
const attempts = retryWrap.attempts;

console.log(JSON.stringify({ ...result, attempts, retry_total_ms: retryWrap.total_ms }, null, 2));

// Post-response update row. Append rather than rewrite — outbox.ndjson is a
// log, not a table; reconciler picks the latest entry per id.
const updateRow = {
  ...outboxRow,
  response_status: result.status ?? null,
  response_body_received_id: (result.body && typeof result.body === "object")
    ? (result.body.id ?? result.body.received_id ?? null)
    : null,
  response_sig_verdict: (result.body && typeof result.body === "object")
    ? (result.body.sig_verdict ?? result.body.verdict ?? null)
    : null,
  response_error: result.error ?? null,
  attempts,
  retry_total_ms: retryWrap.total_ms,
  responded_at: new Date().toISOString(),
};
appendOutbox(updateRow);
console.log(`[outbox] appended post-call row id=${envelopeId} status=${updateRow.response_status} err=${updateRow.response_error}`);

if (!result.ok) process.exit(2);
