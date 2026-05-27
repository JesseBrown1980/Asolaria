#!/usr/bin/env node
// fabric-real-free-agent-driver.mjs — REAL free agents in the fabric running the fabric.
//
// Per operator 2026-04-29: "continue with real free agents in the fabric running the fabric"
// + LAW-014 minimum-tokens-maximum-agents + free-fanout architecture.
//
// Spawns headless `opencode run` instances against the 5 free models with
// BEHCS-256-glyph-compressed prompts (≤80 tokens). Response captured →
// signed envelope to bus → auto-promoter picks up as fabric evidence.
//
// CLI:
//   node fabric-real-free-agent-driver.mjs --once     run one task on one model
//   node fabric-real-free-agent-driver.mjs --fanout   run one task on all 5 models in parallel
//   node fabric-real-free-agent-driver.mjs --watch    continuous fanout cycle every 600s
//
// named_agent: liris-fabric-real-free-agent-driver

import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import { buildSignedEnvelope, LIRIS_KEY_ID } from "./bus-sign.mjs";

const ACER_BUS = "http://192.168.100.1:4947/behcs/send";
const LOG_PATH = "C:/Users/rayss/Asolaria/logs/fabric-real-free-agent-driver.log.ndjson";

const FREE_MODELS = [
  "opencode/big-pickle",
  "opencode/hy3-preview-free",
  "opencode/ling-2.6-flash-free",
  "opencode/minimax-m2.5-free",
  "opencode/nemotron-3-super-free",
];

// BEHCS-256-glyph-compressed fabric improvement tasks. Each prompt ≤80 tokens.
// Glyph-dispatch per LAW-014: short verb + minimal context. Free agents
// generate concrete improvement suggestions; the fabric auto-promoter
// integrates accepted ones via cosign chain.
const FABRIC_TASKS = [
  { id: "T-corpus-mine", prompt: "Asolaria fabric. Pick 3 keywords likely missing from supervisor council-vote corpus that would help score EVT-PEER-HANDSHAKE class. Reply: keyword1, keyword2, keyword3." },
  { id: "T-supervisor-exercise", prompt: "Asolaria fabric. 3 ASSUMED supervisors: GAIA.ENDPOINT, FALCON.IDENTITY, AETHER.NONCE. For one (your pick), suggest a single concrete read-only check that would exercise its authority. Reply: SUPERVISOR | check_command." },
  { id: "T-bus-pressure", prompt: "Asolaria bus saturates after ~80 envelopes/16min. Suggest one write-batch optimization that reduces fsync count without losing durability. ≤30 words." },
  { id: "T-d11-promotion", prompt: "D11 levels: ASSUMED < OBSERVED < PROVEN. Propose one concrete signal that would justify ASSUMED→OBSERVED promotion for a federation supervisor with no cosign receipts yet. ≤25 words." },
  { id: "T-cosign-aggregation", prompt: "Cosign chain grows ~1 entry per fabric tick (60-180s). Suggest one aggregation-window strategy that reduces chain entries while preserving auditability. ≤30 words." },
];

function appendLog(row) {
  try {
    fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
    fs.appendFileSync(LOG_PATH, JSON.stringify(row) + "\n");
  } catch (e) { process.stderr.write(`[log] ${e.message}\n`); }
}

function runOpencode(model, prompt, timeoutMs = 90000) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    // Windows: opencode is a .cmd shim, requires shell:true for spawn. Per
    // feedback_msys_pid_namespace_mismatch.md + node spawn ENOENT pattern.
    const p = spawn("opencode", ["run", "--model", model, "--format", "json", JSON.stringify(prompt)], { stdio: ["ignore", "pipe", "pipe"], shell: true });
    let stdout = "", stderr = "";
    const timer = setTimeout(() => { p.kill("SIGTERM"); }, timeoutMs);
    p.stdout.on("data", c => stdout += c);
    p.stderr.on("data", c => stderr += c);
    p.on("close", (code) => {
      clearTimeout(timer);
      const elapsedMs = Date.now() - startedAt;
      resolve({ ok: code === 0, code, elapsed_ms: elapsedMs, stdout: stdout.slice(-3000), stderr: stderr.slice(-500) });
    });
    p.on("error", (e) => { clearTimeout(timer); resolve({ ok: false, error: e.message }); });
  });
}

function extractAgentReply(stdout) {
  // opencode run --format json emits NDJSON events. Extract the assistant's text reply.
  const lines = stdout.split("\n").filter(l => l.trim().startsWith("{"));
  let reply = "";
  for (const l of lines) {
    try {
      const j = JSON.parse(l);
      if (j.type === "message" && j.role === "assistant" && typeof j.text === "string") reply += j.text;
      else if (j.type === "text" && typeof j.text === "string") reply += j.text;
      else if (j.type === "content" && typeof j.text === "string") reply += j.text;
    } catch (_) { /* skip non-JSON */ }
  }
  // Fallback: if no structured event found, capture first non-empty line of stdout.
  if (!reply) {
    const lines = stdout.split("\n").map(l => l.trim()).filter(Boolean);
    reply = lines.slice(-3).join(" ").slice(0, 500);
  }
  return reply.trim().slice(0, 800);
}

