/**
 * Core Configuration — Extracted from server.js (ADR-0001 Seam 1)
 * Central source of truth for ports, paths, env parsing, and provider chains.
 * server.js still reads these; this module is the canonical definition.
 */

const path = require("path");

const ROOT_DIR = path.join(__dirname, "..");
const DATA_DIR = path.join(ROOT_DIR, "data");
const CERTS_DIR = path.join(ROOT_DIR, "certs");
const CONFIG_DIR = path.join(ROOT_DIR, "config");
const TOOLS_DIR = path.join(ROOT_DIR, "tools");
const SRC_DIR = path.join(ROOT_DIR, "src");

// ---------- Network ----------

const PORT = Number(process.env.ASOLARIA_PORT || 4781);
const BIND_HOST = String(process.env.ASOLARIA_BIND_HOST || "").trim();
const HTTPS_PORT = Number(process.env.ASOLARIA_HTTPS_PORT || 5443);
const HTTPS_PFX_PATH = String(process.env.ASOLARIA_HTTPS_PFX_PATH || path.join(CERTS_DIR, "asolaria-local.pfx"));
const HTTPS_PASS_PATH = String(process.env.ASOLARIA_HTTPS_PFX_PASS_PATH || path.join(CERTS_DIR, "asolaria-local.pass"));
const HTTPS_ENABLED = String(process.env.ASOLARIA_HTTPS_ENABLE || "true").toLowerCase() !== "false";

// ---------- Paths ----------

const GATEWAY_CONFIG_PATH = path.join(CONFIG_DIR, "asolaria.gateway.json");
const GATEWAY_ENTRY_PATH = path.join(SRC_DIR, "gateway", "server.js");
const SANDBOX_CONFIG_PATH = path.join(ROOT_DIR, "services", "sandbox-manager", "asolaria.sandbox.json");
const SANDBOX_ENTRY_PATH = path.join(ROOT_DIR, "services", "sandbox-manager", "server.js");
const EXTERNAL_DEFAULT_MODELS_PATH = path.join(DATA_DIR, "settings.external-default-models.json");
const EXTERNAL_OBSERVED_MODELS_PATH = path.join(DATA_DIR, "settings.external-observed-models.json");
const STARTUP_AUTOMATION_HISTORY_PATH = path.join(DATA_DIR, "startup-automation-history.json");

// ---------- Provider Chains ----------

const EXTERNAL_PROVIDER_SETTING_KEYS = Object.freeze(["anthropic", "gemini", "kimi", "cursor", "antigravity"]);

const BRAIN_PROVIDER_SETTING_KEYS = Object.freeze([
  "anthropic", "codex", "gemini-api", "vertex", "openclaw", "gemini-cli", "kimi", "cursor", "antigravity"
]);

const BRAIN_PROVIDER_DEFAULT_CHAIN = Object.freeze([
  "anthropic", "codex", "gemini-api", "vertex", "openclaw", "gemini-cli", "kimi", "cursor", "antigravity"
]);

// ---------- Limits ----------

const CONCURRENCY = Math.max(1, Number(process.env.ASOLARIA_CONCURRENCY || 2));
const GATEWAY_AUTOSTART_MIN_INTERVAL_MS = 5000;
const EXTERNAL_OBSERVED_MODELS_LIMIT = 80;
const EXTERNAL_PROVIDER_LIMIT_COOLDOWN_MS = Math.max(
  60 * 1000,
  Math.min(24 * 60 * 60 * 1000, Number(process.env.ASOLARIA_EXTERNAL_PROVIDER_LIMIT_COOLDOWN_MS || 25 * 60 * 1000))
);

// ---------- Utilities ----------

function readEnvBool(raw, fallback = false) {
  if (raw === undefined || raw === null || raw === "") return fallback;
  const value = String(raw).trim().toLowerCase();
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function parseDelimitedEnvList(raw) {
  return String(raw || "")
    .split(/[,;\s]+/)
    .map(s => s.trim())
    .filter(Boolean);
}

module.exports = {
  ROOT_DIR,
  DATA_DIR,
  CERTS_DIR,
  CONFIG_DIR,
  TOOLS_DIR,
  SRC_DIR,
  PORT,
  BIND_HOST,
  HTTPS_PORT,
  HTTPS_PFX_PATH,
  HTTPS_PASS_PATH,
  HTTPS_ENABLED,
  GATEWAY_CONFIG_PATH,
  GATEWAY_ENTRY_PATH,
  SANDBOX_CONFIG_PATH,
  SANDBOX_ENTRY_PATH,
  EXTERNAL_DEFAULT_MODELS_PATH,
  EXTERNAL_OBSERVED_MODELS_PATH,
  STARTUP_AUTOMATION_HISTORY_PATH,
  EXTERNAL_PROVIDER_SETTING_KEYS,
  BRAIN_PROVIDER_SETTING_KEYS,
  BRAIN_PROVIDER_DEFAULT_CHAIN,
  CONCURRENCY,
  GATEWAY_AUTOSTART_MIN_INTERVAL_MS,
  EXTERNAL_OBSERVED_MODELS_LIMIT,
  EXTERNAL_PROVIDER_LIMIT_COOLDOWN_MS,
  readEnvBool,
  parseDelimitedEnvList
};
