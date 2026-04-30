#!/usr/bin/env node
// chain-mirror-bus-emit.mjs — liris cosign-chain → acer mirror via signed bus envelopes.
// Acer's W7-14 SMB approach blocked (share excludes liris memory dir). This tool
// dispatches each new chain entry as an EVT-CHAIN-MIRROR-ENTRY envelope to acer's
// bus. Acer subscribes via verb filter and appends in seq order to its mirror chain.
//
// Constraints honored: node:fs/http/crypto + bus-sign.mjs only. ≤180 lines.
// Read-only against liris chain. Cursor at data/behcs/state/chain-mirror-bus-cursor.json.
// Throttle: max 5 entries/tick (acer W7-3). Envelope itself signed dev-liris-4c19e180;
// chain entry's own entry_sig retained inside payload.
//
// CLI:
//   node chain-mirror-bus-emit.mjs --once
//   node chain-mirror-bus-emit.mjs --watch --interval-s 60
//
// named_agent: liris-cascade-W8-1-chain-mirror-via-bus-envelopes

import fs from "node:fs";
import http from "node:http";
import crypto from "node:crypto";
import { buildSignedEnvelope, LIRIS_KEY_ID } from "./bus-sign.mjs";

const CHAIN_PATH = "C:/Users/rayss/.claude/projects/C--/memory/COSIGN_CHAIN.ndjson";
const CURSOR_PATH = "C:/Users/rayss/Asolaria/data/behcs/state/chain-mirror-bus-cursor.json";
const ACER_BUS_URL = "http://192.168.100.1:4947/behcs/send";
const FROM = "liris";
const TO = "acer";
const VERB = "EVT-CHAIN-MIRROR-ENTRY";
const MAX_PER_TICK = 5;
const NAMED_AGENT = "liris-cascade-W8-1-chain-mirror-via-bus-envelopes";

function readChain() {
  const raw = fs.readFileSync(CHAIN_PATH, "utf-8");
  const out = [];
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try { out.push(JSON.parse(line)); } catch (_) { /* skip malformed */ }
  }
  return out;
}

function entryIdentity(entry, lineIdx) {
  // Modern entries: numeric seq. Legacy COSIGN-MERGED-* have audit_id but no seq.
  // Use seq when present; otherwise synthesize a stable surrogate from lineIdx
  // (lineIdx is 0-based file position, persistent across runs).
  if (typeof entry.seq === "number") return { seq: entry.seq, surrogate: false };
  return { seq: -(lineIdx + 1), surrogate: true, audit_id: entry.audit_id || null };
}

function loadCursor() {
  if (!fs.existsSync(CURSOR_PATH)) {
    return { last_emitted_seq: -1e9, last_emitted_audit_id: null, emitted_envelope_ids: [], updated_at: null };
  }
  try { return JSON.parse(fs.readFileSync(CURSOR_PATH, "utf-8")); }
  catch (_) { return { last_emitted_seq: -1e9, last_emitted_audit_id: null, emitted_envelope_ids: [], updated_at: null }; }
}

function saveCursor(cur) {
  cur.updated_at = new Date().toISOString();
  if (cur.emitted_envelope_ids && cur.emitted_envelope_ids.length > 50) {
    cur.emitted_envelope_ids = cur.emitted_envelope_ids.slice(-50);
  }
  fs.mkdirSync(CURSOR_PATH.replace(/\/[^/]+$/, ""), { recursive: true });
  fs.writeFileSync(CURSOR_PATH, JSON.stringify(cur, null, 2));
}

function buildPayload(entry, ident) {
  const ts = new Date().toISOString();
  const has_entry_sig = !!(entry.entry_sig && entry.entry_sig.sig_b64);
  return {
    verb: VERB,
    named_agent: NAMED_AGENT,
    from: FROM,
    to: TO,
    ts,
    chain_source: "liris",
    chain_seq: ident.seq,
    chain_seq_is_surrogate: ident.surrogate === true,
    legacy_unsigned: !has_entry_sig,
    legacy_audit_id: ident.audit_id || entry.audit_id || null,
    chain_entry: entry,
    rationale: "W7-14 SMB scope excludes liris memory dir; mirror via bus envelopes per acer W7-14 approach 2",
  };
}

