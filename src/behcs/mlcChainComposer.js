"use strict";

const { sha256, stableStringify } = require("./bimlFeedbackContract");

const CONTRACT_ID = "mlc-chain-composer.v1";

function clip(value, max = 500) {
  return String(value === null || value === undefined ? "" : value).replace(/\s+/g, " ").trim().slice(0, max);
}

function normalizeStep(step = {}, index = 0) {
  return {
    id: clip(step.id || `step_${String(index + 1).padStart(2, "0")}`, 160),
    kind: clip(step.kind || "skill", 120),
    glyphVerb: clip(step.glyphVerb || step.verb || "", 160),
    supervisor: clip(step.supervisor || "", 240),
    inputContract: clip(step.inputContract || "", 240),
    outputContract: clip(step.outputContract || "", 240),
    rollback: clip(step.rollback || "halt_and_preserve_evidence", 500),
    gates: Array.isArray(step.gates) ? step.gates.map((gate) => clip(gate, 120)).filter(Boolean) : []
  };
}

function composeChain(input = {}) {
  const generatedAt = input.generatedAt || new Date().toISOString();
  const steps = (Array.isArray(input.steps) ? input.steps : []).map(normalizeStep);
  const sourceDigests = Array.isArray(input.sourceDigests) ? input.sourceDigests.map((item) => clip(item, 128)).filter(Boolean) : [];
  const replaySeed = clip(input.replaySeed || sha256(`${generatedAt}:${steps.length}:${sourceDigests.join("|")}`).slice(0, 24), 240);
  const manifest = {
    contractId: CONTRACT_ID,
    generatedAt,
    id: clip(input.id || `mlc-chain-${sha256(`${generatedAt}:${steps.length}`).slice(0, 12)}`, 180),
    title: clip(input.title || "MLC composed BEHCS chain", 240),
    purpose: clip(input.purpose || "Compose skills, glyph verbs, and supervisors into a gated runtime chain.", 1000),
    sourceDigests,
    replaySeed,
    steps,
    gates: Array.from(new Set(steps.flatMap((step) => step.gates))).sort(),
    rollbackSurface: clip(input.rollbackSurface || "evidence_preserving_chain_halt", 240),
    executionDefault: "blocked_until_manifest_schema_smoke_and_gac"
  };
  return {
    ...manifest,
    digest: sha256(stableStringify(manifest))
  };
}

function scoreChain(manifest = {}, evidence = {}) {
  const steps = Array.isArray(manifest.steps) ? manifest.steps : [];
  const sourceCount = Array.isArray(manifest.sourceDigests) ? manifest.sourceDigests.length : 0;
  const gateCoverage = steps.length
    ? steps.filter((step) => Array.isArray(step.gates) && step.gates.length > 0).length / steps.length
    : 0;
  const rollbackCoverage = steps.length
    ? steps.filter((step) => step.rollback).length / steps.length
    : 0;
  const evidenceWeight = Math.min(1, sourceCount / 3);
  const mistakeDelta = Number.isFinite(Number(evidence.mistakeLedgerDelta)) ? Number(evidence.mistakeLedgerDelta) : 0;
  const replayBonus = manifest.replaySeed ? 0.1 : 0;
  const raw = (gateCoverage * 0.35) + (rollbackCoverage * 0.25) + (evidenceWeight * 0.3) + replayBonus - Math.max(0, mistakeDelta) * 0.02;
  return {
    ok: steps.length > 0 && gateCoverage === 1 && rollbackCoverage === 1,
    contractId: CONTRACT_ID,
    score: Math.max(0, Math.min(1, Math.round(raw * 1000) / 1000)),
    gateCoverage,
    rollbackCoverage,
    sourceCount,
    replaySeed: manifest.replaySeed || "",
    digest: sha256(stableStringify({ manifestDigest: manifest.digest, evidence }))
  };
}

function validateChain(manifest = {}) {
  const errors = [];
  if (manifest.contractId !== CONTRACT_ID) errors.push("wrong_contract_id");
  if (!Array.isArray(manifest.steps) || manifest.steps.length === 0) errors.push("missing_steps");
  for (const step of manifest.steps || []) {
    if (!step.glyphVerb) errors.push(`missing_glyph_verb:${step.id}`);
    if (!step.supervisor) errors.push(`missing_supervisor:${step.id}`);
    if (!Array.isArray(step.gates) || step.gates.length === 0) errors.push(`missing_gates:${step.id}`);
    if (!step.rollback) errors.push(`missing_rollback:${step.id}`);
  }
  if (!manifest.replaySeed) errors.push("missing_replay_seed");
  return {
    ok: errors.length === 0,
    contractId: CONTRACT_ID,
    errors,
    digest: manifest.digest || sha256(stableStringify(manifest))
  };
}

module.exports = {
  CONTRACT_ID,
  composeChain,
  scoreChain,
  validateChain
};
