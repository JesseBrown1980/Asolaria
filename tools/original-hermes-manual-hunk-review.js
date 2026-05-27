#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const REPORT_JSON = path.join(ROOT, "reports", "original-hermes-manual-hunk-review-latest.json");
const REPORT_MD = path.join(ROOT, "reports", "original-hermes-manual-hunk-review-latest.md");
const STATE_JSON = path.join(ROOT, "data", "behcs", "original-hermes-agent", "manual-hunk-review-latest.json");

const REVIEW_PATHS = [
  "TASKS.md",
  "routes/workerRouter.js",
  "routes/hooks.js",
  "src/connectors/hooksConnector.js",
  "server.js"
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

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function quotePwsh(filePath) {
  return `'${String(filePath).replace(/'/g, "''")}'`;
}

function runGitDiff(filePath) {
  const result = spawnSync("git", ["diff", "--unified=0", "--", filePath], {
    cwd: ROOT,
    shell: false,
    encoding: "utf8",
    timeout: 60_000,
    windowsHide: true,
    maxBuffer: 25 * 1024 * 1024
  });
  return {
    command: `git diff --unified=0 -- ${filePath}`,
    status: result.status === 0 ? "pass" : "fail",
    exitCode: result.status,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    error: result.error ? String(result.error.message || result.error) : ""
  };
}

function parseHunkHeader(header) {
  const match = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(header);
  if (!match) return null;
  return {
    oldStart: Number(match[1]),
    oldCount: Number(match[2] || "1"),
    newStart: Number(match[3]),
    newCount: Number(match[4] || "1")
  };
}

function parseDiffHunks(diffText) {
  const lines = diffText.split(/\r?\n/g);
  const hunks = [];
  let current = null;
  for (const line of lines) {
    if (line.startsWith("@@ ")) {
      if (current) hunks.push(current);
      current = {
        header: line,
        range: parseHunkHeader(line),
        lines: []
      };
      continue;
    }
    if (current) current.lines.push(line);
  }
  if (current) hunks.push(current);
  return hunks;
}

function additions(hunk) {
  return hunk.lines.filter((line) => line.startsWith("+") && !line.startsWith("+++"));
}

function removals(hunk) {
  return hunk.lines.filter((line) => line.startsWith("-") && !line.startsWith("---"));
}

function hunkText(hunk) {
  return hunk.lines.join("\n");
}

function has(text, pattern) {
  return pattern.test(text);
}

function classifyHunk(filePath, hunk) {
  const text = hunkText(hunk);
  const added = additions(hunk).join("\n");
  const removed = removals(hunk).join("\n");
  const combined = `${added}\n${removed}`;

  if (filePath === "routes/workerRouter.js") {
    const originalHermes = has(combined, /original-?hermes|originalHermes/i);
    const selfBuild = has(combined, /self-build|getWorkerRouterSelfBuildPosture/i);
    if (originalHermes && selfBuild) {
      return {
        lane: "mixed_worker_router",
        decision: "manual_split_required",
        stage: "stage Original Hermes imports; defer self-build import unless companion self-build files are staged",
        risk: "mixed import hunk"
      };
    }
    if (selfBuild) {
      return {
        lane: "worker_router_self_build",
        decision: "defer_or_stage_separate_lane",
        stage: "do not include in Original Hermes partial commit",
        risk: "non-Original-Hermes endpoint"
      };
    }
    if (originalHermes) {
      return {
        lane: "original_hermes_worker_router",
        decision: "stage_original_hermes",
        stage: "include in Original Hermes route/API lane",
        risk: "low"
      };
    }
  }

  if (filePath === "src/connectors/hooksConnector.js") {
    const originalHermes = has(combined, /originalHermes|Original Hermes|buildPluginHookGate|evaluatePluginHook|plugin hook denied|original_hermes_hook|manifest_digest|explicit_shell_gate/i);
    const routeTelemetry = has(combined, /getRouteHookStats|routeHooks|RouteHook|atlasLaneId|routeStage|trancheId|qId/i);
    if (originalHermes && routeTelemetry) {
      return {
        lane: "mixed_hook_connector",
        decision: "manual_split_required",
        stage: "stage plugin-gate lines; defer route-hook telemetry unless paired with hook telemetry lane",
        risk: "mixed import/export/dashboard hunk"
      };
    }
    if (originalHermes) {
      return {
        lane: "original_hermes_plugin_gate",
        decision: "stage_original_hermes",
        stage: "include in Original Hermes plugin-hook GAC gate",
        risk: "low"
      };
    }
    if (routeTelemetry) {
      return {
        lane: "route_hook_telemetry",
        decision: "defer_or_stage_separate_lane",
        stage: "keep out of Original Hermes partial commit unless route-hook telemetry lane is intentional",
        risk: "separate feature lane"
      };
    }
  }

  if (filePath === "routes/hooks.js") {
    const guardContext = has(combined, /getGuardVerdict\(|body\s*\)|tool_input|plugin_hook|manifest_digest/i);
    const routeTelemetry = has(combined, /getRouteHookStats|route-hooks|RouteHook|atlasLaneId|routeStage|trancheId|qId|trigger/i);
    if (guardContext && routeTelemetry) {
      return {
        lane: "mixed_hooks_route",
        decision: "manual_split_required",
        stage: "stage guard context hunk only; defer route-hook telemetry endpoints/imports",
        risk: "mixed guard and telemetry hunk"
      };
    }
    if (guardContext) {
      return {
        lane: "original_hermes_guard_context",
        decision: "stage_original_hermes",
        stage: "include because plugin-gate needs full guard context",
        risk: "low"
      };
    }
    if (routeTelemetry) {
      return {
        lane: "route_hook_telemetry",
        decision: "defer_or_stage_separate_lane",
        stage: "keep out of Original Hermes partial commit unless route-hook telemetry lane is intentional",
        risk: "separate feature lane"
      };
    }
  }

  if (filePath === "server.js") {
    const hookLoopback = has(combined, /app\.use\("\/api\/hooks",\s*requireLoopbackOnly/i);
    const unrelated = has(combined, /kimi|cache\/status|ixExec|MODEL_ALIAS|brainFallbackOrder|getCacheStatus|getKimiCodeStatus/i);
    if (hookLoopback && unrelated) {
      return {
        lane: "mixed_server_hardening",
        decision: "manual_split_required",
        stage: "stage only /api/hooks requireLoopbackOnly; defer Kimi/cache/ix changes",
        risk: "desired hardening adjacent to unrelated server changes"
      };
    }
    if (hookLoopback) {
      return {
        lane: "hook_loopback_hardening",
        decision: "stage_separate_hardening_lane",
        stage: "include in a hook-hardening commit, not the Original Hermes core commit",
        risk: "low"
      };
    }
    if (unrelated) {
      return {
        lane: "unrelated_server_changes",
        decision: "defer",
        stage: "do not stage for Original Hermes",
        risk: "unrelated provider/cache/ix server edits"
      };
    }
  }

  if (filePath === "TASKS.md") {
    const originalHermes = has(combined, /Original Hermes|original-hermes/i);
    const skills = has(combined, /skills validation|skills:validate|Repo-level skills/i);
    const deepWave = has(combined, /Deep-wave|NovaLUM|Falcon-language|Liris BEHCS/i);
    if (originalHermes && (skills || deepWave)) {
      return {
        lane: "mixed_task_log",
        decision: "manual_split_required",
        stage: "stage only Original Hermes task-log lines for the Original Hermes commit; keep skills/deep-wave entries separate",
        risk: "large prepended mixed task-log hunk"
      };
    }
    if (originalHermes) {
      return {
        lane: "original_hermes_task_log",
        decision: "stage_original_hermes",
        stage: "include Original Hermes task-log lines",
        risk: "low"
      };
    }
    return {
      lane: skills ? "repo_validation_task_log" : (deepWave ? "deep_wave_task_log" : "non_original_hermes_task_log"),
      decision: "defer_or_stage_separate_lane",
      stage: "do not include in Original Hermes partial commit",
      risk: "separate task-log lane"
    };
  }

  return {
    lane: "unknown",
    decision: "manual_review_required",
    stage: "review interactively before staging",
    risk: "unclassified hunk"
  };
}

function buildFileReview(filePath) {
  const diff = runGitDiff(filePath);
  const hunks = diff.status === "pass" ? parseDiffHunks(diff.stdout) : [];
  const reviewedHunks = hunks.map((hunk, index) => {
    const classification = classifyHunk(filePath, hunk);
    const added = additions(hunk);
    const removed = removals(hunk);
    return {
      index: index + 1,
      header: hunk.header,
      range: hunk.range,
      addedLines: added.length,
      removedLines: removed.length,
      preview: [...added.slice(0, 6), ...removed.slice(0, 4)].map((line) => line.slice(0, 220)),
      ...classification
    };
  });
  const decisions = reviewedHunks.reduce((acc, hunk) => {
    acc[hunk.decision] = (acc[hunk.decision] || 0) + 1;
    return acc;
  }, {});
  return {
    path: filePath,
    command: diff.command,
    status: diff.status,
    exitCode: diff.exitCode,
    error: diff.error || diff.stderr.slice(0, 500),
    hunkCount: reviewedHunks.length,
    decisions,
    hunks: reviewedHunks,
    interactiveCommand: `git add -p -- ${quotePwsh(filePath)}`
  };
}

function buildMarkdown(result) {
  const fileSections = result.files.map((file) => {
    const hunkRows = file.hunks.map((hunk) => `### ${file.path} hunk ${hunk.index}

- Header: \`${hunk.header}\`
- Decision: \`${hunk.decision}\`
- Lane: \`${hunk.lane}\`
- Stage guidance: ${hunk.stage}
- Risk: ${hunk.risk}
- Added/removed: ${hunk.addedLines}/${hunk.removedLines}

Preview:

\`\`\`diff
${hunk.preview.join("\n") || "(no changed lines preview)"}
\`\`\`
`);
    return `## ${file.path}

- Diff status: ${file.status}
- Hunks: ${file.hunkCount}
- Interactive command: \`${file.interactiveCommand}\`

${hunkRows.join("\n") || "- no hunks"}
`;
  });
  return `# Original Hermes Manual Hunk Review

Generated: ${result.generatedAt}
Status: ${result.status}
Digest: ${result.digest}

## Summary

- Files reviewed: ${result.summary.filesReviewed}
- Total hunks: ${result.summary.totalHunks}
- Stage Original Hermes hunks: ${result.summary.stageOriginalHermes}
- Stage separate hardening hunks: ${result.summary.stageSeparateHardening}
- Manual split required hunks: ${result.summary.manualSplitRequired}
- Deferred/separate-lane hunks: ${result.summary.deferOrSeparate}
- Unknown/manual-review hunks: ${result.summary.unknownManualReview}

## Operator Rules

- Use \`git add -p\`; do not whole-file stage these files.
- Keep provider/cache/ix server edits out of the Original Hermes commit.
- Keep route-hook telemetry out unless it is intentionally bundled with matching connector/store changes.
- Stage \`server.js\` hook loopback protection only as a separate hook-hardening lane or as a deliberately named companion hunk.
- No Git stage, commit, push, network call, secret read, or shadow edit was performed by this tool.

${fileSections.join("\n")}
`;
}

function run({ execute = false } = {}) {
  const generatedAt = new Date().toISOString();
  const files = REVIEW_PATHS.map(buildFileReview);
  const allHunks = files.flatMap((file) => file.hunks);
  const summary = {
    filesReviewed: files.length,
    totalHunks: allHunks.length,
    stageOriginalHermes: allHunks.filter((hunk) => hunk.decision === "stage_original_hermes").length,
    stageSeparateHardening: allHunks.filter((hunk) => hunk.decision === "stage_separate_hardening_lane").length,
    manualSplitRequired: allHunks.filter((hunk) => hunk.decision === "manual_split_required").length,
    deferOrSeparate: allHunks.filter((hunk) => hunk.decision === "defer_or_stage_separate_lane" || hunk.decision === "defer").length,
    unknownManualReview: allHunks.filter((hunk) => hunk.decision === "manual_review_required").length
  };
  const hardBlocked = files.some((file) => file.status !== "pass") || summary.unknownManualReview > 0;
  const status = hardBlocked
    ? "MANUAL_HUNK_REVIEW_BLOCKED"
    : "MANUAL_HUNK_REVIEW_READY";
  const result = {
    id: "original-hermes-manual-hunk-review.v1",
    generatedAt,
    status,
    pass: !hardBlocked,
    reviewPaths: REVIEW_PATHS,
    files,
    summary,
    commands: {
      interactive: REVIEW_PATHS.map((filePath) => `git add -p -- ${quotePwsh(filePath)}`),
      noStagePerformed: true
    },
    honesty: {
      staged: false,
      committed: false,
      pushed: false,
      network: false,
      readSecretValues: false,
      editedShadowFiles: false
    }
  };
  result.digest = sha256(stableStringify(result));
  if (execute) {
    writeJson(STATE_JSON, result);
    writeJson(REPORT_JSON, result);
    writeText(REPORT_MD, buildMarkdown(result));
  }
  return result;
}

function main(argv) {
  const command = argv[2] || "status";
  const execute = argv.includes("--execute");
  if (command === "status") {
    console.log(JSON.stringify({
      ok: true,
      outputs: {
        state: rel(STATE_JSON),
        reportJson: rel(REPORT_JSON),
        reportMd: rel(REPORT_MD)
      },
      reviewPaths: REVIEW_PATHS
    }, null, 2));
    return;
  }
  if (command === "run") {
    const result = run({ execute });
    console.log(JSON.stringify({
      status: result.status,
      pass: result.pass,
      summary: result.summary,
      digest: result.digest
    }, null, 2));
    process.exit(result.pass ? 0 : 1);
    return;
  }
  console.error("Usage: node tools/original-hermes-manual-hunk-review.js status|run [--execute]");
  process.exit(2);
}

if (require.main === module) {
  main(process.argv);
}

module.exports = {
  run
};
