#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { getWorkerRouterStatus } = require("../src/connectors/workerRouter");
const {
  buildOriginalHermesRuntimeIndex,
  manifest
} = require("../src/behcs/originalHermesRuntimeIndex");

const ROOT = path.resolve(__dirname, "..");
const SNAPSHOT_PATH = path.join(ROOT, "data", "behcs", "original-hermes-agent", "contracts", "runtime-index-latest.json");
const SUPERVISORS_PATH = path.join(ROOT, "data", "behcs", "supervisors", "original-hermes-agent", "original-hermes-runtime-supervisors.v1.json");
const MAP_PATH = path.join(ROOT, "data", "behcs", "maps", "original-hermes-agent", "original-hermes-runtime-map.v1.json");
const REPORT_JSON = path.join(ROOT, "reports", "original-hermes-agent-runtime-index-latest.json");
const REPORT_MD = path.join(ROOT, "reports", "original-hermes-agent-runtime-index-latest.md");

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

function buildReport(snapshot, execute) {
  const surfaceRows = Object.entries(snapshot.surfaces || {}).map(([id, surface]) => (
    `- ${id}: status=${surface.status || "n/a"} validation=${surface.validation?.ok !== false} digest=${surface.digest || surface.validation?.digest || "n/a"}`
  ));
  const supervisorRows = (snapshot.supervisors || []).map((supervisor) => (
    `- ${supervisor.id}: role=${supervisor.role} surface=${supervisor.surface || "all"} status=${supervisor.status || "root"}`
  ));
  const json = {
    ok: snapshot.validation.ok,
    generatedAt: snapshot.generatedAt,
    executed: execute,
    snapshot,
    manifest: manifest(),
    outputs: {
      snapshot: repoRel(SNAPSHOT_PATH),
      supervisors: repoRel(SUPERVISORS_PATH),
      map: repoRel(MAP_PATH),
      reportJson: repoRel(REPORT_JSON),
      reportMd: repoRel(REPORT_MD)
    },
    honesty: {
      readOnlyIndex: true,
      activatesRuntime: false,
      appliesPatches: false,
      activatesSkills: false,
      importsSecrets: false,
      writesShadowFiles: false,
      callsProviders: false
    }
  };
  const md = `# Original Hermes Runtime Index

Generated: ${snapshot.generatedAt}
Status: ${snapshot.status}
Validation: ${snapshot.validation.ok ? "PASS" : "FAIL"}
Digest: ${snapshot.digest}

## Summary

- Surfaces: ${snapshot.summary.surfaceCount}
- Supervisors: ${snapshot.summary.supervisorCount}
- Ready/blocked: ${snapshot.summary.readyBlockedCount}
- Activation writes: ${snapshot.summary.activationWrites}
- Runtime launches: ${snapshot.summary.runtimeLaunches}
- Provider calls: ${snapshot.summary.providerCalls}
- Shadow writes: ${snapshot.summary.shadowWrites}
- Secret imports: ${snapshot.summary.secretImports}

## Surfaces

${surfaceRows.join("\n") || "- none"}

## Supervisors

${supervisorRows.join("\n") || "- none"}

## Map

- Nodes: ${snapshot.map?.counts?.nodes || 0}
- Edges: ${snapshot.map?.counts?.edges || 0}
- Digest: ${snapshot.map?.digest || "n/a"}

## Gates

${snapshot.gates.map((gate) => `- ${gate}`).join("\n")}

## Validation

- Errors: ${snapshot.validation.errors.length ? snapshot.validation.errors.join(", ") : "none"}
- Warnings: ${snapshot.validation.warnings.length ? snapshot.validation.warnings.join(", ") : "none"}

## Honesty Boundary

- Read-only supervisor index only.
- No runtime activation.
- No patch application.
- No skill activation.
- No secret import.
- No provider call.
- No shadow file edits.
`;
  return { json, md };
}

function run({ execute = false, learningLimit = 24 } = {}) {
  const snapshot = buildOriginalHermesRuntimeIndex({
    workerRouterStatus: getWorkerRouterStatus(),
    learningLimit
  });
  const report = buildReport(snapshot, execute);
  if (execute) {
    writeJson(SNAPSHOT_PATH, snapshot);
    writeJson(SUPERVISORS_PATH, snapshot.supervisors || []);
    writeJson(MAP_PATH, snapshot.map || {});
    writeJson(REPORT_JSON, report.json);
    writeText(REPORT_MD, report.md);
  }
  return report.json;
}

function main(argv) {
  const command = argv[2] || "status";
  const execute = argv.includes("--execute");
  const learningLimit = asIntArg(argv, "learning-limit", 24, 1, 100);
  if (command === "status") {
    console.log(JSON.stringify({
      ok: true,
      status: "READY",
      manifest: manifest(),
      outputs: {
        snapshot: repoRel(SNAPSHOT_PATH),
        supervisors: repoRel(SUPERVISORS_PATH),
        map: repoRel(MAP_PATH),
        reportJson: repoRel(REPORT_JSON),
        reportMd: repoRel(REPORT_MD)
      }
    }, null, 2));
    return;
  }
  if (command === "run") {
    const result = run({ execute, learningLimit });
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.ok ? 0 : 1);
    return;
  }
  console.error("Usage: node tools/original-hermes-runtime-index-smoke.js status|run [--execute] [--learning-limit=24]");
  process.exit(2);
}

if (require.main === module) {
  main(process.argv);
}

module.exports = {
  run
};
