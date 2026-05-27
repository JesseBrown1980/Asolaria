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
const remoteBundleRoot = path.join(lirisIncomingRoot, "wave32i-wave32f-evidence-resolver-push");

const payloads = Object.freeze([
  "tools/behcs/space-agent-wave32f-d50-meta-rollup.js",
  "data/behcs/orchestration/space-agent-intake-20260428/wave32f-d50-meta-rollup-acer.v1.json",
  "data/behcs/orchestration/space-agent-intake-20260428/wave32f-d50-meta-rollup-manifest.json",
  "data/behcs/orchestration/space-agent-intake-20260428/wave32f-d50-meta-rollup-votes.ndjson",
  "data/agent-index/council/D50-WAVE32F-SPACE-ROOMS-META-ROLLUP-ACER-LIRIS-2026-04-28.md",
  "reports/space-agent-wave32f-d50-meta-rollup-latest.json",
  "reports/space-agent-wave32f-d50-meta-rollup-latest.md"
]);

const outputs = Object.freeze({
  state: path.join(runRoot, "wave32i-wave32f-evidence-resolver-push-acer.v1.json"),
  manifest: path.join(runRoot, "wave32i-wave32f-evidence-resolver-push-manifest.json"),
  audit: path.join(runRoot, "wave32i-wave32f-evidence-resolver-audit.v1.json"),
  votes: path.join(runRoot, "wave32i-wave32f-evidence-resolver-push-votes.ndjson"),
  d50: path.join(councilRoot, "D50-WAVE32I-WAVE32F-EVIDENCE-RESOLVER-PUSH-ACER-2026-04-28.md"),
  reportJson: path.join(reportsRoot, "space-agent-wave32i-wave32f-evidence-resolver-push-latest.json"),
  reportMd: path.join(reportsRoot, "space-agent-wave32i-wave32f-evidence-resolver-push-latest.md")
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

function sha256Text(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function repoRel(filePath) {
  const rel = path.relative(repoRoot, filePath);
  if (path.isAbsolute(rel) || rel.startsWith("..")) return filePath.replace(/\\/g, "/");
  return rel.replace(/\\/g, "/");
}

function absoluteFromRepo(relativePath) {
  return path.join(repoRoot, relativePath.replace(/\//g, path.sep));
}

function remotePathFor(relativePath) {
  return path.join(remoteBundleRoot, relativePath.replace(/\//g, path.sep));
}

function lineCount(buffer) {
  const text = buffer.toString("utf8").replace(/\r?\n$/, "");
  return text ? text.split(/\r?\n/).length : 0;
}

function inspectAbsolute(filePath) {
  if (!fs.existsSync(filePath)) {
    return { present: false, path: filePath.replace(/\\/g, "/"), sha256: null, lines: 0, bytes: 0 };
  }
  const buffer = fs.readFileSync(filePath);
  return {
    present: true,
    path: filePath.replace(/\\/g, "/"),
    sha256: sha256Buffer(buffer),
    lines: lineCount(buffer),
    bytes: buffer.length
  };
}

function inspectRepo(relativePath) {
  return inspectAbsolute(absoluteFromRepo(relativePath));
}

function copyPayload(relativePath) {
  const sourcePath = absoluteFromRepo(relativePath);
  const targetPath = remotePathFor(relativePath);
  const source = inspectAbsolute(sourcePath);
  let copied = false;
  let copyError = null;
  let targetAfter = inspectAbsolute(targetPath);
  if (source.present) {
    try {
      ensureParent(targetPath);
      fs.copyFileSync(sourcePath, targetPath);
      copied = true;
      targetAfter = inspectAbsolute(targetPath);
    } catch (error) {
      copyError = error.message;
      targetAfter = inspectAbsolute(targetPath);
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

function auditPatchedWave32F() {
  const scriptPath = absoluteFromRepo("tools/behcs/space-agent-wave32f-d50-meta-rollup.js");
  const content = fs.readFileSync(scriptPath, "utf8");
  const requiredTokens = [
    "resolveJsonEvidence",
    "incomingWave32CRoot",
    "incomingWave32HRoot",
    "acerWave32BCandidates",
    "lirisWave32BCandidates",
    "acerWave32ECandidates",
    "rootForWave32BSource"
  ];
  const forbiddenRuntimePatterns = [
    { id: "process_spawn", pattern: /\b(spawn|spawnSync|exec|execSync)\b/ },
    { id: "destructive_delete", pattern: /\b(unlinkSync|rmSync|rmdirSync|Remove-Item)\b/ },
    { id: "external_clone_install", pattern: /\b(git\s+clone|npm\s+install|pnpm\s+install|cloneInstall:\s*true)\b/i },
    { id: "space_agent_runtime_import", pattern: /\bspace-agent\.ai\b|\bagent0ai\/space\b|\buseSpaceAgentCode:\s*true\b/i }
  ];
  const missingTokens = requiredTokens.filter((token) => !content.includes(token));
  const findings = [];
  const lines = content.split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    for (const rule of forbiddenRuntimePatterns) {
      if (rule.pattern.test(line)) findings.push({ line: index + 1, rule: rule.id, text: line.trim() });
    }
  }
  return {
    schema: "space-agent-wave32i-wave32f-evidence-resolver-audit.v1",
    generatedAt,
    script: repoRel(scriptPath),
    sha256: inspectAbsolute(scriptPath).sha256,
    lines: lines[lines.length - 1] === "" ? lines.length - 1 : lines.length,
    requiredTokens,
    missingTokens,
    forbiddenRuntimeFindings: findings,
    verdict: missingTokens.length === 0 && findings.length === 0
      ? "PASS_EVIDENCE_RESOLVER_PRESENT_NO_RUNTIME_RISK_FINDINGS"
      : "HOLD_EVIDENCE_RESOLVER_AUDIT_FAILED"
  };
}

function buildVotes(status, audit, allRemoteVerified) {
  return [
    {
      prof: "PROF-HOOKWALL",
      supervisorPid: "BH.SUPERVISOR.PID.SPACE.HOOKWALL.WAVE32I.ACER",
      vote: audit.verdict.startsWith("PASS") ? "APPROVE_RESOLVER_PATCH_PUSH" : "HOLD_SCRIPT_AUDIT",
      reason: "Patch changes evidence selection only; no Space Agent clone/install/code execution."
    },
    {
      prof: "PROF-KERNEL",
      supervisorPid: "BH.SUPERVISOR.PID.SPACE.KERNEL.WAVE32I.ACER",
      vote: "APPROVE_STATEHASH_BASED_EVIDENCE_RESOLUTION",
      reason: "ACER and Liris Wave32B evidence must be selected by expected stateHash, not mutable canonical slot assumptions."
    },
    {
      prof: "PROF-COMMS",
      supervisorPid: "BH.SUPERVISOR.PID.SPACE.COMMS.WAVE32I.ACER",
      vote: allRemoteVerified ? "LIRIS_SMB_HASH_VERIFIED" : "HOLD_REMOTE_HASH_VERIFY",
      reason: "Patched script and regression outputs are reread from the Liris incoming-acer share."
    },
    {
      prof: "PROF-WHITEROOM",
      supervisorPid: "BH.SUPERVISOR.PID.SPACE.WHITEROOM.WAVE32I.ACER",
      vote: "APPROVE_HOLD_ROOT_CAUSE_REPAIRED",
      reason: "The Liris HOLD exposed a real architecture flaw; Wave32I records the repair instead of suppressing the hold."
    },
    {
      prof: "COL-ASOLARIA",
      supervisorPid: "BH.SUPERVISOR.PID.SPACE.ASOLARIA.APEX.WAVE32I.ACER",
      vote: status,
      reason: "Liris can now promote the patched Wave32F runner and rerun reciprocal META roll-up."
    }
  ];
}

function main() {
  const audit = auditPatchedWave32F();
  writeJson(outputs.audit, audit);

  const regression = JSON.parse(fs.readFileSync(absoluteFromRepo("data/behcs/orchestration/space-agent-intake-20260428/wave32f-d50-meta-rollup-acer.v1.json"), "utf8"));
  const regressionOk =
    regression.status === "D50_META_ROLLUP_RATIFIABLE_ACER_LIRIS_SIBLINGS_BOUND" &&
    regression.evidence &&
    regression.evidence.acer &&
    regression.evidence.acer.stateHash === "66bab90353723c1f6f3791cb29bfaf3e3ebf46f73789b135b53494176e4e1b88" &&
    regression.evidence.liris &&
    regression.evidence.liris.stateHash === "495aab793394d584f9cdfab77270afb9a24a23d40c07c0eddc5afcb72f610f38" &&
    regression.evidence.acerWave32E &&
    regression.evidence.acerWave32E.stateHash === "29d7ef80cb6d0d3462b84a308a3514a96b3813bc13e63cb324da9791df7498fe" &&
    regression.counts &&
    regression.counts.divergentSurfaceCount === 12 &&
    regression.counts.equivalentSurfaceCount === 0;

  const sourceRows = payloads.map((relativePath) => ({ relativePath, source: inspectRepo(relativePath) }));
  const allSourcesPresent = sourceRows.every((row) => row.source.present);
  const shareReachable = fs.existsSync(lirisIncomingRoot);
  const payloadResults = shareReachable ? payloads.map(copyPayload) : sourceRows.map((row) => ({
    relativePath: row.relativePath,
    source: row.source,
    targetPath: remotePathFor(row.relativePath).replace(/\\/g, "/"),
    copied: false,
    copyError: "LIRIS_INCOMING_ROOT_NOT_REACHABLE",
    targetAfter: inspectAbsolute(remotePathFor(row.relativePath)),
    pass: false
  }));
  const allRemoteVerified = payloadResults.every((row) => row.pass);
  const status = !audit.verdict.startsWith("PASS")
    ? "HOLD_WAVE32F_RESOLVER_AUDIT_FAILED"
    : !regressionOk
      ? "HOLD_WAVE32F_REGRESSION_FAILED"
      : !allSourcesPresent
        ? "HOLD_MISSING_WAVE32F_PATCH_PAYLOAD"
        : !shareReachable
          ? "HOLD_LIRIS_INCOMING_ROOT_NOT_REACHABLE"
          : allRemoteVerified
            ? "ACER_TO_LIRIS_WAVE32F_EVIDENCE_RESOLVER_PATCH_HASH_VERIFIED"
            : "HOLD_LIRIS_WAVE32F_RESOLVER_PATCH_HASH_VERIFY_FAILED";

  const manifest = {
    schema: "space-agent-wave32i-wave32f-evidence-resolver-push-manifest.v1",
    generatedAt,
    status,
    sourceHost: os.hostname(),
    purpose: "Push patched Wave32F evidence resolver after Liris proved canonical-path evidence selection collapsed ACER into Liris.",
    regressionStateHash: regression.stateHash,
    priorAcerWave32FStateHash: "6ac1ac9c0341ccba72f82caf416cc13f5d9edae4942c3047f82706c4cdcae3d0",
    repairedAcerWave32FStateHash: regression.stateHash,
    remoteBundleRoot: remoteBundleRoot.replace(/\\/g, "/"),
    payloads: payloadResults.map((row) => ({
      relativePath: row.relativePath,
      sourceSha256: row.source.sha256,
      targetSha256: row.targetAfter.sha256,
      sourceLines: row.source.lines,
      pass: row.pass
    }))
  };
  writeJson(outputs.manifest, manifest);

  let remoteManifestAfter = null;
  if (shareReachable) {
    const remoteManifestPath = path.join(remoteBundleRoot, "wave32i-wave32f-evidence-resolver-push-manifest.json");
    try {
      ensureParent(remoteManifestPath);
      fs.copyFileSync(outputs.manifest, remoteManifestPath);
      remoteManifestAfter = inspectAbsolute(remoteManifestPath);
    } catch (error) {
      remoteManifestAfter = { present: false, path: remoteManifestPath.replace(/\\/g, "/"), error: error.message };
    }
  }

  const votes = buildVotes(status, audit, allRemoteVerified);
  writeNdjson(outputs.votes, votes);

  const stateBase = {
    schema: "space-agent-wave32i-wave32f-evidence-resolver-push.v1",
    generatedAt,
    status,
    sourceHost: os.hostname(),
    purpose: "Repair Wave32F evidence architecture by resolving ACER/Liris evidence by expected stateHash and immutable incoming bundle paths.",
    rootCause: "Canonical Wave32B path is host-local and mutable; Liris reciprocal Wave32B overwrote promoted ACER bytes, causing the old script to compare Liris with itself.",
    selectedResolutionPath: "Modify Wave32F META script to read ACER Wave32B from incoming-acer Wave32C bundle when canonical slot does not match ACER stateHash.",
    notRatification: true,
    noLirisCanonicalWriteByAcer: true,
    audit,
    regression: {
      ok: regressionOk,
      status: regression.status,
      stateHash: regression.stateHash,
      acerWave32B: regression.evidence && regression.evidence.acer && regression.evidence.acer.stateHash,
      lirisWave32B: regression.evidence && regression.evidence.liris && regression.evidence.liris.stateHash,
      acerWave32E: regression.evidence && regression.evidence.acerWave32E && regression.evidence.acerWave32E.stateHash,
      divergentSurfaceCount: regression.counts && regression.counts.divergentSurfaceCount,
      equivalentSurfaceCount: regression.counts && regression.counts.equivalentSurfaceCount
    },
    execution: {
      shareReachable,
      allSourcesPresent,
      allRemoteVerified,
      payloadCount: payloads.length,
      remoteBundleRoot: remoteBundleRoot.replace(/\\/g, "/"),
      remoteManifestAfter,
      results: payloadResults
    },
    votes,
    lirisNextInstruction: [
      "Promote tools/behcs/space-agent-wave32f-d50-meta-rollup.js from incoming-acer Wave32I with hash gate.",
      "Keep incoming-acer Wave32C and Wave32H bundles present.",
      "Re-run node tools/behcs/space-agent-wave32f-d50-meta-rollup.js on Liris.",
      "Expected Liris result: ACER 66bab903..., Liris 495aab79..., Wave32E 29d7ef80..., divergentSurfaceCount 12, equivalentSurfaceCount 0."
    ],
    boundaries: [
      "evidence_resolver_patch_only",
      "no_hidden_bulk_copy",
      "no_liris_canonical_promotion",
      "no_liris_execution",
      "no_space_agent_clone",
      "no_install",
      "no_mcp",
      "no_codex_subagents",
      "no_peer_api_call",
      "no_ratification"
    ]
  };
  const stateHash = sha256Text(JSON.stringify(stateBase));
  const state = { ...stateBase, stateHash };
  writeJson(outputs.state, state);

  const d50Lines = [
    "# D50 Wave32I - Wave32F Evidence Resolver Push (ACER)",
    "",
    "| Field | Value |",
    "|---|---|",
    `| status | ${status} |`,
    `| state_hash | ${stateHash} |`,
    `| prior_acer_wave32f_state_hash | 6ac1ac9c0341ccba72f82caf416cc13f5d9edae4942c3047f82706c4cdcae3d0 |`,
    `| repaired_acer_wave32f_state_hash | ${regression.stateHash} |`,
    `| regression_acer_wave32b | ${stateBase.regression.acerWave32B} |`,
    `| regression_liris_wave32b | ${stateBase.regression.lirisWave32B} |`,
    `| regression_acer_wave32e | ${stateBase.regression.acerWave32E} |`,
    `| divergent_surface_count | ${stateBase.regression.divergentSurfaceCount} |`,
    `| equivalent_surface_count | ${stateBase.regression.equivalentSurfaceCount} |`,
    `| remote_bundle | ${remoteBundleRoot.replace(/\\/g, "/")} |`,
    "",
    "## Root Cause",
    "",
    stateBase.rootCause,
    "",
    "## Supervisor Votes",
    "",
    ...votes.map((vote) => `- ${vote.prof} / ${vote.supervisorPid}: ${vote.vote} - ${vote.reason}`),
    "",
    "## Boundary",
    "",
    "Wave32I is a script evidence-resolver patch and evidence push only. It does not promote Liris canonical files, run Liris code, install Space Agent, or claim COUNCIL-SEALED status."
  ];
  writeText(outputs.d50, d50Lines.join("\n"));

  const report = {
    schema: "space-agent-wave32i-wave32f-evidence-resolver-push-report.v1",
    generatedAt,
    status,
    stateHash,
    regression: stateBase.regression,
    remoteBundleRoot: remoteBundleRoot.replace(/\\/g, "/"),
    auditVerdict: audit.verdict,
    payloads: manifest.payloads
  };
  writeJson(outputs.reportJson, report);
  writeText(outputs.reportMd, [
    "# Space Agent Wave32I - Wave32F Evidence Resolver Push",
    "",
    `Status: ${status}`,
    `State hash: ${stateHash}`,
    `Prior ACER Wave32F stateHash: 6ac1ac9c0341ccba72f82caf416cc13f5d9edae4942c3047f82706c4cdcae3d0`,
    `Repaired ACER Wave32F stateHash: ${regression.stateHash}`,
    `Regression: ACER ${stateBase.regression.acerWave32B}; Liris ${stateBase.regression.lirisWave32B}; Wave32E ${stateBase.regression.acerWave32E}; divergent ${stateBase.regression.divergentSurfaceCount}; equivalent ${stateBase.regression.equivalentSurfaceCount}`,
    `Remote bundle: ${remoteBundleRoot.replace(/\\/g, "/")}`,
    "",
    "Liris next:",
    "- Promote the patched Wave32F script from Wave32I incoming-acer with hash gate.",
    "- Re-run node tools/behcs/space-agent-wave32f-d50-meta-rollup.js.",
    "- Expected: divergentSurfaceCount 12, equivalentSurfaceCount 0."
  ].join("\n"));

  console.log(JSON.stringify({
    ok: true,
    status,
    stateHash,
    regressionStateHash: regression.stateHash,
    allRemoteVerified,
    remoteBundleRoot: remoteBundleRoot.replace(/\\/g, "/"),
    report: repoRel(outputs.reportMd)
  }, null, 2));
}

main();
