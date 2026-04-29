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
const classificationRoot = path.join(runRoot, "dirty-worktree-classification");

const INPUTS = Object.freeze({
  bilateralSeal: path.join(runRoot, "bilateral-promotion-seal", "dual-computer-upgrade-bilateral-promotion-seal.v1.json"),
  postsealSeal: path.join(runRoot, "postseal-mirror-seal", "dual-computer-upgrade-postseal-mirror-seal.v1.json")
});

const OUTPUTS = Object.freeze({
  classificationJson: path.join(classificationRoot, "dirty-worktree-classification.v1.json"),
  classificationNdjson: path.join(classificationRoot, "dirty-worktree-classification.v1.ndjson"),
  supervisorQueue: path.join(classificationRoot, "dirty-worktree-supervisor-queue.v1.ndjson"),
  supervisorQueueJson: path.join(classificationRoot, "dirty-worktree-supervisor-queue.v1.json"),
  lirisEnvelope: path.join(classificationRoot, "liris-dirty-worktree-classification-handoff-envelope.json"),
  lirisPostResult: path.join(classificationRoot, "liris-dirty-worktree-classification-handoff-post-result.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "dual-computer-upgrade-dirty-worktree-classification.v1.json"),
  index: path.join(repoRoot, "data", "behcs", "index", "dual-computer-upgrade-dirty-worktree-classification-index.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "dual-computer-upgrade-dirty-worktree-classification-map-map-mapped.v1.json"),
  cube: path.join(repoRoot, "data", "behcs", "cubes", "dual-computer-upgrade-dirty-worktree-classification-cube-cubed.cube.js"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "dual-computer-upgrade-dirty-worktree-classification-behcs256.glpj.json"),
  reportJson: path.join(repoRoot, "reports", "dual-computer-upgrade-dirty-worktree-classification-latest.json"),
  reportMd: path.join(repoRoot, "reports", "dual-computer-upgrade-dirty-worktree-classification-latest.md")
});

const CLASSIFICATION_ORDER = Object.freeze([
  "sensitive_or_vault_adjacent_hold",
  "delete_hold",
  "rename_review_required",
  "dual_upgrade_artifact_current_run",
  "unison_artifact_current_run",
  "processor_unification_artifact_current_run",
  "openclaw_or_research_artifact_review",
  "source_code_review_required",
  "runtime_state_preserve",
  "docs_canon_review_required",
  "sovereignty_subtree_review_required",
  "behcs_language_data_review",
  "reports_generated_review",
  "test_review_required",
  "unknown_manual_review"
]);

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

function writeNdjson(filePath, rows) {
  writeText(filePath, rows.map((row) => JSON.stringify(row)).join("\n"));
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
  if (path.isAbsolute(relative) || relative.startsWith("..")) return filePath.replace(/\\/g, "/");
  return relative.replace(/\\/g, "/");
}

function sha(value) {
  return crypto.createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex");
}

function pid(prefix, seed) {
  const n = BigInt(`0x${sha(seed).slice(0, 15)}`) % 1000000000000n;
  return `BH.${prefix}.PID.${String(n).padStart(12, "0")}`;
}

function parseStatusLine(line) {
  const status = line.slice(0, 2);
  const rawPath = line.slice(3);
  const renamed = status.includes("R") || rawPath.includes(" -> ");
  const renameParts = renamed ? rawPath.split(" -> ") : null;
  const file = renameParts ? renameParts[renameParts.length - 1] : rawPath;
  return {
    raw: line,
    status,
    indexStatus: status[0],
    worktreeStatus: status[1],
    file,
    renameFrom: renameParts && renameParts.length > 1 ? renameParts[0] : null,
    tracked: status !== "??",
    untracked: status === "??",
    modified: status.includes("M"),
    added: status.includes("A"),
    deleted: status.includes("D"),
    renamed
  };
}

function gitStatusRows() {
  const result = spawnSync("git", ["status", "--short", "--untracked-files=all"], {
    cwd: repoRoot,
    encoding: "utf8",
    timeout: 30000,
    windowsHide: true
  });
  if (result.status !== 0) {
    const message = `${result.stderr || result.stdout || "git status failed"}`.trim();
    throw new Error(message);
  }
  return (result.stdout || "").split(/\r?\n/).filter(Boolean).map(parseStatusLine);
}

function normalize(file) {
  return file.replace(/\\/g, "/");
}

function lowerPath(file) {
  return normalize(file).toLowerCase();
}

function isSensitivePath(file) {
  const lower = lowerPath(file);
  return [
    ".env",
    "secret",
    "token",
    "password",
    "credential",
    "cmdkey",
    "vault",
    "approle",
    "private-key",
    "apikey",
    "api-key"
  ].some((needle) => lower.includes(needle));
}

function classifyPath(row) {
  const file = normalize(row.file);
  const lower = file.toLowerCase();

  if (isSensitivePath(file)) return "sensitive_or_vault_adjacent_hold";
  if (row.deleted) return "delete_hold";
  if (row.renamed) return "rename_review_required";
  if (
    lower.startsWith("data/behcs/orchestration/dual-computer-upgrade-20260427/") ||
    lower.startsWith("reports/dual-computer-upgrade-") ||
    lower.startsWith("tools/behcs/dual-computer-upgrade-")
  ) return "dual_upgrade_artifact_current_run";
  if (
    lower.startsWith("data/behcs/orchestration/unison-liris-acer-20260426/") ||
    lower.startsWith("reports/unison-") ||
    lower.startsWith("tools/behcs/unison-")
  ) return "unison_artifact_current_run";
  if (
    lower.startsWith("data/behcs/orchestration/processor-unification-") ||
    lower.startsWith("reports/processor-unification-") ||
    lower.startsWith("tools/behcs/processor-unification-")
  ) return "processor_unification_artifact_current_run";
  if (
    lower.includes("openclaw") ||
    lower.includes("openmythos") ||
    lower.includes("gemma") ||
    lower.includes("mlc") ||
    lower.includes("biml") ||
    lower.includes("deep-wave")
  ) return "openclaw_or_research_artifact_review";
  if (lower.startsWith("runtime/") || lower.startsWith("logs/") || lower.includes("/inbox.ndjson")) return "runtime_state_preserve";
  if (lower.startsWith("sovereignty/")) return "sovereignty_subtree_review_required";
  if (lower.startsWith("reports/")) return "reports_generated_review";
  if (
    lower.startsWith("data/behcs/") ||
    lower.startsWith("data/votes/") ||
    lower.startsWith("ix/") ||
    lower.includes("glyph") ||
    lower.includes("cube") ||
    lower.includes("map-map")
  ) return "behcs_language_data_review";
  if (lower.startsWith("tests/") || lower.includes(".test.") || lower.includes(".spec.")) return "test_review_required";
  if (
    lower.startsWith("src/") ||
    lower.startsWith("routes/") ||
    lower.startsWith("tools/") ||
    lower === "server.js" ||
    lower === "package.json" ||
    lower === "package-lock.json"
  ) return "source_code_review_required";
  if (
    lower.endsWith(".md") ||
    lower.startsWith("docs/") ||
    lower.startsWith("brown-hilbert/") ||
    ["brown-hilbert.md", "claude.md", "codex.md", "phone-urls.md", "tasks.md"].includes(lower)
  ) return "docs_canon_review_required";
  return "unknown_manual_review";
}

function ownerForClassification(classification) {
  if (classification === "sensitive_or_vault_adjacent_hold") return "sentinel_kr";
  if (classification === "delete_hold" || classification === "rename_review_required") return "sentinel_kr";
  if (classification === "dual_upgrade_artifact_current_run") return "hermes";
  if (classification === "unison_artifact_current_run") return "hermes";
  if (classification === "processor_unification_artifact_current_run") return "helm";
  if (classification === "openclaw_or_research_artifact_review") return "dasein_brain";
  if (classification === "source_code_review_required") return "forge";
  if (classification === "runtime_state_preserve") return "sentinel_kr";
  if (classification === "docs_canon_review_required") return "gaia";
  if (classification === "sovereignty_subtree_review_required") return "dasein_brain";
  if (classification === "behcs_language_data_review") return "vector_rook";
  if (classification === "reports_generated_review") return "gaia";
  if (classification === "test_review_required") return "forge";
  return "helm";
}

function actionForClassification(classification) {
  if (classification === "sensitive_or_vault_adjacent_hold") return "sentinel_hold_no_echo_no_cleanup";
  if (classification === "delete_hold") return "delete_hold_no_restore_no_stage_until_review";
  if (classification === "rename_review_required") return "rename_hold_review_pair_before_stage";
  if (classification === "dual_upgrade_artifact_current_run") return "retain_current_run_artifact";
  if (classification === "unison_artifact_current_run") return "retain_unison_artifact";
  if (classification === "processor_unification_artifact_current_run") return "retain_processor_unification_artifact";
  if (classification === "openclaw_or_research_artifact_review") return "review_research_ingestion_before_promotion";
  if (classification === "source_code_review_required") return "review_diff_then_run_targeted_checks";
  if (classification === "runtime_state_preserve") return "preserve_or_gitignore_runtime_state";
  if (classification === "docs_canon_review_required") return "review_canon_diff_before_promotion";
  if (classification === "sovereignty_subtree_review_required") return "review_large_subtree_before_tracking";
  if (classification === "behcs_language_data_review") return "review_language_data_append_only";
  if (classification === "reports_generated_review") return "catalog_generated_report";
  if (classification === "test_review_required") return "run_targeted_test_review";
  return "manual_review_no_revert";
}

function statusBucket(row) {
  if (row.untracked) return "untracked";
  if (row.deleted) return "deleted";
  if (row.renamed) return "renamed";
  if (row.modified) return "modified";
  if (row.added) return "added";
  return "other";
}

function countBy(rows, key) {
  const counts = {};
  for (const row of rows) {
    const value = typeof key === "function" ? key(row) : row[key];
    counts[value] = (counts[value] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort((a, b) => {
    const orderA = CLASSIFICATION_ORDER.indexOf(a[0]);
    const orderB = CLASSIFICATION_ORDER.indexOf(b[0]);
    if (orderA !== -1 || orderB !== -1) return (orderA === -1 ? 999 : orderA) - (orderB === -1 ? 999 : orderB);
    return b[1] - a[1] || a[0].localeCompare(b[0]);
  }));
}

function buildSupervisorQueue(rows, generatedAt) {
  const groups = new Map();
  for (const row of rows) {
    const key = `${row.owner}|${row.classification}|${row.action}`;
    const existing = groups.get(key) || {
      id: `dirty-worktree-supervisor-task-${String(groups.size + 1).padStart(3, "0")}`,
      generatedAt,
      runId,
      eventId,
      owner: row.owner,
      supervisorPid: row.supervisorPid,
      classification: row.classification,
      action: row.action,
      fileCount: 0,
      statusCounts: {},
      examples: [],
      destructiveAllowed: false,
      remoteWritesAllowed: false,
      processFanoutAllowed: false
    };
    existing.fileCount += 1;
    existing.statusCounts[row.statusBucket] = (existing.statusCounts[row.statusBucket] || 0) + 1;
    if (existing.examples.length < 12) existing.examples.push(row.file);
    groups.set(key, existing);
  }
  return [...groups.values()].sort((a, b) => {
    const ownerCompare = a.owner.localeCompare(b.owner);
    if (ownerCompare) return ownerCompare;
    return b.fileCount - a.fileCount;
  });
}

function healthProbe(url, timeoutMs = 4000) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path: `${parsed.pathname}${parsed.search}`,
      method: "GET",
      headers: { connection: "close" },
      timeout: timeoutMs
    }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        let body = text;
        try {
          body = JSON.parse(text);
        } catch (_error) {
          // Keep raw text.
        }
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode, body });
      });
    });
    req.on("timeout", () => req.destroy(new Error("request_timeout")));
    req.on("error", (error) => resolve({ ok: false, error: error.message }));
    req.end();
  });
}

