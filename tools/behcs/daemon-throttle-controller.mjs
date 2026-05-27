#!/usr/bin/env node
// daemon-throttle-controller.mjs — liris W7-O6 auto-throttle controller.
// Probes acer:4947/behcs/health + acer:4948/summary, reads liris fabric-loop
// tail, classifies bus health (GREEN/YELLOW/RED), and recommends interval
// adjustments. Read-only against running daemons; never auto-applies.
// Mirrors acer W7-12 controller with bilateral capacity coordination.

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { buildSignedEnvelope } from "./bus-sign.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const STATE_DIR = path.join(REPO_ROOT, "data", "behcs", "state");
const FABRIC_LOG = path.join(STATE_DIR, "fabric-loop.ndjson");
const REC_FILE = path.join(STATE_DIR, "throttle-recommendations.json");

const ACER_HOST = "192.168.100.1";
const HEALTH_URL = { host: ACER_HOST, port: 4947, path: "/behcs/health" };
const SUMMARY_URL = { host: ACER_HOST, port: 4948, path: "/summary" };
const SEND_URL = { host: ACER_HOST, port: 4947, path: "/behcs/send" };
const PROBE_TIMEOUT_MS = 5000;
const NAMED_AGENT = "liris-cascade-W7-O6-auto-throttle-controller";
const CURRENT_INTERVAL_S = 180;

const failHistory = []; // rolling probe-failure count
const inboxHistory = []; // {ts_ms, depth} for growth-rate calc

function probe(target) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const req = http.get({ ...target, timeout: PROBE_TIMEOUT_MS }, (res) => {
      let body = "";
      res.on("data", (c) => { body += c; if (body.length > 65536) req.destroy(); });
      res.on("end", () => {
        const ms = Date.now() - t0;
        if (res.statusCode < 200 || res.statusCode >= 300) return resolve({ ok: false, ms, error: `http_${res.statusCode}` });
        try { resolve({ ok: true, ms, json: JSON.parse(body) }); } catch { resolve({ ok: false, ms, error: "json_parse_failed" }); }
      });
    });
    req.on("timeout", () => { req.destroy(); resolve({ ok: false, error: "timeout" }); });
    req.on("error", (e) => resolve({ ok: false, error: e.message || String(e) }));
  });
}

function readFabricT1RatePerMin() {
  if (!fs.existsSync(FABRIC_LOG)) return { dispatches_per_min: 0, samples: 0 };
  const lines = fs.readFileSync(FABRIC_LOG, "utf-8").split("\n").filter(Boolean);
  const cutoffMs = Date.now() - 5 * 60 * 1000;
  let count = 0;
  for (const line of lines.slice(-200)) {
    try { const r = JSON.parse(line);
      if (r.ts && Date.parse(r.ts) >= cutoffMs && r.bridge?.dispatched != null) count += r.bridge.dispatched;
    } catch {}
  }
  return { dispatches_per_min: count / 5, samples: lines.length };
}

function inboxGrowthPerMin(currentDepth) {
  const now = Date.now();
  inboxHistory.push({ ts_ms: now, depth: currentDepth });
  while (inboxHistory.length && now - inboxHistory[0].ts_ms > 5 * 60 * 1000) inboxHistory.shift();
  if (inboxHistory.length < 2) return 0;
  const first = inboxHistory[0];
  const dtMin = (now - first.ts_ms) / 60000;
  return dtMin > 0 ? (currentDepth - first.depth) / dtMin : 0;
}

function classify({ healthOk, uptimeS, paritySc, growth, anyDegraded }) {
  failHistory.push(healthOk ? 0 : 1);
  while (failHistory.length > 3) failHistory.shift();
  const consecFails = failHistory.length === 3 && failHistory.every((v) => v === 1);
  const reasons = [];
  let level = "GREEN";
  if (consecFails) { level = "RED"; reasons.push("3-consecutive-probe-failures"); }
  if (growth > 10) { level = "RED"; reasons.push(`inbox-growth ${growth.toFixed(1)}/min > 10`); }
  if (anyDegraded) { level = "RED"; reasons.push("DEGRADED-state-detected"); }
  if (level !== "RED" && growth > 5) { level = "YELLOW"; reasons.push(`inbox-growth ${growth.toFixed(1)}/min in 5-10`); }
  if (level !== "RED" && uptimeS != null && uptimeS < 60) { level = "YELLOW"; reasons.push(`recent-restart uptime_s=${uptimeS}`); }
  if (level === "GREEN") {
    if (paritySc != null && paritySc >= 2) reasons.push(`parity_score=${paritySc}`);
    reasons.push(`inbox-growth ${growth.toFixed(1)}/min`);
  }
  return { level, reasons };
}

function recommend(level) {
  if (level === "GREEN") return { proposed_interval_s: CURRENT_INTERVAL_S, note: "keep 180s; tighten to 120s only after sustained 30min GREEN" };
  if (level === "YELLOW") return { proposed_interval_s: 240, note: "slow to 240s on YELLOW; re-evaluate in 60s" };
  return { proposed_interval_s: 600, note: "slow to 600s on RED; emit EVT-BUS-PRESSURE-WARN", emit_pressure_warn: true };
}

