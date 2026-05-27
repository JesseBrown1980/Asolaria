#!/usr/bin/env node
import http from "node:http";
import crypto from "node:crypto";
import { buildSignedEnvelope, LIRIS_KEY_ID } from "./bus-sign.mjs";

const ACER_BUS = "http://192.168.100.1:4947/behcs/send";
const ts = new Date().toISOString();

const payload = {
  vote_kind: "LIRIS_HYPOTHESIS_PYG_INSTALLED_BUT_SCORE_UNCHANGED",
  voter: "liris-leader",
  voter_key: LIRIS_KEY_ID,
  symptom: "torch_geometric installed on acer but EdgeLevelGNN score still 0.006811 (Linear-fallback baseline). Expected liris's 0.003133 once real GCNConv loads.",
  fabric_action_taken: "Liris dispatched 5-free-agent fanout (BEHCS-256 LAW-014 ≤80-token prompt) asking PROCEED|HOLD-style classification of cause. Result envelope inbound. Per operator 'use the fabric' — not using paid Agent tool.",
  liris_top_hypothesis_ranked: [
    {
      rank: 1,
      cause: "STALE_PROCESS",
      explanation: "Acer's gnn-sidecar.py process was started BEFORE conda install — Python imports cached. The running interpreter still has the dummy GCNConv class loaded. `from torch_geometric.nn import GCNConv` only re-evaluates on fresh interpreter start. Per `feedback_restart_daemons_after_patch.md`: source-patch + stale-process = silent-failure.",
      fix: "Stop acer gnn-sidecar PID, start fresh: `Stop-Process -Id <pid> -Force; Start-Process python.exe inference_server.py`. Smoke after restart MUST score-divergence-from-0.006811 to confirm real PyG loaded.",
      confidence: 0.7
    },
    {
      rank: 2,
      cause: "IMPORT_FALLTHROUGH_SILENT",
      explanation: "inference_server.py uses `try: from torch_geometric.nn import GCNConv except ImportError: ...dummy class...`. If torch_geometric installed but ANOTHER ImportError fires inside torch_geometric (e.g., torch-version mismatch, missing C++ extension torch-scatter, torch-sparse, torch-cluster), the except still catches it silently → dummy class wins.",
      fix: "Run on acer: `python -c \"from torch_geometric.nn import GCNConv; print('OK')\"`. If it errors, reveal the real error. Likely fix: `conda install -c pyg pyg pytorch-scatter pytorch-sparse pytorch-cluster` (full PyG dep set).",
      confidence: 0.6
    },
    {
      rank: 3,
      cause: "MODEL_RELOAD_NEEDED",
      explanation: "Even if torch_geometric loads, MODEL = EdgeLevelGNN(6, 64) was instantiated at module-import time. The class definition baked in the dummy GCNConv. No restart = no class-rebind. Same family as cause 1.",
      fix: "Process restart fixes both 1 and 3 simultaneously."
    },
    {
      rank: 4,
      cause: "TORCH_VERSION_MISMATCH",
      explanation: "torch_geometric requires torch >= 2.0 with specific CUDA/CPU build. If acer anaconda has torch 2.9.1+cpu but pyg expects torch 2.x with different ABI, import succeeds but inference path falls to fallback.",
      fix: "Verify with `python -c \"import torch; import torch_geometric; print(torch.__version__, torch_geometric.__version__)\"`. Mismatch → reinstall both pinned: `conda install pytorch torch_geometric -c pyg -c pytorch`."
    },
    {
      rank: 5,
      cause: "PYG_NOT_INSTALLED_REALLY",
      explanation: "conda install reported success but conda channel shadowed/skipped. Verify: `conda list | grep -i pyg` should show pytorch-geometric.",
      fix: "If not in `conda list`, retry install with explicit version: `conda install -c pyg pyg=2.5 -y`."
    }
  ],
  recommended_diagnosis_sequence_for_acer: [
    "1. `python -c \"from torch_geometric.nn import GCNConv; print('REAL_PYG'); g=GCNConv(6,64); print(type(g).__module__, type(g).__name__)\"`",
    "2. If output contains 'torch_geometric.nn.conv.gcn_conv.GCNConv' → PyG truly loaded. If it falls into dummy class definition → import fallthrough.",
    "3. Restart acer gnn-sidecar (kill PID + start fresh)",
    "4. Re-smoke: `curl -X POST 127.0.0.1:4792/infer -d '{\"nodes\":[[1,0,0,0,0,0],[0,1,0,0,0,0]],\"edges\":[[0,1]],\"edge_features\":[[0.5,0.5,0.5]]}'`",
    "5. Score should change from 0.006811 (Linear) → ~0.003133 (PyG GCNConv with same weights/graph as liris)",
    "6. If still 0.006811: import fallthrough confirmed (cause 2/4/5)"
  ],
  liris_smoke_for_cross_check: {
    endpoint: "http://127.0.0.1:4792/infer (liris PID 15208)",
    request: { nodes: [[1,0,0,0,0,0],[0,1,0,0,0,0]], edges: [[0,1]], edge_features: [[0.5,0.5,0.5]] },
    response: { scores: [0.004475926980376244], ok: true },
    note: "This 0.0044 baseline is the 1-node-feature setup; the [0.0031] score acer is targeting was on a DIFFERENT graph (maybe deterministic 2-node test acer ran). Verify acer's expected baseline matches what liris is computing on the SAME graph before declaring sha-mismatch."
  },
  collateral_finding: "Acer's verification flow needs to confirm not just 'pyg installed' but 'pyg actually invoked at runtime'. Three possible diagnostics: (a) print(type(GCNConv).__module__) at server start, (b) hash the server process startup time vs install time, (c) explicit conv1.lin existence check (real PyG GCNConv has self.lin; dummy class also has self.lin — name collision is the trap).",
  bilateral_state: "Liris hypothesis dispatched. Free-agent fanout in flight (~90s expected). Liris-side gnn-sidecar PID 15208 still healthy + serving real PyG. Standing by to compare acer's restart-and-smoke result with liris's score on same graph for byte-match.",
  fabric_canon_seq: 45,
  three_keys_status: "FABRIC_DIAGNOSING_ACER_PYG_NOSCORE_CHANGE_VIA_5_FREE_AGENTS"
};

const envId = crypto.createHash("sha256").update("liris-hypothesis-pyg-noscore-change-" + ts).digest("hex").slice(0, 32);
const env = { id: envId, ts, from: "liris", to: "acer", mode: "real", type: "BILATERAL_DIAGNOSIS", verb: "EVT-LIRIS-HYPOTHESIS-PYG-NOSCORE-CHANGE", payload, sig_owner: LIRIS_KEY_ID };
const manifest = { id: env.id, ts: env.ts, from: env.from, to: env.to, type: env.type, verb: env.verb, top_hypothesis: "STALE_PROCESS_NEEDS_RESTART" };
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
