#!/usr/bin/env node
// inbox-search.mjs
//
// Structured search across the active BEHCS inbox and (optionally) its
// rotated archives under data/behcs/inbox-archives/.
//
// Streams files line-by-line so memory stays bounded regardless of archive
// size. Filters AND together; one value per filter (no OR within a field).
//
// Usage:
//   node tools/behcs/inbox-search.mjs \
//     [--from <peer>] [--to <peer>] [--verb <verb>] [--type <type>] \
//     [--since <iso>] [--until <iso>] [--sha-prefix <hex8>] \
//     [--limit N] [--archives]
//
// Output:
//   - one matching envelope per line as compact JSON
//   - trailing summary line: "matched: N | total_scanned: M | files_searched: K"

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
    from: null,
    to: null,
    verb: null,
    type: null,
    since: null,
    until: null,
    shaPrefix: null,
    limit: Infinity,
    archives: false,
  };
  const flagMap = {
    '--from': 'from',
    '--to': 'to',
    '--verb': 'verb',
    '--type': 'type',
    '--since': 'since',
    '--until': 'until',
    '--sha-prefix': 'shaPrefix',
    '--limit': 'limit',
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
    const key = flagMap[arg];
    if (!key) {
      throw new Error(`Unknown flag: ${arg}`);
    }
    const val = argv[++i];
    if (val === undefined) {
      throw new Error(`Flag ${arg} requires a value`);
    }
    if (key === 'limit') {
      const n = Number(val);
      if (!Number.isFinite(n) || n < 0) {
        throw new Error(`--limit requires a non-negative number, got: ${val}`);
      }
      opts.limit = n;
    } else {
      opts[key] = val;
    }
  }
  // Validate ISO timestamps eagerly so a typo fails fast.
  for (const key of ['since', 'until']) {
    if (opts[key] !== null) {
      const t = Date.parse(opts[key]);
      if (Number.isNaN(t)) {
        throw new Error(`--${key} requires a valid ISO timestamp, got: ${opts[key]}`);
      }
      opts[`${key}Ms`] = t;
    }
  }
  if (opts.shaPrefix !== null) {
    if (!/^[0-9a-fA-F]{1,64}$/.test(opts.shaPrefix)) {
      throw new Error(`--sha-prefix must be hex (1-64 chars), got: ${opts.shaPrefix}`);
    }
    opts.shaPrefix = opts.shaPrefix.toLowerCase();
  }
  return opts;
}

function printHelp() {
  process.stdout.write(`inbox-search.mjs — BEHCS inbox + archive search

Filters (AND-combined, one value per flag):
  --from <peer>          envelope.from equals peer
  --to <peer>            envelope.to equals peer
  --verb <verb>          envelope.verb equals verb
  --type <type>          envelope.type equals type
  --since <iso>          envelope timestamp >= since (ts | received_at)
  --until <iso>          envelope timestamp <= until (ts | received_at)
  --sha-prefix <hex>     payload_sha256 or hash starts with hex prefix (lowercase)
  --limit N              stop after N matches
  --archives             also scan data/behcs/inbox-archives/inbox-*.ndjson

Output:
  matching envelopes as compact JSON, one per line, then a summary line.
`);
}

function getEnvelopeTimestamp(env) {
  // Prefer 'ts' (sender clock); fall back to 'received_at' (receiver clock).
  const raw = env.ts || env.received_at || null;
  if (!raw) return null;
  const t = Date.parse(raw);
  return Number.isNaN(t) ? null : t;
}

function findShaCandidates(env) {
  // Accept either a top-level payload_sha256 / hash, or a nested body.hash.
  // We look at a small set of well-known locations rather than a deep walk
  // so we stay fast on the hot path.
  const out = [];
  if (typeof env.payload_sha256 === 'string') out.push(env.payload_sha256);
  if (typeof env.hash === 'string') out.push(env.hash);
  if (env.body && typeof env.body === 'object') {
    if (typeof env.body.payload_sha256 === 'string') out.push(env.body.payload_sha256);
    if (typeof env.body.hash === 'string') out.push(env.body.hash);
  }
  if (env.payload && typeof env.payload === 'object') {
    if (typeof env.payload.payload_sha256 === 'string') out.push(env.payload.payload_sha256);
    if (typeof env.payload.hash === 'string') out.push(env.payload.hash);
  }
  return out;
}

function envelopeMatches(env, opts) {
  if (opts.from !== null && env.from !== opts.from) return false;
  if (opts.to !== null && env.to !== opts.to) return false;
  if (opts.verb !== null && env.verb !== opts.verb) return false;
  if (opts.type !== null && env.type !== opts.type) return false;
  if (opts.sinceMs !== undefined || opts.untilMs !== undefined) {
    const t = getEnvelopeTimestamp(env);
    if (t === null) return false;
    if (opts.sinceMs !== undefined && t < opts.sinceMs) return false;
    if (opts.untilMs !== undefined && t > opts.untilMs) return false;
  }
  if (opts.shaPrefix !== null) {
    const candidates = findShaCandidates(env);
    const hit = candidates.some((s) => s.toLowerCase().startsWith(opts.shaPrefix));
    if (!hit) return false;
  }
  return true;
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

async function searchFile(filePath, opts, state) {
  // Stream line-by-line; never load the whole file.
  let stream;
  try {
    stream = createReadStream(filePath, { encoding: 'utf8' });
  } catch (err) {
    if (err.code === 'ENOENT') return;
    throw err;
  }
  // If the file disappears between readdir and open, treat it as empty.
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
      // Skip malformed lines silently; archives can be truncated mid-write.
      continue;
    }
    if (!envelopeMatches(env, opts)) continue;
    process.stdout.write(JSON.stringify(env) + '\n');
    state.matched++;
    if (state.matched >= opts.limit) {
      rl.close();
      stream.destroy();
      state.limitHit = true;
      return;
    }
  }
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

  const state = { matched: 0, totalScanned: 0, limitHit: false };
  let filesSearched = 0;
  for (const file of targets) {
    if (state.limitHit) break;
    try {
      await fs.access(file);
    } catch {
      continue;
    }
    filesSearched++;
    await searchFile(file, opts, state);
  }

  process.stdout.write(
    `matched: ${state.matched} | total_scanned: ${state.totalScanned} | files_searched: ${filesSearched}\n`,
  );
}

main().catch((err) => {
  process.stderr.write(`fatal: ${err.stack || err.message}\n`);
  process.exit(1);
});
