#!/usr/bin/env node
/**
 * liris-heartbeat.js — BEHCS heartbeat + compute_pulse cron for liris
 *
 * Emits a tuple every 30s to:
 *   1. Local liris:4947 bus (self-record)
 *   2. Acer:4947 sidecar (triad announce)
 *
 * LAW-003 compliant: silent > 120s = escalation. 30s interval = 4x safety margin.
 *
 * Cube: D44 HEARTBEAT (7189057) + D7 STATE (4913) + D49 LIRIS (not assigned, use D7)
 */

'use strict';

const http = require('http');
const os = require('os');

const INTERVAL_MS = 30_000;
const LIRIS_BUS   = 'http://localhost:4947';
const ACER_BUS    = 'http://192.168.100.1:4947';
const DEVICE      = 'liris';
const HOSTNAME    = 'DESKTOP-PTSQTIE';

let cycle = 0;

function getCpuLoad() {
  const cpus = os.cpus();
  const avg = cpus.map(c => {
    const total = Object.values(c.times).reduce((a, b) => a + b, 0);
    return Math.round((1 - c.times.idle / total) * 100);
  });
  return avg;
}

function buildTuple() {
  const cpus = os.cpus();
  const load = getCpuLoad();
  const totalMem = Math.round(os.totalmem() / (1024 * 1024 * 1024) * 10) / 10;
  const freeMem = Math.round(os.freemem() / (1024 * 1024 * 1024) * 10) / 10;
  const usedPct = Math.round((1 - os.freemem() / os.totalmem()) * 100);
  const uptimeH = Math.round(os.uptime() / 3600 * 10) / 10;

  cycle++;

  return {
    from: DEVICE,
    to: 'triad',
    mode: 'shadow',
    type: 'compute_pulse',
    id: `liris-hb-${cycle}`,
    ts: new Date().toISOString(),
    tuple: `(liris, behcs.compute_pulse, triad, 0, hardware, hookwall, pulsing, [D7+D44], pulse, LX, signed, session, behcs-bus, light)`,
    payload: {
      verb: 'behcs.compute_pulse',
      device: DEVICE,
      hostname: HOSTNAME,
      cycle,
      cpu: {
        model: cpus[0]?.model || 'unknown',
        cores: cpus.length,
        load,
        speed_mhz: cpus[0]?.speed || 0,
      },
      ram: {
        total_gb: String(totalMem),
        free_gb: String(freeMem),
        used_pct: String(usedPct),
      },
      uptime_h: String(uptimeH),
      law003: 'COMPLIANT',
      interval_ms: INTERVAL_MS,
    },
  };
}

function postTuple(baseUrl, tuple) {
  return new Promise((resolve) => {
    const url = new URL('/behcs/send', baseUrl);
    const data = JSON.stringify(tuple);
    const req = http.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
      timeout: 5000,
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch (_) { resolve({ ok: false, error: body }); }
      });
    });
    req.on('error', (e) => resolve({ ok: false, error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ ok: false, error: 'timeout' }); });
    req.write(data);
    req.end();
  });
}

async function pulse() {
  const tuple = buildTuple();
  const ts = tuple.ts.slice(11, 19);

  // Send to both buses in parallel
  const [local, remote] = await Promise.all([
    postTuple(LIRIS_BUS, tuple),
    postTuple(ACER_BUS, tuple),
  ]);

  const localOk = local.ok ? 'OK' : 'FAIL';
  const remoteOk = remote.ok ? 'OK' : 'FAIL';

  console.log(`[BEHCS:heartbeat] cycle=${cycle} ts=${ts} cpu=[${tuple.payload.cpu.load.join(',')}] ram=${tuple.payload.ram.used_pct}% local=${localOk} acer=${remoteOk}`);
}

// Boot announce
console.log(`[BEHCS] liris-heartbeat starting — interval=${INTERVAL_MS}ms device=${DEVICE} host=${HOSTNAME}`);
console.log(`[BEHCS] targets: ${LIRIS_BUS} (local) + ${ACER_BUS} (acer)`);
console.log(`[BEHCS] LAW-003 compliant: 30s < 120s threshold`);

// First pulse immediately
pulse();

// Then every 30s
setInterval(pulse, INTERVAL_MS);
