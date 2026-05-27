#!/usr/bin/env node
"use strict";

const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "space-agent-intake-20260428");
const councilRoot = path.join(repoRoot, "data", "agent-index", "council");
const reportsRoot = path.join(repoRoot, "reports");
const lirisIncomingRoot = path.join(
  "\\\\192.168.100.2\\liris-asolaria-old",
  "data",
  "behcs",
  "orchestration",
  "federation-reintegration-20260427",
  "incoming-acer"
);
const remoteBundleRoot = path.join(lirisIncomingRoot, "wave32k-council-seal-public-push");

const outputs = Object.freeze({
  state: path.join(runRoot, "wave32k-council-seal-public-push-acer.v1.json"),
  manifest: path.join(runRoot, "wave32k-council-seal-public-push-manifest.json"),
  votes: path.join(runRoot, "wave32k-council-seal-public-push-votes.ndjson"),
  d50: path.join(councilRoot, "D50-WAVE32K-COUNCIL-SEAL-PUBLIC-PUSH-ACER-2026-04-28.md"),
  reportJson: path.join(reportsRoot, "space-agent-wave32k-council-seal-public-push-latest.json"),
  reportMd: path.join(reportsRoot, "space-agent-wave32k-council-seal-public-push-latest.md")
});

function ensureParent(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeText(filePath, text) {
  ensureParent(filePath);
  fs.writeFileSync(filePath, text.endsWith("\n") ? text : `${text}\n`, "utf8");
}

function writeJson(filePath, value) {
  writeText(filePath, JSON.stringify(value, null, 2));
}

function writeNdjson(filePath, rows) {
  writeText(filePath, rows.map((row) => JSON.stringify(row)).join("\n"));
}

function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(String(text)).digest("hex");
}

function displayPath(filePath) {
  const rel = path.relative(repoRoot, filePath);
  if (path.isAbsolute(rel) || rel.startsWith("..")) return filePath.replace(/\\/g, "/");
  return rel.replace(/\\/g, "/");
}

