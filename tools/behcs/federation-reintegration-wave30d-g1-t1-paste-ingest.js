#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427");
const incomingRoot = path.join(runRoot, "incoming-t1");
const pasteRoot = path.join(incomingRoot, "operator-paste");
const councilRoot = path.join(repoRoot, "data", "agent-index", "council");
const reportsRoot = path.join(repoRoot, "reports");

const FILES = Object.freeze([
  {
    id: "liris-base-d11",
    label: "Liris base D11 ledger",
    pasteFile: path.join(pasteRoot, "01-liris-base-d11.paste.md"),
    targetFile: path.join(incomingRoot, "liris-base-d11.raw.md"),
    lirisSource: "C:/Users/rayss/Asolaria/data/agent-index/D11-AUDIT-LEDGER-2026-04-27.md",
    expectedSha256: "0a399d05b704fe1199e3da6150e41aa861ed51b3a4903b241fb2fabf5336f635",
    expectedLines: 165,
    expectedBytes: 10470
  },
  {
    id: "liris-falcon-correction-addendum",
    label: "Liris Falcon-correction addendum",
    pasteFile: path.join(pasteRoot, "02-liris-falcon-correction-addendum.paste.md"),
    targetFile: path.join(incomingRoot, "liris-falcon-correction-addendum.raw.md"),
    lirisSource: "C:/Users/rayss/Asolaria/data/agent-index/D11-AUDIT-LEDGER-ADDENDUM-FALCON-SERIAL-CORRECTION-2026-04-27.md",
    expectedSha256: "4067d94480370c8bf1301f16f289e93509c697cfd982b18fd7b90f33a3a8c16e",
    expectedLines: 92,
    expectedBytes: 6152
  }
]);

const OUTPUTS = Object.freeze({
  state: path.join(runRoot, "wave30d-g1-t1-paste-ingest-acer.v1.json"),
  d50: path.join(councilRoot, "D50-WAVE30D-G1-T1-PASTE-INGEST-TOOLING-ACER-2026-04-28.md"),
  reportJson: path.join(reportsRoot, "federation-reintegration-wave30d-g1-t1-paste-ingest-latest.json"),
  reportMd: path.join(reportsRoot, "federation-reintegration-wave30d-g1-t1-paste-ingest-latest.md")
});

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

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

function emptyBuffer() {
  return Buffer.alloc(0);
}

function initPasteSurface() {
  ensureDir(pasteRoot);
  for (const file of FILES) {
    if (!fs.existsSync(file.pasteFile)) {
      ensureParent(file.pasteFile);
      fs.writeFileSync(file.pasteFile, "", "utf8");
    }
  }
  const readme = [
    "# G1 T1 Operator Paste Slots",
    "",
    "Paste the exact Liris file contents into the two `.paste.md` files in this directory.",
    "Do not paste into Word or rich text. Use a raw text editor. Replace the whole file contents.",
    "",
    "After both paste files are filled, run:",
    "",
    "```powershell",
    "cd C:\\Users\\acer\\Asolaria",
    "node tools\\behcs\\federation-reintegration-wave30d-g1-t1-paste-ingest.js",
    "node tools\\behcs\\federation-reintegration-g1-t1-verify-staging.js",
    "```",
    "",
    "The ingest script only installs the final `incoming-t1/*.raw.md` files if both pasted files match their expected sha256 values.",
    "",
    "## Slots",
    "",
    ...FILES.flatMap((file) => [
      `- Paste ${file.label} into \`${path.basename(file.pasteFile)}\``,
      `  - Liris source: \`${file.lirisSource}\``,
      `  - Expected sha256: \`${file.expectedSha256}\``,
      `  - Expected lines: ${file.expectedLines}`,
      `  - Expected bytes: ${file.expectedBytes}`
    ])
  ].join("\n");
  writeText(path.join(pasteRoot, "README.md"), readme);
}

