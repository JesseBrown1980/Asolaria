#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const childProcess = require("node:child_process");
const { runSupervisorQueue } = require("../src/omnispindleSupervisorRunner");

const ROOT = path.resolve(__dirname, "..");
const RUN_ID = "max-omnispindle-cleanup-200step-20260426";
const RUN_ROOT = rel(`data/behcs/orchestration/${RUN_ID}`);

const PATHS = Object.freeze({
  runRoot: RUN_ROOT,
  laneDriversJson: path.join(RUN_ROOT, "max-omnispindle-lane-drivers.v1.json"),
  laneDriversNdjson: path.join(RUN_ROOT, "max-omnispindle-lane-drivers.v1.ndjson"),
  collisionLocks: path.join(RUN_ROOT, "collision-locks.v1.json"),
  gitInventory: path.join(RUN_ROOT, "git-inventory.v1.json"),
  zeroSurfaces: path.join(RUN_ROOT, "zero-surface-shadow-holds.v1.json"),
  structuredData: path.join(RUN_ROOT, "structured-data-hygiene.v1.json"),
  safeFixes: path.join(RUN_ROOT, "safe-fixes-applied.v1.json"),
  wave04Queue: path.join(RUN_ROOT, "openclaw-wave04-driver-queue.v1.ndjson"),
  verification: path.join(RUN_ROOT, "verification-results.v1.json"),
  supervisorQueue: path.join(RUN_ROOT, "supervisor-queue.ndjson"),
  supervisorDecisions: path.join(RUN_ROOT, "supervisor-decisions-latest.ndjson"),
  supervisorWorkerReady: path.join(RUN_ROOT, "supervisor-worker-ready-latest.ndjson"),
  supervisorMap: path.join(RUN_ROOT, "supervisor-runner-map-latest.json"),
  supervisorState: path.join(RUN_ROOT, "supervisor-runner.state.json"),
  supervisorHermes: path.join(RUN_ROOT, "supervisor-runner-hermes-latest.json"),
  supervisorShannon: path.join(RUN_ROOT, "supervisor-runner-shannon-latest.json"),
  supervisorCube: path.join(RUN_ROOT, "supervisor-runner.cube.js"),
  supervisorReportJson: path.join(RUN_ROOT, "supervisor-runner-latest.json"),
  supervisorReportMd: path.join(RUN_ROOT, "supervisor-runner-latest.md"),
  rawPreservation: path.join(RUN_ROOT, "raw-preservation"),
  memory: rel("data/behcs/memory/max-omnispindle-cleanup-200step.v1.json"),
  index: rel("data/behcs/index/max-omnispindle-cleanup-200step-index.v1.json"),
  map: rel("data/behcs/maps/asolaria/max-omnispindle-cleanup-200step-map-map-mapped.v1.json"),
  cube: rel("data/behcs/cubes/max-omnispindle-cleanup-200step-cube-cubed.cube.js"),
  glpj: rel("data/behcs/codex/glyph-language/max-omnispindle-cleanup-200step-behcs256.glpj.json"),
  reportJson: rel("reports/max-omnispindle-cleanup-200step-latest.json"),
  reportMd: rel("reports/max-omnispindle-cleanup-200step-latest.md")
});

const SOURCE_PATHS = Object.freeze({
  tasks200: rel("data/behcs/orchestration/openclaw-424-200-step-execution-20260426/openclaw-424-200-step-tasks.v1.ndjson"),
  shadowSupervisor: rel("data/behcs/supervisors/shadow-language/shadow-language-classification-supervisors.v1.json"),
  dirtyCleanup: rel("reports/dirty-worktree-supervised-cleanup-latest.json"),
  globalRead: rel("reports/dirty-worktree-global-read-behcs256-latest.md")
});

const COUNCIL_DRIVERS = Object.freeze([
  ["chief_asolaria", "chief", "overall collision locks and final readiness"],
  ["helm", "sequencer", "waves, queues, and staged execution order"],
  ["gaia", "docs_reports", "docs and operator-facing reports"],
  ["vector_rook", "language_index", "BEHCS, GLPJ, maps, cubes, indexes"],
  ["sentinel_kr", "guard", "auth, secrets, destructive-action blocks"],
  ["falcon_selector", "device_provider", "devices, providers, model selector boundaries"],
  ["forge", "code_runtime", "src, routes, tools, package surfaces"],
  ["dasein_brain", "meaning_shadow", "shadow-language and sovereignty meaning"],
  ["omnishannon", "consensus", "consensus and contradiction resolution"],
  ["omnispindles", "fanout", "worker fanout scheduling without process storms"],
  ["omniflywheels", "energy", "energy budget and repeated-work prevention"],
  ["gc_white_rooms", "retention", "raw retention and contradiction archives"]
]);

