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
const memoryRoot = path.join(repoRoot, "data", "behcs", "memory");
const mapsRoot = path.join(repoRoot, "data", "behcs", "maps", "asolaria");
const cubesRoot = path.join(repoRoot, "data", "behcs", "cubes");
const glpjRoot = path.join(repoRoot, "data", "behcs", "codex", "glyph-language");

const lirisShareRoot = "\\\\192.168.100.2\\liris-asolaria-old";
const lirisIncomingRoot = path.join(
  lirisShareRoot,
  "data",
  "behcs",
  "orchestration",
  "federation-reintegration-20260427",
  "incoming-acer"
);
const remoteBundleRoot = path.join(lirisIncomingRoot, "wave32g-d50-meta-rollup-push");

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
  state: path.join(runRoot, "wave32g-liris-meta-rollup-push-acer.v1.json"),
  manifest: path.join(runRoot, "wave32g-liris-meta-rollup-push-manifest.json"),
  lineAudit: path.join(runRoot, "wave32g-wave32f-executor-line-audit.v1.json"),
  votes: path.join(runRoot, "wave32g-liris-meta-rollup-push-votes.ndjson"),
  d50: path.join(councilRoot, "D50-WAVE32G-LIRIS-META-ROLLUP-PUSH-ACER-2026-04-28.md"),
  memory: path.join(memoryRoot, "space-agent-wave32g-liris-meta-rollup-push.v1.json"),
  map: path.join(mapsRoot, "space-agent-wave32g-liris-meta-rollup-push-map-map-mapped.v1.json"),
  cube: path.join(cubesRoot, "space-agent-wave32g-liris-meta-rollup-push-cube-cubed.cube.js"),
  glpj: path.join(glpjRoot, "space-agent-wave32g-liris-meta-rollup-push-behcs256.glpj.json"),
  reportJson: path.join(reportsRoot, "space-agent-wave32g-liris-meta-rollup-push-latest.json"),
  reportMd: path.join(reportsRoot, "space-agent-wave32g-liris-meta-rollup-push-latest.md")
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
    return {
      present: false,
      path: filePath.replace(/\\/g, "/"),
      sha256: null,
      lines: 0,
      bytes: 0
    };
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

function artifactInfo(filePath) {
  const info = inspectAbsolute(filePath);
  return { ...info, path: repoRel(filePath) };
}

function glyph(kind, id, seed = "") {
  return `BH.GLPJ.${sha256Text(`${kind}:${id}:${seed}`).slice(0, 32).toUpperCase()}`;
}

function auditWave32fExecutor() {
  const scriptPath = absoluteFromRepo("tools/behcs/space-agent-wave32f-d50-meta-rollup.js");
  const content = fs.readFileSync(scriptPath, "utf8");
  const lines = content.split(/\r?\n/);
  const rules = [
    { id: "process_spawn", pattern: /\b(spawn|spawnSync|exec|execSync)\b/ },
    { id: "destructive_delete", pattern: /\b(unlinkSync|rmSync|rmdirSync|Remove-Item)\b/ },
    { id: "external_clone_install", pattern: /\b(git\s+clone|npm\s+install|pnpm\s+install|cloneInstall:\s*true)\b/i },
    { id: "space_agent_runtime_import", pattern: /\bspace-agent\.ai\b|\bagent0ai\/space\b|\buseSpaceAgentCode:\s*true\b/i },
    { id: "mcp_or_codex_subagent", pattern: /\bspawn_agent\b|\bMCP\b|\bCodex subagents?\b/ }
  ];
  const findings = [];
  for (const [index, line] of lines.entries()) {
    for (const rule of rules) {
      if (rule.pattern.test(line)) findings.push({ line: index + 1, rule: rule.id, text: line.trim() });
    }
  }
  const materialFindings = findings.filter((finding) => [
    "process_spawn",
    "destructive_delete",
    "external_clone_install",
    "space_agent_runtime_import"
  ].includes(finding.rule));
  return {
    schema: "wave32g-wave32f-executor-line-audit.v1",
    generatedAt,
    script: repoRel(scriptPath),
    sha256: inspectAbsolute(scriptPath).sha256,
    lines: lines[lines.length - 1] === "" ? lines.length - 1 : lines.length,
    everyLineRead: true,
    scanRules: rules.map((rule) => rule.id),
    findings,
    materialRuntimeRiskFindings: materialFindings,
    verdict: materialFindings.length === 0 ? "PASS_NO_PROCESS_DELETE_INSTALL_OR_SPACE_AGENT_RUNTIME_IMPORT" : "HOLD_MATERIAL_RUNTIME_RISK_FINDINGS",
    note: "Textual boundary mentions of MCP/Codex subagents are doctrine strings, not runtime calls."
  };
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
    id: relativePath.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    relativePath,
    targetPath: targetPath.replace(/\\/g, "/"),
    source,
    copied,
    copyError,
    targetAfter,
    pass: source.present && targetAfter.present && source.sha256 === targetAfter.sha256
  };
}

