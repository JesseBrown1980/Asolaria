#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const runId = "federation-reintegration-wave26ax-24wave-batch-20260427";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427");
const councilRoot = path.join(repoRoot, "data", "agent-index", "council");
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWX".split("");

const INPUTS = Object.freeze({
  wave25zState: "data/behcs/orchestration/federation-reintegration-20260427/wave25z-acer-terminal-closeout-link95.v1.json",
  wave25zD50: "data/agent-index/council/D50-WAVE25Z-ACER-TERMINAL-CLOSEOUT-LINK95-2026-04-27.md"
});

const OUTPUTS = Object.freeze({
  aggregate: path.join(runRoot, "wave26a-x-24wave-batch-acer.v1.json"),
  report: path.join(repoRoot, "reports", "federation-reintegration-wave26a-x-24wave-batch-acer-latest.md"),
  reportJson: path.join(repoRoot, "reports", "federation-reintegration-wave26a-x-24wave-batch-acer-latest.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "federation-reintegration-wave26a-x-24wave-batch-acer.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "federation-reintegration-wave26a-x-24wave-batch-acer-map.v1.json"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "federation-reintegration-wave26a-x-24wave-batch-acer.glpj.json")
});

const LIRIS_REFERENCE = Object.freeze({
  lastKnownWave: "25Z",
  cumulativeArtifacts: 123,
  closeoutChainDepth: 95,
  chiefCouncilDissentWave: 122,
  allGates: "BLANK_HELD",
  wave26HashesRelayed: false
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

function fileStatusAbs(filePath) {
  return fileStatus(repoRel(filePath));
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), "utf8"));
}

function heldGatesFrom(prior) {
  return (prior.gateState || []).map((gate) => ({
    id: gate.id,
    readiness: gate.readiness,
    valueStatus: gate.valueStatus || "BLANK_HELD",
    executed: false,
    canProceedAutonomously: false
  }));
}

function phaseFor(letter) {
  return letter === "A" ? "subcascade-rollover" : "batch-closeout";
}

function linkFor(index) {
  return 96 + index;
}

function statePath(letter, linkNumber) {
  return path.join(runRoot, `wave26${letter.toLowerCase()}-acer-24wave-batch-link${linkNumber}.v1.json`);
}

function d50Path(letter, linkNumber) {
  return path.join(councilRoot, `D50-WAVE26${letter}-ACER-24WAVE-BATCH-LINK${linkNumber}-2026-04-27.md`);
}

function supervisorCohort(letter, linkNumber, phase) {
  return [
    {
      level: "L0_BOUNDARY",
      prof: "PROF-HOOKWALL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HOOKWALL.BOUNDARY",
      verdict: `ALLOW_ACER_26${letter}_LINK${linkNumber}_LEDGER_ONLY`
    },
    {
      level: "L1_PACKET_SCHEMA",
      prof: "PROF-HERMES",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET.ACER",
      verdict: "RECORD_PRIOR_ACER_SELF_HASH_AND_NO_LIRIS_26_HASH"
    },
    {
      level: "L2_EBACMAP",
      prof: "PROF-EBACMAP",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.EBACMAP.CASCADE.ACER",
      verdict: phase === "subcascade-rollover" ? "ROLLOVER_MARKER_FROM_WAVE25Z_NO_WAVE25_MUTATION" : `ACER_LINK${linkNumber}_APPEND_ONLY_NO_CHAIN_BREAK`
    },
    {
      level: "L3_KERNEL",
      prof: "PROF-KERNEL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.KERNEL.GRAMMAR.ACER",
      verdict: "WAVE26_24WAVE_BATCH_NO_RULE_PROMOTION"
    },
    {
      level: "L4_EXECUTOR",
      prof: "PROF-EXECUTOR",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.EXECUTOR.WAVE.ACER",
      verdict: `WAVE26${letter}_IS_LEDGER_EXECUTOR_NOT_FEDERATION_EXECUTION`
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
      verdict: "WAVE26_24_LINK_BATCH_CAN_CONTINUE_UNDER_HOLD"
    },
    {
      level: "L7_APEX",
      prof: "COL-ASOLARIA",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.ASOLARIA.APEX.ACER",
      verdict: "BATCH_LEDGER_ONLY_UNTIL_GATE_VALUE_OR_ACTUAL_T1_PAYLOAD"
    }
  ];
}

function boundaryFor(letter, linkNumber, phase) {
  const phaseClause = phase === "subcascade-rollover"
    ? "rolls Wave 26 open from Wave 25Z at link 96"
    : "records prior ACER self-hashes and no relayed Liris Wave 26 counterpart hash";
  return `Wave 26${letter} ACER 24-wave batch link ${linkNumber} ${phaseClause}. This is ledger continuation only. No gate execution, no content transfer, no overwrite, no path fabrication, no schedule reconciliation, no vision disposition choice, no hash fabrication, no parent manifest modification, no Merkle recompute, no peer endpoint, no payload transfer, no Liris disk write by ACER, no MCP invocation, no exterior MCP, no model fanout, no device action, no emit, no ed25519, no key ceremony, no quorum outreach, no cosigner recruitment, no census admission, no PID mint, no quarantine lift, no rule ratification, no rule promotion, no federation promotion, no chain break, no false progress claim.`;
}

