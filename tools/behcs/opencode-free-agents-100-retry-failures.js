#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const http = require("http");
const { spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..", "..");
const sourceReport = path.join(repoRoot, "reports", "opencode-free-agents-100-sync-latest.json");
const runId = "opencode-free-agents-100-retry-failures-20260427";
const eventId = "EVT-OPENCODE-FREE-AGENTS-100-RETRY-FAILURES-2026-04-27";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", runId);
const timeoutMs = Number(process.env.ASOLARIA_OPENCODE_FREE_AGENT_RETRY_TIMEOUT_MS || 180000);

const out = Object.freeze({
  rows: path.join(runRoot, "opencode-free-agents-100-retry-failures.ndjson"),
  summary: path.join(runRoot, "opencode-free-agents-100-retry-failures-summary.v1.json"),
  envelope: path.join(runRoot, "opencode-free-agents-100-retry-failures-envelope.json"),
  postResults: path.join(runRoot, "opencode-free-agents-100-retry-failures-post-results.json"),
  reportJson: path.join(repoRoot, "reports", "opencode-free-agents-100-retry-failures-latest.json"),
  reportMd: path.join(repoRoot, "reports", "opencode-free-agents-100-retry-failures-latest.md")
});

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeText(filePath, text) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, text.endsWith("\n") ? text : `${text}\n`, "utf8");
}

function writeJson(filePath, value) {
  writeText(filePath, JSON.stringify(value, null, 2));
}

function sha(value) {
  return crypto.createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex");
}

function parseEvents(stdout) {
  const events = [];
  for (const line of String(stdout || "").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      events.push(JSON.parse(trimmed));
    } catch (_error) {
      // Keep stdout hash in row.
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

function runRetry(row, index, generatedAt) {
  const retryPid = `BH.AGENT.PID.RETRY.${sha(`${row.pid}:${index}:${eventId}`).slice(0, 8).toUpperCase()}`;
  const prompt = [
    `BEHCS-256 LX-SPAWN-FREE retry for failed 100-run row ${row.seq}.`,
    `OriginalPID=${row.pid}. RetryPID=${retryPid}.`,
    `Lane=${row.lane}.`,
    "Return compact JSON keys status,lane,finding,action,supervisor.",
    "No tools. No file edits. No fanout. Preserve evidence."
  ].join(" ");
  const started = Date.now();
  const result = spawnSync("opencode", [
    "run",
    "--format",
    "json",
    "-m",
    row.model,
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
      BROWN_HILBERT_PID: retryPid,
      BEHCS256_GLYPH: "LX-SPAWN-FREE",
      ASOLARIA_FREE_AGENT_POLICY: "PRESERVE_ROUTE_NOT_QUARANTINE",
      ASOLARIA_BOUNDARY: "NO_FILE_EDITS_NO_TOOLS_NO_FANOUT"
    }
  });
  const events = parseEvents(result.stdout);
  const text = extractText(events);
  const finish = events.find((event) => event.type === "step_finish");
  return {
    retrySeq: index + 1,
    originalSeq: row.seq,
    ts: generatedAt,
    runId,
    eventId,
    model: row.model,
    lane: row.lane,
    originalPid: row.pid,
    retryPid,
    ok: result.status === 0 && text.length > 0,
    exitCode: result.status,
    signal: result.signal,
    timedOut: Boolean(result.error && result.error.code === "ETIMEDOUT"),
    elapsedMs: Date.now() - started,
    responseText: text.slice(0, 2000),
    responseSha256: sha(text || ""),
    eventCount: events.length,
    tokens: finish?.part?.tokens || null,
    cost: typeof finish?.part?.cost === "number" ? finish.part.cost : null,
    stdoutSha256: sha(result.stdout || ""),
    stderr: String(result.stderr || "").slice(0, 2000),
    error: result.error ? String(result.error.message || result.error).slice(0, 1000) : "",
    boundary: "Retry of failed 100-run row; real OpenCode free-agent call, no tools, no file edits, no fanout."
  };
}

function httpJson(url, body) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const payload = JSON.stringify(body);
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path: parsed.pathname + parsed.search,
      method: "POST",
      timeout: 5000,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload)
      }
    }, (res) => {
      let text = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        text += chunk;
      });
      res.on("end", () => {
        let bodyValue = text.slice(0, 1000);
        try {
          bodyValue = JSON.parse(text);
        } catch (_error) {
          // keep text
        }
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode, body: bodyValue });
      });
    });
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", (error) => resolve({ ok: false, error: error.message }));
    req.write(payload);
    req.end();
  });
}

