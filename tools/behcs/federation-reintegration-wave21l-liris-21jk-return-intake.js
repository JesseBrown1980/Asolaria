#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const runId = "federation-reintegration-wave21l-liris-21jk-return-intake-20260427";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427");

const INPUTS = Object.freeze({
  wave21jkCascade: "data/behcs/orchestration/federation-reintegration-20260427/wave21jk-supervisor-cascade.v1.json",
  acerLx383: "data/agent-index/rule/LX-383.md",
  acerCascadeArchaeology: "data/agent-index/CASCADE-ARCHAEOLOGY-WAVE21-LIRIS-DISPATCH-CHAIN-2026-04-27.md",
  wave21gOptionA: "data/behcs/orchestration/federation-reintegration-20260427/wave21g-option-a-payload-staging-plan.v1.json"
});

const OUTPUTS = Object.freeze({
  intake: path.join(runRoot, "wave21l-liris-21jk-return-intake.v1.json"),
  d50Intake: path.join(repoRoot, "data", "agent-index", "council", "D50-LIRIS-WAVE21JK-RETURN-INTAKE-2026-04-27.md"),
  report: path.join(repoRoot, "reports", "federation-reintegration-wave21l-liris-21jk-return-intake-latest.md"),
  reportJson: path.join(repoRoot, "reports", "federation-reintegration-wave21l-liris-21jk-return-intake-latest.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "federation-reintegration-wave21l-liris-21jk-return-intake.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "federation-reintegration-wave21l-liris-21jk-return-intake-map.v1.json"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "federation-reintegration-wave21l-liris-21jk-return-intake.glpj.json")
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

function sha256Bytes(buffer) {
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
  const text = buffer.toString("utf8");
  const lineText = text.replace(/\r?\n$/, "");
  const lines = lineText.length ? lineText.split(/\r?\n/).length : 0;
  return {
    path: relativePath,
    present: true,
    lines,
    bytes: buffer.length,
    sha256: sha256Bytes(buffer)
  };
}

function buildIntake() {
  const wave21jk = readJson(INPUTS.wave21jkCascade, {});
  const wave21gOptionA = readJson(INPUTS.wave21gOptionA, {});
  const acer = {
    lx383: fileStatus(INPUTS.acerLx383),
    cascadeArchaeology: fileStatus(INPUTS.acerCascadeArchaeology)
  };

  const liris = {
    lx383: {
      path: "C:/Users/rayss/Asolaria/data/agent-index/rule/LX-383.md",
      reportedRelativePath: "data/agent-index/rule/LX-383.md",
      lines: 61,
      sha256: "c9ca40e47f3ef61144f38d428caf3dfd478cde3206abf109c1dd63acddc3dbb6",
      status: "DRAFT_ONLY_NOT_RATIFIED",
      note: "Sovereign-MCP doctrine codified into Liris LX canon with LX-rule frontmatter."
    },
    cascadeArchaeology: {
      path: "C:/Users/rayss/Asolaria/data/agent-index/CASCADE-ARCHAEOLOGY-WAVE21-LIRIS-DISPATCH-CHAIN-2026-04-27.md",
      reportedRelativePath: "data/agent-index/CASCADE-ARCHAEOLOGY-WAVE21-LIRIS-DISPATCH-CHAIN-2026-04-27.md",
      lines: 98,
      sha256: "cbdc324ed89c5cabcd0e3a703e8b4ff6920928b0880f65d72f16597bc3364c73",
      status: "DRAFT_ONLY_NOT_RATIFIED",
      note: "Records six Liris-side Wave 21B-21G artifacts, cohort counts, refusal table, and drift verdict."
    },
    totalWave21ArtifactsOnDisk: 8
  };

  const supervisorLevels = [
    {
      level: "L0_BOUNDARY",
      prof: "PROF-HOOKWALL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HOOKWALL.BOUNDARY",
      verdict: "ALLOW_OPERATOR_RELAY_INTAKE_ONLY"
    },
    {
      level: "L1_MCP_DOCTRINE",
      prof: "PROF-MCP",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.MCP.OWN.GATE",
      verdict: "RECORD_LIRIS_LX383_WITHOUT_MCP_INVOCATION"
    },
    {
      level: "L2_PACKET_SCHEMA",
      prof: "PROF-HERMES",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET",
      verdict: "HASH_AND_LINECOUNT_INTAKE_ONLY"
    },
    {
      level: "L3_GRAMMAR",
      prof: "PROF-KERNEL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.KERNEL.GRAMMAR",
      verdict: "DO_NOT_OVERWRITE_ACER_DRAFT_SIBLINGS"
    },
    {
      level: "L4_CASCADE_ARCHAEOLOGY",
      prof: "PROF-EBACMAP",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.EBACMAP.CASCADE.ARCHAEOLOGY",
      verdict: "CLASSIFY_AS_DIVERGED_DRAFT_SIBLINGS"
    },
    {
      level: "L5_TRUST_RISK",
      prof: "PROF-SHANNON",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.SHANNON.TRUST",
      verdict: "NO_PROMOTION_NO_CANONICAL_RECONCILIATION_WITHOUT_PAYLOAD"
    },
    {
      level: "L6_COUNCIL",
      prof: "PROF-CHIEFCOUNCIL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.D50.COUNCIL",
      verdict: "DISSENT_PRESERVED_NO_RATIFICATION"
    },
    {
      level: "L7_APEX",
      prof: "COL-ASOLARIA",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.ASOLARIA.APEX",
      verdict: "NEXT_GATE_REMAINS_OPERATOR_MEDIATED_WAVE21H_OR_D50_REVIEW"
    }
  ];

  const intake = {
    schema: "federation-reintegration-wave21l-liris-21jk-return-intake.v1",
    runId,
    generatedAt,
    status: "DRAFT_ONLY_NOT_RATIFIED",
    relationship: "DIVERGED_DRAFT_SIBLINGS",
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
      chiefCouncilDissentPreserved: true
    },
    upstream: {
      acerWave21jkStatus: wave21jk.status || null,
      acerWave21jkHash: wave21jk.cascadeHash || null,
      acerWave21gOptionAStatus: wave21gOptionA.status || null,
      lirisReturnSource: "operator-relayed Liris Wave 21K + Wave 21J completion summary",
      wave21HGate: "STILL_REQUIRES_OPERATOR_MEDIATED_PASTE_ACTION"
    },
    liris,
    acer,
    comparison: {
      lx383: {
        samePathClass: true,
        hashMatches: acer.lx383.sha256 === liris.lx383.sha256,
        lineCountMatches: acer.lx383.lines === liris.lx383.lines,
        disposition: "Liris LX-383 is Liris-side canon draft; ACER LX-383 remains ACER-local mirror draft until explicit reconciliation."
      },
      cascadeArchaeology: {
        samePathClass: true,
        hashMatches: acer.cascadeArchaeology.sha256 === liris.cascadeArchaeology.sha256,
        lineCountMatches: acer.cascadeArchaeology.lines === liris.cascadeArchaeology.lines,
        disposition: "Liris archaeology is richer Liris-side dispatch record; ACER archaeology remains ACER-local dispatch record until explicit reconciliation."
      }
    },
    supervisorLevels,
    nextGates: [
      "Wave 21H operator-mediated T1 paste and rehash remains pending.",
      "Wave 21M may reconcile Liris/ACER 21J/21K draft siblings only after operator supplies full Liris content or directs one side to become canonical.",
      "LX-383 still awaits operator approval plus CHIEFCOUNCIL dissent disposition before any promotion.",
      "No archaeology parent mutation is authorized by this intake."
    ],
    boundary: "Wave 21L intake only. Records operator-relayed Liris Wave 21J/21K hashes and the ACER/Liris draft divergence. No overwrite, no peer endpoint, no payload transfer, no Liris disk write by ACER, no MCP invocation, no exterior MCP, no model fanout, no device action, no emit, no ed25519, no quorum outreach, no census admission, no PID mint, no quarantine lift, no promotion."
  };
  intake.intakeHash = sha256Text(JSON.stringify(intake));
  return intake;
}

function buildD50(intake) {
  return [
    "# D50 Liris Wave 21J/21K Return Intake",
    "",
    `Generated: ${generatedAt}`,
    `Status: ${intake.status}`,
    `Relationship: ${intake.relationship}`,
    "",
    "## Liris Return",
    "",
    `- LX-383: ${intake.liris.lx383.lines} lines, sha256 \`${intake.liris.lx383.sha256}\`.`,
    `- Cascade archaeology: ${intake.liris.cascadeArchaeology.lines} lines, sha256 \`${intake.liris.cascadeArchaeology.sha256}\`.`,
    `- Total Liris-side Wave 21 artifacts reported on disk: ${intake.liris.totalWave21ArtifactsOnDisk}.`,
    "",
    "## ACER Local Siblings",
    "",
    `- LX-383: ${intake.acer.lx383.lines} lines, sha256 \`${intake.acer.lx383.sha256}\`.`,
    `- Cascade archaeology: ${intake.acer.cascadeArchaeology.lines} lines, sha256 \`${intake.acer.cascadeArchaeology.sha256}\`.`,
    "",
    "## Disposition",
    "",
    "- The Liris and ACER documents are draft siblings with different content, not an automatic conflict.",
    "- No side supersedes the other by this intake.",
    "- No overwrite or canonical reconciliation is authorized.",
    "- Wave 21H remains blocked on operator-mediated paste and rehash.",
    "",
    "## Per-Level Verdicts",
    "",
    ...intake.supervisorLevels.map((row) => `- ${row.level} / ${row.prof} / ${row.supervisorPid}: ${row.verdict}`),
    "",
    "## Boundary",
    "",
    intake.boundary
  ].join("\n");
}

function buildMap(intake) {
  return {
    mapId: "federation-reintegration-wave21l-liris-21jk-return-intake-map.v1",
    generatedAt,
    nodes: [
      { id: "wave21l", kind: "intake", status: intake.status, relationship: intake.relationship },
      { id: "liris-lx383", kind: "operator_relay", sha256: intake.liris.lx383.sha256 },
      { id: "acer-lx383", kind: "local_sibling", sha256: intake.acer.lx383.sha256 },
      { id: "liris-archaeology", kind: "operator_relay", sha256: intake.liris.cascadeArchaeology.sha256 },
      { id: "acer-archaeology", kind: "local_sibling", sha256: intake.acer.cascadeArchaeology.sha256 },
      { id: "wave21h", kind: "blocked_gate", status: "operator_mediated_paste_pending" },
      ...intake.supervisorLevels.map((row) => ({ id: row.supervisorPid, kind: "supervisor_pid", level: row.level, verdict: row.verdict }))
    ],
    edges: [
      { from: "wave21l", to: "liris-lx383", relation: "records" },
      { from: "wave21l", to: "acer-lx383", relation: "compares" },
      { from: "wave21l", to: "liris-archaeology", relation: "records" },
      { from: "wave21l", to: "acer-archaeology", relation: "compares" },
      { from: "wave21l", to: "wave21h", relation: "does_not_unblock" },
      ...intake.supervisorLevels.map((row) => ({ from: "wave21l", to: row.supervisorPid, relation: "gated_by" }))
    ],
    boundary: intake.boundary
  };
}

function buildGlpj(intake) {
  return {
    glpjId: "federation-reintegration-wave21l-liris-21jk-return-intake.glpj",
    generatedAt,
    family: "federation",
    d11: "OPERATOR_RELAY_INTAKE_ONLY",
    relationship: intake.relationship,
    glyphs: intake.supervisorLevels.map((row, index) => ({
      token: `FED-WAVE21L-L${index}`,
      level: row.level,
      prof: row.prof,
      supervisorPid: row.supervisorPid,
      verdict: row.verdict
    })),
    boundary: intake.boundary
  };
}

function buildReport(intake) {
  const lines = [];
  lines.push("# Federation Reintegration Wave 21L Liris 21J/21K Return Intake");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Status: ${intake.status}`);
  lines.push(`Relationship: ${intake.relationship}`);
  lines.push(`Intake hash: ${intake.intakeHash}`);
  lines.push("");
  lines.push("## Result");
  lines.push("");
  lines.push("- Liris Wave 21K and 21J are recorded as completed draft-only artifacts.");
  lines.push("- ACER local 21K and 21J artifacts are different draft siblings.");
  lines.push("- No reconciliation, overwrite, promotion, or payload transfer occurred.");
  lines.push("");
  lines.push("## Supervisor Levels");
  lines.push("");
  for (const row of intake.supervisorLevels) lines.push(`- ${row.level} / ${row.prof}: ${row.verdict}`);
  lines.push("");
  lines.push("## Boundary");
  lines.push("");
  lines.push(intake.boundary);
  return lines.join("\n");
}

function main() {
  const intake = buildIntake();
  const artifacts = Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)]));
  const memory = {
    memoryId: "federation-reintegration-wave21l-liris-21jk-return-intake.v1",
    generatedAt,
    status: intake.status,
    relationship: intake.relationship,
    significance: "Operator-relayed Liris Wave 21J/21K completion is recorded as draft-sibling divergence, preserving both Liris and ACER variants without overwrite or promotion.",
    intakeHash: intake.intakeHash,
    artifacts,
    boundary: intake.boundary
  };

  writeJson(OUTPUTS.intake, intake);
  writeText(OUTPUTS.d50Intake, buildD50(intake));
  writeJson(OUTPUTS.reportJson, { ...intake, artifacts });
  writeJson(OUTPUTS.memory, memory);
  writeJson(OUTPUTS.map, buildMap(intake));
  writeJson(OUTPUTS.glpj, buildGlpj(intake));
  writeText(OUTPUTS.report, buildReport(intake));

  console.log(JSON.stringify({
    ok: true,
    status: intake.status,
    relationship: intake.relationship,
    intakeHash: intake.intakeHash,
    d50: repoRel(OUTPUTS.d50Intake),
    report: repoRel(OUTPUTS.report),
    boundary: intake.boundary
  }, null, 2));
}

main();
