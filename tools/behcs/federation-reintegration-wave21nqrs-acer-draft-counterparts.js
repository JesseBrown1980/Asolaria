#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const runId = "federation-reintegration-wave21nqrs-acer-draft-counterparts-20260427";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427");
const relayStartedAtUtc = "2026-04-27T20:12:49Z";
const relayStartedAtLocal = "2026-04-27T17:12:50-03:00";

const INPUTS = Object.freeze({
  wave21mIntake: "data/behcs/orchestration/federation-reintegration-20260427/wave21m-liris-corpus-manifest-intake.v1.json",
  wave21mD50: "data/agent-index/council/D50-LIRIS-WAVE21M-CORPUS-MANIFEST-INTAKE-2026-04-27.md",
  asolariaMcpPolicy: "src/asolariaMcpPolicy.js",
  wave21lIntake: "data/behcs/orchestration/federation-reintegration-20260427/wave21l-liris-21jk-return-intake.v1.json"
});

const OUTPUTS = Object.freeze({
  plan: path.join(runRoot, "wave21nqrs-acer-draft-counterparts.v1.json"),
  wave21n: path.join(repoRoot, "data", "agent-index", "council", "D50-WAVE21N-PID-GRAMMAR-REGISTRY-ACER-2026-04-27.md"),
  wave21q: path.join(repoRoot, "data", "agent-index", "council", "D50-WAVE21Q-CODEX-MCP-GRANDFATHER-ADDENDUM-ACER-2026-04-27.md"),
  wave21r: path.join(repoRoot, "data", "agent-index", "council", "D50-WAVE21R-VISION-EVENTS-SEALED-MISSING-RECORD-ACER-2026-04-27.md"),
  wave21s: path.join(repoRoot, "data", "agent-index", "council", "D50-WAVE21S-168H-REWALK-SCHEDULE-ACER-2026-04-27.md"),
  report: path.join(repoRoot, "reports", "federation-reintegration-wave21nqrs-acer-draft-counterparts-latest.md"),
  reportJson: path.join(repoRoot, "reports", "federation-reintegration-wave21nqrs-acer-draft-counterparts-latest.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "federation-reintegration-wave21nqrs-acer-draft-counterparts.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "federation-reintegration-wave21nqrs-acer-draft-counterparts-map.v1.json"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "federation-reintegration-wave21nqrs-acer-draft-counterparts.glpj.json")
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

function addHours(isoUtc, hours) {
  const date = new Date(isoUtc);
  return new Date(date.getTime() + hours * 60 * 60 * 1000).toISOString().replace(".000Z", "Z");
}

function localMinus03(isoUtc) {
  const date = new Date(isoUtc);
  const local = new Date(date.getTime() - 3 * 60 * 60 * 1000);
  return local.toISOString().replace(".000Z", "-03:00");
}

function getMcpPolicyFacts() {
  const policy = require(path.join(repoRoot, INPUTS.asolariaMcpPolicy));
  return {
    policyVersion: policy.ASOLARIA_MCP_POLICY_VERSION,
    serverLabel: policy.ASOLARIA_MCP_SERVER_LABEL,
    connectorId: policy.ASOLARIA_MCP_CONNECTOR_ID,
    agentProfiles: policy.getAsolariaMcpAgentProfiles()
  };
}

function buildPlan() {
  const wave21m = readJson(INPUTS.wave21mIntake, {});
  const wave21l = readJson(INPUTS.wave21lIntake, {});
  const mcpPolicy = getMcpPolicyFacts();
  const dueUtc = addHours(relayStartedAtUtc, 168);

  const supervisorLevels = [
    {
      level: "L0_BOUNDARY",
      prof: "PROF-HOOKWALL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HOOKWALL.BOUNDARY",
      verdict: "ALLOW_FOUR_ACER_DRAFT_COUNTERPARTS_ONLY"
    },
    {
      level: "L1_PID_GRAMMAR",
      prof: "PROF-INSTRUCT-KR",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.INSTRUCT-KR.GRAMMAR.ACER",
      verdict: "WRITE_PID_GRAMMAR_REGISTRY_DRAFT"
    },
    {
      level: "L2_MCP_GRANDFATHER",
      prof: "PROF-MCP",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.MCP.OWN.GATE.ACER",
      verdict: "WRITE_CODEX_MCP_GRANDFATHER_ADDENDUM_DRAFT"
    },
    {
      level: "L3_VISION_WITNESS",
      prof: "PROF-VISION",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.VISION.WITNESS.ACER",
      verdict: "WRITE_MISSING_RECORD_UNTIL_FINAL_RETURN"
    },
    {
      level: "L4_SCHEDULER",
      prof: "PROF-SCHEDULER",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.SCHEDULER.DECAY.ACER",
      verdict: "WRITE_168H_REWALK_SCHEDULE_DRAFT"
    },
    {
      level: "L5_COMMS",
      prof: "PROF-COMMS",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.COMMS.BILATERAL.ACER",
      verdict: "NO_CONTENT_CHANNEL_EXECUTION"
    },
    {
      level: "L6_COUNCIL",
      prof: "PROF-CHIEFCOUNCIL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.D50.COUNCIL.ACER",
      verdict: "DISSENT_PRESERVED_NO_RATIFICATION"
    },
    {
      level: "L7_APEX",
      prof: "COL-ASOLARIA",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.ASOLARIA.APEX.ACER",
      verdict: "RUN_21N_21Q_21R_21S_AS_LOCAL_DRAFT_WAVE"
    }
  ];

  const plan = {
    schema: "federation-reintegration-wave21nqrs-acer-draft-counterparts.v1",
    runId,
    generatedAt,
    status: "DRAFT_ONLY_NOT_RATIFIED",
    relationship: "ACER_DRAFT_COUNTERPARTS_FOR_LIRIS_WAVE21NQRS_PARTIAL_RELAY",
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
      noParentArchaeologyMutation: true,
      chiefCouncilDissentPreserved: true
    },
    sourceStatus: Object.fromEntries(Object.entries(INPUTS).map(([key, value]) => [key, sourceStatus(value)])),
    upstream: {
      wave21mStatus: wave21m.status || null,
      wave21mFollowupStatus: wave21m.followupSupervisorWave?.status || null,
      wave21lRelationship: wave21l.relationship || null,
      lirisRelayState: "PARTIAL_NQRS_RELAY_ONLY_21N_START_SHOWN_NO_FINAL_HASHES_FOR_21Q_21R_21S",
      wave21HGate: "STILL_REQUIRES_OPERATOR_MEDIATED_PASTE_ACTION"
    },
    lirisPartialRelay: {
      wave21n: {
        path: "C:/Users/rayss/Asolaria/data/agent-index/council/D50-WAVE21N-PID-GRAMMAR-REGISTRY-LIRIS-2026-04-27.md",
        status: "WRITE_STARTED_RELAYED",
        displayedLineCount: 87,
        finalSha256: null,
        supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.INSTRUCT-KR.GRAMMAR.LIRIS"
      },
      wave21q: { status: "DISPATCHED_NOT_RELAYED_FINAL", finalSha256: null },
      wave21r: { status: "DISPATCHED_NOT_RELAYED_FINAL", finalSha256: null },
      wave21s: { status: "DISPATCHED_NOT_RELAYED_FINAL", finalSha256: null }
    },
    mcpPolicy,
    schedule: {
      relayStartedAtUtc,
      relayStartedAtLocal,
      check24hUtc: addHours(relayStartedAtUtc, 24),
      check72hUtc: addHours(relayStartedAtUtc, 72),
      due168hUtc: dueUtc,
      due168hLocal: localMinus03(dueUtc)
    },
    supervisorLevels,
    draftWrites: [
      { wave: "21N", path: repoRel(OUTPUTS.wave21n), class: "PID grammar registry draft" },
      { wave: "21Q", path: repoRel(OUTPUTS.wave21q), class: "Codex MCP grandfather addendum draft" },
      { wave: "21R", path: repoRel(OUTPUTS.wave21r), class: "vision-events sealed missing record draft" },
      { wave: "21S", path: repoRel(OUTPUTS.wave21s), class: "168h rewalk schedule draft" }
    ],
    nextGates: [
      "Intake Liris final hashes/content for Wave 21N/Q/R/S when relayed.",
      "Do not treat PROF-VISION as complete until a final return is supplied or operator marks it abandoned.",
      "Wave 21H operator-mediated T1 paste and rehash remains pending.",
      "LX-383 approval and CHIEFCOUNCIL dissent disposition remain separate gates."
    ],
    boundary: "Wave 21N/Q/R/S ACER draft counterparts only. Writes are limited to four ACER-local DRAFT_ONLY_NOT_RATIFIED documents plus local report/memory/map surfaces. No Liris artifact overwrite, no manifest content transfer, no peer endpoint, no payload transfer, no Liris disk write by ACER, no MCP invocation, no exterior MCP, no model fanout, no device action, no emit, no ed25519, no quorum outreach, no census admission, no PID mint, no quarantine lift, no promotion."
  };
  plan.planHash = sha256(JSON.stringify(plan));
  return plan;
}

function buildWave21n(plan) {
  return [
    "# D50 Wave 21N - PID Grammar Registry (ACER)",
    "",
    "| Field | Value |",
    "|-------|-------|",
    "| status | DRAFT_ONLY_NOT_RATIFIED |",
    "| supervisor_pid | BH.SUPERVISOR.PID.FED.REINTEGRATION.INSTRUCT-KR.GRAMMAR.ACER |",
    "| co_supervisor_pid | BH.SUPERVISOR.PID.FED.REINTEGRATION.PID100B.UNIVERSAL.ACER |",
    "| source | ACER local counterpart to partial Liris Wave 21N relay |",
    "| relay_started_at | 2026-04-27T20:12:49Z |",
    "",
    "## Purpose",
    "",
    "Define the minimum PID grammar that Wave 21 federation artifacts must carry before any later reconciliation or promotion wave can reason about them.",
    "",
    "## Required Fields",
    "",
    "- `status`: must be explicit, with draft artifacts using `DRAFT_ONLY_NOT_RATIFIED`.",
    "- `wave`: stable wave id such as `wave.21N.pid-grammar-registry`.",
    "- `issued_by`: named supervisor/prof surface that produced the artifact.",
    "- `supervisor_pid`: primary supervisor PID.",
    "- `co_supervisor_pids`: zero or more supporting supervisor PIDs.",
    "- `operator_witness`: if present, names the human witness context without expanding authority.",
    "- `source_relays`: explicit source of any operator-relayed evidence.",
    "- `boundary`: explicit no-action boundary.",
    "- `next_gate`: exact gate that can move the artifact forward.",
    "",
    "## Wave 21 Rule",
    "",
    "A Wave 21 artifact without PID grammar is intake-only. It cannot be promoted, reconciled, or used to lift any federation boundary.",
    "",
    "## Liris Relay State",
    "",
    `- Liris Wave 21N write start was relayed, path \`${plan.lirisPartialRelay.wave21n.path}\`.`,
    "- Final Liris Wave 21N hash has not been relayed to ACER.",
    "- Liris Wave 21Q/21R/21S final artifacts have not been relayed to ACER.",
    "",
    "## Boundary",
    "",
    plan.boundary
  ].join("\n");
}

function buildWave21q(plan) {
  return [
    "# D50 Wave 21Q - Codex MCP Grandfather Addendum (ACER)",
    "",
    "| Field | Value |",
    "|-------|-------|",
    "| status | DRAFT_ONLY_NOT_RATIFIED |",
    "| supervisor_pid | BH.SUPERVISOR.PID.FED.REINTEGRATION.MCP.OWN.GATE.ACER |",
    `| policy_version | ${plan.mcpPolicy.policyVersion} |`,
    `| default_server_label | ${plan.mcpPolicy.serverLabel} |`,
    `| default_connector_id | ${plan.mcpPolicy.connectorId} |`,
    "",
    "## Purpose",
    "",
    "Grandfather only the existing Codex MCP surfaces that already obey Asolaria-owned MCP policy. This is not permission to add new exterior MCP routes.",
    "",
    "## Grandfathered Classes",
    "",
    "- Asolaria-owned MCP routes labeled with Asolaria/BEHCS-256 authority.",
    "- Sovereign LAN or loopback BEHCS-bus routes that pass local policy checks.",
    "- Operator-mediated paste or local file transfer, explicitly not reclassified as MCP traffic.",
    "",
    "## Forbidden Classes",
    "",
    "- Exterior MCP endpoints.",
    "- Cloud sync routes treated as MCP authority.",
    "- Model fanout through MCP.",
    "- Silent tool additions by provider, peer, browser, or bridge lane.",
    "- Any route that lacks a local Asolaria policy artifact and boundary declaration.",
    "",
    "## Local Evidence",
    "",
    `- Source file: \`${INPUTS.asolariaMcpPolicy}\`.`,
    `- Source sha256: \`${plan.sourceStatus.asolariaMcpPolicy.sha256}\`.`,
    "- `getAsolariaMcpAgentProfiles()` declares the rule: any MCP request must route through Asolaria OS / BEHCS-256 and external MCP endpoints are refused.",
    "",
    "## Boundary",
    "",
    plan.boundary
  ].join("\n");
}

function buildWave21r(plan) {
  return [
    "# D50 Wave 21R - Vision Events Sealed Missing Record (ACER)",
    "",
    "| Field | Value |",
    "|-------|-------|",
    "| status | DRAFT_ONLY_NOT_RATIFIED |",
    "| supervisor_pid | BH.SUPERVISOR.PID.FED.REINTEGRATION.VISION.WITNESS.ACER |",
    "| source | Liris follow-up 5-PROF wave relay |",
    "| verdict | PROF_VISION_FINAL_RETURN_MISSING |",
    "",
    "## Missing Record",
    "",
    "The relay shows PROF-VISION witness preservation still searching/reading at the last observed state. ACER has no final PROF-VISION return, no final artifact hash, and no sealed witness-event content.",
    "",
    "## Seal",
    "",
    "`MISSING_UNTIL_PROF_VISION_RETURN`. This record preserves absence as evidence. It does not claim witness preservation succeeded.",
    "",
    "## Known Relay Fragment",
    "",
    "- PROF-VISION focus: witness preservation.",
    "- Tool-use count reported at relay time: 18.",
    "- Last visible state: searching for 6 patterns, reading 7 files.",
    "",
    "## Required Next Evidence",
    "",
    "- Final PROF-VISION return text or operator abandonment mark.",
    "- Any produced artifact path.",
    "- Line count and sha256 for each artifact.",
    "- Explicit witness-preservation verdict.",
    "",
    "## Boundary",
    "",
    plan.boundary
  ].join("\n");
}

function buildWave21s(plan) {
  return [
    "# D50 Wave 21S - 168h Rewalk Schedule (ACER)",
    "",
    "| Field | Value |",
    "|-------|-------|",
    "| status | DRAFT_ONLY_NOT_RATIFIED |",
    "| supervisor_pid | BH.SUPERVISOR.PID.FED.REINTEGRATION.SCHEDULER.DECAY.ACER |",
    `| anchor_utc | ${plan.schedule.relayStartedAtUtc} |`,
    `| anchor_local | ${plan.schedule.relayStartedAtLocal} |`,
    `| due_168h_utc | ${plan.schedule.due168hUtc} |`,
    `| due_168h_local | ${plan.schedule.due168hLocal} |`,
    "",
    "## Schedule",
    "",
    `- T+24h check: ${plan.schedule.check24hUtc}.`,
    `- T+72h check: ${plan.schedule.check72hUtc}.`,
    `- T+168h rewalk due: ${plan.schedule.due168hUtc} / ${plan.schedule.due168hLocal}.`,
    "",
    "## Rewalk Scope",
    "",
    "- Re-read Wave 21H payload state.",
    "- Re-read Wave 21N/Q/R/S final Liris artifact hashes.",
    "- Re-read CHIEFCOUNCIL dissent disposition.",
    "- Re-read PROF-VISION witness preservation final return.",
    "- Keep all promotion paths blocked unless those gates are explicitly satisfied.",
    "",
    "## Boundary",
    "",
    plan.boundary
  ].join("\n");
}

function buildMap(plan) {
  return {
    mapId: "federation-reintegration-wave21nqrs-acer-draft-counterparts-map.v1",
    generatedAt,
    nodes: [
      { id: "wave21nqrs", kind: "draft_counterpart_wave", status: plan.status },
      ...plan.draftWrites.map((row) => ({ id: row.wave, kind: "draft_write", path: row.path, class: row.class })),
      { id: "prof-vision-return", kind: "missing_gate", status: "pending" },
      { id: "wave21h", kind: "blocked_gate", status: "operator_mediated_paste_pending" },
      ...plan.supervisorLevels.map((row) => ({ id: row.supervisorPid, kind: "supervisor_pid", level: row.level, verdict: row.verdict }))
    ],
    edges: [
      ...plan.draftWrites.map((row) => ({ from: "wave21nqrs", to: row.wave, relation: "writes" })),
      { from: "wave21nqrs", to: "prof-vision-return", relation: "awaits" },
      { from: "wave21nqrs", to: "wave21h", relation: "does_not_unblock" },
      ...plan.supervisorLevels.map((row) => ({ from: "wave21nqrs", to: row.supervisorPid, relation: "gated_by" }))
    ],
    boundary: plan.boundary
  };
}

function buildGlpj(plan) {
  return {
    glpjId: "federation-reintegration-wave21nqrs-acer-draft-counterparts.glpj",
    generatedAt,
    family: "federation",
    d11: "ACER_DRAFT_COUNTERPARTS_ONLY",
    glyphs: plan.supervisorLevels.map((row, index) => ({
      token: `FED-WAVE21NQRS-L${index}`,
      level: row.level,
      prof: row.prof,
      supervisorPid: row.supervisorPid,
      verdict: row.verdict
    })),
    outputs: plan.draftWrites,
    boundary: plan.boundary
  };
}

function buildReport(plan) {
  const lines = [];
  lines.push("# Federation Reintegration Wave 21N/Q/R/S ACER Draft Counterparts");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Status: ${plan.status}`);
  lines.push(`Plan hash: ${plan.planHash}`);
  lines.push("");
  lines.push("## Result");
  lines.push("");
  lines.push("- Wrote ACER-local draft counterparts for Wave 21N, 21Q, 21R, and 21S.");
  lines.push("- Liris final hashes for 21Q/21R/21S are not present in the relay.");
  lines.push("- PROF-VISION remains missing until a final return arrives.");
  lines.push("- Wave 21H paste gate remains operator-mediated and blocked.");
  lines.push("");
  lines.push("## Supervisor Levels");
  lines.push("");
  for (const row of plan.supervisorLevels) lines.push(`- ${row.level} / ${row.prof}: ${row.verdict}`);
  lines.push("");
  lines.push("## Boundary");
  lines.push("");
  lines.push(plan.boundary);
  return lines.join("\n");
}

function main() {
  const plan = buildPlan();
  const artifacts = Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)]));
  const memory = {
    memoryId: "federation-reintegration-wave21nqrs-acer-draft-counterparts.v1",
    generatedAt,
    status: plan.status,
    significance: "ACER emitted draft counterparts for Liris Wave 21N/Q/R/S while preserving the partial-relay state and keeping Wave 21H blocked.",
    planHash: plan.planHash,
    artifacts,
    boundary: plan.boundary
  };

  writeJson(OUTPUTS.plan, plan);
  writeText(OUTPUTS.wave21n, buildWave21n(plan));
  writeText(OUTPUTS.wave21q, buildWave21q(plan));
  writeText(OUTPUTS.wave21r, buildWave21r(plan));
  writeText(OUTPUTS.wave21s, buildWave21s(plan));
  writeJson(OUTPUTS.reportJson, { ...plan, artifacts });
  writeJson(OUTPUTS.memory, memory);
  writeJson(OUTPUTS.map, buildMap(plan));
  writeJson(OUTPUTS.glpj, buildGlpj(plan));
  writeText(OUTPUTS.report, buildReport(plan));

  console.log(JSON.stringify({
    ok: true,
    status: plan.status,
    relationship: plan.relationship,
    planHash: plan.planHash,
    draftWrites: plan.draftWrites.map((row) => row.path),
    report: repoRel(OUTPUTS.report),
    boundary: plan.boundary
  }, null, 2));
}

main();
