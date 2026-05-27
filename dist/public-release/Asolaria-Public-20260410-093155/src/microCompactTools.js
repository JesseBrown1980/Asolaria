/**
 * microCompactTools.js — Tool-specific micro-compaction for Asolaria memory turns.
 *
 * Detects tool outputs by CONTENT PATTERN (not meta.type, which is never set)
 * and replaces verbose tool output with compact summaries.
 *
 * CommonJS, no dependencies.
 */

"use strict";

// ---------------------------------------------------------------------------
// TOOL_PATTERNS — exported for testing and extension
// ---------------------------------------------------------------------------

const TOOL_PATTERNS = {
  bash: {
    name: "bash",
    // Lines starting with $ (prompt), or containing "exit code", "Exit code",
    // or common shell output markers like "++ " (set -x trace)
    test(text) {
      const lines = text.split("\n");
      let hits = 0;
      for (const line of lines) {
        const trimmed = line.trimStart();
        if (
          trimmed.startsWith("$ ") ||
          trimmed.startsWith("++ ") ||
          /exit\s+code\s+\d+/i.test(trimmed) ||
          /^\s*\d+\s+\w/.test(trimmed) === false && /^\s*[\w/.\-~]+[@:#]/.test(trimmed)
        ) {
          hits++;
        }
      }
      return hits >= 2 || (lines.length >= 3 && hits >= 1);
    },
    weight: 1,
  },

  fileRead: {
    name: "file_read",
    // cat -n format: leading spaces, line number, tab, content
    // e.g. "     1\tconst x = 1;"  or "   42\t  return foo;"
    test(text) {
      const lines = text.split("\n");
      let catNHits = 0;
      const sample = lines.slice(0, Math.min(30, lines.length));
      for (const line of sample) {
        if (/^\s{0,8}\d{1,6}\t/.test(line) || /^\s{0,8}\d{1,6}\u2192/.test(line)) {
          catNHits++;
        }
      }
      return catNHits >= 3;
    },
    weight: 2,
  },

  grep: {
    name: "grep",
    // file:line: pattern — e.g. "src/foo.js:42: const x"
    test(text) {
      const lines = text.split("\n");
      let hits = 0;
      for (const line of lines) {
        if (/^[^\s:]{2,}:\d+:/.test(line)) {
          hits++;
        }
      }
      return hits >= 2;
    },
    weight: 3,
  },

  apiResponse: {
    name: "api_response",
    // JSON blocks: text starts with { or [ (after trim), and is valid-ish JSON
    test(text) {
      const trimmed = text.trim();
      if (
        (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
        (trimmed.startsWith("[") && trimmed.endsWith("]"))
      ) {
        try {
          JSON.parse(trimmed);
          return true;
        } catch (_) {
          // Might be partial JSON — check if first 500 chars look JSON-like
          return /^\s*[\[{]\s*"/.test(trimmed) && trimmed.length > 80;
        }
      }
      return false;
    },
    weight: 4,
  },

  statusCheck: {
    name: "status_check",
    // Health/status JSON: contains "status", "health", "ok", "uptime" keys
    test(text) {
      const trimmed = text.trim();
      if (!trimmed.startsWith("{")) return false;
      const lower = trimmed.toLowerCase();
      const keywords = ["\"status\"", "\"health\"", "\"ok\"", "\"uptime\"", "\"alive\"", "\"ready\""];
      let hits = 0;
      for (const kw of keywords) {
        if (lower.includes(kw)) hits++;
      }
      return hits >= 2;
    },
    weight: 5, // higher priority than generic api_response
  },
};

// ---------------------------------------------------------------------------
// detectToolOutput(text)
// ---------------------------------------------------------------------------

function detectToolOutput(text) {
  if (!text || typeof text !== "string") {
    return { isToolOutput: false, toolType: "unknown", confidence: 0 };
  }

  const trimmed = text.trim();
  if (trimmed.length < 10) {
    return { isToolOutput: false, toolType: "unknown", confidence: 0 };
  }

  // Test all patterns, pick highest weight match
  let bestMatch = null;
  for (const key of Object.keys(TOOL_PATTERNS)) {
    const pattern = TOOL_PATTERNS[key];
    if (pattern.test(trimmed)) {
      if (!bestMatch || pattern.weight > bestMatch.weight) {
        bestMatch = pattern;
      }
    }
  }

  if (!bestMatch) {
    return { isToolOutput: false, toolType: "unknown", confidence: 0 };
  }

  // Confidence heuristic: longer outputs with clear patterns get higher confidence
  const lineCount = trimmed.split("\n").length;
  let confidence = 0.6;
  if (lineCount > 10) confidence = 0.75;
  if (lineCount > 50) confidence = 0.85;
  if (lineCount > 200) confidence = 0.95;

  return { isToolOutput: true, toolType: bestMatch.name, confidence };
}

// ---------------------------------------------------------------------------
// extractKeyFindings(text, toolType) — pull out the useful bits
// ---------------------------------------------------------------------------

function extractKeyFindings(text, toolType) {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  const findings = [];

  if (toolType === "bash") {
    // Grab last non-empty line (often the result), plus any error lines
    for (const line of lines) {
      const t = line.trim();
      if (/error|fail|warn|exception|fatal/i.test(t) && findings.length < 3) {
        findings.push(t.slice(0, 120));
      }
    }
    if (findings.length === 0 && lines.length > 0) {
      const last = lines[lines.length - 1].trim();
      findings.push(last.slice(0, 120));
    }
  } else if (toolType === "file_read") {
    // Note the file shape: first non-number content, and line count
    findings.push(`${lines.length} lines of source`);
  } else if (toolType === "grep") {
    // Count unique files matched
    const files = new Set();
    for (const line of lines) {
      const m = line.match(/^([^\s:]{2,}):\d+:/);
      if (m) files.add(m[1]);
    }
    findings.push(`${lines.length} matches across ${files.size} file(s)`);
  } else if (toolType === "status_check") {
    // Pull status value
    try {
      const obj = JSON.parse(text.trim());
      if (obj.status) findings.push(`status=${obj.status}`);
      if (obj.health) findings.push(`health=${obj.health}`);
      if (obj.ok !== undefined) findings.push(`ok=${obj.ok}`);
    } catch (_) {
      findings.push("status JSON (parse partial)");
    }
  } else if (toolType === "api_response") {
    try {
      const obj = JSON.parse(text.trim());
      const keys = Array.isArray(obj) ? [`array[${obj.length}]`] : Object.keys(obj).slice(0, 5);
      findings.push(`keys: ${keys.join(", ")}`);
    } catch (_) {
      findings.push("JSON payload");
    }
  }

  if (findings.length === 0) {
    findings.push("(no key findings extracted)");
  }

  return findings.join("; ");
}

// ---------------------------------------------------------------------------
// microCompactTurn(turn, options)
// ---------------------------------------------------------------------------

function microCompactTurn(turn, options = {}) {
  if (!turn || typeof turn !== "object") return turn;

  const text = turn.text || "";
  const minLines = Math.max(1, Number(options.minLines) || 5);
  const minChars = Math.max(10, Number(options.minChars) || 200);
  const lineCount = text.split("\n").length;

  // Skip short texts — not worth compacting
  if (lineCount < minLines && text.length < minChars) {
    return turn;
  }

  const detection = detectToolOutput(text);
  if (!detection.isToolOutput) {
    return turn;
  }

  const keyFindings = extractKeyFindings(text, detection.toolType);
  const summary = `[Tool output: ${detection.toolType}, ${lineCount} lines, ${keyFindings}]`;

  return {
    ...turn,
    text: summary,
    meta: {
      ...turn.meta,
      microCompacted: true,
      originalToolType: detection.toolType,
      originalLineCount: lineCount,
      originalCharCount: text.length,
      compactedAt: new Date().toISOString(),
    },
  };
}

// ---------------------------------------------------------------------------
// microCompactBatch(turns, options)
// ---------------------------------------------------------------------------

function microCompactBatch(turns, options = {}) {
  if (!Array.isArray(turns)) return [];

  const retainRecent = Math.max(0, Number(options.retainRecent) || 5);
  const cutoff = Math.max(0, turns.length - retainRecent);
  const result = [];

  for (let i = 0; i < turns.length; i++) {
    if (i < cutoff) {
      result.push(microCompactTurn(turns[i], options));
    } else {
      // Keep recent turns untouched
      result.push(turns[i]);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  TOOL_PATTERNS,
  detectToolOutput,
  microCompactTurn,
  microCompactBatch,
};
