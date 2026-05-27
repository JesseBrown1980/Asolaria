"use strict";

const fs = require("fs");
const path = require("path");

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_SECTION_LENGTH = 2000; // tokens (approx chars / 4)
const MAX_TOTAL_TOKENS = 12000;
const CHARS_PER_TOKEN = 4; // rough estimate matching upstream

// ---------------------------------------------------------------------------
// SESSION_TEMPLATE — 10 fixed sections adapted for Asolaria
// ---------------------------------------------------------------------------

const SESSION_TEMPLATE = `# Session Title
_A short, distinctive 5-10 word title for this session. Dense, no filler._

# Current Colony State
_Which colonies are online? What sovereignty tier is active? Pending heartbeats, blockers, and MQTT status. Update every cycle._

# Task Specification
_What did Jesse ask to build or fix? Design decisions, scope boundaries, and any IX entries that define the work._

# Files and IX Entries Modified
_Files touched (absolute paths) and IX/LX entries created or updated. One line per item, terse._

# Agent Dispatch Log
_Which agents were dispatched, to which surface, with what prompt? Include codex/claude/falcon/liris dispatches. Timestamp if available._

# Errors & Corrections
_Errors encountered and how they were resolved. Failed approaches that must NOT be retried. Jesse corrections verbatim._

# Colony Documentation
_System components discovered or documented during the session. How they connect. Colony registry changes._

# Learnings
_New IX entries created this session. Skills extracted from mistakes. Rules reinforced. Do not duplicate other sections._

# Key Results
_Concrete outputs: test results, PR URLs, sovereignty status snapshots, answers to Jesse's questions. Exact content, not summaries._

# Worklog
_Step-by-step record of what was attempted and done. One terse line per step. Chronological._
`;

// ---------------------------------------------------------------------------
// buildSessionMemory — single-pass {{variable}} substitution
// ---------------------------------------------------------------------------

/**
 * Fill {{variable}} placeholders in a template string.
 * Uses a replacer function (not string replacement) so that dollar signs
 * in variable values are treated literally and no double-substitution occurs.
 *
 * @param {string} template - Template with {{variableName}} placeholders
 * @param {Record<string, string>} variables - Key-value pairs to substitute
 * @returns {string}
 */
function buildSessionMemory(template, variables) {
  if (!template || typeof template !== "string") return template || "";
  if (!variables || typeof variables !== "object") return template;

  return template.replace(/\{\{(\w+)\}\}/g, function (match, key) {
    return Object.prototype.hasOwnProperty.call(variables, key)
      ? variables[key]
      : match;
  });
}

// ---------------------------------------------------------------------------
// roughTokenCount — local estimator (no dependencies)
// ---------------------------------------------------------------------------

function roughTokenCount(text) {
  if (!text) return 0;
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

// ---------------------------------------------------------------------------
// truncateSection — cut at line boundaries
// ---------------------------------------------------------------------------

/**
 * Truncate content to fit within maxTokens, cutting at line boundaries.
 * Appends a truncation marker when content is cut.
 *
 * @param {string} content - Section content (without header)
 * @param {number} [maxTokens] - Token budget (default MAX_SECTION_LENGTH)
 * @returns {string}
 */
function truncateSection(content, maxTokens) {
  if (!content) return "";
  const limit = maxTokens != null ? maxTokens : MAX_SECTION_LENGTH;
  const maxChars = limit * CHARS_PER_TOKEN;

  if (content.length <= maxChars) return content;

  const lines = content.split("\n");
  const kept = [];
  let charCount = 0;

  for (const line of lines) {
    if (charCount + line.length + 1 > maxChars) break;
    kept.push(line);
    charCount += line.length + 1;
  }

  kept.push("[... section truncated ...]");
  return kept.join("\n");
}

// ---------------------------------------------------------------------------
// validateSessionMemory — warn when total exceeds budget
// ---------------------------------------------------------------------------

/**
 * Validate session memory content against token budgets.
 * Returns an object with warnings (array of strings) and section sizes.
 *
 * @param {string} content - Full session memory content
 * @returns {{ valid: boolean, totalTokens: number, warnings: string[], sections: Record<string, number> }}
 */
function validateSessionMemory(content) {
  if (!content) {
    return { valid: true, totalTokens: 0, warnings: [], sections: {} };
  }

  const lines = content.split("\n");
  const sections = {};
  let currentSection = "";
  let currentContent = [];
  const warnings = [];

  for (const line of lines) {
    if (line.startsWith("# ")) {
      if (currentSection && currentContent.length > 0) {
        const text = currentContent.join("\n").trim();
        sections[currentSection] = roughTokenCount(text);
      }
      currentSection = line;
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }
  // flush last section
  if (currentSection && currentContent.length > 0) {
    const text = currentContent.join("\n").trim();
    sections[currentSection] = roughTokenCount(text);
  }

  // Check per-section limits
  for (const [section, tokens] of Object.entries(sections)) {
    if (tokens > MAX_SECTION_LENGTH) {
      warnings.push(
        `Section "${section}" is ~${tokens} tokens (limit: ${MAX_SECTION_LENGTH})`
      );
    }
  }

  const totalTokens = roughTokenCount(content);

  if (totalTokens > MAX_TOTAL_TOKENS) {
    warnings.unshift(
      `Total session memory is ~${totalTokens} tokens (limit: ${MAX_TOTAL_TOKENS}). Condense aggressively.`
    );
  }

  return {
    valid: warnings.length === 0,
    totalTokens,
    warnings,
    sections,
  };
}

// ---------------------------------------------------------------------------
// loadCustomTemplate — per-colony override
// ---------------------------------------------------------------------------

/**
 * Load a per-colony session template override from:
 *   runtime/admin-terminals/{colonyId}/session-template.md
 *
 * Falls back to SESSION_TEMPLATE if the file does not exist.
 * Synchronous read — called once at session start, not on hot path.
 *
 * @param {string} colonyId - Colony identifier (e.g. "gaia", "liris")
 * @returns {string}
 */
function loadCustomTemplate(colonyId) {
  if (!colonyId || typeof colonyId !== "string") return SESSION_TEMPLATE;

  // Sanitize to prevent path traversal
  const safe = colonyId.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safe) return SESSION_TEMPLATE;

  const templatePath = path.join(
    __dirname,
    "..",
    "runtime",
    "admin-terminals",
    safe,
    "session-template.md"
  );

  try {
    return fs.readFileSync(templatePath, "utf-8");
  } catch (err) {
    if (err.code === "ENOENT") return SESSION_TEMPLATE;
    // Log but don't crash — fall back to default
    console.error(
      `[sessionMemoryTemplate] Failed to load template for colony "${safe}":`,
      err.message
    );
    return SESSION_TEMPLATE;
  }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  SESSION_TEMPLATE,
  MAX_SECTION_LENGTH,
  MAX_TOTAL_TOKENS,
  buildSessionMemory,
  truncateSection,
  validateSessionMemory,
  loadCustomTemplate,
  roughTokenCount,
};
