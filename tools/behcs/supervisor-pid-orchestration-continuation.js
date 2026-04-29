#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const runId = "supervisor-pid-orchestration-continuation-20260426";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", runId);
const supervisorIndexPath = path.join(repoRoot, "data", "behcs", "pid-fabric", "index", "supervisor-pid-indicator-index-latest.json");

const OUTPUTS = Object.freeze({
  dispatch: path.join(runRoot, "chief-orchestration-dispatch.v1.json"),
  bindings: path.join(runRoot, "lane-supervisor-pid-bindings.v1.json"),
  queue: path.join(runRoot, "continuation-queue.v1.ndjson"),
  reportJson: path.join(repoRoot, "reports", "supervisor-pid-orchestration-continuation-latest.json"),
  reportMd: path.join(repoRoot, "reports", "supervisor-pid-orchestration-continuation-latest.md"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "supervisor-pid-orchestration-continuation.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "supervisor-pid-orchestration-continuation-map.v1.json")
});

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeJson(filePath, data) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function writeText(filePath, data) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, data.endsWith("\n") ? data : `${data}\n`, "utf8");
}

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_error) {
    return fallback;
  }
}

function repoRel(filePath) {
  const relative = path.relative(repoRoot, filePath);
  if (path.isAbsolute(relative) || relative.startsWith("..")) {
    return filePath.replace(/\\/g, "/");
  }
  return relative.replace(/\\/g, "/");
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function taskPid(index) {
  return `BH.ORCH.SUPPID.${String(index).padStart(4, "0")}`;
}

function pickSupervisor(index, needle) {
  const match = (index.supervisors || []).find((row) => {
    const haystack = `${row.setId} ${row.supervisorId} ${row.title} ${row.sourceFile}`.toLowerCase();
    return haystack.includes(needle.toLowerCase());
  });
  if (match) {
    return match;
  }
  return (index.supervisors || [])[0] || {
    indicatorPid: "BH.SUP.IND.000000000000",
    supervisorId: "missing-supervisor",
    setId: "missing",
    sourceFile: "missing"
  };
}

function makeTask(index, n, lane, supervisorNeedle, objective, artifacts, locks) {
  const supervisor = pickSupervisor(index, supervisorNeedle);
  return {
    kind: "supervisor_pid_orchestration_task",
    taskPid: taskPid(n),
    lane,
    supervisorPid: supervisor.indicatorPid,
    nativeSupervisorPid: supervisor.nativePid || null,
    supervisorId: supervisor.supervisorId,
    supervisorSet: supervisor.setId,
    supervisorSource: supervisor.sourceFile,
    objective,
    artifacts,
    collisionLocks: locks,
    executionMode: "bounded_local_artifact_orchestration",
    processFanout: 0,
    externalCalls: 0,
    d11: "TASK_READY_SUPERVISED"
  };
}

function buildTasks(index) {
  return [
    makeTask(index, 1, "mcp-os-gate", "mcp", "Keep MCP forced through Asolaria OS / BEHCS-256 and report policy errors instead of direct external attachment.", ["src/asolariaMcpPolicy.js", "reports/asolaria-behcs256-mcp-policy-latest.md"], ["L10_MCP", "L39_HOOKWALL"]),
    makeTask(index, 2, "supervisor-pid-preload", "base-os", "Use the supervisor PID preload bindings as the authority list for Hermes and global PID sweeps.", ["data/behcs/pid-fabric/preload/supervisor-pid-preload-bindings-latest.json"], ["L16_PID", "L42_ORCHESTRATION"]),
    makeTask(index, 3, "glyph-language-wave04", "openclaw", "Run the next OpenClaw/OpenMythos glyph-language tranche using PID-indicated supervisors as gates.", ["data/behcs/orchestration/openclaw-424-room-execution-orchestration-20260426"], ["L22_TRANSLATION", "L39_HOOKWALL"]),
    makeTask(index, 4, "shadow-language-holds", "shadow-language", "Keep zero-surface and parser-mismatch files classified by language before repair.", ["reports/shadow-language-classification-supervisor-latest.md"], ["L05_LAYER", "L15_AUTHORITY"]),
    makeTask(index, 5, "structured-data-hygiene", "system-review", "Continue safe structured-data hygiene with raw preservation and no unknown git revert.", ["reports/max-omnispindle-cleanup-200step-latest.md"], ["L08_CHAIN", "L11_PROOF"]),
    makeTask(index, 6, "openclaw-ingestion-diff", "openclaw", "Compare OpenClaw newest ingested surfaces against Asolaria, extracting upgrades without blind promotion.", ["reports/openclaw-openmythos-mlc-gemma4-glyph-integration-latest.md"], ["L11_PROOF", "L20_REVERSE_GAIN"]),
    makeTask(index, 7, "liris-compare", "liris", "Compare Liris shares and memories against Acer canon only through bounded local read surfaces.", ["reports/liris-omniprocessor-node-register-latest.md"], ["L23_FEDERATION", "L15_AUTHORITY"]),
    makeTask(index, 8, "git-compare-cleanup", "targeted", "Separate user/agent dirty work from safe fixes, then queue owner-aware review tasks.", ["reports/dirty-worktree-supervised-cleanup-latest.md"], ["L08_CHAIN", "L47_GC"]),
    makeTask(index, 9, "omnishannon-gnn-crosswalk", "base-os", "Fold supervisor PID indicators into OmniShannon/GNN crosswalks so gates are addressable by PID.", ["data/behcs/pid-fabric/index/supervisor-pid-indicator-index-latest.json"], ["L37_GNN", "L38_SHANNON"]),
    makeTask(index, 10, "mcp-agent-profile-sync", "mcp", "Ensure Codex, Claude, Gemini, and DeepSeek class profiles inherit Asolaria MCP-only routing.", ["data/behcs/profiles/asolaria-behcs256-mcp-agent-profiles.v1.json"], ["L10_MCP", "L16_PID"]),
    makeTask(index, 11, "hermes-awareness-refresh", "hermes", "Refresh Hermes awareness over new MCP and supervisor-PID surfaces without spawning uncontrolled workers.", ["data/behcs/supervisors/mcp/asolaria-behcs256-mcp-supervisors.v1.json"], ["L42_ORCHESTRATION", "L38_SHANNON"]),
    makeTask(index, 12, "significance-memory-index", "law-033", "Write the significance of the event into memory, index, map, cube, and GLPJ surfaces.", ["data/behcs/memory/supervisor-pid-indicator-index.v1.json"], ["L24_INTENT", "L11_PROOF"])
  ];
}

function build(generatedAt) {
  const index = readJson(supervisorIndexPath, null);
  if (!index || !Array.isArray(index.supervisors)) {
    throw new Error(`Supervisor PID index is missing or invalid: ${repoRel(supervisorIndexPath)}`);
  }
  const tasks = buildTasks(index);
  const bindings = {
    bindingId: "lane-supervisor-pid-bindings.v1",
    generatedAt,
    sourceIndex: repoRel(supervisorIndexPath),
    indexHash: index.indexHash,
    lanes: tasks.map((task) => ({
      lane: task.lane,
      taskPid: task.taskPid,
      supervisorPid: task.supervisorPid,
      nativeSupervisorPid: task.nativeSupervisorPid,
      supervisorId: task.supervisorId,
      supervisorSet: task.supervisorSet,
      locks: task.collisionLocks
    }))
  };
  const dispatch = {
    dispatchId: "chief-orchestration-dispatch.v1",
    generatedAt,
    status: "CONTINUE_ORCHESTRATION_SUPERVISOR_PID_GATED",
    thesis: "Continuation work is split by lane and every lane points at a PID-indicated supervisor.",
    sourceIndex: repoRel(supervisorIndexPath),
    indexHash: index.indexHash,
    taskCount: tasks.length,
    processFanout: 0,
    externalCalls: 0,
    nextDisposition: "Execute bounded tasks by lane, preserving collision locks and supervisor PID gates.",
    d11: "PROVEN_LOCAL_DISPATCH"
  };
  const report = {
    reportId: "supervisor-pid-orchestration-continuation-latest",
    generatedAt,
    status: dispatch.status,
    counts: {
      tasks: tasks.length,
      uniqueSupervisorPids: new Set(tasks.map((task) => task.supervisorPid)).size,
      sourceSupervisorRecords: index.counts.supervisorRecords,
      processFanout: 0,
      externalCalls: 0
    },
    outputs: Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)])),
    taskPids: tasks.map((task) => task.taskPid),
    d11: "PROVEN_LOCAL_ORCHESTRATION_QUEUE"
  };
  const memory = {
    memoryId: "supervisor-pid-orchestration-continuation.v1",
    generatedAt,
    event: "Continuation orchestration was rebound to PID-indicated supervisors.",
    significance: "The system can now continue work as an organization: lanes point to supervisor PIDs, tasks carry collision locks, and Hermes can reason over authority without loading every full supervisor body into every packet.",
    report: repoRel(OUTPUTS.reportMd),
    d11: report.d11
  };
  const map = {
    mapId: "supervisor-pid-orchestration-continuation-map.v1",
    generatedAt,
    status: "MAP_MAP_MAPPED",
    edges: tasks.map((task) => ({
      from: task.taskPid,
      to: task.supervisorPid,
      relation: "governed_by_pid_indicated_supervisor",
      lane: task.lane
    })),
    d11: report.d11
  };
  const rows = tasks.map((task) => JSON.stringify(task)).join("\n") + "\n";
  const md = `# Supervisor PID Orchestration Continuation

Status: ${dispatch.status}

Continuation is now supervisor-PID gated. Each lane has a task PID, a supervisor PID, collision locks, and a bounded local execution mode.

## Counts

- Tasks: ${tasks.length}
- Unique supervisor PIDs: ${report.counts.uniqueSupervisorPids}
- Source supervisor records: ${index.counts.supervisorRecords}
- Process fanout: 0
- External calls: 0

## Queue

${tasks.map((task) => `- ${task.taskPid} -> ${task.supervisorPid} (${task.lane}): ${task.objective}`).join("\n")}

D11: ${report.d11}
`;
  return { tasks, bindings, dispatch, report, memory, map, rows, md };
}

function run() {
  const generatedAt = new Date().toISOString();
  const built = build(generatedAt);
  writeJson(OUTPUTS.dispatch, built.dispatch);
  writeJson(OUTPUTS.bindings, built.bindings);
  writeText(OUTPUTS.queue, built.rows);
  writeJson(OUTPUTS.reportJson, built.report);
  writeText(OUTPUTS.reportMd, built.md);
  writeJson(OUTPUTS.memory, built.memory);
  writeJson(OUTPUTS.map, built.map);
  console.log(JSON.stringify({
    ok: true,
    status: built.dispatch.status,
    taskCount: built.tasks.length,
    report: repoRel(OUTPUTS.reportMd),
    queue: repoRel(OUTPUTS.queue)
  }, null, 2));
}

if (require.main === module) {
  run();
}

module.exports = {
  build
};
