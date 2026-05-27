const { runCodex } = require("./connectors/codexConnector");
const { runOpenCode } = require("./connectors/opencodeConnector");
const { runVertexGemini } = require("./connectors/vertexConnector");
const { runGeminiApiGenerateContent } = require("./connectors/geminiApiConnector");
const { runAnthropicCli } = require("./connectors/anthropicCliConnector");
const { runGeminiCli } = require("./connectors/geminiCliConnector");
const { runOpenclawAgent } = require("./connectors/openclawConnector");
const {
  listConfiguredExternalProviders,
  runExternalProvider
} = require("./connectors/externalBrainConnector");
const { buildBrainSafetyPrefix } = require("./brainPolicy");
const { appendGraphEvent } = require("./graphRuntimeStore");
const DEFAULT_PROVIDER_CHAIN = Object.freeze([
  "anthropic",
  "codex",
  "gemini-api",
  "vertex",
  "gemini-cli",
  "openclaw",
  "kimi",
  "openai",
  "cursor",
  "antigravity"
]);
const SYSTEM_BUILD_PROVIDER_CHAIN = Object.freeze([
  "codex",
  "anthropic",
  "gemini-api",
  "vertex",
  "gemini-cli",
  "openclaw",
  "kimi",
  "cursor",
  "antigravity"
]);
const SYSTEM_BUILD_PROVIDER_CHAIN_GUARDED = Object.freeze([
  "codex",
  "anthropic",
  "gemini-api",
  "vertex",
  "gemini-cli",
  "openclaw"
]);

function isOpenCodeBrainEnabled(toolPaths = {}) {
  return process.env.ASOLARIA_OPENCODE_BRAIN_ENABLED === "1" && Boolean(toolPaths?.opencodePath);
}

function shouldFallbackToAlternateProvider(error) {
  const text = String(error?.message || error || "").toLowerCase();
  if (!text) {
    return true;
  }

  const hardStops = [
    "guardian blocked",
    "blocked by policy",
    "owner denied",
    "approval denied",
    "deny",
    "denied"
  ];
  if (hardStops.some((term) => text.includes(term))) {
    return false;
  }

  const triggers = [
    "429",
    "quota",
    "credit",
    "insufficient",
    "rate limit",
    "temporarily unavailable",
    "timed out",
    "failed to start codex",
    "not configured",
    "forbidden",
    "unauthorized",
    "authentication",
    "model",
    "unavailable"
  ];
  return triggers.some((term) => text.includes(term)) || text.length > 0;
}

function buildLowCostResponse(message, providersTried) {
  const prompt = String(message || "").trim();
  return [
    "Asolaria switched to low-cost fallback mode.",
    `Providers tried: ${providersTried.join(" -> ") || "none"}.`,
    `I could not complete full reasoning for: "${prompt}".`,
    "Next step: use routed tools (screenshot, Chrome inspect, PAD, local ops) until provider health recovers."
  ].join("\n");
}

function clampMemoryForCost(memoryContext, costMode) {
  const text = String(memoryContext || "").trim();
  if (!text) {
    return "";
  }

  if (costMode === "quality") {
    return text;
  }

  if (costMode === "balanced") {
    const lines = text.split("\n");
    return lines.slice(-10).join("\n");
  }

  const lines = text.split("\n");
  return lines.slice(-6).join("\n");
}

function providerBudgetForCost(costMode) {
  if (costMode === "quality") {
    return { timeoutMs: 300000, maxTokens: 1200, temperature: 0.2 };
  }
  if (costMode === "balanced") {
    return { timeoutMs: 90000, maxTokens: 850, temperature: 0.2 };
  }
  return { timeoutMs: 70000, maxTokens: 600, temperature: 0.1 };
}

function orderExternalProviders(providers) {
  const priority = {
    openai: 0,
    kimi: 1,
    cursor: 2,
    antigravity: 3
  };
  return [...(Array.isArray(providers) ? providers : [])]
    .sort((a, b) => {
      const left = priority[String(a?.id || "").toLowerCase()] ?? 99;
      const right = priority[String(b?.id || "").toLowerCase()] ?? 99;
      if (left !== right) {
        return left - right;
      }
      return String(a?.id || "").localeCompare(String(b?.id || ""));
    });
}

function normalizeBrainProviderId(value) {
  const raw = String(value || "").trim().toLowerCase().replace(/[\s_]+/g, "-");
  if (!raw) return "";
  if (raw === "gemini" || raw === "gemini-api" || raw === "geminiapi") return "gemini-api";
  if (raw === "gemini-cli" || raw === "google-cli") return "gemini-cli";
  if (raw === "vertex" || raw === "vertex-ai") return "vertex";
  if (raw === "anthropic" || raw === "claude" || raw === "anthropic-cli") return "anthropic";
  if (raw === "opencode" || raw === "open-code" || raw === "open-code-cli") return "opencode";
  if (raw === "codex") return "codex";
  if (raw === "openclaw" || raw === "openclaw-local") return "openclaw";
  if (raw === "kimi" || raw === "moonshot" || raw === "kimi-k2.6") return "kimi";
  if (raw === "openai" || raw === "gpt" || raw === "chatgpt") return "openai";
  if (raw === "cursor") return "cursor";
  if (raw === "antigravity") return "antigravity";
  return "";
}

