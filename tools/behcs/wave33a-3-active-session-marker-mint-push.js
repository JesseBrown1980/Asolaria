#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const os = require("os");
const http = require("http");
const behcs = require("./codex-bridge");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const runId = "wave33a-agent-terminal-load-control-20260428";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", runId);
const councilRoot = path.join(repoRoot, "data", "agent-index", "council");
const reportsRoot = path.join(repoRoot, "reports");
const lirisShareRoot = "\\\\192.168.100.2\\liris-asolaria-old";
const lirisIncomingRoot = path.join(
  lirisShareRoot,
  "data",
  "behcs",
  "orchestration",
  "federation-reintegration-20260427",
  "incoming-acer"
);
const remoteBundleRoot = path.join(lirisIncomingRoot, "wave33a-3-active-session-marker-push");
const remotePatchRoot = path.join(lirisIncomingRoot, "wave33b-wave33a3-liris-reciprocal-mint-patch");
const lirisLaw001 = process.env.LIRIS_LAW001_URL || "http://192.168.100.2:4947/behcs/send";
const acerLaw001 = process.env.ACER_LAW001_URL || "http://192.168.100.1:4947/behcs/send";

const cosignReceiptId = "behcs-467a7c51011c";
const matrixReceiptId = "behcs-01a30ec3543b";
const voteId = "WAVE33A-AGENT-TERMINAL-LOAD-CONTROL-20260428";

const paths = Object.freeze({
  script: __filename,
  inbox: path.join(repoRoot, "data", "behcs", "inbox.ndjson"),
  candidatePacket: path.join(runRoot, "wave33a-supervisor-vote-candidate-packet.json"),
  v6Vote: path.join(repoRoot, "data", "votes", voteId, "behcs-v6-candidate-file.json"),
  markdownDraft: path.join(repoRoot, "AGENT-TERMINAL-LOAD-CONTRACT.md"),
  mapDraft: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "agent-terminal-load-control-contract-map-map-mapped.v1.json"),
  activeLock: path.join(repoRoot, ".asolaria-active-session.lock"),
  state: path.join(runRoot, "wave33a-3-active-session-marker.v1.json"),
  manifest: path.join(runRoot, "wave33a-3-active-session-marker-manifest.json"),
  votes: path.join(runRoot, "wave33a-3-active-session-marker-supervisor-votes.ndjson"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "wave33a-3-active-session-marker.v1.json"),
  index: path.join(repoRoot, "data", "behcs", "index", "wave33a-3-active-session-marker-index.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "wave33a-3-active-session-marker-map-map-mapped.v1.json"),
  cube: path.join(repoRoot, "data", "behcs", "cubes", "wave33a-3-active-session-marker-cube-cubed.cube.js"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "wave33a-3-active-session-marker-behcs256.glpj.json"),
  whiteroom: path.join(repoRoot, "data", "behcs", "omniwhite-room", "wave33a-3-active-session-marker-whiteroom.v1.json"),
  gc: path.join(repoRoot, "data", "behcs", "garbage-collector", "wave33a-3-active-session-marker-retention.v1.json"),
  cryptoSeal: path.join(repoRoot, "data", "behcs", "crypto", "wave33a-3-active-session-marker-crypto-seal.v1.json"),
  d50: path.join(councilRoot, "D50-WAVE33A-3-ACTIVE-SESSION-MARKER-ACER-2026-04-28.md"),
  pushManifest: path.join(runRoot, "wave33a-3-active-session-marker-push-manifest.json"),
  pushState: path.join(runRoot, "wave33a-3-active-session-marker-push-acer.v1.json"),
  completionEnvelope: path.join(runRoot, "law001-wave33a-3-active-session-marker-complete-envelope.json"),
  completionPostResult: path.join(runRoot, "law001-wave33a-3-active-session-marker-complete-post-result.json"),
  phaseRoot: path.join(runRoot, "phase-markers"),
  lirisReciprocalState: path.join(runRoot, "wave33a-3-active-session-marker-liris.v1.json"),
  lirisReciprocalVotes: path.join(runRoot, "wave33a-3-active-session-marker-liris-supervisor-votes.ndjson"),
  lirisReciprocalMemory: path.join(repoRoot, "data", "behcs", "memory", "wave33a-3-active-session-marker-liris.v1.json"),
  lirisReciprocalIndex: path.join(repoRoot, "data", "behcs", "index", "wave33a-3-active-session-marker-liris-index.v1.json"),
  lirisReciprocalMap: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "wave33a-3-active-session-marker-liris-map-map-mapped.v1.json"),
  lirisReciprocalCube: path.join(repoRoot, "data", "behcs", "cubes", "wave33a-3-active-session-marker-liris-cube-cubed.cube.js"),
  lirisReciprocalGlpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "wave33a-3-active-session-marker-liris-behcs256.glpj.json"),
  lirisReciprocalWhiteroom: path.join(repoRoot, "data", "behcs", "omniwhite-room", "wave33a-3-active-session-marker-liris-whiteroom.v1.json"),
  lirisReciprocalGc: path.join(repoRoot, "data", "behcs", "garbage-collector", "wave33a-3-active-session-marker-liris-retention.v1.json"),
  lirisReciprocalCryptoSeal: path.join(repoRoot, "data", "behcs", "crypto", "wave33a-3-active-session-marker-liris-crypto-seal.v1.json"),
  lirisReciprocalD50: path.join(councilRoot, "D50-WAVE33A-3-ACTIVE-SESSION-MARKER-LIRIS-2026-04-28.md"),
  lirisReciprocalReportJson: path.join(reportsRoot, "wave33a-3-active-session-marker-liris-latest.json"),
  lirisReciprocalReportMd: path.join(reportsRoot, "wave33a-3-active-session-marker-liris-latest.md"),
  lirisReciprocalEnvelope: path.join(runRoot, "law001-wave33a-3-active-session-marker-liris-reciprocal-envelope.json"),
  lirisReciprocalPostResult: path.join(runRoot, "law001-wave33a-3-active-session-marker-liris-reciprocal-post-result.json"),
  patchState: path.join(runRoot, "wave33b-wave33a3-liris-reciprocal-mint-patch-acer.v1.json"),
  patchManifest: path.join(runRoot, "wave33b-wave33a3-liris-reciprocal-mint-patch-manifest.json"),
  patchD50: path.join(councilRoot, "D50-WAVE33B-WAVE33A3-LIRIS-RECIPROCAL-MINT-PATCH-ACER-2026-04-28.md"),
  patchReportJson: path.join(reportsRoot, "wave33b-wave33a3-liris-reciprocal-mint-patch-latest.json"),
  patchReportMd: path.join(reportsRoot, "wave33b-wave33a3-liris-reciprocal-mint-patch-latest.md"),
  patchEnvelope: path.join(runRoot, "law001-wave33b-wave33a3-liris-reciprocal-mint-patch-envelope.json"),
  patchPostResult: path.join(runRoot, "law001-wave33b-wave33a3-liris-reciprocal-mint-patch-post-result.json"),
  reportJson: path.join(reportsRoot, "wave33a-3-active-session-marker-latest.json"),
  reportMd: path.join(reportsRoot, "wave33a-3-active-session-marker-latest.md")
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

function phase(name, detail = {}) {
  const marker = {
    schema: "wave33a3-phase-marker.v1",
    ts: new Date().toISOString(),
    phase: name,
    host: os.hostname(),
    pid: process.pid,
    cwd: process.cwd(),
    script: repoRel(__filename),
    ...detail
  };
  try {
    const safe = name.replace(/[^A-Za-z0-9_.-]+/g, "_");
    writeJson(path.join(paths.phaseRoot, `${Date.now()}-${safe}.json`), marker);
  } catch (_error) {
    // Phase markers must never become the failure source.
  }
  try {
    process.stderr.write(`[wave33a3] ${name}\n`);
  } catch (_error) {
    // Ignore console failures.
  }
  return marker;
}

function writeNdjson(filePath, rows) {
  writeText(filePath, rows.map((row) => JSON.stringify(row)).join("\n"));
}

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_error) {
    return fallback;
  }
}

function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function sha256Text(value) {
  return sha256Buffer(Buffer.from(String(value), "utf8"));
}

function sha256Json(value) {
  return sha256Text(JSON.stringify(sortDeep(value)));
}

function sha256File(filePath) {
  return sha256Buffer(fs.readFileSync(filePath));
}

function sortDeep(value) {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortDeep(value[key])]));
  }
  return value;
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

