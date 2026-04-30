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

// Ingress sig-verify — mirrors acer's acer-ingress-sig-verify patch (50bb650).
// If an incoming /behcs/send carries a `signed_envelope` block with {payload, signature},
// verify signature against kernel/ed25519-registry.json on liris side. Three verdicts:
//   VERIFIED  → 200 ok:true sig_verdict:VERIFIED sig_owner:<owner>
//   TAMPERED  → 403 ok:false sig_verdict:TAMPERED (forgery dies at ingress)
//   UNSIGNED  → 200 ok:true sig_verdict:UNSIGNED (backward compat)
const crypto = require("crypto");
const REGISTRY_PATH = "C:/Users/rayss/Asolaria-BEHCS-256/kernel/ed25519-registry.json";
const SPKI_ED_PREFIX = Buffer.from("302a300506032b6570032100", "hex");
const INGRESS_SIG_LOG = path.join(ROOT, "logs/ingress-sig-events.ndjson");

function loadRegistry() {
  try {
    if (!fs.existsSync(REGISTRY_PATH)) return { keys: [] };
    return JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf-8"));
  } catch (_) { return { keys: [] }; }
}

function verifySigIngress(signedEnv) {
  if (!signedEnv || typeof signedEnv !== "object") return { verdict: "UNSIGNED", reason: "no-signed-envelope" };
  const { payload, signature } = signedEnv;
  if (!payload || !signature || !signature.key_id || !signature.sig_b64) {
    return { verdict: "UNSIGNED", reason: "payload-or-signature-missing" };
  }
  const reg = loadRegistry();
  const entry = reg.keys.find((k) => k.key_id === signature.key_id);
  if (!entry) return { verdict: "TAMPERED", reason: "unknown-key-id", key_id: signature.key_id };
  try {
    const pubRaw = Buffer.from(entry.public_key_b64, "base64");
    if (pubRaw.length !== 32) return { verdict: "TAMPERED", reason: "bad-key-material", key_id: signature.key_id };
    const spki = Buffer.concat([SPKI_ED_PREFIX, pubRaw]);
    const pub = crypto.createPublicKey({ key: spki, format: "der", type: "spki" });
    const material = Buffer.from(JSON.stringify(payload), "utf-8");
    const sigBuf = Buffer.from(signature.sig_b64, "base64");
    const ok = crypto.verify(null, material, pub, sigBuf);
    if (!ok) return { verdict: "TAMPERED", reason: "crypto-verify-failed", key_id: signature.key_id, owner: entry.owner_glyph };
    return { verdict: "VERIFIED", key_id: entry.key_id, owner: entry.owner_glyph };
  } catch (e) {
    return { verdict: "TAMPERED", reason: "threw: " + e.message, key_id: signature.key_id };
  }
}

function logSigEvent(rec) {
  try { ensureDir(INGRESS_SIG_LOG); fs.appendFileSync(INGRESS_SIG_LOG, JSON.stringify({ ts: new Date().toISOString(), ...rec }) + "\n"); } catch (_) {}
}

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
    // Ingress sig-verify (mirrors acer 50bb650). Look for signed_envelope at msg.signed_envelope
    // OR msg.body.liris_signed_envelope OR msg.body.signed_envelope for compat with prior shapes.
    const signedEnv = msg.signed_envelope
      || (msg.body && (msg.body.signed_envelope || msg.body.liris_signed_envelope || msg.body.acer_signed_envelope))
      || null;
    const sigVerdict = verifySigIngress(signedEnv);
    logSigEvent({ verb: msg.verb, actor: msg.actor || msg.from, verdict: sigVerdict.verdict, key_id: sigVerdict.key_id, owner: sigVerdict.owner, reason: sigVerdict.reason });
    if (sigVerdict.verdict === "TAMPERED") {
      log("SIG-TAMPERED REJECTED from=" + (msg.actor || msg.from) + " verb=" + msg.verb + " reason=" + sigVerdict.reason);
      return jsonRes(res, 403, { ok: false, blocked: true, sig_verdict: "TAMPERED", sig_reason: sigVerdict.reason, gate_results: gates });
    }
    msg.received_at = new Date().toISOString();
    msg.received_by = "liris-sidecar";
    msg.gate_results = gates;
    msg.sig_verdict = sigVerdict.verdict;
    msg.sig_owner = sigVerdict.owner || null;
    inbox.push(msg);
    appendInbox(msg);
    appendRehydrate(msg); // Queue for liris-kuromi rehydration
    log("RECV from=" + (msg.actor || msg.from) + " verb=" + msg.verb + " sig=" + sigVerdict.verdict);
    return jsonRes(res, 200, { ok: true, by: "liris-sidecar", sig_verdict: sigVerdict.verdict, sig_owner: sigVerdict.owner || null, gate_results: gates });
  }

  if (url === "/behcs/inbox") {
    // 2026-04-18 fix: honor query params. Acer's Claude observed that
    // ?limit/?since/?actor/?verb/?target were being ignored, causing targeted
    // ack-tracking to fail under 1Hz heartbeat flood. Patched bilaterally.
    const qs = req.url.includes("?") ? new URLSearchParams(req.url.split("?")[1]) : new URLSearchParams();
    const limit = Math.min(Math.max(1, parseInt(qs.get("limit") || "50", 10) || 50), 5000);
    const since = qs.get("since"); // ISO timestamp
    const actor = qs.get("actor");
    const verb = qs.get("verb");
    const target = qs.get("target");
    const eventId = qs.get("event_id");
    const fallbackD1 = qs.get("d1"); // filter by fallbackTuples contains D1:<x>

    let msgs = inbox;
    if (eventId) {
      msgs = msgs.filter(m => {
        const eid = m.gate_results && m.gate_results.gnn && m.gate_results.gnn.edge && m.gate_results.gnn.edge.eventId;
        return eid === eventId;
      });
    } else {
      if (since) {
        const sinceMs = Date.parse(since);
        if (!isNaN(sinceMs)) msgs = msgs.filter(m => Date.parse(m.received_at || m.ts || "") >= sinceMs);
      }
      if (actor) msgs = msgs.filter(m => m.actor === actor || m.from === actor);
      if (verb) msgs = msgs.filter(m => m.verb === verb);
      if (target) msgs = msgs.filter(m => m.target === target || m.to === target);
      if (fallbackD1) msgs = msgs.filter(m => Array.isArray(m.fallbackTuples) && m.fallbackTuples.includes("D1:" + fallbackD1));
    }

    // Apply limit to the latest N after filtering
    const tail = msgs.slice(-limit);
    return jsonRes(res, 200, {
      ok: true,
      count: inbox.length,
      filtered: msgs.length,
      returned: tail.length,
      filters_applied: { limit, since, actor, verb, target, event_id: eventId, d1: fallbackD1 },
      messages: tail,
    });
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
