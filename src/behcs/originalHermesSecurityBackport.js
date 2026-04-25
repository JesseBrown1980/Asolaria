"use strict";

const fs = require("fs");
const path = require("path");
const {
  buildSecurityBackportManifest
} = require("./originalHermesAgentContracts");
const { sha256, stableStringify } = require("./bimlFeedbackContract");

const SNAPSHOT_ID = "original-hermes-agent-security-backport-runtime.v1";
const ROOT = path.resolve(__dirname, "..", "..");

function digestRecord(record) {
  return sha256(stableStringify(record));
}

function repoPath(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function resolveTarget(target) {
  const raw = String(target || "");
  if (raw.includes("*")) {
    const prefix = raw.slice(0, raw.indexOf("*")).replace(/[\\/]+$/, "");
    return path.join(ROOT, prefix);
  }
  return path.join(ROOT, raw);
}

function statTarget(target) {
  const fullPath = resolveTarget(target);
  try {
    const stat = fs.statSync(fullPath);
    return {
      exists: true,
      kind: stat.isDirectory() ? "directory" : "file",
      path: repoPath(fullPath),
      bytes: stat.isFile() ? stat.size : 0,
      modifiedAt: stat.mtime.toISOString()
    };
  } catch {
    return {
      exists: false,
      kind: "missing",
      path: repoPath(fullPath),
      bytes: 0,
      modifiedAt: ""
    };
  }
}

function inferSmoke(backport) {
  const id = String(backport.id || "");
  if (id === "api_auth_enforcement") return "node --check src/gateway/toolAuthority.js";
  if (id === "path_traversal_checkpoint_guard") return "node --check tools/c-drive-junction-migrator.js";
  if (id === "sandbox_write_shell_injection_guard") return "node --check services/sandbox-manager/server.js";
  if (id === "ssrf_redirect_guard") return "node --check src/riskEngine.js";
  if (id === "webhook_signature_validation") return "node --check routes/hooks.js";
  if (id === "oauth_lifecycle_and_no_secret_import") return "manual_connector_secret_surface_review";
  return "targeted_smoke_required";
}

function buildBackportItem(backport = {}, generatedAt) {
  const target = statTarget(backport.target);
  const item = {
    generatedAt,
    id: backport.id || "",
    target,
    gate: backport.gate || "",
    smoke: inferSmoke(backport),
    state: target.exists ? "queued_target_present_patch_blocked" : "queued_target_missing_patch_blocked",
    activation: {
      appliesPatch: false,
      importsSecrets: false,
      touchesShadowFiles: false,
      requiredNextGates: [
        "targeted_test",
        "gac_approval",
        "operator_review",
        "rollback_plan"
      ]
    }
  };
  return {
    ...item,
    digest: digestRecord(item)
  };
}

function buildOriginalHermesSecurityBackportSnapshot(options = {}) {
  const generatedAt = options.generatedAt || new Date().toISOString();
  const manifest = buildSecurityBackportManifest({
    generatedAt,
    sourceDigest: options.sourceDigest || ""
  });
  const backports = (manifest.backports || []).map((item) => buildBackportItem(item, generatedAt));
  const missingTargets = backports.filter((item) => !item.target.exists);
  const snapshot = {
    id: SNAPSHOT_ID,
    generatedAt,
    status: "SECURITY_BACKPORT_QUEUE_READY_PATCHES_BLOCKED",
    manifest,
    backports,
    summary: {
      backportCount: backports.length,
      targetPresentCount: backports.length - missingTargets.length,
      missingTargetCount: missingTargets.length,
      patchesApplied: 0,
      secretsImported: 0,
      shadowFileWrites: 0
    },
    gates: [
      "targeted_test_required",
      "gac_approval_required",
      "operator_review_required",
      "rollback_plan_required",
      "no_secret_import",
      "no_shadow_file_write"
    ],
    executionPolicy: {
      queueOnly: true,
      appliesPatches: false,
      importsSecrets: false,
      writesShadowFiles: false,
      launchesDaemons: false
    },
    language: {
      human: "Original Hermes v0.11 security hardening is staged as a backport queue with target presence, smoke, GAC, operator review, and rollback gates.",
      agent: "(original_hermes, security.backport, behcs, 1, hardening, queue, staged, [targets+gates+smokes], map_mapped, IX, log, persistent, whiteroom, light)",
      device: "original_hermes_security_backport status=queue_only patches=0 secrets=0 shadow_writes=0"
    }
  };
  return {
    ...snapshot,
    validation: validateSecurityBackportSnapshot(snapshot),
    digest: digestRecord(snapshot)
  };
}

function validateSecurityBackportSnapshot(snapshot = {}) {
  const errors = [];
  const warnings = [];
  if (snapshot.id !== SNAPSHOT_ID) errors.push("wrong_snapshot_id");
  if (!snapshot.manifest?.digest) errors.push("missing_manifest_digest");
  if (snapshot.executionPolicy?.queueOnly !== true) errors.push("queue_only_not_enforced");
  if (snapshot.executionPolicy?.appliesPatches !== false) errors.push("patch_apply_not_blocked");
  if (snapshot.executionPolicy?.importsSecrets !== false) errors.push("secret_import_not_blocked");
  if (snapshot.executionPolicy?.writesShadowFiles !== false) errors.push("shadow_write_not_blocked");
  if (snapshot.summary?.patchesApplied !== 0) errors.push("patch_count_nonzero");
  if (snapshot.summary?.secretsImported !== 0) errors.push("secret_import_count_nonzero");
  if (!Array.isArray(snapshot.backports) || snapshot.backports.length < 1) errors.push("missing_backport_items");
  for (const item of snapshot.backports || []) {
    if (!item.digest) errors.push(`backport_missing_digest:${item.id || "unknown"}`);
    if (!item.target?.exists) warnings.push(`target_missing:${item.id || "unknown"}`);
  }
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
    description: "Queue-only Original Hermes security backport staging surface for BEHCS hardening.",
    capabilities: ["security_backport_queue", "target_presence_check", "smoke_mapping", "patch_gate_manifest"],
    sideEffects: [],
    defaultExecution: "queue_only_no_patch_apply"
  };
}

module.exports = {
  SNAPSHOT_ID,
  buildOriginalHermesSecurityBackportSnapshot,
  validateSecurityBackportSnapshot,
  manifest
};
