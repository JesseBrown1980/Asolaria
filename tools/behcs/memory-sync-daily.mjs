#!/usr/bin/env node
/**
 * memory-sync-daily.mjs — daily MEMORY.md hygiene auto-check (acer)
 *
 * Wires prior-wave C9's memory-sync verifier into a daily auto-check.
 * Writes a structured per-day log to logs/memory-sync-<yyyy-mm-dd>.log
 * (idempotent: same-day re-runs replace previous file). If drift is
 * detected (missing_files / malformed_frontmatter / orphans), also
 * appends an envelope to acer's bus inbox via :4947/behcs/send.
 *
 * Verification rules:
 *   - missing_files       : MEMORY.md links a file that does not exist on disk
 *   - malformed_frontmatter: a referenced .md file is missing the ---..--- block
 *                           or its frontmatter does not contain `name:` and
 *                           `type:` keys (skipped for MEMORY.md itself)
 *   - orphans             : a .md file in the memory dir that is not linked
 *                           from MEMORY.md (excluding MEMORY.md itself)
 *
 * If `tools/behcs/memory-sync-check.mjs` is present, that module's
 * `runCheck()` is preferred; otherwise this script's local verifier runs.
 *
 * Usage:
 *   node tools/behcs/memory-sync-daily.mjs            # run, write log, alert if drift
 *   node tools/behcs/memory-sync-daily.mjs --quiet    # suppress stdout
 *   node tools/behcs/memory-sync-daily.mjs --no-bus   # skip bus alert (testing)
 */

import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..', '..');                // C:\Users\acer\Asolaria
const MEMORY_DIR = 'C:\\Users\\acer\\.claude\\projects\\C--\\memory';
const MEMORY_INDEX = path.join(MEMORY_DIR, 'MEMORY.md');
const LOG_DIR = path.join(ROOT, 'logs');
const BUS_HOST = '127.0.0.1';
const BUS_PORT = 4947;
const BUS_PATH = '/behcs/send';
const SISTER_CHECK = path.join(__dirname, 'memory-sync-check.mjs');

const args = new Set(process.argv.slice(2));
const QUIET = args.has('--quiet');
const NO_BUS = args.has('--no-bus');

function log(...a) { if (!QUIET) console.log(...a); }
function todayLocal() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ──────────────────────────────────────────────────────────────────────
// Local verifier (used when memory-sync-check.mjs not present)
// ──────────────────────────────────────────────────────────────────────

function parseLinks(memoryMdContent) {
  // Captures markdown links of the form [text](file.md) — first capture group
  // is the href. Only same-dir relative .md links count.
  const out = new Set();
  const re = /\[[^\]]+\]\(([^)\s]+\.md)\)/g;
  let m;
  while ((m = re.exec(memoryMdContent)) !== null) {
    const href = m[1].trim();
    if (href.startsWith('http://') || href.startsWith('https://')) continue;
    if (href.includes('/') || href.includes('\\')) continue; // not same-dir
    out.add(href);
  }
  return [...out];
}

function checkFrontmatter(filePath) {
  // Returns { ok, reason } — `ok:false` means malformed.
  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    return { ok: false, reason: `unreadable:${e.code || 'err'}` };
  }
  // Strip BOM
  if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
  const lines = raw.split(/\r?\n/);
  // First non-blank line must be `---`
  let i = 0;
  while (i < lines.length && lines[i].trim() === '') i++;
  if (i >= lines.length || lines[i].trim() !== '---') {
    return { ok: false, reason: 'no_frontmatter_open' };
  }
  // Find closing `---`
  let close = -1;
  for (let j = i + 1; j < lines.length; j++) {
    if (lines[j].trim() === '---') { close = j; break; }
  }
  if (close < 0) return { ok: false, reason: 'no_frontmatter_close' };
  const block = lines.slice(i + 1, close).join('\n');
  if (!/^name\s*:\s*\S/m.test(block)) return { ok: false, reason: 'missing_name' };
  if (!/^type\s*:\s*\S/m.test(block)) return { ok: false, reason: 'missing_type' };
  return { ok: true };
}

function localRunCheck() {
  const t0 = Date.now();
  if (!fs.existsSync(MEMORY_INDEX)) {
    return {
      ok: false,
      memory_dir: MEMORY_DIR,
      memory_index: MEMORY_INDEX,
      missing_files: [],
      malformed_frontmatter: [],
      orphans: [],
      ok_count: 0,
      error: 'memory_index_missing',
      duration_ms: Date.now() - t0,
    };
  }
  const indexRaw = fs.readFileSync(MEMORY_INDEX, 'utf8');
  const linked = parseLinks(indexRaw);
  const linkedSet = new Set(linked);

  const dirEntries = fs.readdirSync(MEMORY_DIR);
  const onDiskMd = new Set(dirEntries.filter(f => f.toLowerCase().endsWith('.md') && f !== 'MEMORY.md'));

  const missing_files = [];
  const malformed_frontmatter = [];
  let ok_count = 0;

  for (const link of linked) {
    const full = path.join(MEMORY_DIR, link);
    if (!fs.existsSync(full)) {
      missing_files.push(link);
      continue;
    }
    const fm = checkFrontmatter(full);
    if (!fm.ok) {
      malformed_frontmatter.push({ file: link, reason: fm.reason });
    } else {
      ok_count++;
    }
  }

  const orphans = [];
  for (const f of onDiskMd) {
    if (!linkedSet.has(f)) orphans.push(f);
  }

  return {
    ok: missing_files.length === 0 && malformed_frontmatter.length === 0 && orphans.length === 0,
    memory_dir: MEMORY_DIR,
    memory_index: MEMORY_INDEX,
    linked_count: linked.length,
    on_disk_count: onDiskMd.size,
    missing_files,
    malformed_frontmatter,
    orphans,
    ok_count,
    duration_ms: Date.now() - t0,
  };
}

