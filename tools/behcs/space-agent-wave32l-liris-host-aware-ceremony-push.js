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
const remoteBundleRoot = path.join(lirisIncomingRoot, "wave32l-host-aware-ceremony-push");

const payloads = Object.freeze([
  "tools/behcs/space-agent-wave32j-ed25519-council-seal.js",
  "data/behcs/orchestration/space-agent-intake-20260428/wave32k-council-seal-public-push-manifest.json",
  "data/behcs/orchestration/space-agent-intake-20260428/wave32k-council-seal-public-push-acer.v1.json",
  "data/agent-index/council/D50-WAVE32K-COUNCIL-SEAL-PUBLIC-PUSH-ACER-2026-04-28.md",
  "reports/space-agent-wave32k-council-seal-public-push-latest.md"
]);

const outputs = Object.freeze({
  audit: path.join(runRoot, "wave32l-host-aware-ceremony-script-audit.v1.json"),
  state: path.join(runRoot, "wave32l-host-aware-ceremony-push-acer.v1.json"),
  manifest: path.join(runRoot, "wave32l-host-aware-ceremony-push-manifest.json"),
  votes: path.join(runRoot, "wave32l-host-aware-ceremony-push-votes.ndjson"),
  d50: path.join(councilRoot, "D50-WAVE32L-HOST-AWARE-CEREMONY-PUSH-ACER-2026-04-28.md"),
  reportJson: path.join(reportsRoot, "space-agent-wave32l-host-aware-ceremony-push-latest.json"),
  reportMd: path.join(reportsRoot, "space-agent-wave32l-host-aware-ceremony-push-latest.md")
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

function absoluteFromRepo(relativePath) {
  return path.join(repoRoot, relativePath.replace(/\//g, path.sep));
}

function displayPath(filePath) {
  const rel = path.relative(repoRoot, filePath);
  if (path.isAbsolute(rel) || rel.startsWith("..")) return filePath.replace(/\\/g, "/");
  return rel.replace(/\\/g, "/");
}

function remotePathFor(relativePath) {
  return path.join(remoteBundleRoot, relativePath.replace(/\//g, path.sep));
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

function auditCeremonyScript() {
  const scriptPath = absoluteFromRepo("tools/behcs/space-agent-wave32j-ed25519-council-seal.js");
  const content = fs.readFileSync(scriptPath, "utf8");
  const requiredTokens = [
    "resolveEvidence",
    "incomingWave32IRoot",
    "acerWave32FCandidates",
    "lirisWave32FCandidates",
    "evidenceResolution"
  ];
  const forbiddenPrivatePushTokens = [
    "lirisIncomingRoot",
    "copyFileSync(privateKey",
    "privateKeysPushed: true"
  ];
  return {
    schema: "space-agent-wave32l-host-aware-ceremony-script-audit.v1",
    generatedAt,
    script: displayPath(scriptPath),
    sha256: inspect(scriptPath).sha256,
    lines: inspect(scriptPath).lines,
    requiredTokens,
    missingTokens: requiredTokens.filter((token) => !content.includes(token)),
    forbiddenPrivatePushFindings: forbiddenPrivatePushTokens.filter((token) => content.includes(token)),
    verdict: requiredTokens.every((token) => content.includes(token)) && !forbiddenPrivatePushTokens.some((token) => content.includes(token))
      ? "PASS_HOST_AWARE_EVIDENCE_RESOLVER_PRESENT_NO_PRIVATE_PUSH"
      : "HOLD_SCRIPT_AUDIT_FAILED"
  };
}

function copyPayload(relativePath) {
  const sourcePath = absoluteFromRepo(relativePath);
  const targetPath = remotePathFor(relativePath);
  const source = inspect(sourcePath);
  let copied = false;
  let copyError = null;
  let targetAfter = inspect(targetPath);
  if (source.present) {
    try {
      ensureParent(targetPath);
      fs.copyFileSync(sourcePath, targetPath);
      copied = true;
      targetAfter = inspect(targetPath);
    } catch (error) {
      copyError = error.message;
      targetAfter = inspect(targetPath);
    }
  }
  return {
    relativePath,
    source,
    targetPath: targetPath.replace(/\\/g, "/"),
    copied,
    copyError,
    targetAfter,
    pass: source.present && targetAfter.present && source.sha256 === targetAfter.sha256
  };
}

function main() {
  const audit = auditCeremonyScript();
  writeJson(outputs.audit, audit);

  const privatePayload = payloads.some((relativePath) => /private/i.test(relativePath));
  if (privatePayload) throw new Error("Refusing to push private key payload path");

  const sourceRows = payloads.map((relativePath) => ({ relativePath, source: inspect(absoluteFromRepo(relativePath)) }));
  const allSourcesPresent = sourceRows.every((row) => row.source.present);
  const shareReachable = fs.existsSync(lirisIncomingRoot);
  const payloadResults = shareReachable ? payloads.map(copyPayload) : sourceRows.map((row) => ({
    relativePath: row.relativePath,
    source: row.source,
    targetPath: remotePathFor(row.relativePath).replace(/\\/g, "/"),
    copied: false,
    copyError: "LIRIS_INCOMING_ROOT_NOT_REACHABLE",
    targetAfter: inspect(remotePathFor(row.relativePath)),
    pass: false
  }));
  const allRemoteVerified = payloadResults.every((row) => row.pass);
  const status = !audit.verdict.startsWith("PASS")
    ? "HOLD_HOST_AWARE_CEREMONY_AUDIT_FAILED"
    : !allSourcesPresent
      ? "HOLD_MISSING_HOST_AWARE_CEREMONY_PAYLOAD"
      : !shareReachable
        ? "HOLD_LIRIS_INCOMING_ROOT_NOT_REACHABLE"
        : allRemoteVerified
          ? "ACER_TO_LIRIS_HOST_AWARE_CEREMONY_PATCH_HASH_VERIFIED"
          : "HOLD_HOST_AWARE_CEREMONY_PUSH_HASH_VERIFY_FAILED";

  const manifest = {
    schema: "space-agent-wave32l-host-aware-ceremony-push-manifest.v1",
    generatedAt,
    status,
    sourceHost: os.hostname(),
    purpose: "Push patched Wave32J ed25519 ceremony script that resolves ACER/Liris Wave32F evidence by expected stateHash across local, SMB, and incoming bundle candidates.",
    privateKeysPushed: false,
    remoteBundleRoot: remoteBundleRoot.replace(/\\/g, "/"),
    payloads: payloadResults.map((row) => ({
      relativePath: row.relativePath,
      sourceSha256: row.source.sha256,
      targetSha256: row.targetAfter.sha256,
      pass: row.pass
    }))
  };
  writeJson(outputs.manifest, manifest);

  let remoteManifestAfter = null;
  if (shareReachable) {
    const remoteManifestPath = path.join(remoteBundleRoot, "wave32l-host-aware-ceremony-push-manifest.json");
    ensureParent(remoteManifestPath);
    fs.copyFileSync(outputs.manifest, remoteManifestPath);
    remoteManifestAfter = inspect(remoteManifestPath);
  }

  const votes = [
    { prof: "PROF-HOOKWALL", vote: audit.verdict.startsWith("PASS") ? "APPROVE_HOST_AWARE_CEREMONY_PUSH" : "HOLD_SCRIPT_AUDIT", reason: "Patch adds host-aware evidence resolution and does not include private key transfer." },
    { prof: "PROF-KERNEL", vote: "APPROVE_STATEHASH_BASED_CEREMONY_EVIDENCE", reason: "Liris reciprocal ceremony must select ACER Wave32F from Wave32I incoming bundle by expected stateHash." },
    { prof: "PROF-COMMS", vote: allRemoteVerified ? "LIRIS_SMB_HASH_VERIFIED" : "HOLD_REMOTE_HASH_VERIFY", reason: "Every public tooling payload was reread from Liris incoming-acer." },
    { prof: "PROF-SHANNON", vote: "NO_PRIVATE_KEY_TRANSFER", reason: "ACER private keys stay local; Liris will mint its own keys if it runs reciprocal ceremony." },
    { prof: "COL-ASOLARIA", vote: status, reason: "Wave32L unblocks Liris reciprocal Wave32J ceremony without collapsing evidence paths." }
  ];
  writeNdjson(outputs.votes, votes);

  const stateBase = {
    schema: "space-agent-wave32l-host-aware-ceremony-push.v1",
    generatedAt,
    status,
    audit,
    privateKeysPushed: false,
    shareReachable,
    allRemoteVerified,
    remoteBundleRoot: remoteBundleRoot.replace(/\\/g, "/"),
    remoteManifestAfter,
    results: payloadResults,
    votes,
    lirisNextInstruction: [
      "Promote tools/behcs/space-agent-wave32j-ed25519-council-seal.js from Wave32L incoming with hash gate.",
      "Keep Wave32I incoming bundle present so ACER Wave32F e22519f1... is resolvable by stateHash.",
      "Run node tools/behcs/space-agent-wave32j-ed25519-council-seal.js on Liris to mint Liris-local keys.",
      "Do not copy ACER private keys."
    ]
  };
  const stateHash = sha256Text(JSON.stringify(stateBase));
  const state = { ...stateBase, stateHash };
  writeJson(outputs.state, state);

  writeText(outputs.d50, [
    "# D50 Wave32L - Host-aware Wave32J Ceremony Push (ACER to Liris)",
    "",
    "| Field | Value |",
    "|---|---|",
    `| status | ${status} |`,
    `| state_hash | ${stateHash} |`,
    `| patched_script_sha256 | ${audit.sha256} |`,
    `| private_keys_pushed | false |`,
    `| remote_bundle | ${remoteBundleRoot.replace(/\\/g, "/")} |`,
    "",
    "Wave32L repairs the same host-assumption flaw that Wave32I repaired for Wave32F, now at the ed25519 ceremony layer."
  ].join("\n"));

  writeJson(outputs.reportJson, {
    schema: "space-agent-wave32l-host-aware-ceremony-push-report.v1",
    generatedAt,
    status,
    stateHash,
    patchedScriptSha256: audit.sha256,
    privateKeysPushed: false,
    allRemoteVerified,
    manifestSha256: inspect(outputs.manifest).sha256
  });
  writeText(outputs.reportMd, [
    "# Space Agent Wave32L - Host-aware Ceremony Push",
    "",
    `Status: ${status}`,
    `State hash: ${stateHash}`,
    `Patched Wave32J script sha256: ${audit.sha256}`,
    `Private keys pushed: false`,
    `All remote verified: ${allRemoteVerified}`,
    `Remote bundle: ${remoteBundleRoot.replace(/\\/g, "/")}`
  ].join("\n"));

  console.log(JSON.stringify({
    ok: true,
    status,
    stateHash,
    patchedScriptSha256: audit.sha256,
    privateKeysPushed: false,
    allRemoteVerified,
    remoteBundleRoot: remoteBundleRoot.replace(/\\/g, "/"),
    manifestSha256: inspect(outputs.manifest).sha256,
    d50Sha256: inspect(outputs.d50).sha256,
    report: displayPath(outputs.reportMd)
  }, null, 2));
}

main();
