// bus-sign.mjs — liris ed25519 envelope signer.
// Loads dev-liris-4c19e180 private seed from ~/.asolaria-workers/ed25519-vault,
// produces signed_envelope shape acer's ingress sig-verify accepts.
//
// Acer registry already lists DEV-LIRIS public key:
//   public_key_b64 = JAv/hJl/XkxU0A6lVZ44fKaEDYp6/tl6/Uupa2tmqMw=
//   key_id        = dev-liris-4c19e180
// Match: load that seed, sign JSON.stringify(payload), wrap.

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";

const VAULT_DIR = path.join(os.homedir(), ".asolaria-workers", "ed25519-vault");
const SPKI_ED_PREFIX = Buffer.from("302a300506032b6570032100", "hex");
const PKCS8_ED_PREFIX = Buffer.from("302e020100300506032b657004220420", "hex");

export const LIRIS_KEY_ID = "dev-liris-4c19e180";

function seedToPkcs8Der(seed32) {
  if (seed32.length !== 32) throw new Error(`seed must be 32 bytes, got ${seed32.length}`);
  return Buffer.concat([PKCS8_ED_PREFIX, seed32]);
}

export function loadPrivateSeed(keyId = LIRIS_KEY_ID) {
  const p = path.join(VAULT_DIR, `${keyId}.private.b64`);
  if (!fs.existsSync(p)) throw new Error(`private seed not in vault: ${p}`);
  const b64 = fs.readFileSync(p, "utf-8").trim();
  const seed = Buffer.from(b64, "base64");
  if (seed.length !== 32) throw new Error(`vault seed length ${seed.length}, expected 32`);
  return seed;
}

export function signPayload(payload, keyId = LIRIS_KEY_ID) {
  const seed = loadPrivateSeed(keyId);
  const pkcs8 = seedToPkcs8Der(seed);
  const priv = crypto.createPrivateKey({ key: pkcs8, format: "der", type: "pkcs8" });
  const material = Buffer.from(JSON.stringify(payload), "utf-8");
  const sig = crypto.sign(null, material, priv);
  return {
    key_id: keyId,
    sig_b64: sig.toString("base64"),
    alg: "ed25519",
    signed_at: new Date().toISOString(),
  };
}

export function buildSignedEnvelope(payload, keyId = LIRIS_KEY_ID) {
  return {
    signed_envelope: {
      payload,
      signature: signPayload(payload, keyId),
    },
  };
}
