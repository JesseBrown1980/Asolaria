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

const MIRRORS = Object.freeze([
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
  state: path.join(runRoot, "wave30e-g1-canonical-mirror-acer.v1.json"),
  votes: path.join(runRoot, "wave30e-g1-canonical-mirror-votes.ndjson"),
  d50: path.join(councilRoot, "D50-WAVE30E-G1-CANONICAL-MIRROR-ACER-2026-04-28.md"),
  reportJson: path.join(reportsRoot, "federation-reintegration-wave30e-g1-canonical-mirror-latest.json"),
  reportMd: path.join(reportsRoot, "federation-reintegration-wave30e-g1-canonical-mirror-latest.md")
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

function lineCount(buffer) {
  const text = buffer.toString("utf8").replace(/\r?\n$/, "");
  return text ? text.split(/\r?\n/).length : 0;
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

function inspectMirrors() {
  return MIRRORS.map((mirror) => {
    const staging = inspectPath(mirror.stagingPath);
    const canonical = inspectPath(mirror.canonicalPath);
    const stagingReady = staging.present &&
      staging.sha256 === mirror.expectedSha256 &&
      staging.lines === mirror.expectedLines &&
      staging.bytes === mirror.expectedBytes;
    const canonicalSafe = !canonical.present || canonical.sha256 === mirror.expectedSha256;
    return {
      ...mirror,
      staging,
      canonicalBefore: canonical,
      stagingReady,
      canonicalSafeToWrite: canonicalSafe
    };
  });
}

function buildVotes(mirrors, g1Report) {
  const allReady = mirrors.every((mirror) => mirror.stagingReady);
  const allSafe = mirrors.every((mirror) => mirror.canonicalSafeToWrite);
  const g1Ready = g1Report.json?.status === "READY_FOR_SEPARATE_CANONICAL_WRITE_WAVE";
  return [
    {
      prof: "PROF-HERMES",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET.ACER",
      vote: allReady && allSafe && g1Ready ? "ALLOW_CANONICAL_MIRROR_WRITE" : "HOLD",
      rationale: "Verifier green plus separate Wave 30E packet satisfies the required write envelope."
    },
    {
      prof: "PROF-KERNEL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.KERNEL.GRAMMAR.ACER",
      vote: allReady ? "BYTE_GRAMMAR_MATCHED" : "HOLD_BYTE_GRAMMAR",
      rationale: "Both staging files must match expected sha256, line count, and byte count."
    },
    {
      prof: "PROF-SHANNON",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.SHANNON.TRUST.ACER",
      vote: allSafe ? "ALLOW_ABSENT_OR_IDENTICAL_TARGETS_ONLY" : "BLOCK_EXISTING_TARGET_MISMATCH",
      rationale: "No overwrite of divergent canonical files is allowed."
    },
    {
      prof: "PROF-CHIEFCOUNCIL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.D50.COUNCIL.ACER",
      vote: "MIRROR_EVIDENCE_ONLY_NO_FEDERATION_PROMOTION",
      rationale: "Installing mirrored D11 evidence does not promote federation status or mutate LX canon."
    },
    {
      prof: "COL-ASOLARIA",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.ASOLARIA.APEX.ACER",
      vote: allReady && allSafe && g1Ready ? "EXECUTE_CANONICAL_MIRROR" : "HOLD",
      rationale: "This is the smallest local integration that closes G1 without widening authority."
    }
  ];
}

function executeMirror(mirrors, votes, g1Report) {
  const allowedByVotes = votes.every((vote) => !["HOLD", "HOLD_BYTE_GRAMMAR", "BLOCK_EXISTING_TARGET_MISMATCH"].includes(vote.vote));
  const g1Ready = g1Report.json?.status === "READY_FOR_SEPARATE_CANONICAL_WRITE_WAVE";
  if (!allowedByVotes || !g1Ready) {
    return { executed: false, reason: "SUPERVISOR_VOTES_OR_G1_REPORT_NOT_READY" };
  }
  for (const mirror of mirrors) {
    const sourcePath = path.join(repoRoot, mirror.stagingPath);
    const targetPath = path.join(repoRoot, mirror.canonicalPath);
    ensureParent(targetPath);
    fs.copyFileSync(sourcePath, targetPath);
  }
  return { executed: true, reason: "LOCAL_SUPERVISOR_VOTES_ALLOWED_ABSENT_OR_IDENTICAL_CANONICAL_MIRROR" };
}

function buildState(mirrorsBefore, votes, execution, g1Report) {
  const mirrorsAfter = MIRRORS.map((mirror) => ({
    id: mirror.id,
    label: mirror.label,
    canonicalAfter: inspectPath(mirror.canonicalPath),
    expectedSha256: mirror.expectedSha256
  }));
  const allAfterMatch = mirrorsAfter.every((mirror) => mirror.canonicalAfter.sha256 === mirror.expectedSha256);
  const state = {
    schema: "federation-reintegration-wave30e-g1-canonical-mirror-acer.v1",
    generatedAt,
    status: execution.executed && allAfterMatch ? "G1_CANONICAL_MIRROR_WRITTEN_HASH_VERIFIED" : "G1_CANONICAL_MIRROR_HELD",
    relationship: "LOCAL_SUPERVISOR_CANONICAL_MIRROR_AFTER_T1_VERIFIER_PASS",
    wave: { family: "Wave 30", letter: "E", name: "30E", phase: "g1-canonical-mirror" },
    sourceMode: "LOCAL_ASOLARIA_SCRIPT_ONLY_NO_CODEX_MCP_NO_SUBAGENTS",
    inputs: {
      g1Report: { present: g1Report.present, sha256: g1Report.sha256, status: g1Report.json?.status || null }
    },
    mirrorsBefore,
    supervisorVotes: votes,
    execution,
    mirrorsAfter,
    allAfterMatch,
    nextStep: execution.executed && allAfterMatch
      ? "Run final Wave 30F local supervisor closeout; do not promote federation status from this mirror alone."
      : "Resolve blockers and rerun Wave 30E.",
    boundary: "Local canonical mirror of verified G1 evidence only. No peer call, no MCP, no subagents, no hash fabrication, no LX mutation, no federation promotion, no device action, no ACER key generation."
  };
  state.stateHash = sha256Text(JSON.stringify(state));
  return state;
}

function buildD50(state) {
  return [
    "# D50 Wave 30E - G1 Canonical Mirror (ACER)",
    "",
    "| Field | Value |",
    "|---|---|",
    `| status | ${state.status} |`,
    `| generated_at | ${state.generatedAt} |`,
    `| state_hash | ${state.stateHash} |`,
    `| execution | ${state.execution.executed} |`,
    "",
    "## Local Supervisor Votes",
    "",
    ...state.supervisorVotes.map((vote) => `- ${vote.prof} / ${vote.supervisorPid}: ${vote.vote}`),
    "",
    "## Canonical Mirror Results",
    "",
    ...state.mirrorsAfter.map((mirror) => `- ${mirror.label}: ${mirror.canonicalAfter.path}, sha256=${mirror.canonicalAfter.sha256}, expected=${mirror.expectedSha256}`),
    "",
    "## Boundary",
    "",
    state.boundary
  ].join("\n");
}

function buildReport(state) {
  return [
    "# Wave 30E G1 Canonical Mirror",
    "",
    `Generated: ${state.generatedAt}`,
    `Status: ${state.status}`,
    `State hash: ${state.stateHash}`,
    "",
    "## Result",
    "",
    `- Execution: ${state.execution.executed}`,
    `- Reason: ${state.execution.reason}`,
    `- All canonical hashes match: ${state.allAfterMatch}`,
    "",
    "## Boundary",
    "",
    state.boundary
  ].join("\n");
}

function main() {
  const g1Report = readJsonMaybe("reports/federation-reintegration-g1-t1-staging-verification-latest.json");
  const mirrorsBefore = inspectMirrors();
  const votes = buildVotes(mirrorsBefore, g1Report);
  const execution = executeMirror(mirrorsBefore, votes, g1Report);
  const state = buildState(mirrorsBefore, votes, execution, g1Report);
  writeJson(OUTPUTS.state, state);
  writeText(OUTPUTS.votes, votes.map((vote) => JSON.stringify(vote)).join("\n"));
  writeText(OUTPUTS.d50, buildD50(state));
  writeJson(OUTPUTS.reportJson, state);
  writeText(OUTPUTS.reportMd, buildReport(state));
  console.log(JSON.stringify({
    ok: true,
    status: state.status,
    stateHash: state.stateHash,
    execution: state.execution,
    allAfterMatch: state.allAfterMatch,
    mirrorsAfter: state.mirrorsAfter.map((mirror) => mirror.canonicalAfter),
    outputs: Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)]))
  }, null, 2));
}

main();
