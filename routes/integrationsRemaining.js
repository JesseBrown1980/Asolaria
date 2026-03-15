/**
 * Remaining Integration Routes — extracted from server.js (ADR-0001 Phase 3)
 * Config, OAuth, and operation routes for all integration services.
 */
const express = require("express");
const { asBool, asEnum, asInt, respondError, inferHttpStatusForError, queueReply } = require("../lib/helpers");
const { isLoopbackRequest } = require("../lib/network");
const { requireLoopbackOnly, requireMobileAuth, requirePhoneBridgeAccess, requireDesktopSuperMasterAuthority } = require("../lib/mobileAuth");
const { evaluateGuardianGuard } = require("../lib/guardian");
const { requirePermission } = require("../middleware/auth");
const settingsLib = require("../lib/settings");
const runtimeStateLib = require("../lib/runtimeState");

function createRemainingIntegrationsRouter(ctx) {
  const router = express.Router();
  const settings = settingsLib.get();
  const runtimeState = runtimeStateLib.get();
  const app = {
    get: (path, ...h) => router.get(path, ...h),
    post: (path, ...h) => router.post(path, ...h),
    put: (path, ...h) => router.put(path, ...h),
    options: (path, ...h) => router.route(path).options(...h.pop())
  };
  const deps = ctx;
app.get("/mqtt/browser-feed", requireLoopbackOnly, async (req, res) => {
  try {
    setMqttBrowserFeedCorsHeaders(req, res);
    return res.json(await buildMqttBrowserRealtimePacket({
      includeWorldPreview: asBool(req.query?.preview, false)
    }));
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 500));
  }
});

