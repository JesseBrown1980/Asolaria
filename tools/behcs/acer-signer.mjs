#!/usr/bin/env node
// acer-signer.mjs — shared ed25519 signer module for acer-side BEHCS tools.
//
// Centralizes the signer-loading + payload-signing logic so canon-load-on-
// session-start.mjs (the inbound canon hook) and dispatch-canon.mjs (the
// outbound canon dispatcher) cannot drift on key handling.
//
// EXPORTS
//   ACER_KEY_ID          — registry key_id ("dev-acer-4abb0a9c")
//   ACER_KEY_CANDIDATES  — ordered list of seed/PEM candidate paths
//   REGISTRY_PATH        — registry file used to verify pubkey matches
//   loadAcerSigner()     — returns { keyObject, pubKeyB64, source } | null
//   signPayload(signer, payloadObject)
//                        — returns { payload, signature: { key_id, sig_b64,
//                                                          alg, signed_at } }
//
// Bytes-to-sign = JSON.stringify(payload) UTF-8, exactly matching
// behcs-bus.verifyIngressEnvelope so a signature produced here verifies on
// the bus.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

export const ACER_KEY_ID = "dev-acer-4abb0a9c";

export const ACER_KEY_CANDIDATES = [
  path.join(ROOT, "data", "vault", "owner", "ed25519", `${ACER_KEY_ID}.private.b64`),
  `C:\\asolaria-acer\\kernel\\ed25519-keys\\${ACER_KEY_ID}.private.b64`,
  `C:\\asolaria-acer\\kernel\\${ACER_KEY_ID}.private.b64`,
  `C:\\asolaria-acer\\kernel\\${ACER_KEY_ID}.pem`,
];

export const REGISTRY_PATH = "C:\\asolaria-acer\\kernel\\ed25519-registry.json";

// PKCS8 DER prefix for raw ed25519 seed (16 bytes), then 32 seed bytes = 48
// bytes total. Lets `crypto.createPrivateKey` consume a raw seed.
const ED25519_PKCS8_PREFIX = Buffer.from(
  "302e020100300506032b657004220420",
  "hex"
);

/**
 * Load the acer ed25519 private key as a Node KeyObject. Returns
 * { keyObject, pubKeyB64, source } or null if no usable seed was found or
 * the derived pubkey doesn't agree with the registry entry for ACER_KEY_ID.
 *
 * Optional `auditFn(...parts)` is called for diagnostic events; pass a no-op
 * if you don't want any logging from this module.
 *
 * @param {(...parts:any[])=>void} [auditFn]
 * @returns {{keyObject:crypto.KeyObject, pubKeyB64:string, source:string}|null}
 */
export function loadAcerSigner(auditFn = () => {}) {
  let seed = null;
  let source = null;
  let asPem = false;

  for (const p of ACER_KEY_CANDIDATES) {
    if (!fs.existsSync(p)) continue;
    try {
      const raw = fs.readFileSync(p, "utf8").trim();
      if (raw.startsWith("-----BEGIN")) {
        // PEM private key — let createPrivateKey parse directly.
        seed = raw;
        source = p;
        asPem = true;
        break;
      }
      const seedBytes = Buffer.from(raw, "base64");
      if (seedBytes.length !== 32) continue;
      seed = seedBytes;
      source = p;
      break;
    } catch {
      continue;
    }
  }
  if (!seed) return null;

  let keyObject;
  let pubKeyB64;
  try {
    if (asPem) {
      keyObject = crypto.createPrivateKey({ key: seed, format: "pem" });
    } else {
      const pkcs8 = Buffer.concat([ED25519_PKCS8_PREFIX, seed]);
      keyObject = crypto.createPrivateKey({
        key: pkcs8,
        format: "der",
        type: "pkcs8",
      });
    }
    const pub = crypto.createPublicKey(keyObject);
    const spki = pub.export({ format: "der", type: "spki" });
    pubKeyB64 = spki.subarray(spki.length - 32).toString("base64");
  } catch (e) {
    auditFn("signer_load_exception", `source=${source}`, `err=${e.message || e}`);
    return null;
  }

  // Verify pubkey matches registry; bus rejects mismatches anyway, but failing
  // fast here gives a cleaner audit trail.
  try {
    const reg = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
    const entry = (reg.keys || []).find((k) => k.key_id === ACER_KEY_ID);
    if (!entry) {
      auditFn("signer_no_registry_entry", `key_id=${ACER_KEY_ID}`);
      return null;
    }
    if (entry.public_key_b64 !== pubKeyB64) {
      auditFn(
        "signer_pubkey_mismatch",
        `key_id=${ACER_KEY_ID}`,
        `derived=${pubKeyB64.slice(0, 12)}`,
        `registry=${entry.public_key_b64.slice(0, 12)}`
      );
      return null;
    }
  } catch (e) {
    auditFn("signer_registry_read_failed", `err=${e.message || e}`);
    return null;
  }

  return { keyObject, pubKeyB64, source };
}

/**
 * Sign payload object with acer's key, returning a signed_envelope wrapper:
 *   { payload: <obj>, signature: { key_id, sig_b64, alg, signed_at } }
 *
 * @param {{keyObject:crypto.KeyObject}} signer
 * @param {object} payloadObject
 */
export function signPayload(signer, payloadObject) {
  const bytes = Buffer.from(JSON.stringify(payloadObject), "utf8");
  const sig = crypto.sign(null, bytes, signer.keyObject);
  return {
    payload: payloadObject,
    signature: {
      key_id: ACER_KEY_ID,
      sig_b64: sig.toString("base64"),
      alg: "ed25519",
      signed_at: new Date().toISOString(),
    },
  };
}
