#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const runId = "federation-reintegration-wave23e-liris23de-intake-acer-link23-20260427";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427");

const INPUTS = Object.freeze({
  wave23dState: "data/behcs/orchestration/federation-reintegration-20260427/wave23d-acer-closeout-link22.v1.json",
  wave23dD50: "data/agent-index/council/D50-WAVE23D-ACER-CLOSEOUT-CHAIN-LINK22-2026-04-27.md"
});

const LIRIS_RELAYS = Object.freeze([
  {
    wave: "23D",
    path: "data/agent-index/council/D50-WAVE23D-CLOSEOUT-CHAIN-EXTENSION-LIRIS-2026-04-27.md",
    lines: 34,
    sha256: "8e85326a0757f9b17e5b1b6a192fca67e415174426b924bcfa20e319f96626be",
    linkNumber: 21,
    totalArtifacts: 49,
    chiefCouncilDissent: "48-wave standing"
  },
  {
    wave: "23E",
    path: "data/agent-index/council/D50-WAVE23E-CLOSEOUT-CHAIN-EXTENSION-LIRIS-2026-04-27.md",
    lines: 34,
    sha256: "033896c29db8053c3ec73285bbfe73e6de3b5514a24addaba119758601dccb17",
    linkNumber: 22,
    totalArtifacts: 50,
    chiefCouncilDissent: "49-wave standing"
  }
]);

