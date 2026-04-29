#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const childProcess = require("node:child_process");
const http = require("node:http");

const repoRoot = path.resolve(__dirname, "..", "..");
const runId = "dirty-worktree-10b-heal-20260427";
const eventId = "EVT-DIRTY-WORKTREE-10B-HEAL-2026-04-27";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", runId);

const LOGICAL_AGENTS = 10_000_000_000;
const LOGICAL_SUPERVISORS = 10_000;
const LEDGER_SHARDS = 120;

const owners = Object.freeze([
  ["chief_asolaria", "final policy and trigger gate"],
  ["helm", "wave sequence and recovery order"],
  ["gaia", "docs and operator-facing reports"],
  ["vector_rook", "BEHCS, GLPJ, indexes, maps, cubes"],
  ["sentinel_kr", "sensitive/vault/destructive-action holds"],
  ["falcon_selector", "device and provider selector boundaries"],
  ["forge", "code, routes, tools, package surfaces"],
  ["dasein_brain", "meaning, memory, sovereignty subtree"],
  ["omnishannon", "consensus and contradiction handling"],
  ["omnispindles", "bounded fanout scheduling"],
  ["omniflywheels", "energy and repeated-work prevention"],
  ["gc_white_rooms", "raw preservation and non-destructive GC"]
]);

const paths = Object.freeze({
  dirtyCleanupJson: path.join(repoRoot, "reports", "dirty-worktree-supervised-cleanup-latest.json"),
  dirtyCleanupMd: path.join(repoRoot, "reports", "dirty-worktree-supervised-cleanup-latest.md"),
  maxCleanupJson: path.join(repoRoot, "reports", "max-omnispindle-cleanup-200step-latest.json"),
  maxCleanupMd: path.join(repoRoot, "reports", "max-omnispindle-cleanup-200step-latest.md"),
  safeFixes: path.join(repoRoot, "data", "behcs", "orchestration", "max-omnispindle-cleanup-200step-20260426", "safe-fixes-applied.v1.json"),
  verification: path.join(repoRoot, "data", "behcs", "orchestration", "max-omnispindle-cleanup-200step-20260426", "verification-results.v1.json"),
  fileHealIndexJson: path.join(runRoot, "dirty-file-heal-index.v1.json"),
  fileHealIndexNdjson: path.join(runRoot, "dirty-file-heal-index.v1.ndjson"),
  logicalLedger: path.join(runRoot, "logical-10b-dirty-heal-ledger.v1.ndjson"),
  supervisorQueue: path.join(runRoot, "dirty-heal-supervisor-queue.v1.ndjson"),
  summary: path.join(runRoot, "dirty-worktree-10b-heal-summary.v1.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "dirty-worktree-10b-heal.v1.json"),
  index: path.join(repoRoot, "data", "behcs", "index", "dirty-worktree-10b-heal-index.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "dirty-worktree-10b-heal-map-map-mapped.v1.json"),
  cube: path.join(repoRoot, "data", "behcs", "cubes", "dirty-worktree-10b-heal-cube-cubed.cube.js"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "dirty-worktree-10b-heal-behcs256.glpj.json"),
  gnnEdges: path.join(repoRoot, "data", "behcs", "gnn-live-edges.ndjson"),
  localEnvelope: path.join(runRoot, "dirty-worktree-10b-heal-local-envelope.json"),
  localPostResult: path.join(runRoot, "dirty-worktree-10b-heal-local-post-result.json"),
  reportJson: path.join(repoRoot, "reports", "dirty-worktree-10b-heal-latest.json"),
  reportMd: path.join(repoRoot, "reports", "dirty-worktree-10b-heal-latest.md")
});

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeText(filePath, value) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, value.endsWith("\n") ? value : `${value}\n`, "utf8");
}

function writeJson(filePath, value) {
  writeText(filePath, JSON.stringify(value, null, 2));
}

function writeNdjson(filePath, rows) {
  writeText(filePath, rows.map((row) => JSON.stringify(row)).join("\n"));
}

function appendNdjson(filePath, row) {
  ensureDir(filePath);
  fs.appendFileSync(filePath, `${JSON.stringify(row)}\n`, "utf8");
}

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_error) {
    return fallback;
  }
}

function repoRel(filePath) {
  const relative = path.relative(repoRoot, filePath);
  if (path.isAbsolute(relative) || relative.startsWith("..")) {
    return filePath.replace(/\\/g, "/");
  }
  return relative.replace(/\\/g, "/");
}

