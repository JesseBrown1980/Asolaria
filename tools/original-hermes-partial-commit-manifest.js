#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const READINESS_JSON = path.join(ROOT, "reports", "original-hermes-github-update-readiness-latest.json");
const REPORT_JSON = path.join(ROOT, "reports", "original-hermes-partial-commit-manifest-latest.json");
const REPORT_MD = path.join(ROOT, "reports", "original-hermes-partial-commit-manifest-latest.md");
const STATE_JSON = path.join(ROOT, "data", "behcs", "original-hermes-agent", "partial-commit-manifest-latest.json");

const ALLOWED_PREFIXES = [
  "src/behcs/originalHermes",
  "tools/original-hermes-",
  "reports/original-hermes-agent-",
  "reports/original-hermes-github-",
  "reports/original-hermes-partial-",
  "reports/original-hermes-manual-",
  "reports/original-hermes-route-",
  "data/behcs/original-hermes-agent/",
  "data/behcs/maps/original-hermes-agent/",
  "data/behcs/supervisors/original-hermes-agent/"
];

const ALLOWED_EXACT = new Set([
  "routes/workerRouter.js",
  "routes/hooks.js",
  "src/connectors/hooksConnector.js",
  "TASKS.md"
]);

const MANUAL_HUNK_REVIEW_PATHS = new Set([
  "routes/workerRouter.js",
  "routes/hooks.js",
  "src/connectors/hooksConnector.js",
  "TASKS.md"
]);

const BLOCKED_PREFIXES = [
  ".env",
  ".external/",
  "runtime/admin-terminals/",
  "runtime/outbound-",
  "runtime/dasein-",
  "tmp/",
  "captures/",
  "data/behcs/d0-runtime/",
  "data/behcs/garbage-collector/message-paths.ndjson"
];

const REQUIRED_STAGE_PATHS = [
  "src/behcs/originalHermesAgentContracts.js",
  "src/behcs/originalHermesTransportRouter.js",
  "src/behcs/originalHermesLearningLoop.js",
  "src/behcs/originalHermesWalState.js",
  "src/behcs/originalHermesSecurityBackport.js",
  "src/behcs/originalHermesRuntimeIndex.js"
];

