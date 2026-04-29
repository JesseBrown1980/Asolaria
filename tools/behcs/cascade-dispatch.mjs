#!/usr/bin/env node
/**
 * cascade-dispatch.mjs — auto-recording wrapper for cascade dispatches
 *
 * Wraps the dispatch pattern so that every cascade dispatch is recorded
 * via cascade-runner.mjs without manual `append` calls.
 *
 *   - target=acer  : local cascade, no agent spawn (parent Claude is the
 *                    runner). Just emit a ledger row tagged "queued"
 *                    with the prompt fingerprint.
 *   - target=liris : build + post a WO_BRIEF envelope to the liris bus,
 *                    then emit a ledger row tagged "queued" with the
 *                    envelope id captured in receipt_paths/notes.
 *
 * CLI:
 *   node cascade-dispatch.mjs --wave <name> --cascade-id <Cn> \
 *        --title <"..."> --target <acer|liris> \
 *        [--prompt-file <path>] [--brief-payload <json>] \
 *        [--bus-url <url>] [--status <queued|in-progress|done|failed>] \
 *        [--receipt-paths <comma-list>] [--notes <text>] \
 *        [--dry-run]
 *
 * Output (stdout JSON):
 *   {
 *     ok, cascade_id, wave, dispatch_ts,
 *     target, prompt_sha256_8 (if prompt-file),
 *     envelope_id (liris only), bus_response (liris only),
 *     ledger_write_ok
 *   }
 */

import { promises as fsp } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');

const CASCADE_RUNNER = path.join(__dirname, 'cascade-runner.mjs');

const TARGET_BUS_DEFAULTS = {
  liris: 'http://192.168.100.2:4947/behcs/send',
  acer: 'http://127.0.0.1:4947/behcs/send',
};

const SEND_TIMEOUT_MS = 5000;
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

function die(code, msg) {
  process.stderr.write(`cascade-dispatch: ${msg}\n`);
  process.exit(code);
}

// ---------- helpers ----------

function sha256Hex(s) {
  return crypto.createHash('sha256').update(s, 'utf8').digest('hex');
}

function nowIso() {
  return new Date().toISOString();
}

function buildEnvelopeId(from, to, sha, ts) {
  return crypto
    .createHash('sha256')
    .update(`${from}\n${to}\n${sha}\n${ts}`)
    .digest('hex')
    .slice(0, 32);
}

function buildWoBriefEnvelope({ from, target, wave, cascadeId, title, ts, payload, payloadSha256 }) {
  const id = buildEnvelopeId(from, target, payloadSha256, ts);
  return {
    id,
    ts,
    from,
    to: target,
    mode: 'real',
    type: 'WO_BRIEF',
    verb: 'EVT-CASCADE-DISPATCH',
    wave,
    cascade_id: cascadeId,
    title,
    payload_sha256: payloadSha256,
    payload,
    cube: {
      D1_ACTOR: from,
      D3_TARGET: target,
      D7_STATE: 'dispatch',
      D20_TIME: ts,
      D26_OMNIDIRECTIONAL: 'bilateral',
      D34_CROSS_COLONY: 'cross_host_lan',
    },
  };
}

async function postEnvelope(busUrl, envelope) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), SEND_TIMEOUT_MS);
  try {
    const res = await fetch(busUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(envelope),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    const text = await res.text();
    let body = null;
    try { body = JSON.parse(text); } catch { /* not all errors are JSON */ }
    return { ok: res.ok, status: res.status, body, raw: text };
  } catch (e) {
    clearTimeout(timer);
    if (e.name === 'AbortError') return { ok: false, status: 0, error: 'timeout' };
    return { ok: false, status: 0, error: e.message || String(e) };
  }
}

// Run cascade-runner.mjs append in-process (via child) so we get a
// single source of truth for the ledger format.
function runLedgerAppend({ wave, cascadeId, title, status, receiptPaths, notes }) {
  return new Promise((resolve) => {
    const args = [
      CASCADE_RUNNER,
      'append',
      '--wave', wave,
      '--cascade-id', cascadeId,
      '--title', title,
      '--status', status,
    ];
    if (receiptPaths && receiptPaths.length) {
      args.push('--receipt-paths', receiptPaths.join(','));
    }
    if (notes) {
      args.push('--notes', notes);
    }
    const child = spawn(process.execPath, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (c) => { stderr += c.toString(); });
    child.on('close', (code) => {
      resolve({ ok: code === 0, code, stderr: stderr.trim() });
    });
    child.on('error', (e) => {
      resolve({ ok: false, code: -1, stderr: e.message || String(e) });
    });
  });
}

