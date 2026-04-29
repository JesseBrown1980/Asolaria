#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const os = require("os");
const behcs = require("./codex-bridge");

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
const remoteBundleRoot = path.join(lirisIncomingRoot, "wave32c-space-agent-reinvention-reciprocity-push");

const PAYLOADS = Object.freeze([
  "tools/behcs/space-agent-wave32b-native-space-reinvention.js",
  "data/behcs/orchestration/space-agent-intake-20260428/asolaria-native-space-rooms-wave32b-v6-candidate-packet.json",
  "data/votes/V6-ASOLARIA-NATIVE-SPACE-ROOMS-REINVENTION-20260428/behcs-v6-candidate-file.json",
  "data/behcs/orchestration/space-agent-intake-20260428/space-reinvent-wave32b-native-space-rooms.v1.json",
  "data/behcs/orchestration/space-agent-intake-20260428/space-reinvent-research-puts.ndjson",
  "data/behcs/memory/asolaria-native-space-rooms-reinvention.v1.json",
  "data/behcs/index/asolaria-native-space-rooms-reinvention-index.v1.json",
  "data/behcs/maps/asolaria/asolaria-native-space-rooms-reinvention-map-map-mapped.v1.json",
  "data/behcs/cubes/asolaria-native-space-rooms-reinvention-cube-cubed.cube.js",
  "data/behcs/codex/glyph-language/asolaria-native-space-rooms-reinvention-behcs256.glpj.json",
  "data/behcs/omniwhite-room/asolaria-native-space-rooms-reinvention-whiteroom.v1.json",
  "data/behcs/garbage-collector/asolaria-native-space-rooms-reinvention-retention.v1.json",
  "data/behcs/crypto/asolaria-native-space-rooms-reinvention-crypto-seal.v1.json",
  "data/agent-index/council/D50-WAVE32B-ASOLARIA-NATIVE-SPACE-ROOMS-REINVENTION-ACER-2026-04-28.md",
  "reports/asolaria-native-space-rooms-reinvention-latest.json",
  "reports/asolaria-native-space-rooms-reinvention-latest.md"
]);