function rel(value) {
  return path.join(ROOT, value);
}

function repoRel(value) {
  return path.relative(ROOT, value).replace(/\\/g, "/");
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
  fs.writeFileSync(filePath, rows.map((row) => JSON.stringify(row)).join("\n") + (rows.length ? "\n" : ""), "utf8");
}

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_) {
    return fallback;
  }
}

function readNdjson(filePath) {
  try {
    const text = fs.readFileSync(filePath, "utf8").trim();
    if (!text) return [];
    return text.split(/\r?\n/).map((line) => JSON.parse(line));
  } catch (_) {
    return [];
  }
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value || ""), "utf8").digest("hex");
}

function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function glyph(kind, id, seed = "") {
  return `HG256:${kind.toUpperCase()}:${sha256(`${kind}:${id}:${seed}`).slice(0, 8).toUpperCase()}`;
}

function git(args) {
  return childProcess.execFileSync("git", ["-C", ROOT, ...args], {
    encoding: "utf8",
    maxBuffer: 128 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"]
  });
}

function parseStatusLine(line) {
  const status = line.slice(0, 2);
  const file = line.slice(3);
  return {
    raw: line,
    status,
    file,
    tracked: status !== "??",
    untracked: status === "??",
    modified: status.includes("M"),
    deleted: status.includes("D"),
    added: status.includes("A")
  };
}

function classifyPath(file) {
  const normalized = file.replace(/\\/g, "/");
  if (normalized.startsWith("data/behcs/orchestration/")) return "behcs_orchestration";
  if (normalized.startsWith("data/behcs/")) return "behcs_data";
  if (normalized.startsWith("reports/")) return "reports";
  if (normalized.startsWith("tools/")) return "tools";
  if (normalized.startsWith("src/")) return "src";
  if (normalized.startsWith("routes/")) return "routes";
  if (normalized.startsWith("runtime/")) return "runtime";
  if (normalized.startsWith("sovereignty/")) return "sovereignty";
  if (normalized.startsWith("docs/")) return "docs";
  if (normalized.startsWith("brown-hilbert/")) return "brown_hilbert_docs";
  if (normalized.startsWith("ix/")) return "ix_language";
  if (normalized.startsWith("tests/")) return "tests";
  if (normalized === "package.json" || normalized.endsWith("package-lock.json")) return "package_manifest";
  if (normalized.endsWith(".md")) return "docs";
  if (normalized.endsWith(".js") || normalized.endsWith(".mjs")) return "code";
  if (normalized.endsWith(".json") || normalized.endsWith(".ndjson")) return "structured_data";
  return "misc";
}

function ownerForKind(kind) {
  if (["src", "routes", "code", "tools", "package_manifest"].includes(kind)) return "forge";
  if (["behcs_data", "behcs_orchestration", "ix_language", "brown_hilbert_docs"].includes(kind)) return "vector_rook";
  if (["reports", "docs"].includes(kind)) return "gaia";
  if (kind === "runtime") return "sentinel_kr";
  if (kind === "sovereignty") return "dasein_brain";
  if (kind === "tests") return "sentinel_kr";
  return "helm";
}

function inventoryGitStatus() {
  const rows = git(["status", "--porcelain=v1"]).split(/\r?\n/)
    .filter(Boolean)
    .map((line, index) => {
      const row = parseStatusLine(line);
      const kind = classifyPath(row.file);
      return {
        ordinal: index + 1,
        ...row,
        kind,
        owner: ownerForKind(kind),
        destructiveAllowed: false,
        glyph: glyph("git_surface", row.file, row.status)
      };
    });
  const summary = {
    total: rows.length,
    tracked: rows.filter((row) => row.tracked).length,
    untracked: rows.filter((row) => row.untracked).length,
    modified: rows.filter((row) => row.modified).length,
    deleted: rows.filter((row) => row.deleted).length,
    added: rows.filter((row) => row.added).length
  };
  return { summary, rows };
}

