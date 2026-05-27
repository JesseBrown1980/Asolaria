#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const runId = "federation-reintegration-wave22p-liris-22opq-intake-acer-link8-20260427";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427");

const INPUTS = Object.freeze({
  wave22oState: "data/behcs/orchestration/federation-reintegration-20260427/wave22o-acer-closeout-link7.v1.json",
  wave22oD50: "data/agent-index/council/D50-WAVE22O-ACER-CLOSEOUT-CHAIN-LINK7-2026-04-27.md"
});

const LIRIS_RELAYS = Object.freeze([
  {
    wave: "22O",
    path: "data/agent-index/council/D50-WAVE22O-CLOSEOUT-CHAIN-EXTENSION-LIRIS-2026-04-27.md",
    lines: 41,
    sha256: "508f470879c2977ee45f3a8795b5d1feb0905eb6331802e059d1e55176f9d3ff",
    linkNumber: 7,
    totalArtifacts: 34,
    chiefCouncilDissent: "33-wave standing",
    relationToAcer: "DIVERGED_DRAFT_SIBLINGS_WITH_ACER_22O"
  },
  {
    wave: "22P",
    path: "data/agent-index/council/D50-WAVE22P-CLOSEOUT-CHAIN-EXTENSION-LIRIS-2026-04-27.md",
    lines: 36,
    sha256: "e8e9509faca46c72dab764a85e7a2138a56e925bee68b62c45a70f6882a66c8f",
    linkNumber: 8,
    totalArtifacts: 35,
    chiefCouncilDissent: "34-wave standing",
    relationToAcer: "DIVERGED_DRAFT_SIBLINGS_WITH_THIS_ACER_22P"
  },
  {
    wave: "22Q",
    path: "data/agent-index/council/D50-WAVE22Q-CLOSEOUT-CHAIN-EXTENSION-LIRIS-2026-04-27.md",
    lines: 40,
    sha256: "32df6175264fa7563622543ae0b25fd9dffecbc8a191c6b25cc4baec7c0676a7",
    linkNumber: 9,
    totalArtifacts: 36,
    chiefCouncilDissent: "35-wave standing",
    relationToAcer: "LIRIS_AHEAD_BY_ONE_WAVELETTER_OPERATOR_RELAY_ONLY"
  }
]);

