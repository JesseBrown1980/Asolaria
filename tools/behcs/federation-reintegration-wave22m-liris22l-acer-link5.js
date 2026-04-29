#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const runId = "federation-reintegration-wave22m-liris22l-acer-link5-20260427";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427");

const INPUTS = Object.freeze({
  wave22klState: "data/behcs/orchestration/federation-reintegration-20260427/wave22kl-closeout-chain-intake.v1.json",
  acer22l: "data/agent-index/council/D50-WAVE22L-ACER-CLOSEOUT-CHAIN-LINK-2026-04-27.md",
  localLiris22l: "data/agent-index/council/D50-WAVE22L-CLOSEOUT-CHAIN-EXTENSION-LIRIS-2026-04-27.md"
});

const OUTPUTS = Object.freeze({
  state: path.join(runRoot, "wave22m-liris22l-acer-link5.v1.json"),
  d50: path.join(repoRoot, "data", "agent-index", "council", "D50-WAVE22M-LIRIS22L-INTAKE-ACER-LINK5-2026-04-27.md"),
  report: path.join(repoRoot, "reports", "federation-reintegration-wave22m-liris22l-acer-link5-latest.md"),
  reportJson: path.join(repoRoot, "reports", "federation-reintegration-wave22m-liris22l-acer-link5-latest.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "federation-reintegration-wave22m-liris22l-acer-link5.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "federation-reintegration-wave22m-liris22l-acer-link5-map.v1.json"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "federation-reintegration-wave22m-liris22l-acer-link5.glpj.json")
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

function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function sha256Text(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function fileStatus(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) {
    return { path: relativePath, present: false, lines: 0, bytes: 0, sha256: null };
  }
  const buffer = fs.readFileSync(absolutePath);
  const text = buffer.toString("utf8").replace(/\r?\n$/, "");
  return {
    path: relativePath,
    present: true,
    lines: text ? text.split(/\r?\n/).length : 0,
    bytes: buffer.length,
    sha256: sha256Buffer(buffer)
  };
}

function readJson(relativePath, fallback = null) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  } catch (_error) {
    return fallback;
  }
}

