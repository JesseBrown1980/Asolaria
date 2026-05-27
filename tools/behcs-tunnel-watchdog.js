#!/usr/bin/env node
"use strict";
/**
 * behcs-tunnel-watchdog.js — auto-check ethernet to acer every 30s.
 * If dead: attempt rebind, report to bus.
 * BEHCS-LAW-007: never sit silent.
 */
const http = require("http");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ACER_DIRECT = "192.168.100.1";
const LIRIS_ETH = "192.168.100.2";
const ACER_BUS = "http://" + ACER_DIRECT + ":4947";
const ACER_KEYBOARD = "http://" + ACER_DIRECT + ":4913";
const CHECK_INTERVAL = 30000;
const ROOT = "C:/Users/rayss/Asolaria";
const LOG = path.join(ROOT, "logs/behcs-tunnel-watchdog.ndjson");

function ensureDir(p) { try { fs.mkdirSync(path.dirname(p), { recursive: true }); } catch(_) {} }
function log(obj) { const entry = { ts: new Date().toISOString(), ...obj }; console.log(JSON.stringify(entry)); ensureDir(LOG); try { fs.appendFileSync(LOG, JSON.stringify(entry) + "\n"); } catch(_) {} }

function httpGet(url, timeout) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const req = http.get({ hostname: u.hostname, port: u.port, path: u.pathname, timeout: timeout || 3000 }, (res) => {
      let b = ""; res.on("data", c => b += c);
      res.on("end", () => { try { resolve(JSON.parse(b)); } catch(_) { resolve({ raw: b }); } });
    });
    req.on("error", () => resolve(null));
    req.on("timeout", () => { req.destroy(); resolve(null); });
  });
}

function httpPost(url, data) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const payload = JSON.stringify(data);
    const req = http.request({ hostname: u.hostname, port: u.port, path: u.pathname, method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) }, timeout: 5000 }, (res) => {
      let b = ""; res.on("data", c => b += c); res.on("end", () => resolve(b));
    });
    req.on("error", () => resolve(null));
    req.on("timeout", () => { req.destroy(); resolve(null); });
    req.write(payload); req.end();
  });
}

// State tracking
let consecutiveFailures = 0;
let lastAlive = null;
let totalChecks = 0;
let totalFails = 0;
let rebindAttempts = 0;

async function checkTunnel() {
  totalChecks++;
  const t0 = Date.now();

  // 1. Ping via HTTP (faster than ICMP on Windows)
  const busHealth = await httpGet(ACER_BUS + "/behcs/health", 3000);
  const busAlive = !!busHealth;
  const busLatency = Date.now() - t0;

  // 2. Check keyboard
  const t1 = Date.now();
  const kbHealth = await httpGet(ACER_KEYBOARD + "/health", 3000);
  const kbAlive = !!kbHealth;
  const kbLatency = Date.now() - t1;

  // 3. If bus responds over ethernet IP, the tunnel IS alive
  const ethUp = busAlive;
  const allAlive = busAlive;

  if (allAlive) {
    if (consecutiveFailures > 0) {
      log({ event: "RECOVERED", after_failures: consecutiveFailures, bus_latency: busLatency, kb_latency: kbLatency });
      // Report recovery to bus
      await httpPost(ACER_BUS + "/behcs/send", {
        from: "liris", to: "asolaria", verb: "behcs.tunnel.recovered",
        tuple: ["liris", "behcs.tunnel.recovered", "asolaria", 0, "colony", "hookwall", "recovered", ["TUNNEL-RECOVERED", "after-" + consecutiveFailures + "-fails"], "pulse", "LX", "signed", "instant", "ethernet-direct", "free"],
        text: "Tunnel RECOVERED after " + consecutiveFailures + " failures. Bus=" + busLatency + "ms KB=" + kbLatency + "ms",
        version: "behcs-v1"
      });
    }
    consecutiveFailures = 0;
    lastAlive = new Date().toISOString();

    // Quiet log every 10th check
    if (totalChecks % 10 === 0) {
      log({ event: "alive", check: totalChecks, bus_ms: busLatency, kb_ms: kbLatency, eth: ethUp, fails_total: totalFails });
    }
  } else {
    consecutiveFailures++;
    totalFails++;
    log({ event: "FAILURE", consecutive: consecutiveFailures, bus: busAlive, kb: kbAlive, eth: ethUp, bus_ms: busLatency, kb_ms: kbLatency });

    // After 3 consecutive failures, try rebind
    if (consecutiveFailures >= 3 && consecutiveFailures % 3 === 0) {
      rebindAttempts++;
      log({ event: "REBIND_ATTEMPT", attempt: rebindAttempts });

      try {
        // Disable and re-enable ethernet adapter
        execSync('netsh interface set interface "Ethernet" disable', { timeout: 10000 });
        await new Promise(r => setTimeout(r, 2000));
        execSync('netsh interface set interface "Ethernet" enable', { timeout: 10000 });
        await new Promise(r => setTimeout(r, 3000));

        // Verify
        const recheck = await httpGet(ACER_BUS + "/behcs/health", 5000);
        if (recheck) {
          log({ event: "REBIND_SUCCESS", attempt: rebindAttempts });
        } else {
          log({ event: "REBIND_FAILED", attempt: rebindAttempts });
        }
      } catch(e) {
        log({ event: "REBIND_ERROR", error: e.message, attempt: rebindAttempts });
      }
    }

    // After 6 consecutive failures, escalate
    if (consecutiveFailures === 6) {
      // Try to reach bus via alternative path (wifi) to report
      const wifiBus = "http://192.168.15.189:4947";
      await httpPost(wifiBus + "/behcs/send", {
        from: "liris", to: "asolaria", verb: "behcs.tunnel.escalation",
        tuple: ["liris", "behcs.tunnel.escalation", "asolaria", 3, "colony", "hookwall", "escalating", ["TUNNEL-DOWN", "6-consecutive", "REBIND-FAILED"], "single", "LX", "signed", "instant", "wifi-fallback", "massive"],
        text: "ESCALATION: ethernet tunnel down 6 consecutive checks. Rebind attempted. Sending via WiFi fallback.",
        version: "behcs-v1"
      }).catch(() => {
        // WiFi also dead — log locally only
        log({ event: "TOTAL_ISOLATION", consecutive: consecutiveFailures, note: "both ethernet and wifi paths dead" });
      });
    }
  }
}

// Start
log({ event: "START", check_interval_ms: CHECK_INTERVAL, acer: ACER_DIRECT, liris: LIRIS_ETH });
console.log("BEHCS tunnel watchdog LIVE — checking " + ACER_DIRECT + " every " + (CHECK_INTERVAL/1000) + "s");
checkTunnel();
setInterval(checkTunnel, CHECK_INTERVAL);

process.on("uncaughtException", (e) => { log({ event: "UNCAUGHT", error: e.message }); });
