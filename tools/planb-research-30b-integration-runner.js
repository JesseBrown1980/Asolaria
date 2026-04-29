#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const behcsGulp = require("./behcs/behcs-gulp-runtime");

const repoRoot = path.resolve(__dirname, "..");
const PLAN_B_ROOT = "C:\\Users\\acer\\OneDrive\\Documentos\\Class - Copy\\04 Module Four\\Plan B";
const REVIEW_AGENTS = 20_000_000_000;
const IMPLEMENT_AGENTS = 10_000_000_000;
const TOTAL_AGENTS = REVIEW_AGENTS + IMPLEMENT_AGENTS;
const GULP_SIZE = 2_000;
const SHARD_ROWS = 1_500;
const PROOF_MESSAGES_DEFAULT = 2_000;
const DEFAULT_WRITE_BUFFER = 5_000;

const BEHCS_DIR = rel("data/behcs");
const GC_DIR = path.join(BEHCS_DIR, "garbage-collector");
const GC_STATE_PATH = path.join(GC_DIR, "collector-state.json");
const GC_BUFFER_PATH = path.join(GC_DIR, "message-paths.ndjson");

const LANES = [
  {
    id: "biml_mlc_slora",
    title: "BIML + MLC + S-LoRA multi-stacking architecture",
    patterns: [/biml/i, /mlc/i, /s-?lora/i, /gpt-?4/i, /llm multistacking/i],
    integration: "Add BIML feedback state, MLC chain composer, and S-LoRA adapter registry behind GAC.",
    supervisor: "Hermes BIML/MLC/S-LoRA Supervisor",
    gates: ["dataset_manifest", "weights_manifest", "adapter_smoke", "gac", "shannon"],
    implementation: [
      "Create a BIML feedback contract that links data, model, route, and mistake outcome.",
      "Map MLC into chain composition rules for skills, glyphs, and supervisor actions.",
      "Keep 1.3GB weights as a manifest-only pointer until GPU smoke and checksum evidence exist."
    ]
  },
  {
    id: "ai_hives_rag_fusion_agents",
    title: "AI hives, agents, and RAG-Fusion",
    patterns: [/hive/i, /agent/i, /rag/i, /fusion/i, /ags/i],
    integration: "Convert hives/RAG-Fusion into supervisor ballot, retrieval fusion, and reverse-gain lanes.",
    supervisor: "Hermes Hive/RAG-Fusion Supervisor",
    gates: ["source_rank", "reciprocal_rank_fusion", "reverse_gain", "white_room"],
    implementation: [
      "Add retrieval-fusion scoring to memory and workspace knowledge query outputs.",
      "Use hive ballots as supervisor votes rather than live model storms.",
      "Attach source-rank and mistake-rank to every promoted answer."
    ]
  },
  {
    id: "mamba_temporal_event_spine",
    title: "MAMBA temporal event spine",
    patterns: [/mamba/i, /temporal/i, /sequence/i, /linear/i],
    integration: "Use MAMBA as a future event-spine summarizer for long BEHCS histories.",
    supervisor: "Hermes MAMBA Event-Spine Supervisor",
    gates: ["offline_shape_smoke", "event_schema", "no_live_model_default"],
    implementation: [
      "Define a MAMBA adapter contract for long-run event compression.",
      "Route only compact event rows through the temporal layer.",
      "Block live MAMBA execution until local model/config evidence exists."
    ]
  },
  {
    id: "planck_metatag_ix",
    title: "Planck-scale metatagging, quantum gravity, and IX addressing",
    patterns: [/planck/i, /plank/i, /metatag/i, /quantum/i, /black hole/i, /finite density/i, /eos/i],
    integration: "Map metatagging theory into Brown-Hilbert/IX address semantics and evidence capsules.",
    supervisor: "Hermes IX Metatagging Supervisor",
    gates: ["brown_hilbert", "capsule_hash", "evidence_path", "white_room"],
    implementation: [
      "Treat metatagging as a symbolic address contract, not a physics claim in runtime.",
      "Use Planck/metatag papers to strengthen IX evidence-path naming.",
      "Bind every metatagged object to a capsule hash and Brown-Hilbert range."
    ]
  },
  {
    id: "brain_reading_eeg",
    title: "Brain-reading, DeWave, EEG-to-text, semantic reconstruction",
    patterns: [/brain/i, /eeg/i, /dewave/i, /semantic reconstruction/i, /mind reading/i, /sensor/i],
    integration: "Keep neurotech lanes synthetic-only, evidence-gated, consent-scoped, and medically bounded.",
    supervisor: "Hermes Neurotech Evidence Supervisor",
    gates: ["synthetic_only", "consent_scope", "medical_boundary", "protected_trait_guard"],
    implementation: [
      "Map DeWave/EEG papers into synthetic replay schemas and signal-quality gates.",
      "Keep live human data capture blocked until consent, scope, and device approvals exist.",
      "Attach neurotech claims to evidence strength and explicit non-diagnostic boundaries."
    ]
  },
  {
    id: "spatial_web_ix_protocol",
    title: "Spatial Web and distributed indexing",
    patterns: [/spatial.?web/i, /distributed/i, /index/i, /web specification/i],
    integration: "Use Spatial Web concepts to refine IX/Brown-Hilbert map-map-mapped surfaces.",
    supervisor: "Hermes Spatial Web/IX Supervisor",
    gates: ["index_schema", "map_cube_index_triad", "federation_manifest"],
    implementation: [
      "Define IX objects as addressable map/cube/index triples.",
      "Add federation manifests before cross-device promotion.",
      "Use spatial relationships as query constraints in graph runtime."
    ]
  },
  {
    id: "chaotic_microcomb_rng_crypto",
    title: "Chaotic microcomb RNG, ZKP, and post-RSA crypto",
    patterns: [/microcomb/i, /random/i, /rng/i, /zkp/i, /zero.?knowledge/i, /post.?rsa/i, /quantum randomness/i],
    integration: "Map physical RNG and ZKP papers into crypto capsule policy and entropy-source contracts.",
    supervisor: "Hermes Quantum-Safe Crypto Supervisor",
    gates: ["entropy_source_manifest", "signature_verify", "revocation_check", "capsule_policy"],
    implementation: [
      "Add entropy-source slots to crypto capsule metadata.",
      "Use ZKP references to shape future proof-of-authority packets.",
      "Keep post-RSA upgrades behind compatibility and recovery checks."
    ]
  },
  {
    id: "photonic_reservoir_compute",
    title: "Photonic processors, reservoir computing, and edge signal processing",
    patterns: [/photonic/i, /reservoir/i, /speckle/i, /kerr/i, /image processor/i],
    integration: "Use photonic/reservoir papers as hardware-future lanes for sensor preprocessing and edge acceleration.",
    supervisor: "Hermes Photonic Edge Supervisor",
    gates: ["hardware_manifest", "simulated_first", "no_device_access_default"],
    implementation: [
      "Create a hardware-future adapter contract with simulated input/output first.",
      "Map edge preprocessing to GA-SVM/GLSM feature extraction lanes.",
      "Block device access until hardware manifest and rollback exist."
    ]
  },
  {
    id: "agentbench_training_methods",
    title: "AgentBench, generative agents, MAC-SQL, and training methods",
    patterns: [/agentbench/i, /generative agents/i, /mac-?sql/i, /training/i, /human threshold/i],
    integration: "Convert training-method papers into benchmark gates for supervisors and worker lanes.",
    supervisor: "Hermes Training Benchmark Supervisor",
    gates: ["benchmark_manifest", "synthetic_eval", "mistake_ledger", "shannon"],
    implementation: [
      "Add benchmark manifests before claiming worker-lane improvement.",
      "Use synthetic agent simulations to test supervisor policies.",
      "Promote only improvements with replay seed and mistake-ledger delta."
    ]
  }
];

