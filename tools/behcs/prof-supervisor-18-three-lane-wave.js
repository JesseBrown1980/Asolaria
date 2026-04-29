#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { spawn } = require("child_process");

const repoRoot = path.resolve(__dirname, "..", "..");
const runId = process.env.ASOLARIA_PROF18_RUN_ID || "prof-supervisor-18-pure-read-vote-wave-20260427";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", runId);
const resultsPath = path.join(runRoot, "results.ndjson");
const summaryPath = path.join(runRoot, "summary.json");
const reportPath = path.join(repoRoot, "reports", "prof-supervisor-18-three-lane-wave-latest.md");

const timeoutMs = Number(process.env.ASOLARIA_PROF18_TIMEOUT_MS || 120000);

const supervisors = [
  ["COL-ASOLARIA", "collisions"],
  ["PROF-CHIEFCOUNCIL", "collisions"],
  ["PROF-HERMES", "collisions"],
  ["PROF-SHANNON", "collisions"],
  ["PROF-OMNISHANNON", "collisions"],
  ["PROF-CONVERGENCE", "collisions"],
  ["PROF-LIRIS", "acer-promote"],
  ["PROF-ACER", "acer-promote"],
  ["PROF-FALCON", "acer-promote"],
  ["PROF-AETHER", "acer-promote"],
  ["PROF-GAIA", "acer-promote"],
  ["PROF-EBACMAP", "acer-promote"],
  ["PROF-KERNEL", "snapshot"],
  ["PROF-PID100B", "snapshot"],
  ["PROF-OMNIROUTER", "snapshot"],
  ["PROF-HOOKWALL", "snapshot"],
  ["PROF-INSTRUCT-KR", "snapshot"],
  ["PROF-OMNIFLYWHEEL", "snapshot"]
];

const defaultModels = [
  "opencode/big-pickle",
  "opencode/hy3-preview-free",
  "opencode/ling-2.6-flash-free",
  "opencode/minimax-m2.5-free",
  "opencode/nemotron-3-super-free"
];
const models = String(process.env.ASOLARIA_PROF18_MODELS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
if (models.length === 0) {
  models.push(...defaultModels);
}
const supervisorLimit = Math.max(1, Math.min(supervisors.length, Number(process.env.ASOLARIA_PROF18_LIMIT || supervisors.length)));
const concurrency = Math.max(1, Math.min(supervisorLimit, Number(process.env.ASOLARIA_PROF18_CONCURRENCY || 1)));

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

function sha(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex");
}

function pid(seed) {
  return `BH.AGENT.PID.${sha(seed).slice(0, 12).toUpperCase()}`;
}

function safeStat(target) {
  try {
    const stat = fs.lstatSync(target);
    return {
      exists: true,
      isDirectory: stat.isDirectory(),
      isFile: stat.isFile(),
      isSymbolicLink: stat.isSymbolicLink()
    };
  } catch (error) {
    return { exists: false, error: error.code || String(error.message || error) };
  }
}

function parseEvents(stdout) {
  const events = [];
  for (const line of String(stdout || "").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      events.push(JSON.parse(trimmed));
    } catch (_error) {
      // Keep stdout hash in result row.
    }
  }
  return events;
}

function extractText(events, stdout) {
  const textEvents = events
    .filter((event) => event.type === "text")
    .map((event) => event.part?.text || event.text || "")
    .join("\n")
    .trim();
  if (textEvents) return textEvents;
  const raw = String(stdout || "").trim();
  return raw.slice(0, 1600);
}

function extractJsonObject(text) {
  const raw = String(text || "").trim();
  if (!raw) return null;
  const clean = raw
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  const candidates = [clean];
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    candidates.push(fenced[1].trim());
  }
  for (let start = 0; start < raw.length; start += 1) {
    if (raw[start] !== "{") continue;
    const candidate = balancedJsonObjectCandidate(raw, start);
    if (candidate) {
      candidates.push(candidate);
    }
  }
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
    } catch (_error) {
      // Continue to next candidate.
    }
  }
  return null;
}

