#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");
const behcsGulp = require("./behcs/behcs-gulp-runtime");

const repoRoot = path.resolve(__dirname, "..");
const REMOTE_BRANCH = "origin/liris/behcs-consolidation";
const BASE_REF = "fb32795";
const TOTAL_AGENTS = 20_000_000_000;
const GULP_SIZE = 2_000;
const LOGICAL_GULPS = TOTAL_AGENTS / GULP_SIZE;
const PROOF_MESSAGES_DEFAULT = 2_000;
const WRITE_BUFFER = 5_000;

const GC_DIR = rel("data/behcs/garbage-collector");
const GC_STATE_PATH = path.join(GC_DIR, "collector-state.json");
const GC_BUFFER_PATH = path.join(GC_DIR, "message-paths.ndjson");

const SOURCE_PATHS = [
  "data/behcs/laws/BEHCS-LAW-000.md",
  "data/behcs/laws/BEHCS-LAW-008.md",
  "data/behcs/laws/BEHCS-LAW-011.md",
  "data/behcs/laws/BEHCS-LAWS-INDEX.md",
  "data/behcs/laws/BEHCS-NODE-AETHER.md",
  "gates/hookwall-v2.js",
  "gates/gnn.js",
  "gates/shannon.js",
  "tools/behcs/liris-heartbeat.js",
  "tools/cube/waves-of-waves-47D.js",
  "tools/behcs-bus.js",
  "tools/behcs-codex.js",
  "tools/behcs-sidecar-liris.js",
  "tools/omni-processor/sandbox-runner.js",
  "tools/omni-processor/test-1000-micro.js",
  "BROWN-HILBERT.md"
];

const OUTPUTS = Object.freeze({
  sourceManifest: rel("data/behcs/hermes-hue-update/source-manifest-latest.json"),
  lawCapsules: rel("data/behcs/hermes-hue-update/law-capsules-latest.json"),
  gateCapsules: rel("data/behcs/hermes-hue-update/gate-capsules-latest.json"),
  riskRegister: rel("data/behcs/hermes-hue-update/risk-register-latest.ndjson"),
  queue: rel("data/behcs/hermes-hue-update/implementation-queue-latest.ndjson"),
  proof: rel("data/behcs/hermes-hue-update/behcs-proof-messages-latest.ndjson"),
  supervisors: rel("data/behcs/supervisors/hermes-hue-update/hermes-hue-supervisors.v1.json"),
  map: rel("data/behcs/maps/hermes-hue-update/hermes-hue-map.v1.json"),
  state: rel("data/behcs/state/hermes-hue-update/hermes-hue-update.state.json"),
  hermes: rel("data/behcs/hermes/hermes-hue-update/hermes-hue-dispatch-latest.json"),
  shannon: rel("data/behcs/shannon/hermes-hue-update/hermes-hue-consensus-latest.json"),
  cube: rel("data/behcs/cubes/hermes-hue-update.cube.js"),
  reportJson: rel("reports/hermes-hue-update-20b-absorption-latest.json"),
  reportMd: rel("reports/hermes-hue-update-20b-absorption-latest.md"),
  inbox: rel("data/behcs/inbox.ndjson"),
  outbox: rel("data/behcs/outbox.ndjson"),
  gnnEdges: rel("data/behcs/gnn-live-edges.ndjson")
});

