"use strict";

const fs = require("fs");
const path = require("path");
const { evaluateFileCap, summarizeFileCapStatus } = require("../tools/behcs/behcs-file-cap");
const { buildResourceBudgetSnapshot } = require("../sovereignty/src/resourceBudgetSnapshot");
const { projectRoot } = require("./runtimePaths");

const ATLAS_PATH = path.join(projectRoot, "data", "behcs", "index", "ix-fabric-atlas.v1.json");
const SURFACE_REGISTRY_PATH = path.join(projectRoot, "data", "behcs", "index", "ix-surface-registry.v1.json");
const PROMOTION_QUEUE_PATH = path.join(projectRoot, "data", "behcs", "index", "ix-promotion-queue.v1.json");
const CROSSWALK_PATH = path.join(projectRoot, "data", "behcs", "index", "deep-wave-master-plan-crosswalk.v1.json");
const GUIDE_PATH = path.join(projectRoot, "data", "behcs", "index", "deep-wave-hg256-agent-guide.v1.json");
const FALCON_LANGUAGE_PATH = path.join(projectRoot, "data", "behcs", "index", "deep-wave-falcon-language-authority.v1.json");
const CONNECTORS_PATH = path.join(projectRoot, "data", "behcs", "sovereignty", "ix", "codex", "connectors.json");
const TASK_MANAGER_FRESHNESS_MS = 5 * 60 * 1000;

const ROUTE_TO_LANE = Object.freeze({
  instant_agent_spawner: "gateway-runtime-routing",
  hook_event_store: "gateway-runtime-routing",
  hooks_connector: "gateway-runtime-routing",
  routes_hooks: "gateway-runtime-routing",
  routes_omnispindle: "gateway-runtime-routing",
  omnispindle_opencode_child: "gateway-runtime-routing"
});

const CONNECTOR_REFERENCE_CLASS_TO_LANE = Object.freeze({
  append_only_file_surface: "gateway-runtime-routing",
  colony_peer_surface: "gateway-runtime-routing",
  grammar_file_surface: "memory-index-docs",
  http_runtime_surface: "gateway-runtime-routing",
  index_surface: "memory-index-docs",
  integration_surface: "browser-integrations",
  mcp_runtime_surface: "gateway-runtime-routing",
  message_bus_surface: "gateway-runtime-routing",
  model_provider: "gateway-runtime-routing",
  process_surface: "desktop-phone-mirror",
  registry_file_surface: "memory-index-docs",
  runtime_registry_surface: "gateway-runtime-routing",
  spec_file_surface: "memory-index-docs"
});

let cache = {
  loadedAt: 0,
  signature: "",
  bundle: null
};

function cleanLine(text) {
  return String(text || "").replace(/\r/g, "").trim();
}

function normalizeSourcePath(value) {
  const raw = cleanLine(value);
  if (!raw) return "";
  if (/^[A-Za-z]:[\\/]/.test(raw)) {
    return path.relative(projectRoot, raw).replace(/\\/g, "/");
  }
  return raw.replace(/^\.?[\\/]+/, "").replace(/\\/g, "/");
}

function unique(values) {
  return Array.from(new Set((Array.isArray(values) ? values : []).filter(Boolean)));
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_error) {
    return null;
  }
}

function fileSignature(filePath) {
  if (!fs.existsSync(filePath)) {
    return `${filePath}:missing`;
  }
  const stat = fs.statSync(filePath);
  return `${filePath}:${Number(stat.mtimeMs || 0)}:${Number(stat.size || 0)}`;
}

function parseKeyValueNotes(notes = []) {
  const parsed = {};
  for (const entry of Array.isArray(notes) ? notes : []) {
    const raw = cleanLine(entry);
    if (!raw) continue;
    const separatorIndex = raw.indexOf("=");
    if (separatorIndex < 1) continue;
    const key = cleanLine(raw.slice(0, separatorIndex));
    if (!key) continue;
    parsed[key] = cleanLine(raw.slice(separatorIndex + 1));
  }
  return parsed;
}

function getSurfaceGroup(surfaceRegistry, groupId) {
  const normalizedGroupId = cleanLine(groupId);
  return (surfaceRegistry?.groups || []).find((group) => cleanLine(group.id) === normalizedGroupId) || null;
}

function getGroupSurfaces(surfaceRegistry, groupId) {
  const normalizedGroupId = cleanLine(groupId);
  return (surfaceRegistry?.surfaces || []).filter((surface) => cleanLine(surface.groupId) === normalizedGroupId);
}

function getLaneById(promotionQueue, laneId) {
  const normalizedLaneId = cleanLine(laneId);
  return (promotionQueue?.transitionLanes || []).find((lane) => cleanLine(lane.id) === normalizedLaneId) || null;
}

function summarizeSurfaceGroup(surfaceRegistry, groupId) {
  const group = getSurfaceGroup(surfaceRegistry, groupId);
  const surfaces = getGroupSurfaces(surfaceRegistry, groupId);
  return {
    id: cleanLine(group?.id || groupId),
    title: cleanLine(group?.title || groupId),
    sourcePath: cleanLine(group?.sourcePath || ""),
    surfaceCount: surfaces.length,
    fileSurfaceCount: surfaces.filter((surface) => cleanLine(surface.surfaceClass) === "file_surface").length,
    runtimeSurfaceCount: surfaces.filter((surface) => cleanLine(surface.surfaceClass) === "runtime_surface").length,
    logicalSurfaceCount: surfaces.filter((surface) => cleanLine(surface.surfaceClass) === "logical_surface").length,
    deviceSurfaceCount: surfaces.filter((surface) => cleanLine(surface.surfaceClass) === "device_surface").length,
    existingSurfaceCount: surfaces.filter((surface) => surface.exists === true).length,
    surfaceIds: unique(surfaces.map((surface) => cleanLine(surface.id)))
  };
}

function summarizeLaneStatusCounts(laneSummaries = []) {
  return laneSummaries.reduce((accumulator, lane) => {
    const status = cleanLine(lane.status || "unknown");
    accumulator[status] = Number(accumulator[status] || 0) + 1;
    return accumulator;
  }, {});
}

function toSafeNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function normalizeGuardStatus(value) {
  const status = cleanLine(value).toLowerCase();
  if (status === "deny") return "deny";
  if (status === "warn") return "warn";
  if (status === "pass") return "pass";
  return "hold";
}

function summarizeGcFileCapGuard(fileCap = null) {
  const status = fileCap && typeof fileCap === "object" ? fileCap : {};
  const guardStatus = normalizeGuardStatus(status.status);
  const labels = {
    spec: cleanLine(status.labels?.spec) || "IX-700",
    dialect: cleanLine(status.labels?.dialect) || "IX",
    hyperlanguage: cleanLine(status.labels?.hyperlanguage) || "47D",
    wave: cleanLine(status.labels?.wave) || "cube_cube_cubed",
    room: cleanLine(status.labels?.room) || "whiteroom",
    translation: cleanLine(status.labels?.translation) || "glyph",
    boundary: cleanLine(status.labels?.boundary) || "boundary_typed",
    chain: "ix-chain-orchestrate",
    guardId: "gc_file_cap_guard",
    status: guardStatus
  };

  return {
    id: "gc_file_cap_guard",
    title: "GC File Cap Guard",
    status: guardStatus,
    mode: cleanLine(status.mode),
    policyId: cleanLine(status.policyId),
    scope: cleanLine(status.scope),
    trackedFiles: toSafeNumber(status.trackedFiles),
    projectedFiles: toSafeNumber(status.projectedFiles),
    plannedCreates: toSafeNumber(status.plannedCreates),
    maxTrackedFiles: toSafeNumber(status.maxTrackedFiles),
    warnAt: toSafeNumber(status.warnAt),
    remaining: toSafeNumber(status.remaining),
    gcTriggerMessages: toSafeNumber(status.gcTriggerMessages),
    labels,
    language: {
      human: cleanLine(status.language?.human)
        || cleanLine(`GC/file-cap ${guardStatus}: ${toSafeNumber(status.projectedFiles)}/${toSafeNumber(status.maxTrackedFiles)} tracked, remaining ${toSafeNumber(status.remaining)}.`),
      agent: cleanLine(status.language?.agent)
        || cleanLine(`(chief, guard.gc_file_cap, omniverse.file_budget, 2, runtime, hookwall, ${guardStatus === "deny" ? "blocked" : guardStatus === "warn" ? "executing" : "completed"}, [count], ${labels.wave}, ${labels.dialect}, log, persistent, ${labels.room}, light)`),
      device: cleanLine(status.language?.device)
        || cleanLine(`gc_file_cap status=${guardStatus} tracked=${toSafeNumber(status.trackedFiles)} projected=${toSafeNumber(status.projectedFiles)} max=${toSafeNumber(status.maxTrackedFiles)} remaining=${toSafeNumber(status.remaining)}`)
    },
    surfaces: Array.isArray(status.surfaces)
      ? status.surfaces.map((surface) => ({
        id: cleanLine(surface.id),
        label: cleanLine(surface.label),
        relativePath: normalizeSourcePath(surface.relativePath),
        fileCount: toSafeNumber(surface.fileCount)
      }))
      : []
  };
}

