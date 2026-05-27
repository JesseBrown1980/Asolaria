#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { spawn, spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..", "..");
const runId = process.env.ASOLARIA_SUPERVISOR_RUN_ID || "opencode-free-agents-supervisor-1000-20260427";
const eventId = "EVT-OPENCODE-FREE-AGENT-SUPERVISOR-LANE-2026-04-27";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", runId);

const requestedModel = String(process.env.ASOLARIA_SUPERVISOR_MODEL || "").trim();
const requestedModels = String(process.env.ASOLARIA_SUPERVISOR_MODELS || "").trim();
const modelPolicy = String(process.env.ASOLARIA_SUPERVISOR_MODEL_POLICY || (requestedModel || requestedModels ? "explicit" : "auto")).trim();
const supervisor = process.env.ASOLARIA_SUPERVISOR_NAME || "free-agent-supervisor";
const count = Number(process.env.ASOLARIA_SUPERVISOR_COUNT || 10);
const seqStart = Number(process.env.ASOLARIA_SUPERVISOR_SEQ_START || 1);
const timeoutMs = Number(process.env.ASOLARIA_SUPERVISOR_TIMEOUT_MS || 120000);
const rounds = Math.max(1, Number(process.env.ASOLARIA_SUPERVISOR_ROUNDS || 1));
const concurrency = Math.max(1, Number(process.env.ASOLARIA_SUPERVISOR_CONCURRENCY || 1));
const earlyTextExitMs = Math.max(0, Number(process.env.ASOLARIA_SUPERVISOR_EARLY_TEXT_EXIT_MS || 2500));
const questionPacketPath = process.env.ASOLARIA_SUPERVISOR_QUESTION_PACKET || "";

const modelPolicies = Object.freeze({
  "free-fast": [
    "opencode/minimax-m2.5-free",
    "opencode/ling-2.6-flash-free",
    "opencode/gpt-5-nano"
  ],
  "free-balanced": [
    "opencode/minimax-m2.5-free",
    "opencode/ling-2.6-flash-free",
    "opencode/hy3-preview-free",
    "opencode/nemotron-3-super-free",
    "opencode/gpt-5-nano"
  ],
  "free-deep": [
    "opencode/nemotron-3-super-free",
    "opencode/hy3-preview-free",
    "opencode/ling-2.6-flash-free",
    "opencode/minimax-m2.5-free",
    "opencode/big-pickle"
  ],
  "free-validator": [
    "opencode/big-pickle",
    "opencode/nemotron-3-super-free",
    "opencode/hy3-preview-free"
  ],
  "big-pickle-only": [
    "opencode/big-pickle"
  ]
});

const freeAgentAllowedModels = Object.freeze(Array.from(new Set([
  ...modelPolicies["free-fast"],
  ...modelPolicies["free-balanced"],
  ...modelPolicies["free-deep"],
  ...modelPolicies["free-validator"],
  "opencode/big-pickle"
])));

const lanes = Object.freeze([
  "preserve_route",
  "memory_index",
  "map_cube_glpj",
  "falcon_proxy",
  "liris_bridge",
  "dirty_worktree",
  "supervisor_pid",
  "hookwall",
  "gnn_reverse_gain",
  "white_room_gc",
  "mcp_policy",
  "energy_gate",
  "auth_truth",
  "device_pid",
  "termux_frontend",
  "timescale",
  "shannon",
  "hermes",
  "sentinel_kr",
  "report_proof"
]);

const outDir = path.join(runRoot, "supervisor-lanes");
const outRows = path.join(outDir, `${supervisor}.ndjson`);
const outSummary = path.join(outDir, `${supervisor}.summary.json`);

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeText(filePath, text) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, text.endsWith("\n") ? text : `${text}\n`, "utf8");
}

function appendText(filePath, text) {
  ensureDir(filePath);
  fs.appendFileSync(filePath, text.endsWith("\n") ? text : `${text}\n`, "utf8");
}

function writeJson(filePath, value) {
  writeText(filePath, JSON.stringify(value, null, 2));
}

function sha(value) {
  return crypto.createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex");
}

