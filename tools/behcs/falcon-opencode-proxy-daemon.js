#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const http = require("http");
const { spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..", "..");
const runId = "falcon-opencode-proxy-daemon-20260427";
const eventId = "EVT-FALCON-OPENCODE-PROXY-DAEMON-2026-04-27";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", runId);
const inboxPath = path.join(repoRoot, "data", "behcs", "inbox.ndjson");

const paths = Object.freeze({
  config: path.join(runRoot, "falcon-opencode-proxy-daemon.config.json"),
  queue: path.join(runRoot, "falcon-opencode-proxy-requests.ndjson"),
  processed: path.join(runRoot, "falcon-opencode-proxy-processed.ndjson"),
  results: path.join(runRoot, "falcon-opencode-proxy-results.ndjson"),
  returnQueue: path.join(runRoot, "falcon-opencode-proxy-return-queue.ndjson"),
  state: path.join(runRoot, "falcon-opencode-proxy-daemon-state.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "falcon-opencode-proxy-daemon.v1.json"),
  index: path.join(repoRoot, "data", "behcs", "index", "falcon-opencode-proxy-daemon-index.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "falcon-opencode-proxy-daemon-map-map-mapped.v1.json"),
  cube: path.join(repoRoot, "data", "behcs", "cubes", "falcon-opencode-proxy-daemon-cube-cubed.cube.js"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "falcon-opencode-proxy-daemon-behcs256.glpj.json"),
  supervisors: path.join(repoRoot, "data", "behcs", "supervisors", "falcon", "falcon-opencode-proxy-daemon-supervisors.v1.json"),
  report: path.join(repoRoot, "reports", "falcon-opencode-proxy-daemon-latest.md"),
  launcher: path.join(repoRoot, "Start-Falcon-OpenCode-Proxy.cmd"),
  pid: path.join(repoRoot, "runtime", "falcon-opencode-proxy-daemon.pid"),
  log: path.join(repoRoot, "logs", "falcon-opencode-proxy-daemon.log"),
  lock: path.join(runRoot, "falcon-opencode-proxy-daemon.lock")
});

const allowedModels = Object.freeze([
  "opencode/gpt-5-nano",
  "opencode/big-pickle",
  "opencode/hy3-preview-free",
  "opencode/ling-2.6-flash-free",
  "opencode/minimax-m2.5-free",
  "opencode/nemotron-3-super-free"
]);

const defaultConfig = Object.freeze({
  enabled: true,
  pollIntervalMs: 30000,
  maxPromptChars: 3000,
  maxJobsPerTick: 1,
  defaultModel: "opencode/gpt-5-nano",
  allowedModels,
  falconReturnTargets: [
    "http://192.168.1.8:4947/behcs/send",
    "http://100.75.63.31:4947/behcs/send"
  ],
  lirisMirrorTarget: "http://192.168.100.2:4947/behcs/send",
  localBusTarget: "http://127.0.0.1:4947/behcs/send",
  boundary: "Falcon PID-owned Acer proxy. No native Android OpenCode claim, no secret copying, no tools, no file edits requested, one job per tick."
});

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeText(filePath, text) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, text.endsWith("\n") ? text : `${text}\n`, "utf8");
}

function appendNdjson(filePath, row) {
  ensureDir(filePath);
  fs.appendFileSync(filePath, `${JSON.stringify(row)}\n`, "utf8");
}

function writeJson(filePath, value) {
  writeText(filePath, JSON.stringify(value, null, 2));
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function readNdjson(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, "utf8").split(/\r?\n/).filter(Boolean).map((line, index) => {
    try {
      return { ...JSON.parse(line), _line: index + 1 };
    } catch {
      return null;
    }
  }).filter(Boolean);
}

function repoRel(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/");
}

function sha(value) {
  return crypto.createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex");
}

function pid(prefix, seed) {
  return `${prefix}.${sha(seed).slice(0, 12).toUpperCase()}`;
}

function now() {
  return new Date().toISOString();
}

function pidAlive(pidValue) {
  const pidNumber = Number(pidValue);
  if (!Number.isInteger(pidNumber) || pidNumber <= 0) return false;
  try {
    process.kill(pidNumber, 0);
    return true;
  } catch (error) {
    return error && error.code === "EPERM";
  }
}

function readLock() {
  try {
    return JSON.parse(fs.readFileSync(paths.lock, "utf8"));
  } catch {
    return null;
  }
}

function acquireTickLock() {
  fs.mkdirSync(runRoot, { recursive: true });
  const createdAt = now();
  const lock = {
    pid: process.pid,
    createdAt,
    staleAfterMs: 15 * 60 * 1000,
    purpose: "falcon-opencode-proxy-daemon-single-queue-owner"
  };

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const fd = fs.openSync(paths.lock, "wx");
      fs.writeFileSync(fd, JSON.stringify(lock, null, 2));
      return { acquired: true, fd, lock };
    } catch (error) {
      if (error.code !== "EEXIST") return { acquired: false, reason: error.message };
      const existing = readLock();
      const ageMs = existing?.createdAt ? Date.now() - Date.parse(existing.createdAt) : Infinity;
      const stale = !existing || ageMs > (existing.staleAfterMs || 15 * 60 * 1000) || !pidAlive(existing.pid);
      if (stale) {
        try {
          fs.unlinkSync(paths.lock);
          continue;
        } catch {}
      }
      return { acquired: false, reason: "active_lock", existing };
    }
  }

  return { acquired: false, reason: "lock_retry_exhausted", existing: readLock() };
}

