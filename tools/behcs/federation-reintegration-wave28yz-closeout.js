#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const runId = "federation-reintegration-wave28yz-closeout-20260427";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427");
const councilRoot = path.join(repoRoot, "data", "agent-index", "council");
const LETTERS = ["Y", "Z"];

const LIRIS_WAVE28 = Object.freeze({
  "28A": {
    wave: "28A",
    role: "rollover",
    sha256: "66330bd9b9f39cbb98ecfb55d72cee190ee9500cca93fb9837a747742a2fd170",
    lirisLink: 148,
    contentOnAcer: false,
    verificationClass: "OPERATOR_RELAYED_HASH_ONLY_NO_CONTENT_NO_PATH"
  },
  "28X": {
    wave: "28X",
    role: "batch-final-before-yz",
    sha256: "3087a872340568b74af738e934a7b8227658df7fff0954de21200d13304119fd",
    lirisLink: 171,
    contentOnAcer: false,
    verificationClass: "OPERATOR_RELAYED_HASH_ONLY_NO_CONTENT_NO_PATH"
  }
});

const LIRIS_SUMMARY = Object.freeze({
  cumulativeArtifacts: 199,
  closeoutChainDepth: 171,
  chiefCouncilDissentWave: 198,
  allGates: "BLANK_HELD",
  wave28YzRelayed: false
});

const INPUTS = Object.freeze({
  wave28xState: "data/behcs/orchestration/federation-reintegration-20260427/wave28x-acer-24wave-batch-link171.v1.json",
  wave28xD50: "data/agent-index/council/D50-WAVE28X-ACER-24WAVE-BATCH-LINK171-2026-04-27.md"
});

