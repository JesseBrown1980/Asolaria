#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const http = require("http");
const { spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..", "..");
const runId = "opencode-free-agents-100-sync-run-20260427";
const eventId = "EVT-OPENCODE-FREE-AGENTS-100-SYNC-RUN-2026-04-27";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", runId);
const totalAgents = Number(process.env.ASOLARIA_OPENCODE_FREE_AGENT_COUNT || 100);
const timeoutMs = Number(process.env.ASOLARIA_OPENCODE_FREE_AGENT_TIMEOUT_MS || 120000);

const models = Object.freeze([
  "opencode/big-pickle",
  "opencode/hy3-preview-free",
  "opencode/ling-2.6-flash-free",
  "opencode/minimax-m2.5-free",
  "opencode/nemotron-3-super-free"
]);

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

const out = Object.freeze({
  rows: path.join(runRoot, "opencode-free-agents-100-sync-results.ndjson"),
  summary: path.join(runRoot, "opencode-free-agents-100-sync-summary.v1.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "opencode-free-agents-100-sync-run.v1.json"),
  index: path.join(repoRoot, "data", "behcs", "index", "opencode-free-agents-100-sync-run-index.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "opencode-free-agents-100-sync-run-map-map-mapped.v1.json"),
  cube: path.join(repoRoot, "data", "behcs", "cubes", "opencode-free-agents-100-sync-run-cube-cubed.cube.js"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "opencode-free-agents-100-sync-run-behcs256.glpj.json"),
  envelope: path.join(runRoot, "opencode-free-agents-100-sync-envelope.json"),
  postResults: path.join(runRoot, "opencode-free-agents-100-sync-post-results.json"),
  reportJson: path.join(repoRoot, "reports", "opencode-free-agents-100-sync-latest.json"),
  reportMd: path.join(repoRoot, "reports", "opencode-free-agents-100-sync-latest.md")
});

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

function repoRel(filePath) {
  const rel = path.relative(repoRoot, filePath);
  return (path.isAbsolute(rel) || rel.startsWith("..") ? filePath : rel).replace(/\\/g, "/");
}

function sha(value) {
  return crypto.createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex");
}

function pid(seed) {
  return `BH.AGENT.PID.${sha(seed).slice(0, 12).toUpperCase()}`;
}

function parseEvents(stdout) {
  const events = [];
  for (const line of String(stdout || "").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      events.push(JSON.parse(trimmed));
    } catch (_error) {
      // Raw stdout hash is retained.
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

function runOne(seq, generatedAt) {
  const model = models[(seq - 1) % models.length];
  const lane = lanes[(seq - 1) % lanes.length];
  const agentPid = pid(`${eventId}:${model}:${lane}:${seq}`);
  const prompt = [
    `BEHCS-256 LX-SPAWN-FREE agent ${seq}/${totalAgents}.`,
    `PID=${agentPid}.`,
    `Lane=${lane}.`,
    "Return compact JSON keys status,lane,finding,action,supervisor.",
    "No tools. No file edits. No fanout. Preserve evidence."
  ].join(" ");
  const started = Date.now();
  const result = spawnSync("opencode", [
    "run",
    "--format",
    "json",
    "-m",
    model,
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
    seq,
    ts: generatedAt,
    runId,
    eventId,
    model,
    lane,
    pid: agentPid,
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
    boundary: "Real OpenCode free-agent call, no file edits requested, no tools requested, no fanout."
  };
}

function summarize(generatedAt, rows, postResults = []) {
  const okRows = rows.filter((row) => row.ok);
  return {
    id: "opencode-free-agents-100-sync-summary.v1",
    generatedAt,
    runId,
    eventId,
    status: okRows.length === totalAgents ? "OPENCODE_FREE_AGENTS_100_SYNC_RUN_OK" : "OPENCODE_FREE_AGENTS_100_SYNC_RUN_PARTIAL",
    d11: okRows.length > 0 ? "OBSERVED_REAL_OPENCODE_FREE_AGENT_RESPONSES_100_BOUND" : "HOLD_NO_REAL_OPENCODE_FREE_AGENT_RESPONSE",
    totalAgents,
    concurrency: 1,
    timeoutMs,
    models,
    attempted: rows.length,
    okCount: okRows.length,
    failCount: rows.length - okRows.length,
    timedOutCount: rows.filter((row) => row.timedOut).length,
    totalCost: rows.reduce((sum, row) => sum + (typeof row.cost === "number" ? row.cost : 0), 0),
    totalTokens: rows.reduce((sum, row) => sum + (row.tokens?.total || 0), 0),
    modelCounts: Object.fromEntries(models.map((model) => [model, rows.filter((row) => row.model === model).length])),
    modelOkCounts: Object.fromEntries(models.map((model) => [model, rows.filter((row) => row.model === model && row.ok).length])),
    postsOk: postResults.filter((post) => post.ok).length,
    postsTotal: postResults.length,
    boundary: "100 real sequential OpenCode free-agent calls. This is not a large fanout and not a logical coverage claim.",
    artifacts: {
      rows: repoRel(out.rows),
      memory: repoRel(out.memory),
      index: repoRel(out.index),
      map: repoRel(out.map),
      cube: repoRel(out.cube),
      glpj: repoRel(out.glpj),
      report: repoRel(out.reportMd)
    }
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
        let parsedBody = text.slice(0, 1000);
        try {
          parsedBody = JSON.parse(text);
        } catch (_error) {
          // keep text body
        }
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode, body: parsedBody });
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
  fs.mkdirSync(runRoot, { recursive: true });
  writeText(out.rows, "");

  const rows = [];
  for (let seq = 1; seq <= totalAgents; seq += 1) {
    const row = runOne(seq, generatedAt);
    rows.push(row);
    appendText(out.rows, JSON.stringify(row));
    const cost = row.cost === null ? "null" : String(row.cost);
    console.log(`${row.ok ? "OK" : "FAIL"} ${String(seq).padStart(3, "0")}/${totalAgents} ${row.model} pid=${row.pid} ms=${row.elapsedMs} cost=${cost} sha=${row.responseSha256.slice(0, 12)}`);
    writeJson(out.summary, summarize(generatedAt, rows));
  }

  const prePostSummary = summarize(generatedAt, rows);
  writeJson(out.memory, {
    id: "memory-opencode-free-agents-100-sync-run-v1",
    generatedAt,
    significance: "100 real sequential OpenCode free-agent calls were attempted with row-level evidence preserved into BEHCS memory/index/map/cube/GLPJ.",
    summary: prePostSummary
  });
  writeJson(out.index, {
    id: "opencode-free-agents-100-sync-run-index.v1",
    generatedAt,
    keys: ["opencode", "free-agent", "100-real-calls", "LX-SPAWN-FREE", "sync"],
    rows: rows.map((row) => ({ seq: row.seq, model: row.model, lane: row.lane, pid: row.pid, ok: row.ok, responseSha256: row.responseSha256 }))
  });
  writeJson(out.map, {
    id: "opencode-free-agents-100-sync-run-map-map-mapped.v1",
    generatedAt,
    nodes: ["100 OpenCode free-agent calls", "PID", "response", "memory", "index", "map", "cube", "GLPJ", "LAW-001"],
    edges: rows.map((row) => [row.model, row.ok ? "produced" : "failed", row.pid])
  });
  writeText(out.cube, `export default ${JSON.stringify({
    id: "opencode-free-agents-100-sync-run-cube-cubed.v1",
    generatedAt,
    axes: {
      D_AGENT_COUNT: totalAgents,
      D_CONCURRENCY: 1,
      D_MODEL: models,
      D_ROUTE: "LX-SPAWN-FREE",
      D_PROOF: prePostSummary.d11,
      D_BOUNDARY: "bounded-real-free-agent-100-sync-run"
    },
    summary: prePostSummary
  }, null, 2)};\n`);
  writeJson(out.glpj, {
    id: "opencode-free-agents-100-sync-run-behcs256-glpj.v1",
    generatedAt,
    sentences: [
      "META-RUN { OPENCODE-FREE-AGENTS-100-SYNC } : LX-SPAWN-FREE : REAL-RESPONSES @ M-EYEWITNESS .",
      "META-PRESERVE { FREE-AGENT-ROWS } : NDJSON INDEX MAP CUBE GLPJ : NOT-HIDDEN @ M-INDICATIVE ."
    ],
    glyphs: ["LX-SPAWN-FREE", "D-LIVE-FREE-AGENT", "EVT-LIVE-FREE-AGENT-RESPONSE", "META-LIVE-FREE-AGENT-EMPIRICAL-PROVEN"]
  });

  const envelope = {
    verb: "opencode-free-agents-100-sync-run-result",
    target: "all-nodes",
    from: "acer-codex",
    id: "opencode-free-agents-100-sync-run-20260427-001",
    ts: generatedAt,
    runId,
    eventId,
    summary: prePostSummary
  };
  writeJson(out.envelope, envelope);
  const postResults = await postSummary(envelope);
  writeJson(out.postResults, postResults);

  const summary = summarize(generatedAt, rows, postResults);
  writeJson(out.summary, summary);
  const report = { ...summary, rows, posts: postResults };
  writeJson(out.reportJson, report);
  writeText(out.reportMd, [
    "# OpenCode Free Agents 100 Sync Run",
    "",
    `Generated: ${generatedAt}`,
    "",
    `Status: ${summary.status}`,
    `D11: ${summary.d11}`,
    `Attempted: ${summary.attempted}`,
    `OK: ${summary.okCount}`,
    `Failed: ${summary.failCount}`,
    `Timed out: ${summary.timedOutCount}`,
    `Total cost: ${summary.totalCost}`,
    `Total tokens: ${summary.totalTokens}`,
    "",
    "## Model Counts",
    "",
    ...models.map((model) => `- ${model}: ${summary.modelOkCounts[model]}/${summary.modelCounts[model]} OK`),
    "",
    "## Rows",
    "",
    ...rows.map((row) => `- ${row.ok ? "OK" : "FAIL"} ${String(row.seq).padStart(3, "0")} ${row.model} lane=${row.lane} pid=${row.pid} elapsedMs=${row.elapsedMs} cost=${row.cost} sha=${row.responseSha256.slice(0, 16)}`),
    "",
    "## Posts",
    "",
    ...postResults.map((post) => `- ${post.name}: ${post.ok}`),
    "",
    `Boundary: ${summary.boundary}`
  ].join("\n"));

  console.log(JSON.stringify({
    ok: summary.okCount === totalAgents,
    status: summary.status,
    attempted: summary.attempted,
    okCount: summary.okCount,
    failCount: summary.failCount,
    timedOutCount: summary.timedOutCount,
    totalCost: summary.totalCost,
    postsOk: summary.postsOk,
    postsTotal: summary.postsTotal,
    report: repoRel(out.reportMd)
  }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message || String(error));
  process.exit(1);
});
