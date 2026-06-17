import { baseFeed, dataRootFromArg, feedPath, readJson, writeJson } from '../runtimewatch-utils.mjs';

function relevance(row) {
  const text = `${row.name || ''} ${row.command_class || ''} ${row.command_redacted || ''}`.toLowerCase();
  const score = [
    ['asolaria', 5],
    ['hermes', 5],
    ['opencode', 4],
    ['codex', 4],
    ['node', 3],
    ['python', 3],
    ['server.js', 3],
    ['dashboard', 2],
    ['scrcpy', 2]
  ].reduce((acc, [needle, weight]) => acc + (text.includes(needle) ? weight : 0), 0);
  return score;
}

const dataRoot = dataRootFromArg();
const feed = baseFeed('process', 'task-manager-feed-derived');
const task = readJson(feedPath('task-manager', dataRoot), null);

if (!task?.rows?.length) {
  feed.ok = false;
  feed.reason = 'task_manager_feed_missing_or_empty';
  feed.rows = [];
  feed.summary = { rows: 0 };
} else {
  const rows = task.rows
    .map((row) => ({ ...row, relevance_score: relevance(row) }))
    .filter((row) => row.relevance_score > 0)
    .sort((a, b) => b.relevance_score - a.relevance_score || b.memory_mb - a.memory_mb)
    .slice(0, 80);
  feed.rows = rows;
  feed.summary = {
    rows: rows.length,
    source_rows: task.rows.length,
    classes: rows.reduce((acc, row) => ({ ...acc, [row.command_class || 'unknown']: (acc[row.command_class || 'unknown'] || 0) + 1 }), {})
  };
}

const output = feedPath('process', dataRoot);
writeJson(output, feed);
console.log(JSON.stringify({ ok: true, feed: 'process', rows: feed.rows.length, available: feed.ok, path: output }, null, 2));