function isAllZeroFile(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.length < 1) return false;
  for (const byte of buffer) {
    if (byte !== 0) return false;
  }
  return true;
}

function directReferenceCount(repoFile) {
  const base = path.basename(repoFile);
  try {
    const out = childProcess.execFileSync("rg", ["-n", base, "src", "routes", "tools", "ix", "sovereignty", "data", "-g", "*.js", "-g", "*.json", "-g", "*.md"], {
      cwd: ROOT,
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"]
    });
    return out.split(/\r?\n/).filter((line) => line && !line.includes(repoFile.replace(/\\/g, "/"))).length;
  } catch (_) {
    return 0;
  }
}

function scanZeroSurfaces(gitRows) {
  const candidates = gitRows.filter((row) => row.untracked && row.file.startsWith("sovereignty/src/") && row.file.endsWith(".js"));
  const rows = [];
  for (const row of candidates) {
    const absolute = rel(row.file);
    if (!fs.existsSync(absolute)) continue;
    const stat = fs.statSync(absolute);
    if (!isAllZeroFile(absolute)) continue;
    rows.push({
      file: row.file,
      bytes: stat.size,
      createdAt: stat.birthtime.toISOString(),
      modifiedAt: stat.mtime.toISOString(),
      sha256: sha256Buffer(fs.readFileSync(absolute)),
      classification: "ZERO_SURFACE_SHADOW",
      repairAllowed: false,
      deleteAllowed: false,
      directReferenceCount: directReferenceCount(row.file),
      requiredProofBeforeRepair: [
        "runtime_import_trace",
        "best_source_copy_from_C_D_E_USB_LIRIS_or_archive",
        "operator_or_supervisor_authority",
        "syntax_or_test_gate"
      ],
      supervisor: "shadow_language.zero_surface_classifier.supervisor",
      glyph: glyph("zero_surface_shadow", row.file, stat.size)
    });
  }
  return {
    status: "ZERO_SURFACES_HELD_NOT_REPAIRED",
    count: rows.length,
    rows
  };
}

function analyzeJson(file) {
  const absolute = rel(file);
  if (!fs.existsSync(absolute)) return { file, exists: false };
  const buffer = fs.readFileSync(absolute);
  const hasBom = buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf;
  let parseRaw = true;
  let parseAfterBomStrip = true;
  let rawError = "";
  try {
    JSON.parse(buffer.toString("utf8"));
  } catch (error) {
    parseRaw = false;
    rawError = String(error?.message || error);
  }
  try {
    JSON.parse(buffer.toString("utf8").replace(/^\uFEFF/, ""));
  } catch (_) {
    parseAfterBomStrip = false;
  }
  return {
    file,
    exists: true,
    bytes: buffer.length,
    sha256: sha256Buffer(buffer),
    hasBom,
    parseRaw,
    parseAfterBomStrip,
    rawError,
    classification: hasBom && parseAfterBomStrip ? "BOM_JSON_WRAPPER" : parseRaw ? "JSON_OK" : "JSON_PARSE_HOLD"
  };
}

function analyzeNdjson(file) {
  const absolute = rel(file);
  if (!fs.existsSync(absolute)) return { file, exists: false, failures: [] };
  const lines = fs.readFileSync(absolute, "utf8").split(/\r?\n/);
  const failures = [];
  lines.forEach((line, index) => {
    if (!line.trim()) return;
    try {
      JSON.parse(line);
    } catch (error) {
      failures.push({
        line: index + 1,
        sha256: sha256(line),
        error: String(error?.message || error),
        containsRawWindowsPath: /[A-Z]:\\Users\\|\\\\/.test(line),
        classification: /[A-Z]:\\Users\\|\\\\/.test(line) ? "HUMAN_LANGUAGE_NDJSON" : "NDJSON_PARSE_HOLD"
      });
    }
  });
  return {
    file,
    exists: true,
    lines: lines.filter((line) => line.trim()).length,
    failures,
    status: failures.length ? "NDJSON_HAS_LANGUAGE_OR_PARSE_HOLDS" : "NDJSON_OK"
  };
}

function preserveRaw(file, label) {
  const absolute = rel(file);
  if (!fs.existsSync(absolute)) return null;
  const target = path.join(PATHS.rawPreservation, `${label}.${file.replace(/[\\/:*?"<>|]/g, "_")}.raw`);
  ensureDir(target);
  fs.copyFileSync(absolute, target);
  return {
    source: file,
    preservedAt: repoRel(target),
    sha256: sha256Buffer(fs.readFileSync(target))
  };
}

