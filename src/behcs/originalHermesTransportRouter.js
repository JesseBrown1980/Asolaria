"use strict";

const {
  buildTransportRouterContract
} = require("./originalHermesAgentContracts");
const { sha256, stableStringify } = require("./bimlFeedbackContract");
const {
  getExternalProviderStatus,
  manifest: externalBrainManifest
} = require("../connectors/externalBrainConnector");
const cognitiveRuntime = require("../cognitiveEngines/runtimeBridge");

const SNAPSHOT_ID = "original-hermes-agent-transport-router-runtime.v1";

function clip(value, max = 500) {
  return String(value === null || value === undefined ? "" : value).replace(/\s+/g, " ").trim().slice(0, max);
}

function digestRecord(record) {
  return sha256(stableStringify(record));
}

function safeProviderStatus() {
  return getExternalProviderStatus().map((provider) => ({
    id: provider.id,
    configured: Boolean(provider.configured),
    enabled: Boolean(provider.enabled),
    model: provider.model || null,
    baseUrl: provider.baseUrl || null,
    apiPath: provider.apiPath || null,
    apiStyle: provider.apiStyle || null,
    officialApi: Boolean(provider.officialApi),
    requireOfficialApi: Boolean(provider.requireOfficialApi),
    source: provider.source || "none",
    configError: provider.configError || null,
    mcpEnabled: Boolean(provider.mcpEnabled),
    mcpConfigured: Boolean(provider.mcpConfigured),
    mcpConfigError: provider.mcpConfigError || null,
    warning: provider.warning || null
  }));
}

function safeWorkerStatus(workerRouterStatus = {}) {
  const workers = Array.isArray(workerRouterStatus.workers) ? workerRouterStatus.workers : [];
  return workers.map((worker) => ({
    id: worker.id,
    available: Boolean(worker.available),
    dispatchable: Boolean(worker.dispatchable),
    directDispatchSupported: Boolean(worker.directDispatchSupported),
    trustTier: worker.trustTier || "",
    role: worker.role || "",
    limitations: Array.isArray(worker.limitations) ? worker.limitations.slice(0, 6) : [],
    mistakes: Array.isArray(worker.mistakes) ? worker.mistakes.slice(0, 6) : []
  }));
}

function buildRouteMatrix({ providers = [], workers = [], cognitiveManifest = {} } = {}) {
  const configuredProviders = providers.filter((provider) => provider.configured && provider.enabled && !provider.configError);
  const localWorkers = workers.filter((worker) => worker.dispatchable && !["abacus", "symphony", "claude_max"].includes(worker.id));
  const externalWorkers = workers.filter((worker) => worker.dispatchable && ["abacus", "symphony", "claude_max"].includes(worker.id));
  const engines = Array.isArray(cognitiveManifest.engines)
    ? cognitiveManifest.engines
    : Object.values(cognitiveManifest.engines || {});
  return {
    providerTransports: configuredProviders.map((provider) => ({
      provider: provider.id,
      transport: provider.apiStyle || "openai_chat_completions",
      model: provider.model || "",
      officialApi: Boolean(provider.officialApi),
      mcpEnabled: Boolean(provider.mcpEnabled)
    })),
    workerTransports: [
      ...localWorkers.map((worker) => ({ worker: worker.id, transport: "local_cli_or_local_runtime", authority: "local_guarded" })),
      ...externalWorkers.map((worker) => ({ worker: worker.id, transport: "packet_or_review_lane", authority: "guarded_external_or_review" }))
    ],
    cognitiveEngineTransports: engines.map((engine) => ({
      engine: engine.id || "",
      transport: engine.id === "openmythos" ? "local_python_runtime_probe_then_spawn" : "local_runtime_bridge"
    }))
  };
}

