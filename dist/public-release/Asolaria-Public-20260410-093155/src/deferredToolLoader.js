/**
 * deferredToolLoader.js — Deferred tool loading for Asolaria agents
 *
 * Pattern extracted from Claude Code's ToolSearchTool (2026-03-31).
 *
 * Instead of injecting all 75 verb definitions + 80 action scores into
 * every agent's context window, we send only lightweight headers
 * (id + one-line description). When the agent needs a specific tool it
 * searches by keyword and the full schema is loaded on demand.
 *
 * CommonJS, zero dependencies.
 *
 * Usage:
 *   const dtl = require('./deferredToolLoader');
 *   const catalog = dtl.buildDeferredCatalog(fullIndex);
 *   const hits   = dtl.searchTools('mqtt publish', catalog);
 *   const schema = dtl.loadToolSchema(hits[0].id, fullIndex);
 *   const prompt = dtl.getDeferredPrompt(catalog);
 */

"use strict";

// ---------------------------------------------------------------------------
// 1. buildDeferredCatalog(fullIndex) -> lightweight headers-only catalog
// ---------------------------------------------------------------------------

/**
 * Accepts the full tool/verb index (array of objects, each with at least
 * `id` and `description`, plus any other fields like `parameters`,
 * `actionScore`, `risk`, `examples`, etc.) and returns a slim catalog
 * containing only what agents need for discovery.
 *
 * @param {Array<{id: string, description: string, [key: string]: any}>} fullIndex
 * @returns {{
 *   headers: Array<{id: string, hint: string}>,
 *   _idSet: Set<string>,
 *   builtAt: string
 * }}
 */
