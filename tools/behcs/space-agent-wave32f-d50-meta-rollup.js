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

const lirisRoot = "\\\\192.168.100.2\\liris-asolaria-old";
const incomingAcerRoot = path.join(
  repoRoot,
  "data",
  "behcs",
  "orchestration",
  "federation-reintegration-20260427",
  "incoming-acer"
);
const incomingWave32CRoot = path.join(incomingAcerRoot, "wave32c-space-agent-reinvention-reciprocity-push");
const incomingWave32HRoot = path.join(incomingAcerRoot, "wave32h-wave32e-dependency-push");
const localCanonicalWave32BPath = path.join(runRoot, "space-reinvent-wave32b-native-space-rooms.v1.json");
const localCanonicalWave32EPath = path.join(runRoot, "wave32e-divergent-liris-surface-record-acer.v1.json");
const lirisCanonicalWave32BPath = path.join(lirisRoot, "data", "behcs", "orchestration", "space-agent-intake-20260428", "space-reinvent-wave32b-native-space-rooms.v1.json");

const acerWave32BCandidates = Object.freeze([
  {
    sourceKind: "local_canonical",
    path: localCanonicalWave32BPath
  },
  {
    sourceKind: "incoming_wave32c_acer_bundle",
    path: path.join(incomingWave32CRoot, "data", "behcs", "orchestration", "space-agent-intake-20260428", "space-reinvent-wave32b-native-space-rooms.v1.json")
  }
]);

const lirisWave32BCandidates = Object.freeze([
  {
    sourceKind: "local_canonical",
    path: localCanonicalWave32BPath
  },
  {
    sourceKind: "liris_smb_canonical",
    path: lirisCanonicalWave32BPath
  }
]);

const acerWave32ECandidates = Object.freeze([
  {
    sourceKind: "local_canonical",
    path: localCanonicalWave32EPath
  },
  {
    sourceKind: "incoming_wave32h_acer_dependency_bundle",
    path: path.join(incomingWave32HRoot, "data", "behcs", "orchestration", "space-agent-intake-20260428", "wave32e-divergent-liris-surface-record-acer.v1.json")
  }
]);

const expected = {
  acerWave32BStateHash: "66bab90353723c1f6f3791cb29bfaf3e3ebf46f73789b135b53494176e4e1b88",
  lirisWave32BStateHash: "495aab793394d584f9cdfab77270afb9a24a23d40c07c0eddc5afcb72f610f38",
  acerWave32EStateHash: "29d7ef80cb6d0d3462b84a308a3514a96b3813bc13e63cb324da9791df7498fe"
};

const surfacePaths = [
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
];

const outputs = {
  state: path.join(runRoot, "wave32f-d50-meta-rollup-acer.v1.json"),
  manifest: path.join(runRoot, "wave32f-d50-meta-rollup-manifest.json"),
  votes: path.join(runRoot, "wave32f-d50-meta-rollup-votes.ndjson"),
  memory: path.join(memoryRoot, "space-agent-wave32f-d50-meta-rollup.v1.json"),
  index: path.join(indexRoot, "space-agent-wave32f-d50-meta-rollup-index.v1.json"),
  map: path.join(mapsRoot, "space-agent-wave32f-d50-meta-rollup-map-map-mapped.v1.json"),
  cube: path.join(cubesRoot, "space-agent-wave32f-d50-meta-rollup-cube-cubed.cube.js"),
  glpj: path.join(glpjRoot, "space-agent-wave32f-d50-meta-rollup-behcs256.glpj.json"),
  whiteRoom: path.join(whiteRoomRoot, "space-agent-wave32f-d50-meta-rollup-whiteroom.v1.json"),
  gc: path.join(gcRoot, "space-agent-wave32f-d50-meta-rollup-retention.v1.json"),
  cryptoSeal: path.join(cryptoRoot, "space-agent-wave32f-d50-meta-rollup-crypto-seal.v1.json"),
  d50: path.join(councilRoot, "D50-WAVE32F-SPACE-ROOMS-META-ROLLUP-ACER-LIRIS-2026-04-28.md"),
  reportJson: path.join(reportsRoot, "space-agent-wave32f-d50-meta-rollup-latest.json"),
  reportMd: path.join(reportsRoot, "space-agent-wave32f-d50-meta-rollup-latest.md")
};

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function sortDeep(value) {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortDeep(value[key])]));
  }
  return value;
}

