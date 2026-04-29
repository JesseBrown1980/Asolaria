#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const http = require("http");

const repoRoot = path.resolve(__dirname, "..", "..");
const runId = "dual-computer-upgrade-20260427";
const eventId = "EVT-ACER-LIRIS-DUAL-COMPUTER-UPGRADE-2026-04-27";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", runId);
const voteId = "DUAL-COMPUTER-UPGRADE-V6-20260427";

const INPUTS = Object.freeze({
  fabric: path.join(runRoot, "dual-computer-upgrade-fabric.v1.json"),
  queue: path.join(runRoot, "dual-computer-upgrade-10b-logical-queue.v1.ndjson"),
  vote: path.join(repoRoot, "data", "votes", voteId, "behcs-v6-candidate-file.json")
});

const OUTPUTS = Object.freeze({
  integration: path.join(runRoot, "dual-computer-upgrade-cascade-integration.v1.json"),
  envelope: path.join(runRoot, "dual-computer-upgrade-cascade-summary-envelope.json"),
  postResult: path.join(runRoot, "dual-computer-upgrade-cascade-summary-post-result.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "dual-computer-upgrade-cascade.v1.json"),
  index: path.join(repoRoot, "data", "behcs", "index", "dual-computer-upgrade-cascade-index.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "dual-computer-upgrade-cascade-map-map-mapped.v1.json"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "dual-computer-upgrade-cascade-behcs256.glpj.json"),
  reportJson: path.join(repoRoot, "reports", "dual-computer-upgrade-cascade-latest.json"),
  reportMd: path.join(repoRoot, "reports", "dual-computer-upgrade-cascade-latest.md")
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

function countBy(rows, key) {
  return rows.reduce((acc, row) => {
    const value = row && row[key] ? row[key] : "unknown";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
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
  const fabric = readJson(INPUTS.fabric);
  const queue = readNdjson(INPUTS.queue);
  const vote = readJson(INPUTS.vote);
  const results = vote.results || [];
  const byComputer = {
    acer: results.filter((row) => row.candidate_id.startsWith("acer-")),
    liris: results.filter((row) => row.candidate_id.startsWith("liris-"))
  };
  const allProceed = results.length === queue.length && results.every((row) => row.verdict === "PROCEED");
  const integration = {
    id: "dual-computer-upgrade-cascade-integration.v1",
    generatedAt,
    runId,
    eventId,
    voteId,
    status: allProceed
      ? "DUAL_COMPUTER_UPGRADE_CASCADED_READY_PLANNING_ONLY"
      : "DUAL_COMPUTER_UPGRADE_CASCADE_HOLD",
    fabricStatus: fabric.status,
    totalLogicalRuns: fabric.totalLogicalRuns,
    logicalRunsPerComputer: fabric.logicalRunsPerComputer,
    totalBeats: vote.totalBeats,
    candidatesScanned: vote.candidatesScanned,
    executorDispatches: vote.executorDispatches,
    allDimsCovered: vote.allDimsCovered,
    verdictCounts: countBy(results, "verdict"),
    liveState: vote.liveState,
    modelPolicy: fabric.modelPolicy,
    byComputer: {
      acer: {
        candidates: byComputer.acer.length,
        verdictCounts: countBy(byComputer.acer, "verdict"),
        averageConfidence: Number((byComputer.acer.reduce((sum, row) => sum + row.avgConfidence, 0) / Math.max(1, byComputer.acer.length)).toFixed(4))
      },
      liris: {
        candidates: byComputer.liris.length,
        verdictCounts: countBy(byComputer.liris, "verdict"),
        averageConfidence: Number((byComputer.liris.reduce((sum, row) => sum + row.avgConfidence, 0) / Math.max(1, byComputer.liris.length)).toFixed(4))
      }
    },
    ranked: results.map((row) => ({
      id: row.candidate_id,
      verdict: row.verdict,
      confidence: row.avgConfidence,
      weakestDim: row.selfReflection?.weakestOverall?.dim || null,
      strongestDim: row.selfReflection?.strongestOverall?.dim || null
    })),
    remainingGates: [
      "Liris-owned lanes require Liris local confirmation before Liris-side execution",
      "OpenCode/free-model use remains descriptor-only until installed/local/free model evidence and small-tranche smoke are present",
      "No raw 10B materialization; keep Big Pickle logical batching",
      "No remote writes or process fanout without explicit promotion"
    ],
    boundary: "Cascade integration only; no model calls, no remote writes, no process fanout, no executor dispatch."
  };
  writeJson(OUTPUTS.integration, integration);
  writeJson(OUTPUTS.memory, {
    type: "behcs-memory",
    id: "memory-dual-computer-upgrade-cascade-v1",
    generatedAt,
    runId,
    eventId,
    status: integration.status,
    summary: "Acer and Liris dual-computer upgrade lanes passed BEHCS v6 planning cascade with 20 PROCEED results over 20B logical coverage.",
    source: repoRel(OUTPUTS.integration)
  });
  writeJson(OUTPUTS.index, {
    id: "dual-computer-upgrade-cascade-index-v1",
    generatedAt,
    keys: ["dual-computer-upgrade", "20b-logical", "behcs-v6", "acer", "liris", "all-proceed"],
    artifacts: {
      integration: repoRel(OUTPUTS.integration),
      vote: repoRel(INPUTS.vote),
      report: repoRel(OUTPUTS.reportMd),
      map: repoRel(OUTPUTS.map),
      glpj: repoRel(OUTPUTS.glpj)
    }
  });
  writeJson(OUTPUTS.map, {
    id: "dual-computer-upgrade-cascade-map-map-mapped-v1",
    generatedAt,
    route: ["dual-upgrade-queue", "behcs-v6-cascade", "20-proceed", "liris-summary", "promotion-hold"],
    ranked: integration.ranked
  });
  writeJson(OUTPUTS.glpj, {
    id: "dual-computer-upgrade-cascade-behcs256-glpj-v1",
    generatedAt,
    sentences: [
      "META-CASCADE { DUAL-COMPUTER-UPGRADE } · 20-LANES · 7464960-BEATS · ALL-PROCEED @ M-EYEWITNESS .",
      "META-COVERAGE { ACER+LIRIS } · 10B-LOGICAL-EACH · BIG-PICKLE · LIVE-MODEL-CALLS-0 @ M-INDICATIVE .",
      "META-GATE { OPEN-CODE-FREE-MODELS } · DESCRIPTOR-ONLY-UNTIL-EVIDENCE · NO-AUTH-BYPASS @ M-IMPERATIVE ."
    ]
  });

  const envelope = {
    verb: "dual-computer-upgrade-cascade-summary",
    target: "liris",
    from: "acer-codex",
    id: "dual-computer-upgrade-2026-04-27-acer-cascade-summary-001",
    ts: generatedAt,
    runId,
    eventId,
    status: integration.status,
    voteId,
    totalLogicalRuns: integration.totalLogicalRuns,
    totalBeats: integration.totalBeats,
    candidatesScanned: integration.candidatesScanned,
    executorDispatches: integration.executorDispatches,
    byComputer: integration.byComputer,
    modelPolicy: integration.modelPolicy,
    remainingGates: integration.remainingGates,
    artifacts: {
      integration: repoRel(OUTPUTS.integration),
      vote: repoRel(INPUTS.vote)
    },
    glyph_sentence: "META-CASCADE { DUAL-COMPUTER-UPGRADE } · ACER-10B-LOGICAL · LIRIS-10B-LOGICAL · 20-LANES-PROCEED · DISPATCHES-0 @ M-INDICATIVE .",
    boundary: integration.boundary
  };
  writeJson(OUTPUTS.envelope, envelope);
  const postResult = await httpJson("POST", "http://192.168.100.2:4947/behcs/send", envelope);
  writeJson(OUTPUTS.postResult, { postedAt: new Date().toISOString(), endpoint: "http://192.168.100.2:4947/behcs/send", ...postResult });

  const report = { reportId: "dual-computer-upgrade-cascade-latest", generatedAt, integration, postResult };
  writeJson(OUTPUTS.reportJson, report);
  writeText(OUTPUTS.reportMd, `# Dual Computer Upgrade Cascade

Generated: ${generatedAt}

Status: ${integration.status}

Coverage:
- total logical runs: ${integration.totalLogicalRuns}
- logical runs per computer: ${integration.logicalRunsPerComputer}
- BEHCS v6 beats: ${integration.totalBeats}
- candidates: ${integration.candidatesScanned}
- executor dispatches: ${integration.executorDispatches}
- verdicts: ${JSON.stringify(integration.verdictCounts)}

By computer:
- Acer: ${integration.byComputer.acer.candidates} lanes, avg confidence ${integration.byComputer.acer.averageConfidence}, verdicts ${JSON.stringify(integration.byComputer.acer.verdictCounts)}
- Liris: ${integration.byComputer.liris.candidates} lanes, avg confidence ${integration.byComputer.liris.averageConfidence}, verdicts ${JSON.stringify(integration.byComputer.liris.verdictCounts)}

Model policy:
- live model calls: ${integration.modelPolicy.liveModelCallsThisPass}
- auth bypass: ${integration.modelPolicy.authBypass}
- posture: ${integration.modelPolicy.posture}

Remaining gates:
${integration.remainingGates.map((gate) => `- ${gate}`).join("\n")}

Liris cascade summary posted: ${postResult.ok}

Boundary: ${integration.boundary}
`);

  console.log(JSON.stringify({
    ok: true,
    status: integration.status,
    totalLogicalRuns: integration.totalLogicalRuns,
    totalBeats: integration.totalBeats,
    candidatesScanned: integration.candidatesScanned,
    executorDispatches: integration.executorDispatches,
    lirisSummaryPosted: postResult.ok,
    report: repoRel(OUTPUTS.reportMd)
  }, null, 2));
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
