// bus-verify.mjs — liris ed25519 envelope verifier.
// Mirrors C:/Users/rayss/Asolaria/tools/behcs-sidecar-liris.js:59-81 (acer 50bb650)
// byte-for-byte: SPKI-wrapped raw pubkey, JSON.stringify(payload) UTF-8 material,
// crypto.verify(null, material, pub, sig). No deps beyond node:fs + node:crypto.
//
// Three verdicts, never throws to caller:
//   VERIFIED  → signature OK, key_id resolved against registry
//   TAMPERED  → signature present but bad/unknown-key/forged
//   UNSIGNED  → no signed_envelope or missing payload/signature fields
//
// Accepts either a full bus envelope (searches body.signed_envelope and friends)
// or a bare signed_envelope block.
//
// Default registry: C:/Users/rayss/Asolaria-BEHCS-256/kernel/ed25519-registry.json
// Read-only — never mutates the file.

import fs from "node:fs";
import crypto from "node:crypto";

const DEFAULT_REGISTRY_PATH =
  "C:/Users/rayss/Asolaria-BEHCS-256/kernel/ed25519-registry.json";
const SPKI_ED_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

function loadRegistry(p = DEFAULT_REGISTRY_PATH) {
  try {
    if (!fs.existsSync(p)) return { keys: [] };
    return JSON.parse(fs.readFileSync(p, "utf-8"));
  } catch (_) {
    return { keys: [] };
  }
}

function extractSignedEnvelope(env) {
  if (!env || typeof env !== "object") return null;
  // Bare signed_envelope: { payload, signature }
  if (env.payload && env.signature) return env;
  // Top-level wrapper: { signed_envelope: {...} }
  if (env.signed_envelope && env.signed_envelope.payload) return env.signed_envelope;
  // Bus envelope shapes seen in canon: body.signed_envelope, body.liris_signed_envelope, body.acer_signed_envelope
  if (env.body && typeof env.body === "object") {
    if (env.body.signed_envelope && env.body.signed_envelope.payload)
      return env.body.signed_envelope;
    if (env.body.liris_signed_envelope && env.body.liris_signed_envelope.payload)
      return env.body.liris_signed_envelope;
    if (env.body.acer_signed_envelope && env.body.acer_signed_envelope.payload)
      return env.body.acer_signed_envelope;
  }
  return null;
}

export function verifyEnvelopeSig(env, registry) {
  const reg = registry || loadRegistry();
  const signedEnv = extractSignedEnvelope(env);
  if (!signedEnv) return { verdict: "UNSIGNED", reason: "no-signed-envelope" };
  const { payload, signature } = signedEnv;
  if (!payload || !signature || !signature.key_id || !signature.sig_b64) {
    return { verdict: "UNSIGNED", reason: "payload-or-signature-missing" };
  }
  const entry = (reg.keys || []).find((k) => k.key_id === signature.key_id);
  if (!entry) return { verdict: "TAMPERED", reason: "unknown-key-id", key_id: signature.key_id };
  try {
    const pubRaw = Buffer.from(entry.public_key_b64, "base64");
    if (pubRaw.length !== 32)
      return { verdict: "TAMPERED", reason: "bad-key-material", key_id: signature.key_id };
    const spki = Buffer.concat([SPKI_ED_PREFIX, pubRaw]);
    const pub = crypto.createPublicKey({ key: spki, format: "der", type: "spki" });
    const material = Buffer.from(JSON.stringify(payload), "utf-8");
    const sigBuf = Buffer.from(signature.sig_b64, "base64");
    const ok = crypto.verify(null, material, pub, sigBuf);
    if (!ok)
      return {
        verdict: "TAMPERED",
        reason: "crypto-verify-failed",
        key_id: signature.key_id,
        owner: entry.owner_glyph,
      };
    return { verdict: "VERIFIED", key_id: entry.key_id, owner: entry.owner_glyph };
  } catch (e) {
    return { verdict: "TAMPERED", reason: "threw: " + e.message, key_id: signature.key_id };
  }
}

export { DEFAULT_REGISTRY_PATH, loadRegistry };