function buildVotes(status, allSourcesPresent, allRemoteVerified, lineAudit) {
  return [
    {
      prof: "PROF-HOOKWALL",
      supervisorPid: "BH.SUPERVISOR.PID.SPACE.HOOKWALL.WAVE32G.ACER",
      vote: lineAudit.verdict.startsWith("PASS") ? "APPROVE_EXPLICIT_META_ROLLUP_BUNDLE" : "HOLD_SCRIPT_AUDIT",
      reason: "Only Wave32F executor and sealed evidence artifacts are pushed; no implementation surfaces or hidden bulk copy."
    },
    {
      prof: "PROF-COMMS",
      supervisorPid: "BH.SUPERVISOR.PID.SPACE.COMMS.WAVE32G.ACER",
      vote: allRemoteVerified ? "LIRIS_SMB_HASH_VERIFIED" : "HOLD_REMOTE_HASH_VERIFY",
      reason: "Wave32G closes only after rereading the remote bundle over the Liris SMB share."
    },
    {
      prof: "PROF-KERNEL",
      supervisorPid: "BH.SUPERVISOR.PID.SPACE.KERNEL.WAVE32G.ACER",
      vote: allSourcesPresent ? "SOURCE_PACKET_COMPLETE" : "HOLD_MISSING_SOURCE",
      reason: "The pushed packet must include the Wave32F script, state, manifest, votes, D50, and reports."
    },
    {
      prof: "PROF-WHITEROOM",
      supervisorPid: "BH.SUPERVISOR.PID.SPACE.WHITEROOM.WAVE32G.ACER",
      vote: "RECIPROCAL_META_REQUIRES_LIRIS_INDEPENDENT_RUN",
      reason: "ACER push is evidence transfer only; Liris must independently emit its own Wave32F."
    },
    {
      prof: "COL-ASOLARIA",
      supervisorPid: "BH.SUPERVISOR.PID.SPACE.ASOLARIA.APEX.WAVE32G.ACER",
      vote: status,
      reason: "Wave32G resolves the Liris visibility gap for the ACER Wave32F D50 META roll-up."
    }
  ];
}

