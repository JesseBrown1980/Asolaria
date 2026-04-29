#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const runId = "federation-reintegration-wave21g-option-a-payload-staging-plan-20260427";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427");

const INPUTS = Object.freeze({
  wave21gDecision: "data/behcs/orchestration/federation-reintegration-20260427/wave21g-prof-supervisor-transport-decision.v1.json",
  wave21gReport: "reports/federation-reintegration-wave21g-prof-supervisor-decision-latest.md",
  d50Wave21gDecision: "data/agent-index/council/D50-WAVE21G-PROF-SUPERVISOR-TRANSPORT-DECISION-2026-04-27.md"
});

const OUTPUTS = Object.freeze({
  plan: path.join(runRoot, "wave21g-option-a-payload-staging-plan.v1.json"),
  d50Plan: path.join(repoRoot, "data", "agent-index", "council", "D50-WAVE21G-OPTION-A-PAYLOAD-STAGING-PLAN-2026-04-27.md"),
  report: path.join(repoRoot, "reports", "federation-reintegration-wave21g-option-a-payload-staging-plan-latest.md"),
  reportJson: path.join(repoRoot, "reports", "federation-reintegration-wave21g-option-a-payload-staging-plan-latest.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "federation-reintegration-wave21g-option-a-payload-staging-plan.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "federation-reintegration-wave21g-option-a-payload-staging-plan-map.v1.json"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "federation-reintegration-wave21g-option-a-payload-staging-plan.glpj.json")
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

function buildPlan() {
  const wave21g = readJson(INPUTS.wave21gDecision, {});
  const plan = {
    schema: "federation-reintegration-wave21g-option-a-payload-staging-plan.v1",
    runId,
    generatedAt,
    status: "OPTION_A_AUTHORIZED_FOR_LIRIS_PAYLOAD_STAGING_ONLY",
    selectedOption: "A_LIRIS_SIDE_T1_PASTE_PAYLOAD_STAGING",
    notSelected: ["B_HOLD_WITH_NO_NEW_ARTIFACT"],
    blockedOptions: ["C_DIRECT_TRANSFER_OR_NON_OPERATOR_CHANNEL"],
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
      noContentMirrorExecuted: true,
      noAcerCanonicalWriteUntilPayloadArrives: true
    },
    sourceStatus: Object.fromEntries(Object.entries(INPUTS).map(([key, value]) => [key, sourceStatus(value)])),
    upstream: {
      wave21gStatus: wave21g.status || null,
      wave21gDecisionHash: wave21g.decisionHash || null,
      rightMove: wave21g.finalRecommendation?.rightMove || "SELECT_T1_OPERATOR_COPY_PASTE_FOR_WAVE21G",
      fallback: wave21g.finalRecommendation?.fallback || "T2_USB_OR_LAN_LOCAL_COPY_IF_T1_PASTE_FAILS"
    },
    supervisorLevels: [
      {
        level: "L0_BOUNDARY",
        prof: "PROF-HOOKWALL",
        supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HOOKWALL.BOUNDARY",
        verdict: "ALLOW_LIRIS_PAYLOAD_STAGING_ARTIFACT_ONLY"
      },
      {
        level: "L1_MCP_TRANSPORT",
        prof: "PROF-MCP",
        supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.MCP.OWN.GATE",
        verdict: "T1_PAYLOAD_PREP_IS_OPERATOR_MEDIATED_NO_ENDPOINT"
      },
      {
        level: "L2_PACKET_SCHEMA",
        prof: "PROF-HERMES",
        supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET",
        verdict: "REQUIRE_FENCED_PAYLOAD_BLOCKS_EXPECTED_SHA_AND_REHASH_RULE"
      },
      {
        level: "L3_CONTENT_GRAMMAR",
        prof: "PROF-KERNEL",
        supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.KERNEL.GRAMMAR",
        verdict: "PAYLOAD_STAGING_OK_NO_GLYPH_OR_CENSUS_ADMISSION"
      },
      {
        level: "L4_TRUST_RISK",
        prof: "PROF-SHANNON",
        supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.SHANNON.TRUST",
        verdict: "RECEIVE_TO_STAGING_AND_HASH_BEFORE_ANY_CANONICAL_WRITE"
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
        verdict: "PLAN_TO_EXECUTE_AFTER_OPERATOR_PASTE_ONLY"
      }
    ],
    lirisAuthorizedArtifact: {
      pathOnLiris: "C:/Users/rayss/Asolaria/data/agent-index/council/D50-WAVE21G-LIRIS-PASTE-PAYLOAD-2026-04-27.md",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET.LIRIS",
      status: "DRAFT_ONLY_NOT_RATIFIED",
      requiredContent: [
        "T1 selection mirror with ACER Wave 21G supervisor verdicts",
        "fenced code block containing full base D11 ledger content",
        "fenced code block containing full Falcon-correction addendum content",
        "post-transfer rehash rule",
        "ACER-to-Liris incoming payload slot marked PENDING",
        "CHIEFCOUNCIL dissent preserved"
      ],
      expectedPayloads: [
        {
          artifact: "D11-AUDIT-LEDGER-2026-04-27.md",
          expectedLines: 165,
          expectedBytes: 10470,
          expectedSha256: "0a399d05b704fe1199e3da6150e41aa861ed51b3a4903b241fb2fabf5336f635"
        },
        {
          artifact: "Falcon-correction addendum",
          expectedLines: 92,
          expectedBytes: 6152,
          expectedSha256: "4067d94480370c8bf1301f16f289e93509c697cfd982b18fd7b90f33a3a8c16e"
        }
      ]
    },
    acerReceivingPlanAfterOperatorPaste: {
      status: "PENDING_PAYLOAD",
      acceptedInput: [
        "operator-pasted D50-WAVE21G-LIRIS-PASTE-PAYLOAD-2026-04-27.md content",
        "or operator-pasted two fenced code blocks plus Liris artifact hash"
      ],
      stagingOnlyFirst: [
        "data/behcs/orchestration/federation-reintegration-20260427/incoming-t1/liris-base-d11.raw.md",
        "data/behcs/orchestration/federation-reintegration-20260427/incoming-t1/liris-falcon-correction-addendum.raw.md"
      ],
      verification: [
        "compute sha256 of each staged raw content",
        "compare with expected Liris hashes",
        "reject if either hash differs",
        "only after hash match, prepare a separate canonical-write wave",
        "canonical-write wave must remain DRAFT_ONLY_NOT_RATIFIED"
      ]
    },
    acerToLirisPayloadPlan: {
      status: "PENDING_AFTER_LIRIS_TO_ACER_STAGING",
      items: [
        {
          artifact: "data/agent-index/D11-AUDIT-LEDGER-ADDENDUM-LIRIS-TIMESTAMP-DRIFT-2026-04-27.md",
          expectedSha256: "ac340793e18948b335701a90a9c17a6ee16feecd6461e3edb03cf82778b0d357"
        },
        {
          artifact: "Wave 21A/21C/21D/21E/21G ACER artifacts",
          expectedMode: "operator paste or local file bundle with per-file sha256"
        }
      ]
    },
    stillDenied: [
      "autonomous transfer",
      "peer endpoint call",
      "Liris disk write by ACER",
      "ACER canonical content write before payload hash verification",
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
    boundary: "ACER-side Option A staging plan only. It authorizes Liris to prepare one DRAFT_ONLY_NOT_RATIFIED paste-payload artifact and defines ACER staging/rehash steps for later operator paste. No content payload has been received or written on ACER by this artifact; no endpoint call, no Liris disk write by ACER, no emit, no ed25519, no ADB/device action, no quorum outreach, no census admission, no PID mint, no quarantine lift, no promotion."
  };
  plan.planHash = sha256(JSON.stringify(plan));
  return plan;
}

function buildD50Plan(plan) {
  return [
    "# D50 Wave 21G Option A Payload Staging Plan",
    "",
    `Generated: ${generatedAt}`,
    `Status: ${plan.status}`,
    "",
    "## Decision",
    "",
    "- Selected: `A_LIRIS_SIDE_T1_PASTE_PAYLOAD_STAGING`",
    "- Not selected: `B_HOLD_WITH_NO_NEW_ARTIFACT`",
    "- Blocked: `C_DIRECT_TRANSFER_OR_NON_OPERATOR_CHANNEL`",
    "",
    "## Liris Artifact Authorized",
    "",
    `- Path: \`${plan.lirisAuthorizedArtifact.pathOnLiris}\``,
    `- Supervisor PID: \`${plan.lirisAuthorizedArtifact.supervisorPid}\``,
    "- Status: `DRAFT_ONLY_NOT_RATIFIED`",
    "",
    "## Required Payload Blocks",
    "",
    "- Base D11 content: expected sha256 `0a399d05b704fe1199e3da6150e41aa861ed51b3a4903b241fb2fabf5336f635`.",
    "- Falcon-correction addendum: expected sha256 `4067d94480370c8bf1301f16f289e93509c697cfd982b18fd7b90f33a3a8c16e`.",
    "",
    "## ACER Receiving Plan",
    "",
    "- Receive to staging only first.",
    "- Hash staged raw content.",
    "- Reject on hash mismatch.",
    "- Prepare a separate canonical-write wave only after hashes match.",
    "",
    "## Boundary",
    "",
    plan.boundary
  ].join("\n");
}

function buildMap(plan) {
  return {
    mapId: "federation-reintegration-wave21g-option-a-payload-staging-plan-map.v1",
    generatedAt,
    nodes: [
      { id: "option-a", kind: "selected_option", label: "Liris paste payload staging" },
      { id: "option-b", kind: "not_selected", label: "hold" },
      { id: "option-c", kind: "blocked", label: "direct transfer" },
      { id: "acer-staging", kind: "future_receiving_gate", status: "pending_payload" },
      ...plan.supervisorLevels.map((row) => ({ id: row.supervisorPid, kind: "supervisor_pid", level: row.level, verdict: row.verdict }))
    ],
    edges: [
      { from: "option-a", to: "acer-staging", relation: "prepares_future_operator_paste" },
      ...plan.supervisorLevels.map((row) => ({ from: "option-a", to: row.supervisorPid, relation: "authorized_by" }))
    ],
    boundary: plan.boundary
  };
}

function buildGlpj(plan) {
  return {
    glpjId: "federation-reintegration-wave21g-option-a-payload-staging-plan.glpj",
    generatedAt,
    family: "federation",
    d11: "PAYLOAD_STAGING_PLAN_ONLY",
    glyphs: plan.supervisorLevels.map((row, index) => ({
      token: `FED-WAVE21G-A-L${index}`,
      level: row.level,
      prof: row.prof,
      supervisorPid: row.supervisorPid,
      verdict: row.verdict
    })),
    boundary: plan.boundary
  };
}

function buildReport(plan) {
  const lines = [];
  lines.push("# Federation Reintegration Wave 21G Option A Payload Staging Plan");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Status: ${plan.status}`);
  lines.push(`Plan hash: ${plan.planHash}`);
  lines.push("");
  lines.push("## Selected");
  lines.push("");
  lines.push("- Option A: Liris prepares one paste-payload artifact.");
  lines.push("- ACER waits for operator paste before staging content.");
  lines.push("- Canonical writes require a later hash-verified wave.");
  lines.push("");
  lines.push("## Supervisor Levels");
  lines.push("");
  for (const row of plan.supervisorLevels) lines.push(`- ${row.level} / ${row.prof}: ${row.verdict}`);
  lines.push("");
  lines.push("## Still Denied");
  lines.push("");
  for (const item of plan.stillDenied) lines.push(`- ${item}`);
  lines.push("");
  lines.push("## Boundary");
  lines.push("");
  lines.push(plan.boundary);
  return lines.join("\n");
}

function main() {
  const plan = buildPlan();
  const memory = {
    memoryId: "federation-reintegration-wave21g-option-a-payload-staging-plan.v1",
    generatedAt,
    status: plan.status,
    significance: "ACER locally authorized Option A as Liris paste-payload staging only, with later ACER staging and rehash required after operator paste.",
    planHash: plan.planHash,
    artifacts: Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)])),
    boundary: plan.boundary
  };

  writeJson(OUTPUTS.plan, plan);
  writeText(OUTPUTS.d50Plan, buildD50Plan(plan));
  writeJson(OUTPUTS.reportJson, { ...plan, artifacts: Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)])) });
  writeJson(OUTPUTS.memory, memory);
  writeJson(OUTPUTS.map, buildMap(plan));
  writeJson(OUTPUTS.glpj, buildGlpj(plan));
  writeText(OUTPUTS.report, buildReport(plan));

  console.log(JSON.stringify({
    ok: true,
    status: plan.status,
    selectedOption: plan.selectedOption,
    lirisArtifact: plan.lirisAuthorizedArtifact.pathOnLiris,
    planHash: plan.planHash,
    report: repoRel(OUTPUTS.report),
    boundary: plan.boundary
  }, null, 2));
}

main();
