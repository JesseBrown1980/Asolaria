#!/usr/bin/env node
// fed-supervisor-exercise-daemon.mjs — periodic READ-ONLY probe of the 3
// remaining ASSUMED fed-reint supervisors. Per per-host principle, liris is
// canonical for FED.REINTEGRATION namespace. Each tick checks the condition
// each authority guards; if met, emit a signed evidence envelope to the acer
// hub. Auto-promoter elevates D11 ASSUMED→OBSERVED on receipt.
//
// Probes (all READ-ONLY — no peer-side initiation):
//   GAIA.ENDPOINT  — IF a gaia endpoint is registered + reachable, emit
//                    EVT-GAIA-HELLO-ATTEST-PROBED. Else log+skip (operator-
//                    mediated channel open per feedback_no_unilateral_link).
//   FALCON.IDENTITY — read serial from device-registry.json, compare against
//                     expected R5CXA4MGQXV. If match emit EVT-FALCON-IDENTITY-VERIFIED.
//   AETHER.NONCE   — if state/aether-nonce-protocol.json exists with both
//                    nonce_in_flight + nonce_response_received, emit
//                    EVT-AETHER-NONCE-PROTOCOL-CLOSED.
//
// CLI:
//   node tools/behcs/fed-supervisor-exercise-daemon.mjs --once
//   node tools/behcs/fed-supervisor-exercise-daemon.mjs --watch --interval-s 300
//
// named_agent: liris-cascade-W7-O3-fed-supervisor-exercise-daemon

import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import crypto from "node:crypto";
import { buildSignedEnvelope, LIRIS_KEY_ID } from "./bus-sign.mjs";

const ROOT = "C:/Users/rayss/Asolaria";
const ACER_BUS = "http://192.168.100.1:4947/behcs/send";
const DEVICE_REGISTRY = path.join(ROOT, "data/behcs/device-registry.json");
const AETHER_NONCE = path.join(ROOT, "data/behcs/state/aether-nonce-protocol.json");
const LOG_PATH = path.join(ROOT, "logs/fed-supervisor-exercise.log.ndjson");

const FALCON_EXPECTED_SERIAL = "R5CXA4MGQXV";
const FALCON_EXPECTED_ROLE = "orbital";

const SUPERVISOR_PIDS = {
  GAIA: "BH.SUPERVISOR.PID.FED.REINTEGRATION.GAIA.ENDPOINT",
  FALCON: "BH.SUPERVISOR.PID.FED.REINTEGRATION.FALCON.IDENTITY",
  AETHER: "BH.SUPERVISOR.PID.FED.REINTEGRATION.AETHER.NONCE",
};

const args = process.argv.slice(2);
const ONCE = args.includes("--once");
const WATCH = args.includes("--watch");
const INTERVAL_S = (() => { const i = args.indexOf("--interval-s"); return i >= 0 ? parseInt(args[i + 1], 10) : 300; })();

function appendLog(row) {
  try {
    fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
    fs.appendFileSync(LOG_PATH, JSON.stringify(row) + "\n");
  } catch (e) { process.stderr.write(`[log] ${e.message}\n`); }
}

function readJson(p) { try { return JSON.parse(fs.readFileSync(p, "utf-8")); } catch { return null; } }

function probeHttp(urlStr, timeoutMs = 5000) {
  return new Promise((resolve) => {
    let url; try { url = new URL(urlStr); } catch { return resolve({ ok: false, error: "bad-url" }); }
    const req = http.get({ host: url.hostname, port: url.port, path: url.pathname + url.search, timeout: timeoutMs }, (res) => {
      let body = ""; res.on("data", (c) => body += c);
      res.on("end", () => resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, body: body.slice(0, 400) }));
    });
    req.on("error", (e) => resolve({ ok: false, error: e.message }));
    req.on("timeout", () => { req.destroy(); resolve({ ok: false, error: "timeout" }); });
  });
}

async function dispatch(verb, supervisorPid, payload) {
  const ts = new Date().toISOString();
  const id = crypto.createHash("sha256").update(verb + supervisorPid + ts + Math.random()).digest("hex").slice(0, 32);
  const manifest = { id, ts, from: "liris", to: "acer", type: "FED_SUPERVISOR_EXERCISE", verb, exercises_supervisor: supervisorPid };
  const { signed_envelope } = buildSignedEnvelope(manifest, LIRIS_KEY_ID);
  const env = { id, ts, from: "liris", to: "acer", mode: "real", type: "FED_SUPERVISOR_EXERCISE", verb, exercises_supervisor: supervisorPid, payload, sig_owner: LIRIS_KEY_ID };
  const body = JSON.stringify({ ...env, body: { signed_envelope } });
  const url = new URL(ACER_BUS);
  return new Promise((resolve) => {
    const req = http.request({ host: url.hostname, port: url.port, path: url.pathname, method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) }, timeout: 15000 }, (res) => {
      let b = ""; res.on("data", (c) => b += c);
      res.on("end", () => resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, id }));
    });
    req.on("error", (e) => resolve({ ok: false, error: e.message, id }));
    req.on("timeout", () => { req.destroy(); resolve({ ok: false, error: "timeout", id }); });
    req.write(body); req.end();
  });
}

