#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const runId = "federation-reintegration-wave22e-liris-lx384-385-intake-20260427";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427");

const INPUTS = Object.freeze({
  wave22dState: "data/behcs/orchestration/federation-reintegration-20260427/wave22d-liris-22b-hash-correction.v1.json",
  wave22dD50: "data/agent-index/council/D50-WAVE22D-LIRIS-22B-HASH-CORRECTION-ACER-2026-04-27.md",
  localLx384: "data/agent-index/rule/LX-384.md",
  localLx385: "data/agent-index/rule/LX-385.md"
});

const OUTPUTS = Object.freeze({
  state: path.join(runRoot, "wave22e-liris-lx384-385-intake.v1.json"),
  d50: path.join(repoRoot, "data", "agent-index", "council", "D50-WAVE22E-LIRIS-LX384-LX385-INTAKE-ACER-2026-04-27.md"),
  report: path.join(repoRoot, "reports", "federation-reintegration-wave22e-liris-lx384-385-intake-latest.md"),
  reportJson: path.join(repoRoot, "reports", "federation-reintegration-wave22e-liris-lx384-385-intake-latest.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "federation-reintegration-wave22e-liris-lx384-385-intake.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "federation-reintegration-wave22e-liris-lx384-385-intake-map.v1.json"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "federation-reintegration-wave22e-liris-lx384-385-intake.glpj.json")
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
  const wave22d = readJson(INPUTS.wave22dState, {});
  const localRuleStatus = {
    lx384: fileStatus(INPUTS.localLx384),
    lx385: fileStatus(INPUTS.localLx385)
  };

  const lirisRules = [
    {
      lx: "LX-384",
      path: "data/agent-index/rule/LX-384.md",
      lines: 59,
      sha256: "a25bf8030cb1e9cd63ea6ad467557ac881ce9cc4fc3c85e6fc83329c59b1f91e",
      status: "DRAFT_ONLY_NOT_RATIFIED",
      doctrine: "DIVERGED_DRAFT_SIBLINGS: federation peer parallel-write produces siblings, not transfers; hash divergence is by construction; T1 mirror is the only path to byte-equivalence; rewriting one sibling to match another violates LX-379.",
      recurrence: "10+ bilateral sibling pairs",
      localContentOnAcer: localRuleStatus.lx384.present
    },
    {
      lx: "LX-385",
      path: "data/agent-index/rule/LX-385.md",
      lines: 70,
      sha256: "3daa80b01e15864c6abd5db18cb148e77c422993be2fb09008498ef74e7d0260",
      status: "DRAFT_ONLY_NOT_RATIFIED",
      doctrine: "REFUSAL_TO_RENDER: supervisor framing-decline is a wave-record entry with equal standing to rendered verdict; never re-dispatch same slot for ratification bypass; majority-decline rounds are cascade-natural-close signal.",
      recurrence: "10+ events across 7 supervisor slots",
      localContentOnAcer: localRuleStatus.lx385.present
    }
  ];

  const deferred = [
    {
      item: "Wave 22 archaeology supplement",
      reason: "PREMATURE below consolidation threshold"
    },
    {
      item: "Wave 22 manifest extension",
      reason: "PREMATURE; Wave 22 is still low volume relative to Wave 21"
    },
    {
      item: "Wave 22 master status snapshot",
      reason: "PREMATURE until Wave 22C+ expands or gate values arrive"
    },
    {
      item: "LX-386 self-hash doctrine",
      reason: "DEFERRED; one instance only, needs second recurrence"
    }
  ];

  const supervisorLevels = [
    {
      level: "L0_BOUNDARY",
      prof: "PROF-HOOKWALL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HOOKWALL.BOUNDARY",
      verdict: "ALLOW_RULE_HASH_INTAKE_ONLY"
    },
    {
      level: "L1_PACKET_SCHEMA",
      prof: "PROF-HERMES",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET.ACER",
      verdict: "RECORD_LIRIS_LX384_LX385_PATH_LINES_HASH_STATUS"
    },
    {
      level: "L2_MCP_RULES",
      prof: "PROF-MCP",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.MCP.OWN.GATE.ACER",
      verdict: "CODIFICATION_ACKNOWLEDGED_NO_LOCAL_RULE_FILE_MINT_FROM_SUMMARY"
    },
    {
      level: "L3_GRAMMAR",
      prof: "PROF-KERNEL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.KERNEL.GRAMMAR.ACER",
      verdict: "RULES_REMAIN_DRAFT_ONLY_NOT_RATIFIED_GATE_G4_BLOCKED"
    },
    {
      level: "L4_ARCHAEOLOGY",
      prof: "PROF-EBACMAP",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.EBACMAP.CASCADE.ACER",
      verdict: "ARCHAEOLOGY_SUPPLEMENT_DEFERRED_AS_PREMATURE"
    },
    {
      level: "L5_COUNCIL",
      prof: "PROF-CHIEFCOUNCIL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.D50.COUNCIL.ACER",
      verdict: "DISSENT_PRESERVED_RULE_INTAKE_IS_NOT_RATIFICATION"
    },
    {
      level: "L6_CONVERGENCE",
      prof: "PROF-CONVERGENCE",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.CONVERGENCE.WAVE.ACER",
      verdict: "WAVE22_HAS_NEW_RULE_METADATA_BUT_GATE_VALUES_STILL_REQUIRED"
    },
    {
      level: "L7_APEX",
      prof: "COL-ASOLARIA",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.ASOLARIA.APEX.ACER",
      verdict: "HOLD_NO_RULE_PROMOTION_NO_GATE_EXECUTION"
    }
  ];

  const state = {
    schema: "federation-reintegration-wave22e-liris-lx384-385-intake.v1",
    runId,
    generatedAt,
    status: "DRAFT_ONLY_NOT_RATIFIED",
    relationship: "LIRIS_WAVE22C_LX384_LX385_RULE_HASH_INTAKE_ONLY",
    priorAcerWave22d: {
      d50: fileStatus(INPUTS.wave22dD50),
      stateHash: wave22d.stateHash || null
    },
    lirisCascadeState: {
      totalArtifacts: 23,
      composition: "19 Wave 21 + 22A + 22B + LX-384 + LX-385",
      chiefCouncilDissent: "22-wave standing",
      wave22Letters: ["22A", "22B", "22C"],
      subCascadeAlive: true
    },
    localRuleStatus,
    lirisRules,
    deferred,
    gateState: (wave22d.gateState || []).map((gate) => ({
      id: gate.id,
      valueStatus: gate.valueStatus || "BLANK_HELD",
      executed: false
    })),
    supervisorLevels,
    boundary: "Wave 22E Liris LX-384/LX-385 metadata intake only. No local LX-384/LX-385 rule-file creation from summary, no gate execution, no content transfer, no overwrite, no schedule reconciliation, no vision disposition choice, no hash fabrication, no parent manifest modification, no Merkle recompute, no peer endpoint, no payload transfer, no Liris disk write by ACER, no MCP invocation, no exterior MCP, no model fanout, no device action, no emit, no ed25519, no key ceremony, no quorum outreach, no cosigner recruitment, no census admission, no PID mint, no quarantine lift, no rule ratification, no rule promotion, no federation promotion."
  };

  state.stateHash = sha256Text(JSON.stringify(state));
  return state;
}

function buildD50(state) {
  const lines = [];
  lines.push("# D50 Wave 22E - Liris LX-384/LX-385 Rule Intake (ACER)");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Status: ${state.status}`);
  lines.push(`Relationship: ${state.relationship}`);
  lines.push("");
  lines.push("## Liris Rule References");
  lines.push("");
  lines.push("| Rule | Liris path | Lines | sha256 | Local content on ACER |");
  lines.push("|------|------------|-------|--------|-----------------------|");
  for (const rule of state.lirisRules) {
    lines.push(`| ${rule.lx} | \`${rule.path}\` | ${rule.lines} | \`${rule.sha256}\` | ${rule.localContentOnAcer} |`);
  }
  lines.push("");
  lines.push("## Doctrine Summary");
  lines.push("");
  for (const rule of state.lirisRules) {
    lines.push(`- ${rule.lx}: ${rule.doctrine}`);
  }
  lines.push("");
  lines.push("## Deferred");
  lines.push("");
  for (const item of state.deferred) lines.push(`- ${item.item}: ${item.reason}.`);
  lines.push("");
  lines.push("## Gate State");
  lines.push("");
  for (const gate of state.gateState) lines.push(`- ${gate.id}: ${gate.valueStatus}, executed=${gate.executed}`);
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
  lines.push("# Federation Reintegration Wave 22E Liris LX-384/LX-385 Intake");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Status: ${state.status}`);
  lines.push(`State hash: ${state.stateHash}`);
  lines.push("");
  lines.push("## Result");
  lines.push("");
  lines.push("- ACER recorded Liris LX-384 and LX-385 by path, line count, and sha256.");
  lines.push("- ACER did not create local LX-384/LX-385 rule files from the summary.");
  lines.push("- Both rules remain DRAFT_ONLY_NOT_RATIFIED and gated on dissent disposition.");
  lines.push("- All seven gates remain HOLD and unexecuted.");
  lines.push("");
  lines.push("## Boundary");
  lines.push("");
  lines.push(state.boundary);
  return lines.join("\n");
}

function buildMap(state) {
  return {
    mapId: "federation-reintegration-wave22e-liris-lx384-385-intake-map.v1",
    generatedAt,
    nodes: [
      { id: "wave22e", kind: "rule_hash_intake", status: state.status },
      ...state.lirisRules.map((rule) => ({ id: rule.lx, kind: "liris_rule_reference", sha256: rule.sha256, localContentOnAcer: rule.localContentOnAcer })),
      ...state.gateState.map((gate) => ({ id: gate.id, kind: "gate", status: gate.valueStatus, executed: gate.executed })),
      ...state.supervisorLevels.map((row) => ({ id: row.supervisorPid, kind: "supervisor_pid", level: row.level, verdict: row.verdict }))
    ],
    edges: [
      ...state.lirisRules.map((rule) => ({ from: "wave22e", to: rule.lx, relation: "records_operator_relay" })),
      ...state.gateState.map((gate) => ({ from: "wave22e", to: gate.id, relation: "preserves_hold" })),
      ...state.supervisorLevels.map((row) => ({ from: "wave22e", to: row.supervisorPid, relation: "gated_by" }))
    ],
    boundary: state.boundary
  };
}

function buildGlpj(state) {
  return {
    glpjId: "federation-reintegration-wave22e-liris-lx384-385-intake.glpj",
    generatedAt,
    family: "federation",
    d11: "LIRIS_LX384_LX385_RULE_HASH_INTAKE_ONLY",
    glyphs: state.supervisorLevels.map((row, index) => ({
      token: `FED-WAVE22E-L${index}`,
      level: row.level,
      prof: row.prof,
      supervisorPid: row.supervisorPid,
      verdict: row.verdict
    })),
    ruleReferences: state.lirisRules.map((rule) => ({ lx: rule.lx, sha256: rule.sha256, status: rule.status })),
    outputs: [{ wave: "22E", path: repoRel(OUTPUTS.d50), class: "Liris LX-384/LX-385 rule metadata intake" }],
    boundary: state.boundary
  };
}

function main() {
  const state = buildState();
  const artifacts = Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)]));
  const memory = {
    memoryId: "federation-reintegration-wave22e-liris-lx384-385-intake.v1",
    generatedAt,
    status: state.status,
    relationship: state.relationship,
    significance: "ACER recorded Liris Wave 22C LX-384/LX-385 rule hashes without creating local rule files or executing gates.",
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