// ---------- main ----------

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || args.h) {
    process.stdout.write([
      'cascade-dispatch.mjs — auto-recording wrapper for cascade dispatches',
      '',
      'Usage:',
      '  node cascade-dispatch.mjs --wave <name> --cascade-id <Cn> \\',
      '       --title <"..."> --target <acer|liris> \\',
      '       [--prompt-file <path>] [--brief-payload <json>] \\',
      '       [--bus-url <url>] [--status <queued|in-progress|done|failed>] \\',
      '       [--receipt-paths <comma-list>] [--notes <text>] [--dry-run]',
      '',
    ].join('\n') + '\n');
    process.exit(0);
  }

  const wave = args.wave;
  const cascadeId = args['cascade-id'];
  const title = args.title;
  const target = args.target;
  const status = (args.status && args.status !== true) ? args.status : 'queued';
  const dryRun = !!args['dry-run'];

  const errs = [];
  if (!wave || wave === true) errs.push('--wave is required');
  if (!cascadeId || cascadeId === true) errs.push('--cascade-id is required');
  if (!title || title === true) errs.push('--title is required');
  if (!target || target === true) errs.push('--target is required');
  if (target && target !== true && !['acer', 'liris'].includes(target)) {
    errs.push("--target must be 'acer' or 'liris'");
  }
  if (!VALID_STATUS.has(status)) {
    errs.push(`--status must be one of: ${[...VALID_STATUS].join('|')}`);
  }
  if (errs.length) die(2, errs.join('; '));

  const ts = nowIso();

  // Optional prompt body
  let prompt = null;
  let promptSha = null;
  if (args['prompt-file'] && args['prompt-file'] !== true) {
    try {
      prompt = await fsp.readFile(args['prompt-file'], 'utf8');
    } catch (e) {
      die(2, `--prompt-file read failed: ${e.message || e}`);
    }
    promptSha = sha256Hex(prompt);
  }

  // Optional brief payload (JSON)
  let briefPayload = null;
  if (args['brief-payload'] && args['brief-payload'] !== true) {
    try {
      briefPayload = JSON.parse(args['brief-payload']);
    } catch (e) {
      die(2, `--brief-payload is not valid JSON: ${e.message || e}`);
    }
  }

  const receiptPaths = (args['receipt-paths'] && args['receipt-paths'] !== true)
    ? String(args['receipt-paths']).split(',').map(s => s.trim()).filter(Boolean)
    : [];
  const userNotes = (args.notes && args.notes !== true) ? String(args.notes) : '';

  const summary = {
    ok: true,
    cascade_id: cascadeId,
    wave,
    dispatch_ts: ts,
    target,
    status,
    prompt_sha256_8: promptSha ? promptSha.slice(0, 8) : null,
    dry_run: dryRun,
  };

  // ─── target=liris: build + post WO_BRIEF ───
  if (target === 'liris') {
    const payload = {
      wave,
      cascade_id: cascadeId,
      title,
      dispatch_ts: ts,
      prompt: prompt || null,
      prompt_sha256: promptSha,
      brief: briefPayload,
    };
    const payloadSha256 = sha256Hex(JSON.stringify(payload));
    const envelope = buildWoBriefEnvelope({
      from: 'acer',
      target,
      wave,
      cascadeId,
      title,
      ts,
      payload,
      payloadSha256,
    });
    summary.envelope_id = envelope.id;
    summary.payload_sha256_8 = payloadSha256.slice(0, 8);

    const busUrl =
      (args['bus-url'] && args['bus-url'] !== true)
        ? args['bus-url']
        : TARGET_BUS_DEFAULTS.liris;
    summary.bus_url = busUrl;

    if (!dryRun) {
      const sendRes = await postEnvelope(busUrl, envelope);
      summary.bus_response = sendRes.body || (sendRes.raw || '').slice(0, 200) || null;
      summary.bus_http_status = sendRes.status;
      summary.bus_ok = sendRes.ok;
      if (!sendRes.ok) {
        // Per memory feedback_orbital_routing_liris_to_falcon.md, liris bus
        // may not be reachable — record the cascade anyway, but mark notes.
        summary.bus_error = sendRes.error || `http_${sendRes.status}`;
      }
    } else {
      summary.bus_response = null;
      summary.bus_ok = null;
      summary.note = 'dry-run; envelope built but NOT posted';
    }
  } else {
    // ─── target=acer: local, no spawn ───
    summary.note = 'local cascade; parent Claude executes the work';
  }

  // ─── always: write to ledger via cascade-runner ───
  const ledgerNotesParts = [];
  if (target === 'liris' && summary.envelope_id) {
    ledgerNotesParts.push(`envelope_id=${summary.envelope_id}`);
  }
  if (promptSha) {
    ledgerNotesParts.push(`prompt_sha256_8=${promptSha.slice(0, 8)}`);
  }
  if (target === 'liris' && summary.bus_ok === false) {
    ledgerNotesParts.push(`bus_error=${summary.bus_error}`);
  }
  if (userNotes) ledgerNotesParts.push(userNotes);
  const ledgerNotes = ledgerNotesParts.join('; ');

  if (!dryRun) {
    const lr = await runLedgerAppend({
      wave,
      cascadeId,
      title,
      status,
      receiptPaths,
      notes: ledgerNotes,
    });
    summary.ledger_write_ok = lr.ok;
    if (!lr.ok) {
      summary.ok = false;
      summary.ledger_error = lr.stderr;
    }
  } else {
    summary.ledger_write_ok = null;
  }

  process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
  process.exit(summary.ok ? 0 : 1);
}

main().catch((e) => {
  process.stderr.write(`cascade-dispatch: crashed ${e.message || String(e)}\n${e.stack || ''}\n`);
  process.exit(1);
});
