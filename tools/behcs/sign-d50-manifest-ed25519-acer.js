#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();

function parseArgs(argv) {
  const args = {};
  for (const item of argv) {
    const match = item.match(/^--([^=]+)=(.*)$/);
    if (match) args[match[1]] = match[2];
  }
  return args;
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeJson(filePath, data) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function repoRel(filePath) {
  const relative = path.relative(repoRoot, filePath);
  if (path.isAbsolute(relative) || relative.startsWith("..")) return filePath.replace(/\\/g, "/");
  return relative.replace(/\\/g, "/");
}

function refusal(reason, args) {
  const reportPath = path.join(repoRoot, "reports", "sign-d50-manifest-ed25519-acer-latest.json");
  const result = {
    schema: "sign-d50-manifest-ed25519-acer.v1",
    generatedAt,
    status: "REFUSED_MISSING_EXPLICIT_KEY_SCOPE_OR_STORAGE",
    reason,
    requiredArgs: ["--manifest-path=<path>", "--key-scope=<scope>", "--storage-path=<directory>", "--confirm-real-key=YES"],
    providedArgs: Object.keys(args).sort(),
    keyGenerated: false,
    boundary: "No private key generated. No signature generated. No ratification or promotion."
  };
  writeJson(reportPath, result);
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = 2;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args["manifest-path"]) return refusal("missing --manifest-path", args);
  if (!args["key-scope"]) return refusal("missing --key-scope", args);
  if (!args["storage-path"]) return refusal("missing --storage-path", args);
  if (args["confirm-real-key"] !== "YES") return refusal("missing --confirm-real-key=YES", args);

  const manifestPath = path.resolve(repoRoot, args["manifest-path"]);
  const storagePath = path.resolve(repoRoot, args["storage-path"]);
  if (!fs.existsSync(manifestPath)) return refusal(`manifest not found: ${args["manifest-path"]}`, args);

  fs.mkdirSync(storagePath, { recursive: true });
  const manifestBytes = fs.readFileSync(manifestPath);
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
  const signature = crypto.sign(null, manifestBytes, privateKey);
  const publicPem = publicKey.export({ type: "spki", format: "pem" });
  const privatePem = privateKey.export({ type: "pkcs8", format: "pem" });
  const privateKeyPath = path.join(storagePath, "ed25519-private.pk8.pem");
  const publicKeyPath = path.join(storagePath, "ed25519-public.spki.pem");
  const signaturePath = path.join(storagePath, "manifest.signature.bin");
  const attestationPath = path.join(storagePath, "manifest-ed25519-attestation.json");
  fs.writeFileSync(privateKeyPath, privatePem, { encoding: "utf8", mode: 0o600 });
  fs.writeFileSync(publicKeyPath, publicPem, "utf8");
  fs.writeFileSync(signaturePath, signature);
  const attestation = {
    schema: "sign-d50-manifest-ed25519-acer.attestation.v1",
    generatedAt,
    status: "REAL_ED25519_SIGNATURE_EMITTED",
    keyScope: args["key-scope"],
    manifest: {
      path: repoRel(manifestPath),
      bytes: manifestBytes.length,
      sha256: sha256Buffer(manifestBytes)
    },
    outputs: {
      privateKeyPath: repoRel(privateKeyPath),
      publicKeyPath: repoRel(publicKeyPath),
      signaturePath: repoRel(signaturePath)
    },
    publicKeySha256: sha256Buffer(Buffer.from(publicPem, "utf8")),
    signatureSha256: sha256Buffer(signature),
    boundary: "Real key material generated only because explicit key scope, storage path, manifest path, and confirm-real-key=YES were supplied. This signs bytes only; it does not ratify or promote federation state."
  };
  writeJson(attestationPath, attestation);
  writeJson(path.join(repoRoot, "reports", "sign-d50-manifest-ed25519-acer-latest.json"), { ...attestation, attestationPath: repoRel(attestationPath) });
  console.log(JSON.stringify(attestation, null, 2));
}

main();
