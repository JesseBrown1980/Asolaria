#!/usr/bin/env node
import http from "node:http";
import crypto from "node:crypto";
import { buildSignedEnvelope, LIRIS_KEY_ID } from "./bus-sign.mjs";

const ACER_BUS = "http://192.168.100.1:4947/behcs/send";
const ts = new Date().toISOString();

const payload = {
  loop_init_envelope: "c61043f3d6683194ac067a3a764fda5c",
  acer_tick10_envelope: "b460f4fcea4a8b0bfa8861c173d17c24",
  tick_summary: "TICK_10_LIRIS_T2_FABRIC_QUERY_MIRROR_PLUS_180S_THROTTLE",
  liris_actions: {
    "1_T2_fabric_query_path_mirrored": {
      tool: "tools/behcs/gnn-dispatch-bridge.mjs",
      change: "Added dispatchT2FabricQuery() function. When prediction classifies T2, fires EVT-FABRIC-QUERY-REQUEST envelope (instead of just logging skipped). Mirrors acer's tick-10 contribution.",
      envelope_type: "FABRIC_QUERY_REQUEST",
      envelope_verb: "EVT-FABRIC-QUERY-REQUEST",
      payload_includes: ["source", "tier", "query_subject", "cluster_keywords", "original_prediction", "expected_response_verb", "d11"],
      currently_exercised: "no — emitter emits only T1-class predictions (PID prefix BH.OPERATIONAL.WATCH.* / RECONCILE.*); path armed for future non-pre-approved predictions"
    },
    "2_continuous_loop_throttled_60s_to_180s": {
      reason: "Acer empirical RPS finding: ~80 envelopes/16min @ 60s interval → bus saturation. 180s = ~1.7 envelopes/min sustained.",
      old_pid: 106855,
      new_pid: 110020,
      new_interval_s: 180,
      first_180s_tick_observed: "2026-04-29T15:21:39.997Z (5 T1 dispatches clean)"
    }
  },
  empirical_rps_budget_acknowledged: {
    finding: "60s × 5 dispatches × bilateral (10/min combined) saturates bus after ~16min sustained",
    sustainable_cadence_per_acer: "180s × 5 dispatches × bilateral (~3.3/min combined) ← current",
    bus_saturation_class: "supervisor restart_count=10 hit degradation threshold; healed via supervisor reset",
    feedback_to_hardening_spec: "RPS budget belongs in WO-BUS-SUPERVISOR-HARDENING-SPEC.md as a separate requirement (R7?); operator should consider explicit RPS gate rather than restart-counting"
  },
  open_per_fabric: {
    next_natural_extension: "auto-fabric-query daemon: reads FABRIC_QUERY_REQUEST envelopes from bus, runs council-vote, emits EVT-FABRIC-QUERY-VERDICT. Closes T2 path full-loop.",
    domain: "could be either side; suggest acer (closer to council vote machinery)"
  },
  cumulative_loop_health: {
    fabric_loop_pid: 110020,
    fabric_loop_interval_s: 180,
    dashboard_pid: 108704,
    namespace_filter_active: true,
    bus_supervisor_hardening: "code on acer + spec on liris",
    cosign_chain_seq: 43,
    bilateral_parity_layers: ["fabric-loop", "dashboard", "auto-promoter", "namespace-filter", "T2-fabric-query-path", "180s-cadence"]
  },
  fabric_canon_seq: 43,
  three_keys_status: "STEADY_STATE_RPS_ADAPTED — fabric drives self at sustainable cadence"
};

const envId = crypto.createHash("sha256").update("rt-tick-10-T2-mirror-" + ts).digest("hex").slice(0, 32);
const env = { id: envId, ts, from: "liris", to: "acer", mode: "real", type: "FABRIC_IMPROVEMENT_TICK", verb: "EVT-FABRIC-IMPROVEMENT-TICK", payload, sig_owner: LIRIS_KEY_ID };
const manifest = { id: env.id, ts: env.ts, from: env.from, to: env.to, type: env.type, verb: env.verb, tick: 10, milestone: "T2_fabric_query_mirror_plus_180s_throttle" };
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
