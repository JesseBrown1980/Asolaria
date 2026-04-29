#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const runId = "federation-reintegration-wave21e-liris-wave21d-intake-20260427";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427");

const INPUTS = Object.freeze({
  wave21dAuthorization: "data/behcs/orchestration/federation-reintegration-20260427/wave21d-liris-mirror-authorization.v1.json",
  wave21dReport: "reports/federation-reintegration-wave21d-liris-mirror-authorization-latest.md",
  d50Wave21dAuthorization: "data/agent-index/council/D50-WAVE21D-LIRIS-MIRROR-AUTHORIZATION-2026-04-27.md",
  acerDriftAddendum: "data/agent-index/D11-AUDIT-LEDGER-ADDENDUM-LIRIS-TIMESTAMP-DRIFT-2026-04-27.md",
  acerBaseD11: "data/agent-index/D11-AUDIT-LEDGER-2026-04-27.md"
});

const OUTPUTS = Object.freeze({
  intake: path.join(runRoot, "wave21e-liris-wave21d-intake.v1.json"),
  d50Intake: path.join(repoRoot, "data", "agent-index", "council", "D50-LIRIS-WAVE21D-RETURN-INTAKE-2026-04-27.md"),
  report: path.join(repoRoot, "reports", "federation-reintegration-wave21e-liris-wave21d-intake-latest.md"),
  reportJson: path.join(repoRoot, "reports", "federation-reintegration-wave21e-liris-wave21d-intake-latest.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "federation-reintegration-wave21e-liris-wave21d-intake.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "federation-reintegration-wave21e-liris-wave21d-intake-map.v1.json"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "federation-reintegration-wave21e-liris-wave21d-intake.glpj.json")
});