function httpJson(method, url, body) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const payload = Buffer.from(JSON.stringify(body), "utf8");
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path: `${parsed.pathname}${parsed.search}`,
      method,
      headers: {
        "content-type": "application/json",
        "content-length": payload.length,
        connection: "close"
      },
      timeout: 10000
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
    req.write(payload);
    req.end();
  });
}

function reportTable(counts) {
  return Object.entries(counts).map(([name, count]) => `- ${name}: ${count}`).join("\n");
}

async function run() {
  const generatedAt = new Date().toISOString();
  const bilateralSeal = readJson(INPUTS.bilateralSeal, {});
  const postsealSeal = readJson(INPUTS.postsealSeal, {});
  const rawRows = gitStatusRows();
  const rows = rawRows.map((row, index) => {
    const classification = classifyPath(row);
    const owner = ownerForClassification(classification);
    const action = actionForClassification(classification);
    const filePid = pid("FILE", `${row.status}:${row.file}:${classification}`);
    const supervisorPid = pid("SUP", `${owner}:${classification}`);
    return {
      ordinal: index + 1,
      ...row,
      statusBucket: statusBucket(row),
      classification,
      owner,
      action,
      filePid,
      supervisorPid,
      destructiveAllowed: false,
      remoteWritesAllowed: false,
      processFanoutAllowed: false
    };
  });

  const queue = buildSupervisorQueue(rows, generatedAt);
  const counts = {
    total: rows.length,
    byStatus: countBy(rows, "statusBucket"),
    byClassification: countBy(rows, "classification"),
    byOwner: countBy(rows, "owner"),
    sensitiveOrVaultAdjacentHolds: rows.filter((row) => row.classification === "sensitive_or_vault_adjacent_hold").length,
    deleteHolds: rows.filter((row) => row.classification === "delete_hold").length,
    renameHolds: rows.filter((row) => row.classification === "rename_review_required").length,
    currentRunArtifacts: rows.filter((row) => row.classification === "dual_upgrade_artifact_current_run").length
  };
  const health = {
    acerLaw001: await healthProbe("http://127.0.0.1:4947/behcs/health"),
    lirisLaw001: await healthProbe("http://192.168.100.2:4947/behcs/health")
  };
  const status = counts.total > 0
    ? "DUAL_COMPUTER_UPGRADE_DIRTY_WORKTREE_CLASSIFIED_REVIEW_REQUIRED"
    : "DUAL_COMPUTER_UPGRADE_DIRTY_WORKTREE_CLEAN";
  const classification = {
    id: "dual-computer-upgrade-dirty-worktree-classification.v1",
    generatedAt,
    runId,
    eventId,
    status,
    d11: "OBSERVED_LOCAL_GIT_STATUS_WITH_BILATERAL_POSTSEAL_CONTEXT",
    baseSeals: {
      bilateralPromotionSealSha256: bilateralSeal.sealSha256 || null,
      postsealVerificationSealSha256: postsealSeal.postsealSealSha256 || null
    },
    counts,
    health,
    rows,
    supervisorQueue: repoRel(OUTPUTS.supervisorQueue),
    boundary: "Classification and supervisor routing only. No delete, revert, stage, commit, live model call, process fanout, or remote file write."
  };
  writeJson(OUTPUTS.classificationJson, classification);
  writeNdjson(OUTPUTS.classificationNdjson, rows);
  writeNdjson(OUTPUTS.supervisorQueue, queue);
  writeJson(OUTPUTS.supervisorQueueJson, {
    id: "dirty-worktree-supervisor-queue.v1",
    generatedAt,
    runId,
    eventId,
    taskCount: queue.length,
    tasks: queue,
    boundary: classification.boundary
  });

  writeJson(OUTPUTS.memory, {
    type: "behcs-memory",
    id: "memory-dual-computer-upgrade-dirty-worktree-classification-v1",
    generatedAt,
    runId,
    eventId,
    status,
    summary: `Classified ${counts.total} dirty worktree rows into ${Object.keys(counts.byClassification).length} supervisor buckets before cleanup.`,
    source: repoRel(OUTPUTS.classificationJson),
    postsealVerificationSealSha256: postsealSeal.postsealSealSha256 || null
  });
  writeJson(OUTPUTS.index, {
    id: "dual-computer-upgrade-dirty-worktree-classification-index-v1",
    generatedAt,
    keys: ["dual-computer-upgrade", "dirty-worktree", "supervisor-routing", "no-delete", "no-fanout"],
    counts,
    artifacts: {
      classification: repoRel(OUTPUTS.classificationJson),
      classificationNdjson: repoRel(OUTPUTS.classificationNdjson),
      supervisorQueue: repoRel(OUTPUTS.supervisorQueue),
      report: repoRel(OUTPUTS.reportMd),
      map: repoRel(OUTPUTS.map),
      cube: repoRel(OUTPUTS.cube),
      glpj: repoRel(OUTPUTS.glpj)
    }
  });
  writeJson(OUTPUTS.map, {
    id: "dual-computer-upgrade-dirty-worktree-classification-map-map-mapped-v1",
    generatedAt,
    route: ["git-status", "classify", "supervisor-pid-indicate", "queue", "liris-handoff", "review-gates"],
    owners: Object.keys(counts.byOwner),
    classifications: Object.keys(counts.byClassification),
    boundary: classification.boundary
  });
  const cubeObject = {
    id: "dual-computer-upgrade-dirty-worktree-classification-cube-cubed-v1",
    generatedAt,
    runId,
    eventId,
    status,
    totalRows: counts.total,
    supervisorTasks: queue.length,
    owners: counts.byOwner,
    classifications: counts.byClassification,
    liveModelCalls: 0,
    processFanout: 0,
    remoteWritesPerformed: 0
  };
  writeText(OUTPUTS.cube, `const dualComputerUpgradeDirtyWorktreeClassificationCube = Object.freeze(${JSON.stringify(cubeObject, null, 2)});

export const CUBE = dualComputerUpgradeDirtyWorktreeClassificationCube;
export default dualComputerUpgradeDirtyWorktreeClassificationCube;
`);
  writeJson(OUTPUTS.glpj, {
    id: "dual-computer-upgrade-dirty-worktree-classification-behcs256-glpj-v1",
    generatedAt,
    sentences: [
      "META-CLASSIFY { WORKTREE.DIRTY } · MAP-MAP-MAPPED · CUBE-CUBE-CUBED · SUPERVISOR-PID-INDICATED @ M-INDICATIVE .",
      "META-GATE { CLEANUP } · NO-DELETE · NO-REVERT · NO-STAGE · REVIEW-FIRST @ M-IMPERATIVE .",
      "META-HANDOFF { LIRIS.MIRROR } · LAW-001 · CLASSIFICATION-ONLY · REMOTE-WRITES-0 @ M-INTERROGATIVE ."
    ]
  });

  const envelope = {
    verb: "dual-computer-upgrade-dirty-worktree-classification-handoff",
    target: "liris",
    from: "acer-codex",
    id: "dual-computer-upgrade-2026-04-27-acer-dirty-worktree-classification-001",
    ts: generatedAt,
    runId,
    eventId,
    status,
    counts,
    supervisorTaskCount: queue.length,
    request: "Mirror this classification against Liris-owned local state and return classification/holds only. No remote file writes.",
    artifacts: {
      classification: repoRel(OUTPUTS.classificationJson),
      supervisorQueue: repoRel(OUTPUTS.supervisorQueue),
      report: repoRel(OUTPUTS.reportMd)
    },
    glyph_sentence: "META-CLASSIFY { ACER.WORKTREE } · SUPERVISOR-QUEUE · REVIEW-GATES · LIRIS-MIRROR-REQUEST @ M-INTERROGATIVE .",
    boundary: classification.boundary,
    remoteWritesPerformed: 0,
    liveModelCalls: 0,
    processFanout: 0
  };
  writeJson(OUTPUTS.lirisEnvelope, envelope);
  const lirisPostResult = await httpJson("POST", "http://192.168.100.2:4947/behcs/send", envelope);
  writeJson(OUTPUTS.lirisPostResult, {
    postedAt: new Date().toISOString(),
    endpoint: "http://192.168.100.2:4947/behcs/send",
    ...lirisPostResult
  });

  const report = { reportId: "dual-computer-upgrade-dirty-worktree-classification-latest", generatedAt, classification, supervisorQueue: queue, lirisPostResult };
  writeJson(OUTPUTS.reportJson, report);
  writeText(OUTPUTS.reportMd, `# Dual Computer Upgrade Dirty Worktree Classification

Generated: ${generatedAt}

Status: ${status}

Rows:
- total: ${counts.total}
- supervisor tasks: ${queue.length}
- sensitive/vault-adjacent holds: ${counts.sensitiveOrVaultAdjacentHolds}
- delete holds: ${counts.deleteHolds}
- rename holds: ${counts.renameHolds}
- current dual-upgrade artifacts: ${counts.currentRunArtifacts}

By status:
${reportTable(counts.byStatus)}

By owner:
${reportTable(counts.byOwner)}

By classification:
${reportTable(counts.byClassification)}

LAW-001:
- Acer local bus ok: ${health.acerLaw001.ok}
- Liris bus ok: ${health.lirisLaw001.ok}
- Liris handoff posted: ${lirisPostResult.ok}

Boundary: ${classification.boundary}
`);

  console.log(JSON.stringify({
    ok: true,
    status,
    totalRows: counts.total,
    supervisorTasks: queue.length,
    sensitiveOrVaultAdjacentHolds: counts.sensitiveOrVaultAdjacentHolds,
    deleteHolds: counts.deleteHolds,
    renameHolds: counts.renameHolds,
    lirisPosted: lirisPostResult.ok,
    report: repoRel(OUTPUTS.reportMd)
  }, null, 2));
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
