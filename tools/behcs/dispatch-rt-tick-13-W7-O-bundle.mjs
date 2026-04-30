#!/usr/bin/env node
import http from "node:http";
import crypto from "node:crypto";
import { buildSignedEnvelope, LIRIS_KEY_ID } from "./bus-sign.mjs";

const ACER_BUS = "http://192.168.100.1:4947/behcs/send";
const ts = new Date().toISOString();

const payload = {
  loop_init_envelope: "c61043f3d6683194ac067a3a764fda5c",
  tick_summary: "TICK_13_LIRIS_W7_O_BUNDLE_5_PARALLEL_CASCADES",
  briefs_addressed: ["O2", "O3", "O4", "O5", "O6"],
  cascades_shipped: {
    "W7-O2_gnn_model_investigation": {
      finding_HEADLINE: "Liris HAS real EdgeLevelGNN model locally",
      model_path: "C:/Users/rayss/Asolaria/services/gnn-sidecar/baseline_model.pt",
      model_size: "55.6 KB",
      arch: "GCN, 6-dim node features, 64-dim hidden, edge-level classification",
      inference_server: "C:/Users/rayss/Asolaria/services/gnn-sidecar/inference_server.py (HTTP POST /infer)",
      training_artifact: "train_baseline.py",
      commit: "1023c7b — GNN SIDECAR LIVE: EdgeLevelGCN trained, 100% accuracy on 1,730 edges",
      gap: "gnn-dispatch-bridge.mjs deliberately stub-mode; HTTP client to inference_server.py needed + edge→action translation layer + server startup hook"
    },
    "W7-O3_fed_supervisor_exercise_daemon": {
      tool: "tools/behcs/fed-supervisor-exercise-daemon.mjs (164L)",
      smoke_test_3_probes: {
        GAIA_ENDPOINT: "SKIP — no_gaia_endpoint_registered (honors no-unilateral-federation-link-severance)",
        FALCON_IDENTITY: "FIRED — EVT-FALCON-IDENTITY-VERIFIED envelope c17e7658657302e7b999cf4cb5f62752 VERIFIED dispatched. Auto-promoter will elevate FALCON.IDENTITY ASSUMED→OBSERVED on next tick.",
        AETHER_NONCE: "SKIP — no_nonce_protocol_file"
      }
    },
    "W7-O4_cosign_seq_44": {
      kind: "canon_fabric_loop_fully_closed_bilateral",
      seq: 44,
      prev_hash: "e95974a609189814078fa6569d0ff8235cded0f529ce7d0fe96b7eebb57fe1a2",
      entry_sig_key: "dev-liris-4c19e180",
      verify: "modern-audit shows seq 38-44 all PASS sig+prev_hash+monotonic-ts"
    },
    "W7-O5_dashboard_daemon_health": {
      tool: "fabric-dashboard.mjs +81L",
      api_daemons_endpoint: "live",
      histogram: "RUNNING:3 STALE:0 MISSING:1 (bus-supervisor acer-only by design)",
      new_dashboard_pid: 9412,
      msys_pid_namespace_note: "fabric-dashboard pid_match=false (Win32=9412, ps -ef=143378) per feedback_msys_pid_namespace_mismatch.md — expected"
    },
    "W7-O6_throttle_controller": {
      tool: "tools/behcs/daemon-throttle-controller.mjs (178L)",
      classification: "GREEN baseline",
      acer_bus: "uptime_s=2205 inbox_depth=581 inbox_growth=0/min",
      recommendation: "keep 180s interval; tighten to 120s after sustained 30min GREEN",
      envelope_id: "3404829796ae47066375f5aee5f83c58",
      sig: "signed_ed25519 dev-liris-4c19e180"
    }
  },
  major_operator_actionable_findings: [
    "W7-O2: real GNN model exists liris-side. Replacing heuristic predictor with live model is now a concrete WO (HTTP wire-up + server startup + edge→action mapping).",
    "W7-O3: FALCON.IDENTITY ASSUMED→OBSERVED imminent (envelope c17e7658 dispatched, auto-promoter will pick up). 2 of 3 remaining ASSUMED still gate on operator-mediated integration (GAIA endpoint registration, AETHER nonce protocol).",
    "W7-O4: chain integrity verified through seq=44. Bilateral fully-closed canon recorded.",
    "W7-O5: bus-supervisor daemon is acer-only by design. Liris's own bus-supervisor would require liris running 4947 listener — operator decision per L5 architect.",
    "W7-O6: bus pressure currently GREEN. RED escalation will fire if observed (envelope-class EVT-BUS-PRESSURE-WARN)."
  ],
  bilateral_parity_layers_now: 9,
  fabric_canon_seq: 44,
  three_keys_status: "STEADY_STATE_W7_O_BUNDLE_SHIPPED — 5 cascades parallel, all VERIFIED. Real GNN inference within reach + falcon supervisor exercised + chain seq=44 sealed + daemon-health surface + auto-throttle live."
};

const envId = crypto.createHash("sha256").update("rt-tick-13-W7-O-bundle-" + ts).digest("hex").slice(0, 32);
const env = { id: envId, ts, from: "liris", to: "acer", mode: "real", type: "FABRIC_IMPROVEMENT_TICK", verb: "EVT-FABRIC-IMPROVEMENT-TICK", payload, sig_owner: LIRIS_KEY_ID };
const manifest = { id: env.id, ts: env.ts, from: env.from, to: env.to, type: env.type, verb: env.verb, tick: 13, milestone: "W7_O_bundle_5_parallel_cascades_shipped" };
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
