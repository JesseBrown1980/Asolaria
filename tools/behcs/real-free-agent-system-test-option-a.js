#!/usr/bin/env node
"use strict";

const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..", "..");
const sourceReceiptId = "behcs-3d4ee308fd10";
const runId = "real-free-agent-system-test-acer-20260428";
const waveRoot = path.join(repoRoot, "data", "behcs", "orchestration", "real-free-agent-system-test-20260428");
const lirisRoot = "\\\\192.168.100.2\\liris-asolaria-old";
const lirisIncomingRoot = path.join(lirisRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427", "incoming-acer");
const lirisLaw001 = process.env.LIRIS_LAW001_URL || "http://192.168.100.2:4947/behcs/send";

const paths = Object.freeze({
  inbox: path.join(repoRoot, "data", "behcs", "inbox.ndjson"),
  d0: path.join(repoRoot, "data", "behcs", "d0-runtime", "sidecar-d0-events.ndjson"),
  questionPacket: path.join(waveRoot, "real-free-agent-system-test-questions.v1.json"),
  pushManifest: path.join(waveRoot, "wave33c-real-free-agent-test-push-manifest.json"),
  state: path.join(waveRoot, "real-free-agent-system-test-option-a-acer.v1.json"),
  reportJson: path.join(repoRoot, "reports", "real-free-agent-system-test-option-a-latest.json"),
  reportMd: path.join(repoRoot, "reports", "real-free-agent-system-test-option-a-latest.md"),
  postResult: path.join(waveRoot, "law001-real-free-agent-system-test-option-a-post-result.json"),
  runner: path.join(repoRoot, "tools", "behcs", "opencode-free-agent-supervisor-lane.js"),
  runnerTest: path.join(repoRoot, "tests", "opencode-free-agent-supervisor-lane.unit.test.js"),
  unitHarness: path.join(repoRoot, "tests", "_unitHarness.js")
});

function ensureParent(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeText(filePath, text) {
  ensureParent(filePath);
  fs.writeFileSync(filePath, String(text).endsWith("\n") ? String(text) : `${text}\n`, "utf8");
}

function writeJson(filePath, value) {
  writeText(filePath, JSON.stringify(value, null, 2));
}

function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function sha256Text(text) {
  return sha256Buffer(Buffer.from(String(text), "utf8"));
}

function sortDeep(value) {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortDeep(value[key])]));
  }
  return value;
}

function sha256Json(value) {
  return sha256Text(JSON.stringify(sortDeep(value)));
}

function sha256File(filePath) {
  return sha256Buffer(fs.readFileSync(filePath));
}

function repoRel(filePath) {
  const rel = path.relative(repoRoot, filePath);
  return (path.isAbsolute(rel) || rel.startsWith("..") ? filePath : rel).replace(/\\/g, "/");
}

function artifact(filePath) {
  if (!fs.existsSync(filePath)) {
    return { path: repoRel(filePath), present: false, sha256: null, bytes: 0 };
  }
  return {
    path: repoRel(filePath),
    present: true,
    sha256: sha256File(filePath),
    bytes: fs.statSync(filePath).size
  };
}

function findNdjson(id, filePath) {
  if (!fs.existsSync(filePath)) return null;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/g);
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index];
    if (!line || !line.includes(id)) continue;
    try {
      return { line: index + 1, row: JSON.parse(line), sha256: sha256Text(line) };
    } catch (error) {
      return { line: index + 1, parseError: String(error && error.message ? error.message : error), sha256: sha256Text(line) };
    }
  }
  return null;
}

function requireSourceEnvelope() {
  const inbox = findNdjson(sourceReceiptId, paths.inbox);
  const d0 = findNdjson(sourceReceiptId, paths.d0);
  if (!inbox || !inbox.row) throw new Error(`Missing source envelope ${sourceReceiptId}`);
  if (inbox.row.schema !== "law001-real-free-agent-system-test-bilateral-fire-greenlight.v1") {
    throw new Error(`Unexpected source schema: ${inbox.row.schema || ""}`);
  }
  if (inbox.row.gated !== true || !inbox.row.d0 || inbox.row.d0.gatePass !== true || inbox.row.d0.verdict !== "PROCEED") {
    throw new Error("Source envelope is not gated PROCEED");
  }
  if (!d0 || !d0.row || d0.row.gatePass !== true || d0.row.inferVerdict !== "PROCEED") {
    throw new Error("Source D0 gate pass is missing");
  }
  return { inbox, d0 };
}