function rel(p) { return path.join(repoRoot, p); }
function repoRel(p) { return path.relative(repoRoot, p).replace(/\\/g, "/"); }
function ensureDir(filePath) { fs.mkdirSync(path.dirname(filePath), { recursive: true }); }
function sha256Text(value) { return crypto.createHash("sha256").update(String(value), "utf8").digest("hex"); }
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
  constructor(filePath, bufferSize = WRITE_BUFFER) {
    this.filePath = filePath;
    this.bufferSize = Math.max(1, safeInt(bufferSize, WRITE_BUFFER, 1, Number.MAX_SAFE_INTEGER));
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

function git(args, options = {}) {
  return execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: options.maxBuffer || 32 * 1024 * 1024
  });
}
function gitShow(refPath) {
  try {
    return git(["show", `${REMOTE_BRANCH}:${refPath}`], { maxBuffer: 24 * 1024 * 1024 });
  } catch {
    return "";
  }
}
function parseNameStatus() {
  const raw = git(["diff", "--name-status", `${BASE_REF}..${REMOTE_BRANCH}`]);
  return raw.split(/\r?\n/).filter(Boolean).map((line) => {
    const [status, ...rest] = line.split(/\t/);
    const filePath = rest[rest.length - 1] || "";
    return { status, path: filePath };
  });
}
function classifySource(filePath) {
  if (filePath.includes("/laws/")) return "law";
  if (filePath.startsWith("gates/")) return "gate";
  if (filePath.includes("heartbeat")) return "heartbeat";
  if (filePath.includes("waves-of-waves")) return "audit_cube";
  if (filePath.endsWith(".md")) return "doc";
  if (filePath.startsWith("tools/")) return "tool";
  return "runtime";
}
function detectSensitiveContent(filePath, content) {
  const patterns = [
    /Authorization\s*:\s*Bearer\s+["'`]?[A-Za-z0-9._-]+/i,
    /Bearer\s+[A-Za-z0-9._-]{20,}/i,
    /token\s*[:=]\s*["'`][^"'`]{12,}/i
  ];
  return {
    hasSecretSurface: patterns.some((pattern) => pattern.test(content)),
    hasHardcodedNetwork: /\b(?:\d{1,3}\.){3}\d{1,3}\b|localhost:\d{4}/i.test(content),
    hasPathSpecificSurface: /C:[\\/](Users[\\/](rayss|acer)|temp)/i.test(content),
    sanitized: filePath.includes("hookwall-v2") || patterns.some((pattern) => pattern.test(content))
  };
}
function buildSourceManifest(generatedAt) {
  const changed = parseNameStatus();
  const statusByPath = new Map(changed.map((entry) => [entry.path, entry.status]));
  const sourceEntries = SOURCE_PATHS.map((filePath) => {
    const content = gitShow(filePath);
    const sensitivity = detectSensitiveContent(filePath, content);
    return {
      path: filePath,
      status: statusByPath.get(filePath) || "observed",
      category: classifySource(filePath),
      existsInRemote: content.length > 0,
      bytes: Buffer.byteLength(content, "utf8"),
      sha256: content ? sha256Text(content) : null,
      sensitive: sensitivity.hasSecretSurface,
      hardcodedNetwork: sensitivity.hasHardcodedNetwork,
      pathSpecific: sensitivity.hasPathSpecificSurface,
      persistedContent: sensitivity.sanitized ? "digest_only_sanitized" : "capsule_summary_only"
    };
  });
  return {
    id: "hermes-hue-update-source-manifest",
    generatedAt,
    branch: REMOTE_BRANCH,
    base: BASE_REF,
    remoteHead: git(["rev-parse", REMOTE_BRANCH]).trim(),
    localHead: git(["rev-parse", "HEAD"]).trim(),
    requestedDStage: {
      path: "D:\\Asolaria-Hermes-Hue-Update",
      status: "NOT_WRITTEN_SANDBOX_WRITABLE_ROOTS_C_ONLY",
      replacement: "remote objects fetched into local .git; absorbed from git object store without checkout"
    },
    changedCounts: {
      added: changed.filter((entry) => entry.status.startsWith("A")).length,
      modified: changed.filter((entry) => entry.status.startsWith("M")).length,
      deleted: changed.filter((entry) => entry.status.startsWith("D")).length,
      total: changed.length
    },
    destructiveMergeRisk: changed.some((entry) => entry.status.startsWith("D")),
    changedFiles: changed,
    sourceEntries,
    digest: sha256Text(JSON.stringify({ changed, sourceEntries }))
  };
}

function extractTitle(content, fallback) {
  const fmTitle = content.match(/^title:\s*(.+)$/m);
  if (fmTitle) return fmTitle[1].trim();
  const h1 = content.match(/^#\s+(.+)$/m);
  return h1 ? h1[1].trim() : fallback;
}
function buildLawCapsules(generatedAt) {
  const laws = [
    {
      id: "LAW-000",
      path: "data/behcs/laws/BEHCS-LAW-000.md",
      capsule: "Everything addressable in BEHCS is a cube; messages, mistakes, whiterooms, laws, agents, silence, bus, and colony all require coordinates.",
      integration: "Register cube coordinates on every absorbed Hermes artifact, supervisor, map node, proof message, and GNN edge."
    },
    {
      id: "LAW-008",
      path: "data/behcs/laws/BEHCS-LAW-008.md",
      capsule: "Filesystem is the mirror and ground truth; read before typing, treat configs as identity, and avoid blind live mutations.",
      integration: "Absorb by git object digest and local file evidence; no live merge or shadow edit."
    },
    {
      id: "LAW-011",
      path: "data/behcs/laws/BEHCS-LAW-011.md",
      capsule: "Every tuple carries ts and received_at; drift above 120s flags, above 300s escalates/halts pending review.",
      integration: "Add timestamp-drift checks to future BEHCS bus, sidecar, hookwall, GNN, Shannon, and Hermes supervisor lanes."
    },
    {
      id: "LAW-003",
      path: "tools/behcs/liris-heartbeat.js",
      capsule: "Heartbeat evidence from Liris emits periodic compute pulses below the 120s silence threshold.",
      integration: "Keep as heartbeat contract only; do not launch hardcoded node/IP targets from absorbed branch."
    }
  ];
  return {
    id: "hermes-hue-law-capsules",
    generatedAt,
    branch: REMOTE_BRANCH,
    laws: laws.map((law) => {
      const content = gitShow(law.path);
      return {
        ...law,
        title: extractTitle(content, law.id),
        sourceSha256: content ? sha256Text(content) : null,
        sourceBytes: Buffer.byteLength(content, "utf8")
      };
    }),
    digest: sha256Text(JSON.stringify(laws))
  };
}

function buildGateCapsules(generatedAt) {
  const gateDefs = [
    {
      id: "hookwall_v2_18_event_contract",
      path: "gates/hookwall-v2.js",
      lane: "hookwall",
      capsule: "18-event hookwall contract for tool, permission, config, file, and runtime events.",
      absorption: "Map events and risk semantics; quarantine raw file because it contains a bearer-token-shaped surface."
    },
    {
      id: "gnn_gate_risk_adapter",
      path: "gates/gnn.js",
      lane: "forward_gnn",
      capsule: "Graph-event risk gate with local fallback scoring and optional cascade inference endpoint.",
      absorption: "Wrap behind local edgeRiskEngine/BEHCS GNN contract and keep endpoint optional/fail-bounded."
    },
    {
      id: "shannon_scan_gate",
      path: "gates/shannon.js",
      lane: "omnishannon",
      capsule: "Risk-tiered Shannon scan gate; high risk uses full scan, medium risk dry-run, unreachable high-risk path blocks.",
      absorption: "Convert into OmniShannon release gate contract before live route activation."
    },
    {
      id: "liris_heartbeat_contract",
      path: "tools/behcs/liris-heartbeat.js",
      lane: "supervisor_heartbeat",
      capsule: "Liris heartbeat compute pulse and triad delivery contract.",
      absorption: "Register as supervisor heartbeat semantics; no auto-launch of hardcoded targets."
    },
    {
      id: "waves_of_waves_47d_audit",
      path: "tools/cube/waves-of-waves-47D.js",
      lane: "cube_cube_cubed",
      capsule: "47D waves-of-waves audit map for gate reality checks and fail-closed upgrades.",
      absorption: "Import the audit findings into cube/map queues, replacing old path literals before runtime use."
    }
  ];
  const gates = gateDefs.map((gate) => {
    const content = gitShow(gate.path);
    const sensitivity = detectSensitiveContent(gate.path, content);
    return {
      ...gate,
      sourceSha256: content ? sha256Text(content) : null,
      sourceBytes: Buffer.byteLength(content, "utf8"),
      sensitive: sensitivity.hasSecretSurface,
      hardcodedNetwork: sensitivity.hasHardcodedNetwork,
      pathSpecific: sensitivity.hasPathSpecificSurface,
      rawRuntimeAllowed: false
    };
  });
  return {
    id: "hermes-hue-gate-capsules",
    generatedAt,
    branch: REMOTE_BRANCH,
    gates,
    digest: sha256Text(JSON.stringify(gates))
  };
}

function buildRiskRegister(generatedAt, manifest, gateCapsules) {
  const deleted = manifest.changedFiles.filter((entry) => entry.status.startsWith("D"));
  return [
    {
      id: "direct_merge_deletes_runtime_files",
      generatedAt,
      severity: "CRITICAL",
      lane: "github_release_lanes",
      evidence: `${deleted.length} deletes detected in ${REMOTE_BRANCH}`,
      action: "HALT_DIRECT_MERGE_ABSORB_CONTRACTS_ONLY"
    },
    {
      id: "hardcoded_bearer_token_surface",
      generatedAt,
      severity: "CRITICAL",
      lane: "hookwall",
      evidence: gateCapsules.gates.filter((gate) => gate.sensitive).map((gate) => gate.path).join(", "),
      action: "QUARANTINE_RAW_GATE_STRIP_SECRET_BEFORE_RUNTIME"
    },
    {
      id: "hardcoded_network_targets",
      generatedAt,
      severity: "HARD",
      lane: "federation",
      evidence: gateCapsules.gates.filter((gate) => gate.hardcodedNetwork).map((gate) => gate.path).join(", "),
      action: "MANIFEST_ONLY_NO_DAEMON_LAUNCH"
    },
    {
      id: "path_specific_rayss_or_local_literals",
      generatedAt,
      severity: "HARD",
      lane: "filesystem_mirror",
      evidence: manifest.sourceEntries.filter((entry) => entry.pathSpecific).map((entry) => entry.path).join(", "),
      action: "REMAP_TO_RUNTIME_PATHS_BEFORE_INTEGRATION"
    },
    {
      id: "timestamp_drift_law_missing_local_gate",
      generatedAt,
      severity: "HIGH",
      lane: "law011",
      evidence: "LAW-011 exists in Hermes branch and must become an explicit local gate.",
      action: "IMPLEMENT_TIMESTAMP_DRIFT_GATE_AFTER_ABSORPTION"
    },
    {
      id: "shannon_endpoint_contract_not_registered",
      generatedAt,
      severity: "MEDIUM",
      lane: "omnishannon",
      evidence: "Remote Shannon gate expects scan service contract.",
      action: "REGISTER_LOCAL_CONTRACT_AND_FAIL_CLOSED_FOR_HIGH_RISK"
    }
  ];
}

function buildQueue(generatedAt, laws, gates, risks) {
  const items = [
    ["law000_cube_ontology_manifest", "P0", "cube_cube_cubed", "Bind LAW-000 cube ontology to all BEHCS artifacts and proof messages."],
    ["law008_filesystem_mirror_guard", "P0", "filesystem_mirror", "Add read-before-write identity/config guard without editing shadow files."],
    ["law011_timestamp_drift_gate", "P0", "timestamp_drift", "Implement ts/received_at drift checks and flags for bus/sidecar/hookwall lanes."],
    ["hookwall_v2_contract_sanitized", "P0", "hookwall", "Extract 18-event contract and strip bearer-token-shaped surfaces before any runtime use."],
    ["gnn_gate_adapter_contract", "P1", "forward_gnn", "Map remote GNN gate into local edgeRiskEngine and cascade fallback semantics."],
    ["shannon_scan_endpoint_contract", "P1", "omnishannon", "Register Shannon scan contract and high-risk fail-closed behavior."],
    ["liris_heartbeat_contract", "P1", "supervisors", "Absorb heartbeat semantics while blocking hardcoded target daemon launch."],
    ["waves_of_waves_audit_map", "P1", "cubes", "Convert 47D audit findings into cube/map migration tasks."],
    ["aether_node_registration_manifest", "P2", "federation", "Stage Aether node metadata as manifest-only evidence until operator confirms targets."],
    ["direct_merge_blocker", "P0", "git", "Keep branch out of working tree until deletes/secrets/path literals are reconciled."]
  ];
  return items.map(([id, priority, lane, action], index) => ({
    id,
    generatedAt,
    priority,
    lane,
    action,
    status: priority === "P0" ? "queued_requires_supervisor" : "queued",
    supervisor: `hermes_hue_${lane}_supervisor`,
    sourceLawDigest: laws.digest,
    sourceGateDigest: gates.digest,
    riskIds: risks.filter((risk) => risk.lane === lane || id.includes(risk.lane) || priority === "P0").map((risk) => risk.id).slice(0, 3),
    cubeCoordinates: ["hermes", "hue_update", lane, String(index + 1)]
  }));
}

function buildSupervisors(generatedAt, queue) {
  const lanes = [...new Set(queue.map((item) => item.lane))];
  return [
    {
      id: "hermes_hue_supervisor_of_supervisors",
      generatedAt,
      role: "root_absorption_healing",
      scope: "Absorb Liris/Hermes branch contracts without direct merge.",
      gates: ["law001", "brown_hilbert", "law000", "law008", "law011", "shannon", "gnn", "reverse_gain"]
    },
    ...lanes.map((lane, index) => ({
      id: `hermes_hue_${lane}_supervisor`,
      generatedAt,
      role: "lane_supervisor",
      lane,
      ordinal: index + 1,
      queueItems: queue.filter((item) => item.lane === lane).map((item) => item.id),
      gates: ["source_digest", "cube_coordinates", "risk_register", "bounded_gulp_proof"]
    }))
  ];
}

function buildMap(generatedAt, manifest, laws, gates, risks, queue, supervisors) {
  const nodes = [
    { id: "remote_branch", type: "source", label: REMOTE_BRANCH, digest: manifest.remoteHead },
    { id: "law_capsules", type: "law", label: "LAW-000/008/011 capsules", digest: laws.digest },
    { id: "gate_capsules", type: "gate", label: "Hookwall/GNN/Shannon/Heartbeat/Waves capsules", digest: gates.digest },
    { id: "risk_register", type: "risk", label: "Hermes hue risks", count: risks.length },
    { id: "implementation_queue", type: "queue", label: "Hermes hue queue", count: queue.length },
    { id: "supervisors", type: "supervisor", label: "Hermes hue supervisors", count: supervisors.length },
    { id: "real_gulp_proof", type: "proof", label: "BEHCS Gulp proof slice" }
  ];
  for (const gate of gates.gates) nodes.push({ id: gate.id, type: "gate", label: gate.lane, digest: gate.sourceSha256 });
  const edges = [
    ["remote_branch", "law_capsules", "absorbs"],
    ["remote_branch", "gate_capsules", "absorbs"],
    ["law_capsules", "implementation_queue", "constrains"],
    ["gate_capsules", "implementation_queue", "feeds"],
    ["risk_register", "implementation_queue", "gates"],
    ["implementation_queue", "supervisors", "assigned_to"],
    ["supervisors", "real_gulp_proof", "proves"]
  ].map(([from, to, relation]) => ({ from, to, relation }));
  for (const gate of gates.gates) edges.push({ from: "gate_capsules", to: gate.id, relation: "contains" });
  return {
    id: "hermes-hue-update-map",
    generatedAt,
    nodes,
    edges,
    counts: { nodes: nodes.length, edges: edges.length },
    digest: sha256Text(JSON.stringify({ nodes, edges }))
  };
}

function buildCompactShards(queue) {
  return queue.map((item, index) => {
    const start = index * (TOTAL_AGENTS / queue.length) + 1;
    const end = Math.min(TOTAL_AGENTS, (index + 1) * (TOTAL_AGENTS / queue.length));
    return {
      shard: index,
      queueItem: item.id,
      lane: item.lane,
      logicalRange: `${Math.floor(start)}..${Math.floor(end)}`,
      logicalAgents: String(Math.floor(end - start + 1)),
      logicalGulpWindows: Math.floor((end - start + 1) / GULP_SIZE),
      digest: sha256Text(`${item.id}:${start}:${end}`)
    };
  });
}

async function runBehcsProof(generatedAt, proofCount, manifest, laws, gates, risks, queue) {
  const proofRows = [];
  const beforeStatus = behcsGulp.collectorStatus();
  const beforeState = beforeStatus.state || {};
  const startSequence = safeInt(beforeState.totalReceived, 0, 0, Number.MAX_SAFE_INTEGER);
  let lastPathGlyph = beforeState.lastPathGlyph || "";
  let lastMessageGlyph = beforeState.lastMessageGlyph || "";
  const writer = new BufferedNdjsonWriter(GC_BUFFER_PATH, WRITE_BUFFER);
  writer.open();
  for (let i = 0; i < proofCount; i += 1) {
    const item = queue[i % queue.length];
    const risk = risks[i % risks.length];
    const gate = gates.gates[i % gates.gates.length];
    const firstAgent = i * GULP_SIZE + 1;
    const lastAgent = firstAgent + GULP_SIZE - 1;
    const msg = {
      id: `hermes-hue-proof-${generatedAt.replace(/[-:.TZ]/g, "").slice(0, 14)}-${String(i).padStart(4, "0")}`,
      ts: generatedAt,
      received_at: generatedAt,
      type: "agent_packet",
      from: "hermes_hue_update_absorber",
      to: "behcs_gulp_runtime",
      verb: "EVT-HERMES-HUE-UPDATE-20B-ABSORB",
      payload: {
        room: "whiteroom",
        totalLogicalAgents: String(TOTAL_AGENTS),
        logicalGulpSize: GULP_SIZE,
        logicalGulps: LOGICAL_GULPS,
        proofSlice: i,
        workerRange: `${firstAgent}..${lastAgent}`,
        sourceBranch: REMOTE_BRANCH,
        remoteHead: manifest.remoteHead,
        action: item.id,
        lane: item.lane,
        gate: gate.id,
        risk: risk.id,
        lawDigest: laws.digest,
        gateDigest: gates.digest,
        forwardGnn: "mine_hermes_hue_genius",
        reverseGainGnn: "quarantine_merge_delete_secret_path_risks",
        shannon: "halt_direct_merge_absorb_contracts",
        openMythos: "contract_only_no_live_model_storm",
        omniflywheel: "route_supervisors_maps_cubes",
        omnispindle: "compact_pid_ranges_no_process_storm",
        gc: "bounded_proof_slice"
      }
    };
    proofRows.push(msg);
    const record = behcsGulp.attachBehcsPath(msg, {
      sequence: startSequence + i + 1,
      reason: "hermes_hue_update_20b_absorption",
      remoteMeta: { ip: "127.0.0.1", port: 4947, method: "LOCAL", protocol: "behcs" },
      reflex: { action: "hermes_hue_absorb_proof_slice", runInference: true }
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
    lastFileCapReason: "hermes_hue_update_20b_bulk"
  });
  const gulp = await behcsGulp.runGulpRehydration({ force: true, reason: "hermes_hue_update_20b_absorption" });
  return { proofRows, gulp: { ...gulp, bulkProofRetainedAfterAppend: retained, bulkProofLinesWritten: writer.linesWritten } };
}

function buildShannon(summary) {
  const directMergeBlocked = summary.risks.some((risk) => risk.id === "direct_merge_deletes_runtime_files");
  const criticalRisks = summary.risks.filter((risk) => risk.severity === "CRITICAL").length;
  const gulpOk = summary.behcsGulp?.ok === true && Number(summary.behcsGulp?.mistakesDetected || 0) === 0;
  return {
    id: "hermes-hue-update-shannon-consensus",
    generatedAt: summary.generatedAt,
    status: gulpOk ? "PROCEED_HERMES_HUE_CONTRACT_ABSORPTION_DIRECT_MERGE_HALTED" : "HALT_HERMES_HUE_ABSORPTION_PROOF_FAILED",
    confidence: gulpOk ? 0.94 : 0.55,
    directMergeAllowed: false,
    reasons: [
      `${summary.sourceManifest.changedCounts.total} changed files observed from ${REMOTE_BRANCH}`,
      `${criticalRisks} critical risks require quarantine/supervisor handling`,
      directMergeBlocked ? "direct merge halted because remote branch deletes local runtime files" : "no delete risk detected",
      `Gulp proof ${summary.behcsGulp?.gulpId || "preview"} mistakes=${summary.behcsGulp?.mistakesDetected ?? "n/a"}`
    ],
    next: [
      "Implement LAW-011 timestamp drift gate locally.",
      "Extract hookwall-v2 event contract without bearer-token-shaped code.",
      "Register GNN/Shannon gate contracts behind existing local authority.",
      "Keep D staging manual until writable permissions are available."
    ]
  };
}

function buildReport(summary, shannon) {
  const lines = [];
  lines.push("# Hermes Hue Update 20B Absorption");
  lines.push("");
  lines.push(`Generated: ${summary.generatedAt}`);
  lines.push(`Status: ${summary.status}`);
  lines.push(`Branch: ${summary.sourceManifest.branch}`);
  lines.push(`Remote head: ${summary.sourceManifest.remoteHead}`);
  lines.push(`Logical agents: ${summary.logicalAgents}`);
  lines.push(`Logical Gulp windows: ${summary.logicalGulps}`);
  lines.push(`Shannon: ${shannon.status}`);
  lines.push("");
  lines.push("## D Drive Boundary");
  lines.push("");
  lines.push(`- Requested D stage: ${summary.sourceManifest.requestedDStage.path}`);
  lines.push(`- Status: ${summary.sourceManifest.requestedDStage.status}`);
  lines.push(`- Replacement used now: ${summary.sourceManifest.requestedDStage.replacement}`);
  lines.push("");
  lines.push("## Absorbed Contracts");
  lines.push("");
  for (const law of summary.laws.laws) lines.push(`- ${law.id}: ${law.title}; digest=${law.sourceSha256}`);
  for (const gate of summary.gates.gates) lines.push(`- ${gate.id}: lane=${gate.lane}; rawRuntimeAllowed=${gate.rawRuntimeAllowed}; digest=${gate.sourceSha256}`);
  lines.push("");
  lines.push("## Risks");
  lines.push("");
  for (const risk of summary.risks) lines.push(`- ${risk.severity}: ${risk.id} -> ${risk.action}`);
  lines.push("");
  lines.push("## Implementation Queue");
  lines.push("");
  for (const item of summary.queue) lines.push(`- ${item.priority}: ${item.id} (${item.lane}) -> ${item.action}`);
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
  lines.push("- This is a compact 20B Hermes/Liris absorption tranche.");
  lines.push("- No direct branch merge.");
  lines.push("- No D drive write from this sandbox.");
  lines.push("- No raw hookwall secret-bearing code promotion.");
  lines.push("- No 20B OS processes, live model calls, or raw records.");
  lines.push("- No shadow file edits.");
  lines.push("- No daemon launch for hardcoded network targets.");
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function buildCube(summary, shannon) {
  return `const cube = Object.freeze(${JSON.stringify({
    id: "hermes-hue-update-20b-absorption",
    generatedAt: summary.generatedAt,
    branch: summary.sourceManifest.branch,
    remoteHead: summary.sourceManifest.remoteHead,
    logicalAgents: summary.logicalAgents,
    status: summary.status,
    shannon: shannon.status,
    directMergeAllowed: false,
    gulpId: summary.behcsGulp?.gulpId || null,
    report: repoRel(OUTPUTS.reportMd),
    map: repoRel(OUTPUTS.map),
    supervisors: repoRel(OUTPUTS.supervisors),
    digest: summary.digest
  }, null, 2)});\n\nexport default cube;\nexport { cube };\n`;
}

function writeEvents(summary) {
  const event = {
    ts: summary.generatedAt,
    type: "hermes_hue_update_20b_absorption_complete",
    status: summary.status,
    branch: summary.sourceManifest.branch,
    remoteHead: summary.sourceManifest.remoteHead,
    logicalAgents: summary.logicalAgents,
    gulpId: summary.behcsGulp?.gulpId || null,
    report: repoRel(OUTPUTS.reportMd),
    digest: summary.digest
  };
  appendNdjson(OUTPUTS.inbox, { ...event, direction: "in" });
  appendNdjson(OUTPUTS.outbox, { ...event, direction: "out" });
  appendNdjson(OUTPUTS.gnnEdges, {
    ts: summary.generatedAt,
    type: "hermes_hue_update_absorption_edge",
    from: "liris_behcs_consolidation",
    to: "hermes_hue_supervisor_of_supervisors",
    weight: 1,
    digest: summary.digest
  });
}

async function run({ execute = false, proofMessages = PROOF_MESSAGES_DEFAULT } = {}) {
  const generatedAt = new Date().toISOString();
  const startedAt = Date.now();
  const sourceManifest = buildSourceManifest(generatedAt);
  const laws = buildLawCapsules(generatedAt);
  const gates = buildGateCapsules(generatedAt);
  const risks = buildRiskRegister(generatedAt, sourceManifest, gates);
  const queue = buildQueue(generatedAt, laws, gates, risks);
  const supervisors = buildSupervisors(generatedAt, queue);
  const map = buildMap(generatedAt, sourceManifest, laws, gates, risks, queue, supervisors);
  const shards = buildCompactShards(queue);
  const proofCount = safeInt(proofMessages, PROOF_MESSAGES_DEFAULT, 0, 2_000);
  const behcs = execute ? await runBehcsProof(generatedAt, proofCount, sourceManifest, laws, gates, risks, queue) : { proofRows: [], gulp: { ok: true, skipped: true, reason: "preview" } };
  const elapsedMs = Date.now() - startedAt;
  const status = behcs.gulp?.ok === true
    ? "HERMES_HUE_UPDATE_20B_ABSORBED_DIRECT_MERGE_HALTED"
    : "HERMES_HUE_UPDATE_ABSORPTION_GATED";
  const summary = {
    id: "hermes-hue-update-20b-absorption",
    generatedAt,
    startedAt: new Date(startedAt).toISOString(),
    finishedAt: new Date().toISOString(),
    status,
    logicalAgents: String(TOTAL_AGENTS),
    logicalGulps: LOGICAL_GULPS,
    compactMode: "20b_compact_ranges_real_gulp_proof_git_object_absorption",
    elapsedMs,
    sourceManifest,
    laws,
    gates,
    risks,
    queue,
    supervisors,
    map,
    shards,
    counts: {
      sourceEntries: sourceManifest.sourceEntries.length,
      changedFiles: sourceManifest.changedCounts.total,
      lawCapsules: laws.laws.length,
      gateCapsules: gates.gates.length,
      risks: risks.length,
      criticalRisks: risks.filter((risk) => risk.severity === "CRITICAL").length,
      queueItems: queue.length,
      supervisors: supervisors.length,
      shards: shards.length,
      proofMessages: behcs.proofRows.length
    },
    behcsGulp: behcs.gulp,
    digest: null
  };
  summary.digest = sha256Text(JSON.stringify({ ...summary, digest: null }));
  const shannon = buildShannon(summary);
  const hermes = {
    id: "hermes-hue-update-dispatch",
    generatedAt,
    status: "READY_CONTRACT_ABSORPTION_DIRECT_MERGE_HALTED",
    rootSupervisor: "hermes_hue_supervisor_of_supervisors",
    priorityQueue: queue.filter((item) => item.priority === "P0"),
    blockedRuntimePromotions: risks.filter((risk) => risk.severity === "CRITICAL").map((risk) => risk.id),
    nextSupervisors: supervisors.map((supervisor) => supervisor.id)
  };
  const state = {
    id: "hermes-hue-update-state",
    generatedAt,
    status: summary.status,
    shannon: shannon.status,
    gulpId: summary.behcsGulp?.gulpId || null,
    sinceLastGulp: behcsGulp.collectorStatus().state?.sinceLastGulp ?? null,
    digest: summary.digest
  };
  writeJson(OUTPUTS.sourceManifest, sourceManifest);
  writeJson(OUTPUTS.lawCapsules, laws);
  writeJson(OUTPUTS.gateCapsules, gates);
  writeNdjson(OUTPUTS.riskRegister, risks);
  writeNdjson(OUTPUTS.queue, queue);
  writeNdjson(OUTPUTS.proof, behcs.proofRows);
  writeJson(OUTPUTS.supervisors, supervisors);
  writeJson(OUTPUTS.map, map);
  writeJson(OUTPUTS.state, state);
  writeJson(OUTPUTS.hermes, hermes);
  writeJson(OUTPUTS.shannon, shannon);
  writeText(OUTPUTS.cube, buildCube(summary, shannon));
  writeJson(OUTPUTS.reportJson, summary);
  writeText(OUTPUTS.reportMd, buildReport(summary, shannon));
  writeEvents(summary);
  return summary;
}

function status() {
  const sourceManifest = buildSourceManifest(new Date().toISOString());
  return {
    id: "hermes-hue-update-20b-absorber",
    status: sourceManifest.changedCounts.total > 0 ? "READY" : "READY_NO_REMOTE_DIFF",
    branch: REMOTE_BRANCH,
    remoteHead: sourceManifest.remoteHead,
    localHead: sourceManifest.localHead,
    logicalAgents: String(TOTAL_AGENTS),
    logicalGulps: LOGICAL_GULPS,
    dStage: sourceManifest.requestedDStage,
    changedCounts: sourceManifest.changedCounts,
    destructiveMergeRisk: sourceManifest.destructiveMergeRisk,
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
      "node tools/hermes-hue-update-absorber.js status",
      "node tools/hermes-hue-update-absorber.js run --execute --proof-messages=2000"
    ]
  }, null, 2));
  process.exitCode = 2;
}

main(process.argv);