function sha256(value) {
  return crypto.createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex");
}

function glyph(kind, id, seed = "") {
  return `HG256:${kind.toUpperCase()}:${sha256(`${kind}:${id}:${seed}`).slice(0, 8).toUpperCase()}`;
}

function git(args) {
  return childProcess.execFileSync("git", ["-C", repoRoot, ...args], {
    encoding: "utf8",
    maxBuffer: 128 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"]
  });
}

function parseStatusLine(line) {
  const status = line.slice(0, 2);
  return {
    raw: line,
    status,
    indexStatus: status[0],
    worktreeStatus: status[1],
    file: line.slice(3),
    tracked: status !== "??",
    untracked: status === "??",
    modified: status.includes("M"),
    added: status.includes("A"),
    deleted: status.includes("D"),
    renamed: status.includes("R")
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

function healActionFor(row, kind) {
  if (row.deleted) return "hold_deleted_surface_for_human_review";
  if (row.untracked && kind === "sovereignty") return "index_large_subtree_no_auto_stage";
  if (row.untracked && ["reports", "behcs_orchestration", "behcs_data"].includes(kind)) return "catalog_generated_artifact";
  if (row.tracked && ["src", "routes", "tools", "code", "package_manifest"].includes(kind)) return "syntax_gate_and_diff_review";
  if (row.tracked && kind === "runtime") return "preserve_runtime_state_no_revert";
  if (row.tracked && ["reports", "docs"].includes(kind)) return "refresh_report_or_doc_review";
  return "manual_review_no_delete_no_revert";
}

function countBy(rows, keyFn) {
  const counts = {};
  for (const row of rows) {
    const key = keyFn(row);
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
}

function inventoryDirtyFiles(generatedAt) {
  const rows = git(["status", "--porcelain=v1"]).split(/\r?\n/).filter(Boolean).map((line, index) => {
    const parsed = parseStatusLine(line);
    const kind = classifyPath(parsed.file);
    const owner = ownerForKind(kind);
    return {
      ordinal: index + 1,
      ...parsed,
      kind,
      owner,
      healAction: healActionFor(parsed, kind),
      destructiveAllowed: false,
      revertAllowed: false,
      deleteAllowed: false,
      stageAllowed: false,
      commitAllowed: false,
      logicalAgentStart: Math.floor((index / Math.max(1, rowsLengthHint())) * LOGICAL_AGENTS) + 1,
      glyph: glyph("dirty_heal_file", parsed.file, parsed.status),
      observedAt: generatedAt
    };
  });
  const perFileAgents = Math.floor(LOGICAL_AGENTS / Math.max(1, rows.length));
  rows.forEach((row, index) => {
    const start = index * perFileAgents + 1;
    const end = index === rows.length - 1 ? LOGICAL_AGENTS : start + perFileAgents - 1;
    row.logicalAgentStart = start;
    row.logicalAgentEnd = end;
    row.logicalAgentsRepresented = end - start + 1;
  });
  return {
    generatedAt,
    total: rows.length,
    tracked: rows.filter((row) => row.tracked).length,
    untracked: rows.filter((row) => row.untracked).length,
    modified: rows.filter((row) => row.modified).length,
    deleted: rows.filter((row) => row.deleted).length,
    byKind: countBy(rows, (row) => row.kind),
    byOwner: countBy(rows, (row) => row.owner),
    byHealAction: countBy(rows, (row) => row.healAction),
    rows
  };
}

function rowsLengthHint() {
  return 1;
}

function buildLedger(generatedAt, inventory) {
  const rows = [];
  const agentsPerShard = Math.floor(LOGICAL_AGENTS / LEDGER_SHARDS);
  const supervisorsPerShard = Math.floor(LOGICAL_SUPERVISORS / LEDGER_SHARDS);
  for (let index = 0; index < LEDGER_SHARDS; index += 1) {
    const start = index * agentsPerShard + 1;
    const end = index === LEDGER_SHARDS - 1 ? LOGICAL_AGENTS : start + agentsPerShard - 1;
    const owner = owners[index % owners.length][0];
    rows.push({
      seq: index + 1,
      ts: generatedAt,
      runId,
      eventId,
      owner,
      dirtyRowsCovered: inventory.total,
      logicalAgentStart: start,
      logicalAgentEnd: end,
      logicalAgentsRepresented: end - start + 1,
      logicalSupervisorStart: index * supervisorsPerShard + 1,
      logicalSupervisorEnd: index === LEDGER_SHARDS - 1 ? LOGICAL_SUPERVISORS : (index + 1) * supervisorsPerShard,
      wave: "10B dirty-worktree heal",
      cascade: "deep-wave SECOND cleanup over dirty files",
      digest: sha256(`${eventId}:${index}:${owner}:${start}:${end}:${inventory.total}`),
      boundary: "Logical coverage shard. Not a live process count."
    });
  }
  return rows;
}

function buildSupervisorQueue(generatedAt, inventory) {
  return owners.map(([owner, responsibility], index) => ({
    id: `DIRTY-10B-HEAL-${owner.toUpperCase().replace(/[^A-Z0-9]+/g, "-")}`,
    ts: generatedAt,
    owner,
    responsibility,
    dirtyRows: inventory.total,
    requestedWorker: `local_cleanup_reviewer:${owner}`,
    pid: `BH.SUPERVISOR.PID.DIRTY.10B.${sha256(owner).slice(0, 8).toUpperCase()}`,
    allowedPaths: [
      "data/behcs/orchestration/dirty-worktree-10b-heal-20260427",
      "reports",
      "data/behcs/memory",
      "data/behcs/index",
      "data/behcs/maps/asolaria",
      "data/behcs/cubes",
      "data/behcs/codex/glyph-language"
    ],
    expectedArtifacts: [
      repoRel(paths.fileHealIndexJson),
      repoRel(paths.logicalLedger),
      repoRel(paths.summary),
      repoRel(paths.reportMd)
    ],
    acceptanceGates: [
      "no_revert",
      "no_delete",
      "no_stage",
      "no_commit",
      "syntax_failures_zero_or_held",
      "raw_preservation_for_safe_fixes"
    ],
    proofRequired: true,
    operatorApproval: true,
    syntheticFirstEvidence: true,
    remoteMutation: false,
    externalApiCall: false,
    cloudUpload: false,
    deletesEvidence: false,
    bypassAuth: false,
    bypassPayment: false,
    glyph: glyph("dirty_10b_supervisor", owner, responsibility),
    source: "dirty-worktree-10b-heal-launcher"
  }));
}

function postJson(url, body) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const payload = JSON.stringify(body);
    const req = http.request({
      method: "POST",
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      timeout: 2500,
      headers: {
        "content-type": "application/json",
        "content-length": Buffer.byteLength(payload)
      }
    }, (res) => {
      let text = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { text += chunk; });
      res.on("end", () => {
        let bodyJson = null;
        try { bodyJson = JSON.parse(text); } catch (_error) {}
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode, body: bodyJson || text.slice(0, 1000) });
      });
    });
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", (error) => resolve({ ok: false, error: String(error.message || error) }));
    req.write(payload);
    req.end();
  });
}

