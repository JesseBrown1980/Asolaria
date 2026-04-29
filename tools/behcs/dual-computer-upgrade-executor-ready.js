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

const INPUTS = Object.freeze({
  queue: path.join(runRoot, "dual-computer-upgrade-10b-logical-queue.v1.ndjson"),
  cascadeIntegration: path.join(runRoot, "dual-computer-upgrade-cascade-integration.v1.json")
});

const OUTPUTS = Object.freeze({
  executorReady: path.join(runRoot, "dual-computer-upgrade-executor-ready.v1.ndjson"),
  manifest: path.join(runRoot, "dual-computer-upgrade-executor-ready-manifest.v1.json"),
  envelope: path.join(runRoot, "dual-computer-upgrade-executor-ready-envelope.json"),
  postResult: path.join(runRoot, "dual-computer-upgrade-executor-ready-post-result.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "dual-computer-upgrade-executor-ready.v1.json"),
  index: path.join(repoRoot, "data", "behcs", "index", "dual-computer-upgrade-executor-ready-index.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "dual-computer-upgrade-executor-ready-map-map-mapped.v1.json"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "dual-computer-upgrade-executor-ready-behcs256.glpj.json"),
  reportJson: path.join(repoRoot, "reports", "dual-computer-upgrade-executor-ready-latest.json"),
  reportMd: path.join(repoRoot, "reports", "dual-computer-upgrade-executor-ready-latest.md")
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

async function run() {
  const generatedAt = new Date().toISOString();
  const queue = readNdjson(INPUTS.queue);
  const cascade = readJson(INPUTS.cascadeIntegration);
  const proceed = cascade.status === "DUAL_COMPUTER_UPGRADE_CASCADED_READY_PLANNING_ONLY"
    && cascade.verdictCounts?.PROCEED === queue.length;
  const rows = queue.map((row) => {
    const isAcer = row.computer === "acer";
    const isOpenCodeLane = row.lane === "energy-scheduler-open-code";
    return {
      kind: "dual_computer_upgrade_executor_ready_task",
      readyPid: pid("BH.DUALUP.EXECREADY", row.taskPid),
      runId,
      eventId,
      sourceTaskPid: row.taskPid,
      computer: row.computer,
      lane: row.lane,
      supervisorPid: row.supervisorPid,
      supervisorId: row.supervisorId,
      logicalRuns: row.logicalRuns,
      logicalBatches: row.logicalBatches,
      executionOwner: row.computer,
      promotionAllowed: proceed && isAcer,
      lirisPeerConfirmationRequired: row.computer === "liris",
      modelEvidenceRequired: isOpenCodeLane,
      executionMode: isAcer ? "acer_local_artifact_promotion_ready" : "liris_peer_owned_execution_handoff",
      mutationAllowed: false,
      remoteWriteAllowed: false,
      processFanout: 0,
      liveModelCalls: 0,
      externalCalls: 0,
      gate: isAcer
        ? "ACER_LOCAL_PROMOTION_ALLOWED_WITH_NO_REMOTE_WRITE"
        : "WAIT_FOR_LIRIS_LOCAL_CONFIRMATION"
    };
  });
  writeText(OUTPUTS.executorReady, rows.map((row) => JSON.stringify(row)).join("\n"));
  const manifest = {
    id: "dual-computer-upgrade-executor-ready-manifest.v1",
    generatedAt,
    runId,
    eventId,
    status: proceed ? "DUAL_COMPUTER_UPGRADE_EXECUTOR_READY_SPLIT_EMITTED" : "DUAL_COMPUTER_UPGRADE_EXECUTOR_READY_HOLD",
    taskCount: rows.length,
    acerReady: rows.filter((row) => row.computer === "acer" && row.promotionAllowed).length,
    lirisHandoff: rows.filter((row) => row.computer === "liris").length,
    liveModelCalls: 0,
    processFanout: 0,
    remoteWrites: 0,
    queue: repoRel(OUTPUTS.executorReady),
    boundary: "Executor-ready split only. Acer lanes may be locally promoted later; Liris lanes require Liris local confirmation. No task execution here."
  };
  writeJson(OUTPUTS.manifest, manifest);
  writeJson(OUTPUTS.memory, {
    type: "behcs-memory",
    id: "memory-dual-computer-upgrade-executor-ready-v1",
    generatedAt,
    runId,
    eventId,
    status: manifest.status,
    summary: "Dual-computer upgrade has a split executor-ready queue: Acer lanes ready for local artifact promotion; Liris lanes handed off for peer-owned confirmation.",
    source: repoRel(OUTPUTS.manifest)
  });
  writeJson(OUTPUTS.index, {
    id: "dual-computer-upgrade-executor-ready-index-v1",
    generatedAt,
    keys: ["dual-computer-upgrade", "executor-ready", "acer-local", "liris-handoff", "10b-logical"],
    artifacts: {
      manifest: repoRel(OUTPUTS.manifest),
      queue: repoRel(OUTPUTS.executorReady),
      report: repoRel(OUTPUTS.reportMd),
      map: repoRel(OUTPUTS.map),
      glpj: repoRel(OUTPUTS.glpj)
    }
  });
  writeJson(OUTPUTS.map, {
    id: "dual-computer-upgrade-executor-ready-map-map-mapped-v1",
    generatedAt,
    route: ["20-proceed-cascade", "executor-ready-split", "acer-local-ready", "liris-peer-handoff"],
    rows: rows.map((row) => ({ readyPid: row.readyPid, computer: row.computer, lane: row.lane, gate: row.gate }))
  });
  writeJson(OUTPUTS.glpj, {
    id: "dual-computer-upgrade-executor-ready-behcs256-glpj-v1",
    generatedAt,
    sentences: [
      "META-QUEUE { DUAL-COMPUTER-UPGRADE } · EXECUTOR-READY-SPLIT · ACER-LOCAL-READY · LIRIS-HANDOFF @ M-INDICATIVE .",
      "META-GATE { OPEN-CODE-MODEL-LANES } · MODEL-EVIDENCE-REQUIRED · LIVE-CALLS-0 · PROCESS-FANOUT-0 @ M-IMPERATIVE ."
    ]
  });
  const envelope = {
    verb: "dual-computer-upgrade-executor-ready",
    target: "liris",
    from: "acer-codex",
    id: "dual-computer-upgrade-2026-04-27-acer-executor-ready-001",
    ts: generatedAt,
    runId,
    eventId,
    status: manifest.status,
    acerReady: manifest.acerReady,
    lirisHandoff: manifest.lirisHandoff,
    request: "Liris may mirror/execute its 10 peer-owned upgrade lanes locally after local confirmation; Acer will not write Liris files.",
    artifacts: {
      manifest: repoRel(OUTPUTS.manifest),
      queue: repoRel(OUTPUTS.executorReady)
    },
    glyph_sentence: "META-EXECUTOR-READY { DUAL-COMPUTER-UPGRADE } · ACER-LOCAL-READY · LIRIS-PEER-HANDOFF · LIVE-MODELS-0 @ M-INDICATIVE .",
    boundary: manifest.boundary
  };
  writeJson(OUTPUTS.envelope, envelope);
  const postResult = await httpJson("POST", "http://192.168.100.2:4947/behcs/send", envelope);
  writeJson(OUTPUTS.postResult, { postedAt: new Date().toISOString(), endpoint: "http://192.168.100.2:4947/behcs/send", ...postResult });
  const report = { reportId: "dual-computer-upgrade-executor-ready-latest", generatedAt, manifest, postResult };
  writeJson(OUTPUTS.reportJson, report);
  writeText(OUTPUTS.reportMd, `# Dual Computer Upgrade Executor Ready

Generated: ${generatedAt}

Status: ${manifest.status}

Split:
- total tasks: ${manifest.taskCount}
- Acer local-ready lanes: ${manifest.acerReady}
- Liris handoff lanes: ${manifest.lirisHandoff}
- live model calls: 0
- process fanout: 0
- remote writes: 0

Liris handoff posted: ${postResult.ok}

Boundary: ${manifest.boundary}
`);
  console.log(JSON.stringify({
    ok: true,
    status: manifest.status,
    acerReady: manifest.acerReady,
    lirisHandoff: manifest.lirisHandoff,
    lirisHandoffPosted: postResult.ok,
    report: repoRel(OUTPUTS.reportMd)
  }, null, 2));
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
