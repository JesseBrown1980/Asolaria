/**
 * Omnispindle — Asolaria Agent Spawner
 *
 * Manages per-lane agent processes backed by Anthropic Claude Code CLI.
 * Each lane (helm, vector, rook, forge, falcon, sentinel) gets its own spawned Claude
 * process with a role-specific system prompt. Omnispindle tracks lifecycle,
 * restarts on crash, and exposes status/control to the Asolaria runtime. Child
 * dispatch is routed through the Falcon envelope and can target any
 * worker-router-supported agent type, with OpenCode remaining the default.
 *
 * Execution modes:
 * - stateless: independent workers / child lanes, current default.
 * - coupled: Omniflywheel coupling layer enables shared field, neighbor graph,
 *   and message queue under GAC gates without renaming or removing Omnispindle.
 */

const fs = require("fs");
const { spawn } = require("child_process");
const path = require("path");
const EventEmitter = require("events");
const { runOpenCode } = require("./connectors/opencodeConnector");
const { dispatchWorkerTask } = require("./connectors/workerRouter");
const { appendHookEvent } = require("./hookEventStore");
const { buildHierarchicalChildCapsule } = require("./hg256RuntimeContract");
const { resolveIxRuntimeBinding, getIxSelfBuildControllerPacket } = require("./ixFabricAtlasStore");
const { buildResourceBudgetSnapshot } = require("../sovereignty/src/resourceBudgetSnapshot");
const { buildGnnSiliconHeartbeat } = require("../sovereignty/src/gnnSiliconHeartbeat");
const { buildAsolariaAssignableTaskBoard } = require("../sovereignty/src/asolariaAssignableTaskBoard");
const { evaluateFileCap, summarizeFileCapStatus } = require("../tools/behcs/behcs-file-cap");
const { OmniflywheelCouplingLayer } = require("./omniflywheelCoupling");
const { evaluateSupervisorPacket, summarizeSupervisorDecision } = require("./omnispindleSupervisorRunner");

const MAX_AGENTS = 6;
const MAX_CHILDREN_PER_LANE = 6;
const CHILD_HISTORY_LIMIT = 24;
const RESTART_DELAY_MS = 5000;
const HEALTH_CHECK_INTERVAL_MS = 30000;
const MAX_RESTART_ATTEMPTS = 5;
const RESTART_WINDOW_MS = 10 * 60 * 1000; // 10 min window for restart counting
const GOVERNANCE_CACHE_MS = 15000;
const WATCH_FRESH_MS = 5 * 60 * 1000;
const FILE_CAP_ASSUMED_CREATES_PER_CHILD = 1;
const SELF_BUILD_ACTIVE_LANE_EXPECTED = "memory-index-docs";
const SELF_BUILD_NEXT_LANE_EXPECTED = "desktop-phone-mirror";
const SUPPORTED_CHILD_AGENT_TYPES = new Set(["opencode", "claude_max", "local_codex", "abacus", "symphony"]);

function isOmnispindleChildExecutionEnabled() {
  return process.env.ASOLARIA_OMNISPINDLE_CHILD_EXECUTION_ENABLED === "1";
}

function buildChildSupervisorPacket(laneId, agentType, objective, input = {}) {
  return {
    id: input.supervisorPacketId || input.id || `omnispindle-${laneId}-${agentType}-${Date.now()}`,
    title: input.title || `Omnispindle ${laneId} ${agentType} child dispatch`,
    objective,
    instructions: input.instructions,
    requestedWorker: agentType,
    pid: input.pid || input.humanPid || input.householdPid,
    pidScope: input.pidScope,
    consentScope: input.consentScope,
    allowedPaths: input.allowedPaths || input.files,
    expectedArtifacts: input.expectedArtifacts,
    acceptanceGates: input.acceptanceGates || input.gates || input.tests,
    proofRequired: input.proofRequired || input.proofRef || input.proofAttached,
    operatorApproval: input.operatorApproval || input.adminApproved || input.ownerApproved,
    syntheticFirstEvidence: input.syntheticFirstEvidence || input.syntheticFirst || input.replayEvidence,
    modelCard: input.modelCard || input.modelCardReady || input.modelCardAttached,
    providerAuthMode: input.providerAuthMode || input.authMode,
    legitimateCliEvidence: input.legitimateCliEvidence || input.userAuthenticatedCli || input.existingCliSession,
    freeMethod: input.freeMethod || input.freeLocalMethod,
    remoteMutation: input.remoteMutation,
    externalApiCall: input.externalApiCall,
    cloudUpload: input.cloudUpload,
    deviceAccess: input.deviceAccess,
    liveEeg: input.liveEeg || input.liveEEG,
    liveHumanData: input.liveHumanData,
    downloads: input.downloads,
    installs: input.installs,
    writesGit: input.writesGit || input.requiresRepoWrite,
    deletesEvidence: input.deletesEvidence || input.prunesEvidence,
    sensitiveData: input.sensitiveData || input.rawHumanData || input.rawSignalData,
    secretMaterial: input.secretMaterial || input.containsSecrets,
    bypassAuth: input.bypassAuth,
    bypassPayment: input.bypassPayment,
    needsCloudWorker: input.needsCloudWorker,
    taskType: input.taskType,
    source: "src/omnispindle.js launchChildAgent"
  };
}

const LANE_DEFINITIONS = Object.freeze({
  helm: {
    name: "Helm",
    role: "Controller Admin Terminal",
    systemPrompt: [
      "You are Helm, the controller agent of the Asolaria sovereign system.",
      "You coordinate other agents (Vector, Rook, Forge, Falcon, Sentinel) and manage system-wide decisions.",
      "You have admin-level authority. Prioritize stability and owner directives.",
      "Provider: Anthropic Claude Code. Operate autonomously within your lane."
    ].join("\n")
  },
  vector: {
    name: "Vector",
    role: "Main Brain",
    systemPrompt: [
      "You are Vector, the primary brain agent of the Asolaria sovereign system.",
      "You handle complex reasoning, planning, coding, and architecture decisions.",
      "You are the default agent for owner queries that require deep thinking.",
      "Provider: Anthropic Claude Code. Execute with precision."
    ].join("\n")
  },
  rook: {
    name: "Rook",
    role: "Ops Lane",
    systemPrompt: [
      "You are Rook, the operations agent of the Asolaria sovereign system.",
      "You handle DevOps, deployments, monitoring, infrastructure, and system maintenance.",
      "Keep services healthy and respond to operational alerts.",
      "Provider: Anthropic Claude Code. Be thorough and reliable."
    ].join("\n")
  },
  forge: {
    name: "Forge",
    role: "Build Lane",
    systemPrompt: [
      "You are Forge, the build agent of the Asolaria sovereign system.",
      "You handle compilation, testing, CI/CD pipelines, and artifact production.",
      "Focus on code quality, test coverage, and build reliability.",
      "Provider: Anthropic Claude Code. Ship solid code."
    ].join("\n")
  },
  falcon: {
    name: "Falcon",
    role: "Phone Lane",
    systemPrompt: [
      "You are Falcon, the mobile/phone agent of the Asolaria sovereign system.",
      "You manage the phone edge node, ADB commands, mobile app interactions, and phone-desktop bridge.",
      "Keep the phone connection healthy and execute mobile-specific tasks.",
      "Provider: Anthropic Claude Code. Be responsive and efficient."
    ].join("\n")
  },
  sentinel: {
    name: "Sentinel",
    role: "Safety and Recovery Lane",
    systemPrompt: [
      "You are Sentinel, the safety and recovery agent of the Asolaria sovereign system.",
      "You guard white-room proof, recovery gates, storage/boot boundaries, and E-drive fail-closed posture.",
      "You review risky actions, enforce stop conditions, and keep recovery truthful rather than optimistic.",
      "Provider: Anthropic Claude Code. Be strict, explicit, and boundary-first."
    ].join("\n")
  }
});

const VALID_LANE_IDS = Object.keys(LANE_DEFINITIONS);

const DEEP_WAVE_SECOND_CASCADE_AXES = Object.freeze([
  Object.freeze({ id: "omnispindles", size: MAX_AGENTS, mode: "live_parent" }),
  Object.freeze({ id: "child_agents", size: MAX_CHILDREN_PER_LANE, mode: "live_child" }),
  Object.freeze({ id: "micro_agents", size: 6, mode: "planned_micro" }),
  Object.freeze({ id: "instant_agents", size: 6, mode: "planned_instant" }),
  Object.freeze({ id: "subcolony_lanes", size: 6, mode: "planned_remote" }),
  Object.freeze({ id: "shannon_types", size: 12, mode: "analysis_type" })
]);

const DEEP_WAVE_OVERLAYS = Object.freeze({
  omnishannonParts: 6,
  gnnCycle: 6,
  hookwall: "route_hook_fail_closed",
  dialect: "BEHCS_HG256",
  hyperlanguage: "47D"
});

function clipText(value, maxChars = 240) {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }
  if (text.length <= maxChars) {
    return text;
  }
  return `${text.slice(0, Math.max(0, maxChars - 3)).trim()}...`;
}

function normalizeChildAgentType(value) {
  const normalized = String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (!normalized) {
    return "opencode";
  }
  if (["opencode", "open_code", "open_code_cli", "gpt_5.3_codex", "codex_5.3", "codex_5_3"].includes(normalized)) {
    return "opencode";
  }
  if (["claude", "anthropic", "claude_code", "claude_max", "claude_max_x20"].includes(normalized)) {
    return "claude_max";
  }
  if (["local_codex", "codex_local", "local_codex_cli"].includes(normalized)) {
    return "local_codex";
  }
  if (["abacus", "symphony"].includes(normalized)) {
    return normalized;
  }
  return normalized;
}

function inferChildProvider(agentType) {
  const normalized = normalizeChildAgentType(agentType);
  if (normalized === "claude_max") {
    return "claude_code";
  }
  return normalized || "opencode";
}

function multiply(values = []) {
  return values.reduce((product, value) => product * Math.max(1, Number(value || 1)), 1);
}

function safeReadJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, ""));
  } catch (_error) {
    return fallback;
  }
}