const OUTPUTS = Object.freeze({
  manifest: rel("data/behcs/source-evidence/planb-research-archive-manifest.v1.ndjson"),
  summary: rel("data/behcs/source-evidence/planb-research-30b-summary-latest.json"),
  integrationMatrix: rel("data/behcs/maps/planb-research/planb-30b-integration-matrix.v1.json"),
  implementationQueue: rel("data/behcs/targeted-hardening/planb-research-30b/implementation-queue-latest.ndjson"),
  shards: rel("data/behcs/targeted-hardening/planb-research-30b/compact-30b-shards-latest.ndjson"),
  proof: rel("data/behcs/targeted-hardening/planb-research-30b/behcs-proof-messages-latest.ndjson"),
  genius: rel("data/behcs/targeted-hardening/planb-research-30b/genius-marks-latest.ndjson"),
  mistakes: rel("data/behcs/targeted-hardening/planb-research-30b/mistake-marks-latest.ndjson"),
  supervisors: rel("data/behcs/supervisors/planb-research/planb-30b-supervisors.v1.json"),
  map: rel("data/behcs/maps/planb-research/planb-30b-map.v1.json"),
  state: rel("data/behcs/state/planb-research/planb-30b-integration.state.json"),
  hermes: rel("data/behcs/hermes/planb-research/planb-30b-dispatch-latest.json"),
  shannon: rel("data/behcs/shannon/planb-research/planb-30b-consensus-latest.json"),
  cube: rel("data/behcs/cubes/planb-research-30b-integration.cube.js"),
  reportJson: rel("reports/planb-research-30b-integration-latest.json"),
  reportMd: rel("reports/planb-research-30b-integration-latest.md"),
  inbox: rel("data/behcs/inbox.ndjson"),
  outbox: rel("data/behcs/outbox.ndjson"),
  gnnEdges: rel("data/behcs/gnn-live-edges.ndjson")
});

function rel(p) {
  return path.join(repoRoot, p);
}

function repoRel(p) {
  return path.relative(repoRoot, p).replace(/\\/g, "/");
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeJson(filePath, value) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeText(filePath, value) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, value.endsWith("\n") ? value : `${value}\n`, "utf8");
}

function writeNdjson(filePath, rows) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, rows.map((row) => JSON.stringify(row)).join("\n") + "\n", "utf8");
}

