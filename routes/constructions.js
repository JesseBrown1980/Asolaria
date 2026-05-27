/**
 * Construction Simulation API Routes
 *
 * Exposes the construction pipeline, instant agent spawner, tracer spindles,
 * and GNN watcher to the Asolaria runtime API.
 */

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const express = require("express");
const router = express.Router();

const {
  initializeConstructions,
  getConstruction,
  getAllConstructions,
  registerConstruction,
  removeConstruction,
  routeToConstruction,
  buildConstructionEntities,
  saveConstructionState,
  loadConstructionState,
  getConstructionIdForSelfBuildLane
} = require("../src/constructionIndex");

const {
  spawnInstantAgent,
  completeAndTransfer,
  getActiveAgents,
  getSpawnerStatus,
  getAllTracers,
  initializeTracers
} = require("../src/instantAgentSpawner");

const {
  predictConstruction,
  getWatcherStatus,
  startWatcher,
  popPreSpawn
} = require("../src/gnnConstructionWatcher");

const {
  getOrCreateIndex,
  getIndex,
  getAllIndexes,
  initializeQddIndexes,
  saveIndexes
} = require("../src/constructionToolIndex");
const {
  getWorkerRouterStatus,
  getWorkerRouterSelfBuildPosture,
  recommendWorker,
  dispatchWorkerTask
} = require("../src/connectors/workerRouter");
const {
  buildMistakeAvoidanceHints,
  getMistakePatternSummary
} = require("../src/mistakePatternStore");
const { getOmnispindle } = require("../src/omnispindle");
const {
  getIxFabricAtlasStatus,
  getIxPromotionQueue,
  getIxControllerGuards,
  getIxDeepWaveAgentGuide,
  getIxDeepWaveFalconLanguage,
  getIxDeepWaveCrosswalk,
  getIxOrchestrationStatus,
  getIxSelfBuildControllerPacket,
  queryIxAtlasSurfaces,
  queryIxConnectorExternalSurfaces,
  resolveIxRuntimeBinding
} = require("../src/ixFabricAtlasStore");
const { queryHookEvents, getRouteHookStats } = require("../src/connectors/hooksConnector");
const {
  buildAsolariaAssignableTaskBoard,
  readAsolariaAssignableTaskBoard
} = require("../sovereignty/src/asolariaAssignableTaskBoard");
const {
  collectorStatus,
  scheduleGulp,
  runGulpRehydration
} = require("../tools/behcs/behcs-gulp-runtime");
const { translate } = require("../tools/cube/omni-processor/omnitranslator-v0");
const {
  buildWave: buildOmniHookwallGnnAlignmentWave,
  buildPacketText: buildOmniHookwallGnnAlignmentPacket
} = require("../sovereignty/src/omniHookwallGnnAlignmentWave");
const { buildResourceBudgetSnapshot } = require("../sovereignty/src/resourceBudgetSnapshot");
const { runIxFabricAtlasWhiteRoomReview } = require("../tools/behcs/review-ix-fabric-atlas");

const BEHCS_RUNTIME_MISTAKES_PATH = path.join(__dirname, "..", "data", "behcs", "d0-runtime", "mistakes.ndjson");
const MISTAKE_LEDGER_PATH = path.join(__dirname, "..", "data", "mistake-ledger.ndjson");
const RECOVERY_REVIEW_SEAL_LATEST_PATH = path.join(__dirname, "..", "reports", "deep-wave-sovereign-recovery-review-seal-latest.md");
const REPORTS_DIR = path.join(__dirname, "..", "reports");
const FALCON_FIX_WAVE_LATEST_JSON_PATH = path.join(REPORTS_DIR, "deep-wave-falcon-language-fix-wave-latest.json");
const MAIN_OS_ARCHAEOLOGY_REPLAY_LATEST_JSON_PATH = path.join(REPORTS_DIR, "deep-wave-main-os-archaeology-replay-wave-latest.json");
const SELF_BUILD_MACHINE_FEED_RECYCLE_MODES = new Set(["preview", "schedule", "run"]);
const REVIEW_SEVERITY_WEIGHT = Object.freeze({
  critical: 0,
  high: 1,
  medium: 2,
  low: 3
});

const CROSSWALK_SURFACE_TO_LANE = Object.freeze({
  falconLanguage: "gateway-runtime-routing",
  guide: "memory-index-docs",
  map: "memory-index-docs",
  task: "memory-index-docs",
  memory: "memory-index-docs",
  index: "memory-index-docs",
  cube: "gateway-runtime-routing",
  glyph: "gateway-runtime-routing",
  hyperlanguage: "gateway-runtime-routing",
  autoTranslation: "gateway-runtime-routing",
  orchestration: "gateway-runtime-routing"
});

const GUIDE_ROLE_TO_LANE = Object.freeze({
  chief_helm: "memory-index-docs",
  director_vector_rook: "gateway-runtime-routing",
  gaia_dasein_brain: "memory-index-docs",
  sentinel_kr: "controller-guards",
  falcon_selector: "gateway-runtime-routing",
  omnispindle_flywheels: "gateway-runtime-routing"
});

function cleanLaneId(value) {
  return String(value || "").trim();
}

function getGuideTaskLaneId(task = {}) {
  return GUIDE_ROLE_TO_LANE[cleanLaneId(task?.primaryCouncilRole)] || "memory-index-docs";
}

function mapGuideAssignmentsByRole(guide = {}) {
  return (Array.isArray(guide?.slotAssignments) ? guide.slotAssignments : []).reduce((map, assignment) => {
    const role = String(assignment?.role || "").trim();
    if (role) {
      map.set(role, assignment);
    }
    return map;
  }, new Map());
}

function mapFalconSeatsByRole(falconLanguage = {}) {
  return (Array.isArray(falconLanguage?.councilSeats) ? falconLanguage.councilSeats : []).reduce((map, seat) => {
    const role = String(seat?.role || "").trim();
    if (role) {
      map.set(role, seat);
    }
    return map;
  }, new Map());
}

function getFalconExecutionFabric(falconLanguage = {}) {
  const chiefSeatRoles = unique((Array.isArray(falconLanguage?.executionFabric?.chiefRuntime?.seatRoles) ? falconLanguage.executionFabric.chiefRuntime.seatRoles : []).map((value) => cleanLaneId(value))).filter(Boolean);
  const supportedWorkerIds = unique((Array.isArray(falconLanguage?.executionFabric?.childRuntime?.supportedWorkerIds) ? falconLanguage.executionFabric.childRuntime.supportedWorkerIds : []).map((value) => cleanLaneId(value))).filter(Boolean);
  const chiefWorkerId = cleanLaneId(falconLanguage?.executionFabric?.chiefRuntime?.workerId) || "claude_max";
  const chiefProvider = cleanLaneId(falconLanguage?.executionFabric?.chiefRuntime?.provider) || "claude_code";
  const childWorkerId = cleanLaneId(falconLanguage?.executionFabric?.childRuntime?.workerId) || "opencode";
  const childProvider = cleanLaneId(falconLanguage?.executionFabric?.childRuntime?.provider) || "opencode";
  const childFanout = toClampedNumber(falconLanguage?.executionFabric?.childRuntime?.fanoutPerLane, 6, 1, 12);
  const laneCount = toClampedNumber(falconLanguage?.executionFabric?.omnispindle?.laneCount, 6, 1, 12);
  const flywheelCount = toClampedNumber(falconLanguage?.executionFabric?.omnispindle?.flywheelCount, 6, 1, 12);

  return {
    dispatchEnvelope: String(falconLanguage?.executionFabric?.dispatchEnvelope || "falcon_language_tuple_packet"),
    chiefRuntime: {
      provider: chiefProvider,
      workerId: chiefWorkerId,
      modelHint: String(falconLanguage?.executionFabric?.chiefRuntime?.modelHint || "claude_max_x20"),
      accountTier: String(falconLanguage?.executionFabric?.chiefRuntime?.accountTier || "max_x20_operator_claimed"),
      seatRoles: chiefSeatRoles.length ? chiefSeatRoles : ["chief_helm", "director_vector_rook", "gaia_dasein_brain", "sentinel_kr", "falcon_selector", "omnispindle_flywheels"],
      seatRoleCount: chiefSeatRoles.length || 6,
      law: String(falconLanguage?.executionFabric?.chiefRuntime?.law || "chiefs_and_council_plan_review_and_gate_dispatch_before_any_child_launch")
    },
    childRuntime: {
      provider: childProvider,
      workerId: childWorkerId,
      modelHint: String(falconLanguage?.executionFabric?.childRuntime?.modelHint || "gpt-5.3-codex"),
      variant: String(falconLanguage?.executionFabric?.childRuntime?.variant || "high"),
      fanoutPerLane: childFanout,
      maxParentAgents: toClampedNumber(falconLanguage?.executionFabric?.childRuntime?.maxParentAgents, laneCount, 1, 12),
      supportedWorkerIds: supportedWorkerIds.length ? supportedWorkerIds : ["opencode", "claude_max", "local_codex", "abacus", "symphony"],
      route: String(falconLanguage?.executionFabric?.childRuntime?.route || "/api/omnispindle/agent/:laneId/dispatch"),
      compatibilityRoute: String(falconLanguage?.executionFabric?.childRuntime?.compatibilityRoute || "/api/omnispindle/agent/:laneId/opencode/dispatch")
    },
    omnispindle: {
      laneCount,
      flywheelCount,
      acceptsAnyAgentTypeEnvelope: falconLanguage?.executionFabric?.omnispindle?.acceptsAnyAgentTypeEnvelope === true,
      supportsAnyWorkerRouterAgent: falconLanguage?.executionFabric?.omnispindle?.supportsAnyWorkerRouterAgent === true,
      defaultAgentType: String(falconLanguage?.executionFabric?.omnispindle?.defaultAgentType || childWorkerId || "opencode"),
      dispatchLaw: String(falconLanguage?.executionFabric?.omnispindle?.dispatchLaw || "chief_director_packets_gate_worker_router_child_launch"),
      whiteRoomGate: String(falconLanguage?.executionFabric?.omnispindle?.whiteRoomGate || "required"),
      omnishannonGate: String(falconLanguage?.executionFabric?.omnispindle?.omnishannonGate || "required"),
      sourceRefs: Array.isArray(falconLanguage?.executionFabric?.omnispindle?.sourceRefs) ? falconLanguage.executionFabric.omnispindle.sourceRefs : []
    }
  };
}

function buildFalconSurfaceSummary(falconLanguage = {}) {
  return {
    languageId: String(falconLanguage?.languageId || ""),
    status: String(falconLanguage?.status || ""),
    dialect: String(falconLanguage?.dialect || ""),
    glyphPosture: String(falconLanguage?.glyphPosture || ""),
    namedAgentCount: Number(falconLanguage?.namedAgentCount || 0),
    councilSeatCount: Number(falconLanguage?.councilSeatCount || 0),
    packetExampleCount: Number(falconLanguage?.packetExampleCount || 0),
    route: String(falconLanguage?.omniProcessorAbsorption?.route || falconLanguage?.chain?.join(" -> ") || ""),
    executionFabric: getFalconExecutionFabric(falconLanguage)
  };
}

function buildSystemCouncilSlots(falconLanguage = {}) {
  const executionFabric = getFalconExecutionFabric(falconLanguage);
  const engine = Object.freeze({
    chiefProvider: executionFabric.chiefRuntime.provider,
    chiefWorkerId: executionFabric.chiefRuntime.workerId,
    chiefModelHint: executionFabric.chiefRuntime.modelHint,
    chiefAccountTier: executionFabric.chiefRuntime.accountTier,
    childProvider: executionFabric.childRuntime.provider,
    childWorkerId: executionFabric.childRuntime.workerId,
    childModelHint: executionFabric.childRuntime.modelHint,
    childVariant: executionFabric.childRuntime.variant,
    childFanout: executionFabric.childRuntime.fanoutPerLane,
    childRoute: executionFabric.childRuntime.route,
    childCompatibilityRoute: executionFabric.childRuntime.compatibilityRoute,
    dispatchEnvelope: executionFabric.dispatchEnvelope,
    supportedWorkerIds: executionFabric.childRuntime.supportedWorkerIds,
    supportsAnyWorkerRouterAgent: executionFabric.omnispindle.supportsAnyWorkerRouterAgent,
    acceptsAnyAgentTypeEnvelope: executionFabric.omnispindle.acceptsAnyAgentTypeEnvelope,
    whiteRoomGate: executionFabric.omnispindle.whiteRoomGate,
    omnishannonGate: executionFabric.omnispindle.omnishannonGate,
    costMode: "chief_external_plan_child_local_default"
  });

  return Object.freeze([
    Object.freeze({
      slotId: 1,
      role: "chief_helm",
      team: ["chief", "helm"],
      engine,
      childStrategy: "chief_marshals_claude_plan_then_falcon_dispatches_children"
    }),
    Object.freeze({
      slotId: 2,
      role: "director_vector_rook",
      team: ["director", "vector", "rook"],
      engine,
      childStrategy: "director_decomposes_into_falcon_task_packets_before_child_work"
    }),
    Object.freeze({
      slotId: 3,
      role: "gaia_dasein_brain",
      team: ["gaia", "dasein", "brain"],
      engine,
      childStrategy: "claude_review_and_memory_first_before_child_dispatch"
    }),
    Object.freeze({
      slotId: 4,
      role: "sentinel_kr",
      team: ["sentinel", "kr"],
      engine,
      childStrategy: "claude_guard_and_hold_reasons_before_child_dispatch"
    }),
    Object.freeze({
      slotId: 5,
      role: "falcon_selector",
      team: ["falcon", "selector"],
      engine,
      childStrategy: "translate_and_route_to_worker_router_supported_agents"
    }),
    Object.freeze({
      slotId: 6,
      role: "omnispindle_flywheels",
      team: ["omnispindles", "flywheels"],
      engine,
      childStrategy: "fanout_to_worker_router_supported_agents_default_opencode_x6"
    })
  ]);
}

function buildCouncilEngineTextTokens(engine = {}) {
  return [
    `chief_engine=${String(engine.chiefProvider || "unknown")}`,
    `chief_worker=${String(engine.chiefWorkerId || "unknown")}`,
    `chief_model=${String(engine.chiefModelHint || "unknown")}`,
    `chief_account=${String(engine.chiefAccountTier || "unknown")}`,
    `child_engine=${String(engine.childProvider || "unknown")}`,
    `child_worker=${String(engine.childWorkerId || "unknown")}`,
    `child_model=${String(engine.childModelHint || "unknown")}`,
    `child_variant=${String(engine.childVariant || "unknown")}`,
    `child_limit=${Number(engine.childFanout || 0)}`,
    `dispatch_envelope=${String(engine.dispatchEnvelope || "unknown")}`,
    `agent_envelope_any=${engine.acceptsAnyAgentTypeEnvelope === true}`,
    `worker_router_agents=${engine.supportsAnyWorkerRouterAgent === true}`,
    `supported_agents=${Array.isArray(engine.supportedWorkerIds) && engine.supportedWorkerIds.length ? engine.supportedWorkerIds.join("|") : "none"}`
  ].join(" ");
}

function getFalconNamedAgentLaneId(agent = {}) {
  const councilSeat = cleanLaneId(agent?.councilSeat);
  if (councilSeat === "trigger_surface") {
    return "memory-index-docs";
  }
  if (councilSeat === "shannon_gnn_gc") {
    return "gateway-runtime-routing";
  }
  return GUIDE_ROLE_TO_LANE[councilSeat] || "gateway-runtime-routing";
}

function getLaneView(laneId, req) {
  const normalizedLaneId = cleanLaneId(laneId);
  const orchestration = getIxOrchestrationStatus();
  const laneSummary = (orchestration?.laneSummary || []).find((lane) => String(lane?.id || "") === normalizedLaneId) || null;
  const external = queryIxConnectorExternalSurfaces({
    laneId: normalizedLaneId,
    surfaceClass: req.query?.surfaceClass,
    referenceClass: req.query?.referenceClass,
    search: req.query?.search,
    limit: Number(req.query?.limit || 100)
  });
  const controller = orchestration?.controller || {};
  const controllerExcerpt = {
    status: String(controller.status || ""),
    ready: Boolean(controller.ready),
    activeLaneIds: Array.isArray(controller.activeLaneIds) ? controller.activeLaneIds : [],
    queueReadyLaneIds: Array.isArray(controller.queueReadyLaneIds) ? controller.queueReadyLaneIds : [],
    nextLaneId: String(controller.nextLaneId || ""),
    nextLaneStage: String(controller.nextLaneStage || ""),
    proofBudget: controller.proofBudget || {},
    guardSummary: controller.guardSummary || {}
  };

  return {
    ok: Boolean(orchestration?.ok),
    laneId: normalizedLaneId,
    found: Boolean(laneSummary),
    atlasId: String(orchestration?.atlasId || ""),
    surfaceRegistryId: String(orchestration?.surfaceRegistryId || ""),
    promotionQueueId: String(orchestration?.promotionQueueId || ""),
    laneSummary,
    controller: controllerExcerpt,
    externalSurfaces: external
  };
}

function sendLaneHooksResponse(req, res, overrideLaneId) {
  ensureInitialized();
  const laneView = getLaneView(overrideLaneId || req.params?.laneId, req);
  if (!laneView.found) {
    return res.status(404).json({
      ok: false,
      error: "lane_not_found",
      laneId: laneView.laneId,
      availableLaneIds: (getIxOrchestrationStatus()?.laneSummary || []).map((lane) => lane.id)
    });
  }

  const normalizedLaneId = laneView.laneId;
  const stats = getRouteHookStats({ atlasLaneId: normalizedLaneId, limit: 200 });
  const recentEvents = queryHookEvents({
    atlasLaneId: normalizedLaneId,
    eventType: "RouteHook",
    limit: Number(req.query?.limit || 50)
  });

  res.json({
    ok: true,
    laneId: normalizedLaneId,
    laneView,
    telemetry: {
      stats,
      recentEvents
    }
  });
}

const SELF_BUILD_LANE_CONSTRUCTION_HINTS = Object.freeze({
  "memory-index-docs": "asolaria-memory-index-docs",
  "desktop-phone-mirror": "asolaria-desktop-phone-mirror",
  "browser-integrations": "asolaria-browser-integrations",
  "gateway-runtime-routing": "asolaria-gateway-runtime-routing",
  "gc-gulp": "asolaria-gc-gulp",
  "controller-guards": "asolaria-controller-guards",
  "storage-boot": "asolaria-storage-boot-sentinel"
});

const SELF_BUILD_ROLE_HINTS = Object.freeze({
  "memory-index-docs": "forge",
  "desktop-phone-mirror": "falcon",
  "browser-integrations": "omnispindle-bridge",
  "gateway-runtime-routing": "omnispindle-bridge",
  "gc-gulp": "watchdog",
  "controller-guards": "sentinel",
  "storage-boot": "sentinel"
});

const SELF_BUILD_EXECUTABLE_STATUSES = new Set(["execute", "queue_ready", "pass", "warn", "active"]);
const SELF_BUILD_BLOCKED_LANES = new Set(["storage-boot"]);
const SELF_BUILD_OMNISPINLE_LANE_HINTS = Object.freeze({
  "memory-index-docs": "forge",
  "desktop-phone-mirror": "falcon",
  "browser-integrations": "vector",
  "gateway-runtime-routing": "vector",
  "gc-gulp": "sentinel",
  "controller-guards": "sentinel",
  "storage-boot": "sentinel"
});

function toClampedNumber(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function readBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(normalized)) return true;
    if (["0", "false", "no", "off"].includes(normalized)) return false;
  }
  return fallback;
}

function envFlag(name) {
  return String(process.env[name] || "").trim() === "1";
}

function selfBuildLiveExecutionEnabled() {
  return envFlag("ASOLARIA_SELF_BUILD_EXECUTION_ENABLED");
}

function requestedLiveExecution(options = {}) {
  return readBoolean(options.executeNow, false)
    || readBoolean(options.live, false)
    || readBoolean(options.run, false)
    || String(options.mode || "").trim().toLowerCase() === "run";
}

function buildSelfBuildHold(operation, preview = {}, reason = "preview_only") {
  return {
    ok: true,
    held: true,
    preview: true,
    operation,
    reason,
    enableWith: "ASOLARIA_SELF_BUILD_EXECUTION_ENABLED=1",
    ...preview
  };
}

function requireSelfBuildLiveExecution(options = {}, operation, preview = {}) {
  if (!requestedLiveExecution(options)) {
    return buildSelfBuildHold(operation, preview, "preview_only_explicit_execute_not_requested");
  }
  if (!selfBuildLiveExecutionEnabled()) {
    return {
      ok: false,
      held: true,
      preview: true,
      operation,
      reason: "self_build_live_execution_disabled",
      enableWith: "ASOLARIA_SELF_BUILD_EXECUTION_ENABLED=1",
      ...preview
    };
  }
  return null;
}

function normalizeTaskStatus(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeTaskIdList(taskIds) {
  const values = Array.isArray(taskIds)
    ? taskIds
    : String(taskIds || "")
      .split(",")
      .map((value) => String(value || "").trim())
      .filter(Boolean);
  return Array.from(new Set(values.filter(Boolean)));
}

function unique(values) {
  return Array.from(new Set((Array.isArray(values) ? values : []).filter(Boolean)));
}

function clipText(value, max = 180) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, Math.max(1, Number(max) || 180));
}

function normalizeRecycleMode(value) {
  const normalized = clipText(value || "preview", 20).toLowerCase();
  return SELF_BUILD_MACHINE_FEED_RECYCLE_MODES.has(normalized) ? normalized : "preview";
}

function buildSelfBuildLabels(packetType, extras = {}) {
  return {
    packetType,
    controller: "asolaria",
    fabric: "construction_fabric",
    proof: "secondary_non_promoted",
    hyperlanguage: "47D",
    glyphSpace: "HG256",
    ...extras
  };
}

function buildSelfBuildLanguage(packetType, extras = {}) {
  return {
    packetType,
    hyperlanguage: "47D",
    glyphSpace: "HG256",
    fabric: "Asolaria",
    controller: "self_build",
    ...extras
  };
}

function sortByReviewSeverity(left, right) {
  const leftWeight = REVIEW_SEVERITY_WEIGHT[String(left?.severity || "medium").toLowerCase()] ?? REVIEW_SEVERITY_WEIGHT.medium;
  const rightWeight = REVIEW_SEVERITY_WEIGHT[String(right?.severity || "medium").toLowerCase()] ?? REVIEW_SEVERITY_WEIGHT.medium;
  if (leftWeight !== rightWeight) return leftWeight - rightWeight;
  const leftPriority = Number(left?.priority || 0);
  const rightPriority = Number(right?.priority || 0);
  if (leftPriority !== rightPriority) return leftPriority - rightPriority;
  return String(left?.id || "").localeCompare(String(right?.id || ""));
}

function describeConstruction(construction) {
  if (!construction) return null;
  return {
    id: construction.id,
    label: construction.label,
    district: construction.district,
    projectScope: construction.projectScope,
    kind: construction.kind,
    status: construction.status,
    energyLevel: construction.energyLevel,
    activeAgentId: construction.activeAgentId
  };
}

function summarizeWorkerRecommendation(recommendation) {
  if (!recommendation || typeof recommendation !== "object") {
    return {
      ok: false,
      recommendedWorkerId: "",
      fallbackWorkerId: "",
      allowExternalDispatch: false,
      guardGate: "hold",
      reasons: [],
      warnings: [],
      selfBuildShape: ""
    };
  }
  return {
    ok: true,
    recommendedWorkerId: String(recommendation.recommendedWorkerId || ""),
    fallbackWorkerId: String(recommendation.fallbackWorkerId || ""),
    allowExternalDispatch: recommendation?.selfBuild?.dispatchPolicy?.allowExternalDispatch === true,
    rerouteToLocal: recommendation?.selfBuild?.dispatchPolicy?.rerouteToLocal === true,
    guardGate: String(recommendation?.selfBuild?.dispatchPolicy?.guardGate || "hold"),
    reasons: Array.isArray(recommendation.reasons) ? recommendation.reasons.slice(0, 6) : [],
    warnings: Array.isArray(recommendation.warnings) ? recommendation.warnings.slice(0, 6) : [],
    selfBuildShape: String(recommendation?.selfBuild?.intent?.shape || "")
  };
}