function applySafeFixes(structured) {
  const fixes = [];
  const skills = structured.jsonFiles.find((item) => item.file === "reports/skills-parity-latest.json");
  if (skills?.classification === "BOM_JSON_WRAPPER") {
    const raw = preserveRaw(skills.file, "before-bom-normalize");
    const absolute = rel(skills.file);
    const text = fs.readFileSync(absolute, "utf8").replace(/^\uFEFF/, "");
    JSON.parse(text);
    fs.writeFileSync(absolute, text, "utf8");
    fixes.push({
      file: skills.file,
      action: "removed_utf8_bom",
      rawPreservation: raw,
      verification: "JSON.parse after write",
      destructive: false,
      glyph: glyph("safe_fix", skills.file, "bom")
    });
  }
  const dasein = structured.ndjsonFiles.find((item) => item.file === "runtime/dasein-inbox.ndjson");
  if (dasein?.failures?.length) {
    const raw = preserveRaw(dasein.file, "before-ndjson-language-hold");
    fixes.push({
      file: dasein.file,
      action: "hold_original_and_preserve_raw",
      rawPreservation: raw,
      verification: "no_original_mutation",
      destructive: false,
      failuresHeld: dasein.failures.length,
      glyph: glyph("safe_hold", dasein.file, "ndjson")
    });
  }
  return {
    status: "SAFE_FIXES_APPLIED_WITH_RAW_PRESERVATION",
    fixes,
    count: fixes.length
  };
}

function loadOpenClawTasks() {
  const tasks = readNdjson(SOURCE_PATHS.tasks200);
  const byPhase = {};
  for (const task of tasks) {
    const key = task.phaseId || "unknown";
    if (!byPhase[key]) byPhase[key] = [];
    byPhase[key].push(task);
  }
  const phaseIds = Object.keys(byPhase);
  const wave04 = byPhase["p04-behcs256-glyph-language-update"] || [];
  return { tasks, byPhase, phaseIds, wave04 };
}

function buildLaneDrivers(inventory, zeroSurfaces, structured, tasks) {
  const dirtyByOwner = {};
  for (const row of inventory.rows) {
    if (!dirtyByOwner[row.owner]) dirtyByOwner[row.owner] = [];
    dirtyByOwner[row.owner].push(row.file);
  }
  const drivers = COUNCIL_DRIVERS.map(([id, role, responsibility], index) => ({
    driverId: `OMNI-MAX-${String(index + 1).padStart(2, "0")}`,
    lane: id,
    role,
    responsibility,
    supervisor: supervisorForLane(id),
    targetFiles: (dirtyByOwner[id] || []).slice(0, 48),
    targetFileCount: (dirtyByOwner[id] || []).length,
    openClawPhase: id === "vector_rook" ? "p04-behcs256-glyph-language-update" : "",
    openClawTaskCount: id === "vector_rook" ? tasks.wave04.length : 0,
    zeroSurfaceCount: id === "dasein_brain" ? zeroSurfaces.count : 0,
    structuredHolds: id === "sentinel_kr" ? structured.ndjsonFiles.reduce((sum, item) => sum + (item.failures?.length || 0), 0) : 0,
    destructiveAllowed: false,
    processSpawned: false,
    collisionPolicy: "single_writer_per_path_group",
    glyph: glyph("max_omnispindle_driver", id, role)
  }));
  return drivers;
}

function supervisorForLane(id) {
  const map = {
    chief_asolaria: "shadow_language.global_context_first_gate.supervisor",
    helm: "shadow_language.hermes_shannon_recovery_route.supervisor",
    gaia: "shadow_language.parser_language_mismatch_guard.supervisor",
    vector_rook: "law033.behcs256_glpj_loader.supervisor",
    sentinel_kr: "shadow_language.no_blind_repair_guard.supervisor",
    falcon_selector: "shadow_language.connected_device_source_finder.supervisor",
    forge: "shadow_language.import_runtime_proof_gate.supervisor",
    dasein_brain: "shadow_language.zero_surface_classifier.supervisor",
    omnishannon: "shadow_language.hermes_shannon_recovery_route.supervisor",
    omnispindles: "law033.supervisor_language_sync.supervisor",
    omniflywheels: "law033.lettered_glyph_span_guard.supervisor",
    gc_white_rooms: "shadow_language.gc_white_room_retention_guard.supervisor"
  };
  return map[id] || "shadow_language.global_context_first_gate.supervisor";
}