function parseBrainProviderOrder(value, fallback = []) {
  const source = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[,;\n|]/)
      : [];
  const parsed = [];
  for (const entry of source) {
    const provider = normalizeBrainProviderId(entry);
    if (!provider) continue;
    parsed.push(provider);
  }
  if (parsed.length > 0) {
    return parsed;
  }
  return Array.isArray(fallback) ? fallback.map((entry) => normalizeBrainProviderId(entry)).filter(Boolean) : [];
}

function dedupeProviderOrder(items = []) {
  const out = [];
  const seen = new Set();
  for (const item of items) {
    const provider = normalizeBrainProviderId(item);
    if (!provider || seen.has(provider)) {
      continue;
    }
    seen.add(provider);
    out.push(provider);
  }
  return out;
}

function buildEffectiveProviderOrder(settings = {}) {
  const primary = normalizeBrainProviderId(settings.brainPrimaryProvider) || "anthropic";
  const fallback = parseBrainProviderOrder(
    settings.brainFallbackOrder,
    ["anthropic", "gemini-api", "vertex", "gemini-cli", "openclaw", "kimi", "cursor", "antigravity"]
  );
  return dedupeProviderOrder([primary, ...fallback, ...DEFAULT_PROVIDER_CHAIN]);
}

function redactSensitiveFragments(text) {
  const raw = String(text || "");
  if (!raw) {
    return "";
  }
  return raw
    .replace(/\b(password|passphrase|token|api key|secret|private key|session cookie)\b\s*[:=]\s*[^\s,\n]+/gi, "$1=[REDACTED]")
    .replace(/\b(bearer)\s+[a-z0-9._~+/=-]{16,}\b/gi, "$1 [REDACTED]")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, (match) => {
      const at = match.indexOf("@");
      if (at <= 1) return "[REDACTED_EMAIL]";
      return `${match.slice(0, 1)}***${match.slice(at)}`;
    });
}

function containsSensitiveMaterial(text) {
  const value = String(text || "");
  if (!value) {
    return false;
  }
  const patterns = [
    /\b(password|passphrase|token|api key|secret|private key|session cookie|oauth)\b/i,
    /\b(bearer)\s+[a-z0-9._~+/=-]{16,}\b/i
  ];
  return patterns.some((pattern) => pattern.test(value));
}

function isSystemBuildShapedTask(message, executionProfile = {}) {
  if (executionProfile?.systemBuild === true || executionProfile?.orchestration === true) {
    return true;
  }
  const haystack = [
    message,
    executionProfile?.intent,
    executionProfile?.taskType,
    executionProfile?.mode,
    executionProfile?.label
  ].map((value) => String(value || "").toLowerCase()).join(" ");
  if (!haystack) {
    return false;
  }
  const patterns = [
    /\bsystem[-\s]?build\b/,
    /\bself[-\s]?build\b/,
    /\borchestr(?:ate|ation)\b/,
    /\batlas\b/,
    /\bcontroller\b/,
    /\blane\b/,
    /\bomnispindle\b/,
    /\bbehcs\b/,
    /\bfalcon\b/,
    /\bglyph\b/,
    /\btask manager\b/,
    /\bfile cap\b/,
    /\bgarbage collection\b/,
    /\bgc\b/,
    /\bmap(?:ped)?\b/,
    /\bcube(?:d)?\b/
  ];
  return patterns.some((pattern) => pattern.test(haystack));
}

function normalizeSystemBuildStatus(value, fallback = "hold") {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return fallback;
  if (["pass", "warn", "hold", "deny", "pending", "executing", "ready", "blocked"].includes(normalized)) {
    return normalized;
  }
  return fallback;
}

function toFiniteNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readAtlasTruthClassification(atlasStore) {
  if (!atlasStore || typeof atlasStore.getIxFabricAtlasStatus !== "function") {
    return {
      activeEntryCount: 0,
      archiveEntryCount: 0,
      combinedEntryCount: 0,
      truthTier: "unknown",
      shadowOnly: false,
      shadowPresent: false
    };
  }
  try {
    const atlasStatus = atlasStore.getIxFabricAtlasStatus({});
    const summary = atlasStatus?.summary && typeof atlasStatus.summary === "object"
      ? atlasStatus.summary
      : {};
    const activeEntryCount = toFiniteNumber(summary.totalEntries);
    const archiveEntryCount = toFiniteNumber(summary.archiveEntryCount);
    const combinedEntryCount = toFiniteNumber(summary.combinedReachableEntryCount);
    const shadowPresent = archiveEntryCount > 0;
    const shadowOnly = activeEntryCount <= 0 && shadowPresent;
    const truthTier = shadowOnly
      ? "shadow_only"
      : shadowPresent
        ? "live_with_shadow"
        : activeEntryCount > 0
          ? "live_only"
          : "unknown";
    return {
      activeEntryCount,
      archiveEntryCount,
      combinedEntryCount,
      truthTier,
      shadowOnly,
      shadowPresent
    };
  } catch (_error) {
    return {
      activeEntryCount: 0,
      archiveEntryCount: 0,
      combinedEntryCount: 0,
      truthTier: "unknown",
      shadowOnly: false,
      shadowPresent: false
    };
  }
}

