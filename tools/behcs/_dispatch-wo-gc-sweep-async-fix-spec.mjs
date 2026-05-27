#!/usr/bin/env node
// One-shot dispatcher: sign + POST EVT-WO-GC-SWEEP-ASYNC-FIX-SPEC envelope to acer.
// Authored by liris-cascade-W8-4-gc-sweep-inbox-async-fix-spec.
import fs from "node:fs";
import http from "node:http";
import crypto from "node:crypto";
import { buildSignedEnvelope } from "./bus-sign.mjs";
import { retryWithBackoff } from "./retry-with-backoff.mjs";

const ACER_BUS = "http://192.168.100.1:4947/behcs/send";
const SPEC_PATH = "C:/Users/rayss/Asolaria/plans/WO-GC-SWEEP-INBOX-ASYNC-FIX-SPEC.md";
const spec_content = fs.readFileSync(SPEC_PATH, "utf-8");
const spec_sha256 = crypto.createHash("sha256").update(spec_content).digest("hex");
const ts = new Date().toISOString();
const env_id = crypto.randomBytes(16).toString("hex");

const payload = {
  id: env_id,
  ts,
  from: "liris",
  to: "acer",
  mode: "real",
  type: "work_order_spec",
  verb: "EVT-WO-GC-SWEEP-ASYNC-FIX-SPEC",
  named_agent: "liris-cascade-W8-4-gc-sweep-inbox-async-fix-spec",
  spec_path: SPEC_PATH,
  spec_lines: spec_content.split("\n").length,
  spec_sha256,
  spec_content,
  cosign_reference: "COSIGN-MERGED-034-EXTENDED",
  d11: "PROVEN",
  cube: {
    D1_ACTOR: "liris",
    D3_TARGET: "acer",
    D7_STATE: "executing",
    D11_EPISTEMIC: "PROVEN",
    D15_AUTHORITY: "acer_owns_landing",
    D20_TIME: ts,
    D24_INTENT: "spec_dispatch_for_async_fix",
    D26_OMNIDIRECTIONAL: "bilateral",
    D34_CROSS_COLONY: "cross_host_lan",
    D38_ENCRYPTION: "ed25519_signed",
  },
  hash: null,
};
payload.hash = crypto.createHash("sha256")
  .update(JSON.stringify({ id: env_id, from: payload.from, to: payload.to, ts, verb: payload.verb, spec_sha256 }))
  .digest("hex").slice(0, 16);

const signed = buildSignedEnvelope(payload);
const data = JSON.stringify(signed);
const url = new URL(ACER_BUS);

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

const wrap = await retryWithBackoff(doPost, { label: "dispatch-wo-gc-sweep-async-fix-spec", max_attempts: 5 });
const result = wrap.result ?? { ok: false, error: "retry-no-result" };
const sig_verdict = result.ok && result.body && typeof result.body === "object"
  ? (result.body.sig_verdict ?? result.body.verdict ?? result.body.signature_verdict ?? "ACCEPTED_NO_VERDICT_FIELD")
  : (result.ok ? "ACCEPTED_TEXT_BODY" : "DISPATCH_FAILED");

console.log(JSON.stringify({
  envelope_id: env_id,
  envelope_hash: payload.hash,
  verb: payload.verb,
  spec_path: SPEC_PATH,
  spec_sha256,
  spec_bytes: Buffer.byteLength(spec_content),
  bytes_on_wire: Buffer.byteLength(data),
  attempts: wrap.attempts,
  retry_total_ms: wrap.total_ms,
  sig_verdict,
  ...result,
}, null, 2));
