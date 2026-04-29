#!/usr/bin/env node
// cosign-chain-walk.mjs — full bilateral cosign-chain walker (standalone)
//
// Usage:
//   node tools/behcs/cosign-chain-walk.mjs --root-envelope-id <id> [--archives]
//                                          [--inbox <path>]
//
// Starts from a single root envelope (typically a FIRST_MESSAGE_CANON), then
// walks the inbox (and, with --archives, data/behcs/inbox-archives/) for every
// envelope that references it:
//
//   1. Same payload_sha256          → canon re-dispatches (same body, new id)
//   2. payload.canon_envelope_id == root_id          → ACKs / canon receipts
//   3. payload.envelope_id == root_id                → generic edge references
//   4. body.signed_envelope.payload.{canon_envelope_id|envelope_id} == root_id
//      → signed-envelope variant of (2)/(3)
//
// Sorts the result chronologically (root first, then everything else by ts asc),
// classifies each entry, and prints a tree. Each line carries the bus-stamped
// signature verdict (_sig_check.verdict / .owner_glyph) so an operator can spot
// chains where one link is unsigned or rejected.
//
// Output is text (tree) by default. Add --json for machine-readable form.

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
// tools/behcs/ → repo root is two levels up, matching verify-seal.mjs &
// canon-history.mjs conventions.
const REPO_ROOT  = resolve(__dirname, '..', '..');

const DEFAULT_INBOX = resolve(REPO_ROOT, 'data', 'behcs', 'inbox.ndjson');
const ARCHIVES_DIR  = resolve(REPO_ROOT, 'data', 'behcs', 'inbox-archives');

// ---------- arg parsing ----------
function parseArgs(argv) {
  const out = {
    rootId: null,
    inbox: DEFAULT_INBOX,
    archives: false,
    json: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--root-envelope-id') {
      out.rootId = argv[++i];
      if (!out.rootId) { console.error('error: --root-envelope-id requires a value'); process.exit(2); }
    } else if (a === '--inbox') {
      const v = argv[++i];
      if (!v) { console.error('error: --inbox requires a value'); process.exit(2); }
      out.inbox = resolve(v);
    } else if (a === '--archives') {
      out.archives = true;
    } else if (a === '--json') {
      out.json = true;
    } else if (a === '--help' || a === '-h') {
      console.log(
`Usage: node cosign-chain-walk.mjs --root-envelope-id <id> [--archives] [--inbox <path>] [--json]

Walks every envelope that references <id> via payload_sha256, canon_envelope_id,
or envelope_id. Prints a chronologically-sorted tree with bus signature verdicts.`
      );
      process.exit(0);
    } else {
      console.error(`error: unknown arg ${a}`);
      process.exit(2);
    }
  }
  if (!out.rootId) {
    console.error('error: --root-envelope-id is required');
    process.exit(2);
  }
  return out;
}

// ---------- envelope helpers ----------

// Pull a payload object from either the unsigned shape or the signed-envelope
// shape. Caller may want either, so return both.
function extractPayloads(env) {
  const unsigned = env && typeof env.payload === 'object' ? env.payload : null;
  const signed = env && env.body && env.body.signed_envelope
    && typeof env.body.signed_envelope.payload === 'object'
    ? env.body.signed_envelope.payload
    : null;
  return { unsigned, signed };
}

// Decide whether an envelope is related to rootId, and how. Order matters:
// the canon itself (sha match) wins over ACK over edge so the tree node tag
// reflects the strongest relationship.
function classifyRelation(env, rootId, rootSha) {
  if (env.id === rootId) return { relation: 'CANON', basis: 'self' };

  // Re-dispatch of the same canon body. payload_sha256 is the bus-level field
  // (same as canon-history.mjs reads it).
  if (rootSha && typeof env.payload_sha256 === 'string' && env.payload_sha256 === rootSha) {
    return { relation: 'CANON', basis: 'payload_sha256_match' };
  }

  const { unsigned, signed } = extractPayloads(env);
  const candidates = [unsigned, signed].filter(Boolean);

  for (const p of candidates) {
    if (p.canon_envelope_id === rootId) {
      return { relation: 'ACK', basis: 'canon_envelope_id' };
    }
  }
  for (const p of candidates) {
    if (p.envelope_id === rootId) {
      return { relation: 'EDGE', basis: 'envelope_id' };
    }
  }

  // Some envelope types (WO_BRIEF) carry a `receipt_chain` array of ids in
  // their payload. Treat those as edges too — they're the same kind of "this
  // envelope cites the root" relationship.
  for (const p of candidates) {
    const chain = Array.isArray(p.receipt_chain) ? p.receipt_chain : null;
    if (chain && chain.some((s) => typeof s === 'string' && s.indexOf(rootId) !== -1)) {
      return { relation: 'EDGE', basis: 'receipt_chain' };
    }
  }

  return null; // mentions rootId only incidentally (e.g. inside a string blob)
}

