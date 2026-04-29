#!/usr/bin/env node
/**
 * cascade-runner.mjs — Asolaria cascade-wave bookkeeping ledger
 *
 * Simple append-only NDJSON journal of cascade dispatches across waves.
 * Flat, grep-friendly, no DB. One line per ledger entry.
 *
 * Storage:
 *   <repo-root>/data/behcs/state/cascade-ledger.ndjson
 *
 * CLI:
 *   node cascade-runner.mjs append --wave <name> --cascade-id <Cn> \
 *       --title <title> --status <queued|in-progress|done|failed> \
 *       [--receipt-paths <comma-list>] [--notes <text>]
 *
 *   node cascade-runner.mjs list   [--wave <name>] [--status <s>]
 *   node cascade-runner.mjs report [--wave <name>]
 *
 * Notes:
 *   - Append never mutates prior lines. Re-running append for the same
 *     cascade-id just adds another row (history-as-log).
 *   - Report = last-row-wins per (wave, cascade-id) and pretty-prints.
 */

import { promises as fsp } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// data/behcs/state/ lives at repo-root/data/behcs/state (this file is at tools/behcs/)
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const LEDGER_PATH = path.join(REPO_ROOT, 'data', 'behcs', 'state', 'cascade-ledger.ndjson');

const VALID_STATUS = new Set(['queued', 'in-progress', 'done', 'failed']);

// ---------- arg parsing ----------

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const tok = argv[i];
    if (tok.startsWith('--')) {
      const key = tok.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) {
        out[key] = true;
      } else {
        out[key] = next;
        i++;
      }
    } else {
      out._.push(tok);
    }
  }
  return out;
}

// ---------- io ----------

async function ensureLedgerDir() {
  await fsp.mkdir(path.dirname(LEDGER_PATH), { recursive: true });
}

async function readEntries() {
  try {
    const raw = await fsp.readFile(LEDGER_PATH, 'utf8');
    const out = [];
    for (const line of raw.split(/\r?\n/)) {
      const t = line.trim();
      if (!t) continue;
      try {
        out.push(JSON.parse(t));
      } catch {
        // skip malformed lines instead of crashing the journal
      }
    }
    return out;
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }
}

async function appendEntry(entry) {
  await ensureLedgerDir();
  await fsp.appendFile(LEDGER_PATH, JSON.stringify(entry) + '\n', 'utf8');
}

// ---------- commands ----------

async function cmdAppend(args) {
  const wave = args.wave;
  const cascadeId = args['cascade-id'];
  const title = args.title;
  const status = args.status;
  const receiptPathsRaw = args['receipt-paths'];
  const notes = args.notes;

  const errs = [];
  if (!wave || wave === true) errs.push('--wave is required');
  if (!cascadeId || cascadeId === true) errs.push('--cascade-id is required');
  if (!title || title === true) errs.push('--title is required');
  if (!status || status === true) errs.push('--status is required');
  if (status && status !== true && !VALID_STATUS.has(status)) {
    errs.push(`--status must be one of: ${[...VALID_STATUS].join('|')}`);
  }
  if (errs.length) {
    console.error('append: ' + errs.join('; '));
    process.exit(2);
  }

  const receipt_paths = receiptPathsRaw && receiptPathsRaw !== true
    ? String(receiptPathsRaw).split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const entry = {
    ts: new Date().toISOString(),
    wave,
    cascade_id: cascadeId,
    title,
    status,
    receipt_paths,
    notes: (notes && notes !== true) ? String(notes) : '',
  };

  await appendEntry(entry);
  console.log(`appended ${wave} ${cascadeId} status=${status}`);
}

async function cmdList(args) {
  const entries = await readEntries();
  const filtered = entries.filter(e => {
    if (args.wave && args.wave !== true && e.wave !== args.wave) return false;
    if (args.status && args.status !== true && e.status !== args.status) return false;
    return true;
  });
  for (const e of filtered) {
    console.log(JSON.stringify(e));
  }
}

// last-row-wins per (wave, cascade_id) for snapshot view
function snapshot(entries, waveFilter) {
  const byKey = new Map();
  for (const e of entries) {
    if (waveFilter && e.wave !== waveFilter) continue;
    const k = `${e.wave}\u0000${e.cascade_id}`;
    byKey.set(k, e); // later entries overwrite earlier
  }
  return [...byKey.values()];
}

function cmpCascadeId(a, b) {
  // sort C1, C2, ..., C10 numerically when prefix matches
  const ma = /^([A-Za-z]+)(\d+)$/.exec(a);
  const mb = /^([A-Za-z]+)(\d+)$/.exec(b);
  if (ma && mb && ma[1] === mb[1]) {
    return Number(ma[2]) - Number(mb[2]);
  }
  return String(a).localeCompare(String(b));
}

function pad(s, n) {
  s = String(s);
  if (s.length >= n) return s.slice(0, n);
  return s + ' '.repeat(n - s.length);
}

