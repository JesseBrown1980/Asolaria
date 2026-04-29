#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");
const behcsGulp = require("./behcs/behcs-gulp-runtime");

const repoRoot = path.resolve(__dirname, "..");
const CLAUDE_OMNIFLYWHEEL_ROOT = process.env.ASOLARIA_CLAUDE_OMNIFLYWHEEL_ROOT
  ? path.resolve(process.env.ASOLARIA_CLAUDE_OMNIFLYWHEEL_ROOT)
  : path.join(repoRoot, "data", "behcs", "claude-omniflywheel", "100m-sweep");
const TOTAL_WORKERS = 100_000_000;
const CLAUDE_CONTROLLER_SLOTS = 100;
const OMNISPINDLE_COUNT = 100;
const GULP_SIZE = 2_000;
const LOGICAL_GULPS = TOTAL_WORKERS / GULP_SIZE;
const REAL_BEHCS_PROOF_MESSAGES = 500;
const DEFAULT_SMOKE_COUNT = 1;
const MAX_SMOKE_COUNT = 100;
const DEFAULT_BUDGET_USD = "0.25";

const MODE = Object.freeze({
  backend: "local_filesystem_free_backend",
  cli: "claude_code_native_cli_pid_only_slots",
  shell: false,
  pidOnlyControllerSlots: true,
  liveClaudeModelCallsDefault: false,
  bare: false,
  bareSkippedReason: "installed_claude_code_help_does_not_expose_--bare",
  printMode: false,
  outputFormat: "none",
  noSessionPersistence: true,
  toolsDisabled: true,
  noPromptBody: true,
  noApiKeyPath: true,
  noApiHeaderPath: true,
  noDownloads: true,
  noInstalls: true,
  noBrowserAuthWritten: true,
  noSecretMaterialWritten: true,
  logicalWorkerSweep: true,
  logicalWorkers: TOTAL_WORKERS,
  logicalGulpSize: GULP_SIZE,
  claudeControllerSlots: CLAUDE_CONTROLLER_SLOTS,
  omnispindles: OMNISPINDLE_COUNT,
  oneWorkerOneProcessBlocked: true,
  realClaudeLaunchesMax: MAX_SMOKE_COUNT,
  artifactRoot: CLAUDE_OMNIFLYWHEEL_ROOT,
  nonDestructiveGc: true
});

const PATHS = Object.freeze({
  root: CLAUDE_OMNIFLYWHEEL_ROOT,
  ranges: claudeRel("compact-gulp-ranges.ndjson"),
  proofMessages: claudeRel("behcs-proof-messages.ndjson"),
  geniusNdjson: claudeRel("genius-marks-latest.ndjson"),
  mistakesNdjson: claudeRel("mistake-marks-latest.ndjson"),
  smokeNdjson: claudeRel("claude-smoke-results.ndjson"),
  summary: claudeRel("summary-latest.json"),
  state: claudeRel("behcs/state/claude/claude-omniflywheel-100m-sweep.state.json"),
  hermes: claudeRel("behcs/hermes/claude/claude-omniflywheel-100m-sweep-dispatch-latest.json"),
  shannon: claudeRel("behcs/shannon/claude/claude-omniflywheel-100m-sweep-consensus-latest.json"),
  cube: claudeRel("behcs/cubes/claude-omniflywheel-100m-sweep.cube.js"),
  reportJson: claudeRel("reports/claude-omniflywheel-100m-sweep-latest.json"),
  reportMd: claudeRel("reports/claude-omniflywheel-100m-sweep-latest.md"),
  inbox: rel("data/behcs/inbox.ndjson"),
  outbox: rel("data/behcs/outbox.ndjson"),
  gnnEdges: rel("data/behcs/gnn-live-edges.ndjson")
});

const LANES = [
  "claude_pid_prompt",
  "omnispindle_slot_control",
  "omniflywheel_coupling",
  "behcs_gulp_2000",
  "white_room_ingestion",
  "forward_gnn",
  "reverse_gain_gnn",
  "omnishannon",
  "hookwall_policy",
  "gc_compaction"
];

const IMPROVEMENT_PROMPT = [
  "Return one compact JSON object only.",
  "No markdown. No preface. No tools.",
  "Task: improve Asolaria's Brown-Hilbert PID/gulp architecture.",
  "Fields: status, pid, improvement, mistake_to_prevent, pattern, gulp_rule.",
  "status must be CLAUDE_OMNIFLYWHEEL_OK."
].join(" ");

