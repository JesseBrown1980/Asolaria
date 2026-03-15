/**
 * Integration Operations Routes — extracted from server.js (ADR-0001 Phase 3)
 * Job dispatches, service lifecycle, and data access for integrations.
 */
const express = require("express");
const router = express.Router();
const { asBool, respondError, inferHttpStatusForError } = require("../lib/helpers");
const { requirePermission } = require("../middleware/auth");
const { evaluateGuardianGuard } = require("../lib/guardian");

function guardedAction(name, action, source, fn) {
  return async (req, res) => {
    try {
      const guardian = await evaluateGuardianGuard({
        message: `${name} request`, routed: { action }, source
      });
      if (guardian.triggered && guardian.blocked) {
        const hint = guardian.approvalRequest?.id ? ` Approval ID ${guardian.approvalRequest.id}.` : "";
        return respondError(res, `Guardian blocked ${name} (${guardian.risk.level}). ${guardian.decision?.text || ""}${hint}`.trim(), 403);
      }
      const result = await fn(req);
      return res.json({ ok: true, guardian, ...result });
    } catch (error) { return respondError(res, error, inferHttpStatusForError(error, 400)); }
  };
}

function createIntegrationOpsRouter(ctx) {

  // Symphony submit
  router.post("/symphony/submit", requirePermission("admin"), async (req, res) => {
    try {
      const body = req.body || {};
      const title = String(body.title || body.summary || "").trim();
      const objective = String(body.objective || body.description || "").trim();
      if (!title && !objective) return respondError(res, "Symphony submission requires a title or objective.", 400);
      const submission = await ctx.submitSymphonyWorkItem({
        title, objective, instructions: String(body.instructions || "").trim(),
        allowedPaths: Array.isArray(body.allowedPaths) ? body.allowedPaths : body.paths,
        expectedArtifacts: Array.isArray(body.expectedArtifacts) ? body.expectedArtifacts : body.artifacts,
        taskType: String(body.taskType || "long_running").trim(),
        sensitivity: String(body.sensitivity || "internal").trim(),
        size: String(body.size || "medium").trim(),
        taskId: String(body.taskId || "").trim(),
        dispatchId: String(body.dispatchId || "").trim(),
        ensureService: asBool(body.ensureService, true)
      });
      return res.json({ ok: true, submission });
    } catch (error) { return respondError(res, error, inferHttpStatusForError(error, 400)); }
  });

  // Symphony lifecycle
  router.post("/symphony/start", requirePermission("admin"),
    guardedAction("Symphony start", "symphony_start", "api.integrations.symphony.start",
      async () => ({ status: ctx.startSymphonyService() })));

  router.post("/symphony/stop", requirePermission("admin"),
    guardedAction("Symphony stop", "symphony_stop", "api.integrations.symphony.stop",
      async () => ({ status: ctx.stopSymphonyService() })));

  router.post("/symphony/restart", requirePermission("admin"),
    guardedAction("Symphony restart", "symphony_restart", "api.integrations.symphony.restart",
      async () => ({ status: ctx.restartSymphonyService() })));

  // Abacus packet detail
  router.get("/abacus/packets/:id", (req, res) => {
    try {
      return res.json({ ok: true, packet: ctx.getAbacusWorkPacket(String(req.params.id || "").trim()) });
    } catch (error) { return respondError(res, error, inferHttpStatusForError(error, 404)); }
  });

  // Gemini API embed
  if (ctx.runGeminiApiEmbedContent) {
    router.post("/gemini_api/embed", requirePermission("admin"), async (req, res) => {
      try {
        const result = await ctx.runGeminiApiEmbedContent({
          model: req.body?.model, taskType: req.body?.taskType,
          outputDimensionality: req.body?.outputDimensionality,
          content: req.body?.content, contents: req.body?.contents,
          items: req.body?.items, parts: req.body?.parts,
          title: req.body?.title, text: req.body?.text,
          prompt: req.body?.prompt, message: req.body?.message
        }, ctx.geminiApiPolicy);
        return res.json({
          ok: true, result: {
            model: result.model, taskType: result.taskType,
            outputDimensionality: result.outputDimensionality,
            count: Array.isArray(result.embeddings) ? result.embeddings.length : 0,
            dimensions: Array.isArray(result.embeddings?.[0]) ? result.embeddings[0].length : 0,
            embeddings: result.embeddings
          }
        });
      } catch (error) { return respondError(res, error, 400); }
    });
  }

  // Gmail inbox
  if (ctx.enqueueGmailInbox) {
    router.get("/gmail/inbox", async (req, res) => {
      try {
        if (!ctx.googlePolicy?.enabled) return respondError(res, "Google integration is disabled by policy.", 403);
        const account = String(req.query?.account || req.query?.email || "").trim();
        const limit = asInt(req.query?.limit, 12, 1, ctx.googlePolicy.maxMessages || 50);
        const job = ctx.enqueueGmailInbox({ account, limit });
        return res.json({ ok: true, mode: "queued", reply: `Queued Gmail inbox job ${job.id}.`, job });
      } catch (error) { return respondError(res, error, 400); }
    });
  }

  // Gmail search
  if (ctx.enqueueGmailSearch) {
    router.get("/gmail/search", async (req, res) => {
      try {
        if (!ctx.googlePolicy?.enabled) return respondError(res, "Google integration is disabled by policy.", 403);
        const account = String(req.query?.account || req.query?.email || "").trim();
        const q = String(req.query?.q || req.query?.query || "").trim();
        if (!q) return respondError(res, "q is required.", 400);
        const limit = asInt(req.query?.limit, 12, 1, ctx.googlePolicy.maxMessages || 50);
        const job = ctx.enqueueGmailSearch({ account, q, limit });
        return res.json({ ok: true, mode: "queued", reply: `Queued Gmail search job ${job.id}.`, job });
      } catch (error) { return respondError(res, error, 400); }
    });
  }

  // Calendar list
  if (ctx.enqueueCalendarList) {
    router.get("/calendar/list", async (req, res) => {
      try {
        if (!ctx.googlePolicy?.enabled) return respondError(res, "Google integration is disabled by policy.", 403);
        const account = String(req.query?.account || req.query?.email || "").trim();
        const limit = asInt(req.query?.limit, 50, 1, 250);
        const job = ctx.enqueueCalendarList({ account, limit });
        return res.json({ ok: true, mode: "queued", reply: `Queued Calendar list job ${job.id}.`, job });
      } catch (error) { return respondError(res, error, 400); }
    });
  }

  // Calendar upcoming
  if (ctx.enqueueCalendarUpcoming) {
    router.get("/calendar/upcoming", async (req, res) => {
      try {
        if (!ctx.googlePolicy?.enabled) return respondError(res, "Google integration is disabled by policy.", 403);
        const account = String(req.query?.account || req.query?.email || "").trim();
        const calendarId = String(req.query?.calendarId || "primary").trim() || "primary";
        const days = asInt(req.query?.days, 7, 1, 60);
        const limit = asInt(req.query?.limit, 20, 1, ctx.googlePolicy.maxCalendarEvents || 100);
        const job = ctx.enqueueCalendarUpcoming({ account, calendarId, days, limit });
        return res.json({ ok: true, mode: "queued", reply: `Queued Calendar upcoming job ${job.id}.`, job });
      } catch (error) { return respondError(res, error, 400); }
    });
  }

  return router;
}

module.exports = createIntegrationOpsRouter;
