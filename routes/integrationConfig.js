/**
 * Integration Config Routes — extracted from server.js (ADR-0001 Phase 3)
 * POST config endpoints for all integrations that follow the guardian pattern.
 * All require loopback + admin permission.
 */
const express = require("express");
const router = express.Router();
const { asBool, respondError, inferHttpStatusForError } = require("../lib/helpers");
const { requirePermission } = require("../middleware/auth");
const { evaluateGuardianGuard } = require("../lib/guardian");
const { isLoopbackRequest } = require("../lib/network");

function guardedConfig(configName, configFn) {
  return async (req, res) => {
    try {
      if (!isLoopbackRequest(req)) {
        return respondError(res, `${configName} configuration is only allowed from local loopback.`, 403);
      }
      const clear = asBool(req.body?.clear, false);
      const guardian = await evaluateGuardianGuard({
        message: clear ? `${configName} settings clear request` : `${configName} settings update request`,
        routed: { action: `${configName.toLowerCase().replace(/\s+/g, "_")}_config` },
        source: `api.integrations.${configName.toLowerCase().replace(/\s+/g, "_")}.config`
      });
      if (guardian.triggered && guardian.blocked) {
        const hint = guardian.approvalRequest?.id
          ? ` Approval ID ${guardian.approvalRequest.id}. Use APPROVE ${guardian.approvalRequest.id} to allow once.`
          : "";
        return respondError(res, `Guardian blocked ${configName} config update (${guardian.risk.level}). ${guardian.decision?.text || ""}${hint}`.trim(), 403);
      }
      const config = await configFn(req, { clear });
      return res.json({ ok: true, config, guardian });
    } catch (error) {
      return respondError(res, error, inferHttpStatusForError(error, 400));
    }
  };
}

function createIntegrationConfigRouter(ctx) {
  // Slack
  router.post("/slack/config", requirePermission("admin"), guardedConfig("Slack", async (req, { clear }) => {
    return ctx.setSlackConfig({
      clear, botToken: String(req.body?.botToken || req.body?.token || "").trim(),
      defaultChannel: String(req.body?.defaultChannel || "").trim()
    });
  }));

  // GitHub
  router.post("/github/config", requirePermission("admin"), guardedConfig("GitHub", async (req, { clear }) => {
    return ctx.setGithubConfig({
      clear, token: String(req.body?.token || req.body?.pat || req.body?.apiKey || "").trim(),
      baseUrl: String(req.body?.baseUrl || req.body?.apiBaseUrl || "").trim(),
      defaultOwner: String(req.body?.defaultOwner || "").trim(),
      defaultRepo: String(req.body?.defaultRepo || "").trim()
    });
  }));

  // MQTT config stays inline in server.js — complex field parsing + syncMqttBridge call

  // Vertex
  router.post("/vertex/config", requirePermission("admin"), async (req, res) => {
    try {
      if (!isLoopbackRequest(req)) return respondError(res, "Vertex integration configuration is only allowed from local loopback.", 403);
      if (!ctx.vertexPolicy?.enabled) return respondError(res, "Vertex integration is disabled by policy.", 403);
      const clear = asBool(req.body?.clear, false);
      const guardian = await evaluateGuardianGuard({
        message: clear ? "Vertex integration settings clear request" : "Vertex integration settings update request",
        routed: { action: "vertex_config" }, source: "api.integrations.vertex.config"
      });
      if (guardian.triggered && guardian.blocked) {
        const hint = guardian.approvalRequest?.id ? ` Approval ID ${guardian.approvalRequest.id}.` : "";
        return respondError(res, `Guardian blocked Vertex config (${guardian.risk.level}). ${guardian.decision?.text || ""}${hint}`.trim(), 403);
      }
      const config = ctx.setVertexConfig({
        clear,
        enabled: req.body?.enabled === undefined ? undefined : asBool(req.body?.enabled, true),
        project: String(req.body?.project || req.body?.defaultProject || req.body?.projectId || "").trim(),
        location: String(req.body?.location || "").trim(),
        model: String(req.body?.model || "").trim()
      });
      return res.json({ ok: true, config, guardian });
    } catch (error) { return respondError(res, error, 400); }
  });

  return router;
}

module.exports = createIntegrationConfigRouter;
