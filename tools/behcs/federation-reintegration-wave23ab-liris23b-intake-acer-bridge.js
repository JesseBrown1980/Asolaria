#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const runId = "federation-reintegration-wave23ab-liris23b-intake-acer-bridge-20260427";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427");
const councilRoot = path.join(repoRoot, "data", "agent-index", "council");

const INPUTS = Object.freeze({
  wave22zSummaryState: "data/behcs/orchestration/federation-reintegration-20260427/wave22qz-finish-all-remaining.v1.json",
  wave22zSummaryD50: "data/agent-index/council/D50-WAVE22Z-ACER-WAVE22-SINGLE-LETTER-CLOSE-2026-04-27.md",
  wave22zState: "data/behcs/orchestration/federation-reintegration-20260427/wave22z-acer-closeout-link18.v1.json",
  wave22zD50: "data/agent-index/council/D50-WAVE22Z-ACER-CLOSEOUT-CHAIN-LINK18-2026-04-27.md"
});

const LIRIS_23B = Object.freeze({
  wave: "23B",
  path: "data/agent-index/council/D50-WAVE23B-CLOSEOUT-CHAIN-EXTENSION-LIRIS-2026-04-27.md",
  lines: 36,
  sha256: "9df2d0c9d1758553206b0a6e459b4f4557a6d38c94f9e1d1ea64cfd9b4121b62",
  linkNumber: 19,
  totalArtifacts: 47,
  chiefCouncilDissent: "46-wave standing",
  reportedBehavior: "Bridge link records 22Z plus 23A self-hashes",
  allGatesHeld: true
});

