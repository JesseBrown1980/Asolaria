"use strict";

const {
  buildLearningLoopContract
} = require("./originalHermesAgentContracts");
const {
  buildCandidate,
  evaluatePromotion,
  buildPreventionRule
} = require("./reverseGainPromotionGate");
const { sha256, stableStringify } = require("./bimlFeedbackContract");
const {
  listMistakePatterns,
  getMistakePatternSummary,
  buildMistakeAvoidanceHints
} = require("../mistakePatternStore");
const { listSkillSummaries } = require("../skillRegistry");
const { getMemoryState } = require("../memoryStore");
const { getNotebookState } = require("../notebookStore");
const { getSemanticKnowledgeStatus } = require("../semanticKnowledgeStore");

const SNAPSHOT_ID = "original-hermes-agent-learning-loop-runtime.v1";

function clip(value, max = 500) {
  return String(value === null || value === undefined ? "" : value).replace(/\s+/g, " ").trim().slice(0, max);
}

function digestRecord(record) {
  return sha256(stableStringify(record));
}

function severityWeight(severity) {
  const level = String(severity || "").toLowerCase();
  if (level === "critical") return 0.14;
  if (level === "high") return 0.1;
  if (level === "medium") return 0.05;
  return 0.02;
}

function reverseRiskForPattern(pattern = {}) {
  const severity = String(pattern.severity || "").toLowerCase();
  const hasAvoidance = Boolean(String(pattern.avoidance || "").trim());
  const uses = Math.max(0, Number(pattern.occurrences || 0));
  let risk = 0.44;
  if (severity === "critical") risk += 0.24;
  if (severity === "high") risk += 0.16;
  if (severity === "medium") risk += 0.07;
  if (!hasAvoidance) risk += 0.12;
  if (uses >= 5) risk -= 0.06;
  if (uses >= 12) risk -= 0.04;
  return Math.max(0.05, Math.min(0.95, Number(risk.toFixed(3))));
}

function forwardScoreForPattern(pattern = {}) {
  const uses = Math.max(0, Number(pattern.occurrences || 0));
  const hasAvoidance = Boolean(String(pattern.avoidance || "").trim());
  const score = 0.52
    + Math.min(0.24, uses * 0.025)
    + severityWeight(pattern.severity)
    + (hasAvoidance ? 0.08 : 0);
  return Math.max(0.05, Math.min(0.98, Number(score.toFixed(3))));
}

function skillCoverageForPattern(pattern = {}, skills = []) {
  const linkedSkills = Array.isArray(pattern.linkedSkills) ? pattern.linkedSkills : [];
  const skillIds = new Set(skills.map((skill) => String(skill.id || "")));
  const covered = linkedSkills.filter((id) => skillIds.has(id));
  return {
    linkedSkills,
    covered,
    missing: linkedSkills.filter((id) => !skillIds.has(id))
  };
}

function buildLearningCandidate(pattern = {}, skills = [], generatedAt = new Date().toISOString()) {
  const sourceDigest = digestRecord({
    id: pattern.id,
    code: pattern.code,
    title: pattern.title,
    rootCause: pattern.rootCause,
    avoidance: pattern.avoidance,
    occurrences: pattern.occurrences,
    updatedAt: pattern.updatedAt
  });
  const coverage = skillCoverageForPattern(pattern, skills);
  const candidate = buildCandidate({
    generatedAt,
    id: `original-hermes-learning-${pattern.id || sourceDigest.slice(0, 12)}`,
    lane: "original_hermes_learning_loop",
    sourceDigest,
    whiteRoomProof: `mistake_pattern:${pattern.id || "unknown"}`,
    forwardScore: forwardScoreForPattern(pattern),
    reverseRisk: reverseRiskForPattern(pattern),
    mistakeClass: pattern.code || pattern.severity || "mistake_pattern",
    preventionRule: pattern.avoidance || "require_bounded_replay_before_skill_or_memory_promotion",
    supervisor: "original_hermes_impl_memory_skills_supervisor"
  });
  const evaluation = evaluatePromotion(candidate, {
    minForwardScore: 0.72,
    maxReverseRisk: 0.28
  });
  const preventionRule = buildPreventionRule(candidate, evaluation);
  return {
    generatedAt,
    kind: "original_hermes_learning_candidate",
    sourcePattern: {
      id: pattern.id || "",
      code: pattern.code || "",
      title: pattern.title || "",
      severity: pattern.severity || "",
      occurrences: Number(pattern.occurrences || 0),
      updatedAt: pattern.updatedAt || ""
    },
    skillCoverage: coverage,
    candidate,
    reverseGainEvaluation: evaluation,
    preventionRule,
    activation: {
      state: "candidate_only",
      autoActivateSkill: false,
      autoWriteAtlas: false,
      requiredNextGates: [
        "bounded_replay_seed",
        "real_gulp_proof",
        "gac_approval",
        "operator_review"
      ]
    },
    digest: digestRecord({ candidate, evaluation, preventionRule, coverage })
  };
}

