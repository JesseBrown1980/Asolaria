#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427");
const councilRoot = path.join(repoRoot, "data", "agent-index", "council");
const reportsRoot = path.join(repoRoot, "reports");

const LIRIS_30C = Object.freeze({
  path: "data/agent-index/council/D50-WAVE30C-T1-STAGING-READINESS-LIRIS-2026-04-28.md",
  lines: 101,
  sha256: "821b69a2b417921d6622bbbd6179e572ac5d532b92ed33e7eea99a7d47ca40f2",
  status: "LIRIS_FULLY_STAGED_AWAITING_OPERATOR_PHYSICAL_PASTE_REPORTED_BY_LIRIS",
  intakeClass: "HASH_ONLY_OPERATOR_RELAY",
  priorAcerStatus: "NOT_VISIBLE_IN_OPERATOR_RELAY_NO_HASH_FABRICATION"
});

const INPUTS = Object.freeze({
  wave30a: "data/behcs/orchestration/federation-reintegration-20260427/wave30a-gate-disposition-consolidation-acer.v1.json",
  g1Report: "reports/federation-reintegration-g1-t1-staging-verification-latest.json"
});

const OUTPUTS = Object.freeze({
  state: path.join(runRoot, "wave30b-liris-30c-hash-intake-acer.v1.json"),
  d50: path.join(councilRoot, "D50-WAVE30B-LIRIS-30C-HASH-INTAKE-ACER-2026-04-28.md"),
  reportJson: path.join(reportsRoot, "federation-reintegration-wave30b-liris-30c-hash-intake-acer-latest.json"),
  reportMd: path.join(reportsRoot, "federation-reintegration-wave30b-liris-30c-hash-intake-acer-latest.md")
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

function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function sha256Text(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function repoRel(filePath) {
  const relative = path.relative(repoRoot, filePath);
  if (path.isAbsolute(relative) || relative.startsWith("..")) return filePath.replace(/\\/g, "/");
  return relative.replace(/\\/g, "/");
}

function lineCount(text) {
  if (!text) return 0;
  return text.replace(/\r?\n$/, "").split(/\r?\n/).length;
}

function readJsonMaybe(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    return { present: false, path: relativePath, json: null, sha256: null, lines: 0 };
  }
  const buffer = fs.readFileSync(fullPath);
  const text = buffer.toString("utf8");
  return {
    present: true,
    path: relativePath,
    json: JSON.parse(text),
    sha256: sha256Buffer(buffer),
    lines: lineCount(text)
  };
}

function fileInfo(filePath) {
  if (!fs.existsSync(filePath)) return { present: false, path: repoRel(filePath), sha256: null, lines: 0 };
  const buffer = fs.readFileSync(filePath);
  return {
    present: true,
    path: repoRel(filePath),
    sha256: sha256Buffer(buffer),
    lines: lineCount(buffer.toString("utf8"))
  };
}

function buildD50(state) {
  return [
    "# D50 Wave 30B - Liris 30C Hash Intake (ACER)",
    "",
    "| Field | Value |",
    "|---|---|",
    `| status | ${state.status} |`,
    `| generated_at | ${state.generatedAt} |`,
    `| relationship | ${state.relationship} |`,
    `| state_hash | ${state.stateHash} |`,
    `| prior_wave30a_state_hash | ${state.inputs.wave30a.stateHash || "n/a"} |`,
    "",
    "## Intake",
    "",
    `- Liris 30C path: \`${state.liris30c.path}\``,
    `- Liris 30C lines: ${state.liris30c.lines}`,
    `- Liris 30C sha256: \`${state.liris30c.sha256}\``,
    `- Prior ACER status: ${state.liris30c.priorAcerStatus}`,
    `- Updated ACER status: ${state.updatedAcerStatus}`,
    "",
    "## G1 Status",
    "",
    `- ${state.g1Status}`,
    "",
    "## Boundary",
    "",
    state.boundary
  ].join("\n");
}

function buildReport(state, artifacts) {
  return [
    "# Wave 30B Liris 30C Hash Intake",
    "",
    `Generated: ${state.generatedAt}`,
    `Status: ${state.status}`,
    `State hash: ${state.stateHash}`,
    "",
    "## Outputs",
    "",
    ...Object.entries(artifacts).map(([key, value]) => `- ${key}: \`${value.path}\` (${value.sha256 || "pending"})`),
    "",
    "## Result",
    "",
    "- Liris 30C hash is now relayed and recorded on ACER.",
    "- Wave 30A remains immutable; this is an append-only correction/intake.",
    "- G1 still depends on actual operator-pasted bytes, not hash-only relay.",
    "",
    "## Boundary",
    "",
    state.boundary
  ].join("\n");
}

function main() {
  const wave30a = readJsonMaybe(INPUTS.wave30a);
  const g1Report = readJsonMaybe(INPUTS.g1Report);
  const state = {
    schema: "federation-reintegration-wave30b-liris-30c-hash-intake-acer.v1",
    generatedAt,
    status: "DRAFT_ONLY_NOT_RATIFIED",
    relationship: "APPEND_ONLY_LIRIS_30C_HASH_INTAKE_AFTER_WAVE30A_NO_REWRITE",
    wave: { family: "Wave 30", letter: "B", name: "30B", phase: "liris-30c-hash-intake" },
    inputs: {
      wave30a: { present: wave30a.present, sha256: wave30a.sha256, lines: wave30a.lines, stateHash: wave30a.json?.stateHash || null },
      g1Report: { present: g1Report.present, sha256: g1Report.sha256, lines: g1Report.lines, status: g1Report.json?.status || null }
    },
    liris30c: LIRIS_30C,
    updatedAcerStatus: "LIRIS_30C_HASH_RELAYED_HASH_ONLY",
    g1Status: g1Report.json?.status || "PENDING_OPERATOR_T1_BYTES",
    nextRequiredAction: "operator paste of Liris base D11 and Falcon-correction addendum bytes into ACER incoming-t1, then rerun G1 verifier",
    boundary: "Wave 30B hash intake only. No Wave 30A rewrite, no T1 byte copy, no content mirror, no hash fabrication, no peer call, no ACER key generation, no canonical write, no promotion."
  };
  state.stateHash = sha256Text(JSON.stringify(state));

  writeJson(OUTPUTS.state, state);
  writeText(OUTPUTS.d50, buildD50(state));
  const artifacts = {
    state: fileInfo(OUTPUTS.state),
    d50: fileInfo(OUTPUTS.d50)
  };
  writeJson(OUTPUTS.reportJson, { ...state, artifacts });
  artifacts.reportJson = fileInfo(OUTPUTS.reportJson);
  writeText(OUTPUTS.reportMd, buildReport(state, artifacts));
  artifacts.reportMd = fileInfo(OUTPUTS.reportMd);

  console.log(JSON.stringify({
    ok: true,
    status: state.status,
    stateHash: state.stateHash,
    updatedAcerStatus: state.updatedAcerStatus,
    g1Status: state.g1Status,
    artifacts
  }, null, 2));
}

main();