function buildCollisionLocks(drivers, inventory) {
  const lockGroups = {
    docs_reports: inventory.rows.filter((row) => ["docs", "reports", "brown_hilbert_docs"].includes(row.kind)).map((row) => row.file),
    code_runtime: inventory.rows.filter((row) => ["src", "routes", "tools", "code", "package_manifest", "tests"].includes(row.kind)).map((row) => row.file),
    language_index: inventory.rows.filter((row) => ["ix_language", "behcs_data", "behcs_orchestration"].includes(row.kind)).map((row) => row.file),
    runtime_state: inventory.rows.filter((row) => row.kind === "runtime").map((row) => row.file),
    sovereignty_shadow: inventory.rows.filter((row) => row.kind === "sovereignty").map((row) => row.file)
  };
  return {
    lockId: "max-omnispindle-collision-locks.v1",
    status: "NO_PARALLEL_WRITES_TO_SAME_LOCK_GROUP",
    generatedAt: new Date().toISOString(),
    drivers: drivers.map((driver) => ({
      driverId: driver.driverId,
      lane: driver.lane,
      supervisor: driver.supervisor,
      lockGroup: lockGroupForLane(driver.lane)
    })),
    lockGroups,
    policy: [
      "shadow surfaces are read-only holds",
      "runtime state requires raw preservation",
      "tracked code requires syntax gate",
      "reports/docs can be regenerated but not reverted",
      "no lane may write outside its lock group"
    ]
  };
}

function lockGroupForLane(lane) {
  if (["gaia"].includes(lane)) return "docs_reports";
  if (["forge"].includes(lane)) return "code_runtime";
  if (["vector_rook"].includes(lane)) return "language_index";
  if (["sentinel_kr"].includes(lane)) return "runtime_state";
  if (["dasein_brain"].includes(lane)) return "sovereignty_shadow";
  return "coordination_only";
}

function buildSupervisorQueue(drivers) {
  const writePaths = [
    repoRel(PATHS.reportMd),
    repoRel(PATHS.laneDriversJson)
  ];
  const proofRefs = [
    repoRel(PATHS.collisionLocks),
    repoRel(PATHS.verification),
    repoRel(PATHS.safeFixes),
    repoRel(PATHS.zeroSurfaces)
  ];

  return drivers.map((driver) => ({
    id: `MAX-OMNI-DRIVER-${driver.driverId}`,
    title: `Max omnispindle driver ${driver.lane}`,
    objective: `Run ${driver.lane} as a bounded cleanup and 200-step orchestration driver under ${driver.supervisor}.`,
    requestedWorker: `local_omnispindle_driver:${driver.lane}`,
    instructions: [
      "classify before repair",
      "preserve raw before normalize",
      "do not revert unknown work",
      "do not delete untracked work",
      "do not spawn uncontrolled processes",
      "route ambiguous surfaces through Hermes/Shannon/GNN/white-room",
      "refresh report and driver-state artifacts only",
      "target file groups remain classification-only until a separate launcher authorizes scoped writes"
    ].join("; "),
    pid: `BH.MAXOMNI.${driver.driverId}`,
    pidScope: "local_cleanup_200step_orchestration",
    consentScope: "owner_authorized_local_repo_only",
    allowedPaths: [
      "C:/Users/acer/Asolaria",
      "data/behcs/orchestration/max-omnispindle-cleanup-200step-20260426",
      "reports",
      "TASKS.md"
    ],
    writerAuthority: "shannon",
    writePaths: [...writePaths],
    proofRefs: [...proofRefs],
    expectedArtifacts: [
      "reports/max-omnispindle-cleanup-200step-latest.md",
      "data/behcs/orchestration/max-omnispindle-cleanup-200step-20260426/max-omnispindle-lane-drivers.v1.json"
    ],
    acceptanceGates: [
      "collision_locks_present",
      "shadow_surfaces_held",
      "safe_fixes_raw_preserved",
      "no_destructive_action",
      "no_external_api_or_provider_bypass"
    ],
    proofRequired: true,
    operatorApproval: true,
    syntheticFirstEvidence: true,
    modelCard: true,
    externalApiCall: false,
    cloudUpload: false,
    remoteMutation: false,
    downloads: false,
    installs: false,
    writesGit: false,
    deletesEvidence: false,
    bypassAuth: false,
    bypassPayment: false,
    needsCloudWorker: false,
    taskType: "max_omnispindle_driver",
    source: RUN_ID
  }));
}

