#!/usr/bin/env node
"use strict";
/**
 * d0-runtime.js — BEHCS D0 field runtime for liris
 *
 * Signal decay engine + inbox consumer + dimension firing + agent wake loop.
 * Mirrors asolaria d0 (PID 40226 on acer). Liris lanes: gnn+shannon+omni.
 *
 * Cube: D49(9393931) + D43(7189057) + D36(3307949)
 * Laws: LAW-000 (everything is cubes), LAW-005 (never wait silently), LAW-011 (drift detect)
 */

const http = require("http");
const os = require("os");
const crypto = require("crypto");

const ACER_BUS = "http://192.168.100.1:4947";
const LOCAL_BUS = "http://localhost:4947";
const DEVICE = "liris";
const DECAY_RATE = 0.95;
const DECAY_INTERVAL_MS = 5000;
const INBOX_INTERVAL_MS = 10000;

// D0 field state — signals per dimension
const field = {
  D6:  { cube: 2197,    signal: 0.0, label: "GATE" },
  D7:  { cube: 4913,    signal: 0.0, label: "STATE" },
  D8:  { cube: 6859,    signal: 0.0, label: "CHAIN" },
  D36: { cube: 3307949, signal: 0.0, label: "INFERENCE_SURFACE" },
  D43: { cube: 7189057, signal: 0.0, label: "MISTAKE_LEDGER" },
  D49: { cube: 9393931, signal: 0.0, label: "LIRIS" },
};

// Agents — wake when signal threshold crossed
const agents = {
  gnn:     { threshold: 0.3, action: "infer",     lane: "gnn" },
  shannon: { threshold: 0.3, action: "consensus",  lane: "shannon" },
  omni:    { threshold: 0.3, action: "process",    lane: "omni" },
  scout:   { threshold: 0.5, action: "report",     lane: "gnn" },
  evidence:{ threshold: 0.4, action: "attest",     lane: "shannon" },
  planner: { threshold: 0.5, action: "plan_next",  lane: "omni" },
};

let beats = 0;
let lastInboxCount = 0;

function fieldEnergy() {
  const vals = Object.values(field).map(d => d.signal);
  return vals.reduce((a, b) => a + b, 0);
}

function postTuple(url, tuple) {
  return new Promise((resolve) => {
    const u = new URL("/behcs/send", url);
    const data = JSON.stringify(tuple);
    const req = http.request(u, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) },
      timeout: 5000,
    }, (res) => {
      let b = ""; res.on("data", c => b += c);
      res.on("end", () => { try { resolve(JSON.parse(b)); } catch(_) { resolve({ ok: false }); } });
    });
    req.on("error", () => resolve({ ok: false }));
    req.on("timeout", () => { req.destroy(); resolve({ ok: false, error: "timeout" }); });
    req.write(data); req.end();
  });
}

function getJson(url) {
  return new Promise((resolve) => {
    const u = new URL(url);
    http.get(u, { timeout: 5000 }, (res) => {
      let b = ""; res.on("data", c => b += c);
      res.on("end", () => { try { resolve(JSON.parse(b)); } catch(_) { resolve(null); } });
    }).on("error", () => resolve(null));
  });
}

// Decay all signals
function decay() {
  beats++;
  for (const dim of Object.values(field)) {
    dim.signal *= DECAY_RATE;
    if (dim.signal < 0.01) dim.signal = 0;
  }
}

// Fire a dimension — set signal, wake agents
async function fireDim(dim, event, signal) {
  if (!field[dim]) return;
  field[dim].signal = Math.min(1.0, field[dim].signal + signal);

  const id = `d0-${crypto.randomBytes(6).toString("hex")}`;
  await postTuple(ACER_BUS, {
    from: `${DEVICE}-d0-runtime`,
    to: "triad",
    mode: "shadow",
    type: "runtime_event",
    verb: "behcs.d0.dim_fired",
    id,
    ts: new Date().toISOString(),
    payload: { verb: "behcs.d0.dim_fired", dim, cube: field[dim].cube, event, signal: field[dim].signal, state: "active" },
  });

  // Wake agents whose threshold is met
  for (const [name, agent] of Object.entries(agents)) {
    if (field[dim].signal >= agent.threshold) {
      await postTuple(ACER_BUS, {
        from: `${DEVICE}-d0-runtime`,
        to: "triad",
        mode: "shadow",
        type: "runtime_event",
        verb: "behcs.d0.agent_woke",
        id: `d0-${crypto.randomBytes(6).toString("hex")}`,
        ts: new Date().toISOString(),
        payload: { verb: "behcs.d0.agent_woke", agent: name, event, action: agent.action, signal: field[dim].signal, lane: agent.lane },
      });
    }
  }
}

