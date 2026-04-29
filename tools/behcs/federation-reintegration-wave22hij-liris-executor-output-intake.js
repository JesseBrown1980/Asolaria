#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const runId = "federation-reintegration-wave22hij-liris-executor-output-intake-20260427";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427");

const INPUTS = Object.freeze({
  wave22gState: "data/behcs/orchestration/federation-reintegration-20260427/wave22g-liris-22f-mirror-intake.v1.json",
  wave22gD50: "data/agent-index/council/D50-WAVE22G-LIRIS-22F-MIRROR-INTAKE-ACER-2026-04-27.md",
  localLiris22h: "data/agent-index/D50-CORPUS-MANIFEST-EXTENSION-WAVE22-LIRIS-2026-04-27.json",
  localLiris22i: "data/agent-index/council/D50-WAVE22I-MASTER-STATUS-SNAPSHOT-LIRIS-2026-04-27.md",
  localLiris22j: "data/agent-index/council/D50-WAVE22J-MANIFEST-EXTENSION-SELF-HASH-LIRIS-2026-04-27.md"
});

const OUTPUTS = Object.freeze({
  state: path.join(runRoot, "wave22hij-liris-executor-output-intake.v1.json"),
  wave22h: path.join(repoRoot, "data", "agent-index", "council", "D50-WAVE22H-LIRIS-MANIFEST-EXTENSION-INTAKE-ACER-2026-04-27.md"),
  wave22i: path.join(repoRoot, "data", "agent-index", "council", "D50-WAVE22I-LIRIS-MASTER-STATUS-SNAPSHOT-INTAKE-ACER-2026-04-27.md"),
  wave22j: path.join(repoRoot, "data", "agent-index", "council", "D50-WAVE22J-LIRIS-SELF-HASH-CLOSEOUT-INTAKE-ACER-2026-04-27.md"),
  report: path.join(repoRoot, "reports", "federation-reintegration-wave22hij-liris-executor-output-intake-latest.md"),
  reportJson: path.join(repoRoot, "reports", "federation-reintegration-wave22hij-liris-executor-output-intake-latest.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "federation-reintegration-wave22hij-liris-executor-output-intake.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "federation-reintegration-wave22hij-liris-executor-output-intake-map.v1.json"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "federation-reintegration-wave22hij-liris-executor-output-intake.glpj.json")
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
  const wave22g = readJson(INPUTS.wave22gState, {});
  const lirisOutputs = [
    {
      wave: "22H",
      kind: "manifest_extension",
      lirisPath: "data/agent-index/D50-CORPUS-MANIFEST-EXTENSION-WAVE22-LIRIS-2026-04-27.json",
      localProbePath: INPUTS.localLiris22h,
      lines: 209,
      sha256: "3731b98da2f74d5d9f28ad46a6a78b4f2605ee966b936b9826ad401b2e376da1",
      status: "DRAFT_ONLY_NOT_RATIFIED",
      intakePath: repoRel(OUTPUTS.wave22h),
      executorClass: "MANIFEST_EXECUTOR"
    },
    {
      wave: "22I",
      kind: "master_status_snapshot",
      lirisPath: "data/agent-index/council/D50-WAVE22I-MASTER-STATUS-SNAPSHOT-LIRIS-2026-04-27.md",
      localProbePath: INPUTS.localLiris22i,
      lines: 132,
      sha256: "30de24bafc6a4639ccff8229a55c63ff438ca456c2d9981531ce71a9d9249d9f",
      status: "DRAFT_ONLY_NOT_RATIFIED",
      intakePath: repoRel(OUTPUTS.wave22i),
      executorClass: "STATUS_SNAPSHOT_EXECUTOR"
    },
    {
      wave: "22J",
      kind: "self_hash_closeout",
      lirisPath: "data/agent-index/council/D50-WAVE22J-MANIFEST-EXTENSION-SELF-HASH-LIRIS-2026-04-27.md",
      localProbePath: INPUTS.localLiris22j,
      lines: 71,
      sha256: "6f68ea82464a0f296e61d38dbea48d4a7afdf5982a66c01ad8e0ed13a15be55a",
      status: "DRAFT_ONLY_NOT_RATIFIED",
      intakePath: repoRel(OUTPUTS.wave22j),
      executorClass: "SELF_HASH_CLOSEOUT_EXECUTOR"
    }
  ].map((item) => ({
    ...item,
    contentOnAcer: fileStatus(item.localProbePath).present,
    localProbe: fileStatus(item.localProbePath),
    verificationClass: "OPERATOR_RELAYED_HASH_ONLY_NO_CONTENT"
  }));

  const supervisorExecutorCohort = [
    {
      level: "L0_BOUNDARY",
      prof: "PROF-HOOKWALL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HOOKWALL.BOUNDARY",
      verdict: "ALLOW_EXECUTOR_OUTPUT_INTAKE_ONLY"
    },
    {
      level: "L1_PACKET_SCHEMA",
      prof: "PROF-HERMES",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET.ACER",
      verdict: "RECORD_PATH_LINES_HASH_EXECUTOR_CLASS_CONTENT_ABSENCE"
    },
    {
      level: "L2_EXECUTOR",
      prof: "PROF-EXECUTOR",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.EXECUTOR.WAVE.ACER",
      verdict: "EXECUTOR_CLASS_MEANS_LEDGER_OUTPUT_NOT_GATE_EXECUTION"
    },
    {
      level: "L3_EBACMAP",
      prof: "PROF-EBACMAP",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.EBACMAP.CASCADE.ACER",
      verdict: "MANIFEST_STATUS_SELF_HASH_CHAIN_RECORDED_BY_REFERENCE"
    },
    {
      level: "L4_CONVERGENCE",
      prof: "PROF-CONVERGENCE",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.CONVERGENCE.WAVE.ACER",
      verdict: "WAVE22_HIJ_FORM_A_LEDGER_EXTENSION_NOT_GATE_CROSSING"
    },
    {
      level: "L5_COUNCIL",
      prof: "PROF-CHIEFCOUNCIL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.D50.COUNCIL.ACER",
      verdict: "DISSENT_PRESERVED_NO_RATIFICATION"
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
      verdict: "CONTINUE_LEDGER_WAVES_ONLY_UNTIL_GATE_VALUE_OR_PAYLOAD"
    }
  ];

  const state = {
    schema: "federation-reintegration-wave22hij-liris-executor-output-intake.v1",
    runId,
    generatedAt,
    status: "DRAFT_ONLY_NOT_RATIFIED",
    relationship: "LIRIS_22H_22I_22J_EXECUTOR_OUTPUTS_INTAKE_BY_REFERENCE",
    priorAcerWave22g: {
      d50: fileStatus(INPUTS.wave22gD50),
      stateHash: wave22g.stateHash || null,
      aggregateVerdict: wave22g.aggregateVerdict || null
    },
    lirisExecutorOutputs: lirisOutputs,
    lirisCascadeState: {
      priorRelayedTotalArtifacts: 25,
      minimumAfter22Hij: 28,
      updatedChiefCouncilDissent: "NOT_RELAYED_THIS_MESSAGE",
      wave22LettersIntaken: ["22H", "22I", "22J"]
    },
    gateState: (wave22g.gateState || []).map((gate) => ({
      id: gate.id,
      readiness: gate.readiness,
      valueStatus: gate.valueStatus || "BLANK_HELD",
      executed: false,
      canProceedAutonomously: false
    })),
    supervisorExecutorCohort,
    aggregateVerdict: {
      autonomousExecutionAvailable: false,
      executorOutputsRecorded: true,
      gateExecutionByExecutorOutputs: false,
      nextMeaningfulInputClass: "operator gate value or actual T1 payload",
      allGatesHeld: true,
      saturationAcknowledged: true
    },
    boundary: "Wave 22H/I/J executor-output intake only. No gate execution, no content transfer, no overwrite, no path fabrication, no schedule reconciliation, no vision disposition choice, no hash fabrication, no parent manifest modification, no Merkle recompute, no peer endpoint, no payload transfer, no Liris disk write by ACER, no MCP invocation, no exterior MCP, no model fanout, no device action, no emit, no ed25519, no key ceremony, no quorum outreach, no cosigner recruitment, no census admission, no PID mint, no quarantine lift, no rule ratification, no rule promotion, no federation promotion."
  };

  state.stateHash = sha256Text(JSON.stringify(state));
  return state;
}

function buildWaveDoc(state, wave) {
  const item = state.lirisExecutorOutputs.find((entry) => entry.wave === wave);
  const lines = [];
  lines.push(`# D50 Wave ${wave} - Liris ${item.kind} Intake (ACER)`);
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Status: ${state.status}`);
  lines.push(`Relationship: ${state.relationship}`);
  lines.push("");
  lines.push("## Liris Reference");
  lines.push("");
  lines.push("| Field | Value |");
  lines.push("|-------|-------|");
  lines.push(`| liris_path | \`${item.lirisPath}\` |`);
  lines.push(`| lines | ${item.lines} |`);
  lines.push(`| sha256 | \`${item.sha256}\` |`);
  lines.push(`| executor_class | ${item.executorClass} |`);
  lines.push(`| content_on_acer | ${item.contentOnAcer} |`);
  lines.push(`| verification_class | ${item.verificationClass} |`);
  lines.push("");
  lines.push("## Executor Interpretation");
  lines.push("");
  lines.push("- Executor-class here means the Liris side emitted ledger artifacts.");
  lines.push("- ACER records existence, hash, and lineage by reference only.");
  lines.push("- This intake does not execute any federation gate.");
  lines.push("");
  lines.push("## Gate State");
  lines.push("");
  for (const gate of state.gateState) lines.push(`- ${gate.id}: ${gate.valueStatus}, executed=${gate.executed}`);
  lines.push("");
  lines.push("## Boundary");
  lines.push("");
  lines.push(state.boundary);
  return lines.join("\n");
}

