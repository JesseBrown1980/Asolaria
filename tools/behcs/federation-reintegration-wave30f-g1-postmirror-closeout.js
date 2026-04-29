#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427");
const councilRoot = path.join(repoRoot, "data", "agent-index", "council");
const reportsRoot = path.join(repoRoot, "reports");
const memoryRoot = path.join(repoRoot, "data", "behcs", "memory");
const mapsRoot = path.join(repoRoot, "data", "behcs", "maps", "asolaria");
const cubesRoot = path.join(repoRoot, "data", "behcs", "cubes");
const glpjRoot = path.join(repoRoot, "data", "behcs", "codex", "glyph-language");

const CANONICAL = Object.freeze([
  {
    id: "liris-base-d11",
    label: "Liris base D11 ledger",
    path: "data/agent-index/D11-AUDIT-LEDGER-2026-04-27.md",
    expectedSha256: "0a399d05b704fe1199e3da6150e41aa861ed51b3a4903b241fb2fabf5336f635",
    expectedLines: 165,
    expectedBytes: 10470
  },
  {
    id: "liris-falcon-correction-addendum",
    label: "Liris Falcon-correction addendum",
    path: "data/agent-index/D11-AUDIT-LEDGER-ADDENDUM-FALCON-SERIAL-CORRECTION-2026-04-27.md",
    expectedSha256: "4067d94480370c8bf1301f16f289e93509c697cfd982b18fd7b90f33a3a8c16e",
    expectedLines: 92,
    expectedBytes: 6152
  }
]);

const OUTPUTS = Object.freeze({
  state: path.join(runRoot, "wave30f-g1-postmirror-closeout-acer.v1.json"),
  votes: path.join(runRoot, "wave30f-g1-postmirror-closeout-votes.ndjson"),
  d50: path.join(councilRoot, "D50-WAVE30F-G1-POSTMIRROR-CLOSEOUT-ACER-2026-04-28.md"),
  mapMapMapped: path.join(mapsRoot, "federation-reintegration-wave30f-g1-postmirror-closeout-map-map-mapped.v1.json"),
  cubeCubed: path.join(cubesRoot, "federation-reintegration-wave30f-g1-postmirror-closeout-cube-cubed.cube.js"),
  glpj: path.join(glpjRoot, "federation-reintegration-wave30f-g1-postmirror-closeout-behcs256.glpj.json"),
  memory: path.join(memoryRoot, "federation-reintegration-wave30f-g1-postmirror-closeout.v1.json"),
  reportJson: path.join(reportsRoot, "federation-reintegration-wave30f-g1-postmirror-closeout-latest.json"),
  reportMd: path.join(reportsRoot, "federation-reintegration-wave30f-g1-postmirror-closeout-latest.md")
});