app.post("/mqtt/config", async (req, res) => {
  try {
    if (!isLoopbackRequest(req)) {
      return respondError(res, "MQTT configuration is only allowed from local loopback.", 403);
    }

    const body = req.body && typeof req.body === "object" ? req.body : {};
    const clear = asBool(body?.clear, false);
    const brokerUrl = String(body?.brokerUrl || "").trim();
    const baseTopic = String(body?.baseTopic || "").trim();
    const guardian = await evaluateGuardianGuard({
      message: clear
        ? "MQTT integration settings clear request"
        : `MQTT integration settings update request${brokerUrl ? ` broker=${brokerUrl}` : ""}${baseTopic ? ` baseTopic=${baseTopic}` : ""}`,
      routed: { action: "mqtt_config" },
      source: "api.integrations.mqtt.config"
    });
    if (guardian.triggered && guardian.blocked) {
      const approvalHint = guardian.approvalRequest?.id
        ? ` Approval ID ${guardian.approvalRequest.id}. Use APPROVE ${guardian.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked MQTT config update (${guardian.risk.level}). ${guardian.decision?.text || ""}${approvalHint}`.trim(),
        403
      );
    }

    const input = { clear };
    if (!clear) {
      const has = (key) => Object.prototype.hasOwnProperty.call(body, key);
      if (has("enabled")) input.enabled = asBool(body?.enabled, true);
      if (has("brokerUrl")) input.brokerUrl = brokerUrl;
      if (has("username")) input.username = String(body?.username || "").trim();
      if (has("password")) input.password = String(body?.password || "").trim();
      if (has("clientId")) input.clientId = String(body?.clientId || "").trim();
      if (has("baseTopic")) input.baseTopic = baseTopic;
      if (has("qos")) input.qos = asInt(body?.qos, 1, 0, 2);
      if (has("retainState")) input.retainState = asBool(body?.retainState, true);
      if (has("includeGraphEvents")) input.includeGraphEvents = asBool(body?.includeGraphEvents, true);
      if (has("includeActionManifests")) input.includeActionManifests = asBool(body?.includeActionManifests, true);
      if (has("includeHealth")) input.includeHealth = asBool(body?.includeHealth, true);
      if (has("includeColony")) input.includeColony = asBool(body?.includeColony, true);
      if (has("includeWorld")) input.includeWorld = asBool(body?.includeWorld, true);
      if (has("controlEnabled")) input.controlEnabled = asBool(body?.controlEnabled, true);
      if (has("allowInsecureTls")) input.allowInsecureTls = asBool(body?.allowInsecureTls, false);
      if (has("healthIntervalMs")) input.healthIntervalMs = asInt(body?.healthIntervalMs, 30000, 5000, 300000);
      if (has("colonyIntervalMs")) input.colonyIntervalMs = asInt(body?.colonyIntervalMs, 10000, 3000, 300000);
      if (has("worldIntervalMs")) input.worldIntervalMs = asInt(body?.worldIntervalMs, 15000, 5000, 300000);
    }

    const config = setMqttConfig(input);
    const status = await syncMqttBridge({ reason: clear ? "config_clear" : "config_update" });
    return res.json({
      ok: true,
      config,
      status,
      guardian
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.post("/mqtt/publish", requireLoopbackOnly, async (req, res) => {
  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const topic = String(body?.topic || "").trim();
    const topicSuffix = String(body?.topicSuffix || body?.relativeTopic || "").trim();
    if (!topic && !topicSuffix) {
      return respondError(res, "topic or topicSuffix is required.", 400);
    }

    const guardian = await evaluateGuardianGuard({
      message: `MQTT publish request ${topic || topicSuffix}`,
      routed: { action: "mqtt_publish" },
      source: "api.integrations.mqtt.publish"
    });
    if (guardian.triggered && guardian.blocked) {
      const approvalHint = guardian.approvalRequest?.id
        ? ` Approval ID ${guardian.approvalRequest.id}. Use APPROVE ${guardian.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked MQTT publish (${guardian.risk.level}). ${guardian.decision?.text || ""}${approvalHint}`.trim(),
        403
      );
    }

    const published = await publishMqttMessage({
      topic,
      topicSuffix,
      payload: body?.payload,
      qos: body?.qos,
      retain: body?.retain,
      timeoutMs: body?.timeoutMs
    });
    return res.json({
      ok: true,
      published,
      status: getMqttIntegrationStatus(),
      guardian
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

// ── Federation (remote sub-colony nodes) ────────────────────────────
app.post("/telegram/config", async (req, res) => {
  try {
    if (!isLoopbackRequest(req)) {
      return respondError(res, "Telegram configuration is only allowed from local loopback.", 403);
    }

    const body = req.body && typeof req.body === "object" ? req.body : {};
    const clear = asBool(body?.clear, false);

    const guardian = await evaluateGuardianGuard({
      message: clear
        ? "Telegram integration settings clear request"
        : "Telegram integration settings update request",
      routed: { action: "telegram_config" },
      source: "api.integrations.telegram.config"
    });
    if (guardian.triggered && guardian.blocked) {
      const approvalHint = guardian.approvalRequest?.id
        ? ` Approval ID ${guardian.approvalRequest.id}. Use APPROVE ${guardian.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked Telegram config update (${guardian.risk.level}). ${guardian.decision?.text || ""}${approvalHint}`.trim(),
        403
      );
    }

    const input = { clear };
    if (!clear) {
      const has = (key) => Object.prototype.hasOwnProperty.call(body, key);

      if (has("botToken") || has("token")) {
        input.botToken = String(body?.botToken || body?.token || "").trim();
      }
      if (has("allowedChatIds") || has("allowedChats") || has("allowedChatId")) {
        input.allowedChatIds = Array.isArray(body?.allowedChatIds)
          ? body.allowedChatIds
          : String(body?.allowedChatIds || body?.allowedChats || body?.allowedChatId || "").trim();
      }
      if (has("defaultChatId")) {
        input.defaultChatId = String(body?.defaultChatId || "").trim();
      }
      if (has("webhookSecretToken") || has("webhookSecret")) {
        input.webhookSecretToken = String(body?.webhookSecretToken || body?.webhookSecret || "").trim();
      }
      if (has("pollingEnabled")) {
        input.pollingEnabled = asBool(body?.pollingEnabled, false);
      }
    }

    const config = setTelegramConfig(input);
    try {
      syncTelegramPollingFromConfig({ reason: clear ? "config_clear" : "config_update" });
    } catch (_error) {
      // best-effort: config saved even if polling sync fails
    }
    return res.json({
      ok: true,
      config,
      guardian
    });
  } catch (error) {
    return respondError(res, error, 400);
  }
});

app.post("/telegram/send", async (req, res) => {
  try {
    if (!telegramPolicy.enabled) {
      return respondError(res, "Telegram integration is disabled by policy.", 403);
    }

    const chatId = String(req.body?.chatId || req.body?.chat_id || "").trim();
    const text = clipText(String(req.body?.text || req.body?.message || ""), telegramPolicy.maxOutboundChars).trim();
    if (!text) {
      return respondError(res, "text is required.", 400);
    }

    const guardian = await evaluateGuardianGuard({
      message: `Telegram send chatId=${chatId || "(default)"} len=${text.length}`,
      routed: { action: "telegram_send" },
      source: "api.integrations.telegram.send"
    });
    if (guardian.triggered && guardian.blocked) {
      const approvalHint = guardian.approvalRequest?.id
        ? ` Approval ID ${guardian.approvalRequest.id}. Use APPROVE ${guardian.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked Telegram send (${guardian.risk.level}). ${guardian.decision?.text || ""}${approvalHint}`.trim(),
        403
      );
    }

    const job = enqueueTelegramSend({
      chatId,
      text,
      disableNotification: asBool(req.body?.disableNotification, false),
      replyToMessageId: req.body?.replyToMessageId
    });
    return res.json({
      ok: true,
      ...queueReply(job, `Queued Telegram send job ${job.id}.`),
      guardian
    });
  } catch (error) {
    return respondError(res, error, 400);
  }
});

app.post("/telegram/webhook", async (req, res) => {
  try {
    if (!telegramPolicy.enabled) {
      return respondError(res, "Telegram integration is disabled by policy.", 403);
    }

    const expected = String(getTelegramWebhookSecretToken() || "").trim();
    if (expected) {
      const header = String(req.headers["x-telegram-bot-api-secret-token"] || "").trim();
      const queryToken = String(req.query?.secret || req.query?.token || "").trim();
      if (header !== expected && queryToken !== expected) {
        return respondError(res, "Invalid Telegram webhook secret token.", 403);
      }
    } else if (!isLoopbackRequest(req)) {
      return respondError(res, "Telegram webhook secret is not configured (loopback only).", 403);
    }

    const update = req.body || {};
    const updateId = Number(update?.update_id || 0);
    runtimeState.telegram.polling.lastPollAt = new Date().toISOString();
    runtimeState.telegram.polling.lastError = "";
    if (Number.isFinite(updateId) && updateId > 0) {
      runtimeState.telegram.polling.offset = Math.max(Number(runtimeState.telegram.polling.offset || 0), updateId + 1);
    }

    const job = enqueueTelegramInbound({
      update,
      source: "telegram-webhook"
    });
    return res.json({
      ok: true,
      ...queueReply(job, `Queued Telegram inbound job ${job.id}.`)
    });
  } catch (error) {
    runtimeState.telegram.polling.lastError = String(error?.message || error || "webhook_failed");
    return respondError(res, error, 400);
  }
});

app.post("/slack/review", async (req, res) => {
  try {
    if (!slackPolicy.enabled) {
      return respondError(res, "Slack integration is disabled by policy.", 403);
    }
    const channel = String(req.body?.channel || "").trim();
    if (!channel) {
      return respondError(res, "Channel is required.", 400);
    }

    const limit = asInt(req.body?.limit, 40, 1, slackPolicy.maxMessages);
    const analyze = asBool(req.body?.analyze, true);
    const note = String(req.body?.request || "").trim();
    const guardian = await evaluateGuardianGuard({
      message: `Slack review ${channel} last ${limit}${analyze ? " with analysis" : " raw"}`,
      routed: { action: "slack_review" },
      source: "api.integrations.slack.review"
    });
    if (guardian.triggered && guardian.blocked) {
      const approvalHint = guardian.approvalRequest?.id
        ? ` Approval ID ${guardian.approvalRequest.id}. Use APPROVE ${guardian.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked Slack review (${guardian.risk.level}). ${guardian.decision?.text || ""}${approvalHint}`.trim(),
        403
      );
    }

    const job = enqueueSlackReview({
      channel,
      limit,
      analyze,
      request: note
    });
    return res.json({
      ok: true,
      ...queueReply(job, `Queued Slack review job ${job.id}.`),
      guardian
    });
  } catch (error) {
    return respondError(res, error, 400);
  }
});

app.post("/augment-context/config", async (req, res) => {
  try {
    if (!isLoopbackRequest(req)) {
      return respondError(res, "Augment Context configuration is only allowed from local loopback.", 403);
    }

    const body = req.body && typeof req.body === "object" ? req.body : {};
    const hasField = (key) => Object.prototype.hasOwnProperty.call(body, key);
    const clear = asBool(body.clear, false);
    const guardian = await evaluateGuardianGuard({
      message: clear
        ? "Augment Context settings clear request"
        : `Augment Context settings update request${body.mode ? ` mode=${String(body.mode).trim()}` : ""}${body.serverLabel ? ` serverLabel=${String(body.serverLabel).trim()}` : ""}`,
      routed: { action: "augment_context_config" },
      source: "api.integrations.augment-context.config"
    });
    if (guardian.triggered && guardian.blocked) {
      const approvalHint = guardian.approvalRequest?.id
        ? ` Approval ID ${guardian.approvalRequest.id}. Use APPROVE ${guardian.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked Augment Context config update (${guardian.risk.level}). ${guardian.decision?.text || ""}${approvalHint}`.trim(),
        403
      );
    }

    const status = setAugmentContextConfig({
      clear,
      enabled: hasField("enabled") ? asBool(body.enabled, true) : undefined,
      mode: hasField("mode") ? String(body.mode || "") : undefined,
      serverLabel: hasField("serverLabel") ? String(body.serverLabel || "") : undefined,
      serverUrl: hasField("serverUrl")
        ? String(body.serverUrl || "")
        : hasField("url")
          ? String(body.url || "")
          : undefined,
      connectorId: hasField("connectorId") ? String(body.connectorId || "") : undefined,
      authorization: hasField("authorization")
        ? String(body.authorization || "")
        : hasField("auth")
          ? String(body.auth || "")
          : undefined,
      headers: hasField("headers") && body.headers && typeof body.headers === "object"
        ? body.headers
        : undefined,
      allowedTools: hasField("allowedTools")
        ? body.allowedTools
        : hasField("tools")
          ? body.tools
          : undefined,
      tokenReductionProfile: hasField("tokenReductionProfile")
        ? String(body.tokenReductionProfile || "")
        : undefined,
      toolSchemaMode: hasField("toolSchemaMode")
        ? String(body.toolSchemaMode || "")
        : undefined,
      contextTtlSeconds: hasField("contextTtlSeconds")
        ? body.contextTtlSeconds
        : hasField("ttlSeconds")
          ? body.ttlSeconds
          : undefined,
      workspaceRoot: hasField("workspaceRoot")
        ? String(body.workspaceRoot || "")
        : hasField("workspacePath")
          ? String(body.workspacePath || "")
          : undefined,
      useWsl: hasField("useWsl") ? asBool(body.useWsl, false) : undefined,
      wslDistro: hasField("wslDistro") ? String(body.wslDistro || "") : undefined,
      auggiePath: hasField("auggiePath") ? String(body.auggiePath || "") : undefined
    });

    return res.json({
      ok: true,
      status,
      guardian
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.post("/symphony/config", async (req, res) => {
  try {
    if (!isLoopbackRequest(req)) {
      return respondError(res, "Symphony configuration is only allowed from local loopback.", 403);
    }

    const clear = asBool(req.body?.clear, false);
    const guardian = await evaluateGuardianGuard({
      message: clear
        ? "Symphony integration settings clear request"
        : `Symphony integration settings update request${req.body?.repoRoot ? ` repoRoot=${req.body.repoRoot}` : ""}${req.body?.workflowPath ? ` workflowPath=${req.body.workflowPath}` : ""}${req.body?.linearProjectSlug ? ` linearProjectSlug=${req.body.linearProjectSlug}` : ""}`,
      routed: { action: "symphony_config" },
      source: "api.integrations.symphony.config"
    });
    if (guardian.triggered && guardian.blocked) {
      const approvalHint = guardian.approvalRequest?.id
        ? ` Approval ID ${guardian.approvalRequest.id}. Use APPROVE ${guardian.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked Symphony config update (${guardian.risk.level}). ${guardian.decision?.text || ""}${approvalHint}`.trim(),
        403
      );
    }

    const body = req.body && typeof req.body === "object" ? req.body : {};
    const status = setSymphonyConfig({
      clear,
      enabled: Object.prototype.hasOwnProperty.call(body, "enabled") ? asBool(body.enabled, true) : undefined,
      repoRoot: Object.prototype.hasOwnProperty.call(body, "repoRoot") ? String(body.repoRoot || "") : undefined,
      workflowPath: Object.prototype.hasOwnProperty.call(body, "workflowPath") ? String(body.workflowPath || "") : undefined,
      logsRoot: Object.prototype.hasOwnProperty.call(body, "logsRoot") ? String(body.logsRoot || "") : undefined,
      runtime: Object.prototype.hasOwnProperty.call(body, "runtime") ? String(body.runtime || "") : undefined,
      port: Object.prototype.hasOwnProperty.call(body, "port") ? body.port : undefined,
      command: Object.prototype.hasOwnProperty.call(body, "command") ? String(body.command || "") : undefined,
      workingDirectory: Object.prototype.hasOwnProperty.call(body, "workingDirectory")
        ? String(body.workingDirectory || "")
        : Object.prototype.hasOwnProperty.call(body, "workdir")
          ? String(body.workdir || "")
          : undefined,
      linearProjectSlug: Object.prototype.hasOwnProperty.call(body, "linearProjectSlug") ? String(body.linearProjectSlug || "") : undefined,
      linearApiKey: Object.prototype.hasOwnProperty.call(body, "linearApiKey")
        ? String(body.linearApiKey || "")
        : Object.prototype.hasOwnProperty.call(body, "apiKey")
          ? String(body.apiKey || "")
          : Object.prototype.hasOwnProperty.call(body, "token")
            ? String(body.token || "")
            : undefined,
      sourceRepoUrl: Object.prototype.hasOwnProperty.call(body, "sourceRepoUrl") ? String(body.sourceRepoUrl || "") : undefined,
      workspaceRoot: Object.prototype.hasOwnProperty.call(body, "workspaceRoot") ? String(body.workspaceRoot || "") : undefined,
      codexCommand: Object.prototype.hasOwnProperty.call(body, "codexCommand") ? String(body.codexCommand || "") : undefined
    });

    return res.json({
      ok: true,
      status,
      guardian
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.post("/abacus/config", async (req, res) => {
  try {
    if (!isLoopbackRequest(req)) {
      return respondError(res, "Abacus configuration is only allowed from local loopback.", 403);
    }

    const body = req.body && typeof req.body === "object" ? req.body : {};
    const hasField = (key) => Object.prototype.hasOwnProperty.call(body, key);
    const clear = asBool(body.clear, false);
    const guardian = await evaluateGuardianGuard({
      message: clear
        ? "Abacus integration settings clear request"
        : `Abacus integration settings update request${body.appId ? ` appId=${String(body.appId).trim()}` : ""}${body.accountEmail ? ` accountEmail=${String(body.accountEmail).trim()}` : ""}`,
      routed: { action: "abacus_config" },
      source: "api.integrations.abacus.config"
    });
    if (guardian.triggered && guardian.blocked) {
      const approvalHint = guardian.approvalRequest?.id
        ? ` Approval ID ${guardian.approvalRequest.id}. Use APPROVE ${guardian.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked Abacus config update (${guardian.risk.level}). ${guardian.decision?.text || ""}${approvalHint}`.trim(),
        403
      );
    }

    const status = setAbacusConfig({
      clear,
      enabled: hasField("enabled") ? asBool(body.enabled, true) : undefined,
      appUrl: hasField("appUrl")
        ? String(body.appUrl || "")
        : hasField("url")
          ? String(body.url || "")
          : undefined,
      appId: hasField("appId") ? String(body.appId || "") : undefined,
      accountEmail: hasField("accountEmail")
        ? String(body.accountEmail || "")
        : hasField("email")
          ? String(body.email || "")
          : undefined,
      authProvider: hasField("authProvider") ? String(body.authProvider || "") : undefined,
      profileName: hasField("profileName") ? String(body.profileName || "") : undefined,
      windowTarget: hasField("windowTarget")
        ? String(body.windowTarget || "")
        : hasField("target")
          ? String(body.target || "")
          : undefined,
      browserMode: hasField("browserMode") ? String(body.browserMode || "") : undefined,
      notes: hasField("notes") ? String(body.notes || "") : undefined
    });

    return res.json({
      ok: true,
      status,
      guardian
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.post("/augment-context/apply", requireLoopbackOnly, async (req, res) => {
  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const requested = String(body.provider || body.providers || "all").trim().toLowerCase();
    const clear = asBool(body.clear, false);
    const forceResponsesApi = !Object.prototype.hasOwnProperty.call(body, "forceResponsesApi")
      || asBool(body.forceResponsesApi, true);
    const providers = requested === "all"
      ? ["cursor", "antigravity"]
      : requested.split(/[,;\s]+/).map((item) => item.trim()).filter(Boolean);
    const invalidProviders = providers.filter((item) => item !== "cursor" && item !== "antigravity");
    if (providers.length < 1 || invalidProviders.length > 0) {
      return respondError(res, "provider must be cursor, antigravity, or all.", 400);
    }

    const guardian = await evaluateGuardianGuard({
      message: clear
        ? `Augment Context MCP clear request for ${providers.join(", ")}`
        : `Augment Context MCP apply request for ${providers.join(", ")}`,
      routed: { action: clear ? "augment_context_clear" : "augment_context_apply" },
      source: "api.integrations.augment-context.apply"
    });
    if (guardian.triggered && guardian.blocked) {
      const approvalHint = guardian.approvalRequest?.id
        ? ` Approval ID ${guardian.approvalRequest.id}. Use APPROVE ${guardian.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked Augment Context apply (${guardian.risk.level}). ${guardian.decision?.text || ""}${approvalHint}`.trim(),
        403
      );
    }

    const patch = clear
      ? null
      : buildAugmentContextProviderPatch({
        enabled: Object.prototype.hasOwnProperty.call(body, "enabled") ? asBool(body.enabled, true) : undefined,
        mode: Object.prototype.hasOwnProperty.call(body, "mode") ? String(body.mode || "") : undefined,
        serverLabel: Object.prototype.hasOwnProperty.call(body, "serverLabel") ? String(body.serverLabel || "") : undefined,
        serverUrl: Object.prototype.hasOwnProperty.call(body, "serverUrl")
          ? String(body.serverUrl || "")
          : Object.prototype.hasOwnProperty.call(body, "url")
            ? String(body.url || "")
            : undefined,
        connectorId: Object.prototype.hasOwnProperty.call(body, "connectorId") ? String(body.connectorId || "") : undefined,
        authorization: Object.prototype.hasOwnProperty.call(body, "authorization")
          ? String(body.authorization || "")
          : Object.prototype.hasOwnProperty.call(body, "auth")
            ? String(body.auth || "")
            : undefined,
        headers: Object.prototype.hasOwnProperty.call(body, "headers") && body.headers && typeof body.headers === "object"
          ? body.headers
          : undefined,
        allowedTools: Object.prototype.hasOwnProperty.call(body, "allowedTools")
          ? body.allowedTools
          : Object.prototype.hasOwnProperty.call(body, "tools")
            ? body.tools
            : undefined,
        tokenReductionProfile: Object.prototype.hasOwnProperty.call(body, "tokenReductionProfile")
          ? String(body.tokenReductionProfile || "")
          : undefined,
        toolSchemaMode: Object.prototype.hasOwnProperty.call(body, "toolSchemaMode")
          ? String(body.toolSchemaMode || "")
          : undefined,
        contextTtlSeconds: Object.prototype.hasOwnProperty.call(body, "contextTtlSeconds")
          ? body.contextTtlSeconds
          : Object.prototype.hasOwnProperty.call(body, "ttlSeconds")
            ? body.ttlSeconds
            : undefined
      });

    const applied = [];
    const errors = [];
    for (const provider of providers) {
      try {
        const status = clear
          ? setExternalProviderConfig({
            provider,
            mcpClear: true
          })
          : setExternalProviderConfig({
            provider,
            ...(forceResponsesApi ? { apiStyle: "openai_responses" } : null),
            ...patch
          });
        applied.push({
          provider,
          status
        });
      } catch (error) {
        errors.push({
          provider,
          error: String(error?.message || error || "apply_failed")
        });
      }
    }

    const statusCode = errors.length > 0 ? 400 : 200;
    return res.status(statusCode).json({
      ok: errors.length < 1,
      guardian,
      providers,
      forceResponsesApi,
      patch: redactAugmentContextProviderPatch(patch),
      applied,
      errors
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.post("/abacus/open", requireLoopbackOnly, async (_req, res) => {
  try {
    const guardian = await evaluateGuardianGuard({
      message: "Abacus managed browser surface open request",
      routed: { action: "abacus_open" },
      source: "api.integrations.abacus.open"
    });
    if (guardian.triggered && guardian.blocked) {
      const approvalHint = guardian.approvalRequest?.id
        ? ` Approval ID ${guardian.approvalRequest.id}. Use APPROVE ${guardian.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked Abacus open (${guardian.risk.level}). ${guardian.decision?.text || ""}${approvalHint}`.trim(),
        403
      );
    }

    const status = getAbacusIntegrationStatus();
    if (!status.enabled) {
      return respondError(res, "Abacus integration is disabled.", 400);
    }
    if (!status.configured) {
      return respondError(res, "Abacus integration is not configured yet.", 400);
    }

    emitAbacusManifest("abacus_open", "queued", status, {
      reason: "Opening the managed Abacus ChatLLM surface in the configured Chrome slot."
    });

    const launched = await launchChromeInUiSlot(status.appUrl, {
      windowTarget: String(status.windowTarget || "phone_mode").trim() || "phone_mode",
      profileName: String(status.profile?.profileName || status.profileName || "asolaria-slot-phone_mode").trim(),
      appMode: false,
      newWindow: true,
      isolatedProfile: String(status.browserMode || "").trim().toLowerCase() !== "managed_profile",
      preferReuse: true,
      enforceSingleWindow: true
    });

    emitAbacusEvent("abacus_opened", status, {
      detail: {
        pid: Number(launched.pid || 0) || 0,
        reused: Boolean(launched.reused),
        boundsSource: launched.boundsSource || "",
        closedByProfile: Number(launched.closedByProfile || 0) || 0
      },
      context: {
        profilePath: launched.profilePath || "",
        openedUrl: launched.url || status.appUrl
      }
    });
    emitAbacusManifest("abacus_open", "completed", status, {
      reason: "Managed Abacus ChatLLM surface opened successfully.",
      evidence: {
        pid: Number(launched.pid || 0) || 0,
        windowTarget: launched.windowTarget || status.windowTarget || "",
        reused: Boolean(launched.reused),
        profilePath: launched.profilePath || ""
      }
    });

    return res.json({
      ok: true,
      guardian,
      status,
      opened: launched.url || status.appUrl,
      pid: launched.pid || 0,
      profilePath: launched.profilePath || "",
      windowTarget: launched.windowTarget || status.windowTarget || "",
      windowBounds: launched.bounds || null,
      boundsSource: launched.boundsSource || "",
      reused: Boolean(launched.reused),
      closedByProfile: Number(launched.closedByProfile || 0),
      profileProcessCountBefore: Number(launched.profileProcessCountBefore || 0)
    });
  } catch (error) {
    try {
      emitAbacusManifest("abacus_open", "failed", getAbacusIntegrationStatus(), {
        reason: String(error?.message || error || "open_failed")
      });
    } catch (_manifestError) {
      // ignore secondary reporting failure
    }
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.post("/abacus/desktop/open", requireLoopbackOnly, async (_req, res) => {
  try {
    const guardian = await evaluateGuardianGuard({
      message: "Abacus desktop app open request",
      routed: { action: "abacus_desktop_open" },
      source: "api.integrations.abacus.desktop.open"
    });
    if (guardian.triggered && guardian.blocked) {
      const approvalHint = guardian.approvalRequest?.id
        ? ` Approval ID ${guardian.approvalRequest.id}. Use APPROVE ${guardian.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked Abacus desktop open (${guardian.risk.level}). ${guardian.decision?.text || ""}${approvalHint}`.trim(),
        403
      );
    }

    const status = getAbacusIntegrationStatus();
    const launched = openAbacusDesktop();
    emitAbacusEvent("abacus_desktop_opened", status, {
      category: "desktop_worker",
      target: {
        type: "desktop_app",
        id: "abacus-desktop",
        label: "AbacusAI.exe",
        domain: "local",
        criticality: "medium"
      },
      detail: {
        pid: Number(launched.pid || 0) || 0
      },
      context: {
        exePath: launched.exePath || ""
      }
    });
    emitAbacusManifest("abacus_desktop_open", "completed", status, {
      target: {
        type: "desktop_app",
        id: "abacus-desktop",
        label: "AbacusAI.exe",
        domain: "local",
        criticality: "medium"
      },
      reason: "Abacus desktop app launched.",
      evidence: {
        pid: Number(launched.pid || 0) || 0,
        exePath: launched.exePath || ""
      }
    });

    return res.json({
      ok: true,
      guardian,
      status,
      launched
    });
  } catch (error) {
    try {
      emitAbacusManifest("abacus_desktop_open", "failed", getAbacusIntegrationStatus(), {
        target: {
          type: "desktop_app",
          id: "abacus-desktop",
          label: "AbacusAI.exe",
          domain: "local",
          criticality: "medium"
        },
        reason: String(error?.message || error || "desktop_open_failed")
      });
    } catch (_manifestError) {
      // ignore secondary reporting failure
    }
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.post("/abacus/handoff", requireLoopbackOnly, async (req, res) => {
  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const title = String(body.title || body.objective || body.prompt || "Abacus worker task").trim();
    const objective = String(body.objective || body.prompt || body.instructions || "").trim();
    const guardian = await evaluateGuardianGuard({
      message: `Abacus worker handoff request${title ? ` title=${title.slice(0, 120)}` : ""}`,
      routed: { action: "abacus_handoff" },
      source: "api.integrations.abacus.handoff"
    });
    if (guardian.triggered && guardian.blocked) {
      const approvalHint = guardian.approvalRequest?.id
        ? ` Approval ID ${guardian.approvalRequest.id}. Use APPROVE ${guardian.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked Abacus handoff (${guardian.risk.level}). ${guardian.decision?.text || ""}${approvalHint}`.trim(),
        403
      );
    }
    if (!objective) {
      return respondError(res, "objective is required.", 400);
    }

    const status = getAbacusIntegrationStatus();
    const handoff = createAbacusWorkPacket({
      presetId: body.presetId || body.preset,
      title,
      objective,
      instructions: body.instructions,
      allowedPaths: body.allowedPaths || body.paths || body.allowedFolders,
      surfaceHints: body.surfaceHints || body.preferredSurfaces,
      expectedArtifacts: body.expectedArtifacts || body.outputs || body.expectedOutputs,
      launchChecklist: body.launchChecklist,
      sensitivity: body.sensitivity,
      workerMode: body.workerMode || body.surfacePreference,
      sourceTaskId: body.sourceTaskId || body.taskLedgerTaskId,
      threadId: body.threadId
    });

    let launched = null;
    if (asBool(body.launchDesktop, false)) {
      launched = openAbacusWorkPacket(handoff.packet.id, {
        openFolder: true,
        openPrompt: true,
        openResponse: true
      });
      emitAbacusEvent("abacus_handoff_opened", status, {
        category: "desktop_worker",
        target: {
          type: "worker_packet",
          id: handoff.packet.id,
          label: handoff.packet.title,
          domain: "local",
          criticality: "medium"
        },
        detail: {
          pid: Number(launched?.launched?.pid || 0) || 0,
          packetId: handoff.packet.id
        },
        context: {
          packetDir: handoff.packetDir,
          promptPath: handoff.promptPath,
          responsePath: handoff.responsePath
        }
      });
    }

    return res.json({
      ok: true,
      guardian,
      status,
      handoff,
      launched
    });
  } catch (error) {
    try {
      emitAbacusManifest("abacus_handoff", "failed", getAbacusIntegrationStatus(), {
        target: {
          type: "worker_packet",
          id: "abacus-handoff",
          label: "Abacus handoff",
          domain: "local",
          criticality: "medium"
        },
        reason: String(error?.message || error || "handoff_failed")
      });
    } catch (_manifestError) {
      // ignore secondary reporting failure
    }
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.post("/abacus/packets/:id/open", requireLoopbackOnly, async (req, res) => {
  try {
    const packetId = String(req.params.id || "").trim();
    const guardian = await evaluateGuardianGuard({
      message: `Abacus packet open request packetId=${packetId}`,
      routed: { action: "abacus_packet_open" },
      source: "api.integrations.abacus.packet.open"
    });
    if (guardian.triggered && guardian.blocked) {
      const approvalHint = guardian.approvalRequest?.id
        ? ` Approval ID ${guardian.approvalRequest.id}. Use APPROVE ${guardian.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked Abacus packet open (${guardian.risk.level}). ${guardian.decision?.text || ""}${approvalHint}`.trim(),
        403
      );
    }
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const status = getAbacusIntegrationStatus();
    const opened = openAbacusWorkPacket(packetId, {
      openFolder: !Object.prototype.hasOwnProperty.call(body, "openFolder") || asBool(body.openFolder, true),
      openPrompt: !Object.prototype.hasOwnProperty.call(body, "openPrompt") || asBool(body.openPrompt, true),
      openResponse: !Object.prototype.hasOwnProperty.call(body, "openResponse") || asBool(body.openResponse, true)
    });
    emitAbacusEvent("abacus_packet_opened", status, {
      category: "desktop_worker",
      target: {
        type: "worker_packet",
        id: opened.packet.id,
        label: opened.packet.title,
        domain: "local",
        criticality: "medium"
      },
      detail: {
        pid: Number(opened?.launched?.pid || 0) || 0
      },
      context: {
        packetDir: opened.packet.packetDir,
        promptPath: opened.packet.promptPath,
        responsePath: opened.packet.responsePath
      }
    });
    emitAbacusManifest("abacus_packet_open", "completed", status, {
      target: {
        type: "worker_packet",
        id: opened.packet.id,
        label: opened.packet.title,
        domain: "local",
        criticality: "medium"
      },
      reason: "Opened Abacus packet workspace in desktop app.",
      evidence: {
        pid: Number(opened?.launched?.pid || 0) || 0,
        packetDir: opened.packet.packetDir,
        promptPath: opened.packet.promptPath,
        responsePath: opened.packet.responsePath
      }
    });
    return res.json({
      ok: true,
      guardian,
      opened
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.post("/abacus/packets/:id/scan", requireLoopbackOnly, async (req, res) => {
  try {
    const packetId = String(req.params.id || "").trim();
    const guardian = await evaluateGuardianGuard({
      message: `Abacus packet scan request packetId=${packetId}`,
      routed: { action: "abacus_packet_scan" },
      source: "api.integrations.abacus.packet.scan"
    });
    if (guardian.triggered && guardian.blocked) {
      const approvalHint = guardian.approvalRequest?.id
        ? ` Approval ID ${guardian.approvalRequest.id}. Use APPROVE ${guardian.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked Abacus packet scan (${guardian.risk.level}). ${guardian.decision?.text || ""}${approvalHint}`.trim(),
        403
      );
    }
    const status = getAbacusIntegrationStatus();
    const packet = scanAbacusWorkPacket(packetId);
    emitAbacusEvent(packet.responseReady ? "abacus_packet_response_detected" : "abacus_packet_scanned", status, {
      category: "worker_packet",
      target: {
        type: "worker_packet",
        id: packet.id,
        label: packet.title,
        domain: "local",
        criticality: "medium"
      },
      detail: {
        responseReady: Boolean(packet.responseReady),
        artifactCount: Array.isArray(packet.artifactFiles) ? packet.artifactFiles.length : 0
      },
      context: {
        packetDir: packet.packetDir,
        responsePath: packet.responsePath
      }
    });
    emitAbacusManifest("abacus_packet_scan", "completed", status, {
      target: {
        type: "worker_packet",
        id: packet.id,
        label: packet.title,
        domain: "local",
        criticality: "medium"
      },
      reason: packet.responseReady
        ? "Abacus packet response detected."
        : "Abacus packet scanned; response still pending.",
      evidence: {
        responseReady: Boolean(packet.responseReady),
        responsePath: packet.responsePath,
        responseUpdatedAt: packet.responseUpdatedAt,
        artifactFiles: Array.isArray(packet.artifactFiles) ? packet.artifactFiles : []
      }
    });
    return res.json({
      ok: true,
      guardian,
      packet
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.post("/abacus/packets/:id/response", requireLoopbackOnly, async (req, res) => {
  try {
    const packetId = String(req.params.id || "").trim();
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const responseText = String(body.responseText || body.response || body.text || "").trim();
    const guardian = await evaluateGuardianGuard({
      message: `Abacus packet response write request packetId=${packetId}`,
      routed: { action: "abacus_packet_response_write" },
      source: "api.integrations.abacus.packet.response"
    });
    if (guardian.triggered && guardian.blocked) {
      const approvalHint = guardian.approvalRequest?.id
        ? ` Approval ID ${guardian.approvalRequest.id}. Use APPROVE ${guardian.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked Abacus packet response write (${guardian.risk.level}). ${guardian.decision?.text || ""}${approvalHint}`.trim(),
        403
      );
    }
    if (!responseText) {
      return respondError(res, "responseText is required.", 400);
    }
    const status = getAbacusIntegrationStatus();
    const packet = writeAbacusWorkPacketResponse(packetId, responseText, {
      includeHeading: !Object.prototype.hasOwnProperty.call(body, "includeHeading") || asBool(body.includeHeading, true)
    });
    emitAbacusEvent("abacus_packet_response_written", status, {
      category: "worker_packet",
      target: {
        type: "worker_packet",
        id: packet.id,
        label: packet.title,
        domain: "local",
        criticality: "medium"
      },
      detail: {
        responseReady: Boolean(packet.responseReady),
        responseLength: String(packet.responseText || "").length
      },
      context: {
        packetDir: packet.packetDir,
        responsePath: packet.responsePath
      }
    });
    emitAbacusManifest("abacus_packet_response_write", "completed", status, {
      target: {
        type: "worker_packet",
        id: packet.id,
        label: packet.title,
        domain: "local",
        criticality: "medium"
      },
      reason: "Abacus packet response file updated.",
      evidence: {
        responsePath: packet.responsePath,
        responseUpdatedAt: packet.responseUpdatedAt,
        responseReady: Boolean(packet.responseReady)
      }
    });
    return res.json({
      ok: true,
      guardian,
      packet
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.post("/abacus/packets/:id/import", requireLoopbackOnly, async (req, res) => {
  try {
    const packetId = String(req.params.id || "").trim();
    const guardian = await evaluateGuardianGuard({
      message: `Abacus packet import request packetId=${packetId}`,
      routed: { action: "abacus_packet_import" },
      source: "api.integrations.abacus.packet.import"
    });
    if (guardian.triggered && guardian.blocked) {
      const approvalHint = guardian.approvalRequest?.id
        ? ` Approval ID ${guardian.approvalRequest.id}. Use APPROVE ${guardian.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked Abacus packet import (${guardian.risk.level}). ${guardian.decision?.text || ""}${approvalHint}`.trim(),
        403
      );
    }
    const status = getAbacusIntegrationStatus();
    const packet = scanAbacusWorkPacket(packetId);
    if (!packet.responseReady) {
      return respondError(res, "Abacus packet response is still pending.", 400);
    }

    const responseText = String(packet.responseText || "").trim();
    if (packet.sourceTaskId) {
      safeTaskLedger("abacus.packet.import.event", () => {
        return addTaskLedgerEvent(packet.sourceTaskId, {
          type: "abacus_packet_imported",
          note: "Imported Abacus packet response into the task ledger.",
          actor: "abacus-integration",
          source: "abacus-integration",
          detail: {
            packetId: packet.id,
            responsePath: packet.responsePath,
            artifactFiles: Array.isArray(packet.artifactFiles) ? packet.artifactFiles : []
          }
        });
      });
    }

    emitAbacusEvent("abacus_packet_imported", status, {
      category: "worker_packet",
      target: {
        type: "worker_packet",
        id: packet.id,
        label: packet.title,
        domain: "local",
        criticality: "medium"
      },
      detail: {
        importedToTaskLedger: Boolean(packet.sourceTaskId),
        responseLength: responseText.length,
        artifactCount: Array.isArray(packet.artifactFiles) ? packet.artifactFiles.length : 0
      },
      context: {
        packetDir: packet.packetDir,
        responsePath: packet.responsePath,
        sourceTaskId: packet.sourceTaskId || ""
      }
    });
    emitAbacusManifest("abacus_packet_import", "completed", status, {
      target: {
        type: "worker_packet",
        id: packet.id,
        label: packet.title,
        domain: "local",
        criticality: "medium"
      },
      reason: "Imported Abacus packet response back into Asolaria.",
      evidence: {
        responsePath: packet.responsePath,
        responseUpdatedAt: packet.responseUpdatedAt,
        sourceTaskId: packet.sourceTaskId || "",
        artifactFiles: Array.isArray(packet.artifactFiles) ? packet.artifactFiles : []
      }
    });
    return res.json({
      ok: true,
      guardian,
      packet,
      imported: {
        sourceTaskId: packet.sourceTaskId || "",
        responseText
      }
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.post("/abacus/cli/probe", requireLoopbackOnly, async (req, res) => {
  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const mode = String(body.mode || "help").trim().toLowerCase() || "help";
    const guardian = await evaluateGuardianGuard({
      message: `Abacus CLI probe request mode=${mode}`,
      routed: { action: "abacus_cli_probe" },
      source: "api.integrations.abacus.cli.probe"
    });
    if (guardian.triggered && guardian.blocked) {
      const approvalHint = guardian.approvalRequest?.id
        ? ` Approval ID ${guardian.approvalRequest.id}. Use APPROVE ${guardian.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked Abacus CLI probe (${guardian.risk.level}). ${guardian.decision?.text || ""}${approvalHint}`.trim(),
        403
      );
    }

    const status = getAbacusIntegrationStatus();
    emitAbacusManifest("abacus_cli_probe", "queued", status, {
      target: {
        type: "cli_surface",
        id: "abacus-cli",
        label: "abacusai.cmd",
        domain: "local",
        criticality: "medium"
      },
      reason: `Running Abacus CLI probe (${mode}).`
    });

    const probe = await runAbacusCliProbe({
      mode,
      timeoutMs: body.timeoutMs
    });
    emitAbacusEvent(probe.ok ? "abacus_cli_probe_succeeded" : "abacus_cli_probe_failed", status, {
      category: "cli_worker",
      target: {
        type: "cli_surface",
        id: "abacus-cli",
        label: "abacusai.cmd",
        domain: "local",
        criticality: "medium"
      },
      status: probe.ok ? "ok" : "error",
      detail: {
        mode: probe.mode,
        exitCode: Number(probe.exitCode || 0) || 0,
        timedOut: Boolean(probe.timedOut),
        stdoutPreview: String(probe.stdout || "").slice(0, 400),
        stderrPreview: String(probe.stderr || "").slice(0, 400)
      },
      context: {
        command: probe.command || "",
        latestCliLog: probe.cliLog?.latestPath || "",
        cliWarningsDetected: Boolean(probe.cliLog?.warningsDetected)
      }
    });
    emitAbacusManifest("abacus_cli_probe", probe.ok ? "completed" : "failed", status, {
      target: {
        type: "cli_surface",
        id: "abacus-cli",
        label: "abacusai.cmd",
        domain: "local",
        criticality: "medium"
      },
      reason: probe.ok
        ? `Abacus CLI probe (${mode}) completed.`
        : `Abacus CLI probe (${mode}) did not complete cleanly.`,
      evidence: {
        mode: probe.mode,
        exitCode: Number(probe.exitCode || 0) || 0,
        timedOut: Boolean(probe.timedOut),
        latestCliLog: probe.cliLog?.latestPath || "",
        warningsDetected: Boolean(probe.cliLog?.warningsDetected)
      }
    });

    return res.json({
      ok: true,
      guardian,
      status,
      probe
    });
  } catch (error) {
    try {
      emitAbacusManifest("abacus_cli_probe", "failed", getAbacusIntegrationStatus(), {
        target: {
          type: "cli_surface",
          id: "abacus-cli",
          label: "abacusai.cmd",
          domain: "local",
          criticality: "medium"
        },
        reason: String(error?.message || error || "cli_probe_failed")
      });
    } catch (_manifestError) {
      // ignore secondary reporting failure
    }
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.get("/external/mcp-cache", (req, res) => {
  try {
    const status = getExternalMcpCacheStatus();
    const provider = normalizeExternalProviderId(req.query?.provider || "");
    if (!provider) {
      return res.json({
        ok: true,
        cache: status
      });
    }
    const providerCatalog = Array.isArray(status.providerCatalog)
      ? status.providerCatalog.filter((entry) => String(entry?.provider || "").toLowerCase() === provider)
      : [];
    const scopedContexts = Array.isArray(status.scopedContexts)
      ? status.scopedContexts.filter((entry) => String(entry?.provider || "").toLowerCase() === provider)
      : [];
    return res.json({
      ok: true,
      cache: {
        providerCatalogCount: providerCatalog.length,
        scopedContextCount: scopedContexts.length,
        providerCatalog,
        scopedContexts
      }
    });
  } catch (error) {
    return respondError(res, error, 400);
  }
});

app.post("/external/mcp-cache/clear", (req, res) => {
  try {
    if (!isLoopbackRequest(req)) {
      return respondError(res, "MCP cache clear is only allowed from local loopback.", 403);
    }
    const provider = normalizeExternalProviderId(req.body?.provider || req.body?.providerId || "");
    const contextKey = String(req.body?.contextKey || req.body?.mcpContextKey || "").trim();
    const result = clearExternalMcpCache({
      provider,
      contextKey
    });
    return res.json({
      ok: true,
      result,
      cache: getExternalMcpCacheStatus()
    });
  } catch (error) {
    return respondError(res, error, 400);
  }
});

app.post("/external/config", async (req, res) => {
  try {
    if (!isLoopbackRequest(req)) {
      return respondError(res, "External provider configuration is only allowed from local loopback.", 403);
    }

    const body = req.body && typeof req.body === "object" ? req.body : {};
    const hasField = (key) => Object.prototype.hasOwnProperty.call(body, key);

    const provider = String(body.provider || body.id || "").trim().toLowerCase();
    if (!provider) {
      return respondError(res, "provider is required (cursor or antigravity).", 400);
    }

    const clear = asBool(body.clear, false);
    const enabled = hasField("enabled") ? asBool(body.enabled, true) : undefined;
    const model = hasField("model") ? String(body.model || "").trim() : undefined;
    const apiBaseUrl = (hasField("apiBaseUrl") || hasField("baseUrl") || hasField("apiUrl") || hasField("url"))
      ? String(body.apiBaseUrl || body.baseUrl || body.apiUrl || body.url || "").trim()
      : undefined;
    const apiPath = (hasField("apiPath") || hasField("path"))
      ? String(body.apiPath || body.path || "").trim()
      : undefined;
    const apiStyle = (hasField("apiStyle") || hasField("style") || hasField("mode"))
      ? String(body.apiStyle || body.style || body.mode || "").trim()
      : undefined;
    const organization = hasField("organization")
      ? String(body.organization || "").trim()
      : undefined;
    const apiKey = (hasField("apiKey") || hasField("token") || hasField("key"))
      ? String(body.apiKey || body.token || body.key || "").trim()
      : undefined;
    const requireOfficialApi = hasField("requireOfficialApi")
      ? asBool(body.requireOfficialApi, true)
      : undefined;
    const mcp = hasField("mcp") && body.mcp && typeof body.mcp === "object"
      ? body.mcp
      : undefined;
    const mcpEnabled = hasField("mcpEnabled")
      ? asBool(body.mcpEnabled, false)
      : undefined;
    const mcpClear = hasField("mcpClear")
      ? asBool(body.mcpClear, false)
      : undefined;
    const mcpServerLabel = hasField("mcpServerLabel")
      ? String(body.mcpServerLabel || "").trim()
      : undefined;
    const mcpServerUrl = hasField("mcpServerUrl")
      ? String(body.mcpServerUrl || "").trim()
      : undefined;
    const mcpConnectorId = hasField("mcpConnectorId")
      ? String(body.mcpConnectorId || "").trim()
      : undefined;
    const mcpAuthorization = hasField("mcpAuthorization")
      ? String(body.mcpAuthorization || "").trim()
      : undefined;
    const mcpHeaders = hasField("mcpHeaders") && body.mcpHeaders && typeof body.mcpHeaders === "object"
      ? body.mcpHeaders
      : undefined;
    const mcpAllowedTools = hasField("mcpAllowedTools")
      ? body.mcpAllowedTools
      : undefined;
    const mcpApprovalMode = hasField("mcpApprovalMode")
      ? String(body.mcpApprovalMode || "").trim()
      : undefined;
    const mcpDynamicAllowlistMax = hasField("mcpDynamicAllowlistMax")
      ? Number(body.mcpDynamicAllowlistMax)
      : undefined;
    const mcpContextTtlSeconds = hasField("mcpContextTtlSeconds")
      ? Number(body.mcpContextTtlSeconds)
      : undefined;
    const mcpPreset = hasField("mcpPreset") || hasField("mcpPolicyPreset")
      ? String(body.mcpPreset || body.mcpPolicyPreset || "").trim()
      : undefined;
    const mcpTokenReductionProfile = hasField("mcpTokenReductionProfile") || hasField("tokenReductionProfile")
      ? String(body.mcpTokenReductionProfile || body.tokenReductionProfile || "").trim()
      : undefined;
    const mcpPromptTokenLimit = hasField("mcpPromptTokenLimit") || hasField("promptTokenLimit")
      ? Number(body.mcpPromptTokenLimit ?? body.promptTokenLimit)
      : undefined;
    const mcpToolSchemaMode = hasField("mcpToolSchemaMode") || hasField("toolSchemaMode")
      ? String(body.mcpToolSchemaMode || body.toolSchemaMode || "").trim()
      : undefined;
    const mcpSkillHints = hasField("mcpSkillHints") || hasField("skillHints")
      ? body.mcpSkillHints ?? body.skillHints
      : undefined;
    const mcpWebMcpHints = hasField("mcpWebMcpHints") || hasField("webMcpHints") || hasField("webHints")
      ? body.mcpWebMcpHints ?? body.webMcpHints ?? body.webHints
      : undefined;

    const guardian = await evaluateGuardianGuard({
      message: clear
        ? `External provider (${provider}) config clear request`
        : `External provider (${provider}) config update request${model ? ` model=${model}` : ""}${apiBaseUrl ? ` baseUrl=${apiBaseUrl}` : ""}`,
      routed: { action: "external_provider_config" },
      source: "api.integrations.external.config"
    });
    if (guardian.triggered && guardian.blocked) {
      const approvalHint = guardian.approvalRequest?.id
        ? ` Approval ID ${guardian.approvalRequest.id}. Use APPROVE ${guardian.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked external provider config update (${guardian.risk.level}). ${guardian.decision?.text || ""}${approvalHint}`.trim(),
        403
      );
    }

    const config = setExternalProviderConfig({
      provider,
      clear,
      enabled,
      model,
      apiBaseUrl,
      apiPath,
      apiStyle,
      organization,
      apiKey,
      requireOfficialApi,
      mcp,
      mcpEnabled,
      mcpClear,
      mcpServerLabel,
      mcpServerUrl,
      mcpConnectorId,
      mcpAuthorization,
      mcpHeaders,
      mcpAllowedTools,
      mcpApprovalMode,
      mcpDynamicAllowlistMax,
      mcpContextTtlSeconds,
      mcpPreset,
      mcpTokenReductionProfile,
      mcpPromptTokenLimit,
      mcpToolSchemaMode,
      mcpSkillHints,
      mcpWebMcpHints
    });

    return res.json({
      ok: true,
      config,
      guardian
    });
  } catch (error) {
    return respondError(res, error, 400);
  }
});

app.post("/google/config", async (req, res) => {
  try {
    if (!isLoopbackRequest(req)) {
      return respondError(res, "Google integration configuration is only allowed from local loopback.", 403);
    }

    const clear = asBool(req.body?.clear, false);
    const clientId = String(req.body?.clientId || "").trim();
    const clientSecret = String(req.body?.clientSecret || "").trim();
    const defaultAccount = Object.prototype.hasOwnProperty.call(req.body || {}, "defaultAccount")
      ? String(req.body?.defaultAccount || "").trim()
      : undefined;
    const allowedAccounts = Object.prototype.hasOwnProperty.call(req.body || {}, "allowedAccounts")
      ? (Array.isArray(req.body?.allowedAccounts) ? req.body.allowedAccounts : String(req.body?.allowedAccounts || "").trim())
      : undefined;
    const scopes = (Object.prototype.hasOwnProperty.call(req.body || {}, "scopes") || Object.prototype.hasOwnProperty.call(req.body || {}, "oauthScopes"))
      ? (Array.isArray(req.body?.scopes)
        ? req.body.scopes
        : Array.isArray(req.body?.oauthScopes)
          ? req.body.oauthScopes
          : String(req.body?.scopes || req.body?.oauthScopes || "").trim())
      : undefined;

    const guardian = await evaluateGuardianGuard({
      message: clear ? "Google integration settings clear request" : "Google integration settings update request",
      routed: { action: "google_config" },
      source: "api.integrations.google.config"
    });
    if (guardian.triggered && guardian.blocked) {
      const approvalHint = guardian.approvalRequest?.id
        ? ` Approval ID ${guardian.approvalRequest.id}. Use APPROVE ${guardian.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked Google config update (${guardian.risk.level}). ${guardian.decision?.text || ""}${approvalHint}`.trim(),
        403
      );
    }

    const config = setGoogleOAuthConfig({
      clear,
      clientId,
      clientSecret,
      defaultAccount,
      allowedAccounts,
      scopes
    });
    return res.json({
      ok: true,
      config,
      guardian
    });
  } catch (error) {
    return respondError(res, error, 400);
  }
});

app.post("/gcp/config", async (req, res) => {
  try {
    if (!isLoopbackRequest(req)) {
      return respondError(res, "GCP integration configuration is only allowed from local loopback.", 403);
    }

    const body = req.body || {};
    const clear = asBool(body?.clear, false);
    const serviceAccountJson = String(body?.serviceAccountJson || body?.json || "").trim();
    const hasDefaultProjectInput = Object.prototype.hasOwnProperty.call(body, "defaultProject")
      || Object.prototype.hasOwnProperty.call(body, "projectId");
    const defaultProject = String(body?.defaultProject || body?.projectId || "").trim();
    const hasAllowedProjectsInput = Object.prototype.hasOwnProperty.call(body, "allowedProjects");
    const allowedProjects = Array.isArray(body?.allowedProjects)
      ? body.allowedProjects
      : String(body?.allowedProjects || "").trim();
    const hasDefaultScopesInput = Object.prototype.hasOwnProperty.call(body, "defaultScopes")
      || Object.prototype.hasOwnProperty.call(body, "scopes");
    const defaultScopes = Array.isArray(body?.defaultScopes)
      ? body.defaultScopes
      : Array.isArray(body?.scopes)
        ? body.scopes
        : String(body?.defaultScopes || body?.scopes || "").trim();
    const hasAllowedAdminServicesInput = Object.prototype.hasOwnProperty.call(body, "allowedAdminServices")
      || Object.prototype.hasOwnProperty.call(body, "allowedMutationServices");
    const allowedAdminServices = Array.isArray(body?.allowedAdminServices)
      ? body.allowedAdminServices
      : Array.isArray(body?.allowedMutationServices)
        ? body.allowedMutationServices
        : String(body?.allowedAdminServices || body?.allowedMutationServices || "").trim();
    const hasProjectNumberInput = Object.prototype.hasOwnProperty.call(body, "projectNumber");
    const projectNumber = String(body?.projectNumber || "").trim();

    const guardian = await evaluateGuardianGuard({
      message: clear ? "GCP service account clear request" : "GCP service account update request",
      routed: { action: "gcp_config" },
      source: "api.integrations.gcp.config"
    });
    if (guardian.triggered && guardian.blocked) {
      const approvalHint = guardian.approvalRequest?.id
        ? ` Approval ID ${guardian.approvalRequest.id}. Use APPROVE ${guardian.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked GCP config update (${guardian.risk.level}). ${guardian.decision?.text || ""}${approvalHint}`.trim(),
        403
      );
    }

    const payload = {
      clear,
      serviceAccountJson
    };
    if (hasDefaultProjectInput) {
      payload.defaultProject = defaultProject;
    }
    if (hasAllowedProjectsInput) {
      payload.allowedProjects = allowedProjects;
    }
    if (hasDefaultScopesInput) {
      payload.defaultScopes = defaultScopes;
    }
    if (hasAllowedAdminServicesInput) {
      payload.allowedAdminServices = allowedAdminServices;
    }
    if (hasProjectNumberInput) {
      payload.projectNumber = projectNumber;
    }

    const config = setGcpServiceAccountConfig(payload);
    return res.json({
      ok: true,
      config,
      guardian
    });
  } catch (error) {
    return respondError(res, error, 400);
  }
});

function getUserDownloadsDir() {
  const home = process.env.USERPROFILE || os.homedir();
  return path.join(home, "Downloads");
}

function findLatestServiceAccountKeyJson(dirPath) {
  const dir = String(dirPath || "").trim();
  if (!dir || !fs.existsSync(dir)) {
    return null;
  }

  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (_error) {
    return null;
  }

  const files = entries
    .filter((entry) => entry.isFile() && String(entry.name || "").toLowerCase().endsWith(".json"))
    .map((entry) => {
      const filePath = path.join(dir, entry.name);
      let stat = null;
      try {
        stat = fs.statSync(filePath);
      } catch (_error) {
        stat = null;
      }
      if (!stat) return null;
      return {
        name: entry.name,
        filePath,
        size: stat.size,
        mtimeMs: stat.mtimeMs
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
    .slice(0, 80);

  for (const file of files) {
    if (!file || file.size <= 0 || file.size > 5 * 1024 * 1024) {
      continue;
    }
    let text = "";
    try {
      text = fs.readFileSync(file.filePath, "utf8");
    } catch (_error) {
      continue;
    }

    let parsed = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch (_error) {
      parsed = null;
    }
    if (!parsed || typeof parsed !== "object") {
      continue;
    }

    const type = String(parsed.type || "").trim();
    const clientEmail = String(parsed.client_email || "").trim();
    const privateKey = String(parsed.private_key || "").trim();
    if (type !== "service_account") continue;
    if (!clientEmail || !clientEmail.includes("@")) continue;
    if (!privateKey || !privateKey.includes("BEGIN PRIVATE KEY")) continue;

    return {
      ...file,
      text
    };
  }

  return null;
}

app.post("/gcp/config/import_latest_download", async (req, res) => {
  try {
    if (!isLoopbackRequest(req)) {
      return respondError(res, "GCP integration configuration is only allowed from local loopback.", 403);
    }

    const guardian = await evaluateGuardianGuard({
      message: "GCP service account import latest key from Downloads",
      routed: { action: "gcp_config" },
      source: "api.integrations.gcp.config.import_latest_download"
    });
    if (guardian.triggered && guardian.blocked) {
      const approvalHint = guardian.approvalRequest?.id
        ? ` Approval ID ${guardian.approvalRequest.id}. Use APPROVE ${guardian.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked GCP config update (${guardian.risk.level}). ${guardian.decision?.text || ""}${approvalHint}`.trim(),
        403
      );
    }

    const downloadsDir = getUserDownloadsDir();
    const match = findLatestServiceAccountKeyJson(downloadsDir);
    if (!match) {
      return respondError(
        res,
        `No service account JSON key was found in Downloads (${downloadsDir}). Download a key (IAM & Admin -> Service Accounts -> Keys -> Add key -> JSON) and retry.`,
        404
      );
    }

    const current = getGcpConfigSummary(gcpPolicy);
    const defaultProjectInput = String(req.body?.defaultProject || req.body?.projectId || "").trim();
    const allowedProjectsInput = String(req.body?.allowedProjects || "").trim();
    const defaultScopesInput = String(req.body?.defaultScopes || req.body?.scopes || "").trim();
    const allowedAdminServicesInput = String(req.body?.allowedAdminServices || req.body?.allowedMutationServices || "").trim();
    const projectNumberInput = String(req.body?.projectNumber || "").trim();

    const config = setGcpServiceAccountConfig({
      serviceAccountJson: match.text,
      defaultProject: defaultProjectInput || String(current.defaultProject || current.projectId || "").trim(),
      allowedProjects: allowedProjectsInput || (Array.isArray(current.allowedProjects) ? current.allowedProjects : []),
      defaultScopes: defaultScopesInput || (Array.isArray(current.defaultScopes) ? current.defaultScopes : []),
      allowedAdminServices: allowedAdminServicesInput || (Array.isArray(current.allowedAdminServices) ? current.allowedAdminServices : []),
      projectNumber: projectNumberInput || String(current.projectNumber || "").trim()
    });

    return res.json({
      ok: true,
      imported: {
        fileName: match.name,
        size: match.size,
        modifiedAt: new Date(match.mtimeMs).toISOString()
      },
      config,
      guardian
    });
  } catch (error) {
    return respondError(res, error, 400);
  }
});

app.post("/gemini_api/explain-file", requireLoopbackOnly, async (req, res) => {
  try {
    const saveNotebook = req.body?.saveNotebook === undefined
      ? true
      : asBool(req.body?.saveNotebook, true);
    const result = await runGeminiApiExplainFile({
      filePath: req.body?.filePath || req.body?.path || req.body?.localPath,
      mimeType: req.body?.mimeType || req.body?.fileMimeType,
      prompt: req.body?.prompt || req.body?.message,
      system: req.body?.system,
      model: req.body?.model,
      keepRemoteFile: req.body?.keepRemoteFile,
      processingTimeoutMs: req.body?.processingTimeoutMs || req.body?.timeoutMs,
      pollMs: req.body?.pollMs,
      maxOutputTokens: req.body?.maxOutputTokens
    }, geminiApiPolicy);

    const artifact = writeGeminiFileAnalysisArtifact(result);
    const mimeType = String(result.mimeType || "").trim().toLowerCase();
    const tags = [
      "gemini",
      "file_analysis",
      mimeType.startsWith("video/") ? "video" : "",
      mimeType.startsWith("image/") ? "image" : "",
      mimeType.startsWith("audio/") ? "audio" : "",
      mimeType === "application/pdf" ? "pdf" : "",
      "gnn"
    ].filter(Boolean);
    const noteResult = saveNotebook
      ? addNotebookNote({
        title: `Gemini File Analysis: ${String(result.fileName || "file").trim() || "file"}`,
        text: [
          `Model: ${String(result.model || "").trim() || "unknown"}`,
          `File: ${String(result.fileName || "").trim() || "unknown"}`,
          `MIME: ${mimeType || "unknown"}`,
          `Artifact: ${artifact.markdownPath}`,
          "",
          String(result.reply || "").trim()
        ].join("\n"),
        tags,
        pinned: false,
        auto: true,
        source: "gemini_file_analysis"
      })
      : null;

    appendGraphEvent({
      component: "gemini_api",
      category: "analysis",
      action: "local_file_explained",
      actor: {
        type: "assistant",
        id: "gemini-api",
        label: "Gemini API",
        domain: "cloud",
        criticality: "medium"
      },
      subject: {
        type: "local_file",
        id: String(result.fileName || "").trim() || "local_file",
        label: String(result.filePath || "").trim() || String(result.fileName || "").trim() || "local_file",
        domain: "local"
      },
      target: {
        type: "analysis_artifact",
        id: artifact.id,
        label: artifact.markdownPath,
        domain: "local"
      },
      context: {
        model: String(result.model || "").trim(),
        mimeType,
        bytes: Number(result.bytes || 0) || 0,
        notebook: Boolean(noteResult?.note),
        noteId: String(noteResult?.note?.id || "").trim()
      },
      policy: {
        approvalState: "not_required",
        mode: "trusted_owned_cloud",
        autonomous: true
      },
      detail: {
        filePath: String(result.filePath || "").trim(),
        artifactJson: artifact.jsonPath,
        artifactMarkdown: artifact.markdownPath
      },
      status: "completed"
    });

    return res.json({
      ok: true,
      result: {
        model: result.model,
        filePath: result.filePath,
        fileName: result.fileName,
        mimeType: result.mimeType,
        bytes: result.bytes,
        prompt: result.prompt,
        reply: result.reply,
        uploadedFile: result.uploadedFile
      },
      artifact,
      note: noteResult?.note || null,
      warning: noteResult?.warning || ""
    });
  } catch (error) {
    return respondError(res, error, 400);
  }
});

app.post("/contactout/open", async (req, res) => {
  try {
    if (!contactOutPolicy.enabled) {
      return respondError(res, "ContactOut integration is disabled by policy.", 403);
    }
    const requestedUrl = String(req.body?.url || req.body?.target || "").trim();
    const url = normalizeUrl(requestedUrl || contactOutPolicy.defaultUrl || CONTACTOUT_DEFAULT_URL);
    const targets = resolveContactOutLaunchTargets({
      profileDirectory: String(req.body?.profileDirectory || "").trim(),
      profileEmail: String(req.body?.profileEmail || "").trim(),
      allProfiles: asBool(req.body?.allProfiles, false)
    }, contactOutPolicy);

    const launches = targets.map((target) => launchChromeUrl(url, {
      newWindow: asBool(req.body?.newWindow, true),
      appMode: asBool(req.body?.appMode, false),
      isolatedProfile: false,
      profileDirectory: String(target.directory || "").trim(),
      profileEmail: String(target.email || "").trim(),
      allowRestrictedProfile: Boolean(target.restricted)
    }));

    return res.json({
      ok: true,
      opened: url,
      freeOnly: contactOutPolicy.freeOnly !== false,
      integrationMode: "browser_extension",
      extensionId: contactOutPolicy.extensionId,
      launches: launches.map((entry) => ({
        pid: entry.pid || 0,
        url: entry.url,
        profileDirectory: entry.profileDirectory || "",
        profileEmail: entry.profileEmail || "",
        appMode: Boolean(entry.appMode)
      }))
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.post("/openai_web_chat/chat", async (req, res) => {
  try {
    if (!openAiWebChatPolicy.enabled) {
      return respondError(res, "OpenAI web chat is disabled by policy.", 403);
    }
    if (!browserTaskPolicy.enabled) {
      return respondError(res, "Browser tasks are disabled by policy.", 403);
    }

    const compiled = compileOpenAiWebChatPayload(req.body || {});
    const runtime = compiled.runtimeProfile || {};
    if (runtime.usePersistentProfile) {
      if (!runtime.userDataDir || !runtime.profileDirectory) {
        return respondError(
          res,
          `OpenAI web chat profile runtime is incomplete. userDataDir="${runtime.userDataDir || ""}", profileDirectory="${runtime.profileDirectory || ""}"${runtime.profileError ? `, error="${runtime.profileError}"` : ""}`,
          400
        );
      }
    }

    const workContext = resolveWorkContextFromRequest(req);
    const orgGate = enforceRestrictedOrgVpnGate("OpenAI web chat", workContext.organization);
    const policyWarnings = [
      orgGate.warning,
      ...enforceWorkLinkPolicyForBrowserTask({
        url: compiled.url,
        steps: compiled.steps,
        organization: workContext.organization
      }, {
        organization: workContext.organization
      })
    ].filter(Boolean);

    const guardian = await evaluateGuardianGuard({
      message: [
        `OpenAI web chat: ${compiled.url}`,
        `steps=${compiled.summary.stepCount}`,
        `promptChars=${compiled.summary.promptChars}`
      ].join(" "),
      routed: { action: "openai_web_chat_ask" },
      source: "api.integrations.openai_web_chat.chat"
    });
    if (guardian.triggered && guardian.blocked) {
      const approvalHint = guardian.approvalRequest?.id
        ? ` Approval ID ${guardian.approvalRequest.id}. Use APPROVE ${guardian.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked OpenAI web chat (${guardian.risk.level}). ${guardian.decision?.text || ""}${approvalHint}`.trim(),
        403
      );
    }

    const job = enqueueBrowserTask({
      url: compiled.url,
      steps: compiled.steps,
      organization: workContext.organization,
      waitMs: compiled.waitMs,
      maxChars: compiled.maxChars,
      maxLinks: compiled.maxLinks,
      actionTimeoutMs: compiled.actionTimeoutMs,
      useChromePersistentProfile: runtime.usePersistentProfile,
      chromeUserDataDir: runtime.userDataDir,
      chromeProfileDirectory: runtime.profileDirectory
    });

    return res.json({
      ok: true,
      ...queueReply(job, `Queued OpenAI web chat job ${job.id}.`),
      organization: workContext.organization,
      policyWarnings,
      compiled: compiled.summary,
      guardian
    });
  } catch (error) {
    try {
      appendMistakeLedger({
        feature: "openai_web_chat",
        operation: "automation_request",
        type: "openai_web_chat_error",
        severity: "medium",
        actor: "owner",
        laneId: "control_plane",
        message: String(error?.message || error || "openai_web_chat_failed").slice(0, 240),
        code: "openai_web_chat_error",
        classificationCode: "8.2.21",
        activityType: "web_chat",
        skillId: "openai.web_chat_ask",
        toolId: "openai_web_chat"
      });
    } catch (_ledgerError) {
      // best-effort only
    }
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.post("/gemini_enterprise_web/chat", async (req, res) => {
  try {
    if (!geminiEnterpriseWebPolicy.enabled) {
      return respondError(res, "Gemini Enterprise web chat is disabled by policy.", 403);
    }
    if (!browserTaskPolicy.enabled) {
      return respondError(res, "Browser tasks are disabled by policy.", 403);
    }

    const compiled = compileGeminiEnterpriseWebChatPayload(req.body || {});
    const runtime = compiled.runtimeProfile || {};
    if (runtime.usePersistentProfile) {
      if (!runtime.userDataDir || !runtime.profileDirectory) {
        return respondError(
          res,
          `Gemini Enterprise web chat profile runtime is incomplete. userDataDir="${runtime.userDataDir || ""}", profileDirectory="${runtime.profileDirectory || ""}"${runtime.profileError ? `, error="${runtime.profileError}"` : ""}`,
          400
        );
      }
    }
    const workContext = resolveWorkContextFromRequest(req);
    const orgGate = enforceRestrictedOrgVpnGate("Gemini Enterprise web chat", workContext.organization);
    const policyWarnings = [
      orgGate.warning,
      ...enforceWorkLinkPolicyForBrowserTask({
        url: compiled.url,
        steps: compiled.steps,
        organization: workContext.organization
      }, {
        organization: workContext.organization
      })
    ].filter(Boolean);

    const guardian = await evaluateGuardianGuard({
      message: [
        `Gemini Enterprise web chat: ${compiled.url}`,
        `steps=${compiled.summary.stepCount}`,
        `promptChars=${compiled.summary.promptChars}`
      ].join(" "),
      routed: { action: "gemini_enterprise_web_chat" },
      source: "api.integrations.gemini_enterprise_web.chat"
    });
    if (guardian.triggered && guardian.blocked) {
      const approvalHint = guardian.approvalRequest?.id
        ? ` Approval ID ${guardian.approvalRequest.id}. Use APPROVE ${guardian.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked Gemini Enterprise web chat (${guardian.risk.level}). ${guardian.decision?.text || ""}${approvalHint}`.trim(),
        403
      );
    }

    const job = enqueueBrowserTask({
      url: compiled.url,
      steps: compiled.steps,
      organization: workContext.organization,
      waitMs: compiled.waitMs,
      maxChars: compiled.maxChars,
      maxLinks: compiled.maxLinks,
      actionTimeoutMs: compiled.actionTimeoutMs,
      useChromePersistentProfile: runtime.usePersistentProfile,
      chromeUserDataDir: runtime.userDataDir,
      chromeProfileDirectory: runtime.profileDirectory
    });

    return res.json({
      ok: true,
      ...queueReply(job, `Queued Gemini Enterprise web chat job ${job.id}.`),
      organization: workContext.organization,
      policyWarnings,
      compiled: compiled.summary,
      guardian
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.post("/gemini_api/config", async (req, res) => {
  try {
    if (!isLoopbackRequest(req)) {
      return respondError(res, "Gemini API configuration is only allowed from local loopback.", 403);
    }
    if (!geminiApiPolicy.enabled) {
      return respondError(res, "Gemini API integration is disabled by policy.", 403);
    }

    const clear = asBool(req.body?.clear, false);
    const guardian = await evaluateGuardianGuard({
      message: clear ? "Gemini API settings clear request" : "Gemini API settings update request",
      routed: { action: "gemini_api_config" },
      source: "api.integrations.gemini_api.config"
    });
    if (guardian.triggered && guardian.blocked) {
      const approvalHint = guardian.approvalRequest?.id
        ? ` Approval ID ${guardian.approvalRequest.id}. Use APPROVE ${guardian.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked Gemini API config update (${guardian.risk.level}). ${guardian.decision?.text || ""}${approvalHint}`.trim(),
        403
      );
    }

    const config = setGeminiApiConfig({
      clear,
      enabled: req.body?.enabled,
      apiKey: req.body?.apiKey || req.body?.key || req.body?.token,
      name: req.body?.name,
      projectNumber: req.body?.projectNumber || req.body?.projectId,
      projectName: req.body?.projectName || req.body?.project,
      defaultModel: req.body?.defaultModel || req.body?.model
    });

    return res.json({
      ok: true,
      config,
      guardian
    });
  } catch (error) {
    return respondError(res, error, 400);
  }
});

app.post("/vertex/budget/config", async (req, res) => {
  try {
    if (!isLoopbackRequest(req)) {
      return respondError(res, "Vertex budget configuration is only allowed from local loopback.", 403);
    }

    const clear = asBool(req.body?.clear, false);
    const enabled = req.body?.enabled === undefined ? undefined : asBool(req.body?.enabled, true);
    const maxRequestsPerDay = req.body?.maxRequestsPerDay;
    const maxPromptTokensPerDay = req.body?.maxPromptTokensPerDay;
    const maxOutputTokensPerDay = req.body?.maxOutputTokensPerDay;
    const warnPercent = req.body?.warnPercent;

    const guardian = await evaluateGuardianGuard({
      message: clear ? "Vertex budget settings clear request" : "Vertex budget settings update request",
      routed: { action: "vertex_budget_set" },
      source: "api.integrations.vertex.budget.config"
    });
    if (guardian.triggered && guardian.blocked) {
      const approvalHint = guardian.approvalRequest?.id
        ? ` Approval ID ${guardian.approvalRequest.id}. Use APPROVE ${guardian.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked Vertex budget config update (${guardian.risk.level}). ${guardian.decision?.text || ""}${approvalHint}`.trim(),
        403
      );
    }

    const status = setVertexBudgetConfig({
      clear,
      enabled,
      maxRequestsPerDay,
      maxPromptTokensPerDay,
      maxOutputTokensPerDay,
      warnPercent
    });

    return res.json({
      ok: true,
      status,
      guardian
    });
  } catch (error) {
    return respondError(res, error, 400);
  }
});

app.post("/vertex/budget/reset", async (req, res) => {
  try {
    if (!isLoopbackRequest(req)) {
      return respondError(res, "Vertex budget reset is only allowed from local loopback.", 403);
    }

    const guardian = await evaluateGuardianGuard({
      message: "Vertex budget usage reset request",
      routed: { action: "vertex_budget_reset" },
      source: "api.integrations.vertex.budget.reset"
    });
    if (guardian.triggered && guardian.blocked) {
      const approvalHint = guardian.approvalRequest?.id
        ? ` Approval ID ${guardian.approvalRequest.id}. Use APPROVE ${guardian.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked Vertex budget reset (${guardian.risk.level}). ${guardian.decision?.text || ""}${approvalHint}`.trim(),
        403
      );
    }

    const status = resetVertexBudgetUsage({
      day: req.body?.day
    });
    clearVertexBudgetAlertState();

    return res.json({
      ok: true,
      status,
      guardian
    });
  } catch (error) {
    return respondError(res, error, 400);
  }
});

app.post("/google/oauth/start", async (req, res) => {
  try {
    if (!googlePolicy.enabled) {
      return respondError(res, "Google integration is disabled by policy.", 403);
    }
    const loginHint = String(req.body?.account || req.body?.loginHint || req.query?.account || "").trim();
    const guardian = await evaluateGuardianGuard({
      message: `Google auth start request${loginHint ? ` loginHint=${loginHint}` : ""}`,
      routed: { action: "google_auth_start" },
      source: "api.integrations.google.oauth.start"
    });
    if (guardian.triggered && guardian.blocked) {
      const approvalHint = guardian.approvalRequest?.id
        ? ` Approval ID ${guardian.approvalRequest.id}. Use APPROVE ${guardian.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked Google auth start (${guardian.risk.level}). ${guardian.decision?.text || ""}${approvalHint}`.trim(),
        403
      );
    }

    const oauth = startGoogleOAuth({
      loginHint
    });
    return res.json({
      ok: true,
      oauth,
      note: "Open oauth.authUrl on the same PC running Asolaria to complete the loopback callback."
    });
  } catch (error) {
    return respondError(res, error, 400);
  }
});

app.post("/atlassian/oauth/start", async (req, res) => {
  try {
    if (!atlassianPolicy.enabled) {
      return respondError(res, "Atlassian integration is disabled by policy.", 403);
    }
    const account = String(req.body?.account || req.body?.loginHint || req.query?.account || "").trim();
    const guardian = await evaluateGuardianGuard({
      message: `Atlassian auth start request${account ? ` account=${account}` : ""}`,
      routed: { action: "atlassian_auth_start" },
      source: "api.integrations.atlassian.oauth.start"
    });
    if (guardian.triggered && guardian.blocked) {
      const approvalHint = guardian.approvalRequest?.id
        ? ` Approval ID ${guardian.approvalRequest.id}. Use APPROVE ${guardian.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked Atlassian auth start (${guardian.risk.level}). ${guardian.decision?.text || ""}${approvalHint}`.trim(),
        403
      );
    }

    const oauth = startAtlassianOAuth({
      account
    });
    return res.json({
      ok: true,
      oauth,
      note: "Open oauth.authUrl on the same PC running Asolaria to complete the loopback callback."
    });
  } catch (error) {
    return respondError(res, error, 400);
  }
});

app.post("/hubspot/oauth/start", async (req, res) => {
  try {
    if (!hubspotPolicy.enabled) {
      return respondError(res, "HubSpot integration is disabled by policy.", 403);
    }
    const portalHint = String(req.body?.portalId || req.body?.portalHint || req.query?.portalId || "").trim();
    const guardian = await evaluateGuardianGuard({
      message: `HubSpot auth start request${portalHint ? ` portalHint=${portalHint}` : ""}`,
      routed: { action: "hubspot_auth_start" },
      source: "api.integrations.hubspot.oauth.start"
    });
    if (guardian.triggered && guardian.blocked) {
      const approvalHint = guardian.approvalRequest?.id
        ? ` Approval ID ${guardian.approvalRequest.id}. Use APPROVE ${guardian.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked HubSpot auth start (${guardian.risk.level}). ${guardian.decision?.text || ""}${approvalHint}`.trim(),
        403
      );
    }

    const oauth = startHubSpotOAuth({
      portalHint
    });
    return res.json({
      ok: true,
      oauth,
      note: "Open oauth.authUrl on the same PC running Asolaria to complete the loopback callback."
    });
  } catch (error) {
    return respondError(res, error, 400);
  }
});

app.post("/vertex/ask", async (req, res) => {
  try {
    if (!vertexPolicy.enabled) {
      return respondError(res, "Vertex integration is disabled by policy.", 403);
    }
    const prompt = String(req.body?.prompt || req.body?.message || "").trim();
    if (!prompt) {
      return respondError(res, "prompt is required.", 400);
    }

    const guardian = await evaluateGuardianGuard({
      message: `Vertex ask: ${clipText(prompt, 220)}`,
      routed: { action: "vertex_ask" },
      source: "api.integrations.vertex.ask"
    });
    if (guardian.triggered && guardian.blocked) {
      const approvalHint = guardian.approvalRequest?.id
        ? ` Approval ID ${guardian.approvalRequest.id}. Use APPROVE ${guardian.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked Vertex ask (${guardian.risk.level}). ${guardian.decision?.text || ""}${approvalHint}`.trim(),
        403
      );
    }

    const job = enqueueVertexGemini({
      prompt,
      system: req.body?.system,
      temperature: req.body?.temperature,
      maxOutputTokens: req.body?.maxOutputTokens
    });
    return res.json({
      ok: true,
      ...queueReply(job, `Queued Vertex ask job ${job.id}.`),
      guardian
    });
  } catch (error) {
    return respondError(res, error, 400);
  }
});

app.post("/google/request", async (req, res) => {
  try {
    if (!googlePolicy.enabled) {
      return respondError(res, "Google integration is disabled by policy.", 403);
    }

    const account = String(req.body?.account || req.body?.email || "").trim();
    const method = String(req.body?.method || "GET").trim().toUpperCase() || "GET";
    const url = String(req.body?.url || "").trim();
    if (!url) {
      return respondError(res, "url is required.", 400);
    }
    const policy = req.body?.policy && typeof req.body.policy === "object" && !Array.isArray(req.body.policy)
      ? req.body.policy
      : null;

    let urlHint = clipText(url, 280);
    try {
      const parsed = new URL(url);
      urlHint = `${parsed.hostname}${parsed.pathname || "/"}`;
    } catch (_error) {
      // keep clipText fallback
    }

    const guardian = await evaluateGuardianGuard({
      message: `Google API request ${urlHint}`,
      routed: { action: "google_api_request" },
      source: "api.integrations.google.request"
    });
    if (guardian.triggered && guardian.blocked) {
      const approvalHint = guardian.approvalRequest?.id
        ? ` Approval ID ${guardian.approvalRequest.id}. Use APPROVE ${guardian.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked Google API request (${guardian.risk.level}). ${guardian.decision?.text || ""}${approvalHint}`.trim(),
        403
      );
    }

    const jobPayload = { account, method, url };
    if (Object.prototype.hasOwnProperty.call(req.body || {}, "body")) {
      jobPayload.body = req.body?.body;
    }
    if (policy) {
      jobPayload.policy = policy;
    }
    const job = enqueueGoogleApiRequest(jobPayload);
    return res.json({
      ok: true,
      ...queueReply(job, `Queued Google API request job ${job.id}.`),
      guardian
    });
  } catch (error) {
    return respondError(res, error, 400);
  }
});

app.post("/google_workspace_cli/run", requireLoopbackOnly, async (req, res) => {
  try {
    if (!googlePolicy.enabled) {
      return respondError(res, "Google integration is disabled by policy.", 403);
    }

    const args = Array.isArray(req.body?.args) ? req.body.args : [];
    if (args.length < 1) {
      return respondError(res, "args array is required.", 400);
    }

    const account = String(req.body?.account || req.body?.email || "").trim();
    const projectId = String(req.body?.projectId || req.body?.project || "").trim();
    const timeoutMs = Math.max(10000, Math.min(180000, Number(req.body?.timeoutMs || 120000)));
    const commandPreview = clipText(args.map((item) => String(item || "").trim()).filter(Boolean).join(" "), 220);

    const guardian = await evaluateGuardianGuard({
      message: `Google Workspace CLI run ${commandPreview}`,
      routed: { action: "google_workspace_cli_run" },
      source: "api.integrations.google_workspace_cli.run"
    });
    if (guardian.triggered && guardian.blocked) {
      const approvalHint = guardian.approvalRequest?.id
        ? ` Approval ID ${guardian.approvalRequest.id}. Use APPROVE ${guardian.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked Google Workspace CLI run (${guardian.risk.level}). ${guardian.decision?.text || ""}${approvalHint}`.trim(),
        403
      );
    }

    const result = await runGoogleWorkspaceCli(args, {
      account,
      projectId,
      timeoutMs
    });

    return res.json({
      ok: true,
      result,
      guardian
    });
  } catch (error) {
    return respondError(res, error, inferHttpStatusForError(error, 400));
  }
});

app.post("/atlassian/request", async (req, res) => {
  try {
    if (!atlassianPolicy.enabled) {
      return respondError(res, "Atlassian integration is disabled by policy.", 403);
    }

    const account = String(req.body?.account || req.body?.email || "").trim();
    const url = String(req.body?.url || "").trim();
    if (!url) {
      return respondError(res, "url is required.", 400);
    }
    const policy = req.body?.policy && typeof req.body.policy === "object" && !Array.isArray(req.body.policy)
      ? req.body.policy
      : null;

    let urlHint = clipText(url, 280);
    try {
      const parsed = new URL(url);
      urlHint = `${parsed.hostname}${parsed.pathname || "/"}`;
    } catch (_error) {
      // keep clipText fallback
    }

    const guardian = await evaluateGuardianGuard({
      message: `Atlassian API request ${urlHint}`,
      routed: { action: "atlassian_api_request" },
      source: "api.integrations.atlassian.request"
    });
    if (guardian.triggered && guardian.blocked) {
      const approvalHint = guardian.approvalRequest?.id
        ? ` Approval ID ${guardian.approvalRequest.id}. Use APPROVE ${guardian.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked Atlassian API request (${guardian.risk.level}). ${guardian.decision?.text || ""}${approvalHint}`.trim(),
        403
      );
    }

    const jobPayload = { account, url };
    if (policy) {
      jobPayload.policy = policy;
    }
    const job = enqueueAtlassianApiRequest(jobPayload);
    return res.json({
      ok: true,
      ...queueReply(job, `Queued Atlassian API request job ${job.id}.`),
      guardian
    });
  } catch (error) {
    return respondError(res, error, 400);
  }
});

app.post("/gcp/request", async (req, res) => {
  try {
    if (!gcpPolicy.enabled) {
      return respondError(res, "GCP integration is disabled by policy.", 403);
    }

    const method = String(req.body?.method || "GET").trim().toUpperCase() || "GET";
    const url = String(req.body?.url || "").trim();
    const scopes = Array.isArray(req.body?.scopes)
      ? req.body.scopes
      : String(req.body?.scopes || "").trim();

    let body = req.body?.body;
    if (typeof body === "string" && body.trim()) {
      try {
        body = JSON.parse(body);
      } catch (_error) {
        return respondError(res, "body must be valid JSON when provided as a string.", 400);
      }
    }

    if (!url) {
      return respondError(res, "url is required.", 400);
    }

    let urlHint = clipText(url, 280);
    try {
      const parsed = new URL(url);
      urlHint = `${parsed.hostname}${parsed.pathname || "/"}`;
    } catch (_error) {
      // keep clipText fallback
    }

    const routedAction = (method === "GET" || method === "HEAD") ? "gcp_api_request" : "gcp_api_mutation";
    const guardian = await evaluateGuardianGuard({
      message: `GCP API ${method} ${urlHint}`,
      routed: { action: routedAction },
      source: "api.integrations.gcp.request"
    });
    if (guardian.triggered && guardian.blocked) {
      const approvalHint = guardian.approvalRequest?.id
        ? ` Approval ID ${guardian.approvalRequest.id}. Use APPROVE ${guardian.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked GCP API request (${guardian.risk.level}). ${guardian.decision?.text || ""}${approvalHint}`.trim(),
        403
      );
    }

    const job = enqueueGcpApiRequest({
      method,
      url,
      body,
      scopes
    });
    return res.json({
      ok: true,
      ...queueReply(job, `Queued GCP API request job ${job.id}.`),
      guardian
    });
  } catch (error) {
    return respondError(res, error, 400);
  }
});

app.get("/gcp/services/enabled", async (req, res) => {
  try {
    if (!gcpPolicy.enabled) {
      return respondError(res, "GCP integration is disabled by policy.", 403);
    }
    let project = String(req.query?.project || req.query?.projectId || req.query?.id || "").trim();
    if (!project) {
      const status = getGcpConfigSummary(gcpPolicy);
      project = String(status.defaultProject || "").trim();
    }
    const pageSize = asInt(req.query?.pageSize, 60, 1, 200);
    const pageToken = String(req.query?.pageToken || "").trim();
    const job = enqueueGcpEnabledServices({ project, pageSize, pageToken });
    return res.json({
      ok: true,
      ...queueReply(job, `Queued GCP enabled services job ${job.id}.`)
    });
  } catch (error) {
    return respondError(res, error, 400);
  }
});

async function isGcpServiceAlreadyEnabled(project, serviceName) {
  let pageToken = "";
  const wanted = String(serviceName || "").trim().toLowerCase();
  for (let i = 0; i < 12; i++) {
    const page = await listEnabledServices({
      project,
      pageSize: 200,
      pageToken
    }, {
      scopes: ["https://www.googleapis.com/auth/cloud-platform.read-only"],
      maxDepth: 4,
      maxEntries: 320,
      maxString: 1200
    });
    const services = Array.isArray(page.services) ? page.services : [];
    if (services.some((svc) => String(svc?.name || "").trim().toLowerCase() === wanted)) {
      return true;
    }
    if (!page.hasMore || !page.nextPageToken) {
      break;
    }
    pageToken = String(page.nextPageToken || "").trim();
    if (!pageToken) {
      break;
    }
  }
  return false;
}

app.post("/gcp/services/enable", async (req, res) => {
  try {
    if (!gcpPolicy.enabled) {
      return respondError(res, "GCP integration is disabled by policy.", 403);
    }

    let project = String(req.body?.project || req.body?.projectId || "").trim();
    if (!project) {
      const status = getGcpConfigSummary(gcpPolicy);
      project = String(status.defaultProject || "").trim();
    }
    const serviceName = String(req.body?.serviceName || req.body?.service || "").trim();
    if (!project || !serviceName) {
      return respondError(res, "project and serviceName are required.", 400);
    }

    let preflight = {
      checked: false,
      alreadyEnabled: false,
      error: ""
    };
    try {
      preflight.checked = true;
      preflight.alreadyEnabled = await isGcpServiceAlreadyEnabled(project, serviceName);
    } catch (error) {
      preflight.error = String(error?.message || error || "").trim();
    }

    if (preflight.alreadyEnabled) {
      return res.json({
        ok: true,
        mode: "noop",
        project,
        serviceName,
        alreadyEnabled: true,
        preflight
      });
    }

    const guardian = await evaluateGuardianGuard({
      message: `GCP enable service ${serviceName} on ${project}`,
      routed: { action: "gcp_service_enable" },
      source: "api.integrations.gcp.service_enable"
    });
    if (guardian.triggered && guardian.blocked) {
      const approvalHint = guardian.approvalRequest?.id
        ? ` Approval ID ${guardian.approvalRequest.id}. Use APPROVE ${guardian.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked GCP enable service (${guardian.risk.level}). ${guardian.decision?.text || ""}${approvalHint}`.trim(),
        403
      );
    }

    const job = enqueueGcpEnableService({ project, serviceName });
    return res.json({
      ok: true,
      ...queueReply(job, `Queued GCP enable service job ${job.id}.`),
      preflight,
      guardian
    });
  } catch (error) {
    return respondError(res, error, 400);
  }
});

app.post("/gcp/services/bootstrap", async (req, res) => {
  try {
    if (!gcpPolicy.enabled) {
      return respondError(res, "GCP integration is disabled by policy.", 403);
    }

    let project = String(req.body?.project || req.body?.projectId || "").trim();
    if (!project) {
      const status = getGcpConfigSummary(gcpPolicy);
      project = String(status.defaultProject || "").trim();
    }
    const profile = String(req.body?.profile || "asolaria_core").trim();
    const services = Array.isArray(req.body?.services)
      ? req.body.services
      : String(req.body?.services || "").trim();
    const force = asBool(req.body?.force, false);

    const selection = resolveGcpBootstrapServiceSelection({
      profile,
      services
    });

    const guardian = await evaluateGuardianGuard({
      message: `GCP bootstrap services (${selection.profile}) on ${project || "(default project)"}`,
      routed: { action: "gcp_services_bootstrap" },
      source: "api.integrations.gcp.services.bootstrap"
    });
    if (guardian.triggered && guardian.blocked) {
      const approvalHint = guardian.approvalRequest?.id
        ? ` Approval ID ${guardian.approvalRequest.id}. Use APPROVE ${guardian.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked GCP services bootstrap (${guardian.risk.level}). ${guardian.decision?.text || ""}${approvalHint}`.trim(),
        403
      );
    }

    const job = enqueueGcpServicesBootstrap({
      project,
      profile: selection.profile,
      services: selection.customServices || undefined,
      force
    });
    return res.json({
      ok: true,
      profile: selection.profile,
      services: selection.services,
      ...queueReply(job, `Queued GCP bootstrap services job ${job.id}.`),
      guardian
    });
  } catch (error) {
    return respondError(res, error, 400);
  }
});

app.get("/notebooklm/enterprise/status", async (req, res) => {
  try {
    if (!gcpPolicy.enabled) {
      return respondError(res, "GCP integration is disabled by policy.", 403);
    }
    const job = enqueueNotebooklmEnterpriseStatus({
      account: String(req.query?.account || req.query?.email || "").trim(),
      project: String(req.query?.project || req.query?.projectId || "").trim(),
      projectNumber: String(req.query?.projectNumber || "").trim(),
      location: String(req.query?.location || "").trim()
    });
    return res.json({
      ok: true,
      ...queueReply(job, `Queued NotebookLM Enterprise status job ${job.id}.`)
    });
  } catch (error) {
    return respondError(res, error, 400);
  }
});

app.get("/notebooklm/enterprise/notebooks", async (req, res) => {
  try {
    if (!gcpPolicy.enabled) {
      return respondError(res, "GCP integration is disabled by policy.", 403);
    }
    const job = enqueueNotebooklmEnterpriseList({
      account: String(req.query?.account || req.query?.email || "").trim(),
      project: String(req.query?.project || req.query?.projectId || "").trim(),
      projectNumber: String(req.query?.projectNumber || "").trim(),
      location: String(req.query?.location || "").trim(),
      limit: asInt(req.query?.limit, 20, 1, 100),
      pageToken: String(req.query?.pageToken || "").trim()
    });
    return res.json({
      ok: true,
      ...queueReply(job, `Queued NotebookLM Enterprise list job ${job.id}.`)
    });
  } catch (error) {
    return respondError(res, error, 400);
  }
});

app.post("/notebooklm/enterprise/notebooks", async (req, res) => {
  try {
    if (!gcpPolicy.enabled) {
      return respondError(res, "GCP integration is disabled by policy.", 403);
    }
    const project = String(req.body?.project || req.body?.projectId || "").trim();
    const projectNumber = String(req.body?.projectNumber || "").trim();
    const location = String(req.body?.location || "").trim();
    const account = String(req.body?.account || req.body?.email || "").trim();
    const title = String(req.body?.title || "").trim();

    const guardian = await evaluateGuardianGuard({
      message: `NotebookLM Enterprise create notebook${title ? ` title=${clipText(title, 120)}` : ""}`,
      routed: { action: "notebooklm_enterprise_create" },
      source: "api.integrations.notebooklm.enterprise.create"
    });
    if (guardian.triggered && guardian.blocked) {
      const approvalHint = guardian.approvalRequest?.id
        ? ` Approval ID ${guardian.approvalRequest.id}. Use APPROVE ${guardian.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked NotebookLM Enterprise notebook creation (${guardian.risk.level}). ${guardian.decision?.text || ""}${approvalHint}`.trim(),
        403
      );
    }

    const job = enqueueNotebooklmEnterpriseCreate({
      account,
      project,
      projectNumber,
      location,
      title
    });
    return res.json({
      ok: true,
      ...queueReply(job, `Queued NotebookLM Enterprise create notebook job ${job.id}.`),
      guardian
    });
  } catch (error) {
    return respondError(res, error, 400);
  }
});

app.post("/notebooklm/enterprise/sources/batch_create", async (req, res) => {
  try {
    if (!gcpPolicy.enabled) {
      return respondError(res, "GCP integration is disabled by policy.", 403);
    }
    const project = String(req.body?.project || req.body?.projectId || "").trim();
    const projectNumber = String(req.body?.projectNumber || "").trim();
    const location = String(req.body?.location || "").trim();
    const account = String(req.body?.account || req.body?.email || "").trim();
    const notebook = String(req.body?.notebook || req.body?.notebookName || req.body?.notebookId || "").trim();
    if (!notebook) {
      return respondError(res, "notebook (or notebookName/notebookId) is required.", 400);
    }

    let entries = Array.isArray(req.body?.entries)
      ? req.body.entries
      : Array.isArray(req.body?.sources)
        ? req.body.sources
        : Array.isArray(req.body?.userContents)
          ? req.body.userContents
          : [];
    if (!entries.length && typeof req.body?.entries === "string" && String(req.body.entries).trim()) {
      try {
        const parsed = JSON.parse(String(req.body.entries).trim());
        if (Array.isArray(parsed)) {
          entries = parsed;
        }
      } catch (_error) {
        return respondError(res, "entries must be a JSON array when provided as string.", 400);
      }
    }
    if (!entries.length) {
      return respondError(res, "At least one entry is required in entries/sources/userContents.", 400);
    }

    const guardian = await evaluateGuardianGuard({
      message: `NotebookLM Enterprise add ${entries.length} source(s) to ${notebook}`,
      routed: { action: "notebooklm_enterprise_sources_add" },
      source: "api.integrations.notebooklm.enterprise.sources.batch_create"
    });
    if (guardian.triggered && guardian.blocked) {
      const approvalHint = guardian.approvalRequest?.id
        ? ` Approval ID ${guardian.approvalRequest.id}. Use APPROVE ${guardian.approvalRequest.id} to allow once.`
        : "";
      return respondError(
        res,
        `Guardian blocked NotebookLM Enterprise source add (${guardian.risk.level}). ${guardian.decision?.text || ""}${approvalHint}`.trim(),
        403
      );
    }

    const job = enqueueNotebooklmEnterpriseSourcesAdd({
      account,
      project,
      projectNumber,
      location,
      notebook,
      entries
    });
    return res.json({
      ok: true,
      ...queueReply(job, `Queued NotebookLM Enterprise source batch job ${job.id}.`),
      guardian
    });
  } catch (error) {
    return respondError(res, error, 400);
  }
});

app.get("/google/oauth/callback", async (req, res) => {
  try {
    if (!isLoopbackRequest(req)) {
      return respondError(res, "Google OAuth callback is only allowed from local loopback.", 403);
    }
    const result = await completeGoogleOAuthCallback({
      code: req.query?.code,
      state: req.query?.state
    });
    const html = [
      "<!doctype html>",
      "<html><head><meta charset=\"utf-8\" />",
      "<title>Asolaria Google Auth</title>",
      "<style>body{font-family:system-ui,Segoe UI,Arial,sans-serif;padding:24px;line-height:1.4}code{background:#f3f3f3;padding:2px 6px;border-radius:4px}</style>",
      "</head><body>",
      "<h2>Google account connected</h2>",
      `<p>Account: <code>${String(result.email || "").replace(/&/g, "&amp;").replace(/</g, "&lt;")}</code></p>`,
      `<p>Expires: <code>${String(result.expiresAt || "unknown")}</code></p>`,
      `<p>Refresh token: <code>${result.hasRefreshToken ? "yes" : "no"}</code></p>`,
      "<p>You can close this tab and return to Asolaria.</p>",
      "</body></html>"
    ].join("");
    res.setHeader("Cache-Control", "no-store");
    res.type("html");
    return res.send(html);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const wantsHtml = String(req.headers?.accept || "").includes("text/html");
    if (!wantsHtml) {
      return respondError(res, error, 400);
    }

    const esc = (value) => String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const hints = [];
    const lower = String(message || "").toLowerCase();
    if (lower.includes("redirect_uri_mismatch")) {
      hints.push(
        `Add this Authorized redirect URI in Google Cloud (OAuth 2.0 Client ID): <code>http://127.0.0.1:4781/api/integrations/google/oauth/callback</code>.`
      );
    }
    if (lower.includes("oauth state") || (lower.includes("state") && lower.includes("expired"))) {
      hints.push("This OAuth link is one-time and expires quickly (about 12 minutes) and also resets if Asolaria restarts. Click <b>Start OAuth</b> again in Asolaria to generate a fresh link.");
    }
    if (lower.includes("access_denied") || lower.includes("developer hasn")) {
      hints.push("If your OAuth consent screen is in <b>Testing</b>, add your Gmail account(s) under <b>Test users</b>.");
      hints.push("If the consent screen is <b>Internal</b>, personal Gmail accounts will be blocked. Use <b>External</b>.");
    }
    if (lower.includes("gmail api has not been used") || lower.includes("gmail.googleapis.com")) {
      hints.push("Enable <b>Gmail API</b> in the same Google Cloud project: APIs & Services -> Library -> Gmail API -> Enable.");
    }
    if (lower.includes("calendar api has not been used") || lower.includes("calendar-json")) {
      hints.push("Enable <b>Google Calendar API</b> in the same Google Cloud project: APIs & Services -> Library -> Google Calendar API -> Enable.");
    }
    hints.push("After changing Google Cloud settings, wait 1-5 minutes, then restart OAuth from Asolaria Admin Integrations (Start OAuth) to generate a fresh link.");

    const hintHtml = hints.length
      ? `<h3>What to do</h3><ul>${hints.map((h) => `<li>${h}</li>`).join("")}</ul>`
      : "";

    const html = [
      "<!doctype html>",
      "<html><head><meta charset=\"utf-8\" />",
      "<title>Asolaria Google Auth (Error)</title>",
      "<style>body{font-family:system-ui,Segoe UI,Arial,sans-serif;padding:24px;line-height:1.4}code{background:#f3f3f3;padding:2px 6px;border-radius:4px}li{margin:6px 0}</style>",
      "</head><body>",
      "<h2>Google auth failed</h2>",
      `<p><b>Error:</b> <code>${esc(message)}</code></p>`,
      hintHtml,
      "<p>You can close this tab and return to Asolaria.</p>",
      "</body></html>"
    ].join("");
    res.setHeader("Cache-Control", "no-store");
    res.status(400);
    res.type("html");
    return res.send(html);
  }
});

app.get("/atlassian/oauth/callback", async (req, res) => {
  try {
    if (!isLoopbackRequest(req)) {
      return respondError(res, "Atlassian OAuth callback is only allowed from local loopback.", 403);
    }
    const result = await completeAtlassianOAuthCallback({
      code: req.query?.code,
      state: req.query?.state
    });

    const esc = (value) => String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const html = [
      "<!doctype html>",
      "<html><head><meta charset=\"utf-8\" />",
      "<title>Asolaria Atlassian Auth</title>",
      "<style>body{font-family:system-ui,Segoe UI,Arial,sans-serif;padding:24px;line-height:1.4}code{background:#f3f3f3;padding:2px 6px;border-radius:4px}</style>",
      "</head><body>",
      "<h2>Atlassian account connected</h2>",
      `<p>Account key: <code>${esc(result.account || "")}</code></p>`,
      `<p>Expires: <code>${esc(result.expiresAt || "unknown")}</code></p>`,
      `<p>Refresh token: <code>${result.hasRefreshToken ? "yes" : "no"}</code></p>`,
      `<p>Accessible sites: <code>${esc(String(result.resourcesCount ?? "unknown"))}</code></p>`,
      "<p>You can close this tab and return to Asolaria.</p>",
      "</body></html>"
    ].join("");
    res.setHeader("Cache-Control", "no-store");
    res.type("html");
    return res.send(html);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const wantsHtml = String(req.headers?.accept || "").includes("text/html");
    if (!wantsHtml) {
      return respondError(res, error, 400);
    }

    const esc = (value) => String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const hints = [];
    const lower = String(message || "").toLowerCase();
    const redirectUri = String(getAtlassianConfigSummary(atlassianPolicy)?.redirectUri || "").trim();
    if (lower.includes("oauth state") || (lower.includes("state") && lower.includes("expired"))) {
      hints.push("This OAuth link is one-time and expires quickly (about 12 minutes) and also resets if Asolaria restarts. Start OAuth again to generate a fresh link.");
    }
    if (lower.includes("invalid_client")) {
      hints.push("Double-check the Atlassian OAuth client ID/secret (Atlassian Developer Console -> Authorization).");
    }
    if (redirectUri && (lower.includes("redirect") || lower.includes("callback"))) {
      hints.push(`Ensure the Atlassian app callback URL includes: <code>${esc(redirectUri)}</code>.`);
    }
    if (lower.includes("invalid_scope") || lower.includes("scope")) {
      hints.push("Ensure Jira/Confluence scopes are added in Atlassian Developer Console and then re-run OAuth to re-consent.");
    }
    hints.push("After changing Atlassian app settings, re-run OAuth start to generate a fresh link.");

    const hintHtml = hints.length
      ? `<h3>What to do</h3><ul>${hints.map((h) => `<li>${h}</li>`).join("")}</ul>`
      : "";

    const html = [
      "<!doctype html>",
      "<html><head><meta charset=\"utf-8\" />",
      "<title>Asolaria Atlassian Auth (Error)</title>",
      "<style>body{font-family:system-ui,Segoe UI,Arial,sans-serif;padding:24px;line-height:1.4}code{background:#f3f3f3;padding:2px 6px;border-radius:4px}li{margin:6px 0}</style>",
      "</head><body>",
      "<h2>Atlassian auth failed</h2>",
      `<p><b>Error:</b> <code>${esc(message)}</code></p>`,
      hintHtml,
      "<p>You can close this tab and return to Asolaria.</p>",
      "</body></html>"
    ].join("");
    res.setHeader("Cache-Control", "no-store");
    res.status(400);
    res.type("html");
    return res.send(html);
  }
});

app.get("/hubspot/oauth/callback", async (req, res) => {
  try {
    if (!isLoopbackRequest(req)) {
      return respondError(res, "HubSpot OAuth callback is only allowed from local loopback.", 403);
    }
    const result = await completeHubSpotOAuthCallback({
      code: req.query?.code,
      state: req.query?.state
    });

    const esc = (value) => String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const html = [
      "<!doctype html>",
      "<html><head><meta charset=\"utf-8\" />",
      "<title>Asolaria HubSpot Auth</title>",
      "<style>body{font-family:system-ui,Segoe UI,Arial,sans-serif;padding:24px;line-height:1.4}code{background:#f3f3f3;padding:2px 6px;border-radius:4px}</style>",
      "</head><body>",
      "<h2>HubSpot account connected</h2>",
      `<p>Portal ID: <code>${esc(result.portalId || "")}</code></p>`,
      `<p>User: <code>${esc(result.user || "unknown")}</code></p>`,
      `<p>Hub domain: <code>${esc(result.hubDomain || "unknown")}</code></p>`,
      `<p>Expires: <code>${esc(result.expiresAt || "unknown")}</code></p>`,
      `<p>Refresh token: <code>${result.hasRefreshToken ? "yes" : "no"}</code></p>`,
      "<p>You can close this tab and return to Asolaria.</p>",
      "</body></html>"
    ].join("");
    res.setHeader("Cache-Control", "no-store");
    res.type("html");
    return res.send(html);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const wantsHtml = String(req.headers?.accept || "").includes("text/html");
    if (!wantsHtml) {
      return respondError(res, error, 400);
    }

    const esc = (value) => String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const hints = [];
    const lower = String(message || "").toLowerCase();
    if (lower.includes("oauth state") || (lower.includes("state") && lower.includes("expired"))) {
      hints.push("This OAuth link is one-time and expires quickly (about 12 minutes) and also resets if Asolaria restarts. Start OAuth again to generate a fresh link.");
    }
    if (lower.includes("invalid_client")) {
      hints.push("Double-check the HubSpot OAuth client ID/secret (HubSpot Developer -> MCP Auth Apps).");
    }
    if (lower.includes("redirect") || lower.includes("callback")) {
      hints.push(`Ensure HubSpot app redirect URL is: <code>${esc("http://127.0.0.1:4781/api/integrations/hubspot/oauth/callback")}</code>.`);
    }
    hints.push("After changing HubSpot app settings, re-run OAuth start to generate a fresh link.");

    const hintHtml = hints.length
      ? `<h3>What to do</h3><ul>${hints.map((h) => `<li>${h}</li>`).join("")}</ul>`
      : "";

    const html = [
      "<!doctype html>",
      "<html><head><meta charset=\"utf-8\" />",
      "<title>Asolaria HubSpot Auth (Error)</title>",
      "<style>body{font-family:system-ui,Segoe UI,Arial,sans-serif;padding:24px;line-height:1.4}code{background:#f3f3f3;padding:2px 6px;border-radius:4px}li{margin:6px 0}</style>",
      "</head><body>",
      "<h2>HubSpot auth failed</h2>",
      `<p><b>Error:</b> <code>${esc(message)}</code></p>`,
      hintHtml,
      "<p>You can close this tab and return to Asolaria.</p>",
      "</body></html>"
    ].join("");
    res.setHeader("Cache-Control", "no-store");
    res.status(400);
    res.type("html");
    return res.send(html);
  }
});

  return router;
}

module.exports = createRemainingIntegrationsRouter;
