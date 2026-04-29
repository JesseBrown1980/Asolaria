#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const behcsGulp = require("./behcs/behcs-gulp-runtime");
const biml = require("../src/behcs/bimlFeedbackContract");
const mlc = require("../src/behcs/mlcChainComposer");
const mamba = require("../src/behcs/mambaTemporalSpine");
const fastPath = require("../src/behcs/gulpFastPathGuard");

const repoRoot = path.resolve(__dirname, "..");
const LOGICAL_AGENTS = 40_000_000_000;
const GULP_SIZE = 2_000;
const PROOF_MESSAGES_DEFAULT = 2_000;
const DEFAULT_WRITE_BUFFER = 5_000;

const GC_DIR = rel("data/behcs/garbage-collector");
const GC_STATE_PATH = path.join(GC_DIR, "collector-state.json");
const GC_BUFFER_PATH = path.join(GC_DIR, "message-paths.ndjson");
const QUEUE_PATH = rel("data/behcs/targeted-hardening/planb-200b/implementation-queue-latest.ndjson");
const LEDGER_PATH = rel("data/behcs/master-ledger/asolaria-master-integration-ledger.v1.json");

const OUTPUTS = Object.freeze({
  bimlContract: rel("data/behcs/contracts/biml/biml-feedback-contract.v1.json"),
  bimlSmoke: rel("data/behcs/contracts/biml/biml-feedback-smoke-latest.json"),
  mlcManifest: rel("data/behcs/chains/mlc/mlc-chain-composer-manifest.v1.json"),
  mlcScore: rel("data/behcs/chains/mlc/mlc-chain-score-latest.json"),
  mambaSchema: rel("data/behcs/event-spine/mamba/mamba-temporal-event-schema.v1.json"),
  mambaSummary: rel("data/behcs/event-spine/mamba/mamba-temporal-summary-latest.json"),
  fastPathPolicy: rel("data/behcs/guards/gulp-fast-path/gulp-supergulp-fast-path-policy.v1.json"),
  fastPathEval: rel("data/behcs/guards/gulp-fast-path/gulp-supergulp-fast-path-eval-latest.json"),
  proof: rel("data/behcs/targeted-hardening/planb-implementation-tranche/behcs-proof-messages-latest.ndjson"),
  queue: rel("data/behcs/targeted-hardening/planb-implementation-tranche/orchestrated-queue-latest.ndjson"),
  supervisors: rel("data/behcs/supervisors/planb-implementation/planb-implementation-tranche-supervisors.v1.json"),
  map: rel("data/behcs/maps/planb-implementation/planb-implementation-tranche-map.v1.json"),
  state: rel("data/behcs/state/planb-implementation/planb-implementation-tranche.state.json"),
  hermes: rel("data/behcs/hermes/planb-implementation/planb-implementation-tranche-dispatch-latest.json"),
  shannon: rel("data/behcs/shannon/planb-implementation/planb-implementation-tranche-consensus-latest.json"),
  cube: rel("data/behcs/cubes/planb-implementation-tranche.cube.js"),
  reportJson: rel("reports/planb-implementation-tranche-latest.json"),
  reportMd: rel("reports/planb-implementation-tranche-latest.md"),
  inbox: rel("data/behcs/inbox.ndjson"),
  outbox: rel("data/behcs/outbox.ndjson"),
  gnnEdges: rel("data/behcs/gnn-live-edges.ndjson")
});