function buildWorkerRouterTaskRecommendation(planEntry) {
  const task = planEntry?.task || {};
  try {
    return summarizeWorkerRecommendation(recommendWorker({
      title: `Self-build ${String(task.id || "task")}`,
      objective: String(task.action || `Advance self-build lane ${String(task.laneId || "unknown")}`),
      taskType: "orchestration",
      size: "small",
      taskId: String(task.id || ""),
      projectScope: "worker-router",
      executeNow: false
    }));
  } catch (error) {
    return {
      ok: false,
      recommendedWorkerId: "",
      fallbackWorkerId: "",
      allowExternalDispatch: false,
      guardGate: "hold",
      reasons: [],
      warnings: [],
      selfBuildShape: "",
      error: String(error?.message || error || "worker_recommendation_failed")
    };
  }
}

function summarizeOmnispindleTaskSurface(cascade, task) {
  const laneId = cleanLaneId(task?.laneId);
  const omnispindleLaneId = SELF_BUILD_OMNISPINLE_LANE_HINTS[laneId] || "";
  const liveFrontier = cascade?.liveFrontier || {};
  const launchEligible = Boolean(
    omnispindleLaneId
    && liveFrontier.allowNewChildrenWithSelfBuild === true
    && !SELF_BUILD_BLOCKED_LANES.has(laneId)
  );
  return {
    ok: Boolean(cascade),
    omnispindleLaneId,
    allowNewChildrenWithSelfBuild: liveFrontier.allowNewChildrenWithSelfBuild === true,
    launchEligible,
    reasons: Array.isArray(liveFrontier.selfBuildReasons) ? liveFrontier.selfBuildReasons.slice(0, 6) : [],
    recommendedPerLaneLimit: Number(liveFrontier.recommendedPerLaneLimit || 0)
  };
}

function buildSelfBuildOrchestratorInventory() {
  const spawner = getSpawnerStatus();
  let workerStatus = null;
  let workerSelfBuild = null;
  let workerRouterError = "";
  let cascade = null;
  let omnispindleError = "";

  try {
    workerStatus = getWorkerRouterStatus();
    workerSelfBuild = getWorkerRouterSelfBuildPosture();
  } catch (error) {
    workerRouterError = String(error?.message || error || "worker_router_unavailable");
  }

  try {
    cascade = getOmnispindle().getCascadeStatus();
  } catch (error) {
    omnispindleError = String(error?.message || error || "omnispindle_unavailable");
  }

  return {
    constructionFabric: {
      ok: true,
      mode: "simulation_sync_local_only",
      activeAgents: Number(spawner.activeAgents || 0),
      selfBuildGuardGate: String(spawner?.selfBuild?.guardGateStatus || "hold"),
      activeAtlasLanes: Array.isArray(spawner.activeAtlasLanes) ? spawner.activeAtlasLanes : [],
      activeSelfBuildTaskIds: Array.isArray(spawner.activeSelfBuildTaskIds) ? spawner.activeSelfBuildTaskIds : []
    },
    workerRouter: {
      ok: Boolean(workerStatus?.integrationSummary?.selfBuildControllerReady),
      guardGate: String(workerStatus?.integrationSummary?.selfBuildGuardGate || "hold"),
      selfBuildReady: workerStatus?.integrationSummary?.selfBuildControllerReady === true,
      issues: Array.isArray(workerSelfBuild?.issues) ? workerSelfBuild.issues.slice(0, 6) : [],
      error: workerRouterError
    },
    omnispindle: {
      ok: Boolean(cascade),
      guardGate: String(cascade?.selfBuild?.guardPosture?.gateStatus || cascade?.guard?.fileCap?.status || "hold"),
      controllerStatus: String(cascade?.selfBuild?.controllerStatus || "hold"),
      allowNewChildrenWithSelfBuild: cascade?.liveFrontier?.allowNewChildrenWithSelfBuild === true,
      recommendedPerLaneLimit: Number(cascade?.liveFrontier?.recommendedPerLaneLimit || 0),
      selfBuildReasons: Array.isArray(cascade?.liveFrontier?.selfBuildReasons) ? cascade.liveFrontier.selfBuildReasons.slice(0, 6) : [],
      guardReasons: Array.isArray(cascade?.liveFrontier?.guardReasons) ? cascade.liveFrontier.guardReasons.slice(0, 6) : [],
      error: omnispindleError
    },
    raw: {
      cascade
    }
  };
}

function selectSelfBuildOrchestrator(planEntry, workerRouter, omnispindle) {
  const laneId = cleanLaneId(planEntry?.task?.laneId);
  if (!planEntry?.launchable) {
    return {
      current: {
        id: "none",
        mode: "blocked",
        reason: String(planEntry?.blockedReason || "task_blocked")
      },
      nextCandidate: null
    };
  }

  const current = {
    id: "construction_fabric",
    mode: "simulation_sync_local_only",
    reason: "Current bounded tranche executes through the construction fabric under local-only simulation."
  };

  let nextCandidate = null;
  if (laneId === "desktop-phone-mirror" && omnispindle?.launchEligible) {
    nextCandidate = {
      id: "omnispindle",
      mode: "child_dispatch_candidate",
      laneId: omnispindle.omnispindleLaneId,
      reason: "Phone/mirror work should widen through Falcon and the omnispindle child fabric after the current bounded tranche."
    };
  } else if (
    (laneId === "gateway-runtime-routing" || laneId === "memory-index-docs")
    && workerRouter?.ok
    && workerRouter?.allowExternalDispatch
    && workerRouter?.recommendedWorkerId
  ) {
    nextCandidate = {
      id: "worker_router",
      mode: "queued_dispatch_candidate",
      workerId: workerRouter.recommendedWorkerId,
      fallbackWorkerId: workerRouter.fallbackWorkerId,
      reason: "This lane has a bounded worker-router path available for the later source-mutation tranche."
    };
  } else if (laneId === "controller-guards" || laneId === "gc-gulp") {
    nextCandidate = {
      id: "construction_fabric",
      mode: "guard_surface_local",
      reason: "Guard and GC surfaces stay local and proof-first in the current architecture."
    };
  }

  return { current, nextCandidate };
}

function buildSelfBuildOrchestratorPlan(options = {}) {
  ensureInitialized();
  const taskLimit = toClampedNumber(options.limit || options.taskLimit, 5, 1, 6);
  const includeBlocked = readBoolean(options.includeBlocked, true);
  const taskIds = normalizeTaskIdList(options.taskIds);
  const executionPlan = buildSelfBuildExecutionPlan({
    taskLimit,
    includeBlocked: true,
    taskIds
  });
  const inventory = buildSelfBuildOrchestratorInventory();
  const cascade = inventory.raw.cascade;
  const allTasks = Array.isArray(executionPlan.allTasks) ? executionPlan.allTasks : [];
  const taskViews = allTasks.map((planEntry) => {
    const workerRouter = buildWorkerRouterTaskRecommendation(planEntry);
    const omnispindle = summarizeOmnispindleTaskSurface(cascade, planEntry.task);
    const selected = selectSelfBuildOrchestrator(planEntry, workerRouter, omnispindle);
    return {
      order: planEntry.order,
      task: planEntry.task,
      construction: {
        launchable: planEntry.launchable,
        blockedReason: planEntry.blockedReason,
        constructionId: planEntry.constructionId,
        construction: planEntry.construction,
        executionMode: planEntry.executionMode,
        proofPolicy: planEntry.proofPolicy
      },
      workerRouter,
      omnispindle,
      selectedOrchestrator: selected
    };
  });

  const tasks = includeBlocked
    ? taskViews
    : taskViews.filter((entry) => entry.task.launchable !== false && entry.selectedOrchestrator.current.id !== "none");

  return {
    ok: true,
    packet: executionPlan.packet,
    constructionPlan: {
      controllerLaunchEligible: executionPlan.controllerLaunchEligible,
      controllerBlockedReason: executionPlan.controllerBlockedReason,
      summary: executionPlan.summary
    },
    orchestrators: {
      constructionFabric: inventory.constructionFabric,
      workerRouter: inventory.workerRouter,
      omnispindle: inventory.omnispindle
    },
    summary: {
      taskCount: tasks.length,
      blockedTaskCount: taskViews.filter((entry) => entry.selectedOrchestrator.current.id === "none").length,
      currentConstructionCount: taskViews.filter((entry) => entry.selectedOrchestrator.current.id === "construction_fabric").length,
      workerRouterCandidateCount: taskViews.filter((entry) => entry.selectedOrchestrator.nextCandidate?.id === "worker_router").length,
      omnispindleCandidateCount: taskViews.filter((entry) => entry.selectedOrchestrator.nextCandidate?.id === "omnispindle").length
    },
    tasks
  };
}

function isSelfBuildGuardLaunchable(packet) {
  const gateStatus = normalizeTaskStatus(packet?.guardPosture?.gateStatus);
  return packet?.ok === true
    && packet?.enabled !== false
    && packet?.bounded === true
    && packet?.localOnly === true
    && packet?.noPromotionClaims === true
    && (gateStatus === "pass" || gateStatus === "warn");
}

function getSelfBuildRoleHint(task = {}) {
  return SELF_BUILD_ROLE_HINTS[cleanLaneId(task?.laneId)] || "omnispindle-control";
}

function resolveSelfBuildConstructionId(task = {}) {
  const laneId = cleanLaneId(task?.laneId);
  if (typeof getConstructionIdForSelfBuildLane === "function") {
    const resolved = cleanLaneId(getConstructionIdForSelfBuildLane(laneId));
    if (resolved) return resolved;
  }
  return SELF_BUILD_LANE_CONSTRUCTION_HINTS[laneId] || "";
}

function buildSelfBuildTaskMessage(packet, task, construction) {
  const guardStatus = String(packet?.guardPosture?.gateStatus || "hold");
  const tracked = Number(packet?.proofBudget?.trackedFiles || 0);
  const maxTracked = Number(packet?.proofBudget?.maxTrackedFiles || 0);
  const activeLaneId = cleanLaneId(packet?.activeLane?.id) || "none";
  const nextLaneId = cleanLaneId(packet?.nextQueueReadyLane?.id) || "none";
  return [
    `Self-build task ${String(task?.id || "unknown")} routed to construction ${construction?.id || "unknown"}.`,
    `Lane: ${cleanLaneId(task?.laneId) || "unknown"}.`,
    `Action: ${String(task?.action || "").trim() || "No action provided."}`,
    `Controller: active=${activeLaneId} next=${nextLaneId} guard=${guardStatus} files=${tracked}/${maxTracked}.`,
    "Shadow, mirror, and archive remain secondary non-promoted evidence only.",
    "Simulation scope only: no source edits, no promotion claims, no E: writes, no boot mutation."
  ].join(" ");
}

function buildSelfBuildSimulationResponse(packet, planEntry) {
  const task = planEntry?.task || {};
  const construction = planEntry?.construction || {};
  const gateStatus = String(packet?.guardPosture?.gateStatus || "hold");
  const tracked = Number(packet?.proofBudget?.trackedFiles || 0);
  const maxTracked = Number(packet?.proofBudget?.maxTrackedFiles || 0);
  return {
    text: [
      `Simulation completed for ${String(task.id || "self-build-task")} at ${String(construction.id || "unknown-construction")}.`,
      `Lane ${String(task.laneId || "unknown")} stayed bounded/local with guard ${gateStatus}.`,
      `Proof budget remained ${tracked}/${maxTracked}.`,
      "No source edits, no promotion claims, and shadow/mirror/archive remained non-promoted secondary evidence."
    ].join(" "),
    learnedPatterns: [
      "self_build_controller_packet",
      `self_build_task:${String(task.id || "unknown")}`,
      `self_build_lane:${String(task.laneId || "unknown")}`,
      "secondary_non_promoted_shadow_refs"
    ],
    mistakesEncountered: []
  };
}

function buildSelfBuildExecutionPlan(options = {}) {
  ensureInitialized();
  const taskLimit = toClampedNumber(options.limit || options.taskLimit, 4, 1, 6);
  const includeBlocked = readBoolean(options.includeBlocked, true);
  const taskIds = normalizeTaskIdList(options.taskIds);
  const packet = options.packet || getIxSelfBuildControllerPacket({ taskLimit });
  const controllerLaunchEligible = isSelfBuildGuardLaunchable(packet);
  const controllerBlockedReason = controllerLaunchEligible
    ? null
    : "controller_packet_not_launchable";
  const tasks = Array.isArray(packet?.recommendedTasks) ? packet.recommendedTasks.slice(0, taskLimit) : [];
  const plannedTasks = tasks.map((task, index) => {
    const laneId = cleanLaneId(task?.laneId);
    const taskStatus = normalizeTaskStatus(task?.status);
    const constructionId = resolveSelfBuildConstructionId(task);
    const construction = constructionId ? getConstruction(constructionId) : null;
    let blockedReason = controllerBlockedReason;

    if (!blockedReason && task?.launchable === false) {
      blockedReason = String(task?.blockedReason || "task_marked_not_launchable");
    }
    if (!blockedReason && SELF_BUILD_BLOCKED_LANES.has(laneId)) {
      blockedReason = "lane_denied_until_proofs";
    }
    if (!blockedReason && !SELF_BUILD_EXECUTABLE_STATUSES.has(taskStatus)) {
      blockedReason = `task_status_${taskStatus || "unknown"}`;
    }
    if (!blockedReason && !construction) {
      blockedReason = "construction_not_found";
    }

    const roleHint = getSelfBuildRoleHint(task);
    const launchable = !blockedReason;

    return {
      order: index + 1,
      task: {
        id: String(task?.id || ""),
        priority: Number(task?.priority || index + 1),
        laneId,
        status: String(task?.status || ""),
        action: String(task?.action || ""),
        bounded: task?.bounded !== false,
        localOnly: task?.localOnly !== false,
        launchable: launchable
      },
      controller: {
        activeLaneId: cleanLaneId(packet?.activeLane?.id),
        nextQueueReadyLaneId: cleanLaneId(packet?.nextQueueReadyLane?.id),
        guardStatus: String(packet?.guardPosture?.gateStatus || "hold")
      },
      launchable,
      blockedReason,
      roleHint,
      executionMode: "simulation_sync_local_only",
      proofPolicy: "secondary_non_promoted",
      constructionId,
      construction: describeConstruction(construction),
      messagePreview: buildSelfBuildTaskMessage(packet, task, construction)
    };
  });

  const filteredTasks = taskIds.length > 0
    ? plannedTasks.filter((entry) => taskIds.includes(String(entry?.task?.id || "")))
    : plannedTasks;

  const selectedTasks = includeBlocked
    ? filteredTasks
    : filteredTasks.filter((entry) => entry.launchable);

  return {
    ok: true,
    packet,
    controllerLaunchEligible,
    controllerBlockedReason,
    summary: {
      requestedTaskLimit: taskLimit,
      plannedTaskCount: plannedTasks.length,
      selectedTaskCount: selectedTasks.length,
      launchableTaskCount: plannedTasks.filter((entry) => entry.launchable).length,
      blockedTaskCount: plannedTasks.filter((entry) => !entry.launchable).length
    },
    tasks: selectedTasks,
    allTasks: plannedTasks
  };
}

function runSelfBuildExecution(options = {}) {
  ensureInitialized();
  const simulationComplete = readBoolean(options.simulationComplete, true);
  const includeBlocked = readBoolean(options.includeBlocked, false);
  const plan = buildSelfBuildExecutionPlan({
    taskLimit: options.limit || options.taskLimit,
    includeBlocked,
    taskIds: options.taskIds
  });

  if (!plan.controllerLaunchEligible) {
    return {
      ok: false,
      error: "self_build_controller_not_launchable",
      plan
    };
  }

  const liveHold = requireSelfBuildLiveExecution(options, "self_build_execution", { plan });
  if (liveHold) {
    return liveHold;
  }

  const launchableTasks = plan.tasks.filter((entry) => entry.launchable);
  if (launchableTasks.length === 0) {
    return {
      ok: false,
      error: "no_launchable_self_build_tasks",
      plan
    };
  }

  const launched = [];
  const blocked = plan.allTasks.filter((entry) => !entry.launchable).map((entry) => ({
    order: entry.order,
    task: entry.task,
    blockedReason: entry.blockedReason,
    constructionId: entry.constructionId
  }));

  for (let index = 0; index < launchableTasks.length; index += 1) {
    const planEntry = launchableTasks[index];
    const construction = getConstruction(planEntry.constructionId);
    if (!construction) {
      blocked.push({
        order: planEntry.order,
        task: planEntry.task,
        blockedReason: "construction_not_found",
        constructionId: planEntry.constructionId
      });
      continue;
    }

    const messageText = planEntry.messagePreview;
    const spawnResult = spawnInstantAgent(construction, {
      text: messageText,
      source: "self-build-controller",
      selfBuildTask: planEntry.task
    }, {
      roleHint: planEntry.roleHint,
      mission: planEntry.task.action,
      directive: messageText,
      ixRef: `self-build:${planEntry.task.id}`,
      enableSpawnCache: true,
      selfBuildTask: planEntry.task
    });

    if (!spawnResult.ok) {
      blocked.push({
        order: planEntry.order,
        task: planEntry.task,
        blockedReason: String(spawnResult.error || "spawn_failed"),
        constructionId: planEntry.constructionId
      });
      continue;
    }

    construction.recordMessage({
      text: messageText,
      direction: "inbound",
      source: "self-build-controller"
    });

    const agent = spawnResult.agent;
    const launchRecord = {
      order: planEntry.order,
      task: planEntry.task,
      roleHint: planEntry.roleHint,
      construction: describeConstruction(construction),
      agent: {
        id: agent.id,
        status: agent.status,
        atlasBinding: agent.atlasBinding,
        runtimeWiring: agent.runtimeWiring,
        cacheInfo: agent.cacheInfo,
        selfBuild: agent.toJSON().selfBuild || null
      },
      simulationComplete,
      completion: null
    };

    if (simulationComplete) {
      let nextConstruction = null;
      for (let nextIndex = index + 1; nextIndex < launchableTasks.length; nextIndex += 1) {
        const candidate = getConstruction(launchableTasks[nextIndex].constructionId);
        if (candidate) {
          nextConstruction = candidate;
          break;
        }
      }
      const completion = completeAndTransfer(
        agent.id,
        buildSelfBuildSimulationResponse(plan.packet, planEntry),
        nextConstruction
      );
      launchRecord.completion = completion;
    }

    launched.push(launchRecord);
  }

  saveConstructionState();

  return {
    ok: launched.length > 0,
    packet: plan.packet,
    plan: {
      summary: plan.summary,
      controllerLaunchEligible: plan.controllerLaunchEligible,
      controllerBlockedReason: plan.controllerBlockedReason
    },
    execution: {
      simulationComplete,
      launchedCount: launched.length,
      blockedCount: blocked.length
    },
    launched,
    blocked,
    spawner: getSpawnerStatus()
  };
}

function runSelfBuildOrchestratorPlan(options = {}) {
  ensureInitialized();
  const simulationComplete = readBoolean(options.simulationComplete, true);
  const orchestrationPlan = buildSelfBuildOrchestratorPlan({
    taskLimit: options.limit || options.taskLimit,
    includeBlocked: true,
    taskIds: options.taskIds
  });

  const constructionTaskIds = orchestrationPlan.tasks
    .filter((entry) => entry.selectedOrchestrator?.current?.id === "construction_fabric" && entry.task?.launchable !== false)
    .map((entry) => String(entry.task.id || ""))
    .filter(Boolean);

  const deferred = orchestrationPlan.tasks
    .filter((entry) => entry.selectedOrchestrator?.current?.id !== "construction_fabric" || entry.task?.launchable === false)
    .map((entry) => ({
      order: entry.order,
      task: entry.task,
      current: entry.selectedOrchestrator?.current || null,
      nextCandidate: entry.selectedOrchestrator?.nextCandidate || null
    }));

  let execution = null;
  if (constructionTaskIds.length > 0) {
    const liveHold = requireSelfBuildLiveExecution(options, "self_build_orchestrator_plan", { orchestrationPlan });
    execution = liveHold || runSelfBuildExecution({
      taskLimit: options.limit || options.taskLimit,
      includeBlocked: false,
      simulationComplete,
      taskIds: constructionTaskIds,
      executeNow: options.executeNow,
      live: options.live,
      run: options.run,
      mode: options.mode
    });
  }

  return {
    ok: execution ? execution.ok : true,
    orchestrationPlan,
    execution,
    deferred
  };
}

function summarizeRecentMistakeEvent(entry = {}, index = 0) {
  const severity = clipText(entry.severity || entry.payload?.severity || "medium", 16).toLowerCase();
  const context = entry.context && typeof entry.context === "object" ? entry.context : {};
  const reason = clipText(entry.reason || entry.payload?.reason || entry.type || entry.payload?.type || "unknown", 140);
  const rawId = clipText(entry.id || `${reason}-${index + 1}`, 80).toLowerCase().replace(/[^a-z0-9._:-]+/g, "_");
  return {
    id: rawId || `mistake-${index + 1}`,
    at: String(entry.at || entry.ts || entry.generatedAt || ""),
    type: clipText(entry.type || entry.payload?.type || "MISTAKE", 80),
    reason,
    severity: ["critical", "high", "medium", "low"].includes(severity) ? severity : "medium",
    laneId: cleanLaneId(
      entry.laneId
      || context.laneId
      || context.atlasLaneId
      || context.surface
      || context.pathRef
    ),
    message: clipText(entry.message || entry.payload?.message || entry.text || entry.payload?.text || reason, 220),
    context: {
      source: clipText(entry.source || context.source || "", 80),
      action: clipText(context.action || context.operation || entry.operation || "", 120),
      blocker: clipText(context.blockedReason || context.reason || "", 140),
      proof: clipText(context.proof || context.packet || "", 120)
    }
  };
}

function readRecentSelfBuildMistakes(options = {}) {
  const limit = toClampedNumber(options.limit, 6, 1, 40);
  try {
    const rows = fs.readFileSync(BEHCS_RUNTIME_MISTAKES_PATH, "utf8")
      .split(/\r?\n/)
      .filter((line) => line.trim())
      .slice(-limit)
      .reverse()
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch (_error) {
          return null;
        }
      })
      .filter(Boolean);
    return rows.map((row, index) => summarizeRecentMistakeEvent(row, index));
  } catch (_error) {
    return [];
  }
}

function readAssignableTaskBoardView() {
  try {
    return buildAsolariaAssignableTaskBoard({ write: false });
  } catch (_error) {
    return readAsolariaAssignableTaskBoard() || {
      ok: false,
      summary: {
        status: "unavailable",
        verdict: "UNAVAILABLE",
        dispatchReady: false,
        gnnReady: false,
        totalRoles: 0,
        assignableRoles: 0,
        blockedRoles: 0,
        pendingTasks: 0
      },
      assignments: []
    };
  }
}

