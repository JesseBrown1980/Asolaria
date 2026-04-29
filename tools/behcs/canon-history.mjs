#!/usr/bin/env node
// canon-history.mjs
//
// Operator view of FIRST_MESSAGE_CANON deployment over time.
//
// FIRST_MESSAGE_CANON envelopes carry a `canon_version` (e.g. "v1") and a
// `payload_sha256` of the actual canon body. They flow through the bus across
// time; new versions overwrite the canon content that downstream models receive
// at session start. Operators want a quick way to see which versions have been
// observed, when, how often, and whether a single version has had its body
// edited mid-stream (same canon_version, different payload_sha256 — usually a
// silent edit that should be turned into a new version instead).
//
// Streams files line-by-line so memory stays bounded regardless of archive
// size. Mirrors the conventions of inbox-search.mjs in this directory.
//
// Usage:
//   node tools/behcs/canon-history.mjs [--archives] [--target <peer>]
//
// Output:
//   table sorted by last_seen_ts DESC, plus a summary line.

import { createReadStream, promises as fs } from 'node:fs';
import { createInterface } from 'node:readline';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// tools/behcs/ -> repo root is two levels up
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const INBOX_PATH = path.join(REPO_ROOT, 'data', 'behcs', 'inbox.ndjson');
const ARCHIVE_DIR = path.join(REPO_ROOT, 'data', 'behcs', 'inbox-archives');

function parseArgs(argv) {
  const opts = {
    archives: false,
    target: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--archives') {
      opts.archives = true;
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
    if (arg === '--target') {
      const val = argv[++i];
      if (val === undefined) {
        throw new Error(`Flag ${arg} requires a value`);
      }
      opts.target = val;
      continue;
    }
    throw new Error(`Unknown flag: ${arg}`);
  }
  return opts;
}

function printHelp() {
  process.stdout.write(`canon-history.mjs — FIRST_MESSAGE_CANON deployment history

Flags:
  --archives        also scan data/behcs/inbox-archives/inbox-*.ndjson
  --target <peer>   only count envelopes addressed to <peer> (envelope.to)

Output:
  table sorted by last_seen_ts DESC with columns:
    canon_version  count  first_seen_ts  last_seen_ts  shas  owners  envelopes  warn
  followed by a summary line.

  warn = "EDITED" when a single canon_version has more than one distinct
  payload_sha256 — the canon body changed under the same version label.
`);
}

function getEnvelopeTimestamp(env) {
  // Prefer 'ts' (sender clock); fall back to 'received_at' (receiver clock).
  const raw = env.ts || env.received_at || null;
  if (!raw) return null;
  const t = Date.parse(raw);
  return Number.isNaN(t) ? null : t;
}

async function listArchiveFiles() {
  let entries;
  try {
    entries = await fs.readdir(ARCHIVE_DIR);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
  return entries
    .filter((n) => n.startsWith('inbox-') && n.endsWith('.ndjson'))
    .sort()
    .map((n) => path.join(ARCHIVE_DIR, n));
}

function recordEnvelope(env, opts, groups, state) {
  if (env.type !== 'FIRST_MESSAGE_CANON') return;
  if (opts.target !== null && env.to !== opts.target) return;

  // canon_version is the load-bearing key; if it's missing the envelope is
  // malformed for this purpose. Bucket those under "<missing>" so the operator
  // sees them rather than silently dropping.
  const version = typeof env.canon_version === 'string' && env.canon_version.length
    ? env.canon_version
    : '<missing>';
  const sha = typeof env.payload_sha256 === 'string' ? env.payload_sha256 : null;
  const owner = typeof env.sig_owner === 'string' && env.sig_owner.length
    ? env.sig_owner
    : '<unsigned>';
  const id = typeof env.id === 'string' ? env.id : null;
  const tsMs = getEnvelopeTimestamp(env);
  const tsIso = tsMs !== null ? new Date(tsMs).toISOString() : null;

  let g = groups.get(version);
  if (!g) {
    g = {
      version,
      count: 0,
      firstMs: null,
      firstIso: null,
      lastMs: null,
      lastIso: null,
      shas: new Set(),
      owners: new Set(),
      envelopes: new Set(),
    };
    groups.set(version, g);
  }
  g.count++;
  if (sha) g.shas.add(sha);
  g.owners.add(owner);
  if (id) g.envelopes.add(id);
  if (tsMs !== null) {
    if (g.firstMs === null || tsMs < g.firstMs) {
      g.firstMs = tsMs;
      g.firstIso = tsIso;
    }
    if (g.lastMs === null || tsMs > g.lastMs) {
      g.lastMs = tsMs;
      g.lastIso = tsIso;
    }
  }
  state.matched++;
}

async function scanFile(filePath, opts, groups, state) {
  let stream;
  try {
    stream = createReadStream(filePath, { encoding: 'utf8' });
  } catch (err) {
    if (err.code === 'ENOENT') return;
    throw err;
  }
  stream.on('error', (err) => {
    if (err.code === 'ENOENT') return;
    throw err;
  });
  const rl = createInterface({ input: stream, crlfDelay: Infinity });
  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    state.totalScanned++;
    let env;
    try {
      env = JSON.parse(trimmed);
    } catch {
      // Archives can be truncated mid-write; skip malformed lines silently.
      continue;
    }
    recordEnvelope(env, opts, groups, state);
  }
}

