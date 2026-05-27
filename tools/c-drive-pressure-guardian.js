#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const REPORT_JSON = path.join(ROOT, "reports", "c-drive-pressure-guardian-latest.json");
const REPORT_MD = path.join(ROOT, "reports", "c-drive-pressure-guardian-latest.md");
const STATE_PATH = path.join(ROOT, "data", "behcs", "state", "storage", "c-drive-pressure-guardian.state.json");

const SAFE_ROOTS = [
  "logs",
  "reports",
  "data",
  "sovereignty\\research",
  "tmp",
  "tmp-symphony-workspace-test"
].map((rel) => path.join(ROOT, rel));

const EXCLUDED_PARTS = [
  `${path.sep}.git${path.sep}`,
  `${path.sep}node_modules${path.sep}`,
  `${path.sep}data${path.sep}behcs${path.sep}garbage-collector${path.sep}message-paths.ndjson`,
  `${path.sep}data${path.sep}behcs${path.sep}garbage-collector${path.sep}collector-state.json`
];

const COMPRESS_EXTENSIONS = new Set([
  ".json",
  ".ndjson",
  ".log",
  ".md",
  ".txt",
  ".csv",
  ".xml",
  ".html",
  ".js",
  ".mjs",
  ".ps1",
  ".db"
]);

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

