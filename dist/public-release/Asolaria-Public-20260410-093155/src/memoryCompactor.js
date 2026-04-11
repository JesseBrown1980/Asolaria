/**
 * memoryCompactor.js — 3-tier memory compaction for Asolaria
 *
 * Translated from Claude Code's compact/ subsystem into CommonJS
 * for integration with memoryStore.js's turn structure:
 *   { id, role, text, images, files, meta, at }
 *
 * Tiers:
 *   1. microCompact  — clear old tool results in-place (mark "[Cleared]")
 *   2. autoCompactCheck — evaluate whether compaction is needed
 *   3. fullCompact   — summarize old turns into a condensed entry
 *
 * Pure CommonJS, zero dependencies.
 */

"use strict";

// ---------------------------------------------------------------------------
// Defaults — maxTurns intentionally read lazily so tests / env overrides work
// ---------------------------------------------------------------------------

const DEFAULTS = {
  /** Turns older than this many positions from the tail get micro-compacted */
  microKeepRecent: 10,
  /** Roles whose text is eligible for micro-clear (tool outputs, system noise) */
  microClearableRoles: new Set(["system"]),
  /** Patterns in meta.type that mark a turn as tool output (clearable) */
  microClearableMetaTypes: new Set([
    "tool_result", "bash_output", "file_read", "grep_result",
    "glob_result", "web_fetch", "web_search",
  ]),
  /** Placeholder left after micro-clear */
  clearedMarker: "[Cleared]",
  /** When token estimate exceeds this fraction of maxTurns, auto-compact fires */
  autoCompactThresholdRatio: 0.80,
  /** Full-compact keeps this many recent turns verbatim */
  fullCompactKeepRecent: 8,
  /** Rough chars-per-token estimate (conservative, matches Claude Code's 4/3 pad) */
  charsPerToken: 3,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Rough token count for a string — mirrors Claude Code's roughTokenCountEstimation
 * with a conservative 4/3 padding factor.
 */
function estimateTokens(text) {
  if (!text || typeof text !== "string") return 0;
  return Math.ceil((text.length / DEFAULTS.charsPerToken) * (4 / 3));
}

/**
 * Estimate total tokens across an array of turns.
 */
function estimateTurnsTokens(turns) {
  let total = 0;
  for (const t of turns) {
    total += estimateTokens(t.text || "");
    // Images/files get a flat penalty similar to Claude Code's IMAGE_MAX_TOKEN_SIZE
    if (Array.isArray(t.images)) total += t.images.length * 500;
    if (Array.isArray(t.files)) total += t.files.length * 200;
  }
  return total;
}

/**
 * Check whether a turn is "clearable" for micro-compact:
 *  - system role, OR
 *  - meta.type matches a known tool-output type
 */
function isClearable(turn, opts) {
  const clearableRoles = opts.clearableRoles || DEFAULTS.microClearableRoles;
  const clearableTypes = opts.clearableMetaTypes || DEFAULTS.microClearableMetaTypes;
  if (clearableRoles.has(turn.role)) return true;
  if (turn.meta && clearableTypes.has(turn.meta.type)) return true;
  return false;
}

/**
 * Check whether a turn's text is already cleared.
 */
function isAlreadyCleared(turn) {
  return turn.text === DEFAULTS.clearedMarker;
}

// ---------------------------------------------------------------------------
// Tier 1 — microCompact
// ---------------------------------------------------------------------------

/**
 * Clear old tool-result / system turns that are more than `keepRecent`
 * positions from the tail. Returns a NEW array (never mutates input).
 *
 * @param {Array} turns — array of turn objects { id, role, text, images, files, meta, at }
 * @param {Object} [options]
 * @param {number} [options.keepRecent=10]      — how many tail turns to protect
 * @param {Set}    [options.clearableRoles]      — roles eligible for clearing
 * @param {Set}    [options.clearableMetaTypes]  — meta.type values eligible for clearing
 * @param {string} [options.clearedMarker]       — replacement text
 * @returns {{ turns: Array, cleared: number, tokensSaved: number }}
 */
function microCompact(turns, options) {
  if (!Array.isArray(turns) || turns.length === 0) {
    return { turns: turns || [], cleared: 0, tokensSaved: 0 };
  }

  const opts = Object.assign({}, DEFAULTS, options);
  const keepRecent = Math.max(1, opts.keepRecent || opts.microKeepRecent);
  const marker = opts.clearedMarker || DEFAULTS.clearedMarker;
  const cutoff = Math.max(0, turns.length - keepRecent);

  let cleared = 0;
  let tokensSaved = 0;

  const result = turns.map((turn, idx) => {
    if (idx >= cutoff) return turn; // protected tail
    if (isAlreadyCleared(turn)) return turn; // already done
    if (!isClearable(turn, opts)) return turn; // not eligible

    const saved = estimateTokens(turn.text);
    tokensSaved += saved;
    cleared++;

    return Object.assign({}, turn, {
      text: marker,
      // Preserve meta but stamp the compaction
      meta: Object.assign({}, turn.meta, {
        _compacted: "micro",
        _compactedAt: new Date().toISOString(),
        _originalTokens: saved,
      }),
    });
  });

  return { turns: result, cleared, tokensSaved };
}

// ---------------------------------------------------------------------------
// Tier 2 — autoCompactCheck
// ---------------------------------------------------------------------------

/**
 * Evaluate whether the memory needs compaction.
 * Checks both turn count and estimated token load.
 *
 * @param {Object} memory — the memory object from memoryStore ({ turns, ... })
 * @param {Object} [options]
 * @param {number} [options.maxTurns]         — override (default: env or 300)
 * @param {number} [options.thresholdRatio]   — fraction of maxTurns (default: 0.80)
 * @param {number} [options.maxTokens]        — absolute token ceiling (default: derived from maxTurns)
 * @returns {{ needed: boolean, reason: string, turnCount: number, estimatedTokens: number, maxTurns: number }}
 */
function autoCompactCheck(memory, options) {
  const opts = options || {};
  const turns = (memory && Array.isArray(memory.turns)) ? memory.turns : [];

  // Read maxTurns dynamically — mirrors memoryStore.js line 9
  const maxTurns = opts.maxTurns
    || Math.max(20, Number(process.env.ASOLARIA_MEMORY_MAX_TURNS || 300));
  const thresholdRatio = opts.thresholdRatio || DEFAULTS.autoCompactThresholdRatio;
  const turnThreshold = Math.floor(maxTurns * thresholdRatio);

  const estimatedTokens = estimateTurnsTokens(turns);
  // Token ceiling: treat each turn slot as ~400 tokens of budget
  const maxTokens = opts.maxTokens || (maxTurns * 400);
  const tokenThreshold = Math.floor(maxTokens * thresholdRatio);

  const turnCount = turns.length;

  if (turnCount >= turnThreshold) {
    return {
      needed: true,
      reason: `Turn count ${turnCount} >= threshold ${turnThreshold} (${Math.round(thresholdRatio * 100)}% of max ${maxTurns})`,
      turnCount,
      estimatedTokens,
      maxTurns,
    };
  }

  if (estimatedTokens >= tokenThreshold) {
    return {
      needed: true,
      reason: `Estimated tokens ${estimatedTokens} >= threshold ${tokenThreshold} (${Math.round(thresholdRatio * 100)}% of max ${maxTokens})`,
      turnCount,
      estimatedTokens,
      maxTurns,
    };
  }

  return {
    needed: false,
    reason: `Within limits: ${turnCount}/${turnThreshold} turns, ~${estimatedTokens}/${tokenThreshold} tokens`,
    turnCount,
    estimatedTokens,
    maxTurns,
  };
}

// ---------------------------------------------------------------------------
// Tier 3 — fullCompact
// ---------------------------------------------------------------------------

/**
 * Extract key signals from a turn for the summary.
 */
function extractTurnSignals(turn) {
  const signals = [];
  const text = (turn.text || "").trim();
  if (!text || text === DEFAULTS.clearedMarker) return signals;

  // Errors — always preserve
  if (/\b(?:error|fail|exception|crash|bug|broke)\b/i.test(text)) {
    signals.push({ type: "error", turn });
  }
  // Decisions / state changes
  if (/\b(?:decision|decided|chose|switched|changed|set|configured|enabled|disabled)\b/i.test(text)) {
    signals.push({ type: "decision", turn });
  }
  // File paths — important context
  if (/(?:\/[\w.-]+){2,}|[A-Z]:\\[\w\\.-]+/i.test(text)) {
    signals.push({ type: "file_reference", turn });
  }
  // Index entries (IX-/LX-)
  if (/\b[IL]X-\d+/i.test(text)) {
    signals.push({ type: "index_entry", turn });
  }
  // User instructions (high priority)
  if (turn.role === "user" && text.length > 10) {
    signals.push({ type: "user_instruction", turn });
  }
  return signals;
}

/**
 * Build a condensed summary string from an array of turns.
 */
function buildSummary(turns) {
  const sections = {
    userRequests: [],
    decisions: [],
    errors: [],
    fileRefs: new Set(),
    indexEntries: new Set(),
    keyActions: [],
  };

  for (const turn of turns) {
    const text = (turn.text || "").trim();
    if (!text || text === DEFAULTS.clearedMarker) continue;

    const signals = extractTurnSignals(turn);
    for (const sig of signals) {
      switch (sig.type) {
        case "user_instruction":
          sections.userRequests.push(truncateForSummary(text, 300));
          break;
        case "decision":
          sections.decisions.push(truncateForSummary(text, 200));
          break;
        case "error":
          sections.errors.push(truncateForSummary(text, 200));
          break;
        case "file_reference": {
          const paths = text.match(/(?:\/[\w.-]+){2,}|[A-Z]:\\[\w\\.-]+/gi);
          if (paths) paths.forEach(p => sections.fileRefs.add(p));
          break;
        }
        case "index_entry": {
          const entries = text.match(/\b[IL]X-\d+\b/gi);
          if (entries) entries.forEach(e => sections.indexEntries.add(e));
          break;
        }
      }
    }

    // Capture assistant key actions (non-trivial responses)
    if (turn.role === "assistant" && text.length > 50 && signals.length === 0) {
      sections.keyActions.push(truncateForSummary(text, 150));
    }
  }

  const parts = [];

  if (sections.userRequests.length > 0) {
    parts.push("## User Requests\n" + sections.userRequests.map(r => "- " + r).join("\n"));
  }
  if (sections.decisions.length > 0) {
    parts.push("## Decisions\n" + sections.decisions.map(d => "- " + d).join("\n"));
  }
  if (sections.errors.length > 0) {
    parts.push("## Errors Encountered\n" + sections.errors.map(e => "- " + e).join("\n"));
  }
  if (sections.fileRefs.size > 0) {
    const refs = [...sections.fileRefs].slice(0, 30);
    parts.push("## Files Referenced\n" + refs.map(f => "- " + f).join("\n"));
  }
  if (sections.indexEntries.size > 0) {
    parts.push("## Index Entries\n" + [...sections.indexEntries].sort().join(", "));
  }
  if (sections.keyActions.length > 0) {
    const capped = sections.keyActions.slice(0, 10);
    parts.push("## Key Actions\n" + capped.map(a => "- " + a).join("\n"));
  }

  return parts.join("\n\n") || "(No significant content to summarize)";
}

/**
 * Truncate a string for inclusion in a summary.
 */
function truncateForSummary(text, maxLen) {
  if (!text) return "";
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLen) return clean;
  return clean.slice(0, maxLen - 3) + "...";
}

