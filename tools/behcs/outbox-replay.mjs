#!/usr/bin/env node
// outbox-replay.mjs
// Recovery tool: re-POST stalled BEHCS outbox envelopes that never landed in inbox.
//
// Background: when acer's canon-load hook fails to deliver an EVT-CANON-LOADED-ACK
// (bus down, network blip, etc.), the envelope is still durably written to
// data/behcs/outbox.ndjson but never lands in inbox. This tool retries them.
//
// CLI: node outbox-replay.mjs [--dry-run] [--limit N]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Repo root = two levels up from tools/behcs/
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const OUTBOX_PATH = path.join(REPO_ROOT, 'data', 'behcs', 'outbox.ndjson');
const INBOX_PATH = path.join(REPO_ROOT, 'data', 'behcs', 'inbox.ndjson');
const STATE_DIR = path.join(REPO_ROOT, 'data', 'behcs', 'state');
const RETRY_LOG_PATH = path.join(STATE_DIR, 'outbox-retry-log.json');

const SEND_URL = 'http://127.0.0.1:4947/behcs/send';
const MAX_ATTEMPTS = 5;
const POST_TIMEOUT_MS = 10_000;

// ---- CLI ----
function parseArgs(argv) {
  const args = { dryRun: false, limit: Infinity };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--limit') {
      const n = Number(argv[++i]);
      if (!Number.isFinite(n) || n <= 0) {
        console.error(`outbox-replay: --limit requires a positive integer, got: ${argv[i]}`);
        process.exit(2);
      }
      args.limit = n;
    } else if (a === '-h' || a === '--help') {
      console.log('Usage: node outbox-replay.mjs [--dry-run] [--limit N]');
      process.exit(0);
    } else {
      console.error(`outbox-replay: unknown arg: ${a}`);
      process.exit(2);
    }
  }
  return args;
}

// ---- helpers ----
function readNdjsonLines(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf8');
  return raw.split(/\r?\n/).filter((l) => l.length > 0);
}

function loadRetryLog() {
  if (!fs.existsSync(RETRY_LOG_PATH)) return {};
  try {
    const raw = fs.readFileSync(RETRY_LOG_PATH, 'utf8');
    if (!raw.trim()) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.error(`outbox-replay: failed to parse retry log (${RETRY_LOG_PATH}): ${err.message}`);
    console.error('outbox-replay: starting from empty retry log');
    return {};
  }
}

function saveRetryLog(log) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(RETRY_LOG_PATH, JSON.stringify(log, null, 2) + '\n', 'utf8');
}

async function postEnvelope(envelope) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), POST_TIMEOUT_MS);
  try {
    const res = await fetch(SEND_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(envelope),
      signal: controller.signal,
    });
    const text = await res.text().catch(() => '');
    if (!res.ok) {
      return { ok: false, status: res.status, body: text.slice(0, 500) };
    }
    return { ok: true, status: res.status, body: text.slice(0, 500) };
  } catch (err) {
    return { ok: false, status: 0, error: err.message || String(err) };
  } finally {
    clearTimeout(timer);
  }
}

// ---- main ----
async function main() {
  const args = parseArgs(process.argv.slice(2));

  // Load outbox
  const outboxLines = readNdjsonLines(OUTBOX_PATH);
  const envelopes = [];
  for (let i = 0; i < outboxLines.length; i++) {
    const line = outboxLines[i];
    try {
      const env = JSON.parse(line);
      if (env && typeof env.id === 'string' && env.id.length > 0) {
        envelopes.push(env);
      }
    } catch {
      // skip malformed lines silently; outbox is append-only and may be partial
    }
  }

  // Load inbox as a single string for fast substring scans (file is small enough)
  const inboxText = fs.existsSync(INBOX_PATH) ? fs.readFileSync(INBOX_PATH, 'utf8') : '';

  // Load retry log
  const retryLog = loadRetryLog();

  // Counters
  let scanned = 0;
  let alreadyInInbox = 0;
  let retried = 0;
  let succeeded = 0;
  let failed = 0;
  let gaveUp = 0;

  for (const env of envelopes) {
    if (retried >= args.limit) break;
    scanned++;

    // Substring scan: any line containing env.id is a hit. We use JSON.stringify
    // of the raw id to match the on-disk encoding of "id":"<env.id>".
    const idNeedle = JSON.stringify(env.id); // e.g. "\"abc123\""
    if (inboxText.includes(idNeedle)) {
      alreadyInInbox++;
      continue;
    }

    const entry = retryLog[env.id] || { attempts: 0, last_attempt_at: null, last_outcome: null };
    if (entry.attempts >= MAX_ATTEMPTS) {
      gaveUp++;
      continue;
    }

    retried++;

    if (args.dryRun) {
      // Dry run: do not POST, do not mutate retry log.
      continue;
    }

    const result = await postEnvelope(env);
    entry.attempts += 1;
    entry.last_attempt_at = new Date().toISOString();
    if (result.ok) {
      entry.last_outcome = `success status=${result.status}`;
      succeeded++;
    } else {
      entry.last_outcome = result.error
        ? `failure error=${result.error}`
        : `failure status=${result.status} body=${(result.body || '').slice(0, 200)}`;
      failed++;
    }
    retryLog[env.id] = entry;
  }

  if (!args.dryRun) {
    saveRetryLog(retryLog);
  }

  // Output report
  const lines = [
    `scanned: ${scanned}`,
    `already_in_inbox: ${alreadyInInbox}`,
    `retried: ${retried}`,
    `succeeded: ${succeeded}`,
    `failed: ${failed}`,
    `gave_up: ${gaveUp}`,
  ];
  if (args.dryRun) lines.push('mode: dry-run (no POSTs sent, retry log untouched)');
  console.log(lines.join('\n'));
}

main().catch((err) => {
  console.error(`outbox-replay: fatal: ${err && err.stack ? err.stack : err}`);
  process.exit(1);
});
