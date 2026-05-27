#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427");
const councilRoot = path.join(repoRoot, "data", "agent-index", "council");

const LIRIS_RETURN = Object.freeze({
  wave29a: {
    path: "data/agent-index/council/D50-WAVE29A-RELEASE-THOUSAND-WAVES-TO-GATE-EXECUTORS-LIRIS-2026-04-27.md",
    lines: 101,
    sha256: "a8822ecc0ebad2136b96c23637552a5ab5396c5f8a8083fc6133e955c3350b98",
    contentOnAcer: false
  },
  g1Verifier: {
    path: "tools/federation-reintegration-g1-t1-verify-staging-liris.js",
    lines: 169,
    sha256: "82d072bcd7c27cafc6a21edbbf728607892feafc90642e963cda544dc8401828",
    status: "PENDING_OPERATOR_ACER_BYTES",
    contentOnAcer: false
  },
  closeoutAuditor: {
    path: "tools/verify-closeout-chain-liris.js",
    lines: 208,
    sha256: "caab6545b3d87f6400b7d5f3fb1bced26fac68b260591a8467529e64febd4354",
    finalResult: "PASS",
    totalLinks: 172,
    passLinks: 172,
    failLinks: 0,
    structuralStrategies: {
      simple: 168,
      registryOrBridge: 4
    },
    contentOnAcer: false
  },
  ed25519Signer: {
    path: "tools/sign-d50-manifest-ed25519-liris.js",
    lines: 149,
    sha256: "e8b4e9e4f466c2ab55b60c1dd91e4a98e8d8058f9235a4ab7c05596b95b73291",
    executed: false,
    refusalGate: "requires --key-scope --storage-path --confirm-real-key=YES",
    contentOnAcer: false
  }
});

