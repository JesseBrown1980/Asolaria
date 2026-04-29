#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const runId = "federation-reintegration-wave21t-liris-nqrs-hash-intake-20260427";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427");

const INPUTS = Object.freeze({
  wave21nqrsPlan: "data/behcs/orchestration/federation-reintegration-20260427/wave21nqrs-acer-draft-counterparts.v1.json",
  wave21mIntake: "data/behcs/orchestration/federation-reintegration-20260427/wave21m-liris-corpus-manifest-intake.v1.json",
  acer21n: "data/agent-index/council/D50-WAVE21N-PID-GRAMMAR-REGISTRY-ACER-2026-04-27.md",
  acer21q: "data/agent-index/council/D50-WAVE21Q-CODEX-MCP-GRANDFATHER-ADDENDUM-ACER-2026-04-27.md",
  acer21r: "data/agent-index/council/D50-WAVE21R-VISION-EVENTS-SEALED-MISSING-RECORD-ACER-2026-04-27.md",
  acer21s: "data/agent-index/council/D50-WAVE21S-168H-REWALK-SCHEDULE-ACER-2026-04-27.md"
});

const OUTPUTS = Object.freeze({
  intake: path.join(runRoot, "wave21t-liris-nqrs-hash-intake.v1.json"),
  d50Intake: path.join(repoRoot, "data", "agent-index", "council", "D50-LIRIS-WAVE21NQRS-HASH-INTAKE-2026-04-27.md"),
  report: path.join(repoRoot, "reports", "federation-reintegration-wave21t-liris-nqrs-hash-intake-latest.md"),
  reportJson: path.join(repoRoot, "reports", "federation-reintegration-wave21t-liris-nqrs-hash-intake-latest.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "federation-reintegration-wave21t-liris-nqrs-hash-intake.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "federation-reintegration-wave21t-liris-nqrs-hash-intake-map.v1.json"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "federation-reintegration-wave21t-liris-nqrs-hash-intake.glpj.json")
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

function buildIntake() {
  const wave21nqrs = readJson(INPUTS.wave21nqrsPlan, {});
  const wave21m = readJson(INPUTS.wave21mIntake, {});
  const acer = {
    "21N": fileStatus(INPUTS.acer21n),
    "21Q": fileStatus(INPUTS.acer21q),
    "21R": fileStatus(INPUTS.acer21r),
    "21S": fileStatus(INPUTS.acer21s)
  };

  const liris = {
    "21N": {
      path: "data/agent-index/council/D50-WAVE21N-PID-GRAMMAR-REGISTRY-LIRIS-2026-04-27.md",
      lines: 87,
      sha256: "8938b3d5ea17131ab6b7755f9e8d51e9256c60b5017d81d57692af3fb137c07f",
      status: "DRAFT_ONLY_NOT_RATIFIED"
    },
    "21Q": {
      path: "data/agent-index/D11-AUDIT-LEDGER-ADDENDUM-CODEX-MCP-GRANDFATHER-LIRIS-2026-04-27.md",
      lines: 66,
      sha256: "e1380e024f9c765de8f224e91c55ac7d1dc1ddb9f80613c7f2e16e4a53cac12f",
      status: "DRAFT_ONLY_NOT_RATIFIED"
    },
    "21R": {
      path: "data/agent-index/council/D50-WAVE21R-VISION-EVENTS-SEALED-MISSING-LIRIS-2026-04-27.md",
      lines: 55,
      sha256: "40dbec8f77ea67d04018006e450fe147837870f85cd3f06025e3f1f2ff6156e6",
      status: "DRAFT_ONLY_NOT_RATIFIED"
    },
    "21S": {
      path: "data/agent-index/council/D50-WAVE21S-168H-REWALK-SCHEDULE-LIRIS-2026-04-27.md",
      lines: 83,
      sha256: "9f3693a06b66cb7b119c5ce16f028a6b5fd613ee63591318fa51e3294f2974ab",
      status: "DRAFT_ONLY_NOT_RATIFIED"
    }
  };

  const supervisorLevels = [
    {
      level: "L0_BOUNDARY",
      prof: "PROF-HOOKWALL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HOOKWALL.BOUNDARY",
      verdict: "ALLOW_HASH_INTAKE_ONLY"
    },
    {
      level: "L1_PACKET_SCHEMA",
      prof: "PROF-HERMES",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET.ACER",
      verdict: "RECORD_LIRIS_HASHES_AND_LINES_NO_CONTENT"
    },
    {
      level: "L2_GRAMMAR",
      prof: "PROF-KERNEL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.KERNEL.GRAMMAR.ACER",
      verdict: "DIVERGED_DRAFT_SIBLINGS_CONTINUES"
    },
    {
      level: "L3_SCHEDULER",
      prof: "PROF-SCHEDULER",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.SCHEDULER.DECAY.ACER",
      verdict: "ANCHOR_ASYMMETRY_RECORDED_NO_RECONCILIATION"
    },
    {
      level: "L4_VISION",
      prof: "PROF-VISION",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.VISION.WITNESS.ACER",
      verdict: "ACER_MISSING_SEAL_AND_LIRIS_DISPOSITION_OPTIONS_REMAIN_ASYMMETRIC"
    },
    {
      level: "L5_COMMS",
      prof: "PROF-COMMS",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.COMMS.BILATERAL.ACER",
      verdict: "HASH_EXCHANGE_RECORDED_NO_PAYLOAD_CHANNEL_EXECUTED"
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
      verdict: "NEXT_GATE_REMAINS_OPERATOR_PASTE_OR_EXPLICIT_RECONCILIATION"
    }
  ];

  const comparison = Object.fromEntries(Object.keys(liris).map((wave) => {
    const left = liris[wave];
    const right = acer[wave];
    return [wave, {
      hashMatches: left.sha256 === right.sha256,
      lineCountMatches: left.lines === right.lines,
      lirisSha256: left.sha256,
      acerSha256: right.sha256,
      relationship: "DIVERGED_DRAFT_SIBLINGS"
    }];
  }));

  const intake = {
    schema: "federation-reintegration-wave21t-liris-nqrs-hash-intake.v1",
    runId,
    generatedAt,
    status: "DRAFT_ONLY_NOT_RATIFIED",
    relationship: "LIRIS_NQRS_HASHES_RECORDED_DIVERGED_DRAFT_SIBLINGS",
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
      chiefCouncilDissentPreserved: true
    },
    sourceStatus: Object.fromEntries(Object.entries(INPUTS).map(([key, value]) => [key, sourceStatus(value)])),
    upstream: {
      wave21nqrsStatus: wave21nqrs.status || null,
      wave21nqrsPlanHash: wave21nqrs.planHash || null,
      wave21mFollowupStatus: wave21m.followupSupervisorWave?.status || null,
      wave21HGate: "STILL_REQUIRES_OPERATOR_MEDIATED_PASTE_ACTION"
    },
    liris,
    acer,
    comparison,
    asymmetries: [
      {
        class: "schedule_anchor",
        acer: "2026-04-27T20:12:49Z anchor; 168h due 2026-05-04T20:12:49Z",
        liris: "2026-04-27T00:00:00Z ledger-date anchor; earliest practical 2026-04-28T20:00:00Z; latest before decay 2026-05-03T16:00:00Z",
        disposition: "Both valid under HOLD; reconciliation deferred."
      },
      {
        class: "vision_disposition",
        acer: "PROF_VISION_FINAL_RETURN_MISSING",
        liris: "Five disposition options enumerated without choosing.",
        disposition: "Asymmetry recorded; no choice made."
      },
      {
        class: "hash_exchange",
        acerPrior: "21Q/21R/21S Liris final hashes missing",
        now: "Hashes supplied by operator relay and recorded here.",
        disposition: "Missing-hash state resolved by metadata-only intake; content transfer still pending."
      }
    ],
    supervisorLevels,
    nextGates: [
      "Wave 21H operator-mediated D11 paste and rehash remains pending.",
      "If full Liris N/Q/R/S content is pasted later, stage and hash-check before any reconciliation.",
      "Schedule-anchor reconciliation requires operator-direct or later supervisor decision.",
      "Vision disposition remains open until PROF-VISION final return or operator-direct choice.",
      "CHIEFCOUNCIL dissent remains preserved."
    ],
    boundary: "Wave 21T hash intake only. Records operator-relayed Liris Wave 21N/Q/R/S line counts and hashes, compares them to ACER draft siblings, and preserves asymmetries. No content transfer, no overwrite, no schedule reconciliation, no vision disposition choice, no peer endpoint, no payload transfer, no Liris disk write by ACER, no MCP invocation, no exterior MCP, no model fanout, no device action, no emit, no ed25519, no quorum outreach, no census admission, no PID mint, no quarantine lift, no promotion."
  };
  intake.intakeHash = sha256Text(JSON.stringify(intake));
  return intake;
}

function buildD50(intake) {
  const lines = [];
  lines.push("# D50 Liris Wave 21N/Q/R/S Hash Intake");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Status: ${intake.status}`);
  lines.push(`Relationship: ${intake.relationship}`);
  lines.push("");
  lines.push("## Liris Hashes");
  lines.push("");
  lines.push("| Wave | Liris path | Lines | sha256 |");
  lines.push("|------|------------|-------|--------|");
  for (const wave of ["21N", "21Q", "21R", "21S"]) {
    const row = intake.liris[wave];
    lines.push(`| ${wave} | \`${row.path}\` | ${row.lines} | \`${row.sha256}\` |`);
  }
  lines.push("");
  lines.push("## ACER Siblings");
  lines.push("");
  lines.push("| Wave | ACER path | Lines | sha256 |");
  lines.push("|------|-----------|-------|--------|");
  for (const wave of ["21N", "21Q", "21R", "21S"]) {
    const row = intake.acer[wave];
    lines.push(`| ${wave} | \`${row.path}\` | ${row.lines} | \`${row.sha256}\` |`);
  }
  lines.push("");
  lines.push("## Disposition");
  lines.push("");
  lines.push("- All four waves remain `DIVERGED_DRAFT_SIBLINGS`.");
  lines.push("- Missing Liris hash state for 21Q/21R/21S is resolved by metadata-only relay.");
  lines.push("- No full content was transferred.");
  lines.push("- No schedule anchor or vision disposition was reconciled.");
  lines.push("");
  lines.push("## Per-Level Verdicts");
  lines.push("");
  for (const row of intake.supervisorLevels) lines.push(`- ${row.level} / ${row.prof} / ${row.supervisorPid}: ${row.verdict}`);
  lines.push("");
  lines.push("## Boundary");
  lines.push("");
  lines.push(intake.boundary);
  return lines.join("\n");
}

