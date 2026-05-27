#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const DEST_ROOT = "D:\\Asolaria-ColdStorage\\Asolaria";
const REPORT_JSON = path.join(ROOT, "reports", "c-drive-junction-migrator-latest.json");
const REPORT_MD = path.join(ROOT, "reports", "c-drive-junction-migrator-latest.md");
const STATE_PATH = path.join(ROOT, "data", "behcs", "state", "storage", "c-drive-junction-migrator.state.json");

const DEFAULT_CANDIDATES = [
  "data\\backups",
  "tmp-symphony-workspace-test",
  "captures",
  "tmp"
];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeJson(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeText(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, value.endsWith("\n") ? value : `${value}\n`, "utf8");
}

function repoRel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function isWithin(parent, child) {
  const rel = path.relative(path.resolve(parent), path.resolve(child));
  return rel === "" || (!rel.startsWith("..") && !path.isAbsolute(rel));
}

function dirStats(dirPath) {
  const out = { files: 0, dirs: 0, bytes: 0 };
  if (!fs.existsSync(dirPath)) return out;
  const stack = [dirPath];
  while (stack.length) {
    const current = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      try {
        if (entry.isDirectory()) {
          out.dirs += 1;
          stack.push(full);
        } else if (entry.isFile()) {
          out.files += 1;
          out.bytes += fs.statSync(full).size;
        }
      } catch {}
    }
  }
  return out;
}

function isReparsePoint(dirPath) {
  try {
    const stat = fs.lstatSync(dirPath);
    return Boolean(stat.isSymbolicLink()) || Boolean(stat.isDirectory() && (stat.mode & fs.constants.S_IFLNK));
  } catch {
    return false;
  }
}

function junctionTarget(dirPath) {
  const result = spawnSync("cmd.exe", ["/d", "/s", "/c", `dir /al "${dirPath}"`], {
    encoding: "utf8",
    windowsHide: true
  });
  return String(result.stdout || "").trim();
}

function driveFreeGb(root) {
  const drive = path.parse(root).root.replace("\\", "");
  const result = spawnSync("powershell.exe", [
    "-NoProfile",
    "-Command",
    `(Get-PSDrive -Name '${drive.replace(":", "")}' -PSProvider FileSystem).Free / 1GB`
  ], { encoding: "utf8", windowsHide: true });
  const parsed = Number(String(result.stdout || "").trim().replace(",", "."));
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : null;
}

function robocopyMirror(source, target) {
  ensureDir(target);
  const result = spawnSync("robocopy.exe", [
    source,
    target,
    "/E",
    "/COPY:DAT",
    "/DCOPY:DAT",
    "/R:1",
    "/W:1",
    "/NFL",
    "/NDL",
    "/NJH",
    "/NJS",
    "/NP"
  ], { encoding: "utf8", windowsHide: true });
  // Robocopy exit codes 0..7 are non-fatal.
  return {
    status: result.status,
    ok: result.status >= 0 && result.status <= 7,
    stdout: String(result.stdout || "").slice(0, 2000),
    stderr: String(result.stderr || "").slice(0, 2000)
  };
}

function makeJunction(linkPath, targetPath) {
  const result = spawnSync("cmd.exe", ["/d", "/c", "mklink", "/J", linkPath, targetPath], {
    encoding: "utf8",
    windowsHide: true
  });
  return {
    status: result.status,
    ok: result.status === 0,
    stdout: String(result.stdout || "").slice(0, 1000),
    stderr: String(result.stderr || "").slice(0, 1000)
  };
}

