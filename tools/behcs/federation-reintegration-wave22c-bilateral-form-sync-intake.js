#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const runId = "federation-reintegration-wave22c-bilateral-form-sync-intake-20260427";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427");

const INPUTS = Object.freeze({
  wave22aState: "data/behcs/orchestration/federation-reintegration-20260427/wave22a-liris-subcascade-open-intake.v1.json",
  wave22bState: "data/behcs/orchestration/federation-reintegration-20260427/wave22b-seven-gate-operator-decision-form.v1.json",
  wave22aD50: "data/agent-index/council/D50-WAVE22A-OPERATOR-OVERRIDE-SUB-CASCADE-OPEN-ACER-2026-04-27.md",
  wave22bD50: "data/agent-index/council/D50-WAVE22B-SEVEN-GATE-OPERATOR-DECISION-FORM-ACER-2026-04-27.md"
});

const OUTPUTS = Object.freeze({
  state: path.join(runRoot, "wave22c-bilateral-form-sync-intake.v1.json"),
  d50: path.join(repoRoot, "data", "agent-index", "council", "D50-WAVE22C-BILATERAL-FORM-SYNC-INTAKE-ACER-2026-04-27.md"),
  report: path.join(repoRoot, "reports", "federation-reintegration-wave22c-bilateral-form-sync-intake-latest.md"),
  reportJson: path.join(repoRoot, "reports", "federation-reintegration-wave22c-bilateral-form-sync-intake-latest.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "federation-reintegration-wave22c-bilateral-form-sync-intake.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "federation-reintegration-wave22c-bilateral-form-sync-intake-map.v1.json"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "federation-reintegration-wave22c-bilateral-form-sync-intake.glpj.json")
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
  const wave22aState = readJson(INPUTS.wave22aState, {});
  const wave22bState = readJson(INPUTS.wave22bState, {});
  const localArtifacts = {
    wave22aAcer: fileStatus(INPUTS.wave22aD50),
    wave22bAcer: fileStatus(INPUTS.wave22bD50),
    wave22aStateHash: wave22aState.stateHash || null,
    wave22bStateHash: wave22bState.stateHash || null
  };

  const lirisRelay = {
    source: "operator-relayed Liris status message",
    lirisArtifactsTotal: 21,
    lirisComposition: "19 Wave 21 + 22A + 22B",
    lirisChiefCouncilDissent: "20-wave standing",
    bilateralDivergedDraftSiblingPairs: 10,
    formStructureSynchronized: true,
    sameAuthorizationInterpretation: true,
    sameSevenGateStructure: true,
    sameEightLevelVerdictStructure: true,
    blankGateMeansHold: true,
    anyGateExecuted: false,
    liris22aHashKnownFromPriorRelay: wave22aState.lirisWave22a?.sha256 || "193f7a6d5143600e373eef85938c284a605f3a239db1d9f4899c2822b7f6a7b2",
    liris22bHash: "NOT_RELAYED_THIS_MESSAGE",
    liris22bContentOnAcer: false,
    hashFabrication: false
  };

  const gateState = (wave22bState.gateDecisions || []).map((gate) => ({
    id: gate.id,
    supervisor: gate.supervisor,
    currentDefault: gate.currentDefault,
    synchronized: true,
    valueStatus: "BLANK_HELD",
    executed: false
  }));

  const supervisorLevels = [
    {
      level: "L0_BOUNDARY",
      prof: "PROF-HOOKWALL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HOOKWALL.BOUNDARY",
      verdict: "ALLOW_BILATERAL_FORM_SYNC_INTAKE_ONLY"
    },
    {
      level: "L1_PACKET_SCHEMA",
      prof: "PROF-HERMES",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET.ACER",
      verdict: "RECORD_STRUCTURE_SYNC_AND_MISSING_LIRIS_22B_HASH"
    },
    {
      level: "L2_GRAMMAR",
      prof: "PROF-KERNEL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.KERNEL.GRAMMAR.ACER",
      verdict: "DIVERGED_DRAFT_SIBLINGS_PATTERN_CONTINUES"
    },
    {
      level: "L3_COMMS",
      prof: "PROF-COMMS",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.COMMS.BILATERAL.ACER",
      verdict: "NO_CONTENT_TRANSFER_NO_PEER_CALL_NO_HASH_FABRICATION"
    },
    {
      level: "L4_ENTROPY",
      prof: "PROF-OMNISHANNON",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.OMNISHANNON.ENTROPY.ACER",
      verdict: "SATURATION_CARRIES_FORWARD_BUT_SYNC_EVENT_HAS_NEW_VALUE"
    },
    {
      level: "L5_COUNCIL",
      prof: "PROF-CHIEFCOUNCIL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.D50.COUNCIL.ACER",
      verdict: "DISSENT_PRESERVED_NO_GATE_RATIFIED"
    },
    {
      level: "L6_CONVERGENCE",
      prof: "PROF-CONVERGENCE",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.CONVERGENCE.WAVE.ACER",
      verdict: "NEXT_MEANINGFUL_CHANGE_REQUIRES_GATE_VALUE"
    },
    {
      level: "L7_APEX",
      prof: "COL-ASOLARIA",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.ASOLARIA.APEX.ACER",
      verdict: "HOLD_ALL_GATES_UNTIL_OPERATOR_VALUES_OR_PAYLOADS"
    }
  ];

  const state = {
    schema: "federation-reintegration-wave22c-bilateral-form-sync-intake.v1",
    runId,
    generatedAt,
    status: "DRAFT_ONLY_NOT_RATIFIED",
    relationship: "BILATERAL_22A_22B_FORM_STRUCTURE_SYNCHRONIZED_GATE_VALUES_STILL_HOLD",
    localArtifacts,
    lirisRelay,
    gateState,
    supervisorLevels,
    boundary: "Wave 22C bilateral form-sync intake only. No gate execution, no content transfer, no overwrite, no schedule reconciliation, no vision disposition choice, no hash fabrication, no parent manifest modification, no Merkle recompute, no peer endpoint, no payload transfer, no Liris disk write by ACER, no MCP invocation, no exterior MCP, no model fanout, no device action, no emit, no ed25519, no key ceremony, no quorum outreach, no cosigner recruitment, no census admission, no PID mint, no quarantine lift, no ratification, no promotion."
  };

  state.stateHash = sha256Text(JSON.stringify(state));
  return state;
}

function buildD50(state) {
  const lines = [];
  lines.push("# D50 Wave 22C - Bilateral Form Sync Intake (ACER)");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Status: ${state.status}`);
  lines.push(`Relationship: ${state.relationship}`);
  lines.push("");
  lines.push("## Operator-Relayed Bilateral State");
  lines.push("");
  lines.push("| Field | Value |");
  lines.push("|-------|-------|");
  lines.push(`| Liris artifacts total | ${state.lirisRelay.lirisArtifactsTotal} (${state.lirisRelay.lirisComposition}) |`);
  lines.push(`| Liris CHIEFCOUNCIL dissent | ${state.lirisRelay.lirisChiefCouncilDissent} |`);
  lines.push(`| Bilateral DIVERGED_DRAFT_SIBLINGS pairs | ${state.lirisRelay.bilateralDivergedDraftSiblingPairs} |`);
  lines.push(`| Form structure synchronized | ${state.lirisRelay.formStructureSynchronized} |`);
  lines.push(`| Gate executed | ${state.lirisRelay.anyGateExecuted} |`);
  lines.push(`| Liris 22A sha256 | \`${state.lirisRelay.liris22aHashKnownFromPriorRelay}\` |`);
  lines.push(`| Liris 22B sha256 | ${state.lirisRelay.liris22bHash} |`);
  lines.push("");
  lines.push("## Gate State");
  lines.push("");
  lines.push("| Gate | Supervisor | Current default | Value status | Executed |");
  lines.push("|------|------------|-----------------|--------------|----------|");
  for (const gate of state.gateState) {
    lines.push(`| ${gate.id} | ${gate.supervisor} | ${gate.currentDefault} | ${gate.valueStatus} | ${gate.executed} |`);
  }
  lines.push("");
  lines.push("## Per-Level Verdicts");
  lines.push("");
  for (const row of state.supervisorLevels) lines.push(`- ${row.level} / ${row.prof} / ${row.supervisorPid}: ${row.verdict}`);
  lines.push("");
  lines.push("## Boundary");
  lines.push("");
  lines.push(state.boundary);
  return lines.join("\n");
}