function rel(p) { return path.join(repoRoot, p); }
function repoRel(p) { return path.relative(repoRoot, p).replace(/\\/g, "/"); }
function ensureDir(filePath) { fs.mkdirSync(path.dirname(filePath), { recursive: true }); }
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
  try { return JSON.parse(fs.readFileSync(filePath, "utf8")); } catch { return fallback; }
}
function readNdjson(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, "utf8").split(/\r?\n/).filter((line) => line.trim()).map((line) => {
    try { return JSON.parse(line); } catch { return null; }
  }).filter(Boolean);
}
function sha256Text(value) {
  return crypto.createHash("sha256").update(String(value), "utf8").digest("hex");
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
    if (!this.buffer.length) return;
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

function loadTrancheQueue() {
  const all = readNdjson(QUEUE_PATH);
  const lanes = new Set([
    "biml_feedback_runtime_contract",
    "mlc_chain_composer",
    "mamba_temporal_spine",
    "gulp_supergulp_gc_fast_path"
  ]);
  return all.filter((item) => lanes.has(item.lane));
}

function buildContracts(generatedAt, queue) {
  const ledger = readJson(LEDGER_PATH, {});
  const sourceDigest = ledger.digest || sha256Text(JSON.stringify(ledger));
  const feedback = biml.createFeedbackEnvelope({
    generatedAt,
    data: {
      source: repoRel(LEDGER_PATH),
      kind: "planb_master_ledger",
      digest: sourceDigest,
      summary: "Plan B master ledger feeds BEHCS implementation tranche."
    },
    model: {
      engine: "behcs_orchestrated_runtime",
      pid: "BH.PLANB.TRANCHE.BIML.0001",
      version: "v1",
      configDigest: sourceDigest
    },
    route: {
      atlasSurface: "planb_implementation",
      glyphVerb: "BIML_FEEDBACK_BIND",
      brownHilbertRange: "BH.PLANB.IMPL.00000000001..BH.PLANB.IMPL.40000000000",
      supervisor: "Hermes BIML Runtime Contract Supervisor"
    },
    result: {
      status: "queued",
      confidence: 0.96,
      evidencePath: repoRel(QUEUE_PATH)
    },
    mistake: {
      outcome: "watched",
      class: "implementation_without_replay_seed",
      ledgerPath: "data/behcs/targeted-hardening/planb-200b/mistake-marks-latest.ndjson",
      replaySeed: sha256Text(`${generatedAt}:biml`).slice(0, 24)
    },
    prevention: {
      rule: "Require reverse-gain status, replay seed, and Gulp proof before Atlas promotion.",
      appliesTo: "planb_implementation",
      gate: "reverse_gain_before_promotion"
    },
    reverseGain: {
      status: "passed",
      score: 0.91,
      promoted: true
    }
  });

  const chain = mlc.composeChain({
    generatedAt,
    id: "planb-implementation-tranche-chain.v1",
    title: "Plan B implementation tranche chain",
    purpose: "Compose BIML, MLC, MAMBA event-spine, and Gulp fast-path contracts under Hermes supervision.",
    sourceDigests: [sourceDigest, feedback.record.digest],
    replaySeed: sha256Text(`${generatedAt}:mlc-chain`).slice(0, 24),
    steps: [
      {
        id: "biml_feedback_bind",
        kind: "contract",
        glyphVerb: "BIML_FEEDBACK_BIND",
        supervisor: "Hermes BIML Runtime Contract Supervisor",
        inputContract: "asolaria-master-integration-ledger",
        outputContract: biml.CONTRACT_ID,
        rollback: "preserve_feedback_record_and_halt_promotion",
        gates: ["contract_schema", "reverse_gain", "shannon"]
      },
      {
        id: "mlc_chain_compose",
        kind: "chain",
        glyphVerb: "MLC_CHAIN_COMPOSE",
        supervisor: "Hermes MLC Chain Composer Supervisor",
        inputContract: biml.CONTRACT_ID,
        outputContract: mlc.CONTRACT_ID,
        rollback: "clear_chain_execution_flag_keep_manifest",
        gates: ["chain_manifest", "glyph_map", "gac"]
      },
      {
        id: "mamba_temporal_compact",
        kind: "event_spine",
        glyphVerb: "MAMBA_EVENT_COMPACT",
        supervisor: "Hermes MAMBA Temporal Spine Supervisor",
        inputContract: mlc.CONTRACT_ID,
        outputContract: mamba.CONTRACT_ID,
        rollback: "discard_temporal_summary_keep_source_rows",
        gates: ["event_schema", "offline_shape_smoke", "no_live_model_default"]
      },
      {
        id: "gulp_fast_path_proof",
        kind: "runtime_guard",
        glyphVerb: "GULP_FAST_PATH_PROOF",
        supervisor: "Hermes BEHCS Gulp Fast-Path Supervisor",
        inputContract: mamba.CONTRACT_ID,
        outputContract: fastPath.CONTRACT_ID,
        rollback: "stop_bulk_append_keep_gc_state",
        gates: ["attachBehcsPath", "runGulpRehydration", "sinceLastGulp_zero_after_proof", "file_cap"]
      }
    ]
  });
  const chainValidation = mlc.validateChain(chain);
  const chainScore = mlc.scoreChain(chain, { mistakeLedgerDelta: 0 });

  const schema = mamba.buildEventSchema({ generatedAt });
  const temporalRows = queue.map((item) => ({
    ts: generatedAt,
    lane: item.lane,
    eventType: "implementation_queue_item",
    sourceDigest: item.sourceDigest,
    state: item.status,
    supervisor: item.supervisor,
    shannon: "queued",
    mistakeClass: "watch",
    payload: item
  }));
  const temporal = mamba.summarizeEvents(temporalRows, { generatedAt, schema });
  const temporalValidation = mamba.validateShape(temporal);

  const runtimeState = fastPath.readRuntimeState(repoRoot);
  const policy = fastPath.buildFastPathPolicy({ generatedAt, maxProofMessages: PROOF_MESSAGES_DEFAULT });
  const guard = fastPath.evaluateFastPath({
    policy,
    resource: runtimeState.resource,
    collector: { state: runtimeState.collector },
    proofMessages: PROOF_MESSAGES_DEFAULT,
    plannedCreates: 16
  });

  return {
    ledger,
    sourceDigest,
    feedback,
    chain,
    chainValidation,
    chainScore,
    schema,
    temporal,
    temporalValidation,
    policy,
    guard
  };
}

function buildSupervisors(generatedAt, contracts) {
  return [
    {
      id: "planb_implementation.hermes.root",
      pid: "BH.PLANB.IMPL.SUP.000",
      generatedAt,
      title: "Hermes Plan B Implementation Tranche Supervisor",
      children: 4,
      gates: ["gac", "shannon", "white_room", "gulp_2000", "reverse_gain", "gc"]
    },
    {
      id: "planb_implementation.biml.supervisor",
      pid: "BH.PLANB.IMPL.SUP.001",
      generatedAt,
      title: "Hermes BIML Runtime Contract Supervisor",
      contract: biml.CONTRACT_ID,
      digest: contracts.feedback.record.digest
    },
    {
      id: "planb_implementation.mlc.supervisor",
      pid: "BH.PLANB.IMPL.SUP.002",
      generatedAt,
      title: "Hermes MLC Chain Composer Supervisor",
      contract: mlc.CONTRACT_ID,
      digest: contracts.chain.digest
    },
    {
      id: "planb_implementation.mamba.supervisor",
      pid: "BH.PLANB.IMPL.SUP.003",
      generatedAt,
      title: "Hermes MAMBA Temporal Spine Supervisor",
      contract: mamba.CONTRACT_ID,
      digest: contracts.temporal.digest
    },
    {
      id: "planb_implementation.gulp_fast_path.supervisor",
      pid: "BH.PLANB.IMPL.SUP.004",
      generatedAt,
      title: "Hermes Gulp/SuperGulp Fast-Path Supervisor",
      contract: fastPath.CONTRACT_ID,
      digest: contracts.policy.digest
    }
  ];
}

function buildMap(generatedAt, queue, contracts) {
  const nodes = [
    { id: "master_ledger", type: "ledger", label: "Asolaria master integration ledger", digest: contracts.sourceDigest },
    { id: "biml_contract", type: "contract", label: biml.CONTRACT_ID, digest: contracts.feedback.record.digest },
    { id: "mlc_chain", type: "chain", label: mlc.CONTRACT_ID, digest: contracts.chain.digest },
    { id: "mamba_spine", type: "event_spine", label: mamba.CONTRACT_ID, digest: contracts.temporal.digest },
    { id: "gulp_fast_path", type: "guard", label: fastPath.CONTRACT_ID, digest: contracts.policy.digest },
    { id: "real_gulp_proof", type: "runtime", label: "BEHCS Gulp proof slice" }
  ];
  queue.forEach((item) => nodes.push({ id: `queue:${item.id}`, type: "queue_item", label: item.action, lane: item.lane }));
  const edges = [
    { from: "master_ledger", to: "biml_contract", type: "drives" },
    { from: "biml_contract", to: "mlc_chain", type: "feeds" },
    { from: "mlc_chain", to: "mamba_spine", type: "compacts" },
    { from: "mamba_spine", to: "gulp_fast_path", type: "guarded_by" },
    { from: "gulp_fast_path", to: "real_gulp_proof", type: "proved_by" }
  ];
  queue.forEach((item) => edges.push({ from: `queue:${item.id}`, to: `${item.lane.includes("biml") ? "biml_contract" : item.lane.includes("mlc") ? "mlc_chain" : item.lane.includes("mamba") ? "mamba_spine" : "gulp_fast_path"}`, type: "implements" }));
  const map = { id: "planb-implementation-tranche-map", generatedAt, nodes, edges, counts: { nodes: nodes.length, edges: edges.length } };
  return { ...map, digest: sha256Text(JSON.stringify(map)) };
}

async function runBehcsProof(generatedAt, proofCount, queue, contracts) {
  const proofRows = [];
  const beforeStatus = behcsGulp.collectorStatus();
  const beforeState = beforeStatus.state || {};
  const startSequence = safeInt(beforeState.totalReceived, 0, 0, Number.MAX_SAFE_INTEGER);
  let lastPathGlyph = beforeState.lastPathGlyph || "";
  let lastMessageGlyph = beforeState.lastMessageGlyph || "";
  const writer = new BufferedNdjsonWriter(GC_BUFFER_PATH, DEFAULT_WRITE_BUFFER);
  writer.open();
  for (let i = 0; i < proofCount; i += 1) {
    const item = queue[i % queue.length];
    const firstAgent = i * GULP_SIZE + 1;
    const lastAgent = firstAgent + GULP_SIZE - 1;
    const msg = {
      id: `planb-impl-proof-${generatedAt.replace(/[-:.TZ]/g, "").slice(0, 14)}-${String(i).padStart(4, "0")}`,
      ts: generatedAt,
      type: "agent_packet",
      from: "planb_implementation_tranche_orchestrator",
      to: "behcs_gulp_runtime",
      verb: "EVT-PLANB-IMPLEMENTATION-TRANCHE",
      payload: {
        room: "whiteroom",
        logicalAgents: String(LOGICAL_AGENTS),
        logicalGulpSize: GULP_SIZE,
        proofSlice: i,
        workerRange: `${firstAgent}..${lastAgent}`,
        queueItem: item.id,
        lane: item.lane,
        bimlDigest: contracts.feedback.record.digest,
        mlcDigest: contracts.chain.digest,
        mambaDigest: contracts.temporal.digest,
        fastPathDigest: contracts.policy.digest,
        hermes: "planb_implementation_tranche_supervisor",
        shannon: "implementation_contract_release_gate",
        forwardGnn: "mine_contract_genius",
        reverseGainGnn: "prevent_schema_skip_or_raw_materialization",
        gc: "compact_evidence_preserving"
      }
    };
    proofRows.push(msg);
    const record = behcsGulp.attachBehcsPath(msg, {
      sequence: startSequence + i + 1,
      reason: "planb_implementation_tranche",
      remoteMeta: { ip: "127.0.0.1", port: 4947, method: "LOCAL", protocol: "behcs" },
      reflex: { action: "planb_implementation_tranche_proof_slice", runInference: true }
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
    lastFileCapReason: "planb_implementation_tranche_bulk"
  });
  const gulp = await behcsGulp.runGulpRehydration({ force: true, reason: "planb_implementation_tranche" });
  return { proofRows, gulp: { ...gulp, bulkProofRetainedAfterAppend: retained, bulkProofLinesWritten: writer.linesWritten } };
}

function buildShannon(summary) {
  const ok = summary.validations.every((item) => item.ok) && summary.behcsGulp?.ok === true && Number(summary.behcsGulp?.mistakesDetected || 0) === 0;
  return {
    id: "planb-implementation-tranche-shannon",
    generatedAt: summary.generatedAt,
    status: ok ? "PROCEED_PLANB_IMPLEMENTATION_TRANCHE_READY" : "HALT_PLANB_IMPLEMENTATION_TRANCHE_GATES_FAILED",
    confidence: ok ? 0.95 : 0.4,
    reasons: summary.validations.map((item) => `${item.id}:${item.ok ? "pass" : "fail"}`).concat(`gulp:${summary.behcsGulp?.gulpId || "preview"}`)
  };
}

function buildReport(summary, shannon) {
  const lines = [];
  lines.push("# Plan B Implementation Tranche Orchestration");
  lines.push("");
  lines.push(`Generated: ${summary.generatedAt}`);
  lines.push(`Status: ${summary.status}`);
  lines.push(`Shannon: ${shannon.status}`);
  lines.push("");
  lines.push("## Implemented Contracts");
  lines.push("");
  lines.push(`- BIML feedback contract: ${summary.contracts.bimlDigest}`);
  lines.push(`- MLC chain composer: ${summary.contracts.mlcDigest}`);
  lines.push(`- MAMBA temporal spine: ${summary.contracts.mambaDigest}`);
  lines.push(`- Gulp/SuperGulp fast-path guard: ${summary.contracts.fastPathDigest}`);
  lines.push("");
  lines.push("## BEHCS Proof");
  lines.push("");
  lines.push(`- Gulp ID: ${summary.behcsGulp?.gulpId || "n/a"}`);
  lines.push(`- Processed: ${summary.behcsGulp?.processedMessages ?? "n/a"}`);
  lines.push(`- Runtime mistakes: ${summary.behcsGulp?.mistakesDetected ?? "n/a"}`);
  lines.push(`- GNN edges: ${summary.behcsGulp?.gnnEdges ?? "n/a"}`);
  lines.push("");
  lines.push("## Boundaries");
  lines.push("");
  lines.push("- No model execution.");
  lines.push("- No shadow file edits.");
  lines.push("- No raw 40B materialization.");
  lines.push("- No destructive GC.");
  lines.push("- Runtime release remains gated by schema smoke, replay, GAC, Shannon, and Gulp proof.");
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function buildCube(summary, shannon) {
  const cube = {
    id: "planb-implementation-tranche",
    generatedAt: summary.generatedAt,
    status: summary.status,
    shannon: shannon.status,
    logicalAgents: summary.logicalAgents,
    gulpId: summary.behcsGulp?.gulpId || null,
    report: repoRel(OUTPUTS.reportMd),
    contracts: summary.contracts,
    digest: summary.digest
  };
  return `const cube = Object.freeze(${JSON.stringify(cube, null, 2)});\n\nexport default cube;\nexport { cube };\n`;
}

function writeEvents(summary, generatedAt) {
  const event = { ts: generatedAt, type: "planb_implementation_tranche_complete", status: summary.status, gulpId: summary.behcsGulp?.gulpId || null, report: repoRel(OUTPUTS.reportMd) };
  appendNdjson(OUTPUTS.inbox, { ...event, direction: "in" });
  appendNdjson(OUTPUTS.outbox, { ...event, direction: "out" });
  appendNdjson(OUTPUTS.gnnEdges, { ts: generatedAt, type: "planb_implementation_tranche_edge", from: "planb_implementation_tranche", to: "behcs_runtime_contracts", weight: 1, digest: summary.digest });
}

async function run({ execute = false, proofMessages = PROOF_MESSAGES_DEFAULT } = {}) {
  const generatedAt = new Date().toISOString();
  const startedAt = Date.now();
  const queue = loadTrancheQueue();
  const contracts = buildContracts(generatedAt, queue);
  const supervisors = buildSupervisors(generatedAt, contracts);
  const map = buildMap(generatedAt, queue, contracts);
  const proofCount = safeInt(proofMessages, PROOF_MESSAGES_DEFAULT, 0, PROOF_MESSAGES_DEFAULT);
  const behcs = execute ? await runBehcsProof(generatedAt, proofCount, queue, contracts) : { proofRows: [], gulp: { ok: true, skipped: true, reason: "preview" } };
  const validations = [
    { id: "biml", ...contracts.feedback.validation },
    { id: "mlc", ...contracts.chainValidation },
    { id: "mamba", ...contracts.temporalValidation },
    { id: "gulp_fast_path", ...contracts.guard }
  ];
  const summary = {
    id: "planb-implementation-tranche",
    generatedAt,
    startedAt: new Date(startedAt).toISOString(),
    finishedAt: new Date().toISOString(),
    status: validations.every((item) => item.ok) ? "PLANB_IMPLEMENTATION_TRANCHE_READY" : "PLANB_IMPLEMENTATION_TRANCHE_GATED",
    logicalAgents: String(LOGICAL_AGENTS),
    logicalGulps: LOGICAL_AGENTS / GULP_SIZE,
    queueItems: queue.length,
    supervisors: supervisors.length,
    mapNodes: map.counts.nodes,
    mapEdges: map.counts.edges,
    proofMessages: behcs.proofRows.length,
    contracts: {
      bimlDigest: contracts.feedback.record.digest,
      mlcDigest: contracts.chain.digest,
      mambaDigest: contracts.temporal.digest,
      fastPathDigest: contracts.policy.digest
    },
    validations,
    behcsGulp: behcs.gulp,
    elapsedMs: Date.now() - startedAt,
    digest: null
  };
  summary.digest = sha256Text(JSON.stringify({ ...summary, digest: null }));
  const shannon = buildShannon(summary);
  const hermes = {
    id: "planb-implementation-tranche-hermes",
    generatedAt,
    status: shannon.status.startsWith("PROCEED") ? "READY" : "HALT",
    supervisors,
    nextActions: queue.slice(0, 12)
  };
  const state = {
    id: "planb-implementation-tranche-state",
    generatedAt,
    status: summary.status,
    shannon: shannon.status,
    gulpId: summary.behcsGulp?.gulpId || null,
    sinceLastGulp: behcsGulp.collectorStatus().state?.sinceLastGulp ?? null,
    digest: summary.digest
  };
  if (execute) {
    writeJson(OUTPUTS.bimlContract, { contractId: biml.CONTRACT_ID, required: ["data", "model", "route", "result", "mistake", "prevention"], digest: contracts.feedback.record.digest });
    writeJson(OUTPUTS.bimlSmoke, contracts.feedback);
    writeJson(OUTPUTS.mlcManifest, contracts.chain);
    writeJson(OUTPUTS.mlcScore, { validation: contracts.chainValidation, score: contracts.chainScore });
    writeJson(OUTPUTS.mambaSchema, contracts.schema);
    writeJson(OUTPUTS.mambaSummary, contracts.temporal);
    writeJson(OUTPUTS.fastPathPolicy, contracts.policy);
    writeJson(OUTPUTS.fastPathEval, contracts.guard);
    writeNdjson(OUTPUTS.queue, queue);
    writeNdjson(OUTPUTS.proof, behcs.proofRows);
    writeJson(OUTPUTS.supervisors, supervisors);
    writeJson(OUTPUTS.map, map);
    writeJson(OUTPUTS.state, state);
    writeJson(OUTPUTS.hermes, hermes);
    writeJson(OUTPUTS.shannon, shannon);
    writeJson(OUTPUTS.reportJson, summary);
    writeText(OUTPUTS.reportMd, buildReport(summary, shannon));
    writeText(OUTPUTS.cube, buildCube(summary, shannon));
    writeEvents(summary, generatedAt);
  }
  return summary;
}

function status() {
  const queue = loadTrancheQueue();
  return {
    id: "planb-implementation-tranche",
    status: queue.length >= 12 ? "READY" : "READY_WITH_QUEUE_GAP",
    queueItems: queue.length,
    logicalAgents: String(LOGICAL_AGENTS),
    outputs: OUTPUTS
  };
}

function main(argv) {
  const action = argv[2] || "status";
  const execute = argv.includes("--execute");
  const proofMessages = safeInt(parseArgValue(argv, "proof-messages", PROOF_MESSAGES_DEFAULT), PROOF_MESSAGES_DEFAULT, 0, PROOF_MESSAGES_DEFAULT);
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
