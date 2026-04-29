#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const runId = "federation-reintegration-wave23f-acer-link24-20260427";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427");

const INPUTS = Object.freeze({
  wave23eState: "data/behcs/orchestration/federation-reintegration-20260427/wave23e-liris23de-intake-acer-link23.v1.json",
  wave23eD50: "data/agent-index/council/D50-WAVE23E-LIRIS23DE-INTAKE-ACER-LINK23-2026-04-27.md"
});

const OUTPUTS = Object.freeze({
  state: path.join(runRoot, "wave23f-acer-closeout-link24.v1.json"),
  d50: path.join(repoRoot, "data", "agent-index", "council", "D50-WAVE23F-ACER-CLOSEOUT-CHAIN-LINK24-2026-04-27.md"),
  report: path.join(repoRoot, "reports", "federation-reintegration-wave23f-acer-link24-latest.md"),
  reportJson: path.join(repoRoot, "reports", "federation-reintegration-wave23f-acer-link24-latest.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "federation-reintegration-wave23f-acer-link24.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "federation-reintegration-wave23f-acer-link24-map.v1.json"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "federation-reintegration-wave23f-acer-link24.glpj.json")
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

function supervisorCohort() {
  return [
    {
      level: "L0_BOUNDARY",
      prof: "PROF-HOOKWALL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HOOKWALL.BOUNDARY",
      verdict: "ALLOW_ACER_23F_LINK24_LEDGER_ONLY"
    },
    {
      level: "L1_PACKET_SCHEMA",
      prof: "PROF-HERMES",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET.ACER",
      verdict: "RECORD_23E_D50_AND_STATE_HASHES_WITH_NO_LIRIS_23F_FABRICATION"
    },
    {
      level: "L2_EBACMAP",
      prof: "PROF-EBACMAP",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.EBACMAP.CASCADE.ACER",
      verdict: "ACER_LINK24_APPEND_ONLY_NO_CHAIN_BREAK"
    },
    {
      level: "L3_KERNEL",
      prof: "PROF-KERNEL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.KERNEL.GRAMMAR.ACER",
      verdict: "NO_RULE_PROMOTION_NO_CENSUS_ADMISSION"
    },
    {
      level: "L4_EXECUTOR",
      prof: "PROF-EXECUTOR",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.EXECUTOR.WAVE.ACER",
      verdict: "LINK24_IS_LEDGER_EXECUTOR_NOT_FEDERATION_EXECUTION"
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
  const prior = readJson(INPUTS.wave23eState);
  const priorStateFile = fileStatus(INPUTS.wave23eState);
  const priorD50 = fileStatus(INPUTS.wave23eD50);
  const gateState = (prior.gateState || []).map((gate) => ({
    id: gate.id,
    readiness: gate.readiness,
    valueStatus: gate.valueStatus || "BLANK_HELD",
    executed: false,
    canProceedAutonomously: false
  }));

  const state = {
    schema: "federation-reintegration-wave23f-acer-closeout-link24.v1",
    runId,
    generatedAt,
    status: "DRAFT_ONLY_NOT_RATIFIED",
    relationship: "ACER_23F_CLOSEOUT_LINK24_RECORDING_23E_SELF_HASH",
    priorAcer: {
      wave: "23E",
      d50: priorD50,
      stateFile: priorStateFile,
      stateHashInsideFile: prior.stateHash || null,
      linkNumber: prior.closeoutChain ? prior.closeoutChain.linkNumber : null,
      noChainBreak: prior.closeoutChain ? Boolean(prior.closeoutChain.noChainBreak) : false
    },
    lirisRelay: {
      latestRelayedWaves: prior.lirisRelays ? prior.lirisRelays.map((relay) => relay.wave) : [],
      latestRelayedSha256s: prior.lirisRelays ? Object.fromEntries(prior.lirisRelays.map((relay) => [relay.wave, relay.sha256])) : {},
      liris23FHashRelayed: false,
      liris23FContentOnAcer: false,
      verificationClass: "NO_LIRIS_23F_RELAY_NO_HASH_FABRICATION"
    },
    closeoutChain: {
      acerAddsLink: "Wave 23F",
      linkNumber: 24,
      recordsPriorAcer23ED50Sha256: priorD50.sha256,
      recordsPriorAcer23EStateSha256: priorStateFile.sha256,
      recordsPriorAcer23EStateHash: prior.stateHash || null,
      noChainBreak: Boolean(priorD50.present && priorStateFile.present && prior.closeoutChain && prior.closeoutChain.noChainBreak)
    },
    gateState,
    supervisorCohort: supervisorCohort(),
    aggregateVerdict: {
      autonomousGateExecutionAvailable: false,
      gateExecutionByThisWave: false,
      nextMeaningfulInputClass: "operator gate value or actual T1 payload",
      allGatesHeld: gateState.every((gate) => gate.valueStatus === "BLANK_HELD" && gate.executed === false),
      noFalseProgressClaim: true
    },
    boundary: "Wave 23F ACER close-out chain link 24 only. Liris 23F hash not relayed and not fabricated. No gate execution, no content transfer, no overwrite, no path fabrication, no schedule reconciliation, no vision disposition choice, no hash fabrication, no parent manifest modification, no Merkle recompute, no peer endpoint, no payload transfer, no Liris disk write by ACER, no MCP invocation, no exterior MCP, no model fanout, no device action, no emit, no ed25519, no key ceremony, no quorum outreach, no cosigner recruitment, no census admission, no PID mint, no quarantine lift, no rule ratification, no rule promotion, no federation promotion, no chain break, no false progress claim."
  };
  state.stateHash = sha256Text(JSON.stringify(state));
  return state;
}

function buildD50(state) {
  const lines = [];
  lines.push("# D50 Wave 23F - ACER Close-out Chain Link 24");
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
  lines.push(`- Latest Liris relayed waves: ${state.lirisRelay.latestRelayedWaves.join(", ")}.`);
  lines.push(`- Liris 23F hash relayed: ${state.lirisRelay.liris23FHashRelayed}.`);
  lines.push("- No Liris 23F hash or content is fabricated.");
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

function main() {
  const state = buildState();
  const artifacts = Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)]));

  writeJson(OUTPUTS.state, state);
  writeText(OUTPUTS.d50, buildD50(state));
  writeJson(OUTPUTS.reportJson, { ...state, artifacts });
  writeJson(OUTPUTS.memory, {
    memoryId: "federation-reintegration-wave23f-acer-link24.v1",
    generatedAt,
    status: state.status,
    relationship: state.relationship,
    significance: "ACER extended Wave 23 locally to link 24 while recording that no Liris 23F hash was relayed.",
    stateHash: state.stateHash,
    artifacts,
    boundary: state.boundary
  });
  writeJson(OUTPUTS.map, {
    mapId: "federation-reintegration-wave23f-acer-link24-map.v1",
    generatedAt,
    nodes: [
      { id: "23E", kind: "acer_prior", stateHash: state.priorAcer.stateHashInsideFile },
      { id: "23F", kind: "acer_closeout_link", stateHash: state.stateHash },
      { id: "liris-23F", kind: "not_relayed", hashFabricated: false },
      ...state.gateState.map((gate) => ({ id: gate.id, kind: "gate", status: gate.valueStatus, executed: gate.executed }))
    ],
    edges: [
      { from: "23E", to: "23F", relation: "records_prior_hash" },
      { from: "23F", to: "liris-23F", relation: "records_not_relayed" },
      ...state.gateState.map((gate) => ({ from: "23F", to: gate.id, relation: "preserves_hold" }))
    ],
    boundary: state.boundary
  });
  writeJson(OUTPUTS.glpj, {
    glpjId: "federation-reintegration-wave23f-acer-link24.glpj",
    generatedAt,
    family: "federation",
    d11: "ACER_23F_LINK24_NO_LIRIS_23F_RELAY",
    glyphs: state.supervisorCohort.map((row, index) => ({
      token: `FED-WAVE23F-L${index}`,
      level: row.level,
      prof: row.prof,
      supervisorPid: row.supervisorPid,
      verdict: row.verdict
    })),
    closeoutChain: state.closeoutChain,
    boundary: state.boundary
  });
  writeText(OUTPUTS.report, [
    "# Federation Reintegration Wave 23F ACER Link 24",
    "",
    `Generated: ${generatedAt}`,
    `Status: ${state.status}`,
    `State hash: ${state.stateHash}`,
    "",
    "## Result",
    "",
    "- ACER recorded Wave 23E D50 and state hashes.",
    "- ACER emitted Wave 23F local close-out link 24.",
    "- Liris 23F hash was not relayed; no value was fabricated.",
    "- All seven gates remain held and unexecuted.",
    "",
    "## Boundary",
    "",
    state.boundary
  ].join("\n"));

  console.log(JSON.stringify({
    ok: true,
    status: state.status,
    relationship: state.relationship,
    stateHash: state.stateHash,
    liris23FHashRelayed: state.lirisRelay.liris23FHashRelayed,
    artifacts
  }, null, 2));
}

main();
