#!/usr/bin/env node
// dispatch-reconcile-report.mjs — WO L10 (id=a06c6c5729683b3f).
// JOIN outbox.ndjson dispatches against acer hub EVT-CANON-LOADED-ACK landings;
// surface unACKed dispatches > 1h old; optionally alert bus when count > N.
//
// Usage:
//   node tools/behcs/dispatch-reconcile-report.mjs                  default report
//   node tools/behcs/dispatch-reconcile-report.mjs --alert-threshold 5
//   node tools/behcs/dispatch-reconcile-report.mjs --watch --interval-s 600
//   node tools/behcs/dispatch-reconcile-report.mjs --no-alert
//
// Constraints: node:fs + node:http only, atomic state writes, ≤180 lines.

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import crypto from "node:crypto";
import { buildSignedEnvelope } from "./bus-sign.mjs";
import { retryWithBackoff } from "./retry-with-backoff.mjs";

const OUTBOX = "C:/Users/rayss/Asolaria/data/behcs/outbox.ndjson";
const HUB_INBOX = "http://192.168.100.1:4947/behcs/inbox";
const HUB_SEND  = "http://192.168.100.1:4947/behcs/send";
const TARGET = "liris";
const VERB = "EVT-CANON-LOADED-ACK";
const ALERT_LOG = "C:/Users/rayss/Asolaria/logs/dispatch-reconcile-alerts.ndjson";
const ALERT_STATE = "C:/Users/rayss/Asolaria/logs/dispatch-reconcile-alert-state.json";
const STALE_S = 3600;

const argv = process.argv.slice(2);
function flag(name, def) { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : def; }
const alertThreshold = parseInt(flag("--alert-threshold", "5"), 10);
const watch = argv.includes("--watch");
const intervalS = parseInt(flag("--interval-s", "600"), 10);
const noAlert = argv.includes("--no-alert");

function readOutbox() {
  if (!fs.existsSync(OUTBOX)) return new Map();
  const lines = fs.readFileSync(OUTBOX, "utf-8").split(/\r?\n/).filter(Boolean);
  const byId = new Map();
  for (const line of lines) {
    let row; try { row = JSON.parse(line); } catch { continue; }
    if (!row || !row.id) continue;
    byId.set(row.id, row);
  }
  return byId;
}

function fetchAcks() {
  return new Promise((resolve) => {
    const url = new URL(HUB_INBOX);
    url.searchParams.set("target", TARGET);
    url.searchParams.set("verb", VERB);
    url.searchParams.set("last", "500");
    const req = http.get(url, { timeout: 15000 }, (res) => {
      let body = ""; res.on("data", (c) => body += c);
      res.on("end", () => { try { resolve(JSON.parse(body)); } catch { resolve({ ok: false, error: "unparseable" }); } });
    });
    req.on("error", (e) => resolve({ ok: false, error: e.message }));
    req.on("timeout", () => { req.destroy(); resolve({ ok: false, error: "timeout" }); });
  });
}

function ageS(iso) { const t = Date.parse(iso); return Number.isNaN(t) ? null : Math.round((Date.now() - t) / 1000); }

function atomicWrite(p, content) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const tmp = `${p}.tmp.${process.pid}.${Date.now()}`;
  fs.writeFileSync(tmp, content);
  fs.renameSync(tmp, p);
}

function loadAlertState() {
  if (!fs.existsSync(ALERT_STATE)) return { last_set_hash: null, last_alert_ts: null, last_envelope_id: null };
  try { return JSON.parse(fs.readFileSync(ALERT_STATE, "utf-8")); } catch { return { last_set_hash: null }; }
}