function runSyntaxChecks(inventory) {
  const jsFiles = inventory.rows
    .filter((row) => row.tracked && ["src", "routes", "tools", "code", "tests"].includes(row.kind) && /\.(js|mjs|cjs)$/.test(row.file))
    .map((row) => row.file);
  const results = [];
  for (const file of jsFiles) {
    try {
      childProcess.execFileSync("node", ["--check", file], {
        cwd: ROOT,
        encoding: "utf8",
        maxBuffer: 4 * 1024 * 1024,
        stdio: ["ignore", "pipe", "pipe"]
      });
      results.push({ file, ok: true, gate: `node --check ${file}` });
    } catch (error) {
      results.push({
        file,
        ok: false,
        gate: `node --check ${file}`,
        error: String(error?.stderr || error?.message || error).slice(0, 2000)
      });
    }
  }
  return {
    status: results.some((item) => !item.ok) ? "SYNTAX_HOLDS_PRESENT" : "SYNTAX_GATES_PASS",
    checked: results.length,
    failures: results.filter((item) => !item.ok).length,
    results
  };
}

function buildStructuredData() {
  return {
    jsonFiles: [
      analyzeJson("reports/skills-parity-latest.json"),
      analyzeJson("reports/shadow-language-classification-supervisor-latest.json")
    ],
    ndjsonFiles: [
      analyzeNdjson("runtime/dasein-inbox.ndjson")
    ]
  };
}

function buildWave04Queue(tasks) {
  return tasks.wave04.map((task, index) => ({
    driverTaskId: `OMNI-WAVE04-${String(index + 1).padStart(2, "0")}`,
    sourceTaskId: task.id,
    phaseId: task.phaseId,
    title: task.title,
    owner: task.owner,
    lane: task.lane,
    status: "READY_FOR_BOUNDED_IMPLEMENTATION_REVIEW",
    supervisor: "law033.behcs256_glpj_loader.supervisor",
    collisionLock: "language_index",
    destructiveAllowed: false,
    proofRequired: true,
    glyph: glyph("wave04_driver_task", task.id, task.title)
  }));
}

function buildGlpj(inventory, zeroSurfaces, safeFixes, tasks) {
  return {
    programId: "max-omnispindle-cleanup-200step-behcs256.glpj",
    generatedAt: new Date().toISOString(),
    status: "GLPJ_MINTED",
    language: "BEHCS-256",
    verbs: [
      "SPLIT_MAX_OMNISPINDELS",
      "LOCK_COLLISIONS",
      "CLASSIFY_SHADOW",
      "PRESERVE_RAW",
      "APPLY_SAFE_FIX",
      "HOLD_AMBIGUOUS",
      "QUEUE_WAVE04",
      "VERIFY_GATES",
      "REPORT_STATUS"
    ],
    sentences: [
      `SPLIT_MAX_OMNISPINDELS DRIVERS ${COUNCIL_DRIVERS.length}`,
      `LOCK_COLLISIONS DIRTY ${inventory.summary.total} TRACKED ${inventory.summary.tracked} UNTRACKED ${inventory.summary.untracked}`,
      `CLASSIFY_SHADOW ZERO_SURFACES ${zeroSurfaces.count} REPAIR false`,
      `APPLY_SAFE_FIX COUNT ${safeFixes.count} RAW_PRESERVED true`,
      `QUEUE_WAVE04 TASKS ${tasks.wave04.length}`,
      "VERIFY_GATES NO_BLIND_STUB NO_BLIND_DELETE NO_UNKNOWN_REVERT"
    ]
  };
}