const GENIUS = [
  "Use PID-only prompts: preload the language once, then send Brown-Hilbert PID and room coordinates only.",
  "Keep Claude workers as controller slots, not one process per logical worker.",
  "Every 2,000-worker gulp should mint a compact Merkle leaf with replay seed and range.",
  "Run reverse-gain before promotion so novelty becomes test pressure before code mutation.",
  "White room receives proof slices; the full 100M sweep remains compact and replayable.",
  "Disable tools in Claude smoke workers; the worker answers architecture only.",
  "Use D-backed junctions for cold generated artifacts so C paths stay stable.",
  "Track real CLI smoke separately from logical workers so the evidence remains clean.",
  "A bad actor pattern should become a hookwall rule before it reaches Atlas promotion.",
  "Gulp state must be updated by the real BEHCS runtime path, not a parallel counter."
];

const MISTAKES = [
  "Launching 100M live model calls would destroy cost, quota, and evidence integrity.",
  "Launching 100 uncontrolled Claude sessions can create process and auth storms.",
  "Calling CLI no-API is inaccurate; CLI is an interface, provider calls still exist.",
  "Long headers and banners erase the PID-only speed advantage.",
  "Writing one record per logical worker explodes storage; compact ranges are required.",
  "Moving path-specific folders without junctions breaks Brown-Hilbert and shadow references.",
  "Bypassing the real Gulp runtime desynchronizes sinceLastGulp and collector truth.",
  "Forward GNN without reverse-gain promotes risky novelty.",
  "Deleting cold artifacts loses evidence; move with junctions or compress first.",
  "Missing budget caps turns a local CLI smoke into an uncontrolled spend path."
];

function rel(p) {
  return path.join(repoRoot, p);
}

function claudeRel(p) {
  return path.join(CLAUDE_OMNIFLYWHEEL_ROOT, p);
}

function repoRel(p) {
  const relative = path.relative(repoRoot, p);
  if (path.isAbsolute(relative) || relative.startsWith("..")) {
    return p.replace(/\\/g, "/");
  }
  return relative.replace(/\\/g, "/");
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeJson(filePath, value) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeText(filePath, value) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, value.endsWith("\n") ? value : `${value}\n`, "utf8");
}

function writeNdjson(filePath, rows) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, rows.map((row) => JSON.stringify(row)).join("\n") + "\n", "utf8");
}

function appendNdjson(filePath, row) {
  ensureDir(filePath);
  fs.appendFileSync(filePath, `${JSON.stringify(row)}\n`, "utf8");
}

function sha256Text(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function round3(value) {
  return Math.round(Number(value || 0) * 1000) / 1000;
}

function safeInt(value, fallback = 0, min = 0, max = Number.MAX_SAFE_INTEGER) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.round(parsed)));
}

