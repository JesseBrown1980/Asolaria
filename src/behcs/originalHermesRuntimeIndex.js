"use strict";

const {
  buildOriginalHermesTransportRouterSnapshot
} = require("./originalHermesTransportRouter");
const {
  buildOriginalHermesLearningLoopSnapshot
} = require("./originalHermesLearningLoop");
const {
  buildOriginalHermesWalStateSnapshot
} = require("./originalHermesWalState");
const {
  buildOriginalHermesSecurityBackportSnapshot
} = require("./originalHermesSecurityBackport");
const {
  buildPluginHookGate,
  evaluatePluginHook
} = require("./originalHermesAgentContracts");
const { sha256, stableStringify } = require("./bimlFeedbackContract");

const SNAPSHOT_ID = "original-hermes-agent-runtime-index.v1";

function digestRecord(record) {
  return sha256(stableStringify(record));
}

function buildPluginGateSnapshot(generatedAt) {
  const gate = buildPluginHookGate({ generatedAt });
  const unsafeSample = evaluatePluginHook({
    gate,
    request: {
      pluginId: "original-hermes-unsafe-sample",
      manifestDigest: gate.digest,
      phase: "pre_tool_call",
      shell: true,
      explicitShellGate: false,
      rollbackSurface: "reports/original-hermes-agent-runtime-index-latest.md"
    }
  });
  const registeredReadOnlySample = evaluatePluginHook({
    gate,
    request: {
      pluginId: "original-hermes-readonly-sample",
      manifestDigest: gate.digest,
      phase: "post_tool_call",
      shell: false,
      network: false,
      rollbackSurface: "reports/original-hermes-agent-runtime-index-latest.md"
    }
  });
  const snapshot = {
    id: "original-hermes-plugin-hook-gate-runtime.v1",
    generatedAt,
    status: "PLUGIN_HOOK_GATE_ACTIVE_FAIL_CLOSED",
    gate,
    samples: {
      unsafe: unsafeSample,
      registeredReadOnly: registeredReadOnlySample
    },
    summary: {
      unsafeDenied: unsafeSample.ok === false,
      registeredReadOnlyAllowed: registeredReadOnlySample.ok === true,
      runtimeHooksEnabled: false,
      shellExpansionAllowed: false,
      secretAccessAllowed: false,
      shadowWritesAllowed: false
    },
    digest: digestRecord({ gate, unsafeSample, registeredReadOnlySample })
  };
  return {
    ...snapshot,
    validation: {
      ok: unsafeSample.ok === false
        && registeredReadOnlySample.ok === true
        && snapshot.summary.runtimeHooksEnabled === false
        && snapshot.summary.shellExpansionAllowed === false
        && snapshot.summary.secretAccessAllowed === false
        && snapshot.summary.shadowWritesAllowed === false,
      errors: [
        unsafeSample.ok !== false ? "unsafe_plugin_not_denied" : "",
        registeredReadOnlySample.ok !== true ? "registered_readonly_not_allowed" : ""
      ].filter(Boolean),
      warnings: [],
      digest: digestRecord({ unsafeDenied: unsafeSample.ok === false, readOnlyAllowed: registeredReadOnlySample.ok === true })
    }
  };
}

function surfaceStatus(surface) {
  const validationOk = surface?.validation?.ok !== false;
  const blocked =
    surface?.executionPolicy?.candidateQueueOnly === true
    || surface?.executionPolicy?.manifestOnly === true
    || surface?.executionPolicy?.queueOnly === true
    || surface?.executionPolicy?.appliesPatches === false
    || surface?.executionPolicy?.dispatchesNow === false
    || surface?.summary?.runtimeHooksEnabled === false;
  return validationOk && blocked ? "ready_blocked" : validationOk ? "ready" : "gated";
}

function buildSupervisors(surfaces, generatedAt) {
  const surfaceEntries = Object.entries(surfaces);
  const root = {
    id: "original_hermes_runtime_supervisor_root",
    generatedAt,
    role: "supervisor_of_supervisors",
    scope: "Coordinate Original Hermes transport, learning loop, WAL/session, plugin hook, and security backport surfaces.",
    gates: [
      "no_shadow_file_edits",
      "no_provider_secret_import",
      "no_runtime_launch_without_operator_gate",
      "real_gulp_proof_before_activation",
      "reverse_gain_before_learning_promotion"
    ],
    authority: "read_only_index"
  };
  return [
    root,
    ...surfaceEntries.map(([id, surface], index) => ({
      id: `original_hermes_${id}_supervisor`,
      generatedAt,
      role: "surface_supervisor",
      ordinal: index + 1,
      surface: id,
      status: surfaceStatus(surface),
      digest: surface.digest || surface.validation?.digest || "",
      gates: surface.gates || surface.executionPolicy || surface.summary || {}
    }))
  ];
}

function buildMap(surfaces, supervisors, generatedAt) {
  const nodes = [
    { id: "original_hermes_upstream", kind: "source", label: "NousResearch/hermes-agent" },
    { id: "runtime_index", kind: "index", label: SNAPSHOT_ID },
    { id: supervisors[0].id, kind: "supervisor", label: "Original Hermes runtime supervisor root" },
    ...Object.keys(surfaces).map((id) => ({
      id,
      kind: "surface",
      label: id,
      status: surfaceStatus(surfaces[id]),
      digest: surfaces[id].digest || surfaces[id].validation?.digest || ""
    }))
  ];
  const edges = [
    { from: "original_hermes_upstream", to: "runtime_index", relation: "absorbed_into" },
    { from: "runtime_index", to: supervisors[0].id, relation: "supervised_by" },
    ...Object.keys(surfaces).map((id) => ({
      from: supervisors[0].id,
      to: id,
      relation: "governs"
    }))
  ];
  const map = {
    id: "original-hermes-runtime-map",
    generatedAt,
    nodes,
    edges,
    counts: {
      nodes: nodes.length,
      edges: edges.length
    }
  };
  return {
    ...map,
    digest: digestRecord(map)
  };
}