function buildQuestionPacket(source) {
  const body = source.inbox.row.body || {};
  const questions = Array.isArray(body.proposed_question_set_4_system_self_knowledge)
    ? body.proposed_question_set_4_system_self_knowledge
    : [];
  if (questions.length !== 4) {
    throw new Error(`Expected 4 system self-knowledge questions, saw ${questions.length}`);
  }
  const packetCore = {
    schema: "real-free-agent-system-test-questions.v1",
    generatedAt: new Date().toISOString(),
    sourceReceiptId,
    sourceEnvelope: {
      inboxLine: source.inbox.line,
      inboxSha256: source.inbox.sha256,
      d0Line: source.d0.line,
      d0Sha256: source.d0.sha256
    },
    operatorCosign: source.inbox.row.operator_cosign || null,
    runner: "tools/behcs/opencode-free-agent-supervisor-lane.js",
    runConfig: body.parallel_run_config || {},
    questions,
    boundary: {
      noCanonMutation: true,
      noAuthorityLayerEdit: true,
      researchInputOnlyQuestions: true,
      laneNoToolsNoFileEditsNoFanout: true,
      divergedDraftSiblingsDoctrine: "preserved"
    }
  };
  return { ...packetCore, stateHash: sha256Json(packetCore) };
}

function writeQuestionPacket(packet) {
  writeJson(paths.questionPacket, packet);
  return artifact(paths.questionPacket);
}

function pushToLiris() {
  const bundleName = "wave33c-real-free-agent-test-push";
  const remoteRoot = path.join(lirisIncomingRoot, bundleName);
  fs.mkdirSync(remoteRoot, { recursive: true });
  const payloads = [
    paths.runner,
    paths.runnerTest,
    paths.unitHarness,
    paths.questionPacket
  ];
  const copied = [];
  for (const localPath of payloads) {
    const rel = repoRel(localPath);
    const remotePath = path.join(remoteRoot, rel);
    ensureParent(remotePath);
    fs.copyFileSync(localPath, remotePath);
    copied.push({
      local: rel,
      remote: remotePath.replace(/\\/g, "/"),
      localSha256: sha256File(localPath),
      remoteSha256: sha256File(remotePath),
      bytes: fs.statSync(localPath).size
    });
  }
  const commandText = [
    "$env:ASOLARIA_SUPERVISOR_RUN_ID='real-free-agent-system-test-liris-20260428'",
    "$env:ASOLARIA_SUPERVISOR_NAME='PROF-REAL-FREE-AGENT-SYSTEM-TEST'",
    "$env:ASOLARIA_SUPERVISOR_MODEL_POLICY='auto'",
    "$env:ASOLARIA_SUPERVISOR_COUNT='50'",
    "$env:ASOLARIA_SUPERVISOR_ROUNDS='1'",
    "$env:ASOLARIA_SUPERVISOR_CONCURRENCY='4'",
    "$env:ASOLARIA_SUPERVISOR_TIMEOUT_MS='120000'",
    "$env:ASOLARIA_SUPERVISOR_QUESTION_PACKET='data/behcs/orchestration/real-free-agent-system-test-20260428/real-free-agent-system-test-questions.v1.json'",
    "node tools/behcs/opencode-free-agent-supervisor-lane.js"
  ].join("\n");
  const commandPath = path.join(remoteRoot, "LIRIS-RUN-COMMAND.ps1.txt");
  writeText(commandPath, commandText);
  copied.push({
    local: "generated:LIRIS-RUN-COMMAND.ps1.txt",
    remote: commandPath.replace(/\\/g, "/"),
    localSha256: sha256Text(commandText.endsWith("\n") ? commandText : `${commandText}\n`),
    remoteSha256: sha256File(commandPath),
    bytes: fs.statSync(commandPath).size
  });
  const allRemoteVerified = copied.every((item) => item.localSha256 === item.remoteSha256);
  const manifest = {
    schema: "wave33c-real-free-agent-test-push-manifest.v1",
    generatedAt: new Date().toISOString(),
    bundleName,
    remoteRoot: remoteRoot.replace(/\\/g, "/"),
    allRemoteVerified,
    copied
  };
  writeJson(paths.pushManifest, manifest);
  const remoteManifest = path.join(remoteRoot, "push-manifest.json");
  fs.copyFileSync(paths.pushManifest, remoteManifest);
  manifest.localManifest = repoRel(paths.pushManifest);
  manifest.remoteManifest = remoteManifest.replace(/\\/g, "/");
  manifest.manifestSha256 = sha256File(paths.pushManifest);
  if (!allRemoteVerified) throw new Error(`Remote verification failed for ${bundleName}`);
  return manifest;
}

