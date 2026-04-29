#!/usr/bin/env node
// forbidden-audit.mjs — trend report over logs/agent-keyboard.log FORBIDDEN events
//
// Usage:
//   node tools/behcs/forbidden-audit.mjs [--days N]
//
// Background:
//   tools/agent-keyboard.js rejects /type requests whose payload matches one of
//   six destructive regex patterns (rm -rf, del /f, format C:, diskpart,
//   Remove-Item -Recurse -Force, BEGIN_DESTRUCTIVE_OP). Each rejection is
//   appended to logs/agent-keyboard.log via audit():
//
//     [<ISO ts>] [<source ip>] FORBIDDEN <pattern> text=<preview...>
//
//   This tool aggregates those rows by pattern, by source IP, and by day,
//   so we can watch for trends. Empty result is the expected baseline.

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
// repo root = two levels up from tools/behcs
const REPO_ROOT  = resolve(__dirname, '..', '..');
const LOG_PATH   = resolve(REPO_ROOT, 'logs', 'agent-keyboard.log');

// ---------- arg parsing ----------
function parseArgs(argv) {
  const out = { days: 30 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--days') {
      const v = parseInt(argv[++i], 10);
      if (!Number.isFinite(v) || v <= 0) {
        console.error(`error: --days must be a positive integer, got ${argv[i]}`);
        process.exit(2);
      }
      out.days = v;
    } else if (a === '--help' || a === '-h') {
      console.log('Usage: node forbidden-audit.mjs [--days N]   (default 30)');
      process.exit(0);
    } else {
      console.error(`error: unknown arg ${a}`);
      process.exit(2);
    }
  }
  return out;
}

// ---------- log parsing ----------
// Line shape produced by audit() in tools/agent-keyboard.js:
//   [2026-04-28T12:34:56.789Z] [127.0.0.1] FORBIDDEN /\brm\s+-rf?\s/i text=rm -rf /
// The regex below tolerates patterns containing spaces by using a lazy
// match up to ' text=' as the boundary.
const FORBIDDEN_RE =
  /^\[([^\]]+)\]\s+\[(.+?)\]\s+FORBIDDEN\s+(.+?)\s+text=(.*)$/;

function parseLine(line) {
  const m = FORBIDDEN_RE.exec(line);
  if (!m) return null;
  const [, ts, ip, pattern, preview] = m;
  const tsMs = Date.parse(ts);
  if (!Number.isFinite(tsMs)) return null;
  return { ts, tsMs, ip, pattern, preview };
}

function loadEvents(path) {
  if (!existsSync(path)) {
    console.error(`error: log file not found: ${path}`);
    process.exit(1);
  }
  const raw = readFileSync(path, 'utf8');
  const out = [];
  for (const line of raw.split(/\r?\n/)) {
    if (!line) continue;
    if (!line.includes('FORBIDDEN')) continue; // fast prefilter
    const rec = parseLine(line);
    if (rec) out.push(rec);
  }
  return out;
}

// ---------- table rendering (ASCII) ----------
function renderTable(headers, rows, aligns) {
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

  const events = all.filter(r => r.tsMs >= cutoff);

  // ===== Header =====
  console.log('forbidden-audit');
  console.log(`log:    ${LOG_PATH}`);
  console.log(`window: last ${args.days} day(s)  (cutoff ${new Date(cutoff).toISOString()})`);
  console.log(`FORBIDDEN events in window: ${events.length}  (total FORBIDDEN in file: ${all.length})`);
  console.log('');

  if (events.length === 0) {
    console.log('No FORBIDDEN events in window. Baseline OK.');
    return;
  }

  // ===== group by pattern =====
  const byPattern = new Map();
  for (const r of events) {
    const k = r.pattern;
    byPattern.set(k, (byPattern.get(k) || 0) + 1);
  }
  const patternRows = [...byPattern.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([p, c]) => [p, c]);

  console.log('Top patterns');
  console.log(renderTable(
    ['pattern', 'count'],
    patternRows,
    ['l', 'r'],
  ));
  console.log('');

  // ===== group by source IP =====
  const byIp = new Map();
  for (const r of events) {
    if (!byIp.has(r.ip)) {
      byIp.set(r.ip, { ip: r.ip, total: 0, patterns: new Set(), lastTs: '' });
    }
    const b = byIp.get(r.ip);
    b.total++;
    b.patterns.add(r.pattern);
    if (r.ts > b.lastTs) b.lastTs = r.ts;
  }
  const ipRows = [...byIp.values()]
    .sort((a, b) => b.total - a.total)
    .map(b => [b.ip, b.total, b.patterns.size, b.lastTs]);

  console.log('Top offending source IPs');
  console.log(renderTable(
    ['source_ip', 'count', 'distinct_patterns', 'last_seen'],
    ipRows,
    ['l', 'r', 'r', 'l'],
  ));
  console.log('');

  // ===== timeline by UTC day =====
  const dayMap = new Map();
  for (const r of events) {
    const d = new Date(r.tsMs).toISOString().slice(0, 10);
    dayMap.set(d, (dayMap.get(d) || 0) + 1);
  }
  const dayRows = [];
  for (let i = args.days - 1; i >= 0; i--) {
    const d = new Date(now - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    dayRows.push([d, dayMap.get(d) || 0]);
  }

  console.log(`Timeline (events per day, last ${args.days})`);
  console.log(renderTable(
    ['day (UTC)', 'count'],
    dayRows,
    ['l', 'r'],
  ));
}

main();