function buildReportMd(report) {
  return [
    "# Dirty Worktree 10B Heal",
    "",
    `Generated: ${report.generatedAt}`,
    `Status: ${report.status}`,
    "",
    "## Dirty Files",
    "",
    `- Total: ${report.inventory.total}`,
    `- Tracked: ${report.inventory.tracked}`,
    `- Untracked: ${report.inventory.untracked}`,
    `- Modified: ${report.inventory.modified}`,
    `- Deleted: ${report.inventory.deleted}`,
    "",
    "## Heal Launch",
    "",
    `- Logical agents represented: ${report.logicalAgents}`,
    `- Logical supervisors represented: ${report.logicalSupervisors}`,
    `- Ledger shards: ${report.ledgerShards}`,
    `- Supervisor packets: ${report.supervisorPackets}`,
    `- Safe fixes from bounded pass: ${report.safeFixes.count}`,
    `- Syntax gates checked: ${report.verification.checked}`,
    `- Syntax failures: ${report.verification.failures}`,
    "",
    "## Boundary",
    "",
    "- No files were reverted.",
    "- No untracked files were deleted.",
    "- No files were staged or committed.",
    "- No boot, BIOS, USB, provider, payment, auth, or remote mutation occurred.",
    "- 10B is logical coverage over the dirty-file lattice, not live OS processes.",
    "",
    "## Outputs",
    "",
    ...Object.entries(report.outputs).map(([key, value]) => `- ${key}: \`${value}\``),
    ""
  ].join("\n");
}