function pid(seed) {
  return `BH.AGENT.PID.${sha(seed).slice(0, 12).toUpperCase()}`;
}

function splitModels(value) {
  return String(value || "")
    .split(/[,\s;]+/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function resolveModelSet(options = {}) {
  const policy = String(options.modelPolicy || modelPolicy || "free-balanced").trim();
  const explicit = splitModels(options.requestedModels || requestedModels || requestedModel);
  const allowNonFree = options.allowNonFree === true || /^(1|true|yes|y|on)$/i.test(String(process.env.ASOLARIA_SUPERVISOR_ALLOW_NONFREE || ""));
  let models = [];
  if (policy === "explicit") {
    models = explicit.length ? explicit : ["opencode/minimax-m2.5-free"];
  } else if (policy === "auto") {
    models = [
      ...modelPolicies["free-fast"],
      ...modelPolicies["free-balanced"],
      ...modelPolicies["free-deep"],
      ...modelPolicies["free-validator"]
    ];
  } else if (modelPolicies[policy]) {
    models = modelPolicies[policy];
  } else {
    throw new Error(`Unknown ASOLARIA_SUPERVISOR_MODEL_POLICY '${policy}'. Use auto, explicit, free-fast, free-balanced, free-deep, free-validator, or big-pickle-only.`);
  }
  const unique = Array.from(new Set(models));
  const blocked = unique.filter((item) => !freeAgentAllowedModels.includes(item));
  if (blocked.length && !allowNonFree) {
    throw new Error(`Model(s) outside free-agent allowlist require ASOLARIA_SUPERVISOR_ALLOW_NONFREE=1: ${blocked.join(", ")}`);
  }
  return unique;
}

function modelPolicyForWorkItem(workItem) {
  const questionId = String(workItem?.question?.id || "").toLowerCase();
  const evidenceClass = String(workItem?.question?.evidenceClass || "").toLowerCase();
  const lane = String(lanes[(Number(workItem?.globalSeq || 1) - 1) % lanes.length] || "").toLowerCase();
  if (/latency|roundtrip|http|probe|timescale/.test(`${questionId} ${evidenceClass} ${lane}`)) {
    return "free-fast";
  }
  if (/inbox|classification|sample|gc/.test(`${questionId} ${evidenceClass}`)) {
    return "free-balanced";
  }
  if (/quorum|supervisor|sealed|d11|drift|boundary/.test(`${questionId} ${evidenceClass}`)) {
    return "free-deep";
  }
  return "free-balanced";
}

function selectModelForWorkItem(workItem, options = {}) {
  const policy = String(options.modelPolicy || modelPolicy || "auto").trim();
  const models = Array.isArray(options.models) && options.models.length
    ? options.models
    : resolveModelSet({
      ...options,
      modelPolicy: policy === "auto" ? modelPolicyForWorkItem(workItem) : policy
    });
  const supervisorSlot = Math.max(1, Number(workItem?.supervisorIndex || workItem?.localIndex || workItem?.globalSeq || 1));
  const roundSlot = Math.max(1, Number(workItem?.round || 1));
  const index = (supervisorSlot - 1 + roundSlot - 1) % models.length;
  return models[index];
}

function readJsonIfExists(filePath) {
  if (!filePath) return null;
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    return {
      __readError: String(error && error.message ? error.message : error)
    };
  }
}

function normalizeQuestions(packet) {
  const raw = Array.isArray(packet?.questions)
    ? packet.questions
    : Array.isArray(packet?.proposed_question_set_4_system_self_knowledge)
      ? packet.proposed_question_set_4_system_self_knowledge
      : Array.isArray(packet?.questionSet)
        ? packet.questionSet
        : [];
  return raw.map((item, index) => ({
    id: String(item?.id || `question-${index + 1}`).trim(),
    question: String(item?.question || item?.text || item?.prompt || "").trim(),
    evidenceClass: String(item?.evidence_class || item?.evidenceClass || "").trim(),
    cube: item?.cube ?? null
  })).filter((item) => item.id && item.question);
}

function loadQuestionPacket() {
  const packet = readJsonIfExists(questionPacketPath);
  const questions = normalizeQuestions(packet);
  return {
    path: questionPacketPath,
    packet,
    questions,
    questionPacketSha256: packet && !packet.__readError ? sha(packet) : "",
    readError: packet?.__readError || ""
  };
}

function buildWorkItems(options = {}) {
  const supervisorCount = Number(options.count || count);
  const start = Number(options.seqStart || seqStart);
  const runRounds = Math.max(1, Number(options.rounds || rounds));
  const questions = Array.isArray(options.questions) ? options.questions : [];
  const items = [];
  if (questions.length < 1) {
    for (let localIndex = 1; localIndex <= supervisorCount; localIndex += 1) {
      const globalSeq = start + localIndex - 1;
      items.push({
        localIndex,
        workItemId: `generic:${globalSeq}`,
        globalSeq,
        supervisorIndex: localIndex,
        round: 1,
        questionIndex: 0,
        question: null
      });
    }
    return items;
  }
  let localIndex = 0;
  for (let round = 1; round <= runRounds; round += 1) {
    for (const question of questions) {
      const questionIndex = questions.indexOf(question) + 1;
      for (let supervisorIndex = 1; supervisorIndex <= supervisorCount; supervisorIndex += 1) {
        localIndex += 1;
        const globalSeq = start + localIndex - 1;
        items.push({
          localIndex,
          workItemId: `q:${question.id}:r${round}:s${supervisorIndex}`,
          globalSeq,
          supervisorIndex,
          round,
          questionIndex,
          question
        });
      }
    }
  }
  return items;
}

function parseEvents(stdout) {
  const events = [];
  for (const line of String(stdout || "").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      events.push(JSON.parse(trimmed));
    } catch (_error) {
      // Preserve stdout hash below.
    }
  }
  return events;
}

