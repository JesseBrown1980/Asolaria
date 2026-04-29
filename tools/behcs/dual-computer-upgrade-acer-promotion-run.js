#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const http = require("http");
const { spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..", "..");
const runId = "dual-computer-upgrade-20260427";
const eventId = "EVT-ACER-LIRIS-DUAL-COMPUTER-UPGRADE-2026-04-27";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", runId);
const promotionRoot = path.join(runRoot, "acer-promotion-run");

const INPUTS = Object.freeze({
  fabric: path.join(runRoot, "dual-computer-upgrade-fabric.v1.json"),
  cascadeIntegration: path.join(runRoot, "dual-computer-upgrade-cascade-integration.v1.json"),
  executorReady: path.join(runRoot, "dual-computer-upgrade-executor-ready.v1.ndjson"),
  executorManifest: path.join(runRoot, "dual-computer-upgrade-executor-ready-manifest.v1.json"),
  supervisorIndex: path.join(repoRoot, "data", "behcs", "pid-fabric", "index", "supervisor-pid-indicator-index-latest.json"),
  systemIndex: path.join(repoRoot, "data", "behcs", "pid-fabric", "index", "system-surface-pid-indicator-index-latest.json"),
  deviceIndex: path.join(repoRoot, "data", "behcs", "pid-fabric", "index", "device-pid-indicator-index-latest.json")
});

const OUTPUTS = Object.freeze({
  health: path.join(promotionRoot, "acer-proof-health-baseline.v1.json"),
  buildPlan: path.join(promotionRoot, "acer-dependency-build-test-plan.v1.json"),
  supervisorSync: path.join(promotionRoot, "acer-supervisor-sync-manifest.v1.json"),
  languageRoute: path.join(promotionRoot, "acer-behcs-language-cube-index-route.v1.json"),
  researchRoute: path.join(promotionRoot, "acer-openclaw-openmythos-integration-route.v1.json"),
  gnnEdges: path.join(promotionRoot, "acer-gnn-omnishannon-reverse-gain-edges.v1.ndjson"),
  mcpPolicy: path.join(promotionRoot, "acer-mcp-agent-profile-policy.v1.json"),
  cleanupPlan: path.join(promotionRoot, "acer-dirty-worktree-cleanup-plan.v1.json"),
  energyGate: path.join(promotionRoot, "acer-energy-open-code-gate.v1.json"),
  significance: path.join(promotionRoot, "acer-gc-white-room-significance.v1.json"),
  summary: path.join(promotionRoot, "dual-computer-upgrade-acer-promotion-summary.v1.json"),
  envelope: path.join(promotionRoot, "dual-computer-upgrade-acer-promotion-summary-envelope.json"),
  postResult: path.join(promotionRoot, "dual-computer-upgrade-acer-promotion-summary-post-result.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "dual-computer-upgrade-acer-promotion-run.v1.json"),
  index: path.join(repoRoot, "data", "behcs", "index", "dual-computer-upgrade-acer-promotion-run-index.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "dual-computer-upgrade-acer-promotion-run-map-map-mapped.v1.json"),
  cube: path.join(repoRoot, "data", "behcs", "cubes", "dual-computer-upgrade-acer-promotion-run-cube-cubed.cube.js"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "dual-computer-upgrade-acer-promotion-run-behcs256.glpj.json"),
  reportJson: path.join(repoRoot, "reports", "dual-computer-upgrade-acer-promotion-run-latest.json"),
  reportMd: path.join(repoRoot, "reports", "dual-computer-upgrade-acer-promotion-run-latest.md")
});

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeText(filePath, text) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, text.endsWith("\n") ? text : `${text}\n`, "utf8");
}

function writeJson(filePath, value) {
  writeText(filePath, JSON.stringify(value, null, 2));
}

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_error) {
    return fallback;
  }
}

function readNdjson(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, "utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
}

function repoRel(filePath) {
  const relative = path.relative(repoRoot, filePath);
  if (path.isAbsolute(relative) || relative.startsWith("..")) return filePath.replace(/\\/g, "/");
  return relative.replace(/\\/g, "/");
}

function hash(value) {
  return crypto.createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex");
}

function topRecords(index, predicate, limit) {
  return (index.records || []).filter(predicate).slice(0, limit).map((row) => ({
    pid: row.pid,
    label: row.label,
    category: row.category,
    pidKind: row.pidKind,
    evidenceLevel: row.evidenceLevel
  }));
}

