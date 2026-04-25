#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const behcsGulp = require("./behcs/behcs-gulp-runtime");

const repoRoot = path.resolve(__dirname, "..");
const TOTAL_AGENTS = 10_000_000_000;
const GULP_SIZE = 2_000;
const LOGICAL_GULPS = TOTAL_AGENTS / GULP_SIZE;
const SHARD_ROWS = 1_024;
const PROOF_MESSAGES_DEFAULT = 2_000;
const DEFAULT_WRITE_BUFFER = 5_000;

const GC_DIR = rel("data/behcs/garbage-collector");
const GC_STATE_PATH = path.join(GC_DIR, "collector-state.json");
const GC_BUFFER_PATH = path.join(GC_DIR, "message-paths.ndjson");

const LANES = [
  {
    id: "law001_authority_kernel",
    title: "LAW-001 authority kernel and Brown-Hilbert canon",
    evidence: ["BROWN-HILBERT.md", "00-TOP-AGENT-PRECOMMAND.md", "src/gateway/authorityMode.js", "src/gateway/toolAuthority.js", "docs/AUTHORITY_MODES.md"],
    checks: ["ports_4947_4950_preserved", "shadow_files_not_edited", "authority_fail_closed"],
    heal: "Keep Law001/Brown-Hilbert as the non-editable authority spine; add only adapter/proof files around it."
  },
  {
    id: "behcs_gulp_white_room_gc",
    title: "BEHCS Gulp 2000, white room, and evidence-preserving GC",
    evidence: ["tools/behcs/behcs-gulp-runtime.js", "tools/behcs-bulk-gulp-feeder.js", "data/behcs/garbage-collector/collector-state.json", "reports/behcs-bulk-gulp-feeder-latest.md"],
    checks: ["gulp_2000_bulk_path", "since_last_gulp_zero_after_proof", "no_raw_10b_record_write"],
    heal: "Use bulk attachBehcsPath plus runGulpRehydration for proof slices; never per-message guard 10B logical agents."
  },
  {
    id: "hermes_supervisor_healing",
    title: "Hermes supervisor-of-supervisors and Liris-style healing",
    evidence: ["tools/neurotech-hermes-supervisor-of-supervisors.js", "src/colonyAnatomy.js", "reports/neurotech-hermes-supervisor-of-supervisors-latest.md", "reports/liris-coms-full-line-audit-latest.md"],
    checks: ["diagnose_before_heal", "queue_non_destructive_actions", "reverse_gain_before_promotion"],
    heal: "Forge supervisors with diagnose-heal-diagnose contracts and record beyond-self-repair instead of guessing."
  },
  {
    id: "omnishannon_release_gate",
    title: "OmniShannon consensus and release gate",
    evidence: ["tools/cube/omni-shannon-v4-real.js", "tools/shannon-consensus/shannon-consensus.js", "data/behcs/shannon/planb-research/planb-30b-consensus-latest.json", "data/behcs/shannon/targeted-hardening/system-targeted-10b-hardening-consensus-latest.json"],
    checks: ["consensus_before_release", "low_confidence_defers", "source_bound_votes"],
    heal: "Release gates require source evidence, GAC, GNN, reverse-gain, and white-room proof."
  },
  {
    id: "forward_reverse_gnn",
    title: "Forward GNN genius mining and reverse-gain mistake prevention",
    evidence: ["data/behcs/gnn-active-report.json", "data/behcs/gnn-live-edges.ndjson", "tools/behcs/gnn-live-watcher.js", "data/behcs/d0-runtime/mistakes.ndjson"],
    checks: ["genius_candidate_scored", "mistakes_demoted_or_guarded", "edges_compacted"],
    heal: "Promote only scored patterns with replay seed, source path, and reverse-gain review."
  },
  {
    id: "omnimets_compute_storage",
    title: "OmniMets compute, disk, file-cap, and process truth",
    evidence: ["data/behcs/resource-budget-snapshot.json", "tools/cpu-gpu-watcher.js", "tools/Keep-Asolaria-SystemSupervisor.ps1", "reports/c-drive-junction-migrator-latest.md", "reports/c-drive-pressure-guardian-latest.md"],
    checks: ["fresh_resource_budget", "disk_pressure_guarded", "file_cap_pass", "process_pressure_visible"],
    heal: "Before every scale tranche refresh metrics and choose small checkpoints when pressure is medium."
  },
  {
    id: "omnischeduler_pid_cron",
    title: "OmniScheduler PID-bound cron and queue discipline",
    evidence: ["tools/behcs/agent-cron-kicker.js", "data/behcs/sovereignty/cron/behcs-cron.js", "data/behcs/d0-runtime/cron-kicks.ndjson", "tools/Run-NotebookBuildLoop-Scheduled.ps1"],
    checks: ["pid_bound_kicks", "idempotent_retries", "stale_lock_blocks_reentry"],
    heal: "Deduplicate scheduled work by PID/lane/Brown-Hilbert range and report lag into OmniMets."
  },
  {
    id: "cognitive_engine_stack",
    title: "OpenMythos, GA-SVM/GLSM, and cognitive engine routing",
    evidence: ["reports/openmythos-gasvm-fusion-latest.md", "reports/ga-svm-crop-disease-behcs256-full-integration-latest.md", "src/cognitiveEngines/runtimeBridge.js", "src/gac/laws/spectral-stability.js", "src/gac/laws/classification-stability.js"],
    checks: ["law099_recurrent_gate", "law100_classification_gate", "no_model_execution_without_evidence"],
    heal: "Keep model execution blocked until local weights/config/dataset manifests and smoke evidence exist."
  },
  {
    id: "planb_research_blueprints",
    title: "Plan B 2023-2024 research blueprint integration",
    evidence: ["reports/planb-research-30b-integration-latest.md", "data/behcs/source-evidence/planb-research-30b-summary-latest.json", "data/behcs/maps/planb-research/planb-30b-integration-matrix.v1.json"],
    checks: ["source_manifest_present", "implementation_queue_minted", "large_weights_pointer_only"],
    heal: "Use BIML/MLC/MAMBA/IX/crypto/neurotech papers as source-bound implementation queues, not unverified runtime authority."
  },
  {
    id: "federation_pid_fabric",
    title: "Federation, PID fabric, and CLI-controller discipline",
    evidence: ["reports/global-pid-request-fabric-latest.md", "reports/claude-omniflywheel-100m-sweep-latest.md", "reports/opencode-omniflywheel-100m-sweep-latest.md", "data/behcs/pid-fabric/preload/global-pid-preload-pack.v1.json"],
    checks: ["pid_only_cli_default", "no_api_header_auth_path", "compact_ranges_not_process_storms"],
    heal: "Keep CLI controller checks PID-only by default; live model paths require explicit flags and bounded tranches."
  }
];

