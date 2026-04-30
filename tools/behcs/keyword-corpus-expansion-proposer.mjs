#!/usr/bin/env node
// keyword-corpus-expansion-proposer.mjs — liris-domain proposer.
//
// named_agent: liris-cascade-W6-1-keyword-corpus-expansion
// Mines local cosign chain + outbox + inbox for verb subjects, identifies
// underserved subjects (those whose tokens don't match common keyword classes),
// proposes synonym keywords, signs an EVT-FABRIC-CORPUS-PROPOSAL envelope, and
// dispatches to acer's bus. Acer's auto-fabric-query-daemon council-votes it.
// Liris proposes; acer decides. Per-host canonical principle honored.

import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { buildSignedEnvelope, LIRIS_KEY_ID } from "./bus-sign.mjs";

const CHAIN = path.join(os.homedir(), ".claude", "projects", "C--", "memory", "COSIGN_CHAIN.ndjson");
const OUTBOX = "C:/Users/rayss/Asolaria/data/behcs/outbox.ndjson";
const INBOX = "C:/Users/rayss/Asolaria/data/behcs-inbox.ndjson";
const ACER_BUS = "http://192.168.100.1:4947/behcs/send";
const CHAIN_CAP = 100, OUTBOX_CAP = 200, INBOX_CAP = 200;

const KEYWORD_CLASSES = {
  handshake: ["handshake", "hello", "attest", "peer", "sentinel", "identity", "profile", "ack"],
  canon: ["canon", "preamble", "first-message", "preload", "reassert", "operator"],
  federation: ["federation", "bilateral", "cross-host", "lan", "route", "orbital"],
  supervisor: ["supervisor", "watchdog", "vision", "keyboard", "foreground", "kick"],
  council: ["council", "vote", "verdict", "ruling", "fabric", "quorum"],
  shannon: ["shannon", "scan", "promote", "pipeline", "stage"],
  cosign: ["cosign", "chain", "seal", "signed", "sig"],
  drift: ["drift", "broadcast", "halt", "location", "variation"],
  device: ["device", "hardware", "registry", "manifest", "fingerprint"],
  glyph: ["glyph", "behcs", "language", "dispatch", "polymorph"],
};
const ALL_KEYWORDS = new Set(Object.values(KEYWORD_CLASSES).flat());

const SYNONYM_HINTS = {
  handshake: ["handshake", "peer", "hello-attest", "handshake-ack", "sentinel-kr", "identity", "profile"],
  prime: ["preamble", "preload", "canon", "operator", "first-message"],
  infra: ["federation", "supervisor", "bus", "route"],
  preload: ["canon", "preamble", "preload", "reassert"],
  reassert: ["canon", "reassert", "preload"],
  fabric: ["fabric", "council", "ruling", "verdict"],
  corpus: ["corpus", "council", "keyword", "vote"],
  council: ["council", "vote", "verdict", "quorum"],
  shannon: ["shannon", "scan", "stage", "pipeline"],
  scan: ["shannon", "scan", "promote"],
  cascade: ["cascade", "wave", "review", "body"],
  cosign: ["cosign", "chain", "signed", "seal"],
  divergence: ["drift", "divergence", "broadcast", "halt"],
};

function tailNdjson(p, cap) {
  if (!fs.existsSync(p)) return [];
  const lines = fs.readFileSync(p, "utf8").split("\n").filter(Boolean);
  const tail = lines.slice(Math.max(0, lines.length - cap));
  const out = [];
  for (const l of tail) { try { out.push(JSON.parse(l)); } catch {} }
  return out;
}

function extractVerb(o) {
  return o.verb || o.kind || (o.signed_envelope && o.signed_envelope.payload && o.signed_envelope.payload.verb) || null;
}

function tokenize(verb) {
  return String(verb).toLowerCase().replace(/^evt-/, "").split(/[-_:]+/).filter(t => t.length >= 3);
}

function scoreSubject(verb) {
  const tokens = tokenize(verb);
  let hits = 0;
  for (const t of tokens) if (ALL_KEYWORDS.has(t)) hits += 1;
  return { tokens, hits, ratio: tokens.length ? hits / tokens.length : 0 };
}

