"use strict";

const { sha256, stableStringify } = require("./bimlFeedbackContract");

const CONTRACT_ID = "omnimets-scheduler-crypto-policy.v1";

function clip(value, max = 500) {
  return String(value === null || value === undefined ? "" : value).replace(/\s+/g, " ").trim().slice(0, max);
}

function buildPolicy(input = {}) {
  const generatedAt = input.generatedAt || new Date().toISOString();
  const policy = {
    contractId: CONTRACT_ID,
    generatedAt,
    supervisor: clip(input.supervisor || "Hermes OmniMets/OmniScheduler/Crypto Supervisor", 240),
    omnimets: {
      requireFreshMetrics: true,
      maxMetricsAgeSeconds: Number.isFinite(Number(input.maxMetricsAgeSeconds)) ? Number(input.maxMetricsAgeSeconds) : 900,
      mediumPressureMode: "small_batches_with_checkpoints",
      highPressureMode: "halt_new_scale_runs"
    },
    omnischeduler: {
      pidBound: true,
      idempotencyKey: "lane:brown_hilbert_range:queue_item",
      staleLockAction: "block_reentry_and_emit_supervisor_event",
      retryMode: "bounded_exponential_backoff"
    },
    crypto: {
      capsuleSealRequired: true,
      entropySourceManifestRequired: true,
      authorityFilesImmutable: true,
      proofPacketFields: ["sourceDigest", "capsuleDigest", "entropySource", "sealDigest", "revocationStatus"]
    }
  };
  return { ...policy, digest: sha256(stableStringify(policy)) };
}

function evaluatePolicy(policy = {}, runtime = {}) {
  const errors = [];
  const warnings = [];
  const pressure = clip(runtime.pressureLevel || runtime.summary?.pressureLevel || "unknown", 80);
  const metricsAgeSeconds = Number(runtime.metricsAgeSeconds ?? runtime.ageSeconds ?? 0);
  const hasPid = Boolean(runtime.pid || runtime.brownHilbertRange);
  const hasSeal = Boolean(runtime.capsuleDigest || runtime.sealDigest);
  const hasEntropy = Boolean(runtime.entropySource || runtime.entropySourceManifest);

  if (policy.contractId !== CONTRACT_ID) errors.push("wrong_contract_id");
  if (policy.omnimets?.requireFreshMetrics && metricsAgeSeconds > policy.omnimets.maxMetricsAgeSeconds) errors.push("metrics_stale");
  if (pressure === "high" || pressure === "critical") errors.push(`pressure_${pressure}`);
  if (!hasPid) errors.push("missing_pid_or_brown_hilbert_range");
  if (!hasSeal) warnings.push("missing_capsule_or_seal_digest");
  if (!hasEntropy) warnings.push("missing_entropy_source_manifest");
  if (runtime.authorityFileEdit === true) errors.push("authority_file_edit_blocked");

  return {
    ok: errors.length === 0,
    contractId: CONTRACT_ID,
    pressure,
    errors,
    warnings,
    dispatchMode: errors.length === 0 && pressure === "medium" ? "small_batches_with_checkpoints" : errors.length === 0 ? "normal" : "halt",
    digest: sha256(stableStringify({ policyDigest: policy.digest, runtime, errors, warnings }))
  };
}

function buildCapsuleMetadata(input = {}) {
  const metadata = {
    contractId: `${CONTRACT_ID}.capsule-metadata`,
    generatedAt: input.generatedAt || new Date().toISOString(),
    sourceDigest: clip(input.sourceDigest || "", 128),
    capsuleDigest: clip(input.capsuleDigest || sha256(stableStringify(input.payload || {})), 128),
    entropySource: clip(input.entropySource || "local_os_crypto_rng_manifest_required", 240),
    sealDigest: clip(input.sealDigest || "", 128),
    revocationStatus: clip(input.revocationStatus || "not_checked", 120),
    brownHilbertRange: clip(input.brownHilbertRange || "", 240)
  };
  return { ...metadata, digest: sha256(stableStringify(metadata)) };
}

module.exports = {
  CONTRACT_ID,
  buildPolicy,
  evaluatePolicy,
  buildCapsuleMetadata
};
