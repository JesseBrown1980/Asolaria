#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const http = require("http");

const repoRoot = path.resolve(__dirname, "..", "..");
const runId = "processor-unification-20260427";
const eventId = "EVT-ACER-LIRIS-FALCON-PROCESSOR-UNIFICATION-2026-04-27";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", runId);
const voteId = "PROCESSOR-UNIFICATION-V6-20260427";

const INPUTS = Object.freeze({
  fabric: path.join(runRoot, "processor-unification-fabric.v1.json"),
  lanes: path.join(runRoot, "processor-unification-lanes.v1.ndjson"),
  vote: path.join(repoRoot, "data", "votes", voteId, "behcs-v6-candidate-file.json")
});

const OUTPUTS = Object.freeze({
  integration: path.join(runRoot, "processor-unification-cascade-integration.v1.json"),
  envelope: path.join(runRoot, "processor-unification-cascade-summary-envelope.json"),
  postResult: path.join(runRoot, "processor-unification-cascade-summary-post-result.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "processor-unification-cascade.v1.json"),
  index: path.join(repoRoot, "data", "behcs", "index", "processor-unification-cascade-index.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "processor-unification-cascade-map-map-mapped.v1.json"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "processor-unification-cascade-behcs256.glpj.json"),
  reportJson: path.join(repoRoot, "reports", "processor-unification-cascade-latest.json"),
  reportMd: path.join(repoRoot, "reports", "processor-unification-cascade-latest.md")
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
  const fabric = readJson(INPUTS.fabric);
  const lanes = readNdjson(INPUTS.lanes);
  const vote = readJson(INPUTS.vote);
  const resultRows = vote.results || [];
  const weakestDims = countBy(resultRows.map((row) => ({
    dim: row.selfReflection?.weakestOverall?.dim || "unknown"
  })), "dim");
  const verdictCounts = countBy(resultRows, "verdict");
  const ranked = resultRows.map((row) => ({
    candidateId: row.candidate_id,
    verdict: row.verdict,
    confidence: row.avgConfidence,
    weakestDim: row.selfReflection?.weakestOverall?.dim || null,
    strongestDim: row.selfReflection?.strongestOverall?.dim || null,
    gnnOverride: row.gnnOverride || null
  }));
  const allProceed = resultRows.length > 0 && resultRows.every((row) => row.verdict === "PROCEED");
  const federationAlive = vote.liveState?.federationAlive === true;
  const requiredConditions = federationAlive && allProceed
    ? [
      "preserve 1675 sensitive rows behind quad quorum",
      "do not mutate firmware, drivers, phone files, or Liris files",
      "route any executor promotion through supervisor dispatch queue and LAW-001",
      "keep planning-only executorDispatches=0 unless an explicit promotion run is requested"
    ]
    : [
      "treat all lanes as descriptor/planning until federation liveness is green",
      "preserve 1675 sensitive rows behind quad quorum",
      "do not mutate firmware, drivers, phone files, or Liris files",
      "route any executor promotion through supervisor dispatch queue and LAW-001"
    ];
  const integration = {
    id: "processor-unification-cascade-integration.v1",
    runId,
    eventId,
    voteId,
    generatedAt,
    status: federationAlive && allProceed
      ? "PROCESSOR_UNIFICATION_CASCADED_READY_PLANNING_ONLY"
      : "PROCESSOR_UNIFICATION_CASCADED_CONDITIONAL_READY",
    fabricStatus: fabric.status,
    totalBeats: vote.totalBeats,
    candidatesScanned: vote.candidatesScanned,
    allDimsCovered: vote.allDimsCovered,
    executorDispatches: vote.executorDispatches,
    verdictCounts,
    weakestDims,
    liveState: vote.liveState,
    ranked,
    requiredConditions,
    boundary: "Cascade integration only. No executor dispatch, no remote write, no process fanout, no provider/API call."
  };
  writeJson(OUTPUTS.integration, integration);
  writeJson(OUTPUTS.memory, {
    type: "behcs-memory",
    id: "memory-processor-unification-cascade-v1",
    generatedAt,
    runId,
    eventId,
    status: integration.status,
    summary: federationAlive && allProceed
      ? "Processor unification lanes passed BEHCS v6 as PROCEED after federation liveness correction; executor dispatch remains intentionally disabled by planning-only policy."
      : "Processor unification lanes passed BEHCS v6 as PROCEED-WITH-CONDITIONS, with federation liveness as the primary remaining condition.",
    source: repoRel(OUTPUTS.integration)
  });
  writeJson(OUTPUTS.index, {
    id: "processor-unification-cascade-index-v1",
    generatedAt,
    keys: ["processor-unification", "behcs-v6-cascade", "federation-liveness", "conditional-ready"],
    artifacts: {
      integration: repoRel(OUTPUTS.integration),
      vote: repoRel(INPUTS.vote),
      report: repoRel(OUTPUTS.reportMd),
      map: repoRel(OUTPUTS.map),
      glpj: repoRel(OUTPUTS.glpj)
    }
  });
  writeJson(OUTPUTS.map, {
    id: "processor-unification-cascade-map-map-mapped-v1",
    generatedAt,
    route: ["processor-fabric", "candidate-file", "behcs-v6-cascade", "conditional-ready", "liris-summary"],
    voteId,
    verdictCounts,
    requiredConditions: integration.requiredConditions
  });
  writeJson(OUTPUTS.glpj, {
    id: "processor-unification-cascade-behcs256-glpj-v1",
    generatedAt,
    sentences: [
      "META-CASCADE { PROCESSOR-UNIFICATION } · 2985984-BEATS · 8-LANES · DIMS-37 @ M-EYEWITNESS .",
      federationAlive && allProceed
        ? "META-VERDICT { PROCESSOR-UNIFICATION } · PROCEED · FEDERATION-LIVENESS-CORRECTED @ M-INDICATIVE ."
        : "META-VERDICT { PROCESSOR-UNIFICATION } · PROCEED-WITH-CONDITIONS · FEDERATION-LIVENESS-HOLD @ M-INDICATIVE .",
      "META-GATE { PROCESSOR-UNIFICATION-EXECUTOR } · DISPATCHES-0 · QUORUM-PRESERVED · NO-FANOUT @ M-IMPERATIVE ."
    ]
  });

  const envelope = {
    verb: "processor-unification-cascade-summary",
    target: "liris",
    from: "acer-codex",
    id: "processor-unification-2026-04-27-acer-cascade-summary-001",
    ts: generatedAt,
    runId,
    eventId,
    status: integration.status,
    voteId,
    totalBeats: vote.totalBeats,
    candidatesScanned: vote.candidatesScanned,
    executorDispatches: vote.executorDispatches,
    verdictCounts,
    liveState: vote.liveState,
    requiredConditions: integration.requiredConditions,
    artifacts: {
      integration: repoRel(OUTPUTS.integration),
      vote: repoRel(INPUTS.vote)
    },
    glyph_sentence: federationAlive && allProceed
      ? "META-CASCADE { PROCESSOR-UNIFICATION } · ALL-LANES-PROCEED · FEDERATION-LIVENESS-CORRECTED · DISPATCHES-0-PLANNING-ONLY @ M-INDICATIVE ."
      : "META-CASCADE { PROCESSOR-UNIFICATION } · ALL-LANES-PROCEED-WITH-CONDITIONS · FEDERATION-LIVENESS-HOLD · DISPATCHES-0 @ M-INDICATIVE .",
    boundary: integration.boundary
  };
  writeJson(OUTPUTS.envelope, envelope);
  const postResult = await httpJson("POST", "http://192.168.100.2:4947/behcs/send", envelope);
  writeJson(OUTPUTS.postResult, { postedAt: new Date().toISOString(), endpoint: "http://192.168.100.2:4947/behcs/send", ...postResult });

  const report = { reportId: "processor-unification-cascade-latest", generatedAt, integration, lanes, postResult };
  writeJson(OUTPUTS.reportJson, report);
  writeText(OUTPUTS.reportMd, `# Processor Unification Cascade

Generated: ${generatedAt}

Status: ${integration.status}

BEHCS v6:
- vote: ${voteId}
- beats: ${vote.totalBeats}
- candidates: ${vote.candidatesScanned}
- dims covered: ${vote.allDimsCovered}
- executor dispatches: ${vote.executorDispatches}
- verdicts: ${JSON.stringify(verdictCounts)}

Live-state:
- bus alive: ${vote.liveState?.busAlive}
- federation alive: ${vote.liveState?.federationAlive}
- collapse detected: ${vote.liveState?.collapseDetected}
- collapse signals: ${(vote.liveState?.collapseSignals || []).join(", ") || "none"}

Ranked lanes:
${ranked.map((row) => `- ${row.candidateId}: ${row.verdict} conf=${row.confidence} weakest=${row.weakestDim || "none"}`).join("\n")}

Liris cascade summary posted: ${postResult.ok}

Boundary: ${integration.boundary}
`);

  console.log(JSON.stringify({
    ok: true,
    status: integration.status,
    totalBeats: vote.totalBeats,
    candidatesScanned: vote.candidatesScanned,
    executorDispatches: vote.executorDispatches,
    lirisSummaryPosted: postResult.ok,
    report: repoRel(OUTPUTS.reportMd)
  }, null, 2));
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