async function runCheck() {
  // Prefer sister verifier if present (prior-wave C9 deliverable).
  if (fs.existsSync(SISTER_CHECK)) {
    try {
      const mod = await import(pathToFileURL(SISTER_CHECK).href);
      const fn = mod.runCheck || mod.default || mod.check;
      if (typeof fn === 'function') {
        const result = await fn({ memoryDir: MEMORY_DIR, memoryIndex: MEMORY_INDEX });
        return { source: 'memory-sync-check.mjs', ...result };
      }
    } catch (e) {
      log('[memory-sync-daily] sister-check failed, falling back to local:', e.message);
    }
  }
  return { source: 'local', ...localRunCheck() };
}

// ──────────────────────────────────────────────────────────────────────
// Bus envelope
// ──────────────────────────────────────────────────────────────────────

function sendBus(envelope) {
  return new Promise((resolve) => {
    const data = JSON.stringify(envelope);
    const req = http.request({
      hostname: BUS_HOST, port: BUS_PORT, path: BUS_PATH, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(body); } catch (_) {}
        resolve({ status: res.statusCode, body: parsed || body });
      });
    });
    req.on('error', (e) => resolve({ status: 0, error: e.message }));
    req.setTimeout(5000, () => { req.destroy(); resolve({ status: 0, error: 'timeout' }); });
    req.write(data);
    req.end();
  });
}

// ──────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────

async function main() {
  fs.mkdirSync(LOG_DIR, { recursive: true });

  const result = await runCheck();
  const day = todayLocal();
  const logFile = path.join(LOG_DIR, `memory-sync-${day}.log`);

  const drift =
    (result.missing_files?.length || 0) +
    (result.malformed_frontmatter?.length || 0) +
    (result.orphans?.length || 0);
  const verdict = drift === 0 ? 'CLEAN' : 'DRIFT';

  const record = {
    ts: new Date().toISOString(),
    day,
    verdict,
    drift_count: drift,
    source: result.source || 'local',
    summary: {
      linked_count: result.linked_count ?? null,
      on_disk_count: result.on_disk_count ?? null,
      ok_count: result.ok_count ?? null,
      missing_files: result.missing_files?.length || 0,
      malformed_frontmatter: result.malformed_frontmatter?.length || 0,
      orphans: result.orphans?.length || 0,
    },
    detail: {
      missing_files: result.missing_files || [],
      malformed_frontmatter: result.malformed_frontmatter || [],
      orphans: result.orphans || [],
    },
    memory_dir: result.memory_dir,
    memory_index: result.memory_index,
    duration_ms: result.duration_ms ?? null,
    error: result.error || null,
  };

  // Idempotent: writeFile (not appendFile) — replaces same-day log.
  fs.writeFileSync(logFile, JSON.stringify(record, null, 2) + '\n', 'utf8');
  log(`[memory-sync-daily] ${verdict} drift=${drift} → ${logFile}`);

  let bus = { skipped: true, reason: 'no_drift' };
  if (drift > 0 && !NO_BUS) {
    const envelope = {
      from: 'acer',
      to: 'triad',
      mode: 'shadow',
      type: 'memory_sync_alert',
      verb: 'EVT-MEMORY-DRIFT',
      id: `memsync-${day}-${Date.now()}`,
      ts: record.ts,
      payload: {
        missing: result.missing_files || [],
        malformed: result.malformed_frontmatter || [],
        orphans: result.orphans || [],
        ok_count: result.ok_count ?? 0,
      },
    };
    bus = await sendBus(envelope);
    log(`[memory-sync-daily] bus alert → status=${bus.status}`);
  } else if (drift > 0 && NO_BUS) {
    bus = { skipped: true, reason: 'no_bus_flag' };
  }

  if (drift > 0) {
    record.bus_alert = bus;
    fs.writeFileSync(logFile, JSON.stringify(record, null, 2) + '\n', 'utf8');
  }

  // Exit code: 0 always (this is a monitor; drift is data, not failure).
  return record;
}

main().catch(err => {
  console.error('[memory-sync-daily] FATAL:', err);
  // Best-effort error log
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    const day = todayLocal();
    fs.writeFileSync(
      path.join(LOG_DIR, `memory-sync-${day}.log`),
      JSON.stringify({ ts: new Date().toISOString(), day, verdict: 'ERROR', error: err.message }, null, 2) + '\n',
      'utf8'
    );
  } catch (_) {}
  process.exit(1);
});
