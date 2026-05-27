/**
 * tieredPermissionCheck.js — 3-tier permission fast-paths for Asolaria
 *
 * Integrates with riskEngine.js (0-10 scoring) to produce instant
 * allow/prompt/block decisions. Maintains its own persistent prefix
 * rules for Tier 2 auto-approval.
 *
 *   Tier 1 (instant):        risk 0-2  → auto-approve, no logging
 *   Tier 2 (rule check):     risk 3-6  → allow if approved prefix matches, else prompt
 *   Tier 3 (owner required): risk 7+   → always requires Jesse's explicit approval
 */

const fs = require("fs");
const path = require("path");
const { evaluateRisk } = require("./riskEngine");
const { resolveDataPath } = require("./runtimePaths");

// ── configurable boundaries ────────────────────────────────────────
const TIER_THRESHOLDS = {
  /** Scores at or below this value are Tier 1 (instant allow). */
  tier1Max: 2,
  /** Scores at or below this value are Tier 2 (rule check).
   *  Anything above is Tier 3 (owner required). */
  tier2Max: 6,
};

// ── persistent prefix rules (Tier 2 auto-approve) ─────────────────

const RULES_FILE = resolveDataPath("tiered-permission-rules.json");
let _rulesCache = null;

function _ensureDir() {
  fs.mkdirSync(path.dirname(RULES_FILE), { recursive: true });
}

function _loadRules() {
  if (_rulesCache) return _rulesCache;
  try {
    if (fs.existsSync(RULES_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(RULES_FILE, "utf8"));
      if (parsed && Array.isArray(parsed.prefixes)) {
        _rulesCache = {
          prefixes: parsed.prefixes
            .map((v) => String(v || "").toLowerCase().trim())
            .filter(Boolean),
        };
        return _rulesCache;
      }
    }
  } catch (_err) {
    // corrupt file — reset
  }
  _rulesCache = { prefixes: [] };
  _saveRules(_rulesCache);
  return _rulesCache;
}

function _saveRules(rules) {
  _ensureDir();
  fs.writeFileSync(RULES_FILE, JSON.stringify(rules, null, 2), "utf8");
  _rulesCache = rules;
}

// ── main entry point ───────────────────────────────────────────────

/**
 * Evaluate an action and return a tiered permission decision.
 *
 * @param {string} action   — action key understood by riskEngine (e.g. "slack_status")
 * @param {object} [context] — optional context forwarded to evaluateRisk
 *   @param {string} [context.message] — free-text description evaluated for risk signals
 * @returns {{ tier: 1|2|3, decision: "allow"|"prompt"|"block", reason: string, riskScore: number }}
 */
function checkPermission(action, context) {
  const riskInput = {
    action: action || "",
    message: (context && context.message) || "",
  };
  const risk = evaluateRisk(riskInput);
  const score = risk.score;

  // ── Tier 1: instant allow ────────────────────────────────────────
  if (score <= TIER_THRESHOLDS.tier1Max) {
    return {
      tier: 1,
      decision: "allow",
      reason: `Tier 1 auto-approve (risk ${score} <= ${TIER_THRESHOLDS.tier1Max})`,
      riskScore: score,
    };
  }

  // ── Tier 3: owner required (check BEFORE tier 2 so high-risk
  //    actions can never be bypassed by a prefix rule) ──────────────
  if (score > TIER_THRESHOLDS.tier2Max) {
    const result = {
      tier: 3,
      decision: "block",
      reason:
        `Tier 3 owner-required (risk ${score} > ${TIER_THRESHOLDS.tier2Max}). ` +
        `Reasons: ${risk.reasons.join("; ") || "action baseline"}`,
      riskScore: score,
    };
    _auditTier3Block(action, result);
    return result;
  }

  // ── Tier 2: rule check ───────────────────────────────────────────
  const actionLower = String(action || "").toLowerCase().trim();
  if (actionLower && _matchesApprovedPrefix(actionLower)) {
    return {
      tier: 2,
      decision: "allow",
      reason: `Tier 2 rule-match: "${actionLower}" matched an approved prefix`,
      riskScore: score,
    };
  }

  return {
    tier: 2,
    decision: "prompt",
    reason:
      `Tier 2 no matching rule (risk ${score}). ` +
      `Reasons: ${risk.reasons.join("; ") || "action baseline"}`,
    riskScore: score,
  };
}

// ── prefix helpers ─────────────────────────────────────────────────

/**
 * Returns true when the action matches any persistent auto-approve prefix.
 */
function _matchesApprovedPrefix(actionLower) {
  const rules = _loadRules();
  for (let i = 0; i < rules.prefixes.length; i++) {
    if (actionLower.startsWith(rules.prefixes[i])) {
      return true;
    }
  }
  return false;
}

/**
 * Add a persistent auto-approve prefix for Tier 2 actions.
 * Normalized (lowercased, trimmed) before storage.
 *
 * @param {string} pattern — prefix to auto-approve (e.g. "slack_", "github_status")
 */
function addAutoApproveRule(pattern) {
  const normalized = String(pattern || "").toLowerCase().trim();
  if (!normalized) {
    throw new Error("addAutoApproveRule: pattern must be a non-empty string");
  }

  const rules = _loadRules();
  if (!rules.prefixes.includes(normalized)) {
    rules.prefixes.push(normalized);
    _saveRules(rules);
  }
}

/**
 * Remove a persistent auto-approve prefix from Tier 2 rules.
 * Normalized (lowercased, trimmed) before lookup.
 *
 * @param {string} pattern — prefix to remove (e.g. "slack_")
 * @returns {{ ok: boolean, removed: string|null }}
 */
function removeAutoApproveRule(pattern) {
  const normalized = String(pattern || "").toLowerCase().trim();
  if (!normalized) {
    return { ok: false, removed: null };
  }

  const rules = _loadRules();
  const idx = rules.prefixes.indexOf(normalized);
  if (idx === -1) {
    return { ok: false, removed: null };
  }

  rules.prefixes.splice(idx, 1);
  _saveRules(rules);
  return { ok: true, removed: normalized };
}

// ── Tier 3 audit logging ──────────────────────────────────────────

const AUDIT_FILE = resolveDataPath("permission-audit.ndjson");

function _auditTier3Block(action, result) {
  try {
    fs.mkdirSync(path.dirname(AUDIT_FILE), { recursive: true });
    const entry = JSON.stringify({
      timestamp: new Date().toISOString(),
      action: action || "",
      riskScore: result.riskScore,
      reason: result.reason,
    });
    fs.appendFileSync(AUDIT_FILE, entry + "\n", "utf8");
  } catch (_err) {
    // audit is best-effort — never break the permission check
  }
}

// ── exports ────────────────────────────────────────────────────────
module.exports = {
  checkPermission,
  TIER_THRESHOLDS,
  addAutoApproveRule,
  removeAutoApproveRule,
};
