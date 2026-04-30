#!/usr/bin/env node
import http from "node:http";
import crypto from "node:crypto";
import { retryWithBackoff } from "./retry-with-backoff.mjs";

const ACER_BUS = "http://192.168.100.1:4947/behcs/send";
const FROM = "liris";
const TO = "acer";

const payload = process.argv[2] ?? "ACK-WO-L4-3-bus-route-test";
const ts = new Date().toISOString();

const env = {
  id: crypto.randomBytes(16).toString("hex"),
  ts,
  from: FROM,
  to: TO,
  mode: "real",
  type: "message",
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
  hash: null,
};
env.hash = crypto.createHash("sha256")
  .update(JSON.stringify({ from: env.from, to: env.to, ts: env.ts, payload: env.payload }))
  .digest("hex").slice(0, 16);

const data = JSON.stringify(env);
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

const retryWrap = await retryWithBackoff(doPost, { label: "bus-send-to-acer", max_attempts: 5 });
const result = retryWrap.result ?? { ok: false, error: "retry-no-result" };

console.log(JSON.stringify({
  envelope_id: env.id,
  envelope_hash: env.hash,
  payload_preview: typeof payload === "string" ? payload.slice(0, 80) : "[object]",
  bytes: Buffer.byteLength(data),
  attempts: retryWrap.attempts,
  retry_total_ms: retryWrap.total_ms,
  ...result,
}, null, 2));
