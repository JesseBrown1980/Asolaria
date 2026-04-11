"use strict";

const fs = require("fs");
const path = require("path");
const { resolveDataPath } = require("./runtimePaths");

// ---------------------------------------------------------------------------
// Cost rates: USD per 1 million tokens
// Structure: { input, output, cacheWrite, cacheRead }
// ---------------------------------------------------------------------------

const COST_PER_TOKEN = {
  // Anthropic models
  "claude-opus-4":        { input: 15,   output: 75,   cacheWrite: 18.75, cacheRead: 1.5  },
  "claude-opus-4.5":      { input: 5,    output: 25,   cacheWrite: 6.25,  cacheRead: 0.5  },
  "claude-opus-4.6":      { input: 15,   output: 75,   cacheWrite: 18.75, cacheRead: 1.5  },
  "claude-sonnet-4":      { input: 3,    output: 15,   cacheWrite: 3.75,  cacheRead: 0.3  },
  "claude-sonnet-4.5":    { input: 3,    output: 15,   cacheWrite: 3.75,  cacheRead: 0.3  },
  "claude-sonnet-4.6":    { input: 3,    output: 15,   cacheWrite: 3.75,  cacheRead: 0.3  },
  "claude-haiku-3.5":     { input: 0.8,  output: 4,    cacheWrite: 1,     cacheRead: 0.08 },
  "claude-haiku-4.5":     { input: 1,    output: 5,    cacheWrite: 1.25,  cacheRead: 0.1  },

  // Google — Gemini
  "gemini-2.0-flash":     { input: 0.1,  output: 0.4,  cacheWrite: 0.025, cacheRead: 0.025 },
  "gemini-2.0-pro":       { input: 1.25, output: 5,    cacheWrite: 0.315, cacheRead: 0.315 },
  "gemini-1.5-pro":       { input: 1.25, output: 5,    cacheWrite: 0.315, cacheRead: 0.315 },
  "gemini-1.5-flash":     { input: 0.075,output: 0.3,  cacheWrite: 0.019, cacheRead: 0.019 },

  // Google — Vertex (same models, same pricing, separate provider ID)
  "vertex-gemini-pro":    { input: 1.25, output: 5,    cacheWrite: 0.315, cacheRead: 0.315 },
  "vertex-gemini-flash":  { input: 0.1,  output: 0.4,  cacheWrite: 0.025, cacheRead: 0.025 },

  // OpenAI / Codex
  "gpt-4o":               { input: 2.5,  output: 10,   cacheWrite: 2.5,   cacheRead: 1.25 },
  "gpt-4o-mini":          { input: 0.15, output: 0.6,  cacheWrite: 0.15,  cacheRead: 0.075},
  "gpt-4.1":              { input: 2,    output: 8,    cacheWrite: 2,     cacheRead: 0.5  },
  "gpt-4.1-mini":         { input: 0.4,  output: 1.6,  cacheWrite: 0.4,   cacheRead: 0.1  },
  "gpt-4.1-nano":         { input: 0.1,  output: 0.4,  cacheWrite: 0.1,   cacheRead: 0.025},
  "codex-mini":           { input: 1.5,  output: 6,    cacheWrite: 1.5,   cacheRead: 0.375},
  "o3":                   { input: 2,    output: 8,    cacheWrite: 2,     cacheRead: 0.5  },
  "o3-mini":              { input: 1.1,  output: 4.4,  cacheWrite: 1.1,   cacheRead: 0.275},
  "o4-mini":              { input: 1.1,  output: 4.4,  cacheWrite: 1.1,   cacheRead: 0.275},

  // Abacus AI (local LLM router — rates are approximate / self-hosted)
  "abacus-local":         { input: 0,    output: 0,    cacheWrite: 0,     cacheRead: 0    },

  // Fallback for unknown models
  "_default":             { input: 3,    output: 15,   cacheWrite: 3.75,  cacheRead: 0.3  }
};

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const PERSIST_PATH = resolveDataPath("cost-tracker-state.json");