function pad(s, n) {
  s = String(s);
  if (s.length >= n) return s;
  return s + ' '.repeat(n - s.length);
}

function renderTable(groups) {
  const rows = [...groups.values()].map((g) => ({
    version: g.version,
    count: g.count,
    first: g.firstIso ?? '<no-ts>',
    last: g.lastIso ?? '<no-ts>',
    shas: g.shas.size,
    owners: g.owners.size,
    envelopes: g.envelopes.size,
    warn: g.shas.size > 1 ? 'EDITED' : '',
    _lastMs: g.lastMs ?? -1,
  }));
  // Sort by last_seen_ts DESC. Tie-break by version label to keep output stable.
  rows.sort((a, b) => {
    if (b._lastMs !== a._lastMs) return b._lastMs - a._lastMs;
    return a.version.localeCompare(b.version);
  });

  const headers = ['canon_version', 'count', 'first_seen_ts', 'last_seen_ts', 'shas', 'owners', 'envelopes', 'warn'];
  const widths = headers.map((h) => h.length);
  for (const r of rows) {
    widths[0] = Math.max(widths[0], r.version.length);
    widths[1] = Math.max(widths[1], String(r.count).length);
    widths[2] = Math.max(widths[2], r.first.length);
    widths[3] = Math.max(widths[3], r.last.length);
    widths[4] = Math.max(widths[4], String(r.shas).length);
    widths[5] = Math.max(widths[5], String(r.owners).length);
    widths[6] = Math.max(widths[6], String(r.envelopes).length);
    widths[7] = Math.max(widths[7], r.warn.length);
  }

  const lines = [];
  lines.push(headers.map((h, i) => pad(h, widths[i])).join('  '));
  lines.push(widths.map((w) => '-'.repeat(w)).join('  '));
  for (const r of rows) {
    lines.push([
      pad(r.version, widths[0]),
      pad(r.count, widths[1]),
      pad(r.first, widths[2]),
      pad(r.last, widths[3]),
      pad(r.shas, widths[4]),
      pad(r.owners, widths[5]),
      pad(r.envelopes, widths[6]),
      pad(r.warn, widths[7]),
    ].join('  '));
  }
  return { table: lines.join('\n'), rowCount: rows.length, edited: rows.filter((r) => r.warn).length };
}

async function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (err) {
    process.stderr.write(`error: ${err.message}\n`);
    printHelp();
    process.exit(2);
  }

  const targets = [INBOX_PATH];
  if (opts.archives) {
    const archives = await listArchiveFiles();
    targets.push(...archives);
  }

  const groups = new Map();
  const state = { matched: 0, totalScanned: 0 };
  let filesScanned = 0;
  for (const file of targets) {
    try {
      await fs.access(file);
    } catch {
      continue;
    }
    filesScanned++;
    await scanFile(file, opts, groups, state);
  }

  if (groups.size === 0) {
    process.stdout.write(
      `no FIRST_MESSAGE_CANON envelopes found | total_scanned: ${state.totalScanned} | files_scanned: ${filesScanned}\n`,
    );
    return;
  }

  const { table, rowCount, edited } = renderTable(groups);
  process.stdout.write(table + '\n');
  const targetNote = opts.target ? ` | target: ${opts.target}` : '';
  process.stdout.write(
    `versions: ${rowCount} | canon_envelopes: ${state.matched} | edited_versions: ${edited} | total_scanned: ${state.totalScanned} | files_scanned: ${filesScanned}${targetNote}\n`,
  );
}

main().catch((err) => {
  process.stderr.write(`fatal: ${err.stack || err.message}\n`);
  process.exit(1);
});
