#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const http = require("http");

const repoRoot = path.resolve(__dirname, "..", "..");
const runId = "processor-unification-20260427";
const eventId = "EVT-ACER-LIRIS-FALCON-PROCESSOR-UNIFICATION-2026-04-27";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", runId);
const promotionRoot = path.join(runRoot, "promotion-run");

const INPUTS = Object.freeze({
  fabric: path.join(runRoot, "processor-unification-fabric.v1.json"),
  queue: path.join(runRoot, "processor-unification-executor-ready-queue.v1.ndjson"),
  manifest: path.join(runRoot, "processor-unification-executor-ready-manifest.v1.json"),
  deviceIndex: path.join(repoRoot, "data", "behcs", "pid-fabric", "index", "device-pid-indicator-index-latest.json"),
  systemIndex: path.join(repoRoot, "data", "behcs", "pid-fabric", "index", "system-surface-pid-indicator-index-latest.json")
});

const OUTPUTS = Object.freeze({
  energy: path.join(promotionRoot, "energy-scheduler-inputs.v1.json"),
  lirisRequestEnvelope: path.join(promotionRoot, "liris-peer-confirmation-request-envelope.json"),
  lirisRequestPost: path.join(promotionRoot, "liris-peer-confirmation-request-post-result.json"),
  falconRoute: path.join(promotionRoot, "falcon-orbital-route-descriptor.v1.json"),
  holdRegister: path.join(promotionRoot, "firmware-driver-hold-register.v1.json"),
  supervisorRoute: path.join(promotionRoot, "supervisor-processor-route-manifest.v1.json"),
  gnnEdges: path.join(promotionRoot, "processor-gnn-edges-descriptor.v1.ndjson"),
  researchQueue: path.join(promotionRoot, "research-ingestion-pid-packets.v1.ndjson"),
  gcCleanup: path.join(promotionRoot, "processor-language-gc-cleanup.v1.json"),
  summary: path.join(promotionRoot, "processor-unification-promotion-run-summary.v1.json"),
  envelope: path.join(promotionRoot, "processor-unification-promotion-run-summary-envelope.json"),
  postResult: path.join(promotionRoot, "processor-unification-promotion-run-summary-post-result.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "processor-unification-promotion-run.v1.json"),
  index: path.join(repoRoot, "data", "behcs", "index", "processor-unification-promotion-run-index.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "processor-unification-promotion-run-map-map-mapped.v1.json"),
  cube: path.join(repoRoot, "data", "behcs", "cubes", "processor-unification-promotion-run-cube-cubed.cube.js"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "processor-unification-promotion-run-behcs256.glpj.json"),
  reportJson: path.join(repoRoot, "reports", "processor-unification-promotion-run-latest.json"),
  reportMd: path.join(repoRoot, "reports", "processor-unification-promotion-run-latest.md")
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

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readNdjson(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, "utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
}

function repoRel(filePath) {
  const relative = path.relative(repoRoot, filePath);
  if (path.isAbsolute(relative) || relative.startsWith("..")) return filePath.replace(/\\/g, "/");
  return relative.replace(/\\/g, "/");
}

function hash(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);
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
          // Keep text.
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

function recordsByKind(index, kind, limit = 32) {
  return (index.records || []).filter((row) => row.pidKind === kind).slice(0, limit)
    .map((row) => ({ pid: row.pid, label: row.label, evidenceLevel: row.evidenceLevel, category: row.category }));
}

async function run() {
  const generatedAt = new Date().toISOString();
  const fabric = readJson(INPUTS.fabric);
  const queue = readNdjson(INPUTS.queue);
  const manifest = readJson(INPUTS.manifest);
  const deviceIndex = readJson(INPUTS.deviceIndex);
  const systemIndex = readJson(INPUTS.systemIndex);
  if (!manifest.promotionAllowed) {
    throw new Error("Promotion queue is not marked promotionAllowed=true");
  }

  const acerNode = fabric.processorNodes.find((node) => node.nodeId === "acer-compute-core") || {};
  const lirisNode = fabric.processorNodes.find((node) => node.nodeId === "liris-logical-processor") || {};
  const falconNode = fabric.processorNodes.find((node) => node.nodeId === "falcon-mobile-termux-processor") || {};
  const authorityNode = fabric.processorNodes.find((node) => node.nodeId === "unison-authority-processor") || {};

  const energy = {
    id: "processor-unification-energy-scheduler-inputs.v1",
    generatedAt,
    sourceTask: queue.find((row) => row.lane === "energy-scheduler")?.taskPid || null,
    cpu: acerNode.cpu || [],
    gpu: acerNode.gpu || [],
    supportingSurfaceCounts: acerNode.supportingSurfaceCounts || {},
    schedulingPolicy: {
      heavyLocal: "acer-gpu-if-needed",
      peerWork: "LAW-001-envelope-first",
      orbitalWork: "falcon-descriptor-only-unless-authorized",
      throttle: "energy-first-no-process-fanout"
    }
  };
  writeJson(OUTPUTS.energy, energy);

  const lirisRequest = {
    verb: "processor-unification-liris-peer-confirmation-request",
    target: "liris",
    from: "acer-codex",
    id: "processor-unification-2026-04-27-acer-liris-peer-confirmation-request-001",
    ts: generatedAt,
    runId,
    eventId,
    request: "Confirm Liris accepts the liris-logical-processor node and executor-ready lane as peer-owned LAW-001/file-supervisor surface.",
    lirisNode,
    requestedReplyVerb: "processor-unification-liris-peer-confirmation",
    remoteWriteAllowed: false,
    processFanout: 0,
    glyph_sentence: "META-REQUEST { LIRIS-PROCESSOR-NODE-CONFIRM } · PEER-OWNED · LAW001-FILE-SUPERVISOR · NO-REMOTE-WRITE @ M-INTERROGATIVE .",
    boundary: "Confirmation request only. No Liris file mutation."
  };
  writeJson(OUTPUTS.lirisRequestEnvelope, lirisRequest);
  const lirisRequestPost = await httpJson("POST", "http://192.168.100.2:4947/behcs/send", lirisRequest);
  writeJson(OUTPUTS.lirisRequestPost, { postedAt: new Date().toISOString(), endpoint: "http://192.168.100.2:4947/behcs/send", ...lirisRequestPost });

  const falconRoute = {
    id: "processor-unification-falcon-orbital-route-descriptor.v1",
    generatedAt,
    sourceTask: queue.find((row) => row.lane === "falcon-orbital-processor")?.taskPid || null,
    falconNode,
    routePolicy: "LAN-direct descriptor route only; preserve Acer orbital-mirror identity caveat.",
    mutationAllowed: false,
    phoneFileWriteAllowed: false
  };
  writeJson(OUTPUTS.falconRoute, falconRoute);

  const holdRegister = {
    id: "processor-unification-firmware-driver-hold-register.v1",
    generatedAt,
    sourceTask: queue.find((row) => row.lane === "firmware-driver-hold")?.taskPid || null,
    firmware: recordsByKind(deviceIndex, "firmware", 24),
    drivers: recordsByKind(systemIndex, "driver", 32),
    chips: recordsByKind(deviceIndex, "chip", 32),
    holdPolicy: "Descriptor-only until signed read-only evidence and explicit operator authority exist.",
    mutationAllowed: false,
    firmwareDumpAllowed: false,
    driverMutationAllowed: false
  };
  writeJson(OUTPUTS.holdRegister, holdRegister);

  const supervisorRoute = {
    id: "processor-unification-supervisor-route-manifest.v1",
    generatedAt,
    sourceTask: queue.find((row) => row.lane === "supervisor-routing")?.taskPid || null,
    routes: queue.map((row) => ({
      lane: row.lane,
      taskPid: row.taskPid,
      supervisorPid: row.supervisorPid,
      supervisorId: row.supervisorId,
      dispatchPid: row.dispatchPid,
      action: row.action
    }))
  };
  writeJson(OUTPUTS.supervisorRoute, supervisorRoute);

  const edgeRows = queue.map((row) => ({
    kind: "processor_unification_gnn_edge_descriptor",
    ts: generatedAt,
    from: row.taskPid,
    to: row.supervisorPid,
    relation: "supervised_by",
    lane: row.lane,
    weight: row.confidence || 0,
    descriptorOnly: true
  }));
  writeText(OUTPUTS.gnnEdges, edgeRows.map((row) => JSON.stringify(row)).join("\n"));

  const researchPackets = queue.map((row) => ({
    kind: "processor_research_ingestion_pid_packet",
    ts: generatedAt,
    taskPid: row.taskPid,
    lane: row.lane,
    supervisorPid: row.supervisorPid,
    action: row.action,
    targetResearchSurfaces: ["OpenClaw", "OpenMythos", "MLC", "Gemma4"],
    descriptorOnly: true,
    mutationAllowed: false
  }));
  writeText(OUTPUTS.researchQueue, researchPackets.map((row) => JSON.stringify(row)).join("\n"));

  const gcCleanup = {
    id: "processor-unification-language-gc-cleanup.v1",
    generatedAt,
    sourceTask: queue.find((row) => row.lane === "gc-white-room-cleanup")?.taskPid || null,
    corrections: [
      {
        issue: "federation_channel_dead false negative",
        correction: "treat as evidence mis-scoping, not real LAW-001 failure",
        status: "corrected"
      },
      {
        issue: "processor unification may be misread as physical merge",
        correction: "define as descriptor/PID/supervisor/message-route fabric",
        status: "pinned"
      },
      {
        issue: "executor-ready may be misread as executed",
        correction: "executor-ready queue rows are not task execution",
        status: "pinned"
      }
    ]
  };
  writeJson(OUTPUTS.gcCleanup, gcCleanup);

  const produced = [
    OUTPUTS.energy,
    OUTPUTS.lirisRequestEnvelope,
    OUTPUTS.falconRoute,
    OUTPUTS.holdRegister,
    OUTPUTS.supervisorRoute,
    OUTPUTS.gnnEdges,
    OUTPUTS.researchQueue,
    OUTPUTS.gcCleanup
  ];
  const summary = {
    id: "processor-unification-promotion-run-summary.v1",
    generatedAt,
    runId,
    eventId,
    status: "PROCESSOR_UNIFICATION_PROMOTION_RUN_LOCAL_ARTIFACTS_COMPLETE",
    tasksPromoted: queue.length,
    localArtifactsProduced: produced.length,
    lirisConfirmationRequestPosted: lirisRequestPost.ok,
    executorDispatchesPerformed: 0,
    remoteWritesPerformed: 0,
    processFanout: 0,
    producedArtifacts: produced.map(repoRel),
    artifactHash: hash(produced.map((filePath) => fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "")),
    authorityNode,
    boundary: "Local artifact promotion only. No remote writes, no process fanout, no executor process dispatch."
  };
  writeJson(OUTPUTS.summary, summary);

  writeJson(OUTPUTS.memory, {
    type: "behcs-memory",
    id: "memory-processor-unification-promotion-run-v1",
    generatedAt,
    runId,
    eventId,
    status: summary.status,
    summary: "Processor unification promotion run materialized local lane artifacts and requested Liris peer confirmation without remote writes or process fanout.",
    source: repoRel(OUTPUTS.summary)
  });
  writeJson(OUTPUTS.index, {
    id: "processor-unification-promotion-run-index-v1",
    generatedAt,
    keys: ["processor-unification", "promotion-run", "local-artifacts", "liris-confirmation", "no-fanout"],
    artifacts: {
      summary: repoRel(OUTPUTS.summary),
      report: repoRel(OUTPUTS.reportMd),
      map: repoRel(OUTPUTS.map),
      cube: repoRel(OUTPUTS.cube),
      glpj: repoRel(OUTPUTS.glpj)
    }
  });
  writeJson(OUTPUTS.map, {
    id: "processor-unification-promotion-run-map-map-mapped-v1",
    generatedAt,
    route: ["executor-ready-queue", "local-artifact-materialization", "liris-confirmation-request", "summary"],
    artifacts: summary.producedArtifacts
  });
  writeJson(OUTPUTS.glpj, {
    id: "processor-unification-promotion-run-behcs256-glpj-v1",
    generatedAt,
    sentences: [
      "META-PROMOTION { PROCESSOR-UNIFICATION } · LOCAL-ARTIFACTS-COMPLETE · DISPATCHES-0 @ M-EYEWITNESS .",
      "META-REQUEST { LIRIS-PEER-CONFIRMATION } · LAW001-ONLY · NO-REMOTE-WRITE @ M-INTERROGATIVE ."
    ]
  });
  const cubeObject = {
    id: "processor-unification-promotion-run-cube-cubed-v1",
    generatedAt,
    runId,
    eventId,
    status: summary.status,
    tasksPromoted: summary.tasksPromoted,
    localArtifactsProduced: summary.localArtifactsProduced,
    executorDispatchesPerformed: 0,
    remoteWritesPerformed: 0
  };
  writeText(OUTPUTS.cube, `const processorUnificationPromotionRunCube = Object.freeze(${JSON.stringify(cubeObject, null, 2)});

export const CUBE = processorUnificationPromotionRunCube;
export default processorUnificationPromotionRunCube;
`);

  const envelope = {
    verb: "processor-unification-promotion-run-summary",
    target: "liris",
    from: "acer-codex",
    id: "processor-unification-2026-04-27-acer-promotion-run-summary-001",
    ts: generatedAt,
    runId,
    eventId,
    status: summary.status,
    tasksPromoted: summary.tasksPromoted,
    localArtifactsProduced: summary.localArtifactsProduced,
    lirisConfirmationRequestPosted: summary.lirisConfirmationRequestPosted,
    executorDispatchesPerformed: 0,
    remoteWritesPerformed: 0,
    artifacts: {
      summary: repoRel(OUTPUTS.summary),
      lirisRequestEnvelope: repoRel(OUTPUTS.lirisRequestEnvelope)
    },
    glyph_sentence: "META-PROMOTION-RUN { PROCESSOR-UNIFICATION } · LOCAL-ARTIFACTS-COMPLETE · LIRIS-CONFIRMATION-REQUESTED · DISPATCHES-0 @ M-INDICATIVE .",
    boundary: summary.boundary
  };
  writeJson(OUTPUTS.envelope, envelope);
  const postResult = await httpJson("POST", "http://192.168.100.2:4947/behcs/send", envelope);
  writeJson(OUTPUTS.postResult, { postedAt: new Date().toISOString(), endpoint: "http://192.168.100.2:4947/behcs/send", ...postResult });

  const report = { reportId: "processor-unification-promotion-run-latest", generatedAt, summary, postResult };
  writeJson(OUTPUTS.reportJson, report);
  writeText(OUTPUTS.reportMd, `# Processor Unification Promotion Run

Generated: ${generatedAt}

Status: ${summary.status}

Promoted queue:
- tasks: ${summary.tasksPromoted}
- local artifacts: ${summary.localArtifactsProduced}
- Liris confirmation request posted: ${summary.lirisConfirmationRequestPosted}
- executor dispatches performed: 0
- remote writes performed: 0
- process fanout: 0

Artifacts:
${summary.producedArtifacts.map((artifact) => `- ${artifact}`).join("\n")}

Liris summary posted: ${postResult.ok}

Boundary: ${summary.boundary}
`);

  console.log(JSON.stringify({
    ok: true,
    status: summary.status,
    tasksPromoted: summary.tasksPromoted,
    localArtifactsProduced: summary.localArtifactsProduced,
    lirisConfirmationRequestPosted: summary.lirisConfirmationRequestPosted,
    lirisSummaryPosted: postResult.ok,
    executorDispatchesPerformed: 0,
    report: repoRel(OUTPUTS.reportMd)
  }, null, 2));
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
