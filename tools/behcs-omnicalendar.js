#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// BEHCS-OMNICALENDAR  (LP-003)
// Long-lived mirror watcher — polls acer:4947 every 30 s.
// Agent: AGENT-LP003-OMNICALENDAR
// ─────────────────────────────────────────────────────────────
"use strict";

const http = require("http");
const fs   = require("fs");
const path = require("path");

// ── paths ────────────────────────────────────────────────────
const STATE_FILE = path.join("C:", "Users", "rayss", "Asolaria", "data", "behcs-omnicalendar.json");
const LOG_FILE   = path.join("C:", "Users", "rayss", "Asolaria", "logs", "behcs-omnicalendar.ndjson");

// ── constants ────────────────────────────────────────────────
const ACER_HOST       = "192.168.100.1";
const ACER_PORT       = 4947;
const POLL_INTERVAL   = 30_000;            // 30 s
const SILENCE_THRESH  = 120_000;           // 120 s  — BEHCS-LAW-003

// ── helpers ──────────────────────────────────────────────────

function httpGet(urlPath) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: ACER_HOST, port: ACER_PORT, path: urlPath, method: "GET", timeout: 10_000 },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
          catch { resolve({ status: res.statusCode, body: data }); }
        });
      }
    );
    req.on("error",   (e) => reject(e));
    req.on("timeout", ()  => { req.destroy(); reject(new Error("timeout")); });
    req.end();
  });
}

function httpPost(urlPath, payload) {
  const body = JSON.stringify(payload);
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: ACER_HOST, port: ACER_PORT, path: urlPath, method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
        timeout: 10_000,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve({ status: res.statusCode, body: data }));
      }
    );
    req.on("error",   (e) => reject(e));
    req.on("timeout", ()  => { req.destroy(); reject(new Error("timeout")); });
    req.write(body);
    req.end();
  });
}

function writeJSON(filepath, obj) {
  fs.mkdirSync(path.dirname(filepath), { recursive: true });
  fs.writeFileSync(filepath, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

function appendNDJSON(filepath, obj) {
  fs.mkdirSync(path.dirname(filepath), { recursive: true });
  fs.appendFileSync(filepath, JSON.stringify(obj) + "\n", "utf8");
}

// ── state kept across ticks ──────────────────────────────────
let lastFalconHeartbeat = null;
let lastLirisHeartbeat  = null;
let falconHeartbeatCount = 0;
let lirisHeartbeatCount  = 0;

// ── main tick ────────────────────────────────────────────────

async function tick() {
  const now = new Date().toISOString();
  let acerAlive = false;
  let healthBody = null;
  let inboxMessages = [];

  // 1) Fetch /behcs/health
  try {
    const healthRes = await httpGet("/behcs/health");
    if (healthRes.status === 200) {
      acerAlive = true;
      healthBody = healthRes.body;
    }
  } catch { /* acer unreachable */ }

  // 2) Fetch /behcs/inbox
  try {
    const inboxRes = await httpGet("/behcs/inbox");
    if (inboxRes.status === 200) {
      inboxMessages = Array.isArray(inboxRes.body) ? inboxRes.body
                    : Array.isArray(inboxRes.body?.messages) ? inboxRes.body.messages
                    : [];
    }
  } catch { /* acer unreachable */ }

  // 3) Count messages by verb
  const messageCountByVerb = {};
  for (const msg of inboxMessages) {
    const verb = msg.verb || msg.type || "unknown";
    messageCountByVerb[verb] = (messageCountByVerb[verb] || 0) + 1;
  }

  // 4) Track heartbeats
  for (const msg of inboxMessages) {
    const verb = msg.verb || msg.type || "";
    const ts   = msg.timestamp || msg.ts || now;
    if (/heartbeat/i.test(verb)) {
      const src = (msg.source || msg.from || "").toLowerCase();
      if (src.includes("falcon") || src.includes("beast")) {
        falconHeartbeatCount++;
        lastFalconHeartbeat = ts;
      }
      if (src.includes("liris")) {
        lirisHeartbeatCount++;
        lastLirisHeartbeat = ts;
      }
    }
  }

  // 5) Derive triad_status
  let triadStatus = "all_pulsing";
  if (!acerAlive) {
    triadStatus = "acer_down";
  } else {
    const falconAge = lastFalconHeartbeat ? Date.now() - new Date(lastFalconHeartbeat).getTime() : Infinity;
    const lirisAge  = lastLirisHeartbeat  ? Date.now() - new Date(lastLirisHeartbeat).getTime()  : Infinity;
    const falconSilent = falconAge > SILENCE_THRESH;
    const lirisSilent  = lirisAge  > SILENCE_THRESH;
    if (falconSilent && lirisSilent) triadStatus = "degraded";
    else if (falconSilent)           triadStatus = "falcon_silent";
    else if (lirisSilent)            triadStatus = "liris_silent";
  }

  // 6) BEHCS-LAW-003 escalation check
  const escalation = triadStatus !== "all_pulsing";

  // 7) Build state object
  const state = {
    last_check:              now,
    acer_alive:              acerAlive,
    falcon_heartbeat_count:  falconHeartbeatCount,
    liris_heartbeat_count:   lirisHeartbeatCount,
    last_falcon_heartbeat:   lastFalconHeartbeat,
    last_liris_heartbeat:    lastLirisHeartbeat,
    message_count_by_verb:   messageCountByVerb,
    triad_status:            triadStatus,
    escalation,
  };

  // 8) Persist
  writeJSON(STATE_FILE, state);
  appendNDJSON(LOG_FILE, state);

  // 9) Escalation dispatch
  if (escalation) {
    try {
      await httpPost("/behcs/inbox", {
        verb:      "behcs.escalation",
        source:    "liris:omnicalendar",
        timestamp: now,
        payload: {
          triad_status: triadStatus,
          detail:       `BEHCS-LAW-003 silence threshold exceeded (>${SILENCE_THRESH / 1000}s)`,
        },
      });
      console.log(`[${now}] ESCALATION sent — ${triadStatus}`);
    } catch (e) {
      console.error(`[${now}] ESCALATION send failed: ${e.message}`);
    }
  }

  console.log(`[${now}] tick — acer=${acerAlive} triad=${triadStatus} verbs=${JSON.stringify(messageCountByVerb)}`);
}

// ── boot ─────────────────────────────────────────────────────

console.log(`[BEHCS-OMNICALENDAR] LP-003 starting — polling ${ACER_HOST}:${ACER_PORT} every ${POLL_INTERVAL / 1000}s`);
tick();                              // first check immediately
setInterval(tick, POLL_INTERVAL);    // then every 30 s