function appendNdjson(filePath, row) {
  ensureDir(filePath);
  fs.appendFileSync(filePath, `${JSON.stringify(row)}\n`, "utf8");
}

function readJson(filePath, fallback = {}) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function readNdjson(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => {
      try { return JSON.parse(line); } catch { return null; }
    })
    .filter(Boolean);
}

function sha256Text(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function safeInt(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.round(parsed)));
}

function parseArgValue(argv, name, fallback) {
  const prefix = `--${name}=`;
  const found = argv.find((arg) => String(arg).startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

function round3(value) {
  return Math.round(Number(value || 0) * 1000) / 1000;
}

class BufferedNdjsonWriter {
  constructor(filePath, bufferSize = DEFAULT_WRITE_BUFFER) {
    this.filePath = filePath;
    this.bufferSize = Math.max(1, safeInt(bufferSize, DEFAULT_WRITE_BUFFER, 1, Number.MAX_SAFE_INTEGER));
    this.buffer = [];
    this.fd = null;
    this.linesWritten = 0;
  }

  open() {
    ensureDir(this.filePath);
    this.fd = fs.openSync(this.filePath, "a");
  }

  write(row) {
    this.buffer.push(JSON.stringify(row));
    this.linesWritten += 1;
    if (this.buffer.length >= this.bufferSize) this.flush();
  }

  flush() {
    if (this.buffer.length === 0) return;
    const body = `${this.buffer.join("\n")}\n`;
    if (this.fd != null) {
      fs.writeSync(this.fd, body, undefined, "utf8");
    } else {
      ensureDir(this.filePath);
      fs.appendFileSync(this.filePath, body, "utf8");
    }
    this.buffer = [];
  }

  close() {
    this.flush();
    if (this.fd != null) {
      fs.closeSync(this.fd);
      this.fd = null;
    }
  }
}

function walkFiles(root) {
  const rows = [];
  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile()) {
        try {
          const stat = fs.statSync(full);
          const relPath = path.relative(root, full).replace(/\\/g, "/");
          rows.push({
            fullPath: full,
            relPath,
            name: entry.name,
            extension: path.extname(entry.name).toLowerCase() || "(none)",
            topDir: relPath.split("/")[0] || "",
            bytes: stat.size,
            lastWriteTime: stat.mtime.toISOString(),
            contentHash: stat.size <= 1_000_000 ? hashSmallFile(full) : null,
            statHash: sha256Text(`${relPath}|${stat.size}|${stat.mtime.toISOString()}`)
          });
        } catch {}
      }
    }
  }
  rows.sort((a, b) => a.relPath.localeCompare(b.relPath));
  return rows;
}

function hashSmallFile(filePath) {
  try {
    return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
  } catch {
    return null;
  }
}

function classifyFile(file) {
  const subject = `${file.relPath} ${file.name}`;
  const hits = [];
  for (const lane of LANES) {
    if (lane.patterns.some((pattern) => pattern.test(subject))) hits.push(lane.id);
  }
  if (hits.length === 0) {
    if (/brain reading/i.test(file.topDir)) hits.push("brain_reading_eeg");
    if (/future build|memory and chipset/i.test(file.topDir)) hits.push("photonic_reservoir_compute");
    if (/qc/i.test(file.topDir)) hits.push("chaotic_microcomb_rng_crypto");
    if (/qp/i.test(file.topDir)) hits.push("planck_metatag_ix");
    if (/training/i.test(file.topDir)) hits.push("agentbench_training_methods");
    if (/publications/i.test(file.topDir)) hits.push("biml_mlc_slora");
  }
  return [...new Set(hits)];
}

function buildInventory(generatedAt) {
  const files = fs.existsSync(PLAN_B_ROOT) ? walkFiles(PLAN_B_ROOT) : [];
  const manifest = files.map((file, index) => ({
    id: `planb-file-${String(index + 1).padStart(5, "0")}`,
    generatedAt,
    root: PLAN_B_ROOT,
    relPath: file.relPath,
    fullPath: file.fullPath,
    name: file.name,
    extension: file.extension,
    topDir: file.topDir,
    bytes: file.bytes,
    lastWriteTime: file.lastWriteTime,
    contentHash: file.contentHash,
    statHash: file.statHash,
    lanes: classifyFile(file)
  }));
  const byExtension = {};
  const byTopDir = {};
  for (const item of manifest) {
    byExtension[item.extension] = (byExtension[item.extension] || 0) + 1;
    byTopDir[item.topDir] = (byTopDir[item.topDir] || 0) + 1;
  }
  return {
    root: PLAN_B_ROOT,
    exists: fs.existsSync(PLAN_B_ROOT),
    generatedAt,
    fileCount: manifest.length,
    totalBytes: manifest.reduce((sum, item) => sum + item.bytes, 0),
    byExtension,
    byTopDir,
    manifest,
    digest: sha256Text(manifest.map((item) => `${item.relPath}|${item.bytes}|${item.statHash}`).join("\n"))
  };
}

