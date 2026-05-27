#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const http = require("http");
const { spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..", "..");
const runId = "jesse-order-100b-self-heal-acer-20260427";
const eventId = "EVT-JESSE-ORDER-100B-SELF-HEAL-ACER-BOUNDED-2026-04-27";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", runId);

const LOGICAL_SUPERVISORS = 10_000;
const GULPS_PER_SUPERVISOR = 2_000;
const SUPER_GULPS_PER_GULP = 5_000;
const LOGICAL_AGENTS = LOGICAL_SUPERVISORS * GULPS_PER_SUPERVISOR * SUPER_GULPS_PER_GULP;
const REAL_SPAWNS = 10;

const MODELS = Object.freeze([
  "opencode/gpt-5-nano",
  "opencode/big-pickle",
  "opencode/hy3-preview-free",
  "opencode/ling-2.6-flash-free",
  "opencode/minimax-m2.5-free",
  "opencode/nemotron-3-super-free",
  "opencode/gpt-5-nano",
  "opencode/big-pickle",
  "opencode/minimax-m2.5-free",
  "opencode/gpt-5-nano"
]);

const LANES = Object.freeze([
  ["memory_index_pin", "Find one bounded fix for BEHCS memory/index permanence without deleting history."],
  ["supervisor_pid_visibility", "Find one bounded fix so all supervisors remain PID-visible to Hermes/Shannon."],
  ["law001_bus_reliability", "Find one bounded fix for LAW-001 bus reliability across Acer/Liris/Falcon."],
  ["falcon_mirror_truth", "Find one bounded fix for host-ADB-online versus UI-ADB-missing mismatch."],
  ["dirty_worktree_no_destroy", "Find one bounded fix for dirty worktree cleanup that never deletes or resets."],
  ["opencode_energy_gate", "Find one bounded fix to keep OpenCode free-agent calls energy/cost gated."],
  ["gnn_reverse_gain", "Find one bounded fix to wire forward GNN and reverse-gain GNN into promotion."],
  ["white_room_gc", "Find one bounded fix for white-room GC that preserves source evidence."],
  ["asolaria_mcp_policy", "Find one bounded fix so agents use Asolaria BEHCS MCP policy before external MCP."],
  ["honesty_boundary", "Find one bounded fix that prevents logical coverage from being reported as live process count."]
]);

const PATHS = Object.freeze({
  empirical: path.join(runRoot, "empirical-opencode-spawns.v1.ndjson"),
  logicalLedger: path.join(runRoot, "logical-100b-self-heal-ledger.v1.ndjson"),
  summary: path.join(runRoot, "jesse-order-100b-self-heal-acer-summary.v1.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "jesse-order-100b-self-heal-acer.v1.json"),
  index: path.join(repoRoot, "data", "behcs", "index", "jesse-order-100b-self-heal-acer-index.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "jesse-order-100b-self-heal-acer-map-map-mapped.v1.json"),
  cube: path.join(repoRoot, "data", "behcs", "cubes", "jesse-order-100b-self-heal-acer-cube-cubed.cube.js"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "jesse-order-100b-self-heal-acer-behcs256.glpj.json"),
  supervisorSet: path.join(repoRoot, "data", "behcs", "supervisors", "live-free-agent", "jesse-order-100b-self-heal-supervisors.v1.json"),
  lirisEnvelope: path.join(runRoot, "liris-jesse-order-100b-self-heal-acer-summary-envelope.json"),
  lirisPostResult: path.join(runRoot, "liris-jesse-order-100b-self-heal-acer-summary-post-result.json"),
  falconEnvelope: path.join(runRoot, "falcon-jesse-order-100b-self-heal-acer-observer-envelope.json"),
  falconPostResult: path.join(runRoot, "falcon-jesse-order-100b-self-heal-acer-observer-post-result.json"),
  reportJson: path.join(repoRoot, "reports", "jesse-order-100b-self-heal-acer-latest.json"),
  reportMd: path.join(repoRoot, "reports", "jesse-order-100b-self-heal-acer-latest.md")
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
  const relative = path.relative(repoRoot, filePath);
  if (path.isAbsolute(relative) || relative.startsWith("..")) return filePath.replace(/\\/g, "/");
  return relative.replace(/\\/g, "/");
}

function sha(value) {
  return crypto.createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex");
}

function agentPid(seed) {
  return `BH.AGENT.PID.${sha(seed).slice(0, 12).toUpperCase()}`;
}

function parseOpenCodeJsonLines(stdout) {
  const events = [];
  for (const line of String(stdout || "").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      events.push(JSON.parse(trimmed));
    } catch (_error) {
      // Keep raw stdout hash in result.
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

function runOpenCodeSpawn(index, generatedAt) {
  const [lane, question] = LANES[index];
  const model = MODELS[index];
  const canonicalPid = `opencode:acer:self-heal:${lane}:p${index + 2}`;
  const pid = agentPid(canonicalPid);
  const prompt = [
    `BEHCS-256 LX-SPAWN-FREE empirical self-heal lane ${index + 1}/10.`,
    `PID=${pid}.`,
    `Lane=${lane}.`,
    question,
    "Return one compact JSON object with keys lane, fix, risk, supervisor. Do not edit files. Do not run tools."
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
      BROWN_HILBERT_PID: pid,
      BEHCS256_GLYPH: "LX-SPAWN-FREE",
      ASOLARIA_BOUNDARY: "NO_FILE_EDITS_NO_TOOLS_NO_FANOUT"
    }
  });
  const elapsedMs = Date.now() - started;
  const events = parseOpenCodeJsonLines(result.stdout);
  const text = extractText(events);
  const finish = events.find((event) => event.type === "step_finish");
  const tokens = finish?.part?.tokens || null;
  const cost = typeof finish?.part?.cost === "number" ? finish.part.cost : null;
  return {
    seq: index + 1,
    ts: generatedAt,
    lane,
    question,
    model,
    canonicalPid,
    pid,
    ok: result.status === 0 && text.length > 0,
    exitCode: result.status,
    signal: result.signal,
    elapsedMs,
    timedOut: Boolean(result.error && result.error.code === "ETIMEDOUT"),
    responseText: text.slice(0, 2000),
    responseSha256: sha(text || ""),
    eventCount: events.length,
    tokens,
    cost,
    stdoutSha256: sha(result.stdout || ""),
    stderr: String(result.stderr || "").slice(0, 1000),
    error: result.error ? String(result.error.message || result.error).slice(0, 1000) : "",
    boundary: "Real OpenCode call, no file edits requested, no tool execution requested, no fanout."
  };
}

function makeLogicalLedger(generatedAt) {
  const shards = [];
  const shardCount = 100;
  const agentsPerShard = LOGICAL_AGENTS / shardCount;
  for (let i = 0; i < shardCount; i += 1) {
    const firstAgent = i * agentsPerShard + 1;
    const lastAgent = firstAgent + agentsPerShard - 1;
    const lane = LANES[i % LANES.length][0];
    const supervisorStart = Math.floor((i / shardCount) * LOGICAL_SUPERVISORS) + 1;
    const supervisorEnd = Math.floor(((i + 1) / shardCount) * LOGICAL_SUPERVISORS);
    const row = {
      seq: i + 1,
      ts: generatedAt,
      runId,
      eventId,
      lane,
      firstLogicalAgent: firstAgent,
      lastLogicalAgent: lastAgent,
      logicalAgentsRepresented: agentsPerShard,
      supervisorStart,
      supervisorEnd,
      gulpShape: {
        supervisors: LOGICAL_SUPERVISORS,
        gulpsPerSupervisor: GULPS_PER_SUPERVISOR,
        superGulpsPerGulp: SUPER_GULPS_PER_GULP
      },
      digest: sha(`${eventId}:${i}:${lane}:${firstAgent}:${lastAgent}`),
      boundary: "Logical coverage shard, not a live process count."
    };
    shards.push(row);
  }
  return shards;
}

function httpJson(method, url, body = null) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const payload = body ? Buffer.from(JSON.stringify(body), "utf8") : null;
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path: `${parsed.pathname}${parsed.search}`,
      method,
      headers: payload
        ? { "content-type": "application/json", "content-length": payload.length, connection: "close" }
        : { connection: "close" },
      timeout: 10000
    }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        let responseBody = text;
        try {
          responseBody = JSON.parse(text);
        } catch (_error) {
          // Keep raw text.
        }
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode, body: responseBody });
      });
    });
    req.on("timeout", () => req.destroy(new Error("request_timeout")));
    req.on("error", (error) => resolve({ ok: false, error: error.message }));
    if (payload) req.write(payload);
    req.end();
  });
}

