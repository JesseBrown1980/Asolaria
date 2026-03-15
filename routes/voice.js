/**
 * Voice Routes — extracted from server.js (ADR-0001 Phase 3)
 * All /api/voice/* endpoints.
 */
const express = require("express");
const path = require("path");
const { asBool, asInt, respondError, inferHttpStatusForError } = require("../lib/helpers");
const { isLoopbackRequest } = require("../lib/network");
const { requireMobileAuth } = require("../lib/mobileAuth");
const { evaluateGuardianGuard } = require("../lib/guardian");
const settingsLib = require("../lib/settings");
const runtimeStateLib = require("../lib/runtimeState");

function createVoiceRouter(ctx) {
  const router = express.Router();
  const settings = settingsLib.get();
  const runtimeState = runtimeStateLib.get();
  const app = {
    get: (path, ...h) => router.get(path, ...h),
    post: (path, ...h) => router.post(path, ...h),
    options: (path, ...h) => router.options ? router.options(path, ...h) : router.route(path).options(...h)
  };
  const deps = ctx;
app.get("/devices", async (req, res) => {
  try {
    const inventory = await getVoiceDeviceInventory({
      force: asBool(req.query?.refresh, false),
      ffmpegPath: String(req.query?.ffmpegPath || "").trim()
    });
    return res.json({
      ok: true,
      captureModes: inventory.captureModes,
      inputDevices: inventory.inputDevices,
      ffmpeg: inventory.ffmpeg,
      selected: {
        inputCaptureMode: settings.voiceInputCaptureMode,
        inputDevice: settings.voiceInputDevice,
        outputDeviceId: settings.voiceOutputDeviceId
      }
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.get("/status", (req, res) => {
  const tools = detectVoiceTools();
  const includeTranscript = asBool(req.query?.includeTranscript, false);
  const includeSegments = asBool(req.query?.includeSegments, true);
  const maxSegments = asInt(req.query?.maxSegments, 40, 1, 120);
  const bridge = ensureVoiceBridgeCaptionState();
  const orchestrator = ensureVoiceBridgeOrchestratorState();
  const bridgeSummary = buildVoiceBridgeCaptionLaneSummaries({
    sessionId: req.query?.sessionId
  });
  const bridgeLanesWithTargets = Array.isArray(bridgeSummary.lanes)
    ? bridgeSummary.lanes.map((lane) => {
      const laneId = sanitizeVoiceBridgeCaptionLaneId(lane?.laneId || "default");
      const route = getVoiceBridgeOrchestratorLaneRoute(orchestrator, laneId);
      const laneState = orchestrator.lanes?.[laneId];
      return {
        ...lane,
        target: sanitizeVoiceBridgeOrchestratorTarget(
          orchestrator.assignments?.[laneId] || orchestrator.defaultTarget || "transcript"
        ),
        outgoingEnabled: route.outgoingEnabled,
        lastAnalysis: clipText(String(laneState?.lastAnalysis || ""), 240),
        lastAnalysisAt: String(laneState?.lastAnalysisAt || "")
      };
    })
    : [];
  res.json({
    ok: true,
    tools,
    plan: buildVoicePlan(),
    latest: {
      path: runtimeState.voice.latestPath,
      mode: runtimeState.voice.latestMode,
      provider: runtimeState.voice.latestProvider,
      updatedAt: runtimeState.voice.latestUpdatedAt,
      lastError: runtimeState.voice.lastError
    },
    bridgeCaption: {
      ...bridgeSummary,
      lanes: bridgeLanesWithTargets,
      auth: buildVoiceBridgeCaptionPushAuthStatus(),
      bridge: {
        sessionId: String(bridge.sessionId || ""),
        source: String(bridge.source || "google_meet_caption"),
        laneId: String(bridge.laneId || "default"),
        lastId: Number(bridge.lastId || 0),
        acceptedCount: Number(bridge.acceptedCount || 0),
        dedupedCount: Number(bridge.dedupedCount || 0),
        rejectedCount: Number(bridge.rejectedCount || 0),
        pullCount: Number(bridge.pullCount || 0),
        resetCount: Number(bridge.resetCount || 0),
        lastPushAt: String(bridge.lastPushAt || ""),
        lastPullAt: String(bridge.lastPullAt || ""),
        lastReason: String(bridge.lastReason || "")
      }
    },
    bridgeOrchestrator: buildVoiceBridgeOrchestratorStatus({
      includeEvents: asBool(req.query?.includeOrchestratorEvents, false),
      includeLanes: true,
      maxEvents: req.query?.orchestratorMaxEvents,
      maxLanes: req.query?.orchestratorMaxLanes
    }),
    live: buildLiveVoiceStatus({
      includeTranscript,
      includeSegments,
      maxSegments
    }),
    selected: {
      voiceEnabled: settings.voiceEnabled,
      outputMode: settings.voiceOutputMode,
      autoSpeakReplies: settings.voiceAutoSpeakReplies,
      wakeWord: settings.voiceWakeWord,
      inputCaptureMode: settings.voiceInputCaptureMode,
      inputDevice: settings.voiceInputDevice,
      outputDeviceId: settings.voiceOutputDeviceId,
      kittyTtsUrl: settings.kittyTtsUrl,
      kittyTtsApiKeyConfigured: settings.kittyTtsApiKeyConfigured,
      avatarEnabled: settings.avatarEnabled,
      avatarMode: settings.avatarMode
    },
    connectionRouting: getConnectionRoutingState()
  });
});

// ── Phone routes (block 1) extracted to routes/phone.js (ADR-0001 Phase 3) ──
app.post("/transcribe", async (req, res) => {
  try {
    const inputPath = String(req.body?.inputPath || "").trim();
    if (!inputPath) {
      return respondError(res, "inputPath is required.", 400);
    }
    const result = await transcribeAudioFile(inputPath, {
      language: req.body?.language,
      model: req.body?.model,
      timeoutMs: req.body?.timeoutMs,
      providerPreference: req.body?.providerPreference
    });
    return res.json({
      ok: true,
      text: result.text,
      mode: String(result.mode || ""),
      provider: String(result.provider || "")
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.post("/listen", async (req, res) => {
  try {
    const inputPath = String(req.body?.inputPath || "").trim();
    if (!inputPath) {
      return respondError(res, "inputPath is required.", 400);
    }
    const result = await transcribeAudioFile(inputPath, {
      language: req.body?.language,
      model: req.body?.model,
      timeoutMs: req.body?.timeoutMs,
      providerPreference: req.body?.providerPreference
    });
    return res.json({
      ok: true,
      text: result.text,
      mode: String(result.mode || ""),
      provider: String(result.provider || "")
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.post("/transcribe-chunk", async (req, res) => {
  try {
    const audioBuffer = decodeAudioBase64Payload(req.body?.audioBase64 || req.body?.audio || "");
    const maxBytes = Math.max(
      128 * 1024,
      Math.min(16 * 1024 * 1024, Number(req.body?.maxBytes || 6 * 1024 * 1024))
    );
    const minBytes = Math.max(
      256,
      Math.min(128 * 1024, Number(req.body?.minBytes || 768))
    );
    if (audioBuffer.length > maxBytes) {
      return respondError(res, `Audio chunk is too large (${audioBuffer.length} bytes > ${maxBytes} bytes).`, 413);
    }
    const sessionId = safeRealtimeTranscriptSessionId(req.body?.sessionId);
    const sequence = Number.isFinite(Number(req.body?.sequence))
      ? Math.max(0, Math.floor(Number(req.body?.sequence)))
      : 0;
    if (audioBuffer.length < minBytes) {
      return res.json({
        ok: true,
        sessionId,
        sequence,
        bytes: audioBuffer.length,
        skipped: true,
        reason: "chunk_too_small",
        text: ""
      });
    }
    const extension = inferAudioExtensionFromMimeType(req.body?.mimeType, ".webm");
    const fileName = safeVoiceFileName(
      `realtime-${sessionId}-${String(sequence).padStart(6, "0")}-${Date.now()}${extension}`,
      "realtime-chunk.webm"
    );
    const inputPath = resolveCapturePath("voice", "realtime", sessionId, fileName);
    fs.mkdirSync(path.dirname(inputPath), { recursive: true });
    fs.writeFileSync(inputPath, audioBuffer);
    let transcribeInputPath = inputPath;
    if (shouldNormalizeRealtimeChunkToWav(req.body?.mimeType, extension)) {
      try {
        transcribeInputPath = await normalizeRealtimeChunkToWav(inputPath, {
          ffmpegPath: req.body?.ffmpegPath || req.body?.ffmpeg,
          timeoutMs: req.body?.timeoutMs
        });
      } catch (error) {
        console.warn("realtime chunk normalization warning:", String(error?.message || error || "normalize_failed"));
      }
    }
    let result;
    try {
      result = await transcribeAudioFile(transcribeInputPath, {
        language: req.body?.language,
        model: req.body?.model,
        timeoutMs: req.body?.timeoutMs,
        providerPreference: req.body?.providerPreference
      });
    } catch (error) {
      const detail = String(error?.message || error || "").toLowerCase();
      const likelyDecodeFailure = (
        detail.includes("invalid data found when processing input")
        || detail.includes("error while decoding")
        || detail.includes("could not find codec parameters")
        || detail.includes("header missing")
        || detail.includes("moov atom not found")
        || detail.includes("end of file")
      );
      if (likelyDecodeFailure && audioBuffer.length < 128 * 1024) {
        return res.json({
          ok: true,
          sessionId,
          sequence,
          bytes: audioBuffer.length,
          skipped: true,
          reason: "chunk_decode_failed",
          text: ""
        });
      }
      throw error;
    }
    return res.json({
      ok: true,
      sessionId,
      sequence,
      bytes: audioBuffer.length,
      text: String(result.text || "").trim(),
      mode: String(result.mode || ""),
      provider: String(result.provider || "")
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.get("/live/status", (req, res) => {
  const includeTranscript = asBool(req.query?.includeTranscript, true);
  const includeSegments = asBool(req.query?.includeSegments, true);
  const maxSegments = asInt(req.query?.maxSegments, 60, 1, 120);
  const includeBridgeCaptions = asBool(req.query?.includeBridgeCaptions ?? req.query?.bridge, false);
  const source = normalizeLiveTranscriptCompatSource(req.query?.source, includeBridgeCaptions);
  const live = buildLiveVoiceStatus({
    includeTranscript,
    includeSegments,
    maxSegments
  });
  const payload = {
    ok: true,
    tools: detectVoiceTools(),
    live
  };
  if (source !== "live" || includeBridgeCaptions) {
    const compat = buildLiveTranscriptCompatibilitySnapshot({
      live,
      includeBridgeCaptions,
      source,
      bridgeSessionId: req.query?.bridgeSessionId || req.query?.bridgeSession || req.query?.sessionId,
      bridgeLaneId: req.query?.bridgeLaneId || req.query?.bridgeLane || req.query?.laneId || req.query?.lane,
      bridgeMaxEntries: req.query?.bridgeMaxEntries
    });
    payload.compatTranscript = {
      source: compat.source,
      transcript: compat.transcript,
      liveTranscript: compat.liveTranscript,
      bridgeTranscript: compat.bridgeTranscript,
      liveSessionId: compat.liveSessionId,
      bridgeSessionId: compat.bridgeSessionId,
      bridge: compat.bridge
    };
  }
  return res.json(payload);
});

app.post("/live/start", (req, res) => {
  try {
    const live = startLiveVoiceTranscription({
      captureMode: req.body?.captureMode || req.body?.mode || req.body?.source,
      inputDevice: req.body?.inputDevice || req.body?.device,
      loopbackInputDevice: req.body?.loopbackInputDevice || req.body?.speakerInputDevice,
      microphoneInputDevice: req.body?.microphoneInputDevice || req.body?.micInputDevice || req.body?.micDevice,
      chunkSeconds: req.body?.chunkSeconds,
      language: req.body?.language,
      model: req.body?.model,
      ffmpegPath: req.body?.ffmpegPath || req.body?.ffmpeg
    });
    return res.json({
      ok: true,
      started: true,
      live
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.post("/live/stop", (req, res) => {
  const reason = String(req.body?.reason || "").trim();
  stopLiveVoiceTranscription(reason);
  return res.json({
    ok: true,
    stopped: true,
    live: buildLiveVoiceStatus({
      includeTranscript: true,
      includeSegments: true,
      maxSegments: 120
    })
  });
});

app.get("/live/transcript", (req, res) => {
  const live = buildLiveVoiceStatus({
    includeTranscript: true,
    includeSegments: false
  });
  const includeBridgeCaptions = asBool(req.query?.includeBridgeCaptions ?? req.query?.bridge, false);
  const source = normalizeLiveTranscriptCompatSource(req.query?.source, includeBridgeCaptions);
  const compat = buildLiveTranscriptCompatibilitySnapshot({
    live,
    includeBridgeCaptions,
    source,
    bridgeSessionId: req.query?.bridgeSessionId || req.query?.bridgeSession || req.query?.sessionId,
    bridgeLaneId: req.query?.bridgeLaneId || req.query?.bridgeLane || req.query?.laneId || req.query?.lane,
    bridgeMaxEntries: req.query?.bridgeMaxEntries
  });
  const asText = asBool(req.query?.text, false);
  if (asText) {
    res.type("text/plain; charset=utf-8");
    return res.send(String(compat.transcript || ""));
  }
  const payload = {
    ok: true,
    sessionId: live.sessionId,
    running: live.running,
    transcript: compat.transcript
  };
  if (source !== "live" || includeBridgeCaptions) {
    payload.compat = {
      source: compat.source,
      liveTranscript: compat.liveTranscript,
      bridgeTranscript: compat.bridgeTranscript,
      liveSessionId: compat.liveSessionId,
      bridgeSessionId: compat.bridgeSessionId,
      bridge: compat.bridge
    };
  }
  return res.json(payload);
});

app.post("/live/injection/enqueue", async (req, res) => {
  try {
    const live = runtimeState.voice.live;
    if (!live || !live.running) {
      return respondError(res, "Live voice transcription is not running.", 409);
    }
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const text = String(body.text || "").trim();
    let inputPath = String(body.inputPath || body.path || "").trim();
    let source = String(body.source || "").trim() || "voice_injection";
    if (text) {
      const provider = normalizeVoiceOutputMode(
        body.provider || body.voiceOutputMode || settings.voiceOutputMode,
        settings.voiceOutputMode
      );
      const providerForConnector = provider === "browser"
        ? "auto"
        : (provider === "server" ? "auto" : provider);
      const fileName = safeVoiceFileName(
        body.fileName,
        `live-injection-${Date.now()}.wav`
      );
      const generatedPath = resolveCapturePath("voice", "injections", live.sessionId || "live", fileName);
      fs.mkdirSync(path.dirname(generatedPath), { recursive: true });
      const speech = await synthesizeSpeechToFile(text, generatedPath, {
        provider: providerForConnector,
        voice: body.voice,
        timeoutMs: body.timeoutMs
      });
      inputPath = String(speech?.outputPath || generatedPath);
      source = source || "voice_speak";
    }
    const queued = enqueueLiveVoiceInjectionAudio({
      inputPath,
      source,
      label: body.label || (text ? `tts:${text.slice(0, 42)}` : ""),
      gain: body.gain
    });
    return res.json({
      ok: true,
      queued,
      live: buildLiveVoiceStatus({
        includeTranscript: false,
        includeSegments: false
      })
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.post("/live/injection/clear", (req, res) => {
  const reason = String(req.body?.reason || "").trim();
  const dropped = clearLiveVoiceInjectionQueue({
    reason: reason || "injection queue cleared",
    resetCounters: asBool(req.body?.resetCounters, false)
  });
  return res.json({
    ok: true,
    dropped,
    live: buildLiveVoiceStatus({
      includeTranscript: false,
      includeSegments: false
    })
  });
});

app.options("/bridge-caption/push", (_req, res) => {
  setVoiceBridgeCaptionCorsHeaders(res);
  return res.status(204).end();
});

function handleVoiceBridgeCaptionPush(req, res) {
  setVoiceBridgeCaptionCorsHeaders(res);
  const auth = verifyVoiceBridgeCaptionPushToken(req);
  if (!auth.ok) {
    const message = auth.required && !auth.configured
      ? "Bridge caption push token is required but not configured."
      : "Invalid bridge caption push token.";
    return respondError(res, message, 403);
  }
  const result = pushVoiceBridgeCaptionEntry({
    text: req.query?.text || req.body?.text,
    source: req.query?.source || req.body?.source,
    direction: req.query?.direction || req.body?.direction,
    sessionId: req.query?.sessionId || req.body?.sessionId,
    laneId: req.query?.laneId || req.query?.lane || req.body?.laneId || req.body?.lane,
    at: req.query?.at || req.body?.at
  });
  return res.status(200).json({
    ok: true,
    accepted: Boolean(result.accepted),
    deduped: Boolean(result.deduped),
    reason: String(result.reason || ""),
    bridge: {
      sessionId: String(result.bridge?.sessionId || ""),
      source: String(result.bridge?.source || "google_meet_caption"),
      laneId: sanitizeVoiceBridgeCaptionLaneId(result.bridge?.laneId || "default"),
      lastId: Number(result.bridge?.lastId || 0),
      entriesCount: Array.isArray(result.bridge?.entries) ? result.bridge.entries.length : 0,
      diagnostics: {
        acceptedCount: Number(result.bridge?.acceptedCount || 0),
        dedupedCount: Number(result.bridge?.dedupedCount || 0),
        rejectedCount: Number(result.bridge?.rejectedCount || 0),
        pullCount: Number(result.bridge?.pullCount || 0),
        resetCount: Number(result.bridge?.resetCount || 0),
        lastPushAt: String(result.bridge?.lastPushAt || ""),
        lastPullAt: String(result.bridge?.lastPullAt || ""),
        lastReason: String(result.bridge?.lastReason || ""),
        lastMonotonicAdjustMs: Number(result.bridge?.lastMonotonicAdjustMs || 0)
      }
    },
    entry: result.entry || null
  });
}

app.get("/bridge-caption/push", (req, res) => handleVoiceBridgeCaptionPush(req, res));
app.post("/bridge-caption/push", (req, res) => handleVoiceBridgeCaptionPush(req, res));

app.post("/bridge-caption/lane-test", async (req, res) => {
  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const laneId = sanitizeVoiceBridgeCaptionLaneId(body.laneId || body.lane || "default");
    const source = sanitizeVoiceBridgeCaptionSource(body.source || "voice_lane_probe");
    const direction = sanitizeVoiceBridgeCaptionDirection(body.direction, "outgoing");
    const text = normalizeVoiceBridgeCaptionText(
      body.text || `Asolaria lane test ${new Date().toLocaleTimeString("en-US", { hour12: false })}`
    );
    const sessionId = normalizeRealtimeTranscriptSessionIdOptional(body.sessionId)
      || normalizeRealtimeTranscriptSessionIdOptional(runtimeState.voice.bridgeCaption?.sessionId)
      || safeRealtimeTranscriptSessionId("lane-test");
    let speech = null;
    let injected = null;
    let warning = "";
    const runSpeak = asBool(body.speak, true);
    if (runSpeak && text && settings.voiceEnabled) {
      try {
        const provider = normalizeVoiceOutputMode(
          body.provider || body.voiceOutputMode || settings.voiceOutputMode,
          settings.voiceOutputMode
        );
        const providerForConnector = provider === "browser"
          ? "auto"
          : (provider === "server" ? "auto" : provider);
        const fileName = safeVoiceFileName(body.fileName, `lane-probe-${Date.now()}.wav`);
        const outputPath = resolveCapturePath("voice", "lane-tests", sessionId, fileName);
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        speech = await synthesizeSpeechToFile(text, outputPath, {
          provider: providerForConnector,
          voice: body.voice,
          timeoutMs: body.timeoutMs
        });
        if (asBool(body.injectToLive, true) && runtimeState.voice.live?.running) {
          injected = enqueueLiveVoiceInjectionAudio({
            inputPath: String(speech?.outputPath || outputPath),
            source,
            label: `lane:${laneId} ${text.slice(0, 40)}`,
            gain: body.gain
          });
        }
      } catch (error) {
        warning = clipText(String(error?.message || error || "lane_probe_speak_failed"), 240);
      }
    }

    const pushed = pushVoiceBridgeCaptionEntry({
      text,
      source,
      direction,
      sessionId,
      laneId,
      at: body.at || new Date().toISOString()
    });

    runVoiceBridgeOrchestratorTick({ reason: "lane_test" });

    return res.json({
      ok: true,
      laneId,
      sessionId,
      direction,
      source,
      text,
      speech: speech
        ? {
          outputPath: String(speech.outputPath || ""),
          mode: String(speech.mode || ""),
          provider: String(speech.provider || "")
        }
        : null,
      injected,
      warning,
      accepted: Boolean(pushed.accepted),
      deduped: Boolean(pushed.deduped),
      entry: pushed.entry || null,
      orchestrator: buildVoiceBridgeOrchestratorStatus({
        includeEvents: false,
        includeLanes: true,
        maxLanes: 24
      })
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.post("/bridge-caption/reset", (req, res) => {
  const bridge = resetVoiceBridgeCaptionState({
    sessionId: req.body?.sessionId || req.query?.sessionId,
    source: req.body?.source || req.query?.source,
    laneId: req.body?.laneId || req.query?.laneId || req.body?.lane || req.query?.lane,
    reason: req.body?.reason || req.query?.reason || "api_reset"
  });
  return res.json({
    ok: true,
    bridge: {
      sessionId: String(bridge.sessionId || ""),
      source: String(bridge.source || "google_meet_caption"),
      laneId: sanitizeVoiceBridgeCaptionLaneId(bridge.laneId || "default"),
      lastId: Number(bridge.lastId || 0),
      entriesCount: Array.isArray(bridge.entries) ? bridge.entries.length : 0,
      diagnostics: {
        acceptedCount: Number(bridge.acceptedCount || 0),
        dedupedCount: Number(bridge.dedupedCount || 0),
        rejectedCount: Number(bridge.rejectedCount || 0),
        pullCount: Number(bridge.pullCount || 0),
        resetCount: Number(bridge.resetCount || 0),
        lastPushAt: String(bridge.lastPushAt || ""),
        lastPullAt: String(bridge.lastPullAt || ""),
        lastReason: String(bridge.lastReason || ""),
        lastMonotonicAdjustMs: Number(bridge.lastMonotonicAdjustMs || 0)
      }
    }
  });
});

app.get("/bridge-caption/pull", (req, res) => {
  const payload = pullVoiceBridgeCaptionEntries({
    afterId: req.query?.afterId,
    limit: req.query?.limit,
    sessionId: req.query?.sessionId,
    laneId: req.query?.laneId || req.query?.lane
  });
  return res.json({
    ok: true,
    sessionId: payload.sessionId,
    source: payload.source,
    laneId: payload.laneId,
    lastId: payload.lastId,
    entriesCount: payload.entriesCount,
    diagnostics: payload.diagnostics || {},
    entries: payload.entries
  });
});

app.get("/bridge-caption/lanes", (req, res) => {
  const summary = buildVoiceBridgeCaptionLaneSummaries({
    sessionId: req.query?.sessionId
  });
  const orchestrator = ensureVoiceBridgeOrchestratorState();
  const lanes = (summary.lanes || []).map((lane) => {
    const laneId = sanitizeVoiceBridgeCaptionLaneId(lane?.laneId || "default");
    const assigned = sanitizeVoiceBridgeOrchestratorTarget(
      orchestrator.assignments?.[laneId] || orchestrator.defaultTarget || "transcript"
    );
    const route = getVoiceBridgeOrchestratorLaneRoute(orchestrator, laneId);
    const laneState = orchestrator.lanes?.[laneId];
    return {
      ...lane,
      target: assigned,
      outgoingEnabled: route.outgoingEnabled,
      lastAnalysis: clipText(String(laneState?.lastAnalysis || ""), 240),
      lastAnalysisAt: String(laneState?.lastAnalysisAt || "")
    };
  });
  return res.json({
    ok: true,
    sessionId: String(summary.sessionId || ""),
    entriesCount: Number(summary.entriesCount || 0),
    auth: buildVoiceBridgeCaptionPushAuthStatus(),
    defaultOutgoingEnabled: asBool(orchestrator.defaultOutgoingEnabled, true),
    lanes
  });
});

app.get("/bridge-caption/auth-status", (_req, res) => {
  return res.json({
    ok: true,
    auth: buildVoiceBridgeCaptionPushAuthStatus()
  });
});

app.get("/bridge-caption/orchestrator/status", (req, res) => {
  const status = buildVoiceBridgeOrchestratorStatus({
    includeEvents: asBool(req.query?.includeEvents, false),
    includeLanes: asBool(req.query?.includeLanes, true),
    maxEvents: req.query?.maxEvents,
    maxLanes: req.query?.maxLanes
  });
  return res.json({
    ok: true,
    orchestrator: status
  });
});

app.post("/bridge-caption/orchestrator/start", (req, res) => {
  try {
    const orchestrator = startVoiceBridgeOrchestrator({
      reason: req.body?.reason || req.query?.reason || "api_start",
      sessionId: req.body?.sessionId || req.query?.sessionId,
      mode: req.body?.mode || req.query?.mode,
      enabled: req.body?.enabled,
      defaultTarget: req.body?.defaultTarget || req.query?.defaultTarget,
      defaultOutgoingEnabled: req.body?.defaultOutgoingEnabled ?? req.query?.defaultOutgoingEnabled,
      analysisEnabled: req.body?.analysisEnabled ?? req.query?.analysisEnabled,
      analysisMode: req.body?.analysisMode || req.query?.analysisMode,
      pollIntervalMs: req.body?.pollIntervalMs || req.query?.pollIntervalMs,
      staleMs: req.body?.staleMs || req.query?.staleMs,
      maxEventsPerTick: req.body?.maxEventsPerTick || req.query?.maxEventsPerTick
    });
    return res.json({
      ok: true,
      orchestrator
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.post("/bridge-caption/orchestrator/stop", (req, res) => {
  try {
    const orchestrator = stopVoiceBridgeOrchestrator({
      reason: req.body?.reason || req.query?.reason || "api_stop",
      enabled: req.body?.enabled
    });
    return res.json({
      ok: true,
      orchestrator
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.post("/bridge-caption/orchestrator/reset", (req, res) => {
  try {
    const orchestrator = resetVoiceBridgeOrchestratorState({
      reason: req.body?.reason || req.query?.reason || "api_reset",
      keepAssignments: req.body?.keepAssignments ?? req.query?.keepAssignments,
      keepLaneRoutes: req.body?.keepLaneRoutes ?? req.query?.keepLaneRoutes,
      sessionId: req.body?.sessionId || req.query?.sessionId
    });
    return res.json({
      ok: true,
      orchestrator
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.post("/bridge-caption/orchestrator/assign", (req, res) => {
  try {
    const assignment = setVoiceBridgeOrchestratorLaneAssignment({
      laneId: req.body?.laneId || req.body?.lane || req.query?.laneId || req.query?.lane,
      target: req.body?.target || req.body?.route || req.query?.target || req.query?.route
    });
    runVoiceBridgeOrchestratorTick({ reason: "api_assign" });
    return res.json({
      ok: true,
      assignment,
      orchestrator: buildVoiceBridgeOrchestratorStatus({
        includeEvents: false,
        includeLanes: true
      })
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.post("/bridge-caption/orchestrator/route", (req, res) => {
  try {
    const route = setVoiceBridgeOrchestratorLaneRoute({
      laneId: req.body?.laneId || req.body?.lane || req.query?.laneId || req.query?.lane,
      outgoingEnabled: req.body?.outgoingEnabled ?? req.body?.enabled ?? req.query?.outgoingEnabled ?? req.query?.enabled
    });
    runVoiceBridgeOrchestratorTick({ reason: "api_route" });
    return res.json({
      ok: true,
      route,
      orchestrator: buildVoiceBridgeOrchestratorStatus({
        includeEvents: false,
        includeLanes: true
      })
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.post("/bridge-caption/orchestrator/analysis", (req, res) => {
  try {
    const analysis = setVoiceBridgeOrchestratorAnalysisMode({
      analysisEnabled: req.body?.analysisEnabled ?? req.body?.enabled ?? req.query?.analysisEnabled ?? req.query?.enabled,
      analysisMode: req.body?.analysisMode || req.body?.mode || req.query?.analysisMode || req.query?.mode
    });
    runVoiceBridgeOrchestratorTick({ reason: "api_analysis_mode" });
    return res.json({
      ok: true,
      analysis,
      orchestrator: buildVoiceBridgeOrchestratorStatus({
        includeEvents: false,
        includeLanes: true
      })
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.post("/bridge-caption/orchestrator/tick", (req, res) => {
  try {
    const result = runVoiceBridgeOrchestratorTick({
      reason: req.body?.reason || req.query?.reason || "api_tick"
    });
    return res.json({
      ok: true,
      result,
      orchestrator: buildVoiceBridgeOrchestratorStatus({
        includeEvents: asBool(req.body?.includeEvents ?? req.query?.includeEvents, false),
        includeLanes: true
      })
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.post("/speak", async (req, res) => {
  try {
    if (!settings.voiceEnabled) {
      return respondError(res, "Voice output is disabled in settings.", 409);
    }
    const text = String(req.body?.text || "").trim();
    if (!text) {
      return respondError(res, "text is required.", 400);
    }
    const provider = normalizeVoiceOutputMode(
      req.body?.provider || req.body?.voiceOutputMode || settings.voiceOutputMode,
      settings.voiceOutputMode
    );
    if (provider === "browser" || provider === "android_tts") {
      runtimeState.voice.latestMode = "browser-client";
      runtimeState.voice.latestProvider = provider;
      runtimeState.voice.latestUpdatedAt = new Date().toISOString();
      runtimeState.voice.lastError = "";
      return res.json({
        ok: true,
        outputPath: "",
        mode: "browser-client",
        provider
      });
    }
    const fileName = safeVoiceFileName(req.body?.fileName, "voice-output.wav");
    const outputPath = resolveCapturePath("voice", fileName);
    const providerForConnector = provider === "server" ? "auto" : provider;
    const result = await synthesizeSpeechToFile(text, outputPath, {
      provider: providerForConnector,
      voice: req.body?.voice,
      timeoutMs: req.body?.timeoutMs
    });
    const injectToLive = asBool(
      req.body?.injectToLive ?? req.body?.injectIntoLive,
      LIVE_VOICE_TRANSCRIBE_AUTO_INJECT_SPEAK
    );
    let injected = null;
    let injectionWarning = "";
    if (injectToLive) {
      try {
        injected = enqueueLiveVoiceInjectionAudio({
          inputPath: String(result.outputPath || outputPath),
          source: "voice_speak",
          label: String(req.body?.injectLabel || `tts:${text.slice(0, 42)}`).trim(),
          gain: req.body?.injectGain
        });
      } catch (error) {
        injectionWarning = String(error?.message || error || "live_injection_enqueue_failed");
      }
    }
    runtimeState.voice.latestPath = String(result.outputPath || outputPath);
    runtimeState.voice.latestMode = String(result.mode || "");
    runtimeState.voice.latestProvider = provider;
    runtimeState.voice.latestUpdatedAt = new Date().toISOString();
    runtimeState.voice.lastError = "";
    return res.json({
      ok: true,
      outputPath: result.outputPath,
      mode: result.mode,
      provider,
      injected,
      injectionWarning
    });
  } catch (error) {
    runtimeState.voice.lastError = String(error?.message || error || "voice_speak_failed").slice(0, 240);
    runtimeState.voice.latestUpdatedAt = new Date().toISOString();
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.get("/latest", (_req, res) => {
  const latestPath = String(runtimeState.voice.latestPath || "").trim();
  if (!latestPath) {
    return respondError(res, "No voice output is available yet.", 404);
  }
  const ext = path.extname(latestPath).toLowerCase();
  if (ext === ".mp3") {
    res.type("audio/mpeg");
  } else if (ext === ".ogg") {
    res.type("audio/ogg");
  } else if (ext === ".txt") {
    res.type("text/plain; charset=utf-8");
  } else {
    res.type("audio/wav");
  }
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  return res.sendFile(latestPath);
});

app.post("/reply", async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();
    if (!message) {
      return respondError(res, "message is required.", 400);
    }
    const memoryContext = await buildSharedMemoryContext(message, {
      recentLimit: Math.max(4, Math.min(24, settings.memoryWindowTurns)),
      costMode: settings.costMode
    });
    const result = await runBrainTask({
      message,
      images: [],
      memoryContext,
      settings: {
        ...settings,
        costMode: settings.costMode === "quality" ? "balanced" : settings.costMode
      },
      toolPaths
    });
    const reply = String(result.reply || "").trim();
    const chunks = splitSentences(reply, Number(req.body?.maxChunkChars || 220));
    return res.json({
      ok: true,
      provider: result.provider,
      reply,
      chunks
    });
  } catch (error) {
    return respondError(res, error, 400);
  }
});

// ── Phone routes (block 2) extracted to routes/phone.js (ADR-0001 Phase 3) ──
  return router;
}

module.exports = createVoiceRouter;
