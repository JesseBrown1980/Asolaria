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

  return router;
}

module.exports = createIntegrationOpsRouter;