function artifactInfo(filePath) {
  if (!fs.existsSync(filePath)) {
    return { path: repoRel(filePath), present: false, sha256: null, bytes: 0, lines: 0 };
  }
  const buffer = fs.readFileSync(filePath);
  return {
    path: repoRel(filePath),
    present: true,
    sha256: sha256Buffer(buffer),
    bytes: buffer.length,
    lines: lineCount(buffer)
  };
}

function inspectAbsolute(filePath) {
  if (!fs.existsSync(filePath)) {
    return { present: false, path: filePath.replace(/\\/g, "/"), sha256: null, bytes: 0, lines: 0 };
  }
  const buffer = fs.readFileSync(filePath);
  return {
    present: true,
    path: filePath.replace(/\\/g, "/"),
    sha256: sha256Buffer(buffer),
    bytes: buffer.length,
    lines: lineCount(buffer)
  };
}

function glyph(kind, id, seed = "") {
  const hash = sha256Text(`${kind}:${id}:${seed}`);
  return `HG256:${kind.toUpperCase()}:${hash.slice(0, 8).toUpperCase()}:${behcs.hilbertAddress(hash)}`;
}

function readInboxReceipt(id) {
  if (!fs.existsSync(paths.inbox)) return null;
  const lines = fs.readFileSync(paths.inbox, "utf8").split(/\r?\n/);
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index];
    if (!line || !line.includes(id)) continue;
    try {
      const row = JSON.parse(line);
      if (row.id === id) return { line: index + 1, row };
    } catch (_error) {
      return { line: index + 1, parseError: "invalid_json" };
    }
  }
  return null;
}

function requireReceipt(id) {
  const receipt = readInboxReceipt(id);
  if (!receipt || !receipt.row) {
    throw new Error(`Missing required LAW-001 receipt ${id} in ${repoRel(paths.inbox)}`);
  }
  const row = receipt.row;
  if (row.gated !== true || row.d0?.verdict !== "PROCEED" || row.d0?.gatePass !== true) {
    throw new Error(`LAW-001 receipt ${id} is not gated PROCEED`);
  }
  return {
    id,
    line: receipt.line,
    schema: row.schema || null,
    verb: row.verb || null,
    type: row.type || null,
    from: row.from || null,
    to: row.to || null,
    receivedAt: row.received_at || null,
    gated: row.gated,
    d0: row.d0,
    operatorCosign: row.operator_cosign || null,
    bodySummary: {
      cascadeStatus: row.body?.cascade_status || null,
      subWave: row.body?.greenlight_to_acer_for_33a_3?.sub_wave || null,
      ordering: row.body?.cosign_ordering_confirmed || null,
      disposition: row.body?.cosign_disposition_confirmed || null
    },
    rawSha256: sha256Json(row)
  };
}

function validateInputs() {
  const matrixReceipt = requireReceipt(matrixReceiptId);
  const cosignReceipt = requireReceipt(cosignReceiptId);
  const candidatePacket = readJson(paths.candidatePacket);
  const v6Vote = readJson(paths.v6Vote);
  const mapDraft = readJson(paths.mapDraft);
  const markdownText = fs.existsSync(paths.markdownDraft) ? fs.readFileSync(paths.markdownDraft, "utf8") : "";

  if (!candidatePacket) throw new Error(`Missing candidate packet: ${repoRel(paths.candidatePacket)}`);
  if (!v6Vote) throw new Error(`Missing v6 vote file: ${repoRel(paths.v6Vote)}`);
  if (!mapDraft) throw new Error(`Missing map draft: ${repoRel(paths.mapDraft)}`);
  if (!markdownText.trim()) throw new Error(`Missing markdown draft: ${repoRel(paths.markdownDraft)}`);
  if (v6Vote.vote_id !== voteId) throw new Error(`Unexpected v6 vote id: ${v6Vote.vote_id}`);
  if (v6Vote.executorDispatches !== 0) throw new Error("Wave33A v6 vote did not preserve executorDispatches=0");

  const results = Array.isArray(v6Vote.results) ? v6Vote.results : [];
  const markdownVote = results.find((row) => row.candidate_id === "agent-terminal-load-contract-md");
  const mapVote = results.find((row) => row.candidate_id === "agent-terminal-load-control-contract-map-v1");
  if (!markdownVote || markdownVote.verdict !== "PROCEED") throw new Error("Markdown draft is not v6 PROCEED");
  if (!mapVote || mapVote.verdict !== "PROCEED") throw new Error("Map draft is not v6 PROCEED");

  return {
    matrixReceipt,
    cosignReceipt,
    candidatePacket,
    v6Vote,
    mapDraft,
    markdownText,
    draftArtifacts: [paths.markdownDraft, paths.mapDraft].map(artifactInfo),
    v6Summary: {
      voteId: v6Vote.vote_id,
      voteFile: repoRel(paths.v6Vote),
      totalBeats: v6Vote.totalBeats,
      beatsPerCandidate: v6Vote.beatsPerCandidate,
      candidatesScanned: v6Vote.candidatesScanned,
      executorDispatches: v6Vote.executorDispatches,
      markdown: {
        verdict: markdownVote.verdict,
        avgConfidence: markdownVote.avgConfidence,
        totalBeats: markdownVote.totalBeats
      },
      map: {
        verdict: mapVote.verdict,
        avgConfidence: mapVote.avgConfidence,
        totalBeats: mapVote.totalBeats
      }
    }
  };
}

function buildSupervisorVotes(input) {
  return [
    {
      prof: "PROF-HOOKWALL",
      supervisorPid: "BH.SUPERVISOR.PID.WAVE33A.ACTIVE_SESSION.HOOKWALL.ACER",
      vote: "APPROVE_ACTIVE_MARKER_BOUNDED_WRITE",
      reason: "The only runtime root write is .asolaria-active-session.lock; no hooks, adapters, installers, or self-update paths are mutated."
    },
    {
      prof: "PROF-WHITEROOM",
      supervisorPid: "BH.SUPERVISOR.PID.WAVE33A.ACTIVE_SESSION.WHITEROOM.ACER",
      vote: "PASS_CONTRADICTION_LAYER",
      reason: "The marker does not promote the draft markdown or map as canon. They are research inputs to a fresh supervisor-authored marker surface."
    },
    {
      prof: "PROF-SHANNON",
      supervisorPid: "BH.SUPERVISOR.PID.WAVE33A.ACTIVE_SESSION.SHANNON.ACER",
      vote: "HASH_SEAL_REQUIRED",
      reason: "All emitted surfaces and the Liris push bundle must be sha256-addressed before LAW-001 completion."
    },
    {
      prof: "PROF-HERMES",
      supervisorPid: "BH.SUPERVISOR.PID.WAVE33A.ACTIVE_SESSION.HERMES.ACER",
      vote: "ROUTE_THROUGH_LAW001_AND_SMB",
      reason: `Jesse cosign receipt ${input.cosignReceipt.id} is gated PROCEED; completion returns through LAW-001 after hash-gated SMB push.`
    },
    {
      prof: "PROF-KERNEL",
      supervisorPid: "BH.SUPERVISOR.PID.WAVE33A.ACTIVE_SESSION.KERNEL.ACER",
      vote: "GRAMMAR_OK",
      reason: "The lock is JSON, passive, bounded, and machine-readable by future Codex/Claude loads without granting authority."
    },
    {
      prof: "PROF-GC",
      supervisorPid: "BH.SUPERVISOR.PID.WAVE33A.ACTIVE_SESSION.GC.ACER",
      vote: "RETAIN_DRAFTS_AND_MARKER_PROOF",
      reason: "The two ABSORB drafts remain evidence; rejected or deferred Wave33A drafts are not deleted or promoted."
    },
    {
      prof: "COL-ASOLARIA",
      supervisorPid: "BH.SUPERVISOR.PID.WAVE33A.ACTIVE_SESSION.ASOLARIA.APEX.ACER",
      vote: "PROCEED_33A_3_MINT_AND_PUSH",
      reason: "Operator Jesse explicitly broke the cosign wait loop for 33A-3 only."
    }
  ];
}

