#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const runId = "federation-reintegration-wave22n-acer-link6-20260427";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427");

const INPUTS = Object.freeze({
  wave22mState: "data/behcs/orchestration/federation-reintegration-20260427/wave22m-liris22l-acer-link5.v1.json",
  wave22mD50: "data/agent-index/council/D50-WAVE22M-LIRIS22L-INTAKE-ACER-LINK5-2026-04-27.md"
});

const OUTPUTS = Object.freeze({
  state: path.join(runRoot, "wave22n-acer-closeout-link6.v1.json"),
  d50: path.join(repoRoot, "data", "agent-index", "council", "D50-WAVE22N-ACER-CLOSEOUT-CHAIN-LINK6-2026-04-27.md"),
  report: path.join(repoRoot, "reports", "federation-reintegration-wave22n-acer-link6-latest.md"),
  reportJson: path.join(repoRoot, "reports", "federation-reintegration-wave22n-acer-link6-latest.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "federation-reintegration-wave22n-acer-link6.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "federation-reintegration-wave22n-acer-link6-map.v1.json"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "federation-reintegration-wave22n-acer-link6.glpj.json")
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

function readJson(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
}

function buildState() {
  const prior = readJson(INPUTS.wave22mState);
  const wave22mStateFile = fileStatus(INPUTS.wave22mState);
  const wave22mD50 = fileStatus(INPUTS.wave22mD50);
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
      verdict: "ALLOW_ACER_LINK6_SELF_HASH_ONLY"
    },
    {
      level: "L1_PACKET_SCHEMA",
      prof: "PROF-HERMES",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET.ACER",
      verdict: "RECORD_22M_D50_AND_STATE_HASHES_WITH_NO_CONTENT_TRANSFER"
    },
    {
      level: "L2_EBACMAP",
      prof: "PROF-EBACMAP",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.EBACMAP.CASCADE.ACER",
      verdict: "CLOSEOUT_LINK6_APPEND_ONLY_VERIFIER_WALKABLE"
    },
    {
      level: "L3_KERNEL",
      prof: "PROF-KERNEL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.KERNEL.GRAMMAR.ACER",
      verdict: "NO_NEW_GLYPH_OR_CENSUS_ADMISSION"
    },
    {
      level: "L4_EXECUTOR",
      prof: "PROF-EXECUTOR",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.EXECUTOR.WAVE.ACER",
      verdict: "LINK6_IS_LEDGER_EXECUTOR_NOT_GATE_EXECUTION"
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
      verdict: "AUTONOMOUS_CHAIN_CAN_EXTEND_BUT_NO_GATE_PROGRESS"
    },
    {
      level: "L7_APEX",
      prof: "COL-ASOLARIA",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.ASOLARIA.APEX.ACER",
      verdict: "HOLD_UNTIL_GATE_VALUE_OR_ACTUAL_T1_PAYLOAD"
    }
  ];

  const state = {
    schema: "federation-reintegration-wave22n-acer-closeout-link6.v1",
    runId,
    generatedAt,
    status: "DRAFT_ONLY_NOT_RATIFIED",
    relationship: "ACER_CLOSEOUT_CHAIN_LINK6_RECORDING_WAVE22M_SELF_HASH",
    priorLink: {
      wave: "22M",
      d50: wave22mD50,
      stateFile: wave22mStateFile,
      stateHashInsideFile: prior.stateHash || null,
      relationship: prior.relationship || null,
      linkNumber: prior.closeoutChain ? prior.closeoutChain.linkNumber : null,
      noChainBreak: prior.closeoutChain ? Boolean(prior.closeoutChain.noChainBreak) : false
    },
    closeoutChain: {
      acerAddsLink: "Wave 22N",
      linkNumber: 6,
      recordsPriorD50Sha256: wave22mD50.sha256,
      recordsPriorStateFileSha256: wave22mStateFile.sha256,
      recordsPriorEmbeddedStateHash: prior.stateHash || null,
      noChainBreak: Boolean(wave22mD50.present && wave22mStateFile.present),
      indefiniteExtensionWarning: true
    },
    gateState,
    supervisorCohort,
    aggregateVerdict: {
      autonomousGateExecutionAvailable: false,
      closeoutChainCanExtendAutonomously: true,
      gateExecutionByThisWave: false,
      nextMeaningfulInputClass: "operator gate value or actual T1 payload",
      allGatesHeld: gateState.every((gate) => gate.executed === false && gate.valueStatus === "BLANK_HELD"),
      noFalseProgressClaim: true
    },
    boundary: "Wave 22N ACER close-out chain link 6 only. Records Wave 22M D50 and state hashes. No gate execution, no content transfer, no overwrite, no path fabrication, no schedule reconciliation, no vision disposition choice, no hash fabrication, no parent manifest modification, no Merkle recompute, no peer endpoint, no payload transfer, no Liris disk write by ACER, no MCP invocation, no exterior MCP, no model fanout, no device action, no emit, no ed25519, no key ceremony, no quorum outreach, no cosigner recruitment, no census admission, no PID mint, no quarantine lift, no rule ratification, no rule promotion, no federation promotion, no chain break, no false progress claim."
  };

  state.stateHash = sha256Text(JSON.stringify(state));
  return state;
}