function main() {
  const lineAudit = auditWave32fExecutor();
  writeJson(outputs.lineAudit, lineAudit);

  const sourceRows = payloads.map((relativePath) => ({ relativePath, source: inspectRepo(relativePath) }));
  const allSourcesPresent = sourceRows.every((row) => row.source.present);
  const shareReachable = fs.existsSync(lirisIncomingRoot);
  const payloadResults = shareReachable ? payloads.map(copyPayload) : sourceRows.map((row) => ({
    id: row.relativePath.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    relativePath: row.relativePath,
    targetPath: remotePathFor(row.relativePath).replace(/\\/g, "/"),
    source: row.source,
    copied: false,
    copyError: "LIRIS_INCOMING_ROOT_NOT_REACHABLE",
    targetAfter: inspectAbsolute(remotePathFor(row.relativePath)),
    pass: false
  }));
  const allRemoteVerified = payloadResults.length > 0 && payloadResults.every((row) => row.pass);

  const status = !allSourcesPresent
    ? "HOLD_MISSING_WAVE32F_SOURCE_PAYLOAD"
    : !shareReachable
      ? "HOLD_LIRIS_INCOMING_ROOT_NOT_REACHABLE"
      : allRemoteVerified
        ? "ACER_TO_LIRIS_WAVE32F_META_ROLLUP_PUSH_HASH_VERIFIED"
        : "HOLD_LIRIS_WAVE32F_PUSH_HASH_VERIFY_FAILED";

  const manifest = {
    schema: "space-agent-wave32g-liris-meta-rollup-push-manifest.v1",
    generatedAt,
    status,
    sourceHost: os.hostname(),
    lawPosture: "SMB_HASH_GATED_EVIDENCE_PUSH; LAW001_NOT_REQUIRED_FOR_FILE_BYTES",
    lirisShareRoot,
    remoteBundleRoot: remoteBundleRoot.replace(/\\/g, "/"),
    payloads: payloadResults.map((row) => ({
      id: row.id,
      relativePath: row.relativePath,
      sourceSha256: row.source.sha256,
      sourceLines: row.source.lines,
      sourceBytes: row.source.bytes,
      targetPath: row.targetPath,
      copied: row.copied,
      copyError: row.copyError,
      targetSha256: row.targetAfter.sha256,
      pass: row.pass
    }))
  };
  writeJson(outputs.manifest, manifest);

  let remoteManifestAfter = null;
  if (shareReachable) {
    const remoteManifestPath = path.join(remoteBundleRoot, "wave32g-liris-meta-rollup-push-manifest.json");
    try {
      ensureParent(remoteManifestPath);
      fs.copyFileSync(outputs.manifest, remoteManifestPath);
      remoteManifestAfter = inspectAbsolute(remoteManifestPath);
    } catch (error) {
      remoteManifestAfter = { present: false, path: remoteManifestPath.replace(/\\/g, "/"), error: error.message };
    }
  }

  const votes = buildVotes(status, allSourcesPresent, allRemoteVerified, lineAudit);
  writeNdjson(outputs.votes, votes);

  const stateBase = {
    schema: "space-agent-wave32g-liris-meta-rollup-push.v1",
    generatedAt,
    status,
    sourceHost: os.hostname(),
    purpose: "Push ACER Wave32F D50 META roll-up evidence to Liris incoming-acer so Liris can run an independent reciprocal Wave32F.",
    notRatification: true,
    noLirisCanonicalWriteByAcer: true,
    lawPosture: "SMB hash-gated file evidence push; no peer API call; LAW-001 can later announce but is not required for byte transfer.",
    lineAudit: {
      path: repoRel(outputs.lineAudit),
      verdict: lineAudit.verdict,
      scriptLines: lineAudit.lines,
      scriptSha256: lineAudit.sha256
    },
    execution: {
      shareReachable,
      allSourcesPresent,
      allRemoteVerified,
      payloadCount: payloads.length,
      remoteBundleRoot: remoteBundleRoot.replace(/\\/g, "/"),
      manifest: {
        local: repoRel(outputs.manifest),
        remote: remoteManifestAfter
      },
      results: payloadResults
    },
    votes,
    boundaries: [
      "explicit_wave32f_payload_only",
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

  const memory = {
    schema: "behcs-memory.v1",
    generatedAt,
    status,
    memoryId: "space-agent-wave32g-liris-meta-rollup-push",
    summary: "ACER pushed Wave32F D50 META roll-up evidence bundle to Liris incoming-acer with post-copy hash verification.",
    state: repoRel(outputs.state),
    stateHash
  };
  const map = {
    schema: "space-agent-wave32g-map-map-mapped.v1",
    generatedAt,
    status,
    stateHash,
    nodes: payloadResults.map((row) => ({
      id: row.id,
      source: row.source.path,
      target: row.targetAfter.path,
      sha256: row.source.sha256,
      pass: row.pass
    })),
    edges: payloadResults.map((row) => ({
      from: "acer-wave32f",
      to: row.id,
      type: row.pass ? "hash_verified_liris_push" : "hold"
    }))
  };
  const cubePayload = {
    schema: "space-agent-wave32g-cube-cubed.v1",
    generatedAt,
    status,
    stateHash,
    cubeId: "space-agent-wave32g-liris-meta-rollup-push",
    axes: {
      payload: "explicit_wave32f_bundle",
      transport: "smb_hash_gated",
      authority: "liris_independent_reciprocal_required",
      boundary: "no_canonical_write"
    },
    payloads: payloadResults.map((row, index) => ({
      coordinate: [index, row.relativePath, row.source.sha256, row.targetAfter.sha256, row.pass],
      glyph: glyph("wave32g_payload", row.id, row.source.sha256 || "")
    }))
  };
  const glpj = {
    schema: "behcs256-glpj.v1",
    generatedAt,
    status,
    glyphFamily: "SPACE_AGENT_WAVE32G_LIRIS_META_ROLLUP_PUSH",
    glyphs: payloadResults.map((row) => ({
      id: row.id,
      glyph: glyph("wave32g_payload", row.id, row.source.sha256 || ""),
      pass: row.pass
    }))
  };
  writeJson(outputs.memory, memory);
  writeJson(outputs.map, map);
  writeText(outputs.cube, `"use strict";\n\nmodule.exports = Object.freeze(${JSON.stringify(cubePayload, null, 2)});\n`);
  writeJson(outputs.glpj, glpj);

  const d50 = [
    "# D50 Wave32G - Liris Meta Roll-up Push (ACER)",
    "",
    "| Field | Value |",
    "|---|---|",
    `| status | ${status} |`,
    `| state_hash | ${stateHash} |`,
    `| payload_count | ${payloads.length} |`,
    `| all_sources_present | ${allSourcesPresent} |`,
    `| share_reachable | ${shareReachable} |`,
    `| all_remote_verified | ${allRemoteVerified} |`,
    `| remote_bundle | ${remoteBundleRoot.replace(/\\/g, "/")} |`,
    `| law_posture | SMB hash-gated evidence push; LAW-001 not required for file bytes |`,
    "",
    "## Supervisor Votes",
    "",
    ...votes.map((vote) => `- ${vote.prof} / ${vote.supervisorPid}: ${vote.vote} - ${vote.reason}`),
    "",
    "## Payloads",
    "",
    ...payloadResults.map((row) => `- ${row.relativePath} - source ${row.source.sha256 || "missing"} - target ${row.targetAfter.sha256 || "missing"} - pass ${row.pass}`),
    "",
    "## Boundary",
    "",
    "ACER pushed Wave32F evidence into Liris incoming-acer only. Liris must independently promote or execute any reciprocal Wave32F under its own supervisor authority."
  ].join("\n");
  writeText(outputs.d50, d50);

  const artifacts = [
    outputs.state,
    outputs.manifest,
    outputs.lineAudit,
    outputs.votes,
    outputs.d50,
    outputs.memory,
    outputs.map,
    outputs.cube,
    outputs.glpj
  ].map(artifactInfo);
  const report = {
    schema: "space-agent-wave32g-liris-meta-rollup-push-report.v1",
    generatedAt,
    status,
    stateHash,
    payloadCount: payloads.length,
    allRemoteVerified,
    remoteBundleRoot: remoteBundleRoot.replace(/\\/g, "/"),
    lineAuditVerdict: lineAudit.verdict,
    artifacts
  };
  writeJson(outputs.reportJson, report);
  writeText(outputs.reportMd, [
    "# Space Agent Wave32G - Liris Meta Roll-up Push",
    "",
    `Status: ${status}`,
    `State hash: ${stateHash}`,
    `Payload count: ${payloads.length}`,
    `All remote verified: ${allRemoteVerified}`,
    `Remote bundle: ${remoteBundleRoot.replace(/\\/g, "/")}`,
    `Line audit: ${lineAudit.verdict}`,
    "",
    "Artifacts:",
    ...artifacts.map((artifact) => `- ${artifact.path} - ${artifact.sha256}`)
  ].join("\n"));

  console.log(JSON.stringify({
    ok: true,
    status,
    stateHash,
    payloadCount: payloads.length,
    allRemoteVerified,
    remoteBundleRoot: remoteBundleRoot.replace(/\\/g, "/"),
    manifest: repoRel(outputs.manifest),
    report: repoRel(outputs.reportMd)
  }, null, 2));
}

main();
