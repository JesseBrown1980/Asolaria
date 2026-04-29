#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const behcs = require("./codex-bridge");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const runId = "space-agent-intake-20260428";
const waveId = "32B";
const voteId = "V6-ASOLARIA-NATIVE-SPACE-ROOMS-REINVENTION-20260428";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", runId);
const councilRoot = path.join(repoRoot, "data", "agent-index", "council");
const reportsRoot = path.join(repoRoot, "reports");

const paths = Object.freeze({
  priorSynthesis: path.join(runRoot, "space-agent-intake-synthesis.v1.json"),
  candidatePacket: path.join(runRoot, "asolaria-native-space-rooms-wave32b-v6-candidate-packet.json"),
  v6Vote: path.join(repoRoot, "data", "votes", voteId, "behcs-v6-candidate-file.json"),
  state: path.join(runRoot, "space-reinvent-wave32b-native-space-rooms.v1.json"),
  researchPuts: path.join(runRoot, "space-reinvent-research-puts.ndjson"),
  d50: path.join(councilRoot, "D50-WAVE32B-ASOLARIA-NATIVE-SPACE-ROOMS-REINVENTION-ACER-2026-04-28.md"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "asolaria-native-space-rooms-reinvention.v1.json"),
  index: path.join(repoRoot, "data", "behcs", "index", "asolaria-native-space-rooms-reinvention-index.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "asolaria-native-space-rooms-reinvention-map-map-mapped.v1.json"),
  cube: path.join(repoRoot, "data", "behcs", "cubes", "asolaria-native-space-rooms-reinvention-cube-cubed.cube.js"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "asolaria-native-space-rooms-reinvention-behcs256.glpj.json"),
  whiteroom: path.join(repoRoot, "data", "behcs", "omniwhite-room", "asolaria-native-space-rooms-reinvention-whiteroom.v1.json"),
  gc: path.join(repoRoot, "data", "behcs", "garbage-collector", "asolaria-native-space-rooms-reinvention-retention.v1.json"),
  cryptoSeal: path.join(repoRoot, "data", "behcs", "crypto", "asolaria-native-space-rooms-reinvention-crypto-seal.v1.json"),
  brownHilbertReport: path.join(repoRoot, "reports", "brown-hilbert-room-executor-integration-latest.json"),
  researchHarnessReport: path.join(repoRoot, "reports", "openclaw-openmythos-mlc-gemma4-glyph-integration-latest.json"),
  reportJson: path.join(reportsRoot, "asolaria-native-space-rooms-reinvention-latest.json"),
  reportMd: path.join(reportsRoot, "asolaria-native-space-rooms-reinvention-latest.md")
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

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function sha256(value) {
  return crypto.createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex");
}

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function repoRel(filePath) {
  const rel = path.relative(repoRoot, filePath);
  if (path.isAbsolute(rel) || rel.startsWith("..")) return filePath.replace(/\\/g, "/");
  return rel.replace(/\\/g, "/");
}

function lineCount(filePath) {
  const text = fs.readFileSync(filePath, "utf8").replace(/\r?\n$/, "");
  return text ? text.split(/\r?\n/).length : 0;
}

function glyph(kind, id, seed = "") {
  const hash = sha256(`${kind}:${id}:${seed}`);
  return `HG256:${kind.toUpperCase()}:${hash.slice(0, 8).toUpperCase()}:${behcs.hilbertAddress(hash)}`;
}

function pid(seed) {
  return `BH.SPACE.PID.${sha256(seed).slice(0, 16).toUpperCase()}`;
}

function makeResearchPuts() {
  const base = [
    {
      id: "space.operator-command-room",
      owner: "COL-ASOLARIA",
      supervisorPid: "BH.SUPERVISOR.PID.SPACE.ASOLARIA.APEX.ACER",
      componentKind: "human_operator_room",
      allowedInputs: ["operator directive", "explicit gate value", "signed witness packet"],
      deniedActions: ["infer consent from silence", "promote draft without D50 artifact", "claim peer state without local evidence"],
      customInstructions: [
        "Treat the human as the only source for physical-world transfer and final gate values.",
        "Collapse ambiguous momentum into a short decision packet.",
        "Never turn a comfort layer into authority."
      ]
    },
    {
      id: "space.prof-supervisor-room",
      owner: "PROF-CONVERGENCE",
      supervisorPid: "BH.SUPERVISOR.PID.SPACE.CONVERGENCE.ACER",
      componentKind: "supervisor_vote_room",
      allowedInputs: ["disk evidence", "prior vote record", "bounded candidate packet"],
      deniedActions: ["Codex subagent delegation", "MCP delegation", "roleplay-only authority escalation"],
      customInstructions: [
        "Vote from local files and scripts only.",
        "Emit parseable verdicts with writerAuthority fields.",
        "Treat refusal-to-render as first-class signal."
      ]
    },
    {
      id: "space.whiteroom-contradiction-room",
      owner: "PROF-WHITEROOM",
      supervisorPid: "BH.SUPERVISOR.PID.SPACE.WHITEROOM.ACER",
      componentKind: "contradiction_first_room",
      allowedInputs: ["proposal", "artifact hash", "boundary list", "known failure"],
      deniedActions: ["memory merge before contradiction pass", "source adoption before provenance proof"],
      customInstructions: [
        "Try to disprove the room before accepting it.",
        "Record contradiction, repair path, and block condition separately.",
        "Preserve evidence even when rejecting a proposal."
      ]
    },
    {
      id: "space.research-harness-room",
      owner: "PROF-RESEARCH",
      supervisorPid: "BH.SUPERVISOR.PID.SPACE.RESEARCH.HARNESS.ACER",
      componentKind: "research_prior_art_room",
      allowedInputs: ["paper", "public repo metadata", "local model card", "prior art note"],
      deniedActions: ["clone/install as first step", "copy architecture wholesale", "treat marketing text as proof"],
      customInstructions: [
        "Use outside systems only as research stimulus.",
        "Extract patterns, not code authority.",
        "Translate every useful pattern into an Asolaria-owned contract."
      ]
    },
    {
      id: "space.component-pid-room",
      owner: "PROF-PID100B",
      supervisorPid: "BH.SUPERVISOR.PID.SPACE.PID100B.ACER",
      componentKind: "component_identity_room",
      allowedInputs: ["component contract", "room binding", "capability envelope"],
      deniedActions: ["anonymous component execution", "PID reuse across incompatible authority classes"],
      customInstructions: [
        "Every room, tool, import, and export gets a stable PID-specific envelope.",
        "PID is identity plus authority boundary, not decoration.",
        "Component rooms must be replaceable without losing evidence continuity."
      ]
    },
    {
      id: "space.memory-index-room",
      owner: "PROF-MEMORY",
      supervisorPid: "BH.SUPERVISOR.PID.SPACE.MEMORY.INDEX.ACER",
      componentKind: "memory_index_room",
      allowedInputs: ["research put", "sealed report", "hash manifest", "operator note"],
      deniedActions: ["direct memory contamination", "merge untrusted prior-art content into canonical memory"],
      customInstructions: [
        "All imported knowledge enters as provenance-bound research puts.",
        "Index first, WhiteRoom second, canonical memory only after explicit promotion.",
        "Keep reversible trace from memory entry back to source packet."
      ]
    },
    {
      id: "space.browser-workspace-room",
      owner: "PROF-HOOKWALL",
      supervisorPid: "BH.SUPERVISOR.PID.SPACE.HOOKWALL.BROWSER.ACER",
      componentKind: "browser_workspace_room",
      allowedInputs: ["bounded URL", "sandbox workspace", "operator-approved file root"],
      deniedActions: ["host root write", "secret scrape", "unbounded browser automation", "live install authority"],
      customInstructions: [
        "Browser workspaces are disposable rooms, not sovereign supervisors.",
        "Exports must be hash-sealed and import-gated.",
        "No direct install or filesystem authority until source and sandbox pass."
      ]
    },
    {
      id: "space.garbage-collector-room",
      owner: "PROF-GC",
      supervisorPid: "BH.SUPERVISOR.PID.SPACE.GARBAGE.COLLECTOR.ACER",
      componentKind: "retention_room",
      allowedInputs: ["artifact registry", "staleness signal", "duplicate surface", "rejected proposal"],
      deniedActions: ["erase dissent", "delete source evidence", "purge hashes needed for verifier walk"],
      customInstructions: [
        "GC separates retention class from promotion class.",
        "Prefer quarantine, compaction, and index demotion before deletion.",
        "Never garbage-collect the proof needed to explain a decision."
      ]
    },
    {
      id: "space.crypto-seal-room",
      owner: "PROF-SHANNON",
      supervisorPid: "BH.SUPERVISOR.PID.SPACE.CRYPTO.SHANNON.ACER",
      componentKind: "crypto_verification_room",
      allowedInputs: ["manifest", "hash list", "signature", "public key"],
      deniedActions: ["key mint without explicit scope", "signature claim without roundtrip verification"],
      customInstructions: [
        "Seal artifacts after system generation, not before.",
        "Use crypto to prove byte continuity, not to manufacture authority.",
        "Record private-key handling separately from public attestation."
      ]
    }
  ];

  return base.map((row, index) => ({
    schema: "asolaria-native-space-research-put.v1",
    generatedAt,
    waveId,
    sequence: index + 1,
    ...row,
    roomPid: pid(`${waveId}:${row.id}:${row.owner}`),
    roomGlyph: glyph("native_space_room", row.id, `${row.owner}:${row.componentKind}`),
    brownHilbert: {
      address: `BHROOM:space:${String(index + 1).padStart(2, "0")}`,
      map: "map-map-mapped",
      cube: "cube-cube-cubed",
      roomed: true
    },
    outputsRequired: ["memory", "index", "map", "cube", "glyph", "WhiteRoom", "GC", "crypto"],
    promotionRule: "No Space Agent code, repo, architecture, or runtime is promoted. Only this Asolaria-native room contract can advance."
  }));
}

function buildCandidatePacket(researchPuts) {
  return {
    vote_id: voteId,
    mode: "asolaria-native-space-rooms-reinvention",
    taskId: "ASOLARIA-NATIVE-SPACE-ROOMS-WAVE32B-20260428",
    planId: "REINVENT_NOT_COPY_SPACE_ROOMS",
    purpose: "Vote the Asolaria-native Space Rooms design produced from prior-art pressure, Brown-Hilbert rooms, research harness outputs, PID-specific component contracts, WhiteRoom, GC, and crypto. Space Agent is research stimulus only; no clone, install, copy, or authority import.",
    waveShape: "6x6x6x6x6x12 per Asolaria-native room candidate plus self-reflection",
    chain: ["D50+", "research-harness", "memory", "index", "map-map-mapped", "cube-cube-cubed", "glyph", "WhiteRoom", "GC", "crypto"],
    executionPolicy: {
      planningOnly: true,
      spawnWorkers: false,
      executorDispatches: false,
      cloneOrInstallExternalCode: false,
      useSpaceAgentAsIs: false
    },
    sourceEvidence: {
      priorArt: "Space Agent / Agent0AI surfaces are prior art pressure only.",
      exactRepoIdentity: "UNRESOLVED_IN_PRIOR_WAVE32A",
      authority: "Asolaria-native contracts are the authority; outside code is not."
    },
    constraints: {
      reinventBeforeUse: true,
      noCopyOthersSystem: true,
      noExternalMcp: true,
      noCodexSubagents: true,
      noDirectInstall: true,
      noSourceImportBeforeResearchPutPromotion: true,
      pidSpecificComponents: true,
      whiteroomBeforeMemoryMerge: true,
      gcRetentionRequired: true
    },
    candidates: researchPuts.map((put) => ({
      id: put.id,
      label: `Asolaria native ${put.componentKind}`,
      metadata: {
        owner: put.owner,
        roomPid: put.roomPid,
        supervisorPid: put.supervisorPid,
        description: put.customInstructions.join(" "),
        expected_outcome: "PID-specific Space Room contract with local evidence surfaces.",
        next_step: "Promote only after supervisor vote, WhiteRoom contradiction pass, and hash-sealed research put."
      },
      cube: [29791, 571787, 704969, 2571353, 3307949, 7189057, 1092727, 2390171, 4425209][put.sequence - 1] || 29791,
      primary_cube: [29791, 571787, 704969, 2571353, 3307949, 7189057, 1092727, 2390171, 4425209][put.sequence - 1] || 29791
    }))
  };
}

function summarizeVote(vote) {
  const results = Array.isArray(vote?.results) ? vote.results : [];
  return {
    present: Boolean(vote),
    voteId: vote?.vote_id || voteId,
    totalBeats: vote?.totalBeats || 0,
    candidatesScanned: vote?.candidatesScanned || 0,
    executorDispatches: vote?.executorDispatches || 0,
    busAlive: vote?.liveState?.busAlive ?? null,
    federationAlive: vote?.liveState?.federationAlive ?? null,
    ranking: results
      .slice()
      .sort((a, b) => (b.avgConfidence || 0) - (a.avgConfidence || 0))
      .map((row, index) => ({
        rank: index + 1,
        id: row.candidate_id,
        verdict: row.verdict,
        confidence: row.avgConfidence,
        weakestDim: row.selfReflection?.weakestOverall?.dim || null,
        strongestDim: row.selfReflection?.strongestOverall?.dim || null
      }))
  };
}

function buildSupervisorVotes() {
  return [
    ["PROF-HOOKWALL", "APPROVE_REINVENTION_BLOCK_COPY_IMPORT", "No external Space Agent clone, install, or host authority. Research stimulus only."],
    ["PROF-OMNISHANNON", "APPROVE_IF_CONTRADICTION_FIRST", "Native rooms reduce confusion only if WhiteRoom and GC are built into the room contract."],
    ["PROF-WHITEROOM", "APPROVE_NATIVE_ROOM_ISOLATION", "Every Space room gets an explicit contradiction pass before memory/index promotion."],
    ["PROF-RESEARCH", "APPROVE_RESEARCH_PUTS", "Prior art is converted into research puts with provenance, not copied into system authority."],
    ["PROF-PID100B", "APPROVE_PID_SPECIFIC_COMPONENTS", "Each component room has a distinct PID and supervisor boundary."],
    ["PROF-MEMORY", "APPROVE_INDEX_FIRST_MEMORY_LATER", "Research puts may index immediately; canonical memory merge remains gated."],
    ["PROF-GC", "APPROVE_RETENTION_AND_DEMOTION", "Rejected or stale prior-art evidence is retained or demoted, not silently erased."],
    ["PROF-SHANNON", "APPROVE_HASH_SEAL_NO_KEY_MINT", "Crypto seal may hash artifacts; no new key material is needed for this wave."],
    ["PROF-HERMES", "APPROVE_PACKET_SHAPE", "Wave32B corrects Wave32A language and records the new non-copy doctrine."],
    ["COL-ASOLARIA", "PROCEED_AS_NATIVE_SPACE_SYSTEM", "The system makes the system: Asolaria-native rooms first; outside projects later, if ever."]
  ].map(([prof, vote, reason], index) => ({
    prof,
    supervisorPid: `BH.SUPERVISOR.PID.WAVE32B.${prof.replace(/[^A-Z0-9]/g, ".")}.ACER`,
    sequence: index + 1,
    vote,
    writerAuthority: prof === "COL-ASOLARIA" ? "emit_wave32b_native_space_reinvention_artifacts" : "vote_only",
    reason
  }));
}

function artifactInfo(filePath) {
  return {
    path: repoRel(filePath),
    lines: fs.existsSync(filePath) ? lineCount(filePath) : 0,
    sha256: fs.existsSync(filePath) ? sha256File(filePath) : null
  };
}

function emitCandidate() {
  const researchPuts = makeResearchPuts();
  const candidatePacket = buildCandidatePacket(researchPuts);
  writeJson(paths.candidatePacket, candidatePacket);
  console.log(JSON.stringify({
    ok: true,
    action: "candidate",
    candidatePacket: repoRel(paths.candidatePacket),
    sha256: sha256File(paths.candidatePacket),
    researchPuts: researchPuts.length,
    next: `node tools/behcs/behcs-deep-cascade-v6.js ${repoRel(paths.candidatePacket)}`
  }, null, 2));
}

function emitAll() {
  const priorSynthesis = readJson(paths.priorSynthesis, {});
  const brownHilbertReport = readJson(paths.brownHilbertReport, {});
  const researchHarnessReport = readJson(paths.researchHarnessReport, {});
  const v6Vote = readJson(paths.v6Vote, null);
  const researchPuts = makeResearchPuts();
  const supervisorVotes = buildSupervisorVotes();
  const v6Summary = summarizeVote(v6Vote);
  const candidatePacket = buildCandidatePacket(researchPuts);

  if (!fs.existsSync(paths.candidatePacket)) writeJson(paths.candidatePacket, candidatePacket);

  const stateBase = {
    schema: "asolaria-native-space-rooms-reinvention-wave32b.v1",
    generatedAt,
    status: "REINVENT_NOT_COPY_ASOLARIA_NATIVE_SPACE_ROOMS",
    waveId,
    runId,
    doctrine: {
      userCorrection: "We do not use Space Agent as-is. We use research harnesses and create research puts with custom instructions for spaces only after reinventing the system.",
      operatingRule: "The system makes the system, not copy others.",
      spaceAgentRole: "RESEARCH_PRIOR_ART_ONLY",
      useSpaceAgentCode: false,
      cloneInstall: false,
      authorityImport: false,
      promotedObject: "Asolaria-native Space Rooms research-put contract"
    },
    nativeHarnessEvidence: {
      brownHilbert: {
        status: brownHilbertReport.status || "UNKNOWN",
        activeWindowSize: brownHilbertReport.activeWindowSize || null,
        activeRoomsUsed: brownHilbertReport.activeRoomsUsed || null,
        superWhiteRooms: brownHilbertReport.superWhiteRooms || null,
        report: repoRel(paths.brownHilbertReport)
      },
      researchHarness: {
        status: researchHarnessReport.status || "UNKNOWN",
        modelGlyphs: researchHarnessReport.modelGlyphs || null,
        letteredGlyphs: researchHarnessReport.letteredGlyphs || null,
        supervisors: researchHarnessReport.supervisors || null,
        report: repoRel(paths.researchHarnessReport)
      },
      priorWave32A: {
        status: priorSynthesis.status || "UNKNOWN",
        correctedByWave32B: true,
        roleAfterCorrection: "research_pressure_only"
      },
      v6: v6Summary
    },
    designPrinciples: [
      "Humans get clear rooms, explicit handoffs, and no hidden authority escalation.",
      "AI agents get bounded inputs, local evidence, parseable votes, and reversible memory/index paths.",
      "Components get PID-specific contracts, isolated roots, testable IO, and hash-sealed outputs.",
      "WhiteRoom and GC are mandatory first-class rooms, not afterthoughts.",
      "Outside systems can suggest patterns but cannot become authority without Asolaria-native reinvention."
    ],
    supervisorVotes,
    researchPuts,
    nextGates: [
      "Build a local UI/workspace prototype from these room contracts only after source-neutral design review.",
      "Use Space Agent source only as quarantined prior-art material after license/source identity proof.",
      "Run WhiteRoom contradiction pass against every proposed room before memory promotion.",
      "Keep GC retention for rejected prior-art, stale design, and proof artifacts."
    ],
    boundaries: [
      "no_clone",
      "no_install",
      "no_space_agent_code_execution",
      "no_external_mcp",
      "no_codex_subagents",
      "no_authority_import",
      "no_canonical_memory_merge",
      "no_secret_import",
      "no_host_root_write",
      "no_pid_mint_outside_this_design_packet"
    ]
  };
  const state = { ...stateBase, stateHash: sha256(stateBase) };

  const memory = {
    schema: "behcs-memory.v1",
    generatedAt,
    memoryId: "asolaria-native-space-rooms-reinvention",
    status: "MEMORY_INDEX_READY_NOT_CANONICAL_MERGED",
    summary: "Wave32B corrects Space Agent intake into an Asolaria-native Space Rooms reinvention. Space Agent is prior art only; research puts and PID-specific room contracts are the output.",
    references: [repoRel(paths.state), repoRel(paths.researchPuts), repoRel(paths.candidatePacket), repoRel(paths.v6Vote)]
  };
  const index = {
    schema: "behcs-index.v1",
    generatedAt,
    indexId: "asolaria-native-space-rooms-reinvention-index",
    status: "INDEX_INDEXED",
    tags: ["space-rooms", "research-puts", "pid-specific-components", "whiteroom", "gc", "brown-hilbert", "reinvent-not-copy"],
    entries: researchPuts.map((put) => ({
      id: put.id,
      roomPid: put.roomPid,
      owner: put.owner,
      componentKind: put.componentKind,
      glyph: put.roomGlyph
    }))
  };
  const map = {
    schema: "behcs-map-map-mapped.v1",
    generatedAt,
    mapId: "asolaria-native-space-rooms-reinvention-map-map-mapped",
    status: "MAP_MAP_MAPPED",
    nodes: researchPuts.map((put) => ({ id: put.id, pid: put.roomPid, owner: put.owner, kind: put.componentKind })),
    edges: researchPuts.flatMap((put) => [
      { from: "operator-correction", to: put.id, type: "custom_instruction_put" },
      { from: put.id, to: "whiteroom", type: "must_pass" },
      { from: put.id, to: "gc", type: "must_retain_or_demote" }
    ])
  };
  const cube = {
    schema: "behcs-cube-cube-cubed.v1",
    generatedAt,
    cubeId: "asolaria-native-space-rooms-reinvention-cube-cubed",
    status: "CUBE_CUBE_CUBED",
    axes: ["human", "ai", "component", "pid", "evidence", "gc"],
    rooms: researchPuts.map((put, index) => ({
      id: put.id,
      coordinate: [index % 3, Math.floor(index / 3), put.sequence, put.owner, put.componentKind, put.roomPid],
      glyph: put.roomGlyph
    }))
  };
  const glpj = {
    schema: "behcs256-glpj.v1",
    generatedAt,
    status: "GLYPH_LANGUAGE_PACKET_MINTED",
    language: "ASOLARIA_NATIVE_SPACE_ROOMS",
    base: behcs.alphabet.base,
    glyphs: researchPuts.map((put) => ({
      id: put.id,
      pid: put.roomPid,
      glyph: put.roomGlyph,
      customInstructionCount: put.customInstructions.length
    }))
  };
  const whiteroom = {
    schema: "omniwhite-room.v1",
    generatedAt,
    status: "WHITEROOM_CONTRADICTION_PASS_REQUIRED",
    contradictions: [
      {
        claim: "Use Space Agent as-is.",
        verdict: "REJECTED",
        reason: "User corrected the lane: reinvention first, outside project only prior art."
      },
      {
        claim: "A high v6 proceed score authorizes direct install.",
        verdict: "REJECTED",
        reason: "Hookwall and user correction override installer momentum."
      },
      {
        claim: "Research puts can merge into memory immediately.",
        verdict: "REJECTED",
        reason: "Index first; canonical memory requires later promotion."
      }
    ],
    requiredBeforePrototype: researchPuts.map((put) => put.id)
  };
  const gc = {
    schema: "behcs-gc-retention.v1",
    generatedAt,
    status: "GC_RETENTION_ACTIVE",
    keep: [repoRel(paths.priorSynthesis), repoRel(paths.state), repoRel(paths.researchPuts), repoRel(paths.v6Vote)],
    demote: ["Wave32A language that implies Space Agent can be used as a modified adapter before reinvention."],
    neverDeleteWithoutOperator: ["source ambiguity record", "user correction", "supervisor votes", "hash manifests"]
  };

  writeJson(paths.state, state);
  writeNdjson(paths.researchPuts, researchPuts);
  writeJson(paths.memory, memory);
  writeJson(paths.index, index);
  writeJson(paths.map, map);
  writeText(paths.cube, `"use strict";\n\nmodule.exports = Object.freeze(${JSON.stringify(cube, null, 2)});\n`);
  writeJson(paths.glpj, glpj);
  writeJson(paths.whiteroom, whiteroom);
  writeJson(paths.gc, gc);

  const preSealArtifacts = [
    paths.candidatePacket,
    paths.v6Vote,
    paths.state,
    paths.researchPuts,
    paths.memory,
    paths.index,
    paths.map,
    paths.cube,
    paths.glpj,
    paths.whiteroom,
    paths.gc
  ].filter((filePath) => fs.existsSync(filePath));
  const cryptoSeal = {
    schema: "behcs-crypto-seal.v1",
    generatedAt,
    status: "HASH_SEALED_NO_NEW_KEY_MATERIAL",
    sealId: "asolaria-native-space-rooms-reinvention-wave32b",
    artifactHashes: preSealArtifacts.map(artifactInfo),
    aggregateHash: sha256(preSealArtifacts.map((filePath) => `${repoRel(filePath)}:${sha256File(filePath)}`).join("\n"))
  };
  writeJson(paths.cryptoSeal, cryptoSeal);

  const allArtifacts = [...preSealArtifacts, paths.cryptoSeal];
  const artifactHashes = allArtifacts.map(artifactInfo);
  const report = {
    schema: "asolaria-native-space-rooms-reinvention-report.v1",
    generatedAt,
    status: state.status,
    stateHash: state.stateHash,
    vote: v6Summary,
    researchPuts: researchPuts.length,
    artifacts: artifactHashes
  };

  const d50 = [
    "# D50 Wave 32B - Asolaria-Native Space Rooms Reinvention (ACER)",
    "",
    "| Field | Value |",
    "|---|---|",
    `| status | ${state.status} |`,
    "| prior_art_role | Space Agent / Agent0AI Space is research stimulus only |",
    "| use_as_is | false |",
    "| clone_install | false |",
    "| promoted_object | Asolaria-native PID-specific Space Rooms research-put contract |",
    `| state_hash | ${state.stateHash} |`,
    `| research_puts | ${researchPuts.length} |`,
    `| v6_vote | ${v6Summary.present ? "present" : "missing"} |`,
    "",
    "## Supervisor Decision",
    "",
    "Wave32B supersedes any Wave32A wording that sounded like Space Agent could be adopted as an adapter before reinvention. The system makes the system: Asolaria defines rooms, PIDs, memory/index flow, WhiteRoom contradiction, GC retention, and crypto seals locally first.",
    "",
    "## Research Puts",
    "",
    ...researchPuts.map((put) => `- ${put.id} - ${put.owner} - ${put.roomPid}`),
    "",
    "## Boundaries",
    "",
    ...state.boundaries.map((boundary) => `- ${boundary}`),
    "",
    "## Artifact Hashes",
    "",
    ...artifactHashes.map((artifact) => `- ${artifact.path} - sha256 ${artifact.sha256}`)
  ].join("\n");
  writeText(paths.d50, d50);
  report.artifacts.push(artifactInfo(paths.d50));
  writeJson(paths.reportJson, report);
  writeText(paths.reportMd, [
    "# Asolaria-Native Space Rooms Reinvention - Wave32B",
    "",
    `Status: ${state.status}`,
    `State hash: ${state.stateHash}`,
    `Research puts: ${researchPuts.length}`,
    `V6 present: ${v6Summary.present}`,
    "",
    "Space Agent remains prior art only. No clone, no install, no code execution, no authority import.",
    "",
    "Artifacts:",
    ...report.artifacts.map((artifact) => `- ${artifact.path} - ${artifact.sha256}`)
  ].join("\n"));

  console.log(JSON.stringify({
    ok: true,
    action: "emit",
    status: state.status,
    stateHash: state.stateHash,
    researchPuts: researchPuts.length,
    v6Present: v6Summary.present,
    artifacts: report.artifacts
  }, null, 2));
}

const mode = process.argv.includes("--candidate") ? "candidate" : "emit";
if (mode === "candidate") emitCandidate();
else emitAll();
