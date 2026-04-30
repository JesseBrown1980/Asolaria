#!/usr/bin/env node
// cosign-chain-append-canon.mjs
//
// Convert a verified canon-dispatch envelope (from data/behcs/outbox.ndjson)
// into a cosign chain entry, ed25519-sign it via the dev-liris vault key,
// and append to COSIGN_CHAIN.ndjson with prev_hash chaining.
//
// Spec source: liris-cascade-W3-6-cosign-chain-auto-append task brief.
//
// Mirrors the inline algorithm of
// C:/Users/rayss/Asolaria-BEHCS-256/packages/cosign-chain/src/sign.ts
//   - PKCS8 prefix `302e020100300506032b657004220420` || 32-byte seed
//   - SPKI  prefix `302a300506032b6570032100`         || 32-byte raw pub
//   - canonicalEntryMaterial = JSON.stringify(sortedKeys(entry without entry_sig))
//   - signature = crypto.sign(null, material, priv)
//
// LAW-001 / LAW-008 / LAW-012 compliant: no network, append-only, read-before-write.
// named_agent: liris-cascade-W3-6-cosign-chain-auto-append
//
// Operator decides when to invoke. Default mode is DRY-RUN.

import { readFileSync, appendFileSync, existsSync, statSync } from "node:fs";
import { createHash, createPrivateKey, sign as cryptoSign } from "node:crypto";
import { homedir } from "node:os";
import { join } from "node:path";

// ───────────────────────── constants ─────────────────────────

const CHAIN_PATH =
  "C:/Users/rayss/.claude/projects/C--/memory/COSIGN_CHAIN.ndjson";
const OUTBOX_PATH = "C:/Users/rayss/Asolaria/data/behcs/outbox.ndjson";
const DEFAULT_KEY_ID = "dev-liris-4c19e180";

const PKCS8_SEED_PREFIX = Buffer.from(
  "302e020100300506032b657004220420",
  "hex",
);
// SPKI_ED_PREFIX kept here for parity with sign.ts; unused on the sign path.
// const SPKI_ED_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

// ───────────────────────── helpers ─────────────────────────

function loadPrivateSeed(key_id) {
  const vaultPath = join(
    homedir(),
    ".asolaria-workers",
    "ed25519-vault",
    `${key_id}.private.b64`,
  );
  if (!existsSync(vaultPath)) {
    throw new Error(`private seed not in vault: ${vaultPath}`);
  }
  const b64 = readFileSync(vaultPath, "utf-8").trim();
  const seed = Buffer.from(b64, "base64");
  if (seed.length !== 32) {
    throw new Error(`vault seed has length ${seed.length}, expected 32`);
  }
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
  const material = canonicalEntryMaterial(entry);
  const sig = cryptoSign(null, material, priv);
  return {
    key_id,
    sig_b64: sig.toString("base64"),
    alg: "ed25519",
    signed_at: new Date().toISOString(),
  };
}

function sha256Hex(data) {
  return createHash("sha256").update(data).digest("hex");
}

function readChainLines() {
  if (!existsSync(CHAIN_PATH)) return [];
  return readFileSync(CHAIN_PATH, "utf-8")
    .split("\n")
    .filter((l) => l.trim().length > 0);
}

function chainTailEntry(lines) {
  if (lines.length === 0) return null;
  const last = lines[lines.length - 1];
  try {
    return { raw: last, parsed: JSON.parse(last) };
  } catch (e) {
    throw new Error(`tail line not parseable JSON: ${e.message}`);
  }
}

function deriveNextSeq(parsed) {
  // Recent entries (post-PRE-006) carry numeric seq.
  if (typeof parsed?.seq === "number") return parsed.seq + 1;
  // Older constitutional entries use audit_id "COSIGN-MERGED-NNN".
  const aid = parsed?.audit_id;
  if (typeof aid === "string") {
    const m = aid.match(/COSIGN-MERGED-(\d+)/);
    if (m !== null) return Number.parseInt(m[1], 10) + 1;
  }
  return null;
}

function readOutbox() {
  if (!existsSync(OUTBOX_PATH)) return [];
  return readFileSync(OUTBOX_PATH, "utf-8")
    .split("\n")
    .filter((l) => l.trim().length > 0)
    .map((l, i) => {
      try {
        return JSON.parse(l);
      } catch (e) {
        throw new Error(`outbox line ${i + 1} not JSON: ${e.message}`);
      }
    });
}