function releaseTickLock(handle) {
  if (!handle?.acquired) return;
  try {
    fs.closeSync(handle.fd);
  } catch {}
  try {
    fs.unlinkSync(paths.lock);
  } catch {}
}

function loadConfig() {
  return { ...defaultConfig, ...readJson(paths.config, {}) };
}

function loadState() {
  return readJson(paths.state, {
    runId,
    eventId,
    startedAt: null,
    lastTickAt: null,
    processedIds: [],
    processedCount: 0,
    returnedCount: 0,
    queuedReturnCount: 0,
    lastStatus: "new"
  });
}

function saveState(state) {
  writeJson(paths.state, state);
}

function normalizeRequest(raw, source) {
  const id = String(raw.id || raw.requestId || `${source}-${sha(raw).slice(0, 16)}`);
  const lane = String(raw.lane || raw.payload?.lane || "falcon_proxy");
  const prompt = String(raw.prompt || raw.payload?.prompt || raw.question || raw.payload?.question || "").trim();
  const model = String(raw.model || raw.payload?.model || defaultConfig.defaultModel);
  return {
    id,
    source,
    verb: "falcon-opencode-proxy-request",
    from: raw.from || source,
    target: "falcon",
    lane,
    prompt,
    model,
    falconPid: raw.falconPid || raw.payload?.falconPid || pid("BH.AGENT.PID.FALCON.PROXY", `${id}:${lane}`),
    replyTarget: raw.replyTarget || raw.payload?.replyTarget || null,
    receivedAt: raw.receivedAt || raw.ts || now(),
    rawSha256: sha(raw)
  };
}

function collectRequests(config) {
  const fileRows = readNdjson(paths.queue)
    .filter((row) => (row.verb || "falcon-opencode-proxy-request") === "falcon-opencode-proxy-request")
    .map((row) => normalizeRequest(row, "file-queue"));

  const inboxRows = readNdjson(inboxPath)
    .filter((row) => row.verb === "falcon-opencode-proxy-request" || row.type === "falcon-opencode-proxy-request")
    .map((row) => normalizeRequest(row, "local-law001-inbox"));

  return [...fileRows, ...inboxRows].filter((request) => {
    if (!request.prompt || request.prompt.length > config.maxPromptChars) return false;
    if (!config.allowedModels.includes(request.model)) return false;
    return true;
  });
}

