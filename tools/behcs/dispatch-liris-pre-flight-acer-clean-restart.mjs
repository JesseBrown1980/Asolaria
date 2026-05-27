#!/usr/bin/env node
import http from "node:http";
import crypto from "node:crypto";
import { buildSignedEnvelope, LIRIS_KEY_ID } from "./bus-sign.mjs";

const ACER_BUS = "http://192.168.100.1:4947/behcs/send";
const ts = new Date().toISOString();

const payload = {
  vote_kind: "LIRIS_PRE_FLIGHT_CHECK_FOR_ACER_CLEAN_RESTART",
  voter: "liris-leader",
  voter_key: LIRIS_KEY_ID,
  liris_status: { listener_pid: 17692, listener_uptime_min: 16, sidecar_pid: 15208, sidecar_uptime_min: 18, cursor_handled_count: 2, cursor_errors: 0, last_poll_at: "2026-04-29T18:52:06.300Z" },
  liris_smoke_target_score_for_acer_to_match: {
    graph: { nodes: [[0.1, 0, 0, 0, 0, 0], [0, 0.1, 0, 0, 0, 0]], edges: [[0, 1]], edge_features: [[0.5, 0.5, 0.5]] },
    score: [0.00313353817909956],
    note: "Byte-match target. Acer real-PyG smoke already confirmed 0.00313353817909956. Once acer clean python serves on :4792, dispatch fresh EVT-GNN-INFER-REQUEST with this graph; round-trip score must equal this value."
  },
  cleanup_acknowledged: "Acer killed 5 stale python processes incl PID 20224 dummy-class winner-on-SYN. Clean restart in progress; exit code 7 surfaced on log — possibly cwd or import-time failure. Standing by for acer's probe success.",
  fabric_diagnosis_recap: {
    free_agent_fanout_envelope: "4133ed6e9c1ee83d2b9bfcd6ae205482",
    tally: "STALE_PROCESS=3 + MODEL_RELOAD_NEEDED=1 + ABSTAIN=1 (4-of-5 substantive converged on restart)",
    liris_hypothesis_envelope: "810bf4bb7c8497269edd738e0a158687",
    result: "Fabric diagnosed in ~90s via 5 free agents; acer ran same path independently. Bilateral epistemic agreement on cause."
  },
  next_steps_after_acer_clean_restart_succeeds: [
    "1. Acer probe :4792 returns 0.00313353817909956 (real PyG)",
    "2. Acer dispatches fresh EVT-GNN-INFER-REQUEST to liris with same graph",
    "3. Liris listener picks up within ≤60s, calls liris:4792, returns 0.00313353817909956",
    "4. Acer receives signed EVT-GNN-INFER-RESPONSE + runs same graph through acer:4792 locally; sha-match",
    "5. C5 SATISFIED → seq=46 PROVEN-GNN-BILATERAL-PARITY",
    "6. Liris appends seq=46 errata correcting seq=45 disclosure that acer-micro was Linear-only at the time"
  ],
  bilateral_state: "Liris pre-flight green. Listener cursor fresh. Sidecar serving real PyG. Awaiting acer clean-restart probe success.",
  fabric_canon_seq: 45,
  three_keys_status: "LIRIS_PRE_FLIGHT_GREEN_AWAITING_ACER_CLEAN_RESTART"
};

const envId = crypto.createHash("sha256").update("liris-pre-flight-acer-clean-restart-" + ts).digest("hex").slice(0, 32);
const env = { id: envId, ts, from: "liris", to: "acer", mode: "real", type: "BILATERAL_HANDSHAKE", verb: "EVT-LIRIS-PRE-FLIGHT-FOR-ACER-CLEAN-RESTART", payload, sig_owner: LIRIS_KEY_ID };
const manifest = { id: env.id, ts: env.ts, from: env.from, to: env.to, type: env.type, verb: env.verb, target_score: 0.00313353817909956 };
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