function buildActiveLock(input, stateHashSeed) {
  const markdownHash = sha256File(paths.markdownDraft);
  const mapHash = sha256File(paths.mapDraft);
  const lockBase = {
    schema: "asolaria-active-session-lock.v1",
    lockId: "wave33a-3-active-session-marker-acer",
    status: "ACTIVE",
    generatedAt,
    sourceWave: "WAVE33A-3_ACTIVE_SESSION_MARKER",
    hostAttribution: {
      node: "ACER",
      hostname: os.hostname(),
      platform: process.platform,
      repoRoot: repoRoot.replace(/\\/g, "/")
    },
    operatorWitness: {
      primary: "jesse",
      cosignReceipt: input.cosignReceipt.id,
      cosignQuote: input.cosignReceipt.operatorCosign?.text_quote || "I am Jesse. I am the operator. Do your plan or we will never escape the loop",
      cosignClass: input.cosignReceipt.operatorCosign?.cosign_class || "explicit_operator_authorization_break_the_cosign_wait_loop",
      matrixReceipt: input.matrixReceipt.id
    },
    currentProcess: {
      mintScriptPid: process.pid,
      parentPid: process.ppid,
      pidMeaning: "Node mint executor process and parent terminal process at marker creation time."
    },
    cascadeState: {
      activeLayer: "post-v6 Wave33A sub-wave execution",
      currentSubWave: "33A-3_ACTIVE_SESSION_MARKER",
      ordering: ["33A-3", "33A-1", "33A-4", "33A-2"],
      nextCosignRequiredFor: ["33A-1", "33A-4", "33A-2"],
      v6VoteId: input.v6Summary.voteId,
      v6TotalBeats: input.v6Summary.totalBeats
    },
    roleAssertion: {
      loadLocalSystemBeforeAction: true,
      role: "guide",
      authority: "supervisor_ring_prof_council_loaded_surfaces_not_chat_memory",
      mutation: "only_after_supervisor_or_operator_gate",
      doNotUninstallActiveUpgrades: true,
      identityDeclaration: "I am a guide on this system. Authority is the supervisor/PROF/council ring. Do not improvise. Do not auto-update myself. Do not edit authority artifacts."
    },
    mandatoryLoadOrder: [
      "BROWN-HILBERT.md",
      "AGENTS.md",
      "TASKS.md",
      "data/behcs/orchestration/wave33a-agent-terminal-load-control-20260428/wave33a-3-active-session-marker.v1.json",
      "data/behcs/memory/wave33a-3-active-session-marker.v1.json",
      "data/behcs/index/wave33a-3-active-session-marker-index.v1.json",
      "data/behcs/maps/asolaria/wave33a-3-active-session-marker-map-map-mapped.v1.json",
      "latest relevant data/agent-index/council/D50-*.md",
      "latest relevant data/behcs/codex/glyph-language/*.glpj.json"
    ],
    consumedAsResearchOnly: [
      {
        path: repoRel(paths.markdownDraft),
        disposition: "ABSORB_TO_33A_3_RESEARCH_INPUT",
        sha256: markdownHash
      },
      {
        path: repoRel(paths.mapDraft),
        disposition: "ABSORB_TO_33A_3_RESEARCH_INPUT",
        sha256: mapHash
      }
    ],
    boundaries: {
      noAdapterWiring: true,
      noHookWiring: true,
      noSelfUpdateGuardYet: true,
      noDraftPromotionAsCanon: true,
      noDeletion: true,
      noSecrets: true,
      noInstall: true,
      noClaudeCodexUpgradeMutation: true
    },
    stateHashSeed
  };
  return { ...lockBase, markerHash: sha256Json(lockBase) };
}

function buildSurfaces(input, supervisorVotes) {
  const sourceHashes = {
    markdownDraft: sha256File(paths.markdownDraft),
    mapDraft: sha256File(paths.mapDraft),
    candidatePacket: sha256File(paths.candidatePacket),
    v6Vote: sha256File(paths.v6Vote),
    cosignReceipt: input.cosignReceipt.rawSha256
  };

  const stateBase = {
    schema: "wave33a-3-active-session-marker.v1",
    generatedAt,
    status: "WAVE33A_3_ACTIVE_SESSION_MARKER_AUTHORED_ACER",
    subWave: "33A-3_ACTIVE_SESSION_MARKER",
    sourceHost: os.hostname(),
    operatorCosign: input.cosignReceipt,
    dispositionMatrix: input.matrixReceipt,
    inputsConsumedAsResearchOnly: input.draftArtifacts,
    v6: input.v6Summary,
    sourceHashes,
    supervisorVotes,
    outputs: {
      activeSessionMarker: repoRel(paths.activeLock),
      memory: repoRel(paths.memory),
      index: repoRel(paths.index),
      map: repoRel(paths.map),
      cube: repoRel(paths.cube),
      glpj: repoRel(paths.glpj),
      whiteroom: repoRel(paths.whiteroom),
      gc: repoRel(paths.gc),
      cryptoSeal: repoRel(paths.cryptoSeal),
      d50: repoRel(paths.d50)
    },
    nextGates: [
      "33A-1 boot manifest pinning requires fresh operator-witness cosign after 33A-3 seal.",
      "33A-4 compression-wake identity assertion waits for the active-session marker to exist.",
      "33A-2 self-update guard remains last because it touches live Claude/Codex update paths."
    ],
    boundaries: [
      "no_adapter_wiring",
      "no_hook_wiring",
      "no_self_update_guard_yet",
      "no_draft_promotion_as_canon",
      "no_d50_candidate_promotion",
      "no_glpj_draft_promotion",
      "no_cube_draft_promotion",
      "no_install",
      "no_delete",
      "no_secret_material"
    ]
  };
  const state = { ...stateBase, stateHash: sha256Json(stateBase) };
  const activeLock = buildActiveLock(input, state.stateHash);

  const memory = {
    schema: "behcs-memory.v1",
    generatedAt,
    memoryId: "wave33a-3-active-session-marker",
    status: "MEMORY_INDEX_READY_NOT_CANONICAL_MERGED",
    summary: "Wave33A-3 creates a passive active-session marker so future Codex/Claude loads know they are guides on an active BEHCS/D50 supervisor system before taking action.",
    state: repoRel(paths.state),
    stateHash: state.stateHash,
    activeLock: repoRel(paths.activeLock),
    receipts: [matrixReceiptId, cosignReceiptId]
  };

  const index = {
    schema: "behcs-index.v1",
    generatedAt,
    indexId: "wave33a-3-active-session-marker-index",
    status: "INDEX_INDEXED",
    tags: ["wave33a", "active-session", "codex", "claude", "guide-role", "operator-witness", "supervisor-ring"],
    entries: [
      { id: "active-session-lock", path: repoRel(paths.activeLock), kind: "runtime_marker", hash: activeLock.markerHash },
      { id: "jesse-cosign", receipt: cosignReceiptId, kind: "operator_witness" },
      { id: "markdown-draft-research-input", path: repoRel(paths.markdownDraft), kind: "research_input", hash: sourceHashes.markdownDraft },
      { id: "map-draft-research-input", path: repoRel(paths.mapDraft), kind: "research_input", hash: sourceHashes.mapDraft }
    ]
  };

  const map = {
    schema: "behcs-map-map-mapped.v1",
    generatedAt,
    mapId: "wave33a-3-active-session-marker-map-map-mapped",
    status: "MAP_MAP_MAPPED",
    nodes: [
      { id: "jesse-operator-cosign", kind: "operator_witness", receipt: cosignReceiptId },
      { id: "active-operator-terminal", kind: "terminal_context" },
      { id: "active-session-lock", kind: "runtime_marker", path: repoRel(paths.activeLock) },
      { id: "guide-role", kind: "role_boundary" },
      { id: "supervisor-ring-authority", kind: "authority_context" },
      { id: "future-model-load", kind: "compression_or_resume_context" }
    ],
    edges: [
      { from: "jesse-operator-cosign", to: "active-session-lock", relation: "authorizes_33a_3_mint" },
      { from: "active-operator-terminal", to: "active-session-lock", relation: "reads_before_action" },
      { from: "active-session-lock", to: "guide-role", relation: "asserts" },
      { from: "guide-role", to: "supervisor-ring-authority", relation: "defers_to" },
      { from: "future-model-load", to: "active-session-lock", relation: "rehydrates_from" }
    ],
    sourceMapDraft: input.mapDraft
  };

  const cube = {
    schema: "behcs-cube-cube-cubed.v1",
    generatedAt,
    cubeId: "wave33a-3-active-session-marker-cube-cubed",
    status: "CUBE_CUBE_CUBED",
    note: "Supervisor-authored Wave33A-3 cube. This is not the quarantined unilateral cube draft.",
    axes: ["operator", "host", "terminal", "authority", "compression", "upgrade"],
    cells: [
      { id: "operator-witness", coordinate: ["jesse", os.hostname(), "active", "cosign", cosignReceiptId, "33A-3"], glyph: glyph("wave33a3", "operator-witness", cosignReceiptId) },
      { id: "guide-role", coordinate: ["codex-claude", os.hostname(), "guide", "supervisor-ring", "load-first", "no-uninstall"], glyph: glyph("wave33a3", "guide-role", sourceHashes.markdownDraft) },
      { id: "runtime-marker", coordinate: [repoRel(paths.activeLock), os.hostname(), "json-lock", "passive", "readable", "bounded"], glyph: glyph("wave33a3", "runtime-marker", activeLock.markerHash) }
    ]
  };

  const glpj = {
    schema: "behcs256-glpj.v1",
    generatedAt,
    status: "GLYPH_LANGUAGE_PACKET_MINTED",
    language: "WAVE33A_3_ACTIVE_SESSION_MARKER",
    base: behcs.alphabet.base,
    note: "Fresh GLPJ surface for 33A-3. The quarantined GLPJ draft remains held for 33A-4 reshape.",
    glyphs: cube.cells.map((cell) => ({
      id: cell.id,
      glyph: cell.glyph,
      relation: "active_session_marker"
    }))
  };

  const whiteroom = {
    schema: "omniwhite-room.v1",
    generatedAt,
    status: "WHITEROOM_CONTRADICTION_PASS",
    contradictions: [
      {
        claim: "Codex should hand-author authority artifacts from chat memory.",
        verdict: "REJECTED",
        reason: "The active marker is minted only after v6 vote, disposition matrix, and Jesse cosign receipt are gated PROCEED."
      },
      {
        claim: "The 7 Wave33A drafts are now canonical because v6 said PROCEED.",
        verdict: "REJECTED",
        reason: "Only markdown and map are consumed as research input for 33A-3; cube, GLPJ, and D50 candidate remain protected."
      },
      {
        claim: "Self-update guard can be installed now.",
        verdict: "REJECTED",
        reason: "33A-2 is explicitly last. 33A-3 only emits a passive marker and surfaces."
      }
    ]
  };

  const gc = {
    schema: "behcs-gc-retention.v1",
    generatedAt,
    status: "GC_RETENTION_ACTIVE",
    keep: [
      repoRel(paths.markdownDraft),
      repoRel(paths.mapDraft),
      repoRel(paths.candidatePacket),
      repoRel(paths.v6Vote),
      repoRel(paths.state),
      repoRel(paths.activeLock)
    ],
    hold: [
      "data/behcs/cubes/agent-terminal-load-control-contract-cube-cubed.cube.js",
      "data/behcs/codex/glyph-language/agent-terminal-load-control-contract-behcs256.glpj.json",
      "data/agent-index/council/D50-CANDIDATE-AGENT-TERMINAL-LOAD-CONTROL-CONTRACT-ACER-2026-04-28.md"
    ],
    neverDeleteWithoutOperator: ["Wave33A unilateral drafts", "LAW-001 cosign receipts", "v6 vote file", "hash manifests"]
  };

  return { state, activeLock, memory, index, map, cube, glpj, whiteroom, gc };
}

