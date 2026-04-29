#!/usr/bin/env node
"use strict";

const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..", "..");
const runId = process.env.ASOLARIA_LOGICAL_RUN_ID || "real-free-agent-system-test-logical-20b-20260428";
const lirisRoot = process.env.LIRIS_ASOLARIA_SHARE || "\\\\192.168.100.2\\liris-asolaria-old";
const lirisIncomingRoot = path.join(lirisRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427", "incoming-acer");
const lirisLaw001 = process.env.LIRIS_LAW001_URL || "http://192.168.100.2:4947/behcs/send";
const defaultSpillRoot = process.env.ASOLARIA_BEHCS_SPILL_ROOT || "D:\\Asolaria-BEHCS-GC";
const bundleName = process.env.ASOLARIA_TRACKER_PUSH_BUNDLE_NAME || `wave33d-real-free-agent-${scaleLabelFromRunId(runId)}-omniflywheel-tracker-push`;
const pushFilePrefix = bundleName
  .replace(/^wave33d-real-free-agent-/, "wave33d-")
  .replace(/-omniflywheel-tracker-push$/, "-tracker-push");

const paths = Object.freeze({
  runRoot: path.join(repoRoot, "data", "behcs", "orchestration", runId),
  spillRunRoot: path.join(defaultSpillRoot, runId),
  localPushManifest: path.join(repoRoot, "data", "behcs", "orchestration", runId, `${pushFilePrefix}-manifest.json`),
  postResult: path.join(repoRoot, "data", "behcs", "orchestration", runId, `law001-${pushFilePrefix}-post-result.json`),
  reportJson: path.join(repoRoot, "reports", "real-free-agent-logical-scale-ledger-latest.json"),
  reportMd: path.join(repoRoot, "reports", "real-free-agent-logical-scale-ledger-latest.md")
});

function ensureParent(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeText(filePath, text) {
  ensureParent(filePath);
  fs.writeFileSync(filePath, String(text).endsWith("\n") ? String(text) : `${text}\n`, "utf8");
}

function writeJson(filePath, value) {
  writeText(filePath, JSON.stringify(value, null, 2));
}

function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function sha256Text(text) {
  return sha256Buffer(Buffer.from(String(text), "utf8"));
}

function sha256File(filePath) {
  return sha256Buffer(fs.readFileSync(filePath));
}

function readJson(filePath, fallback = null) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_error) {
    return fallback;
  }
}

function sortDeep(value) {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortDeep(value[key])]));
  }
  return value;
}

function sha256Json(value) {
  return sha256Text(JSON.stringify(sortDeep(value)));
}

function repoRel(filePath, root = repoRoot) {
  const rel = path.relative(root, filePath);
  return (path.isAbsolute(rel) || rel.startsWith("..") ? filePath : rel).replace(/\\/g, "/");
}

function scaleLabelFromRunId(value) {
  const match = String(value || "").match(/logical-([0-9]+[bmk])/i);
  return match ? match[1].toLowerCase() : "scale";
}

function scaleLabelFromLogicalWorkers(value) {
  const total = Number(value || 0);
  if (Number.isSafeInteger(total) && total > 0 && total % 1_000_000_000 === 0) return `${total / 1_000_000_000}b`;
  if (Number.isSafeInteger(total) && total > 0 && total % 1_000_000 === 0) return `${total / 1_000_000}m`;
  if (Number.isSafeInteger(total) && total > 0 && total % 1_000 === 0) return `${total / 1_000}k`;
  return scaleLabelFromRunId(runId);
}

function trackerFactsFromManifest(manifest) {
  const tracker = manifest?.tracker || {};
  const counts = tracker.counts || {};
  return {
    logicalWorkers: Number(manifest?.logicalAgentsRepresented || counts.logicalWorkers || 0),
    logicalGulps: Number(manifest?.logicalGulpsRepresented || counts.logicalGulps || 0),
    trackerRows: Number(counts.trackerRowsWritten || 0),
    trackerStrideGulps: Number(counts.trackerStrideGulps || 0),
    geniusMarks: Number(counts.geniusMarks || 0),
    mistakeMarks: Number(counts.mistakeMarks || 0),
    source: "reports/real-free-agent-logical-scale-ledger-latest.json"
  };
}

function artifactSpec(id, localPath, remoteRel, kind) {
  return {
    id,
    kind,
    localPath,
    remoteRel: remoteRel.replace(/\\/g, "/")
  };
}

