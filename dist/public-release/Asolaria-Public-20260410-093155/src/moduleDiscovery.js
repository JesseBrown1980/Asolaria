/**
 * Module Discovery via SKILL.md / MODULE.md Manifests
 *
 * Any directory containing a SKILL.md or MODULE.md is a self-contained module.
 * The manifest uses markdown with YAML frontmatter to declare capabilities,
 * dependencies, risk level, and entry point.
 *
 * Namespace convention: parentDir:moduleName for collision avoidance.
 *
 * Exports:
 *   discoverModules(rootDirs)        — recursive scan for manifests
 *   parseModuleManifest(filePath)    — extract descriptor from frontmatter
 *   validateModule(descriptor)       — check required fields + entry point
 *   buildModuleRegistry(modules)     — deduplicate, build searchable registry
 */

const fs = require("fs");
const path = require("path");

// Manifest filenames we recognize (case-insensitive match)
const MANIFEST_NAMES = ["SKILL.md", "MODULE.md"];
const MANIFEST_RE = /^(skill|module)\.md$/i;

// Required frontmatter fields
const REQUIRED_FIELDS = ["name", "type", "entry"];

// Valid risk levels (ascending severity)
const RISK_LEVELS = ["low", "medium", "high", "critical"];

// Directories to skip during recursive scan
const SKIP_DIRS = new Set([
  "node_modules", ".git", ".hg", ".svn", "dist", "build",
  "coverage", "__pycache__", ".tox", ".mypy_cache",
]);

// Maximum recursion depth to prevent runaway traversal (symlink loops, deeply nested trees)
const MAX_DEPTH = 20;

// ---------------------------------------------------------------------------
// YAML frontmatter parser (no dependencies)
// ---------------------------------------------------------------------------

/**
 * Parse YAML frontmatter from markdown content.
 * Expects --- delimited block at the top of the file.
 * Handles simple key: value, key: [array], and multiline strings.
 *
 * @param {string} raw - full file content
 * @returns {{ frontmatter: object, body: string }}
 */
function parseFrontmatter(raw) {
  const frontmatter = {};
  let body = raw;

  const match = raw.match(/^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?([\s\S]*)$/);
  if (!match) return { frontmatter, body };

  const yamlBlock = match[1];
  body = match[2];

  for (const line of yamlBlock.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) continue;

    const key = trimmed.slice(0, colonIdx).trim();
    let value = trimmed.slice(colonIdx + 1).trim();

    // Inline array: [a, b, c]
    if (value.startsWith("[") && value.endsWith("]")) {
      value = value
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    }
    // Boolean
    else if (value === "true") value = true;
    else if (value === "false") value = false;
    // Number
    else if (/^\d+$/.test(value)) value = parseInt(value, 10);
    // Strip quotes
    else value = value.replace(/^["']|["']$/g, "");

    frontmatter[key] = value;
  }

  return { frontmatter, body };
}

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

/**
 * Recursively walk directories looking for SKILL.md / MODULE.md files.
 * Returns absolute paths to all discovered manifest files.
 *
 * Tracks visited directories by resolved real path to avoid symlink loops,
 * and enforces MAX_DEPTH to prevent runaway recursion.
 *
 * @param {string} dir - directory to scan
 * @param {string[]} [acc] - accumulator (internal)
 * @param {Set<string>} [visited] - real paths already traversed
 * @param {number} [depth] - current recursion depth
 * @returns {string[]}
 */
function walkForManifests(dir, acc = [], visited = new Set(), depth = 0) {
  if (depth > MAX_DEPTH) return acc;

  let realDir;
  try {
    realDir = fs.realpathSync(dir);
  } catch {
    return acc;
  }

  if (visited.has(realDir)) return acc;
  visited.add(realDir);

  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walkForManifests(path.join(dir, entry.name), acc, visited, depth + 1);
    } else if (entry.isFile() && MANIFEST_RE.test(entry.name)) {
      acc.push(path.join(dir, entry.name));
    }
  }

  return acc;
}

/**
 * Build a namespace from the manifest's location relative to the root dir.
 * Convention: parentDir:moduleName
 *
 * @param {string} manifestPath - absolute path to the manifest file
 * @param {string} rootDir      - the root directory this scan started from
 * @returns {string}
 */
