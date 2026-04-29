#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const {
  buildOriginalHermesLearningLoopSnapshot,
  manifest
} = require("../src/behcs/originalHermesLearningLoop");

const ROOT = path.resolve(__dirname, "..");
const SNAPSHOT_PATH = path.join(ROOT, "data", "behcs", "original-hermes-agent", "contracts", "learning-loop-runtime-snapshot-latest.json");
const QUEUE_PATH = path.join(ROOT, "data", "behcs", "original-hermes-agent", "skill-promotion-queue-latest.ndjson");
const RULES_PATH = path.join(ROOT, "data", "behcs", "original-hermes-agent", "mistake-prevention-rules-latest.ndjson");
const REPORT_JSON = path.join(ROOT, "reports", "original-hermes-agent-learning-loop-smoke-latest.json");
const REPORT_MD = path.join(ROOT, "reports", "original-hermes-agent-learning-loop-smoke-latest.md");

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeJson(filePath, value) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeText(filePath, value) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, value.endsWith("\n") ? value : `${value}\n`, "utf8");
}

function writeNdjson(filePath, rows) {
  ensureDir(filePath);
  const body = rows.map((row) => JSON.stringify(row)).join("\n");
  fs.writeFileSync(filePath, body ? `${body}\n` : "", "utf8");
}

function repoRel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function asIntArg(argv, name, fallback, min, max) {
  const prefix = `--${name}=`;
  const found = argv.find((item) => String(item).startsWith(prefix));
  const value = found ? Number(String(found).slice(prefix.length)) : fallback;
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(value)));
}

function buildQueueRows(snapshot) {
  return (snapshot.candidates || []).map((item) => ({
    id: item.candidate?.id || "",
    generatedAt: item.generatedAt,
    sourcePattern: item.sourcePattern,
    skillCoverage: item.skillCoverage,
    reverseGain: item.reverseGainEvaluation,
    activation: item.activation,
    digest: item.digest,
    executionPolicy: snapshot.executionPolicy
  }));
}

function buildRuleRows(snapshot) {
  return (snapshot.candidates || []).map((item) => ({
    id: item.preventionRule?.id || `${item.candidate?.id || "candidate"}:prevention`,
    generatedAt: item.generatedAt,
    sourcePattern: item.sourcePattern,
    rule: item.preventionRule,
    activation: item.activation,
    digest: item.preventionRule?.digest || item.digest
  }));
}

function buildReport(snapshot, execute) {
  const candidateRows = (snapshot.candidates || []).slice(0, 12).map((item) => (
    `- ${item.sourcePattern.id || item.candidate.id}: promoted=${Boolean(item.reverseGainEvaluation.promoted)} forward=${item.candidate.forwardScore} reverseRisk=${item.candidate.reverseRisk} severity=${item.sourcePattern.severity || "unknown"}`
  ));
  const json = {
    ok: snapshot.validation.ok,
    generatedAt: snapshot.generatedAt,
    executed: execute,
    snapshot,
    manifest: manifest(),
    outputs: {
      snapshot: repoRel(SNAPSHOT_PATH),
      queue: repoRel(QUEUE_PATH),
      rules: repoRel(RULES_PATH),
      reportJson: repoRel(REPORT_JSON),
      reportMd: repoRel(REPORT_MD)
    },
    honesty: {
      autoActivatesSkills: false,
      writesAtlas: false,
      writesMemory: false,
      executesReplay: false,
      callsExternalProviders: false,
      editsShadowFiles: false
    }
  };
  const md = `# Original Hermes Learning Loop Smoke

Generated: ${snapshot.generatedAt}
Status: ${snapshot.status}
Validation: ${snapshot.validation.ok ? "PASS" : "FAIL"}
Digest: ${snapshot.digest}

## Summary

- Candidates: ${snapshot.summary.candidateCount}
- Reverse-gain promoted: ${snapshot.summary.reverseGainPromotedCount}
- Reverse-gain blocked: ${snapshot.summary.reverseGainBlockedCount}
- Auto activations: ${snapshot.summary.autoActivatedCount}
- Atlas writes: ${snapshot.summary.atlasWrites}
- Skill writes: ${snapshot.summary.skillWrites}

## Candidates

${candidateRows.join("\n") || "- none"}

## Gates

${snapshot.gates.map((gate) => `- ${gate}`).join("\n")}

## Source Surfaces

- Skill count: ${snapshot.sourceSurfaces.skillCount}
- Memory turns inspected: ${snapshot.sourceSurfaces.memoryTurns}
- Notebook notes counted: ${snapshot.sourceSurfaces.notebookNotes}
- Semantic knowledge ready: ${snapshot.sourceSurfaces.semanticKnowledge.ready}
- Mistake patterns: ${snapshot.sourceSurfaces.mistakePatternSummary?.total || 0}

## Validation

- Errors: ${snapshot.validation.errors.length ? snapshot.validation.errors.join(", ") : "none"}
- Warnings: ${snapshot.validation.warnings.length ? snapshot.validation.warnings.join(", ") : "none"}

## Honesty Boundary

- Candidate queue and prevention-rule report only.
- No skill activation.
- No Atlas write.
- No memory write.
- No replay execution.
- No external provider call.
- No shadow file edits.
`;
  return { json, md };
}

function run({ execute = false, limit = 24 } = {}) {
  const snapshot = buildOriginalHermesLearningLoopSnapshot({ limit });
  const queueRows = buildQueueRows(snapshot);
  const ruleRows = buildRuleRows(snapshot);
  const report = buildReport(snapshot, execute);
  if (execute) {
    writeJson(SNAPSHOT_PATH, snapshot);
    writeNdjson(QUEUE_PATH, queueRows);
    writeNdjson(RULES_PATH, ruleRows);
    writeJson(REPORT_JSON, report.json);
    writeText(REPORT_MD, report.md);
  }
  return report.json;
}

function main(argv) {
  const command = argv[2] || "status";
  const execute = argv.includes("--execute");
  const limit = asIntArg(argv, "limit", 24, 1, 100);
  if (command === "status") {
    console.log(JSON.stringify({
      ok: true,
      status: "READY",
      manifest: manifest(),
      outputs: {
        snapshot: repoRel(SNAPSHOT_PATH),
        queue: repoRel(QUEUE_PATH),
        rules: repoRel(RULES_PATH),
        reportJson: repoRel(REPORT_JSON),
        reportMd: repoRel(REPORT_MD)
      }
    }, null, 2));
    return;
  }
  if (command === "run") {
    const result = run({ execute, limit });
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.ok ? 0 : 1);
    return;
  }
  console.error("Usage: node tools/original-hermes-learning-loop-smoke.js status|run [--execute] [--limit=24]");
  process.exit(2);
}

if (require.main === module) {
  main(process.argv);
}

module.exports = {
  run
};
