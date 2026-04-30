"use strict";
/**
 * haoc-watcher.js — LX-490 STAGE_1 implementation
 *
 * Hardware Absorption Omnidirectional Cube watcher.
 * Cube: 97^3 = 912673. Dim: D21_HARDWARE + D14_BIOLOGICAL.
 *
 * Built 2026-04-07 per rayssa "yes begin approve all" + jesse ceremonial.
 *
 * Scope v0:
 *   - 3 detection sources: ADB devices, LAN ARP diff, Win32 PnP diff
 *   - 15000ms polling interval (no event hook, pure poll)
 *   - Read-only: classifies + logs + registers; DOES NOT mount, auto-read, auto-trigger scrcpy
 *   - NOVALUM SHIELD enforced at fingerprint step
 *   - KILL_UNIT_<unit_id> + KILL_ALL_HAOC flag file mechanism
 *   - No cross-host broadcast in v0 (that's LX-490 STAGE_3)
 *
 * Runtime:
 *   - `node tools/omni-processor/haoc-watcher.js`  (foreground test)
 *   - `node tools/omni-processor/haoc-watcher.js &` (background sidecar)
 *
 * Log: logs/haoc-absorption.ndjson
 * Kill switches:
 *   - delete data/vault/owner/omni-processor/HAOC_ENABLED to stop absorption (watcher keeps polling but won't add entries)
 *   - create data/vault/owner/omni-processor/KILL_ALL_HAOC to stop the process
 *   - create data/vault/owner/omni-processor/KILL_UNIT_<unit_id> to mark a specific unit as revoked
 *
 * NOT YET WIRED TO: registry broadcast, gnn fingerprinting (stub hash used in v0).
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const ASOLARIA_ROOT = path.resolve(__dirname, "..", "..");
const LOG_DIR = path.join(ASOLARIA_ROOT, "logs");
const LOG_FILE = path.join(LOG_DIR, "haoc-absorption.ndjson");
const VAULT_DIR = path.join(ASOLARIA_ROOT, "data", "vault", "owner", "omni-processor");
const HAOC_ENABLED_FLAG = path.join(VAULT_DIR, "HAOC_ENABLED");
const KILL_ALL_FLAG = path.join(VAULT_DIR, "KILL_ALL_HAOC");
const REGISTRY_FILE = path.join(ASOLARIA_ROOT, "data", "omni-processor", "units-registry.json");
const ABSORBED_STATE_FILE = path.join(ASOLARIA_ROOT, "data", "omni-processor", "haoc", "absorbed-units-state.json");

const POLL_INTERVAL_MS = 15000;
const HOST = os.hostname();
const SURFACE_ID = "liris-kuromi";
const CUBE = "97^3 = 912673";
const CHAIN = "LX-490";

// NOVALUM SHIELD — hard pattern match
const NOVALUM_PATTERNS = [/^novalum-/i, /novalum/i];

// Prime cubes already consumed by liris-side (from registry + session). HAOC will pick next unused.
// This is a v0 static list; a proper implementation would query the registry dynamically.
const CONSUMED_PRIME_CUBES = new Set([
  125, 343, 1331, 2197, 4913, 6859, 12167, 29791, 50653, 68921,
  79507, 103823, 148877, 205379, 226981, 300763, 389017, 493039, 704969,
  912673, 1030301
]);
// Available primes (start scanning from 103)
const ABSORPTION_CUBE_POOL_START_PRIME = 103;

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function log(entry) {
  ensureDir(LOG_DIR);
  fs.appendFileSync(LOG_FILE, JSON.stringify({ ...entry, ts: new Date().toISOString(), chain: CHAIN, host: HOST, surface_id: SURFACE_ID }) + "\n");
}

function loadAbsorbedState() {
  if (!fs.existsSync(ABSORBED_STATE_FILE)) return { units: {}, last_scan: null };
  try { return JSON.parse(fs.readFileSync(ABSORBED_STATE_FILE, "utf8")); }
  catch (e) { return { units: {}, last_scan: null }; }
}

function saveAbsorbedState(state) {
  ensureDir(path.dirname(ABSORBED_STATE_FILE));
  fs.writeFileSync(ABSORBED_STATE_FILE, JSON.stringify(state, null, 2));
}

function isEnabled() {
  return fs.existsSync(HAOC_ENABLED_FLAG);
}

function killAllSignaled() {
  return fs.existsSync(KILL_ALL_FLAG);
}

function killUnitSignaled(unit_id) {
  return fs.existsSync(path.join(VAULT_DIR, "KILL_UNIT_" + unit_id));
}

function isNovalumMatch(descriptor) {
  const text = JSON.stringify(descriptor).toLowerCase();
  return NOVALUM_PATTERNS.some(p => p.test(text));
}

function nextPrime(n) {
  const isPrime = x => {
    if (x < 2) return false;
    if (x < 4) return true;
    if (x % 2 === 0) return false;
    for (let i = 3; i * i <= x; i += 2) if (x % i === 0) return false;
    return true;
  };
  let p = n;
  while (true) {
    p += 1;
    if (isPrime(p)) return p;
  }
}

function proposeCube() {
  let p = ABSORPTION_CUBE_POOL_START_PRIME - 1;
  for (let i = 0; i < 100; i++) {
    p = nextPrime(p);
    const c = p * p * p;
    if (!CONSUMED_PRIME_CUBES.has(c)) {
      CONSUMED_PRIME_CUBES.add(c); // reserve locally
      return { prime: p, cube: c };
    }
  }
  return null;
}

function fingerprint(descriptor) {
  // v0 stub: sha256 of canonical descriptor JSON. Production would call gnnConstructionWatcher projection.
  const canonical = JSON.stringify(descriptor, Object.keys(descriptor).sort());
  return "sha256:" + crypto.createHash("sha256").update(canonical).digest("hex");
}

// ─── Detection sources ────────────────────────────────────────────────────

function detectAdb() {
  try {
    const out = execFileSync("adb", ["devices", "-l"], { encoding: "utf8", timeout: 5000 });
    const lines = out.split(/\r?\n/).filter(l => l.trim() && !l.startsWith("List of"));
    return lines.map(l => {
      const parts = l.trim().split(/\s+/);
      return {
        source: "adb",
        kind: "phone",
        raw: l.trim(),
        serial: parts[0] || "unknown",
        state: parts[1] || "unknown"
      };
    }).filter(d => d.state === "device" || d.state === "unauthorized");
  } catch (e) {
    return [];
  }
}

function detectLanArp() {
  try {
    const out = execFileSync("arp", ["-a"], { encoding: "utf8", timeout: 5000 });
    const hosts = [];
    for (const line of out.split(/\r?\n/)) {
      const m = line.match(/^\s*(\d+\.\d+\.\d+\.\d+)\s+([0-9a-fA-F-]{17})/);
      if (m) {
        const ip = m[1];
        const mac = m[2];
        // Skip broadcast/multicast
        if (mac.startsWith("ff-ff") || mac.startsWith("01-00-5e")) continue;
        hosts.push({ source: "lan_arp", kind: "lan_host", raw: ip + " " + mac, ipv4: ip, mac: mac });
      }
    }
    return hosts;
  } catch (e) {
    return [];
  }
}

function detectWin32Pnp() {
  try {
    const out = execFileSync(
      "powershell.exe",
      ["-NoProfile", "-Command",
        "Get-PnpDevice -PresentOnly | Where-Object {$_.Status -eq 'OK'} | Select-Object InstanceId,Class,FriendlyName | ConvertTo-Json -Compress"
      ],
      { encoding: "utf8", timeout: 8000, maxBuffer: 4 * 1024 * 1024 }
    );
    const parsed = JSON.parse(out.trim());
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    return arr.map(d => ({
      source: "win32_pnp",
      kind: (d.Class || "unknown").toLowerCase(),
      raw: d.InstanceId,
      friendly_name: d.FriendlyName,
      class: d.Class
    }));
  } catch (e) {
    return [];
  }
}

// ─── Main loop ────────────────────────────────────────────────────────────

function tick() {
  if (killAllSignaled()) {
    log({ verb: "haoc.kill_all_signaled", action: "shutdown" });
    console.log("[haoc-watcher] KILL_ALL_HAOC signaled, shutting down");
    process.exit(0);
  }

  const enabled = isEnabled();
  const state = loadAbsorbedState();
  state.last_scan = new Date().toISOString();

  const allDetections = [
    ...detectAdb(),
    ...detectLanArp(),
    ...detectWin32Pnp()
  ];

  let newCount = 0;
  let shieldedCount = 0;
  let killedCount = 0;
  let alreadyKnownCount = 0;

  for (const d of allDetections) {
    const fp = fingerprint(d);
    const descriptor = { source: d.source, kind: d.kind, fingerprint: fp, raw: d.raw };

    // NOVALUM SHIELD check
    if (isNovalumMatch(d)) {
      if (!state.units[fp] || !state.units[fp].shielded) {
        log({ verb: "haoc.shielded", fingerprint: fp, source: d.source, kind: d.kind, reason: "novalum_pattern_match" });
        shieldedCount++;
      }
      state.units[fp] = { ...descriptor, shielded: true, last_seen: state.last_scan };
      continue;
    }

    // Already known?
    if (state.units[fp]) {
      state.units[fp].last_seen = state.last_scan;
      alreadyKnownCount++;
      // KILL_UNIT check
      const unit_id = state.units[fp].unit_id;
      if (unit_id && killUnitSignaled(unit_id)) {
        log({ verb: "haoc.unit_killed", unit_id, fingerprint: fp });
        state.units[fp].revoked = true;
        killedCount++;
      }
      continue;
    }

    // New — absorb (only if HAOC_ENABLED flag exists)
    if (!enabled) {
      log({ verb: "haoc.detected_not_absorbed", fingerprint: fp, source: d.source, kind: d.kind, reason: "HAOC_ENABLED_flag_absent" });
      continue;
    }

    const cube = proposeCube();
    if (!cube) {
      log({ verb: "haoc.cube_pool_exhausted", fingerprint: fp });
      continue;
    }

    const unit_id = "haoc." + d.source + "." + fp.slice(7, 15);
    const absorbed = {
      ...descriptor,
      unit_id,
      absorbed_at: state.last_scan,
      cube_assigned: cube.cube,
      cube_prime: cube.prime,
      cube_law: cube.prime + "^3 = " + cube.cube,
      provenance: "absorbed_via_HAOC@" + HOST + "@" + state.last_scan,
      shielded: false,
      revoked: false
    };
    state.units[fp] = absorbed;
    log({ verb: "haoc.absorbed", unit_id, cube: cube.cube, source: d.source, kind: d.kind });
    console.log("[haoc-watcher] absorbed unit " + unit_id + " cube=" + cube.cube + " kind=" + d.kind);
    newCount++;
  }

  saveAbsorbedState(state);
  log({
    verb: "haoc.scan_complete",
    detections: allDetections.length,
    new: newCount,
    shielded: shieldedCount,
    already_known: alreadyKnownCount,
    killed: killedCount,
    enabled
  });
}

console.log("[haoc-watcher] starting — interval=" + POLL_INTERVAL_MS + "ms enabled_flag=" + HAOC_ENABLED_FLAG);
console.log("[haoc-watcher] chain=" + CHAIN + " cube=" + CUBE + " host=" + HOST);
console.log("[haoc-watcher] v0: no auto-mount, no auto-read, no cross-host broadcast, no scrcpy trigger");
console.log("[haoc-watcher] novalum shield: HARD, human in loop: constitutional, kill switches: KILL_ALL_HAOC + KILL_UNIT_<id>");

tick(); // initial scan
const timer = setInterval(tick, POLL_INTERVAL_MS);

function shutdown(sig) {
  console.log("[haoc-watcher] " + sig + " received");
  clearInterval(timer);
  process.exit(0);
}
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
