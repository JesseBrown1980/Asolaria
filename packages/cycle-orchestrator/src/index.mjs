import { MythosCognitiveEngine } from "../../mythos-cognitive-engine/src/engine.mjs";
import { evaluateSpectralStability } from "../../../src/gac/laws/spectral-stability.mjs";

const activeEngines = new Map();

function cleanText(value, maxLen = 4000) {
  return String(value || "").replace(/\r/g, "").trim().slice(0, maxLen);
}

export async function spawnMythosForTask(task = {}) {
  if (!task.requiresDeepReasoning && task.type !== "deep_reasoning") {
    return null;
  }

  const engine = new MythosCognitiveEngine({
    pid: task.pid,
    device: task.device || "cpu",
    configPath: task.configPath || "",
    weightsPath: task.weightsPath || "",
    maxLoops: task.maxLoops || 16
  });
  const pid = engine.spawn();
  activeEngines.set(pid, engine);

  let load = { status: "skipped", reason: "config_path_not_supplied" };
  if (task.configPath) {
    load = await engine.loadModel(task.configPath, task.weightsPath || "");
  }

  return { pid, engine, load };
}

export async function runDeepReasoningTask(task = {}) {
  const spawned = await spawnMythosForTask({
    ...task,
    type: "deep_reasoning",
    requiresDeepReasoning: true
  });
  const engine = spawned.engine;
  const statusBefore = await engine.status();
  const precheck = evaluateSpectralStability(
    { engine: "openmythos", loops: task.loops || 8, spectralRadius: statusBefore.spectral_radius },
    { engine: "openmythos", loops: task.loops || 8, spectralRadius: statusBefore.spectral_radius }
  );

  if (!precheck.passed && precheck.action !== "HALT") {
    return {
      status: "blocked_by_gac",
      pid: spawned.pid,
      load: spawned.load,
      precheck
    };
  }

  const result = await engine.think(cleanText(task.prompt, 12000), {
    loops: task.loops || 8,
    inputIds: task.inputIds,
    maxNewTokens: task.maxNewTokens || 128,
    timeoutMs: task.timeoutMs || 60000
  });
  const postcheck = evaluateSpectralStability(
    { engine: "openmythos", loops: result.loops_used, spectralRadius: result.spectral_radius },
    { engine: "openmythos", loops: result.loops_used, spectralRadius: result.spectral_radius }
  );

  return {
    status: postcheck.passed ? "completed_gac_checked" : "completed_output_blocked_by_gac",
    pid: spawned.pid,
    load: spawned.load,
    precheck,
    result,
    postcheck
  };
}

export async function haltAll() {
  const rows = [];
  for (const [pid, engine] of activeEngines.entries()) {
    rows.push({ pid, halt: await engine.halt() });
  }
  activeEngines.clear();
  return rows;
}

export function status() {
  return {
    ok: true,
    activeEngines: activeEngines.size,
    pids: Array.from(activeEngines.keys())
  };
}

export { activeEngines };
