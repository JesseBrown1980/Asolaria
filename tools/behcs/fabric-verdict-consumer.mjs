#!/usr/bin/env node
// fabric-verdict-consumer.mjs
//
// Closes the liris-side of the T2 fabric-query loop:
//   acer auto-fabric-query-daemon emits EVT-FABRIC-QUERY-VERDICT
//   ↓
//   liris fabric-verdict-consumer reads them, links to original
//   EVT-FABRIC-QUERY-REQUEST (via in_reply_to), reads the original prediction,
//   and routes per verdict:
//       APPROVE → re-dispatch the prediction as T1 (signed envelope to acer)
//       HALT    → log + skip
//       NO_CONVERGENCE → log + leave pending (next round may converge)
//   ↓
//   appends to logs/fabric-verdict-consumer.log.ndjson
//   tracks processed ids in data/behcs/state/fabric-verdict-consumer-cursor.json
//
// Per fabric-decides-instant + tick-10/12 T2 path bilateral closure.
// named_agent: liris-fabric-verdict-consumer

import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import crypto from "node:crypto";
import { buildSignedEnvelope, LIRIS_KEY_ID } from "./bus-sign.mjs";

const ACER_HUB = "http://192.168.100.1:4947";
const ACER_BUS = `${ACER_HUB}/behcs/send`;
// Acer's daemon emits verdicts with to: acer (internal consumption); liris
// reads them by verb to catch any verdict whose in_reply_to matches a
// liris-emitted REQUEST (linkage check below filters non-liris-origin).
const VERDICT_QUERY = `${ACER_HUB}/behcs/inbox?verb=EVT-FABRIC-QUERY-VERDICT&last=200`;
const REQUEST_LOOKUP = `${ACER_HUB}/behcs/inbox?from=liris&verb=EVT-FABRIC-QUERY-REQUEST&last=200`;
const CURSOR_PATH = "C:/Users/rayss/Asolaria/data/behcs/state/fabric-verdict-consumer-cursor.json";
const LOG_PATH = "C:/Users/rayss/Asolaria/logs/fabric-verdict-consumer.log.ndjson";

function readJsonSafe(p, def = {}) { try { return JSON.parse(fs.readFileSync(p, "utf-8")); } catch { return def; } }
function writeJsonAtomic(p, obj) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p + ".tmp", JSON.stringify(obj, null, 2));
  fs.renameSync(p + ".tmp", p);
}
function appendLog(row) {
  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
  fs.appendFileSync(LOG_PATH, JSON.stringify(row) + "\n");
}

function httpGet(url) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const req = http.get({ host: u.hostname, port: u.port, path: u.pathname + u.search, timeout: 10000 }, (res) => {
      let body = ""; res.on("data", c => body += c);
      res.on("end", () => { try { resolve(JSON.parse(body)); } catch { resolve(null); } });
    });
    req.on("error", () => resolve(null));
    req.on("timeout", () => { req.destroy(); resolve(null); });
  });
}

async function dispatchT1Reroute(prediction, sourceVerdictId) {
  const ts = new Date().toISOString();
  const envId = crypto.createHash("sha256").update(`gnn-T2-approved-rerun-${prediction.pid ?? "?"}-${ts}`).digest("hex").slice(0, 32);
  const env = {
    id: envId, ts, from: "liris", to: prediction.to ?? "acer", mode: "real",
    type: "GNN_PREDICTED_ACTION_T2_APPROVED",
    verb: prediction.verb ?? "EVT-GNN-PREDICTED-ACTION",
    payload: { ...prediction, tier: "T2-approved", auto_fire_authority: "fabric-verdict-approve cosign seq=43", source_verdict: sourceVerdictId },
    sig_owner: LIRIS_KEY_ID,
  };
  const manifest = { id: env.id, ts, from: env.from, to: env.to, type: env.type, verb: env.verb, source_verdict: sourceVerdictId };
  const { signed_envelope } = buildSignedEnvelope(manifest, LIRIS_KEY_ID);
  const body = JSON.stringify({ ...env, body: { signed_envelope } });
  const url = new URL(ACER_BUS);
  return new Promise((r) => {
    const req = http.request({ host: url.hostname, port: url.port, path: url.pathname, method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) }, timeout: 15000 },
      (res) => { let b=""; res.on("data",c=>b+=c); res.on("end",()=>{let p;try{p=JSON.parse(b);}catch{p=b;} r({ envelope_id: envId, status: res.statusCode, body: p });}); });
    req.on("error", e => r({ envelope_id: envId, error: e.message }));
    req.on("timeout", () => { req.destroy(); r({ envelope_id: envId, error: "timeout" }); });
    req.write(body); req.end();
  });
}

