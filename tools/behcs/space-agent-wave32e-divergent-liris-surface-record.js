#!/usr/bin/env node
"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..", "..");
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", "space-agent-intake-20260428");
const councilRoot = path.join(repoRoot, "data", "agent-index", "council");
const memoryRoot = path.join(repoRoot, "data", "behcs", "memory");
const indexRoot = path.join(repoRoot, "data", "behcs", "index");
const mapsRoot = path.join(repoRoot, "data", "behcs", "maps", "asolaria");
const cubesRoot = path.join(repoRoot, "data", "behcs", "cubes");
const glpjRoot = path.join(repoRoot, "data", "behcs", "codex", "glyph-language");
const whiteRoomRoot = path.join(repoRoot, "data", "behcs", "omniwhite-room");
const gcRoot = path.join(repoRoot, "data", "behcs", "garbage-collector");
const cryptoRoot = path.join(repoRoot, "data", "behcs", "crypto");
const reportsRoot = path.join(repoRoot, "reports");

const inputPath = path.join(runRoot, "wave32d-authorized-liris-promotion-acer.v1.json");

const outputs = {
  state: path.join(runRoot, "wave32e-divergent-liris-surface-record-acer.v1.json"),
  manifest: path.join(runRoot, "wave32e-divergent-liris-surface-record-manifest.json"),
  votes: path.join(runRoot, "wave32e-divergent-liris-surface-record-votes.ndjson"),
  memory: path.join(memoryRoot, "space-agent-wave32e-divergent-liris-surface-record.v1.json"),
  index: path.join(indexRoot, "space-agent-wave32e-divergent-liris-surface-record-index.v1.json"),
  map: path.join(mapsRoot, "space-agent-wave32e-divergent-liris-surface-record-map-map-mapped.v1.json"),
  cube: path.join(cubesRoot, "space-agent-wave32e-divergent-liris-surface-record-cube-cubed.cube.js"),
  glpj: path.join(glpjRoot, "space-agent-wave32e-divergent-liris-surface-record-behcs256.glpj.json"),
  whiteRoom: path.join(whiteRoomRoot, "space-agent-wave32e-divergent-liris-surface-record-whiteroom.v1.json"),
  gc: path.join(gcRoot, "space-agent-wave32e-divergent-liris-surface-record-retention.v1.json"),
  cryptoSeal: path.join(cryptoRoot, "space-agent-wave32e-divergent-liris-surface-record-crypto-seal.v1.json"),
  d50: path.join(councilRoot, "D50-WAVE32E-DIVERGENT-LIRIS-SURFACE-RECORD-ACER-2026-04-28.md"),
  reportJson: path.join(reportsRoot, "space-agent-wave32e-divergent-liris-surface-record-latest.json"),
  reportMd: path.join(reportsRoot, "space-agent-wave32e-divergent-liris-surface-record-latest.md")
};

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function stableStringify(value) {
  if (Array.isArray(value)) {
    return JSON.stringify(value.map((item) => sortDeep(item)), null, 2);
  }
  return JSON.stringify(sortDeep(value), null, 2);
}

function sortDeep(value) {
  if (Array.isArray(value)) {
    return value.map((item) => sortDeep(item));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sortDeep(value[key])])
    );
  }
  return value;
}

function canonicalJson(value) {
  return JSON.stringify(value, null, 2) + "\n";
}

function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function sha256String(text) {
  return sha256Buffer(Buffer.from(text, "utf8"));
}

function sha256File(filePath) {
  return sha256Buffer(fs.readFileSync(filePath));
}

function countLines(text) {
  if (!text) return 0;
  return text.endsWith("\n") ? text.split(/\r?\n/).length - 1 : text.split(/\r?\n/).length;
}

function writeText(filePath, text) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, text, "utf8");
}

function glyph(...parts) {
  return "BH.GLPJ." + sha256String(parts.join("|")).slice(0, 32).toUpperCase();
}

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function artifactMeta(filePath) {
  const content = fs.readFileSync(filePath);
  const text = content.toString("utf8");
  return {
    path: path.relative(repoRoot, filePath).replace(/\\/g, "/"),
    sha256: sha256Buffer(content),
    bytes: content.length,
    lines: countLines(text)
  };
}

