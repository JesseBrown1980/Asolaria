"use strict";
/**
 * omnitranslator-v0.js — LX-491 STAGE_2 implementation
 *
 * Cross-dialect translator for the federation language suite.
 * v0 coverage: omnilanguage ↔ json.
 *
 * Registered dialects (polymorphic-expansion ready):
 *   - omnilanguage: "@packet key1=val1 key2=val2 ..." compact keyboard-channel form
 *   - json: structured object
 *
 * NOVALUM SHIELD INVARIANT:
 *   When translating a payload that contains a novalum-tagged token (canonical
 *   cube 389017 for D21_HARDWARE novalum units, 103823 for novalum associations,
 *   or any token matching /novalum/i), the translator preserves the token but
 *   adds shielded_redacted_across_host=true so downstream cross-host callers
 *   know the payload must not leave its origin host.
 *
 * Audit log: logs/omnitranslator.ndjson (cube tags D12_ECHO + D11_PROOF)
 */

const fs = require("fs");
const path = require("path");

const ASOLARIA_ROOT = path.resolve(__dirname, "..", "..");
const LOG_DIR = path.join(ASOLARIA_ROOT, "logs");
const LOG_FILE = path.join(LOG_DIR, "omnitranslator.ndjson");

const NOVALUM_PATTERN = /novalum/i;
const NOVALUM_CUBE_MARKERS = [103823, 389017, 704969];

const _dialects = new Map();
const _pairs = new Map();

function registerDialect(id, meta) {
  _dialects.set(id, { id, ...meta });
}

function registerPair(from, to, fn) {
  _pairs.set(from + "->" + to, fn);
}

function listDialects() {
  return Array.from(_dialects.values());
}

function listPairs() {
  return Array.from(_pairs.keys());
}

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function logAudit(entry) {
  ensureDir(LOG_DIR);
  fs.appendFileSync(LOG_FILE, JSON.stringify({
    ...entry,
    ts: new Date().toISOString(),
    chain: "LX-491",
    cube_tags: ["D12_ECHO", "D11_PROOF"]
  }) + "\n");
}

function containsNovalumToken(obj) {
  const s = typeof obj === "string" ? obj : JSON.stringify(obj);
  if (NOVALUM_PATTERN.test(s)) return true;
  for (const c of NOVALUM_CUBE_MARKERS) {
    if (s.includes(String(c))) return true;
  }
  return false;
}

// ─── Dialect: omnilanguage ────────────────────────────────────────────────

registerDialect("omnilanguage", {
  form: "@packet key=val key=val",
  role: "trunk",
  pair_status: "implemented",
  example: "@packet from=liris to=asolaria verb=test.ping input_a=1"
});

// ─── Dialect: json ────────────────────────────────────────────────────────

registerDialect("json", {
  form: "object",
  role: "neutral interchange",
  pair_status: "implemented",
  example: '{"verb":"test.ping","from":"liris","input_a":"1"}'
});

// ─── Dialects registered but pairs deferred (planned) ────────────────────

registerDialect("IX", {
  form: "IX-nnn entry text",
  role: "asolaria sovereign index",
  pair_status: "planned",
  example: "IX-459 beast discovery via tool-packet.txt"
});

registerDialect("LX", {
  form: "LX-nnn entry text",
  role: "local agent-index entries",
  pair_status: "planned",
  example: "LX-491 Omni GNN Trinity Complete"
});

registerDialect("XL", {
  form: "XL runtime event",
  role: "executable runtime artifact",
  pair_status: "planned",
  example: "XL-0 packet dialect from LX-483"
});

registerDialect("plain_english", {
  form: "natural language sentence",
  role: "human operator fallback",
  pair_status: "planned",
  example: "Liris is asking Asolaria to run a test ping with input a=1"
});

// ─── Pair: omnilanguage → json ────────────────────────────────────────────

registerPair("omnilanguage", "json", (input) => {
  if (typeof input !== "string") throw new Error("omnilanguage input must be string");
  // Strip @packet prefix if present
  let s = input.trim();
  if (s.startsWith("@packet")) s = s.slice("@packet".length).trim();
  // Parse key=val pairs — simple whitespace tokenizer, val is until next whitespace-key or eol
  const out = {};
  const tokens = s.split(/\s+/).filter(Boolean);
  for (const tok of tokens) {
    const eq = tok.indexOf("=");
    if (eq <= 0) continue;
    const k = tok.slice(0, eq);
    const v = tok.slice(eq + 1);
    out[k] = v;
  }
  return out;
});

// ─── Pair: json → omnilanguage ────────────────────────────────────────────

registerPair("json", "omnilanguage", (input) => {
  if (typeof input !== "object" || input === null) throw new Error("json input must be object");
  const parts = ["@packet"];
  for (const [k, v] of Object.entries(input)) {
    if (v == null) continue;
    const vs = typeof v === "string" ? v : JSON.stringify(v);
    // Replace whitespace in values with underscores to preserve tokenization
    parts.push(k + "=" + vs.replace(/\s+/g, "_"));
  }
  return parts.join(" ");
});

// ─── Public translate() ──────────────────────────────────────────────────

function translate(input, fromDialect, toDialect) {
  if (!_dialects.has(fromDialect)) throw new Error("unknown from dialect: " + fromDialect);
  if (!_dialects.has(toDialect)) throw new Error("unknown to dialect: " + toDialect);
  const key = fromDialect + "->" + toDialect;
  const fn = _pairs.get(key);
  if (!fn) throw new Error("no translator pair for " + key);

  const shielded = containsNovalumToken(input);
  const output = fn(input);
  const result = {
    from: fromDialect,
    to: toDialect,
    output,
    shielded_redacted_across_host: shielded
  };
  logAudit({
    verb: "omnitranslate",
    pair: key,
    shielded,
    output_preview: (typeof output === "string" ? output : JSON.stringify(output)).slice(0, 200)
  });
  return result;
}

module.exports = { translate, registerDialect, registerPair, listDialects, listPairs };
