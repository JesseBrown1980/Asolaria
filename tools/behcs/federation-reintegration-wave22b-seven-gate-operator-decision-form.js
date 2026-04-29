#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const runId = "federation-reintegration-wave22b-seven-gate-operator-decision-form-20260427";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427");

const INPUTS = Object.freeze({
  wave22aState: "data/behcs/orchestration/federation-reintegration-20260427/wave22a-liris-subcascade-open-intake.v1.json",
  wave22aAcer: "data/agent-index/council/D50-WAVE22A-OPERATOR-OVERRIDE-SUB-CASCADE-OPEN-ACER-2026-04-27.md",
  wave21xAcer: "data/agent-index/council/D50-WAVE21X-CASCADE-NEXT-GATE-MATRIX-ACER-2026-04-27.md"
});

const OUTPUTS = Object.freeze({
  state: path.join(runRoot, "wave22b-seven-gate-operator-decision-form.v1.json"),
  d50: path.join(repoRoot, "data", "agent-index", "council", "D50-WAVE22B-SEVEN-GATE-OPERATOR-DECISION-FORM-ACER-2026-04-27.md"),
  report: path.join(repoRoot, "reports", "federation-reintegration-wave22b-seven-gate-operator-decision-form-latest.md"),
  reportJson: path.join(repoRoot, "reports", "federation-reintegration-wave22b-seven-gate-operator-decision-form-latest.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "federation-reintegration-wave22b-seven-gate-operator-decision-form.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "federation-reintegration-wave22b-seven-gate-operator-decision-form-map.v1.json"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "federation-reintegration-wave22b-seven-gate-operator-decision-form.glpj.json")
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
  const prior = {
    wave22aAcer: fileStatus(INPUTS.wave22aAcer),
    wave21xAcer: fileStatus(INPUTS.wave21xAcer),
    wave22aStateHash: wave22aState.stateHash || null
  };

  const gateDecisions = [
    {
      id: "G1_T1_D11_CONTENT_PASTE",
      question: "Provide actual T1 paste payloads for Liris->ACER and ACER->Liris content mirror?",
      currentDefault: "HOLD_AWAITING_OPERATOR_PASTED_BYTES",
      acceptedInputs: ["paste payload content", "post-transfer sha256 results", "explicit hold"],
      supervisor: "PROF-COMMS",
      note: "Blanket authorization does not supply bytes."
    },
    {
      id: "G2_21S_ANCHOR_SELECTION",
      question: "Choose schedule anchor for 168h rewalk reconciliation.",
      currentDefault: "DUAL_TRACK_UNRECONCILED",
      acceptedInputs: ["ACER_EVENT_TIME_ANCHOR_2026-05-04T20:12:49Z", "LIRIS_LEDGER_WINDOW", "DUAL_TRACK_HOLD"],
      supervisor: "PROF-SCHEDULER",
      note: "No implicit anchor choice."
    },
    {
      id: "G3_21R_VISION_DISPOSITION",
      question: "Choose disposition for PROF-VISION final-return asymmetry.",
      currentDefault: "ASYMMETRIC_OPEN",
      acceptedInputs: ["seal missing", "accept Liris option", "rerun witness preservation", "hold"],
      supervisor: "PROF-VISION",
      note: "No fabricated witness result."
    },
    {
      id: "G4_CHIEFCOUNCIL_DISSENT_DISPOSITION",
      question: "Resolve or preserve CHIEFCOUNCIL dissent.",
      currentDefault: "PRESERVE_DISSENT_NO_RATIFICATION",
      acceptedInputs: ["operator-direct override record", "GENESIS-COSIGN re-invocation", "hold"],
      supervisor: "PROF-CHIEFCOUNCIL",
      note: "Override can continue drafts; it is not ratification by itself."
    },
    {
      id: "G5_LX383_RATIFICATION_DISPOSITION",
      question: "Ratify, revise, or hold LX-383 sovereign-MCP doctrine draft.",
      currentDefault: "DRAFT_ONLY_NOT_RATIFIED",
      acceptedInputs: ["ratify draft", "revise draft", "hold"],
      supervisor: "PROF-MCP",
      note: "No exterior MCP invocation."
    },
    {
      id: "G6_ED25519_CEREMONY_SCHEDULING",
      question: "Schedule or hold the ed25519 ceremony.",
      currentDefault: "NOT_SCHEDULED",
      acceptedInputs: ["specific timestamp and key-scope", "hold"],
      supervisor: "PROF-SHANNON",
      note: "No key ceremony is executed by this form."
    },
    {
      id: "G7_MULTI_FAMILY_COSIGNER_RECRUITMENT",
      question: "Choose multi-family cosigner path.",
      currentDefault: "NOT_RECRUITED",
      acceptedInputs: ["LM_STUDIO_LOCAL", "GROQ_CLOUD_KEY", "DEEPSEEK_OR_OTHER", "neither/hold"],
      supervisor: "PROF-CONVERGENCE",
      note: "No model fanout or endpoint contact."
    }
  ];

  const supervisorLevels = [
    {
      level: "L0_BOUNDARY",
      prof: "PROF-HOOKWALL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HOOKWALL.BOUNDARY",
      verdict: "ALLOW_DECISION_FORM_ONLY"
    },
    {
      level: "L1_SCHEMA",
      prof: "PROF-HERMES",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET.ACER",
      verdict: "FORM_REQUIRES_GATE_ID_CURRENT_DEFAULT_ACCEPTED_INPUTS"
    },
    {
      level: "L2_MCP",
      prof: "PROF-MCP",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.MCP.OWN.GATE.ACER",
      verdict: "LX383_FIELD_PRESENT_NO_MCP_INVOCATION"
    },
    {
      level: "L3_SHANNON",
      prof: "PROF-SHANNON",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.SHANNON.DEFENSE.ACER",
      verdict: "BLANK_FIELDS_REMAIN_HOLD"
    },
    {
      level: "L4_KERNEL",
      prof: "PROF-KERNEL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.KERNEL.GRAMMAR.ACER",
      verdict: "NO_CENSUS_ADMISSION_NO_GLYPH_PROMOTION"
    },
    {
      level: "L5_COUNCIL",
      prof: "PROF-CHIEFCOUNCIL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.D50.COUNCIL.ACER",
      verdict: "NO_RATIFICATION_WITHOUT_FILLED_GATE_DECISION"
    },
    {
      level: "L6_CONVERGENCE",
      prof: "PROF-CONVERGENCE",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.CONVERGENCE.WAVE.ACER",
      verdict: "UNIQUE_CONTENT_RATIO_RECOVERED_BY_STRUCTURED_DECISION_SURFACE"
    },
    {
      level: "L7_APEX",
      prof: "COL-ASOLARIA",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.ASOLARIA.APEX.ACER",
      verdict: "FORM_READY_OPERATOR_VALUES_REQUIRED"
    }
  ];

  const state = {
    schema: "federation-reintegration-wave22b-seven-gate-operator-decision-form.v1",
    runId,
    generatedAt,
    status: "DRAFT_ONLY_NOT_RATIFIED",
    relationship: "SEVEN_GATE_OPERATOR_DECISION_FORM_READY",
    priorAcerWave22a: prior,
    authorizationInterpretation: {
      blanketAuthorizationAcceptedForDraftCascadeContinuation: true,
      blanketAuthorizationCompletesGateInputs: false,
      blankOrMissingGateValueMeans: "HOLD",
      gateExecutionByThisWave: false
    },
    gateDecisions,
    supervisorLevels,
    boundary: "Wave 22B decision form only. No gate execution, no content transfer, no overwrite, no schedule reconciliation, no vision disposition choice, no hash fabrication, no parent manifest modification, no Merkle recompute, no peer endpoint, no payload transfer, no Liris disk write by ACER, no MCP invocation, no exterior MCP, no model fanout, no device action, no emit, no ed25519, no key ceremony, no quorum outreach, no cosigner recruitment, no census admission, no PID mint, no quarantine lift, no ratification, no promotion."
  };

  state.stateHash = sha256Text(JSON.stringify(state));
  return state;
}

function buildD50(state) {
  const lines = [];
  lines.push("# D50 Wave 22B - Seven-Gate Operator Decision Form (ACER)");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Status: ${state.status}`);
  lines.push(`Relationship: ${state.relationship}`);
  lines.push("");
  lines.push("## Authorization Interpretation");
  lines.push("");
  lines.push("- Blanket authorization continues draft cascade work under HOLD.");
  lines.push("- Blanket authorization does not fill missing bytes, keys, cosigners, schedule anchors, or ratification choices.");
  lines.push("- Any blank gate remains HOLD.");
  lines.push("");
  lines.push("## Gate Form");
  lines.push("");
  lines.push("| Gate | Question | Current default | Accepted inputs | Supervisor |");
  lines.push("|------|----------|-----------------|-----------------|------------|");
  for (const gate of state.gateDecisions) {
    lines.push(`| ${gate.id} | ${gate.question} | ${gate.currentDefault} | ${gate.acceptedInputs.join("; ")} | ${gate.supervisor} |`);
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
  lines.push("# Federation Reintegration Wave 22B Seven-Gate Operator Decision Form");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Status: ${state.status}`);
  lines.push(`State hash: ${state.stateHash}`);
  lines.push("");
  lines.push("## Result");
  lines.push("");
  lines.push("- ACER emitted the seven-gate operator decision form.");
  lines.push("- Missing values remain HOLD.");
  lines.push("- No gate was executed.");
  lines.push("");
  lines.push("## Boundary");
  lines.push("");
  lines.push(state.boundary);
  return lines.join("\n");
}