const OUTPUTS = Object.freeze({
  state: path.join(runRoot, "wave23e-liris23de-intake-acer-link23.v1.json"),
  d50: path.join(repoRoot, "data", "agent-index", "council", "D50-WAVE23E-LIRIS23DE-INTAKE-ACER-LINK23-2026-04-27.md"),
  report: path.join(repoRoot, "reports", "federation-reintegration-wave23e-liris23de-intake-acer-link23-latest.md"),
  reportJson: path.join(repoRoot, "reports", "federation-reintegration-wave23e-liris23de-intake-acer-link23-latest.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "federation-reintegration-wave23e-liris23de-intake-acer-link23.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "federation-reintegration-wave23e-liris23de-intake-acer-link23-map.v1.json"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "federation-reintegration-wave23e-liris23de-intake-acer-link23.glpj.json")
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

function relayStatus(relay) {
  return {
    ...relay,
    status: "DRAFT_ONLY_NOT_RATIFIED",
    verificationClass: "OPERATOR_RELAYED_HASH_ONLY_NO_CONTENT",
    contentOnAcer: fileStatus(relay.path).present,
    localProbe: fileStatus(relay.path)
  };
}

function supervisorCohort() {
  return [
    {
      level: "L0_BOUNDARY",
      prof: "PROF-HOOKWALL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HOOKWALL.BOUNDARY",
      verdict: "ALLOW_LIRIS_23D_23E_HASH_INTAKE_AND_ACER_LINK23_LEDGER_ONLY"
    },
    {
      level: "L1_PACKET_SCHEMA",
      prof: "PROF-HERMES",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET.ACER",
      verdict: "RECORD_LIRIS_23D_23E_HASHES_WITH_NO_CONTENT_FABRICATION"
    },
    {
      level: "L2_EBACMAP",
      prof: "PROF-EBACMAP",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.EBACMAP.CASCADE.ACER",
      verdict: "ACER_LINK23_APPEND_ONLY_NO_CHAIN_BREAK"
    },
    {
      level: "L3_KERNEL",
      prof: "PROF-KERNEL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.KERNEL.GRAMMAR.ACER",
      verdict: "LIRIS_23D_GAP_RESOLVED_BY_OPERATOR_RELAY_AND_23E_RECORDED"
    },
    {
      level: "L4_EXECUTOR",
      prof: "PROF-EXECUTOR",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.EXECUTOR.WAVE.ACER",
      verdict: "LINK23_IS_LEDGER_EXECUTOR_NOT_FEDERATION_EXECUTION"
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
  const prior = readJson(INPUTS.wave23dState);
  const priorStateFile = fileStatus(INPUTS.wave23dState);
  const priorD50 = fileStatus(INPUTS.wave23dD50);
  const lirisRelays = LIRIS_RELAYS.map(relayStatus);
  const gateState = (prior.gateState || []).map((gate) => ({
    id: gate.id,
    readiness: gate.readiness,
    valueStatus: gate.valueStatus || "BLANK_HELD",
    executed: false,
    canProceedAutonomously: false
  }));

  const state = {
    schema: "federation-reintegration-wave23e-liris23de-intake-acer-link23.v1",
    runId,
    generatedAt,
    status: "DRAFT_ONLY_NOT_RATIFIED",
    relationship: "LIRIS_23D_23E_HASH_INTAKE_AND_ACER_LINK23",
    priorAcer: {
      wave: "23D",
      d50: priorD50,
      stateFile: priorStateFile,
      stateHashInsideFile: prior.stateHash || null,
      linkNumber: prior.closeoutChain ? prior.closeoutChain.linkNumber : null,
      noChainBreak: prior.closeoutChain ? Boolean(prior.closeoutChain.noChainBreak) : false
    },
    lirisRelays,
    lirisRelayGaps: {
      priorAcerRecordedLiris23DHashRelayed: Boolean(prior.lirisRelay && prior.lirisRelay.liris23DHashRelayed),
      liris23DGapResolvedByThisWave: true,
      liris23EHashRelayed: true,
      repairAttempted: false,
      hashFabricated: false
    },
    bilateralDivergence: {
      relayedWaves: ["23D", "23E"],
      relation: "DIVERGED_DRAFT_SIBLINGS_HASH_ONLY",
      contentTransferred: false,
      byteEquivalentClaimed: false,
      hashFabricated: false
    },
    closeoutChain: {
      acerAddsLink: "Wave 23E",
      linkNumber: 23,
      recordsPriorAcer23DD50Sha256: priorD50.sha256,
      recordsPriorAcer23DStateSha256: priorStateFile.sha256,
      recordsPriorAcer23DStateHash: prior.stateHash || null,
      recordsLirisRelayWaves: lirisRelays.map((relay) => ({
        wave: relay.wave,
        lines: relay.lines,
        sha256: relay.sha256,
        linkNumber: relay.linkNumber
      })),
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
    boundary: "Wave 23E ACER Liris 23D/23E hash intake and close-out link 23 only. Records operator-relayed Liris hashes; no content transfer and no hash fabrication. No gate execution, no overwrite, no path fabrication, no schedule reconciliation, no vision disposition choice, no parent manifest modification, no Merkle recompute, no peer endpoint, no payload transfer, no Liris disk write by ACER, no MCP invocation, no exterior MCP, no model fanout, no device action, no emit, no ed25519, no key ceremony, no quorum outreach, no cosigner recruitment, no census admission, no PID mint, no quarantine lift, no rule ratification, no rule promotion, no federation promotion, no chain break, no false progress claim."
  };
  state.stateHash = sha256Text(JSON.stringify(state));
  return state;
}

function buildD50(state) {
  const lines = [];
  lines.push("# D50 Wave 23E - Liris 23D/23E Intake + ACER Link 23");
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
  for (const relay of state.lirisRelays) {
    lines.push(`- Liris ${relay.wave}: \`${relay.path}\`, ${relay.lines} lines, sha256 \`${relay.sha256}\`, link ${relay.linkNumber}, artifacts ${relay.totalArtifacts}, CHIEFCOUNCIL dissent ${relay.chiefCouncilDissent}, contentOnAcer=${relay.contentOnAcer}.`);
  }
  lines.push(`- Liris 23D gap resolved by this wave: ${state.lirisRelayGaps.liris23DGapResolvedByThisWave}.`);
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
    memoryId: "federation-reintegration-wave23e-liris23de-intake-acer-link23.v1",
    generatedAt,
    status: state.status,
    relationship: state.relationship,
    significance: "ACER recorded Liris Waves 23D and 23E by hash only and extended Wave 23 locally to link 23.",
    stateHash: state.stateHash,
    artifacts,
    boundary: state.boundary
  });
  writeJson(OUTPUTS.map, {
    mapId: "federation-reintegration-wave23e-liris23de-intake-acer-link23-map.v1",
    generatedAt,
    nodes: [
      { id: "23D-acer", kind: "acer_prior", stateHash: state.priorAcer.stateHashInsideFile },
      { id: "23E-acer", kind: "acer_liris23de_intake", stateHash: state.stateHash },
      ...state.lirisRelays.map((relay) => ({ id: `liris-${relay.wave}`, kind: "operator_relay_hash", sha256: relay.sha256, contentOnAcer: relay.contentOnAcer })),
      ...state.gateState.map((gate) => ({ id: gate.id, kind: "gate", status: gate.valueStatus, executed: gate.executed }))
    ],
    edges: [
      { from: "23D-acer", to: "23E-acer", relation: "records_prior_hash" },
      ...state.lirisRelays.map((relay) => ({ from: "23E-acer", to: `liris-${relay.wave}`, relation: "records_operator_relay" })),
      ...state.gateState.map((gate) => ({ from: "23E-acer", to: gate.id, relation: "preserves_hold" }))
    ],
    boundary: state.boundary
  });
  writeJson(OUTPUTS.glpj, {
    glpjId: "federation-reintegration-wave23e-liris23de-intake-acer-link23.glpj",
    generatedAt,
    family: "federation",
    d11: "LIRIS_23D_23E_HASH_INTAKE_AND_ACER_LINK23",
    glyphs: state.supervisorCohort.map((row, index) => ({
      token: `FED-WAVE23E-L${index}`,
      level: row.level,
      prof: row.prof,
      supervisorPid: row.supervisorPid,
      verdict: row.verdict
    })),
    lirisRelays: state.lirisRelays.map((relay) => ({
      wave: relay.wave,
      sha256: relay.sha256,
      contentOnAcer: relay.contentOnAcer
    })),
    closeoutChain: state.closeoutChain,
    boundary: state.boundary
  });
  writeText(OUTPUTS.report, [
    "# Federation Reintegration Wave 23E Liris 23D/23E Intake + ACER Link 23",
    "",
    `Generated: ${generatedAt}`,
    `Status: ${state.status}`,
    `State hash: ${state.stateHash}`,
    "",
    "## Result",
    "",
    "- ACER recorded Liris 23D and 23E by operator-relayed hashes only.",
    "- ACER emitted Wave 23E local close-out link 23.",
    "- Liris 23D gap from prior ACER state is resolved by relay, not by fabrication.",
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
    lirisRelays: state.lirisRelays.map((relay) => ({
      wave: relay.wave,
      sha256: relay.sha256,
      contentOnAcer: relay.contentOnAcer
    })),
    artifacts
  }, null, 2));
}

main();