function summarizeFreshness(timestamp, maxAgeMs = WATCH_FRESH_MS) {
  const epoch = new Date(timestamp || 0).getTime();
  if (!Number.isFinite(epoch) || epoch <= 0) {
    return {
      lastSeenAt: "",
      ageMs: null,
      fresh: false
    };
  }
  const ageMs = Math.max(0, Date.now() - epoch);
  return {
    lastSeenAt: new Date(epoch).toISOString(),
    ageMs,
    fresh: ageMs <= maxAgeMs
  };
}

function summarizeFileFreshness(filePath, maxAgeMs = WATCH_FRESH_MS) {
  try {
    const stat = fs.statSync(filePath);
    const freshness = summarizeFreshness(stat.mtime, maxAgeMs);
    return {
      path: filePath,
      exists: true,
      ...freshness
    };
  } catch (_error) {
    return {
      path: filePath,
      exists: false,
      lastSeenAt: "",
      ageMs: null,
      fresh: false
    };
  }
}

function inferTransportMode(device = {}) {
  const endpoints = Array.isArray(device.endpoints) ? device.endpoints : [];
  if (device.adb_serial) {
    return "usb_adb";
  }
  if (endpoints.some((endpoint) => /^browser:\/\//i.test(String(endpoint || "")))) {
    return "manual_relay";
  }
  if (endpoints.some((endpoint) => /^https?:\/\/localhost/i.test(String(endpoint || "")))) {
    return "local";
  }
  if (endpoints.some((endpoint) => /^https?:\/\/192\.168\./i.test(String(endpoint || "")))) {
    return "ethernet_lan";
  }
  if (endpoints.some((endpoint) => /^https?:\/\//i.test(String(endpoint || "")))) {
    return "network";
  }
  return "unknown";
}

function summarizeDeviceRegistry(workingDir, taskBoard = {}, heartbeat = {}) {
  const registryPath = path.join(workingDir, "data", "behcs", "device-registry.json");
  const registry = safeReadJson(registryPath, { devices: {} });
  const devices = Object.values(registry.devices || {});
  const roleTotals = {};
  const transportTotals = {};
  const aliveNames = Array.isArray(heartbeat?.gnn?.aliveNames)
    ? heartbeat.gnn.aliveNames.map((item) => String(item || "").toLowerCase())
    : [];
  const assignedDevices = new Set(
    (Array.isArray(taskBoard.assignments) ? taskBoard.assignments : [])
      .filter((assignment) => assignment && assignment.assignable && assignment.assignedDevice)
      .map((assignment) => String(assignment.assignedDevice || "").trim().toLowerCase())
  );

  const summaryDevices = devices.map((device) => {
    const role = String(device.role || "unknown").trim() || "unknown";
    const transport = inferTransportMode(device);
    roleTotals[role] = Number(roleTotals[role] || 0) + 1;
    transportTotals[transport] = Number(transportTotals[transport] || 0) + 1;
    const deviceId = String(device.id || "").trim().toLowerCase();
    return {
      id: String(device.id || "").trim(),
      role,
      transport,
      endpointCount: Array.isArray(device.endpoints) ? device.endpoints.length : 0,
      capabilities: Array.isArray(device.capabilities) ? device.capabilities.slice(0, 8) : [],
      adbSerial: device.adb_serial ? String(device.adb_serial) : "",
      assignedNow: assignedDevices.has(deviceId),
      gnnVisible: aliveNames.some((name) => name.includes(deviceId) || deviceId.includes(name))
    };
  });

  return {
    registryPath,
    totalDevices: summaryDevices.length,
    roleTotals,
    transportTotals,
    devices: summaryDevices
  };
}

function summarizeTaskManager(resourceBudget = {}, supervisorStateFreshness = {}) {
  const devices = Array.isArray(resourceBudget?.devices) ? resourceBudget.devices : [];
  const desktop = devices.find((device) => String(device.id || "").trim().toLowerCase() === "acer")
    || devices.find((device) => device.kind === "desktop" && device.taskManager);
  const taskManager = desktop?.taskManager && typeof desktop.taskManager === "object" ? desktop.taskManager : {};
  const topProcesses = Array.isArray(taskManager.topProcessRows)
    ? taskManager.topProcessRows.slice(0, 8)
    : [];
  const runtimeProcessCounts = taskManager.runtimeProcessCounts && typeof taskManager.runtimeProcessCounts === "object"
    ? taskManager.runtimeProcessCounts
    : {};
  const sampledFreshness = summarizeFreshness(taskManager.sampledAt || supervisorStateFreshness.lastSeenAt || "", WATCH_FRESH_MS);
  const managedFamilies = {
    codex: Number(runtimeProcessCounts.codex || 0),
    node: Number(runtimeProcessCounts.node || 0),
    powershell: Number(runtimeProcessCounts.powershell || 0),
    chrome: Number(runtimeProcessCounts.chrome || 0),
    adb: Number(runtimeProcessCounts.adb || 0),
    mongod: Number(runtimeProcessCounts.mongod || 0),
    python: Number(runtimeProcessCounts.python || 0),
    cloudflared: Number(runtimeProcessCounts.cloudflared || 0)
  };
  return {
    source: String(taskManager.source || "").trim() || "windows_get_process",
    coverage: String(taskManager.coverage || "none").trim() || "none",
    sampledAt: sampledFreshness.lastSeenAt || String(taskManager.sampledAt || "").trim(),
    fresh: Boolean(supervisorStateFreshness.fresh && sampledFreshness.fresh),
    topProcesses,
    runtimeProcessCounts,
    managedFamilies,
    busiestProcess: topProcesses[0] || null
  };
}

function mergeReasonCodes(...groups) {
  const merged = [];
  for (const group of groups) {
    for (const code of Array.isArray(group) ? group : []) {
      const normalized = String(code || "").trim().toLowerCase();
      if (!normalized) {
        continue;
      }
      if (!merged.includes(normalized)) {
        merged.push(normalized);
      }
      if (merged.length >= 8) {
        return merged;
      }
    }
  }
  return merged;
}

function summarizeUnifiedGuard(taskManager = {}, fileCap = null, runningParents = 0, childLimit = MAX_CHILDREN_PER_LANE) {
  const normalizedFileCap = fileCap && typeof fileCap === "object"
    ? fileCap
    : {
      policyId: "",
      status: "unknown",
      mode: "unknown",
      maxTrackedFiles: 2000,
      warnAt: 1800,
      gcTriggerMessages: 2000,
      trackedFiles: null,
      projectedFiles: null,
      plannedCreates: 0,
      remaining: null,
      labels: {},
      language: {},
      surfaces: []
    };

  const allowByFileCap = normalizedFileCap.status !== "deny";
  const remainingFiles = Number(normalizedFileCap.remaining);
  const estimatedChildLaunchesRemaining = Number.isFinite(remainingFiles)
    ? Math.max(0, Math.floor(remainingFiles / FILE_CAP_ASSUMED_CREATES_PER_CHILD))
    : null;
  const parentCount = Math.max(0, Number(runningParents || 0));
  let recommendedPerLaneLimit = Math.max(1, Number(childLimit || MAX_CHILDREN_PER_LANE));
  if (!allowByFileCap) {
    recommendedPerLaneLimit = 0;
  } else if (Number.isFinite(estimatedChildLaunchesRemaining)) {
    if (parentCount > 0) {
      recommendedPerLaneLimit = Math.max(1, Math.min(childLimit, Math.floor(estimatedChildLaunchesRemaining / parentCount)));
    } else {
      recommendedPerLaneLimit = Math.max(1, Math.min(childLimit, estimatedChildLaunchesRemaining));
    }
  }

  const reasons = [];
  if (normalizedFileCap.status === "deny") {
    reasons.push("file_cap_exceeded");
  } else if (normalizedFileCap.status === "warn") {
    reasons.push("file_cap_near_cap");
  }
  if (!taskManager.fresh) {
    reasons.push("task_manager_stale");
  }

  return {
    guardId: "taskmanager-gc-file-cap.v1",
    allowChildLaunches: allowByFileCap,
    recommendedPerLaneLimit,
    estimatedChildLaunchesRemaining,
    assumedCreatesPerChildLaunch: FILE_CAP_ASSUMED_CREATES_PER_CHILD,
    reasonCodes: mergeReasonCodes(reasons),
    taskManager: {
      source: String(taskManager.source || "windows_get_process").trim() || "windows_get_process",
      coverage: String(taskManager.coverage || "none").trim() || "none",
      sampledAt: String(taskManager.sampledAt || "").trim(),
      fresh: taskManager.fresh === true
    },
    fileCap: {
      policyId: String(normalizedFileCap.policyId || "").trim(),
      status: String(normalizedFileCap.status || "unknown").trim() || "unknown",
      mode: String(normalizedFileCap.mode || "unknown").trim() || "unknown",
      trackedFiles: Number.isFinite(Number(normalizedFileCap.trackedFiles)) ? Number(normalizedFileCap.trackedFiles) : null,
      projectedFiles: Number.isFinite(Number(normalizedFileCap.projectedFiles)) ? Number(normalizedFileCap.projectedFiles) : null,
      plannedCreates: Number.isFinite(Number(normalizedFileCap.plannedCreates)) ? Number(normalizedFileCap.plannedCreates) : 0,
      maxTrackedFiles: Number.isFinite(Number(normalizedFileCap.maxTrackedFiles)) ? Number(normalizedFileCap.maxTrackedFiles) : 2000,
      warnAt: Number.isFinite(Number(normalizedFileCap.warnAt)) ? Number(normalizedFileCap.warnAt) : 1800,
      gcTriggerMessages: Number.isFinite(Number(normalizedFileCap.gcTriggerMessages))
        ? Number(normalizedFileCap.gcTriggerMessages)
        : 2000,
      remaining: Number.isFinite(Number(normalizedFileCap.remaining)) ? Number(normalizedFileCap.remaining) : null,
      labels: normalizedFileCap.labels && typeof normalizedFileCap.labels === "object" ? normalizedFileCap.labels : {},
      language: normalizedFileCap.language && typeof normalizedFileCap.language === "object" ? normalizedFileCap.language : {},
      surfaces: Array.isArray(normalizedFileCap.surfaces) ? normalizedFileCap.surfaces.slice(0, 8) : []
    }
  };
}

function summarizeSelfBuildControllerTruth() {
  const sourceRoutes = [
    "/api/constructions/atlas/self-build",
    "/api/constructions/atlas/self-build/tasks"
  ];
  try {
    const packet = getIxSelfBuildControllerPacket({ taskLimit: 5 });
    const payload = packet && typeof packet === "object" ? packet : {};
    const packetType = String(payload.packetType || "").trim();
    const controllerStatus = String(payload.controllerStatus || "hold").trim() || "hold";
    const guardPosture = payload.guardPosture && typeof payload.guardPosture === "object"
      ? payload.guardPosture
      : {};
    const proofBudget = payload.proofBudget && typeof payload.proofBudget === "object"
      ? payload.proofBudget
      : {};
    const hasPacket = packetType === "self_build_controller_packet.v1";
    const bounded = payload.bounded === true;
    const localOnly = payload.localOnly === true;
    const noPromotionClaims = payload.noPromotionClaims === true;
    const activeLaneId = String(payload.activeLane?.id || "").trim();
    const nextQueueReadyLaneId = String(payload.nextQueueReadyLane?.id || "").trim();
    const activeLaneLooksSecondaryEvidence = /(^|[-_/])(shadow|mirror|archive)([-_/]|$)/i.test(activeLaneId);
    const secondaryTaskSignals = Array.isArray(payload.recommendedTasks)
      ? payload.recommendedTasks
        .slice(0, 8)
        .filter((task) => /(shadow|mirror|archive)/i.test(String(task?.action || "")))
        .length
      : 0;
    const focusAligned = activeLaneId === SELF_BUILD_ACTIVE_LANE_EXPECTED
      && nextQueueReadyLaneId === SELF_BUILD_NEXT_LANE_EXPECTED;
    const launchEligible = hasPacket && bounded && localOnly && noPromotionClaims && !activeLaneLooksSecondaryEvidence;
    const reasonCodes = [];
    if (!hasPacket) {
      reasonCodes.push("self_build_packet_missing");
    }
    if (!bounded) {
      reasonCodes.push("self_build_not_bounded");
    }
    if (!localOnly) {
      reasonCodes.push("self_build_not_local_only");
    }
    if (!noPromotionClaims) {
      reasonCodes.push("self_build_promotion_claims_present");
    }
    if (payload.ok !== true || payload.enabled !== true) {
      reasonCodes.push("self_build_not_ready");
    }
    if (!focusAligned) {
      reasonCodes.push("self_build_focus_shifted");
    }
    if (activeLaneLooksSecondaryEvidence) {
      reasonCodes.push("self_build_active_lane_secondary_evidence");
    }
    return {
      available: hasPacket,
      ok: payload.ok === true,
      enabled: payload.enabled === true,
      packetType,
      generatedAt: String(payload.generatedAt || "").trim(),
      controllerStatus,
      activeLane: payload.activeLane && typeof payload.activeLane === "object"
        ? {
          id: String(payload.activeLane.id || "").trim(),
          status: String(payload.activeLane.status || "").trim(),
          currentStage: String(payload.activeLane.currentStage || "").trim(),
          nextStage: String(payload.activeLane.nextStage || "").trim(),
          readiness: String(payload.activeLane.readiness || "").trim()
        }
        : null,
      nextQueueReadyLane: payload.nextQueueReadyLane && typeof payload.nextQueueReadyLane === "object"
        ? {
          id: String(payload.nextQueueReadyLane.id || "").trim(),
          status: String(payload.nextQueueReadyLane.status || "").trim(),
          currentStage: String(payload.nextQueueReadyLane.currentStage || "").trim(),
          nextStage: String(payload.nextQueueReadyLane.nextStage || "").trim(),
          readiness: String(payload.nextQueueReadyLane.readiness || "").trim()
        }
        : null,
      guardPosture: {
        gateStatus: String(guardPosture.gateStatus || "hold").trim() || "hold",
        passCount: Number(guardPosture.passCount || 0),
        warnCount: Number(guardPosture.warnCount || 0),
        holdCount: Number(guardPosture.holdCount || 0),
        denyCount: Number(guardPosture.denyCount || 0)
      },
      proofBudget: {
        status: String(proofBudget.status || "hold").trim() || "hold",
        trackedFiles: Number(proofBudget.trackedFiles || 0),
        remaining: Number(proofBudget.remaining || 0),
        maxTrackedFiles: Number(proofBudget.maxTrackedFiles || 0),
        warnAt: Number(proofBudget.warnAt || 0),
        gcTriggerMessages: Number(proofBudget.gcTriggerMessages || 0)
      },
      recommendedTasks: Array.isArray(payload.recommendedTasks)
        ? payload.recommendedTasks.slice(0, 5).map((task) => ({
          id: String(task?.id || "").trim(),
          order: Number(task?.order || 0),
          priority: Number(task?.priority || 0),
          laneId: String(task?.laneId || "").trim(),
          status: String(task?.status || "").trim(),
          action: clipText(task?.action || "", 240),
          bounded: task?.bounded === true,
          localOnly: task?.localOnly === true
        }))
        : [],
      labels: payload.labels && typeof payload.labels === "object" ? payload.labels : {},
      language: payload.language && typeof payload.language === "object" ? payload.language : {},
      bounded,
      localOnly,
      noPromotionClaims,
      focusAligned,
      surfaceEvidencePolicy: {
        liveSurfaceSource: "active_canon_only",
        secondaryEvidenceSources: ["shadow", "mirror", "archive"],
        promotionFromSecondaryAllowed: false,
        recoveryContextAllowed: true,
        activeLaneLooksSecondaryEvidence,
        secondaryTaskSignals
      },
      preferredFocus: {
        activeLaneId: SELF_BUILD_ACTIVE_LANE_EXPECTED,
        nextQueueReadyLaneId: SELF_BUILD_NEXT_LANE_EXPECTED
      },
      launchEligible,
      reasonCodes: mergeReasonCodes(reasonCodes),
      sourceRoutes
    };
  } catch (error) {
    return {
      available: false,
      ok: false,
      enabled: false,
      packetType: "",
      generatedAt: "",
      controllerStatus: "hold",
      activeLane: null,
      nextQueueReadyLane: null,
      guardPosture: {
        gateStatus: "hold",
        passCount: 0,
        warnCount: 0,
        holdCount: 1,
        denyCount: 0
      },
      proofBudget: {
        status: "hold",
        trackedFiles: 0,
        remaining: 0,
        maxTrackedFiles: 0,
        warnAt: 0,
        gcTriggerMessages: 0
      },
      recommendedTasks: [],
      labels: {},
      language: {},
      bounded: false,
      localOnly: false,
      noPromotionClaims: false,
      focusAligned: false,
      surfaceEvidencePolicy: {
        liveSurfaceSource: "active_canon_only",
        secondaryEvidenceSources: ["shadow", "mirror", "archive"],
        promotionFromSecondaryAllowed: false,
        recoveryContextAllowed: true,
        activeLaneLooksSecondaryEvidence: false,
        secondaryTaskSignals: 0
      },
      preferredFocus: {
        activeLaneId: SELF_BUILD_ACTIVE_LANE_EXPECTED,
        nextQueueReadyLaneId: SELF_BUILD_NEXT_LANE_EXPECTED
      },
      launchEligible: false,
      reasonCodes: ["self_build_packet_unavailable"],
      error: clipText(error?.message || error || "self_build_packet_unavailable", 240),
      sourceRoutes
    };
  }
}

function buildSelfBuildControllerTransport(selfBuild = null) {
  const source = selfBuild && typeof selfBuild === "object" ? selfBuild : {};
  const activeLane = String(source.activeLane?.id || "").trim();
  const nextQueueReadyLane = String(source.nextQueueReadyLane?.id || "").trim();
  const secondaryContextRefs = [];
  const seenRefs = new Set();
  const pushSecondaryRef = (kind, ref) => {
    const normalizedKind = String(kind || "").trim().toLowerCase();
    const normalizedRef = clipText(ref || "", 220);
    if (!normalizedRef) {
      return;
    }
    const safeKind = ["shadow", "mirror", "archive", "secondary"].includes(normalizedKind)
      ? normalizedKind
      : "secondary";
    const key = `${safeKind}|${normalizedRef}`;
    if (seenRefs.has(key) || secondaryContextRefs.length >= 8) {
      return;
    }
    seenRefs.add(key);
    secondaryContextRefs.push({ kind: safeKind, ref: normalizedRef });
  };

  for (const task of Array.isArray(source.recommendedTasks) ? source.recommendedTasks : []) {
    const taskId = String(task?.id || task?.laneId || task?.order || "task").trim() || "task";
    const taskSignal = `${taskId} ${task?.laneId || ""} ${task?.status || ""} ${task?.action || ""}`.toLowerCase();
    if (taskSignal.includes("shadow")) {
      pushSecondaryRef("shadow", `task:${taskId}`);
    }
    if (taskSignal.includes("mirror")) {
      pushSecondaryRef("mirror", `task:${taskId}`);
    }
    if (taskSignal.includes("archive")) {
      pushSecondaryRef("archive", `task:${taskId}`);
    }
  }

  const preferredSecondaryKinds = Array.isArray(source.surfaceEvidencePolicy?.secondaryEvidenceSources)
    ? source.surfaceEvidencePolicy.secondaryEvidenceSources
    : [];
  for (const kind of preferredSecondaryKinds) {
    pushSecondaryRef(kind, `policy:${String(kind || "").trim().toLowerCase()}`);
  }

  return {
    packetType: String(source.packetType || "self_build_controller_packet.v1").trim() || "self_build_controller_packet.v1",
    activeLane,
    nextQueueReadyLane,
    guardStatus: String(source.guardPosture?.gateStatus || source.controllerStatus || "hold").trim() || "hold",
    guardReasons: Array.isArray(source.reasonCodes) ? source.reasonCodes.slice(0, 6) : [],
    proofBudget: source.proofBudget && typeof source.proofBudget === "object"
      ? {
        trackedFiles: Number(source.proofBudget.trackedFiles || 0),
        maxTrackedFiles: Number(source.proofBudget.maxTrackedFiles || 0),
        remainingFiles: Number(source.proofBudget.remaining || 0)
      }
      : null,
    tasks: (Array.isArray(source.recommendedTasks) ? source.recommendedTasks : [])
      .slice(0, 6)
      .map((task) => clipText(`${String(task?.id || "").trim()}:${String(task?.status || "").trim()}:${String(task?.action || "").trim()}`, 140))
      .filter(Boolean),
    localOnly: source.localOnly === true,
    bounded: source.bounded === true,
    noPromotionClaims: source.noPromotionClaims === true,
    secondaryContextRefs
  };
}

function recommendedLaneLimitForPressure(pressureLevel, childLimit) {
  const normalized = String(pressureLevel || "unknown").trim().toLowerCase();
  if (normalized === "critical") {
    return 1;
  }
  if (normalized === "high") {
    return Math.max(1, Math.min(childLimit, 3));
  }
  if (normalized === "medium") {
    return Math.max(1, Math.min(childLimit, childLimit - 1));
  }
  return Math.max(1, childLimit);
}

function buildGovernanceSnapshot(workingDir, childLimit) {
  let resourceBudget = null;
  let heartbeat = null;
  let taskBoard = null;
  let error = "";

  try {
    resourceBudget = buildResourceBudgetSnapshot({ instanceRoot: workingDir, write: false });
    heartbeat = buildGnnSiliconHeartbeat({
      instanceRoot: workingDir,
      snapshot: resourceBudget,
      write: false
    });
    taskBoard = buildAsolariaAssignableTaskBoard({
      instanceRoot: workingDir,
      snapshot: resourceBudget,
      heartbeat,
      write: false
    });
  } catch (buildError) {
    error = clipText(buildError?.message || buildError || "governance_snapshot_failed", 240);
  }

  const cpuGpuWatcherLog = summarizeFileFreshness(path.join(workingDir, "logs", "cpu-gpu-watcher.ndjson"), WATCH_FRESH_MS);
  const supervisorState = summarizeFileFreshness(path.join(workingDir, "logs", "system-supervisor.state.json"), WATCH_FRESH_MS);
  const pressureLevel = String(resourceBudget?.summary?.pressureLevel || heartbeat?.silicon?.pressureLevel || "unknown");
  const pressureScore = Number(resourceBudget?.summary?.pressureScore ?? heartbeat?.silicon?.pressureScore);
  const recommendedPerLaneLimit = recommendedLaneLimitForPressure(pressureLevel, childLimit);
  const watcherCoverage = resourceBudget?.summary?.watcherCoverage || heartbeat?.silicon?.watcherCoverage || { cpu: 0, gpu: 0, device: 0 };
  const dispatchReady = resourceBudget?.summary?.dispatchReady === true || heartbeat?.routing?.taskReady === true;
  const gnnReady = heartbeat?.routing?.gnnReady === true;
  const allowHeavyTasks = heartbeat?.routing?.allowHeavyTasks === true;
  const allowEdgeTasks = heartbeat?.routing?.allowEdgeTasks === true;
  const allowPeerTasks = heartbeat?.routing?.allowPeerTasks === true;
  const deviceRegistry = summarizeDeviceRegistry(workingDir, taskBoard, heartbeat);
  const taskManager = summarizeTaskManager(resourceBudget, supervisorState);
  const selfBuild = summarizeSelfBuildControllerTruth();
  let fileCap = null;
  let fileCapError = "";
  try {
    fileCap = summarizeFileCapStatus(
      evaluateFileCap({
        rootDir: workingDir,
        reason: "omnispindle_cascade",
        plannedCreates: 0
      })
    );
  } catch (fileCapFailure) {
    fileCapError = clipText(fileCapFailure?.message || fileCapFailure || "file_cap_guard_failed", 240);
  }
  const launchReasons = [];

  if (!dispatchReady) {
    launchReasons.push("dispatch_not_ready");
  }
  if (pressureLevel === "critical") {
    launchReasons.push("pressure_critical");
  }
  if (!cpuGpuWatcherLog.fresh && watcherCoverage.cpu < 1 && watcherCoverage.gpu < 1) {
    launchReasons.push("cpu_gpu_watch_missing");
  }
  if (!taskManager.fresh && taskManager.topProcesses.length < 1) {
    launchReasons.push("task_manager_unavailable");
  }
  if (!taskManager.fresh) {
    launchReasons.push("task_manager_stale");
  }
  if (fileCap?.status === "deny") {
    launchReasons.push("file_cap_exceeded");
  } else if (fileCap?.status === "warn") {
    launchReasons.push("file_cap_near_cap");
  }
  if (fileCapError) {
    launchReasons.push("file_cap_guard_unavailable");
  }
  if (selfBuild.launchEligible !== true) {
    launchReasons.push(...(Array.isArray(selfBuild.reasonCodes) ? selfBuild.reasonCodes : ["self_build_not_ready"]));
  }

  return {
    generatedAt: new Date().toISOString(),
    error,
    resourceBudget,
    heartbeat,
    taskBoard,
    watchers: {
      coverage: watcherCoverage,
      cpuGpuWatcherLog,
      supervisorState
    },
    taskManager,
    selfBuild,
    guard: {
      fileCap,
      fileCapError
    },
    pressureLevel,
    pressureScore: Number.isFinite(pressureScore) ? pressureScore : null,
    routing: {
      dispatchReady,
      gnnReady,
      heavyLane: String(heartbeat?.routing?.heavyLane || "").trim(),
      edgeLane: String(heartbeat?.routing?.edgeLane || "").trim(),
      peerLane: String(heartbeat?.routing?.peerLane || "").trim(),
      allowHeavyTasks,
      allowEdgeTasks,
      allowPeerTasks
    },
    taskBoardSummary: taskBoard?.summary || null,
    deviceRegistry,
    launchGate: {
      allowNewChildren: dispatchReady && pressureLevel !== "critical",
      allowPeerExpansion: dispatchReady && gnnReady && allowPeerTasks,
      allowHeavyTasks,
      recommendedPerLaneLimit,
      reasons: mergeReasonCodes(launchReasons)
    }
  };
}

function normalizeToolContract(laneId, workingDir, input = {}) {
  const source = input && typeof input === "object" ? input : {};
  const commands = Array.isArray(source.commands) ? source.commands : [];
  const globs = Array.isArray(source.globs) ? source.globs : [];
  const roots = Array.isArray(source.roots) ? source.roots : [];
  const routes = Array.isArray(source.routes) ? source.routes : [];
  const notes = Array.isArray(source.notes) ? source.notes : [];

  return {
    commands: [
      "rg",
      "rg --files",
      "Select-String",
      "Get-ChildItem -Recurse",
      "Get-Content",
      "node --check",
      ...commands.map((item) => String(item || "").trim())
    ].filter(Boolean).slice(0, 12),
    globs: [
      "src/**",
      "routes/**",
      "data/behcs/**",
      "sovereignty/src/**",
      ...globs.map((item) => String(item || "").trim())
    ].filter(Boolean).slice(0, 8),
    roots: [
      String(workingDir || process.cwd()).trim(),
      ...roots.map((item) => String(item || "").trim())
    ].filter(Boolean).slice(0, 8),
    routes: [
      "/api/omnispindle/status",
      "/api/omnispindle/cascade/status",
      `/api/omnispindle/agent/${laneId}/children`,
      `/api/omnispindle/agent/${laneId}/opencode/dispatch`,
      ...routes.map((item) => String(item || "").trim())
    ].filter(Boolean).slice(0, 8),
    notes: [
      "Do not assume tools beyond this capsule contract.",
      "grep is available through rg and Select-String inside lane scope.",
      "glob is available through rg --files and Get-ChildItem -Recurse inside lane scope.",
      "Stay inside lane scope and report blockers instead of widening.",
      ...notes.map((item) => String(item || "").trim())
    ].filter(Boolean).slice(0, 8)
  };
}

function buildBossChannels(workingDir, input = {}) {
  const source = input && typeof input === "object" ? input : {};
  const scheduler = source.scheduler && typeof source.scheduler === "object" ? source.scheduler : {};
  const mailbox = source.mailbox && typeof source.mailbox === "object" ? source.mailbox : {};
  const meeting = source.meeting && typeof source.meeting === "object" ? source.meeting : {};
  return {
    scheduler: {
      kind: String(scheduler.kind || "omnischeduler").trim(),
      listRoute: String(scheduler.listRoute || "/api/integrations/calendar/list").trim(),
      upcomingRoute: String(scheduler.upcomingRoute || "/api/integrations/calendar/upcoming").trim(),
      createRoute: String(scheduler.createRoute || "/api/integrations/google/calendar/events").trim(),
      cadence: String(scheduler.cadence || "derived.omnicalendar").trim(),
      notes: [
        "Use scheduler routes to escalate boss review windows without widening scope.",
        ...(Array.isArray(scheduler.notes) ? scheduler.notes : []).map((item) => String(item || "").trim())
      ].filter(Boolean).slice(0, 6)
    },
    mailbox: {
      kind: String(mailbox.kind || "omnimailbox").trim(),
      pendingPath: String(mailbox.pendingPath || path.join(workingDir, "data", "omni-request-box", "pending.ndjson")).trim(),
      processorPath: String(mailbox.processorPath || path.join(workingDir, "tools", "omni", "omni-request-processor.js")).trim(),
      escalateTarget: String(mailbox.escalateTarget || "omni-request-box:escalate_to_jesse").trim(),
      notes: [
        "Boss approval or escalation should flow through omni-request-box, not ad hoc chat.",
        ...(Array.isArray(mailbox.notes) ? mailbox.notes : []).map((item) => String(item || "").trim())
      ].filter(Boolean).slice(0, 6)
    },
    meeting: {
      kind: String(meeting.kind || "omni_digital_google_meet").trim(),
      roomRuntime: String(meeting.roomRuntime || path.join(workingDir, "sovereignty", "ix", "grammar", "meeting-room.js")).trim(),
      roomLog: String(meeting.roomLog || path.join(workingDir, "sovereignty", "ix", "state", "meeting-room.ndjson")).trim(),
      transportRuntime: String(meeting.transportRuntime || path.join(workingDir, "sovereignty", "ix", "grammar", "meeting-transport.js")).trim(),
      algorithm: String(meeting.algorithm || "brown_hilbert_expansion").trim(),
      roomMode: String(meeting.roomMode || "infinite_rooms").trim(),
      notes: [
        "Use meeting-room runtime for multi-boss deliberation when mailbox escalation is insufficient.",
        ...(Array.isArray(meeting.notes) ? meeting.notes : []).map((item) => String(item || "").trim())
      ].filter(Boolean).slice(0, 6)
    }
  };
}

function buildChildAtlasBinding(workingDir, routeStage, agentType = "opencode") {
  const normalizedAgentType = normalizeChildAgentType(agentType);
  return resolveIxRuntimeBinding({
    route: normalizedAgentType === "opencode" ? "omnispindle_opencode_child" : "omnispindle_agent_child",
    routeStage,
    role: "omnispindle-control",
    sourcePaths: [
      path.join(workingDir, "src", "omnispindle.js"),
      path.join(workingDir, "src", "connectors", "workerRouter.js"),
      path.join(workingDir, "src", "connectors", "opencodeConnector.js"),
      path.join(workingDir, "src", "hookEventStore.js"),
      path.join(workingDir, "routes", "omnispindle.js"),
      path.join(workingDir, "routes", "integrationOps.js"),
      path.join(workingDir, "tools", "omni", "omni-request-processor.js"),
      path.join(workingDir, "sovereignty", "ix", "grammar", "meeting-room.js"),
      path.join(workingDir, "sovereignty", "ix", "grammar", "meeting-transport.js")
    ]
  });
}

function summarizeChild(child = {}) {
  return {
    childId: child.childId,
    parentLaneId: child.parentLaneId,
    childLaneId: child.childLaneId,
    childIndex: child.childIndex,
    requestedAgentType: child.requestedAgentType || "",
    agentType: child.agentType || "",
    workerId: child.workerId || "",
    provider: child.provider || "",
    status: child.status,
    createdAt: child.createdAt,
    startedAt: child.startedAt,
    completedAt: child.completedAt,
    ttlMs: child.ttlMs,
    tokenBudget: child.tokenBudget,
    writeScope: child.writeScope,
    dispatchId: child.dispatchId || "",
    dispatchMode: child.dispatchMode || "",
    model: child.model || "",
    agent: child.agent || "",
    variant: child.variant || "",
    labels: Array.isArray(child.labels) ? child.labels.slice(0, 12) : [],
    lastError: clipText(child.lastError || "", 240),
    resultSummary: clipText(child.resultSummary || "", 240),
    sealSha256: String(child.sealSha256 || "").slice(0, 64),
    scopeHash: String(child.routeHook?.scopeHash || "").slice(0, 80),
    capsuleId: String(child.routeHook?.capsuleId || ""),
    qId: String(child.routeHook?.qId || ""),
    bossChannels: child.bossChannels
      ? {
        scheduler: String(child.bossChannels.scheduler?.upcomingRoute || ""),
        mailbox: String(child.bossChannels.mailbox?.pendingPath || ""),
        meeting: String(child.bossChannels.meeting?.roomRuntime || ""),
        meetingAlgorithm: String(child.bossChannels.meeting?.algorithm || "")
      }
      : null
  };
}

function buildChildTriggerSummary(child, stage) {
  return `Omnispindle ${child.parentLaneId} child ${child.childIndex} ${child.agentType || "opencode"} ${stage}`;
}

function emitChildHookEvent(child, stage, extraPayload = {}) {
  if (!child?.routeHook) {
    return;
  }
  appendHookEvent({
    event_type: "RouteHook",
    session_id: child.childId,
    source_app: "omnispindle",
    agent_id: child.childId,
    agent_type: `${normalizeChildAgentType(child.agentType || "opencode")}_child`,
    model_name: child.model || "",
    summary: buildChildTriggerSummary(child, stage),
    trigger: `omnispindle_child_${stage}`,
    payload: {
      routeHook: child.routeHook,
      status: child.status,
      parentLaneId: child.parentLaneId,
      childLaneId: child.childLaneId,
      childIndex: child.childIndex,
      requestedAgentType: child.requestedAgentType || "",
      agentType: child.agentType || "",
      workerId: child.workerId || "",
      provider: child.provider || "",
      dispatchId: child.dispatchId || "",
      dispatchMode: child.dispatchMode || "",
      tokenBudget: child.tokenBudget,
      ttlMs: child.ttlMs,
      writeScope: child.writeScope,
      labels: child.labels,
      ...extraPayload
    }
  });
}

class OmnispindleAgent extends EventEmitter {
  constructor(laneId, options = {}) {
    super();
    const def = LANE_DEFINITIONS[laneId];
    if (!def) {
      throw new Error(`Unknown lane: ${laneId}`);
    }
    this.laneId = laneId;
    this.name = def.name;
    this.role = def.role;
    this.systemPrompt = def.systemPrompt;
    this.provider = "anthropic";
    this.executable = String(options.executable || "claude").trim();
    this.model = String(options.model || "").trim();
    this.workingDir = String(options.workingDir || process.cwd()).trim();
    this.maxBudgetUsd = Number(options.maxBudgetUsd) || 0;

    // State
    this.status = "idle"; // idle | starting | running | stopping | crashed | stopped
    this.process = null;
    this.pid = 0;
    this.startedAt = "";
    this.stoppedAt = "";
    this.lastError = "";
    this.lastOutput = "";
    this.lastOutputAt = "";
    this.promptCount = 0;
    this.restartAttempts = 0;
    this.restartWindowStart = 0;
    this.autoRestart = Boolean(options.autoRestart !== false);
    this._restartTimer = null;
  }

  toJSON() {
    return {
      laneId: this.laneId,
      name: this.name,
      role: this.role,
      provider: this.provider,
      status: this.status,
      pid: this.pid,
      startedAt: this.startedAt,
      stoppedAt: this.stoppedAt,
      lastError: this.lastError,
      lastOutput: this.lastOutput.slice(0, 500),
      lastOutputAt: this.lastOutputAt,
      promptCount: this.promptCount,
      restartAttempts: this.restartAttempts,
      autoRestart: this.autoRestart,
      model: this.model,
      executable: this.executable
    };
  }

  start() {
    if (this.status === "running" || this.status === "starting") {
      return { ok: false, error: "already_running" };
    }

    this.status = "starting";
    this.lastError = "";
    this.startedAt = new Date().toISOString();
    this.stoppedAt = "";

    try {
      const args = [
        "-p",
        "--output-format", "text",
        "--input-format", "text",
        "--permission-mode", "plan"
      ];

      if (this.model) {
        args.push("--model", this.model);
      }

      if (this.maxBudgetUsd > 0) {
        args.push("--max-budget-usd", String(this.maxBudgetUsd));
      }

      const childEnv = { ...process.env };
      // Ensure Anthropic key is used, not Codex
      delete childEnv.OPENAI_API_KEY;

      const isWindows = process.platform === "win32";
      if (isWindows && /\.cmd$/i.test(this.executable)) {
        this.process = spawn(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", this.executable, ...args], {
          windowsHide: true,
          cwd: this.workingDir,
          env: childEnv,
          stdio: ["pipe", "pipe", "pipe"]
        });
      } else {
        this.process = spawn(this.executable, args, {
          windowsHide: true,
          cwd: this.workingDir,
          env: childEnv,
          stdio: ["pipe", "pipe", "pipe"]
        });
      }

      this.pid = this.process.pid || 0;
      this.status = "running";

      // Send system prompt as first input
      if (this.process.stdin && typeof this.process.stdin.write === "function") {
        this.process.stdin.write(`${this.systemPrompt}\n`);
      }

      this.process.stdout.on("data", (chunk) => {
        const text = chunk.toString();
        this.lastOutput = text.slice(-500);
        this.lastOutputAt = new Date().toISOString();
        this.emit("output", { laneId: this.laneId, text });
      });

      this.process.stderr.on("data", (chunk) => {
        const text = chunk.toString();
        this.emit("stderr", { laneId: this.laneId, text });
      });

      this.process.on("error", (error) => {
        this.lastError = String(error.message || error).slice(0, 500);
        this.status = "crashed";
        this.stoppedAt = new Date().toISOString();
        this.pid = 0;
        this.emit("error", { laneId: this.laneId, error: this.lastError });
        this._maybeAutoRestart();
      });

      this.process.on("close", (code, signal) => {
        if (this.status === "stopping") {
          this.status = "stopped";
        } else if (code !== 0) {
          this.status = "crashed";
          this.lastError = `Exited with code ${code} signal ${signal || "none"}`;
        } else {
          this.status = "stopped";
        }
        this.stoppedAt = new Date().toISOString();
        this.pid = 0;
        this.process = null;
        this.emit("exit", { laneId: this.laneId, code, signal });
        if (this.status === "crashed") {
          this._maybeAutoRestart();
        }
      });

      this.emit("started", { laneId: this.laneId, pid: this.pid });
      return { ok: true, pid: this.pid };
    } catch (error) {
      this.status = "crashed";
      this.lastError = String(error.message || error).slice(0, 500);
      this.stoppedAt = new Date().toISOString();
      this.emit("error", { laneId: this.laneId, error: this.lastError });
      return { ok: false, error: this.lastError };
    }
  }

  stop() {
    if (this._restartTimer) {
      clearTimeout(this._restartTimer);
      this._restartTimer = null;
    }

    if (!this.process) {
      this.status = "stopped";
      return { ok: true, alreadyStopped: true };
    }

    this.status = "stopping";
    try {
      if (this.process.stdin && typeof this.process.stdin.end === "function") {
        this.process.stdin.end();
      }
      this.process.kill("SIGTERM");
      // Force kill after 5 seconds
      const forceKillTimer = setTimeout(() => {
        try {
          if (this.process) {
            this.process.kill("SIGKILL");
          }
        } catch (_e) {
          // already dead
        }
      }, 5000);
      if (forceKillTimer && typeof forceKillTimer.unref === "function") {
        forceKillTimer.unref();
      }
    } catch (error) {
      this.lastError = String(error.message || error).slice(0, 500);
    }

    return { ok: true };
  }

  sendPrompt(text) {
    if (this.status !== "running" || !this.process || !this.process.stdin) {
      return { ok: false, error: "agent_not_running" };
    }

    const cleanText = String(text || "").trim();
    if (!cleanText) {
      return { ok: false, error: "empty_prompt" };
    }

    try {
      this.process.stdin.write(`${cleanText}\n`);
      this.promptCount += 1;
      return { ok: true, promptCount: this.promptCount };
    } catch (error) {
      this.lastError = String(error.message || error).slice(0, 500);
      return { ok: false, error: this.lastError };
    }
  }

  _maybeAutoRestart() {
    if (!this.autoRestart) return;

    const now = Date.now();
    if (now - this.restartWindowStart > RESTART_WINDOW_MS) {
      this.restartAttempts = 0;
      this.restartWindowStart = now;
    }

    if (this.restartAttempts >= MAX_RESTART_ATTEMPTS) {
      this.autoRestart = false;
      this.emit("restart_exhausted", { laneId: this.laneId, attempts: this.restartAttempts });
      return;
    }

    this.restartAttempts += 1;
    const delay = RESTART_DELAY_MS * this.restartAttempts;
    this._restartTimer = setTimeout(() => {
      this._restartTimer = null;
      if (this.status === "crashed" || this.status === "stopped") {
        this.emit("restarting", { laneId: this.laneId, attempt: this.restartAttempts });
        this.start();
      }
    }, delay);

    if (this._restartTimer && typeof this._restartTimer.unref === "function") {
      this._restartTimer.unref();
    }
  }
}

class Omnispindle extends EventEmitter {
  constructor(options = {}) {
    super();
    this.agents = new Map();
    this.childAgents = new Map();
    this.executable = String(options.executable || "claude").trim();
    this.model = String(options.model || "").trim();
    this.workingDir = String(options.workingDir || process.cwd()).trim();
    this.maxBudgetUsd = Number(options.maxBudgetUsd) || 0;
    this.childAgentLimit = Number(options.childAgentLimit || MAX_CHILDREN_PER_LANE) || MAX_CHILDREN_PER_LANE;
    this.autoRestart = Boolean(options.autoRestart !== false);
    this.startedAt = "";
    this.status = "idle"; // idle | running | stopped
    this.coupling = new OmniflywheelCouplingLayer(options.coupling || {});
    this._healthTimer = null;
    this._governanceCache = {
      at: 0,
      value: null
    };
  }

  /**
   * Start all lane agents.
   */
  startAll(laneIds = null) {
    const lanes = laneIds || VALID_LANE_IDS;
    const results = {};

    for (const laneId of lanes) {
      if (!LANE_DEFINITIONS[laneId]) {
        results[laneId] = { ok: false, error: "unknown_lane" };
        continue;
      }
      if (this.agents.size >= MAX_AGENTS) {
        results[laneId] = { ok: false, error: "max_agents_reached" };
        continue;
      }
      results[laneId] = this.startAgent(laneId);
    }

    this.status = "running";
    this.startedAt = new Date().toISOString();
    this._startHealthCheck();

    return {
      ok: true,
      startedAt: this.startedAt,
      agents: results
    };
  }

  /**
   * Start a single lane agent.
   */
  startAgent(laneId) {
    if (this.agents.has(laneId)) {
      const existing = this.agents.get(laneId);
      if (existing.status === "running" || existing.status === "starting") {
        return { ok: false, error: "already_running", status: existing.status };
      }
      existing.stop();
    }

    const agent = new OmnispindleAgent(laneId, {
      executable: this.executable,
      model: this.model,
      workingDir: this.workingDir,
      maxBudgetUsd: this.maxBudgetUsd,
      autoRestart: this.autoRestart
    });

    // Relay events
    agent.on("output", (data) => this.emit("agent_output", data));
    agent.on("stderr", (data) => this.emit("agent_stderr", data));
    agent.on("error", (data) => this.emit("agent_error", data));
    agent.on("exit", (data) => this.emit("agent_exit", data));
    agent.on("started", (data) => this.emit("agent_started", data));
    agent.on("restarting", (data) => this.emit("agent_restarting", data));
    agent.on("restart_exhausted", (data) => this.emit("agent_restart_exhausted", data));

    this.agents.set(laneId, agent);
    return agent.start();
  }

  /**
   * Stop a single lane agent.
   */
  stopAgent(laneId) {
    const agent = this.agents.get(laneId);
    if (!agent) {
      return { ok: false, error: "agent_not_found" };
    }
    return agent.stop();
  }

  /**
   * Stop all agents.
   */
  stopAll() {
    const results = {};
    for (const [laneId, agent] of this.agents) {
      results[laneId] = agent.stop();
    }

    this._stopHealthCheck();
    this.status = "stopped";

    return {
      ok: true,
      stoppedAt: new Date().toISOString(),
      agents: results
    };
  }

  /**
   * Send a prompt to a specific lane agent.
   */
  sendPrompt(laneId, text) {
    const agent = this.agents.get(laneId);
    if (!agent) {
      return { ok: false, error: "agent_not_found" };
    }
    return agent.sendPrompt(text);
  }

  _laneChildren(laneId) {
    return Array.from(this.childAgents.values())
      .filter((child) => child.parentLaneId === laneId)
      .sort((left, right) => String(right.createdAt || "").localeCompare(String(left.createdAt || "")));
  }

  _activeLaneChildren(laneId) {
    return this._laneChildren(laneId)
      .filter((child) => child.status === "queued" || child.status === "running");
  }

  _pruneLaneChildren(laneId) {
    const children = this._laneChildren(laneId);
    const activeIds = new Set(
      children
        .filter((child) => child.status === "queued" || child.status === "running")
        .map((child) => child.childId)
    );
    const history = children.filter((child) => !activeIds.has(child.childId));
    if (history.length <= CHILD_HISTORY_LIMIT) {
      return;
    }
    for (const child of history.slice(CHILD_HISTORY_LIMIT)) {
      this.childAgents.delete(child.childId);
    }
  }

  getLaneChildren(laneId) {
    if (laneId && !VALID_LANE_IDS.includes(String(laneId || "").trim().toLowerCase())) {
      return [];
    }
    return this._laneChildren(String(laneId || "").trim().toLowerCase()).map((child) => summarizeChild(child));
  }

  getCouplingStatus() {
    return this.coupling.status();
  }

  configureCoupling(input = {}) {
    return this.coupling.configure(input);
  }

  writeCouplingField(workerId, key, value, meta = {}) {
    return this.coupling.write(workerId, key, value, meta);
  }

  broadcastCoupling(workerId, message, options = {}) {
    return this.coupling.broadcast(workerId, message, options);
  }

  _getGovernanceSnapshot() {
    const now = Date.now();
    if (
      this._governanceCache
      && this._governanceCache.value
      && Number.isFinite(this._governanceCache.at)
      && now - this._governanceCache.at <= GOVERNANCE_CACHE_MS
    ) {
      return this._governanceCache.value;
    }

    const value = buildGovernanceSnapshot(this.workingDir, this.childAgentLimit);
    this._governanceCache = {
      at: now,
      value
    };
    return value;
  }

  getCascadeStatus() {
    const runningParents = Array.from(this.agents.values()).filter((agent) => agent.status === "running").length;
    const activeChildren = Array.from(this.childAgents.values()).filter((child) => child.status === "queued" || child.status === "running");
    const governance = this._getGovernanceSnapshot();
    const absoluteChildCapTotal = VALID_LANE_IDS.length * this.childAgentLimit;
    const plannedVirtualPositions = multiply(DEEP_WAVE_SECOND_CASCADE_AXES.map((axis) => axis.size));
    const overlayPositions = plannedVirtualPositions
      * DEEP_WAVE_OVERLAYS.omnishannonParts
      * DEEP_WAVE_OVERLAYS.gnnCycle;
    const guard = summarizeUnifiedGuard(
      governance.taskManager,
      governance.guard?.fileCap || null,
      runningParents,
      this.childAgentLimit
    );
    const pressureRecommendedPerLaneLimit = Math.min(
      this.childAgentLimit,
      Math.max(1, Number(governance.launchGate?.recommendedPerLaneLimit || this.childAgentLimit))
    );
    const guardRecommendedPerLaneLimit = Number(guard.recommendedPerLaneLimit);
    const recommendedPerLaneLimit = Number.isFinite(guardRecommendedPerLaneLimit)
      ? Math.max(0, Math.min(pressureRecommendedPerLaneLimit, guardRecommendedPerLaneLimit))
      : pressureRecommendedPerLaneLimit;
    const recommendedActiveChildTotal = runningParents * recommendedPerLaneLimit;
    const allowNewChildrenFromPressure = governance.launchGate?.allowNewChildren === true;
    const allowNewChildrenWithGuards = allowNewChildrenFromPressure && guard.allowChildLaunches === true;
    const couplingStatus = this.getCouplingStatus();
    const selfBuild = governance.selfBuild && typeof governance.selfBuild === "object"
      ? governance.selfBuild
      : {
        available: false,
        ok: false,
        enabled: false,
        packetType: "",
        controllerStatus: "hold",
        focusAligned: false,
        surfaceEvidencePolicy: {
          liveSurfaceSource: "active_canon_only",
          secondaryEvidenceSources: ["shadow", "mirror", "archive"],
          promotionFromSecondaryAllowed: false,
          recoveryContextAllowed: true,
          activeLaneLooksSecondaryEvidence: false,
          secondaryTaskSignals: 0
        },
        preferredFocus: {
          activeLaneId: SELF_BUILD_ACTIVE_LANE_EXPECTED,
          nextQueueReadyLaneId: SELF_BUILD_NEXT_LANE_EXPECTED
        },
        launchEligible: false,
        reasonCodes: ["self_build_packet_missing"],
        bounded: false,
        localOnly: false,
        noPromotionClaims: false
      };
    const selfBuildTransport = buildSelfBuildControllerTransport(selfBuild);
    const allowNewChildrenWithSelfBuild = allowNewChildrenWithGuards && selfBuild.launchEligible === true;
    const mergedReasons = mergeReasonCodes(governance.launchGate?.reasons, guard.reasonCodes, selfBuild.reasonCodes);
    const activeByLane = {};
    for (const laneId of VALID_LANE_IDS) {
      const laneChildren = this._laneChildren(laneId);
      const laneActive = laneChildren.filter((child) => child.status === "queued" || child.status === "running");
      const parent = this.agents.get(laneId);
      activeByLane[laneId] = {
        parentRunning: parent?.status === "running",
        activeChildren: laneActive.length,
        recentChildren: laneChildren.length,
        absoluteLimit: this.childAgentLimit,
        recommendedLimit: recommendedPerLaneLimit,
        remainingRecommendedSlots: Math.max(0, recommendedPerLaneLimit - laneActive.length)
      };
    }

    return {
      topologyId: "deep-wave-second-cascade.v1",
      dialect: DEEP_WAVE_OVERLAYS.dialect,
      hyperlanguage: DEEP_WAVE_OVERLAYS.hyperlanguage,
      hookwall: DEEP_WAVE_OVERLAYS.hookwall,
      axes: DEEP_WAVE_SECOND_CASCADE_AXES,
      overlays: DEEP_WAVE_OVERLAYS,
      labels: [
        "deep-wave-second-cascade",
        "omnishannon",
        "gnn",
        "hookwall",
        "hg256"
      ],
      capacity: {
        plannedVirtualPositions,
        overlayPositions,
        liveParentCap: MAX_AGENTS,
        liveChildCapTotal: absoluteChildCapTotal,
        liveProcessCapTotal: MAX_AGENTS + absoluteChildCapTotal,
        activeParents: runningParents,
        activeChildren: activeChildren.length,
        remainingAbsoluteChildSlots: Math.max(0, absoluteChildCapTotal - activeChildren.length)
      },
      liveFrontier: {
        allowNewChildren: allowNewChildrenFromPressure,
        allowNewChildrenWithGuards,
        allowNewChildrenWithSelfBuild,
        allowPeerExpansion: governance.launchGate?.allowPeerExpansion === true,
        allowHeavyTasks: governance.launchGate?.allowHeavyTasks === true,
        recommendedPerLaneLimit,
        recommendedActiveChildTotal,
        remainingRecommendedChildSlots: Math.max(0, recommendedActiveChildTotal - activeChildren.length),
        reasons: mergedReasons,
        guardReasons: guard.reasonCodes,
        selfBuildReasons: Array.isArray(selfBuild.reasonCodes) ? selfBuild.reasonCodes : []
      },
      pressure: {
        level: governance.pressureLevel,
        score: governance.pressureScore
      },
      guard: {
        ...guard,
        fileCapError: governance.guard?.fileCapError || ""
      },
      coupling: couplingStatus,
      routing: governance.routing,
      watchers: governance.watchers,
      taskManager: governance.taskManager,
      selfBuild,
      selfBuildTransport,
      taskBoard: governance.taskBoardSummary,
      subcolonies: governance.deviceRegistry,
      generatedAt: governance.generatedAt || new Date().toISOString(),
      lanes: activeByLane,
      errors: governance.error ? [governance.error] : []
    };
  }

  _buildChildCapsule(laneId, childIndex, input = {}, routeStage = "dispatch") {
    const objective = clipText(input.objective || input.prompt || input.text || input.goal, 4000);
    const instructions = clipText(input.instructions || "", 4000);
    const agentType = normalizeChildAgentType(input.workerId || input.agentType || input.provider || "opencode");
    const toolContract = normalizeToolContract(laneId, this.workingDir, input.toolContract || {});
    const bossChannels = buildBossChannels(this.workingDir, input.bossChannels || {});
    const atlasBinding = buildChildAtlasBinding(this.workingDir, routeStage, agentType);
    const governance = this._getGovernanceSnapshot();
    const selfBuildController = buildSelfBuildControllerTransport(governance.selfBuild);
    return buildHierarchicalChildCapsule({
      parentLaneId: laneId,
      childIndex,
      childLaneId: input.childLaneId,
      tokenBudget: Number(input.tokenBudget || 1200),
      ttlMs: Number(input.ttlMs || 90000),
      writeScope: String(input.writeScope || "lane_bounded"),
      labels: Array.isArray(input.labels)
        ? input.labels
        : ["behcs", "omnispindle", agentType || "opencode", laneId, "deep-wave", "omnishannon", "gnn", "hookwall"],
      objective,
      instructions,
      toolContract,
      bossChannels,
      selfBuildController,
      atlasBinding,
      role: "omnispindle-control",
      routeStage,
      owner: "jesse",
      agentPid: process.pid,
      devicePid: "jesse-desktop",
      proofRef: "reports/crypto/capsule.verify.json",
      verifyStatus: "pass_local_only"
    });
  }

  launchChildAgent(laneId, input = {}) {
    const normalizedLaneId = String(laneId || "").trim().toLowerCase();
    if (!VALID_LANE_IDS.includes(normalizedLaneId)) {
      return { ok: false, error: "unknown_lane" };
    }

    const parent = this.agents.get(normalizedLaneId);
    if (!parent || parent.status !== "running") {
      return { ok: false, error: "parent_lane_not_running" };
    }

    const cascadeStatus = this.getCascadeStatus();
    const effectiveLaneChildLimit = Math.min(
      this.childAgentLimit,
      Math.max(1, Number(cascadeStatus.liveFrontier?.recommendedPerLaneLimit || this.childAgentLimit))
    );
    const activeChildTotal = Number(cascadeStatus.capacity?.activeChildren || 0);
    const recommendedActiveChildTotal = Number(cascadeStatus.liveFrontier?.recommendedActiveChildTotal || 0);
    if (cascadeStatus.liveFrontier?.allowNewChildren !== true) {
      return {
        ok: false,
        error: "resource_launch_gate_blocked",
        pressureLevel: cascadeStatus.routing?.pressureLevel || cascadeStatus.taskBoard?.status || "",
        reasons: cascadeStatus.liveFrontier?.reasons || []
      };
    }
    if (cascadeStatus.liveFrontier?.allowNewChildrenWithGuards !== true) {
      return {
        ok: false,
        error: "unified_guard_launch_gate_blocked",
        guardStatus: cascadeStatus.guard?.fileCap?.status || "unknown",
        reasons: cascadeStatus.guard?.reasonCodes || cascadeStatus.liveFrontier?.guardReasons || []
      };
    }
    if (cascadeStatus.liveFrontier?.allowNewChildrenWithSelfBuild !== true) {
      return {
        ok: false,
        error: "self_build_launch_gate_blocked",
        packetType: cascadeStatus.selfBuild?.packetType || "",
        controllerStatus: cascadeStatus.selfBuild?.controllerStatus || "hold",
        reasons: cascadeStatus.selfBuild?.reasonCodes || cascadeStatus.liveFrontier?.selfBuildReasons || []
      };
    }
    if (recommendedActiveChildTotal > 0 && activeChildTotal >= recommendedActiveChildTotal) {
      return {
        ok: false,
        error: "recommended_child_frontier_reached",
        recommendedActiveChildTotal,
        activeChildTotal,
        reasons: cascadeStatus.liveFrontier?.reasons || []
      };
    }

    const activeChildren = this._activeLaneChildren(normalizedLaneId);
    if (activeChildren.length >= effectiveLaneChildLimit) {
      return {
        ok: false,
        error: "recommended_lane_child_frontier_reached",
        childLimit: effectiveLaneChildLimit,
        absoluteChildLimit: this.childAgentLimit,
        reasons: cascadeStatus.liveFrontier?.reasons || []
      };
    }

    const objective = clipText(input.objective || input.prompt || input.text || input.goal, 4000);
    if (!objective) {
      return { ok: false, error: "objective_required" };
    }
    const requestedAgentType = String(input.workerId || input.agentType || input.provider || "").trim();
    const agentType = normalizeChildAgentType(requestedAgentType || "opencode");
    if (!SUPPORTED_CHILD_AGENT_TYPES.has(agentType)) {
      return {
        ok: false,
        error: "unsupported_agent_type",
        requestedAgentType: requestedAgentType || agentType,
        supportedAgentTypes: Array.from(SUPPORTED_CHILD_AGENT_TYPES)
      };
    }

    const supervisorDecision = evaluateSupervisorPacket(
      buildChildSupervisorPacket(normalizedLaneId, agentType, objective, input),
      {
        root: this.workingDir,
        sourceRoot: path.resolve(__dirname, "..")
      }
    );
    if (supervisorDecision.decision !== "ALLOW") {
      return {
        ok: false,
        error: supervisorDecision.decision === "BLOCK"
          ? "omnispindle_supervisor_blocked"
          : "omnispindle_supervisor_needs_evidence",
        supervisorDecision: summarizeSupervisorDecision(supervisorDecision)
      };
    }

    const usedSlots = new Set(activeChildren.map((child) => Number(child.childIndex || 0)));
    let childIndex = 1;
    while (usedSlots.has(childIndex) && childIndex <= this.childAgentLimit) {
      childIndex += 1;
    }
    if (childIndex > this.childAgentLimit) {
      return { ok: false, error: "no_child_slot_available", childLimit: this.childAgentLimit };
    }

    const launchInput = {
      ...input,
      agentType
    };
    const capsule = this._buildChildCapsule(normalizedLaneId, childIndex, launchInput, "dispatch");
    const childId = `omnispindle-${normalizedLaneId}-${agentType}-${childIndex}-${Date.now()}`;
    const childState = {
      childId,
      parentLaneId: normalizedLaneId,
      childLaneId: capsule.childLaneId,
      childIndex,
      requestedAgentType: requestedAgentType || agentType,
      agentType,
      workerId: agentType,
      provider: inferChildProvider(agentType),
      status: "queued",
      createdAt: new Date().toISOString(),
      startedAt: "",
      completedAt: "",
      ttlMs: capsule.ttlMs,
      tokenBudget: capsule.tokenBudget,
      writeScope: capsule.writeScope,
      dispatchId: "",
      dispatchMode: agentType === "opencode" ? "direct_child" : "worker_router_child",
      model: String(input.model || "").trim(),
      agent: String(input.agent || "").trim(),
      variant: String(input.variant || "").trim(),
      labels: capsule.labels,
      routeHook: capsule.routeHook,
      sealSha256: capsule.sealSha256,
      objective,
      instructions: clipText(input.instructions || "", 4000),
      toolContract: capsule.toolContract,
      bossChannels: capsule.bossChannels,
      supervisorDecision: summarizeSupervisorDecision(supervisorDecision),
      files: Array.isArray(input.files) ? input.files.slice(0, 12) : [],
      resultSummary: "",
      lastError: ""
    };

    this.childAgents.set(childId, childState);
    emitChildHookEvent(childState, "queued", {
      language: capsule.language,
      toolContract: capsule.toolContract,
      bossChannels: capsule.bossChannels,
      agentType: childState.agentType,
      workerId: childState.workerId
    });
    this.emit("child_queued", {
      laneId: normalizedLaneId,
      childId,
      childIndex,
      agentType: childState.agentType
    });

    if (!isOmnispindleChildExecutionEnabled()) {
      childState.resultSummary = "Child execution gate is closed; capsule remains queued for manual or deferred dispatch.";
      childState.dispatchMode = "queued_child";
      return {
        ok: true,
        laneId: normalizedLaneId,
        childId,
        childIndex,
        childLimit: this.childAgentLimit,
        executionGate: "closed",
        supervisorDecision: childState.supervisorDecision,
        child: summarizeChild(childState)
      };
    }

    void (async () => {
      childState.status = "running";
      childState.startedAt = new Date().toISOString();
      childState.routeHook = this._buildChildCapsule(normalizedLaneId, childIndex, launchInput, "start").routeHook;
      emitChildHookEvent(childState, "started", {
        language: capsule.language,
        agentType: childState.agentType,
        workerId: childState.workerId
      });
      this.emit("child_started", {
        laneId: normalizedLaneId,
        childId,
        childIndex,
        agentType: childState.agentType
      });

      try {
        if (agentType === "opencode") {
          const run = await runOpenCode({
            prompt: capsule.launchPrompt,
            model: childState.model,
            agent: childState.agent,
            variant: childState.variant,
            files: childState.files,
            dir: this.workingDir,
            timeoutMs: childState.ttlMs
          });

          childState.status = "completed";
          childState.completedAt = new Date().toISOString();
          childState.routeHook = this._buildChildCapsule(normalizedLaneId, childIndex, launchInput, "complete").routeHook;
          childState.workerId = "opencode";
          childState.provider = inferChildProvider("opencode");
          childState.dispatchMode = "direct_child";
          childState.resultSummary = clipText(run.reply || "OpenCode child completed.", 240);
          if (run.model) {
            childState.model = String(run.model || "").trim();
          }
          emitChildHookEvent(childState, "completed", {
            reply: clipText(run.reply || "", 320),
            workerId: childState.workerId,
            agentType: childState.agentType
          });
        } else {
          const dispatch = await dispatchWorkerTask({
            title: String(input.title || `Omnispindle ${normalizedLaneId} child ${childIndex}`),
            objective,
            taskType: String(input.taskType || "orchestration"),
            sensitivity: String(input.sensitivity || "internal"),
            size: String(input.size || "small"),
            preferredWorker: agentType,
            executeNow: true,
            timeoutMs: childState.ttlMs,
            projectScope: String(input.projectScope || "omnispindle"),
            requiresRepoWrite: input.requiresRepoWrite === true,
            needsCloudWorker: input.needsCloudWorker === true || !["opencode", "local_codex"].includes(agentType),
            instructions: [
              String(input.instructions || "").trim(),
              "Use the Falcon-language dispatch envelope passed through omnispindle.",
              `Parent lane: ${normalizedLaneId}.`,
              `Child slot: ${childIndex}.`,
              `Requested agent type: ${agentType}.`
            ].filter(Boolean).join(" "),
            allowedPaths: Array.isArray(input.allowedPaths) ? input.allowedPaths.slice(0, 16) : [],
            expectedArtifacts: Array.isArray(input.expectedArtifacts) ? input.expectedArtifacts.slice(0, 12) : [],
            model: childState.model,
            agent: childState.agent,
            variant: childState.variant,
            opencodeModel: childState.model,
            opencodeAgent: childState.agent,
            opencodeVariant: childState.variant
          });

          childState.status = "completed";
          childState.completedAt = new Date().toISOString();
          childState.routeHook = this._buildChildCapsule(normalizedLaneId, childIndex, launchInput, "complete").routeHook;
          childState.workerId = String(dispatch?.workerId || agentType).trim() || agentType;
          childState.provider = inferChildProvider(childState.workerId);
          childState.dispatchId = String(dispatch?.id || "").trim();
          childState.dispatchMode = String(dispatch?.result?.dispatchMode || "worker_router_child").trim();
          childState.resultSummary = clipText(
            dispatch?.result?.resultSummary || dispatch?.result?.reply || `Worker ${childState.workerId} completed.`,
            240
          );
          if (dispatch?.result?.model) {
            childState.model = String(dispatch.result.model || "").trim();
          }
          emitChildHookEvent(childState, "completed", {
            reply: clipText(dispatch?.result?.reply || dispatch?.result?.resultSummary || "", 320),
            workerId: childState.workerId,
            dispatchId: childState.dispatchId,
            dispatchMode: childState.dispatchMode,
            agentType: childState.agentType
          });
        }

        this.emit("child_completed", {
          laneId: normalizedLaneId,
          childId,
          childIndex,
          agentType: childState.agentType,
          workerId: childState.workerId
        });
      } catch (error) {
        childState.status = "failed";
        childState.completedAt = new Date().toISOString();
        childState.routeHook = this._buildChildCapsule(normalizedLaneId, childIndex, launchInput, "failed").routeHook;
        childState.lastError = clipText(error?.message || error || `${agentType}_child_failed`, 260);
        emitChildHookEvent(childState, "failed", {
          error: childState.lastError,
          workerId: childState.workerId,
          agentType: childState.agentType
        });
        this.emit("child_failed", {
          laneId: normalizedLaneId,
          childId,
          childIndex,
          agentType: childState.agentType,
          error: childState.lastError
        });
      } finally {
        this._pruneLaneChildren(normalizedLaneId);
      }
    })();

    return {
      ok: true,
      laneId: normalizedLaneId,
      childId,
      childIndex,
      childLimit: this.childAgentLimit,
      supervisorDecision: childState.supervisorDecision,
      child: summarizeChild(childState)
    };
  }

  launchOpenCodeChild(laneId, input = {}) {
    return this.launchChildAgent(laneId, {
      ...input,
      agentType: "opencode"
    });
  }

  /**
   * Broadcast a prompt to all running agents.
   */
  broadcast(text) {
    const results = {};
    for (const [laneId, agent] of this.agents) {
      if (agent.status === "running") {
        results[laneId] = agent.sendPrompt(text);
      }
    }
    return { ok: true, results };
  }

  /**
   * Get status summary.
   */
  getStatus() {
    const agents = {};
    for (const [laneId, agent] of this.agents) {
      agents[laneId] = agent.toJSON();
    }

    const running = Array.from(this.agents.values()).filter((a) => a.status === "running").length;
    const total = this.agents.size;
    const cascade = this.getCascadeStatus();
    const children = {};
    for (const laneId of VALID_LANE_IDS) {
      const laneChildren = this._laneChildren(laneId);
      children[laneId] = {
        total: laneChildren.length,
        active: laneChildren.filter((child) => child.status === "queued" || child.status === "running").length,
        limit: this.childAgentLimit,
        recommendedLimit: Number.isFinite(Number(cascade.lanes?.[laneId]?.recommendedLimit))
          ? Number(cascade.lanes[laneId].recommendedLimit)
          : this.childAgentLimit,
        recent: laneChildren.slice(0, 6).map((child) => summarizeChild(child))
      };
    }

    return {
      status: this.status,
      startedAt: this.startedAt,
      provider: "anthropic",
      executable: this.executable,
      model: this.model,
      autoRestart: this.autoRestart,
      counts: {
        total,
        running,
        idle: total - running,
        lanes: VALID_LANE_IDS.length
      },
      childCounts: {
        total: this.childAgents.size,
        active: Array.from(this.childAgents.values()).filter((child) => child.status === "queued" || child.status === "running").length,
        perLaneLimit: this.childAgentLimit,
        recommendedPerLaneLimit: Number.isFinite(Number(cascade.liveFrontier?.recommendedPerLaneLimit))
          ? Number(cascade.liveFrontier.recommendedPerLaneLimit)
          : this.childAgentLimit,
        recommendedActiveTotal: cascade.liveFrontier?.recommendedActiveChildTotal || 0
      },
      executionLattice: {
        omniflywheel: "orchestration_governance_routing_drift",
        omnispindle: "parallel_execution_lattice",
        mode: cascade.coupling?.mode || "stateless",
        coupling: cascade.coupling || this.getCouplingStatus()
      },
      cascade,
      children,
      agents
    };
  }

  _startHealthCheck() {
    this._stopHealthCheck();
    this._healthTimer = setInterval(() => {
      for (const [laneId, agent] of this.agents) {
        if (agent.status === "running" && agent.process && agent.process.exitCode !== null) {
          agent.status = "crashed";
          agent.lastError = `Process exited unexpectedly (exitCode=${agent.process.exitCode})`;
          agent.stoppedAt = new Date().toISOString();
          agent.pid = 0;
          agent.process = null;
          agent._maybeAutoRestart();
        }
      }
      this.emit("health_check", this.getStatus());
    }, HEALTH_CHECK_INTERVAL_MS);

    if (this._healthTimer && typeof this._healthTimer.unref === "function") {
      this._healthTimer.unref();
    }
  }

  _stopHealthCheck() {
    if (this._healthTimer) {
      clearInterval(this._healthTimer);
      this._healthTimer = null;
    }
  }
}

// Singleton instance
let _instance = null;

function getOmnispindle(options = {}) {
  if (!_instance) {
    _instance = new Omnispindle(options);
  }
  return _instance;
}

function resetOmnispindle() {
  if (_instance) {
    _instance.stopAll();
    _instance = null;
  }
}

module.exports = {
  Omnispindle,
  OmnispindleAgent,
  OmniflywheelCouplingLayer,
  getOmnispindle,
  resetOmnispindle,
  LANE_DEFINITIONS,
  VALID_LANE_IDS,
  MAX_AGENTS,
  MAX_CHILDREN_PER_LANE,
  DEEP_WAVE_SECOND_CASCADE_AXES,
  DEEP_WAVE_OVERLAYS
};