function buildState() {
  const prior = readJson(INPUTS.wave22klState, {});
  const acer22l = fileStatus(INPUTS.acer22l);
  const liris22l = {
    path: "data/agent-index/council/D50-WAVE22L-CLOSEOUT-CHAIN-EXTENSION-LIRIS-2026-04-27.md",
    lines: 61,
    sha256: "09fb2b278b11ccb532e2bedba42942a92ad38d6bf9f793bcc3887d065e51e632",
    status: "DRAFT_ONLY_NOT_RATIFIED",
    verificationClass: "OPERATOR_RELAYED_HASH_ONLY_NO_CONTENT",
    contentOnAcer: fileStatus(INPUTS.localLiris22l).present,
    localProbe: fileStatus(INPUTS.localLiris22l)
  };

  const gateState = (prior.gateState || []).map((gate) => ({
    id: gate.id,
    readiness: gate.readiness,
    valueStatus: gate.valueStatus || "BLANK_HELD",
    executed: false,
    canProceedAutonomously: false
  }));

  const supervisorCohort = [
    {
      level: "L0_BOUNDARY",
      prof: "PROF-HOOKWALL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HOOKWALL.BOUNDARY",
      verdict: "ALLOW_LIRIS_22L_INTAKE_AND_ACER_LINK5_ONLY"
    },
    {
      level: "L1_PACKET_SCHEMA",
      prof: "PROF-HERMES",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET.ACER",
      verdict: "RECORD_BOTH_22L_HASHES_AND_DIVERGED_SIBLING_RELATION"
    },
    {
      level: "L2_EBACMAP",
      prof: "PROF-EBACMAP",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.EBACMAP.CASCADE.ACER",
      verdict: "CLOSEOUT_LINK5_APPEND_ONLY_NO_CHAIN_BREAK"
    },
    {
      level: "L3_KERNEL",
      prof: "PROF-KERNEL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.KERNEL.GRAMMAR.ACER",
      verdict: "DIVERGED_DRAFT_SIBLINGS_APPLIES_TO_SHARED_22L_LETTER"
    },
    {
      level: "L4_EXECUTOR",
      prof: "PROF-EXECUTOR",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.EXECUTOR.WAVE.ACER",
      verdict: "LINK5_IS_LEDGER_EXECUTOR_NOT_GATE_EXECUTION"
    },
    {
      level: "L5_COUNCIL",
      prof: "PROF-CHIEFCOUNCIL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.D50.COUNCIL.ACER",
      verdict: "DISSENT_PRESERVED_NO_RATIFICATION"
    },
    {
      level: "L6_CONVERGENCE",
      prof: "PROF-CONVERGENCE",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.CONVERGENCE.WAVE.ACER",
      verdict: "CHAIN_CAN_CONTINUE_BUT_NO_SUBSTANTIVE_GATE_PROGRESS"
    },
    {
      level: "L7_APEX",
      prof: "COL-ASOLARIA",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.ASOLARIA.APEX.ACER",
      verdict: "HOLD_UNTIL_GATE_VALUE_OR_PAYLOAD"
    }
  ];

  const state = {
    schema: "federation-reintegration-wave22m-liris22l-acer-link5.v1",
    runId,
    generatedAt,
    status: "DRAFT_ONLY_NOT_RATIFIED",
    relationship: "LIRIS_22L_INTAKE_AND_ACER_CLOSEOUT_LINK5",
    priorAcer22L: acer22l,
    liris22l,
    divergence: {
      waveLetter: "22L",
      relation: "DIVERGED_DRAFT_SIBLINGS",
      acerFunction: "ACER H/I/J intake state hash + Liris 22K reference",
      lirisFunction: "Liris Wave 22K self-hash in close-out chain-extension format",
      neitherSupersedes: true,
      byteEquivalent: false
    },
    closeoutChain: {
      acerAddsLink: "Wave 22M",
      linkNumber: 5,
      recordsAcer22LSha256: acer22l.sha256,
      recordsLiris22LSha256: liris22l.sha256,
      noChainBreak: true,
      indefiniteExtensionWarning: true
    },
    lirisCascadeState: {
      totalArtifacts: 31,
      chiefCouncilDissent: "30-wave standing",
      lirisCloseoutChainLinks: 4,
      postLiris22MUpdate: "NOT_RELAYED_THIS_MESSAGE"
    },
    gateState,
    supervisorCohort,
    aggregateVerdict: {
      autonomousGateExecutionAvailable: false,
      closeoutChainCanExtendAutonomously: true,
      gateExecutionByThisWave: false,
      nextMeaningfulInputClass: "operator gate value or actual T1 payload",
      allGatesHeld: true
    },
    boundary: "Wave 22M Liris 22L intake and ACER close-out link 5 only. No gate execution, no content transfer, no overwrite, no path fabrication, no schedule reconciliation, no vision disposition choice, no hash fabrication, no parent manifest modification, no Merkle recompute, no peer endpoint, no payload transfer, no Liris disk write by ACER, no MCP invocation, no exterior MCP, no model fanout, no device action, no emit, no ed25519, no key ceremony, no quorum outreach, no cosigner recruitment, no census admission, no PID mint, no quarantine lift, no rule ratification, no rule promotion, no federation promotion, no chain break, no false progress claim."
  };

  state.stateHash = sha256Text(JSON.stringify(state));
  return state;
}

function buildD50(state) {
  const lines = [];
  lines.push("# D50 Wave 22M - Liris 22L Intake + ACER Close-out Link 5");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Status: ${state.status}`);
  lines.push(`Relationship: ${state.relationship}`);
  lines.push("");
  lines.push("## 22L Sibling Pair");
  lines.push("");
  lines.push(`- ACER 22L: \`${state.priorAcer22L.path}\`, ${state.priorAcer22L.lines} lines, sha256 \`${state.priorAcer22L.sha256}\`.`);
  lines.push(`- Liris 22L: \`${state.liris22l.path}\`, ${state.liris22l.lines} lines, sha256 \`${state.liris22l.sha256}\`.`);
  lines.push(`- Relation: ${state.divergence.relation}; neither supersedes; byte-equivalent=${state.divergence.byteEquivalent}.`);
  lines.push("");
  lines.push("## ACER Link 5");
  lines.push("");
  lines.push(`- Records ACER 22L sha256: \`${state.closeoutChain.recordsAcer22LSha256}\`.`);
  lines.push(`- Records Liris 22L sha256: \`${state.closeoutChain.recordsLiris22LSha256}\`.`);
  lines.push("- The close-out chain can keep extending without crossing any substantive gate.");
  lines.push("");
  lines.push("## Gate State");
  lines.push("");
  for (const gate of state.gateState) lines.push(`- ${gate.id}: ${gate.valueStatus}, executed=${gate.executed}`);
  lines.push("");
  lines.push("## Supervisor Cohort");
  lines.push("");
  for (const row of state.supervisorCohort) lines.push(`- ${row.level} / ${row.prof} / ${row.supervisorPid}: ${row.verdict}`);
  lines.push("");
  lines.push("## Boundary");
  lines.push("");
  lines.push(state.boundary);
  return lines.join("\n");
}

