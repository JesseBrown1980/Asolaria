#!/usr/bin/env node
// inbox-tail-bridge.mjs — verb-filtered tail of acer:/behcs/inbox?target=liris.
// Fallback transport when WO-L4 HWND-injection fails. Surfaces WO_BRIEFs,
// canon-ack requests, drift alerts as structured log lines.
// named_agent: liris-cascade-W2-1-inbox-tail-bridge  WO=L5 (945eeeec…)
// Mirrors canon-ack-watcher-service.mjs (L6). Honors fetch-timeout-floor 5/15s,
// orbital-routing acer:4947, LAW-001. node:fs + node:http only. No deps.

import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const HUB_HOST = "192.168.100.1";
const HUB_PORT = 4947;
const HUB_PATH = "/behcs/inbox";
const TARGET = "liris";
const NAMED_AGENT = "liris-cascade-W2-1-inbox-tail-bridge";

const ROOT = "C:/Users/rayss/Asolaria";
const STATE_DIR = path.join(ROOT, "data", "behcs", "state");
const DEFAULT_CONFIG_FILE = path.join(STATE_DIR, "inbox-tail-bridge.config.json");
const SEEN_FILE = path.join(STATE_DIR, "inbox-tail-bridge-seen.json");
const LOG_DIR = path.join(ROOT, "logs");
const LOG_FILE = path.join(LOG_DIR, "inbox-tail-bridge.log");

const POLL_INTERVAL_MS = 30_000;
const MAX_SEEN = 1000;
const FETCH_LAST = 100;
const MAX_CONSECUTIVE_FAILS = 5;
const CONNECT_TIMEOUT_MS = 5_000;
const READ_TIMEOUT_MS = 15_000;

const DEFAULT_VERBS = [
  "WO_BRIEF",
  "EVT-WO-DISPATCH",
  "FIRST_MESSAGE_CANON_ACK_REQUEST",
  "EVT-CANON-LOADED-ACK",
  "EVT-CANON-DRIFT-ALERT",
];

function parseArgs(argv) {
  const args = { once: false, verbose: false, configPath: DEFAULT_CONFIG_FILE, verbsCli: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--once") args.once = true;
    else if (a === "--verbose") args.verbose = true;
    else if (a === "--config") args.configPath = argv[++i];
    else if (a === "--verbs") args.verbsCli = argv[++i];
  }
  return args;
}

function ensureDirs() {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function loadConfig(configPath) {
  try {
    const raw = fs.readFileSync(configPath, "utf8");
    const obj = JSON.parse(raw);
    if (obj && Array.isArray(obj.verbs)) return obj;
  } catch (_) { /* missing or invalid → seed below */ }
  const seed = { verbs: DEFAULT_VERBS, _note: "edit verbs[] live; reloaded each poll. named_agent=" + NAMED_AGENT };
  try {
    const tmp = configPath + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(seed, null, 2));
    fs.renameSync(tmp, configPath);
  } catch (_) { /* best-effort */ }
  return seed;
}

function loadSeen() {
  try {
    const raw = fs.readFileSync(SEEN_FILE, "utf8");
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr;
  } catch (_) { /* first run */ }
  return [];
}

function saveSeen(seen) {
  const tmp = SEEN_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(seen, null, 2));
  fs.renameSync(tmp, SEEN_FILE);
}

function appendLog(line) {
  fs.appendFileSync(LOG_FILE, line + "\n");
}

function logEvent(level, msg) {
  const line = `[${new Date().toISOString()}] [${level}] [${NAMED_AGENT}] ${msg}`;
  appendLog(line);
  console.log(line);
}

function summarize(payload) {
  const p = payload ?? {};
  if (typeof p.title === "string" && p.title.length) return p.title;
  if (p.brief && typeof p.brief === "string") return p.brief.slice(0, 80);
  try { return JSON.stringify(p).slice(0, 120); } catch { return "<unserializable>"; }
}

function pollOnce(sinceTs) {
  return new Promise((resolve) => {
    const params = new URLSearchParams({ target: TARGET, last: String(FETCH_LAST) });
    if (sinceTs) params.set("since", sinceTs);
    const req = http.request(
      { host: HUB_HOST, port: HUB_PORT, path: `${HUB_PATH}?${params.toString()}`, method: "GET", timeout: READ_TIMEOUT_MS },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => {
          try { resolve({ ok: true, data: JSON.parse(body) }); }
          catch (e) { resolve({ ok: false, error: `parse_error: ${e.message}` }); }
        });
      }
    );
    let connected = false;
    req.on("socket", (sock) => {
      sock.setTimeout(CONNECT_TIMEOUT_MS);
      sock.once("connect", () => { connected = true; sock.setTimeout(READ_TIMEOUT_MS); });
      sock.on("timeout", () => req.destroy(new Error(connected ? "read_timeout" : "connect_timeout")));
    });
    req.setTimeout(READ_TIMEOUT_MS, () => req.destroy(new Error("overall_timeout")));
    req.on("error", (e) => resolve({ ok: false, error: e.message }));
    req.end();
  });
}

