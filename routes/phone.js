/**
 * Phone Routes — extracted from server.js (ADR-0001 Phase 3)
 * All /api/phone/* endpoints.
 */
const express = require("express");
const path = require("path");
const { asBool, asInt, respondError, inferHttpStatusForError } = require("../lib/helpers");
const { requirePhoneBridgeAccess, requireDesktopSuperMasterAuthority, requireMobileAuth } = require("../lib/mobileAuth");
const { evaluateGuardianGuard } = require("../lib/guardian");
const settingsLib = require("../lib/settings");
const runtimeStateLib = require("../lib/runtimeState");
const {
  capturePhoneMirrorSnapshot, getPhoneMirrorStatus, getPhoneMirrorSnapshotSummary,
  getPhoneMirrorImagePath, getPhoneMirrorVoiceOutput, tapPhone, swipePhone,
  typeOnPhone, keyOnPhone, openWhatsApp, openWhatsAppChat, sendWhatsAppText
} = require("../src/connectors/phoneMirrorConnector");
const {
  getPhoneDeveloperOptionsStatus, listPhoneDeveloperOptions,
  setPhoneDeveloperOption, sweepPhoneDeveloperOptions
} = require("../src/connectors/phoneDeveloperOptionsConnector");
const { getPhoneProMirrorStatus, startPhoneProMirror, stopPhoneProMirror } = require("../src/connectors/phoneProMirrorConnector");
const {
  initCapturesDir: initVirtualDisplayCapturesDir, listVirtualDisplays,
  createVirtualDisplays, destroyVirtualDisplays, captureVirtualDisplay,
  getVirtualDisplayImagePath, tapVirtualDisplay, typeOnVirtualDisplay, launchOnVirtualDisplay, getState: getVirtualDisplayState
} = require("../src/connectors/virtualDisplayConnector");
const { appendHookEvent } = require("../src/hookEventStore");
const { buildRouteHookEnvelope } = require("../src/hg256RuntimeContract");
const {
  resolveIxRuntimeBinding,
  resolveIxLaneBinding
} = require("../src/ixFabricAtlasStore");

function createPhoneRouter(ctx) {
  const router = express.Router();
  const settings = settingsLib.get();
  const runtimeState = runtimeStateLib.get();
  const app = {
    get: (path, ...h) => router.get(path, ...h),
    post: (path, ...h) => router.post(path, ...h)
  };
  // All phone deps from server.js context
  const deps = ctx;
  const PHONE_MIRROR_LANE_ID = "desktop-phone-mirror";
  const PHONE_ROUTE = "phone_mirror_runtime";
  const PHONE_ROLE = "phone-mirror-runtime";
  const PHONE_ROUTE_SOURCE_PATHS = [
    "routes/phone.js",
    "src/connectors/phoneMirrorConnector.js",
    "src/connectors/phoneProMirrorConnector.js",
    "src/connectors/virtualDisplayConnector.js",
    "src/hookEventStore.js",
    "src/hg256RuntimeContract.js"
  ];

  function normalizePhoneLaneBinding(binding = {}, routeStage = "status") {
    return {
      enabled: binding.enabled !== false,
      atlasId: String(binding.atlasId || ""),
      surfaceRegistryId: String(binding.surfaceRegistryId || ""),
      promotionQueueId: String(binding.promotionQueueId || ""),
      route: String(binding.route || PHONE_ROUTE),
      routeStage: String(binding.routeStage || routeStage),
      role: String(binding.role || PHONE_ROLE),
      roleSurfaceId: String(binding.roleSurfaceId || ""),
      sourcePaths: Array.isArray(binding.sourcePaths) && binding.sourcePaths.length
        ? binding.sourcePaths.map((entry) => String(entry))
        : PHONE_ROUTE_SOURCE_PATHS.slice(),
      matchingSurfaceIds: Array.isArray(binding.matchingSurfaceIds) ? binding.matchingSurfaceIds.map((entry) => String(entry)) : [],
      matchingGroupIds: Array.isArray(binding.matchingGroupIds) ? binding.matchingGroupIds.map((entry) => String(entry)) : [],
      laneId: String(binding.laneId || PHONE_MIRROR_LANE_ID),
      laneStatus: String(binding.laneStatus || "in_progress"),
      laneCurrentStage: String(binding.laneCurrentStage || "runtime_orchestration"),
      laneNextStage: String(binding.laneNextStage || "bounded_live_promotion")
    };
  }

  function resolvePhoneLaneBinding(req, routeStage, endpointId) {
    const resolver = typeof resolveIxLaneBinding === "function"
      ? resolveIxLaneBinding
      : resolveIxRuntimeBinding;
    try {
      const resolved = resolver({
        route: PHONE_ROUTE,
        routeStage,
        role: PHONE_ROLE,
        laneId: PHONE_MIRROR_LANE_ID,
        endpointId: String(endpointId || ""),
        sourcePaths: PHONE_ROUTE_SOURCE_PATHS,
        method: String(req?.method || "")
      });
      return normalizePhoneLaneBinding(resolved, routeStage);
    } catch (_error) {
      return normalizePhoneLaneBinding({}, routeStage);
    }
  }

  function toHookPreview(routeHook = {}) {
    return {
      evtId: String(routeHook.evtId || ""),
      route: String(routeHook.route || ""),
      routeStage: String(routeHook.routeStage || ""),
      qId: String(routeHook.qId || ""),
      scopeHash: String(routeHook.scopeHash || ""),
      laneId: String(routeHook.atlas?.laneId || ""),
      laneStatus: String(routeHook.atlas?.laneStatus || ""),
      laneCurrentStage: String(routeHook.atlas?.laneCurrentStage || "")
    };
  }

  function summarizePhoneHookString(value) {
    const text = String(value || "");
    return {
      type: "string",
      present: text.length > 0,
      length: text.length
    };
  }

  function sanitizePhoneHookPayload(value, depth = 0) {
    if (value === null || value === undefined) return value;
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value === "string") return summarizePhoneHookString(value);
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
      if (/(token|secret|password|authorization|cookie|text|prompt|message|base64|inline|image|path|url|endpoint|deviceid|filename|voice)/.test(normalizedKey)) {
        out[key] = summarizePhoneHookString(raw);
        continue;
      }
      out[key] = sanitizePhoneHookPayload(raw, depth + 1);
    }
    return out;
  }

  function buildPhoneHookDevicePid(packetSource, payloadSource) {
    const raw = packetSource?.deviceId || payloadSource?.deviceId || "";
    return raw ? "phone-device:provided" : "jesse-desktop";
  }

  function emitPhoneRouteHook(req, routeStage, endpointId, summary, packetSource, payloadSource, extraPayload = {}) {
    const laneBinding = resolvePhoneLaneBinding(req, routeStage, endpointId);
    const safePacketSource = sanitizePhoneHookPayload(packetSource || {});
    const safePayloadSource = sanitizePhoneHookPayload(payloadSource || {});
    const safeExtraPayload = sanitizePhoneHookPayload(extraPayload);
    const routeHook = buildRouteHookEnvelope({
      qId: "Q4_TRANSPORT_ENVELOPE",
      route: PHONE_ROUTE,
      routeStage,
      owner: "jesse",
      agentId: "routes-phone",
      role: PHONE_ROLE,
      constructionId: PHONE_MIRROR_LANE_ID,
      agentPid: process.pid,
      devicePid: buildPhoneHookDevicePid(packetSource, payloadSource),
      packetSource: safePacketSource,
      payloadSource: safePayloadSource,
      atlasBinding: laneBinding,
      proofRef: "reports/crypto/capsule.verify.json",
      verifyStatus: "pass_local_only"
    });
    appendHookEvent({
      event_type: "RouteHook",
      session_id: "routes-phone",
      source_app: "routes-phone",
      agent_id: "routes-phone",
      agent_type: "route_runtime",
      summary,
      trigger: String(routeStage || "status"),
      payload: {
        routeHook,
        endpointId: String(endpointId || ""),
        laneBinding,
        ...safeExtraPayload
      }
    });
    return { routeHook, laneBinding };
  }