// { [model]: { inputTokens, outputTokens, cacheWriteTokens, cacheReadTokens, costUSD, durationMs, callCount } }
let modelUsage = {};

// { [colonyId]: { costUSD, callCount, lastModel, lastTimestamp } }
let colonyUsage = {};

let sessionStartedAt = new Date().toISOString();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRates(model) {
  const key = String(model || "").trim().toLowerCase();
  return COST_PER_TOKEN[key] || COST_PER_TOKEN._default;
}

function computeCostUSD(model, usage) {
  const rates = getRates(model);
  const inp   = Number(usage.inputTokens   || 0);
  const out   = Number(usage.outputTokens  || 0);
  const cw    = Number(usage.cacheWriteTokens  || usage.cacheCreationInputTokens || 0);
  const cr    = Number(usage.cacheReadTokens   || usage.cacheReadInputTokens     || 0);

  return (
    (inp * rates.input / 1_000_000) +
    (out * rates.output / 1_000_000) +
    (cw  * rates.cacheWrite / 1_000_000) +
    (cr  * rates.cacheRead / 1_000_000)
  );
}

function ensureModel(model) {
  const key = String(model || "_unknown").trim().toLowerCase();
  if (!modelUsage[key]) {
    modelUsage[key] = {
      inputTokens: 0,
      outputTokens: 0,
      cacheWriteTokens: 0,
      cacheReadTokens: 0,
      costUSD: 0,
      durationMs: 0,
      callCount: 0
    };
  }
  return key;
}

