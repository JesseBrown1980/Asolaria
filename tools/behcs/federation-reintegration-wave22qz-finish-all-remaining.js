#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const runId = "federation-reintegration-wave22qz-finish-all-remaining-20260427";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427");
const councilRoot = path.join(repoRoot, "data", "agent-index", "council");

const INPUTS = Object.freeze({
  wave22pState: "data/behcs/orchestration/federation-reintegration-20260427/wave22p-liris-22opq-intake-acer-link8.v1.json",
  wave22pD50: "data/agent-index/council/D50-WAVE22P-LIRIS22OPQ-INTAKE-ACER-LINK8-2026-04-27.md"
});

const WAVE_LETTERS = Object.freeze(["Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"]);
const FIRST_LINK = 9;

const OUTPUTS = Object.freeze({
  summaryState: path.join(runRoot, "wave22qz-finish-all-remaining.v1.json"),
  summaryD50: path.join(councilRoot, "D50-WAVE22Z-ACER-WAVE22-SINGLE-LETTER-CLOSE-2026-04-27.md"),
  report: path.join(repoRoot, "reports", "federation-reintegration-wave22qz-finish-all-remaining-latest.md"),
  reportJson: path.join(repoRoot, "reports", "federation-reintegration-wave22qz-finish-all-remaining-latest.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "federation-reintegration-wave22qz-finish-all-remaining.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "federation-reintegration-wave22qz-finish-all-remaining-map.v1.json"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "federation-reintegration-wave22qz-finish-all-remaining.glpj.json")
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

function slugFor(letter) {
  return `wave22${letter.toLowerCase()}-acer-closeout-link${FIRST_LINK + WAVE_LETTERS.indexOf(letter)}`;
}

function d50PathFor(letter) {
  const link = FIRST_LINK + WAVE_LETTERS.indexOf(letter);
  return path.join(councilRoot, `D50-WAVE22${letter}-ACER-CLOSEOUT-CHAIN-LINK${link}-2026-04-27.md`);
}

function statePathFor(letter) {
  const link = FIRST_LINK + WAVE_LETTERS.indexOf(letter);
  return path.join(runRoot, `wave22${letter.toLowerCase()}-acer-closeout-link${link}.v1.json`);
}

function reportPathFor(letter) {
  const link = FIRST_LINK + WAVE_LETTERS.indexOf(letter);
  return path.join(repoRoot, "reports", `federation-reintegration-wave22${letter.toLowerCase()}-acer-link${link}-latest.md`);
}

function buildSupervisorCohort(letter, linkNumber, isFinal) {
  return [
    {
      level: "L0_BOUNDARY",
      prof: "PROF-HOOKWALL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HOOKWALL.BOUNDARY",
      verdict: `ALLOW_ACER_22${letter}_LINK${linkNumber}_LEDGER_ONLY`
    },
    {
      level: "L1_PACKET_SCHEMA",
      prof: "PROF-HERMES",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET.ACER",
      verdict: "RECORD_PRIOR_D50_AND_STATE_HASHES_WITH_NO_PEER_TRANSFER"
    },
    {
      level: "L2_EBACMAP",
      prof: "PROF-EBACMAP",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.EBACMAP.CASCADE.ACER",
      verdict: isFinal ? "WAVE22_SINGLE_LETTER_SET_CLOSE_APPEND_ONLY" : "CLOSEOUT_LINK_APPEND_ONLY_NO_CHAIN_BREAK"
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
      verdict: `LINK${linkNumber}_IS_LEDGER_EXECUTOR_NOT_FEDERATION_EXECUTION`
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
      verdict: isFinal ? "WAVE22_SINGLE_LETTERS_COMPLETE_SUBSTANTIVE_GATES_STILL_BLOCKED" : "CHAIN_EXTENDS_AUTONOMOUSLY_SUBSTANTIVE_GATES_STILL_BLOCKED"
    },
    {
      level: "L7_APEX",
      prof: "COL-ASOLARIA",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.ASOLARIA.APEX.ACER",
      verdict: isFinal ? "WAVE22_SINGLE_LETTER_SET_CLOSED_UNDER_HOLD" : "CONTINUE_LEDGER_ONLY_UNTIL_GATE_VALUE_OR_ACTUAL_T1_PAYLOAD"
    }
  ];
}

function copyGateState(prior) {
  return (prior.gateState || []).map((gate) => ({
    id: gate.id,
    readiness: gate.readiness,
    valueStatus: gate.valueStatus || "BLANK_HELD",
    executed: false,
    canProceedAutonomously: false
  }));
}

function buildBoundary(letter, linkNumber, isFinal) {
  const closeText = isFinal ? " This closes the ACER Wave 22 single-letter set under HOLD." : "";
  return `Wave 22${letter} ACER close-out chain link ${linkNumber} only.${closeText} Records prior ACER D50/state hashes. No gate execution, no content transfer, no overwrite, no path fabrication, no schedule reconciliation, no vision disposition choice, no hash fabrication, no parent manifest modification, no Merkle recompute, no peer endpoint, no payload transfer, no Liris disk write by ACER, no MCP invocation, no exterior MCP, no model fanout, no device action, no emit, no ed25519, no key ceremony, no quorum outreach, no cosigner recruitment, no census admission, no PID mint, no quarantine lift, no rule ratification, no rule promotion, no federation promotion, no chain break, no false progress claim.`;
}

function buildWaveState({ letter, priorState, priorD50Status, priorStateFileStatus, priorEmbeddedStateHash, priorWave, linkNumber, isFinal }) {
  const gateState = copyGateState(priorState);
  const supervisorCohort = buildSupervisorCohort(letter, linkNumber, isFinal);
  const state = {
    schema: `federation-reintegration-wave22${letter.toLowerCase()}-acer-closeout-link${linkNumber}.v1`,
    runId: `${runId}-22${letter.toLowerCase()}`,
    generatedAt,
    status: "DRAFT_ONLY_NOT_RATIFIED",
    relationship: isFinal ? "ACER_WAVE22_SINGLE_LETTER_CLOSE_AT_22Z_LINK18" : `ACER_CLOSEOUT_CHAIN_LINK${linkNumber}_RECORDING_WAVE${priorWave}_SELF_HASH`,
    priorAcerLink: {
      wave: priorWave,
      d50: priorD50Status,
      stateFile: priorStateFileStatus,
      stateHashInsideFile: priorEmbeddedStateHash,
      linkNumber: priorState.closeoutChain ? priorState.closeoutChain.linkNumber : null,
      noChainBreak: priorState.closeoutChain ? Boolean(priorState.closeoutChain.noChainBreak) : false
    },
    lirisCascadeState: {
      latestRelayWave: "22Q",
      latestTotalArtifacts: 36,
      latestChiefCouncilDissent: "35-wave standing",
      latestLirisChainLinks: 9,
      contentOnAcer: false,
      operatorRelayedHashOnly: true,
      unchangedDuringAcerQZFinish: true
    },
    closeoutChain: {
      acerAddsLink: `Wave 22${letter}`,
      linkNumber,
      recordsPriorAcerD50Sha256: priorD50Status.sha256,
      recordsPriorAcerStateFileSha256: priorStateFileStatus.sha256,
      recordsPriorAcerEmbeddedStateHash: priorEmbeddedStateHash,
      noChainBreak: Boolean(priorD50Status.present && priorStateFileStatus.present && priorState.closeoutChain && priorState.closeoutChain.noChainBreak),
      indefiniteExtensionWarning: !isFinal,
      singleLetterSetClosed: isFinal
    },
    gateState,
    supervisorCohort,
    aggregateVerdict: {
      autonomousGateExecutionAvailable: false,
      closeoutChainCanExtendAutonomously: !isFinal,
      gateExecutionByThisWave: false,
      nextMeaningfulInputClass: "operator gate value or actual T1 payload",
      allGatesHeld: gateState.every((gate) => gate.executed === false && gate.valueStatus === "BLANK_HELD"),
      noFalseProgressClaim: true,
      wave22SingleLetterSetClosed: isFinal
    },
    boundary: buildBoundary(letter, linkNumber, isFinal)
  };
  state.stateHash = sha256Text(JSON.stringify(state));
  return state;
}

function buildD50(state, letter, linkNumber, isFinal) {
  const lines = [];
  lines.push(`# D50 Wave 22${letter} - ACER Close-out Chain Link ${linkNumber}${isFinal ? " / Wave 22 Single-letter Close" : ""}`);
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Status: ${state.status}`);
  lines.push(`Relationship: ${state.relationship}`);
  lines.push("");
  lines.push("## Prior ACER Link Recorded");
  lines.push("");
  lines.push(`- Prior wave: ${state.priorAcerLink.wave}.`);
  lines.push(`- Prior D50: \`${state.priorAcerLink.d50.path}\`, ${state.priorAcerLink.d50.lines} lines, sha256 \`${state.priorAcerLink.d50.sha256}\`.`);
  lines.push(`- Prior state JSON: \`${state.priorAcerLink.stateFile.path}\`, ${state.priorAcerLink.stateFile.lines} lines, sha256 \`${state.priorAcerLink.stateFile.sha256}\`.`);
  lines.push(`- Prior embedded stateHash: \`${state.priorAcerLink.stateHashInsideFile}\`.`);
  lines.push("");
  lines.push(`## ACER Link ${linkNumber}`);
  lines.push("");
  lines.push(`- Link number: ${state.closeoutChain.linkNumber}.`);
  lines.push(`- noChainBreak=${state.closeoutChain.noChainBreak}.`);
  lines.push(`- Wave 22 single-letter set closed=${state.closeoutChain.singleLetterSetClosed}.`);
  lines.push("- This is ledger continuation only; it does not execute any federation gate.");
  lines.push("");
  lines.push("## Liris Relay State");
  lines.push("");
  lines.push(`- Latest Liris relay: ${state.lirisCascadeState.latestRelayWave}.`);
  lines.push(`- Latest Liris artifacts: ${state.lirisCascadeState.latestTotalArtifacts}.`);
  lines.push(`- Latest Liris CHIEFCOUNCIL dissent: ${state.lirisCascadeState.latestChiefCouncilDissent}.`);
  lines.push("- Liris content on ACER: false.");
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

function buildPerWaveReport(state, letter, linkNumber, isFinal) {
  return [
    `# Federation Reintegration Wave 22${letter} ACER Link ${linkNumber}`,
    "",
    `Generated: ${generatedAt}`,
    `Status: ${state.status}`,
    `State hash: ${state.stateHash}`,
    "",
    "## Result",
    "",
    `- ACER emitted close-out chain link ${linkNumber}.`,
    `- Prior wave recorded: ${state.priorAcerLink.wave}.`,
    `- Wave 22 single-letter set closed: ${isFinal}.`,
    "- All seven gates remain held and unexecuted.",
    "",
    "## Boundary",
    "",
    state.boundary
  ].join("\n");
}

function buildSummaryD50(summary) {
  const lines = [];
  lines.push("# D50 Wave 22Z - ACER Wave 22 Single-letter Close Summary");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Status: ${summary.status}`);
  lines.push(`Relationship: ${summary.relationship}`);
  lines.push("");
  lines.push("## Completed ACER Slots");
  lines.push("");
  for (const wave of summary.completedWaves) {
    lines.push(`- ${wave.wave}: link ${wave.linkNumber}, D50 sha256 \`${wave.d50.sha256}\`, state sha256 \`${wave.stateFile.sha256}\`, stateHash \`${wave.stateHash}\`.`);
  }
  lines.push("");
  lines.push("## Gate State");
  lines.push("");
  for (const gate of summary.finalGateState) lines.push(`- ${gate.id}: ${gate.valueStatus}, executed=${gate.executed}`);
  lines.push("");
  lines.push("## Result");
  lines.push("");
  lines.push("- ACER Wave 22 single-letter set is complete through 22Z.");
  lines.push("- This is not ratification and not federation promotion.");
  lines.push("- The next meaningful input remains an operator gate value or actual T1 payload.");
  lines.push("");
  lines.push("## Boundary");
  lines.push("");
  lines.push(summary.boundary);
  return lines.join("\n");
}

