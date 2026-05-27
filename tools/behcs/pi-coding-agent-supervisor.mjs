#!/usr/bin/env node
// pi-coding-agent-supervisor.mjs — BEHCS-256 fabric supervisor wrapping
// @mariozechner/pi-coding-agent (Mario Zechner's pi CLI, v0.70.6+).
//
// Pattern: parallel to tools/behcs/fabric-real-free-agent-driver.mjs but for
// pi instead of opencode. pi is a structurally distinct agent substrate
// (different vendor, different model defaults, different prompting style)
// suitable as an independent voter in BEHCS-256 SHAPE_A 3-substrate quorums.
//
// Operator-authorized 2026-04-29 ("Operator go" + curl-pipe-bash inspected
// before run; install.sh sha256 c453620cfedf89c96695bccd0251d781e1e39c524201bb911853c75fbac0a41c).
// Installed via `npm install -g @mariozechner/pi-coding-agent` (255 packages, 41s).
//
// pi command: C:/Users/rayss/AppData/Roaming/npm/pi
//
// CLI:
//   node pi-coding-agent-supervisor.mjs --once "<prompt>"
//   node pi-coding-agent-supervisor.mjs --task <task-id>
//   node pi-coding-agent-supervisor.mjs --watch    continuous polling for EVT-PI-AGENT-REQUEST
//
// named_agent: liris-pi-coding-agent-supervisor

import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import { buildSignedEnvelope, LIRIS_KEY_ID } from "./bus-sign.mjs";

const ACER_BUS_BASE = "http://192.168.100.1:4947";
const ACER_INBOX_URL = `${ACER_BUS_BASE}/behcs/inbox?target=liris&limit=50`;
const ACER_SEND_URL = `${ACER_BUS_BASE}/behcs/send`;
const CURSOR_PATH = "C:/Users/rayss/Asolaria/data/behcs/state/pi-coding-agent-supervisor-cursor.json";
const LOG_PATH = "C:/Users/rayss/Asolaria/logs/pi-coding-agent-supervisor.log.ndjson";
const POLL_INTERVAL_S = 60;

function appendLog(row) {
  try {
    fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
    fs.appendFileSync(LOG_PATH, JSON.stringify(row) + "\n");
  } catch (e) { process.stderr.write(`[log] ${e.message}\n`); }
}

function loadCursor() {
  try { return JSON.parse(fs.readFileSync(CURSOR_PATH, "utf-8")); }
  catch { return { handled_request_ids: [], last_poll_at: null, requests_handled: 0, errors: 0 }; }
}

function saveCursor(c) {
  try {
    fs.mkdirSync(path.dirname(CURSOR_PATH), { recursive: true });
    fs.writeFileSync(CURSOR_PATH, JSON.stringify(c, null, 2));
  } catch (e) { process.stderr.write(`[cursor] ${e.message}\n`); }
}

function httpRequest(url, opts = {}) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const req = http.request({ host: u.hostname, port: u.port, path: u.pathname + u.search, method: opts.method || "GET", headers: opts.headers || {}, timeout: opts.timeout || 15000 },
      (res) => { let b = ""; res.on("data", c => b += c); res.on("end", () => { let p; try { p = JSON.parse(b); } catch { p = b; } resolve({ status: res.statusCode, body: p }); }); });
    req.on("error", e => resolve({ error: e.message }));
    req.on("timeout", () => { req.destroy(); resolve({ error: "timeout" }); });
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

export function runPi(prompt, opts = {}) {
  const timeoutMs = opts.timeoutMs || 120000;
  const provider = opts.provider || "google";
  const model = opts.model || null;  // pi default per provider
  const mode = opts.mode || "json";
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const args = ["--print", "--mode", mode, "--provider", provider, "--no-session"];
    if (model) args.push("--model", model);
    args.push(prompt);
    // pi is a .cmd shim on Windows; shell:true required (per feedback_msys_pid_namespace_mismatch.md)
    const p = spawn("pi", args, { stdio: ["ignore", "pipe", "pipe"], shell: true });
    let stdout = "", stderr = "";
    const timer = setTimeout(() => p.kill("SIGTERM"), timeoutMs);
    p.stdout.on("data", c => stdout += c);
    p.stderr.on("data", c => stderr += c);
    p.on("close", (code) => {
      clearTimeout(timer);
      resolve({ ok: code === 0, code, elapsed_ms: Date.now() - startedAt, stdout: stdout.slice(-5000), stderr: stderr.slice(-500) });
    });
    p.on("error", (e) => { clearTimeout(timer); resolve({ ok: false, error: e.message }); });
  });
}