function summarizeTaskManagerProcessGuard() {
  let snapshot = null;
  try {
    snapshot = buildResourceBudgetSnapshot({
      instanceRoot: projectRoot,
      write: false
    });
  } catch (_error) {
    snapshot = null;
  }

  const devices = Array.isArray(snapshot?.devices) ? snapshot.devices : [];
  const desktop = devices.find((device) => cleanLine(device?.id).toLowerCase() === "acer" && device?.taskManager)
    || devices.find((device) => cleanLine(device?.kind).toLowerCase() === "desktop" && device?.taskManager)
    || null;
  const taskManager = desktop?.taskManager && typeof desktop.taskManager === "object" ? desktop.taskManager : {};
  const sampledAt = cleanLine(taskManager.sampledAt);
  const sampledEpoch = sampledAt ? Date.parse(sampledAt) : NaN;
  const fresh = Number.isFinite(sampledEpoch) && (Date.now() - sampledEpoch) <= TASK_MANAGER_FRESHNESS_MS;
  const topProcessRows = Array.isArray(taskManager.topProcessRows)
    ? taskManager.topProcessRows.slice(0, 8).map((row) => ({
      name: cleanLine(row?.name),
      pid: toSafeNumber(row?.pid, null),
      workingSetMb: toSafeNumber(row?.workingSetMb, null),
      family: cleanLine(row?.family)
    })).filter((row) => row.name)
    : [];
  const runtimeProcessCounts = taskManager.runtimeProcessCounts && typeof taskManager.runtimeProcessCounts === "object"
    ? taskManager.runtimeProcessCounts
    : {};
  const managedFamilies = Object.keys(runtimeProcessCounts)
    .map((name) => ({
      name: cleanLine(name),
      count: toSafeNumber(runtimeProcessCounts[name])
    }))
    .filter((entry) => entry.name && entry.count > 0)
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name));
  const coverage = cleanLine(taskManager.coverage || "none") || "none";
  const hasCoverage = coverage !== "none";
  const guardStatus = fresh && hasCoverage && topProcessRows.length > 0
    ? "pass"
    : (hasCoverage || topProcessRows.length > 0)
      ? "warn"
      : "hold";
  const labels = {
    spec: "IX-711",
    dialect: "IX",
    hyperlanguage: "47D",
    wave: "map_map_mapped",
    room: "whiteroom",
    translation: "glyph",
    boundary: "boundary_typed",
    chain: "ix-chain-orchestrate",
    guardId: "task_manager_process_guard",
    status: guardStatus,
    coverage
  };

  return {
    id: "task_manager_process_guard",
    title: "Task Manager Process Guard",
    status: guardStatus,
    source: cleanLine(taskManager.source || "windows_get_process"),
    coverage,
    sampledAt,
    fresh,
    managedFamilyCount: managedFamilies.length,
    managedFamilies,
    topProcessRows,
    labels,
    language: {
      human: cleanLine(`Task Manager/process guard ${guardStatus}: coverage ${coverage}, sampled ${sampledAt || "none"}, top rows ${topProcessRows.length}.`),
      agent: cleanLine(`(chief, guard.task_manager_process, omniverse.runtime_watch, 3, runtime, hookwall, ${guardStatus === "pass" ? "completed" : "executing"}, [watch], ${labels.wave}, ${labels.dialect}, log, persistent, ${labels.room}, light)`),
      device: cleanLine(`task_manager_guard status=${guardStatus} coverage=${coverage} sampled=${sampledAt || "none"} top_rows=${topProcessRows.length} fresh=${fresh}`),
    },
    sourcePaths: {
      supervisor: normalizeSourcePath(snapshot?.sources?.supervisorStatePath),
      snapshot: normalizeSourcePath(snapshot?.outputPath)
    }
  };
}

function buildGuardStatusCounts(guards = []) {
  const counts = {};
  for (const guard of guards) {
    const status = normalizeGuardStatus(guard?.status);
    counts[status] = Number(counts[status] || 0) + 1;
  }
  return counts;
}

function buildGuardGateStatus(guards = []) {
  const statuses = guards.map((guard) => normalizeGuardStatus(guard?.status));
  if (statuses.some((status) => status === "deny" || status === "hold")) return "hold";
  if (statuses.some((status) => status === "warn")) return "warn";
  return "pass";
}

function getIxControllerGuards(options = {}) {
  const fileCap = options.fileCap && typeof options.fileCap === "object"
    ? options.fileCap
    : summarizeFileCapStatus(evaluateFileCap({ reason: "ix_controller_guards" }));
  const guards = [
    summarizeGcFileCapGuard(fileCap),
    summarizeTaskManagerProcessGuard()
  ];
  const statusCounts = buildGuardStatusCounts(guards);
  const gateStatus = buildGuardGateStatus(guards);

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    guardCount: guards.length,
    gateStatus,
    summary: {
      gateStatus,
      statusCounts,
      holdCount: Number(statusCounts.hold || 0),
      denyCount: Number(statusCounts.deny || 0),
      warnCount: Number(statusCounts.warn || 0),
      passCount: Number(statusCounts.pass || 0)
    },
    labels: {
      spec: "IX-711",
      dialect: "IX",
      hyperlanguage: "47D",
      wave: "map_map_mapped",
      room: "whiteroom",
      translation: "glyph",
      boundary: "boundary_typed",
      chain: "ix-chain-orchestrate",
      guardSurface: "atlas_controller_guards",
      status: gateStatus
    },
    language: {
      human: cleanLine(`Controller guards ${gateStatus}: ${guards.length} surfaces, pass ${Number(statusCounts.pass || 0)}, warn ${Number(statusCounts.warn || 0)}, hold/deny ${Number(statusCounts.hold || 0) + Number(statusCounts.deny || 0)}.`),
      agent: cleanLine(`(chief, atlas.controller.guards, omniverse.fabric, 4, runtime, hookwall, ${gateStatus === "pass" ? "completed" : "executing"}, [guard], map_map_mapped, IX, log, persistent, whiteroom, light)`),
      device: cleanLine(`controller_guards status=${gateStatus} total=${guards.length} pass=${Number(statusCounts.pass || 0)} warn=${Number(statusCounts.warn || 0)} hold=${Number(statusCounts.hold || 0)} deny=${Number(statusCounts.deny || 0)}`)
    },
    guards
  };
}

function loadIxFabricAtlasBundle(options = {}) {
  const force = Boolean(options.force);
  const signature = [
    fileSignature(ATLAS_PATH),
    fileSignature(SURFACE_REGISTRY_PATH),
    fileSignature(PROMOTION_QUEUE_PATH),
    fileSignature(CROSSWALK_PATH),
    fileSignature(GUIDE_PATH),
    fileSignature(FALCON_LANGUAGE_PATH)
  ].join("|");

  if (!force && cache.bundle && cache.signature === signature) {
    return cache.bundle;
  }

  const atlas = readJson(ATLAS_PATH);
  const surfaceRegistry = readJson(SURFACE_REGISTRY_PATH);
  const promotionQueue = readJson(PROMOTION_QUEUE_PATH);
  const crosswalk = readJson(CROSSWALK_PATH);
  const guide = readJson(GUIDE_PATH);
  const falconLanguage = readJson(FALCON_LANGUAGE_PATH);
  const enabled = Boolean(atlas && surfaceRegistry && promotionQueue);

  cache = {
    loadedAt: Date.now(),
    signature,
    bundle: {
      ok: enabled,
      enabled,
      loadedAt: new Date().toISOString(),
      atlas,
      surfaceRegistry,
      promotionQueue,
      crosswalk,
      guide,
      falconLanguage,
      paths: {
        atlas: ATLAS_PATH,
        surfaceRegistry: SURFACE_REGISTRY_PATH,
        promotionQueue: PROMOTION_QUEUE_PATH,
        crosswalk: CROSSWALK_PATH,
        guide: GUIDE_PATH,
        falconLanguage: FALCON_LANGUAGE_PATH
      }
    }
  };

  return cache.bundle;
}

function getIxFabricAtlasStatus(options = {}) {
  const bundle = loadIxFabricAtlasBundle(options);
  if (!bundle.enabled) {
    return {
      ok: false,
      enabled: false,
      paths: bundle.paths,
      atlasId: "",
      summary: {
        totalEntries: 0,
        combinedReachableEntryCount: 0,
        surfaceCount: 0,
        laneCount: 0
      }
    };
  }

  return {
    ok: true,
    enabled: true,
    loadedAt: bundle.loadedAt,
    atlasId: bundle.atlas?.atlasId || "",
    surfaceRegistryId: bundle.surfaceRegistry?.registryId || "",
    promotionQueueId: bundle.promotionQueue?.queueId || "",
    paths: {
      atlas: normalizeSourcePath(bundle.paths.atlas),
      surfaceRegistry: normalizeSourcePath(bundle.paths.surfaceRegistry),
      promotionQueue: normalizeSourcePath(bundle.paths.promotionQueue)
    },
    summary: {
      totalEntries: Number(bundle.atlas?.summary?.totalEntries || 0),
      archiveEntryCount: Number(bundle.atlas?.summary?.archiveEntryCount || 0),
      combinedReachableEntryCount: Number(bundle.atlas?.summary?.combinedReachableEntryCount || 0),
      surfaceCount: Number(bundle.surfaceRegistry?.summary?.surfaceCount || 0),
      groupCount: Number(bundle.surfaceRegistry?.summary?.groupCount || 0),
      laneCount: Array.isArray(bundle.promotionQueue?.transitionLanes) ? bundle.promotionQueue.transitionLanes.length : 0
    }
  };
}

function getIxSurfaceRegistry(options = {}) {
  const bundle = loadIxFabricAtlasBundle(options);
  return bundle.surfaceRegistry || null;
}

function getIxPromotionQueue(options = {}) {
  const bundle = loadIxFabricAtlasBundle(options);
  return bundle.promotionQueue || null;
}

function getIxDeepWaveCrosswalk(options = {}) {
  const bundle = loadIxFabricAtlasBundle(options);
  const crosswalk = bundle.crosswalk || null;
  if (!crosswalk || typeof crosswalk !== "object") {
    return {
      ok: false,
      path: normalizeSourcePath(CROSSWALK_PATH),
      crosswalkId: "",
      status: "missing",
      doctrine: [],
      chain: [],
      autoTranslationPath: "",
      sourcePacketCount: 0,
      sourcePackets: [],
      surfaceCount: 0,
      surfaces: [],
      currentHolds: [],
      currentVerdict: [],
      nextBoundedTasks: []
    };
  }

  const surfaces = Object.entries(crosswalk.surfaces || {}).map(([surfaceId, entry]) => {
    const artifacts = Array.isArray(entry?.artifacts) ? entry.artifacts : [];
    return {
      id: cleanLine(surfaceId),
      meaning: cleanLine(entry?.meaning),
      artifactCount: artifacts.length,
      artifacts: artifacts.map((artifact) => normalizeSourcePath(artifact))
    };
  });

  const doctrine = unique((Array.isArray(crosswalk.doctrine) ? crosswalk.doctrine : []).map((value) => cleanLine(value)));
  const chain = unique((Array.isArray(crosswalk.chain) ? crosswalk.chain : []).map((value) => cleanLine(value)));
  const sourcePackets = unique((Array.isArray(crosswalk.sourcePackets) ? crosswalk.sourcePackets : []).map((value) => normalizeSourcePath(value)));
  const currentHolds = unique((Array.isArray(crosswalk.currentHolds) ? crosswalk.currentHolds : []).map((value) => cleanLine(value)));
  const currentVerdict = unique((Array.isArray(crosswalk.currentVerdict) ? crosswalk.currentVerdict : []).map((value) => cleanLine(value)));
  const nextBoundedTasks = unique((Array.isArray(crosswalk.nextBoundedTasks) ? crosswalk.nextBoundedTasks : []).map((value) => cleanLine(value)));

  return {
    ok: true,
    generatedAt: cleanLine(crosswalk.generatedAt),
    path: normalizeSourcePath(bundle.paths.crosswalk),
    crosswalkId: cleanLine(crosswalk.crosswalkId),
    status: cleanLine(crosswalk.status),
    boundary: cleanLine(crosswalk.boundary),
    doctrine,
    chain,
    autoTranslationPath: cleanLine(crosswalk.autoTranslationPath),
    sourcePacketCount: sourcePackets.length,
    sourcePackets,
    surfaceCount: surfaces.length,
    surfaces,
    currentHolds,
    currentVerdict,
    nextBoundedTasks,
    labels: {
      spec: "IX-1009",
      dialect: "IX",
      hyperlanguage: "47D",
      wave: "map_map_mapped",
      room: "whiteroom",
      translation: "glyph",
      boundary: "boundary_typed",
      chain: "ix-chain-orchestrate",
      crosswalkSurface: "deep_wave_master_plan_crosswalk",
      status: cleanLine(crosswalk.status || "hold")
    },
    language: {
      human: cleanLine(`Deep-wave crosswalk ${cleanLine(crosswalk.status || "hold")}: ${surfaces.length} bound surfaces, ${sourcePackets.length} source packets, auto-translation ${cleanLine(crosswalk.autoTranslationPath || "unknown")}.`),
      agent: cleanLine(`(chief, atlas.deep_wave_crosswalk, omniverse.fabric, 7, runtime, hookwall, ${cleanLine(crosswalk.status || "hold")}, [${surfaces.map((surface) => surface.id).join("|") || "none"}], map_map_mapped, IX, log, persistent, whiteroom, light)`),
      device: cleanLine(`deep_wave_crosswalk status=${cleanLine(crosswalk.status || "hold")} surfaces=${surfaces.length} packets=${sourcePackets.length} auto_translation=${cleanLine(crosswalk.autoTranslationPath || "unknown")}`)
    }
  };
}