/**
 * Full compaction: summarize old turns into a single condensed entry,
 * preserving the most recent turns verbatim.
 *
 * @param {Array} turns — array of turn objects
 * @param {Object} [options]
 * @param {number} [options.keepRecent=8]  — how many recent turns to keep verbatim
 * @param {string} [options.summaryRole]   — role for the summary turn (default: "system")
 * @returns {{ summary: string, compactedTurns: Array, stats: Object }}
 */
function fullCompact(turns, options) {
  if (!Array.isArray(turns) || turns.length === 0) {
    return {
      summary: "",
      compactedTurns: turns || [],
      stats: { originalCount: 0, keptCount: 0, summarizedCount: 0, tokensSaved: 0 },
    };
  }

  const opts = options || {};
  const keepRecent = Math.max(1, opts.keepRecent || DEFAULTS.fullCompactKeepRecent);
  const summaryRole = opts.summaryRole || "system";

  if (turns.length <= keepRecent) {
    // Nothing to compact
    return {
      summary: "",
      compactedTurns: turns.slice(),
      stats: { originalCount: turns.length, keptCount: turns.length, summarizedCount: 0, tokensSaved: 0 },
    };
  }

  const cutoff = turns.length - keepRecent;
  const oldTurns = turns.slice(0, cutoff);
  const recentTurns = turns.slice(cutoff);

  const summary = buildSummary(oldTurns);
  const oldTokens = estimateTurnsTokens(oldTurns);
  const summaryTokens = estimateTokens(summary);

  // Build the compacted turn that replaces the old segment
  const summaryTurn = {
    id: "compact_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
    role: summaryRole,
    text: summary,
    images: [],
    files: [],
    meta: {
      type: "compaction_summary",
      _compacted: "full",
      _compactedAt: new Date().toISOString(),
      _summarizedCount: oldTurns.length,
      _originalTokens: oldTokens,
      _summaryTokens: summaryTokens,
    },
    at: new Date().toISOString(),
  };

  const compactedTurns = [summaryTurn, ...recentTurns];

  return {
    summary,
    compactedTurns,
    stats: {
      originalCount: turns.length,
      keptCount: recentTurns.length,
      summarizedCount: oldTurns.length,
      tokensSaved: Math.max(0, oldTokens - summaryTokens),
    },
  };
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  microCompact,
  autoCompactCheck,
  fullCompact,
  // Internals exposed for testing / integration
  estimateTokens,
  estimateTurnsTokens,
  DEFAULTS,
};