function buildSelfBuildWorkerTasks(orchestrationPlan) {
  const planEntries = Array.isArray(orchestrationPlan?.tasks) ? orchestrationPlan.tasks : [];
  const tasks = [];

  for (const entry of planEntries) {
    const task = entry?.task || {};
    const laneId = cleanLaneId(task.laneId);
    const parentTaskId = String(task.id || "");
    const roleHint = getSelfBuildRoleHint(task);
    const basePriority = Math.max(1, Number(task.priority || entry?.order || tasks.length + 1));
    const constructionId = cleanLaneId(entry?.construction?.constructionId || entry?.construction?.construction?.id);
    const current = entry?.selectedOrchestrator?.current || { id: "none", mode: "blocked", reason: "task_blocked" };
    const nextCandidate = entry?.selectedOrchestrator?.nextCandidate || null;
    const launchable = task.launchable !== false && current.id !== "none";
    const common = {
      parentTaskId,
      laneId,
      roleHint,
      constructionId,
      currentExecutorId: String(current.id || "none"),
      currentExecutorMode: String(current.mode || ""),
      nextCandidateId: String(nextCandidate?.id || ""),
      reviewRequired: true
    };

    tasks.push({
      id: `${parentTaskId}:map`,
      kind: "surface_context",
      phase: "map_map_mapped",
      title: `Map ${laneId} surface context`,
      objective: `Map active ${laneId} runtime surfaces, controller posture, and construction ${constructionId || "unbound"} before any widening.`,
      status: launchable ? "ready" : "review_required",
      priority: (basePriority * 10) + 1,
      ...common,
      labels: buildSelfBuildLabels("self_build_worker_task.v1", { stage: "map", laneId, roleHint }),
      language: buildSelfBuildLanguage("self_build_worker_task.v1", { stage: "map", laneId, roleHint })
    });

    if (launchable) {
      tasks.push({
        id: `${parentTaskId}:execute`,
        kind: "bounded_execution_packet",
        phase: "cube_cube_cubed",
        title: `Execute bounded ${laneId} packet`,
        objective: clipText(task.action || `Advance ${laneId} under bounded local self-build control.`, 200),
        status: "ready",
        priority: (basePriority * 10) + 2,
        ...common,
        reviewRequired: false,
        labels: buildSelfBuildLabels("self_build_worker_task.v1", { stage: "execute", laneId, roleHint }),
        language: buildSelfBuildLanguage("self_build_worker_task.v1", { stage: "execute", laneId, roleHint })
      });
    } else {
      tasks.push({
        id: `${parentTaskId}:proof-gap`,
        kind: "proof_gap_resolution",
        phase: "review_first",
        title: `Resolve ${laneId} proof gap`,
        objective: `Keep ${laneId} blocked until ${clipText(entry?.construction?.blockedReason || task.blockedReason || current.reason || "required proofs", 180)} is cleared.`,
        status: "blocked",
        priority: (basePriority * 10) + 2,
        ...common,
        labels: buildSelfBuildLabels("self_build_worker_task.v1", { stage: "proof_gap", laneId, roleHint }),
        language: buildSelfBuildLanguage("self_build_worker_task.v1", { stage: "proof_gap", laneId, roleHint })
      });
    }

    tasks.push({
      id: `${parentTaskId}:review`,
      kind: nextCandidate ? "candidate_promotion_review" : "verification_review",
      phase: nextCandidate ? "bridge_multilane_review" : "final_review",
      title: nextCandidate
        ? `Review ${laneId} handoff to ${String(nextCandidate.id || "candidate")}`
        : `Review ${laneId} verification packet`,
      objective: nextCandidate
        ? clipText(nextCandidate.reason || `Review the ${nextCandidate.id} candidate before widening ${laneId}.`, 200)
        : `Review route hooks, guard posture, and mistake signals before claiming ${laneId} progress.`,
      status: nextCandidate ? "queued_candidate" : "review_required",
      priority: (basePriority * 10) + 3,
      ...common,
      labels: buildSelfBuildLabels("self_build_worker_task.v1", {
        stage: nextCandidate ? "candidate_review" : "verification_review",
        laneId,
        roleHint
      }),
      language: buildSelfBuildLanguage("self_build_worker_task.v1", {
        stage: nextCandidate ? "candidate_review" : "verification_review",
        laneId,
        roleHint
      })
    });
  }

  const sorted = tasks.sort((left, right) => Number(left.priority || 0) - Number(right.priority || 0));
  const byLane = Array.from(sorted.reduce((map, task) => {
    const laneId = cleanLaneId(task.laneId) || "unbound";
    map.set(laneId, (map.get(laneId) || 0) + 1);
    return map;
  }, new Map()).entries()).map(([laneId, taskCount]) => ({ laneId, taskCount }));

  return {
    ok: true,
    summary: {
      total: sorted.length,
      ready: sorted.filter((task) => task.status === "ready").length,
      blocked: sorted.filter((task) => task.status === "blocked").length,
      reviewRequired: sorted.filter((task) => task.reviewRequired === true).length,
      candidateReviews: sorted.filter((task) => task.kind === "candidate_promotion_review").length,
      lanes: byLane
    },
    tasks: sorted,
    labels: buildSelfBuildLabels("self_build_worker_taskboard.v1", { layer: "workers" }),
    language: buildSelfBuildLanguage("self_build_worker_taskboard.v1", { layer: "workers" })
  };
}

function buildSelfBuildReviewQueue(orchestrationPlan, workerTasks, collector, mistakeHints, recentMistakes, historicalBacklog = null) {
  const planEntries = Array.isArray(orchestrationPlan?.tasks) ? orchestrationPlan.tasks : [];
  const workerTaskList = Array.isArray(workerTasks?.tasks) ? workerTasks.tasks : [];
  const workerTaskIdsByParent = workerTaskList.reduce((map, task) => {
    const parentTaskId = String(task?.parentTaskId || "");
    if (!parentTaskId) return map;
    const current = map.get(parentTaskId) || [];
    current.push(String(task.id || ""));
    map.set(parentTaskId, current);
    return map;
  }, new Map());
  const items = [];

  for (const entry of planEntries) {
    const task = entry?.task || {};
    const laneId = cleanLaneId(task.laneId);
    const parentTaskId = String(task.id || "");
    const linkedWorkerTaskIds = workerTaskIdsByParent.get(parentTaskId) || [];
    if (task.launchable === false || entry?.selectedOrchestrator?.current?.id === "none") {
      items.push({
        id: `review:${parentTaskId}:blocked`,
        source: "orchestration",
        kind: "blocked_lane",
        severity: "high",
        priority: Number(task.priority || entry?.order || 0),
        laneId,
        parentTaskId,
        title: `Keep ${laneId} fail-closed`,
        reason: clipText(entry?.construction?.blockedReason || task.blockedReason || "lane_denied_until_proofs", 180),
        action: `Resolve the proof gap before widening ${laneId}.`,
        linkedWorkerTaskIds
      });
    }
    if (entry?.selectedOrchestrator?.nextCandidate?.id) {
      items.push({
        id: `review:${parentTaskId}:candidate`,
        source: "orchestration",
        kind: "candidate_handoff",
        severity: entry.selectedOrchestrator.nextCandidate.id === "omnispindle" ? "high" : "medium",
        priority: Number(task.priority || entry?.order || 0) + 1,
        laneId,
        parentTaskId,
        title: `Review ${laneId} handoff`,
        reason: clipText(entry.selectedOrchestrator.nextCandidate.reason || "", 180),
        action: `Confirm ${entry.selectedOrchestrator.nextCandidate.id} can inherit ${laneId} under the same guard and proof law.`,
        linkedWorkerTaskIds
      });
    }
  }

  if (collector?.fileCap?.status === "warn" || collector?.fileCap?.status === "deny") {
    items.push({
      id: "review:collector:file-cap",
      source: "collector",
      kind: "guard_posture",
      severity: collector.fileCap.status === "deny" ? "critical" : "medium",
      priority: 0,
      laneId: "gc-gulp",
      parentTaskId: "",
      title: "Review file-cap guard posture",
      reason: clipText(collector.fileCap.reason || `${collector.fileCap.trackedFiles}/${collector.fileCap.maxTrackedFiles}`, 180),
      action: "Keep cube/gulp growth checkpointed and let GC trim before widening the worker surface.",
      linkedWorkerTaskIds: []
    });
  }

  const hintRows = Array.isArray(mistakeHints?.hints) ? mistakeHints.hints : [];
  for (const hint of hintRows) {
    items.push({
      id: `review:mistake:${String(hint.id || "")}`,
      source: "mistake_pattern_store",
      kind: "mistake_pattern",
      severity: String(hint.sev || "medium"),
      priority: Number(hint.uses || 0) + 10,
      laneId: cleanLaneId(hint.activity?.[0] || ""),
      parentTaskId: "",
      title: `${String(hint.code || "9.9.9")} ${clipText(hint.cause || "mistake pattern", 80)}`,
      reason: clipText(hint.cause || "", 180),
      action: clipText(hint.avoid || "Apply safer default workflow and verify preconditions.", 180),
      linkedWorkerTaskIds: []
    });
  }

  for (const event of Array.isArray(recentMistakes) ? recentMistakes : []) {
    items.push({
      id: `review:runtime:${String(event.id || "")}`,
      source: "behcs_runtime",
      kind: "runtime_mistake",
      severity: String(event.severity || "medium"),
      priority: 50,
      laneId: cleanLaneId(event.laneId),
      parentTaskId: "",
      title: clipText(event.reason || event.type || "runtime mistake", 120),
      reason: clipText(event.message || event.reason || "", 180),
      action: clipText(event.context?.blocker || event.context?.proof || "Recycle this mistake through gulp and verify the dependent lane stays bounded.", 180),
      linkedWorkerTaskIds: []
    });
  }

  if (historicalBacklog?.summary?.d0RuntimeCount) {
    items.push({
      id: "review:history:d0-runtime",
      source: "historical_replay",
      kind: "historical_backlog",
      severity: historicalBacklog.summary.d0RuntimeCount >= 5000 ? "high" : "medium",
      priority: 75,
      laneId: "memory-index-docs",
      parentTaskId: "",
      title: `Historical d0 backlog ${historicalBacklog.summary.d0RuntimeCount}`,
      reason: clipText(
        `Historical d0 runtime mistakes remain indexed at ${historicalBacklog.summary.d0RuntimeCount} rows across ${historicalBacklog.summary.replayWindowCount} replay windows.`,
        180
      ),
      action: clipText(
        `Keep replay windows routed through ${historicalBacklog.route || "hookwall -> omni_gnn -> omnishannon -> shannon -> omniwhite-room -> gc"} before widening any deeper OS claim.`,
        180
      ),
      linkedWorkerTaskIds: historicalBacklog.derivedTasks.map((task) => String(task.taskId || "")).filter(Boolean).slice(0, 6)
    });
  }

  if (historicalBacklog?.summary?.mistakeLedgerCount) {
    items.push({
      id: "review:history:mistake-ledger",
      source: "historical_replay",
      kind: "historical_backlog",
      severity: historicalBacklog.summary.mistakeLedgerCount >= 1000 ? "high" : "medium",
      priority: 74,
      laneId: "gc-gulp",
      parentTaskId: "",
      title: `Historical ledger backlog ${historicalBacklog.summary.mistakeLedgerCount}`,
      reason: clipText(
        `Historical mistake ledger remains at ${historicalBacklog.summary.mistakeLedgerCount} rows; dominant ledger type is ${historicalBacklog.summary.dominantLedgerType || "unknown"}.`,
        180
      ),
      action: "Keep GC and replay windows aligned so old drift is recycled into current controller law.",
      linkedWorkerTaskIds: historicalBacklog.derivedTasks.map((task) => String(task.taskId || "")).filter(Boolean).slice(0, 6)
    });
  }

  const sorted = items.sort(sortByReviewSeverity);
  return {
    ok: true,
    summary: {
      total: sorted.length,
      blockedLanes: sorted.filter((item) => item.kind === "blocked_lane").length,
      candidateHandOffs: sorted.filter((item) => item.kind === "candidate_handoff").length,
      mistakePatterns: sorted.filter((item) => item.kind === "mistake_pattern").length,
      runtimeMistakes: sorted.filter((item) => item.kind === "runtime_mistake").length,
      historicalBacklogReviews: sorted.filter((item) => item.kind === "historical_backlog").length,
      guardReviews: sorted.filter((item) => item.kind === "guard_posture").length
    },
    items: sorted,
    labels: buildSelfBuildLabels("self_build_review_queue.v1", { layer: "review" }),
    language: buildSelfBuildLanguage("self_build_review_queue.v1", { layer: "review" })
  };
}

function buildSelfBuildTaskboardPacket(options = {}) {
  ensureInitialized();
  const taskLimit = toClampedNumber(options.limit || options.taskLimit, 5, 1, 6);
  const includeBlocked = readBoolean(options.includeBlocked, true);
  const taskIds = normalizeTaskIdList(options.taskIds);
  const orchestrationPlan = buildSelfBuildOrchestratorPlan({
    taskLimit,
    includeBlocked,
    taskIds
  });
  const assignableTaskBoard = readAssignableTaskBoardView();
  const collector = collectorStatus();
  const mistakeSummary = getMistakePatternSummary();
  const mistakeHints = buildMistakeAvoidanceHints({
    limit: toClampedNumber(options.mistakeLimit, 8, 1, 24)
  });
  const recentMistakes = readRecentSelfBuildMistakes({
    limit: toClampedNumber(options.recentMistakeLimit, 6, 1, 24)
  });
  const historicalBacklog = buildHistoricalMistakeBacklog();
  const guide = getIxDeepWaveAgentGuide();
  const falconLanguage = getIxDeepWaveFalconLanguage();
  const falconSurface = buildFalconSurfaceSummary(falconLanguage);
  const crosswalk = getIxDeepWaveCrosswalk();
  const workerTasks = buildSelfBuildWorkerTasks(orchestrationPlan);
  const reviewQueue = buildSelfBuildReviewQueue(orchestrationPlan, workerTasks, collector, mistakeHints, recentMistakes, historicalBacklog);

  const workerTaskIdsByParent = workerTasks.tasks.reduce((map, task) => {
    const parentTaskId = String(task?.parentTaskId || "");
    if (!parentTaskId) return map;
    const current = map.get(parentTaskId) || [];
    current.push(String(task.id || ""));
    map.set(parentTaskId, current);
    return map;
  }, new Map());

  const reviewIdsByParent = reviewQueue.items.reduce((map, item) => {
    const parentTaskId = String(item?.parentTaskId || "");
    if (!parentTaskId) return map;
    const current = map.get(parentTaskId) || [];
    current.push(String(item.id || ""));
    map.set(parentTaskId, current);
    return map;
  }, new Map());

  const tasks = (Array.isArray(orchestrationPlan?.tasks) ? orchestrationPlan.tasks : []).map((entry) => ({
    order: Number(entry.order || 0),
    task: entry.task,
    laneId: cleanLaneId(entry?.task?.laneId),
    construction: entry.construction,
    currentExecutor: entry.selectedOrchestrator?.current || null,
    nextCandidateExecutor: entry.selectedOrchestrator?.nextCandidate || null,
    workerTaskIds: workerTaskIdsByParent.get(String(entry?.task?.id || "")) || [],
    reviewItemIds: reviewIdsByParent.get(String(entry?.task?.id || "")) || []
  }));

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    packetType: "self_build_taskboard.v1",
    packet: orchestrationPlan.packet,
    constructionPlan: orchestrationPlan.constructionPlan,
    orchestrationSummary: orchestrationPlan.summary,
    orchestrators: orchestrationPlan.orchestrators,
    taskboard: {
      summary: {
        taskCount: tasks.length,
        workerTaskCount: workerTasks.summary.total,
        reviewItemCount: reviewQueue.summary.total,
        assignableRoles: Number(assignableTaskBoard?.summary?.assignableRoles || 0),
        blockedRoles: Number(assignableTaskBoard?.summary?.blockedRoles || 0),
        pendingRoleTasks: Number(assignableTaskBoard?.summary?.pendingTasks || 0),
        gulpPendingMessages: Number(collector?.state?.sinceLastGulp || 0),
        gulpBufferDepth: Number(collector?.bufferDepth || 0),
        historicalReplayBuckets: Number(historicalBacklog?.summary?.replayBucketCount || 0),
        historicalReplayWindows: Number(historicalBacklog?.summary?.replayWindowCount || 0),
        historicalMistakeRows: Number(historicalBacklog?.summary?.totalRows || 0),
        guideTaskCount: Number(guide?.taskCount || 0),
        guidePhaseCount: Number(guide?.phaseCount || 0),
        guideSlotCount: Number(guide?.slotCount || 0),
        falconLanguageNamedAgentCount: Number(falconSurface.namedAgentCount || 0),
        falconLanguageCouncilSeatCount: Number(falconSurface.councilSeatCount || 0),
        falconLanguagePacketExampleCount: Number(falconSurface.packetExampleCount || 0),
        falconChiefSeatCount: Number(falconSurface.executionFabric?.chiefRuntime?.seatRoleCount || 0),
        falconChiefWorker: String(falconSurface.executionFabric?.chiefRuntime?.workerId || ""),
        falconChildWorker: String(falconSurface.executionFabric?.childRuntime?.workerId || ""),
        falconChildFanoutPerLane: Number(falconSurface.executionFabric?.childRuntime?.fanoutPerLane || 0),
        falconSupportedAgentTypeCount: Array.isArray(falconSurface.executionFabric?.childRuntime?.supportedWorkerIds)
          ? falconSurface.executionFabric.childRuntime.supportedWorkerIds.length
          : 0,
        crosswalkSurfaceCount: Number(crosswalk?.surfaceCount || 0),
        crosswalkSourcePacketCount: Number(crosswalk?.sourcePacketCount || 0)
      },
      tasks
    },
    assignableTaskBoard,
    collector,
    mistakes: {
      summary: mistakeSummary,
      hints: hintRowsOrFallback(mistakeHints),
      recent: recentMistakes
    },
    historicalBacklog,
    guide,
    falconLanguage,
    crosswalk,
    workerTasks,
    reviewQueue,
    labels: buildSelfBuildLabels("self_build_taskboard.v1", {
      layer: "taskboard",
      controllerStatus: String(orchestrationPlan?.packet?.controllerStatus || "")
    }),
    language: buildSelfBuildLanguage("self_build_taskboard.v1", {
      layer: "taskboard",
      activeLaneId: cleanLaneId(orchestrationPlan?.packet?.activeLane?.id),
      nextLaneId: cleanLaneId(orchestrationPlan?.packet?.nextQueueReadyLane?.id)
    })
  };
}

function hintRowsOrFallback(mistakeHints) {
  return {
    summary: mistakeHints?.summary || getMistakePatternSummary(),
    totalHints: Number(mistakeHints?.totalHints || 0),
    hints: Array.isArray(mistakeHints?.hints) ? mistakeHints.hints : []
  };
}

function buildSelfBuildMachineFeed(options = {}) {
  const recycleMode = normalizeRecycleMode(options.recycleMode);
  const taskboard = options.taskboard || buildSelfBuildTaskboardPacket(options);
  const mistakeHints = taskboard?.mistakes?.hints || { summary: taskboard?.mistakes?.summary || {}, totalHints: 0, hints: [] };
  const historicalBacklog = taskboard?.historicalBacklog || buildHistoricalMistakeBacklog();
  const guide = taskboard?.guide || getIxDeepWaveAgentGuide();
  const falconLanguage = taskboard?.falconLanguage || getIxDeepWaveFalconLanguage();
  const falconSurface = buildFalconSurfaceSummary(falconLanguage);
  const crosswalk = taskboard?.crosswalk || getIxDeepWaveCrosswalk();
  const workerFeedItems = (taskboard?.workerTasks?.tasks || []).slice(0, 12).map((task) => ({
    id: `feed:${String(task.id || "")}`,
    kind: "worker_task",
    laneId: cleanLaneId(task.laneId),
    title: clipText(task.title || "", 120),
    action: clipText(task.objective || "", 180),
    executor: String(task.currentExecutorId || ""),
    labels: task.labels,
    language: task.language
  }));
  const reviewFeedItems = (taskboard?.reviewQueue?.items || []).slice(0, 12).map((item) => ({
    id: `feed:${String(item.id || "")}`,
    kind: "review_item",
    laneId: cleanLaneId(item.laneId),
    title: clipText(item.title || "", 120),
    action: clipText(item.action || "", 180),
    executor: "review_queue",
    labels: buildSelfBuildLabels("self_build_machine_feed_item.v1", { kind: "review_item", laneId: cleanLaneId(item.laneId) }),
    language: buildSelfBuildLanguage("self_build_machine_feed_item.v1", { kind: "review_item", laneId: cleanLaneId(item.laneId) })
  }));
  const mistakeFeedItems = (Array.isArray(mistakeHints?.hints) ? mistakeHints.hints : []).slice(0, 6).map((hint) => ({
    id: `feed:mistake:${String(hint.id || "")}`,
    kind: "mistake_hint",
    laneId: cleanLaneId(hint.activity?.[0]),
    title: clipText(`${String(hint.code || "9.9.9")} ${hint.cause || "mistake hint"}`, 120),
    action: clipText(hint.avoid || "Apply safer default workflow and verify preconditions.", 180),
    executor: "gulp_processors",
    labels: buildSelfBuildLabels("self_build_machine_feed_item.v1", { kind: "mistake_hint" }),
    language: buildSelfBuildLanguage("self_build_machine_feed_item.v1", { kind: "mistake_hint" })
  }));
  const historicalFeedItems = (historicalBacklog?.replayBuckets || []).slice(0, 4).map((bucket) => ({
    id: `feed:history:${String(bucket.bucketId || "")}`,
    kind: "historical_replay_bucket",
    laneId: "memory-index-docs",
    title: clipText(`${String(bucket.bucketId || "RB")} ${bucket.family || "historical replay bucket"}`, 120),
    action: clipText(
      `Replay ${Number(bucket.count || 0)} rows across ${Number(bucket.windowCount || 0)} windows through ${bucket.route || historicalBacklog.route || "hookwall -> omni_gnn -> omnishannon -> shannon -> omniwhite-room -> gc"}.`,
      180
    ),
    executor: "omniwhite_room",
    labels: buildSelfBuildLabels("self_build_machine_feed_item.v1", { kind: "historical_replay_bucket" }),
    language: buildSelfBuildLanguage("self_build_machine_feed_item.v1", { kind: "historical_replay_bucket" })
  }));
  const guideFeedItems = (Array.isArray(guide?.tasks) ? guide.tasks : []).slice(0, 12).map((task) => ({
    id: `feed:guide:${String(task.taskId || "")}`,
    kind: "named_agent_guide_task",
    laneId: getGuideTaskLaneId(task),
    title: clipText(task.title || task.taskId || "guide task", 120),
    action: clipText(task.intent || `${String(task.taskId || "")} routed through ${String(task.primaryCouncilRole || "named_council")}.`, 180),
    executor: String(task.primaryCouncilRole || "named_council"),
    labels: buildSelfBuildLabels("self_build_machine_feed_item.v1", {
      kind: "named_agent_guide_task",
      guideTaskId: String(task.taskId || "")
    }),
    language: buildSelfBuildLanguage("self_build_machine_feed_item.v1", {
      kind: "named_agent_guide_task",
      guideTaskId: String(task.taskId || "")
    })
  }));
  const falconFeedItems = (Array.isArray(falconLanguage?.namedAgents) ? falconLanguage.namedAgents : []).slice(0, 12).map((agent) => ({
    id: `feed:falcon:${String(agent.name || "")}`,
    kind: "falcon_language_named_agent",
    laneId: getFalconNamedAgentLaneId(agent),
    title: clipText(`Falcon ${String(agent.name || "named_agent")}`, 120),
    action: clipText(
      `${String(agent.role || "named agent")} under ${String(agent.councilSeat || "council")} stays ${String(agent.languageStatus || "tuple_first")}.`,
      180
    ),
    executor: String(agent.councilSeat || agent.name || "falcon_language"),
    labels: buildSelfBuildLabels("self_build_machine_feed_item.v1", {
      kind: "falcon_language_named_agent",
      agentName: String(agent.name || "")
    }),
    language: buildSelfBuildLanguage("self_build_machine_feed_item.v1", {
      kind: "falcon_language_named_agent",
      agentName: String(agent.name || "")
    })
  }));
  const crosswalkFeedItems = (Array.isArray(crosswalk?.surfaces) ? crosswalk.surfaces : []).slice(0, 10).map((surface) => ({
    id: `feed:crosswalk:${String(surface.id || "")}`,
    kind: "deep_wave_crosswalk_surface",
    laneId: CROSSWALK_SURFACE_TO_LANE[String(surface.id || "")] || "memory-index-docs",
    title: clipText(`Crosswalk ${String(surface.id || "")}`, 120),
    action: clipText(
      `${String(surface.meaning || "crosswalk surface")} with ${Number(surface.artifactCount || 0)} artifacts stays bound into the deep-wave branch and routed through auto-translation ${String(crosswalk?.autoTranslationPath || "omnilanguage-json")}.`,
      180
    ),
    executor: "system_crosswalk",
    labels: buildSelfBuildLabels("self_build_machine_feed_item.v1", { kind: "deep_wave_crosswalk_surface", surfaceId: String(surface.id || "") }),
    language: buildSelfBuildLanguage("self_build_machine_feed_item.v1", { kind: "deep_wave_crosswalk_surface", surfaceId: String(surface.id || "") })
  }));
  const feedItems = [...workerFeedItems, ...reviewFeedItems, ...mistakeFeedItems, ...historicalFeedItems, ...guideFeedItems, ...falconFeedItems, ...crosswalkFeedItems];

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    packetType: "self_build_machine_feed.v1",
    recycleMode,
    controller: {
      status: String(taskboard?.packet?.controllerStatus || ""),
      activeLane: taskboard?.packet?.activeLane || null,
      nextQueueReadyLane: taskboard?.packet?.nextQueueReadyLane || null,
      guardPosture: taskboard?.packet?.guardPosture || {},
      proofBudget: taskboard?.packet?.proofBudget || {}
    },
    processors: {
      collector: {
        running: Boolean(taskboard?.collector?.running),
        pendingMessages: Number(taskboard?.collector?.state?.sinceLastGulp || 0),
        bufferDepth: Number(taskboard?.collector?.bufferDepth || 0),
        latest: taskboard?.collector?.latest || null,
        fileCap: taskboard?.collector?.fileCap || {}
      },
      historicalReplay: {
        replayWaveId: String(historicalBacklog?.replayWaveId || ""),
        replayBucketCount: Number(historicalBacklog?.summary?.replayBucketCount || 0),
        replayWindowCount: Number(historicalBacklog?.summary?.replayWindowCount || 0),
        totalRows: Number(historicalBacklog?.summary?.totalRows || 0),
        route: String(historicalBacklog?.route || "")
      },
      guide: {
        guideId: String(guide?.guideId || ""),
        status: String(guide?.status || ""),
        taskCount: Number(guide?.taskCount || 0),
        phaseCount: Number(guide?.phaseCount || 0),
        slotCount: Number(guide?.slotCount || 0),
        route: String(guide?.falconLanguageAbsorption?.route || guide?.chain?.join(" -> ") || "")
      },
      falconLanguage: {
        ...falconSurface,
        chiefWorkerId: String(falconSurface.executionFabric?.chiefRuntime?.workerId || ""),
        childWorkerId: String(falconSurface.executionFabric?.childRuntime?.workerId || ""),
        childFanoutPerLane: Number(falconSurface.executionFabric?.childRuntime?.fanoutPerLane || 0),
        supportedAgentTypeCount: Array.isArray(falconSurface.executionFabric?.childRuntime?.supportedWorkerIds)
          ? falconSurface.executionFabric.childRuntime.supportedWorkerIds.length
          : 0,
        agentAgnosticEnvelope: falconSurface.executionFabric?.omnispindle?.acceptsAnyAgentTypeEnvelope === true
      },
      crosswalk: {
        crosswalkId: String(crosswalk?.crosswalkId || ""),
        status: String(crosswalk?.status || ""),
        surfaceCount: Number(crosswalk?.surfaceCount || 0),
        sourcePacketCount: Number(crosswalk?.sourcePacketCount || 0),
        autoTranslationPath: String(crosswalk?.autoTranslationPath || "")
      },
      taskBoardRouting: taskboard?.assignableTaskBoard?.summary || {},
      recycleTargets: ["gulp", "mistake_patterns", "gnn", "guide", "falcon_language", "crosswalk"]
    },
    summary: {
      feedItemCount: feedItems.length,
      workerItems: workerFeedItems.length,
      reviewItems: reviewFeedItems.length,
      mistakeItems: mistakeFeedItems.length,
      historicalItems: historicalFeedItems.length,
      guideItems: guideFeedItems.length,
      falconLanguageItems: falconFeedItems.length,
      crosswalkItems: crosswalkFeedItems.length,
      reviewQueueDepth: Number(taskboard?.reviewQueue?.summary?.total || 0),
      pendingMessages: Number(taskboard?.collector?.state?.sinceLastGulp || 0),
      historicalRows: Number(historicalBacklog?.summary?.totalRows || 0)
    },
    feedItems,
    labels: buildSelfBuildLabels("self_build_machine_feed.v1", { recycleMode }),
    language: buildSelfBuildLanguage("self_build_machine_feed.v1", { recycleMode })
  };
}

