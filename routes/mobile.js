/**
 * Mobile Routes — extracted from server.js (ADR-0001 Phase 3)
 * All /api/mobile/* endpoints.
 */
const express = require("express");
const { asBool, asEnum, asInt, respondError, inferHttpStatusForError, queueReply } = require("../lib/helpers");
const { isLoopbackRequest } = require("../lib/network");
const { requireMobileAuth, requireMobileDirectControlEnabled, requireDesktopSuperMasterAuthority } = require("../lib/mobileAuth");
const settingsLib = require("../lib/settings");
const runtimeStateLib = require("../lib/runtimeState");
const { appendHookEvent } = require("../src/hookEventStore");
const { buildRouteHookEnvelope } = require("../src/hg256RuntimeContract");
const {
  resolveIxRuntimeBinding,
  resolveIxLaneBinding
} = require("../src/ixFabricAtlasStore");

function createMobileRouter(ctx) {
  const router = express.Router();
  const settings = settingsLib.get();
  const runtimeState = runtimeStateLib.get();
  const app = {
    get: (path, ...h) => router.get(path, ...h),
    post: (path, ...h) => router.post(path, ...h),
    put: (path, ...h) => router.put(path, ...h),
    delete: (path, ...h) => router.delete(path, ...h)
  };
  const {
    noteChannelHeartbeat, resolveDesktopSuperMasterAccess, listApprovals,
    getConnectionRoutingState, getStoreSummary, runtimeSecrets, maskSensitive,
    getMobileControlSummary, buildMobileInboxState, buildMobileBootstrapPayload,
    getWorkOrgPolicySummary, resolveRemoteBaseUrl, getDesktopCaptureSummary,
    listDesktopDisplays, captureDesktopState, buildMobileImageUrl,
    captureSummaryRequiresTrustedViewer, getPhoneBridgeKeeperStatus,
    getPhoneTunnelMonitorStatus, armMobileControl, disarmMobileControl,
    normalizeControlPoint, invokeDesktopInput, openAsolariaUiTarget,
    evaluateGuardianGuard, getPhoneDeveloperOptionsStatus, listPhoneDeveloperOptions,
    enqueuePhoneDeveloperOptionsSweep, getDesktopDisplayTopology,
    cleanupManagedChromeWindows, getWolConfigSummary,
    upsertSubscription, removeSubscriptionByEndpoint, removeSubscriptionsByTokenHash,
    decideApproval, getApprovalById, markApprovalUsed, resumeApprovedRequest,
    syncApprovalDecisionToTaskLedger, normalizeChannels, sanitizeRemoteBaseUrl,
    normalizeWorkOrgKey, workOrgPolicy, persistRuntimeSettingsSnapshot, denyRemoteRequest,
    clipText, requestedChannel, resolveScreenViewerAccess, rotateMobileApprovalToken,
    updateTaskLedgerTask, sendMobilePushNotification
  } = ctx;
  const MOBILE_CONTROL_LANE_ID = "desktop-phone-mirror";
  const MOBILE_CONTROL_ROUTE = "mobile_control_runtime";
  const MOBILE_CONTROL_ROLE = "mobile-control-runtime";
  const MOBILE_CONTROL_ROUTE_SOURCE_PATHS = [
    "routes/mobile.js",
    "src/hookEventStore.js",
    "src/hg256RuntimeContract.js",
    "src/ixFabricAtlasStore.js"
  ];

  function normalizeMobileLaneBinding(binding = {}, routeStage = "control") {
    return {
      enabled: binding.enabled !== false,
      atlasId: String(binding.atlasId || ""),
      surfaceRegistryId: String(binding.surfaceRegistryId || ""),
      promotionQueueId: String(binding.promotionQueueId || ""),
      route: String(binding.route || MOBILE_CONTROL_ROUTE),
      routeStage: String(binding.routeStage || routeStage),
      role: String(binding.role || MOBILE_CONTROL_ROLE),
      roleSurfaceId: String(binding.roleSurfaceId || ""),
      sourcePaths: Array.isArray(binding.sourcePaths) && binding.sourcePaths.length
        ? binding.sourcePaths.map((entry) => String(entry))
        : MOBILE_CONTROL_ROUTE_SOURCE_PATHS.slice(),
      matchingSurfaceIds: Array.isArray(binding.matchingSurfaceIds) ? binding.matchingSurfaceIds.map((entry) => String(entry)) : [],
      matchingGroupIds: Array.isArray(binding.matchingGroupIds) ? binding.matchingGroupIds.map((entry) => String(entry)) : [],
      laneId: String(binding.laneId || MOBILE_CONTROL_LANE_ID),
      laneStatus: String(binding.laneStatus || "pending"),
      laneCurrentStage: String(binding.laneCurrentStage || "observe"),
      laneNextStage: String(binding.laneNextStage || "index")
    };
  }

  function resolveMobileLaneBinding(req, routeStage, endpointId) {
    const resolver = typeof resolveIxLaneBinding === "function"
      ? resolveIxLaneBinding
      : resolveIxRuntimeBinding;
    try {
      const resolved = resolver({
        route: MOBILE_CONTROL_ROUTE,
        routeStage,
        role: MOBILE_CONTROL_ROLE,
        laneId: MOBILE_CONTROL_LANE_ID,
        endpointId: String(endpointId || ""),
        sourcePaths: MOBILE_CONTROL_ROUTE_SOURCE_PATHS,
        method: String(req?.method || "")
      });
      return normalizeMobileLaneBinding(resolved, routeStage);
    } catch (_error) {
      return normalizeMobileLaneBinding({}, routeStage);
    }
  }

  function summarizeMobileHookString(value) {
    const text = String(value || "");
    return {
      type: "string",
      present: text.length > 0,
      length: text.length
    };
  }

  function sanitizeMobileHookPayload(value, depth = 0) {
    if (value === null || value === undefined) return value;
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value === "string") return summarizeMobileHookString(value);
    if (Array.isArray(value)) {
      return {
        type: "array",
        count: value.length
      };
    }
    if (typeof value !== "object") return { type: typeof value };
    if (depth >= 2) {
      return {
        type: "object",
        keys: Object.keys(value).slice(0, 20)
      };
    }

    const out = {};
    for (const [key, raw] of Object.entries(value)) {
      const normalizedKey = String(key || "").toLowerCase();
      if (/(token|secret|password|authorization|cookie|text|prompt|message|base64|inline|image|path|url|endpoint)/.test(normalizedKey)) {
        out[key] = summarizeMobileHookString(raw);
        continue;
      }
      out[key] = sanitizeMobileHookPayload(raw, depth + 1);
    }
    return out;
  }

  function emitMobileControlRouteHook(req, routeStage, endpointId, summary = {}, extraPayload = {}) {
    const laneBinding = resolveMobileLaneBinding(req, routeStage, endpointId);
    const channel = requestedChannel(req);
    const safePayloadSource = sanitizeMobileHookPayload({
      headers: {
        "x-asolaria-channel": String(req?.headers?.["x-asolaria-channel"] || "")
      },
      query: req?.query || {},
      body: req?.body || {}
    });
    const safeExtraPayload = sanitizeMobileHookPayload(extraPayload);
    const routeHook = buildRouteHookEnvelope({
      qId: "Q4_TRANSPORT_ENVELOPE",
      route: MOBILE_CONTROL_ROUTE,
      routeStage,
      owner: "jesse",
      agentId: "routes-mobile",
      role: MOBILE_CONTROL_ROLE,
      constructionId: MOBILE_CONTROL_LANE_ID,
      agentPid: process.pid,
      devicePid: `mobile-control:${String(channel || "mobile")}`,
      packetSource: {
        channel: channel || "mobile",
        endpointId,
        method: String(req?.method || ""),
        path: String(req?.path || "")
      },
      payloadSource: safePayloadSource,
      atlasBinding: laneBinding,
      proofRef: "reports/crypto/capsule.verify.json",
      verifyStatus: "pass_local_only"
    });
    appendHookEvent({
      event_type: "RouteHook",
      session_id: "routes-mobile",
      source_app: "routes-mobile",
      agent_id: "routes-mobile",
      agent_type: "route_runtime",
      summary,
      trigger: String(routeStage || ""),
      payload: {
        routeHook,
        endpointId,
        laneBinding,
        ...safeExtraPayload
      }
    });
    return { routeHook, laneBinding };
  }
