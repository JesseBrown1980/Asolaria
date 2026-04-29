#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const runId = "federation-reintegration-wave22f-full-gate-readiness-matrix-20260427";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427");

const INPUTS = Object.freeze({
  wave22a: "data/agent-index/council/D50-WAVE22A-OPERATOR-OVERRIDE-SUB-CASCADE-OPEN-ACER-2026-04-27.md",
  wave22b: "data/agent-index/council/D50-WAVE22B-SEVEN-GATE-OPERATOR-DECISION-FORM-ACER-2026-04-27.md",
  wave22c: "data/agent-index/council/D50-WAVE22C-BILATERAL-FORM-SYNC-INTAKE-ACER-2026-04-27.md",
  wave22d: "data/agent-index/council/D50-WAVE22D-LIRIS-22B-HASH-CORRECTION-ACER-2026-04-27.md",
  wave22e: "data/agent-index/council/D50-WAVE22E-LIRIS-LX384-LX385-INTAKE-ACER-2026-04-27.md",
  wave22eState: "data/behcs/orchestration/federation-reintegration-20260427/wave22e-liris-lx384-385-intake.v1.json",
  localLx383: "data/agent-index/rule/LX-383.md",
  localLx384: "data/agent-index/rule/LX-384.md",
  localLx385: "data/agent-index/rule/LX-385.md"
});

