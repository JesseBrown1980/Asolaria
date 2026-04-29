#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const runId = "federation-reintegration-wave21g-prof-supervisor-decision-20260427";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427");

const INPUTS = Object.freeze({
  wave21fIntake: "data/behcs/orchestration/federation-reintegration-20260427/wave21f-transport-selection-intake.v1.json",
  wave21fReport: "reports/federation-reintegration-wave21f-transport-selection-intake-latest.md",
  d50Wave21f: "data/agent-index/council/D50-LIRIS-WAVE21F-TRANSPORT-SELECTION-INTAKE-2026-04-27.md"
});

const OUTPUTS = Object.freeze({
  decision: path.join(runRoot, "wave21g-prof-supervisor-transport-decision.v1.json"),
  d50Decision: path.join(repoRoot, "data", "agent-index", "council", "D50-WAVE21G-PROF-SUPERVISOR-TRANSPORT-DECISION-2026-04-27.md"),
  report: path.join(repoRoot, "reports", "federation-reintegration-wave21g-prof-supervisor-decision-latest.md"),
  reportJson: path.join(repoRoot, "reports", "federation-reintegration-wave21g-prof-supervisor-decision-latest.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "federation-reintegration-wave21g-prof-supervisor-decision.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "federation-reintegration-wave21g-prof-supervisor-decision-map.v1.json"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "federation-reintegration-wave21g-prof-supervisor-decision.glpj.json")
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

function buildDecision() {
  const wave21f = readJson(INPUTS.wave21fIntake, {});
  const levels = [
    {
      level: "L0_BOUNDARY",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HOOKWALL.BOUNDARY",
      prof: "PROF-HOOKWALL",
      verdict: "ALLOW_T1_DECISION_ONLY",
      reason: "T1 operator paste is explicitly human-mediated and does not require endpoint/device/provider action."
    },
    {
      level: "L1_MCP_TRANSPORT",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.MCP.OWN.GATE",
      prof: "PROF-MCP",
      verdict: "SELECT_T1_PRIMARY_KEEP_T2_FALLBACK",
      reason: "No standalone Liris sovereign-MCP policy exists; T1 avoids exterior MCP and endpoint ambiguity. T2 remains local-copy fallback."
    },
    {
      level: "L2_PACKET_SCHEMA",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET",
      prof: "PROF-HERMES",
      verdict: "REQUIRE_PAYLOAD_PACKET_AND_POST_TRANSFER_REHASH",
      reason: "Content mirror must be bounded by source path, expected sha256, target path, and symmetric rehash."
    },
    {
      level: "L3_CONTENT_GRAMMAR",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.KERNEL.GRAMMAR",
      prof: "PROF-KERNEL",
      verdict: "T1_IS_SIZE_FEASIBLE_NO_GLYPH_ADMISSION",
      reason: "257 lines / 16622 bytes is paste-feasible; census remains DRAFT_FROZEN_AT_91_OF_256."
    },
    {
      level: "L4_TRUST_RISK",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.SHANNON.TRUST",
      prof: "PROF-SHANNON",
      verdict: "T1_LOWEST_TRUST_SURFACE",
      reason: "T1 exposes only the specific text payload to the operator-mediated channel; T2 is acceptable if paste fidelity fails."
    },
    {
      level: "L5_PEER_IDENTITY",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.FALCON.IDENTITY",
      prof: "PROF-FALCON",
      verdict: "NO_FALCON_STATE_CHANGE",
      reason: "This wave mirrors D11 content only; Falcon serial correction remains draft-only and no quarantine lift occurs."
    },
    {
      level: "L6_COUNCIL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.D50.COUNCIL",
      prof: "PROF-CHIEFCOUNCIL",
      verdict: "DISSENT_PRESERVED_NO_RATIFICATION",
      reason: "Content mirror improves evidence symmetry but does not ratify, promote, or override dissent."
    },
    {
      level: "L7_APEX",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.ASOLARIA.APEX",
      prof: "COL-ASOLARIA",
      verdict: "RIGHT_MOVE_IS_T1_NOW_T2_IF_PASTE_FAILS",
      reason: "Proceed with the smallest supervised move that closes the mirror gap; hold all promotion paths."
    }
  ];

  const decision = {
    schema: "federation-reintegration-wave21g-prof-supervisor-decision.v1",
    runId,
    generatedAt,
    status: "SUPERVISOR_DECISION_ONLY_NO_CONTENT_TRANSFER",
    policy: {
      ownMcpOnly: true,
      noExteriorMcp: true,
      noDirectPeerActions: true,
      noModelFanout: true,
      noDeviceActions: true,
      noPromotion: true,
      noEmit: true,
      noEd25519: true,
      noQuorumOutreach: true,
      noCensusAdmission: true,
      noContentMirrorExecuted: true
    },
    sourceStatus: Object.fromEntries(Object.entries(INPUTS).map(([key, value]) => [key, sourceStatus(value)])),
    upstream: {
      wave21fStatus: wave21f.status || null,
      wave21fIntakeHash: wave21f.intakeHash || null,
      recommendedPrimary: wave21f.transportDecisionState?.recommendedPrimary || "T1_OPERATOR_COPY_PASTE",
      recommendedFallback: wave21f.transportDecisionState?.recommendedFallback || "T2_USB_OR_LAN_LOCAL_COPY"
    },
    levels,
    finalRecommendation: {
      rightMove: "SELECT_T1_OPERATOR_COPY_PASTE_FOR_WAVE21G",
      fallback: "T2_USB_OR_LAN_LOCAL_COPY_IF_T1_PASTE_FAILS",
      holdCondition: "HOLD_IF_OPERATOR_DOES_NOT_PROVIDE_ACTUAL_CONTENT_PAYLOADS",
      rationale: "T1 closes the evidence mirror gap with the lowest transport authority, smallest trust surface, and no endpoint/device/provider dependency."
    },
    wave21gExecutionPacketRequiredFields: {
      lirisToAcer: [
        {
          artifact: "D11-AUDIT-LEDGER-2026-04-27.md",
          expectedLines: 165,
          expectedBytes: 10470,
          expectedSha256: "0a399d05b704fe1199e3da6150e41aa861ed51b3a4903b241fb2fabf5336f635"
        },
        {
          artifact: "Falcon correction addendum",
          expectedLines: 92,
          expectedBytes: 6152,
          expectedSha256: "4067d94480370c8bf1301f16f289e93509c697cfd982b18fd7b90f33a3a8c16e"
        }
      ],
      acerToLiris: [
        {
          artifact: "D11-AUDIT-LEDGER-ADDENDUM-LIRIS-TIMESTAMP-DRIFT-2026-04-27.md",
          expectedSha256: "ac340793e18948b335701a90a9c17a6ee16feecd6461e3edb03cf82778b0d357"
        },
        {
          artifact: "Wave 21A/21C/21D ACER artifacts",
          expectedMode: "operator paste or local file bundle with per-file sha256"
        }
      ],
      verification: [
        "write content only to explicitly named mirror paths",
        "rehash after write on receiving side",
        "compare against expected hashes",
        "record DRAFT_ONLY_NOT_RATIFIED result",
        "do not advance quorum or promotion"
      ]
    },
    deniedNow: [
      "automatic content transfer",
      "peer endpoint call",
      "ADB/device action",
      "exterior MCP",
      "model fanout",
      "ed25519 ceremony",
      "multi-family cosigner outreach",
      "census admission",
      "PID mint",
      "quarantine lift",
      "federation promotion"
    ],
    boundary: "Per-level PROF/supervisor decision only. The right move is T1 operator copy/paste for Wave 21G, with T2 local-copy fallback if paste fails. This artifact performs no content transfer, no endpoint call, no Liris disk write by ACER, no emit, no ed25519, no ADB/device action, no quorum outreach, no census admission, no PID mint, no quarantine lift, no promotion."
  };
  decision.decisionHash = sha256(JSON.stringify(decision));
  return decision;
}

function buildD50Decision(decision) {
  return [
    "# D50 Wave 21G PROF/Supervisor Transport Decision",
    "",
    `Generated: ${generatedAt}`,
    `Status: ${decision.status}`,
    "",
    "## Final Recommendation",
    "",
    "- Right move: `SELECT_T1_OPERATOR_COPY_PASTE_FOR_WAVE21G`",
    "- Fallback: `T2_USB_OR_LAN_LOCAL_COPY_IF_T1_PASTE_FAILS`",
    "- Hold condition: no actual content payloads from operator.",
    "",
    "## Per-Level Verdicts",
    "",
    ...decision.levels.map((row) => `- ${row.level} / ${row.prof} / ${row.supervisorPid}: ${row.verdict}`),
    "",
    "## Required Wave 21G Inputs",
    "",
    "- Liris base D11 content: expected sha256 `0a399d05b704fe1199e3da6150e41aa861ed51b3a4903b241fb2fabf5336f635`.",
    "- Liris Falcon-correction addendum content: expected sha256 `4067d94480370c8bf1301f16f289e93509c697cfd982b18fd7b90f33a3a8c16e`.",
    "- ACER timestamp-drift addendum route to Liris: expected sha256 `ac340793e18948b335701a90a9c17a6ee16feecd6461e3edb03cf82778b0d357`.",
    "- ACER Wave 21A/21C/21D artifacts route to Liris with per-file sha256.",
    "",
    "## Boundary",
    "",
    decision.boundary
  ].join("\n");
}

function buildMap(decision) {
  return {
    mapId: "federation-reintegration-wave21g-prof-supervisor-decision-map.v1",
    generatedAt,
    nodes: [
      { id: "wave21g-decision", kind: "decision", status: decision.status },
      { id: "T1", kind: "transport", recommendation: "primary" },
      { id: "T2", kind: "transport", recommendation: "fallback" },
      { id: "hold", kind: "state", trigger: "missing_payloads" },
      ...decision.levels.map((row) => ({ id: row.supervisorPid, kind: "supervisor_pid", level: row.level, verdict: row.verdict }))
    ],
    edges: [
      { from: "wave21g-decision", to: "T1", relation: "selects_primary" },
      { from: "wave21g-decision", to: "T2", relation: "keeps_fallback" },
      { from: "wave21g-decision", to: "hold", relation: "requires_if_no_payload" },
      ...decision.levels.map((row) => ({ from: "wave21g-decision", to: row.supervisorPid, relation: "decided_by_level" }))
    ],
    boundary: decision.boundary
  };
}

function buildGlpj(decision) {
  return {
    glpjId: "federation-reintegration-wave21g-prof-supervisor-decision.glpj",
    generatedAt,
    family: "federation",
    d11: "SUPERVISOR_DECISION_ONLY",
    glyphs: decision.levels.map((row, index) => ({
      token: `FED-WAVE21G-L${index}`,
      level: row.level,
      prof: row.prof,
      supervisorPid: row.supervisorPid,
      verdict: row.verdict
    })),
    boundary: decision.boundary
  };
}

function buildReport(decision) {
  const lines = [];
  lines.push("# Federation Reintegration Wave 21G PROF/Supervisor Decision");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Status: ${decision.status}`);
  lines.push(`Decision hash: ${decision.decisionHash}`);
  lines.push("");
  lines.push("## Right Move");
  lines.push("");
  lines.push("- Select `T1_OPERATOR_COPY_PASTE` for Wave 21G.");
  lines.push("- Use `T2_USB_OR_LAN_LOCAL_COPY` only if T1 paste fails.");
  lines.push("- Hold if the actual content payloads are not provided.");
  lines.push("");
  lines.push("## Per-Level Verdicts");
  lines.push("");
  for (const row of decision.levels) lines.push(`- ${row.level} / ${row.prof}: ${row.verdict}`);
  lines.push("");
  lines.push("## Still Denied");
  lines.push("");
  for (const item of decision.deniedNow) lines.push(`- ${item}`);
  lines.push("");
  lines.push("## Boundary");
  lines.push("");
  lines.push(decision.boundary);
  return lines.join("\n");
}

function main() {
  const decision = buildDecision();
  const memory = {
    memoryId: "federation-reintegration-wave21g-prof-supervisor-decision.v1",
    generatedAt,
    status: decision.status,
    significance: "Per-level PROF/supervisor wave chose T1 operator copy/paste as the right next move, with T2 fallback and no autonomous content transfer.",
    decisionHash: decision.decisionHash,
    artifacts: Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)])),
    boundary: decision.boundary
  };

  writeJson(OUTPUTS.decision, decision);
  writeText(OUTPUTS.d50Decision, buildD50Decision(decision));
  writeJson(OUTPUTS.reportJson, { ...decision, artifacts: Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)])) });
  writeJson(OUTPUTS.memory, memory);
  writeJson(OUTPUTS.map, buildMap(decision));
  writeJson(OUTPUTS.glpj, buildGlpj(decision));
  writeText(OUTPUTS.report, buildReport(decision));

  console.log(JSON.stringify({
    ok: true,
    status: decision.status,
    rightMove: decision.finalRecommendation.rightMove,
    fallback: decision.finalRecommendation.fallback,
    decisionHash: decision.decisionHash,
    report: repoRel(OUTPUTS.report),
    boundary: decision.boundary
  }, null, 2));
}

main();