function extractText(events) {
  return events
    .filter((event) => event.type === "text")
    .map((event) => event.part?.text || event.text || "")
    .join("\n")
    .trim();
}

function hasFinishedText(stdout) {
  const events = parseEvents(stdout);
  const text = extractText(events);
  return {
    events,
    text,
    finish: events.find((event) => event.type === "step_finish") || null,
    ready: text.length > 0 && events.some((event) => event.type === "step_finish")
  };
}

function buildPrompt(workItem) {
  const lane = lanes[(workItem.globalSeq - 1) % lanes.length];
  const selectedModel = selectModelForWorkItem(workItem);
  const agentPid = pid(`${eventId}:${supervisor}:${selectedModel}:${workItem.globalSeq}:${workItem.workItemId || ""}`);
  const lines = [
    `BEHCS-256 LX-SPAWN-FREE supervisor lane ${supervisor}.`,
    `PID=${agentPid}.`,
    `ModelPolicy=${modelPolicy}.`,
    `SelectedModel=${selectedModel}.`,
    `GlobalSeq=${workItem.globalSeq}.`,
    `SupervisorIndex=${workItem.supervisorIndex || workItem.localIndex}.`,
    `Round=${workItem.round || 1}.`,
    `Lane=${lane}.`
  ];
  if (workItem.question) {
    lines.push(`QuestionId=${workItem.question.id}.`);
    lines.push(`EvidenceClass=${workItem.question.evidenceClass || "unspecified"}.`);
    if (workItem.question.cube !== null && workItem.question.cube !== undefined) {
      lines.push(`Cube=${workItem.question.cube}.`);
    }
    lines.push(`Question: ${workItem.question.question}`);
    lines.push("Return compact JSON keys status,questionId,observed,assumed,confidence,evidencePointers,risks,nextAction,supervisor.");
    lines.push("Be honest about unknowns. Distinguish observed evidence from assumption. Do not claim sealed proof unless the prompt provides a pointer.");
  } else {
    lines.push("Return compact JSON keys status,lane,finding,action,supervisor.");
  }
  lines.push("No tools. No file edits. No fanout. Preserve evidence.");
  return {
    lane,
    agentPid,
    selectedModel,
    prompt: lines.join(" ")
  };
}