async function run() {
  const generatedAt = new Date().toISOString();
  const empirical = [];
  for (let i = 0; i < REAL_SPAWNS; i += 1) {
    empirical.push(runOpenCodeSpawn(i, generatedAt));
  }
  const logicalLedger = makeLogicalLedger(generatedAt);
  writeNdjson(PATHS.empirical, empirical);
  writeNdjson(PATHS.logicalLedger, logicalLedger);

  const okSpawns = empirical.filter((row) => row.ok).length;
  const totalCost = empirical.reduce((sum, row) => sum + (typeof row.cost === "number" ? row.cost : 0), 0);
  const totalTokens = empirical.reduce((sum, row) => sum + (row.tokens?.total || 0), 0);
  const status = okSpawns === REAL_SPAWNS
    ? "JESSE_ORDER_100B_SELF_HEAL_ACER_EMPIRICAL_10_COMPLETE_LOGICAL_100B_LEDGERED"
    : "JESSE_ORDER_100B_SELF_HEAL_ACER_EMPIRICAL_PARTIAL_LOGICAL_100B_LEDGERED";
  const boundary = "10 real sequential OpenCode calls maximum; 100B is compact logical coverage; no 10,000 OS processes; no uncontrolled fanout; no file edits requested; no auth/payment bypass; no remote mutation.";
  const summary = {
    id: "jesse-order-100b-self-heal-acer-summary.v1",
    generatedAt,
    runId,
    eventId,
    status,
    operatorAuthority: "Jesse order via Liris transcript and current Acer operator request",
    liveFreeAgentGlyph: "LX-SPAWN-FREE",
    realSpawnsRequested: REAL_SPAWNS,
    realSpawnsOk: okSpawns,
    logicalAgentsRepresented: LOGICAL_AGENTS,
    logicalSupervisors: LOGICAL_SUPERVISORS,
    gulpsPerSupervisor: GULPS_PER_SUPERVISOR,
    superGulpsPerGulp: SUPER_GULPS_PER_GULP,
    logicalShards: logicalLedger.length,
    totalTokens,
    totalCost,
    models: [...new Set(empirical.map((row) => row.model))],
    empiricalSha256: sha(empirical),
    logicalLedgerSha256: sha(logicalLedger),
    boundary
  };
  writeJson(PATHS.summary, summary);

  const memory = {
    type: "behcs-memory",
    id: "memory-jesse-order-100b-self-heal-acer-v1",
    generatedAt,
    runId,
    eventId,
    status,
    summary: "Acer executed the bounded mirror of Jesse/Liris 100B self-heal order: 10 real sequential OpenCode calls plus compact 100B logical self-heal ledger.",
    source: repoRel(PATHS.summary),
    boundary
  };
  const index = {
    id: "jesse-order-100b-self-heal-acer-index-v1",
    generatedAt,
    keys: ["jesse-order", "100b-self-heal", "LX-SPAWN-FREE", "opencode", "bounded-real-spawns", "logical-ledger"],
    artifacts: {
      empirical: repoRel(PATHS.empirical),
      logicalLedger: repoRel(PATHS.logicalLedger),
      summary: repoRel(PATHS.summary),
      memory: repoRel(PATHS.memory),
      map: repoRel(PATHS.map),
      cube: repoRel(PATHS.cube),
      glpj: repoRel(PATHS.glpj),
      supervisorSet: repoRel(PATHS.supervisorSet),
      report: repoRel(PATHS.reportMd)
    }
  };
  const map = {
    id: "jesse-order-100b-self-heal-acer-map-map-mapped-v1",
    generatedAt,
    route: [
      "liris-order-observed",
      "scale-1-smoke-proven",
      "scale-10-empirical-opencode",
      "100b-logical-ledger",
      "omnispindle-supervisor-routing",
      "omniflywheel-gnn-reverse-gain",
      "white-room-gc",
      "liris-summary",
      "falcon-observer"
    ],
    lanes: LANES.map(([lane]) => lane),
    status,
    boundary
  };
  const glpj = {
    id: "jesse-order-100b-self-heal-acer-behcs256-glpj-v1",
    generatedAt,
    eventId,
    sentences: [
      "META-ORDER { JESSE-100B-SELF-HEAL } : LX-SPAWN-FREE : SCALE-10-EMPIRICAL : 100B-LOGICAL-LEDGER @ M-INDICATIVE .",
      "META-GATE { SELF-HEAL-FANOUT } : NO-10000-OS-PROCESSES : NO-AUTH-BYPASS : NO-REMOTE-MUTATION : HONEST-COUNTS @ M-IMPERATIVE .",
      "META-ROUTE { OMNISPINDLE-OMNIFLYWHEEL } : SUPERVISORS : GNN : REVERSE-GAIN : OMNISHANNON : WHITE-ROOM-GC @ M-CLOSURE ."
    ]
  };
  const supervisorSet = {
    id: "jesse-order-100b-self-heal-supervisors.v1",
    generatedAt,
    eventId,
    status: "SELF_HEAL_SUPERVISORS_BOUND_TO_ORDER",
    supervisors: LANES.map(([lane], index) => ({
      id: `BH.SUP.SELFHEAL.${String(index + 1).padStart(2, "0")}`,
      lane,
      pid: agentPid(`supervisor:acer:self-heal:${lane}`),
      responsibility: `Own bounded self-heal lane ${lane}; promote only descriptor/proof artifacts unless separately authorized.`
    })),
    boundary
  };
  writeJson(PATHS.memory, memory);
  writeJson(PATHS.index, index);
  writeJson(PATHS.map, map);
  writeJson(PATHS.glpj, glpj);
  writeJson(PATHS.supervisorSet, supervisorSet);
  writeText(PATHS.cube, `// Generated ${generatedAt}
module.exports = ${JSON.stringify({
    id: "jesse-order-100b-self-heal-acer-cube-cubed",
    eventId,
    status,
    realSpawnsOk: okSpawns,
    logicalAgentsRepresented: LOGICAL_AGENTS,
    boundary
  }, null, 2)};
`);

  const lirisEnvelope = {
    verb: "jesse-order-100b-self-heal-acer-summary",
    target: "liris",
    from: "acer-codex",
    id: "jesse-order-100b-self-heal-20260427-acer-summary-001",
    ts: generatedAt,
    eventId,
    status,
    realSpawnsRequested: REAL_SPAWNS,
    realSpawnsOk: okSpawns,
    logicalAgentsRepresented: LOGICAL_AGENTS,
    totalTokens,
    totalCost,
    artifacts: index.artifacts,
    glyph_sentence: "META-ORDER { JESSE-100B-SELF-HEAL.ACER } · SCALE-10-REAL · 100B-LOGICAL · BOUNDARY-PRESERVED @ M-INDICATIVE .",
    d11: okSpawns === REAL_SPAWNS ? "PROVEN_SCALE_10_REAL_OPENCODE_WITH_LOGICAL_100B" : "OBSERVED_PARTIAL_REAL_OPENCODE_WITH_LOGICAL_100B",
    boundary
  };
  const falconEnvelope = {
    ...lirisEnvelope,
    verb: "jesse-order-100b-self-heal-falcon-observer-copy",
    target: "falcon",
    id: "jesse-order-100b-self-heal-20260427-falcon-observer-copy-001",
    status: "FALCON_OBSERVER_COPY_ONLY"
  };
  writeJson(PATHS.lirisEnvelope, lirisEnvelope);
  writeJson(PATHS.falconEnvelope, falconEnvelope);
  const lirisPost = await httpJson("POST", "http://192.168.100.2:4947/behcs/send", lirisEnvelope);
  const falconPost = await httpJson("POST", "http://192.168.1.8:4947/behcs/send", falconEnvelope);
  writeJson(PATHS.lirisPostResult, { postedAt: new Date().toISOString(), result: lirisPost });
  writeJson(PATHS.falconPostResult, { postedAt: new Date().toISOString(), result: falconPost });

  const report = {
    ok: true,
    status,
    realSpawnsRequested: REAL_SPAWNS,
    realSpawnsOk: okSpawns,
    logicalAgentsRepresented: LOGICAL_AGENTS,
    totalTokens,
    totalCost,
    lirisPostOk: lirisPost.ok,
    falconPostOk: falconPost.ok,
    artifacts: index.artifacts
  };
  writeJson(PATHS.reportJson, report);
  writeText(PATHS.reportMd, [
    "# Jesse Order 100B Self-Heal Acer",
    "",
    `Generated: ${generatedAt}`,
    "",
    `Status: ${status}`,
    "",
    `Real OpenCode spawns requested: ${REAL_SPAWNS}`,
    `Real OpenCode spawns ok: ${okSpawns}`,
    `Logical agents represented: ${LOGICAL_AGENTS}`,
    `Logical supervisors: ${LOGICAL_SUPERVISORS}`,
    `Logical ledger shards: ${logicalLedger.length}`,
    `Total tokens reported: ${totalTokens}`,
    `Total cost reported: ${totalCost}`,
    "",
    "Models:",
    ...report.artifacts ? [] : [],
    ...summary.models.map((model) => `- ${model}`),
    "",
    "Artifacts:",
    ...Object.values(index.artifacts).map((artifact) => `- ${artifact}`),
    "",
    "Posts:",
    `- Liris accepted: ${lirisPost.ok}`,
    `- Falcon observer accepted: ${falconPost.ok}`,
    "",
    `Boundary: ${boundary}`
  ].join("\n"));

  console.log(JSON.stringify(report, null, 2));
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