const OUTPUTS = Object.freeze({
  state: path.join(runRoot, "wave22f-full-gate-readiness-matrix.v1.json"),
  d50: path.join(repoRoot, "data", "agent-index", "council", "D50-WAVE22F-FULL-GATE-READINESS-MATRIX-ACER-2026-04-27.md"),
  report: path.join(repoRoot, "reports", "federation-reintegration-wave22f-full-gate-readiness-matrix-latest.md"),
  reportJson: path.join(repoRoot, "reports", "federation-reintegration-wave22f-full-gate-readiness-matrix-latest.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "federation-reintegration-wave22f-full-gate-readiness-matrix.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "federation-reintegration-wave22f-full-gate-readiness-matrix-map.v1.json"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "federation-reintegration-wave22f-full-gate-readiness-matrix.glpj.json")
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
  const wave22e = readJson(INPUTS.wave22eState, {});
  const localArtifacts = {
    wave22a: fileStatus(INPUTS.wave22a),
    wave22b: fileStatus(INPUTS.wave22b),
    wave22c: fileStatus(INPUTS.wave22c),
    wave22d: fileStatus(INPUTS.wave22d),
    wave22e: fileStatus(INPUTS.wave22e)
  };
  const localRuleStatus = {
    lx383: fileStatus(INPUTS.localLx383),
    lx384: fileStatus(INPUTS.localLx384),
    lx385: fileStatus(INPUTS.localLx385)
  };

  const gateReadiness = [
    {
      id: "G1_T1_D11_CONTENT_PASTE",
      owner: "PROF-COMMS",
      readiness: "BLOCKED_MISSING_OPERATOR_PAYLOAD",
      nextRequiredInput: "Actual Liris->ACER and ACER->Liris paste payload bytes plus post-transfer sha256 results.",
      canProceedAutonomously: false,
      nextEligibleWave: "22G only after payload is supplied"
    },
    {
      id: "G2_21S_ANCHOR_SELECTION",
      owner: "PROF-SCHEDULER",
      readiness: "BLOCKED_MISSING_ANCHOR_CHOICE",
      nextRequiredInput: "Choose ACER event-time anchor, Liris ledger/window anchor, or explicit dual-track hold.",
      canProceedAutonomously: false,
      nextEligibleWave: "22G/22H anchor disposition if selected"
    },
    {
      id: "G3_21R_VISION_DISPOSITION",
      owner: "PROF-VISION",
      readiness: "BLOCKED_MISSING_DISPOSITION",
      nextRequiredInput: "Seal missing, accept a Liris disposition option, request rerun witness preservation, or hold.",
      canProceedAutonomously: false,
      nextEligibleWave: "22G/22H vision disposition if selected"
    },
    {
      id: "G4_CHIEFCOUNCIL_DISSENT_DISPOSITION",
      owner: "PROF-CHIEFCOUNCIL",
      readiness: "BLOCKED_DISSENT_STANDING",
      nextRequiredInput: "Operator-direct dissent disposition or GENESIS-COSIGN re-invocation path.",
      canProceedAutonomously: false,
      nextEligibleWave: "22G council disposition only with explicit operator value"
    },
    {
      id: "G5_LX383_RATIFICATION_DISPOSITION",
      owner: "PROF-MCP",
      readiness: "BLOCKED_MISSING_RULE_DECISION",
      nextRequiredInput: "Ratify, revise, or hold LX-383; LX-384/LX-385 remain Liris references until T1 content mirror.",
      canProceedAutonomously: false,
      nextEligibleWave: "22G rule disposition only with explicit operator value"
    },
    {
      id: "G6_ED25519_CEREMONY_SCHEDULING",
      owner: "PROF-SHANNON",
      readiness: "BLOCKED_MISSING_TIMESTAMP_AND_KEY_SCOPE",
      nextRequiredInput: "Specific ceremony timestamp, key scope, and witness expectations, or explicit hold.",
      canProceedAutonomously: false,
      nextEligibleWave: "22G ceremony schedule only with explicit operator value"
    },
    {
      id: "G7_MULTI_FAMILY_COSIGNER_RECRUITMENT",
      owner: "PROF-CONVERGENCE",
      readiness: "BLOCKED_MISSING_COSIGNER_PATH",
      nextRequiredInput: "Choose LM Studio local, Groq cloud key, DeepSeek/other, or neither/hold.",
      canProceedAutonomously: false,
      nextEligibleWave: "22G cosigner route only with explicit operator value"
    }
  ];

  const fullSupervisorCohort = [
    {
      level: "L0_BOUNDARY",
      prof: "PROF-HOOKWALL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HOOKWALL.BOUNDARY",
      verdict: "ALLOW_FULL_READINESS_MATRIX_ONLY"
    },
    {
      level: "L1_PACKET_SCHEMA",
      prof: "PROF-HERMES",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET.ACER",
      verdict: "MATRIX_REQUIRES_GATE_OWNER_READINESS_NEXT_INPUT_NEXT_WAVE"
    },
    {
      level: "L2_COMMS",
      prof: "PROF-COMMS",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.COMMS.BILATERAL.ACER",
      verdict: "G1_BLOCKED_UNTIL_ACTUAL_T1_BYTES"
    },
    {
      level: "L3_SCHEDULER",
      prof: "PROF-SCHEDULER",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.SCHEDULER.DECAY.ACER",
      verdict: "G2_BLOCKED_UNTIL_ANCHOR_CHOICE"
    },
    {
      level: "L4_VISION",
      prof: "PROF-VISION",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.VISION.WITNESS.ACER",
      verdict: "G3_BLOCKED_UNTIL_DISPOSITION"
    },
    {
      level: "L5_COUNCIL",
      prof: "PROF-CHIEFCOUNCIL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.D50.COUNCIL.ACER",
      verdict: "G4_BLOCKED_AND_NO_RATIFICATION"
    },
    {
      level: "L6_MCP_RULES",
      prof: "PROF-MCP",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.MCP.OWN.GATE.ACER",
      verdict: "G5_BLOCKED_LX383_LOCAL_LX384_LX385_LIRIS_REFERENCE_ONLY"
    },
    {
      level: "L7_SHANNON",
      prof: "PROF-SHANNON",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.SHANNON.DEFENSE.ACER",
      verdict: "G6_BLOCKED_NO_KEY_CEREMONY"
    },
    {
      level: "L8_KERNEL",
      prof: "PROF-KERNEL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.KERNEL.GRAMMAR.ACER",
      verdict: "NO_CENSUS_ADMISSION_NO_GLYPH_OR_RULE_PROMOTION"
    },
    {
      level: "L9_EBACMAP",
      prof: "PROF-EBACMAP",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.EBACMAP.CASCADE.ACER",
      verdict: "FULL_MATRIX_IS_VALID_BUT_ARCHAEOLOGY_STILL_DEFERRED"
    },
    {
      level: "L10_CONVERGENCE",
      prof: "PROF-CONVERGENCE",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.CONVERGENCE.WAVE.ACER",
      verdict: "G7_BLOCKED_UNTIL_COSIGNER_PATH"
    },
    {
      level: "L11_APEX",
      prof: "COL-ASOLARIA",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.ASOLARIA.APEX.ACER",
      verdict: "ALL_GATES_HOLD_NEXT_SUBSTANTIVE_WAVE_REQUIRES_OPERATOR_VALUE"
    }
  ];

  const state = {
    schema: "federation-reintegration-wave22f-full-gate-readiness-matrix.v1",
    runId,
    generatedAt,
    status: "DRAFT_ONLY_NOT_RATIFIED",
    relationship: "FULL_SUPERVISOR_GATE_READINESS_MATRIX_ALL_GATES_HELD",
    priorAcerWave22: {
      localArtifacts,
      wave22eStateHash: wave22e.stateHash || null
    },
    localRuleStatus,
    lirisRuleReferences: wave22e.lirisRules || [],
    gateReadiness,
    fullSupervisorCohort,
    aggregateVerdict: {
      autonomousExecutionAvailable: false,
      nextMeaningfulInputClass: "operator gate value or actual T1 payload",
      allGatesHeld: true,
      saturationAcknowledged: true,
      uniqueContentClass: "READINESS_MATRIX_AFTER_RULE_INTAKE"
    },
    boundary: "Wave 22F full supervisor gate-readiness matrix only. No gate execution, no content transfer, no overwrite, no schedule reconciliation, no vision disposition choice, no hash fabrication, no parent manifest modification, no Merkle recompute, no peer endpoint, no payload transfer, no Liris disk write by ACER, no MCP invocation, no exterior MCP, no model fanout, no device action, no emit, no ed25519, no key ceremony, no quorum outreach, no cosigner recruitment, no census admission, no PID mint, no quarantine lift, no rule ratification, no rule promotion, no federation promotion."
  };

  state.stateHash = sha256Text(JSON.stringify(state));
  return state;
}

function buildD50(state) {
  const lines = [];
  lines.push("# D50 Wave 22F - Full Gate Readiness Matrix (ACER)");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Status: ${state.status}`);
  lines.push(`Relationship: ${state.relationship}`);
  lines.push("");
  lines.push("## Aggregate Verdict");
  lines.push("");
  lines.push(`- Autonomous execution available: ${state.aggregateVerdict.autonomousExecutionAvailable}.`);
  lines.push(`- Next meaningful input class: ${state.aggregateVerdict.nextMeaningfulInputClass}.`);
  lines.push(`- All gates held: ${state.aggregateVerdict.allGatesHeld}.`);
  lines.push(`- Unique-content class: ${state.aggregateVerdict.uniqueContentClass}.`);
  lines.push("");
  lines.push("## Gate Readiness");
  lines.push("");
  lines.push("| Gate | Owner | Readiness | Next required input | Next eligible wave |");
  lines.push("|------|-------|-----------|---------------------|--------------------|");
  for (const gate of state.gateReadiness) {
    lines.push(`| ${gate.id} | ${gate.owner} | ${gate.readiness} | ${gate.nextRequiredInput} | ${gate.nextEligibleWave} |`);
  }
  lines.push("");
  lines.push("## Rule Status");
  lines.push("");
  lines.push(`- LX-383 local on ACER: ${state.localRuleStatus.lx383.present}, sha256 \`${state.localRuleStatus.lx383.sha256}\`.`);
  lines.push(`- LX-384 local on ACER: ${state.localRuleStatus.lx384.present}; Liris reference only.`);
  lines.push(`- LX-385 local on ACER: ${state.localRuleStatus.lx385.present}; Liris reference only.`);
  lines.push("");
  lines.push("## Full Supervisor Cohort");
  lines.push("");
  for (const row of state.fullSupervisorCohort) lines.push(`- ${row.level} / ${row.prof} / ${row.supervisorPid}: ${row.verdict}`);
  lines.push("");
  lines.push("## Boundary");
  lines.push("");
  lines.push(state.boundary);
  return lines.join("\n");
}