function prefersPrivilegedCodex(codexOptions = {}, executionProfile = {}) {
  if (executionProfile?.preferCodexPriority === true || executionProfile?.codexPrivileged === true) {
    return true;
  }
  const sandbox = String(codexOptions?.sandbox || "").trim().toLowerCase();
  const askForApproval = String(codexOptions?.askForApproval || "").trim().toLowerCase();
  return sandbox === "danger-full-access" || askForApproval === "on-request" || askForApproval === "untrusted";
}

function buildSystemBuildProviderOrder({ guarded, preferCodex }) {
  const base = guarded
    ? SYSTEM_BUILD_PROVIDER_CHAIN_GUARDED
    : SYSTEM_BUILD_PROVIDER_CHAIN;
  if (!preferCodex) {
    return base.slice();
  }
  return ["codex", ...base.filter((provider) => provider !== "codex" && provider !== "opencode")];
}

function summarizeSecondaryContextRefs(refs = []) {
  if (!Array.isArray(refs) || refs.length <= 0) {
    return "";
  }
  const counts = { secondary: 0, shadow: 0, mirror: 0, archive: 0 };
  for (const entry of refs) {
    const kind = String(entry?.kind || "secondary").trim().toLowerCase();
    if (Object.prototype.hasOwnProperty.call(counts, kind)) {
      counts[kind] += 1;
    } else {
      counts.secondary += 1;
    }
  }
  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([kind, count]) => `${kind}:${count}`)
    .join(",");
}

function buildSystemBuildTransport(controllerInput = {}) {
  try {
    const {
      normalizeSelfBuildController,
      buildSelfBuildControllerLanguage
    } = require("./hg256RuntimeContract");
    if (typeof normalizeSelfBuildController !== "function") {
      return null;
    }
    const selfBuildController = normalizeSelfBuildController(controllerInput);
    if (!selfBuildController) {
      return null;
    }
    return {
      transportId: "hg256_self_build_controller",
      selfBuildController,
      selfBuildLanguage: typeof buildSelfBuildControllerLanguage === "function"
        ? buildSelfBuildControllerLanguage(selfBuildController)
        : null
    };
  } catch (_error) {
    return null;
  }
}

function readSystemBuildTruth() {
  let atlasStore = null;
  try {
    atlasStore = require("./ixFabricAtlasStore");
  } catch (_error) {
    const atlasTruth = readAtlasTruthClassification(null);
    return {
      available: false,
      source: "atlas_store_unavailable",
      guardStatus: "hold",
      controllerStatus: "hold",
      activeLaneId: "",
      nextLaneId: "",
      recommendedTasks: [],
      ...atlasTruth
    };
  }
  const atlasTruth = readAtlasTruthClassification(atlasStore);

  if (typeof atlasStore.getIxSelfBuildControllerPacket === "function") {
    try {
      const packet = atlasStore.getIxSelfBuildControllerPacket({});
      if (packet && typeof packet === "object") {
        return {
          available: Boolean(packet.ok || packet.enabled || packet.packetType),
          source: "self_build_packet",
          guardStatus: normalizeSystemBuildStatus(packet.guardStatus || packet.guardPosture?.gateStatus, "hold"),
          controllerStatus: normalizeSystemBuildStatus(packet.controllerStatus || packet.status, "hold"),
          activeLaneId: String(packet.activeLane?.id || packet.activeLaneId || "").trim(),
          nextLaneId: String(packet.nextQueueReadyLane?.id || packet.nextLaneId || "").trim(),
          recommendedTasks: Array.isArray(packet.recommendedTasks) ? packet.recommendedTasks.slice(0, 6) : [],
          ...atlasTruth
        };
      }
    } catch (_error) {
      // Fall through to orchestration status below.
    }
  }

  if (typeof atlasStore.getIxOrchestrationStatus === "function") {
    try {
      const orchestration = atlasStore.getIxOrchestrationStatus({});
      if (orchestration && typeof orchestration === "object") {
        const controller = orchestration.controller && typeof orchestration.controller === "object"
          ? orchestration.controller
          : {};
        return {
          available: Boolean(orchestration.ok || orchestration.enabled),
          source: "orchestration_status",
          guardStatus: normalizeSystemBuildStatus(orchestration.guards?.gateStatus || controller.guardSummary?.gateStatus, "hold"),
          controllerStatus: normalizeSystemBuildStatus(controller.status || orchestration.status, "hold"),
          activeLaneId: String(controller.activeLaneIds?.[0] || "").trim(),
          nextLaneId: String(controller.nextLaneId || controller.queueReadyLaneIds?.[0] || "").trim(),
          recommendedTasks: Array.isArray(orchestration.recommendations) ? orchestration.recommendations.slice(0, 6) : [],
          ...atlasTruth
        };
      }
    } catch (_error) {
      // Fall through to bounded default below.
    }
  }

  return {
    available: false,
    source: "atlas_truth_unavailable",
    guardStatus: "hold",
    controllerStatus: "hold",
    activeLaneId: "",
    nextLaneId: "",
    recommendedTasks: [],
    ...atlasTruth
  };
}

