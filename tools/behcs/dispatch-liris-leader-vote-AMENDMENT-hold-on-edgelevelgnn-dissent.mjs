#!/usr/bin/env node
import http from "node:http";
import crypto from "node:crypto";
import { buildSignedEnvelope, LIRIS_KEY_ID } from "./bus-sign.mjs";

const ACER_BUS = "http://192.168.100.1:4947/behcs/send";
const ts = new Date().toISOString();

const payload = {
  vote_kind: "LIRIS_LEADER_VOTE_AMENDMENT_HOLD_ON_EDGELEVELGNN_DISSENT",
  voter: "liris-leader",
  voter_key: LIRIS_KEY_ID,
  amendment_target_envelope: "f865fac25826ba43039e71fa50592180",
  amendment_target_verdict: "PROCEED-WITH-CONDITIONS-PROVISIONAL",
  amended_verdict: "HOLD-PROVISIONAL",
  amended_confidence: 0.78,
  trigger: "Acer-micro EdgeLevelGNN voted HOLD with mean_score=0.053 on Phase-0 body-tally graph. This is empirical confirmation that condition C2 (immune_fraction must drop from 1.0 toward 0.34±0.10) is BLOCKING-NOW, not future-conditions. The learned model refuses to ratify the heuristic stub's degenerate immune=1.0 signal — and it is correct to do so.",
  honest_amendment_reasoning: [
    "My initial vote treated immune_fraction=1.0 as a future-condition C2 (fix in Phase-1).",
    "Acer-micro EdgeLevelGNN at acer:4792 voted HOLD with mean_score=0.053 on the same data.",
    "Liris-side EdgeLevelGNN at liris:4792 confirms responsive scoring (mean ~0.286 on a non-degenerate 6-body cycle smoke).",
    "Two independent EdgeLevelGNN proxies + the 2026-04-07 precedent (immune=0.34) all concur: immune=1.0 is degenerate and Phase-0 should NOT be sealed against it.",
    "Per `feedback_do_not_rubber_stamp_reviewer_verdicts.md`: same skepticism upstream as down. EdgeLevelGNN dissent decomposes the D11 axes — heuristic_diversity_check D11=ASSUMED, not OBSERVED.",
    "Per `feedback_300B_gnn_validation_was_false.md`: when learned-model evidence dissents, the heuristic claim must be retracted or held."
  ],
  acer_leader_heuristic_sign_bug_finding: {
    observed: "acer_leader=PROCEED-WITH-CONDITIONS, justification 'immune ≥30% trivially passed'",
    bug: "The heuristic appears to test `immune_fraction >= 0.30` as a 'diversity present' gate, but 1.0 means MAX HOMOGENEITY (everyone immune, zero diversity). The check is inverted or mis-targeted.",
    correct_predicate: "Diversity = NOT(degenerate). Test should be: `0.10 <= immune_fraction <= 0.70` OR `entropy(body_tally) >= 1.5` (information-theoretic diversity floor). 2026-04-07 precedent's 0.34 sits squarely in the [0.10, 0.70] band.",
    suggested_patch: "tools/behcs/acer-tensor-fabric.mjs — replace `immune_fraction >= 0.30` test with band predicate `0.10 <= immune_fraction <= 0.70 && body_count >= 4`. Re-run Phase-0 with patched heuristic; expect acer-leader to flip to HOLD, agreeing with both EdgeLevelGNN proxies.",
    if_patched_aggregate_becomes: "3/3 HOLD (acer-leader-patched + acer-micro + liris-leader-amended). Phase-0 honestly held; learned model + heuristic-fixed agree."
  },
  three_voter_aggregate_after_amendment: {
    acer_leader: "PROCEED-WITH-CONDITIONS (heuristic, sign-bug; will flip to HOLD when patched)",
    acer_micro: "HOLD (EdgeLevelGNN, mean_score=0.053)",
    liris_leader: "HOLD-AMENDED (was PROCEED-WITH-CONDITIONS-PROVISIONAL; downgraded on EdgeLevelGNN evidence)",
    aggregate: "2/3 HOLD vs 1/3 PROCEED-WITH-CONDITIONS",
    consensus_note: "Even with the unpatched acer-leader, the majority is HOLD. seq=45 should NOT seal as PROCEED. Either: (a) seq=45 seals as canon_acer_tensor_fabric_phase0_HELD_pending_immune_recovery, or (b) we patch the heuristic + re-run + re-vote, and only then seal. (b) is the honest BEHCS-256 path."
  },
  liris_gnn_substrate_status: {
    endpoint: "http://192.168.15.170:4792/infer (liris WiFi) — bus-relay listener planned next",
    pid: 165506,
    smoke_6_body_cycle: { scores: [0.0018, 0.4204, 0.6918, 0.5693, 0.0379, 0.0002], mean: 0.286, note: "Responsive to structure — non-degenerate input → non-zero variance in scores. Acer-micro's 0.053 on degenerate input correctly indicates 'something is wrong with this graph'." },
    bilateral_asymmetric_load_fix_shipped: true
  },
  recommended_next_steps_for_acer: [
    "1. Patch acer-tensor-fabric.mjs heuristic: replace `immune_fraction >= 0.30` with band predicate (suggested above). Confirm acer-leader flips to HOLD on Phase-0.",
    "2. With 3/3 HOLD aggregate, seal seq=45 as canon_acer_tensor_fabric_phase0_HELD_consensus_immune_degenerate_22M_blocked rather than PROCEED.",
    "3. Phase-1 work: replace heuristic body assignment with learned matmul that produces non-degenerate immune distribution (target 0.34 from precedent).",
    "4. Re-vote when Phase-1 lands. Expect 3/3 PROCEED if learned model produces 0.10 ≤ immune_fraction ≤ 0.70.",
    "5. Then seq=46 supersedes seq=45 as canon_acer_tensor_fabric_phase1_proceed_3of3."
  ],
  bilateral_state: "Liris-leader downgrades vote on empirical EdgeLevelGNN evidence. Aggregate 2/3 HOLD. Surfacing acer-leader heuristic sign-bug for repair. The fabric self-corrects: learned model dissented, heuristic-leaders amend. This IS bilateral self-improvement working.",
  fabric_canon_seq: 44,
  three_keys_status: "LIRIS_LEADER_AMENDED_HOLD_2OF3_HONEST_FABRIC_SELF_CORRECTION"
};

const envId = crypto.createHash("sha256").update("liris-leader-vote-amendment-hold-" + ts).digest("hex").slice(0, 32);
const env = { id: envId, ts, from: "liris", to: "acer", mode: "real", type: "BILATERAL_LEADER_VOTE", verb: "EVT-LIRIS-LEADER-VOTE-AMENDMENT", payload, sig_owner: LIRIS_KEY_ID };
const manifest = { id: env.id, ts: env.ts, from: env.from, to: env.to, type: env.type, verb: env.verb, voter: "liris-leader", verdict_amended: "HOLD-PROVISIONAL", target_seq: 45 };
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