function parseOpenCodeEvents(stdout) {
  const events = [];
  for (const line of String(stdout || "").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      events.push(JSON.parse(trimmed));
    } catch {
      // Preserve raw stdout hash in result.
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

function executeRequest(request, config) {
  const generatedAt = now();
  const acerProxyPid = pid("BH.AGENT.PID.ACER.PROXY", `${request.id}:${request.falconPid}`);
  const prompt = [
    "BEHCS-256 LX-ROUTE-SPAWN permanent Falcon proxy daemon.",
    `RequestId=${request.id}.`,
    `FalconOwnedPID=${request.falconPid}.`,
    `AcerProxyPID=${acerProxyPid}.`,
    `Lane=${request.lane}.`,
    request.prompt,
    "Return one compact JSON object with keys request_id, lane, falcon_pid, proxy_pid, result, risk.",
    "Do not edit files. Do not run tools. Do not claim native Android OpenCode execution."
  ].join(" ");

  const started = Date.now();
  const proc = spawnSync("opencode", [
    "run",
    "--format",
    "json",
    "-m",
    request.model,
    "--dir",
    repoRoot,
    prompt
  ], {
    cwd: repoRoot,
    encoding: "utf8",
    timeout: 120000,
    windowsHide: true,
    shell: true,
    env: {
      ...process.env,
      BROWN_HILBERT_PID: request.falconPid,
      BEHCS256_GLYPH: "LX-ROUTE-SPAWN",
      ASOLARIA_PROXY_EXECUTOR: "acer-for-falcon",
      ASOLARIA_BOUNDARY: "NO_FILE_EDITS_NO_TOOLS_NO_FANOUT_NO_SECRET_COPY"
    }
  });

  const events = parseOpenCodeEvents(proc.stdout);
  const responseText = extractText(events);
  const finish = events.find((event) => event.type === "step_finish");
  return {
    verb: "falcon-opencode-proxy-result",
    id: `${request.id}-result`,
    requestId: request.id,
    ts: generatedAt,
    lane: request.lane,
    model: request.model,
    falconPid: request.falconPid,
    acerProxyPid,
    executionOwner: "falcon",
    executorHost: "acer",
    nativeFalconOpenCode: false,
    ok: proc.status === 0 && responseText.length > 0,
    exitCode: proc.status,
    signal: proc.signal,
    elapsedMs: Date.now() - started,
    responseText: responseText.slice(0, 4000),
    responseSha256: sha(responseText || ""),
    eventCount: events.length,
    tokens: finish?.part?.tokens || null,
    cost: typeof finish?.part?.cost === "number" ? finish.part.cost : null,
    stdoutSha256: sha(proc.stdout || ""),
    stderr: String(proc.stderr || "").slice(0, 1000),
    error: proc.error ? String(proc.error.message || proc.error).slice(0, 1000) : "",
    boundary: config.boundary
  };
}

function httpJson(method, url, body = null, timeoutMs = 5000) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const payload = body ? Buffer.from(JSON.stringify(body), "utf8") : null;
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path: `${parsed.pathname}${parsed.search}`,
      method,
      timeout: timeoutMs,
      headers: payload
        ? { "content-type": "application/json", "content-length": payload.length, connection: "close" }
        : { connection: "close" }
    }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        let bodyOut = text;
        try {
          bodyOut = JSON.parse(text);
        } catch {}
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode, body: bodyOut });
      });
    });
    req.on("timeout", () => req.destroy(new Error("request_timeout")));
    req.on("error", (error) => resolve({ ok: false, error: error.message }));
    if (payload) req.write(payload);
    req.end();
  });
}

async function returnResult(result, request, config) {
  const targets = [
    request.replyTarget,
    ...config.falconReturnTargets,
    config.lirisMirrorTarget,
    config.localBusTarget
  ].filter(Boolean);
  const posts = [];
  let falconReturned = false;
  for (const target of targets) {
    const isFalconTarget = target.includes("192.168.1.8") || target.includes("100.75.63.31");
    if (isFalconTarget && falconReturned) {
      posts.push({ target, skipped: true, reason: "falcon_already_returned" });
      continue;
    }
    const post = await httpJson("POST", target, {
      ...result,
      target: target.includes("192.168.100.2") ? "liris" : target.includes("127.0.0.1") ? "acer" : "falcon",
      from: "acer-falcon-opencode-proxy-daemon",
      eventId
    });
    posts.push({ target, ...post });
    if (post.ok && isFalconTarget) falconReturned = true;
  }
  return posts;
}

