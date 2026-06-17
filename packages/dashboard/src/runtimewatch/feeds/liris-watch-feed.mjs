import fs from 'node:fs';
import path from 'node:path';
import { baseFeed, dataRootFromArg, feedPath, readJson, writeJson } from '../runtimewatch-utils.mjs';

function existing(paths) {
  return paths.filter((filePath) => {
    try { return fs.existsSync(filePath); } catch { return false; }
  });
}

const dataRoot = dataRootFromArg();
const feed = baseFeed('liris-watch', 'filesystem-receipt-check');
const candidates = [
  path.join(dataRoot, 'liris', 'liris-status-latest.json'),
  path.join(dataRoot, 'liris-watch', 'status-latest.json'),
  'C:/asolaria-acer/data/liris/liris-status-latest.json',
  'C:/asolaria-acer/data/runtimewatch/liris/liris-status-latest.json'
];
const hits = existing(candidates);

if (!hits.length) {
  feed.ok = false;
  feed.reason = 'not_running_or_no_receipt';
  feed.summary = {
    receipt_found: false,
    candidates_checked: candidates.length
  };
  feed.receipts = [];
} else {
  feed.receipts = hits.map((filePath) => ({
    path_sha_hint: filePath.replace(/[A-Za-z]:\\[^\\]+/g, '[root]'),
    status: readJson(filePath, { ok: false, reason: 'unreadable_json' })
  }));
  feed.summary = {
    receipt_found: true,
    receipts: hits.length
  };
}

const output = feedPath('liris-watch', dataRoot);
writeJson(output, feed);
console.log(JSON.stringify({ ok: true, feed: 'liris-watch', available: feed.ok, path: output }, null, 2));