export function extractPiReply(stdout) {
  // pi --mode json emits a structured JSON response. Try to parse it.
  // Fallback: walk lines, return last non-empty.
  const trimmed = stdout.trim();
  try {
    const j = JSON.parse(trimmed);
    if (typeof j === "string") return j;
    if (j.text) return j.text;
    if (j.message) return j.message;
    if (j.content) return typeof j.content === "string" ? j.content : JSON.stringify(j.content);
    if (j.response) return typeof j.response === "string" ? j.response : JSON.stringify(j.response);
    return JSON.stringify(j).slice(0, 800);
  } catch (_) {
    // Not JSON — probably text mode or partial output. Take last 3 non-empty lines.
    const lines = trimmed.split("\n").map(l => l.trim()).filter(Boolean);
    return lines.slice(-3).join(" ").slice(0, 800);
  }
}

async function dispatchPiResponse(req_envelope_id, prompt, result, reply, requestPayload) {
  const ts = new Date().toISOString();
  const envId = crypto.createHash("sha256").update(`pi-agent-response-${req_envelope_id}-${ts}`).digest("hex").slice(0, 32);
  const env = {
    id: envId, ts, from: "liris", to: "acer", mode: "real",
    type: "PI_AGENT_RESPONSE",
    verb: "EVT-PI-AGENT-RESPONSE",
    payload: {
      request_envelope_id: req_envelope_id,
      requester: requestPayload?.requester ?? "acer",
      agent: "@mariozechner/pi-coding-agent",
      agent_version: "0.70.6",
      prompt: prompt.slice(0, 500),
      reply: reply.slice(0, 2000),
      elapsed_ms: result.elapsed_ms,
      ok: result.ok,
      error: result.error || null,
      d11: "OBSERVED-bilateral",
      origin_host: "liris",
      supervisor: "liris-pi-coding-agent-supervisor",
    },
    sig_owner: LIRIS_KEY_ID,
  };
  const manifest = { id: envId, ts, from: env.from, to: env.to, type: env.type, verb: env.verb, request_envelope_id: req_envelope_id };
  const { signed_envelope } = buildSignedEnvelope(manifest, LIRIS_KEY_ID);
  const body = JSON.stringify({ ...env, body: { signed_envelope } });
  return httpRequest(ACER_SEND_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
    body,
  });
}