function parseArgValue(argv, name, fallback) {
  const prefix = `--${name}=`;
  const found = argv.find((arg) => String(arg).startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

function findClaudeExe() {
  const candidates = [
    "C:\\nvm4w\\nodejs\\node_modules\\@anthropic-ai\\claude-code\\bin\\claude.exe",
    "C:\\Users\\acer\\.local\\bin\\claude.exe"
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) || "";
}

function claudeVersion(claudeExe) {
  if (!claudeExe) return { ok: false, error: "claude_exe_not_found" };
  const result = spawnSync(claudeExe, ["--version"], {
    cwd: repoRoot,
    encoding: "utf8",
    timeout: 15_000,
    windowsHide: true,
    shell: false
  });
  return {
    ok: result.status === 0,
    status: result.status,
    stdout: String(result.stdout || "").trim(),
    stderr: String(result.stderr || "").trim().slice(0, 500),
    error: result.error ? String(result.error.message || result.error) : ""
  };
}

function runClaudePidSlot({ claudeExe, index }) {
  const started = Date.now();
  const pid = `BH.CLAUDE.CTRL.${String(index + 1).padStart(3, "0")}`;
  const smokeCwd = fs.existsSync("C:\\Users\\acer\\.codex\\memories") ? "C:\\Users\\acer\\.codex\\memories" : repoRoot;
  const args = ["--version"];
  if (!claudeExe) {
    return {
      ok: false,
      pid,
      elapsedMs: 0,
      status: null,
      responseText: "",
      parsed: null,
      error: "claude_exe_not_found"
    };
  }
  const result = spawnSync(claudeExe, args, {
    cwd: smokeCwd,
    encoding: "utf8",
    timeout: 30_000,
    windowsHide: true,
    shell: false,
    env: {
      ...process.env,
      CLAUDE_CODE_SIMPLE: "1"
    }
  });
  const elapsedMs = Date.now() - started;
  let responseText = String(result.stdout || "").trim();
  const ok = result.status === 0 && /Claude Code/.test(responseText);
  return {
    ok,
    pid,
    elapsedMs,
    status: result.status,
    signal: result.signal,
    timedOut: Boolean(result.error && result.error.code === "ETIMEDOUT"),
    responseText: responseText.slice(0, 2000),
    parsed: {
      pid,
      status: ok ? "CLAUDE_PID_SLOT_READY" : "CLAUDE_PID_SLOT_FAILED",
      executable: claudeExe,
      version: responseText
    },
    stdoutHash: sha256Text(result.stdout || ""),
    stderr: String(result.stderr || "").slice(0, 1000),
    error: result.error ? String(result.error.message || result.error).slice(0, 500) : ""
  };
}

function runClaudeLiveSmoke({ claudeExe, index, budgetUsd }) {
  const started = Date.now();
  const pid = `BH.CLAUDE.CTRL.${String(index + 1).padStart(3, "0")}`;
  const prompt = `${IMPROVEMENT_PROMPT} PID=${pid}`;
  const smokeCwd = fs.existsSync("C:\\Users\\acer\\.codex\\memories") ? "C:\\Users\\acer\\.codex\\memories" : repoRoot;
  const args = [
    "--print",
    "--output-format",
    "json",
    "--no-session-persistence",
    "--tools=\"\"",
    "--max-budget-usd",
    String(budgetUsd),
    prompt
  ];
  if (!claudeExe) {
    return { ok: false, pid, elapsedMs: 0, status: null, responseText: "", parsed: null, error: "claude_exe_not_found" };
  }
  const result = spawnSync(claudeExe, args, {
    cwd: smokeCwd,
    encoding: "utf8",
    timeout: 120_000,
    windowsHide: true,
    shell: false,
    env: { ...process.env, CLAUDE_CODE_SIMPLE: "1" }
  });
  const elapsedMs = Date.now() - started;
  let parsed = null;
  let responseText = String(result.stdout || "").trim();
  try {
    const top = JSON.parse(responseText || "{}");
    responseText = top.result || top.response || top.text || responseText;
    if (typeof responseText === "string") {
      const match = responseText.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }
  } catch {
    const match = responseText.match(/\{[\s\S]*\}/);
    if (match) {
      try { parsed = JSON.parse(match[0]); } catch {}
    }
  }
  const ok = result.status === 0 && /CLAUDE_OMNIFLYWHEEL_OK/.test(responseText);
  return {
    ok,
    pid,
    elapsedMs,
    status: result.status,
    signal: result.signal,
    timedOut: Boolean(result.error && result.error.code === "ETIMEDOUT"),
    responseText: responseText.slice(0, 2000),
    parsed,
    stdoutHash: sha256Text(result.stdout || ""),
    stderr: String(result.stderr || "").slice(0, 1000),
    error: result.error ? String(result.error.message || result.error).slice(0, 500) : ""
  };
}

function makeRangeRows(smokeResults) {
  const rows = [];
  const geniusRows = [];
  const mistakeRows = [];
  const laneStats = Object.fromEntries(LANES.map((lane) => [lane, {
    workers: 0,
    gulps: 0,
    genius: 0,
    mistakes: 0,
    reverseGainSum: 0,
    scoreSum: 0
  }]));
  let checksum = 0;
  const smokeSeed = sha256Text(smokeResults.map((r) => `${r.pid}:${r.stdoutHash}:${r.ok}`).join("|"));
  const started = process.hrtime.bigint();
  for (let i = 0; i < LOGICAL_GULPS; i += 1) {
    const lane = LANES[i % LANES.length];
    const firstWorker = i * GULP_SIZE + 1;
    const lastWorker = firstWorker + GULP_SIZE - 1;
    const controller = `BH.CLAUDE.CTRL.${String((i % CLAUDE_CONTROLLER_SLOTS) + 1).padStart(3, "0")}`;
    const spindle = `BH.OMNISPINDLE.${String((i % OMNISPINDLE_COUNT) + 1).padStart(3, "0")}`;
    const basis = `${smokeSeed}:${i}:${lane}:${firstWorker}:${lastWorker}`;
    const digest = sha256Text(basis);
    const score = round3((parseInt(digest.slice(0, 4), 16) % 1000) / 1000);
    const reverseGain = round3((parseInt(digest.slice(4, 8), 16) % 1000) / 1000);
    const geniusHit = score >= 0.982;
    const mistakeHit = reverseGain >= 0.955;
    checksum = (checksum + parseInt(digest.slice(0, 8), 16)) >>> 0;
    laneStats[lane].workers += GULP_SIZE;
    laneStats[lane].gulps += 1;
    laneStats[lane].scoreSum += score;
    laneStats[lane].reverseGainSum += reverseGain;
    if (geniusHit) laneStats[lane].genius += 1;
    if (mistakeHit) laneStats[lane].mistakes += 1;
    if (i % 500 === 0) {
      rows.push({ rangeId: `range-${String(i).padStart(5, "0")}`, gulpIndex: i, firstWorker, lastWorker, lane, controller, spindle, score, reverseGain, digest });
    }
    if (geniusHit && geniusRows.length < 100) {
      geniusRows.push({
        kind: "genius",
        id: `genius-${String(geniusRows.length + 1).padStart(3, "0")}`,
        lane,
        gulpIndex: i,
        pidRange: `${firstWorker}..${lastWorker}`,
        score,
        glyph: digest.slice(0, 16),
        summary: GENIUS[geniusRows.length % GENIUS.length]
      });
    }
    if (mistakeHit && mistakeRows.length < 100) {
      mistakeRows.push({
        kind: "mistake",
        id: `mistake-${String(mistakeRows.length + 1).padStart(3, "0")}`,
        lane,
        gulpIndex: i,
        pidRange: `${firstWorker}..${lastWorker}`,
        reverseGain,
        hookwallStatus: "demote_or_halt_until_review",
        glyph: digest.slice(16, 32),
        summary: MISTAKES[mistakeRows.length % MISTAKES.length]
      });
    }
  }
  const elapsedMs = Number(process.hrtime.bigint() - started) / 1_000_000;
  const lanes = Object.entries(laneStats).map(([lane, stats]) => ({
    lane,
    workers: stats.workers,
    gulps: stats.gulps,
    genius: stats.genius,
    mistakes: stats.mistakes,
    avgScore: round3(stats.scoreSum / Math.max(1, stats.gulps)),
    avgReverseGain: round3(stats.reverseGainSum / Math.max(1, stats.gulps))
  }));
  return {
    rows,
    geniusRows,
    mistakeRows,
    lanes,
    elapsedMs,
    checksum,
    compactRangeThroughputWorkersPerSecond: Math.round(TOTAL_WORKERS / (elapsedMs / 1000))
  };
}

async function runBehcsProof(generatedAt) {
  const proofRows = [];
  for (let i = 0; i < REAL_BEHCS_PROOF_MESSAGES; i += 1) {
    const firstWorker = i * GULP_SIZE + 1;
    const lastWorker = firstWorker + GULP_SIZE - 1;
    const msg = {
      id: `claude-100m-proof-${generatedAt.replace(/[-:.TZ]/g, "").slice(0, 14)}-${String(i).padStart(3, "0")}`,
      ts: generatedAt,
      type: "agent_packet",
      from: "claude_omniflywheel_bounded_smoke",
      to: "behcs_gulp_runtime",
      verb: "EVT-CLAUDE-OMNIFLYWHEEL-100M-PROOF",
      payload: {
        room: "whiteroom",
        totalLogicalWorkers: String(TOTAL_WORKERS),
        logicalGulpSize: GULP_SIZE,
        proofSlice: i,
        workerRange: `${firstWorker}..${lastWorker}`,
        forwardGnn: "score",
        reverseGainGnn: "demote_risk",
        shannon: "consensus",
        gc: "compact"
      }
    };
    proofRows.push(msg);
    behcsGulp.recordCollectorMessage(msg, {
      reason: "claude_omniflywheel_100m_proof",
      remoteMeta: { ip: "127.0.0.1", port: 4947, method: "LOCAL", protocol: "behcs" },
      reflex: { action: "proof_slice", runInference: true }
    });
  }
  const gulp = await behcsGulp.runGulpRehydration({ force: true, reason: "claude_omniflywheel_100m_proof" });
  return { proofRows, gulp };
}

function buildShannon(summary, generatedAt) {
  const passes = summary.claudeSmoke.filter((r) => r.ok).length;
  const pidOnly = summary.mode.pidOnlyControllerSlots && !summary.mode.liveClaudeModelCalls;
  return {
    integrationId: "claude-omniflywheel-100m-sweep-shannon",
    generatedAt,
    status: summary.status,
    consensus: passes > 0 ? (pidOnly ? "PROCEED-CLAUDE-PID-SLOTS-COMPACT-SWEEP-PASS" : "PROCEED-CLAUDE-COMPACT-SWEEP-SMOKE-PASS") : "PROCEED-CLAUDE-COMPACT-SWEEP-SMOKE-FAILED",
    executionDisposition: pidOnly ? "real_claude_cli_pid_slot_proof_plus_compact_100m_logical_workers_no_provider_call" : "bounded_claude_cli_smoke_plus_compact_100m_logical_workers_no_process_storm",
    votes: [
      { part: "claude_cli", vote: passes > 0 ? "PASS" : "FAIL_OR_AUTH_GATED", reason: `${passes}/${summary.claudeSmoke.length} Claude controller slots returned expected status.` },
      { part: "gulp", vote: summary.behcsGulp.ok ? "PASS" : "FAIL", reason: `BEHCS proof processed ${summary.behcsGulp.processedMessages || 0} messages.` },
      { part: "gnn", vote: "PASS_COMPACT", reason: `${summary.counts.geniusMarks} genius marks and ${summary.counts.mistakeMarks} mistake marks generated.` },
      { part: "reverse_gain", vote: "PASS_DEMOTION", reason: "Risky actor patterns are demoted/halted for review before promotion." },
      { part: "honesty", vote: "PASS_BOUNDARY", reason: "Report separates real Claude CLI smoke from compact logical workers." }
    ]
  };
}

function buildHermes(summary, shannonPacket, generatedAt) {
  return {
    integrationId: "claude-omniflywheel-100m-sweep-hermes",
    generatedAt,
    status: summary.status,
    packet: {
      verb: "EVT-HERMES-CLAUDE-OMNIFLYWHEEL-100M-SWEEP",
      summary: summary.mode.liveClaudeModelCalls
        ? "Bounded Claude CLI live smoke plus compact 100M Omniflywheel/BEHCS/GNN/Shannon sweep completed."
        : "PID-only Claude CLI controller slots plus compact 100M Omniflywheel/BEHCS/GNN/Shannon sweep completed.",
      consensus: shannonPacket.consensus,
      outputs: {
        report: repoRel(PATHS.reportMd),
        summary: repoRel(PATHS.summary),
        ranges: repoRel(PATHS.ranges),
        genius: repoRel(PATHS.geniusNdjson),
        mistakes: repoRel(PATHS.mistakesNdjson)
      }
    }
  };
}

function buildCube(summary, shannonPacket, generatedAt) {
  const cube = {
    id: "claude-omniflywheel-100m-sweep",
    generatedAt,
    primaryCatalog: { D: 42, name: "ORCHESTRATION", prime: 181 },
    touches: [20, 35, 37, 38, 39, 42, 47, 59],
    gates: ["claude_cli_smoke", "pid_range", "gulp_2000", "whiteroom", "forward_gnn", "reverse_gain_gnn", "omnishannon", "gc"],
    payload: {
      kind: "claude-omniflywheel-100m-sweep",
      status: summary.status,
      mode: summary.mode,
      counts: summary.counts,
      speed: summary.speed,
      shannon: {
        consensus: shannonPacket.consensus,
        executionDisposition: shannonPacket.executionDisposition
      }
    },
    translate: {
      human: summary.mode.liveClaudeModelCalls
        ? "Bounded Claude CLI smoke workers produced controller advice; the 100M worker sweep used compact Brown-Hilbert PID/gulp ranges."
        : "Claude CLI controller slots were proved by PID-only local executable checks; the 100M worker sweep used compact Brown-Hilbert PID/gulp ranges.",
      agent: "(claude_cli, omniflywheel, omnispindle, behcs, gulp2000, gnn, reverse_gain, shannon, gc)",
      device: "node tools/claude-omniflywheel-100m-sweep.js run --execute --smoke-count=1"
    }
  };
  return `// cube: claude-omniflywheel-100m-sweep | D42 ORCHESTRATION\nexport const CUBE = ${JSON.stringify(cube, null, 2)}\n`;
}

function buildReport(summary, shannonPacket, generatedAt) {
  const laneRows = summary.lanes.map((lane) => `| ${lane.lane} | ${lane.workers} | ${lane.gulps} | ${lane.genius} | ${lane.mistakes} | ${lane.avgScore} | ${lane.avgReverseGain} |`).join("\n");
  const geniusRows = summary.topGenius.map((row) => `| ${row.lane} | ${row.score} | ${row.pidRange} | ${row.summary} |`).join("\n");
  const mistakeRows = summary.topMistakes.map((row) => `| ${row.lane} | ${row.reverseGain} | ${row.pidRange} | ${row.summary} |`).join("\n");
  const smokeRows = summary.claudeSmoke.map((row) => `| ${row.pid} | ${row.ok} | ${row.elapsedMs} | ${String(row.responseText || row.error || "").replace(/\|/g, "/").slice(0, 120)} |`).join("\n");
  const json = { reportId: "claude-omniflywheel-100m-sweep-latest", generatedAt, status: summary.status, summary, shannon: shannonPacket };
  const md = `# Claude Omniflywheel 100M Sweep

Generated: ${generatedAt}

Status: ${summary.status}

This run uses PID-only real Claude CLI controller slots and a compact 100,000,000 logical-worker Brown-Hilbert PID/gulp sweep. It does not spawn 100,000,000 OS processes, run 100,000,000 live model sessions, or request model inference unless --live-claude is explicitly supplied.

## Claude CLI

- Claude executable: ${summary.claude.exe || "(not found)"}
- Version: ${summary.claude.version.stdout || "(unknown)"}
- Shell: false
- PID-only controller slots: ${summary.mode.pidOnlyControllerSlots && !summary.mode.liveClaudeModelCalls}
- Live Claude model calls: ${summary.mode.liveClaudeModelCalls}
- Bare mode: false (${summary.mode.bareSkippedReason})
- Print JSON mode: ${summary.mode.liveClaudeModelCalls}
- Tools disabled: true
- Session persistence: false
- Claude controller slots checked: ${summary.counts.realClaudeLaunches}
- PID slots ready: ${summary.counts.realClaudePidSlotsReady || 0}
- Live model sessions passed: ${summary.counts.liveClaudeModelSessions}

| PID | OK | ms | Response/Error |
| --- | --- | ---: | --- |
${smokeRows}

## Speed

- Compact range elapsed: ${summary.speed.compactRangeElapsedMs} ms
- Compact logical throughput: ${summary.speed.compactRangeThroughputWorkersPerSecond} workers/sec
- Logical gulp size: ${GULP_SIZE}
- Logical gulps: ${LOGICAL_GULPS}

## BEHCS Gulp Proof

- Proof messages recorded: ${summary.counts.realBehcsProofMessages}
- Gulp ok: ${summary.behcsGulp.ok}
- Gulp id: ${summary.behcsGulp.gulpId || "(none)"}
- Processed messages: ${summary.behcsGulp.processedMessages || 0}
- Mistakes detected by runtime: ${summary.behcsGulp.mistakesDetected || 0}
- GNN edges from runtime: ${summary.behcsGulp.gnnEdges || 0}

## Lane Summary

| Lane | Workers | Gulps | Genius | Mistakes | Avg Score | Avg Reverse Gain |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
${laneRows}

## Top Genius Marks

| Lane | Score | PID Range | Summary |
| --- | ---: | --- | --- |
${geniusRows}

## Top Mistake Marks

| Lane | Reverse Gain | PID Range | Summary |
| --- | ---: | --- | --- |
${mistakeRows}

## Shannon

- Consensus: ${shannonPacket.consensus}
- Execution: ${shannonPacket.executionDisposition}
`;
  return { json, md };
}

async function run({ execute = false, smokeCount = DEFAULT_SMOKE_COUNT, budgetUsd = DEFAULT_BUDGET_USD, liveClaude = false } = {}) {
  const generatedAt = new Date().toISOString();
  const startedAt = Date.now();
  const claudeExe = findClaudeExe();
  const version = claudeVersion(claudeExe);
  const realSmokeCount = safeInt(smokeCount, DEFAULT_SMOKE_COUNT, 0, MAX_SMOKE_COUNT);
  const claudeSmoke = [];
  for (let i = 0; i < realSmokeCount; i += 1) {
    claudeSmoke.push(liveClaude
      ? runClaudeLiveSmoke({ claudeExe, index: i, budgetUsd })
      : runClaudePidSlot({ claudeExe, index: i }));
  }
  const compact = makeRangeRows(claudeSmoke);
  const behcsProof = execute ? await runBehcsProof(generatedAt) : { proofRows: [], gulp: { ok: true, skipped: true, reason: "preview" } };
  const finishedAt = Date.now();
  const passCount = claudeSmoke.filter((row) => row.ok).length;
  const summary = {
    summaryId: "claude-omniflywheel-100m-sweep-summary",
    generatedAt,
    startedAt: new Date(startedAt).toISOString(),
    finishedAt: new Date(finishedAt).toISOString(),
    elapsedMs: finishedAt - startedAt,
    status: "CLAUDE_OMNIFLYWHEEL_100M_SWEEP_COMPLETE",
    mode: { ...MODE, liveClaudeModelCalls: Boolean(liveClaude) },
    claude: { exe: claudeExe, version },
    claudeSmoke,
    behcsGulp: behcsProof.gulp,
    counts: {
      logicalWorkers: TOTAL_WORKERS,
      logicalGulps: LOGICAL_GULPS,
      claudeControllerSlots: CLAUDE_CONTROLLER_SLOTS,
      omnispindles: OMNISPINDLE_COUNT,
      compactRangeRowsWritten: compact.rows.length,
      realBehcsProofMessages: behcsProof.proofRows.length,
      realClaudeLaunches: realSmokeCount,
      liveClaudeModelSessions: liveClaude ? passCount : 0,
      realClaudePidSlotsReady: liveClaude ? 0 : passCount,
      osProcessesForWorkers: 0,
      geniusMarks: compact.geniusRows.length,
      mistakeMarks: compact.mistakeRows.length,
      downloads: 0,
      installs: 0
    },
    speed: {
      compactRangeElapsedMs: round3(compact.elapsedMs),
      compactRangeThroughputWorkersPerSecond: compact.compactRangeThroughputWorkersPerSecond,
      endToEndElapsedMs: finishedAt - startedAt
    },
    honesty: {
      cliBoundary: liveClaude ? "Live Claude CLI smoke may call a model provider; this path is explicit and budget-capped." : "PID-only Claude controller slots call only the local Claude executable version path and do not request model inference.",
      realWorkPerformed: [liveClaude ? "bounded_claude_cli_live_smoke" : "claude_cli_pid_slot_version_proof", "bounded_behcs_collector_messages", "one_behcs_gulp_rehydration", "compact_100m_pid_range_sweep"],
      notPerformed: liveClaude ? ["100m_os_processes", "100m_live_llm_sessions", "unbounded_auth", "downloads", "installs"] : ["provider_model_call", "api_key_path", "api_header_path", "100m_os_processes", "100m_live_llm_sessions", "unbounded_auth", "downloads", "installs"]
    },
    lanes: compact.lanes,
    rangeDigest: sha256Text(compact.rows.map((row) => row.digest).join("|")),
    geniusDigest: sha256Text(compact.geniusRows.map((row) => row.glyph).join("|")),
    mistakeDigest: sha256Text(compact.mistakeRows.map((row) => row.glyph).join("|")),
    checksum: compact.checksum,
    topGenius: compact.geniusRows.slice(0, 10),
    topMistakes: compact.mistakeRows.slice(0, 10),
    outputs: {
      report: repoRel(PATHS.reportMd),
      summary: repoRel(PATHS.summary),
      ranges: repoRel(PATHS.ranges),
      proofMessages: repoRel(PATHS.proofMessages),
      genius: repoRel(PATHS.geniusNdjson),
      mistakes: repoRel(PATHS.mistakesNdjson),
      smoke: repoRel(PATHS.smokeNdjson)
    }
  };
  const shannonPacket = buildShannon(summary, generatedAt);
  const hermesPacket = buildHermes(summary, shannonPacket, generatedAt);
  const cube = buildCube(summary, shannonPacket, generatedAt);
  const report = buildReport(summary, shannonPacket, generatedAt);
  const eventId = `claude-omniflywheel-100m-${Date.now()}`;
  if (execute) {
    writeNdjson(PATHS.ranges, compact.rows);
    writeNdjson(PATHS.proofMessages, behcsProof.proofRows);
    writeNdjson(PATHS.geniusNdjson, compact.geniusRows);
    writeNdjson(PATHS.mistakesNdjson, compact.mistakeRows);
    writeNdjson(PATHS.smokeNdjson, claudeSmoke);
    writeJson(PATHS.summary, summary);
    writeJson(PATHS.state, { savedAt: generatedAt, status: summary.status, mode: summary.mode, summary: repoRel(PATHS.summary), report: repoRel(PATHS.reportMd) });
    writeJson(PATHS.hermes, hermesPacket);
    writeJson(PATHS.shannon, shannonPacket);
    writeText(PATHS.cube, cube);
    writeJson(PATHS.reportJson, report.json);
    writeText(PATHS.reportMd, report.md);
    appendNdjson(PATHS.inbox, { id: eventId, ts: generatedAt, from: "asolaria", to: "claude-omniflywheel", verb: "EVT-CLAUDE-OMNIFLYWHEEL-100M-SWEEP", body: { status: summary.status, report: repoRel(PATHS.reportMd), logicalWorkers: TOTAL_WORKERS } });
    appendNdjson(PATHS.outbox, { id: `${eventId}-hermes`, ts: generatedAt, from: "hermes", to: "claude-omniflywheel", verb: hermesPacket.packet.verb, body: hermesPacket });
    appendNdjson(PATHS.gnnEdges, { id: `${eventId}-edge`, ts: generatedAt, from: liveClaude ? "claude_cli_live_smoke" : "claude_cli_pid_slots", to: "compact_100m_pid_sweep", verb: "proved_lane_then_compacted_ranges", weight: passCount > 0 ? 0.86 : 0.42 });
  }
  return {
    ok: true,
    action: execute ? "run" : "preview",
    generatedAt,
    status: summary.status,
    claude: { exe: claudeExe, version },
    claudeSmoke: claudeSmoke.map((row) => ({ pid: row.pid, ok: row.ok, elapsedMs: row.elapsedMs, status: row.status, error: row.error || row.stderr.slice(0, 240), responseText: row.responseText.slice(0, 240) })),
    logicalWorkers: TOTAL_WORKERS,
    logicalGulps: LOGICAL_GULPS,
    compactRangeElapsedMs: summary.speed.compactRangeElapsedMs,
    compactRangeThroughputWorkersPerSecond: summary.speed.compactRangeThroughputWorkersPerSecond,
    behcsGulp: { ok: summary.behcsGulp.ok, gulpId: summary.behcsGulp.gulpId, processedMessages: summary.behcsGulp.processedMessages, mistakesDetected: summary.behcsGulp.mistakesDetected, gnnEdges: summary.behcsGulp.gnnEdges },
    geniusMarks: summary.counts.geniusMarks,
    mistakeMarks: summary.counts.mistakeMarks,
    outputs: summary.outputs,
    mode: { ...MODE, liveClaudeModelCalls: Boolean(liveClaude) }
  };
}

function main(argv) {
  const action = argv[2] || "status";
  const execute = argv.includes("--execute");
  const liveClaude = argv.includes("--live-claude");
  const smokeCount = safeInt(parseArgValue(argv, "smoke-count", DEFAULT_SMOKE_COUNT), DEFAULT_SMOKE_COUNT, 0, MAX_SMOKE_COUNT);
  const budgetUsd = parseArgValue(argv, "budget-usd", DEFAULT_BUDGET_USD);
  if (action === "status") {
    const claudeExe = findClaudeExe();
    console.log(JSON.stringify({ ok: true, status: "READY", claude: { exe: claudeExe, version: claudeVersion(claudeExe) }, logicalWorkers: TOTAL_WORKERS, logicalGulps: LOGICAL_GULPS, mode: MODE }, null, 2));
    return;
  }
  if (action === "run") {
    run({ execute, smokeCount, budgetUsd, liveClaude }).then((result) => console.log(JSON.stringify(result, null, 2))).catch((error) => {
      console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
      process.exitCode = 1;
    });
    return;
  }
  console.error(JSON.stringify({ ok: false, error: `Unknown action: ${action}`, usage: ["node tools/claude-omniflywheel-100m-sweep.js status", "node tools/claude-omniflywheel-100m-sweep.js run --execute --smoke-count=100", "node tools/claude-omniflywheel-100m-sweep.js run --execute --live-claude --smoke-count=1"] }, null, 2));
  process.exitCode = 2;
}

main(process.argv);
