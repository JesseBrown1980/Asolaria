"use strict";

const { sha256, stableStringify } = require("./bimlFeedbackContract");

const CONTRACT_ID = "original-hermes-agent-contracts.v1";

function clip(value, max = 500) {
  return String(value === null || value === undefined ? "" : value).replace(/\s+/g, " ").trim().slice(0, max);
}

function digestRecord(record) {
  return sha256(stableStringify(record));
}

function buildLearningLoopContract(input = {}) {
  const generatedAt = input.generatedAt || new Date().toISOString();
  const sourceDigest = clip(input.sourceDigest || "", 128);
  const contract = {
    contractId: `${CONTRACT_ID}.learning-loop`,
    generatedAt,
    source: {
      upstream: "NousResearch/hermes-agent",
      capsule: "self_improving_learning_loop",
      sourceDigest
    },
    loop: {
      observe: "capture_task_result_tool_events_memory_delta",
      classify: "shannon_and_gnn_score_success_mistake_genius",
      promote: "reverse_gain_promotes_safe_skill_or_memory",
      prevent: "mistake_pattern_blocks_repeated_failure",
      replay: "bounded_replay_seed_required_before_atlas_store"
    },
    gates: [
      "no_secret_import",
      "reverse_gain_before_promotion",
      "source_digest_required",
      "bounded_replay_required",
      "gac_approval_for_skill_activation"
    ],
    outputSurfaces: [
      "data/behcs/original-hermes-agent/learning-loop-contract-latest.json",
      "data/behcs/original-hermes-agent/skill-promotion-queue-latest.ndjson",
      "data/behcs/original-hermes-agent/mistake-prevention-rules-latest.ndjson"
    ]
  };
  return { ...contract, digest: digestRecord(contract) };
}

function buildWalStateContract(input = {}) {
  const generatedAt = input.generatedAt || new Date().toISOString();
  const sourceDigest = clip(input.sourceDigest || "", 128);
  const contract = {
    contractId: `${CONTRACT_ID}.wal-state`,
    generatedAt,
    source: {
      upstream: "NousResearch/hermes-agent",
      capsule: "sqlite_wal_session_memory",
      sourceDigest
    },
    stores: [
      "memoryStore",
      "taskLedgerStore",
      "mistakeLedgerStore",
      "semanticKnowledgeStore",
      "workspaceKnowledgeStore"
    ],
    requiredProperties: [
      "append_only_event_rows",
      "session_lineage",
      "child_session_refs",
      "passive_checkpoint",
      "startup_prune_or_vacuum",
      "digest_per_state_transition"
    ],
    blockedModes: [
      "raw_json_rewrite_under_pressure",
      "cross_process_write_without_lock_or_wal",
      "secret_material_in_state_rows"
    ],
    migrationDefault: "manifest_first_no_store_migration_until_smoke"
  };
  return { ...contract, digest: digestRecord(contract) };
}

function buildTransportRouterContract(input = {}) {
  const generatedAt = input.generatedAt || new Date().toISOString();
  const sourceDigest = clip(input.sourceDigest || "", 128);
  const contract = {
    contractId: `${CONTRACT_ID}.transport-router`,
    generatedAt,
    source: {
      upstream: "NousResearch/hermes-agent",
      capsule: "transport_abc_provider_router",
      sourceDigest
    },
    routeShape: {
      provider: "openai_compatible_or_native",
      transport: "chat_completions_responses_anthropic_bedrock_codex",
      model: "selected_by_brainPolicy_workerRouter",
      credentials: "resolved_by_existing_vault_only",
      output: "normalized_text_tool_calls_usage_errors"
    },
    asolariaBindings: [
      "src/brainPolicy.js",
      "src/connectors/workerRouter.js",
      "src/connectors/externalBrainConnector.js",
      "src/cognitiveEngines/runtimeBridge.js"
    ],
    gates: [
      "no_provider_secret_import",
      "transport_contract_smoke",
      "rate_limit_and_error_classification",
      "gac_before_model_switch",
      "shannon_after_failed_provider"
    ]
  };
  return { ...contract, digest: digestRecord(contract) };
}