function inspectPaste(file) {
  const pasteBuffer = fs.existsSync(file.pasteFile) ? fs.readFileSync(file.pasteFile) : emptyBuffer();
  const targetBuffer = fs.existsSync(file.targetFile) ? fs.readFileSync(file.targetFile) : null;
  const pasteSha = pasteBuffer.length ? sha256Buffer(pasteBuffer) : null;
  const targetSha = targetBuffer ? sha256Buffer(targetBuffer) : null;
  return {
    id: file.id,
    label: file.label,
    pastePath: repoRel(file.pasteFile),
    targetPath: repoRel(file.targetFile),
    lirisSource: file.lirisSource,
    expectedSha256: file.expectedSha256,
    expectedLines: file.expectedLines,
    expectedBytes: file.expectedBytes,
    pastePresent: pasteBuffer.length > 0,
    pasteLines: lineCount(pasteBuffer),
    pasteBytes: pasteBuffer.length,
    pasteSha256: pasteSha,
    pasteSha256Matches: pasteSha === file.expectedSha256,
    targetPresent: Boolean(targetBuffer),
    targetSha256: targetSha,
    targetSha256Matches: targetSha === file.expectedSha256
  };
}

function installIfReady(inspections) {
  const ready = inspections.every((row) => row.pasteSha256Matches);
  if (!ready) return { installed: false, reason: "PASTE_SLOTS_NOT_HASH_MATCHED" };
  for (const file of FILES) {
    const buffer = fs.readFileSync(file.pasteFile);
    ensureParent(file.targetFile);
    fs.writeFileSync(file.targetFile, buffer);
  }
  return { installed: true, reason: "BOTH_PASTE_SLOTS_HASH_MATCHED" };
}

function buildSupervisorVotes(inspections, installResult) {
  const ready = inspections.every((row) => row.pasteSha256Matches);
  return [
    {
      prof: "PROF-COMMS",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.COMMS.CHANNEL.ACER",
      vote: "BUILD_OPERATOR_PASTE_SLOTS",
      verdict: "COMPLETE",
      rationale: "The operator could not locate files; local paste slots make the T1 handoff concrete."
    },
    {
      prof: "PROF-HERMES",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET.ACER",
      vote: "INSTALL_ONLY_ON_EXACT_HASH_MATCH",
      verdict: ready ? "ALLOW_INSTALL" : "HOLD",
      rationale: "Raw target files are only installed after both pasted payloads match expected hashes."
    },
    {
      prof: "PROF-KERNEL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.KERNEL.GRAMMAR.ACER",
      vote: "PRESERVE_BYTE_IDENTITY",
      verdict: ready ? "BYTE_IDENTITY_READY" : "AWAITING_BYTES",
      rationale: "Line/byte/hash expectations remain the gate; no content is synthesized."
    },
    {
      prof: "PROF-SHANNON",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.SHANNON.TRUST.ACER",
      vote: "BLOCK_CANONICAL_WRITE",
      verdict: installResult.installed ? "VERIFY_NEXT" : "BLOCKED",
      rationale: "Even installed raw files require the separate verifier before any canonical proposal."
    },
    {
      prof: "COL-ASOLARIA",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.ASOLARIA.APEX.ACER",
      vote: "EXECUTE_LOCAL_INGEST_TOOLING_ONLY",
      verdict: "DONE",
      rationale: "This builds the receiving surface and keeps promotion blocked."
    }
  ];
}

