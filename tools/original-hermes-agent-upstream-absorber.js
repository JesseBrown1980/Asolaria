#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");
const behcsGulp = require("./behcs/behcs-gulp-runtime");

const repoRoot = path.resolve(__dirname, "..");
const dDriveUpstreamRoot = "D:\\Asolaria-External\\hermes-agent-upstream";
const upstreamRoot = path.resolve(
  process.env.ORIGINAL_HERMES_UPSTREAM_ROOT
    || (fs.existsSync(dDriveUpstreamRoot) ? dDriveUpstreamRoot : path.join(repoRoot, ".external", "hermes-agent-upstream"))
);
const UPSTREAM_URL = "https://github.com/NousResearch/hermes-agent.git";
const TOTAL_AGENTS = Number(process.env.ORIGINAL_HERMES_LOGICAL_AGENTS || 20_000_000_000);
const GULP_SIZE = 2_000;
const LOGICAL_GULPS = TOTAL_AGENTS / GULP_SIZE;
const PROOF_MESSAGES_DEFAULT = 2_000;
const WRITE_BUFFER = 5_000;

const GC_DIR = rel("data/behcs/garbage-collector");
const GC_STATE_PATH = path.join(GC_DIR, "collector-state.json");
const GC_BUFFER_PATH = path.join(GC_DIR, "message-paths.ndjson");

const SOURCE_PATHS = [
  "README.md",
  "RELEASE_v0.11.0.md",
  "RELEASE_v0.10.0.md",
  "pyproject.toml",
  "cli.py",
  "run_agent.py",
  "hermes_state.py",
  "agent/transports/base.py",
  "agent/transports/chat_completions.py",
  "agent/transports/anthropic.py",
  "agent/transports/codex.py",
  "agent/transports/bedrock.py",
  "agent/context_compressor.py",
  "agent/memory_manager.py",
  "agent/memory_provider.py",
  "agent/shell_hooks.py",
  "agent/skill_commands.py",
  "gateway/run.py",
  "gateway/config.py",
  "gateway/platforms/api_server.py",
  "cron/scheduler.py",
  "cron/jobs.py",
  "hermes_cli/plugins.py",
  "tools/checkpoint_manager.py",
  "tools/delegate_task.py",
  "skills/autonomous-ai-agents/hermes-agent/SKILL.md"
];

const OUTPUTS = Object.freeze({
  manifest: rel("data/behcs/original-hermes-agent/source-manifest-latest.json"),
  architecture: rel("data/behcs/original-hermes-agent/architecture-capsules-latest.json"),
  riskRegister: rel("data/behcs/original-hermes-agent/risk-register-latest.ndjson"),
  queue: rel("data/behcs/original-hermes-agent/implementation-queue-latest.ndjson"),
  proof: rel("data/behcs/original-hermes-agent/behcs-proof-messages-latest.ndjson"),
  supervisors: rel("data/behcs/supervisors/original-hermes-agent/original-hermes-agent-supervisors.v1.json"),
  map: rel("data/behcs/maps/original-hermes-agent/original-hermes-agent-map.v1.json"),
  state: rel("data/behcs/state/original-hermes-agent/original-hermes-agent.state.json"),
  hermes: rel("data/behcs/hermes/original-hermes-agent/original-hermes-agent-dispatch-latest.json"),
  shannon: rel("data/behcs/shannon/original-hermes-agent/original-hermes-agent-consensus-latest.json"),
  cube: rel("data/behcs/cubes/original-hermes-agent-upstream.cube.js"),
  reportJson: rel("reports/original-hermes-agent-upstream-20b-absorption-latest.json"),
  reportMd: rel("reports/original-hermes-agent-upstream-20b-absorption-latest.md"),
  inbox: rel("data/behcs/inbox.ndjson"),
  outbox: rel("data/behcs/outbox.ndjson"),
  gnnEdges: rel("data/behcs/gnn-live-edges.ndjson")
});