let seen = [];
let seenIds = new Set();
let lastSeenTs = null;
let consecutiveFails = 0;
let stopping = false;

function recordEnvelope(env, args, allowed) {
  if (seenIds.has(env.id)) return false;
  if (!allowed.has(env.verb)) return false;
  const idShort = String(env.id ?? "").slice(0, 16);
  const summary = summarize(env.payload).replace(/\s+/g, " ");
  const line = `[${new Date().toISOString()}] [verb=${env.verb}] [from=${env.from ?? "?"}] [id=${idShort}] ${summary}`;
  appendLog(line);
  if (args.verbose || args.once) console.log(line);
  seen.push({ id: env.id, ts: env.ts, verb: env.verb });
  seenIds.add(env.id);
  if (seen.length > MAX_SEEN) {
    const drop = seen.length - MAX_SEEN;
    const removed = seen.splice(0, drop);
    for (const r of removed) seenIds.delete(r.id);
  }
  return true;
}

async function tick(args) {
  if (stopping) return;
  const cfg = loadConfig(args.configPath);
  const cliVerbs = args.verbsCli ? args.verbsCli.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const allowedArr = cliVerbs.length ? cliVerbs : (cfg.verbs ?? DEFAULT_VERBS);
  const allowed = new Set(allowedArr);

  const result = await pollOnce(lastSeenTs);
  if (!result.ok) {
    consecutiveFails++;
    logEvent("warn", `poll_fail (${consecutiveFails}/${MAX_CONSECUTIVE_FAILS}): ${result.error}`);
    if (consecutiveFails >= MAX_CONSECUTIVE_FAILS) {
      process.stderr.write(`[${NAMED_AGENT}] FATAL: ${MAX_CONSECUTIVE_FAILS} consecutive poll failures — last: ${result.error}\nHub: http://${HUB_HOST}:${HUB_PORT}${HUB_PATH}\nOperator: check acer hub liveness, route liris->192.168.100.1, or restart bridge.\n`);
      try { saveSeen(seen); } catch {}
      process.exit(2);
    }
    return { newCount: 0 };
  }
  consecutiveFails = 0;
  const msgs = result.data?.messages ?? [];
  let newCount = 0;
  for (const env of msgs) {
    if (recordEnvelope(env, args, allowed)) newCount++;
    if (env.ts && (!lastSeenTs || env.ts > lastSeenTs)) lastSeenTs = env.ts;
  }
  if (newCount > 0) {
    saveSeen(seen);
    logEvent("info", `cycle_done new=${newCount} total_seen=${seen.length} lastTs=${lastSeenTs} verbs=${allowedArr.length}`);
  }
  return { newCount, scanned: msgs.length, allowed: allowedArr.length };
}

function shutdown(sig) {
  if (stopping) return;
  stopping = true;
  logEvent("info", `received ${sig}, flushing state and exiting clean`);
  try { saveSeen(seen); } catch (e) { logEvent("warn", `final_save_failed: ${e.message}`); }
  process.exit(0);
}

async function main() {
  const args = parseArgs(process.argv);
  ensureDirs();
  const cfg = loadConfig(args.configPath);
  seen = loadSeen();
  seenIds = new Set(seen.map((e) => e.id));
  if (seen.length) lastSeenTs = seen[seen.length - 1].ts ?? null;
  const verbCount = args.verbsCli ? args.verbsCli.split(",").length : (cfg.verbs?.length ?? 0);
  logEvent("info", `boot mode=${args.once ? "once" : "loop"} verbose=${args.verbose} seen_loaded=${seen.length} lastTs=${lastSeenTs ?? "none"} hub=${HUB_HOST}:${HUB_PORT} interval=${POLL_INTERVAL_MS}ms verbs=${verbCount} config=${args.configPath}`);
  if (args.once) {
    const r = await tick(args);
    logEvent("info", `once_done scanned=${r?.scanned ?? 0} new=${r?.newCount ?? 0}`);
    process.exit(0);
  }
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  await tick(args);
  setInterval(() => { tick(args).catch((e) => logEvent("warn", `tick_threw: ${e.message}`)); }, POLL_INTERVAL_MS);
}

main().catch((e) => {
  process.stderr.write(`[${NAMED_AGENT}] FATAL boot error: ${e.message}\n`);
  process.exit(3);
});