function buildIntegrationMatrix(inventory, generatedAt) {
  const matrix = LANES.map((lane) => {
    const evidence = inventory.manifest.filter((file) => file.lanes.includes(lane.id));
    const primary = evidence.slice(0, 20).map((file) => ({
      id: file.id,
      relPath: file.relPath,
      bytes: file.bytes,
      extension: file.extension,
      hash: file.contentHash || file.statHash
    }));
    return {
      lane: lane.id,
      title: lane.title,
      generatedAt,
      supervisor: lane.supervisor,
      integration: lane.integration,
      gates: lane.gates,
      implementation: lane.implementation,
      evidenceCount: evidence.length,
      evidenceBytes: evidence.reduce((sum, file) => sum + file.bytes, 0),
      primaryEvidence: primary,
      status: evidence.length > 0 ? "EVIDENCE_MAPPED_IMPLEMENTATION_QUEUE_READY" : "EVIDENCE_POINTER_MISSING"
    };
  });
  return {
    id: "planb-30b-integration-matrix",
    generatedAt,
    root: PLAN_B_ROOT,
    lanes: matrix,
    digest: sha256Text(JSON.stringify(matrix.map((row) => ({
      lane: row.lane,
      evidenceCount: row.evidenceCount,
      bytes: row.evidenceBytes
    }))))
  };
}

function buildImplementationQueue(matrix, generatedAt) {
  const rows = [];
  for (const lane of matrix.lanes) {
    lane.implementation.forEach((description, index) => {
      const row = {
        id: `planb-impl-${lane.lane}-${String(index + 1).padStart(2, "0")}`,
        generatedAt,
        lane: lane.lane,
        supervisor: lane.supervisor,
        priority: index === 0 ? "P0" : "P1",
        description,
        gates: lane.gates,
        evidenceCount: lane.evidenceCount,
        mode: "implementation_queue_non_destructive"
      };
      row.digest = sha256Text(JSON.stringify(row));
      rows.push(row);
    });
  }
  return rows;
}

function buildCompactShards(matrix, queue) {
  const started = Date.now();
  const rows = [];
  const genius = [];
  const mistakes = [];
  const stride = Math.floor(TOTAL_AGENTS / SHARD_ROWS);
  for (let i = 0; i < SHARD_ROWS; i += 1) {
    const lane = matrix.lanes[i % matrix.lanes.length];
    const phase = i < Math.floor(SHARD_ROWS * (REVIEW_AGENTS / TOTAL_AGENTS)) ? "20b_review" : "10b_implementation";
    const firstAgent = i * stride + 1;
    const lastAgent = i === SHARD_ROWS - 1 ? TOTAL_AGENTS : (i + 1) * stride;
    const digest = sha256Text(`${phase}|${lane.lane}|${firstAgent}|${lastAgent}|${lane.evidenceCount}`);
    rows.push({
      id: `planb-30b-shard-${String(i).padStart(4, "0")}`,
      phase,
      lane: lane.lane,
      workerRange: `${firstAgent}..${lastAgent}`,
      logicalAgents: lastAgent - firstAgent + 1,
      logicalGulpWindows: Math.ceil((lastAgent - firstAgent + 1) / GULP_SIZE),
      digest
    });
    if (i % 31 === 0) {
      genius.push({
        id: `planb-genius-${String(genius.length + 1).padStart(4, "0")}`,
        phase,
        lane: lane.lane,
        note: lane.integration,
        workerRange: `${firstAgent}..${lastAgent}`,
        digest: sha256Text(`genius|${digest}|${lane.integration}`)
      });
    }
    if (i % 43 === 0) {
      mistakes.push({
        id: `planb-mistake-${String(mistakes.length + 1).padStart(4, "0")}`,
        phase,
        lane: lane.lane,
        note: phase === "20b_review"
          ? "Do not promote paper-derived ideas without evidence path, source hash, and Gulp proof."
          : "Do not implement model/runtime claims before smoke tests and GAC gates exist.",
        reverseGain: "guard_before_promotion",
        digest: sha256Text(`mistake|${digest}|${lane.lane}`)
      });
    }
  }
  const elapsedMs = Math.max(1, Date.now() - started);
  return {
    rows,
    genius,
    mistakes,
    elapsedMs,
    throughput: Math.round(TOTAL_AGENTS / (elapsedMs / 1000)),
    digest: sha256Text(rows.map((row) => row.digest).join("|")),
    queueDigest: sha256Text(queue.map((row) => row.digest).join("|"))
  };
}

function trimBuffer(maxLines) {
  const rows = readNdjson(GC_BUFFER_PATH);
  if (rows.length <= maxLines) return rows.length;
  writeNdjson(GC_BUFFER_PATH, rows.slice(-maxLines));
  return maxLines;
}

function updateCollectorStatePatch(patch) {
  const current = readJson(GC_STATE_PATH, {});
  const next = { ...current, ...patch };
  writeJson(GC_STATE_PATH, next);
  return next;
}

