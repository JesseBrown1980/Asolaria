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
const remoteBundleRoot = path.join(
  lirisShareRoot,
  "data",
  "behcs",
  "orchestration",
  "federation-reintegration-20260427",
  "incoming-acer",
  "wave32c-space-agent-reinvention-reciprocity-push"
);

// Promote only the operator-approved execution + surface lane.
// Skip ACER candidate packet, ACER v6 vote, and ACER state file so Liris can run an independent reciprocal vote.
const PROMOTION_PAYLOADS = Object.freeze([
  {
    id: "wave32b-executor",
    relativePath: "tools/behcs/space-agent-wave32b-native-space-reinvention.js",
    class: "liris-local-executor"
  },
  {
    id: "research-puts",
    relativePath: "data/behcs/orchestration/space-agent-intake-20260428/space-reinvent-research-puts.ndjson",
    class: "behcs-surface"
  },
  {
    id: "memory",
    relativePath: "data/behcs/memory/asolaria-native-space-rooms-reinvention.v1.json",
    class: "behcs-surface"
  },
  {
    id: "index",
    relativePath: "data/behcs/index/asolaria-native-space-rooms-reinvention-index.v1.json",
    class: "behcs-surface"
  },
  {
    id: "map",
    relativePath: "data/behcs/maps/asolaria/asolaria-native-space-rooms-reinvention-map-map-mapped.v1.json",
    class: "behcs-surface"
  },
  {
    id: "cube",
    relativePath: "data/behcs/cubes/asolaria-native-space-rooms-reinvention-cube-cubed.cube.js",
    class: "behcs-surface"
  },
  {
    id: "glpj",
    relativePath: "data/behcs/codex/glyph-language/asolaria-native-space-rooms-reinvention-behcs256.glpj.json",
    class: "behcs-surface"
  },
  {
    id: "whiteroom",
    relativePath: "data/behcs/omniwhite-room/asolaria-native-space-rooms-reinvention-whiteroom.v1.json",
    class: "behcs-surface"
  },
  {
    id: "gc",
    relativePath: "data/behcs/garbage-collector/asolaria-native-space-rooms-reinvention-retention.v1.json",
    class: "behcs-surface"
  },
  {
    id: "crypto-seal",
    relativePath: "data/behcs/crypto/asolaria-native-space-rooms-reinvention-crypto-seal.v1.json",
    class: "behcs-surface"
  },
  {
    id: "d50",
    relativePath: "data/agent-index/council/D50-WAVE32B-ASOLARIA-NATIVE-SPACE-ROOMS-REINVENTION-ACER-2026-04-28.md",
    class: "d50-evidence"
  },
  {
    id: "report-json",
    relativePath: "reports/asolaria-native-space-rooms-reinvention-latest.json",
    class: "report"
  },
  {
    id: "report-md",
    relativePath: "reports/asolaria-native-space-rooms-reinvention-latest.md",
    class: "report"
  }
]);

