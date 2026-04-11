/**
 * Index Ledger — Append-Only Agent Index with Staging/Dev/Prod Pipeline
 *
 * Built by Gaia (2026-03-25) based on Liris's design on Rayssa's machine.
 * Core rule: NEVER overwrite an existing entry. appendEntry() THROWS on overwrite.
 * promoteToProd() runs integrity + chain validation before allowing promotion.
 *
 * Architecture:
 *   staging/  → new entries land here first (staging namespace numbering)
 *   dev/      → validated entries with chain integrity checked
 *   prod/     → data/agent-index/ (the live index, only updated via promotion)
 *   .history/ → rollback snapshots before every promotion
 */

const fs = require("fs");
const path = require("path");

// Default roots (Asolaria Agent Index)
const PROD_ROOT = path.join(__dirname, "..", "data", "agent-index");
const STAGING_ROOT = path.join(__dirname, "..", ".history", "staging");
const DEV_ROOT = path.join(__dirname, "..", ".history", "dev");
const HISTORY_ROOT = path.join(__dirname, "..", ".history", "snapshots");

/**
 * Create a ledger for ANY project — not just the agent index.
 * Every project gets its own staging/dev/prod pipeline.
 */
function createProjectLedger(projectRoot) {
  return {
    PROD_ROOT: projectRoot,
    STAGING_ROOT: path.join(path.dirname(projectRoot), ".history", path.basename(projectRoot), "staging"),
    DEV_ROOT: path.join(path.dirname(projectRoot), ".history", path.basename(projectRoot), "dev"),
    HISTORY_ROOT: path.join(path.dirname(projectRoot), ".history", path.basename(projectRoot), "snapshots"),
  };
}

const CANONICAL_TYPES = [
  "pattern", "tool", "skill", "mistake", "plan",
  "rule", "reference", "project", "task", "identity", "policy"
];

const REQUIRED_FRONTMATTER = ["ix", "name", "type"];

function ensureDirs() {
  for (const dir of [STAGING_ROOT, DEV_ROOT, HISTORY_ROOT]) {
    fs.mkdirSync(dir, { recursive: true });
  }
  for (const t of CANONICAL_TYPES) {
    fs.mkdirSync(path.join(STAGING_ROOT, t), { recursive: true });
    fs.mkdirSync(path.join(DEV_ROOT, t), { recursive: true });
  }
}

/**
 * Parse frontmatter from an IX/LX entry file
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const fm = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim();
      fm[key] = val;
    }
  }
  return fm;
}

/**
 * Check if an entry ID exists in any environment
 */
function entryExists(entryId, searchRoots) {
  if (!searchRoots) searchRoots = [PROD_ROOT, DEV_ROOT, STAGING_ROOT];
  for (const root of searchRoots) {
    for (const t of CANONICAL_TYPES) {
      const fp = path.join(root, t, `${entryId}.md`);
      if (fs.existsSync(fp)) return { root, type: t, path: fp };
    }
    // Also check root level
    const fp = path.join(root, `${entryId}.md`);
    if (fs.existsSync(fp)) return { root, type: "root", path: fp };
  }
  return null;
}

/**
 * Append a new entry to STAGING. Throws if entry ID already exists anywhere.
 */
function appendEntry(entryId, type, content, opts = {}) {
  ensureDirs();

  if (!CANONICAL_TYPES.includes(type)) {
    throw new Error(`Invalid type "${type}". Must be one of: ${CANONICAL_TYPES.join(", ")}`);
  }

  // CORE RULE: Never overwrite
  const existing = entryExists(entryId);
  if (existing && !opts.recovery) {
    throw new Error(
      `OVERWRITE BLOCKED: ${entryId} already exists at ${existing.path}. ` +
      `Create a new entry with the next available number instead. ` +
      `If correcting, use superseded_by field in a NEW entry.`
    );
  }

  const fm = parseFrontmatter(content);
  if (fm) {
    for (const req of REQUIRED_FRONTMATTER) {
      if (!fm[req]) {
        throw new Error(`Missing required frontmatter field: ${req}`);
      }
    }
  }

  const targetDir = path.join(STAGING_ROOT, type);
  const targetPath = path.join(targetDir, `${entryId}.md`);
  fs.writeFileSync(targetPath, content, "utf-8");

  console.log(`${entryId} → staging (${content.substring(0, 60).replace(/\n/g, " ")})`);
  return targetPath;
}

/**
 * Validate chain references for entries in a given root
 */
function validateChains(entries, root) {
  const errors = [];
  for (const entry of entries) {
    const content = fs.readFileSync(entry.path, "utf-8");
    const fm = parseFrontmatter(content);
    if (!fm || !fm.chain) continue;

    const chainRefs = fm.chain.split(",").map(s => s.trim()).filter(Boolean);
    for (const ref of chainRefs) {
      // Check in prod, dev, AND staging — chain targets can be anywhere in the pipeline
      const found = entryExists(ref, [PROD_ROOT, DEV_ROOT, STAGING_ROOT]);
      if (!found) {
        errors.push(`${entry.id}: broken chain → ${ref} (not found in prod, dev, or staging)`);
      }
    }
  }
  return errors;
}

/**
 * List entries in a given environment root
 */
function listEntries(root) {
  const entries = [];
  for (const t of CANONICAL_TYPES) {
    const dir = path.join(root, t);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith(".md")) continue;
      const id = f.replace(".md", "");
      entries.push({ id, type: t, path: path.join(dir, f) });
    }
  }
  return entries;
}

/**
 * Promote entries from staging → dev (chain validation)
 */