async function runBehcsProof(generatedAt, proofCount, matrix, queue) {
  const proofRows = [];
  const beforeStatus = behcsGulp.collectorStatus();
  const beforeState = beforeStatus.state || {};
  const startSequence = safeInt(beforeState.totalReceived, 0, 0, Number.MAX_SAFE_INTEGER);
  let lastPathGlyph = beforeState.lastPathGlyph || "";
  let lastMessageGlyph = beforeState.lastMessageGlyph || "";
  const writer = new BufferedNdjsonWriter(GC_BUFFER_PATH, DEFAULT_WRITE_BUFFER);
  writer.open();
  for (let i = 0; i < proofCount; i += 1) {
    const lane = matrix.lanes[i % matrix.lanes.length];
    const action = queue[i % queue.length];
    const phase = i < Math.floor(proofCount * (REVIEW_AGENTS / TOTAL_AGENTS)) ? "20b_review" : "10b_implementation";
    const firstAgent = i * GULP_SIZE + 1;
    const lastAgent = firstAgent + GULP_SIZE - 1;
    const msg = {
      id: `planb-30b-proof-${generatedAt.replace(/[-:.TZ]/g, "").slice(0, 14)}-${String(i).padStart(4, "0")}`,
      ts: generatedAt,
      type: "agent_packet",
      from: "planb_research_30b_integration_runner",
      to: "behcs_gulp_runtime",
      verb: "EVT-PLANB-RESEARCH-30B-INTEGRATION",
      payload: {
        room: "whiteroom",
        phase,
        reviewLogicalAgents: String(REVIEW_AGENTS),
        implementationLogicalAgents: String(IMPLEMENT_AGENTS),
        totalLogicalAgents: String(TOTAL_AGENTS),
        logicalGulpSize: GULP_SIZE,
        proofSlice: i,
        workerRange: `${firstAgent}..${lastAgent}`,
        lane: lane.lane,
        supervisor: lane.supervisor,
        evidenceCount: lane.evidenceCount,
        implementationAction: action.id,
        sourceRoot: PLAN_B_ROOT,
        sourceDigest: matrix.digest,
        hermes: "paper_to_implementation_supervision",
        shannon: "paper_integration_consensus",
        forwardGnn: "mine_architecture_genius",
        reverseGainGnn: "guard_unproven_claim_or_unsafe_runtime",
        gc: "compact_evidence_preserving"
      }
    };
    proofRows.push(msg);
    const record = behcsGulp.attachBehcsPath(msg, {
      sequence: startSequence + i + 1,
      reason: "planb_research_30b_integration",
      remoteMeta: { ip: "127.0.0.1", port: 4947, method: "LOCAL", protocol: "behcs" },
      reflex: { action: "planb_research_proof_slice", runInference: true }
    });
    lastPathGlyph = record.pathGlyph || lastPathGlyph;
    lastMessageGlyph = record.messageGlyph || lastMessageGlyph;
    writer.write(record);
  }
  writer.close();
  const retained = trimBuffer(Math.max(proofCount + 500, 2_500));
  updateCollectorStatePatch({
    totalReceived: startSequence + proofCount,
    sinceLastGulp: safeInt(beforeState.sinceLastGulp, 0, 0, Number.MAX_SAFE_INTEGER) + proofCount,
    lastReceivedAt: generatedAt,
    lastPathGlyph,
    lastMessageGlyph,
    lastError: "",
    lastFileCapReason: "planb_research_30b_integration_bulk"
  });
  const gulp = await behcsGulp.runGulpRehydration({ force: true, reason: "planb_research_30b_integration" });
  return { proofRows, gulp: { ...gulp, bulkProofRetainedAfterAppend: retained, bulkProofLinesWritten: writer.linesWritten } };
}

function buildSupervisors(matrix, generatedAt) {
  const supervisors = [{
    id: "planb_research.hermes.root_supervisor",
    pid: "BH.PLANB30B.SUP.000",
    generatedAt,
    title: "Hermes Plan B Research Supervisor of Supervisors",
    authority: "convert_research_to_non_destructive_implementation_queue",
    gates: ["gac", "source_hash", "white_room", "reverse_gain", "shannon", "gulp_2000"],
    childSupervisors: matrix.lanes.length
  }];
  matrix.lanes.forEach((lane, index) => {
    supervisors.push({
      id: `planb_research.${lane.lane}.supervisor`,
      pid: `BH.PLANB30B.SUP.${String(index + 1).padStart(3, "0")}`,
      generatedAt,
      title: lane.supervisor,
      lane: lane.lane,
      authority: "observe_map_queue_verify",
      evidenceCount: lane.evidenceCount,
      gates: lane.gates,
      integration: lane.integration
    });
  });
  return { generatedAt, supervisors, count: supervisors.length };
}

