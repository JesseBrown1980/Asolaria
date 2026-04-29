#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const runId = "federation-reintegration-wave23c-liris23c-intake-acer-link21-20260427";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427");

const INPUTS = Object.freeze({
  wave23bState: "data/behcs/orchestration/federation-reintegration-20260427/wave23b-liris23b-intake-acer-link20.v1.json",
  wave23bD50: "data/agent-index/council/D50-WAVE23B-LIRIS23B-INTAKE-ACER-LINK20-2026-04-27.md"
});

const LIRIS_23C = Object.freeze({
  wave: "23C",
  path: "data/agent-index/council/D50-WAVE23C-CLOSEOUT-CHAIN-EXTENSION-LIRIS-2026-04-27.md",
  lines: 34,
  sha256: "eaee7e7df6f5d06ada5edd565767665d6065ab6fa4b394e1a3a2aecfb0c6282c",
  linkNumber: 20,
  totalArtifacts: 48,
  chiefCouncilDissent: "47-wave standing",
  allGatesHeld: true
});

const OUTPUTS = Object.freeze({
  state: path.join(runRoot, "wave23c-liris23c-intake-acer-link21.v1.json"),
  d50: path.join(repoRoot, "data", "agent-index", "council", "D50-WAVE23C-LIRIS23C-INTAKE-ACER-LINK21-2026-04-27.md"),
  report: path.join(repoRoot, "reports", "federation-reintegration-wave23c-liris23c-intake-acer-link21-latest.md"),
  reportJson: path.join(repoRoot, "reports", "federation-reintegration-wave23c-liris23c-intake-acer-link21-latest.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "federation-reintegration-wave23c-liris23c-intake-acer-link21.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "federation-reintegration-wave23c-liris23c-intake-acer-link21-map.v1.json"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "federation-reintegration-wave23c-liris23c-intake-acer-link21.glpj.json")
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
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), "utf8"));
}

function buildSupervisorCohort() {
  return [
    {
      level: "L0_BOUNDARY",
      prof: "PROF-HOOKWALL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HOOKWALL.BOUNDARY",
      verdict: "ALLOW_LIRIS_23C_HASH_INTAKE_AND_ACER_LINK21_LEDGER_ONLY"
    },
    {
      level: "L1_PACKET_SCHEMA",
      prof: "PROF-HERMES",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET.ACER",
      verdict: "RECORD_LIRIS_23C_HASH_WITH_NO_CONTENT_FABRICATION"
    },
    {
      level: "L2_EBACMAP",
      prof: "PROF-EBACMAP",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.EBACMAP.CASCADE.ACER",
      verdict: "ACER_LINK21_APPEND_ONLY_NO_CHAIN_BREAK"
    },
    {
      level: "L3_KERNEL",
      prof: "PROF-KERNEL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.KERNEL.GRAMMAR.ACER",
      verdict: "DIVERGED_DRAFT_SIBLINGS_PRESERVED_FOR_SHARED_23C"
    },
    {
      level: "L4_EXECUTOR",
      prof: "PROF-EXECUTOR",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.EXECUTOR.WAVE.ACER",
      verdict: "LINK21_IS_LEDGER_EXECUTOR_NOT_FEDERATION_EXECUTION"
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
      verdict: "WAVE23_CONTINUES_BUT_SUBSTANTIVE_GATES_STILL_BLOCKED"
    },
    {
      level: "L7_APEX",
      prof: "COL-ASOLARIA",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.ASOLARIA.APEX.ACER",
      verdict: "CONTINUE_LEDGER_ONLY_UNTIL_GATE_VALUE_OR_ACTUAL_T1_PAYLOAD"
    }
  ];
}

