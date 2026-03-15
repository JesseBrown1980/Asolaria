/**
 * Company / Moltbook Account Routes — extracted from server.js (ADR-0001 Phase 3)
 */
const express = require("express");
const router = express.Router();
const { asBool, respondError, inferHttpStatusForError } = require("../lib/helpers");
const { requirePermission } = require("../middleware/auth");
const { isLoopbackRequest } = require("../lib/network");
const { evaluateGuardianGuard } = require("../lib/guardian");

function createCompanyRouter(ctx) {
  const {
    buildCompanyMissionPayload, buildCompanyPrimarySigninSummaryPayload,
    getCompanyPrimarySigninSummary,
    migrateLegacyCompanyPrimarySigninSecret, updateCompanyPrimarySignin,
    bootstrapCompanyPrimarySignin, markCompanyPrimarySigninRegistered,
    revealCompanyPrimarySignin
  } = ctx;

  // GET — mission & account summaries (aliases for both company and moltbook)
  router.get("/company/mission", (_req, res) => { res.json(buildCompanyMissionPayload()); });
  router.get("/moltbook/mission", (_req, res) => { res.json(buildCompanyMissionPayload()); });
  router.get("/company/account", (_req, res) => { res.json(buildCompanyPrimarySigninSummaryPayload()); });
  router.get("/company/primary-signin", (_req, res) => { res.json(buildCompanyPrimarySigninSummaryPayload()); });
  router.get("/moltbook/account", (_req, res) => { res.json(buildCompanyPrimarySigninSummaryPayload()); });

  // POST — guarded mutations
  router.post("/company/primary-signin/migrate-legacy", requirePermission("admin"), async (req, res) => {
    try {
      if (!isLoopbackRequest(req)) return respondError(res, "Company credential migration is only allowed from local loopback.", 403);
      const deleteLegacy = asBool(req.body?.deleteLegacy, true);
      const guardian = await evaluateGuardianGuard({
        message: `Company primary sign-in migration request (deleteLegacy=${deleteLegacy}).`,
        routed: { action: "company_primary_signin_migrate_legacy" },
        source: "api.company.primary_signin.migrate_legacy"
      });
      if (guardian.triggered && guardian.blocked) {
        const hint = guardian.approvalRequest?.id ? ` Approval ID ${guardian.approvalRequest.id}.` : "";
        return respondError(res, `Guardian blocked (${guardian.risk.level}). ${guardian.decision?.text || ""}${hint}`.trim(), 403);
      }
      const result = migrateLegacyCompanyPrimarySigninSecret({ deleteLegacy });
      return res.json({ ok: true, result, ...getCompanyPrimarySigninSummary(), guardian });
    } catch (error) { return respondError(res, error, inferHttpStatusForError(error, 400)); }
  });

  router.post("/company/primary-signin/update", requirePermission("admin"), async (req, res) => {
    try {
      if (!isLoopbackRequest(req)) return respondError(res, "Company credential updates are only allowed from local loopback.", 403);
      const body = req.body || {};
      const guardian = await evaluateGuardianGuard({
        message: "Company primary sign-in update request.",
        routed: { action: "company_primary_signin_update" },
        source: "api.company.primary_signin.update"
      });
      if (guardian.triggered && guardian.blocked) {
        const hint = guardian.approvalRequest?.id ? ` Approval ID ${guardian.approvalRequest.id}.` : "";
        return respondError(res, `Guardian blocked (${guardian.risk.level}). ${guardian.decision?.text || ""}${hint}`.trim(), 403);
      }
      const account = updateCompanyPrimarySignin({
        portal: body.portal, accountType: body.accountType, displayName: body.displayName,
        label: body.label, username: body.username, email: body.email, password: body.password,
        excludes: body.excludes, profileUrl: body.profileUrl, notes: body.notes, status: body.status
      });
      return res.json({ ok: true, account, ...getCompanyPrimarySigninSummary(), guardian });
    } catch (error) { return respondError(res, error, inferHttpStatusForError(error, 400)); }
  });

  router.post("/company/primary-signin/bootstrap", requirePermission("admin"), (req, res) => {
    try {
      const result = bootstrapCompanyPrimarySignin(req.body || {});
      return res.json({ ok: true, ...result, ...getCompanyPrimarySigninSummary() });
    } catch (error) { return respondError(res, error, 400); }
  });

  router.post("/moltbook/account/bootstrap", requirePermission("admin"), (req, res) => {
    try {
      if (!isLoopbackRequest(req)) return respondError(res, "Company profile bootstrap is only allowed from local loopback.", 403);
      const account = bootstrapCompanyPrimarySignin(req.body || {});
      return res.json({ ok: true, account });
    } catch (error) { return respondError(res, error, 400); }
  });

  router.post("/moltbook/account/update", requirePermission("admin"), (req, res) => {
    try {
      if (!isLoopbackRequest(req)) return respondError(res, "Company profile updates are only allowed from local loopback.", 403);
      const account = updateCompanyPrimarySignin(req.body || {});
      return res.json({ ok: true, account });
    } catch (error) { return respondError(res, error, 400); }
  });

  router.post("/company/primary-signin/mark-registered", requirePermission("admin"), (req, res) => {
    try {
      const result = markCompanyPrimarySigninRegistered(req.body || {});
      return res.json({ ok: true, ...result });
    } catch (error) { return respondError(res, error, 400); }
  });

  router.post("/moltbook/account/mark-registered", requirePermission("admin"), (req, res) => {
    try {
      if (!isLoopbackRequest(req)) return respondError(res, "Company profile updates are only allowed from local loopback.", 403);
      const account = markCompanyPrimarySigninRegistered(req.body || {});
      return res.json({ ok: true, account });
    } catch (error) { return respondError(res, error, 400); }
  });

  router.post("/company/primary-signin/reveal", requirePermission("admin"), (req, res) => {
    try { return res.json({ ok: true, ...revealCompanyPrimarySignin(req.body || {}) }); }
    catch (error) { return respondError(res, error, 400); }
  });

  router.post("/moltbook/account/reveal", requirePermission("admin"), (req, res) => {
    try { return res.json({ ok: true, ...revealCompanyPrimarySignin(req.body || {}) }); }
    catch (error) { return respondError(res, error, 400); }
  });

  return router;
}

module.exports = createCompanyRouter;
