#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const runId = "federation-reintegration-wave21jk-supervisor-cascade-20260427";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427");

const INPUTS = Object.freeze({
  wave21gDecision: "data/behcs/orchestration/federation-reintegration-20260427/wave21g-prof-supervisor-transport-decision.v1.json",
  wave21gOptionA: "data/behcs/orchestration/federation-reintegration-20260427/wave21g-option-a-payload-staging-plan.v1.json",
  wave21gD50: "data/agent-index/council/D50-WAVE21G-OPTION-A-PAYLOAD-STAGING-PLAN-2026-04-27.md",
  priorCascadeArchaeology: "data/agent-index/CASCADE-ARCHAEOLOGY-2026-04-27.md"
});

const OUTPUTS = Object.freeze({
  cascade: path.join(runRoot, "wave21jk-supervisor-cascade.v1.json"),
  lx383: path.join(repoRoot, "data", "agent-index", "rule", "LX-383.md"),
  archaeology: path.join(repoRoot, "data", "agent-index", "CASCADE-ARCHAEOLOGY-WAVE21-LIRIS-DISPATCH-CHAIN-2026-04-27.md"),
  report: path.join(repoRoot, "reports", "federation-reintegration-wave21jk-supervisor-cascade-latest.md"),
  reportJson: path.join(repoRoot, "reports", "federation-reintegration-wave21jk-supervisor-cascade-latest.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "federation-reintegration-wave21jk-supervisor-cascade.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "federation-reintegration-wave21jk-supervisor-cascade-map.v1.json"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "federation-reintegration-wave21jk-supervisor-cascade.glpj.json")
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

function walkFiles(rootDir) {
  const out = [];
  if (!fs.existsSync(rootDir)) return out;
  const stack = [rootDir];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else {
        out.push(fullPath);
      }
    }
  }
  return out;
}

