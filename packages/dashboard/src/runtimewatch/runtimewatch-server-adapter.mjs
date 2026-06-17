import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_DATA_ROOT, feedPath, nowIso, readJson, readText, snapshotPath } from './runtimewatch-utils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TASK_MANAGER_PAGE_PATH = path.join(__dirname, 'asolaria-task-manager.html');
const FEED_NAME_RE = /^[a-z0-9_-]+$/i;

function runtimeWatchAuthority(authority = {}) {
  return {
    dashboard_starts_producers: false,
    aggregator_probes_system: false,
    control_routes_enabled: false,
    read_only: true,
    starts_processes: false,
    ...(authority || {})
  };
}

export function missingRuntimeWatchSnapshot(dataRoot = DEFAULT_DATA_ROOT) {
  return {
    schema: 'asolaria.runtimewatch.snapshot.v1',
    ok: true,
    generated_at: nowIso(),
    mode: 'read_only_microkernel_snapshot',
    reason: 'snapshot_missing',
    feeds: {},
    authority: runtimeWatchAuthority(),
    source: {
      snapshot_path: snapshotPath(dataRoot),
      note: 'RuntimeWatch route is read-only. Run feed producers and aggregator separately.'
    }
  };
}

export function missingRuntimeWatchFeed(feedName, dataRoot = DEFAULT_DATA_ROOT) {
  return {
    schema: 'asolaria.runtimewatch.feed.v1',
    feed: feedName,
    ok: false,
    generated_at: nowIso(),
    stale_after_ms: 15000,
    reason: 'feed_missing',
    rows: [],
    summary: { rows: 0 },
    authority: runtimeWatchAuthority(),
    source: {
      feed_path: feedPath(feedName, dataRoot),
      note: 'RuntimeWatch feed route is read-only. Run the refresh pipeline separately.'
    }
  };
}

export function isSafeRuntimeWatchFeedName(feedName) {
  return FEED_NAME_RE.test(String(feedName || ''));
}

export function readRuntimeWatchSnapshot(dataRoot = DEFAULT_DATA_ROOT) {
  const snapshot = readJson(snapshotPath(dataRoot), null);
  if (!snapshot || typeof snapshot !== 'object') return missingRuntimeWatchSnapshot(dataRoot);
  return {
    ...snapshot,
    authority: runtimeWatchAuthority(snapshot.authority)
  };
}

export function readRuntimeWatchFeed(feedName, dataRoot = DEFAULT_DATA_ROOT) {
  if (!isSafeRuntimeWatchFeedName(feedName)) return null;
  const feed = readJson(feedPath(feedName, dataRoot), null);
  if (!feed || typeof feed !== 'object') return missingRuntimeWatchFeed(feedName, dataRoot);
  return {
    ...feed,
    authority: runtimeWatchAuthority(feed.authority)
  };
}

function renderTaskManagerPage() {
  const html = readText(TASK_MANAGER_PAGE_PATH, '');
  if (!html) {
    return `<!doctype html><html><body><pre>Asolaria Task Manager page template missing at ${TASK_MANAGER_PAGE_PATH}</pre></body></html>`;
  }
  return html
    .replaceAll('__RUNTIMEWATCH_SNAPSHOT_API__', '/api/runtimewatch/snapshot')
    .replaceAll('__RUNTIMEWATCH_TASK_MANAGER_API__', '/api/asolaria-task-manager')
    .replaceAll('__RUNTIMEWATCH_PID_COVERAGE_API__', '/api/runtimewatch/feed/pid-coverage')
    .replaceAll('__RUNTIMEWATCH_TASK_TABLE_API__', '/api/runtimewatch/feed/task-manager');
}

export function sendRuntimeWatchSnapshot(req, res, dataRoot = DEFAULT_DATA_ROOT) {
  const payload = readRuntimeWatchSnapshot(dataRoot);
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload, null, 2));
}

export function sendRuntimeWatchFeed(req, res, feedName, dataRoot = DEFAULT_DATA_ROOT) {
  if (!isSafeRuntimeWatchFeedName(feedName)) {
    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: false, reason: 'invalid_feed_name', feed: String(feedName || '') }, null, 2));
    return;
  }
  const payload = readRuntimeWatchFeed(feedName, dataRoot);
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload, null, 2));
}

export function sendAsolariaTaskManagerPage(req, res) {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(renderTaskManagerPage());
}
