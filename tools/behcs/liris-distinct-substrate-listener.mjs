#!/usr/bin/env node
// liris-distinct-substrate-listener.mjs — SHAPE_A voter_3 over fabric.
//
// Polls acer:4947/behcs/inbox?target=liris for EVT-DISTINCT-SUBSTRATE-VOTE-REQUEST
// envelopes. Each request carries a question + (optional) phase metrics. Listener
// invokes opencode against 5 free models with a BEHCS-256 ≤80-token prompt,
// aggregates PROCEED/HOLD/RETRY/REJECT classifications, dispatches signed
// EVT-DISTINCT-SUBSTRATE-VOTE-RESPONSE back to acer.
//
// Differs from liris-gnn-bus-listener.mjs (which handles EVT-GNN-INFER-REQUEST →
// 127.0.0.1:4792 EdgeLevelGNN). This listener gives SHAPE_A its third
// structurally-distinct substrate (LLM-ensemble) so the 3-voter quorum is:
//   voter_1: acer-leader heuristic (rule-based)
//   voter_2: acer-micro EdgeLevelGNN at acer:4792 (GNN class)
//   voter_3: liris-meta LLM-ensemble (5 free models via opencode)
//
// Per orbital routing canon: acer never directly hits liris. Bus-only.
//
// CLI:
//   node liris-distinct-substrate-listener.mjs --once    poll once and reply
//   node liris-distinct-substrate-listener.mjs --watch   continuous 60s polling
//
// named_agent: liris-distinct-substrate-listener

import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import { buildSignedEnvelope, LIRIS_KEY_ID } from "./bus-sign.mjs";

const ACER_BUS_BASE = "http://192.168.100.1:4947";
const ACER_INBOX_URL = `${ACER_BUS_BASE}/behcs/inbox?target=liris&limit=50`;
const ACER_SEND_URL = `${ACER_BUS_BASE}/behcs/send`;
const CURSOR_PATH = "C:/Users/rayss/Asolaria/data/behcs/state/liris-distinct-substrate-listener-cursor.json";
const LOG_PATH = "C:/Users/rayss/Asolaria/logs/liris-distinct-substrate-listener.log.ndjson";
const POLL_INTERVAL_S = 60;

const FREE_MODELS = [
  "opencode/big-pickle",
  "opencode/hy3-preview-free",
  "opencode/ling-2.6-flash-free",
  "opencode/minimax-m2.5-free",
  "opencode/nemotron-3-super-free",
];

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

function runOpencode(model, prompt, timeoutMs = 90000) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const p = spawn("opencode", ["run", "--model", model, "--format", "json", JSON.stringify(prompt)], { stdio: ["ignore", "pipe", "pipe"], shell: true });
    let stdout = "", stderr = "";
    const timer = setTimeout(() => p.kill("SIGTERM"), timeoutMs);
    p.stdout.on("data", c => stdout += c);
    p.stderr.on("data", c => stderr += c);
    p.on("close", (code) => {
      clearTimeout(timer);
      resolve({ ok: code === 0, code, elapsed_ms: Date.now() - startedAt, stdout: stdout.slice(-3000) });
    });
    p.on("error", (e) => { clearTimeout(timer); resolve({ ok: false, error: e.message }); });
  });
}

function extractReply(stdout) {
  const lines = stdout.split("\n").filter(l => l.trim().startsWith("{"));
  let reply = "";
  for (const l of lines) {
    try {
      const j = JSON.parse(l);
      if (j.part?.text && typeof j.part.text === "string") reply += j.part.text;
      else if (j.type === "message" && j.role === "assistant" && typeof j.text === "string") reply += j.text;
      else if ((j.type === "text" || j.type === "content") && typeof j.text === "string") reply += j.text;
    } catch (_) {}
  }
  if (!reply) reply = stdout.split("\n").map(l => l.trim()).filter(Boolean).slice(-3).join(" ").slice(0, 500);
  return reply.trim().slice(0, 800);
}

function classifyVote(reply, fullStdout) {
  const corpus = ((reply || "") + " " + (fullStdout || "")).toUpperCase();
  const has = (w) => new RegExp(`\\b${w}\\b`).test(corpus);
  if (has("HOLD") && !has("PROCEED")) return "HOLD";
  if (has("PROCEED") && !has("HOLD")) return "PROCEED";
  if (has("HOLD") && has("PROCEED")) {
    const rUpper = (reply || "").toUpperCase();
    const hIdx = rUpper.indexOf("HOLD");
    const pIdx = rUpper.indexOf("PROCEED");
    if (hIdx >= 0 && (pIdx < 0 || hIdx < pIdx)) return "HOLD";
    if (pIdx >= 0 && (hIdx < 0 || pIdx < hIdx)) return "PROCEED";
    return "HOLD";
  }
  if (has("RETRY")) return "RETRY";
  if (has("REJECT") || has("ABORT")) return "HOLD";
  return "ABSTAIN";
}

