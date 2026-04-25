#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { getWorkerRouterStatus } = require("../src/connectors/workerRouter");
const {
  buildOriginalHermesTransportRouterSnapshot,
  manifest
} = require("../src/behcs/originalHermesTransportRouter");

const ROOT = path.resolve(__dirname, "..");
const SNAPSHOT_PATH = path.join(ROOT, "data", "behcs", "original-hermes-agent", "contracts", "transport-router-runtime-snapshot-latest.json");
const REPORT_JSON = path.join(ROOT, "reports", "original-hermes-agent-transport-router-smoke-latest.json");
const REPORT_MD = path.join(ROOT, "reports", "original-hermes-agent-transport-router-smoke-latest.md");

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

function buildReport(snapshot, execute) {
  const providerRows = snapshot.providers.map((provider) => (
    `- ${provider.id}: configured=${provider.configured} enabled=${provider.enabled} style=${provider.apiStyle || "none"} error=${provider.configError || "none"}`
  ));
  const workerRows = snapshot.workers.map((worker) => (
    `- ${worker.id}: dispatchable=${worker.dispatchable} direct=${worker.directDispatchSupported} trust=${worker.trustTier || "unknown"}`
  ));
  const json = {
    ok: snapshot.validation.ok,
    generatedAt: snapshot.generatedAt,
    executed: execute,
    snapshot,
    manifest: manifest(),
    outputs: {
      snapshot: repoRel(SNAPSHOT_PATH),
      reportJson: repoRel(REPORT_JSON),
      reportMd: repoRel(REPORT_MD)
    },
    honesty: {
      importsProviderSecrets: false,
      exposesProviderSecrets: false,
      dispatchesWorkers: false,
      callsExternalProviders: false,
      launchesGateway: false,
      editsShadowFiles: false
    }
  };
  const md = `# Original Hermes Transport Router Smoke

Generated: ${snapshot.generatedAt}
Status: ${snapshot.status}
Validation: ${snapshot.validation.ok ? "PASS" : "FAIL"}
Digest: ${snapshot.digest}

## Providers

${providerRows.join("\n") || "- none"}

## Workers

${workerRows.join("\n") || "- none"}

## Route Matrix

- Provider transports: ${snapshot.routeMatrix.providerTransports.length}
- Worker transports: ${snapshot.routeMatrix.workerTransports.length}
- Cognitive engine transports: ${snapshot.routeMatrix.cognitiveEngineTransports.length}

## Policy

- Provider secret import: ${snapshot.secretPolicy.importsProviderSecrets}
- Provider secret exposure: ${snapshot.secretPolicy.exposesProviderSecrets}
- Dispatch now: ${snapshot.executionPolicy.dispatchesNow}
- Gateway launch: ${snapshot.executionPolicy.launchesGateway}
- Provider calls: ${snapshot.executionPolicy.launchesProviderCalls}

## Validation

- Errors: ${snapshot.validation.errors.length ? snapshot.validation.errors.join(", ") : "none"}
- Warnings: ${snapshot.validation.warnings.length ? snapshot.validation.warnings.join(", ") : "none"}

## Honesty Boundary

- Read-only route matrix and report only.
- No provider secret import or exposure.
- No worker dispatch.
- No external provider call.
- No gateway launch.
- No upstream Hermes runtime execution.
- No shadow file edits.
`;
  return { json, md };
}

function run({ execute = false } = {}) {
  const workerRouterStatus = getWorkerRouterStatus();
  const snapshot = buildOriginalHermesTransportRouterSnapshot({ workerRouterStatus });
  const report = buildReport(snapshot, execute);
  if (execute) {
    writeJson(SNAPSHOT_PATH, snapshot);
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
  console.error("Usage: node tools/original-hermes-transport-router-smoke.js status|run [--execute]");
  process.exit(2);
}

if (require.main === module) {
  main(process.argv);
}

module.exports = {
  run
};