function buildReport(state) {
  const lines = [];
  lines.push("# Federation Reintegration Wave 22H/I/J Liris Executor Output Intake");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Status: ${state.status}`);
  lines.push(`State hash: ${state.stateHash}`);
  lines.push("");
  lines.push("## Result");
  lines.push("");
  lines.push("- ACER recorded Liris 22H manifest extension, 22I master status snapshot, and 22J self-hash close-out by reference.");
  lines.push("- No Liris content is present on ACER for these three outputs.");
  lines.push("- Executor-class is ledger-output intake only; no federation gate executed.");
  lines.push("- All seven gates remain held.");
  lines.push("");
  lines.push("## Boundary");
  lines.push("");
  lines.push(state.boundary);
  return lines.join("\n");
}

function buildMap(state) {
  return {
    mapId: "federation-reintegration-wave22hij-liris-executor-output-intake-map.v1",
    generatedAt,
    nodes: [
      { id: "wave22hij", kind: "executor_output_intake", status: state.status },
      { id: "acer-wave22g", kind: "prior_intake", sha256: state.priorAcerWave22g.d50.sha256 },
      ...state.lirisExecutorOutputs.map((item) => ({ id: item.wave, kind: item.kind, sha256: item.sha256, contentOnAcer: item.contentOnAcer })),
      ...state.gateState.map((gate) => ({ id: gate.id, kind: "gate", status: gate.valueStatus, executed: gate.executed })),
      ...state.supervisorExecutorCohort.map((row) => ({ id: row.supervisorPid, kind: "supervisor_pid", level: row.level, verdict: row.verdict }))
    ],
    edges: [
      { from: "wave22hij", to: "acer-wave22g", relation: "follows" },
      ...state.lirisExecutorOutputs.map((item) => ({ from: "wave22hij", to: item.wave, relation: "records_operator_relay" })),
      ...state.gateState.map((gate) => ({ from: "wave22hij", to: gate.id, relation: "preserves_hold" })),
      ...state.supervisorExecutorCohort.map((row) => ({ from: "wave22hij", to: row.supervisorPid, relation: "gated_by" }))
    ],
    boundary: state.boundary
  };
}

function buildGlpj(state) {
  return {
    glpjId: "federation-reintegration-wave22hij-liris-executor-output-intake.glpj",
    generatedAt,
    family: "federation",
    d11: "LIRIS_22H_22I_22J_EXECUTOR_OUTPUT_INTAKE_ONLY",
    glyphs: state.supervisorExecutorCohort.map((row, index) => ({
      token: `FED-WAVE22HIJ-L${index}`,
      level: row.level,
      prof: row.prof,
      supervisorPid: row.supervisorPid,
      verdict: row.verdict
    })),
    executorOutputs: state.lirisExecutorOutputs.map((item) => ({ wave: item.wave, sha256: item.sha256, executorClass: item.executorClass })),
    outputs: [
      { wave: "22H", path: repoRel(OUTPUTS.wave22h), class: "Liris manifest extension intake" },
      { wave: "22I", path: repoRel(OUTPUTS.wave22i), class: "Liris master status snapshot intake" },
      { wave: "22J", path: repoRel(OUTPUTS.wave22j), class: "Liris self-hash closeout intake" }
    ],
    boundary: state.boundary
  };
}

function main() {
  const state = buildState();
  const artifacts = Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)]));
  const memory = {
    memoryId: "federation-reintegration-wave22hij-liris-executor-output-intake.v1",
    generatedAt,
    status: state.status,
    relationship: state.relationship,
    significance: "ACER recorded Liris Wave 22H/I/J executor-class ledger outputs by reference, without content transfer or gate execution.",
    stateHash: state.stateHash,
    artifacts,
    boundary: state.boundary
  };

  writeJson(OUTPUTS.state, state);
  writeText(OUTPUTS.wave22h, buildWaveDoc(state, "22H"));
  writeText(OUTPUTS.wave22i, buildWaveDoc(state, "22I"));
  writeText(OUTPUTS.wave22j, buildWaveDoc(state, "22J"));
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
      wave22h: repoRel(OUTPUTS.wave22h),
      wave22i: repoRel(OUTPUTS.wave22i),
      wave22j: repoRel(OUTPUTS.wave22j),
      state: repoRel(OUTPUTS.state),
      report: repoRel(OUTPUTS.report)
    }
  }, null, 2));
}

main();
