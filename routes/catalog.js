"use strict";

const express = require("express");
const { requireMobileAuth } = require("../lib/mobileAuth");
const {
  listSelectorCategories,
  listSelectorProfiles,
  listSelectorAccessLevels,
  listResolvedSelectors,
  getResolvedSelector,
  summarizeSelectorCatalog,
  dryRunSelectorApplication
} = require("../src/selectorCatalogRegistry");
const {
  listTumblerProfiles,
  summarizeTumblerState,
  acquireTumblerLease,
  releaseTumblerLease
} = require("../src/modelLaneTumbler");
const { resolveCurrentDeploymentLane } = require("../src/deploymentLaneRuntime");
const { buildSelectorPacket, dispatchSelectorPacket } = require("../src/selectorPacketLanguage");

function createCatalogRouter(ctx) {
  const router = express.Router();
  const {
    respondError,
    inferHttpStatusForError,
    getWorkOrgPolicySummary,
    getConnectionRoutingState,
    publishMqttMessage
  } = ctx;

  function buildSelectorContext() {
    return {
      getWorkOrgPolicySummary,
      getConnectionRoutingState
    };
  }

  router.get("/summary", requireMobileAuth, (_req, res) => {
    try {
      return res.json({
        ok: true,
        catalog: summarizeSelectorCatalog(buildSelectorContext()),
        tumblers: summarizeTumblerState(),
        deployment: resolveCurrentDeploymentLane()
      });
    } catch (error) {
      return respondError(res, error, inferHttpStatusForError(error, 500));
    }
  });

  router.get("/deployment/status", requireMobileAuth, (_req, res) => {
    try {
      return res.json({
        ok: true,
        deployment: resolveCurrentDeploymentLane()
      });
    } catch (error) {
      return respondError(res, error, inferHttpStatusForError(error, 500));
    }
  });

  router.get("/categories", requireMobileAuth, (_req, res) => {
    try {
      return res.json({
        ok: true,
        categories: listSelectorCategories()
      });
    } catch (error) {
      return respondError(res, error, inferHttpStatusForError(error, 500));
    }
  });

  router.get("/profiles", requireMobileAuth, (_req, res) => {
    try {
      return res.json({
        ok: true,
        profiles: listSelectorProfiles()
      });
    } catch (error) {
      return respondError(res, error, inferHttpStatusForError(error, 500));
    }
  });

  router.get("/access-levels", requireMobileAuth, (_req, res) => {
    try {
      return res.json({
        ok: true,
        accessLevels: listSelectorAccessLevels()
      });
    } catch (error) {
      return respondError(res, error, inferHttpStatusForError(error, 500));
    }
  });

  router.get("/selectors", requireMobileAuth, (req, res) => {
    try {
      return res.json({
        ok: true,
        selectors: listResolvedSelectors(buildSelectorContext(), {
          category: req.query?.category,
          accessLevel: req.query?.accessLevel,
          selectorKind: req.query?.selectorKind || req.query?.kind
        })
      });
    } catch (error) {
      return respondError(res, error, inferHttpStatusForError(error, 500));
    }
  });

  router.get("/selectors/:id", requireMobileAuth, (req, res) => {
    try {
      const selector = getResolvedSelector(buildSelectorContext(), req.params.id);
      if (!selector) {
        return respondError(res, `Unknown selector "${req.params.id}".`, 404);
      }
      return res.json({
        ok: true,
        selector
      });
    } catch (error) {
      return respondError(res, error, inferHttpStatusForError(error, 500));
    }
  });

  router.post("/selectors/:id/dry-run", requireMobileAuth, (req, res) => {
    try {
      const result = dryRunSelectorApplication(buildSelectorContext(), req.params.id, req.body || {});
      if (!result) {
        return respondError(res, `Unknown selector "${req.params.id}".`, 404);
      }
      return res.json({
        ok: true,
        dryRun: result
      });
    } catch (error) {
      return respondError(res, error, inferHttpStatusForError(error, 500));
    }
  });

  router.get("/tumblers", requireMobileAuth, (_req, res) => {
    try {
      return res.json({
        ok: true,
        profiles: listTumblerProfiles(),
        state: summarizeTumblerState()
      });
    } catch (error) {
      return respondError(res, error, inferHttpStatusForError(error, 500));
    }
  });

  router.post("/tumblers/acquire", requireMobileAuth, (req, res) => {
    try {
      return res.json({
        ok: true,
        result: acquireTumblerLease(req.body || {})
      });
    } catch (error) {
      return respondError(res, error, inferHttpStatusForError(error, 400));
    }
  });

  router.post("/selectors/:id/packet", requireMobileAuth, (req, res) => {
    try {
      const result = buildSelectorPacket(buildSelectorContext(), req.params.id, req.body || {});
      return res.json(result);
    } catch (error) {
      return respondError(res, error, inferHttpStatusForError(error, 400));
    }
  });

  router.post("/selectors/:id/dispatch", requireMobileAuth, async (req, res) => {
    try {
      const result = await dispatchSelectorPacket(
        buildSelectorContext(),
        req.params.id,
        req.body || {},
        { publishMqttMessage }
      );
      return res.json(result);
    } catch (error) {
      return respondError(res, error, inferHttpStatusForError(error, 400));
    }
  });

  router.post("/tumblers/release", requireMobileAuth, (req, res) => {
    try {
      return res.json({
        ok: true,
        result: releaseTumblerLease(req.body?.leaseId || req.body?.id || "")
      });
    } catch (error) {
      return respondError(res, error, inferHttpStatusForError(error, 400));
    }
  });

  return router;
}

module.exports = createCatalogRouter;
