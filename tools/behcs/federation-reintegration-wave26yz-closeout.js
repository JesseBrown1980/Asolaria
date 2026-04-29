#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const runId = "federation-reintegration-wave26yz-closeout-20260427";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427");
const councilRoot = path.join(repoRoot, "data", "agent-index", "council");
const LETTERS = ["Y", "Z"];

const LIRIS_WAVE26 = Object.freeze({
  "26A": {
    wave: "26A",
    role: "rollover",
    sha256: "8f2a16bfc5b6901708959a174afccbff5e3b11f687b882419474f0a6118a8e22",
    lirisLink: 96,
    contentOnAcer: false,
    verificationClass: "OPERATOR_RELAYED_HASH_ONLY_NO_CONTENT_NO_PATH"
  },
  "26X": {
    wave: "26X",
    role: "batch-final-before-yz",
    sha256: "ebf0d1a1bc89ceac4ba2ccd8e2e3818a8e655c7bbca3abec74065518f5aff777",
    lirisLink: 119,
    contentOnAcer: false,
    verificationClass: "OPERATOR_RELAYED_HASH_ONLY_NO_CONTENT_NO_PATH"
  }
});

const LIRIS_SUMMARY = Object.freeze({
  cumulativeArtifacts: 147,
  closeoutChainDepth: 119,
  chiefCouncilDissentWave: 146,
  allGates: "BLANK_HELD",
  wave26YzRelayed: false
});

const INPUTS = Object.freeze({
  wave26xState: "data/behcs/orchestration/federation-reintegration-20260427/wave26x-acer-24wave-batch-link119.v1.json",
  wave26xD50: "data/agent-index/council/D50-WAVE26X-ACER-24WAVE-BATCH-LINK119-2026-04-27.md"
});