function formatReport(state) {
  return [
    "# Real Free Agent System Test Option A",
    "",
    `Generated: ${state.generatedAt}`,
    `Status: ${state.status}`,
    `State hash: ${state.stateHash}`,
    "",
    "## Packet",
    "",
    `- Questions: ${state.questionCount}`,
    `- Question packet: \`${state.questionPacket.path}\``,
    `- Push verified: ${state.push.allRemoteVerified}`,
    "",
    "## ACER Run Command",
    "",
    "```powershell",
    state.acerRunCommand.join("\n"),
    "```",
    "",
    "## Boundary",
    "",
    "- Research-input-only.",
    "- No canon mutation.",
    "- No authority-layer edit.",
    "- Runner prompt enforces no tools, no file edits, no fanout.",
    ""
  ].join("\n");
}

async function postLaw001(envelope) {
  return new Promise((resolve) => {
    const data = JSON.stringify(envelope);
    const url = new URL(lirisLaw001);
    const req = http.request({
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data)
      }
    }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, body }));
    });
    req.on("error", (error) => resolve({ ok: false, error: error.message }));
    req.setTimeout(8000, () => {
      req.destroy(new Error("timeout"));
    });
    req.write(data);
    req.end();
  });
}

async function notifyLiris(state) {
  const envelope = {
    schema: "law001-real-free-agent-system-test-option-a-acer-push.v1",
    id: `acer-real-free-agent-option-a-push-${Date.now()}`,
    ts: new Date().toISOString(),
    from: "acer",
    to: "liris",
    mode: "real",
    type: "gate-result",
    verb: "LAW001_REAL_FREE_AGENT_SYSTEM_TEST_OPTION_A_ACER_PUSH",
    sourceReceiptId,
    body: {
      status: state.status,
      stateHash: state.stateHash,
      questionPacket: state.questionPacket,
      push: state.push,
      acerRunCommand: state.acerRunCommand,
      boundary: state.boundary
    }
  };
  const result = await postLaw001(envelope);
  writeJson(paths.postResult, { envelope, result });
  return result;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has("--dry-run");
  const notify = args.has("--notify");
  const source = requireSourceEnvelope();
  const questionPacket = buildQuestionPacket(source);
  if (dryRun) {
    console.log(JSON.stringify({
      ok: true,
      dryRun: true,
      sourceReceiptId,
      questionCount: questionPacket.questions.length,
      questionIds: questionPacket.questions.map((question) => question.id),
      stateHash: questionPacket.stateHash
    }, null, 2));
    return;
  }
  const questionPacketArtifact = writeQuestionPacket(questionPacket);
  const push = pushToLiris();
  const generatedAt = new Date().toISOString();
  const acerRunCommand = [
    "$env:ASOLARIA_SUPERVISOR_RUN_ID='real-free-agent-system-test-acer-20260428'",
    "$env:ASOLARIA_SUPERVISOR_NAME='PROF-REAL-FREE-AGENT-SYSTEM-TEST'",
    "$env:ASOLARIA_SUPERVISOR_MODEL_POLICY='auto'",
    "$env:ASOLARIA_SUPERVISOR_COUNT='50'",
    "$env:ASOLARIA_SUPERVISOR_ROUNDS='1'",
    "$env:ASOLARIA_SUPERVISOR_CONCURRENCY='4'",
    "$env:ASOLARIA_SUPERVISOR_TIMEOUT_MS='120000'",
    "$env:ASOLARIA_SUPERVISOR_QUESTION_PACKET='data/behcs/orchestration/real-free-agent-system-test-20260428/real-free-agent-system-test-questions.v1.json'",
    "node tools/behcs/opencode-free-agent-supervisor-lane.js"
  ];
  const stateCore = {
    schema: "real-free-agent-system-test-option-a-acer.v1",
    generatedAt,
    status: "REAL_FREE_AGENT_SYSTEM_TEST_OPTION_A_PACKET_AND_LIRIS_PUSH_READY",
    sourceReceiptId,
    source: {
      inboxLine: source.inbox.line,
      inboxSha256: source.inbox.sha256,
      d0Line: source.d0.line,
      d0Sha256: source.d0.sha256
    },
    questionCount: questionPacket.questions.length,
    questionIds: questionPacket.questions.map((question) => question.id),
    questionPacket: questionPacketArtifact,
    push,
    acerRunCommand,
    boundary: questionPacket.boundary
  };
  const state = { ...stateCore, stateHash: sha256Json(stateCore) };
  writeJson(paths.state, state);
  writeJson(paths.reportJson, state);
  writeText(paths.reportMd, formatReport(state));
  const post = notify ? await notifyLiris(state) : { skipped: true };
  console.log(JSON.stringify({
    status: state.status,
    stateHash: state.stateHash,
    questionPacketSha256: questionPacketArtifact.sha256,
    pushVerified: push.allRemoteVerified,
    copied: push.copied.length,
    notify: post
  }, null, 2));
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exitCode = 1;
});