const OUTPUTS = Object.freeze({
  aggregate: path.join(runRoot, "wave28y-z-closeout-acer.v1.json"),
  report: path.join(repoRoot, "reports", "federation-reintegration-wave28y-z-closeout-acer-latest.md"),
  reportJson: path.join(repoRoot, "reports", "federation-reintegration-wave28y-z-closeout-acer-latest.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "federation-reintegration-wave28y-z-closeout-acer.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "federation-reintegration-wave28y-z-closeout-acer-map.v1.json"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "federation-reintegration-wave28y-z-closeout-acer.glpj.json")
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
  return letter === "Z" ? "terminal-closeout" : "late-completion";
}

function linkFor(letter) {
  return letter === "Y" ? 172 : 173;
}

function statePath(letter, linkNumber) {
  return path.join(runRoot, `wave28${letter.toLowerCase()}-acer-${phaseFor(letter)}-link${linkNumber}.v1.json`);
}

function d50Path(letter, linkNumber) {
  return path.join(councilRoot, `D50-WAVE28${letter}-ACER-${phaseFor(letter).toUpperCase()}-LINK${linkNumber}-2026-04-27.md`);
}

function supervisorCohort(letter, linkNumber, phase) {
  return [
    {
      level: "L0_BOUNDARY",
      prof: "PROF-HOOKWALL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HOOKWALL.BOUNDARY",
      verdict: `ALLOW_ACER_28${letter}_LINK${linkNumber}_LEDGER_ONLY`
    },
    {
      level: "L1_PACKET_SCHEMA",
      prof: "PROF-HERMES",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET.ACER",
      verdict: letter === "Y"
        ? "RECORD_LATE_LIRIS_28A_28X_HASHES_WITHOUT_REWRITE"
        : "TERMINAL_CLOSEOUT_NO_LIRIS_28Z_HASH"
    },
    {
      level: "L2_EBACMAP",
      prof: "PROF-EBACMAP",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.EBACMAP.CASCADE.ACER",
      verdict: `ACER_LINK${linkNumber}_APPEND_ONLY_NO_CHAIN_BREAK`
    },
    {
      level: "L3_KERNEL",
      prof: "PROF-KERNEL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.KERNEL.GRAMMAR.ACER",
      verdict: "WAVE28_YZ_CLOSEOUT_NO_RULE_PROMOTION"
    },
    {
      level: "L4_EXECUTOR",
      prof: "PROF-EXECUTOR",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.EXECUTOR.WAVE.ACER",
      verdict: `WAVE28${letter}_IS_LEDGER_EXECUTOR_NOT_FEDERATION_EXECUTION`
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
      verdict: "WAVE28_CAN_CLOSE_LOCALLY_UNDER_HOLD_WITH_UNRELAYED_LIRIS_YZ"
    },
    {
      level: "L7_APEX",
      prof: "COL-ASOLARIA",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.ASOLARIA.APEX.ACER",
      verdict: "LEDGER_ONLY_CLOSEOUT_UNTIL_GATE_VALUE_OR_ACTUAL_T1_PAYLOAD"
    }
  ];
}

function boundaryFor(letter, linkNumber, phase) {
  const clause = letter === "Y"
    ? "records late operator-relayed Liris 28A and 28X hashes without rewriting ACER 28A-X"
    : "closes ACER Wave 28 locally while Liris 28Y and 28Z remain unrelayed";
  return `Wave 28${letter} ACER ${phase} link ${linkNumber} ${clause}. This is ledger continuation only. No gate execution, no content transfer, no overwrite, no path fabrication, no schedule reconciliation, no vision disposition choice, no hash fabrication, no parent manifest modification, no Merkle recompute, no peer endpoint, no payload transfer, no Liris disk write by ACER, no MCP invocation, no exterior MCP, no model fanout, no device action, no emit, no ed25519, no key ceremony, no quorum outreach, no cosigner recruitment, no census admission, no PID mint, no quarantine lift, no rule ratification, no rule promotion, no federation promotion, no chain break, no false progress claim.`;
}

function buildD50(state) {
  const lines = [];
  lines.push(`# D50 Wave 28${state.wave.letter} - ACER ${state.wave.phase} Link ${state.closeoutChain.linkNumber}`);
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
  lines.push(`- Newly recorded Liris hashes: ${state.lirisRelay.newlyRecordedLirisHashes.map((row) => row.wave).join(", ") || "none"}.`);
  for (const row of state.lirisRelay.newlyRecordedLirisHashes) {
    lines.push(`- ${row.wave}: sha256 \`${row.sha256}\`, link=${row.lirisLink}, content-on-ACER=${row.contentOnAcer}.`);
  }
  lines.push(`- Current Liris counterpart ${state.lirisRelay.currentCounterpartWave}: hash relayed=${state.lirisRelay.currentCounterpartHashRelayed}, content-on-ACER=${state.lirisRelay.currentCounterpartContentOnAcer}.`);
  lines.push("- No unrelayed Liris Wave 28 hash or content is fabricated.");
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

function buildWaveState({ letter, prior, priorD50Status, priorStateStatus, priorStateHash, relayed }) {
  const linkNumber = linkFor(letter);
  const waveName = `28${letter}`;
  const phase = phaseFor(letter);
  const gateState = heldGatesFrom(prior);
  const newlyRecorded = letter === "Y" ? Object.values(LIRIS_WAVE28) : [];
  const state = {
    schema: "federation-reintegration-wave28y-z-closeout-acer.wave.v1",
    runId,
    generatedAt,
    status: "DRAFT_ONLY_NOT_RATIFIED",
    relationship: `ACER_28${letter}_${phase.toUpperCase()}_LINK${linkNumber}`,
    wave: {
      family: "Wave 28",
      letter,
      name: waveName,
      phase
    },
    priorAcer: {
      wave: prior.wave && prior.wave.name ? prior.wave.name : "28X",
      d50: priorD50Status,
      stateFile: priorStateStatus,
      stateHashInsideFile: priorStateHash,
      linkNumber: prior.closeoutChain ? prior.closeoutChain.linkNumber : null,
      noChainBreak: prior.closeoutChain ? Boolean(prior.closeoutChain.noChainBreak) : false
    },
    lirisRelay: {
      latestRelayedWaves: Object.keys(relayed).sort(),
      latestRelayedSha256s: relayed,
      newlyRecordedLirisHashes: newlyRecorded,
      currentCounterpartWave: waveName,
      currentCounterpartHashRelayed: false,
      currentCounterpartContentOnAcer: false,
      unrelayedLirisWave28Closeout: ["28Y", "28Z"],
      verificationClass: "OPERATOR_RELAYED_HASH_ONLY_NO_CONTENT_NO_UNRELAYED_HASH_FABRICATION"
    },
    closeoutChain: {
      acerAddsLink: `Wave ${waveName}`,
      linkNumber,
      phase,
      recordsPriorAcerD50Sha256: priorD50Status.sha256,
      recordsPriorAcerStateSha256: priorStateStatus.sha256,
      recordsPriorAcerStateHash: priorStateHash,
      recordsLirisSha256: null,
      noChainBreak: Boolean(priorD50Status.present && priorStateStatus.present && prior.closeoutChain && prior.closeoutChain.noChainBreak)
    },
    gateState,
    supervisorCohort: supervisorCohort(letter, linkNumber, phase),
    lirisSummary: LIRIS_SUMMARY,
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
  let prior = readJson(INPUTS.wave28xState);
  let priorD50Status = fileStatus(INPUTS.wave28xD50);
  let priorStateStatus = fileStatus(INPUTS.wave28xState);
  let priorStateHash = prior.stateHash || null;
  const relayed = prior.lirisRelay && prior.lirisRelay.latestRelayedSha256s ? { ...prior.lirisRelay.latestRelayedSha256s } : {};
  for (const [wave, value] of Object.entries(LIRIS_WAVE28)) relayed[wave] = value.sha256;
  const emitted = [];

  for (const letter of LETTERS) {
    const linkNumber = linkFor(letter);
    const state = buildWaveState({ letter, prior, priorD50Status, priorStateStatus, priorStateHash, relayed });
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
      newlyRecordedLirisHashes: state.lirisRelay.newlyRecordedLirisHashes,
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
    schema: "federation-reintegration-wave28y-z-closeout-acer.v1",
    runId,
    generatedAt,
    status: "DRAFT_ONLY_NOT_RATIFIED",
    relationship: "ACER_WAVE28_Y_Z_CLOSEOUT",
    range: {
      from: "28Y",
      to: "28Z",
      waveCount: emitted.length,
      rolloverFromWave28XLink: 171,
      startLink: 172,
      finalLink: finalWave.linkNumber,
      remainingOpen: ["29A"]
    },
    lirisReference: {
      ...LIRIS_SUMMARY,
      newlyRecordedHashes: LIRIS_WAVE28,
      currentCounterpartYzRelayed: false
    },
    carriedRelayedHashes: relayed,
    emitted,
    finalStateHash: finalWave.stateHash,
    gates: {
      allHeld: emitted.every((row) => row.allGatesHeld),
      executedAny: false
    },
    boundary: "Batch emitted ACER Wave 28Y-Z as 2 append-only DRAFT_ONLY_NOT_RATIFIED ledger entries. Wave 28Y records late operator-relayed Liris 28A/28X hashes without rewriting ACER 28A-X. Wave 28Z closes ACER Wave 28 locally at link 173 while Liris 28Y/Z hashes/content remain unrelayed and unfabricated. The closeout does not execute any federation gate, transfer payload, invoke peer/MCP/device actions, mint PIDs, ratify rules, promote federation state, or recompute parent Merkle surfaces."
  };
  aggregate.stateHash = sha256Text(JSON.stringify(aggregate));

  const artifacts = Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)]));
  writeJson(OUTPUTS.aggregate, aggregate);
  writeJson(OUTPUTS.reportJson, { ...aggregate, artifacts });
  writeJson(OUTPUTS.memory, {
    memoryId: "federation-reintegration-wave28y-z-closeout-acer.v1",
    generatedAt,
    status: aggregate.status,
    relationship: aggregate.relationship,
    significance: "ACER closed Wave 28 locally with Y/Z after recording late operator-relayed Liris 28A/28X hashes.",
    stateHash: aggregate.stateHash,
    finalStateHash: aggregate.finalStateHash,
    artifacts,
    boundary: aggregate.boundary
  });
  writeJson(OUTPUTS.map, {
    mapId: "federation-reintegration-wave28y-z-closeout-acer-map.v1",
    generatedAt,
    nodes: emitted.map((row) => ({ id: row.wave, kind: "acer_wave28_closeout_link", linkNumber: row.linkNumber, phase: row.phase, stateHash: row.stateHash })),
    edges: [{ from: "28Y", to: "28Z", relation: "records_prior_hash" }],
    boundary: aggregate.boundary
  });
  writeJson(OUTPUTS.glpj, {
    glpjId: "federation-reintegration-wave28y-z-closeout-acer.glpj",
    generatedAt,
    family: "federation",
    d11: "ACER_WAVE28_Y_Z_CLOSEOUT",
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
    "# Federation Reintegration Wave 28Y-Z ACER Closeout",
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
    "- Emitted 2 ACER D50/state wave links: 28Y and 28Z.",
    "- Recorded operator-relayed Liris 28A and 28X hashes.",
    "- Liris 28Y and 28Z hashes/content were not relayed or fabricated.",
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