function classifyVerdict(verdictPayload) {
  // Simple heuristic; refine when council-vote schema stabilizes:
  //   high voted_count + non-empty dominant_domains + no halt keyword → APPROVE
  //   any halt/forbidden in convergence_text → HALT
  //   low voted_count or no convergence → NO_CONVERGENCE
  const voted = verdictPayload.voted_count ?? verdictPayload.votes ?? 0;
  const txt = (verdictPayload.convergence_text ?? verdictPayload.summary ?? "").toLowerCase();
  if (txt.includes("halt") || txt.includes("forbidden") || txt.includes("reject")) return "HALT";
  if (voted >= 5 && verdictPayload.dominant_domains?.length > 0) return "APPROVE";
  return "NO_CONVERGENCE";
}

async function tick() {
  const cursor = readJsonSafe(CURSOR_PATH, { processed_verdict_ids: [] });
  const seen = new Set(cursor.processed_verdict_ids ?? []);

  const verdictsResp = await httpGet(VERDICT_QUERY);
  const verdicts = (verdictsResp?.messages ?? []).filter(v => !seen.has(v.id));

  if (verdicts.length === 0) {
    appendLog({ ts: new Date().toISOString(), kind: "tick", new_verdicts: 0 });
    console.log(`[verdict-consumer] no new verdicts (${seen.size} previously processed)`);
    return { new: 0, approved: 0, halted: 0, no_convergence: 0 };
  }

  // Fetch all liris-emitted REQUEST envelopes once for in_reply_to lookup.
  const requestsResp = await httpGet(REQUEST_LOOKUP);
  const requests = new Map();
  for (const r of (requestsResp?.messages ?? [])) requests.set(r.id, r);

  let approved = 0, halted = 0, noConv = 0;
  for (const v of verdicts) {
    const payload = v.payload ?? v.body?.signed_envelope?.payload ?? {};
    const inReplyTo = payload.in_reply_to ?? v.in_reply_to;
    const origReq = inReplyTo ? requests.get(inReplyTo) : null;
    const origPrediction = origReq?.payload?.original_prediction ?? null;
    const verdict = classifyVerdict(payload);

    const row = {
      ts: new Date().toISOString(),
      verdict_envelope_id: v.id,
      in_reply_to: inReplyTo,
      verdict,
      voted_count: payload.voted_count,
      dominant_domains: payload.dominant_domains,
      orig_prediction_pid: origPrediction?.pid,
      orig_prediction_verb: origPrediction?.verb,
    };

    if (verdict === "APPROVE" && origPrediction) {
      const r = await dispatchT1Reroute(origPrediction, v.id);
      row.reroute = r;
      approved++;
      console.log(`[APPROVE] ${origPrediction.pid} → ${r.envelope_id} status=${r.status}`);
    } else if (verdict === "HALT") {
      halted++;
      console.log(`[HALT] ${origPrediction?.pid ?? "?"} verdict-text contains halt/forbidden/reject`);
    } else {
      noConv++;
      console.log(`[NO_CONV] ${origPrediction?.pid ?? "?"} voted=${payload.voted_count ?? 0}`);
    }

    appendLog(row);
    seen.add(v.id);
  }

  cursor.processed_verdict_ids = Array.from(seen).slice(-1000); // cap dedup memory
  cursor.last_run = new Date().toISOString();
  writeJsonAtomic(CURSOR_PATH, cursor);
  return { new: verdicts.length, approved, halted, no_convergence: noConv };
}

const args = process.argv.slice(2);
const watch = args.includes("--watch");
const intervalSec = (() => { const i = args.indexOf("--interval-s"); return i >= 0 ? parseInt(args[i + 1], 10) : 180; })();

if (watch) {
  console.log(`[verdict-consumer] watching every ${intervalSec}s`);
  await tick();
  setInterval(() => tick().catch(e => appendLog({ kind: "tick-error", error: e.message })), intervalSec * 1000);
} else {
  const r = await tick();
  console.log(`[verdict-consumer] one-shot done: new=${r.new} approved=${r.approved} halted=${r.halted} no_conv=${r.no_convergence}`);
}
