#!/usr/bin/env node
// fabric-completion-server.mjs — THE FABRIC IS THE API.
//
// Operator 2026-04-29: "We do not need API we use it to call ourselves.
// Think about it. The fabric can be the API... Use your imagination."
//
// This server speaks Anthropic-compatible /v1/messages on :4794. When any
// LLM-client (pi, claude-code, codex, custom) sets ANTHROPIC_BASE_URL to point
// here, their requests don't go to api.anthropic.com — they enter the BEHCS-256
// fabric, get routed to a free substrate (opencode CLI), and come back in
// Anthropic format. The fabric is now self-sufficient: pi can ask fabric, and
// fabric calls itself.
//
// Endpoints:
//   POST /v1/messages   Anthropic-compatible — routes to opencode/big-pickle
//   GET  /healthz       liveness
//   GET  /metrics       request counts + latency histogram
//
// CLI:
//   node tools/behcs/fabric-completion-server.mjs --port 4794 --substrate opencode/big-pickle
//
// Usage from pi:
//   $env:ANTHROPIC_BASE_URL = "http://127.0.0.1:4794"
//   $env:ANTHROPIC_API_KEY = "fabric-no-auth"
//   pi --provider anthropic --print "your prompt"
//
// named_agent: liris-fabric-completion-server

import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import crypto from "node:crypto";
import { spawn } from "node:child_process";

const args = process.argv.slice(2);
const PORT = (() => { const i = args.indexOf("--port"); return i >= 0 ? parseInt(args[i + 1], 10) : 4794; })();
const DEFAULT_SUBSTRATE = (() => { const i = args.indexOf("--substrate"); return i >= 0 ? args[i + 1] : "opencode/big-pickle"; })();
const LOG_PATH = "C:/Users/rayss/Asolaria/logs/fabric-completion-server.log.ndjson";
const METRICS = { requests_total: 0, requests_ok: 0, requests_fail: 0, latencies_ms: [] };

function appendLog(row) {
  try {
    fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
    fs.appendFileSync(LOG_PATH, JSON.stringify({ ts: new Date().toISOString(), ...row }) + "\n");
  } catch (e) { process.stderr.write(`[log] ${e.message}\n`); }
}

// Extract assistant text from opencode --format json NDJSON event stream.
function extractOpencodeText(stdout) {
  let text = "";
  for (const line of stdout.split("\n")) {
    const t = line.trim();
    if (!t.startsWith("{")) continue;
    try {
      const j = JSON.parse(t);
      if (j.part?.text && typeof j.part.text === "string") text += j.part.text;
      else if (j.type === "message" && j.role === "assistant" && typeof j.text === "string") text += j.text;
      else if ((j.type === "text" || j.type === "content") && typeof j.text === "string") text += j.text;
    } catch (_) { /* skip */ }
  }
  return text.trim();
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
      resolve({ ok: code === 0, code, elapsed_ms: Date.now() - startedAt, stdout: stdout.slice(-8000), stderr: stderr.slice(-500) });
    });
    p.on("error", (e) => { clearTimeout(timer); resolve({ ok: false, error: e.message }); });
  });
}

// Convert Anthropic-format messages array into a flat prompt string for the
// opencode subprocess. opencode CLI takes one big string.
function flattenMessages(messages, system) {
  const parts = [];
  if (system) parts.push(`[SYSTEM]\n${typeof system === "string" ? system : JSON.stringify(system)}\n`);
  for (const m of messages || []) {
    const role = (m.role || "user").toUpperCase();
    let content = m.content;
    if (Array.isArray(content)) {
      content = content.map(c => typeof c === "string" ? c : (c.text || JSON.stringify(c))).join("\n");
    }
    parts.push(`[${role}]\n${content}\n`);
  }
  parts.push(`[ASSISTANT]\n`);
  return parts.join("\n");
}

function anthropicFormatResponse(text, modelHint, usage = {}) {
  return {
    id: "msg_" + crypto.randomBytes(12).toString("hex"),
    type: "message",
    role: "assistant",
    content: [{ type: "text", text }],
    model: modelHint || DEFAULT_SUBSTRATE,
    stop_reason: "end_turn",
    stop_sequence: null,
    usage: {
      input_tokens: usage.input ?? Math.max(1, Math.floor((usage.input_chars || 0) / 4)),
      output_tokens: usage.output ?? Math.max(1, Math.floor(text.length / 4)),
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
    },
  };
}