async function runSelfBuildMachineFeed(options = {}) {
  const requestedRecycleMode = normalizeRecycleMode(options.recycleMode || (readBoolean(options.recycleMistakes, false) ? "schedule" : "preview"));
  const recycleHold = requestedRecycleMode === "preview"
    ? null
    : requireSelfBuildLiveExecution({ ...options, executeNow: true }, "self_build_machine_feed", { requestedRecycleMode });
  const recycleMode = recycleHold ? "preview" : requestedRecycleMode;
  const taskboard = options.taskboard || buildSelfBuildTaskboardPacket(options);
  const feed = buildSelfBuildMachineFeed({
    ...options,
    taskboard,
    recycleMode
  });

  let recycle = {
    mode: recycleMode,
    triggered: false,
    result: {
      ok: true,
      preview: true,
      reason: "preview_only"
    }
  };

  if (recycleMode === "schedule") {
    const scheduled = scheduleGulp("self_build_machine_feed");
    recycle = {
      mode: recycleMode,
      triggered: scheduled?.scheduled === true || scheduled?.running === true,
      result: scheduled
    };
  } else if (recycleMode === "run") {
    const runResult = await runGulpRehydration({
      force: true,
      reason: "self_build_machine_feed"
    });
    recycle = {
      mode: recycleMode,
      triggered: runResult?.ok !== false || runResult?.skipped === true,
      result: runResult
    };
  }

  const recycleOk = recycleMode === "preview"
    ? true
    : recycleMode === "schedule"
      ? String(recycle?.result?.fileCap?.status || "pass") !== "deny"
      : recycle?.result?.ok !== false;

  return {
    ok: recycleHold ? recycleHold.ok !== false : recycleOk,
    taskboard,
    feed,
    recycleHold,
    recycle
  };
}

function repoRootPath() {
  return path.join(__dirname, "..");
}

function toRepoRelative(filePath) {
  return path.relative(repoRootPath(), filePath).replace(/\\/g, "/");
}

function formatWaveStamp(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

function writeReportTextAtomic(filePath, text) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tempPath, `${String(text || "").replace(/\r/g, "").trimEnd()}\n`, "utf8");
  fs.renameSync(tempPath, filePath);
}

function writeReportJsonAtomic(filePath, value) {
  writeReportTextAtomic(filePath, JSON.stringify(value, null, 2));
}

function safeReadText(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  } catch (_error) {
    return "";
  }
}

function safeReadJson(filePath, fallback = null) {
  const text = safeReadText(filePath);
  if (!text) return fallback;
  try {
    return JSON.parse(text);
  } catch (_error) {
    return fallback;
  }
}

function countNdjsonRows(filePath) {
  return safeReadText(filePath)
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .length;
}

function latestMainOsArchaeologyReplayReport() {
  const direct = safeReadJson(MAIN_OS_ARCHAEOLOGY_REPLAY_LATEST_JSON_PATH, null);
  if (direct && typeof direct === "object") {
    return direct;
  }
  try {
    const candidates = fs.readdirSync(REPORTS_DIR)
      .filter((name) => /^deep-wave-main-os-archaeology-replay-wave-\d{8}-\d{6}\.json$/i.test(String(name || "")))
      .sort()
      .reverse();
    for (const name of candidates) {
      const report = safeReadJson(path.join(REPORTS_DIR, name), null);
      if (report && typeof report === "object") {
        return report;
      }
    }
  } catch (_error) {
    return null;
  }
  return null;
}

function buildHistoricalMistakeBacklog() {
  const replay = latestMainOsArchaeologyReplayReport();
  const d0Runtime = replay?.corpus?.d0Runtime || {};
  const mistakeLedger = replay?.corpus?.mistakeLedger || {};
  const replayBuckets = Array.isArray(replay?.replayBuckets) ? replay.replayBuckets : [];
  const derivedTasks = Array.isArray(replay?.derivedTasks) ? replay.derivedTasks : [];
  const replayWindowCount = replayBuckets.reduce((total, bucket) => (
    total + (Array.isArray(bucket?.windows) ? bucket.windows.length : 0)
  ), 0);
  const d0Count = Number(d0Runtime?.count || countNdjsonRows(BEHCS_RUNTIME_MISTAKES_PATH));
  const ledgerCount = Number(mistakeLedger?.count || countNdjsonRows(MISTAKE_LEDGER_PATH));

  return {
    ok: true,
    replayWaveId: String(replay?.waveId || ""),
    replayStatus: String(replay?.status || ""),
    summary: {
      totalRows: d0Count + ledgerCount,
      d0RuntimeCount: d0Count,
      mistakeLedgerCount: ledgerCount,
      replayBucketCount: replayBuckets.length,
      replayWindowCount,
      dominantD0Event: clipText(d0Runtime?.topSourceEvents?.[0]?.name || "", 80),
      dominantLedgerType: clipText(mistakeLedger?.topTypes?.[0]?.name || "", 80)
    },
    route: clipText(
      replay?.languageSurface?.chain
      || "hookwall -> omni_gnn -> omnishannon -> shannon -> omniwhite-room -> gc",
      180
    ),
    readiness: replay?.readiness || null,
    mainOsBridge: replay?.mainOsBridge || null,
    replayBuckets: replayBuckets.slice(0, 8).map((bucket) => ({
      bucketId: clipText(bucket?.bucketId || "", 24),
      family: clipText(bucket?.family || "", 120),
      count: Number(bucket?.count || 0),
      windowCount: Array.isArray(bucket?.windows) ? bucket.windows.length : 0,
      route: clipText(bucket?.route || replay?.languageSurface?.chain || "", 180)
    })),
    derivedTasks: derivedTasks.slice(0, 12).map((task) => ({
      taskId: clipText(task?.taskId || "", 24),
      owner: clipText(task?.owner || "", 80),
      action: clipText(task?.action || "", 140),
      status: clipText(task?.status || "", 24)
    })),
    labels: buildSelfBuildLabels("historical_mistake_backlog.v1", {
      layer: "historical_replay",
      route: "hookwall_omnishannon_gnn_white_room_gc"
    }),
    language: buildSelfBuildLanguage("historical_mistake_backlog.v1", {
      layer: "historical_replay",
      replayBucketCount: replayBuckets.length,
      replayWindowCount
    })
  };
}

function summarizeCommandResult(result, command, args = []) {
  return {
    ok: Number(result?.status) === 0,
    command: [command, ...args].join(" "),
    status: Number.isFinite(Number(result?.status)) ? Number(result.status) : null,
    signal: String(result?.signal || ""),
    stdout: clipText(result?.stdout || "", 320),
    stderr: clipText(result?.stderr || "", 320)
  };
}

function runLocalRefreshCommand(command, args = [], options = {}) {
  return spawnSync(command, args, {
    cwd: options.cwd || repoRootPath(),
    encoding: "utf8",
    timeout: Number(options.timeoutMs || 180000),
    windowsHide: true
  });
}

function getSnapshotTaskManager(snapshot = {}) {
  const devices = Array.isArray(snapshot?.devices) ? snapshot.devices : [];
  const desktop = devices.find((device) => String(device?.id || "").trim().toLowerCase() === "acer" && device?.taskManager)
    || devices.find((device) => String(device?.kind || "").trim().toLowerCase() === "desktop" && device?.taskManager)
    || null;
  return desktop?.taskManager && typeof desktop.taskManager === "object" ? desktop.taskManager : {};
}

function isFreshTimestamp(value, maxAgeMs = 5 * 60 * 1000) {
  const epoch = Date.parse(String(value || ""));
  if (!Number.isFinite(epoch)) {
    return false;
  }
  return (Date.now() - epoch) <= maxAgeMs;
}

function refreshFalconWaveWatches(options = {}) {
  const refreshRequested = readBoolean(options.refreshWatches, true);
  const repoRoot = repoRootPath();
  if (!refreshRequested) {
    const snapshot = buildResourceBudgetSnapshot({
      instanceRoot: repoRoot,
      write: false
    });
    const taskManager = getSnapshotTaskManager(snapshot);
    return {
      requested: false,
      supervisor: null,
      cpuGpuWatcher: null,
      snapshot: {
        generatedAt: String(snapshot?.generatedAt || ""),
        outputPath: toRepoRelative(snapshot?.outputPath || path.join(repoRoot, "data", "behcs", "resource-budget-snapshot.json")),
        pressureLevel: String(snapshot?.summary?.pressureLevel || ""),
        dispatchReady: snapshot?.summary?.dispatchReady === true,
        taskManager: {
          sampledAt: String(taskManager?.sampledAt || ""),
          fresh: isFreshTimestamp(taskManager?.sampledAt),
          source: String(taskManager?.source || "")
        }
      }
    };
  }

  const supervisorScript = path.join(repoRoot, "tools", "Keep-Asolaria-SystemSupervisor.ps1");
  const watcherScript = path.join(repoRoot, "tools", "cpu-gpu-watcher.js");
  const supervisorResult = runLocalRefreshCommand("powershell.exe", [
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    supervisorScript,
    "-RunOnce"
  ], {
    cwd: repoRoot,
    timeoutMs: 180000
  });
  const watcherResult = runLocalRefreshCommand(process.execPath, [
    watcherScript,
    "--once"
  ], {
    cwd: repoRoot,
    timeoutMs: 120000
  });
  const snapshot = buildResourceBudgetSnapshot({
    instanceRoot: repoRoot,
    write: true
  });
  const taskManager = getSnapshotTaskManager(snapshot);

  return {
    requested: true,
    supervisor: summarizeCommandResult(supervisorResult, "powershell.exe", [
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      toRepoRelative(supervisorScript),
      "-RunOnce"
    ]),
    cpuGpuWatcher: summarizeCommandResult(watcherResult, process.execPath, [
      toRepoRelative(watcherScript),
      "--once"
    ]),
    snapshot: {
      generatedAt: String(snapshot?.generatedAt || ""),
      outputPath: toRepoRelative(snapshot?.outputPath || path.join(repoRoot, "data", "behcs", "resource-budget-snapshot.json")),
      pressureLevel: String(snapshot?.summary?.pressureLevel || ""),
      dispatchReady: snapshot?.summary?.dispatchReady === true,
      taskManager: {
        sampledAt: String(taskManager?.sampledAt || ""),
        fresh: isFreshTimestamp(taskManager?.sampledAt),
        source: String(taskManager?.source || "")
      }
    }
  };
}

function buildFalconTranslationStage() {
  const chiefPacket = "@packet from=chief to=asolaria verb=marshal boundary=C_only auto_translation=omnilanguage-json";
  const selectorPacket = "@packet from=falcon to=behcs_bus verb=relay selector=helm tuple_fallback=required auto_translation=omnilanguage-json";
  const chiefJson = translate("omnilanguage", "json", chiefPacket);
  const chiefRoundTrip = translate("json", "omnilanguage", chiefJson);
  const selectorJson = translate("omnilanguage", "json", selectorPacket);
  const selectorRoundTrip = translate("json", "omnilanguage", selectorJson);

  return {
    ok: true,
    autoTranslationPath: "omnilanguage-json",
    tupleFallback: "required",
    proofs: [
      {
        id: "chief_marshal_roundtrip",
        ok: chiefRoundTrip.includes("from=chief")
          && chiefRoundTrip.includes("to=asolaria")
          && chiefRoundTrip.includes("verb=marshal"),
        root: chiefJson.root,
        from: chiefJson.from,
        to: chiefJson.to,
        verb: chiefJson.verb,
        roundTrip: chiefRoundTrip
      },
      {
        id: "falcon_selector_roundtrip",
        ok: selectorRoundTrip.includes("from=falcon")
          && selectorRoundTrip.includes("to=behcs_bus")
          && selectorRoundTrip.includes("verb=relay")
          && selectorRoundTrip.includes("tuple_fallback=required"),
        root: selectorJson.root,
        from: selectorJson.from,
        to: selectorJson.to,
        verb: selectorJson.verb,
        roundTrip: selectorRoundTrip
      }
    ]
  };
}

function buildFalconAlignmentStage(stamp) {
  const repoRoot = repoRootPath();
  const wave = buildOmniHookwallGnnAlignmentWave({
    runtimeRoot: repoRoot,
    controlRoomManifestPath: path.join(repoRoot, "data", "minimal-control-room", "manifest.json"),
    hooksStatsApi: "http://127.0.0.1:4781/api/hooks/stats",
    healthApi: "http://127.0.0.1:4781/api/health"
  });
  const packetText = buildOmniHookwallGnnAlignmentPacket(wave);
  const jsonPath = path.join(REPORTS_DIR, `deep-wave-falcon-language-fix-wave-${stamp}.alignment.json`);
  const packetPath = path.join(REPORTS_DIR, `deep-wave-falcon-language-fix-wave-${stamp}.alignment.packet.txt`);
  writeReportJsonAtomic(jsonPath, wave);
  writeReportTextAtomic(packetPath, packetText);

  return {
    ok: true,
    chain: String(wave?.alignment?.single_operational_chain || ""),
    packetText,
    wave,
    paths: {
      json: toRepoRelative(jsonPath),
      packet: toRepoRelative(packetPath)
    }
  };
}

function detectStorageBootBlocked(taskboard = {}) {
  const tasks = Array.isArray(taskboard?.taskboard?.tasks) ? taskboard.taskboard.tasks : [];
  return tasks.some((entry) =>
    cleanLaneId(entry?.laneId || entry?.task?.laneId) === "storage-boot"
  );
}

function collectFalconWaveBlockers(context = {}) {
  const blockers = [];
  const guards = context.guards && typeof context.guards === "object" ? context.guards : {};
  const guardList = Array.isArray(guards.guards) ? guards.guards : [];
  const taskManagerGuard = guardList.find((guard) => String(guard?.id || "") === "task_manager_process_guard") || null;

  if (taskManagerGuard?.fresh === false) {
    blockers.push("taskManager_fresh_false");
  } else if (taskManagerGuard && String(taskManagerGuard.status || "") !== "pass") {
    blockers.push(`taskManager_${String(taskManagerGuard.status || "hold")}`);
  }

  if (context.recoveryKrPending === true) {
    blockers.push("KR_recheck_awaiting");
  }
  if (detectStorageBootBlocked(context.taskboard)) {
    blockers.push("storage_boot_blocked");
  }
  if (context.cascade?.liveFrontier?.allowPeerExpansion !== true) {
    blockers.push("peer_expansion_denied");
  }
  if (String(context.whiteRoom?.finalStatus || "") !== "pass") {
    blockers.push("omniwhite_room_not_pass");
  }
  if (context.translation?.ok !== true || (context.translation?.proofs || []).some((proof) => proof.ok !== true)) {
    blockers.push("autotranslation_roundtrip_failed");
  }
  if (String(context.guards?.summary?.gateStatus || "") === "hold") {
    blockers.push("unified_guard_hold");
  }
  if (String(context.machineFeed?.recycle?.result?.fileCap?.status || "") === "deny") {
    blockers.push("gc_file_cap_deny");
  }

  return Array.from(new Set(blockers));
}

