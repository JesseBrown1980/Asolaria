#!/usr/bin/env node
// Reconcile liris outbox dispatches against acer hub EVT-CANON-LOADED-ACK landings.
// Pairs each dispatched envelope id with the matching ack via
// payload.canon_envelope_id; reports unacked envelopes with age.
//
// Usage:
//   node tools/behcs/reconcile-canon-acks.mjs
//   node tools/behcs/reconcile-canon-acks.mjs --last 500
//
// Outbox is an append-log; multiple rows per id (pre-call + post-response) are
// expected. We collapse to the latest row per id.

import fs from "node:fs";
import http from "node:http";

const OUTBOX_PATH = "C:/Users/rayss/Asolaria/data/behcs/outbox.ndjson";
const HUB = "http://192.168.100.1:4947/behcs/inbox";
const TARGET = "liris";
const VERB = "EVT-CANON-LOADED-ACK";

const args = process.argv.slice(2);
const last = (() => {
  const i = args.indexOf("--last");
  return i >= 0 ? parseInt(args[i + 1], 10) : 200;
})();

function readOutbox() {
  if (!fs.existsSync(OUTBOX_PATH)) {
    console.log(`[reconcile] outbox not found at ${OUTBOX_PATH} — nothing to reconcile`);
    return new Map();
  }
  const lines = fs.readFileSync(OUTBOX_PATH, "utf-8").split(/\r?\n/).filter(Boolean);
  const byId = new Map();
  for (const line of lines) {
    let row; try { row = JSON.parse(line); } catch { continue; }
    if (!row || !row.id) continue;
    // Latest row wins (post-response overwrites pre-call).
    byId.set(row.id, row);
  }
  return byId;
}

function fetchAcks() {
  return new Promise((resolve) => {
    const url = new URL(HUB);
    url.searchParams.set("target", TARGET);
    url.searchParams.set("verb", VERB);
    url.searchParams.set("last", String(last));
    const req = http.get(url, { timeout: 10000 }, (res) => {
      let body = "";
      res.on("data", (c) => body += c);
      res.on("end", () => {
        try { resolve(JSON.parse(body)); } catch { resolve({ ok: false, error: "unparseable", raw: body.slice(0, 200) }); }
      });
    });
    req.on("error", (e) => resolve({ ok: false, error: e.message }));
    req.on("timeout", () => { req.destroy(); resolve({ ok: false, error: "timeout" }); });
  });
}

function ageSeconds(iso) {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return null;
  return Math.round((Date.now() - t) / 1000);
}

const outbox = readOutbox();
const ackRes = await fetchAcks();
if (!ackRes.ok) {
  console.log(`[reconcile] hub fetch FAIL: ${ackRes.error}`);
  process.exit(2);
}

const ackedIds = new Set();
for (const ack of (ackRes.messages ?? [])) {
  const cid = ack.payload?.canon_envelope_id;
  if (cid) ackedIds.add(cid);
}

let acked = 0, unacked = 0;
const unackedRows = [];
for (const [id, row] of outbox.entries()) {
  if (ackedIds.has(id)) acked++;
  else { unacked++; unackedRows.push(row); }
}

console.log(`[reconcile] dispatched=${outbox.size} acked=${acked} unacked=${unacked} hub_acks_seen=${ackedIds.size}`);
if (unackedRows.length) {
  console.log(`[reconcile] unacked envelopes:`);
  for (const r of unackedRows) {
    const age = ageSeconds(r.dispatched_at ?? r.ts);
    console.log(`  id=${r.id} canon=${r.canon_version} age_s=${age} status=${r.response_status} err=${r.response_error ?? ""}`);
  }
}