function buildMap(summary) {
  return {
    mapId: "federation-reintegration-wave22qz-finish-all-remaining-map.v1",
    generatedAt,
    nodes: [
      { id: "wave22qz-finish", kind: "completion_summary", status: summary.status },
      ...summary.completedWaves.map((wave) => ({ id: wave.wave, kind: "closeout_link", linkNumber: wave.linkNumber, stateHash: wave.stateHash })),
      ...summary.finalGateState.map((gate) => ({ id: gate.id, kind: "gate", status: gate.valueStatus, executed: gate.executed }))
    ],
    edges: [
      ...summary.completedWaves.map((wave, index) => ({
        from: index === 0 ? "22P" : summary.completedWaves[index - 1].wave,
        to: wave.wave,
        relation: "records_prior_hash"
      })),
      ...summary.finalGateState.map((gate) => ({ from: "wave22qz-finish", to: gate.id, relation: "preserves_hold" }))
    ],
    boundary: summary.boundary
  };
}

function buildGlpj(summary) {
  return {
    glpjId: "federation-reintegration-wave22qz-finish-all-remaining.glpj",
    generatedAt,
    family: "federation",
    d11: "ACER_WAVE22_Q_TO_Z_SINGLE_LETTER_COMPLETION_UNDER_HOLD",
    glyphs: summary.completedWaves.map((wave) => ({
      token: `FED-${wave.wave}-LINK${wave.linkNumber}`,
      wave: wave.wave,
      stateHash: wave.stateHash,
      d50Sha256: wave.d50.sha256,
      stateSha256: wave.stateFile.sha256
    })),
    boundary: summary.boundary
  };
}