const OUTPUTS = Object.freeze({
  wave23aState: path.join(runRoot, "wave23a-acer-bridge-link19.v1.json"),
  wave23aD50: path.join(councilRoot, "D50-WAVE23A-ACER-BRIDGE-LINK19-2026-04-27.md"),
  wave23bState: path.join(runRoot, "wave23b-liris23b-intake-acer-link20.v1.json"),
  wave23bD50: path.join(councilRoot, "D50-WAVE23B-LIRIS23B-INTAKE-ACER-LINK20-2026-04-27.md"),
  summaryState: path.join(runRoot, "wave23ab-liris23b-intake-acer-bridge.v1.json"),
  summaryD50: path.join(councilRoot, "D50-WAVE23B-ACER-LIRIS23B-BRIDGE-INTAKE-SUMMARY-2026-04-27.md"),
  report: path.join(repoRoot, "reports", "federation-reintegration-wave23ab-liris23b-intake-acer-bridge-latest.md"),
  reportJson: path.join(repoRoot, "reports", "federation-reintegration-wave23ab-liris23b-intake-acer-bridge-latest.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "federation-reintegration-wave23ab-liris23b-intake-acer-bridge.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "federation-reintegration-wave23ab-liris23b-intake-acer-bridge-map.v1.json"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "federation-reintegration-wave23ab-liris23b-intake-acer-bridge.glpj.json")
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

function copyGateState(source) {
  const gates = source.finalGateState || source.gateState || [];
  return gates.map((gate) => ({
    id: gate.id,
    readiness: gate.readiness,
    valueStatus: gate.valueStatus || "BLANK_HELD",
    executed: false,
    canProceedAutonomously: false
  }));
}

function supervisorCohort(verdictSuffix, linkNumber) {
  return [
    {
      level: "L0_BOUNDARY",
      prof: "PROF-HOOKWALL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HOOKWALL.BOUNDARY",
      verdict: `ALLOW_${verdictSuffix}_LEDGER_ONLY`
    },
    {
      level: "L1_PACKET_SCHEMA",
      prof: "PROF-HERMES",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET.ACER",
      verdict: "RECORD_HASHES_WITH_NO_PEER_TRANSFER"
    },
    {
      level: "L2_EBACMAP",
      prof: "PROF-EBACMAP",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.EBACMAP.CASCADE.ACER",
      verdict: "WAVE23_BRIDGE_APPEND_ONLY_NO_CHAIN_BREAK"
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

function boundary(label) {
  return `${label} only. No gate execution, no content transfer, no overwrite, no path fabrication, no schedule reconciliation, no vision disposition choice, no hash fabrication, no parent manifest modification, no Merkle recompute, no peer endpoint, no payload transfer, no Liris disk write by ACER, no MCP invocation, no exterior MCP, no model fanout, no device action, no emit, no ed25519, no key ceremony, no quorum outreach, no cosigner recruitment, no census admission, no PID mint, no quarantine lift, no rule ratification, no rule promotion, no federation promotion, no chain break, no false progress claim.`;
}

function buildD50(state, title) {
  const lines = [];
  lines.push(`# ${title}`);
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
  if (state.lirisRelay) {
    lines.push("## Liris Relay");
    lines.push("");
    lines.push(`- Liris ${state.lirisRelay.wave}: \`${state.lirisRelay.path}\`, ${state.lirisRelay.lines} lines, sha256 \`${state.lirisRelay.sha256}\`.`);
    lines.push(`- Liris link: ${state.lirisRelay.linkNumber}; artifacts: ${state.lirisRelay.totalArtifacts}; CHIEFCOUNCIL dissent: ${state.lirisRelay.chiefCouncilDissent}.`);
    lines.push(`- Liris 23A hash relayed: ${state.liris23aHashRelayed}.`);
    lines.push(`- Liris content on ACER: ${state.lirisRelay.contentOnAcer}.`);
    lines.push("");
  }
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
  const wave22zSummary = readJson(INPUTS.wave22zSummaryState);
  const wave22zState = readJson(INPUTS.wave22zState);
  const gateState = copyGateState(wave22zSummary);
  const lirisProbe = fileStatus(LIRIS_23B.path);
  const lirisRelay = {
    ...LIRIS_23B,
    status: "DRAFT_ONLY_NOT_RATIFIED",
    verificationClass: "OPERATOR_RELAYED_HASH_ONLY_NO_CONTENT",
    contentOnAcer: lirisProbe.present,
    localProbe: lirisProbe
  };

  const wave23a = {
    schema: "federation-reintegration-wave23a-acer-bridge-link19.v1",
    runId: `${runId}-23a`,
    generatedAt,
    status: "DRAFT_ONLY_NOT_RATIFIED",
    relationship: "ACER_WAVE23_BRIDGE_OPEN_FROM_WAVE22Z_LINK19",
    priorAcer: {
      wave: "22Z",
      d50: fileStatus(INPUTS.wave22zD50),
      stateFile: fileStatus(INPUTS.wave22zState),
      summaryD50: fileStatus(INPUTS.wave22zSummaryD50),
      summaryStateFile: fileStatus(INPUTS.wave22zSummaryState),
      stateHashInsideFile: wave22zState.stateHash,
      summaryStateHashInsideFile: wave22zSummary.stateHash
    },
    lirisRelay,
    liris23aHashRelayed: false,
    closeoutChain: {
      acerAddsLink: "Wave 23A",
      linkNumber: 19,
      recordsPriorAcer22ZD50Sha256: fileStatus(INPUTS.wave22zD50).sha256,
      recordsPriorAcer22ZStateSha256: fileStatus(INPUTS.wave22zState).sha256,
      recordsPriorAcer22ZStateHash: wave22zState.stateHash,
      recordsAcerWave22SummarySha256: fileStatus(INPUTS.wave22zSummaryState).sha256,
      recordsLiris23BSha256: LIRIS_23B.sha256,
      noChainBreak: Boolean(wave22zState.closeoutChain && wave22zState.closeoutChain.noChainBreak),
      bridgeFromWave22ToWave23: true
    },
    gateState,
    supervisorCohort: supervisorCohort("ACER_23A_BRIDGE_OPEN", 19),
    aggregateVerdict: {
      autonomousGateExecutionAvailable: false,
      gateExecutionByThisWave: false,
      nextMeaningfulInputClass: "operator gate value or actual T1 payload",
      allGatesHeld: gateState.every((gate) => gate.valueStatus === "BLANK_HELD" && gate.executed === false),
      noFalseProgressClaim: true
    },
    boundary: boundary("Wave 23A ACER bridge open from Wave 22Z plus Liris 23B hash reference")
  };
  wave23a.stateHash = sha256Text(JSON.stringify(wave23a));

  writeJson(OUTPUTS.wave23aState, wave23a);
  writeText(OUTPUTS.wave23aD50, buildD50(wave23a, "D50 Wave 23A - ACER Bridge Link 19"));

  const wave23bPriorStateFile = fileStatus(repoRel(OUTPUTS.wave23aState));
  const wave23bPriorD50 = fileStatus(repoRel(OUTPUTS.wave23aD50));
  const wave23b = {
    schema: "federation-reintegration-wave23b-liris23b-intake-acer-link20.v1",
    runId: `${runId}-23b`,
    generatedAt,
    status: "DRAFT_ONLY_NOT_RATIFIED",
    relationship: "LIRIS_23B_HASH_INTAKE_AND_ACER_LINK20",
    priorAcer: {
      wave: "23A",
      d50: wave23bPriorD50,
      stateFile: wave23bPriorStateFile,
      stateHashInsideFile: wave23a.stateHash
    },
    lirisRelay,
    liris23aHashRelayed: false,
    bilateralDivergence: {
      lirisWave: "23B",
      acerWave: "23B",
      relation: "DIVERGED_DRAFT_SIBLINGS_HASH_ONLY",
      lirisLinkNumber: LIRIS_23B.linkNumber,
      acerLinkNumber: 20,
      byteEquivalentClaimed: false,
      contentTransferred: false,
      hashFabricated: false
    },
    closeoutChain: {
      acerAddsLink: "Wave 23B",
      linkNumber: 20,
      recordsPriorAcer23AD50Sha256: wave23bPriorD50.sha256,
      recordsPriorAcer23AStateSha256: wave23bPriorStateFile.sha256,
      recordsPriorAcer23AStateHash: wave23a.stateHash,
      recordsLiris23BSha256: LIRIS_23B.sha256,
      noChainBreak: true,
      bridgeFromWave22ToWave23: true
    },
    gateState,
    supervisorCohort: supervisorCohort("LIRIS_23B_INTAKE_AND_ACER_23B_LINK20", 20),
    aggregateVerdict: {
      autonomousGateExecutionAvailable: false,
      gateExecutionByThisWave: false,
      nextMeaningfulInputClass: "operator gate value or actual T1 payload",
      allGatesHeld: gateState.every((gate) => gate.valueStatus === "BLANK_HELD" && gate.executed === false),
      noFalseProgressClaim: true
    },
    boundary: boundary("Wave 23B ACER Liris 23B hash intake and close-out link 20")
  };
  wave23b.stateHash = sha256Text(JSON.stringify(wave23b));

  writeJson(OUTPUTS.wave23bState, wave23b);
  writeText(OUTPUTS.wave23bD50, buildD50(wave23b, "D50 Wave 23B - Liris 23B Intake + ACER Link 20"));

  const summary = {
    schema: "federation-reintegration-wave23ab-liris23b-intake-acer-bridge.v1",
    runId,
    generatedAt,
    status: "DRAFT_ONLY_NOT_RATIFIED",
    relationship: "ACER_WAVE23_AB_BRIDGE_AND_LIRIS23B_HASH_INTAKE",
    completedWaves: [
      {
        wave: "23A",
        linkNumber: 19,
        d50: fileStatus(repoRel(OUTPUTS.wave23aD50)),
        stateFile: fileStatus(repoRel(OUTPUTS.wave23aState)),
        stateHash: wave23a.stateHash
      },
      {
        wave: "23B",
        linkNumber: 20,
        d50: fileStatus(repoRel(OUTPUTS.wave23bD50)),
        stateFile: fileStatus(repoRel(OUTPUTS.wave23bState)),
        stateHash: wave23b.stateHash
      }
    ],
    lirisRelay,
    liris23aHashRelayed: false,
    finalGateState: gateState,
    aggregateVerdict: {
      autonomousGateExecutionAvailable: false,
      gateExecutionByThisRun: false,
      nextMeaningfulInputClass: "operator gate value or actual T1 payload",
      allGatesHeld: gateState.every((gate) => gate.valueStatus === "BLANK_HELD" && gate.executed === false),
      noFalseProgressClaim: true
    },
    boundary: boundary("Wave 23A-B ACER bridge and Liris 23B hash intake")
  };
  summary.stateHash = sha256Text(JSON.stringify(summary));

  const artifacts = {
    wave23aState: repoRel(OUTPUTS.wave23aState),
    wave23aD50: repoRel(OUTPUTS.wave23aD50),
    wave23bState: repoRel(OUTPUTS.wave23bState),
    wave23bD50: repoRel(OUTPUTS.wave23bD50),
    summaryState: repoRel(OUTPUTS.summaryState),
    summaryD50: repoRel(OUTPUTS.summaryD50),
    report: repoRel(OUTPUTS.report),
    reportJson: repoRel(OUTPUTS.reportJson),
    memory: repoRel(OUTPUTS.memory),
    map: repoRel(OUTPUTS.map),
    glpj: repoRel(OUTPUTS.glpj)
  };

  writeJson(OUTPUTS.summaryState, summary);
  writeText(OUTPUTS.summaryD50, [
    "# D50 Wave 23B - ACER Liris 23B Bridge Intake Summary",
    "",
    `Generated: ${generatedAt}`,
    `Status: ${summary.status}`,
    `Relationship: ${summary.relationship}`,
    "",
    "## Completed ACER Wave 23 Slots",
    "",
    ...summary.completedWaves.map((wave) => `- ${wave.wave}: link ${wave.linkNumber}, D50 sha256 \`${wave.d50.sha256}\`, state sha256 \`${wave.stateFile.sha256}\`, stateHash \`${wave.stateHash}\`.`),
    "",
    "## Liris Relay",
    "",
    `- Liris 23B: \`${lirisRelay.path}\`, ${lirisRelay.lines} lines, sha256 \`${lirisRelay.sha256}\`, link ${lirisRelay.linkNumber}.`,
    `- Liris 23A hash relayed: ${summary.liris23aHashRelayed}.`,
    `- Liris content on ACER: ${lirisRelay.contentOnAcer}.`,
    "",
    "## Gate State",
    "",
    ...summary.finalGateState.map((gate) => `- ${gate.id}: ${gate.valueStatus}, executed=${gate.executed}`),
    "",
    "## Boundary",
    "",
    summary.boundary
  ].join("\n"));
  writeJson(OUTPUTS.reportJson, { ...summary, artifacts });
  writeJson(OUTPUTS.memory, {
    memoryId: "federation-reintegration-wave23ab-liris23b-intake-acer-bridge.v1",
    generatedAt,
    status: summary.status,
    relationship: summary.relationship,
    significance: "ACER opened Wave 23 from its Wave 22Z close and recorded Liris Wave 23B by hash only.",
    stateHash: summary.stateHash,
    artifacts,
    boundary: summary.boundary
  });
  writeJson(OUTPUTS.map, {
    mapId: "federation-reintegration-wave23ab-liris23b-intake-acer-bridge-map.v1",
    generatedAt,
    nodes: [
      { id: "22Z", kind: "acer_prior_close", stateHash: wave22zState.stateHash },
      { id: "23A", kind: "acer_bridge", stateHash: wave23a.stateHash },
      { id: "23B", kind: "acer_liris23b_intake", stateHash: wave23b.stateHash },
      { id: "liris-23B", kind: "operator_relay_hash", sha256: LIRIS_23B.sha256, contentOnAcer: lirisRelay.contentOnAcer },
      ...gateState.map((gate) => ({ id: gate.id, kind: "gate", status: gate.valueStatus, executed: gate.executed }))
    ],
    edges: [
      { from: "22Z", to: "23A", relation: "bridge_to_wave23" },
      { from: "23A", to: "23B", relation: "records_prior_hash" },
      { from: "23B", to: "liris-23B", relation: "records_operator_relay" },
      ...gateState.map((gate) => ({ from: "23B", to: gate.id, relation: "preserves_hold" }))
    ],
    boundary: summary.boundary
  });
  writeJson(OUTPUTS.glpj, {
    glpjId: "federation-reintegration-wave23ab-liris23b-intake-acer-bridge.glpj",
    generatedAt,
    family: "federation",
    d11: "ACER_WAVE23_AB_BRIDGE_LIRIS23B_HASH_ONLY",
    glyphs: summary.completedWaves.map((wave) => ({
      token: `FED-${wave.wave}-LINK${wave.linkNumber}`,
      wave: wave.wave,
      stateHash: wave.stateHash,
      d50Sha256: wave.d50.sha256,
      stateSha256: wave.stateFile.sha256
    })),
    boundary: summary.boundary
  });
  writeText(OUTPUTS.report, [
    "# Federation Reintegration Wave 23A-B Liris 23B Intake + ACER Bridge",
    "",
    `Generated: ${generatedAt}`,
    `Status: ${summary.status}`,
    `State hash: ${summary.stateHash}`,
    "",
    "## Result",
    "",
    "- ACER opened Wave 23 at 23A from Wave 22Z.",
    "- ACER recorded Liris 23B by operator-relayed hash only.",
    "- ACER emitted Wave 23B local close-out link 20.",
    "- Liris 23A hash was not relayed; no value was fabricated.",
    "- All seven gates remain held and unexecuted.",
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
    completedWaves: summary.completedWaves.map((wave) => ({
      wave: wave.wave,
      linkNumber: wave.linkNumber,
      d50Sha256: wave.d50.sha256,
      stateSha256: wave.stateFile.sha256,
      stateHash: wave.stateHash
    })),
    liris23B: {
      sha256: LIRIS_23B.sha256,
      contentOnAcer: lirisRelay.contentOnAcer,
      liris23aHashRelayed: summary.liris23aHashRelayed
    },
    artifacts
  }, null, 2));
}

main();