const OUTPUTS = Object.freeze({
  state: path.join(runRoot, "wave22p-liris-22opq-intake-acer-link8.v1.json"),
  d50: path.join(repoRoot, "data", "agent-index", "council", "D50-WAVE22P-LIRIS22OPQ-INTAKE-ACER-LINK8-2026-04-27.md"),
  report: path.join(repoRoot, "reports", "federation-reintegration-wave22p-liris-22opq-intake-acer-link8-latest.md"),
  reportJson: path.join(repoRoot, "reports", "federation-reintegration-wave22p-liris-22opq-intake-acer-link8-latest.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "federation-reintegration-wave22p-liris-22opq-intake-acer-link8.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "federation-reintegration-wave22p-liris-22opq-intake-acer-link8-map.v1.json"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "federation-reintegration-wave22p-liris-22opq-intake-acer-link8.glpj.json")
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

function lirisRelayStatus(relay) {
  return {
    ...relay,
    status: "DRAFT_ONLY_NOT_RATIFIED",
    verificationClass: "OPERATOR_RELAYED_HASH_ONLY_NO_CONTENT",
    contentOnAcer: fileStatus(relay.path).present,
    localProbe: fileStatus(relay.path)
  };
}

function buildState() {
  const prior = readJson(INPUTS.wave22oState);
  const priorStateFile = fileStatus(INPUTS.wave22oState);
  const priorD50 = fileStatus(INPUTS.wave22oD50);
  const lirisRelays = LIRIS_RELAYS.map(lirisRelayStatus);
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
      verdict: "ALLOW_LIRIS_22OPQ_HASH_INTAKE_AND_ACER_LINK8_ONLY"
    },
    {
      level: "L1_PACKET_SCHEMA",
      prof: "PROF-HERMES",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET.ACER",
      verdict: "RECORD_LIRIS_22O_22P_22Q_HASHES_WITH_NO_CONTENT_FABRICATION"
    },
    {
      level: "L2_EBACMAP",
      prof: "PROF-EBACMAP",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.EBACMAP.CASCADE.ACER",
      verdict: "ACER_LINK8_APPEND_ONLY_CATCHUP_TO_LIRIS_22Q_REFERENCE"
    },
    {
      level: "L3_KERNEL",
      prof: "PROF-KERNEL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.KERNEL.GRAMMAR.ACER",
      verdict: "DIVERGED_DRAFT_SIBLINGS_PRESERVED_FOR_SHARED_22O_AND_22P"
    },
    {
      level: "L4_EXECUTOR",
      prof: "PROF-EXECUTOR",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.EXECUTOR.WAVE.ACER",
      verdict: "LINK8_IS_LEDGER_EXECUTOR_NOT_GATE_EXECUTION"
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
      verdict: "BILATERAL_CHAIN_EXTENDS_BUT_ALL_SUBSTANTIVE_GATES_REMAIN_BLOCKED"
    },
    {
      level: "L7_APEX",
      prof: "COL-ASOLARIA",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.ASOLARIA.APEX.ACER",
      verdict: "CONTINUE_LEDGER_ONLY_UNTIL_GATE_VALUE_OR_ACTUAL_T1_PAYLOAD"
    }
  ];

  const state = {
    schema: "federation-reintegration-wave22p-liris-22opq-intake-acer-link8.v1",
    runId,
    generatedAt,
    status: "DRAFT_ONLY_NOT_RATIFIED",
    relationship: "LIRIS_22O_22P_22Q_HASH_INTAKE_AND_ACER_CLOSEOUT_LINK8",
    priorAcerLink: {
      wave: "22O",
      d50: priorD50,
      stateFile: priorStateFile,
      stateHashInsideFile: prior.stateHash || null,
      linkNumber: prior.closeoutChain ? prior.closeoutChain.linkNumber : null,
      noChainBreak: prior.closeoutChain ? Boolean(prior.closeoutChain.noChainBreak) : false
    },
    lirisRelays,
    bilateralDivergence: {
      sharedWaveLetters: ["22O", "22P"],
      relation: "DIVERGED_DRAFT_SIBLINGS",
      lirisAheadThrough: "22Q",
      byteEquivalentClaimed: false,
      contentTransferred: false,
      hashFabricated: false
    },
    closeoutChain: {
      acerAddsLink: "Wave 22P",
      linkNumber: 8,
      recordsPriorAcerD50Sha256: priorD50.sha256,
      recordsPriorAcerStateFileSha256: priorStateFile.sha256,
      recordsPriorAcerEmbeddedStateHash: prior.stateHash || null,
      recordsLirisRelayWaves: lirisRelays.map((relay) => ({
        wave: relay.wave,
        lines: relay.lines,
        sha256: relay.sha256,
        linkNumber: relay.linkNumber
      })),
      noChainBreak: Boolean(priorD50.present && priorStateFile.present && prior.closeoutChain && prior.closeoutChain.noChainBreak),
      indefiniteExtensionWarning: true
    },
    lirisCascadeState: {
      latestRelayWave: "22Q",
      latestTotalArtifacts: 36,
      latestChiefCouncilDissent: "35-wave standing",
      latestLirisChainLinks: 9,
      allGatesHeld: true
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
    boundary: "Wave 22P ACER Liris 22O/22P/22Q hash intake and close-out chain link 8 only. Records operator-relayed Liris hashes and ACER Wave 22O hashes. No gate execution, no content transfer, no overwrite, no path fabrication, no schedule reconciliation, no vision disposition choice, no hash fabrication, no parent manifest modification, no Merkle recompute, no peer endpoint, no payload transfer, no Liris disk write by ACER, no MCP invocation, no exterior MCP, no model fanout, no device action, no emit, no ed25519, no key ceremony, no quorum outreach, no cosigner recruitment, no census admission, no PID mint, no quarantine lift, no rule ratification, no rule promotion, no federation promotion, no chain break, no false progress claim."
  };

  state.stateHash = sha256Text(JSON.stringify(state));
  return state;
}

function buildD50(state) {
  const lines = [];
  lines.push("# D50 Wave 22P - Liris 22O/22P/22Q Intake + ACER Link 8");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Status: ${state.status}`);
  lines.push(`Relationship: ${state.relationship}`);
  lines.push("");
  lines.push("## Prior ACER Link Recorded");
  lines.push("");
  lines.push(`- ACER 22O D50: \`${state.priorAcerLink.d50.path}\`, ${state.priorAcerLink.d50.lines} lines, sha256 \`${state.priorAcerLink.d50.sha256}\`.`);
  lines.push(`- ACER 22O state JSON: \`${state.priorAcerLink.stateFile.path}\`, ${state.priorAcerLink.stateFile.lines} lines, sha256 \`${state.priorAcerLink.stateFile.sha256}\`.`);
  lines.push(`- ACER 22O embedded stateHash: \`${state.priorAcerLink.stateHashInsideFile}\`.`);
  lines.push("");
  lines.push("## Liris Relay Intake");
  lines.push("");
  for (const relay of state.lirisRelays) {
    lines.push(`- Liris ${relay.wave}: \`${relay.path}\`, ${relay.lines} lines, sha256 \`${relay.sha256}\`, link ${relay.linkNumber}, contentOnAcer=${relay.contentOnAcer}.`);
  }
  lines.push("");
  lines.push("## ACER Link 8");
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
    "# Federation Reintegration Wave 22P Liris 22O/22P/22Q Intake + ACER Link 8",
    "",
    `Generated: ${generatedAt}`,
    `Status: ${state.status}`,
    `State hash: ${state.stateHash}`,
    "",
    "## Result",
    "",
    "- ACER recorded Liris 22O, 22P, and 22Q by operator-relayed hashes only.",
    "- ACER emitted close-out chain link 8.",
    "- Liris is recorded as ahead through 22Q; no content was transferred or fabricated.",
    "- All seven gates remain held and unexecuted.",
    "",
    "## Boundary",
    "",
    state.boundary
  ].join("\n");
}

