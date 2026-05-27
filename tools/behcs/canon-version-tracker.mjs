#!/usr/bin/env node
// Canon-version-tracker (WO L6, named_agent: liris-cascade-W2-2-canon-version-tracker)
// Per-peer canon deployment state registry. Reads outbox + polls acer:4947 inbox EVT-CANON-LOADED-ACK.
// Drift = dispatched_sha8 != loaded_sha8. age>=300s OR canon_version_diff => exit 1.
// CLI: default (read-only summary) | --update | --watch | --peer <name>

import fs from "node:fs";
import path from "node:path";
import http from "node:http";

const OUTBOX  = "C:/Users/rayss/Asolaria/data/behcs/outbox.ndjson";
const STATE   = "C:/Users/rayss/Asolaria/data/behcs/canon-deployment-state.json";
const HUB_HOST = "192.168.100.1";
const HUB_PORT = 4947;
const ACK_VERB = "EVT-CANON-LOADED-ACK";
const ACK_TARGET = "liris";
const DRIFT_AGE_THRESHOLD_S = 300;

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const getArg = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i+1] : null; };
const MODE_UPDATE = flag("--update");
const MODE_WATCH  = flag("--watch");
const PEER_FILTER = getArg("--peer");

function readNdjsonSafe(p) {
  if (!fs.existsSync(p)) return [];
  return fs.readFileSync(p, "utf-8").split("\n").filter(l => l.trim())
    .map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
}

function httpGetJson(host, port, urlPath, timeoutMs = 15000) {
  return new Promise((resolve) => {
    const req = http.request({ host, port, path: urlPath, method: "GET", timeout: timeoutMs }, (res) => {
      let body = ""; res.on("data", c => body += c);
      res.on("end", () => {
        try { resolve({ ok: res.statusCode>=200&&res.statusCode<300, status: res.statusCode, body: JSON.parse(body) }); }
        catch (e) { resolve({ ok: false, status: res.statusCode, error: "parse:"+e.message }); }
      });
    });
    req.on("error", e => resolve({ ok: false, error: e.message }));
    req.on("timeout", () => { req.destroy(); resolve({ ok: false, error: "timeout" }); });
    req.end();
  });
}

function atomicWriteJson(p, obj) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p+".tmp", JSON.stringify(obj, null, 2)); fs.renameSync(p+".tmp", p);
}

// Latest row per (to,id); pick freshest dispatched_at per peer.
function reduceOutbox(rows) {
  const tOf = (r) => r.dispatched_at || r.ts || "";
  const latest = new Map();
  for (const r of rows) {
    if (!r || !r.to || !r.id) continue;
    const k = r.to + "::" + r.id; const prev = latest.get(k);
    if (!prev || tOf(r) >= tOf(prev)) latest.set(k, r);
  }
  const byPeer = new Map(), idToRow = new Map(), dispatch_counts = new Map();
  for (const row of latest.values()) {
    idToRow.set(row.id, row);
    dispatch_counts.set(row.to, (dispatch_counts.get(row.to)||0) + 1);
    const cur = byPeer.get(row.to);
    if (!cur || tOf(row) >= tOf(cur)) byPeer.set(row.to, row);
  }
  return { byPeer, idToRow, dispatch_counts };
}

async function fetchAcks() {
  const r = await httpGetJson(HUB_HOST, HUB_PORT, `/behcs/inbox?target=${ACK_TARGET}&verb=${ACK_VERB}&last=200`);
  if (!r.ok || !r.body || !Array.isArray(r.body.messages)) return { ok: false, error: r.error||`status ${r.status}`, msgs: [] };
  return { ok: true, msgs: r.body.messages };
}

function reduceAcks(msgs, idToRow) {
  // Peer attribution priority: (1) ACK envelope `from` (the loader speaks);
  // (2) fallback: outbox.id join on canon_envelope_id. Latest ingested_at per peer.
  const byPeer = new Map();
  const ack_counts = new Map();
  for (const m of msgs) {
    const p = m && m.payload; if (!p) continue;
    let peer = m.from || null;
    if (!peer) { const r = p.canon_envelope_id ? idToRow.get(p.canon_envelope_id) : null; peer = r ? r.to : null; }
    if (!peer) continue;
    ack_counts.set(peer, (ack_counts.get(peer)||0) + 1);
    const ingested = p.ingested_at || m.received_at || m.ts || "";
    const cur = byPeer.get(peer);
    const prev_t = cur ? (cur._ingested_at || "") : "";
    if (!cur || ingested >= prev_t) byPeer.set(peer, { ...p, _ingested_at: ingested });
  }
  return { byPeer, ack_counts };
}