function getIxDeepWaveAgentGuide(options = {}) {
  const bundle = loadIxFabricAtlasBundle(options);
  const guide = bundle.guide || null;
  if (!guide || typeof guide !== "object") {
    return {
      ok: false,
      path: normalizeSourcePath(GUIDE_PATH),
      guideId: "",
      status: "missing",
      boundary: "",
      law: [],
      chain: [],
      autoTranslationPath: "",
      taskCount: 0,
      phaseCount: 0,
      slotCount: 0,
      sampleHilbert256Names: [],
      tasks: [],
      phaseGroups: [],
      slotAssignments: [],
      readiness: {
        planningReady: false,
        summonReady: false,
        summonReadyWhen: []
      }
    };
  }

  const law = unique((Array.isArray(guide.law) ? guide.law : []).map((value) => cleanLine(value)));
  const chain = unique((Array.isArray(guide.chain) ? guide.chain : []).map((value) => cleanLine(value)));
  const sampleHilbert256Names = unique((Array.isArray(guide.sampleHilbert256Names) ? guide.sampleHilbert256Names : []).map((value) => cleanLine(value)));
  const phaseGroups = (Array.isArray(guide.phaseGroups) ? guide.phaseGroups : []).map((entry) => ({
    id: cleanLine(entry?.id),
    order: toSafeNumber(entry?.order),
    title: cleanLine(entry?.title),
    taskIds: unique((Array.isArray(entry?.taskIds) ? entry.taskIds : []).map((value) => cleanLine(value))),
    owners: unique((Array.isArray(entry?.owners) ? entry.owners : []).map((value) => cleanLine(value)))
  }));
  const slotAssignments = (Array.isArray(guide.slotAssignments) ? guide.slotAssignments : []).map((entry) => ({
    role: cleanLine(entry?.role),
    team: unique((Array.isArray(entry?.team) ? entry.team : []).map((value) => cleanLine(value))),
    primaryTaskIds: unique((Array.isArray(entry?.primaryTaskIds) ? entry.primaryTaskIds : []).map((value) => cleanLine(value))),
    supportingTaskIds: unique((Array.isArray(entry?.supportingTaskIds) ? entry.supportingTaskIds : []).map((value) => cleanLine(value))),
    focus: cleanLine(entry?.focus)
  }));
  const tasks = (Array.isArray(guide.tasks) ? guide.tasks : []).map((entry) => ({
    order: toSafeNumber(entry?.order),
    taskId: cleanLine(entry?.taskId),
    wave: cleanLine(entry?.wave),
    phaseId: cleanLine(entry?.phaseId),
    title: cleanLine(entry?.title),
    intent: cleanLine(entry?.intent),
    primaryCouncilRole: cleanLine(entry?.primaryCouncilRole),
    supportingRoles: unique((Array.isArray(entry?.supportingRoles) ? entry.supportingRoles : []).map((value) => cleanLine(value))),
    planningClass: cleanLine(entry?.planningClass),
    guideStatus: cleanLine(entry?.guideStatus),
    systemStatus: cleanLine(entry?.systemStatus)
  }));
  const planningOnlyTaskIds = unique((Array.isArray(guide?.guardPlan?.planningOnlyTaskIds) ? guide.guardPlan.planningOnlyTaskIds : []).map((value) => cleanLine(value)));
  const summonGatedTaskIds = unique((Array.isArray(guide?.guardPlan?.summonGatedTaskIds) ? guide.guardPlan.summonGatedTaskIds : []).map((value) => cleanLine(value)));
  const executionDeniedTaskIds = unique((Array.isArray(guide?.guardPlan?.executionDeniedTaskIds) ? guide.guardPlan.executionDeniedTaskIds : []).map((value) => cleanLine(value)));
  const holds = unique((Array.isArray(guide?.guardPlan?.holds) ? guide.guardPlan.holds : []).map((value) => cleanLine(value)));
  const authorityFocusDims = unique((Array.isArray(guide?.authorityMap?.focusDims) ? guide.authorityMap.focusDims : []).map((value) => cleanLine(value)));
  const summonReadyWhen = unique((Array.isArray(guide?.readiness?.summonReadyWhen) ? guide.readiness.summonReadyWhen : []).map((value) => cleanLine(value)));
  const omniProcessorRefs = unique((Array.isArray(guide?.falconLanguageAbsorption?.omniProcessor?.refs) ? guide.falconLanguageAbsorption.omniProcessor.refs : []).map((value) => normalizeSourcePath(value)));
  const trinityFocus = unique((Array.isArray(guide?.falconLanguageAbsorption?.trinity?.focus) ? guide.falconLanguageAbsorption.trinity.focus : []).map((value) => cleanLine(value)));

  return {
    ok: true,
    generatedAt: cleanLine(guide.generatedAt),
    path: normalizeSourcePath(bundle.paths.guide),
    guideId: cleanLine(guide.guideId),
    status: cleanLine(guide.status),
    boundary: cleanLine(guide.boundary),
    cascadeStage: cleanLine(guide.cascadeStage),
    matrix: cleanLine(guide.matrix),
    autoTranslationPath: cleanLine(guide.autoTranslationPath),
    law,
    chain,
    taskCount: tasks.length,
    phaseCount: phaseGroups.length,
    slotCount: slotAssignments.length,
    sampleHilbert256NameCount: sampleHilbert256Names.length,
    sampleHilbert256Names,
    sampleHilbert256AddressTranscription: {
      status: cleanLine(guide?.sampleHilbert256AddressTranscription?.status),
      source: cleanLine(guide?.sampleHilbert256AddressTranscription?.source)
    },
    sourceGuide: {
      taskboardStatus: cleanLine(guide?.sourceGuide?.taskboardStatus),
      reboundStatus: cleanLine(guide?.sourceGuide?.reboundStatus),
      note: cleanLine(guide?.sourceGuide?.note)
    },
    authorityMap: {
      mapId: cleanLine(guide?.authorityMap?.mapId),
      path: normalizeSourcePath(guide?.authorityMap?.path),
      authority: cleanLine(guide?.authorityMap?.authority),
      status: cleanLine(guide?.authorityMap?.status),
      focusDims: authorityFocusDims
    },
    falconLanguageAbsorption: {
      tupleMode: cleanLine(guide?.falconLanguageAbsorption?.tupleMode),
      route: cleanLine(guide?.falconLanguageAbsorption?.route),
      omniProcessor: {
        status: cleanLine(guide?.falconLanguageAbsorption?.omniProcessor?.status),
        refs: omniProcessorRefs
      },
      trinity: {
        compute: cleanLine(guide?.falconLanguageAbsorption?.trinity?.compute),
        hardware: cleanLine(guide?.falconLanguageAbsorption?.trinity?.hardware),
        inference: cleanLine(guide?.falconLanguageAbsorption?.trinity?.inference),
        focus: trinityFocus
      },
      novalumEncryption: {
        surface: cleanLine(guide?.falconLanguageAbsorption?.novalumEncryption?.surface),
        path: cleanLine(guide?.falconLanguageAbsorption?.novalumEncryption?.path),
        binding: cleanLine(guide?.falconLanguageAbsorption?.novalumEncryption?.binding)
      }
    },
    guardPlan: {
      planningOnlyTaskIds,
      summonGatedTaskIds,
      executionDeniedTaskIds,
      holds,
      sentinelPacket: cleanLine(guide?.guardPlan?.sentinelPacket)
    },
    readiness: {
      planningReady: guide?.readiness?.planningReady === true,
      summonReady: guide?.readiness?.summonReady === true,
      summonReadyWhen,
      notes: unique((Array.isArray(guide?.readiness?.notes) ? guide.readiness.notes : []).map((value) => cleanLine(value)))
    },
    phaseGroups,
    slotAssignments,
    tasks,
    labels: {
      spec: "IX-1009",
      dialect: "IX",
      hyperlanguage: "47D",
      wave: "cube_cube_cubed",
      room: "whiteroom",
      translation: "glyph",
      boundary: "boundary_typed",
      chain: "ix-chain-orchestrate",
      guideSurface: "deep_wave_hg256_agent_guide",
      status: cleanLine(guide.status || "hold")
    },
    language: {
      human: cleanLine(`Deep-wave HG256 guide ${cleanLine(guide.status || "hold")}: ${tasks.length} tasks, ${phaseGroups.length} phases, ${slotAssignments.length} council slots, route ${cleanLine(guide?.falconLanguageAbsorption?.route || guide?.chain?.join(" -> ") || "unknown")}.`),
      agent: cleanLine(`(chief, atlas.deep_wave_hg256_agent_guide, omniverse.fabric, 8, runtime, hookwall, ${cleanLine(guide.status || "hold")}, [${slotAssignments.map((entry) => entry.role).join("|") || "none"}], cube_cube_cubed, IX, log, persistent, whiteroom, light)`),
      device: cleanLine(`deep_wave_hg256_guide status=${cleanLine(guide.status || "hold")} tasks=${tasks.length} phases=${phaseGroups.length} slots=${slotAssignments.length} auto_translation=${cleanLine(guide.autoTranslationPath || "unknown")}`)
    }
  };
}

