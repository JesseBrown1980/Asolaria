"use strict";

const fs = require("fs");
const path = require("path");
const { resolveDataPath } = require("./runtimePaths");

// ---------------------------------------------------------------------------
// History persistence
// ---------------------------------------------------------------------------

function getHistoryPath() {
  return resolveDataPath("operator-tips-history.json");
}

let _history = null; // { tipId: { lastShownSession: number } }

function loadTipHistory() {
  try {
    const raw = fs.readFileSync(getHistoryPath(), "utf8");
    _history = JSON.parse(raw);
  } catch {
    _history = {};
  }
  return _history;
}

function saveTipHistory() {
  const historyPath = getHistoryPath();
  const dir = path.dirname(historyPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(historyPath, JSON.stringify(_history, null, 2), "utf8");
}

function _getHistory() {
  if (_history === null) loadTipHistory();
  return _history;
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const _tips = []; // Array<Tip>

/**
 * Register a tip.
 * @param {{ id: string, content: string, cooldownSessions: number, isRelevant: (ctx: object) => Promise<boolean>|boolean }} tip
 */
function registerTip(tip) {
  if (!tip || !tip.id) throw new Error("Tip must have an id");
  // Prevent duplicates
  const idx = _tips.findIndex((t) => t.id === tip.id);
  if (idx !== -1) {
    _tips[idx] = tip;
  } else {
    _tips.push(tip);
  }
}

// ---------------------------------------------------------------------------
// Cooldown helpers
// ---------------------------------------------------------------------------

function _sessionsSinceLastShown(tipId, currentSession) {
  const history = _getHistory();
  const entry = history[tipId];
  if (!entry || entry.lastShownSession == null) return Infinity;
  return currentSession - entry.lastShownSession;
}

/**
 * Record that a tip was shown during the given session.
 * @param {string} tipId
 * @param {number} [sessionNumber] — defaults to context.sessionNumber or 0
 */
function recordTipShown(tipId, sessionNumber) {
  const history = _getHistory();
  const session = sessionNumber != null ? sessionNumber : 0;
  history[tipId] = { lastShownSession: session };
  saveTipHistory();
}

// ---------------------------------------------------------------------------
// Selection — "longest since shown" strategy
// ---------------------------------------------------------------------------

/**
 * Return the most relevant tip that has cleared its cooldown.
 * Among eligible tips, pick the one with the most sessions since last shown.
 *
 * @param {{ sessionNumber?: number, turnCount?: number, colonyHealthAge?: number|null, bootSource?: string, mqttConnected?: boolean, ixEntriesSinceDream?: number }} context
 * @returns {Promise<{ id: string, content: string }|null>}
 */
async function getNextTip(context) {
  const ctx = context || {};
  const currentSession = ctx.sessionNumber || 0;

  const eligible = [];

  for (const tip of _tips) {
    // Check cooldown
    const gap = _sessionsSinceLastShown(tip.id, currentSession);
    if (gap < tip.cooldownSessions) continue;

    // Check relevance
    let relevant = false;
    try {
      relevant = await tip.isRelevant(ctx);
    } catch {
      // If relevance check fails, skip tip
      continue;
    }
    if (!relevant) continue;

    eligible.push({ tip, gap });
  }

  if (eligible.length === 0) return null;

  // Sort descending by gap (longest since shown first)
  eligible.sort((a, b) => b.gap - a.gap);
  const winner = eligible[0].tip;
  return { id: winner.id, content: winner.content };
}

// ---------------------------------------------------------------------------
// Built-in tips for Asolaria
// ---------------------------------------------------------------------------

const BUILTIN_TIPS = [
  {
    id: "compact-context",
    content: "Run /compact to free context",
    cooldownSessions: 3,
    isRelevant: (ctx) => (ctx.turnCount || 0) > 200,
  },
  {
    id: "liris-stale",
    content: "Liris hasn't been checked in 24h",
    cooldownSessions: 5,
    isRelevant: (ctx) => {
      // colonyHealthAge: milliseconds since last Liris health check, or null
      if (ctx.colonyHealthAge == null) return false;
      return ctx.colonyHealthAge > 24 * 60 * 60 * 1000;
    },
  },
  {
    id: "usb-sovereignty-missing",
    content: "USB sovereignty not mounted",
    cooldownSessions: 1,
    isRelevant: (ctx) => ctx.bootSource === "local",
  },
  {
    id: "mqtt-offline",
    content: "MQTT broker not running",
    cooldownSessions: 1,
    isRelevant: (ctx) => ctx.mqttConnected === false,
  },
  {
    id: "dream-consolidation-due",
    content: "6 new IX entries since last dream consolidation",
    cooldownSessions: 10,
    isRelevant: (ctx) => (ctx.ixEntriesSinceDream || 0) >= 6,
  },
];

// Auto-register built-in tips
for (const tip of BUILTIN_TIPS) {
  registerTip(tip);
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  registerTip,
  getNextTip,
  recordTipShown,
  loadTipHistory,
  saveTipHistory,
  BUILTIN_TIPS,
};
