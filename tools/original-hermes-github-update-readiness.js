#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { sha256, stableStringify } = require("../src/behcs/bimlFeedbackContract");

const ROOT = path.resolve(__dirname, "..");
const REPORT_JSON = path.join(ROOT, "reports", "original-hermes-github-update-readiness-latest.json");
const REPORT_MD = path.join(ROOT, "reports", "original-hermes-github-update-readiness-latest.md");
const STATE_PATH = path.join(ROOT, "data", "behcs", "original-hermes-agent", "github-update-readiness-latest.json");

const ORIGINAL_HERMES_PREFIXES = [
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

const ORIGINAL_HERMES_ALLOWED_MODIFIED = [
  "routes/workerRouter.js",
  "routes/hooks.js",
  "src/connectors/hooksConnector.js",
  "TASKS.md"
];

const REQUIRED_OUTPUTS = [
  "reports/original-hermes-agent-upstream-20b-absorption-latest.md",
  "reports/original-hermes-agent-implementation-tranche-latest.md",
  "reports/original-hermes-agent-transport-router-smoke-latest.md",
  "reports/original-hermes-agent-learning-loop-smoke-latest.md",
  "reports/original-hermes-agent-wal-state-smoke-latest.md",
  "reports/original-hermes-agent-security-backport-smoke-latest.md",
  "reports/original-hermes-agent-runtime-index-latest.md",
  "reports/original-hermes-agent-security-targeted-tests-latest.md"
];

const CHECKS = [
  ["node", ["--check", "src/behcs/originalHermesAgentContracts.js"]],
  ["node", ["--check", "src/behcs/originalHermesTransportRouter.js"]],
  ["node", ["--check", "src/behcs/originalHermesLearningLoop.js"]],
  ["node", ["--check", "src/behcs/originalHermesWalState.js"]],
  ["node", ["--check", "src/behcs/originalHermesSecurityBackport.js"]],
  ["node", ["--check", "src/behcs/originalHermesRuntimeIndex.js"]],
  ["node", ["--check", "routes/workerRouter.js"]],
  ["node", ["--check", "routes/hooks.js"]],
  ["node", ["--check", "src/connectors/hooksConnector.js"]],
  ["node", ["--check", "tools/original-hermes-runtime-index-smoke.js"]],
  ["node", ["--check", "tools/original-hermes-security-targeted-tests.js"]],
  ["node", ["--check", "tools/original-hermes-github-update-readiness.js"]],
  ["node", ["--check", "tools/original-hermes-partial-commit-manifest.js"]],
  ["node", ["--check", "tools/original-hermes-manual-hunk-review.js"]]
];

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

function repoRel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function digestRecord(record) {
  return sha256(stableStringify(record));
}

function runCommand(command, args, timeout = 60_000) {
  const started = Date.now();
  const result = spawnSync(command, args, {
    cwd: ROOT,
    shell: false,
    encoding: "utf8",
    timeout,
    windowsHide: true
  });
  const output = `${result.stdout || ""}${result.stderr || ""}`.trim();
  return {
    command: `${command} ${args.join(" ")}`,
    shell: false,
    status: result.status === 0 ? "pass" : "fail",
    exitCode: result.status,
    elapsedMs: Date.now() - started,
    output: output.slice(0, 1000),
    error: result.error ? String(result.error.message || result.error).slice(0, 500) : ""
  };
}

function parseGitStatus() {
  const started = Date.now();
  const gitResult = spawnSync("git", ["status", "--short", "--untracked-files=all"], {
    cwd: ROOT,
    shell: false,
    encoding: "utf8",
    timeout: 60_000,
    windowsHide: true,
    maxBuffer: 50 * 1024 * 1024
  });
  const rawOutput = `${gitResult.stdout || ""}${gitResult.stderr || ""}`;
  const command = {
    command: "git status --short --untracked-files=all",
    shell: false,
    status: gitResult.status === 0 ? "pass" : "fail",
    exitCode: gitResult.status,
    elapsedMs: Date.now() - started,
    output: rawOutput.trimEnd().slice(0, 1000),
    error: gitResult.error ? String(gitResult.error.message || gitResult.error).slice(0, 500) : "",
    truncated: rawOutput.length > 1000
  };
  const rows = rawOutput
    .split(/\r?\n/g)
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .map((line) => ({
      status: line.slice(0, 2).trim(),
      path: line.slice(3).trim().replace(/\\/g, "/"),
      raw: line
    }));
  return {
    command,
    rows
  };
}

function isOriginalHermesPath(filePath) {
  const normalized = String(filePath || "").replace(/\\/g, "/");
  return ORIGINAL_HERMES_PREFIXES.some((prefix) => normalized.startsWith(prefix))
    || ORIGINAL_HERMES_ALLOWED_MODIFIED.includes(normalized);
}

function requiredOutputState() {
  return REQUIRED_OUTPUTS.map((file) => {
    const fullPath = path.join(ROOT, file);
    let stat = null;
    try {
      stat = fs.statSync(fullPath);
    } catch {
      stat = null;
    }
    return {
      path: file,
      exists: Boolean(stat),
      bytes: stat?.size || 0,
      modifiedAt: stat ? stat.mtime.toISOString() : ""
    };
  });
}

function buildReport(result) {
  const checkRows = result.syntaxChecks.map((check) => `- ${check.command}: ${check.status}`);
  const outputRows = result.requiredOutputs.map((item) => `- ${item.path}: exists=${item.exists} bytes=${item.bytes}`);
  const originalRows = result.git.originalHermes.slice(0, 60).map((row) => `- ${row.raw}`);
  const unrelatedRows = result.git.unrelated.slice(0, 30).map((row) => `- ${row.raw}`);
  return `# Original Hermes GitHub Update Readiness

Generated: ${result.generatedAt}
Status: ${result.status}
Ready: ${result.ready}
Digest: ${result.digest}

## Decision

- Original Hermes files changed: ${result.summary.originalHermesChanged}
- Unrelated dirty files: ${result.summary.unrelatedDirty}
- Required outputs present: ${result.summary.requiredOutputsPresent}/${result.summary.requiredOutputsTotal}
- Syntax checks passed: ${result.summary.syntaxPassed}/${result.summary.syntaxTotal}
- Safe to push whole worktree: ${result.summary.safeWholeWorktreePush}
- Recommended mode: ${result.recommendation.mode}

## Syntax Checks

${checkRows.join("\n") || "- none"}

## Required Evidence

${outputRows.join("\n") || "- none"}

## Original Hermes Candidate Files

${originalRows.join("\n") || "- none"}

## Unrelated Dirty Files

${unrelatedRows.join("\n") || "- none"}

${result.git.unrelated.length > 30 ? `\n... ${result.git.unrelated.length - 30} more unrelated dirty files omitted from report preview.\n` : ""}

## Honesty Boundary

- No Git commit.
- No Git push.
- No network call.
- No secret read.
- No shadow file edit.
- This is a readiness gate only.
`;
}

function run({ execute = false } = {}) {
  const generatedAt = new Date().toISOString();
  const git = parseGitStatus();
  const originalHermes = git.rows.filter((row) => isOriginalHermesPath(row.path));
  const unrelated = git.rows.filter((row) => !isOriginalHermesPath(row.path));
  const syntaxChecks = CHECKS.map(([command, args]) => runCommand(command, args));
  const requiredOutputs = requiredOutputState();
  const syntaxPassed = syntaxChecks.filter((check) => check.status === "pass").length;
  const outputsPresent = requiredOutputs.filter((item) => item.exists && item.bytes > 0).length;
  const ready = syntaxPassed === syntaxChecks.length
    && outputsPresent === requiredOutputs.length
    && originalHermes.length > 0;
  const safeWholeWorktreePush = ready && unrelated.length === 0;
  const result = {
    id: "original-hermes-github-update-readiness.v1",
    generatedAt,
    status: ready ? "ORIGINAL_HERMES_UPDATE_READY_PARTIAL_COMMIT_RECOMMENDED" : "ORIGINAL_HERMES_UPDATE_GATED",
    ready,
    git: {
      statusCommand: git.command,
      originalHermes,
      unrelated
    },
    syntaxChecks,
    requiredOutputs,
    summary: {
      originalHermesChanged: originalHermes.length,
      unrelatedDirty: unrelated.length,
      requiredOutputsPresent: outputsPresent,
      requiredOutputsTotal: requiredOutputs.length,
      syntaxPassed,
      syntaxTotal: syntaxChecks.length,
      safeWholeWorktreePush
    },
    recommendation: {
      mode: safeWholeWorktreePush ? "whole_worktree_commit_possible" : "partial_original_hermes_commit_only",
      includeOnly: [
        "Original Hermes src/behcs modules",
        "Original Hermes tools",
        "Original Hermes reports/data artifacts",
        "routes/workerRouter.js",
        "routes/hooks.js",
        "src/connectors/hooksConnector.js",
        "TASKS.md"
      ],
      exclude: [
        "runtime/admin-terminals/*",
        "tmp/* screenshots and captures",
        "unrelated reports/*",
        "unrelated docs/source changes",
        "provider/session/secret-adjacent runtime files"
      ]
    },
    honesty: {
      commits: false,
      pushes: false,
      network: false,
      readsSecretValues: false,
      editsShadowFiles: false
    }
  };
  result.digest = digestRecord(result);
  if (execute) {
    writeJson(STATE_PATH, result);
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
      status: "READY",
      outputs: {
        state: repoRel(STATE_PATH),
        reportJson: repoRel(REPORT_JSON),
        reportMd: repoRel(REPORT_MD)
      }
    }, null, 2));
    return;
  }
  if (command === "run") {
    const result = run({ execute });
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.ready ? 0 : 1);
    return;
  }
  console.error("Usage: node tools/original-hermes-github-update-readiness.js status|run [--execute]");
  process.exit(2);
}

if (require.main === module) {
  main(process.argv);
}

module.exports = {
  run
};