function getIxDeepWaveFalconLanguage(options = {}) {
  const bundle = loadIxFabricAtlasBundle(options);
  const falconLanguage = bundle.falconLanguage || null;
  if (!falconLanguage || typeof falconLanguage !== "object") {
    return {
      ok: false,
      path: normalizeSourcePath(FALCON_LANGUAGE_PATH),
      languageId: "",
      status: "missing",
      boundary: "",
      dialect: "",
      glyphPosture: "",
      autoTranslationPath: "",
      chain: [],
      sourcePacketCount: 0,
      sourcePackets: [],
      authorityLevelCount: 0,
      authorityLevels: [],
      namedAgentCount: 0,
      namedAgents: [],
      councilSeatCount: 0,
      councilSeats: [],
      executionFabric: {
        dispatchEnvelope: "",
        chiefRuntime: {
          provider: "",
          workerId: "",
          modelHint: "",
          accountTier: "",
          seatRoles: [],
          seatRoleCount: 0,
          law: ""
        },
        childRuntime: {
          provider: "",
          workerId: "",
          modelHint: "",
          variant: "",
          fanoutPerLane: 0,
          maxParentAgents: 0,
          supportedWorkerIds: [],
          route: "",
          compatibilityRoute: ""
        },
        omnispindle: {
          laneCount: 0,
          flywheelCount: 0,
          acceptsAnyAgentTypeEnvelope: false,
          supportsAnyWorkerRouterAgent: false,
          defaultAgentType: "",
          dispatchLaw: "",
          whiteRoomGate: "",
          omnishannonGate: "",
          sourceRefs: []
        }
      },
      taskRouting: {
        planningOnlyTaskIds: [],
        summonGatedTaskIds: [],
        executionDeniedTaskIds: []
      },
      readiness: {
        planningReady: false,
        summonReady: false,
        currentHolds: [],
        currentVerdict: [],
        summonReadyWhen: []
      }
    };
  }

  const law = unique((Array.isArray(falconLanguage.law) ? falconLanguage.law : []).map((value) => cleanLine(value)));
  const chain = unique((Array.isArray(falconLanguage.chain) ? falconLanguage.chain : []).map((value) => cleanLine(value)));
  const sourcePackets = unique((Array.isArray(falconLanguage.sourcePackets) ? falconLanguage.sourcePackets : []).map((value) => normalizeSourcePath(value)));
  const authorityLevels = (Array.isArray(falconLanguage.authorityLevels) ? falconLanguage.authorityLevels : []).map((entry) => ({
    level: toSafeNumber(entry?.level),
    tier: cleanLine(entry?.tier),
    count: Number.isFinite(Number(entry?.count)) ? Number(entry.count) : cleanLine(entry?.count),
    seats: unique((Array.isArray(entry?.seats) ? entry.seats : []).map((value) => cleanLine(value))),
    rule: cleanLine(entry?.rule)
  }));
  const namedAgents = (Array.isArray(falconLanguage.namedAgents) ? falconLanguage.namedAgents : []).map((entry) => ({
    name: cleanLine(entry?.name),
    councilSeat: cleanLine(entry?.councilSeat),
    authorityTier: cleanLine(entry?.authorityTier),
    languageStatus: cleanLine(entry?.languageStatus),
    hotpathRefs: entry?.hotpathRefs && typeof entry.hotpathRefs === "object"
      ? Object.fromEntries(
        Object.entries(entry.hotpathRefs).map(([key, value]) => [cleanLine(key), normalizeSourcePath(value)])
      )
      : {},
    tupleFallback: unique((Array.isArray(entry?.tupleFallback) ? entry.tupleFallback : []).map((value) => cleanLine(value))),
    source: cleanLine(entry?.source),
    role: cleanLine(entry?.role)
  }));
  const councilSeats = (Array.isArray(falconLanguage.councilSeats) ? falconLanguage.councilSeats : []).map((entry) => ({
    role: cleanLine(entry?.role),
    team: unique((Array.isArray(entry?.team) ? entry.team : []).map((value) => cleanLine(value))),
    authorityTier: cleanLine(entry?.authorityTier),
    focus: cleanLine(entry?.focus),
    guideTaskIds: unique((Array.isArray(entry?.guideTaskIds) ? entry.guideTaskIds : []).map((value) => cleanLine(value))),
    packetClass: cleanLine(entry?.packetClass)
  }));
  const chiefSeatRoles = unique((Array.isArray(falconLanguage?.executionFabric?.chiefRuntime?.seatRoles) ? falconLanguage.executionFabric.chiefRuntime.seatRoles : []).map((value) => cleanLine(value)));
  const childSupportedWorkerIds = unique((Array.isArray(falconLanguage?.executionFabric?.childRuntime?.supportedWorkerIds) ? falconLanguage.executionFabric.childRuntime.supportedWorkerIds : []).map((value) => cleanLine(value)));
  const omnispindleSourceRefs = unique((Array.isArray(falconLanguage?.executionFabric?.omnispindle?.sourceRefs) ? falconLanguage.executionFabric.omnispindle.sourceRefs : []).map((value) => normalizeSourcePath(value)));
  const planningOnlyTaskIds = unique((Array.isArray(falconLanguage?.taskRouting?.planningOnlyTaskIds) ? falconLanguage.taskRouting.planningOnlyTaskIds : []).map((value) => cleanLine(value)));
  const summonGatedTaskIds = unique((Array.isArray(falconLanguage?.taskRouting?.summonGatedTaskIds) ? falconLanguage.taskRouting.summonGatedTaskIds : []).map((value) => cleanLine(value)));
  const executionDeniedTaskIds = unique((Array.isArray(falconLanguage?.taskRouting?.executionDeniedTaskIds) ? falconLanguage.taskRouting.executionDeniedTaskIds : []).map((value) => cleanLine(value)));
  const currentHolds = unique((Array.isArray(falconLanguage?.readiness?.currentHolds) ? falconLanguage.readiness.currentHolds : []).map((value) => cleanLine(value)));
  const currentVerdict = unique((Array.isArray(falconLanguage?.readiness?.currentVerdict) ? falconLanguage.readiness.currentVerdict : []).map((value) => cleanLine(value)));
  const summonReadyWhen = unique((Array.isArray(falconLanguage?.readiness?.summonReadyWhen) ? falconLanguage.readiness.summonReadyWhen : []).map((value) => cleanLine(value)));
  const packetExamples = (Array.isArray(falconLanguage.packetExamples) ? falconLanguage.packetExamples : []).map((entry) => ({
    role: cleanLine(entry?.role),
    packet: cleanLine(entry?.packet)
  }));
  const omniProcessorRefs = unique((Array.isArray(falconLanguage?.omniProcessorAbsorption?.refs) ? falconLanguage.omniProcessorAbsorption.refs : []).map((value) => normalizeSourcePath(value)));
  const trinityFocus = unique((Array.isArray(falconLanguage?.omniProcessorAbsorption?.trinity?.focus) ? falconLanguage.omniProcessorAbsorption.trinity.focus : []).map((value) => cleanLine(value)));

  return {
    ok: true,
    generatedAt: cleanLine(falconLanguage.generatedAt),
    path: normalizeSourcePath(bundle.paths.falconLanguage),
    languageId: cleanLine(falconLanguage.languageId),
    status: cleanLine(falconLanguage.status),
    sourceType: cleanLine(falconLanguage.sourceType),
    purpose: cleanLine(falconLanguage.purpose),
    cascadeStage: cleanLine(falconLanguage.cascadeStage),
    matrix: cleanLine(falconLanguage.matrix),
    boundary: cleanLine(falconLanguage.boundary),
    dialect: cleanLine(falconLanguage.dialect),
    glyphPosture: cleanLine(falconLanguage.glyphPosture),
    autoTranslationPath: cleanLine(falconLanguage.autoTranslationPath),
    law,
    chain,
    sourcePacketCount: sourcePackets.length,
    sourcePackets,
    authorityLevelCount: authorityLevels.length,
    authorityLevels,
    triggerSurface: {
      namedAgent: cleanLine(falconLanguage?.triggerSurface?.namedAgent),
      role: cleanLine(falconLanguage?.triggerSurface?.role),
      authorityLevel: toSafeNumber(falconLanguage?.triggerSurface?.authorityLevel),
      directive: cleanLine(falconLanguage?.triggerSurface?.directive),
      hotpathRefs: falconLanguage?.triggerSurface?.hotpathRefs && typeof falconLanguage.triggerSurface.hotpathRefs === "object"
        ? Object.fromEntries(
          Object.entries(falconLanguage.triggerSurface.hotpathRefs).map(([key, value]) => [cleanLine(key), normalizeSourcePath(value)])
        )
        : {},
      tupleFallback: unique((Array.isArray(falconLanguage?.triggerSurface?.tupleFallback) ? falconLanguage.triggerSurface.tupleFallback : []).map((value) => cleanLine(value)))
    },
    namedAgentCount: namedAgents.length,
    namedAgents,
    councilSeatCount: councilSeats.length,
    councilSeats,
    executionFabric: {
      dispatchEnvelope: cleanLine(falconLanguage?.executionFabric?.dispatchEnvelope),
      chiefRuntime: {
        provider: cleanLine(falconLanguage?.executionFabric?.chiefRuntime?.provider),
        workerId: cleanLine(falconLanguage?.executionFabric?.chiefRuntime?.workerId),
        modelHint: cleanLine(falconLanguage?.executionFabric?.chiefRuntime?.modelHint),
        accountTier: cleanLine(falconLanguage?.executionFabric?.chiefRuntime?.accountTier),
        seatRoles: chiefSeatRoles,
        seatRoleCount: chiefSeatRoles.length,
        law: cleanLine(falconLanguage?.executionFabric?.chiefRuntime?.law)
      },
      childRuntime: {
        provider: cleanLine(falconLanguage?.executionFabric?.childRuntime?.provider),
        workerId: cleanLine(falconLanguage?.executionFabric?.childRuntime?.workerId),
        modelHint: cleanLine(falconLanguage?.executionFabric?.childRuntime?.modelHint),
        variant: cleanLine(falconLanguage?.executionFabric?.childRuntime?.variant),
        fanoutPerLane: toSafeNumber(falconLanguage?.executionFabric?.childRuntime?.fanoutPerLane),
        maxParentAgents: toSafeNumber(falconLanguage?.executionFabric?.childRuntime?.maxParentAgents),
        supportedWorkerIds: childSupportedWorkerIds,
        route: cleanLine(falconLanguage?.executionFabric?.childRuntime?.route),
        compatibilityRoute: cleanLine(falconLanguage?.executionFabric?.childRuntime?.compatibilityRoute)
      },
      omnispindle: {
        laneCount: toSafeNumber(falconLanguage?.executionFabric?.omnispindle?.laneCount),
        flywheelCount: toSafeNumber(falconLanguage?.executionFabric?.omnispindle?.flywheelCount),
        acceptsAnyAgentTypeEnvelope: falconLanguage?.executionFabric?.omnispindle?.acceptsAnyAgentTypeEnvelope === true,
        supportsAnyWorkerRouterAgent: falconLanguage?.executionFabric?.omnispindle?.supportsAnyWorkerRouterAgent === true,
        defaultAgentType: cleanLine(falconLanguage?.executionFabric?.omnispindle?.defaultAgentType),
        dispatchLaw: cleanLine(falconLanguage?.executionFabric?.omnispindle?.dispatchLaw),
        whiteRoomGate: cleanLine(falconLanguage?.executionFabric?.omnispindle?.whiteRoomGate),
        omnishannonGate: cleanLine(falconLanguage?.executionFabric?.omnispindle?.omnishannonGate),
        sourceRefs: omnispindleSourceRefs
      }
    },
    taskRouting: {
      guideId: cleanLine(falconLanguage?.taskRouting?.guideId),
      planningOnlyTaskIds,
      summonGatedTaskIds,
      executionDeniedTaskIds
    },
    omniProcessorAbsorption: {
      status: cleanLine(falconLanguage?.omniProcessorAbsorption?.status),
      route: cleanLine(falconLanguage?.omniProcessorAbsorption?.route),
      refs: omniProcessorRefs,
      trinity: {
        compute: cleanLine(falconLanguage?.omniProcessorAbsorption?.trinity?.compute),
        hardware: cleanLine(falconLanguage?.omniProcessorAbsorption?.trinity?.hardware),
        inference: cleanLine(falconLanguage?.omniProcessorAbsorption?.trinity?.inference),
        focus: trinityFocus
      },
      authorityMap: {
        mapId: cleanLine(falconLanguage?.omniProcessorAbsorption?.authorityMap?.mapId),
        path: normalizeSourcePath(falconLanguage?.omniProcessorAbsorption?.authorityMap?.path),
        authority: cleanLine(falconLanguage?.omniProcessorAbsorption?.authorityMap?.authority),
        status: cleanLine(falconLanguage?.omniProcessorAbsorption?.authorityMap?.status)
      },
      novalum: {
        specialistWave: normalizeSourcePath(falconLanguage?.omniProcessorAbsorption?.novalum?.specialistWave),
        binding: cleanLine(falconLanguage?.omniProcessorAbsorption?.novalum?.binding),
        hold: cleanLine(falconLanguage?.omniProcessorAbsorption?.novalum?.hold)
      }
    },
    packetExampleCount: packetExamples.length,
    packetExamples,
    readiness: {
      planningReady: falconLanguage?.readiness?.planningReady === true,
      summonReady: falconLanguage?.readiness?.summonReady === true,
      currentHolds,
      currentVerdict,
      summonReadyWhen,
      notes: unique((Array.isArray(falconLanguage?.readiness?.notes) ? falconLanguage.readiness.notes : []).map((value) => cleanLine(value)))
    },
    labels: {
      spec: "IX-1009",
      dialect: "IX",
      hyperlanguage: "47D",
      wave: "cube_cube_cubed",
      room: "whiteroom",
      translation: "glyph",
      boundary: "boundary_typed",
      chain: "ix-chain-orchestrate",
      languageSurface: "deep_wave_falcon_language",
      status: cleanLine(falconLanguage.status || "hold")
    },
    language: {
      human: cleanLine(`Deep-wave Falcon language ${cleanLine(falconLanguage.status || "hold")}: ${namedAgents.length} named agents, ${councilSeats.length} council seats, tuple mode ${cleanLine(falconLanguage.glyphPosture || "unknown")}, chief ${cleanLine(falconLanguage?.executionFabric?.chiefRuntime?.workerId || "unknown")} with child ${cleanLine(falconLanguage?.executionFabric?.childRuntime?.workerId || "unknown")} x${toSafeNumber(falconLanguage?.executionFabric?.childRuntime?.fanoutPerLane) || 0}, route ${cleanLine(falconLanguage?.omniProcessorAbsorption?.route || falconLanguage?.chain?.join(" -> ") || "unknown")}.`),
      agent: cleanLine(`(chief, atlas.deep_wave_falcon_language, omniverse.fabric, 8, runtime, hookwall, ${cleanLine(falconLanguage.status || "hold")}, [${councilSeats.map((entry) => entry.role).join("|") || "none"}], cube_cube_cubed, IX, log, persistent, whiteroom, light)`),
      device: cleanLine(`deep_wave_falcon_language status=${cleanLine(falconLanguage.status || "hold")} named_agents=${namedAgents.length} council_seats=${councilSeats.length} chief_worker=${cleanLine(falconLanguage?.executionFabric?.chiefRuntime?.workerId || "unknown")} child_worker=${cleanLine(falconLanguage?.executionFabric?.childRuntime?.workerId || "unknown")} child_limit=${toSafeNumber(falconLanguage?.executionFabric?.childRuntime?.fanoutPerLane) || 0} auto_translation=${cleanLine(falconLanguage.autoTranslationPath || "unknown")}`)
    }
  };
}

