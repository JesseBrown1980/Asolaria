#!/usr/bin/env node
// cross-host-heartbeat-monitor.mjs
// named_agent: liris-cascade-W3-5-cross-host-heartbeat-monitor
// Polls acer:4947 health, records ndjson history + rolling 1h summary.
// node:fs + node:http only. No deps.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const PEER = 'acer';
const HOST = '192.168.100.1';
const PORT = 4947;
const ENDPOINT = `http://${HOST}:${PORT}`;
const HEALTH_PATH = '/behcs/health';
const INTERVAL_MS = 30_000;
const CONNECT_TIMEOUT_MS = 5_000;
const READ_TIMEOUT_MS = 15_000;
const MAX_HISTORY_LINES = 10_000;

const ROOT = path.resolve(path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', '..'));
const STATE_DIR = path.join(ROOT, 'data', 'behcs', 'state');
const HISTORY_FILE = path.join(STATE_DIR, 'heartbeat-history.ndjson');
const HISTORY_ROT = HISTORY_FILE + '.1';
const SUMMARY_FILE = path.join(STATE_DIR, 'heartbeat-summary.json');

fs.mkdirSync(STATE_DIR, { recursive: true });

function probe() {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const req = http.get({ host: HOST, port: PORT, path: HEALTH_PATH, timeout: CONNECT_TIMEOUT_MS }, (res) => {
      let body = '';
      res.setTimeout(READ_TIMEOUT_MS, () => { req.destroy(new Error('read_timeout')); });
      res.on('data', (c) => { body += c; if (body.length > 65536) req.destroy(new Error('body_too_large')); });
      res.on('end', () => {
        const ms = Date.now() - t0;
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return resolve({ state: 'down', ms, error: `http_${res.statusCode}` });
        }
        try {
          const j = JSON.parse(body);
          const expectFields = ['device', 'service', 'ok'];
          const missing = expectFields.filter((f) => !(f in j));
          const state = missing.length ? 'degraded' : 'up';
          return resolve({ state, ms, device: j.device || null, cube: j.cube || null, missing, ok: !!j.ok });
        } catch (e) {
          return resolve({ state: 'degraded', ms, error: 'json_parse_failed' });
        }
      });
    });
    req.setTimeout(CONNECT_TIMEOUT_MS, () => { req.destroy(new Error('connect_timeout')); });
    req.on('error', (e) => resolve({ state: 'down', ms: Date.now() - t0, error: e.message || String(e) }));
  });
}

function rotateIfNeeded() {
  try {
    if (!fs.existsSync(HISTORY_FILE)) return;
    const { size } = fs.statSync(HISTORY_FILE);
    if (size < 1_500_000) return; // cheap fast-path before line count
    const buf = fs.readFileSync(HISTORY_FILE, 'utf8');
    const lines = buf.split('\n').filter(Boolean);
    if (lines.length <= MAX_HISTORY_LINES) return;
    fs.writeFileSync(HISTORY_ROT, buf);
    fs.writeFileSync(HISTORY_FILE, '');
  } catch (e) { process.stderr.write(`[WARN] rotate_failed: ${e.message}\n`); }
}

function appendHistory(rec) {
  fs.appendFileSync(HISTORY_FILE, JSON.stringify(rec) + '\n');
  rotateIfNeeded();
}

function readRecent(windowMs) {
  if (!fs.existsSync(HISTORY_FILE)) return [];
  const cutoff = Date.now() - windowMs;
  const buf = fs.readFileSync(HISTORY_FILE, 'utf8');
  const out = [];
  for (const line of buf.split('\n')) {
    if (!line) continue;
    try {
      const r = JSON.parse(line);
      if (Date.parse(r.ts) >= cutoff) out.push(r);
    } catch {}
  }
  return out;
}

function pct(arr, p) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const i = Math.min(s.length - 1, Math.floor((p / 100) * s.length));
  return s[i];
}