function runGitStatus() {
  const result = spawnSync("git", ["status", "--short", "--untracked-files=all"], {
    cwd: repoRoot,
    encoding: "utf8",
    timeout: 15000,
    windowsHide: true
  });
  const output = `${result.stdout || ""}${result.stderr || ""}`;
  const lines = output.split(/\r?\n/).filter(Boolean);
  return {
    ok: result.status === 0,
    exitCode: result.status,
    lineCount: lines.length,
    sample: lines.slice(0, 120)
  };
}

function httpJson(method, url, body = null, timeoutMs = 7000) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const payload = body ? Buffer.from(JSON.stringify(body), "utf8") : null;
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path: `${parsed.pathname}${parsed.search}`,
      method,
      headers: payload ? {
        "content-type": "application/json",
        "content-length": payload.length,
        connection: "close"
      } : { connection: "close" },
      timeout: timeoutMs
    }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        let responseBody = text;
        try {
          responseBody = JSON.parse(text);
        } catch (_error) {
          // Keep raw text.
        }
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode, body: responseBody });
      });
    });
    req.on("timeout", () => req.destroy(new Error("request_timeout")));
    req.on("error", (error) => resolve({ ok: false, error: error.message }));
    if (payload) req.write(payload);
    req.end();
  });
}

async function run() {
  const generatedAt = new Date().toISOString();
  const fabric = readJson(INPUTS.fabric, {});
  const cascade = readJson(INPUTS.cascadeIntegration, {});
  const executorRows = readNdjson(INPUTS.executorReady);
  const executorManifest = readJson(INPUTS.executorManifest, {});
  const supervisorIndex = readJson(INPUTS.supervisorIndex, { records: [] });
  const systemIndex = readJson(INPUTS.systemIndex, { records: [] });
  const deviceIndex = readJson(INPUTS.deviceIndex, { records: [] });
  const acerRows = executorRows.filter((row) => row.computer === "acer" && row.promotionAllowed);
  const lirisRows = executorRows.filter((row) => row.computer === "liris");
  const proceed = cascade.status === "DUAL_COMPUTER_UPGRADE_CASCADED_READY_PLANNING_ONLY"
    && cascade.verdictCounts?.PROCEED === executorRows.length
    && executorManifest.status === "DUAL_COMPUTER_UPGRADE_EXECUTOR_READY_SPLIT_EMITTED"
    && acerRows.length === 10;
  if (!proceed) {
    throw new Error("Dual-computer upgrade is not in an Acer-local promotion-ready state");
  }

  const healthProbe = await httpJson("GET", "http://127.0.0.1:4781/api/health/fast", null, 2500);
  const gitStatus = runGitStatus();
  const acerComputer = (fabric.computers || []).find((computer) => computer.id === "acer") || {};
  const modelPolicy = fabric.modelPolicy || {};

  const common = {
    generatedAt,
    runId,
    eventId,
    descriptorOnly: true,
    mutationAllowed: false,
    remoteWriteAllowed: false,
    liveModelCalls: 0,
    processFanout: 0
  };

  const health = {
    id: "acer-proof-health-baseline.v1",
    ...common,
    sourceLane: "proof-health-baseline",
    healthProbe,
    cascadeLiveState: cascade.liveState || {},
    acerNode: acerComputer.node || {},
    d11: "PROVEN_LOCAL_ARTIFACT_PROMOTION_WITH_LIVE_HEALTH_PROBE"
  };
  writeJson(OUTPUTS.health, health);

  const buildPlan = {
    id: "acer-dependency-build-test-plan.v1",
    ...common,
    sourceLane: "dependency-build-test",
    testPolicy: "Use existing npm scripts and node --check in small tranches before any source mutation.",
    candidateCommands: [
      "node --check tools/behcs/dual-computer-upgrade-orchestrator.js",
      "node --check tools/behcs/dual-computer-upgrade-cascade-integrator.js",
      "node --check tools/behcs/dual-computer-upgrade-executor-ready.js",
      "node --check tools/behcs/dual-computer-upgrade-acer-promotion-run.js"
    ],
    dependencyMutationAllowed: false,
    installAllowed: false
  };
  writeJson(OUTPUTS.buildPlan, buildPlan);

  const supervisorSync = {
    id: "acer-supervisor-sync-manifest.v1",
    ...common,
    sourceLane: "supervisor-sync",
    acerTasks: acerRows.map((row) => ({
      readyPid: row.readyPid,
      sourceTaskPid: row.sourceTaskPid,
      lane: row.lane,
      supervisorPid: row.supervisorPid,
      supervisorId: row.supervisorId,
      gate: row.gate
    })),
    supervisorsObserved: topRecords(supervisorIndex, (row) => Boolean(row.pid), 64)
  };
  writeJson(OUTPUTS.supervisorSync, supervisorSync);

  const languageRoute = {
    id: "acer-behcs-language-cube-index-route.v1",
    ...common,
    sourceLane: "behcs-language-cube-index",
    routes: [
      repoRel(OUTPUTS.memory),
      repoRel(OUTPUTS.index),
      repoRel(OUTPUTS.map),
      repoRel(OUTPUTS.cube),
      repoRel(OUTPUTS.glpj)
    ],
    existingSurfaceSamples: topRecords(systemIndex, (row) => ["cube", "behcs", "token_reduction"].includes(row.pidKind), 48)
  };
  writeJson(OUTPUTS.languageRoute, languageRoute);

  const researchRoute = {
    id: "acer-openclaw-openmythos-integration-route.v1",
    ...common,
    sourceLane: "openclaw-openmythos-integration",
    researchSurfaces: ["OpenClaw 4.24", "OpenMythos", "MLC", "Gemma4", "BEHCS-256"],
    integrationPolicy: "Compare and ingest through descriptor diffs, supervisors, GNN/OmniShannon, and GC before source edits.",
    requiredEvidenceBeforeLiveModelUse: [
      "local/free model executable installed",
      "model terms and credential state compatible",
      "small-tranche smoke result captured",
      "supervisor gate permits task class"
    ]
  };
  writeJson(OUTPUTS.researchRoute, researchRoute);

  const edgeRows = acerRows.flatMap((row) => ([
    {
      kind: "dual_computer_upgrade_gnn_edge",
      ts: generatedAt,
      from: row.readyPid,
      to: row.supervisorPid,
      relation: "supervised_by",
      lane: row.lane,
      side: "acer",
      weight: 0.86,
      descriptorOnly: true
    },
    {
      kind: "dual_computer_upgrade_reverse_gain_edge",
      ts: generatedAt,
      from: row.supervisorPid,
      to: row.readyPid,
      relation: "mistake_review_returns_to_task",
      lane: row.lane,
      side: "acer",
      weight: 0.79,
      descriptorOnly: true
    }
  ]));
  writeText(OUTPUTS.gnnEdges, edgeRows.map((row) => JSON.stringify(row)).join("\n"));

  const mcpPolicy = {
    id: "acer-mcp-agent-profile-policy.v1",
    ...common,
    sourceLane: "mcp-agent-profile-policy",
    policy: "Prefer Asolaria BEHCS-256 local MCP/tool surfaces. External MCP/tool calls require explicit configured connector evidence and supervisor approval.",
    appliesTo: ["codex", "claude", "gemini", "deepseek", "opencode"],
    externalMcpDefault: "hold_without_configured_asolaria_adapter",
    secretHandling: "no secret echo; vault-key references only"
  };
  writeJson(OUTPUTS.mcpPolicy, mcpPolicy);

  const cleanupPlan = {
    id: "acer-dirty-worktree-cleanup-plan.v1",
    ...common,
    sourceLane: "dirty-worktree-cleanup",
    gitStatus,
    cleanupPolicy: "Classify first, preserve user changes, avoid git reset/checkout, and route source edits through targeted review.",
    proposedClasses: ["our-generated-artifacts", "user-existing-work", "shadow-language-artifacts", "build-output", "sensitive-or-vault-adjacent"],
    destructiveCleanupAllowed: false
  };
  writeJson(OUTPUTS.cleanupPlan, cleanupPlan);

  const energyGate = {
    id: "acer-energy-open-code-gate.v1",
    ...common,
    sourceLane: "energy-scheduler-open-code",
    modelPolicy,
    openCodeUseState: "descriptor_ready_evidence_required",
    energyPolicy: "Small local/free tranches only after evidence; no subscription/auth/payment bypass; no header/banner bypass claims.",
    logicalRunsRepresented: acerRows.reduce((sum, row) => sum + row.logicalRuns, 0),
    logicalBatchesRepresented: acerRows.reduce((sum, row) => sum + row.logicalBatches, 0)
  };
  writeJson(OUTPUTS.energyGate, energyGate);

  const significance = {
    id: "acer-gc-white-room-significance.v1",
    ...common,
    sourceLane: "gc-white-room-significance",
    eventSignificance: [
      "Acer and Liris are now handled as a sealed dual-computer upgrade fabric, not loose chat state.",
      "The 20B request is captured as logical Big Pickle coverage: 10B per machine, 20 supervised lanes, zero uncontrolled fanout.",
      "Acer can promote its local proof artifacts now; Liris retains peer-owned execution authority over its lanes.",
      "OpenCode/free model use is integrated as a gated capability, not assumed live compute."
    ],
    whiteRoomCorrections: [
      "Do not equate executor-ready with executed.",
      "Do not equate logical runs with OS processes or live model sessions.",
      "Do not mutate Liris from Acer; use LAW-001 envelopes and peer confirmation."
    ]
  };
  writeJson(OUTPUTS.significance, significance);

  const produced = [
    OUTPUTS.health,
    OUTPUTS.buildPlan,
    OUTPUTS.supervisorSync,
    OUTPUTS.languageRoute,
    OUTPUTS.researchRoute,
    OUTPUTS.gnnEdges,
    OUTPUTS.mcpPolicy,
    OUTPUTS.cleanupPlan,
    OUTPUTS.energyGate,
    OUTPUTS.significance
  ];
  const summary = {
    id: "dual-computer-upgrade-acer-promotion-summary.v1",
    generatedAt,
    runId,
    eventId,
    status: "DUAL_COMPUTER_UPGRADE_ACER_LOCAL_PROMOTION_ARTIFACTS_COMPLETE",
    acerTasksPromoted: acerRows.length,
    lirisTasksHeldForPeerConfirmation: lirisRows.length,
    totalLogicalRunsRepresented: acerRows.reduce((sum, row) => sum + row.logicalRuns, 0),
    localArtifactsProduced: produced.length,
    liveModelCalls: 0,
    processFanout: 0,
    executorDispatchesPerformed: 0,
    remoteWritesPerformed: 0,
    producedArtifacts: produced.map(repoRel),
    artifactHash: hash(produced.map((filePath) => fs.readFileSync(filePath, "utf8")).join("\n")),
    boundary: "Acer local artifact promotion only. Liris lanes remain peer-owned. No remote writes, no model calls, no process fanout."
  };
  writeJson(OUTPUTS.summary, summary);

  writeJson(OUTPUTS.memory, {
    type: "behcs-memory",
    id: "memory-dual-computer-upgrade-acer-promotion-run-v1",
    generatedAt,
    runId,
    eventId,
    status: summary.status,
    summary: "Acer promoted its ten dual-computer upgrade lanes into local artifacts while holding Liris lanes for peer-owned confirmation.",
    source: repoRel(OUTPUTS.summary)
  });
  writeJson(OUTPUTS.index, {
    id: "dual-computer-upgrade-acer-promotion-run-index-v1",
    generatedAt,
    keys: ["dual-computer-upgrade", "acer-local-promotion", "liris-handoff", "10b-logical", "no-fanout"],
    artifacts: {
      summary: repoRel(OUTPUTS.summary),
      report: repoRel(OUTPUTS.reportMd),
      map: repoRel(OUTPUTS.map),
      cube: repoRel(OUTPUTS.cube),
      glpj: repoRel(OUTPUTS.glpj)
    }
  });
  writeJson(OUTPUTS.map, {
    id: "dual-computer-upgrade-acer-promotion-run-map-map-mapped-v1",
    generatedAt,
    route: ["20-proceed-cascade", "executor-ready-split", "acer-local-promotion", "liris-peer-handoff-remains-held"],
    artifacts: summary.producedArtifacts,
    acerLanes: acerRows.map((row) => row.lane),
    lirisLanesHeld: lirisRows.map((row) => row.lane)
  });
  const cubeObject = {
    id: "dual-computer-upgrade-acer-promotion-run-cube-cubed-v1",
    generatedAt,
    runId,
    eventId,
    status: summary.status,
    acerTasksPromoted: summary.acerTasksPromoted,
    lirisTasksHeldForPeerConfirmation: summary.lirisTasksHeldForPeerConfirmation,
    totalLogicalRunsRepresented: summary.totalLogicalRunsRepresented,
    localArtifactsProduced: summary.localArtifactsProduced,
    liveModelCalls: 0,
    processFanout: 0,
    remoteWritesPerformed: 0
  };
  writeText(OUTPUTS.cube, `const dualComputerUpgradeAcerPromotionRunCube = Object.freeze(${JSON.stringify(cubeObject, null, 2)});

export const CUBE = dualComputerUpgradeAcerPromotionRunCube;
export default dualComputerUpgradeAcerPromotionRunCube;
`);
  writeJson(OUTPUTS.glpj, {
    id: "dual-computer-upgrade-acer-promotion-run-behcs256-glpj-v1",
    generatedAt,
    sentences: [
      "META-PROMOTION { DUAL-COMPUTER-UPGRADE.ACER } · LOCAL-ARTIFACTS-COMPLETE · TEN-LANES · TEN-BILLION-LOGICAL @ M-EYEWITNESS .",
      "META-HOLD { DUAL-COMPUTER-UPGRADE.LIRIS } · PEER-OWNED · CONFIRMATION-REQUIRED · NO-REMOTE-WRITE @ M-IMPERATIVE .",
      "META-GATE { OPEN-CODE-FREE-MODELS } · EVIDENCE-REQUIRED · LIVE-CALLS-0 · FANOUT-0 @ M-INDICATIVE ."
    ]
  });

  const envelope = {
    verb: "dual-computer-upgrade-acer-promotion-summary",
    target: "liris",
    from: "acer-codex",
    id: "dual-computer-upgrade-2026-04-27-acer-local-promotion-summary-001",
    ts: generatedAt,
    runId,
    eventId,
    status: summary.status,
    acerTasksPromoted: summary.acerTasksPromoted,
    lirisTasksHeldForPeerConfirmation: summary.lirisTasksHeldForPeerConfirmation,
    totalLogicalRunsRepresented: summary.totalLogicalRunsRepresented,
    liveModelCalls: 0,
    processFanout: 0,
    remoteWritesPerformed: 0,
    artifacts: {
      summary: repoRel(OUTPUTS.summary),
      report: repoRel(OUTPUTS.reportMd)
    },
    glyph_sentence: "META-PROMOTION { DUAL-COMPUTER-UPGRADE.ACER } · LOCAL-COMPLETE · LIRIS-PEER-HOLD · LIVE-MODELS-0 @ M-INDICATIVE .",
    boundary: summary.boundary
  };
  writeJson(OUTPUTS.envelope, envelope);
  const postResult = await httpJson("POST", "http://192.168.100.2:4947/behcs/send", envelope);
  writeJson(OUTPUTS.postResult, { postedAt: new Date().toISOString(), endpoint: "http://192.168.100.2:4947/behcs/send", ...postResult });

  const report = { reportId: "dual-computer-upgrade-acer-promotion-run-latest", generatedAt, summary, postResult };
  writeJson(OUTPUTS.reportJson, report);
  writeText(OUTPUTS.reportMd, `# Dual Computer Upgrade Acer Promotion Run

Generated: ${generatedAt}

Status: ${summary.status}

Promoted:
- Acer lanes: ${summary.acerTasksPromoted}
- Liris lanes held for peer confirmation: ${summary.lirisTasksHeldForPeerConfirmation}
- Acer logical runs represented: ${summary.totalLogicalRunsRepresented}
- local artifacts: ${summary.localArtifactsProduced}
- live model calls: 0
- process fanout: 0
- remote writes: 0

Artifacts:
${summary.producedArtifacts.map((artifact) => `- ${artifact}`).join("\n")}

Liris summary posted: ${postResult.ok}

Boundary: ${summary.boundary}
`);

  console.log(JSON.stringify({
    ok: true,
    status: summary.status,
    acerTasksPromoted: summary.acerTasksPromoted,
    lirisTasksHeldForPeerConfirmation: summary.lirisTasksHeldForPeerConfirmation,
    totalLogicalRunsRepresented: summary.totalLogicalRunsRepresented,
    localArtifactsProduced: summary.localArtifactsProduced,
    lirisSummaryPosted: postResult.ok,
    report: repoRel(OUTPUTS.reportMd)
  }, null, 2));
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