async function probeGaia() {
  const reg = readJson(DEVICE_REGISTRY);
  const gaia = reg?.devices?.gaia;
  if (!gaia || !Array.isArray(gaia.endpoints) || gaia.endpoints.length === 0) {
    return { skip: "no_gaia_endpoint_registered", note: "Per feedback_no_unilateral_federation_link_severance: only operators authorize new channels. No-op until operator registers gaia endpoint." };
  }
  const live = gaia.endpoints.find((e) => e.url && /^https?:\/\//.test(e.url) && e.kind !== "loopback" && e.status !== "stale");
  if (!live) return { skip: "no_live_gaia_endpoint" };
  const probeUrl = live.url.replace(/\/$/, "") + "/behcs/health";
  const result = await probeHttp(probeUrl, 5000);
  if (!result.ok) return { skip: "gaia_endpoint_unreachable", probed: probeUrl, error: result.error ?? `http-${result.status}` };
  return { fire: true, payload: { supervisor: SUPERVISOR_PIDS.GAIA, authority: "halt_gaia_until_endpoint_identity", probed_url: probeUrl, http_status: result.status, evidence_kind: "endpoint_reachable_read_only" } };
}

function probeFalcon() {
  const reg = readJson(DEVICE_REGISTRY);
  const falcon = reg?.devices?.falcon;
  if (!falcon) return { skip: "falcon_not_in_registry" };
  const serial = falcon.adb_serial;
  const role = falcon.role;
  if (serial !== FALCON_EXPECTED_SERIAL) return { skip: "serial_mismatch", got: serial, expected: FALCON_EXPECTED_SERIAL };
  if (role !== FALCON_EXPECTED_ROLE) return { skip: "role_mismatch", got: role, expected: FALCON_EXPECTED_ROLE };
  return { fire: true, payload: { supervisor: SUPERVISOR_PIDS.FALCON, authority: "halt_falcon_until_role_serial_match", serial, role, registry_path: DEVICE_REGISTRY, evidence_kind: "registry_read_only_match" } };
}

function probeAether() {
  if (!fs.existsSync(AETHER_NONCE)) return { skip: "no_nonce_protocol_file", path: AETHER_NONCE };
  const j = readJson(AETHER_NONCE);
  if (!j) return { skip: "nonce_protocol_unparsable" };
  if (!j.nonce_in_flight) return { skip: "no_nonce_in_flight" };
  if (!j.nonce_response_received) return { skip: "nonce_response_not_yet_received", nonce_id: j.nonce_id };
  return { fire: true, payload: { supervisor: SUPERVISOR_PIDS.AETHER, authority: "defer_aether_live_until_nonce_response", nonce_id: j.nonce_id, issued_at: j.issued_at, response_at: j.response_received_at, evidence_kind: "nonce_round_closed" } };
}

async function tick() {
  const ts = new Date().toISOString();
  const results = { ts, probes: {} };

  const probes = [
    { key: "GAIA.ENDPOINT", verb: "EVT-GAIA-HELLO-ATTEST-PROBED", pid: SUPERVISOR_PIDS.GAIA, fn: probeGaia },
    { key: "FALCON.IDENTITY", verb: "EVT-FALCON-IDENTITY-VERIFIED", pid: SUPERVISOR_PIDS.FALCON, fn: probeFalcon },
    { key: "AETHER.NONCE", verb: "EVT-AETHER-NONCE-PROTOCOL-CLOSED", pid: SUPERVISOR_PIDS.AETHER, fn: probeAether },
  ];

  for (const p of probes) {
    let res; try { res = await p.fn(); } catch (e) { res = { skip: "probe_threw", error: e.message }; }
    if (res?.fire) {
      const dr = await dispatch(p.verb, p.pid, res.payload);
      results.probes[p.key] = { fired: true, envelope_id: dr.id, dispatch_ok: dr.ok, dispatch_status: dr.status, dispatch_error: dr.error };
      console.log(`[${p.key}] FIRED verb=${p.verb} envelope=${dr.id} dispatch_ok=${dr.ok}`);
    } else {
      results.probes[p.key] = { fired: false, skip_reason: res?.skip ?? "unknown", detail: res };
      console.log(`[${p.key}] SKIP reason=${res?.skip ?? "unknown"}`);
    }
  }

  appendLog(results);
  return results;
}

let stopped = false;
function shutdown() { if (stopped) return; stopped = true; console.log("\n[fed-supervisor-exercise] shutdown"); appendLog({ ts: new Date().toISOString(), kind: "shutdown" }); process.exit(0); }
process.on("SIGINT", shutdown); process.on("SIGTERM", shutdown);

if (WATCH && !ONCE) {
  console.log(`[fed-supervisor-exercise] --watch every ${INTERVAL_S}s. Ctrl+C to stop.`);
  await tick();
  setInterval(() => { tick().catch((e) => appendLog({ ts: new Date().toISOString(), kind: "tick_error", error: e.message })); }, INTERVAL_S * 1000);
} else {
  const r = await tick();
  const fired = Object.entries(r.probes).filter(([, v]) => v.fired).map(([k]) => k);
  const skipped = Object.entries(r.probes).filter(([, v]) => !v.fired).map(([k, v]) => `${k}(${v.skip_reason})`);
  console.log(`\n[summary] fired=[${fired.join(",")}] skipped=[${skipped.join(", ")}]`);
  process.exit(0);
}
