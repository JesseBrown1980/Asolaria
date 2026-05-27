#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const http = require("http");

const repoRoot = path.resolve(__dirname, "..", "..");
const runId = "dual-computer-upgrade-20260427";
const eventId = "EVT-ACER-LIRIS-DUAL-COMPUTER-UPGRADE-2026-04-27";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", runId);
const processorRoot = path.join(repoRoot, "data", "behcs", "orchestration", "processor-unification-20260427");
const unisonRoot = path.join(repoRoot, "data", "behcs", "orchestration", "unison-liris-acer-20260426");

const LOGICAL_RUNS_PER_COMPUTER = 10_000_000_000;
const LOGICAL_BATCH_SIZE = 2_000;

const INPUTS = Object.freeze({
  processorFabric: path.join(processorRoot, "processor-unification-fabric.v1.json"),
  processorPromotion: path.join(processorRoot, "promotion-run", "processor-unification-promotion-run-summary.v1.json"),
  supervisorIndex: path.join(repoRoot, "data", "behcs", "pid-fabric", "index", "supervisor-pid-indicator-index-latest.json"),
  systemIndex: path.join(repoRoot, "data", "behcs", "pid-fabric", "index", "system-surface-pid-indicator-index-latest.json"),
  deviceIndex: path.join(repoRoot, "data", "behcs", "pid-fabric", "index", "device-pid-indicator-index-latest.json"),
  lirisInventory: path.join(unisonRoot, "inventory-liris-received.ndjson"),
  acerInventory: path.join(unisonRoot, "inventory-acer.ndjson"),
  bilateralSeal: path.join(unisonRoot, "unison-bilateral-final-seal.v1.json")
});

const OUTPUTS = Object.freeze({
  fabric: path.join(runRoot, "dual-computer-upgrade-fabric.v1.json"),
  queue: path.join(runRoot, "dual-computer-upgrade-10b-logical-queue.v1.ndjson"),
  supervisorDispatch: path.join(runRoot, "dual-computer-upgrade-supervisor-dispatch.v1.ndjson"),
  candidateFile: path.join(runRoot, "dual-computer-upgrade-behcs-v6-candidates.json"),
  lirisEnvelope: path.join(runRoot, "dual-computer-upgrade-liris-plan-envelope.json"),
  lirisPost: path.join(runRoot, "dual-computer-upgrade-liris-plan-post-result.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "dual-computer-upgrade.v1.json"),
  index: path.join(repoRoot, "data", "behcs", "index", "dual-computer-upgrade-index.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "dual-computer-upgrade-map-map-mapped.v1.json"),
  cube: path.join(repoRoot, "data", "behcs", "cubes", "dual-computer-upgrade-cube-cubed.cube.js"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "dual-computer-upgrade-behcs256.glpj.json"),
  reportJson: path.join(repoRoot, "reports", "dual-computer-upgrade-latest.json"),
  reportMd: path.join(repoRoot, "reports", "dual-computer-upgrade-latest.md")
});

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeText(filePath, text) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, text.endsWith("\n") ? text : `${text}\n`, "utf8");
}

function writeJson(filePath, value) {
  writeText(filePath, JSON.stringify(value, null, 2));
}

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_error) {
    return fallback;
  }
}

function readNdjson(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, "utf8").split(/\r?\n/).filter(Boolean).map((line) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      return { parseError: error.message };
    }
  }).filter((row) => !row.parseError);
}

function repoRel(filePath) {
  const relative = path.relative(repoRoot, filePath);
  if (path.isAbsolute(relative) || relative.startsWith("..")) return filePath.replace(/\\/g, "/");
  return relative.replace(/\\/g, "/");
}

function pid(namespace, seed) {
  return `${namespace}.${crypto.createHash("sha256").update(seed).digest("hex").slice(0, 12).toUpperCase()}`;
}

function httpJson(method, url, body = null) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const payload = body ? Buffer.from(JSON.stringify(body), "utf8") : null;
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path: `${parsed.pathname}${parsed.search}`,
      method,
      headers: payload ? {
        "content-type": "application/json",
        "content-length": payload.length,
        connection: "close"
      } : { connection: "close" },
      timeout: 10000
    }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        let responseBody = text;
        try {
          responseBody = JSON.parse(text);
        } catch (_error) {
          // Keep raw text.
        }
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode, body: responseBody });
      });
    });
    req.on("timeout", () => req.destroy(new Error("request_timeout")));
    req.on("error", (error) => resolve({ ok: false, error: error.message }));
    if (payload) req.write(payload);
    req.end();
  });
}