function buildMap(intake) {
  return {
    mapId: "federation-reintegration-wave21t-liris-nqrs-hash-intake-map.v1",
    generatedAt,
    nodes: [
      { id: "wave21t", kind: "hash_intake", status: intake.status },
      ...Object.keys(intake.liris).map((wave) => ({ id: `liris-${wave}`, kind: "operator_relay_hash", sha256: intake.liris[wave].sha256 })),
      ...Object.keys(intake.acer).map((wave) => ({ id: `acer-${wave}`, kind: "local_sibling", sha256: intake.acer[wave].sha256 })),
      { id: "schedule-anchor", kind: "asymmetry", status: "unreconciled" },
      { id: "vision-disposition", kind: "asymmetry", status: "unreconciled" },
      { id: "wave21h", kind: "blocked_gate", status: "operator_mediated_paste_pending" },
      ...intake.supervisorLevels.map((row) => ({ id: row.supervisorPid, kind: "supervisor_pid", level: row.level, verdict: row.verdict }))
    ],
    edges: [
      ...Object.keys(intake.liris).map((wave) => ({ from: "wave21t", to: `liris-${wave}`, relation: "records" })),
      ...Object.keys(intake.acer).map((wave) => ({ from: "wave21t", to: `acer-${wave}`, relation: "compares" })),
      { from: "wave21t", to: "schedule-anchor", relation: "preserves" },
      { from: "wave21t", to: "vision-disposition", relation: "preserves" },
      { from: "wave21t", to: "wave21h", relation: "does_not_unblock" },
      ...intake.supervisorLevels.map((row) => ({ from: "wave21t", to: row.supervisorPid, relation: "gated_by" }))
    ],
    boundary: intake.boundary
  };
}

