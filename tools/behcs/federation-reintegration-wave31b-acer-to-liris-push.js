#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const os = require("os");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427");
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
const lirisBundleRoot = path.join(lirisIncomingRoot, "wave31b-acer-to-liris-push");

const PAYLOADS = Object.freeze([
  {
    id: "acer-d11-drift-addendum",
    class: "required-liris-verifier-input",
    source: "data/agent-index/D11-AUDIT-LEDGER-ADDENDUM-LIRIS-TIMESTAMP-DRIFT-2026-04-27.md",
    target: path.join(lirisIncomingRoot, "acer-d11-drift-addendum.raw.md")
  },
  {
    id: "acer-wave21a-summary",
    class: "required-liris-verifier-input",
    source: "data/behcs/orchestration/federation-reintegration-20260427/wave21a-draft-only-acer-reply-envelope.v1.json",
    target: path.join(lirisIncomingRoot, "acer-wave21a-summary.raw.json")
  },
  {
    id: "acer-wave31a-supervisor-decision",
    class: "g1-proof-bundle",
    source: "data/behcs/orchestration/federation-reintegration-20260427/wave31a-behcs256-supervisor-decision-acer.v1.json",
    target: path.join(lirisBundleRoot, "acer-wave31a-behcs256-supervisor-decision.raw.json")
  },
  {
    id: "acer-wave30e-canonical-mirror",
    class: "g1-proof-bundle",
    source: "data/behcs/orchestration/federation-reintegration-20260427/wave30e-g1-canonical-mirror-acer.v1.json",
    target: path.join(lirisBundleRoot, "acer-wave30e-g1-canonical-mirror.raw.json")
  },
  {
    id: "acer-wave30f-postmirror-closeout",
    class: "g1-proof-bundle",
    source: "data/behcs/orchestration/federation-reintegration-20260427/wave30f-g1-postmirror-closeout-acer.v1.json",
    target: path.join(lirisBundleRoot, "acer-wave30f-g1-postmirror-closeout.raw.json")
  },
  {
    id: "acer-wave30f-d50-closeout",
    class: "g1-proof-bundle",
    source: "data/agent-index/council/D50-WAVE30F-G1-POSTMIRROR-CLOSEOUT-ACER-2026-04-28.md",
    target: path.join(lirisBundleRoot, "D50-WAVE30F-G1-POSTMIRROR-CLOSEOUT-ACER-2026-04-28.md")
  }
]);

const OUTPUTS = Object.freeze({
  state: path.join(runRoot, "wave31b-acer-to-liris-push-acer.v1.json"),
  votes: path.join(runRoot, "wave31b-acer-to-liris-push-votes.ndjson"),
  d50: path.join(councilRoot, "D50-WAVE31B-ACER-TO-LIRIS-PUSH-ACER-2026-04-28.md"),
  mapMapMapped: path.join(mapsRoot, "federation-reintegration-wave31b-acer-to-liris-push-map-map-mapped.v1.json"),
  cubeCubed: path.join(cubesRoot, "federation-reintegration-wave31b-acer-to-liris-push-cube-cubed.cube.js"),
  glpj: path.join(glpjRoot, "federation-reintegration-wave31b-acer-to-liris-push-behcs256.glpj.json"),
  memory: path.join(memoryRoot, "federation-reintegration-wave31b-acer-to-liris-push.v1.json"),
  reportJson: path.join(reportsRoot, "federation-reintegration-wave31b-acer-to-liris-push-latest.json"),
  reportMd: path.join(reportsRoot, "federation-reintegration-wave31b-acer-to-liris-push-latest.md")
});