function buildDeferredCatalog(fullIndex) {
  const items = Array.isArray(fullIndex) ? fullIndex : [];
  const headers = [];
  const idSet = new Set();

  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const id = String(item.id || "").trim().toLowerCase();
    if (!id || idSet.has(id)) continue;
    idSet.add(id);

    // Build a one-line hint: first sentence of description, capped at 120 chars.
    const raw = String(item.description || item.hint || item.name || id);
    const firstSentence = raw.split(/[.\n]/)[0].trim();
    const hint = firstSentence.length > 120
      ? firstSentence.slice(0, 117) + "..."
      : firstSentence;

    headers.push({ id, hint });
  }

  return {
    headers,
    _idSet: idSet,
    builtAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// 2. searchTools(query, catalog, maxResults?) -> matching headers
// ---------------------------------------------------------------------------

/**
 * Parse a tool id into searchable word parts.
 * Handles snake_case, camelCase, kebab-case, and dot-separated ids.
 *
 * @param {string} name
 * @returns {string[]}
 */
function parseNameParts(name) {
  return name
    .replace(/([a-z])([A-Z])/g, "$1 $2")   // camelCase
    .replace(/[._\-:/]+/g, " ")             // separators
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Escape a string for use in a RegExp.
 * @param {string} s
 * @returns {string}
 */
function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Search the deferred catalog by keyword query.
 *
 * Query syntax (mirrors Claude Code's ToolSearch):
 *   "select:toolA,toolB"  — exact id selection (comma-separated)
 *   "+mqtt publish"       — require "mqtt" in name, rank by "publish"
 *   "mqtt publish"        — plain keyword search, score & rank
 *
 * @param {string} query
 * @param {ReturnType<typeof buildDeferredCatalog>} catalog
 * @param {number} [maxResults=5]
 * @returns {Array<{id: string, hint: string, score: number}>}
 */
function searchTools(query, catalog, maxResults) {
  if (!query || typeof query !== "string") return [];
  if (!catalog || !Array.isArray(catalog.headers)) return [];
  const max = typeof maxResults === "number" && maxResults > 0 ? maxResults : 5;
  const queryTrimmed = query.trim();

  // --- select: prefix — exact id lookup ---
  const selectMatch = queryTrimmed.match(/^select:(.+)$/i);
  if (selectMatch) {
    const requested = selectMatch[1]
      .split(",")
      .map(function (s) { return s.trim().toLowerCase(); })
      .filter(Boolean);
    const results = [];
    for (const rid of requested) {
      const found = catalog.headers.find(function (h) { return h.id === rid; });
      if (found) results.push({ id: found.id, hint: found.hint, score: 100 });
    }
    return results;
  }

  // --- Parse query terms ---
  const queryLower = queryTrimmed.toLowerCase();
  const terms = queryLower.split(/\s+/).filter(function (t) { return t.length > 0; });

  const requiredTerms = [];
  const optionalTerms = [];
  for (const term of terms) {
    if (term.startsWith("+") && term.length > 1) {
      requiredTerms.push(term.slice(1));
    } else {
      optionalTerms.push(term);
    }
  }

  const scoringTerms = requiredTerms.length > 0
    ? requiredTerms.concat(optionalTerms)
    : terms;

  // Pre-compile word-boundary patterns
  const patterns = {};
  for (const t of scoringTerms) {
    if (!patterns[t]) {
      try {
        patterns[t] = new RegExp("\\b" + escapeRegExp(t) + "\\b");
      } catch (_) {
        patterns[t] = null;
      }
    }
  }

  // --- Exact name match fast path ---
  const exact = catalog.headers.find(function (h) { return h.id === queryLower; });
  if (exact) {
    return [{ id: exact.id, hint: exact.hint, score: 100 }];
  }

  // --- Score each header ---
  var scored = [];
  for (const header of catalog.headers) {
    const parts = parseNameParts(header.id);
    const hintLower = header.hint.toLowerCase();

    // Required-term gate
    if (requiredTerms.length > 0) {
      var passesAll = true;
      for (const rt of requiredTerms) {
        const inParts = parts.some(function (p) { return p.includes(rt); });
        const pat = patterns[rt];
        const inHint = pat ? pat.test(hintLower) : hintLower.includes(rt);
        if (!inParts && !inHint) { passesAll = false; break; }
      }
      if (!passesAll) continue;
    }

    var score = 0;
    for (const term of scoringTerms) {
      // Exact part match (highest signal)
      if (parts.includes(term)) {
        score += 10;
      } else if (parts.some(function (p) { return p.includes(term); })) {
        score += 5;
      }

      // Hint / description match
      const pat = patterns[term];
      if (pat && pat.test(hintLower)) {
        score += 3;
      } else if (hintLower.includes(term)) {
        score += 1;
      }
    }

    if (score > 0) {
      scored.push({ id: header.id, hint: header.hint, score: score });
    }
  }

  // Sort descending by score, then alphabetically for ties
  scored.sort(function (a, b) {
    if (b.score !== a.score) return b.score - a.score;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  return scored.slice(0, max);
}

// ---------------------------------------------------------------------------
// 3. loadToolSchema(toolId, fullIndex) -> full definition on demand
// ---------------------------------------------------------------------------

/**
 * Return the complete tool definition for a given id from the full index.
 * This is what gets injected into the agent's context when it needs
 * the tool's parameters, examples, risk level, action score, etc.
 *
 * @param {string} toolId
 * @param {Array<{id: string, [key: string]: any}>} fullIndex
 * @returns {object|null}  Full tool object, or null if not found.
 */
function loadToolSchema(toolId, fullIndex) {
  if (!toolId || !Array.isArray(fullIndex)) return null;
  const needle = String(toolId).trim().toLowerCase();
  for (const item of fullIndex) {
    if (!item || typeof item !== "object") continue;
    const id = String(item.id || "").trim().toLowerCase();
    if (id === needle) {
      // Return a defensive copy so callers can't mutate the source
      return JSON.parse(JSON.stringify(item));
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// 4. getDeferredPrompt(catalog) -> prompt text for agents
// ---------------------------------------------------------------------------

/**
 * Generate the system-prompt fragment that tells agents how deferred
 * tool loading works. Includes the headers-only listing so the agent
 * knows what tools exist.
 *
 * @param {ReturnType<typeof buildDeferredCatalog>} catalog
 * @returns {string}
 */
function getDeferredPrompt(catalog) {
  const headers = catalog && Array.isArray(catalog.headers) ? catalog.headers : [];
  const count = headers.length;

  const listing = headers
    .map(function (h) { return "- " + h.id + " -- " + h.hint; })
    .join("\n");

  return [
    "## Deferred Tool Loading",
    "",
    count + " tools are available but their full schemas are not loaded.",
    "Only headers (id + one-line hint) are shown below.",
    "",
    "To use a tool:",
    "1. Find the tool you need in the list below.",
    "2. Request its full schema by calling: loadToolSchema(toolId)",
    "3. Once the schema is returned, you may invoke the tool normally.",
    "",
    "You can also search by keyword: searchTools(query)",
    "  - \"select:toolA,toolB\" fetches exact ids",
    '  - "+mqtt publish" requires "mqtt", ranks by "publish"',
    "  - plain keywords score against id parts and hints",
    "",
    "### Available Tools (" + count + ")",
    "",
    listing,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  buildDeferredCatalog,
  searchTools,
  loadToolSchema,
  getDeferredPrompt,
  // Internals exported for testing
  _parseNameParts: parseNameParts,
  _escapeRegExp: escapeRegExp,
};