function buildSummary(samples, current) {
  const ups = samples.filter((s) => s.state === 'up').length;
  const downs = samples.filter((s) => s.state === 'down');
  const mss = samples.filter((s) => s.state === 'up').map((s) => s.ms);
  let consecutive_failures = 0;
  for (let i = samples.length - 1; i >= 0; i--) {
    if (samples[i].state === 'down') consecutive_failures++; else break;
  }
  const lastUp = [...samples].reverse().find((s) => s.state === 'up');
  // last contiguous down event (started_at = first down in trailing run, ended_at = previous up)
  let last_down_event = null;
  for (let i = samples.length - 1; i >= 0; i--) {
    if (samples[i].state === 'down') {
      let j = i;
      while (j > 0 && samples[j - 1].state === 'down') j--;
      const started_at = samples[j].ts;
      const ended_at = (i + 1 < samples.length) ? samples[i + 1].ts : null;
      const duration_s = ended_at ? Math.round((Date.parse(ended_at) - Date.parse(started_at)) / 1000) : Math.round((Date.now() - Date.parse(started_at)) / 1000);
      last_down_event = { started_at, ended_at, duration_s };
      break;
    }
  }
  return {
    peer: PEER,
    endpoint: ENDPOINT,
    samples_1h: samples.length,
    uptime_pct_1h: samples.length ? Math.round((ups / samples.length) * 1000) / 10 : 0,
    current_state: current.state,
    last_up: lastUp ? lastUp.ts : null,
    last_down_event,
    consecutive_failures,
    ms_p50: pct(mss, 50),
    ms_p95: pct(mss, 95),
    updated_at: new Date().toISOString(),
  };
}

function atomicWriteJson(file, obj) {
  const tmp = file + '.tmp.' + process.pid;
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2));
  fs.renameSync(tmp, file);
}

function readPriorSummary() {
  try { return JSON.parse(fs.readFileSync(SUMMARY_FILE, 'utf8')); } catch { return null; }
}

function checkAlerts(samples, summary, prior) {
  if (summary.consecutive_failures >= 3) {
    process.stderr.write(`[ALERT] hub_down peer=${PEER} fails=${summary.consecutive_failures} last_seen=${summary.last_up || 'never'}\n`);
  }
  const last30 = samples.slice(-30).filter((s) => s.state === 'up').map((s) => s.ms);
  if (last30.length >= 10) {
    const p95 = pct(last30, 95);
    if (p95 > 1000) process.stderr.write(`[ALERT] hub_slow p95=${p95}ms\n`);
  }
  if (prior && prior.current_state === 'down' && summary.current_state === 'up' && prior.last_down_event) {
    const dur = Math.round((Date.now() - Date.parse(prior.last_down_event.started_at)) / 1000);
    process.stderr.write(`[RECOVERY] hub_up peer=${PEER} down_duration=${dur}s\n`);
  }
}

async function tick() {
  const result = await probe();
  const rec = { ts: new Date().toISOString(), peer: PEER, endpoint: ENDPOINT, ...result };
  appendHistory(rec);
  const samples = readRecent(60 * 60 * 1000);
  const prior = readPriorSummary();
  const summary = buildSummary(samples, result);
  atomicWriteJson(SUMMARY_FILE, summary);
  checkAlerts(samples, summary, prior);
  return { rec, summary };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--summary')) {
    const s = readPriorSummary();
    if (!s) { console.log('no summary yet'); process.exit(0); }
    console.log(`peer=${s.peer} state=${s.current_state} uptime_1h=${s.uptime_pct_1h}% samples=${s.samples_1h} p50=${s.ms_p50}ms p95=${s.ms_p95}ms fails=${s.consecutive_failures} last_up=${s.last_up} updated=${s.updated_at}`);
    if (s.last_down_event) console.log(`last_down: ${s.last_down_event.started_at} -> ${s.last_down_event.ended_at} (${s.last_down_event.duration_s}s)`);
    process.exit(0);
  }
  if (args.includes('--once')) {
    const { rec, summary } = await tick();
    console.log(JSON.stringify({ probe: rec, summary }, null, 2));
    process.exit(0);
  }
  process.stderr.write(`[INFO] heartbeat-monitor start peer=${PEER} endpoint=${ENDPOINT} interval=${INTERVAL_MS}ms\n`);
  while (true) {
    try { await tick(); } catch (e) { process.stderr.write(`[WARN] tick_error: ${e.message}\n`); }
    await new Promise((r) => setTimeout(r, INTERVAL_MS));
  }
}

main().catch((e) => { process.stderr.write(`[FATAL] ${e.stack || e}\n`); process.exit(1); });