function getIxConnectorAudit(_options = {}) {
  const connectors = readJson(CONNECTORS_PATH);
  const declaredAudit = connectors?.declared_connector_audit || null;
  const summary = declaredAudit?.summary || {};

  return {
    ok: Boolean(declaredAudit?.ok),
    generatedAt: cleanLine(connectors?.generated_at),
    path: normalizeSourcePath(CONNECTORS_PATH),
    summary: {
      cubeRefs: Number(summary.cubeRefs || 0),
      aliasRefs: Number(summary.aliasRefs || 0),
      externalRefs: Number(summary.externalRefs || 0),
      unresolvedRefs: Number(summary.unresolvedRefs || 0)
    },
    aliases: Array.isArray(declaredAudit?.aliases) ? declaredAudit.aliases.slice() : [],
    externalRefs: Array.isArray(declaredAudit?.externalRefs)
      ? declaredAudit.externalRefs.map((entry) => ({
        cube: cleanLine(entry?.cube),
        refersTo: cleanLine(entry?.refers_to || entry?.refersTo),
        label: cleanLine(entry?.label),
        status: cleanLine(entry?.status || "external"),
        resolvedId: cleanLine(entry?.resolvedId),
        referenceClass: cleanLine(entry?.referenceClass),
        note: cleanLine(entry?.note)
      }))
      : []
  };
}

function queryIxAtlasSurfaces(filters = {}, options = {}) {
  const registry = getIxSurfaceRegistry(options);
  if (!registry) {
    return {
      ok: false,
      count: 0,
      surfaces: []
    };
  }

  const groupId = cleanLine(filters.groupId).toLowerCase();
  const surfaceClass = cleanLine(filters.surfaceClass).toLowerCase();
  const search = cleanLine(filters.search).toLowerCase();
  const safeLimit = Math.max(1, Math.min(500, Number(filters.limit) || 100));

  let surfaces = Array.isArray(registry.surfaces) ? registry.surfaces.slice() : [];

  if (groupId) {
    surfaces = surfaces.filter((surface) => String(surface.groupId || "").toLowerCase() === groupId);
  }
  if (surfaceClass) {
    surfaces = surfaces.filter((surface) => String(surface.surfaceClass || "").toLowerCase() === surfaceClass);
  }
  if (search) {
    surfaces = surfaces.filter((surface) => {
      const haystack = [
        surface.id,
        surface.groupId,
        surface.groupTitle,
        surface.label,
        surface.relativePath,
        surface.absolutePath,
        ...(Array.isArray(surface.notes) ? surface.notes : [])
      ].join("\n").toLowerCase();
      return haystack.includes(search);
    });
  }

  return {
    ok: true,
    count: surfaces.length,
    surfaces: surfaces.slice(0, safeLimit)
  };
}

function pickRoleSurfaceId(surfaceRegistry, role) {
  const normalizedRole = cleanLine(role).toLowerCase();
  if (!normalizedRole) return "";
  const roleSurface = (surfaceRegistry?.surfaces || []).find((surface) =>
    String(surface.groupId || "") === "agent-role-surfaces"
    && String(surface.label || "").trim().toLowerCase() === normalizedRole
  );
  return roleSurface ? String(roleSurface.id || "") : "";
}

function findMatchingSurfaces(surfaceRegistry, sourcePaths = []) {
  const normalizedSourcePaths = unique(sourcePaths.map((value) => normalizeSourcePath(value)));
  if (normalizedSourcePaths.length < 1) {
    return {
      sourcePaths: [],
      surfaces: [],
      surfaceIds: [],
      groupIds: []
    };
  }

  const surfaces = (surfaceRegistry?.surfaces || []).filter((surface) => {
    const candidates = unique([
      normalizeSourcePath(surface.relativePath),
      normalizeSourcePath(surface.absolutePath)
    ]);
    return candidates.some((candidate) => normalizedSourcePaths.includes(candidate));
  });

  return {
    sourcePaths: normalizedSourcePaths,
    surfaces,
    surfaceIds: unique(surfaces.map((surface) => cleanLine(surface.id))),
    groupIds: unique(surfaces.map((surface) => cleanLine(surface.groupId)))
  };
}

function inferLaneId(input = {}) {
  const route = cleanLine(input.route).toLowerCase();
  if (ROUTE_TO_LANE[route]) {
    return ROUTE_TO_LANE[route];
  }

  const groupIds = new Set(Array.isArray(input.groupIds) ? input.groupIds : []);
  const sourcePaths = Array.isArray(input.sourcePaths) ? input.sourcePaths : [];

  if (groupIds.has("sovereign-device-surfaces") || groupIds.has("scoped-device-surfaces")) {
    return "desktop-phone-mirror";
  }
  if (groupIds.has("hook-audit-surfaces") || groupIds.has("runtime-query-surfaces")) {
    return "gateway-runtime-routing";
  }
  if (sourcePaths.some((value) => /localops|selector|deployment/i.test(value))) {
    return "local-ops-tooling";
  }
  if (sourcePaths.some((value) => /phone|mirror|adb|scrcpy|termux/i.test(value))) {
    return "desktop-phone-mirror";
  }
  if (sourcePaths.some((value) => /chrome|browser|slack|telegram|github|google|microsoft|atlassian/i.test(value))) {
    return "browser-integrations";
  }
  if (groupIds.has("entry-surfaces") || sourcePaths.some((value) => /agent-index|behcs\/index/i.test(value))) {
    return "memory-index-docs";
  }
  return "";
}

