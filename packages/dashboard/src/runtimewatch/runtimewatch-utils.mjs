import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const DEFAULT_DATA_ROOT = process.env.ASOLARIA_RUNTIMEWATCH_ROOT || path.resolve(__dirname, '../../../../data/runtimewatch');

export function nowIso() {
  return new Date().toISOString();
}

export function mkdirFor(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

export function writeJson(filePath, value) {
  mkdirFor(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

export function writeText(filePath, value) {
  mkdirFor(filePath);
  fs.writeFileSync(filePath, String(value), 'utf8');
}

export function readText(filePath, fallback = '') {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return fallback;
  }
}

export function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

export function arg(name, fallback = '') {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

export function dataRootFromArg() {
  return arg('--data-root', DEFAULT_DATA_ROOT);
}

export function feedPath(feedName, dataRoot = DEFAULT_DATA_ROOT) {
  return path.join(dataRoot, 'feeds', `${feedName}-latest.json`);
}

export function feedSidecarPath(feedName, ext = 'hbp', dataRoot = DEFAULT_DATA_ROOT) {
  return path.join(dataRoot, 'feeds', `${feedName}-latest.${ext}`);
}

export function snapshotPath(dataRoot = DEFAULT_DATA_ROOT) {
  return path.join(dataRoot, 'runtimewatch-snapshot-latest.json');
}

export function redactCommandLine(value) {
  const text = String(value || '');
  if (!text) return '';
  return text
    .replace(/[A-Za-z]:\\[^\s"']+/g, (match) => {
      const base = path.win32.basename(match);
      return base ? `[path:${base}]` : '[path]';
    })
    .replace(/--?(token|key|secret|password)\s+["']?[^\s"']+["']?/gi, '--$1 [redacted]')
    .replace(/(token|api[_-]?key|secret|password)=([^\s&]+)/gi, '$1=[redacted]')
    .slice(0, 240);
}

export function hbpEscape(value) {
  return String(value ?? '')
    .replace(/[|\r\n\t]/g, '_')
    .replace(/[^\x20-\x7e]/g, '_')
    .slice(0, 240);
}

export function hbpRow(tag, fields = {}) {
  const body = Object.entries(fields)
    .map(([key, value]) => `${hbpEscape(key)}=${hbpEscape(value)}`)
    .join('|');
  return body ? `${hbpEscape(tag)}|${body}` : hbpEscape(tag);
}

export function boundedRun(command, args = [], options = {}) {
  const timeout = Number(options.timeout || 3000);
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    timeout,
    windowsHide: true,
    shell: false,
    maxBuffer: 1024 * 1024
  });
  return {
    status: result.status,
    signal: result.signal,
    error: result.error?.message || '',
    stdout: String(result.stdout || '').slice(0, 20000),
    stderr: String(result.stderr || '').slice(0, 8000),
    timed_out: result.error?.code === 'ETIMEDOUT'
  };
}

export function baseFeed(feed, source) {
  return {
    schema: 'asolaria.runtimewatch.feed.v1',
    feed,
    ok: true,
    generated_at: nowIso(),
    stale_after_ms: 15000,
    source,
    authority: {
      read_only: true,
      control_enabled: false,
      starts_processes: false
    },
    errors: []
  };
}

export function markStale(row, now = Date.now()) {
  if (!row?.generated_at) return { ...(row || {}), stale: true };
  const generated = new Date(row.generated_at).getTime();
  const ttl = Number(row.stale_after_ms || 0);
  const stale = !Number.isFinite(generated) || (ttl > 0 && now - generated > ttl);
  return { ...row, stale };
}