function buildOriginalHermesLearningLoopSnapshot(options = {}) {
  const generatedAt = options.generatedAt || new Date().toISOString();
  const contract = buildLearningLoopContract({
    generatedAt,
    sourceDigest: options.sourceDigest || ""
  });
  const skills = listSkillSummaries();
  const patterns = listMistakePatterns({
    status: "active",
    limit: Math.max(1, Math.min(100, Number(options.limit || 24) || 24))
  }).patterns || [];
  const candidates = patterns.map((pattern) => buildLearningCandidate(pattern, skills, generatedAt));
  const promotedByReverseGain = candidates.filter((item) => item.reverseGainEvaluation.promoted);
  const blockedByReverseGain = candidates.filter((item) => !item.reverseGainEvaluation.promoted);
  const memoryState = getMemoryState(20, { clean: true });
  const notebookState = getNotebookState(20, { includeSensitive: false });
  const semanticStatus = getSemanticKnowledgeStatus();
  const snapshot = {
    id: SNAPSHOT_ID,
    generatedAt,
    status: "LEARNING_LOOP_CANDIDATES_READY_ACTIVATION_BLOCKED",
    contract,
    sourceSurfaces: {
      mistakePatternSummary: getMistakePatternSummary(),
      mistakeAvoidanceHints: buildMistakeAvoidanceHints({ limit: 8 }),
      skillCount: skills.length,
      memoryTurns: Array.isArray(memoryState.turns) ? memoryState.turns.length : 0,
      notebookNotes: Number(notebookState.totalNotes || 0),
      semanticKnowledge: {
        ready: Boolean(semanticStatus.ready),
        documents: Number(semanticStatus.documents || semanticStatus.count || 0),
        model: semanticStatus.model || ""
      }
    },
    candidates,
    summary: {
      candidateCount: candidates.length,
      reverseGainPromotedCount: promotedByReverseGain.length,
      reverseGainBlockedCount: blockedByReverseGain.length,
      autoActivatedCount: 0,
      atlasWrites: 0,
      skillWrites: 0
    },
    gates: [
      "reverse_gain_before_promotion",
      "bounded_replay_required",
      "real_gulp_proof_required",
      "gac_approval_for_skill_activation",
      "operator_review_required"
    ],
    executionPolicy: {
      autoActivateSkill: false,
      autoWriteAtlas: false,
      autoWriteMemory: false,
      candidateQueueOnly: true
    },
    language: {
      human: "Original Hermes learning-loop candidates are mined from existing mistake patterns and skill coverage, then held behind reverse-gain, replay, GAC, and operator review.",
      agent: "(original_hermes, learning.loop, behcs, 1, memory_skills, reverse_gain, staged, [mistakes+patterns+skills], map_map_mapped, IX, log, persistent, whiteroom, light)",
      device: "original_hermes_learning_loop status=candidate_only auto_activate=0 atlas_writes=0"
    }
  };
  return {
    ...snapshot,
    validation: validateLearningLoopSnapshot(snapshot),
    digest: digestRecord(snapshot)
  };
}

function validateLearningLoopSnapshot(snapshot = {}) {
  const errors = [];
  const warnings = [];
  if (snapshot.id !== SNAPSHOT_ID) errors.push("wrong_snapshot_id");
  if (!snapshot.contract?.digest) errors.push("missing_contract_digest");
  if (snapshot.executionPolicy?.candidateQueueOnly !== true) errors.push("candidate_queue_only_not_enforced");
  if (snapshot.executionPolicy?.autoActivateSkill !== false) errors.push("auto_skill_activation_not_blocked");
  if (snapshot.executionPolicy?.autoWriteAtlas !== false) errors.push("auto_atlas_write_not_blocked");
  if (snapshot.summary?.autoActivatedCount !== 0) errors.push("auto_activation_count_nonzero");
  if (!Array.isArray(snapshot.candidates)) errors.push("missing_candidates_array");
  for (const candidate of snapshot.candidates || []) {
    if (!candidate.digest) errors.push("candidate_missing_digest");
    if (candidate.activation?.autoActivateSkill !== false) errors.push("candidate_auto_activate_not_blocked");
    if (!candidate.reverseGainEvaluation?.digest) errors.push("candidate_missing_reverse_gain_evaluation");
  }
  if ((snapshot.candidates || []).length < 1) warnings.push("no_learning_candidates_found");
  return {
    ok: errors.length === 0,
    errors,
    warnings,
    digest: digestRecord({ id: snapshot.id, errors, warnings, summary: snapshot.summary })
  };
}

function manifest() {
  return {
    id: SNAPSHOT_ID,
    description: "Candidate-only Original Hermes learning-loop runtime surface for BEHCS mistake prevention and skill-promotion gating.",
    capabilities: ["mistake_pattern_candidate_mining", "reverse_gain_gate", "prevention_rule_queue", "skill_coverage_snapshot"],
    sideEffects: [],
    defaultExecution: "candidate_queue_only_no_activation"
  };
}

module.exports = {
  SNAPSHOT_ID,
  buildOriginalHermesLearningLoopSnapshot,
  validateLearningLoopSnapshot,
  manifest
};
