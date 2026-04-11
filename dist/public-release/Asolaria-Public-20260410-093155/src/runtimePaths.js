const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const preferredHeavyRuntimeRoot = path.resolve("E:\\runtime\\asolaria-instance");

function resolveInstanceRoot() {
  const raw = String(process.env.ASOLARIA_INSTANCE_ROOT || "").trim();
  if (!raw) {
    // On Jesse's desktop, keep heavy runtime state on E: by default so the
    // repo on C: does not absorb captures, logs, and runtime churn.
    if (fs.existsSync("E:\\runtime")) {
      return preferredHeavyRuntimeRoot;
    }
    return projectRoot;
  }
  return path.resolve(raw);
}

const instanceRoot = resolveInstanceRoot();
const dataDir = path.join(instanceRoot, "data");
const capturesDir = path.join(instanceRoot, "captures");
const logsDir = path.join(instanceRoot, "logs");

function resolveDataPath(...parts) {
  return path.join(dataDir, ...parts);
}

function resolveCapturePath(...parts) {
  return path.join(capturesDir, ...parts);
}

function resolveLogPath(...parts) {
  return path.join(logsDir, ...parts);
}

module.exports = {
  projectRoot,
  instanceRoot,
  dataDir,
  capturesDir,
  logsDir,
  resolveDataPath,
  resolveCapturePath,
  resolveLogPath
};
