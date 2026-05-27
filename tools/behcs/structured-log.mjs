/**
 * structured-log.mjs — Asolaria shared structured-JSON logger
 *
 * Unified NDJSON channel for daemon analytics. Additive to existing plain-text
 * audit logs (does NOT replace them). Each call appends one JSON line to a
 * date-rotated file under logs/structured/<component>.<yyyy-mm-dd>.ndjson.
 *
 * Hard contract:
 *   - NEVER throws. Logging must not break the caller.
 *   - Async-safe append (fs.promises.appendFile is ordered per-file in Node).
 *   - Auto-creates parent dir on first write per-process (cached).
 *   - ESM + CJS dual export (named + default) so both module systems can use it.
 *
 * Usage (ESM):
 *   import { slog } from './behcs/structured-log.mjs';
 *   await slog('agent-keyboard', 'pid_targeted_inject', { ip, hwnd, len });
 *
 * Usage (CJS, dynamic):
 *   const { slog } = await import('./behcs/structured-log.mjs');
 *   await slog('component', 'event', { ...fields });
 */

import { promises as fsp } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// logs/structured/ lives at repo-root/logs/structured (this file is at tools/behcs/)
const LOG_ROOT = path.resolve(__dirname, '..', '..', 'logs', 'structured');

// Cache of directories we've already ensured exist this process, so we don't
// hit mkdir on every call.
const _ensuredDirs = new Set();

function _today() {
  // yyyy-mm-dd in UTC for predictable rotation across timezones
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function _safeComponent(component) {
  // Strip anything that would escape the filename. Keep alnum, dash, underscore, dot.
  return String(component || 'unknown').replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 64) || 'unknown';
}

async function _ensureDir(dir) {
  if (_ensuredDirs.has(dir)) return;
  try {
    await fsp.mkdir(dir, { recursive: true });
    _ensuredDirs.add(dir);
  } catch (_) {
    // Swallow. If mkdir fails, the appendFile will also fail and be swallowed.
  }
}

/**
 * Append a structured log line.
 * @param {string} component  - Component name (used in filename + line).
 * @param {string} event      - Short event identifier.
 * @param {object} [fields]   - Extra fields, merged into the JSON line.
 * @returns {Promise<void>}   - Resolves when written (or silently on error).
 */
export async function slog(component, event, fields = {}) {
  try {
    const safeComponent = _safeComponent(component);
    const file = path.join(LOG_ROOT, `${safeComponent}.${_today()}.ndjson`);
    await _ensureDir(LOG_ROOT);

    const record = {
      ts: new Date().toISOString(),
      component: safeComponent,
      event: String(event || 'unknown'),
      ...(fields && typeof fields === 'object' ? fields : {})
    };

    let line;
    try {
      line = JSON.stringify(record) + '\n';
    } catch (_) {
      // Circular ref or BigInt — fall back to a sanitized minimal record.
      line = JSON.stringify({
        ts: record.ts,
        component: record.component,
        event: record.event,
        _serialize_error: true
      }) + '\n';
    }

    await fsp.appendFile(file, line, 'utf8');
  } catch (_) {
    // NEVER throw. Logging must not break the caller.
  }
}

export default { slog };

// CJS interop: when this file is loaded via dynamic import() from a CJS file,
// the returned namespace object exposes both `slog` (named) and `default.slog`.
// No further work needed — Node's ESM loader handles both shapes.