const OUTPUTS = Object.freeze({
  aggregate: path.join(runRoot, "wave26y-z-closeout-acer.v1.json"),
  report: path.join(repoRoot, "reports", "federation-reintegration-wave26y-z-closeout-acer-latest.md"),
  reportJson: path.join(repoRoot, "reports", "federation-reintegration-wave26y-z-closeout-acer-latest.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "federation-reintegration-wave26y-z-closeout-acer.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "federation-reintegration-wave26y-z-closeout-acer-map.v1.json"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "federation-reintegration-wave26y-z-closeout-acer.glpj.json")
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
  return letter === "Y" ? 120 : 121;
}

function statePath(letter, linkNumber) {
  return path.join(runRoot, `wave26${letter.toLowerCase()}-acer-${phaseFor(letter)}-link${linkNumber}.v1.json`);
}

function d50Path(letter, linkNumber) {
  return path.join(councilRoot, `D50-WAVE26${letter}-ACER-${phaseFor(letter).toUpperCase()}-LINK${linkNumber}-2026-04-27.md`);
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
      verdict: letter === "Y"
        ? "RECORD_LATE_LIRIS_26A_26X_HASHES_WITHOUT_REWRITE"
        : "TERMINAL_CLOSEOUT_NO_LIRIS_26Z_HASH"
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
      verdict: "WAVE26_YZ_CLOSEOUT_NO_RULE_PROMOTION"
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
      verdict: "WAVE26_CAN_CLOSE_LOCALLY_UNDER_HOLD_WITH_UNRELAYED_LIRIS_YZ"
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
    ? "records late operator-relayed Liris 26A and 26X hashes without rewriting ACER 26A-X"
    : "closes ACER Wave 26 locally while Liris 26Y and 26Z remain unrelayed";
  return `Wave 26${letter} ACER ${phase} link ${linkNumber} ${clause}. This is ledger continuation only. No gate execution, no content transfer, no overwrite, no path fabrication, no schedule reconciliation, no vision disposition choice, no hash fabrication, no parent manifest modification, no Merkle recompute, no peer endpoint, no payload transfer, no Liris disk write by ACER, no MCP invocation, no exterior MCP, no model fanout, no device action, no emit, no ed25519, no key ceremony, no quorum outreach, no cosigner recruitment, no census admission, no PID mint, no quarantine lift, no rule ratification, no rule promotion, no federation promotion, no chain break, no false progress claim.`;
}

function buildD50(state) {
  const lines = [];
  lines.push(`# D50 Wave 26${state.wave.letter} - ACER ${state.wave.phase} Link ${state.closeoutChain.linkNumber}`);
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
  lines.push("- No unrelayed Liris Wave 26 hash or content is fabricated.");
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

function buildWaveState({ letter, prior, priorD50Status, priorStateStatus, priorStateHash, relayed, newlyRecorded }) {
  const linkNumber = linkFor(letter);
  const waveName = `26${letter}`;
  const phase = phaseFor(letter);
  const gateState = heldGatesFrom(prior);
  const latestRelayedSha256s = { ...relayed };
  for (const row of newlyRecorded) latestRelayedSha256s[row.wave] = row.sha256;
  const state = {
    schema: "federation-reintegration-wave26y-z-closeout-acer.wave.v1",
    runId,
    generatedAt,
    status: "DRAFT_ONLY_NOT_RATIFIED",
    relationship: `ACER_26${letter}_${phase.toUpperCase().replace(/-/g, "_")}_LINK${linkNumber}`,
    wave: {
      family: "Wave 26",
      letter,
      name: waveName,
      phase
    },
    priorAcer: {
      wave: prior.wave && prior.wave.name ? prior.wave.name : "26X",
      d50: priorD50Status,
      stateFile: priorStateStatus,
      stateHashInsideFile: priorStateHash,
      linkNumber: prior.closeoutChain ? prior.closeoutChain.linkNumber : null,
      noChainBreak: prior.closeoutChain ? Boolean(prior.closeoutChain.noChainBreak) : false
    },
    lirisRelay: {
      latestRelayedWaves: Object.keys(latestRelayedSha256s).sort(),
      latestRelayedSha256s,
      newlyRecordedLirisHashes: newlyRecorded,
      currentCounterpartWave: waveName,
      currentCounterpartHashRelayed: false,
      currentCounterpartContentOnAcer: false,
      unrelayedLirisWave26Closeout: ["26Y", "26Z"],
      verificationClass: "OPERATOR_RELAYED_HASH_ONLY_NO_CONTENT_NO_UNRELAYED_HASH_FABRICATION"
    },
    closeoutChain: {
      acerAddsLink: `Wave ${waveName}`,
      linkNumber,
      phase,
      recordsPriorAcerD50Sha256: priorD50Status.sha256,
      recordsPriorAcerStateSha256: priorStateStatus.sha256,
      recordsPriorAcerStateHash: priorStateHash,
      recordsLateLiris26A: latestRelayedSha256s["26A"] || null,
      recordsLateLiris26X: latestRelayedSha256s["26X"] || null,
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
  let prior = readJson(INPUTS.wave26xState);
  let priorD50Status = fileStatus(INPUTS.wave26xD50);
  let priorStateStatus = fileStatus(INPUTS.wave26xState);
  let priorStateHash = prior.stateHash || null;
  let relayed = prior.lirisRelay && prior.lirisRelay.latestRelayedSha256s ? { ...prior.lirisRelay.latestRelayedSha256s } : {};
  const emitted = [];

  for (const letter of LETTERS) {
    const newlyRecorded = letter === "Y" ? [LIRIS_WAVE26["26A"], LIRIS_WAVE26["26X"]] : [];
    const state = buildWaveState({ letter, prior, priorD50Status, priorStateStatus, priorStateHash, relayed, newlyRecorded });
    const stateFile = statePath(letter, state.closeoutChain.linkNumber);
    const d50File = d50Path(letter, state.closeoutChain.linkNumber);
    writeJson(stateFile, state);
    writeText(d50File, buildD50(state));
    const stateStatus = fileStatusAbs(stateFile);
    const d50Status = fileStatusAbs(d50File);
    emitted.push({
      wave: state.wave.name,
      letter,
      linkNumber: state.closeoutChain.linkNumber,
      phase: state.wave.phase,
      stateHash: state.stateHash,
      stateFile: stateStatus,
      d50: d50Status,
      newlyRecordedLirisHashes: newlyRecorded.map((row) => row.wave),
      allGatesHeld: state.aggregateVerdict.allGatesHeld,
      noChainBreak: state.closeoutChain.noChainBreak
    });
    for (const row of newlyRecorded) relayed = { ...relayed, [row.wave]: row.sha256 };
    prior = state;
    priorD50Status = d50Status;
    priorStateStatus = stateStatus;
    priorStateHash = state.stateHash;
  }

  const finalWave = emitted[emitted.length - 1];
  const aggregate = {
    schema: "federation-reintegration-wave26y-z-closeout-acer.v1",
    runId,
    generatedAt,
    status: "DRAFT_ONLY_NOT_RATIFIED",
    relationship: "ACER_WAVE26_Y_Z_LOCAL_CLOSEOUT",
    range: {
      from: "26Y",
      to: "26Z",
      waveCount: emitted.length,
      startLink: 120,
      finalLink: 121
    },
    operatorRelayedHashes: LIRIS_WAVE26,
    lirisSummary: LIRIS_SUMMARY,
    emitted,
    finalStateHash: finalWave.stateHash,
    gates: {
      allHeld: emitted.every((row) => row.allGatesHeld),
      executedAny: false
    },
    boundary: "Batch closed ACER Wave 26 Y-Z as append-only DRAFT_ONLY_NOT_RATIFIED ledger entries. Wave 26Y records late operator-relayed Liris 26A and 26X hashes by reference only; Wave 26Z closes ACER Wave 26 locally at link 121. Liris 26Y and 26Z hashes/content were not relayed or fabricated. No federation gate was executed, no payload transferred, no peer/MCP/device action invoked, no PID minted, no rule ratified, no promotion performed, and no parent Merkle surface recomputed."
  };
  aggregate.stateHash = sha256Text(JSON.stringify(aggregate));

  const artifacts = Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)]));
  writeJson(OUTPUTS.aggregate, aggregate);
  writeJson(OUTPUTS.reportJson, { ...aggregate, artifacts });
  writeJson(OUTPUTS.memory, {
    memoryId: "federation-reintegration-wave26y-z-closeout-acer.v1",
    generatedAt,
    status: aggregate.status,
    relationship: aggregate.relationship,
    significance: "ACER completed Wave 26 Y-Z locally while recording late Liris 26A/26X hash-only evidence.",
    stateHash: aggregate.stateHash,
    finalStateHash: aggregate.finalStateHash,
    artifacts,
    boundary: aggregate.boundary
  });
  writeJson(OUTPUTS.map, {
    mapId: "federation-reintegration-wave26y-z-closeout-acer-map.v1",
    generatedAt,
    nodes: [
      ...emitted.map((row) => ({ id: row.wave, kind: "acer_wave26_closeout_link", linkNumber: row.linkNumber, phase: row.phase, stateHash: row.stateHash })),
      ...Object.values(LIRIS_WAVE26).map((row) => ({ id: `liris-${row.wave}`, kind: "operator_relayed_hash_only", sha256: row.sha256, contentOnAcer: false }))
    ],
    edges: [{ from: "26Y", to: "26Z", relation: "records_prior_hash" }],
    boundary: aggregate.boundary
  });
  writeJson(OUTPUTS.glpj, {
    glpjId: "federation-reintegration-wave26y-z-closeout-acer.glpj",
    generatedAt,
    family: "federation",
    d11: "ACER_WAVE26_Y_Z_LOCAL_CLOSEOUT",
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
    "# Federation Reintegration Wave 26Y-Z ACER Closeout",
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
    "- Emitted ACER 26Y and 26Z closeout links.",
    "- Recorded late Liris 26A and 26X hashes by reference only.",
    "- Liris 26Y and 26Z hashes were not relayed and were not fabricated.",
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
    finalWave: finalWave.wave,
    finalLink: finalWave.linkNumber,
    aggregateStateHash: aggregate.stateHash,
    finalStateHash: finalWave.stateHash,
    artifacts
  }, null, 2));
}

main();
