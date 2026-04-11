const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const projectRoot = path.resolve(__dirname, "..");
const testsDir = path.join(projectRoot, "tests");

function collectUnitFiles(folderPath) {
  const entries = fs.readdirSync(folderPath, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolutePath = path.join(folderPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectUnitFiles(absolutePath));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".unit.test.js")) {
      files.push(absolutePath);
    }
  }
  return files;
}

const passthroughArgs = process.argv.slice(2);
const explicitTargets = passthroughArgs
  .filter((value) => !String(value || "").startsWith("--"))
  .map((value) => path.resolve(projectRoot, value));
const nodeTestArgs = passthroughArgs.filter((value) => String(value || "").startsWith("--"));
const hasConcurrencyArg = nodeTestArgs.some((value) => String(value || "").startsWith("--test-concurrency"));

const unitFiles = (explicitTargets.length > 0 ? explicitTargets : collectUnitFiles(testsDir))
  .sort((left, right) => left.localeCompare(right));

if (unitFiles.length < 1) {
  console.error("No unit test files found in tests/.");
  process.exit(1);
}

const runnerArgs = [
  "--test",
  ...(hasConcurrencyArg ? [] : ["--test-concurrency=1"]),
  ...nodeTestArgs,
  ...unitFiles
];

const result = spawnSync(process.execPath, runnerArgs, {
  cwd: projectRoot,
  stdio: "inherit"
});

if (result.error) {
  throw result.error;
}

process.exit(Number(result.status || 0));
