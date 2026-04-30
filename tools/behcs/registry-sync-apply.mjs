#!/usr/bin/env node
// registry-sync-apply.mjs — liris mirror applier for acer REGISTRY_MIRROR envelopes.
// named_agent: liris-cascade-W5-4-M4-registry-sync-apply
// STRICT ADDITIVE: APPEND new keys only. NEVER modify, NEVER remove. NEVER WIPE.
// Reject any envelope whose verdict !== VERIFIED || owner !== DEV-ACER.
// node:fs + node:http + node:crypto only.

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { verifyEnvelopeSig, loadRegistry, DEFAULT_REGISTRY_PATH } from "./bus-verify.mjs";

const HUB_HOST = "192.168.100.1";
const HUB_PORT = 4947;
const HUB_PATH = "/behcs/inbox";
const TARGET = "liris";
const TYPE = "REGISTRY_MIRROR";
const NAMED_AGENT = "liris-cascade-W5-4-M4-registry-sync-apply";
const POLL_MS = 5 * 60 * 1000;
const FETCH_LAST = 20;

const ROOT = "C:/Users/rayss/Asolaria";
const STATE_DIR = path.join(ROOT, "data", "behcs", "state");
const LEDGER = path.join(STATE_DIR, "registry-sync-applied.ndjson");
const SEEN_STATE = path.join(STATE_DIR, "registry-sync-seen.json");
const LOG_FILE = path.join(ROOT, "logs", "registry-sync-apply.log");
const REGISTRY_PATH = DEFAULT_REGISTRY_PATH;

const args = process.argv.slice(2);
const ONCE = args.includes("--once");
const WATCH = args.includes("--watch");
const DRY = args.includes("--dry-run");
const LIST = args.includes("--list-pending");

function ensureDirs() {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
}
function log(level, msg, extra) {
  const line = `[${new Date().toISOString()}] [${level}] [${NAMED_AGENT}] ${msg}` +
    (extra ? " " + JSON.stringify(extra) : "");
  try { fs.appendFileSync(LOG_FILE, line + "\n"); } catch (_) {}
  console.log(line);
}
function loadSeen() {
  try { return JSON.parse(fs.readFileSync(SEEN_STATE, "utf8")); } catch { return { lastSeenTs: null, ids: [] }; }
}
function saveSeen(s) {
  const tmp = SEEN_STATE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(s, null, 2));
  fs.renameSync(tmp, SEEN_STATE);
}
function pollInbox(sinceTs) {
  return new Promise((resolve) => {
    // hub honors target/since/last; type filter ignored server-side → filter client-side.
    const p = new URLSearchParams({ target: TARGET, last: String(FETCH_LAST) });
    if (sinceTs) p.set("since", sinceTs);
    const req = http.request({
      host: HUB_HOST, port: HUB_PORT, path: `${HUB_PATH}?${p.toString()}`,
      method: "GET", timeout: 15000,
    }, (res) => {
      let body = "";
      res.on("data", (c) => body += c);
      res.on("end", () => {
        try {
          const j = JSON.parse(body);
          const arr = Array.isArray(j) ? j : (j.messages || j.items || j.envelopes || j.inbox || []);
          const filtered = arr.filter((e) => e && e.type === TYPE);
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, items: filtered, raw_count: arr.length });
        } catch (e) { resolve({ ok: false, status: res.statusCode, items: [], parseError: e.message }); }
      });
    });
    req.on("error", (e) => resolve({ ok: false, error: e.message, items: [] }));
    req.on("timeout", () => { req.destroy(); resolve({ ok: false, error: "timeout", items: [] }); });
    req.end();
  });
}
function readRegistry() {
  return loadRegistry(REGISTRY_PATH);
}
function writeRegistryAtomic(reg) {
  const tmp = REGISTRY_PATH + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(reg, null, 2));
  fs.renameSync(tmp, REGISTRY_PATH);
}
function classifyKey(incoming, current) {
  const existing = (current.keys || []).find((k) => k.key_id === incoming.key_id);
  if (!existing) return { kind: "NEW" };
  const same = existing.public_key_b64 === incoming.public_key_b64
    && existing.owner_glyph === incoming.owner_glyph
    && existing.binding_class === incoming.binding_class;
  return same ? { kind: "IDEMPOTENT" } : { kind: "CONFLICT", existing };
}
function appendLedger(rec) {
  fs.appendFileSync(LEDGER, JSON.stringify(rec) + "\n");
}

async function applyOnce() {
  ensureDirs();
  const seen = loadSeen();
  const r = await pollInbox(seen.lastSeenTs);
  if (!r.ok) { log("WARN", "poll-failed", { error: r.error || r.status }); return { polled: 0, applied: 0 }; }
  const fresh = (r.items || []).filter((e) => !seen.ids.includes(e.id));
  log("INFO", "poll-ok", { raw: r.raw_count, mirror: r.items.length, fresh: fresh.length });
  if (LIST) {
    for (const e of fresh) console.log(JSON.stringify({ id: e.id, ts: e.ts, from: e.from, type: e.type }));
    return { polled: fresh.length, applied: 0 };
  }
  let applied = 0;
  for (const env of fresh) {
    const v = verifyEnvelopeSig(env);
    if (v.verdict !== "VERIFIED" || v.owner !== "DEV-ACER") {
      log("REJECT", "non-acer-verified-mirror", { id: env.id, verdict: v.verdict, reason: v.reason, owner: v.owner });
      appendLedger({ ts: new Date().toISOString(), envelope_id: env.id, rejected: true, verdict: v.verdict, reason: v.reason });
      seen.ids.push(env.id);
      continue;
    }
    const signed = env.body?.signed_envelope || env.signed_envelope || env;
    const incomingKeys = signed.payload?.keys || [];
    const reg = readRegistry();
    const summary = { envelope_id: env.id, ts: new Date().toISOString(), new: 0, idempotent: 0, conflicts: 0, applied: false, dry_run: !!DRY };
    const toAppend = [];
    for (const k of incomingKeys) {
      const c = classifyKey(k, reg);
      if (c.kind === "NEW") { summary.new++; toAppend.push(k); }
      else if (c.kind === "IDEMPOTENT") { summary.idempotent++; }
      else { summary.conflicts++; log("CONFLICT", "key-mismatch", { envelope_id: env.id, key_id: k.key_id }); }
    }
    if (toAppend.length > 0 && !DRY) {
      reg.keys = [...(reg.keys || []), ...toAppend];
      reg.updated_at = new Date().toISOString();
      writeRegistryAtomic(reg);
      summary.applied = true;
      applied++;
    }
    log("APPLY", "envelope-summary", summary);
    appendLedger(summary);
    seen.ids.push(env.id);
    if (!seen.lastSeenTs || env.ts > seen.lastSeenTs) seen.lastSeenTs = env.ts;
  }
  if (seen.ids.length > 1000) seen.ids = seen.ids.slice(-1000);
  saveSeen(seen);
  return { polled: fresh.length, applied };
}

async function main() {
  ensureDirs();
  if (LIST || ONCE || (!WATCH && !ONCE && !LIST)) {
    const r = await applyOnce();
    console.log(JSON.stringify({ named_agent: NAMED_AGENT, mode: LIST ? "list" : "once", ...r }, null, 2));
    return;
  }
  log("INFO", "watch-mode-start", { interval_ms: POLL_MS });
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try { await applyOnce(); } catch (e) { log("ERROR", "apply-threw", { error: e.message }); }
    await new Promise((res) => setTimeout(res, POLL_MS));
  }
}
main().catch((e) => { log("FATAL", e.message); process.exit(1); });