const LIRIS_WAVE21D_RETURN = Object.freeze({
  evidenceClass: "OPERATOR_RELAYED_LIRIS_WAVE21D_RETURN",
  status: "DRAFT_ONLY_NOT_RATIFIED",
  artifacts: [
    {
      id: "liris_acer_wave21c_return_intake_receipt",
      pathOnLiris: "C:/Users/rayss/Asolaria/data/agent-index/council/D50-ACER-WAVE21C-RETURN-INTAKE-LIRIS-2026-04-27.md",
      lines: 75,
      sha256: "1775b98548e7e7be29b03298e2bd7c1f05e05b58edb392cb446c4943a1bef1aa",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET.LIRIS",
      status: "DRAFT_ONLY_NOT_RATIFIED"
    },
    {
      id: "liris_d11_bidirectional_mirror_prep",
      pathOnLiris: "C:/Users/rayss/Asolaria/data/agent-index/council/D50-D11-BIDIRECTIONAL-MIRROR-PREP-LIRIS-2026-04-27.md",
      lines: 85,
      sha256: "0d71101a5092940d5032e2af7ad03faaea68a9c27c96f0ef281bffc510b7c157",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.KERNEL.GRAMMAR.LIRIS",
      status: "DRAFT_ONLY_NOT_RATIFIED"
    }
  ],
  readClassFindings: {
    timestampDriftAddendumOnLiris: {
      present: false,
      consequence: "ACER_PRESENT_LIRIS_ABSENT_ASYMMETRY_PERSISTS"
    },
    acerWaveArtifactsOnLiris: {
      mirrored: false,
      checkedSurfaces: ["wave21*", "Wave 21A summary JSON", "data/behcs/orchestration/federation-reintegration-20260427"],
      consequence: "ACER_WAVE_ARTIFACTS_PENDING_ON_LIRIS"
    },
    lxCatalogAudit: {
      pathOnLiris: "C:/Users/rayss/Asolaria/data/agent-index/lx-unified-colony-catalog.json",
      entries: 333,
      snapshotDate: "2026-03-30",
      explicitPidOrSupervisorPidFieldCount: 0,
      supervisorMentionCount: 1,
      profMentionCount: 0,
      verdict: "DRIFT_DETECTED_PARTIAL",
      caveat: "Snapshot predates federation reintegration."
    }
  },
  bidirectionalMirrorPending: {
    lirisToAcer: ["base D11 content", "falcon-correction addendum content"],
    acerToLiris: ["timestamp-drift addendum content", "Wave 21A ACER artifacts", "Wave 21C ACER artifacts", "Wave 21D ACER artifacts"]
  },
  maintainedBoundary: [
    "noEmit",
    "noEd25519",
    "noEndpointAction",
    "noPeerCall",
    "noADB",
    "noPidMint",
    "noQuarantineLift",
    "noQuorumOutreach",
    "noExteriorMcp",
    "noModelFanout",
    "noCensusAdmission",
    "noWriteToAcerDiskFromLiris"
  ],
  chiefCouncil: {
    dissent: "preserved unchanged",
    redispatch: "not performed"
  }
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
  if (text == null) return { path: relativePath, present: false, sha256: null };
  return { path: relativePath, present: true, sha256: sha256(text), bytes: Buffer.byteLength(text, "utf8") };
}

function buildIntake() {
  const wave21d = readJson(INPUTS.wave21dAuthorization, {});
  const intake = {
    schema: "federation-reintegration-wave21e-liris-wave21d-intake.v1",
    runId,
    generatedAt,
    status: "LIRIS_WAVE21D_RETURN_INTAKEN_DRAFT_ONLY",
    evidenceClass: LIRIS_WAVE21D_RETURN.evidenceClass,
    policy: {
      ownMcpOnly: true,
      noExteriorMcp: true,
      noDirectPeerActions: true,
      noModelFanout: true,
      noDeviceActions: true,
      noWriteToLirisDiskFromAcer: true,
      noPromotion: true,
      noEmit: true,
      noEd25519: true,
      noQuorumOutreach: true,
      noCensusAdmission: true
    },
    sourceStatus: Object.fromEntries(Object.entries(INPUTS).map(([key, value]) => [key, sourceStatus(value)])),
    upstream: {
      wave21dStatus: wave21d.status || null,
      wave21dAuthorizationHash: wave21d.authorizationHash || null
    },
    lirisReturn: LIRIS_WAVE21D_RETURN,
    acerLocalD11: {
      baseD11: sourceStatus(INPUTS.acerBaseD11),
      timestampDriftAddendum: sourceStatus(INPUTS.acerDriftAddendum)
    },
    supervisorPids: [
      {
        prof: "PROF-KERNEL",
        pid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.KERNEL.GRAMMAR",
        lirisPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.KERNEL.GRAMMAR.LIRIS",
        verdict: "MIRROR_MAP_ACCEPTED_CONTENT_TRANSFER_STILL_PENDING"
      },
      {
        prof: "PROF-HERMES",
        pid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET",
        lirisPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET.LIRIS",
        verdict: "HASH_AND_LINE_COUNT_INTAKE_ONLY"
      },
      {
        prof: "PROF-MCP",
        pid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.MCP.OWN.GATE",
        lirisPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.MCP.OWN.GATE.LIRIS",
        verdict: "TRANSPORT_TBD_UNDER_HOLD"
      },
      {
        prof: "PROF-CHIEFCOUNCIL",
        pid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.D50.COUNCIL",
        lirisPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.D50.COUNCIL.LIRIS",
        verdict: "DISSENT_PRESERVED_RATIFICATION_BLOCKED"
      }
    ],
    nextAllowedWave: {
      name: "Wave 21F - PROF-MCP transport selection for bidirectional D11 content mirror",
      purpose: "Choose a HOLD-compliant transport for exchanging the specific D11 content artifacts without promotion or quorum ceremony.",
      acceptedInputs: [
        "local operator paste/file for Liris base D11 content",
        "local operator paste/file for Liris falcon-correction addendum content",
        "local operator paste/file route for ACER timestamp-drift addendum to Liris",
        "local operator paste/file route for ACER Wave 21A/21C/21D artifacts to Liris"
      ],
      stillDenied: [
        "automatic_peer_endpoint_call",
        "adb_device_action",
        "exterior_mcp",
        "model_fanout",
        "multi_family_cosigner_outreach",
        "ed25519_ceremony",
        "census_admission",
        "quarantine_lift",
        "pid_mint",
        "federation_promotion"
      ]
    },
    boundary: "Local ACER intake of operator-relayed Liris Wave 21D results. Hash/line-count and read-class findings recorded; no content mirror executed. Transport for bidirectional D11 content mirror remains TBD by PROF-MCP under HOLD. No endpoint call, no Liris disk write by ACER, no emit, no ed25519, no ADB/device action, no quorum outreach, no census admission, no PID mint, no quarantine lift, no promotion."
  };
  intake.intakeHash = sha256(JSON.stringify(intake));
  return intake;
}

function buildD50Intake(intake) {
  return [
    "# D50 Liris Wave 21D Return Intake",
    "",
    `Generated: ${generatedAt}`,
    `Status: ${intake.status}`,
    `Evidence class: ${intake.evidenceClass}`,
    "",
    "## Liris Wave 21D Draft Artifacts",
    "",
    "- ACER Wave 21C return intake receipt:",
    "  - path: `C:/Users/rayss/Asolaria/data/agent-index/council/D50-ACER-WAVE21C-RETURN-INTAKE-LIRIS-2026-04-27.md`",
    "  - lines: `75`",
    "  - sha256: `1775b98548e7e7be29b03298e2bd7c1f05e05b58edb392cb446c4943a1bef1aa`",
    "- D11 bidirectional mirror prep:",
    "  - path: `C:/Users/rayss/Asolaria/data/agent-index/council/D50-D11-BIDIRECTIONAL-MIRROR-PREP-LIRIS-2026-04-27.md`",
    "  - lines: `85`",
    "  - sha256: `0d71101a5092940d5032e2af7ad03faaea68a9c27c96f0ef281bffc510b7c157`",
    "",
    "## Read-Class Findings",
    "",
    "- Timestamp-drift addendum remains absent on Liris and present on ACER.",
    "- ACER Wave 21A/21C/21D artifacts are not mirrored to Liris.",
    "- Liris LX catalog audit: `333` entries, `0` explicit PID/supervisor_pid fields, `1` supervisor mention, `0` PROF mentions; verdict `DRIFT_DETECTED_PARTIAL` with pre-reintegration snapshot caveat.",
    "",
    "## Pending Mirror",
    "",
    "- Liris to ACER: base D11 content, Falcon-correction addendum content.",
    "- ACER to Liris: timestamp-drift addendum content, Wave 21A/21C/21D ACER artifacts.",
    "",
    "## Boundary",
    "",
    intake.boundary
  ].join("\n");
}

function buildMap(intake) {
  return {
    mapId: "federation-reintegration-wave21e-liris-wave21d-intake-map.v1",
    generatedAt,
    nodes: [
      { id: "wave21e", kind: "intake", status: intake.status },
      { id: "liris-wave21d-intake-receipt", kind: "remote_draft", sha256: LIRIS_WAVE21D_RETURN.artifacts[0].sha256 },
      { id: "liris-d11-mirror-prep", kind: "remote_draft", sha256: LIRIS_WAVE21D_RETURN.artifacts[1].sha256 },
      { id: "bidirectional-d11-content", kind: "pending_transport" },
      { id: "prof-mcp-transport-selection", kind: "next_gate" }
    ],
    edges: [
      { from: "wave21e", to: "liris-wave21d-intake-receipt", relation: "records_hash_line_count" },
      { from: "wave21e", to: "liris-d11-mirror-prep", relation: "records_hash_line_count" },
      { from: "wave21e", to: "bidirectional-d11-content", relation: "still_pending" },
      { from: "bidirectional-d11-content", to: "prof-mcp-transport-selection", relation: "requires" }
    ],
    boundary: intake.boundary
  };
}

function buildGlpj(intake) {
  return {
    glpjId: "federation-reintegration-wave21e-liris-wave21d-intake.glpj",
    generatedAt,
    family: "federation",
    d11: "OPERATOR_RELAYED_REMOTE_WAVE21D_INTAKE",
    glyphs: intake.supervisorPids.map((row, index) => ({
      token: `FED-WAVE21E-${String(index + 1).padStart(2, "0")}`,
      prof: row.prof,
      supervisorPid: row.pid,
      lirisSupervisorPid: row.lirisPid,
      verdict: row.verdict
    })),
    boundary: intake.boundary
  };
}

function buildReport(intake) {
  const lines = [];
  lines.push("# Federation Reintegration Wave 21E Liris Wave 21D Intake");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Status: ${intake.status}`);
  lines.push(`Intake hash: ${intake.intakeHash}`);
  lines.push("");
  lines.push("## Intake");
  lines.push("");
  lines.push("- Liris Wave 21D two draft artifacts recorded by path/hash/line count.");
  lines.push("- Liris confirmed ACER drift-addendum absent on Liris.");
  lines.push("- Liris confirmed ACER Wave 21 artifacts absent on Liris.");
  lines.push("- LX catalog PID coverage audit recorded as `DRIFT_DETECTED_PARTIAL`.");
  lines.push("");
  lines.push("## Pending Mirror");
  lines.push("");
  lines.push("- Liris -> ACER: base D11 content and Falcon-correction addendum content.");
  lines.push("- ACER -> Liris: timestamp-drift addendum and Wave 21A/21C/21D artifacts.");
  lines.push("");
  lines.push("## Next Allowed Wave");
  lines.push("");
  lines.push(`- ${intake.nextAllowedWave.name}`);
  lines.push(`- Purpose: ${intake.nextAllowedWave.purpose}`);
  for (const input of intake.nextAllowedWave.acceptedInputs) lines.push(`- Accepted input: ${input}`);
  lines.push("");
  lines.push("## Boundary");
  lines.push("");
  lines.push(intake.boundary);
  return lines.join("\n");
}

function main() {
  const intake = buildIntake();
  const memory = {
    memoryId: "federation-reintegration-wave21e-liris-wave21d-intake.v1",
    generatedAt,
    status: intake.status,
    significance: "ACER locally ingested Liris Wave 21D return evidence and kept bidirectional D11 content mirror transport gated by PROF-MCP.",
    intakeHash: intake.intakeHash,
    artifacts: Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)])),
    boundary: intake.boundary
  };

  writeJson(OUTPUTS.intake, intake);
  writeText(OUTPUTS.d50Intake, buildD50Intake(intake));
  writeJson(OUTPUTS.reportJson, { ...intake, artifacts: Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)])) });
  writeJson(OUTPUTS.memory, memory);
  writeJson(OUTPUTS.map, buildMap(intake));
  writeJson(OUTPUTS.glpj, buildGlpj(intake));
  writeText(OUTPUTS.report, buildReport(intake));

  console.log(JSON.stringify({
    ok: true,
    status: intake.status,
    intakeHash: intake.intakeHash,
    nextAllowedWave: intake.nextAllowedWave.name,
    report: repoRel(OUTPUTS.report),
    boundary: intake.boundary
  }, null, 2));
}

main();