function buildReport(state) {
  const lines = [];
  lines.push("# Federation Reintegration Wave 22C Bilateral Form Sync Intake");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Status: ${state.status}`);
  lines.push(`State hash: ${state.stateHash}`);
  lines.push("");
  lines.push("## Result");
  lines.push("");
  lines.push("- ACER recorded the operator-relayed bilateral 22A/22B form-structure synchronization.");
  lines.push("- Liris 22B hash was not relayed, so ACER records no hash for it.");
  lines.push("- All seven gates remain blank/HOLD and unexecuted.");
  lines.push("");
  lines.push("## Boundary");
  lines.push("");
  lines.push(state.boundary);
  return lines.join("\n");
}

function buildMap(state) {
  return {
    mapId: "federation-reintegration-wave22c-bilateral-form-sync-intake-map.v1",
    generatedAt,
    nodes: [
      { id: "wave22c", kind: "bilateral_form_sync_intake", status: state.status },
      { id: "acer-wave22a", kind: "local_artifact", sha256: state.localArtifacts.wave22aAcer.sha256 },
      { id: "acer-wave22b", kind: "local_artifact", sha256: state.localArtifacts.wave22bAcer.sha256 },
      { id: "liris-wave22a", kind: "operator_relay_hash", sha256: state.lirisRelay.liris22aHashKnownFromPriorRelay },
      { id: "liris-wave22b", kind: "missing_hash", sha256: null },
      ...state.gateState.map((gate) => ({ id: gate.id, kind: "gate", status: gate.valueStatus, executed: gate.executed })),
      ...state.supervisorLevels.map((row) => ({ id: row.supervisorPid, kind: "supervisor_pid", level: row.level, verdict: row.verdict }))
    ],
    edges: [
      { from: "wave22c", to: "acer-wave22a", relation: "records" },
      { from: "wave22c", to: "acer-wave22b", relation: "records" },
      { from: "wave22c", to: "liris-wave22a", relation: "records_operator_relay" },
      { from: "wave22c", to: "liris-wave22b", relation: "marks_not_relayed" },
      ...state.gateState.map((gate) => ({ from: "wave22c", to: gate.id, relation: "holds_blank_gate" })),
      ...state.supervisorLevels.map((row) => ({ from: "wave22c", to: row.supervisorPid, relation: "gated_by" }))
    ],
    boundary: state.boundary
  };
}

function buildGlpj(state) {
  return {
    glpjId: "federation-reintegration-wave22c-bilateral-form-sync-intake.glpj",
    generatedAt,
    family: "federation",
    d11: "BILATERAL_FORM_SYNC_INTAKE_ONLY",
    glyphs: state.supervisorLevels.map((row, index) => ({
      token: `FED-WAVE22C-L${index}`,
      level: row.level,
      prof: row.prof,
      supervisorPid: row.supervisorPid,
      verdict: row.verdict
    })),
    gateState: state.gateState,
    outputs: [{ wave: "22C", path: repoRel(OUTPUTS.d50), class: "bilateral form sync intake" }],
    boundary: state.boundary
  };
}

function main() {
  const state = buildState();
  const artifacts = Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)]));
  const memory = {
    memoryId: "federation-reintegration-wave22c-bilateral-form-sync-intake.v1",
    generatedAt,
    status: state.status,
    relationship: state.relationship,
    significance: "ACER recorded that both sides now have Wave 22A/22B form structure synchronized, while all seven gate values remain HOLD.",
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