function writeMintArtifacts(surfaces, supervisorVotes) {
  writeJson(paths.activeLock, surfaces.activeLock);
  writeJson(paths.state, surfaces.state);
  writeNdjson(paths.votes, supervisorVotes);
  writeJson(paths.memory, surfaces.memory);
  writeJson(paths.index, surfaces.index);
  writeJson(paths.map, surfaces.map);
  writeText(paths.cube, `"use strict";\n\nmodule.exports = Object.freeze(${JSON.stringify(surfaces.cube, null, 2)});\n`);
  writeJson(paths.glpj, surfaces.glpj);
  writeJson(paths.whiteroom, surfaces.whiteroom);
  writeJson(paths.gc, surfaces.gc);

  const preSealArtifacts = [
    paths.activeLock,
    paths.state,
    paths.votes,
    paths.memory,
    paths.index,
    paths.map,
    paths.cube,
    paths.glpj,
    paths.whiteroom,
    paths.gc,
    paths.candidatePacket,
    paths.v6Vote,
    paths.markdownDraft,
    paths.mapDraft
  ].filter((filePath) => fs.existsSync(filePath));

  const cryptoSeal = {
    schema: "behcs-crypto-seal.v1",
    generatedAt,
    status: "HASH_SEALED_NO_NEW_KEY_MATERIAL",
    sealId: "wave33a-3-active-session-marker-acer",
    artifactHashes: preSealArtifacts.map(artifactInfo),
    aggregateHash: sha256Text(preSealArtifacts.map((filePath) => `${repoRel(filePath)}:${sha256File(filePath)}`).join("\n"))
  };
  writeJson(paths.cryptoSeal, cryptoSeal);

  const artifacts = [...preSealArtifacts, paths.cryptoSeal].map(artifactInfo);
  const manifest = {
    schema: "wave33a-3-active-session-marker-manifest.v1",
    generatedAt,
    status: surfaces.state.status,
    stateHash: surfaces.state.stateHash,
    markerHash: surfaces.activeLock.markerHash,
    artifacts
  };
  writeJson(paths.manifest, manifest);

  const d50 = [
    "# D50 Wave 33A-3 - Active Session Marker (ACER)",
    "",
    "| Field | Value |",
    "|---|---|",
    `| status | ${surfaces.state.status} |`,
    `| state_hash | ${surfaces.state.stateHash} |`,
    `| marker_hash | ${surfaces.activeLock.markerHash} |`,
    `| operator_cosign | ${cosignReceiptId} |`,
    `| matrix_receipt | ${matrixReceiptId} |`,
    "| consumed_inputs | AGENT-TERMINAL-LOAD-CONTRACT.md + agent-terminal-load-control-contract-map-map-mapped.v1.json as research input only |",
    "| no_adapter_wiring | true |",
    "| no_hook_wiring | true |",
    "| self_update_guard | not yet, Wave33A-2 remains last |",
    "",
    "## Supervisor Votes",
    "",
    ...supervisorVotes.map((vote) => `- ${vote.prof} / ${vote.supervisorPid}: ${vote.vote} - ${vote.reason}`),
    "",
    "## Boundary",
    "",
    "The marker is a passive JSON lock and BEHCS surface set. It tells future Codex/Claude loads to read local authority surfaces and hold the guide role. It does not promote the quarantined drafts as canon and does not wire adapters, hooks, or self-update guards.",
    "",
    "## Artifact Hashes",
    "",
    ...artifacts.map((artifact) => `- ${artifact.path} - sha256 ${artifact.sha256}`)
  ].join("\n");
  writeText(paths.d50, d50);

  const finalArtifacts = [...artifacts, artifactInfo(paths.manifest), artifactInfo(paths.d50)];
  const report = {
    schema: "wave33a-3-active-session-marker-report.v1",
    generatedAt,
    status: surfaces.state.status,
    stateHash: surfaces.state.stateHash,
    markerHash: surfaces.activeLock.markerHash,
    artifactCount: finalArtifacts.length,
    artifacts: finalArtifacts
  };
  writeJson(paths.reportJson, report);
  writeText(paths.reportMd, [
    "# Wave33A-3 Active Session Marker",
    "",
    `Status: ${surfaces.state.status}`,
    `State hash: ${surfaces.state.stateHash}`,
    `Marker hash: ${surfaces.activeLock.markerHash}`,
    `Operator cosign: ${cosignReceiptId}`,
    "",
    "Artifacts:",
    ...finalArtifacts.map((artifact) => `- ${artifact.path} - ${artifact.sha256}`)
  ].join("\n"));

  return { manifest, report, artifacts: finalArtifacts };
}

const payloadRelPaths = Object.freeze([
  "tools/behcs/wave33a-3-active-session-marker-mint-push.js",
  ".asolaria-active-session.lock",
  "data/behcs/orchestration/wave33a-agent-terminal-load-control-20260428/wave33a-3-active-session-marker.v1.json",
  "data/behcs/orchestration/wave33a-agent-terminal-load-control-20260428/wave33a-3-active-session-marker-manifest.json",
  "data/behcs/orchestration/wave33a-agent-terminal-load-control-20260428/wave33a-3-active-session-marker-supervisor-votes.ndjson",
  "data/behcs/memory/wave33a-3-active-session-marker.v1.json",
  "data/behcs/index/wave33a-3-active-session-marker-index.v1.json",
  "data/behcs/maps/asolaria/wave33a-3-active-session-marker-map-map-mapped.v1.json",
  "data/behcs/cubes/wave33a-3-active-session-marker-cube-cubed.cube.js",
  "data/behcs/codex/glyph-language/wave33a-3-active-session-marker-behcs256.glpj.json",
  "data/behcs/omniwhite-room/wave33a-3-active-session-marker-whiteroom.v1.json",
  "data/behcs/garbage-collector/wave33a-3-active-session-marker-retention.v1.json",
  "data/behcs/crypto/wave33a-3-active-session-marker-crypto-seal.v1.json",
  "data/agent-index/council/D50-WAVE33A-3-ACTIVE-SESSION-MARKER-ACER-2026-04-28.md",
  "reports/wave33a-3-active-session-marker-latest.json",
  "reports/wave33a-3-active-session-marker-latest.md"
]);