async function postSummary(envelope) {
  const targets = [
    ["acer-local", "http://127.0.0.1:4947/behcs/send"],
    ["liris-cable", "http://192.168.100.2:4947/behcs/send"],
    ["falcon-law001", "http://192.168.1.8:4947/behcs/send"]
  ];
  const results = [];
  for (const [name, url] of targets) {
    const result = await httpJson(url, envelope);
    results.push({ name, url, ...result });
  }
  return results;
}

async function main() {
  const generatedAt = new Date().toISOString();
  const source = JSON.parse(fs.readFileSync(sourceReport, "utf8"));
  const failures = source.rows.filter((row) => !row.ok);
  fs.mkdirSync(runRoot, { recursive: true });
  const retries = failures.map((row, index) => {
    const retry = runRetry(row, index, generatedAt);
    console.log(`${retry.ok ? "OK" : "FAIL"} retry original=${retry.originalSeq} model=${retry.model} retryPid=${retry.retryPid} ms=${retry.elapsedMs} cost=${retry.cost}`);
    return retry;
  });
  writeText(out.rows, retries.map((row) => JSON.stringify(row)).join("\n"));
  const summary = {
    id: "opencode-free-agents-100-retry-failures-summary.v1",
    generatedAt,
    runId,
    eventId,
    sourceRunId: source.runId,
    originalAttempted: source.attempted,
    originalOkCount: source.okCount,
    originalFailCount: source.failCount,
    retryAttempted: retries.length,
    retryOkCount: retries.filter((row) => row.ok).length,
    retryFailCount: retries.filter((row) => !row.ok).length,
    combinedOkResponses: source.okCount + retries.filter((row) => row.ok).length,
    combinedAttempts: source.attempted + retries.length,
    totalRetryCost: retries.reduce((sum, row) => sum + (typeof row.cost === "number" ? row.cost : 0), 0),
    d11: retries.every((row) => row.ok) ? "OBSERVED_100_SUCCESSFUL_OPENCODE_FREE_AGENT_RESPONSES_AFTER_RETRY" : "OBSERVED_PARTIAL_RETRY_RECOVERY",
    boundary: "Retries only failed rows from the 100 sync run; no tools, no file edits, no fanout."
  };
  writeJson(out.summary, summary);
  const envelope = {
    verb: "opencode-free-agents-100-retry-failures-result",
    target: "all-nodes",
    from: "acer-codex",
    id: "opencode-free-agents-100-retry-failures-20260427-001",
    ts: generatedAt,
    runId,
    eventId,
    summary
  };
  writeJson(out.envelope, envelope);
  const postResults = await postSummary(envelope);
  writeJson(out.postResults, postResults);
  const report = { ...summary, retries, posts: postResults };
  writeJson(out.reportJson, report);
  writeText(out.reportMd, [
    "# OpenCode Free Agents 100 Retry Failures",
    "",
    `Generated: ${generatedAt}`,
    "",
    `Original OK: ${summary.originalOkCount}/${summary.originalAttempted}`,
    `Retry OK: ${summary.retryOkCount}/${summary.retryAttempted}`,
    `Combined successful responses: ${summary.combinedOkResponses}/${summary.combinedAttempts} attempts`,
    `Retry cost: ${summary.totalRetryCost}`,
    "",
    "## Retries",
    "",
    ...retries.map((row) => `- ${row.ok ? "OK" : "FAIL"} original=${row.originalSeq} ${row.model} retryPid=${row.retryPid} elapsedMs=${row.elapsedMs} cost=${row.cost} sha=${row.responseSha256.slice(0, 16)}`),
    "",
    "## Posts",
    "",
    ...postResults.map((post) => `- ${post.name}: ${post.ok}`),
    "",
    `Boundary: ${summary.boundary}`
  ].join("\n"));
  console.log(JSON.stringify({
    ok: summary.retryFailCount === 0,
    combinedOkResponses: summary.combinedOkResponses,
    combinedAttempts: summary.combinedAttempts,
    postsOk: postResults.filter((post) => post.ok).length,
    postsTotal: postResults.length,
    report: path.relative(repoRoot, out.reportMd).replace(/\\/g, "/")
  }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message || String(error));
  process.exit(1);
});
