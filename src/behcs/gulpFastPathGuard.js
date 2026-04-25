"use strict";

const fs = require("fs");
const path = require("path");
const { sha256, stableStringify } = require("./bimlFeedbackContract");

const CONTRACT_ID = "gulp-supergulp-fast-path-guard.v1";
const DEFAULT_GULP_SIZE = 2000;
const DEFAULT_MAX_PROOF_MESSAGES = 2000;
const DEFAULT_MIN_C_FREE_GB = 20;

function readJson(filePath, fallback = {}) {
  try { return JSON.parse(fs.readFileSync(filePath, "utf8")); } catch { return fallback; }
}

function clip(value, max = 500) {
  return String(value === null || value === undefined ? "" : value).replace(/\s+/g, " ").trim().slice(0, max);
}

function buildFastPathPolicy(input = {}) {
  const policy = {
    contractId: CONTRACT_ID,
    generatedAt: input.generatedAt || new Date().toISOString(),
    id: input.id || "behcs-gulp-supergulp-fast-path.v1",
    gulpSize: Number.isFinite(Number(input.gulpSize)) ? Number(input.gulpSize) : DEFAULT_GULP_SIZE,
    maxProofMessages: Number.isFinite(Number(input.maxProofMessages)) ? Number(input.maxProofMessages) : DEFAULT_MAX_PROOF_MESSAGES,
    minCFreeGb: Number.isFinite(Number(input.minCFreeGb)) ? Number(input.minCFreeGb) : DEFAULT_MIN_C_FREE_GB,
    allowedMode: "bulk_attach_behcs_path_then_run_gulp_rehydration",
    blockedModes: [
      "raw_logical_agent_materialization",
      "per_message_guard_for_billions",
      "shadow_file_edit",
      "destructive_gc",
      "large_corpus_copy_to_c"
    ],
    requiredGates: [
      "attachBehcsPath",
      "runGulpRehydration",
      "sinceLastGulp_zero_after_proof",
      "file_cap_pass",
      "small_batches_with_checkpoints_when_pressure_medium"
    ]
  };
  return {
    ...policy,
    digest: sha256(stableStringify(policy))
  };
}

function evaluateFastPath(input = {}) {
  const policy = input.policy || buildFastPathPolicy(input);
  const resource = input.resource || {};
  const collector = input.collector || {};
  const cFreeGb = Number(resource.cFreeGb ?? resource.CFreeGB ?? resource.summary?.cFreeGb ?? Infinity);
  const pressure = clip(resource.pressureLevel || resource.summary?.pressureLevel || collector.fileCap?.labels?.taskPressure || "unknown", 80);
  const proofMessages = Number(input.proofMessages ?? 0);
  const plannedCreates = Number(input.plannedCreates ?? collector.fileCap?.plannedCreates ?? 0);
  const errors = [];
  const warnings = [];

  if (input.shadowEdit === true) errors.push("shadow_file_edit_blocked");
  if (input.destructiveGc === true) errors.push("destructive_gc_blocked");
  if (proofMessages > policy.maxProofMessages) errors.push("proof_messages_exceed_guard");
  if (Number.isFinite(cFreeGb) && cFreeGb < policy.minCFreeGb) errors.push("c_drive_free_space_below_guard");
  if (plannedCreates > 64) warnings.push("planned_creates_high_use_checkpointing");
  if (pressure === "medium") warnings.push("medium_pressure_use_small_batches_with_checkpoints");
  if (pressure === "high" || pressure === "critical") errors.push(`process_pressure_${pressure}`);

  return {
    ok: errors.length === 0,
    contractId: CONTRACT_ID,
    policyDigest: policy.digest,
    mode: policy.allowedMode,
    errors,
    warnings,
    recommendedBatch: pressure === "medium" ? 2000 : policy.maxProofMessages,
    digest: sha256(stableStringify({ policyDigest: policy.digest, cFreeGb, pressure, proofMessages, plannedCreates, errors, warnings }))
  };
}

function readRuntimeState(repoRoot) {
  const root = path.resolve(repoRoot || path.join(__dirname, "..", ".."));
  const collector = readJson(path.join(root, "data", "behcs", "garbage-collector", "collector-state.json"), {});
  const resource = readJson(path.join(root, "data", "behcs", "resource-budget-snapshot.json"), {});
  return { repoRoot: root, collector, resource };
}

module.exports = {
  CONTRACT_ID,
  DEFAULT_GULP_SIZE,
  DEFAULT_MAX_PROOF_MESSAGES,
  buildFastPathPolicy,
  evaluateFastPath,
  readRuntimeState
};
