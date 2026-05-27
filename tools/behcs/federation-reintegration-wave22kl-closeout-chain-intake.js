#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const runId = "federation-reintegration-wave22kl-closeout-chain-intake-20260427";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427");

const INPUTS = Object.freeze({
  wave22HijState: "data/behcs/orchestration/federation-reintegration-20260427/wave22hij-liris-executor-output-intake.v1.json",
  wave22h: "data/agent-index/council/D50-WAVE22H-LIRIS-MANIFEST-EXTENSION-INTAKE-ACER-2026-04-27.md",
  wave22i: "data/agent-index/council/D50-WAVE22I-LIRIS-MASTER-STATUS-SNAPSHOT-INTAKE-ACER-2026-04-27.md",
  wave22j: "data/agent-index/council/D50-WAVE22J-LIRIS-SELF-HASH-CLOSEOUT-INTAKE-ACER-2026-04-27.md",
  localLiris22k: "data/agent-index/council/D50-WAVE22K-CLOSEOUT-CHAIN-EXTENSION-LIRIS-2026-04-27.md"
});

const OUTPUTS = Object.freeze({
  state: path.join(runRoot, "wave22kl-closeout-chain-intake.v1.json"),
  wave22k: path.join(repoRoot, "data", "agent-index", "council", "D50-WAVE22K-LIRIS-CLOSEOUT-CHAIN-EXTENSION-INTAKE-ACER-2026-04-27.md"),
  wave22l: path.join(repoRoot, "data", "agent-index", "council", "D50-WAVE22L-ACER-CLOSEOUT-CHAIN-LINK-2026-04-27.md"),
  report: path.join(repoRoot, "reports", "federation-reintegration-wave22kl-closeout-chain-intake-latest.md"),
  reportJson: path.join(repoRoot, "reports", "federation-reintegration-wave22kl-closeout-chain-intake-latest.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "federation-reintegration-wave22kl-closeout-chain-intake.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "federation-reintegration-wave22kl-closeout-chain-intake-map.v1.json"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "federation-reintegration-wave22kl-closeout-chain-intake.glpj.json")
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

function readJson(relativePath, fallback = null) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(absolutePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  } catch (_error) {
    return fallback;
  }
}

function buildState() {
  const hij = readJson(INPUTS.wave22HijState, {});
  const acerIntakeArtifacts = {
    wave22h: fileStatus(INPUTS.wave22h),
    wave22i: fileStatus(INPUTS.wave22i),
    wave22j: fileStatus(INPUTS.wave22j)
  };
  const liris22k = {
    path: "data/agent-index/council/D50-WAVE22K-CLOSEOUT-CHAIN-EXTENSION-LIRIS-2026-04-27.md",
    lines: 104,
    sha256: "0b2c7d13202cf420f077650ce8efba267e7ccca4f9f14bd6364d05256077c7ba",
    status: "DRAFT_ONLY_NOT_RATIFIED",
    verificationClass: "OPERATOR_RELAYED_HASH_ONLY_NO_CONTENT",
    contentOnAcer: fileStatus(INPUTS.localLiris22k).present,
    localProbe: fileStatus(INPUTS.localLiris22k)
  };

  const closeoutChain = {
    lirisReportedLinks: [
      { link: "Wave 21V", role: "Wave 21 manifest self-hash closeout" },
      { link: "Wave 22J", role: "Wave 22H manifest extension self-hash closeout", sha256: "6f68ea82464a0f296e61d38dbea48d4a7afdf5982a66c01ad8e0ed13a15be55a" },
      { link: "Wave 22K", role: "Close-out chain extension", sha256: liris22k.sha256 }
    ],
    acerAddsLink: "Wave 22L",
    acerLinkRole: "ACER close-out link for H/I/J intake state hash and Liris 22K reference",
    indefiniteExtensionWarning: true,
    noChainBreak: true
  };

  const supervisorCohort = [
    {
      level: "L0_BOUNDARY",
      prof: "PROF-HOOKWALL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HOOKWALL.BOUNDARY",
      verdict: "ALLOW_CLOSEOUT_CHAIN_INTAKE_AND_LOCAL_LINK_ONLY"
    },
    {
      level: "L1_PACKET_SCHEMA",
      prof: "PROF-HERMES",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET.ACER",
      verdict: "RECORD_LIRIS_22K_HASH_AND_ACER_LINK_STATE_HASH"
    },
    {
      level: "L2_EBACMAP",
      prof: "PROF-EBACMAP",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.EBACMAP.CASCADE.ACER",
      verdict: "CLOSEOUT_CHAIN_IS_APPEND_ONLY_AND_VERIFIER_WALKABLE"
    },
    {
      level: "L3_EXECUTOR",
      prof: "PROF-EXECUTOR",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.EXECUTOR.WAVE.ACER",
      verdict: "SELF_HASH_LINK_IS_LEDGER_EXECUTOR_NOT_GATE_EXECUTION"
    },
    {
      level: "L4_COUNCIL",
      prof: "PROF-CHIEFCOUNCIL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.D50.COUNCIL.ACER",
      verdict: "DISSENT_PRESERVED_NO_RATIFICATION"
    },
    {
      level: "L5_CONVERGENCE",
      prof: "PROF-CONVERGENCE",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.CONVERGENCE.WAVE.ACER",
      verdict: "CHAIN_CAN_EXTEND_INDEFINITELY_WITHOUT_GATE_CROSSING"
    },
    {
      level: "L6_COMMS",
      prof: "PROF-COMMS",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.COMMS.BILATERAL.ACER",
      verdict: "NO_CONTENT_TRANSFER_NO_PEER_CALL_NO_HASH_FABRICATION"
    },
    {
      level: "L7_APEX",
      prof: "COL-ASOLARIA",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.ASOLARIA.APEX.ACER",
      verdict: "CONTINUE_ONLY_AS_LEDGER_UNTIL_GATE_VALUE_OR_PAYLOAD"
    }
  ];

  const state = {
    schema: "federation-reintegration-wave22kl-closeout-chain-intake.v1",
    runId,
    generatedAt,
    status: "DRAFT_ONLY_NOT_RATIFIED",
    relationship: "LIRIS_22K_CLOSEOUT_CHAIN_INTAKE_AND_ACER_22L_LINK",
    priorAcerHij: {
      stateHash: hij.stateHash || null,
      intakeArtifacts: acerIntakeArtifacts
    },
    liris22k,
    closeoutChain,
    lirisCascadeState: {
      totalArtifacts: 30,
      cumulativeLinesApprox: 2780,
      chiefCouncilDissent: "29-wave standing",
      updatedAfterLiris22L: "NOT_RELAYED_THIS_MESSAGE"
    },
    gateState: (hij.gateState || []).map((gate) => ({
      id: gate.id,
      readiness: gate.readiness,
      valueStatus: gate.valueStatus || "BLANK_HELD",
      executed: false,
      canProceedAutonomously: false
    })),
    supervisorCohort,
    aggregateVerdict: {
      autonomousGateExecutionAvailable: false,
      closeoutChainCanExtendAutonomously: true,
      gateExecutionByThisWave: false,
      nextMeaningfulInputClass: "operator gate value or actual T1 payload",
      allGatesHeld: true
    },
    boundary: "Wave 22K/L closeout-chain intake/link only. No gate execution, no content transfer, no overwrite, no path fabrication, no schedule reconciliation, no vision disposition choice, no hash fabrication, no parent manifest modification, no Merkle recompute, no peer endpoint, no payload transfer, no Liris disk write by ACER, no MCP invocation, no exterior MCP, no model fanout, no device action, no emit, no ed25519, no key ceremony, no quorum outreach, no cosigner recruitment, no census admission, no PID mint, no quarantine lift, no rule ratification, no rule promotion, no federation promotion, no chain break."
  };

  state.stateHash = sha256Text(JSON.stringify(state));
  return state;
}

function buildWave22K(state) {
  const lines = [];
  lines.push("# D50 Wave 22K - Liris Close-out Chain Extension Intake (ACER)");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Status: ${state.status}`);
  lines.push(`Relationship: ${state.relationship}`);
  lines.push("");
  lines.push("## Liris 22K Reference");
  lines.push("");
  lines.push("| Field | Value |");
  lines.push("|-------|-------|");
  lines.push(`| path | \`${state.liris22k.path}\` |`);
  lines.push(`| lines | ${state.liris22k.lines} |`);
  lines.push(`| sha256 | \`${state.liris22k.sha256}\` |`);
  lines.push(`| content_on_acer | ${state.liris22k.contentOnAcer} |`);
  lines.push(`| verification_class | ${state.liris22k.verificationClass} |`);
  lines.push("");
  lines.push("## Close-out Chain");
  lines.push("");
  for (const link of state.closeoutChain.lirisReportedLinks) lines.push(`- ${link.link}: ${link.role}${link.sha256 ? `, sha256 ${link.sha256}` : ""}.`);
  lines.push("");
  lines.push("## Boundary");
  lines.push("");
  lines.push(state.boundary);
  return lines.join("\n");
}

