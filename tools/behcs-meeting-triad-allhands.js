#!/usr/bin/env node
"use strict";
/**
 * behcs-meeting-triad-allhands.js — LP-005 Omni Meeting Room (triad-allhands)
 *
 * Long-lived process. Every 5 minutes runs a self-reflection wave:
 *   1. Fetch liris BEHCS health (localhost:4947)
 *   2. Fetch acer BEHCS health (192.168.100.1:4947)
 *   3. Fetch acer inbox and count recent messages (last 5 min)
 *   4. Read latest vote from data/votes/
 *   5. Compose meeting minutes JSON
 *   6. Write to data/meetings/triad-allhands/
 *   7. POST summary to acer BEHCS bus
 *
 * Cube alignment: D42_MEETING_ROOM  (181^3 = 5929741)
 */

const http = require("http");
const fs   = require("fs");
const path = require("path");

// ── Constants ───────────────────────────────────────────────────────────────

const ROOT            = "C:/Users/rayss/Asolaria";
const MEETINGS_DIR    = path.join(ROOT, "data/meetings/triad-allhands");
const VOTES_DIR       = path.join(ROOT, "data/votes");
const LOG_FILE        = path.join(ROOT, "logs/behcs-meeting-triad-allhands.log");
const WAVE_INTERVAL   = 300_000; // 5 minutes

const LIRIS_HEALTH    = { hostname: "localhost",       port: 4947, path: "/behcs/health" };
const ACER_HEALTH     = { hostname: "192.168.100.1",   port: 4947, path: "/behcs/health" };
const ACER_INBOX      = { hostname: "192.168.100.1",   port: 4947, path: "/behcs/inbox"  };
const ACER_BUS_POST   = { hostname: "192.168.100.1",   port: 4947, path: "/behcs/send",
                           method: "POST" };

const CUBE_ALIGNMENT  = { dim: "D42_MEETING_ROOM", address: 5929741, base: 181 };

// ── Helpers ─────────────────────────────────────────────────────────────────

function ensureDir(p) {
  try { fs.mkdirSync(p, { recursive: true }); } catch (_) {}
}

function log(msg) {
  const line = new Date().toISOString() + " [MEETING-ROOM] " + msg;
  console.log(line);
  try {
    ensureDir(path.dirname(LOG_FILE));
    fs.appendFileSync(LOG_FILE, line + "\n");
  } catch (_) {}
}

/** Promise-based HTTP GET with timeout */
function httpGet(opts, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const req = http.get(opts, (res) => {
      let body = "";
      res.on("data", (c) => { body += c; });
      res.on("end", () => {
        try { resolve(JSON.parse(body)); }
        catch (_) { resolve({ raw: body }); }
      });
    });
    req.on("error", (err) => reject(err));
    req.setTimeout(timeoutMs, () => { req.destroy(); reject(new Error("TIMEOUT")); });
  });
}

/** Promise-based HTTP POST JSON */
function httpPostJson(opts, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const reqOpts = {
      ...opts,
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) }
    };
    const req = http.request(reqOpts, (res) => {
      let body = "";
      res.on("data", (c) => { body += c; });
      res.on("end", () => {
        try { resolve(JSON.parse(body)); }
        catch (_) { resolve({ raw: body, statusCode: res.statusCode }); }
      });
    });
    req.on("error", (err) => reject(err));
    req.setTimeout(8000, () => { req.destroy(); reject(new Error("TIMEOUT")); });
    req.write(data);
    req.end();
  });
}

/** Read the most recent vote directory */
function readLatestVote() {
  try {
    const dirs = fs.readdirSync(VOTES_DIR).sort();
    if (dirs.length === 0) return { status: "NO_VOTES" };
    const latest = dirs[dirs.length - 1];
    const votePath = path.join(VOTES_DIR, latest);
    const files = fs.readdirSync(votePath);
    if (files.length === 0) return { dir: latest, status: "EMPTY" };
    const firstFile = files[0];
    const content = JSON.parse(fs.readFileSync(path.join(votePath, firstFile), "utf8"));
    return {
      dir: latest,
      file: firstFile,
      vote_id: content.vote_id || latest,
      mode: content.mode || "unknown",
      verdict: content.results?.[0]?.verdict || "N/A",
      confidence: content.results?.[0]?.confidence || null,
      ts: content.ts || null
    };
  } catch (err) {
    return { status: "ERROR", error: err.message };
  }
}

/** Filter inbox messages to last 5 minutes */
function countRecentMessages(inboxData) {
  const fiveMinAgo = Date.now() - WAVE_INTERVAL;
  if (Array.isArray(inboxData)) {
    const recent = inboxData.filter((m) => {
      const t = m.ts || m.timestamp || m.received;
      return t && new Date(t).getTime() >= fiveMinAgo;
    });
    return { total: inboxData.length, recent: recent.length };
  }
  if (inboxData && typeof inboxData === "object" && Array.isArray(inboxData.messages)) {
    const recent = inboxData.messages.filter((m) => {
      const t = m.ts || m.timestamp || m.received;
      return t && new Date(t).getTime() >= fiveMinAgo;
    });
    return { total: inboxData.messages.length, recent: recent.length };
  }
  return { total: 0, recent: 0, note: "inbox format unrecognized" };
}

// ── Wave state ──────────────────────────────────────────────────────────────

let waveNumber = 0;

