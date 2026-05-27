#!/usr/bin/env node
// key-rotate.mjs
// ed25519 key rotation tool for the BEHCS owner-key registry.
//
// Generates a fresh ed25519 keypair for an owner glyph, appends a new
// active entry to C:/asolaria-acer/kernel/ed25519-registry.json, and
// stamps `rotated_at` on the prior active entry for the same owner so
// behcs-bus.js verifyIngressEnvelope() rejects it on next request.
//
// SECURITY:
// - The new private key seed is printed ONCE to STDERR. It is never
//   written to disk, never logged, never echoed to STDOUT.
// - Operator MUST capture the seed from the terminal in that moment
//   and place it in the appropriate vault. There is no recovery.
// - The audit log records only key_ids + owner + ts. No private bytes.
//
// CLI: node key-rotate.mjs --owner <DEV-ACER|DEV-LIRIS|DEV-FALCON|...> [--dry-run]

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Repo root = two levels up from tools/behcs/
const REPO_ROOT = path.resolve(__dirname, '..', '..');

// Registry path matches behcs-bus.js ED25519_REGISTRY default.
const REGISTRY_PATH = process.env.ED25519_REGISTRY
  || 'C:/asolaria-acer/kernel/ed25519-registry.json';

// Audit log. Append-only NDJSON, never carries private bytes.
const AUDIT_LOG_PATH = path.join(REPO_ROOT, 'logs', 'key-rotation.ndjson');

// ---- CLI ----------------------------------------------------------------

function parseArgs(argv) {
  const args = { owner: null, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') {
      args.dryRun = true;
    } else if (a === '--owner') {
      args.owner = argv[++i];
      if (!args.owner) {
        console.error('key-rotate: --owner requires a value (e.g. DEV-ACER)');
        process.exit(2);
      }
    } else if (a === '--help' || a === '-h') {
      printUsage();
      process.exit(0);
    } else {
      console.error(`key-rotate: unknown argument: ${a}`);
      printUsage();
      process.exit(2);
    }
  }
  if (!args.owner) {
    console.error('key-rotate: --owner is required');
    printUsage();
    process.exit(2);
  }
  return args;
}

function printUsage() {
  console.error('Usage: node key-rotate.mjs --owner <DEV-ACER|DEV-LIRIS|...> [--dry-run]');
}

// ---- Registry I/O -------------------------------------------------------

function readRegistry() {
  const raw = fs.readFileSync(REGISTRY_PATH, 'utf8');
  const reg = JSON.parse(raw);
  if (!reg || !Array.isArray(reg.keys)) {
    throw new Error(`registry malformed: missing 'keys' array at ${REGISTRY_PATH}`);
  }
  return reg;
}

function writeRegistry(reg) {
  // Pretty-print with 2-space indent to match existing file style.
  const out = JSON.stringify(reg, null, 2) + '\n';
  fs.writeFileSync(REGISTRY_PATH, out, 'utf8');
}

// ---- Crypto -------------------------------------------------------------

function generateEd25519() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');

  // Public key: extract raw 32-byte from DER (last 32 bytes of SPKI for ed25519).
  const spki = publicKey.export({ format: 'der', type: 'spki' });
  const pubRaw = spki.subarray(spki.length - 32);

  // Private key: extract raw 32-byte seed from PKCS8 DER (last 32 bytes for ed25519).
  const pkcs8 = privateKey.export({ format: 'der', type: 'pkcs8' });
  const privSeed = pkcs8.subarray(pkcs8.length - 32);

  return {
    publicKeyB64: pubRaw.toString('base64'),
    privateSeedB64: privSeed.toString('base64'),
  };
}

function deriveKeyId(ownerGlyph, publicKeyB64) {
  // dev-<owner-lower>-<sha256(pubkey).slice(0,8)>
  // Hash the raw public key bytes (consistent with how behcs verifies envelopes).
  const pubBytes = Buffer.from(publicKeyB64, 'base64');
  const hash = crypto.createHash('sha256').update(pubBytes).digest('hex');
  const ownerLower = ownerGlyph.toLowerCase().replace(/^dev-/, '');
  return `dev-${ownerLower}-${hash.slice(0, 8)}`;
}