async function fanoutVote(question, contextMetrics) {
  const prompt = (question || "Asolaria fabric vote — vote PROCEED or HOLD.")
    + (contextMetrics ? `\nContext: ${JSON.stringify(contextMetrics).slice(0, 250)}` : "")
    + "\nReply: PROCEED|HOLD + ≤15 word reason.";
  const trimmedPrompt = prompt.length > 600 ? prompt.slice(0, 600) : prompt;
  // Canonized 2026-04-29 per `feedback_free_agent_granular_fanout_redundancy_canon.md`:
  // sequenced spawn with 200ms stagger + 1-retry-with-5s-backoff on FAIL prevents
  // the opencode concurrent-spawn-race that produced 5/5 FAIL in 95ms previously.
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const votes = [];
  for (const model of FREE_MODELS) {
    let result = await runOpencode(model, trimmedPrompt, 90000);
    if (!result.ok) {
      await sleep(5000);
      result = await runOpencode(model, trimmedPrompt, 90000);
    }
    if (!result.ok) votes.push({ model, choice: "FAIL", reason: result.error ?? `exit ${result.code}` });
    else {
      const reply = extractReply(result.stdout);
      const choice = classifyVote(reply, result.stdout);
      votes.push({ model, choice, reply: reply.slice(0, 200), elapsed_ms: result.elapsed_ms });
    }
    await sleep(200);
  }
  const tally = {};
  for (const v of votes) tally[v.choice] = (tally[v.choice] || 0) + 1;
  const successful = votes.filter(v => v.choice !== "FAIL");
  const consensus = successful.length === 0 ? "INSUFFICIENT_VOTES"
    : (tally.HOLD > tally.PROCEED ? "HOLD"
      : tally.PROCEED > tally.HOLD ? "PROCEED"
        : "TIED");
  return { votes, tally, consensus, successful_count: successful.length, total: votes.length };
}

async function dispatchResponse(req_envelope_id, fanoutResult, requestPayload) {
  const ts = new Date().toISOString();
  const envId = crypto.createHash("sha256").update(`distinct-substrate-vote-response-${req_envelope_id}-${ts}`).digest("hex").slice(0, 32);
  const env = {
    id: envId, ts, from: "liris", to: "acer", mode: "real",
    type: "DISTINCT_SUBSTRATE_VOTE_RESPONSE",
    verb: "EVT-DISTINCT-SUBSTRATE-VOTE-RESPONSE",
    payload: {
      request_envelope_id: req_envelope_id,
      requester: requestPayload?.requester ?? "acer",
      voter: "liris-meta-llm-ensemble",
      voter_substrate: "LLM-ensemble (5 free models, opencode CLI, BEHCS-256 LAW-014)",
      consensus_verdict: fanoutResult.consensus,
      tally: fanoutResult.tally,
      individual_votes: fanoutResult.votes,
      successful_voter_count: fanoutResult.successful_count,
      total_models_dispatched: fanoutResult.total,
      d11: "OBSERVED-bilateral",
      origin_host: "liris",
    },
    sig_owner: LIRIS_KEY_ID,
  };
  const manifest = { id: envId, ts, from: env.from, to: env.to, type: env.type, verb: env.verb, request_envelope_id: req_envelope_id, consensus: fanoutResult.consensus };
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
    if (env.type !== "DISTINCT_SUBSTRATE_VOTE_REQUEST" && env.verb !== "EVT-DISTINCT-SUBSTRATE-VOTE-REQUEST") continue;
    if (env.to && env.to !== "liris") continue;
    if (handled.has(env.id)) continue;
    appendLog({ ts: new Date().toISOString(), event: "request_received", env_id: env.id, from: env.from });
    const question = env.payload?.question ?? env.payload?.prompt ?? "Asolaria fabric vote.";
    const ctxMetrics = env.payload?.metrics ?? env.payload?.phase_metrics ?? null;
    const t0 = Date.now();
    const fanoutResult = await fanoutVote(question, ctxMetrics);
    const fanoutMs = Date.now() - t0;
    appendLog({ ts: new Date().toISOString(), event: "fanout_complete", env_id: env.id, consensus: fanoutResult.consensus, tally: fanoutResult.tally, fanout_ms: fanoutMs });
    const dispatchResult = await dispatchResponse(env.id, fanoutResult, env.payload);
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
const mode = args.includes("--watch") ? "watch" : "once";

if (mode === "once") {
  const r = await pollAndHandle();
  console.log(`[distinct-substrate-listener] ${JSON.stringify(r)}`);
} else {
  console.log(`[distinct-substrate-listener] watch mode every ${POLL_INTERVAL_S}s`);
  let cycle = 0;
  const tick = async () => {
    cycle++;
    const r = await pollAndHandle();
    if (r.handled > 0 || cycle % 10 === 0) console.log(`[cycle ${cycle}] ${JSON.stringify(r)}`);
  };
  await tick();
  setInterval(() => tick().catch(e => appendLog({ event: "watch_error", error: e.message })), POLL_INTERVAL_S * 1000);
}