function readRows() {
  if (!fs.existsSync(outRows)) return [];
  return fs.readFileSync(outRows, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function runOne(workItem, generatedAt, questionPacket) {
  const { lane, agentPid, selectedModel, prompt } = buildPrompt(workItem);
  const started = Date.now();
  const result = spawnSync("opencode", [
    "run",
    "--format",
    "json",
    "-m",
    selectedModel,
    "--dir",
    repoRoot,
    prompt
  ], {
    cwd: repoRoot,
    encoding: "utf8",
    timeout: timeoutMs,
    windowsHide: true,
    shell: true,
    env: {
      ...process.env,
      BROWN_HILBERT_PID: agentPid,
      BEHCS256_GLYPH: "LX-SPAWN-FREE",
      ASOLARIA_FREE_AGENT_POLICY: "PRESERVE_ROUTE_NOT_QUARANTINE",
      ASOLARIA_BOUNDARY: "NO_FILE_EDITS_NO_TOOLS_NO_FANOUT"
    }
  });
  const events = parseEvents(result.stdout);
  const text = extractText(events);
  const finish = events.find((event) => event.type === "step_finish");
  return {
    localIndex: workItem.localIndex,
    workItemId: workItem.workItemId || `generic:${workItem.globalSeq}`,
    globalSeq: workItem.globalSeq,
    supervisorIndex: workItem.supervisorIndex || workItem.localIndex,
    round: workItem.round || 1,
    questionIndex: workItem.questionIndex || 0,
    questionId: workItem.question?.id || "",
    question: workItem.question?.question || "",
    evidenceClass: workItem.question?.evidenceClass || "",
    cube: workItem.question?.cube ?? null,
    ts: generatedAt,
    runId,
    eventId,
    supervisor,
    model: selectedModel,
    modelPolicy,
    lane,
    pid: agentPid,
    questionPacketPath,
    questionPacketSha256: questionPacket?.questionPacketSha256 || "",
    ok: result.status === 0 && text.length > 0,
    exitCode: result.status,
    signal: result.signal,
    timedOut: Boolean(result.error && result.error.code === "ETIMEDOUT"),
    elapsedMs: Date.now() - started,
    responseText: text.slice(0, 1200),
    responseSha256: sha(text || ""),
    eventCount: events.length,
    tokens: finish?.part?.tokens || null,
    cost: typeof finish?.part?.cost === "number" ? finish.part.cost : null,
    stdoutSha256: sha(result.stdout || ""),
    stderr: String(result.stderr || "").slice(0, 1200),
    error: result.error ? String(result.error.message || result.error).slice(0, 1000) : "",
    boundary: "Supervisor-owned real OpenCode free-agent call; no tools, no file edits, no fanout."
  };
}

function runOneAsync(workItem, generatedAt, questionPacket) {
  return new Promise((resolve) => {
    const { lane, agentPid, selectedModel, prompt } = buildPrompt(workItem);
    const started = Date.now();
    let earlyTextExit = false;
    let earlyExitTimer = null;
    const child = spawn("opencode", [
      "run",
      "--format",
      "json",
      "-m",
      selectedModel,
      "--dir",
      repoRoot,
      prompt
    ], {
      cwd: repoRoot,
      windowsHide: true,
      shell: true,
      env: {
        ...process.env,
        BROWN_HILBERT_PID: agentPid,
        BEHCS256_GLYPH: "LX-SPAWN-FREE",
        ASOLARIA_FREE_AGENT_POLICY: "PRESERVE_ROUTE_NOT_QUARANTINE",
        ASOLARIA_BOUNDARY: "NO_FILE_EDITS_NO_TOOLS_NO_FANOUT"
      }
    });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      try {
        child.kill("SIGTERM");
      } catch (_error) {
        // Best effort.
      }
    }, timeoutMs);
    const maybeScheduleEarlyExit = () => {
      if (earlyTextExitMs < 1 || earlyExitTimer) return;
      const parsed = hasFinishedText(stdout);
      if (!parsed.ready) return;
      earlyExitTimer = setTimeout(() => {
        earlyTextExit = true;
        try {
          child.kill("SIGTERM");
        } catch (_error) {
          // Best effort.
        }
      }, earlyTextExitMs);
    };
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
      maybeScheduleEarlyExit();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      if (earlyExitTimer) clearTimeout(earlyExitTimer);
      const events = parseEvents(stdout);
      const text = extractText(events);
      const finish = events.find((event) => event.type === "step_finish");
      resolve({
        localIndex: workItem.localIndex,
        workItemId: workItem.workItemId || `generic:${workItem.globalSeq}`,
        globalSeq: workItem.globalSeq,
        supervisorIndex: workItem.supervisorIndex || workItem.localIndex,
        round: workItem.round || 1,
        questionIndex: workItem.questionIndex || 0,
        questionId: workItem.question?.id || "",
        question: workItem.question?.question || "",
        evidenceClass: workItem.question?.evidenceClass || "",
        cube: workItem.question?.cube ?? null,
        ts: generatedAt,
        runId,
        eventId,
        supervisor,
        model: selectedModel,
        modelPolicy,
        lane,
        pid: agentPid,
        questionPacketPath,
        questionPacketSha256: questionPacket?.questionPacketSha256 || "",
        ok: text.length > 0 && Boolean(finish),
        exitCode: null,
        signal: null,
        timedOut,
        earlyTextExit,
        elapsedMs: Date.now() - started,
        responseText: text.slice(0, 1200),
        responseSha256: sha(text || ""),
        eventCount: events.length,
        tokens: finish?.part?.tokens || null,
        cost: typeof finish?.part?.cost === "number" ? finish.part.cost : null,
        stdoutSha256: sha(stdout || ""),
        stderr: String(stderr || "").slice(0, 1200),
        error: String(error && error.message ? error.message : error).slice(0, 1000),
        boundary: "Supervisor-owned real OpenCode free-agent call; no tools, no file edits, no fanout."
      });
    });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      if (earlyExitTimer) clearTimeout(earlyExitTimer);
      const events = parseEvents(stdout);
      const text = extractText(events);
      const finish = events.find((event) => event.type === "step_finish");
      const evidenceComplete = text.length > 0 && Boolean(finish);
      resolve({
        localIndex: workItem.localIndex,
        workItemId: workItem.workItemId || `generic:${workItem.globalSeq}`,
        globalSeq: workItem.globalSeq,
        supervisorIndex: workItem.supervisorIndex || workItem.localIndex,
        round: workItem.round || 1,
        questionIndex: workItem.questionIndex || 0,
        questionId: workItem.question?.id || "",
        question: workItem.question?.question || "",
        evidenceClass: workItem.question?.evidenceClass || "",
        cube: workItem.question?.cube ?? null,
        ts: generatedAt,
        runId,
        eventId,
        supervisor,
        model: selectedModel,
        modelPolicy,
        lane,
        pid: agentPid,
        questionPacketPath,
        questionPacketSha256: questionPacket?.questionPacketSha256 || "",
        ok: (code === 0 && text.length > 0) || (earlyTextExit && evidenceComplete) || (timedOut && evidenceComplete),
        exitCode: code,
        signal,
        timedOut,
        earlyTextExit,
        elapsedMs: Date.now() - started,
        responseText: text.slice(0, 1200),
        responseSha256: sha(text || ""),
        eventCount: events.length,
        tokens: finish?.part?.tokens || null,
        cost: typeof finish?.part?.cost === "number" ? finish.part.cost : null,
        stdoutSha256: sha(stdout || ""),
        stderr: String(stderr || "").slice(0, 1200),
        error: timedOut && !evidenceComplete ? "timeout" : earlyTextExit ? "early_text_exit_after_step_finish" : "",
        boundary: "Supervisor-owned real OpenCode free-agent call; no tools, no file edits, no fanout."
      });
    });
  });
}

