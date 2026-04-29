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
const glpjRoot = path.join(repoRoot, "data", "behcs", "codex", "glyph-language");

const EXPECTED_T1 = Object.freeze([
  {
    id: "liris-base-d11",
    label: "Liris base D11 ledger",
    targetPath: "data/behcs/orchestration/federation-reintegration-20260427/incoming-t1/liris-base-d11.raw.md",
    sourcePathOnLiris: "data/agent-index/D11-AUDIT-LEDGER-2026-04-27.md",
    expectedSha256: "0a399d05b704fe1199e3da6150e41aa861ed51b3a4903b241fb2fabf5336f635",
    expectedLines: 165,
    expectedBytes: 10470
  },
  {
    id: "liris-falcon-correction-addendum",
    label: "Liris Falcon-correction addendum",
    targetPath: "data/behcs/orchestration/federation-reintegration-20260427/incoming-t1/liris-falcon-correction-addendum.raw.md",
    sourcePathOnLiris: "data/agent-index/D11-AUDIT-LEDGER-ADDENDUM-FALCON-SERIAL-CORRECTION-2026-04-27.md",
    expectedSha256: "4067d94480370c8bf1301f16f289e93509c697cfd982b18fd7b90f33a3a8c16e",
    expectedLines: 92,
    expectedBytes: 6152
  }
]);