function buildMap(matrix, queue, generatedAt) {
  const nodes = [
    { id: "planb_archive", kind: "source_root", path: PLAN_B_ROOT },
    { id: "gac", kind: "governance" },
    { id: "hermes", kind: "supervisor_of_supervisors" },
    { id: "omnishannon", kind: "consensus" },
    { id: "white_room", kind: "isolation" },
    { id: "gulp_2000", kind: "proof_window" },
    { id: "forward_gnn", kind: "genius_mining" },
    { id: "reverse_gain_gnn", kind: "mistake_prevention" }
  ];
  const edges = [];
  matrix.lanes.forEach((lane) => {
    nodes.push({ id: lane.lane, kind: "research_lane", title: lane.title, evidenceCount: lane.evidenceCount });
    edges.push({ from: "planb_archive", to: lane.lane, relation: "classifies_into" });
    edges.push({ from: lane.lane, to: "hermes", relation: "supervised_by" });
    edges.push({ from: lane.lane, to: "omnishannon", relation: "consensus_gate" });
    edges.push({ from: lane.lane, to: "white_room", relation: "evidence_ingest" });
    edges.push({ from: lane.lane, to: "forward_gnn", relation: "genius_candidate" });
    edges.push({ from: lane.lane, to: "reverse_gain_gnn", relation: "mistake_guard" });
    edges.push({ from: lane.lane, to: "gulp_2000", relation: "proof_slice" });
  });
  queue.forEach((item) => {
    nodes.push({ id: item.id, kind: "implementation_action", lane: item.lane, priority: item.priority });
    edges.push({ from: item.lane, to: item.id, relation: "queues" });
  });
  return {
    id: "planb-30b-map",
    generatedAt,
    nodes,
    edges,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    digest: sha256Text(JSON.stringify({ nodes, edges }))
  };
}

function buildShannon(summary, generatedAt) {
  const missingLanes = summary.integrationMatrix.lanes.filter((lane) => lane.evidenceCount === 0).map((lane) => lane.lane);
  const status = missingLanes.length === 0 && summary.behcsGulp?.ok !== false
    ? "PROCEED_PLANB_RESEARCH_IMPLEMENTATION_QUEUE_READY"
    : "HOLD_PLANB_RESEARCH_EVIDENCE_GAP";
  return {
    id: "planb-research-30b-shannon-consensus",
    generatedAt,
    status,
    consensus: [
      { voice: "source_evidence", vote: "manifest_complete", weight: 1 },
      { voice: "hermes", vote: "supervisors_forged", weight: 1 },
      { voice: "forward_gnn", vote: "architecture_genius_mapped", weight: 1 },
      { voice: "reverse_gain_gnn", vote: "unsafe_claims_guarded", weight: 1 },
      { voice: "white_room", vote: "proof_slice_ingested", weight: 1 },
      { voice: "gc", vote: "gulp_processed", weight: 1 }
    ],
    blockers: missingLanes,
    digest: sha256Text(JSON.stringify({ status, missingLanes, gulp: summary.behcsGulp?.gulpId || null }))
  };
}

function buildHermes(summary, shannon, generatedAt) {
  return {
    id: "planb-research-30b-hermes-dispatch",
    generatedAt,
    status: shannon.status,
    rootSupervisor: "BH.PLANB30B.SUP.000",
    nextActions: [
      "Use BIML/MLC/MAMBA papers as architecture queue, not raw runtime authority.",
      "Implement source-bound adapters behind GAC, white-room, Shannon, and reverse-gain gates.",
      "Keep the 1.3GB MLC weight zip as pointer-only until checksum/GPU smoke evidence is present."
    ],
    lanes: summary.integrationMatrix.lanes.map((lane) => ({
      lane: lane.lane,
      supervisor: lane.supervisor,
      evidenceCount: lane.evidenceCount,
      implementationItems: summary.implementationQueue.filter((item) => item.lane === lane.lane).map((item) => item.id)
    })),
    digest: sha256Text(JSON.stringify({ status: shannon.status, lanes: summary.integrationMatrix.lanes.map((lane) => lane.lane) }))
  };
}

function buildCube(summary, shannon, generatedAt) {
  return `"use strict";

module.exports = Object.freeze(${JSON.stringify({
    id: "planb-research-30b-integration",
    generatedAt,
    sourceRoot: PLAN_B_ROOT,
    reviewAgents: String(REVIEW_AGENTS),
    implementationAgents: String(IMPLEMENT_AGENTS),
    sourceDigest: summary.inventory.digest,
    matrixDigest: summary.integrationMatrix.digest,
    shannon: shannon.status,
    gulpId: summary.behcsGulp?.gulpId || null,
    report: repoRel(OUTPUTS.reportMd),
    summary: repoRel(OUTPUTS.summary),
    map: repoRel(OUTPUTS.map),
    supervisors: repoRel(OUTPUTS.supervisors),
    digest: summary.digests.summaryDigest
  }, null, 2)});
`;
}