async function buildReport() {
  const outbox = readOutbox();
  const ackRes = await fetchAcks();
  if (!ackRes.ok) return { ok: false, error: ackRes.error };
  const acked = new Set();
  for (const a of (ackRes.messages ?? [])) {
    const cid = a.payload?.canon_envelope_id;
    if (cid) acked.add(cid);
  }
  let ackedTotal = 0;
  const unackedAll = [];
  for (const [id, row] of outbox.entries()) {
    if (acked.has(id)) { ackedTotal++; continue; }
    unackedAll.push(row);
  }
  const stale = [];
  for (const r of unackedAll) {
    const age = ageS(r.dispatched_at ?? r.ts);
    if (age != null && age > STALE_S) {
      stale.push({ id: r.id, verb: r.verb, canon_version: r.canon_version, dispatched_at: r.dispatched_at ?? r.ts, age_s: age });
    }
  }
  stale.sort((a, b) => b.age_s - a.age_s);
  return {
    ok: true,
    generated_at: new Date().toISOString(),
    dispatched_total: outbox.size,
    acked_total: ackedTotal,
    unacked_total: unackedAll.length,
    unacked_over_1h: stale,
  };
}

function setHash(stale) {
  const ids = stale.map((r) => r.id).sort().join(",");
  return crypto.createHash("sha256").update(ids).digest("hex").slice(0, 16);
}

async function maybeAlert(report) {
  if (noAlert) return { sent: false, reason: "--no-alert" };
  if (report.unacked_over_1h.length <= alertThreshold) return { sent: false, reason: "below-threshold" };
  const hash = setHash(report.unacked_over_1h);
  const state = loadAlertState();
  if (watch && state.last_set_hash === hash) return { sent: false, reason: "set-unchanged" };

  const oldest = report.unacked_over_1h[0];
  const payload = {
    schema: "alert/v1",
    ts: new Date().toISOString(),
    from: "liris", to: "acer", type: "ALERT", verb: "EVT-LIRIS-UNACKED-DISPATCHES",
    payload: {
      unacked_count: report.unacked_over_1h.length,
      threshold: alertThreshold,
      oldest_envelope_id: oldest?.id ?? null,
      oldest_age_s: oldest?.age_s ?? null,
      list: report.unacked_over_1h.slice(0, 50),
    },
  };
  const envelope = buildSignedEnvelope(payload);
  const envelopeId = crypto.createHash("sha256").update(JSON.stringify(envelope)).digest("hex").slice(0, 16);

  const post = () => new Promise((resolve) => {
    const body = Buffer.from(JSON.stringify(envelope), "utf-8");
    const u = new URL(HUB_SEND);
    const req = http.request({
      hostname: u.hostname, port: u.port, path: u.pathname, method: "POST",
      headers: { "content-type": "application/json", "content-length": body.length },
      timeout: 15000,
    }, (res) => {
      let r = ""; res.on("data", (c) => r += c);
      res.on("end", () => resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, body: r.slice(0, 200) }));
    });
    req.on("error", (e) => resolve({ ok: false, error: e.message }));
    req.on("timeout", () => { req.destroy(); resolve({ ok: false, error: "timeout" }); });
    req.write(body); req.end();
  });

  const out = await retryWithBackoff(post, { label: "L10-alert-bus-post", max_attempts: 5 });
  fs.mkdirSync(path.dirname(ALERT_LOG), { recursive: true });
  fs.appendFileSync(ALERT_LOG, JSON.stringify({ ts: new Date().toISOString(), envelope_id: envelopeId, set_hash: hash, ok: out.ok, attempts: out.attempts, status: out.result?.status, unacked_count: report.unacked_over_1h.length, oldest_envelope_id: oldest?.id, oldest_age_s: oldest?.age_s }) + "\n");
  atomicWrite(ALERT_STATE, JSON.stringify({ last_set_hash: hash, last_alert_ts: new Date().toISOString(), last_envelope_id: envelopeId, ok: out.ok }, null, 2));
  return { sent: !!out.ok, envelope_id: envelopeId, attempts: out.attempts, status: out.result?.status };
}

async function runOnce() {
  const r = await buildReport();
  if (!r.ok) { console.log(JSON.stringify({ ok: false, error: r.error })); return 2; }
  const alert = await maybeAlert(r);
  console.log(JSON.stringify({ ...r, alert }, null, 2));
  return 0;
}

if (watch) {
  console.log(`[L10] watch mode: every ${intervalS}s, alert_threshold=${alertThreshold}, no_alert=${noAlert}`);
  await runOnce();
  setInterval(() => { runOnce().catch((e) => console.error(`[L10] tick error: ${e.message}`)); }, intervalS * 1000);
} else {
  process.exit(await runOnce());
}
