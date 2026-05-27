const express = require("express");
const router = express.Router();
const { requirePermission } = require("../middleware/auth");
const { asInt, respondError, inferHttpStatusForError } = require("../lib/helpers");
const {
  getSharedComputeStatus,
  getSharedComputeWorkers,
  dispatchSharedComputeJob,
  listSharedComputeJobs,
  getSharedComputeJob
} = require("../src/sharedComputeFabric");
const { getMqttConfigSummary } = require("../src/connectors/mqttConnector");

function createSharedComputeRouter(_ctx = {}) {
  router.get("/status", (_req, res) => {
    try {
      const mqtt = getMqttConfigSummary();
      return res.json({
        ok: true,
        status: getSharedComputeStatus({
          baseTopic: mqtt.baseTopic
        })
      });
    } catch (error) {
      return respondError(res, error, inferHttpStatusForError(error, 500));
    }
  });

  router.get("/workers", (_req, res) => {
    try {
      const mqtt = getMqttConfigSummary();
      return res.json({
        ok: true,
        workers: getSharedComputeWorkers({
          baseTopic: mqtt.baseTopic
        })
      });
    } catch (error) {
      return respondError(res, error, inferHttpStatusForError(error, 500));
    }
  });

  router.get("/jobs", (_req, res) => {
    try {
      const limit = asInt(_req.query?.limit, 25, 1, 100);
      return res.json({
        ok: true,
        jobs: listSharedComputeJobs(limit)
      });
    } catch (error) {
      return respondError(res, error, inferHttpStatusForError(error, 500));
    }
  });

  router.get("/jobs/:id", (_req, res) => {
    try {
      const job = getSharedComputeJob(String(_req.params.id || "").trim());
      if (!job) {
        return respondError(res, "Shared compute job not found.", 404);
      }
      return res.json({
        ok: true,
        job
      });
    } catch (error) {
      return respondError(res, error, inferHttpStatusForError(error, 404));
    }
  });

  router.post("/dispatch", requirePermission("write"), async (req, res) => {
    try {
      const job = await dispatchSharedComputeJob(req.body || {}, {
        publishMqttMessage: _ctx.publishMqttMessage
      });
      return res.json({
        ok: true,
        job
      });
    } catch (error) {
      return respondError(res, error, inferHttpStatusForError(error, 400));
    }
  });

  return router;
}

module.exports = createSharedComputeRouter;
