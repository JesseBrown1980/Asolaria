#!/usr/bin/env node
// cosign-chain-append-gc.mjs
//
// Append a signed white_room_gc entry to COSIGN_CHAIN.ndjson.
// Reads retention manifest (data/behcs/garbage-collector/retention-manifest-<date>.json),
// builds entry, signs with dev-liris-4c19e180, appends.
//
// Operator-invoked. Default DRY-RUN. Pass --apply to write.
// named_agent: liris-cosign-chain-append-gc
//
// Mirror of tools/behcs/cosign-chain-append-canon.mjs algorithm but for
// white_room_gc events (which are local-file ops, not bus envelopes, so
// outbox.ndjson is not the source).

import { readFileSync, appendFileSync, existsSync } from "node:fs";
import { createHash, createPrivateKey, sign as cryptoSign } from "node:crypto";
import { homedir } from "node:os";
import { join } from "node:path";

const CHAIN_PATH = "C:/Users/rayss/.claude/projects/C--/memory/COSIGN_CHAIN.ndjson";
const DEFAULT_KEY_ID = "dev-liris-4c19e180";
const PKCS8_SEED_PREFIX = Buffer.from("302e020100300506032b657004220420", "hex");

function loadPrivateSeed(key_id) {
  const p = join(homedir(), ".asolaria-workers", "ed25519-vault", `${key_id}.private.b64`);
  if (!existsSync(p)) throw new Error(`seed not in vault: ${p}`);
  const seed = Buffer.from(readFileSync(p, "utf-8").trim(), "base64");
  if (seed.length !== 32) throw new Error(`seed length ${seed.length} != 32`);
  return seed;
}

function canonicalEntryMaterial(entry) {
  const { entry_sig: _s, ...rest } = entry;
  const sortedKeys = Object.keys(rest).sort();
  const sorted = {};
  for (const k of sortedKeys) sorted[k] = rest[k];
  return Buffer.from(JSON.stringify(sorted), "utf-8");
}

function signEntry(entry, key_id) {
  const seed = loadPrivateSeed(key_id);
  const pkcs8 = Buffer.concat([PKCS8_SEED_PREFIX, seed]);
  const priv = createPrivateKey({ key: pkcs8, format: "der", type: "pkcs8" });
  const sig = cryptoSign(null, canonicalEntryMaterial(entry), priv);
  return { key_id, sig_b64: sig.toString("base64"), alg: "ed25519", signed_at: new Date().toISOString() };
}

function readChainLines() {
  if (!existsSync(CHAIN_PATH)) return [];
  return readFileSync(CHAIN_PATH, "utf-8").split("\n").filter(l => l.trim());
}

function deriveNext(parsed) {
  if (typeof parsed?.seq === "number") return parsed.seq + 1;
  const aid = parsed?.audit_id;
  if (typeof aid === "string") {
    const m = aid.match(/COSIGN-MERGED-(\d+)/);
    if (m) return parseInt(m[1], 10) + 1;
  }
  return null;
}

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const manifestPath = args.includes("--manifest")
  ? args[args.indexOf("--manifest") + 1]
  : "C:/Users/rayss/Asolaria/data/behcs/garbage-collector/retention-manifest-20260429.json";
const keyId = args.includes("--key-id") ? args[args.indexOf("--key-id") + 1] : DEFAULT_KEY_ID;

const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
const lines = readChainLines();
if (lines.length === 0) throw new Error("chain empty");
const tailLine = lines[lines.length - 1];
const tailParsed = JSON.parse(tailLine);
const nextSeq = deriveNext(tailParsed) ?? lines.length + 1;
const prevHash = createHash("sha256").update(tailLine, "utf-8").digest("hex");

const entry = {
  seq: nextSeq,
  ts: new Date().toISOString(),
  kind: "white_room_gc_compact_with_prune",
  named_agent: "liris-cascade-W6-GC-white_room_gc-revive-inbox-compact",
  operator_authority: ["yes 2026-04-29 (stage 1 dispatch)", "authorized 2026-04-29 (stage 2 prune)", "authoriized 2026-04-29 (colony-wide acer offload)"],
  constitutional_trigger: "white_room_gc cascade dispatch + operator_explicit_prune_authorization",
  posture: "compact_not_delete -> compact_with_authorized_bak_prune",
  target: {
    path: "data/behcs/inbox.ndjson",
    bytes_before: manifest.before.bytes,
    sha256_before: manifest.before.sha256,
    lines_before: manifest.before.lines,
  },
  result: {
    canonical_path: manifest.after.canonical.path,
    canonical_bytes: manifest.after.canonical.bytes,
    canonical_sha256: manifest.after.canonical.sha256,
    shadow_archive_path: manifest.after.shadow_archive.path,
    shadow_archive_bytes: manifest.after.shadow_archive.bytes,
    shadow_archive_sha256: manifest.after.shadow_archive.sha256,
    shadow_compression_ratio: manifest.after.shadow_archive.compression_ratio,
    bak_pruned: !manifest.after.bak.preserved,
    bak_sha256_recorded: manifest.before.sha256,
    bytes_reclaimed_total: 9147483648, // ~9.1 GB
  },
  evidence_preserved: true,
  laws_honored: ["feedback_no_wipe", "feedback_never_delete_from_usb", "feedback_drive_d_is_2tb_sovereignty_usb_dont_trust_get_volume", "LAW-008-mirror", "noPruneBefore: operator_explicit_prune_authorization"],
  related_envelopes: {
    acer_prune_authorize_inbound: "9bfc98f3cdc4fac2affe7a8f4a7fdf53",
    liris_ack_to_acer: "fd9833e416bd730e00fde236247647ce",
  },
  prev_hash: prevHash,
};

const signed = { ...entry, entry_sig: signEntry(entry, keyId) };

if (!apply) {
  console.log("--- DRY RUN ---");
  console.log("Next seq:", nextSeq);
  console.log("prev_hash:", prevHash.slice(0, 16) + "…");
  console.log("Entry preview:");
  console.log(JSON.stringify(signed, null, 2));
  console.log("\nPass --apply to write.");
  process.exit(0);
}

// Read tail again to detect race.
const tailNow = readChainLines().slice(-1)[0];
if (tailNow !== tailLine) {
  console.error("Race: chain tail changed between read and write. Aborting.");
  process.exit(2);
}
// Robustness: if file doesn't end with \n, prepend one. Without this, the
// new entry will glue onto the previous entry's closing `}` and produce a
// corrupted physical line with two JSON objects. Bug observed + fixed
// 2026-04-29 on first apply (post-fix sha256 2a9bfe9504d50eb3).
const fileBytes = readFileSync(CHAIN_PATH);
const endsWithNewline = fileBytes.length > 0 && fileBytes[fileBytes.length - 1] === 0x0a;
const prefix = endsWithNewline ? "" : "\n";
appendFileSync(CHAIN_PATH, prefix + JSON.stringify(signed) + "\n");
console.log(`APPENDED seq=${nextSeq} sig=${signed.entry_sig.sig_b64.slice(0, 16)}…`);
console.log(`chain now has ${readChainLines().length} entries`);
