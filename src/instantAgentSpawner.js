/**
 * Instant Agent Spawner — Dynamic Construction-Aware Agent Pipeline
 *
 * Extends the Omnispindle concept beyond fixed lanes. Instead of 5 permanent
 * agents, this spawner creates ephemeral "instant agents" at simulation
 * constructions. Each instant agent:
 *
 * 1. Loads the construction's indexed profile (skills, tools, mistakes, patterns)
 * 2. Receives a message to process
 * 3. Sends the response back to the omnispindle in real-time
 * 4. Transfers its energy (learned state) to the next construction
 * 5. Despawns, freeing resources
 *
 * The GNN watchers guide which construction receives the next agent.
 * Internal tracer spindles record conversation flow for profile enrichment.
 */

const EventEmitter = require("events");
const { appendGraphEvent } = require("./graphRuntimeStore");
const { appendHookEvent } = require("./hookEventStore");
const {
  createSharedContext,
  spawnWithCache,
  getCacheStatus
} = require("./agentCacheSharing");
const { buildSpawnContext } = require("./spawnContextBuilder");
const {
  buildRouteHookEnvelope
} = require("./hg256RuntimeContract");
const {
  resolveIxRuntimeBinding,
  getIxFabricAtlasStatus,
  getIxSelfBuildControllerPacket
} = require("./ixFabricAtlasStore");

const MAX_INSTANT_AGENTS = 8;
const AGENT_TTL_MS = 120000; // 2 minutes max per instant agent
const COOLDOWN_MS = 2000;
const SELF_BUILD_CONTEXT_VERSION = "instant_agent_self_build.v1";
const SELF_BUILD_CACHE_MS = 5000;

const spawnerEmitter = new EventEmitter();
spawnerEmitter.setMaxListeners(32);

const KNOWN_ROLE_HINTS = Object.freeze([
  "helm",
  "sentinel",
  "vector",
  "falcon",
  "rook",
  "forge",
  "watchdog",
  "omnispindle-control",
  "omnispindle-bridge",
  "omnispindle-scout"
]);

let _selfBuildContextCache = {
  at: 0,
  value: null
};

// ── PID Registry ──
// Maps agentId → { pid, deviceBinding, ixRef, spawnedAt }
const _pidRegistry = new Map();

// Universal PID bridge (IX-321 / LX-249)
let _universalPid = null;
function getUniversalPid() {
  if (_universalPid === null) {
    try {
      const scb = require("./spawnContextBuilder");
      _universalPid = { register: scb.registerSpawnPid, despawn: scb.despawnPid, generate: scb.generateVirtualPid };
    } catch (_) { _universalPid = false; }
  }
  return _universalPid || null;
}

/**
 * Register a PID for a spawned agent.
 */
function normalizePid(value, fallback = process.pid) {
  const pid = Number(value);
  return Number.isInteger(pid) && pid > 0 ? pid : fallback;
}

function registerPid(agentId, info = {}) {
  _pidRegistry.set(agentId, {
    pid: normalizePid(info.pid),
    deviceBinding: info.deviceBinding || "jesse-desktop",
    ixRef: info.ixRef || "—",
    spawnedAt: new Date().toISOString()
  });
  spawnerEmitter.emit("pid_registered", { agentId, ..._pidRegistry.get(agentId) });
  // Bridge to universal PID registry
  const upid = getUniversalPid();
  if (upid) {
    try {
      const virtualPid = upid.generate(agentId);
      upid.register(agentId, virtualPid);
    } catch (_) { /* non-fatal */ }
  }
}

/**
 * Clear a PID when agent despawns.
 */
function clearPid(agentId) {
  const entry = _pidRegistry.get(agentId);
  if (entry) {
    _pidRegistry.delete(agentId);
    spawnerEmitter.emit("pid_cleared", { agentId, ...entry });
    // Bridge to universal PID registry
    const upid = getUniversalPid();
    if (upid) {
      try { upid.despawn(agentId); } catch (_) { /* non-fatal */ }
    }
  }
}

/**
 * Get all registered PIDs.
 */
function getPidRegistry() {
  return Object.fromEntries(_pidRegistry);
}

