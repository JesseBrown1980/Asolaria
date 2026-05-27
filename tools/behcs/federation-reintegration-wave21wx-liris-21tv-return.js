#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const runId = "federation-reintegration-wave21wx-liris-21tv-return-20260427";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427");

const INPUTS = Object.freeze({
  wave21tIntake: "data/behcs/orchestration/federation-reintegration-20260427/wave21t-liris-nqrs-hash-intake.v1.json",
  wave21tD50: "data/agent-index/council/D50-LIRIS-WAVE21NQRS-HASH-INTAKE-2026-04-27.md",
  wave21mIntake: "data/behcs/orchestration/federation-reintegration-20260427/wave21m-liris-corpus-manifest-intake.v1.json",
  wave21nqrsPlan: "data/behcs/orchestration/federation-reintegration-20260427/wave21nqrs-acer-draft-counterparts.v1.json"
});

const OUTPUTS = Object.freeze({
  state: path.join(runRoot, "wave21wx-liris-21tv-return.v1.json"),
  wave21w: path.join(repoRoot, "data", "agent-index", "council", "D50-LIRIS-WAVE21TV-RETURN-INTAKE-2026-04-27.md"),
  wave21x: path.join(repoRoot, "data", "agent-index", "council", "D50-WAVE21X-CASCADE-NEXT-GATE-MATRIX-ACER-2026-04-27.md"),
  report: path.join(repoRoot, "reports", "federation-reintegration-wave21wx-liris-21tv-return-latest.md"),
  reportJson: path.join(repoRoot, "reports", "federation-reintegration-wave21wx-liris-21tv-return-latest.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "federation-reintegration-wave21wx-liris-21tv-return.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "federation-reintegration-wave21wx-liris-21tv-return-map.v1.json"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "federation-reintegration-wave21wx-liris-21tv-return.glpj.json")
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

function readText(relativePath) {
  try {
    return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
  } catch (_error) {
    return null;
  }
}

function readJson(relativePath, fallback = null) {
  const text = readText(relativePath);
  if (text == null) return fallback;
  try {
    return JSON.parse(text);
  } catch (_error) {
    return fallback;
  }
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

function sourceStatus(relativePath) {
  const text = readText(relativePath);
  if (text == null) return { path: relativePath, present: false, sha256: null, bytes: 0 };
  return { path: relativePath, present: true, sha256: sha256Text(text), bytes: Buffer.byteLength(text, "utf8") };
}

function buildState() {
  const wave21t = readJson(INPUTS.wave21tIntake, {});
  const wave21m = readJson(INPUTS.wave21mIntake, {});
  const wave21nqrs = readJson(INPUTS.wave21nqrsPlan, {});
  const acer21tD50 = fileStatus(INPUTS.wave21tD50);

  const liris = {
    "21T": {
      path: "data/agent-index/council/D50-WAVE21T-ACER-NQRS-INTAKE-LIRIS-2026-04-27.md",
      lines: 88,
      sha256: "2fc743c01d07980c661bb5187ffc50ad5b10b7f087a43b31609e54a79e91c5ba",
      status: "DRAFT_ONLY_NOT_RATIFIED",
      note: "Liris mirror of ACER 21T by reference; ACER hashes not computed by Liris."
    },
    "21V": {
      path: "data/agent-index/council/D50-WAVE21V-MANIFEST-EXTENSION-SELF-HASH-LIRIS-2026-04-27.md",
      lines: 82,
      sha256: "e6664ec14529cc6d719f99754eee63db9702dad040aeecf5f78674a044dfa4eb",
      status: "DRAFT_ONLY_NOT_RATIFIED",
      note: "Wave 21M self-hash close-out sibling; parent manifest not modified."
    }
  };

  const supervisorLevels = [
    {
      level: "L0_BOUNDARY",
      prof: "PROF-HOOKWALL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HOOKWALL.BOUNDARY",
      verdict: "ALLOW_LIRIS_21T_21V_HASH_INTAKE_AND_NEXT_GATE_MATRIX_ONLY"
    },
    {
      level: "L1_PACKET_SCHEMA",
      prof: "PROF-HERMES",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET.ACER",
      verdict: "RECORD_21T_21V_HASHES_WITH_NO_CONTENT"
    },
    {
      level: "L2_CORPUS_ARCHAEOLOGY",
      prof: "PROF-EBACMAP",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.EBACMAP.CASCADE.ACER",
      verdict: "ACCEPT_21V_SELF_HASH_CLOSEOUT_AS_SIBLING_REFERENCE"
    },
    {
      level: "L3_GRAMMAR",
      prof: "PROF-KERNEL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.KERNEL.GRAMMAR.ACER",
      verdict: "DIVERGED_DRAFT_SIBLINGS_PATTERN_CONTINUES"
    },
    {
      level: "L4_SCHEDULER",
      prof: "PROF-SCHEDULER",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.SCHEDULER.DECAY.ACER",
      verdict: "KEEP_BOTH_21S_ANCHORS_PENDING_OPERATOR_DECISION"
    },
    {
      level: "L5_COMMS",
      prof: "PROF-COMMS",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.COMMS.BILATERAL.ACER",
      verdict: "NO_CONTENT_MIRROR_AND_NO_HASH_FABRICATION"
    },
    {
      level: "L6_COUNCIL",
      prof: "PROF-CHIEFCOUNCIL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.D50.COUNCIL.ACER",
      verdict: "FIVE_WAVE_DISSENT_PRESERVED_NO_RATIFICATION"
    },
    {
      level: "L7_APEX",
      prof: "COL-ASOLARIA",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.ASOLARIA.APEX.ACER",
      verdict: "NEXT_ACTION_IS_OPERATOR_PASTE_OR_EXPLICIT_RECONCILIATION_ONLY"
    }
  ];

  const nextGateMatrix = [
    {
      gate: "21H_D11_CONTENT_MIRROR",
      status: "BLOCKED_ON_OPERATOR_PASTE",
      needed: "Liris base D11 + Falcon addendum content, and ACER timestamp-drift/Wave artifacts in the reverse direction.",
      forbidden: "peer call, direct disk write, autonomous transfer"
    },
    {
      gate: "21S_SCHEDULE_ANCHOR",
      status: "DIVERGED_VALID_UNDER_HOLD",
      needed: "operator-direct or later supervisor choice between ACER event-time anchor and Liris ledger-date/window anchor",
      forbidden: "implicit reconciliation"
    },
    {
      gate: "21R_VISION_DISPOSITION",
      status: "ASYMMETRIC_OPEN",
      needed: "PROF-VISION final return or operator-direct disposition choice",
      forbidden: "fabricated witness result"
    },
    {
      gate: "CHIEFCOUNCIL_DISSENT",
      status: "PRESERVED_STANDING_5_WAVE",
      needed: "explicit dissent disposition before any ratification/promotion",
      forbidden: "ratification bypass"
    },
    {
      gate: "21V_SELF_HASH_CLOSEOUT",
      status: "RECORDED_BY_REFERENCE",
      needed: "full Liris content only if later reconciliation is requested",
      forbidden: "parent manifest mutation or Merkle recompute"
    }
  ];

  const state = {
    schema: "federation-reintegration-wave21wx-liris-21tv-return.v1",
    runId,
    generatedAt,
    status: "DRAFT_ONLY_NOT_RATIFIED",
    relationship: "LIRIS_21T_21V_RECORDED_NEXT_GATE_MATRIX_EMITTED",
    policy: {
      ownMcpOnly: true,
      noExteriorMcp: true,
      noDirectPeerActions: true,
      noModelFanout: true,
      noDeviceActions: true,
      noPromotion: true,
      noEmit: true,
      noEd25519: true,
      noEndpointAction: true,
      noPeerCall: true,
      noQuorumOutreach: true,
      noCensusAdmission: true,
      noContentMirrorExecuted: true,
      noPayloadTransfer: true,
      noCanonicalOverwrite: true,
      noWriteToLirisDiskByAcer: true,
      noScheduleReconciliation: true,
      noVisionDispositionChoice: true,
      noHashFabrication: true,
      noParentManifestModification: true,
      noMerkleRecompute: true,
      chiefCouncilDissentPreserved: true
    },
    sourceStatus: Object.fromEntries(Object.entries(INPUTS).map(([key, value]) => [key, sourceStatus(value)])),
    upstream: {
      wave21tStatus: wave21t.status || null,
      wave21tRelationship: wave21t.relationship || null,
      wave21tIntakeHash: wave21t.intakeHash || null,
      wave21mManifestSha256: wave21m.lirisManifest?.sha256 || "061e81bf2962e6f88ea1ad82a2c8b8a30a3461ed68167b23eb665b777ee384b4",
      wave21nqrsPlanHash: wave21nqrs.planHash || null,
      wave21HGate: "STILL_REQUIRES_OPERATOR_MEDIATED_PASTE_ACTION"
    },
    liris,
    acerReference: {
      wave21tD50: acer21tD50,
      note: "Liris 21T recorded ACER existence by reference and did not compute ACER hashes from unavailable content."
    },
    lirisAggregate: {
      totalWave21ArtifactsReported: 15,
      cumulativeRegistryCountBefore21T21V: 13,
      combinedLineCountReported: 1483,
      chiefCouncilDissent: "5-wave standing, preserved unchanged"
    },
    carriedForwardAsymmetries: [
      "A1 21S schedule anchor mismatch",
      "A2 21R vision disposition mismatch",
      "A3 21H D11 content mirror still pending",
      "A4 ACER hashes not transmitted to Liris by content; Liris used noHashFabrication"
    ],
    supervisorLevels,
    nextGateMatrix,
    draftWrites: [
      { wave: "21W", path: repoRel(OUTPUTS.wave21w), class: "Liris 21T/21V return intake" },
      { wave: "21X", path: repoRel(OUTPUTS.wave21x), class: "cascade next-gate matrix" }
    ],
    boundary: "Wave 21W/21X draft cascade only. Records operator-relayed Liris Wave 21T/21V hashes and emits the next-gate matrix. No content transfer, no overwrite, no schedule reconciliation, no vision disposition choice, no hash fabrication, no parent manifest modification, no Merkle recompute, no peer endpoint, no payload transfer, no Liris disk write by ACER, no MCP invocation, no exterior MCP, no model fanout, no device action, no emit, no ed25519, no quorum outreach, no census admission, no PID mint, no quarantine lift, no promotion."
  };
  state.stateHash = sha256Text(JSON.stringify(state));
  return state;
}

function buildWave21w(state) {
  const lines = [];
  lines.push("# D50 Liris Wave 21T/21V Return Intake");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Status: ${state.status}`);
  lines.push(`Relationship: ${state.relationship}`);
  lines.push("");
  lines.push("## Liris Return");
  lines.push("");
  lines.push("| Wave | Liris path | Lines | sha256 |");
  lines.push("|------|------------|-------|--------|");
  for (const wave of ["21T", "21V"]) {
    const row = state.liris[wave];
    lines.push(`| ${wave} | \`${row.path}\` | ${row.lines} | \`${row.sha256}\` |`);
  }
  lines.push("");
  lines.push("## ACER Reference");
  lines.push("");
  lines.push(`- ACER Wave 21T D50: \`${state.acerReference.wave21tD50.path}\`.`);
  lines.push(`- ACER Wave 21T D50 lines: ${state.acerReference.wave21tD50.lines}.`);
  lines.push(`- ACER Wave 21T D50 sha256: \`${state.acerReference.wave21tD50.sha256}\`.`);
  lines.push("");
  lines.push("## Aggregate Liris State");
  lines.push("");
  lines.push(`- Total Liris-side Wave 21 artifacts reported: ${state.lirisAggregate.totalWave21ArtifactsReported}.`);
  lines.push(`- Cumulative registry count before 21T/21V: ${state.lirisAggregate.cumulativeRegistryCountBefore21T21V}.`);
  lines.push(`- Combined line count reported: ${state.lirisAggregate.combinedLineCountReported}.`);
  lines.push(`- CHIEFCOUNCIL dissent: ${state.lirisAggregate.chiefCouncilDissent}.`);
  lines.push("");
  lines.push("## Carried-Forward Asymmetries");
  lines.push("");
  for (const item of state.carriedForwardAsymmetries) lines.push(`- ${item}.`);
  lines.push("");
  lines.push("## Boundary");
  lines.push("");
  lines.push(state.boundary);
  return lines.join("\n");
}

function buildWave21x(state) {
  const lines = [];
  lines.push("# D50 Wave 21X - Cascade Next-Gate Matrix (ACER)");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Status: ${state.status}`);
  lines.push("");
  lines.push("## Matrix");
  lines.push("");
  lines.push("| Gate | Status | Needed | Forbidden |");
  lines.push("|------|--------|--------|-----------|");
  for (const row of state.nextGateMatrix) {
    lines.push(`| ${row.gate} | ${row.status} | ${row.needed} | ${row.forbidden} |`);
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

function buildMap(state) {
  return {
    mapId: "federation-reintegration-wave21wx-liris-21tv-return-map.v1",
    generatedAt,
    nodes: [
      { id: "wave21w", kind: "hash_intake", status: state.status },
      { id: "wave21x", kind: "next_gate_matrix", status: state.status },
      { id: "liris-21t", kind: "operator_relay_hash", sha256: state.liris["21T"].sha256 },
      { id: "liris-21v", kind: "operator_relay_hash", sha256: state.liris["21V"].sha256 },
      ...state.nextGateMatrix.map((row) => ({ id: row.gate, kind: "gate", status: row.status })),
      ...state.supervisorLevels.map((row) => ({ id: row.supervisorPid, kind: "supervisor_pid", level: row.level, verdict: row.verdict }))
    ],
    edges: [
      { from: "wave21w", to: "liris-21t", relation: "records" },
      { from: "wave21w", to: "liris-21v", relation: "records" },
      ...state.nextGateMatrix.map((row) => ({ from: "wave21x", to: row.gate, relation: "tracks" })),
      ...state.supervisorLevels.map((row) => ({ from: "wave21x", to: row.supervisorPid, relation: "gated_by" }))
    ],
    boundary: state.boundary
  };
}

function buildGlpj(state) {
  return {
    glpjId: "federation-reintegration-wave21wx-liris-21tv-return.glpj",
    generatedAt,
    family: "federation",
    d11: "RETURN_INTAKE_AND_NEXT_GATE_MATRIX_ONLY",
    glyphs: state.supervisorLevels.map((row, index) => ({
      token: `FED-WAVE21WX-L${index}`,
      level: row.level,
      prof: row.prof,
      supervisorPid: row.supervisorPid,
      verdict: row.verdict
    })),
    outputs: state.draftWrites,
    boundary: state.boundary
  };
}

function buildReport(state) {
  const lines = [];
  lines.push("# Federation Reintegration Wave 21W/21X Liris 21T/21V Return");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Status: ${state.status}`);
  lines.push(`State hash: ${state.stateHash}`);
  lines.push("");
  lines.push("## Result");
  lines.push("");
  lines.push("- Liris Wave 21T and 21V hashes are recorded.");
  lines.push("- ACER emitted a next-gate matrix instead of resolving asymmetries automatically.");
  lines.push("- Wave 21H remains blocked on operator-mediated paste.");
  lines.push("- CHIEFCOUNCIL dissent remains preserved.");
  lines.push("");
  lines.push("## Supervisor Levels");
  lines.push("");
  for (const row of state.supervisorLevels) lines.push(`- ${row.level} / ${row.prof}: ${row.verdict}`);
  lines.push("");
  lines.push("## Boundary");
  lines.push("");
  lines.push(state.boundary);
  return lines.join("\n");
}

function main() {
  const state = buildState();
  const artifacts = Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)]));
  const memory = {
    memoryId: "federation-reintegration-wave21wx-liris-21tv-return.v1",
    generatedAt,
    status: state.status,
    relationship: state.relationship,
    significance: "Liris Wave 21T/21V hashes were recorded on ACER and the next-gate matrix was emitted without content transfer or reconciliation.",
    stateHash: state.stateHash,
    artifacts,
    boundary: state.boundary
  };

  writeJson(OUTPUTS.state, state);
  writeText(OUTPUTS.wave21w, buildWave21w(state));
  writeText(OUTPUTS.wave21x, buildWave21x(state));
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
    draftWrites: state.draftWrites.map((row) => row.path),
    report: repoRel(OUTPUTS.report),
    boundary: state.boundary
  }, null, 2));
}

main();