async function runFalconLanguageFixWave(options = {}) {
  ensureInitialized();
  const now = new Date();
  const stamp = formatWaveStamp(now);
  const generatedAt = now.toISOString();
  const taskLimit = toClampedNumber(options.limit || options.taskLimit, 6, 1, 6);
  const recycleMode = normalizeRecycleMode(options.recycleMode || "preview");
  const taskIds = normalizeTaskIdList(options.taskIds);
  const simulationComplete = readBoolean(options.simulationComplete, true);
  const refresh = refreshFalconWaveWatches(options);
  const translation = buildFalconTranslationStage();
  const alignment = buildFalconAlignmentStage(stamp);
  const whiteRoom = runIxFabricAtlasWhiteRoomReview({
    reportsRoot: REPORTS_DIR,
    latestBaseName: "ix-fabric-atlas-white-room-review-latest"
  });
  const guards = getIxControllerGuards();
  const cascade = getOmnispindle().getCascadeStatus();
  const taskboard = buildSelfBuildTaskboardPacket({
    taskLimit,
    includeBlocked: true,
    taskIds,
    mistakeLimit: options.mistakeLimit,
    recentMistakeLimit: options.recentMistakeLimit
  });
  const orchestrationEligible = translation.ok === true
    && (translation.proofs || []).every((proof) => proof.ok === true)
    && whiteRoom.finalStatus === "pass";
  const orchestration = orchestrationEligible
    ? runSelfBuildOrchestratorPlan({
      taskLimit,
      includeBlocked: true,
      taskIds,
      simulationComplete
    })
    : {
      ok: false,
      blocked: true,
      reason: "falcon_wave_prereq_failed"
    };
  const machineFeed = await runSelfBuildMachineFeed({
    taskLimit,
    taskIds,
    recycleMode,
    taskboard
  });
  const recoverySealText = safeReadText(RECOVERY_REVIEW_SEAL_LATEST_PATH);
  const recoveryKrPending = /KR\s*=\s*PENDING_RECHECK/i.test(recoverySealText);
  const historical = {
    d0Runtime: {
      path: toRepoRelative(BEHCS_RUNTIME_MISTAKES_PATH),
      count: countNdjsonRows(BEHCS_RUNTIME_MISTAKES_PATH)
    },
    mistakeLedger: {
      path: toRepoRelative(MISTAKE_LEDGER_PATH),
      count: countNdjsonRows(MISTAKE_LEDGER_PATH)
    }
  };
  const blockers = collectFalconWaveBlockers({
    guards,
    cascade,
    taskboard,
    recoveryKrPending,
    whiteRoom,
    translation,
    machineFeed
  });
  const taskboardSummary = taskboard?.taskboard?.summary || {};
  const namedPackets = [
    {
      role: "chief",
      packet: `@packet from=ChiefPlanner to=FalconFixWave verb=marshal lane=SECOND review_items=${Number(taskboardSummary.reviewItemCount || 0)} guard=${String(guards?.summary?.gateStatus || "hold")} files=${Number(taskboard?.packet?.proofBudget?.trackedFiles || 0)}/${Number(taskboard?.packet?.proofBudget?.maxTrackedFiles || 0)} boundary=C_only,no_E,no_boot,no_phone,no_promotion`
    },
    {
      role: "director",
      packet: `@packet falcon{directorTaskboard=\"/api/constructions/atlas/self-build/taskboard\",workerDecomposition=\"/api/constructions/atlas/self-build/worker-tasks\",executorAssignment=\"/api/constructions/atlas/self-build/orchestration-run\",machineFeed=\"/api/constructions/atlas/self-build/machine-feed\",bossUpChannel=\"Shannon->Sentinel->Gaia\"}`
    },
    {
      role: "omniwhite_room",
      packet: `@packet falcon:white-room-study=\"atlas_bundle_hash_and_gate_review\",mistake-extraction=\"d0=${historical.d0Runtime.count};ledger=${historical.mistakeLedger.count};recent=${Number(taskboard?.mistakes?.recent?.length || 0)}\",post_gnn_review=\"${whiteRoom.finalStatus}\",pre_summon=\"hold_until_blockers_clear\"`
    },
    {
      role: "sentinel_kr",
      packet: `@packet falcon{role=recovery,mode=real,actor=sentinel.safety,verb=affirm,target=fix_wave,state=fail-closed,proof=${recoveryKrPending ? "KR-recheck-awaiting" : "KR-recheck-clear"},boundaries=C_only|no_E|no_boot|no_phone|no_promotion}`
    },
    {
      role: "falcon_selector",
      packet: `@packet from=falcon to=behcs_bus verb=relay auto_translation=${translation.autoTranslationPath} tuple_fallback=${translation.tupleFallback} selector=helm team_ready=${blockers.length < 1 ? "true" : "false"}`
    },
    {
      role: "shannon_gnn_gc",
      packet: `@packet from=hookwall to=shannon verb=sync_flow chain=${alignment.chain} auto_translation=${translation.autoTranslationPath} white_room=${whiteRoom.finalStatus} recycle=${recycleMode} gc_status=${String(machineFeed?.recycle?.result?.ok !== false ? "ok" : "blocked")}`
    }
  ];

  const report = {
    waveId: `deep-wave-falcon-language-fix-wave-${stamp}`,
    generatedAt,
    status: blockers.length < 1 ? "ready_not_summoned" : "reviewed_controlled_not_summoned",
    authority: {
      scope: "c_only_fix_wave",
      boundaries: [
        "C_only",
        "no_E_writes",
        "no_boot_mutation",
        "no_phone_mutation",
        "no_promotion_claims"
      ]
    },
    languageSurface: {
      dialect: "Falcon_omnilanguage_plus_BEHCS_HG256",
      chain: alignment.chain,
      autoTranslationPath: translation.autoTranslationPath,
      tupleFallback: translation.tupleFallback
    },
    watches: refresh,
    stages: {
      translation,
      alignment: {
        ok: alignment.ok,
        chain: alignment.chain,
        paths: alignment.paths
      },
      whiteRoom: {
        ok: whiteRoom.ok,
        finalStatus: whiteRoom.finalStatus,
        paths: {
          reportJson: toRepoRelative(whiteRoom.paths.reportJson),
          reportMd: toRepoRelative(whiteRoom.paths.reportMd),
          latestJson: toRepoRelative(whiteRoom.paths.latestJson),
          latestMd: toRepoRelative(whiteRoom.paths.latestMd)
        }
      },
      orchestration: {
        ok: orchestration?.ok === true,
        blocked: orchestration?.blocked === true,
        reason: String(orchestration?.reason || ""),
        launchedCount: Number(orchestration?.execution?.execution?.launchedCount || 0),
        blockedCount: Number(orchestration?.execution?.execution?.blockedCount || 0),
        deferredCount: Array.isArray(orchestration?.deferred) ? orchestration.deferred.length : 0
      },
      machineFeed: {
        ok: machineFeed.ok,
        recycleMode,
        recycle: machineFeed.recycle,
        summary: machineFeed.feed?.summary || {}
      }
    },
    guards,
    cascade: {
      topologyId: String(cascade?.topologyId || ""),
      allowNewChildren: cascade?.liveFrontier?.allowNewChildren === true,
      allowNewChildrenWithGuards: cascade?.liveFrontier?.allowNewChildrenWithGuards === true,
      allowNewChildrenWithSelfBuild: cascade?.liveFrontier?.allowNewChildrenWithSelfBuild === true,
      allowPeerExpansion: cascade?.liveFrontier?.allowPeerExpansion === true,
      reasons: Array.isArray(cascade?.liveFrontier?.reasons) ? cascade.liveFrontier.reasons : [],
      guardReasons: Array.isArray(cascade?.liveFrontier?.guardReasons) ? cascade.liveFrontier.guardReasons : [],
      selfBuildReasons: Array.isArray(cascade?.liveFrontier?.selfBuildReasons) ? cascade.liveFrontier.selfBuildReasons : []
    },
    taskboard: {
      summary: taskboardSummary,
      controllerStatus: String(taskboard?.packet?.controllerStatus || ""),
      activeLaneId: cleanLaneId(taskboard?.packet?.activeLane?.id),
      nextLaneId: cleanLaneId(taskboard?.packet?.nextQueueReadyLane?.id),
      recentMistakes: Array.isArray(taskboard?.mistakes?.recent) ? taskboard.mistakes.recent.slice(0, 6) : []
    },
    historicalMistakes: historical,
    namedPackets,
    readiness: {
      summon_ready_when: [
        "translation_roundtrip_passes",
        "gnn_alignment_chain_written",
        "omniwhite_room_passes_after_gnn",
        "gc_runs_only_after_gnn_and_white_room",
        "task_manager_watch_fresh",
        "KR_has_not_reopened_E_recovery",
        "storage_boot_still_blocked",
        "peer_expansion_still_denied_until_real_liveness"
      ],
      summon_blockers: blockers,
      summon_fired: false
    }
  };

  const reportJsonPath = path.join(REPORTS_DIR, `${report.waveId}.json`);
  const reportMdPath = path.join(REPORTS_DIR, `${report.waveId}.md`);
  const latestJsonPath = path.join(REPORTS_DIR, "deep-wave-falcon-language-fix-wave-latest.json");
  const latestMdPath = path.join(REPORTS_DIR, "deep-wave-falcon-language-fix-wave-latest.md");
  const markdown = [
    "# Deep Wave Falcon-Language Fix Wave",
    "",
    `- Generated: ${generatedAt}`,
    `- Status: ${report.status}`,
    `- Chain: ${alignment.chain}`,
    `- Auto-translation: ${translation.autoTranslationPath} (${translation.proofs.every((proof) => proof.ok === true) ? "pass" : "fail"})`,
    `- Omniwhite-room: ${whiteRoom.finalStatus}`,
    `- GC recycle: ${recycleMode} / ${machineFeed.recycle?.triggered ? "triggered" : "not_triggered"}`,
    `- Task Manager watch fresh: ${refresh.snapshot?.taskManager?.fresh === true}`,
    "",
    "## Blockers",
    ...(blockers.length > 0 ? blockers.map((blocker) => `- ${blocker}`) : ["- none"]),
    "",
    "## Named Packets",
    ...namedPackets.map((packet) => `- ${packet.role}: ${packet.packet}`),
    "",
    "## Stage Outputs",
    `- alignment json: ${alignment.paths.json}`,
    `- alignment packet: ${alignment.paths.packet}`,
    `- white-room json: ${toRepoRelative(whiteRoom.paths.reportJson)}`,
    `- white-room md: ${toRepoRelative(whiteRoom.paths.reportMd)}`,
    `- historical mistakes: ${historical.d0Runtime.count} d0 / ${historical.mistakeLedger.count} ledger`,
    `- orchestration launched: ${Number(orchestration?.execution?.execution?.launchedCount || 0)}`,
    `- orchestration deferred: ${Array.isArray(orchestration?.deferred) ? orchestration.deferred.length : 0}`,
    `- machine-feed items: ${Number(machineFeed.feed?.summary?.feedItemCount || 0)}`
  ].join("\n");

  writeReportJsonAtomic(reportJsonPath, report);
  writeReportTextAtomic(reportMdPath, markdown);
  writeReportJsonAtomic(latestJsonPath, report);
  writeReportTextAtomic(latestMdPath, markdown);

  return {
    ok: true,
    report,
    markdown,
    paths: {
      reportJson: reportJsonPath,
      reportMd: reportMdPath,
      latestJson: latestJsonPath,
      latestMd: latestMdPath
    }
  };
}

const SOVEREIGN_HOLDOUT_BLOCKERS = new Set([
  "KR_recheck_awaiting",
  "storage_boot_blocked",
  "peer_expansion_denied"
]);

function latestFalconFixWaveReport() {
  const report = safeReadJson(FALCON_FIX_WAVE_LATEST_JSON_PATH, null);
  return report && typeof report === "object" ? report : null;
}

function buildSystemOrchestrationPlan(options = {}) {
  ensureInitialized();
  const taskLimit = toClampedNumber(options.limit || options.taskLimit, 6, 1, 6);
  const requestedTaskIds = normalizeTaskIdList(options.taskIds);
  const latestWave = latestFalconFixWaveReport();
  const crosswalk = getIxDeepWaveCrosswalk();
  const guide = getIxDeepWaveAgentGuide();
  const falconLanguage = getIxDeepWaveFalconLanguage();
  const falconSurface = buildFalconSurfaceSummary(falconLanguage);
  const orchestrationEngine = buildSystemCouncilSlots(falconLanguage)[0]?.engine || {};
  const packet = getIxSelfBuildControllerPacket({ taskLimit });
  const taskboard = buildSelfBuildTaskboardPacket({
    taskLimit,
    includeBlocked: true,
    taskIds: requestedTaskIds,
    mistakeLimit: options.mistakeLimit,
    recentMistakeLimit: options.recentMistakeLimit
  });
  const recommendedTasks = Array.isArray(packet?.recommendedTasks) ? packet.recommendedTasks : [];
  const executableTasks = recommendedTasks.filter((task) => {
    const laneId = cleanLaneId(task?.laneId);
    const status = normalizeTaskStatus(task?.status);
    return task?.launchable !== false
      && !SELF_BUILD_BLOCKED_LANES.has(laneId)
      && SELF_BUILD_EXECUTABLE_STATUSES.has(status);
  });
  const launchableTaskIds = executableTasks
    .map((task) => String(task?.id || ""))
    .filter(Boolean)
    .slice(0, taskLimit);
  const blockerList = Array.isArray(latestWave?.readiness?.summon_blockers)
    ? latestWave.readiness.summon_blockers.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
  const onlySovereignHoldouts = blockerList.length > 0
    && blockerList.every((blocker) => SOVEREIGN_HOLDOUT_BLOCKERS.has(blocker));
  const waveHealthy = latestWave?.stages?.translation?.ok === true
    && latestWave?.stages?.whiteRoom?.finalStatus === "pass"
    && latestWave?.guards?.summary?.gateStatus === "pass"
    && latestWave?.watches?.snapshot?.taskManager?.fresh === true;

  let recommendedMode = "falcon_wave";
  let recommendedReason = "refresh_falcon_fix_wave_first";
  if (!latestWave) {
    recommendedMode = "falcon_wave";
    recommendedReason = "no_latest_falcon_fix_wave";
  } else if (!waveHealthy) {
    recommendedMode = "falcon_wave";
    recommendedReason = "falcon_fix_wave_not_green";
  } else if (!onlySovereignHoldouts) {
    recommendedMode = "falcon_wave";
    recommendedReason = "non_sovereign_blockers_remain";
  } else {
    recommendedMode = "self_build";
    recommendedReason = "only_sovereign_holdouts_remain_continue_c_only";
  }

  const selectedTaskIds = requestedTaskIds.length > 0
    ? requestedTaskIds
    : (recommendedMode === "self_build" ? launchableTaskIds : []);
  const nextLaneIds = unique(executableTasks.map((task) => cleanLaneId(task?.laneId))).slice(0, taskLimit);
  const activeLaneId = cleanLaneId(packet?.activeLane?.id);
  const nextLaneId = cleanLaneId(packet?.nextQueueReadyLane?.id);
  const namedPackets = [
    {
      role: "chief",
      packet: `@packet from=ChiefPlanner to=SystemOrchestrator verb=choose mode=${recommendedMode} reason=${recommendedReason} active_lane=${activeLaneId || "none"} next_lane=${nextLaneId || "none"} blockers=${blockerList.length || 0} guide=${guide?.guideId || "none"} falcon=${falconLanguage?.languageId || "none"} crosswalk=${crosswalk?.crosswalkId || "none"} ${buildCouncilEngineTextTokens(orchestrationEngine)} chain=${String(falconLanguage?.omniProcessorAbsorption?.route || guide?.falconLanguageAbsorption?.route || "").replace(/\s+/g, "_") || "hookwall_to_omnishannon_to_omniwhite_room"} boundary=C_only,no_E,no_boot,no_phone,no_promotion`
    },
    {
      role: "director",
      packet: `@packet falcon{systemPlanRoute=\"/api/constructions/atlas/system/orchestration-plan\",systemRunRoute=\"/api/constructions/atlas/system/orchestrate\",systemGuideRoute=\"/api/constructions/atlas/system/guide\",systemFalconLanguageRoute=\"/api/constructions/atlas/system/falcon-language\",systemCrosswalkRoute=\"/api/constructions/atlas/system/crosswalk\",selectedMode=\"${recommendedMode}\",chiefWorker=\"${String(orchestrationEngine.chiefWorkerId || "unknown")}\",childWorker=\"${String(orchestrationEngine.childWorkerId || "unknown")}\",childFanout=${Number(orchestrationEngine.childFanout || 0)},taskboard=\"/api/constructions/atlas/self-build/taskboard\",machineFeed=\"/api/constructions/atlas/self-build/machine-feed\"}`
    },
    {
      role: "sentinel_kr",
      packet: `@packet falcon{role=recovery,verb=hold,target=system_orchestrator,proof=${blockerList.includes("KR_recheck_awaiting") ? "KR-recheck-awaiting" : "KR-clear"},storage_boot=${blockerList.includes("storage_boot_blocked") ? "blocked" : "not_blocked"},peer_expansion=${blockerList.includes("peer_expansion_denied") ? "denied" : "allowed"}}`
    },
    {
      role: "shannon_gnn_gc",
      packet: `@packet from=system to=shannon verb=route_next mode=${recommendedMode} guard=${String(latestWave?.guards?.summary?.gateStatus || "unknown")} translation=${latestWave?.stages?.translation?.ok === true ? "pass" : "unknown"} white_room=${String(latestWave?.stages?.whiteRoom?.finalStatus || "unknown")} guide=${guide?.guideId || "none"} falcon=${falconLanguage?.languageId || "none"} guide_tasks=${Number(guide?.taskCount || 0)} falcon_agents=${Number(falconLanguage?.namedAgentCount || 0)}`
    }
  ];

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    packetType: "system_orchestration_plan.v1",
    boundaries: [
      "C_only",
      "no_E_writes",
      "no_boot_mutation",
      "no_phone_mutation",
      "no_promotion_claims"
    ],
    controller: {
      status: String(packet?.controllerStatus || ""),
      activeLaneId,
      nextLaneId,
      guardPosture: packet?.guardPosture || {},
      proofBudget: packet?.proofBudget || {}
    },
    crosswalk: {
      crosswalkId: String(crosswalk?.crosswalkId || ""),
      status: String(crosswalk?.status || ""),
      surfaceCount: Number(crosswalk?.surfaceCount || 0),
      sourcePacketCount: Number(crosswalk?.sourcePacketCount || 0),
      autoTranslationPath: String(crosswalk?.autoTranslationPath || ""),
      currentHolds: Array.isArray(crosswalk?.currentHolds) ? crosswalk.currentHolds : []
    },
    guide: {
      guideId: String(guide?.guideId || ""),
      status: String(guide?.status || ""),
      taskCount: Number(guide?.taskCount || 0),
      phaseCount: Number(guide?.phaseCount || 0),
      slotCount: Number(guide?.slotCount || 0),
      authorityMapId: String(guide?.authorityMap?.mapId || ""),
      route: String(guide?.falconLanguageAbsorption?.route || guide?.chain?.join(" -> ") || "")
    },
    falconLanguage: {
      ...falconSurface,
      chiefWorkerId: String(falconSurface.executionFabric?.chiefRuntime?.workerId || ""),
      chiefModelHint: String(falconSurface.executionFabric?.chiefRuntime?.modelHint || ""),
      childWorkerId: String(falconSurface.executionFabric?.childRuntime?.workerId || ""),
      childModelHint: String(falconSurface.executionFabric?.childRuntime?.modelHint || ""),
      childFanoutPerLane: Number(falconSurface.executionFabric?.childRuntime?.fanoutPerLane || 0),
      supportedAgentTypeCount: Array.isArray(falconSurface.executionFabric?.childRuntime?.supportedWorkerIds)
        ? falconSurface.executionFabric.childRuntime.supportedWorkerIds.length
        : 0
    },
    latestFalconWave: latestWave ? {
      waveId: String(latestWave.waveId || ""),
      status: String(latestWave.status || ""),
      taskManagerFresh: latestWave?.watches?.snapshot?.taskManager?.fresh === true,
      guardStatus: String(latestWave?.guards?.summary?.gateStatus || ""),
      whiteRoomStatus: String(latestWave?.stages?.whiteRoom?.finalStatus || ""),
      blockers: blockerList
    } : null,
    nextTranche: {
      recommendedMode,
      recommendedReason,
      taskIds: selectedTaskIds,
      nextLaneIds,
      taskCount: selectedTaskIds.length,
      onlySovereignHoldouts
    },
    taskboard: {
      summary: taskboard?.taskboard?.summary || {},
      reviewQueueDepth: Number(taskboard?.reviewQueue?.summary?.total || 0),
      recentMistakeCount: Array.isArray(taskboard?.mistakes?.recent) ? taskboard.mistakes.recent.length : 0
    },
    namedPackets,
    labels: buildSelfBuildLabels("system_orchestration_plan.v1", {
      layer: "system_orchestration",
      selectedMode: recommendedMode
    }),
    language: buildSelfBuildLanguage("system_orchestration_plan.v1", {
      layer: "system_orchestration",
      selectedMode: recommendedMode
    })
  };
}

async function runSystemOrchestration(options = {}) {
  ensureInitialized();
  const plan = buildSystemOrchestrationPlan(options);
  const stamp = formatWaveStamp(new Date());
  const requestedMode = clipText(options.mode || "", 40).toLowerCase();
  const selectedMode = (!requestedMode || requestedMode === "auto")
    ? plan.nextTranche.recommendedMode
    : requestedMode;
  const selectedTaskIds = normalizeTaskIdList(options.taskIds).length > 0
    ? normalizeTaskIdList(options.taskIds)
    : plan.nextTranche.taskIds;

  let execution;
  if (selectedMode === "falcon_wave") {
    execution = await runFalconLanguageFixWave({
      ...options,
      mode: "falcon_wave",
      taskIds: selectedTaskIds,
      limit: options.limit || options.taskLimit || 6
    });
  } else {
    execution = await runSelfBuildOrchestratorControl({
      ...options,
      mode: "self_build",
      taskIds: selectedTaskIds,
      limit: options.limit || options.taskLimit || 6
    });
  }

  const report = {
    orchestrationId: `deep-wave-system-orchestration-${stamp}`,
    generatedAt: new Date().toISOString(),
    status: execution?.ok === true ? "executed_not_promoted" : "blocked",
    selectedMode,
    authority: {
      scope: "c_only_system_orchestration",
      boundaries: plan.boundaries
    },
    plan: {
      recommendedMode: plan.nextTranche.recommendedMode,
      recommendedReason: plan.nextTranche.recommendedReason,
      latestFalconWave: plan.latestFalconWave,
      taskIds: selectedTaskIds,
      nextLaneIds: plan.nextTranche.nextLaneIds
    },
    executionSummary: selectedMode === "falcon_wave"
      ? {
        ok: execution?.ok === true,
        waveId: String(execution?.report?.waveId || ""),
        blockers: execution?.report?.readiness?.summon_blockers || [],
        taskManagerFresh: execution?.report?.watches?.snapshot?.taskManager?.fresh === true,
        guardStatus: String(execution?.report?.guards?.summary?.gateStatus || ""),
        whiteRoomStatus: String(execution?.report?.stages?.whiteRoom?.finalStatus || ""),
        launchedCount: Number(execution?.report?.stages?.orchestration?.launchedCount || 0),
        deferredCount: Number(execution?.report?.stages?.orchestration?.deferredCount || 0)
      }
      : {
        ok: execution?.ok === true,
        controllerStatus: String(execution?.control?.controllerStatus || ""),
        activeLaneId: cleanLaneId(execution?.control?.activeLaneId),
        nextLaneId: cleanLaneId(execution?.control?.nextLaneId),
        launchedCount: Number(execution?.control?.launchedCount || 0),
        deferredCount: Number(execution?.control?.deferredCount || 0),
        recycleMode: String(execution?.control?.recycleMode || "")
      },
    namedPackets: plan.namedPackets
  };

  const reportJsonPath = path.join(REPORTS_DIR, `${report.orchestrationId}.json`);
  const reportMdPath = path.join(REPORTS_DIR, `${report.orchestrationId}.md`);
  const latestJsonPath = path.join(REPORTS_DIR, "deep-wave-system-orchestration-latest.json");
  const latestMdPath = path.join(REPORTS_DIR, "deep-wave-system-orchestration-latest.md");
  const markdown = [
    "# Deep Wave System Orchestration",
    "",
    `- Generated: ${report.generatedAt}`,
    `- Status: ${report.status}`,
    `- Selected mode: ${selectedMode}`,
    `- Recommended mode: ${plan.nextTranche.recommendedMode}`,
    `- Reason: ${plan.nextTranche.recommendedReason}`,
    `- Active lane: ${plan.controller.activeLaneId || "none"}`,
    `- Next lane: ${plan.controller.nextLaneId || "none"}`,
    "",
    "## Latest Falcon Wave",
    `- waveId: ${String(plan.latestFalconWave?.waveId || "none")}`,
    `- status: ${String(plan.latestFalconWave?.status || "none")}`,
    `- taskManagerFresh: ${plan.latestFalconWave?.taskManagerFresh === true}`,
    `- guardStatus: ${String(plan.latestFalconWave?.guardStatus || "unknown")}`,
    `- whiteRoomStatus: ${String(plan.latestFalconWave?.whiteRoomStatus || "unknown")}`,
    `- blockers: ${(plan.latestFalconWave?.blockers || []).join(", ") || "none"}`,
    "",
    "## Execution",
    `- ok: ${execution?.ok === true}`,
    `- taskIds: ${selectedTaskIds.join(", ") || "auto"}`,
    `- next lanes: ${(plan.nextTranche.nextLaneIds || []).join(", ") || "none"}`,
    "",
    "## Named Packets",
    ...plan.namedPackets.map((packet) => `- ${packet.role}: ${packet.packet}`)
  ].join("\n");

  writeReportJsonAtomic(reportJsonPath, report);
  writeReportTextAtomic(reportMdPath, markdown);
  writeReportJsonAtomic(latestJsonPath, report);
  writeReportTextAtomic(latestMdPath, markdown);

  return {
    ok: execution?.ok === true,
    plan,
    execution,
    report,
    paths: {
      reportJson: reportJsonPath,
      reportMd: reportMdPath,
      latestJson: latestJsonPath,
      latestMd: latestMdPath
    }
  };
}