function buildReport(state) {
  const lines = [];
  lines.push("# Federation Reintegration Wave 22F Full Gate Readiness Matrix");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Status: ${state.status}`);
  lines.push(`State hash: ${state.stateHash}`);
  lines.push("");
  lines.push("## Result");
  lines.push("");
  lines.push("- ACER emitted a full supervisor gate-readiness matrix after LX-384/LX-385 intake.");
  lines.push("- All seven gates remain blocked on explicit operator values or T1 payload bytes.");
  lines.push("- No gate was executed.");
  lines.push("");
  lines.push("## Boundary");
  lines.push("");
  lines.push(state.boundary);
  return lines.join("\n");
}

function buildMap(state) {
  return {
    mapId: "federation-reintegration-wave22f-full-gate-readiness-matrix-map.v1",
    generatedAt,
    nodes: [
      { id: "wave22f", kind: "full_gate_readiness_matrix", status: state.status },
      ...Object.entries(state.priorAcerWave22.localArtifacts).map(([key, value]) => ({ id: key, kind: "prior_wave22_artifact", sha256: value.sha256 })),
      ...state.gateReadiness.map((gate) => ({ id: gate.id, kind: "gate", readiness: gate.readiness, owner: gate.owner })),
      ...state.fullSupervisorCohort.map((row) => ({ id: row.supervisorPid, kind: "supervisor_pid", level: row.level, verdict: row.verdict }))
    ],
    edges: [
      ...Object.keys(state.priorAcerWave22.localArtifacts).map((key) => ({ from: "wave22f", to: key, relation: "summarizes" })),
      ...state.gateReadiness.map((gate) => ({ from: "wave22f", to: gate.id, relation: "classifies_readiness" })),
      ...state.fullSupervisorCohort.map((row) => ({ from: "wave22f", to: row.supervisorPid, relation: "gated_by" }))
    ],
    boundary: state.boundary
  };
}

function buildGlpj(state) {
  return {
    glpjId: "federation-reintegration-wave22f-full-gate-readiness-matrix.glpj",
    generatedAt,
    family: "federation",
    d11: "FULL_GATE_READINESS_MATRIX_ONLY",
    glyphs: state.fullSupervisorCohort.map((row, index) => ({
      token: `FED-WAVE22F-L${index}`,
      level: row.level,
      prof: row.prof,
      supervisorPid: row.supervisorPid,
      verdict: row.verdict
    })),
    gateReadiness: state.gateReadiness.map((gate) => ({ id: gate.id, readiness: gate.readiness, owner: gate.owner })),
    outputs: [{ wave: "22F", path: repoRel(OUTPUTS.d50), class: "full gate readiness matrix" }],
    boundary: state.boundary
  };
}

function main() {
  const state = buildState();
  const artifacts = Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)]));
  const memory = {
    memoryId: "federation-reintegration-wave22f-full-gate-readiness-matrix.v1",
    generatedAt,
    status: state.status,
    relationship: state.relationship,
    significance: "ACER emitted a full supervisor/prof gate-readiness matrix showing every Wave 22 gate remains blocked on explicit operator values or payloads.",
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