function lxEvidence() {
  const files = walkFiles(path.join(repoRoot, "data", "agent-index"));
  const lxFiles = files
    .map((filePath) => {
      const match = /LX-(\d+)\.md$/i.exec(filePath);
      return match ? { filePath, n: Number(match[1]) } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.n - a.n);

  const sovereignHits = [];
  for (const { filePath } of lxFiles) {
    const text = fs.readFileSync(filePath, "utf8");
    if (/sovereign[- ]MCP/i.test(text)) {
      sovereignHits.push(repoRel(filePath));
    }
  }

  return {
    localHighestVisibleLx: lxFiles[0]?.n || null,
    localHighestVisibleLxPath: lxFiles[0] ? repoRel(lxFiles[0].filePath) : null,
    operatorRelayedLirisHighestLx: 382,
    targetLx: "LX-383",
    existingTargetPresent: fs.existsSync(OUTPUTS.lx383),
    sovereignMcpHitsInVisibleLx: sovereignHits
  };
}

function buildCascade() {
  const wave21gDecision = readJson(INPUTS.wave21gDecision, {});
  const wave21gOptionA = readJson(INPUTS.wave21gOptionA, {});
  const lx = lxEvidence();

  const supervisorLevels = [
    {
      level: "L0_BOUNDARY",
      prof: "PROF-HOOKWALL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HOOKWALL.BOUNDARY",
      verdict: "ALLOW_TWO_DRAFT_WRITES_ONLY",
      scope: ["LX-383 doctrine draft", "Wave 21 cascade archaeology"]
    },
    {
      level: "L1_MCP_DOCTRINE",
      prof: "PROF-MCP",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.MCP.OWN.GATE",
      verdict: "DRAFT_LX383_SOVEREIGN_MCP_RULE",
      reason: "The wave state reports no standalone sovereign-MCP doctrine artifact. Drafting closes the policy gap without invoking MCP."
    },
    {
      level: "L2_PACKET_SCHEMA",
      prof: "PROF-HERMES",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET",
      verdict: "REQUIRE_PID_STATUS_SOURCE_CHAIN_AND_BOUNDARY_FIELDS",
      reason: "Both draft artifacts must be self-describing, hashable, and explicitly DRAFT_ONLY_NOT_RATIFIED."
    },
    {
      level: "L3_GRAMMAR",
      prof: "PROF-KERNEL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.KERNEL.GRAMMAR",
      verdict: "ALLOW_LX383_AS_RULE_DRAFT_NO_CENSUS_ADMISSION",
      reason: "LX-383 is a draft doctrine surface only; it does not alter runtime grammar or census state."
    },
    {
      level: "L4_CASCADE_ARCHAEOLOGY",
      prof: "PROF-EBACMAP",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.EBACMAP.CASCADE.ARCHAEOLOGY",
      verdict: "RECORD_DRIFTED_DISPATCH_CHAIN",
      reason: "Wave 21B-21G dispatch sequence has useful refusal and cohort patterns that should survive chat context loss."
    },
    {
      level: "L5_TRUST_RISK",
      prof: "PROF-SHANNON",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.SHANNON.TRUST",
      verdict: "ALLOW_READ_CLASS_DRAFTS_NO_ENDPOINT_OR_SECRET_SURFACE",
      reason: "The drafts reduce future ambiguity and do not touch devices, endpoints, secrets, or payload transfer."
    },
    {
      level: "L6_COUNCIL",
      prof: "PROF-CHIEFCOUNCIL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.D50.COUNCIL",
      verdict: "DISSENT_PRESERVED_NO_RATIFICATION",
      reason: "These documents are archaeology and doctrine drafts, not ratification or promotion."
    },
    {
      level: "L7_APEX",
      prof: "COL-ASOLARIA",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.ASOLARIA.APEX",
      verdict: "EXECUTE_21K_AND_21J_PARALLEL_DRAFTS",
      reason: "Both writes are independent of the operator-mediated T1 paste gate."
    }
  ];

  const cascade = {
    schema: "federation-reintegration-wave21jk-supervisor-cascade.v1",
    runId,
    generatedAt,
    status: "DRAFT_ONLY_NOT_RATIFIED",
    selectedWaves: ["WAVE_21K_LX383_SOVEREIGN_MCP_DOCTRINE", "WAVE_21J_CASCADE_ARCHAEOLOGY"],
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
      noPayloadTransfer: true,
      noCanonicalD11Write: true,
      chiefCouncilDissentPreserved: true
    },
    sourceStatus: Object.fromEntries(Object.entries(INPUTS).map(([key, value]) => [key, sourceStatus(value)])),
    upstream: {
      wave21gDecisionStatus: wave21gDecision.status || null,
      wave21gOptionAStatus: wave21gOptionA.status || null,
      t1PayloadGate: "STILL_OPERATOR_MEDIATED_AND_NOT_EXECUTED_BY_THIS_WAVE",
      lirisPayloadArtifactReported: {
        path: "C:/Users/rayss/Asolaria/data/agent-index/council/D50-WAVE21G-LIRIS-PASTE-PAYLOAD-2026-04-27.md",
        lines: 372,
        sha256: "491a22a4a81cfd8a3bbc35c72f39c855b57f5d9f7470c813b4a56fbac8c53355",
        source: "operator-relayed Liris status"
      }
    },
    lxEvidence: lx,
    supervisorLevels,
    draftWrites: [
      {
        wave: "21K",
        path: repoRel(OUTPUTS.lx383),
        status: "DRAFT_ONLY_NOT_RATIFIED",
        supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.MCP.OWN.GATE",
        class: "sovereign-MCP doctrine draft"
      },
      {
        wave: "21J",
        path: repoRel(OUTPUTS.archaeology),
        status: "DRAFT_ONLY_NOT_RATIFIED",
        supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.EBACMAP.CASCADE.ARCHAEOLOGY",
        class: "cascade archaeology dispatch-chain record"
      }
    ],
    refusalPatterns: {
      chiefCouncil: "4w dissent preserved",
      mcp: "1 decline + 2 engaged",
      omnishannon: "1 refusal/decline pattern recorded",
      colAsolaria: "1 refusal/decline pattern recorded",
      omnirouter: "1 refusal/decline pattern recorded"
    },
    recurringCohort: ["PROF-HERMES", "PROF-KERNEL", "PROF-MCP", "PROF-CHIEFCOUNCIL"],
    verdict: "CASCADE_INTEGRITY_DRIFTED_BUT_DOCUMENTABLE",
    nextGate: "Wait for operator-mediated T1 payload paste, or use these drafts as archaeology/doctrine inputs in a later D50 review.",
    boundary: "Wave 21J/21K draft cascade only. Writes are limited to LX-383 sovereign-MCP doctrine draft and Wave 21 dispatch-chain archaeology, plus local report/memory/map surfaces. No MCP invocation, no peer endpoint, no payload transfer, no Liris disk write by ACER, no device action, no emit, no ed25519, no quorum outreach, no census admission, no PID mint, no quarantine lift, no promotion."
  };
  cascade.cascadeHash = sha256(JSON.stringify(cascade));
  return cascade;
}