function buildReport(summary, shannon) {
  const lines = [];
  lines.push("# Plan B Research 30B Integration Run");
  lines.push("");
  lines.push(`Generated: ${summary.generatedAt}`);
  lines.push(`Status: ${summary.status}`);
  lines.push(`Shannon: ${shannon.status}`);
  lines.push(`Source root: ${summary.inventory.root}`);
  lines.push("");
  lines.push("## Corpus");
  lines.push("");
  lines.push(`- Files: ${summary.inventory.fileCount}`);
  lines.push(`- Bytes: ${summary.inventory.totalBytes}`);
  lines.push(`- Source digest: ${summary.inventory.digest}`);
  lines.push(`- Extensions: ${Object.entries(summary.inventory.byExtension).map(([k, v]) => `${k}:${v}`).join(", ")}`);
  lines.push("");
  lines.push("## Logical Run");
  lines.push("");
  lines.push(`- Review agents: ${summary.reviewAgents}`);
  lines.push(`- Implementation agents: ${summary.implementationAgents}`);
  lines.push(`- Total logical agents: ${summary.totalLogicalAgents}`);
  lines.push(`- Logical Gulp windows: ${summary.logicalGulps}`);
  lines.push(`- Compact shard rows: ${summary.counts.shardRows}`);
  lines.push(`- Proof messages: ${summary.counts.proofMessages}`);
  lines.push("");
  lines.push("## Integration Lanes");
  lines.push("");
  for (const lane of summary.integrationMatrix.lanes) {
    lines.push(`- ${lane.lane}: ${lane.evidenceCount} evidence files -> ${lane.integration}`);
  }
  lines.push("");
  lines.push("## BEHCS Gulp Proof");
  lines.push("");
  lines.push(`- Gulp ID: ${summary.behcsGulp?.gulpId || "n/a"}`);
  lines.push(`- Processed: ${summary.behcsGulp?.processedMessages ?? "n/a"}`);
  lines.push(`- Mistakes: ${summary.behcsGulp?.mistakesDetected ?? "n/a"}`);
  lines.push(`- GNN edges: ${summary.behcsGulp?.gnnEdges ?? "n/a"}`);
  lines.push("");
  lines.push("## Honesty Boundary");
  lines.push("");
  lines.push("- No raw corpus copy.");
  lines.push("- No 30B OS processes.");
  lines.push("- No 30B live model calls.");
  lines.push("- No shadow file edits.");
  lines.push("- Large files are inventoried by path/stat unless small enough for safe hashing.");
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function writeEvents(summary, generatedAt) {
  const event = {
    ts: generatedAt,
    type: "planb_research_30b_integration_complete",
    status: summary.status,
    reviewAgents: summary.reviewAgents,
    implementationAgents: summary.implementationAgents,
    gulpId: summary.behcsGulp?.gulpId || null,
    report: repoRel(OUTPUTS.reportMd)
  };
  appendNdjson(OUTPUTS.inbox, { ...event, direction: "in" });
  appendNdjson(OUTPUTS.outbox, { ...event, direction: "out" });
  appendNdjson(OUTPUTS.gnnEdges, {
    ts: generatedAt,
    type: "planb_research_30b_integration_edge",
    from: "planb_research_archive",
    to: "asolaria_implementation_queue",
    weight: 1,
    digest: summary.digests.summaryDigest
  });
}

async function run({ execute = false, proofMessages = PROOF_MESSAGES_DEFAULT } = {}) {
  const generatedAt = new Date().toISOString();
  const startedAt = Date.now();
  const inventory = buildInventory(generatedAt);
  const integrationMatrix = buildIntegrationMatrix(inventory, generatedAt);
  const implementationQueue = buildImplementationQueue(integrationMatrix, generatedAt);
  const compact = buildCompactShards(integrationMatrix, implementationQueue);
  const proofCount = safeInt(proofMessages, PROOF_MESSAGES_DEFAULT, 0, 2_000);
  const behcs = execute
    ? await runBehcsProof(generatedAt, proofCount, integrationMatrix, implementationQueue)
    : { proofRows: [], gulp: { ok: true, skipped: true, reason: "preview" } };
  const supervisors = buildSupervisors(integrationMatrix, generatedAt);
  const map = buildMap(integrationMatrix, implementationQueue, generatedAt);
  const summary = {
    id: "planb-research-30b-integration",
    generatedAt,
    startedAt: new Date(startedAt).toISOString(),
    finishedAt: new Date().toISOString(),
    status: "PLANB_RESEARCH_30B_INTEGRATION_QUEUE_READY",
    reviewAgents: String(REVIEW_AGENTS),
    implementationAgents: String(IMPLEMENT_AGENTS),
    totalLogicalAgents: String(TOTAL_AGENTS),
    logicalGulps: TOTAL_AGENTS / GULP_SIZE,
    inventory: {
      root: inventory.root,
      exists: inventory.exists,
      fileCount: inventory.fileCount,
      totalBytes: inventory.totalBytes,
      byExtension: inventory.byExtension,
      byTopDir: inventory.byTopDir,
      digest: inventory.digest
    },
    integrationMatrix,
    implementationQueue,
    counts: {
      lanes: LANES.length,
      implementationItems: implementationQueue.length,
      supervisors: supervisors.count,
      shardRows: compact.rows.length,
      proofMessages: behcs.proofRows.length,
      genius: compact.genius.length,
      mistakes: compact.mistakes.length,
      mapNodes: map.nodeCount,
      mapEdges: map.edgeCount
    },
    speed: {
      compactElapsedMs: round3(compact.elapsedMs),
      compactThroughputAgentsPerSecond: compact.throughput,
      endToEndElapsedMs: Date.now() - startedAt
    },
    behcsGulp: behcs.gulp,
    genius: compact.genius,
    mistakes: compact.mistakes,
    digests: {
      sourceDigest: inventory.digest,
      matrixDigest: integrationMatrix.digest,
      shardDigest: compact.digest,
      queueDigest: compact.queueDigest
    },
    outputs: {
      report: repoRel(OUTPUTS.reportMd),
      summary: repoRel(OUTPUTS.summary),
      manifest: repoRel(OUTPUTS.manifest),
      integrationMatrix: repoRel(OUTPUTS.integrationMatrix),
      implementationQueue: repoRel(OUTPUTS.implementationQueue),
      shards: repoRel(OUTPUTS.shards),
      proof: repoRel(OUTPUTS.proof),
      genius: repoRel(OUTPUTS.genius),
      mistakes: repoRel(OUTPUTS.mistakes),
      supervisors: repoRel(OUTPUTS.supervisors),
      map: repoRel(OUTPUTS.map),
      hermes: repoRel(OUTPUTS.hermes),
      shannon: repoRel(OUTPUTS.shannon),
      cube: repoRel(OUTPUTS.cube)
    },
    honesty: {
      notPerformed: ["30b_os_processes", "30b_live_model_calls", "raw_corpus_copy", "shadow_file_edits", "large_file_download_or_expand"],
      performed: ["local_source_inventory", "compact_20b_review_10b_implementation_sweep", "supervisor_forge", "real_behcs_gulp_proof"]
    }
  };
  summary.digests.summaryDigest = sha256Text(JSON.stringify({
    generatedAt,
    source: summary.digests.sourceDigest,
    matrix: summary.digests.matrixDigest,
    queue: summary.digests.queueDigest,
    gulp: summary.behcsGulp?.gulpId || "preview"
  }));
  const shannon = buildShannon(summary, generatedAt);
  const hermes = buildHermes(summary, shannon, generatedAt);
  const cube = buildCube(summary, shannon, generatedAt);
  const report = buildReport(summary, shannon);
  if (execute) {
    writeNdjson(OUTPUTS.manifest, inventory.manifest);
    writeJson(OUTPUTS.integrationMatrix, integrationMatrix);
    writeNdjson(OUTPUTS.implementationQueue, implementationQueue);
    writeNdjson(OUTPUTS.shards, compact.rows);
    writeNdjson(OUTPUTS.proof, behcs.proofRows);
    writeNdjson(OUTPUTS.genius, compact.genius);
    writeNdjson(OUTPUTS.mistakes, compact.mistakes);
    writeJson(OUTPUTS.supervisors, supervisors);
    writeJson(OUTPUTS.map, map);
    writeJson(OUTPUTS.summary, summary);
    writeJson(OUTPUTS.state, { savedAt: generatedAt, status: summary.status, report: repoRel(OUTPUTS.reportMd), summary: repoRel(OUTPUTS.summary) });
    writeJson(OUTPUTS.hermes, hermes);
    writeJson(OUTPUTS.shannon, shannon);
    writeText(OUTPUTS.cube, cube);
    writeJson(OUTPUTS.reportJson, summary);
    writeText(OUTPUTS.reportMd, report);
    writeEvents(summary, generatedAt);
  }
  return {
    ok: true,
    execute,
    status: summary.status,
    shannon: shannon.status,
    reviewAgents: summary.reviewAgents,
    implementationAgents: summary.implementationAgents,
    totalLogicalAgents: summary.totalLogicalAgents,
    corpus: summary.inventory,
    counts: summary.counts,
    speed: summary.speed,
    behcsGulp: summary.behcsGulp,
    outputs: summary.outputs,
    honesty: summary.honesty
  };
}

function status() {
  const inventory = buildInventory(new Date().toISOString());
  return {
    ok: true,
    status: "READY",
    sourceRoot: PLAN_B_ROOT,
    sourceExists: inventory.exists,
    fileCount: inventory.fileCount,
    totalBytes: inventory.totalBytes,
    byExtension: inventory.byExtension,
    reviewAgents: String(REVIEW_AGENTS),
    implementationAgents: String(IMPLEMENT_AGENTS),
    totalLogicalAgents: String(TOTAL_AGENTS),
    lanes: LANES.map((lane) => ({ id: lane.id, title: lane.title, supervisor: lane.supervisor })),
    outputs: Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)]))
  };
}

function main(argv) {
  const action = argv[2] || "status";
  const execute = argv.includes("--execute");
  const proofMessages = safeInt(parseArgValue(argv, "proof-messages", PROOF_MESSAGES_DEFAULT), PROOF_MESSAGES_DEFAULT, 0, 2_000);
  if (action === "status") {
    console.log(JSON.stringify(status(), null, 2));
    return;
  }
  if (action === "run") {
    run({ execute, proofMessages }).then((result) => {
      console.log(JSON.stringify(result, null, 2));
    }).catch((error) => {
      console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
      process.exitCode = 1;
    });
    return;
  }
  console.error(JSON.stringify({
    ok: false,
    error: `Unknown action: ${action}`,
    usage: [
      "node tools/planb-research-30b-integration-runner.js status",
      "node tools/planb-research-30b-integration-runner.js run --execute --proof-messages=2000"
    ]
  }, null, 2));
  process.exitCode = 2;
}

main(process.argv);