function promoteToDevFromStaging() {
  ensureDirs();
  const staged = listEntries(STAGING_ROOT);
  if (staged.length === 0) {
    console.log("Nothing in staging to promote.");
    return { promoted: [], rejected: [] };
  }

  const chainErrors = validateChains(staged, STAGING_ROOT);
  const promoted = [];
  const rejected = [];

  for (const entry of staged) {
    const hasError = chainErrors.some(e => e.startsWith(entry.id + ":"));
    if (hasError) {
      const errs = chainErrors.filter(e => e.startsWith(entry.id + ":"));
      rejected.push({ id: entry.id, errors: errs });
      continue;
    }

    const targetDir = path.join(DEV_ROOT, entry.type);
    fs.mkdirSync(targetDir, { recursive: true });
    const targetPath = path.join(targetDir, `${entry.id}.md`);
    fs.copyFileSync(entry.path, targetPath);
    fs.unlinkSync(entry.path); // Remove from staging after promotion
    promoted.push(entry.id);
  }

  console.log("=== Promoting staging → dev ===");
  console.log("Promoted:", promoted);
  if (rejected.length) console.log("Rejected:", JSON.stringify(rejected, null, 2));
  return { promoted, rejected };
}

/**
 * Promote entries from dev → prod (full integrity check)
 */
function promoteToProd() {
  ensureDirs();
  const devEntries = listEntries(DEV_ROOT);
  if (devEntries.length === 0) {
    console.log("Nothing in dev to promote.");
    return { promoted: [], rejected: [] };
  }

  // Snapshot current prod state before promotion
  const snapshotDir = path.join(HISTORY_ROOT, `pre-promote-${new Date().toISOString().replace(/[:.]/g, "-")}`);
  fs.mkdirSync(snapshotDir, { recursive: true });

  // Full integrity check against prod + dev combined
  const chainErrors = validateChains(devEntries, DEV_ROOT);
  const promoted = [];
  const rejected = [];

  for (const entry of devEntries) {
    const hasError = chainErrors.some(e => e.startsWith(entry.id + ":"));
    if (hasError) {
      rejected.push({ id: entry.id, errors: chainErrors.filter(e => e.startsWith(entry.id + ":")) });
      continue;
    }

    // Check no overwrite in prod
    const existsInProd = entryExists(entry.id, [PROD_ROOT]);
    if (existsInProd) {
      rejected.push({ id: entry.id, errors: [`Already exists in prod at ${existsInProd.path}`] });
      continue;
    }

    // Snapshot existing type folder state
    const prodTypeDir = path.join(PROD_ROOT, entry.type);
    if (!fs.existsSync(prodTypeDir)) fs.mkdirSync(prodTypeDir, { recursive: true });

    // Copy to prod
    const targetPath = path.join(prodTypeDir, `${entry.id}.md`);
    fs.copyFileSync(entry.path, targetPath);
    fs.unlinkSync(entry.path); // Remove from dev after promotion

    // Save snapshot record
    fs.writeFileSync(
      path.join(snapshotDir, `${entry.id}.promoted.json`),
      JSON.stringify({ id: entry.id, type: entry.type, promotedAt: new Date().toISOString(), from: "dev" }),
      "utf-8"
    );

    promoted.push(entry.id);
  }

  console.log("=== Promoting dev → prod ===");
  console.log("Promoted:", promoted);
  if (rejected.length) console.log("Rejected:", JSON.stringify(rejected, null, 2));
  return { promoted, rejected };
}

/**
 * Run full integrity audit on prod index
 */
function auditProd() {
  const entries = listEntries(PROD_ROOT);
  const issues = [];

  // Check frontmatter
  for (const entry of entries) {
    const content = fs.readFileSync(entry.path, "utf-8");
    const fm = parseFrontmatter(content);
    if (!fm) {
      issues.push({ id: entry.id, issue: "missing_frontmatter" });
      continue;
    }
    for (const req of REQUIRED_FRONTMATTER) {
      if (!fm[req]) issues.push({ id: entry.id, issue: `missing_field:${req}` });
    }
    if (fm.type && !CANONICAL_TYPES.includes(fm.type)) {
      issues.push({ id: entry.id, issue: `non_canonical_type:${fm.type}` });
    }
  }

  // Check chains
  const chainErrors = validateChains(entries, PROD_ROOT);
  for (const err of chainErrors) {
    issues.push({ id: err.split(":")[0], issue: `broken_chain:${err}` });
  }

  // Check for duplicates
  const idCounts = {};
  for (const e of entries) {
    idCounts[e.id] = (idCounts[e.id] || 0) + 1;
  }
  for (const [id, count] of Object.entries(idCounts)) {
    if (count > 1) issues.push({ id, issue: `duplicate:${count}_copies` });
  }

  return {
    totalEntries: entries.length,
    issueCount: issues.length,
    issues,
    healthy: issues.length === 0
  };
}

/**
 * Get next available IX/LX number
 */
function getNextNumber(prefix = "IX") {
  const entries = listEntries(PROD_ROOT)
    .concat(listEntries(DEV_ROOT))
    .concat(listEntries(STAGING_ROOT));

  let max = 0;
  const re = new RegExp(`^${prefix}-(\\d+)$`);
  for (const e of entries) {
    const m = e.id.match(re);
    if (m) max = Math.max(max, parseInt(m[1]));
  }
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

module.exports = {
  appendEntry,
  promoteToDevFromStaging,
  promoteToProd,
  auditProd,
  listEntries,
  entryExists,
  getNextNumber,
  validateChains,
  parseFrontmatter,
  ensureDirs,
  PROD_ROOT,
  STAGING_ROOT,
  DEV_ROOT,
  HISTORY_ROOT,
  CANONICAL_TYPES
};
