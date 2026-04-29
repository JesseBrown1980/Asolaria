#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const http = require("http");
const { spawn, spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..", "..");
const runId = "opencode-free-agents-100-run-20260427";
const eventId = "EVT-OPENCODE-FREE-AGENTS-100-RUN-2026-04-27";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", runId);

const totalAgents = Number(process.env.ASOLARIA_OPENCODE_FREE_AGENT_COUNT || 100);
const concurrency = Number(process.env.ASOLARIA_OPENCODE_FREE_AGENT_CONCURRENCY || 5);
const timeoutMs = Number(process.env.ASOLARIA_OPENCODE_FREE_AGENT_TIMEOUT_MS || 180000);

const freeModels = Object.freeze([
  "opencode/big-pickle",
  "opencode/hy3-preview-free",
  "opencode/ling-2.6-flash-free",
  "opencode/minimax-m2.5-free",
  "opencode/nemotron-3-super-free"
]);

const lanes = Object.freeze([
  ["preserve_route", "preserve every free-agent finding as BEHCS evidence"],
  ["memory_index", "make free-agent result memory/index durable"],
  ["map_cube_glpj", "map-map-mapped and cube-cube-cubed result routing"],
  ["falcon_proxy", "keep Falcon proxy reliable without erasing state"],
  ["liris_bridge", "keep Liris LAW-001 bridge visible and replayable"],
  ["dirty_worktree", "classify dirty files without deleting or reverting"],
  ["supervisor_pid", "keep all supervisor PIDs visible to Hermes/Shannon"],
  ["hookwall", "route findings through Hookwall before promotion"],
  ["gnn_reverse_gain", "bind GNN and reverse-gain checks to promotion"],
  ["white_room_gc", "preserve source evidence through white-room GC"],
  ["mcp_policy", "use Asolaria BEHCS MCP policy before external MCP"],
  ["energy_gate", "keep free-agent calls bounded by energy and evidence"],
  ["auth_truth", "avoid auth/payment/provider bypass claims"],
  ["device_pid", "maintain device-specific PIDs without firmware mutation"],
  ["termux_frontend", "keep Falcon Termux frontend spawn route honest"],
  ["timescale", "keep Falcon/Liris/Acer timing evidence comparable"],
  ["shannon", "ensure Shannon gates evidence not hype"],
  ["hermes", "ensure Hermes sees all free-agent supervisor lanes"],
  ["sentinel_kr", "keep Sentinel KR quorum profile instantiable"],
  ["report_proof", "make reports cite exact rows, hashes, and boundaries"]
]);

const out = Object.freeze({
  modelList: path.join(runRoot, "opencode-models-current.txt"),
  rows: path.join(runRoot, "opencode-free-agents-100-results.ndjson"),
  summary: path.join(runRoot, "opencode-free-agents-100-summary.v1.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "opencode-free-agents-100-run.v1.json"),
  index: path.join(repoRoot, "data", "behcs", "index", "opencode-free-agents-100-run-index.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "opencode-free-agents-100-run-map-map-mapped.v1.json"),
  cube: path.join(repoRoot, "data", "behcs", "cubes", "opencode-free-agents-100-run-cube-cubed.cube.js"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "opencode-free-agents-100-run-behcs256.glpj.json"),
  envelope: path.join(runRoot, "opencode-free-agents-100-envelope.json"),
  postResults: path.join(runRoot, "opencode-free-agents-100-post-results.json"),
  reportJson: path.join(repoRoot, "reports", "opencode-free-agents-100-latest.json"),
  reportMd: path.join(repoRoot, "reports", "opencode-free-agents-100-latest.md")
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
      // Raw output is hashed on the row.
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

function listModels() {
  const result = spawnSync("opencode", ["models"], {
    cwd: repoRoot,
    encoding: "utf8",
    timeout: 60000,
    windowsHide: true,
    shell: true
  });
  writeText(out.modelList, result.stdout || "");
  if (result.status !== 0) {
    throw new Error(`opencode models failed: ${String(result.stderr || "").slice(0, 1000)}`);
  }
  return String(result.stdout || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function runAgent(seq, generatedAt) {
  return new Promise((resolve) => {
    const model = freeModels[(seq - 1) % freeModels.length];
    const [lane, task] = lanes[(seq - 1) % lanes.length];
    const agentPid = pid(`${eventId}:${model}:${lane}:${seq}`);
    const prompt = [
      "BEHCS-256 LX-SPAWN-FREE 100-agent bounded run.",
      `PID=${agentPid}.`,
      `Agent=${seq}/${totalAgents}.`,
      `Model=${model}.`,
      `Lane=${lane}.`,
      `Task: ${task}.`,
      "Return one compact JSON object with keys status, lane, finding, action, supervisor.",
      "Do not edit files. Do not run tools. No fanout. No secrets. No auth bypass."
    ].join(" ");

    const args = ["run", "--format", "json", "-m", model, "--dir", repoRoot, prompt];
    const started = Date.now();
    const child = spawn("opencode", args, {
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

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
      if (stdout.length > 2_000_000) stdout = stdout.slice(-2_000_000);
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
      if (stderr.length > 50_000) stderr = stderr.slice(-50_000);
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      const row = makeRow({ seq, generatedAt, model, lane, agentPid, started, stdout, stderr, timedOut, error, exitCode: null, signal: null });
      resolve(row);
    });
    child.on("exit", (exitCode, signal) => {
      clearTimeout(timer);
      const row = makeRow({ seq, generatedAt, model, lane, agentPid, started, stdout, stderr, timedOut, error: null, exitCode, signal });
      resolve(row);
    });
  });
}

function makeRow({ seq, generatedAt, model, lane, agentPid, started, stdout, stderr, timedOut, error, exitCode, signal }) {
  const events = parseEvents(stdout);
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
    ok: exitCode === 0 && text.length > 0,
    exitCode,
    signal,
    timedOut,
    elapsedMs: Date.now() - started,
    responseText: text.slice(0, 2000),
    responseSha256: sha(text || ""),
    eventCount: events.length,
    tokens: finish?.part?.tokens || null,
    cost: typeof finish?.part?.cost === "number" ? finish.part.cost : null,
    stdoutSha256: sha(stdout || ""),
    stderr: String(stderr || "").slice(0, 2000),
    error: error ? String(error.message || error).slice(0, 1000) : "",
    boundary: "Real OpenCode free-agent call, no file edits requested, no tools requested, no fanout."
  };
}

function makeSummary(generatedAt, rows, postResults = []) {
  const okRows = rows.filter((row) => row.ok);
  const costs = rows.map((row) => (typeof row.cost === "number" ? row.cost : 0));
  return {
    id: "opencode-free-agents-100-summary.v1",
    generatedAt,
    runId,
    eventId,
    status: okRows.length === totalAgents ? "OPENCODE_FREE_AGENTS_100_RUN_OK" : "OPENCODE_FREE_AGENTS_100_RUN_PARTIAL",
    d11: okRows.length > 0 ? "OBSERVED_REAL_OPENCODE_FREE_AGENT_RESPONSES_100_BOUND" : "HOLD_NO_REAL_OPENCODE_FREE_AGENT_RESPONSE",
    totalAgents,
    concurrency,
    timeoutMs,
    models: freeModels,
    attempted: rows.length,
    okCount: okRows.length,
    failCount: rows.length - okRows.length,
    timedOutCount: rows.filter((row) => row.timedOut).length,
    totalCost: costs.reduce((sum, cost) => sum + cost, 0),
    totalTokens: rows.reduce((sum, row) => sum + (row.tokens?.total || 0), 0),
    modelCounts: Object.fromEntries(freeModels.map((model) => [model, rows.filter((row) => row.model === model).length])),
    modelOkCounts: Object.fromEntries(freeModels.map((model) => [model, rows.filter((row) => row.model === model && row.ok).length])),
    responseShas: rows.map((row) => ({ seq: row.seq, model: row.model, pid: row.pid, ok: row.ok, sha256: row.responseSha256 })),
    postsOk: postResults.filter((post) => post.ok).length,
    postsTotal: postResults.length,
    boundary: "100 real bounded OpenCode free-agent calls. This is not a large fanout and not a logical coverage claim.",
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

async function runPool(generatedAt) {
  let nextSeq = 1;
  const rows = [];
  async function worker(workerId) {
    while (nextSeq <= totalAgents) {
      const seq = nextSeq;
      nextSeq += 1;
      const row = await runAgent(seq, generatedAt);
      rows.push(row);
      appendText(out.rows, JSON.stringify(row));
      const mark = row.ok ? "OK" : "FAIL";
      const cost = row.cost === null ? "null" : String(row.cost);
      console.log(`${mark.padEnd(4)} ${String(row.seq).padStart(3, "0")}/${totalAgents} worker=${workerId} model=${row.model} pid=${row.pid} ms=${row.elapsedMs} cost=${cost} sha=${row.responseSha256.slice(0, 12)}`);
      writeJson(out.summary, makeSummary(generatedAt, rows));
    }
  }
  await Promise.all(Array.from({ length: concurrency }, (_value, index) => worker(index + 1)));
  rows.sort((a, b) => a.seq - b.seq);
  return rows;
}

async function main() {
  const generatedAt = new Date().toISOString();
  fs.mkdirSync(runRoot, { recursive: true });
  writeText(out.rows, "");

  const listedModels = listModels();
  const missing = freeModels.filter((model) => !listedModels.includes(model));
  if (missing.length) {
    throw new Error(`Missing expected free models: ${missing.join(", ")}`);
  }

  console.log(`RUN ${runId} total=${totalAgents} concurrency=${concurrency} timeoutMs=${timeoutMs}`);
  console.log("MODEL SET " + freeModels.join(", "));
  const rows = await runPool(generatedAt);
  const summaryBeforePost = makeSummary(generatedAt, rows);

  writeJson(out.memory, {
    id: "memory-opencode-free-agents-100-run-v1",
    generatedAt,
    significance: "100 real bounded OpenCode free-agent calls completed or failed with row-level evidence, preserving results into BEHCS memory/index/map/cube/GLPJ.",
    summary: summaryBeforePost
  });
  writeJson(out.index, {
    id: "opencode-free-agents-100-run-index.v1",
    generatedAt,
    keys: ["opencode", "free-agent", "100-real-calls", "LX-SPAWN-FREE", "preserve-route"],
    rows: rows.map((row) => ({ seq: row.seq, model: row.model, lane: row.lane, pid: row.pid, ok: row.ok, responseSha256: row.responseSha256 }))
  });
  writeJson(out.map, {
    id: "opencode-free-agents-100-run-map-map-mapped.v1",
    generatedAt,
    nodes: ["100 OpenCode free-agent calls", "PID", "response", "memory", "index", "map", "cube", "GLPJ", "LAW-001"],
    edges: rows.map((row) => [row.model, row.ok ? "produced" : "failed", row.pid])
  });
  writeText(out.cube, `export default ${JSON.stringify({
    id: "opencode-free-agents-100-run-cube-cubed.v1",
    generatedAt,
    axes: {
      D_AGENT_COUNT: totalAgents,
      D_CONCURRENCY: concurrency,
      D_MODEL: freeModels,
      D_ROUTE: "LX-SPAWN-FREE",
      D_PROOF: summaryBeforePost.d11,
      D_BOUNDARY: "bounded-real-free-agent-100-run"
    },
    summary: summaryBeforePost
  }, null, 2)};\n`);
  writeJson(out.glpj, {
    id: "opencode-free-agents-100-run-behcs256-glpj.v1",
    generatedAt,
    sentences: [
      "META-RUN { OPENCODE-FREE-AGENTS-100 } : LX-SPAWN-FREE : REAL-RESPONSES @ M-EYEWITNESS .",
      "META-PRESERVE { FREE-AGENT-ROWS } : NDJSON INDEX MAP CUBE GLPJ : NOT-HIDDEN @ M-INDICATIVE .",
      "META-BOUNDARY { 100-CALLS } : NO-TOOLS NO-FILE-EDITS NO-FANOUT : COST-OBSERVED @ M-INDICATIVE ."
    ],
    glyphs: ["LX-SPAWN-FREE", "D-LIVE-FREE-AGENT", "EVT-LIVE-FREE-AGENT-RESPONSE", "META-LIVE-FREE-AGENT-EMPIRICAL-PROVEN"]
  });

  const envelope = {
    verb: "opencode-free-agents-100-run-result",
    target: "all-nodes",
    from: "acer-codex",
    id: "opencode-free-agents-100-run-20260427-001",
    ts: generatedAt,
    runId,
    eventId,
    summary: summaryBeforePost
  };
  writeJson(out.envelope, envelope);
  const postResults = await postSummary(envelope);
  writeJson(out.postResults, postResults);
  const summary = makeSummary(generatedAt, rows, postResults);
  writeJson(out.summary, summary);

  const report = { ...summary, rows, posts: postResults };
  writeJson(out.reportJson, report);
  writeText(out.reportMd, [
    "# OpenCode Free Agents 100 Run",
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
    `Concurrency: ${summary.concurrency}`,
    "",
    "## Model Counts",
    "",
    ...freeModels.map((model) => `- ${model}: ${summary.modelOkCounts[model]}/${summary.modelCounts[model]} OK`),
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