function inferConnectorLaneId(entry = {}, surface = null) {
  const noteMap = parseKeyValueNotes(surface?.notes || []);
  const sourcePaths = unique([
    normalizeSourcePath(surface?.relativePath),
    normalizeSourcePath(surface?.absolutePath)
  ]).filter(Boolean);

  if (sourcePaths.length > 0) {
    const inferredFromPath = inferLaneId({
      route: "",
      groupIds: [cleanLine(surface?.groupId)],
      sourcePaths
    });
    if (inferredFromPath) {
      return inferredFromPath;
    }
  }

  const referenceClass = cleanLine(entry.referenceClass || noteMap.referenceClass).toLowerCase();
  if (CONNECTOR_REFERENCE_CLASS_TO_LANE[referenceClass]) {
    return CONNECTOR_REFERENCE_CLASS_TO_LANE[referenceClass];
  }

  const fallbackHaystack = [
    cleanLine(entry.refersTo),
    cleanLine(entry.label),
    cleanLine(surface?.label),
    cleanLine(noteMap.declaredBy),
    cleanLine(noteMap.connectorLabel)
  ].join("\n").toLowerCase();

  if (/slack|telegram|github|google|microsoft|atlassian|browser/.test(fallbackHaystack)) {
    return "browser-integrations";
  }
  if (/phone|mirror|termux|device/.test(fallbackHaystack)) {
    return "desktop-phone-mirror";
  }
  return cleanLine(surface?.surfaceClass) === "file_surface" ? "memory-index-docs" : "gateway-runtime-routing";
}

function buildConnectorExternalSurfaceEntries(bundle, connectorAudit) {
  const registry = bundle.surfaceRegistry || {};
  const promotionQueue = bundle.promotionQueue || {};
  const connectorSurfaces = getGroupSurfaces(registry, "connector-external-surfaces");
  const byId = new Map();
  const byLabel = new Map();

  for (const surface of connectorSurfaces) {
    const id = cleanLine(surface.id).toLowerCase();
    const label = cleanLine(surface.label).toLowerCase();
    if (id) byId.set(id, surface);
    if (label) byLabel.set(label, surface);
  }

  const entryMap = new Map();

  function ensureEntry(surface, ref = null) {
    const noteMap = parseKeyValueNotes(surface?.notes || []);
    const key = cleanLine(surface?.id || ref?.resolvedId || ref?.refersTo || ref?.cube || "connector-external");
    if (entryMap.has(key)) {
      return entryMap.get(key);
    }

    const referenceClass = cleanLine(ref?.referenceClass || noteMap.referenceClass);
    const laneId = inferConnectorLaneId({ ...ref, referenceClass }, surface);
    const lane = getLaneById(promotionQueue, laneId);
    const entry = {
      surfaceId: cleanLine(surface?.id || ref?.resolvedId),
      groupId: cleanLine(surface?.groupId || "connector-external-surfaces"),
      groupTitle: cleanLine(surface?.groupTitle || "Connector External Surfaces"),
      refersTo: cleanLine(ref?.refersTo || surface?.label),
      label: cleanLine(surface?.label || ref?.refersTo),
      surfaceClass: cleanLine(surface?.surfaceClass || (ref ? "runtime_surface" : "")),
      relativePath: normalizeSourcePath(surface?.relativePath),
      absolutePath: normalizeSourcePath(surface?.absolutePath),
      exists: surface && Object.prototype.hasOwnProperty.call(surface, "exists") ? surface.exists : null,
      referenceClass,
      note: cleanLine(ref?.note || noteMap.note),
      laneId,
      laneOrder: Number(lane?.order || 0),
      laneStatus: cleanLine(lane?.status),
      laneCurrentStage: cleanLine(lane?.currentStage),
      laneNextStage: cleanLine(lane?.nextStage),
      declaredBy: [],
      cubes: [],
      connectorLabels: [],
      refCount: 0,
      references: []
    };

    entryMap.set(key, entry);
    return entry;
  }

  for (const ref of connectorAudit.externalRefs || []) {
    const surface = byId.get(cleanLine(ref.resolvedId).toLowerCase())
      || byLabel.get(cleanLine(ref.refersTo).toLowerCase())
      || null;
    const noteMap = parseKeyValueNotes(surface?.notes || []);
    const entry = ensureEntry(surface, ref);

    entry.refCount += 1;
    if (ref.cube) entry.cubes.push(ref.cube);
    if (ref.cube) entry.declaredBy.push(ref.cube);
    if (noteMap.declaredBy) entry.declaredBy.push(noteMap.declaredBy);
    if (ref.label) entry.connectorLabels.push(ref.label);
    if (noteMap.connectorLabel) entry.connectorLabels.push(noteMap.connectorLabel);
    entry.references.push({
      cube: ref.cube,
      label: ref.label,
      status: ref.status,
      resolvedId: ref.resolvedId,
      note: ref.note
    });
  }

  for (const surface of connectorSurfaces) {
    ensureEntry(surface);
  }

  return Array.from(entryMap.values())
    .map((entry) => ({
      ...entry,
      declaredBy: unique(entry.declaredBy),
      cubes: unique(entry.cubes),
      connectorLabels: unique(entry.connectorLabels)
    }))
    .sort((left, right) => {
      const laneDelta = Number(left.laneOrder || 0) - Number(right.laneOrder || 0);
      if (laneDelta !== 0) return laneDelta;
      return cleanLine(left.label).localeCompare(cleanLine(right.label));
    });
}

function queryIxConnectorExternalSurfaces(filters = {}, options = {}) {
  const bundle = loadIxFabricAtlasBundle(options);
  if (!bundle.enabled) {
    return {
      ok: false,
      count: 0,
      summary: {
        runtimeSurfaceCount: 0,
        fileSurfaceCount: 0,
        referenceCount: 0,
        laneIds: [],
        referenceClasses: []
      },
      surfaces: []
    };
  }

  const laneId = cleanLine(filters.laneId).toLowerCase();
  const surfaceClass = cleanLine(filters.surfaceClass).toLowerCase();
  const referenceClass = cleanLine(filters.referenceClass).toLowerCase();
  const search = cleanLine(filters.search).toLowerCase();
  const safeLimit = Math.max(1, Math.min(500, Number(filters.limit) || 100));

  let surfaces = buildConnectorExternalSurfaceEntries(bundle, getIxConnectorAudit(options));

  if (laneId) {
    surfaces = surfaces.filter((surface) => cleanLine(surface.laneId).toLowerCase() === laneId);
  }
  if (surfaceClass) {
    surfaces = surfaces.filter((surface) => cleanLine(surface.surfaceClass).toLowerCase() === surfaceClass);
  }
  if (referenceClass) {
    surfaces = surfaces.filter((surface) => cleanLine(surface.referenceClass).toLowerCase() === referenceClass);
  }
  if (search) {
    surfaces = surfaces.filter((surface) => {
      const haystack = [
        surface.surfaceId,
        surface.refersTo,
        surface.label,
        surface.groupId,
        surface.surfaceClass,
        surface.referenceClass,
        surface.note,
        surface.relativePath,
        surface.absolutePath,
        surface.laneId,
        ...(surface.declaredBy || []),
        ...(surface.cubes || []),
        ...(surface.connectorLabels || [])
      ].join("\n").toLowerCase();
      return haystack.includes(search);
    });
  }

  return {
    ok: true,
    count: surfaces.length,
    summary: {
      runtimeSurfaceCount: surfaces.filter((surface) => cleanLine(surface.surfaceClass) === "runtime_surface").length,
      fileSurfaceCount: surfaces.filter((surface) => cleanLine(surface.surfaceClass) === "file_surface").length,
      existingSurfaceCount: surfaces.filter((surface) => surface.exists === true).length,
      referenceCount: surfaces.reduce((sum, surface) => sum + Number(surface.refCount || 0), 0),
      laneIds: unique(surfaces.map((surface) => cleanLine(surface.laneId)).filter(Boolean)),
      referenceClasses: unique(surfaces.map((surface) => cleanLine(surface.referenceClass)).filter(Boolean))
    },
    surfaces: surfaces.slice(0, safeLimit)
  };
}

function buildLaneSummaries(bundle, connectorSurfaces = []) {
  const registrySurfaces = Array.isArray(bundle.surfaceRegistry?.surfaces) ? bundle.surfaceRegistry.surfaces : [];
  const transitionLanes = Array.isArray(bundle.promotionQueue?.transitionLanes) ? bundle.promotionQueue.transitionLanes : [];

  return transitionLanes
    .map((lane) => {
      const declaredSurfaceIds = unique((lane.surfaceRefs || []).map((surfaceId) => cleanLine(surfaceId)));
      const declaredSurfaces = registrySurfaces.filter((surface) => declaredSurfaceIds.includes(cleanLine(surface.id)));
      const boundConnectorSurfaces = connectorSurfaces.filter((surface) => cleanLine(surface.laneId) === cleanLine(lane.id));

      return {
        id: cleanLine(lane.id),
        order: Number(lane.order || 0),
        owner: Array.isArray(lane.owner) ? lane.owner.filter(Boolean) : [],
        status: cleanLine(lane.status),
        currentStage: cleanLine(lane.currentStage),
        nextStage: cleanLine(lane.nextStage),
        focus: cleanLine(lane.focus),
        declaredSurfaceCount: declaredSurfaceIds.length,
        declaredSurfaceIds,
        matchedSurfaceCount: declaredSurfaces.length,
        matchedSurfaceIds: unique(declaredSurfaces.map((surface) => cleanLine(surface.id))),
        externalSurfaceCount: boundConnectorSurfaces.length,
        externalRuntimeSurfaceCount: boundConnectorSurfaces.filter((surface) => cleanLine(surface.surfaceClass) === "runtime_surface").length,
        externalFileSurfaceCount: boundConnectorSurfaces.filter((surface) => cleanLine(surface.surfaceClass) === "file_surface").length,
        externalSurfaceIds: unique(boundConnectorSurfaces.map((surface) => cleanLine(surface.surfaceId || surface.refersTo))),
        readiness: cleanLine(lane.status) === "in_progress"
          ? "active"
          : boundConnectorSurfaces.length > 0
            ? "queue_ready"
            : "pending"
      };
    })
    .sort((left, right) => Number(left.order || 0) - Number(right.order || 0));
}

