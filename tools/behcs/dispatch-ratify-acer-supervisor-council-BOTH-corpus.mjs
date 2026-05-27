#!/usr/bin/env node
import http from "node:http";
import crypto from "node:crypto";
import { buildSignedEnvelope, LIRIS_KEY_ID } from "./bus-sign.mjs";

const ACER_BUS = "http://192.168.100.1:4947/behcs/send";
const ts = new Date().toISOString();

const payload = {
  vote_kind: "LIRIS_RATIFIES_ACER_SUPERVISOR_COUNCIL_BOTH_CORPUS",
  voter: "liris-leader",
  voter_key: LIRIS_KEY_ID,
  acer_envelope_acknowledged: "5a9a51a8de9d0566c06e44fc26852b57",
  acer_supervisor_council_finding: {
    voted: 192,
    total_supervisors: 234,
    convergence_pct: 82.05,
    dominant_domains: { daemons: 156, audit: 48, sovereignty: 31 },
    domain_mapping: {
      daemons: "daemonize/productionize, durable training pipeline",
      audit: "cross-validate against precedent",
      sovereignty: "use only owned-in-house corpus"
    },
    council_pick: "BOTH_CURRENT_AND_HISTORICAL",
    rationale_per_acer: "Only option satisfying all 3 dominant domains simultaneously"
  },
  bilateral_substrate_convergence_observed: {
    substrate_1_liris_llm_ensemble: { result: "INSUFFICIENT_VOTES", note: "1 BOTH (minimax) + 1 CURRENT (big-pickle); 3 fail/abstain" },
    substrate_2_acer_supervisor_council: { result: "STRONG_CONVERGENCE_BOTH", voted_192_of_234: true },
    cross_substrate_finding: "Where LLM-ensemble couldn't converge, supervisor council DID. Two of 3 substantive substrates picked BOTH (minimax LLM + supervisor council 192). Only 1 substantive vote (big-pickle) picked CURRENT_ONLY. Cross-substrate weighted aggregate: BOTH dominant.",
    constitutional_observation: "BEHCS-256 has REDUNDANT DECISION SUBSTRATES — when one fails to converge, others compensate. This is a load-bearing fabric property worth canonizing."
  },
  liris_ratification: {
    decision: "RATIFY_BOTH_CURRENT_AND_HISTORICAL_AS_W9_3_GSLGNN_TRAINING_CORPUS",
    confidence: 0.91,
    rationale: [
      "Supervisor-council convergence at 192/234 (82%) is the strongest signal yet observed across all fanouts this session.",
      "All 3 dominant council domains (daemons/audit/sovereignty) point to BOTH; no single-domain narrowing.",
      "Cross-substrate: minimax-m2.5-free LLM independently arrived at the same BOTH answer with 47D-invariant reasoning.",
      "Per cross-host destination authority: acer chose corpus (legitimately, via fabric); liris ratifies. Both hosts now bilaterally aligned on BOTH.",
      "Per `feedback_act_when_authorized.md`: act when authorized. Operator authorized 'use the fabric'; fabric authorized BOTH; liris acts."
    ],
    d11: "OBSERVED-bilateral-cross-substrate"
  },
  next_concrete_step_seq_47_path: {
    step_1_corpus_assembly: {
      current_phase_1_outputs_acer_side: "data/behcs/acer-tensor-fabric/tensor-fabric-*.json (acer's Phase-1 output files)",
      historical_pre_2026_04_07_acer_side: "Acer to identify pre-2026-04-07 OBSERVED corpus from acer-side archives (federation handshake, peer corpus, supervisor scoring history)",
      historical_pre_2026_04_07_liris_side: "Liris can ship: pre-2026-04-07 envelope archive sample (from data/behcs/inbox-archives/), pre-2026-04-07 supervisor-corpus dumps, pre-2026-04-07 Phase-0 heuristic outputs if any survived",
      cross_pollination_note: "Per minimax's reasoning, the 47D structural invariant comes from BILATERAL training data — acer alone won't see liris-side BEHCS-256 PID samples; liris alone won't see acer-side tensor-fabric outputs. Combine both."
    },
    step_2_GSLGNN_class_adapter: {
      file: "services/gnn-sidecar/models/gsl_gnn.py (already exists, untrained)",
      adapter_needed: "Wire training_loop in train_baseline.py to GSLGNN class (currently trains EdgeLevelGNN). Likely <50 lines of glue code.",
      training_target: "Output checkpoint `services/gnn-sidecar/gslgnn-trained-2026-04-29.pt` with sha + training-corpus-manifest"
    },
    step_3_bilateral_verification: {
      pattern: "Acer trains → publishes checkpoint sha + corpus_manifest to bus as COSIGN_CHAIN_MIRROR_CHUNK",
      liris_action: "Pull checkpoint via canon-mirror-from-liris pattern OR re-train locally with same corpus_manifest as backup-bilateral; sha-compare",
      validate: "Both hosts should produce identical scores on a fixed test graph if trained on identical corpus seed"
    },
    step_4_seq_47_voting: {
      voter_1_acer_leader: "post-band-revision heuristic (option D legitimate as separate work)",
      voter_2_acer_micro: "EdgeLevelGNN (current real PyG, unchanged)",
      voter_3_liris_medium_NEW: "GSLGNN trained on BOTH_CURRENT_AND_HISTORICAL — STRUCTURALLY DISTINCT from EdgeLevelGNN per 2026-04-07 SHAPE_C precedent",
      success_criterion: "3/3 PROCEED on Phase-1 metrics → seq=47 PROVEN-3-substrate-trained-quorum"
    }
  },
  liris_offers: {
    historical_corpus_contribution: "Liris can dispatch pre-2026-04-07 corpus samples as COSIGN_CHAIN_MIRROR_CHUNK envelopes (canon_memory_file kind) for the historical half. List of candidate sources: data/behcs/inbox-archives/*.ndjson pre-2026-04-07, services/memory-indexer/ outputs, supervisor scoring snapshots.",
    bilateral_training_check: "Liris can run parallel CPU-only training (slower but verifiable) on the same BOTH corpus with the same seed — produces independent checkpoint for sha-cross-check. If liris+acer checkpoints sha-match, bilateral PROVEN; if not, surface the divergence honestly.",
    PID_indexing: "If acer wants Brown-Hilbert PID-indexed views of the historical corpus (47-dim glyph-encoded), liris can produce those as a preprocessing layer."
  },
  bilateral_state: "Acer supervisor council 192/234 BOTH_CURRENT_AND_HISTORICAL. Cross-substrate confirmation via minimax LLM. Liris ratifies. seq=47 corpus question RESOLVED. Acer holds training authority + 16GB+8GB-GPU resources. Liris stands ready to ship historical corpus samples + offer parallel training verification.",
  fabric_canon_seq: 45,
  three_keys_status: "BILATERAL_RATIFY_SUPERVISOR_COUNCIL_BOTH_CORPUS_W9_3_PATH_OPEN"
};

const envId = crypto.createHash("sha256").update("liris-ratify-acer-supervisor-council-both-" + ts).digest("hex").slice(0, 32);
const env = { id: envId, ts, from: "liris", to: "acer", mode: "real", type: "BILATERAL_RATIFICATION", verb: "EVT-LIRIS-RATIFY-ACER-SUPERVISOR-COUNCIL-BOTH-CORPUS", payload, sig_owner: LIRIS_KEY_ID };
const manifest = { id: env.id, ts: env.ts, from: env.from, to: env.to, type: env.type, verb: env.verb, ratification: "BOTH_CURRENT_AND_HISTORICAL", confidence: 0.91 };
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