function ensureParent(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeJson(filePath, data) {
  ensureParent(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function writeText(filePath, text) {
  ensureParent(filePath);
  fs.writeFileSync(filePath, text.endsWith("\n") ? text : `${text}\n`, "utf8");
}

function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function sha256Text(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function repoRel(filePath) {
  const relative = path.relative(repoRoot, filePath);
  if (path.isAbsolute(relative) || relative.startsWith("..")) return filePath.replace(/\\/g, "/");
  return relative.replace(/\\/g, "/");
}

function lineCount(buffer) {
  const text = buffer.toString("utf8").replace(/\r?\n$/, "");
  return text ? text.split(/\r?\n/).length : 0;
}

function inspectAbsolute(filePath) {
  if (!fs.existsSync(filePath)) return { present: false, path: filePath.replace(/\\/g, "/"), sha256: null, lines: 0, bytes: 0 };
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
  return inspectAbsolute(path.join(repoRoot, relativePath));
}

function artifactInfo(filePath) {
  if (!fs.existsSync(filePath)) return { path: repoRel(filePath), present: false, sha256: null, lines: 0, bytes: 0 };
  const buffer = fs.readFileSync(filePath);
  return {
    path: repoRel(filePath),
    present: true,
    sha256: sha256Buffer(buffer),
    lines: lineCount(buffer),
    bytes: buffer.length
  };
}

function topEntries(rootPath, limit = 180) {
  try {
    return fs.readdirSync(rootPath, { withFileTypes: true })
      .slice(0, limit)
      .map((entry) => {
        const absolute = path.join(rootPath, entry.name);
        let stat = null;
        try { stat = fs.lstatSync(absolute); } catch (_) { stat = null; }
        return {
          name: entry.name,
          kind: entry.isDirectory() ? "directory" : entry.isSymbolicLink() ? "symlink" : "file",
          dotHidden: entry.name.startsWith("."),
          shadowNamed: /shadow|hidden|quarantine|private|backup|history|git/i.test(entry.name),
          bytes: stat?.isFile() ? stat.size : null
        };
      });
  } catch (error) {
    return [{ error: error.message, rootPath: rootPath.replace(/\\/g, "/") }];
  }
}

function driveProbe() {
  const driveLetters = "CDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  return driveLetters
    .map((letter) => {
      const root = `${letter}:\\`;
      return {
        drive: letter,
        root,
        present: fs.existsSync(root),
        topLevelMapped: fs.existsSync(root) ? topEntries(root, 30) : []
      };
    })
    .filter((drive) => drive.present);
}

function buildSurfaceMap() {
  return {
    host: os.hostname(),
    generatedAt,
    acerDrives: driveProbe(),
    acerRepoTopLevel: topEntries(repoRoot),
    acerShadowHiddenSummary: topEntries(repoRoot).filter((entry) => entry.dotHidden || entry.shadowNamed || entry.kind === "symlink"),
    lirisShares: {
      selected: lirisShareRoot,
      incomingAcer: lirisIncomingRoot,
      selectedTopLevel: topEntries(lirisShareRoot),
      selectedShadowHiddenSummary: topEntries(lirisShareRoot).filter((entry) => entry.dotHidden || entry.shadowNamed || entry.kind === "symlink")
    },
    excludedFromPush: [
      ".git",
      ".claude",
      ".agent",
      ".history",
      "node_modules",
      "private",
      "certs",
      "logs",
      "captures",
      "bank-account-transcrtions",
      "shadow",
      "backups",
      "quarantine"
    ],
    principle: "Map hidden/shadow surfaces; push only explicit federation-reintegration payload files."
  };
}

function inspectPayloads() {
  return PAYLOADS.map((payload) => {
    const source = inspectRepo(payload.source);
    const target = inspectAbsolute(payload.target);
    return {
      ...payload,
      sourceRel: payload.source,
      target: payload.target.replace(/\\/g, "/"),
      source,
      targetBefore: target,
      sourceReady: source.present,
      targetSafe: !target.present || (target.sha256 === source.sha256)
    };
  });
}

function buildVotes(payloads, surfaceMap) {
  const allSourcesReady = payloads.every((payload) => payload.sourceReady);
  const allTargetsSafe = payloads.every((payload) => payload.targetSafe);
  const lirisIncomingReachable = fs.existsSync(path.dirname(lirisIncomingRoot)) || fs.existsSync(lirisIncomingRoot);
  const proceed = allSourcesReady && allTargetsSafe && lirisIncomingReachable;
  const vote = proceed ? "APPROVE_PUSH_TO_LIRIS_INCOMING_ACER" : "HOLD_PUSH";
  return [
    {
      prof: "PROF-SHADOWMAP",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.SHADOWMAP.SURFACE.ACER",
      vote: "MAP_HIDDEN_SHADOW_DRIVES_NO_BULK_COPY",
      rationale: `Mapped ${surfaceMap.acerDrives.length} local filesystem drives plus ACER/Liris dot-hidden and shadow-named top-level entries.`
    },
    {
      prof: "PROF-COMMS",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.COMMS.CHANNEL.ACER",
      vote,
      rationale: "Direct Ethernet SMB path to Liris is the local sovereign transfer lane; selected share is liris-asolaria-old because it holds the D11 source tree and incoming-acer path."
    },
    {
      prof: "PROF-HERMES",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET.ACER",
      vote: proceed ? "APPROVE_PACKETIZED_PAYLOAD_SET" : "HOLD_PACKETIZED_PAYLOAD_SET",
      rationale: "Payload is constrained to ACER drift addendum, Wave 21A summary, and Wave 30E/30F/31A proof bundle."
    },
    {
      prof: "PROF-KERNEL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.KERNEL.GRAMMAR.ACER",
      vote: allSourcesReady ? "SOURCE_HASH_GRAMMAR_READY" : "SOURCE_HASH_GRAMMAR_MISSING",
      rationale: "Each payload source must exist and be sha256-addressable before push."
    },
    {
      prof: "PROF-SHANNON",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.SHANNON.TRUST.ACER",
      vote: allTargetsSafe ? "ALLOW_ABSENT_OR_IDENTICAL_LIRIS_TARGETS_ONLY" : "BLOCK_DIVERGENT_LIRIS_TARGET",
      rationale: "No divergent existing Liris target is overwritten."
    },
    {
      prof: "PROF-CHIEFCOUNCIL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.D50.COUNCIL.ACER",
      vote: "STAGE_EVIDENCE_ONLY_NO_LIRIS_PROMOTION",
      rationale: "The push stages evidence for Liris intake; it does not mutate Liris canonical files or promote federation state."
    },
    {
      prof: "PROF-GLYPH-KERNEL",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.GLPJ.GLYPH.ACER",
      vote: proceed ? "GLYPH_PACKET_SEALED_PUSH" : "GLYPH_PACKET_SEALED_HOLD",
      rationale: "The GLPJ packet binds the local supervisor decision to the payload hashes."
    },
    {
      prof: "COL-ASOLARIA",
      supervisorPid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.ASOLARIA.APEX.ACER",
      vote,
      rationale: "Execute only the approved incoming-acer evidence push; leave broad hidden/shadow surfaces mapped but untouched."
    }
  ];
}

function votesApprove(votes) {
  return votes.every((vote) => !vote.vote.includes("HOLD") && !vote.vote.includes("BLOCK") && !vote.vote.includes("MISSING"));
}

function executePush(payloads, approved) {
  const results = [];
  if (!approved) {
    return { executed: false, reason: "SUPERVISOR_VOTES_DID_NOT_APPROVE", results };
  }
  fs.mkdirSync(lirisIncomingRoot, { recursive: true });
  fs.mkdirSync(lirisBundleRoot, { recursive: true });
  for (const payload of payloads) {
    const sourcePath = path.join(repoRoot, payload.sourceRel);
    const targetPath = payload.target.replace(/\//g, "\\");
    const targetBefore = inspectAbsolute(targetPath);
    if (targetBefore.present && targetBefore.sha256 !== payload.source.sha256) {
      results.push({ id: payload.id, installed: false, reason: "TARGET_DIVERGED_AT_WRITE_TIME", targetBefore });
      continue;
    }
    ensureParent(targetPath);
    fs.copyFileSync(sourcePath, targetPath);
    const targetAfter = inspectAbsolute(targetPath);
    results.push({
      id: payload.id,
      installed: targetAfter.sha256 === payload.source.sha256,
      sourceSha256: payload.source.sha256,
      targetAfter
    });
  }
  return {
    executed: results.every((result) => result.installed),
    reason: results.every((result) => result.installed) ? "ALL_APPROVED_PAYLOADS_PUSHED_AND_HASH_MATCHED" : "ONE_OR_MORE_PAYLOADS_FAILED",
    results
  };
}

function buildMapMapMapped(state) {
  return {
    schema: "behcs-map-map-mapped.v1",
    generatedAt,
    sourceStateHash: state.stateHash,
    map: {
      from: "ACER federation evidence",
      to: "Liris incoming-acer staging",
      share: lirisShareRoot
    },
    mapMap: {
      hiddenShadowDriveSurface: state.surfaceMap,
      votes: state.supervisorVotes.map((vote) => ({ prof: vote.prof, vote: vote.vote }))
    },
    mapMapMapped: {
      pushed: state.execution.executed,
      payloads: state.payloads.map((payload) => ({ id: payload.id, target: payload.target, sourceSha256: payload.source.sha256 }))
    }
  };
}

function buildCubeCubedSource(state) {
  const payload = {
    schema: "behcs-cube-cube-cubed.v1",
    generatedAt,
    sourceStateHash: state.stateHash,
    axes: {
      x: "surface map includes drives/hidden/shadow",
      y: "supervisor votes approve constrained payload",
      z: "Liris incoming-acer target hashes match source"
    },
    pushed: state.execution.executed,
    payloads: state.execution.results.map((result) => ({ id: result.id, installed: result.installed, sha256: result.targetAfter?.sha256 || null }))
  };
  return [
    '"use strict";',
    "",
    "module.exports = Object.freeze(",
    JSON.stringify(payload, null, 2),
    ");",
    ""
  ].join("\n");
}

function buildGlpj(state) {
  return {
    schema: "behcs256-glpj-glyph-packet.v1",
    generatedAt,
    sourceStateHash: state.stateHash,
    glyphFamily: "ACER_TO_LIRIS_EVIDENCE_PUSH",
    glyphs: state.supervisorVotes.map((vote, index) => ({
      atom: `GLPJ:BEHCS256:W31B:${String(index + 1).padStart(2, "0")}`,
      prof: vote.prof,
      supervisorPid: vote.supervisorPid,
      vote: vote.vote
    })),
    phrase: state.execution.executed
      ? "ACER_EVIDENCE_PUSHED_TO_LIRIS_INCOMING_ACER_HASH_MATCHED"
      : "ACER_EVIDENCE_PUSH_TO_LIRIS_HELD_OR_FAILED"
  };
}

function buildD50(state, artifacts) {
  return [
    "# D50 Wave 31B - ACER to Liris Evidence Push",
    "",
    "| Field | Value |",
    "|---|---|",
    `| status | ${state.status} |`,
    `| generated_at | ${state.generatedAt} |`,
    `| state_hash | ${state.stateHash} |`,
    `| liris_share | ${lirisShareRoot} |`,
    `| liris_incoming | ${lirisIncomingRoot.replace(/\\/g, "/")} |`,
    "",
    "## Supervisor Votes",
    "",
    ...state.supervisorVotes.map((vote) => `- ${vote.prof} / ${vote.supervisorPid}: ${vote.vote}`),
    "",
    "## Payload Results",
    "",
    ...state.execution.results.map((result) => `- ${result.id}: installed=${result.installed}, sha256=${result.targetAfter?.sha256 || "n/a"}`),
    "",
    "## Hidden / Shadow Scope",
    "",
    "- Hidden/shadow/drives were mapped into the Wave 31B map-map-mapped surface.",
    "- Hidden/private/git/node_modules/certs/logs/captures/shadow/quarantine trees were not bulk-copied.",
    "",
    "## BEHCS Surfaces",
    "",
    `- map-map-mapped: ${artifacts.mapMapMapped.path}`,
    `- cube-cube-cubed: ${artifacts.cubeCubed.path}`,
    `- GLPJ: ${artifacts.glpj.path}`,
    "",
    "## Boundary",
    "",
    state.boundary
  ].join("\n");
}

function buildReport(state, artifacts) {
  return [
    "# Wave 31B ACER to Liris Evidence Push",
    "",
    `Generated: ${state.generatedAt}`,
    `Status: ${state.status}`,
    `State hash: ${state.stateHash}`,
    "",
    "## Result",
    "",
    `- Push executed: ${state.execution.executed}`,
    `- Reason: ${state.execution.reason}`,
    `- Payload count: ${state.payloads.length}`,
    "",
    "## Outputs",
    "",
    ...Object.entries(artifacts).map(([key, value]) => `- ${key}: \`${value.path}\` sha256=${value.sha256}`),
    "",
    "## Boundary",
    "",
    state.boundary
  ].join("\n");
}

function main() {
  const surfaceMap = buildSurfaceMap();
  const payloads = inspectPayloads();
  const supervisorVotes = buildVotes(payloads, surfaceMap);
  const approved = votesApprove(supervisorVotes);
  const execution = executePush(payloads, approved);

  const pushedManifestTarget = path.join(lirisBundleRoot, "acer-wave31b-push-manifest.raw.json");
  const state = {
    schema: "federation-reintegration-wave31b-acer-to-liris-push-acer.v1",
    generatedAt,
    status: execution.executed ? "ACER_TO_LIRIS_INCOMING_ACER_PUSH_HASH_VERIFIED" : "ACER_TO_LIRIS_PUSH_HELD_OR_FAILED",
    sourceMode: "LOCAL_ASOLARIA_SCRIPT_ONLY_NO_CODEX_MCP_NO_SUBAGENTS",
    wave: { family: "Wave 31", letter: "B", name: "31B", phase: "acer-to-liris-push" },
    surfaceMap,
    payloads,
    supervisorVotes,
    approved,
    execution,
    lirisTargets: {
      incomingRoot: lirisIncomingRoot.replace(/\\/g, "/"),
      bundleRoot: lirisBundleRoot.replace(/\\/g, "/"),
      manifestTarget: pushedManifestTarget.replace(/\\/g, "/")
    },
    boundary: "Local SMB evidence push only. Hidden/shadow/drives are mapped but not bulk-copied. No Codex MCP/subagents, no peer API call, no Liris canonical overwrite, no divergent target overwrite, no secret/private/git/node_modules/certs/log/capture bulk transfer, no LX mutation, no federation promotion, no device action."
  };
  state.stateHash = sha256Text(JSON.stringify(state));

  if (execution.executed) {
    writeJson(pushedManifestTarget, {
      schema: "acer-wave31b-push-manifest-to-liris.v1",
      generatedAt,
      stateHash: state.stateHash,
      payloads: state.execution.results.map((result) => ({
        id: result.id,
        installed: result.installed,
        target: result.targetAfter.path,
        sha256: result.targetAfter.sha256,
        lines: result.targetAfter.lines,
        bytes: result.targetAfter.bytes
      })),
      boundary: state.boundary
    });
    state.execution.manifestAfter = inspectAbsolute(pushedManifestTarget);
  }

  writeJson(OUTPUTS.state, state);
  writeText(OUTPUTS.votes, supervisorVotes.map((vote) => JSON.stringify(vote)).join("\n"));
  writeJson(OUTPUTS.mapMapMapped, buildMapMapMapped(state));
  writeText(OUTPUTS.cubeCubed, buildCubeCubedSource(state));
  writeJson(OUTPUTS.glpj, buildGlpj(state));
  writeJson(OUTPUTS.memory, state);

  const artifactsForD50 = {
    mapMapMapped: artifactInfo(OUTPUTS.mapMapMapped),
    cubeCubed: artifactInfo(OUTPUTS.cubeCubed),
    glpj: artifactInfo(OUTPUTS.glpj)
  };
  writeText(OUTPUTS.d50, buildD50(state, artifactsForD50));

  const artifacts = {
    state: artifactInfo(OUTPUTS.state),
    votes: artifactInfo(OUTPUTS.votes),
    d50: artifactInfo(OUTPUTS.d50),
    ...artifactsForD50,
    memory: artifactInfo(OUTPUTS.memory)
  };
  writeJson(OUTPUTS.reportJson, { ...state, artifacts });
  artifacts.reportJson = artifactInfo(OUTPUTS.reportJson);
  writeText(OUTPUTS.reportMd, buildReport(state, artifacts));
  artifacts.reportMd = artifactInfo(OUTPUTS.reportMd);

  console.log(JSON.stringify({
    ok: true,
    status: state.status,
    stateHash: state.stateHash,
    approved,
    executed: execution.executed,
    reason: execution.reason,
    payloads: execution.results.map((result) => ({
      id: result.id,
      installed: result.installed,
      sha256: result.targetAfter?.sha256 || null,
      target: result.targetAfter?.path || null
    })),
    pushedManifest: state.execution.manifestAfter || null,
    artifacts
  }, null, 2));
}

main();