function buildWave22L(state) {
  const lines = [];
  lines.push("# D50 Wave 22L - ACER Close-out Chain Link");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Status: ${state.status}`);
  lines.push(`Relationship: ${state.relationship}`);
  lines.push("");
  lines.push("## ACER Link");
  lines.push("");
  lines.push(`- Prior ACER H/I/J state hash: \`${state.priorAcerHij.stateHash}\`.`);
  lines.push(`- Liris 22K sha256 reference: \`${state.liris22k.sha256}\`.`);
  lines.push("- This is an ACER-local close-out link, not byte-equivalence with Liris 22L.");
  lines.push("- The chain can extend indefinitely without crossing a gate.");
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
  const lines = [];
  lines.push("# Federation Reintegration Wave 22K/L Close-out Chain Intake");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Status: ${state.status}`);
  lines.push(`State hash: ${state.stateHash}`);
  lines.push("");
  lines.push("## Result");
  lines.push("");
  lines.push("- ACER recorded Liris 22K close-out chain extension by reference.");
  lines.push("- ACER emitted a local 22L close-out chain link for its own H/I/J intake state.");
  lines.push("- No gate was executed; all seven gates remain held.");
  lines.push("- The indefinite close-out-chain warning is preserved.");
  lines.push("");
  lines.push("## Boundary");
  lines.push("");
  lines.push(state.boundary);
  return lines.join("\n");
}

function buildMap(state) {
  return {
    mapId: "federation-reintegration-wave22kl-closeout-chain-intake-map.v1",
    generatedAt,
    nodes: [
      { id: "wave22kl", kind: "closeout_chain_intake", status: state.status },
      { id: "liris-wave22k", kind: "operator_relay_hash", sha256: state.liris22k.sha256 },
      { id: "acer-wave22l", kind: "local_closeout_link", stateHash: state.stateHash },
      ...state.gateState.map((gate) => ({ id: gate.id, kind: "gate", status: gate.valueStatus, executed: gate.executed })),
      ...state.supervisorCohort.map((row) => ({ id: row.supervisorPid, kind: "supervisor_pid", level: row.level, verdict: row.verdict }))
    ],
    edges: [
      { from: "wave22kl", to: "liris-wave22k", relation: "records_operator_relay" },
      { from: "wave22kl", to: "acer-wave22l", relation: "emits_local_link" },
      ...state.gateState.map((gate) => ({ from: "wave22kl", to: gate.id, relation: "preserves_hold" })),
      ...state.supervisorCohort.map((row) => ({ from: "wave22kl", to: row.supervisorPid, relation: "gated_by" }))
    ],
    boundary: state.boundary
  };
}

function buildGlpj(state) {
  return {
    glpjId: "federation-reintegration-wave22kl-closeout-chain-intake.glpj",
    generatedAt,
    family: "federation",
    d11: "CLOSEOUT_CHAIN_INTAKE_AND_LOCAL_LINK_ONLY",
    glyphs: state.supervisorCohort.map((row, index) => ({
      token: `FED-WAVE22KL-L${index}`,
      level: row.level,
      prof: row.prof,
      supervisorPid: row.supervisorPid,
      verdict: row.verdict
    })),
    closeoutChain: state.closeoutChain,
    outputs: [
      { wave: "22K", path: repoRel(OUTPUTS.wave22k), class: "Liris close-out chain intake" },
      { wave: "22L", path: repoRel(OUTPUTS.wave22l), class: "ACER close-out chain link" }
    ],
    boundary: state.boundary
  };
}

function main() {
  const state = buildState();
  const artifacts = Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)]));
  const memory = {
    memoryId: "federation-reintegration-wave22kl-closeout-chain-intake.v1",
    generatedAt,
    status: state.status,
    relationship: state.relationship,
    significance: "ACER recorded Liris Wave 22K close-out chain extension and emitted an ACER-local Wave 22L close-out link, without gate execution.",
    stateHash: state.stateHash,
    artifacts,
    boundary: state.boundary
  };

  writeJson(OUTPUTS.state, state);
  writeText(OUTPUTS.wave22k, buildWave22K(state));
  writeText(OUTPUTS.wave22l, buildWave22L(state));
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
    outputs: {
      wave22k: repoRel(OUTPUTS.wave22k),
      wave22l: repoRel(OUTPUTS.wave22l),
      state: repoRel(OUTPUTS.state),
      report: repoRel(OUTPUTS.report)
    }
  }, null, 2));
}

main();