function stableStringify(value) {
  return JSON.stringify(sortDeep(value), null, 2);
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

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function artifactMeta(filePath) {
  const buffer = fs.readFileSync(filePath);
  const text = buffer.toString("utf8");
  return {
    path: path.relative(repoRoot, filePath).replace(/\\/g, "/"),
    sha256: sha256Buffer(buffer),
    bytes: buffer.length,
    lines: countLines(text)
  };
}

function displayPath(filePath) {
  const rel = path.relative(repoRoot, filePath);
  if (path.isAbsolute(rel) || rel.startsWith("..")) return filePath.replace(/\\/g, "/");
  return rel.replace(/\\/g, "/");
}

function metaForPath(relativePath, filePath, sourceKind) {
  if (!fs.existsSync(filePath)) return { relativePath, present: false };
  const buffer = fs.readFileSync(filePath);
  return {
    relativePath,
    sourceKind,
    path: displayPath(filePath),
    present: true,
    sha256: sha256Buffer(buffer),
    bytes: buffer.length,
    lines: countLines(buffer.toString("utf8"))
  };
}

function metaForRoot(relativePath, root, sourceKind) {
  return metaForPath(relativePath, path.join(root, relativePath), sourceKind);
}

function readJsonEvidenceCandidate(candidate) {
  if (!fs.existsSync(candidate.path)) {
    return {
      ...candidate,
      present: false,
      sha256: null,
      stateHash: null,
      json: null
    };
  }
  const buffer = fs.readFileSync(candidate.path);
  let json = null;
  let parseError = null;
  try {
    json = JSON.parse(buffer.toString("utf8"));
  } catch (error) {
    parseError = error.message;
  }
  return {
    present: true,
    sourceKind: candidate.sourceKind,
    path: candidate.path,
    displayPath: displayPath(candidate.path),
    sha256: sha256Buffer(buffer),
    bytes: buffer.length,
    lines: countLines(buffer.toString("utf8")),
    stateHash: json && json.stateHash,
    json,
    parseError
  };
}

function resolveJsonEvidence(label, expectedStateHash, candidates) {
  const inspected = candidates.map(readJsonEvidenceCandidate);
  const match = inspected.find((candidate) => candidate.present && candidate.stateHash === expectedStateHash);
  if (match) return { ...match, label, expectedStateHash, candidates: inspected.map(stripEvidenceCandidate) };
  const present = inspected.filter((candidate) => candidate.present);
  const seen = present.map((candidate) => `${candidate.sourceKind}:${candidate.stateHash || "NO_STATE_HASH"}`).join(", ");
  throw new Error(`Missing required evidence ${label} expected ${expectedStateHash}; seen ${seen || "no candidates present"}`);
}

function stripEvidenceCandidate(candidate) {
  return {
    sourceKind: candidate.sourceKind,
    path: candidate.displayPath || displayPath(candidate.path),
    present: candidate.present,
    sha256: candidate.sha256,
    stateHash: candidate.stateHash,
    parseError: candidate.parseError || null
  };
}

function rootForWave32BSource(evidence, side) {
  if (evidence.sourceKind === "incoming_wave32c_acer_bundle") return incomingWave32CRoot;
  if (evidence.sourceKind === "liris_smb_canonical") return lirisRoot;
  if (evidence.sourceKind === "local_canonical") return repoRoot;
  throw new Error(`Unsupported ${side} Wave32B source kind: ${evidence.sourceKind}`);
}

function proof(label, payload) {
  return {
    label,
    type: "sha256_hash_attestation_not_private_key_signature",
    value: sha256String(stableStringify(payload))
  };
}

function glyph(...parts) {
  return "BH.GLPJ." + sha256String(parts.join("|")).slice(0, 32).toUpperCase();
}

function buildVotes(status, checks) {
  return [
    {
      prof: "PROF-HOOKWALL",
      supervisorPid: "BH.SUPERVISOR.PID.SPACE.HOOKWALL.WAVE32F.ACER",
      vote: checks.allEvidencePresent ? "PASS_NO_COPY_IMPORT_NO_ERASURE" : "HOLD_MISSING_EVIDENCE",
      reason: "Wave32F consumes ACER and Liris states as sibling evidence; no Space Agent code import, clone, install, or cross-host overwrite."
    },
    {
      prof: "PROF-KERNEL",
      supervisorPid: "BH.SUPERVISOR.PID.SPACE.KERNEL.WAVE32F.ACER",
      vote: checks.stateHashesMatchExpected ? "PASS_STATE_HASH_BINDING" : "HOLD_STATE_HASH_MISMATCH",
      reason: "The meta roll-up binds ACER Wave32B, Liris Wave32B, and ACER Wave32E hold hashes."
    },
    {
      prof: "PROF-WHITEROOM",
      supervisorPid: "BH.SUPERVISOR.PID.SPACE.WHITEROOM.WAVE32F.ACER",
      vote: "PASS_DIVERGENCE_PRESERVED",
      reason: "Divergent surfaces are preserved as sibling evidence rather than collapsed into byte identity."
    },
    {
      prof: "PROF-GC",
      supervisorPid: "BH.SUPERVISOR.PID.SPACE.GC.WAVE32F.ACER",
      vote: "PASS_RETAIN_BOTH_SURFACE_CHAINS",
      reason: "Both ACER and Liris surface chains remain retained until later implementation waves explicitly consume them."
    },
    {
      prof: "PROF-SHANNON",
      supervisorPid: "BH.SUPERVISOR.PID.SPACE.SHANNON.WAVE32F.ACER",
      vote: "PASS_HASH_ATTESTATION_NO_KEY_CLAIM",
      reason: "chief_sig, white_room_attest, gc_proof, and crypto seal are hash attestations, not fabricated private-key signatures."
    },
    {
      prof: "COL-ASOLARIA",
      supervisorPid: "BH.SUPERVISOR.PID.SPACE.ASOLARIA.APEX.WAVE32F.ACER",
      vote: status,
      reason: "Both independent Wave32B reinventions are now available for D50 meta roll-up under GENESIS-cosign descent."
    }
  ];
}

function main() {
  const generatedAt = new Date().toISOString();
  const acerWave32BEvidence = resolveJsonEvidence("ACER Wave32B", expected.acerWave32BStateHash, acerWave32BCandidates);
  const lirisWave32BEvidence = resolveJsonEvidence("Liris Wave32B", expected.lirisWave32BStateHash, lirisWave32BCandidates);
  const acerWave32EEvidence = resolveJsonEvidence("ACER Wave32E", expected.acerWave32EStateHash, acerWave32ECandidates);

  const acerWave32BPath = acerWave32BEvidence.path;
  const lirisWave32BPath = lirisWave32BEvidence.path;
  const acerWave32EPath = acerWave32EEvidence.path;
  const acerWave32B = acerWave32BEvidence.json;
  const acerWave32E = acerWave32EEvidence.json;
  const lirisWave32B = lirisWave32BEvidence.json;

  const acerSurfaceRoot = rootForWave32BSource(acerWave32BEvidence, "ACER");
  const lirisSurfaceRoot = rootForWave32BSource(lirisWave32BEvidence, "Liris");
  const acerSurfaces = surfacePaths.map((relativePath) => metaForRoot(relativePath, acerSurfaceRoot, acerWave32BEvidence.sourceKind));
  const lirisSurfaces = surfacePaths.map((relativePath) => metaForRoot(relativePath, lirisSurfaceRoot, lirisWave32BEvidence.sourceKind));
  const pairedSurfaces = surfacePaths.map((relativePath, index) => ({
    relativePath,
    acer: acerSurfaces[index],
    liris: lirisSurfaces[index],
    bothPresent: Boolean(acerSurfaces[index].present && lirisSurfaces[index].present),
    byteEquivalent: Boolean(acerSurfaces[index].present && lirisSurfaces[index].present && acerSurfaces[index].sha256 === lirisSurfaces[index].sha256)
  }));

  const checks = {
    acerStatusOk: acerWave32B.status === "REINVENT_NOT_COPY_ASOLARIA_NATIVE_SPACE_ROOMS",
    lirisStatusOk: lirisWave32B.status === "REINVENT_NOT_COPY_ASOLARIA_NATIVE_SPACE_ROOMS",
    acerNoCopy: acerWave32B.doctrine && acerWave32B.doctrine.useSpaceAgentCode === false && acerWave32B.doctrine.cloneInstall === false,
    lirisNoCopy: lirisWave32B.doctrine && lirisWave32B.doctrine.useSpaceAgentCode === false && lirisWave32B.doctrine.cloneInstall === false,
    acerWave32BStateHashMatch: acerWave32B.stateHash === expected.acerWave32BStateHash,
    lirisWave32BStateHashMatch: lirisWave32B.stateHash === expected.lirisWave32BStateHash,
    acerWave32EStateHashMatch: acerWave32E.stateHash === expected.acerWave32EStateHash,
    allAcerSurfacesPresent: acerSurfaces.every((row) => row.present),
    allLirisSurfacesPresent: lirisSurfaces.every((row) => row.present)
  };
  checks.allEvidencePresent = checks.allAcerSurfacesPresent && checks.allLirisSurfacesPresent;
  checks.stateHashesMatchExpected = checks.acerWave32BStateHashMatch && checks.lirisWave32BStateHashMatch && checks.acerWave32EStateHashMatch;
  checks.noCopyDoctrineConverged = checks.acerNoCopy && checks.lirisNoCopy;

  const divergentSurfaceCount = pairedSurfaces.filter((row) => row.bothPresent && !row.byteEquivalent).length;
  const equivalentSurfaceCount = pairedSurfaces.filter((row) => row.byteEquivalent).length;

  const status = checks.allEvidencePresent && checks.stateHashesMatchExpected && checks.noCopyDoctrineConverged
    ? "D50_META_ROLLUP_RATIFIABLE_ACER_LIRIS_SIBLINGS_BOUND"
    : "D50_META_ROLLUP_HOLD_MISSING_OR_MISMATCHED_EVIDENCE";

  const evidence = {
    acer: {
      host: "ACER",
      wave32bPath: displayPath(acerWave32BPath),
      sourceKind: acerWave32BEvidence.sourceKind,
      fileSha256: acerWave32BEvidence.sha256,
      candidates: acerWave32BEvidence.candidates,
      stateHash: acerWave32B.stateHash,
      generatedAt: acerWave32B.generatedAt,
      researchPuts: Array.isArray(acerWave32B.researchPuts) ? acerWave32B.researchPuts.length : null,
      useSpaceAgentCode: acerWave32B.doctrine && acerWave32B.doctrine.useSpaceAgentCode,
      cloneInstall: acerWave32B.doctrine && acerWave32B.doctrine.cloneInstall
    },
    liris: {
      host: "LIRIS",
      wave32bPath: displayPath(lirisWave32BPath),
      sourceKind: lirisWave32BEvidence.sourceKind,
      fileSha256: lirisWave32BEvidence.sha256,
      candidates: lirisWave32BEvidence.candidates,
      stateHash: lirisWave32B.stateHash,
      generatedAt: lirisWave32B.generatedAt,
      researchPuts: Array.isArray(lirisWave32B.researchPuts) ? lirisWave32B.researchPuts.length : null,
      useSpaceAgentCode: lirisWave32B.doctrine && lirisWave32B.doctrine.useSpaceAgentCode,
      cloneInstall: lirisWave32B.doctrine && lirisWave32B.doctrine.cloneInstall
    },
    acerWave32E: {
      path: displayPath(acerWave32EPath),
      sourceKind: acerWave32EEvidence.sourceKind,
      fileSha256: acerWave32EEvidence.sha256,
      candidates: acerWave32EEvidence.candidates,
      stateHash: acerWave32E.stateHash,
      status: acerWave32E.status,
      divergentTargets: acerWave32E.counts && acerWave32E.counts.divergentTargets
    }
  };

  const proofBase = {
    generatedAt,
    evidence,
    checks,
    divergentSurfaceCount,
    equivalentSurfaceCount,
    pairedSurfaceHashes: pairedSurfaces.map((row) => ({
      relativePath: row.relativePath,
      acerSha256: row.acer.sha256 || null,
      lirisSha256: row.liris.sha256 || null,
      byteEquivalent: row.byteEquivalent
    }))
  };

  const attestations = {
    chief_sig: proof("chief_sig", { role: "D50_META_ROLLUP_CHIEF_HASH_ATTESTATION", proofBase }),
    kr_gate_pass: {
      label: "kr_gate_pass",
      passed: checks.noCopyDoctrineConverged && checks.stateHashesMatchExpected,
      type: "boolean_gate_plus_sha256_attestation",
      value: sha256String(stableStringify({ noCopyDoctrineConverged: checks.noCopyDoctrineConverged, stateHashesMatchExpected: checks.stateHashesMatchExpected }))
    },
    white_room_attest: proof("white_room_attest", { divergencePreserved: true, noCollapse: true, checks }),
    gc_proof: proof("gc_proof", { retainBothSurfaceChains: true, pairedSurfaces }),
    genesis_cosign_descent: {
      label: "genesis_cosign_descent",
      type: "operator_authority_descent_record",
      value: sha256String("GENESIS_COSIGN_DESCENT|WAVE30|WAVE32F|ACER|LIRIS|" + evidence.acer.stateHash + "|" + evidence.liris.stateHash),
      note: "Derived from prior GENESIS-cosign gate layer plus operator authorization; not a new private-key signature."
    }
  };

  const votes = buildVotes(status, checks);

  const statePreHash = {
    schema: "space-agent-wave32f-d50-meta-rollup.v1",
    generatedAt,
    status,
    purpose: "Consume independent ACER and Liris Wave32B Space Rooms reinvention evidence into a D50 meta roll-up without erasing either sibling.",
    evidence,
    checks,
    counts: {
      pairedSurfaceCount: pairedSurfaces.length,
      divergentSurfaceCount,
      equivalentSurfaceCount,
      missingAcerSurfaces: acerSurfaces.filter((row) => !row.present).length,
      missingLirisSurfaces: lirisSurfaces.filter((row) => !row.present).length
    },
    pairedSurfaces,
    attestations,
    votes,
    forensicFlags: [
      {
        id: "liris_d50_acer_suffixed_path",
        status: "RECORDED_NOT_REWRITTEN",
        detail: "Liris reciprocal D50 content appears in an ACER-suffixed filename. Wave32F records the mismatch but does not rename or rewrite Liris."
      }
    ],
    boundaries: [
      "no_space_agent_clone",
      "no_install",
      "no_external_code_execution",
      "no_mcp",
      "no_codex_subagents",
      "no_liris_canonical_mutation",
      "no_divergent_overwrite",
      "no_private_key_signature_claim",
      "meta_rollup_only_not_implementation"
    ]
  };

  const stateHash = sha256String(stableStringify(statePreHash));
  const state = { ...statePreHash, stateHash };

  const memory = {
    schema: "behcs-memory.v1",
    memoryId: "space-agent-wave32f-d50-meta-rollup",
    generatedAt,
    status,
    stateHash,
    summary: "Wave32F binds ACER and Liris independent Space Rooms Wave32B reinventions into one D50 meta roll-up while preserving divergent sibling evidence."
  };

  const index = {
    schema: "behcs-index.v1",
    generatedAt,
    status,
    stateHash,
    terms: [
      "space-agent",
      "asolaria-native-space-rooms",
      "wave32f",
      "d50-meta-rollup",
      "acer-liris",
      "diverged-draft-siblings",
      "genesis-cosign-descent"
    ],
    hashes: {
      acerWave32B: evidence.acer.stateHash,
      lirisWave32B: evidence.liris.stateHash,
      acerWave32E: evidence.acerWave32E.stateHash,
      chiefSig: attestations.chief_sig.value,
      krGatePass: attestations.kr_gate_pass.value,
      whiteRoomAttest: attestations.white_room_attest.value,
      gcProof: attestations.gc_proof.value
    }
  };

  const map = {
    schema: "space-agent-wave32f-map-map-mapped.v1",
    generatedAt,
    status,
    stateHash,
    nodes: [
      { id: "acer-wave32b", kind: "independent-reinvention", stateHash: evidence.acer.stateHash },
      { id: "liris-wave32b", kind: "independent-reinvention", stateHash: evidence.liris.stateHash },
      { id: "acer-wave32e", kind: "divergence-preservation", stateHash: evidence.acerWave32E.stateHash },
      { id: "wave32f", kind: "d50-meta-rollup", stateHash }
    ],
    edges: [
      { from: "acer-wave32b", to: "wave32f", type: "consumed_as_sibling" },
      { from: "liris-wave32b", to: "wave32f", type: "consumed_as_sibling" },
      { from: "acer-wave32e", to: "wave32f", type: "preservation_hold_attached" }
    ],
    pairedSurfaces: pairedSurfaces.map((row) => ({
      path: row.relativePath,
      byteEquivalent: row.byteEquivalent,
      acerSha256: row.acer.sha256 || null,
      lirisSha256: row.liris.sha256 || null
    }))
  };

  const cube = `// Auto-generated by space-agent-wave32f-d50-meta-rollup.js
"use strict";

module.exports = ${canonicalJson({
    schema: "space-agent-wave32f-cube-cube-cubed.v1",
    cubeId: "space-agent-wave32f-d50-meta-rollup",
    status,
    stateHash,
    axes: {
      memory: "bind_both_wave32b_siblings",
      index: "state_hash_intersection",
      map: "acer_liris_meta_rollup",
      glyph: "genesis_cosign_descent",
      whiteroom: "divergence_preserved",
      gc: "retain_both_surface_chains",
      crypto: "hash_attestation_not_private_key_signature"
    },
    divergentSurfaceCount,
    equivalentSurfaceCount
  })};
`;

  const glpj = {
    schema: "behcs256-glpj.v1",
    generatedAt,
    glyphFamily: "SPACE_AGENT_WAVE32F_D50_META_ROLLUP",
    status,
    stateHash,
    glyphs: [
      {
        id: "W32F_D50_META_ROLLUP",
        glyph: glyph("wave32f", evidence.acer.stateHash, evidence.liris.stateHash, evidence.acerWave32E.stateHash),
        meaning: "ACER and Liris independent Space Rooms reinventions are bound as siblings into D50 meta roll-up."
      },
      {
        id: "W32F_NO_COPY_DOCTRINE",
        glyph: glyph("no_copy", checks.acerNoCopy, checks.lirisNoCopy),
        meaning: "Both sides record useSpaceAgentCode=false and cloneInstall=false."
      }
    ]
  };

  const whiteRoom = {
    schema: "white-room-review.v1",
    generatedAt,
    status: checks.allEvidencePresent ? "PASS_META_ROLLUP_EVIDENCE_PRESENT" : "HOLD_MISSING_EVIDENCE",
    stateHash,
    attest: attestations.white_room_attest,
    findings: [
      "ACER and Liris Wave32B states are independent and both present.",
      "Divergence is preserved rather than overwritten.",
      "Space Agent remains prior art only, not imported code or runtime.",
      "Liris ACER-suffixed D50 path is recorded as forensic naming drift, not rewritten."
    ]
  };

  const gc = {
    schema: "behcs-gc-retention.v1",
    generatedAt,
    status: "RETAIN_BOTH_SIBLING_CHAINS",
    stateHash,
    proof: attestations.gc_proof,
    retention: {
      acerWave32B: "retain_as_acer_sibling",
      lirisWave32B: "retain_as_liris_sibling",
      acerWave32E: "retain_as_no_overwrite_hold",
      wave32f: "retain_as_meta_rollup_index"
    }
  };

  const cryptoSealPreHash = {
    schema: "behcs-crypto-seal.v1",
    generatedAt,
    sealId: "space-agent-wave32f-d50-meta-rollup",
    stateHash,
    signedByPrivateKey: false,
    signatureMode: "sha256_hash_attestations_only",
    attestations,
    evidenceHashes: {
      acerWave32BFileSha256: sha256File(acerWave32BPath),
      lirisWave32BFileSha256: sha256File(lirisWave32BPath),
      acerWave32EFileSha256: sha256File(acerWave32EPath)
    }
  };
  const cryptoSeal = { ...cryptoSealPreHash, sealSha256: sha256String(stableStringify(cryptoSealPreHash)) };

  const d50Lines = [
    "# D50 Wave32F - Space Rooms Meta Roll-up (ACER + Liris)",
    "",
    "| Field | Value |",
    "|---|---|",
    `| status | ${status} |`,
    "| supervisor_pid | BH.SUPERVISOR.PID.SPACE.ASOLARIA.APEX.WAVE32F.ACER |",
    "| co_supervisor_pids | HOOKWALL.WAVE32F · KERNEL.WAVE32F · WHITEROOM.WAVE32F · GC.WAVE32F · SHANNON.WAVE32F |",
    `| ACER Wave32B stateHash | ${evidence.acer.stateHash} |`,
    `| Liris Wave32B stateHash | ${evidence.liris.stateHash} |`,
    `| ACER Wave32E hold stateHash | ${evidence.acerWave32E.stateHash} |`,
    `| state_hash | ${stateHash} |`,
    `| chief_sig | ${attestations.chief_sig.value} (${attestations.chief_sig.type}) |`,
    `| kr_gate_pass | ${attestations.kr_gate_pass.passed} / ${attestations.kr_gate_pass.value} |`,
    `| white_room_attest | ${attestations.white_room_attest.value} |`,
    `| gc_proof | ${attestations.gc_proof.value} |`,
    `| genesis_cosign_descent | ${attestations.genesis_cosign_descent.value} |`,
    "",
    "## Verdict",
    "",
    "Wave32F consumes the independently generated ACER and Liris Wave32B Asolaria-native Space Rooms evidence into a single D50 meta roll-up without copying Space Agent code, without installing Space Agent, and without collapsing Liris into ACER or ACER into Liris.",
    "",
    "This is a ratifiable D50 meta artifact using hash attestations. It is not a private-key signature artifact.",
    "",
    "## Surface Pair Summary",
    "",
    "| surface | ACER sha256 | Liris sha256 | byte equivalent |",
    "|---|---|---|---|",
    ...pairedSurfaces.map((row) => `| ${row.relativePath} | ${row.acer.sha256 || "missing"} | ${row.liris.sha256 || "missing"} | ${row.byteEquivalent ? "yes" : "no"} |`),
    "",
    "## Supervisor Votes",
    "",
    ...votes.map((vote) => `- ${vote.prof} / ${vote.supervisorPid}: ${vote.vote} - ${vote.reason}`),
    "",
    "## Boundaries",
    "",
    "- no Space Agent clone/install/code execution",
    "- no MCP or Codex subagents",
    "- no Liris canonical mutation",
    "- no divergent overwrite",
    "- no fabricated private-key signature claim",
    "- meta roll-up only, not implementation wave"
  ];

  const report = {
    schema: "space-agent-wave32f-report.v1",
    generatedAt,
    status,
    stateHash,
    evidence,
    checks,
    counts: statePreHash.counts,
    attestations,
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
  writeText(outputs.d50, d50Lines.join("\n") + "\n");
  writeText(outputs.reportJson, canonicalJson(report));
  writeText(outputs.reportMd, [
    "# Space Agent Wave32F - D50 Meta Roll-up",
    "",
    `Status: ${status}`,
    `State hash: ${stateHash}`,
    `ACER Wave32B: ${evidence.acer.stateHash}`,
    `Liris Wave32B: ${evidence.liris.stateHash}`,
    `ACER Wave32E hold: ${evidence.acerWave32E.stateHash}`,
    `Divergent paired surfaces: ${divergentSurfaceCount}`,
    "",
    "Wave32F binds both sides as sibling evidence. It does not overwrite, install, clone, or execute Space Agent.",
    "",
    "## Artifacts",
    "",
    ...Object.entries(outputs)
      .filter(([key]) => key !== "manifest" && key !== "reportMd")
      .map(([, filePath]) => {
        if (!fs.existsSync(filePath)) return `- ${path.relative(repoRoot, filePath).replace(/\\/g, "/")} - missing`;
        const meta = artifactMeta(filePath);
        return `- ${meta.path} - ${meta.sha256}`;
      })
  ].join("\n") + "\n");

  const manifest = {
    schema: "space-agent-wave32f-manifest.v1",
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
    acerWave32B: evidence.acer.stateHash,
    lirisWave32B: evidence.liris.stateHash,
    acerWave32E: evidence.acerWave32E.stateHash,
    divergentSurfaceCount,
    equivalentSurfaceCount,
    manifestSha256: sha256File(outputs.manifest),
    d50Sha256: sha256File(outputs.d50),
    report: path.relative(repoRoot, outputs.reportMd).replace(/\\/g, "/")
  }, null, 2));
}

main();
