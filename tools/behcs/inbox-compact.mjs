#!/usr/bin/env node
// tools/behcs/inbox-compact.mjs
//
// Manual on-demand compaction trigger for data/behcs/inbox.ndjson.
//
// Background: behcs-bus.js auto-GCs every 50 appends if line count > 1000,
// archiving to data/behcs/inbox-archives/inbox-<ts>.ndjson and keeping the
// last 500 active. This tool lets operators force a compaction without
// waiting for the threshold, with configurable --threshold and --keep.
//
// Behavior:
//   - Read data/behcs/inbox.ndjson line count.
//   - If count > --threshold N (default 500), archive lines older than the
//     latest --keep N (default 200) to inbox-archives/inbox-<iso>-manual.ndjson.
//   - Atomic write: write archive first, then write trimmed inbox to .tmp,
//     then rename over inbox.ndjson.
//   - Idempotent: no-op if count <= threshold.
//   - --dry-run: preview only, no filesystem mutation.
//   - Never deletes lines. Always archives before trim.
//
// CLI:  node inbox-compact.mjs [--dry-run] [--threshold N] [--keep N]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Match behcs-bus.js root resolution.
const ROOT = process.env.BEHCS_ROOT || 'C:/Users/acer/Asolaria';
const BEHCS_DIR = path.join(ROOT, 'data/behcs');
const INBOX = path.join(BEHCS_DIR, 'inbox.ndjson');
const ARCHIVE_DIR = path.resolve(
  process.env.ASOLARIA_BEHCS_INBOX_ARCHIVE_DIR ||
    path.join(__dirname, '..', '..', 'data', 'behcs', 'inbox-archives'),
);

function parseArgs(argv) {
  const opts = { dryRun: false, threshold: 500, keep: 200 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run' || a === '-n') {
      opts.dryRun = true;
    } else if (a === '--threshold') {
      const v = Number(argv[++i]);
      if (!Number.isFinite(v) || v < 0) {
        throw new Error(`--threshold requires a non-negative number, got ${argv[i]}`);
      }
      opts.threshold = v;
    } else if (a.startsWith('--threshold=')) {
      const v = Number(a.slice('--threshold='.length));
      if (!Number.isFinite(v) || v < 0) throw new Error(`bad --threshold value`);
      opts.threshold = v;
    } else if (a === '--keep') {
      const v = Number(argv[++i]);
      if (!Number.isFinite(v) || v < 0) {
        throw new Error(`--keep requires a non-negative number, got ${argv[i]}`);
      }
      opts.keep = v;
    } else if (a.startsWith('--keep=')) {
      const v = Number(a.slice('--keep='.length));
      if (!Number.isFinite(v) || v < 0) throw new Error(`bad --keep value`);
      opts.keep = v;
    } else if (a === '--help' || a === '-h') {
      printHelpAndExit(0);
    } else {
      throw new Error(`unknown argument: ${a}`);
    }
  }
  if (opts.keep > opts.threshold) {
    // Keeping more than the threshold means we would never archive anything;
    // refuse rather than silently trim zero lines.
    throw new Error(
      `--keep (${opts.keep}) must be <= --threshold (${opts.threshold})`,
    );
  }
  return opts;
}

function printHelpAndExit(code) {
  const msg = [
    'Usage: node inbox-compact.mjs [--dry-run] [--threshold N] [--keep N]',
    '',
    '  --dry-run       Preview only, do not modify any files.',
    '  --threshold N   Only compact when line count > N (default 500).',
    '  --keep N        Keep the most recent N lines in the active inbox',
    '                  after compaction (default 200).',
    '  -h, --help      Show this help.',
    '',
    'Reads:  data/behcs/inbox.ndjson',
    'Writes: data/behcs/inbox-archives/inbox-<iso>-manual.ndjson',
  ].join('\n');
  process.stdout.write(msg + '\n');
  process.exit(code);
}

function ensureDir(d) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

function readInboxLines(p) {
  if (!fs.existsSync(p)) return [];
  const data = fs.readFileSync(p, 'utf8');
  return data.split('\n').filter(Boolean);
}

function isoStampForFilename() {
  // Same convention as gcSweepInbox: replace ':' and '.' with '-'.
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (e) {
    process.stderr.write(`error: ${e.message}\n`);
    printHelpAndExit(2);
    return;
  }

  const lines = readInboxLines(INBOX);
  const before = lines.length;

  // Idempotent / no-op when below threshold.
  if (before <= opts.threshold) {
    process.stdout.write(
      `before=${before}, archived=0, kept=${before}, archive_file=(none; below threshold ${opts.threshold})\n`,
    );
    return;
  }

  const keep = opts.keep;
  const archived = lines.slice(0, Math.max(0, before - keep));
  const kept = lines.slice(-keep);

  const archiveFile = path.join(
    ARCHIVE_DIR,
    `inbox-${isoStampForFilename()}-manual.ndjson`,
  );

  if (opts.dryRun) {
    process.stdout.write(
      `[dry-run] before=${before}, archived=${archived.length}, kept=${kept.length}, archive_file=${archiveFile}\n`,
    );
    return;
  }

  // 1) Archive first (never delete before archive succeeds).
  ensureDir(ARCHIVE_DIR);
  fs.writeFileSync(archiveFile, archived.join('\n') + '\n');

  // 2) Atomically replace inbox: write to .tmp, then rename.
  const tmp = INBOX + '.compact.tmp';
  fs.writeFileSync(tmp, kept.join('\n') + '\n');
  fs.renameSync(tmp, INBOX);

  process.stdout.write(
    `before=${before}, archived=${archived.length}, kept=${kept.length}, archive_file=${archiveFile}\n`,
  );
}

main();