const OUTPUTS = Object.freeze({
  state: path.join(runRoot, "wave32d-authorized-liris-promotion-acer.v1.json"),
  manifest: path.join(runRoot, "wave32d-authorized-liris-promotion-manifest.json"),
  votes: path.join(runRoot, "wave32d-authorized-liris-promotion-votes.ndjson"),
  d50: path.join(councilRoot, "D50-WAVE32D-AUTHORIZED-LIRIS-PROMOTION-ACER-2026-04-28.md"),
  memory: path.join(memoryRoot, "space-agent-wave32d-authorized-liris-promotion.v1.json"),
  map: path.join(mapsRoot, "space-agent-wave32d-authorized-liris-promotion-map-map-mapped.v1.json"),
  cube: path.join(cubesRoot, "space-agent-wave32d-authorized-liris-promotion-cube-cubed.cube.js"),
  glpj: path.join(glpjRoot, "space-agent-wave32d-authorized-liris-promotion-behcs256.glpj.json"),
  reportJson: path.join(reportsRoot, "space-agent-wave32d-authorized-liris-promotion-latest.json"),
  reportMd: path.join(reportsRoot, "space-agent-wave32d-authorized-liris-promotion-latest.md")
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

function artifactInfo(filePath) {
  const info = inspectAbsolute(filePath);
  return { ...info, path: repoRel(filePath) };
}

function glyph(kind, id, seed = "") {
  const hash = sha256Text(`${kind}:${id}:${seed}`);
  return `HG256:${kind.toUpperCase()}:${hash.slice(0, 8).toUpperCase()}:${behcs.hilbertAddress(hash)}`;
}

function sourcePathFor(relativePath) {
  return path.join(remoteBundleRoot, relativePath.replace(/\//g, path.sep));
}

function targetPathFor(relativePath) {
  return path.join(lirisShareRoot, relativePath.replace(/\//g, path.sep));
}

function promoteOne(payload) {
  const sourcePath = sourcePathFor(payload.relativePath);
  const targetPath = targetPathFor(payload.relativePath);
  const source = inspectAbsolute(sourcePath);
  const targetBefore = inspectAbsolute(targetPath);
  const targetSafe = !targetBefore.present || targetBefore.sha256 === source.sha256;
  let action = "HOLD";
  let error = null;
  if (!source.present) {
    action = "HOLD_SOURCE_MISSING";
  } else if (!targetSafe) {
    action = "HOLD_TARGET_DIVERGENT";
  } else {
    try {
      ensureParent(targetPath);
      fs.copyFileSync(sourcePath, targetPath);
      action = targetBefore.present ? "CONFIRMED_IDENTICAL_TARGET" : "PROMOTED_ABSENT_TARGET";
    } catch (err) {
      error = err.message;
      action = "HOLD_COPY_ERROR";
    }
  }
  const targetAfter = inspectAbsolute(targetPath);
  const pass = source.present && targetAfter.present && targetAfter.sha256 === source.sha256;
  return {
    ...payload,
    source,
    targetBefore,
    targetSafe,
    action,
    error,
    targetAfter,
    pass
  };
}

function buildVotes(status, allPass, anyDivergent) {
  return [
    {
      prof: "PROF-HOOKWALL",
      supervisorPid: "BH.SUPERVISOR.PID.SPACE.HOOKWALL.WAVE32D.ACER",
      vote: anyDivergent ? "HOLD_DIVERGENT_TARGET" : "APPROVE_HASH_GATED_PROMOTION",
      reason: "Operator authorized promotion; overwrite remains forbidden unless target is absent or byte-identical."
    },
    {
      prof: "PROF-COMMS",
      supervisorPid: "BH.SUPERVISOR.PID.SPACE.COMMS.WAVE32D.ACER",
      vote: allPass ? "LIRIS_PROMOTION_VISIBLE_HASH_VERIFIED" : "HOLD_LIRIS_PROMOTION_VERIFY",
      reason: "Promotion closes only after rereading canonical Liris targets over SMB."
    },
    {
      prof: "PROF-KERNEL",
      supervisorPid: "BH.SUPERVISOR.PID.SPACE.KERNEL.WAVE32D.ACER",
      vote: "SKIP_ACER_CANDIDATE_VOTE_STATE_FOR_LIRIS_INDEPENDENCE",
      reason: "ACER candidate packet, v6 vote, and state file remain incoming evidence; Liris must generate its own reciprocal run."
    },
    {
      prof: "PROF-WHITEROOM",
      supervisorPid: "BH.SUPERVISOR.PID.SPACE.WHITEROOM.WAVE32D.ACER",
      vote: "PROMOTION_NOT_RATIFICATION",
      reason: "This only prepares Liris to run; D50 META roll-up is still separate."
    },
    {
      prof: "COL-ASOLARIA",
      supervisorPid: "BH.SUPERVISOR.PID.SPACE.ASOLARIA.APEX.WAVE32D.ACER",
      vote: status,
      reason: "Operator authorization recorded; ACER performed bounded, hash-gated Liris share promotion."
    }
  ];
}

function main() {
  const promotionResults = PROMOTION_PAYLOADS.map(promoteOne);
  const allPass = promotionResults.every((row) => row.pass);
  const anyDivergent = promotionResults.some((row) => row.action === "HOLD_TARGET_DIVERGENT");
  const anyMissingSource = promotionResults.some((row) => row.action === "HOLD_SOURCE_MISSING");
  const status = anyMissingSource
    ? "HOLD_MISSING_INCOMING_SOURCE"
    : anyDivergent
      ? "HOLD_DIVERGENT_LIRIS_CANONICAL_TARGET"
      : allPass
        ? "AUTHORIZED_LIRIS_WAVE32B_PROMOTION_HASH_VERIFIED"
        : "HOLD_LIRIS_PROMOTION_INCOMPLETE";

  const skipped = [
    "data/behcs/orchestration/space-agent-intake-20260428/asolaria-native-space-rooms-wave32b-v6-candidate-packet.json",
    "data/votes/V6-ASOLARIA-NATIVE-SPACE-ROOMS-REINVENTION-20260428/behcs-v6-candidate-file.json",
    "data/behcs/orchestration/space-agent-intake-20260428/space-reinvent-wave32b-native-space-rooms.v1.json"
  ];
  const votes = buildVotes(status, allPass, anyDivergent);
  writeNdjson(OUTPUTS.votes, votes);

  const manifest = {
    schema: "space-agent-wave32d-authorized-liris-promotion-manifest.v1",
    generatedAt,
    status,
    authorization: "OPERATOR_GRANTED",
    sourceHost: os.hostname(),
    lirisShareRoot,
    remoteBundleRoot: remoteBundleRoot.replace(/\\/g, "/"),
    promotedPayloads: promotionResults.map((row) => ({
      id: row.id,
      class: row.class,
      relativePath: row.relativePath,
      sourceSha256: row.source.sha256,
      targetBeforeSha256: row.targetBefore.sha256,
      targetAfterSha256: row.targetAfter.sha256,
      action: row.action,
      pass: row.pass,
      error: row.error
    })),
    skippedForLirisIndependentRun: skipped
  };
  writeJson(OUTPUTS.manifest, manifest);

  const stateBase = {
    schema: "space-agent-wave32d-authorized-liris-promotion.v1",
    generatedAt,
    status,
    authorization: {
      source: "operator message",
      text: "authorization by operator granted",
      interpretedScope: "Promote Wave32B executor plus 12 surface artifacts from Liris incoming-acer to Liris canonical paths only when absent or byte-identical."
    },
    sourceHost: os.hostname(),
    lirisShareRoot,
    remoteBundleRoot: remoteBundleRoot.replace(/\\/g, "/"),
    notRatification: true,
    lirisIndependentRunStillRequired: true,
    allPass,
    anyDivergent,
    anyMissingSource,
    promotedCount: promotionResults.filter((row) => row.pass).length,
    skippedForIndependence: skipped,
    results: promotionResults,
    votes,
    boundaries: [
      "operator_authorized",
      "hash_gated_only",
      "target_absent_or_identical_only",
      "no_divergent_overwrite",
      "no_hidden_bulk_copy",
      "no_secret_copy",
      "no_remote_execution",
      "no_space_agent_clone",
      "no_install",
      "no_ratification"
    ]
  };
  const state = { ...stateBase, stateHash: sha256Text(JSON.stringify(stateBase)) };
  writeJson(OUTPUTS.state, state);

  const memory = {
    schema: "behcs-memory.v1",
    generatedAt,
    status,
    memoryId: "space-agent-wave32d-authorized-liris-promotion",
    summary: "Operator authorized hash-gated promotion of Wave32B executor and surface artifacts into Liris canonical paths. ACER skipped ACER vote/state artifacts so Liris can run independent reciprocal Wave32B.",
    state: repoRel(OUTPUTS.state),
    stateHash: state.stateHash
  };
  const map = {
    schema: "space-agent-wave32d-map-map-mapped.v1",
    generatedAt,
    status,
    nodes: promotionResults.map((row) => ({ id: row.id, relativePath: row.relativePath, action: row.action, pass: row.pass })),
    edges: promotionResults.map((row) => ({ from: "liris-incoming-acer", to: row.relativePath, type: row.pass ? "hash_gated_promoted" : "hold" }))
  };
  const cube = {
    schema: "space-agent-wave32d-cube-cube-cubed.v1",
    generatedAt,
    status: "CUBE_CUBE_CUBED",
    cubeId: "space-agent-wave32d-authorized-liris-promotion",
    axes: ["authorization", "source", "target", "hash", "independence", "hold"],
    payloads: promotionResults.map((row, index) => ({
      id: row.id,
      coordinate: [index, row.source.lines, row.source.bytes, row.action, row.source.sha256, row.targetAfter.sha256],
      glyph: glyph("wave32d_promotion", row.id, row.source.sha256 || "")
    }))
  };
  const glpj = {
    schema: "behcs256-glpj.v1",
    generatedAt,
    status: "GLYPH_LANGUAGE_PACKET_MINTED",
    glyphs: promotionResults.map((row) => ({
      id: row.id,
      glyph: glyph("wave32d_promotion", row.id, row.source.sha256 || ""),
      pass: row.pass
    }))
  };
  writeJson(OUTPUTS.memory, memory);
  writeJson(OUTPUTS.map, map);
  writeText(OUTPUTS.cube, `"use strict";\n\nmodule.exports = Object.freeze(${JSON.stringify(cube, null, 2)});\n`);
  writeJson(OUTPUTS.glpj, glpj);

  const d50 = [
    "# D50 Wave 32D - Authorized Liris Promotion (ACER)",
    "",
    "| Field | Value |",
    "|---|---|",
    `| status | ${status} |`,
    `| state_hash | ${state.stateHash} |`,
    "| authorization | operator granted |",
    `| promoted_count | ${promotionResults.filter((row) => row.pass).length} / ${PROMOTION_PAYLOADS.length} |`,
    `| liris_independent_run_still_required | true |`,
    "",
    "## Promotion Results",
    "",
    ...promotionResults.map((row) => `- ${row.id}: ${row.action}; pass=${row.pass}; sha=${row.targetAfter.sha256 || "missing"}`),
    "",
    "## Skipped for Liris Independence",
    "",
    ...skipped.map((item) => `- ${item}`),
    "",
    "## Boundary",
    "",
    "This is operator-authorized file promotion over the Liris share. It is not Liris execution and not D50 META ratification. Liris must still run the reciprocal Wave32B locally."
  ].join("\n");
  writeText(OUTPUTS.d50, d50);

  const artifacts = [
    OUTPUTS.state,
    OUTPUTS.manifest,
    OUTPUTS.votes,
    OUTPUTS.d50,
    OUTPUTS.memory,
    OUTPUTS.map,
    OUTPUTS.cube,
    OUTPUTS.glpj
  ].map(artifactInfo);
  const report = {
    schema: "space-agent-wave32d-authorized-liris-promotion-report.v1",
    generatedAt,
    status,
    stateHash: state.stateHash,
    promotedCount: promotionResults.filter((row) => row.pass).length,
    total: PROMOTION_PAYLOADS.length,
    lirisIndependentRunStillRequired: true,
    artifacts
  };
  writeJson(OUTPUTS.reportJson, report);
  writeText(OUTPUTS.reportMd, [
    "# Space Agent Wave32D - Authorized Liris Promotion",
    "",
    `Status: ${status}`,
    `State hash: ${state.stateHash}`,
    `Promoted: ${promotionResults.filter((row) => row.pass).length} / ${PROMOTION_PAYLOADS.length}`,
    "Liris independent run still required: true",
    "",
    "Artifacts:",
    ...artifacts.map((artifact) => `- ${artifact.path} - ${artifact.sha256}`)
  ].join("\n"));

  console.log(JSON.stringify({
    ok: true,
    status,
    stateHash: state.stateHash,
    promotedCount: promotionResults.filter((row) => row.pass).length,
    total: PROMOTION_PAYLOADS.length,
    anyDivergent,
    anyMissingSource,
    lirisIndependentRunStillRequired: true,
    manifest: repoRel(OUTPUTS.manifest),
    report: repoRel(OUTPUTS.reportMd)
  }, null, 2));
}

main();