function postSigned(envelope) {
  const data = JSON.stringify(envelope);
  return new Promise((resolve) => {
    const req = http.request({ ...SEND_URL, method: "POST", timeout: 15000,
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) } }, (res) => {
      let body = ""; res.on("data", (c) => body += c);
      res.on("end", () => { let parsed; try { parsed = JSON.parse(body); } catch { parsed = body; }
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, body: parsed }); });
    });
    req.on("error", (e) => resolve({ ok: false, error: e.message }));
    req.on("timeout", () => { req.destroy(); resolve({ ok: false, error: "timeout" }); });
    req.write(data); req.end();
  });
}

async function emitRecommendation(payload) {
  const ts = new Date().toISOString();
  const env = buildSignedEnvelope(payload);
  const inner = { id: crypto.randomBytes(16).toString("hex"), ts,
    from: "liris", to: "acer", mode: "real", type: "EVT-THROTTLE-RECOMMENDATION",
    payload, signed_envelope: env.signed_envelope,
    cube: { D1_ACTOR: "liris", D3_TARGET: "acer", D7_STATE: "advising", D20_TIME: ts,
      D26_OMNIDIRECTIONAL: "bilateral", D34_CROSS_COLONY: "cross_host_lan", D38_ENCRYPTION: "ed25519_signed" } };
  inner.hash = crypto.createHash("sha256").update(JSON.stringify({ from: "liris", to: "acer", ts, type: inner.type })).digest("hex").slice(0, 16);
  const result = await postSigned(inner);
  return { envelope_id: inner.id, hash: inner.hash, post: result,
    sig_verdict: env.signed_envelope.signature.key_id ? "signed_ed25519" : "unsigned" };
}

async function assessOnce() {
  const ts = new Date().toISOString();
  const [health, summary] = await Promise.all([probe(HEALTH_URL), probe(SUMMARY_URL)]);
  const inboxDepth = health.json?.inbox_depth ?? health.json?.cube?.inbox_depth ?? 0;
  const uptimeS = health.json?.uptime_s ?? null;
  const paritySc = summary.json?.bilateral_parity ?? summary.json?.parity_score ?? null;
  const anyDegraded = (health.json?.state === "DEGRADED") || (summary.json?.daemon_health === "DEGRADED");
  const growth = inboxGrowthPerMin(inboxDepth);
  const t1 = readFabricT1RatePerMin();
  const cls = classify({ healthOk: health.ok, uptimeS, paritySc, growth, anyDegraded });
  const rec = recommend(cls.level);
  const record = { ts, named_agent: NAMED_AGENT, current_interval_s: CURRENT_INTERVAL_S,
    classification: cls.level, reasons: cls.reasons, recommendation: rec,
    probes: { health: { ok: health.ok, ms: health.ms, error: health.error,
        inbox_depth: inboxDepth, uptime_s: uptimeS },
      summary: { ok: summary.ok, ms: summary.ms, error: summary.error, parity_score: paritySc } },
    fabric_t1: t1, growth_per_min: growth, auto_apply: false,
    note: "operator-touch class — NOT auto-applied" };
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(REC_FILE, JSON.stringify(record, null, 2));
  let dispatch = null;
  try { dispatch = await emitRecommendation({ named_agent: NAMED_AGENT,
      classification: cls.level, reasons: cls.reasons, recommendation: rec,
      probes_summary: { health_ok: health.ok, summary_ok: summary.ok,
        inbox_depth: inboxDepth, uptime_s: uptimeS, growth_per_min: growth, parity_score: paritySc } });
  } catch (e) { dispatch = { ok: false, error: e.message }; }
  return { record, dispatch };
}

async function main() {
  const args = process.argv.slice(2);
  const once = args.includes("--once");
  const watch = args.includes("--watch");
  const ivIdx = args.indexOf("--interval-s");
  const intervalS = ivIdx >= 0 ? Number(args[ivIdx + 1]) : 60;
  if (!once && !watch) { console.error("usage: --once | --watch [--interval-s 60]"); process.exit(2); }
  if (once) {
    const r = await assessOnce();
    console.log(JSON.stringify({ classification: r.record.classification,
      reasons: r.record.reasons, recommendation: r.record.recommendation,
      envelope_id: r.dispatch?.envelope_id, sig_verdict: r.dispatch?.sig_verdict,
      post_ok: r.dispatch?.post?.ok, post_status: r.dispatch?.post?.status }, null, 2));
    return;
  }
  console.log(`[throttle-controller] watch interval=${intervalS}s`);
  while (true) {
    try { const r = await assessOnce();
      console.log(`[${r.record.ts}] ${r.record.classification} → ${r.record.recommendation.proposed_interval_s}s envelope=${r.dispatch?.envelope_id?.slice(0,8)}`);
    } catch (e) { console.error("[err]", e.message); }
    await new Promise((res) => setTimeout(res, intervalS * 1000));
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