function truncate(s, n) {
  s = String(s ?? '');
  return s.length <= n ? s : s.slice(0, n - 1) + '…';
}

// glob-ish pattern -> RegExp. supports * and ?. anchored.
function globToRegExp(pattern) {
  let re = '^';
  for (const ch of pattern) {
    if (ch === '*') re += '.*';
    else if (ch === '?') re += '.';
    else re += ch.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  re += '$';
  return new RegExp(re);
}

async function cmdQuery(args) {
  const wavePat = (args.wave && args.wave !== true) ? args.wave : null;
  const idPat = (args['cascade-id'] && args['cascade-id'] !== true) ? args['cascade-id'] : null;
  const statusFilter = (args.status && args.status !== true) ? args.status : null;
  const sinceRaw = (args.since && args.since !== true) ? args.since : null;
  const receiptSub = (args['has-receipt-path'] && args['has-receipt-path'] !== true)
    ? args['has-receipt-path'] : null;
  const asJson = !!args.json;

  if (statusFilter && !VALID_STATUS.has(statusFilter)) {
    console.error(`query: --status must be one of: ${[...VALID_STATUS].join('|')}`);
    process.exit(2);
  }

  let sinceMs = null;
  if (sinceRaw) {
    sinceMs = Date.parse(sinceRaw);
    if (Number.isNaN(sinceMs)) {
      console.error(`query: --since not a valid ISO timestamp: ${sinceRaw}`);
      process.exit(2);
    }
  }

  const waveRe = wavePat ? globToRegExp(wavePat) : null;
  const idRe = idPat ? globToRegExp(idPat) : null;

  const entries = await readEntries();
  // snapshot semantics: last-row-wins per (wave, cascade_id), then filter
  const snap = snapshot(entries, null);

  const rows = snap.filter(e => {
    if (waveRe && !waveRe.test(String(e.wave))) return false;
    if (idRe && !idRe.test(String(e.cascade_id))) return false;
    if (statusFilter && e.status !== statusFilter) return false;
    if (sinceMs !== null) {
      const t = Date.parse(e.ts);
      if (Number.isNaN(t) || t < sinceMs) return false;
    }
    if (receiptSub) {
      const paths = e.receipt_paths || [];
      if (!paths.some(p => String(p).includes(receiptSub))) return false;
    }
    return true;
  }).sort((a, b) => {
    if (a.wave !== b.wave) return a.wave.localeCompare(b.wave);
    return cmpCascadeId(a.cascade_id, b.cascade_id);
  });

  if (asJson) {
    console.log(JSON.stringify(rows, null, 2));
    return;
  }

  const COLS = [
    { label: 'WAVE',     w: 24 },
    { label: 'ID',       w: 5  },
    { label: 'STATUS',   w: 11 },
    { label: 'TS',       w: 20 },
    { label: 'TITLE',    w: 32 },
    { label: 'RECEIPTS', w: 36 },
  ];
  const sep = '+' + COLS.map(c => '-'.repeat(c.w + 2)).join('+') + '+';
  const header = '|' + COLS.map(c => ' ' + pad(c.label, c.w) + ' ').join('|') + '|';

  const filterDesc = [];
  if (wavePat) filterDesc.push(`wave=${wavePat}`);
  if (idPat) filterDesc.push(`cascade-id=${idPat}`);
  if (statusFilter) filterDesc.push(`status=${statusFilter}`);
  if (sinceRaw) filterDesc.push(`since=${sinceRaw}`);
  if (receiptSub) filterDesc.push(`receipt~=${receiptSub}`);
  const fd = filterDesc.length ? ' ' + filterDesc.join(' ') : '';

  console.log(`cascade-ledger query${fd}  rows=${rows.length}`);
  console.log(sep);
  console.log(header);
  console.log(sep);
  for (const r of rows) {
    const receipts = (r.receipt_paths || []).join(', ');
    const cells = [
      pad(truncate(r.wave, 24), 24),
      pad(truncate(r.cascade_id, 5), 5),
      pad(truncate(r.status, 11), 11),
      pad(truncate(r.ts || '', 20), 20),
      pad(truncate(r.title, 32), 32),
      pad(truncate(receipts, 36), 36),
    ];
    console.log('| ' + cells.join(' | ') + ' |');
  }
  console.log(sep);
}

async function cmdSummary(args) {
  const wavePat = (args.wave && args.wave !== true) ? args.wave : null;
  const asJson = !!args.json;
  const waveRe = wavePat ? globToRegExp(wavePat) : null;

  const entries = await readEntries();
  const snap = snapshot(entries, null).filter(e =>
    !waveRe || waveRe.test(String(e.wave))
  );

  const byWave = new Map();
  for (const e of snap) {
    if (!byWave.has(e.wave)) {
      byWave.set(e.wave, { wave: e.wave, total: 0, queued: 0, 'in-progress': 0, done: 0, failed: 0 });
    }
    const row = byWave.get(e.wave);
    row.total += 1;
    if (VALID_STATUS.has(e.status)) row[e.status] += 1;
  }

  const rows = [...byWave.values()].sort((a, b) => a.wave.localeCompare(b.wave));

  if (asJson) {
    console.log(JSON.stringify(rows, null, 2));
    return;
  }

  const COLS = [
    { label: 'WAVE',        w: 24 },
    { label: 'TOTAL',       w: 6 },
    { label: 'DONE',        w: 6 },
    { label: 'FAILED',      w: 6 },
    { label: 'IN-PROGRESS', w: 11 },
    { label: 'QUEUED',      w: 6 },
  ];
  const sep = '+' + COLS.map(c => '-'.repeat(c.w + 2)).join('+') + '+';
  const header = '|' + COLS.map(c => ' ' + pad(c.label, c.w) + ' ').join('|') + '|';

  let tot = 0, done = 0, failed = 0, inprog = 0, queued = 0;
  console.log(`cascade-ledger summary  waves=${rows.length}`);
  console.log(sep);
  console.log(header);
  console.log(sep);
  for (const r of rows) {
    tot += r.total; done += r.done; failed += r.failed;
    inprog += r['in-progress']; queued += r.queued;
    const cells = [
      pad(truncate(r.wave, 24), 24),
      pad(String(r.total), 6),
      pad(String(r.done), 6),
      pad(String(r.failed), 6),
      pad(String(r['in-progress']), 11),
      pad(String(r.queued), 6),
    ];
    console.log('| ' + cells.join(' | ') + ' |');
  }
  console.log(sep);
  const totals = [
    pad('TOTAL', 24),
    pad(String(tot), 6),
    pad(String(done), 6),
    pad(String(failed), 6),
    pad(String(inprog), 11),
    pad(String(queued), 6),
  ];
  console.log('| ' + totals.join(' | ') + ' |');
  console.log(sep);
}

async function cmdReport(args) {
  const waveFilter = (args.wave && args.wave !== true) ? args.wave : null;
  const entries = await readEntries();
  const rows = snapshot(entries, waveFilter).sort((a, b) => {
    if (a.wave !== b.wave) return a.wave.localeCompare(b.wave);
    return cmpCascadeId(a.cascade_id, b.cascade_id);
  });

  const COLS = [
    { k: 'wave',        label: 'WAVE',     w: 24 },
    { k: 'cascade_id',  label: 'ID',       w: 5  },
    { k: 'status',      label: 'STATUS',   w: 11 },
    { k: 'title',       label: 'TITLE',    w: 38 },
    { k: 'receipts',    label: 'RECEIPTS', w: 44 },
  ];

  const sep = '+' + COLS.map(c => '-'.repeat(c.w + 2)).join('+') + '+';
  const header = '|' + COLS.map(c => ' ' + pad(c.label, c.w) + ' ').join('|') + '|';

  const wave = waveFilter ? ` wave=${waveFilter}` : '';
  console.log(`cascade-ledger report${wave}  rows=${rows.length}`);
  console.log(sep);
  console.log(header);
  console.log(sep);

  for (const r of rows) {
    const receipts = (r.receipt_paths || []).join(', ');
    const cells = [
      pad(truncate(r.wave, 24), 24),
      pad(truncate(r.cascade_id, 5), 5),
      pad(truncate(r.status, 11), 11),
      pad(truncate(r.title, 38), 38),
      pad(truncate(receipts, 44), 44),
    ];
    console.log('| ' + cells.join(' | ') + ' |');
  }
  console.log(sep);
}

// ---------- main ----------

async function main() {
  const argv = process.argv.slice(2);
  const sub = argv[0];
  const args = parseArgs(argv.slice(1));

  switch (sub) {
    case 'append':  return cmdAppend(args);
    case 'list':    return cmdList(args);
    case 'report':  return cmdReport(args);
    case 'query':   return cmdQuery(args);
    case 'summary': return cmdSummary(args);
    case undefined:
    case '-h':
    case '--help':
    case 'help':
      console.log([
        'cascade-runner.mjs — append-only ledger for cascade waves',
        '',
        'Usage:',
        '  cascade-runner.mjs append --wave <name> --cascade-id <Cn> --title <t> \\',
        '                            --status <queued|in-progress|done|failed> \\',
        '                            [--receipt-paths <comma-list>] [--notes <text>]',
        '  cascade-runner.mjs list    [--wave <name>] [--status <s>]',
        '  cascade-runner.mjs report  [--wave <name>]',
        '  cascade-runner.mjs query   [--wave <glob>] [--cascade-id <glob>] [--status <s>] \\',
        '                             [--since <iso>] [--has-receipt-path <substr>] [--json]',
        '  cascade-runner.mjs summary [--wave <glob>] [--json]',
        '',
        `ledger: ${LEDGER_PATH}`,
      ].join('\n'));
      return;
    default:
      console.error(`unknown subcommand: ${sub}`);
      process.exit(2);
  }
}

main().catch(err => {
  console.error('cascade-runner error:', err && err.stack || err);
  process.exit(1);
});
