#!/usr/bin/env node
// orbital-relay.mjs — acer-as-bridge between Falcon (USB) and Liris (ethernet)
//
// Scans acer BEHCS inbox for envelopes whose target is NOT acer and forwards:
//   target="liris"  → POST http://192.168.100.2:4947/behcs/send     (direct LAN)
//   target="falcon" → POST http://127.0.0.1:15947/behcs/send        (via adb forward to falcon:4947)
//
// Keeps a ledger at data/behcs/orbital-relay-forwarded.ndjson to avoid double-sends.
// Runs in a loop (every RELAY_INTERVAL_MS). Idempotent; safe to restart.

import { readFileSync, existsSync, appendFileSync, mkdirSync, statSync } from "node:fs";
import { dirname } from "node:path";
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";

// G-090 staleness surface (canonized liris seq=66 a5638df)
const PROCESS_STARTED_AT = new Date().toISOString();
let SOURCE_COMMIT = "unknown";
try { SOURCE_COMMIT = execSync("git -C C:/asolaria-acer rev-parse HEAD", { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim().slice(0, 12); } catch {}

const INBOX = "C:/Users/acer/Asolaria/data/behcs/inbox.ndjson";
const LEDGER = "C:/Users/acer/Asolaria/data/behcs/orbital-relay-forwarded.ndjson";
const LIRIS_URL = "http://192.168.100.2:4947/behcs/send";
const FALCON_URL = "http://127.0.0.1:15947/behcs/send";  // via adb forward
const INTERVAL = parseInt(process.env.RELAY_INTERVAL_MS || "3000", 10);

mkdirSync(dirname(LEDGER), { recursive: true });

function loadForwardedIds() {
  const set = new Set();
  if (!existsSync(LEDGER)) return set;
  for (const line of readFileSync(LEDGER, "utf8").split("\n").filter(Boolean)) {
    try {
      const e = JSON.parse(line);
      if (e.envelope_hash) set.add(e.envelope_hash);
    } catch {}
  }
  return set;
}

function envelopeHash(msg) {
  // Identity = hash of actor+verb+received_at+glyph_sentence (stable across re-serializations)
  const key = [msg.actor, msg.verb, msg.received_at, msg.glyph_sentence, JSON.stringify(msg.body || "")].join("||");
  return createHash("sha256").update(key).digest("hex").slice(0, 16);
}

function logForward(record) {
  appendFileSync(LEDGER, JSON.stringify({ ts: new Date().toISOString(), ...record }) + "\n");
}

async function httpPost(url, body) {
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body, signal: AbortSignal.timeout(8000) });
    const text = await res.text();
    return { ok: res.ok, status: res.status, body: text };
  } catch (e) {
    return { ok: false, status: 0, body: `fetch_err: ${e.message}` };
  }
}

async function sweep() {
  if (!existsSync(INBOX)) return;
  const lines = readFileSync(INBOX, "utf8").split("\n").filter(Boolean);
  const forwarded = loadForwardedIds();
  let liris_count = 0, falcon_count = 0, skipped = 0, errors = 0;

  for (const line of lines) {
    let msg;
    try { msg = JSON.parse(line); } catch { continue; }
    const target = msg.target || (msg.to || "");
    if (target !== "liris" && target !== "falcon") continue;

    // Skip if acer is the target-designated source of this envelope (actor==liris or falcon means WE are the destination — in which case target is just forward-intent)
    // The bridge logic: if target matches a remote peer, forward it.
    const id = envelopeHash(msg);
    if (forwarded.has(id)) { skipped++; continue; }

    // Strip our own side-car fields before forwarding (received_at, received_by, _sig_check)
    const clean = { ...msg };
    delete clean.received_at;
    delete clean.received_by;
    delete clean._sig_check;
    const body = JSON.stringify(clean);

    let url, peer;
    if (target === "liris") { url = LIRIS_URL; peer = "liris"; }
    else                     { url = FALCON_URL; peer = "falcon"; }

    const r = await httpPost(url, body);
    if (r.ok) {
      forwarded.add(id);
      if (peer === "liris") liris_count++; else falcon_count++;
      logForward({ envelope_hash: id, peer, verb: msg.verb, actor: msg.actor, glyph_sentence: msg.glyph_sentence?.slice(0, 200), http_status: r.status, resp_prefix: r.body.slice(0, 200) });
    } else {
      errors++;
      logForward({ envelope_hash: id, peer, verb: msg.verb, actor: msg.actor, forward_error: r.body.slice(0, 300), http_status: r.status });
    }
  }
  if (liris_count || falcon_count || errors) {
    console.log(`[orbital-relay ${new Date().toISOString()}] liris=${liris_count} falcon=${falcon_count} skipped=${skipped} errors=${errors} ledger=${forwarded.size}`);
  }
}

console.log("orbital-relay starting");
console.log("  process_started_at:", PROCESS_STARTED_AT);
console.log("  source_commit:", SOURCE_COMMIT);
console.log("  INBOX=" + INBOX);
console.log("  liris → " + LIRIS_URL);
console.log("  falcon → " + FALCON_URL);
console.log("  interval=" + INTERVAL + "ms");
console.log("  ledger=" + LEDGER);
console.log("META-ACER-ORBITAL-RELAY-STARTED · commit=" + SOURCE_COMMIT + " · started=" + PROCESS_STARTED_AT + " · liris-via-ethernet · falcon-via-adb-forward-15947 @ M-EYEWITNESS .");

// Initial drain
await sweep();
// Loop
setInterval(sweep, INTERVAL);
