#!/usr/bin/env node
// verify-seal.mjs — bilateral cosign chain verifier (standalone)
//
// Usage:
//   node tools/behcs/verify-seal.mjs --envelope-id <id> [--inbox <path>] [--archives]
//
// Finds an envelope by id (in default inbox or a custom one, optionally also
// scanning data/behcs/inbox-archives/), extracts body.signed_envelope, and
// re-verifies the ed25519 signature against
// C:\asolaria-acer\kernel\ed25519-registry.json.
//
// Compares local re-verify against bus-stamped _sig_check.verdict and flags
// any mismatch — would indicate tampering or registry drift.
//
// Output: JSON line with
//   { envelope_id, found_in, bus_verdict, local_verdict,
//     owner_glyph, key_id, agree }

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const REPO_ROOT  = resolve(__dirname, '..', '..');

const DEFAULT_INBOX    = resolve(REPO_ROOT, 'data', 'behcs', 'inbox.ndjson');
const ARCHIVES_DIR     = resolve(REPO_ROOT, 'data', 'behcs', 'inbox-archives');
const REGISTRY_PATH    = 'C:\\asolaria-acer\\kernel\\ed25519-registry.json';

// ---------- arg parsing ----------
function parseArgs(argv) {
  const out = { envelopeId: null, inbox: DEFAULT_INBOX, archives: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--envelope-id') {
      out.envelopeId = argv[++i];
      if (!out.envelopeId) { console.error('error: --envelope-id requires a value'); process.exit(2); }
    } else if (a === '--inbox') {
      out.inbox = resolve(argv[++i] || '');
    } else if (a === '--archives') {
      out.archives = true;
    } else if (a === '--help' || a === '-h') {
      console.log('Usage: node verify-seal.mjs --envelope-id <id> [--inbox <path>] [--archives]');
      process.exit(0);
    } else {
      console.error(`error: unknown arg ${a}`);
      process.exit(2);
    }
  }
  if (!out.envelopeId) {
    console.error('error: --envelope-id is required');
    process.exit(2);
  }
  return out;
}

// ---------- registry ----------
function loadRegistry() {
  if (!existsSync(REGISTRY_PATH)) {
    throw new Error(`registry_not_found: ${REGISTRY_PATH}`);
  }
  const raw = readFileSync(REGISTRY_PATH, 'utf8');
  return JSON.parse(raw);
}

// ed25519 raw 32-byte pubkey (base64) → KeyObject via SPKI DER prefix
function rawPubKeyToKeyObject(pubB64) {
  const raw = Buffer.from(pubB64, 'base64');
  if (raw.length !== 32) throw new Error(`bad_pubkey_length:${raw.length}`);
  const header = Buffer.from('302a300506032b6570032100', 'hex');
  const der = Buffer.concat([header, raw]);
  return crypto.createPublicKey({ key: der, format: 'der', type: 'spki' });
}

// ---------- envelope search ----------
function searchFile(path, envelopeId) {
  if (!existsSync(path)) return null;
  const raw = readFileSync(path, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    // Cheap pre-filter to skip JSON.parse on most lines
    if (t.indexOf(envelopeId) === -1) continue;
    let env;
    try { env = JSON.parse(t); } catch { continue; }
    if (env && env.id === envelopeId) return { env, path };
  }
  return null;
}

function listArchives() {
  if (!existsSync(ARCHIVES_DIR)) return [];
  const entries = readdirSync(ARCHIVES_DIR)
    .filter(n => n.endsWith('.ndjson'))
    .map(n => join(ARCHIVES_DIR, n))
    .filter(p => { try { return statSync(p).isFile(); } catch { return false; } })
    // newest first — most recent archives most likely to contain a recent id
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  return entries;
}

