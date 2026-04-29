#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const runId = "federation-reintegration-wave25az-batch-subcascade-20260427";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427");
const councilRoot = path.join(repoRoot, "data", "agent-index", "council");
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const LIRIS_WAVE25 = Object.freeze({
  "25A": {
    wave: "25A",
    role: "rollover",
    sha256: "8a7458b171a70a27826fa4eb356b33711a44c1e6be4786b18d721ff093933ebc",
    lirisLink: 70,
    contentOnAcer: false,
    verificationClass: "OPERATOR_RELAYED_HASH_ONLY_NO_CONTENT_NO_PATH"
  },
  "25X": {
    wave: "25X",
    role: "batch-final-before-yz",
    sha256: "3274c7dea4100b0fb50aa5e4d15a9041c861e4c71c784ca1d5e2c73679efbb75",
    lirisLink: 93,
    contentOnAcer: false,
    verificationClass: "OPERATOR_RELAYED_HASH_ONLY_NO_CONTENT_NO_PATH"
  },
  "25Y": {
    wave: "25Y",
    role: "late-completion",
    sha256: "24c93a8b6f14986448821bc03beb3cdeca30afc8756613488d95135a584028e8",
    lirisLink: 94,
    contentOnAcer: false,
    verificationClass: "OPERATOR_RELAYED_HASH_ONLY_NO_CONTENT_NO_PATH"
  },
  "25Z": {
    wave: "25Z",
    role: "terminal",
    sha256: "c5010085cf3a50cccfe59a74a5be867ce941f26d11091df2a47d1efcdea51aaf",
    lirisLink: 95,
    contentOnAcer: false,
    verificationClass: "OPERATOR_RELAYED_HASH_ONLY_NO_CONTENT_NO_PATH"
  }
});

const LIRIS_SUMMARY = Object.freeze({
  cumulativeArtifacts: 123,
  closeoutChainDepth: 95,
  chiefCouncilDissentWave: 122,
  allGates: "BLANK_HELD",
  boundary: "noEmit,noEd25519,noPeerCall,noADB,noPidMint,noContentMirror,noHashFabrication,noRatification,noPromotion,noFalseProgressClaim,noChainBreak"
});

const INPUTS = Object.freeze({
  wave24zState: "data/behcs/orchestration/federation-reintegration-20260427/wave24z-acer-batch-terminal-closeout-link69.v1.json",
  wave24zD50: "data/agent-index/council/D50-WAVE24Z-ACER-BATCH-TERMINAL-CLOSEOUT-LINK69-2026-04-27.md"
});