function buildMap(state) {
  return {
    mapId: "federation-reintegration-wave22p-liris-22opq-intake-acer-link8-map.v1",
    generatedAt,
    nodes: [
      { id: "wave22p-acer", kind: "closeout_link8", status: state.status },
      { id: "wave22o-acer-d50", kind: "prior_acer_d50", sha256: state.priorAcerLink.d50.sha256 },
      { id: "wave22o-acer-state", kind: "prior_acer_state", sha256: state.priorAcerLink.stateFile.sha256, embeddedStateHash: state.priorAcerLink.stateHashInsideFile },
      ...state.lirisRelays.map((relay) => ({ id: `liris-${relay.wave}`, kind: "operator_relay_hash", sha256: relay.sha256, linkNumber: relay.linkNumber, contentOnAcer: relay.contentOnAcer })),
      ...state.gateState.map((gate) => ({ id: gate.id, kind: "gate", status: gate.valueStatus, executed: gate.executed })),
      ...state.supervisorCohort.map((row) => ({ id: row.supervisorPid, kind: "supervisor_pid", level: row.level, verdict: row.verdict }))
    ],
    edges: [
      { from: "wave22p-acer", to: "wave22o-acer-d50", relation: "records_self_hash" },
      { from: "wave22p-acer", to: "wave22o-acer-state", relation: "records_state_hash" },
      ...state.lirisRelays.map((relay) => ({ from: "wave22p-acer", to: `liris-${relay.wave}`, relation: "records_operator_relay" })),
      ...state.gateState.map((gate) => ({ from: "wave22p-acer", to: gate.id, relation: "preserves_hold" })),
      ...state.supervisorCohort.map((row) => ({ from: "wave22p-acer", to: row.supervisorPid, relation: "gated_by" }))
    ],
    boundary: state.boundary
  };
}

function buildGlpj(state) {
  return {
    glpjId: "federation-reintegration-wave22p-liris-22opq-intake-acer-link8.glpj",
    generatedAt,
    family: "federation",
    d11: "LIRIS_22OPQ_HASH_INTAKE_AND_ACER_LINK8_ONLY",
    glyphs: state.supervisorCohort.map((row, index) => ({
      token: `FED-WAVE22P-L${index}`,
      level: row.level,
      prof: row.prof,
      supervisorPid: row.supervisorPid,
      verdict: row.verdict
    })),
    lirisRelays: state.lirisRelays.map((relay) => ({
      wave: relay.wave,
      sha256: relay.sha256,
      lines: relay.lines,
      linkNumber: relay.linkNumber,
      contentOnAcer: relay.contentOnAcer
    })),
    closeoutChain: state.closeoutChain,
    outputs: [{ wave: "22P", path: repoRel(OUTPUTS.d50), class: "ACER close-out link 8 plus Liris 22O/22P/22Q intake" }],
    boundary: state.boundary
  };
}

function main() {
  const state = buildState();
  const artifacts = Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)]));
  const memory = {
    memoryId: "federation-reintegration-wave22p-liris-22opq-intake-acer-link8.v1",
    generatedAt,
    status: state.status,
    relationship: state.relationship,
    significance: "ACER recorded Liris 22O/22P/22Q by hash only and extended its local close-out chain to link 8.",
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
