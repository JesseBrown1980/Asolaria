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

const OUTPUTS = Object.freeze({
  state: path.join(runRoot, "wave31c-liris-push-verify-closeout-acer.v1.json"),
  votes: path.join(runRoot, "wave31c-liris-push-verify-closeout-votes.ndjson"),
  d50: path.join(councilRoot, "D50-WAVE31C-LIRIS-PUSH-VERIFY-CLOSEOUT-ACER-2026-04-28.md"),
  mapMapMapped: path.join(mapsRoot, "federation-reintegration-wave31c-liris-push-verify-closeout-map-map-mapped.v1.json"),
  cubeCubed: path.join(cubesRoot, "federation-reintegration-wave31c-liris-push-verify-closeout-cube-cubed.cube.js"),
  glpj: path.join(glpjRoot, "federation-reintegration-wave31c-liris-push-verify-closeout-behcs256.glpj.json"),
  memory: path.join(memoryRoot, "federation-reintegration-wave31c-liris-push-verify-closeout.v1.json"),
  reportJson: path.join(reportsRoot, "federation-reintegration-wave31c-liris-push-verify-closeout-latest.json"),
  reportMd: path.join(reportsRoot, "federation-reintegration-wave31c-liris-push-verify-closeout-latest.md")
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

function inspectAbsolute(filePath) {
  if (!fs.existsSync(filePath)) return { present: false, path: filePath.replace(/\\/g, "/"), sha256: null, lines: 0, bytes: 0 };
  const buffer = fs.readFileSync(filePath);
  return {
    present: true,
    path: filePath.replace(/\\/g, "/"),
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

function buildVotes(allVisible) {
  return [
    {
      prof: "PROF-COMMS",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.COMMS.CHANNEL.ACER",
      vote: allVisible ? "LIRIS_SMB_VISIBILITY_CONFIRMED" : "LIRIS_SMB_VISIBILITY_FAIL",
      rationale: "ACER re-read the Liris incoming-acer files over direct SMB after the push."
    },
    {
      prof: "PROF-KERNEL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.KERNEL.GRAMMAR.ACER",
      vote: allVisible ? "REMOTE_HASH_GRAMMAR_MATCHED" : "REMOTE_HASH_GRAMMAR_FAIL",
      rationale: "Every Liris target hash must match the payload hash recorded in Wave 31B."
    },
    {
      prof: "PROF-SHANNON",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.SHANNON.TRUST.ACER",
      vote: allVisible ? "TRUST_CLOSE_PUSH_VERIFIED" : "TRUST_HOLD_PUSH_VERIFY",
      rationale: "The push closes only after independent post-write rehash over the share."
    },
    {
      prof: "PROF-HERMES",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET.ACER",
      vote: allVisible ? "CLOSE_PUSH_PACKET" : "HOLD_PUSH_PACKET",
      rationale: "Wave 31C is the review/test packet after Wave 31B wrote the payloads."
    },
    {
      prof: "PROF-CHIEFCOUNCIL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.D50.COUNCIL.ACER",
      vote: "LIRIS_INCOMING_EVIDENCE_ONLY_NO_PROMOTION",
      rationale: "Successful push does not itself run Liris intake or promote federation state."
    },
    {
      prof: "COL-ASOLARIA",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.ASOLARIA.APEX.ACER",
      vote: allVisible ? "DECLARE_ACER_TO_LIRIS_PUSH_VISIBLE_HASH_VERIFIED" : "HOLD_DECLARATION",
      rationale: "All pushed files must be visible from ACER through the Liris share before declaring closure."
    }
  ];
}

function buildState() {
  const wave31b = readJsonMaybe("data/behcs/orchestration/federation-reintegration-20260427/wave31b-acer-to-liris-push-acer.v1.json");
  const results = wave31b.json?.execution?.results || [];
  const manifestAfter = wave31b.json?.execution?.manifestAfter || null;
  const checks = results.map((result) => {
    const target = result.targetAfter?.path ? result.targetAfter.path.replace(/\//g, "\\") : null;
    const remote = target ? inspectAbsolute(target) : { present: false, path: null, sha256: null, lines: 0, bytes: 0 };
    return {
      id: result.id,
      expectedSha256: result.sourceSha256,
      remote,
      pass: remote.present && remote.sha256 === result.sourceSha256
    };
  });
  if (manifestAfter?.path) {
    const manifestRemote = inspectAbsolute(manifestAfter.path.replace(/\//g, "\\"));
    checks.push({
      id: "acer-wave31b-push-manifest",
      expectedSha256: manifestAfter.sha256,
      remote: manifestRemote,
      pass: manifestRemote.present && manifestRemote.sha256 === manifestAfter.sha256
    });
  }

  const allVisible = checks.length > 0 && checks.every((check) => check.pass);
  const votes = buildVotes(allVisible);
  const state = {
    schema: "federation-reintegration-wave31c-liris-push-verify-closeout-acer.v1",
    generatedAt,
    status: allVisible ? "ACER_TO_LIRIS_PUSH_VISIBLE_HASH_VERIFIED" : "ACER_TO_LIRIS_PUSH_VERIFY_HELD",
    sourceMode: "LOCAL_ASOLARIA_SCRIPT_ONLY_NO_CODEX_MCP_NO_SUBAGENTS",
    wave: { family: "Wave 31", letter: "C", name: "31C", phase: "liris-push-verify-closeout" },
    inputs: {
      wave31b: { present: wave31b.present, sha256: wave31b.sha256, stateHash: wave31b.json?.stateHash || null, status: wave31b.json?.status || null }
    },
    checks,
    supervisorVotes: votes,
    decision: {
      closed: allVisible,
      status: allVisible ? "PUSH_CLOSED_WAITING_FOR_LIRIS_LOCAL_INTAKE" : "PUSH_VERIFY_HELD",
      nextForLiris: "Run Liris local intake/verifier against data/behcs/orchestration/federation-reintegration-20260427/incoming-acer."
    },
    boundary: "Post-push verification only. No new write to Liris, no Codex MCP/subagents, no peer API call, no Liris canonical overwrite, no promotion, no device action."
  };
  state.stateHash = sha256Text(JSON.stringify(state));
  return state;
}

function buildMapMapMapped(state) {
  return {
    schema: "behcs-map-map-mapped.v1",
    generatedAt,
    sourceStateHash: state.stateHash,
    map: "ACER Wave31B push -> Liris incoming-acer visible files",
    mapMap: state.supervisorVotes.map((vote) => ({ prof: vote.prof, vote: vote.vote })),
    mapMapMapped: state.checks.map((check) => ({ id: check.id, pass: check.pass, sha256: check.remote.sha256, path: check.remote.path }))
  };
}

function buildCubeCubedSource(state) {
  const payload = {
    schema: "behcs-cube-cube-cubed.v1",
    generatedAt,
    sourceStateHash: state.stateHash,
    axes: {
      x: "Wave31B wrote payloads",
      y: "Wave31C re-read Liris share",
      z: "Remote hashes match expected"
    },
    closed: state.decision.closed,
    checks: state.checks.map((check) => ({ id: check.id, pass: check.pass, sha256: check.remote.sha256 }))
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
    glyphFamily: "ACER_TO_LIRIS_PUSH_VERIFY_CLOSEOUT",
    glyphs: state.supervisorVotes.map((vote, index) => ({
      atom: `GLPJ:BEHCS256:W31C:${String(index + 1).padStart(2, "0")}`,
      prof: vote.prof,
      supervisorPid: vote.supervisorPid,
      vote: vote.vote
    })),
    phrase: state.decision.closed
      ? "ACER_TO_LIRIS_PUSH_VISIBLE_HASH_VERIFIED_WAITING_LIRIS_INTAKE"
      : "ACER_TO_LIRIS_PUSH_VERIFY_HELD"
  };
}

function buildD50(state, artifacts) {
  return [
    "# D50 Wave 31C - Liris Push Verify Closeout (ACER)",
    "",
    "| Field | Value |",
    "|---|---|",
    `| status | ${state.status} |`,
    `| generated_at | ${state.generatedAt} |`,
    `| state_hash | ${state.stateHash} |`,
    `| closed | ${state.decision.closed} |`,
    "",
    "## Supervisor Votes",
    "",
    ...state.supervisorVotes.map((vote) => `- ${vote.prof} / ${vote.supervisorPid}: ${vote.vote}`),
    "",
    "## Remote Checks",
    "",
    ...state.checks.map((check) => `- ${check.id}: pass=${check.pass}, sha256=${check.remote.sha256}, path=${check.remote.path}`),
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
    "# Wave 31C Liris Push Verify Closeout",
    "",
    `Generated: ${state.generatedAt}`,
    `Status: ${state.status}`,
    `State hash: ${state.stateHash}`,
    "",
    "## Result",
    "",
    `- Closed: ${state.decision.closed}`,
    `- Next for Liris: ${state.decision.nextForLiris}`,
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
    checks: state.checks.map((check) => ({
      id: check.id,
      pass: check.pass,
      sha256: check.remote.sha256,
      path: check.remote.path
    })),
    artifacts
  }, null, 2));
}

main();