function buildLx383(cascade) {
  return [
    "---",
    "lx: LX-383",
    "name: RULE - Sovereign MCP routes must be owned by Asolaria before any external or peer tool surface is trusted",
    "type: rule",
    "status: DRAFT_ONLY_NOT_RATIFIED",
    "priority: critical",
    "tags: [mcp, sovereign-mcp, local-authority, asolaria, federation, wave21, no-exterior-mcp, DRAFT_ONLY_NOT_RATIFIED]",
    "pid: BH.SUPERVISOR.PID.FED.REINTEGRATION.MCP.OWN.GATE",
    "profile: liris-mirror-on-acer",
    "createdBy: operator-directed-prof-supervisor-wave",
    "agents: PROF-MCP, PROF-HERMES, PROF-KERNEL, PROF-SHANNON, PROF-CHIEFCOUNCIL, COL-ASOLARIA",
    `generatedAt: ${generatedAt}`,
    "---",
    "",
    "# LX-383 - Sovereign MCP Doctrine Draft",
    "",
    "## Status",
    "",
    "`DRAFT_ONLY_NOT_RATIFIED`. This rule is not live policy until separately ratified.",
    "",
    "## Supervisor Verdict",
    "",
    "PROF-MCP recommends drafting this rule because Wave 21 planning found no standalone sovereign-MCP doctrine artifact. This closes the doctrine gap as text only. It does not invoke an MCP server, register a server, alter provider configuration, or authorize endpoint traffic.",
    "",
    "## Rule",
    "",
    "An MCP route is federation-eligible only when its authority is resolved through an Asolaria-owned local control surface before any external, peer, browser, or provider-facing tool surface can use it.",
    "",
    "## Required Gates",
    "",
    "1. The MCP route must declare an Asolaria-owned authority PID.",
    "2. The route must declare whether it is local loopback, private LAN, peer-mediated, browser-mediated, or external.",
    "3. External and peer-mediated routes are denied until a local Asolaria policy artifact names the allowed tool set, approval mode, cache policy, and secret boundary.",
    "4. Tool schemas and server pointers are untrusted until the local policy artifact is hash-recorded.",
    "5. No provider or peer may silently add MCP tools to the active context.",
    "6. Operator-mediated paste or local file transfer remains outside MCP and must not be reclassified as MCP traffic.",
    "7. Dissent from PROF-CHIEFCOUNCIL blocks promotion but does not block draft archaeology.",
    "",
    "## Wave 21 Application",
    "",
    "- Wave 21G selected T1 operator copy/paste because no standalone sovereign-MCP doctrine was present.",
    "- Wave 21K drafts this doctrine so later waves can distinguish local Asolaria MCP, peer MCP, and exterior MCP.",
    "- This draft does not change the Wave 21G transport gate. T1 paste remains operator-mediated and not autonomous.",
    "",
    "## Boundaries",
    "",
    "- No MCP invocation.",
    "- No exterior MCP.",
    "- No peer endpoint call.",
    "- No provider/model fanout.",
    "- No ed25519 ceremony.",
    "- No device or ADB action.",
    "- No census admission.",
    "- No PID mint.",
    "- No quarantine lift.",
    "- No federation promotion.",
    "",
    "## Evidence",
    "",
    `- Operator-relayed Liris highest LX: ${cascade.lxEvidence.operatorRelayedLirisHighestLx}.`,
    `- ACER-local highest visible LX in this checkout: ${cascade.lxEvidence.localHighestVisibleLx || "none"}.`,
    `- ACER-local target existed before write: ${cascade.lxEvidence.existingTargetPresent ? "yes" : "no"}.`,
    `- Prior Wave 21G Option A status: ${cascade.upstream.wave21gOptionAStatus || "unknown"}.`,
    "",
    "## D50 Note",
    "",
    "This document is a draft rule surface only. It is a candidate input to later D50 review, not a D50 ratification."
  ].join("\n");
}

