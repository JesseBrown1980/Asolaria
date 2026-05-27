#!/usr/bin/env node
// fabric-revolver.mjs — REVOLVER ARCHITECTURE
// Fixed chambers (slots) rotate through: EMPTY → LOAD → RUN → COLLECT → EJECT → EMPTY
// Billions of backend addresses = tuple space. Only N live TUI/free-agent workers in chambers.
// Omnispindle loads chambers. Omniflywheel routes. Fabric loop fires.
//
// Use:   node tools/behcs/fabric-revolver.mjs --help
//        node tools/behcs/fabric-revolver.mjs --watch --chambers 8 --interval-s 30
//        node tools/behcs/fabric-revolver.mjs --status

import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const ROOT = "C:/Users/rayss/Asolaria";
const STATE_DIR = path.join(ROOT, "data", "behcs", "state");
const STATE_FILE = path.join(STATE_DIR, "fabric-revolver-state.json");
const LOG_FILE = path.join(STATE_DIR, "fabric-revolver.ndjson");

const FREE_MODELS = [
  "opencode/big-pickle",
  "opencode/hy3-preview-free",
  "opencode/ling-2.6-flash-free",
  "opencode/minimax-m2.5-free",
  "opencode/nemotron-3-super-free",
];

const TASKS = [
  { id: "T-supervisor-exercise", prompt: "Asolaria fabric. Pick one ASSUMED supervisor and suggest a concrete read-only check to exercise its authority. Reply: SUPERVISOR | check_command." },
  { id: "T-corpus-mine", prompt: "Pick 3 keywords missing from the BEHCS-1024 council-vote corpus that would help score EVT-PEER-HANDSHAKE class. Reply: keyword1, keyword2, keyword3." },
  { id: "T-bus-pressure", prompt: "The bus saturates after ~80 envelopes/16min. Suggest one write-batch optimization that reduces fsync count without losing durability. ≤30 words." },
  { id: "T-d11-promotion", prompt: "Propose one concrete signal that would justify ASSUMED→OBSERVED promotion for a federation supervisor with no cosign receipts yet. ≤25 words." },
  { id: "T-cosign-strategy", prompt: "Cosign chain grows ~1 entry per fabric tick. Suggest one aggregation strategy that reduces chain entries while preserving auditability. ≤30 words." },
  { id: "T-tier-scout", prompt: "Pick one BEHCS-1024 access tier (SECRET, STEALTH, SHADOW, SOVEREIGNTY). Describe one probe that tier could safely run. Reply: TIER | probe_description." },
  { id: "T-gnn-feature", prompt: "The GNN scores fabric proposals. Suggest one additional edge feature that would improve classification of supervisor votes. ≤25 words." },
  { id: "T-revolver-optimize", prompt: "This message is running inside a revolver-chamber free-agent slot. Suggest one optimization to the revolver pattern itself. ≤30 words." },
  { id: "T-mistake-pattern", prompt: "Name one mistake pattern you see in BEHCS-1024 addressing that a reverse-gain sieve could catch. ≤30 words." },
  { id: "T-genius-mine", prompt: "Propose one 'genius mark' criteria: what makes a fabric proposal worth promoting rather than discarding. ≤25 words." },
];

const args = process.argv.slice(2);

// === STATE MANAGEMENT ===
function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, "utf8")); } catch { return defaultState(); }
}
function saveState(s) { fs.mkdirSync(STATE_DIR, { recursive: true }); fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2)); }
function appendLog(row) { try { fs.mkdirSync(STATE_DIR, { recursive: true }); fs.appendFileSync(LOG_FILE, JSON.stringify(row) + "\n"); } catch {} }
function now() { return new Date().toISOString(); }
function defaultState() {
  return {
    chambers: [],
    chamberCount: 6,
    rotation: 0,
    totalLoads: 0,
    totalCompletes: 0,
    totalErrors: 0,
    startedAt: now(),
    lastTickAt: null,
  };
}

function initChambers(count) {
  const s = loadState();
  s.chamberCount = count;
  s.chambers = [];
  for (let i = 0; i < count; i++) {
    s.chambers.push({
      chamber: i,
      state: "EMPTY",
      taskId: null,
      model: null,
      loadedAt: null,
      completedAt: null,
      result: null,
      error: null,
      pid: `BH.REVOLVER.CHAMBER.${String(i).padStart(3, "0")}`,
    });
  }
  saveState(s);
  return s;
}

