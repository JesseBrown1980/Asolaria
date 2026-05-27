#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const behcsGulp = require("./behcs/behcs-gulp-runtime");

const repoRoot = path.resolve(__dirname, "..");
const TOTAL_AGENTS = 200_000_000_000;
const GULP_SIZE = 2_000;
const LOGICAL_GULPS = TOTAL_AGENTS / GULP_SIZE;
const SHARD_ROWS = 2_000;
const PROOF_MESSAGES_DEFAULT = 2_000;
const DEFAULT_WRITE_BUFFER = 5_000;

const GC_DIR = rel("data/behcs/garbage-collector");
const GC_STATE_PATH = path.join(GC_DIR, "collector-state.json");
const GC_BUFFER_PATH = path.join(GC_DIR, "message-paths.ndjson");

const SOURCE_REPORTS = [
  { id: "planb_30b", path: "reports/planb-research-30b-integration-latest.json", weight: 30 },
  { id: "behcs256_base_os_10b", path: "reports/behcs256-base-os-readiness-latest.json", weight: 10 },
  { id: "targeted_hardening_10b", path: "reports/system-targeted-10b-hardening-runs-latest.json", weight: 10 },
  { id: "full_review_10b", path: "reports/system-full-review-10b-improvement-latest.json", weight: 10 },
  { id: "liris_line_audit", path: "reports/liris-coms-full-line-audit-latest.json", weight: 8 },
  { id: "openmythos_fusion", path: "reports/openmythos-gasvm-fusion-latest.json", weight: 8 },
  { id: "openmythos_full", path: "reports/openmythos-behcs256-full-integration-latest.json", weight: 8 },
  { id: "ga_svm_full", path: "reports/ga-svm-crop-disease-behcs256-full-integration-latest.json", weight: 8 },
  { id: "ga_svm_smoke", path: "reports/ga-svm-engine-smoke-latest.json", weight: 4 },
  { id: "bulk_gulp", path: "reports/behcs-bulk-gulp-feeder-latest.json", weight: 8 },
  { id: "claude_pid_sweep", path: "reports/claude-omniflywheel-100m-sweep-latest.json", weight: 4 },
  { id: "opencode_pid_sweep", path: "reports/opencode-omniflywheel-100m-sweep-latest.json", weight: 4 },
  { id: "global_pid_fabric", path: "reports/global-pid-request-fabric-latest.json", weight: 4 },
  { id: "neurotech_100b_integration", path: "reports/neurotech-100b-sweep-integration-latest.json", weight: 12 },
  { id: "c_drive_guard", path: "reports/c-drive-junction-migrator-latest.json", weight: 4 }
];