function ensureParent(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeJson(filePath, data) {
  ensureParent(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function writeText(filePath, text) {
  ensureParent(filePath);
  fs.writeFileSync(filePath, text.endsWith("\n") ? text : `${text}\n`, "utf8");
}

function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function sha256Text(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function repoRel(filePath) {
  const relative = path.relative(repoRoot, filePath);
  if (path.isAbsolute(relative) || relative.startsWith("..")) return filePath.replace(/\\/g, "/");
  return relative.replace(/\\/g, "/");
}

function lineCount(buffer) {
  const text = buffer.toString("utf8").replace(/\r?\n$/, "");
  return text ? text.split(/\r?\n/).length : 0;
}

function inspectPath(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    return { present: false, path: relativePath, sha256: null, lines: 0, bytes: 0 };
  }
  const buffer = fs.readFileSync(fullPath);
  return {
    present: true,
    path: relativePath,
    sha256: sha256Buffer(buffer),
    lines: lineCount(buffer),
    bytes: buffer.length
  };
}

function readJsonMaybe(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    return { present: false, path: relativePath, json: null, sha256: null, lines: 0 };
  }
  const buffer = fs.readFileSync(fullPath);
  return {
    present: true,
    path: relativePath,
    json: JSON.parse(buffer.toString("utf8")),
    sha256: sha256Buffer(buffer),
    lines: lineCount(buffer)
  };
}

function artifactInfo(filePath) {
  if (!fs.existsSync(filePath)) return { path: repoRel(filePath), present: false, sha256: null, lines: 0, bytes: 0 };
  const buffer = fs.readFileSync(filePath);
  return {
    path: repoRel(filePath),
    present: true,
    sha256: sha256Buffer(buffer),
    lines: lineCount(buffer),
    bytes: buffer.length
  };
}

function buildCanonicalChecks() {
  return CANONICAL.map((target) => {
    const info = inspectPath(target.path);
    return {
      ...target,
      actual: info,
      pass: info.present &&
        info.sha256 === target.expectedSha256 &&
        info.lines === target.expectedLines &&
        info.bytes === target.expectedBytes
    };
  });
}

function buildVotes(evidence) {
  const close = evidence.wave30eSuccess && evidence.allCanonicalPass && evidence.wave31aApproved;
  return [
    {
      prof: "PROF-HERMES",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET.ACER",
      vote: close ? "CLOSE_G1_PACKET" : "HOLD_G1_PACKET",
      rationale: "Wave 30E is the write packet; Wave 30F is the local closeout packet."
    },
    {
      prof: "PROF-KERNEL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.KERNEL.GRAMMAR.ACER",
      vote: evidence.allCanonicalPass ? "CANONICAL_BYTE_GRAMMAR_MATCHED" : "CANONICAL_BYTE_GRAMMAR_FAIL",
      rationale: "Both canonical D11 evidence files match expected sha256, line count, and byte count."
    },
    {
      prof: "PROF-SHANNON",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.SHANNON.TRUST.ACER",
      vote: close ? "TRUST_CLOSE_NO_PROMOTION" : "TRUST_HOLD",
      rationale: "G1 evidence is mirrored, but this closeout does not promote devices or federation state."
    },
    {
      prof: "PROF-BROWN-HILBERT",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.BROWN-HILBERT.ROOM.ACER",
      vote: close ? "ROOM_CLOSED_G1_CANONICAL_MIRROR" : "ROOM_OPEN_HOLD",
      rationale: "The Brown-Hilbert room exits the staging chamber and closes the G1 D11 mirror chamber."
    },
    {
      prof: "PROF-GLYPH-KERNEL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.GLPJ.GLYPH.ACER",
      vote: close ? "GLYPH_SEAL_G1_CLOSED" : "GLYPH_SEAL_G1_HELD",
      rationale: "The BEHCS-256 glyph packet records the closeout state hash."
    },
    {
      prof: "PROF-CHIEFCOUNCIL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.D50.COUNCIL.ACER",
      vote: "D11_EVIDENCE_MIRRORED_NO_PROMOTION",
      rationale: "G1 can close as evidence intake while broader federation promotions remain separate gates."
    },
    {
      prof: "COL-ASOLARIA",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.ASOLARIA.APEX.ACER",
      vote: close ? "DECLARE_G1_T1_D11_MIRROR_CLOSED_ON_ACER" : "HOLD_G1_CLOSEOUT",
      rationale: "The local supervisor chain has completed T1 receive, verify, canonical mirror, and postmirror verification."
    }
  ];
}

function buildState() {
  const wave31a = readJsonMaybe("data/behcs/orchestration/federation-reintegration-20260427/wave31a-behcs256-supervisor-decision-acer.v1.json");
  const wave30e = readJsonMaybe("data/behcs/orchestration/federation-reintegration-20260427/wave30e-g1-canonical-mirror-acer.v1.json");
  const g1Report = readJsonMaybe("reports/federation-reintegration-g1-t1-staging-verification-latest.json");
  const canonicalChecks = buildCanonicalChecks();
  const evidence = {
    wave31aApproved: wave31a.json?.decision?.approved === true,
    wave30eSuccess: wave30e.json?.status === "G1_CANONICAL_MIRROR_WRITTEN_HASH_VERIFIED" &&
      wave30e.json?.execution?.executed === true &&
      wave30e.json?.allAfterMatch === true,
    g1StagingStillVerified: g1Report.json?.allPresent === true && g1Report.json?.allHashesMatch === true,
    allCanonicalPass: canonicalChecks.every((check) => check.pass)
  };
  const votes = buildVotes(evidence);
  const closed = evidence.wave31aApproved && evidence.wave30eSuccess && evidence.g1StagingStillVerified && evidence.allCanonicalPass;
  const state = {
    schema: "federation-reintegration-wave30f-g1-postmirror-closeout-acer.v1",
    generatedAt,
    status: closed ? "G1_T1_D11_CANONICAL_MIRROR_CLOSED_ON_ACER" : "G1_T1_D11_CANONICAL_MIRROR_CLOSEOUT_HELD",
    sourceMode: "LOCAL_ASOLARIA_SCRIPT_ONLY_NO_CODEX_MCP_NO_SUBAGENTS",
    wave: { family: "Wave 30", letter: "F", name: "30F", phase: "g1-postmirror-closeout" },
    inputs: {
      wave31a: { present: wave31a.present, sha256: wave31a.sha256, stateHash: wave31a.json?.stateHash || null, status: wave31a.json?.status || null },
      wave30e: { present: wave30e.present, sha256: wave30e.sha256, stateHash: wave30e.json?.stateHash || null, status: wave30e.json?.status || null },
      g1Report: { present: g1Report.present, sha256: g1Report.sha256, status: g1Report.json?.status || null }
    },
    evidence,
    canonicalChecks,
    supervisorVotes: votes,
    decision: {
      closed,
      g1Status: closed ? "CLOSED_ON_ACER_CANONICAL_EVIDENCE_MIRRORED" : "HELD",
      remaining: closed ? "Reciprocal ACER-to-Liris drift-addendum mirror remains separate; no federation promotion implied." : "Resolve failed evidence checks and rerun."
    },
    boundary: "Postmirror closeout only. No new content transfer, no peer call, no MCP, no subagents, no device action, no LX mutation, no PID mint, no federation promotion."
  };
  state.stateHash = sha256Text(JSON.stringify(state));
  return state;
}

function buildMapMapMapped(state) {
  return {
    schema: "behcs-map-map-mapped.v1",
    generatedAt,
    sourceStateHash: state.stateHash,
    map: "G1_T1_STAGING_TO_ACER_D11_CANONICAL",
    mapMap: state.supervisorVotes.map((vote) => ({ prof: vote.prof, vote: vote.vote })),
    mapMapMapped: {
      g1Status: state.decision.g1Status,
      canonicalPaths: state.canonicalChecks.map((check) => check.path),
      noPromotion: true
    }
  };
}

function buildCubeCubedSource(state) {
  const payload = {
    schema: "behcs-cube-cube-cubed.v1",
    generatedAt,
    sourceStateHash: state.stateHash,
    axes: {
      x: "Wave31A supervisor authorization",
      y: "Wave30E canonical mirror result",
      z: "Wave30F postmirror verifier closeout"
    },
    closed: state.decision.closed,
    canonicalChecks: state.canonicalChecks.map((check) => ({ id: check.id, pass: check.pass, sha256: check.actual.sha256 }))
  };
  return [
    '"use strict";',
    "",
    "module.exports = Object.freeze(",
    JSON.stringify(payload, null, 2),
    ");",
    ""
  ].join("\n");
}

function buildGlpj(state) {
  return {
    schema: "behcs256-glpj-glyph-packet.v1",
    generatedAt,
    sourceStateHash: state.stateHash,
    glyphFamily: "FEDERATION_REINTEGRATION_G1_CLOSEOUT",
    glyphs: state.supervisorVotes.map((vote, index) => ({
      atom: `GLPJ:BEHCS256:W30F:${String(index + 1).padStart(2, "0")}`,
      prof: vote.prof,
      supervisorPid: vote.supervisorPid,
      vote: vote.vote
    })),
    phrase: state.decision.closed
      ? "G1_T1_D11_CANONICAL_EVIDENCE_MIRROR_CLOSED_ON_ACER"
      : "G1_T1_D11_CANONICAL_EVIDENCE_MIRROR_HELD_ON_ACER"
  };
}

function buildD50(state, artifacts) {
  return [
    "# D50 Wave 30F - G1 Postmirror Closeout (ACER)",
    "",
    "| Field | Value |",
    "|---|---|",
    `| status | ${state.status} |`,
    `| generated_at | ${state.generatedAt} |`,
    `| state_hash | ${state.stateHash} |`,
    `| g1_status | ${state.decision.g1Status} |`,
    "",
    "## Supervisor Votes",
    "",
    ...state.supervisorVotes.map((vote) => `- ${vote.prof} / ${vote.supervisorPid}: ${vote.vote}`),
    "",
    "## Canonical Evidence",
    "",
    ...state.canonicalChecks.map((check) => `- ${check.label}: ${check.actual.path}, pass=${check.pass}, sha256=${check.actual.sha256}`),
    "",
    "## BEHCS Surfaces",
    "",
    `- map-map-mapped: ${artifacts.mapMapMapped.path}`,
    `- cube-cube-cubed: ${artifacts.cubeCubed.path}`,
    `- GLPJ: ${artifacts.glpj.path}`,
    "",
    "## Boundary",
    "",
    state.boundary
  ].join("\n");
}

function buildReport(state, artifacts) {
  return [
    "# Wave 30F G1 Postmirror Closeout",
    "",
    `Generated: ${state.generatedAt}`,
    `Status: ${state.status}`,
    `State hash: ${state.stateHash}`,
    "",
    "## Result",
    "",
    `- Closed: ${state.decision.closed}`,
    `- G1 status: ${state.decision.g1Status}`,
    `- Remaining: ${state.decision.remaining}`,
    "",
    "## Outputs",
    "",
    ...Object.entries(artifacts).map(([key, value]) => `- ${key}: \`${value.path}\` sha256=${value.sha256}`),
    "",
    "## Boundary",
    "",
    state.boundary
  ].join("\n");
}

function main() {
  const state = buildState();
  writeJson(OUTPUTS.state, state);
  writeText(OUTPUTS.votes, state.supervisorVotes.map((vote) => JSON.stringify(vote)).join("\n"));
  writeJson(OUTPUTS.mapMapMapped, buildMapMapMapped(state));
  writeText(OUTPUTS.cubeCubed, buildCubeCubedSource(state));
  writeJson(OUTPUTS.glpj, buildGlpj(state));
  writeJson(OUTPUTS.memory, state);

  const artifactsForD50 = {
    mapMapMapped: artifactInfo(OUTPUTS.mapMapMapped),
    cubeCubed: artifactInfo(OUTPUTS.cubeCubed),
    glpj: artifactInfo(OUTPUTS.glpj)
  };
  writeText(OUTPUTS.d50, buildD50(state, artifactsForD50));

  const artifacts = {
    state: artifactInfo(OUTPUTS.state),
    votes: artifactInfo(OUTPUTS.votes),
    d50: artifactInfo(OUTPUTS.d50),
    ...artifactsForD50,
    memory: artifactInfo(OUTPUTS.memory)
  };
  writeJson(OUTPUTS.reportJson, { ...state, artifacts });
  artifacts.reportJson = artifactInfo(OUTPUTS.reportJson);
  writeText(OUTPUTS.reportMd, buildReport(state, artifacts));
  artifacts.reportMd = artifactInfo(OUTPUTS.reportMd);

  console.log(JSON.stringify({
    ok: true,
    status: state.status,
    stateHash: state.stateHash,
    closed: state.decision.closed,
    canonicalChecks: state.canonicalChecks.map((check) => ({
      id: check.id,
      pass: check.pass,
      sha256: check.actual.sha256
    })),
    artifacts
  }, null, 2));
}

main();
