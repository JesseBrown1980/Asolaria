#!/usr/bin/env node
// t2-approved-ack-watcher.mjs
//
// Liris-side ACK reader for the T2 fabric-query loop.
//   acer-side daemon (proposed via EVT-T2-APPROVED-ACK-PROPOSAL) emits
//     EVT-T2-APPROVED-EXECUTED back to liris when a T2-APPROVED reroute
//     envelope is picked up + executed.
//   This watcher polls acer hub for those ACKs, links via in_reply_to to
//     the original T2-APPROVED rerouted envelope_id, and updates
//     data/behcs/state/t2-approved-tracking.json with execution status.
//
// Constraints honored:
//   - feedback_fetch_timeout_floor_5s_15s.md (5s connect / 15s read floor)
//   - feedback_orbital_routing_liris_to_falcon.md (liris -> 192.168.100.1:4947)
//   - LAW-001 (ports 4947/4950 always open)
//   - READ-ONLY against incoming envelopes; only writes are local state file.
// node:fs + node:http only. No deps.
//
// named_agent: liris-t2-approved-ack-watcher

import fs from "node:fs";
import path from "node:path";
import http from "node:http";

const HUB_HOST = "192.168.100.1";
const HUB_PORT = 4947;
const HUB_PATH = "/behcs/inbox";
const TARGET = "liris";
const VERB = "EVT-T2-APPROVED-EXECUTED";
const NAMED_AGENT = "liris-t2-approved-ack-watcher";

const ROOT = "C:/Users/rayss/Asolaria";
const STATE_DIR = path.join(ROOT, "data", "behcs", "state");
const TRACKING_FILE = path.join(STATE_DIR, "t2-approved-tracking.json");
const VERDICT_LOG = path.join(ROOT, "logs", "fabric-verdict-consumer.log.ndjson");
const LOG_FILE = path.join(ROOT, "logs", "t2-approved-ack-watcher.log");

const FETCH_LAST = 100;

function readJsonSafe(p, def) { try { return JSON.parse(fs.readFileSync(p, "utf-8")); } catch { return def; } }
function writeJsonAtomic(p, obj) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p + ".tmp", JSON.stringify(obj, null, 2));
  fs.renameSync(p + ".tmp", p);
}
function appendLog(line) {
  fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
  fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] [${NAMED_AGENT}] ${line}\n`);
}

function pollOnce() {
  return new Promise((resolve) => {
    const params = new URLSearchParams({ target: TARGET, verb: VERB, last: String(FETCH_LAST) });
    const req = http.request(
      { host: HUB_HOST, port: HUB_PORT, path: `${HUB_PATH}?${params.toString()}`, method: "GET", timeout: 15_000 },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => { try { resolve({ ok: true, data: JSON.parse(body) }); } catch (e) { resolve({ ok: false, error: `parse: ${e.message}` }); } });
      }
    );
    req.setTimeout(15_000, () => { req.destroy(); resolve({ ok: false, error: "timeout" }); });
    req.on("error", (e) => resolve({ ok: false, error: e.message }));
    req.end();
  });
}

// Build a map: rerouted_envelope_id -> { original_verdict_envelope_id, approved_at }
// from the verdict-consumer log, so we can record execution against the verdict id.
function loadVerdictRerouteIndex() {
  const idx = new Map();
  if (!fs.existsSync(VERDICT_LOG)) return idx;
  const lines = fs.readFileSync(VERDICT_LOG, "utf-8").split("\n").filter(Boolean);
  for (const l of lines) {
    let row; try { row = JSON.parse(l); } catch { continue; }
    if (row.verdict !== "APPROVE" || !row.reroute?.envelope_id) continue;
    idx.set(row.reroute.envelope_id, { verdict_envelope_id: row.verdict_envelope_id, approved_at: row.ts });
  }
  return idx;
}

async function tick() {
  const tracking = readJsonSafe(TRACKING_FILE, {});
  const rerouteIdx = loadVerdictRerouteIndex();
  const result = await pollOnce();
  if (!result.ok) { appendLog(`poll_fail: ${result.error}`); return { new: 0, error: result.error }; }
  const msgs = result.data?.messages ?? [];
  let added = 0, linked = 0, orphan = 0;
  for (const ack of msgs) {
    const payload = ack.payload ?? ack.body?.signed_envelope?.payload ?? {};
    const inReplyTo = payload.in_reply_to ?? ack.in_reply_to;
    if (!inReplyTo) { orphan++; continue; }
    const link = rerouteIdx.get(inReplyTo);
    const verdictKey = link?.verdict_envelope_id ?? inReplyTo; // fallback: key by reroute id
    if (tracking[verdictKey]?.executed_at) continue; // already recorded
    tracking[verdictKey] = {
      approved_at: link?.approved_at ?? null,
      rerouted_envelope_id: inReplyTo,
      ack_envelope_id: ack.id,
      executed_at: ack.ts ?? new Date().toISOString(),
      executed_by: ack.from ?? "acer",
      result: payload.result ?? payload.status ?? null,
    };
    added++;
    if (link) linked++;
  }
  if (added > 0) writeJsonAtomic(TRACKING_FILE, tracking);
  appendLog(`tick new=${added} linked=${linked} orphan=${orphan} acks_seen=${msgs.length} tracked_total=${Object.keys(tracking).length}`);
  return { new: added, linked, orphan, total_tracked: Object.keys(tracking).length };
}

const args = process.argv.slice(2);
const watch = args.includes("--watch");
const intervalSec = (() => { const i = args.indexOf("--interval-s"); return i >= 0 ? parseInt(args[i + 1], 10) : 60; })();

if (watch) {
  console.log(`[${NAMED_AGENT}] watch every ${intervalSec}s, hub=${HUB_HOST}:${HUB_PORT}`);
  const r = await tick(); console.log(`[boot-tick] ${JSON.stringify(r)}`);
  setInterval(() => tick().catch(e => appendLog(`tick_threw: ${e.message}`)), intervalSec * 1000);
} else {
  const r = await tick();
  console.log(JSON.stringify({ tool: "t2-approved-ack-watcher", named_agent: NAMED_AGENT, mode: "one-shot", ...r }, null, 2));
}