function buildGlpj(intake) {
  return {
    glpjId: "federation-reintegration-wave21t-liris-nqrs-hash-intake.glpj",
    generatedAt,
    family: "federation",
    d11: "HASH_INTAKE_ONLY",
    glyphs: intake.supervisorLevels.map((row, index) => ({
      token: `FED-WAVE21T-L${index}`,
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
  lines.push("# Federation Reintegration Wave 21T Liris N/Q/R/S Hash Intake");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Status: ${intake.status}`);
  lines.push(`Intake hash: ${intake.intakeHash}`);
  lines.push("");
  lines.push("## Result");
  lines.push("");
  lines.push("- Liris final hashes for Wave 21N/Q/R/S are recorded.");
  lines.push("- All four ACER/Liris artifact pairs remain diverged draft siblings.");
  lines.push("- Schedule anchor asymmetry is preserved, not reconciled.");
  lines.push("- Vision disposition asymmetry is preserved, not chosen.");
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
    memoryId: "federation-reintegration-wave21t-liris-nqrs-hash-intake.v1",
    generatedAt,
    status: intake.status,
    relationship: intake.relationship,
    significance: "Operator-relayed Liris Wave 21N/Q/R/S hashes are now recorded on ACER; all four remain diverged draft siblings with no content transfer or reconciliation.",
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