app.get("/session", requireMobileAuth, (_req, res) => {
  const requestedChannel = String(_req.query?.channel || _req.headers["x-asolaria-channel"] || "").trim();
  if (requestedChannel) {
    noteChannelHeartbeat(requestedChannel);
  }
  const authority = resolveDesktopSuperMasterAccess(_req);
  const pending = listApprovals({ status: "pending", limit: 200 });
  const connectionRouting = getConnectionRoutingState();
  const pushSummary = getStoreSummary(runtimeState.mobilePush.tokenHash);
  res.json({
    ok: true,
    app: "Asolaria",
    auth: {
      tokenConfigured: Boolean(runtimeSecrets.mobileApprovalToken),
      tokenHint: maskSensitive(runtimeSecrets.mobileApprovalToken, 8)
    },
    approvals: {
      mode: settings.approvalMode,
      preference: settings.approvalPreference || "balanced",
      waitMs: Number(settings.approvalWaitMs || 20 * 60 * 1000)
    },
    guardian: {
      mode: settings.guardianMode,
      threshold: settings.guardianRiskThreshold,
      notifyPolicy: settings.guardianNotifyPolicy,
      requireOwnerForCritical: settings.guardianRequireOwnerForCritical
    },
    push: {
      enabled: runtimeState.mobilePush.enabled,
      reason: runtimeState.mobilePush.reason,
      subscriptions: pushSummary.total
    },
    workOrgs: getWorkOrgPolicySummary({ includeProfiles: false }),
    control: getMobileControlSummary(),
    connectionRouting,
    authority: {
      policyEnabled: authority.policyEnabled,
      allowRemoteSuperMaster: authority.remoteSuperMasterEnabled,
      actorId: authority.actorId,
      role: authority.role,
      loopback: authority.loopback,
      superMasterControlAllowed: authority.allowed,
      reason: authority.reason
    },
    pendingCount: pending.length
  });
});

app.get("/settings", requireMobileAuth, (_req, res) => {
  return res.json({
    ok: true,
    settings: {
      voiceEnabled: settings.voiceEnabled,
      voiceOutputMode: settings.voiceOutputMode,
      voiceAutoSpeakReplies: settings.voiceAutoSpeakReplies,
      voiceWakeWord: settings.voiceWakeWord,
      connectionRemoteBaseUrl: settings.connectionRemoteBaseUrl || "",
      connectionResolvedRemoteBaseUrl: resolveRemoteBaseUrl()
    }
  });
});

app.get("/inbox", requireMobileAuth, (req, res) => {
  const requested = String(req.query?.channel || req.headers["x-asolaria-channel"] || "").trim();
  if (requested) {
    noteChannelHeartbeat(requested);
  }
  const connectionRouting = getConnectionRoutingState();
  const pushSummary = getStoreSummary(runtimeState.mobilePush.tokenHash);
  const inbox = buildMobileInboxState({
    approvalLimit: asInt(req.query?.approvalLimit, 6, 1, 20),
    taskLimit: asInt(req.query?.taskLimit, 6, 1, 20),
    noteLimit: asInt(req.query?.noteLimit, 4, 1, 12),
    approvals: {
      mode: settings.approvalMode,
      preference: settings.approvalPreference || "balanced"
    },
    guardian: {
      mode: settings.guardianMode
    },
    push: {
      enabled: runtimeState.mobilePush.enabled,
      reason: runtimeState.mobilePush.reason,
      subscriptions: pushSummary.total
    },
    control: getMobileControlSummary(),
    connectionRouting,
    workOrgs: getWorkOrgPolicySummary({ includeProfiles: false })
  });
  return res.json({
    ok: true,
    inbox
  });
});

app.put("/task-ledger/tasks/:id", requireMobileAuth, (req, res) => {
  try {
    const body = req.body || {};
    const patch = {};
    const patchFields = [
      "title",
      "description",
      "text",
      "status",
      "priority",
      "owner",
      "assignee",
      "source",
      "tags",
      "progress",
      "dueAt",
      "projectScope",
      "scope",
      "archived"
    ];
    for (const field of patchFields) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        patch[field] = body[field];
      }
    }
    if (Object.keys(patch).length < 1) {
      return respondError(res, "No task fields provided for update.", 400);
    }
    const updated = updateTaskLedgerTask(req.params.id, patch, {
      actor: body.actor ?? body.by ?? "mobile-task-ledger",
      source: body.source ?? "mobile-task-ledger",
      note: body.note,
      type: body.eventType ?? body.type
    });
    return res.json({
      ok: true,
      ...updated
    });
  } catch (error) {
    const message = String(error?.message || error || "").toLowerCase();
    const status = message.includes("not found") ? 404 : 400;
    return respondError(res, error, status);
  }
});

app.get("/bootstrap", (req, res) => {
  if (!isLoopbackRequest(req)) {
    return respondError(res, "Bootstrap is only allowed from local loopback.", 403);
  }
  return res.json(buildMobileBootstrapPayload());
});

