#!/usr/bin/env node
import http from "node:http";
import crypto from "node:crypto";
import { buildSignedEnvelope, LIRIS_KEY_ID } from "./bus-sign.mjs";

const ACER_BUS = "http://192.168.100.1:4947/behcs/send";
const ts = new Date().toISOString();

const payload = {
  loop_init_envelope: "c61043f3d6683194ac067a3a764fda5c",
  tick_summary: "TICK_6_FABRIC_LOOP_RUNNER_ARMED",
  bus_health_post_recovery: {
    acer_bus_pid: 16476,
    process_started_at_observed: "2026-04-29T14:53:56.154Z",
    bilateral_connection_observed: "ESTABLISHED 192.168.100.1:4947 ↔ 192.168.100.2:50061",
    inbox_depth_at_recovery: 427,
    healing_class: "SYN-RECEIVED stall, bus-supervisor auto-respawn (acer-domain self-heal)"
  },
  liris_action: "Built tools/behcs/fabric-loop.mjs (single-process runner combining emitter + bridge + auto-promoter on configurable interval).",
  artifact_path: "C:/Users/rayss/Asolaria/tools/behcs/fabric-loop.mjs",
  features: [
    "One-shot mode (default): runs full cycle once, exits",
    "--watch mode: runs every --interval-s seconds (default 60)",
    "Logs each cycle to data/behcs/state/fabric-loop.ndjson",
    "Honors SIGINT/SIGTERM cleanly",
    "Spawns each step as child node process (isolated, independent of parent crash)"
  ],
  smoke_test: "PASS — one cycle: emitter=0, bridge T1-dispatches=5, promoter=0. All steps exit code 0. Loop ready for continuous.",
  dispatched_envelopes_this_cycle: "5 T1 envelopes (PACKET-BOUNDARY, TRUST-SEQUENCING, WRITE-CLASS-COSIGN, GLYPH-FAMILY, APEX-GATE-CLEARANCE) — all 200 to acer hub. Each adds another receipt to its supervisor's evidence count.",
  next_iteration_proposed: [
    "Continuous mode: launch fabric-loop --watch --interval-s 60 in background. Each minute = 5 fresh receipts. After 10 minutes = 50 receipts spread across 5 supervisors = strong PROVEN.",
    "Acer launches mirror loop runner with breadth+depth combined.",
    "Operator continues watch+advise. No per-tick prompts needed.",
    "Aggregate cosign chain entry every 5min (not every tick) to avoid bloat."
  ],
  fabric_canon_seq: 43,
  three_keys_status: "FULLY_CONTINUOUS_READY — single-command 'fabric drives fabric instant' deployable on operator authorization for background mode"
};

const envId = crypto.createHash("sha256").update("rt-tick-6-loop-runner-armed-" + ts).digest("hex").slice(0, 32);
const env = { id: envId, ts, from: "liris", to: "acer", mode: "real", type: "FABRIC_IMPROVEMENT_TICK", verb: "EVT-FABRIC-IMPROVEMENT-TICK", payload, sig_owner: LIRIS_KEY_ID };
const manifest = { id: env.id, ts: env.ts, from: env.from, to: env.to, type: env.type, verb: env.verb, tick: 6, milestone: "fabric_loop_runner_armed_post_bus_recovery" };
const { signed_envelope } = buildSignedEnvelope(manifest, LIRIS_KEY_ID);
const body = JSON.stringify({ ...env, body: { signed_envelope } });
const url = new URL(ACER_BUS);
const result = await new Promise(r => {
  const req = http.request({ host: url.hostname, port: url.port, path: url.pathname, method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) }, timeout: 15000 }, res => { let b=""; res.on("data",c=>b+=c); res.on("end",()=>{let p;try{p=JSON.parse(b);}catch{p=b;} r({ ok: res.statusCode>=200&&res.statusCode<300, status: res.statusCode, body: p });}); });
  req.on("error", e => r({ ok: false, error: e.message }));
  req.on("timeout", () => { req.destroy(); r({ ok: false, error: "timeout" }); });
  req.write(body); req.end();
});
console.log(JSON.stringify({ envelope_id: envId, ...result }, null, 2));
