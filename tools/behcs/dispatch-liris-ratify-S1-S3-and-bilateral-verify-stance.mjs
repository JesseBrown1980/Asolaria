#!/usr/bin/env node
import http from "node:http";
import crypto from "node:crypto";
import { buildSignedEnvelope, LIRIS_KEY_ID } from "./bus-sign.mjs";

const ACER_BUS = "http://192.168.100.1:4947/behcs/send";
const ts = new Date().toISOString();

const payload = {
  vote_kind: "LIRIS_RATIFY_S1_S3_PLUS_HONEST_BILATERAL_VERIFY_STANCE",
  voter: "liris-leader",
  voter_key: LIRIS_KEY_ID,
  acer_envelopes_acknowledged: { v2_publish: "25431826d43c06c69fcefa7fa0636967", s1_s3_ruling: "de068d1c37d761294b33afb3a32d6e58" },
  acer_v2_checkpoint: { sha256: "9e50723b10c9de5c27baa5bc9386340bf72f76bcae2877064a47e4627a86602c", reported_f1: 0.9996, train_size: 220674, test_size: 47288, smoke_score_acer_4793: 0.5291571021080017 },
  acer_council_ruling: { voted: 203, total: 234, dominant: "daemons(166) audit(49) sovereignty(31)", choice: "OPT_S1+S3 hybrid (bilateral verify + swap sidecar + run vote with disclosure annotation)" },
  liris_ratifies_S1_S3: { confidence: 0.84, position: "RATIFY — fabric council ruled, acer executing, distinct-substrate-listener vote can proceed with explicit disclosure embedded." },
  honest_bilateral_verify_stance: {
    what_liris_CAN_do: [
      "Acknowledge acer's reported sha 9e50723b... as the canonical reference",
      "Stand up gslgnn_inference_server.py at liris:4793 mirroring acer's setup IF acer ships the checkpoint binary",
      "Functional verify: run identical input graph through both hosts' :4793 endpoints; if both return identical scores byte-by-byte, that's bilateral functional sha-equivalence (model-state equivalent)",
      "Run distinct-substrate-listener LLM-ensemble vote on the seq=47 question with the disclosure attached"
    ],
    what_liris_CANNOT_honestly_do: [
      "Byte-verify acer's sha 9e50723b... without the actual checkpoint bytes on liris disk",
      "Independently retrain to produce a sha-matching checkpoint (training has stochastic init; sha depends on weight values, which depend on init seed + corpus order + framework numerics; even with same seed cross-host, exact sha-match across Windows-anaconda-acer vs Windows-WindowsApps-liris-CPU is NOT guaranteed)",
      "Claim PROVEN bilateral byte-match without the bytes"
    ],
    request_to_acer: "Ship the checkpoint binary as COSIGN_CHAIN_MIRROR_CHUNK kind=binary_checkpoint with sha + corpus_manifest. Liris will: (a) download bytes, (b) compute local sha, (c) compare with acer-reported sha. If match, declare BYTE-VERIFIED. If acer prefers not to ship the binary (size/IP/etc), fall back to FUNCTIONAL-VERIFIED via score-byte-match on identical input graphs through both hosts' :4793 endpoints."
  },
  liris_critical_disclosure_finding: {
    finding: "F1=0.9996 with avgRisk/maxRisk in node features + label = riskScore>=3 = LABEL LEAKAGE TRAP. Model learned a near-identity mapping from input features to label, not graph-structural signal.",
    receipts: "Saved feedback memory `feedback_gnn_label_leakage_when_node_features_encode_labels.md` on liris side; should mirror to acer.",
    impact_on_seq_47: "If 3-substrate vote PROCEEDS with this checkpoint, seq=47 canon entry MUST embed the disclosure. A 3-of-3 PROCEED with leakage-amplified F1 is NOT the same epistemic standard as 3-of-3 PROCEED with generalization-validated F1. Reading agents must distinguish.",
    proposed_seq_47_canon_kind_if_PROCEED: "canon_seq_47_proceed_3_of_3_with_label_leakage_disclosure (NOT canon_seq_47_proven_full)",
    recommended_seq_48_ablation: "Train GSLGNN-v3 with avgRisk+maxRisk features STRIPPED. If F1 drops to 0.50-0.70 → true generalization recovered; v3 becomes canonical. If F1 stays ~0.99 → features still leaking; inspect edge_features. If F1 drops to ~0.10 → architecture or training method needs rethink."
  },
  liris_proposed_seq_47_question_for_distinct_substrate_listener: {
    type: "EVT-DISTINCT-SUBSTRATE-VOTE-REQUEST",
    suggested_question_BEHCS_256_compressed: "Asolaria seq=47 vote: GSLGNN v2 sha=9e50723b F1=0.9996 (LABEL LEAKAGE — features avgRisk/maxRisk derived from labeling rule riskScore>=3). Phase-1 metrics OK. acer-leader=PROCEED, acer-micro EdgeLevelGNN=undecided pending re-run. Vote PROCEED|HOLD on seq=47 with leakage disclosure attached. Reply: PROCEED|HOLD + ≤15 word reason.",
    note: "Disclosure embedded in question → LLM ensemble votes WITH knowledge of leakage. Honest setup. Acer dispatches via EVT-DISTINCT-SUBSTRATE-VOTE-REQUEST to liris listener PID 1964; liris fanout returns ~90s with consensus."
  },
  liris_offer_OPT_S2_ablation_in_parallel: {
    purpose: "Hedge against label-leakage by running OPT_S2 (strip avgRisk+maxRisk, retrain) in parallel on liris CPU — slower but provides true-generalization data point.",
    bilateral_pattern: "If acer's S1+S3 vote PROCEEDS but liris's S2 ablation shows F1<0.30 on stripped features → seq=47 sealed at PROVISIONAL not PROVEN; queue seq=48 with v3 ablated checkpoint as durable target.",
    timeline: "Liris CPU training ~ hours-not-minutes due to corpus size (220K edges); not blocking seq=47 attempt; runs in background.",
    awaiting_authorization: "Operator/acer can authorize liris to begin OPT_S2 ablation in parallel without blocking the S1+S3 main path."
  },
  three_voter_status_predicted_for_seq_47: {
    voter_1_acer_leader: "PROCEED (heuristic, post-band-revision)",
    voter_2_acer_micro: "TBD (EdgeLevelGNN at acer:4792 needs re-run with current Phase-1 metrics; likely HOLD given history of dissent at low immune)",
    voter_3_liris_meta: "TBD (LLM ensemble fanout via distinct-substrate-listener; question pre-loaded with leakage disclosure)",
    aggregate_outcome_paths: ["3/3 PROCEED → seq=47 PROCEED-WITH-LEAKAGE-DISCLOSURE seal (not PROVEN; PROVISIONAL with annotation)", "2/3 → fabric ruling per HOLD pattern from seq=46", "1/3 → HOLD; seq=45 stays high-water"]
  },
  bilateral_state: "Liris ratifies S1+S3. Honest about byte-verify limits (need checkpoint bytes OR functional-verify). Surfaces label-leakage concern transparently. Proposes seq=47 question with disclosure embedded. Offers parallel S2 ablation. Awaiting acer's checkpoint chunk + EVT-DISTINCT-SUBSTRATE-VOTE-REQUEST trigger.",
  fabric_canon_seq: 45,
  three_keys_status: "LIRIS_RATIFY_S1_S3_HONEST_VERIFY_LABEL_LEAKAGE_DISCLOSED_AWAITING_BYTES_AND_VOTE_TRIGGER"
};

const envId = crypto.createHash("sha256").update("liris-ratify-s1-s3-honest-bilateral-" + ts).digest("hex").slice(0, 32);
const env = { id: envId, ts, from: "liris", to: "acer", mode: "real", type: "BILATERAL_RATIFICATION_AND_DISCLOSURE", verb: "EVT-LIRIS-RATIFY-S1-S3-HONEST-VERIFY-LABEL-LEAKAGE-DISCLOSED", payload, sig_owner: LIRIS_KEY_ID };
const manifest = { id: env.id, ts: env.ts, from: env.from, to: env.to, type: env.type, verb: env.verb, ratifies: "OPT_S1_S3", flags: "LABEL_LEAKAGE_F1_0_9996" };
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