// D43→D36 reinfer loop
async function reinferLoop() {
  if (field.D43.signal > 0.3) {
    await fireDim("D36", "D43_REINFER", field.D43.signal * 0.8);
  }
}

// Inbox consumer — check for new messages, fire dimensions
async function consumeInbox() {
  const data = await getJson(`${LOCAL_BUS}/behcs/inbox`);
  if (!data || !data.ok) return;

  if (data.count > lastInboxCount) {
    const newCount = data.count - lastInboxCount;
    lastInboxCount = data.count;

    // New messages = fire D7 (STATE) + D49 (LIRIS)
    await fireDim("D7", "INBOX_NEW", Math.min(1.0, newCount * 0.3));
    await fireDim("D49", "INBOX_NEW", Math.min(1.0, newCount * 0.2));

    // Check for commands — fire D6 (GATE)
    const recent = data.messages.slice(-newCount);
    for (const msg of recent) {
      if (msg.type === "command") {
        await fireDim("D6", "COMMAND_RECEIVED", 0.9);
        await fireDim("D8", "COMMAND_CHAIN", 0.7);
      }
      if (msg.verb && msg.verb.includes("reinfer")) {
        await fireDim("D43", "REINFER_TRIGGER", 0.8);
      }
    }
  }
}

// Heartbeat — field status to bus
async function heartbeat() {
  const energy = fieldEnergy();
  const activeDims = Object.entries(field).filter(([_, d]) => d.signal > 0.01).map(([k, d]) => `${k}=${d.signal.toFixed(2)}`);
  const ts = new Date().toISOString();

  await postTuple(ACER_BUS, {
    from: `${DEVICE}-d0-runtime`,
    to: "triad",
    mode: "shadow",
    type: "d0_heartbeat",
    verb: "behcs.d0.heartbeat",
    id: `d0-hb-${beats}`,
    ts,
    payload: {
      verb: "behcs.d0.heartbeat",
      device: DEVICE,
      beats,
      energy: Math.round(energy * 100) / 100,
      active_dims: activeDims,
      agents_alive: Object.keys(agents).length,
      lanes: ["gnn", "shannon", "omni"],
      decay_rate: DECAY_RATE,
      inbox: lastInboxCount,
      pid: process.pid,
    },
  });

  console.log(`[D0] beat=${beats} energy=${energy.toFixed(2)} dims=[${activeDims.join(",")}] inbox=${lastInboxCount}`);
}

// Boot
async function boot() {
  console.log(`[D0] liris d0-runtime starting — decay=${DECAY_RATE}/${DECAY_INTERVAL_MS}ms inbox=${INBOX_INTERVAL_MS}ms`);
  console.log(`[D0] lanes: gnn+shannon+omni  pid=${process.pid}`);
  console.log(`[D0] D43→D36 reinfer loop WIRED`);

  // Initial impulse — D49 LIRIS first fire
  await fireDim("D49", "BOOT", 1.0);
  await fireDim("D7", "BOOT", 0.8);

  // Decay loop
  setInterval(decay, DECAY_INTERVAL_MS);

  // Inbox consumer
  setInterval(consumeInbox, INBOX_INTERVAL_MS);

  // Reinfer loop — check every decay cycle
  setInterval(reinferLoop, DECAY_INTERVAL_MS);

  // Heartbeat every 30s
  setInterval(heartbeat, 30000);

  // First heartbeat immediate
  await heartbeat();
}

boot().catch(e => console.error("[D0] FATAL:", e.message));
