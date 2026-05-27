/**
 * Auto-Dream Memory Consolidator
 *
 * Implements the Asolaria dream cycle:
 *   MEMORY → INDEX → THINK → MEMORY → INDEX → REPORT → MEMORY → INDEX
 *
 * Three-gate consolidation (cheapest first):
 *   1. Time gate    — hours since last consolidation >= minHours
 *   2. Session gate — sessions with activity since last consolidation >= minSessions
 *   3. Lock gate    — no concurrent consolidation (dream.lock with PID + timestamp)
 *
 * All gates pass → scan recent sessions, extract IX-worthy entries, stage them
 * through the indexLedger pipeline, update CATALOG.md counts.
 *
 * CommonJS, zero external dependencies.
 */

const fs = require("fs");
const path = require("path");
const { projectRoot, resolveDataPath } = require("./runtimePaths");
const { CANONICAL_TYPES } = require("./index-kernel/schema");
const { buildAutoIndexPrompt } = require("./autoIndexPrompt");

// ---------------------------------------------------------------------------
// Constants & defaults
// ---------------------------------------------------------------------------

const DREAM_DEFAULTS = Object.freeze({
  minHours: 24,
  minSessions: 5,
});

/** 10 minutes between session scans when time-gate passes but session-gate doesn't */
const SCAN_THROTTLE_MS = 10 * 60 * 1000;

