const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const cachePrefixes = [
  path.join(repoRoot, "src"),
  path.join(repoRoot, "routes"),
  path.join(repoRoot, "tools"),
  path.join(repoRoot, "services"),
  path.join(repoRoot, "public")
];

function resetAsolariaModuleCache() {
  for (const cacheKey of Object.keys(require.cache)) {
    if (cachePrefixes.some((prefix) => cacheKey.startsWith(prefix))) {
      delete require.cache[cacheKey];
    }
  }
}

function createInstanceRoot(name) {
  const prefix = path.join(os.tmpdir(), `asolaria-unit-${String(name || "suite").replace(/[^a-z0-9_-]+/gi, "-")}-`);
  return fs.mkdtempSync(prefix);
}

function loadFromRepo(relativePath) {
  return require(path.join(repoRoot, relativePath));
}

function withFreshAsolaria(name, callback) {
  const previousInstanceRoot = process.env.ASOLARIA_INSTANCE_ROOT;
  const instanceRoot = createInstanceRoot(name);
  process.env.ASOLARIA_INSTANCE_ROOT = instanceRoot;
  resetAsolariaModuleCache();
  const cleanup = () => {
    resetAsolariaModuleCache();
    if (previousInstanceRoot === undefined) {
      delete process.env.ASOLARIA_INSTANCE_ROOT;
    } else {
      process.env.ASOLARIA_INSTANCE_ROOT = previousInstanceRoot;
    }
    fs.rmSync(instanceRoot, { recursive: true, force: true });
  };
  try {
    const result = callback({
      instanceRoot,
      repoRoot,
      load: loadFromRepo
    });
    if (result && typeof result.then === "function") {
      return result.finally(cleanup);
    }
    cleanup();
    return result;
  } catch (error) {
    cleanup();
    throw error;
  }
}

module.exports = {
  repoRoot,
  withFreshAsolaria
};