function buildPayloadSpecs(options = {}) {
  const root = options.repoRoot || repoRoot;
  const runRoot = options.runRoot || path.join(root, "data", "behcs", "orchestration", runId);
  const spillRunRoot = options.spillRunRoot || path.join(defaultSpillRoot, runId);
  const reportJson = options.reportJson || path.join(root, "reports", "real-free-agent-logical-scale-ledger-latest.json");
  const reportMd = options.reportMd || path.join(root, "reports", "real-free-agent-logical-scale-ledger-latest.md");
  return [
    artifactSpec("manifest", path.join(runRoot, "real-free-agent-logical-scale-ledger-manifest.v1.json"), "repo/manifest/real-free-agent-logical-scale-ledger-manifest.v1.json", "repo_preview"),
    artifactSpec("local-ledger-preview", path.join(runRoot, "logical-scale-ledger-preview.ndjson"), "repo/previews/logical-scale-ledger-preview.ndjson", "repo_preview"),
    artifactSpec("local-ranges-preview", path.join(runRoot, "compact-gulp-ranges-preview.ndjson"), "repo/previews/compact-gulp-ranges-preview.ndjson", "repo_preview"),
    artifactSpec("local-genius", path.join(runRoot, "genius-marks-latest.ndjson"), "repo/previews/genius-marks-latest.ndjson", "repo_preview"),
    artifactSpec("local-mistakes", path.join(runRoot, "mistake-marks-latest.ndjson"), "repo/previews/mistake-marks-latest.ndjson", "repo_preview"),
    artifactSpec("local-tracker-summary", path.join(runRoot, "omniflywheel-tracker-summary.v1.json"), "repo/previews/omniflywheel-tracker-summary.v1.json", "repo_preview"),
    artifactSpec("report-json", reportJson, "repo/reports/real-free-agent-logical-scale-ledger-latest.json", "report"),
    artifactSpec("report-md", reportMd, "repo/reports/real-free-agent-logical-scale-ledger-latest.md", "report"),
    artifactSpec("spill-ledger", path.join(spillRunRoot, "logical-scale-ledger.ndjson"), "spill/logical-scale-ledger.ndjson", "spill_full"),
    artifactSpec("spill-ranges", path.join(spillRunRoot, "compact-gulp-ranges.ndjson"), "spill/compact-gulp-ranges.ndjson", "spill_full"),
    artifactSpec("spill-genius", path.join(spillRunRoot, "genius-marks-latest.ndjson"), "spill/genius-marks-latest.ndjson", "spill_full"),
    artifactSpec("spill-mistakes", path.join(spillRunRoot, "mistake-marks-latest.ndjson"), "spill/mistake-marks-latest.ndjson", "spill_full"),
    artifactSpec("spill-tracker-summary", path.join(spillRunRoot, "omniflywheel-tracker-summary.v1.json"), "spill/omniflywheel-tracker-summary.v1.json", "spill_full")
  ];
}

function summarizePayloads(payloads) {
  return payloads.map((payload) => ({
    id: payload.id,
    kind: payload.kind,
    local: repoRel(payload.localPath),
    remoteRel: payload.remoteRel,
    present: fs.existsSync(payload.localPath),
    bytes: fs.existsSync(payload.localPath) ? fs.statSync(payload.localPath).size : 0,
    sha256: fs.existsSync(payload.localPath) ? sha256File(payload.localPath) : null
  }));
}

function assertPayloadsPresent(summary) {
  const missing = summary.filter((payload) => !payload.present);
  if (missing.length) {
    throw new Error(`Missing 20B tracker payloads: ${missing.map((item) => item.id).join(", ")}`);
  }
}

function copyBundle(payloads, options = {}) {
  const remoteRoot = options.remoteRoot || path.join(lirisIncomingRoot, bundleName);
  fs.mkdirSync(remoteRoot, { recursive: true });
  const copied = [];
  for (const payload of payloads) {
    const remotePath = path.join(remoteRoot, payload.remoteRel);
    ensureParent(remotePath);
    fs.copyFileSync(payload.localPath, remotePath);
    copied.push({
      id: payload.id,
      kind: payload.kind,
      local: repoRel(payload.localPath),
      remote: remotePath.replace(/\\/g, "/"),
      bytes: fs.statSync(payload.localPath).size,
      localSha256: sha256File(payload.localPath),
      remoteSha256: sha256File(remotePath)
    });
  }
  return {
    bundleName,
    remoteRoot: remoteRoot.replace(/\\/g, "/"),
    copied,
    allRemoteVerified: copied.every((item) => item.localSha256 === item.remoteSha256)
  };
}

function buildState(copyResult, options = {}) {
  const generatedAt = options.generatedAt || new Date().toISOString();
  const copied = copyResult.copied || [];
  const trackerFacts = options.trackerFacts || {
    logicalWorkers: 20_000_000_000,
    logicalGulps: 10_000_000,
    trackerRows: 20_000,
    trackerStrideGulps: 500,
    geniusMarks: 100,
    mistakeMarks: 100,
    source: "reports/real-free-agent-logical-scale-ledger-latest.json"
  };
  const scaleLabel = scaleLabelFromLogicalWorkers(trackerFacts.logicalWorkers);
  const scaleLabelUpper = scaleLabel.toUpperCase();
  const stateCore = {
    schema: "real-free-agent-omniflywheel-tracker-push.v1",
    generatedAt,
    status: copyResult.allRemoteVerified ? `REAL_FREE_AGENT_${scaleLabelUpper}_TRACKER_PUSH_HASH_VERIFIED` : `REAL_FREE_AGENT_${scaleLabelUpper}_TRACKER_PUSH_HASH_MISMATCH`,
    runId,
    bundleName: copyResult.bundleName || bundleName,
    scaleLabel,
    remoteRoot: copyResult.remoteRoot,
    copied,
    counts: {
      artifacts: copied.length,
      bytes: copied.reduce((sum, item) => sum + Number(item.bytes || 0), 0),
      fullSpillArtifacts: copied.filter((item) => item.kind === "spill_full").length,
      repoPreviewArtifacts: copied.filter((item) => item.kind === "repo_preview").length,
      reports: copied.filter((item) => item.kind === "report").length
    },
    trackerFacts,
    boundary: {
      lirisIncomingOnly: true,
      noLirisCanonicalWrite: true,
      noCanonMutation: true,
      noAuthorityLayerEdit: true,
      compactLogicalCoverageNotLiveModelCalls: true,
      compactLogicalCoverageNotOsProcesses: true
    }
  };
  return { ...stateCore, stateHash: sha256Json(stateCore) };
}