function balancedJsonObjectCandidate(raw, start) {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < raw.length; index += 1) {
    const char = raw[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = inString;
      continue;
    }
    if (char === "\"") {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return raw.slice(start, index + 1);
      }
    }
  }
  return "";
}

function detectToolUse(events, text, parsedJson) {
  if (events.some((event) => event.type === "tool_use" || event.part?.type === "tool" || event.tool || event.callID)) {
    return true;
  }
  if (parsedJson && typeof parsedJson === "object" && parsedJson.name && parsedJson.arguments && !parsedJson.verdict) {
    return true;
  }
  return /<\/?tool_call>|"name"\s*:\s*"(?:bash|bosh|shell|powershell|cmd)"\s*,\s*"arguments"/i.test(String(text || ""));
}

function normalizeVote(vote, supervisor, lane) {
  if (!vote || typeof vote !== "object") return null;
  const verdict = String(vote.verdict || "").trim().toUpperCase();
  const writerAuthority = String(vote.writerAuthority || "none").trim().toLowerCase();
  if (!["APPROVE", "DEFER", "BLOCK"].includes(verdict)) return null;
  if (writerAuthority !== "none") return null;
  return {
    supervisor: String(vote.supervisor || supervisor),
    lane: String(vote.lane || lane),
    verdict,
    writerAuthority,
    doNow: String(vote.doNow || "").slice(0, 280),
    hold: String(vote.hold || "").slice(0, 280),
    reason: String(vote.reason || "").slice(0, 400)
  };
}

function buildPrompt(index, supervisor, lane, agentPid, model) {
  const historyState = safeStat(path.join(repoRoot, ".history"));
  return [
    "Return exactly one minified JSON object and then stop. No markdown. No prose. No tool calls.",
    `supervisor=${supervisor}; lane=${lane}; pid=${agentPid}; wave=${runId}; model=${model}.`,
    "This is an advisory vote, not an investigation. Do not inspect files. Do not use tools. Do not call shell. Do not request MCP. Do not edit.",
    `Evidence: dotHistory=${JSON.stringify(historyState)}; method=supervisors_vote_codex_aggregates; live_writes_require=Hookwall_or_Shannon_or_OmniWhiteRoom_or_GNN.`,
    "Question: should this lane approve bounded next planning/execution, defer for evidence, or block?",
    `Required JSON: {"supervisor":"${supervisor}","lane":"${lane}","verdict":"APPROVE|DEFER|BLOCK","writerAuthority":"none","doNow":"short action","hold":"short hold","reason":"short reason"}`,
    "If uncertain, use verdict DEFER and writerAuthority none. Any shell/tool-shaped output invalidates the vote."
  ].join("\n");
}

