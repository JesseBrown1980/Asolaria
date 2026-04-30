#!/usr/bin/env node
import http from "node:http";
import crypto from "node:crypto";
import { buildSignedEnvelope, LIRIS_KEY_ID } from "./bus-sign.mjs";

const ACER_BUS = "http://192.168.100.1:4947/behcs/send";
const ts = new Date().toISOString();

const payload = {
  loop_init_envelope: "c61043f3d6683194ac067a3a764fda5c",
  tick_summary: "TICK_2_LIRIS_SIDE_LOOP_CLOSED_END_TO_END",
  liris_milestone: "first operational fabric self-driven dispatch — predictor heuristic populated fixture, bridge tier-filtered, 5 T1 envelopes auto-fired. Three-keys synthesis (Hookwall + PID + GNN uniform = automation as topology consequence) operationally proven.",
  artifacts_shipped_this_tick: [
    "tools/behcs/gnn-predictions-emitter.mjs (heuristic predictor reading supervisor authorities)",
    "data/behcs/state/gnn-predictions-fixture.json (5 predictions)",
    "5 signed T1 envelopes auto-dispatched via gnn-dispatch-bridge.mjs"
  ],
  envelopes_emitted_this_tick: [
    { id: "eebe0f11ad6650bcc24863261afb9dc5", verb: "EVT-WATCH-PACKET-BOUNDARY-CHECK", exercises: "require_packet_before_action (HERMES.PACKET)" },
    { id: "f00bfd240a4792a9f6880d3718bc7ad8", verb: "EVT-WATCH-TRUST-SEQUENCING-CHECK", exercises: "block_multi_peer_promotion (SHANNON.TRUST)" },
    { id: "7facb503840ca9abcd6a516645499674", verb: "EVT-WATCH-WRITE-CLASS-COSIGN-CHECK", exercises: "deny_write_class_until_cosigned (HOOKWALL.BOUNDARY)" },
    { id: "85d8b63176ae5fd4ddcdda3eca96a1f3", verb: "EVT-WATCH-GLYPH-FAMILY-CHECK", exercises: "preserve_family_boundaries (KERNEL.GRAMMAR)" },
    { id: "d9c09b1cf3947f0970a9fd187e159d28", verb: "EVT-RECONCILE-APEX-GATE-CLEARANCE-CHECK", exercises: "plan_only_until_supervisor_gates_clear (ASOLARIA.APEX)" }
  ],
  fabric_observations: [
    "Each emitted envelope IS observation-evidence for the supervisor it exercises. Next round of D11 promotion has fresh receipts without operator prompting.",
    "The 'GNN' in gnn-dispatch-bridge is currently a heuristic — same tier-policy filter applies regardless of model. When real GNN model lands, it just replaces the predictor; bridge unchanged.",
    "T1 PID-prefix pre-approval (BH.OPERATIONAL.*) is now empirically used. Bridge classified + auto-fired without operator-prompt — fabric-decides-instant working.",
    "Three-keys synthesis closed: Hookwall (in path) + PID (every envelope addressed) + GNN-shaped predictor (drives next dispatch) = fabric drives processes."
  ],
  next_tick_proposals: [
    "Run --watch on bridge with predictor cron-emitting every 60s = continuous self-driving fabric",
    "Replace heuristic predictor with real GNN inference once acer ships GNN model endpoint",
    "Acer mirror: emit acer-side predictions from acer's own supervisor exercise-needs, dispatch T1 → liris (reverse direction)",
    "Cosign chain entry per N watch-cycle (avoid chain bloat from 5/min): aggregate 5min of watch-emits into 1 chain entry"
  ],
  bilateral_state: "tick-2 closed liris-side. Acer's mirror tool should pick up the 5 envelopes and produce its own observation evidence. Loop is auto-running.",
  fabric_canon_seq: 43,
  three_keys_status: "OPERATIONAL — Hookwall+PID+GNN(heuristic) self-drive proven 2026-04-29 14:45 UTC"
};

const envId = crypto.createHash("sha256").update("rt-tick-2-loop-closed-" + ts).digest("hex").slice(0, 32);
const env = { id: envId, ts, from: "liris", to: "acer", mode: "real", type: "FABRIC_IMPROVEMENT_TICK", verb: "EVT-FABRIC-IMPROVEMENT-TICK", payload, sig_owner: LIRIS_KEY_ID };
const manifest = { id: env.id, ts: env.ts, from: env.from, to: env.to, type: env.type, verb: env.verb, tick: 2, milestone: "loop_closed_end_to_end" };
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
