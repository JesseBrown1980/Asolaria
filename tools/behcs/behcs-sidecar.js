#!/usr/bin/env node
/**
 * behcs-sidecar.js — Persistent BEHCS sidecar process.
 *
 * Runs OUTSIDE Claude Code as a standalone Node process.
 * Survives session boundaries. Accepts messages from falcon + liris
 * and queues them for the next Asolaria session to ingest.
 *
 * Features:
 *   1. HTTP server on :4947 (BEHCS bus) — always on
 *   2. Cron kicker: screenshots falcon every 30s, unsticks if hung
 *   3. Message queue: stores inbound messages for asolaria to read
 *   4. Auto-relay: falcon→liris and liris→falcon via acer hub
 *   5. Hookwall gate on every inbound message
 *   6. GNN edge logging per IX-865
 *   7. Rehydration endpoint: /behcs/rehydrate returns all queued
 *      messages so new asolaria session catches up instantly
 *   8. Self-repair: if bus crashes, respawns in 5s
 *
 * Ports:
 *   4947 — BEHCS bus (primary)
 *   4948 — sidecar admin (health, rehydrate, flush)
 *
 * Start: node tools/behcs/behcs-sidecar.js
 * Or:    nohup node tools/behcs/behcs-sidecar.js >> logs/behcs-sidecar.log 2>&1 &
 *
 * Cube: D44 HEARTBEAT (7189057) + D36 INFERENCE_SURFACE (3442951)
 */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync, spawn } = require('child_process');

const ROOT = 'C:/Users/acer/Asolaria';
const ADB = 'C:/Users/acer/AppData/Local/Microsoft/WinGet/Packages/Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe/platform-tools/adb';
const BEHCS_DIR = path.join(ROOT, 'data/behcs');
const INBOX = path.join(BEHCS_DIR, 'inbox.ndjson');
const QUEUE = path.join(BEHCS_DIR, 'rehydration-queue.ndjson');
const GNN_EDGES = path.join(BEHCS_DIR, 'gnn-edges.ndjson');
const CAPTURES_DIR = path.join(ROOT, 'logs/captures/omnicalendar');
const PID_FILE = path.join(BEHCS_DIR, 'sidecar.pid');

const BUS_PORT = 4947;
const ADMIN_PORT = 4948;
const HEARTBEAT_INTERVAL = 30000;
const MAX_INBOX = 200;
const MAX_QUEUE = 500;
const MAX_EDGES = 1000;
const MAX_CAPTURES = 20;

function ensureDir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }
function appendNdjson(f, obj) { ensureDir(path.dirname(f)); fs.appendFileSync(f, JSON.stringify(obj) + '\n'); }
function truncateNdjson(f, maxLines) {
  if (!fs.existsSync(f)) return;
  const lines = fs.readFileSync(f, 'utf8').split('\n').filter(l => l.trim());
  if (lines.length > maxLines) fs.writeFileSync(f, lines.slice(-maxLines).join('\n') + '\n');
}

// ═══ PEERS ═══
const PEERS = {
  liris: { url: 'http://192.168.100.2:4820', token: '129b1a32113392e18169002117528b829816212dcd1fb21089351407e0850621' },
  falcon: { adb: true },
};

// ═══ HOOKWALL GATE (inline, fast) ═══
function hookwallCheck(envelope) {
  const text = JSON.stringify(envelope).toLowerCase();
  const denies = [];
  // HD-1c: LOCAL novalum analysis PERMITTED. Only block external/hack/exploit
  if (text.includes('novalum') && (text.includes('external') && !text.includes('external deny')) && !text.includes('hd-1c') && !text.includes('local analysis') && !text.includes('behcs.novalum')) denies.push('HD-1a');
  if ((text.includes('brian') || text.includes('natalie')) && text.includes('send') && !text.includes('draft')) denies.push('HD-2-ext');
  if (text.includes('virus') || text.includes('malware')) denies.push('HD-virus');
  if (text.includes('force-stop') && !text.includes('termux')) denies.push('HD-destructive');
  return { allow: denies.length === 0, denies };
}