function buildVotes(status, divergentRows) {
  const divergentCount = divergentRows.length;
  return [
    {
      prof: "PROF-HOOKWALL",
      supervisorPid: "BH.SUPERVISOR.PID.SPACE.HOOKWALL.WAVE32E.ACER",
      vote: status,
      reason: "No divergent Liris target may be overwritten by an ACER relay, even under operator authorization."
    },
    {
      prof: "PROF-KERNEL",
      supervisorPid: "BH.SUPERVISOR.PID.SPACE.KERNEL.WAVE32E.ACER",
      vote: "DIVERGED_DRAFT_SIBLINGS_CONFIRMED",
      reason: `${divergentCount} Liris canonical surfaces differ from the ACER incoming bundle and therefore represent independent Liris evidence.`
    },
    {
      prof: "PROF-OMNISHANNON",
      supervisorPid: "BH.SUPERVISOR.PID.SPACE.OMNISHANNON.WAVE32E.ACER",
      vote: "NO_ERASURE_NO_COLLAPSE",
      reason: "The supervisor path is to record the divergence and let the two independently emitted surfaces feed the later D50 roll-up."
    },
    {
      prof: "PROF-WHITEROOM",
      supervisorPid: "BH.SUPERVISOR.PID.SPACE.WHITEROOM.WAVE32E.ACER",
      vote: "REVIEW_REQUIRED_BEFORE_META_RATIFICATION",
      reason: "D50 META roll-up must consume both ACER Wave32B and Liris reciprocal evidence; Wave32E is not ratification."
    },
    {
      prof: "COL-ASOLARIA",
      supervisorPid: "BH.SUPERVISOR.PID.SPACE.ASOLARIA.APEX.WAVE32E.ACER",
      vote: "PRESERVE_LIRIS_CANONICAL_TARGETS",
      reason: "Operator authorization was honored through hash-gated promotion and stopped at the correct safety boundary."
    }
  ];
}