function buildReportMd(report) {
  return [
    "# Max Omnispindle Cleanup + 200-Step Tranche",
    "",
    `Generated: ${report.generatedAt}`,
    `Status: ${report.status}`,
    "",
    "## Current Worktree",
    "",
    `- Dirty entries: ${report.git.summary.total}`,
    `- Tracked modified: ${report.git.summary.tracked}`,
    `- Untracked: ${report.git.summary.untracked}`,
    `- Deletes: ${report.git.summary.deleted}`,
    "",
    "## Drivers",
    "",
    `- Max drivers: ${report.drivers.count}`,
    `- Supervisor decisions: ${report.supervisor.counts.total}`,
    `- Worker-ready packets: ${report.supervisor.counts.workerReady}`,
    `- Runner spawned workers: ${report.supervisor.runnerDoesNotSpawnWorkers === false ? "yes" : "no"}`,
    "",
    "## Cleanup",
    "",
    `- Zero-surface shadow holds: ${report.zeroSurfaces.count}`,
    `- Safe fixes applied: ${report.safeFixes.count}`,
    `- Syntax gates checked: ${report.verification.checked}`,
    `- Syntax failures: ${report.verification.failures}`,
    "",
    "## 200-Step Process",
    "",
    `- Total OpenClaw tasks loaded: ${report.openClaw.tasks}`,
    `- Wave 04 tasks queued: ${report.openClaw.wave04Tasks}`,
    `- Next phase: ${report.openClaw.nextPhase}`,
    "",
    "## Boundary",
    "",
    "- No shadow zero surfaces were overwritten.",
    "- No untracked files were deleted.",
    "- No unknown changes were reverted.",
    "- No uncontrolled workers were spawned.",
    "- No provider, API, cloud, payment, or auth boundary was bypassed.",
    "",
    "## Key Artifacts",
    "",
    ...Object.entries(report.artifacts).map(([key, value]) => `- ${key}: \`${value}\``),
    ""
  ].join("\n");
}