function pickSupervisor(supervisorIndex, needle) {
  const supervisors = supervisorIndex.supervisors || [];
  return supervisors.find((row) => {
    const text = `${row.setId} ${row.supervisorId} ${row.title} ${row.role} ${row.sourceFile}`.toLowerCase();
    return text.includes(String(needle).toLowerCase());
  }) || supervisors[0] || {
    indicatorPid: "BH.SUP.IND.000000000000",
    nativePid: null,
    supervisorId: "missing-supervisor",
    title: "missing supervisor",
    setId: "missing"
  };
}

function buildLaneSpecs() {
  return [
    {
      lane: "proof-health-baseline",
      supervisorNeedle: "hermes",
      objective: "Snapshot health, ports, processor fabric, build readiness, and proof anchors before any upgrade.",
      cube: 29791
    },
    {
      lane: "dependency-build-test",
      supervisorNeedle: "system-review",
      objective: "Plan bounded build/test passes and dependency checks, with installs blocked unless separately approved.",
      cube: 50653
    },
    {
      lane: "supervisor-sync",
      supervisorNeedle: "supervisor",
      objective: "Refresh supervisor PID awareness and dispatch routes across Acer and Liris.",
      cube: 3581577
    },
    {
      lane: "behcs-language-cube-index",
      supervisorNeedle: "base-os",
      objective: "Align BEHCS-256 language, map-map-mapped, cube-cube-cubed, GLPJ, memory, and index surfaces.",
      cube: 704969
    },
    {
      lane: "openclaw-openmythos-integration",
      supervisorNeedle: "openclaw",
      objective: "Feed upgrade deltas into OpenClaw/OpenMythos/MLC/Gemma research lanes as descriptor packets.",
      cube: 704969
    },
    {
      lane: "gnn-omnishannon-reverse-gain",
      supervisorNeedle: "gnn",
      objective: "Route upgrade candidates through GNN, OmniShannon, Shannon, and reverse-gain review.",
      cube: 3307949
    },
    {
      lane: "mcp-agent-profile-policy",
      supervisorNeedle: "mcp",
      objective: "Ensure agent profiles route MCP through Asolaria BEHCS-256 surfaces only.",
      cube: 571787
    },
    {
      lane: "dirty-worktree-cleanup",
      supervisorNeedle: "targeted",
      objective: "Classify dirty files into owned lanes before edits, staging, or commits.",
      cube: 6859
    },
    {
      lane: "energy-scheduler-open-code",
      supervisorNeedle: "model",
      objective: "Use local/free OpenCode model descriptors only when evidence exists; schedule by energy, not token claims.",
      cube: 79507
    },
    {
      lane: "gc-white-room-significance",
      supervisorNeedle: "gc",
      objective: "Clean language confusion, preserve significance, and block overclaiming.",
      cube: 7189057
    }
  ];
}

function buildComputerPlan(computer, node, laneSpecs, supervisorIndex, context) {
  const logicalRunsPerLane = LOGICAL_RUNS_PER_COMPUTER / laneSpecs.length;
  return laneSpecs.map((spec, index) => {
    const supervisor = pickSupervisor(supervisorIndex, spec.supervisorNeedle);
    const taskPid = pid("BH.UPGRADE.TASK", `${computer}:${spec.lane}:${index}`);
    return {
      kind: "dual_computer_upgrade_task",
      taskPid,
      sequence: index + 1,
      runId,
      eventId,
      computer,
      nodePid: node.nodePid,
      nodeId: node.nodeId,
      lane: spec.lane,
      supervisorPid: supervisor.indicatorPid,
      nativeSupervisorPid: supervisor.nativePid || null,
      supervisorId: supervisor.supervisorId,
      objective: spec.objective,
      cube: spec.cube,
      logicalRuns: logicalRunsPerLane,
      logicalBatchSize: LOGICAL_BATCH_SIZE,
      logicalBatches: Math.ceil(logicalRunsPerLane / LOGICAL_BATCH_SIZE),
      bigPickleMode: "logical_coverage_not_process_fanout",
      modelRoute: {
        preferred: "opencode_free_or_local_descriptor",
        liveModelCalls: 0,
        authBypass: false,
        requiredEvidenceBeforeUse: ["installed_cli_or_local_runtime", "allowed_model_descriptor", "supervisor_gate", "small_tranche_smoke"]
      },
      processorUse: {
        acer: computer === "acer" ? ["cpu", "gpu", "local_tools", "local_behcs_bus"] : ["law001_peer_route"],
        liris: computer === "liris" ? ["peer_cpu_gpu_unknown_descriptor", "file_supervisor_commit2", "law001_bus"] : ["law001_peer_route"]
      },
      inputs: context.inputs,
      mutationAllowed: false,
      remoteWriteAllowed: false,
      processFanout: 0,
      externalCalls: 0,
      executorDispatches: 0,
      promotionGate: computer === "liris"
        ? "LIRIS_PEER_CONFIRMATION_REQUIRED_BEFORE_LIRIS_LOCAL_EXECUTION"
        : "ACER_LOCAL_ARTIFACT_EXECUTION_ONLY",
      d11: "TASK_READY_DUAL_COMPUTER_UPGRADE_SUPERVISED"
    };
  });
}

