#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const runId = "federation-reintegration-wave22g-liris-22f-mirror-intake-20260427";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427");

const INPUTS = Object.freeze({
  wave22fState: "data/behcs/orchestration/federation-reintegration-20260427/wave22f-full-gate-readiness-matrix.v1.json",
  wave22fD50: "data/agent-index/council/D50-WAVE22F-FULL-GATE-READINESS-MATRIX-ACER-2026-04-27.md"
});

const OUTPUTS = Object.freeze({
  state: path.join(runRoot, "wave22g-liris-22f-mirror-intake.v1.json"),
  d50: path.join(repoRoot, "data", "agent-index", "council", "D50-WAVE22G-LIRIS-22F-MIRROR-INTAKE-ACER-2026-04-27.md"),
  report: path.join(repoRoot, "reports", "federation-reintegration-wave22g-liris-22f-mirror-intake-latest.md"),
  reportJson: path.join(repoRoot, "reports", "federation-reintegration-wave22g-liris-22f-mirror-intake-latest.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "federation-reintegration-wave22g-liris-22f-mirror-intake.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "federation-reintegration-wave22g-liris-22f-mirror-intake-map.v1.json"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "federation-reintegration-wave22g-liris-22f-mirror-intake.glpj.json")
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
  const wave22f = readJson(INPUTS.wave22fState, {});
  const localWave22f = fileStatus(INPUTS.wave22fD50);

  const lirisWave22f = {
    path: "NOT_RELAYED_THIS_MESSAGE",
    lines: 98,
    sha256: "0fbe0aed4300be16cfe0407209902032c70d96900080f5e91cddf4e92c052cd2",
    status: "DRAFT_ONLY_NOT_RATIFIED",
    verificationClass: "OPERATOR_RELAYED_HASH_ONLY_NO_CONTENT",
    contentOnAcer: false,
    pathFabrication: false
  };

  const symmetricAggregate = {
    autonomousExecutionAvailable: false,
    nextMeaningfulInputClass: "operator gate value or actual T1 payload",
    allGatesHeld: true,
    saturationAcknowledged: true
  };

  const lirisVantageAdditions = [
    "L9 EBACMAP references Wave 22D archaeology supplement as Liris-only.",
    "G5 row records LX-rule chain dependency G4 -> G5 -> LX-383/LX-384/LX-385.",
    "G6 row notes ed25519 unlocks parent merkle recompute.",
    "G4 row records 23-wave dissent from Liris vantage; ACER counts differently."
  ];

  const supervisorCohort = [
    {
      level: "L0_BOUNDARY",
      prof: "PROF-HOOKWALL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HOOKWALL.BOUNDARY",
      verdict: "ALLOW_LIRIS_22F_HASH_INTAKE_ONLY"
    },
    {
      level: "L1_PACKET_SCHEMA",
      prof: "PROF-HERMES",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET.ACER",
      verdict: "RECORD_HASH_LINES_AND_PATH_NOT_RELAYED"
    },
    {
      level: "L2_COMMS",
      prof: "PROF-COMMS",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.COMMS.BILATERAL.ACER",
      verdict: "NO_CONTENT_TRANSFER_NO_PEER_CALL"
    },
    {
      level: "L3_KERNEL",
      prof: "PROF-KERNEL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.KERNEL.GRAMMAR.ACER",
      verdict: "DIVERGED_DRAFT_SIBLING_PAIR_RECORDED_NO_BYTE_EQUIVALENCE"
    },
    {
      level: "L4_EBACMAP",
      prof: "PROF-EBACMAP",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.EBACMAP.CASCADE.ACER",
      verdict: "LIRIS_VANTAGE_ADDITIONS_RECORDED_BY_REFERENCE"
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
      verdict: "BILATERAL_BLOCKED_GATE_VERDICT_CONVERGED"
    },
    {
      level: "L7_APEX",
      prof: "COL-ASOLARIA",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.ASOLARIA.APEX.ACER",
      verdict: "CONTINUE_ONLY_AS_LEDGER_UNTIL_GATE_VALUE_OR_PAYLOAD"
    }
  ];

  const state = {
    schema: "federation-reintegration-wave22g-liris-22f-mirror-intake.v1",
    runId,
    generatedAt,
    status: "DRAFT_ONLY_NOT_RATIFIED",
    relationship: "LIRIS_22F_MIRROR_INTAKE_BILATERAL_BLOCKED_GATE_CONVERGENCE",
    localAcerWave22f: {
      d50: localWave22f,
      stateHash: wave22f.stateHash || null,
      aggregateVerdict: wave22f.aggregateVerdict || null
    },
    lirisWave22f,
    symmetricAggregate,
    lirisCascadeState: {
      totalArtifacts: 25,
      composition: "19 Wave 21 + 22A + 22B + LX-384 + LX-385 + 22D + 22F",
      chiefCouncilDissent: "24-wave standing on Liris side",
      wave22DivergedDraftSiblingPairInstance: 4,
      boundaryFlagsPreserved: 25
    },
    lirisVantageAdditions,
    gateState: (wave22f.gateReadiness || []).map((gate) => ({
      id: gate.id,
      readiness: gate.readiness,
      valueStatus: "BLANK_HELD",
      executed: false,
      canProceedAutonomously: false
    })),
    supervisorCohort,
    aggregateVerdict: {
      autonomousExecutionAvailable: false,
      nextMeaningfulInputClass: "operator gate value or actual T1 payload",
      allGatesHeld: true,
      saturationAcknowledged: true,
      noFurtherAutonomousSubstantiveForwardMotion: true
    },
    boundary: "Wave 22G Liris 22F mirror intake only. No gate execution, no content transfer, no overwrite, no path fabrication, no schedule reconciliation, no vision disposition choice, no hash fabrication, no parent manifest modification, no Merkle recompute, no peer endpoint, no payload transfer, no Liris disk write by ACER, no MCP invocation, no exterior MCP, no model fanout, no device action, no emit, no ed25519, no key ceremony, no quorum outreach, no cosigner recruitment, no census admission, no PID mint, no quarantine lift, no rule ratification, no rule promotion, no federation promotion."
  };

  state.stateHash = sha256Text(JSON.stringify(state));
  return state;
}

function buildD50(state) {
  const lines = [];
  lines.push("# D50 Wave 22G - Liris 22F Mirror Intake (ACER)");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Status: ${state.status}`);
  lines.push(`Relationship: ${state.relationship}`);
  lines.push("");
  lines.push("## Liris 22F Reference");
  lines.push("");
  lines.push("| Field | Value |");
  lines.push("|-------|-------|");
  lines.push(`| path | ${state.lirisWave22f.path} |`);
  lines.push(`| lines | ${state.lirisWave22f.lines} |`);
  lines.push(`| sha256 | \`${state.lirisWave22f.sha256}\` |`);
  lines.push(`| verification_class | ${state.lirisWave22f.verificationClass} |`);
  lines.push(`| content_on_acer | ${state.lirisWave22f.contentOnAcer} |`);
  lines.push("");
  lines.push("## Symmetric Aggregate Verdict");
  lines.push("");
  for (const [key, value] of Object.entries(state.symmetricAggregate)) lines.push(`- ${key}: ${value}`);
  lines.push("");
  lines.push("## Liris Vantage Additions");
  lines.push("");
  for (const item of state.lirisVantageAdditions) lines.push(`- ${item}`);
  lines.push("");
  lines.push("## Gate State");
  lines.push("");
  for (const gate of state.gateState) lines.push(`- ${gate.id}: ${gate.valueStatus}, executed=${gate.executed}, readiness=${gate.readiness}`);
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
  lines.push("# Federation Reintegration Wave 22G Liris 22F Mirror Intake");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Status: ${state.status}`);
  lines.push(`State hash: ${state.stateHash}`);
  lines.push("");
  lines.push("## Result");
  lines.push("");
  lines.push("- ACER recorded the Liris 22F mirror hash and line count.");
  lines.push("- Path was not relayed and remains explicitly not fabricated.");
  lines.push("- Bilateral blocked-gate aggregate fields now converge by reference.");
  lines.push("- All seven gates remain held and unexecuted.");
  lines.push("");
  lines.push("## Boundary");
  lines.push("");
  lines.push(state.boundary);
  return lines.join("\n");
}

function buildMap(state) {
  return {
    mapId: "federation-reintegration-wave22g-liris-22f-mirror-intake-map.v1",
    generatedAt,
    nodes: [
      { id: "wave22g", kind: "liris_22f_mirror_intake", status: state.status },
      { id: "acer-wave22f", kind: "local_artifact", sha256: state.localAcerWave22f.d50.sha256 },
      { id: "liris-wave22f", kind: "operator_relay_hash", sha256: state.lirisWave22f.sha256 },
      ...state.gateState.map((gate) => ({ id: gate.id, kind: "gate", status: gate.valueStatus, readiness: gate.readiness })),
      ...state.supervisorCohort.map((row) => ({ id: row.supervisorPid, kind: "supervisor_pid", level: row.level, verdict: row.verdict }))
    ],
    edges: [
      { from: "wave22g", to: "acer-wave22f", relation: "pairs_with" },
      { from: "wave22g", to: "liris-wave22f", relation: "records_operator_relay" },
      ...state.gateState.map((gate) => ({ from: "wave22g", to: gate.id, relation: "preserves_hold" })),
      ...state.supervisorCohort.map((row) => ({ from: "wave22g", to: row.supervisorPid, relation: "gated_by" }))
    ],
    boundary: state.boundary
  };
}

function buildGlpj(state) {
  return {
    glpjId: "federation-reintegration-wave22g-liris-22f-mirror-intake.glpj",
    generatedAt,
    family: "federation",
    d11: "LIRIS_22F_MIRROR_HASH_INTAKE_ONLY",
    glyphs: state.supervisorCohort.map((row, index) => ({
      token: `FED-WAVE22G-L${index}`,
      level: row.level,
      prof: row.prof,
      supervisorPid: row.supervisorPid,
      verdict: row.verdict
    })),
    gateState: state.gateState,
    outputs: [{ wave: "22G", path: repoRel(OUTPUTS.d50), class: "Liris 22F mirror intake" }],
    boundary: state.boundary
  };
}

function main() {
  const state = buildState();
  const artifacts = Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)]));
  const memory = {
    memoryId: "federation-reintegration-wave22g-liris-22f-mirror-intake.v1",
    generatedAt,
    status: state.status,
    relationship: state.relationship,
    significance: "ACER recorded Liris Wave 22F mirror hash and bilateral blocked-gate convergence, without path/content fabrication or gate execution.",
    stateHash: state.stateHash,
    artifacts,
    boundary: state.boundary
  };

  writeJson(OUTPUTS.state, state);
  writeText(OUTPUTS.d50, buildD50(state));
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
    artifacts
  }, null, 2));
}

main();