function buildOriginalHermesRuntimeIndex(options = {}) {
  const generatedAt = options.generatedAt || new Date().toISOString();
  const surfaces = {
    transport: buildOriginalHermesTransportRouterSnapshot({
      workerRouterStatus: options.workerRouterStatus
    }),
    learningLoop: buildOriginalHermesLearningLoopSnapshot({
      generatedAt,
      limit: options.learningLimit || 24
    }),
    walState: buildOriginalHermesWalStateSnapshot({ generatedAt }),
    pluginHookGate: buildPluginGateSnapshot(generatedAt),
    securityBackport: buildOriginalHermesSecurityBackportSnapshot({ generatedAt })
  };
  const supervisors = buildSupervisors(surfaces, generatedAt);
  const map = buildMap(surfaces, supervisors, generatedAt);
  const snapshot = {
    id: SNAPSHOT_ID,
    generatedAt,
    status: "ORIGINAL_HERMES_RUNTIME_INDEX_PENDING_VALIDATION",
    surfaces,
    supervisors,
    map,
    summary: {
      surfaceCount: Object.keys(surfaces).length,
      supervisorCount: supervisors.length,
      readyBlockedCount: Object.values(surfaces).filter((surface) => surfaceStatus(surface) === "ready_blocked").length,
      activationWrites: 0,
      runtimeLaunches: 0,
      providerCalls: 0,
      shadowWrites: 0,
      secretImports: 0
    },
    gates: [
      "read_only_index",
      "real_gulp_proof_before_activation",
      "operator_review_before_runtime_launch",
      "gac_approval_before_patch_or_skill_activation",
      "reverse_gain_before_learning_promotion"
    ],
    executionPolicy: {
      readOnly: true,
      activatesRuntime: false,
      appliesPatches: false,
      activatesSkills: false,
      importsSecrets: false,
      writesShadowFiles: false,
      callsProviders: false
    },
    language: {
      human: "Original Hermes is indexed as supervised BEHCS runtime surfaces with transport, learning, WAL/session, plugin hook, and security backport gates.",
      agent: "(original_hermes, runtime.index, behcs, 1, supervisor_of_supervisors, map, staged, [transport+learning+wal+hooks+security], cube_cubed, IX, log, persistent, whiteroom, light)",
      device: "original_hermes_runtime_index surfaces=5 readonly=1 runtime_launch=0 patches=0 secrets=0"
    }
  };
  const validation = validateRuntimeIndex(snapshot);
  return {
    ...snapshot,
    status: validation.ok
      ? "ORIGINAL_HERMES_RUNTIME_INDEX_READY_ACTIVATION_BLOCKED"
      : "ORIGINAL_HERMES_RUNTIME_INDEX_GATED",
    validation,
    digest: digestRecord(snapshot)
  };
}

function validateRuntimeIndex(snapshot = {}) {
  const errors = [];
  const warnings = [];
  const surfaces = snapshot.surfaces || {};
  const required = ["transport", "learningLoop", "walState", "pluginHookGate", "securityBackport"];
  for (const id of required) {
    if (!surfaces[id]) errors.push(`missing_surface:${id}`);
    if (surfaces[id]?.validation?.ok === false) errors.push(`surface_validation_failed:${id}`);
  }
  if (!Array.isArray(snapshot.supervisors) || snapshot.supervisors.length < required.length + 1) errors.push("missing_supervisors");
  if (!snapshot.map?.digest) errors.push("missing_map_digest");
  const policy = snapshot.executionPolicy || {};
  if (policy.readOnly !== true) errors.push("readonly_not_enforced");
  if (policy.activatesRuntime !== false) errors.push("runtime_activation_not_blocked");
  if (policy.appliesPatches !== false) errors.push("patch_application_not_blocked");
  if (policy.activatesSkills !== false) errors.push("skill_activation_not_blocked");
  if (policy.importsSecrets !== false) errors.push("secret_import_not_blocked");
  if (policy.writesShadowFiles !== false) errors.push("shadow_write_not_blocked");
  if (policy.callsProviders !== false) errors.push("provider_calls_not_blocked");
  if (Object.values(surfaces).some((surface) => surfaceStatus(surface) === "gated")) warnings.push("one_or_more_surfaces_gated");
  return {
    ok: errors.length === 0,
    errors,
    warnings,
    digest: digestRecord({ errors, warnings, surfaces: required.map((id) => surfaces[id]?.digest || surfaces[id]?.validation?.digest || "") })
  };
}

function manifest() {
  return {
    id: SNAPSHOT_ID,
    description: "Read-only supervisor index for Original Hermes Agent BEHCS integration surfaces.",
    capabilities: ["supervisor_index", "surface_digest_map", "runtime_activation_gate", "map_map_mapped"],
    sideEffects: [],
    defaultExecution: "read_only_index_no_activation"
  };
}

module.exports = {
  SNAPSHOT_ID,
  buildOriginalHermesRuntimeIndex,
  validateRuntimeIndex,
  manifest
};
