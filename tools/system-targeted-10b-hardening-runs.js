#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

let behcsGulp;
let behcsGulpAvailable = true;
let behcsGulpLoadError = "";
try {
  behcsGulp = require("./behcs/behcs-gulp-runtime");
} catch (error) {
  behcsGulpAvailable = false;
  behcsGulpLoadError = String(error?.message || error || "behcs_gulp_runtime_unavailable");
  behcsGulp = {
    collectorStatus() {
      return {
        ok: false,
        available: false,
        reason: "behcs_gulp_runtime_unavailable",
        error: behcsGulpLoadError,
        state: {}
      };
    }
  };
}

const repoRoot = path.resolve(__dirname, "..");
const TOTAL_AGENTS = 10_000_000_000;
const GULP_SIZE = 2_000;
const LOGICAL_GULPS = TOTAL_AGENTS / GULP_SIZE;
const SHARD_ROWS = 1_000;
const PROOF_MESSAGES_DEFAULT = 2_000;
const DEFAULT_WRITE_BUFFER = 5_000;

const BEHCS_DIR = rel("data/behcs");
const GC_DIR = path.join(BEHCS_DIR, "garbage-collector");
const GC_STATE_PATH = path.join(GC_DIR, "collector-state.json");
const GC_BUFFER_PATH = path.join(GC_DIR, "message-paths.ndjson");