// ── Main reflection wave ────────────────────────────────────────────────────

async function runReflectionWave() {
  waveNumber++;
  const waveTs = new Date().toISOString();
  log(`--- WAVE ${waveNumber} start ---`);

  // 1. Liris health
  let lirisHealth;
  try {
    lirisHealth = await httpGet(LIRIS_HEALTH);
    lirisHealth._status = "OK";
  } catch (err) {
    lirisHealth = { _status: "UNREACHABLE", error: err.message };
    log("liris health: UNREACHABLE — " + err.message);
  }

  // 2. Acer health
  let acerHealth;
  try {
    acerHealth = await httpGet(ACER_HEALTH);
    acerHealth._status = "OK";
  } catch (err) {
    acerHealth = { _status: "UNREACHABLE", error: err.message };
    log("acer health: UNREACHABLE — " + err.message);
  }

  // 3. Acer inbox (message activity)
  let messageActivity;
  try {
    const inboxData = await httpGet(ACER_INBOX);
    messageActivity = countRecentMessages(inboxData);
    messageActivity._status = "OK";
  } catch (err) {
    messageActivity = { _status: "UNREACHABLE", error: err.message, total: 0, recent: 0 };
    log("acer inbox: UNREACHABLE — " + err.message);
  }

  // 4. Latest vote (mini v4 scan)
  const latestVote = readLatestVote();

  // 5. Compose meeting minutes
  const minutes = {
    type: "behcs.meeting.minutes",
    meeting_room: "triad-allhands",
    cube_alignment: CUBE_ALIGNMENT,
    timestamp: waveTs,
    reflection_wave_number: waveNumber,
    attendees: {
      liris: lirisHealth._status === "OK" ? "PRESENT" : "UNREACHABLE",
      acer:  acerHealth._status  === "OK" ? "PRESENT" : "UNREACHABLE",
      falcon: "MONITORING"  // falcon is passive observer via acer relay
    },
    system_health: {
      liris: lirisHealth,
      acer:  acerHealth
    },
    message_activity: messageActivity,
    latest_vote: latestVote,
    action_items: buildActionItems(lirisHealth, acerHealth, messageActivity, latestVote),
    meta: {
      agent: "AGENT-LP005-MEETING-ROOM",
      process: "behcs-meeting-triad-allhands",
      wave_interval_s: WAVE_INTERVAL / 1000,
      pid: process.pid
    }
  };

  // 6. Write to disk
  const safeTs = waveTs.replace(/:/g, "").replace(/\./g, "");
  const fileName = `MEETING-${safeTs}.json`;
  const filePath = path.join(MEETINGS_DIR, fileName);
  ensureDir(MEETINGS_DIR);
  try {
    fs.writeFileSync(filePath, JSON.stringify(minutes, null, 2));
    log("wrote " + filePath);
  } catch (err) {
    log("WRITE ERROR: " + err.message);
  }

  // 7. POST summary to acer BEHCS bus
  try {
    const ack = await httpPostJson(ACER_BUS_POST, minutes);
    log("posted minutes to acer — ack: " + JSON.stringify(ack).slice(0, 120));
  } catch (err) {
    log("POST to acer failed: " + err.message);
  }

  log(`--- WAVE ${waveNumber} complete ---`);
  return minutes;
}

/** Derive action items from collected state */
function buildActionItems(lirisHealth, acerHealth, msgActivity, vote) {
  const items = [];

  if (lirisHealth._status !== "OK") {
    items.push({ priority: "HIGH", item: "liris BEHCS bus unreachable — investigate localhost:4947" });
  }
  if (acerHealth._status !== "OK") {
    items.push({ priority: "HIGH", item: "acer BEHCS bus unreachable — check ethernet / 192.168.100.1:4947" });
  }
  if (msgActivity.recent > 50) {
    items.push({ priority: "MEDIUM", item: `High message volume: ${msgActivity.recent} messages in last 5 min` });
  }
  if (vote && vote.verdict === "HALT") {
    items.push({ priority: "CRITICAL", item: `Latest vote verdict is HALT — vote_id: ${vote.vote_id}` });
  }
  if (vote && vote.confidence !== null && vote.confidence < 0.5) {
    items.push({ priority: "MEDIUM", item: `Low confidence in latest vote: ${vote.confidence}` });
  }
  if (items.length === 0) {
    items.push({ priority: "NONE", item: "All systems nominal. No action required." });
  }

  return items;
}

// ── Entry point ─────────────────────────────────────────────────────────────

function main() {
  log("=== behcs-meeting-triad-allhands starting ===");
  log(`PID: ${process.pid}  |  Wave interval: ${WAVE_INTERVAL / 1000}s  |  Cube: D42=${CUBE_ALIGNMENT.address}`);
  ensureDir(MEETINGS_DIR);

  // Run first wave immediately
  runReflectionWave().catch((err) => log("WAVE ERROR: " + err.message));

  // Schedule subsequent waves
  const timer = setInterval(() => {
    runReflectionWave().catch((err) => log("WAVE ERROR: " + err.message));
  }, WAVE_INTERVAL);

  // Graceful shutdown
  function shutdown(sig) {
    log(`Received ${sig}. Shutting down meeting room.`);
    clearInterval(timer);
    process.exit(0);
  }
  process.on("SIGINT",  () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  log("Meeting room active. Ctrl+C to stop.");
}

main();