const LOCK_PATH = path.join(projectRoot, "runtime", "dream.lock");
const LAST_CONSOLIDATED_PATH = resolveDataPath("dream-last-consolidated.json");
const SESSIONS_PATH = resolveDataPath("agent-sessions.json");
const CATALOG_PATH = path.join(projectRoot, "data", "agent-index", "CATALOG.md");
const STAGING_ROOT = path.join(projectRoot, ".history", "staging");

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function getMinHours() {
  const env = process.env.ASOLARIA_DREAM_MIN_HOURS;
  if (env != null && env !== "") {
    const n = Number(env);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return DREAM_DEFAULTS.minHours;
}

function getMinSessions() {
  const env = process.env.ASOLARIA_DREAM_MIN_SESSIONS;
  if (env != null && env !== "") {
    const n = Number(env);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return DREAM_DEFAULTS.minSessions;
}

/** Read timestamp of last consolidation. Returns 0 if never consolidated. */
function readLastConsolidatedAt() {
  try {
    if (!fs.existsSync(LAST_CONSOLIDATED_PATH)) return 0;
    const raw = JSON.parse(fs.readFileSync(LAST_CONSOLIDATED_PATH, "utf8"));
    const ts = raw && typeof raw.consolidatedAt === "number" ? raw.consolidatedAt : 0;
    return ts;
  } catch {
    return 0;
  }
}

function writeLastConsolidatedAt(ts) {
  const dir = path.dirname(LAST_CONSOLIDATED_PATH);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${LAST_CONSOLIDATED_PATH}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify({ consolidatedAt: ts, pid: process.pid }, null, 2), "utf8");
  fs.renameSync(tmp, LAST_CONSOLIDATED_PATH);
}

/**
 * List sessions that have been active since `sinceMs`.
 * Scans agent-sessions.json, returns session IDs whose updatedAt > sinceMs.
 */
function listSessionsSince(sinceMs) {
  try {
    if (!fs.existsSync(SESSIONS_PATH)) return [];
    const sessions = JSON.parse(fs.readFileSync(SESSIONS_PATH, "utf8"));
    if (!sessions || typeof sessions !== "object") return [];
    const active = [];
    for (const [id, entry] of Object.entries(sessions)) {
      const ts = entry && (entry.updatedAt || entry.startedAt || 0);
      if (typeof ts === "number" && ts > sinceMs) {
        active.push(id);
      }
    }
    return active;
  } catch {
    return [];
  }
}

/**
 * Scan capture files (transcripts) modified since `sinceMs`.
 * Falls back to mtime scan of captures/ directory.
 */
function listTranscriptsSince(sinceMs) {
  const capturesDir = path.join(projectRoot, "captures");
  try {
    if (!fs.existsSync(capturesDir)) return [];
    const files = fs.readdirSync(capturesDir);
    const recent = [];
    for (const f of files) {
      try {
        const stat = fs.statSync(path.join(capturesDir, f));
        if (stat.mtimeMs > sinceMs) {
          recent.push(f);
        }
      } catch {
        // skip unreadable files
      }
    }
    return recent;
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Lock gate
// ---------------------------------------------------------------------------

function readLock() {
  try {
    if (!fs.existsSync(LOCK_PATH)) return null;
    const raw = JSON.parse(fs.readFileSync(LOCK_PATH, "utf8"));
    if (raw && typeof raw.pid === "number" && typeof raw.lockedAt === "number") {
      return raw;
    }
    return null;
  } catch {
    return null;
  }
}

function isProcessAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Try to acquire the dream lock.
 * Returns true if acquired, false if another process holds it.
 * Stale locks (PID dead or older than 2 hours) are reclaimed.
 */
function tryAcquireLock() {
  fs.mkdirSync(path.dirname(LOCK_PATH), { recursive: true });

  const existing = readLock();
  if (existing) {
    const staleMs = 2 * 60 * 60 * 1000; // 2 hours
    const isStale = (Date.now() - existing.lockedAt) > staleMs;
    const isDead = !isProcessAlive(existing.pid);
    if (!isStale && !isDead) {
      return false; // another live process holds the lock
    }
    // Reclaim stale/dead lock
  }

  const lock = { pid: process.pid, lockedAt: Date.now() };
  const tmp = `${LOCK_PATH}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(lock, null, 2), "utf8");
  fs.renameSync(tmp, LOCK_PATH);
  return true;
}

function releaseLock() {
  try {
    if (fs.existsSync(LOCK_PATH)) {
      const lock = readLock();
      // Only release our own lock
      if (lock && lock.pid === process.pid) {
        fs.unlinkSync(LOCK_PATH);
      }
    }
  } catch {
    // best-effort
  }
}

// ---------------------------------------------------------------------------
// shouldConsolidate — runs 3 gates cheapest-first
// ---------------------------------------------------------------------------

/**
 * @param {object} [state] - Optional overrides: { minHours, minSessions, now }
 * @returns {{ should: boolean, reason: string, gate: string }}
 */
function shouldConsolidate(state = {}) {
  const minHours = state.minHours || getMinHours();
  const minSessions = state.minSessions || getMinSessions();
  const now = state.now || Date.now();

  // Gate 1: Time
  const lastAt = readLastConsolidatedAt();
  const hoursSince = (now - lastAt) / 3_600_000;
  if (hoursSince < minHours) {
    return {
      should: false,
      reason: `Only ${hoursSince.toFixed(1)}h since last consolidation (need ${minHours}h)`,
      gate: "time",
    };
  }

  // Gate 2: Sessions
  const sessions = listSessionsSince(lastAt);
  const transcripts = listTranscriptsSince(lastAt);
  const activityCount = Math.max(sessions.length, transcripts.length);
  if (activityCount < minSessions) {
    return {
      should: false,
      reason: `Only ${activityCount} sessions with activity since last consolidation (need ${minSessions})`,
      gate: "session",
    };
  }

  // Gate 3: Lock
  const existing = readLock();
  if (existing && isProcessAlive(existing.pid)) {
    const ageMs = now - existing.lockedAt;
    const staleMs = 2 * 60 * 60 * 1000;
    if (ageMs < staleMs) {
      return {
        should: false,
        reason: `Lock held by PID ${existing.pid} since ${new Date(existing.lockedAt).toISOString()}`,
        gate: "lock",
      };
    }
  }

  return {
    should: true,
    reason: `${hoursSince.toFixed(1)}h elapsed, ${activityCount} sessions — ready to consolidate`,
    gate: "passed",
  };
}

// ---------------------------------------------------------------------------
// Session scanning — extract IX-worthy entries from recent activity
// ---------------------------------------------------------------------------

/**
 * Scan agent-sessions.json for entries with extractable learnings.
 * Returns array of { sessionId, summary, type, tags }.
 */
function extractIxCandidates(sinceMs) {
  const candidates = [];
  try {
    if (!fs.existsSync(SESSIONS_PATH)) return candidates;
    const sessions = JSON.parse(fs.readFileSync(SESSIONS_PATH, "utf8"));
    if (!sessions || typeof sessions !== "object") return candidates;

    for (const [id, entry] of Object.entries(sessions)) {
      if (!entry) continue;
      const ts = entry.updatedAt || entry.startedAt || 0;
      if (typeof ts !== "number" || ts <= sinceMs) continue;

      // Extract from session metadata — prompt history, errors, resolutions
      const prompts = entry.promptHistory || [];
      for (const p of prompts) {
        const text = String(p.prompt || p.content || p || "").trim();
        if (!text || text.length < 20) continue;

        // Heuristic: look for patterns that indicate learnable moments
        const isSkill = /learned|discovered|figured out|solution|workaround/i.test(text);
        const isMistake = /mistake|error|wrong|failed|broke|bug|fix/i.test(text);
        const isPattern = /pattern|always|never|rule|convention/i.test(text);

        if (isSkill || isMistake || isPattern) {
          candidates.push({
            sessionId: id,
            summary: text.slice(0, 300),
            type: isMistake ? "mistake" : isPattern ? "pattern" : "skill",
            tags: extractTags(text),
            timestamp: ts,
          });
        }
      }
    }
  } catch {
    // non-fatal
  }
  return candidates;
}

function extractTags(text) {
  const tags = new Set();
  const keywords = [
    "mqtt", "ssh", "adb", "whatsapp", "qdd", "ebacmap", "sftp",
    "liris", "gaia", "falcon", "asolaria", "sovereignty",
    "test", "deploy", "pipeline", "bridge", "colony",
  ];
  const lower = text.toLowerCase();
  for (const kw of keywords) {
    if (lower.includes(kw)) tags.add(kw);
  }
  if (tags.size === 0) tags.add("dream-extracted");
  return Array.from(tags);
}

// ---------------------------------------------------------------------------
// CATALOG.md update
// ---------------------------------------------------------------------------

/**
 * Re-count entries per type in the agent-index and update the count column
 * in CATALOG.md. Non-destructive — only touches the count numbers.
 */
function updateCatalogCounts() {
  const indexRoot = path.join(projectRoot, "data", "agent-index");
  const isIndexEntryFile = (name) => /^(IX|LX|FX)-\d{1,4}(?:[^\\/]+)?\.md$/i.test(String(name || ""));

  if (!fs.existsSync(CATALOG_PATH)) return;

  let catalog = fs.readFileSync(CATALOG_PATH, "utf8");

  const typeMap = {
    skills: "Skills",
    patterns: "Patterns",
    mistakes: "Mistakes",
    tools: "Tools",
    plans: "Plans",
    references: "References",
    rules: "Rules",
    policies: "Policies",
    tasks: "Tasks",
    projects: "Projects",
    identity: "Identity",
  };

  let total = 0;
  for (const [dir, label] of Object.entries(typeMap)) {
    const typeDir = path.join(indexRoot, dir);
    let count = 0;
    try {
      if (fs.existsSync(typeDir)) {
        count = fs.readdirSync(typeDir).filter((f) => isIndexEntryFile(f)).length;
      }
    } catch {
      // skip
    }
    total += count;
    // Update the row: | Skills | 41 | ... → | Skills | <count> | ...
    const re = new RegExp(`\\|\\s*${label}\\s*\\|\\s*\\d+\\s*\\|`);
    catalog = catalog.replace(re, `| ${label} | ${count} |`);
  }

  // Update total row
  catalog = catalog.replace(/\|\s*\*\*Total\*\*\s*\|\s*\*\*\d+\*\*\s*\|/, `| **Total** | **${total}** |`);

  const tmp = `${CATALOG_PATH}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, catalog, "utf8");
  fs.renameSync(tmp, CATALOG_PATH);
}

// ---------------------------------------------------------------------------
// consolidate — the main dream cycle
// ---------------------------------------------------------------------------

/**
 * Run the full dream consolidation.
 *
 * @param {object} [options]
 * @param {number} [options.minHours]      - Override time gate threshold
 * @param {number} [options.minSessions]   - Override session gate threshold
 * @param {boolean} [options.force]        - Skip time/session gates (still respects lock)
 * @param {boolean} [options.dryRun]       - Scan and report but don't write entries
 * @param {function} [options.log]         - Logging function (default: console.log)
 * @returns {{ ok: boolean, reason: string, entries: Array, extractionPrompt: string|null, catalogUpdated: boolean }}
 */
function consolidate(options = {}) {
  const log = options.log || console.log;
  const force = !!options.force;
  const dryRun = !!options.dryRun;

  // --- Check gates (unless forced) ---
  if (!force) {
    const check = shouldConsolidate({
      minHours: options.minHours,
      minSessions: options.minSessions,
    });
    if (!check.should) {
      return { ok: false, reason: check.reason, entries: [], extractionPrompt: null, catalogUpdated: false };
    }
  }

  // --- Acquire lock ---
  if (!tryAcquireLock()) {
    const lock = readLock();
    return {
      ok: false,
      reason: `Lock held by PID ${lock ? lock.pid : "unknown"}`,
      entries: [],
      extractionPrompt: null,
      catalogUpdated: false,
    };
  }

  let entries = [];
  let catalogUpdated = false;

  try {
    log("[dream] Lock acquired, scanning sessions...");

    const sinceMs = readLastConsolidatedAt();
    const candidates = extractIxCandidates(sinceMs);

    log(`[dream] Found ${candidates.length} IX-worthy candidates`);

    // --- Build LLM extraction prompt from session data ---
    // Convert candidates into turn-like objects for the prompt builder
    const recentTurns = candidates.map((c) => ({
      role: "assistant",
      content: c.summary,
    }));

    // Load existing IX entry summaries for duplicate detection
    let existingEntries = [];
    try {
      const indexRoot = path.join(projectRoot, "data", "agent-index");
      for (const t of CANONICAL_TYPES) {
        const typeDir = path.join(indexRoot, t + "s");
        if (!fs.existsSync(typeDir)) continue;
        const files = fs.readdirSync(typeDir).filter((f) => f.startsWith("IX-") && f.endsWith(".md"));
        for (const f of files) {
          const m = f.match(/^IX-(\d+)\.md$/);
          if (m) {
            existingEntries.push({ ix: parseInt(m[1], 10), name: f, type: t });
          }
        }
      }
    } catch {
      // non-fatal — prompt will just skip duplicate check section
    }

    let extractionPrompt = null;
    try {
      extractionPrompt = buildAutoIndexPrompt(recentTurns, existingEntries);
      log(`[dream] Built LLM extraction prompt (${extractionPrompt.length} chars, ${recentTurns.length} turns, ${existingEntries.length} existing entries)`);
    } catch (e) {
      log(`[dream] WARNING: buildAutoIndexPrompt failed (${e.message}), falling back to regex extraction`);
    }

    if (candidates.length === 0) {
      writeLastConsolidatedAt(Date.now());
      return {
        ok: true,
        reason: "No IX-worthy entries found — timestamp advanced",
        entries: [],
        extractionPrompt,
        catalogUpdated: false,
      };
    }

    if (dryRun) {
      log("[dream] Dry run — skipping writes");
      return {
        ok: true,
        reason: `Dry run: ${candidates.length} candidates identified`,
        entries: candidates,
        extractionPrompt,
        catalogUpdated: false,
      };
    }

    // --- Stage entries through indexLedger ---
    let ledger;
    try {
      ledger = require("./indexLedger");
    } catch (e) {
      log(`[dream] WARNING: indexLedger not available (${e.message}), writing entries directly to staging`);
      ledger = null;
    }

    for (const candidate of candidates) {
      const nextId = getNextStagingId(candidate.type);
      const frontmatter = [
        "---",
        `ix: ${nextId}`,
        `name: ${candidate.type.toUpperCase()} — ${candidate.summary.slice(0, 100)}`,
        `type: ${candidate.type}`,
        `tags: [${candidate.tags.join(", ")}, dream-consolidated]`,
        `chain: []`,
        `agents: [dream-consolidator]`,
        `dream_session: ${candidate.sessionId}`,
        `dream_timestamp: ${new Date(candidate.timestamp).toISOString()}`,
        "---",
        "",
        `# ${candidate.summary.slice(0, 100)}`,
        "",
        `## Source`,
        `Extracted during dream consolidation from session \`${candidate.sessionId}\`.`,
        "",
        `## Content`,
        candidate.summary,
        "",
      ].join("\n");

      if (ledger) {
        try {
          ledger.appendEntry(`IX-${String(nextId).padStart(3, "0")}`, candidate.type, frontmatter);
          entries.push({ id: `IX-${String(nextId).padStart(3, "0")}`, type: candidate.type, staged: true });
          log(`[dream] Staged IX-${String(nextId).padStart(3, "0")} (${candidate.type})`);
        } catch (e) {
          log(`[dream] Failed to stage entry: ${e.message}`);
        }
      } else {
        // Direct write to staging fallback
        const typeDir = path.join(STAGING_ROOT, candidate.type);
        fs.mkdirSync(typeDir, { recursive: true });
        const filePath = path.join(typeDir, `IX-${String(nextId).padStart(3, "0")}.md`);
        if (!fs.existsSync(filePath)) {
          fs.writeFileSync(filePath, frontmatter, "utf8");
          entries.push({ id: `IX-${String(nextId).padStart(3, "0")}`, type: candidate.type, staged: true });
          log(`[dream] Wrote ${filePath}`);
        }
      }
    }

    // --- Update CATALOG.md counts ---
    try {
      updateCatalogCounts();
      catalogUpdated = true;
      log("[dream] CATALOG.md counts updated");
    } catch (e) {
      log(`[dream] CATALOG.md update failed: ${e.message}`);
    }

    // --- Advance timestamp ---
    writeLastConsolidatedAt(Date.now());
    log(`[dream] Consolidation complete: ${entries.length} entries staged`);

    return {
      ok: true,
      reason: `Consolidated ${entries.length} entries from ${candidates.length} candidates`,
      entries,
      extractionPrompt,
      catalogUpdated,
    };
  } catch (e) {
    log(`[dream] Consolidation failed: ${e.message}`);
    return {
      ok: false,
      reason: `Consolidation error: ${e.message}`,
      entries,
      extractionPrompt,
      catalogUpdated,
    };
  } finally {
    releaseLock();
  }
}

// ---------------------------------------------------------------------------
// Staging ID allocation
// ---------------------------------------------------------------------------

/**
 * Find the next available staging ID globally across ALL types.
 * IX numbers are a single global namespace — scanning only one type
 * would risk collisions with IDs already allocated in other types.
 */
function getNextStagingId(_type) {
  const indexRoot = path.join(projectRoot, "data", "agent-index");

  // Collect every directory that could contain IX-*.md files:
  //   1. All canonical type directories under data/agent-index/
  //   2. All staging subdirectories
  const dirs = [];
  for (const t of CANONICAL_TYPES) {
    dirs.push(path.join(indexRoot, t + "s"));
    dirs.push(path.join(STAGING_ROOT, t));
  }

  let maxNum = 0;
  for (const dir of dirs) {
    try {
      if (!fs.existsSync(dir)) continue;
      const files = fs.readdirSync(dir);
      for (const f of files) {
        const m = f.match(/^IX-(\d+)\.md$/);
        if (m) {
          const n = parseInt(m[1], 10);
          if (n > maxNum) maxNum = n;
        }
      }
    } catch {
      // skip
    }
  }

  return maxNum + 1;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  shouldConsolidate,
  consolidate,
  DREAM_DEFAULTS,
  SCAN_THROTTLE_MS,
  // Internals exposed for testing/orchestration
  _internal: {
    readLastConsolidatedAt,
    writeLastConsolidatedAt,
    listSessionsSince,
    listTranscriptsSince,
    extractIxCandidates,
    tryAcquireLock,
    releaseLock,
    readLock,
    updateCatalogCounts,
    getNextStagingId,
    LOCK_PATH,
    LAST_CONSOLIDATED_PATH,
  },
};