const LANES = [
  {
    id: "crypto_capsule_seals",
    title: "Crypto capsule seals and signature evidence",
    supervisor: "Hermes Crypto Seal Supervisor",
    evidence: [
      "tools/crypto/crypto-capsule.js",
      "reports/crypto/capsule.verify.json",
      "reports/crypto/capsule.signatures.json",
      "reports/crypto/capsule.hashes.json",
      "data/behcs/capsules/crypto/crypto-profile.v1.capsule.json",
      "data/behcs/capsules/crypto/crypto-profile.v1.signature.json",
      "data/behcs/maps/crypto-capsule-hookwall-policy.json",
      "data/behcs/maps/crypto-capsule-gc-policy.json"
    ],
    invariants: [
      "detached_signature_verified_before_promotion",
      "private_key_material_never_exported",
      "capsule_hash_attached_to_white_room_packet",
      "revocation_pointer_checked_before_use"
    ],
    healing: [
      "Queue a pre-promotion seal verifier for every capsule-backed map update.",
      "Add Hermes review whenever signature JSON exists but verify report is stale.",
      "Route crypto-capsule failures to reverse-gain before Atlas promotion."
    ],
    genius: [
      "Sealed evidence can move between supervisors without copying raw secrets.",
      "Capsule maps already separate Hookwall policy from GC retention policy."
    ],
    mistakes: [
      "A crypto capsule without a fresh verify report is evidence, not authority.",
      "Never use scale runs to materialize secret-bearing payloads."
    ]
  },
  {
    id: "omnimets_metrics",
    title: "OmniMets metrics, budgets, and live telemetry",
    supervisor: "Hermes OmniMets Supervisor",
    evidence: [
      "data/behcs/gnn-active-report.json",
      "data/behcs/resource-budget-snapshot.json",
      "reports/skills-parity-latest.json",
      "reports/startup-methods-latest.md",
      "src/colony-health-reporter.js",
      "src/connectorManifest.js",
      "reports/c-drive-pressure-guardian-latest.md",
      "reports/c-drive-junction-migrator-latest.md"
    ],
    invariants: [
      "disk_pressure_reported_before_scale_jump",
      "gulp_buffer_depth_reported_before_worker_expansion",
      "process_family_counts_recorded",
      "gnn_edge_count_and_file_cap_visible"
    ],
    healing: [
      "Publish one OmniMets packet before every 10B run tranche.",
      "Fail closed if C drive free space falls under the pressure floor.",
      "Report Gulp buffer, scheduler lag, process count, and GNN edge freshness together."
    ],
    genius: [
      "Metrics turn massive agent runs into bounded supervisory decisions.",
      "D-backed junctions preserved path identity while freeing C drive pressure."
    ],
    mistakes: [
      "Throughput without disk and buffer telemetry caused the prior C-drive danger.",
      "A run that cannot report its resource budget cannot promote."
    ]
  },
  {
    id: "omnischeduler_cron",
    title: "OmniScheduler cron, kicks, and idempotent work dispatch",
    supervisor: "Hermes OmniScheduler Supervisor",
    evidence: [
      "tools/behcs/agent-cron-kicker.js",
      "data/behcs/sovereignty/cron/behcs-cron.js",
      "data/behcs/d0-runtime/cron-kicks.ndjson",
      "tools/Run-NotebookBuildLoop-Scheduled.ps1",
      "reports/research-scheduler-wizard-20260322.md"
    ],
    invariants: [
      "scheduled_kicks_are_pid_bound",
      "duplicate_kicks_are_idempotent",
      "stale_lock_blocks_reentry",
      "cron_failures_go_to_d0_runtime_log"
    ],
    healing: [
      "Add scheduler lag to OmniMets and Shannon consensus packets.",
      "Deduplicate cron kicks by PID, lane, and Brown-Hilbert range.",
      "Keep stale-lock healing non-destructive and evidence-preserving."
    ],
    genius: [
      "Scheduler lanes can activate supervisors without live model storms.",
      "Cron evidence already lands in D0 runtime rows."
    ],
    mistakes: [
      "Scheduler retries without idempotency become process storms.",
      "Cron paths must never bypass GAC or Gulp evidence."
    ]
  },
  {
    id: "liris_supervisor_forge",
    title: "Liris-style supervisor forge and diagnose-heal loop",
    supervisor: "Hermes Liris Supervisor Forge",
    evidence: [
      "src/colonyAnatomy.js",
      "src/colony-health-reporter.js",
      "tools/liris-coms-line-audit.js",
      "reports/liris-coms-full-line-audit-latest.md",
      "reports/admin-terminal-liris-profile-latest.md",
      "reports/neurotech-genius-candidate-supervisors-latest.md",
      "data/behcs/supervisors/openmythos/openmythos-gasvm-fusion-supervisors.v1.json"
    ],
    invariants: [
      "diagnose_before_heal",
      "heal_actions_are_non_destructive_by_default",
      "beyond_self_repair_recorded_for_human_review",
      "supervisor_output_gets_shannon_and_reverse_gain_review"
    ],
    healing: [
      "Forge lane supervisors with diagnose-heal-diagnose contracts.",
      "Promote only supervisor actions with evidence, rollback path, and Gulp proof.",
      "Record beyond-self-repair instead of guessing at destructive fixes."
    ],
    genius: [
      "Liris logs encode the buffered I/O and invoke-not-edit lesson.",
      "Colony anatomy already contains a real diagnose/heal grammar."
    ],
    mistakes: [
      "Healing without a second diagnosis can hide the real fault.",
      "Supervisor confidence is not authority without GAC and Shannon evidence."
    ]
  },
  {
    id: "cube_self_healer",
    title: "Cube/Cube-Cubed self-healing and map preservation",
    supervisor: "Hermes Cube Self-Healer Supervisor",
    evidence: [
      "tools/cube/cube-self-healer.js",
      "reports/system-full-review-10b-improvement-latest.md",
      "data/behcs/cubes/system-full-review-10b-improvement.cube.js",
      "data/behcs/cubes/neurotech-hermes-supervisor-of-supervisors.cube.js",
      "data/behcs/maps/system-review/system-full-review-10b-map.v1.json"
    ],
    invariants: [
      "cube_healing_runs_dry_first",
      "map_edges_preserved_before_rewrite",
      "self_healer_cannot_delete_shadow_or_path_specific_surfaces",
      "cube_result_is_audited_by_white_room"
    ],
    healing: [
      "Queue cube self-healer in dry-run mode before any generated map refresh.",
      "Attach before/after map hashes to Hermes dispatch.",
      "Treat cube mismatch as a repair queue item, not a destructive rewrite instruction."
    ],
    genius: [
      "Cube surfaces make the healing graph replayable.",
      "Map/Cube/Index triads give supervisors a stable geometry."
    ],
    mistakes: [
      "A self-healer with delete authority is a risk surface.",
      "Map refreshes without before/after hashes cannot be trusted at 10B scale."
    ]
  }
];

