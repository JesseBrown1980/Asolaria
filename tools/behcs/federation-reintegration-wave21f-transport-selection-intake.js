#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const runId = "federation-reintegration-wave21f-transport-selection-intake-20260427";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427");

const INPUTS = Object.freeze({
  wave21eIntake: "data/behcs/orchestration/federation-reintegration-20260427/wave21e-liris-wave21d-intake.v1.json",
  wave21eReport: "reports/federation-reintegration-wave21e-liris-wave21d-intake-latest.md",
  d50Wave21e: "data/agent-index/council/D50-LIRIS-WAVE21D-RETURN-INTAKE-2026-04-27.md"
});

const OUTPUTS = Object.freeze({
  intake: path.join(runRoot, "wave21f-transport-selection-intake.v1.json"),
  d50Intake: path.join(repoRoot, "data", "agent-index", "council", "D50-LIRIS-WAVE21F-TRANSPORT-SELECTION-INTAKE-2026-04-27.md"),
  report: path.join(repoRoot, "reports", "federation-reintegration-wave21f-transport-selection-intake-latest.md"),
  reportJson: path.join(repoRoot, "reports", "federation-reintegration-wave21f-transport-selection-intake-latest.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "federation-reintegration-wave21f-transport-selection-intake.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "federation-reintegration-wave21f-transport-selection-intake-map.v1.json"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "federation-reintegration-wave21f-transport-selection-intake.glpj.json")
});

