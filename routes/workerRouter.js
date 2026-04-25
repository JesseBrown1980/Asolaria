/**
 * Worker Router Routes — extracted from server.js (ADR-0001 strangler-fig)
 */
const express = require("express");
const router = express.Router();
const { asInt, respondError, inferHttpStatusForError } = require("../lib/helpers");
const { requirePermission } = require("../middleware/auth");
const {
  getWorkerRouterStatus, listWorkerDispatches, getWorkerDispatch,
  recommendWorker, dispatchWorkerTask, getWorkerRouterSelfBuildPosture
} = require("../src/connectors/workerRouter");
const {
  buildOriginalHermesTransportRouterSnapshot
} = require("../src/behcs/originalHermesTransportRouter");
const {
  buildOriginalHermesLearningLoopSnapshot
} = require("../src/behcs/originalHermesLearningLoop");
const {
  buildOriginalHermesWalStateSnapshot
} = require("../src/behcs/originalHermesWalState");
const {
  buildOriginalHermesSecurityBackportSnapshot
} = require("../src/behcs/originalHermesSecurityBackport");
const {
  buildOriginalHermesRuntimeIndex
} = require("../src/behcs/originalHermesRuntimeIndex");

router.get("/status", (_req, res) => {
  try {
    return res.json({ ok: true, status: getWorkerRouterStatus() });
  } catch (error) { return respondError(res, error, inferHttpStatusForError(error, 500)); }
});

router.get("/self-build", (_req, res) => {
  try {
    return res.json({ ok: true, selfBuild: getWorkerRouterSelfBuildPosture() });
  } catch (error) { return respondError(res, error, inferHttpStatusForError(error, 500)); }
});

router.get("/original-hermes-transport-contract", (_req, res) => {
  try {
    const workerRouterStatus = getWorkerRouterStatus();
    return res.json({
      ok: true,
      snapshot: buildOriginalHermesTransportRouterSnapshot({ workerRouterStatus })
    });
  } catch (error) { return respondError(res, error, inferHttpStatusForError(error, 500)); }
});

router.get("/original-hermes-runtime-index", (req, res) => {
  try {
    return res.json({
      ok: true,
      snapshot: buildOriginalHermesRuntimeIndex({
        workerRouterStatus: getWorkerRouterStatus(),
        learningLimit: asInt(req.query?.learningLimit, 24, 1, 100)
      })
    });
  } catch (error) { return respondError(res, error, inferHttpStatusForError(error, 500)); }
});

router.get("/original-hermes-learning-loop", (req, res) => {
  try {
    return res.json({
      ok: true,
      snapshot: buildOriginalHermesLearningLoopSnapshot({
        limit: asInt(req.query?.limit, 24, 1, 100)
      })
    });
  } catch (error) { return respondError(res, error, inferHttpStatusForError(error, 500)); }
});

router.get("/original-hermes-wal-state-contract", (_req, res) => {
  try {
    return res.json({
      ok: true,
      snapshot: buildOriginalHermesWalStateSnapshot()
    });
  } catch (error) { return respondError(res, error, inferHttpStatusForError(error, 500)); }
});

router.get("/original-hermes-security-backport", (_req, res) => {
  try {
    return res.json({
      ok: true,
      snapshot: buildOriginalHermesSecurityBackportSnapshot()
    });
  } catch (error) { return respondError(res, error, inferHttpStatusForError(error, 500)); }
});

router.get("/dispatches", (req, res) => {
  try {
    const limit = asInt(req.query?.limit, 25, 1, 200);
    return res.json({ ok: true, dispatches: listWorkerDispatches(limit) });
  } catch (error) { return respondError(res, error, inferHttpStatusForError(error, 500)); }
});

router.get("/dispatches/:id", (req, res) => {
  try {
    const dispatch = getWorkerDispatch(String(req.params.id || "").trim());
    if (!dispatch) return respondError(res, "Worker dispatch not found.", 404);
    return res.json({ ok: true, dispatch });
  } catch (error) { return respondError(res, error, inferHttpStatusForError(error, 404)); }
});

router.post("/recommend", requirePermission("write"), (req, res) => {
  try {
    return res.json({ ok: true, recommendation: recommendWorker(req.body || {}) });
  } catch (error) { return respondError(res, error, inferHttpStatusForError(error, 400)); }
});

router.post("/dispatch", requirePermission("write"), async (req, res) => {
  try {
    const dispatch = await dispatchWorkerTask(req.body || {});
    return res.json({ ok: true, dispatch });
  } catch (error) { return respondError(res, error, inferHttpStatusForError(error, 400)); }
});

module.exports = router;