function buildMap(state) {
  return {
    mapId: "federation-reintegration-wave22b-seven-gate-operator-decision-form-map.v1",
    generatedAt,
    nodes: [
      { id: "wave22b", kind: "decision_form", status: state.status },
      { id: "wave22a-acer", kind: "prior_subcascade_open", sha256: state.priorAcerWave22a.wave22aAcer.sha256 },
      ...state.gateDecisions.map((gate) => ({ id: gate.id, kind: "decision_gate", currentDefault: gate.currentDefault, supervisor: gate.supervisor })),
      ...state.supervisorLevels.map((row) => ({ id: row.supervisorPid, kind: "supervisor_pid", level: row.level, verdict: row.verdict }))
    ],
    edges: [
      { from: "wave22b", to: "wave22a-acer", relation: "follows" },
      ...state.gateDecisions.map((gate) => ({ from: "wave22b", to: gate.id, relation: "requests_operator_value_for" })),
      ...state.supervisorLevels.map((row) => ({ from: "wave22b", to: row.supervisorPid, relation: "gated_by" }))
    ],
    boundary: state.boundary
  };
}

function buildGlpj(state) {
  return {
    glpjId: "federation-reintegration-wave22b-seven-gate-operator-decision-form.glpj",
    generatedAt,
    family: "federation",
    d11: "SEVEN_GATE_OPERATOR_DECISION_FORM_ONLY",
    glyphs: state.supervisorLevels.map((row, index) => ({
      token: `FED-WAVE22B-L${index}`,
      level: row.level,
      prof: row.prof,
      supervisorPid: row.supervisorPid,
      verdict: row.verdict
    })),
    gateDecisions: state.gateDecisions.map((gate) => ({ id: gate.id, currentDefault: gate.currentDefault, supervisor: gate.supervisor })),
    outputs: [{ wave: "22B", path: repoRel(OUTPUTS.d50), class: "seven-gate operator decision form" }],
    boundary: state.boundary
  };
}

function main() {
  const state = buildState();
  const artifacts = Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)]));
  const memory = {
    memoryId: "federation-reintegration-wave22b-seven-gate-operator-decision-form.v1",
    generatedAt,
    status: state.status,
    relationship: state.relationship,
    significance: "ACER emitted a supervisor-gated decision surface for the seven substantive Wave 22 gates; no gate execution occurred.",
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