function normalizeRoleHint(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function deriveSpawnRole(construction, spawnResult, options = {}) {
  const directCandidates = [
    options.roleHint,
    options.role,
    spawnResult?.profile?.role,
    construction?.profile?.role,
    construction?.id,
    construction?.label
  ];

  for (const candidate of directCandidates) {
    const normalized = normalizeRoleHint(candidate);
    if (KNOWN_ROLE_HINTS.includes(normalized)) {
      return normalized;
    }
  }

  for (const candidate of directCandidates) {
    const normalized = normalizeRoleHint(candidate);
    if (!normalized) continue;
    const fuzzyMatch = KNOWN_ROLE_HINTS.find((role) => normalized.includes(role));
    if (fuzzyMatch) {
      return fuzzyMatch;
    }
  }

  return null;
}

function buildCacheSessionId(constructionId, role) {
  const normalizedConstructionId = String(constructionId || "unknown")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._:-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "unknown";

  return `instant-spawn:${normalizedConstructionId}:${role || "general"}`;
}

function cloneJsonSafe(value) {
  if (!value || typeof value !== "object") return value || null;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (_) {
    return null;
  }
}

function summarizeSelfBuildContext(selfBuildContext) {
  const context = selfBuildContext && typeof selfBuildContext === "object"
    ? selfBuildContext
    : {};
  const controller = context.controller && typeof context.controller === "object"
    ? context.controller
    : {};
  const proofBudget = controller.proofBudget && typeof controller.proofBudget === "object"
    ? controller.proofBudget
    : {};
  const secondaryEvidence = context.secondaryEvidence && typeof context.secondaryEvidence === "object"
    ? context.secondaryEvidence
    : {};
  return {
    version: String(context.version || SELF_BUILD_CONTEXT_VERSION),
    source: String(context.source || "ix_self_build_controller_packet"),
    capturedAt: context.capturedAt || null,
    mode: String(context.mode || "live"),
    packetType: String(controller.packetType || "self_build_controller_packet.v1"),
    controllerStatus: String(context.packet?.controllerStatus || "unknown"),
    activeLaneId: String(controller.activeLane || ""),
    nextLaneId: String(controller.nextQueueReadyLane || ""),
    guardGateStatus: String(controller.guardStatus || "unknown"),
    localOnly: controller.localOnly !== false,
    bounded: controller.bounded !== false,
    noPromotionClaims: controller.noPromotionClaims !== false,
    trackedFiles: Number(proofBudget.trackedFiles || 0),
    maxTrackedFiles: Number(proofBudget.maxTrackedFiles || 0),
    remainingFiles: Number(proofBudget.remainingFiles || proofBudget.remaining || 0),
    secondaryEvidenceCount: Number(secondaryEvidence.count || 0)
  };
}

function normalizeSelfBuildTask(task) {
  if (!task || typeof task !== "object") return null;
  const id = String(task.id || "").trim();
  const laneId = String(task.laneId || "").trim();
  const status = String(task.status || "").trim();
  const action = String(task.action || "").trim();
  if (!id && !laneId && !action) return null;
  return {
    id,
    laneId,
    status,
    action,
    priority: Number(task.priority || 0),
    bounded: task.bounded !== false,
    localOnly: task.localOnly !== false,
    launchable: task.launchable !== false
  };
}

function summarizeSelfBuildTask(task) {
  return normalizeSelfBuildTask(task);
}

function buildSecondaryEvidenceFromAtlas(atlasStatus = {}) {
  const summary = atlasStatus?.summary && typeof atlasStatus.summary === "object"
    ? atlasStatus.summary
    : {};
  const secondaryContextRefs = [];
  const shadowRefs = [];
  const mirrorRefs = [];
  const archiveRefs = [];
  const archiveEntryCount = Number(summary.archiveEntryCount || 0);
  const totalEntries = Number(summary.totalEntries || 0);
  const combinedReachableEntryCount = Number(summary.combinedReachableEntryCount || 0);
  const atlasId = String(atlasStatus?.atlasId || "ix-fabric-atlas");
  const nonLiveEntryCount = Math.max(0, combinedReachableEntryCount - totalEntries);
  if (nonLiveEntryCount > 0) {
    const shadowRef = `${atlasId}:shadow_candidate_non_promoted_entries=${nonLiveEntryCount}`;
    const mirrorRef = `${atlasId}:mirror_candidate_non_promoted_entries=${nonLiveEntryCount}`;
    shadowRefs.push(shadowRef);
    mirrorRefs.push(mirrorRef);
    secondaryContextRefs.push({ kind: "shadow", ref: shadowRef });
    secondaryContextRefs.push({ kind: "mirror", ref: mirrorRef });
  }
  if (archiveEntryCount > 0) {
    const archiveRef = `${atlasId}:archive_entries=${archiveEntryCount}`;
    archiveRefs.push(archiveRef);
    secondaryContextRefs.push({
      kind: "archive",
      ref: archiveRef
    });
  }
  return {
    count: secondaryContextRefs.length,
    refs: secondaryContextRefs.slice(0, 8),
    shadowRefs: shadowRefs.slice(0, 4),
    mirrorRefs: mirrorRefs.slice(0, 4),
    archiveRefs: archiveRefs.slice(0, 4),
    promotionState: "non_promoted"
  };
}

function buildSelfBuildContext() {
  const capturedAt = new Date().toISOString();
  try {
    const packet = getIxSelfBuildControllerPacket({
      taskLimit: 5
    });
    const atlasStatus = getIxFabricAtlasStatus();
    const activeLaneId = String(packet?.activeLane?.id || "");
    const nextLaneId = String(packet?.nextQueueReadyLane?.id || "");
    const proofBudget = packet?.proofBudget && typeof packet.proofBudget === "object"
      ? {
        trackedFiles: Number(packet.proofBudget.trackedFiles || 0),
        maxTrackedFiles: Number(packet.proofBudget.maxTrackedFiles || 0),
        remainingFiles: Number(packet.proofBudget.remaining || 0),
        warnAt: Number(packet.proofBudget.warnAt || 0),
        gcTriggerMessages: Number(packet.proofBudget.gcTriggerMessages || 0)
      }
      : null;
    const taskList = Array.isArray(packet?.recommendedTasks)
      ? packet.recommendedTasks.map((task) => String(task?.id || task?.action || "").slice(0, 140)).filter(Boolean).slice(0, 6)
      : [];
    const secondaryEvidence = buildSecondaryEvidenceFromAtlas(atlasStatus);
    return {
      version: SELF_BUILD_CONTEXT_VERSION,
      source: "ix_self_build_controller_packet",
      capturedAt,
      mode: "live",
      controller: {
        packetType: String(packet?.packetType || "self_build_controller_packet.v1"),
        activeLane: activeLaneId,
        nextQueueReadyLane: nextLaneId,
        guardStatus: String(packet?.guardPosture?.gateStatus || "unknown"),
        guardReasons: [],
        proofBudget,
        localOnly: packet?.localOnly !== false,
        bounded: packet?.bounded !== false,
        noPromotionClaims: packet?.noPromotionClaims !== false,
        tasks: taskList,
        secondaryContextRefs: secondaryEvidence.refs,
        shadowRefs: secondaryEvidence.shadowRefs,
        mirrorRefs: secondaryEvidence.mirrorRefs,
        archiveRefs: secondaryEvidence.archiveRefs
      },
      packet: cloneJsonSafe(packet),
      secondaryEvidence
    };
  } catch (error) {
    return {
      version: SELF_BUILD_CONTEXT_VERSION,
      source: "ix_self_build_controller_packet",
      capturedAt,
      mode: "fallback",
      error: String(error?.message || error || "self_build_context_unavailable"),
      controller: {
        packetType: "self_build_controller_packet.v1",
        activeLane: "",
        nextQueueReadyLane: "",
        guardStatus: "unknown",
        guardReasons: [],
        proofBudget: null,
        localOnly: true,
        bounded: true,
        noPromotionClaims: true,
        tasks: [],
        secondaryContextRefs: []
      },
      packet: null,
      secondaryEvidence: {
        count: 0,
        refs: [],
        promotionState: "non_promoted"
      }
    };
  }
}

function getSelfBuildContext(options = {}) {
  const maxAgeMs = Number(options.maxAgeMs || SELF_BUILD_CACHE_MS);
  const now = Date.now();
  if (!options.force && _selfBuildContextCache.value && (now - _selfBuildContextCache.at) <= maxAgeMs) {
    return cloneJsonSafe(_selfBuildContextCache.value);
  }
  const context = buildSelfBuildContext();
  _selfBuildContextCache = {
    at: now,
    value: context
  };
  return cloneJsonSafe(context);
}

function buildTraceContextMessages(spawnResult) {
  const traces = Array.isArray(spawnResult?.recentTrace) ? spawnResult.recentTrace : [];
  return traces.slice(-10)
    .map((trace, index) => {
      const content = String(trace?.text || trace?.summary || "").slice(0, 1000);
      if (!content) return null;
      return {
        id: `trace-${spawnResult?.constructionId || "construction"}-${index}`,
        type: "message",
        role: trace?.direction === "outbound" ? "assistant" : "user",
        content,
        at: trace?.at || null
      };
    })
    .filter(Boolean);
}

function buildSpawnCachePacket(construction, spawnResult, agent, message, options = {}) {
  if (options.enableSpawnCache === false) {
    return {
      enabled: false,
      ok: false,
      cacheInfo: {
        hit: false,
        state: "disabled",
        applicability: "simulation_path"
      }
    };
  }

  const role = deriveSpawnRole(construction, spawnResult, options);
  let spawnContext = null;
  let ixEntries = [];

  if (role) {
    const packet = buildSpawnContext(role, {
      includeBody: false,
      mission: String(options.mission || message?.text || "").slice(0, 2000),
      registerPid: false
    });
    if (packet && packet.ok !== false) {
      spawnContext = packet;
      ixEntries = Array.isArray(packet?.integral?.ixEntries) ? packet.integral.ixEntries : [];
    }
  }

  const sharedContext = createSharedContext({
    sessionId: buildCacheSessionId(construction?.id, role),
    systemPrompt: agent.systemPrompt,
    contextMessages: buildTraceContextMessages(spawnResult),
    model: options.model || process.env.ASOLARIA_CACHE_MODEL || "instant-agent-sim",
    tools: Array.isArray(agent.profile?.tools) ? agent.profile.tools : [],
    spawnContext,
    ixEntries
  });

  if (!sharedContext.ok) {
    return {
      enabled: true,
      ok: false,
      role,
      sharedContext,
      cacheInfo: {
        hit: false,
        state: "snapshot_failed",
        applicability: "simulation_path",
        error: sharedContext.error || "snapshot_failed"
      }
    };
  }

  const spawnPacketResult = spawnWithCache({
    role: role || options.role || construction?.id || "instant-agent",
    mission: options.mission || String(message?.text || "").slice(0, 2000) || null,
    directive: String(options.directive || message?.text || "Execute the spawned task.").slice(0, 2000),
    inheritTools: true,
    profile: spawnContext || agent.profile || null,
    maxTurns: options.maxTurns || 5
  }, sharedContext);

  if (!spawnPacketResult.ok) {
    return {
      enabled: true,
      ok: false,
      role,
      sharedContext,
      cacheInfo: {
        hit: false,
        state: "spawn_packet_failed",
        applicability: "simulation_path",
        error: spawnPacketResult.error || "spawn_packet_failed",
        suggestion: spawnPacketResult.suggestion || null
      }
    };
  }

  return {
    enabled: true,
    ok: true,
    role,
    sharedContext,
    spawnPacket: spawnPacketResult.spawnPacket,
    cacheInfo: {
      ...spawnPacketResult.spawnPacket.cacheInfo,
      state: sharedContext.reused ? "snapshot_reused" : "snapshot_created",
      applicability: "simulation_path",
      sessionId: sharedContext.cacheId,
      fingerprint: sharedContext.fingerprint
    }
  };
}

function getAgentDeviceBinding(agentId) {
  const registry = getPidRegistry();
  return registry?.[agentId]?.deviceBinding || "jesse-desktop";
}

function buildAgentAtlasBinding(agent, routeStage, overrides = {}) {
  return resolveIxRuntimeBinding({
    route: "instant_agent_spawner",
    routeStage,
    role: overrides.role || agent.cachedSpawnPacket?.role || agent.profile?.role || "",
    sourcePaths: overrides.sourcePaths || [
      "src/instantAgentSpawner.js",
      "src/hg256RuntimeContract.js",
      "src/hookEventStore.js",
      "routes/constructions.js"
    ]
  });
}

function buildAgentRuntimeWiring(agent, routeStage, overrides = {}) {
  const cacheSafe = agent.cachedSpawnPacket?.cacheSafe || {};
  const packetSource = overrides.packetSource || agent.cachedSpawnPacket || {
    agentId: agent.id,
    constructionId: agent.constructionId,
    role: cacheSafe.role || agent.profile?.role || "instant-agent"
  };
  const selfBuildContext = overrides.selfBuildContext || agent.selfBuildContext || getSelfBuildContext();
  const selfBuildTask = summarizeSelfBuildTask(overrides.selfBuildTask || agent.selfBuildTask);
  const selfBuildController = selfBuildContext?.controller && typeof selfBuildContext.controller === "object"
    ? selfBuildContext.controller
    : null;
  let payloadSource = overrides.payloadSource;
  if (!payloadSource) {
    if (routeStage === "complete") {
      payloadSource = agent.outputMessage || {};
    } else if (routeStage === "process") {
      payloadSource = agent.inputMessage || {};
    } else {
      payloadSource = agent.cachedSpawnPacket?.messages || {};
    }
  }
  const packetSourceWithSelfBuild = {
    ...packetSource,
    selfBuildController,
    selfBuildContext: summarizeSelfBuildContext(selfBuildContext),
    selfBuildTask
  };
  const payloadSourceWithSelfBuild = {
    ...payloadSource,
    selfBuildController,
    selfBuildContext: summarizeSelfBuildContext(selfBuildContext),
    selfBuildTask
  };
  const atlasBinding = overrides.atlasBinding || buildAgentAtlasBinding(agent, routeStage, overrides);

  return buildRouteHookEnvelope({
    qId: overrides.qId || "Q4_TRANSPORT_ENVELOPE",
    route: "instant_agent_spawner",
    routeStage,
    owner: "jesse",
    agentId: agent.id,
    role: overrides.role || agent.cachedSpawnPacket?.role || agent.profile?.role || "instant-agent",
    constructionId: agent.constructionId,
    agentPid: process.pid,
    devicePid: getAgentDeviceBinding(agent.id),
    fingerprint: agent.sharedContext?.fingerprint || agent.cacheInfo?.fingerprint || cacheSafe.fingerprint || "",
    packetSource: packetSourceWithSelfBuild,
    payloadSource: payloadSourceWithSelfBuild,
    atlasBinding,
    selfBuildController,
    proofRef: "reports/crypto/capsule.verify.json",
    verifyStatus: overrides.verifyStatus || "pass_local_only"
  });
}

function emitSpawnerHookEvent(agent, trigger, summary, routeHook, extraPayload = {}) {
  if (!agent || !routeHook) return;
  appendHookEvent({
    event_type: "RouteHook",
    session_id: agent.id,
    source_app: "instant-agent-spawner",
    agent_id: agent.id,
    agent_type: "instant_agent",
    model_name: agent.sharedContext?.model || agent.cachedSpawnPacket?.cacheSafe?.model || "",
    summary,
    trigger,
    payload: {
      routeHook,
      status: agent.status,
      constructionId: agent.constructionId,
      atlasBinding: agent.atlasBinding,
      cacheInfo: {
        hit: Boolean(agent.cacheInfo?.hit),
        state: agent.cacheInfo?.state || "unknown",
        sharedPrefixBytes: agent.cacheInfo?.sharedPrefixBytes || 0
      },
      selfBuildController: cloneJsonSafe(agent.selfBuildContext?.controller || null),
      selfBuildContext: summarizeSelfBuildContext(agent.selfBuildContext),
      selfBuildTask: summarizeSelfBuildTask(agent.selfBuildTask),
      ...extraPayload
    }
  });
}

// ── Instant Agent ──

let _agentCounter = 0;

class InstantAgent {
  constructor(constructionId, profile, options = {}) {
    _agentCounter += 1;
    this.id = `instant-${constructionId}-${_agentCounter}`;
    this.constructionId = constructionId;
    this.status = "loading"; // loading | ready | processing | completed | despawning
    this.createdAt = new Date().toISOString();
    this.completedAt = "";
    this.profile = profile || {};
    this.systemPrompt = this._buildSystemPrompt();
    this.inputMessage = null;
    this.outputMessage = null;
    this.learnedPatterns = [];
    this.mistakesEncountered = [];
    this.processingTimeMs = 0;
    this.cacheInfo = {
      hit: false,
      state: "uninitialized",
      applicability: "simulation_path"
    };
    this.atlasBinding = null;
    this.cachedSpawnPacket = null;
    this.sharedContext = null;
    this.runtimeWiring = null;
    this.selfBuildContext = getSelfBuildContext();
    this.selfBuildTask = null;
    this._ttlTimer = null;

    // Start TTL countdown
    this._ttlTimer = setTimeout(() => {
      if (this.status !== "completed" && this.status !== "despawning") {
        this.status = "completed";
        this.completedAt = new Date().toISOString();
        spawnerEmitter.emit("agent_timeout", { agentId: this.id, constructionId });
      }
    }, options.ttlMs || AGENT_TTL_MS);

    if (this._ttlTimer && typeof this._ttlTimer.unref === "function") {
      this._ttlTimer.unref();
    }
  }

  _buildSystemPrompt() {
    const parts = [
      `You are an instant agent spawned at construction [${this.constructionId}].`,
      `You are an ephemeral expert — load the following profile and respond with precision.`,
      ""
    ];

    if (this.profile.systemPromptSuffix) {
      parts.push(this.profile.systemPromptSuffix);
      parts.push("");
    }

    if (this.profile.skills && this.profile.skills.length > 0) {
      parts.push(`Available skills: ${this.profile.skills.join(", ")}`);
    }

    if (this.profile.tools && this.profile.tools.length > 0) {
      parts.push(`Available tools: ${this.profile.tools.join(", ")}`);
    }

    if (this.profile.mistakes && this.profile.mistakes.length > 0) {
      parts.push("");
      parts.push("MISTAKES TO AVOID:");
      for (const mistake of this.profile.mistakes.slice(0, 10)) {
        parts.push(`- ${mistake}`);
      }
    }

    if (this.profile.patterns && this.profile.patterns.length > 0) {
      parts.push("");
      parts.push("KNOWN PATTERNS:");
      for (const pattern of this.profile.patterns.slice(0, 10)) {
        parts.push(`- ${pattern}`);
      }
    }

    if (this.profile.recentTrace && this.profile.recentTrace.length > 0) {
      parts.push("");
      parts.push("RECENT CONVERSATION CONTEXT:");
      for (const trace of this.profile.recentTrace.slice(-5)) {
        parts.push(`[${trace.direction}] ${trace.text}`);
      }
    }

    return parts.join("\n");
  }

  /**
   * Process an inbound message. In a full implementation, this would
   * pipe to a Claude CLI process. For the simulation layer, it records
   * the message flow and emits events for the omnispindle watchers.
   */
  processMessage(message) {
    const startTime = Date.now();
    this.inputMessage = {
      text: String(message.text || "").slice(0, 2000),
      at: new Date().toISOString(),
      source: message.source || "omnispindle",
      selfBuildTask: summarizeSelfBuildTask(this.selfBuildTask)
    };
    this.status = "processing";
    this.selfBuildContext = getSelfBuildContext();
    this.runtimeWiring = buildAgentRuntimeWiring(this, "process", {
      qId: "Q4_TRANSPORT_ENVELOPE",
      payloadSource: this.inputMessage,
      selfBuildContext: this.selfBuildContext,
      selfBuildTask: this.selfBuildTask
    });
    this.atlasBinding = this.runtimeWiring?.atlas || this.atlasBinding;

    spawnerEmitter.emit("agent_processing", {
      agentId: this.id,
      constructionId: this.constructionId,
      message: this.inputMessage,
      runtimeWiring: this.runtimeWiring
    });
    emitSpawnerHookEvent(this, "process", "HG256 process envelope appended.", this.runtimeWiring, {
      phase: "process"
    });

    // Emit graph event for the GNN
    appendGraphEvent({
      component: "instant-agent-spawner",
      category: "construction_processing",
      action: "instant_agent_process",
      actor: { type: "instant_agent", id: this.id, label: this.id, domain: "simulation" },
      subject: { type: "construction", id: this.constructionId, label: this.constructionId },
      target: { type: "message", id: `msg-${Date.now()}`, domain: "simulation" },
      context: {
        constructionId: this.constructionId,
        skillCount: String(this.profile.skills?.length || 0),
        toolCount: String(this.profile.tools?.length || 0),
        messageLength: String(this.inputMessage.text.length)
      }
    });

    this.processingTimeMs = Date.now() - startTime;
    return this;
  }

  /**
   * Complete processing with a response.
   */
  complete(response) {
    this.outputMessage = {
      text: String(response.text || "").slice(0, 4000),
      at: new Date().toISOString(),
      learnedPatterns: response.learnedPatterns || [],
      mistakesEncountered: response.mistakesEncountered || []
    };
    this.learnedPatterns = this.outputMessage.learnedPatterns;
    this.mistakesEncountered = this.outputMessage.mistakesEncountered;
    this.status = "completed";
    this.completedAt = this.outputMessage.at;
    this.selfBuildContext = getSelfBuildContext();

    if (this._ttlTimer) {
      clearTimeout(this._ttlTimer);
      this._ttlTimer = null;
    }

    this.runtimeWiring = buildAgentRuntimeWiring(this, "complete", {
      qId: "Q5_WHITE_ROOM_GC_CONSUME",
      payloadSource: this.outputMessage,
      selfBuildContext: this.selfBuildContext,
      selfBuildTask: this.selfBuildTask
    });
    this.atlasBinding = this.runtimeWiring?.atlas || this.atlasBinding;
    spawnerEmitter.emit("agent_completed", {
      agentId: this.id,
      constructionId: this.constructionId,
      output: this.outputMessage,
      processingTimeMs: this.processingTimeMs,
      runtimeWiring: this.runtimeWiring
    });
    emitSpawnerHookEvent(this, "complete", "HG256 completion envelope appended.", this.runtimeWiring, {
      phase: "complete"
    });

    // Emit graph event
    appendGraphEvent({
      component: "instant-agent-spawner",
      category: "construction_processing",
      action: "instant_agent_complete",
      actor: { type: "instant_agent", id: this.id, label: this.id, domain: "simulation" },
      subject: { type: "construction", id: this.constructionId },
      context: {
        constructionId: this.constructionId,
        processingTimeMs: String(this.processingTimeMs),
        learnedPatterns: String(this.learnedPatterns.length),
        mistakesEncountered: String(this.mistakesEncountered.length)
      }
    });

    return this.outputMessage;
  }

  /**
   * Get the energy transfer packet for this agent.
   */
  getTransferPacket() {
    return {
      fromAgent: this.id,
      fromConstruction: this.constructionId,
      lastOutput: this.outputMessage?.text || "",
      learnedPatterns: this.learnedPatterns,
      mistakesEncountered: this.mistakesEncountered,
      completionStatus: this.status,
      processingTimeMs: this.processingTimeMs,
      runtimeWiring: this.runtimeWiring,
      selfBuildTask: summarizeSelfBuildTask(this.selfBuildTask)
    };
  }

  toJSON() {
    return {
      id: this.id,
      constructionId: this.constructionId,
      status: this.status,
      createdAt: this.createdAt,
      completedAt: this.completedAt,
      processingTimeMs: this.processingTimeMs,
      cacheHit: Boolean(this.cacheInfo?.hit),
      cacheState: this.cacheInfo?.state || "unknown",
      sharedPrefixBytes: this.cacheInfo?.sharedPrefixBytes || 0,
      runtimeTrancheId: this.runtimeWiring?.trancheId || "",
      runtimeScopeHash: this.runtimeWiring?.scopeHash || "",
      packetSha256: this.runtimeWiring?.packetSha256 || "",
      payloadSha256: this.runtimeWiring?.payloadSha256 || "",
      atlasLaneId: this.atlasBinding?.laneId || "",
      atlasLaneStatus: this.atlasBinding?.laneStatus || "",
      atlasLaneCurrentStage: this.atlasBinding?.laneCurrentStage || "",
      atlasSurfaceCount: Array.isArray(this.atlasBinding?.matchingSurfaceIds) ? this.atlasBinding.matchingSurfaceIds.length : 0,
      denyFlags: this.runtimeWiring?.denyFlags || [],
      hasInput: Boolean(this.inputMessage),
      hasOutput: Boolean(this.outputMessage),
      learnedPatterns: this.learnedPatterns.length,
      mistakesEncountered: this.mistakesEncountered.length,
      profileSkills: this.profile.skills?.length || 0,
      profileTools: this.profile.tools?.length || 0,
      selfBuildController: cloneJsonSafe(this.selfBuildContext?.controller || null),
      selfBuild: summarizeSelfBuildContext(this.selfBuildContext),
      selfBuildTask: summarizeSelfBuildTask(this.selfBuildTask)
    };
  }
}

// ── Internal Tracer Spindle ──

/**
 * A tracer spindle is a lightweight always-on watcher that observes
 * message flow through constructions and feeds the GNN. Unlike instant
 * agents, tracers don't process — they record.
 */
class TracerSpindle {
  constructor(id, options = {}) {
    this.id = `tracer:${id}`;
    this.label = String(options.label || `Tracer ${id}`).trim();
    this.status = "watching"; // watching | paused | stopped
    this.watchedConstructions = new Set(options.watchedConstructions || []);
    this.observations = [];
    this.maxObservations = options.maxObservations || 200;
    this.createdAt = new Date().toISOString();
    this.observationCount = 0;

    // Routing intelligence — accumulated by watching message patterns
    this.routingHints = new Map(); // constructionId → { hitCount, lastPattern, suggestedNext }
  }

  /**
   * Observe a message flowing through a construction.
   */
  observe(event) {
    if (this.status !== "watching") return null;

    const constructionId = event.constructionId || "unknown";
    if (this.watchedConstructions.size > 0 && !this.watchedConstructions.has(constructionId)) {
      return null; // Not watching this construction
    }

    const observation = {
      at: new Date().toISOString(),
      constructionId,
      agentId: event.agentId || null,
      eventType: event.type || "message", // message | spawn | despawn | error | pattern
      direction: event.direction || "observed",
      summary: String(event.summary || "").slice(0, 300),
      patterns: Array.isArray(event.patterns) ? event.patterns.slice(0, 5) : [],
      riskScore: Number(event.riskScore || 0)
    };

    this.observations.push(observation);
    if (this.observations.length > this.maxObservations) {
      this.observations = this.observations.slice(-this.maxObservations);
    }
    this.observationCount += 1;

    // Update routing hints
    const hint = this.routingHints.get(constructionId) || { hitCount: 0, lastPattern: "", suggestedNext: null };
    hint.hitCount += 1;
    if (observation.patterns.length > 0) {
      hint.lastPattern = observation.patterns[0];
    }
    this.routingHints.set(constructionId, hint);

    // Emit for GNN consumption
    spawnerEmitter.emit("tracer_observation", {
      tracerId: this.id,
      observation
    });

    return observation;
  }

  /**
   * Get routing suggestion based on accumulated observations.
   */
  suggestNextConstruction(currentConstructionId) {
    const hint = this.routingHints.get(currentConstructionId);
    if (!hint || !hint.suggestedNext) return null;
    return {
      constructionId: hint.suggestedNext,
      confidence: Math.min(1, hint.hitCount / 20),
      tracerId: this.id,
      basedOn: `${hint.hitCount} observations, last pattern: ${hint.lastPattern}`
    };
  }

  /**
   * Set a routing suggestion for a construction based on GNN feedback.
   */
  setRoutingSuggestion(fromConstructionId, toConstructionId) {
    const hint = this.routingHints.get(fromConstructionId) || { hitCount: 0, lastPattern: "", suggestedNext: null };
    hint.suggestedNext = toConstructionId;
    this.routingHints.set(fromConstructionId, hint);
  }

  toJSON() {
    return {
      id: this.id,
      label: this.label,
      status: this.status,
      watchedConstructions: Array.from(this.watchedConstructions),
      observationCount: this.observationCount,
      recentObservations: this.observations.slice(-10),
      routingHints: Object.fromEntries(this.routingHints),
      createdAt: this.createdAt
    };
  }
}

// ── Spawner Manager ──

const _activeAgents = new Map();
const _tracers = new Map();

/**
 * Spawn an instant agent at a construction.
 */
function spawnInstantAgent(construction, message, options = {}) {
  if (_activeAgents.size >= MAX_INSTANT_AGENTS) {
    // Despawn oldest completed agent
    let oldest = null;
    for (const [id, agent] of _activeAgents) {
      if (agent.status === "completed" || agent.status === "despawning") {
        if (!oldest || agent.createdAt < oldest.createdAt) {
          oldest = agent;
        }
      }
    }
    if (oldest) {
      _activeAgents.delete(oldest.id);
    } else {
      return { ok: false, error: "max_instant_agents_reached" };
    }
  }

  // Get construction profile for the agent
  const spawnResult = construction.spawnAgent(`instant-${construction.id}-${_agentCounter + 1}`);
  const agentProfile = {
    ...(spawnResult.profile || {}),
    recentTrace: Array.isArray(spawnResult.recentTrace)
      ? spawnResult.recentTrace
      : (spawnResult.profile?.recentTrace || []),
    gnnHints: spawnResult.gnnHints || spawnResult.profile?.gnnHints || {}
  };

  const agent = new InstantAgent(construction.id, agentProfile, {
    ttlMs: options.ttlMs || AGENT_TTL_MS
  });
  agent.selfBuildTask = summarizeSelfBuildTask(options.selfBuildTask || message?.selfBuildTask);

  _activeAgents.set(agent.id, agent);

  // Register PID
  registerPid(agent.id, {
    pid: process.pid,
    deviceBinding: options.deviceBinding || "jesse-desktop",
    ixRef: options.ixRef || "—"
  });

  // Notify tracers
  for (const tracer of _tracers.values()) {
    tracer.observe({
      constructionId: construction.id,
      agentId: agent.id,
      type: "spawn",
      summary: `Instant agent ${agent.id} spawned at ${construction.label}`,
      direction: "system"
    });
  }

  const cachePacket = buildSpawnCachePacket(construction, spawnResult, agent, message, options);
  agent.cacheInfo = cachePacket.cacheInfo || agent.cacheInfo;
  agent.cachedSpawnPacket = cachePacket.spawnPacket || null;
  agent.sharedContext = cachePacket.sharedContext || null;
  agent.selfBuildContext = getSelfBuildContext();
  agent.runtimeWiring = buildAgentRuntimeWiring(agent, "cache", {
    qId: "Q2_RUNTIME_SURFACE_INVENTORY",
    payloadSource: {
      cacheInfo: agent.cacheInfo,
      role: cachePacket.role || null,
      selfBuildTask: agent.selfBuildTask
    },
    selfBuildContext: agent.selfBuildContext,
    selfBuildTask: agent.selfBuildTask
  });
  agent.atlasBinding = agent.runtimeWiring?.atlas || agent.atlasBinding;

  spawnerEmitter.emit("instant_agent_cache", {
    agentId: agent.id,
    constructionId: construction.id,
    ok: cachePacket.ok,
    enabled: cachePacket.enabled,
    role: cachePacket.role || null,
    cacheInfo: agent.cacheInfo,
    runtimeWiring: agent.runtimeWiring
  });
  emitSpawnerHookEvent(agent, "cache", "HG256 cache envelope appended.", agent.runtimeWiring, {
    phase: "cache",
    cacheAvailable: Boolean(cachePacket.ok),
    selfBuildTask: summarizeSelfBuildTask(agent.selfBuildTask)
  });

  if (options.requireSpawnCache && !cachePacket.ok) {
    clearPid(agent.id);
    _activeAgents.delete(agent.id);
    return {
      ok: false,
      error: "spawn_cache_required_but_unavailable",
      cacheInfo: agent.cacheInfo
    };
  }

  agent.runtimeWiring = buildAgentRuntimeWiring(agent, "spawn", {
    qId: "Q2_RUNTIME_SURFACE_INVENTORY",
    payloadSource: {
      cacheInfo: agent.cacheInfo,
      cacheEnabled: cachePacket.enabled,
      cacheOk: cachePacket.ok,
      selfBuildTask: agent.selfBuildTask
    },
    selfBuildContext: agent.selfBuildContext,
    selfBuildTask: agent.selfBuildTask
  });
  agent.atlasBinding = agent.runtimeWiring?.atlas || agent.atlasBinding;

  spawnerEmitter.emit("instant_agent_spawned", {
    agentId: agent.id,
    constructionId: construction.id,
    runtimeWiring: agent.runtimeWiring
  });
  emitSpawnerHookEvent(agent, "spawn", "HG256 spawn envelope appended.", agent.runtimeWiring, {
    phase: "spawn",
    selfBuildTask: summarizeSelfBuildTask(agent.selfBuildTask)
  });

  // Process the message
  agent.processMessage(message);

  return { ok: true, agent };
}

/**
 * Complete an instant agent's processing and handle energy transfer.
 */
function completeAndTransfer(agentId, response, nextConstruction = null) {
  const agent = _activeAgents.get(agentId);
  if (!agent) return { ok: false, error: "agent_not_found" };

  // Complete the agent
  agent.complete(response);

  // Get the construction to despawn from
  const { getConstruction } = require("./constructionIndex");
  const fromConstruction = getConstruction(agent.constructionId);

  let transferPacket = null;
  if (fromConstruction) {
    transferPacket = fromConstruction.despawnAgent(agent.getTransferPacket());

    // Record the outbound message
    fromConstruction.recordMessage({
      text: response.text,
      direction: "outbound",
      source: agent.id
    });
  }

  // Energy transfer to next construction
  if (nextConstruction && transferPacket) {
    nextConstruction.receiveEnergy(transferPacket);
  }

  // Notify tracers of despawn
  for (const tracer of _tracers.values()) {
    tracer.observe({
      constructionId: agent.constructionId,
      agentId: agent.id,
      type: "despawn",
      summary: `Agent ${agent.id} completed and transferred energy`,
      direction: "system",
      patterns: agent.learnedPatterns.slice(0, 3)
    });
  }

  // Emit graph event for energy transfer
  if (nextConstruction) {
    appendGraphEvent({
      component: "instant-agent-spawner",
      category: "energy_transfer",
      action: "construction_energy_transfer",
      actor: { type: "construction", id: agent.constructionId, domain: "simulation" },
      target: { type: "construction", id: nextConstruction.id, domain: "simulation" },
      context: {
        fromAgent: agent.id,
        energyTransferred: String(transferPacket?.energyLevel || 0),
        patternsTransferred: String(agent.learnedPatterns.length)
      }
    });
  }

  // Clear PID and clean up after cooldown
  clearPid(agentId);
  setTimeout(() => {
    _activeAgents.delete(agentId);
  }, COOLDOWN_MS);

  return {
    ok: true,
    transferPacket,
    agentId: agent.id,
    completedAt: agent.completedAt
  };
}

/**
 * Create or get a tracer spindle.
 */
function ensureTracer(id, options = {}) {
  if (_tracers.has(`tracer:${id}`)) {
    return _tracers.get(`tracer:${id}`);
  }
  const tracer = new TracerSpindle(id, options);
  _tracers.set(tracer.id, tracer);
  return tracer;
}

function getTracer(id) {
  return _tracers.get(`tracer:${id}`) || null;
}

function getAllTracers() {
  return Array.from(_tracers.values());
}

function getActiveAgents() {
  return Array.from(_activeAgents.values());
}

function getSpawnerStatus() {
  const atlasStatus = getIxFabricAtlasStatus();
  const selfBuildContext = getSelfBuildContext();
  const selfBuild = summarizeSelfBuildContext(selfBuildContext);
  return {
    activeAgents: _activeAgents.size,
    maxAgents: MAX_INSTANT_AGENTS,
    tracers: _tracers.size,
    cache: getCacheStatus(),
    atlas: atlasStatus,
    selfBuildController: cloneJsonSafe(selfBuildContext?.controller || null),
    selfBuild,
    activeSelfBuildTaskIds: Array.from(new Set(
      Array.from(_activeAgents.values())
        .map((agent) => agent.selfBuildTask?.id || "")
        .filter(Boolean)
    )),
    activeAtlasLanes: Array.from(new Set(
      Array.from(_activeAgents.values())
        .map((agent) => agent.atlasBinding?.laneId || "")
        .filter(Boolean)
    )),
    agents: Array.from(_activeAgents.values()).map(a => a.toJSON()),
    tracerSummary: Array.from(_tracers.values()).map(t => ({
      id: t.id,
      status: t.status,
      observationCount: t.observationCount,
      watchedConstructions: t.watchedConstructions.size
    }))
  };
}

// ── Initialize default tracers ──

function initializeTracers() {
  // QDD project tracer — watches all QDD constructions
  ensureTracer("qdd-watcher", {
    label: "QDD Project Watcher",
    watchedConstructions: ["qdd-ez-protect", "qdd-queue-server", "qdd-pq-bid", "qdd-scheduler-fixes"]
  });

  // Global simulation tracer — watches everything
  ensureTracer("global-watcher", {
    label: "Global Simulation Watcher",
    watchedConstructions: [] // empty = watch all
  });

  // Phone tracer — watches phone-related construction activity
  ensureTracer("phone-watcher", {
    label: "Phone Agent Watcher",
    watchedConstructions: []
  });
}

module.exports = {
  InstantAgent,
  TracerSpindle,
  spawnerEmitter,
  spawnInstantAgent,
  completeAndTransfer,
  ensureTracer,
  getTracer,
  getAllTracers,
  getActiveAgents,
  getSpawnerStatus,
  getSelfBuildContext,
  initializeTracers,
  registerPid,
  clearPid,
  getPidRegistry,
  MAX_INSTANT_AGENTS
};
