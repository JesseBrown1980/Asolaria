#!/usr/bin/env node
"use strict";
/**
 * behcs-sidecar-liris.js — BEHCS-LAW-004: sidecar is always on.
 *
 * Runs OUTSIDE Claude Code. Survives session boundaries.
 * - BEHCS bus on :4947 with gates
 * - 30s heartbeat to acer:4947
 * - Omnicalendar mirror (30s tick)
 * - Rehydration queue at /behcs/rehydrate
 * - Auto-relay falcon<>liris through acer
 * - When liris-kuromi restarts, she reads queue and catches up
 *
 * Start: node tools/behcs-sidecar-liris.js
 * Or:    pm2 start tools/behcs-sidecar-liris.js --name behcs-sidecar
 * Or:    nohup node tools/behcs-sidecar-liris.js &
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");

const PORT = 4947;
const ACER_BUS = "http://192.168.100.1:4947";
const ROOT = "C:/Users/rayss/Asolaria";
const INBOX_FILE = path.join(ROOT, "data/behcs-inbox.ndjson");
const REHYDRATE_FILE = path.join(ROOT, "data/behcs-rehydration-queue.ndjson");
const LOG_FILE = path.join(ROOT, "logs/behcs-sidecar.log");
const CALENDAR_FILE = path.join(ROOT, "data/behcs-omnicalendar.json");
const CALENDAR_LOG = path.join(ROOT, "logs/behcs-omnicalendar.ndjson");

function ensureDir(p) { try { fs.mkdirSync(path.dirname(p), { recursive: true }); } catch(_) {} }
function log(msg) { const line = new Date().toISOString() + " " + msg; console.log(line); ensureDir(LOG_FILE); try { fs.appendFileSync(LOG_FILE, line + "\n"); } catch(_) {} }

// Gates — try to load, degrade gracefully
let hookwallGate, gnnGate, shannonGate;
try { hookwallGate = require("../gates/hookwall-v2"); } catch(_) { log("WARN: hookwall not loaded"); }
try { gnnGate = require("../gates/gnn"); } catch(_) { log("WARN: gnn not loaded"); }
try { shannonGate = require("../gates/shannon"); } catch(_) { log("WARN: shannon not loaded"); }

async function runGateCheck(verb, args, envelope) {
  const results = { hookwall: null, gnn: null, shannon: null, allowed: true };
  try { if (hookwallGate) results.hookwall = await hookwallGate(verb, args, envelope); } catch(e) { results.hookwall = { degraded: true, error: e.message }; }
  try { if (gnnGate) results.gnn = await gnnGate(verb, args, envelope); } catch(e) { results.gnn = { degraded: true, error: e.message }; }
  try { if (shannonGate) results.shannon = await shannonGate(verb, args, { ...envelope, gnnResult: results.gnn }); } catch(e) { results.shannon = { degraded: true, error: e.message }; }
  if (results.hookwall?.allow === false) results.allowed = false;
  if (results.gnn?.allow === false) results.allowed = false;
  if (results.shannon?.allow === false) results.allowed = false;
  return results;
}

const hilbertAddress = { D1: "liris", D7: 4913, D13: 68921, D15: 103823, D19: "192.168.100.2", D25: 912673, D35: 3307949, D44: 7189057, D47: 9393931 };
const inbox = [];
const rehydrationQueue = [];

function appendInbox(msg) { ensureDir(INBOX_FILE); try { fs.appendFileSync(INBOX_FILE, JSON.stringify(msg) + "\n"); } catch(_) {} }
function appendRehydrate(msg) { ensureDir(REHYDRATE_FILE); try { fs.appendFileSync(REHYDRATE_FILE, JSON.stringify(msg) + "\n"); } catch(_) {} rehydrationQueue.push(msg); }

function readBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", c => body += c);
    req.on("end", () => { try { resolve(JSON.parse(body)); } catch(_) { resolve(null); } });
  });
}

function jsonRes(res, code, obj) { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(obj)); }

function httpPost(url, data) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const payload = typeof data === "string" ? data : JSON.stringify(data);
    const req = http.request({ hostname: u.hostname, port: u.port, path: u.pathname, method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) }, timeout: 5000 }, (res) => {
      let b = ""; res.on("data", c => b += c); res.on("end", () => resolve(b));
    });
    req.on("error", () => resolve(null));
    req.write(payload); req.end();
  });
}

function httpGet(url) {
  return new Promise((resolve) => {
    const u = new URL(url);
    http.get({ hostname: u.hostname, port: u.port, path: u.pathname, timeout: 5000 }, (res) => {
      let b = ""; res.on("data", c => b += c); res.on("end", () => { try { resolve(JSON.parse(b)); } catch(_) { resolve(null); } });
    }).on("error", () => resolve(null));
  });
}

// === HTTP SERVER ===
const server = http.createServer(async (req, res) => {
  const url = req.url?.split("?")[0];

  if (url === "/behcs/health") {
    return jsonRes(res, 200, { ok: true, device: "liris", bus: "behcs-sidecar", port: PORT, ts: new Date().toISOString(), hilbertAddress, dims: 47, cosign: "COSIGN_47D_001", inbox_count: inbox.length, rehydration_queue: rehydrationQueue.length, law004: "sidecar_always_on" });
  }

  if (url === "/behcs/send" && req.method === "POST") {
    const msg = await readBody(req);
    if (!msg) return jsonRes(res, 400, { ok: false, error: "bad json" });
    // Gate check on every message (IX-864)
    const gates = await runGateCheck(msg.verb || "unknown", msg.data || {}, { pid: msg.from || "unknown", permissionTier: "trusted_agent", host: "liris" });
    if (!gates.allowed) { log("GATE-BLOCKED from=" + msg.from + " verb=" + msg.verb); return jsonRes(res, 403, { ok: false, blocked: true, gate_results: gates }); }
    msg.received_at = new Date().toISOString();
    msg.received_by = "liris-sidecar";
    msg.gate_results = gates;
    inbox.push(msg);
    appendInbox(msg);
    appendRehydrate(msg); // Queue for liris-kuromi rehydration
    log("RECV from=" + msg.from + " verb=" + msg.verb);
    return jsonRes(res, 200, { ok: true, by: "liris-sidecar", gate_results: gates });
  }

  if (url === "/behcs/inbox") {
    return jsonRes(res, 200, { ok: true, count: inbox.length, messages: inbox.slice(-50) });
  }

  if (url === "/behcs/rehydrate") {
    // Liris-kuromi reads this on restart to catch up
    const queue = [...rehydrationQueue];
    return jsonRes(res, 200, { ok: true, count: queue.length, messages: queue });
  }

  if (url === "/behcs/rehydrate/ack" && req.method === "POST") {
    // Liris-kuromi acknowledges rehydration — clear the queue
    const count = rehydrationQueue.length;
    rehydrationQueue.length = 0;
    log("REHYDRATION ACK: cleared " + count + " messages");
    return jsonRes(res, 200, { ok: true, cleared: count });
  }

  if (url === "/behcs/gate-check" && req.method === "POST") {
    const body = await readBody(req);
    if (!body) return jsonRes(res, 400, { ok: false, error: "bad json" });
    const gates = await runGateCheck(body.verb || "unknown", body.args || {}, body.envelope || {});
    return jsonRes(res, 200, gates);
  }

  if (url === "/behcs/devices") {
    return jsonRes(res, 200, { ok: true, devices: { liris: { id: "liris", label: "Liris-kuromi (Rayssa)", role: "triad_node_3", endpoints: ["http://192.168.100.2:4947"], hilbertAddress, law004: true } } });
  }

  jsonRes(res, 404, { ok: false, error: "not found", routes: ["/behcs/health", "/behcs/send", "/behcs/inbox", "/behcs/rehydrate", "/behcs/rehydrate/ack", "/behcs/gate-check", "/behcs/devices"] });
});

// === HEARTBEAT (30s) ===
function sendHeartbeat() {
  const payload = {
    from: "liris", to: "asolaria", verb: "behcs.heartbeat",
    tuple: ["liris", "behcs.heartbeat", "asolaria", 0, "colony", "hookwall", "pulsing", ["LX-489", "BEHCS-class-5", "sidecar-LAW004"], "pulse", "LX", "signed", "permanent", "ethernet-direct", "free"],
    text: "sidecar heartbeat " + new Date().toISOString() + " load=" + os.loadavg().map(v => v.toFixed(1)).join(",") + " mem=" + Math.round((1 - os.freemem() / os.totalmem()) * 100) + "% inbox=" + inbox.length + " rehydrate=" + rehydrationQueue.length,
    version: "behcs-v1"
  };
  httpPost(ACER_BUS + "/behcs/send", payload).then(r => { if (r) log("heartbeat sent"); else log("heartbeat FAILED"); });
}

// === OMNICALENDAR (30s) ===
async function omnicalendarTick() {
  const acerHealth = await httpGet(ACER_BUS + "/behcs/health");
  const acerInbox = await httpGet(ACER_BUS + "/behcs/inbox");

  let falconHb = 0, lirisHb = 0, lastFalcon = null, lastLiris = null, verbCounts = {};
  if (acerInbox?.messages) {
    for (const m of acerInbox.messages) {
      if (m.verb) verbCounts[m.verb] = (verbCounts[m.verb] || 0) + 1;
      if (m.from === "falcon" && m.verb === "behcs.heartbeat") { falconHb++; lastFalcon = m.received_at; }
      if (m.from === "liris" && m.verb === "behcs.heartbeat") { lirisHb++; lastLiris = m.received_at; }
    }
  }

  const now = Date.now();
  const falconSilent = lastFalcon ? (now - new Date(lastFalcon).getTime()) > 120000 : true;
  const lirisSilent = lastLiris ? (now - new Date(lastLiris).getTime()) > 120000 : true;
  const triadStatus = !acerHealth ? "acer_down" : falconSilent ? "falcon_silent" : lirisSilent ? "liris_silent" : "all_pulsing";

  const state = {
    last_check: new Date().toISOString(),
    acer_alive: !!acerHealth,
    falcon_heartbeat_count: falconHb,
    liris_heartbeat_count: lirisHb,
    last_falcon_heartbeat: lastFalcon,
    last_liris_heartbeat: lastLiris,
    message_count_by_verb: verbCounts,
    triad_status: triadStatus,
    escalation: falconSilent || lirisSilent || !acerHealth
  };

  ensureDir(CALENDAR_FILE);
  try { fs.writeFileSync(CALENDAR_FILE, JSON.stringify(state, null, 2)); } catch(_) {}
  ensureDir(CALENDAR_LOG);
  try { fs.appendFileSync(CALENDAR_LOG, JSON.stringify(state) + "\n"); } catch(_) {}
}

// === START ===
server.listen(PORT, "0.0.0.0", () => {
  log("BEHCS SIDECAR LIVE on 0.0.0.0:" + PORT + " — LAW-004 always on");
  sendHeartbeat();
  setInterval(sendHeartbeat, 30000);
  omnicalendarTick();
  setInterval(omnicalendarTick, 30000);
});

process.on("uncaughtException", (e) => { log("UNCAUGHT: " + e.message); });
process.on("unhandledRejection", (e) => { log("UNHANDLED: " + (e?.message || e)); });