function remotePathFor(relativePath) {
  return path.join(remoteBundleRoot, relativePath.replace(/\//g, path.sep));
}

function copyPayload(relativePath) {
  const sourcePath = path.join(repoRoot, relativePath.replace(/\//g, path.sep));
  const targetPath = remotePathFor(relativePath);
  const source = inspectAbsolute(sourcePath);
  let targetAfter = inspectAbsolute(targetPath);
  let copied = false;
  let copyError = null;
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
    source,
    targetPath: targetPath.replace(/\\/g, "/"),
    copied,
    copyError,
    targetAfter,
    pass: source.present && targetAfter.present && source.sha256 === targetAfter.sha256
  };
}

function pushToLiris(stateHash, markerHash) {
  const sourceInspections = payloadRelPaths.map((relativePath) => ({
    relativePath,
    source: inspectAbsolute(path.join(repoRoot, relativePath.replace(/\//g, path.sep)))
  }));
  const allSourcesPresent = sourceInspections.every((row) => row.source.present);
  const shareReachable = fs.existsSync(lirisIncomingRoot) || fs.existsSync(path.dirname(lirisIncomingRoot));
  const payloads = shareReachable ? payloadRelPaths.map(copyPayload) : sourceInspections.map((row) => ({
    id: row.relativePath.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    relativePath: row.relativePath,
    source: row.source,
    targetPath: remotePathFor(row.relativePath).replace(/\\/g, "/"),
    copied: false,
    copyError: "LIRIS_INCOMING_ROOT_NOT_REACHABLE",
    targetAfter: inspectAbsolute(remotePathFor(row.relativePath)),
    pass: false
  }));
  const allRemoteVerified = payloads.length > 0 && payloads.every((row) => row.pass);
  const status = !allSourcesPresent
    ? "HOLD_MISSING_33A3_PAYLOAD_SOURCE"
    : !shareReachable
      ? "HOLD_LIRIS_INCOMING_ROOT_NOT_REACHABLE"
      : allRemoteVerified
        ? "ACER_TO_LIRIS_WAVE33A_3_ACTIVE_SESSION_MARKER_PUSH_HASH_VERIFIED"
        : "HOLD_LIRIS_WAVE33A_3_PUSH_HASH_VERIFY_FAILED";

  const pushManifest = {
    schema: "wave33a-3-active-session-marker-push-manifest.v1",
    generatedAt,
    status,
    sourceHost: os.hostname(),
    stateHash,
    markerHash,
    lirisShareRoot,
    remoteBundleRoot: remoteBundleRoot.replace(/\\/g, "/"),
    payloads: payloads.map((row) => ({
      id: row.id,
      relativePath: row.relativePath,
      sourceSha256: row.source.sha256,
      sourceBytes: row.source.bytes,
      sourceLines: row.source.lines,
      targetPath: row.targetPath,
      copied: row.copied,
      copyError: row.copyError,
      targetSha256: row.targetAfter.sha256,
      pass: row.pass
    }))
  };
  writeJson(paths.pushManifest, pushManifest);

  let remoteManifestAfter = null;
  if (shareReachable) {
    const remoteManifestPath = path.join(remoteBundleRoot, "wave33a-3-active-session-marker-push-manifest.json");
    try {
      ensureParent(remoteManifestPath);
      fs.copyFileSync(paths.pushManifest, remoteManifestPath);
      remoteManifestAfter = inspectAbsolute(remoteManifestPath);
    } catch (error) {
      remoteManifestAfter = { present: false, path: remoteManifestPath.replace(/\\/g, "/"), error: error.message };
    }
  }

  const pushStateBase = {
    schema: "wave33a-3-active-session-marker-push-acer.v1",
    generatedAt,
    status,
    sourceHost: os.hostname(),
    stateHash,
    markerHash,
    allSourcesPresent,
    shareReachable,
    allRemoteVerified,
    remoteBundleRoot: remoteBundleRoot.replace(/\\/g, "/"),
    pushManifest: repoRel(paths.pushManifest),
    remoteManifestAfter,
    payloadCount: payloads.length,
    payloads,
    boundaries: [
      "explicit_33a3_payload_only",
      "no_hidden_bulk_copy",
      "no_liris_canonical_write",
      "no_liris_execution",
      "no_adapter_wiring",
      "no_hook_wiring",
      "no_self_update_guard",
      "no_secret_material"
    ]
  };
  const pushState = { ...pushStateBase, pushStateHash: sha256Json(pushStateBase) };
  writeJson(paths.pushState, pushState);
  return { status, allRemoteVerified, pushManifest, pushState };
}

function postJson(url, body) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const data = Buffer.from(JSON.stringify(body), "utf8");
    const req = http.request({
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path: `${parsed.pathname}${parsed.search}`,
      method: "POST",
      headers: {
        "content-type": "application/json",
        "content-length": data.length
      },
      timeout: 5000
    }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        let bodyText = text;
        try {
          bodyText = JSON.parse(text);
        } catch (_error) {
          // Keep raw response.
        }
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode, body: bodyText });
      });
    });
    req.on("timeout", () => req.destroy(new Error("post_timeout")));
    req.on("error", (error) => resolve({ ok: false, error: error.message }));
    req.end(data);
  });
}

async function notifyLiris(mint, push) {
  const envelopeBase = {
    schema: "law001-wave33a-3-active-session-marker-complete.v1",
    ts: new Date().toISOString(),
    from: "acer",
    to: "liris",
    mode: "real",
    type: "ack",
    verb: "LAW001_WAVE33A_3_ACTIVE_SESSION_MARKER_ACER_MINT_PUSH_COMPLETE",
    in_response_to: cosignReceiptId,
    cube: {
      D1_ACTOR: "acer",
      D3_TARGET: "liris",
      D26_OMNIDIRECTIONAL: "bilateral",
      D49_EXECUTION_PROOF_SUPERGRAPH: "wave33a3_active_session_marker_mint_push",
      D50_META_RATIFICATION: "jesse_cosigned_33a3_active_session_marker_acer_side"
    },
    body: {
      status: push.status,
      mintStatus: mint.state.status,
      stateHash: mint.state.stateHash,
      markerHash: mint.activeLock.markerHash,
      pushStateHash: push.pushState.pushStateHash,
      allRemoteVerified: push.allRemoteVerified,
      payloadCount: push.pushManifest.payloads.length,
      remoteBundleRoot: remoteBundleRoot.replace(/\\/g, "/"),
      artifacts: {
        state: repoRel(paths.state),
        activeLock: repoRel(paths.activeLock),
        manifest: repoRel(paths.manifest),
        pushManifest: repoRel(paths.pushManifest),
        pushState: repoRel(paths.pushState),
        d50: repoRel(paths.d50),
        report: repoRel(paths.reportMd)
      },
      boundary: {
        noAdapterWiring: true,
        noHookWiring: true,
        noSelfUpdateGuard: true,
        noDraftPromotionAsCanon: true,
        noLirisCanonicalWriteByAcer: true,
        noSecretMaterial: true
      },
      next: "Liris reads the incoming-acer wave33a-3-active-session-marker-push bundle, hash-verifies it, cp -n promotes byte-perfect, then fires reciprocal 33A-3 mint under Liris authority."
    }
  };
  const envelope = { ...envelopeBase, id: `behcs-wave33a3-${mint.state.stateHash.slice(0, 12)}` };
  writeJson(paths.completionEnvelope, envelope);
  const result = await postJson(lirisLaw001, envelope);
  writeJson(paths.completionPostResult, {
    lirisLaw001,
    postedAt: new Date().toISOString(),
    ...result
  });
  return result;
}