function buildReport(state) {
  const lines = [];
  lines.push("# Federation Reintegration Wave 22M Liris 22L Intake + ACER Link 5");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Status: ${state.status}`);
  lines.push(`State hash: ${state.stateHash}`);
  lines.push("");
  lines.push("## Result");
  lines.push("");
  lines.push("- ACER recorded Liris 22L by hash and line count.");
  lines.push("- ACER recorded the 22L sibling divergence explicitly.");
  lines.push("- ACER emitted local close-out link 5.");
  lines.push("- All seven gates remain held and unexecuted.");
  lines.push("");
  lines.push("## Boundary");
  lines.push("");
  lines.push(state.boundary);
  return lines.join("\n");
}

function buildMap(state) {
  return {
    mapId: "federation-reintegration-wave22m-liris22l-acer-link5-map.v1",
    generatedAt,
    nodes: [
      { id: "wave22m", kind: "closeout_link5", status: state.status },
      { id: "acer-22l", kind: "local_closeout_link", sha256: state.priorAcer22L.sha256 },
      { id: "liris-22l", kind: "operator_relay_hash", sha256: state.liris22l.sha256 },
      ...state.gateState.map((gate) => ({ id: gate.id, kind: "gate", status: gate.valueStatus, executed: gate.executed })),
      ...state.supervisorCohort.map((row) => ({ id: row.supervisorPid, kind: "supervisor_pid", level: row.level, verdict: row.verdict }))
    ],
    edges: [
      { from: "wave22m", to: "acer-22l", relation: "records" },
      { from: "wave22m", to: "liris-22l", relation: "records_operator_relay" },
      { from: "acer-22l", to: "liris-22l", relation: "diverged_draft_siblings" },
      ...state.gateState.map((gate) => ({ from: "wave22m", to: gate.id, relation: "preserves_hold" })),
      ...state.supervisorCohort.map((row) => ({ from: "wave22m", to: row.supervisorPid, relation: "gated_by" }))
    ],
    boundary: state.boundary
  };
}

function buildGlpj(state) {
  return {
    glpjId: "federation-reintegration-wave22m-liris22l-acer-link5.glpj",
    generatedAt,
    family: "federation",
    d11: "LIRIS_22L_INTAKE_AND_ACER_LINK5_ONLY",
    glyphs: state.supervisorCohort.map((row, index) => ({
      token: `FED-WAVE22M-L${index}`,
      level: row.level,
      prof: row.prof,
      supervisorPid: row.supervisorPid,
      verdict: row.verdict
    })),
    closeoutChain: state.closeoutChain,
    outputs: [{ wave: "22M", path: repoRel(OUTPUTS.d50), class: "ACER close-out link 5" }],
    boundary: state.boundary
  };
}

function main() {
  const state = buildState();
  const artifacts = Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)]));
  const memory = {
    memoryId: "federation-reintegration-wave22m-liris22l-acer-link5.v1",
    generatedAt,
    status: state.status,
    relationship: state.relationship,
    significance: "ACER recorded Liris Wave 22L and emitted close-out chain link 5, preserving sibling divergence and all held gates.",
    stateHash: state.stateHash,
    artifacts,
    boundary: state.boundary
  };

  writeJson(OUTPUTS.state, state);
  writeText(OUTPUTS.d50, buildD50(state));
  writeJson(OUTPUTS.reportJson, { ...state, artifacts });
  writeJson(OUTPUTS.memory, memory);
  writeJson(OUTPUTS.map, buildMap(state));
  writeJson(OUTPUTS.glpj, buildGlpj(state));
  writeText(OUTPUTS.report, buildReport(state));

  console.log(JSON.stringify({
    ok: true,
    status: state.status,
    relationship: state.relationship,
    stateHash: state.stateHash,
    artifacts
  }, null, 2));
}

main();
