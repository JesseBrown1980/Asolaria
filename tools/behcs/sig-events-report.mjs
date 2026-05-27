#!/usr/bin/env node
// sig-events-report.mjs — quick-look analytics over data/behcs/ingress-sig-events.ndjson
//
// Usage:
//   node tools/behcs/sig-events-report.mjs [--days N] [--key <key_id>]
//
// Each line of the log is a JSON record like:
//   { "event": "EVT-INGRESS-SIG-VERIFIED|REJECTED|UNSIGNED", "ts": "...",
//     "key_id": "...", "owner_glyph": "...", "reason": "..." }
//
// Verdict is parsed from the `event` field suffix.

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
// repo root = two levels up from tools/behcs
const REPO_ROOT  = resolve(__dirname, '..', '..');
const LOG_PATH   = resolve(REPO_ROOT, 'data', 'behcs', 'ingress-sig-events.ndjson');

// ---------- arg parsing ----------
function parseArgs(argv) {
  const out = { days: 14, key: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--days') {
      const v = parseInt(argv[++i], 10);
      if (!Number.isFinite(v) || v <= 0) {
        console.error(`error: --days must be a positive integer, got ${argv[i]}`);
        process.exit(2);
      }
      out.days = v;
    } else if (a === '--key') {
      out.key = argv[++i];
      if (!out.key) {
        console.error('error: --key requires a value');
        process.exit(2);
      }
    } else if (a === '--help' || a === '-h') {
      console.log('Usage: node sig-events-report.mjs [--days N] [--key <key_id>]');
      process.exit(0);
    } else {
      console.error(`error: unknown arg ${a}`);
      process.exit(2);
    }
  }
  return out;
}

// ---------- verdict extraction ----------
function verdictOf(rec) {
  const ev = String(rec.event || '');
  if (ev.endsWith('-VERIFIED')) return 'VERIFIED';
  if (ev.endsWith('-REJECTED')) return 'REJECTED';
  if (ev.endsWith('-UNSIGNED')) return 'UNSIGNED';
  return 'OTHER';
}

// ---------- file read ----------
function loadEvents(path) {
  if (!existsSync(path)) {
    console.error(`error: log file not found: ${path}`);
    process.exit(1);
  }
  const raw = readFileSync(path, 'utf8');
  const out = [];
  let lineNo = 0;
  for (const line of raw.split(/\r?\n/)) {
    lineNo++;
    const t = line.trim();
    if (!t) continue;
    try {
      out.push(JSON.parse(t));
    } catch {
      // skip malformed line
      console.error(`warn: malformed JSON at line ${lineNo}, skipping`);
    }
  }
  return out;
}

// ---------- table rendering (ASCII) ----------
function renderTable(headers, rows, aligns) {
  // aligns: array of 'l'|'r' per column
  const cols = headers.length;
  const widths = headers.map(h => String(h).length);
  for (const row of rows) {
    for (let i = 0; i < cols; i++) {
      const v = row[i] == null ? '' : String(row[i]);
      if (v.length > widths[i]) widths[i] = v.length;
    }
  }
  const pad = (v, i) => {
    const s = v == null ? '' : String(v);
    const align = (aligns && aligns[i]) || 'l';
    return align === 'r' ? s.padStart(widths[i]) : s.padEnd(widths[i]);
  };
  const sep = '+-' + widths.map(w => '-'.repeat(w)).join('-+-') + '-+';
  const fmtRow = r => '| ' + r.map((v, i) => pad(v, i)).join(' | ') + ' |';
  const lines = [];
  lines.push(sep);
  lines.push(fmtRow(headers));
  lines.push(sep);
  for (const row of rows) lines.push(fmtRow(row));
  lines.push(sep);
  return lines.join('\n');
}