function main() {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Missing Wave32D input: ${inputPath}`);
  }

  const generatedAt = new Date().toISOString();
  const wave32d = loadJson(inputPath);
  const results = Array.isArray(wave32d.results) ? wave32d.results : [];
  const divergentRows = results.filter((row) => row.action === "HOLD_TARGET_DIVERGENT");
  const identicalRows = results.filter((row) => row.action === "CONFIRMED_IDENTICAL_TARGET");
  const missingRows = results.filter((row) => !row.source || row.source.present === false);

  const status = divergentRows.length
    ? "DIVERGED_DRAFT_SIBLINGS_PRESERVED_HOLD"
    : "NO_DIVERGENT_LIRIS_SURFACES_DETECTED";

  const divergenceRecords = divergentRows.map((row) => ({
    id: row.id,
    relativePath: row.relativePath,
    class: row.class,
    acerIncomingSha256: row.source && row.source.sha256,
    lirisCanonicalSha256: row.targetBefore && row.targetBefore.sha256,
    lirisCanonicalPreserved: row.targetAfter && row.targetBefore && row.targetAfter.sha256 === row.targetBefore.sha256,
    action: row.action
  }));

  const votes = buildVotes(status, divergentRows);

  const statePreHash = {
    schema: "space-agent-wave32e-divergent-liris-surface-record.v1",
    generatedAt,
    status,
    input: {
      wave32dPath: path.relative(repoRoot, inputPath).replace(/\\/g, "/"),
      wave32dStateHash: wave32d.stateHash,
      wave32dStatus: wave32d.status
    },
    counts: {
      totalPromotionRows: results.length,
      identicalTargets: identicalRows.length,
      divergentTargets: divergentRows.length,
      missingSources: missingRows.length,
      promotedCountFromWave32D: wave32d.promotedCount
    },
    doctrine: {
      rule: "DIVERGED_DRAFT_SIBLINGS",
      meaning: "ACER and Liris surfaces are independent siblings until an explicit byte-equivalence mirror or D50 META roll-up consumes both.",
      noOverwrite: true,
      noRatification: true,
      noSpaceAgentCodeImport: true,
      noExternalCloneInstall: true
    },
    divergenceRecords,
    preservedEvidence: {
      acerIncomingBundleRemainsEvidence: true,
      lirisCanonicalTargetsRemainUntouched: true,
      lirisIndependentRunStillRequired: true
    },
    skippedForIndependence: wave32d.skippedForIndependence || [],
    votes,
    boundaries: [
      "local_supervisor_record_only",
      "no_divergent_overwrite",
      "no_remote_execution",
      "no_liris_canonical_mutation",
      "no_space_agent_clone",
      "no_install",
      "no_mcp",
      "no_codex_subagents",
      "no_ratification"
    ]
  };

  const stateHash = sha256String(stableStringify(statePreHash));
  const state = { ...statePreHash, stateHash };

  const memory = {
    schema: "behcs-memory.v1",
    memoryId: "space-agent-wave32e-divergent-liris-surface-record",
    generatedAt,
    status,
    summary: "Wave32E records that Liris already has divergent canonical Space Rooms reinvention surfaces and that ACER must not overwrite them.",
    stateHash,
    divergenceCount: divergentRows.length
  };

  const index = {
    schema: "behcs-index.v1",
    generatedAt,
    status,
    stateHash,
    terms: [
      "space-agent",
      "asolaria-native-space-rooms",
      "wave32e",
      "diverged-draft-siblings",
      "liris-canonical-preserved",
      "no-overwrite"
    ],
    rows: divergenceRecords.map((row) => ({
      id: row.id,
      path: row.relativePath,
      acerIncomingSha256: row.acerIncomingSha256,
      lirisCanonicalSha256: row.lirisCanonicalSha256
    }))
  };

  const map = {
    schema: "space-agent-wave32e-map-map-mapped.v1",
    generatedAt,
    status,
    stateHash,
    nodes: [
      { id: "acer-wave32b", kind: "source-sibling", stateHash: "66bab90353723c1f6f3791cb29bfaf3e3ebf46f73789b135b53494176e4e1b88" },
      { id: "acer-wave32c", kind: "push-bundle", stateHash: "bcd955ea6852be446c9b75c92e4952f56192171ec834e6327954f14ff7c18f79" },
      { id: "acer-wave32d", kind: "hash-gated-promotion", stateHash: wave32d.stateHash },
      { id: "acer-wave32e", kind: "divergence-record", stateHash }
    ].concat(divergenceRecords.map((row) => ({
      id: `liris-${row.id}`,
      kind: "divergent-liris-canonical-surface",
      path: row.relativePath,
      sha256: row.lirisCanonicalSha256
    }))),
    edges: [
      { from: "acer-wave32b", to: "acer-wave32c", type: "explicit_bundle_push" },
      { from: "acer-wave32c", to: "acer-wave32d", type: "operator_authorized_hash_gate" },
      { from: "acer-wave32d", to: "acer-wave32e", type: "divergence_record" }
    ]
  };

  const cube = `// Auto-generated by space-agent-wave32e-divergent-liris-surface-record.js
"use strict";

module.exports = ${canonicalJson({
    schema: "space-agent-wave32e-cube-cube-cubed.v1",
    cubeId: "space-agent-wave32e-divergent-liris-surface-record",
    status,
    stateHash,
    axes: {
      memory: "preserve_liris_independent_surface",
      index: "record_acer_vs_liris_hashes",
      map: "siblings_not_supersession",
      glyph: "no_overwrite",
      whiteroom: "review_before_rollup",
      gc: "retain_both_until_meta"
    },
    divergentTargets: divergentRows.length
  })};
`;

  const glpj = {
    schema: "behcs256-glpj.v1",
    generatedAt,
    glyphFamily: "SPACE_AGENT_WAVE32E_DIVERGENCE",
    status,
    stateHash,
    glyphs: divergenceRecords.map((row) => ({
      id: `W32E_${row.id.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`,
      glyph: glyph("wave32e", row.id, row.acerIncomingSha256, row.lirisCanonicalSha256),
      meaning: "ACER incoming surface and Liris canonical surface are divergent siblings; preserve both."
    }))
  };

  const whiteRoom = {
    schema: "white-room-review.v1",
    generatedAt,
    status: "REVIEW_HOLD_UNTIL_LIRIS_RECIPROCAL_STATE_HASH",
    stateHash,
    findings: [
      "Wave32D honored authorization without erasing Liris evidence.",
      "The executor target was byte-identical on Liris.",
      "Twelve surface targets were divergent and therefore held.",
      "D50 META roll-up must consume both ACER and Liris surfaces."
    ]
  };

  const gc = {
    schema: "behcs-gc-retention.v1",
    generatedAt,
    status: "RETAIN_BOTH_SIBLINGS",
    stateHash,
    retention: {
      acerIncomingBundle: "retain_until_d50_meta_rollup",
      lirisCanonicalDivergentTargets: "retain_as_liris_independent_evidence",
      wave32dHoldRecord: "retain_permanent_audit"
    }
  };

  const cryptoSealPreHash = {
    schema: "behcs-crypto-seal.v1",
    generatedAt,
    sealId: "space-agent-wave32e-divergent-liris-surface-record",
    stateHash,
    inputSha256: sha256File(inputPath),
    divergenceRecordHashes: divergenceRecords.map((row) => ({
      id: row.id,
      acerIncomingSha256: row.acerIncomingSha256,
      lirisCanonicalSha256: row.lirisCanonicalSha256
    }))
  };
  const cryptoSeal = {
    ...cryptoSealPreHash,
    sealSha256: sha256String(stableStringify(cryptoSealPreHash))
  };

  const d50 = [
    "# D50 Wave32E - Divergent Liris Surface Record (ACER)",
    "",
    "| Field | Value |",
    "|---|---|",
    `| status | ${status} |`,
    "| supervisor_pid | BH.SUPERVISOR.PID.SPACE.ASOLARIA.APEX.WAVE32E.ACER |",
    "| co_supervisor_pids | HOOKWALL.WAVE32E · KERNEL.WAVE32E · OMNISHANNON.WAVE32E · WHITEROOM.WAVE32E |",
    "| operator_authorization | authorization by operator granted |",
    `| wave32d_state_hash | ${wave32d.stateHash} |`,
    `| state_hash | ${stateHash} |`,
    "",
    "## Verdict",
    "",
    "Wave32D did not erase or overwrite Liris. It confirmed one byte-identical executor target and held twelve divergent canonical surfaces. Wave32E records those held surfaces as DIVERGED_DRAFT_SIBLINGS evidence.",
    "",
    "## Divergent Surfaces",
    "",
    "| id | ACER incoming sha256 | Liris canonical sha256 | preserved |",
    "|---|---|---|---|",
    ...divergenceRecords.map((row) => `| ${row.id} | ${row.acerIncomingSha256} | ${row.lirisCanonicalSha256} | ${row.lirisCanonicalPreserved ? "yes" : "unknown"} |`),
    "",
    "## Supervisor Votes",
    "",
    ...votes.map((vote) => `- ${vote.prof} / ${vote.supervisorPid}: ${vote.vote} - ${vote.reason}`),
    "",
    "## Boundaries",
    "",
    "- no divergent overwrite",
    "- no Liris canonical mutation",
    "- no Space Agent clone/install/code execution",
    "- no MCP or Codex subagents",
    "- no ratification; D50 META roll-up remains pending"
  ].join("\n") + "\n";

  const report = {
    schema: "space-agent-wave32e-report.v1",
    generatedAt,
    status,
    stateHash,
    input: state.input,
    counts: state.counts,
    divergenceRecords,
    votes,
    outputs: Object.fromEntries(Object.entries(outputs).map(([key, value]) => [key, path.relative(repoRoot, value).replace(/\\/g, "/")]))
  };

  writeText(outputs.state, canonicalJson(state));
  writeText(outputs.votes, votes.map((vote) => JSON.stringify(vote)).join("\n") + "\n");
  writeText(outputs.memory, canonicalJson(memory));
  writeText(outputs.index, canonicalJson(index));
  writeText(outputs.map, canonicalJson(map));
  writeText(outputs.cube, cube);
  writeText(outputs.glpj, canonicalJson(glpj));
  writeText(outputs.whiteRoom, canonicalJson(whiteRoom));
  writeText(outputs.gc, canonicalJson(gc));
  writeText(outputs.cryptoSeal, canonicalJson(cryptoSeal));
  writeText(outputs.d50, d50);
  writeText(outputs.reportJson, canonicalJson(report));
  writeText(outputs.reportMd, [
    "# Space Agent Wave32E - Divergent Liris Surface Record",
    "",
    `Status: ${status}`,
    `State hash: ${stateHash}`,
    `Divergent Liris canonical surfaces: ${divergentRows.length}`,
    "",
    "Wave32E records the Wave32D HOLD as a preserved sibling state, not as an overwrite failure.",
    "",
    "## Artifacts",
    "",
    ...Object.entries(outputs).filter(([key]) => key !== "manifest" && key !== "reportMd").map(([, filePath]) => {
      if (!fs.existsSync(filePath)) return `- ${path.relative(repoRoot, filePath).replace(/\\/g, "/")} - missing`;
      const meta = artifactMeta(filePath);
      return `- ${meta.path} - ${meta.sha256}`;
    })
  ].join("\n") + "\n");

  const manifest = {
    schema: "space-agent-wave32e-manifest.v1",
    generatedAt,
    status,
    stateHash,
    manifestSelfHash: "NON_ATOMIC_EXCLUDED_FROM_OWN_ARTIFACT_LIST",
    artifacts: Object.entries(outputs)
      .filter(([key, filePath]) => key !== "manifest" && fs.existsSync(filePath))
      .map(([, filePath]) => artifactMeta(filePath))
  };
  writeText(outputs.manifest, canonicalJson(manifest));

  console.log(JSON.stringify({
    ok: true,
    status,
    stateHash,
    divergentTargets: divergentRows.length,
    identicalTargets: identicalRows.length,
    manifestSha256: sha256File(outputs.manifest),
    d50Sha256: sha256File(outputs.d50),
    report: path.relative(repoRoot, outputs.reportMd).replace(/\\/g, "/")
  }, null, 2));
}

main();