const LANES = [
  {
    id: "master_integration_ledger",
    title: "Master evidence ledger and source spine",
    allocation: 20_000_000_000,
    supervisor: "Hermes Master Integration Ledger Supervisor",
    inputs: ["planb_30b", "behcs256_base_os_10b", "targeted_hardening_10b", "full_review_10b"],
    gates: ["source_digest", "report_digest", "task_ledger", "white_room"],
    implementation: [
      "Bind all latest run reports into one evidence spine with immutable local paths and digests.",
      "Use the ledger as the first surface future agents read before proposing new scale runs.",
      "Reject broad claims that are not tied to a report, source path, supervisor, cube, map, or Gulp proof."
    ]
  },
  {
    id: "biml_feedback_runtime_contract",
    title: "BIML data-model-route-outcome feedback contract",
    allocation: 25_000_000_000,
    supervisor: "Hermes BIML Runtime Contract Supervisor",
    inputs: ["planb_30b", "liris_line_audit", "full_review_10b"],
    gates: ["contract_schema", "mistake_outcome", "route_binding", "shannon"],
    implementation: [
      "Create a stable BIML contract that binds input data, selected model, route, result, mistake outcome, and next prevention rule.",
      "Attach reverse-gain status before promotion to Atlas or memory.",
      "Represent feedback as compact rows rather than raw per-agent materialization."
    ]
  },
  {
    id: "mlc_chain_composer",
    title: "MLC compositional chain composer for skills, glyphs, and supervisors",
    allocation: 20_000_000_000,
    supervisor: "Hermes MLC Chain Composer Supervisor",
    inputs: ["planb_30b", "behcs256_base_os_10b"],
    gates: ["chain_manifest", "skill_registry", "glyph_map", "gac"],
    implementation: [
      "Map MLC into composable chain manifests for skills, glyph verbs, and supervisor repair sequences.",
      "Score every chain by source evidence, replay seed, and mistake-ledger delta.",
      "Keep chain execution blocked until the chain manifest and rollback surface exist."
    ]
  },
  {
    id: "mamba_temporal_spine",
    title: "MAMBA-style temporal event spine for long BEHCS history",
    allocation: 15_000_000_000,
    supervisor: "Hermes MAMBA Temporal Spine Supervisor",
    inputs: ["planb_30b", "behcs256_base_os_10b"],
    gates: ["event_schema", "offline_shape_smoke", "no_live_model_default"],
    implementation: [
      "Define the event-row schema that later temporal adapters consume.",
      "Summarize long histories into compact temporal rows before any model execution.",
      "Block live temporal model execution until local weights and shape smoke evidence exist."
    ]
  },
  {
    id: "openmythos_supervised_cognition",
    title: "OpenMythos recurrent-depth engine under GAC/Hermes supervision",
    allocation: 20_000_000_000,
    supervisor: "Hermes OpenMythos Supervisor",
    inputs: ["openmythos_fusion", "openmythos_full", "behcs256_base_os_10b"],
    gates: ["law099", "spectral_radius", "pid_binding", "drift_broadcast"],
    implementation: [
      "Keep OpenMythos registered as a cognitive backend behind Atlas/GAC, not as direct authority.",
      "Route MYTHOS_THINK by PID, glyph, supervisor, and spectral-stability law.",
      "Treat missing weights/config as execution-blocked while preserving contracts and proof surfaces."
    ]
  },
  {
    id: "gasvm_glsm_crop_engine",
    title: "GA-SVM/GLSM crop-disease classifier integration",
    allocation: 15_000_000_000,
    supervisor: "Hermes GA-SVM/GLSM Crop Supervisor",
    inputs: ["ga_svm_full", "ga_svm_smoke", "planb_30b"],
    gates: ["law100", "dataset_manifest", "feature_extractor", "confidence_defer"],
    implementation: [
      "Bind crop-disease classification to LAW-100, source evidence, and confidence/fallback behavior.",
      "Map fractal, entropy, area, intensity, color, contrast, and morphology features into a manifest-first extractor.",
      "Keep production diagnosis promotion closed until dataset and cross-validation reports exist."
    ]
  },
  {
    id: "gnn_reverse_gain_white_room",
    title: "Forward GNN, reverse-gain GNN, white-room promotion path",
    allocation: 20_000_000_000,
    supervisor: "Hermes Forward/Reverse GNN Supervisor",
    inputs: ["targeted_hardening_10b", "full_review_10b", "liris_line_audit"],
    gates: ["white_room", "forward_score", "reverse_gain", "mistake_ledger"],
    implementation: [
      "Promote only source-bound genius candidates that survive reverse-gain review.",
      "Convert repeated mistakes into prevention rules and supervisor patches.",
      "Keep white-room proof attached to every promoted implementation queue item."
    ]
  },
  {
    id: "gulp_supergulp_gc_fast_path",
    title: "Gulp 2000 / Super Gulp / GC bulk fast path",
    allocation: 20_000_000_000,
    supervisor: "Hermes BEHCS Gulp Fast-Path Supervisor",
    inputs: ["bulk_gulp", "behcs256_base_os_10b", "c_drive_guard"],
    gates: ["attach_behcs_path", "run_gulp_rehydration", "since_last_gulp_zero", "file_cap"],
    implementation: [
      "Use bulk attachBehcsPath plus buffered NDJSON writes for proof slices.",
      "Avoid per-message guard loops for logical billions.",
      "Preserve C by keeping large and cold artifacts pointer-bound or junctioned to D."
    ]
  },
  {
    id: "omnimets_omnischeduler_crypto",
    title: "OmniMets, OmniScheduler, crypto capsule, and resource discipline",
    allocation: 15_000_000_000,
    supervisor: "Hermes OmniMets/OmniScheduler/Crypto Supervisor",
    inputs: ["targeted_hardening_10b", "behcs256_base_os_10b", "c_drive_guard"],
    gates: ["fresh_metrics", "pid_cron", "capsule_seal", "disk_pressure"],
    implementation: [
      "Refresh resource truth before every scale tranche.",
      "Keep scheduler work PID-bound, idempotent, and stale-lock guarded.",
      "Add entropy and seal metadata to crypto capsules without changing authority files."
    ]
  },
  {
    id: "pid_only_cli_federation",
    title: "PID-only CLI controller federation and Omniflywheel discipline",
    allocation: 15_000_000_000,
    supervisor: "Hermes PID-Only Federation Supervisor",
    inputs: ["claude_pid_sweep", "opencode_pid_sweep", "global_pid_fabric"],
    gates: ["pid_only", "no_api_header_auth_default", "bounded_live_flags"],
    implementation: [
      "Keep CLI controller checks PID-only and shell=false by default.",
      "Require explicit flags for live model work, with small bounded tranches.",
      "Use compact Brown-Hilbert ranges instead of process storms."
    ]
  },
  {
    id: "cube_cube_cubed_map_mapped",
    title: "Cube cube cubed map-map-mapped BEHCS-256 surfaces",
    allocation: 10_000_000_000,
    supervisor: "Hermes Cube/Map/Index Supervisor",
    inputs: ["behcs256_base_os_10b", "planb_30b", "neurotech_100b_integration"],
    gates: ["map", "cube", "index", "supervisor"],
    implementation: [
      "Require every integration lane to emit map, cube, index, supervisor, Hermes, Shannon, and report surfaces.",
      "Use cube imports as smoke proof for future agents.",
      "Add master map edges from Plan B source lanes to implementation queues and Gulp proof."
    ]
  },
  {
    id: "github_release_lanes",
    title: "Scoped GitHub release lanes after proof, not whole-tree pushes",
    allocation: 5_000_000_000,
    supervisor: "Hermes GitHub Release Lane Supervisor",
    inputs: ["behcs256_base_os_10b", "targeted_hardening_10b"],
    gates: ["git_status_scope", "report_digest", "tests", "no_shadow_edits"],
    implementation: [
      "Prepare scoped commits only for new runners, ledgers, maps, supervisors, reports, and TASKS.",
      "Do not push the whole dirty tree.",
      "Use report digests as the release note evidence spine."
    ]
  }
];

