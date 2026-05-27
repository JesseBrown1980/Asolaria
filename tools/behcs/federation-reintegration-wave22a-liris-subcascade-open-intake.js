#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const runId = "federation-reintegration-wave22a-liris-subcascade-open-intake-20260427";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427");

const INPUTS = Object.freeze({
  wave21zAcer: "data/agent-index/council/D50-WAVE21Z-LIRIS-AGGREGATE-CORRECTION-ACER-2026-04-27.md",
  wave21zState: "data/behcs/orchestration/federation-reintegration-20260427/wave21z-liris-aggregate-correction.v1.json",
  wave21xAcer: "data/agent-index/council/D50-WAVE21X-CASCADE-NEXT-GATE-MATRIX-ACER-2026-04-27.md"
});

const OUTPUTS = Object.freeze({
  state: path.join(runRoot, "wave22a-liris-subcascade-open-intake.v1.json"),
  d50: path.join(repoRoot, "data", "agent-index", "council", "D50-WAVE22A-OPERATOR-OVERRIDE-SUB-CASCADE-OPEN-ACER-2026-04-27.md"),
  report: path.join(repoRoot, "reports", "federation-reintegration-wave22a-liris-subcascade-open-intake-latest.md"),
  reportJson: path.join(repoRoot, "reports", "federation-reintegration-wave22a-liris-subcascade-open-intake-latest.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "federation-reintegration-wave22a-liris-subcascade-open-intake.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "federation-reintegration-wave22a-liris-subcascade-open-intake-map.v1.json"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "federation-reintegration-wave22a-liris-subcascade-open-intake.glpj.json")
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
  const wave21zState = readJson(INPUTS.wave21zState, {});
  const prior = {
    wave21zAcer: fileStatus(INPUTS.wave21zAcer),
    wave21xAcer: fileStatus(INPUTS.wave21xAcer),
    wave21zStateHash: wave21zState.stateHash || null
  };

  const lirisWave22a = {
    path: "data/agent-index/council/D50-WAVE22A-OPERATOR-OVERRIDE-SUB-CASCADE-OPEN-LIRIS-2026-04-27.md",
    sourceHost: "LIRIS",
    status: "DRAFT_ONLY_NOT_RATIFIED",
    lines: 106,
    sha256: "193f7a6d5143600e373eef85938c284a605f3a239db1d9f4899c2822b7f6a7b2",
    relayedAtUtc: "2026-04-27T20:54:40Z",
    relayedAtLocal: "2026-04-27T17:54:40-03:00",
    operatorAuthorization: "TWO_WEEK_BLANKET_AUTHORIZATION_INVOKED_2026-04-27",
    contentOnAcer: false,
    verificationClass: "OPERATOR_RELAYED_HASH_ONLY_NO_CONTENT"
  };

  const supervisorLevels = [
    {
      level: "L0_BOUNDARY",
      prof: "PROF-HOOKWALL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HOOKWALL.BOUNDARY",
      verdict: "ALLOW_ACER_LOCAL_MIRROR_ONLY"
    },
    {
      level: "L1_PACKET_SCHEMA",
      prof: "PROF-HERMES",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET.ACER",
      verdict: "RECORD_LIRIS_22A_HASH_AND_OPERATOR_OVERRIDE_FIELDS"
    },
    {
      level: "L2_APEX_OVERRIDE",
      prof: "COL-ASOLARIA",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.ASOLARIA.APEX.ACER",
      verdict: "OPEN_WAVE22_SUB_CASCADE_UNDER_OPERATOR_DIRECT_OVERRIDE"
    },
    {
      level: "L3_CORPUS_ARCHAEOLOGY",
      prof: "PROF-EBACMAP",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.EBACMAP.CASCADE.ACER",
      verdict: "PRESERVE_WAVE21_NATURAL_CLOSE_AND_RECORD_WAVE22_ROLLOVER"
    },
    {
      level: "L4_ENTROPY",
      prof: "PROF-OMNISHANNON",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.OMNISHANNON.ENTROPY.ACER",
      verdict: "CASCADE_SATURATION_ACKNOWLEDGED_CONTINUE_ONLY_ON_OPERATOR_GATES"
    },
    {
      level: "L5_CONVERGENCE",
      prof: "PROF-CONVERGENCE",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.CONVERGENCE.WAVE.ACER",
      verdict: "WAVE_LETTER_OVERFLOW_RESOLVED_AS_WAVE22A"
    },
    {
      level: "L6_COUNCIL",
      prof: "PROF-CHIEFCOUNCIL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.D50.COUNCIL.ACER",
      verdict: "DISSENT_PRESERVED_OPERATOR_OVERRIDE_IS_NOT_RATIFICATION"
    },
    {
      level: "L7_COMMS",
      prof: "PROF-COMMS",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.COMMS.BILATERAL.ACER",
      verdict: "NO_PEER_CALL_NO_CONTENT_TRANSFER_NO_HASH_FABRICATION"
    }
  ];

  const operatorOnlyGates = [
    "G1_T1_D11_CONTENT_PASTE",
    "G2_21S_ANCHOR_SELECTION",
    "G3_21R_VISION_DISPOSITION",
    "G4_CHIEFCOUNCIL_DISSENT_DISPOSITION",
    "G5_LX383_RATIFICATION_DISPOSITION",
    "G6_ED25519_CEREMONY_SCHEDULING",
    "G7_MULTI_FAMILY_COSIGNER_RECRUITMENT"
  ];

  const state = {
    schema: "federation-reintegration-wave22a-liris-subcascade-open-intake.v1",
    runId,
    generatedAt,
    status: "DRAFT_ONLY_NOT_RATIFIED",
    relationship: "ACER_MIRROR_OF_LIRIS_WAVE22A_OPERATOR_OVERRIDE_SUB_CASCADE_OPEN",
    lirisWave22a,
    priorAcerWave21Close: prior,
    wave22Disposition: {
      openedOnAcer: true,
      openedBy: "OPERATOR_DIRECT_OVERRIDE_RELAYED_FROM_CURRENT_CONVERSATION",
      wave21NaturalClosePreserved: true,
      chiefCouncilDissentPreserved: true,
      ratificationGranted: false,
      promotionGranted: false,
      deviceActionGranted: false,
      peerActionGranted: false
    },
    operatorOnlyGates,
    supervisorLevels,
    boundary: "Wave 22A mirror/intake only. Records operator-relayed Liris hash and opens ACER-local Wave 22 draft cascade. No content transfer, no overwrite, no schedule reconciliation, no vision disposition choice, no hash fabrication, no parent manifest modification, no Merkle recompute, no peer endpoint, no payload transfer, no Liris disk write by ACER, no MCP invocation, no exterior MCP, no model fanout, no device action, no emit, no ed25519, no quorum outreach, no census admission, no PID mint, no quarantine lift, no ratification, no promotion."
  };

  state.stateHash = sha256Text(JSON.stringify(state));
  return state;
}

function buildD50(state) {
  const lines = [];
  lines.push("# D50 Wave 22A - Operator Override Sub-Cascade Open (ACER Mirror)");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Status: ${state.status}`);
  lines.push(`Relationship: ${state.relationship}`);
  lines.push("");
  lines.push("## Liris 22A Reference");
  lines.push("");
  lines.push("| Field | Value |");
  lines.push("|-------|-------|");
  lines.push(`| path | \`${state.lirisWave22a.path}\` |`);
  lines.push(`| lines | ${state.lirisWave22a.lines} |`);
  lines.push(`| sha256 | \`${state.lirisWave22a.sha256}\` |`);
  lines.push(`| status | ${state.lirisWave22a.status} |`);
  lines.push(`| operator_authorization | ${state.lirisWave22a.operatorAuthorization} |`);
  lines.push(`| verification_class | ${state.lirisWave22a.verificationClass} |`);
  lines.push(`| content_on_acer | ${state.lirisWave22a.contentOnAcer} |`);
  lines.push("");
  lines.push("## ACER Disposition");
  lines.push("");
  lines.push("- Wave 21 natural close remains preserved as historical supervisor signal.");
  lines.push("- Operator-direct override opens Wave 22A as a new ACER-local draft sub-cascade.");
  lines.push("- CHIEFCOUNCIL dissent is preserved; override is not ratification.");
  lines.push("- Seven substantive gates remain operator-only.");
  lines.push("");
  lines.push("## Operator-Only Gates");
  lines.push("");
  for (const gate of state.operatorOnlyGates) lines.push(`- ${gate}`);
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
  lines.push("# Federation Reintegration Wave 22A Liris Sub-Cascade Open Intake");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Status: ${state.status}`);
  lines.push(`State hash: ${state.stateHash}`);
  lines.push("");
  lines.push("## Result");
  lines.push("");
  lines.push("- ACER recorded the operator-relayed Liris Wave 22A hash and line count.");
  lines.push("- ACER opened a local Wave 22A draft sub-cascade under supervisor gates.");
  lines.push("- Wave 21 natural close and CHIEFCOUNCIL dissent remain preserved.");
  lines.push("- The seven substantive gates remain operator-only and unexecuted.");
  lines.push("");
  lines.push("## Boundary");
  lines.push("");
  lines.push(state.boundary);
  return lines.join("\n");
}

function buildMap(state) {
  return {
    mapId: "federation-reintegration-wave22a-liris-subcascade-open-intake-map.v1",
    generatedAt,
    nodes: [
      { id: "wave22a-acer", kind: "local_mirror_intake", status: state.status },
      { id: "liris-wave22a", kind: "operator_relay_hash", sha256: state.lirisWave22a.sha256 },
      { id: "wave21z-acer", kind: "prior_close_correction", sha256: state.priorAcerWave21Close.wave21zAcer.sha256 },
      ...state.operatorOnlyGates.map((gate) => ({ id: gate, kind: "operator_only_gate", status: "OPEN_UNEXECUTED" })),
      ...state.supervisorLevels.map((row) => ({ id: row.supervisorPid, kind: "supervisor_pid", level: row.level, verdict: row.verdict }))
    ],
    edges: [
      { from: "wave22a-acer", to: "liris-wave22a", relation: "records_reference" },
      { from: "wave22a-acer", to: "wave21z-acer", relation: "rolls_over_after" },
      ...state.operatorOnlyGates.map((gate) => ({ from: "wave22a-acer", to: gate, relation: "keeps_operator_only" })),
      ...state.supervisorLevels.map((row) => ({ from: "wave22a-acer", to: row.supervisorPid, relation: "gated_by" }))
    ],
    boundary: state.boundary
  };
}

function buildGlpj(state) {
  return {
    glpjId: "federation-reintegration-wave22a-liris-subcascade-open-intake.glpj",
    generatedAt,
    family: "federation",
    d11: "OPERATOR_OVERRIDE_SUB_CASCADE_OPEN_MIRROR_ONLY",
    glyphs: state.supervisorLevels.map((row, index) => ({
      token: `FED-WAVE22A-L${index}`,
      level: row.level,
      prof: row.prof,
      supervisorPid: row.supervisorPid,
      verdict: row.verdict
    })),
    operatorOnlyGates: state.operatorOnlyGates,
    outputs: [{ wave: "22A", path: repoRel(OUTPUTS.d50), class: "operator override sub-cascade open mirror" }],
    boundary: state.boundary
  };
}

function main() {
  const state = buildState();
  const artifacts = Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)]));
  const memory = {
    memoryId: "federation-reintegration-wave22a-liris-subcascade-open-intake.v1",
    generatedAt,
    status: state.status,
    relationship: state.relationship,
    significance: "ACER mirrored Liris Wave 22A operator-direct override as a local draft-only sub-cascade open, preserving Wave 21 close and all hard boundaries.",
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