function postEnvelope(envelopeBody) {
  const data = JSON.stringify(envelopeBody);
  const url = new URL(ACER_BUS_URL);
  return new Promise((resolve) => {
    const req = http.request({
      host: url.hostname, port: url.port, path: url.pathname, method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) },
      timeout: 15000,
    }, (res) => {
      let body = ""; res.on("data", (c) => body += c);
      res.on("end", () => {
        let parsed; try { parsed = JSON.parse(body); } catch { parsed = body; }
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, body: parsed });
      });
    });
    req.on("error", (e) => resolve({ ok: false, error: e.message }));
    req.on("timeout", () => { req.destroy(); resolve({ ok: false, error: "timeout" }); });
    req.write(data); req.end();
  });
}

async function emitOne(entry, ident) {
  const payload = buildPayload(entry, ident);
  const signed = buildSignedEnvelope(payload, LIRIS_KEY_ID);
  const env = {
    id: crypto.randomBytes(16).toString("hex"),
    ts: payload.ts,
    from: FROM,
    to: TO,
    mode: "real",
    type: "message",
    verb: VERB,
    payload,                    // top-level for verb-filter subscribers
    body: { signed_envelope: signed.signed_envelope }, // bus-verify finds it here
  };
  env.hash = crypto.createHash("sha256")
    .update(JSON.stringify({ from: env.from, to: env.to, ts: env.ts, verb: env.verb, chain_seq: payload.chain_seq }))
    .digest("hex").slice(0, 16);
  const result = await postEnvelope(env);
  return { envelope_id: env.id, envelope_hash: env.hash, chain_seq: payload.chain_seq, legacy_unsigned: payload.legacy_unsigned, ...result };
}

async function tick() {
  const chain = readChain();
  const cursor = loadCursor();
  const pending = [];
  for (let i = 0; i < chain.length; i++) {
    const ident = entryIdentity(chain[i], i);
    if (ident.seq > cursor.last_emitted_seq) pending.push({ entry: chain[i], ident });
  }
  pending.sort((a, b) => a.ident.seq - b.ident.seq);
  const batch = pending.slice(0, MAX_PER_TICK);
  const results = [];
  for (const { entry, ident } of batch) {
    const r = await emitOne(entry, ident);
    results.push(r);
    if (r.ok) {
      cursor.last_emitted_seq = ident.seq;
      cursor.last_emitted_audit_id = entry.audit_id || cursor.last_emitted_audit_id;
      cursor.emitted_envelope_ids = (cursor.emitted_envelope_ids || []).concat([r.envelope_id]);
      saveCursor(cursor);
    } else {
      break; // stop on first failure; retry next tick from same cursor
    }
  }
  return { tick_at: new Date().toISOString(), pending_total: pending.length, emitted: results.length, results, cursor };
}

const argv = process.argv.slice(2);
const watch = argv.includes("--watch");
const once = argv.includes("--once") || (!watch);
const intervalIdx = argv.indexOf("--interval-s");
const intervalS = intervalIdx >= 0 ? Math.max(5, parseInt(argv[intervalIdx + 1], 10) || 60) : 60;

if (watch) {
  console.log(JSON.stringify({ mode: "watch", interval_s: intervalS, named_agent: NAMED_AGENT }));
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const r = await tick();
    console.log(JSON.stringify({ tick_summary: { emitted: r.emitted, pending_total: r.pending_total, last_emitted_seq: r.cursor.last_emitted_seq } }));
    await new Promise((res) => setTimeout(res, intervalS * 1000));
  }
} else if (once) {
  const r = await tick();
  console.log(JSON.stringify(r, null, 2));
}