function summarize(generatedAt, rows) {
  const questionPacket = loadQuestionPacket();
  const models = resolveModelSet();
  const modelCounts = {};
  const modelOkCounts = {};
  const modelTimeoutCounts = {};
  const modelHardTimeoutCounts = {};
  for (const row of rows) {
    if (!row.model) continue;
    modelCounts[row.model] = (modelCounts[row.model] || 0) + 1;
    if (row.ok) modelOkCounts[row.model] = (modelOkCounts[row.model] || 0) + 1;
    if (row.timedOut) modelTimeoutCounts[row.model] = (modelTimeoutCounts[row.model] || 0) + 1;
    if (row.timedOut && !row.ok) modelHardTimeoutCounts[row.model] = (modelHardTimeoutCounts[row.model] || 0) + 1;
  }
  const acceptedAfterTimeoutCount = rows.filter((row) => row.ok && row.timedOut).length;
  const hardTimeoutCount = rows.filter((row) => row.timedOut && !row.ok).length;
  return {
    id: "opencode-free-agent-supervisor-lane-summary.v1",
    generatedAt,
    runId,
    eventId,
    supervisor,
    modelPolicy,
    models,
    count,
    seqStart,
    rounds,
    concurrency,
    earlyTextExitMs,
    questionPacketPath,
    questionPacketSha256: questionPacket.questionPacketSha256,
    questionCount: questionPacket.questions.length,
    questionPacketReadError: questionPacket.readError,
    attempted: rows.length,
    okCount: rows.filter((row) => row.ok).length,
    failCount: rows.filter((row) => !row.ok).length,
    timedOutCount: rows.filter((row) => row.timedOut).length,
    acceptedAfterTimeoutCount,
    hardTimeoutCount,
    totalCost: rows.reduce((sum, row) => sum + (typeof row.cost === "number" ? row.cost : 0), 0),
    totalTokens: rows.reduce((sum, row) => sum + (row.tokens?.total || 0), 0),
    modelCounts,
    modelOkCounts,
    modelTimeoutCounts,
    modelHardTimeoutCounts,
    boundary: "Supervisor lane only; append-only row evidence."
  };
}