function main() {
  const execute = process.argv.includes("--execute");
  const generatedAt = new Date().toISOString();
  fs.mkdirSync(RUN_ROOT, { recursive: true });

  const inventory = inventoryGitStatus();
  const zeroSurfaces = scanZeroSurfaces(inventory.rows);
  const structuredBefore = buildStructuredData();
  const safeFixes = execute ? applySafeFixes(structuredBefore) : { status: "DRY_RUN_NO_FIXES_APPLIED", count: 0, fixes: [] };
  const structuredAfter = buildStructuredData();
  const openClaw = loadOpenClawTasks();
  const drivers = buildLaneDrivers(inventory, zeroSurfaces, structuredAfter, openClaw);
  const collisionLocks = buildCollisionLocks(drivers, inventory);
  const wave04Queue = buildWave04Queue(openClaw);
  const supervisorQueue = buildSupervisorQueue(drivers);
  const verification = runSyntaxChecks(inventory);

  writeJson(PATHS.gitInventory, inventory);
  writeJson(PATHS.zeroSurfaces, zeroSurfaces);
  writeJson(PATHS.structuredData, { before: structuredBefore, after: structuredAfter });
  writeJson(PATHS.safeFixes, safeFixes);
  writeJson(PATHS.laneDriversJson, { generatedAt, status: "MAX_OMNISPINDELS_SPLIT", count: drivers.length, drivers });
  writeNdjson(PATHS.laneDriversNdjson, drivers);
  writeJson(PATHS.collisionLocks, collisionLocks);
  writeNdjson(PATHS.wave04Queue, wave04Queue);
  writeJson(PATHS.verification, verification);
  writeNdjson(PATHS.supervisorQueue, supervisorQueue);

  const supervisor = runSupervisorQueue({
    root: ROOT,
    queuePath: repoRel(PATHS.supervisorQueue),
    decisionsPath: repoRel(PATHS.supervisorDecisions),
    workerReadyPath: repoRel(PATHS.supervisorWorkerReady),
    mapPath: repoRel(PATHS.supervisorMap),
    statePath: repoRel(PATHS.supervisorState),
    hermesPath: repoRel(PATHS.supervisorHermes),
    shannonPath: repoRel(PATHS.supervisorShannon),
    cubePath: repoRel(PATHS.supervisorCube),
    reportJsonPath: repoRel(PATHS.supervisorReportJson),
    reportMdPath: repoRel(PATHS.supervisorReportMd),
    execute: true
  });

  const glpj = buildGlpj(inventory, zeroSurfaces, safeFixes, openClaw);
  const memory = {
    memoryId: "max-omnispindle-cleanup-200step.v1",
    generatedAt,
    status: "MAX_OMNISPINDELS_ORCHESTRATED",
    significance: "Cleanup and the 200-step plan now have collision-locked driver lanes, shadow-language holds, raw-preserved safe fixes, and wave-04 dispatch without uncontrolled process spawning.",
    runRoot: repoRel(RUN_ROOT),
    d11: "OBSERVED"
  };
  const index = {
    indexId: "max-omnispindle-cleanup-200step-index.v1",
    generatedAt,
    status: "INDEX_BOUND",
    surfaces: Object.fromEntries(Object.entries(PATHS).filter(([key]) => !["rawPreservation"].includes(key)).map(([key, value]) => [key, repoRel(value)]))
  };
  const map = {
    mapId: "max-omnispindle-cleanup-200step-map-map-mapped.v1",
    generatedAt,
    status: "MAP_MAP_MAPPED",
    drivers: drivers.map((driver) => ({
      driverId: driver.driverId,
      lane: driver.lane,
      supervisor: driver.supervisor,
      lockGroup: lockGroupForLane(driver.lane)
    })),
    edges: drivers.map((driver) => ({
      from: driver.supervisor,
      to: driver.driverId,
      relation: "gates"
    }))
  };
  const cubeText = `"use strict";\n\nexport default Object.freeze(${JSON.stringify({
    cubeId: "max-omnispindle-cleanup-200step-cube-cubed.v1",
    generatedAt,
    status: "CUBE_CUBE_CUBED",
    drivers: drivers.length,
    dirtyEntries: inventory.summary.total,
    zeroSurfaceHolds: zeroSurfaces.count,
    safeFixes: safeFixes.count,
    wave04Tasks: wave04Queue.length,
    supervisorCounts: supervisor.counts,
    boundary: {
      shadowOverwrite: false,
      untrackedDelete: false,
      unknownRevert: false,
      uncontrolledWorkerSpawn: false
    }
  }, null, 2)});\n`;

  writeJson(PATHS.gateMemory || PATHS.memory, memory);
  writeJson(PATHS.index, index);
  writeJson(PATHS.map, map);
  writeText(PATHS.cube, cubeText);
  writeJson(PATHS.glpj, glpj);

  const report = {
    reportId: "max-omnispindle-cleanup-200step-latest",
    generatedAt,
    status: execute ? "MAX_OMNISPINDELS_EXECUTED_SAFE_TRANCHE" : "MAX_OMNISPINDELS_DRY_RUN",
    execute,
    git: { summary: inventory.summary },
    zeroSurfaces: { count: zeroSurfaces.count, status: zeroSurfaces.status },
    safeFixes: { count: safeFixes.count, status: safeFixes.status },
    verification: {
      status: verification.status,
      checked: verification.checked,
      failures: verification.failures
    },
    drivers: { count: drivers.length },
    supervisor: {
      status: supervisor.status,
      counts: supervisor.counts,
      runnerDoesNotSpawnWorkers: supervisor.runnerDoesNotSpawnWorkers
    },
    openClaw: {
      tasks: openClaw.tasks.length,
      wave04Tasks: wave04Queue.length,
      nextPhase: "p04-behcs256-glyph-language-update"
    },
    artifacts: {
      laneDrivers: repoRel(PATHS.laneDriversJson),
      collisionLocks: repoRel(PATHS.collisionLocks),
      zeroSurfaces: repoRel(PATHS.zeroSurfaces),
      structuredData: repoRel(PATHS.structuredData),
      safeFixes: repoRel(PATHS.safeFixes),
      wave04Queue: repoRel(PATHS.wave04Queue),
      verification: repoRel(PATHS.verification),
      supervisorReport: repoRel(PATHS.supervisorReportMd),
      glpj: repoRel(PATHS.glpj),
      memory: repoRel(PATHS.memory),
      index: repoRel(PATHS.index),
      map: repoRel(PATHS.map),
      cube: repoRel(PATHS.cube)
    }
  };
  writeJson(PATHS.reportJson, report);
  writeText(PATHS.reportMd, buildReportMd(report));

  process.stdout.write(`${JSON.stringify({
    ok: true,
    status: report.status,
    report: repoRel(PATHS.reportMd),
    drivers: drivers.length,
    dirtyEntries: inventory.summary.total,
    zeroSurfaceHolds: zeroSurfaces.count,
    safeFixes: safeFixes.count,
    syntaxChecked: verification.checked,
    syntaxFailures: verification.failures,
    wave04Tasks: wave04Queue.length,
    supervisor: supervisor.counts
  }, null, 2)}\n`);
}

main();