function buildState(inspections, installResult, votes) {
  const state = {
    schema: "federation-reintegration-wave30d-g1-t1-paste-ingest-acer.v1",
    generatedAt,
    status: installResult.installed ? "T1_RAW_TARGETS_INSTALLED_READY_FOR_VERIFIER" : "AWAITING_OPERATOR_PASTE_IN_LOCAL_SLOTS",
    relationship: "LOCAL_PROF_SUPERVISOR_BUILT_T1_RECEIVING_SURFACE",
    wave: { family: "Wave 30", letter: "D", name: "30D", phase: "g1-t1-paste-ingest-tooling" },
    sourceMode: "LOCAL_ASOLARIA_SCRIPT_ONLY_NO_CODEX_MCP_NO_SUBAGENTS",
    pasteRoot: repoRel(pasteRoot),
    inspections,
    installResult,
    supervisorVotes: votes,
    nextCommands: installResult.installed
      ? ["node tools/behcs/federation-reintegration-g1-t1-verify-staging.js"]
      : [
          "Open data/behcs/orchestration/federation-reintegration-20260427/incoming-t1/operator-paste/01-liris-base-d11.paste.md and paste File 1 contents.",
          "Open data/behcs/orchestration/federation-reintegration-20260427/incoming-t1/operator-paste/02-liris-falcon-correction-addendum.paste.md and paste File 2 contents.",
          "node tools/behcs/federation-reintegration-wave30d-g1-t1-paste-ingest.js"
        ],
    canonicalIntegrationAllowed: false,
    boundary: "Local paste ingest tooling only. No Liris content fabrication, no peer call, no MCP, no subagents, no content mirror, no canonical write, no promotion, no key generation, no device action."
  };
  state.stateHash = sha256Text(JSON.stringify(state));
  return state;
}

function buildD50(state) {
  return [
    "# D50 Wave 30D - G1 T1 Paste Ingest Tooling (ACER)",
    "",
    "| Field | Value |",
    "|---|---|",
    `| status | ${state.status} |`,
    `| generated_at | ${state.generatedAt} |`,
    `| state_hash | ${state.stateHash} |`,
    `| paste_root | ${state.pasteRoot} |`,
    "",
    "## Local Supervisor Votes",
    "",
    ...state.supervisorVotes.map((vote) => `- ${vote.prof} / ${vote.supervisorPid}: ${vote.vote} -> ${vote.verdict}`),
    "",
    "## Paste Slots",
    "",
    ...state.inspections.flatMap((row) => [
      `- ${row.label}`,
      `  - Paste file: \`${row.pastePath}\``,
      `  - Target file: \`${row.targetPath}\``,
      `  - Expected sha256: \`${row.expectedSha256}\``,
      `  - Paste status: present=${row.pastePresent}, hashMatch=${row.pasteSha256Matches}`
    ]),
    "",
    "## Next Commands",
    "",
    ...state.nextCommands.map((command) => `- \`${command}\``),
    "",
    "## Boundary",
    "",
    state.boundary
  ].join("\n");
}

function buildReport(state) {
  return [
    "# Wave 30D G1 T1 Paste Ingest",
    "",
    `Generated: ${state.generatedAt}`,
    `Status: ${state.status}`,
    `State hash: ${state.stateHash}`,
    "",
    `Paste root: \`${state.pasteRoot}\``,
    "",
    "## Result",
    "",
    `- Installed final raw targets: ${state.installResult.installed}`,
    `- Reason: ${state.installResult.reason}`,
    `- Canonical integration allowed: ${state.canonicalIntegrationAllowed}`,
    "",
    "## Boundary",
    "",
    state.boundary
  ].join("\n");
}

function main() {
  initPasteSurface();
  const before = FILES.map(inspectPaste);
  const installResult = installIfReady(before);
  const after = FILES.map(inspectPaste);
  const votes = buildSupervisorVotes(after, installResult);
  const state = buildState(after, installResult, votes);
  writeJson(OUTPUTS.state, state);
  writeText(OUTPUTS.d50, buildD50(state));
  writeJson(OUTPUTS.reportJson, state);
  writeText(OUTPUTS.reportMd, buildReport(state));
  console.log(JSON.stringify({
    ok: true,
    status: state.status,
    stateHash: state.stateHash,
    pasteRoot: state.pasteRoot,
    installed: state.installResult.installed,
    nextCommands: state.nextCommands,
    outputs: Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)]))
  }, null, 2));
}

main();
