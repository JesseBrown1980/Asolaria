/**
 * promptCacheBoundary.js — Prompt cache boundary optimization for Asolaria
 *
 * Splits system prompts into a memoized static zone (constitution, rules,
 * tool definitions, brain policy) and a volatile dynamic zone (colony status,
 * IX entries, current task, session context).  A boundary marker separates
 * them so the static prefix can be cache-hit across turns.
 *
 * Pattern adapted from claude-code's systemPromptSections.ts and prompts.ts
 * SYSTEM_PROMPT_DYNAMIC_BOUNDARY design.
 *
 * CommonJS, zero dependencies.
 */

"use strict";

// ── Boundary marker ────────────────────────────────────────────────────────
const PROMPT_CACHE_BOUNDARY = "__ASOLARIA_PROMPT_CACHE_BOUNDARY__";

// ── Internal state ─────────────────────────────────────────────────────────
let _cachedStaticPrompt = null;
let _cachedStaticKey = null; // JSON of the section names, for staleness check
const MAX_CACHE_LOG = 100;
let _cacheLog = [];          // Tracks invalidation + uncached-section reasons

function _now() {
  return new Date().toISOString();
}

// ── 1. buildCachedPrompt ───────────────────────────────────────────────────
/**
 * Assembles the static zone from an array of section objects.
 * Each section: { name: string, build: () => string }
 *
 * Memoized — returns the same string until invalidateCache() is called.
 * The key is derived from the section names so a different set of sections
 * automatically invalidates.
 *
 * @param {Array<{name: string, build: () => string}>} staticSections
 * @returns {string}
 */
function buildCachedPrompt(staticSections) {
  if (!Array.isArray(staticSections) || staticSections.length === 0) {
    throw new Error("buildCachedPrompt: staticSections must be a non-empty array");
  }

  const key = staticSections.map((s) => s.name).join("|");

  if (_cachedStaticPrompt !== null && _cachedStaticKey === key) {
    return _cachedStaticPrompt;
  }

  const parts = [];
  for (const section of staticSections) {
    const text = section.build();
    if (text != null && text !== "") {
      parts.push(`# ${section.name}\n${text}`);
    }
  }

  _cachedStaticPrompt = parts.join("\n\n");
  _cachedStaticKey = key;
  return _cachedStaticPrompt;
}

// ── 2. buildDynamicPrompt ──────────────────────────────────────────────────
/**
 * Assembles the volatile zone from session state.
 * Recomputes every call — never memoized.
 *
 * @param {object} sessionState
 * @param {string}  [sessionState.colonyStatus]   — colony registry summary
 * @param {string}  [sessionState.ixEntries]      — recent IX/LX entries
 * @param {string}  [sessionState.currentTask]     — active task description
 * @param {string}  [sessionState.sessionContext]  — any session-specific notes
 * @param {object}  [sessionState.extra]           — arbitrary key/value pairs
 * @returns {string}
 */
function buildDynamicPrompt(sessionState) {
  if (!sessionState || typeof sessionState !== "object") {
    return "";
  }

  const parts = [];

  if (sessionState.colonyStatus) {
    parts.push(`# Colony Status\n${sessionState.colonyStatus}`);
  }
  if (sessionState.ixEntries) {
    parts.push(`# Index Entries\n${sessionState.ixEntries}`);
  }
  if (sessionState.currentTask) {
    parts.push(`# Current Task\n${sessionState.currentTask}`);
  }
  if (sessionState.sessionContext) {
    parts.push(`# Session Context\n${sessionState.sessionContext}`);
  }
  if (sessionState.extra && typeof sessionState.extra === "object") {
    for (const [key, value] of Object.entries(sessionState.extra)) {
      if (value != null && value !== "") {
        parts.push(`# ${key}\n${value}`);
      }
    }
  }

  return parts.join("\n\n");
}

// ── 3. assembleFullPrompt ──────────────────────────────────────────────────
/**
 * Joins static (cached) and dynamic zones with the boundary marker between.
 *
 * @param {string} cached  — output of buildCachedPrompt
 * @param {string} dynamic — output of buildDynamicPrompt
 * @returns {string}
 */
function assembleFullPrompt(cached, dynamic) {
  const staticPart = cached || "";
  const dynamicPart = dynamic || "";

  if (!staticPart && !dynamicPart) {
    return "";
  }
  if (!dynamicPart) {
    return staticPart;
  }
  if (!staticPart) {
    return `${PROMPT_CACHE_BOUNDARY}\n${dynamicPart}`;
  }

  return `${staticPart}\n\n${PROMPT_CACHE_BOUNDARY}\n\n${dynamicPart}`;
}

// ── 4. DANGEROUS_uncachedSection ───────────────────────────────────────────
/**
 * Wrapper that forces a reason string for any cache-busting section.
 * Logs the reason so cache misses are auditable.
 *
 * Use this when a section MUST live in the static zone but changes
 * unpredictably — it will invalidate the cache on every call.
 *
 * @param {string} reason   — human-readable justification for cache-busting
 * @param {() => string} builder — function that produces the section text
 * @returns {string}
 */
function DANGEROUS_uncachedSection(reason, builder) {
  if (!reason || typeof reason !== "string") {
    throw new Error("DANGEROUS_uncachedSection: a reason string is required");
  }
  if (typeof builder !== "function") {
    throw new Error("DANGEROUS_uncachedSection: builder must be a function");
  }

  _cacheLog.push({
    type: "uncached_section",
    reason,
    timestamp: _now(),
  });
  if (_cacheLog.length > MAX_CACHE_LOG) _cacheLog.splice(0, _cacheLog.length - MAX_CACHE_LOG);

  // Force full invalidation since the static zone is now stale
  invalidateCache(`DANGEROUS_uncachedSection: ${reason}`);

  return builder();
}

// ── 5. invalidateCache ─────────────────────────────────────────────────────
/**
 * Clears the memoized static prompt. Next call to buildCachedPrompt will
 * recompute from scratch.
 *
 * @param {string} reason — why the cache is being cleared
 */
function invalidateCache(reason) {
  _cacheLog.push({
    type: "invalidation",
    reason: reason || "no reason given",
    timestamp: _now(),
  });
  if (_cacheLog.length > MAX_CACHE_LOG) _cacheLog.splice(0, _cacheLog.length - MAX_CACHE_LOG);

  _cachedStaticPrompt = null;
  _cachedStaticKey = null;
}

// ── Diagnostics ────────────────────────────────────────────────────────────
/**
 * Returns a snapshot of the cache log for debugging/auditing.
 * @returns {Array<{type: string, reason: string, timestamp: string}>}
 */
function getCacheLog() {
  return _cacheLog.slice();
}

/**
 * Returns true if the static prompt is currently cached.
 * @returns {boolean}
 */
function isCached() {
  return _cachedStaticPrompt !== null;
}

/**
 * Resets all internal state (cache + log). For testing only.
 */
function _resetAll() {
  _cachedStaticPrompt = null;
  _cachedStaticKey = null;
  _cacheLog = [];
}

// ── Exports ────────────────────────────────────────────────────────────────
module.exports = {
  PROMPT_CACHE_BOUNDARY,
  buildCachedPrompt,
  buildDynamicPrompt,
  assembleFullPrompt,
  DANGEROUS_uncachedSection,
  invalidateCache,
  getCacheLog,
  isCached,
  _resetAll,
};