function buildD50(state) {
  const lines = [];
  lines.push(`# D50 Wave 26${state.wave.letter} - ACER 24-Wave Batch Link ${state.closeoutChain.linkNumber}`);
  lines.push("");
  lines.push(`Generated: ${state.generatedAt}`);
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
  lines.push(`- Latest relayed Liris waves: ${state.lirisRelay.latestRelayedWaves.join(", ")}.`);
  lines.push(`- Current Liris counterpart ${state.lirisRelay.currentCounterpartWave}: hash relayed=${state.lirisRelay.currentCounterpartHashRelayed}, content-on-ACER=${state.lirisRelay.currentCounterpartContentOnAcer}.`);
  lines.push("- No Liris Wave 26 hash or content is fabricated.");
  lines.push("");
  lines.push("## ACER Link");
  lines.push("");
  lines.push(`- Link number: ${state.closeoutChain.linkNumber}.`);
  lines.push(`- phase=${state.wave.phase}.`);
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

function buildWaveState({ letter, index, prior, priorD50Status, priorStateStatus, priorStateHash, relayed }) {
  const linkNumber = linkFor(index);
  const waveName = `26${letter}`;
  const phase = phaseFor(letter);
  const gateState = heldGatesFrom(prior);
  const latestRelayedWaves = Object.keys(relayed).sort();
  const state = {
    schema: "federation-reintegration-wave26a-x-24wave-batch-acer.wave.v1",
    runId,
    generatedAt,
    status: "DRAFT_ONLY_NOT_RATIFIED",
    relationship: `ACER_26${letter}_24WAVE_BATCH_LINK${linkNumber}`,
    wave: {
      family: "Wave 26",
      letter,
      name: waveName,
      phase,
      batchIndex: index + 1,
      batchTotal: LETTERS.length
    },
    priorAcer: {
      wave: prior.wave && prior.wave.name ? prior.wave.name : "25Z",
      d50: priorD50Status,
      stateFile: priorStateStatus,
      stateHashInsideFile: priorStateHash,
      linkNumber: prior.closeoutChain ? prior.closeoutChain.linkNumber : null,
      noChainBreak: prior.closeoutChain ? Boolean(prior.closeoutChain.noChainBreak) : false
    },
    lirisRelay: {
      latestRelayedWaves,
      latestRelayedSha256s: relayed,
      newlyRecordedLirisHashes: [],
      currentCounterpartWave: waveName,
      currentCounterpartHashRelayed: false,
      currentCounterpartContentOnAcer: false,
      unrelayedLirisWave26Batch: LETTERS.map((l) => `26${l}`),
      verificationClass: "NO_LIRIS_26_RELAY_NO_HASH_FABRICATION"
    },
    closeoutChain: {
      acerAddsLink: `Wave ${waveName}`,
      linkNumber,
      phase,
      rolloverFromPriorAcerWave25ZLink: letter === "A" ? 95 : null,
      recordsPriorAcerD50Sha256: priorD50Status.sha256,
      recordsPriorAcerStateSha256: priorStateStatus.sha256,
      recordsPriorAcerStateHash: priorStateHash,
      recordsLirisSha256: null,
      noChainBreak: Boolean(priorD50Status.present && priorStateStatus.present && prior.closeoutChain && prior.closeoutChain.noChainBreak)
    },
    gateState,
    supervisorCohort: supervisorCohort(letter, linkNumber, phase),
    aggregateVerdict: {
      autonomousGateExecutionAvailable: false,
      gateExecutionByThisWave: false,
      nextMeaningfulInputClass: "operator gate value or actual T1 payload",
      allGatesHeld: gateState.every((gate) => gate.valueStatus === "BLANK_HELD" && gate.executed === false),
      noFalseProgressClaim: true
    },
    boundary: boundaryFor(letter, linkNumber, phase)
  };
  state.stateHash = sha256Text(JSON.stringify(state));
  return state;
}

function main() {
  let prior = readJson(INPUTS.wave25zState);
  let priorD50Status = fileStatus(INPUTS.wave25zD50);
  let priorStateStatus = fileStatus(INPUTS.wave25zState);
  let priorStateHash = prior.stateHash || null;
  const relayed = prior.lirisRelay && prior.lirisRelay.latestRelayedSha256s ? { ...prior.lirisRelay.latestRelayedSha256s } : {};
  const emitted = [];

  for (let index = 0; index < LETTERS.length; index += 1) {
    const letter = LETTERS[index];
    const linkNumber = linkFor(index);
    const state = buildWaveState({ letter, index, prior, priorD50Status, priorStateStatus, priorStateHash, relayed });
    const stateFile = statePath(letter, linkNumber);
    const d50File = d50Path(letter, linkNumber);
    writeJson(stateFile, state);
    writeText(d50File, buildD50(state));

    const stateStatus = fileStatusAbs(stateFile);
    const d50Status = fileStatusAbs(d50File);
    emitted.push({
      wave: state.wave.name,
      letter,
      linkNumber,
      phase: state.wave.phase,
      stateHash: state.stateHash,
      stateFile: stateStatus,
      d50: d50Status,
      newlyRecordedLirisHashes: [],
      allGatesHeld: state.aggregateVerdict.allGatesHeld,
      noChainBreak: state.closeoutChain.noChainBreak
    });

    prior = state;
    priorD50Status = d50Status;
    priorStateStatus = stateStatus;
    priorStateHash = state.stateHash;
  }

  const finalWave = emitted[emitted.length - 1];
  const aggregate = {
    schema: "federation-reintegration-wave26a-x-24wave-batch-acer.v1",
    runId,
    generatedAt,
    status: "DRAFT_ONLY_NOT_RATIFIED",
    relationship: "ACER_WAVE26_A_THROUGH_X_24WAVE_BATCH",
    range: {
      from: "26A",
      to: "26X",
      waveCount: emitted.length,
      rolloverFromWave25ZLink: 95,
      startLink: 96,
      finalLink: finalWave.linkNumber,
      remainingOpen: ["26Y", "26Z"]
    },
    lirisReference: LIRIS_REFERENCE,
    carriedRelayedHashes: relayed,
    emitted,
    finalStateHash: finalWave.stateHash,
    gates: {
      allHeld: emitted.every((row) => row.allGatesHeld),
      executedAny: false
    },
    boundary: "Batch emitted ACER Wave 26 A-X as 24 append-only DRAFT_ONLY_NOT_RATIFIED ledger entries. Wave 26A rolls over from Wave 25Z at link 96 and Wave 26X stops at link 119 with Wave 26Y/Z intentionally open. No Liris Wave 26 hashes or content were relayed or fabricated. The batch does not execute any federation gate, transfer payload, invoke peer/MCP/device actions, mint PIDs, ratify rules, promote federation state, or recompute parent Merkle surfaces."
  };
  aggregate.stateHash = sha256Text(JSON.stringify(aggregate));

  const artifacts = Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)]));
  writeJson(OUTPUTS.aggregate, aggregate);
  writeJson(OUTPUTS.reportJson, { ...aggregate, artifacts });
  writeJson(OUTPUTS.memory, {
    memoryId: "federation-reintegration-wave26a-x-24wave-batch-acer.v1",
    generatedAt,
    status: aggregate.status,
    relationship: aggregate.relationship,
    significance: "ACER emitted a 24-wave Wave 26 batch from A through X under HOLD, leaving Y/Z open.",
    stateHash: aggregate.stateHash,
    finalStateHash: aggregate.finalStateHash,
    artifacts,
    boundary: aggregate.boundary
  });
  writeJson(OUTPUTS.map, {
    mapId: "federation-reintegration-wave26a-x-24wave-batch-acer-map.v1",
    generatedAt,
    nodes: emitted.map((row) => ({ id: row.wave, kind: "acer_wave26_24wave_batch_link", linkNumber: row.linkNumber, phase: row.phase, stateHash: row.stateHash })),
    edges: emitted.slice(1).map((row, index) => ({ from: emitted[index].wave, to: row.wave, relation: "records_prior_hash" })),
    boundary: aggregate.boundary
  });
  writeJson(OUTPUTS.glpj, {
    glpjId: "federation-reintegration-wave26a-x-24wave-batch-acer.glpj",
    generatedAt,
    family: "federation",
    d11: "ACER_WAVE26_A_X_24WAVE_BATCH",
    glyphs: emitted.map((row) => ({
      token: `FED-WAVE${row.wave}-LINK${row.linkNumber}`,
      wave: row.wave,
      linkNumber: row.linkNumber,
      phase: row.phase,
      stateHash: row.stateHash
    })),
    boundary: aggregate.boundary
  });
  writeText(OUTPUTS.report, [
    "# Federation Reintegration Wave 26A-X ACER 24-Wave Batch",
    "",
    `Generated: ${generatedAt}`,
    `Status: ${aggregate.status}`,
    `Aggregate state hash: ${aggregate.stateHash}`,
    `Final wave: ${finalWave.wave}`,
    `Final link: ${finalWave.linkNumber}`,
    `Final state hash: ${finalWave.stateHash}`,
    "",
    "## Result",
    "",
    `- Emitted ${emitted.length} ACER D50/state wave links: 26A through 26X.`,
    "- Wave 26Y and 26Z remain intentionally open.",
    "- No Liris Wave 26 hashes were relayed or fabricated.",
    "- All seven gates remain held and unexecuted.",
    "",
    "## Boundary",
    "",
    aggregate.boundary
  ].join("\n"));

  console.log(JSON.stringify({
    ok: true,
    status: aggregate.status,
    relationship: aggregate.relationship,
    emitted: emitted.length,
    firstWave: emitted[0].wave,
    finalWave: finalWave.wave,
    finalLink: finalWave.linkNumber,
    remainingOpen: aggregate.range.remainingOpen,
    aggregateStateHash: aggregate.stateHash,
    finalStateHash: finalWave.stateHash,
    artifacts
  }, null, 2));
}

main();