function runSupervisor(index, supervisor, lane) {
  return new Promise((resolve) => {
    const model = models[(index - 1) % models.length];
    const agentPid = pid(`${runId}:${index}:${supervisor}:${lane}:${model}`);
    const prompt = buildPrompt(index, supervisor, lane, agentPid, model);
    const startedAt = new Date().toISOString();
    const startedMs = Date.now();
    const voteCwd = path.join(runRoot, "opencode-empty-cwd");
    fs.mkdirSync(voteCwd, { recursive: true });
    console.log(`START ${String(index).padStart(2, "0")}/18 ${supervisor} lane=${lane} model=${model} pid=${agentPid}`);

    const opencodeCommand = process.platform === "win32" ? "opencode.cmd" : "opencode";
    const child = spawn(opencodeCommand, [
      "run",
      "--pure",
      "--format",
      "json",
      "-m",
      model,
      "--dir",
      voteCwd,
      prompt
    ], {
      cwd: voteCwd,
      windowsHide: true,
      shell: false,
      env: {
        ...process.env,
        BROWN_HILBERT_PID: agentPid,
        BEHCS256_GLYPH: "PROF-SUPERVISOR-THREE-LANE-WAVE",
        ASOLARIA_BOUNDARY: "NO_TOOLS_NO_FILE_EDITS_NO_FANOUT",
        ASOLARIA_WRITER_AUTHORITY: "NONE_ADVISORY_ONLY",
        ASOLARIA_DISABLE_CONTEXT_LOAD: "1",
        ASOLARIA_PROF18_ISOLATED_CWD: "1"
      }
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      try {
        child.kill();
        if (process.platform === "win32" && child.pid) {
          spawn("taskkill.exe", ["/PID", String(child.pid), "/T", "/F"], { windowsHide: true });
        }
      } catch (_error) {
        // Ignore kill races.
      }
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr = (stderr + chunk.toString()).slice(-2400);
    });
    child.on("error", (error) => {
      stderr = (stderr + `\nERROR:${error.message}`).slice(-2400);
    });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      const events = parseEvents(stdout);
      const text = extractText(events, stdout);
      const parsedJson = extractJsonObject(text);
      const hasToolUse = detectToolUse(events, text, parsedJson);
      const vote = normalizeVote(parsedJson, supervisor, lane);
      const finish = events.find((event) => event.type === "step_finish");
      const failureReason = timedOut
        ? "timeout"
        : code !== 0
          ? "nonzero_exit"
          : hasToolUse
            ? "tool_use_detected"
            : !vote
              ? "schema_invalid"
              : "";
      const row = {
        index,
        supervisor,
        lane,
        model,
        pid: agentPid,
        startedAt,
        finishedAt: new Date().toISOString(),
        elapsedMs: Date.now() - startedMs,
        ok: code === 0 && !timedOut && Boolean(vote) && !hasToolUse,
        exitCode: code,
        signal,
        timedOut,
        responseText: text.slice(0, 2400),
        vote,
        hasToolUse,
        failureReason,
        responseSha256: sha(text),
        stdoutSha256: sha(stdout),
        stderr: stderr.slice(0, 1200),
        tokens: finish?.part?.tokens || null,
        cost: typeof finish?.part?.cost === "number" ? finish.part.cost : null,
        boundary: "Advisory supervisor/PROF vote only. No tools. No file edits. No fanout."
      };
      appendText(resultsPath, JSON.stringify(row));
      const cost = row.cost === null ? "null" : String(row.cost);
      console.log(`${row.ok ? "OK   " : "FAIL "} ${String(index).padStart(2, "0")}/18 ${supervisor} lane=${lane} ms=${row.elapsedMs} cost=${cost}`);
      resolve(row);
    });
  });
}

function extractVerdict(text) {
  const upper = String(text || "").toUpperCase();
  if (upper.includes("BLOCK")) return "BLOCK";
  if (upper.includes("DEFER")) return "DEFER";
  if (upper.includes("APPROVE")) return "APPROVE";
  return "UNKNOWN";
}

function buildSummary(rows) {
  const byLane = {};
  for (const row of rows) {
    byLane[row.lane] ||= { ok: 0, fail: 0, approve: 0, defer: 0, block: 0, unknown: 0 };
    if (row.ok) byLane[row.lane].ok += 1;
    else byLane[row.lane].fail += 1;
    const verdict = (row.vote?.verdict || extractVerdict(row.responseText)).toLowerCase();
    if (byLane[row.lane][verdict] !== undefined) byLane[row.lane][verdict] += 1;
    else byLane[row.lane].unknown += 1;
  }
  return {
    id: "prof-supervisor-18-three-lane-wave-summary.v1",
    runId,
    generatedAt: new Date().toISOString(),
    attempted: rows.length,
    okCount: rows.filter((row) => row.ok).length,
    failCount: rows.filter((row) => !row.ok).length,
    timedOutCount: rows.filter((row) => row.timedOut).length,
    totalCost: rows.reduce((sum, row) => sum + (typeof row.cost === "number" ? row.cost : 0), 0),
    timeoutMs,
    concurrency,
    supervisorLimit,
    lanes: byLane,
    historyState: safeStat(path.join(repoRoot, ".history")),
    artifacts: {
      results: path.relative(repoRoot, resultsPath),
      summary: path.relative(repoRoot, summaryPath),
      report: path.relative(repoRoot, reportPath)
    },
    acceptance: {
      strictJsonOnly: true,
      allowedVerdicts: ["APPROVE", "DEFER", "BLOCK"],
      writerAuthorityMustBe: "none",
      toolUseRejected: true,
      shellLikeJsonRejected: true,
      timedOutRowsRejected: true
    },
    boundary: "OpenCode free-agent supervisor calls. Isolated cwd. JSON-only votes. Codex does not write live files here."
  };
}