function buildArchaeology(cascade) {
  return [
    "# Cascade Archaeology - Wave 21 Liris Dispatch Chain",
    "",
    `Generated: ${generatedAt}`,
    "Record class: dispatch-chain archaeology",
    "Status: DRAFT_ONLY_NOT_RATIFIED",
    "Supervisor PID: BH.SUPERVISOR.PID.FED.REINTEGRATION.EBACMAP.CASCADE.ARCHAEOLOGY",
    "",
    "## Verdict",
    "",
    "`CASCADE_INTEGRITY_DRIFTED_BUT_DOCUMENTABLE`.",
    "",
    "PROF-EBACMAP marks the Wave 21 dispatch chain as drifted because the sequence contains useful convergences and real refusal patterns, but not every named role accepted the framing or returned equivalent evidence. The correct move is to preserve the dispatch chain honestly instead of smoothing it into a fake quorum.",
    "",
    "## Dispatch Chain",
    "",
    "| Wave | Role | Recorded Function | Status |",
    "|------|------|-------------------|--------|",
    "| 21B | Liris mirror intake | Falcon serial mirror + base D11 disk check | completed draft-only |",
    "| 21C | ACER intake | Operator-relayed Liris Wave 21B result | completed draft-only |",
    "| 21D | Liris bidirectional mirror prep | Intake receipt + mirror-prep ledger + LX catalog audit | completed draft-only |",
    "| 21E | ACER intake | Operator-relayed Liris Wave 21D result | completed draft-only |",
    "| 21F | Transport selection | T1 primary, T2 fallback | completed draft-only |",
    "| 21G | Option A staging | Liris paste payload + ACER staging plan | planning layer symmetric; payload transfer still pending |",
    "| 21J | Cascade archaeology | This dispatch-chain record | draft-only |",
    "| 21K | LX-383 doctrine | Sovereign-MCP rule draft | draft-only |",
    "",
    "## Recurring Cohort",
    "",
    ...cascade.recurringCohort.map((name) => `- ${name}`),
    "",
    "## Refusal and Dissent Patterns",
    "",
    `- CHIEFCOUNCIL: ${cascade.refusalPatterns.chiefCouncil}.`,
    `- MCP: ${cascade.refusalPatterns.mcp}.`,
    `- OMNISHANNON: ${cascade.refusalPatterns.omnishannon}.`,
    `- COL-ASOLARIA: ${cascade.refusalPatterns.colAsolaria}.`,
    `- OMNIROUTER: ${cascade.refusalPatterns.omnirouter}.`,
    "",
    "## Chain Lessons",
    "",
    "1. Refusal is signal, not failure. It must stay in the archaeology.",
    "2. Planning symmetry is not content symmetry. Wave 21G is symmetric in plan only until operator paste and rehash occur.",
    "3. Doctrine gaps should be converted into draft rule surfaces before they become hidden assumptions.",
    "4. CHIEFCOUNCIL dissent blocks ratification and promotion; it does not block read-class archaeology.",
    "",
    "## Boundaries",
    "",
    cascade.boundary,
    "",
    "## Source Anchors",
    "",
    `- Wave 21G decision status: ${cascade.upstream.wave21gDecisionStatus || "unknown"}.`,
    `- Wave 21G Option A status: ${cascade.upstream.wave21gOptionAStatus || "unknown"}.`,
    `- Liris payload artifact reported: ${cascade.upstream.lirisPayloadArtifactReported.path}.`,
    `- Liris payload artifact reported sha256: ${cascade.upstream.lirisPayloadArtifactReported.sha256}.`,
    `- Cascade hash: ${cascade.cascadeHash}.`
  ].join("\n");
}