function buildLirisReciprocalVotes(lock, acerState) {
  return [
    {
      prof: "PROF-HOOKWALL",
      supervisorPid: "BH.SUPERVISOR.PID.WAVE33A.ACTIVE_SESSION.HOOKWALL.LIRIS",
      vote: "APPROVE_LIRIS_RECIPROCAL_PASSIVE_SURFACES",
      reason: "Reciprocal mode writes only Liris-attributed BEHCS surfaces and preserves the root .asolaria-active-session.lock that already landed byte-perfect."
    },
    {
      prof: "PROF-WHITEROOM",
      supervisorPid: "BH.SUPERVISOR.PID.WAVE33A.ACTIVE_SESSION.WHITEROOM.LIRIS",
      vote: "PASS_PARTIAL_SEAL_REPAIR",
      reason: "The ACER marker is treated as verified incoming evidence; Liris emits its own state hash without re-promoting quarantined ACER drafts."
    },
    {
      prof: "PROF-SHANNON",
      supervisorPid: "BH.SUPERVISOR.PID.WAVE33A.ACTIVE_SESSION.SHANNON.LIRIS",
      vote: "HASH_SEAL_LIRIS_RECIPROCAL",
      reason: `ACER state ${acerState.stateHash || "missing"} and marker ${lock.markerHash || "missing"} are bound into the Liris reciprocal hash.`
    },
    {
      prof: "PROF-HERMES",
      supervisorPid: "BH.SUPERVISOR.PID.WAVE33A.ACTIVE_SESSION.HERMES.LIRIS",
      vote: "ACK_TO_ACER_AFTER_RECIPROCAL",
      reason: "Liris notifies ACER via LAW-001 only after local reciprocal artifacts are emitted."
    },
    {
      prof: "PROF-KERNEL",
      supervisorPid: "BH.SUPERVISOR.PID.WAVE33A.ACTIVE_SESSION.KERNEL.LIRIS",
      vote: "GRAMMAR_OK_NO_INBOX_READ",
      reason: "Reciprocal mode intentionally avoids reading inbox.ndjson and uses phase markers for every major step."
    },
    {
      prof: "COL-ASOLARIA",
      supervisorPid: "BH.SUPERVISOR.PID.WAVE33A.ACTIVE_SESSION.ASOLARIA.APEX.LIRIS",
      vote: "PROCEED_LIRIS_RECIPROCAL_33A_3",
      reason: "33A-3 substantive marker is already live; reciprocal state restores diverged-draft-siblings symmetry."
    }
  ];
}

function writeLirisReciprocalArtifacts() {
  phase("RECIPROCAL.READ_LOCK");
  const lock = readJson(paths.activeLock);
  if (!lock) throw new Error(`Missing active-session lock at ${repoRel(paths.activeLock)}`);
  phase("RECIPROCAL.READ_ACER_STATE");
  const acerState = readJson(paths.state, {});
  const acerManifest = readJson(paths.manifest, {});
  const lockMeta = artifactInfo(paths.activeLock);
  const acerStateMeta = artifactInfo(paths.state);
  const acerManifestMeta = artifactInfo(paths.manifest);
  const votes = buildLirisReciprocalVotes(lock, acerState);

  phase("RECIPROCAL.BUILD_STATE");
  const stateBase = {
    schema: "wave33a-3-active-session-marker-liris.v1",
    generatedAt,
    status: "WAVE33A_3_ACTIVE_SESSION_MARKER_RECIPROCAL_LIRIS_AUTHORED",
    subWave: "33A-3_ACTIVE_SESSION_MARKER",
    sourceHost: os.hostname(),
    hostAttribution: {
      node: "LIRIS",
      hostname: os.hostname(),
      platform: process.platform,
      repoRoot: repoRoot.replace(/\\/g, "/")
    },
    preservesRootMarker: true,
    rootMarker: {
      path: repoRel(paths.activeLock),
      sha256: lockMeta.sha256,
      markerHash: lock.markerHash || null,
      operatorWitness: lock.operatorWitness || null,
      cascadeState: lock.cascadeState || null,
      roleAssertion: lock.roleAssertion || null
    },
    acerEvidence: {
      statePath: repoRel(paths.state),
      stateHash: acerState.stateHash || null,
      stateSha256: acerStateMeta.sha256,
      manifestPath: repoRel(paths.manifest),
      manifestSha256: acerManifestMeta.sha256,
      acerManifestStatus: acerManifest.status || null
    },
    supervisorVotes: votes,
    boundaries: [
      "no_inbox_ndjson_read",
      "no_adapter_wiring",
      "no_hook_wiring",
      "no_self_update_guard",
      "no_draft_promotion_as_canon",
      "no_acer_d50_promotion_on_liris",
      "no_install",
      "no_delete",
      "no_secret_material"
    ],
    nextGates: [
      "D50 META roll-up for 33A-3 after both host state hashes are present.",
      "ed25519 ceremony after D50 META roll-up.",
      "33A-1 boot manifest requires fresh operator cosign."
    ]
  };
  const state = { ...stateBase, stateHash: sha256Json(stateBase) };

  const memory = {
    schema: "behcs-memory.v1",
    generatedAt,
    memoryId: "wave33a-3-active-session-marker-liris",
    status: "MEMORY_INDEX_READY_NOT_CANONICAL_MERGED",
    summary: "Liris reciprocal 33A-3 state confirms the ACER active-session marker landed byte-perfect and emits Liris-attributed proof without reading the large inbox.",
    state: repoRel(paths.lirisReciprocalState),
    stateHash: state.stateHash,
    activeLock: repoRel(paths.activeLock),
    acerStateHash: acerState.stateHash || null
  };
  const index = {
    schema: "behcs-index.v1",
    generatedAt,
    indexId: "wave33a-3-active-session-marker-liris-index",
    status: "INDEX_INDEXED",
    tags: ["wave33a", "liris", "active-session", "reciprocal", "phase-marked", "no-inbox-read"],
    entries: [
      { id: "liris-reciprocal-state", path: repoRel(paths.lirisReciprocalState), kind: "state", hash: state.stateHash },
      { id: "root-marker", path: repoRel(paths.activeLock), kind: "runtime_marker", sha256: lockMeta.sha256 },
      { id: "acer-state", path: repoRel(paths.state), kind: "incoming_evidence", stateHash: acerState.stateHash || null }
    ]
  };
  const map = {
    schema: "behcs-map-map-mapped.v1",
    generatedAt,
    mapId: "wave33a-3-active-session-marker-liris-map-map-mapped",
    status: "MAP_MAP_MAPPED",
    nodes: [
      { id: "acer-33a3-state", kind: "incoming_evidence", stateHash: acerState.stateHash || null },
      { id: "liris-root-marker", kind: "runtime_marker", path: repoRel(paths.activeLock) },
      { id: "liris-reciprocal-state", kind: "reciprocal_state", stateHash: state.stateHash },
      { id: "future-liris-model-load", kind: "compression_or_resume_context" }
    ],
    edges: [
      { from: "acer-33a3-state", to: "liris-root-marker", relation: "promoted_byte_perfect" },
      { from: "liris-root-marker", to: "liris-reciprocal-state", relation: "anchors" },
      { from: "future-liris-model-load", to: "liris-root-marker", relation: "reads_before_action" }
    ]
  };
  const cube = {
    schema: "behcs-cube-cube-cubed.v1",
    generatedAt,
    cubeId: "wave33a-3-active-session-marker-liris-cube-cubed",
    status: "CUBE_CUBE_CUBED",
    note: "Liris reciprocal cube for 33A-3; no ACER draft cube is promoted.",
    axes: ["source", "host", "marker", "authority", "phase", "next"],
    cells: [
      { id: "marker-landed", coordinate: ["acer", "liris", lockMeta.sha256, "jesse-cosign", "reciprocal", "33A-1-hold"], glyph: glyph("wave33a3_liris", "marker-landed", lockMeta.sha256 || "") },
      { id: "no-inbox-read", coordinate: ["liris", "liris", "phase-marker", "kernel", "bounded", "consumer-heal"], glyph: glyph("wave33a3_liris", "no-inbox-read", state.stateHash) }
    ]
  };
  const glpj = {
    schema: "behcs256-glpj.v1",
    generatedAt,
    status: "GLYPH_LANGUAGE_PACKET_MINTED",
    language: "WAVE33A_3_ACTIVE_SESSION_MARKER_LIRIS_RECIPROCAL",
    base: behcs.alphabet.base,
    glyphs: cube.cells.map((cell) => ({ id: cell.id, glyph: cell.glyph, relation: "liris_reciprocal_active_session_marker" }))
  };
  const whiteroom = {
    schema: "omniwhite-room.v1",
    generatedAt,
    status: "WHITEROOM_CONTRADICTION_PASS",
    contradictions: [
      {
        claim: "Liris must rerun the ACER mint path and read ACER-only drafts.",
        verdict: "REJECTED",
        reason: "Liris reciprocal mode uses the promoted marker and ACER state as evidence, then emits Liris-attributed state."
      },
      {
        claim: "Partial seal means 33A-3 failed.",
        verdict: "REJECTED",
        reason: "The substantive boot-discipline marker is live on Liris; the missing part was reciprocal state emission."
      }
    ]
  };
  const gc = {
    schema: "behcs-gc-retention.v1",
    generatedAt,
    status: "GC_RETENTION_ACTIVE",
    keep: [repoRel(paths.activeLock), repoRel(paths.state), repoRel(paths.manifest), repoRel(paths.lirisReciprocalState)],
    hold: ["large inbox consumer cleanup remains a separate supervisor-GC lane"],
    neverDeleteWithoutOperator: ["33A-3 marker", "33A-3 ACER state", "33A-3 Liris reciprocal state", "phase markers"]
  };

  phase("RECIPROCAL.WRITE_SURFACES");
  writeJson(paths.lirisReciprocalState, state);
  writeNdjson(paths.lirisReciprocalVotes, votes);
  writeJson(paths.lirisReciprocalMemory, memory);
  writeJson(paths.lirisReciprocalIndex, index);
  writeJson(paths.lirisReciprocalMap, map);
  writeText(paths.lirisReciprocalCube, `"use strict";\n\nmodule.exports = Object.freeze(${JSON.stringify(cube, null, 2)});\n`);
  writeJson(paths.lirisReciprocalGlpj, glpj);
  writeJson(paths.lirisReciprocalWhiteroom, whiteroom);
  writeJson(paths.lirisReciprocalGc, gc);

  const preSealArtifacts = [
    paths.activeLock,
    paths.state,
    paths.manifest,
    paths.lirisReciprocalState,
    paths.lirisReciprocalVotes,
    paths.lirisReciprocalMemory,
    paths.lirisReciprocalIndex,
    paths.lirisReciprocalMap,
    paths.lirisReciprocalCube,
    paths.lirisReciprocalGlpj,
    paths.lirisReciprocalWhiteroom,
    paths.lirisReciprocalGc
  ].filter((filePath) => fs.existsSync(filePath));
  const cryptoSeal = {
    schema: "behcs-crypto-seal.v1",
    generatedAt,
    status: "HASH_SEALED_NO_NEW_KEY_MATERIAL",
    sealId: "wave33a-3-active-session-marker-liris-reciprocal",
    artifactHashes: preSealArtifacts.map(artifactInfo),
    aggregateHash: sha256Text(preSealArtifacts.map((filePath) => `${repoRel(filePath)}:${sha256File(filePath)}`).join("\n"))
  };
  writeJson(paths.lirisReciprocalCryptoSeal, cryptoSeal);

  const artifacts = [...preSealArtifacts, paths.lirisReciprocalCryptoSeal].map(artifactInfo);
  const d50 = [
    "# D50 Wave 33A-3 - Active Session Marker (Liris Reciprocal)",
    "",
    "| Field | Value |",
    "|---|---|",
    `| status | ${state.status} |`,
    `| liris_state_hash | ${state.stateHash} |`,
    `| acer_state_hash | ${acerState.stateHash || "missing"} |`,
    `| marker_sha256 | ${lockMeta.sha256} |`,
    "| inbox_read | false |",
    "| adapter_wiring | false |",
    "| hook_wiring | false |",
    "",
    "## Boundary",
    "",
    "Liris reciprocal mode emits Liris-attributed state from the byte-perfect active-session marker. It does not read the oversized inbox, does not promote ACER-only D50 evidence, and does not install or wire hooks.",
    "",
    "## Artifact Hashes",
    "",
    ...artifacts.map((artifact) => `- ${artifact.path} - sha256 ${artifact.sha256}`)
  ].join("\n");
  writeText(paths.lirisReciprocalD50, d50);

  const finalArtifacts = [...artifacts, artifactInfo(paths.lirisReciprocalD50)];
  const report = {
    schema: "wave33a-3-active-session-marker-liris-report.v1",
    generatedAt,
    status: state.status,
    stateHash: state.stateHash,
    acerStateHash: acerState.stateHash || null,
    markerSha256: lockMeta.sha256,
    artifacts: finalArtifacts
  };
  writeJson(paths.lirisReciprocalReportJson, report);
  writeText(paths.lirisReciprocalReportMd, [
    "# Wave33A-3 Active Session Marker - Liris Reciprocal",
    "",
    `Status: ${state.status}`,
    `Liris state hash: ${state.stateHash}`,
    `ACER state hash: ${acerState.stateHash || "missing"}`,
    `Marker sha256: ${lockMeta.sha256}`,
    "",
    "Artifacts:",
    ...finalArtifacts.map((artifact) => `- ${artifact.path} - ${artifact.sha256}`)
  ].join("\n"));

  phase("RECIPROCAL.WRITE_DONE", { stateHash: state.stateHash });
  return { state, lock, lockMeta, acerState, artifacts: finalArtifacts };
}

