// PID: asolaria | IX-484 Phase 0 | gnn-contract-v1
const { appendGraphEvent } = require("../src/graphRuntimeStore");
const { scoreEdgeRisk } = require("../src/edgeRiskEngine");
let watcher = null;
try { watcher = require("../src/gnnConstructionWatcher"); } catch (_) {}
const LEVELS = ["low", "low", "low", "medium", "medium", "high", "high", "high", "critical", "critical"];

const CASCADE_URL = "http://localhost:4792/infer";
const CASCADE_TIMEOUT_MS = 1500;

async function tryCascadeInfer(edgeVolume, avgRisk, maxRisk, failureRate, online, trustTier) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CASCADE_TIMEOUT_MS);
  try {
    const res = await fetch(CASCADE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nodes: [[edgeVolume / 100, avgRisk / 9, maxRisk / 9, failureRate, online, trustTier / 3]],
        edges: [[0, 1]]
      }),
      signal: controller.signal
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (_) {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function gnnGate(verb, args, envelope = {}) {
  const pid = envelope.pid || "unknown", target = args?.target || args?.channel || "";
  const eventId = `gevt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  try {
    const recorded = !!appendGraphEvent({ id: eventId, component: "ix-exec", category: "verb-dispatch", action: verb,
      actor: { id: pid, domain: envelope.host || "local" }, target: { id: target || verb, domain: "ix" },
      context: { args: typeof args === "string" ? args : JSON.stringify(args)?.slice(0, 200), permissionTier: envelope.permissionTier, pipelineStage: envelope.pipelineStage },
      policy: { approvalState: envelope.approvalState || "auto", autonomous: envelope.autonomous === true }, status: "dispatched" });

    // Local score (fallback baseline)
    let score = Math.max(0, Math.min(9, Math.trunc(scoreEdgeRisk({
      action: verb, actor: pid, target,
      context: { permissionTier: envelope.permissionTier, pipelineStage: envelope.pipelineStage },
      policy: { approvalState: envelope.approvalState || "auto" }
    }).score || 0)));

    // PRIMARY: 4-layer cascade server
    const edgeVolume = 1, avgRisk = score, maxRisk = score, failureRate = 0, online = 1;
    const trustTier = envelope.permissionTier != null ? Number(envelope.permissionTier) : 1;
    const cascade = await tryCascadeInfer(edgeVolume, avgRisk, maxRisk, failureRate, online, trustTier);

    let cascadeDepth = null, cascadeLayers = null, cascadeSource = "local";
    if (cascade) {
      cascadeSource = "cascade-4layer";
      cascadeDepth = cascade.cascade_depth ?? null;
      cascadeLayers = cascade.layers ?? null;
      if (cascade.allow === false) score = 9;
    }

    try { watcher?.recordRoutingEdge?.(pid, verb, target); } catch (_) {}
    let p = null; try { p = watcher?.predictConstruction?.(verb) || null; } catch (_) {}
    const prediction = { nextVerb: String(p?.nextVerb || ""), confidence: Number(p?.confidence || 0), constructionId: String(p?.constructionId || "") };
    const out = { ok: true, allow: !(score >= 9 && prediction.confidence > 0.8), score, level: LEVELS[score], prediction, edge: { recorded, eventId },
      cascade: { source: cascadeSource, depth: cascadeDepth, layers: cascadeLayers } };
    Object.defineProperty(out, "risk", { value: { score, level: LEVELS[score] } });
    return out;
  } catch (err) {
    return { ok: false, allow: true, degraded: true, reason: err?.message || "gnn failed" };
  }
}

module.exports = gnnGate;