function ensureColony(colonyId) {
  const key = String(colonyId || "unattributed").trim().toLowerCase();
  if (!colonyUsage[key]) {
    colonyUsage[key] = { costUSD: 0, callCount: 0, lastModel: null, lastTimestamp: null };
  }
  return key;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Record a single LLM call's token usage.
 *
 * @param {string}  model   - model identifier (e.g. "claude-sonnet-4.6", "gpt-4o")
 * @param {object}  usage   - { inputTokens, outputTokens, cacheWriteTokens?, cacheReadTokens?, durationMs? }
 * @param {string} [colonyId] - optional colony that made the call (gaia, liris, etc.)
 * @returns {{ costUSD: number }} the cost of this individual call
 */
function recordUsage(model, usage, colonyId) {
  const key = ensureModel(model);
  const entry = modelUsage[key];

  const inp = Number(usage.inputTokens  || 0);
  const out = Number(usage.outputTokens || 0);
  const cw  = Number(usage.cacheWriteTokens  || usage.cacheCreationInputTokens || 0);
  const cr  = Number(usage.cacheReadTokens   || usage.cacheReadInputTokens     || 0);
  const dur = Number(usage.durationMs   || 0);

  entry.inputTokens      += inp;
  entry.outputTokens     += out;
  entry.cacheWriteTokens += cw;
  entry.cacheReadTokens  += cr;
  entry.durationMs       += dur;
  entry.callCount        += 1;

  const callCost = computeCostUSD(model, { inputTokens: inp, outputTokens: out, cacheWriteTokens: cw, cacheReadTokens: cr });
  entry.costUSD += callCost;

  // Colony attribution
  if (colonyId) {
    const cKey = ensureColony(colonyId);
    colonyUsage[cKey].costUSD += callCost;
    colonyUsage[cKey].callCount += 1;
    colonyUsage[cKey].lastModel = key;
    colonyUsage[cKey].lastTimestamp = new Date().toISOString();
  }

  return { costUSD: callCost };
}

/**
 * Returns accumulated usage for a specific model.
 *
 * @param {string} model
 * @returns {object|null} usage object or null if model has no recorded usage
 */
function getUsageForModel(model) {
  const key = String(model || "").trim();
  return modelUsage[key] ? { ...modelUsage[key] } : null;
}

/**
 * Returns total session cost in USD across all models.
 *
 * @returns {number}
 */
function getSessionCost() {
  let total = 0;
  for (const key of Object.keys(modelUsage)) {
    total += modelUsage[key].costUSD;
  }
  return Math.round(total * 1_000_000) / 1_000_000; // avoid float drift
}

/**
 * Returns cost breakdown for a specific colony.
 *
 * @param {string} colonyId - e.g. "gaia", "liris", "asolaria"
 * @returns {object|null}
 */
function getColonyCost(colonyId) {
  const key = String(colonyId || "").trim().toLowerCase();
  return colonyUsage[key] ? { ...colonyUsage[key] } : null;
}

/**
 * Returns the full state: all models, all colonies, session totals.
 *
 * @returns {object}
 */
function getFullReport() {
  return {
    sessionStartedAt,
    sessionCostUSD: getSessionCost(),
    modelUsage: JSON.parse(JSON.stringify(modelUsage)),
    colonyUsage: JSON.parse(JSON.stringify(colonyUsage))
  };
}

/**
 * Persist current cost state to disk for session continuity.
 */
function saveCostState() {
  const dir = path.dirname(PERSIST_PATH);
  fs.mkdirSync(dir, { recursive: true });

  const payload = {
    savedAt: new Date().toISOString(),
    sessionStartedAt,
    modelUsage,
    colonyUsage
  };
  fs.writeFileSync(PERSIST_PATH, JSON.stringify(payload, null, 2), "utf8");
}

/**
 * Load previously saved cost state from disk.
 * Merges into current state (additive) so partial sessions accumulate.
 *
 * @returns {boolean} true if state was loaded, false if no file found
 */
function loadCostState() {
  if (!fs.existsSync(PERSIST_PATH)) {
    return false;
  }

  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(PERSIST_PATH, "utf8"));
  } catch {
    return false;
  }

  if (raw.sessionStartedAt) {
    sessionStartedAt = raw.sessionStartedAt;
  }

  // Merge model usage
  if (raw.modelUsage && typeof raw.modelUsage === "object") {
    for (const [key, stored] of Object.entries(raw.modelUsage)) {
      ensureModel(key);
      modelUsage[key].inputTokens      += Number(stored.inputTokens      || 0);
      modelUsage[key].outputTokens     += Number(stored.outputTokens     || 0);
      modelUsage[key].cacheWriteTokens += Number(stored.cacheWriteTokens || 0);
      modelUsage[key].cacheReadTokens  += Number(stored.cacheReadTokens  || 0);
      modelUsage[key].costUSD          += Number(stored.costUSD          || 0);
      modelUsage[key].durationMs       += Number(stored.durationMs       || 0);
      modelUsage[key].callCount        += Number(stored.callCount        || 0);
    }
  }

  // Merge colony usage
  if (raw.colonyUsage && typeof raw.colonyUsage === "object") {
    for (const [key, stored] of Object.entries(raw.colonyUsage)) {
      ensureColony(key);
      colonyUsage[key].costUSD    += Number(stored.costUSD    || 0);
      colonyUsage[key].callCount  += Number(stored.callCount  || 0);
      colonyUsage[key].lastModel     = stored.lastModel     || colonyUsage[key].lastModel;
      colonyUsage[key].lastTimestamp = stored.lastTimestamp  || colonyUsage[key].lastTimestamp;
    }
  }

  return true;
}

/**
 * Reset all in-memory state. Does NOT delete the persisted file.
 */
function resetCostState() {
  modelUsage = {};
  colonyUsage = {};
  sessionStartedAt = new Date().toISOString();
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  COST_PER_TOKEN,
  recordUsage,
  getUsageForModel,
  getSessionCost,
  getColonyCost,
  getFullReport,
  saveCostState,
  loadCostState,
  resetCostState,
  // Internals exposed for testing
  _computeCostUSD: computeCostUSD,
  _getRates: getRates,
  _PERSIST_PATH: PERSIST_PATH
};
