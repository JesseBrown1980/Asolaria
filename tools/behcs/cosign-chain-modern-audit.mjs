#!/usr/bin/env node
// cosign-chain-modern-audit.mjs — focused audit on modern signed entries (seq>=38).
// READ-ONLY. Verifies per entry: ed25519 entry_sig, prev_hash chain link,
// monotonic ts, well-formed kind. Exit 0 all-green; 1 on any failure.
// Usage: node tools/behcs/cosign-chain-modern-audit.mjs [--chain <path>] [--min-seq 38]

import fs from "node:fs";
import crypto from "node:crypto";

const DEFAULT_CHAIN = "C:/Users/rayss/.claude/projects/C--/memory/COSIGN_CHAIN.ndjson";
const SPKI_ED_PREFIX = Buffer.from("302a300506032b6570032100", "hex");
// Fallback registry: bus-sign.mjs declares this pubkey for dev-liris-4c19e180.
const FALLBACK_KEYS = [{
  key_id: "dev-liris-4c19e180",
  public_key_b64: "JAv/hJl/XkxU0A6lVZ44fKaEDYp6/tl6/Uupa2tmqMw=",
  owner_glyph: "DEV-LIRIS",
}];
const REGISTRY_CANDIDATES = [
  "C:/Users/rayss/Asolaria-BEHCS-256/kernel/ed25519-registry.json",
  "C:/Users/rayss/Asolaria/data/ed25519-registry.json",
];

function parseArgs(argv) {
  const out = { chain: DEFAULT_CHAIN, minSeq: 38 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--chain") out.chain = argv[++i];
    else if (a === "--min-seq") out.minSeq = parseInt(argv[++i], 10);
    else if (a === "--help" || a === "-h") {
      console.log("Usage: node cosign-chain-modern-audit.mjs [--chain <path>] [--min-seq 38]");
      process.exit(0);
    } else { console.error(`error: unknown arg ${a}`); process.exit(2); }
  }
  return out;
}

function loadRegistry() {
  const merged = new Map();
  for (const k of FALLBACK_KEYS) merged.set(k.key_id, k);
  for (const p of REGISTRY_CANDIDATES) {
    if (!fs.existsSync(p)) continue;
    try {
      const r = JSON.parse(fs.readFileSync(p, "utf-8"));
      for (const k of r.keys || []) merged.set(k.key_id, k);
    } catch (_) {}
  }
  return [...merged.values()];
}

// Must match chain-real-time-fabric-self-improvement.mjs:14
function canonicalEntryMaterial(entry) {
  const { entry_sig: _s, ...rest } = entry;
  const sortedKeys = Object.keys(rest).sort();
  const sorted = {};
  for (const k of sortedKeys) sorted[k] = rest[k];
  return Buffer.from(JSON.stringify(sorted), "utf-8");
}

function verifyEntrySig(entry, registry) {
  const sig = entry.entry_sig;
  if (!sig || !sig.key_id || !sig.sig_b64) return { verdict: "UNSIGNED", reason: "no-entry_sig" };
  const k = registry.find((r) => r.key_id === sig.key_id);
  if (!k) return { verdict: "TAMPERED", reason: "unknown-key-id", key_id: sig.key_id };
  try {
    const pubRaw = Buffer.from(k.public_key_b64, "base64");
    if (pubRaw.length !== 32) return { verdict: "TAMPERED", reason: "bad-key-material" };
    const spki = Buffer.concat([SPKI_ED_PREFIX, pubRaw]);
    const pub = crypto.createPublicKey({ key: spki, format: "der", type: "spki" });
    const ok = crypto.verify(null, canonicalEntryMaterial(entry), pub, Buffer.from(sig.sig_b64, "base64"));
    if (!ok) return { verdict: "TAMPERED", reason: "crypto-verify-failed", key_id: sig.key_id };
    return { verdict: "VERIFIED", key_id: k.key_id, owner: k.owner_glyph || null };
  } catch (e) { return { verdict: "TAMPERED", reason: "threw: " + e.message }; }
}

const sha256Hex = (s) => crypto.createHash("sha256").update(s, "utf-8").digest("hex");

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!fs.existsSync(args.chain)) { console.error(`error: chain not found: ${args.chain}`); process.exit(2); }
  const lines = fs.readFileSync(args.chain, "utf-8").split("\n").filter((l) => l.trim());
  const registry = loadRegistry();
  const failures = [];
  const verdicts = [];
  let prevTs = null;
  for (let i = 0; i < lines.length; i++) {
    let entry;
    try { entry = JSON.parse(lines[i]); } catch { continue; }
    if (typeof entry.seq !== "number" || entry.seq < args.minSeq) continue;
    const checks = { seq: entry.seq };
    checks.sig = verifyEntrySig(entry, registry);
    const prevRaw = i > 0 ? lines[i - 1] : null;
    if (!prevRaw) checks.prev_hash = { ok: false, reason: "no-prev-line" };
    else if (typeof entry.prev_hash !== "string") checks.prev_hash = { ok: false, reason: "missing-prev_hash-field" };
    else {
      const expected = sha256Hex(prevRaw);
      checks.prev_hash = expected === entry.prev_hash
        ? { ok: true, sha8: expected.slice(0, 8) }
        : { ok: false, reason: "mismatch", expected_sha8: expected.slice(0, 8), got_sha8: entry.prev_hash.slice(0, 8) };
    }
    if (typeof entry.ts !== "string") checks.ts = { ok: false, reason: "missing-ts" };
    else {
      const cur = Date.parse(entry.ts);
      if (Number.isNaN(cur)) checks.ts = { ok: false, reason: "unparseable-ts" };
      else if (prevTs !== null && cur < prevTs) checks.ts = { ok: false, reason: "non-monotonic", ts: entry.ts };
      else checks.ts = { ok: true, ts: entry.ts };
      prevTs = cur;
    }
    checks.kind = typeof entry.kind === "string" && entry.kind.length > 0
      ? { ok: true, kind: entry.kind }
      : { ok: false, reason: "missing-kind" };
    const allGreen = checks.sig.verdict === "VERIFIED" && checks.prev_hash.ok && checks.ts.ok && checks.kind.ok;
    checks.overall = allGreen ? "PASS" : "FAIL";
    if (!allGreen) failures.push(entry.seq);
    verdicts.push(checks);
  }
  for (const v of verdicts) {
    const ph = v.prev_hash.ok ? "ok" : `FAIL(${v.prev_hash.reason})`;
    const ts = v.ts.ok ? "ok" : `FAIL(${v.ts.reason})`;
    const kd = v.kind.ok ? v.kind.kind : `FAIL(${v.kind.reason})`;
    console.log(`seq=${v.seq} overall=${v.overall} sig=${v.sig.verdict} prev_hash=${ph} ts=${ts} kind=${kd}`);
  }
  console.log("");
  console.log(`summary modern_entries=${verdicts.length} pass=${verdicts.length - failures.length} fail=${failures.length}` +
    (failures.length ? ` failures=${failures.join(",")}` : ""));
  process.exit(failures.length ? 1 : 0);
}

main();
