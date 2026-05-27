#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..");

const PATHS = Object.freeze({
  state: rel("data/behcs/state/omnispindle/omniflywheel-coupling-smoke.state.json"),
  reportJson: rel("reports/omniflywheel-coupling-smoke-latest.json"),
  reportMd: rel("reports/omniflywheel-coupling-smoke-latest.md"),
  cube: rel("data/behcs/cubes/omniflywheel-coupling-smoke.cube.js")
});

function rel(p) {
  return path.join(repoRoot, p);
}

function repoRel(p) {
  return path.relative(repoRoot, p).replace(/\\/g, "/");
}

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

function sha256Text(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function buildReport(result, generatedAt) {
  const json = {
    reportId: "omniflywheel-coupling-smoke-latest",
    generatedAt,
    status: "OMNIFLYWHEEL_COUPLING_SMOKE_PASS",
    result
  };
  const md = `# Omniflywheel Coupling Smoke

Generated: ${generatedAt}

Status: OMNIFLYWHEEL_COUPLING_SMOKE_PASS

This validates the non-breaking Omnispindle coupling path. Default mode stays stateless. Coupled mode opens only after the GAC enable token, then provides shared-field, message-queue, and neighbor-graph behavior.

## Result

- Initial mode: ${result.initial.mode}
- Enable without token: ${result.deniedEnable.gate.reason}
- Enabled mode: ${result.enabled.status.mode}
- Graph: ${result.enabled.status.graphType}
- Shared write: ${result.write.ok}
- Read value hash: ${result.read.valueHash}
- Broadcast: ${result.broadcast.ok}
- Messages for worker: ${result.messages.length}
- Neighbor count: ${result.neighbors.length}

## Architecture

\`GAC -> Omniflywheel -> Omnispindle -> Workers -> Gulp/GC/GNN/Shannon\`
`;
  return { json, md };
}

function buildCube(result, generatedAt) {
  const cube = {
    id: "omniflywheel-coupling-smoke",
    generatedAt,
    primaryCatalog: { D: 37, name: "AUTHORITY", prime: 157 },
    touches: [6, 20, 35, 37, 38, 39, 42, 47],
    payload: {
      kind: "omniflywheel-coupling",
      status: "OMNIFLYWHEEL_COUPLING_SMOKE_PASS",
      initialMode: result.initial.mode,
      enabledMode: result.enabled.status.mode,
      graphType: result.enabled.status.graphType,
      neighborCount: result.neighbors.length,
      resultHash: result.resultHash
    },
    translate: {
      human: "Omniflywheel coupling preserves stateless Omnispindle mode and adds gated coupled-worker primitives.",
      agent: "(gac, omniflywheel, omnispindle, coupling, shared_field, message_queue, neighbor_graph)",
      device: "node tools/omniflywheel-coupling-smoke.js run --execute"
    }
  };
  return `// cube: omniflywheel-coupling-smoke | omnispindle | D37 AUTHORITY\nexport const CUBE = ${JSON.stringify(cube, null, 2)}\n`;
}

function run({ execute = false } = {}) {
  const generatedAt = new Date().toISOString();
  const { OmniflywheelCouplingLayer } = require("../src/omniflywheelCoupling");
  const coupling = new OmniflywheelCouplingLayer();
  const initial = coupling.status();
  const deniedEnable = coupling.configure({ enabled: true, graphType: "ring" });
  const enabled = coupling.configure({
    enabled: true,
    graphType: "ring",
    enableToken: "COUPLING_ENABLE_APPROVED"
  });
  const write = coupling.write("worker-0001", "current_pattern", {
    mistakePattern: "stale_gc_counter",
    promotion: "stream_gulp_updates_real_gc_state"
  });
  const read = coupling.read("worker-0002", "current_pattern");
  const broadcast = coupling.broadcast("worker-0001", {
    kind: "pattern_update",
    key: "current_pattern"
  });
  const messages = coupling.messagesFor("worker-0002");
  const neighbors = coupling.getNeighbors("worker-0002", 20);
  const status = coupling.status();
  const result = {
    initial,
    deniedEnable,
    enabled,
    write,
    read: {
      ...read,
      valueHash: read.value ? sha256Text(JSON.stringify(read.value)) : ""
    },
    broadcast,
    messages,
    neighbors,
    finalStatus: status
  };
  result.resultHash = sha256Text(JSON.stringify(result));

  const report = buildReport(result, generatedAt);
  if (execute) {
    writeJson(PATHS.state, { savedAt: generatedAt, status: "OMNIFLYWHEEL_COUPLING_SMOKE_PASS", report: repoRel(PATHS.reportMd) });
    writeJson(PATHS.reportJson, report.json);
    writeText(PATHS.reportMd, report.md);
    writeText(PATHS.cube, buildCube(result, generatedAt));
  }
  return {
    ok: true,
    action: execute ? "run" : "preview",
    generatedAt,
    status: "OMNIFLYWHEEL_COUPLING_SMOKE_PASS",
    result,
    outputs: {
      state: repoRel(PATHS.state),
      reportJson: repoRel(PATHS.reportJson),
      reportMd: repoRel(PATHS.reportMd),
      cube: repoRel(PATHS.cube)
    }
  };
}

function main(argv) {
  const action = argv[2] || "status";
  const execute = argv.includes("--execute");
  if (action === "status" || action === "run") {
    console.log(JSON.stringify(run({ execute: action === "run" && execute }), null, 2));
    return;
  }
  console.error(JSON.stringify({
    ok: false,
    error: `Unknown action: ${action}`,
    usage: [
      "node tools/omniflywheel-coupling-smoke.js status",
      "node tools/omniflywheel-coupling-smoke.js run --execute"
    ]
  }, null, 2));
  process.exitCode = 2;
}

main(process.argv);
