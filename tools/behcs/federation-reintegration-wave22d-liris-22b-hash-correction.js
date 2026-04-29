#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const runId = "federation-reintegration-wave22d-liris-22b-hash-correction-20260427";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427");

const INPUTS = Object.freeze({
  wave22cState: "data/behcs/orchestration/federation-reintegration-20260427/wave22c-bilateral-form-sync-intake.v1.json",
  wave22cD50: "data/agent-index/council/D50-WAVE22C-BILATERAL-FORM-SYNC-INTAKE-ACER-2026-04-27.md",
  wave22bAcer: "data/agent-index/council/D50-WAVE22B-SEVEN-GATE-OPERATOR-DECISION-FORM-ACER-2026-04-27.md"
});

const OUTPUTS = Object.freeze({
  state: path.join(runRoot, "wave22d-liris-22b-hash-correction.v1.json"),
  d50: path.join(repoRoot, "data", "agent-index", "council", "D50-WAVE22D-LIRIS-22B-HASH-CORRECTION-ACER-2026-04-27.md"),
  report: path.join(repoRoot, "reports", "federation-reintegration-wave22d-liris-22b-hash-correction-latest.md"),
  reportJson: path.join(repoRoot, "reports", "federation-reintegration-wave22d-liris-22b-hash-correction-latest.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "federation-reintegration-wave22d-liris-22b-hash-correction.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "federation-reintegration-wave22d-liris-22b-hash-correction-map.v1.json"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "federation-reintegration-wave22d-liris-22b-hash-correction.glpj.json")
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
  const wave22c = readJson(INPUTS.wave22cState, {});
  const prior = {
    wave22cD50: fileStatus(INPUTS.wave22cD50),
    wave22bAcer: fileStatus(INPUTS.wave22bAcer),
    wave22cStateHash: wave22c.stateHash || null,
    priorLiris22bHash: wave22c.lirisRelay?.liris22bHash || "NOT_RELAYED_THIS_MESSAGE"
  };

  const liris22 = {
    "22A": {
      path: "data/agent-index/council/D50-WAVE22A-OPERATOR-OVERRIDE-SUB-CASCADE-OPEN-LIRIS-2026-04-27.md",
      lines: 106,
      sha256: "193f7a6d5143600e373eef85938c284a605f3a239db1d9f4899c2822b7f6a7b2",
      verificationClass: "OPERATOR_RELAYED_HASH_ONLY_NO_CONTENT"
    },
    "22B": {
      path: "data/agent-index/council/D50-WAVE22B-SEVEN-GATE-OPERATOR-DECISION-FORM-LIRIS-2026-04-27.md",
      lines: 97,
      sha256: "f022dfc7253bcdd280a4f10ed6ddae1430f19262f91ff761eaa7e9f5a208860b",
      verificationClass: "OPERATOR_RELAYED_HASH_ONLY_NO_CONTENT"
    }
  };

  const supervisorLevels = [
    {
      level: "L0_BOUNDARY",
      prof: "PROF-HOOKWALL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HOOKWALL.BOUNDARY",
      verdict: "ALLOW_APPEND_ONLY_HASH_CORRECTION"
    },
    {
      level: "L1_PACKET_SCHEMA",
      prof: "PROF-HERMES",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET.ACER",
      verdict: "REPLACE_NOT_RELAYED_MARKER_WITH_OPERATOR_RELAYED_HASH_REFERENCE"
    },
    {
      level: "L2_GRAMMAR",
      prof: "PROF-KERNEL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.KERNEL.GRAMMAR.ACER",
      verdict: "PRIOR_22C_REMAINS_HISTORICAL_22D_SUPERSEDES_ONE_FIELD"
    },
    {
      level: "L3_COMMS",
      prof: "PROF-COMMS",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.COMMS.BILATERAL.ACER",
      verdict: "NO_CONTENT_TRANSFER_NO_PEER_CALL_NO_HASH_FABRICATION"
    },
    {
      level: "L4_COUNCIL",
      prof: "PROF-CHIEFCOUNCIL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.D50.COUNCIL.ACER",
      verdict: "HASH_INTAKE_IS_NOT_RATIFICATION"
    },
    {
      level: "L5_CONVERGENCE",
      prof: "PROF-CONVERGENCE",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.CONVERGENCE.WAVE.ACER",
      verdict: "BILATERAL_22A_22B_METADATA_NOW_COMPLETE_AT_HASH_LEVEL"
    },
    {
      level: "L6_SHANNON",
      prof: "PROF-SHANNON",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.SHANNON.DEFENSE.ACER",
      verdict: "GATE_VALUES_STILL_BLANK_HOLD"
    },
    {
      level: "L7_APEX",
      prof: "COL-ASOLARIA",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.ASOLARIA.APEX.ACER",
      verdict: "NEXT_MEANINGFUL_STEP_REMAINS_OPERATOR_GATE_VALUE_OR_PAYLOAD"
    }
  ];

  const state = {
    schema: "federation-reintegration-wave22d-liris-22b-hash-correction.v1",
    runId,
    generatedAt,
    status: "DRAFT_ONLY_NOT_RATIFIED",
    relationship: "LIRIS_22B_HASH_APPEND_ONLY_CORRECTION_FOR_WAVE22C",
    prior,
    liris22,
    correctionDisposition: {
      prior22cRewritten: false,
      supersededField: "lirisRelay.liris22bHash",
      oldValue: prior.priorLiris22bHash,
      newValue: liris22["22B"].sha256,
      contentOnAcer: false,
      hashFabrication: false,
      gateExecutionByThisWave: false
    },
    gateState: (wave22c.gateState || []).map((gate) => ({
      id: gate.id,
      valueStatus: gate.valueStatus || "BLANK_HELD",
      executed: false
    })),
    supervisorLevels,
    boundary: "Wave 22D hash-correction intake only. No gate execution, no content transfer, no overwrite of prior 22C artifacts, no schedule reconciliation, no vision disposition choice, no hash fabrication, no parent manifest modification, no Merkle recompute, no peer endpoint, no payload transfer, no Liris disk write by ACER, no MCP invocation, no exterior MCP, no model fanout, no device action, no emit, no ed25519, no key ceremony, no quorum outreach, no cosigner recruitment, no census admission, no PID mint, no quarantine lift, no ratification, no promotion."
  };

  state.stateHash = sha256Text(JSON.stringify(state));
  return state;
}

function buildD50(state) {
  const lines = [];
  lines.push("# D50 Wave 22D - Liris 22B Hash Correction (ACER)");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Status: ${state.status}`);
  lines.push(`Relationship: ${state.relationship}`);
  lines.push("");
  lines.push("## Correction");
  lines.push("");
  lines.push(`- Prior Wave 22C value for Liris 22B hash: \`${state.correctionDisposition.oldValue}\`.`);
  lines.push(`- Corrected operator-relayed Liris 22B hash: \`${state.correctionDisposition.newValue}\`.`);
  lines.push("- Prior 22C artifacts are not rewritten; this artifact supersedes only the missing-hash field.");
  lines.push("");
  lines.push("## Liris Wave 22 References");
  lines.push("");
  lines.push("| Wave | Liris path | Lines | sha256 |");
  lines.push("|------|------------|-------|--------|");
  for (const wave of ["22A", "22B"]) {
    const item = state.liris22[wave];
    lines.push(`| ${wave} | \`${item.path}\` | ${item.lines} | \`${item.sha256}\` |`);
  }
  lines.push("");
  lines.push("## Gate State");
  lines.push("");
  for (const gate of state.gateState) lines.push(`- ${gate.id}: ${gate.valueStatus}, executed=${gate.executed}`);
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
  lines.push("# Federation Reintegration Wave 22D Liris 22B Hash Correction");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Status: ${state.status}`);
  lines.push(`State hash: ${state.stateHash}`);
  lines.push("");
  lines.push("## Result");
  lines.push("");
  lines.push("- ACER recorded the newly relayed Liris 22B hash.");
  lines.push("- Wave 22C remains historical; 22D supersedes only the missing-hash field.");
  lines.push("- All seven gates remain HOLD and unexecuted.");
  lines.push("");
  lines.push("## Boundary");
  lines.push("");
  lines.push(state.boundary);
  return lines.join("\n");
}

function buildMap(state) {
  return {
    mapId: "federation-reintegration-wave22d-liris-22b-hash-correction-map.v1",
    generatedAt,
    nodes: [
      { id: "wave22d", kind: "append_only_hash_correction", status: state.status },
      { id: "wave22c", kind: "prior_sync_intake", sha256: state.prior.wave22cD50.sha256 },
      { id: "liris-22a", kind: "operator_relay_hash", sha256: state.liris22["22A"].sha256 },
      { id: "liris-22b", kind: "operator_relay_hash", sha256: state.liris22["22B"].sha256 },
      ...state.gateState.map((gate) => ({ id: gate.id, kind: "gate", status: gate.valueStatus, executed: gate.executed })),
      ...state.supervisorLevels.map((row) => ({ id: row.supervisorPid, kind: "supervisor_pid", level: row.level, verdict: row.verdict }))
    ],
    edges: [
      { from: "wave22d", to: "wave22c", relation: "corrects_missing_hash_field_for" },
      { from: "wave22d", to: "liris-22a", relation: "records_reference" },
      { from: "wave22d", to: "liris-22b", relation: "records_new_reference" },
      ...state.gateState.map((gate) => ({ from: "wave22d", to: gate.id, relation: "preserves_hold" })),
      ...state.supervisorLevels.map((row) => ({ from: "wave22d", to: row.supervisorPid, relation: "gated_by" }))
    ],
    boundary: state.boundary
  };
}

function buildGlpj(state) {
  return {
    glpjId: "federation-reintegration-wave22d-liris-22b-hash-correction.glpj",
    generatedAt,
    family: "federation",
    d11: "APPEND_ONLY_LIRIS_22B_HASH_CORRECTION",
    glyphs: state.supervisorLevels.map((row, index) => ({
      token: `FED-WAVE22D-L${index}`,
      level: row.level,
      prof: row.prof,
      supervisorPid: row.supervisorPid,
      verdict: row.verdict
    })),
    outputs: [{ wave: "22D", path: repoRel(OUTPUTS.d50), class: "Liris 22B hash correction" }],
    boundary: state.boundary
  };
}

function main() {
  const state = buildState();
  const artifacts = Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)]));
  const memory = {
    memoryId: "federation-reintegration-wave22d-liris-22b-hash-correction.v1",
    generatedAt,
    status: state.status,
    relationship: state.relationship,
    significance: "ACER corrected Wave 22C's missing Liris 22B hash marker using the newly operator-relayed hash, without rewriting prior artifacts.",
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