const OUTPUTS = Object.freeze({
  summary: rel("data/behcs/base-os/readiness/behcs256-base-os-readiness-summary-latest.json"),
  lanes: rel("data/behcs/base-os/readiness/behcs256-base-os-readiness-lanes-latest.ndjson"),
  actions: rel("data/behcs/base-os/readiness/behcs256-base-os-healing-actions-latest.ndjson"),
  shards: rel("data/behcs/base-os/readiness/behcs256-base-os-compact-10b-shards-latest.ndjson"),
  proof: rel("data/behcs/base-os/readiness/behcs256-base-os-proof-messages-latest.ndjson"),
  supervisors: rel("data/behcs/supervisors/base-os/behcs256-base-os-supervisors.v1.json"),
  map: rel("data/behcs/maps/base-os/behcs256-base-os-readiness-map.v1.json"),
  state: rel("data/behcs/state/base-os/behcs256-base-os-readiness.state.json"),
  hermes: rel("data/behcs/hermes/base-os/behcs256-base-os-readiness-dispatch-latest.json"),
  shannon: rel("data/behcs/shannon/base-os/behcs256-base-os-readiness-consensus-latest.json"),
  cube: rel("data/behcs/cubes/behcs256-base-os-readiness.cube.js"),
  reportJson: rel("reports/behcs256-base-os-readiness-latest.json"),
  reportMd: rel("reports/behcs256-base-os-readiness-latest.md"),
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
function round3(value) { return Math.round(Number(value || 0) * 1000) / 1000; }

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

function evidenceStat(filePath) {
  const full = rel(filePath);
  try {
    const stat = fs.statSync(full);
    return { path: filePath, exists: true, bytes: stat.size, mtime: stat.mtime.toISOString() };
  } catch {
    return { path: filePath, exists: false };
  }
}

function buildLaneAssessments(generatedAt) {
  const resource = readJson(rel("data/behcs/resource-budget-snapshot.json"), {});
  const gcState = readJson(GC_STATE_PATH, {});
  return LANES.map((lane, index) => {
    const evidence = lane.evidence.map(evidenceStat);
    const existing = evidence.filter((item) => item.exists).length;
    const score = existing / Math.max(1, evidence.length);
    const runtimeSignals = {
      sinceLastGulp: gcState.sinceLastGulp,
      lastFileCapStatus: gcState.lastFileCapStatus,
      resourceGeneratedAt: resource.generatedAt || null,
      pressureLevel: resource.summary?.pressureLevel || "unknown",
      dispatchReady: resource.summary?.dispatchReady === true
    };
    const laneStatus = score >= 0.8 ? "ready" : score >= 0.5 ? "needs_evidence_refresh" : "hold";
    const row = {
      id: `behcs256-base-os-lane-${String(index + 1).padStart(3, "0")}`,
      generatedAt,
      lane: lane.id,
      title: lane.title,
      status: laneStatus,
      evidenceScore: round3(score),
      existingEvidence: existing,
      totalEvidence: evidence.length,
      missingEvidence: evidence.filter((item) => !item.exists).map((item) => item.path),
      checks: lane.checks,
      healing: lane.heal,
      runtimeSignals,
      evidence
    };
    row.digest = sha256Text(JSON.stringify({ lane: row.lane, score: row.evidenceScore, missing: row.missingEvidence, runtimeSignals }));
    return row;
  });
}

function buildActions(assessments, generatedAt) {
  const actions = [];
  for (const lane of assessments) {
    actions.push({
      id: `behcs256-base-os-heal-${lane.lane}`,
      generatedAt,
      lane: lane.lane,
      priority: lane.status === "hold" ? "P0" : lane.status === "needs_evidence_refresh" ? "P1" : "P2",
      description: lane.healing,
      gates: ["gac", "hermes", "shannon", "forward_gnn", "reverse_gain_gnn", "white_room", "gulp_2000", "gc"],
      mode: "queue_only_non_destructive",
      digest: sha256Text(`${lane.lane}|${lane.digest}|${lane.healing}`)
    });
    for (const missing of lane.missingEvidence.slice(0, 2)) {
      actions.push({
        id: `behcs256-base-os-evidence-${lane.lane}-${sha256Text(missing).slice(0, 8)}`,
        generatedAt,
        lane: lane.lane,
        priority: "P1",
        description: `Refresh evidence pointer ${missing}.`,
        gates: ["evidence_refresh", "white_room", "shannon"],
        mode: "queue_only_non_destructive",
        digest: sha256Text(`${lane.lane}|missing|${missing}`)
      });
    }
  }
  return actions;
}

function buildCompactShards(assessments) {
  const started = Date.now();
  const rows = [];
  const stride = Math.floor(TOTAL_AGENTS / SHARD_ROWS);
  for (let i = 0; i < SHARD_ROWS; i += 1) {
    const lane = assessments[i % assessments.length];
    const firstAgent = i * stride + 1;
    const lastAgent = i === SHARD_ROWS - 1 ? TOTAL_AGENTS : (i + 1) * stride;
    rows.push({
      id: `behcs256-base-os-shard-${String(i).padStart(4, "0")}`,
      lane: lane.lane,
      workerRange: `${firstAgent}..${lastAgent}`,
      logicalAgents: lastAgent - firstAgent + 1,
      logicalGulpWindows: Math.ceil((lastAgent - firstAgent + 1) / GULP_SIZE),
      laneDigest: lane.digest,
      digest: sha256Text(`${lane.lane}|${firstAgent}|${lastAgent}|${lane.digest}`)
    });
  }
  const elapsedMs = Math.max(1, Date.now() - started);
  return {
    rows,
    elapsedMs,
    throughput: Math.round(TOTAL_AGENTS / (elapsedMs / 1000)),
    digest: sha256Text(rows.map((row) => row.digest).join("|"))
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

async function runBehcsProof(generatedAt, proofCount, assessments, actions) {
  const proofRows = [];
  const beforeStatus = behcsGulp.collectorStatus();
  const beforeState = beforeStatus.state || {};
  const startSequence = safeInt(beforeState.totalReceived, 0, 0, Number.MAX_SAFE_INTEGER);
  let lastPathGlyph = beforeState.lastPathGlyph || "";
  let lastMessageGlyph = beforeState.lastMessageGlyph || "";
  const writer = new BufferedNdjsonWriter(GC_BUFFER_PATH, DEFAULT_WRITE_BUFFER);
  writer.open();
  for (let i = 0; i < proofCount; i += 1) {
    const lane = assessments[i % assessments.length];
    const action = actions[i % actions.length];
    const firstAgent = i * GULP_SIZE + 1;
    const lastAgent = firstAgent + GULP_SIZE - 1;
    const msg = {
      id: `behcs256-base-os-proof-${generatedAt.replace(/[-:.TZ]/g, "").slice(0, 14)}-${String(i).padStart(4, "0")}`,
      ts: generatedAt,
      type: "agent_packet",
      from: "behcs256_base_os_readiness_runner",
      to: "behcs_gulp_runtime",
      verb: "EVT-BEHCS256-BASE-OS-READINESS",
      payload: {
        room: "whiteroom",
        target: "BEHCS256_SUPER_BASE_OS_HARDENING",
        totalLogicalAgents: String(TOTAL_AGENTS),
        logicalGulpSize: GULP_SIZE,
        proofSlice: i,
        workerRange: `${firstAgent}..${lastAgent}`,
        lane: lane.lane,
        laneStatus: lane.status,
        evidenceScore: lane.evidenceScore,
        healingAction: action.id,
        hermes: "supervisor_of_supervisors_base_os_healing",
        shannon: "base_os_consensus_before_push",
        forwardGnn: "mine_base_os_genius_patterns",
        reverseGainGnn: "demote_unsafe_or_unproven_base_os_patterns",
        gc: "compact_evidence_preserving"
      }
    };
    proofRows.push(msg);
    const record = behcsGulp.attachBehcsPath(msg, {
      sequence: startSequence + i + 1,
      reason: "behcs256_base_os_readiness",
      remoteMeta: { ip: "127.0.0.1", port: 4947, method: "LOCAL", protocol: "behcs" },
      reflex: { action: "base_os_readiness_proof_slice", runInference: true }
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
    lastFileCapReason: "behcs256_base_os_readiness_bulk"
  });
  const gulp = await behcsGulp.runGulpRehydration({ force: true, reason: "behcs256_base_os_readiness" });
  return { proofRows, gulp: { ...gulp, bulkProofRetainedAfterAppend: retained, bulkProofLinesWritten: writer.linesWritten } };
}

function buildSupervisors(assessments, generatedAt) {
  const supervisors = [{
    id: "behcs256_base_os.hermes.root_supervisor",
    pid: "BH.BEHCS256.BASEOS.SUP.000",
    generatedAt,
    title: "Hermes BEHCS-256 Base-OS Supervisor of Supervisors",
    authority: "coordinate_base_os_hardening_queue_non_destructive",
    gates: ["gac", "shannon", "white_room", "forward_gnn", "reverse_gain_gnn", "gulp_2000", "gc"],
    childSupervisors: assessments.length
  }];
  assessments.forEach((lane, index) => {
    supervisors.push({
      id: `behcs256_base_os.${lane.lane}.supervisor`,
      pid: `BH.BEHCS256.BASEOS.SUP.${String(index + 1).padStart(3, "0")}`,
      generatedAt,
      title: `${lane.title} Supervisor`,
      lane: lane.lane,
      authority: "diagnose_queue_verify_only",
      status: lane.status,
      evidenceScore: lane.evidenceScore,
      checks: lane.checks
    });
  });
  return { generatedAt, supervisors, count: supervisors.length };
}

function buildMap(assessments, actions, generatedAt) {
  const nodes = [
    { id: "gac", kind: "governance" },
    { id: "hermes", kind: "supervisor_of_supervisors" },
    { id: "omnishannon", kind: "consensus" },
    { id: "white_room", kind: "isolation" },
    { id: "gulp_2000", kind: "gc_window" },
    { id: "forward_gnn", kind: "genius_mining" },
    { id: "reverse_gain_gnn", kind: "mistake_prevention" }
  ];
  const edges = [];
  for (const lane of assessments) {
    nodes.push({ id: lane.lane, kind: "base_os_lane", title: lane.title, status: lane.status });
    edges.push({ from: "gac", to: lane.lane, relation: "authorizes" });
    edges.push({ from: "hermes", to: lane.lane, relation: "supervises" });
    edges.push({ from: lane.lane, to: "omnishannon", relation: "consensus_gate" });
    edges.push({ from: lane.lane, to: "white_room", relation: "proof_ingest" });
    edges.push({ from: lane.lane, to: "forward_gnn", relation: "genius_candidate" });
    edges.push({ from: lane.lane, to: "reverse_gain_gnn", relation: "mistake_guard" });
    edges.push({ from: lane.lane, to: "gulp_2000", relation: "gc_proof" });
  }
  for (const action of actions) {
    nodes.push({ id: action.id, kind: "healing_action", lane: action.lane, priority: action.priority });
    edges.push({ from: action.lane, to: action.id, relation: "queues" });
  }
  return { id: "behcs256-base-os-readiness-map", generatedAt, nodes, edges, nodeCount: nodes.length, edgeCount: edges.length, digest: sha256Text(JSON.stringify({ nodes, edges })) };
}

function buildShannon(summary, generatedAt) {
  const blockers = summary.lanes.filter((lane) => lane.status === "hold");
  const status = blockers.length === 0 && summary.behcsGulp?.ok !== false
    ? "PROCEED_BEHCS256_BASE_OS_HARDENING_READY"
    : "HOLD_BEHCS256_BASE_OS_EVIDENCE_GAP";
  return {
    id: "behcs256-base-os-readiness-shannon-consensus",
    generatedAt,
    status,
    blockers: blockers.map((lane) => lane.lane),
    consensus: [
      { voice: "gac", vote: "authority_kernel_present", weight: 1 },
      { voice: "hermes", vote: "supervisors_forged", weight: 1 },
      { voice: "white_room", vote: "proof_ingested", weight: 1 },
      { voice: "forward_gnn", vote: "genius_patterns_mapped", weight: 1 },
      { voice: "reverse_gain_gnn", vote: "unsafe_patterns_guarded", weight: 1 },
      { voice: "gc", vote: "gulp_processed", weight: 1 }
    ],
    digest: sha256Text(JSON.stringify({ status, blockers: blockers.map((lane) => lane.digest), gulp: summary.behcsGulp?.gulpId || null }))
  };
}

function buildHermes(summary, shannon, generatedAt) {
  return {
    id: "behcs256-base-os-readiness-hermes-dispatch",
    generatedAt,
    status: shannon.status,
    rootSupervisor: "BH.BEHCS256.BASEOS.SUP.000",
    nextActions: [
      "Continue small checkpointed proof windows while process pressure is medium.",
      "Promote only source-bound, Gulp-proven, Shannon-approved changes.",
      "Keep shadow/Law001/Brown-Hilbert surfaces invoked, not edited."
    ],
    lanes: summary.lanes.map((lane) => ({
      lane: lane.lane,
      status: lane.status,
      score: lane.evidenceScore,
      actions: summary.actions.filter((action) => action.lane === lane.lane).map((action) => action.id)
    })),
    digest: sha256Text(JSON.stringify({ status: shannon.status, lanes: summary.lanes.map((lane) => lane.lane) }))
  };
}

function buildCube(summary, shannon, generatedAt) {
  return `"use strict";

module.exports = Object.freeze(${JSON.stringify({
    id: "behcs256-base-os-readiness",
    generatedAt,
    logicalAgents: summary.logicalAgents,
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
  lines.push("# BEHCS-256 Base-OS Readiness Run");
  lines.push("");
  lines.push(`Generated: ${summary.generatedAt}`);
  lines.push(`Status: ${summary.status}`);
  lines.push(`Shannon: ${shannon.status}`);
  lines.push("");
  lines.push("## Logical Run");
  lines.push("");
  lines.push(`- Logical agents: ${summary.logicalAgents}`);
  lines.push(`- Logical Gulp windows: ${summary.logicalGulps}`);
  lines.push(`- Lanes: ${summary.counts.lanes}`);
  lines.push(`- Supervisors: ${summary.counts.supervisors}`);
  lines.push(`- Actions: ${summary.counts.actions}`);
  lines.push(`- Shards: ${summary.counts.shards}`);
  lines.push(`- Proof messages: ${summary.counts.proofMessages}`);
  lines.push("");
  lines.push("## BEHCS Gulp Proof");
  lines.push("");
  lines.push(`- Gulp ID: ${summary.behcsGulp?.gulpId || "n/a"}`);
  lines.push(`- Processed: ${summary.behcsGulp?.processedMessages ?? "n/a"}`);
  lines.push(`- Mistakes: ${summary.behcsGulp?.mistakesDetected ?? "n/a"}`);
  lines.push(`- GNN edges: ${summary.behcsGulp?.gnnEdges ?? "n/a"}`);
  lines.push("");
  lines.push("## Lane Readiness");
  lines.push("");
  for (const lane of summary.lanes) {
    lines.push(`- ${lane.lane}: ${lane.status}, evidence ${lane.existingEvidence}/${lane.totalEvidence}, score ${lane.evidenceScore}`);
  }
  lines.push("");
  lines.push("## Honesty Boundary");
  lines.push("");
  lines.push("- No 10B OS processes.");
  lines.push("- No 10B live model calls.");
  lines.push("- No shadow file edits.");
  lines.push("- No destructive GC.");
  lines.push("- This is readiness hardening evidence, not final certification.");
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function writeEvents(summary, generatedAt) {
  const event = { ts: generatedAt, type: "behcs256_base_os_readiness_complete", status: summary.status, gulpId: summary.behcsGulp?.gulpId || null, report: repoRel(OUTPUTS.reportMd) };
  appendNdjson(OUTPUTS.inbox, { ...event, direction: "in" });
  appendNdjson(OUTPUTS.outbox, { ...event, direction: "out" });
  appendNdjson(OUTPUTS.gnnEdges, { ts: generatedAt, type: "behcs256_base_os_readiness_edge", from: "behcs256_base_os_readiness", to: "hermes_supervisor_queue", weight: 1, digest: summary.digests.summaryDigest });
}

async function run({ execute = false, proofMessages = PROOF_MESSAGES_DEFAULT } = {}) {
  const generatedAt = new Date().toISOString();
  const startedAt = Date.now();
  const lanes = buildLaneAssessments(generatedAt);
  const actions = buildActions(lanes, generatedAt);
  const compact = buildCompactShards(lanes);
  const proofCount = safeInt(proofMessages, PROOF_MESSAGES_DEFAULT, 0, 2_000);
  const behcs = execute ? await runBehcsProof(generatedAt, proofCount, lanes, actions) : { proofRows: [], gulp: { ok: true, skipped: true, reason: "preview" } };
  const supervisors = buildSupervisors(lanes, generatedAt);
  const map = buildMap(lanes, actions, generatedAt);
  const summary = {
    id: "behcs256-base-os-readiness",
    generatedAt,
    startedAt: new Date(startedAt).toISOString(),
    finishedAt: new Date().toISOString(),
    status: "BEHCS256_BASE_OS_HARDENING_READY",
    logicalAgents: String(TOTAL_AGENTS),
    logicalGulps: LOGICAL_GULPS,
    lanes,
    actions,
    counts: { lanes: lanes.length, actions: actions.length, supervisors: supervisors.count, shards: compact.rows.length, proofMessages: behcs.proofRows.length, mapNodes: map.nodeCount, mapEdges: map.edgeCount },
    speed: { compactElapsedMs: round3(compact.elapsedMs), compactThroughputAgentsPerSecond: compact.throughput, endToEndElapsedMs: Date.now() - startedAt },
    behcsGulp: behcs.gulp,
    digests: { laneDigest: sha256Text(lanes.map((lane) => lane.digest).join("|")), actionDigest: sha256Text(actions.map((action) => action.digest).join("|")), shardDigest: compact.digest },
    outputs: {
      report: repoRel(OUTPUTS.reportMd),
      summary: repoRel(OUTPUTS.summary),
      lanes: repoRel(OUTPUTS.lanes),
      actions: repoRel(OUTPUTS.actions),
      shards: repoRel(OUTPUTS.shards),
      proof: repoRel(OUTPUTS.proof),
      supervisors: repoRel(OUTPUTS.supervisors),
      map: repoRel(OUTPUTS.map),
      hermes: repoRel(OUTPUTS.hermes),
      shannon: repoRel(OUTPUTS.shannon),
      cube: repoRel(OUTPUTS.cube)
    },
    honesty: {
      notPerformed: ["10b_os_processes", "10b_live_model_calls", "shadow_file_edits", "destructive_gc", "final_certification_claim"],
      performed: ["base_os_lane_assessment", "compact_10b_pid_range_sweep", "supervisor_forge", "real_behcs_gulp_proof"]
    }
  };
  summary.digests.summaryDigest = sha256Text(JSON.stringify({ generatedAt, lanes: summary.digests.laneDigest, actions: summary.digests.actionDigest, gulp: summary.behcsGulp?.gulpId || "preview" }));
  const shannon = buildShannon(summary, generatedAt);
  const hermes = buildHermes(summary, shannon, generatedAt);
  const cube = buildCube(summary, shannon, generatedAt);
  const report = buildReport(summary, shannon);
  if (execute) {
    writeJson(OUTPUTS.summary, summary);
    writeNdjson(OUTPUTS.lanes, lanes);
    writeNdjson(OUTPUTS.actions, actions);
    writeNdjson(OUTPUTS.shards, compact.rows);
    writeNdjson(OUTPUTS.proof, behcs.proofRows);
    writeJson(OUTPUTS.supervisors, supervisors);
    writeJson(OUTPUTS.map, map);
    writeJson(OUTPUTS.state, { savedAt: generatedAt, status: summary.status, report: repoRel(OUTPUTS.reportMd), summary: repoRel(OUTPUTS.summary) });
    writeJson(OUTPUTS.hermes, hermes);
    writeJson(OUTPUTS.shannon, shannon);
    writeText(OUTPUTS.cube, cube);
    writeJson(OUTPUTS.reportJson, summary);
    writeText(OUTPUTS.reportMd, report);
    writeEvents(summary, generatedAt);
  }
  return { ok: true, execute, status: summary.status, shannon: shannon.status, logicalAgents: summary.logicalAgents, logicalGulps: summary.logicalGulps, counts: summary.counts, speed: summary.speed, behcsGulp: summary.behcsGulp, outputs: summary.outputs, honesty: summary.honesty };
}

function status() {
  return { ok: true, status: "READY", logicalAgents: String(TOTAL_AGENTS), logicalGulps: LOGICAL_GULPS, lanes: LANES.map((lane) => ({ id: lane.id, title: lane.title, evidence: lane.evidence.length })), outputs: Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)])) };
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
    run({ execute, proofMessages }).then((result) => console.log(JSON.stringify(result, null, 2))).catch((error) => {
      console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
      process.exitCode = 1;
    });
    return;
  }
  console.error(JSON.stringify({ ok: false, error: `Unknown action: ${action}` }, null, 2));
  process.exitCode = 2;
}

main(process.argv);
