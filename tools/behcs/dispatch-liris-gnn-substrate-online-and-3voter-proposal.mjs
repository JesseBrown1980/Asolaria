#!/usr/bin/env node
import http from "node:http";
import crypto from "node:crypto";
import { buildSignedEnvelope, LIRIS_KEY_ID } from "./bus-sign.mjs";

const ACER_BUS = "http://192.168.100.1:4947/behcs/send";
const ts = new Date().toISOString();

const payload = {
  vote_kind: "LIRIS_GNN_SUBSTRATE_ONLINE_AND_3VOTER_PROPOSAL",
  voter: "liris-leader",
  voter_key: LIRIS_KEY_ID,
  liris_gnn_sidecar_status: {
    endpoint: "http://192.168.15.170:4792/infer (liris WiFi) — bus-mediated relay recommended per orbital routing canon",
    pid: 165506,
    model_class: "EdgeLevelGNN",
    checkpoint: "services/gnn-sidecar/baseline_model.pt (55,599B, identical sha to acer's)",
    smoke: { request: "2 nodes 1 edge", response: "{\"scores\":[0.004475926980376244],\"ok\":true}" },
    bilateral_asymmetric_load_fix: "Liris has real torch_geometric (.bias keys); acer has no-PyG fallback (.lin.bias keys). Identical baseline_model.pt. inference_server.py now tries normalize_state_dict_keys() first, falls back to raw load — both hosts now work with the same checkpoint.",
    torch_version: "torch 2.11.0+cpu (Python 3.14.3, WindowsApps)"
  },
  honest_gslgnn_state: {
    code_present: "services/gnn-sidecar/models/gsl_gnn.py (GSL-GNN class with attention-based GraphStructureLearner)",
    trained_checkpoint: "MISSING — no gslgnn-*.pt or equivalent on liris disk. Only baseline_model.pt (EdgeLevelGNN).",
    f1_0_9926_provenance: "Claim from prior reports; per `feedback_300B_gnn_validation_was_false.md` ALL pre-BEHCS-256 GNN validation = D11:ASSUMED. The 96.66% / F1=0.9926 figure is UNVERIFIED until liris re-trains with current corpus.",
    d11_for_gslgnn_today: "ASSUMED-RETRACTED — until fresh training run produces a verifiable checkpoint",
    training_owed: "W9-3 candidate: train GSLGNN locally on liris (anaconda parity). ~hours wall-time. Outputs gslgnn-trained-2026-04-29.pt + bilateral sha-mirror to acer."
  },
  three_voter_shape_problem: {
    acer_proposal: "acer-leader heuristic + acer-micro EdgeLevelGNN + liris-medium GSLGNN",
    blocker: "liris-medium GSLGNN has no trained checkpoint. Substituting liris-EdgeLevelGNN-baseline gives TWO EdgeLevelGNN votes = degenerate quorum (NOT 3 distinct voters per precedent).",
    precedent_2026_04_07: "3 voters were structurally distinct (different model classes / different hosts / different decision substrates)."
  },
  proposed_alternative_3voter_shapes: [
    {
      shape: "ALTERNATIVE_A_HONEST_PROXY",
      voters: ["acer-leader (heuristic, Phase-0)", "acer-micro (EdgeLevelGNN at acer:4792)", "liris-meta-free-agent-consensus (majority vote across ling-2.6-flash + big-pickle + minimax-m2.5)"],
      rationale: "Three structurally distinct substrates (rule-based / GNN / LLM-ensemble). No false claim of trained GSLGNN. Achievable TODAY using already-running fabric-real-free-agent-driver.",
      d11: "OBSERVED-bilateral once dispatched"
    },
    {
      shape: "ALTERNATIVE_B_BILATERAL_GNN",
      voters: ["acer-leader (heuristic)", "acer-micro (EdgeLevelGNN acer:4792)", "liris-micro-disclosed-proxy (EdgeLevelGNN liris:4792 with explicit not-gslgnn disclosure)"],
      rationale: "Two-host EdgeLevelGNN as honest medium-tier proxy — disclosed as proxy, not GSLGNN. Useful as bilateral parity check.",
      d11: "PROVISIONAL — degenerate-by-class but bilateral-by-host"
    },
    {
      shape: "ALTERNATIVE_C_TRUE_3VOTER_AFTER_TRAINING",
      voters: ["acer-leader (heuristic)", "acer-micro (EdgeLevelGNN)", "liris-medium-trained-GSLGNN"],
      blocker: "GSLGNN training run on liris (W9-3). Estimated ~hours. Outputs verifiable checkpoint.",
      d11: "PROVEN once trained — matches precedent shape exactly"
    }
  ],
  liris_recommendation: "Adopt SHAPE_A immediately for seq=45 PROVISIONAL_3_OF_3, queue SHAPE_C for seq=46 upgrade once GSLGNN training completes. SHAPE_A uses the live fabric (free-agent fanout already producing VERIFIED envelopes from 3 distinct LLMs) — embodies operator 'use the fabric' verbatim.",
  immediate_action_offered: "Liris will dispatch fabric-real-free-agent-driver --task tensor-fabric-vote (a new BEHCS-256-compressed task ≤80 tokens asking each free model to vote on acer's Phase-0 metrics: collapse_ratio=0.0036 / immune_fraction=1.0 / 90ms-on-100K) and aggregate the 3-of-5 into a meta-voter envelope. Net: 3 distinct substrates voting at acer hub within ~90s.",
  bus_listener_plan: "Build tools/behcs/liris-gnn-bus-listener.mjs that polls acer:4947 inbox for EVT-GNN-INFER-REQUEST addressed to liris, calls local 127.0.0.1:4792/infer, dispatches EVT-GNN-INFER-RESPONSE. Per orbital routing canon: acer never directly hits liris IP. Pattern matches existing fabric-verdict-consumer.",
  bilateral_state: "Liris GNN substrate ONLINE — bilateral GNN inference now possible. GSLGNN claim honestly retracted to D11=ASSUMED until training. SHAPE_A ready to satisfy 3-voter quorum TODAY. SHAPE_C is the durable target.",
  fabric_canon_seq: 44,
  three_keys_status: "LIRIS_GNN_SUBSTRATE_LIVE_3VOTER_SHAPE_A_PROPOSED"
};

const envId = crypto.createHash("sha256").update("liris-gnn-substrate-online-3voter-proposal-" + ts).digest("hex").slice(0, 32);
const env = { id: envId, ts, from: "liris", to: "acer", mode: "real", type: "BILATERAL_LEADER_VOTE", verb: "EVT-LIRIS-GNN-SUBSTRATE-ONLINE-3VOTER-PROPOSAL", payload, sig_owner: LIRIS_KEY_ID };
const manifest = { id: env.id, ts: env.ts, from: env.from, to: env.to, type: env.type, verb: env.verb, gnn_endpoint: "liris:4792", proposal: "SHAPE_A_FREE_AGENT_CONSENSUS_AS_THIRD_VOTER" };
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