function main() {
  let priorState = readJson(INPUTS.wave22pState);
  let priorD50 = fileStatus(INPUTS.wave22pD50);
  let priorStateFile = fileStatus(INPUTS.wave22pState);
  let priorEmbeddedStateHash = priorState.stateHash;
  let priorWave = "22P";
  const completedWaves = [];

  for (const [index, letter] of WAVE_LETTERS.entries()) {
    const linkNumber = FIRST_LINK + index;
    const isFinal = letter === "Z";
    const state = buildWaveState({
      letter,
      priorState,
      priorD50Status: priorD50,
      priorStateFileStatus: priorStateFile,
      priorEmbeddedStateHash,
      priorWave,
      linkNumber,
      isFinal
    });
    const statePath = statePathFor(letter);
    const d50Path = d50PathFor(letter);
    const reportPath = reportPathFor(letter);
    writeJson(statePath, state);
    writeText(d50Path, buildD50(state, letter, linkNumber, isFinal));
    writeText(reportPath, buildPerWaveReport(state, letter, linkNumber, isFinal));

    const stateRel = repoRel(statePath);
    const d50Rel = repoRel(d50Path);
    completedWaves.push({
      wave: `22${letter}`,
      linkNumber,
      stateHash: state.stateHash,
      d50: fileStatus(d50Rel),
      stateFile: fileStatus(stateRel),
      report: fileStatus(repoRel(reportPath)),
      singleLetterSetClosed: isFinal
    });

    priorState = state;
    priorD50 = fileStatus(d50Rel);
    priorStateFile = fileStatus(stateRel);
    priorEmbeddedStateHash = state.stateHash;
    priorWave = `22${letter}`;
  }

  const finalState = priorState;
  const summary = {
    schema: "federation-reintegration-wave22qz-finish-all-remaining.v1",
    runId,
    generatedAt,
    status: "DRAFT_ONLY_NOT_RATIFIED",
    relationship: "ACER_WAVE22_SINGLE_LETTER_SET_COMPLETE_Q_THROUGH_Z",
    completedWaves,
    finalWave: "22Z",
    finalLinkNumber: FIRST_LINK + WAVE_LETTERS.length - 1,
    lirisCascadeState: finalState.lirisCascadeState,
    finalGateState: finalState.gateState,
    aggregateVerdict: {
      wave22SingleLetterSetClosed: true,
      autonomousGateExecutionAvailable: false,
      gateExecutionByThisRun: false,
      nextMeaningfulInputClass: "operator gate value or actual T1 payload",
      allGatesHeld: finalState.gateState.every((gate) => gate.executed === false && gate.valueStatus === "BLANK_HELD"),
      noFalseProgressClaim: true
    },
    boundary: "Wave 22Q-Z ACER single-letter completion only. Emits local ACER ledger artifacts through 22Z. No gate execution, no content transfer, no overwrite of prior waves, no path fabrication, no schedule reconciliation, no vision disposition choice, no hash fabrication, no parent manifest modification, no Merkle recompute, no peer endpoint, no payload transfer, no Liris disk write by ACER, no MCP invocation, no exterior MCP, no model fanout, no device action, no emit, no ed25519, no key ceremony, no quorum outreach, no cosigner recruitment, no census admission, no PID mint, no quarantine lift, no rule ratification, no rule promotion, no federation promotion, no chain break, no false progress claim."
  };
  summary.stateHash = sha256Text(JSON.stringify(summary));

  const artifacts = {
    summaryState: repoRel(OUTPUTS.summaryState),
    summaryD50: repoRel(OUTPUTS.summaryD50),
    report: repoRel(OUTPUTS.report),
    reportJson: repoRel(OUTPUTS.reportJson),
    memory: repoRel(OUTPUTS.memory),
    map: repoRel(OUTPUTS.map),
    glpj: repoRel(OUTPUTS.glpj),
    completedWaveArtifacts: completedWaves.map((wave) => ({
      wave: wave.wave,
      d50: wave.d50.path,
      state: wave.stateFile.path,
      report: wave.report.path
    }))
  };

  writeJson(OUTPUTS.summaryState, summary);
  writeText(OUTPUTS.summaryD50, buildSummaryD50(summary));
  writeJson(OUTPUTS.reportJson, { ...summary, artifacts });
  writeJson(OUTPUTS.memory, {
    memoryId: "federation-reintegration-wave22qz-finish-all-remaining.v1",
    generatedAt,
    status: summary.status,
    relationship: summary.relationship,
    significance: "ACER completed the remaining Wave 22 single-letter local ledger slots from 22Q through 22Z under HOLD.",
    stateHash: summary.stateHash,
    artifacts,
    boundary: summary.boundary
  });
  writeJson(OUTPUTS.map, buildMap(summary));
  writeJson(OUTPUTS.glpj, buildGlpj(summary));
  writeText(OUTPUTS.report, [
    "# Federation Reintegration Wave 22Q-Z Finish All Remaining",
    "",
    `Generated: ${generatedAt}`,
    `Status: ${summary.status}`,
    `State hash: ${summary.stateHash}`,
    "",
    "## Result",
    "",
    "- ACER emitted Wave 22Q through Wave 22Z local ledger artifacts.",
    "- Wave 22 single-letter set is closed on ACER at 22Z.",
    "- All seven gates remain held and unexecuted.",
    "- This is not ratification and not federation promotion.",
    "",
    "## Boundary",
    "",
    summary.boundary
  ].join("\n"));

  console.log(JSON.stringify({
    ok: true,
    status: summary.status,
    relationship: summary.relationship,
    stateHash: summary.stateHash,
    completedWaves: completedWaves.map((wave) => ({
      wave: wave.wave,
      linkNumber: wave.linkNumber,
      d50Sha256: wave.d50.sha256,
      stateSha256: wave.stateFile.sha256,
      stateHash: wave.stateHash
    })),
    artifacts
  }, null, 2));
}

main();