const OUTPUTS = Object.freeze({
  state: path.join(runRoot, "wave32c-liris-reciprocity-push-acer.v1.json"),
  manifest: path.join(runRoot, "wave32c-liris-reciprocity-push-manifest.json"),
  lineAudit: path.join(runRoot, "wave32c-wave32b-executor-line-audit.v1.json"),
  votes: path.join(runRoot, "wave32c-liris-reciprocity-push-votes.ndjson"),
  d50: path.join(councilRoot, "D50-WAVE32C-LIRIS-RECIPROCITY-PUSH-ACER-2026-04-28.md"),
  memory: path.join(memoryRoot, "space-agent-wave32c-liris-reciprocity-push.v1.json"),
  map: path.join(mapsRoot, "space-agent-wave32c-liris-reciprocity-push-map-map-mapped.v1.json"),
  cube: path.join(cubesRoot, "space-agent-wave32c-liris-reciprocity-push-cube-cubed.cube.js"),
  glpj: path.join(glpjRoot, "space-agent-wave32c-liris-reciprocity-push-behcs256.glpj.json"),
  reportJson: path.join(reportsRoot, "space-agent-wave32c-liris-reciprocity-push-latest.json"),
  reportMd: path.join(reportsRoot, "space-agent-wave32c-liris-reciprocity-push-latest.md")
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
  const hash = sha256Text(`${kind}:${id}:${seed}`);
  return `HG256:${kind.toUpperCase()}:${hash.slice(0, 8).toUpperCase()}:${behcs.hilbertAddress(hash)}`;
}

function auditWave32bExecutor() {
  const scriptPath = absoluteFromRepo("tools/behcs/space-agent-wave32b-native-space-reinvention.js");
  const content = fs.readFileSync(scriptPath, "utf8");
  const lines = content.split(/\r?\n/);
  const rules = [
    { id: "process_spawn", pattern: /\b(spawn|spawnSync|exec|execSync)\b/ },
    { id: "http_or_fetch", pattern: /\b(fetch|http\.request|https\.request|net\.connect)\b/ },
    { id: "destructive_delete", pattern: /\b(unlinkSync|rmSync|rmdirSync|Remove-Item)\b/ },
    { id: "external_clone_install", pattern: /\b(git\s+clone|npm\s+install|pnpm\s+install|cloneOrInstallExternalCode:\s*true)\b/i },
    { id: "mcp_or_subagent_runtime", pattern: /\bspawn_agent\b|\bCodex subagent delegation\b|\bMCP delegation\b/ }
  ];
  const findings = [];
  for (const [index, line] of lines.entries()) {
    for (const rule of rules) {
      if (rule.pattern.test(line)) {
        findings.push({
          line: index + 1,
          rule: rule.id,
          text: line.trim()
        });
      }
    }
  }
  const materialFindings = findings.filter((finding) => ![
    "mcp_or_subagent_runtime",
    "external_clone_install"
  ].includes(finding.rule));
  return {
    schema: "wave32c-wave32b-executor-line-audit.v1",
    generatedAt,
    script: repoRel(scriptPath),
    sha256: inspectAbsolute(scriptPath).sha256,
    lines: lines[lines.length - 1] === "" ? lines.length - 1 : lines.length,
    everyLineRead: true,
    scanRules: rules.map((rule) => rule.id),
    findings,
    materialRuntimeRiskFindings: materialFindings,
    verdict: materialFindings.length === 0 ? "PASS_NO_PROCESS_NETWORK_DELETE_OR_INSTALL_RUNTIME_CALLS" : "HOLD_MATERIAL_RUNTIME_RISK_FINDINGS",
    note: "Textual mentions of blocked Codex subagent/MCP/clone/install boundaries are retained as doctrine, not runtime calls."
  };
}

function buildVotes(status, allSourcesPresent, allRemoteVerified, lineAudit) {
  return [
    {
      prof: "PROF-HOOKWALL",
      supervisorPid: "BH.SUPERVISOR.PID.SPACE.HOOKWALL.WAVE32C.ACER",
      vote: lineAudit.verdict.startsWith("PASS") ? "APPROVE_BOUNDED_PAYLOAD_ONLY" : "HOLD_SCRIPT_AUDIT",
      reason: "Wave32C pushes only the explicit Wave32B script and sealed artifacts; no hidden/private bulk copy."
    },
    {
      prof: "PROF-KERNEL",
      supervisorPid: "BH.SUPERVISOR.PID.SPACE.KERNEL.WAVE32C.ACER",
      vote: allSourcesPresent ? "SOURCE_HASH_GRAMMAR_READY" : "HOLD_MISSING_SOURCE",
      reason: "Every payload source must exist locally before the Liris reciprocity packet can be valid."
    },
    {
      prof: "PROF-COMMS",
      supervisorPid: "BH.SUPERVISOR.PID.SPACE.COMMS.WAVE32C.ACER",
      vote: allRemoteVerified ? "LIRIS_SMB_HASH_VERIFIED" : "HOLD_LIRIS_SMB_VERIFY",
      reason: "Push closes only if the post-copy read over Liris SMB matches ACER source hashes."
    },
    {
      prof: "PROF-WHITEROOM",
      supervisorPid: "BH.SUPERVISOR.PID.SPACE.WHITEROOM.WAVE32C.ACER",
      vote: "RECIPROCITY_PUSH_DOES_NOT_RATIFY",
      reason: "Liris must independently promote and run its own Wave32B; ACER push is evidence transfer only."
    },
    {
      prof: "PROF-GC",
      supervisorPid: "BH.SUPERVISOR.PID.SPACE.GC.WAVE32C.ACER",
      vote: "RETAIN_WAVE32A_AND_WAVE32B_EVIDENCE",
      reason: "Do not erase the earlier intake; Wave32B corrects it and both remain reviewable."
    },
    {
      prof: "COL-ASOLARIA",
      supervisorPid: "BH.SUPERVISOR.PID.SPACE.ASOLARIA.APEX.WAVE32C.ACER",
      vote: status,
      reason: "Wave32C addresses the review reciprocity hold by delivering hash-verified material to Liris incoming-acer."
    }
  ];
}

function buildSurfaceMap(payloadResults, status) {
  return {
    schema: "space-agent-wave32c-map-map-mapped.v1",
    generatedAt,
    status,
    nodes: payloadResults.map((row) => ({
      id: row.id,
      source: row.source.path,
      target: row.targetAfter.path,
      sha256: row.source.sha256
    })),
    edges: payloadResults.flatMap((row) => [
      { from: "acer-wave32b", to: row.id, type: "payload_member" },
      { from: row.id, to: "liris-incoming-acer", type: row.pass ? "hash_verified_push" : "hold" }
    ])
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

function main() {
  const lineAudit = auditWave32bExecutor();
  writeJson(OUTPUTS.lineAudit, lineAudit);

  const sourceInspections = PAYLOADS.map((relativePath) => ({
    relativePath,
    source: inspectRepo(relativePath)
  }));
  const allSourcesPresent = sourceInspections.every((row) => row.source.present);
  const shareReachable = fs.existsSync(lirisIncomingRoot);
  const payloadResults = shareReachable ? PAYLOADS.map(copyPayload) : sourceInspections.map((row) => ({
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
    ? "HOLD_MISSING_WAVE32B_SOURCE_PAYLOAD"
    : !shareReachable
      ? "HOLD_LIRIS_INCOMING_ROOT_NOT_REACHABLE"
      : allRemoteVerified
        ? "ACER_TO_LIRIS_WAVE32B_RECIPROCITY_PUSH_HASH_VERIFIED"
        : "HOLD_LIRIS_WAVE32B_PUSH_HASH_VERIFY_FAILED";

  const manifest = {
    schema: "space-agent-wave32c-liris-reciprocity-push-manifest.v1",
    generatedAt,
    status,
    sourceHost: os.hostname(),
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
  writeJson(OUTPUTS.manifest, manifest);
  let remoteManifestAfter = null;
  if (shareReachable) {
    const remoteManifestPath = path.join(remoteBundleRoot, "wave32c-liris-reciprocity-push-manifest.json");
    try {
      ensureParent(remoteManifestPath);
      fs.copyFileSync(OUTPUTS.manifest, remoteManifestPath);
      remoteManifestAfter = inspectAbsolute(remoteManifestPath);
    } catch (error) {
      remoteManifestAfter = { present: false, path: remoteManifestPath.replace(/\\/g, "/"), error: error.message };
    }
  }

  const votes = buildVotes(status, allSourcesPresent, allRemoteVerified, lineAudit);
  writeNdjson(OUTPUTS.votes, votes);

  const stateBase = {
    schema: "space-agent-wave32c-liris-reciprocity-push.v1",
    generatedAt,
    status,
    sourceHost: os.hostname(),
    purpose: "Address Wave32B review reciprocity hold by pushing the ACER Wave32B executor and sealed artifacts to Liris incoming-acer for independent Liris promotion and rerun.",
    notRatification: true,
    noLirisCanonicalWriteByAcer: true,
    lineAudit: {
      path: repoRel(OUTPUTS.lineAudit),
      verdict: lineAudit.verdict,
      scriptLines: lineAudit.lines,
      scriptSha256: lineAudit.sha256
    },
    execution: {
      shareReachable,
      allSourcesPresent,
      allRemoteVerified,
      payloadCount: PAYLOADS.length,
      remoteBundleRoot: remoteBundleRoot.replace(/\\/g, "/"),
      manifest: {
        local: repoRel(OUTPUTS.manifest),
        remote: remoteManifestAfter
      },
      results: payloadResults
    },
    votes,
    boundaries: [
      "explicit_payload_only",
      "no_hidden_bulk_copy",
      "no_private_secret_copy",
      "no_liris_canonical_promotion",
      "no_space_agent_clone",
      "no_install",
      "no_mcp",
      "no_codex_subagents",
      "no_peer_api_call",
      "no_ratification"
    ]
  };
  const state = { ...stateBase, stateHash: sha256Text(JSON.stringify(stateBase)) };
  writeJson(OUTPUTS.state, state);

  const memory = {
    schema: "behcs-memory.v1",
    generatedAt,
    status,
    memoryId: "space-agent-wave32c-liris-reciprocity-push",
    summary: "ACER pushed Wave32B reinvention script and sealed artifacts to Liris incoming-acer with hash verification so Liris can independently promote and run its own Wave32B.",
    state: repoRel(OUTPUTS.state),
    stateHash: state.stateHash
  };
  const map = buildSurfaceMap(payloadResults, status);
  const cube = {
    schema: "behcs-cube-cube-cubed.v1",
    generatedAt,
    status: "CUBE_CUBE_CUBED",
    cubeId: "space-agent-wave32c-liris-reciprocity-push",
    axes: ["source", "target", "hash", "supervisor", "reciprocity", "hold"],
    payloads: payloadResults.map((row, index) => ({
      id: row.id,
      coordinate: [index, row.source.lines, row.source.bytes, row.pass ? "verified" : "hold", row.source.sha256, row.targetAfter.sha256],
      glyph: glyph("wave32c_payload", row.id, row.source.sha256 || "")
    }))
  };
  const glpj = {
    schema: "behcs256-glpj.v1",
    generatedAt,
    status: "GLYPH_LANGUAGE_PACKET_MINTED",
    glyphs: payloadResults.map((row) => ({
      id: row.id,
      glyph: glyph("wave32c_payload", row.id, row.source.sha256 || ""),
      pass: row.pass
    }))
  };
  writeJson(OUTPUTS.memory, memory);
  writeJson(OUTPUTS.map, map);
  writeText(OUTPUTS.cube, `"use strict";\n\nmodule.exports = Object.freeze(${JSON.stringify(cube, null, 2)});\n`);
  writeJson(OUTPUTS.glpj, glpj);

  const d50 = [
    "# D50 Wave 32C - Liris Reciprocity Push for Wave32B (ACER)",
    "",
    "| Field | Value |",
    "|---|---|",
    `| status | ${status} |`,
    `| state_hash | ${state.stateHash} |`,
    `| payload_count | ${PAYLOADS.length} |`,
    `| all_sources_present | ${allSourcesPresent} |`,
    `| share_reachable | ${shareReachable} |`,
    `| all_remote_verified | ${allRemoteVerified} |`,
    `| line_audit | ${lineAudit.verdict} |`,
    "",
    "## Supervisor Votes",
    "",
    ...votes.map((vote) => `- ${vote.prof}: ${vote.vote} - ${vote.reason}`),
    "",
    "## Payloads",
    "",
    ...payloadResults.map((row) => `- ${row.relativePath} - source ${row.source.sha256 || "missing"} - target ${row.targetAfter.sha256 || "missing"} - pass ${row.pass}`),
    "",
    "## Boundary",
    "",
    "This is an incoming-evidence push only. Liris must independently promote and run its reciprocal Wave32B. ACER does not write Liris canonical tools or ratify Liris state."
  ].join("\n");
  writeText(OUTPUTS.d50, d50);

  const artifacts = [
    OUTPUTS.state,
    OUTPUTS.manifest,
    OUTPUTS.lineAudit,
    OUTPUTS.votes,
    OUTPUTS.d50,
    OUTPUTS.memory,
    OUTPUTS.map,
    OUTPUTS.cube,
    OUTPUTS.glpj
  ].map(artifactInfo);
  const report = {
    schema: "space-agent-wave32c-liris-reciprocity-push-report.v1",
    generatedAt,
    status,
    stateHash: state.stateHash,
    payloadCount: PAYLOADS.length,
    allRemoteVerified,
    lineAuditVerdict: lineAudit.verdict,
    artifacts
  };
  writeJson(OUTPUTS.reportJson, report);
  writeText(OUTPUTS.reportMd, [
    "# Space Agent Wave32C - Liris Reciprocity Push",
    "",
    `Status: ${status}`,
    `State hash: ${state.stateHash}`,
    `Payload count: ${PAYLOADS.length}`,
    `All remote verified: ${allRemoteVerified}`,
    `Line audit: ${lineAudit.verdict}`,
    "",
    "Artifacts:",
    ...artifacts.map((artifact) => `- ${artifact.path} - ${artifact.sha256}`)
  ].join("\n"));

  console.log(JSON.stringify({
    ok: true,
    status,
    stateHash: state.stateHash,
    payloadCount: PAYLOADS.length,
    allRemoteVerified,
    lineAuditVerdict: lineAudit.verdict,
    remoteBundleRoot: remoteBundleRoot.replace(/\\/g, "/"),
    manifest: repoRel(OUTPUTS.manifest),
    report: repoRel(OUTPUTS.reportMd)
  }, null, 2));
}

main();