function readBody(req) {
  return new Promise((resolve) => {
    let buf = "";
    req.on("data", c => buf += c);
    req.on("end", () => { try { resolve(JSON.parse(buf)); } catch { resolve({ _raw: buf }); } });
    req.on("error", () => resolve({}));
  });
}

async function handleMessages(req, res) {
  const startedAt = Date.now();
  const body = await readBody(req);
  METRICS.requests_total++;
  const requestId = crypto.randomBytes(8).toString("hex");
  const messages = body.messages || [];
  const system = body.system || null;
  const modelHint = body.model || DEFAULT_SUBSTRATE;
  // Pi/Anthropic clients pass model like "claude-3-5-sonnet-latest"; we route
  // all to the configured substrate (default opencode/big-pickle). Future:
  // map model strings to substrate choices via a config table.
  const substrate = (modelHint.startsWith("opencode/") || modelHint.startsWith("openrouter/")) ? modelHint : DEFAULT_SUBSTRATE;
  const prompt = flattenMessages(messages, system);

  appendLog({ event: "request_received", request_id: requestId, model: modelHint, substrate, prompt_chars: prompt.length });

  const result = await runOpencode(substrate, prompt, 120000);
  if (!result.ok) {
    METRICS.requests_fail++;
    appendLog({ event: "substrate_failed", request_id: requestId, substrate, error: result.error || `exit ${result.code}`, stderr: result.stderr });
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ type: "error", error: { type: "fabric_substrate_error", message: result.error || `substrate exit ${result.code}` } }));
    return;
  }
  const text = extractOpencodeText(result.stdout) || result.stdout.split("\n").map(l => l.trim()).filter(Boolean).slice(-3).join(" ").slice(0, 1000);
  if (!text) {
    METRICS.requests_fail++;
    appendLog({ event: "empty_reply", request_id: requestId, elapsed_ms: result.elapsed_ms });
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ type: "error", error: { type: "fabric_empty_reply", message: "substrate returned empty reply" } }));
    return;
  }

  const response = anthropicFormatResponse(text, modelHint, { input_chars: prompt.length });
  METRICS.requests_ok++;
  METRICS.latencies_ms.push(Date.now() - startedAt);
  if (METRICS.latencies_ms.length > 200) METRICS.latencies_ms.shift();
  appendLog({ event: "response_dispatched", request_id: requestId, substrate, elapsed_ms: result.elapsed_ms, reply_chars: text.length });
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(response));
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/healthz") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, port: PORT, substrate: DEFAULT_SUBSTRATE, started_at: STARTED_AT }));
    return;
  }
  if (req.method === "GET" && req.url === "/metrics") {
    const sorted = [...METRICS.latencies_ms].sort((a, b) => a - b);
    const p = (q) => sorted.length ? sorted[Math.floor(sorted.length * q)] : 0;
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ...METRICS, latency_p50: p(0.5), latency_p95: p(0.95), latency_p99: p(0.99) }));
    return;
  }
  if (req.method === "POST" && (req.url === "/v1/messages" || req.url.startsWith("/v1/messages?"))) {
    return handleMessages(req, res);
  }
  // Anthropic SDKs sometimes hit /v1/complete (legacy) — alias.
  if (req.method === "POST" && req.url.startsWith("/v1/complete")) {
    return handleMessages(req, res);
  }
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ type: "error", error: { type: "not_found", message: `${req.method} ${req.url}` } }));
});

const STARTED_AT = new Date().toISOString();
server.listen(PORT, "0.0.0.0", () => {
  console.log(`[fabric-completion-server] listening on http://0.0.0.0:${PORT}`);
  console.log(`  substrate=${DEFAULT_SUBSTRATE}`);
  console.log(`  configure pi:`);
  console.log(`    $env:ANTHROPIC_BASE_URL = "http://127.0.0.1:${PORT}"`);
  console.log(`    $env:ANTHROPIC_API_KEY = "fabric-no-auth"`);
  console.log(`    pi --provider anthropic --model claude-3-5-sonnet-latest --print "<prompt>"`);
  appendLog({ event: "server_started", port: PORT, substrate: DEFAULT_SUBSTRATE });
});
