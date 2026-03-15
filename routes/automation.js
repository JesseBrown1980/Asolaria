/**
 * Automation Routes — extracted from server.js (ADR-0001 Phase 3)
 * Model audit and brain leader status + operations.
 */
const express = require("express");
const router = express.Router();
const { asBool, respondError, inferHttpStatusForError } = require("../lib/helpers");
const { requirePermission } = require("../middleware/auth");

function createAutomationRouter(ctx) {
  router.get("/model-audit/status", (_req, res) => {
    res.json({ ok: true, modelAudit: ctx.getModelAuditRuntimeSummary() });
  });

  router.post("/model-audit/run", requirePermission("admin"), async (req, res) => {
    try {
      const reason = String(req.body?.reason || "manual_api").trim() || "manual_api";
      const result = await ctx.runModelAuditJob({ reason });
      if (asBool(req.body?.rearmScheduler, true)) {
        ctx.syncModelAuditScheduler({ reason: "manual_run_rearm", log: false });
      }
      return res.json({ ok: Boolean(result?.ok), result, modelAudit: ctx.getModelAuditRuntimeSummary() });
    } catch (error) { return respondError(res, error, inferHttpStatusForError(error, 500)); }
  });

  router.get("/brain-leader/status", (_req, res) => {
    return res.json({ ok: true, brainLeader: ctx.getBrainLeaderRuntimeSummary() });
  });

  return router;
}

module.exports = createAutomationRouter;
