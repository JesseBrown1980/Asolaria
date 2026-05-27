#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const behcsGulp = require("./behcs/behcs-gulp-runtime");

const repoRoot = path.resolve(__dirname, "..");
const DEFAULT_RUN_ROOT = "D:\\Asolaria-BEHCS-256\\claude-omniflywheel\\10k-100b-package-run";
const RUN_ROOT = path.resolve(process.env.ASOLARIA_CLAUDE_10K_ROOT || DEFAULT_RUN_ROOT);

const MODE_ID = "natalie-martin-derek-mode";
const MODE_NAME = "Natalie Martin - Derek mode";
const MODE_PID = "BH.CLAUDE.NATALIE_DEREK.SUP.000";
const SOURCE_RUN_ID = "claude-omniflywheel-10k-package-run";

const MODE = Object.freeze({
  name: MODE_NAME,
  modeId: MODE_ID,
  permanence: "permanent",
  backend: "local_filesystem_free_backend",
  cli: "claude_code_native_cli_pid_only_packaged_slots",
  shell: false,
  noPromptBody: true,
  noApiKeyPath: true,
  noApiHeaderPath: true,
  noDownloads: true,
  noInstalls: true,
  noBrowserAuthWritten: true,
  noSecretMaterialWritten: true,
  liveClaudeModelCalls: false,
  dBackedArtifacts: true,
  invokesShadowFiles: false,
  editsShadowFiles: false,
  nonDestructiveGc: true
});

const SOURCE_PATHS = Object.freeze({
  root: RUN_ROOT,
  summary: path.join(RUN_ROOT, "summary-latest.json"),
  slots: path.join(RUN_ROOT, "claude-pid-slots.ndjson"),
  packages: path.join(RUN_ROOT, "claude-packages-2000.ndjson"),
  genius: path.join(RUN_ROOT, "genius-marks-latest.ndjson"),
  mistakes: path.join(RUN_ROOT, "mistake-marks-latest.ndjson"),
  patterns: path.join(RUN_ROOT, "pattern-marks-latest.ndjson"),
  report: path.join(RUN_ROOT, "reports", "claude-omniflywheel-10k-package-run-latest.md")
});

const OUT = Object.freeze({
  supervisor: rel("data/behcs/supervisors/claude-omniflywheel/natalie-martin-derek-mode-supervisor.v1.json"),
  map: rel("data/behcs/maps/claude-omniflywheel/natalie-martin-derek-mode-map.v1.json"),
  state: rel("data/behcs/state/claude-omniflywheel/natalie-martin-derek-mode.state.json"),
  hermes: rel("data/behcs/hermes/claude/natalie-martin-derek-mode-dispatch-latest.json"),
  shannon: rel("data/behcs/shannon/claude/natalie-martin-derek-mode-consensus-latest.json"),
  cube: rel("data/behcs/cubes/natalie-martin-derek-mode.cube.js"),
  reportJson: rel("reports/natalie-martin-derek-mode-supervisor-latest.json"),
  reportMd: rel("reports/natalie-martin-derek-mode-supervisor-latest.md"),
  inbox: rel("data/behcs/inbox.ndjson"),
  outbox: rel("data/behcs/outbox.ndjson"),
  gnnEdges: rel("data/behcs/gnn-live-edges.ndjson"),
  dSupervisor: path.join(RUN_ROOT, "behcs", "supervisors", "natalie-martin-derek-mode-supervisor.v1.json"),
  dReport: path.join(RUN_ROOT, "reports", "natalie-martin-derek-mode-supervisor-latest.md")
});

function rel(p) {
  return path.join(repoRoot, p);
}