async function tick() {
  const lock = acquireTickLock();
  if (!lock.acquired) {
    const config = loadConfig();
    const state = loadState();
    state.lastTickAt = now();
    state.lastStatus = "locked_skip";
    state.lock = lock;
    saveState(state);
    return { config, state, processedThisTick: 0 };
  }

  try {
    return await tickUnlocked();
  } finally {
    releaseTickLock(lock);
  }
}

async function tickUnlocked() {
  const config = loadConfig();
  const state = loadState();
  state.startedAt ||= now();
  state.lastTickAt = now();
  state.pid = process.pid;
  writeText(paths.pid, String(process.pid));

  const processed = new Set(state.processedIds || []);
  const requests = collectRequests(config).filter((request) => !processed.has(request.id));
  const selected = requests.slice(0, config.maxJobsPerTick);

  for (const request of selected) {
    appendNdjson(paths.processed, { ts: now(), requestId: request.id, request });
    const result = executeRequest(request, config);
    appendNdjson(paths.results, result);
    const posts = await returnResult(result, request, config);
    const returned = posts.some((post) => post.ok);
    if (!returned) appendNdjson(paths.returnQueue, { ts: now(), request, result, posts });
    processed.add(request.id);
    state.processedCount = (state.processedCount || 0) + 1;
    state.returnedCount = (state.returnedCount || 0) + (returned ? 1 : 0);
    state.queuedReturnCount = (state.queuedReturnCount || 0) + (returned ? 0 : 1);
    state.lastResult = {
      requestId: request.id,
      ok: result.ok,
      returned,
      responseSha256: result.responseSha256,
      posts
    };
  }

  state.processedIds = [...processed].slice(-5000);
  state.lastStatus = selected.length ? "processed" : "idle";
  state.pendingRequests = Math.max(0, requests.length - selected.length);
  saveState(state);
  return { config, state, processedThisTick: selected.length };
}

