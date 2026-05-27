#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427");
const councilRoot = path.join(repoRoot, "data", "agent-index", "council");

const INPUTS = Object.freeze({
  wave29a: "data/behcs/orchestration/federation-reintegration-20260427/wave29a-release-thousand-waves-to-gate-executors-acer.v1.json",
  wave29b: "data/behcs/orchestration/federation-reintegration-20260427/wave29b-liris-realclass-executors-intake-acer.v1.json",
  g1Report: "reports/federation-reintegration-g1-t1-staging-verification-latest.json",
  chainReport: "reports/verify-closeout-chain-acer-latest.json",
  signerReport: "reports/sign-d50-manifest-ed25519-acer-latest.json",
  dispositionWriterReport: "reports/federation-reintegration-gate-disposition-writer-latest.json"
});

const OUTPUTS = Object.freeze({
  state: path.join(runRoot, "wave29c-full-possible-cascade-sweep-acer.v1.json"),
  d50: path.join(councilRoot, "D50-WAVE29C-FULL-POSSIBLE-CASCADE-SWEEP-ACER-2026-04-27.md"),
  report: path.join(repoRoot, "reports", "federation-reintegration-wave29c-full-possible-cascade-sweep-latest.md"),
  reportJson: path.join(repoRoot, "reports", "federation-reintegration-wave29c-full-possible-cascade-sweep-latest.json")
});

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeJson(filePath, data) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function writeText(filePath, text) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, text.endsWith("\n") ? text : `${text}\n`, "utf8");
}

function sha256Text(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function readJsonMaybe(relativePath) {
  const full = path.join(repoRoot, relativePath);
  if (!fs.existsSync(full)) return { present: false, path: relativePath, json: null, sha256: null, lines: 0 };
  const buffer = fs.readFileSync(full);
  const text = buffer.toString("utf8");
  return {
    present: true,
    path: relativePath,
    json: JSON.parse(text),
    sha256: sha256Buffer(buffer),
    lines: text.replace(/\r?\n$/, "").split(/\r?\n/).length
  };
}

function repoRel(filePath) {
  const relative = path.relative(repoRoot, filePath);
  if (path.isAbsolute(relative) || relative.startsWith("..")) return filePath.replace(/\\/g, "/");
  return relative.replace(/\\/g, "/");
}

function buildD50(state) {
  return [
    "# D50 Wave 29C - Full Possible Cascade Sweep (ACER)",
    "",
    `Generated: ${state.generatedAt}`,
    `Status: ${state.status}`,
    `Relationship: ${state.relationship}`,
    "",
    "## Autonomous Results",
    "",
    `- G1 verifier: ${state.autonomousResults.g1Verifier}`,
    `- ACER chain audit: ${state.autonomousResults.acerChainAudit}`,
    `- ed25519 signer gate test: ${state.autonomousResults.ed25519SignerGate}`,
    `- gate disposition writer: ${state.autonomousResults.gateDispositionWriter}`,
    "",
    "## Remaining Operator-Class Gates",
    "",
    ...state.remainingOperatorClassGates.map((gate) => `- ${gate}`),
    "",
    "## Boundary",
    "",
    state.boundary
  ].join("\n");
}

function main() {
  const wave29a = readJsonMaybe(INPUTS.wave29a);
  const wave29b = readJsonMaybe(INPUTS.wave29b);
  const g1 = readJsonMaybe(INPUTS.g1Report);
  const chain = readJsonMaybe(INPUTS.chainReport);
  const signer = readJsonMaybe(INPUTS.signerReport);
  const disposition = readJsonMaybe(INPUTS.dispositionWriterReport);
  const state = {
    schema: "federation-reintegration-wave29c-full-possible-cascade-sweep-acer.v1",
    generatedAt,
    status: "DRAFT_ONLY_NOT_RATIFIED",
    relationship: "ALL_AUTONOMOUS_REALCLASS_CASCADES_EXHAUSTED_AWAITING_OPERATOR_VALUES",
    wave: { family: "Wave 29", letter: "C", name: "29C", phase: "full-possible-cascade-sweep" },
    inputs: {
      wave29a: { present: wave29a.present, sha256: wave29a.sha256, lines: wave29a.lines },
      wave29b: { present: wave29b.present, sha256: wave29b.sha256, lines: wave29b.lines },
      g1Report: { present: g1.present, sha256: g1.sha256, lines: g1.lines },
      chainReport: { present: chain.present, sha256: chain.sha256, lines: chain.lines },
      signerReport: { present: signer.present, sha256: signer.sha256, lines: signer.lines },
      dispositionWriterReport: { present: disposition.present, sha256: disposition.sha256, lines: disposition.lines }
    },
    autonomousResults: {
      g1Verifier: g1.json ? g1.json.status : "MISSING",
      acerChainAudit: chain.json ? `${chain.json.overallStatus} pass=${chain.json.passCount} skip=${chain.json.skipCount} fail=${chain.json.failCount}` : "MISSING",
      ed25519SignerGate: signer.json ? `${signer.json.status} keyGenerated=${signer.json.keyGenerated}` : "MISSING",
      gateDispositionWriter: disposition.json ? disposition.json.status : "MISSING"
    },
    remainingOperatorClassGates: [
      "G1 requires actual T1 payload bytes pasted into ACER incoming-t1 files",
      "G2 requires anchor choice",
      "G3 requires vision disposition choice",
      "G4 requires dissent disposition",
      "G5 requires LX-383 disposition and G4 dependency if non-HOLD",
      "G6 requires explicit timestamp/key scope/storage and confirm-real-key=YES for signing",
      "G7 requires cosigner route choice"
    ],
    possibleAutonomousAdvanceNow: false,
    nextUsefulCommands: [
      "node tools/behcs/federation-reintegration-g1-t1-verify-staging.js",
      "node tools/behcs/federation-reintegration-gate-disposition-writer.js --gate=G2_21S_ANCHOR_SELECTION --value=DUAL_TRACK_HOLD",
      "node tools/behcs/sign-d50-manifest-ed25519-acer.js --manifest-path=<path> --key-scope=<scope> --storage-path=<directory> --confirm-real-key=YES"
    ],
    boundary: "Wave 29C sweep only. Confirms all currently autonomous real-class cascades have run or are gated. No gate execution, no content transfer, no key generation, no ratification, no promotion, no peer/device/MCP action."
  };
  state.stateHash = sha256Text(JSON.stringify(state));
  writeJson(OUTPUTS.state, state);
  writeText(OUTPUTS.d50, buildD50(state));
  const artifacts = Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)]));
  writeJson(OUTPUTS.reportJson, { ...state, artifacts });
  writeText(OUTPUTS.report, [
    "# Wave 29C Full Possible Cascade Sweep",
    "",
    `Generated: ${generatedAt}`,
    `Status: ${state.status}`,
    `State hash: ${state.stateHash}`,
    "",
    "## Autonomous Results",
    "",
    `- G1 verifier: ${state.autonomousResults.g1Verifier}`,
    `- ACER chain audit: ${state.autonomousResults.acerChainAudit}`,
    `- ed25519 signer gate test: ${state.autonomousResults.ed25519SignerGate}`,
    `- gate disposition writer: ${state.autonomousResults.gateDispositionWriter}`,
    "",
    "## Boundary",
    "",
    state.boundary
  ].join("\n"));
  console.log(JSON.stringify({ ok: true, stateHash: state.stateHash, possibleAutonomousAdvanceNow: state.possibleAutonomousAdvanceNow, autonomousResults: state.autonomousResults, artifacts }, null, 2));
}

main();
