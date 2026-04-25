"use strict";

const { sha256, stableStringify } = require("./bimlFeedbackContract");

const CONTRACT_ID = "reverse-gain-promotion-gate.v1";

function clip(value, max = 500) {
  return String(value === null || value === undefined ? "" : value).replace(/\s+/g, " ").trim().slice(0, max);
}

function buildCandidate(input = {}) {
  const generatedAt = input.generatedAt || new Date().toISOString();
  const candidate = {
    contractId: CONTRACT_ID,
    generatedAt,
    id: clip(input.id || `reverse-gain-candidate-${sha256(generatedAt).slice(0, 12)}`, 180),
    lane: clip(input.lane || "unknown", 160),
    sourceDigest: clip(input.sourceDigest || "", 128),
    whiteRoomProof: clip(input.whiteRoomProof || "", 240),
    forwardScore: Number.isFinite(Number(input.forwardScore)) ? Number(input.forwardScore) : 0,
    reverseRisk: Number.isFinite(Number(input.reverseRisk)) ? Number(input.reverseRisk) : 1,
    mistakeClass: clip(input.mistakeClass || "watch", 160),
    preventionRule: clip(input.preventionRule || "require_replay_seed_and_gulp_proof", 1000),
    supervisor: clip(input.supervisor || "Hermes Forward/Reverse GNN Supervisor", 240)
  };
  return {
    ...candidate,
    digest: sha256(stableStringify(candidate))
  };
}

function evaluatePromotion(candidate = {}, policy = {}) {
  const minForwardScore = Number.isFinite(Number(policy.minForwardScore)) ? Number(policy.minForwardScore) : 0.72;
  const maxReverseRisk = Number.isFinite(Number(policy.maxReverseRisk)) ? Number(policy.maxReverseRisk) : 0.28;
  const errors = [];
  const warnings = [];
  if (candidate.contractId !== CONTRACT_ID) errors.push("wrong_contract_id");
  if (!candidate.sourceDigest) errors.push("missing_source_digest");
  if (!candidate.whiteRoomProof) errors.push("missing_white_room_proof");
  if (candidate.forwardScore < minForwardScore) errors.push("forward_score_below_threshold");
  if (candidate.reverseRisk > maxReverseRisk) errors.push("reverse_risk_above_threshold");
  if (!candidate.preventionRule) warnings.push("missing_prevention_rule");
  const promoted = errors.length === 0;
  return {
    ok: true,
    contractId: CONTRACT_ID,
    promoted,
    action: promoted ? "PROMOTE_TO_ATLAS_QUEUE" : "DEFER_OR_DEMOTE",
    errors,
    warnings,
    thresholds: { minForwardScore, maxReverseRisk },
    digest: sha256(stableStringify({ candidateDigest: candidate.digest, errors, warnings, promoted }))
  };
}

function buildPreventionRule(candidate = {}, evaluation = {}) {
  const rule = {
    contractId: `${CONTRACT_ID}.prevention-rule`,
    generatedAt: new Date().toISOString(),
    lane: candidate.lane || "unknown",
    mistakeClass: candidate.mistakeClass || "watch",
    action: evaluation.promoted ? "monitor_promoted_pattern" : "block_until_reverse_gain_pass",
    condition: evaluation.promoted
      ? "source_digest_and_white_room_proof_present"
      : (evaluation.errors || []).join("|"),
    prevention: candidate.preventionRule || "require_replay_seed_and_gulp_proof"
  };
  return { ...rule, digest: sha256(stableStringify(rule)) };
}

module.exports = {
  CONTRACT_ID,
  buildCandidate,
  evaluatePromotion,
  buildPreventionRule
};