// ---------- file scan ----------
function scanFile(filePath, rootId) {
  if (!existsSync(filePath)) return [];
  const raw = readFileSync(filePath, 'utf8');
  const hits = [];
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    // Cheap pre-filter: if the literal id never appears in the line, no field
    // could match. This is the same trick verify-seal.mjs uses.
    if (t.indexOf(rootId) === -1) continue;
    let env;
    try { env = JSON.parse(t); } catch { continue; }
    if (env && typeof env === 'object') {
      hits.push({ env, src: filePath });
    }
  }
  return hits;
}

function listArchives() {
  if (!existsSync(ARCHIVES_DIR)) return [];
  return readdirSync(ARCHIVES_DIR)
    .filter((n) => n.endsWith('.ndjson'))
    .map((n) => join(ARCHIVES_DIR, n))
    .filter((p) => { try { return statSync(p).isFile(); } catch { return false; } })
    // Newest first — keeps tie-breaking deterministic when an envelope is
    // present in both inbox and an archive (we keep the first-seen copy).
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
}

// ---------- tree formatting ----------

function getSigCheck(env) {
  const c = env._sig_check || null;
  return {
    verdict: c && c.verdict ? c.verdict : 'NONE',
    owner: c && c.owner_glyph ? c.owner_glyph : null,
    key_id: c && c.key_id ? c.key_id : null,
  };
}

function getTs(env) {
  return env.ts || env.received_at || null;
}

function shortId(id) {
  if (!id || id.length < 8) return id || '<no-id>';
  return id.slice(0, 8) + '...';
}

function formatRoot(env) {
  const sig = getSigCheck(env);
  const sha = typeof env.payload_sha256 === 'string' ? env.payload_sha256 : null;
  const sha8 = sha ? sha.slice(0, 8) : 'sha8=?';
  const ver = env.canon_version ? env.canon_version : '?';
  const sigStr = sig.owner
    ? `sig=${sig.verdict} owner=${sig.owner}`
    : `sig=${sig.verdict}`;
  return `CANON ${shortId(env.id)} [${ver}, sha8=${sha8}, ${sigStr}, ts=${getTs(env) || '?'}]`;
}

function formatChild(env, relation) {
  const sig = getSigCheck(env);
  const ts = getTs(env) || '?';
  const sigStr = sig.owner
    ? `sig=${sig.verdict} owner=${sig.owner}`
    : `sig=${sig.verdict}`;

  const { unsigned, signed } = extractPayloads(env);
  const p = unsigned || signed || {};

  if (relation === 'ACK') {
    // ACKs are most usefully labelled by the session they came from.
    const session = p.session_id || p.session_label || '?';
    return `ACK ${shortId(env.id)} [session=${session}, ${sigStr}, ts=${ts}]`;
  }

  if (relation === 'CANON') {
    // Re-dispatch of the same canon body under a new envelope id.
    const ver = env.canon_version ? env.canon_version : '?';
    const sha = typeof env.payload_sha256 === 'string' ? env.payload_sha256.slice(0, 8) : '?';
    return `CANON ${shortId(env.id)} [${ver}, sha8=${sha}, ${sigStr}, ts=${ts}] (re-dispatch)`;
  }

  // EDGE: anything else that names the root. Verb is the most informative
  // single field, fall back to the envelope type.
  const verb = p.verb || env.verb || env.type || '?';
  return `EDGE ${shortId(env.id)} [verb=${verb}, ${sigStr}, ts=${ts}]`;
}

