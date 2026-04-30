#!/usr/bin/env node
// peer-handshake-respond.mjs — WO L11 (id=6c585df132752474)
// Mirror of acer's D15 peer-handshake protocol. Polls acer hub for
// HANDSHAKE_HELLO envelopes targeted at liris, verifies sig, replies with
// signed HANDSHAKE_ACK, persists per-peer handshake records (auditable, append-only).
// named_agent: liris-cascade-W4-4-L11-handshake-responder
// D11=ASSUMED. node:fs + node:http + node:crypto only.

import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import crypto from "node:crypto";
import { buildSignedEnvelope, LIRIS_KEY_ID } from "./bus-sign.mjs";
import { verifyEnvelopeSig } from "./bus-verify.mjs";
import { retryWithBackoff } from "./retry-with-backoff.mjs";

const ACER_HOST = "192.168.100.1";
const ACER_PORT = 4947;
const HUB_ENDPOINT = `http://${ACER_HOST}:${ACER_PORT}`;
const SEND_PATH = "/behcs/send";
const INBOX_PATH = "/behcs/inbox";
const STATE_PATH = "C:/Users/rayss/Asolaria/data/behcs/state/peer-handshakes.json";
const CANON_DEPLOY_PATH = "C:/Users/rayss/Asolaria/data/behcs/canon-deployment-state.json";
const OPERATOR_FIRST_MSG_PATH = "C:/Users/rayss/Asolaria/OPERATOR-FIRST-MESSAGE.txt";
const POLL_INTERVAL_MS = 30000;
const MAX_CONSECUTIVE_FAILS = 5;
const LIRIS_ROLE = "poll-client";

const nowIso = () => new Date().toISOString();
const rid = () => crypto.randomBytes(16).toString("hex");
const readJsonSafe = (p, fb) => { try { return JSON.parse(fs.readFileSync(p, "utf-8")); } catch { return fb; } };

function atomicWriteJson(p, obj) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const tmp = p + ".tmp." + process.pid + "." + Date.now();
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2));
  fs.renameSync(tmp, p);
}

function getCurrentCanonVersion() {
  const dep = readJsonSafe(CANON_DEPLOY_PATH, null);
  if (dep && dep.peers && dep.peers.acer && dep.peers.acer.last_loaded_canon_version) {
    return dep.peers.acer.last_loaded_canon_version;
  }
  try {
    const head = fs.readFileSync(OPERATOR_FIRST_MSG_PATH, "utf-8").split("\n", 2)[0];
    const m = head.match(/PRIME-INFRA-PRELOADED:(v[\w.-]+)/);
    if (m) return m[1];
  } catch {}
  return "unknown";
}

function loadState() {
  return readJsonSafe(STATE_PATH, { peers: {}, updated_at: nowIso() });
}

function persistAck(state, peerKey, helloEnv, helloVerdict, ackEnv) {
  const prior = state.peers[peerKey] || {};
  const next = {
    last_hello_id: helloEnv.id || null,
    last_hello_ts: helloEnv.ts || null,
    last_hello_sig_verdict: helloVerdict,
    last_ack_id: ackEnv.id,
    last_ack_ts: ackEnv.ts,
    ack_count: (prior.ack_count || 0) + 1,
    first_handshake_at: prior.first_handshake_at || nowIso(),
  };
  if (helloVerdict === "UNSIGNED") next.unsigned = true;
  state.peers[peerKey] = next;
  state.updated_at = nowIso();
  atomicWriteJson(STATE_PATH, state);
}

function httpReq(opts, bodyStr) {
  return new Promise((resolve) => {
    const req = http.request(opts, (res) => {
      let body = "";
      res.on("data", (c) => body += c);
      res.on("end", () => {
        let parsed; try { parsed = JSON.parse(body); } catch { parsed = body; }
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, body: parsed });
      });
    });
    req.on("error", (e) => resolve({ ok: false, error: e.message }));
    req.on("timeout", () => { req.destroy(); resolve({ ok: false, error: "timeout" }); });
    req.setTimeout(15000);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function pollInbox(sinceTs) {
  const qs = new URLSearchParams({ target: "liris", verb: "HANDSHAKE_HELLO", last: "20" });
  if (sinceTs) qs.set("since", sinceTs);
  const opts = {
    host: ACER_HOST, port: ACER_PORT,
    path: `${INBOX_PATH}?${qs.toString()}`,
    method: "GET", timeout: 15000,
    headers: { "Accept": "application/json" },
  };
  const r = await httpReq(opts, null);
  if (!r.ok) return { ok: false, error: r.error || `status=${r.status}` };
  const items = Array.isArray(r.body)
    ? r.body
    : (r.body && Array.isArray(r.body.messages) ? r.body.messages
      : (r.body && Array.isArray(r.body.items) ? r.body.items : []));
  return { ok: true, items };
}

async function postAck(envStr) {
  const opts = {
    host: ACER_HOST, port: ACER_PORT, path: SEND_PATH,
    method: "POST", timeout: 15000,
    headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(envStr) },
  };
  return httpReq(opts, envStr);
}