function buildState(outRows, ackMsgs) {
  const { byPeer: disp, idToRow, dispatch_counts } = reduceOutbox(outRows);
  const { byPeer: ack, ack_counts } = reduceAcks(ackMsgs, idToRow);
  const peers = {}; const now = Date.now();
  for (const peer of new Set([...disp.keys(), ...ack.keys()])) {
    const d = disp.get(peer), a = ack.get(peer);
    const ds = d && d.payload_sha256 ? d.payload_sha256.slice(0,8) : null;
    const ls = a ? (a.payload_sha256_8 || (a.payload_sha256 ? a.payload_sha256.slice(0,8) : null)) : null;
    const drift = (ds && ls) ? ds !== ls : (!!ds && !ls);
    const drift_age_s = (drift && d && d.dispatched_at)
      ? Math.max(0, Math.floor((now - new Date(d.dispatched_at).getTime())/1000)) : null;
    peers[peer] = {
      last_dispatched_canon_version: d ? d.canon_version : null,
      last_dispatched_payload_sha256_8: ds,
      last_dispatched_envelope_id: d ? d.id : null,
      last_dispatched_at: d ? (d.dispatched_at || d.ts || null) : null,
      last_loaded_canon_version: a ? a.canon_version : null,
      last_loaded_payload_sha256_8: ls,
      last_loaded_at: a ? a._ingested_at : null,
      last_loaded_session_id: a ? a.session_id : null,
      drift, drift_age_s,
      ack_count: ack_counts.get(peer) || 0,
      dispatch_count: dispatch_counts.get(peer) || 0,
    };
  }
  return { peers, updated_at: new Date().toISOString() };
}

const fmt = (v, n=10) => { const s = (v===null||v===undefined) ? "null" : String(v); return s.length>n ? s.slice(0,n-1)+"…" : s.padEnd(n); };

function printTable(state, only) {
  const peers = state.peers || {};
  const keys = Object.keys(peers).filter(k => !only || k===only);
  if (!keys.length) { console.log("(no peers in state)"); return; }
  console.log("peer       canon_v   disp_sha8  loaded_sha8 drift age(s) acks disp last_disp(UTC)         last_load(UTC)");
  console.log("---------- --------- ---------- ----------- ----- ------ ---- ---- ---------------------- ----------------------");
  for (const k of keys) {
    const r = peers[k];
    console.log([
      fmt(k,10), fmt(r.last_dispatched_canon_version,9),
      fmt(r.last_dispatched_payload_sha256_8,10),
      fmt(r.last_loaded_payload_sha256_8,11),
      fmt(r.drift?"YES":"no",5),
      fmt(r.drift_age_s===null?"-":String(r.drift_age_s),6),
      fmt(String(r.ack_count),4), fmt(String(r.dispatch_count),4),
      fmt(r.last_dispatched_at,22), fmt(r.last_loaded_at,22)
    ].join(" "));
  }
  console.log(`updated_at=${state.updated_at}`);
}

function evalDrift(state) {
  let alert = false; const lines = [];
  for (const [peer, r] of Object.entries(state.peers || {})) {
    if (PEER_FILTER && peer !== PEER_FILTER) continue;
    const versionDiff = r.last_dispatched_canon_version && r.last_loaded_canon_version &&
      r.last_dispatched_canon_version !== r.last_loaded_canon_version;
    const ageBreach = r.drift && r.drift_age_s !== null && r.drift_age_s >= DRIFT_AGE_THRESHOLD_S;
    if (versionDiff || ageBreach) {
      alert = true;
      lines.push(`[DRIFT] peer=${peer} disp_v=${r.last_dispatched_canon_version} load_v=${r.last_loaded_canon_version} disp_sha8=${r.last_dispatched_payload_sha256_8} load_sha8=${r.last_loaded_payload_sha256_8} age_s=${r.drift_age_s} reason=${versionDiff?"version_diff":""}${versionDiff&&ageBreach?"+":""}${ageBreach?"age>="+DRIFT_AGE_THRESHOLD_S+"s":""}`);
    }
  }
  return { alert, lines };
}

async function refreshOnce() {
  const outRows = readNdjsonSafe(OUTBOX);
  const ackR = await fetchAcks();
  if (!ackR.ok) console.error(`[warn] ack fetch failed: ${ackR.error}`);
  const state = buildState(outRows, ackR.msgs || []);
  if (MODE_UPDATE || MODE_WATCH) atomicWriteJson(STATE, state);
  return state;
}

async function loadOrCompute() {
  if (MODE_UPDATE || MODE_WATCH) return refreshOnce();
  if (fs.existsSync(STATE)) {
    try { return JSON.parse(fs.readFileSync(STATE, "utf-8")); }
    catch (e) { console.error(`[warn] state read failed (${e.message}); recomputing read-only`); }
  }
  return buildState(readNdjsonSafe(OUTBOX), []); // offline-safe fallback
}

async function main() {
  if (MODE_WATCH) {
    while (true) {
      const state = await refreshOnce();
      console.clear();
      console.log(`[canon-version-tracker --watch] ${new Date().toISOString()}`);
      printTable(state, PEER_FILTER);
      const { alert, lines } = evalDrift(state);
      if (alert) for (const l of lines) console.error("\x1b[31m"+l+"\x1b[0m");
      await new Promise(r => setTimeout(r, 60000));
    }
  }
  const state = await loadOrCompute();
  printTable(state, PEER_FILTER);
  const { alert, lines } = evalDrift(state);
  if (alert) { for (const l of lines) console.error("\x1b[31m"+l+"\x1b[0m"); process.exit(1); }
  process.exit(0);
}

main().catch(e => { console.error(`[fatal] ${e.stack||e.message}`); process.exit(2); });
