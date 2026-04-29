#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const runId = "federation-reintegration-wave23iz-batch-finish-remaining-20260427";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427");
const councilRoot = path.join(repoRoot, "data", "agent-index", "council");

const LETTERS = "IJKLMNOPQRSTUVWXYZ".split("");

const OPERATOR_RELAYED = Object.freeze({
  "23G": {
    wave: "23G",
    path: "data/agent-index/council/D50-WAVE23G-CLOSEOUT-CHAIN-EXTENSION-LIRIS-2026-04-27.md",
    lines: 34,
    sha256: "eed6585176cb3e29f9db079fa7bf2fe2591534dfc34f9e1ade0de6dc62b092d3",
    lirisLink: 24,
    lirisCascadeArtifacts: 52,
    chiefCouncilDissentWave: 51,
    contentOnAcer: false,
    relayedBy: "operator_prompt_2026-04-27",
    verificationClass: "OPERATOR_RELAYED_HASH_ONLY_NO_CONTENT"
  },
  "23H": {
    wave: "23H",
    path: "data/agent-index/council/D50-WAVE23H-CLOSEOUT-CHAIN-EXTENSION-LIRIS-2026-04-27.md",
    lines: 34,
    sha256: "a083380bc6167d93789f2c0f70433b97a87076bc81cc03e9f9cbeb4a0b0eaa29",
    lirisLink: 25,
    lirisCascadeArtifacts: 53,
    chiefCouncilDissentWave: 52,
    contentOnAcer: false,
    relayedBy: "operator_prompt_2026-04-27",
    verificationClass: "OPERATOR_RELAYED_HASH_ONLY_NO_CONTENT"
  }
});

const INPUTS = Object.freeze({
  wave23hState: "data/behcs/orchestration/federation-reintegration-20260427/wave23h-liris23h-intake-acer-link26.v1.json",
  wave23hD50: "data/agent-index/council/D50-WAVE23H-LIRIS23H-INTAKE-ACER-LINK26-2026-04-27.md"
});

const OUTPUTS = Object.freeze({
  aggregate: path.join(runRoot, "wave23i-z-batch-finish-remaining-acer.v1.json"),
  report: path.join(repoRoot, "reports", "federation-reintegration-wave23i-z-batch-finish-remaining-acer-latest.md"),
  reportJson: path.join(repoRoot, "reports", "federation-reintegration-wave23i-z-batch-finish-remaining-acer-latest.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "federation-reintegration-wave23i-z-batch-finish-remaining-acer.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "federation-reintegration-wave23i-z-batch-finish-remaining-acer-map.v1.json"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "federation-reintegration-wave23i-z-batch-finish-remaining-acer.glpj.json")
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

function fileStatusAbs(absolutePath) {
  return fileStatus(repoRel(absolutePath));
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), "utf8"));
}