async function notifyAcerReciprocal(result) {
  const envelope = {
    schema: "law001-wave33a3-liris-reciprocal-complete.v1",
    id: `behcs-wave33a3-liris-${result.state.stateHash.slice(0, 12)}`,
    ts: new Date().toISOString(),
    from: "liris",
    to: "acer",
    mode: "real",
    type: "ack",
    verb: "LAW001_WAVE33A_3_LIRIS_RECIPROCAL_STATE_COMPLETE",
    in_response_to: "behcs-7fc8cb142860",
    cube: {
      D1_ACTOR: "liris",
      D3_TARGET: "acer",
      D26_OMNIDIRECTIONAL: "bilateral",
      D49_EXECUTION_PROOF_SUPERGRAPH: "wave33a3_liris_reciprocal_phase_marked",
      D50_META_RATIFICATION: "liris_reciprocal_state_hash_present"
    },
    body: {
      status: result.state.status,
      lirisStateHash: result.state.stateHash,
      acerStateHash: result.acerState.stateHash || null,
      markerSha256: result.lockMeta.sha256,
      markerHash: result.lock.markerHash || null,
      artifacts: {
        state: repoRel(paths.lirisReciprocalState),
        d50: repoRel(paths.lirisReciprocalD50),
        report: repoRel(paths.lirisReciprocalReportMd)
      },
      boundary: {
        noInboxRead: true,
        noAdapterWiring: true,
        noHookWiring: true,
        noSelfUpdateGuard: true,
        noDraftPromotionAsCanon: true,
        noSecretMaterial: true
      },
      next: "33A-3 now has both ACER and Liris state hashes. Proceed to D50 META roll-up / ed25519 seal, then request fresh operator cosign for 33A-1."
    }
  };
  writeJson(paths.lirisReciprocalEnvelope, envelope);
  const post = await postJson(acerLaw001, envelope);
  writeJson(paths.lirisReciprocalPostResult, { acerLaw001, postedAt: new Date().toISOString(), ...post });
  return post;
}

async function runLirisReciprocal() {
  phase("RECIPROCAL.START", { mode: "reciprocal-liris" });
  const shouldNotify = process.argv.includes("--notify");
  const result = writeLirisReciprocalArtifacts();
  let notify = { attempted: false, reason: "notify_flag_not_set" };
  if (shouldNotify) {
    phase("RECIPROCAL.NOTIFY_ACER");
    notify = { attempted: true, result: await notifyAcerReciprocal(result) };
  }
  phase("RECIPROCAL.COMPLETE", { stateHash: result.state.stateHash, notify });
  console.log(JSON.stringify({
    ok: true,
    mode: "reciprocal-liris",
    status: result.state.status,
    stateHash: result.state.stateHash,
    acerStateHash: result.acerState.stateHash || null,
    markerSha256: result.lockMeta.sha256,
    notify,
    report: repoRel(paths.lirisReciprocalReportMd)
  }, null, 2));
}