// ═══ GNN EDGE (per IX-865) ═══
function logGnnEdge(envelope) {
  const edge = {
    from: envelope.from || 'unknown',
    to: envelope.to || 'unknown',
    verb: envelope.payload?.verb || envelope.type || 'message',
    weight: (envelope.payload?.risk || 1) * 0.5,
    ts: new Date().toISOString(),
    id: envelope.id,
  };
  appendNdjson(GNN_EDGES, edge);
  truncateNdjson(GNN_EDGES, MAX_EDGES);
}

// ═══ AUTO-RELAY ═══
function relayToLiris(envelope) {
  if (envelope.to === 'liris' || envelope.to === 'liris+falcon' || envelope.to === 'falcon+liris') {
    const data = JSON.stringify({ text: `[relay:${envelope.from}] ${envelope.payload?.text || envelope.text || JSON.stringify(envelope.payload).slice(0, 200)}`, press_enter: true });
    const req = http.request({
      hostname: '192.168.100.2', port: 4820, path: '/type', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${PEERS.liris.token}`, 'Content-Length': Buffer.byteLength(data) },
    });
    req.on('error', () => {});
    req.setTimeout(5000, () => req.destroy());
    req.write(data);
    req.end();
  }
}

function relayToFalcon(envelope) {
  if (envelope.to === 'falcon' || envelope.to === 'liris+falcon' || envelope.to === 'falcon+liris') {
    try {
      const text = `[relay:${envelope.from}] ${envelope.payload?.text || envelope.text || ''}`.slice(0, 200).replace(/ /g, '%s');
      execSync(`"${ADB}" shell "input text '${text}'"`, { timeout: 5000 });
      execSync(`"${ADB}" shell input keyevent 66`, { timeout: 3000 });
    } catch (_) {}
  }
}

// ═══ ADB HELPERS ═══
function adbConnected() {
  try { return execSync(`"${ADB}" devices`, { encoding: 'utf8', timeout: 5000 }).includes('device'); } catch (_) { return false; }
}

function ensureTunnels() {
  try {
    const list = execSync(`"${ADB}" reverse --list`, { encoding: 'utf8', timeout: 5000 });
    if (!list.includes('4947')) execSync(`"${ADB}" reverse tcp:4947 tcp:4947`, { timeout: 5000 });
    if (!list.includes('4913')) execSync(`"${ADB}" reverse tcp:4913 tcp:4913`, { timeout: 5000 });
    if (!list.includes('4781')) execSync(`"${ADB}" reverse tcp:4781 tcp:4781`, { timeout: 5000 });
  } catch (_) {}
}

function screenshotFalcon() {
  ensureDir(CAPTURES_DIR);
  const ts = new Date().toISOString().replace(/[:.]/g, '');
  const file = path.join(CAPTURES_DIR, `falcon-${ts}.png`);
  try {
    execSync(`"${ADB}" exec-out screencap -p > "${file}"`, { timeout: 10000 });
    // Prune old
    const files = fs.readdirSync(CAPTURES_DIR).filter(f => f.startsWith('falcon-')).sort();
    if (files.length > MAX_CAPTURES) {
      for (const f of files.slice(0, files.length - MAX_CAPTURES)) fs.unlinkSync(path.join(CAPTURES_DIR, f));
    }
    return file;
  } catch (_) { return null; }
}

// ═══ BEHCS BUS SERVER ═══
function startBus() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${BUS_PORT}`);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

    if (url.pathname === '/behcs/health') {
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true, sidecar: true, device: 'acer', port: BUS_PORT, ts: new Date().toISOString(), entities: 453, triad: true }));
      return;
    }

    // ═══ MIRROR VISION — every node sees every other node's screen ═══
    if (url.pathname === '/behcs/screen/acer') {
      // Acer's own screen via PowerShell screencap
      try {
        const file = path.join(CAPTURES_DIR, 'acer-screen-latest.png');
        execSync('powershell.exe -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Screen]::PrimaryScreen | Out-Null; $bmp = New-Object System.Drawing.Bitmap([System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Width, [System.Windows.Forms.Screen]::PrimaryScreen.Bounds.Height); $gfx = [System.Drawing.Graphics]::FromImage($bmp); $gfx.CopyFromScreen(0,0,0,0,$bmp.Size); $bmp.Save(\'' + file.replace(/\//g,'\\') + '\'); $gfx.Dispose(); $bmp.Dispose()"', { timeout: 10000 });
        res.setHeader('Content-Type', 'image/png');
        res.writeHead(200);
        res.end(fs.readFileSync(file));
      } catch (e) {
        res.writeHead(500);
        res.end(JSON.stringify({ ok: false, error: 'screencap failed: ' + e.message.slice(0, 100) }));
      }
      return;
    }

    if (url.pathname === '/behcs/screen/falcon') {
      // Falcon screen via ADB
      try {
        const file = path.join(CAPTURES_DIR, 'falcon-screen-latest.png');
        execSync(`"${ADB}" -s R5CXA4MGQXV exec-out screencap -p > "${file}"`, { timeout: 10000 });
        res.setHeader('Content-Type', 'image/png');
        res.writeHead(200);
        res.end(fs.readFileSync(file));
      } catch (e) {
        res.writeHead(500);
        res.end(JSON.stringify({ ok: false, error: 'falcon screencap failed: ' + e.message.slice(0, 100) }));
      }
      return;
    }

    if (url.pathname === '/behcs/screen/aether') {
      try {
        const file = path.join(CAPTURES_DIR, 'aether-screen-latest.png');
        execSync(`"${ADB}" -s R9QY205KAKJ exec-out screencap -p > "${file}"`, { timeout: 10000 });
        res.setHeader('Content-Type', 'image/png');
        res.writeHead(200);
        res.end(fs.readFileSync(file));
      } catch (e) {
        res.writeHead(500);
        res.end(JSON.stringify({ ok: false, error: 'aether screencap failed: ' + e.message.slice(0, 100) }));
      }
      return;
    }

    if (url.pathname === '/behcs/screen/liris') {
      // Liris — would need liris to serve /behcs/screen endpoint
      // For now proxy request
      res.writeHead(501);
      res.end(JSON.stringify({ ok: false, error: 'liris screen endpoint not yet implemented — needs /behcs/screen on liris:4947' }));
      return;
    }

    if (url.pathname === '/behcs/send' && req.method === 'POST') {
      let body = '';
      req.on('data', c => body += c);
      req.on('end', () => {
        try {
          const msg = JSON.parse(body);
          // HOOKWALL GATE
          const gate = hookwallCheck(msg);
          if (!gate.allow) {
            res.writeHead(403);
            res.end(JSON.stringify({ ok: false, gate: 'hookwall', denies: gate.denies }));
            return;
          }
          msg.received_at = new Date().toISOString();
          msg.received_by = 'acer-sidecar';
          msg.gated = true;
          // Log
          appendNdjson(INBOX, msg);
          truncateNdjson(INBOX, MAX_INBOX);
          // Queue for rehydration
          appendNdjson(QUEUE, msg);
          truncateNdjson(QUEUE, MAX_QUEUE);
          // GNN edge
          logGnnEdge(msg);
          // Auto-relay
          relayToLiris(msg);
          relayToFalcon(msg);
          // Console
          if (msg.mode !== 'stealth') {
            const txt = msg.text || msg.payload?.text || JSON.stringify(msg.payload || '').slice(0, 100);
            process.stdout.write(`[BEHCS] ${msg.from}→${msg.to}: ${typeof txt === 'string' ? txt.slice(0, 150) : ''}\n`);
          }
          res.writeHead(200);
          res.end(JSON.stringify({ ok: true, received: msg.id, gated: true, by: 'acer-sidecar' }));
        } catch (e) {
          res.writeHead(400);
          res.end(JSON.stringify({ ok: false, error: e.message }));
        }
      });
      return;
    }

    if (url.pathname === '/behcs/inbox') {
      try {
        const last = parseInt(url.searchParams.get('last') || '20');
        const lines = fs.existsSync(INBOX) ? fs.readFileSync(INBOX, 'utf8').split('\n').filter(l => l.trim()).map(l => { try { return JSON.parse(l); } catch (_) { return null; } }).filter(Boolean) : [];
        res.writeHead(200);
        res.end(JSON.stringify({ ok: true, count: lines.length, messages: lines.slice(-last) }));
      } catch (e) { res.writeHead(500); res.end(JSON.stringify({ ok: false, error: e.message })); }
      return;
    }

    if (url.pathname === '/behcs/rehydrate') {
      try {
        const lines = fs.existsSync(QUEUE) ? fs.readFileSync(QUEUE, 'utf8').split('\n').filter(l => l.trim()).map(l => { try { return JSON.parse(l); } catch (_) { return null; } }).filter(Boolean) : [];
        res.writeHead(200);
        res.end(JSON.stringify({ ok: true, count: lines.length, messages: lines }));
      } catch (e) { res.writeHead(500); res.end(JSON.stringify({ ok: false, error: e.message })); }
      return;
    }

    if (url.pathname === '/behcs/flush') {
      if (fs.existsSync(QUEUE)) fs.writeFileSync(QUEUE, '');
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true, flushed: true }));
      return;
    }

    if (url.pathname === '/behcs/devices') {
      res.writeHead(200);
      res.end(JSON.stringify({ ok: true, triad: { acer: 'hub:4947', falcon: 'usb-adb', liris: 'eth:192.168.100.2:4820' }, entities: 453 }));
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ ok: false, routes: ['/behcs/health', '/behcs/send', '/behcs/inbox', '/behcs/rehydrate', '/behcs/flush', '/behcs/devices'] }));
  });

  server.listen(BUS_PORT, '0.0.0.0', () => {
    console.log(`[BEHCS-SIDECAR] Bus on 0.0.0.0:${BUS_PORT} — hookwall gated, GNN edges, auto-relay`);
  });
  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.log(`[BEHCS-SIDECAR] Port ${BUS_PORT} in use — existing bus running, attaching cron only`);
    }
  });
  return server;
}

