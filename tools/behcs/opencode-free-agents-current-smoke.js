#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const http = require("http");
const { spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..", "..");
const runId = "opencode-free-agents-current-smoke-20260427";
const eventId = "EVT-OPENCODE-FREE-AGENTS-CURRENT-SMOKE-2026-04-27";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", runId);

const models = Object.freeze([
  "opencode/big-pickle",
  "opencode/hy3-preview-free",
  "opencode/ling-2.6-flash-free",
  "opencode/minimax-m2.5-free",
  "opencode/nemotron-3-super-free"
]);

const lanes = Object.freeze([
  ["preserve_route", "Confirm free-agent findings must be preserved and routed into BEHCS evidence, not hidden."],
  ["memory_index", "Give one bounded improvement for memory/index permanence after free-agent results."],
  ["falcon_proxy", "Give one bounded improvement for Falcon proxy live-agent reliability without erasing state."],
  ["dirty_worktree", "Give one bounded improvement for dirty worktree cleanup that never deletes evidence."],
  ["supervisor_visibility", "Give one bounded improvement so Hermes/Shannon see free-agent supervisor PIDs."]
]);

const out = Object.freeze({
  modelList: path.join(runRoot, "opencode-models-current.txt"),
  rows: path.join(runRoot, "opencode-free-agent-current-smoke-results.ndjson"),
  summary: path.join(runRoot, "opencode-free-agent-current-smoke-summary.v1.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "opencode-free-agents-current-smoke.v1.json"),
  index: path.join(repoRoot, "data", "behcs", "index", "opencode-free-agents-current-smoke-index.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "opencode-free-agents-current-smoke-map-map-mapped.v1.json"),
  cube: path.join(repoRoot, "data", "behcs", "cubes", "opencode-free-agents-current-smoke-cube-cubed.cube.js"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "opencode-free-agents-current-smoke-behcs256.glpj.json"),
  envelope: path.join(runRoot, "opencode-free-agents-current-smoke-envelope.json"),
  postResults: path.join(runRoot, "opencode-free-agents-current-smoke-post-results.json"),
  reportJson: path.join(repoRoot, "reports", "opencode-free-agents-current-smoke-latest.json"),
  reportMd: path.join(repoRoot, "reports", "opencode-free-agents-current-smoke-latest.md")
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

function writeNdjson(filePath, rows) {
  writeText(filePath, rows.map((row) => JSON.stringify(row)).join("\n"));
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
    const text = line.trim();
    if (!text) continue;
    try {
      events.push(JSON.parse(text));
    } catch (_error) {
      // Keep stdout hash in the row. OpenCode sometimes emits plain diagnostics.
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

function listCurrentModels() {
  const result = spawnSync("opencode", ["models"], {
    cwd: repoRoot,
    encoding: "utf8",
    timeout: 60_000,
    windowsHide: true,
    shell: true
  });
  writeText(out.modelList, result.stdout || "");
  return {
    ok: result.status === 0,
    exitCode: result.status,
    stderr: String(result.stderr || "").slice(0, 2000),
    names: String(result.stdout || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
  };
}

function runModel(model, index, generatedAt) {
  const [lane, question] = lanes[index % lanes.length];
  const agentPid = pid(`${eventId}:${model}:${lane}:${index}`);
  const prompt = [
    "BEHCS-256 LX-SPAWN-FREE current free-agent smoke.",
    `PID=${agentPid}.`,
    `Model=${model}.`,
    `Lane=${lane}.`,
    question,
    "Return one compact JSON object with keys status, lane, finding, route, supervisor.",
    "Do not edit files. Do not run tools. No fanout."
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
    timeout: 120_000,
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
    seq: index + 1,
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
    responseText: text.slice(0, 3000),
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
        let parsedBody = null;
        try {
          parsedBody = JSON.parse(text);
        } catch (_error) {
          parsedBody = text.slice(0, 1000);
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

  const listed = listCurrentModels();
  if (!listed.ok) {
    throw new Error(`opencode models failed: ${listed.stderr}`);
  }
  const presentModels = models.filter((model) => listed.names.includes(model));
  const missingModels = models.filter((model) => !listed.names.includes(model));

  const rows = [];
  for (let i = 0; i < presentModels.length; i += 1) {
    const row = runModel(presentModels[i], i, generatedAt);
    rows.push(row);
    console.log(`${row.ok ? "OK" : "FAIL"} ${row.model} pid=${row.pid} elapsedMs=${row.elapsedMs} cost=${row.cost}`);
  }

  const okCount = rows.filter((row) => row.ok).length;
  const summary = {
    id: "opencode-free-agents-current-smoke-summary.v1",
    generatedAt,
    runId,
    eventId,
    status: okCount === presentModels.length && presentModels.length > 0
      ? "OPENCODE_FREE_AGENTS_CURRENT_SMOKE_OK"
      : "OPENCODE_FREE_AGENTS_CURRENT_SMOKE_PARTIAL",
    d11: okCount > 0
      ? "OBSERVED_REAL_OPENCODE_FREE_AGENT_RESPONSES"
      : "HOLD_NO_REAL_OPENCODE_FREE_AGENT_RESPONSE",
    requestedModels: models,
    presentModels,
    missingModels,
    attempted: rows.length,
    okCount,
    failCount: rows.length - okCount,
    totalCost: rows.reduce((sum, row) => sum + (typeof row.cost === "number" ? row.cost : 0), 0),
    responseShas: rows.map((row) => ({ model: row.model, pid: row.pid, ok: row.ok, sha256: row.responseSha256 })),
    boundary: "Bounded current free-model smoke. This is not a large fanout and not a logical coverage claim.",
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

  writeNdjson(out.rows, rows);
  writeJson(out.summary, summary);
  writeJson(out.memory, {
    id: "memory-opencode-free-agents-current-smoke-v1",
    generatedAt,
    significance: "The current OpenCode free-agent surface was exercised as real bounded calls and preserved into BEHCS evidence.",
    summary
  });
  writeJson(out.index, {
    id: "opencode-free-agents-current-smoke-index.v1",
    generatedAt,
    keys: ["opencode", "free-agent", "LX-SPAWN-FREE", "preserve-route", "current-smoke"],
    rows: rows.map((row) => ({ model: row.model, pid: row.pid, ok: row.ok, responseSha256: row.responseSha256 }))
  });
  writeJson(out.map, {
    id: "opencode-free-agents-current-smoke-map-map-mapped.v1",
    generatedAt,
    nodes: ["OpenCode free models", "PID", "response", "memory", "index", "map", "cube", "GLPJ", "LAW-001"],
    edges: rows.map((row) => [row.model, row.ok ? "produced" : "failed", row.pid])
  });
  writeText(out.cube, `export default ${JSON.stringify({
    id: "opencode-free-agents-current-smoke-cube-cubed.v1",
    generatedAt,
    axes: {
      D_MODEL: presentModels,
      D_PID: rows.map((row) => row.pid),
      D_ROUTE: "LX-SPAWN-FREE",
      D_PROOF: summary.d11,
      D_BOUNDARY: "bounded-real-free-agent-smoke"
    },
    summary
  }, null, 2)};\n`);
  writeJson(out.glpj, {
    id: "opencode-free-agents-current-smoke-behcs256-glpj.v1",
    generatedAt,
    sentences: [
      "META-RUN { OPENCODE-FREE-AGENTS-CURRENT } : LX-SPAWN-FREE : REAL-RESPONSES @ M-EYEWITNESS .",
      "META-PRESERVE { FREE-AGENT-FINDINGS } : INDEX MAP CUBE GLPJ : NOT-HIDDEN @ M-INDICATIVE ."
    ],
    glyphs: ["LX-SPAWN-FREE", "D-LIVE-FREE-AGENT", "EVT-LIVE-FREE-AGENT-RESPONSE"]
  });

  const envelope = {
    verb: "opencode-free-agents-current-smoke-result",
    target: "all-nodes",
    from: "acer-codex",
    id: "opencode-free-agents-current-smoke-20260427-001",
    ts: generatedAt,
    runId,
    eventId,
    summary
  };
  writeJson(out.envelope, envelope);
  const postResults = await postSummary(envelope);
  writeJson(out.postResults, postResults);

  const report = { ...summary, rows, posts: postResults };
  writeJson(out.reportJson, report);
  writeText(out.reportMd, [
    "# OpenCode Free Agents Current Smoke",
    "",
    `Generated: ${generatedAt}`,
    "",
    `Status: ${summary.status}`,
    `D11: ${summary.d11}`,
    `Attempted: ${summary.attempted}`,
    `OK: ${summary.okCount}`,
    `Failed: ${summary.failCount}`,
    `Total cost: ${summary.totalCost}`,
    "",
    "## Rows",
    "",
    ...rows.map((row) => `- ${row.ok ? "OK" : "FAIL"} ${row.model} pid=${row.pid} elapsedMs=${row.elapsedMs} cost=${row.cost} sha=${row.responseSha256.slice(0, 16)}`),
    "",
    "## Posts",
    "",
    ...postResults.map((post) => `- ${post.name}: ${post.ok}`),
    "",
    `Boundary: ${summary.boundary}`
  ].join("\n"));

  console.log(JSON.stringify({
    ok: summary.okCount > 0,
    status: summary.status,
    attempted: summary.attempted,
    okCount: summary.okCount,
    failCount: summary.failCount,
    totalCost: summary.totalCost,
    postsOk: postResults.filter((post) => post.ok).length,
    postsTotal: postResults.length,
    report: repoRel(out.reportMd)
  }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message || String(error));
  process.exit(1);
});
