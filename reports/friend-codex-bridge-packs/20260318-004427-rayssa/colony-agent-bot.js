#!/usr/bin/env node
"use strict";

/*
  relay-bot

  Purpose:
    - Poll a relay room continuously.
    - If a message addresses the configured lane alias, ACK quickly and auto-reply using `codex exec`.
    - Send a heartbeat/ping at least every N minutes so connectivity issues surface quickly.
    - Optionally load a no-secrets agent profile via `--profile`.

  Example:
    node colony-agent-bot.js --url http://127.0.0.1:8788 --token <TOKEN> --room asolaria_bridge
    node colony-agent-bot.js --profile .\profiles\friend-codex.profile.json
*/

const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { URL } = require("url");

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) {
      out._.push(a);
      continue;
    }
    const eq = a.indexOf("=");
    if (eq !== -1) {
      out[a.slice(2, eq)] = a.slice(eq + 1);
      continue;
    }
    const k = a.slice(2);
    const v = argv[i + 1];
    if (v == null || v.startsWith("--")) {
      out[k] = true;
      continue;
    }
    out[k] = v;
    i++;
  }
  return out;
}

function nowIso() {
  return new Date().toISOString();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function readTextFile(p) {
  try {
    return fs.readFileSync(p, "utf8").trim();
  } catch {
    return "";
  }
}

function readJsonFile(p) {
  try {
    const raw = fs.readFileSync(p, "utf8").replace(/^\uFEFF/, "");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function readFirstEnv(names = []) {
  for (const rawName of Array.isArray(names) ? names : []) {
    const name = String(rawName || "").trim();
    if (!name) continue;
    const value = process.env[name];
    if (value !== undefined && String(value).trim()) {
      return String(value);
    }
  }
  return "";
}

function parseCsvList(raw) {
  return String(raw || "")
    .split(/[,\r\n]+/g)
    .map((s) => String(s || "").trim())
    .filter(Boolean);
}

function normalizeTaskPrefixes(values = []) {
  const items = Array.isArray(values) ? values : parseCsvList(values);
  const out = [];
  for (const item of items) {
    const raw = String(item || "").trim().toUpperCase();
    if (!raw) continue;
    let normalized = raw.replace(/\s+/g, "_");
    if (!normalized.endsWith(":")) {
      normalized += ":";
    }
    out.push(normalized);
  }
  return Array.from(new Set(out));
}

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildActionablePattern(prefixes = []) {
  const normalized = normalizeTaskPrefixes(prefixes);
  if (!normalized.length) {
    return /\b(TASK(?:_EXECUTE|_SHELL)?|QUESTION):/;
  }
  const extended = new Set(normalized);
  for (const prefix of normalized) {
    if (prefix === "TASK:") {
      extended.add("TASK_EXECUTE:");
      extended.add("TASK_SHELL:");
    }
  }
  const body = Array.from(extended).map((item) => escapeRegex(item)).join("|");
  return new RegExp(`\\b(?:${body})`);
}

function clipText(s, max) {
  const t = String(s || "");
  const limit = Math.max(120, Number(max) || 0);
  if (t.length <= limit) return t;
  return `${t.slice(0, limit - 1)}…`;
}

function readCursor(cursorPath) {
  try {
    const s = fs.readFileSync(cursorPath, "utf8");
    const v = Number(JSON.parse(s)?.after ?? 0);
    return Number.isFinite(v) ? v : 0;
  } catch {
    return 0;
  }
}

function writeCursor(cursorPath, after) {
  const dir = path.dirname(cursorPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(cursorPath, JSON.stringify({ after }, null, 2) + "\n", "utf8");
}

async function fetchMessages({ url, token, room, after, max }) {
  const base = new URL(url);
  const endpoint = new URL(`/rooms/${encodeURIComponent(room)}/messages`, base);
  endpoint.searchParams.set("after", String(after || 0));
  endpoint.searchParams.set("max", String(max || 100));

  const res = await fetch(endpoint, {
    method: "GET",
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    const msg = typeof data?.error === "string" ? data.error : "request_failed";
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  const messages = Array.isArray(data.messages) ? data.messages : [];
  const nextAfter = Number.isFinite(data.nextAfter) ? data.nextAfter : after;
  return { messages, nextAfter };
}

async function postMessage({ url, token, room, from, text, senderToken }) {
  const base = new URL(url);
  const endpoint = new URL(`/rooms/${encodeURIComponent(room)}/messages`, base);
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : null),
      ...(senderToken ? { "x-bridge-sender-token": senderToken } : null),
    },
    body: JSON.stringify({ from, text }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    const msg = typeof data?.error === "string" ? data.error : "request_failed";
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data.message;
}

function extractThread(text) {
  const m = String(text || "").match(/#thread:([^\s]+)/);
  return m ? m[1] : null;
}

function startsWithAny(s, prefixes) {
  const t = String(s || "").trimStart();
  return prefixes.some((p) => t.startsWith(p));
}

function normalizeHandle(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";
  return raw.startsWith("@") ? raw : `@${raw}`;
}

function canonicalAgentId(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";
  return raw.startsWith("@") ? raw.slice(1) : raw;
}

function parseMentionAliases(raw, fallbackFrom) {
  const source = String(raw || "").trim() || String(fallbackFrom || "");
  const aliases = source
    .split(/[,\s]+/g)
    .map((s) => normalizeHandle(s))
    .filter(Boolean);
  return Array.from(new Set(aliases));
}

function textMentionsAny(text, aliases) {
  const body = String(text || "").toLowerCase();
  return aliases.some((a) => body.includes(String(a || "").toLowerCase()));
}

function extractTaskShellCommand(text) {
  const raw = String(text || "");
  const m = raw.match(/\bTASK_SHELL:\s*([\s\S]+)$/i);
  if (!m) return "";
  return String(m[1] || "").trim();
}

function escapePowerShellSingleQuoted(value) {
  return String(value || "").replace(/'/g, "''");
}

function extractActionableTask(text, mentionAliases = []) {
  const raw = String(text || "");
  if (!raw.trim()) return "";
  const lines = raw.split(/\r?\n/);
  const firstLine = String(lines[0] || "");

  let cleanedFirstLine = firstLine
    .replace(/#thread:[^\s]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  for (const alias of Array.isArray(mentionAliases) ? mentionAliases : []) {
    const normalized = normalizeHandle(alias).replace(/^@/, "");
    if (!normalized) continue;
    const re = new RegExp(`(^|\\s)@?${escapeRegex(normalized)}(?=\\s|$)`, "ig");
    cleanedFirstLine = cleanedFirstLine.replace(re, " ").replace(/\s+/g, " ").trim();
  }

  const actionablePrefixes = [
    "TASK_EXECUTE:",
    "TASK_SHELL:",
    "TASK:",
    "QUESTION:",
    "NOTE:",
  ];

  let extracted = "";
  for (const prefix of actionablePrefixes) {
    const idx = cleanedFirstLine.toUpperCase().indexOf(prefix);
    if (idx !== -1) {
      extracted = cleanedFirstLine.slice(idx + prefix.length).trim();
      break;
    }
  }

  const remainder = lines.slice(1).join("\n").trim();
  return [extracted, remainder].filter(Boolean).join("\n").trim();
}

function isBoilerplateReply(text) {
  const raw = String(text || "").trim().toLowerCase();
  if (!raw) return true;
  return [
    /ready\./,
    /ready for the task/,
    /ready for the relay/,
    /awaiting the next relay message/,
    /send the supervisor/,
    /send the next message/,
    /send the next instruction/,
    /understood\.\s*i[’']?ll reply/,
  ].some((pattern) => pattern.test(raw));
}

async function runPowerShellCommand(command, timeoutMs = 120000) {
  const cmd = String(command || "").trim();
  if (!cmd) {
    return { ok: false, code: -1, output: "", error: "empty_command" };
  }
  return new Promise((resolve) => {
    const child = spawn(
      "powershell.exe",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", cmd],
      { windowsHide: true }
    );
    let stdout = "";
    let stderr = "";
    let finished = false;
    let timer = null;

    const done = (result) => {
      if (finished) return;
      finished = true;
      if (timer) {
        clearTimeout(timer);
      }
      resolve(result);
    };

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (err) => {
      done({
        ok: false,
        code: -1,
        output: stdout.trim(),
        error: String(err?.message || err || "spawn_error").trim(),
      });
    });
    child.on("close", (code) => {
      const merged = [stdout.trim(), stderr.trim()].filter(Boolean).join("\n");
      done({
        ok: code === 0,
        code: Number.isFinite(code) ? code : -1,
        output: merged,
        error: "",
      });
    });

    timer = setTimeout(() => {
      try {
        child.kill("SIGKILL");
      } catch {
        // best effort
      }
      done({
        ok: false,
        code: -1,
        output: [stdout.trim(), stderr.trim()].filter(Boolean).join("\n"),
        error: "timeout",
      });
    }, Math.max(5_000, Number(timeoutMs) || 120000));
  });
}

function normalizeChoice(value, allowed, fallback) {
  const raw = String(value || "").trim().toLowerCase();
  return allowed.includes(raw) ? raw : fallback;
}

function toBoolFlag(value, fallback = false) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  const raw = String(value).trim().toLowerCase();
  return !["0", "false", "off", "no"].includes(raw);
}

function normalizeExecutionRunner(value, fallback = "codex_cli") {
  const raw = String(value || "").trim().toLowerCase();
  return raw === "asolaria_brain" ? raw : fallback;
}

function normalizeProviderOrder(value) {
  const source = Array.isArray(value) ? value : parseCsvList(value);
  const out = [];
  const seen = new Set();
  for (const item of source) {
    const normalized = String(item || "").trim().toLowerCase();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}

function buildExecutionConfig(profileExecution = {}) {
  const source = profileExecution && typeof profileExecution === "object" ? profileExecution : {};
  const providerOrder = normalizeProviderOrder(
    source.providerOrder || source.providers || source.provider || ""
  );
  const sandbox = normalizeChoice(
    source.sandbox,
    ["read-only", "workspace-write", "danger-full-access"],
    ""
  );
  const reasoningEffort = normalizeChoice(
    source.reasoningEffort || source.modelReasoningEffort,
    ["minimal", "low", "medium", "high", "xhigh"],
    ""
  );
  const askForApproval = normalizeChoice(
    source.askForApproval || source.approvalMode,
    ["untrusted", "on-failure", "on-request", "never"],
    ""
  );
  return {
    runner: normalizeExecutionRunner(source.runner || source.mode || source.type || "", "codex_cli"),
    label: String(source.label || source.description || "").trim(),
    apiBaseUrl: String(source.apiBaseUrl || source.baseUrl || process.env.ASOLARIA_API_BASE_URL || "http://127.0.0.1:4781").trim(),
    providerOrder,
    disableFallback: source.disableFallback === undefined ? null : Boolean(source.disableFallback),
    internalOnly: source.internalOnly === undefined ? null : Boolean(source.internalOnly),
    sandbox,
    reasoningEffort,
    askForApproval,
    timeoutMs: Math.max(15_000, Number(source.timeoutMs || 180_000) || 180_000),
    expectedModel: String(source.expectedModel || source.model || source.modelHint || "").trim(),
    codexWebSearch: source.codexWebSearch === undefined ? null : Boolean(source.codexWebSearch)
  };
}

function stripLeadingResultLabel(value) {
  return String(value || "").replace(/^\s*RESULT:\s*/i, "").trim();
}

function buildRelayAgentPrompt({
  messageText,
  from = "",
  agentName = "",
  enableTaskExecution = true,
  mentionAliases = [],
  strictMode = false
}) {
  const firstLine = String(messageText || "").split(/\r?\n/)[0] || "";
  const taskRequested = enableTaskExecution && /\bTASK(?:_EXECUTE)?:/i.test(firstLine);
  const transportLabel = String(from || "").trim() || "relay-agent";
  const identityLabel = String(agentName || "").trim() || transportLabel;
  const actionableTask = extractActionableTask(messageText, mentionAliases);
  const effectiveTask = actionableTask || String(messageText || "").trim();
  const directnessBlock = strictMode
    ? [
        "Your previous draft was too generic.",
        "Answer the extracted task directly now.",
        "Do not say you are ready, waiting, or ask for the task again.",
      ]
    : [
        "Answer the extracted task directly.",
        "Do not say you are ready, waiting, or ask for the task again.",
      ];

  const concisePrompt = [
    `You are ${identityLabel} replying inside a relay room between multiple Codex instances.`,
    `Your transport sender id is ${transportLabel}.`,
    "Write a concise, actionable reply to the extracted task below.",
    "Constraints:",
    "- Plain text only (no markdown).",
    "- 12 lines max.",
    "- If mentioning ~/.codex/config.toml, use TOML single quotes like approval_policy = 'never'.",
    "- Do not tell the user to paste long logs; ask for 1 key detail if blocked.",
    ...directnessBlock,
    "",
    "Extracted task:",
    effectiveTask,
    "",
    "Original relay message:",
    messageText
  ].join("\n");

  const taskPrompt = [
    `You are ${identityLabel} in a relay room. A supervisor asked you to execute a task.`,
    `Your transport sender id is ${transportLabel}.`,
    "Execute the extracted checks/actions using available tools immediately.",
    "Do not reply with role-play acknowledgements.",
    "Do not say you are ready or ask for the task again.",
    "Reply in plain text with this exact shape:",
    "RESULT:",
    "- findings: ...",
    "- files_changed: [...]",
    "- commands_run: [...]",
    "- blockers: [...]",
    "",
    "Extracted task:",
    effectiveTask,
    "",
    "Original relay message:",
    messageText,
  ].join("\n");

  return {
    prompt: taskRequested ? taskPrompt : concisePrompt,
    taskRequested,
    effectiveTask
  };
}

async function requestJson(url, options = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(1000, Number(timeoutMs) || 30000));
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }
    if (!response.ok) {
      const message = typeof data?.error === "string"
        ? data.error
        : typeof data?.message === "string"
          ? data.message
          : text || `http_${response.status}`;
      const error = new Error(String(message || "request_failed"));
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

async function waitForAsolariaJob({
  apiBaseUrl,
  jobId,
  timeoutMs = 180000,
  pollMs = 1000,
  perRequestTimeoutMs = 20000
}) {
  const base = new URL(apiBaseUrl);
  const startedAt = Date.now();
  const deadline = startedAt + Math.max(15_000, Number(timeoutMs) || 180000);
  const requestTimeoutMs = Math.max(
    5000,
    Number(perRequestTimeoutMs) || Math.max(15_000, (Number(pollMs) || 1000) * 8)
  );
  while (Date.now() <= deadline) {
    const endpoint = new URL(`/api/jobs/${encodeURIComponent(jobId)}`, base);
    let payload = null;
    try {
      payload = await requestJson(endpoint.toString(), { method: "GET" }, requestTimeoutMs);
    } catch (error) {
      const message = String(error?.message || error || "").trim().toLowerCase();
      const transientAbort = error?.name === "AbortError" || message.includes("aborted") || message.includes("timeout");
      const transientServer = Number(error?.status || 0) >= 500;
      if (Date.now() < deadline && (transientAbort || transientServer)) {
        await sleep(Math.max(400, Number(pollMs) || 1000));
        continue;
      }
      throw error;
    }
    const job = payload && typeof payload.job === "object" ? payload.job : null;
    if (!job) {
      throw new Error(`Asolaria job ${jobId} returned no job payload.`);
    }
    const status = String(job.status || "").trim().toLowerCase();
    if (status === "completed") {
      return job;
    }
    if (status === "failed" || status === "error" || status === "canceled") {
      const errorText = String(job.error || job.result?.error || `${jobId} failed`).trim();
      const error = new Error(errorText || `${jobId} failed`);
      error.job = job;
      throw error;
    }
    await sleep(Math.max(400, Number(pollMs) || 1000));
  }
  throw new Error(`Timed out waiting for Asolaria job ${jobId}.`);
}

async function runAsolariaBrainReply({
  promptInfo,
  sandbox = "read-only",
  executionConfig = {}
}) {
  const prompt = String(promptInfo?.prompt || "").trim();
  if (!prompt) {
    throw new Error("empty_prompt");
  }
  const base = new URL(String(executionConfig.apiBaseUrl || "http://127.0.0.1:4781").trim());
  const endpoint = new URL("/api/providers/brain/run", base);
  const executionProfile = {};
  if (executionConfig.providerOrder.length > 0) {
    executionProfile.providerOrder = executionConfig.providerOrder.slice(0, 8);
  }
  if (executionConfig.disableFallback !== null) {
    executionProfile.disableFallback = Boolean(executionConfig.disableFallback);
  }
  if (executionConfig.internalOnly !== null) {
    executionProfile.internalOnly = Boolean(executionConfig.internalOnly);
  }
  if (executionConfig.codexWebSearch !== null) {
    executionProfile.codexWebSearch = Boolean(executionConfig.codexWebSearch);
  }

  const effectiveSandbox = executionConfig.sandbox || sandbox || "read-only";
  const codexOptions = {
    sandbox: effectiveSandbox,
    askForApproval: executionConfig.askForApproval || "never"
  };

  const queued = await requestJson(endpoint.toString(), {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      prompt,
      executionProfile,
      codexOptions
    })
  }, Math.min(30_000, executionConfig.timeoutMs));

  const jobId = String(queued?.job?.id || "").trim();
  if (!jobId) {
    throw new Error("Asolaria brain route returned no job id.");
  }
  const job = await waitForAsolariaJob({
    apiBaseUrl: base.toString(),
    jobId,
    timeoutMs: executionConfig.timeoutMs,
    pollMs: 1200,
    perRequestTimeoutMs: Math.max(
      15_000,
      Math.min(30_000, Math.round((Number(executionConfig.timeoutMs || 180000) || 180000) / 8))
    )
  });
  const result = job && typeof job.result === "object" ? job.result : {};
  const reply = stripLeadingResultLabel(result.reply || "");
  if (!reply) {
    throw new Error(`Asolaria brain job ${jobId} completed without reply text.`);
  }
  return {
    reply,
    provider: String(result.provider || executionConfig.providerOrder[0] || "brain").trim().toLowerCase(),
    model: String(result.model || result.resolvedModel || executionConfig.expectedModel || "").trim(),
    route: "asolaria_brain",
    status: String(job.status || "completed").trim().toLowerCase() || "completed",
    elapsedMs: Number(job.elapsedMs || 0) || 0,
    jobId
  };
}

async function codexGenerateReply({
  promptInfo = null,
  sandbox = "read-only",
  reasoningEffort = "low",
}) {
  const prompt = String(promptInfo?.prompt || "").trim();
  if (!prompt) {
    throw new Error("empty_prompt");
  }
  const safeSandbox = normalizeChoice(
    sandbox,
    ["read-only", "workspace-write", "danger-full-access"],
    "read-only"
  );
  const safeReasoningEffort = normalizeChoice(
    reasoningEffort,
    ["minimal", "low", "medium", "high", "xhigh"],
    "low"
  );

  return new Promise((resolve, reject) => {
    const codexArgs = [
      "-c",
      `model_reasoning_effort="${safeReasoningEffort}"`,
      "-s",
      safeSandbox,
      "-a",
      "never",
      "exec",
      "--skip-git-repo-check",
      "--ephemeral",
      "--json",
    ];

    let p;
    let scriptPath = "";
    if (process.platform === "win32") {
      scriptPath = path.join(
        os.tmpdir(),
        `codex-bridge-run-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.ps1`
      );
      const psScript = [
        "$prompt = @'",
        prompt,
        "'@",
        `& codex -c model_reasoning_effort="${escapePowerShellSingleQuoted(safeReasoningEffort)}" -s ${escapePowerShellSingleQuoted(safeSandbox)} -a never exec --skip-git-repo-check --ephemeral --json $prompt`,
      ].join("\r\n");
      fs.writeFileSync(scriptPath, psScript, "utf8");
      p = spawn(
        "powershell.exe",
        ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", scriptPath],
        { windowsHide: true }
      );
    } else {
      p = spawn("codex", [...codexArgs, prompt], { windowsHide: true });
    }
    let stdout = "";
    let stderr = "";

    p.stdout.setEncoding("utf8");
    p.stderr.setEncoding("utf8");
    p.stdout.on("data", (d) => (stdout += d));
    p.stderr.on("data", (d) => (stderr += d));

    p.on("error", (err) => {
      if (scriptPath) {
        try {
          fs.unlinkSync(scriptPath);
        } catch {}
      }
      reject(err);
    });
    p.on("close", (code) => {
      if (scriptPath) {
        try {
          fs.unlinkSync(scriptPath);
        } catch {}
      }
      if (code !== 0) {
        return reject(new Error(`codex exited with code ${code}: ${stderr || stdout}`));
      }
      let lastText = "";
      for (const line of stdout.split(/\r?\n/)) {
        const t = line.trim();
        if (!t) continue;
        try {
          const obj = JSON.parse(t);
          if (obj?.type === "item.completed" && obj?.item?.type === "agent_message") {
            lastText = String(obj.item.text || "");
          }
        } catch {
          // ignore non-JSON lines
        }
      }
      resolve({
        reply: stripLeadingResultLabel(lastText),
        provider: "codex",
        model: "",
        route: "codex_cli",
        status: "completed",
        elapsedMs: 0,
        jobId: ""
      });
    });
  });
}

async function generateAgentReply({
  messageText,
  from = "",
  agentName = "",
  sandbox = "read-only",
  reasoningEffort = "low",
  enableTaskExecution = true,
  mentionAliases = [],
  strictMode = false,
  executionConfig = {}
}) {
  const promptInfo = buildRelayAgentPrompt({
    messageText,
    from,
    agentName,
    enableTaskExecution,
    mentionAliases,
    strictMode
  });
  if (String(executionConfig.runner || "").trim().toLowerCase() === "asolaria_brain") {
    return runAsolariaBrainReply({
      promptInfo,
      sandbox,
      executionConfig
    });
  }
  return codexGenerateReply({
    promptInfo,
    sandbox,
    reasoningEffort
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  // Defaults: read from local files created earlier by this project, if present.
  const defaultToken = readTextFile(path.join(__dirname, "bridge-token2.txt")) || readTextFile(path.join(__dirname, "bridge-token.txt"));
  const profilePath = String(args.profile || process.env.BOT_PROFILE || "").trim()
    ? path.resolve(String(args.profile || process.env.BOT_PROFILE || "").trim())
    : "";
  const profileRaw = profilePath ? readJsonFile(profilePath) : null;
  if (profilePath && (!profileRaw || typeof profileRaw !== "object")) {
    throw new Error(`Invalid bot profile: ${profilePath}`);
  }
  const profile = profileRaw && typeof profileRaw === "object" ? profileRaw : {};
  const relayProfile = profile.relay && typeof profile.relay === "object" ? profile.relay : {};
  const securityProfile = profile.security && typeof profile.security === "object" ? profile.security : {};
  const runtimeProfile = profile.runtime && typeof profile.runtime === "object" ? profile.runtime : {};
  const routingProfile = profile.routing && typeof profile.routing === "object" ? profile.routing : {};
  const executionProfile = profile.execution && typeof profile.execution === "object" ? profile.execution : {};
  const opsProfile = profile.ops && typeof profile.ops === "object" ? profile.ops : {};
  const executionConfig = buildExecutionConfig(executionProfile);

  const relayUrlEnv = String(relayProfile.urlEnv || "CODEX_BRIDGE_URL").trim();
  const relayTokenEnv = String(relayProfile.tokenEnv || "CODEX_BRIDGE_TOKEN").trim();
  const senderTokenEnv = String(securityProfile.senderTokenEnv || "BRIDGE_SENDER_TOKEN").trim();
  const opsWorkdir = String(args.workdir || process.env.BOT_WORKDIR || opsProfile.workdir || __dirname).trim() || __dirname;

  const room = String(
    args.room ||
      process.env.RELAY_ROOM ||
      process.env.CODEX_BRIDGE_ROOM ||
      relayProfile.room ||
      "asolaria_bridge"
  );
  const url = String(
    args.url ||
      process.env.RELAY_URL ||
      readFirstEnv([relayUrlEnv, "CODEX_BRIDGE_URL"]) ||
      "http://127.0.0.1:8788"
  );
  const token = String(
    args.token ||
      process.env.RELAY_TOKEN ||
      readFirstEnv([relayTokenEnv, "CODEX_BRIDGE_TOKEN"]) ||
      defaultToken
  );

  // The Cloudflare quick tunnel URL can change over time. Re-read it periodically.
  const tunnelUrlPath = path.join(__dirname, "bridge-tunnel-url.txt");
  let lastTunnelUrl = readTextFile(tunnelUrlPath);
  function getPublicRelayUrl() {
    const t = readTextFile(tunnelUrlPath);
    if (t) lastTunnelUrl = t;
    return lastTunnelUrl || url;
  }

  const from = String(
    args.from ||
      process.env.BOT_FROM ||
      process.env.CODEX_BRIDGE_FROM ||
      relayProfile.from ||
      "vector"
  );
  const canonicalFromId = canonicalAgentId(from);
  const isPrimaryCoordinator = canonicalFromId === "vector";
  const agentNameRaw = String(args.agentName || process.env.BOT_AGENT_NAME || from).trim();
  const agentName = agentNameRaw || from;
  const profileIdRaw = String(args.profileId || process.env.BOT_PROFILE_ID || profile.profileName || from).trim();
  const profileId = profileIdRaw || from;
  const senderToken = String(
    args.senderToken ||
      process.env.BOT_SENDER_TOKEN ||
      readFirstEnv([senderTokenEnv, "BRIDGE_SENDER_TOKEN"]) ||
      process.env.BRIDGE_SENDER_TOKEN ||
      ""
  );
  const cursorFile = String(runtimeProfile.cursorFile || `cursor-${from}.json`).trim() || `cursor-${from}.json`;
  const cursorDefaultPath = path.isAbsolute(cursorFile) ? cursorFile : path.join(opsWorkdir, cursorFile);
  const cursorPath = path.resolve(String(args.cursor || process.env.BOT_CURSOR || cursorDefaultPath));
  const pollMs = Math.max(250, Number(args.pollMs || process.env.POLL_MS || runtimeProfile.pollIntervalMs || 1000));
  const max = Math.min(500, Math.max(1, Number(args.max || process.env.MAX || runtimeProfile.maxBatch || 100)));
  const maxMessageChars = Math.max(500, Number(args.maxMessageChars || process.env.BOT_MAX_MESSAGE_CHARS || runtimeProfile.maxMessageChars || 6000));

  const pingEveryMs = Math.max(30_000, Number(args.pingEveryMs || process.env.PING_EVERY_MS || 300_000)); // 5m default
  const allowSendersProfile = Array.isArray(securityProfile.allowSenders) ? securityProfile.allowSenders : [];
  const defaultSupervisorHandle = isPrimaryCoordinator ? "rook" : "vector";
  const fallbackPingTo = allowSendersProfile.length ? String(allowSendersProfile[0] || "") : defaultSupervisorHandle;
  const pingTo = String(args.pingTo || process.env.PING_TO || fallbackPingTo || defaultSupervisorHandle);
  const bridgeAutoSync = toBoolFlag(
    args.bridgeAutoSync ?? process.env.BOT_BRIDGE_AUTO_SYNC ?? process.env.BRIDGE_AUTO_SYNC,
    false
  );
  const handleFromRaw = String(
    args.handleFrom ||
      process.env.HANDLE_FROM ||
      allowSendersProfile.join(",") ||
      pingTo ||
      defaultSupervisorHandle
  );
  const botSandbox = String(args.sandbox || process.env.BOT_SANDBOX || "read-only").trim().toLowerCase();
  const botReasoning = String(args.reasoning || process.env.BOT_REASONING || "low").trim().toLowerCase();
  const taskExecRaw = String(args.execTaskMode || process.env.BOT_EXEC_TASK_MODE || "1").trim().toLowerCase();
  const enableTaskExecution = !["0", "false", "off", "no"].includes(taskExecRaw);
  const defaultMentionAliases = isPrimaryCoordinator ? "vector" : from;
  const mentionAliasesRaw = String(args.mentionAliases || process.env.BOT_MENTION_ALIASES || defaultMentionAliases);
  let mentionAliases = parseMentionAliases(mentionAliasesRaw, from);
  if (!mentionAliases.length) {
    mentionAliases = [normalizeHandle(from)];
  }
  const supervisorRequiresMentionDefault = routingProfile.requireMention === undefined
    ? (isPrimaryCoordinator ? "0" : "1")
    : (routingProfile.requireMention ? "1" : "0");
  const supervisorRequiresMentionRaw = String(
    args.supervisorRequiresMention ||
      process.env.BOT_SUPERVISOR_REQUIRES_MENTION ||
      supervisorRequiresMentionDefault
  )
    .trim()
    .toLowerCase();
  const supervisorRequiresMention = !["0", "false", "off", "no"].includes(supervisorRequiresMentionRaw);
  const requireActionablePrefixDefault = routingProfile.taskPrefixes ? "1" : (isPrimaryCoordinator ? "0" : "1");
  const requireActionablePrefixRaw = String(
    args.requireActionablePrefix ||
      process.env.BOT_REQUIRE_ACTIONABLE_PREFIX ||
      requireActionablePrefixDefault
  )
    .trim()
    .toLowerCase();
  const requireActionablePrefix = !["0", "false", "off", "no"].includes(requireActionablePrefixRaw);
  const idleReviewMsDefault = isPrimaryCoordinator ? 0 : 900_000;
  const idleReviewMs = Math.max(0, Number(args.idleReviewMs || process.env.BOT_IDLE_REVIEW_MS || idleReviewMsDefault));
  const reviewAfterResultRaw = String(
    args.reviewAfterResult ||
      process.env.BOT_REVIEW_AFTER_RESULT ||
      (isPrimaryCoordinator ? "0" : "1")
  )
    .trim()
    .toLowerCase();
  const reviewAfterResult = !["0", "false", "off", "no"].includes(reviewAfterResultRaw);
  const handleFromList = handleFromRaw
    .split(/[,\s]+/g)
    .map((s) => s.trim())
    .filter(Boolean);
  const handleFromSet = new Set(handleFromList);
  const actionablePattern = buildActionablePattern(routingProfile.taskPrefixes || []);

  const registryDefaultPath = path.join(opsWorkdir, "agents-registry.json");
  const registryPath = path.resolve(String(args.registry || process.env.BOT_REGISTRY || registryDefaultPath));
  const registryEveryMs = Math.max(5_000, Number(args.registryEveryMs || process.env.BOT_REGISTRY_EVERY_MS || 30_000));
  const registryPrimaryHandle = canonicalAgentId(from);
  const registryHandleFrom = Array.from(new Set(handleFromList.map((value) => canonicalAgentId(value)).filter(Boolean)));
  const registryMentionAliases = registryPrimaryHandle ? [`@${registryPrimaryHandle}`] : mentionAliases;
  const registryAllowAgents = Array.from(
    new Set(
      parseCsvList(
        args.registryAllowAgents ||
          process.env.BOT_REGISTRY_ALLOW_AGENTS ||
          opsProfile.registryAllowAgents ||
          ""
      )
        .map((value) => canonicalAgentId(value))
        .filter(Boolean)
    )
  );
  const registryAllowAgentsSet = new Set(registryAllowAgents);
  const shouldKeepRegistryAgent = (agentId) =>
    !registryAllowAgentsSet.size || registryAllowAgentsSet.has(canonicalAgentId(agentId));

  if (toBoolFlag(args.checkProfile ?? process.env.BOT_CHECK_PROFILE, false)) {
    const resolved = {
      ok: true,
      profilePath: profilePath || "",
      from,
      agentName,
      profileId,
      room,
      url,
      tokenConfigured: Boolean(token),
      senderTokenConfigured: Boolean(senderToken),
      senderTokenEnv,
      allowSenders: handleFromList,
      mentionAliases,
      cursorPath,
      pollMs,
      max,
      maxMessageChars,
      pingTo,
      bridgeAutoSync,
      requireActionablePrefix,
      supervisorRequiresMention,
      taskPrefixes: normalizeTaskPrefixes(routingProfile.taskPrefixes || []),
      workdir: opsWorkdir,
      execution: executionConfig
    };
    console.log(JSON.stringify(resolved, null, 2));
    return;
  }

  let after = readCursor(cursorPath);
  let lastPingAt = 0;
  let lastRegistryAt = 0;
  let lastWorkAt = Date.now();
  let lastReviewAt = 0;
  let lastExecutionMeta = {
    at: "",
    status: "",
    provider: executionConfig.providerOrder[0] || (executionConfig.runner === "codex_cli" ? "codex" : ""),
    model: executionConfig.expectedModel || "",
    route: executionConfig.runner,
    elapsedMs: 0,
    jobId: "",
    error: ""
  };
  const agents = new Map(); // from -> { lastSeenAt, lastSeenId }
  let queue = [];
  let working = false;

  function enqueue(m) {
    queue.push(m);
  }

  async function sendReviewRequest(reason, idleMs = 0) {
    if (!bridgeAutoSync) return;
    if (!pingTo) return;
    const idleMin = Math.max(0, Math.floor(Number(idleMs || 0) / 60_000));
    const idleChunk = idleMin > 0 ? ` idleMin=${idleMin}` : "";
    await postMessage({
      url,
      token,
      room,
      from,
      senderToken,
      text: `@${pingTo} #thread:review-${from} REVIEW_REQUEST: from=${from} name=${agentName} profile=${profileId} reason=${reason}${idleChunk} ts=${nowIso()}`,
    }).catch(() => {});
  }

  async function processQueue() {
    if (working) return;
    working = true;
    try {
      while (queue.length) {
        const m = queue.shift();
        if (!m) continue;

        const thread = extractThread(m.text) || `msg-${m.id}`;
        const who = m.from || "unknown";

        // Quick ACK.
        await postMessage({
          url,
          token,
          room,
          from,
          senderToken,
          text: `@${who} #thread:${thread} ACK: received at ${nowIso()}. Generating reply...`,
        });

        let safeReply = "(no reply text produced)";
        try {
          // Deterministic shell execution mode (supervisor only):
          // "@rook ... TASK_SHELL: <powershell command>"
          const shellCommand = extractTaskShellCommand(m.text);
          if (shellCommand) {
            const shell = await runPowerShellCommand(shellCommand);
            const output = String(shell.output || "").trim();
            const blockers = shell.ok ? "[]" : `[\"shell_exit_${shell.code}\",\"${shell.error || "failed"}\"]`;
            safeReply = [
              "- findings: TASK_SHELL command executed.",
              "- files_changed: []",
              `- commands_run: [${JSON.stringify(shellCommand)}]`,
              `- blockers: ${blockers}`,
              output ? `- output: ${output}` : "- output: (empty)"
            ].join("\n");
            lastExecutionMeta = {
              at: nowIso(),
              status: shell.ok ? "completed" : "failed",
              provider: "shell",
              model: "",
              route: "powershell",
              elapsedMs: 0,
              jobId: "",
              error: shell.ok ? "" : String(shell.error || `shell_exit_${shell.code}`).trim()
            };
          } else {
            let replyMeta = await generateAgentReply({
              messageText: m.text,
              from,
              agentName,
              sandbox: executionConfig.sandbox || botSandbox,
              reasoningEffort: executionConfig.reasoningEffort || botReasoning,
              enableTaskExecution,
              mentionAliases,
              executionConfig
            });
            if (isBoilerplateReply(replyMeta?.reply || "")) {
              replyMeta = await generateAgentReply({
                messageText: m.text,
                from,
                agentName,
                sandbox: executionConfig.sandbox || botSandbox,
                reasoningEffort: executionConfig.reasoningEffort || botReasoning,
                enableTaskExecution,
                mentionAliases,
                strictMode: true,
                executionConfig
              });
            }
            safeReply = String(replyMeta?.reply || "").trim() || "(no reply text produced)";
            lastExecutionMeta = {
              at: nowIso(),
              status: String(replyMeta?.status || "completed").trim().toLowerCase() || "completed",
              provider: String(replyMeta?.provider || "").trim().toLowerCase(),
              model: String(replyMeta?.model || "").trim(),
              route: String(replyMeta?.route || executionConfig.runner || "").trim(),
              elapsedMs: Number(replyMeta?.elapsedMs || 0) || 0,
              jobId: String(replyMeta?.jobId || "").trim(),
              error: String(replyMeta?.error || "").trim()
            };
          }
        } catch (error) {
          const errorText = String(error?.message || error || "execution_failed").trim();
          safeReply = [
            "- findings: agent execution failed.",
            "- files_changed: []",
            "- commands_run: []",
            `- blockers: [${JSON.stringify(errorText)}]`
          ].join("\n");
          lastExecutionMeta = {
            at: nowIso(),
            status: "failed",
            provider: String(lastExecutionMeta.provider || executionConfig.providerOrder[0] || "").trim().toLowerCase(),
            model: String(lastExecutionMeta.model || executionConfig.expectedModel || "").trim(),
            route: String(lastExecutionMeta.route || executionConfig.runner || "").trim(),
            elapsedMs: 0,
            jobId: String(lastExecutionMeta.jobId || "").trim(),
            error: errorText
          };
        }
        safeReply = clipText(stripLeadingResultLabel(safeReply), maxMessageChars);

        await postMessage({
          url,
          token,
          room,
          from,
          senderToken,
          text: `@${who} #thread:${thread} RESULT: ${safeReply}`,
        });

        lastWorkAt = Date.now();
        if (bridgeAutoSync && reviewAfterResult) {
          lastReviewAt = lastWorkAt;
          await sendReviewRequest("task-complete", 0);
        }
      }
    } finally {
      working = false;
    }
  }

  if (bridgeAutoSync) {
    // Announce boot once.
    await postMessage({
      url,
      token,
      room,
      from,
      senderToken,
      text: `IDENTITY: from=${from} name=${agentName} profile=${profileId} runner=${executionConfig.runner} providers=${(executionConfig.providerOrder || []).join("|") || "codex"} mentions=${mentionAliases.join("|")} supervisorRequiresMention=${supervisorRequiresMention ? "1" : "0"} ts=${nowIso()}`,
    }).catch(() => {});

    await postMessage({
      url,
      token,
      room,
      from,
      senderToken,
      text: `HEARTBEAT:relay-bot online from=${from} name=${agentName} ts=${nowIso()} url=${getPublicRelayUrl()} pollMs=${pollMs}`,
    }).catch(() => {});
  }

  for (;;) {
    try {
      const { messages, nextAfter } = await fetchMessages({ url, token, room, after, max });
      if (messages.length) {
        after = nextAfter;
        writeCursor(cursorPath, after);
      }

      for (const m of messages) {
        if (!m || typeof m.text !== "string") continue;
        if (m.from) {
          const canonicalFrom = canonicalAgentId(m.from);
          if (canonicalFrom) {
            agents.set(canonicalFrom, { lastSeenAt: String(m.ts || nowIso()), lastSeenId: Number(m.id || 0) });
          }
        }
        if (m.from === from) continue; // ignore self
        if (normalizeHandle(m.from) === "oli") {
          // Oli emits frequent HEARTBEAT traffic; ignore that noise but allow real questions/tasks.
          const firstLine = String(m.text || "").split(/\r?\n/)[0] || "";
          if (/(^|\s)HEARTBEAT:/.test(firstLine) || /\b#thread:oli-hb\b/.test(firstLine)) {
            continue;
          }
        }

        const firstLine = String(m.text).split(/\r?\n/)[0] || "";
        const mentioned = textMentionsAny(m.text, mentionAliases);
        const fromSupervisor = handleFromSet.has(String(m.from || ""));
        const actionable = actionablePattern.test(firstLine);
        const directActionable = requireActionablePrefix ? mentioned && actionable : mentioned;

        // Supervisors may optionally omit mention for the primary coordinator legacy path, but actionable prefix
        // is always required to avoid replaying generic chatter.
        const supervisorActionable =
          fromSupervisor &&
          actionable &&
          (supervisorRequiresMention ? mentioned : true);

        if (directActionable || supervisorActionable) {
          // Ignore status chatter to avoid loops.
          if (/(^|\s)(ACK|RESULT|HEARTBEAT|PING|IDENTITY|REVIEW_REQUEST):/.test(firstLine)) continue;
          if (startsWithAny(firstLine, ["ACK:", "RESULT:", "HEARTBEAT:", "PING:", "IDENTITY:", "REVIEW_REQUEST:"])) continue;
          enqueue(m);
        }
      }

      // Persist a minimal agent registry for quick status/debugging.
      const now = Date.now();
      if (now - lastRegistryAt >= registryEveryMs) {
        lastRegistryAt = now;
        try {
          let existingAgents = {};
          try {
            const existingRaw = fs.readFileSync(registryPath, "utf8");
            const existingDoc = JSON.parse(existingRaw);
            if (existingDoc && typeof existingDoc.agents === "object" && existingDoc.agents) {
              for (const [rawKey, rawValue] of Object.entries(existingDoc.agents)) {
                const canonicalKey = canonicalAgentId(rawKey);
                if (!canonicalKey) continue;
                if (!shouldKeepRegistryAgent(canonicalKey)) continue;
                existingAgents[canonicalKey] = rawValue;
              }
            }
          } catch {
            existingAgents = {};
          }
          const liveAgents = Object.fromEntries(
            Array.from(agents.entries())
              .filter(([agentId]) => shouldKeepRegistryAgent(agentId))
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([agentId, agentState]) => {
                const current = agentState && typeof agentState === "object" ? agentState : {};
                const existing = existingAgents[agentId] && typeof existingAgents[agentId] === "object"
                  ? existingAgents[agentId]
                  : {};
                return [
                  agentId,
                  {
                    ...existing,
                    ...current
                  }
                ];
              })
          );
          const existingSelf = existingAgents[registryPrimaryHandle] && typeof existingAgents[registryPrimaryHandle] === "object"
            ? existingAgents[registryPrimaryHandle]
            : {};
          if (registryPrimaryHandle && shouldKeepRegistryAgent(registryPrimaryHandle)) {
            liveAgents[registryPrimaryHandle] = {
              ...existingSelf,
              id: registryPrimaryHandle,
              name: agentName,
              profileId,
              lastSeenAt: nowIso(),
              lastSeenId: Number(after || 0),
              pingTo,
              handleFrom: registryHandleFrom,
              mentionAliases: registryMentionAliases,
              supervisorRequiresMention,
              requireActionablePrefix,
              bridgeAutoSync,
              idleReviewMs,
              execution: executionConfig,
              lastExecution: lastExecutionMeta
            };
          }
          const doc = {
            updatedAt: nowIso(),
            room,
            url: getPublicRelayUrl(),
            cursorAfter: after,
            from,
            agentName,
            profileId,
            pingTo,
            handleFrom: registryHandleFrom,
            mentionAliases: registryMentionAliases,
            supervisorRequiresMention,
            requireActionablePrefix,
            bridgeAutoSync,
            idleReviewMs,
            ...(registryAllowAgents.length ? { registryAllowAgents } : {}),
            agents: Object.fromEntries(
              Object.entries({ ...existingAgents, ...liveAgents }).sort((a, b) => a[0].localeCompare(b[0]))
            ),
          };
          fs.writeFileSync(registryPath, JSON.stringify(doc, null, 2) + "\n", "utf8");
        } catch {
          // best effort
        }
      }

      // Ping the configured peer lane every N minutes to validate the bridge is still live.
      if (bridgeAutoSync && now - lastPingAt >= pingEveryMs) {
        lastPingAt = now;
        await postMessage({
          url,
          token,
          room,
          from,
          senderToken,
          text: `@${pingTo} #thread:hb PING: ts=${nowIso()} (reply HEARTBEAT if you see this)`,
        }).catch(() => {});
      }

      await processQueue();
      if (
        bridgeAutoSync &&
        idleReviewMs > 0 &&
        now - lastWorkAt >= idleReviewMs &&
        now - lastReviewAt >= idleReviewMs
      ) {
        lastReviewAt = now;
        await sendReviewRequest("idle", now - lastWorkAt);
      }
    } catch (err) {
      if (bridgeAutoSync) {
        // Emit a lightweight alert and keep running.
        try {
          await postMessage({
            url,
            token,
            room,
            from,
            senderToken,
            text: `ALERT:relay-bot ts=${nowIso()} error=${String(err?.message || err)}`,
          });
        } catch {
          // ignore
        }
      }
    }

    await sleep(pollMs);
  }
}

main().catch((err) => {
  console.error(JSON.stringify({ ok: false, error: err?.message || String(err) }));
  process.exit(2);
});