function buildSystemReadinessPacket(options = {}) {
  ensureInitialized();
  const taskLimit = toClampedNumber(options.limit || options.taskLimit, 6, 1, 6);
  const taskIds = normalizeTaskIdList(options.taskIds);
  const plan = buildSystemOrchestrationPlan({
    taskLimit,
    taskIds,
    mistakeLimit: options.mistakeLimit,
    recentMistakeLimit: options.recentMistakeLimit
  });
  const taskboard = buildSelfBuildTaskboardPacket({
    taskLimit,
    includeBlocked: true,
    taskIds,
    mistakeLimit: options.mistakeLimit,
    recentMistakeLimit: options.recentMistakeLimit
  });
  const machineFeed = buildSelfBuildMachineFeed({
    taskboard,
    recycleMode: "preview"
  });
  const latestWave = latestFalconFixWaveReport();
  const historicalBacklog = taskboard?.historicalBacklog || buildHistoricalMistakeBacklog();
  const guide = taskboard?.guide || getIxDeepWaveAgentGuide();
  const falconLanguage = taskboard?.falconLanguage || getIxDeepWaveFalconLanguage();
  const falconSurface = buildFalconSurfaceSummary(falconLanguage);
  const crosswalk = taskboard?.crosswalk || getIxDeepWaveCrosswalk();
  const blockers = Array.isArray(latestWave?.readiness?.summon_blockers) ? latestWave.readiness.summon_blockers : [];
  const onlySovereignHoldouts = blockers.length > 0 && blockers.every((blocker) => SOVEREIGN_HOLDOUT_BLOCKERS.has(String(blocker || "")));
  const readyWhen = unique([
    ...(Array.isArray(latestWave?.readiness?.summon_ready_when) ? latestWave.readiness.summon_ready_when : []),
    ...(Array.isArray(guide?.readiness?.summonReadyWhen) ? guide.readiness.summonReadyWhen : []),
    ...(Array.isArray(falconLanguage?.readiness?.summonReadyWhen) ? falconLanguage.readiness.summonReadyWhen : [])
  ].map((value) => clipText(value, 160)).filter(Boolean));

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    packetType: "system_readiness.v1",
    authority: {
      scope: "c_only_system_readiness",
      boundaries: plan.boundaries
    },
    selectedMode: plan?.nextTranche?.recommendedMode || "self_build",
    chain: {
      path: clipText(latestWave?.languageSurface?.chain || historicalBacklog?.route || "", 180),
      autoTranslationPath: clipText(latestWave?.languageSurface?.autoTranslationPath || crosswalk?.autoTranslationPath || "omnilanguage-json", 80),
      whiteRoomStatus: clipText(latestWave?.stages?.whiteRoom?.finalStatus || "", 24),
      guardStatus: clipText(latestWave?.guards?.summary?.gateStatus || "", 24),
      gcFileCapStatus: clipText(machineFeed?.processors?.collector?.fileCap?.status || "", 24),
      guideStatus: clipText(guide?.status || "", 24),
      falconLanguageStatus: clipText(falconLanguage?.status || "", 24),
      falconTupleMode: clipText(falconLanguage?.glyphPosture || "", 40),
      falconChiefWorker: clipText(falconSurface.executionFabric?.chiefRuntime?.workerId || "", 40),
      falconChildWorker: clipText(falconSurface.executionFabric?.childRuntime?.workerId || "", 40),
      crosswalkStatus: clipText(crosswalk?.status || "", 24)
    },
    readiness: {
      cOnlyExecutionReady: plan?.nextTranche?.recommendedMode === "self_build",
      promotionReady: blockers.length < 1,
      onlySovereignHoldouts,
      blockers,
      readyWhen,
      deepWaveCrosswalkBound: crosswalk?.ok === true,
      planningGuideBound: guide?.ok === true,
      guideSummonReady: guide?.readiness?.summonReady === true,
      falconLanguageBound: falconLanguage?.ok === true,
      falconLanguageSummonReady: falconLanguage?.readiness?.summonReady === true,
      falconAgentEnvelopeAgnostic: falconSurface.executionFabric?.omnispindle?.acceptsAnyAgentTypeEnvelope === true
    },
    taskboard: {
      summary: taskboard?.taskboard?.summary || {},
      reviewQueueDepth: Number(taskboard?.reviewQueue?.summary?.total || 0),
      workerTaskCount: Number(taskboard?.workerTasks?.summary?.total || 0)
    },
    historicalBacklog: {
      replayWaveId: String(historicalBacklog?.replayWaveId || ""),
      summary: historicalBacklog?.summary || {},
      route: String(historicalBacklog?.route || "")
    },
    crosswalk: {
      crosswalkId: String(crosswalk?.crosswalkId || ""),
      status: String(crosswalk?.status || ""),
      surfaceCount: Number(crosswalk?.surfaceCount || 0),
      sourcePacketCount: Number(crosswalk?.sourcePacketCount || 0),
      currentHolds: Array.isArray(crosswalk?.currentHolds) ? crosswalk.currentHolds : [],
      currentVerdict: Array.isArray(crosswalk?.currentVerdict) ? crosswalk.currentVerdict : []
    },
    guide: {
      guideId: String(guide?.guideId || ""),
      status: String(guide?.status || ""),
      taskCount: Number(guide?.taskCount || 0),
      phaseCount: Number(guide?.phaseCount || 0),
      slotCount: Number(guide?.slotCount || 0),
      authorityMapId: String(guide?.authorityMap?.mapId || ""),
      route: String(guide?.falconLanguageAbsorption?.route || guide?.chain?.join(" -> ") || ""),
      summonReadyWhen: Array.isArray(guide?.readiness?.summonReadyWhen) ? guide.readiness.summonReadyWhen : []
    },
    falconLanguage: {
      ...falconSurface,
      chiefWorkerId: String(falconSurface.executionFabric?.chiefRuntime?.workerId || ""),
      childWorkerId: String(falconSurface.executionFabric?.childRuntime?.workerId || ""),
      childFanoutPerLane: Number(falconSurface.executionFabric?.childRuntime?.fanoutPerLane || 0),
      supportedAgentTypeCount: Array.isArray(falconSurface.executionFabric?.childRuntime?.supportedWorkerIds)
        ? falconSurface.executionFabric.childRuntime.supportedWorkerIds.length
        : 0,
      currentHolds: Array.isArray(falconLanguage?.readiness?.currentHolds) ? falconLanguage.readiness.currentHolds : [],
      currentVerdict: Array.isArray(falconLanguage?.readiness?.currentVerdict) ? falconLanguage.readiness.currentVerdict : [],
      summonReadyWhen: Array.isArray(falconLanguage?.readiness?.summonReadyWhen) ? falconLanguage.readiness.summonReadyWhen : []
    },
    labels: buildSelfBuildLabels("system_readiness.v1", {
      layer: "system_readiness",
      selectedMode: plan?.nextTranche?.recommendedMode || "self_build"
    }),
    language: buildSelfBuildLanguage("system_readiness.v1", {
      layer: "system_readiness",
      selectedMode: plan?.nextTranche?.recommendedMode || "self_build"
    })
  };
}

function buildSystemCouncilPacket(options = {}) {
  ensureInitialized();
  const taskLimit = toClampedNumber(options.limit || options.taskLimit, 6, 1, 6);
  const taskIds = normalizeTaskIdList(options.taskIds);
  const plan = buildSystemOrchestrationPlan({
    taskLimit,
    taskIds,
    mistakeLimit: options.mistakeLimit,
    recentMistakeLimit: options.recentMistakeLimit
  });
  const readiness = buildSystemReadinessPacket(options);
  const crosswalk = readiness?.crosswalk || getIxDeepWaveCrosswalk();
  const taskboard = buildSelfBuildTaskboardPacket({
    taskLimit,
    includeBlocked: true,
    taskIds,
    mistakeLimit: options.mistakeLimit,
    recentMistakeLimit: options.recentMistakeLimit
  });
  const historicalBacklog = taskboard?.historicalBacklog || buildHistoricalMistakeBacklog();
  const guide = taskboard?.guide || getIxDeepWaveAgentGuide();
  const falconLanguage = taskboard?.falconLanguage || getIxDeepWaveFalconLanguage();
  const falconSurface = buildFalconSurfaceSummary(falconLanguage);
  const guideAssignmentsByRole = mapGuideAssignmentsByRole(guide);
  const falconSeatsByRole = mapFalconSeatsByRole(falconLanguage);
  const taskEntries = Array.isArray(taskboard?.taskboard?.tasks) ? taskboard.taskboard.tasks : [];
  const workerTasks = Array.isArray(taskboard?.workerTasks?.tasks) ? taskboard.workerTasks.tasks : [];
  const reviewItems = Array.isArray(taskboard?.reviewQueue?.items) ? taskboard.reviewQueue.items : [];
  const opencodeCandidateTaskIds = taskEntries
    .filter((entry) => String(entry?.nextCandidateExecutor?.id || "") === "worker_router")
    .map((entry) => String(entry?.task?.id || ""))
    .filter(Boolean)
    .slice(0, 6);
  const omnispindleCandidateTaskIds = taskEntries
    .filter((entry) => String(entry?.nextCandidateExecutor?.id || "") === "omnispindle")
    .map((entry) => String(entry?.task?.id || ""))
    .filter(Boolean)
    .slice(0, 6);
  const blockedTaskIds = taskEntries
    .filter((entry) => entry?.task?.launchable === false || String(entry?.currentExecutor?.id || "") === "none")
    .map((entry) => String(entry?.task?.id || ""))
    .filter(Boolean)
    .slice(0, 6);
  const historicalTaskIds = Array.isArray(historicalBacklog?.derivedTasks)
    ? historicalBacklog.derivedTasks.map((task) => String(task.taskId || "")).filter(Boolean).slice(0, 8)
    : [];

  const slots = buildSystemCouncilSlots(falconLanguage).map((slot) => {
    const guideAssignment = guideAssignmentsByRole.get(slot.role) || {
      primaryTaskIds: [],
      supportingTaskIds: [],
      focus: ""
    };
    const falconSeat = falconSeatsByRole.get(slot.role) || {
      focus: "",
      packetClass: "",
      guideTaskIds: []
    };
    const guideTaskIds = unique([
      ...(Array.isArray(guideAssignment.primaryTaskIds) ? guideAssignment.primaryTaskIds : []),
      ...(Array.isArray(guideAssignment.supportingTaskIds) ? guideAssignment.supportingTaskIds : [])
    ]).slice(0, 8);
    const falconNamedAgents = (Array.isArray(falconLanguage?.namedAgents) ? falconLanguage.namedAgents : [])
      .filter((agent) => String(agent?.councilSeat || "") === slot.role)
      .map((agent) => String(agent?.name || ""))
      .filter(Boolean)
      .slice(0, 6);
    let assignedTaskIds = [];
    let assignedReviewIds = [];
    let packetClass = "PKT-ORCH-001";

    if (slot.role === "chief_helm") {
      assignedTaskIds = Array.isArray(plan?.nextTranche?.taskIds) ? plan.nextTranche.taskIds.slice(0, 6) : [];
      assignedReviewIds = reviewItems.slice(0, 4).map((item) => String(item.id || "")).filter(Boolean);
    } else if (slot.role === "director_vector_rook") {
      assignedTaskIds = taskEntries.map((entry) => String(entry?.task?.id || "")).filter(Boolean).slice(0, 6);
      assignedReviewIds = workerTasks.slice(0, 6).map((task) => String(task.id || "")).filter(Boolean);
      packetClass = "PKT-WORK-001";
    } else if (slot.role === "gaia_dasein_brain") {
      assignedTaskIds = historicalTaskIds.slice(0, 6);
      assignedReviewIds = reviewItems
        .filter((item) => ["historical_backlog", "runtime_mistake", "mistake_pattern"].includes(String(item.kind || "")))
        .map((item) => String(item.id || ""))
        .filter(Boolean)
        .slice(0, 6);
      packetClass = "PKT-REVIEW-001";
    } else if (slot.role === "sentinel_kr") {
      assignedTaskIds = blockedTaskIds;
      assignedReviewIds = Array.isArray(readiness?.readiness?.blockers) ? readiness.readiness.blockers.slice(0, 6) : [];
      packetClass = "PKT-SUMMON-001";
    } else if (slot.role === "falcon_selector") {
      assignedTaskIds = opencodeCandidateTaskIds.slice(0, 6);
      assignedReviewIds = reviewItems.slice(0, 4).map((item) => String(item.id || "")).filter(Boolean);
      packetClass = "PKT-BOSSUP-001";
    } else if (slot.role === "omnispindle_flywheels") {
      assignedTaskIds = [...omnispindleCandidateTaskIds, ...opencodeCandidateTaskIds].slice(0, 6);
      assignedReviewIds = workerTasks
        .filter((task) => ["worker_router", "omnispindle"].includes(String(task?.nextCandidateExecutorId || "")))
        .map((task) => String(task.id || ""))
        .filter(Boolean)
        .slice(0, 6);
      packetClass = "PKT-WORK-001";
    }

    const engineTokens = buildCouncilEngineTextTokens(slot.engine);
    const packet = slot.role === "chief_helm"
      ? `@packet from=chief to=council verb=marshal packet_class=${packetClass} mode=${plan?.nextTranche?.recommendedMode || "self_build"} reason=${plan?.nextTranche?.recommendedReason || "unknown"} active_lane=${plan?.controller?.activeLaneId || "none"} next_lane=${plan?.controller?.nextLaneId || "none"} guide=${guide?.guideId || "none"} falcon=${falconLanguage?.languageId || "none"} crosswalk=${crosswalk?.crosswalkId || "none"} ${engineTokens} boundary=C_only,no_E,no_boot,no_phone,no_promotion taskIds=${assignedTaskIds.join("|") || "none"} guideTaskIds=${guideTaskIds.join("|") || "none"} falconAgents=${falconNamedAgents.join("|") || "none"}`
      : slot.role === "director_vector_rook"
        ? `@packet falcon{packet_class=${packetClass} taskboard=\"/api/constructions/atlas/self-build/taskboard\" workerDecomposition=\"/api/constructions/atlas/self-build/worker-tasks\" reviewQueue=\"/api/constructions/atlas/self-build/review-queue\" machineFeed=\"/api/constructions/atlas/self-build/machine-feed\" systemGuide=\"/api/constructions/atlas/system/guide\" systemFalconLanguage=\"/api/constructions/atlas/system/falcon-language\" systemCrosswalk=\"/api/constructions/atlas/system/crosswalk\" chiefWorker=\"${String(slot.engine.chiefWorkerId || "unknown")}\" childWorker=\"${String(slot.engine.childWorkerId || "unknown")}\" childFanout=${Number(slot.engine.childFanout || 0)} supportedAgents=\"${Array.isArray(slot.engine.supportedWorkerIds) ? slot.engine.supportedWorkerIds.join("|") : "none"}\" taskIds=\"${assignedTaskIds.join("|") || "none"}\" guideTaskIds=\"${guideTaskIds.join("|") || "none"}\" falconAgents=\"${falconNamedAgents.join("|") || "none"}\"}`
        : slot.role === "gaia_dasein_brain"
          ? `@packet falcon:white-room-bucket-strategy="packet_class=${packetClass};replayBuckets=${Number(historicalBacklog?.summary?.replayBucketCount || 0)};windows=${Number(historicalBacklog?.summary?.replayWindowCount || 0)};totalRows=${Number(historicalBacklog?.summary?.totalRows || 0)};crosswalkSurfaces=${Number(crosswalk?.surfaceCount || 0)};guideTasks=${guideTaskIds.length};falconTuple=${String(falconLanguage?.glyphPosture || "unknown")};chiefWorker=${String(slot.engine.chiefWorkerId || "unknown")};childWorker=${String(slot.engine.childWorkerId || "unknown")}" reviewIds="${assignedReviewIds.join("|") || "none"}"`
          : slot.role === "sentinel_kr"
            ? `@packet falcon{packet_class=${packetClass} role=recovery verb=hold proof=${Array.isArray(readiness?.readiness?.blockers) && readiness.readiness.blockers.includes("KR_recheck_awaiting") ? "KR-recheck-awaiting" : "KR-clear"} storage_boot=${Array.isArray(readiness?.readiness?.blockers) && readiness.readiness.blockers.includes("storage_boot_blocked") ? "blocked" : "not_blocked"} peer_expansion=${Array.isArray(readiness?.readiness?.blockers) && readiness.readiness.blockers.includes("peer_expansion_denied") ? "denied" : "allowed"} falcon=${falconLanguage?.languageId || "none"} chief_worker=${String(slot.engine.chiefWorkerId || "unknown")} guideTaskIds=${guideTaskIds.join("|") || "none"}}`
            : slot.role === "falcon_selector"
              ? `@packet from=falcon to=behcs_bus verb=relay packet_class=${packetClass} auto_translation=${readiness?.chain?.autoTranslationPath || "omnilanguage-json"} tuple_fallback=required falcon=${falconLanguage?.languageId || "none"} guide=${guide?.guideId || "none"} crosswalk=${crosswalk?.crosswalkId || "none"} ${engineTokens} taskIds=${assignedTaskIds.join("|") || "none"} guideTaskIds=${guideTaskIds.join("|") || "none"} falconAgents=${falconNamedAgents.join("|") || "none"}`
              : `@packet from=omnispindle to=worker_router verb=delegate packet_class=${packetClass} falcon=${falconLanguage?.languageId || "none"} guide=${guide?.guideId || "none"} crosswalk=${crosswalk?.crosswalkId || "none"} ${engineTokens} taskIds=${assignedTaskIds.join("|") || "none"} guideTaskIds=${guideTaskIds.join("|") || "none"} falconAgents=${falconNamedAgents.join("|") || "none"} allow_peer=${readiness?.readiness?.blockers?.includes("peer_expansion_denied") ? "false" : "true"}`;

    return {
      slotId: slot.slotId,
      role: slot.role,
      team: slot.team,
      engine: slot.engine,
      childStrategy: slot.childStrategy,
      packetClass,
      taskIds: assignedTaskIds,
      guideTaskIds,
      guideFocus: String(guideAssignment.focus || ""),
      falconNamedAgents,
      falconFocus: String(falconSeat.focus || ""),
      reviewIds: assignedReviewIds,
      packet
    };
  });

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    packetType: "system_council.v1",
    authority: readiness.authority,
    readiness,
    taskboard: {
      summary: taskboard?.taskboard?.summary || {},
      reviewQueueDepth: Number(taskboard?.reviewQueue?.summary?.total || 0),
      workerTaskCount: Number(taskboard?.workerTasks?.summary?.total || 0)
    },
    guide: {
      guideId: String(guide?.guideId || ""),
      status: String(guide?.status || ""),
      taskCount: Number(guide?.taskCount || 0),
      phaseCount: Number(guide?.phaseCount || 0),
      slotCount: Number(guide?.slotCount || 0),
      route: String(guide?.falconLanguageAbsorption?.route || guide?.chain?.join(" -> ") || "")
    },
    falconLanguage: {
      ...falconSurface,
      chiefWorkerId: String(falconSurface.executionFabric?.chiefRuntime?.workerId || ""),
      chiefModelHint: String(falconSurface.executionFabric?.chiefRuntime?.modelHint || ""),
      childWorkerId: String(falconSurface.executionFabric?.childRuntime?.workerId || ""),
      childModelHint: String(falconSurface.executionFabric?.childRuntime?.modelHint || ""),
      childFanoutPerLane: Number(falconSurface.executionFabric?.childRuntime?.fanoutPerLane || 0),
      supportedAgentTypeCount: Array.isArray(falconSurface.executionFabric?.childRuntime?.supportedWorkerIds)
        ? falconSurface.executionFabric.childRuntime.supportedWorkerIds.length
        : 0
    },
    crosswalk: {
      crosswalkId: String(crosswalk?.crosswalkId || ""),
      status: String(crosswalk?.status || ""),
      surfaceCount: Number(crosswalk?.surfaceCount || 0),
      sourcePacketCount: Number(crosswalk?.sourcePacketCount || 0),
      currentHolds: Array.isArray(crosswalk?.currentHolds) ? crosswalk.currentHolds : []
    },
    slots,
    requiredSystems: [
      {
        id: "hookwall_omnishannon_gnn",
        status: readiness?.chain?.path ? "pass" : "unknown",
        route: readiness?.chain?.path || ""
      },
      {
        id: "omniwhite_room",
        status: readiness?.chain?.whiteRoomStatus || "unknown",
        route: "/api/constructions/atlas/self-build/review-queue"
      },
      {
        id: "gc_gulp",
        status: readiness?.chain?.gcFileCapStatus || "unknown",
        route: "/api/constructions/atlas/self-build/machine-feed"
      },
      {
        id: "deep_wave_crosswalk",
        status: crosswalk?.ok === true ? "pass" : "hold",
        route: "/api/constructions/atlas/system/crosswalk"
      },
      {
        id: "deep_wave_agent_guide",
        status: guide?.ok === true ? "pass" : "hold",
        route: "/api/constructions/atlas/system/guide"
      },
      {
        id: "deep_wave_falcon_language",
        status: falconLanguage?.ok === true ? "pass" : "hold",
        route: "/api/constructions/atlas/system/falcon-language"
      }
    ],
    namedPackets: slots.map((slot) => ({
      role: slot.role,
      packet: slot.packet
    })),
    labels: buildSelfBuildLabels("system_council.v1", {
      layer: "system_council",
      selectedMode: plan?.nextTranche?.recommendedMode || "self_build"
    }),
    language: buildSelfBuildLanguage("system_council.v1", {
      layer: "system_council",
      selectedMode: plan?.nextTranche?.recommendedMode || "self_build"
    })
  };
}

function buildCouncilAllowedPaths(role) {
  const root = repoRootPath();
  const common = [
    path.join(root, "routes", "constructions.js"),
    path.join(root, "src", "omnispindle.js"),
    path.join(root, "routes", "omnispindle.js"),
    path.join(root, "src", "connectors", "workerRouter.js"),
    path.join(root, "reports", "deep-wave-system-council-latest.json"),
    path.join(root, "reports", "deep-wave-falcon-language-fix-wave-latest.json"),
    path.join(root, "data", "behcs", "index", "deep-wave-hg256-agent-guide.v1.json"),
    path.join(root, "data", "behcs", "index", "deep-wave-falcon-language-authority.v1.json"),
    path.join(root, "data", "cubes", "asolaria-instance@acer", "brown-hilbert-47D-expansion-map.json"),
    path.join(root, "data", "behcs", "index", "deep-wave-master-plan-crosswalk.v1.json"),
    path.join(root, "reports", "deep-wave-master-plan-crosswalk-latest.json")
  ];

  if (role === "gaia_dasein_brain") {
    return unique([
      ...common,
      path.join(root, "reports", "deep-wave-main-os-archaeology-replay-wave-20260415-201549.json"),
      path.join(root, "data", "behcs", "d0-runtime", "mistakes.ndjson"),
      path.join(root, "data", "mistake-ledger.ndjson")
    ]);
  }
  if (role === "falcon_selector") {
    return unique([
      ...common,
      path.join(root, "data", "behcs", "codex", "glyph-language"),
      path.join(root, "tools", "cube", "omni-processor", "omnitranslator-v0.js")
    ]);
  }
  return unique([
    ...common,
    path.join(root, "data", "behcs"),
    path.join(root, "reports")
  ]);
}