function absoluteFromDisplay(display) {
  const normalized = display.replace(/\//g, path.sep);
  if (path.isAbsolute(normalized)) return normalized;
  return path.join(repoRoot, normalized);
}

function lineCount(buffer) {
  const text = buffer.toString("utf8").replace(/\r?\n$/, "");
  return text ? text.split(/\r?\n/).length : 0;
}

function inspect(filePath) {
  if (!fs.existsSync(filePath)) return { path: displayPath(filePath), present: false, sha256: null, bytes: 0, lines: 0 };
  const buffer = fs.readFileSync(filePath);
  return { path: displayPath(filePath), present: true, sha256: sha256Buffer(buffer), bytes: buffer.length, lines: lineCount(buffer) };
}

function remotePathFor(localPath) {
  return path.join(remoteBundleRoot, displayPath(localPath).replace(/\//g, path.sep));
}

function copyPayload(localPath) {
  const target = remotePathFor(localPath);
  const source = inspect(localPath);
  let copyError = null;
  let copied = false;
  let targetAfter = inspect(target);
  if (source.present) {
    try {
      ensureParent(target);
      fs.copyFileSync(localPath, target);
      copied = true;
      targetAfter = inspect(target);
    } catch (error) {
      copyError = error.message;
      targetAfter = inspect(target);
    }
  }
  return {
    localPath: displayPath(localPath),
    remotePath: target.replace(/\\/g, "/"),
    source,
    copied,
    copyError,
    targetAfter,
    pass: source.present && targetAfter.present && source.sha256 === targetAfter.sha256
  };
}

function main() {
  const sealReportPath = path.join(reportsRoot, "space-agent-wave32j-ed25519-council-seal-latest.json");
  if (!fs.existsSync(sealReportPath)) throw new Error(`Missing Wave32J seal report: ${sealReportPath}`);
  const sealReport = JSON.parse(fs.readFileSync(sealReportPath, "utf8"));
  if (sealReport.status !== "COUNCIL_SEALED_ED25519_ACER_LIRIS_SPACE_ROOMS_META") {
    throw new Error(`Wave32J is not COUNCIL_SEALED: ${sealReport.status}`);
  }
  if (!sealReport.allSignaturesVerified) throw new Error("Wave32J signatures are not verified");

  const publicPayloads = [
    "tools/behcs/space-agent-wave32j-ed25519-council-seal.js",
    "data/behcs/orchestration/space-agent-intake-20260428/wave32j-ed25519-council-seal-acer.v1.json",
    "data/behcs/orchestration/space-agent-intake-20260428/wave32j-ed25519-council-seal-payload.canonical.json",
    "data/behcs/orchestration/space-agent-intake-20260428/wave32j-ed25519-council-seal-manifest.json",
    "data/behcs/orchestration/space-agent-intake-20260428/wave32j-ed25519-council-seal-votes.ndjson",
    "data/agent-index/council/D50-WAVE32J-ED25519-COUNCIL-SEAL-ACER-LIRIS-2026-04-28.md",
    "reports/space-agent-wave32j-ed25519-council-seal-latest.json",
    "reports/space-agent-wave32j-ed25519-council-seal-latest.md",
    ...sealReport.signatures.flatMap((signature) => [signature.publicKeyPath, signature.signaturePath])
  ].map(absoluteFromDisplay);

  const privateLeak = publicPayloads.some((filePath) => /private/i.test(displayPath(filePath)));
  if (privateLeak) throw new Error("Refusing to push private key material");

  const shareReachable = fs.existsSync(lirisIncomingRoot);
  const results = shareReachable ? publicPayloads.map(copyPayload) : publicPayloads.map((filePath) => ({
    localPath: displayPath(filePath),
    remotePath: remotePathFor(filePath).replace(/\\/g, "/"),
    source: inspect(filePath),
    copied: false,
    copyError: "LIRIS_INCOMING_ROOT_NOT_REACHABLE",
    targetAfter: inspect(remotePathFor(filePath)),
    pass: false
  }));
  const allRemoteVerified = results.every((result) => result.pass);
  const status = shareReachable && allRemoteVerified
    ? "ACER_TO_LIRIS_COUNCIL_SEAL_PUBLIC_PUSH_HASH_VERIFIED"
    : "HOLD_COUNCIL_SEAL_PUBLIC_PUSH_HASH_VERIFY_FAILED";

  const manifest = {
    schema: "space-agent-wave32k-council-seal-public-push-manifest.v1",
    generatedAt,
    status,
    sourceHost: os.hostname(),
    wave32jStateHash: sealReport.stateHash,
    payloadSha256: sealReport.payloadSha256,
    privateKeysPushed: false,
    remoteBundleRoot: remoteBundleRoot.replace(/\\/g, "/"),
    payloads: results.map((result) => ({
      localPath: result.localPath,
      remotePath: result.remotePath,
      sourceSha256: result.source.sha256,
      targetSha256: result.targetAfter.sha256,
      pass: result.pass
    }))
  };
  writeJson(outputs.manifest, manifest);
  let remoteManifestAfter = null;
  if (shareReachable) {
    const remoteManifest = path.join(remoteBundleRoot, "wave32k-council-seal-public-push-manifest.json");
    ensureParent(remoteManifest);
    fs.copyFileSync(outputs.manifest, remoteManifest);
    remoteManifestAfter = inspect(remoteManifest);
  }

  const votes = [
    { prof: "PROF-HOOKWALL", vote: "APPROVE_PUBLIC_SEAL_PUSH_NO_PRIVATE_KEYS", reason: "No path containing private key material is included." },
    { prof: "PROF-COMMS", vote: allRemoteVerified ? "LIRIS_SMB_HASH_VERIFIED" : "HOLD_REMOTE_HASH_VERIFY", reason: "Every public payload was reread from Liris incoming-acer." },
    { prof: "PROF-SHANNON", vote: "APPROVE_PUBLIC_KEY_SIGNATURE_TRANSPORT", reason: "Public keys and signatures are sufficient for Liris verification." },
    { prof: "COL-ASOLARIA", vote: status, reason: "Wave32K transports the public evidence of the Wave32J ed25519 council seal." }
  ];
  writeNdjson(outputs.votes, votes);

  const stateBase = {
    schema: "space-agent-wave32k-council-seal-public-push.v1",
    generatedAt,
    status,
    wave32jStateHash: sealReport.stateHash,
    payloadSha256: sealReport.payloadSha256,
    privateKeysPushed: false,
    shareReachable,
    allRemoteVerified,
    remoteBundleRoot: remoteBundleRoot.replace(/\\/g, "/"),
    remoteManifestAfter,
    results,
    votes,
    lirisNextInstruction: [
      "Verify public keys and signatures against wave32j-ed25519-council-seal-payload.canonical.json.",
      "Do not request or copy ACER private keys.",
      "Optionally run reciprocal Liris ed25519 ceremony with Liris-local keys if a two-host COUNCIL-SEAL is desired."
    ]
  };
  const stateHash = sha256Text(JSON.stringify(stateBase));
  const state = { ...stateBase, stateHash };
  writeJson(outputs.state, state);

  writeText(outputs.d50, [
    "# D50 Wave32K - Council Seal Public Push (ACER to Liris)",
    "",
    "| Field | Value |",
    "|---|---|",
    `| status | ${status} |`,
    `| state_hash | ${stateHash} |`,
    `| wave32j_state_hash | ${sealReport.stateHash} |`,
    `| payload_sha256 | ${sealReport.payloadSha256} |`,
    `| private_keys_pushed | false |`,
    `| remote_bundle | ${remoteBundleRoot.replace(/\\/g, "/")} |`,
    "",
    "Private keys remain local to ACER. Liris receives only public keys, signatures, payload, manifest, D50, and reports."
  ].join("\n"));

  writeJson(outputs.reportJson, {
    schema: "space-agent-wave32k-council-seal-public-push-report.v1",
    generatedAt,
    status,
    stateHash,
    wave32jStateHash: sealReport.stateHash,
    payloadSha256: sealReport.payloadSha256,
    privateKeysPushed: false,
    allRemoteVerified,
    remoteBundleRoot: remoteBundleRoot.replace(/\\/g, "/"),
    manifestSha256: inspect(outputs.manifest).sha256
  });
  writeText(outputs.reportMd, [
    "# Space Agent Wave32K - Council Seal Public Push",
    "",
    `Status: ${status}`,
    `State hash: ${stateHash}`,
    `Wave32J stateHash: ${sealReport.stateHash}`,
    `Payload sha256: ${sealReport.payloadSha256}`,
    `Private keys pushed: false`,
    `Remote bundle: ${remoteBundleRoot.replace(/\\/g, "/")}`,
    `All remote verified: ${allRemoteVerified}`
  ].join("\n"));

  console.log(JSON.stringify({
    ok: true,
    status,
    stateHash,
    wave32jStateHash: sealReport.stateHash,
    payloadSha256: sealReport.payloadSha256,
    privateKeysPushed: false,
    allRemoteVerified,
    remoteBundleRoot: remoteBundleRoot.replace(/\\/g, "/"),
    manifestSha256: inspect(outputs.manifest).sha256,
    d50Sha256: inspect(outputs.d50).sha256,
    report: displayPath(outputs.reportMd)
  }, null, 2));
}

main();
