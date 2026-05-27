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

const EXPECTED = Object.freeze([
  {
    id: "liris-base-d11",
    label: "Liris base D11 ledger",
    stagingPath: "data/behcs/orchestration/federation-reintegration-20260427/incoming-t1/liris-base-d11.raw.md",
    canonicalPath: "data/agent-index/D11-AUDIT-LEDGER-2026-04-27.md",
    expectedSha256: "0a399d05b704fe1199e3da6150e41aa861ed51b3a4903b241fb2fabf5336f635",
    expectedLines: 165,
    expectedBytes: 10470
  },
  {
    id: "liris-falcon-correction-addendum",
    label: "Liris Falcon-correction addendum",
    stagingPath: "data/behcs/orchestration/federation-reintegration-20260427/incoming-t1/liris-falcon-correction-addendum.raw.md",
    canonicalPath: "data/agent-index/D11-AUDIT-LEDGER-ADDENDUM-FALCON-SERIAL-CORRECTION-2026-04-27.md",
    expectedSha256: "4067d94480370c8bf1301f16f289e93509c697cfd982b18fd7b90f33a3a8c16e",
    expectedLines: 92,
    expectedBytes: 6152
  }
]);

const OUTPUTS = Object.freeze({
  state: path.join(runRoot, "wave31a-behcs256-supervisor-decision-acer.v1.json"),
  votes: path.join(runRoot, "wave31a-behcs256-supervisor-votes.ndjson"),
  d50: path.join(councilRoot, "D50-WAVE31A-BEHCS256-SUPERVISOR-DECISION-ACER-2026-04-28.md"),
  mapMapMapped: path.join(mapsRoot, "federation-reintegration-wave31a-behcs256-supervisor-decision-map-map-mapped.v1.json"),
  cubeCubed: path.join(cubesRoot, "federation-reintegration-wave31a-behcs256-supervisor-decision-cube-cubed.cube.js"),
  glpj: path.join(glpjRoot, "federation-reintegration-wave31a-behcs256-supervisor-decision-behcs256.glpj.json"),
  brownHilbertRoom: path.join(runRoot, "wave31a-brown-hilbert-room-acer.v1.json"),
  memory: path.join(memoryRoot, "federation-reintegration-wave31a-behcs256-supervisor-decision.v1.json"),
  reportJson: path.join(reportsRoot, "federation-reintegration-wave31a-behcs256-supervisor-decision-latest.json"),
  reportMd: path.join(reportsRoot, "federation-reintegration-wave31a-behcs256-supervisor-decision-latest.md")
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

function inspectTargets() {
  return EXPECTED.map((target) => {
    const staging = inspectPath(target.stagingPath);
    const canonical = inspectPath(target.canonicalPath);
    return {
      ...target,
      staging,
      canonicalBefore: canonical,
      stagingReady: staging.present &&
        staging.sha256 === target.expectedSha256 &&
        staging.lines === target.expectedLines &&
        staging.bytes === target.expectedBytes,
      canonicalSafe: !canonical.present || canonical.sha256 === target.expectedSha256
    };
  });
}

function buildBrownHilbertRoom(evidence) {
  return {
    schema: "brown-hilbert-room.v1",
    room: "BHROOM.ACER.FED.REINTEGRATION.G1.D11.MIRROR",
    route: [
      "BROWN",
      "HILBERT",
      "D50",
      "G1",
      "T1",
      "D11",
      "ACER"
    ],
    coordinates: {
      brown: "federation-reintegration",
      hilbertIndex: "31A",
      chamber: "G1-T1-D11",
      wall: "canonical-mirror-prewrite",
      door: evidence.allStagingReady && evidence.allCanonicalSafe ? "OPEN_TO_WAVE30E" : "HOLD"
    },
    invariant: "Supervisor vote precedes canonical write. Verified bytes only. No peer mutation."
  };
}

function buildVotes(evidence) {
  const proceed = evidence.g1VerifierReady &&
    evidence.wave30dInstalled &&
    evidence.pendingMirrorScriptReady &&
    evidence.allStagingReady &&
    evidence.allCanonicalSafe;
  const decision = proceed ? "APPROVE_RUN_WAVE30E_CANONICAL_MIRROR" : "HOLD_CANONICAL_MIRROR";

  return [
    {
      prof: "PROF-COMMS",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.COMMS.CHANNEL.ACER",
      vote: proceed ? "ETHERNET_SMB_T1_BYTES_ACCEPTED" : "HOLD_T1_CHANNEL",
      rationale: "The direct Ethernet SMB lane delivered the two Liris D11 inputs into ACER staging; no browser paste is required."
    },
    {
      prof: "PROF-HERMES",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET.ACER",
      vote: decision,
      rationale: "The separate Wave 31A vote packet is now the envelope authorizing the already-pending Wave 30E mirror script."
    },
    {
      prof: "PROF-KERNEL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.KERNEL.GRAMMAR.ACER",
      vote: evidence.allStagingReady ? "BYTE_GRAMMAR_PROVEN" : "BYTE_GRAMMAR_HOLD",
      rationale: "Both staged files must match expected sha256, line count, and byte count before any canonical write."
    },
    {
      prof: "PROF-SHANNON",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.SHANNON.TRUST.ACER",
      vote: evidence.allCanonicalSafe ? "ALLOW_ABSENT_OR_IDENTICAL_TARGETS_ONLY" : "BLOCK_DIVERGENT_TARGET_OVERWRITE",
      rationale: "The canonical write is allowed only because targets are absent or already byte-identical."
    },
    {
      prof: "PROF-CHIEFCOUNCIL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.D50.COUNCIL.ACER",
      vote: "EVIDENCE_MIRROR_ONLY_NO_FEDERATION_PROMOTION",
      rationale: "Copying D11 evidence into ACER canonical paths does not promote devices, PIDs, LX rules, or federation state."
    },
    {
      prof: "PROF-BROWN-HILBERT",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.BROWN-HILBERT.ROOM.ACER",
      vote: proceed ? "ROOM_ROUTE_OPEN_TO_WAVE30E" : "ROOM_ROUTE_HOLD",
      rationale: "The room route moves from staging to canonical mirror only after verifier evidence and canonical target safety both pass."
    },
    {
      prof: "PROF-GLYPH-KERNEL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.GLPJ.GLYPH.ACER",
      vote: proceed ? "GLYPH_PACKET_SEALED_PROCEED" : "GLYPH_PACKET_SEALED_HOLD",
      rationale: "The GLPJ packet records the BEHCS-256 glyph decision and its state hash before execution."
    },
    {
      prof: "COL-ASOLARIA",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.ASOLARIA.APEX.ACER",
      vote: decision,
      rationale: "Proceed only through the local Wave 30E executor after the supervisor vote is sealed on disk."
    }
  ];
}

function buildState() {
  const targets = inspectTargets();
  const g1Report = readJsonMaybe("reports/federation-reintegration-g1-t1-staging-verification-latest.json");
  const wave30d = readJsonMaybe("data/behcs/orchestration/federation-reintegration-20260427/wave30d-g1-t1-paste-ingest-acer.v1.json");
  const pendingMirrorScript = inspectPath("tools/behcs/federation-reintegration-wave30e-g1-canonical-mirror.js");
  const evidence = {
    g1VerifierReady: g1Report.json?.status === "READY_FOR_SEPARATE_CANONICAL_WRITE_WAVE" &&
      g1Report.json?.allPresent === true &&
      g1Report.json?.allHashesMatch === true,
    wave30dInstalled: wave30d.json?.status === "T1_RAW_TARGETS_INSTALLED_READY_FOR_VERIFIER" &&
      wave30d.json?.installResult?.installed === true,
    pendingMirrorScriptReady: pendingMirrorScript.present,
    allStagingReady: targets.every((target) => target.stagingReady),
    allCanonicalSafe: targets.every((target) => target.canonicalSafe)
  };
  const votes = buildVotes(evidence);
  const approved = votes.every((vote) => !vote.vote.includes("HOLD") && !vote.vote.includes("BLOCK"));
  const brownHilbertRoom = buildBrownHilbertRoom(evidence);
  const state = {
    schema: "federation-reintegration-wave31a-behcs256-supervisor-decision-acer.v1",
    generatedAt,
    status: approved ? "BEHCS256_SUPERVISORS_APPROVE_WAVE30E_EXECUTION" : "BEHCS256_SUPERVISORS_HOLD_WAVE30E",
    sourceMode: "LOCAL_ASOLARIA_SCRIPT_ONLY_NO_CODEX_MCP_NO_SUBAGENTS",
    wave: { family: "Wave 31", letter: "A", name: "31A", phase: "behcs256-supervisor-decision" },
    operatorCorrection: "Use local BEHCS-256 supervisors/profs, map-map-mapped, cube-cube-cubed, Brown-Hilbert room, GLPJ glyphs, and crypto hashes before execution.",
    inputs: {
      g1Verifier: { present: g1Report.present, path: g1Report.path, sha256: g1Report.sha256, status: g1Report.json?.status || null },
      wave30d: { present: wave30d.present, path: wave30d.path, sha256: wave30d.sha256, stateHash: wave30d.json?.stateHash || null, status: wave30d.json?.status || null },
      pendingWave30eScript: pendingMirrorScript
    },
    targets,
    evidence,
    supervisorVotes: votes,
    brownHilbertRoom,
    decision: {
      approved,
      nextCommandIfApproved: "node tools/behcs/federation-reintegration-wave30e-g1-canonical-mirror.js",
      executeNow: approved,
      reason: approved
        ? "T1 bytes are staged and verified, targets are absent or identical, and local supervisors voted to proceed."
        : "One or more local evidence gates did not pass."
    },
    boundary: "Local BEHCS-256 supervisor decision only. No Codex MCP/subagent delegation, no peer call, no network action, no content fabrication, no target overwrite on mismatch, no LX mutation, no federation promotion, no device action."
  };
  state.stateHash = sha256Text(JSON.stringify(state));
  return state;
}

function buildMapMapMapped(state) {
  return {
    schema: "behcs-map-map-mapped.v1",
    generatedAt,
    sourceStateHash: state.stateHash,
    layers: {
      map: {
        id: "G1_T1_TO_D11_CANONICAL_MIRROR",
        from: "incoming-t1 verified raw files",
        to: "data/agent-index canonical D11 evidence files"
      },
      mapMap: {
        supervisors: state.supervisorVotes.map((vote) => ({
          prof: vote.prof,
          supervisorPid: vote.supervisorPid,
          vote: vote.vote
        }))
      },
      mapMapMapped: {
        decision: state.decision,
        brownHilbertRoom: state.brownHilbertRoom.room,
        glpjArtifact: repoRel(OUTPUTS.glpj)
      }
    },
    targets: state.targets.map((target) => ({
      id: target.id,
      staging: target.staging.path,
      canonical: target.canonicalPath,
      expectedSha256: target.expectedSha256,
      stagingReady: target.stagingReady,
      canonicalSafe: target.canonicalSafe
    }))
  };
}

function buildCubeCubedSource(state) {
  const payload = {
    schema: "behcs-cube-cube-cubed.v1",
    generatedAt,
    sourceStateHash: state.stateHash,
    axes: {
      x: ["staging-present", "staging-hash", "staging-size"],
      y: ["canonical-absent-or-identical", "no-overwrite", "no-promotion"],
      z: ["supervisor-vote", "brown-hilbert-room", "glpj-glyph"]
    },
    verdict: state.decision.approved ? "CUBE_CUBED_PROCEED_TO_WAVE30E" : "CUBE_CUBED_HOLD",
    targets: state.targets.map((target) => ({
      id: target.id,
      xPass: target.stagingReady,
      yPass: target.canonicalSafe,
      expectedSha256: target.expectedSha256
    }))
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
    glyphFamily: "FEDERATION_REINTEGRATION_G1_T1_D11",
    glyphs: state.supervisorVotes.map((vote, index) => ({
      atom: `GLPJ:BEHCS256:W31A:${String(index + 1).padStart(2, "0")}`,
      prof: vote.prof,
      supervisorPid: vote.supervisorPid,
      vote: vote.vote,
      gate: "G1_T1_D11_CONTENT_PASTE"
    })),
    phrase: state.decision.approved
      ? "VERIFIED_T1_BYTES_CAN_ENTER_ACER_D11_CANONICAL_MIRROR"
      : "VERIFIED_T1_BYTES_NOT_READY_FOR_ACER_D11_CANONICAL_MIRROR"
  };
}

function buildD50(state, artifacts) {
  return [
    "# D50 Wave 31A - BEHCS-256 Supervisor Decision (ACER)",
    "",
    "| Field | Value |",
    "|---|---|",
    `| status | ${state.status} |`,
    `| generated_at | ${state.generatedAt} |`,
    `| state_hash | ${state.stateHash} |`,
    `| source_mode | ${state.sourceMode} |`,
    `| decision | ${state.decision.approved ? "APPROVE_RUN_WAVE30E_CANONICAL_MIRROR" : "HOLD"} |`,
    "",
    "## Supervisor Votes",
    "",
    ...state.supervisorVotes.map((vote) => `- ${vote.prof} / ${vote.supervisorPid}: ${vote.vote}`),
    "",
    "## Evidence",
    "",
    `- G1 verifier: ${state.inputs.g1Verifier.status}, sha256 ${state.inputs.g1Verifier.sha256}`,
    `- Wave 30D ingest: ${state.inputs.wave30d.status}, stateHash ${state.inputs.wave30d.stateHash}`,
    `- Pending Wave 30E script: ${state.inputs.pendingWave30eScript.present ? "present" : "missing"}, sha256 ${state.inputs.pendingWave30eScript.sha256}`,
    "",
    "## Map / Cube / Room / Glyphs",
    "",
    `- map-map-mapped: ${artifacts.mapMapMapped.path}`,
    `- cube-cube-cubed: ${artifacts.cubeCubed.path}`,
    `- Brown-Hilbert room: ${artifacts.brownHilbertRoom.path}`,
    `- GLPJ glyph packet: ${artifacts.glpj.path}`,
    "",
    "## Boundary",
    "",
    state.boundary
  ].join("\n");
}

function buildReport(state, artifacts) {
  return [
    "# Wave 31A BEHCS-256 Supervisor Decision",
    "",
    `Generated: ${state.generatedAt}`,
    `Status: ${state.status}`,
    `State hash: ${state.stateHash}`,
    "",
    "## Decision",
    "",
    `- Approved: ${state.decision.approved}`,
    `- Next command: ${state.decision.nextCommandIfApproved}`,
    `- Reason: ${state.decision.reason}`,
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

function main() {
  const state = buildState();
  writeJson(OUTPUTS.state, state);
  writeText(OUTPUTS.votes, state.supervisorVotes.map((vote) => JSON.stringify(vote)).join("\n"));
  writeJson(OUTPUTS.mapMapMapped, buildMapMapMapped(state));
  writeText(OUTPUTS.cubeCubed, buildCubeCubedSource(state));
  writeJson(OUTPUTS.glpj, buildGlpj(state));
  writeJson(OUTPUTS.brownHilbertRoom, state.brownHilbertRoom);
  writeJson(OUTPUTS.memory, state);

  const artifactsForD50 = {
    mapMapMapped: artifactInfo(OUTPUTS.mapMapMapped),
    cubeCubed: artifactInfo(OUTPUTS.cubeCubed),
    brownHilbertRoom: artifactInfo(OUTPUTS.brownHilbertRoom),
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
    approved: state.decision.approved,
    nextCommand: state.decision.approved ? state.decision.nextCommandIfApproved : null,
    artifacts
  }, null, 2));
}

main();