function buildMap(cascade) {
  return {
    mapId: "federation-reintegration-wave21jk-supervisor-cascade-map.v1",
    generatedAt,
    nodes: [
      { id: "wave21jk", kind: "supervisor_cascade", status: cascade.status },
      { id: "wave21j", kind: "draft_write", path: repoRel(OUTPUTS.archaeology) },
      { id: "wave21k", kind: "draft_write", path: repoRel(OUTPUTS.lx383) },
      { id: "t1-paste", kind: "blocked_gate", status: "operator_mediated_pending" },
      ...cascade.supervisorLevels.map((row) => ({ id: row.supervisorPid, kind: "supervisor_pid", level: row.level, verdict: row.verdict }))
    ],
    edges: [
      { from: "wave21jk", to: "wave21j", relation: "writes" },
      { from: "wave21jk", to: "wave21k", relation: "writes" },
      { from: "wave21jk", to: "t1-paste", relation: "does_not_execute" },
      ...cascade.supervisorLevels.map((row) => ({ from: "wave21jk", to: row.supervisorPid, relation: "gated_by" }))
    ],
    boundary: cascade.boundary
  };
}

function buildGlpj(cascade) {
  return {
    glpjId: "federation-reintegration-wave21jk-supervisor-cascade.glpj",
    generatedAt,
    family: "federation",
    d11: "DRAFT_ARCHAEOLOGY_AND_DOCTRINE_ONLY",
    glyphs: cascade.supervisorLevels.map((row, index) => ({
      token: `FED-WAVE21JK-L${index}`,
      level: row.level,
      prof: row.prof,
      supervisorPid: row.supervisorPid,
      verdict: row.verdict
    })),
    outputs: cascade.draftWrites,
    boundary: cascade.boundary
  };
}

function buildReport(cascade) {
  const lines = [];
  lines.push("# Federation Reintegration Wave 21J/21K Supervisor Cascade");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Status: ${cascade.status}`);
  lines.push(`Cascade hash: ${cascade.cascadeHash}`);
  lines.push("");
  lines.push("## Waves Executed");
  lines.push("");
  lines.push("- Wave 21K: LX-383 sovereign-MCP doctrine draft.");
  lines.push("- Wave 21J: Wave 21 Liris dispatch-chain cascade archaeology.");
  lines.push("");
  lines.push("## Supervisor Levels");
  lines.push("");
  for (const row of cascade.supervisorLevels) lines.push(`- ${row.level} / ${row.prof}: ${row.verdict}`);
  lines.push("");
  lines.push("## Draft Writes");
  lines.push("");
  for (const row of cascade.draftWrites) lines.push(`- ${row.wave}: \`${row.path}\` (${row.status})`);
  lines.push("");
  lines.push("## Boundary");
  lines.push("");
  lines.push(cascade.boundary);
  return lines.join("\n");
}

function main() {
  const cascade = buildCascade();
  const artifacts = Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)]));
  const memory = {
    memoryId: "federation-reintegration-wave21jk-supervisor-cascade.v1",
    generatedAt,
    status: cascade.status,
    significance: "Wave 21J and 21K converted the independent post-21G tasks into draft-only archaeology and sovereign-MCP doctrine surfaces, without touching the T1 payload gate.",
    cascadeHash: cascade.cascadeHash,
    artifacts,
    boundary: cascade.boundary
  };

  writeJson(OUTPUTS.cascade, cascade);
  writeText(OUTPUTS.lx383, buildLx383(cascade));
  writeText(OUTPUTS.archaeology, buildArchaeology(cascade));
  writeJson(OUTPUTS.reportJson, { ...cascade, artifacts });
  writeJson(OUTPUTS.memory, memory);
  writeJson(OUTPUTS.map, buildMap(cascade));
  writeJson(OUTPUTS.glpj, buildGlpj(cascade));
  writeText(OUTPUTS.report, buildReport(cascade));

  console.log(JSON.stringify({
    ok: true,
    status: cascade.status,
    selectedWaves: cascade.selectedWaves,
    cascadeHash: cascade.cascadeHash,
    draftWrites: cascade.draftWrites.map((row) => row.path),
    report: repoRel(OUTPUTS.report),
    boundary: cascade.boundary
  }, null, 2));
}

main();