async function dispatchAgentResponseEnvelope(model, task, result, reply) {
  const ts = new Date().toISOString();
  const envId = crypto.createHash("sha256").update(`real-free-agent-${model}-${task.id}-${ts}`).digest("hex").slice(0, 32);
  const env = {
    id: envId, ts, from: "liris", to: "acer", mode: "real",
    type: "REAL_FREE_AGENT_FABRIC_RESPONSE",
    verb: "EVT-REAL-FREE-AGENT-FABRIC-RESPONSE",
    payload: {
      model,
      task_id: task.id,
      task_prompt: task.prompt,
      response: reply,
      elapsed_ms: result.elapsed_ms,
      d11: "ASSUMED-pending-fabric-eval",
      driver: "liris-fabric-real-free-agent-driver",
      law_014_compliant: true,
    },
    sig_owner: LIRIS_KEY_ID,
  };
  const manifest = { id: envId, ts, from: env.from, to: env.to, type: env.type, verb: env.verb, model, task_id: task.id };
  const { signed_envelope } = buildSignedEnvelope(manifest, LIRIS_KEY_ID);
  const body = JSON.stringify({ ...env, body: { signed_envelope } });
  const url = new URL(ACER_BUS);
  return new Promise((resolve) => {
    const req = http.request({ host: url.hostname, port: url.port, path: url.pathname, method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) }, timeout: 15000 },
      (res) => { let b=""; res.on("data",c=>b+=c); res.on("end",()=>{let p;try{p=JSON.parse(b);}catch{p=b;} resolve({ envelope_id: envId, status: res.statusCode, body: p });}); });
    req.on("error", e => resolve({ envelope_id: envId, error: e.message }));
    req.on("timeout", () => { req.destroy(); resolve({ envelope_id: envId, error: "timeout" }); });
    req.write(body); req.end();
  });
}

async function runOne(model, task) {
  console.log(`[free-agent] model=${model} task=${task.id}`);
  appendLog({ ts: new Date().toISOString(), event: "agent_start", model, task_id: task.id });
  const result = await runOpencode(model, task.prompt, 90000);
  if (!result.ok) {
    appendLog({ ts: new Date().toISOString(), event: "agent_fail", model, task_id: task.id, error: result.error ?? `exit ${result.code}` });
    console.log(`  fail: ${result.error ?? `exit ${result.code}`}`);
    return { ok: false, model, task_id: task.id };
  }
  const reply = extractAgentReply(result.stdout);
  if (!reply) {
    appendLog({ ts: new Date().toISOString(), event: "agent_empty", model, task_id: task.id, elapsed_ms: result.elapsed_ms });
    console.log(`  empty reply (${result.elapsed_ms}ms)`);
    return { ok: false, model, task_id: task.id, reason: "empty-reply" };
  }
  console.log(`  reply (${result.elapsed_ms}ms): ${reply.slice(0, 120)}${reply.length > 120 ? "…" : ""}`);
  const env = await dispatchAgentResponseEnvelope(model, task, result, reply);
  appendLog({ ts: new Date().toISOString(), event: "agent_dispatched", model, task_id: task.id, envelope_id: env.envelope_id, status: env.status, sig_verdict: env.body?.sig_verdict, reply_chars: reply.length });
  return { ok: true, envelope_id: env.envelope_id, status: env.status, model, task_id: task.id };
}

async function fanoutOne(task) {
  return Promise.all(FREE_MODELS.map((model) => runOne(model, task)));
}

const args = process.argv.slice(2);
const mode = args.includes("--watch") ? "watch" : args.includes("--fanout") ? "fanout" : "once";

if (mode === "once") {
  const task = FABRIC_TASKS[0];
  const model = FREE_MODELS[0];
  const r = await runOne(model, task);
  console.log(`[done] ${JSON.stringify(r)}`);
} else if (mode === "fanout") {
  const taskIdx = (() => { const i = args.indexOf("--task"); return i >= 0 ? parseInt(args[i + 1], 10) : 0; })();
  const task = FABRIC_TASKS[taskIdx % FABRIC_TASKS.length];
  console.log(`[fanout] task=${task.id} models=${FREE_MODELS.length}`);
  const results = await fanoutOne(task);
  const ok = results.filter(r => r.ok).length;
  console.log(`[fanout-done] ${ok}/${FREE_MODELS.length} succeeded`);
} else {
  console.log("[free-agent-driver] watch mode every 600s");
  let cycle = 0;
  const tick = async () => {
    const task = FABRIC_TASKS[cycle % FABRIC_TASKS.length];
    cycle++;
    console.log(`\n[watch-cycle ${cycle}] task=${task.id}`);
    await fanoutOne(task);
  };
  await tick();
  setInterval(() => tick().catch(e => appendLog({ event: "watch-error", error: e.message })), 600 * 1000);
}