function findEnvelope(envId) {
  const rows = readOutbox();
  // Prefer the latest row for that id (responded version over pending stub).
  const matches = rows.filter((r) => r.id === envId);
  if (matches.length === 0) return null;
  // Pick the most-complete row: highest dispatched_at then highest responded_at.
  matches.sort((a, b) => {
    const at = a.responded_at ?? a.dispatched_at ?? a.ts ?? "";
    const bt = b.responded_at ?? b.dispatched_at ?? b.ts ?? "";
    return at < bt ? -1 : at > bt ? 1 : 0;
  });
  return matches[matches.length - 1];
}

function buildEntry(env, prevHashHex, nextSeq) {
  // Verify gating: only chain canon dispatches that succeeded with VERIFIED sig.
  const verdict = env.response_sig_verdict;
  const status = env.response_status;
  if (status !== 200 || verdict !== "VERIFIED") {
    throw new Error(
      `envelope ${env.id} not VERIFIED (status=${status} verdict=${verdict}); refuse to chain`,
    );
  }
  return {
    seq: nextSeq,
    ts: new Date().toISOString(),
    kind: "canon-dispatch",
    envelope_id: env.id,
    payload_sha256: env.payload_sha256,
    from: env.from,
    to: env.to,
    canon_version: env.canon_version,
    sig_owner: env.sig_owner,
    verb: env.verb,
    envelope_ts: env.ts,
    dispatched_at: env.dispatched_at,
    responded_at: env.responded_at ?? null,
    response_sig_verdict: verdict,
    prev_hash: prevHashHex,
    named_agent: "liris-cascade-W3-6-cosign-chain-auto-append",
  };
}

// ───────────────────────── CLI ─────────────────────────

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") args.dryRun = true;
    else if (a === "--envelope-id") args.envelopeId = argv[++i];
    else if (a === "--last-n") args.lastN = Number.parseInt(argv[++i], 10);
    else if (a === "--key-id") args.keyId = argv[++i];
    else if (a === "--apply") args.apply = true;
    else if (a === "--help" || a === "-h") args.help = true;
    else args._.push(a);
  }
  return args;
}

function printHelp() {
  process.stdout.write(
    [
      "cosign-chain-append-canon.mjs — convert canon-dispatch envelope into a signed cosign chain entry.",
      "",
      "Usage:",
      "  node cosign-chain-append-canon.mjs --last-n <N>",
      "      Read-only inspection: print last N entries (parsed) from COSIGN_CHAIN.ndjson.",
      "",
      "  node cosign-chain-append-canon.mjs --dry-run --envelope-id <id>",
      "      Build the entry that would be appended; print it, do NOT modify the chain.",
      "",
      "  node cosign-chain-append-canon.mjs --apply --envelope-id <id> [--key-id <id>]",
      "      Sign + append the entry to the chain. Requires explicit --apply (safety).",
      "",
      "Defaults:",
      `  chain : ${CHAIN_PATH}`,
      `  outbox: ${OUTBOX_PATH}`,
      `  key   : ${DEFAULT_KEY_ID}`,
      "",
      "Operator decides when to apply. Default behavior without --apply is DRY-RUN.",
      "",
    ].join("\n"),
  );
}

function cmdLastN(n) {
  const lines = readChainLines();
  const tail = lines.slice(Math.max(0, lines.length - n));
  process.stdout.write(`# chain file       : ${CHAIN_PATH}\n`);
  process.stdout.write(`# total entries    : ${lines.length}\n`);
  process.stdout.write(`# tail entries (${tail.length}):\n`);
  for (const line of tail) {
    let parsed;
    try {
      parsed = JSON.parse(line);
    } catch (e) {
      process.stdout.write(`!! UNPARSEABLE: ${line.slice(0, 120)}…\n`);
      continue;
    }
    const id = parsed.audit_id ?? `seq=${parsed.seq}` ?? "?";
    const kind = parsed.type ?? parsed.event ?? parsed.kind ?? "?";
    const ts = parsed.ts ?? "?";
    const tail_sha =
      parsed.chain_tail_sha ?? parsed.file_sha_after ?? parsed.prev_hash ?? "—";
    process.stdout.write(
      `  ${id.padEnd(24)} ${ts.padEnd(26)} kind=${kind.padEnd(34)} tail/prev=${(tail_sha ?? "—").slice(0, 16)}…\n`,
    );
  }
}