function supervisorCohort(letter, linkNumber, phase) {
  return [
    {
      level: "L0_BOUNDARY",
      prof: "PROF-HOOKWALL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HOOKWALL.BOUNDARY",
      verdict: `ALLOW_ACER_23${letter}_LINK${linkNumber}_BATCH_LEDGER_ONLY`
    },
    {
      level: "L1_PACKET_SCHEMA",
      prof: "PROF-HERMES",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET.ACER",
      verdict: phase === "gap-resolution"
        ? "RECORD_LIRIS_23G_OPERATOR_HASH_AS_LATE_GAP_RESOLUTION_NO_BACKFILL"
        : "RECORD_PRIOR_ACER_SELF_HASH_AND_NO_NEW_LIRIS_HASH"
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
      verdict: "BATCH_SINGLE_LETTER_WAVE_COMPLETION_NO_RULE_PROMOTION"
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
      verdict: "WAVE23_SINGLE_LETTER_SLOTS_CAN_COMPLETE_UNDER_HOLD"
    },
    {
      level: "L7_APEX",
      prof: "COL-ASOLARIA",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.ASOLARIA.APEX.ACER",
      verdict: "BATCH_LEDGER_ONLY_UNTIL_GATE_VALUE_OR_ACTUAL_T1_PAYLOAD"
    }
  ];
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

function boundaryFor(letter, linkNumber, phase) {
  const phaseClause = phase === "gap-resolution"
    ? "records the late operator-relayed Liris 23G hash and preserves that prior ACER 23H was not rewritten"
    : "records prior ACER self-hashes and no newly relayed Liris counterpart hash";
  return `Wave 23${letter} ACER batch link ${linkNumber} ${phaseClause}. This is ledger continuation only. No gate execution, no content transfer, no overwrite, no path fabrication, no schedule reconciliation, no vision disposition choice, no hash fabrication, no parent manifest modification, no Merkle recompute, no peer endpoint, no payload transfer, no Liris disk write by ACER, no MCP invocation, no exterior MCP, no model fanout, no device action, no emit, no ed25519, no key ceremony, no quorum outreach, no cosigner recruitment, no census admission, no PID mint, no quarantine lift, no rule ratification, no rule promotion, no federation promotion, no chain break, no false progress claim.`;
}

function d50Path(letter, linkNumber) {
  return path.join(councilRoot, `D50-WAVE23${letter}-ACER-BATCH-CLOSEOUT-LINK${linkNumber}-2026-04-27.md`);
}

function statePath(letter, linkNumber) {
  return path.join(runRoot, `wave23${letter.toLowerCase()}-acer-batch-closeout-link${linkNumber}.v1.json`);
}

function buildD50(state) {
  const lines = [];
  lines.push(`# D50 Wave 23${state.wave.letter} - ACER Batch Close-out Link ${state.closeoutChain.linkNumber}`);
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
      lines.push(`- Newly recorded ${row.wave}: \`${row.path}\`, ${row.lines} lines, sha256 \`${row.sha256}\`, content-on-ACER=${row.contentOnAcer}.`);
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
  lines.push(`- noChainBreak=${state.closeoutChain.noChainBreak}.`);
  lines.push(`- phase=${state.wave.phase}.`);
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
  const linkNumber = 27 + index;
  const waveName = `23${letter}`;
  const phase = letter === "I" ? "gap-resolution" : "batch-closeout";
  const latestRelayedSha256s = { ...relayed };
  const newlyRecordedLirisHashes = [];
  if (letter === "I") {
    latestRelayedSha256s["23G"] = OPERATOR_RELAYED["23G"].sha256;
    newlyRecordedLirisHashes.push(OPERATOR_RELAYED["23G"]);
  }
  const latestRelayedWaves = Object.keys(latestRelayedSha256s).sort();
  const gateState = heldGatesFrom(prior);
  const state = {
    schema: "federation-reintegration-wave23i-z-batch-finish-remaining-acer.wave.v1",
    runId,
    generatedAt,
    status: "DRAFT_ONLY_NOT_RATIFIED",
    relationship: letter === "I"
      ? "ACER_23I_LIRIS23G_GAP_RESOLUTION_PLUS_BATCH_LINK27"
      : `ACER_23${letter}_BATCH_CLOSEOUT_LINK${linkNumber}`,
    wave: {
      family: "Wave 23",
      letter,
      name: waveName,
      phase,
      batchIndex: index + 1,
      batchTotal: LETTERS.length
    },
    priorAcer: {
      wave: prior.wave && prior.wave.name ? prior.wave.name : (prior.closeoutChain ? prior.closeoutChain.acerAddsLink : "23H"),
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
      currentCounterpartHashRelayed: false,
      currentCounterpartContentOnAcer: false,
      verificationClass: "OPERATOR_RELAYED_HASH_ONLY_NO_CONTENT_NO_UNRELAYED_HASH_FABRICATION"
    },
    closeoutChain: {
      acerAddsLink: `Wave ${waveName}`,
      linkNumber,
      recordsPriorAcerD50Sha256: priorD50Status.sha256,
      recordsPriorAcerStateSha256: priorStateStatus.sha256,
      recordsPriorAcerStateHash: priorStateHash,
      recordsLateLiris23GHash: letter === "I" ? OPERATOR_RELAYED["23G"].sha256 : null,
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
  let prior = readJson(INPUTS.wave23hState);
  let priorD50Status = fileStatus(INPUTS.wave23hD50);
  let priorStateStatus = fileStatus(INPUTS.wave23hState);
  let priorStateHash = prior.stateHash || null;
  let relayed = {
    ...(prior.lirisRelay && prior.lirisRelay.latestRelayedSha256s ? prior.lirisRelay.latestRelayedSha256s : {}),
    "23H": OPERATOR_RELAYED["23H"].sha256
  };
  const emitted = [];

  for (let index = 0; index < LETTERS.length; index += 1) {
    const letter = LETTERS[index];
    const linkNumber = 27 + index;
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

    if (letter === "I") relayed = { ...relayed, "23G": OPERATOR_RELAYED["23G"].sha256 };
    prior = state;
    priorD50Status = d50Status;
    priorStateStatus = stateStatus;
    priorStateHash = state.stateHash;
  }

  const finalWave = emitted[emitted.length - 1];
  const aggregate = {
    schema: "federation-reintegration-wave23i-z-batch-finish-remaining-acer.v1",
    runId,
    generatedAt,
    status: "DRAFT_ONLY_NOT_RATIFIED",
    relationship: "ACER_WAVE23_I_THROUGH_Z_BATCH_LEDGER_COMPLETION",
    range: {
      from: "23I",
      to: "23Z",
      waveCount: emitted.length,
      startLink: emitted[0].linkNumber,
      finalLink: finalWave.linkNumber
    },
    operatorRelayedHashes: OPERATOR_RELAYED,
    emitted,
    finalStateHash: finalWave.stateHash,
    gates: {
      allHeld: emitted.every((row) => row.allGatesHeld),
      executedAny: false
    },
    boundary: "Batch completed ACER Wave 23 single-letter slots I through Z as append-only DRAFT_ONLY_NOT_RATIFIED ledger entries. The batch records late operator-relayed Liris 23G and already-relayed Liris 23H by hash only. It does not fabricate unrelayed Liris 23I-Z hashes and does not execute any federation gate, transfer payload, invoke peer/MCP/device actions, mint PIDs, ratify rules, promote federation state, or recompute parent Merkle surfaces."
  };
  aggregate.stateHash = sha256Text(JSON.stringify(aggregate));

  const artifacts = Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)]));
  writeJson(OUTPUTS.aggregate, aggregate);
  writeJson(OUTPUTS.reportJson, { ...aggregate, artifacts });
  writeJson(OUTPUTS.memory, {
    memoryId: "federation-reintegration-wave23i-z-batch-finish-remaining-acer.v1",
    generatedAt,
    status: aggregate.status,
    relationship: aggregate.relationship,
    significance: "ACER batch-completed Wave 23 I-Z as ledger-only close-out links, resolving the Liris 23G hash gap without rewriting earlier artifacts.",
    stateHash: aggregate.stateHash,
    finalStateHash: aggregate.finalStateHash,
    artifacts,
    boundary: aggregate.boundary
  });
  writeJson(OUTPUTS.map, {
    mapId: "federation-reintegration-wave23i-z-batch-finish-remaining-acer-map.v1",
    generatedAt,
    nodes: [
      ...emitted.map((row) => ({ id: row.wave, kind: "acer_batch_link", linkNumber: row.linkNumber, stateHash: row.stateHash })),
      ...Object.values(OPERATOR_RELAYED).map((row) => ({ id: `liris-${row.wave}`, kind: "operator_relayed_hash_only", sha256: row.sha256, contentOnAcer: false }))
    ],
    edges: emitted.slice(1).map((row, index) => ({ from: emitted[index].wave, to: row.wave, relation: "records_prior_hash" })),
    boundary: aggregate.boundary
  });
  writeJson(OUTPUTS.glpj, {
    glpjId: "federation-reintegration-wave23i-z-batch-finish-remaining-acer.glpj",
    generatedAt,
    family: "federation",
    d11: "ACER_WAVE23_I_Z_BATCH_LEDGER_COMPLETION",
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
    "# Federation Reintegration Wave 23I-Z ACER Batch Finish",
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
    `- Emitted ${emitted.length} ACER D50/state wave links: 23I through 23Z.`,
    "- Wave 23I records the late operator-relayed Liris 23G hash and preserves that earlier 23H was not rewritten.",
    "- Liris 23H remains recorded by operator-relayed hash only.",
    "- No Liris 23I-Z hashes were fabricated.",
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
