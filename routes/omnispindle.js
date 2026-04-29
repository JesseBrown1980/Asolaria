/**
 * Omnispindle Routes — extracted from server.js (ADR-0001 strangler-fig)
 *
 * Routes:
 *   GET  /status                    — get omnispindle status
 *   POST /start                     — start all or specific lanes
 *   POST /stop                      — stop all lanes
 *   POST /agent/:laneId/start       — start specific lane
 *   POST /agent/:laneId/stop        — stop specific lane
 *   POST /agent/:laneId/prompt      — send prompt to lane
 *   POST /agent/:laneId/dispatch    — launch bounded Falcon child for a supported agent type
 *   POST /agent/:laneId/opencode/dispatch — launch bounded OpenCode child
 *   GET  /agent/:laneId/children    — inspect lane child fan-out
 *   GET  /coupling/status           — inspect Omniflywheel coupling layer
 *   POST /coupling/configure        — configure coupled/stateless mode under GAC token
 *   GET  /cascade/status            — inspect deep-wave cascade/resource posture
 *   GET  /cascade/guard             — inspect task-manager-aware GC/file-cap guard posture
 *   GET  /cascade/self-build        — inspect self-build controller posture bound to cascade
 *   POST /broadcast                 — broadcast to all lanes
 */

const express = require("express");
const router = express.Router();

const { getOmnispindle, LANE_DEFINITIONS } = require("../src/omnispindle");
const { requirePermission } = require("../middleware/auth");

const VALID_LANE_IDS = Object.keys(LANE_DEFINITIONS);

function envFlag(name) {
  return String(process.env[name] || "").trim() === "1";
}

function processExecutionHold(feature, enableWith) {
  return {
    ok: false,
    held: true,
    preview: true,
    feature,
    reason: `${feature}_disabled`,
    enableWith
  };
}