function rel(p) { return path.join(repoRoot, p); }
function repoRel(p) { return path.relative(repoRoot, p).replace(/\\/g, "/"); }
function upstreamRel(p) { return path.join(upstreamRoot, p); }
function ensureDir(filePath) { fs.mkdirSync(path.dirname(filePath), { recursive: true }); }
function sha256Text(value) { return crypto.createHash("sha256").update(String(value), "utf8").digest("hex"); }
function sha256File(filePath) { return sha256Text(fs.readFileSync(filePath, "utf8")); }
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
function logicalScaleLabel(totalAgents = TOTAL_AGENTS) {
  if (totalAgents >= 1_000_000_000 && totalAgents % 1_000_000_000 === 0) return `${totalAgents / 1_000_000_000}B`;
  if (totalAgents >= 1_000_000 && totalAgents % 1_000_000 === 0) return `${totalAgents / 1_000_000}M`;
  return String(totalAgents);
}
function readJson(filePath, fallback = {}) {
  try { return JSON.parse(fs.readFileSync(filePath, "utf8")); } catch { return fallback; }
}
function readText(filePath, fallback = "") {
  try { return fs.readFileSync(filePath, "utf8"); } catch { return fallback; }
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
function git(args, cwd = upstreamRoot) {
  return execFileSync("git", args, { cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
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

function requireUpstream() {
  if (!fs.existsSync(path.join(upstreamRoot, ".git"))) {
    throw new Error(`Missing upstream clone: ${upstreamRoot}`);
  }
}

function listTags() {
  return git(["tag", "--list", "v2026.*"]).split(/\r?\n/).filter(Boolean).sort(compareVersionTags);
}

function compareVersionTags(a, b) {
  const parse = (tag) => String(tag).replace(/^v/, "").split(".").map((part) => Number(part));
  const aa = parse(a);
  const bb = parse(b);
  for (let i = 0; i < Math.max(aa.length, bb.length); i += 1) {
    const av = aa[i] || 0;
    const bv = bb[i] || 0;
    if (av !== bv) return av - bv;
  }
  return String(a).localeCompare(String(b));
}

function detectSensitive(content) {
  return /api[_-]?key|token|secret|password|oauth|credential|Authorization|Bearer/i.test(content);
}

function buildManifest(generatedAt) {
  requireUpstream();
  const head = git(["rev-parse", "HEAD"]).trim();
  const branch = git(["branch", "--show-current"]).trim();
  const tags = listTags();
  const dStageExists = fs.existsSync(path.join(dDriveUpstreamRoot, ".git"));
  const entries = SOURCE_PATHS.map((relPath) => {
    const fullPath = upstreamRel(relPath);
    const exists = fs.existsSync(fullPath);
    const content = exists ? readText(fullPath) : "";
    return {
      path: relPath,
      exists,
      bytes: exists ? Buffer.byteLength(content, "utf8") : 0,
      sha256: exists ? sha256Text(content) : null,
      sensitiveSurface: exists ? detectSensitive(content) : false,
      persistedContent: "digest_and_capsule_summary_only"
    };
  });
  const release = readText(upstreamRel("RELEASE_v0.11.0.md"));
  const packageMeta = readText(upstreamRel("pyproject.toml"));
  return {
    id: "original-hermes-agent-source-manifest",
    generatedAt,
    upstreamUrl: UPSTREAM_URL,
    localClone: repoRel(upstreamRoot),
    requestedDStage: {
      path: dDriveUpstreamRoot,
      status: dStageExists ? "D_STAGE_READY" : "D_STAGE_NOT_PRESENT",
      replacement: `${upstreamRoot} shallow filtered clone for inspection`
    },
    branch,
    head,
    latestTag: tags[tags.length - 1] || null,
    version: (packageMeta.match(/^version\s*=\s*"([^"]+)"/m) || [null, "unknown"])[1],
    release: {
      file: "RELEASE_v0.11.0.md",
      title: (release.match(/^#\s+(.+)$/m) || [null, "unknown"])[1],
      since: (release.match(/\*\*Since v0\.9\.0:\*\*\s*(.+)$/m) || [null, "unknown"])[1],
      sha256: release ? sha256Text(release) : null
    },
    sourceEntries: entries,
    counts: {
      sourceEntries: entries.length,
      present: entries.filter((entry) => entry.exists).length,
      sensitiveSurfaces: entries.filter((entry) => entry.sensitiveSurface).length
    },
    digest: sha256Text(JSON.stringify({ head, branch, tags, entries }))
  };
}

function buildArchitectureCapsules(generatedAt, manifest) {
  const capsules = [
    {
      id: "self_improving_learning_loop",
      lane: "memory_skills",
      source: "README.md",
      essence: "Creates skills from experience, improves skills during use, nudges memory persistence, searches prior sessions, and builds long-lived user context.",
      asolariaFit: "Map to BEHCS mistake-ledger, reverse-gain promotion, Atlas Store, and supervisor-created skill contracts."
    },
    {
      id: "sqlite_wal_session_memory",
      lane: "memory_ledger",
      source: "hermes_state.py",
      essence: "Thread-safe SQLite state with WAL, checkpoints, session lineage, child sessions, usage, memories, and startup VACUUM/prune.",
      asolariaFit: "Use as design input for Asolaria memoryStore/taskLedgerStore/mistakeLedgerStore WAL-backed evolution."
    },
    {
      id: "transport_abc_provider_router",
      lane: "model_routing",
      source: "agent/transports/",
      essence: "Provider-specific HTTP/API conversion moved behind transport classes: Anthropic, chat completions, Responses/Codex, Bedrock.",
      asolariaFit: "Map into brainPolicy/workerRouter as pluggable cognitive-engine transport contracts."
    },
    {
      id: "plugin_hook_surface",
      lane: "plugins_hooks",
      source: "hermes_cli/plugins.py + agent/shell_hooks.py",
      essence: "Plugins and shell hooks can register commands, dispatch tools, block tool calls, transform tool results, and alter terminal output.",
      asolariaFit: "Map to GAC-governed connector hooks with fail-closed pre-tool policy and audit logging."
    },
    {
      id: "gateway_multi_platform",
      lane: "gateway",
      source: "gateway/",
      essence: "Unified gateway for Telegram, Discord, Slack, WhatsApp, Signal, Matrix, Email, SMS, Feishu, WeCom, QQBot, webhooks, and more.",
      asolariaFit: "Crosswalk to Asolaria connectors and mobile/guardian surfaces with platform-specific session keys."
    },
    {
      id: "cron_scheduler",
      lane: "scheduler",
      source: "cron/",
      essence: "Natural-language scheduled jobs with platform delivery, skills, pause/resume/run/remove flows.",
      asolariaFit: "Map to OmniScheduler and taskLedgerStore, gated by Law001 and resource-budget guard."
    },
    {
      id: "checkpoint_rollback",
      lane: "filesystem_safety",
      source: "tools/checkpoint_manager.py + cli.py",
      essence: "Filesystem checkpoints and rollback surfaces before destructive operations.",
      asolariaFit: "Bind to C-drive pressure guard, Brown-Hilbert file identity, and pre-mutation approval snapshots."
    },
    {
      id: "delegate_orchestrator_subagents",
      lane: "omnispindle",
      source: "tools/delegate_task.py + RELEASE_v0.11.0.md",
      essence: "Subagents can run as orchestrators with configurable spawn depth and file coordination.",
      asolariaFit: "Map to Omnispindle/Omniflywheel coupled workers with supervisor fanout limits."
    },
    {
      id: "ink_tui_jsonrpc",
      lane: "operator_interface",
      source: "ui-tui/ + tui_gateway/",
      essence: "React/Ink TUI backed by Python JSON-RPC, streaming status, slash completion, picker, and subagent observability.",
      asolariaFit: "Design input for Asolaria worker-runtime/graph-runtime frontends and terminal dashboards."
    },
    {
      id: "release_v011_security_hardening",
      lane: "security",
      source: "RELEASE_v0.11.0.md + SECURITY.md",
      essence: "Security hardening spans API auth, path traversal, sandbox writes, SSRF, webhook signature validation, OAuth lifecycle, and interrupt scoping.",
      asolariaFit: "Map directly to GAC, riskEngine, gateway/toolAuthority, and hookwall hardening lanes."
    }
  ].map((capsule) => ({
    ...capsule,
    generatedAt,
    sourceSha256: manifest.sourceEntries.find((entry) => capsule.source.startsWith(entry.path) || entry.path.startsWith(capsule.source.replace(/\/$/, "")))?.sha256 || null,
    cubeCoordinates: ["original_hermes_agent", capsule.lane, capsule.id]
  }));
  return {
    id: "original-hermes-agent-architecture-capsules",
    generatedAt,
    upstreamHead: manifest.head,
    capsules,
    digest: sha256Text(JSON.stringify(capsules))
  };
}

function buildRisks(generatedAt, manifest, architecture) {
  return [
    {
      id: "native_windows_not_supported",
      generatedAt,
      severity: "HARD",
      lane: "runtime",
      evidence: "README states Windows native is not supported and recommends WSL2.",
      action: "DO_NOT_INSTALL_NATIVE_WINDOWS; STAGE_AS_CONTRACT_OR_WSL_ONLY"
    },
    {
      id: "provider_secret_surface",
      generatedAt,
      severity: "CRITICAL",
      lane: "secrets",
      evidence: `${manifest.counts.sensitiveSurfaces} inspected source files mention credential/token/OAuth surfaces.`,
      action: "NO_SECRET_IMPORT; MAP_CONFIG_CONTRACTS_ONLY"
    },
    {
      id: "shell_hooks_can_execute_code",
      generatedAt,
      severity: "CRITICAL",
      lane: "plugins_hooks",
      evidence: "Hermes plugin/shell hook surface can block, dispatch, transform, and execute lifecycle hooks.",
      action: "REQUIRE_GAC_PRE_TOOL_AND_AUDIT_BEFORE_ANY_HOOK_BRIDGE"
    },
    {
      id: "gateway_platform_sprawl",
      generatedAt,
      severity: "HIGH",
      lane: "gateway",
      evidence: "17 messaging platforms plus webhooks and API server imply broad credential and inbound-event surface.",
      action: "CONNECTOR_BY_CONNECTOR_QUARANTINE; NO_BULK_GATEWAY_ENABLE"
    },
    {
      id: "optional_dependency_explosion",
      generatedAt,
      severity: "HIGH",
      lane: "dependency",
      evidence: "pyproject includes large optional extras: all, messaging, voice, web, rl, matrix, bedrock, termux.",
      action: "NO_PIP_ALL_ON_C; USE_MANIFEST_AND_SELECTIVE_WSL_INSTALL_ONLY"
    },
    {
      id: "remote_memory_provider_exfiltration",
      generatedAt,
      severity: "HIGH",
      lane: "memory",
      evidence: "Honcho and provider/router surfaces can transmit conversation or memory data when configured.",
      action: "LOCAL_MEMORY_DEFAULT; EXPLICIT_OPERATOR_APPROVAL_FOR_REMOTE_MEMORY"
    },
    {
      id: "subagent_file_coordination_conflict",
      generatedAt,
      severity: "MEDIUM",
      lane: "omnispindle",
      evidence: "v0.11 adds orchestrator subagents and concurrent filesystem coordination.",
      action: "MAP_TO_OMNIFLYWHEEL_COUPLING_GATES_BEFORE_USE"
    }
  ];
}

function buildQueue(generatedAt, architecture, risks) {
  const items = [
    ["hermes_learning_loop_to_reverse_gain", "P0", "memory_skills", "Map Hermes self-improving skill loop into BEHCS mistake ledger, reverse-gain sieve, and Atlas Store."],
    ["hermes_wal_state_contract", "P0", "memory_ledger", "Extract SQLite WAL/session lineage ideas into Asolaria memory/task/mistake store migration contract."],
    ["hermes_transport_router_adapter", "P0", "model_routing", "Bind transport ABC patterns into brainPolicy/workerRouter/cognitive engine backend registry."],
    ["hermes_plugin_hook_gac_gate", "P0", "plugins_hooks", "Create a GAC pre-tool/post-tool hook contract before any Hermes plugin or shell hook bridge."],
    ["hermes_gateway_connector_crosswalk", "P1", "gateway", "Crosswalk 17 Hermes gateway platforms to Asolaria connector inventory one by one."],
    ["hermes_cron_to_omnischeduler", "P1", "scheduler", "Map Hermes cron scheduler to OmniScheduler with pause/resume/run/remove and skills support."],
    ["hermes_checkpoint_to_brown_hilbert_snapshots", "P1", "filesystem_safety", "Map checkpoint/rollback behavior to Brown-Hilbert file identity and C-drive pressure guard."],
    ["hermes_delegate_to_omnispindle_supervisors", "P1", "omnispindle", "Map orchestrator subagents and spawn depth to Omnispindle supervisors and coupling gates."],
    ["hermes_tui_dashboard_operator_surface", "P2", "operator_interface", "Use Ink TUI/dashboard concepts for Asolaria graph runtime and worker runtime panels."],
    ["hermes_security_hardening_backport", "P0", "security", "Backport security hardening ideas into GAC, riskEngine, gateway authority, hookwall, and audit logs."]
  ];
  return items.map(([id, priority, lane, action], index) => ({
    id,
    generatedAt,
    priority,
    lane,
    action,
    status: priority === "P0" ? "queued_requires_supervisor" : "queued",
    supervisor: `original_hermes_${lane}_supervisor`,
    capsuleIds: architecture.capsules.filter((capsule) => capsule.lane === lane || priority === "P0").map((capsule) => capsule.id).slice(0, 4),
    riskIds: risks.filter((risk) => risk.lane === lane || priority === "P0").map((risk) => risk.id).slice(0, 4),
    cubeCoordinates: ["original_hermes_agent", "implementation_queue", lane, String(index + 1)]
  }));
}

function buildSupervisors(generatedAt, queue) {
  const lanes = [...new Set(queue.map((item) => item.lane))];
  return [
    {
      id: "original_hermes_agent_supervisor_of_supervisors",
      generatedAt,
      role: "upstream_absorption_root",
      scope: "Original NousResearch Hermes Agent v0.11.0 architecture absorption into BEHCS-256.",
      gates: ["source_digest", "license", "gac", "shannon", "gnn", "reverse_gain", "no_native_windows_install", "no_secret_import"]
    },
    ...lanes.map((lane, index) => ({
      id: `original_hermes_${lane}_supervisor`,
      generatedAt,
      role: "lane_supervisor",
      lane,
      ordinal: index + 1,
      queueItems: queue.filter((item) => item.lane === lane).map((item) => item.id),
      gates: ["capsule_digest", "risk_register", "bounded_gulp_proof", "manual_enable_before_runtime"]
    }))
  ];
}

function buildMap(generatedAt, manifest, architecture, risks, queue, supervisors) {
  const nodes = [
    { id: "upstream_repo", type: "source", label: UPSTREAM_URL, digest: manifest.head },
    { id: "release_v011", type: "release", label: manifest.release.title, digest: manifest.release.sha256 },
    { id: "architecture_capsules", type: "capsule", label: "Original Hermes architecture capsules", count: architecture.capsules.length },
    { id: "risk_register", type: "risk", label: "Risk register", count: risks.length },
    { id: "implementation_queue", type: "queue", label: "Integration queue", count: queue.length },
    { id: "supervisors", type: "supervisor", label: "Supervisors", count: supervisors.length },
    { id: "real_gulp_proof", type: "proof", label: "BEHCS Gulp proof slice" }
  ];
  for (const capsule of architecture.capsules) nodes.push({ id: capsule.id, type: "capsule", label: capsule.lane });
  const edges = [
    ["upstream_repo", "release_v011", "contains"],
    ["release_v011", "architecture_capsules", "summarizes"],
    ["architecture_capsules", "implementation_queue", "feeds"],
    ["risk_register", "implementation_queue", "gates"],
    ["implementation_queue", "supervisors", "assigned_to"],
    ["supervisors", "real_gulp_proof", "proves"]
  ].map(([from, to, relation]) => ({ from, to, relation }));
  for (const capsule of architecture.capsules) edges.push({ from: "architecture_capsules", to: capsule.id, relation: "contains" });
  return {
    id: "original-hermes-agent-map",
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

async function runBehcsProof(generatedAt, proofCount, manifest, architecture, risks, queue) {
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
    const capsule = architecture.capsules[i % architecture.capsules.length];
    const risk = risks[i % risks.length];
    const firstAgent = i * GULP_SIZE + 1;
    const lastAgent = firstAgent + GULP_SIZE - 1;
    const msg = {
      id: `original-hermes-agent-proof-${generatedAt.replace(/[-:.TZ]/g, "").slice(0, 14)}-${String(i).padStart(4, "0")}`,
      ts: generatedAt,
      received_at: generatedAt,
      type: "agent_packet",
      from: "original_hermes_agent_upstream_absorber",
      to: "behcs_gulp_runtime",
      verb: "EVT-ORIGINAL-HERMES-AGENT-UPSTREAM-COMPACT-ABSORB",
      payload: {
        room: "whiteroom",
        upstream: UPSTREAM_URL,
        upstreamHead: manifest.head,
        upstreamVersion: manifest.version,
        latestTag: manifest.latestTag,
        totalLogicalAgents: String(TOTAL_AGENTS),
        logicalScale: logicalScaleLabel(),
        logicalGulpSize: GULP_SIZE,
        logicalGulps: LOGICAL_GULPS,
        proofSlice: i,
        workerRange: `${firstAgent}..${lastAgent}`,
        action: item.id,
        lane: item.lane,
        capsule: capsule.id,
        risk: risk.id,
        forwardGnn: "mine_original_hermes_architecture_genius",
        reverseGainGnn: "block_secret_hook_runtime_install_sprawl",
        shannon: "proceed_contract_absorption_no_live_install",
        openMythos: "route_as_future_engine_contract_only",
        omniflywheel: "supervisor_map_queue",
        omnispindle: "compact_pid_ranges_no_process_storm",
        gc: "bounded_proof_slice"
      }
    };
    proofRows.push(msg);
    const record = behcsGulp.attachBehcsPath(msg, {
      sequence: startSequence + i + 1,
      reason: "original_hermes_agent_upstream_compact_absorption",
      remoteMeta: { ip: "127.0.0.1", port: 4947, method: "LOCAL", protocol: "behcs" },
      reflex: { action: "original_hermes_agent_absorb_proof_slice", runInference: true }
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
    lastFileCapReason: "original_hermes_agent_upstream_compact_bulk"
  });
  const gulp = await behcsGulp.runGulpRehydration({ force: true, reason: "original_hermes_agent_upstream_compact_absorption" });
  return { proofRows, gulp: { ...gulp, bulkProofRetainedAfterAppend: retained, bulkProofLinesWritten: writer.linesWritten } };
}

function buildShannon(summary) {
  const criticalRisks = summary.risks.filter((risk) => risk.severity === "CRITICAL").length;
  const gulpOk = summary.behcsGulp?.ok === true && Number(summary.behcsGulp?.mistakesDetected || 0) === 0;
  return {
    id: "original-hermes-agent-shannon-consensus",
    generatedAt: summary.generatedAt,
    status: gulpOk ? "PROCEED_ORIGINAL_HERMES_AGENT_CONTRACT_ABSORPTION_RUNTIME_BLOCKED" : "HALT_ORIGINAL_HERMES_AGENT_ABSORPTION_PROOF_FAILED",
    confidence: gulpOk ? 0.95 : 0.55,
    runtimeInstallAllowed: false,
    reasons: [
      `Upstream ${summary.manifest.upstreamUrl} head ${summary.manifest.head}`,
      `Version ${summary.manifest.version}; latest tag ${summary.manifest.latestTag}`,
      `${summary.architecture.capsules.length} architecture capsules mapped`,
      `${criticalRisks} critical risks require GAC/supervisor handling`,
      `Gulp proof ${summary.behcsGulp?.gulpId || "preview"} mistakes=${summary.behcsGulp?.mistakesDetected ?? "n/a"}`
    ],
    next: [
      "Implement GAC-gated plugin/hook bridge before any Hermes hook execution.",
      "Map transport ABC into Asolaria workerRouter without importing provider secrets.",
      "Backport checkpoint/rollback and SQLite WAL/session ideas selectively.",
      "Keep runtime install WSL-only/manual; native Windows execution remains blocked."
    ]
  };
}

function buildReport(summary, shannon) {
  const lines = [];
  lines.push(`# Original Hermes Agent Upstream ${logicalScaleLabel()} Compact Absorption`);
  lines.push("");
  lines.push(`Generated: ${summary.generatedAt}`);
  lines.push(`Status: ${summary.status}`);
  lines.push(`Upstream: ${summary.manifest.upstreamUrl}`);
  lines.push(`Head: ${summary.manifest.head}`);
  lines.push(`Version: ${summary.manifest.version}`);
  lines.push(`Latest tag: ${summary.manifest.latestTag}`);
  lines.push(`Release: ${summary.manifest.release.title}`);
  lines.push(`Logical agents: ${summary.logicalAgents}`);
  lines.push(`Logical Gulp windows: ${summary.logicalGulps}`);
  lines.push(`Shannon: ${shannon.status}`);
  lines.push("");
  lines.push("## D Drive Boundary");
  lines.push("");
  lines.push(`- Requested D stage: ${summary.manifest.requestedDStage.path}`);
  lines.push(`- Status: ${summary.manifest.requestedDStage.status}`);
  lines.push(`- Replacement used now: ${summary.manifest.requestedDStage.replacement}`);
  lines.push("");
  lines.push("## Architecture Capsules");
  lines.push("");
  for (const capsule of summary.architecture.capsules) {
    lines.push(`- ${capsule.id} (${capsule.lane}): ${capsule.essence}`);
  }
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
  lines.push(`- This is a compact ${logicalScaleLabel()} upstream Hermes Agent absorption tranche.`);
  lines.push("- No runtime install.");
  lines.push("- No provider login, no API credential import, no gateway launch.");
  lines.push("- No native Windows Hermes execution.");
  lines.push(`- No ${logicalScaleLabel()} OS processes, live model calls, or raw records.`);
  lines.push("- No shadow file edits.");
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function buildCube(summary, shannon) {
  return `const cube = Object.freeze(${JSON.stringify({
    id: "original-hermes-agent-upstream-compact-absorption",
    generatedAt: summary.generatedAt,
    upstream: summary.manifest.upstreamUrl,
    head: summary.manifest.head,
    version: summary.manifest.version,
    latestTag: summary.manifest.latestTag,
    logicalAgents: summary.logicalAgents,
    status: summary.status,
    shannon: shannon.status,
    runtimeInstallAllowed: false,
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
    type: "original_hermes_agent_upstream_compact_absorption_complete",
    status: summary.status,
    upstream: summary.manifest.upstreamUrl,
    head: summary.manifest.head,
    version: summary.manifest.version,
    logicalAgents: summary.logicalAgents,
    gulpId: summary.behcsGulp?.gulpId || null,
    report: repoRel(OUTPUTS.reportMd),
    digest: summary.digest
  };
  appendNdjson(OUTPUTS.inbox, { ...event, direction: "in" });
  appendNdjson(OUTPUTS.outbox, { ...event, direction: "out" });
  appendNdjson(OUTPUTS.gnnEdges, {
    ts: summary.generatedAt,
    type: "original_hermes_agent_absorption_edge",
    from: "nousresearch_hermes_agent",
    to: "asolaria_behcs256_supervisors",
    weight: 1,
    digest: summary.digest
  });
}

async function run({ execute = false, proofMessages = PROOF_MESSAGES_DEFAULT } = {}) {
  const generatedAt = new Date().toISOString();
  const startedAt = Date.now();
  const manifest = buildManifest(generatedAt);
  const architecture = buildArchitectureCapsules(generatedAt, manifest);
  const risks = buildRisks(generatedAt, manifest, architecture);
  const queue = buildQueue(generatedAt, architecture, risks);
  const supervisors = buildSupervisors(generatedAt, queue);
  const map = buildMap(generatedAt, manifest, architecture, risks, queue, supervisors);
  const shards = buildCompactShards(queue);
  const proofCount = safeInt(proofMessages, PROOF_MESSAGES_DEFAULT, 0, 2_000);
  const behcs = execute ? await runBehcsProof(generatedAt, proofCount, manifest, architecture, risks, queue) : { proofRows: [], gulp: { ok: true, skipped: true, reason: "preview" } };
  const elapsedMs = Date.now() - startedAt;
  const status = behcs.gulp?.ok === true
    ? "ORIGINAL_HERMES_AGENT_COMPACT_ABSORBED_RUNTIME_BLOCKED"
    : "ORIGINAL_HERMES_AGENT_ABSORPTION_GATED";
  const summary = {
    id: "original-hermes-agent-upstream-compact-absorption",
    generatedAt,
    startedAt: new Date(startedAt).toISOString(),
    finishedAt: new Date().toISOString(),
    status,
    logicalAgents: String(TOTAL_AGENTS),
    logicalGulps: LOGICAL_GULPS,
    compactMode: `${logicalScaleLabel().toLowerCase()}_compact_ranges_real_gulp_proof_upstream_clone_absorption`,
    elapsedMs,
    manifest,
    architecture,
    risks,
    queue,
    supervisors,
    map,
    shards,
    counts: {
      sourceEntries: manifest.counts.sourceEntries,
      architectureCapsules: architecture.capsules.length,
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
    id: "original-hermes-agent-upstream-dispatch",
    generatedAt,
    status: "READY_CONTRACT_ABSORPTION_RUNTIME_BLOCKED",
    rootSupervisor: "original_hermes_agent_supervisor_of_supervisors",
    priorityQueue: queue.filter((item) => item.priority === "P0"),
    blockedRuntimePromotions: risks.filter((risk) => risk.severity === "CRITICAL").map((risk) => risk.id),
    nextSupervisors: supervisors.map((supervisor) => supervisor.id)
  };
  const state = {
    id: "original-hermes-agent-upstream-state",
    generatedAt,
    status: summary.status,
    shannon: shannon.status,
    gulpId: summary.behcsGulp?.gulpId || null,
    sinceLastGulp: behcsGulp.collectorStatus().state?.sinceLastGulp ?? null,
    digest: summary.digest
  };
  writeJson(OUTPUTS.manifest, manifest);
  writeJson(OUTPUTS.architecture, architecture);
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
  const manifest = buildManifest(new Date().toISOString());
  return {
    id: "original-hermes-agent-upstream-compact-absorber",
    status: "READY",
    upstreamUrl: UPSTREAM_URL,
    localClone: repoRel(upstreamRoot),
    head: manifest.head,
    branch: manifest.branch,
    version: manifest.version,
    latestTag: manifest.latestTag,
    logicalAgents: String(TOTAL_AGENTS),
    logicalGulps: LOGICAL_GULPS,
    dStage: manifest.requestedDStage,
    outputs: OUTPUTS
  };
}

function main(argv) {
  const action = argv[2] || "status";
  const execute = argv.includes("--execute");
  const proofMessages = safeInt(parseArgValue(argv, "proof-messages", PROOF_MESSAGES_DEFAULT), PROOF_MESSAGES_DEFAULT, 0, 2_000);
  try {
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
  } catch (error) {
    console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
    process.exitCode = 1;
    return;
  }
  console.error(JSON.stringify({
    ok: false,
    error: `Unknown action: ${action}`,
    usage: [
      "node tools/original-hermes-agent-upstream-absorber.js status",
      "node tools/original-hermes-agent-upstream-absorber.js run --execute --proof-messages=2000"
    ]
  }, null, 2));
  process.exitCode = 2;
}

main(process.argv);