app.post("/token/rotate", (req, res) => {
  if (!isLoopbackRequest(req)) {
    return respondError(res, "Token rotation is only allowed from local loopback.", 403);
  }
  rotateMobileApprovalToken();
  const payload = buildMobileBootstrapPayload();
  return res.json({
    ...payload,
    rotated: true
  });
});

app.get("/screen/status", requireMobileAuth, (req, res) => {
  const requested = requestedChannel(req);
  if (requested) {
    noteChannelHeartbeat(requested);
  }
  const viewer = resolveScreenViewerAccess(req);
  let snapshot = getDesktopCaptureSummary();
  if (!viewer.trusted && captureSummaryRequiresTrustedViewer(snapshot)) {
    snapshot = null;
  }
  return res.json({
    ok: true,
    inFlight: captureDesktopState().inFlight,
    lastError: captureDesktopState().lastError || "",
    snapshot: snapshot
      ? {
        ...snapshot,
        imageUrl: buildMobileImageUrl(req, { v: snapshot.capturedAtMs })
      }
      : null
  });
});

app.get("/screen/displays", requireMobileAuth, async (req, res) => {
  try {
    const requested = requestedChannel(req);
    if (requested) {
      noteChannelHeartbeat(requested);
    }
    const viewer = resolveScreenViewerAccess(req);
    if (!viewer.trusted) {
      return denyRemoteRequest(res, "Display detection is restricted to owner and Asolaria agents.");
    }
    const topology = await getDesktopDisplayTopology({
      force: req.query?.force === undefined ? true : asBool(req.query?.force, false),
      maxAgeMs: asInt(req.query?.maxAgeMs, 1200, 0, 20000),
      timeoutMs: asInt(req.query?.timeoutMs, 9000, 2500, 30000)
    });
    return res.json({
      ok: true,
      displays: Array.isArray(topology.displays) ? topology.displays : [],
      count: Number(topology.count || 0),
      primaryIndex: Number(topology.primaryIndex ?? -1),
      virtual: topology.virtual || null,
      sessionId: String(topology.sessionId || ""),
      detectedAtMs: Number(topology.detectedAtMs || 0)
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 500));
  }
});

app.post("/screen/capture", requireMobileAuth, async (req, res) => {
  try {
    const requested = requestedChannel(req);
    if (requested) {
      noteChannelHeartbeat(requested);
    }
    const viewer = resolveScreenViewerAccess(req);
    const target = requiresTrustedViewerForScreenTarget(req.body || {});
    if (!viewer.trusted && target.required) {
      return denyRemoteRequest(res, "Non-primary screen capture is restricted to owner and Asolaria agents.");
    }
    const result = await refreshDesktopCapture({
      force: asBool(req.body?.force, false),
      maxAgeMs: asInt(req.body?.maxAgeMs, 3500, 0, 120000),
      timeoutMs: asInt(req.body?.timeoutMs, 25000, 5000, 120000),
      fileName: req.body?.fileName,
      screenIndex: target.displayIndex,
      displayDeviceName: target.displayDeviceName,
      displaySessionId: target.displaySessionId,
      captureAll: target.captureAll
    });
    const snapshot = result.snapshot || getDesktopCaptureSummary();
    return res.json({
      ok: true,
      reused: result.reused,
      snapshot: snapshot
        ? {
          ...snapshot,
          imageUrl: buildMobileImageUrl(req, { v: snapshot.capturedAtMs })
        }
        : null
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 500));
  }
});

app.get("/screen/image", requireMobileAuth, (req, res) => {
  const summary = getDesktopCaptureSummary();
  const state = captureDesktopState();
  if (!summary || !state.lastPath || !fs.existsSync(state.lastPath)) {
    return respondError(res, "No desktop capture is available yet. Trigger /api/mobile/screen/capture first.", 404);
  }
  const viewer = resolveScreenViewerAccess(req);
  if (!viewer.trusted && captureSummaryRequiresTrustedViewer(summary)) {
    return denyRemoteRequest(res, "Non-primary screen image access is restricted to owner and Asolaria agents.");
  }
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.type("png");
  return res.sendFile(state.lastPath);
});

app.get("/control/status", requireMobileAuth, async (req, res) => {
  try {
    const requested = requestedChannel(req);
    if (requested) {
      noteChannelHeartbeat(requested);
    }
    const authority = resolveDesktopSuperMasterAccess(req);
    return res.json({
      ok: true,
      control: getMobileControlSummary(),
      authority: {
        policyEnabled: authority.policyEnabled,
        allowRemoteSuperMaster: authority.remoteSuperMasterEnabled,
        actorId: authority.actorId,
        role: authority.role,
        loopback: authority.loopback,
        superMasterControlAllowed: authority.allowed,
        reason: authority.reason
      },
      phoneBridgeKeeper: await getPhoneBridgeKeeperStatus(),
      phoneTunnelMonitor: await getPhoneTunnelMonitorStatus()
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 500));
  }
});

app.get("/bridge/keeper/status", requireMobileAuth, async (req, res) => {
  try {
    const requested = requestedChannel(req);
    if (requested) {
      noteChannelHeartbeat(requested);
    }
    return res.json({
      ok: true,
      keeper: await getPhoneBridgeKeeperStatus()
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 500));
  }
});

app.get("/tunnel/monitor/status", requireMobileAuth, async (req, res) => {
  try {
    const requested = requestedChannel(req);
    if (requested) {
      noteChannelHeartbeat(requested);
    }
    return res.json({
      ok: true,
      monitor: await getPhoneTunnelMonitorStatus()
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 500));
  }
});

app.get("/control/diagnostics", requireMobileAuth, async (req, res) => {
  try {
    const requested = requestedChannel(req);
    if (requested) {
      noteChannelHeartbeat(requested);
    }
    const viewer = resolveScreenViewerAccess(req);
    if (!viewer.trusted) {
      return denyRemoteRequest(res, "Desktop diagnostics are restricted to owner and Asolaria agents.");
    }
    const diagnostics = {
      at: new Date().toISOString(),
      channel: requested || "",
      control: getMobileControlSummary(),
      capture: {
        inFlight: captureDesktopState().inFlight,
        lastError: captureDesktopState().lastError || "",
        snapshot: getDesktopCaptureSummary()
      },
      checks: {
        displays: {
          ok: false,
          count: 0,
          primaryIndex: -1,
          error: ""
        },
        windows: {
          ok: false,
          count: 0,
          windows: [],
          error: ""
        }
      },
      routing: getConnectionRoutingState()
    };

    try {
      const displays = await listDesktopDisplays({
        timeoutMs: asInt(req.query?.displayTimeoutMs, 9000, 2500, 30000)
      });
      diagnostics.checks.displays.ok = true;
      diagnostics.checks.displays.count = Number(displays.count || 0);
      diagnostics.checks.displays.primaryIndex = Number(displays.primaryIndex ?? -1);
      diagnostics.checks.displays.error = "";
    } catch (error) {
      diagnostics.checks.displays.ok = false;
      diagnostics.checks.displays.error = String(error?.message || error || "display_check_failed");
    }

    try {
      const output = await invokeDesktopInput({
        action: "window_list",
        limit: asInt(req.query?.windowLimit, 10, 1, 80),
        timeoutMs: asInt(req.query?.windowTimeoutMs, 9000, 2500, 30000)
      });
      const windows = Array.isArray(output.windows) ? output.windows : [];
      diagnostics.checks.windows.ok = true;
      diagnostics.checks.windows.count = Number(output.count || windows.length || 0);
      diagnostics.checks.windows.windows = windows.slice(0, 10);
      diagnostics.checks.windows.error = "";
    } catch (error) {
      diagnostics.checks.windows.ok = false;
      diagnostics.checks.windows.error = String(error?.message || error || "window_check_failed");
    }

    const ready = Boolean(diagnostics.checks.displays.ok && diagnostics.checks.windows.ok);
    return res.json({
      ok: true,
      ready,
      diagnostics
    });
  } catch (error) {
    return respondError(res, error, 500);
  }
});