function buildNamespace(manifestPath, rootDir) {
  const moduleDir = path.dirname(manifestPath);
  const moduleName = path.basename(moduleDir);
  const parentRel = path.relative(rootDir, path.dirname(moduleDir));

  if (!parentRel || parentRel === ".") return moduleName;

  const parentParts = parentRel.split(path.sep).filter(Boolean);
  return [...parentParts, moduleName].join(":");
}

/**
 * Parse a SKILL.md or MODULE.md file into a module descriptor.
 *
 * Expected frontmatter keys:
 *   name          (string, required)  — human-readable module name
 *   description   (string)            — what this module does
 *   type          (string, required)  — e.g. connector, skill, service, tool
 *   risk          (string)            — low | medium | high | critical
 *   permissions   (string[])          — capabilities this module needs
 *   dependencies  (string[])          — other module names this depends on
 *   entry         (string, required)  — relative path to the JS entry point
 *   version       (string)            — semver or freeform version
 *
 * @param {string} filePath - absolute path to manifest file
 * @returns {object} module descriptor
 */
function parseModuleManifest(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const { frontmatter, body } = parseFrontmatter(raw);

  const moduleDir = path.dirname(filePath);
  const manifestType = path.basename(filePath).toLowerCase().startsWith("skill")
    ? "skill"
    : "module";

  // Normalize arrays
  const ensureArray = (v) => {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    return String(v).split(",").map((s) => s.trim()).filter(Boolean);
  };

  const descriptor = {
    name: frontmatter.name || path.basename(moduleDir),
    description: frontmatter.description || extractFirstParagraph(body),
    type: frontmatter.type || manifestType,
    risk: normalizeRisk(frontmatter.risk),
    permissions: ensureArray(frontmatter.permissions),
    dependencies: ensureArray(frontmatter.dependencies),
    entry: frontmatter.entry || null,
    version: frontmatter.version || "0.0.0",
    // Metadata added during discovery
    manifestPath: filePath,
    moduleDir: moduleDir,
    namespace: null, // filled by discoverModules
  };

  return descriptor;
}

/**
 * Extract the first non-empty paragraph from markdown body as a fallback
 * description when frontmatter has no description field.
 *
 * @param {string} body
 * @returns {string}
 */
function extractFirstParagraph(body) {
  if (!body) return "";
  const lines = body.split(/\r?\n/);
  for (const line of lines) {
    const t = line.trim();
    if (t && !t.startsWith("#") && !t.startsWith("---")) {
      return t.length > 200 ? t.slice(0, 197) + "..." : t;
    }
  }
  return "";
}

/**
 * Normalize risk level to one of the known values, default "low".
 *
 * @param {*} raw
 * @returns {string}
 */
function normalizeRisk(raw) {
  if (!raw) return "low";
  const lower = String(raw).toLowerCase();
  return RISK_LEVELS.includes(lower) ? lower : "low";
}

/**
 * Scan one or more root directories for SKILL.md / MODULE.md manifests.
 * Returns an array of fully-populated module descriptors.
 *
 * @param {string|string[]} rootDirs - one or more directories to scan
 * @returns {object[]} array of module descriptors
 */
function discoverModules(rootDirs) {
  const dirs = Array.isArray(rootDirs) ? rootDirs : [rootDirs];
  const results = [];

  for (const rootDir of dirs) {
    const resolved = path.resolve(rootDir);
    const manifests = walkForManifests(resolved);

    for (const manifestPath of manifests) {
      try {
        const descriptor = parseModuleManifest(manifestPath);
        descriptor.namespace = buildNamespace(manifestPath, resolved);
        descriptor.rootDir = resolved;
        results.push(descriptor);
      } catch (err) {
        // Log but don't crash — one bad manifest shouldn't kill discovery
        results.push({
          name: path.basename(path.dirname(manifestPath)),
          namespace: buildNamespace(manifestPath, resolved),
          manifestPath,
          moduleDir: path.dirname(manifestPath),
          rootDir: resolved,
          error: err.message,
          valid: false,
        });
      }
    }
  }

  return results;
}

