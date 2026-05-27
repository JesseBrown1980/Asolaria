#!/usr/bin/env node
// test-retry-helper.mjs — exercises retry-with-backoff against simulated
// failures + a live happy-path POST to acer bus. Does NOT touch the real
// dispatcher. WO L9 smoke harness.

import http from "node:http";
import fs from "node:fs";
import { retryWithBackoff } from "./retry-with-backoff.mjs";

const ACER_BUS = "http://192.168.100.1:4947/behcs/send";
const LOG_PATH = "C:/Users/rayss/Asolaria/logs/dispatch-retry.ndjson";

function tailLastN(filePath, n) {
  if (!fs.existsSync(filePath)) return [];
  const text = fs.readFileSync(filePath, "utf-8");
  const lines = text.split("\n").filter((l) => l.length > 0);
  return lines.slice(-n);
}

function liveHappyPath() {
  const env = {
    id: "smoketest-happy-" + Date.now().toString(16),
    ts: new Date().toISOString(),
    from: "liris",
    to: "acer",
    mode: "real",
    type: "message",
    payload: "WO-L9-smoke-test-happy-path",
    cube: { D1_ACTOR: "liris", D3_TARGET: "acer", D7_STATE: "executing", D38_ENCRYPTION: "plaintext" },
  };
  const data = JSON.stringify(env);
  const url = new URL(ACER_BUS);
  return new Promise((resolve) => {
    const req = http.request({
      host: url.hostname, port: url.port, path: url.pathname, method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) },
      timeout: 15000,
    }, (res) => {
      let body = "";
      res.on("data", (c) => body += c);
      res.on("end", () => {
        let parsed; try { parsed = JSON.parse(body); } catch { parsed = body; }
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, body: parsed });
      });
    });
    req.on("error", (e) => resolve({ ok: false, error: e.message }));
    req.on("timeout", () => { req.destroy(); resolve({ ok: false, error: "timeout" }); });
    req.write(data); req.end();
  });
}

function blackholePost() {
  // RFC 5737 TEST-NET-1 192.0.2.0/24 — non-routable, will time out.
  const url = new URL("http://192.0.2.1:4947/behcs/send");
  const data = JSON.stringify({ smoke: "fail" });
  return new Promise((resolve) => {
    const req = http.request({
      host: url.hostname, port: url.port, path: url.pathname, method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) },
      // Shrink read timeout for the smoke run so 5×failure isn't 75s wall.
      // Real dispatcher keeps 15s. Connect timeout still TCP-default but the
      // 192.0.2.1 destination produces error/timeout deterministically.
      timeout: 2000,
    }, (res) => {
      let body = "";
      res.on("data", (c) => body += c);
      res.on("end", () => resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, body }));
    });
    req.on("error", (e) => resolve({ ok: false, error: e.message }));
    req.on("timeout", () => { req.destroy(); resolve({ ok: false, error: "timeout" }); });
    req.write(data); req.end();
  });
}

async function main() {
  const mode = process.argv[2] ?? "all";

  if (mode === "happy" || mode === "all") {
    console.log("[smoke] happy-path against real acer bus…");
    const wrap = await retryWithBackoff(liveHappyPath, {
      label: "smoke-happy",
      max_attempts: 5,
    });
    console.log(`[smoke] happy ok=${wrap.ok} attempts=${wrap.attempts} total_ms=${wrap.total_ms}`);
  }

  if (mode === "fail" || mode === "all") {
    console.log("[smoke] failure-path against 192.0.2.1 (TEST-NET-1)…");
    // Use shorter delays for the smoke run so 5 attempts complete in ~1+2+4+8=15s plus per-attempt 2s timeouts.
    const wrap = await retryWithBackoff(blackholePost, {
      label: "smoke-fail-blackhole",
      max_attempts: 5,
      delays_ms: [1000, 2000, 4000, 8000, 16000],
    });
    console.log(`[smoke] fail ok=${wrap.ok} attempts=${wrap.attempts} total_ms=${wrap.total_ms} err=${wrap.result?.error}`);
  }

  console.log("\n[smoke] tail of dispatch-retry.ndjson (last 8 lines):");
  for (const line of tailLastN(LOG_PATH, 8)) console.log(line);
}

main().catch((e) => { console.error(e); process.exit(2); });
