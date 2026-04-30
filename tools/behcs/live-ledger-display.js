#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..", "..");
const watchPath = process.env.ASOLARIA_LIVE_LEDGER_PATH
  || process.argv[2]
  || path.join(repoRoot, "data", "behcs", "orchestration", process.env.ASOLARIA_SUPERVISOR_RUN_ID || "real-free-agent-system-test-acer-20260428", "supervisor-lanes");
const refreshMs = Number(process.env.ASOLARIA_LIVE_LEDGER_REFRESH_MS || 1000);
const maxIdleMs = Number(process.env.ASOLARIA_LIVE_LEDGER_MAX_IDLE_MS || 0);

const colors = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m"
};

function colorize(text, color) {
  if (!process.stdout.isTTY) return text;
  return `${colors[color] || ""}${text}${colors.reset}`;
}

function formatRow(row, totals) {
  const isShard = row.shardHash && row.logicalAgentsRepresented !== undefined;
  const status = isShard
    ? colorize("SHRD", "blue")
    : (row.ok
      ? colorize("OK  ", "green")
      : (row.timedOut ? colorize("TIME", "yellow") : colorize("FAIL", "red")));
  const seq = String(row.localIndex || row.seq || totals.count).padStart(4, "0");
  const model = (row.model || row.selectedModelForEmpiricalSample || "unknown").replace(/^opencode\//, "OC/").replace(/^anthropic\//, "AN/");
  const policy = row.modelPolicy || row.policy || "?";
  const lane = row.lane || "?";
  const q = row.questionId || row.question?.id || "none";
  const ms = row.elapsedMs ? `${row.elapsedMs}ms` : "—";
  const cost = row.cost === null || row.cost === undefined ? "—" : String(row.cost);
  return [
    status,
    colorize(seq, "dim"),
    colorize(`${policy}/${model}`, "cyan"),
    colorize(`lane=${lane}`, "magenta"),
    colorize(`q=${q}`, "blue"),
    colorize(`t=${ms}`, "dim"),
    colorize(`$=${cost}`, "dim")
  ].join(" ");
}

function aggregate(rows) {
  const byPolicy = new Map();
  const byModel = new Map();
  let ok = 0;
  let fail = 0;
  let timedOut = 0;
  let totalMs = 0;
  let shards = 0;
  let logicalAgents = 0;
  for (const row of rows) {
    const policy = row.modelPolicy || "unknown";
    const model = row.model || row.selectedModelForEmpiricalSample || "unknown";
    byPolicy.set(policy, (byPolicy.get(policy) || 0) + 1);
    byModel.set(model, (byModel.get(model) || 0) + 1);
    if (row.shardHash && row.logicalAgentsRepresented !== undefined) {
      shards += 1;
      logicalAgents += Number(row.logicalAgentsRepresented) || 0;
    } else if (row.ok === true) {
      ok += 1;
    } else if (row.ok === false) {
      if (row.timedOut) timedOut += 1;
      fail += 1;
    }
    if (row.elapsedMs) totalMs += row.elapsedMs;
  }
  return { count: rows.length, ok, fail, timedOut, totalMs, shards, logicalAgents, byPolicy, byModel };
}

function printHeader() {
  console.log(colorize("=".repeat(96), "dim"));
  console.log(colorize("  LIVE LEDGER — model-agnostic supervisor tail (any leader model)", "cyan"));
  console.log(colorize(`  Watching: ${watchPath}`, "dim"));
  console.log(colorize("=".repeat(96), "dim"));
}

function printFooter(totals) {
  if (!totals.count) return;
  console.log(colorize("-".repeat(96), "dim"));
  const policies = Array.from(totals.byPolicy.entries()).map(([k, v]) => `${k}=${v}`).join(" ");
  const models = Array.from(totals.byModel.entries()).map(([k, v]) => `${k.replace(/^opencode\//, "OC/")}=${v}`).join(" ");
  console.log(`  ${colorize("totals", "cyan")}: rows=${totals.count} ok=${totals.ok} fail=${totals.fail} timedOut=${totals.timedOut} shards=${totals.shards} logicalAgents=${totals.logicalAgents} totalMs=${totals.totalMs}`);
  console.log(`  ${colorize("policy", "magenta")}: ${policies}`);
  console.log(`  ${colorize("model ", "blue")}: ${models}`);
}

function readNdjson(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => { try { return JSON.parse(line); } catch (_e) { return null; } })
    .filter(Boolean);
}

function gatherRows(target) {
  const stat = fs.existsSync(target) ? fs.statSync(target) : null;
  if (!stat) return [];
  if (stat.isDirectory()) {
    const files = fs.readdirSync(target).filter((name) => name.endsWith(".ndjson"));
    return files.flatMap((name) => readNdjson(path.join(target, name))
      .map((row, idx) => ({ ...row, _source: name, _localIdx: idx + 1 })));
  }
  return readNdjson(target);
}

let printed = 0;
let lastChange = Date.now();

function tick() {
  const rows = gatherRows(watchPath);
  if (rows.length > printed) {
    for (let i = printed; i < rows.length; i += 1) {
      console.log(formatRow(rows[i], { count: i + 1 }));
    }
    const totals = aggregate(rows);
    printFooter(totals);
    printed = rows.length;
    lastChange = Date.now();
  }
  if (maxIdleMs > 0 && Date.now() - lastChange > maxIdleMs) {
    console.log(colorize(`\n[idle > ${maxIdleMs}ms; exiting]`, "dim"));
    process.exit(0);
  }
}

function once() {
  const rows = gatherRows(watchPath);
  for (let i = 0; i < rows.length; i += 1) {
    console.log(formatRow(rows[i], { count: i + 1 }));
  }
  printFooter(aggregate(rows));
}

function main() {
  const args = new Set(process.argv.slice(2));
  printHeader();
  if (args.has("--once") || process.env.ASOLARIA_LIVE_LEDGER_ONCE) {
    once();
    return;
  }
  tick();
  setInterval(tick, refreshMs).unref();
}

if (require.main === module) main();

module.exports = { gatherRows, aggregate, formatRow };