function install() {
  fs.mkdirSync(runRoot, { recursive: true });
  writeJson(paths.config, defaultConfig);
  writeJson(paths.state, loadState());
  writeText(paths.launcher, [
    "@echo off",
    "cd /d C:\\Users\\acer\\Asolaria",
    "node tools\\behcs\\falcon-opencode-proxy-daemon.js --daemon",
    ""
  ].join("\r\n"));
  writeJson(paths.memory, {
    type: "memory",
    eventId,
    status: "FALCON_OPENCODE_PROXY_DAEMON_INSTALLED",
    significance: "Falcon can remain operational as a PID-owned live-free-agent node while Acer is online. Acer executes unsupported OpenCode work as proxy; Falcon ownership and return routing stay explicit.",
    boundary: defaultConfig.boundary
  });
  writeJson(paths.index, {
    eventId,
    runId,
    keys: ["falcon", "opencode", "proxy-daemon", "lx-route-spawn", "pid-owned", "acer-executor"],
    config: repoRel(paths.config),
    launcher: repoRel(paths.launcher)
  });
  writeJson(paths.map, {
    eventId,
    map: [
      ["falcon", "sends", "falcon-opencode-proxy-request"],
      ["acer", "polls", "file queue + LAW-001 inbox"],
      ["acer", "executes", "opencode-ai"],
      ["falcon", "owns", "BH.AGENT.PID.FALCON.PROXY.*"],
      ["law001", "returns", "falcon-opencode-proxy-result"]
    ]
  });
  writeText(paths.cube, `module.exports = ${JSON.stringify({
    eventId,
    cube: "falcon-opencode-proxy-daemon-cube-cubed",
    dimensions: {
      D_DEVICE: "falcon",
      D_OWNER: "falcon-pid-owned",
      D_EXECUTOR: "acer-backend",
      D_TRANSPORT: "LAW-001",
      D_DAEMON: "persistent-while-acer-online",
      D_BOUNDARY: "one-job-per-tick-no-secret-copy-no-native-claim"
    }
  }, null, 2)};\n`);
  writeJson(paths.glpj, {
    eventId,
    sentences: [
      "FALCON REQUESTS.",
      "ACER EXECUTES.",
      "FALCON PID OWNS.",
      "LAW-001 RETURNS.",
      "PROXY IS PERMANENT WHILE ACER ONLINE."
    ],
    glyphs: ["LX-ROUTE-SPAWN", "LX-SPAWN-FREE", "D-LIVE-FREE-AGENT"]
  });
  writeJson(paths.supervisors, {
    supervisorSet: "falcon-opencode-proxy-daemon-supervisors.v1",
    eventId,
    supervisors: [
      {
        pid: "BH.SUPERVISOR.PID.FALCON.PROXY.DAEMON",
        role: "Keeps Falcon live-free-agent proxy route active while Acer is online.",
        verdict: "installed"
      },
      {
        pid: "BH.SUPERVISOR.PID.FALCON.PROXY.QUEUE",
        role: "Accepts Falcon-owned requests from queue or LAW-001 inbox and limits execution to one job per tick.",
        verdict: "bounded"
      },
      {
        pid: "BH.SUPERVISOR.PID.FALCON.PROXY.RETURN",
        role: "Returns proxy results to Falcon/Liris/local bus and spools if transport is unavailable.",
        verdict: "return_or_queue"
      }
    ]
  });
  writeText(paths.report, [
    "# Falcon OpenCode Proxy Daemon",
    "",
    `Installed: ${now()}`,
    "",
    "Status: installed",
    "",
    "Files:",
    `- Config: ${repoRel(paths.config)}`,
    `- Queue: ${repoRel(paths.queue)}`,
    `- Results: ${repoRel(paths.results)}`,
    `- Return queue: ${repoRel(paths.returnQueue)}`,
    `- Launcher: ${repoRel(paths.launcher)}`,
    "",
    `Boundary: ${defaultConfig.boundary}`,
    ""
  ].join("\n"));
  console.log(JSON.stringify({ ok: true, status: "installed", config: repoRel(paths.config), launcher: repoRel(paths.launcher) }, null, 2));
}

function enqueueSmoke() {
  fs.mkdirSync(runRoot, { recursive: true });
  const id = `falcon-proxy-smoke-${Date.now()}`;
  const row = {
    id,
    verb: "falcon-opencode-proxy-request",
    from: "acer-codex",
    target: "falcon",
    lane: "falcon_proxy_smoke",
    model: "opencode/gpt-5-nano",
    prompt: "Return exactly one compact JSON object proving Falcon-owned Acer proxy execution is alive.",
    falconPid: pid("BH.AGENT.PID.FALCON.PROXY", id),
    ts: now()
  };
  appendNdjson(paths.queue, row);
  console.log(JSON.stringify({ ok: true, enqueued: row.id, queue: repoRel(paths.queue) }, null, 2));
}

async function daemon() {
  fs.mkdirSync(runRoot, { recursive: true });
  writeText(paths.pid, String(process.pid));
  const config = loadConfig();
  console.log(JSON.stringify({ ok: true, status: "daemon_started", pid: process.pid, pollIntervalMs: config.pollIntervalMs }));
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const result = await tick();
    fs.appendFileSync(paths.log, `${JSON.stringify({ ts: now(), processedThisTick: result.processedThisTick, lastStatus: result.state.lastStatus })}\n`);
    await new Promise((resolve) => setTimeout(resolve, result.config.pollIntervalMs));
  }
}

async function main() {
  const arg = process.argv[2] || "--once";
  if (arg === "--install") return install();
  if (arg === "--enqueue-smoke") return enqueueSmoke();
  if (arg === "--daemon") return daemon();
  const result = await tick();
  console.log(JSON.stringify({
    ok: true,
    status: result.state.lastStatus,
    processedThisTick: result.processedThisTick,
    state: paths.state,
    queue: paths.queue,
    results: paths.results
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
