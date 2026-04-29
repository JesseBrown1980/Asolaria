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
const votePath = path.join(repoRoot, "data", "votes", "PROCESSOR-UNIFICATION-V6-20260427", "behcs-v6-candidate-file.json");

const INPUTS = Object.freeze({
  lanes: path.join(runRoot, "processor-unification-lanes.v1.ndjson"),
  dispatch: path.join(runRoot, "processor-unification-supervisor-dispatch.v1.ndjson"),
  cascadeIntegration: path.join(runRoot, "processor-unification-cascade-integration.v1.json"),
  vote: votePath
});

const OUTPUTS = Object.freeze({
  queue: path.join(runRoot, "processor-unification-executor-ready-queue.v1.ndjson"),
  manifest: path.join(runRoot, "processor-unification-executor-ready-manifest.v1.json"),
  envelope: path.join(runRoot, "processor-unification-executor-ready-summary-envelope.json"),
  postResult: path.join(runRoot, "processor-unification-executor-ready-summary-post-result.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "processor-unification-executor-ready.v1.json"),
  index: path.join(repoRoot, "data", "behcs", "index", "processor-unification-executor-ready-index.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "processor-unification-executor-ready-map-map-mapped.v1.json"),
  cube: path.join(repoRoot, "data", "behcs", "cubes", "processor-unification-executor-ready-cube-cubed.cube.js"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "processor-unification-executor-ready-behcs256.glpj.json"),
  reportJson: path.join(repoRoot, "reports", "processor-unification-executor-ready-latest.json"),
  reportMd: path.join(repoRoot, "reports", "processor-unification-executor-ready-latest.md")
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

function pid(namespace, seed) {
  return `${namespace}.${crypto.createHash("sha256").update(seed).digest("hex").slice(0, 12).toUpperCase()}`;
}

function laneAction(lane) {
  const actions = {
    "energy-scheduler": {
      action: "materialize_energy_scheduler_inputs",
      writeScope: ["data/behcs/orchestration/processor-unification-20260427"],
      remoteAuthorityRequired: false
    },
    "liris-peer-processor": {
      action: "request_liris_peer_side_confirmation",
      writeScope: ["LAW-001 envelope only"],
      remoteAuthorityRequired: true
    },
    "falcon-orbital-processor": {
      action: "keep_falcon_orbital_route_descriptor_current",
      writeScope: ["data/behcs/orchestration/processor-unification-20260427"],
      remoteAuthorityRequired: false
    },
    "firmware-driver-hold": {
      action: "preserve_firmware_driver_hold_register",
      writeScope: ["data/behcs/orchestration/processor-unification-20260427"],
      remoteAuthorityRequired: false
    },
    "supervisor-routing": {
      action: "refresh_supervisor_processor_route_manifest",
      writeScope: ["data/behcs/orchestration/processor-unification-20260427"],
      remoteAuthorityRequired: false
    },
    "gnn-omnishannon-check": {
      action: "append_processor_gnn_edges_descriptor_only",
      writeScope: ["data/behcs/orchestration/processor-unification-20260427"],
      remoteAuthorityRequired: false
    },
    "openclaw-openmythos-research-feed": {
      action: "publish_processor_pid_packets_to_research_ingestion_queue",
      writeScope: ["data/behcs/orchestration/processor-unification-20260427"],
      remoteAuthorityRequired: false
    },
    "gc-white-room-cleanup": {
      action: "clean_processor_language_confusion_without_deleting_truth",
      writeScope: ["data/behcs/orchestration/processor-unification-20260427"],
      remoteAuthorityRequired: false
    }
  };
  return actions[lane.lane] || {
    action: "review_processor_lane",
    writeScope: ["data/behcs/orchestration/processor-unification-20260427"],
    remoteAuthorityRequired: false
  };
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

async function run() {
  const generatedAt = new Date().toISOString();
  const lanes = readNdjson(INPUTS.lanes);
  const dispatch = readNdjson(INPUTS.dispatch);
  const integration = readJson(INPUTS.cascadeIntegration);
  const vote = readJson(INPUTS.vote);
  const verdictByLane = Object.fromEntries((vote.results || []).map((row) => [row.candidate_id, row]));
  const dispatchByLanePid = Object.fromEntries(dispatch.map((row) => [row.lanePid, row]));
  const canPromote = integration.status === "PROCESSOR_UNIFICATION_CASCADED_READY_PLANNING_ONLY"
    && vote.liveState?.federationAlive === true
    && (vote.results || []).every((row) => row.verdict === "PROCEED");
  const queue = lanes.map((lane, index) => {
    const action = laneAction(lane);
    const verdict = verdictByLane[lane.lane] || {};
    const supervisorDispatch = dispatchByLanePid[lane.lanePid] || {};
    return {
      kind: "processor_unification_executor_ready_task",
      taskPid: pid("BH.PROC.EXECREADY", `${lane.lanePid}:${generatedAt}`),
      sequence: index + 1,
      runId,
      eventId,
      lanePid: lane.lanePid,
      lane: lane.lane,
      supervisorPid: lane.supervisorPid,
      supervisorId: lane.supervisorId,
      dispatchPid: supervisorDispatch.dispatchPid || null,
      verdict: verdict.verdict || "UNKNOWN",
      confidence: verdict.avgConfidence || null,
      action: action.action,
      writeScope: action.writeScope,
      remoteAuthorityRequired: action.remoteAuthorityRequired,
      executionMode: "executor_ready_queue_only",
      mutationAllowed: false,
      remoteWriteAllowed: false,
      processFanout: 0,
      externalCalls: 0,
      promotionAllowed: canPromote,
      promotionGate: canPromote
        ? "READY_FOR_EXPLICIT_PROMOTION_RUN"
        : "HOLD_UNTIL_CASCADE_AND_FEDERATION_GREEN",
      boundary: "Queue row only. This does not execute the action."
    };
  });
  writeText(OUTPUTS.queue, queue.map((row) => JSON.stringify(row)).join("\n"));
  const manifest = {
    id: "processor-unification-executor-ready-manifest.v1",
    generatedAt,
    runId,
    eventId,
    status: canPromote
      ? "PROCESSOR_UNIFICATION_EXECUTOR_READY_QUEUE_EMITTED"
      : "PROCESSOR_UNIFICATION_EXECUTOR_QUEUE_HOLD",
    taskCount: queue.length,
    promotionAllowed: canPromote,
    executorDispatchesPerformed: 0,
    voteId: vote.vote_id,
    federationAlive: vote.liveState?.federationAlive,
    verdictCounts: queue.reduce((acc, row) => {
      acc[row.verdict] = (acc[row.verdict] || 0) + 1;
      return acc;
    }, {}),
    queue: repoRel(OUTPUTS.queue),
    boundary: "Executor-ready queue only; no tasks executed, no remote write, no process fanout."
  };
  writeJson(OUTPUTS.manifest, manifest);
  writeJson(OUTPUTS.memory, {
    type: "behcs-memory",
    id: "memory-processor-unification-executor-ready-v1",
    generatedAt,
    runId,
    eventId,
    status: manifest.status,
    summary: "Processor unification lanes are now executor-ready as queue rows, with execution still requiring an explicit promotion run.",
    source: repoRel(OUTPUTS.manifest)
  });
  writeJson(OUTPUTS.index, {
    id: "processor-unification-executor-ready-index-v1",
    generatedAt,
    keys: ["processor-unification", "executor-ready", "supervisor-dispatch", "planning-only"],
    artifacts: {
      manifest: repoRel(OUTPUTS.manifest),
      queue: repoRel(OUTPUTS.queue),
      report: repoRel(OUTPUTS.reportMd),
      map: repoRel(OUTPUTS.map),
      cube: repoRel(OUTPUTS.cube),
      glpj: repoRel(OUTPUTS.glpj)
    }
  });
  writeJson(OUTPUTS.map, {
    id: "processor-unification-executor-ready-map-map-mapped-v1",
    generatedAt,
    route: ["cascade-proceed", "supervisor-dispatch", "executor-ready-queue", "explicit-promotion-gate"],
    queue: queue.map((row) => ({
      taskPid: row.taskPid,
      lane: row.lane,
      supervisorPid: row.supervisorPid,
      promotionAllowed: row.promotionAllowed
    }))
  });
  writeJson(OUTPUTS.glpj, {
    id: "processor-unification-executor-ready-behcs256-glpj-v1",
    generatedAt,
    sentences: [
      "META-QUEUE { PROCESSOR-UNIFICATION-EXECUTOR } · 8-LANES · WORKER-READY · DISPATCHES-0 @ M-INDICATIVE .",
      "META-GATE { EXPLICIT-PROMOTION-RUN } · REQUIRED-BEFORE-MUTATION · LAW001-AND-SUPERVISOR-BOUND @ M-IMPERATIVE ."
    ]
  });
  const cubeObject = {
    id: "processor-unification-executor-ready-cube-cubed-v1",
    generatedAt,
    runId,
    eventId,
    status: manifest.status,
    taskCount: manifest.taskCount,
    promotionAllowed: manifest.promotionAllowed,
    executorDispatchesPerformed: 0,
    lanes: queue.map((row) => ({ taskPid: row.taskPid, lane: row.lane, supervisorPid: row.supervisorPid }))
  };
  writeText(OUTPUTS.cube, `const processorUnificationExecutorReadyCube = Object.freeze(${JSON.stringify(cubeObject, null, 2)});

export const CUBE = processorUnificationExecutorReadyCube;
export default processorUnificationExecutorReadyCube;
`);

  const envelope = {
    verb: "processor-unification-executor-ready-summary",
    target: "liris",
    from: "acer-codex",
    id: "processor-unification-2026-04-27-acer-executor-ready-summary-001",
    ts: generatedAt,
    runId,
    eventId,
    status: manifest.status,
    taskCount: manifest.taskCount,
    promotionAllowed: manifest.promotionAllowed,
    executorDispatchesPerformed: 0,
    artifacts: {
      manifest: repoRel(OUTPUTS.manifest),
      queue: repoRel(OUTPUTS.queue)
    },
    glyph_sentence: "META-QUEUE { PROCESSOR-UNIFICATION } · EXECUTOR-READY · 8-LANES · PROMOTION-EXPLICIT · DISPATCHES-0 @ M-INDICATIVE .",
    boundary: manifest.boundary
  };
  writeJson(OUTPUTS.envelope, envelope);
  const postResult = await httpJson("POST", "http://192.168.100.2:4947/behcs/send", envelope);
  writeJson(OUTPUTS.postResult, { postedAt: new Date().toISOString(), endpoint: "http://192.168.100.2:4947/behcs/send", ...postResult });
  const report = { reportId: "processor-unification-executor-ready-latest", generatedAt, manifest, queue, postResult };
  writeJson(OUTPUTS.reportJson, report);
  writeText(OUTPUTS.reportMd, `# Processor Unification Executor Ready

Generated: ${generatedAt}

Status: ${manifest.status}

Queue:
- tasks: ${queue.length}
- promotion allowed: ${manifest.promotionAllowed}
- executor dispatches performed: 0
- federation alive: ${manifest.federationAlive}
- verdicts: ${JSON.stringify(manifest.verdictCounts)}

Lanes:
${queue.map((row) => `- ${row.sequence}. ${row.lane}: ${row.action} (${row.promotionGate})`).join("\n")}

Liris summary posted: ${postResult.ok}

Boundary: ${manifest.boundary}
`);

  console.log(JSON.stringify({
    ok: true,
    status: manifest.status,
    taskCount: queue.length,
    promotionAllowed: manifest.promotionAllowed,
    executorDispatchesPerformed: 0,
    lirisSummaryPosted: postResult.ok,
    report: repoRel(OUTPUTS.reportMd)
  }, null, 2));
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