function buildState() {
  const prior = readJson(INPUTS.wave23bState);
  const priorStateFile = fileStatus(INPUTS.wave23bState);
  const priorD50 = fileStatus(INPUTS.wave23bD50);
  const lirisProbe = fileStatus(LIRIS_23C.path);
  const lirisRelay = {
    ...LIRIS_23C,
    status: "DRAFT_ONLY_NOT_RATIFIED",
    verificationClass: "OPERATOR_RELAYED_HASH_ONLY_NO_CONTENT",
    contentOnAcer: lirisProbe.present,
    localProbe: lirisProbe
  };
  const gateState = (prior.gateState || []).map((gate) => ({
    id: gate.id,
    readiness: gate.readiness,
    valueStatus: gate.valueStatus || "BLANK_HELD",
    executed: false,
    canProceedAutonomously: false
  }));

  const state = {
    schema: "federation-reintegration-wave23c-liris23c-intake-acer-link21.v1",
    runId,
    generatedAt,
    status: "DRAFT_ONLY_NOT_RATIFIED",
    relationship: "LIRIS_23C_HASH_INTAKE_AND_ACER_LINK21",
    priorAcer: {
      wave: "23B",
      d50: priorD50,
      stateFile: priorStateFile,
      stateHashInsideFile: prior.stateHash || null,
      linkNumber: prior.closeoutChain ? prior.closeoutChain.linkNumber : null,
      noChainBreak: prior.closeoutChain ? Boolean(prior.closeoutChain.noChainBreak) : false
    },
    lirisRelay,
    bilateralDivergence: {
      lirisWave: "23C",
      acerWave: "23C",
      relation: "DIVERGED_DRAFT_SIBLINGS_HASH_ONLY",
      lirisLinkNumber: LIRIS_23C.linkNumber,
      acerLinkNumber: 21,
      byteEquivalentClaimed: false,
      contentTransferred: false,
      hashFabricated: false
    },
    closeoutChain: {
      acerAddsLink: "Wave 23C",
      linkNumber: 21,
      recordsPriorAcer23BD50Sha256: priorD50.sha256,
      recordsPriorAcer23BStateSha256: priorStateFile.sha256,
      recordsPriorAcer23BStateHash: prior.stateHash || null,
      recordsLiris23CSha256: LIRIS_23C.sha256,
      noChainBreak: Boolean(priorD50.present && priorStateFile.present && prior.closeoutChain && prior.closeoutChain.noChainBreak)
    },
    gateState,
    supervisorCohort: buildSupervisorCohort(),
    aggregateVerdict: {
      autonomousGateExecutionAvailable: false,
      gateExecutionByThisWave: false,
      nextMeaningfulInputClass: "operator gate value or actual T1 payload",
      allGatesHeld: gateState.every((gate) => gate.valueStatus === "BLANK_HELD" && gate.executed === false),
      noFalseProgressClaim: true
    },
    boundary: "Wave 23C ACER Liris 23C hash intake and close-out link 21 only. No gate execution, no content transfer, no overwrite, no path fabrication, no schedule reconciliation, no vision disposition choice, no hash fabrication, no parent manifest modification, no Merkle recompute, no peer endpoint, no payload transfer, no Liris disk write by ACER, no MCP invocation, no exterior MCP, no model fanout, no device action, no emit, no ed25519, no key ceremony, no quorum outreach, no cosigner recruitment, no census admission, no PID mint, no quarantine lift, no rule ratification, no rule promotion, no federation promotion, no chain break, no false progress claim."
  };
  state.stateHash = sha256Text(JSON.stringify(state));
  return state;
}