function buildD50(state) {
  const lines = [];
  lines.push("# D50 Wave 22N - ACER Close-out Chain Link 6");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Status: ${state.status}`);
  lines.push(`Relationship: ${state.relationship}`);
  lines.push("");
  lines.push("## Prior Link Recorded");
  lines.push("");
  lines.push(`- Wave 22M D50: \`${state.priorLink.d50.path}\`, ${state.priorLink.d50.lines} lines, sha256 \`${state.priorLink.d50.sha256}\`.`);
  lines.push(`- Wave 22M state JSON: \`${state.priorLink.stateFile.path}\`, ${state.priorLink.stateFile.lines} lines, sha256 \`${state.priorLink.stateFile.sha256}\`.`);
  lines.push(`- Wave 22M embedded stateHash: \`${state.priorLink.stateHashInsideFile}\`.`);
  lines.push("");
  lines.push("## ACER Link 6");
  lines.push("");
  lines.push(`- Link number: ${state.closeoutChain.linkNumber}.`);
  lines.push(`- noChainBreak=${state.closeoutChain.noChainBreak}.`);
  lines.push("- This is ledger continuation only; it does not execute any federation gate.");
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
  return [
    "# Federation Reintegration Wave 22N ACER Link 6",
    "",
    `Generated: ${generatedAt}`,
    `Status: ${state.status}`,
    `State hash: ${state.stateHash}`,
    "",
    "## Result",
    "",
    "- ACER recorded Wave 22M D50 and state hashes.",
    "- ACER emitted close-out chain link 6.",
    "- All seven gates remain held and unexecuted.",
    "",
    "## Boundary",
    "",
    state.boundary
  ].join("\n");
}

function buildMap(state) {
  return {
    mapId: "federation-reintegration-wave22n-acer-link6-map.v1",
    generatedAt,
    nodes: [
      { id: "wave22n", kind: "closeout_link6", status: state.status },
      { id: "wave22m-d50", kind: "prior_d50", sha256: state.priorLink.d50.sha256 },
      { id: "wave22m-state", kind: "prior_state", sha256: state.priorLink.stateFile.sha256, embeddedStateHash: state.priorLink.stateHashInsideFile },
      ...state.gateState.map((gate) => ({ id: gate.id, kind: "gate", status: gate.valueStatus, executed: gate.executed })),
      ...state.supervisorCohort.map((row) => ({ id: row.supervisorPid, kind: "supervisor_pid", level: row.level, verdict: row.verdict }))
    ],
    edges: [
      { from: "wave22n", to: "wave22m-d50", relation: "records_self_hash" },
      { from: "wave22n", to: "wave22m-state", relation: "records_state_hash" },
      ...state.gateState.map((gate) => ({ from: "wave22n", to: gate.id, relation: "preserves_hold" })),
      ...state.supervisorCohort.map((row) => ({ from: "wave22n", to: row.supervisorPid, relation: "gated_by" }))
    ],
    boundary: state.boundary
  };
}

function buildGlpj(state) {
  return {
    glpjId: "federation-reintegration-wave22n-acer-link6.glpj",
    generatedAt,
    family: "federation",
    d11: "ACER_LINK6_RECORDS_WAVE22M_SELF_HASH_ONLY",
    glyphs: state.supervisorCohort.map((row, index) => ({
      token: `FED-WAVE22N-L${index}`,
      level: row.level,
      prof: row.prof,
      supervisorPid: row.supervisorPid,
      verdict: row.verdict
    })),
    closeoutChain: state.closeoutChain,
    outputs: [{ wave: "22N", path: repoRel(OUTPUTS.d50), class: "ACER close-out link 6" }],
    boundary: state.boundary
  };
}

function main() {
  const state = buildState();
  const artifacts = Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)]));
  const memory = {
    memoryId: "federation-reintegration-wave22n-acer-link6.v1",
    generatedAt,
    status: state.status,
    relationship: state.relationship,
    significance: "ACER extended the autonomous close-out ledger by recording Wave 22M D50 and state hashes as link 6.",
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