function copyPatchPayload(relativePath, patchRoot) {
  const sourcePath = path.join(repoRoot, relativePath.replace(/\//g, path.sep));
  const targetPath = path.join(patchRoot, relativePath.replace(/\//g, path.sep));
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

async function pushReciprocalPatch() {
  phase("PATCH_PUSH.START", { remotePatchRoot: remotePatchRoot.replace(/\\/g, "/") });
  const scriptMeta = artifactInfo(paths.script);
  const partialAck = readInboxReceipt("behcs-7fc8cb142860");
  const patchStateBase = {
    schema: "wave33b-wave33a3-liris-reciprocal-mint-patch-acer.v1",
    generatedAt,
    status: "WAVE33B_WAVE33A3_LIRIS_RECIPROCAL_MINT_PATCH_READY",
    purpose: "Patch Wave33A-3 executor with per-phase markers and a Liris reciprocal mode that avoids inbox reads and emits Liris-attributed 33A-3 state.",
    trigger: {
      receipt: "behcs-7fc8cb142860",
      presentOnAcer: Boolean(partialAck && partialAck.row),
      d0: partialAck?.row?.d0 || null
    },
    patchedScript: scriptMeta,
    lirisCommand: "node tools/behcs/wave33a-3-active-session-marker-mint-push.js --reciprocal-liris --notify",
    boundaries: [
      "patch_script_only",
      "no_liris_canonical_write_by_acer",
      "liris_promotes_under_its_hash_gate",
      "reciprocal_mode_no_inbox_read",
      "no_adapter_wiring",
      "no_hook_wiring",
      "no_self_update_guard"
    ]
  };
  const patchState = { ...patchStateBase, patchStateHash: sha256Json(patchStateBase) };
  writeJson(paths.patchState, patchState);

  const d50 = [
    "# D50 Wave 33B - Wave33A-3 Liris Reciprocal Mint Patch (ACER)",
    "",
    "| Field | Value |",
    "|---|---|",
    `| status | ${patchState.status} |`,
    `| patch_state_hash | ${patchState.patchStateHash} |`,
    `| patched_script_sha256 | ${scriptMeta.sha256} |`,
    "| liris_command | node tools/behcs/wave33a-3-active-session-marker-mint-push.js --reciprocal-liris --notify |",
    "| no_inbox_read | true in reciprocal mode |",
    "",
    "## Boundary",
    "",
    "This patch does not mutate Liris canonical paths directly. It stages a patched executor and explicit command for Liris to promote under its own hash gate."
  ].join("\n");
  writeText(paths.patchD50, d50);

  const report = {
    schema: "wave33b-wave33a3-liris-reciprocal-mint-patch-report.v1",
    generatedAt,
    status: patchState.status,
    patchStateHash: patchState.patchStateHash,
    scriptSha256: scriptMeta.sha256,
    lirisCommand: patchState.lirisCommand
  };
  writeJson(paths.patchReportJson, report);
  writeText(paths.patchReportMd, [
    "# Wave33B - Wave33A-3 Liris Reciprocal Mint Patch",
    "",
    `Status: ${patchState.status}`,
    `Patch state hash: ${patchState.patchStateHash}`,
    `Script sha256: ${scriptMeta.sha256}`,
    "",
    "Liris command:",
    "",
    "```powershell",
    patchState.lirisCommand,
    "```"
  ].join("\n"));

  const payloads = [
    "tools/behcs/wave33a-3-active-session-marker-mint-push.js",
    "data/behcs/orchestration/wave33a-agent-terminal-load-control-20260428/wave33b-wave33a3-liris-reciprocal-mint-patch-acer.v1.json",
    "data/agent-index/council/D50-WAVE33B-WAVE33A3-LIRIS-RECIPROCAL-MINT-PATCH-ACER-2026-04-28.md",
    "reports/wave33b-wave33a3-liris-reciprocal-mint-patch-latest.json",
    "reports/wave33b-wave33a3-liris-reciprocal-mint-patch-latest.md"
  ];
  const shareReachable = fs.existsSync(lirisIncomingRoot) || fs.existsSync(path.dirname(lirisIncomingRoot));
  const copied = shareReachable ? payloads.map((relativePath) => copyPatchPayload(relativePath, remotePatchRoot)) : payloads.map((relativePath) => ({
    relativePath,
    source: inspectAbsolute(path.join(repoRoot, relativePath.replace(/\//g, path.sep))),
    targetPath: path.join(remotePatchRoot, relativePath.replace(/\//g, path.sep)).replace(/\\/g, "/"),
    copied: false,
    copyError: "LIRIS_INCOMING_ROOT_NOT_REACHABLE",
    targetAfter: { present: false, sha256: null },
    pass: false
  }));
  const allRemoteVerified = copied.length > 0 && copied.every((row) => row.pass);
  const manifest = {
    schema: "wave33b-wave33a3-liris-reciprocal-mint-patch-manifest.v1",
    generatedAt,
    status: allRemoteVerified ? "WAVE33B_PATCH_PUSH_HASH_VERIFIED" : "HOLD_WAVE33B_PATCH_PUSH_VERIFY",
    patchStateHash: patchState.patchStateHash,
    remotePatchRoot: remotePatchRoot.replace(/\\/g, "/"),
    lirisCommand: patchState.lirisCommand,
    payloads: copied.map((row) => ({
      relativePath: row.relativePath,
      sourceSha256: row.source.sha256,
      targetSha256: row.targetAfter.sha256,
      targetPath: row.targetPath,
      copied: row.copied,
      copyError: row.copyError,
      pass: row.pass
    }))
  };
  writeJson(paths.patchManifest, manifest);
  if (shareReachable) {
    const remoteManifestPath = path.join(remotePatchRoot, "wave33b-wave33a3-liris-reciprocal-mint-patch-manifest.json");
    ensureParent(remoteManifestPath);
    fs.copyFileSync(paths.patchManifest, remoteManifestPath);
  }

  let notify = { attempted: false, reason: "notify_flag_not_set" };
  if (process.argv.includes("--notify")) {
    const envelope = {
      schema: "law001-wave33b-wave33a3-liris-reciprocal-mint-patch.v1",
      id: `behcs-wave33b-${patchState.patchStateHash.slice(0, 12)}`,
      ts: new Date().toISOString(),
      from: "acer",
      to: "liris",
      mode: "real",
      type: "patch-guide",
      verb: "LAW001_WAVE33B_WAVE33A3_LIRIS_RECIPROCAL_MINT_PATCH_PUSH",
      in_response_to: "behcs-7fc8cb142860",
      cube: {
        D1_ACTOR: "acer",
        D3_TARGET: "liris",
        D26_OMNIDIRECTIONAL: "bilateral",
        D49_EXECUTION_PROOF_SUPERGRAPH: "wave33b_phase_marked_liris_reciprocal_patch",
        D50_META_RATIFICATION: "liris_reciprocal_mint_unblocked"
      },
      body: {
        status: manifest.status,
        patchStateHash: patchState.patchStateHash,
        scriptSha256: scriptMeta.sha256,
        allRemoteVerified,
        remotePatchRoot: remotePatchRoot.replace(/\\/g, "/"),
        lirisCommand: patchState.lirisCommand,
        expectedOutputs: [
          "data/behcs/orchestration/wave33a-agent-terminal-load-control-20260428/wave33a-3-active-session-marker-liris.v1.json",
          "reports/wave33a-3-active-session-marker-liris-latest.md",
          "LAW-001 ack to ACER with lirisStateHash"
        ],
        boundary: patchState.boundaries
      }
    };
    writeJson(paths.patchEnvelope, envelope);
    const post = await postJson(lirisLaw001, envelope);
    writeJson(paths.patchPostResult, { lirisLaw001, postedAt: new Date().toISOString(), ...post });
    notify = { attempted: true, result: post };
  }

  phase("PATCH_PUSH.COMPLETE", { patchStateHash: patchState.patchStateHash, allRemoteVerified, notify });
  console.log(JSON.stringify({
    ok: true,
    mode: "push-reciprocal-patch",
    status: manifest.status,
    patchStateHash: patchState.patchStateHash,
    allRemoteVerified,
    remotePatchRoot: remotePatchRoot.replace(/\\/g, "/"),
    notify,
    report: repoRel(paths.patchReportMd)
  }, null, 2));
}

async function main() {
  if (process.argv.includes("--reciprocal-liris")) {
    await runLirisReciprocal();
    return;
  }
  if (process.argv.includes("--push-reciprocal-patch")) {
    await pushReciprocalPatch();
    return;
  }
  phase("ACER_MINT.START", { mode: "acer-mint-push" });
  const shouldNotify = process.argv.includes("--notify");
  phase("ACER_MINT.VALIDATE_INPUTS");
  const input = validateInputs();
  phase("ACER_MINT.BUILD_VOTES");
  const supervisorVotes = buildSupervisorVotes(input);
  phase("ACER_MINT.BUILD_SURFACES");
  const surfaces = buildSurfaces(input, supervisorVotes);
  phase("ACER_MINT.WRITE_ARTIFACTS");
  writeMintArtifacts(surfaces, supervisorVotes);
  phase("ACER_MINT.PUSH_TO_LIRIS");
  const push = pushToLiris(surfaces.state.stateHash, surfaces.activeLock.markerHash);
  let notify = { attempted: false, reason: "notify_flag_not_set" };
  if (shouldNotify) {
    phase("ACER_MINT.NOTIFY_LIRIS");
    notify = { attempted: true, result: await notifyLiris(surfaces, push) };
  }
  phase("ACER_MINT.COMPLETE", { stateHash: surfaces.state.stateHash, notify });

  console.log(JSON.stringify({
    ok: true,
    status: surfaces.state.status,
    stateHash: surfaces.state.stateHash,
    markerHash: surfaces.activeLock.markerHash,
    pushStatus: push.status,
    allRemoteVerified: push.allRemoteVerified,
    remoteBundleRoot: remoteBundleRoot.replace(/\\/g, "/"),
    notify,
    report: repoRel(paths.reportMd)
  }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