function buildAckEnvelope(helloEnv, canonVersion) {
  const id = rid();
  const ts = nowIso();
  const inReplyTo = helloEnv.id || null;
  const payload = {
    from: "liris", to: "acer",
    in_reply_to: inReplyTo,
    sig_key_id: LIRIS_KEY_ID,
    bus_version: "unknown",
    current_canon_version: canonVersion,
    liris_role: LIRIS_ROLE,
    hub_endpoint: HUB_ENDPOINT,
  };
  const manifest = { id, ts, in_reply_to: inReplyTo, sig_key_id: LIRIS_KEY_ID };
  const signed = buildSignedEnvelope(manifest, LIRIS_KEY_ID);
  return {
    id, ts, from: "liris", to: "acer",
    type: "HANDSHAKE_ACK", verb: "EVT-HANDSHAKE-ACK",
    payload,
    body: { signed_envelope: signed.signed_envelope },
    cube: { D1_ACTOR: "liris", D3_TARGET: "acer", D15_AUTHORITY: "peer-handshake", D20_TIME: ts },
  };
}

async function handleOnce(state) {
  const acerRec = state.peers.acer || {};
  const since = acerRec.last_hello_ts || null;
  const pr = await pollInbox(since);
  if (!pr.ok) return { ok: false, error: pr.error, replied: 0 };
  const items = pr.items;
  let replied = 0;
  const seenIds = new Set([acerRec.last_hello_id].filter(Boolean));
  const canonVersion = getCurrentCanonVersion();
  for (const env of items) {
    const eid = env.id || env.envelope_id;
    if (!eid || seenIds.has(eid)) continue;
    seenIds.add(eid);
    const verdictResult = verifyEnvelopeSig(env);
    const verdict = verdictResult.verdict;
    if (verdict === "TAMPERED") {
      console.error(JSON.stringify({ event: "hello-tampered", id: eid, reason: verdictResult.reason }));
      continue;
    }
    const peerKey = (env.from === "acer") ? "acer" : (env.from || "acer");
    const ack = buildAckEnvelope(env, canonVersion);
    const ackStr = JSON.stringify(ack);
    const wrapped = await retryWithBackoff(() => postAck(ackStr), { label: "handshake-ack", max_attempts: 5 });
    const r = wrapped.result || { ok: false };
    if (!r.ok) {
      console.error(JSON.stringify({ event: "ack-post-failed", hello_id: eid, ack_id: ack.id, error: r.error, status: r.status }));
      continue;
    }
    persistAck(state, peerKey, env, verdict, ack);
    replied += 1;
    console.log(JSON.stringify({ event: "ack-sent", hello_id: eid, ack_id: ack.id, verdict, peer: peerKey }));
  }
  return { ok: true, replied, scanned: items.length };
}

function printList() {
  const state = loadState();
  const rows = Object.entries(state.peers || {});
  if (!rows.length) { console.log("(no handshakes persisted yet)"); return; }
  console.log("peer                | last_hello_id                    | verdict   | ack_count | last_ack_ts");
  console.log("--------------------+----------------------------------+-----------+-----------+----------------------------");
  for (const [k, v] of rows) {
    const id = (v.last_hello_id || "").padEnd(32).slice(0, 32);
    console.log(`${k.padEnd(20)}| ${id} | ${(v.last_hello_sig_verdict || "?").padEnd(9)} | ${String(v.ack_count || 0).padEnd(9)} | ${v.last_ack_ts || ""}`);
  }
  console.log(`updated_at: ${state.updated_at}`);
}

async function loopForever() {
  let consecutiveFails = 0;
  for (;;) {
    const state = loadState();
    const r = await handleOnce(state);
    if (!r.ok) {
      consecutiveFails += 1;
      console.error(JSON.stringify({ event: "poll-failed", consecutive: consecutiveFails, error: r.error }));
      if (consecutiveFails >= MAX_CONSECUTIVE_FAILS) {
        console.error(JSON.stringify({ event: "exit-2-poll-fails-exceeded", limit: MAX_CONSECUTIVE_FAILS }));
        process.exit(2);
      }
    } else {
      consecutiveFails = 0;
    }
    await new Promise((res) => setTimeout(res, POLL_INTERVAL_MS));
  }
}

const argv = process.argv.slice(2);
if (argv.includes("--list")) {
  printList(); process.exit(0);
} else if (argv.includes("--once")) {
  const state = loadState();
  handleOnce(state).then((r) => {
    console.log(JSON.stringify({ mode: "once", ...r }, null, 2));
    process.exit(r.ok ? 0 : 1);
  });
} else {
  loopForever();
}
