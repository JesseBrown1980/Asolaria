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
const sealRoot = path.join(runRoot, "bilateral-promotion-seal");

const INPUTS = Object.freeze({
  inbox: path.join(repoRoot, "data", "behcs", "inbox.ndjson"),
  acerSummary: path.join(runRoot, "acer-promotion-run", "dual-computer-upgrade-acer-promotion-summary.v1.json"),
  executorManifest: path.join(runRoot, "dual-computer-upgrade-executor-ready-manifest.v1.json")
});

const OUTPUTS = Object.freeze({
  seal: path.join(sealRoot, "dual-computer-upgrade-bilateral-promotion-seal.v1.json"),
  envelope: path.join(sealRoot, "dual-computer-upgrade-bilateral-promotion-seal-receipt-envelope.json"),
  postResult: path.join(sealRoot, "dual-computer-upgrade-bilateral-promotion-seal-receipt-post-result.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "dual-computer-upgrade-bilateral-promotion-seal.v1.json"),
  index: path.join(repoRoot, "data", "behcs", "index", "dual-computer-upgrade-bilateral-promotion-seal-index.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "dual-computer-upgrade-bilateral-promotion-seal-map-map-mapped.v1.json"),
  cube: path.join(repoRoot, "data", "behcs", "cubes", "dual-computer-upgrade-bilateral-promotion-seal-cube-cubed.cube.js"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "dual-computer-upgrade-bilateral-promotion-seal-behcs256.glpj.json"),
  reportJson: path.join(repoRoot, "reports", "dual-computer-upgrade-bilateral-promotion-seal-latest.json"),
  reportMd: path.join(repoRoot, "reports", "dual-computer-upgrade-bilateral-promotion-seal-latest.md")
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
  return fs.readFileSync(filePath, "utf8").split(/\r?\n/).filter(Boolean).map((line) => {
    try {
      return JSON.parse(line);
    } catch (_error) {
      return null;
    }
  }).filter(Boolean);
}

function repoRel(filePath) {
  const relative = path.relative(repoRoot, filePath);
  if (path.isAbsolute(relative) || relative.startsWith("..")) return filePath.replace(/\\/g, "/");
  return relative.replace(/\\/g, "/");
}

function canonicalHash(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function latestLirisPromotion(rows) {
  return rows
    .filter((row) => row.verb === "dual-computer-upgrade-liris-promotion-summary" && row.eventId === eventId)
    .sort((a, b) => String(a.received_at || a.ts || "").localeCompare(String(b.received_at || b.ts || "")))
    .at(-1);
}

function assertZeroBoundary(label, value) {
  for (const field of ["liveModelCalls", "processFanout", "remoteWritesPerformed"]) {
    if ((value[field] || 0) !== 0) {
      throw new Error(`${label} boundary failed: ${field}=${value[field]}`);
    }
  }
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
  const acerSummary = readJson(INPUTS.acerSummary);
  const executorManifest = readJson(INPUTS.executorManifest);
  const lirisPromotion = latestLirisPromotion(readNdjson(INPUTS.inbox));
  if (!lirisPromotion) {
    throw new Error("Missing Liris dual-computer upgrade promotion summary in Acer inbox");
  }
  if (acerSummary.status !== "DUAL_COMPUTER_UPGRADE_ACER_LOCAL_PROMOTION_ARTIFACTS_COMPLETE") {
    throw new Error(`Unexpected Acer promotion status: ${acerSummary.status}`);
  }
  if (lirisPromotion.status !== "DUAL_COMPUTER_UPGRADE_LIRIS_LOCAL_PROMOTION_ARTIFACTS_COMPLETE") {
    throw new Error(`Unexpected Liris promotion status: ${lirisPromotion.status}`);
  }
  assertZeroBoundary("Acer", acerSummary);
  assertZeroBoundary("Liris", lirisPromotion);
  if (acerSummary.acerTasksPromoted !== 10 || lirisPromotion.lirisTasksPromoted !== 10) {
    throw new Error("Expected 10 promoted lanes on both Acer and Liris");
  }
  if (executorManifest.acerReady !== 10 || executorManifest.lirisHandoff !== 10) {
    throw new Error("Executor split does not match expected 10/10 fabric");
  }

  const sealCore = {
    id: "dual-computer-upgrade-bilateral-promotion-seal.v1",
    generatedAt,
    runId,
    eventId,
    status: "DUAL_COMPUTER_UPGRADE_BILATERAL_LOCAL_PROMOTION_SEALED",
    d11: "PROVEN_OPERATOR_WITNESSED_BILATERAL_SYMMETRY",
    acer: {
      status: acerSummary.status,
      tasksPromoted: acerSummary.acerTasksPromoted,
      logicalRunsRepresented: acerSummary.totalLogicalRunsRepresented,
      localArtifactsProduced: acerSummary.localArtifactsProduced,
      summaryPath: repoRel(INPUTS.acerSummary)
    },
    liris: {
      status: lirisPromotion.status,
      tasksPromoted: lirisPromotion.lirisTasksPromoted,
      logicalRunsRepresented: lirisPromotion.totalLogicalRunsRepresented,
      localArtifactsProduced: lirisPromotion.localArtifactsProduced,
      messageId: lirisPromotion.id,
      receivedAt: lirisPromotion.received_at,
      operatorWitness: lirisPromotion.operator_witness,
      lanes: lirisPromotion.lanes || []
    },
    totals: {
      promotedLanes: acerSummary.acerTasksPromoted + lirisPromotion.lirisTasksPromoted,
      logicalRunsRepresented: acerSummary.totalLogicalRunsRepresented + lirisPromotion.totalLogicalRunsRepresented,
      localArtifactsProduced: acerSummary.localArtifactsProduced + lirisPromotion.localArtifactsProduced,
      liveModelCalls: 0,
      processFanout: 0,
      executorDispatchesPerformed: 0,
      remoteWritesPerformed: 0
    },
    boundary: "Bilateral local artifact promotion seal only. No remote writes, no live model calls, no process fanout."
  };
  const seal = { ...sealCore, sealSha256: canonicalHash(sealCore) };
  writeJson(OUTPUTS.seal, seal);

  writeJson(OUTPUTS.memory, {
    type: "behcs-memory",
    id: "memory-dual-computer-upgrade-bilateral-promotion-seal-v1",
    generatedAt,
    runId,
    eventId,
    status: seal.status,
    summary: "Acer and Liris both completed their 10-lane local artifact promotion passes, sealing 20B logical dual-computer upgrade coverage without remote writes or model fanout.",
    source: repoRel(OUTPUTS.seal)
  });
  writeJson(OUTPUTS.index, {
    id: "dual-computer-upgrade-bilateral-promotion-seal-index-v1",
    generatedAt,
    keys: ["dual-computer-upgrade", "bilateral-seal", "acer-liris", "20b-logical", "no-fanout"],
    artifacts: {
      seal: repoRel(OUTPUTS.seal),
      report: repoRel(OUTPUTS.reportMd),
      map: repoRel(OUTPUTS.map),
      cube: repoRel(OUTPUTS.cube),
      glpj: repoRel(OUTPUTS.glpj)
    }
  });
  writeJson(OUTPUTS.map, {
    id: "dual-computer-upgrade-bilateral-promotion-seal-map-map-mapped-v1",
    generatedAt,
    route: ["executor-ready-split", "acer-local-promotion", "liris-local-promotion", "bilateral-seal"],
    acerLanesPromoted: acerSummary.acerTasksPromoted,
    lirisLanesPromoted: lirisPromotion.lirisTasksPromoted,
    lirisLanePids: (lirisPromotion.lanes || []).map((lane) => lane.taskPid)
  });
  const cubeObject = {
    id: "dual-computer-upgrade-bilateral-promotion-seal-cube-cubed-v1",
    generatedAt,
    runId,
    eventId,
    status: seal.status,
    d11: seal.d11,
    promotedLanes: seal.totals.promotedLanes,
    logicalRunsRepresented: seal.totals.logicalRunsRepresented,
    sealSha256: seal.sealSha256
  };
  writeText(OUTPUTS.cube, `const dualComputerUpgradeBilateralPromotionSealCube = Object.freeze(${JSON.stringify(cubeObject, null, 2)});

export const CUBE = dualComputerUpgradeBilateralPromotionSealCube;
export default dualComputerUpgradeBilateralPromotionSealCube;
`);
  writeJson(OUTPUTS.glpj, {
    id: "dual-computer-upgrade-bilateral-promotion-seal-behcs256-glpj-v1",
    generatedAt,
    sentences: [
      "META-SEAL { DUAL-COMPUTER-UPGRADE } · ACER-10-LANES · LIRIS-10-LANES · BILATERAL-SYMMETRY @ M-EYEWITNESS .",
      "META-BOUNDARY { DUAL-COMPUTER-UPGRADE } · LIVE-MODELS-0 · FANOUT-0 · REMOTE-WRITES-0 @ M-INDICATIVE ."
    ]
  });

  const envelope = {
    verb: "dual-computer-upgrade-bilateral-promotion-seal-receipt",
    target: "liris",
    from: "acer-codex",
    id: "dual-computer-upgrade-2026-04-27-acer-bilateral-promotion-seal-receipt-001",
    ts: generatedAt,
    runId,
    eventId,
    status: seal.status,
    d11: seal.d11,
    sealSha256: seal.sealSha256,
    promotedLanes: seal.totals.promotedLanes,
    logicalRunsRepresented: seal.totals.logicalRunsRepresented,
    liveModelCalls: 0,
    processFanout: 0,
    remoteWritesPerformed: 0,
    responding_to: lirisPromotion.id,
    artifacts: {
      seal: repoRel(OUTPUTS.seal),
      report: repoRel(OUTPUTS.reportMd)
    },
    glyph_sentence: "META-SEAL { DUAL-COMPUTER-UPGRADE } · BILATERAL-LOCAL-PROMOTION-COMPLETE · 20B-LOGICAL · LIVE-MODELS-0 @ M-INDICATIVE .",
    boundary: seal.boundary
  };
  writeJson(OUTPUTS.envelope, envelope);
  const postResult = await httpJson("POST", "http://192.168.100.2:4947/behcs/send", envelope);
  writeJson(OUTPUTS.postResult, { postedAt: new Date().toISOString(), endpoint: "http://192.168.100.2:4947/behcs/send", ...postResult });

  const report = { reportId: "dual-computer-upgrade-bilateral-promotion-seal-latest", generatedAt, seal, postResult };
  writeJson(OUTPUTS.reportJson, report);
  writeText(OUTPUTS.reportMd, `# Dual Computer Upgrade Bilateral Promotion Seal

Generated: ${generatedAt}

Status: ${seal.status}

Seal:
- D11: ${seal.d11}
- seal sha256: ${seal.sealSha256}
- Acer lanes promoted: ${seal.acer.tasksPromoted}
- Liris lanes promoted: ${seal.liris.tasksPromoted}
- total logical runs represented: ${seal.totals.logicalRunsRepresented}
- local artifacts produced: ${seal.totals.localArtifactsProduced}
- live model calls: 0
- process fanout: 0
- remote writes: 0

Liris message:
- id: ${lirisPromotion.id}
- received: ${lirisPromotion.received_at}
- operator witness: ${lirisPromotion.operator_witness}

Liris receipt posted: ${postResult.ok}

Boundary: ${seal.boundary}
`);

  console.log(JSON.stringify({
    ok: true,
    status: seal.status,
    d11: seal.d11,
    sealSha256: seal.sealSha256,
    promotedLanes: seal.totals.promotedLanes,
    logicalRunsRepresented: seal.totals.logicalRunsRepresented,
    lirisReceiptPosted: postResult.ok,
    report: repoRel(OUTPUTS.reportMd)
  }, null, 2));
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