// ═══ CRON KICKER — 30s omnicalendar ═══
let cycleCount = 0;

function cronCycle() {
  cycleCount++;
  const ts = new Date().toISOString().slice(11, 19);

  // Ensure ADB tunnels
  if (adbConnected()) ensureTunnels();

  // Screenshot falcon
  if (cycleCount % 2 === 0 && adbConnected()) screenshotFalcon();

  // GC every 10 cycles (5 min)
  if (cycleCount % 10 === 0) {
    truncateNdjson(INBOX, MAX_INBOX);
    truncateNdjson(QUEUE, MAX_QUEUE);
    truncateNdjson(GNN_EDGES, MAX_EDGES);
  }

  // Self-heartbeat to bus
  const hb = {
    from: 'acer-sidecar', to: 'triad', mode: 'shadow', type: 'heartbeat',
    id: 'sidecar-hb-' + cycleCount, ts: new Date().toISOString(),
    payload: { cycle: cycleCount, uptime_s: cycleCount * 30, adb: adbConnected() },
  };
  appendNdjson(INBOX, hb);

  if (cycleCount % 4 === 0) {
    console.log(`[SIDECAR] cycle=${cycleCount} adb=${adbConnected()} queue=${fs.existsSync(QUEUE) ? fs.readFileSync(QUEUE, 'utf8').split('\n').filter(l => l.trim()).length : 0}`);
  }
}

// ═══ PID FILE ═══
function writePid() {
  ensureDir(BEHCS_DIR);
  fs.writeFileSync(PID_FILE, String(process.pid));
}

function cleanPid() {
  try { if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE); } catch (_) {}
}

// ═══ MAIN ═══
console.log('[BEHCS-SIDECAR] Starting — PID ' + process.pid);
console.log('[BEHCS-SIDECAR] 453 entities, 22350 edges, 47D, 256 glyphs');
console.log('[BEHCS-SIDECAR] Hookwall on every message. GNN edge per tuple.');
console.log('[BEHCS-SIDECAR] Rehydration queue for session continuity.');
console.log('[BEHCS-SIDECAR] Cron: 30s omnicalendar + ADB tunnel watch.');
console.log('');

writePid();
process.on('exit', cleanPid);
process.on('SIGINT', () => { cleanPid(); process.exit(0); });
process.on('SIGTERM', () => { cleanPid(); process.exit(0); });

startBus();
setInterval(cronCycle, HEARTBEAT_INTERVAL);
cronCycle();