function createOmnispindleRouter({ resolveToolPaths, respondError, serverDir }) {

  router.get("/status", (_req, res) => {
    try {
      const omnispindle = getOmnispindle({
        executable: resolveToolPaths().claudePath || "claude",
        workingDir: serverDir
      });
      return res.json({ ok: true, ...omnispindle.getStatus() });
    } catch (error) {
      return respondError(res, error, 500);
    }
  });

  router.post("/start", requirePermission("admin"), (req, res) => {
    try {
      if (!envFlag("ASOLARIA_OMNISPINDLE_PROCESS_EXECUTION_ENABLED")) {
        return res.status(403).json(processExecutionHold("omnispindle_process_execution", "ASOLARIA_OMNISPINDLE_PROCESS_EXECUTION_ENABLED=1"));
      }
      const lanes = req.body?.lanes || null;
      const model = String(req.body?.model || "").trim();
      const maxBudgetUsd = Number(req.body?.maxBudgetUsd) || 0;
      const omnispindle = getOmnispindle({
        executable: resolveToolPaths().claudePath || "claude",
        workingDir: serverDir,
        model,
        maxBudgetUsd
      });
      if (model) omnispindle.model = model;
      if (maxBudgetUsd > 0) omnispindle.maxBudgetUsd = maxBudgetUsd;
      const validLanes = Array.isArray(lanes)
        ? lanes.filter((id) => VALID_LANE_IDS.includes(String(id || "").trim().toLowerCase()))
        : null;
      const result = omnispindle.startAll(validLanes && validLanes.length > 0 ? validLanes : null);
      return res.json({ ok: true, ...result });
    } catch (error) {
      return respondError(res, error, 500);
    }
  });

  router.post("/stop", requirePermission("admin"), (_req, res) => {
    try {
      const omnispindle = getOmnispindle();
      const result = omnispindle.stopAll();
      return res.json({ ok: true, ...result });
    } catch (error) {
      return respondError(res, error, 500);
    }
  });

  router.post("/agent/:laneId/start", requirePermission("admin"), (req, res) => {
    try {
      if (!envFlag("ASOLARIA_OMNISPINDLE_PROCESS_EXECUTION_ENABLED")) {
        return res.status(403).json(processExecutionHold("omnispindle_process_execution", "ASOLARIA_OMNISPINDLE_PROCESS_EXECUTION_ENABLED=1"));
      }
      const laneId = String(req.params.laneId || "").trim().toLowerCase();
      if (!VALID_LANE_IDS.includes(laneId)) {
        return respondError(res, `Unknown lane: ${laneId}`, 400);
      }
      const omnispindle = getOmnispindle({
        executable: resolveToolPaths().claudePath || "claude",
        workingDir: serverDir
      });
      const result = omnispindle.startAgent(laneId);
      return res.json({ ok: true, laneId, ...result });
    } catch (error) {
      return respondError(res, error, 500);
    }
  });

  router.post("/agent/:laneId/stop", requirePermission("admin"), (req, res) => {
    try {
      const laneId = String(req.params.laneId || "").trim().toLowerCase();
      const omnispindle = getOmnispindle();
      const result = omnispindle.stopAgent(laneId);
      return res.json({ ok: true, laneId, ...result });
    } catch (error) {
      return respondError(res, error, 500);
    }
  });

  router.post("/agent/:laneId/prompt", requirePermission("admin"), (req, res) => {
    try {
      const laneId = String(req.params.laneId || "").trim().toLowerCase();
      const text = String(req.body?.text || req.body?.prompt || "").trim();
      if (!text) {
        return respondError(res, "Prompt text is required.", 400);
      }
      const omnispindle = getOmnispindle();
      const result = omnispindle.sendPrompt(laneId, text);
      return res.json({ ok: true, laneId, ...result });
    } catch (error) {
      return respondError(res, error, 500);
    }
  });

  router.post("/agent/:laneId/dispatch", requirePermission("admin"), (req, res) => {
    try {
      if (!envFlag("ASOLARIA_OMNISPINDLE_CHILD_EXECUTION_ENABLED")) {
        return res.status(403).json(processExecutionHold("omnispindle_child_execution", "ASOLARIA_OMNISPINDLE_CHILD_EXECUTION_ENABLED=1"));
      }
      const laneId = String(req.params.laneId || "").trim().toLowerCase();
      if (!VALID_LANE_IDS.includes(laneId)) {
        return respondError(res, `Unknown lane: ${laneId}`, 400);
      }
      const omnispindle = getOmnispindle();
      const result = omnispindle.launchChildAgent(laneId, {
        objective: req.body?.objective,
        prompt: req.body?.prompt,
        text: req.body?.text,
        instructions: req.body?.instructions,
        agentType: req.body?.agentType,
        workerId: req.body?.workerId,
        taskType: req.body?.taskType,
        size: req.body?.size,
        sensitivity: req.body?.sensitivity,
        projectScope: req.body?.projectScope,
        requiresRepoWrite: req.body?.requiresRepoWrite,
        needsCloudWorker: req.body?.needsCloudWorker,
        allowedPaths: req.body?.allowedPaths,
        expectedArtifacts: req.body?.expectedArtifacts,
        acceptanceGates: req.body?.acceptanceGates,
        proofRequired: req.body?.proofRequired,
        proofRef: req.body?.proofRef,
        pid: req.body?.pid,
        pidScope: req.body?.pidScope,
        consentScope: req.body?.consentScope,
        operatorApproval: req.body?.operatorApproval,
        syntheticFirstEvidence: req.body?.syntheticFirstEvidence,
        modelCard: req.body?.modelCard,
        providerAuthMode: req.body?.providerAuthMode,
        legitimateCliEvidence: req.body?.legitimateCliEvidence,
        freeMethod: req.body?.freeMethod,
        remoteMutation: req.body?.remoteMutation,
        externalApiCall: req.body?.externalApiCall,
        cloudUpload: req.body?.cloudUpload,
        deviceAccess: req.body?.deviceAccess,
        liveEeg: req.body?.liveEeg,
        liveHumanData: req.body?.liveHumanData,
        downloads: req.body?.downloads,
        installs: req.body?.installs,
        writesGit: req.body?.writesGit,
        deletesEvidence: req.body?.deletesEvidence,
        sensitiveData: req.body?.sensitiveData,
        secretMaterial: req.body?.secretMaterial,
        bypassAuth: req.body?.bypassAuth,
        bypassPayment: req.body?.bypassPayment,
        model: req.body?.model,
        agent: req.body?.agent,
        variant: req.body?.variant,
        files: req.body?.files,
        allowedPaths: req.body?.allowedPaths,
        expectedArtifacts: req.body?.expectedArtifacts,
        acceptanceGates: req.body?.acceptanceGates,
        proofRequired: req.body?.proofRequired,
        proofRef: req.body?.proofRef,
        pid: req.body?.pid,
        pidScope: req.body?.pidScope,
        consentScope: req.body?.consentScope,
        operatorApproval: req.body?.operatorApproval,
        syntheticFirstEvidence: req.body?.syntheticFirstEvidence,
        modelCard: req.body?.modelCard,
        providerAuthMode: req.body?.providerAuthMode,
        legitimateCliEvidence: req.body?.legitimateCliEvidence,
        freeMethod: req.body?.freeMethod,
        remoteMutation: req.body?.remoteMutation,
        externalApiCall: req.body?.externalApiCall,
        cloudUpload: req.body?.cloudUpload,
        deviceAccess: req.body?.deviceAccess,
        liveEeg: req.body?.liveEeg,
        liveHumanData: req.body?.liveHumanData,
        downloads: req.body?.downloads,
        installs: req.body?.installs,
        writesGit: req.body?.writesGit,
        deletesEvidence: req.body?.deletesEvidence,
        sensitiveData: req.body?.sensitiveData,
        secretMaterial: req.body?.secretMaterial,
        bypassAuth: req.body?.bypassAuth,
        bypassPayment: req.body?.bypassPayment,
        tokenBudget: req.body?.tokenBudget,
        ttlMs: req.body?.ttlMs,
        writeScope: req.body?.writeScope,
        labels: req.body?.labels,
        toolContract: req.body?.toolContract,
        bossChannels: req.body?.bossChannels
      });
      if (!result.ok) {
        if (result.supervisorDecision) {
          return res.status(400).json({ ok: false, laneId, ...result });
        }
        return respondError(res, result.error || "child_dispatch_failed", 400);
      }
      return res.json({ ok: true, laneId, ...result });
    } catch (error) {
      return respondError(res, error, 500);
    }
  });

  router.post("/agent/:laneId/opencode/dispatch", requirePermission("admin"), (req, res) => {
    try {
      if (!envFlag("ASOLARIA_OMNISPINDLE_CHILD_EXECUTION_ENABLED")) {
        return res.status(403).json(processExecutionHold("omnispindle_child_execution", "ASOLARIA_OMNISPINDLE_CHILD_EXECUTION_ENABLED=1"));
      }
      const laneId = String(req.params.laneId || "").trim().toLowerCase();
      if (!VALID_LANE_IDS.includes(laneId)) {
        return respondError(res, `Unknown lane: ${laneId}`, 400);
      }
      const omnispindle = getOmnispindle();
      const result = omnispindle.launchOpenCodeChild(laneId, {
        objective: req.body?.objective,
        prompt: req.body?.prompt,
        text: req.body?.text,
        instructions: req.body?.instructions,
        model: req.body?.model,
        agent: req.body?.agent,
        variant: req.body?.variant,
        files: req.body?.files,
        tokenBudget: req.body?.tokenBudget,
        ttlMs: req.body?.ttlMs,
        writeScope: req.body?.writeScope,
        labels: req.body?.labels,
        toolContract: req.body?.toolContract,
        bossChannels: req.body?.bossChannels
      });
      if (!result.ok) {
        if (result.supervisorDecision) {
          return res.status(400).json({ ok: false, laneId, ...result });
        }
        return respondError(res, result.error || "opencode_child_dispatch_failed", 400);
      }
      return res.json({ ok: true, laneId, ...result });
    } catch (error) {
      return respondError(res, error, 500);
    }
  });

  router.get("/agent/:laneId/children", (_req, res) => {
    try {
      const laneId = String(_req.params.laneId || "").trim().toLowerCase();
      if (!VALID_LANE_IDS.includes(laneId)) {
        return respondError(res, `Unknown lane: ${laneId}`, 400);
      }
      const omnispindle = getOmnispindle();
      return res.json({
        ok: true,
        laneId,
        children: omnispindle.getLaneChildren(laneId)
      });
    } catch (error) {
      return respondError(res, error, 500);
    }
  });

  router.get("/coupling/status", (_req, res) => {
    try {
      const omnispindle = getOmnispindle();
      return res.json({ ok: true, coupling: omnispindle.getCouplingStatus() });
    } catch (error) {
      return respondError(res, error, 500);
    }
  });

  router.post("/coupling/configure", requirePermission("admin"), (req, res) => {
    try {
      const omnispindle = getOmnispindle();
      const result = omnispindle.configureCoupling({
        enabled: req.body?.enabled === true,
        graphType: req.body?.graphType,
        enableToken: req.body?.enableToken,
        maxMessages: req.body?.maxMessages,
        maxSharedKeys: req.body?.maxSharedKeys,
        maxValueBytes: req.body?.maxValueBytes,
        maxInfluenceScore: req.body?.maxInfluenceScore
      });
      return res.status(result.ok ? 200 : 400).json(result.ok ? { ok: true, ...result } : { ok: false, ...result });
    } catch (error) {
      return respondError(res, error, 500);
    }
  });

  router.get("/cascade/status", (_req, res) => {
    try {
      const omnispindle = getOmnispindle({
        executable: resolveToolPaths().claudePath || "claude",
        workingDir: serverDir
      });
      return res.json({
        ok: true,
        ...omnispindle.getCascadeStatus()
      });
    } catch (error) {
      return respondError(res, error, 500);
    }
  });

  router.get("/cascade/guard", (_req, res) => {
    try {
      const omnispindle = getOmnispindle({
        executable: resolveToolPaths().claudePath || "claude",
        workingDir: serverDir
      });
      const cascade = omnispindle.getCascadeStatus();
      return res.json({
        ok: true,
        topologyId: cascade.topologyId,
        generatedAt: cascade.generatedAt || new Date().toISOString(),
        guard: cascade.guard || null,
        selfBuild: cascade.selfBuild || null,
        selfBuildTransport: cascade.selfBuildTransport || null,
        liveFrontier: {
          allowNewChildren: cascade.liveFrontier?.allowNewChildren === true,
          allowNewChildrenWithGuards: cascade.liveFrontier?.allowNewChildrenWithGuards === true,
          allowNewChildrenWithSelfBuild: cascade.liveFrontier?.allowNewChildrenWithSelfBuild === true,
          reasons: Array.isArray(cascade.liveFrontier?.reasons) ? cascade.liveFrontier.reasons : [],
          guardReasons: Array.isArray(cascade.liveFrontier?.guardReasons) ? cascade.liveFrontier.guardReasons : [],
          selfBuildReasons: Array.isArray(cascade.liveFrontier?.selfBuildReasons) ? cascade.liveFrontier.selfBuildReasons : []
        }
      });
    } catch (error) {
      return respondError(res, error, 500);
    }
  });

  router.get("/cascade/self-build", (_req, res) => {
    try {
      const omnispindle = getOmnispindle({
        executable: resolveToolPaths().claudePath || "claude",
        workingDir: serverDir
      });
      const cascade = omnispindle.getCascadeStatus();
      return res.json({
        ok: true,
        topologyId: cascade.topologyId,
        generatedAt: cascade.generatedAt || new Date().toISOString(),
        selfBuild: cascade.selfBuild || null,
        selfBuildTransport: cascade.selfBuildTransport || null,
        liveFrontier: {
          allowNewChildren: cascade.liveFrontier?.allowNewChildren === true,
          allowNewChildrenWithGuards: cascade.liveFrontier?.allowNewChildrenWithGuards === true,
          allowNewChildrenWithSelfBuild: cascade.liveFrontier?.allowNewChildrenWithSelfBuild === true,
          reasons: Array.isArray(cascade.liveFrontier?.reasons) ? cascade.liveFrontier.reasons : [],
          selfBuildReasons: Array.isArray(cascade.liveFrontier?.selfBuildReasons) ? cascade.liveFrontier.selfBuildReasons : []
        }
      });
    } catch (error) {
      return respondError(res, error, 500);
    }
  });

  router.post("/broadcast", requirePermission("admin"), (req, res) => {
    try {
      const text = String(req.body?.text || req.body?.prompt || "").trim();
      if (!text) {
        return respondError(res, "Broadcast text is required.", 400);
      }
      const omnispindle = getOmnispindle();
      const result = omnispindle.broadcast(text);
      return res.json({ ok: true, ...result });
    } catch (error) {
      return respondError(res, error, 500);
    }
  });

  return router;
}

module.exports = createOmnispindleRouter;