function logRow(row, total) {
  const cost = row.cost === null ? "null" : String(row.cost);
  console.log(`${row.ok ? "OK" : "FAIL"} ${supervisor} ${String(row.localIndex).padStart(3, "0")}/${total} global=${row.globalSeq} q=${row.questionId || "none"} model=${row.model || "unknown"} ms=${row.elapsedMs} cost=${cost}`);
}

async function main() {
  const generatedAt = new Date().toISOString();
  const questionPacket = loadQuestionPacket();
  if (questionPacket.readError) {
    throw new Error(`Failed to read question packet ${questionPacketPath}: ${questionPacket.readError}`);
  }
  const workItems = buildWorkItems({ questions: questionPacket.questions });
  fs.mkdirSync(outDir, { recursive: true });
  const existing = readRows();
  const done = new Set(existing.map((row) => row.workItemId || `legacy-local:${row.localIndex}`));
  const rows = [...existing];
  let nextIndex = 0;
  async function workerLoop() {
    while (nextIndex < workItems.length) {
      const workItem = workItems[nextIndex];
      nextIndex += 1;
      if (done.has(workItem.workItemId || `legacy-local:${workItem.localIndex}`)) continue;
      const row = concurrency > 1
        ? await runOneAsync(workItem, generatedAt, questionPacket)
        : runOne(workItem, generatedAt, questionPacket);
      rows.push(row);
      appendText(outRows, JSON.stringify(row));
      writeJson(outSummary, summarize(generatedAt, rows));
      logRow(row, workItems.length);
    }
  }
  const workerCount = Math.min(concurrency, Math.max(1, workItems.length));
  await Promise.all(Array.from({ length: workerCount }, () => workerLoop()));
  const summary = summarize(generatedAt, rows);
  writeJson(outSummary, summary);
  console.log(JSON.stringify(summary, null, 2));
}

if (require.main === module) {
  main();
}

module.exports = {
  modelPolicies,
  freeAgentAllowedModels,
  resolveModelSet,
  modelPolicyForWorkItem,
  selectModelForWorkItem,
  hasFinishedText,
  normalizeQuestions,
  buildWorkItems,
  buildPrompt,
  loadQuestionPacket,
  summarize
};