function proposeSynonyms(tokens) {
  const set = new Set();
  for (const t of tokens) {
    if (SYNONYM_HINTS[t]) for (const k of SYNONYM_HINTS[t]) set.add(k);
    set.add(t);
  }
  return [...set];
}

const sources = [
  { path: CHAIN, cap: CHAIN_CAP, rows: tailNdjson(CHAIN, CHAIN_CAP) },
  { path: OUTBOX, cap: OUTBOX_CAP, rows: tailNdjson(OUTBOX, OUTBOX_CAP) },
  { path: INBOX, cap: INBOX_CAP, rows: tailNdjson(INBOX, INBOX_CAP) },
];
const verbs = new Set();
for (const s of sources) for (const r of s.rows) { const v = extractVerb(r); if (v) verbs.add(v); }

const underserved = {};
for (const v of verbs) {
  const sc = scoreSubject(v);
  if (sc.ratio < 0.34 && sc.tokens.length > 0) {
    underserved[v] = { tokens: sc.tokens, hits: sc.hits, ratio: Number(sc.ratio.toFixed(3)), proposed_keywords: proposeSynonyms(sc.tokens) };
  }
}

const proposalId = "CORPUS-EXPAND-" + crypto.randomBytes(6).toString("hex");
const ts = new Date().toISOString();
const proposed = Object.fromEntries(Object.entries(underserved).map(([k, v]) => [k, v.proposed_keywords]));

const innerPayload = {
  proposal_id: proposalId,
  ts,
  from: "liris", to: "acer",
  type: "EVT-FABRIC-CORPUS-PROPOSAL",
  verb: "EVT-FABRIC-CORPUS-PROPOSAL",
  named_agent: "liris-cascade-W6-1-keyword-corpus-expansion",
  subjects_underserved: Object.keys(underserved),
  proposed_keywords_per_subject: proposed,
  total_subjects_covered: Object.keys(underserved).length,
  total_verbs_scanned: verbs.size,
  source_data_paths: sources.map(s => ({ path: s.path, cap: s.cap, rows_loaded: s.rows.length })),
  authority: "quintuple-2026-04-18-through-2026-05-02 COSIGN-MERGED-034-EXTENDED",
  decides_at: "acer (per-host canonical, fabric-decides-instant)",
};
const signed = buildSignedEnvelope(innerPayload, LIRIS_KEY_ID);

const envelopeId = crypto.createHash("sha256").update(`liris\nacer\n${proposalId}\n${ts}`).digest("hex").slice(0, 32);
const envelope = {
  id: envelopeId, ts, from: "liris", to: "acer", mode: "real",
  type: "EVT-FABRIC-CORPUS-PROPOSAL", verb: "EVT-FABRIC-CORPUS-PROPOSAL",
  payload: innerPayload, body: signed, sig_owner: LIRIS_KEY_ID,
  cube: { D1_ACTOR: "liris", D3_TARGET: "acer", D7_STATE: "propose", D20_TIME: ts,
    D26_OMNIDIRECTIONAL: "bilateral", D34_CROSS_COLONY: "cross_host_lan", D38_ENCRYPTION: "plaintext" },
};

console.log(JSON.stringify({ proposal_preview: innerPayload, envelope_id: envelopeId, sample_underserved: Object.keys(underserved).slice(0, 5) }, null, 2));

const url = new URL(ACER_BUS);
const data = JSON.stringify(envelope);
const result = await new Promise((resolve) => {
  const req = http.request({ host: url.hostname, port: url.port, path: url.pathname, method: "POST",
    headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) }, timeout: 15000 },
    (res) => { let b = ""; res.on("data", c => b += c); res.on("end", () => {
      let parsed; try { parsed = JSON.parse(b); } catch { parsed = b; }
      resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, body: parsed }); }); });
  req.on("error", e => resolve({ ok: false, error: e.message }));
  req.on("timeout", () => { req.destroy(); resolve({ ok: false, error: "timeout" }); });
  req.write(data); req.end();
});

console.log(JSON.stringify({ dispatch_result: result, envelope_id: envelopeId, sig_verdict: result.body && result.body.sig_verdict, total_subjects: Object.keys(underserved).length }, null, 2));