function postLaw001(envelope) {
  return new Promise((resolve) => {
    const data = JSON.stringify(envelope);
    const url = new URL(lirisLaw001);
    const req = http.request({
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data)
      }
    }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, body }));
    });
    req.on("error", (error) => resolve({ ok: false, error: error.message }));
    req.setTimeout(8000, () => {
      req.destroy(new Error("timeout"));
    });
    req.write(data);
    req.end();
  });
}

async function notifyLiris(state) {
  const scaleLabel = state.scaleLabel || scaleLabelFromLogicalWorkers(state.trackerFacts?.logicalWorkers);
  const envelope = {
    schema: "law001-real-free-agent-omniflywheel-tracker-push.v1",
    id: `acer-real-free-agent-${scaleLabel}-tracker-push-${Date.now()}`,
    ts: new Date().toISOString(),
    from: "acer",
    to: "liris",
    verb: "evidence-push",
    mode: "real",
    gate: {
      operatorCosign: `Jesse authorized continuation of the ${scaleLabel.toUpperCase()} tracker restoration lane.`,
      pushIsIncomingOnly: true,
      lirisCanonicalMutation: false
    },
    body: {
      status: state.status,
      runId: state.runId,
      scaleLabel: state.scaleLabel,
      stateHash: state.stateHash,
      bundleName: state.bundleName,
      remoteRoot: state.remoteRoot,
      counts: state.counts,
      trackerFacts: state.trackerFacts,
      boundary: state.boundary,
      next: "Liris validates incoming-acer tracker bundle hashes, then may ingest as evidence under Liris authority."
    }
  };
  const result = await postLaw001(envelope);
  writeJson(paths.postResult, { envelope, result });
  return { envelopeId: envelope.id, result };
}

async function run(options = {}) {
  const payloads = buildPayloadSpecs(options);
  const payloadSummary = summarizePayloads(payloads);
  assertPayloadsPresent(payloadSummary);
  const manifestPath = payloads.find((payload) => payload.id === "manifest")?.localPath;
  const trackerFacts = trackerFactsFromManifest(readJson(manifestPath, {}));
  if (options.dryRun) {
    return {
      ok: true,
      dryRun: true,
      runId,
      bundleName,
      trackerFacts,
      payloads: payloadSummary
    };
  }
  const copyResult = copyBundle(payloads, options);
  const state = buildState(copyResult, { ...options, trackerFacts });
  writeJson(paths.localPushManifest, state);
  const remoteManifest = path.join((options.remoteRoot || path.join(lirisIncomingRoot, bundleName)), "push-manifest.json");
  fs.copyFileSync(paths.localPushManifest, remoteManifest);
  state.localManifest = repoRel(paths.localPushManifest);
  state.remoteManifest = remoteManifest.replace(/\\/g, "/");
  state.manifestSha256 = sha256File(paths.localPushManifest);
  if (!state.copied.every((item) => item.localSha256 === item.remoteSha256)) {
    throw new Error("20B tracker push remote hash verification failed");
  }
  const notify = options.notify ? await notifyLiris(state) : { skipped: true };
  return { ...state, notify };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const result = await run({
    dryRun: args.has("--dry-run"),
    notify: args.has("--notify")
  });
  console.log(JSON.stringify({
    status: result.status || "DRY_RUN",
    dryRun: Boolean(result.dryRun),
    runId: result.runId,
    bundleName: result.bundleName,
    artifacts: result.counts ? result.counts.artifacts : result.payloads.length,
    bytes: result.counts ? result.counts.bytes : result.payloads.reduce((sum, item) => sum + item.bytes, 0),
    stateHash: result.stateHash,
    remoteRoot: result.remoteRoot,
    notify: result.notify
  }, null, 2));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error && error.stack ? error.stack : String(error));
    process.exitCode = 1;
  });
}

module.exports = {
  buildPayloadSpecs,
  summarizePayloads,
  copyBundle,
  buildState,
  trackerFactsFromManifest,
  scaleLabelFromRunId,
  scaleLabelFromLogicalWorkers,
  run
};