function deriveSystemBuildExecutionHints(message, executionProfile = {}, codexOptions = {}) {
  if (!isSystemBuildShapedTask(message, executionProfile)) {
    return {
      applied: false
    };
  }
  const truth = readSystemBuildTruth();
  const activeLaneId = String(truth.activeLaneId || "").trim() || "memory-index-docs";
  const nextLaneId = String(truth.nextLaneId || "").trim() || "desktop-phone-mirror";
  const laneAligned = activeLaneId === "memory-index-docs" && nextLaneId === "desktop-phone-mirror";
  const guardStatus = normalizeSystemBuildStatus(truth.guardStatus, "hold");
  const guarded =
    guardStatus === "warn"
    || guardStatus === "hold"
    || guardStatus === "deny"
    || !truth.available
    || Boolean(truth.shadowOnly)
    || !laneAligned;
  const preferCodex = prefersPrivilegedCodex(codexOptions, executionProfile);
  const transport = buildSystemBuildTransport({
    packetType: "self_build_controller_packet.v1",
    activeLane: activeLaneId,
    nextQueueReadyLane: nextLaneId,
    guardStatus,
    localOnly: true,
    bounded: true,
    noPromotionClaims: true,
    proofBudget: {
      trackedFiles: toFiniteNumber(truth.activeEntryCount),
      maxTrackedFiles: Math.max(toFiniteNumber(truth.combinedEntryCount), toFiniteNumber(truth.activeEntryCount)),
      remainingFiles: Math.max(0, toFiniteNumber(truth.combinedEntryCount) - toFiniteNumber(truth.activeEntryCount))
    },
    controllerTasks: Array.isArray(truth.recommendedTasks) ? truth.recommendedTasks.slice(0, 6) : [],
    shadowRefs: truth.shadowPresent ? [`ix_fabric_atlas.shadow_entries=${toFiniteNumber(truth.archiveEntryCount)}`] : [],
    archiveRefs: toFiniteNumber(truth.archiveEntryCount) > 0 ? ["ix_fabric_atlas.archive_surface"] : [],
    mirrorRefs: String(truth.source || "").toLowerCase().includes("mirror") ? [String(truth.source)] : [],
    secondaryContextRefs: [{
      kind: "secondary",
      ref: `ix_fabric_atlas.truth_tier=${String(truth.truthTier || "unknown").trim() || "unknown"}`
    }]
  });
  return {
    applied: true,
    source: String(truth.source || "atlas_truth_unavailable").trim(),
    truthAvailable: Boolean(truth.available),
    controllerStatus: normalizeSystemBuildStatus(truth.controllerStatus, "hold"),
    guardStatus,
    activeLaneId,
    nextLaneId,
    laneAligned,
    truthTier: String(truth.truthTier || "unknown").trim() || "unknown",
    shadowOnly: Boolean(truth.shadowOnly),
    shadowPresent: Boolean(truth.shadowPresent),
    activeEntryCount: toFiniteNumber(truth.activeEntryCount),
    archiveEntryCount: toFiniteNumber(truth.archiveEntryCount),
    combinedEntryCount: toFiniteNumber(truth.combinedEntryCount),
    recommendedTasks: Array.isArray(truth.recommendedTasks) ? truth.recommendedTasks : [],
    recommendedProviderOrder: buildSystemBuildProviderOrder({ guarded, preferCodex }),
    forceInternalOnly: true,
    disableCodexWebSearch: true,
    transport
  };
}

function applySystemBuildExecutionHints(executionProfile = {}, hints = {}) {
  const out = executionProfile && typeof executionProfile === "object"
    ? { ...executionProfile }
    : {};
  if (!hints.applied) {
    return out;
  }
  const explicitProviderOrder = parseBrainProviderOrder(out.providerOrder, []);
  if (explicitProviderOrder.length === 0 && Array.isArray(hints.recommendedProviderOrder) && hints.recommendedProviderOrder.length > 0) {
    out.providerOrder = hints.recommendedProviderOrder.slice();
  }
  if (typeof out.internalOnly !== "boolean") {
    out.internalOnly = true;
  }
  if (typeof out.codexWebSearch !== "boolean" && hints.disableCodexWebSearch) {
    out.codexWebSearch = false;
  }
  return out;
}

function buildSystemBuildPrefix(hints = {}) {
  if (!hints.applied) {
    return "";
  }
  const secondarySummary = summarizeSecondaryContextRefs(hints.transport?.selfBuildController?.secondaryContextRefs || []);
  return [
    "Local orchestration context (bounded, read-only local truth):",
    `source=${String(hints.source || "atlas_truth_unavailable").trim() || "atlas_truth_unavailable"}`,
    `truth_available=${hints.truthAvailable ? "true" : "false"}`,
    `controller_status=${String(hints.controllerStatus || "hold").trim() || "hold"}`,
    `guard_status=${String(hints.guardStatus || "hold").trim() || "hold"}`,
    `active_lane=${String(hints.activeLaneId || "none").trim() || "none"}`,
    `next_lane=${String(hints.nextLaneId || "none").trim() || "none"}`,
    `lane_aligned=${hints.laneAligned ? "true" : "false"}`,
    `truth_tier=${String(hints.truthTier || "unknown").trim() || "unknown"}`,
    `active_entries=${toFiniteNumber(hints.activeEntryCount)}`,
    `shadow_entries=${toFiniteNumber(hints.archiveEntryCount)}`,
    `shadow_present=${hints.shadowPresent ? "true" : "false"}`,
    `shadow_only=${hints.shadowOnly ? "true" : "false"}`,
    `transport=${String(hints.transport?.transportId || "none").trim() || "none"}`,
    `secondary_refs=${secondarySummary || "none"}`,
    "Shadow/mirror/archive surfaces are evidence-only and must never be treated as live/promoted truth.",
    hints.transport?.selfBuildLanguage?.agent || "",
    "Use this only as route/profile guidance; do not claim autonomous promotion."
  ].filter(Boolean).join("\n");
}