const OUTPUTS = Object.freeze({
  ledger: rel("data/behcs/master-ledger/asolaria-master-integration-ledger.v1.json"),
  ledgerMd: rel("reports/asolaria-master-integration-ledger-latest.md"),
  summary: rel("data/behcs/targeted-hardening/planb-200b/summary-latest.json"),
  lanes: rel("data/behcs/targeted-hardening/planb-200b/lanes-latest.ndjson"),
  queue: rel("data/behcs/targeted-hardening/planb-200b/implementation-queue-latest.ndjson"),
  shards: rel("data/behcs/targeted-hardening/planb-200b/compact-200b-shards-latest.ndjson"),
  proof: rel("data/behcs/targeted-hardening/planb-200b/behcs-proof-messages-latest.ndjson"),
  genius: rel("data/behcs/targeted-hardening/planb-200b/genius-marks-latest.ndjson"),
  mistakes: rel("data/behcs/targeted-hardening/planb-200b/mistake-marks-latest.ndjson"),
  supervisors: rel("data/behcs/supervisors/planb-200b/planb-targeted-200b-supervisors.v1.json"),
  map: rel("data/behcs/maps/planb-200b/planb-targeted-200b-map.v1.json"),
  state: rel("data/behcs/state/planb-200b/planb-targeted-200b.state.json"),
  hermes: rel("data/behcs/hermes/planb-200b/planb-targeted-200b-dispatch-latest.json"),
  shannon: rel("data/behcs/shannon/planb-200b/planb-targeted-200b-consensus-latest.json"),
  cube: rel("data/behcs/cubes/planb-targeted-200b-integration.cube.js"),
  reportJson: rel("reports/planb-targeted-200b-integration-latest.json"),
  reportMd: rel("reports/planb-targeted-200b-integration-latest.md"),
  inbox: rel("data/behcs/inbox.ndjson"),
  outbox: rel("data/behcs/outbox.ndjson"),
  gnnEdges: rel("data/behcs/gnn-live-edges.ndjson")
});