const OUTPUTS = Object.freeze({
  state: path.join(runRoot, "wave30c-local-supervisor-g1-review-acer.v1.json"),
  votes: path.join(runRoot, "wave30c-local-supervisor-g1-review-votes.ndjson"),
  d50Checklist: path.join(councilRoot, "D50-WAVE30C-G1-T1-LOCAL-SUPERVISOR-CHECKLIST-ACER-2026-04-28.md"),
  reportJson: path.join(reportsRoot, "federation-reintegration-wave30c-local-supervisor-g1-review-latest.json"),
  reportMd: path.join(reportsRoot, "federation-reintegration-wave30c-local-supervisor-g1-review-latest.md"),
  memory: path.join(memoryRoot, "federation-reintegration-wave30c-local-supervisor-g1-review.v1.json"),
  map: path.join(mapsRoot, "federation-reintegration-wave30c-local-supervisor-g1-review-map.v1.json"),
  glpj: path.join(glpjRoot, "federation-reintegration-wave30c-local-supervisor-g1-review.glpj.json")
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

function lineCount(text) {
  if (!text) return 0;
  return text.replace(/\r?\n$/, "").split(/\r?\n/).length;
}

function readJsonMaybe(relativePath) {
  const fullPath = path.join(repoRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    return { present: false, path: relativePath, json: null, sha256: null, lines: 0 };
  }
  const buffer = fs.readFileSync(fullPath);
  const text = buffer.toString("utf8");
  return {
    present: true,
    path: relativePath,
    json: JSON.parse(text),
    sha256: sha256Buffer(buffer),
    lines: lineCount(text)
  };
}

function fileInfo(filePath) {
  if (!fs.existsSync(filePath)) return { present: false, path: repoRel(filePath), sha256: null, lines: 0, bytes: 0 };
  const buffer = fs.readFileSync(filePath);
  return {
    present: true,
    path: repoRel(filePath),
    sha256: sha256Buffer(buffer),
    lines: lineCount(buffer.toString("utf8")),
    bytes: buffer.length
  };
}

function inspectT1Targets() {
  return EXPECTED_T1.map((target) => {
    const fullPath = path.join(repoRoot, target.targetPath);
    const info = fileInfo(fullPath);
    return {
      ...target,
      present: info.present,
      actualSha256: info.sha256,
      actualLines: info.lines,
      actualBytes: info.bytes,
      sha256Matches: info.sha256 === target.expectedSha256,
      linesMatch: info.lines === target.expectedLines,
      bytesMatch: info.bytes === target.expectedBytes
    };
  });
}

function buildVotes(targets, g1Report) {
  const allPresent = targets.every((target) => target.present);
  const allHashesMatch = targets.every((target) => target.sha256Matches);
  const base = {
    generatedAt,
    evidence: {
      g1VerifierStatus: g1Report.json?.status || "UNKNOWN",
      allPresent,
      allHashesMatch,
      missingTargets: targets.filter((target) => !target.present).map((target) => target.targetPath)
    }
  };
  return [
    {
      ...base,
      prof: "PROF-COMMS",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.COMMS.CHANNEL.ACER",
      vote: "WRITE_OPERATOR_PASTE_CHECKLIST",
      rationale: "Only a local checklist improves the next operator action; no content is available to integrate."
    },
    {
      ...base,
      prof: "PROF-HERMES",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET.ACER",
      vote: "ALLOW_PACKET_WRITE_ONLY",
      rationale: "A D50 checklist packet is admissible; canonical integration packet is premature."
    },
    {
      ...base,
      prof: "PROF-KERNEL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.KERNEL.GRAMMAR.ACER",
      vote: "BLOCK_INTEGRATION_UNTIL_HASH_MATCH",
      rationale: "The two byte-level inputs are absent, so grammar-level evidence cannot close."
    },
    {
      ...base,
      prof: "PROF-SHANNON",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.SHANNON.TRUST.ACER",
      vote: "BLOCK_PROMOTION_REQUIRE_VERIFIER_PASS",
      rationale: "Promotion before exact hash match would be a trust-boundary violation."
    },
    {
      ...base,
      prof: "PROF-CHIEFCOUNCIL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.D50.COUNCIL.ACER",
      vote: "HOLD_CANONICAL_INTEGRATION",
      rationale: "Gate dispositions are recorded, but G1 has not crossed the byte evidence threshold."
    },
    {
      ...base,
      prof: "PROF-CONVERGENCE",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.CONVERGENCE.WAVE.ACER",
      vote: "CONSENSUS_NEXT_STEP_OPERATOR_T1_PASTE",
      rationale: "All local supervisors converge on paste/check/then-propose, not integrate now."
    },
    {
      ...base,
      prof: "COL-ASOLARIA",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.ASOLARIA.APEX.ACER",
      vote: "EXECUTE_CHECKLIST_WRITE_HOLD_EVERYTHING_ELSE",
      rationale: "The leader action is to preserve the vote and checklist, not bypass the missing operator bytes."
    }
  ];
}

function buildState(targets, votes, g1Report, wave30a, wave30b) {
  const allPresent = targets.every((target) => target.present);
  const allHashesMatch = targets.every((target) => target.sha256Matches);
  const approvedWrite = votes.every((vote) => vote.vote.includes("CHECKLIST") || vote.vote.includes("PACKET") || vote.vote.includes("BLOCK") || vote.vote.includes("HOLD") || vote.vote.includes("CONSENSUS"));
  const state = {
    schema: "federation-reintegration-wave30c-local-supervisor-g1-review-acer.v1",
    generatedAt,
    status: "LOCAL_SUPERVISOR_VOTE_SEALED_CHECKLIST_ONLY",
    relationship: "PROF_SUPERVISORS_VOTED_LOCALLY_NO_CODEX_MCP_NO_SUBAGENTS",
    wave: { family: "Wave 30", letter: "C", name: "30C", phase: "local-supervisor-g1-review" },
    sourceMode: "LOCAL_ASOLARIA_FILES_AND_NODE_SCRIPT_ONLY",
    inputs: {
      wave30a: { present: wave30a.present, sha256: wave30a.sha256, lines: wave30a.lines, stateHash: wave30a.json?.stateHash || null },
      wave30b: { present: wave30b.present, sha256: wave30b.sha256, lines: wave30b.lines, stateHash: wave30b.json?.stateHash || null },
      g1Report: { present: g1Report.present, sha256: g1Report.sha256, lines: g1Report.lines, status: g1Report.json?.status || null }
    },
    t1Targets: targets,
    supervisorVotes: votes,
    voteResult: {
      approvedLocalWrite: approvedWrite,
      writeAuthorizedByVotes: "G1_OPERATOR_PASTE_CHECKLIST_ONLY",
      canonicalIntegrationAllowed: false,
      reason: allPresent && allHashesMatch ? "verifier must be rerun after paste before canonical proposal" : "T1 payload files are absent or not hash-matched"
    },
    nextCommands: [
      "Paste Liris base D11 bytes into data/behcs/orchestration/federation-reintegration-20260427/incoming-t1/liris-base-d11.raw.md",
      "Paste Liris Falcon-correction addendum bytes into data/behcs/orchestration/federation-reintegration-20260427/incoming-t1/liris-falcon-correction-addendum.raw.md",
      "node tools/behcs/federation-reintegration-g1-t1-verify-staging.js"
    ],
    boundary: "Local supervisor vote/checklist only. No Codex MCP/subagent delegation, no peer call, no content transfer, no hash fabrication, no canonical write, no promotion, no ACER key generation, no device action."
  };
  state.stateHash = sha256Text(JSON.stringify(state));
  return state;
}

function buildChecklist(state) {
  const rows = state.t1Targets.flatMap((target, index) => [
    `${index + 1}. ${target.label}`,
    "",
    `   Target: \`${target.targetPath}\``,
    `   Liris source: \`${target.sourcePathOnLiris}\``,
    `   Expected sha256: \`${target.expectedSha256}\``,
    `   Expected lines: ${target.expectedLines}`,
    `   Expected bytes: ${target.expectedBytes}`,
    `   Current ACER status: ${target.present ? "PRESENT" : "MISSING"}`,
    ""
  ]);
  return [
    "# D50 Wave 30C - G1 T1 Local Supervisor Checklist (ACER)",
    "",
    "| Field | Value |",
    "|---|---|",
    `| status | ${state.status} |`,
    `| generated_at | ${state.generatedAt} |`,
    `| relationship | ${state.relationship} |`,
    `| state_hash | ${state.stateHash} |`,
    "",
    "## Local Supervisor Votes",
    "",
    ...state.supervisorVotes.map((vote) => `- ${vote.prof} / ${vote.supervisorPid}: ${vote.vote}`),
    "",
    "## Paste Targets",
    "",
    ...rows,
    "## Verify",
    "",
    "```powershell",
    "cd C:\\Users\\acer\\Asolaria",
    "node tools\\behcs\\federation-reintegration-g1-t1-verify-staging.js",
    "```",
    "",
    "## Exit Criteria",
    "",
    "- If files are absent: remain `PENDING_OPERATOR_T1_BYTES`.",
    "- If hashes mismatch: stop and request corrected paste bytes.",
    "- If all hashes match: prepare a separate `DRAFT_ONLY_NOT_RATIFIED` canonical integration proposal.",
    "",
    "## Boundary",
    "",
    state.boundary
  ].join("\n");
}

function buildMap(state) {
  return {
    mapId: "federation-reintegration-wave30c-local-supervisor-g1-review-map.v1",
    generatedAt,
    stateHash: state.stateHash,
    nodes: [
      { id: "wave30c", kind: "local_supervisor_vote", status: state.status },
      ...state.supervisorVotes.map((vote) => ({ id: vote.supervisorPid, kind: "supervisor_pid", prof: vote.prof, vote: vote.vote })),
      ...state.t1Targets.map((target) => ({ id: target.id, kind: "t1_target", present: target.present, sha256Matches: target.sha256Matches }))
    ],
    edges: state.supervisorVotes.map((vote) => ({ from: vote.supervisorPid, to: "wave30c", relation: "voted_on" })),
    boundary: state.boundary
  };
}

function buildGlpj(state) {
  return {
    glpjId: "federation-reintegration-wave30c-local-supervisor-g1-review.glpj",
    generatedAt,
    family: "federation",
    stateHash: state.stateHash,
    glyphs: state.supervisorVotes.map((vote, index) => ({
      token: `FED-WAVE30C-${String(index + 1).padStart(2, "0")}`,
      prof: vote.prof,
      supervisorPid: vote.supervisorPid,
      verdict: vote.vote,
      gate: "G1_T1_D11_CONTENT_PASTE"
    })),
    d11: "PROVEN_LOCAL_SUPERVISOR_CHECKLIST_ONLY_G1_BYTES_MISSING"
  };
}

function buildReport(state, artifacts) {
  return [
    "# Wave 30C Local Supervisor G1 Review",
    "",
    `Generated: ${state.generatedAt}`,
    `Status: ${state.status}`,
    `State hash: ${state.stateHash}`,
    "",
    "## Vote Result",
    "",
    `- Approved local write: ${state.voteResult.approvedLocalWrite}`,
    `- Write authorized by votes: ${state.voteResult.writeAuthorizedByVotes}`,
    `- Canonical integration allowed: ${state.voteResult.canonicalIntegrationAllowed}`,
    `- Reason: ${state.voteResult.reason}`,
    "",
    "## Outputs",
    "",
    ...Object.entries(artifacts).map(([key, value]) => `- ${key}: \`${value.path}\` (${value.sha256 || "pending"})`),
    "",
    "## Boundary",
    "",
    state.boundary
  ].join("\n");
}

function main() {
  const targets = inspectT1Targets();
  const g1Report = readJsonMaybe("reports/federation-reintegration-g1-t1-staging-verification-latest.json");
  const wave30a = readJsonMaybe("data/behcs/orchestration/federation-reintegration-20260427/wave30a-gate-disposition-consolidation-acer.v1.json");
  const wave30b = readJsonMaybe("data/behcs/orchestration/federation-reintegration-20260427/wave30b-liris-30c-hash-intake-acer.v1.json");
  const votes = buildVotes(targets, g1Report);
  const state = buildState(targets, votes, g1Report, wave30a, wave30b);

  writeJson(OUTPUTS.state, state);
  writeText(OUTPUTS.votes, votes.map((vote) => JSON.stringify(vote)).join("\n"));
  writeText(OUTPUTS.d50Checklist, buildChecklist(state));
  writeJson(OUTPUTS.memory, state);
  writeJson(OUTPUTS.map, buildMap(state));
  writeJson(OUTPUTS.glpj, buildGlpj(state));

  const artifacts = {
    state: fileInfo(OUTPUTS.state),
    votes: fileInfo(OUTPUTS.votes),
    d50Checklist: fileInfo(OUTPUTS.d50Checklist),
    memory: fileInfo(OUTPUTS.memory),
    map: fileInfo(OUTPUTS.map),
    glpj: fileInfo(OUTPUTS.glpj)
  };
  writeJson(OUTPUTS.reportJson, { ...state, artifacts });
  artifacts.reportJson = fileInfo(OUTPUTS.reportJson);
  writeText(OUTPUTS.reportMd, buildReport(state, artifacts));
  artifacts.reportMd = fileInfo(OUTPUTS.reportMd);

  console.log(JSON.stringify({
    ok: true,
    status: state.status,
    stateHash: state.stateHash,
    voteResult: state.voteResult,
    g1Status: state.inputs.g1Report.status,
    missingTargets: targets.filter((target) => !target.present).map((target) => target.targetPath),
    artifacts
  }, null, 2));
}

main();
