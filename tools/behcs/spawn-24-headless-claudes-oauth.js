#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const os = require("os");
const http = require("http");
const { spawn } = require("child_process");

const repoRoot = path.resolve(__dirname, "..", "..");
const runId = "spawn-24-headless-claudes-oauth-20260427";
const eventId = "EVT-SPAWN-24-HEADLESS-CLAUDES-OAUTH-2026-04-27";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", runId);
const claudeExe = "C:\\nvm4w\\nodejs\\node_modules\\@anthropic-ai\\claude-code\\bin\\claude.exe";
const emptyMcp = path.join(repoRoot, "config", "empty-mcp.json");
const corpusPath = path.join(repoRoot, "data", "behcs", "orchestration", "dirty-truth-check-10k-20260427", "acer-per-file-majority.v1.ndjson");

const lanes = Object.freeze(["vector", "rook", "forge", "falcon", "helm", "sentinel"]);
const cyclesPerLane = 4;
const totalAgents = lanes.length * cyclesPerLane;
const concurrency = 3;
const timeoutMs = Number(process.env.ASOLARIA_CLAUDE24_TIMEOUT_MS || 30_000);

const paths = Object.freeze({
  attempts: path.join(runRoot, "attempts.ndjson"),
  summary: path.join(runRoot, "summary.v1.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "spawn-24-headless-claudes-oauth.v1.json"),
  index: path.join(repoRoot, "data", "behcs", "index", "spawn-24-headless-claudes-oauth-index.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "spawn-24-headless-claudes-oauth-map-map-mapped.v1.json"),
  cube: path.join(repoRoot, "data", "behcs", "cubes", "spawn-24-headless-claudes-oauth-cube-cubed.cube.js"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "spawn-24-headless-claudes-oauth-behcs256.glpj.json"),
  reportJson: path.join(repoRoot, "reports", "spawn-24-headless-claudes-oauth-latest.json"),
  reportMd: path.join(repoRoot, "reports", "spawn-24-headless-claudes-oauth-latest.md"),
  postResult: path.join(runRoot, "post-result.v1.json")
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

function sha(value) {
  return crypto.createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex");
}

function repoRel(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/");
}

function readNdjson(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, "utf8").split(/\r?\n/).filter(Boolean).map((line) => {
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  }).filter(Boolean);
}

function pidFor(lane, seq) {
  const seed = `${os.hostname()}|acer|${lane}|${seq}|${runId}`;
  return `BH.AGENT.PID.CLAUDE24.${sha(seed).slice(0, 12).toUpperCase()}`;
}

function systemPrompt(lane, seq, pid) {
  return [
    `BEHCS-256 headless Claude lane=${lane} agent=${seq}/${totalAgents} pid=${pid}`,
    "Subscription OAuth only. Do not use API key auth. No tools. No file edits. No shell commands.",
    "Classify the provided dirty-file rows and answer as compact JSON:",
    "{\"agent_pid\":\"...\",\"lane\":\"...\",\"verdict\":\"actually_dirty|clean_false_positive|sensitive_hold|artifact_legit|unknown_needs_review\",\"risk\":\"low|hold\",\"notes\":\"short\"}",
    "Use sensitive_hold for kernel/sovereignty/vault/firmware/driver/registry/private surfaces.",
    "Use artifact_legit for data/reports/captures/logs generated artifacts.",
    "Use actually_dirty for intentional source/tool changes that need review.",
    "No prose outside JSON."
  ].join("\n");
}

function sampleRows(corpus, seq) {
  if (!corpus.length) return "NO_CORPUS_ROWS";
  const start = ((seq - 1) * 5) % corpus.length;
  return Array.from({ length: Math.min(5, corpus.length) }, (_, offset) => {
    const row = corpus[(start + offset) % corpus.length];
    return `${row.path || row.file || "unknown"} status=${row.status || row.majority_verdict || "unknown"}`;
  }).join("\n");
}

function runAgent(task, corpus) {
  return new Promise((resolve) => {
    const startedAt = new Date().toISOString();
    const startedMs = Date.now();
    const prompt = [
      "BEHCS-256 CLAUDE24 DIRTY-CORPUS CLASSIFICATION PROBE.",
      `AgentPID=${task.pid}`,
      `Lane=${task.lane}`,
      "Rows:",
      sampleRows(corpus, task.seq)
    ].join("\n");
    const args = [
      "-p",
      "--input-format", "text",
      "--output-format", "text",
      "--system-prompt", systemPrompt(task.lane, task.seq, task.pid),
      "--no-session-persistence",
      "--disable-slash-commands",
      "--exclude-dynamic-system-prompt-sections",
      "--tools", "",
      "--setting-sources", "user",
      prompt
    ];
    const env = {
      ...process.env,
      NO_COLOR: "1",
      FORCE_COLOR: "0",
      TERM: "dumb",
      CLAUDE_NO_ANALYTICS: "1",
      CLAUDE_CODE_SIMPLE: "1",
      BROWN_HILBERT_PID: task.pid,
      BEHCS256_GLYPH: "LX-SPAWN-FREE",
      ASOLARIA_BOUNDARY: "NO_TOOLS_NO_FILE_EDITS_NO_SHELL_NO_FANOUT"
    };
    delete env.ANTHROPIC_API_KEY;
    delete env.OPENAI_API_KEY;

    const proc = spawn(claudeExe, args, {
      cwd: repoRoot,
      env,
      windowsHide: true,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"]
    });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      try {
        proc.kill("SIGTERM");
      } catch {}
      setTimeout(() => {
        if (!proc.killed) {
          try {
            proc.kill("SIGKILL");
          } catch {}
        }
      }, 2000);
    }, timeoutMs);

    proc.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    proc.on("error", (error) => {
      clearTimeout(timer);
      const row = {
        ...task,
        startedAt,
        finishedAt: new Date().toISOString(),
        ok: false,
        error: error.message,
        timedOut,
        elapsedMs: Date.now() - startedMs,
        stdoutSha256: sha(stdout),
        stderrTail: stderr.slice(-1000)
      };
      appendNdjson(paths.attempts, row);
      resolve(row);
    });
    proc.on("exit", (code, signal) => {
      clearTimeout(timer);
      const responseText = stdout.trim();
      const row = {
        ...task,
        startedAt,
        finishedAt: new Date().toISOString(),
        ok: code === 0 && responseText.length > 0,
        exitCode: code,
        signal,
        timedOut,
        elapsedMs: Date.now() - startedMs,
        responseText: responseText.slice(0, 2000),
        responseSha256: sha(responseText),
        stderrTail: stderr.slice(-1000),
        boundary: "Headless subscription OAuth Claude attempt; no tools, no file edits, no shell commands inside agent."
      };
      appendNdjson(paths.attempts, row);
      resolve(row);
    });
  });
}

function postJson(url, body) {
  return new Promise((resolve) => {
    const payload = Buffer.from(JSON.stringify(body), "utf8");
    const target = new URL(url);
    const req = http.request({
      hostname: target.hostname,
      port: target.port || 80,
      path: target.pathname,
      method: "POST",
      timeout: 5000,
      headers: {
        "content-type": "application/json",
        "content-length": payload.length,
        connection: "close"
      }
    }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        let parsed = Buffer.concat(chunks).toString("utf8");
        try {
          parsed = JSON.parse(parsed);
        } catch {}
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode, body: parsed });
      });
    });
    req.on("timeout", () => req.destroy(new Error("request_timeout")));
    req.on("error", (error) => resolve({ ok: false, error: error.message }));
    req.write(payload);
    req.end();
  });
}