// ---------- main ----------
function main() {
  const args = parseArgs(process.argv.slice(2));

  // Build the file list (inbox first; archives optional). Keep the order
  // because the first sighting of an id wins the dedupe later.
  const files = [args.inbox];
  if (args.archives) {
    for (const p of listArchives()) files.push(p);
  }

  // First pass: locate the root so we can read its payload_sha256. We need
  // that to find re-dispatches (envelopes with the same body).
  let rootHit = null;
  for (const f of files) {
    for (const h of scanFile(f, args.rootId)) {
      if (h.env.id === args.rootId) { rootHit = h; break; }
    }
    if (rootHit) break;
  }

  if (!rootHit) {
    const out = {
      root_envelope_id: args.rootId,
      found: false,
      searched: files,
      error: 'root_envelope_not_found',
    };
    if (args.json) {
      console.log(JSON.stringify(out, null, 2));
    } else {
      console.error(`root envelope ${args.rootId} not found in:`);
      for (const f of files) console.error('  ' + f);
    }
    process.exit(1);
  }

  const rootSha = typeof rootHit.env.payload_sha256 === 'string' ? rootHit.env.payload_sha256 : null;

  // Second pass: classify every line that mentions the root id (still using
  // the same cheap pre-filter inside scanFile). Dedupe by envelope id —
  // archive rotations sometimes leave the same envelope in two files.
  const seen = new Map();
  for (const f of files) {
    for (const h of scanFile(f, args.rootId)) {
      const e = h.env;
      if (!e.id || seen.has(e.id)) continue;
      const rel = classifyRelation(e, args.rootId, rootSha);
      if (!rel) continue;
      seen.set(e.id, { env: e, src: h.src, relation: rel.relation, basis: rel.basis });
    }
  }

  // Re-dispatches of the same canon — these may live anywhere in the inbox
  // and won't necessarily mention the root id literally. Need a separate
  // sweep keyed on payload_sha256.
  if (rootSha) {
    for (const f of files) {
      if (!existsSync(f)) continue;
      const raw = readFileSync(f, 'utf8');
      for (const line of raw.split(/\r?\n/)) {
        const t = line.trim();
        if (!t) continue;
        if (t.indexOf(rootSha) === -1) continue;
        let env;
        try { env = JSON.parse(t); } catch { continue; }
        if (!env || typeof env !== 'object') continue;
        if (!env.id || seen.has(env.id)) continue;
        if (env.id === args.rootId) continue;
        if (env.payload_sha256 !== rootSha) continue;
        seen.set(env.id, { env, src: f, relation: 'CANON', basis: 'payload_sha256_match' });
      }
    }
  }

  // Pull the root out of the dedup map (it was added during the classify
  // pass), then sort the children chronologically by ts ascending.
  const rootEntry = {
    env: rootHit.env,
    src: rootHit.src,
    relation: 'CANON',
    basis: 'self',
  };

  const children = [...seen.values()]
    .filter((x) => x.env.id !== args.rootId)
    .sort((a, b) => {
      const ta = Date.parse(getTs(a.env) || '') || 0;
      const tb = Date.parse(getTs(b.env) || '') || 0;
      if (ta !== tb) return ta - tb;
      return String(a.env.id).localeCompare(String(b.env.id));
    });

  if (args.json) {
    const report = {
      root_envelope_id: args.rootId,
      root: {
        id: rootEntry.env.id,
        type: rootEntry.env.type,
        canon_version: rootEntry.env.canon_version || null,
        payload_sha256: rootSha,
        ts: getTs(rootEntry.env),
        sig_check: rootEntry.env._sig_check || null,
        src: basename(rootEntry.src),
      },
      chain: children.map((c) => ({
        id: c.env.id,
        relation: c.relation,
        basis: c.basis,
        type: c.env.type,
        verb: c.env.verb || null,
        ts: getTs(c.env),
        sig_check: c.env._sig_check || null,
        src: basename(c.src),
      })),
      counts: {
        total: children.length + 1,
        canons: 1 + children.filter((c) => c.relation === 'CANON').length,
        acks: children.filter((c) => c.relation === 'ACK').length,
        edges: children.filter((c) => c.relation === 'EDGE').length,
      },
    };
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  // Tree output. Root on its own line, every child indented under it with the
  // └─ prefix shown in the spec example. Last-child elbow stays consistent —
  // operators read this in a terminal where deep nesting is rare.
  const lines = [];
  lines.push(formatRoot(rootEntry.env));
  for (const c of children) {
    lines.push(' └─ ' + formatChild(c.env, c.relation));
  }
  const counts = {
    total: children.length + 1,
    acks: children.filter((c) => c.relation === 'ACK').length,
    redispatches: children.filter((c) => c.relation === 'CANON').length,
    edges: children.filter((c) => c.relation === 'EDGE').length,
  };
  lines.push('');
  lines.push(
    `chain_size=${counts.total} acks=${counts.acks} re-dispatches=${counts.redispatches} edges=${counts.edges}` +
    (args.archives ? ' (inbox+archives)' : ' (inbox-only)')
  );
  console.log(lines.join('\n'));
}

main();
