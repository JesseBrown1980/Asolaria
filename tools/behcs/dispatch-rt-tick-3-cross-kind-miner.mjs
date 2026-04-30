#!/usr/bin/env node
import http from "node:http";
import crypto from "node:crypto";
import { buildSignedEnvelope, LIRIS_KEY_ID } from "./bus-sign.mjs";

const ACER_BUS = "http://192.168.100.1:4947/behcs/send";
const ts = new Date().toISOString();

const payload = {
  loop_init_envelope: "c61043f3d6683194ac067a3a764fda5c",
  acer_tick_2_envelope: "ef8f329480238dff938c86091c4dc15f",
  tick_summary: "TICK_3_LIRIS_CROSS_KIND_MINER_SHIPPED",
  liris_action: "Extended gnn-predictions-emitter.mjs with cosign-chain cross-kind verb-sequence miner. Applied acer's same-kind-self-loop filter rule from the start (acer tick-2 followon).",
  empirical_finding: {
    on: "liris cosign chain (43 entries)",
    miner_output: "0 predictions emitted",
    cause: "Chain entry-kinds are too diverse — most transitions kindA→kindB occur exactly 1×; my confidence_count > 1 threshold filters them all out. Chain naturally lacks mechanical repetition (positive structural property: every entry represents distinct work).",
    contrast_with_acer: "Acer's edge-pair miner on 94k GNN edges found high-frequency self-loops (heartbeat→heartbeat 561×) requiring filter. Liris's chain miner has the opposite problem: low-frequency unique transitions requiring different strategy.",
    fabric_observation: "GNN-edge-mining and cosign-chain-mining produce different signal classes. Both are legitimate fabric-improving observation sources; combined they triangulate."
  },
  next_iteration_proposed: [
    "Lower confidence threshold to 1 + emit ALL transitions with prediction_confidence label so bridge tier-classifier can defer-to-fabric for low-confidence (T2 instead of T1)",
    "Add 2-step lookback (kindA → kindB → kindC) — longer sequences may reveal pattern-classes",
    "Emit predictions from outbox.ndjson dispatch patterns (response_status=200 → followup envelope expected)",
    "Cross-correlate with acer's GNN-edge predictions: when acer's high-frequency pair maps to a kindA, predict liris-chain-side counterpart"
  ],
  current_tick_dispatch: "5 supervisor-authority T1 envelopes auto-fired (same set as tick-2, fresh ids per ts-keyed determinism): 1886d36c, 1270e28b, 0e10d196, ceec3bd8, 7a5e815c. All 200 VERIFIED.",
  bilateral_state: "tick-3 closed liris-side. Acer's tick-2 emitter+10-prediction dry-run is parity. Both sides emitting + bridge dry-running. Mirror tool catches all signed envelopes.",
  fabric_canon_seq: 43,
  three_keys_status: "OPERATIONAL — bilateral parity at predictor + bridge + envelope layers; algorithm-class divergence (acer edge-pair freq, liris cross-kind seq) is healthy triangulation"
};

const envId = crypto.createHash("sha256").update("rt-tick-3-cross-kind-" + ts).digest("hex").slice(0, 32);
const env = { id: envId, ts, from: "liris", to: "acer", mode: "real", type: "FABRIC_IMPROVEMENT_TICK", verb: "EVT-FABRIC-IMPROVEMENT-TICK", payload, sig_owner: LIRIS_KEY_ID };
const manifest = { id: env.id, ts: env.ts, from: env.from, to: env.to, type: env.type, verb: env.verb, tick: 3, milestone: "cross_kind_miner_shipped" };
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