// ---- Audit --------------------------------------------------------------

function appendAudit(entry) {
  const line = JSON.stringify(entry) + '\n';
  fs.mkdirSync(path.dirname(AUDIT_LOG_PATH), { recursive: true });
  fs.appendFileSync(AUDIT_LOG_PATH, line, 'utf8');
}

// ---- Main ---------------------------------------------------------------

function main() {
  const args = parseArgs(process.argv.slice(2));
  const ts = new Date().toISOString();

  const reg = readRegistry();

  // Find the prior active key for this owner: matching owner_glyph, no rotated_at.
  const priorActive = reg.keys.filter(k =>
    k.owner_glyph === args.owner && !k.rotated_at
  );
  if (priorActive.length === 0) {
    console.error(`key-rotate: no active key found for owner ${args.owner}`);
    process.exit(1);
  }
  if (priorActive.length > 1) {
    console.error(
      `key-rotate: WARNING ${priorActive.length} active keys for ${args.owner}; ` +
      `all will be marked rotated_at=${ts}`
    );
  }

  // Generate the replacement keypair.
  const { publicKeyB64, privateSeedB64 } = generateEd25519();
  const newKeyId = deriveKeyId(args.owner, publicKeyB64);

  // Build the new entry. Inherit usage / binding_class / host_device from
  // the most recent prior active key so the rotation is drop-in compatible.
  const template = priorActive[priorActive.length - 1];
  const newEntry = {
    key_id: newKeyId,
    owner_glyph: args.owner,
    public_key_b64: publicKeyB64,
    d11_level: template.d11_level || 'ASSUMED',
    created_at: ts,
    rotated_at: null,
    usage: Array.isArray(template.usage) ? [...template.usage] : ['behcs-envelope'],
    binding_class: template.binding_class || 'device-bound',
    host_device: template.host_device || args.owner,
    notes: `rotated from ${priorActive.map(k => k.key_id).join(',')} on ${ts}`,
  };

  // Preview block for dry-run AND real run (operator can always see what changed).
  const preview = {
    mode: args.dryRun ? 'DRY-RUN' : 'WRITE',
    owner: args.owner,
    ts,
    registry_path: REGISTRY_PATH,
    audit_log_path: AUDIT_LOG_PATH,
    prior_active_key_ids: priorActive.map(k => k.key_id),
    new_entry: newEntry,
  };
  console.log(JSON.stringify(preview, null, 2));

  if (args.dryRun) {
    console.error('');
    console.error('[dry-run] No registry write. No audit append. No private key emitted.');
    return;
  }

  // ---- WRITE PATH -------------------------------------------------------

  // Stamp rotated_at on each prior active for this owner.
  for (const k of priorActive) {
    k.rotated_at = ts;
  }
  // Append new active entry.
  reg.keys.push(newEntry);
  reg.updated_at = ts;

  writeRegistry(reg);

  // Audit log: NO private material.
  for (const old of priorActive) {
    appendAudit({
      ts,
      action: 'rotate',
      owner: args.owner,
      old_key_id: old.key_id,
      new_key_id: newKeyId,
      registry_path: REGISTRY_PATH,
    });
  }

  // Emit private seed to STDERR exactly once. Operator must capture NOW.
  console.error('');
  console.error('==============================================================');
  console.error(' STORE THIS NOW -- never logged to disk, never recoverable.');
  console.error(`  owner:       ${args.owner}`);
  console.error(`  new_key_id:  ${newKeyId}`);
  console.error(`  private_b64: ${privateSeedB64}`);
  console.error('==============================================================');
  console.error('');
  console.error(`registry updated: ${REGISTRY_PATH}`);
  console.error(`audit appended:   ${AUDIT_LOG_PATH}`);
}

try {
  main();
} catch (err) {
  console.error(`key-rotate: FATAL ${err && err.stack || err}`);
  process.exit(1);
}