function buildCouncilWorkerDispatchPlan(options = {}) {
  ensureInitialized();
  const taskLimit = toClampedNumber(options.limit || options.taskLimit, 6, 1, 6);
  const taskIds = normalizeTaskIdList(options.taskIds);
  const council = options.council || buildSystemCouncilPacket(options);
  const taskboard = buildSelfBuildTaskboardPacket({
    taskLimit,
    includeBlocked: true,
    taskIds,
    mistakeLimit: options.mistakeLimit,
    recentMistakeLimit: options.recentMistakeLimit
  });
  const historicalBacklog = taskboard?.historicalBacklog || buildHistoricalMistakeBacklog();
  const executionFabric = getFalconExecutionFabric(council?.falconLanguage || {});
  const requestedExecuteNow = readBoolean(options.executeNow, false);
  const executeNow = requestedExecuteNow && selfBuildLiveExecutionEnabled();
  const executionHold = requestedExecuteNow && !executeNow
    ? {
      held: true,
      reason: "self_build_live_execution_disabled",
      enableWith: "ASOLARIA_SELF_BUILD_EXECUTION_ENABLED=1"
    }
    : null;
  const chiefWorkerId = String(executionFabric?.chiefRuntime?.workerId || "claude_max");
  const childWorkerId = String(executionFabric?.childRuntime?.workerId || "opencode");
  const chiefNeedsCloudWorker = !["opencode", "local_codex"].includes(chiefWorkerId);
  const maxDispatches = toClampedNumber(options.maxDispatches, 8, 1, 8);
  const timeoutMs = toClampedNumber(options.timeoutMs, 180000, 60000, 300000);
  const taskEntries = Array.isArray(taskboard?.taskboard?.tasks) ? taskboard.taskboard.tasks : [];
  const taskEntryById = taskEntries.reduce((map, entry) => {
    const key = String(entry?.task?.id || "");
    if (key) {
      map.set(key, entry);
    }
    return map;
  }, new Map());
  const requests = [];

  const pushRequest = (request) => {
    if (!request || !request.requestId) return;
    if (requests.some((item) => item.requestId === request.requestId)) return;
    requests.push(request);
  };

  const chiefSlot = (council.slots || []).find((slot) => slot.role === "chief_helm");
  if (chiefSlot) {
    pushRequest({
      requestId: "council-chief-marshal",
      role: chiefSlot.role,
      councilSlotId: chiefSlot.slotId,
      taskId: "chief-marshal-plan",
      input: {
        title: "Council Chief Marshal Plan",
        objective: `Marshal the current C-only tranche, keep summon false, and confirm the chief/director/council order before any child dispatch under ${chiefWorkerId}.`,
        taskType: "review",
        sensitivity: "owner_plane",
        size: "small",
        preferredWorker: chiefWorkerId,
        executeNow,
        timeoutMs,
        projectScope: "system-council",
        requiresRepoWrite: false,
        needsCloudWorker: chiefNeedsCloudWorker,
        instructions: [
          "Use Falcon language and BEHCS tuple fallback.",
          "No file edits. No promotion claims. No E: writes. No boot/storage mutation. No phone mutation.",
          `Council slot packet: ${chiefSlot.packet}.`,
          "Return chief order, summon gate, child dispatch boundary, and one bounded next council move."
        ].join(" "),
        allowedPaths: buildCouncilAllowedPaths(chiefSlot.role),
        expectedArtifacts: [
          "chief_order_note",
          "summon_gate_note",
          "child_dispatch_boundary",
          "next_council_move"
        ]
      }
    });
  }

  const directorSlot = (council.slots || []).find((slot) => slot.role === "director_vector_rook");
  if (directorSlot) {
    pushRequest({
      requestId: "council-director-decomposition",
      role: directorSlot.role,
      councilSlotId: directorSlot.slotId,
      taskId: "director-decomposition-plan",
      input: {
        title: "Council Director Decomposition Plan",
        objective: `Decompose the live system council work into Falcon task packets with ${chiefWorkerId} as the chief runtime and ${childWorkerId} as the default child runtime.`,
        taskType: "orchestration",
        sensitivity: "internal",
        size: "small",
        preferredWorker: chiefWorkerId,
        executeNow,
        timeoutMs,
        projectScope: "system-council",
        requiresRepoWrite: false,
        needsCloudWorker: chiefNeedsCloudWorker,
        instructions: [
          "Use Falcon language task packets only.",
          "No file edits. No promotion claims. No E: writes. No boot/storage mutation. No phone mutation.",
          `Council slot packet: ${directorSlot.packet}.`,
          "Return packet decomposition, child fanout policy, supported agent set, and stop condition."
        ].join(" "),
        allowedPaths: buildCouncilAllowedPaths(directorSlot.role),
        expectedArtifacts: [
          "packet_decomposition",
          "child_fanout_policy",
          "supported_agent_set",
          "stop_condition"
        ]
      }
    });
  }

  const gaiaSlot = (council.slots || []).find((slot) => slot.role === "gaia_dasein_brain");
  if (gaiaSlot) {
    pushRequest({
      requestId: "council-gaia-historical-replay",
      role: gaiaSlot.role,
      councilSlotId: gaiaSlot.slotId,
      taskId: "review-historical-mistake-wave",
      input: {
        title: "Council Gaia Historical Replay Review",
        objective: `Review ${Number(historicalBacklog?.summary?.totalRows || 0)} historical mistake rows across ${Number(historicalBacklog?.summary?.replayBucketCount || 0)} replay buckets and ${Number(historicalBacklog?.summary?.replayWindowCount || 0)} replay windows for the C-only main OS bridge.`,
        taskType: "research",
        sensitivity: "internal",
        size: "medium",
        preferredWorker: chiefWorkerId,
        executeNow,
        timeoutMs,
        projectScope: "system-council",
        requiresRepoWrite: false,
        needsCloudWorker: chiefNeedsCloudWorker,
        instructions: [
          "Use Falcon/BEHCS packet logic and keep output concise.",
          "No file edits. No promotion claims. No E: writes. No boot/storage mutation. No phone mutation.",
          `Council slot: ${gaiaSlot.role}.`,
          `Assigned ARCH tasks: ${gaiaSlot.taskIds.join(", ") || "none"}.`,
          `Replay route: ${historicalBacklog?.route || "hookwall -> omni_gnn -> omnishannon -> shannon -> omniwhite-room -> gc"}.`,
          "Return mistake families, replay priority, GC-after-GNN note, and next safe bounded task."
        ].join(" "),
        allowedPaths: buildCouncilAllowedPaths(gaiaSlot.role),
        expectedArtifacts: [
          "mistake_family_summary",
          "replay_priority_note",
          "gc_after_gnn_note",
          "next_safe_bounded_task"
        ],
        opencodeModel: "gpt-5.3-codex",
        opencodeVariant: "high"
      }
    });
  }

  const sentinelSlot = (council.slots || []).find((slot) => slot.role === "sentinel_kr");
  if (sentinelSlot) {
    pushRequest({
      requestId: "council-sentinel-hold-review",
      role: sentinelSlot.role,
      councilSlotId: sentinelSlot.slotId,
      taskId: "sentinel-hold-review",
      input: {
        title: "Council Sentinel Hold Review",
        objective: "Review the current hold stack and confirm that Falcon child dispatch stays bounded to planning-safe channels only.",
        taskType: "review",
        sensitivity: "internal",
        size: "small",
        preferredWorker: chiefWorkerId,
        executeNow,
        timeoutMs,
        projectScope: "system-council",
        requiresRepoWrite: false,
        needsCloudWorker: chiefNeedsCloudWorker,
        instructions: [
          "Use Falcon hold language.",
          "No file edits. No promotion claims. No E: writes. No boot/storage mutation. No phone mutation.",
          `Council slot packet: ${sentinelSlot.packet}.`,
          "Return active holds, child dispatch restrictions, KR note, and one allowed next verification."
        ].join(" "),
        allowedPaths: buildCouncilAllowedPaths(sentinelSlot.role),
        expectedArtifacts: [
          "active_holds",
          "child_dispatch_restrictions",
          "kr_note",
          "allowed_next_verification"
        ]
      }
    });
  }

  const falconSlot = (council.slots || []).find((slot) => slot.role === "falcon_selector");
  if (falconSlot) {
    pushRequest({
      requestId: "council-falcon-packet-discipline",
      role: falconSlot.role,
      councilSlotId: falconSlot.slotId,
      taskId: "falcon-language-packet-discipline",
      input: {
        title: "Council Falcon Packet Discipline",
        objective: "Verify PKT-ORCH-001 / PKT-WORK-001 / PKT-REVIEW-001 / PKT-BOSSUP-001 / PKT-SUMMON-001 packet discipline and boss-up routing under the current C-only council.",
        taskType: "orchestration",
        sensitivity: "internal",
        size: "small",
        preferredWorker: chiefWorkerId,
        executeNow,
        timeoutMs,
        projectScope: "system-council",
        requiresRepoWrite: false,
        needsCloudWorker: chiefNeedsCloudWorker,
        instructions: [
          "Use Falcon language with tuple fallback and token-saving transport logic.",
          "No file edits. No promotion claims. No E: writes. No boot/storage mutation. No phone mutation.",
          `Council slot packet: ${falconSlot.packet}.`,
          "Return packet discipline note, boss-up route, auto-translation note, and one bounded correction if drift appears."
        ].join(" "),
        allowedPaths: buildCouncilAllowedPaths(falconSlot.role),
        expectedArtifacts: [
          "packet_discipline_note",
          "boss_up_route",
          "auto_translation_note",
          "bounded_correction_note"
        ],
        opencodeModel: "gpt-5.3-codex",
        opencodeVariant: "high"
      }
    });
  }

  const omnispindleSlot = (council.slots || []).find((slot) => slot.role === "omnispindle_flywheels");
  for (const assignedTaskId of Array.isArray(omnispindleSlot?.taskIds) ? omnispindleSlot.taskIds : []) {
    const entry = taskEntryById.get(String(assignedTaskId || ""));
    const laneId = cleanLaneId(entry?.laneId || entry?.task?.laneId);
    if (!entry || !assignedTaskId || laneId === "storage-boot") {
      continue;
    }
    pushRequest({
      requestId: `council-omnispindle-${assignedTaskId}`,
      role: omnispindleSlot.role,
      councilSlotId: omnispindleSlot.slotId,
      taskId: String(assignedTaskId || ""),
      input: {
        title: `Council Omnispindle ${assignedTaskId}`,
        objective: clipText(
          `${String(entry?.task?.action || `Advance ${laneId}`)} under the Falcon chief-to-child orchestrator council, keeping the handoff bounded and truthful.`,
          400
        ),
        taskType: "orchestration",
        sensitivity: "internal",
        size: "small",
        preferredWorker: childWorkerId,
        executeNow,
        timeoutMs,
        projectScope: "system-council",
        requiresRepoWrite: false,
        needsCloudWorker: !["opencode", "local_codex"].includes(childWorkerId),
        instructions: [
          "Stay bounded and high-signal.",
          "No file edits. No promotion claims. No E: writes. No boot/storage mutation. No phone mutation.",
          `Council slot packet: ${omnispindleSlot?.packet || ""}`,
          `Lane: ${laneId || "unknown"}.`,
          `Current executor: ${String(entry?.currentExecutor?.id || "unknown")}.`,
          `Next candidate: ${String(entry?.nextCandidateExecutor?.id || "unknown")}.`,
          "Return a bounded worker packet, next child step, risks, and stop condition."
        ].join(" "),
        allowedPaths: buildCouncilAllowedPaths(omnispindleSlot.role),
        expectedArtifacts: [
          "bounded_worker_packet",
          "next_child_step",
          "risk_note",
          "stop_condition"
        ],
        opencodeModel: "gpt-5.3-codex",
        opencodeVariant: "high"
      }
    });
  }

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    packetType: "system_council_dispatch_plan.v1",
    councilId: String(options?.council?.councilId || options?.report?.councilId || ""),
    requestedExecuteNow,
    executeNow,
    executionHold,
    maxDispatches,
    summary: {
      requestCount: Math.min(requests.length, maxDispatches),
      slotCount: Array.isArray(council?.slots) ? council.slots.length : 0,
      chiefWorkerId,
      childWorkerId,
      supportedAgentTypeCount: Array.isArray(executionFabric?.childRuntime?.supportedWorkerIds)
        ? executionFabric.childRuntime.supportedWorkerIds.length
        : 0
    },
    requests: requests.slice(0, maxDispatches)
  };
}

async function runCouncilWorkerDispatch(options = {}) {
  ensureInitialized();
  const plan = buildCouncilWorkerDispatchPlan(options);
  const dispatches = [];
  const failures = [];

  if (plan.executeNow !== true) {
    return {
      ok: true,
      held: true,
      preview: true,
      reason: plan.executionHold?.reason || "dispatch_preview_only",
      plan,
      summary: {
        requestCount: Number(plan?.summary?.requestCount || 0),
        dispatchedCount: 0,
        failedCount: 0,
        executeNow: false
      },
      dispatches,
      failures
    };
  }

  for (const request of Array.isArray(plan.requests) ? plan.requests : []) {
    try {
      const dispatch = await dispatchWorkerTask(request.input);
      dispatches.push({
        requestId: request.requestId,
        role: request.role,
        councilSlotId: request.councilSlotId,
        taskId: request.taskId,
        workerId: String(dispatch?.workerId || ""),
        dispatchId: String(dispatch?.id || ""),
        dispatchMode: String(dispatch?.result?.dispatchMode || ""),
        resultSummary: clipText(dispatch?.result?.resultSummary || "", 180),
        responsePath: clipText(dispatch?.result?.responsePath || "", 220)
      });
    } catch (error) {
      failures.push({
        requestId: request.requestId,
        role: request.role,
        councilSlotId: request.councilSlotId,
        taskId: request.taskId,
        error: clipText(error?.message || error, 220)
      });
    }
  }

  return {
    ok: dispatches.length > 0 && failures.length < (Array.isArray(plan.requests) ? plan.requests.length : 0),
    plan,
    summary: {
      requestCount: Number(plan?.summary?.requestCount || 0),
      dispatchedCount: dispatches.length,
      failedCount: failures.length,
      executeNow: plan.executeNow === true
    },
    dispatches,
    failures
  };
}

async function runSystemCouncil(options = {}) {
  ensureInitialized();
  const stamp = formatWaveStamp(new Date());
  const council = buildSystemCouncilPacket(options);
  const execution = await runSystemOrchestration(options);
  const dispatch = readBoolean(options.dispatchWorkers, false)
    ? await runCouncilWorkerDispatch({
      ...options,
      council
    })
    : null;
  const executionSummary = execution?.report?.executionSummary || execution?.executionSummary || {
    ok: execution?.ok === true
  };
  const report = {
    councilId: `deep-wave-system-council-${stamp}`,
    generatedAt: new Date().toISOString(),
    status: execution?.ok === true ? "executed_not_promoted" : "blocked",
    authority: council.authority,
    readiness: council.readiness,
    taskboard: council.taskboard,
    slots: council.slots,
    requiredSystems: council.requiredSystems,
    executionSummary,
    dispatchSummary: dispatch?.summary || null,
    dispatches: dispatch ? {
      dispatches: dispatch.dispatches,
      failures: dispatch.failures
    } : null,
    namedPackets: council.namedPackets
  };

  const reportJsonPath = path.join(REPORTS_DIR, `${report.councilId}.json`);
  const reportMdPath = path.join(REPORTS_DIR, `${report.councilId}.md`);
  const latestJsonPath = path.join(REPORTS_DIR, "deep-wave-system-council-latest.json");
  const latestMdPath = path.join(REPORTS_DIR, "deep-wave-system-council-latest.md");
  const markdown = [
    "# Deep Wave System Council",
    "",
    `- Generated: ${report.generatedAt}`,
    `- Status: ${report.status}`,
    `- Selected mode: ${String(council?.readiness?.selectedMode || "")}`,
    `- C-only execution ready: ${council?.readiness?.readiness?.cOnlyExecutionReady === true}`,
    `- Promotion ready: ${council?.readiness?.readiness?.promotionReady === true}`,
    `- Historical rows: ${Number(council?.readiness?.historicalBacklog?.summary?.totalRows || 0)}`,
    `- Launched: ${Number(executionSummary?.launchedCount || 0)}`,
    `- Deferred: ${Number(executionSummary?.deferredCount || 0)}`,
    `- Worker dispatches: ${Number(dispatch?.summary?.dispatchedCount || 0)}`,
    `- Worker dispatch failures: ${Number(dispatch?.summary?.failedCount || 0)}`,
    "",
    "## Orchestrator Slots",
    ...council.slots.map((slot) => `- slot ${slot.slotId} ${slot.role}: chief=${slot.engine.chiefProvider}/${slot.engine.chiefModelHint} child=${slot.engine.childProvider}/${slot.engine.childModelHint} fanout=${Number(slot.engine.childFanout || 0)} strategy=${slot.childStrategy} tasks=${slot.taskIds.length} reviews=${slot.reviewIds.length}`),
    ...(dispatch?.dispatches?.length
      ? [
        "",
        "## Worker Dispatches",
        ...dispatch.dispatches.map((item) => `- ${item.role}/${item.taskId}: ${item.workerId} ${item.dispatchMode} ${item.resultSummary || ""}`.trim())
      ]
      : []),
    ...(dispatch?.failures?.length
      ? [
        "",
        "## Worker Dispatch Failures",
        ...dispatch.failures.map((item) => `- ${item.role}/${item.taskId}: ${item.error}`)
      ]
      : []),
    "",
    "## Required Systems",
    ...council.requiredSystems.map((system) => `- ${system.id}: ${system.status} (${system.route})`),
    "",
    "## Blockers",
    ...(Array.isArray(council?.readiness?.readiness?.blockers) && council.readiness.readiness.blockers.length
      ? council.readiness.readiness.blockers.map((blocker) => `- ${blocker}`)
      : ["- none"])
  ].join("\n");

  writeReportJsonAtomic(reportJsonPath, report);
  writeReportTextAtomic(reportMdPath, markdown);
  writeReportJsonAtomic(latestJsonPath, report);
  writeReportTextAtomic(latestMdPath, markdown);

  return {
    ok: execution?.ok === true && (!dispatch || dispatch.ok !== false),
    council,
    execution,
    dispatch,
    report,
    paths: {
      reportJson: reportJsonPath,
      reportMd: reportMdPath,
      latestJson: latestJsonPath,
      latestMd: latestMdPath
    }
  };
}

async function runSelfBuildOrchestratorControl(options = {}) {
  const normalizedMode = clipText(options.mode || "", 40).toLowerCase();
  if (normalizedMode === "falcon_wave" || readBoolean(options.falconWave, false)) {
    return runFalconLanguageFixWave(options);
  }
  const orchestration = runSelfBuildOrchestratorPlan(options);
  const machineFeed = await runSelfBuildMachineFeed(options);
  const launchedCount = Number(orchestration?.execution?.execution?.launchedCount || 0);
  const blockedCount = Number(orchestration?.execution?.execution?.blockedCount || orchestration?.deferred?.length || 0);

  return {
    ok: orchestration.ok && machineFeed.ok,
    control: {
      simulationComplete: readBoolean(options.simulationComplete, true),
      recycleMode: normalizeRecycleMode(options.recycleMode || (readBoolean(options.recycleMistakes, false) ? "schedule" : "preview")),
      launchedCount,
      blockedCount,
      deferredCount: Array.isArray(orchestration?.deferred) ? orchestration.deferred.length : 0,
      activeLaneId: cleanLaneId(orchestration?.orchestrationPlan?.packet?.activeLane?.id),
      nextLaneId: cleanLaneId(orchestration?.orchestrationPlan?.packet?.nextQueueReadyLane?.id),
      controllerStatus: String(orchestration?.orchestrationPlan?.packet?.controllerStatus || "")
    },
    orchestration,
    machineFeed
  };
}

// ── Initialization ──

let _initialized = false;

function ensureInitialized() {
  if (_initialized) return;
  _initialized = true;
  initializeConstructions();
  loadConstructionState();
  initializeTracers();
  initializeQddIndexes();
  startWatcher();
}

// ── Construction CRUD ──

/**
 * GET /api/constructions/status — Full simulation status
 */
router.get("/status", (req, res) => {
  ensureInitialized();
  const constructions = getAllConstructions().map(c => c.toJSON());
  const spawner = getSpawnerStatus();
  const watcher = getWatcherStatus();
  const { entities, routes } = buildConstructionEntities();
  const atlas = getIxFabricAtlasStatus();
  const orchestration = getIxOrchestrationStatus();

  res.json({
    ok: true,
    at: new Date().toISOString(),
    constructions,
    spawner,
    watcher,
    atlas,
    orchestration,
    civilization: {
      entityCount: entities.length,
      routeCount: routes.length
    }
  });
});

/**
 * GET /api/constructions/atlas/status — IX fabric atlas runtime status
 */
router.get("/atlas/status", (_req, res) => {
  ensureInitialized();
  res.json({
    ok: true,
    atlas: getIxFabricAtlasStatus(),
    orchestration: getIxOrchestrationStatus()
  });
});

/**
 * GET /api/constructions/atlas/orchestration — Atlas-backed orchestration controller status
 */
router.get("/atlas/orchestration", (_req, res) => {
  ensureInitialized();
  res.json({
    ok: true,
    orchestration: getIxOrchestrationStatus()
  });
});

/**
 * GET /api/constructions/atlas/self-build — Bounded self-build controller packet
 */
router.get("/atlas/self-build", (req, res) => {
  ensureInitialized();
  res.json({
    ok: true,
    packet: getIxSelfBuildControllerPacket({
      taskLimit: Number(req.query?.taskLimit || 5)
    })
  });
});

/**
 * GET /api/constructions/atlas/self-build/tasks — Short recommended self-build task list
 */
router.get("/atlas/self-build/tasks", (req, res) => {
  ensureInitialized();
  const packet = getIxSelfBuildControllerPacket({
    taskLimit: Number(req.query?.limit || req.query?.taskLimit || 5)
  });
  res.json({
    ok: true,
    packetType: String(packet.packetType || ""),
    generatedAt: String(packet.generatedAt || ""),
    controllerStatus: String(packet.controllerStatus || ""),
    activeLane: packet.activeLane || null,
    nextQueueReadyLane: packet.nextQueueReadyLane || null,
    guardPosture: packet.guardPosture || {},
    proofBudget: packet.proofBudget || {},
    labels: packet.labels || {},
    language: packet.language || {},
    tasks: Array.isArray(packet.recommendedTasks) ? packet.recommendedTasks : []
  });
});

/**
 * GET /api/constructions/atlas/self-build/plan — Execution plan for bounded self-build tasks
 */
router.get("/atlas/self-build/plan", (req, res) => {
  ensureInitialized();
  const plan = buildSelfBuildExecutionPlan({
    taskLimit: req.query?.limit || req.query?.taskLimit,
    includeBlocked: req.query?.includeBlocked
  });
  res.json(plan);
});

/**
 * GET /api/constructions/atlas/self-build/orchestrators — Orchestrator surface inventory for self-build
 */
router.get("/atlas/self-build/orchestrators", (req, res) => {
  ensureInitialized();
  const plan = buildSelfBuildOrchestratorPlan({
    taskLimit: req.query?.limit || req.query?.taskLimit,
    includeBlocked: req.query?.includeBlocked,
    taskIds: req.query?.taskIds
  });
  res.json({
    ok: true,
    packet: plan.packet,
    constructionPlan: plan.constructionPlan,
    orchestrators: plan.orchestrators,
    summary: plan.summary
  });
});

/**
 * GET /api/constructions/atlas/self-build/orchestration-plan — Task-by-task orchestrator plan
 */
router.get("/atlas/self-build/orchestration-plan", (req, res) => {
  ensureInitialized();
  const plan = buildSelfBuildOrchestratorPlan({
    taskLimit: req.query?.limit || req.query?.taskLimit,
    includeBlocked: req.query?.includeBlocked,
    taskIds: req.query?.taskIds
  });
  res.json(plan);
});

/**
 * GET /api/constructions/atlas/self-build/taskboard — Unified orchestrator taskboard for plan/tasks/review
 */
router.get("/atlas/self-build/taskboard", (req, res) => {
  ensureInitialized();
  const packet = buildSelfBuildTaskboardPacket({
    taskLimit: req.query?.limit || req.query?.taskLimit,
    includeBlocked: req.query?.includeBlocked,
    taskIds: req.query?.taskIds,
    mistakeLimit: req.query?.mistakeLimit,
    recentMistakeLimit: req.query?.recentMistakeLimit
  });
  res.json(packet);
});

/**
 * GET /api/constructions/atlas/self-build/worker-tasks — Worker decomposition for current orchestrator plan
 */
router.get("/atlas/self-build/worker-tasks", (req, res) => {
  ensureInitialized();
  const packet = buildSelfBuildTaskboardPacket({
    taskLimit: req.query?.limit || req.query?.taskLimit,
    includeBlocked: req.query?.includeBlocked,
    taskIds: req.query?.taskIds,
    mistakeLimit: req.query?.mistakeLimit,
    recentMistakeLimit: req.query?.recentMistakeLimit
  });
  res.json({
    ok: true,
    generatedAt: packet.generatedAt,
    packetType: "self_build_worker_taskboard.v1",
    controller: {
      status: String(packet?.packet?.controllerStatus || ""),
      activeLane: packet?.packet?.activeLane || null,
      nextQueueReadyLane: packet?.packet?.nextQueueReadyLane || null,
      guardPosture: packet?.packet?.guardPosture || {},
      proofBudget: packet?.packet?.proofBudget || {}
    },
    workerTasks: packet.workerTasks
  });
});

/**
 * GET /api/constructions/atlas/self-build/review-queue — Review queue across blockers, candidates, and mistakes
 */
router.get("/atlas/self-build/review-queue", (req, res) => {
  ensureInitialized();
  const packet = buildSelfBuildTaskboardPacket({
    taskLimit: req.query?.limit || req.query?.taskLimit,
    includeBlocked: req.query?.includeBlocked,
    taskIds: req.query?.taskIds,
    mistakeLimit: req.query?.mistakeLimit,
    recentMistakeLimit: req.query?.recentMistakeLimit
  });
  res.json({
    ok: true,
    generatedAt: packet.generatedAt,
    packetType: "self_build_review_queue.v1",
    collector: packet.collector,
    mistakes: packet.mistakes,
    reviewQueue: packet.reviewQueue
  });
});

/**
 * GET /api/constructions/atlas/self-build/machine-feed — Preview machine-feed packet for gulp/processors
 */
router.get("/atlas/self-build/machine-feed", (req, res) => {
  ensureInitialized();
  const taskboard = buildSelfBuildTaskboardPacket({
    taskLimit: req.query?.limit || req.query?.taskLimit,
    includeBlocked: req.query?.includeBlocked,
    taskIds: req.query?.taskIds,
    mistakeLimit: req.query?.mistakeLimit,
    recentMistakeLimit: req.query?.recentMistakeLimit
  });
  const feed = buildSelfBuildMachineFeed({
    ...req.query,
    taskboard,
    recycleMode: req.query?.recycleMode
  });
  res.json({
    ok: true,
    taskboardSummary: taskboard.taskboard.summary,
    feed
  });
});

/**
 * POST /api/constructions/atlas/self-build/run — Run bounded self-build tasks inside constructions
 *
 * Body: { limit?, includeBlocked?, simulationComplete? }
 */
router.post("/atlas/self-build/run", (req, res) => {
  ensureInitialized();
  const result = runSelfBuildExecution(req.body || {});
  if (!result.ok) {
    return res.status(409).json(result);
  }
  res.json(result);
});

/**
 * POST /api/constructions/atlas/self-build/machine-feed — Feed orchestrator state into gulp/review processors
 *
 * Body: { limit?, taskIds?, recycleMode? } where recycleMode is preview|schedule|run
 */
router.post("/atlas/self-build/machine-feed", async (req, res) => {
  ensureInitialized();
  const result = await runSelfBuildMachineFeed(req.body || {});
  if (!result.ok) {
    return res.status(409).json(result);
  }
  res.json(result);
});