/**
 * Validate a module descriptor. Checks:
 *   1. All required frontmatter fields are present
 *   2. Entry point file actually exists on disk
 *
 * @param {object} descriptor - module descriptor from parseModuleManifest
 * @returns {{ valid: boolean, errors: string[], descriptor: object }}
 */
function validateModule(descriptor) {
  const errors = [];

  if (descriptor.error) {
    return { valid: false, errors: [descriptor.error], descriptor };
  }

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (!descriptor[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Check entry point exists
  if (descriptor.entry && descriptor.moduleDir) {
    const entryPath = path.resolve(descriptor.moduleDir, descriptor.entry);
    if (!fs.existsSync(entryPath)) {
      errors.push(`Entry point not found: ${descriptor.entry} (resolved to ${entryPath})`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    descriptor,
  };
}

/**
 * Build a searchable module registry from an array of descriptors.
 * Deduplicates by namespace (last-wins priority so later rootDirs override earlier ones).
 *
 * The registry object exposes:
 *   .modules      — Map<namespace, descriptor>
 *   .get(name)    — lookup by namespace or plain name
 *   .list()       — all descriptors as array
 *   .search(q)    — filter by substring match on namespace, name, or description
 *   .byType(t)    — filter by module type
 *   .byRisk(r)    — filter by risk level
 *   .validate()   — validate all modules, returns { valid: [], invalid: [] }
 *
 * @param {object[]} modules - array of module descriptors
 * @returns {object} registry
 */
function buildModuleRegistry(modules) {
  const map = new Map();

  // Last-wins deduplication by namespace
  for (const mod of modules) {
    const key = mod.namespace || mod.name;
    map.set(key, mod);
  }

  // Secondary index: plain name -> namespace (for short lookups)
  const nameIndex = new Map();
  for (const [ns, mod] of map) {
    const plain = mod.name;
    // If multiple modules share a plain name, the nameIndex won't help —
    // callers must use the full namespace. Last-wins here too.
    nameIndex.set(plain, ns);
  }

  return {
    modules: map,

    /**
     * Lookup by full namespace or plain name.
     * @param {string} query
     * @returns {object|null}
     */
    get(query) {
      if (map.has(query)) return map.get(query);
      const ns = nameIndex.get(query);
      return ns ? map.get(ns) : null;
    },

    /**
     * All registered descriptors.
     * @returns {object[]}
     */
    list() {
      return Array.from(map.values());
    },

    /**
     * Search by substring across namespace, name, and description.
     * @param {string} q
     * @returns {object[]}
     */
    search(q) {
      const lower = q.toLowerCase();
      return Array.from(map.values()).filter((m) => {
        const haystack = [m.namespace, m.name, m.description]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(lower);
      });
    },

    /**
     * Filter by module type.
     * @param {string} type
     * @returns {object[]}
     */
    byType(type) {
      const lower = type.toLowerCase();
      return Array.from(map.values()).filter(
        (m) => m.type && m.type.toLowerCase() === lower
      );
    },

    /**
     * Filter by risk level.
     * @param {string} risk
     * @returns {object[]}
     */
    byRisk(risk) {
      const lower = risk.toLowerCase();
      return Array.from(map.values()).filter(
        (m) => m.risk && m.risk.toLowerCase() === lower
      );
    },

    /**
     * Validate all modules in the registry.
     * @returns {{ valid: object[], invalid: { descriptor: object, errors: string[] }[] }}
     */
    validate() {
      const valid = [];
      const invalid = [];
      for (const mod of map.values()) {
        const result = validateModule(mod);
        if (result.valid) {
          valid.push(result.descriptor);
        } else {
          invalid.push({ descriptor: result.descriptor, errors: result.errors });
        }
      }
      return { valid, invalid };
    },

    /** Number of registered modules. */
    get size() {
      return map.size;
    },
  };
}

module.exports = {
  discoverModules,
  parseModuleManifest,
  validateModule,
  buildModuleRegistry,
  // Internals exposed for testing
  _parseFrontmatter: parseFrontmatter,
  _buildNamespace: buildNamespace,
  _walkForManifests: walkForManifests,
  RISK_LEVELS,
  REQUIRED_FIELDS,
  MAX_DEPTH,
};