async function run() {
  const generatedAt = new Date().toISOString();
  const processorFabric = readJson(INPUTS.processorFabric, { processorNodes: [] });
  const processorPromotion = readJson(INPUTS.processorPromotion, {});
  const supervisorIndex = readJson(INPUTS.supervisorIndex, { supervisors: [] });
  const systemIndex = readJson(INPUTS.systemIndex, { counts: {} });
  const deviceIndex = readJson(INPUTS.deviceIndex, { counts: {} });
  const bilateralSeal = readJson(INPUTS.bilateralSeal, {});
  const lirisInventory = readNdjson(INPUTS.lirisInventory);
  const acerInventory = readNdjson(INPUTS.acerInventory);
  const acerNode = processorFabric.processorNodes.find((node) => node.nodeId === "acer-compute-core") || { nodeId: "acer-compute-core", nodePid: "BH.PROC.NODE.ACER.MISSING" };
  const lirisNode = processorFabric.processorNodes.find((node) => node.nodeId === "liris-logical-processor") || { nodeId: "liris-logical-processor", nodePid: "BH.PROC.NODE.LIRIS.MISSING" };
  const laneSpecs = buildLaneSpecs();
  const context = {
    inputs: {
      processorFabric: repoRel(INPUTS.processorFabric),
      processorPromotion: repoRel(INPUTS.processorPromotion),
      bilateralSeal: bilateralSeal.sha256 || processorFabric.bilateralSealSha256 || null
    }
  };
  const acerQueue = buildComputerPlan("acer", acerNode, laneSpecs, supervisorIndex, context);
  const lirisQueue = buildComputerPlan("liris", lirisNode, laneSpecs, supervisorIndex, context);
  const queue = [...acerQueue, ...lirisQueue];

  const fabric = {
    id: "dual-computer-upgrade-fabric.v1",
    generatedAt,
    runId,
    eventId,
    status: "DUAL_COMPUTER_UPGRADE_ORCHESTRATED_20B_LOGICAL_READY",
    logicalRunsPerComputer: LOGICAL_RUNS_PER_COMPUTER,
    totalLogicalRuns: LOGICAL_RUNS_PER_COMPUTER * 2,
    logicalBatchSize: LOGICAL_BATCH_SIZE,
    logicalBatchesPerComputer: Math.ceil(LOGICAL_RUNS_PER_COMPUTER / LOGICAL_BATCH_SIZE),
    computers: [
      {
        id: "acer",
        node: acerNode,
        inventoryRows: acerInventory.length,
        systemSurfaceRecords: systemIndex.counts?.totalRecords || 0,
        devicePidRecords: deviceIndex.counts?.totalRecords || 0,
        executionScope: "local_artifact_upgrade"
      },
      {
        id: "liris",
        node: lirisNode,
        inventoryRows: lirisInventory.length,
        commit2: lirisNode.commit2 || {},
        executionScope: "peer_owned_liris_local_execution_after_confirmation"
      }
    ],
    modelPolicy: {
      requestedFamily: "free_open_code_models",
      posture: "descriptor_and_queue_only_until_evidence",
      liveModelCallsThisPass: 0,
      authBypass: false,
      noHeaderBypass: false,
      allowedPath: "existing local/free model surfaces only, through supervisor-gated small tranches"
    },
    sourceProcessorPromotion: processorPromotion.status || null,
    truthBoundary: "20B is logical coverage split across supervised lanes, not 20B OS processes or live model sessions."
  };
  writeJson(OUTPUTS.fabric, fabric);
  writeText(OUTPUTS.queue, queue.map((row) => JSON.stringify(row)).join("\n"));
  writeText(OUTPUTS.supervisorDispatch, queue.map((row) => JSON.stringify({
    kind: "dual_computer_upgrade_supervisor_dispatch",
    dispatchPid: pid("BH.UPGRADE.DISPATCH", row.taskPid),
    taskPid: row.taskPid,
    computer: row.computer,
    lane: row.lane,
    supervisorPid: row.supervisorPid,
    supervisorId: row.supervisorId,
    verdict: "WORKER_READY_LOGICAL_COVERAGE_QUEUE",
    mutationAllowed: false,
    processFanout: 0,
    externalCalls: 0
  })).join("\n"));

  const candidateFile = {
    vote_id: "DUAL-COMPUTER-UPGRADE-V6-20260427",
    mode: "dual-computer-upgrade-candidate-file",
    taskId: runId,
    planId: "dual-computer-upgrade-fabric.v1",
    generatedAt,
    purpose: "Run Acer and Liris 10B-logical upgrade lanes through BEHCS v6 as planning evidence only.",
    waveShape: "big-pickle logical 10B per computer x BEHCS-v6 x omnishannon x GNN",
    chain: "processor-unification -> dual-upgrade-queue -> BEHCS-v6-cascade -> peer-confirmation",
    executionPolicy: {
      planningOnly: true,
      spawnWorkers: false,
      executorDispatches: false
    },
    candidates: queue.map((row) => ({
      id: `${row.computer}-${row.lane}`,
      label: `${row.computer} upgrade lane ${row.sequence}: ${row.lane}`,
      action: "evaluate_dual_computer_upgrade_lane",
      target: row.nodeId,
      cube: row.cube,
      primary_cube: row.cube,
      expected_outcome: row.objective,
      next_step: "Promote only local artifact tranches or peer-owned Liris execution after confirmation.",
      metadata: {
        scope_hours: 0.5,
        computer: row.computer,
        taskPid: row.taskPid,
        supervisorPid: row.supervisorPid,
        logicalRuns: row.logicalRuns,
        logicalBatches: row.logicalBatches,
        liveModelCalls: 0,
        processFanout: 0,
        remoteWriteAllowed: false,
        proof_artifact: repoRel(OUTPUTS.fabric)
      }
    }))
  };
  writeJson(OUTPUTS.candidateFile, candidateFile);

  const memory = {
    type: "behcs-memory",
    id: "memory-dual-computer-upgrade-v1",
    generatedAt,
    runId,
    eventId,
    status: fabric.status,
    summary: "Acer and Liris upgrade lanes are orchestrated as 10B logical coverage per computer with supervisor-gated local/peer queues and no live model/process storm.",
    source: repoRel(OUTPUTS.fabric)
  };
  const index = {
    id: "dual-computer-upgrade-index-v1",
    generatedAt,
    keys: ["dual-computer-upgrade", "acer", "liris", "10b-logical", "opencode-free-descriptor", "big-pickle"],
    artifacts: {
      fabric: repoRel(OUTPUTS.fabric),
      queue: repoRel(OUTPUTS.queue),
      supervisorDispatch: repoRel(OUTPUTS.supervisorDispatch),
      candidateFile: repoRel(OUTPUTS.candidateFile),
      report: repoRel(OUTPUTS.reportMd),
      map: repoRel(OUTPUTS.map),
      cube: repoRel(OUTPUTS.cube),
      glpj: repoRel(OUTPUTS.glpj)
    }
  };
  const map = {
    id: "dual-computer-upgrade-map-map-mapped-v1",
    generatedAt,
    route: ["processor-unification", "10b-logical-split", "supervisor-dispatch", "free-open-code-descriptor-policy", "behcs-v6-candidate-file", "liris-law001-plan"],
    queue: queue.map((row) => ({ taskPid: row.taskPid, computer: row.computer, lane: row.lane, supervisorPid: row.supervisorPid }))
  };
  const glpj = {
    id: "dual-computer-upgrade-behcs256-glpj-v1",
    generatedAt,
    sentences: [
      "META-UPGRADE { ACER } · 10B-LOGICAL · LOCAL-PROCESSOR-LANES · SUPERVISOR-GATED @ M-INDICATIVE .",
      "META-UPGRADE { LIRIS } · 10B-LOGICAL · PEER-OWNED-LANES · LAW001-CONFIRMATION-FIRST @ M-INTERROGATIVE .",
      "META-MODEL { OPEN-CODE-FREE } · DESCRIPTOR-ONLY-UNTIL-EVIDENCE · LIVE-CALLS-0 · AUTH-BYPASS-FALSE @ M-IMPERATIVE ."
    ]
  };
  writeJson(OUTPUTS.memory, memory);
  writeJson(OUTPUTS.index, index);
  writeJson(OUTPUTS.map, map);
  writeJson(OUTPUTS.glpj, glpj);
  const cubeObject = {
    id: "dual-computer-upgrade-cube-cubed-v1",
    generatedAt,
    runId,
    eventId,
    status: fabric.status,
    logicalRunsPerComputer: LOGICAL_RUNS_PER_COMPUTER,
    totalLogicalRuns: LOGICAL_RUNS_PER_COMPUTER * 2,
    taskCount: queue.length,
    modelLiveCalls: 0,
    processFanout: 0
  };
  writeText(OUTPUTS.cube, `const dualComputerUpgradeCube = Object.freeze(${JSON.stringify(cubeObject, null, 2)});

export const CUBE = dualComputerUpgradeCube;
export default dualComputerUpgradeCube;
`);

  const lirisEnvelope = {
    verb: "dual-computer-upgrade-plan",
    target: "liris",
    from: "acer-codex",
    id: "dual-computer-upgrade-2026-04-27-acer-plan-001",
    ts: generatedAt,
    runId,
    eventId,
    status: fabric.status,
    request: "Confirm or mirror the Liris-owned 10B logical upgrade lanes locally on Liris. Acer will not write Liris files.",
    lirisTaskCount: lirisQueue.length,
    acerTaskCount: acerQueue.length,
    logicalRunsPerComputer: LOGICAL_RUNS_PER_COMPUTER,
    modelPolicy: fabric.modelPolicy,
    artifacts: {
      fabric: repoRel(OUTPUTS.fabric),
      queue: repoRel(OUTPUTS.queue),
      candidateFile: repoRel(OUTPUTS.candidateFile)
    },
    glyph_sentence: "META-UPGRADE-PLAN { ACER+LIRIS } · 10B-LOGICAL-EACH · SUPERVISOR-GATED · OPEN-CODE-DESCRIPTOR-ONLY · LAW001-PEER-CONFIRM @ M-INTERROGATIVE .",
    boundary: fabric.truthBoundary
  };
  writeJson(OUTPUTS.lirisEnvelope, lirisEnvelope);
  const lirisPost = await httpJson("POST", "http://192.168.100.2:4947/behcs/send", lirisEnvelope);
  writeJson(OUTPUTS.lirisPost, { postedAt: new Date().toISOString(), endpoint: "http://192.168.100.2:4947/behcs/send", ...lirisPost });

  const report = {
    reportId: "dual-computer-upgrade-latest",
    generatedAt,
    fabric,
    queue,
    lirisPost
  };
  writeJson(OUTPUTS.reportJson, report);
  writeText(OUTPUTS.reportMd, `# Dual Computer Upgrade Orchestration

Generated: ${generatedAt}

Status: ${fabric.status}

Coverage:
- Acer logical runs: ${LOGICAL_RUNS_PER_COMPUTER}
- Liris logical runs: ${LOGICAL_RUNS_PER_COMPUTER}
- Total logical runs: ${LOGICAL_RUNS_PER_COMPUTER * 2}
- Task rows: ${queue.length}
- Logical batch size: ${LOGICAL_BATCH_SIZE}

Model policy:
- requested family: free/open-code/local descriptors
- live model calls this pass: 0
- auth bypass: false
- no-header bypass: false

Computers:
- Acer: ${acerQueue.length} lanes, inventory rows ${acerInventory.length}, system surfaces ${systemIndex.counts?.totalRecords || 0}
- Liris: ${lirisQueue.length} lanes, inventory rows ${lirisInventory.length}, commit2 exposed ${Boolean(lirisNode.commit2?.commit2NetworkExposed)}

Liris plan posted: ${lirisPost.ok}

Boundary: ${fabric.truthBoundary}
`);

  console.log(JSON.stringify({
    ok: true,
    status: fabric.status,
    acerTasks: acerQueue.length,
    lirisTasks: lirisQueue.length,
    logicalRunsPerComputer: LOGICAL_RUNS_PER_COMPUTER,
    totalLogicalRuns: LOGICAL_RUNS_PER_COMPUTER * 2,
    liveModelCalls: 0,
    processFanout: 0,
    lirisPlanPosted: lirisPost.ok,
    report: repoRel(OUTPUTS.reportMd)
  }, null, 2));
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