function buildD50(state) {
  const lines = [];
  lines.push("# D50 Wave 23C - Liris 23C Intake + ACER Link 21");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Status: ${state.status}`);
  lines.push(`Relationship: ${state.relationship}`);
  lines.push("");
  lines.push("## Prior ACER Surface");
  lines.push("");
  lines.push(`- Prior wave: ${state.priorAcer.wave}.`);
  lines.push(`- Prior D50: \`${state.priorAcer.d50.path}\`, ${state.priorAcer.d50.lines} lines, sha256 \`${state.priorAcer.d50.sha256}\`.`);
  lines.push(`- Prior state: \`${state.priorAcer.stateFile.path}\`, ${state.priorAcer.stateFile.lines} lines, sha256 \`${state.priorAcer.stateFile.sha256}\`.`);
  lines.push(`- Prior embedded stateHash: \`${state.priorAcer.stateHashInsideFile}\`.`);
  lines.push("");
  lines.push("## Liris Relay");
  lines.push("");
  lines.push(`- Liris 23C: \`${state.lirisRelay.path}\`, ${state.lirisRelay.lines} lines, sha256 \`${state.lirisRelay.sha256}\`.`);
  lines.push(`- Liris link: ${state.lirisRelay.linkNumber}; artifacts: ${state.lirisRelay.totalArtifacts}; CHIEFCOUNCIL dissent: ${state.lirisRelay.chiefCouncilDissent}.`);
  lines.push(`- Liris content on ACER: ${state.lirisRelay.contentOnAcer}.`);
  lines.push("");
  lines.push("## ACER Link");
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
    "# Federation Reintegration Wave 23C Liris 23C Intake + ACER Link 21",
    "",
    `Generated: ${generatedAt}`,
    `Status: ${state.status}`,
    `State hash: ${state.stateHash}`,
    "",
    "## Result",
    "",
    "- ACER recorded Liris 23C by operator-relayed hash only.",
    "- ACER emitted Wave 23C local close-out link 21.",
    "- All seven gates remain held and unexecuted.",
    "",
    "## Boundary",
    "",
    state.boundary
  ].join("\n");
}

function buildMap(state) {
  return {
    mapId: "federation-reintegration-wave23c-liris23c-intake-acer-link21-map.v1",
    generatedAt,
    nodes: [
      { id: "23B", kind: "acer_prior", stateHash: state.priorAcer.stateHashInsideFile },
      { id: "23C", kind: "acer_liris23c_intake", stateHash: state.stateHash },
      { id: "liris-23C", kind: "operator_relay_hash", sha256: state.lirisRelay.sha256, contentOnAcer: state.lirisRelay.contentOnAcer },
      ...state.gateState.map((gate) => ({ id: gate.id, kind: "gate", status: gate.valueStatus, executed: gate.executed }))
    ],
    edges: [
      { from: "23B", to: "23C", relation: "records_prior_hash" },
      { from: "23C", to: "liris-23C", relation: "records_operator_relay" },
      ...state.gateState.map((gate) => ({ from: "23C", to: gate.id, relation: "preserves_hold" }))
    ],
    boundary: state.boundary
  };
}

function main() {
  const state = buildState();
  const artifacts = Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)]));
  const memory = {
    memoryId: "federation-reintegration-wave23c-liris23c-intake-acer-link21.v1",
    generatedAt,
    status: state.status,
    relationship: state.relationship,
    significance: "ACER recorded Liris Wave 23C by hash only and extended its local Wave 23 close-out chain to link 21.",
    stateHash: state.stateHash,
    artifacts,
    boundary: state.boundary
  };

  writeJson(OUTPUTS.state, state);
  writeText(OUTPUTS.d50, buildD50(state));
  writeJson(OUTPUTS.reportJson, { ...state, artifacts });
  writeJson(OUTPUTS.memory, memory);
  writeJson(OUTPUTS.map, buildMap(state));
  writeJson(OUTPUTS.glpj, {
    glpjId: "federation-reintegration-wave23c-liris23c-intake-acer-link21.glpj",
    generatedAt,
    family: "federation",
    d11: "LIRIS_23C_HASH_INTAKE_AND_ACER_LINK21_ONLY",
    glyphs: state.supervisorCohort.map((row, index) => ({
      token: `FED-WAVE23C-L${index}`,
      level: row.level,
      prof: row.prof,
      supervisorPid: row.supervisorPid,
      verdict: row.verdict
    })),
    lirisRelay: {
      wave: state.lirisRelay.wave,
      sha256: state.lirisRelay.sha256,
      contentOnAcer: state.lirisRelay.contentOnAcer
    },
    closeoutChain: state.closeoutChain,
    boundary: state.boundary
  });
  writeText(OUTPUTS.report, buildReport(state));

  console.log(JSON.stringify({
    ok: true,
    status: state.status,
    relationship: state.relationship,
    stateHash: state.stateHash,
    liris23C: {
      sha256: state.lirisRelay.sha256,
      contentOnAcer: state.lirisRelay.contentOnAcer
    },
    artifacts
  }, null, 2));
}

main();
