#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const {
  buildOriginalHermesSecurityBackportSnapshot,
  manifest
} = require("../src/behcs/originalHermesSecurityBackport");

const ROOT = path.resolve(__dirname, "..");
const SNAPSHOT_PATH = path.join(ROOT, "data", "behcs", "original-hermes-agent", "contracts", "security-backport-runtime-snapshot-latest.json");
const QUEUE_PATH = path.join(ROOT, "data", "behcs", "original-hermes-agent", "security-backport-queue-latest.ndjson");
const REPORT_JSON = path.join(ROOT, "reports", "original-hermes-agent-security-backport-smoke-latest.json");
const REPORT_MD = path.join(ROOT, "reports", "original-hermes-agent-security-backport-smoke-latest.md");

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

function buildReport(snapshot, execute) {
  const backportRows = (snapshot.backports || []).map((item) => (
    `- ${item.id}: target=${item.target.path} exists=${item.target.exists} state=${item.state} smoke=${item.smoke}`
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
      reportJson: repoRel(REPORT_JSON),
      reportMd: repoRel(REPORT_MD)
    },
    honesty: {
      appliesPatches: false,
      importsSecrets: false,
      writesShadowFiles: false,
      launchesDaemons: false
    }
  };
  const md = `# Original Hermes Security Backport Smoke

Generated: ${snapshot.generatedAt}
Status: ${snapshot.status}
Validation: ${snapshot.validation.ok ? "PASS" : "FAIL"}
Digest: ${snapshot.digest}

## Summary

- Backports: ${snapshot.summary.backportCount}
- Targets present: ${snapshot.summary.targetPresentCount}
- Missing targets: ${snapshot.summary.missingTargetCount}
- Patches applied: ${snapshot.summary.patchesApplied}
- Secrets imported: ${snapshot.summary.secretsImported}
- Shadow writes: ${snapshot.summary.shadowFileWrites}

## Backports

${backportRows.join("\n") || "- none"}

## Gates

${snapshot.gates.map((gate) => `- ${gate}`).join("\n")}

## Validation

- Errors: ${snapshot.validation.errors.length ? snapshot.validation.errors.join(", ") : "none"}
- Warnings: ${snapshot.validation.warnings.length ? snapshot.validation.warnings.join(", ") : "none"}

## Honesty Boundary

- Queue and report only.
- No patch application.
- No secret import.
- No daemon launch.
- No shadow file edits.
`;
  return { json, md };
}

function run({ execute = false } = {}) {
  const snapshot = buildOriginalHermesSecurityBackportSnapshot();
  const report = buildReport(snapshot, execute);
  if (execute) {
    writeJson(SNAPSHOT_PATH, snapshot);
    writeNdjson(QUEUE_PATH, snapshot.backports || []);
    writeJson(REPORT_JSON, report.json);
    writeText(REPORT_MD, report.md);
  }
  return report.json;
}

function main(argv) {
  const command = argv[2] || "status";
  const execute = argv.includes("--execute");
  if (command === "status") {
    console.log(JSON.stringify({
      ok: true,
      status: "READY",
      manifest: manifest(),
      outputs: {
        snapshot: repoRel(SNAPSHOT_PATH),
        queue: repoRel(QUEUE_PATH),
        reportJson: repoRel(REPORT_JSON),
        reportMd: repoRel(REPORT_MD)
      }
    }, null, 2));
    return;
  }
  if (command === "run") {
    const result = run({ execute });
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.ok ? 0 : 1);
    return;
  }
  console.error("Usage: node tools/original-hermes-security-backport-smoke.js status|run [--execute]");
  process.exit(2);
}

if (require.main === module) {
  main(process.argv);
}

module.exports = {
  run
};
