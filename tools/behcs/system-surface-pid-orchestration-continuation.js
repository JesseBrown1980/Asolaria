#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..", "..");
const runId = "system-surface-pid-orchestration-continuation-20260426";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", runId);
const systemIndexPath = path.join(repoRoot, "data", "behcs", "pid-fabric", "index", "system-surface-pid-indicator-index-latest.json");
const supervisorIndexPath = path.join(repoRoot, "data", "behcs", "pid-fabric", "index", "supervisor-pid-indicator-index-latest.json");

const OUTPUTS = Object.freeze({
  dispatch: path.join(runRoot, "chief-system-surface-dispatch.v1.json"),
  bindings: path.join(runRoot, "system-surface-lane-supervisor-bindings.v1.json"),
  queue: path.join(runRoot, "system-surface-continuation-queue.v1.ndjson"),
  reportJson: path.join(repoRoot, "reports", "system-surface-pid-orchestration-continuation-latest.json"),
  reportMd: path.join(repoRoot, "reports", "system-surface-pid-orchestration-continuation-latest.md"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "system-surface-pid-orchestration-continuation.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "system-surface-pid-orchestration-continuation-map.v1.json")
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

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function repoRel(filePath) {
  const relative = path.relative(repoRoot, filePath);
  if (path.isAbsolute(relative) || relative.startsWith("..")) {
    return filePath.replace(/\\/g, "/");
  }
  return relative.replace(/\\/g, "/");
}

function taskPid(index) {
  return `BH.ORCH.SYSPID.${String(index).padStart(4, "0")}`;
}

function pickSupervisor(index, needle) {
  const target = String(needle || "").toLowerCase();
  const hit = (index.supervisors || []).find((row) => {
    const text = `${row.setId} ${row.supervisorId} ${row.title} ${row.sourceFile}`.toLowerCase();
    return text.includes(target);
  });
  return hit || (index.supervisors || [])[0] || {
    indicatorPid: "BH.SUP.IND.000000000000",
    nativePid: null,
    supervisorId: "missing-supervisor",
    setId: "missing",
    sourceFile: "missing"
  };
}

function samplePids(systemIndex, kinds, limit = 16) {
  const wanted = new Set(kinds);
  return (systemIndex.records || [])
    .filter((row) => wanted.has(row.pidKind))
    .slice(0, limit)
    .map((row) => row.pid);
}

function makeTask(n, supervisorIndex, systemIndex, input) {
  const supervisor = pickSupervisor(supervisorIndex, input.supervisorNeedle);
  return {
    kind: "system_surface_pid_orchestration_task",
    taskPid: taskPid(n),
    lane: input.lane,
    supervisorPid: supervisor.indicatorPid,
    nativeSupervisorPid: supervisor.nativePid || null,
    supervisorId: supervisor.supervisorId,
    supervisorSet: supervisor.setId,
    objective: input.objective,
    systemPidKinds: input.systemPidKinds,
    sampleSystemPids: samplePids(systemIndex, input.systemPidKinds, input.sampleLimit || 16),
    artifacts: input.artifacts,
    collisionLocks: input.locks,
    executionMode: "bounded_local_artifact_orchestration",
    mutationAllowed: false,
    processFanout: 0,
    externalCalls: 0,
    d11: "TASK_READY_SYSTEM_SURFACE_PID_SUPERVISED"
  };
}

function buildTasks(supervisorIndex, systemIndex) {
  const indexArtifact = "data/behcs/pid-fabric/index/system-surface-pid-indicator-index-latest.json";
  const preloadArtifact = "data/behcs/pid-fabric/preload/system-surface-pid-preload-bindings-latest.json";
  return [
    makeTask(1, supervisorIndex, systemIndex, {
      lane: "cpu-gpu-energy-scheduler",
      supervisorNeedle: "base-os",
      objective: "Bind CPU and GPU PIDs into the energy-first scheduler map without claiming hidden silicon internals.",
      systemPidKinds: ["cpu", "gpu"],
      artifacts: [indexArtifact, "reports/device-pid-indicator-index-latest.md"],
      locks: ["L01_DEVICE", "L16_PID", "L42_ORCHESTRATION"]
    }),
    makeTask(2, supervisorIndex, systemIndex, {
      lane: "driver-provenance-hold",
      supervisorNeedle: "law033",
      objective: "Keep driver PIDs as descriptor-only evidence unless a signed, read-only driver source is explicitly available.",
      systemPidKinds: ["driver"],
      artifacts: [indexArtifact, "reports/system-surface-pid-indicator-index-latest.md"],
      locks: ["L11_PROOF", "L15_AUTHORITY"]
    }),
    makeTask(3, supervisorIndex, systemIndex, {
      lane: "task-manager-runtime",
      supervisorNeedle: "system-review",
      objective: "Use task-manager process PIDs for runtime awareness only; do not kill, inject, or mutate processes from the PID layer.",
      systemPidKinds: ["process"],
      artifacts: [indexArtifact],
      locks: ["L12_LOOK", "L47_GC"]
    }),
    makeTask(4, supervisorIndex, systemIndex, {
      lane: "installed-program-inventory",
      supervisorNeedle: "targeted",
      objective: "Classify installed program PIDs into recoverable tool inventory, stale inventory, and do-not-touch inventory.",
      systemPidKinds: ["program"],
      artifacts: [indexArtifact],
      locks: ["L08_CHAIN", "L11_PROOF"]
    }),
    makeTask(5, supervisorIndex, systemIndex, {
      lane: "tools-skills-preload",
      supervisorNeedle: "base-os",
      objective: "Load tools and skills by PID through compact preload packets for token reduction and collision-free execution.",
      systemPidKinds: ["tool", "skill"],
      artifacts: [indexArtifact, preloadArtifact, "skills"],
      locks: ["L22_TRANSLATION", "L16_PID"]
    }),
    makeTask(6, supervisorIndex, systemIndex, {
      lane: "mcp-asolaria-only-routing",
      supervisorNeedle: "mcp",
      objective: "Ensure every MCP surface routes through Asolaria BEHCS-256 policy and rejects direct external MCP attachment.",
      systemPidKinds: ["mcp"],
      artifacts: ["src/asolariaMcpPolicy.js", "reports/asolaria-behcs256-mcp-policy-latest.md", indexArtifact],
      locks: ["L10_MCP", "L39_HOOKWALL"]
    }),
    makeTask(7, supervisorIndex, systemIndex, {
      lane: "asolaria-code-wiki-index",
      supervisorNeedle: "hermes",
      objective: "Bind Asolaria code wiki, source code, and agent-index pages into PID-addressed lookup packets.",
      systemPidKinds: ["wiki", "code"],
      artifacts: [indexArtifact, "data/agent-index", "src"],
      locks: ["L08_CHAIN", "L24_INTENT"]
    }),
    makeTask(8, supervisorIndex, systemIndex, {
      lane: "token-reduction-cube-behcs",
      supervisorNeedle: "base-os",
      objective: "Use cube-cubed, BEHCS-256, and token-reduction PIDs as preload-once/reference-by-PID language surfaces.",
      systemPidKinds: ["token", "cube", "behcs"],
      artifacts: [indexArtifact, preloadArtifact, "data/behcs/cubes/system-surface-pid-indicator-cube-cubed.cube.js"],
      locks: ["L22_TRANSLATION", "L38_SHANNON"]
    }),
    makeTask(9, supervisorIndex, systemIndex, {
      lane: "supervisor-crossref-refresh",
      supervisorNeedle: "hermes",
      objective: "Refresh Hermes and supervisor awareness over all supervisor crossrefs without reloading every full supervisor body into every packet.",
      systemPidKinds: ["supervisor"],
      artifacts: [indexArtifact, "data/behcs/pid-fabric/index/supervisor-pid-indicator-index-latest.json"],
      locks: ["L42_ORCHESTRATION", "L16_PID"]
    }),
    makeTask(10, supervisorIndex, systemIndex, {
      lane: "gnn-omnishannon-hookwall",
      supervisorNeedle: "forward_reverse_gnn",
      objective: "Feed system-surface PIDs into GNN, OmniShannon, and Hookwall planning as descriptors, not uncontrolled execution agents.",
      systemPidKinds: ["cpu", "gpu", "driver", "tool", "cube", "behcs", "supervisor"],
      artifacts: [indexArtifact, "reports/system-surface-pid-indicator-index-latest.md"],
      locks: ["L37_GNN", "L38_SHANNON", "L39_HOOKWALL"]
    }),
    makeTask(11, supervisorIndex, systemIndex, {
      lane: "secret-redaction-gc",
      supervisorNeedle: "targeted",
      objective: "Verify raw paths, command lines, serials, tokens, and provider credentials stay redacted or hashed in PID artifacts.",
      systemPidKinds: ["process", "program", "mcp", "token", "tool"],
      artifacts: [indexArtifact, "data/behcs/pid-fabric/requests/system-surface-pid-indicator-latest.ndjson"],
      locks: ["L47_GC", "L11_PROOF"]
    }),
    makeTask(12, supervisorIndex, systemIndex, {
      lane: "significance-memory-index",
      supervisorNeedle: "law033",
      objective: "Preserve the significance: the whole local surface is now PID-addressable for energy-first orchestration and compact language execution.",
      systemPidKinds: ["system", "cpu", "gpu", "driver", "process", "tool", "skill", "mcp", "wiki", "cube", "behcs", "supervisor"],
      artifacts: ["data/behcs/memory/system-surface-pid-indicator-index.v1.json", indexArtifact],
      locks: ["L24_INTENT", "L11_PROOF"]
    })
  ];
}

function build(generatedAt) {
  const systemIndex = readJson(systemIndexPath);
  const supervisorIndex = readJson(supervisorIndexPath);
  if (!Array.isArray(systemIndex.records)) {
    throw new Error(`System surface PID index is missing records: ${repoRel(systemIndexPath)}`);
  }
  if (!Array.isArray(supervisorIndex.supervisors)) {
    throw new Error(`Supervisor PID index is missing supervisors: ${repoRel(supervisorIndexPath)}`);
  }
  const tasks = buildTasks(supervisorIndex, systemIndex);
  const bindings = {
    bindingId: "system-surface-lane-supervisor-bindings.v1",
    generatedAt,
    sourceSystemIndex: repoRel(systemIndexPath),
    sourceSupervisorIndex: repoRel(supervisorIndexPath),
    systemIndexHash: systemIndex.indexHash,
    lanes: tasks.map((task) => ({
      lane: task.lane,
      taskPid: task.taskPid,
      supervisorPid: task.supervisorPid,
      nativeSupervisorPid: task.nativeSupervisorPid,
      supervisorId: task.supervisorId,
      systemPidKinds: task.systemPidKinds,
      sampleSystemPids: task.sampleSystemPids,
      locks: task.collisionLocks
    }))
  };
  const dispatch = {
    dispatchId: "chief-system-surface-dispatch.v1",
    generatedAt,
    status: "CONTINUE_ORCHESTRATION_SYSTEM_SURFACE_PID_GATED",
    thesis: "CPU/GPU, drivers, task-manager processes, programs, tools, skills, MCP, wiki/code, token-reduction, cubes, BEHCS, and supervisors are divided into PID-governed lanes.",
    sourceSystemIndex: repoRel(systemIndexPath),
    sourceSupervisorIndex: repoRel(supervisorIndexPath),
    systemCounts: systemIndex.counts,
    taskCount: tasks.length,
    processFanout: 0,
    externalCalls: 0,
    nextDisposition: "Execute bounded tasks by lane, preserving PID scopes, collision locks, and mutation=false until a task is reviewed.",
    d11: "PROVEN_LOCAL_SYSTEM_SURFACE_PID_DISPATCH"
  };
  const report = {
    reportId: "system-surface-pid-orchestration-continuation-latest",
    generatedAt,
    status: dispatch.status,
    counts: {
      tasks: tasks.length,
      sourceSystemPidRecords: systemIndex.counts.totalRecords,
      liveOsRecords: systemIndex.liveOs ? systemIndex.liveOs.records || 0 : 0,
      uniqueSupervisorPids: new Set(tasks.map((task) => task.supervisorPid)).size,
      processFanout: 0,
      externalCalls: 0
    },
    outputs: Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)])),
    taskPids: tasks.map((task) => task.taskPid),
    d11: "PROVEN_LOCAL_SYSTEM_SURFACE_ORCHESTRATION_QUEUE"
  };
  const memory = {
    memoryId: "system-surface-pid-orchestration-continuation.v1",
    generatedAt,
    event: "Continuation orchestration was rebound to system-surface PIDs.",
    significance: "Asolaria can now organize CPU/GPU descriptors, drivers, runtime processes, programs, tools, skills, MCP, code wiki, token-reduction surfaces, cubes, BEHCS language, and supervisors through compact PID packets. This gives the system a shared local inventory for energy-first orchestration without uncontrolled fanout or secret exposure.",
    report: repoRel(OUTPUTS.reportMd),
    d11: report.d11
  };
  const map = {
    mapId: "system-surface-pid-orchestration-continuation-map.v1",
    generatedAt,
    status: "MAP_MAP_MAPPED",
    edges: tasks.flatMap((task) => task.sampleSystemPids.map((pid) => ({
      from: task.taskPid,
      to: pid,
      viaSupervisorPid: task.supervisorPid,
      relation: "orchestrates_system_surface_pid",
      lane: task.lane
    }))),
    d11: report.d11
  };
  const rows = tasks.map((task) => JSON.stringify(task)).join("\n") + "\n";
  const md = `# System Surface PID Orchestration Continuation

Status: ${dispatch.status}

CPU/GPU, drivers, task-manager processes, installed programs, tools, skills, MCP, Asolaria code/wiki, token-reduction surfaces, cubes, BEHCS-256, and supervisor crossrefs are now split into PID-governed continuation lanes.

## Counts

- Tasks: ${tasks.length}
- Source system PID records: ${report.counts.sourceSystemPidRecords}
- Live OS records: ${report.counts.liveOsRecords}
- Unique supervisor PIDs: ${report.counts.uniqueSupervisorPids}
- Process fanout: 0
- External calls: 0

## Queue

${tasks.map((task) => `- ${task.taskPid} -> ${task.supervisorPid} (${task.lane}): ${task.objective}`).join("\n")}

## Truth Boundary

This continuation queue plans work from descriptors. It does not kill processes, install programs, mutate drivers, reveal secrets, call external services, or spawn uncontrolled agents.

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
    sourceSystemPidRecords: built.report.counts.sourceSystemPidRecords,
    report: repoRel(OUTPUTS.reportMd),
    queue: repoRel(OUTPUTS.queue)
  }, null, 2));
}

if (require.main === module) {
  run();
}

module.exports = {
  build,
  buildTasks
};