function cmdBuildEntry(envId, opts) {
  // Step 1: read chain tail
  const lines = readChainLines();
  if (lines.length === 0) throw new Error(`chain empty/missing at ${CHAIN_PATH}`);
  const tail = chainTailEntry(lines);
  // prev_hash = sha256 of the canonicalized last-entry material (per spec).
  // For interop with both modern (entry_sig) and legacy (chain_tail_sha) entries,
  // we hash the raw line-bytes if entry has no canonical sig material. This gives a
  // single deterministic prev_hash anchor regardless of legacy shape.
  let prevHash;
  if (tail.parsed.entry_sig !== undefined) {
    prevHash = sha256Hex(canonicalEntryMaterial(tail.parsed));
  } else {
    // Legacy entries already carry chain_tail_sha; honor it as the anchor.
    prevHash = tail.parsed.chain_tail_sha ?? sha256Hex(tail.raw);
  }

  // Step 2: derive next seq (monotonic guard)
  const nextSeq = deriveNextSeq(tail.parsed);
  if (nextSeq === null) {
    throw new Error(
      `cannot derive next seq from tail entry: ${JSON.stringify(tail.parsed).slice(0, 160)}…`,
    );
  }

  // Step 3: locate envelope
  const env = findEnvelope(envId);
  if (env === null) throw new Error(`envelope id not in outbox: ${envId}`);

  // Step 4: build + sign
  const entryUnsigned = buildEntry(env, prevHash, nextSeq);
  const sig = signEntry(entryUnsigned, opts.keyId ?? DEFAULT_KEY_ID);
  const signed = { ...entryUnsigned, entry_sig: sig };

  return { entry: signed, tailParsed: tail.parsed, tailRaw: tail.raw, lines };
}

function cmdDryRun(envId, opts) {
  const built = cmdBuildEntry(envId, opts);
  process.stdout.write("# DRY-RUN: chain not modified.\n");
  process.stdout.write(`# tail seq before        : ${built.tailParsed.seq ?? built.tailParsed.audit_id ?? "?"}\n`);
  process.stdout.write(`# next seq              : ${built.entry.seq}\n`);
  process.stdout.write(`# prev_hash linked to   : ${built.entry.prev_hash}\n`);
  process.stdout.write(`# total chain lines     : ${built.lines.length}\n`);
  process.stdout.write("# would-be entry line:\n");
  process.stdout.write(JSON.stringify(built.entry) + "\n");
}

function cmdApply(envId, opts) {
  // Atomic guard: read tail, compute, then re-read tail before write.
  // If tail moved, re-derive once. If still racing, exit 2.
  for (let attempt = 0; attempt < 2; attempt++) {
    const built = cmdBuildEntry(envId, opts);
    const linesBefore = built.lines;
    const sizeBefore = statSync(CHAIN_PATH).size;

    // Re-read tail right before writing to detect concurrent appends.
    const linesNow = readChainLines();
    if (linesNow.length !== linesBefore.length) {
      if (attempt === 0) {
        process.stderr.write(
          `# concurrent append detected (${linesBefore.length} -> ${linesNow.length}); retrying once\n`,
        );
        continue;
      }
      process.stderr.write(
        `# still racing after retry; refuse to append. Run again manually.\n`,
      );
      process.exit(2);
    }

    const line = JSON.stringify(built.entry) + "\n";
    appendFileSync(CHAIN_PATH, line);
    const sizeAfter = statSync(CHAIN_PATH).size;
    process.stdout.write("# APPLIED\n");
    process.stdout.write(`# seq                     : ${built.entry.seq}\n`);
    process.stdout.write(`# envelope_id            : ${built.entry.envelope_id}\n`);
    process.stdout.write(`# bytes_before           : ${sizeBefore}\n`);
    process.stdout.write(`# bytes_after            : ${sizeAfter}\n`);
    process.stdout.write(`# bytes_written          : ${Buffer.byteLength(line, "utf8")}\n`);
    process.stdout.write(`# sig_b64 (first 16)     : ${built.entry.entry_sig.sig_b64.slice(0, 16)}…\n`);
    return;
  }
}

// ───────────────────────── main ─────────────────────────

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || (args.lastN === undefined && args.envelopeId === undefined)) {
    printHelp();
    return;
  }

  if (typeof args.lastN === "number" && Number.isFinite(args.lastN)) {
    cmdLastN(args.lastN);
    return;
  }

  if (typeof args.envelopeId === "string" && args.envelopeId.length > 0) {
    if (args.apply === true && args.dryRun !== true) {
      cmdApply(args.envelopeId, { keyId: args.keyId });
    } else {
      cmdDryRun(args.envelopeId, { keyId: args.keyId });
    }
    return;
  }

  printHelp();
}

try {
  main();
} catch (e) {
  process.stderr.write(`ERROR: ${e.message}\n`);
  process.exit(1);
}