// ---------- main ----------
function main() {
  const args = parseArgs(process.argv.slice(2));
  const all  = loadEvents(LOG_PATH);

  const now      = Date.now();
  const windowMs = args.days * 24 * 60 * 60 * 1000;
  const cutoff   = now - windowMs;

  // filter to window + optional key
  const events = all.filter(r => {
    const ts = Date.parse(r.ts);
    if (!Number.isFinite(ts)) return false;
    if (ts < cutoff) return false;
    if (args.key && r.key_id !== args.key) return false;
    return true;
  });

  // group by key_id
  const byKey = new Map();
  for (const r of events) {
    const k = r.key_id || '<no-key>';
    if (!byKey.has(k)) {
      byKey.set(k, {
        key_id: k,
        owner_glyph: r.owner_glyph || '',
        total: 0,
        verified: 0,
        rejected: 0,
        unsigned: 0,
        other: 0,
        reasons: new Map(), // reason -> count (rejections only)
      });
    }
    const b = byKey.get(k);
    if (!b.owner_glyph && r.owner_glyph) b.owner_glyph = r.owner_glyph;
    b.total++;
    const v = verdictOf(r);
    if (v === 'VERIFIED') b.verified++;
    else if (v === 'REJECTED') {
      b.rejected++;
      const reason = r.reason || '<no-reason>';
      b.reasons.set(reason, (b.reasons.get(reason) || 0) + 1);
    } else if (v === 'UNSIGNED') b.unsigned++;
    else b.other++;
  }

  // ===== Header =====
  console.log('sig-events-report');
  console.log(`log:    ${LOG_PATH}`);
  console.log(`window: last ${args.days} day(s)  (cutoff ${new Date(cutoff).toISOString()})`);
  if (args.key) console.log(`filter: key_id=${args.key}`);
  console.log(`events in window: ${events.length}  (total in file: ${all.length})`);
  console.log('');

  // ===== Per-key summary =====
  const keyRows = [...byKey.values()]
    .sort((a, b) => b.total - a.total)
    .map(b => {
      const rate = b.total ? (b.rejected / b.total) : 0;
      const top3 = [...b.reasons.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([r, c]) => `${r}(${c})`)
        .join(', ') || '-';
      return [
        b.key_id,
        b.owner_glyph || '-',
        b.total,
        b.verified,
        b.rejected,
        b.unsigned,
        (rate * 100).toFixed(1) + '%',
        top3,
      ];
    });

  console.log('Per-key summary');
  if (keyRows.length === 0) {
    console.log('  (no events in window)');
  } else {
    console.log(renderTable(
      ['key_id', 'owner', 'total', 'verified', 'rejected', 'unsigned', 'rej_rate', 'top_3_rejection_reasons'],
      keyRows,
      ['l', 'l', 'r', 'r', 'r', 'r', 'r', 'l'],
    ));
  }
  console.log('');

  // ===== Time-series: events per day =====
  // bucket by UTC date (YYYY-MM-DD)
  const dayMap = new Map();
  for (const r of events) {
    const d = new Date(Date.parse(r.ts)).toISOString().slice(0, 10);
    if (!dayMap.has(d)) dayMap.set(d, { day: d, total: 0, verified: 0, rejected: 0, unsigned: 0 });
    const b = dayMap.get(d);
    b.total++;
    const v = verdictOf(r);
    if (v === 'VERIFIED') b.verified++;
    else if (v === 'REJECTED') b.rejected++;
    else if (v === 'UNSIGNED') b.unsigned++;
  }
  // fill missing days with zeros across the window
  const dayRows = [];
  for (let i = args.days - 1; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const b = dayMap.get(d) || { day: d, total: 0, verified: 0, rejected: 0, unsigned: 0 };
    dayRows.push([b.day, b.total, b.verified, b.rejected, b.unsigned]);
  }

  console.log(`Time-series (events per day, last ${args.days})`);
  console.log(renderTable(
    ['day (UTC)', 'total', 'verified', 'rejected', 'unsigned'],
    dayRows,
    ['l', 'r', 'r', 'r', 'r'],
  ));
  console.log('');

  // ===== Anomalies =====
  // any key with rejection_rate > 5% AND total >= 10 in window
  const anomRows = [...byKey.values()]
    .filter(b => b.total >= 10 && (b.rejected / b.total) > 0.05)
    .sort((a, b) => (b.rejected / b.total) - (a.rejected / a.total))
    .map(b => {
      const rate = b.rejected / b.total;
      const top = [...b.reasons.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([r, c]) => `${r}(${c})`)
        .join(', ') || '-';
      return [
        b.key_id,
        b.owner_glyph || '-',
        b.total,
        b.rejected,
        (rate * 100).toFixed(1) + '%',
        top,
      ];
    });

  console.log('Anomalies (rejection_rate > 5% AND events >= 10)');
  if (anomRows.length === 0) {
    console.log('  (none)');
  } else {
    console.log(renderTable(
      ['key_id', 'owner', 'total', 'rejected', 'rej_rate', 'top_3_rejection_reasons'],
      anomRows,
      ['l', 'l', 'r', 'r', 'r', 'l'],
    ));
  }
}

main();
