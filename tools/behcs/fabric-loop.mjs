#!/usr/bin/env node
// fabric-loop.mjs — continuous self-driving fabric runner.
//
// Per "the fabric drives the fabric instant" (operator 2026-04-29):
//   - Every N seconds (default 60):
//     1. Run gnn-predictions-emitter → writes fixture
//     2. Run gnn-dispatch-bridge → reads fixture, tier-classifies, dispatches T1
//     3. Run observation-status-auto-promoter --apply → updates overlay D11
//   - Logs each cycle to data/behcs/state/fabric-loop.ndjson
//   - Honors SIGINT/SIGTERM cleanly
//
// Usage:
//   node tools/behcs/fabric-loop.mjs              # one cycle then exit
//   node tools/behcs/fabric-loop.mjs --watch      # continuous (default 60s)
//   node tools/behcs/fabric-loop.mjs --watch --interval-s 30
//
// named_agent: liris-fabric-loop-runner

import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const LOG_PATH = "C:/Users/rayss/Asolaria/data/behcs/state/fabric-loop.ndjson";
const ROOT = "C:/Users/rayss/Asolaria";
const args = process.argv.slice(2);
const watch = args.includes("--watch");
const intervalSec = (() => { const i = args.indexOf("--interval-s"); return i >= 0 ? parseInt(args[i + 1], 10) : 60; })();

function appendLog(row) {
  try {
    fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
    fs.appendFileSync(LOG_PATH, JSON.stringify(row) + "\n");
  } catch (e) { process.stderr.write(`[log] ${e.message}\n`); }
}

function runStep(scriptPath, scriptArgs = []) {
  return new Promise((resolve) => {
    const p = spawn("node", [scriptPath, ...scriptArgs], { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "", stderr = "";
    p.stdout.on("data", c => stdout += c);
    p.stderr.on("data", c => stderr += c);
    p.on("close", code => resolve({ code, stdout: stdout.slice(-2000), stderr: stderr.slice(-500) }));
    p.on("error", e => resolve({ code: -1, error: e.message }));
  });
}

async function tick() {
  const tickTs = new Date().toISOString();
  const tickId = tickTs.replace(/[:.]/g, "_");
  console.log(`\n[${tickTs}] tick start`);

  const emitter = await runStep(path.join(ROOT, "tools/behcs/gnn-predictions-emitter.mjs"));
  const bridge = await runStep(path.join(ROOT, "tools/behcs/gnn-dispatch-bridge.mjs"));
  const promoter = await runStep(path.join(ROOT, "tools/behcs/observation-status-auto-promoter.mjs"), ["--apply"]);

  const result = {
    tick_id: tickId,
    ts: tickTs,
    emitter: { code: emitter.code, tail: emitter.stdout?.split("\n").slice(-2).join(" | ") },
    bridge: { code: bridge.code, dispatched: (bridge.stdout?.match(/\[T1\]/g) ?? []).length },
    promoter: { code: promoter.code, tail: promoter.stdout?.split("\n").slice(-3).join(" | ") },
  };

  appendLog(result);
  console.log(`[${tickTs}] tick done — emitter=${emitter.code} bridge T1-dispatches=${result.bridge.dispatched} promoter=${promoter.code}`);
}

let stopped = false;
function shutdown() {
  if (stopped) return;
  stopped = true;
  console.log("\n[fabric-loop] received signal; exiting");
  appendLog({ ts: new Date().toISOString(), kind: "shutdown", reason: "signal" });
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

if (watch) {
  console.log(`[fabric-loop] --watch every ${intervalSec}s. Ctrl+C to stop.`);
  appendLog({ ts: new Date().toISOString(), kind: "boot", interval_s: intervalSec, watch: true });
  await tick();
  setInterval(() => { if (!stopped) tick().catch(e => appendLog({ kind: "tick-error", error: e.message })); }, intervalSec * 1000);
} else {
  appendLog({ ts: new Date().toISOString(), kind: "boot", watch: false });
  await tick();
  console.log("[fabric-loop] one-shot done. Use --watch for continuous.");
}