// === OPENCODE RUNNER ===
function runOpencode(model, prompt, timeoutMs = 90000) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const p = spawn("opencode", ["run", "--model", model, "--format", "json", JSON.stringify(prompt)], { stdio: ["ignore", "pipe", "pipe"], shell: true });
    let stdout = "", stderr = "";
    const timer = setTimeout(() => { try { p.kill(); } catch {} }, timeoutMs);
    p.stdout.on("data", c => stdout += c);
    p.stderr.on("data", c => stderr += c);
    p.on("close", (code) => {
      clearTimeout(timer);
      resolve({ ok: code === 0, code, elapsed_ms: Date.now() - startedAt, stdout: stdout.slice(-3000), stderr: stderr.slice(-500) });
    });
    p.on("error", (e) => { clearTimeout(timer); resolve({ ok: false, error: e.message }); });
  });
}

function extractReply(stdout) {
  const lines = stdout.split("\n").filter(l => l.trim().startsWith("{"));
  for (const l of lines) {
    try {
      const j = JSON.parse(l);
      if (j.type === "assistant" || j.type === "text" || j.type === "message") return (j.content || j.text || "").slice(0, 500);
      if (j.role === "assistant" && j.content) return j.content.slice(0, 500);
    } catch {}
  }
  const textMatch = stdout.match(/(?:assistant|reply|response)[^"]*"([^"]{10,500})"/i);
  return textMatch ? textMatch[1] : stdout.replace(/\n/g, " ").slice(0, 200);
}

// === REVOLVER CYCLE ===
async function revolverTick() {
  const s = loadState();
  const ts = now();
  s.lastTickAt = ts;

  // Ensure chambers exist
  if (s.chambers.length === 0) { initChambers(s.chamberCount); return; }

  // Phase 1: EJECT completed chambers (collect results, mark EMPTY)
  for (const ch of s.chambers) {
    if (ch.state === "COMPLETE" || ch.state === "ERROR") {
      appendLog({ ts, chamber: ch.chamber, action: "eject", taskId: ch.taskId, state: ch.state, result: ch.result?.slice(0, 100) || ch.error });
      ch.state = "EMPTY";
      ch.taskId = null;
      ch.model = null;
      ch.loadedAt = null;
      ch.completedAt = null;
      ch.result = null;
      ch.error = null;
      s.totalCompletes++;
    }
  }

  // Phase 2: COLLECT running chambers that finished
  // (opencode runs are async; in a real impl these would be awaited)
  for (const ch of s.chambers) {
    if (ch.state === "RUNNING" && ch._process) {
      // In single-threaded mode, we check if process completed
      // For now, mark RUNNING chambers as COMPLETE after one tick
      // (real impl would use process exit codes)
      if (ch._result) {
        ch.state = "COMPLETE";
        ch.result = ch._result;
        ch.completedAt = ts;
        delete ch._process;
        delete ch._result;
      }
    }
  }

  // Phase 3: LOAD empty chambers with new tasks
  // FIX 2026-05-26 (operator-witness OP-JESSE within quintuple-auth window):
  // Previously fire-and-forget — chambers stuck in RUNNING because parent
  // process.exit() killed children before .then() callbacks ran. Now collect
  // promises and await before saveState. See diagnosis row 748f2798f6fbb887.
  const taskCount = TASKS.length;
  const pending = [];
  for (const ch of s.chambers) {
    if (ch.state !== "EMPTY") continue;
    const taskIdx = (s.rotation + ch.chamber) % taskCount;
    const task = TASKS[taskIdx];
    const model = FREE_MODELS[(s.rotation + ch.chamber) % FREE_MODELS.length];

    ch.state = "LOADING";
    ch.taskId = task.id;
    ch.model = model;
    ch.loadedAt = ts;
    ch.state = "RUNNING";
    s.totalLoads++;

    pending.push(
      runOpencode(model, task.prompt).then(result => {
        if (result.ok) {
          ch._result = extractReply(result.stdout);
          ch.error = null;
        } else {
          ch._result = null;
          ch.error = result.error || `exit_${result.code}`;
          s.totalErrors++;
        }
        ch._done = true;
      })
    );
  }

  // Await all opencode promises before saveState so chambers transition
  // RUNNING → COMPLETE/ERROR within this tick (not lost to process.exit).
  await Promise.all(pending);

  // Phase 3b: transition newly-completed chambers
  for (const ch of s.chambers) {
    if (ch._done) {
      ch.state = ch.error ? "ERROR" : "COMPLETE";
      if (!ch.error) ch.result = ch._result;
      ch.completedAt = ts;
      delete ch._process;
      delete ch._result;
      delete ch._done;
    }
  }

  // Phase 4: Advance rotation
  s.rotation = (s.rotation + 1) % 1000000;

  saveState(s);
  return s;
}

// === REPORT ===
function report(s) {
  const states = {};
  for (const ch of s.chambers) { states[ch.state] = (states[ch.state] || 0) + 1; }
  const active = s.chambers.filter(c => c.state === "RUNNING" || c.state === "LOADING");
  const ready = s.chambers.filter(c => c.state === "COMPLETE");
  return {
    chambers: s.chamberCount,
    rotation: s.rotation,
    states,
    active: active.length,
    ready_for_collection: ready.length,
    total_loads: s.totalLoads,
    total_completes: s.totalCompletes,
    total_errors: s.totalErrors,
    last_tick: s.lastTickAt,
    uptime_s: Math.round((Date.now() - new Date(s.startedAt).getTime()) / 1000),
    address_space: `BH.REVOLVER.CHAMBER.000..${String(s.chamberCount - 1).padStart(3, "0")}`,
    addressable_backend_nodes: "100,000,000,000 (via Brown-Hilbert pool)",
    live_worker_slots: s.chamberCount,
    model_rotation: FREE_MODELS.join(", "),
  };
}

// === CLI ===
if (args.includes("--help") || args.includes("-h")) {
  console.log(`
fabric-revolver.mjs — Revolver Architecture for BEHCS-1024

Fixed chambers rotate: EMPTY → LOAD → RUN → COLLECT → EJECT → EMPTY
Billions of backend addresses = tuple space. Only N live TUI workers in chambers.

Usage:
  --watch             Continuous revolver cycle
  --chambers N        Number of revolver chambers (default 6)
  --interval-s N      Seconds between cycles (default 30)
  --status            Show current revolver state
  --init N            Initialize N chambers
  --once              Run one cycle then exit

Example:
  node tools/behcs/fabric-revolver.mjs --init 8 --watch --interval-s 30
  node tools/behcs/fabric-revolver.mjs --status

Architecture:
  Billions of PIDs   →   Omnispindle routes   →   Revolver chambers (N live)
  →   OpenCode free-agent workers   →   Omniflywheel collects   →   Fabric loop
  →   Gulp/GC erases   →   Billions rotate through

The revolver IS the live worker pool. The addresses are the backend nodes.
`);
  process.exit(0);
}

if (args.includes("--init")) {
  const n = parseInt(args[args.indexOf("--init") + 1], 10) || 6;
  initChambers(n);
  console.log(`Revolver initialized with ${n} chambers.`);
  process.exit(0);
}

if (args.includes("--status")) {
  const s = loadState();
  console.log(JSON.stringify(report(s), null, 2));
  process.exit(0);
}

// Default: one tick then exit
if (args.includes("--once") || (!args.includes("--watch") && !args.includes("--init") && !args.includes("--status"))) {
  const s = loadState();
  if (s.chambers.length === 0) initChambers(s.chamberCount);
  const r = await revolverTick();
  console.log(JSON.stringify(report(r), null, 2));
  process.exit(0);
}

if (args.includes("--watch")) {
  const n = args.includes("--chambers") ? parseInt(args[args.indexOf("--chambers") + 1], 10) : null;
  const intervalS = args.includes("--interval-s") ? parseInt(args[args.indexOf("--interval-s") + 1], 10) : 30;
  if (n) initChambers(n);
  const s = loadState();
  if (s.chambers.length === 0) initChambers(s.chamberCount);

  console.log(`Revolver watch: ${s.chamberCount} chambers, ${intervalS}s interval. Ctrl+C to stop.`);
  appendLog({ ts: now(), kind: "boot", chambers: s.chamberCount, interval_s: intervalS });

  const tick = async () => {
    try {
      const r = await revolverTick();
      const rep = report(r);
      const active = rep.active;
      const ready = rep.ready_for_collection;
      process.stdout.write(`[${now()}] rot=${rep.rotation} chambers=${rep.states.EMPTY||0}E/${rep.states.LOADING||0}L/${rep.states.RUNNING||0}R/${rep.states.COMPLETE||0}C errors=${rep.total_errors} loaded=${rep.total_loads} collected=${rep.total_completes}\n`);
      appendLog({ ts: now(), kind: "tick", ...rep });
    } catch (e) { process.stderr.write(`[${now()}] tick error: ${e.message}\n`); }
  };

  await tick();
  setInterval(tick, intervalS * 1000);
}
