#!/usr/bin/env node
// liris-bus-mirror-minimal.mjs
// Minimal bus-receiver for liris so acer→liris dispatches stop failing with
// "fetch failed". This is NOT a full behcs-bus.js port; it accepts envelopes
// only. Crypto stays acer-side until WO-L-SIGN-MIRROR ships.
//
// Authored: acer-side (C:\Users\acer\Asolaria\tools\behcs\liris-bus-mirror-minimal.mjs)
//
// Deployment on liris:
//   1. cp this file to C:\Users\rayss\Asolaria\tools\behcs\
//   2. Ensure data/behcs/inbox.ndjson exists (create if missing)
//   3. node tools/behcs/liris-bus-mirror-minimal.mjs
//   4. Update acer's device-registry.json: liris.endpoints = [http://192.168.100.2:4947]
//
// Endpoints:
//   POST /behcs/send    — append envelope to inbox.ndjson with received stamps
//   GET  /behcs/health  — {ok, service, since}
//   GET  /behcs/inbox   — last N inbox lines, filters: limit, target, verb

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ROOT = parent of tools/behcs/ (i.e. <user>/Asolaria/)
const ROOT       = path.resolve(__dirname, '..', '..');
const BEHCS_DIR  = path.join(ROOT, 'data', 'behcs');
const INBOX      = path.join(BEHCS_DIR, 'inbox.ndjson');

const PORT       = parseInt(process.env.BEHCS_PORT || '4947', 10);
const DEVICE_ID  = process.env.BEHCS_DEVICE_ID || 'liris';
const STARTUP_TS = new Date().toISOString();

// Ensure inbox file & dir exist (idempotent).
function ensureInbox() {
  try {
    if (!fs.existsSync(BEHCS_DIR)) fs.mkdirSync(BEHCS_DIR, { recursive: true });
    if (!fs.existsSync(INBOX)) fs.writeFileSync(INBOX, '', 'utf8');
  } catch (e) {
    console.error('[liris-bus-mirror-minimal] ensureInbox failed:', e.message);
  }
}
ensureInbox();

function appendInbox(envelope) {
  const stamped = {
    ...envelope,
    received_at: new Date().toISOString(),
    received_by: DEVICE_ID,
  };
  fs.appendFileSync(INBOX, JSON.stringify(stamped) + '\n', 'utf8');
  return stamped;
}

function readInbox() {
  if (!fs.existsSync(INBOX)) return [];
  const raw = fs.readFileSync(INBOX, 'utf8').split('\n').filter(l => l.trim());
  const msgs = [];
  for (const l of raw) {
    try { msgs.push(JSON.parse(l)); } catch (_) { /* skip malformed */ }
  }
  return msgs;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  res.setHeader('Content-Type', 'application/json');

  // ---- HEALTH -------------------------------------------------------------
  if (req.method === 'GET' && url.pathname === '/behcs/health') {
    res.writeHead(200);
    res.end(JSON.stringify({
      ok: true,
      service: 'liris-bus-mirror-minimal',
      device: DEVICE_ID,
      since: STARTUP_TS,
      port: PORT,
    }));
    return;
  }

  // ---- SEND (append) ------------------------------------------------------
  if (req.method === 'POST' && url.pathname === '/behcs/send') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const envelope = JSON.parse(body || '{}');
        const stamped  = appendInbox(envelope);
        res.writeHead(200);
        res.end(JSON.stringify({
          ok: true,
          received_at: stamped.received_at,
          received_by: stamped.received_by,
          verb: stamped.verb || null,
          target: stamped.target || stamped.to || null,
        }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ ok: false, error: 'bad_json', detail: e.message }));
      }
    });
    req.on('error', e => {
      res.writeHead(500);
      res.end(JSON.stringify({ ok: false, error: 'req_error', detail: e.message }));
    });
    return;
  }

  // ---- INBOX (tail + filters) --------------------------------------------
  if (req.method === 'GET' && url.pathname === '/behcs/inbox') {
    try {
      const limit  = Math.min(Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10) || 50), 5000);
      const target = url.searchParams.get('target');
      const verb   = url.searchParams.get('verb');

      let msgs = readInbox();
      if (target) msgs = msgs.filter(m => m.target === target || m.to === target);
      if (verb)   msgs = msgs.filter(m => m.verb   === verb);
      const tail = msgs.slice(-limit);

      res.writeHead(200);
      res.end(JSON.stringify({
        ok: true,
        count: msgs.length,
        returned: tail.length,
        filters_applied: { limit, target, verb },
        messages: tail,
      }));
    } catch (e) {
      res.writeHead(500);
      res.end(JSON.stringify({ ok: false, error: e.message }));
    }
    return;
  }

  // ---- 404 ----------------------------------------------------------------
  res.writeHead(404);
  res.end(JSON.stringify({ ok: false, error: 'not_found', path: url.pathname }));
});

server.listen(PORT, () => {
  console.log(`[liris-bus-mirror-minimal] listening on :${PORT} device=${DEVICE_ID} since=${STARTUP_TS}`);
  console.log(`[liris-bus-mirror-minimal] inbox=${INBOX}`);
});