/**
 * POST /api/constructions/atlas/self-build/control — Run orchestrators and feed the machine in one bounded pass
 *
 * Body: { limit?, taskIds?, simulationComplete?, recycleMode? }
 */
router.post("/atlas/self-build/control", async (req, res) => {
  ensureInitialized();
  const result = await runSelfBuildOrchestratorControl(req.body || {});
  if (!result.ok) {
    return res.status(409).json(result);
  }
  res.json(result);
});

/**
 * POST /api/constructions/atlas/self-build/falcon-wave — Run the named Falcon-language fix wave
 *
 * Body: { limit?, taskIds?, simulationComplete?, recycleMode?, refreshWatches? }
 */
router.post("/atlas/self-build/falcon-wave", async (req, res) => {
  ensureInitialized();
  const body = {
    ...req.body,
    mode: "falcon_wave",
    refreshWatches: req.body?.refreshWatches !== false
  };
  const result = await runFalconLanguageFixWave(body);
  if (!result.ok) {
    return res.status(409).json(result);
  }
  res.json(result);
});

/**
 * GET /api/constructions/atlas/system/orchestration-plan — Choose the next bounded system tranche
 */
router.get("/atlas/system/orchestration-plan", (req, res) => {
  ensureInitialized();
  const plan = buildSystemOrchestrationPlan({
    taskLimit: req.query?.limit || req.query?.taskLimit,
    taskIds: req.query?.taskIds,
    mistakeLimit: req.query?.mistakeLimit,
    recentMistakeLimit: req.query?.recentMistakeLimit
  });
  res.json(plan);
});

/**
 * GET /api/constructions/atlas/system/readiness — Chief readiness packet across chain/guards/history
 */
router.get("/atlas/system/readiness", (req, res) => {
  ensureInitialized();
  const packet = buildSystemReadinessPacket({
    taskLimit: req.query?.limit || req.query?.taskLimit,
    taskIds: req.query?.taskIds,
    mistakeLimit: req.query?.mistakeLimit,
    recentMistakeLimit: req.query?.recentMistakeLimit
  });
  res.json(packet);
});

/**
 * GET /api/constructions/atlas/system/council — Named orchestrator council packet
 */
router.get("/atlas/system/council", (req, res) => {
  ensureInitialized();
  const packet = buildSystemCouncilPacket({
    taskLimit: req.query?.limit || req.query?.taskLimit,
    taskIds: req.query?.taskIds,
    mistakeLimit: req.query?.mistakeLimit,
    recentMistakeLimit: req.query?.recentMistakeLimit
  });
  res.json(packet);
});

/**
 * GET /api/constructions/atlas/system/falcon-language — Chief/director/council Falcon-language authority packet
 */
router.get("/atlas/system/falcon-language", (_req, res) => {
  ensureInitialized();
  const falconLanguage = getIxDeepWaveFalconLanguage();
  if (!falconLanguage.ok) {
    return res.status(404).json({
      ok: false,
      error: "falcon_language_not_found",
      path: falconLanguage.path
    });
  }
  res.json({
    ok: true,
    falconLanguage
  });
});

/**
 * GET /api/constructions/atlas/system/guide — Time-ordered Hilbert-256 guide rebound into Falcon-language planning
 */
router.get("/atlas/system/guide", (_req, res) => {
  ensureInitialized();
  const guide = getIxDeepWaveAgentGuide();
  if (!guide.ok) {
    return res.status(404).json({
      ok: false,
      error: "guide_not_found",
      path: guide.path
    });
  }
  res.json({
    ok: true,
    guide
  });
});

/**
 * GET /api/constructions/atlas/system/crosswalk — Deep-wave crosswalk surface for system ingestion
 */
router.get("/atlas/system/crosswalk", (_req, res) => {
  ensureInitialized();
  const crosswalk = getIxDeepWaveCrosswalk();
  if (!crosswalk.ok) {
    return res.status(404).json({
      ok: false,
      error: "crosswalk_not_found",
      path: crosswalk.path
    });
  }
  res.json({
    ok: true,
    crosswalk
  });
});

/**
 * GET /api/constructions/atlas/system/council/dispatch-plan — Preview worker-router dispatch requests for council slots
 */
router.get("/atlas/system/council/dispatch-plan", (req, res) => {
  ensureInitialized();
  const plan = buildCouncilWorkerDispatchPlan({
    taskLimit: req.query?.limit || req.query?.taskLimit,
    taskIds: req.query?.taskIds,
    mistakeLimit: req.query?.mistakeLimit,
    recentMistakeLimit: req.query?.recentMistakeLimit,
    executeNow: req.query?.executeNow,
    maxDispatches: req.query?.maxDispatches,
    timeoutMs: req.query?.timeoutMs
  });
  res.json(plan);
});

/**
 * POST /api/constructions/atlas/system/orchestrate — Run the next bounded system tranche
 *
 * Body: { mode?, limit?, taskIds?, simulationComplete?, recycleMode?, refreshWatches? }
 */
router.post("/atlas/system/orchestrate", async (req, res) => {
  ensureInitialized();
  const result = await runSystemOrchestration(req.body || {});
  if (!result.ok) {
    return res.status(409).json(result);
  }
  res.json(result);
});

/**
 * POST /api/constructions/atlas/system/council — Run the named orchestrator council, then the selected tranche
 *
 * Body: { mode?, limit?, taskIds?, simulationComplete?, recycleMode?, refreshWatches? }
 */
router.post("/atlas/system/council", async (req, res) => {
  ensureInitialized();
  const result = await runSystemCouncil(req.body || {});
  if (!result.ok) {
    return res.status(409).json(result);
  }
  res.json(result);
});

/**
 * POST /api/constructions/atlas/system/council/dispatch — Run bounded worker-router/OpenCode dispatches for council slots
 *
 * Body: { limit?, taskIds?, executeNow?, maxDispatches?, timeoutMs? }
 */
router.post("/atlas/system/council/dispatch", async (req, res) => {
  ensureInitialized();
  const result = await runCouncilWorkerDispatch(req.body || {});
  if (!result.ok) {
    return res.status(409).json(result);
  }
  res.json(result);
});

/**
 * POST /api/constructions/atlas/self-build/orchestration-run — Run current-safe orchestrator selections
 *
 * Body: { limit?, taskIds?, simulationComplete? }
 */
router.post("/atlas/self-build/orchestration-run", (req, res) => {
  ensureInitialized();
  const result = runSelfBuildOrchestratorPlan(req.body || {});
  if (!result.ok) {
    return res.status(409).json(result);
  }
  res.json(result);
});

/**
 * GET /api/constructions/atlas/guards — Atlas-backed guard/controller surfaces
 */
router.get("/atlas/guards", (_req, res) => {
  ensureInitialized();
  res.json({
    ok: true,
    guards: getIxControllerGuards()
  });
});

/**
 * GET /api/constructions/atlas/guards/:guardId — Specific guard surface
 */
router.get("/atlas/guards/:guardId", (req, res) => {
  ensureInitialized();
  const guardId = String(req.params?.guardId || "").trim();
  const guards = getIxControllerGuards();
  const guard = (guards.guards || []).find((entry) => String(entry?.id || "").trim().toLowerCase() === guardId.toLowerCase()) || null;
  if (!guard) {
    return res.status(404).json({
      ok: false,
      error: "guard_not_found",
      guardId,
      availableGuardIds: (guards.guards || []).map((entry) => String(entry?.id || "").trim()).filter(Boolean)
    });
  }
  res.json({
    ok: true,
    guardId,
    guard,
    summary: guards.summary,
    labels: guards.labels,
    language: guards.language
  });
});

/**
 * GET /api/constructions/atlas/surfaces — Filtered atlas surfaces
 */
router.get("/atlas/surfaces", (req, res) => {
  ensureInitialized();
  const result = queryIxAtlasSurfaces({
    groupId: req.query?.groupId,
    surfaceClass: req.query?.surfaceClass,
    search: req.query?.search,
    limit: Number(req.query?.limit || 100)
  });
  res.json({ ok: true, ...result });
});

/**
 * GET /api/constructions/atlas/external-surfaces — Connector external surfaces with lane bindings
 */
router.get("/atlas/external-surfaces", (req, res) => {
  ensureInitialized();
  const result = queryIxConnectorExternalSurfaces({
    laneId: req.query?.laneId,
    surfaceClass: req.query?.surfaceClass,
    referenceClass: req.query?.referenceClass,
    search: req.query?.search,
    limit: Number(req.query?.limit || 100)
  });
  res.json({ ok: true, ...result });
});

/**
 * GET /api/constructions/atlas/lane/:laneId — First-class lane view for operators
 */
router.get("/atlas/lane/:laneId", (req, res) => {
  ensureInitialized();
  const laneView = getLaneView(req.params?.laneId, req);
  if (!laneView.found) {
    return res.status(404).json({
      ok: false,
      error: "lane_not_found",
      laneId: laneView.laneId,
      availableLaneIds: (getIxOrchestrationStatus()?.laneSummary || []).map((lane) => lane.id)
    });
  }
  res.json(laneView);
});

/**
 * GET /api/constructions/atlas/lane/desktop-phone-mirror — Convenience alias
 */
router.get("/atlas/lane/desktop-phone-mirror", (req, res) => {
  ensureInitialized();
  const laneView = getLaneView("desktop-phone-mirror", req);
  if (!laneView.found) {
    return res.status(404).json({
      ok: false,
      error: "lane_not_found",
      laneId: "desktop-phone-mirror"
    });
  }
  res.json(laneView);
});

/**
 * GET /api/constructions/atlas/queue — Current promotion queue state
 */
router.get("/atlas/queue", (_req, res) => {
  ensureInitialized();
  res.json({
    ok: true,
    queue: getIxPromotionQueue()
  });
});

router.get("/atlas/lane/:laneId/hooks", (req, res) => {
  sendLaneHooksResponse(req, res);
});

router.get("/atlas/lane/desktop-phone-mirror/hooks", (req, res) => {
  sendLaneHooksResponse(req, res, "desktop-phone-mirror");
});

/**
 * GET /api/constructions/atlas/runtime-binding — Resolve atlas binding for a runtime path
 */
router.get("/atlas/runtime-binding", (req, res) => {
  ensureInitialized();
  const sourcePaths = String(req.query?.sourcePaths || req.query?.sourcePath || "")
    .split(",")
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  res.json({
    ok: true,
    binding: resolveIxRuntimeBinding({
      route: String(req.query?.route || "instant_agent_spawner"),
      routeStage: String(req.query?.routeStage || "status"),
      role: String(req.query?.role || ""),
      sourcePaths
    })
  });
});

/**
 * GET /api/constructions — List all constructions
 */
router.get("/", (req, res) => {
  ensureInitialized();
  res.json({
    ok: true,
    constructions: getAllConstructions().map(c => c.toJSON())
  });
});

/**
 * POST /api/constructions/register — Register a new construction
 */
router.post("/register", (req, res) => {
  ensureInitialized();
  try {
    const construction = registerConstruction(req.body);
    res.json({ ok: true, construction: construction.toJSON() });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

/**
 * DELETE /api/constructions/:id — Remove a construction
 */
router.delete("/:id", (req, res) => {
  ensureInitialized();
  const removed = removeConstruction(req.params.id);
  if (!removed) {
    return res.status(404).json({ ok: false, error: "construction_not_found" });
  }
  res.json({ ok: true, removed: req.params.id });
});

// ── Message Processing Pipeline ──

/**
 * POST /api/constructions/process — Route a message through the construction pipeline
 *
 * This is the main entry point. It:
 * 1. Uses GNN prediction or keyword routing to find the target construction
 * 2. Spawns an instant agent at that construction
 * 3. Processes the message
 * 4. Returns the result and handles energy transfer
 *
 * Body: { text, projectScope?, constructionId? }
 */
router.post("/process", (req, res) => {
  ensureInitialized();
  const { text, projectScope, constructionId } = req.body || {};

  if (!text) {
    return res.status(400).json({ ok: false, error: "text is required" });
  }

  // Step 1: Route to construction
  let construction = null;

  // Direct targeting
  if (constructionId) {
    construction = getConstruction(constructionId);
  }

  // GNN prediction
  if (!construction) {
    const prediction = predictConstruction({ text });
    if (prediction) {
      construction = getConstruction(prediction.constructionId);
    }
  }

  // Keyword fallback
  if (!construction) {
    construction = routeToConstruction({ text });
  }

  if (!construction) {
    return res.json({
      ok: false,
      error: "no_matching_construction",
      hint: "No construction matched the message. Register a construction or provide constructionId."
    });
  }

  // Step 2: Check for pre-spawned agent
  const preSpawn = popPreSpawn();

  // Step 3: Spawn instant agent and process
  const spawnResult = spawnInstantAgent(construction, { text, source: "api" });
  if (!spawnResult.ok) {
    return res.status(503).json({ ok: false, error: spawnResult.error });
  }

  // Record inbound message on the construction
  construction.recordMessage({ text, direction: "inbound", source: "api" });

  // Step 4: In simulation mode, the agent processes synchronously
  // In production, this would be async via omnispindle lane
  const agent = spawnResult.agent;

  res.json({
    ok: true,
    constructionId: construction.id,
    constructionLabel: construction.label,
    agentId: agent.id,
    agentStatus: agent.status,
    systemPrompt: agent.systemPrompt,
    profile: {
      skills: agent.profile.skills || [],
      tools: agent.profile.tools || [],
      mistakeCount: (agent.profile.mistakes || []).length,
      patternCount: (agent.profile.patterns || []).length,
      contextFiles: agent.profile.contextFiles || []
    },
    gnnPrediction: predictConstruction({ text }, construction.id),
    preSpawnUsed: Boolean(preSpawn),
    energyLevel: construction.energyLevel,
    runtimeWiring: agent.runtimeWiring,
    atlasBinding: agent.atlasBinding,
    note: "Agent spawned and processing. POST /api/constructions/complete/:agentId to finalize with response."
  });
});

/**
 * POST /api/constructions/complete/:agentId — Complete an instant agent and transfer energy
 *
 * Body: { text, learnedPatterns?, mistakesEncountered?, nextConstructionId? }
 */
router.post("/complete/:agentId", (req, res) => {
  ensureInitialized();
  const { text, learnedPatterns, mistakesEncountered, nextConstructionId } = req.body || {};

  let nextConstruction = null;
  if (nextConstructionId) {
    nextConstruction = getConstruction(nextConstructionId);
  }

  const result = completeAndTransfer(req.params.agentId, {
    text: text || "",
    learnedPatterns: learnedPatterns || [],
    mistakesEncountered: mistakesEncountered || []
  }, nextConstruction);

  if (!result.ok) {
    return res.status(404).json(result);
  }

  // Save state after completion
  saveConstructionState();

  res.json({
    ok: true,
    ...result,
    nextConstruction: nextConstruction ? nextConstruction.toJSON() : null
  });
});

// ── Spawner & Tracers ──

/**
 * GET /api/constructions/spawner/status — Instant agent spawner status
 */
router.get("/spawner/status", (req, res) => {
  ensureInitialized();
  res.json({ ok: true, ...getSpawnerStatus() });
});

/**
 * GET /api/constructions/agents — List active instant agents
 */
router.get("/agents/active", (req, res) => {
  ensureInitialized();
  res.json({
    ok: true,
    agents: getActiveAgents().map(a => a.toJSON())
  });
});

/**
 * GET /api/constructions/tracers — List tracer spindles
 */
router.get("/tracers/list", (req, res) => {
  ensureInitialized();
  res.json({
    ok: true,
    tracers: getAllTracers().map(t => t.toJSON())
  });
});

// ── GNN Watcher ──

/**
 * GET /api/constructions/watcher/status — GNN watcher diagnostics
 */
router.get("/watcher/status", (req, res) => {
  ensureInitialized();
  res.json({ ok: true, ...getWatcherStatus() });
});

/**
 * POST /api/constructions/watcher/predict — Predict best construction for a message
 */
router.post("/watcher/predict", (req, res) => {
  ensureInitialized();
  const { text, currentConstructionId } = req.body || {};
  if (!text) {
    return res.status(400).json({ ok: false, error: "text is required" });
  }

  const prediction = predictConstruction({ text }, currentConstructionId);
  const keywordMatch = routeToConstruction({ text });

  res.json({
    ok: true,
    gnnPrediction: prediction,
    keywordMatch: keywordMatch ? { constructionId: keywordMatch.id, label: keywordMatch.label } : null
  });
});

// ── Civilization Integration ──

/**
 * GET /api/constructions/civilization — Get construction entities for civilization world
 */
router.get("/civilization/entities", (req, res) => {
  ensureInitialized();
  res.json({ ok: true, ...buildConstructionEntities() });
});

/**
 * POST /api/constructions/save — Persist construction state
 */
router.post("/save", (req, res) => {
  ensureInitialized();
  const saved = saveConstructionState();
  res.json({ ok: saved });
});

// ── Tool Index ──

/**
 * GET /api/constructions/index/:constructionId — Get the numbered tool index
 */
router.get("/index/:constructionId", (req, res) => {
  ensureInitialized();
  const index = getIndex(req.params.constructionId);
  if (!index) {
    return res.status(404).json({ ok: false, error: "index_not_found" });
  }
  res.json({ ok: true, index: index.toJSON() });
});

/**
 * GET /api/constructions/index/:constructionId/load-packet — Get instant load packet
 */
router.get("/index/:constructionId/load-packet", (req, res) => {
  ensureInitialized();
  const index = getIndex(req.params.constructionId);
  if (!index) {
    return res.status(404).json({ ok: false, error: "index_not_found" });
  }
  res.json({ ok: true, ...index.buildInstantLoadPacket() });
});

/**
 * GET /api/constructions/index/:constructionId/entry/:number — Get full entry by number
 */
router.get("/index/:constructionId/entry/:number", (req, res) => {
  ensureInitialized();
  const index = getIndex(req.params.constructionId);
  if (!index) {
    return res.status(404).json({ ok: false, error: "index_not_found" });
  }
  const entry = index.getByNumber(Number(req.params.number));
  if (!entry) {
    return res.status(404).json({ ok: false, error: "entry_not_found" });
  }
  res.json({
    ok: true,
    entry: {
      ...entry.toRef(),
      fullDefinition: entry.fullDefinition,
      accessCount: entry.accessCount,
      loadedAt: entry.loadedAt
    }
  });
});

/**
 * GET /api/constructions/indexes — List all construction indexes
 */
router.get("/indexes/all", (req, res) => {
  ensureInitialized();
  res.json({
    ok: true,
    indexes: getAllIndexes().map(i => i.toJSON())
  });
});

// ── Mistake & Pattern Recording ──

/**
 * POST /api/constructions/mistakes/record — Record a mistake on a construction
 * Body: { constructionId, id, description, agentId?, context? }
 */
router.post("/mistakes/record", (req, res) => {
  ensureInitialized();
  const { constructionId, id, description, agentId, context } = req.body || {};
  if (!constructionId || !description) {
    return res.status(400).json({ ok: false, error: "constructionId and description required" });
  }

  // Add to construction profile
  const construction = getConstruction(constructionId);
  if (construction) {
    const mistakeStr = `${id || "unknown"}: ${description}`;
    if (!construction.profile.mistakes.includes(mistakeStr) && construction.profile.mistakes.length < 100) {
      construction.profile.mistakes.push(mistakeStr);
    }
  }

  // Add to numbered index
  const index = getOrCreateIndex(constructionId);
  const entry = index.recordMistake({ id, description, agentId, context });

  // Save state
  saveIndexes();
  saveConstructionState();

  res.json({
    ok: true,
    constructionId,
    entry: entry.toRef(),
    totalMistakes: index.getByType("mistake").length
  });
});

/**
 * POST /api/constructions/patterns/record — Record a pattern on a construction
 * Body: { constructionId, id, description, agentId? }
 */
router.post("/patterns/record", (req, res) => {
  ensureInitialized();
  const { constructionId, id, description, agentId } = req.body || {};
  if (!constructionId || !description) {
    return res.status(400).json({ ok: false, error: "constructionId and description required" });
  }

  const construction = getConstruction(constructionId);
  if (construction) {
    const patternStr = `${id || "unknown"}: ${description}`;
    if (!construction.profile.patterns.includes(patternStr) && construction.profile.patterns.length < 100) {
      construction.profile.patterns.push(patternStr);
    }
  }

  const index = getOrCreateIndex(constructionId);
  const entry = index.recordPattern({ id, description, agentId });

  saveIndexes();
  saveConstructionState();

  res.json({
    ok: true,
    constructionId,
    entry: entry.toRef(),
    totalPatterns: index.getByType("pattern").length
  });
});

/**
 * POST /api/constructions/indexes/save — Persist all indexes
 */
router.post("/indexes/save", (req, res) => {
  ensureInitialized();
  const saved = saveIndexes();
  res.json({ ok: saved });
});

// ── Phone Construction Workers ──

const {
  initializePhoneWorkers,
  getAllPhoneWorkers,
  findBestPhoneWorker,
  dispatchPhoneToConstruction,
  getPhoneBridgeStatus
} = require("../src/phoneConstructionBridge");

function ensurePhoneInit() {
  ensureInitialized();
  initializePhoneWorkers();
}

/**
 * GET /api/constructions/phones/status — Phone construction bridge status
 */
router.get("/phones/status", (req, res) => {
  ensurePhoneInit();
  res.json({ ok: true, ...getPhoneBridgeStatus() });
});

/**
 * GET /api/constructions/phones — List phone workers
 */
router.get("/phones/list", (req, res) => {
  ensurePhoneInit();
  res.json({ ok: true, workers: getAllPhoneWorkers().map(w => w.toJSON()) });
});

/**
 * POST /api/constructions/phones/dispatch — Dispatch phone to construction
 * Body: { phoneId, constructionId, task }
 */
router.post("/phones/dispatch", (req, res) => {
  ensurePhoneInit();
  const { phoneId, constructionId, task } = req.body || {};
  if (!phoneId || !constructionId) {
    return res.status(400).json({ ok: false, error: "phoneId and constructionId required" });
  }
  const result = dispatchPhoneToConstruction(phoneId, constructionId, task);
  res.json(result);
});

/**
 * POST /api/constructions/phones/auto-dispatch — Auto-dispatch best phone to construction
 * Body: { constructionId, task }
 */
router.post("/phones/auto-dispatch", (req, res) => {
  ensurePhoneInit();
  const { constructionId, task } = req.body || {};
  if (!constructionId) {
    return res.status(400).json({ ok: false, error: "constructionId required" });
  }
  const worker = findBestPhoneWorker(constructionId);
  if (!worker) {
    return res.json({ ok: false, error: "no_available_phone_worker" });
  }
  const result = worker.dispatchToConstruction(constructionId, task);
  res.json({ ...result, phoneLabel: worker.label });
});

// ── Wildcard ID routes (MUST be last to avoid catching named routes) ──

/**
 * GET /api/constructions/:id — Get a specific construction
 */
router.get("/:id", (req, res) => {
  ensureInitialized();
  const construction = getConstruction(req.params.id);
  if (!construction) {
    return res.status(404).json({ ok: false, error: "construction_not_found" });
  }
  res.json({ ok: true, construction: construction.toJSON() });
});

module.exports = router;
module.exports.ensureConstructionsInitialized = ensureInitialized;
module.exports.buildSelfBuildExecutionPlan = buildSelfBuildExecutionPlan;
module.exports.runSelfBuildExecution = runSelfBuildExecution;
module.exports.buildSelfBuildOrchestratorPlan = buildSelfBuildOrchestratorPlan;
module.exports.runSelfBuildOrchestratorPlan = runSelfBuildOrchestratorPlan;
module.exports.runFalconLanguageFixWave = runFalconLanguageFixWave;
module.exports.buildSystemOrchestrationPlan = buildSystemOrchestrationPlan;
module.exports.runSystemOrchestration = runSystemOrchestration;
module.exports.buildSystemReadinessPacket = buildSystemReadinessPacket;
module.exports.buildSystemCouncilPacket = buildSystemCouncilPacket;
module.exports.buildCouncilWorkerDispatchPlan = buildCouncilWorkerDispatchPlan;
module.exports.runCouncilWorkerDispatch = runCouncilWorkerDispatch;
module.exports.runSystemCouncil = runSystemCouncil;
