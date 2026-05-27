#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const runId = "federation-reintegration-wave21z-liris-aggregate-correction-20260427";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427");

const INPUTS = Object.freeze({
  wave21wAcer: "data/agent-index/council/D50-LIRIS-WAVE21TV-RETURN-INTAKE-2026-04-27.md",
  wave21xAcer: "data/agent-index/council/D50-WAVE21X-CASCADE-NEXT-GATE-MATRIX-ACER-2026-04-27.md",
  wave21wxState: "data/behcs/orchestration/federation-reintegration-20260427/wave21wx-liris-21tv-return.v1.json"
});

const OUTPUTS = Object.freeze({
  state: path.join(runRoot, "wave21z-liris-aggregate-correction.v1.json"),
  d50: path.join(repoRoot, "data", "agent-index", "council", "D50-WAVE21Z-LIRIS-AGGREGATE-CORRECTION-ACER-2026-04-27.md"),
  report: path.join(repoRoot, "reports", "federation-reintegration-wave21z-liris-aggregate-correction-latest.md"),
  reportJson: path.join(repoRoot, "reports", "federation-reintegration-wave21z-liris-aggregate-correction-latest.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "federation-reintegration-wave21z-liris-aggregate-correction.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "federation-reintegration-wave21z-liris-aggregate-correction-map.v1.json"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "federation-reintegration-wave21z-liris-aggregate-correction.glpj.json")
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
  const priorState = readJson(INPUTS.wave21wxState, {});
  const priorWave21w = fileStatus(INPUTS.wave21wAcer);
  const priorWave21x = fileStatus(INPUTS.wave21xAcer);

  const supervisorLevels = [
    {
      level: "L0_BOUNDARY",
      prof: "PROF-HOOKWALL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HOOKWALL.BOUNDARY",
      verdict: "ALLOW_APPEND_ONLY_CORRECTION_NO_REWRITE"
    },
    {
      level: "L1_PACKET_SCHEMA",
      prof: "PROF-HERMES",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET.ACER",
      verdict: "RECORD_OPERATOR_RELAYED_AGGREGATE_CORRECTION_WITH_NO_CONTENT"
    },
    {
      level: "L2_CORPUS_ARCHAEOLOGY",
      prof: "PROF-EBACMAP",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.EBACMAP.CASCADE.ACER",
      verdict: "PRESERVE_21W_21X_AS_HISTORICAL_DRAFT_OUTPUTS"
    },
    {
      level: "L3_GRAMMAR",
      prof: "PROF-KERNEL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.KERNEL.GRAMMAR.ACER",
      verdict: "CLASSIFY_AS_AGGREGATE_METADATA_CORRECTION_NOT_CANON_REWRITE"
    },
    {
      level: "L4_ENTROPY",
      prof: "PROF-OMNISHANNON",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.OMNISHANNON.ENTROPY.ACER",
      verdict: "CASCADE_SATURATING_CONFIRMED_CORRECTION_HAS_UNIQUE_VALUE"
    },
    {
      level: "L5_COMMS",
      prof: "PROF-COMMS",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.COMMS.BILATERAL.ACER",
      verdict: "NO_CONTENT_TRANSFER_AND_NO_HASH_FABRICATION"
    },
    {
      level: "L6_COUNCIL",
      prof: "PROF-CHIEFCOUNCIL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.D50.COUNCIL.ACER",
      verdict: "DISSENT_ASYMMETRY_PRESERVED_ACER_5_WAVE_LIRIS_16_WAVE_NO_RATIFICATION"
    },
    {
      level: "L7_APEX",
      prof: "COL-ASOLARIA",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.ASOLARIA.APEX.ACER",
      verdict: "HOLD_NEXT_GATE_OPERATOR_ONLY"
    }
  ];

  const state = {
    schema: "federation-reintegration-wave21z-liris-aggregate-correction.v1",
    runId,
    generatedAt,
    status: "DRAFT_ONLY_NOT_RATIFIED",
    relationship: "APPEND_ONLY_CORRECTION_FOR_LIRIS_21X_21Y_AGGREGATE",
    correctionClass: "SUPERVISOR_GATED_METADATA_CORRECTION",
    reason: "The operator-relayed Liris 21X/21Y return reports a later aggregate state than the prior ACER 21W/21X draft recorded.",
    priorAcerArtifacts: {
      wave21w: priorWave21w,
      wave21x: priorWave21x,
      wave21wxStateHash: priorState.stateHash || null,
      priorRecordedAggregate: {
        totalWave21ArtifactsReported: 15,
        combinedLineCountReported: 1483,
        chiefCouncilDissent: "5-wave standing from ACER vantage"
      }
    },
    latestOperatorRelayedLirisAggregate: {
      totalWave21ArtifactsReported: 18,
      cumulativeLineCountReported: 1879,
      chiefCouncilDissent: "16-wave standing on Liris side",
      priorArtifactCountBefore21X21Y: 16,
      note: "This is metadata relayed by the operator. ACER does not have the Liris 21X/21Y content and does not compute hashes beyond the operator-relayed values."
    },
    latestOperatorRelayedLirisArtifacts: {
      "21X": {
        path: "data/agent-index/council/D50-WAVE21X-CASCADE-NEXT-GATE-MATRIX-LIRIS-2026-04-27.md",
        lines: 67,
        sha256: "7dfa47d6d0c85cf1485cfc32b9379ad0f892712c8a14b16afe59fcfb6bacfc72",
        status: "DRAFT_ONLY_NOT_RATIFIED"
      },
      "21Y": {
        path: "data/agent-index/LETTER-TO-FUTURE-AGENTS-WAVE21-EXTENSION-LIRIS-2026-04-27.md",
        lines: 88,
        sha256: "002fee0964aa575def4981c0831bb5ec5eeed71ee1e9df1498ce09db0e5b3da2",
        status: "DRAFT_ONLY_NOT_RATIFIED"
      }
    },
    correctionDisposition: {
      rewritePriorArtifacts: false,
      supersedePriorAggregateFields: true,
      preservePriorHashesAsHistorical: true,
      nextSubstantiveGateStill: "21H_OPERATOR_MEDIATED_CONTENT_PASTE"
    },
    supervisorLevels,
    boundary: "Wave 21Z correction only. No content transfer, no overwrite of prior D50 artifacts, no schedule reconciliation, no vision disposition choice, no hash fabrication, no parent manifest modification, no Merkle recompute, no peer endpoint, no payload transfer, no Liris disk write by ACER, no MCP invocation, no exterior MCP, no model fanout, no device action, no emit, no ed25519, no quorum outreach, no census admission, no PID mint, no quarantine lift, no promotion."
  };

  state.stateHash = sha256Text(JSON.stringify(state));
  return state;
}

function buildD50(state) {
  const lines = [];
  lines.push("# D50 Wave 21Z - Liris Aggregate Correction (ACER)");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Status: ${state.status}`);
  lines.push(`Relationship: ${state.relationship}`);
  lines.push("");
  lines.push("## Correction");
  lines.push("");
  lines.push("| Field | Prior ACER 21W/21X record | Corrected operator-relayed Liris record |");
  lines.push("|-------|---------------------------|-----------------------------------------|");
  lines.push(`| totalWave21ArtifactsReported | ${state.priorAcerArtifacts.priorRecordedAggregate.totalWave21ArtifactsReported} | ${state.latestOperatorRelayedLirisAggregate.totalWave21ArtifactsReported} |`);
  lines.push(`| lineCount | ${state.priorAcerArtifacts.priorRecordedAggregate.combinedLineCountReported} | ${state.latestOperatorRelayedLirisAggregate.cumulativeLineCountReported} |`);
  lines.push(`| CHIEFCOUNCIL dissent | ${state.priorAcerArtifacts.priorRecordedAggregate.chiefCouncilDissent} | ${state.latestOperatorRelayedLirisAggregate.chiefCouncilDissent} |`);
  lines.push("");
  lines.push("## Liris 21X/21Y References");
  lines.push("");
  lines.push("| Wave | Liris path | Lines | sha256 |");
  lines.push("|------|------------|-------|--------|");
  for (const wave of ["21X", "21Y"]) {
    const item = state.latestOperatorRelayedLirisArtifacts[wave];
    lines.push(`| ${wave} | \`${item.path}\` | ${item.lines} | \`${item.sha256}\` |`);
  }
  lines.push("");
  lines.push("## Prior ACER Drafts Preserved");
  lines.push("");
  lines.push(`- Wave 21W: \`${state.priorAcerArtifacts.wave21w.path}\`, ${state.priorAcerArtifacts.wave21w.lines} lines, sha256 \`${state.priorAcerArtifacts.wave21w.sha256}\`.`);
  lines.push(`- Wave 21X: \`${state.priorAcerArtifacts.wave21x.path}\`, ${state.priorAcerArtifacts.wave21x.lines} lines, sha256 \`${state.priorAcerArtifacts.wave21x.sha256}\`.`);
  lines.push("- Prior files are not rewritten; this Wave 21Z artifact supersedes only the aggregate metadata fields.");
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
  lines.push("# Federation Reintegration Wave 21Z Liris Aggregate Correction");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Status: ${state.status}`);
  lines.push(`State hash: ${state.stateHash}`);
  lines.push("");
  lines.push("## Result");
  lines.push("");
  lines.push("- ACER records the corrected Liris aggregate as 18 Wave 21 artifacts and 1879 cumulative lines.");
  lines.push("- ACER records Liris-side CHIEFCOUNCIL dissent as 16-wave standing while preserving ACER's own 5-wave vantage.");
  lines.push("- Prior 21W/21X drafts are left intact; 21Z is an append-only correction.");
  lines.push("- Wave 21H remains blocked on operator-mediated content paste.");
  lines.push("");
  lines.push("## Boundary");
  lines.push("");
  lines.push(state.boundary);
  return lines.join("\n");
}

function buildMap(state) {
  return {
    mapId: "federation-reintegration-wave21z-liris-aggregate-correction-map.v1",
    generatedAt,
    nodes: [
      { id: "wave21z", kind: "append_only_correction", status: state.status },
      { id: "wave21w-prior", kind: "prior_draft", sha256: state.priorAcerArtifacts.wave21w.sha256 },
      { id: "wave21x-prior", kind: "prior_draft", sha256: state.priorAcerArtifacts.wave21x.sha256 },
      { id: "liris-21x", kind: "operator_relay_hash", sha256: state.latestOperatorRelayedLirisArtifacts["21X"].sha256 },
      { id: "liris-21y", kind: "operator_relay_hash", sha256: state.latestOperatorRelayedLirisArtifacts["21Y"].sha256 },
      ...state.supervisorLevels.map((row) => ({ id: row.supervisorPid, kind: "supervisor_pid", level: row.level, verdict: row.verdict }))
    ],
    edges: [
      { from: "wave21z", to: "wave21w-prior", relation: "corrects_aggregate_metadata_for" },
      { from: "wave21z", to: "wave21x-prior", relation: "corrects_aggregate_metadata_for" },
      { from: "wave21z", to: "liris-21x", relation: "records_reference" },
      { from: "wave21z", to: "liris-21y", relation: "records_reference" },
      ...state.supervisorLevels.map((row) => ({ from: "wave21z", to: row.supervisorPid, relation: "gated_by" }))
    ],
    boundary: state.boundary
  };
}

function buildGlpj(state) {
  return {
    glpjId: "federation-reintegration-wave21z-liris-aggregate-correction.glpj",
    generatedAt,
    family: "federation",
    d11: "APPEND_ONLY_AGGREGATE_CORRECTION",
    glyphs: state.supervisorLevels.map((row, index) => ({
      token: `FED-WAVE21Z-L${index}`,
      level: row.level,
      prof: row.prof,
      supervisorPid: row.supervisorPid,
      verdict: row.verdict
    })),
    outputs: [{ wave: "21Z", path: repoRel(OUTPUTS.d50), class: "append-only aggregate correction" }],
    boundary: state.boundary
  };
}

function main() {
  const state = buildState();
  const artifacts = Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)]));
  const memory = {
    memoryId: "federation-reintegration-wave21z-liris-aggregate-correction.v1",
    generatedAt,
    status: state.status,
    relationship: state.relationship,
    significance: "Corrects ACER's local aggregate metadata for the latest operator-relayed Liris 21X/21Y state without rewriting prior drafts.",
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