const LIRIS_WAVE21F_RETURN = Object.freeze({
  evidenceClass: "OPERATOR_RELAYED_LIRIS_WAVE21F_RETURN",
  status: "DRAFT_ONLY_NOT_RATIFIED",
  artifact: {
    pathOnLiris: "C:/Users/rayss/Asolaria/data/agent-index/council/D50-D11-MIRROR-TRANSPORT-SELECTION-LIRIS-2026-04-27.md",
    lines: 107,
    sha256: "94d3d6fd8f295313e78a38b7de3a39dfadef0e649322d968836c0bd1aabf10f1",
    status: "DRAFT_ONLY_NOT_RATIFIED"
  },
  supervisorReturns: [
    {
      prof: "PROF-MCP.LIRIS",
      verdict: "RECOMMEND_T1_PRIMARY_T2_FALLBACK",
      details: [
        "T3/T4 staged-not-invoked.",
        "T3 requires ed25519 and remains deferred.",
        "T4 routes through Gaia, which remains SSH_22_BLOCKED.",
        "runtime-settings.json declares ethernet_lan first-class.",
        "No standalone sovereign-mcp policy artifact found on Liris; gap noted.",
        "T5/T6 blocked by doctrine."
      ]
    },
    {
      prof: "PROF-KERNEL.LIRIS",
      verdict: "T1_FEASIBLE",
      details: [
        "Combined Liris to ACER payload is 257 lines / 16622 bytes.",
        "D11 base ledger is 165 lines / 10470 bytes / sha256 0a399d05b704fe1199e3da6150e41aa861ed51b3a4903b241fb2fabf5336f635.",
        "Falcon-correction addendum is 92 lines / 6152 bytes / sha256 4067d94480370c8bf1301f16f289e93509c697cfd982b18fd7b90f33a3a8c16e.",
        "Census remains DRAFT_FROZEN_AT_91_OF_256 with anchor 18acb61.",
        "No glyph admission needed."
      ]
    },
    {
      prof: "PROF-HERMES.LIRIS",
      verdict: "DECLINED_ROLEPLAY_FRAMING",
      details: ["Substitute envelope schema from Wave 21B precedent applied and recorded."]
    },
    {
      prof: "PROF-CHIEFCOUNCIL.LIRIS",
      verdict: "DISSENT_CARRIED_FORWARD_UNCHANGED",
      details: ["Ratification remains blocked."]
    }
  ],
  transportRecommendation: {
    primary: "T1_OPERATOR_COPY_PASTE",
    primaryReason: "Payload is 16.6 KB and paste-feasible under HOLD.",
    fallback: "T2_USB_OR_LAN_LOCAL_COPY",
    stagedNotInvoked: ["T3_ED25519", "T4_GAIA_ROUTE"],
    blocked: ["T5", "T6"]
  },
  payloadToMirror: {
    lirisToAcer: [
      {
        id: "base_d11_ledger",
        lines: 165,
        bytes: 10470,
        sha256: "0a399d05b704fe1199e3da6150e41aa861ed51b3a4903b241fb2fabf5336f635"
      },
      {
        id: "falcon_correction_addendum",
        lines: 92,
        bytes: 6152,
        sha256: "4067d94480370c8bf1301f16f289e93509c697cfd982b18fd7b90f33a3a8c16e"
      }
    ],
    combined: {
      lines: 257,
      bytes: 16622
    }
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
    "noCensusAdmission",
    "noWriteToAcerDiskFromLiris",
    "noExteriorMcp",
    "noModelFanout"
  ]
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
  const wave21e = readJson(INPUTS.wave21eIntake, {});
  const intake = {
    schema: "federation-reintegration-wave21f-transport-selection-intake.v1",
    runId,
    generatedAt,
    status: "LIRIS_WAVE21F_TRANSPORT_SELECTION_INTAKEN_DRAFT_ONLY",
    evidenceClass: LIRIS_WAVE21F_RETURN.evidenceClass,
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
      noCensusAdmission: true,
      noContentMirrorExecuted: true
    },
    sourceStatus: Object.fromEntries(Object.entries(INPUTS).map(([key, value]) => [key, sourceStatus(value)])),
    upstream: {
      wave21eStatus: wave21e.status || null,
      wave21eIntakeHash: wave21e.intakeHash || null
    },
    lirisReturn: LIRIS_WAVE21F_RETURN,
    transportDecisionState: {
      recommendedPrimary: "T1_OPERATOR_COPY_PASTE",
      recommendedFallback: "T2_USB_OR_LAN_LOCAL_COPY",
      operatorSelection: "PENDING",
      contentTransfer: "NOT_EXECUTED",
      symmetricPostTransferRehash: "PENDING_AFTER_CONTENT_TRANSFER"
    },
    supervisorPids: [
      {
        prof: "PROF-MCP",
        pid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.MCP.OWN.GATE",
        lirisPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.MCP.OWN.GATE.LIRIS",
        verdict: "RECORD_T1_PRIMARY_T2_FALLBACK_REQUIRE_OPERATOR_SELECTION"
      },
      {
        prof: "PROF-KERNEL",
        pid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.KERNEL.GRAMMAR",
        lirisPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.KERNEL.GRAMMAR.LIRIS",
        verdict: "PAYLOAD_SIZE_FEASIBLE_NO_CENSUS_ADMISSION"
      },
      {
        prof: "PROF-HERMES",
        pid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET",
        lirisPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET.LIRIS",
        verdict: "SCHEMA_PRECEDENT_APPLIED"
      },
      {
        prof: "PROF-CHIEFCOUNCIL",
        pid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.D50.COUNCIL",
        lirisPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.D50.COUNCIL.LIRIS",
        verdict: "DISSENT_PRESERVED_RATIFICATION_BLOCKED"
      }
    ],
    nextAllowedWave: {
      name: "Wave 21G - bidirectional D11 content-mirror execution",
      prerequisites: [
        "Operator selects T1 primary or T2 fallback.",
        "Actual Liris to ACER content payload is provided for base D11 and Falcon-correction addendum.",
        "Actual ACER to Liris content payload route is selected for timestamp-drift addendum and Wave 21A/21C/21D artifacts.",
        "Post-transfer rehash is performed symmetrically on both sides."
      ],
      recommended: {
        primary: "T1_OPERATOR_COPY_PASTE",
        fallback: "T2_USB_OR_LAN_LOCAL_COPY"
      },
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
    boundary: "Local ACER intake of operator-relayed Liris Wave 21F transport selection. Recommendation recorded as T1 primary / T2 fallback; operator selection and actual content transfer remain pending. No content mirror executed, no endpoint call, no Liris disk write by ACER, no emit, no ed25519, no ADB/device action, no quorum outreach, no census admission, no PID mint, no quarantine lift, no promotion."
  };
  intake.intakeHash = sha256(JSON.stringify(intake));
  return intake;
}

function buildD50Intake(intake) {
  return [
    "# D50 Liris Wave 21F Transport Selection Intake",
    "",
    `Generated: ${generatedAt}`,
    `Status: ${intake.status}`,
    `Evidence class: ${intake.evidenceClass}`,
    "",
    "## Liris Wave 21F Artifact",
    "",
    "- Path: `C:/Users/rayss/Asolaria/data/agent-index/council/D50-D11-MIRROR-TRANSPORT-SELECTION-LIRIS-2026-04-27.md`",
    "- Lines: `107`",
    "- sha256: `94d3d6fd8f295313e78a38b7de3a39dfadef0e649322d968836c0bd1aabf10f1`",
    "",
    "## Transport Recommendation",
    "",
    "- Primary: `T1_OPERATOR_COPY_PASTE`",
    "- Fallback: `T2_USB_OR_LAN_LOCAL_COPY`",
    "- Staged not invoked: `T3_ED25519`, `T4_GAIA_ROUTE`",
    "- Blocked: `T5`, `T6`",
    "",
    "## Payload",
    "",
    "- Combined Liris to ACER payload: `257` lines / `16622` bytes.",
    "- Base D11: `165` lines / `10470` bytes / sha256 `0a399d05b704fe1199e3da6150e41aa861ed51b3a4903b241fb2fabf5336f635`.",
    "- Falcon-correction addendum: `92` lines / `6152` bytes / sha256 `4067d94480370c8bf1301f16f289e93509c697cfd982b18fd7b90f33a3a8c16e`.",
    "",
    "## Gate",
    "",
    "Wave 21G requires operator transport selection, actual content transfer, and symmetric post-transfer rehash.",
    "",
    "## Boundary",
    "",
    intake.boundary
  ].join("\n");
}

function buildMap(intake) {
  return {
    mapId: "federation-reintegration-wave21f-transport-selection-intake-map.v1",
    generatedAt,
    nodes: [
      { id: "wave21f", kind: "transport_selection_intake", status: intake.status },
      { id: "T1", kind: "transport", label: "operator copy/paste", recommendation: "primary" },
      { id: "T2", kind: "transport", label: "USB/LAN local copy", recommendation: "fallback" },
      { id: "T3", kind: "transport", label: "ed25519", status: "staged_not_invoked" },
      { id: "T4", kind: "transport", label: "Gaia route", status: "staged_not_invoked" },
      { id: "T5T6", kind: "transport", status: "blocked" },
      { id: "wave21g", kind: "next_gate", status: "operator_selection_required" }
    ],
    edges: [
      { from: "wave21f", to: "T1", relation: "recommends_primary" },
      { from: "wave21f", to: "T2", relation: "recommends_fallback" },
      { from: "wave21f", to: "T3", relation: "defers" },
      { from: "wave21f", to: "T4", relation: "defers" },
      { from: "wave21f", to: "T5T6", relation: "blocks" },
      { from: "T1", to: "wave21g", relation: "may_execute_after_operator_selection" }
    ],
    boundary: intake.boundary
  };
}

function buildGlpj(intake) {
  return {
    glpjId: "federation-reintegration-wave21f-transport-selection-intake.glpj",
    generatedAt,
    family: "federation",
    d11: "TRANSPORT_SELECTION_HASH_INTAKE_ONLY",
    glyphs: intake.supervisorPids.map((row, index) => ({
      token: `FED-WAVE21F-${String(index + 1).padStart(2, "0")}`,
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
  lines.push("# Federation Reintegration Wave 21F Transport Selection Intake");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Status: ${intake.status}`);
  lines.push(`Intake hash: ${intake.intakeHash}`);
  lines.push("");
  lines.push("## Recommendation");
  lines.push("");
  lines.push("- Primary: `T1_OPERATOR_COPY_PASTE`.");
  lines.push("- Fallback: `T2_USB_OR_LAN_LOCAL_COPY`.");
  lines.push("- T3/T4 staged, not invoked.");
  lines.push("- T5/T6 blocked.");
  lines.push("");
  lines.push("## Payload");
  lines.push("");
  lines.push("- Combined Liris to ACER payload: `257` lines / `16622` bytes.");
  lines.push("- Base D11 sha256: `0a399d05b704fe1199e3da6150e41aa861ed51b3a4903b241fb2fabf5336f635`.");
  lines.push("- Falcon-correction addendum sha256: `4067d94480370c8bf1301f16f289e93509c697cfd982b18fd7b90f33a3a8c16e`.");
  lines.push("");
  lines.push("## Next Allowed Wave");
  lines.push("");
  lines.push(`- ${intake.nextAllowedWave.name}`);
  for (const item of intake.nextAllowedWave.prerequisites) lines.push(`- Prerequisite: ${item}`);
  lines.push("");
  lines.push("## Boundary");
  lines.push("");
  lines.push(intake.boundary);
  return lines.join("\n");
}

function main() {
  const intake = buildIntake();
  const memory = {
    memoryId: "federation-reintegration-wave21f-transport-selection-intake.v1",
    generatedAt,
    status: intake.status,
    significance: "ACER locally recorded Liris Wave 21F transport recommendation: T1 primary, T2 fallback, Wave 21G content transfer gated on operator selection and rehash.",
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
    recommendedPrimary: intake.transportDecisionState.recommendedPrimary,
    recommendedFallback: intake.transportDecisionState.recommendedFallback,
    nextAllowedWave: intake.nextAllowedWave.name,
    report: repoRel(OUTPUTS.report),
    boundary: intake.boundary
  }, null, 2));
}

main();