function buildOrchestrationRecommendations(laneSummaries = [], fileCapStatus = {}, connectorAudit = {}, controllerGuards = null) {
  const recommendations = [];
  const activeLane = laneSummaries.find((lane) => cleanLine(lane.status) === "in_progress") || null;
  const nextQueueLane = laneSummaries.find((lane) =>
    cleanLine(lane.status) !== "in_progress" && Number(lane.externalSurfaceCount || 0) > 0
  ) || null;

  if (activeLane) {
    recommendations.push({
      id: "advance-active-lane",
      priority: 1,
      laneId: activeLane.id,
      status: "execute",
      action: `Advance ${activeLane.id} from ${activeLane.currentStage} toward ${activeLane.nextStage} with white-room proof preserved.`
    });
  }
  if (nextQueueLane) {
    recommendations.push({
      id: "bind-next-queue-lane",
      priority: 2,
      laneId: nextQueueLane.id,
      status: "queue_ready",
      action: `Bind ${nextQueueLane.externalSurfaceCount} connector external surfaces into ${nextQueueLane.id} before broader promotion.`
    });
  }
  recommendations.push({
    id: "keep-file-cap-guard",
    priority: recommendations.length + 1,
    laneId: "gc-gulp",
    status: cleanLine(fileCapStatus.status || "unknown"),
    action: `Keep tracked files below ${Number(fileCapStatus.maxTrackedFiles || 0)}; current remaining budget is ${Number(fileCapStatus.remaining || 0)}.`
  });
  recommendations.push({
    id: "connector-audit-discipline",
    priority: recommendations.length + 1,
    laneId: "gateway-runtime-routing",
    status: Number(connectorAudit?.summary?.unresolvedRefs || 0) > 0 ? "hold" : "pass",
    action: `Maintain connector audit discipline with ${Number(connectorAudit?.summary?.externalRefs || 0)} external refs and ${Number(connectorAudit?.summary?.unresolvedRefs || 0)} unresolved.`
  });
  if (controllerGuards && typeof controllerGuards === "object") {
    recommendations.push({
      id: "controller-guards",
      priority: recommendations.length + 1,
      laneId: "controller-guards",
      status: cleanLine(controllerGuards.gateStatus || "hold"),
      action: `Keep controller guard surface ${cleanLine(controllerGuards.gateStatus || "hold")} across ${Number(controllerGuards.guardCount || 0)} guards before wider lane promotion.`
    });
  }
  recommendations.push({
    id: "storage-boot-last",
    priority: recommendations.length + 1,
    laneId: "storage-boot",
    status: "deny_until_proofs",
    action: "Keep storage and boot promotion last until white-room proof and bounded live promotion are explicit."
  });
  return recommendations;
}

function buildOrchestrationLanguage(input = {}) {
  const activeLaneIds = unique(input.activeLaneIds || []);
  const activeLaneText = activeLaneIds.length > 0 ? activeLaneIds.join(",") : "none";
  const nextLaneId = cleanLine(input.nextLaneId || "") || "none";
  const controllerStatus = cleanLine(input.controllerStatus || "hold");
  return {
    human: cleanLine(`Orchestration ${controllerStatus}: ${Number(input.externalSurfaceCount || 0)} external surfaces mapped, active lanes ${activeLaneText}, next lane ${nextLaneId}, file cap ${Number(input.trackedFiles || 0)}/${Number(input.maxTrackedFiles || 0)}.`),
    agent: cleanLine(`(chief, atlas.orchestration, omniverse.fabric, 5, runtime, hookwall, ${controllerStatus}, [${nextLaneId}], map_map_mapped, IX, log, persistent, whiteroom, light)`),
    device: cleanLine(`orchestration status=${controllerStatus} active=${activeLaneText} next=${nextLaneId} file_cap=${cleanLine(input.fileCapStatus || "unknown")} tracked=${Number(input.trackedFiles || 0)}/${Number(input.maxTrackedFiles || 0)} external=${Number(input.externalSurfaceCount || 0)}`)
  };
}

function getIxOrchestrationStatus(options = {}) {
  const bundle = loadIxFabricAtlasBundle(options);
  const atlasStatus = getIxFabricAtlasStatus(options);
  const connectorAudit = getIxConnectorAudit(options);
  const fileCap = summarizeFileCapStatus(evaluateFileCap({ reason: "ix_orchestration_status" }));
  const controllerGuards = getIxControllerGuards({ fileCap });

  if (!bundle.enabled) {
    return {
      ok: false,
      enabled: false,
      atlas: atlasStatus,
      connectorAudit,
      fileCap,
      guards: controllerGuards,
      surfaceGroups: {},
      laneSummary: [],
      controller: {
        ready: false,
        status: "hold",
        activeLaneIds: [],
        queueReadyLaneIds: [],
        nextLaneId: "",
        nextLaneStage: "",
        activeLaneCount: 0,
        queueReadyLaneCount: 0,
        laneStatusCounts: {},
        externalSurfaceCoverage: {
          total: 0,
          runtimeSurfaceCount: 0,
          fileSurfaceCount: 0,
          mappedLaneCount: 0,
          referenceCount: 0
        },
        proofBudget: {
          status: cleanLine(fileCap.status),
          trackedFiles: Number(fileCap.trackedFiles || 0),
          remaining: Number(fileCap.remaining || 0),
          maxTrackedFiles: Number(fileCap.maxTrackedFiles || 0),
          warnAt: Number(fileCap.warnAt || 0),
          gcTriggerMessages: Number(fileCap.gcTriggerMessages || 0)
        },
        guardSummary: controllerGuards.summary
      },
      labels: {
        spec: "IX-706",
        dialect: "IX",
        hyperlanguage: "47D",
        wave: "map_map_mapped",
        room: "whiteroom",
        translation: "glyph",
        boundary: "boundary_typed",
        chain: "ix-chain-orchestrate",
        status: "hold",
        connectorAudit: connectorAudit.ok ? "pass" : "hold",
        fileCap: cleanLine(fileCap.status),
        guards: cleanLine(controllerGuards.gateStatus)
      },
      language: buildOrchestrationLanguage({
        controllerStatus: "hold",
        externalSurfaceCount: 0,
        activeLaneIds: [],
        nextLaneId: "",
        fileCapStatus: cleanLine(fileCap.status),
        trackedFiles: Number(fileCap.trackedFiles || 0),
        maxTrackedFiles: Number(fileCap.maxTrackedFiles || 0)
      }),
      recommendations: buildOrchestrationRecommendations([], fileCap, connectorAudit, controllerGuards)
    };
  }

  const connectorSurfaces = buildConnectorExternalSurfaceEntries(bundle, connectorAudit);
  const laneSummary = buildLaneSummaries(bundle, connectorSurfaces);
  const activeLanes = laneSummary.filter((lane) => cleanLine(lane.status) === "in_progress");
  const queueReadyLanes = laneSummary.filter((lane) =>
    cleanLine(lane.status) !== "in_progress" && Number(lane.externalSurfaceCount || 0) > 0
  );
  const nextLane = queueReadyLanes[0] || laneSummary.find((lane) => cleanLine(lane.status) === "pending") || null;
  const controllerStatus = cleanLine(fileCap.status) === "deny" || !connectorAudit.ok
    ? "hold"
    : activeLanes.length > 0
      ? "executing"
      : "ready";
  const mappedLaneIds = unique(connectorSurfaces.map((surface) => cleanLine(surface.laneId)).filter(Boolean));
  const connectorGroupSummary = {
    ...summarizeSurfaceGroup(bundle.surfaceRegistry, "connector-external-surfaces"),
    mappedSurfaceCount: connectorSurfaces.length,
    referenceCount: Number(connectorAudit.summary.externalRefs || 0),
    laneIds: mappedLaneIds,
    referenceClasses: unique(connectorSurfaces.map((surface) => cleanLine(surface.referenceClass)).filter(Boolean))
  };

  return {
    ok: true,
    enabled: true,
    loadedAt: bundle.loadedAt,
    atlasId: atlasStatus.atlasId,
    surfaceRegistryId: atlasStatus.surfaceRegistryId,
    promotionQueueId: atlasStatus.promotionQueueId,
    paths: {
      atlas: normalizeSourcePath(ATLAS_PATH),
      surfaceRegistry: normalizeSourcePath(SURFACE_REGISTRY_PATH),
      promotionQueue: normalizeSourcePath(PROMOTION_QUEUE_PATH),
      connectors: normalizeSourcePath(CONNECTORS_PATH)
    },
    posture: { ...(bundle.promotionQueue?.status || {}) },
    atlas: atlasStatus,
    connectorAudit,
    fileCap,
    guards: controllerGuards,
    surfaceGroups: {
      connectorExternalSurfaces: connectorGroupSummary,
      whiteRoomGcSurfaces: summarizeSurfaceGroup(bundle.surfaceRegistry, "white-room-gc-surfaces")
    },
    laneSummary,
    controller: {
      ready: controllerStatus !== "hold",
      status: controllerStatus,
      activeLaneIds: activeLanes.map((lane) => lane.id),
      queueReadyLaneIds: queueReadyLanes.map((lane) => lane.id),
      nextLaneId: cleanLine(nextLane?.id),
      nextLaneStage: cleanLine(nextLane?.nextStage),
      activeLaneCount: activeLanes.length,
      queueReadyLaneCount: queueReadyLanes.length,
      laneStatusCounts: summarizeLaneStatusCounts(laneSummary),
      externalSurfaceCoverage: {
        total: connectorSurfaces.length,
        runtimeSurfaceCount: connectorSurfaces.filter((surface) => cleanLine(surface.surfaceClass) === "runtime_surface").length,
        fileSurfaceCount: connectorSurfaces.filter((surface) => cleanLine(surface.surfaceClass) === "file_surface").length,
        mappedLaneCount: mappedLaneIds.length,
        referenceCount: Number(connectorAudit.summary.externalRefs || 0)
      },
      proofBudget: {
        status: cleanLine(fileCap.status),
        trackedFiles: Number(fileCap.trackedFiles || 0),
        remaining: Number(fileCap.remaining || 0),
        maxTrackedFiles: Number(fileCap.maxTrackedFiles || 0),
        warnAt: Number(fileCap.warnAt || 0),
        gcTriggerMessages: Number(fileCap.gcTriggerMessages || 0)
      },
      guardSummary: controllerGuards.summary
    },
    labels: {
      spec: "IX-706",
      dialect: "IX",
      hyperlanguage: "47D",
      wave: "map_map_mapped",
      room: "whiteroom",
      translation: "glyph",
      boundary: "boundary_typed",
      chain: "ix-chain-orchestrate",
      status: controllerStatus,
      connectorAudit: connectorAudit.ok ? "pass" : "hold",
      fileCap: cleanLine(fileCap.status),
      guards: cleanLine(controllerGuards.gateStatus),
      activeLane: cleanLine(activeLanes[0]?.id),
      nextLane: cleanLine(nextLane?.id)
    },
    language: buildOrchestrationLanguage({
      controllerStatus,
      externalSurfaceCount: connectorSurfaces.length,
      activeLaneIds: activeLanes.map((lane) => lane.id),
      nextLaneId: cleanLine(nextLane?.id),
      fileCapStatus: cleanLine(fileCap.status),
      trackedFiles: Number(fileCap.trackedFiles || 0),
      maxTrackedFiles: Number(fileCap.maxTrackedFiles || 0)
    }),
    recommendations: buildOrchestrationRecommendations(laneSummary, fileCap, connectorAudit, controllerGuards)
  };
}

function buildSelfBuildTaskList(recommendations = [], taskLimit = 5) {
  const safeLimit = Math.max(1, Math.min(10, Number(taskLimit) || 5));
  return (Array.isArray(recommendations) ? recommendations : [])
    .slice()
    .sort((left, right) => Number(left?.priority || 0) - Number(right?.priority || 0))
    .slice(0, safeLimit)
    .map((entry, index) => ({
      id: cleanLine(entry?.id || `task-${index + 1}`),
      order: index + 1,
      priority: Number(entry?.priority || index + 1),
      laneId: cleanLine(entry?.laneId),
      status: cleanLine(entry?.status || "queue_ready"),
      action: cleanLine(entry?.action),
      bounded: true,
      localOnly: true
    }));
}