const OUTPUTS = Object.freeze({
  aggregate: path.join(runRoot, "wave25a-z-batch-subcascade-acer.v1.json"),
  report: path.join(repoRoot, "reports", "federation-reintegration-wave25a-z-batch-subcascade-acer-latest.md"),
  reportJson: path.join(repoRoot, "reports", "federation-reintegration-wave25a-z-batch-subcascade-acer-latest.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "federation-reintegration-wave25a-z-batch-subcascade-acer.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "federation-reintegration-wave25a-z-batch-subcascade-acer-map.v1.json"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "federation-reintegration-wave25a-z-batch-subcascade-acer.glpj.json")
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
  if (letter === "A") return "subcascade-rollover";
  if (letter === "Z") return "terminal-closeout";
  if (letter === "Y") return "late-completion";
  return "batch-closeout";
}

function linkFor(index) {
  return 70 + index;
}

function statePath(letter, linkNumber) {
  return path.join(runRoot, `wave25${letter.toLowerCase()}-acer-${phaseFor(letter)}-link${linkNumber}.v1.json`);
}

function d50Path(letter, linkNumber) {
  return path.join(councilRoot, `D50-WAVE25${letter}-ACER-${phaseFor(letter).toUpperCase()}-LINK${linkNumber}-2026-04-27.md`);
}

function supervisorCohort(letter, linkNumber, phase) {
  return [
    {
      level: "L0_BOUNDARY",
      prof: "PROF-HOOKWALL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HOOKWALL.BOUNDARY",
      verdict: `ALLOW_ACER_25${letter}_LINK${linkNumber}_LEDGER_ONLY`
    },
    {
      level: "L1_PACKET_SCHEMA",
      prof: "PROF-HERMES",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET.ACER",
      verdict: LIRIS_WAVE25[`25${letter}`] ? `RECORD_LIRIS_25${letter}_HASH_ONLY` : "RECORD_PRIOR_ACER_SELF_HASH_AND_NO_NEW_LIRIS_HASH"
    },
    {
      level: "L2_EBACMAP",
      prof: "PROF-EBACMAP",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.EBACMAP.CASCADE.ACER",
      verdict: phase === "subcascade-rollover" ? "ROLLOVER_MARKER_FROM_WAVE24Z_NO_WAVE24_MUTATION" : `ACER_LINK${linkNumber}_APPEND_ONLY_NO_CHAIN_BREAK`
    },
    {
      level: "L3_KERNEL",
      prof: "PROF-KERNEL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.KERNEL.GRAMMAR.ACER",
      verdict: "WAVE25_SUBCASCADE_COMPLETION_NO_RULE_PROMOTION"
    },
    {
      level: "L4_EXECUTOR",
      prof: "PROF-EXECUTOR",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.EXECUTOR.WAVE.ACER",
      verdict: `WAVE25${letter}_IS_LEDGER_EXECUTOR_NOT_FEDERATION_EXECUTION`
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
      verdict: "WAVE25_SINGLE_LETTER_SUBCASCADE_CAN_COMPLETE_UNDER_HOLD"
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
  const relayed = LIRIS_WAVE25[`25${letter}`];
  const phaseClause = phase === "subcascade-rollover"
    ? "rolls Wave 25 open from Wave 24Z at link 70"
    : phase === "terminal-closeout"
      ? "closes Wave 25 at link 95 while recording the operator-relayed Liris 25Z terminal hash"
      : relayed
        ? `records the operator-relayed Liris 25${letter} hash only`
        : "records prior ACER self-hashes and no newly relayed Liris counterpart hash";
  return `Wave 25${letter} ACER ${phase} link ${linkNumber} ${phaseClause}. This is ledger continuation only. No gate execution, no content transfer, no overwrite, no path fabrication, no schedule reconciliation, no vision disposition choice, no hash fabrication, no parent manifest modification, no Merkle recompute, no peer endpoint, no payload transfer, no Liris disk write by ACER, no MCP invocation, no exterior MCP, no model fanout, no device action, no emit, no ed25519, no key ceremony, no quorum outreach, no cosigner recruitment, no census admission, no PID mint, no quarantine lift, no rule ratification, no rule promotion, no federation promotion, no chain break, no false progress claim.`;
}

function buildD50(state) {
  const lines = [];
  lines.push(`# D50 Wave 25${state.wave.letter} - ACER ${state.wave.phase} Link ${state.closeoutChain.linkNumber}`);
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
  if (state.lirisRelay.newlyRecordedLirisHashes.length) {
    for (const row of state.lirisRelay.newlyRecordedLirisHashes) {
      lines.push(`- Newly recorded ${row.wave}: sha256 \`${row.sha256}\`, link=${row.lirisLink}, content-on-ACER=${row.contentOnAcer}.`);
    }
  } else {
    lines.push("- Newly recorded Liris hashes: none.");
  }
  lines.push(`- Current Liris counterpart ${state.lirisRelay.currentCounterpartWave}: hash relayed=${state.lirisRelay.currentCounterpartHashRelayed}, content-on-ACER=${state.lirisRelay.currentCounterpartContentOnAcer}.`);
  lines.push("- No unrelayed Liris hash or content is fabricated.");
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
  const waveName = `25${letter}`;
  const phase = phaseFor(letter);
  const latestRelayedSha256s = { ...relayed };
  const newlyRecordedLirisHashes = [];
  if (LIRIS_WAVE25[waveName]) {
    latestRelayedSha256s[waveName] = LIRIS_WAVE25[waveName].sha256;
    newlyRecordedLirisHashes.push(LIRIS_WAVE25[waveName]);
  }
  const latestRelayedWaves = Object.keys(latestRelayedSha256s).sort();
  const gateState = heldGatesFrom(prior);
  const relayedCurrent = Boolean(LIRIS_WAVE25[waveName]);
  const state = {
    schema: "federation-reintegration-wave25a-z-batch-subcascade-acer.wave.v1",
    runId,
    generatedAt,
    status: "DRAFT_ONLY_NOT_RATIFIED",
    relationship: relayedCurrent
      ? `ACER_25${letter}_${phase.toUpperCase().replace(/-/g, "_")}_LINK${linkNumber}_LIRIS_HASH_ONLY`
      : `ACER_25${letter}_BATCH_CLOSEOUT_LINK${linkNumber}`,
    wave: {
      family: "Wave 25",
      letter,
      name: waveName,
      phase,
      batchIndex: index + 1,
      batchTotal: LETTERS.length
    },
    priorAcer: {
      wave: prior.wave && prior.wave.name ? prior.wave.name : "24Z",
      d50: priorD50Status,
      stateFile: priorStateStatus,
      stateHashInsideFile: priorStateHash,
      linkNumber: prior.closeoutChain ? prior.closeoutChain.linkNumber : null,
      noChainBreak: prior.closeoutChain ? Boolean(prior.closeoutChain.noChainBreak) : false
    },
    lirisRelay: {
      latestRelayedWaves,
      latestRelayedSha256s,
      newlyRecordedLirisHashes,
      carriedRelayedHashes: latestRelayedWaves.map((wave) => ({ wave, sha256: latestRelayedSha256s[wave], contentOnAcer: false })),
      currentCounterpartWave: waveName,
      currentCounterpartHashRelayed: relayedCurrent,
      currentCounterpartContentOnAcer: false,
      unrelayedLirisWave25Intermediates: LETTERS.map((l) => `25${l}`).filter((wave) => !LIRIS_WAVE25[wave]),
      verificationClass: "OPERATOR_RELAYED_HASH_ONLY_NO_CONTENT_NO_UNRELAYED_HASH_FABRICATION"
    },
    closeoutChain: {
      acerAddsLink: `Wave ${waveName}`,
      linkNumber,
      phase,
      rolloverFromPriorAcerWave24ZLink: letter === "A" ? 69 : null,
      recordsPriorAcerD50Sha256: priorD50Status.sha256,
      recordsPriorAcerStateSha256: priorStateStatus.sha256,
      recordsPriorAcerStateHash: priorStateHash,
      recordsLirisSha256: relayedCurrent ? LIRIS_WAVE25[waveName].sha256 : null,
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
  let prior = readJson(INPUTS.wave24zState);
  let priorD50Status = fileStatus(INPUTS.wave24zD50);
  let priorStateStatus = fileStatus(INPUTS.wave24zState);
  let priorStateHash = prior.stateHash || null;
  let relayed = prior.lirisRelay && prior.lirisRelay.latestRelayedSha256s ? { ...prior.lirisRelay.latestRelayedSha256s } : {};
  const emitted = [];

  for (let index = 0; index < LETTERS.length; index += 1) {
    const letter = LETTERS[index];
    const waveName = `25${letter}`;
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
      newlyRecordedLirisHashes: state.lirisRelay.newlyRecordedLirisHashes.map((row) => row.wave),
      allGatesHeld: state.aggregateVerdict.allGatesHeld,
      noChainBreak: state.closeoutChain.noChainBreak
    });

    if (LIRIS_WAVE25[waveName]) relayed = { ...relayed, [waveName]: LIRIS_WAVE25[waveName].sha256 };
    prior = state;
    priorD50Status = d50Status;
    priorStateStatus = stateStatus;
    priorStateHash = state.stateHash;
  }

  const finalWave = emitted[emitted.length - 1];
  const aggregate = {
    schema: "federation-reintegration-wave25a-z-batch-subcascade-acer.v1",
    runId,
    generatedAt,
    status: "DRAFT_ONLY_NOT_RATIFIED",
    relationship: "ACER_WAVE25_A_THROUGH_Z_BATCH_SUBCASCADE_COMPLETION",
    range: {
      from: "25A",
      to: "25Z",
      waveCount: emitted.length,
      rolloverFromWave24ZLink: 69,
      startLink: 70,
      finalLink: finalWave.linkNumber
    },
    operatorRelayedHashes: LIRIS_WAVE25,
    lirisSummary: LIRIS_SUMMARY,
    emitted,
    finalStateHash: finalWave.stateHash,
    gates: {
      allHeld: emitted.every((row) => row.allGatesHeld),
      executedAny: false
    },
    boundary: "Batch completed ACER Wave 25 A-Z as append-only DRAFT_ONLY_NOT_RATIFIED ledger entries. Wave 25A rolls over from Wave 24Z at link 70 and Wave 25Z closes at link 95. The batch records only operator-relayed Liris 25A, 25X, 25Y, and 25Z hashes; it does not fabricate Liris 25B-W hashes or content and does not execute any federation gate, transfer payload, invoke peer/MCP/device actions, mint PIDs, ratify rules, promote federation state, or recompute parent Merkle surfaces."
  };
  aggregate.stateHash = sha256Text(JSON.stringify(aggregate));

  const artifacts = Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)]));
  writeJson(OUTPUTS.aggregate, aggregate);
  writeJson(OUTPUTS.reportJson, { ...aggregate, artifacts });
  writeJson(OUTPUTS.memory, {
    memoryId: "federation-reintegration-wave25a-z-batch-subcascade-acer.v1",
    generatedAt,
    status: aggregate.status,
    relationship: aggregate.relationship,
    significance: "ACER completed Wave 25 A-Z as ledger-only close-out links, incorporating late Liris 25Y/25Z hash-only evidence.",
    stateHash: aggregate.stateHash,
    finalStateHash: aggregate.finalStateHash,
    artifacts,
    boundary: aggregate.boundary
  });
  writeJson(OUTPUTS.map, {
    mapId: "federation-reintegration-wave25a-z-batch-subcascade-acer-map.v1",
    generatedAt,
    nodes: [
      ...emitted.map((row) => ({ id: row.wave, kind: "acer_wave25_batch_link", linkNumber: row.linkNumber, phase: row.phase, stateHash: row.stateHash })),
      ...Object.values(LIRIS_WAVE25).map((row) => ({ id: `liris-${row.wave}`, kind: "operator_relayed_hash_only", sha256: row.sha256, contentOnAcer: false }))
    ],
    edges: emitted.slice(1).map((row, index) => ({ from: emitted[index].wave, to: row.wave, relation: "records_prior_hash" })),
    boundary: aggregate.boundary
  });
  writeJson(OUTPUTS.glpj, {
    glpjId: "federation-reintegration-wave25a-z-batch-subcascade-acer.glpj",
    generatedAt,
    family: "federation",
    d11: "ACER_WAVE25_A_Z_BATCH_SUBCASCADE_COMPLETION",
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
    "# Federation Reintegration Wave 25A-Z ACER Batch Subcascade",
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
    `- Emitted ${emitted.length} ACER D50/state wave links: 25A through 25Z.`,
    "- Wave 25A records the Liris 25A rollover hash by reference only.",
    "- Wave 25X records the Liris 25X batch hash by reference only.",
    "- Wave 25Y records the late Liris 25Y hash by reference only.",
    "- Wave 25Z records the Liris 25Z terminal hash by reference only.",
    "- Liris 25B-W hashes were not relayed and were not fabricated.",
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
    aggregateStateHash: aggregate.stateHash,
    finalStateHash: finalWave.stateHash,
    artifacts
  }, null, 2));
}

main();