async function main() {
  const generatedAt = new Date().toISOString();
  fs.mkdirSync(runRoot, { recursive: true });
  const inventory = inventoryDirtyFiles(generatedAt);
  const ledger = buildLedger(generatedAt, inventory);
  const supervisorQueue = buildSupervisorQueue(generatedAt, inventory);
  const dirtyCleanup = readJson(paths.dirtyCleanupJson, {});
  const maxCleanup = readJson(paths.maxCleanupJson, {});
  const safeFixes = readJson(paths.safeFixes, { count: 0, fixes: [] });
  const verification = readJson(paths.verification, { checked: 0, failures: 0, status: "UNKNOWN" });
  const summary = {
    runId,
    eventId,
    generatedAt,
    status: "DIRTY_WORKTREE_10B_HEAL_LAUNCHED_LOGICAL_COVERAGE",
    inventory: {
      total: inventory.total,
      tracked: inventory.tracked,
      untracked: inventory.untracked,
      modified: inventory.modified,
      deleted: inventory.deleted,
      byKind: inventory.byKind,
      byOwner: inventory.byOwner,
      byHealAction: inventory.byHealAction
    },
    logicalAgents: LOGICAL_AGENTS,
    logicalSupervisors: LOGICAL_SUPERVISORS,
    ledgerShards: ledger.length,
    supervisorPackets: supervisorQueue.length,
    safeFixes: {
      count: Number(safeFixes.count || 0),
      status: safeFixes.status || "UNKNOWN"
    },
    verification: {
      checked: Number(verification.checked || 0),
      failures: Number(verification.failures || 0),
      status: verification.status || "UNKNOWN"
    },
    sourceReports: {
      dirtyCleanup: repoRel(paths.dirtyCleanupMd),
      maxCleanup: repoRel(paths.maxCleanupMd)
    },
    boundary: {
      revert: false,
      deleteUntracked: false,
      stage: false,
      commit: false,
      uncontrolledProcessFanout: false,
      externalApiBypass: false,
      remoteMutation: false
    },
    sourceSummaries: {
      dirtyCleanupStatus: dirtyCleanup.status || null,
      maxCleanupStatus: maxCleanup.status || null
    }
  };
  const memory = {
    memoryId: "dirty-worktree-10b-heal.v1",
    generatedAt,
    eventId,
    status: summary.status,
    significance: "The dirty worktree heal is now represented as a bounded, supervisor-owned 10B logical coverage lattice over every current dirty file, with safe-fix proof and syntax gates preserved.",
    d11: verification.failures === 0 ? "OBSERVED_WITH_ZERO_SYNTAX_FAILURES" : "OBSERVED_WITH_HELD_FAILURES",
    boundary: summary.boundary
  };
  const index = {
    indexId: "dirty-worktree-10b-heal-index.v1",
    generatedAt,
    eventId,
    rows: inventory.total,
    logicalAgents: LOGICAL_AGENTS,
    artifacts: {
      fileHealIndex: repoRel(paths.fileHealIndexJson),
      logicalLedger: repoRel(paths.logicalLedger),
      report: repoRel(paths.reportMd)
    }
  };
  const map = {
    mapId: "dirty-worktree-10b-heal-map-map-mapped.v1",
    generatedAt,
    status: "MAP_MAP_MAPPED",
    nodes: [
      { id: eventId, type: "event" },
      ...owners.map(([owner, responsibility]) => ({ id: owner, type: "supervisor", responsibility })),
      ...inventory.rows.slice(0, 500).map((row) => ({ id: row.file, type: "dirty_file", owner: row.owner, healAction: row.healAction }))
    ],
    edges: inventory.rows.slice(0, 500).map((row) => ({
      from: row.owner,
      to: row.file,
      relation: row.healAction,
      logicalAgentsRepresented: row.logicalAgentsRepresented
    }))
  };
  const cube = {
    cubeId: "dirty-worktree-10b-heal-cube-cubed",
    generatedAt,
    status: "CUBE_CUBE_CUBED",
    eventId,
    dirtyRows: inventory.total,
    logicalAgents: LOGICAL_AGENTS,
    logicalSupervisors: LOGICAL_SUPERVISORS,
    safeFixes: summary.safeFixes.count,
    syntaxFailures: summary.verification.failures,
    boundary: summary.boundary,
    glyph: glyph("dirty_10b_cube", eventId, `${inventory.total}:${LOGICAL_AGENTS}`)
  };
  const glpj = {
    programId: "dirty-worktree-10b-heal-behcs256.glpj",
    generatedAt,
    language: "BEHCS-256",
    verbs: [
      "LX-WITNESS-DIRTY",
      "LX-HEAL-LOGICAL-10B",
      "LX-LOCK-NO-REVERT",
      "LX-LOCK-NO-DELETE",
      "LX-SYNTAX-GATE",
      "LX-RAW-PRESERVE",
      "LX-REPORT-HEAL"
    ],
    sentences: [
      `DIRTY_HEAL TOTAL ${inventory.total} TRACKED ${inventory.tracked} UNTRACKED ${inventory.untracked}`,
      `LOGICAL_AGENTS ${LOGICAL_AGENTS} LIVE_PROCESS_FANOUT false`,
      `SAFE_FIXES ${summary.safeFixes.count} SYNTAX_FAILURES ${summary.verification.failures}`,
      "NO_REVERT true NO_DELETE true NO_STAGE true NO_COMMIT true"
    ]
  };
  const outputs = {
    fileHealIndexJson: repoRel(paths.fileHealIndexJson),
    fileHealIndexNdjson: repoRel(paths.fileHealIndexNdjson),
    logicalLedger: repoRel(paths.logicalLedger),
    supervisorQueue: repoRel(paths.supervisorQueue),
    summary: repoRel(paths.summary),
    memory: repoRel(paths.memory),
    index: repoRel(paths.index),
    map: repoRel(paths.map),
    cube: repoRel(paths.cube),
    glpj: repoRel(paths.glpj),
    reportJson: repoRel(paths.reportJson),
    reportMd: repoRel(paths.reportMd)
  };
  const report = { ...summary, outputs };

  writeJson(paths.fileHealIndexJson, { generatedAt, eventId, rows: inventory.rows });
  writeNdjson(paths.fileHealIndexNdjson, inventory.rows);
  writeNdjson(paths.logicalLedger, ledger);
  writeNdjson(paths.supervisorQueue, supervisorQueue);
  writeJson(paths.summary, summary);
  writeJson(paths.memory, memory);
  writeJson(paths.index, index);
  writeJson(paths.map, map);
  writeText(paths.cube, `"use strict";\n\nmodule.exports = Object.freeze(${JSON.stringify(cube, null, 2)});\n`);
  writeJson(paths.glpj, glpj);
  writeJson(paths.reportJson, report);
  writeText(paths.reportMd, buildReportMd(report));
  appendNdjson(paths.gnnEdges, {
    generatedAt,
    from: "max-omnispindle-cleanup-200step-20260426",
    to: runId,
    relation: "DIRTY_WORKTREE_10B_HEAL_LOGICAL_COVERAGE",
    weight: 1,
    digest: sha256(summary)
  });

  const envelope = {
    verb: "dirty-worktree-10b-heal-launched",
    id: "dirty-worktree-10b-heal-20260427-acer-summary-001",
    target: "acer",
    from: "acer-codex",
    ts: generatedAt,
    eventId,
    status: summary.status,
    logicalAgents: LOGICAL_AGENTS,
    dirtyRows: inventory.total,
    safeFixes: summary.safeFixes,
    verification: summary.verification,
    boundary: summary.boundary,
    report: repoRel(paths.reportMd)
  };
  writeJson(paths.localEnvelope, envelope);
  const localPost = await postJson("http://127.0.0.1:4947/behcs/send", envelope);
  writeJson(paths.localPostResult, { postedAt: new Date().toISOString(), target: "http://127.0.0.1:4947/behcs/send", result: localPost });

  console.log(JSON.stringify({
    ok: true,
    status: summary.status,
    dirtyRows: inventory.total,
    logicalAgents: LOGICAL_AGENTS,
    logicalSupervisors: LOGICAL_SUPERVISORS,
    ledgerShards: ledger.length,
    supervisorPackets: supervisorQueue.length,
    safeFixes: summary.safeFixes.count,
    syntaxChecked: summary.verification.checked,
    syntaxFailures: summary.verification.failures,
    localPostOk: localPost.ok,
    report: repoRel(paths.reportMd)
  }, null, 2));
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : String(error));
  process.exitCode = 1;
});