app.post("/control/arm", requireMobileAuth, requireMobileDirectControlEnabled, requireDesktopSuperMasterAuthority, (req, res) => {
  const requested = requestedChannel(req);
  if (requested) {
    noteChannelHeartbeat(requested);
  }
  const ttlMs = asInt(
    req.body?.ttlMs,
    MOBILE_CONTROL_DEFAULT_ARM_MS,
    MOBILE_CONTROL_MIN_ARM_MS,
    MOBILE_CONTROL_MAX_ARM_MS
  );
  const control = armMobileControl({
    ttlMs,
    by: req.body?.by || "mobile-ui"
  });
  return res.json({
    ok: true,
    control
  });
});

app.post("/control/disarm", requireMobileAuth, requireMobileDirectControlEnabled, requireDesktopSuperMasterAuthority, (req, res) => {
  const requested = requestedChannel(req);
  if (requested) {
    noteChannelHeartbeat(requested);
  }
  const control = disarmMobileControl(req.body?.reason || "manual_disarm");
  return res.json({
    ok: true,
    control
  });
});

app.post("/control/click", requireMobileAuth, requireMobileDirectControlEnabled, requireDesktopSuperMasterAuthority, async (req, res) => {
  try {
    const requested = requestedChannel(req);
    if (requested) {
      noteChannelHeartbeat(requested);
    }
    const point = normalizeControlPoint(req.body || {});
    if (!point) {
      return respondError(res, "xNorm/yNorm or x/y is required.", 400);
    }
    const button = asEnum(req.body?.button, ["left", "right", "middle"], "left");
    const action = asBool(req.body?.doubleClick, false) ? "double_click" : "click";
    const displayIndex = asInt(req.body?.displayIndex, -1, -1, 16);
    const timeoutMs = asInt(req.body?.timeoutMs, 9000, 2500, 30000);
    const result = await runMobileControlAction({
      action,
      button,
      displayIndex,
      timeoutMs,
      ...point
    });
    emitMobileControlRouteHook(req, "control_click", "control/click", {
      action,
      button,
      displayIndex,
      timeoutMs
    }, {
      channel: requested,
      control: result.control,
      result: result.result,
      point
    });
    return res.json({
      ok: true,
      control: result.control,
      result: result.result
    });
  } catch (error) {
    return respondError(res, error, 400);
  }
});

app.post("/control/scroll", requireMobileAuth, requireMobileDirectControlEnabled, requireDesktopSuperMasterAuthority, async (req, res) => {
  try {
    const requested = requestedChannel(req);
    if (requested) {
      noteChannelHeartbeat(requested);
    }
    const direction = asEnum(req.body?.direction, ["up", "down"], "down");
    const stepsFallback = direction === "up" ? 3 : -3;
    const steps = asInt(req.body?.steps, stepsFallback, -20, 20);
    const wheelDelta = asInt(
      req.body?.wheelDelta,
      steps * 120,
      -2400,
      2400
    );
    const point = normalizeControlPoint(req.body || {});
    const displayIndex = asInt(req.body?.displayIndex, -1, -1, 16);
    const timeoutMs = asInt(req.body?.timeoutMs, 9000, 2500, 30000);
    const result = await runMobileControlAction({
      action: "scroll",
      wheelDelta,
      displayIndex,
      timeoutMs,
      ...(point || {})
    });
    emitMobileControlRouteHook(req, "control_scroll", "control/scroll", {
      action: "scroll",
      direction,
      steps,
      wheelDelta,
      displayIndex,
      timeoutMs
    }, {
      channel: requested,
      control: result.control,
      result: result.result,
      point
    });
    return res.json({
      ok: true,
      control: result.control,
      result: result.result
    });
  } catch (error) {
    return respondError(res, error, 400);
  }
});

app.post("/control/type", requireMobileAuth, requireMobileDirectControlEnabled, requireDesktopSuperMasterAuthority, async (req, res) => {
  try {
    const requested = requestedChannel(req);
    if (requested) {
      noteChannelHeartbeat(requested);
    }
    const text = clipText(req.body?.text || "", 2400);
    if (!text) {
      return respondError(res, "text is required.", 400);
    }
    const timeoutMs = asInt(req.body?.timeoutMs, 12000, 2500, 30000);
    const result = await runMobileControlAction({
      action: "type",
      text,
      timeoutMs
    });
    emitMobileControlRouteHook(req, "control_type", "control/type", {
      action: "type",
      charCount: text.length,
      timeoutMs
    }, {
      channel: requested,
      control: result.control,
      result: result.result,
      text
    });
    return res.json({
      ok: true,
      control: result.control,
      result: result.result
    });
  } catch (error) {
    return respondError(res, error, 400);
  }
});

app.post("/control/key", requireMobileAuth, requireMobileDirectControlEnabled, requireDesktopSuperMasterAuthority, async (req, res) => {
  try {
    const requested = requestedChannel(req);
    if (requested) {
      noteChannelHeartbeat(requested);
    }
    const key = asEnum(req.body?.key, MOBILE_CONTROL_ALLOWED_KEYS, "");
    if (!key) {
      return respondError(res, "Unsupported key action.", 400);
    }
    const timeoutMs = asInt(req.body?.timeoutMs, 9000, 2500, 30000);
    const result = await runMobileControlAction({
      action: "key",
      key,
      timeoutMs
    });
    emitMobileControlRouteHook(req, "control_key", "control/key", {
      action: "key",
      key,
      timeoutMs
    }, {
      channel: requested,
      control: result.control,
      result: result.result
    });
    return res.json({
      ok: true,
      control: result.control,
      result: result.result
    });
  } catch (error) {
    return respondError(res, error, 400);
  }
});