function buildReport(summary, rows) {
  const lines = [];
  lines.push("# PROF Supervisor 18 Three-Lane Wave");
  lines.push("");
  lines.push(`- Run: ${summary.runId}`);
  lines.push(`- Attempted: ${summary.attempted}`);
  lines.push(`- OK: ${summary.okCount}`);
  lines.push(`- Failed: ${summary.failCount}`);
  lines.push(`- Timed out: ${summary.timedOutCount}`);
  lines.push(`- Timeout ms: ${summary.timeoutMs}`);
  lines.push(`- Concurrency: ${summary.concurrency}`);
  lines.push(`- Supervisor limit: ${summary.supervisorLimit}`);
  lines.push(`- Total cost: ${summary.totalCost}`);
  lines.push(`- .history: ${JSON.stringify(summary.historyState)}`);
  lines.push("");
  lines.push("## Lane Votes");
  for (const [lane, vote] of Object.entries(summary.lanes)) {
    lines.push(`- ${lane}: ok=${vote.ok}, fail=${vote.fail}, approve=${vote.approve}, defer=${vote.defer}, block=${vote.block}, unknown=${vote.unknown}`);
  }
  lines.push("");
  lines.push("## Rows");
  for (const row of rows) {
    lines.push(`- ${row.index}/18 ${row.supervisor} ${row.lane}: ok=${row.ok}, verdict=${row.vote?.verdict || extractVerdict(row.responseText)}, failure=${row.failureReason || "none"}, toolUse=${row.hasToolUse}, timeout=${row.timedOut}, model=${row.model}, ms=${row.elapsedMs}, sha=${row.responseSha256.slice(0, 12)}`);
  }
  lines.push("");
  lines.push("Boundary: advisory supervisor/PROF wave only. Live writes require Hookwall/Shannon/OmniWhiteRoom/GNN writer authority packets.");
  return lines.join("\n");
}

async function main() {
  fs.mkdirSync(runRoot, { recursive: true });
  if (fs.existsSync(resultsPath)) {
    fs.unlinkSync(resultsPath);
  }
  const selected = supervisors.slice(0, supervisorLimit);
  const rows = await runWithConcurrency(selected, concurrency);
  rows.sort((a, b) => a.index - b.index);
  const summary = buildSummary(rows);
  writeText(summaryPath, JSON.stringify(summary, null, 2));
  writeText(reportPath, buildReport(summary, rows));
  console.log(JSON.stringify(summary, null, 2));
}

async function runWithConcurrency(selected, workerCount) {
  const rows = [];
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < selected.length) {
      const current = nextIndex;
      nextIndex += 1;
      const [supervisor, lane] = selected[current];
      rows.push(await runSupervisor(current + 1, supervisor, lane));
    }
  }
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return rows;
}

module.exports = {
  parseEvents,
  extractText,
  extractJsonObject,
  detectToolUse,
  normalizeVote,
  buildPrompt,
  buildSummary
};

if (require.main === module) {
  main().catch((error) => {
    console.error(error && error.stack ? error.stack : String(error));
    process.exit(1);
  });
}