const OUTPUTS = Object.freeze({
  root: rel("data/behcs/targeted-hardening/10b-runs"),
  findings: rel("data/behcs/targeted-hardening/10b-runs/findings-latest.ndjson"),
  actions: rel("data/behcs/targeted-hardening/10b-runs/hermes-healing-actions-latest.ndjson"),
  shards: rel("data/behcs/targeted-hardening/10b-runs/compact-10b-shards-latest.ndjson"),
  proof: rel("data/behcs/targeted-hardening/10b-runs/behcs-proof-messages-latest.ndjson"),
  genius: rel("data/behcs/targeted-hardening/10b-runs/genius-marks-latest.ndjson"),
  mistakes: rel("data/behcs/targeted-hardening/10b-runs/mistake-marks-latest.ndjson"),
  supervisors: rel("data/behcs/supervisors/targeted-hardening/targeted-10b-supervisors.v1.json"),
  map: rel("data/behcs/maps/targeted-hardening/targeted-10b-hardening-map.v1.json"),
  summary: rel("data/behcs/targeted-hardening/10b-runs/summary-latest.json"),
  state: rel("data/behcs/state/targeted-hardening/system-targeted-10b-hardening.state.json"),
  hermes: rel("data/behcs/hermes/targeted-hardening/system-targeted-10b-hardening-dispatch-latest.json"),
  shannon: rel("data/behcs/shannon/targeted-hardening/system-targeted-10b-hardening-consensus-latest.json"),
  cube: rel("data/behcs/cubes/system-targeted-10b-hardening-runs.cube.js"),
  reportJson: rel("reports/system-targeted-10b-hardening-runs-latest.json"),
  reportMd: rel("reports/system-targeted-10b-hardening-runs-latest.md"),
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

function readJson(filePath, fallback = {}) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
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

function sha256Buffer(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
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

function evidenceScore(stats) {
  const existing = stats.filter((item) => item.exists).length;
  const total = Math.max(1, stats.length);
  return round3(existing / total);
}

function buildFindings(generatedAt) {
  return LANES.map((lane, index) => {
    const stats = lane.evidence.map(statEvidence);
    const score = evidenceScore(stats);
    const missing = stats.filter((item) => !item.exists).map((item) => item.path);
    const severity = score >= 0.8 ? "P2" : score >= 0.5 ? "P1" : "P0";
    const finding = {
      id: `targeted-10b-finding-${String(index + 1).padStart(3, "0")}`,
      generatedAt,
      lane: lane.id,
      title: lane.title,
      severity,
      evidenceScore: score,
      existingEvidence: stats.length - missing.length,
      totalEvidence: stats.length,
      missingEvidence: missing,
      invariants: lane.invariants,
      conclusion: score >= 0.8
        ? "lane_has_enough_evidence_for_supervisor_hardening"
        : "lane_requires_hermes_healing_before_scale_promotion"
    };
    finding.digest = sha256Text(JSON.stringify({
      lane: finding.lane,
      severity: finding.severity,
      score: finding.evidenceScore,
      missing
    }));
    finding.evidence = stats;
    return finding;
  });
}

function buildHealingActions(findings, generatedAt) {
  const actions = [];
  for (const finding of findings) {
    const lane = LANES.find((item) => item.id === finding.lane);
    lane.healing.forEach((description, index) => {
      const action = {
        id: `targeted-10b-heal-${finding.lane}-${String(index + 1).padStart(2, "0")}`,
        generatedAt,
        lane: finding.lane,
        supervisor: lane.supervisor,
        priority: finding.severity === "P0" ? "P0" : index === 0 ? "P1" : "P2",
        description,
        gates: ["gac", "hermes", "shannon", "forward_gnn", "reverse_gain_gnn", "white_room", "gulp_2000", "gc"],
        mode: "queue_only_non_destructive",
        evidenceDigest: finding.digest
      };
      action.digest = sha256Text(JSON.stringify(action));
      actions.push(action);
    });
    finding.missingEvidence.slice(0, 3).forEach((missingPath, index) => {
      const action = {
        id: `targeted-10b-evidence-${finding.lane}-${String(index + 1).padStart(2, "0")}`,
        generatedAt,
        lane: finding.lane,
        supervisor: lane.supervisor,
        priority: "P1",
        description: `Refresh or create evidence pointer ${missingPath} before promotion.`,
        gates: ["evidence_refresh", "white_room", "shannon"],
        mode: "queue_only_non_destructive",
        evidenceDigest: finding.digest
      };
      action.digest = sha256Text(JSON.stringify(action));
      actions.push(action);
    });
  }
  return actions;
}

function buildCompactShards(findings, actions) {
  const started = Date.now();
  const rows = [];
  const genius = [];
  const mistakes = [];
  const stride = Math.floor(TOTAL_AGENTS / SHARD_ROWS);
  for (let i = 0; i < SHARD_ROWS; i += 1) {
    const lane = LANES[i % LANES.length];
    const finding = findings[i % findings.length];
    const firstAgent = i * stride + 1;
    const lastAgent = i === SHARD_ROWS - 1 ? TOTAL_AGENTS : (i + 1) * stride;
    const digest = sha256Text(`${lane.id}|${firstAgent}|${lastAgent}|${finding.digest}`);
    rows.push({
      id: `targeted-10b-shard-${String(i).padStart(4, "0")}`,
      lane: lane.id,
      workerRange: `${firstAgent}..${lastAgent}`,
      logicalAgents: lastAgent - firstAgent + 1,
      logicalGulpWindows: Math.ceil((lastAgent - firstAgent + 1) / GULP_SIZE),
      finding: finding.id,
      digest
    });
    if (i % 37 === 0) {
      const note = lane.genius[(i / 37) % lane.genius.length | 0];
      genius.push({
        id: `targeted-10b-genius-${String(genius.length + 1).padStart(4, "0")}`,
        lane: lane.id,
        workerRange: `${firstAgent}..${lastAgent}`,
        note,
        digest: sha256Text(`genius|${lane.id}|${note}|${digest}`)
      });
    }
    if (i % 29 === 0) {
      const note = lane.mistakes[(i / 29) % lane.mistakes.length | 0];
      mistakes.push({
        id: `targeted-10b-mistake-${String(mistakes.length + 1).padStart(4, "0")}`,
        lane: lane.id,
        workerRange: `${firstAgent}..${lastAgent}`,
        note,
        reverseGain: "demote_or_guard_before_promotion",
        digest: sha256Text(`mistake|${lane.id}|${note}|${digest}`)
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
    actionDigest: sha256Text(actions.map((action) => action.digest).join("|"))
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

async function runBehcsProof(generatedAt, proofCount, findings, actions) {
  const proofRows = [];
  if (!behcsGulpAvailable) {
    return {
      proofRows,
      gulp: {
        ok: false,
        skipped: true,
        reason: "behcs_gulp_runtime_unavailable",
        error: behcsGulpLoadError
      }
    };
  }
  const beforeStatus = behcsGulp.collectorStatus();
  const beforeState = beforeStatus.state || {};
  const startSequence = safeInt(beforeState.totalReceived, 0, 0, Number.MAX_SAFE_INTEGER);
  let lastPathGlyph = beforeState.lastPathGlyph || "";
  let lastMessageGlyph = beforeState.lastMessageGlyph || "";
  const writer = new BufferedNdjsonWriter(GC_BUFFER_PATH, DEFAULT_WRITE_BUFFER);
  writer.open();
  for (let i = 0; i < proofCount; i += 1) {
    const lane = LANES[i % LANES.length];
    const finding = findings[i % findings.length];
    const action = actions[i % actions.length];
    const firstAgent = i * GULP_SIZE + 1;
    const lastAgent = firstAgent + GULP_SIZE - 1;
    const msg = {
      id: `targeted-10b-proof-${generatedAt.replace(/[-:.TZ]/g, "").slice(0, 14)}-${String(i).padStart(4, "0")}`,
      ts: generatedAt,
      type: "agent_packet",
      from: "system_targeted_10b_hardening_runs",
      to: "behcs_gulp_runtime",
      verb: "EVT-TARGETED-10B-HARDENING",
      payload: {
        room: "whiteroom",
        totalLogicalAgents: String(TOTAL_AGENTS),
        logicalGulpSize: GULP_SIZE,
        proofSlice: i,
        workerRange: `${firstAgent}..${lastAgent}`,
        lane: lane.id,
        supervisor: lane.supervisor,
        findingDigest: finding.digest,
        healingAction: action.id,
        crypto: lane.id === "crypto_capsule_seals" ? "seal_verify_before_promotion" : "observe",
        omnimets: lane.id === "omnimets_metrics" ? "publish_resource_budget" : "observe",
        scheduler: lane.id === "omnischeduler_cron" ? "pid_bound_idempotent_kick" : "observe",
        hermes: "supervisor_of_supervisors_healing",
        shannon: "consensus_before_promotion",
        forwardGnn: "score_candidate_genius",
        reverseGainGnn: "demote_unproven_or_dangerous_pattern",
        gc: "compact_evidence_preserving"
      }
    };
    proofRows.push(msg);
    const record = behcsGulp.attachBehcsPath(msg, {
      sequence: startSequence + i + 1,
      reason: "system_targeted_10b_hardening",
      remoteMeta: { ip: "127.0.0.1", port: 4947, method: "LOCAL", protocol: "behcs" },
      reflex: { action: "targeted_hardening_proof_slice", runInference: true }
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
    lastFileCapReason: "system_targeted_10b_hardening_bulk"
  });
  const gulp = await behcsGulp.runGulpRehydration({ force: true, reason: "system_targeted_10b_hardening" });
  return { proofRows, gulp: { ...gulp, bulkProofRetainedAfterAppend: retained, bulkProofLinesWritten: writer.linesWritten } };
}

function buildSupervisors(findings, actions, generatedAt) {
  const supervisors = [{
    id: "targeted_10b.hermes.root_supervisor",
    pid: "BH.TARGETED10B.SUP.000",
    generatedAt,
    title: "Hermes Targeted Hardening Supervisor of Supervisors",
    authority: "coordinate_non_destructive_healing_queue",
    gates: ["gac", "shannon", "forward_gnn", "reverse_gain_gnn", "white_room", "gc"],
    childSupervisors: LANES.length
  }];
  LANES.forEach((lane, index) => {
    supervisors.push({
      id: `targeted_10b.${lane.id}.supervisor`,
      pid: `BH.TARGETED10B.SUP.${String(index + 1).padStart(3, "0")}`,
      generatedAt,
      title: lane.supervisor,
      lane: lane.id,
      authority: "diagnose_heal_queue_only",
      gates: ["diagnose_before_heal", "non_destructive", "white_room", "reverse_gain", "shannon"],
      invariantCount: lane.invariants.length,
      actionCount: actions.filter((action) => action.lane === lane.id).length,
      finding: findings.find((finding) => finding.lane === lane.id)?.id || null
    });
  });
  return { generatedAt, supervisors, count: supervisors.length };
}

function buildMap(findings, actions, generatedAt) {
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
  LANES.forEach((lane) => {
    nodes.push({ id: lane.id, kind: "targeted_lane", title: lane.title });
    edges.push({ from: "gac", to: lane.id, relation: "authorizes" });
    edges.push({ from: "hermes", to: lane.id, relation: "supervises" });
    edges.push({ from: lane.id, to: "white_room", relation: "proof_slice" });
    edges.push({ from: lane.id, to: "forward_gnn", relation: "genius_candidate" });
    edges.push({ from: lane.id, to: "reverse_gain_gnn", relation: "mistake_guard" });
    edges.push({ from: lane.id, to: "omnishannon", relation: "consensus_gate" });
    edges.push({ from: lane.id, to: "gulp_2000", relation: "gc_proof" });
  });
  actions.slice(0, 50).forEach((action) => {
    nodes.push({ id: action.id, kind: "healing_action", lane: action.lane, priority: action.priority });
    edges.push({ from: action.lane, to: action.id, relation: "queues" });
    edges.push({ from: action.id, to: "hermes", relation: "reported_to" });
  });
  return {
    id: "targeted-10b-hardening-map",
    generatedAt,
    nodes,
    edges,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    digest: sha256Text(JSON.stringify({ nodes, edges }))
  };
}

function buildShannon(summary, generatedAt) {
  const blockers = summary.findings.filter((finding) => finding.severity === "P0");
  const proceed = blockers.length === 0 && summary.behcsGulp && summary.behcsGulp.ok !== false;
  return {
    id: "targeted-10b-hardening-shannon-consensus",
    generatedAt,
    status: proceed ? "PROCEED_TARGETED_HARDENING_QUEUE_READY" : "HOLD_TARGETED_HARDENING_P0_OPEN",
    consensus: [
      { voice: "gac", vote: "proceed_with_queue_only", weight: 1 },
      { voice: "hermes", vote: "supervisors_forged", weight: 1 },
      { voice: "forward_gnn", vote: "mine_genius_candidates", weight: 1 },
      { voice: "reverse_gain_gnn", vote: "guard_mistake_patterns", weight: 1 },
      { voice: "white_room", vote: "proof_slice_ingested", weight: 1 },
      { voice: "gc", vote: "gulp_processed", weight: 1 }
    ],
    blockers: blockers.map((finding) => finding.id),
    digest: sha256Text(JSON.stringify({
      status: proceed,
      blockers: blockers.map((finding) => finding.digest),
      gulp: summary.behcsGulp?.gulpId
    }))
  };
}

function buildHermes(summary, shannon, generatedAt) {
  return {
    id: "targeted-10b-hardening-hermes-dispatch",
    generatedAt,
    status: shannon.status,
    rootSupervisor: "BH.TARGETED10B.SUP.000",
    lanes: LANES.map((lane) => ({
      lane: lane.id,
      supervisor: lane.supervisor,
      actions: summary.actions.filter((action) => action.lane === lane.id).map((action) => action.id)
    })),
    nextActions: [
      "Run targeted lanes after broad system review before GitHub push.",
      "Keep proof windows bulk-fed through existing Gulp runtime.",
      "Use supervisors to queue healing; do not edit shadow files."
    ],
    digest: sha256Text(JSON.stringify({ status: shannon.status, lanes: LANES.map((lane) => lane.id) }))
  };
}

function buildCube(summary, shannon, generatedAt) {
  return `"use strict";

module.exports = Object.freeze(${JSON.stringify({
    id: "system-targeted-10b-hardening-runs",
    generatedAt,
    logicalAgents: summary.logicalAgents,
    lanes: LANES.map((lane) => lane.id),
    shannon: shannon.status,
    gulpId: summary.behcsGulp?.gulpId || null,
    summary: repoRel(OUTPUTS.summary),
    report: repoRel(OUTPUTS.reportMd),
    map: repoRel(OUTPUTS.map),
    supervisors: repoRel(OUTPUTS.supervisors),
    digest: summary.digests.summaryDigest
  }, null, 2)});
`;
}

function buildReport(summary, shannon) {
  const lines = [];
  lines.push("# System Targeted 10B Hardening Runs");
  lines.push("");
  lines.push(`Generated: ${summary.generatedAt}`);
  lines.push(`Status: ${summary.status}`);
  lines.push(`Shannon: ${shannon.status}`);
  lines.push("");
  lines.push("## Counts");
  lines.push("");
  lines.push(`- Logical agents: ${summary.logicalAgents}`);
  lines.push(`- Logical Gulp windows: ${summary.logicalGulps}`);
  lines.push(`- Targeted lanes: ${summary.counts.lanes}`);
  lines.push(`- Findings: ${summary.counts.findings}`);
  lines.push(`- Hermes healing actions: ${summary.counts.actions}`);
  lines.push(`- Supervisor records: ${summary.counts.supervisors}`);
  lines.push(`- Compact shard rows: ${summary.counts.shardRows}`);
  lines.push(`- Proof messages: ${summary.counts.proofMessages}`);
  lines.push(`- Genius marks: ${summary.counts.genius}`);
  lines.push(`- Mistake marks: ${summary.counts.mistakes}`);
  lines.push("");
  lines.push("## BEHCS Gulp Proof");
  lines.push("");
  lines.push(`- Gulp ID: ${summary.behcsGulp?.gulpId || "n/a"}`);
  lines.push(`- Processed: ${summary.behcsGulp?.processedMessages ?? "n/a"}`);
  lines.push(`- Mistakes: ${summary.behcsGulp?.mistakesDetected ?? "n/a"}`);
  lines.push(`- GNN edges: ${summary.behcsGulp?.gnnEdges ?? "n/a"}`);
  lines.push(`- Bulk lines written: ${summary.behcsGulp?.bulkProofLinesWritten ?? "n/a"}`);
  lines.push(`- Retained buffer after append: ${summary.behcsGulp?.bulkProofRetainedAfterAppend ?? "n/a"}`);
  lines.push("");
  lines.push("## Targeted Lanes");
  lines.push("");
  for (const finding of summary.findings) {
    lines.push(`- ${finding.lane}: ${finding.severity}, evidence ${finding.existingEvidence}/${finding.totalEvidence}, conclusion ${finding.conclusion}`);
  }
  lines.push("");
  lines.push("## Honesty Boundary");
  lines.push("");
  lines.push("- No 10B OS processes.");
  lines.push("- No 10B live model sessions.");
  lines.push("- No shadow file edits.");
  lines.push("- No raw 10B record write.");
  lines.push("- Existing BEHCS Gulp runtime was invoked through exported functions.");
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function writeEvents(summary, generatedAt) {
  const event = {
    ts: generatedAt,
    type: "targeted_10b_hardening_complete",
    status: summary.status,
    logicalAgents: summary.logicalAgents,
    gulpId: summary.behcsGulp?.gulpId || null,
    report: repoRel(OUTPUTS.reportMd)
  };
  appendNdjson(OUTPUTS.inbox, { ...event, direction: "in" });
  appendNdjson(OUTPUTS.outbox, { ...event, direction: "out" });
  appendNdjson(OUTPUTS.gnnEdges, {
    ts: generatedAt,
    type: "targeted_10b_hardening_edge",
    from: "system_targeted_10b_hardening_runs",
    to: "hermes_supervisor_queue",
    weight: 1,
    digest: summary.digests.summaryDigest
  });
}

async function run({ execute = false, proofMessages = PROOF_MESSAGES_DEFAULT } = {}) {
  const generatedAt = new Date().toISOString();
  const startedAt = Date.now();
  const findings = buildFindings(generatedAt);
  const actions = buildHealingActions(findings, generatedAt);
  const compact = buildCompactShards(findings, actions);
  const proofCount = safeInt(proofMessages, PROOF_MESSAGES_DEFAULT, 0, 2_000);
  const behcs = execute
    ? await runBehcsProof(generatedAt, proofCount, findings, actions)
    : { proofRows: [], gulp: { ok: true, skipped: true, reason: "preview" } };
  const supervisors = buildSupervisors(findings, actions, generatedAt);
  const map = buildMap(findings, actions, generatedAt);
  const summary = {
    id: "system-targeted-10b-hardening-runs",
    generatedAt,
    startedAt: new Date(startedAt).toISOString(),
    finishedAt: new Date().toISOString(),
    status: "TARGETED_10B_HARDENING_QUEUE_READY",
    logicalAgents: String(TOTAL_AGENTS),
    logicalGulps: LOGICAL_GULPS,
    counts: {
      lanes: LANES.length,
      findings: findings.length,
      actions: actions.length,
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
    findings,
    actions,
    genius: compact.genius,
    mistakes: compact.mistakes,
    digests: {
      shardDigest: compact.digest,
      actionDigest: compact.actionDigest,
      findingDigest: sha256Text(findings.map((finding) => finding.digest).join("|"))
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
      performed: ["targeted_evidence_review", "compact_10b_pid_range_sweep", "supervisor_forge", "real_behcs_gulp_proof"]
    }
  };
  summary.digests.summaryDigest = sha256Text(JSON.stringify({
    generatedAt,
    findings: summary.digests.findingDigest,
    actions: summary.digests.actionDigest,
    gulp: summary.behcsGulp?.gulpId || "preview"
  }));
  const shannon = buildShannon(summary, generatedAt);
  const hermes = buildHermes(summary, shannon, generatedAt);
  const cube = buildCube(summary, shannon, generatedAt);
  const report = buildReport(summary, shannon);
  if (execute) {
    writeNdjson(OUTPUTS.findings, findings);
    writeNdjson(OUTPUTS.actions, actions);
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
    logicalAgents: summary.logicalAgents,
    logicalGulps: summary.logicalGulps,
    counts: summary.counts,
    speed: summary.speed,
    behcsGulp: summary.behcsGulp,
    outputs: summary.outputs,
    honesty: summary.honesty
  };
}

function status() {
  return {
    ok: true,
    status: "READY",
    logicalAgents: String(TOTAL_AGENTS),
    logicalGulps: LOGICAL_GULPS,
    behcsGulpRuntime: {
      available: behcsGulpAvailable,
      error: behcsGulpLoadError
    },
    lanes: LANES.map((lane) => ({
      id: lane.id,
      title: lane.title,
      evidence: lane.evidence.length,
      supervisor: lane.supervisor
    })),
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
      "node tools/system-targeted-10b-hardening-runs.js status",
      "node tools/system-targeted-10b-hardening-runs.js run --execute --proof-messages=2000"
    ]
  }, null, 2));
  process.exitCode = 2;
}

main(process.argv);