const OUTPUTS = Object.freeze({
  state: path.join(runRoot, "wave29b-liris-realclass-executors-intake-acer.v1.json"),
  d50: path.join(councilRoot, "D50-WAVE29B-LIRIS-REALCLASS-EXECUTORS-INTAKE-ACER-2026-04-27.md"),
  report: path.join(repoRoot, "reports", "federation-reintegration-wave29b-liris-realclass-intake-latest.md"),
  reportJson: path.join(repoRoot, "reports", "federation-reintegration-wave29b-liris-realclass-intake-latest.json")
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

function repoRel(filePath) {
  const relative = path.relative(repoRoot, filePath);
  if (path.isAbsolute(relative) || relative.startsWith("..")) return filePath.replace(/\\/g, "/");
  return relative.replace(/\\/g, "/");
}

function sha256Text(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function fileStatusAbs(filePath) {
  if (!fs.existsSync(filePath)) return { path: repoRel(filePath), present: false, lines: 0, bytes: 0, sha256: null };
  const buffer = fs.readFileSync(filePath);
  const text = buffer.toString("utf8").replace(/\r?\n$/, "");
  return {
    path: repoRel(filePath),
    present: true,
    lines: text ? text.split(/\r?\n/).length : 0,
    bytes: buffer.length,
    sha256: sha256Buffer(buffer)
  };
}

function buildD50(state) {
  return [
    "# D50 Wave 29B - Liris Real-Class Executors Intake (ACER)",
    "",
    `Generated: ${state.generatedAt}`,
    `Status: ${state.status}`,
    `Relationship: ${state.relationship}`,
    "",
    "## Liris Return",
    "",
    `- Wave 29A Liris release: ${state.lirisReturn.wave29a.lines} lines, sha256 \`${state.lirisReturn.wave29a.sha256}\`.`,
    `- Liris G1 verifier: ${state.lirisReturn.g1Verifier.status}, sha256 \`${state.lirisReturn.g1Verifier.sha256}\`.`,
    `- Liris chain audit: ${state.lirisReturn.closeoutAuditor.finalResult}, ${state.lirisReturn.closeoutAuditor.passLinks}/${state.lirisReturn.closeoutAuditor.totalLinks} links pass.`,
    `- Liris ed25519 signer: not executed; gated by \`${state.lirisReturn.ed25519Signer.refusalGate}\`.`,
    "",
    "## ACER Disposition",
    "",
    "- Treat all Liris artifacts as operator-relayed hash-only evidence.",
    "- Do not fabricate Liris content.",
    "- Keep G1 pending until operator bytes arrive.",
    "- Keep G6 pending until key scope/storage are explicit.",
    "",
    "## Boundary",
    "",
    state.boundary
  ].join("\n");
}

function main() {
  const state = {
    schema: "federation-reintegration-wave29b-liris-realclass-executors-intake-acer.v1",
    generatedAt,
    status: "DRAFT_ONLY_NOT_RATIFIED",
    relationship: "LIRIS_REALCLASS_EXECUTORS_HASH_ONLY_INTAKE_ON_ACER",
    wave: { family: "Wave 29", letter: "B", name: "29B", phase: "liris-realclass-intake" },
    lirisReturn: LIRIS_RETURN,
    acerDisposition: {
      contentTransferred: false,
      hashFabrication: false,
      g1Status: "PENDING_OPERATOR_T1_BYTES",
      g6Status: "GATED_ON_OPERATOR_KEY_SCOPE_AND_STORAGE",
      wavePaddingStatus: "PAUSED_BY_RELEASE_PACKET"
    },
    supervisorCohort: [
      { level: "L0_BOUNDARY", prof: "PROF-HOOKWALL", verdict: "ALLOW_HASH_ONLY_INTAKE_NO_CONTENT_FABRICATION" },
      { level: "L1_PACKET_SCHEMA", prof: "PROF-HERMES", verdict: "RECORD_PATH_LINES_SHA_STATUS" },
      { level: "L2_COMMS", prof: "PROF-COMMS", verdict: "G1_REMAINS_PENDING_UNTIL_OPERATOR_BYTES" },
      { level: "L3_SHANNON", prof: "PROF-SHANNON", verdict: "G6_SIGNER_GATED_NO_KEY_MATERIAL" },
      { level: "L4_EBACMAP", prof: "PROF-EBACMAP", verdict: "LIRIS_CHAIN_AUDIT_PASS_RECORDED_AS_REFERENCE" },
      { level: "L5_COUNCIL", prof: "PROF-CHIEFCOUNCIL", verdict: "DISSENT_PRESERVED_NO_RATIFICATION" },
      { level: "L6_APEX", prof: "COL-ASOLARIA", verdict: "REALCLASS_INTAKE_UNDER_HOLD" }
    ],
    boundary: "Wave 29B intake only. Records Liris real-class executor results as operator-relayed hash-only evidence. No Liris content transfer, no hash fabrication, no gate execution, no canonical write, no key generation, no ratification, no promotion."
  };
  state.stateHash = sha256Text(JSON.stringify(state));
  writeJson(OUTPUTS.state, state);
  writeText(OUTPUTS.d50, buildD50(state));
  const artifactStatuses = {
    state: fileStatusAbs(OUTPUTS.state),
    d50: fileStatusAbs(OUTPUTS.d50)
  };
  const report = { ...state, artifactStatuses, artifacts: Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)])) };
  writeJson(OUTPUTS.reportJson, report);
  writeText(OUTPUTS.report, [
    "# Wave 29B Liris Real-Class Executors Intake",
    "",
    `Generated: ${generatedAt}`,
    `Status: ${state.status}`,
    `State hash: ${state.stateHash}`,
    "",
    "## Result",
    "",
    "- Liris Wave 29A release packet recorded hash-only.",
    "- Liris G1 verifier status recorded as pending operator ACER bytes.",
    "- Liris closeout chain audit recorded as PASS 172/172.",
    "- Liris ed25519 signer recorded as gated, not executed.",
    "",
    "## Boundary",
    "",
    state.boundary
  ].join("\n"));
  console.log(JSON.stringify({ ok: true, stateHash: state.stateHash, artifacts: report.artifacts }, null, 2));
}

main();