// ---------- local re-verify ----------
function localReverify(signedEnvelope, registry) {
  if (!signedEnvelope || typeof signedEnvelope !== 'object') {
    return { verdict: 'REJECTED', reason: 'no_signed_envelope' };
  }
  const { payload, signature } = signedEnvelope;
  if (!signature || !payload) {
    return { verdict: 'UNSIGNED', reason: 'missing_payload_or_signature' };
  }
  if (!signature.key_id || !signature.sig_b64) {
    return { verdict: 'REJECTED', reason: 'missing_sig_fields' };
  }
  if (signature.alg && signature.alg !== 'ed25519') {
    return { verdict: 'REJECTED', reason: 'wrong_alg', key_id: signature.key_id };
  }
  const entry = (registry.keys || []).find(k => k.key_id === signature.key_id);
  if (!entry) {
    return { verdict: 'REJECTED', reason: 'key_not_in_registry', key_id: signature.key_id };
  }
  if (entry.rotated_at) {
    return { verdict: 'REJECTED', reason: 'key_rotated_out', key_id: signature.key_id, owner_glyph: entry.owner_glyph };
  }
  try {
    const pub = rawPubKeyToKeyObject(entry.public_key_b64);
    const ok = crypto.verify(
      null,
      Buffer.from(JSON.stringify(payload), 'utf-8'),
      pub,
      Buffer.from(signature.sig_b64, 'base64'),
    );
    if (!ok) {
      return { verdict: 'REJECTED', reason: 'signature_mismatch', key_id: signature.key_id, owner_glyph: entry.owner_glyph };
    }
    return { verdict: 'VERIFIED', key_id: signature.key_id, owner_glyph: entry.owner_glyph, host_device: entry.host_device };
  } catch (e) {
    return { verdict: 'REJECTED', reason: 'verify_exception:' + (e.message || String(e)), key_id: signature.key_id };
  }
}

// ---------- main ----------
function main() {
  const args = parseArgs(process.argv.slice(2));

  // 1. Locate envelope
  const candidates = [args.inbox];
  if (args.archives) {
    for (const p of listArchives()) candidates.push(p);
  }

  let hit = null;
  for (const p of candidates) {
    const r = searchFile(p, args.envelopeId);
    if (r) { hit = r; break; }
  }

  if (!hit) {
    const out = {
      envelope_id: args.envelopeId,
      found_in: null,
      bus_verdict: null,
      local_verdict: 'NOT_FOUND',
      owner_glyph: null,
      key_id: null,
      agree: false,
      error: 'envelope_not_found',
      searched: candidates,
    };
    console.log(JSON.stringify(out, null, 2));
    process.exit(1);
  }

  const env = hit.env;
  const signedEnvelope = env && env.body && env.body.signed_envelope;
  const busCheck = env._sig_check || null;
  const busVerdict = busCheck ? busCheck.verdict : null;

  // 2. Re-verify locally
  let registry;
  try { registry = loadRegistry(); }
  catch (e) {
    const out = {
      envelope_id: args.envelopeId,
      found_in: hit.path,
      bus_verdict: busVerdict,
      local_verdict: 'REJECTED',
      owner_glyph: busCheck ? busCheck.owner_glyph : null,
      key_id: busCheck ? busCheck.key_id : null,
      agree: false,
      error: e.message || String(e),
    };
    console.log(JSON.stringify(out, null, 2));
    process.exit(1);
  }

  const local = localReverify(signedEnvelope, registry);

  // 3. Compare verdicts. Treat null bus_verdict as no bus stamp.
  const agree = busVerdict === local.verdict
    && (busCheck && busCheck.key_id || null) === (local.key_id || null);

  const report = {
    envelope_id: args.envelopeId,
    found_in: hit.path,
    bus_verdict: busVerdict,
    local_verdict: local.verdict,
    owner_glyph: local.owner_glyph || (busCheck ? busCheck.owner_glyph : null) || null,
    key_id: local.key_id || (busCheck ? busCheck.key_id : null) || null,
    agree: !!agree,
  };
  if (!agree) {
    report.mismatch = {
      bus: { verdict: busVerdict, key_id: busCheck ? busCheck.key_id : null, owner_glyph: busCheck ? busCheck.owner_glyph : null },
      local: { verdict: local.verdict, key_id: local.key_id || null, owner_glyph: local.owner_glyph || null, reason: local.reason || null },
    };
  }

  console.log(JSON.stringify(report, null, 2));
  process.exit(agree ? 0 : 2);
}

main();
