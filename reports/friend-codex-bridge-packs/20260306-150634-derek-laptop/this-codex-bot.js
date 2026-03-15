#!/usr/bin/env node
"use strict";

/*
  this-codex-bot

  Purpose:
    - Poll a relay room continuously.
    - If a message addresses @this-codex, ACK quickly and auto-reply using `codex exec`.
    - Send a heartbeat/ping at least every N minutes so connectivity issues surface quickly.
    - Optionally load a no-secrets agent profile via `--profile`.

  Example:
    node this-codex-bot.js --url http://127.0.0.1:8788 --token <TOKEN> --room asolaria_bridge
    node this-codex-bot.js --profile .\profiles\friend-codex.profile.json
*/

const { spawn } = require("child_process");
const fs = require("fs");
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

async function codexGenerateReply({
  messageText,
  sandbox = "read-only",
  reasoningEffort = "low",
  enableTaskExecution = true,
}) {
  const firstLine = String(messageText || "").split(/\r?\n/)[0] || "";
  const taskRequested = enableTaskExecution && /\bTASK(?:_EXECUTE)?:/i.test(firstLine);

  const concisePrompt = [
    "You are this-codex replying inside a relay room between multiple Codex instances.",
    "Write a concise, actionable reply to the message below.",
    "Constraints:",
    "- Plain text only (no markdown).",
    "- 12 lines max.",
    "- If mentioning ~/.codex/config.toml, use TOML single quotes like approval_policy = 'never'.",
    "- Do not tell the user to paste long logs; ask for 1 key detail if blocked.",
    "",
    "Message:",
    messageText,
  ].join("\n");

  const taskPrompt = [
    "You are this-codex in a relay room. A supervisor asked you to execute a task.",
    "Execute the requested checks/actions using available tools immediately.",
    "Do not reply with role-play acknowledgements.",
    "Reply in plain text with this exact shape:",
    "RESULT:",
    "- findings: ...",
    "- files_changed: [...]",
    "- commands_run: [...]",
    "- blockers: [...]",
    "",
    "Message:",
    messageText,
  ].join("\n");

  const prompt = taskRequested ? taskPrompt : concisePrompt;
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
    const args = [
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
      prompt,
    ];

    let p;
    if (process.platform === "win32") {
      // On some Windows setups, spawning .cmd directly fails with EINVAL.
      // Use cmd.exe to run it reliably.
      const comspec = process.env.ComSpec || "cmd.exe";
      p = spawn(comspec, ["/d", "/s", "/c", "codex.cmd", ...args], { windowsHide: true });
    } else {
      p = spawn("codex", args, { windowsHide: true });
    }
    let stdout = "";
    let stderr = "";

    p.stdout.setEncoding("utf8");
    p.stderr.setEncoding("utf8");
    p.stdout.on("data", (d) => (stdout += d));
    p.stderr.on("data", (d) => (stderr += d));

    p.on("error", (err) => reject(err));
    p.on("close", (code) => {
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
      resolve(lastText.trim());
    });
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
  const opsProfile = profile.ops && typeof profile.ops === "object" ? profile.ops : {};

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
      "this-codex"
  );
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
  const fallbackPingTo = allowSendersProfile.length ? String(allowSendersProfile[0] || "") : "other-codex";
  const pingTo = String(args.pingTo || process.env.PING_TO || fallbackPingTo || "other-codex");
  const bridgeAutoSync = toBoolFlag(
    args.bridgeAutoSync ?? process.env.BOT_BRIDGE_AUTO_SYNC ?? process.env.BRIDGE_AUTO_SYNC,
    false
  );
  const handleFromRaw = String(
    args.handleFrom ||
      process.env.HANDLE_FROM ||
      allowSendersProfile.join(",") ||
      pingTo ||
      "other-codex"
  );
  const botSandbox = String(args.sandbox || process.env.BOT_SANDBOX || "read-only").trim().toLowerCase();
  const botReasoning = String(args.reasoning || process.env.BOT_REASONING || "low").trim().toLowerCase();
  const taskExecRaw = String(args.execTaskMode || process.env.BOT_EXEC_TASK_MODE || "1").trim().toLowerCase();
  const enableTaskExecution = !["0", "false", "off", "no"].includes(taskExecRaw);
  const defaultMentionAliases = from === "this-codex" ? "this-codex,this-codex-bot" : from;
  const mentionAliasesRaw = String(args.mentionAliases || process.env.BOT_MENTION_ALIASES || defaultMentionAliases);
  let mentionAliases = parseMentionAliases(mentionAliasesRaw, from);
  if (!mentionAliases.length) {
    mentionAliases = [normalizeHandle(from)];
  }
  const supervisorRequiresMentionDefault = routingProfile.requireMention === undefined
    ? (from === "this-codex" ? "0" : "1")
    : (routingProfile.requireMention ? "1" : "0");
  const supervisorRequiresMentionRaw = String(
    args.supervisorRequiresMention ||
      process.env.BOT_SUPERVISOR_REQUIRES_MENTION ||
      supervisorRequiresMentionDefault
  )
    .trim()
    .toLowerCase();
  const supervisorRequiresMention = !["0", "false", "off", "no"].includes(supervisorRequiresMentionRaw);
  const requireActionablePrefixDefault = routingProfile.taskPrefixes ? "1" : (from === "this-codex" ? "0" : "1");
  const requireActionablePrefixRaw = String(
    args.requireActionablePrefix ||
      process.env.BOT_REQUIRE_ACTIONABLE_PREFIX ||
      requireActionablePrefixDefault
  )
    .trim()
    .toLowerCase();
  const requireActionablePrefix = !["0", "false", "off", "no"].includes(requireActionablePrefixRaw);
  const idleReviewMsDefault = from === "this-codex" ? 0 : 900_000;
  const idleReviewMs = Math.max(0, Number(args.idleReviewMs || process.env.BOT_IDLE_REVIEW_MS || idleReviewMsDefault));
  const reviewAfterResultRaw = String(
    args.reviewAfterResult ||
      process.env.BOT_REVIEW_AFTER_RESULT ||
      (from === "this-codex" ? "0" : "1")
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
      workdir: opsWorkdir
    };
    console.log(JSON.stringify(resolved, null, 2));
    return;
  }

  let after = readCursor(cursorPath);
  let lastPingAt = 0;
  let lastRegistryAt = 0;
  let lastWorkAt = Date.now();
  let lastReviewAt = 0;
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

        // Deterministic shell execution mode (supervisor only):
        // "@other-codex ... TASK_SHELL: <powershell command>"
        const shellCommand = extractTaskShellCommand(m.text);
        let safeReply = "(no reply text produced)";
        if (shellCommand) {
          const shell = await runPowerShellCommand(shellCommand);
          const output = String(shell.output || "").trim();
          const blockers = shell.ok ? "[]" : `[\"shell_exit_${shell.code}\",\"${shell.error || "failed"}\"]`;
          safeReply = [
            "RESULT:",
            "- findings: TASK_SHELL command executed.",
            "- files_changed: []",
            `- commands_run: [${JSON.stringify(shellCommand)}]`,
            `- blockers: ${blockers}`,
            output ? `- output: ${output}` : "- output: (empty)"
          ].join("\n");
        } else {
          // LLM reply.
          const reply = await codexGenerateReply({
            messageText: m.text,
            sandbox: botSandbox,
            reasoningEffort: botReasoning,
            enableTaskExecution,
          });
          safeReply = reply || "(no reply text produced)";
        }
        safeReply = clipText(safeReply, maxMessageChars);

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
      text: `IDENTITY: from=${from} name=${agentName} profile=${profileId} mentions=${mentionAliases.join("|")} supervisorRequiresMention=${supervisorRequiresMention ? "1" : "0"} ts=${nowIso()}`,
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
          agents.set(String(m.from), { lastSeenAt: String(m.ts || nowIso()), lastSeenId: Number(m.id || 0) });
        }
        if (m.from === from) continue; // ignore self
        if (m.from === "Oli") {
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

        // Supervisors may optionally omit mention (legacy for this-codex), but actionable prefix
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
          const doc = {
            updatedAt: nowIso(),
            room,
            url: getPublicRelayUrl(),
            cursorAfter: after,
            from,
            agentName,
            profileId,
            pingTo,
            handleFrom: handleFromList,
            mentionAliases,
            supervisorRequiresMention,
            requireActionablePrefix,
            bridgeAutoSync,
            idleReviewMs,
            agents: Object.fromEntries(Array.from(agents.entries()).sort((a, b) => a[0].localeCompare(b[0]))),
          };
          fs.writeFileSync(registryPath, JSON.stringify(doc, null, 2) + "\n", "utf8");
        } catch {
          // best effort
        }
      }

      // Ping John/other-codex every N minutes to validate the bridge is still live.
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
            text: `ALERT:this-codex-bot ts=${nowIso()} error=${String(err?.message || err)}`,
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