function buildPluginHookGate(input = {}) {
  const generatedAt = input.generatedAt || new Date().toISOString();
  const sourceDigest = clip(input.sourceDigest || "", 128);
  const contract = {
    contractId: `${CONTRACT_ID}.plugin-hook-gac-gate`,
    generatedAt,
    source: {
      upstream: "NousResearch/hermes-agent",
      capsule: "plugin_hook_surface",
      sourceDigest
    },
    hookPhases: [
      "on_session_start",
      "pre_tool_call",
      "post_tool_call",
      "transform_tool_result",
      "transform_terminal_output",
      "on_session_finalize"
    ],
    defaultDecision: "deny_runtime_hook_until_registered_and_gac_approved",
    allowConditions: [
      "plugin_manifest_digest_present",
      "hook_phase_registered",
      "tool_scope_declared",
      "audit_log_target_present",
      "no_shell_or_network_expansion_without_explicit_gate"
    ],
    denyConditions: [
      "secret_access_request",
      "unbounded_shell",
      "network_callback_without_connector_policy",
      "shadow_file_write",
      "missing_rollback_surface"
    ]
  };
  return { ...contract, digest: digestRecord(contract) };
}

function evaluatePluginHook(input = {}) {
  const gate = input.gate || buildPluginHookGate(input);
  const request = input.request || {};
  const errors = [];
  if (!request.pluginId) errors.push("missing_plugin_id");
  if (!request.manifestDigest) errors.push("missing_manifest_digest");
  if (!gate.hookPhases.includes(request.phase)) errors.push("unknown_hook_phase");
  if (request.secretAccess === true) errors.push("secret_access_request");
  if (request.shell === true && request.explicitShellGate !== true) errors.push("unbounded_shell");
  if (request.network === true && request.connectorPolicy !== true) errors.push("network_without_connector_policy");
  if (request.shadowWrite === true) errors.push("shadow_file_write");
  if (!request.rollbackSurface) errors.push("missing_rollback_surface");
  const decision = errors.length === 0 ? "ALLOW_REGISTERED_HOOK" : "DENY_HOOK";
  return {
    ok: errors.length === 0,
    contractId: gate.contractId,
    decision,
    errors,
    audit: {
      pluginId: clip(request.pluginId || "", 160),
      phase: clip(request.phase || "", 120),
      manifestDigest: clip(request.manifestDigest || "", 128),
      rollbackSurface: clip(request.rollbackSurface || "", 240)
    },
    digest: digestRecord({ gateDigest: gate.digest, request, decision, errors })
  };
}

function buildSecurityBackportManifest(input = {}) {
  const generatedAt = input.generatedAt || new Date().toISOString();
  const sourceDigest = clip(input.sourceDigest || "", 128);
  const manifest = {
    contractId: `${CONTRACT_ID}.security-backport`,
    generatedAt,
    source: {
      upstream: "NousResearch/hermes-agent",
      capsule: "release_v011_security_hardening",
      sourceDigest
    },
    backports: [
      {
        id: "api_auth_enforcement",
        target: "src/gateway/toolAuthority.js",
        gate: "loopback_or_authenticated_authority"
      },
      {
        id: "path_traversal_checkpoint_guard",
        target: "tools/c-drive-junction-migrator.js",
        gate: "resolved_path_stays_under_allowed_root"
      },
      {
        id: "sandbox_write_shell_injection_guard",
        target: "services/sandbox-manager",
        gate: "shell_false_or_argv_only"
      },
      {
        id: "ssrf_redirect_guard",
        target: "src/riskEngine.js",
        gate: "block_private_ip_redirects_for_remote_fetch"
      },
      {
        id: "webhook_signature_validation",
        target: "routes/hooks.js",
        gate: "per_connector_signature_or_fail_closed"
      },
      {
        id: "oauth_lifecycle_and_no_secret_import",
        target: "src/connectors/*",
        gate: "existing_vault_only_explicit_operator_approval"
      }
    ],
    executionDefault: "queued_no_patch_until_targeted_tests"
  };
  return { ...manifest, digest: digestRecord(manifest) };
}

function validateContracts(contracts = {}) {
  const errors = [];
  for (const [name, contract] of Object.entries(contracts)) {
    if (!contract || typeof contract !== "object") errors.push(`missing_${name}`);
    if (!contract.digest) errors.push(`missing_digest_${name}`);
    if (!String(contract.contractId || "").startsWith(CONTRACT_ID)) errors.push(`wrong_contract_${name}`);
  }
  const pluginEval = contracts.pluginEval;
  if (pluginEval && pluginEval.ok !== false) errors.push("plugin_eval_should_deny_unsafe_sample");
  return {
    ok: errors.length === 0,
    contractId: CONTRACT_ID,
    errors,
    digest: digestRecord(contracts)
  };
}

module.exports = {
  CONTRACT_ID,
  buildLearningLoopContract,
  buildWalStateContract,
  buildTransportRouterContract,
  buildPluginHookGate,
  evaluatePluginHook,
  buildSecurityBackportManifest,
  validateContracts
};
