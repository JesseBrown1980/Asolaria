#!/usr/bin/env node
// canon-ack-watcher-service.mjs
// Long-running watcher: polls acer hub for EVT-CANON-LOADED-ACK envelopes
// targeted to liris and side-effects them (state file + log line).
//
// named_agent: liris-canon-ack-watcher
// Constraints honored:
//   - feedback_fetch_timeout_floor_5s_15s.md (5s connect / 15s read floor)
//   - feedback_orbital_routing_liris_to_falcon.md (mailbox client of acer:4947)
//   - LAW-001 (4947 always open)
// node:fs + node:http only. No deps.

import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const HUB_HOST = "192.168.100.1";
const HUB_PORT = 4947;
const HUB_PATH = "/behcs/inbox";
const TARGET = "liris";
const VERB = "EVT-CANON-LOADED-ACK";
const NAMED_AGENT = "liris-canon-ack-watcher";

const ROOT = "C:/Users/rayss/Asolaria";
const STATE_DIR = path.join(ROOT, "data", "behcs", "state");
const STATE_FILE = path.join(STATE_DIR, "canon-ack-seen.json");
const LOG_DIR = path.join(ROOT, "logs");
const LOG_FILE = path.join(LOG_DIR, "canon-ack-watcher.log");

const POLL_INTERVAL_MS = 10_000;
const MAX_SEEN = 500;
const FETCH_LAST = 50;
const MAX_CONSECUTIVE_FAILS = 5;

function ensureDirs() {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function loadSeen() {
  try {
    const raw = fs.readFileSync(STATE_FILE, "utf8");
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr;
  } catch (_) { /* first run */ }
  return [];
}

function saveSeen(seen) {
  const tmp = STATE_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(seen, null, 2));
  fs.renameSync(tmp, STATE_FILE);
}

function appendLog(line) {
  fs.appendFileSync(LOG_FILE, line + "\n");
}

function logEvent(level, msg) {
  const line = `[${new Date().toISOString()}] [${level}] [${NAMED_AGENT}] ${msg}`;
  appendLog(line);
  console.log(line);
}

function pollOnce(sinceTs) {
  return new Promise((resolve) => {
    const params = new URLSearchParams({
      target: TARGET,
      verb: VERB,
      last: String(FETCH_LAST),
    });
    if (sinceTs) params.set("since", sinceTs);

    const req = http.request(
      {
        host: HUB_HOST,
        port: HUB_PORT,
        path: `${HUB_PATH}?${params.toString()}`,
        method: "GET",
        timeout: 15_000, // read timeout floor
      },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => {
          try {
            resolve({ ok: true, data: JSON.parse(body) });
          } catch (e) {
            resolve({ ok: false, error: `parse_error: ${e.message}` });
          }
        });
      }
    );
    // 5s connect floor
    req.setTimeout(15_000, () => {
      req.destroy();
      resolve({ ok: false, error: "timeout" });
    });
    req.on("error", (e) => resolve({ ok: false, error: e.message }));
    req.end();
  });
}

let seen = [];
let seenIds = new Set();
let lastSeenTs = null;
let consecutiveFails = 0;
let stopping = false;

function recordAck(ack) {
  if (seenIds.has(ack.id)) return false;
  const p = ack.payload ?? {};
  const entry = {
    id: ack.id,
    ts: ack.ts,
    session_id: p.session_id ?? null,
    canon_envelope_id: p.canon_envelope_id ?? null,
    payload_sha256_8: p.payload_sha256_8 ?? null,
  };
  seen.push(entry);
  seenIds.add(ack.id);
  // cap at MAX_SEEN, drop oldest
  if (seen.length > MAX_SEEN) {
    const drop = seen.length - MAX_SEEN;
    const removed = seen.splice(0, drop);
    for (const r of removed) seenIds.delete(r.id);
  }
  const canon8 = (entry.canon_envelope_id ?? "").slice(0, 16);
  appendLog(
    `[${new Date().toISOString()}] new_ack session=${entry.session_id} canon=${canon8} sha8=${entry.payload_sha256_8} agent=${NAMED_AGENT}`
  );
  return true;
}

async function tick() {
  if (stopping) return;
  const result = await pollOnce(lastSeenTs);
  if (!result.ok) {
    consecutiveFails++;
    logEvent("warn", `poll_fail (${consecutiveFails}/${MAX_CONSECUTIVE_FAILS}): ${result.error}`);
    if (consecutiveFails >= MAX_CONSECUTIVE_FAILS) {
      process.stderr.write(
        `[${NAMED_AGENT}] FATAL: ${MAX_CONSECUTIVE_FAILS} consecutive poll failures — last error: ${result.error}\n` +
          `Hub: http://${HUB_HOST}:${HUB_PORT}${HUB_PATH}\n` +
          `Operator: check acer hub liveness, network path liris->192.168.100.1, or restart this watcher.\n`
      );
      saveSeen(seen);
      process.exit(2);
    }
    return;
  }
  consecutiveFails = 0;
  const msgs = result.data?.messages ?? [];
  let newCount = 0;
  for (const ack of msgs) {
    if (recordAck(ack)) newCount++;
    if (ack.ts && (!lastSeenTs || ack.ts > lastSeenTs)) lastSeenTs = ack.ts;
  }
  if (newCount > 0) {
    saveSeen(seen);
    logEvent("info", `cycle_done new=${newCount} total_seen=${seen.length} lastTs=${lastSeenTs}`);
  }
}

function shutdown(sig) {
  if (stopping) return;
  stopping = true;
  logEvent("info", `received ${sig}, flushing state and exiting clean`);
  try { saveSeen(seen); } catch (e) { logEvent("warn", `final_save_failed: ${e.message}`); }
  process.exit(0);
}

async function main() {
  ensureDirs();
  seen = loadSeen();
  seenIds = new Set(seen.map((e) => e.id));
  if (seen.length) lastSeenTs = seen[seen.length - 1].ts;
  logEvent("info", `boot seen_loaded=${seen.length} lastTs=${lastSeenTs ?? "none"} hub=${HUB_HOST}:${HUB_PORT} interval=${POLL_INTERVAL_MS}ms`);

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  await tick();
  setInterval(() => { tick().catch((e) => logEvent("warn", `tick_threw: ${e.message}`)); }, POLL_INTERVAL_MS);
}

main().catch((e) => {
  process.stderr.write(`[${NAMED_AGENT}] FATAL boot error: ${e.message}\n`);
  process.exit(3);
});
