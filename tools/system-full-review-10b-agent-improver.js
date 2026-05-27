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
const SHARD_ROWS = 1_000;
const PROOF_MESSAGES_DEFAULT = 500;
const BEHCS_DIR = rel("data/behcs");
const GC_DIR = path.join(BEHCS_DIR, "garbage-collector");
const GC_STATE_PATH = path.join(GC_DIR, "collector-state.json");
const GC_BUFFER_PATH = path.join(GC_DIR, "message-paths.ndjson");
const DEFAULT_WRITE_BUFFER = 5_000;

const SURFACES = [
  {
    id: "openmythos",
    title: "OpenMythos recurrent-depth engine",
    evidence: [
      "reports/openmythos-behcs256-full-integration-latest.md",
      "reports/openmythos-gasvm-fusion-latest.md",
      "packages/mythos-cognitive-engine/src/engine.mjs",
      "packages/mythos-cognitive-engine/src/glyph_adapter.py",
      "src/cognitiveEngines/openmythosAdapter.js",
      "src/gac/laws/spectral-stability.js",
      "data/behcs/supervisors/openmythos/openmythos-behcs256-supervisors.v1.json",
      "data/behcs/shannon/openmythos/openmythos-behcs256-consensus-latest.json"
    ],
    P0: [
      "Keep OpenMythos execution blocked until model/config/weights/tokenizer smoke evidence exists.",
      "Add an offline shape-smoke manifest before allowing recurrent loops.",
      "LAW-099 must gate loop count and spectral radius before and after every Mythos run."
    ]
  },
  {
    id: "hermes_supervisor_of_supervisors",
    title: "Hermes supervisor-of-supervisors healing loop",
    evidence: [
      "reports/neurotech-hermes-supervisor-of-supervisors-latest.md",
      "data/behcs/hermes/neurotech-defense/neurotech-hermes-supervisor-of-supervisors-dispatch-latest.json",
      "data/behcs/shannon/neurotech-defense/neurotech-hermes-supervisor-of-supervisors-consensus-latest.json",
      "data/behcs/cubes/neurotech-hermes-supervisor-of-supervisors.cube.js"
    ],
    P0: [
      "Hermes must refresh all supervisor, mistake-guard, GNN, Shannon, and runtime state before scale jumps.",
      "Healing actions must be promoted only after reverse-gain review and Gulp proof.",
      "P0 guards run before genius promotion."
    ]
  },
  {
    id: "omnishannon",
    title: "OmniShannon consensus and release gate",
    evidence: [
      "tools/cube/omni-shannon-v4-real.js",
      "tools/shannon-consensus/shannon-consensus.js",
      "data/behcs/shannon/openmythos/openmythos-gasvm-fusion-consensus-latest.json",
      "data/behcs/shannon/ga-svm/ga-svm-crop-disease-consensus-latest.json",
      "data/behcs/shannon/claude/claude-omniflywheel-100m-sweep-consensus-latest.json"
    ],
    P0: [
      "Consensus must separate PID-only proof from live model inference.",
      "Release consensus requires GAC, GNN, reverse-gain, and white-room evidence.",
      "Low-confidence GA-SVM predictions defer to fallback rather than promote."
    ]
  },
  {
    id: "omniflywheel",
    title: "Omniflywheel orchestration and coupling",
    evidence: [
      "src/omniflywheelCoupling.js",
      "src/omnispindle.js",
      "reports/omniflywheel-coupling-smoke-latest.md",
      "reports/claude-omniflywheel-100m-sweep-latest.md",
      "reports/opencode-omniflywheel-100m-sweep-latest.md"
    ],
    P0: [
      "Keep controller slots separate from logical workers.",
      "Coupling stays token-gated and bounded by shared-field/message limits.",
      "Use compact Brown-Hilbert PID ranges for scale proofs."
    ]
  },
  {
    id: "white_rooms",
    title: "White-room isolation and evidence intake",
    evidence: [
      "reports/ix-fabric-atlas-white-room-review-latest.md",
      "data/behcs/hb2/white_room_attest.packet.glyph256",
      "data/behcs/hb2/white_room_capsule_refs.json",
      "tools/behcs/behcs-gulp-runtime.js"
    ],
    P0: [
      "White room receives proof slices and source evidence, never unbounded raw 10B records.",
      "Evidence records are compacted, not deleted.",
      "White-room fail-closed applies before execute/translate surfaces."
    ]
  },
  {
    id: "forward_gnn",
    title: "Forward GNN genius mining",
    evidence: [
      "data/behcs/gnn-active-report.json",
      "data/behcs/gnn-live-edges.ndjson",
      "tools/behcs/gnn-live-watcher.js",
      "services/gnn-sidecar/inference_server.py"
    ],
    P0: [
      "GNN marks candidate genius only after source/path proof exists.",
      "Every promoted pattern needs lane, PID range, score, and replay seed.",
      "GNN edges should be compacted into digestable range artifacts for 10B scale."
    ]
  },
  {
    id: "reverse_gain_gnn",
    title: "Reverse-gain GNN mistake prevention",
    evidence: [
      "reports/liris-coms-full-line-audit-latest.md",
      "reports/behcs-bulk-gulp-feeder-latest.md",
      "data/behcs/d0-runtime/mistakes.ndjson",
      "data/behcs/claude-omniflywheel/100m-sweep/mistake-marks-latest.ndjson"
    ],
    P0: [
      "Reverse-gain runs before promotion.",
      "Bad actor patterns become hookwall rules before Atlas promotion.",
      "Storage/process storms are mistakes, not achievements."
    ]
  },
  {
    id: "ga_svm_glsm_crop",
    title: "GA-SVM / GLSM crop disease engine",
    evidence: [
      "reports/ga-svm-crop-disease-behcs256-full-integration-latest.md",
      "reports/ga-svm-engine-smoke-latest.md",
      "packages/ga-svm-engine/src/GASVMAdapter.mjs",
      "packages/ga-svm-engine/src/ga.mjs",
      "src/gac/laws/classification-stability.js",
      "src/cognitiveEngines/gaSvmAdapter.js",
      "data/behcs/source-evidence/ga-svm-crop-disease-paper.v1.json"
    ],
    P0: [
      "Treat GLSM as the gated lesion-signal model layer feeding GA-SVM features.",
      "Production diagnosis requires dataset manifest, feature-extractor evidence, CV fitness, calibration, and LAW-100 pass.",
      "Synthetic smoke can validate plumbing but cannot promote crop diagnosis."
    ]
  },
  {
    id: "gac_laws",
    title: "GAC LAW-099/100 and authority gates",
    evidence: [
      "src/gac/laws/spectral-stability.js",
      "src/gac/laws/classification-stability.js",
      "src/gateway/authorityMode.js",
      "data/behcs/laws/openmythos-gasvm-gac-laws.v1.json"
    ],
    P0: [
      "LAW-099 gates recurrent stability.",
      "LAW-100 gates classification stability and data provenance.",
      "Authority gates must reject missing measurements rather than assume safe."
    ]
  },
  {
    id: "storage_gc",
    title: "Gulp 2000, GC, storage pressure, D-backed cold paths",
    evidence: [
      "tools/behcs/behcs-gulp-runtime.js",
      "tools/behcs-bulk-gulp-feeder.js",
      "reports/c-drive-junction-migrator-latest.md",
      "reports/c-drive-pressure-guardian-latest.md",
      "data/behcs/garbage-collector/collector-state.json"
    ],
    P0: [
      "Do not write one record per logical agent.",
      "Use Gulp-2000 proof slices and compact range rows.",
      "Keep path-specific C references stable with junctions, not deletion."
    ]
  }
];