app.get("/phone/developer-options/catalog", requireMobileAuth, (req, res) => {
  try {
    const requested = requestedChannel(req);
    if (requested) {
      noteChannelHeartbeat(requested);
    }
    const options = listPhoneDeveloperOptions({
      includeRisky: asBool(req.query?.includeRisky, false),
      onlyDefaultSweep: asBool(req.query?.onlyDefaultSweep, false),
      ids: String(req.query?.ids || "").trim(),
      categories: String(req.query?.categories || "").trim()
    });
    return res.json({
      ok: true,
      count: options.length,
      options
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.get("/phone/developer-options/status", requireMobileAuth, async (req, res) => {
  try {
    const requested = requestedChannel(req);
    if (requested) {
      noteChannelHeartbeat(requested);
    }
    const status = await getPhoneDeveloperOptionsStatus({
      deviceId: String(req.query?.deviceId || "").trim(),
      includeRisky: asBool(req.query?.includeRisky, false),
      onlyDefaultSweep: asBool(req.query?.onlyDefaultSweep, false),
      ids: String(req.query?.ids || "").trim(),
      categories: String(req.query?.categories || "").trim(),
      timeoutMs: asInt(req.query?.timeoutMs, 20000, 3000, 180000)
    });
    return res.json({
      ok: true,
      ...status
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.post("/phone/developer-options/set", requireMobileAuth, requireMobileDirectControlEnabled, requireDesktopSuperMasterAuthority, async (req, res) => {
  try {
    const requested = requestedChannel(req);
    if (requested) {
      noteChannelHeartbeat(requested);
    }
    const optionId = String(req.body?.id || req.body?.toggleId || "").trim().toLowerCase();
    const state = String(req.body?.state || "").trim().toLowerCase();
    if (!optionId) {
      return respondError(res, "id (developer option id) is required.", 400);
    }
    if (state !== "on" && state !== "off") {
      return respondError(res, "state must be 'on' or 'off'.", 400);
    }

    const guard = await evaluateGuardianGuard({
      message: `Mobile requested phone developer option set ${optionId}=${state}.`,
      routed: { action: "mobile_phone_developer_option_set" },
      source: "api.mobile.phone.developer_options.set"
    });
    if (guard.triggered && guard.blocked) {
      const approvalHint = guard.approvalRequest?.id
        ? ` Approval ID ${guard.approvalRequest.id}. Use APPROVE ${guard.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked mobile developer option set (${guard.risk.level}). ${guard.decision?.text || ""}${approvalHint}`.trim(),
        403
      );
    }

    const result = await setPhoneDeveloperOptionState({
      id: optionId,
      state,
      deviceId: String(req.body?.deviceId || "").trim(),
      timeoutMs: asInt(req.body?.timeoutMs, 20000, 3000, 180000),
      waitMs: asInt(req.body?.waitMs, 600, 0, 10000),
      requireVerified: asBool(req.body?.requireVerified, false),
      capture: asBool(req.body?.capture, true),
      captureTimeoutMs: asInt(req.body?.captureTimeoutMs, 30000, 4000, 180000)
    });
    return res.json({
      ok: true,
      result,
      guardian: guard
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.post("/phone/developer-options/sweep", requireMobileAuth, requireMobileDirectControlEnabled, requireDesktopSuperMasterAuthority, async (req, res) => {
  try {
    const requested = requestedChannel(req);
    if (requested) {
      noteChannelHeartbeat(requested);
    }
    const includeRisky = asBool(req.body?.includeRisky, false);
    const guard = await evaluateGuardianGuard({
      message: `Mobile requested phone developer-options sweep (includeRisky=${includeRisky ? "true" : "false"}).`,
      routed: { action: "mobile_phone_developer_options_sweep" },
      source: "api.mobile.phone.developer_options.sweep"
    });
    if (guard.triggered && guard.blocked) {
      const approvalHint = guard.approvalRequest?.id
        ? ` Approval ID ${guard.approvalRequest.id}. Use APPROVE ${guard.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked mobile developer options sweep (${guard.risk.level}). ${guard.decision?.text || ""}${approvalHint}`.trim(),
        403
      );
    }

    const payload = {
      deviceId: String(req.body?.deviceId || "").trim(),
      includeRisky,
      onlyDefaultSweep: req.body?.onlyDefaultSweep === undefined
        ? true
        : asBool(req.body?.onlyDefaultSweep, true),
      capture: asBool(req.body?.capture, true),
      captureIntervalMs: asInt(req.body?.captureIntervalMs, 1200, 0, 30000),
      captureTimeoutMs: asInt(req.body?.captureTimeoutMs, 30000, 4000, 180000),
      restoreOriginal: asBool(req.body?.restoreOriginal, true),
      timeoutMs: asInt(req.body?.timeoutMs, 25000, 3000, 180000),
      ids: String(req.body?.ids || "").trim(),
      categories: String(req.body?.categories || "").trim()
    };
    const job = enqueuePhoneDeveloperOptionsSweep(payload);
    return res.json({
      ok: true,
      ...queueReply(job, `Queued mobile phone developer-options sweep job ${job.id}.`),
      guardian: guard
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.post("/help/recover", requireMobileAuth, async (req, res) => {
  try {
    const requested = requestedChannel(req);
    if (requested) {
      noteChannelHeartbeat(requested);
    }

    const guardian = await evaluateGuardianGuard({
      message: "Mobile requested phone help recovery flow (local one-button repair).",
      routed: { action: "mobile_phone_help_recover" },
      source: "api.mobile.help.recover"
    });
    if (guardian.triggered && guardian.blocked) {
      const approvalHint = guardian.approvalRequest?.id
        ? ` Approval ID ${guardian.approvalRequest.id}. Use APPROVE ${guardian.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked phone help recovery (${guardian.risk.level}). ${guardian.decision?.text || ""}${approvalHint}`.trim(),
        403
      );
    }

    const payload = {
      timeoutMs: asInt(req.body?.timeoutMs, 8 * 60 * 1000, 2 * 60 * 1000, 15 * 60 * 1000),
      skipTunnelMonitor: asBool(req.body?.skipTunnelMonitor, false),
      forceReconnect: asBool(req.body?.forceReconnect, true),
      launchTermux: asBool(req.body?.launchTermux, false),
      launchFdroid: asBool(req.body?.launchFdroid, false)
    };
    const job = enqueue("phone_help_recover", payload, async () => runPhoneHelpRecoveryScript(payload));
    return res.json({
      ok: true,
      ...queueReply(job, `Queued phone help recovery ${job.id}.`),
      guardian
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.post("/ui/open", requireMobileAuth, async (req, res) => {
  try {
    const requested = requestedChannel(req);
    if (requested) {
      noteChannelHeartbeat(requested);
    }
    const requestedTarget = String(req.body?.target || "local_ui").trim().toLowerCase();
    const preferReuse = asBool(req.body?.reuse, true);
    const forceNew = asBool(req.body?.forceNew, false);
    const opened = await openAsolariaUiTarget(requestedTarget, {
      preferReuse: forceNew ? false : preferReuse,
      enforceSingleWindow: true
    });
    return res.json({
      ok: true,
      target: opened.target,
      opened: opened.opened,
      pid: opened.pid || 0,
      profilePath: opened.profilePath || "",
      trackedId: opened.trackedId || "",
      reused: Boolean(opened.reused),
      bounds: opened.bounds || null,
      boundsSource: String(opened.boundsSource || ""),
      closedCount: Array.isArray(opened.closed) ? opened.closed.length : 0,
      message: opened.reused
        ? `Focused existing Asolaria UI target ${opened.target}.`
        : `Opened Asolaria UI target ${opened.target}.`
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 500));
  }
});

app.post("/ui/cleanup", requireMobileAuth, async (req, res) => {
  try {
    const requested = requestedChannel(req);
    if (requested) {
      noteChannelHeartbeat(requested);
    }
    const payload = req.body && typeof req.body === "object" ? req.body : {};
    const targets = Array.isArray(payload.targets) ? payload.targets : [];
    const profileNames = Array.isArray(payload.profileNames) ? payload.profileNames : [];
    const result = await cleanupManagedChromeWindows({
      closeTracked: asBool(payload.closeTracked, true),
      graceMs: asInt(payload.graceMs, 220, 0, 3000),
      stopAttempts: asInt(payload.stopAttempts, 3, 1, 4),
      stopProbeWaitMs: asInt(payload.stopProbeWaitMs, 180, 40, 900),
      skipWhenMissing: asBool(payload.skipWhenMissing, true),
      includeBaseNames: asBool(payload.includeBaseNames, true),
      targets,
      profileNames
    });
    return res.json({
      ok: true,
      ...result
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 500));
  }
});

app.get("/api/power/status", requireMobileAuth, (_req, res) => {
  return res.json({
    ok: true,
    power: runtimeState.power,
    wol: getWolConfigSummary()
  });
});

app.post("/api/power/shutdown", requireMobileAuth, requireMobileDirectControlEnabled, requireDesktopSuperMasterAuthority, async (req, res) => {
  try {
    const requested = requestedChannel(req);
    if (requested) {
      noteChannelHeartbeat(requested);
    }
    requireArmedMobileControl();

    const delaySeconds = asInt(req.body?.delaySeconds, 15, 0, 3600);
    const force = asBool(req.body?.force, false);

    const guardian = await evaluateGuardianGuard({
      message: `Power shutdown request delaySeconds=${delaySeconds} force=${force ? "yes" : "no"}`,
      routed: { action: "power_shutdown" },
      source: "api.power.shutdown"
    });
    if (guardian.triggered && guardian.blocked) {
      const approvalHint = guardian.approvalRequest?.id
        ? ` Approval ID ${guardian.approvalRequest.id}. Use APPROVE ${guardian.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked power shutdown (${guardian.risk.level}). ${guardian.decision?.text || ""}${approvalHint}`.trim(),
        403
      );
    }

    const args = ["/s", "/t", String(delaySeconds)];
    if (force) {
      args.push("/f");
    }
    await runWindowsShutdown(args);
    runtimeState.power.lastActionAt = new Date().toISOString();
    runtimeState.power.lastAction = `shutdown t=${delaySeconds}s`;
    runtimeState.power.lastError = "";

    return res.json({
      ok: true,
      scheduled: true,
      delaySeconds,
      force,
      guardian
    });
  } catch (error) {
    runtimeState.power.lastError = String(error?.message || error || "shutdown_failed");
    return respondError(res, error, 400);
  }
});

app.post("/api/power/restart", requireMobileAuth, requireMobileDirectControlEnabled, requireDesktopSuperMasterAuthority, async (req, res) => {
  try {
    const requested = requestedChannel(req);
    if (requested) {
      noteChannelHeartbeat(requested);
    }
    requireArmedMobileControl();

    const delaySeconds = asInt(req.body?.delaySeconds, 15, 0, 3600);
    const force = asBool(req.body?.force, false);

    const guardian = await evaluateGuardianGuard({
      message: `Power restart request delaySeconds=${delaySeconds} force=${force ? "yes" : "no"}`,
      routed: { action: "power_restart" },
      source: "api.power.restart"
    });
    if (guardian.triggered && guardian.blocked) {
      const approvalHint = guardian.approvalRequest?.id
        ? ` Approval ID ${guardian.approvalRequest.id}. Use APPROVE ${guardian.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked power restart (${guardian.risk.level}). ${guardian.decision?.text || ""}${approvalHint}`.trim(),
        403
      );
    }

    const args = ["/r", "/t", String(delaySeconds)];
    if (force) {
      args.push("/f");
    }
    await runWindowsShutdown(args);
    runtimeState.power.lastActionAt = new Date().toISOString();
    runtimeState.power.lastAction = `restart t=${delaySeconds}s`;
    runtimeState.power.lastError = "";

    return res.json({
      ok: true,
      scheduled: true,
      delaySeconds,
      force,
      guardian
    });
  } catch (error) {
    runtimeState.power.lastError = String(error?.message || error || "restart_failed");
    return respondError(res, error, 400);
  }
});

app.post("/api/power/abort", requireMobileAuth, requireMobileDirectControlEnabled, requireDesktopSuperMasterAuthority, async (req, res) => {
  try {
    const requested = requestedChannel(req);
    if (requested) {
      noteChannelHeartbeat(requested);
    }
    requireArmedMobileControl();
    try {
      await runWindowsShutdown(["/a"]);
    } catch (error) {
      const text = String(error?.message || "");
      if (!/no shutdown was in progress/i.test(text)) {
        throw error;
      }
    }
    runtimeState.power.lastActionAt = new Date().toISOString();
    runtimeState.power.lastAction = "abort";
    runtimeState.power.lastError = "";
    return res.json({
      ok: true
    });
  } catch (error) {
    runtimeState.power.lastError = String(error?.message || error || "abort_failed");
    return respondError(res, error, 400);
  }
});

app.get("/api/power/wol/status", requireMobileAuth, (_req, res) => {
  return res.json({
    ok: true,
    wol: getWolConfigSummary()
  });
});

app.post("/api/power/wol/config", async (req, res) => {
  try {
    if (!isLoopbackRequest(req)) {
      return respondError(res, "WOL configuration is only allowed from local loopback.", 403);
    }
    const clear = asBool(req.body?.clear, false);
    const devices = Array.isArray(req.body?.devices) ? req.body.devices : [];
    const guardian = await evaluateGuardianGuard({
      message: clear ? "WOL configuration clear request" : `WOL configuration update request devices=${devices.length}`,
      routed: { action: "power_wol_config" },
      source: "api.power.wol.config"
    });
    if (guardian.triggered && guardian.blocked) {
      const approvalHint = guardian.approvalRequest?.id
        ? ` Approval ID ${guardian.approvalRequest.id}. Use APPROVE ${guardian.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked WOL config update (${guardian.risk.level}). ${guardian.decision?.text || ""}${approvalHint}`.trim(),
        403
      );
    }
    const config = setWolConfig({ clear, devices });
    return res.json({
      ok: true,
      config,
      guardian
    });
  } catch (error) {
    return respondError(res, error, 400);
  }
});

app.post("/api/power/wol/send", requireMobileAuth, requireMobileDirectControlEnabled, requireDesktopSuperMasterAuthority, async (req, res) => {
  try {
    const requested = requestedChannel(req);
    if (requested) {
      noteChannelHeartbeat(requested);
    }
    requireArmedMobileControl();
    const name = String(req.body?.name || "").trim();
    const guardian = await evaluateGuardianGuard({
      message: `WOL send request target=${name || "(missing)"}`,
      routed: { action: "power_wol_send" },
      source: "api.power.wol.send"
    });
    if (guardian.triggered && guardian.blocked) {
      const approvalHint = guardian.approvalRequest?.id
        ? ` Approval ID ${guardian.approvalRequest.id}. Use APPROVE ${guardian.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked WOL send (${guardian.risk.level}). ${guardian.decision?.text || ""}${approvalHint}`.trim(),
        403
      );
    }

    const result = await sendWakeOnLan({ name });
    runtimeState.power.lastActionAt = new Date().toISOString();
    runtimeState.power.lastAction = `wol:${result?.device?.name || name}`;
    runtimeState.power.lastError = "";

    return res.json({
      ok: true,
      result,
      guardian
    });
  } catch (error) {
    runtimeState.power.lastError = String(error?.message || error || "wol_failed");
    return respondError(res, error, 400);
  }
});

app.get("/windows", requireMobileAuth, async (req, res) => {
  try {
    const requested = requestedChannel(req);
    if (requested) {
      noteChannelHeartbeat(requested);
    }
    const limit = asInt(req.query?.limit, 16, 1, 80);
    const output = await invokeDesktopInput({
      action: "window_list",
      limit,
      timeoutMs: asInt(req.query?.timeoutMs, 9000, 2500, 30000)
    });
    let activeWindow = null;
    try {
      const active = await invokeDesktopInput({
        action: "window_active",
        timeoutMs: asInt(req.query?.activeTimeoutMs, 4500, 1200, 30000)
      });
      if (active && typeof active === "object" && active.window && typeof active.window === "object") {
        activeWindow = active.window;
      }
    } catch (_error) {
      // best effort only
    }
    return res.json({
      ok: true,
      windows: Array.isArray(output.windows) ? output.windows : [],
      count: Number(output.count || 0),
      activeWindow,
      control: getMobileControlSummary()
    });
  } catch (error) {
    return respondError(res, error, 400);
  }
});

app.post("/windows/focus", requireMobileAuth, requireMobileDirectControlEnabled, requireDesktopSuperMasterAuthority, async (req, res) => {
  try {
    const requested = requestedChannel(req);
    if (requested) {
      noteChannelHeartbeat(requested);
    }
    const windowId = asInt(req.body?.windowId, 0, 0, 2147483647);
    const windowTitle = clipText(req.body?.windowTitle || "", 240);
    const result = await runMobileWindowActionWithFallback({
      action: "window_focus",
      windowId,
      windowTitle,
      timeoutMs: req.body?.timeoutMs
    });
    return res.json({
      ok: true,
      control: result.control,
      result: result.result
    });
  } catch (error) {
    return respondError(res, error, 400);
  }
});

app.post("/windows/action", requireMobileAuth, requireMobileDirectControlEnabled, requireDesktopSuperMasterAuthority, async (req, res) => {
  try {
    const requested = requestedChannel(req);
    if (requested) {
      noteChannelHeartbeat(requested);
    }
    const action = asEnum(
      req.body?.action,
      ["window_minimize", "window_maximize", "window_restore", "window_close"],
      ""
    );
    if (!action) {
      return respondError(res, "Unsupported window action.", 400);
    }
    const windowId = asInt(req.body?.windowId, 0, 0, 2147483647);
    const windowTitle = clipText(req.body?.windowTitle || "", 240);
    const result = await runMobileWindowActionWithFallback({
      action,
      windowId,
      windowTitle,
      timeoutMs: req.body?.timeoutMs
    });
    return res.json({
      ok: true,
      control: result.control,
      result: result.result
    });
  } catch (error) {
    return respondError(res, error, 400);
  }
});

app.get("/push/public-key", requireMobileAuth, (_req, res) => {
  if (!runtimeState.mobilePush.enabled || !runtimeState.mobilePush.vapidPublicKey) {
    return respondError(res, "Mobile push is not available on this server.", 503);
  }
  return res.json({
    ok: true,
    publicKey: runtimeState.mobilePush.vapidPublicKey,
    subject: runtimeState.mobilePush.subject,
    enabled: true
  });
});

app.get("/push/status", requireMobileAuth, (_req, res) => {
  const summary = getStoreSummary(runtimeState.mobilePush.tokenHash);
  return res.json({
    ok: true,
    push: {
      enabled: runtimeState.mobilePush.enabled,
      reason: runtimeState.mobilePush.reason,
      subject: runtimeState.mobilePush.subject,
      subscriptions: summary.total
    },
    subscriptions: summary.subscriptions
  });
});

app.post("/push/subscribe", requireMobileAuth, (req, res) => {
  try {
    if (!runtimeState.mobilePush.enabled || !runtimeState.mobilePush.vapidPublicKey) {
      return respondError(res, "Mobile push is not available on this server.", 503);
    }
    const subscription = req.body?.subscription || req.body;
    const userAgent = String(req.body?.deviceName || req.headers["user-agent"] || "").trim();
    const saved = upsertSubscription(subscription, {
      tokenHash: runtimeState.mobilePush.tokenHash,
      userAgent
    });
    const summary = getStoreSummary(runtimeState.mobilePush.tokenHash);
    return res.json({
      ok: true,
      subscription: saved,
      subscriptions: summary.total
    });
  } catch (error) {
    return respondError(res, error, 400);
  }
});

app.post("/push/unsubscribe", requireMobileAuth, (req, res) => {
  try {
    const endpoint = String(
      req.body?.endpoint
      || req.body?.subscription?.endpoint
      || ""
    ).trim();
    if (!endpoint) {
      return respondError(res, "endpoint is required.", 400);
    }
    const removed = removeSubscriptionByEndpoint(endpoint);
    const summary = getStoreSummary(runtimeState.mobilePush.tokenHash);
    return res.json({
      ok: true,
      removed,
      subscriptions: summary.total
    });
  } catch (error) {
    return respondError(res, error, 400);
  }
});

app.post("/push/test", requireMobileAuth, async (req, res) => {
  try {
    const note = clipText(req.body?.note || "Test push from mobile UI", 160);
    const event = {
      at: new Date().toISOString(),
      source: "mobile-ui",
      routeAction: "mobile_push_test",
      decisionText: note,
      messagePreview: "If you see this while the screen is off, push alerts are working.",
      risk: {
        level: "high",
        reasons: ["mobile_push_test"]
      }
    };
    const result = await sendMobilePushNotification(event);
    return res.json({
      ok: true,
      result
    });
  } catch (error) {
    return respondError(res, error, 500);
  }
});

app.get("/approvals", requireMobileAuth, (req, res) => {
  const status = asEnum(
    req.query?.status,
    ["all", "pending", "approved", "denied", "expired"],
    "pending"
  );
  const limit = asInt(req.query?.limit, 50, 1, 200);
  const rows = listApprovals({ status, limit });
  const criticalOnly = asBool(req.query?.criticalOnly, false);
  const approvals = criticalOnly
    ? rows.filter((item) => String(item.risk?.level || "").toLowerCase() === "critical")
    : rows;
  res.json({
    ok: true,
    approvals
  });
});

app.get("/approvals/:id", requireMobileAuth, (req, res) => {
  const approval = getApprovalById(req.params.id);
  if (!approval) {
    return respondError(res, "Approval not found.", 404);
  }
  return res.json({
    ok: true,
    approval
  });
});

app.post("/approvals/:id/approve", requireMobileAuth, async (req, res) => {
  try {
    const approval = decideApproval({
      id: req.params.id,
      decision: "approve",
      reason: req.body?.reason || "Approved from mobile",
      by: req.body?.by || "mobile"
    });
    const execute = asBool(req.body?.execute, true);
    const approvalTaskId = syncApprovalDecisionToTaskLedger(approval, {
      actor: req.body?.by || "mobile",
      source: "mobile-approval",
      execute
    });
    let execution = null;
    if (execute && approval.status === "approved" && !approval.usedAt) {
      markApprovalUsed(approval.id, "approved+execute via mobile");
      execution = await resumeApprovedRequest(approval);
    }
    return res.json({
      ok: true,
      approval: getApprovalById(approval.id),
      execution,
      taskLedgerTaskId: approvalTaskId || ""
    });
  } catch (error) {
    return respondError(res, error, 400);
  }
});

app.post("/approvals/:id/deny", requireMobileAuth, (req, res) => {
  try {
    const approval = decideApproval({
      id: req.params.id,
      decision: "deny",
      reason: req.body?.reason || "Denied from mobile",
      by: req.body?.by || "mobile"
    });
    const approvalTaskId = syncApprovalDecisionToTaskLedger(approval, {
      actor: req.body?.by || "mobile",
      source: "mobile-approval",
      execute: false
    });
    return res.json({
      ok: true,
      approval: getApprovalById(approval.id),
      taskLedgerTaskId: approvalTaskId || ""
    });
  } catch (error) {
    return respondError(res, error, 400);
  }
});

app.post("/connections", requireMobileAuth, (req, res) => {
  const preference = normalizeChannels(req.body?.preference || settings.connectionPreference);
  const available = normalizeChannels(req.body?.available || settings.connectionAvailable);
  const allowPublicInternet = asBool(req.body?.allowPublicInternet, settings.connectionAllowPublicInternet);
  const publicInternetPrivate = asBool(req.body?.publicInternetPrivate, settings.connectionPublicInternetPrivate);
  const remoteBaseUrl = req.body?.remoteBaseUrl === undefined
    ? settings.connectionRemoteBaseUrl
    : sanitizeRemoteBaseUrl(req.body?.remoteBaseUrl, "");
  const remoteAuthRequired = asBool(req.body?.remoteAuthRequired, settings.networkRemoteAuthRequired);
  const requireEncryptedRemote = asBool(req.body?.requireEncryptedRemote, settings.networkRequireEncryptedRemote);
  const stealthDeny = asBool(req.body?.stealthDeny, settings.networkStealthDeny);
  const mobileDirectControlEnabled = asBool(
    req.body?.mobileDirectControlEnabled ?? req.body?.networkMobileDirectControlEnabled,
    settings.networkMobileDirectControlEnabled
  );
  const requestedWorkOrgRaw = req.body?.activeWorkOrg ?? req.body?.organization ?? req.body?.org;
  let nextActiveWorkOrg = settings.activeWorkOrg;
  if (requestedWorkOrgRaw !== undefined) {
    const rawWorkOrg = String(requestedWorkOrgRaw || "").trim();
    if (!rawWorkOrg) {
      nextActiveWorkOrg = workOrgPolicy.defaultOrg || settings.activeWorkOrg;
    } else {
      const normalizedWorkOrg = normalizeWorkOrgKey(rawWorkOrg);
      if (!workOrgPolicy.profiles[normalizedWorkOrg]) {
        return respondError(res, `Unknown work organization "${rawWorkOrg}".`, 400);
      }
      nextActiveWorkOrg = normalizedWorkOrg;
    }
  }
  settings.connectionPreference = preference.length ? preference : settings.connectionPreference;
  settings.connectionAvailable = available.length ? available : settings.connectionAvailable;
  settings.connectionAllowPublicInternet = allowPublicInternet;
  settings.connectionPublicInternetPrivate = publicInternetPrivate;
  settings.connectionRemoteBaseUrl = remoteBaseUrl;
  settings.networkRemoteAuthRequired = remoteAuthRequired;
  settings.networkRequireEncryptedRemote = requireEncryptedRemote;
  settings.networkStealthDeny = stealthDeny;
  settings.networkMobileDirectControlEnabled = mobileDirectControlEnabled;
  settings.activeWorkOrg = nextActiveWorkOrg;
  res.json({
    ok: true,
    connectionRouting: getConnectionRoutingState(),
    remoteBaseUrl: settings.connectionRemoteBaseUrl,
    mobileDirectControlEnabled: settings.networkMobileDirectControlEnabled,
    activeWorkOrg: settings.activeWorkOrg,
    workOrgs: getWorkOrgPolicySummary({ includeProfiles: false })
  });
});

  return router;
}

module.exports = createMobileRouter;