function providerCriticality(providerId = "") {
  const normalized = String(providerId || "").trim().toLowerCase();
  if (normalized === "codex" || normalized === "vertex") return "high";
  if (normalized === "kimi" || normalized === "cursor" || normalized === "antigravity") return "high";
  return "medium";
}

function recordProviderEvent(action, providerId, details = {}) {
  appendGraphEvent({
    component: "brain-orchestrator",
    category: "provider",
    action,
    status: details.status || "",
    actor: {
      type: "orchestrator",
      id: "asolaria"
    },
    target: {
      type: "provider",
      id: providerId,
      criticality: providerCriticality(providerId)
    },
    context: {
      mode: details.mode || "",
      tool: providerId,
      costMode: details.costMode || "",
      providersTried: Array.isArray(details.providersTried) ? details.providersTried.slice(0, 12).join(",") : ""
    },
    policy: {
      mode: details.mode || "",
      approvalState: details.approvalState || "",
      autonomous: true
    },
    detail: {
      note: details.note || "",
      error: details.error || ""
    }
  });
}

async function runBrainTask({ message, images, files, memoryContext, settings, toolPaths, onApprovalEscalated, codexOptions, executionProfile }) {
  const safeSettings = settings || {};
  const safeImages = Array.isArray(images) ? images : [];
  const safeFiles = Array.isArray(files) ? files : [];
  let safeExecutionProfile = executionProfile && typeof executionProfile === "object"
    ? executionProfile
    : {};
  const costMode = String(safeSettings.costMode || "low").toLowerCase();
  const providersTried = [];
  const systemBuildHints = deriveSystemBuildExecutionHints(message, safeExecutionProfile, codexOptions);
  safeExecutionProfile = applySystemBuildExecutionHints(safeExecutionProfile, systemBuildHints);
  if (systemBuildHints.applied) {
    const appliedOrder = parseBrainProviderOrder(safeExecutionProfile.providerOrder, []);
    recordProviderEvent("provider_policy", "self-build-routing", {
      status: systemBuildHints.truthAvailable ? "ok" : "degraded",
      mode: "brain",
      costMode,
      providersTried,
      note: [
        `source=${systemBuildHints.source}`,
        `controller=${systemBuildHints.controllerStatus}`,
        `guard=${systemBuildHints.guardStatus}`,
        `truth_tier=${systemBuildHints.truthTier}`,
        `shadow_only=${systemBuildHints.shadowOnly}`,
        `secondary_refs=${summarizeSecondaryContextRefs(systemBuildHints.transport?.selfBuildController?.secondaryContextRefs || []) || "none"}`,
        `lane_aligned=${systemBuildHints.laneAligned}`,
        `internal_only=${Boolean(safeExecutionProfile.internalOnly)}`,
        `transport=${String(systemBuildHints.transport?.transportId || "none").trim() || "none"}`,
        `provider_order=${appliedOrder.join("->") || "settings_default"}`
      ].join(" ")
    });
  }
  const policyPrefix = [
    buildBrainSafetyPrefix(safeSettings),
    buildSystemBuildPrefix(systemBuildHints)
  ].filter(Boolean).join("\n\n");
  const slimMemory = clampMemoryForCost(memoryContext, costMode);
  const composedPrompt = [policyPrefix, "Task:", String(message || "").trim()].join("\n\n");
  const budget = providerBudgetForCost(costMode);
  const externalProviders = orderExternalProviders(listConfiguredExternalProviders());
  const externalById = new Map(
    externalProviders.map((provider) => [String(provider?.id || "").trim().toLowerCase(), provider])
  );
  const requestedProviderOrder = parseBrainProviderOrder(safeExecutionProfile.providerOrder, []);
  const providerOrder = requestedProviderOrder.length > 0
    ? dedupeProviderOrder(requestedProviderOrder)
    : buildEffectiveProviderOrder(safeSettings);
  const strictProviderMode = Boolean(safeExecutionProfile.disableFallback) || providerOrder.length <= 1;
  const internalOnly = Boolean(safeExecutionProfile.internalOnly);
  const externalBlockedForSensitiveData =
    safeImages.length > 0
    || safeFiles.length > 0
    || containsSensitiveMaterial(message)
    || containsSensitiveMaterial(memoryContext);
  let externalSensitiveBlockNoted = false;
  const requestedCodexSandbox = String(codexOptions?.sandbox || "").trim().toLowerCase();
  const codexSandbox = ["read-only", "workspace-write", "danger-full-access"].includes(requestedCodexSandbox)
    ? requestedCodexSandbox
    : "workspace-write";
  const requestedCodexApprovalMode = String(codexOptions?.askForApproval || "").trim().toLowerCase();
  const codexAskForApproval = ["untrusted", "on-failure", "on-request", "never"].includes(requestedCodexApprovalMode)
    ? requestedCodexApprovalMode
    : "never";
  const codexWebSearch = typeof safeExecutionProfile.codexWebSearch === "boolean"
    ? safeExecutionProfile.codexWebSearch
    : Boolean(safeSettings.codexWebSearch);

  for (const providerKey of providerOrder) {
    if (internalOnly && providerKey !== "codex" && providerKey !== "opencode") {
      providersTried.push(`${providerKey}-blocked-internal`);
      recordProviderEvent("provider_skipped", providerKey, {
        status: "blocked",
        mode: "brain",
        costMode,
        providersTried,
        note: "Execution profile restricted this run to the internal local lanes."
      });
      continue;
    }

    if (providerKey === "opencode") {
      const opencodeEnabled = isOpenCodeBrainEnabled(toolPaths);
      if (!opencodeEnabled) {
        providersTried.push("opencode-unavailable");
        recordProviderEvent("provider_unavailable", "opencode", {
          status: "blocked",
          mode: "brain",
          costMode,
          providersTried,
          note: "OpenCode brain lane requires ASOLARIA_OPENCODE_BRAIN_ENABLED=1 and a shellless executable path."
        });
        if (strictProviderMode || safeExecutionProfile.failIfUnavailable) {
          throw new Error("Direct OpenCode lane is unavailable.");
        }
        continue;
      }
      providersTried.push("opencode");
      recordProviderEvent("provider_attempt", "opencode", {
        status: "attempting",
        mode: "brain",
        costMode,
        providersTried
      });
      try {
        const timeoutMs = costMode === "quality" ? 180000 : costMode === "balanced" ? 120000 : 80000;
        const result = await runOpenCode({
          prompt: composedPrompt,
          model: String(safeExecutionProfile.opencodeModel || safeSettings.opencodeModel || "").trim(),
          agent: String(safeExecutionProfile.opencodeAgent || safeSettings.opencodeAgent || "").trim(),
          variant: String(safeExecutionProfile.opencodeVariant || safeSettings.opencodeVariant || "").trim(),
          dir: process.cwd(),
          timeoutMs
        });
        recordProviderEvent("provider_succeeded", "opencode", {
          status: "ok",
          mode: "brain",
          costMode,
          providersTried
        });
        return {
          provider: "opencode",
          model: String(result?.model || safeSettings.opencodeModel || "").trim(),
          providersTried,
          ...result
        };
      } catch (error) {
        recordProviderEvent("provider_failed", "opencode", {
          status: "failed",
          mode: "brain",
          costMode,
          providersTried,
          error: String(error?.message || error || "opencode_failed").slice(0, 220)
        });
        if (strictProviderMode) {
          throw error;
        }
        if (!shouldFallbackToAlternateProvider(error)) {
          throw error;
        }
        continue;
      }
    }

    if (providerKey === "codex") {
      const codexEnabled = Boolean(toolPaths?.codexPath);
      if (!codexEnabled) {
        providersTried.push("codex-unavailable");
        recordProviderEvent("provider_unavailable", "codex", {
          status: "blocked",
          mode: "brain",
          costMode,
          providersTried,
          note: "Codex path is unavailable."
        });
        if (strictProviderMode || safeExecutionProfile.failIfUnavailable) {
          throw new Error("Direct Codex lane is unavailable.");
        }
        continue;
      }
      providersTried.push("codex");
      recordProviderEvent("provider_attempt", "codex", {
        status: "attempting",
        mode: "brain",
        costMode,
        providersTried
      });
      try {
        const timeoutMs = costMode === "quality" ? 240000 : costMode === "balanced" ? 150000 : 90000;
        // Keep brain responses bounded for interactive channels even when policy prefers pay-priority approvals.
        // Approval windows still apply inside the connector, but the outer task should not stall for 20 minutes.
        const effectiveTimeoutMs = Math.max(60000, Math.min(300000, Number(timeoutMs || 90000)));
        const result = await runCodex({
          prompt: composedPrompt,
          images: safeImages,
          memoryContext: slimMemory,
          model: String(safeSettings.codexModel || "").trim(),
          modelReasoningEffort: String(safeSettings.codexModelReasoningEffort || "").trim().toLowerCase(),
          approvalMode: safeSettings.approvalMode || "smart",
          approvalPreference: safeSettings.approvalPreference || "balanced",
          webSearch: codexWebSearch,
          sandbox: codexSandbox,
          askForApproval: codexAskForApproval,
          timeoutMs: effectiveTimeoutMs,
          approvalWaitMs: Number(safeSettings.approvalWaitMs || 20 * 60 * 1000),
          onApprovalEscalated
        });
        recordProviderEvent("provider_succeeded", "codex", {
          status: "ok",
          mode: "brain",
          costMode,
          providersTried
        });
        return {
          provider: "codex",
          model: String(result?.resolvedModel || result?.model || safeSettings.codexModel || "").trim(),
          providersTried,
          ...result
        };
      } catch (error) {
        recordProviderEvent("provider_failed", "codex", {
          status: "failed",
          mode: "brain",
          costMode,
          providersTried,
          error: String(error?.message || error || "codex_failed").slice(0, 220)
        });
        if (strictProviderMode) {
          throw error;
        }
        if (!shouldFallbackToAlternateProvider(error)) {
          throw error;
        }
        continue;
      }
    }

    if (providerKey === "vertex") {
      providersTried.push("vertex");
      recordProviderEvent("provider_attempt", "vertex", {
        status: "attempting",
        mode: "brain",
        costMode,
        providersTried
      });
      try {
        const prompt = [
          policyPrefix,
          "Task:",
          String(message || "").trim(),
          slimMemory ? `Context:\n${slimMemory}` : ""
        ].filter(Boolean).join("\n\n");
        const result = await runVertexGemini({
          prompt,
          maxOutputTokens: budget.maxTokens,
          temperature: budget.temperature
        }, {
          enabled: true
        });
        recordProviderEvent("provider_succeeded", "vertex", {
          status: "ok",
          mode: "brain",
          costMode,
          providersTried
        });
        return {
          provider: "vertex",
          model: String(result?.model || "").trim(),
          providersTried,
          reply: result.reply,
          approvals: [],
          imagesUsed: safeImages,
          raw: result.raw,
          budget: result.budget || null
        };
      } catch (error) {
        recordProviderEvent("provider_failed", "vertex", {
          status: "failed",
          mode: "brain",
          costMode,
          providersTried,
          error: String(error?.message || error || "vertex_failed").slice(0, 220)
        });
        if (!shouldFallbackToAlternateProvider(error)) {
          throw error;
        }
        continue;
      }
    }

    if (providerKey === "anthropic") {
      providersTried.push("anthropic");
      recordProviderEvent("provider_attempt", "anthropic", {
        status: "attempting",
        mode: "brain",
        costMode,
        providersTried
      });
      try {
        const prompt = [
          policyPrefix,
          "Task:",
          String(message || "").trim(),
          slimMemory ? `Context:\n${slimMemory}` : ""
        ].filter(Boolean).join("\n\n");
        const result = await runAnthropicCli(prompt, {
          timeoutMs: budget.timeoutMs,
          model: String(safeSettings.anthropicModel || process.env.ASOLARIA_ANTHROPIC_MODEL || "").trim()
        });
        recordProviderEvent("provider_succeeded", "anthropic", {
          status: "ok",
          mode: "brain",
          costMode,
          providersTried
        });
        return {
          provider: "anthropic",
          model: String(result?.model || safeSettings.anthropicModel || process.env.ASOLARIA_ANTHROPIC_MODEL || "").trim(),
          providersTried,
          reply: result.reply,
          approvals: [],
          imagesUsed: safeImages,
          raw: result.raw
        };
      } catch (error) {
        recordProviderEvent("provider_failed", "anthropic", {
          status: "failed",
          mode: "brain",
          costMode,
          providersTried,
          error: String(error?.message || error || "anthropic_failed").slice(0, 220)
        });
        if (!shouldFallbackToAlternateProvider(error)) {
          throw error;
        }
        continue;
      }
    }

    if (providerKey === "gemini-cli") {
      providersTried.push("gemini-cli");
      recordProviderEvent("provider_attempt", "gemini-cli", {
        status: "attempting",
        mode: "brain",
        costMode,
        providersTried
      });
      try {
        const prompt = [
          policyPrefix,
          "Task:",
          String(message || "").trim(),
          slimMemory ? `Context:\n${slimMemory}` : ""
        ].filter(Boolean).join("\n\n");
        const result = await runGeminiCli(prompt, {
          timeoutMs: budget.timeoutMs,
          model: String(safeSettings.geminiCliModel || process.env.ASOLARIA_GEMINI_MODEL || "").trim()
        });
        recordProviderEvent("provider_succeeded", "gemini-cli", {
          status: "ok",
          mode: "brain",
          costMode,
          providersTried
        });
        return {
          provider: "gemini-cli",
          model: String(result?.model || safeSettings.geminiCliModel || process.env.ASOLARIA_GEMINI_MODEL || "").trim(),
          providersTried,
          reply: result.reply,
          approvals: [],
          imagesUsed: safeImages,
          raw: result.raw
        };
      } catch (error) {
        recordProviderEvent("provider_failed", "gemini-cli", {
          status: "failed",
          mode: "brain",
          costMode,
          providersTried,
          error: String(error?.message || error || "gemini_cli_failed").slice(0, 220)
        });
        if (!shouldFallbackToAlternateProvider(error)) {
          throw error;
        }
        continue;
      }
    }

    if (providerKey === "gemini-api") {
      providersTried.push("gemini-api");
      recordProviderEvent("provider_attempt", "gemini-api", {
        status: "attempting",
        mode: "brain",
        costMode,
        providersTried
      });
      try {
        const prompt = [
          "Task:",
          String(message || "").trim(),
          slimMemory ? `Context:\n${slimMemory}` : ""
        ].filter(Boolean).join("\n\n");
        const result = await runGeminiApiGenerateContent({
          prompt,
          system: policyPrefix,
          maxOutputTokens: budget.maxTokens,
          temperature: budget.temperature
        }, {
          enabled: true
        });
        recordProviderEvent("provider_succeeded", "gemini-api", {
          status: "ok",
          mode: "brain",
          costMode,
          providersTried
        });
        return {
          provider: "gemini-api",
          model: String(result?.model || "").trim(),
          providersTried,
          reply: result.reply,
          approvals: [],
          imagesUsed: safeImages,
          raw: result.raw
        };
      } catch (error) {
        recordProviderEvent("provider_failed", "gemini-api", {
          status: "failed",
          mode: "brain",
          costMode,
          providersTried,
          error: String(error?.message || error || "gemini_api_failed").slice(0, 220)
        });
        if (!shouldFallbackToAlternateProvider(error)) {
          throw error;
        }
        continue;
      }
    }

    if (providerKey === "openclaw") {
      if (String(safeSettings.openclawMode || "read_only").trim().toLowerCase() === "disabled") {
        providersTried.push("openclaw-disabled");
        recordProviderEvent("provider_skipped", "openclaw", {
          status: "blocked",
          mode: "brain",
          costMode,
          providersTried,
          note: "OpenClaw is disabled by settings."
        });
        continue;
      }
      providersTried.push("openclaw");
      recordProviderEvent("provider_attempt", "openclaw", {
        status: "attempting",
        mode: "brain",
        costMode,
        providersTried
      });
      try {
        const prompt = [
          policyPrefix,
          "Task:",
          String(message || "").trim(),
          slimMemory ? `Context:\n${slimMemory}` : ""
        ].filter(Boolean).join("\n\n");
        const result = await runOpenclawAgent(prompt, {
          timeoutMs: Math.max(20000, budget.timeoutMs)
        });
        recordProviderEvent("provider_succeeded", "openclaw", {
          status: "ok",
          mode: "brain",
          costMode,
          providersTried
        });
        return {
          provider: "openclaw",
          model: String(result?.model || "").trim(),
          providersTried,
          reply: result.reply,
          approvals: [],
          imagesUsed: safeImages,
          raw: result.raw
        };
      } catch (error) {
        recordProviderEvent("provider_failed", "openclaw", {
          status: "failed",
          mode: "brain",
          costMode,
          providersTried,
          error: String(error?.message || error || "openclaw_failed").slice(0, 220)
        });
        if (!shouldFallbackToAlternateProvider(error)) {
          throw error;
        }
        continue;
      }
    }

    if (providerKey === "openai" || providerKey === "kimi" || providerKey === "cursor" || providerKey === "antigravity") {
      if (externalBlockedForSensitiveData) {
        if (!externalSensitiveBlockNoted) {
          providersTried.push("external-blocked-sensitive");
          externalSensitiveBlockNoted = true;
        }
        recordProviderEvent("provider_skipped", providerKey, {
          status: "blocked",
          mode: "brain",
          costMode,
          providersTried,
          note: "External provider blocked for sensitive data."
        });
        continue;
      }
      const provider = externalById.get(providerKey);
      if (!provider) {
        providersTried.push(`${providerKey}-not-configured`);
        recordProviderEvent("provider_unavailable", providerKey, {
          status: "blocked",
          mode: "brain",
          costMode,
          providersTried,
          note: "External provider not configured."
        });
        continue;
      }
      providersTried.push(provider.id);
      recordProviderEvent("provider_attempt", provider.id, {
        status: "attempting",
        mode: "brain",
        costMode,
        providersTried
      });
      try {
        const result = await runExternalProvider(provider, {
          prompt: [
            policyPrefix,
            "Task:",
            redactSensitiveFragments(String(message || "").trim()),
            slimMemory ? `Context:\n${redactSensitiveFragments(slimMemory)}` : ""
          ].filter(Boolean).join("\n\n"),
          timeoutMs: budget.timeoutMs,
          maxTokens: budget.maxTokens,
          temperature: budget.temperature
        });
        recordProviderEvent("provider_succeeded", provider.id, {
          status: "ok",
          mode: "brain",
          costMode,
          providersTried
        });
        return {
          provider: provider.id,
          model: String(result?.model || "").trim(),
          providersTried,
          reply: result.reply,
          approvals: [],
          imagesUsed: safeImages,
          raw: result.raw
        };
      } catch (error) {
        recordProviderEvent("provider_failed", provider.id, {
          status: "failed",
          mode: "brain",
          costMode,
          providersTried,
          error: String(error?.message || error || "external_provider_failed").slice(0, 220)
        });
        // Continue to next external provider in configured order.
        continue;
      }
    }
  }

  if (strictProviderMode || safeExecutionProfile.failIfUnavailable) {
    throw new Error("Direct Codex lane did not complete successfully.");
  }

  providersTried.push("template-fallback");
  recordProviderEvent("provider_fallback", "template-fallback", {
    status: "degraded",
    mode: "brain",
    costMode,
    providersTried,
    note: "All configured providers failed or were unavailable."
  });
  return {
    provider: "template-fallback",
    providersTried,
    reply: buildLowCostResponse(message, providersTried),
    approvals: [],
    imagesUsed: safeImages
  };
}

module.exports = {
  runBrainTask
};