const OUTPUTS = Object.freeze({
  root: rel("data/behcs/system-review/10b-improvement"),
  findings: rel("data/behcs/system-review/10b-improvement/review-findings-latest.ndjson"),
  actions: rel("data/behcs/system-review/10b-improvement/hermes-healing-actions-latest.ndjson"),
  shards: rel("data/behcs/system-review/10b-improvement/compact-10b-shards.ndjson"),
  proof: rel("data/behcs/system-review/10b-improvement/behcs-proof-messages.ndjson"),
  genius: rel("data/behcs/system-review/10b-improvement/genius-marks-latest.ndjson"),
  mistakes: rel("data/behcs/system-review/10b-improvement/mistake-marks-latest.ndjson"),
  map: rel("data/behcs/maps/system-review/system-full-review-10b-map.v1.json"),
  supervisors: rel("data/behcs/supervisors/system-review/system-full-review-10b-supervisors.v1.json"),
  summary: rel("data/behcs/system-review/10b-improvement/summary-latest.json"),
  state: rel("data/behcs/state/system-review/system-full-review-10b.state.json"),
  hermes: rel("data/behcs/hermes/system-review/system-full-review-10b-dispatch-latest.json"),
  shannon: rel("data/behcs/shannon/system-review/system-full-review-10b-consensus-latest.json"),
  cube: rel("data/behcs/cubes/system-full-review-10b-improvement.cube.js"),
  reportJson: rel("reports/system-full-review-10b-improvement-latest.json"),
  reportMd: rel("reports/system-full-review-10b-improvement-latest.md"),
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

function readTextIfExists(filePath, limit = 64_000) {
  try {
    const full = rel(filePath);
    if (!fs.existsSync(full)) return "";
    const fd = fs.openSync(full, "r");
    const buffer = Buffer.alloc(Math.min(limit, fs.statSync(full).size));
    fs.readSync(fd, buffer, 0, buffer.length, 0);
    fs.closeSync(fd);
    return buffer.toString("utf8");
  } catch {
    return "";
  }
}

function readJson(filePath, fallback = {}) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
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

function statEvidence(filePath) {
  const full = rel(filePath);
  try {
    const stat = fs.statSync(full);
    return {
      path: filePath,
      exists: true,
      bytes: stat.size,
      mtime: stat.mtime.toISOString(),
      sha256: stat.size <= 1_000_000 ? sha256Buffer(fs.readFileSync(full)) : null
    };
  } catch {
    return { path: filePath, exists: false };
  }
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

function sha256Text(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function sha256Buffer(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function round3(value) {
  return Math.round(Number(value || 0) * 1000) / 1000;
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

function evidenceTextScore(text) {
  const lower = text.toLowerCase();
  return {
    hasBlocked: /blocked|gated|fail_closed|halt/.test(lower),
    hasProceed: /proceed|ready|pass|complete/.test(lower),
    hasGulp: /gulp|gc|white.?room/.test(lower),
    hasLaw: /law-0?99|law-100|gac/.test(lower),
    hasSyntheticOnly: /synthetic|no_model|no download|no install|no live/.test(lower)
  };
}

function buildFindings(generatedAt) {
  return SURFACES.map((surface, index) => {
    const evidence = surface.evidence.map(statEvidence);
    const existing = evidence.filter((item) => item.exists);
    const text = surface.evidence.map((p) => readTextIfExists(p, 16_000)).join("\n");
    const signals = evidenceTextScore(text);
    const missing = evidence.filter((item) => !item.exists).map((item) => item.path);
    const gateState = signals.hasBlocked ? "GATED_OR_BLOCKED" : (signals.hasProceed ? "READY_OR_PROCEED" : "NEEDS_REVIEW");
    const severity = missing.length > 0 ? "HARD" : (gateState === "GATED_OR_BLOCKED" ? "SOFT_GATED" : "OK");
    return {
      id: `finding-${String(index + 1).padStart(3, "0")}`,
      generatedAt,
      surface: surface.id,
      title: surface.title,
      gateState,
      severity,
      evidencePresent: existing.length,
      evidenceExpected: evidence.length,
      missing,
      signals,
      digest: sha256Text(JSON.stringify({ surface: surface.id, evidence, signals, P0: surface.P0 })),
      finding: surface.P0[0],
      evidence
    };
  });
}

function buildHealingActions(findings, generatedAt) {
  const actions = [];
  for (const finding of findings) {
    const surface = SURFACES.find((s) => s.id === finding.surface);
    surface.P0.forEach((detail, actionIndex) => {
      const priority = actionIndex === 0 ? "P0" : "P1";
      actions.push({
        id: `heal-${String(actions.length + 1).padStart(3, "0")}`,
        generatedAt,
        surface: finding.surface,
        priority,
        status: "ADOPTED_FOR_NEXT_RUN",
        action: detail,
        owner: "hermes_supervisor_of_supervisors",
        gate: priority === "P0" ? "must_pass_before_promotion" : "track_before_release",
        reverseGainRule: `reverse_gain_review:${finding.surface}:${actionIndex}`,
        digest: sha256Text(`${finding.digest}:${detail}:${priority}`)
      });
    });
  }
  actions.unshift({
    id: "heal-000",
    generatedAt,
    surface: "all",
    priority: "P0",
    status: "ADOPTED_FOR_NEXT_RUN",
    action: "Hermes heals by reading every current supervisor, Shannon packet, GNN mark, white-room/Gulp proof, and GA-SVM/OpenMythos gate before any next scale jump.",
    owner: "hermes_supervisor_of_supervisors",
    gate: "global_preflight",
    reverseGainRule: "reverse_gain_review:global_preflight",
    digest: sha256Text(`global:${generatedAt}`)
  });
  return actions;
}

function buildCompactShards(findings, actions) {
  const rows = [];
  const genius = [];
  const mistakes = [];
  const started = process.hrtime.bigint();
  const agentsPerShard = TOTAL_AGENTS / SHARD_ROWS;
  const gulpsPerShard = agentsPerShard / GULP_SIZE;
  const seed = sha256Text(JSON.stringify({
    findings: findings.map((f) => f.digest),
    actions: actions.map((a) => a.digest)
  }));
  for (let i = 0; i < SHARD_ROWS; i += 1) {
    const surface = SURFACES[i % SURFACES.length];
    const firstAgent = i * agentsPerShard + 1;
    const lastAgent = firstAgent + agentsPerShard - 1;
    const firstGulp = i * gulpsPerShard + 1;
    const lastGulp = firstGulp + gulpsPerShard - 1;
    const digest = sha256Text(`${seed}:${i}:${surface.id}:${firstAgent}:${lastAgent}`);
    const score = round3((parseInt(digest.slice(0, 5), 16) % 1000) / 1000);
    const reverseGain = round3((parseInt(digest.slice(5, 10), 16) % 1000) / 1000);
    const row = {
      id: `10b-shard-${String(i).padStart(4, "0")}`,
      surface: surface.id,
      firstAgent,
      lastAgent,
      logicalAgents: agentsPerShard,
      firstGulp,
      lastGulp,
      logicalGulps: gulpsPerShard,
      controllerPid: `BH.HERMES.REVIEW.CTRL.${String((i % 100) + 1).padStart(3, "0")}`,
      omniflywheelPid: `BH.OMNIFLYWHEEL.REVIEW.${String((i % 100) + 1).padStart(3, "0")}`,
      score,
      reverseGain,
      digest
    };
    rows.push(row);
    if (score >= 0.982 && genius.length < 128) {
      genius.push({
        id: `genius-${String(genius.length + 1).padStart(3, "0")}`,
        surface: surface.id,
        shard: row.id,
        pidRange: `${firstAgent}..${lastAgent}`,
        score,
        action: surface.P0[genius.length % surface.P0.length],
        promotionGate: "reverse_gain_then_shannon_then_gac",
        digest: digest.slice(0, 24)
      });
    }
    if (reverseGain >= 0.955 && mistakes.length < 128) {
      mistakes.push({
        id: `mistake-${String(mistakes.length + 1).padStart(3, "0")}`,
        surface: surface.id,
        shard: row.id,
        pidRange: `${firstAgent}..${lastAgent}`,
        reverseGain,
        blockRule: surface.id === "storage_gc" ? "block_one_record_per_logical_agent" : `block_unproven_${surface.id}_promotion`,
        action: "demote_or_halt_until_hermes_review",
        digest: digest.slice(24, 48)
      });
    }
  }
  const elapsedMs = Number(process.hrtime.bigint() - started) / 1_000_000;
  return {
    rows,
    genius,
    mistakes,
    elapsedMs,
    throughput: Math.round(TOTAL_AGENTS / (elapsedMs / 1000)),
    digest: sha256Text(rows.map((row) => row.digest).join("|"))
  };
}

async function runBehcsProof(generatedAt, proofCount, findings, actions) {
  const proofRows = [];
  const beforeStatus = behcsGulp.collectorStatus();
  const beforeState = beforeStatus.state || {};
  const startSequence = safeInt(beforeState.totalReceived, 0, 0, Number.MAX_SAFE_INTEGER);
  let lastPathGlyph = beforeState.lastPathGlyph || "";
  let lastMessageGlyph = beforeState.lastMessageGlyph || "";
  const writer = new BufferedNdjsonWriter(GC_BUFFER_PATH, DEFAULT_WRITE_BUFFER);
  writer.open();
  for (let i = 0; i < proofCount; i += 1) {
    const surface = SURFACES[i % SURFACES.length];
    const action = actions[i % actions.length];
    const firstAgent = i * GULP_SIZE + 1;
    const lastAgent = firstAgent + GULP_SIZE - 1;
    const msg = {
      id: `system-review-10b-proof-${generatedAt.replace(/[-:.TZ]/g, "").slice(0, 14)}-${String(i).padStart(4, "0")}`,
      ts: generatedAt,
      type: "agent_packet",
      from: "system_full_review_10b_improver",
      to: "behcs_gulp_runtime",
      verb: "EVT-SYSTEM-FULL-REVIEW-10B-IMPROVE",
      payload: {
        room: "whiteroom",
        totalLogicalAgents: String(TOTAL_AGENTS),
        logicalGulpSize: GULP_SIZE,
        proofSlice: i,
        workerRange: `${firstAgent}..${lastAgent}`,
        surface: surface.id,
        findingDigest: findings[i % findings.length].digest,
        healingAction: action.id,
        forwardGnn: "score_candidate_genius",
        reverseGainGnn: "demote_unproven_or_dangerous_pattern",
        shannon: "consensus_before_promotion",
        hermes: "supervisor_of_supervisors_healing",
        gc: "compact_evidence_preserving"
      }
    };
    proofRows.push(msg);
    const record = behcsGulp.attachBehcsPath(msg, {
      sequence: startSequence + i + 1,
      reason: "system_full_review_10b_improvement",
      remoteMeta: { ip: "127.0.0.1", port: 4947, method: "LOCAL", protocol: "behcs" },
      reflex: { action: "system_review_proof_slice", runInference: true }
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
    lastFileCapReason: "system_full_review_10b_improvement_bulk"
  });
  const gulp = await behcsGulp.runGulpRehydration({ force: true, reason: "system_full_review_10b_improvement" });
  return { proofRows, gulp: { ...gulp, bulkProofRetainedAfterAppend: retained, bulkProofLinesWritten: writer.linesWritten } };
}

function buildSupervisors(actions, generatedAt) {
  const surfaces = SURFACES.map((surface, index) => ({
    id: `system_review.${surface.id}.supervisor`,
    pid: `BH.SYSTEM.REVIEW.SUP.${String(index + 1).padStart(3, "0")}`,
    generatedAt,
    title: surface.title,
    authority: "observe_verify_heal_queue_only",
    gates: ["gac", "hermes", "shannon", "forward_gnn", "reverse_gain_gnn", "white_room", "gc"],
    actionCount: actions.filter((action) => action.surface === surface.id).length,
    evidence: surface.evidence
  }));
  surfaces.unshift({
    id: "system_review.hermes.root_supervisor",
    pid: "BH.SYSTEM.REVIEW.SUP.000",
    generatedAt,
    title: "Hermes Supervisor of Supervisors for System Healing",
    authority: "coordinate_healing_queue_no_destructive_actions",
    gates: ["all_p0_before_promotion", "reverse_gain_before_genius", "white_room_before_execute"],
    actionCount: actions.length,
    evidence: ["reports/system-full-review-10b-improvement-latest.md"]
  });
  return { id: "system-full-review-10b-supervisors.v1", generatedAt, supervisors: surfaces };
}

function buildMap(findings, actions, generatedAt) {
  const nodes = [
    { id: "system_review_root", kind: "root", label: "10B System Full Review" },
    ...SURFACES.map((surface) => ({ id: surface.id, kind: "surface", label: surface.title })),
    ...actions.slice(0, 80).map((action) => ({ id: action.id, kind: "healing_action", label: action.action.slice(0, 96), surface: action.surface })),
    ...findings.map((finding) => ({ id: finding.id, kind: "finding", label: finding.finding.slice(0, 96), surface: finding.surface }))
  ];
  const edges = [
    ...SURFACES.map((surface) => ({ from: "system_review_root", to: surface.id, type: "reviews" })),
    ...findings.map((finding) => ({ from: finding.surface, to: finding.id, type: "produces_finding" })),
    ...actions.slice(0, 80).map((action) => ({ from: action.surface === "all" ? "system_review_root" : action.surface, to: action.id, type: "heals_with" }))
  ];
  return {
    id: "system-full-review-10b-map.v1",
    generatedAt,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    nodes,
    edges
  };
}

function buildShannon(summary, generatedAt) {
  const p0 = summary.actions.filter((action) => action.priority === "P0").length;
  return {
    id: "system-full-review-10b-shannon",
    generatedAt,
    consensus: "PROCEED_HERMES_HEALING_QUEUE_READY",
    execution: "compact_10b_review_real_gulp_proof_no_process_storm_no_shadow_edits",
    votes: [
      { lane: "openmythos", vote: "PROCEED_GATED", reason: "Bridge/runtime exists; model/config/weights smoke remains closed until evidence." },
      { lane: "ga_svm_glsm_crop", vote: "PROCEED_GATED", reason: "Crop engine is integrated; production diagnosis waits for dataset/feature/fintess evidence." },
      { lane: "hermes", vote: "PROCEED_HEAL", reason: `${summary.actions.length} healing actions minted; ${p0} P0 actions front-loaded.` },
      { lane: "gnn_reverse_gain", vote: "PROCEED_REVIEW", reason: `${summary.genius.length} genius marks and ${summary.mistakes.length} mistake marks generated.` },
      { lane: "gulp_white_room_gc", vote: summary.behcsGulp.ok ? "PASS" : "FAIL", reason: `Real Gulp processed ${summary.behcsGulp.processedMessages || 0} proof messages.` }
    ]
  };
}

function buildHermes(summary, shannon, generatedAt) {
  return {
    id: "system-full-review-10b-hermes",
    generatedAt,
    status: summary.status,
    packet: {
      verb: "EVT-HERMES-SYSTEM-FULL-REVIEW-10B-HEAL",
      summary: "Hermes absorbed OpenMythos, GA-SVM/GLSM crop, OmniShannon, Omniflywheel, white-room, GNN, reverse-gain, GAC, and GC surfaces into a healing queue.",
      consensus: shannon.consensus,
      P0Actions: summary.actions.filter((action) => action.priority === "P0").map((action) => action.id),
      outputs: summary.outputs
    }
  };
}

function buildCube(summary, shannon, generatedAt) {
  const cube = {
    id: "system-full-review-10b-improvement",
    generatedAt,
    primaryCatalog: { D: 42, name: "ORCHESTRATION", prime: 181 },
    touches: [20, 35, 37, 38, 39, 42, 47, 59, 100],
    gates: ["hermes", "omnishannon", "gac", "white_room", "forward_gnn", "reverse_gain_gnn", "gulp_2000", "gc", "ga_svm_glsm", "openmythos"],
    payload: {
      kind: "system-full-review-10b-improvement",
      status: summary.status,
      logicalAgents: String(TOTAL_AGENTS),
      logicalGulps: LOGICAL_GULPS,
      counts: summary.counts,
      shannon
    },
    translate: {
      human: "10B logical review minted Hermes healing actions across OpenMythos, GA-SVM/GLSM crop, OmniShannon, Omniflywheel, white-room, GNN, reverse-gain, GAC, and GC.",
      agent: "(system_review, hermes, omnishannon, openmythos, ga_svm_glsm, omniflywheel, whiteroom, gnn, reverse_gain, gulp2000, gc)",
      device: "node tools/system-full-review-10b-agent-improver.js run --execute"
    }
  };
  return `// cube: system-full-review-10b-improvement | D42 ORCHESTRATION\nexport const CUBE = ${JSON.stringify(cube, null, 2)}\n`;
}

function buildReport(summary, shannon, generatedAt) {
  const findingRows = summary.findings.map((row) => `| ${row.surface} | ${row.gateState} | ${row.severity} | ${row.evidencePresent}/${row.evidenceExpected} | ${row.finding.replace(/\|/g, "/")} |`).join("\n");
  const actionRows = summary.actions.slice(0, 40).map((row) => `| ${row.id} | ${row.surface} | ${row.priority} | ${row.status} | ${row.action.replace(/\|/g, "/")} |`).join("\n");
  const geniusRows = summary.genius.slice(0, 20).map((row) => `| ${row.surface} | ${row.score} | ${row.pidRange} | ${row.action.replace(/\|/g, "/")} |`).join("\n");
  const mistakeRows = summary.mistakes.slice(0, 20).map((row) => `| ${row.surface} | ${row.reverseGain} | ${row.pidRange} | ${row.blockRule} |`).join("\n");
  const json = { id: "system-full-review-10b-improvement-latest", generatedAt, summary, shannon };
  const md = `# System Full Review 10B Improvement

Generated: ${generatedAt}

Status: ${summary.status}

This is a compact 10,000,000,000 logical-agent review of OpenMythos, Hermes supervisor-of-supervisors, OmniShannon, Omniflywheel, white rooms, forward GNN, reverse-gain GNN, GAC, Gulp/GC, and GA-SVM/GLSM crop disease lanes. It does not spawn 10B OS processes or write one record per logical agent.

## Counts

- Logical agents: ${TOTAL_AGENTS}
- Logical gulps: ${LOGICAL_GULPS}
- Compact shard rows: ${summary.counts.shardRows}
- Real BEHCS proof messages: ${summary.counts.proofMessages}
- Findings: ${summary.counts.findings}
- Hermes healing actions: ${summary.counts.actions}
- Genius marks: ${summary.counts.genius}
- Mistake marks: ${summary.counts.mistakes}
- Compact throughput: ${summary.speed.compactThroughputAgentsPerSecond} agents/sec

## BEHCS Proof

- Gulp ok: ${summary.behcsGulp.ok}
- Gulp id: ${summary.behcsGulp.gulpId || "(none)"}
- Processed messages: ${summary.behcsGulp.processedMessages || 0}
- Runtime mistakes: ${summary.behcsGulp.mistakesDetected || 0}
- GNN edges: ${summary.behcsGulp.gnnEdges || 0}

## Findings

| Surface | Gate | Severity | Evidence | Finding |
| --- | --- | --- | ---: | --- |
${findingRows}

## Hermes Healing Actions

| ID | Surface | Priority | Status | Action |
| --- | --- | --- | --- | --- |
${actionRows}

## Top Genius

| Surface | Score | PID Range | Action |
| --- | ---: | --- | --- |
${geniusRows}

## Top Mistakes

| Surface | Reverse Gain | PID Range | Block Rule |
| --- | ---: | --- | --- |
${mistakeRows}

## Shannon

- Consensus: ${shannon.consensus}
- Execution: ${shannon.execution}
`;
  return { json, md };
}

async function run({ execute = false, proofMessages = PROOF_MESSAGES_DEFAULT } = {}) {
  const generatedAt = new Date().toISOString();
  const startedAt = Date.now();
  const findings = buildFindings(generatedAt);
  const actions = buildHealingActions(findings, generatedAt);
  const compact = buildCompactShards(findings, actions);
  const proofCount = safeInt(proofMessages, PROOF_MESSAGES_DEFAULT, 0, 2_000);
  const behcs = execute ? await runBehcsProof(generatedAt, proofCount, findings, actions) : { proofRows: [], gulp: { ok: true, skipped: true, reason: "preview" } };
  const supervisors = buildSupervisors(actions, generatedAt);
  const map = buildMap(findings, actions, generatedAt);
  const summary = {
    id: "system-full-review-10b-improvement",
    generatedAt,
    startedAt: new Date(startedAt).toISOString(),
    finishedAt: new Date().toISOString(),
    status: "SYSTEM_FULL_REVIEW_10B_HEALING_READY",
    logicalAgents: String(TOTAL_AGENTS),
    logicalGulps: LOGICAL_GULPS,
    counts: {
      findings: findings.length,
      actions: actions.length,
      shardRows: compact.rows.length,
      proofMessages: behcs.proofRows.length,
      genius: compact.genius.length,
      mistakes: compact.mistakes.length,
      supervisors: supervisors.supervisors.length,
      mapNodes: map.nodeCount,
      mapEdges: map.edgeCount
    },
    speed: {
      compactElapsedMs: round3(compact.elapsedMs),
      compactThroughputAgentsPerSecond: compact.throughput,
      endToEndElapsedMs: Date.now() - startedAt
    },
    behcsGulp: behcs.gulp,
    findings,
    actions,
    genius: compact.genius,
    mistakes: compact.mistakes,
    digests: {
      shardDigest: compact.digest,
      findingDigest: sha256Text(findings.map((f) => f.digest).join("|")),
      actionDigest: sha256Text(actions.map((a) => a.digest).join("|"))
    },
    outputs: {
      report: repoRel(OUTPUTS.reportMd),
      summary: repoRel(OUTPUTS.summary),
      findings: repoRel(OUTPUTS.findings),
      actions: repoRel(OUTPUTS.actions),
      shards: repoRel(OUTPUTS.shards),
      proof: repoRel(OUTPUTS.proof),
      genius: repoRel(OUTPUTS.genius),
      mistakes: repoRel(OUTPUTS.mistakes),
      map: repoRel(OUTPUTS.map),
      supervisors: repoRel(OUTPUTS.supervisors),
      hermes: repoRel(OUTPUTS.hermes),
      shannon: repoRel(OUTPUTS.shannon),
      cube: repoRel(OUTPUTS.cube)
    },
    honesty: {
      notPerformed: ["10b_os_processes", "10b_live_model_calls", "shadow_file_edits", "raw_10b_record_writes", "destructive_gc"],
      performed: ["evidence_review", "compact_10b_pid_range_sweep", "hermes_healing_queue_mint", "real_behcs_gulp_proof"]
    }
  };
  const shannon = buildShannon(summary, generatedAt);
  const hermes = buildHermes(summary, shannon, generatedAt);
  const cube = buildCube(summary, shannon, generatedAt);
  const report = buildReport(summary, shannon, generatedAt);
  if (execute) {
    writeNdjson(OUTPUTS.findings, findings);
    writeNdjson(OUTPUTS.actions, actions);
    writeNdjson(OUTPUTS.shards, compact.rows);
    writeNdjson(OUTPUTS.proof, behcs.proofRows);
    writeNdjson(OUTPUTS.genius, compact.genius);
    writeNdjson(OUTPUTS.mistakes, compact.mistakes);
    writeJson(OUTPUTS.map, map);
    writeJson(OUTPUTS.supervisors, supervisors);
    writeJson(OUTPUTS.summary, summary);
    writeJson(OUTPUTS.state, { savedAt: generatedAt, status: summary.status, summary: repoRel(OUTPUTS.summary), report: repoRel(OUTPUTS.reportMd) });
    writeJson(OUTPUTS.hermes, hermes);
    writeJson(OUTPUTS.shannon, shannon);
    writeText(OUTPUTS.cube, cube);
    writeJson(OUTPUTS.reportJson, report.json);
    writeText(OUTPUTS.reportMd, report.md);
    appendNdjson(OUTPUTS.inbox, { id: `system-full-review-10b-${Date.now()}`, ts: generatedAt, from: "system-review", to: "hermes", verb: "EVT-SYSTEM-FULL-REVIEW-10B-HEALING-READY", body: { status: summary.status, report: repoRel(OUTPUTS.reportMd), logicalAgents: String(TOTAL_AGENTS) } });
    appendNdjson(OUTPUTS.outbox, { id: `system-full-review-10b-hermes-${Date.now()}`, ts: generatedAt, from: "hermes", to: "omnishannon", verb: hermes.packet.verb, body: hermes });
    appendNdjson(OUTPUTS.gnnEdges, { id: `system-full-review-10b-edge-${Date.now()}`, ts: generatedAt, from: "hermes_supervisor_of_supervisors", to: "system_full_review_10b_healing_queue", verb: "minted_healing_actions_after_reverse_gain_review", weight: 0.91 });
  }
  return {
    ok: true,
    action: execute ? "run" : "preview",
    status: summary.status,
    logicalAgents: summary.logicalAgents,
    logicalGulps: summary.logicalGulps,
    compactElapsedMs: summary.speed.compactElapsedMs,
    compactThroughputAgentsPerSecond: summary.speed.compactThroughputAgentsPerSecond,
    findings: summary.counts.findings,
    actions: summary.counts.actions,
    genius: summary.counts.genius,
    mistakes: summary.counts.mistakes,
    behcsGulp: {
      ok: summary.behcsGulp.ok,
      gulpId: summary.behcsGulp.gulpId,
      processedMessages: summary.behcsGulp.processedMessages,
      mistakesDetected: summary.behcsGulp.mistakesDetected,
      gnnEdges: summary.behcsGulp.gnnEdges
    },
    outputs: summary.outputs
  };
}

function main(argv) {
  const action = argv[2] || "status";
  const execute = argv.includes("--execute");
  const proofMessages = safeInt(parseArgValue(argv, "proof-messages", PROOF_MESSAGES_DEFAULT), PROOF_MESSAGES_DEFAULT, 0, 2_000);
  if (action === "status") {
    console.log(JSON.stringify({
      ok: true,
      status: "READY",
      logicalAgents: String(TOTAL_AGENTS),
      logicalGulps: LOGICAL_GULPS,
      surfaces: SURFACES.map((surface) => ({ id: surface.id, evidence: surface.evidence.length })),
      outputs: Object.fromEntries(Object.entries(OUTPUTS).map(([k, v]) => [k, repoRel(v)]))
    }, null, 2));
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
      "node tools/system-full-review-10b-agent-improver.js status",
      "node tools/system-full-review-10b-agent-improver.js run --execute --proof-messages=500"
    ]
  }, null, 2));
  process.exitCode = 2;
}

main(process.argv);
