#!/usr/bin/env node
"use strict";

const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..", "..");
const runId = "operator-first-message-intake-20260428";
const defaultSource = process.env.OPERATOR_FIRST_MESSAGE_PATH || "\\\\192.168.100.2\\liris-asolaria-old\\OPERATOR-FIRST-MESSAGE.txt";
const lirisCanonicalPath = "C:\\Users\\rayss\\Asolaria\\OPERATOR-FIRST-MESSAGE.txt";

const paths = Object.freeze({
  runRoot: path.join(repoRoot, "data", "behcs", "orchestration", runId),
  state: path.join(repoRoot, "data", "behcs", "orchestration", runId, "operator-first-message-intake-acer.v1.json"),
  reportJson: path.join(repoRoot, "reports", "operator-first-message-intake-latest.json"),
  reportMd: path.join(repoRoot, "reports", "operator-first-message-intake-latest.md")
});

const receiptPatterns = Object.freeze([
  ["hilbert_pid_100b", "100,000,000,000"],
  ["agent_space_400b", "400,000,000,000"],
  ["empirical_million_agent_test", "1,000,000-agent"],
  ["free_agent_stack", "free-agent stack"],
  ["behcs_256_kernel", "BEHCS-256"],
  ["edgelevelgcn_ground_truth", "EdgeLevelGCN"],
  ["mistakes_gnn_classified", "470 million mistakes"],
  ["external_authority_supremacy", "EXTERNAL_AUTHORITY_SUPREMACY"],
  ["bilateral_live_federation", "Bilateral live federation"],
  ["hard_laws", "LAW-001"],
  ["model_selector", "policy selector"],
  ["logical_vs_empirical", "NDJSON"],
  ["desktop_archaeology", "desktop archaeology"],
  ["frozen_polymorphism", "Frozen-Polymorphism"],
  ["d11_evidence_levels", "D11"],
  ["source_line_citations", "file paths and line numbers"]
]);

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

function repoRel(filePath) {
  const rel = path.relative(repoRoot, filePath);
  return (path.isAbsolute(rel) || rel.startsWith("..") ? filePath : rel).replace(/\\/g, "/");
}

function splitLines(text) {
  return String(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
}

function readSource(filePath = defaultSource) {
  const buffer = fs.readFileSync(filePath);
  const text = buffer.toString("utf8");
  const lines = splitLines(text).filter((line, index, all) => index < all.length - 1 || line.length > 0);
  return {
    sourcePath: filePath,
    lirisCanonicalPath,
    bytes: buffer.length,
    sha256: sha256Buffer(buffer),
    lineCount: lines.length,
    firstLine: lines[0] || "",
    lines
  };
}

function findPatternLine(lines, pattern) {
  const needle = String(pattern).toLowerCase();
  const index = lines.findIndex((line) => line.toLowerCase().includes(needle));
  if (index < 0) return null;
  return {
    lineNumber: index + 1,
    line: lines[index]
  };
}

function extractReceipts(source) {
  return receiptPatterns.map(([id, pattern]) => ({
    id,
    pattern,
    ...findPatternLine(source.lines, pattern)
  }));
}

function buildState(source, options = {}) {
  const receipts = extractReceipts(source);
  const missing = receipts.filter((receipt) => !receipt.lineNumber).map((receipt) => receipt.id);
  const stateCore = {
    schema: "operator-first-message-intake-acer.v1",
    generatedAt: options.generatedAt || new Date().toISOString(),
    status: missing.length ? "OPERATOR_FIRST_MESSAGE_INTAKE_WITH_MISSING_PATTERNS" : "OPERATOR_FIRST_MESSAGE_INTAKE_VERIFIED",
    host: os.hostname(),
    runId,
    source: {
      observedPath: source.sourcePath.replace(/\\/g, "/"),
      lirisCanonicalPath: source.lirisCanonicalPath,
      bytes: source.bytes,
      sha256: source.sha256,
      lineCount: source.lineCount,
      firstLine: source.firstLine
    },
    receipts,
    missing,
    interpretation: {
      class: "readclass_evidence_only",
      role: "model_agnostic_first_message_canon_receipt",
      notAHandAuthoredMutation: true,
      doNotRebuildListedSystems: true,
      useLineCitationsWhenActedOn: true
    },
    boundary: {
      noLirisWrite: true,
      noCanonMutation: true,
      noAdapterWiring: true,
      noHookWiring: true,
      noAuthorityLayerEdit: true
    }
  };
  return { ...stateCore, stateHash: sha256Json(stateCore) };
}

function formatReport(state) {
  const receiptRows = state.receipts.map((receipt) =>
    `| ${receipt.id} | ${receipt.lineNumber || "missing"} | ${receipt.pattern} |`
  ).join("\n");
  return [
    "# Operator First Message Intake",
    "",
    `Generated: ${state.generatedAt}`,
    `Status: ${state.status}`,
    `State hash: ${state.stateHash}`,
    "",
    "## Source",
    "",
    `- Liris path: \`${state.source.lirisCanonicalPath}\``,
    `- Observed via: \`${state.source.observedPath}\``,
    `- Bytes observed: ${state.source.bytes}`,
    `- Lines: ${state.source.lineCount}`,
    `- SHA-256: \`${state.source.sha256}\``,
    "",
    "## Receipt Lines",
    "",
    "| Receipt | Line | Pattern |",
    "| --- | ---: | --- |",
    receiptRows,
    "",
    "## Boundary",
    "",
    "- Readclass evidence only.",
    "- No Liris write.",
    "- No canon, adapter, hook, or authority-layer mutation.",
    "- Use the cited line numbers when another agent or operator acts on this intake.",
    ""
  ].join("\n");
}

function execute(options = {}) {
  const source = readSource(options.sourcePath || defaultSource);
  const state = buildState(source, options);
  writeJson(paths.state, state);
  writeJson(paths.reportJson, state);
  writeText(paths.reportMd, formatReport(state));
  return state;
}

function main() {
  const args = process.argv.slice(2);
  const sourceIndex = args.indexOf("--source");
  const sourcePath = sourceIndex >= 0 ? args[sourceIndex + 1] : defaultSource;
  const state = execute({ sourcePath });
  console.log(JSON.stringify({
    status: state.status,
    stateHash: state.stateHash,
    bytes: state.source.bytes,
    sha256: state.source.sha256,
    lineCount: state.source.lineCount,
    report: repoRel(paths.reportMd)
  }, null, 2));
}

if (require.main === module) {
  main();
}

module.exports = {
  readSource,
  extractReceipts,
  buildState,
  execute
};
