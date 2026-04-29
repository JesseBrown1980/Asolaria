#!/usr/bin/env node
// inbox-dedup-check.mjs — verify bus envelope id uniqueness across inbox.ndjson
// (and optionally inbox-archives/*) on acer.
//
// Background: the bus is supposed to dedupe by envelope `id`. Drift would
// silently corrupt cosign chains. This tool independently re-counts ids and
// reports any with count > 1.
//
// Usage:
//   node inbox-dedup-check.mjs [--archives] [--limit N]
//
// Exit codes:
//   0 — no duplicates
//   1 — at least one id appears more than once
//   2 — runtime error (missing inbox file, etc.)

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

const ROOT = path.resolve(process.argv[1], '..', '..', '..');
const INBOX = path.join(ROOT, 'data', 'behcs', 'inbox.ndjson');
const ARCHIVES_DIR = path.join(ROOT, 'data', 'behcs', 'inbox-archives');

function parseArgs(argv) {
  const opts = { archives: false, limit: 0 };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--archives') opts.archives = true;
    else if (a === '--limit') {
      const v = parseInt(argv[++i], 10);
      if (!Number.isFinite(v) || v < 0) {
        console.error(`bad --limit value: ${argv[i]}`);
        process.exit(2);
      }
      opts.limit = v;
    } else if (a === '--help' || a === '-h') {
      console.log('usage: node inbox-dedup-check.mjs [--archives] [--limit N]');
      process.exit(0);
    } else {
      console.error(`unknown arg: ${a}`);
      process.exit(2);
    }
  }
  return opts;
}

async function streamFile(filePath, onLine, limit) {
  const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  let n = 0;
  for await (const line of rl) {
    if (!line.trim()) continue;
    onLine(line, filePath, n);
    n++;
    if (limit && n >= limit) {
      rl.close();
      stream.destroy();
      break;
    }
  }
  return n;
}

function collectFiles(opts) {
  const files = [];
  if (!fs.existsSync(INBOX)) {
    console.error(`inbox missing: ${INBOX}`);
    process.exit(2);
  }
  files.push(INBOX);
  if (opts.archives) {
    if (!fs.existsSync(ARCHIVES_DIR)) {
      console.error(`archives dir missing: ${ARCHIVES_DIR}`);
      process.exit(2);
    }
    const entries = fs.readdirSync(ARCHIVES_DIR)
      .filter((f) => f.endsWith('.ndjson') || f.endsWith('.json'))
      .sort();
    for (const e of entries) files.push(path.join(ARCHIVES_DIR, e));
  }
  return files;
}

async function main() {
  const opts = parseArgs(process.argv);
  const files = collectFiles(opts);

  // Per-id occurrences. Keep tuples (ts, from, to, type, source).
  /** @type {Map<string, Array<{ts:string, from:string, to:string, type:string, source:string}>>} */
  const ids = new Map();
  let totalLines = 0;
  let totalParsed = 0;
  let totalParseErrors = 0;
  let totalNoId = 0;

  for (const file of files) {
    const remaining = opts.limit ? Math.max(0, opts.limit - totalLines) : 0;
    if (opts.limit && remaining === 0) break;
    const sourceLabel = path.relative(ROOT, file).replace(/\\/g, '/');
    await streamFile(file, (line) => {
      totalLines++;
      let env;
      try {
        env = JSON.parse(line);
      } catch {
        totalParseErrors++;
        return;
      }
      totalParsed++;
      const id = env && typeof env.id === 'string' ? env.id : null;
      if (!id) {
        totalNoId++;
        return;
      }
      const tuple = {
        ts: env.ts ?? '',
        from: env.from ?? '',
        to: env.to ?? '',
        type: env.type ?? '',
        source: sourceLabel,
      };
      const arr = ids.get(id);
      if (arr) arr.push(tuple);
      else ids.set(id, [tuple]);
    }, remaining);
  }

  const dupIds = [];
  for (const [id, arr] of ids) {
    if (arr.length > 1) dupIds.push(id);
  }
  // Sort dup ids by occurrence count desc, then id asc.
  dupIds.sort((a, b) => {
    const da = ids.get(a).length;
    const db = ids.get(b).length;
    if (db !== da) return db - da;
    return a < b ? -1 : a > b ? 1 : 0;
  });

  // Report
  console.log(`inbox-dedup-check  files=${files.length}  archives=${opts.archives}  limit=${opts.limit || 'none'}`);
  for (const f of files) {
    console.log(`  scan: ${path.relative(ROOT, f).replace(/\\/g, '/')}`);
  }
  if (totalParseErrors) console.log(`  parse_errors: ${totalParseErrors}`);
  if (totalNoId) console.log(`  envelopes_without_id: ${totalNoId}`);

  if (dupIds.length > 0) {
    console.log('');
    console.log('DUPLICATES FOUND:');
    for (const id of dupIds) {
      const occs = ids.get(id);
      console.log(`  id=${id}  count=${occs.length}`);
      for (const o of occs) {
        console.log(`    - ts=${o.ts}  from=${o.from}  to=${o.to}  type=${o.type}  source=${o.source}`);
      }
    }
  }

  console.log('');
  console.log(`SUMMARY: total_lines: ${totalLines} | unique_ids: ${ids.size} | duplicates: ${dupIds.length}`);

  process.exit(dupIds.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('inbox-dedup-check failed:', err);
  process.exit(2);
});