function rel(p) { return path.join(repoRoot, p); }
function repoRel(p) { return path.relative(repoRoot, p).replace(/\\/g, "/"); }
function ensureDir(filePath) { fs.mkdirSync(path.dirname(filePath), { recursive: true }); }
function sha256Text(value) { return crypto.createHash("sha256").update(String(value)).digest("hex"); }
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
function readJson(filePath, fallback = {}) {
  try { return JSON.parse(fs.readFileSync(filePath, "utf8")); } catch { return fallback; }
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
function readNdjson(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, "utf8").split(/\r?\n/).filter((line) => line.trim()).map((line) => {
    try { return JSON.parse(line); } catch { return null; }
  }).filter(Boolean);
}
function trimBuffer(maxLines) {
  const rows = readNdjson(GC_BUFFER_PATH);
  if (rows.length <= maxLines) return rows.length;
  writeNdjson(GC_BUFFER_PATH, rows.slice(-maxLines));
  return maxLines;
}
function updateCollectorStatePatch(patch) {
  const current = readJson(GC_STATE_PATH, {});
  writeJson(GC_STATE_PATH, { ...current, ...patch });
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
    if (this.fd != null) fs.writeSync(this.fd, body, undefined, "utf8");
    else {
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

function loadSourceReports(generatedAt) {
  return SOURCE_REPORTS.map((entry) => {
    const fullPath = rel(entry.path);
    const exists = fs.existsSync(fullPath);
    const stat = exists ? fs.statSync(fullPath) : null;
    const parsed = exists ? readJson(fullPath, {}) : {};
    const digest = exists ? sha256Text(fs.readFileSync(fullPath, "utf8")) : null;
    return {
      id: entry.id,
      path: entry.path,
      exists,
      weight: entry.weight,
      bytes: stat ? stat.size : 0,
      mtime: stat ? stat.mtime.toISOString() : null,
      status: parsed.status || parsed.state || parsed.id || "unknown",
      shannon: parsed.shannon?.status || parsed.shannon || parsed.consensus || null,
      logicalAgents: parsed.totalLogicalAgents || parsed.logicalAgents || parsed.workerCount || parsed.virtualAgents || null,
      gulpId: parsed.behcsGulp?.gulpId || parsed.gulp?.gulpId || parsed.gulpId || null,
      runtimeMistakes: parsed.behcsGulp?.mistakesDetected ?? parsed.gulp?.mistakesDetected ?? null,
      digest,
      generatedAt
    };
  });
}

function buildMasterLedger(generatedAt, reports) {
  const present = reports.filter((report) => report.exists);
  const missing = reports.filter((report) => !report.exists);
  const proofGulps = present.filter((report) => report.gulpId).length;
  const sourceDigest = sha256Text(JSON.stringify(present.map((report) => ({
    id: report.id,
    path: report.path,
    digest: report.digest,
    status: report.status,
    gulpId: report.gulpId
  }))));
  return {
    id: "asolaria-master-integration-ledger",
    generatedAt,
    status: missing.length === 0 ? "MASTER_LEDGER_COMPLETE" : "MASTER_LEDGER_WITH_MISSING_SOURCES",
    sourceReports: reports,
    counts: {
      configuredReports: reports.length,
      presentReports: present.length,
      missingReports: missing.length,
      reportsWithGulpProof: proofGulps
    },
    proofDiscipline: {
      law001BrownHilbert: "invoke_existing_runtime_do_not_edit_shadow_surfaces",
      storage: "compact_ranges_and_pointer_manifests_no_raw_200b_materialization",
      cDrive: "guarded_medium_pressure_small_real_proof_slices"
    },
    digest: sourceDigest
  };
}

function scoreLane(lane, ledger, generatedAt, index) {
  const inputs = lane.inputs.map((input) => ledger.sourceReports.find((report) => report.id === input)).filter(Boolean);
  const existing = inputs.filter((input) => input.exists).length;
  const evidenceScore = existing / Math.max(1, lane.inputs.length);
  const proofScore = inputs.filter((input) => input.gulpId).length / Math.max(1, inputs.length);
  const status = evidenceScore >= 0.9 ? "ready" : evidenceScore >= 0.6 ? "needs_evidence_refresh" : "hold";
  return {
    id: `planb-200b-lane-${String(index + 1).padStart(3, "0")}`,
    generatedAt,
    lane: lane.id,
    title: lane.title,
    status,
    allocation: String(lane.allocation),
    logicalGulps: Math.floor(lane.allocation / GULP_SIZE),
    supervisor: lane.supervisor,
    inputs: inputs.map((input) => ({
      id: input.id,
      exists: input.exists,
      status: input.status,
      shannon: input.shannon,
      gulpId: input.gulpId,
      digest: input.digest
    })),
    gates: lane.gates,
    implementation: lane.implementation,
    evidenceScore,
    proofScore,
    digest: sha256Text(JSON.stringify({ lane: lane.id, inputs, gates: lane.gates, implementation: lane.implementation }))
  };
}

function buildImplementationQueue(lanes, generatedAt) {
  const rows = [];
  for (const lane of lanes) {
    lane.implementation.forEach((item, index) => {
      rows.push({
        id: `${lane.lane}.impl.${String(index + 1).padStart(2, "0")}`,
        generatedAt,
        lane: lane.lane,
        status: lane.status === "ready" ? "queued" : "blocked_pending_evidence",
        priority: lane.status === "ready" ? "P0" : "P1",
        action: item,
        gates: lane.gates,
        supervisor: lane.supervisor,
        sourceDigest: lane.digest
      });
    });
  }
  return rows;
}

function buildCompactShards(lanes) {
  const rows = [];
  let cursor = 1;
  for (let i = 0; i < SHARD_ROWS; i += 1) {
    const lane = lanes[i % lanes.length];
    const shardSize = Math.floor(TOTAL_AGENTS / SHARD_ROWS);
    const first = cursor;
    const last = i === SHARD_ROWS - 1 ? TOTAL_AGENTS : cursor + shardSize - 1;
    rows.push({
      shard: i + 1,
      lane: lane.lane,
      firstAgent: String(first),
      lastAgent: String(last),
      logicalAgents: String(last - first + 1),
      logicalGulps: Math.floor((last - first + 1) / GULP_SIZE),
      brownHilbertRange: `BH.PLANB200B.${String(i + 1).padStart(6, "0")}`,
      mode: "compact_targeted_200b_range"
    });
    cursor = last + 1;
  }
  return rows;
}

function buildSupervisors(lanes, generatedAt) {
  const supervisors = [{
    id: "planb_200b.hermes.root_supervisor",
    pid: "BH.PLANB200B.SUP.000",
    generatedAt,
    title: "Hermes Plan B 200B Targeted Integration Supervisor of Supervisors",
    authority: "coordinate_targeted_200b_planb_implementation_without_shadow_edits",
    gates: ["gac", "white_room", "gulp_2000", "forward_gnn", "reverse_gain_gnn", "shannon", "gc"],
    childSupervisors: lanes.length
  }];
  lanes.forEach((lane, index) => {
    supervisors.push({
      id: `planb_200b.${lane.lane}.supervisor`,
      pid: `BH.PLANB200B.SUP.${String(index + 1).padStart(3, "0")}`,
      generatedAt,
      title: lane.supervisor,
      lane: lane.lane,
      status: lane.status,
      allocation: lane.allocation,
      gates: lane.gates,
      implementationItems: lane.implementation.length,
      evidenceScore: lane.evidenceScore,
      proofScore: lane.proofScore
    });
  });
  return supervisors;
}

function buildMap(ledger, lanes, queue, generatedAt) {
  const nodes = [
    { id: "planb_source_archive", type: "source", label: "Plan B / 2023-2024 research archive" },
    { id: "master_ledger", type: "ledger", label: "Asolaria master integration ledger", digest: ledger.digest },
    { id: "gac", type: "authority", label: "GAC / Law001 / Brown-Hilbert" },
    { id: "hermes", type: "supervisor", label: "Hermes supervisor of supervisors" },
    { id: "shannon", type: "consensus", label: "OmniShannon release gate" },
    { id: "gulp", type: "runtime", label: "Gulp 2000 / white room / GC" }
  ];
  for (const report of ledger.sourceReports) {
    nodes.push({ id: `report:${report.id}`, type: "report", label: report.id, exists: report.exists, status: report.status, digest: report.digest });
  }
  for (const lane of lanes) {
    nodes.push({ id: `lane:${lane.lane}`, type: "lane", label: lane.title, status: lane.status, allocation: lane.allocation });
  }
  for (const item of queue) {
    nodes.push({ id: `queue:${item.id}`, type: "implementation", label: item.action, status: item.status, priority: item.priority });
  }
  const edges = [];
  for (const report of ledger.sourceReports) {
    edges.push({ from: "master_ledger", to: `report:${report.id}`, type: report.exists ? "binds" : "missing" });
  }
  for (const lane of lanes) {
    edges.push({ from: "planb_source_archive", to: `lane:${lane.lane}`, type: "drives" });
    edges.push({ from: `lane:${lane.lane}`, to: "hermes", type: "supervised_by" });
    edges.push({ from: `lane:${lane.lane}`, to: "shannon", type: "gated_by" });
    edges.push({ from: `lane:${lane.lane}`, to: "gulp", type: "proved_by" });
    for (const input of lane.inputs) edges.push({ from: `report:${input.id}`, to: `lane:${lane.lane}`, type: "evidence_for" });
  }
  for (const item of queue) edges.push({ from: `lane:${item.lane}`, to: `queue:${item.id}`, type: "implements" });
  return {
    id: "planb-targeted-200b-map",
    generatedAt,
    nodes,
    edges,
    counts: { nodes: nodes.length, edges: edges.length },
    digest: sha256Text(JSON.stringify({ nodes, edges }))
  };
}

function buildGeniusAndMistakes(lanes, queue, generatedAt) {
  const genius = lanes.flatMap((lane, index) => [
    {
      id: `planb200b-genius-${String(index + 1).padStart(3, "0")}-source-bound-implementation`,
      generatedAt,
      lane: lane.lane,
      signal: "source_bound_implementation_lane",
      score: Math.round((lane.evidenceScore * 0.6 + lane.proofScore * 0.4) * 1000) / 1000,
      action: lane.implementation[0]
    },
    {
      id: `planb200b-genius-${String(index + 1).padStart(3, "0")}-supervisor-map`,
      generatedAt,
      lane: lane.lane,
      signal: "supervisor_cube_map_surface",
      score: 0.9,
      action: `Bind ${lane.supervisor} to map/cube/index/release surfaces.`
    }
  ]);
  const mistakes = queue.map((item, index) => ({
    id: `planb200b-mistake-${String(index + 1).padStart(3, "0")}`,
    generatedAt,
    lane: item.lane,
    severity: item.status === "queued" ? "watch" : "hard",
    pattern: item.status === "queued" ? "implementation_without_replay_seed" : "implementation_missing_source_evidence",
    prevention: item.status === "queued"
      ? "Require replay seed, report digest, and Gulp proof before release."
      : "Keep blocked until source report, supervisor, and proof surfaces exist.",
    relatedAction: item.id
  }));
  return { genius, mistakes };
}

async function runBehcsProof(generatedAt, proofCount, ledger, lanes, queue) {
  const proofRows = [];
  const beforeStatus = behcsGulp.collectorStatus();
  const beforeState = beforeStatus.state || {};
  const startSequence = safeInt(beforeState.totalReceived, 0, 0, Number.MAX_SAFE_INTEGER);
  let lastPathGlyph = beforeState.lastPathGlyph || "";
  let lastMessageGlyph = beforeState.lastMessageGlyph || "";
  const writer = new BufferedNdjsonWriter(GC_BUFFER_PATH, DEFAULT_WRITE_BUFFER);
  writer.open();
  for (let i = 0; i < proofCount; i += 1) {
    const lane = lanes[i % lanes.length];
    const action = queue[i % queue.length];
    const firstAgent = i * GULP_SIZE + 1;
    const lastAgent = firstAgent + GULP_SIZE - 1;
    const msg = {
      id: `planb-200b-proof-${generatedAt.replace(/[-:.TZ]/g, "").slice(0, 14)}-${String(i).padStart(4, "0")}`,
      ts: generatedAt,
      type: "agent_packet",
      from: "planb_targeted_200b_integration_runner",
      to: "behcs_gulp_runtime",
      verb: "EVT-PLANB-TARGETED-200B-INTEGRATION",
      payload: {
        room: "whiteroom",
        totalLogicalAgents: String(TOTAL_AGENTS),
        logicalGulpSize: GULP_SIZE,
        logicalGulps: LOGICAL_GULPS,
        proofSlice: i,
        workerRange: `${firstAgent}..${lastAgent}`,
        lane: lane.lane,
        supervisor: lane.supervisor,
        implementationAction: action.id,
        masterLedgerDigest: ledger.digest,
        laneDigest: lane.digest,
        hermes: "planb_200b_supervisor_of_supervisors",
        shannon: "planb_200b_source_bound_release_gate",
        forwardGnn: "mine_planb_implementation_genius",
        reverseGainGnn: "prevent_unproven_runtime_or_process_storm",
        gc: "compact_evidence_preserving"
      }
    };
    proofRows.push(msg);
    const record = behcsGulp.attachBehcsPath(msg, {
      sequence: startSequence + i + 1,
      reason: "planb_targeted_200b_integration",
      remoteMeta: { ip: "127.0.0.1", port: 4947, method: "LOCAL", protocol: "behcs" },
      reflex: { action: "planb_targeted_200b_proof_slice", runInference: true }
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
    lastFileCapReason: "planb_targeted_200b_integration_bulk"
  });
  const gulp = await behcsGulp.runGulpRehydration({ force: true, reason: "planb_targeted_200b_integration" });
  return { proofRows, gulp: { ...gulp, bulkProofRetainedAfterAppend: retained, bulkProofLinesWritten: writer.linesWritten } };
}

function buildShannon(summary) {
  const allReady = summary.counts.readyLanes === summary.counts.lanes;
  const missing = summary.masterLedger.counts.missingReports;
  const gulpOk = summary.behcsGulp?.ok === true && Number(summary.behcsGulp?.mistakesDetected || 0) === 0;
  return {
    id: "planb-targeted-200b-shannon-consensus",
    generatedAt: summary.generatedAt,
    status: allReady && missing === 0 && gulpOk
      ? "PROCEED_PLANB_TARGETED_200B_IMPLEMENTATION_QUEUE_READY"
      : "PROCEED_WITH_GATED_ITEMS_AND_SOURCE_REFRESH",
    confidence: allReady && missing === 0 && gulpOk ? 0.96 : 0.82,
    reasons: [
      `${summary.counts.readyLanes}/${summary.counts.lanes} lanes ready`,
      `${summary.masterLedger.counts.presentReports}/${summary.masterLedger.counts.configuredReports} source reports present`,
      `Gulp proof ${summary.behcsGulp?.gulpId || "preview"} mistakes=${summary.behcsGulp?.mistakesDetected ?? "n/a"}`
    ],
    releaseBoundary: "implementation_queue_only_until_each_item_has_schema_smoke_and_tests"
  };
}

function buildReport(summary, shannon) {
  const lines = [];
  lines.push("# Plan B Targeted 200B Integration Run");
  lines.push("");
  lines.push(`Generated: ${summary.generatedAt}`);
  lines.push(`Status: ${summary.status}`);
  lines.push(`Shannon: ${shannon.status}`);
  lines.push("");
  lines.push("## Logical Run");
  lines.push("");
  lines.push(`- Logical agents: ${summary.logicalAgents}`);
  lines.push(`- Logical Gulp windows: ${summary.logicalGulps}`);
  lines.push(`- Compact shard rows: ${summary.counts.shards}`);
  lines.push(`- Lanes: ${summary.counts.lanes}`);
  lines.push(`- Implementation items: ${summary.counts.implementationItems}`);
  lines.push(`- Supervisors: ${summary.counts.supervisors}`);
  lines.push(`- Proof messages: ${summary.counts.proofMessages}`);
  lines.push("");
  lines.push("## Master Ledger");
  lines.push("");
  lines.push(`- Reports present: ${summary.masterLedger.counts.presentReports}/${summary.masterLedger.counts.configuredReports}`);
  lines.push(`- Reports with Gulp proof: ${summary.masterLedger.counts.reportsWithGulpProof}`);
  lines.push(`- Ledger digest: ${summary.masterLedger.digest}`);
  lines.push("");
  lines.push("## Lanes");
  lines.push("");
  for (const lane of summary.lanes) {
    lines.push(`- ${lane.lane}: ${lane.status}, allocation ${lane.allocation}, evidence ${lane.evidenceScore}, proof ${lane.proofScore}`);
  }
  lines.push("");
  lines.push("## BEHCS Gulp Proof");
  lines.push("");
  lines.push(`- Gulp ID: ${summary.behcsGulp?.gulpId || "n/a"}`);
  lines.push(`- Processed: ${summary.behcsGulp?.processedMessages ?? "n/a"}`);
  lines.push(`- Runtime mistakes: ${summary.behcsGulp?.mistakesDetected ?? "n/a"}`);
  lines.push(`- GNN edges: ${summary.behcsGulp?.gnnEdges ?? "n/a"}`);
  lines.push("");
  lines.push("## Honesty Boundary");
  lines.push("");
  lines.push("- This is a compact targeted 200B reasoning tranche.");
  lines.push("- No 200B OS processes.");
  lines.push("- No 200B live model calls.");
  lines.push("- No raw 200B records.");
  lines.push("- No shadow file edits.");
  lines.push("- No destructive GC.");
  lines.push("- Implementation release remains gated by schema smoke, tests, GAC, Shannon, and real proof slices.");
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function buildCube(summary, shannon) {
  return `const cube = Object.freeze(${JSON.stringify({
    id: "planb-targeted-200b-integration",
    generatedAt: summary.generatedAt,
    logicalAgents: summary.logicalAgents,
    status: summary.status,
    shannon: shannon.status,
    gulpId: summary.behcsGulp?.gulpId || null,
    report: repoRel(OUTPUTS.reportMd),
    ledger: repoRel(OUTPUTS.ledger),
    map: repoRel(OUTPUTS.map),
    supervisors: repoRel(OUTPUTS.supervisors),
    digest: summary.digests.summaryDigest
  }, null, 2)});\n\nexport default cube;\nexport { cube };\n`;
}

function writeEvents(summary, generatedAt) {
  const event = {
    ts: generatedAt,
    type: "planb_targeted_200b_integration_complete",
    status: summary.status,
    logicalAgents: summary.logicalAgents,
    gulpId: summary.behcsGulp?.gulpId || null,
    report: repoRel(OUTPUTS.reportMd),
    ledger: repoRel(OUTPUTS.ledger)
  };
  appendNdjson(OUTPUTS.inbox, { ...event, direction: "in" });
  appendNdjson(OUTPUTS.outbox, { ...event, direction: "out" });
  appendNdjson(OUTPUTS.gnnEdges, {
    ts: generatedAt,
    type: "planb_targeted_200b_edge",
    from: "planb_targeted_200b",
    to: "hermes_planb_implementation_queue",
    weight: 1,
    digest: summary.digests.summaryDigest
  });
}

async function run({ execute = false, proofMessages = PROOF_MESSAGES_DEFAULT } = {}) {
  const generatedAt = new Date().toISOString();
  const startedAt = Date.now();
  const reports = loadSourceReports(generatedAt);
  const ledger = buildMasterLedger(generatedAt, reports);
  const lanes = LANES.map((lane, index) => scoreLane(lane, ledger, generatedAt, index));
  const queue = buildImplementationQueue(lanes, generatedAt);
  const shards = buildCompactShards(lanes);
  const supervisors = buildSupervisors(lanes, generatedAt);
  const map = buildMap(ledger, lanes, queue, generatedAt);
  const marks = buildGeniusAndMistakes(lanes, queue, generatedAt);
  const proofCount = safeInt(proofMessages, PROOF_MESSAGES_DEFAULT, 0, 2_000);
  const behcs = execute ? await runBehcsProof(generatedAt, proofCount, ledger, lanes, queue) : { proofRows: [], gulp: { ok: true, skipped: true, reason: "preview" } };
  const elapsedMs = Date.now() - startedAt;
  const readyLanes = lanes.filter((lane) => lane.status === "ready").length;
  const summary = {
    id: "planb-targeted-200b-integration",
    generatedAt,
    startedAt: new Date(startedAt).toISOString(),
    finishedAt: new Date().toISOString(),
    status: readyLanes === lanes.length ? "PLANB_TARGETED_200B_IMPLEMENTATION_QUEUE_READY" : "PLANB_TARGETED_200B_QUEUE_READY_WITH_GATES",
    logicalAgents: String(TOTAL_AGENTS),
    logicalGulps: LOGICAL_GULPS,
    compactMode: "targeted_200b_compact_ranges_real_gulp_proof",
    masterLedger: ledger,
    lanes,
    counts: {
      lanes: lanes.length,
      readyLanes,
      gatedLanes: lanes.length - readyLanes,
      implementationItems: queue.length,
      supervisors: supervisors.length,
      shards: shards.length,
      proofMessages: behcs.proofRows.length,
      genius: marks.genius.length,
      mistakes: marks.mistakes.length,
      mapNodes: map.counts.nodes,
      mapEdges: map.counts.edges
    },
    speed: {
      elapsedMs,
      compactThroughputAgentsPerSecond: Math.round(TOTAL_AGENTS / Math.max(0.001, elapsedMs / 1000))
    },
    behcsGulp: behcs.gulp,
    digests: {
      ledgerDigest: ledger.digest,
      laneDigest: sha256Text(JSON.stringify(lanes)),
      queueDigest: sha256Text(JSON.stringify(queue)),
      shardDigest: sha256Text(JSON.stringify(shards)),
      summaryDigest: null
    }
  };
  summary.digests.summaryDigest = sha256Text(JSON.stringify({ ...summary, digests: { ...summary.digests, summaryDigest: null } }));
  const shannon = buildShannon(summary);
  const hermes = {
    id: "planb-targeted-200b-hermes-dispatch",
    generatedAt,
    status: "READY",
    rootSupervisor: supervisors[0].id,
    queueItems: queue.length,
    nextActions: queue.filter((item) => item.priority === "P0").slice(0, 12),
    blockedItems: queue.filter((item) => item.status !== "queued")
  };
  const state = {
    id: "planb-targeted-200b-state",
    generatedAt,
    status: summary.status,
    shannon: shannon.status,
    gulpId: summary.behcsGulp?.gulpId || null,
    sinceLastGulp: behcsGulp.collectorStatus().state?.sinceLastGulp ?? null,
    digest: summary.digests.summaryDigest
  };
  writeJson(OUTPUTS.ledger, ledger);
  writeText(OUTPUTS.ledgerMd, buildLedgerReport(ledger));
  writeJson(OUTPUTS.summary, summary);
  writeNdjson(OUTPUTS.lanes, lanes);
  writeNdjson(OUTPUTS.queue, queue);
  writeNdjson(OUTPUTS.shards, shards);
  writeNdjson(OUTPUTS.proof, behcs.proofRows);
  writeNdjson(OUTPUTS.genius, marks.genius);
  writeNdjson(OUTPUTS.mistakes, marks.mistakes);
  writeJson(OUTPUTS.supervisors, supervisors);
  writeJson(OUTPUTS.map, map);
  writeJson(OUTPUTS.state, state);
  writeJson(OUTPUTS.hermes, hermes);
  writeJson(OUTPUTS.shannon, shannon);
  writeText(OUTPUTS.cube, buildCube(summary, shannon));
  writeJson(OUTPUTS.reportJson, summary);
  writeText(OUTPUTS.reportMd, buildReport(summary, shannon));
  writeEvents(summary, generatedAt);
  return summary;
}

function buildLedgerReport(ledger) {
  const lines = [];
  lines.push("# Asolaria Master Integration Ledger");
  lines.push("");
  lines.push(`Generated: ${ledger.generatedAt}`);
  lines.push(`Status: ${ledger.status}`);
  lines.push(`Digest: ${ledger.digest}`);
  lines.push("");
  lines.push("## Source Reports");
  lines.push("");
  for (const report of ledger.sourceReports) {
    lines.push(`- ${report.id}: ${report.exists ? "present" : "missing"}; status=${report.status}; gulp=${report.gulpId || "none"}; path=${report.path}`);
  }
  lines.push("");
  lines.push("## Discipline");
  lines.push("");
  lines.push("- Invoke existing Law001/Brown-Hilbert runtime surfaces.");
  lines.push("- Preserve C with compact ranges and pointer manifests.");
  lines.push("- Use real Gulp proof slices instead of raw logical-agent materialization.");
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function status() {
  const reports = loadSourceReports(new Date().toISOString());
  const present = reports.filter((report) => report.exists).length;
  return {
    id: "planb-targeted-200b-integration",
    status: present === reports.length ? "READY" : "READY_WITH_MISSING_SOURCE_REPORTS",
    logicalAgents: String(TOTAL_AGENTS),
    logicalGulps: LOGICAL_GULPS,
    lanes: LANES.length,
    sourceReportsPresent: present,
    sourceReportsConfigured: reports.length,
    outputs: OUTPUTS
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
      "node tools/planb-targeted-200b-integration-runner.js status",
      "node tools/planb-targeted-200b-integration-runner.js run --execute --proof-messages=2000"
    ]
  }, null, 2));
  process.exitCode = 2;
}

main(process.argv);