app.get("/edge/status", requireMobileAuth, (req, res) => {
  const requested = requestedChannel(req);
  if (requested) {
    noteChannelHeartbeat(requested);
  }
  return res.json({
    ok: true,
    supportedModes: [
      "voice_relay",
      "camera_vision",
      "live_search",
      "iot_bridge"
    ],
    geminiApi: getGeminiApiConfigSummary(geminiApiPolicy),
    voiceTools: detectVoiceTools(),
    connectionRouting: getConnectionRoutingState(),
    note: "Use /api/phone/edge/gemini for Gemini-first phone assistant requests (text, camera inline image, live-search style, IoT command planning)."
  });
});

app.post("/edge/gemini", requireMobileAuth, async (req, res) => {
  try {
    const requested = requestedChannel(req);
    if (requested) {
      noteChannelHeartbeat(requested);
    }
    if (!geminiApiPolicy.enabled) {
      return respondError(res, "Gemini API integration is disabled by policy.", 403);
    }

    const mode = String(req.body?.mode || req.body?.pipeline || "assistant").trim().toLowerCase();
    const latencyMode = String(req.body?.latencyMode || "").trim().toLowerCase();
    const prompt = String(req.body?.prompt || req.body?.message || "").trim();
    const conversationId = normalizeConversationId(
      req.body?.chatId || req.body?.conversationId || req.body?.sessionId || "phone-live",
      "phone-live"
    );
    if (!prompt) {
      return respondError(res, "prompt is required.", 400);
    }
    appendGraphEvent({
      component: "phone-edge",
      category: "phone_assistant",
      action: "assistant_request",
      actor: {
        type: "device_channel",
        id: "phone",
        domain: requested || "mobile"
      },
      target: {
        type: "assistant_route",
        id: "phone-edge-gemini",
        criticality: "medium"
      },
      context: {
        mode,
        conversationId,
        requestedChannel: requested || "",
        preferLive: asBool(req.body?.preferLive, true)
      },
      policy: {
        approvalState: "not_required",
        mode: "mobile_auth_required"
      },
      detail: {
        hasInlineData: Boolean(String(req.body?.inlineData || req.body?.imageBase64 || "").trim())
      }
    });

    let system = String(req.body?.system || "").trim();
    if (!system) {
      if (mode === "camera_vision" || mode === "camera") {
        system = "You are Asolaria vision assist. Describe what is visible, list actionable steps, and flag uncertainty clearly.";
      } else if (mode === "live_search" || mode === "search") {
        system = "You are Asolaria live-search relay. Provide concise, dated guidance and clearly mark assumptions when facts may be stale.";
      } else if (mode === "iot_bridge" || mode === "iot") {
        system = "You are Asolaria IoT command planner. Return safe, step-by-step commands with validation checks before execution.";
      } else {
        system = "You are Asolaria phone edge assistant. Keep replies concise and operational.";
      }
    }
    system = [
      system,
      "",
      "You are cooperating with Asolaria, which owns memory, routing, tasks, and system state.",
      "Use available tools when the owner asks about current Asolaria status, current inbox/tasks/approvals, or asks you to continue work after this turn.",
      "Only call handoff_to_asolaria when the owner explicitly wants Asolaria to continue, monitor, or remember a follow-up."
    ].filter(Boolean).join("\n");

    const inlineData = req.body?.inlineData || req.body?.imageBase64 || "";
    const inlineMimeType = req.body?.inlineMimeType || req.body?.mimeType || "";
    const fastLatencyMode = latencyMode === "fast" || latencyMode === "voice";
    const preferLive = asBool(req.body?.preferLive, !fastLatencyMode);
    let result = null;
    let provider = "gemini-api";
    let liveError = "";
    let toolResult = null;
    let groundedToolResult = null;
    const memoryContext = await buildSharedMemoryContext(prompt, {
      recentLimit: Math.max(8, Math.min(24, Number(settings.memoryWindowTurns || 20))),
      costMode: settings.costMode,
      conversationId
    });

    const grounding = !result && !String(inlineData || "").trim()
      ? buildPhoneEdgeGeminiGroundingContext(prompt, mode)
      : { toolCalls: [], contextText: "" };
    if (!result && Array.isArray(grounding.toolCalls) && grounding.toolCalls.length) {
      groundedToolResult = {
        toolCalls: grounding.toolCalls
      };
    }
    const groundedSystem = [
      system,
      memoryContext,
      grounding.contextText
    ].filter(Boolean).join("\n\n");

    if (!result && fastLatencyMode && !String(inlineData || "").trim()) {
      const phoneUserName = getViewerDisplayName(req.query?.viewer || req.body?.viewer || req.headers["x-asolaria-viewer"]);
      const deterministicReply = buildPhoneEdgeGeminiDeterministicReply(prompt, grounding, phoneUserName);
      if (deterministicReply) {
        result = {
          reply: deterministicReply,
          toolCalls: grounding.toolCalls
        };
        provider = "asolaria-grounded-fast";
      }
    }

    if (!fastLatencyMode && preferLive && !String(inlineData || "").trim()) {
      try {
        result = await runGeminiLiveTextToolTurn({
          prompt,
          system,
          model: req.body?.model,
          temperature: req.body?.temperature,
          maxOutputTokens: req.body?.maxOutputTokens,
          timeoutMs: req.body?.timeoutMs || 8000,
          responseModalities: ["TEXT"],
          tools: buildPhoneEdgeGeminiToolDeclarations({ includeHandoff: false })
        }, vertexPolicy, {
          maxToolCalls: 4,
          onToolCall: (functionCall, toolContext) => {
            return executePhoneEdgeGeminiToolCall(functionCall, {
              ...toolContext,
              prompt,
              mode,
              source: "live_tool"
            });
          }
        });
        provider = String(result?.provider || "vertex-gemini-live").trim() || "vertex-gemini-live";
        toolResult = result;
      } catch (error) {
        liveError = String(error?.message || error || "gemini_live_failed").slice(0, 280);
      }
    }

    if (!result && !String(inlineData || "").trim()) {
      try {
        result = await runGeminiApiGenerateContent({
          prompt,
          system: groundedSystem,
          model: req.body?.model,
          temperature: req.body?.temperature,
          maxOutputTokens: req.body?.maxOutputTokens
        }, geminiApiPolicy);
        provider = "gemini-api";
      } catch (error) {
        if (!liveError) {
          liveError = String(error?.message || error || "gemini_api_failed").slice(0, 280);
        }
      }
    }

    if (!result && preferLive && !String(inlineData || "").trim()) {
      try {
        result = await runGeminiLiveTextTurn({
          prompt,
          system: groundedSystem,
          model: req.body?.model,
          temperature: req.body?.temperature,
          maxOutputTokens: req.body?.maxOutputTokens,
          timeoutMs: req.body?.timeoutMs || (fastLatencyMode ? 5000 : 8000),
          responseModalities: ["TEXT"]
        }, vertexPolicy);
        provider = String(result?.provider || "vertex-gemini-live").trim() || "vertex-gemini-live";
      } catch (error) {
        if (!liveError) {
          liveError = String(error?.message || error || "gemini_live_failed").slice(0, 280);
        }
      }
    }

    if (!result) {
      result = await runGeminiApiMultimodal({
        prompt,
        system: groundedSystem,
        model: req.body?.model,
        temperature: req.body?.temperature,
        maxOutputTokens: req.body?.maxOutputTokens,
        inlineData,
        inlineMimeType
      }, geminiApiPolicy);
      provider = "gemini-api";
    }

    const viewerName = phoneUserName || getViewerDisplayName(req.query?.viewer || req.body?.viewer || req.headers["x-asolaria-viewer"]);
    let replyText = normalizePhoneEdgeGreeting(result?.reply, undefined, viewerName);
    if (fastLatencyMode && provider !== "asolaria-grounded-fast" && isPhoneEdgeReplyIncomplete(replyText)) {
      replyText = repairPhoneEdgeFastReply(replyText, viewerName) || buildPhoneEdgeGeminiFallbackReply(prompt, viewerName);
    }
    if (prompt) {
      addUserTurn(prompt, {
        meta: {
          source: "phone-edge-gemini",
          mode,
          provider,
          chatId: conversationId,
          channel: requested || ""
        }
      });
    }
    if (replyText) {
      addAssistantTurn(replyText, {
        meta: {
          source: "phone-edge-gemini",
          mode,
          provider,
          chatId: conversationId,
          taskLedgerTaskId: extractPhoneEdgeGeminiHandoffTaskId(toolResult || groundedToolResult || result)
        }
      });
    }
    appendGraphEvent({
      component: "phone-edge",
      category: "phone_assistant",
      action: "assistant_reply",
      status: "ok",
      actor: {
        type: "assistant_route",
        id: "phone-edge-gemini"
      },
      target: {
        type: "conversation",
        id: conversationId,
        criticality: "low"
      },
      context: {
        mode,
        provider,
        requestedChannel: requested || ""
      },
      policy: {
        approvalState: "not_required",
        mode: "mobile_auth_required"
      },
      detail: {
        liveFallback: Boolean(liveError),
        taskLedgerTaskId: extractPhoneEdgeGeminiHandoffTaskId(toolResult || groundedToolResult || result),
        replyPreview: clipText(replyText, 180)
      }
    });

    return res.json({
      ok: true,
      mode,
      chatId: conversationId,
      provider,
      model: String(result?.model || ""),
      reply: replyText,
      taskLedgerTaskId: extractPhoneEdgeGeminiHandoffTaskId(toolResult || groundedToolResult || result),
      toolCalls: Array.isArray((toolResult || groundedToolResult || result)?.toolCalls)
        ? (toolResult || groundedToolResult || result).toolCalls.map((row) => ({
          name: String(row?.name || ""),
          ok: Boolean(row?.response?.ok),
          taskLedgerTaskId: String(row?.response?.taskLedgerTaskId || "")
        }))
        : [],
      liveFallback: Boolean(liveError),
      liveError
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.get("/developer-options/catalog", requirePhoneBridgeAccess, (req, res) => {
  try {
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

app.get("/developer-options/status", requirePhoneBridgeAccess, async (req, res) => {
  try {
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

app.post("/developer-options/set", requirePhoneBridgeAccess, requireDesktopSuperMasterAuthority, async (req, res) => {
  try {
    const optionId = String(req.body?.id || req.body?.toggleId || "").trim().toLowerCase();
    const state = String(req.body?.state || "").trim().toLowerCase();
    if (!optionId) {
      return respondError(res, "id (developer option id) is required.", 400);
    }
    if (state !== "on" && state !== "off") {
      return respondError(res, "state must be 'on' or 'off'.", 400);
    }

    const guard = await evaluateGuardianGuard({
      message: `Phone developer option set ${optionId}=${state}.`,
      routed: { action: "phone_developer_option_set" },
      source: "api.phone.developer_options.set"
    });
    if (guard.triggered && guard.blocked) {
      const approvalHint = guard.approvalRequest?.id
        ? ` Approval ID ${guard.approvalRequest.id}. Use APPROVE ${guard.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked developer option set (${guard.risk.level}). ${guard.decision?.text || ""}${approvalHint}`.trim(),
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

app.post("/developer-options/sweep", requirePhoneBridgeAccess, requireDesktopSuperMasterAuthority, async (req, res) => {
  try {
    const includeRisky = asBool(req.body?.includeRisky, false);
    const guard = await evaluateGuardianGuard({
      message: `Phone developer options sweep requested (includeRisky=${includeRisky ? "true" : "false"}).`,
      routed: { action: "phone_developer_options_sweep" },
      source: "api.phone.developer_options.sweep"
    });
    if (guard.triggered && guard.blocked) {
      const approvalHint = guard.approvalRequest?.id
        ? ` Approval ID ${guard.approvalRequest.id}. Use APPROVE ${guard.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked developer options sweep (${guard.risk.level}). ${guard.decision?.text || ""}${approvalHint}`.trim(),
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
      ...queueReply(job, `Queued phone developer-options sweep job ${job.id}.`),
      guardian: guard
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.get("/pro-mirror/status", requirePhoneBridgeAccess, (_req, res) => {
  try {
    const status = getPhoneProMirrorStatus();
    emitPhoneRouteHook(
      _req,
      "status",
      "/api/phone/pro-mirror/status",
      "Phone pro mirror status route hook appended.",
      { endpoint: "/api/phone/pro-mirror/status", method: "GET" },
      { proMirrorActive: Boolean(status?.active), proMirror: status }
    );
    return res.json({
      ok: true,
      proMirror: status
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 500));
  }
});

app.post("/pro-mirror/start", requirePhoneBridgeAccess, requireDesktopSuperMasterAuthority, async (req, res) => {
  try {
    const guard = await evaluateGuardianGuard({
      message: "Start phone pro mirror session (scrcpy).",
      routed: { action: "phone_pro_mirror_start" },
      source: "api.phone.pro_mirror.start"
    });
    if (guard.triggered && guard.blocked) {
      const approvalHint = guard.approvalRequest?.id
        ? ` Approval ID ${guard.approvalRequest.id}. Use APPROVE ${guard.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked pro mirror start (${guard.risk.level}). ${guard.decision?.text || ""}${approvalHint}`.trim(),
        403
      );
    }

    const result = startPhoneProMirror({
      deviceId: String(req.body?.deviceId || "").trim(),
      maxFps: asInt(req.body?.maxFps, 60, 15, 120),
      maxSize: asInt(req.body?.maxSize, 0, 0, 4096),
      videoBitRate: String(req.body?.videoBitRate || "").trim(),
      alwaysOnTop: asBool(req.body?.alwaysOnTop, true),
      stayAwake: asBool(req.body?.stayAwake, true),
      turnScreenOff: asBool(req.body?.turnScreenOff, false),
      noAudio: asBool(req.body?.noAudio, true),
      noControl: asBool(req.body?.noControl, false),
      fullscreen: asBool(req.body?.fullscreen, false),
      windowTitle: String(req.body?.windowTitle || "Asolaria Pro Mirror").trim()
    });
    emitPhoneRouteHook(
      req,
      "start",
      "/api/phone/pro-mirror/start",
      "Phone pro mirror start route hook appended.",
      {
        endpoint: "/api/phone/pro-mirror/start",
        method: "POST",
        deviceId: String(req.body?.deviceId || "").trim()
      },
      {
        result,
        guardianBlocked: false
      }
    );

    return res.json({
      ok: true,
      result,
      guardian: guard
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.post("/pro-mirror/stop", requirePhoneBridgeAccess, requireDesktopSuperMasterAuthority, async (_req, res) => {
  try {
    const result = stopPhoneProMirror();
    emitPhoneRouteHook(
      _req,
      "stop",
      "/api/phone/pro-mirror/stop",
      "Phone pro mirror stop route hook appended.",
      { endpoint: "/api/phone/pro-mirror/stop", method: "POST" },
      { result }
    );
    return res.json({
      ok: true,
      result
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.get("/mirror/status", requirePhoneBridgeAccess, async (req, res) => {
  try {
    const mirror = await getPhoneMirrorStatus({
      deviceId: String(req.query?.deviceId || "").trim(),
      timeoutMs: asInt(req.query?.timeoutMs, 8000, 2000, 45000)
    });
    const proMirror = getPhoneProMirrorStatus();
    const snapshot = getPhoneMirrorSnapshotSummary();
    const voice = getPhoneMirrorVoiceOutput();
    const whatsapp = readGuardianWhatsAppConfig() || {};
    emitPhoneRouteHook(
      req,
      "status",
      "/api/phone/mirror/status",
      "Phone mirror status route hook appended.",
      {
        endpoint: "/api/phone/mirror/status",
        method: "GET",
        deviceId: String(req.query?.deviceId || "").trim()
      },
      {
        mirrorConnected: Boolean(mirror?.connected || mirror?.online || mirror?.ok),
        proMirrorActive: Boolean(proMirror?.active),
        snapshotCapturedAt: snapshot?.capturedAt || snapshot?.capturedAtMs || "",
        voicePath: String(voice?.path || "")
      }
    );
    return res.json({
      ok: true,
      mirror,
      proMirror,
      snapshot,
      voice,
      whatsapp: {
        enabled: Boolean(whatsapp.enabled),
        notifyMode: String(whatsapp.notifyMode || "critical_or_security"),
        configured: Boolean(whatsapp.configured),
        app: String(whatsapp.app || ""),
        packageName: String(whatsapp.packageName || ""),
        userId: whatsapp.userId === "" ? "" : Number(whatsapp.userId),
        backupAsolariaNumber: String(whatsapp.backupAsolariaNumber || ""),
        backupUserNumber: String(whatsapp.backupUserNumber || ""),
        hasBackupAsolariaNumber: Boolean(whatsapp.hasBackupAsolariaNumber),
        hasBackupUserNumber: Boolean(whatsapp.hasBackupUserNumber),
        updatedAt: String(whatsapp.updatedAt || "")
      }
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 500));
  }
});

app.post("/mirror/capture", requirePhoneBridgeAccess, async (req, res) => {
  try {
    const snapshot = await capturePhoneMirrorSnapshot({
      deviceId: String(req.body?.deviceId || "").trim(),
      fileName: req.body?.fileName,
      timeoutMs: asInt(req.body?.timeoutMs, 20000, 4000, 120000)
    });
    emitPhoneRouteHook(
      req,
      "capture",
      "/api/phone/mirror/capture",
      "Phone mirror capture route hook appended.",
      {
        endpoint: "/api/phone/mirror/capture",
        method: "POST",
        deviceId: String(req.body?.deviceId || "").trim(),
        fileName: String(req.body?.fileName || "")
      },
      {
        snapshot,
        imageUrl: `/api/phone/mirror/image?v=${encodeURIComponent(String(snapshot.capturedAtMs || Date.now()))}`
      }
    );
    return res.json({
      ok: true,
      snapshot: {
        ...snapshot,
        imageUrl: `/api/phone/mirror/image?v=${encodeURIComponent(String(snapshot.capturedAtMs || Date.now()))}`
      }
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.get("/mirror/lane/status", requirePhoneBridgeAccess, async (req, res) => {
  try {
    const mirror = await getPhoneMirrorStatus({
      deviceId: String(req.query?.deviceId || "").trim(),
      timeoutMs: asInt(req.query?.timeoutMs, 8000, 2000, 45000)
    });
    const proMirror = getPhoneProMirrorStatus();
    const { routeHook, laneBinding } = emitPhoneRouteHook(
      req,
      "status",
      "/api/phone/mirror/lane/status",
      "Phone mirror lane status route hook appended.",
      {
        endpoint: "/api/phone/mirror/lane/status",
        method: "GET",
        deviceId: String(req.query?.deviceId || "").trim()
      },
      {
        mirrorConnected: Boolean(mirror?.connected || mirror?.online || mirror?.ok),
        proMirrorActive: Boolean(proMirror?.active)
      }
    );
    return res.json({
      ok: true,
      mirror,
      proMirror,
      laneBinding,
      controller: {
        route: PHONE_ROUTE,
        role: PHONE_ROLE,
        laneId: laneBinding.laneId,
        laneStatus: laneBinding.laneStatus,
        laneCurrentStage: laneBinding.laneCurrentStage,
        laneNextStage: laneBinding.laneNextStage,
        matchingSurfaceIds: laneBinding.matchingSurfaceIds,
        matchingGroupIds: laneBinding.matchingGroupIds
      },
      routeHook: toHookPreview(routeHook)
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 500));
  }
});

app.get("/mirror/image", requirePhoneBridgeAccess, (_req, res) => {
  const imagePath = getPhoneMirrorImagePath();
  if (!imagePath) {
    return respondError(res, "No phone mirror capture is available yet. Trigger /api/phone/mirror/capture first.", 404);
  }
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.type("png");
  return res.sendFile(imagePath);
});

app.post("/mirror/control/tap", requirePhoneBridgeAccess, requireDesktopSuperMasterAuthority, async (req, res) => {
  try {
    const snapshot = getPhoneMirrorSnapshotSummary();
    const result = await sendPhoneTap({
      deviceId: String(req.body?.deviceId || "").trim(),
      x: req.body?.x,
      y: req.body?.y,
      screenWidth: req.body?.screenWidth ?? snapshot.width,
      screenHeight: req.body?.screenHeight ?? snapshot.height,
      timeoutMs: asInt(req.body?.timeoutMs, 10000, 3000, 60000)
    });
    emitPhoneRouteHook(
      req,
      "control_tap",
      "/api/phone/mirror/control/tap",
      "Phone mirror tap control route hook appended.",
      {
        endpoint: "/api/phone/mirror/control/tap",
        method: "POST",
        deviceId: String(req.body?.deviceId || "").trim()
      },
      {
        result
      }
    );
    return res.json({
      ok: true,
      result
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.post("/mirror/control/swipe", requirePhoneBridgeAccess, requireDesktopSuperMasterAuthority, async (req, res) => {
  try {
    const snapshot = getPhoneMirrorSnapshotSummary();
    const result = await sendPhoneSwipe({
      deviceId: String(req.body?.deviceId || "").trim(),
      startX: req.body?.startX,
      startY: req.body?.startY,
      endX: req.body?.endX,
      endY: req.body?.endY,
      durationMs: req.body?.durationMs,
      screenWidth: req.body?.screenWidth ?? snapshot.width,
      screenHeight: req.body?.screenHeight ?? snapshot.height,
      timeoutMs: asInt(req.body?.timeoutMs, 10000, 3000, 60000)
    });
    emitPhoneRouteHook(
      req,
      "control_swipe",
      "/api/phone/mirror/control/swipe",
      "Phone mirror swipe control route hook appended.",
      {
        endpoint: "/api/phone/mirror/control/swipe",
        method: "POST",
        deviceId: String(req.body?.deviceId || "").trim()
      },
      {
        result
      }
    );
    return res.json({
      ok: true,
      result
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.post("/mirror/control/text", requirePhoneBridgeAccess, requireDesktopSuperMasterAuthority, async (req, res) => {
  try {
    const result = await sendPhoneText({
      deviceId: String(req.body?.deviceId || "").trim(),
      text: req.body?.text,
      timeoutMs: asInt(req.body?.timeoutMs, 10000, 3000, 60000)
    });
    emitPhoneRouteHook(
      req,
      "control_text",
      "/api/phone/mirror/control/text",
      "Phone mirror text control route hook appended.",
      {
        endpoint: "/api/phone/mirror/control/text",
        method: "POST",
        deviceId: String(req.body?.deviceId || "").trim()
      },
      {
        textLength: String(req.body?.text || "").length,
        result
      }
    );
    return res.json({
      ok: true,
      result
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.post("/mirror/control/key", requirePhoneBridgeAccess, requireDesktopSuperMasterAuthority, async (req, res) => {
  try {
    const result = await sendPhoneKey({
      deviceId: String(req.body?.deviceId || "").trim(),
      key: req.body?.key,
      timeoutMs: asInt(req.body?.timeoutMs, 10000, 3000, 60000)
    });
    emitPhoneRouteHook(
      req,
      "control_key",
      "/api/phone/mirror/control/key",
      "Phone mirror key control route hook appended.",
      {
        endpoint: "/api/phone/mirror/control/key",
        method: "POST",
        deviceId: String(req.body?.deviceId || "").trim()
      },
      {
        key: String(req.body?.key || ""),
        result
      }
    );
    return res.json({
      ok: true,
      result
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.post("/mirror/whatsapp/open", requirePhoneBridgeAccess, requireDesktopSuperMasterAuthority, async (req, res) => {
  try {
    const result = await openPhoneWhatsApp({
      deviceId: String(req.body?.deviceId || "").trim(),
      whatsappApp: String(req.body?.whatsappApp || req.body?.app || "").trim(),
      whatsappPackage: String(req.body?.whatsappPackage || req.body?.packageName || req.body?.package || "").trim(),
      userId: req.body?.userId,
      timeoutMs: asInt(req.body?.timeoutMs, 10000, 3000, 60000)
    });
    return res.json({
      ok: true,
      result
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.get("/mirror/whatsapp/targets", requirePhoneBridgeAccess, async (req, res) => {
  try {
    const result = await listInstalledWhatsAppTargets({
      deviceId: String(req.query?.deviceId || "").trim(),
      timeoutMs: asInt(req.query?.timeoutMs, 12000, 3000, 60000)
    });
    return res.json({
      ok: true,
      targets: result
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.post("/mirror/whatsapp/send", requirePhoneBridgeAccess, requireDesktopSuperMasterAuthority, async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();
    if (!message) {
      return respondError(res, "message is required.", 400);
    }
    const targetPreset = String(req.body?.targetPreset || "").trim().toLowerCase();
    const guardianWhatsApp = readGuardianWhatsAppConfig({ reveal: true }) || {};
    let resolvedToNumber = String(req.body?.toNumber || "").trim();
    if (!resolvedToNumber && (targetPreset === "backup_asolaria" || targetPreset === "backup_user")) {
      resolvedToNumber = targetPreset === "backup_asolaria"
        ? String(guardianWhatsApp.backupAsolariaNumber || "").trim()
        : String(guardianWhatsApp.backupUserNumber || "").trim();
    }
    if ((targetPreset === "backup_asolaria" || targetPreset === "backup_user") && !resolvedToNumber) {
      return respondError(
        res,
        targetPreset === "backup_asolaria"
          ? "backupAsolariaNumber is not configured."
          : "backupUserNumber is not configured.",
        400
      );
    }

    const whatsapp = await sendDirectWhatsAppMessage(message, {
      prefix: String(req.body?.prefix || "Asolaria Mode").trim(),
      toNumber: resolvedToNumber,
      whatsappApp: String(req.body?.whatsappApp || req.body?.app || "").trim(),
      whatsappPackage: String(req.body?.whatsappPackage || req.body?.packageName || req.body?.package || "").trim(),
      userId: req.body?.userId,
      deviceId: String(req.body?.deviceId || "").trim(),
      mode: String(req.body?.mode || "").trim().toLowerCase()
    });

    let voice = null;
    const includeVoice = asBool(req.body?.voice, false) || asBool(req.body?.includeVoice, false);
    if (includeVoice) {
      const voiceText = String(req.body?.voiceText || message).trim();
      if (voiceText) {
        const voiceFileName = safePhoneVoiceFileName(req.body?.voiceFileName, "phone-whatsapp-voice-latest.wav");
        const outputPath = resolveCapturePath("voice", voiceFileName);
        const voiceResult = await synthesizeSpeechToFile(voiceText, outputPath, {
          voice: req.body?.voiceName || req.body?.voiceProfile || req.body?.voice,
          timeoutMs: asInt(req.body?.voiceTimeoutMs, 45000, 3000, 180000)
        });
        setPhoneMirrorVoiceOutput(voiceResult.outputPath || outputPath);
        voice = {
          ok: true,
          outputPath: String(voiceResult.outputPath || outputPath),
          mode: String(voiceResult.mode || "")
        };
      } else {
        voice = {
          ok: false,
          reason: "voice_text_required"
        };
      }
    }

    if (!whatsapp?.ok) {
      return res.status(400).json({
        ok: false,
        error: String(whatsapp?.reason || "whatsapp_send_failed"),
        whatsapp,
        voice
      });
    }

    return res.json({
      ok: true,
      whatsapp,
      voice
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.post("/mirror/whatsapp/linked/open-chat", requirePhoneBridgeAccess, requireDesktopSuperMasterAuthority, async (req, res) => {
  try {
    const guard = await evaluateGuardianGuard({
      message: `Open linked WhatsApp chat (${String(req.body?.toNumber || "").trim() || "configured target"}).`,
      routed: { action: "phone_whatsapp_open_chat" },
      source: "api.phone.whatsapp.linked.open_chat"
    });
    if (guard.triggered && guard.blocked) {
      const approvalHint = guard.approvalRequest?.id
        ? ` Approval ID ${guard.approvalRequest.id}. Use APPROVE ${guard.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked linked WhatsApp open-chat (${guard.risk.level}). ${guard.decision?.text || ""}${approvalHint}`.trim(),
        403
      );
    }

    const config = readGuardianWhatsAppConfig({ reveal: true }) || {};
    const fallbackTo = normalizePhoneDigits(config.toNumber);
    const toNumber = normalizePhoneDigits(req.body?.toNumber || fallbackTo);
    const whatsappApp = String(req.body?.whatsappApp || req.body?.app || config.app || "").trim();
    const whatsappPackage = String(req.body?.whatsappPackage || req.body?.packageName || req.body?.package || config.packageName || "").trim();
    const whatsappUserId = req.body?.userId !== undefined ? req.body?.userId : config.userId;
    if (!toNumber) {
      return respondError(res, "toNumber is required (or configure guardian WhatsApp toNumber).", 400);
    }
    const result = await openPhoneWhatsAppChat({
      deviceId: String(req.body?.deviceId || "").trim(),
      phone: toNumber,
      message: String(req.body?.message || req.body?.prefillText || "").trim(),
      whatsappApp,
      whatsappPackage,
      userId: whatsappUserId,
      timeoutMs: asInt(req.body?.timeoutMs, 10000, 3000, 60000)
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

app.post("/mirror/whatsapp/linked/voice-note", requirePhoneBridgeAccess, requireDesktopSuperMasterAuthority, async (req, res) => {
  try {
    const config = readGuardianWhatsAppConfig({ reveal: true }) || {};
    const fallbackTo = normalizePhoneDigits(config.toNumber);
    const toNumber = normalizePhoneDigits(req.body?.toNumber || fallbackTo);
    const whatsappApp = String(req.body?.whatsappApp || req.body?.app || config.app || "").trim();
    const whatsappPackage = String(req.body?.whatsappPackage || req.body?.packageName || req.body?.package || config.packageName || "").trim();
    const whatsappUserId = req.body?.userId !== undefined ? req.body?.userId : config.userId;
    if (!toNumber) {
      return respondError(res, "toNumber is required (or configure guardian WhatsApp toNumber).", 400);
    }

    const micX = req.body?.micX;
    const micY = req.body?.micY;
    if (!Number.isFinite(Number(micX)) || !Number.isFinite(Number(micY))) {
      return respondError(res, "micX and micY are required.", 400);
    }
    const holdMs = asInt(req.body?.holdMs, 2400, 700, 12000);
    const approval = await requestExplicitLinkedVoiceNoteApproval({
      approvalId: req.body?.approvalId,
      toNumber,
      micX,
      micY,
      holdMs,
      voiceText: req.body?.voiceText || req.body?.message || ""
    });
    if (!approval.approved) {
      return res.status(409).json({
        ok: false,
        approvalRequired: true,
        approvalRequest: approval.approvalRequest || null
      });
    }

    const deviceId = String(req.body?.deviceId || "").trim();
    const openResult = await openPhoneWhatsAppChat({
      deviceId,
      phone: toNumber,
      message: String(req.body?.prefillText || "").trim(),
      whatsappApp,
      whatsappPackage,
      userId: whatsappUserId,
      timeoutMs: asInt(req.body?.timeoutMs, 12000, 3000, 60000)
    });
    await sleepMs(asInt(req.body?.prepDelayMs, 900, 150, 7000));

    let snapshot = getPhoneMirrorSnapshotSummary();
    if (!Number(snapshot?.width) || !Number(snapshot?.height)) {
      try {
        snapshot = await capturePhoneMirrorSnapshot({
          deviceId,
          timeoutMs: asInt(req.body?.captureTimeoutMs, 18000, 4000, 120000)
        });
      } catch (_error) {
        snapshot = getPhoneMirrorSnapshotSummary();
      }
    }
    const screenWidth = asInt(req.body?.screenWidth, Number(snapshot?.width || 0), 1, 10000);
    const screenHeight = asInt(req.body?.screenHeight, Number(snapshot?.height || 0), 1, 10000);
    if (!screenWidth || !screenHeight) {
      return respondError(res, "Phone screen size is unavailable. Capture mirror first and retry.", 400);
    }

    const macro = await sendPhoneSwipe({
      deviceId,
      startX: micX,
      startY: micY,
      endX: micX,
      endY: micY,
      durationMs: holdMs,
      screenWidth,
      screenHeight,
      timeoutMs: asInt(req.body?.macroTimeoutMs, 15000, 3000, 70000)
    });

    return res.json({
      ok: true,
      approvalUsed: approval.approvalId || "",
      openChat: openResult,
      macro
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.get("/mirror/voice/latest", requirePhoneBridgeAccess, (_req, res) => {
  const latest = getPhoneMirrorVoiceOutput();
  if (!latest.path) {
    return respondError(res, "No phone mirror voice output is available yet.", 404);
  }
  const ext = path.extname(latest.path).toLowerCase();
  if (ext === ".mp3") {
    res.type("audio/mpeg");
  } else {
    res.type("audio/wav");
  }
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  return res.sendFile(latest.path);
});

// ── Virtual Display Routes ──────────────────────────────────────────────
initVirtualDisplayCapturesDir(path.resolve(__dirname));

app.get("/virtual-display/list", requirePhoneBridgeAccess, (_req, res) => {
  try {
    const result = listVirtualDisplays();
    emitPhoneRouteHook(
      _req,
      "virtual_display_list",
      "/api/phone/virtual-display/list",
      "Virtual display list route hook appended.",
      {
        endpoint: "/api/phone/virtual-display/list",
        method: "GET"
      },
      {
        displayCount: Array.isArray(result?.displays) ? result.displays.length : 0,
        result
      }
    );
    return res.json({ ok: true, ...result, state: getVirtualDisplayState() });
  } catch (error) {
    return respondError(res, error, 500);
  }
});

app.post("/virtual-display/create", requirePhoneBridgeAccess, requireDesktopSuperMasterAuthority, (req, res) => {
  try {
    const result = createVirtualDisplays({
      count: req.body?.count,
      width: req.body?.width,
      height: req.body?.height,
      dpi: req.body?.dpi
    });
    emitPhoneRouteHook(
      req,
      "virtual_display_create",
      "/api/phone/virtual-display/create",
      "Virtual display create route hook appended.",
      {
        endpoint: "/api/phone/virtual-display/create",
        method: "POST"
      },
      {
        result
      }
    );
    return res.json(result);
  } catch (error) {
    return respondError(res, error, 500);
  }
});

app.post("/virtual-display/destroy", requirePhoneBridgeAccess, requireDesktopSuperMasterAuthority, (_req, res) => {
  try {
    const result = destroyVirtualDisplays();
    emitPhoneRouteHook(
      _req,
      "virtual_display_destroy",
      "/api/phone/virtual-display/destroy",
      "Virtual display destroy route hook appended.",
      {
        endpoint: "/api/phone/virtual-display/destroy",
        method: "POST"
      },
      {
        result
      }
    );
    return res.json(result);
  } catch (error) {
    return respondError(res, error, 500);
  }
});

app.post("/virtual-display/capture", requirePhoneBridgeAccess, (req, res) => {
  try {
    const displayIndex = Number(req.body?.displayIndex || req.body?.display || 1);
    const result = captureVirtualDisplay(displayIndex, { baseDir: path.resolve(__dirname) });
    if (!result.ok) {
      return res.status(400).json(result);
    }
    emitPhoneRouteHook(
      req,
      "virtual_display_capture",
      "/api/phone/virtual-display/capture",
      "Virtual display capture route hook appended.",
      {
        endpoint: "/api/phone/virtual-display/capture",
        method: "POST",
        displayIndex
      },
      {
        result
      }
    );
    return res.json(result);
  } catch (error) {
    return respondError(res, error, 500);
  }
});

app.get("/virtual-display/image/:displayIndex", requirePhoneBridgeAccess, (req, res) => {
  try {
    const displayIndex = Number(req.params.displayIndex || 1);
    const result = getVirtualDisplayImagePath(displayIndex, { baseDir: path.resolve(__dirname) });
    if (!result.ok || !result.localPath) {
      return respondError(res, `No capture available for virtual display ${displayIndex}.`, 404);
    }
    emitPhoneRouteHook(
      req,
      "virtual_display_image",
      "/api/phone/virtual-display/image/:displayIndex",
      "Virtual display image route hook appended.",
      {
        endpoint: "/api/phone/virtual-display/image/:displayIndex",
        method: "GET",
        displayIndex
      },
      {
        result
      }
    );
    res.type("image/png");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    return res.sendFile(result.localPath);
  } catch (error) {
    return respondError(res, error, 500);
  }
});

app.post("/virtual-display/tap", requirePhoneBridgeAccess, requireDesktopSuperMasterAuthority, (req, res) => {
  try {
    const displayIndex = Number(req.body?.displayIndex || req.body?.display || 1);
    const x = Number(req.body?.x || 0);
    const y = Number(req.body?.y || 0);
    const result = tapVirtualDisplay(displayIndex, x, y);
    emitPhoneRouteHook(
      req,
      "virtual_display_tap",
      "/api/phone/virtual-display/tap",
      "Virtual display tap route hook appended.",
      {
        endpoint: "/api/phone/virtual-display/tap",
        method: "POST",
        displayIndex
      },
      {
        x,
        y,
        result
      }
    );
    return res.json(result);
  } catch (error) {
    return respondError(res, error, 500);
  }
});

app.post("/virtual-display/type", requirePhoneBridgeAccess, requireDesktopSuperMasterAuthority, (req, res) => {
  try {
    const displayIndex = Number(req.body?.displayIndex || req.body?.display || 1);
    const text = String(req.body?.text || "");
    if (!text) {
      return respondError(res, "text is required.", 400);
    }
    const result = typeOnVirtualDisplay(displayIndex, text);
    emitPhoneRouteHook(
      req,
      "virtual_display_type",
      "/api/phone/virtual-display/type",
      "Virtual display type route hook appended.",
      {
        endpoint: "/api/phone/virtual-display/type",
        method: "POST",
        displayIndex
      },
      {
        textLength: text.length,
        result
      }
    );
    return res.json(result);
  } catch (error) {
    return respondError(res, error, 500);
  }
});

app.post("/virtual-display/launch", requirePhoneBridgeAccess, requireDesktopSuperMasterAuthority, (req, res) => {
  try {
    const displayIndex = Number(req.body?.displayIndex || req.body?.display || 1);
    const component = String(req.body?.component || "").trim();
    if (!component) {
      return respondError(res, "component is required (e.g. com.package/.Activity).", 400);
    }
    const result = launchOnVirtualDisplay(displayIndex, component);
    emitPhoneRouteHook(
      req,
      "virtual_display_launch",
      "/api/phone/virtual-display/launch",
      "Virtual display launch route hook appended.",
      {
        endpoint: "/api/phone/virtual-display/launch",
        method: "POST",
        displayIndex
      },
      {
        component,
        result
      }
    );
    return res.json(result);
  } catch (error) {
    return respondError(res, error, 500);
  }
});

// ── Guardian status/profile/smtp extracted to routes/guardian.js (ADR-0001 Phase 3) ──

// ── Guardian all read routes + smtp/whatsapp config extracted to routes/guardian.js (ADR-0001 Phase 3) ──

  return router;
}

module.exports = createPhoneRouter;