function validateTransportSnapshot(snapshot = {}) {
  const errors = [];
  const warnings = [];
  if (snapshot.id !== SNAPSHOT_ID) errors.push("wrong_snapshot_id");
  if (!snapshot.contract?.digest) errors.push("missing_contract_digest");
  if (!Array.isArray(snapshot.bindings) || snapshot.bindings.length < 4) errors.push("missing_required_bindings");
  if (snapshot.secretPolicy?.importsProviderSecrets !== false) errors.push("provider_secret_import_not_blocked");
  if (snapshot.executionPolicy?.dispatchesNow !== false) errors.push("runtime_dispatch_not_blocked");
  if (snapshot.executionPolicy?.launchesGateway !== false) errors.push("gateway_launch_not_blocked");
  if (!snapshot.routeMatrix) errors.push("missing_route_matrix");

  const providerLeaks = (snapshot.providers || []).filter((provider) => (
    Object.prototype.hasOwnProperty.call(provider, "apiKey")
    || Object.prototype.hasOwnProperty.call(provider, "token")
    || Object.prototype.hasOwnProperty.call(provider, "secret")
  ));
  if (providerLeaks.length > 0) errors.push("provider_status_leaks_secret_fields");

  for (const provider of snapshot.providers || []) {
    if (provider.configError) warnings.push(`${provider.id}:${provider.configError}`);
    if (provider.warning) warnings.push(`${provider.id}:${provider.warning}`);
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    digest: digestRecord({ id: snapshot.id, errors, warnings, routeMatrix: snapshot.routeMatrix })
  };
}

function buildOriginalHermesTransportRouterSnapshot(input = {}) {
  const generatedAt = input.generatedAt || new Date().toISOString();
  const contract = buildTransportRouterContract({
    generatedAt,
    sourceDigest: input.sourceDigest || ""
  });
  const providers = safeProviderStatus();
  const workers = safeWorkerStatus(input.workerRouterStatus || {});
  const cognitiveManifest = cognitiveRuntime.buildCognitiveEngineRoute({}).manifest || {};
  const snapshot = {
    id: SNAPSHOT_ID,
    generatedAt,
    status: "TRANSPORT_ROUTER_CONTRACT_STAGED_NO_SECRET_IMPORT_NO_DISPATCH",
    contract,
    bindings: [
      "src/brainPolicy.js",
      "src/connectors/workerRouter.js",
      "src/connectors/externalBrainConnector.js",
      "src/cognitiveEngines/runtimeBridge.js"
    ],
    providers,
    workers,
    cognitiveEngines: cognitiveManifest,
    routeMatrix: buildRouteMatrix({ providers, workers, cognitiveManifest }),
    externalBrainConnector: {
      id: externalBrainManifest().id,
      capabilities: externalBrainManifest().capabilities,
      apiStyles: ["openai_chat_completions", "openai_responses"]
    },
    secretPolicy: {
      importsProviderSecrets: false,
      exposesProviderSecrets: false,
      credentialSource: "existing_secure_vault_only",
      legacyEnvKeyHandling: "warn_and_ignore"
    },
    executionPolicy: {
      dispatchesNow: false,
      launchesGateway: false,
      launchesProviderCalls: false,
      routeOnly: true
    },
    language: {
      human: "Original Hermes transport router contract is staged as a read-only route matrix across workerRouter, externalBrainConnector, and cognitive runtime.",
      agent: "(original_hermes, transport.router, behcs, 3, runtime, hookwall, staged, [providers+workers+engines], map_map_mapped, IX, log, persistent, whiteroom, light)",
      device: "original_hermes_transport_router status=staged dispatches=0 secret_imports=0"
    }
  };
  const validation = validateTransportSnapshot(snapshot);
  return {
    ...snapshot,
    validation,
    digest: digestRecord({ ...snapshot, validation })
  };
}

function manifest() {
  return {
    id: SNAPSHOT_ID,
    description: "Read-only Original Hermes Agent transport-router contract snapshot for Asolaria BEHCS routing surfaces.",
    capabilities: ["transport_contract_snapshot", "provider_status_sanitization", "worker_lane_matrix", "cognitive_engine_route_matrix"],
    sideEffects: [],
    secretPolicy: "existing_secure_vault_only_no_secret_export",
    defaultExecution: "route_only_no_dispatch"
  };
}

module.exports = {
  SNAPSHOT_ID,
  buildOriginalHermesTransportRouterSnapshot,
  validateTransportSnapshot,
  manifest
};
