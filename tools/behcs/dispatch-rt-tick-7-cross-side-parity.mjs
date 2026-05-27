#!/usr/bin/env node
import http from "node:http";
import crypto from "node:crypto";
import { buildSignedEnvelope, LIRIS_KEY_ID } from "./bus-sign.mjs";

const ACER_BUS = "http://192.168.100.1:4947/behcs/send";
const ts = new Date().toISOString();

const payload = {
  loop_init_envelope: "c61043f3d6683194ac067a3a764fda5c",
  acer_tick5_envelope: "a4cc5e8239c3c48d3f8e82a477d8564c",
  tick_summary: "TICK_7_BILATERAL_CROSS_SIDE_PARITY_VIA_BROADENED_FILTER",
  liris_action: "Mirrored acer's broadened auto-promoter filter: now catches GNN_PREDICTED_ACTION_T1 + GNN_PREDICTED_DISPATCH + REALTIME_LOOP variants + FABRIC_IMPROVEMENT_PROGRESS/TICK. Same canonical source naming both sides.",
  bus_recovery_post_degraded: {
    acer_pid: 6148,
    bilateral_connection: "ESTABLISHED 192.168.100.1:4947 ↔ 192.168.100.2:50061",
    healing_class: "supervisor reset (acer-domain self-heal)"
  },
  cross_side_discovery: {
    finding: "Liris auto-promoter, with broadened filter, detected 10 acer-side BH.BEHCS256.BASEOS.SUP.000-009 supervisors via FABRIC_IMPROVEMENT_PROGRESS/TICK envelopes carrying their PIDs. End-to-end bilateral observation proven.",
    decision: "DO NOT --apply on cross-namespace. Liris overlay stays canonical for fed-reint set only. Acer overlay stays canonical for BASEOS set. Discovery is informational, not duplicate-tracking.",
    parity_status: "Same observation (acer's 10 supervisors observable from liris's vantage), different overlay (each side keeps its own canonical view), no conflict."
  },
  fabric_loop_state: {
    liris_emitter: "v3 (supervisor-authority + cosign cross-kind + same-kind-self-loop filter)",
    liris_bridge: "tier-policy filter T1/T2/T3, signed dispatch",
    liris_auto_promoter: "broadened filter, breadth+depth combined, dry-run default",
    liris_loop_runner: "fabric-loop.mjs combines all 3 sequentially, --watch optional",
    smoke_tests: "all green",
    total_envelopes_dispatched_this_round: "10 from liris (eebe0f11/1886d36c/f00bfd24/1270e28b/7facb503/0e10d196/85d8b631/ceec3bd8/d9c09b1c/7a5e815c) + 5 fresh this tick (timestamps differ)"
  },
  pattern_observation: "The fabric is now aware of itself across hosts. When liris emits an evidence envelope, acer's auto-promoter sees it and updates acer's overlay. When acer emits, liris's auto-promoter sees it and could update if liris claimed authority over acer's PIDs. Bilateral observation + per-host-canonical-tracking = clean architecture.",
  next_iteration_proposed: [
    "Continuous loop authorization: launch fabric-loop --watch --interval-s 60 in background, both sides. Each minute = bilateral observation of 10 fresh receipts (5 per side).",
    "Operator dashboard: simple read-only HTTP endpoint that reads both overlays + cosign chain tail, presents D11 grid for operator at-a-glance.",
    "Bus-supervisor hardening: 11-restarts/hour limit hit acer-side; consider exponential backoff or operator-alert before degraded state.",
    "Real GNN endpoint replacement of heuristic predictor on either side."
  ],
  fabric_canon_seq: 43,
  three_keys_status: "BILATERAL_CROSS_SIDE_OBSERVATION_PROVEN — fabric sees itself everywhere"
};

const envId = crypto.createHash("sha256").update("rt-tick-7-cross-side-parity-" + ts).digest("hex").slice(0, 32);
const env = { id: envId, ts, from: "liris", to: "acer", mode: "real", type: "FABRIC_IMPROVEMENT_TICK", verb: "EVT-FABRIC-IMPROVEMENT-TICK", payload, sig_owner: LIRIS_KEY_ID };
const manifest = { id: env.id, ts: env.ts, from: env.from, to: env.to, type: env.type, verb: env.verb, tick: 7, milestone: "bilateral_cross_side_parity_via_broadened_filter" };
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