function parseArgValue(argv, name, fallback) {
  const prefix = `--${name}=`;
  const found = argv.find((arg) => String(arg).startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

function safeInt(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : fallback;
}

function driveFreeBytes() {
  const result = spawnSync("powershell.exe", [
    "-NoProfile",
    "-Command",
    "(Get-CimInstance Win32_LogicalDisk -Filter \"DeviceID='C:'\").FreeSpace"
  ], { encoding: "utf8", windowsHide: true });
  const parsed = Number(String(result.stdout || "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function isExcluded(filePath) {
  const normalized = path.resolve(filePath);
  return EXCLUDED_PARTS.some((part) => normalized.includes(part));
}

function shouldConsider(filePath, stat, options) {
  if (!stat.isFile()) return false;
  if (stat.size < options.minBytes) return false;
  if (Date.now() - stat.mtimeMs < options.minAgeMs) return false;
  if (isExcluded(filePath)) return false;
  const ext = path.extname(filePath).toLowerCase();
  if (!COMPRESS_EXTENSIONS.has(ext)) return false;
  return true;
}

function walk(dir, options, out = []) {
  if (!fs.existsSync(dir)) return out;
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (isExcluded(full)) continue;
    if (entry.isDirectory()) {
      if (entry.name === ".git" || entry.name === "node_modules") continue;
      walk(full, options, out);
    } else if (entry.isFile()) {
      try {
        const stat = fs.statSync(full);
        if (shouldConsider(full, stat, options)) {
          out.push({
            path: full,
            relativePath: repoRel(full),
            bytes: stat.size,
            mb: Math.round((stat.size / 1024 / 1024) * 100) / 100,
            lastWriteTime: stat.mtime.toISOString(),
            extension: path.extname(full).toLowerCase()
          });
        }
      } catch {}
    }
  }
  return out;
}

function compactFile(filePath) {
  return spawnSync("compact.exe", ["/c", "/i", "/q", filePath], {
    encoding: "utf8",
    windowsHide: true
  });
}

function buildReport(summary) {
  const top = summary.candidates.slice(0, 25)
    .map((item) => `| ${item.relativePath} | ${item.mb} | ${item.extension} | ${item.lastWriteTime} |`)
    .join("\n");
  return `# C Drive Pressure Guardian

Generated: ${summary.generatedAt}

Status: ${summary.status}

Mode: ${summary.execute ? "execute" : "preview"}

This guard preserves paths. It does not delete, move, format, repair, or edit shadow/runtime law files. It only applies NTFS compression to older generated text-heavy artifacts when run with \`--execute\`.

## Disk

- Free before: ${summary.freeBeforeGB} GB
- Free after: ${summary.freeAfterGB} GB
- Delta: ${summary.freeDeltaGB} GB

## Compression

- Candidate files: ${summary.candidateCount}
- Candidate bytes: ${summary.candidateGB} GB
- Attempted: ${summary.attempted}
- Succeeded: ${summary.succeeded}
- Failed: ${summary.failed}

## Top Candidates

| File | MB | Ext | Last write |
| --- | ---: | --- | --- |
${top}
`;
}

function run(argv) {
  const execute = argv.includes("--execute");
  const minMb = safeInt(parseArgValue(argv, "min-mb", 20), 20);
  const minAgeHours = safeInt(parseArgValue(argv, "min-age-hours", 2), 2);
  const maxFiles = safeInt(parseArgValue(argv, "max-files", 200), 200);
  const options = {
    minBytes: minMb * 1024 * 1024,
    minAgeMs: minAgeHours * 60 * 60 * 1000
  };
  const generatedAt = new Date().toISOString();
  const freeBefore = driveFreeBytes();
  const candidates = [];
  for (const root of SAFE_ROOTS) walk(root, options, candidates);
  candidates.sort((a, b) => b.bytes - a.bytes);
  const selected = candidates.slice(0, maxFiles);
  const results = [];
  if (execute) {
    for (const item of selected) {
      const result = compactFile(item.path);
      results.push({
        relativePath: item.relativePath,
        exitCode: result.status,
        ok: result.status === 0,
        stdout: String(result.stdout || "").slice(0, 500),
        stderr: String(result.stderr || "").slice(0, 500)
      });
    }
  }
  const freeAfter = driveFreeBytes();
  const summary = {
    ok: true,
    generatedAt,
    status: execute ? "C_DRIVE_PRESSURE_COMPRESSION_ATTEMPTED" : "C_DRIVE_PRESSURE_PREVIEW",
    execute,
    policy: {
      preservesPaths: true,
      deletesFiles: false,
      movesFiles: false,
      touchesShadowRuntime: false,
      minMb,
      minAgeHours,
      maxFiles,
      roots: SAFE_ROOTS.map(repoRel)
    },
    freeBeforeBytes: freeBefore,
    freeAfterBytes: freeAfter,
    freeBeforeGB: freeBefore == null ? null : Math.round((freeBefore / 1024 / 1024 / 1024) * 100) / 100,
    freeAfterGB: freeAfter == null ? null : Math.round((freeAfter / 1024 / 1024 / 1024) * 100) / 100,
    freeDeltaGB: freeBefore == null || freeAfter == null ? null : Math.round(((freeAfter - freeBefore) / 1024 / 1024 / 1024) * 100) / 100,
    candidateCount: candidates.length,
    candidateBytes: candidates.reduce((sum, item) => sum + item.bytes, 0),
    candidateGB: Math.round((candidates.reduce((sum, item) => sum + item.bytes, 0) / 1024 / 1024 / 1024) * 100) / 100,
    attempted: execute ? selected.length : 0,
    succeeded: results.filter((item) => item.ok).length,
    failed: results.filter((item) => !item.ok).length,
    candidates: selected,
    results,
    outputs: {
      reportJson: repoRel(REPORT_JSON),
      reportMd: repoRel(REPORT_MD),
      state: repoRel(STATE_PATH)
    }
  };
  writeJson(REPORT_JSON, summary);
  writeText(REPORT_MD, buildReport(summary));
  writeJson(STATE_PATH, {
    savedAt: generatedAt,
    status: summary.status,
    freeBeforeGB: summary.freeBeforeGB,
    freeAfterGB: summary.freeAfterGB,
    freeDeltaGB: summary.freeDeltaGB,
    candidateGB: summary.candidateGB
  });
  return summary;
}

console.log(JSON.stringify(run(process.argv), null, 2));