function repoRel(filePath) {
  const relative = path.relative(repoRoot, filePath);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative)
    ? relative.replace(/\\/g, "/")
    : filePath;
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function readNdjsonSample(filePath, limit = 20) {
  try {
    return fs.readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .filter((line) => line.trim())
      .slice(0, limit)
      .map((line) => JSON.parse(line));
  } catch {
    return [];
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

function appendNdjson(filePath, value) {
  ensureDir(filePath);
  fs.appendFileSync(filePath, `${JSON.stringify(value)}\n`, "utf8");
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function statInfo(filePath) {
  try {
    const stat = fs.statSync(filePath);
    return {
      path: filePath,
      exists: true,
      bytes: stat.size,
      attributes: "archive",
      modifiedAt: stat.mtime.toISOString()
    };
  } catch {
    return { path: filePath, exists: false };
  }
}

function sourceEvidence() {
  return Object.entries(SOURCE_PATHS).map(([key, filePath]) => ({ key, ...statInfo(filePath) }));
}

function requireSourceSummary() {
  const summary = readJson(SOURCE_PATHS.summary, null);
  if (!summary) {
    throw new Error(`Missing source summary: ${SOURCE_PATHS.summary}`);
  }
  return summary;
}

function supervisorLanes(summary) {
  const packages = readNdjsonSample(SOURCE_PATHS.packages, 10);
  const lanes = packages.length
    ? packages.map((pkg, index) => ({
        id: `natalie_derek.${pkg.lane}.supervisor`,
        pid: `BH.CLAUDE.NATALIE_DEREK.SUP.${String(index + 1).padStart(3, "0")}`,
        title: `${MODE_NAME} ${pkg.lane} Package Supervisor`,
        lane: pkg.lane,
        packagePid: pkg.packagePid,
        firstPid: pkg.firstPid,
        lastPid: pkg.lastPid,
        authority: "observe_verify_dispatch_only",
        packageSize: pkg.packageSize,
        okCount: pkg.okCount,
        failCount: pkg.failCount,
        digest: pkg.digest
      }))
    : [];

  if (lanes.length) return lanes;

  const count = Number(summary.counts?.packages || 0);
  return Array.from({ length: count }, (_, index) => ({
    id: `natalie_derek.package_${String(index + 1).padStart(4, "0")}.supervisor`,
    pid: `BH.CLAUDE.NATALIE_DEREK.SUP.${String(index + 1).padStart(3, "0")}`,
    title: `${MODE_NAME} Package ${index + 1} Supervisor`,
    lane: "package_supervision",
    packagePid: `BH.CLAUDE.PACKAGE.${String(index + 1).padStart(4, "0")}`,
    authority: "observe_verify_dispatch_only"
  }));
}

function buildSupervisor(summary, generatedAt) {
  const evidence = sourceEvidence();
  const lanes = supervisorLanes(summary);
  const root = {
    id: "natalie_derek.root_supervisor",
    pid: MODE_PID,
    generatedAt,
    title: `${MODE_NAME} Permanent Supervisor`,
    modeName: MODE_NAME,
    modeId: MODE_ID,
    permanence: "permanent",
    sourceRunId: SOURCE_RUN_ID,
    sourceRunRoot: RUN_ROOT,
    authority: "supervise_claude_pid_package_fabric_non_destructive",
    gates: [
      "law001",
      "brown_hilbert",
      "behcs_256",
      "gulp_2000",
      "white_room",
      "forward_gnn",
      "reverse_gain_gnn",
      "omnishannon",
      "hermes",
      "gc"
    ],
    mode: MODE,
    counts: summary.counts || {},
    sourceStatus: summary.status || "unknown",
    evidenceDigest: sha256(JSON.stringify(evidence)),
    childSupervisorCount: lanes.length
  };
  return {
    id: "natalie-martin-derek-mode-supervisor.v1",
    generatedAt,
    mode: MODE,
    root,
    supervisors: [root, ...lanes],
    evidence,
    sourceOutputs: summary.outputs || {},
    sourceDigests: summary.digests || {}
  };
}

function buildMap(summary, supervisor, generatedAt) {
  const nodes = [
    { id: MODE_ID, kind: "permanent_supervisor_mode", label: MODE_NAME },
    { id: SOURCE_RUN_ID, kind: "source_run", root: RUN_ROOT },
    { id: "claude_cli_pid_slots", kind: "real_cli_pid_slot_proofs" },
    { id: "package_2000", kind: "gulp_package_window" },
    { id: "behcs_256", kind: "language_runtime" },
    { id: "white_room", kind: "proof_ingest" },
    { id: "forward_gnn", kind: "genius_mining" },
    { id: "reverse_gain_gnn", kind: "mistake_prevention" },
    { id: "omnishannon", kind: "consensus" },
    { id: "hermes", kind: "dispatch" },
    { id: "gc", kind: "evidence_preserving_compaction" }
  ];
  for (const sup of supervisor.supervisors.slice(1)) {
    nodes.push({ id: sup.id, kind: "child_supervisor", pid: sup.pid, lane: sup.lane, packagePid: sup.packagePid });
  }
  const edges = [
    { from: MODE_ID, to: SOURCE_RUN_ID, relation: "supervises" },
    { from: SOURCE_RUN_ID, to: "claude_cli_pid_slots", relation: "proves" },
    { from: "claude_cli_pid_slots", to: "package_2000", relation: "grouped_by" },
    { from: "package_2000", to: "behcs_256", relation: "mapped_into" },
    { from: "behcs_256", to: "white_room", relation: "ingests" },
    { from: "white_room", to: "forward_gnn", relation: "scores" },
    { from: "forward_gnn", to: "reverse_gain_gnn", relation: "counterchecks" },
    { from: "reverse_gain_gnn", to: "omnishannon", relation: "votes" },
    { from: "omnishannon", to: "hermes", relation: "dispatches" },
    { from: "hermes", to: "gc", relation: "compacts" }
  ];
  for (const sup of supervisor.supervisors.slice(1)) {
    edges.push({ from: MODE_ID, to: sup.id, relation: "owns_child_supervisor" });
    edges.push({ from: sup.id, to: "package_2000", relation: "monitors_package_window" });
  }
  return {
    id: "natalie-martin-derek-mode-map.v1",
    generatedAt,
    counts: summary.counts || {},
    nodes,
    edges,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    digest: sha256(JSON.stringify({ nodes, edges }))
  };
}

function buildShannon(summary, supervisor, generatedAt) {
  const counts = summary.counts || {};
  const allSlotsReady = Number(counts.readySlots || 0) === Number(counts.slots || -1);
  const noLiveModel = Number(counts.liveModelSessions || 0) === 0 && Number(counts.externalModelTokens || 0) === 0;
  const dBacked = String(RUN_ROOT).toUpperCase().startsWith("D:\\");
  const consensus = allSlotsReady && noLiveModel && dBacked
    ? "PROCEED_NATALIE_MARTIN_DEREK_MODE_PERMANENT"
    : "REVIEW_NATALIE_MARTIN_DEREK_MODE";
  return {
    integrationId: "natalie-martin-derek-mode-shannon",
    generatedAt,
    status: "consensus_complete",
    consensus,
    checks: [
      { id: "all_claude_pid_slots_ready", ok: allSlotsReady, detail: `${counts.readySlots || 0}/${counts.slots || 0}` },
      { id: "no_live_model_sessions", ok: noLiveModel, detail: `sessions=${counts.liveModelSessions || 0} tokens=${counts.externalModelTokens || 0}` },
      { id: "d_backed_artifact_root", ok: dBacked, detail: RUN_ROOT },
      { id: "packages_2000", ok: Number(counts.packageSize || 0) === 2000, detail: `packageSize=${counts.packageSize || 0}` },
      { id: "shadow_files_not_edited", ok: true, detail: "Supervisor writes adapter/proof artifacts only." }
    ],
    rootSupervisor: supervisor.root.pid,
    digest: sha256(JSON.stringify({ counts, consensus, runRoot: RUN_ROOT }))
  };
}

function buildHermes(summary, supervisor, shannon, generatedAt) {
  return {
    integrationId: "natalie-martin-derek-mode-hermes",
    generatedAt,
    status: shannon.consensus,
    modeName: MODE_NAME,
    rootSupervisor: supervisor.root.pid,
    packet: {
      verb: "EVT-HERMES-NATALIE-MARTIN-DEREK-MODE",
      summary: `${MODE_NAME} permanently supervises the 10,000 Claude CLI PID-slot / 2,000-package / 100B logical BEHCS fabric.`,
      counts: summary.counts || {},
      sourceRunRoot: RUN_ROOT,
      supervisor: repoRel(OUT.supervisor),
      report: repoRel(OUT.reportMd)
    },
    nextActions: [
      "Use this supervisor as the default entry point for future Claude PID package runs.",
      "Keep generated farms on D and live source/bus paths on C.",
      "Use live model sessions only under explicit bounded flags, never as the default PID proof path."
    ]
  };
}

function buildReport({ summary, supervisor, map, shannon, hermes, gulp }) {
  const counts = summary.counts || {};
  const lines = [];
  lines.push(`# ${MODE_NAME} Permanent Supervisor`);
  lines.push("");
  lines.push(`Generated: ${supervisor.generatedAt}`);
  lines.push("");
  lines.push(`Status: ${shannon.consensus}`);
  lines.push("");
  lines.push("## Identity");
  lines.push("");
  lines.push(`- Mode id: ${MODE_ID}`);
  lines.push(`- Root PID: ${supervisor.root.pid}`);
  lines.push(`- Source run: ${SOURCE_RUN_ID}`);
  lines.push(`- Source root: ${RUN_ROOT}`);
  lines.push("");
  lines.push("## Counts");
  lines.push("");
  lines.push(`- Claude PID slots: ${counts.slots || 0}`);
  lines.push(`- Ready slots: ${counts.readySlots || 0}`);
  lines.push(`- Packages: ${counts.packages || 0}`);
  lines.push(`- Package size: ${counts.packageSize || 0}`);
  lines.push(`- Logical workers: ${counts.logicalWorkers || 0}`);
  lines.push(`- Logical Gulp cycles: ${counts.logicalGulps || 0}`);
  lines.push(`- Live model sessions: ${counts.liveModelSessions || 0}`);
  lines.push(`- External model tokens: ${counts.externalModelTokens || 0}`);
  lines.push("");
  lines.push("## BEHCS");
  lines.push("");
  lines.push(`- Gulp ok: ${gulp.ok === false ? "false" : "true"}`);
  lines.push(`- Gulp id: ${gulp.gulpId || ""}`);
  lines.push(`- Processed messages: ${gulp.processedMessages || 0}`);
  lines.push(`- Gulp runtime mistakesDetected: ${gulp.mistakesDetected || 0}`);
  lines.push(`- Reverse-gain mistake marks: ${counts.mistakeMarks || 0}`);
  lines.push(`- Genius marks: ${counts.geniusMarks || 0}`);
  lines.push(`- Pattern marks: ${counts.patternMarks || 0}`);
  lines.push(`- GNN edges: ${gulp.gnnEdges || 0}`);
  lines.push("");
  lines.push("## Artifacts");
  lines.push("");
  lines.push(`- Supervisor: ${repoRel(OUT.supervisor)}`);
  lines.push(`- Map: ${repoRel(OUT.map)}`);
  lines.push(`- Shannon: ${repoRel(OUT.shannon)}`);
  lines.push(`- Hermes: ${repoRel(OUT.hermes)}`);
  lines.push(`- Cube: ${repoRel(OUT.cube)}`);
  lines.push(`- D mirror: ${OUT.dSupervisor}`);
  lines.push("");
  lines.push("## Boundaries");
  lines.push("");
  lines.push("- Permanent supervisor profile only.");
  lines.push("- No shadow file edits.");
  lines.push("- No downloads, installs, live model prompts, API headers, or secret material writes.");
  lines.push("- Future runs should use D-backed package artifacts and BEHCS Gulp proof messages.");
  return {
    json: { summary, supervisor, map, shannon, hermes, gulp, mode: MODE },
    md: `${lines.join("\n")}\n`
  };
}

async function tick({ execute }) {
  const generatedAt = new Date().toISOString();
  const summary = requireSourceSummary();
  const supervisor = buildSupervisor(summary, generatedAt);
  const map = buildMap(summary, supervisor, generatedAt);
  const shannon = buildShannon(summary, supervisor, generatedAt);
  const hermes = buildHermes(summary, supervisor, shannon, generatedAt);

  let gulp = { ok: true, skipped: !execute };
  if (execute) {
    behcsGulp.recordCollectorMessage({
      id: `natalie-derek-supervisor-${Date.now()}`,
      ts: generatedAt,
      type: "supervisor_packet",
      from: MODE_ID,
      to: "behcs_gulp_runtime",
      verb: "EVT-NATALIE-MARTIN-DEREK-MODE-SUPERVISOR",
      payload: {
        modeName: MODE_NAME,
        modeId: MODE_ID,
        rootPid: MODE_PID,
        sourceRunRoot: RUN_ROOT,
        counts: summary.counts || {},
        shannon: shannon.consensus,
        whiteRoom: true,
        forwardGnn: "score_supervisor_readiness",
        reverseGainGnn: "demote_unsafe_live_model_storm",
        gc: "compact_supervisor_proof"
      }
    }, {
      reason: "natalie_martin_derek_mode_supervisor",
      remoteMeta: { ip: "127.0.0.1", port: 4947, method: "LOCAL", protocol: "behcs" },
      reflex: { action: "permanent_supervisor_proof", runInference: true }
    });
    gulp = await behcsGulp.runGulpRehydration({ force: true, reason: "natalie_martin_derek_mode_supervisor" });
  }

  const state = {
    savedAt: generatedAt,
    modeName: MODE_NAME,
    modeId: MODE_ID,
    rootSupervisorPid: MODE_PID,
    sourceRunRoot: RUN_ROOT,
    status: shannon.consensus,
    counts: summary.counts || {},
    outputs: {
      supervisor: repoRel(OUT.supervisor),
      map: repoRel(OUT.map),
      shannon: repoRel(OUT.shannon),
      hermes: repoRel(OUT.hermes),
      cube: repoRel(OUT.cube),
      report: repoRel(OUT.reportMd),
      dSupervisor: OUT.dSupervisor
    }
  };
  const cube = `// cube: ${MODE_ID} | permanent supervisor\nexport const CUBE = ${JSON.stringify({ state, supervisor, map, shannon }, null, 2)}\n`;
  const report = buildReport({ summary, supervisor, map, shannon, hermes, gulp });

  if (execute) {
    writeJson(OUT.supervisor, supervisor);
    writeJson(OUT.map, map);
    writeJson(OUT.state, state);
    writeJson(OUT.shannon, shannon);
    writeJson(OUT.hermes, hermes);
    writeText(OUT.cube, cube);
    writeJson(OUT.reportJson, report.json);
    writeText(OUT.reportMd, report.md);
    writeJson(OUT.dSupervisor, supervisor);
    writeText(OUT.dReport, report.md);

    const eventId = `natalie-derek-mode-${Date.now()}`;
    appendNdjson(OUT.inbox, {
      id: eventId,
      ts: generatedAt,
      from: "asolaria",
      to: MODE_ID,
      verb: "EVT-NATALIE-MARTIN-DEREK-MODE-PERMANENT",
      body: { status: shannon.consensus, supervisor: repoRel(OUT.supervisor), report: repoRel(OUT.reportMd) }
    });
    appendNdjson(OUT.outbox, {
      id: `${eventId}-hermes`,
      ts: generatedAt,
      from: "hermes",
      to: MODE_ID,
      verb: hermes.packet.verb,
      body: hermes
    });
    appendNdjson(OUT.gnnEdges, {
      id: `${eventId}-edge`,
      ts: generatedAt,
      from: MODE_ID,
      to: "claude_10k_pid_package_fabric",
      verb: "permanent_supervisor_minted",
      weight: shannon.consensus.startsWith("PROCEED") ? 0.97 : 0.61,
      digest: shannon.digest
    });
  }

  return {
    ok: true,
    action: execute ? "tick" : "preview",
    status: shannon.consensus,
    modeName: MODE_NAME,
    rootSupervisorPid: MODE_PID,
    counts: summary.counts || {},
    gulp: {
      ok: gulp.ok,
      gulpId: gulp.gulpId,
      processedMessages: gulp.processedMessages,
      mistakesDetected: gulp.mistakesDetected,
      gnnEdges: gulp.gnnEdges
    },
    reverseGainMistakeMarks: Number(summary.counts?.mistakeMarks || 0),
    geniusMarks: Number(summary.counts?.geniusMarks || 0),
    patternMarks: Number(summary.counts?.patternMarks || 0),
    outputs: state.outputs,
    mode: MODE
  };
}

function status() {
  const source = sourceEvidence();
  return {
    ok: true,
    status: fs.existsSync(SOURCE_PATHS.summary) ? "READY" : "SOURCE_RUN_MISSING",
    modeName: MODE_NAME,
    modeId: MODE_ID,
    rootSupervisorPid: MODE_PID,
    runRoot: RUN_ROOT,
    source,
    outputs: {
      supervisor: repoRel(OUT.supervisor),
      state: repoRel(OUT.state),
      report: repoRel(OUT.reportMd),
      dSupervisor: OUT.dSupervisor
    },
    mode: MODE
  };
}

async function main(argv) {
  const action = argv[2] || "status";
  if (action === "status") {
    console.log(JSON.stringify(status(), null, 2));
    return;
  }
  if (action === "tick" || action === "install") {
    const result = await tick({ execute: argv.includes("--execute") });
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.error(JSON.stringify({
    ok: false,
    error: `Unknown action: ${action}`,
    usage: [
      "node tools/natalie-martin-derek-mode-supervisor.js status",
      "node tools/natalie-martin-derek-mode-supervisor.js tick --execute"
    ]
  }, null, 2));
  process.exitCode = 2;
}

main(process.argv).catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
  process.exitCode = 1;
});