const HIGH_RISK_SECRET_PATTERNS = [
  /\b(?:api[_-]?key|access[_-]?token|refresh[_-]?token|client[_-]?secret|password)\b\s*[:=]\s*["'][^"'\r\n]{12,}["']/i,
  /\bAuthorization\b\s*[:=]\s*["']Bearer\s+[^"'\r\n]{12,}["']/i,
  /\bASOLARIA_[A-Z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD)\b\s*=\s*[^#\s]{12,}/
];

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
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

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function loadReadiness() {
  return JSON.parse(fs.readFileSync(READINESS_JSON, "utf8"));
}

function isAllowedPath(filePath) {
  const normalized = String(filePath || "").replace(/\\/g, "/");
  return ALLOWED_EXACT.has(normalized) || ALLOWED_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

function isBlockedPath(filePath) {
  const normalized = String(filePath || "").replace(/\\/g, "/");
  return BLOCKED_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

function quotePwsh(filePath) {
  return `'${String(filePath).replace(/'/g, "''")}'`;
}

function chunk(values, size) {
  const chunks = [];
  for (let i = 0; i < values.length; i += size) chunks.push(values.slice(i, i + size));
  return chunks;
}

function scanFileForSecretAssignments(filePath) {
  const fullPath = path.join(ROOT, filePath);
  let stat = null;
  try {
    stat = fs.statSync(fullPath);
  } catch {
    return { path: filePath, exists: false, skipped: true, reason: "missing" };
  }
  if (!stat.isFile()) return { path: filePath, exists: true, skipped: true, reason: "not_file" };
  if (stat.size > 2_000_000) return { path: filePath, exists: true, skipped: true, reason: "larger_than_2mb", bytes: stat.size };

  const text = fs.readFileSync(fullPath, "utf8");
  const hits = [];
  const lines = text.split(/\r?\n/g);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    for (const pattern of HIGH_RISK_SECRET_PATTERNS) {
      if (pattern.test(line)) {
        hits.push({
          line: i + 1,
          pattern: String(pattern),
          redactedPreview: line.slice(0, 80).replace(/(["'=:\s])[^"'=\s]{8,}/g, "$1[redacted]")
        });
      }
    }
  }
  return {
    path: filePath,
    exists: true,
    skipped: false,
    bytes: stat.size,
    highRiskHits: hits
  };
}

function buildReport(result) {
  const fileRows = result.files.wholeFileStageable.map((item) => `- ${item.status} ${item.path}`);
  const manualRows = result.files.manualHunkReview.map((item) => `- ${item.status} ${item.path}`);
  const blockedRows = result.files.blocked.map((item) => `- ${item.status} ${item.path} (${item.reason})`);
  const commandRows = result.stageCommands.map((command) => `\`\`\`powershell\n${command}\n\`\`\``);
  const hunkRows = result.manualHunkCommands.map((command) => `\`\`\`powershell\n${command}\n\`\`\``);
  const secretRows = result.safety.secretScan.flatMap((scan) => (scan.highRiskHits || []).map((hit) => `- ${scan.path}:${hit.line} ${hit.redactedPreview}`));
  return `# Original Hermes Partial Commit Manifest

Generated: ${result.generatedAt}
Status: ${result.status}
Ready for whole-file staging: ${result.readyToStageWholeFiles}
Ready for manual hunk review: ${result.readyForManualHunkReview}
Digest: ${result.digest}

## Summary

- Stageable Original Hermes files: ${result.summary.stageableFiles}
- Whole-file stageable files: ${result.summary.wholeFileStageableFiles}
- Manual hunk review files: ${result.summary.manualHunkReviewFiles}
- Blocked files: ${result.summary.blockedFiles}
- Missing files: ${result.summary.missingFiles}
- Missing required source files: ${result.summary.missingRequiredStagePaths}
- High-risk secret assignment hits: ${result.summary.highRiskSecretHits}
- Unrelated dirty files in worktree: ${result.summary.unrelatedDirty}
- Source readiness digest: ${result.source.readinessDigest}

## Whole-File Stageable Files

${fileRows.join("\n") || "- none"}

## Manual Hunk Review Files

These files contain known mixed-lane changes. Do not whole-file stage them.

${manualRows.join("\n") || "- none"}

## Blocked Files

${blockedRows.join("\n") || "- none"}

## Stage Commands

These whole-file commands are generated for operator review only. They were not executed.

${commandRows.join("\n\n") || "- none"}

## Manual Hunk Commands

Use these only if staging interactively and reviewing each hunk.

${hunkRows.join("\n\n") || "- none"}

## Secret Assignment Scan

${secretRows.join("\n") || "- no high-risk secret assignment patterns found"}

## Honesty Boundary

- No Git stage.
- No Git commit.
- No Git push.
- No network call.
- No secret value print.
- No shadow file edit.
`;
}

function run({ execute = false } = {}) {
  const readiness = loadReadiness();
  const generatedAt = new Date().toISOString();
  const originalRows = Array.isArray(readiness.git?.originalHermes) ? readiness.git.originalHermes : [];
  const unique = new Map();
  for (const row of originalRows) {
    if (!row.path) continue;
    unique.set(row.path, {
      status: row.status || "",
      path: row.path,
      raw: row.raw || ""
    });
  }
  for (const requiredPath of REQUIRED_STAGE_PATHS) {
    if (!unique.has(requiredPath)) {
      unique.set(requiredPath, {
        status: "required",
        path: requiredPath,
        raw: `required ${requiredPath}`
      });
    }
  }

  const evaluated = [...unique.values()].map((row) => {
    const blocked = isBlockedPath(row.path);
    const allowed = isAllowedPath(row.path);
    const exists = fs.existsSync(path.join(ROOT, row.path));
    return {
      ...row,
      exists,
      allowed,
      blocked,
      requiresManualHunkReview: MANUAL_HUNK_REVIEW_PATHS.has(row.path),
      reason: blocked ? "blocked_path_prefix" : (allowed ? "allowed_original_hermes_path" : "outside_original_hermes_scope")
    };
  });

  const stageable = evaluated.filter((row) => row.allowed && !row.blocked && row.exists);
  const wholeFileStageable = stageable.filter((row) => !row.requiresManualHunkReview);
  const manualHunkReview = stageable.filter((row) => row.requiresManualHunkReview);
  const blocked = evaluated.filter((row) => !row.allowed || row.blocked || !row.exists);
  const secretScan = stageable.map((row) => scanFileForSecretAssignments(row.path));
  const highRiskSecretHits = secretScan.reduce((sum, scan) => sum + (scan.highRiskHits?.length || 0), 0);
  const stageCommands = chunk(wholeFileStageable.map((row) => row.path), 25)
    .map((paths) => `git add -- ${paths.map(quotePwsh).join(" ")}`);
  const manualHunkCommands = manualHunkReview.map((row) => `git add -p -- ${quotePwsh(row.path)}`);
  const missingRequiredStagePaths = REQUIRED_STAGE_PATHS.filter((filePath) => !stageable.some((row) => row.path === filePath));
  const hardBlocked = blocked.length > 0
    || highRiskSecretHits > 0
    || missingRequiredStagePaths.length > 0;
  const readyToStageWholeFiles = wholeFileStageable.length > 0 && !hardBlocked;
  const readyForManualHunkReview = manualHunkReview.length > 0 && !hardBlocked;
  const readyToStage = readyToStageWholeFiles && manualHunkReview.length === 0;
  const pass = readyToStageWholeFiles || readyForManualHunkReview;
  const status = hardBlocked
    ? "PARTIAL_COMMIT_GATED"
    : (manualHunkReview.length > 0 ? "READY_WITH_MANUAL_HUNK_REVIEW_REQUIRED" : "READY_TO_STAGE_ORIGINAL_HERMES_PARTIAL_COMMIT");
  const result = {
    id: "original-hermes-partial-commit-manifest.v1",
    generatedAt,
    status,
    pass,
    readyToStage,
    readyToStageWholeFiles,
    readyForManualHunkReview,
    source: {
      readinessPath: rel(READINESS_JSON),
      readinessStatus: readiness.status,
      readinessReady: readiness.ready,
      readinessDigest: readiness.digest || ""
    },
    files: {
      stageable,
      wholeFileStageable,
      manualHunkReview,
      blocked
    },
    safety: {
      secretScan,
      blockedPrefixes: BLOCKED_PREFIXES,
      allowedPrefixes: ALLOWED_PREFIXES,
      allowedExact: [...ALLOWED_EXACT],
      manualHunkReviewPaths: [...MANUAL_HUNK_REVIEW_PATHS]
    },
    summary: {
      stageableFiles: stageable.length,
      wholeFileStageableFiles: wholeFileStageable.length,
      manualHunkReviewFiles: manualHunkReview.length,
      blockedFiles: blocked.length,
      missingFiles: evaluated.filter((row) => !row.exists).length,
      requiredStagePaths: REQUIRED_STAGE_PATHS.length,
      missingRequiredStagePaths: missingRequiredStagePaths.length,
      highRiskSecretHits,
      unrelatedDirty: readiness.summary?.unrelatedDirty || 0
    },
    stageCommands,
    manualHunkCommands,
    commitCommandPreview: "git commit -m \"Integrate Original Hermes runtime gates\"",
    honesty: {
      staged: false,
      committed: false,
      pushed: false,
      network: false,
      printedSecretValues: false,
      editedShadowFiles: false
    }
  };
  result.digest = sha256(stableStringify(result));
  if (execute) {
    writeJson(STATE_JSON, result);
    writeJson(REPORT_JSON, result);
    writeText(REPORT_MD, buildReport(result));
  }
  return result;
}

function main(argv) {
  const command = argv[2] || "status";
  const execute = argv.includes("--execute");
  if (command === "status") {
    console.log(JSON.stringify({
      ok: true,
      readinessExists: fs.existsSync(READINESS_JSON),
      outputs: {
        state: rel(STATE_JSON),
        reportJson: rel(REPORT_JSON),
        reportMd: rel(REPORT_MD)
      }
    }, null, 2));
    return;
  }
  if (command === "run") {
    const result = run({ execute });
    console.log(JSON.stringify({
      status: result.status,
      pass: result.pass,
      readyToStage: result.readyToStage,
      readyToStageWholeFiles: result.readyToStageWholeFiles,
      readyForManualHunkReview: result.readyForManualHunkReview,
      summary: result.summary,
      digest: result.digest
    }, null, 2));
    process.exit(result.pass ? 0 : 1);
    return;
  }
  console.error("Usage: node tools/original-hermes-partial-commit-manifest.js status|run [--execute]");
  process.exit(2);
}

if (require.main === module) {
  main(process.argv);
}

module.exports = {
  run
};