function getIxSelfBuildControllerPacket(options = {}) {
  const orchestration = getIxOrchestrationStatus(options);
  const controller = orchestration?.controller || {};
  const laneSummary = Array.isArray(orchestration?.laneSummary) ? orchestration.laneSummary : [];
  const activeLaneId = cleanLine(controller.activeLaneIds?.[0]);
  const nextLaneId = cleanLine(controller.nextLaneId || controller.queueReadyLaneIds?.[0]);
  const activeLane = laneSummary.find((lane) => cleanLine(lane?.id) === activeLaneId) || null;
  const nextLane = laneSummary.find((lane) => cleanLine(lane?.id) === nextLaneId) || null;
  const guardSummary = controller.guardSummary && typeof controller.guardSummary === "object"
    ? controller.guardSummary
    : {};
  const guardPosture = {
    gateStatus: cleanLine(orchestration?.guards?.gateStatus || guardSummary.gateStatus || "hold"),
    passCount: toSafeNumber(guardSummary.passCount),
    warnCount: toSafeNumber(guardSummary.warnCount),
    holdCount: toSafeNumber(guardSummary.holdCount),
    denyCount: toSafeNumber(guardSummary.denyCount)
  };
  const proofBudget = controller.proofBudget && typeof controller.proofBudget === "object"
    ? {
      status: cleanLine(controller.proofBudget.status || "hold"),
      trackedFiles: toSafeNumber(controller.proofBudget.trackedFiles),
      remaining: toSafeNumber(controller.proofBudget.remaining),
      maxTrackedFiles: toSafeNumber(controller.proofBudget.maxTrackedFiles),
      warnAt: toSafeNumber(controller.proofBudget.warnAt),
      gcTriggerMessages: toSafeNumber(controller.proofBudget.gcTriggerMessages)
    }
    : {
      status: "hold",
      trackedFiles: 0,
      remaining: 0,
      maxTrackedFiles: 0,
      warnAt: 0,
      gcTriggerMessages: 0
    };
  const recommendedTasks = buildSelfBuildTaskList(orchestration?.recommendations, options.taskLimit);
  const controllerStatus = cleanLine(controller.status || "hold");
  const labels = {
    spec: "IX-712",
    dialect: "IX",
    hyperlanguage: "47D",
    wave: "cube_cube_cubed",
    room: "whiteroom",
    translation: "glyph",
    boundary: "boundary_typed",
    chain: "ix-chain-orchestrate",
    packet: "self_build_controller_packet",
    status: controllerStatus,
    guardStatus: cleanLine(guardPosture.gateStatus),
    activeLane: cleanLine(activeLane?.id),
    nextLane: cleanLine(nextLane?.id)
  };

  return {
    ok: Boolean(orchestration?.ok),
    enabled: Boolean(orchestration?.enabled),
    packetType: "self_build_controller_packet.v1",
    generatedAt: new Date().toISOString(),
    localOnly: true,
    bounded: true,
    noPromotionClaims: true,
    atlasId: cleanLine(orchestration?.atlasId),
    surfaceRegistryId: cleanLine(orchestration?.surfaceRegistryId),
    promotionQueueId: cleanLine(orchestration?.promotionQueueId),
    controllerStatus,
    activeLane: activeLane
      ? {
        id: cleanLine(activeLane.id),
        status: cleanLine(activeLane.status),
        currentStage: cleanLine(activeLane.currentStage),
        nextStage: cleanLine(activeLane.nextStage),
        readiness: cleanLine(activeLane.readiness)
      }
      : null,
    nextQueueReadyLane: nextLane
      ? {
        id: cleanLine(nextLane.id),
        status: cleanLine(nextLane.status),
        currentStage: cleanLine(nextLane.currentStage),
        nextStage: cleanLine(nextLane.nextStage),
        readiness: cleanLine(nextLane.readiness)
      }
      : null,
    guardPosture,
    proofBudget,
    recommendedTasks,
    labels,
    language: {
      human: cleanLine(`Self-build packet ${controllerStatus}: active lane ${cleanLine(activeLane?.id) || "none"}, next queue-ready lane ${cleanLine(nextLane?.id) || "none"}, guards ${guardPosture.gateStatus}, proof budget ${proofBudget.trackedFiles}/${proofBudget.maxTrackedFiles}.`),
      agent: cleanLine(`(chief, atlas.self_build_controller, omniverse.fabric, 6, runtime, hookwall, ${controllerStatus}, [${cleanLine(nextLane?.id) || "none"}], cube_cube_cubed, IX, log, persistent, whiteroom, light)`),
      device: cleanLine(`self_build_packet status=${controllerStatus} active_lane=${cleanLine(activeLane?.id) || "none"} next_lane=${cleanLine(nextLane?.id) || "none"} guard=${guardPosture.gateStatus} files=${proofBudget.trackedFiles}/${proofBudget.maxTrackedFiles}`)
    }
  };
}

function resolveIxLaneBinding(options = {}) {
  const bundle = loadIxFabricAtlasBundle(options);
  const route = cleanLine(options.route);
  const routeStage = cleanLine(options.routeStage);
  const role = cleanLine(options.role);
  const explicitLaneId = cleanLine(options.laneId);
  const explicitLaneSurfaceRefs = unique((Array.isArray(options.laneSurfaceRefs) ? options.laneSurfaceRefs : [])
    .map((value) => cleanLine(value)));

  if (!bundle.enabled) {
    return {
      enabled: false,
      route,
      routeStage,
      role,
      laneId: explicitLaneId,
      laneStatus: "",
      laneCurrentStage: "",
      laneNextStage: "",
      declaredLaneSurfaceIds: explicitLaneSurfaceRefs,
      declaredLaneSurfaceMatchCount: 0,
      explicitLaneBound: false,
      explicitLaneSurfaceRefCount: explicitLaneSurfaceRefs.length
    };
  }

  const sourceMatch = findMatchingSurfaces(bundle.surfaceRegistry, options.sourcePaths || []);
  const roleSurfaceId = pickRoleSurfaceId(bundle.surfaceRegistry, role);
  const transitionLanes = Array.isArray(bundle.promotionQueue?.transitionLanes) ? bundle.promotionQueue.transitionLanes : [];
  const explicitLane = explicitLaneId
    ? transitionLanes.find((entry) => cleanLine(entry.id) === explicitLaneId) || null
    : null;
  const inferredLaneId = inferLaneId({
    route,
    groupIds: sourceMatch.groupIds,
    sourcePaths: sourceMatch.sourcePaths
  });
  const laneId = cleanLine(explicitLane?.id || explicitLaneId || inferredLaneId);
  const lane = transitionLanes.find((entry) => cleanLine(entry.id) === laneId) || null;
  const declaredLaneSurfaceIds = unique([
    ...explicitLaneSurfaceRefs,
    ...((Array.isArray(lane?.surfaceRefs) ? lane.surfaceRefs : []).map((value) => cleanLine(value)))
  ]);
  const matchingSurfaceIdSet = new Set(sourceMatch.surfaceIds.map((value) => cleanLine(value)));
  const declaredLaneSurfaceMatches = declaredLaneSurfaceIds.filter((surfaceId) => matchingSurfaceIdSet.has(cleanLine(surfaceId)));

  return {
    enabled: true,
    atlasId: bundle.atlas?.atlasId || "",
    surfaceRegistryId: bundle.surfaceRegistry?.registryId || "",
    promotionQueueId: bundle.promotionQueue?.queueId || "",
    route,
    routeStage,
    role,
    roleSurfaceId,
    sourcePaths: sourceMatch.sourcePaths,
    matchingSurfaceIds: sourceMatch.surfaceIds,
    matchingGroupIds: sourceMatch.groupIds,
    laneId,
    laneStatus: cleanLine(lane?.status || ""),
    laneCurrentStage: cleanLine(lane?.currentStage || ""),
    laneNextStage: cleanLine(lane?.nextStage || ""),
    laneOrder: Number(lane?.order || 0),
    laneFocus: cleanLine(lane?.focus || ""),
    laneOwner: Array.isArray(lane?.owner) ? lane.owner.filter(Boolean) : [],
    declaredLaneSurfaceIds,
    declaredLaneSurfaceMatchCount: declaredLaneSurfaceMatches.length,
    declaredLaneSurfaceMatches,
    explicitLaneBound: Boolean(explicitLaneId),
    explicitLaneMatched: Boolean(explicitLaneId && lane),
    explicitLaneSurfaceRefCount: explicitLaneSurfaceRefs.length,
    inferredLaneId
  };
}

function resolveIxRuntimeBinding(options = {}) {
  const laneBinding = resolveIxLaneBinding(options);
  return {
    enabled: laneBinding.enabled,
    atlasId: laneBinding.atlasId || "",
    surfaceRegistryId: laneBinding.surfaceRegistryId || "",
    promotionQueueId: laneBinding.promotionQueueId || "",
    route: cleanLine(laneBinding.route),
    routeStage: cleanLine(laneBinding.routeStage),
    role: cleanLine(laneBinding.role),
    roleSurfaceId: cleanLine(laneBinding.roleSurfaceId),
    sourcePaths: Array.isArray(laneBinding.sourcePaths) ? laneBinding.sourcePaths : [],
    matchingSurfaceIds: Array.isArray(laneBinding.matchingSurfaceIds) ? laneBinding.matchingSurfaceIds : [],
    matchingGroupIds: Array.isArray(laneBinding.matchingGroupIds) ? laneBinding.matchingGroupIds : [],
    laneId: cleanLine(laneBinding.laneId),
    laneStatus: cleanLine(laneBinding.laneStatus),
    laneCurrentStage: cleanLine(laneBinding.laneCurrentStage),
    laneNextStage: cleanLine(laneBinding.laneNextStage)
  };
}

module.exports = {
  ATLAS_PATH,
  SURFACE_REGISTRY_PATH,
  PROMOTION_QUEUE_PATH,
  CROSSWALK_PATH,
  GUIDE_PATH,
  FALCON_LANGUAGE_PATH,
  CONNECTORS_PATH,
  loadIxFabricAtlasBundle,
  getIxFabricAtlasStatus,
  getIxSurfaceRegistry,
  getIxPromotionQueue,
  getIxDeepWaveCrosswalk,
  getIxDeepWaveAgentGuide,
  getIxDeepWaveFalconLanguage,
  getIxConnectorAudit,
  getIxControllerGuards,
  getIxOrchestrationStatus,
  getIxSelfBuildControllerPacket,
  queryIxAtlasSurfaces,
  queryIxConnectorExternalSurfaces,
  resolveIxLaneBinding,
  resolveIxRuntimeBinding
};
