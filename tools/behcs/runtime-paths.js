"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");

function firstUsablePath(candidates = []) {
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (candidate === "adb") return candidate;
    if (fs.existsSync(candidate)) return candidate;
  }
  return "";
}

const repoRoot = process.env.BEHCS_ROOT || path.resolve(__dirname, "..", "..");
const homeDir = process.env.USERPROFILE || os.homedir();
const username = path.basename(homeDir);
const claudeProjectsDir = path.join(homeDir, ".claude", "projects");

const memoryCandidates = [
  process.env.BEHCS_MEMORY_DIR,
  process.env.CLAUDE_PROJECT_MEMORY_DIR,
  path.join(claudeProjectsDir, "E--", "memory"),
  path.join(claudeProjectsDir, "C--", "memory"),
  path.join(claudeProjectsDir, `C--Users-${username}-Asolaria`, "memory"),
  path.join(claudeProjectsDir, `C--Users-${username}`, "memory"),
];

const adbCandidates = [
  process.env.BEHCS_ADB,
  process.env.ADB,
  path.join(
    homeDir,
    "AppData",
    "Local",
    "Microsoft",
    "WinGet",
    "Packages",
    "Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe",
    "platform-tools",
    "adb.exe"
  ),
  "adb",
];

const externalBackupRoot = "D:\\safety-backups";
const backupRoot = process.env.BEHCS_BACKUP_ROOT
  || (fs.existsSync("D:\\") ? externalBackupRoot : path.join(repoRoot, ".history", "behcs-backups"));

const memoryDir = firstUsablePath(memoryCandidates);
const adbPath = firstUsablePath(adbCandidates) || "adb";
const behcsDataDir = path.join(repoRoot, "data", "behcs");
const codexDir = path.join(behcsDataDir, "codex");
const cubesDir = path.join(behcsDataDir, "cubes");
const logsDir = path.join(repoRoot, "logs");
const capturesRoot = path.join(logsDir, "captures");

function repoPath(...parts) {
  return path.join(repoRoot, ...parts);
}

function behcsPath(...parts) {
  return path.join(behcsDataDir, ...parts);
}

function captureDir(name) {
  return path.join(capturesRoot, name);
}

function sessionBackupDir(name) {
  return path.join(backupRoot, name);
}

module.exports = {
  repoRoot,
  homeDir,
  username,
  claudeProjectsDir,
  memoryDir,
  behcsDataDir,
  codexDir,
  cubesDir,
  logsDir,
  capturesRoot,
  adbPath,
  backupRoot,
  repoPath,
  behcsPath,
  captureDir,
  sessionBackupDir,
};