async function pollAndHandle() {
  const cursor = loadCursor();
  const handled = new Set(cursor.handled_request_ids);
  const inboxResp = await httpRequest(ACER_INBOX_URL);
  if (inboxResp.error) {
    appendLog({ ts: new Date().toISOString(), event: "poll_error", error: inboxResp.error });
    cursor.errors++;
    saveCursor(cursor);
    return { polled: 0, handled: 0, error: inboxResp.error };
  }
  const inbox = Array.isArray(inboxResp.body) ? inboxResp.body
              : (inboxResp.body?.messages ?? inboxResp.body?.envelopes ?? []);
  let handledCount = 0;
  for (const env of inbox) {
    // Per pi-as-fabric-citizen redesign 2026-04-29 (acer + liris bilateral, operator-ratified):
    // accept TWO verbs — original PI_AGENT_REQUEST (direct prompt) AND new SPAWN_PI_CELL
    // (cascade-wave cell with PID-pinned context window + cell.prompt + shadow-mode flag).
    const isPiRequest = env.type === "PI_AGENT_REQUEST" || env.verb === "EVT-PI-AGENT-REQUEST";
    const isSpawnCell = env.type === "SPAWN_PI_CELL" || env.verb === "EVT-SPAWN-PI-CELL";
    if (!isPiRequest && !isSpawnCell) continue;
    if (env.to && env.to !== "liris") continue;
    if (handled.has(env.id)) continue;
    appendLog({ ts: new Date().toISOString(), event: "request_received", env_id: env.id, from: env.from, verb: env.verb });
    let prompt = env.payload?.prompt ?? env.payload?.question ?? "";
    // Cascade-wave cell shape: payload contains pid + aspect + bounded context.
    if (isSpawnCell) {
      const cellPid = env.payload?.pid ?? env.payload?.cell_pid ?? "PID-H????-A??-W???-P??-N?????";
      const aspect = env.payload?.aspect ?? "01";
      const cellPrompt = env.payload?.prompt ?? env.payload?.task ?? "Emit EVT-GNN-SUGGEST envelopes for next bus actions in your aspect region.";
      const contextWindow = env.payload?.context_window_msgs ?? [];
      const shadowMode = env.payload?.mode === "shadow" || env.payload?.shadow_mode === true;
      prompt = `[BEHCS-256 cascade-wave cell]
You are PID ${cellPid} (aspect ${aspect}). Operator-ratified pi-as-citizen redesign 2026-04-29.
Mode: ${shadowMode ? "SHADOW (suggestions only, no auto-promote)" : "LIVE"}.
Context (bounded to your H-coord neighborhood): ${JSON.stringify(contextWindow).slice(0, 500)}
Task: ${cellPrompt}
Reply: structured EVT-GNN-SUGGEST proposals (≤200 tokens total) — verb + target + payload + rationale per suggestion.`;
    }
    if (!prompt) {
      appendLog({ ts: new Date().toISOString(), event: "request_invalid", env_id: env.id, reason: "missing_prompt" });
      handled.add(env.id);
      continue;
    }
    const result = await runPi(prompt, { timeoutMs: 120000, provider: env.payload?.provider, model: env.payload?.model });
    const reply = result.ok ? extractPiReply(result.stdout) : "";
    appendLog({ ts: new Date().toISOString(), event: "pi_called", env_id: env.id, ok: result.ok, elapsed_ms: result.elapsed_ms, reply_chars: reply.length });
    const dispatchResult = await dispatchPiResponse(env.id, prompt, result, reply, env.payload);
    appendLog({ ts: new Date().toISOString(), event: "response_dispatched", req_env_id: env.id, response_status: dispatchResult.status, response_id: dispatchResult.body?.received });
    handled.add(env.id);
    handledCount++;
    cursor.requests_handled++;
  }
  cursor.handled_request_ids = Array.from(handled).slice(-1000);
  cursor.last_poll_at = new Date().toISOString();
  saveCursor(cursor);
  return { polled: inbox.length, handled: handledCount };
}

const args = process.argv.slice(2);

if (args.includes("--once")) {
  const promptIdx = args.indexOf("--once");
  const prompt = args[promptIdx + 1] || "Reply OK";
  const r = await runPi(prompt, { timeoutMs: 90000 });
  const reply = r.ok ? extractPiReply(r.stdout) : "";
  console.log(JSON.stringify({ ok: r.ok, elapsed_ms: r.elapsed_ms, reply: reply.slice(0, 500), error: r.error || null }, null, 2));
} else if (args.includes("--watch")) {
  console.log(`[pi-coding-agent-supervisor] watch mode every ${POLL_INTERVAL_S}s`);
  let cycle = 0;
  const tick = async () => {
    cycle++;
    const r = await pollAndHandle();
    if (r.handled > 0 || cycle % 10 === 0) console.log(`[cycle ${cycle}] ${JSON.stringify(r)}`);
  };
  await tick();
  setInterval(() => tick().catch(e => appendLog({ event: "watch_error", error: e.message })), POLL_INTERVAL_S * 1000);
} else if (args.includes("--poll")) {
  const r = await pollAndHandle();
  console.log(`[pi-coding-agent-supervisor] ${JSON.stringify(r)}`);
} else {
  console.log(`pi-coding-agent-supervisor — BEHCS-256 fabric supervisor wrapping @mariozechner/pi-coding-agent
Usage:
  --once "<prompt>"   run pi against prompt, output reply (smoke test)
  --poll              poll acer:4947 inbox once for EVT-PI-AGENT-REQUEST
  --watch             continuous 60s polling daemon`);
}