async function runPool(tasks, corpus) {
  const results = [];
  let cursor = 0;
  async function worker() {
    while (cursor < tasks.length) {
      const task = tasks[cursor++];
      console.log(`CLAUDE24 start ${task.seq}/${totalAgents} lane=${task.lane} pid=${task.pid}`);
      const result = await runAgent(task, corpus);
      results.push(result);
      console.log(`CLAUDE24 done  ${task.seq}/${totalAgents} ok=${result.ok} timeout=${result.timedOut} elapsed=${result.elapsedMs}ms`);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results.sort((a, b) => a.seq - b.seq);
}

async function main() {
  fs.mkdirSync(runRoot, { recursive: true });
  writeText(paths.attempts, "");
  if (!fs.existsSync(emptyMcp)) writeJson(emptyMcp, { mcpServers: {} });
  const corpus = readNdjson(corpusPath);
  const tasks = [];
  let seq = 0;
  for (let cycle = 1; cycle <= cyclesPerLane; cycle += 1) {
    for (const lane of lanes) {
      seq += 1;
      tasks.push({ seq, lane, cycle, pid: pidFor(lane, seq) });
    }
  }
  const startedAt = new Date().toISOString();
  const results = await runPool(tasks, corpus);
  const okCount = results.filter((row) => row.ok).length;
  const timeoutCount = results.filter((row) => row.timedOut).length;
  const summary = {
    id: "spawn-24-headless-claudes-oauth-summary.v1",
    generatedAt: new Date().toISOString(),
    startedAt,
    runId,
    eventId,
    status: okCount === totalAgents
      ? "SPAWN_24_HEADLESS_CLAUDES_COMPLETE"
      : okCount > 0
        ? "SPAWN_24_HEADLESS_CLAUDES_PARTIAL"
        : "SPAWN_24_HEADLESS_CLAUDES_ATTEMPTED_ALL_TIMED_OUT_OR_FAILED",
    d11: okCount > 0 ? "OBSERVED_HEADLESS_CLAUDE_OAUTH_PARTIAL" : "OBSERVED_CLAUDE_OAUTH_HEADLESS_HANG_ON_ACER",
    requestedAgents: totalAgents,
    attemptedAgents: results.length,
    okCount,
    timeoutCount,
    concurrency,
    timeoutMs,
    corpusRowsObserved: corpus.length,
    claudeExe,
    authMode: "subscription OAuth; ANTHROPIC_API_KEY removed from child env",
    boundary: "No API key use, no tools, no file edits, no shell commands inside agents, no uncontrolled fanout."
  };
  const artifacts = {
    attempts: repoRel(paths.attempts),
    summary: repoRel(paths.summary),
    memory: repoRel(paths.memory),
    index: repoRel(paths.index),
    map: repoRel(paths.map),
    cube: repoRel(paths.cube),
    glpj: repoRel(paths.glpj),
    reportJson: repoRel(paths.reportJson),
    reportMd: repoRel(paths.reportMd)
  };
  writeJson(paths.summary, summary);
  writeJson(paths.memory, {
    type: "memory",
    eventId,
    status: summary.status,
    significance: "Acer attempted the requested 24 headless subscription-OAuth Claude CLI agents with PID preload and no tools. The run is recorded honestly; if all agents time out, the blocker is Acer's Claude Code non-interactive OAuth path, not the BEHCS PID fabric.",
    summary,
    artifacts
  });
  writeJson(paths.index, {
    eventId,
    runId,
    keys: ["claude", "subscription-oauth", "headless", "pid-preload", "lx-spawn-free", "dirty-corpus", "no-tools"],
    status: summary.status,
    artifacts
  });
  writeJson(paths.map, {
    eventId,
    map: [
      ["operator", "orders", "24-headless-claude-agents"],
      ["acer", "clears", "ANTHROPIC_API_KEY"],
      ["claude", "auth", "subscription-oauth"],
      ["agent", "receives", "BEHCS PID system prompt"],
      ["agent", "denied", "tools/file-edits/shell"],
      ["result", "sealed", "memory+index+map+cube+glpj"]
    ]
  });
  writeText(paths.cube, `module.exports = ${JSON.stringify({
    eventId,
    cube: "spawn-24-headless-claudes-oauth-cube-cubed",
    dimensions: {
      D_AGENT_COUNT: totalAgents,
      D_AUTH: "subscription-oauth",
      D_API_KEY: "removed-from-child-env",
      D_TOOLS: "disabled",
      D_CONCURRENCY: concurrency,
      D_BOUNDARY: "no-tools-no-file-edits-no-shell-no-fanout"
    },
    summary
  }, null, 2)};\n`);
  writeJson(paths.glpj, {
    eventId,
    sentences: [
      "SPAWN 24 HEADLESS CLAUDES ATTEMPTED.",
      "SUBSCRIPTION OAUTH PATH USED.",
      "ANTHROPIC API KEY REMOVED FROM CHILD ENV.",
      "BEHCS PID PRELOADED THROUGH SYSTEM PROMPT.",
      "TOOLS FILE EDITS SHELL AND FANOUT DISABLED."
    ],
    glyphs: ["LX-SPAWN-FREE", "D-LIVE-FREE-AGENT", "EVT-LIVE-FREE-AGENT-SPAWN"]
  });
  writeJson(paths.reportJson, { ...summary, artifacts });
  writeText(paths.reportMd, [
    "# Spawn 24 Headless Claudes OAuth",
    "",
    `Generated: ${summary.generatedAt}`,
    "",
    `Status: ${summary.status}`,
    `D11: ${summary.d11}`,
    "",
    "Counts:",
    `- Requested agents: ${summary.requestedAgents}`,
    `- Attempted agents: ${summary.attemptedAgents}`,
    `- OK: ${summary.okCount}`,
    `- Timed out: ${summary.timeoutCount}`,
    `- Concurrency: ${summary.concurrency}`,
    `- Timeout ms: ${summary.timeoutMs}`,
    "",
    "Mode:",
    `- Claude executable: ${summary.claudeExe}`,
    `- Auth: ${summary.authMode}`,
    "- PID preload: system prompt + BROWN_HILBERT_PID env",
    "- Tools: disabled",
    "",
    `Boundary: ${summary.boundary}`,
    ""
  ].join("\n"));

  const envelope = {
    verb: "spawn-24-headless-claudes-oauth-result",
    target: "all-active-nodes",
    from: "acer-codex",
    id: "spawn-24-headless-claudes-oauth-20260427-acer-result-001",
    ts: summary.generatedAt,
    eventId,
    status: summary.status,
    d11: summary.d11,
    okCount,
    timeoutCount,
    artifacts,
    boundary: summary.boundary
  };
  const posts = {
    acer: await postJson("http://127.0.0.1:4947/behcs/send", { ...envelope, target: "acer" }),
    liris: await postJson("http://192.168.100.2:4947/behcs/send", { ...envelope, target: "liris" }),
    falcon: await postJson("http://192.168.1.8:4947/behcs/send", { ...envelope, target: "falcon" })
  };
  writeJson(paths.postResult, { postedAt: new Date().toISOString(), posts });
  console.log(JSON.stringify({ ok: okCount > 0, status: summary.status, okCount, timeoutCount, posts, artifacts: { ...artifacts, postResult: repoRel(paths.postResult) } }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
