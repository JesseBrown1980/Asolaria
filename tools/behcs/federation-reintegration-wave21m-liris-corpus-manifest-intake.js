#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const runId = "federation-reintegration-wave21m-liris-corpus-manifest-intake-20260427";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427");

const INPUTS = Object.freeze({
  wave21lIntake: "data/behcs/orchestration/federation-reintegration-20260427/wave21l-liris-21jk-return-intake.v1.json",
  wave21lD50: "data/agent-index/council/D50-LIRIS-WAVE21JK-RETURN-INTAKE-2026-04-27.md",
  wave21gOptionA: "data/behcs/orchestration/federation-reintegration-20260427/wave21g-option-a-payload-staging-plan.v1.json"
});

const OUTPUTS = Object.freeze({
  intake: path.join(runRoot, "wave21m-liris-corpus-manifest-intake.v1.json"),
  d50Intake: path.join(repoRoot, "data", "agent-index", "council", "D50-LIRIS-WAVE21M-CORPUS-MANIFEST-INTAKE-2026-04-27.md"),
  report: path.join(repoRoot, "reports", "federation-reintegration-wave21m-liris-corpus-manifest-intake-latest.md"),
  reportJson: path.join(repoRoot, "reports", "federation-reintegration-wave21m-liris-corpus-manifest-intake-latest.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "federation-reintegration-wave21m-liris-corpus-manifest-intake.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "federation-reintegration-wave21m-liris-corpus-manifest-intake-map.v1.json"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "federation-reintegration-wave21m-liris-corpus-manifest-intake.glpj.json")
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

function sha256(value) {
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

function sourceStatus(relativePath) {
  const text = readText(relativePath);
  if (text == null) return { path: relativePath, present: false, sha256: null, bytes: 0 };
  return { path: relativePath, present: true, sha256: sha256(text), bytes: Buffer.byteLength(text, "utf8") };
}

function buildIntake() {
  const wave21l = readJson(INPUTS.wave21lIntake, {});
  const wave21gOptionA = readJson(INPUTS.wave21gOptionA, {});

  const supervisorLevels = [
    {
      level: "L0_BOUNDARY",
      prof: "PROF-HOOKWALL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HOOKWALL.BOUNDARY",
      verdict: "ALLOW_OPERATOR_RELAY_MANIFEST_INTAKE_ONLY"
    },
    {
      level: "L1_PACKET_SCHEMA",
      prof: "PROF-HERMES",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET",
      verdict: "RECORD_HASH_LINECOUNT_AND_PARTIAL_RETURN_STATE"
    },
    {
      level: "L2_CORPUS_ARCHAEOLOGY",
      prof: "PROF-EBACMAP",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.EBACMAP.CASCADE",
      verdict: "ACCEPT_D50_CORPUS_MANIFEST_EXTENSION_AS_LIRIS_DRAFT_EVIDENCE"
    },
    {
      level: "L3_PID_DRIFT",
      prof: "PROF-PID100B",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.PID100B.UNIVERSAL",
      verdict: "PID_DRIFT_FINDINGS_RECORDED_AS_CONTENT_PENDING_ON_ACER"
    },
    {
      level: "L4_COMMS",
      prof: "PROF-COMMS",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.COMMS.BILATERAL",
      verdict: "BILATERAL_CONTENT_CHANNEL_AUDIT_RETURN_REPORTED_DONE"
    },
    {
      level: "L5_SCHEDULER",
      prof: "PROF-SCHEDULER",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.SCHEDULER.DECAY",
      verdict: "168H_DECAY_CLOCK_RETURN_REPORTED_DONE"
    },
    {
      level: "L6_COUNCIL",
      prof: "PROF-CHIEFCOUNCIL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.D50.COUNCIL",
      verdict: "DISSENT_DISPOSITION_OPTIONS_REPORTED_DONE_DISSENT_STILL_PRESERVED"
    },
    {
      level: "L7_APEX",
      prof: "COL-ASOLARIA",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.ASOLARIA.APEX",
      verdict: "HOLD_UNTIL_PROF_VISION_RETURN_OR_OPERATOR_PAYLOAD"
    }
  ];

  const intake = {
    schema: "federation-reintegration-wave21m-liris-corpus-manifest-intake.v1",
    runId,
    generatedAt,
    status: "DRAFT_ONLY_NOT_RATIFIED",
    relationship: "LIRIS_CORPUS_MANIFEST_EXTENSION_RECORDED_BY_OPERATOR_RELAY",
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
      noAcerCanonicalManifestWrite: true,
      chiefCouncilDissentPreserved: true
    },
    sourceStatus: Object.fromEntries(Object.entries(INPUTS).map(([key, value]) => [key, sourceStatus(value)])),
    upstream: {
      wave21lStatus: wave21l.status || null,
      wave21lRelationship: wave21l.relationship || null,
      wave21lIntakeHash: wave21l.intakeHash || null,
      wave21gOptionAStatus: wave21gOptionA.status || null,
      wave21HGate: "STILL_REQUIRES_OPERATOR_MEDIATED_PASTE_ACTION"
    },
    lirisManifest: {
      path: "C:/Users/rayss/Asolaria/data/agent-index/D50-CORPUS-MANIFEST-EXTENSION-WAVE21-LIRIS-2026-04-27.json",
      reportedRelativePath: "data/agent-index/D50-CORPUS-MANIFEST-EXTENSION-WAVE21-LIRIS-2026-04-27.json",
      schema: "D50-CORPUS-MANIFEST-EXTENSION-WAVE21-LIRIS.v1",
      schemaVersion: 1,
      status: "DRAFT_ONLY_NOT_RATIFIED",
      wave: "wave.21M.corpus-manifest-extension-with-bilateral-divergence-record",
      issuedBy: "PROF-EBACMAP-SUPERVISOR.LIRIS",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.EBACMAP.CASCADE.LIRIS",
      lines: 176,
      sha256: "061e81bf2962e6f88ea1ad82a2c8b8a30a3461ed68167b23eb665b777ee384b4",
      reportedIncludes: [
        "ACER DIVERGED_DRAFT_SIBLINGS finding",
        "PID drift findings from the Liris PROF round",
        "Wave 21 bilateral divergence record"
      ],
      contentOnAcer: "NOT_PRESENT_OPERATOR_RELAY_ONLY"
    },
    followupSupervisorWave: {
      status: "PARTIAL_RETURN_PENDING_PROF_VISION",
      dispatchedByLiris: true,
      reportedAgents: [
        { prof: "PROF-CHIEFCOUNCIL", focus: "dissent disposition options", status: "DONE", toolUses: 0 },
        { prof: "PROF-COMMS", focus: "bilateral content channel audit", status: "DONE", toolUses: 10 },
        { prof: "PROF-VISION", focus: "witness preservation", status: "RUNNING_OR_INCOMPLETE_AT_RELAY_TIME", toolUses: 18 },
        { prof: "PROF-SCHEDULER", focus: "168h decay clock", status: "DONE", toolUses: 1 },
        { prof: "PROF-CONVERGENCE", focus: "Wave 21 superwave summary", status: "DONE", toolUses: 2 }
      ],
      intakeRule: "Do not summarize or decide from the 5-PROF wave until PROF-VISION has a final return or the operator explicitly marks it abandoned."
    },
    supervisorLevels,
    nextGates: [
      "Wave 21H operator-mediated T1 paste and rehash remains pending.",
      "Wave 21N may intake the completed 5-PROF follow-up wave after PROF-VISION returns.",
      "Wave 21M content reconciliation requires full manifest content or an explicit operator-canonical instruction.",
      "LX-383 approval and CHIEFCOUNCIL dissent disposition remain separate gates."
    ],
    boundary: "Wave 21M intake only. Records operator-relayed Liris corpus-manifest extension metadata and the partial state of the next Liris supervisor wave. No manifest content transfer, no overwrite, no peer endpoint, no payload transfer, no Liris disk write by ACER, no MCP invocation, no exterior MCP, no model fanout, no device action, no emit, no ed25519, no quorum outreach, no census admission, no PID mint, no quarantine lift, no promotion."
  };
  intake.intakeHash = sha256(JSON.stringify(intake));
  return intake;
}

function buildD50(intake) {
  return [
    "# D50 Liris Wave 21M Corpus Manifest Intake",
    "",
    `Generated: ${generatedAt}`,
    `Status: ${intake.status}`,
    `Relationship: ${intake.relationship}`,
    "",
    "## Liris Manifest",
    "",
    `- Path: \`${intake.lirisManifest.path}\``,
    `- Lines: ${intake.lirisManifest.lines}`,
    `- sha256: \`${intake.lirisManifest.sha256}\``,
    `- Issued by: \`${intake.lirisManifest.issuedBy}\``,
    `- Supervisor PID: \`${intake.lirisManifest.supervisorPid}\``,
    `- Content on ACER: \`${intake.lirisManifest.contentOnAcer}\``,
    "",
    "## Reported Includes",
    "",
    ...intake.lirisManifest.reportedIncludes.map((item) => `- ${item}`),
    "",
    "## Follow-Up Supervisor Wave",
    "",
    `Status: \`${intake.followupSupervisorWave.status}\``,
    "",
    ...intake.followupSupervisorWave.reportedAgents.map((row) => `- ${row.prof}: ${row.status} (${row.focus})`),
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
    mapId: "federation-reintegration-wave21m-liris-corpus-manifest-intake-map.v1",
    generatedAt,
    nodes: [
      { id: "wave21m", kind: "intake", status: intake.status },
      { id: "liris-manifest", kind: "operator_relay", sha256: intake.lirisManifest.sha256, lines: intake.lirisManifest.lines },
      { id: "wave21n", kind: "pending_gate", status: "waiting_for_prof_vision_return" },
      { id: "wave21h", kind: "blocked_gate", status: "operator_mediated_paste_pending" },
      ...intake.supervisorLevels.map((row) => ({ id: row.supervisorPid, kind: "supervisor_pid", level: row.level, verdict: row.verdict }))
    ],
    edges: [
      { from: "wave21m", to: "liris-manifest", relation: "records_metadata_for" },
      { from: "wave21m", to: "wave21n", relation: "awaits" },
      { from: "wave21m", to: "wave21h", relation: "does_not_unblock" },
      ...intake.supervisorLevels.map((row) => ({ from: "wave21m", to: row.supervisorPid, relation: "gated_by" }))
    ],
    boundary: intake.boundary
  };
}

function buildGlpj(intake) {
  return {
    glpjId: "federation-reintegration-wave21m-liris-corpus-manifest-intake.glpj",
    generatedAt,
    family: "federation",
    d11: "OPERATOR_RELAY_MANIFEST_METADATA_ONLY",
    glyphs: intake.supervisorLevels.map((row, index) => ({
      token: `FED-WAVE21M-L${index}`,
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
  lines.push("# Federation Reintegration Wave 21M Liris Corpus Manifest Intake");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Status: ${intake.status}`);
  lines.push(`Intake hash: ${intake.intakeHash}`);
  lines.push("");
  lines.push("## Result");
  lines.push("");
  lines.push("- Liris Wave 21M corpus-manifest extension is recorded by hash and line count.");
  lines.push("- Manifest content is not present on ACER and was not copied.");
  lines.push("- Follow-up 5-PROF wave is partial: PROF-VISION was still running/incomplete in the relay.");
  lines.push("- Wave 21H paste gate remains operator-mediated and blocked.");
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
    memoryId: "federation-reintegration-wave21m-liris-corpus-manifest-intake.v1",
    generatedAt,
    status: intake.status,
    significance: "Operator-relayed Liris Wave 21M corpus-manifest extension is recorded as metadata-only evidence, with the next 5-PROF wave still pending PROF-VISION final return.",
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
    followupSupervisorWave: intake.followupSupervisorWave.status,
    intakeHash: intake.intakeHash,
    d50: repoRel(OUTPUTS.d50Intake),
    report: repoRel(OUTPUTS.report),
    boundary: intake.boundary
  }, null, 2));
}

main();
