#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const {
  buildOriginalHermesWalStateSnapshot,
  manifest
} = require("../src/behcs/originalHermesWalState");

const ROOT = path.resolve(__dirname, "..");
const SNAPSHOT_PATH = path.join(ROOT, "data", "behcs", "original-hermes-agent", "contracts", "wal-state-runtime-snapshot-latest.json");
const STORE_MANIFEST_PATH = path.join(ROOT, "data", "behcs", "original-hermes-agent", "wal-state-store-manifest-latest.ndjson");
const TEMP_REVIEW_PATH = path.join(ROOT, "data", "behcs", "original-hermes-agent", "wal-state-temp-sibling-review-latest.ndjson");
const REPORT_JSON = path.join(ROOT, "reports", "original-hermes-agent-wal-state-smoke-latest.json");
const REPORT_MD = path.join(ROOT, "reports", "original-hermes-agent-wal-state-smoke-latest.md");

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

function buildTempReviewRows(snapshot) {
  const rows = [];
  for (const store of snapshot.stores || []) {
    for (const temp of store.tempFiles || []) {
      rows.push({
        store: store.id,
        owner: store.owner,
        temp,
        action: "review_only_no_delete",
        requiredGate: "operator_review_and_store_owner_check",
        digest: store.digest
      });
    }
  }
  return rows;
}

function buildReport(snapshot, execute) {
  const storeRows = (snapshot.stores || []).map((store) => (
    `- ${store.id}: mode=${store.mode} exists=${store.stat.exists} bytes=${store.stat.bytes} temp=${store.tempFiles.length} risk=${store.risk.join("|") || "none"}`
  ));
  const json = {
    ok: snapshot.validation.ok,
    generatedAt: snapshot.generatedAt,
    executed: execute,
    snapshot,
    manifest: manifest(),
    outputs: {
      snapshot: repoRel(SNAPSHOT_PATH),
      storeManifest: repoRel(STORE_MANIFEST_PATH),
      tempReview: repoRel(TEMP_REVIEW_PATH),
      reportJson: repoRel(REPORT_JSON),
      reportMd: repoRel(REPORT_MD)
    },
    honesty: {
      migratesStores: false,
      deletesTempFiles: false,
      importsSecrets: false,
      launchesDaemons: false,
      editsShadowFiles: false
    }
  };
  const md = `# Original Hermes WAL State Smoke

Generated: ${snapshot.generatedAt}
Status: ${snapshot.status}
Validation: ${snapshot.validation.ok ? "PASS" : "FAIL"}
Digest: ${snapshot.digest}

## Summary

- Stores: ${snapshot.summary.storeCount}
- JSON rewrite stores: ${snapshot.summary.jsonRewriteStoreCount}
- Append-only stores: ${snapshot.summary.appendOnlyStoreCount}
- Temp siblings: ${snapshot.summary.tempFileCount}
- Migration writes: ${snapshot.summary.migrationWrites}
- Data deletes: ${snapshot.summary.dataDeletes}
- Secrets imported: ${snapshot.summary.secretsImported}

## Stores

${storeRows.join("\n") || "- none"}

## Gates

${snapshot.gates.map((gate) => `- ${gate}`).join("\n")}

## Validation

- Errors: ${snapshot.validation.errors.length ? snapshot.validation.errors.join(", ") : "none"}
- Warnings: ${snapshot.validation.warnings.length ? snapshot.validation.warnings.join(", ") : "none"}

## Honesty Boundary

- Manifest and review queues only.
- No store migration.
- No temp file deletion.
- No secret import.
- No daemon launch.
- No shadow file edits.
`;
  return { json, md };
}

function run({ execute = false } = {}) {
  const snapshot = buildOriginalHermesWalStateSnapshot();
  const storeRows = snapshot.stores || [];
  const tempRows = buildTempReviewRows(snapshot);
  const report = buildReport(snapshot, execute);
  if (execute) {
    writeJson(SNAPSHOT_PATH, snapshot);
    writeNdjson(STORE_MANIFEST_PATH, storeRows);
    writeNdjson(TEMP_REVIEW_PATH, tempRows);
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
        storeManifest: repoRel(STORE_MANIFEST_PATH),
        tempReview: repoRel(TEMP_REVIEW_PATH),
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
  console.error("Usage: node tools/original-hermes-wal-state-smoke.js status|run [--execute]");
  process.exit(2);
}

if (require.main === module) {
  main(process.argv);
}

module.exports = {
  run
};
