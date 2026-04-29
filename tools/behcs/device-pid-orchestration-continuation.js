#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..", "..");
const runId = "device-pid-orchestration-continuation-20260426";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", runId);
const deviceIndexPath = path.join(repoRoot, "data", "behcs", "pid-fabric", "index", "device-pid-indicator-index-latest.json");
const supervisorIndexPath = path.join(repoRoot, "data", "behcs", "pid-fabric", "index", "supervisor-pid-indicator-index-latest.json");

const OUTPUTS = Object.freeze({
  dispatch: path.join(runRoot, "chief-device-pid-dispatch.v1.json"),
  bindings: path.join(runRoot, "device-lane-supervisor-bindings.v1.json"),
  queue: path.join(runRoot, "device-pid-continuation-queue.v1.ndjson"),
  reportJson: path.join(repoRoot, "reports", "device-pid-orchestration-continuation-latest.json"),
  reportMd: path.join(repoRoot, "reports", "device-pid-orchestration-continuation-latest.md"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "device-pid-orchestration-continuation.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "device-pid-orchestration-continuation-map.v1.json")
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
  return `BH.ORCH.DEVPID.${String(index).padStart(4, "0")}`;
}

function pickSupervisor(index, needle) {
  const hit = (index.supervisors || []).find((row) => {
    const text = `${row.setId} ${row.supervisorId} ${row.title} ${row.sourceFile}`.toLowerCase();
    return text.includes(String(needle || "").toLowerCase());
  });
  return hit || (index.supervisors || [])[0] || {
    indicatorPid: "BH.SUP.IND.000000000000",
    nativePid: null,
    supervisorId: "missing-supervisor",
    setId: "missing",
    sourceFile: "missing"
  };
}

function samplePids(deviceIndex, kind, limit = 8) {
  return (deviceIndex.records || [])
    .filter((row) => row.pidKind === kind)
    .slice(0, limit)
    .map((row) => row.pid);
}

function makeTask(n, supervisorIndex, deviceIndex, input) {
  const supervisor = pickSupervisor(supervisorIndex, input.supervisorNeedle);
  return {
    kind: "device_pid_orchestration_task",
    taskPid: taskPid(n),
    lane: input.lane,
    supervisorPid: supervisor.indicatorPid,
    nativeSupervisorPid: supervisor.nativePid || null,
    supervisorId: supervisor.supervisorId,
    supervisorSet: supervisor.setId,
    objective: input.objective,
    devicePidKinds: input.devicePidKinds,
    sampleDevicePids: input.devicePidKinds.flatMap((kind) => samplePids(deviceIndex, kind, 4)).slice(0, 12),
    artifacts: input.artifacts,
    collisionLocks: input.locks,
    executionMode: "bounded_local_artifact_orchestration",
    mutationAllowed: false,
    processFanout: 0,
    externalCalls: 0,
    d11: "TASK_READY_DEVICE_PID_SUPERVISED"
  };
}

function buildTasks(supervisorIndex, deviceIndex) {
  const artifact = "data/behcs/pid-fabric/index/device-pid-indicator-index-latest.json";
  return [
    makeTask(1, supervisorIndex, deviceIndex, {
      lane: "device-preload-merge",
      supervisorNeedle: "base-os",
      objective: "Load device-pid-preload-bindings into global PID planning so device work can use compact PID packets.",
      devicePidKinds: ["device", "chip", "firmware"],
      artifacts: [artifact, "data/behcs/pid-fabric/preload/device-pid-preload-bindings-latest.json"],
      locks: ["L16_PID", "L42_ORCHESTRATION"]
    }),
    makeTask(2, supervisorIndex, deviceIndex, {
      lane: "firmware-hold-law",
      supervisorNeedle: "law033",
      objective: "Keep firmware image, EC, ME/PSP, VBIOS, storage firmware, and phone baseband internals as hold PIDs until approved read-only evidence exists.",
      devicePidKinds: ["firmware", "hold"],
      artifacts: [artifact, "reports/device-pid-indicator-index-latest.md"],
      locks: ["L15_AUTHORITY", "L11_PROOF"]
    }),
    makeTask(3, supervisorIndex, deviceIndex, {
      lane: "chip-topology-gnn",
      supervisorNeedle: "forward_reverse_gnn",
      objective: "Fold chip descriptor PIDs into the GNN topology without claiming hidden die internals.",
      devicePidKinds: ["chip"],
      artifacts: [artifact],
      locks: ["L37_GNN", "L20_REVERSE_GAIN"]
    }),
    makeTask(4, supervisorIndex, deviceIndex, {
      lane: "windows-cim-refresh",
      supervisorNeedle: "system-review",
      objective: "Refresh OS-visible Windows hardware inventory as a repeatable read-only probe.",
      devicePidKinds: ["device", "chip", "firmware"],
      artifacts: ["tools/behcs/device-pid-indicator-index.js"],
      locks: ["L01_DEVICE", "L08_CHAIN"]
    }),
    makeTask(5, supervisorIndex, deviceIndex, {
      lane: "liris-device-audit",
      supervisorNeedle: "hermes_supervisor_healing",
      objective: "Compare Liris SMB/WinRM-visible hardware and node data against Acer device PID schema before any remote write.",
      devicePidKinds: ["node", "device"],
      artifacts: ["data/behcs/nodes/liris-desktop-ptsqtie.node.json", artifact],
      locks: ["L23_FEDERATION", "L15_AUTHORITY"]
    }),
    makeTask(6, supervisorIndex, deviceIndex, {
      lane: "falcon-adb-device-sync",
      supervisorNeedle: "openmythos",
      objective: "Map Falcon ADB/mobile descriptors into device PIDs through manifests and later read-only ADB inventory.",
      devicePidKinds: ["node", "device"],
      artifacts: ["data/behcs/nodes/falcon.node.json", "data/behcs/device-registry.json"],
      locks: ["L01_DEVICE", "L23_FEDERATION"]
    }),
    makeTask(7, supervisorIndex, deviceIndex, {
      lane: "novalum-firmware-descriptor",
      supervisorNeedle: "base-os",
      objective: "Keep NovaLUM firmware descriptors PIDed while preserving the raw-firmware no-dump/no-flash boundary.",
      devicePidKinds: ["firmware", "device"],
      artifacts: ["data/behcs/novalum-unified-manifest.json", artifact],
      locks: ["L11_PROOF", "L39_HOOKWALL"]
    }),
    makeTask(8, supervisorIndex, deviceIndex, {
      lane: "trinity-physical-links",
      supervisorNeedle: "base-os",
      objective: "Bind USB, HDMI, Ethernet, SMB, WinRM, ADB, and local bus observations to device PIDs as topology edges.",
      devicePidKinds: ["device", "node"],
      artifacts: ["data/behcs/device-registry.json", "data/behcs/maps/omni-processor/liris-omniprocessor-node-map.v1.json"],
      locks: ["L23_FEDERATION", "L01_DEVICE"]
    }),
    makeTask(9, supervisorIndex, deviceIndex, {
      lane: "serial-redaction-gc",
      supervisorNeedle: "targeted",
      objective: "Verify device PID artifacts keep serials and PNP IDs hashed/redacted while still producing stable descriptors.",
      devicePidKinds: ["device", "chip", "firmware"],
      artifacts: [artifact],
      locks: ["L47_GC", "L11_PROOF"]
    }),
    makeTask(10, supervisorIndex, deviceIndex, {
      lane: "mcp-device-tool-policy",
      supervisorNeedle: "mcp",
      objective: "Ensure future device tool calls through MCP are Asolaria BEHCS-256 gated and device-PID scoped.",
      devicePidKinds: ["device", "node"],
      artifacts: ["reports/asolaria-behcs256-mcp-policy-latest.md", artifact],
      locks: ["L10_MCP", "L16_PID"]
    }),
    makeTask(11, supervisorIndex, deviceIndex, {
      lane: "hermes-device-awareness",
      supervisorNeedle: "hermes",
      objective: "Refresh Hermes awareness over device, chip, firmware descriptor, and hold PID classes.",
      devicePidKinds: ["device", "chip", "firmware", "hold"],
      artifacts: [artifact, "reports/device-pid-indicator-index-latest.md"],
      locks: ["L42_ORCHESTRATION", "L38_SHANNON"]
    }),
    makeTask(12, supervisorIndex, deviceIndex, {
      lane: "device-significance-index",
      supervisorNeedle: "law033",
      objective: "Preserve the significance: hardware-facing surfaces are now PID-addressable without violating firmware/chip truth boundaries.",
      devicePidKinds: ["manifest", "hold"],
      artifacts: ["data/behcs/memory/device-pid-indicator-index.v1.json"],
      locks: ["L24_INTENT", "L11_PROOF"]
    })
  ];
}

function build(generatedAt) {
  const deviceIndex = readJson(deviceIndexPath);
  const supervisorIndex = readJson(supervisorIndexPath);
  const tasks = buildTasks(supervisorIndex, deviceIndex);
  const bindings = {
    bindingId: "device-lane-supervisor-bindings.v1",
    generatedAt,
    sourceDeviceIndex: repoRel(deviceIndexPath),
    sourceSupervisorIndex: repoRel(supervisorIndexPath),
    deviceIndexHash: deviceIndex.indexHash,
    lanes: tasks.map((task) => ({
      lane: task.lane,
      taskPid: task.taskPid,
      supervisorPid: task.supervisorPid,
      supervisorId: task.supervisorId,
      devicePidKinds: task.devicePidKinds,
      sampleDevicePids: task.sampleDevicePids,
      locks: task.collisionLocks
    }))
  };
  const dispatch = {
    dispatchId: "chief-device-pid-dispatch.v1",
    generatedAt,
    status: "CONTINUE_ORCHESTRATION_DEVICE_PID_GATED",
    sourceDeviceIndex: repoRel(deviceIndexPath),
    sourceSupervisorIndex: repoRel(supervisorIndexPath),
    deviceCounts: deviceIndex.counts,
    taskCount: tasks.length,
    processFanout: 0,
    externalCalls: 0,
    truthBoundary: deviceIndex.truthBoundary,
    d11: "PROVEN_LOCAL_DEVICE_PID_DISPATCH"
  };
  const report = {
    reportId: "device-pid-orchestration-continuation-latest",
    generatedAt,
    status: dispatch.status,
    counts: {
      tasks: tasks.length,
      sourceDevicePidRecords: deviceIndex.counts.totalRecords,
      observedDeviceRecords: deviceIndex.counts.observedRecords,
      holdDeviceRecords: deviceIndex.counts.holdRecords,
      uniqueSupervisorPids: new Set(tasks.map((task) => task.supervisorPid)).size,
      processFanout: 0,
      externalCalls: 0
    },
    outputs: Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)])),
    d11: "PROVEN_LOCAL_DEVICE_PID_ORCHESTRATION_QUEUE"
  };
  const memory = {
    memoryId: "device-pid-orchestration-continuation.v1",
    generatedAt,
    event: "Continuation orchestration was rebound to device-specific PIDs.",
    significance: "Asolaria can now plan hardware-facing work by PID across devices, chips, firmware descriptors, nodes, and holds while preventing fake firmware/silicon proof claims.",
    report: repoRel(OUTPUTS.reportMd),
    d11: report.d11
  };
  const map = {
    mapId: "device-pid-orchestration-continuation-map.v1",
    generatedAt,
    status: "MAP_MAP_MAPPED",
    edges: tasks.flatMap((task) => task.sampleDevicePids.map((pid) => ({
      from: task.taskPid,
      to: pid,
      supervisorPid: task.supervisorPid,
      relation: "device_pid_task_scope",
      lane: task.lane
    }))),
    d11: report.d11
  };
  const md = `# Device PID Orchestration Continuation

Status: ${dispatch.status}

The device PID index is now part of the continuation queue. Hardware-facing work is split by lane, scoped to device/chip/firmware/node/hold PIDs, and governed by PID-indicated supervisors.

## Counts

- Tasks: ${tasks.length}
- Source device PID records: ${deviceIndex.counts.totalRecords}
- Observed device records: ${deviceIndex.counts.observedRecords}
- Hold device records: ${deviceIndex.counts.holdRecords}
- Unique supervisor PIDs: ${report.counts.uniqueSupervisorPids}
- Process fanout: 0
- External calls: 0

## Queue

${tasks.map((task) => `- ${task.taskPid} -> ${task.supervisorPid} (${task.lane}): ${task.objective}`).join("\n")}

## Truth Boundary

${deviceIndex.truthBoundary}

D11: ${report.d11}
`;
  return {
    tasks,
    bindings,
    dispatch,
    report,
    memory,
    map,
    rows: tasks.map((task) => JSON.stringify(task)).join("\n") + "\n",
    md
  };
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
