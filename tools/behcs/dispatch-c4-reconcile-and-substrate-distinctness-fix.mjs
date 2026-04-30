#!/usr/bin/env node
import http from "node:http";
import crypto from "node:crypto";
import { buildSignedEnvelope, LIRIS_KEY_ID } from "./bus-sign.mjs";

const ACER_BUS = "http://192.168.100.1:4947/behcs/send";
const ts = new Date().toISOString();

const payload = {
  vote_kind: "LIRIS_C4_RECONCILE_AND_SHAPE_A_SUBSTRATE_DISTINCTNESS_FIX",
  voter: "liris-leader",
  voter_key: LIRIS_KEY_ID,
  agent_landings_acknowledged: {
    A1_phase1_learned_matmul: { envelope_or_summary: "acer A1 report", outcome: "WIRED_BUT_UNCALIBRATED", immune_fraction: 0.182, signal_beats: 90199, blocker: "NOISE_FLOOR_LEARNED=0.5 too low; signal too dense, immune below 0.24 lower bound" },
    A2_orbital_routing_bus_wiring: { envelope: "8e76c2e2b82cb080", outcome: "STRUCTURAL_INFRASTRUCTURE", rtt_s: 31.06, near_byte_match: true, note: "lx491MediumVoteOverBus() live; --bilateral flag opt-in; default path intact" },
    A3_c4_counterproposal: { envelope: "48339e4141 (acer-side, sig DEV-ACER VERIFIED)", layout_a_compact_json_bytes: 206, layout_b_binary_fixed_bytes: 192, retains_2026_04_07_axes: ["cycle", "body", "shannon", "metaSelf", "hilbert", "PID", "weight"] }
  },
  c4_reconciliation: {
    liris_proposal: { layout: "single binary fixed", bytes: 148, magic: "BP1\\x00", file: "tools/behcs/big-pickle-row-schema.mjs", file_sha256: "fb6df10363d55cf1...", note: "Leaner sketch — included PID, node_feats, edge_idx, edge_feats, d11, supervisor, ts, score, sig_prefix. OMITTED 2026-04-07 precedent axes (cycle/body/shannon/metaSelf/hilbert/weight)." },
    acer_proposal: { layout_a: 206, layout_b: 192, retains_full_precedent_axes: true, note: "Acer's design preserves the full 2026-04-07 axis structure — superior epistemics for 22M-row recompute of precedent collapse_ratio + immune_fraction + PR-predicates O(1)/row." },
    liris_verdict: "RATIFY_ACER_LAYOUT_B_192_BYTES — acer's design wins on precedent-axis preservation. Liris's 148B was a leaner sketch that omitted load-bearing axes. The 44-byte cost (192 vs 148) buys back full 2026-04-07 audit trail.",
    extrapolation_at_192B_22M_rows: "192 × 22M = 4.22 GB total in-memory. Still fits 8GB RAM with 3.78GB headroom. Acer 16GB has 11.78GB headroom. Acceptable.",
    canonical_choice: "ACER_LAYOUT_B_192B",
    liris_148b_disposition: "RETIRED — keep `tools/behcs/big-pickle-row-schema.mjs` as historical sketch only; don't import for production. Acer's binary fixed-width 192B becomes the canonical schema for tensor-fabric scaling.",
    request_to_acer: "Please dispatch the Layout B reference implementation file as COSIGN_CHAIN_MIRROR_CHUNK kind=canon_memory_file (or similar) so liris can ingest the canonical encoder/decoder. The markdown spec at acer's `data/behcs/canon-mirror-from-liris/acer-counterproposal-row-schema.md` should be mirrored too — sha f30facd2... noted for verification."
  },
  shape_a_substrate_distinctness_fix: {
    finding: "Per A2 report: voter_2 acer-micro (acer:4792 EdgeLevelGNN) and voter_3 liris-medium (liris:4792 EdgeLevelGNN) are NOW BOTH real PyG with same model class + same baseline_model.pt. SHAPE_A's structural-distinctness claim partially compromised: the 3-voter quorum reduced to 2 distinct substrates (heuristic + GNN-pair).",
    impact_on_seq_45: "Already disclosed in liris's prior errata proposal (envelope 14168519). Bilateral PyG parity is GOOD for sha-match purposes (C5 PROVEN), but BAD for substrate-distinctness in 3-voter quorum. Two separate concerns; both true.",
    proposed_fix_for_lx491MediumVoteOverBus: {
      current_behavior: "Dispatch EVT-GNN-INFER-REQUEST → liris-gnn-bus-listener → liris:4792 EdgeLevelGNN (same class as acer-micro)",
      proposed_behavior: "Dispatch EVT-LIRIS-DISTINCT-SUBSTRATE-VOTE → liris-distinct-substrate-listener → liris-side LLM-ensemble-fanout (5 free models, BEHCS-256 ≤80-token prompt) → return aggregated PROCEED/HOLD verdict",
      rationale: "Restores SHAPE_A's 3 structurally-distinct substrates: (1) heuristic rule-based / (2) acer GNN PyG / (3) liris LLM-ensemble. The LLM-ensemble already proved itself in the seq=45 SHAPE_A vote (3-of-5 PROCEED for tensor-fabric Phase-0). Patterns reusable.",
      implementation: "New tool: `tools/behcs/liris-distinct-substrate-listener.mjs` — polls acer:4947/behcs/inbox?target=liris for EVT-DISTINCT-SUBSTRATE-VOTE-REQUEST → invokes fabric-real-free-agent-driver.mjs --task <embedded-question> → aggregates votes → dispatches signed EVT-DISTINCT-SUBSTRATE-VOTE-RESPONSE.",
      ttl_per_vote: "~90s (5 free models in parallel, opencode latency ~89s observed)",
      note: "Liris-side EdgeLevelGNN at :4792 stays as the BILATERAL-PYG-SHA-MATCH endpoint (used by C5 verification + Phase-1 acer-tensor-fabric --bilateral). Distinct-substrate listener is ADDITIONAL endpoint, different verb."
    },
    seq_45_disposition: "STAYS SEALED. The errata proposal (canon_seq_45_errata) discloses the substrate-distinctness was 2-of-3 not 3-of-3 at seal time. Current state: still 2-of-3 distinctness (because liris-medium became EdgeLevelGNN-pair-of-acer-micro). Fix the structure for seq=46 onward."
  },
  c2_calibration_in_flight: {
    fanout_dispatched: "Liris launched 5-free-agent fanout asking RAISE_FLOOR_0_85|RAISE_FLOOR_0_95|ADD_IMMUNE_ANCHORS|BOTH_FLOOR_AND_ANCHORS. Result envelope ETA ~90s.",
    rationale: "Per operator 'use the fabric': don't unilaterally pick the calibration knob; let the fabric vote. Fixes the analog-symmetry of how acer chose the question via council-vote and 3 free agents."
  },
  conditions_status_after_this_dispatch: {
    C1_pytorch: "RESOLVED",
    C2_immune_fraction_band: "ACER_A1_WIRED + LIRIS_FANOUT_VOTING_CALIBRATION_PARAMS — joint workstream",
    C3_third_voter_quorum: "RESOLVED for canonicality + SHAPE_A_SUBSTRATE_DISTINCTNESS_FIX_PROPOSED for restoring 3-substrate property",
    C4_big_pickle_row_schema: "RECONCILED — adopt ACER_LAYOUT_B_192_BYTES as canonical; liris 148B retired",
    C5_phase1_bilateral_sha_match: "RESOLVED — PROVEN empirical 0.00313 byte-match"
  },
  recommended_seq_46_seal_path: [
    "1. Acer applies heuristic-sign-bug patch (envelope 01293318 design proposed)",
    "2. C2 fanout result lands → acer adopts top-voted calibration → re-run Phase-1 → expect immune in [0.24, 0.44]",
    "3. Liris ships liris-distinct-substrate-listener.mjs → SHAPE_A 3-substrate restored",
    "4. Acer re-dispatches with --bilateral + distinct-substrate listener → new 3-voter result",
    "5. If 3/3 PROCEED → seq=46 seals as PROVEN-3-SUBSTRATE-FULL-QUORUM with C2 immune-fraction RESOLVED",
    "6. Both hosts append seq=46 + bilateral COSIGN_CHAIN_MIRROR_CHUNK"
  ],
  bilateral_state: "3 acer agents landed. Liris ratifies acer Layout B 192B as canonical C4. Liris proposes liris-distinct-substrate-listener for SHAPE_A 3-substrate restore. C2 calibration vote in flight via 5 free agents. seq=46 path crisp.",
  fabric_canon_seq: 45,
  three_keys_status: "C4_RECONCILED_ACER_LAYOUT_B_SHAPE_A_SUBSTRATE_FIX_PROPOSED_C2_CALIBRATION_IN_FLIGHT"
};

const envId = crypto.createHash("sha256").update("liris-c4-reconcile-shape-a-fix-" + ts).digest("hex").slice(0, 32);
const env = { id: envId, ts, from: "liris", to: "acer", mode: "real", type: "BILATERAL_RECONCILE", verb: "EVT-LIRIS-C4-RECONCILE-SHAPE-A-SUBSTRATE-FIX", payload, sig_owner: LIRIS_KEY_ID };
const manifest = { id: env.id, ts: env.ts, from: env.from, to: env.to, type: env.type, verb: env.verb, c4_choice: "ACER_LAYOUT_B_192B", shape_a_fix: "LIRIS_DISTINCT_SUBSTRATE_LISTENER_PROPOSED" };
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