function migrateOne(relativePath, execute, stamp) {
  const source = path.join(ROOT, relativePath);
  const target = path.join(DEST_ROOT, relativePath);
  const resolvedSource = path.resolve(source);
  const resolvedTarget = path.resolve(target);
  const result = {
    relativePath: relativePath.replace(/\\/g, "/"),
    source: resolvedSource,
    target: resolvedTarget,
    ok: false,
    skipped: false,
    phase: "preview",
    sourceStats: dirStats(source),
    targetStatsBefore: dirStats(target),
    targetStatsAfter: null,
    freedBytesApprox: 0,
    messages: []
  };

  if (!fs.existsSync(source)) {
    result.skipped = true;
    result.phase = "missing_source";
    result.messages.push("source_missing");
    return result;
  }
  const sourceLstat = fs.lstatSync(source);
  if (isReparsePoint(source)) {
    result.skipped = true;
    result.ok = true;
    result.phase = "already_reparse_point";
    result.messages.push("source_is_reparse_point");
    result.junctionTarget = junctionTarget(source);
    return result;
  }
  if (!sourceLstat.isDirectory()) {
    result.skipped = true;
    result.phase = "source_not_directory";
    result.messages.push("source_not_directory");
    return result;
  }
  if (!isWithin(ROOT, source)) {
    result.skipped = true;
    result.phase = "source_outside_root";
    result.messages.push("source_outside_root");
    return result;
  }
  if (!isWithin(DEST_ROOT, target)) {
    result.skipped = true;
    result.phase = "target_outside_dest_root";
    result.messages.push("target_outside_dest_root");
    return result;
  }
  if (!execute) {
    result.ok = true;
    result.phase = "preview_ready";
    return result;
  }
  let copy = { status: 0, ok: true, stdout: "target_already_verified", stderr: "" };
  let targetStats = dirStats(target);
  if (!fs.existsSync(target) || targetStats.files === 0) {
    copy = robocopyMirror(source, target);
    result.copy = copy;
    if (!copy.ok) {
      result.phase = "copy_failed";
      result.messages.push("copy_failed");
      return result;
    }
    targetStats = dirStats(target);
  } else {
    result.copy = copy;
    result.messages.push("target_exists_reusing_verified_copy");
  }
  result.targetStatsAfter = targetStats;
  if (targetStats.files < result.sourceStats.files || targetStats.bytes < result.sourceStats.bytes) {
    result.phase = "verification_failed";
    result.messages.push("target_smaller_than_source");
    return result;
  }

  const backupSource = `${source}.prejunction-${stamp}`;
  fs.renameSync(source, backupSource);
  const junction = makeJunction(source, target);
  result.junction = junction;
  if (!junction.ok || !fs.existsSync(source)) {
    if (fs.existsSync(source)) {
      try { fs.rmSync(source, { recursive: true, force: true }); } catch {}
    }
    fs.renameSync(backupSource, source);
    result.phase = "junction_failed_rolled_back";
    result.messages.push("junction_failed_rolled_back");
    return result;
  }

  const backupResolved = path.resolve(backupSource);
  if (!isWithin(ROOT, backupResolved)) {
    result.phase = "backup_delete_guard_failed";
    result.messages.push("backup_delete_guard_failed");
    return result;
  }
  fs.rmSync(backupSource, { recursive: true, force: true });
  result.ok = true;
  result.phase = "junction_active";
  result.freedBytesApprox = result.sourceStats.bytes;
  result.junctionTarget = junctionTarget(source);
  return result;
}

function buildReport(summary) {
  const rows = summary.results.map((r) => `| ${r.relativePath} | ${Math.round(r.sourceStats.bytes / 1024 / 1024)} | ${r.phase} | ${r.ok} |`).join("\n");
  return `# C Drive Junction Migrator

Generated: ${summary.generatedAt}

Status: ${summary.status}

Mode: ${summary.execute ? "execute" : "preview"}

This migrates cold/generated Asolaria directories to D: and leaves NTFS junctions at the original C: paths. Paths remain stable.

## Drives

- C free before: ${summary.freeBeforeCGB} GB
- C free after: ${summary.freeAfterCGB} GB
- D free before: ${summary.freeBeforeDGB} GB
- D free after: ${summary.freeAfterDGB} GB
- Approx bytes relocated: ${summary.relocatedGB} GB

## Results

| Relative path | MB | Phase | OK |
| --- | ---: | --- | --- |
${rows}
`;
}

function run(argv) {
  const execute = argv.includes("--execute");
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const generatedAt = new Date().toISOString();
  const freeBeforeCGB = driveFreeGb("C:\\");
  const freeBeforeDGB = driveFreeGb("D:\\");
  const results = DEFAULT_CANDIDATES.map((relativePath) => migrateOne(relativePath, execute, stamp));
  const freeAfterCGB = driveFreeGb("C:\\");
  const freeAfterDGB = driveFreeGb("D:\\");
  const relocatedBytes = results.filter((r) => r.ok).reduce((sum, r) => sum + r.freedBytesApprox, 0);
  const summary = {
    ok: results.every((r) => r.ok || r.skipped),
    generatedAt,
    status: execute ? "C_DRIVE_JUNCTION_MIGRATION_EXECUTED" : "C_DRIVE_JUNCTION_MIGRATION_PREVIEW",
    execute,
    policy: {
      preservesCPaths: true,
      usesJunctions: true,
      deletesAfterVerifiedCopy: execute,
      destinationRoot: DEST_ROOT,
      candidates: DEFAULT_CANDIDATES
    },
    freeBeforeCGB,
    freeAfterCGB,
    freeBeforeDGB,
    freeAfterDGB,
    relocatedGB: Math.round((relocatedBytes / 1024 / 1024 / 1024) * 100) / 100,
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
    freeBeforeCGB,
    freeAfterCGB,
    freeBeforeDGB,
    freeAfterDGB,
    relocatedGB: summary.relocatedGB
  });
  return summary;
}

console.log(JSON.stringify(run(process.argv), null, 2));
