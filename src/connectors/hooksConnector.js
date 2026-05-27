const { appendHookEvent, queryHookEvents, getRouteHookStats, getHookEventStats, getSessionSummary } = require("../hookEventStore");
const { backupTranscript, listTranscriptBackups, readTranscriptBackup } = require("../transcriptBackupStore");
const { upsertSession, getSession, listActiveSessions, addPromptToSession, incrementToolUse, endSession } = require("../agentSessionStore");
const {
  buildPluginHookGate,
  evaluatePluginHook
} = require("../behcs/originalHermesAgentContracts");
const childProcess = require("child_process");

// ---------- Guard patterns (ported from disler's pre_tool_use.py) ----------

const DANGEROUS_RM_PATTERNS = [
  /\brm\s+.*-[a-z]*r[a-z]*f/i,
  /\brm\s+.*-[a-z]*f[a-z]*r/i,
  /\brm\s+--recursive\s+--force/i,
  /\brm\s+--force\s+--recursive/i,
  /\brm\s+-r\s+.*-f/i,
  /\brm\s+-f\s+.*-r/i
];

const DANGEROUS_PATHS = [
  /^\/$/,
  /^\/\*$/,
  /^~\/?$/,
  /\$HOME/,
  /\.\.\/?/,
  /^\.\s*$/,
  /^\*$/
];

function isDangerousRmCommand(command) {
  const normalized = String(command || "").replace(/\s+/g, " ").trim().toLowerCase();
  for (const pattern of DANGEROUS_RM_PATTERNS) {
    if (pattern.test(normalized)) return true;
  }
  if (/\brm\s+.*-[a-z]*r/i.test(normalized)) {
    for (const pathPattern of DANGEROUS_PATHS) {
      if (pathPattern.test(normalized)) return true;
    }
  }
  return false;
}

function isEnvFileAccess(toolName, toolInput = {}) {
  if (["Read", "Edit", "MultiEdit", "Write"].includes(toolName)) {
    const filePath = String(toolInput.file_path || "");
    if (/\.env\b/.test(filePath) && !filePath.endsWith(".env.sample")) {
      return true;
    }
  }
  if (toolName === "Bash") {
    const command = String(toolInput.command || "");
    if (/\.env\b(?!\.sample)/i.test(command)) {
      return true;
    }
  }
  return false;
}

function normalizeList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item || "").trim()).filter(Boolean);
  return String(value || "")
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function inferRequestedScopes(toolName, toolInput = {}, context = {}) {
  const scopes = new Set(normalizeList(context.requested_scopes || context.requestedScopes || toolInput.requested_scopes || toolInput.scopes));
  const command = String(toolInput.command || "");
  const filePath = String(toolInput.file_path || toolInput.path || "");
  const combined = `${toolName} ${command} ${filePath} ${JSON.stringify(toolInput || {})}`.toLowerCase();

  if (/secret|token|apikey|api_key|password|credential|\.env\b/.test(combined)) scopes.add("secret");
  if (toolName === "Bash" || /\bshell\b|\bcmd\b|\bpowershell\b|\bbash\b/.test(combined)) scopes.add("shell");
  if (/\bhttps?:\/\//.test(combined) || /\bwebhook\b|\bcallback\b|\bfetch\b|\bnetwork\b/.test(combined)) scopes.add("network");
  if (/shadow|runtime[\\/]+language-flywheel|brown-hilbert|law-?001/i.test(combined)) scopes.add("shadow");

  return Array.from(scopes);
}

function shouldApplyOriginalHermesPluginGate(toolName, toolInput = {}, context = {}) {
  return Boolean(
    context.original_hermes_hook ||
    context.hermes_hook ||
    context.plugin_hook ||
    context.plugin_id ||
    context.pluginId ||
    context.manifest_digest ||
    context.manifestDigest ||
    context.hook_phase ||
    context.phase ||
    toolInput.plugin_id ||
    toolInput.pluginId ||
    toolInput.manifest_digest ||
    toolInput.manifestDigest ||
    toolInput.hook_phase ||
    toolInput.phase
  );
}

function normalizeHookPhase(value, eventType = "") {
  const phase = String(value || eventType || "").trim();
  const normalized = phase.replace(/([a-z])([A-Z])/g, "$1_$2").replace(/[-\s]+/g, "_").toLowerCase();
  const aliases = {
    sessionstart: "on_session_start",
    session_start: "on_session_start",
    pretooluse: "pre_tool_call",
    pre_tool_use: "pre_tool_call",
    pre_tool_call: "pre_tool_call",
    posttooluse: "post_tool_call",
    post_tool_use: "post_tool_call",
    post_tool_call: "post_tool_call",
    posttoolusefailure: "post_tool_call",
    transform_tool_result: "transform_tool_result",
    transform_terminal_output: "transform_terminal_output",
    sessionend: "on_session_finalize",
    session_end: "on_session_finalize",
    stop: "on_session_finalize"
  };
  return aliases[normalized] || normalized || "pre_tool_call";
}

function buildOriginalHermesHookRequest(toolName, toolInput = {}, context = {}) {
  const requestedScopes = inferRequestedScopes(toolName, toolInput, context);
  return {
    pluginId: String(context.plugin_id || context.pluginId || toolInput.plugin_id || toolInput.pluginId || context.source_app || "unregistered_plugin"),
    phase: normalizeHookPhase(context.hook_phase || context.phase || toolInput.hook_phase || toolInput.phase, context.event_type || context.eventType),
    manifestDigest: String(context.manifest_digest || context.manifestDigest || toolInput.manifest_digest || toolInput.manifestDigest || ""),
    toolScope: String(context.tool_scope || context.toolScope || toolName || "unknown_tool"),
    requestedScopes,
    secretAccess: requestedScopes.includes("secret"),
    shell: requestedScopes.includes("shell"),
    explicitShellGate: Boolean(context.explicit_shell_gate || context.explicitShellGate || toolInput.explicit_shell_gate || toolInput.explicitShellGate),
    network: requestedScopes.includes("network"),
    connectorPolicy: Boolean(context.connector_policy || context.connectorPolicy || toolInput.connector_policy || toolInput.connectorPolicy),
    shadowWrite: requestedScopes.includes("shadow"),
    auditTarget: String(context.audit_target || context.auditTarget || "data/hook-events.ndjson"),
    rollbackSurface: String(context.rollback_surface || context.rollbackSurface || toolInput.rollback_surface || toolInput.rollbackSurface || "")
  };
}

function getOriginalHermesPluginHookGateVerdict(toolName, toolInput = {}, context = {}) {
  const gate = buildPluginHookGate({ generatedAt: new Date().toISOString() });
  const request = buildOriginalHermesHookRequest(toolName, toolInput, context);
  const result = evaluatePluginHook({ gate, request });
  return {
    blocked: !result.ok,
    reason: result.ok ? "" : `Original Hermes plugin hook denied: ${result.errors.join(", ")}`,
    originalHermesPluginGate: {
      contractId: result.contractId,
      decision: result.decision,
      errors: result.errors,
      audit: result.audit,
      digest: result.digest
    }
  };
}

function getGuardVerdict(toolName, toolInput = {}, context = {}) {
  if (isEnvFileAccess(toolName, toolInput)) {
    return {
      blocked: true,
      reason: "Access to .env files containing sensitive data is prohibited. Use .env.sample instead."
    };
  }
  if (toolName === "Bash" && isDangerousRmCommand(toolInput.command)) {
    return {
      blocked: true,
      reason: "Dangerous rm command detected and prevented."
    };
  }
  if (shouldApplyOriginalHermesPluginGate(toolName, toolInput, context)) {
    return getOriginalHermesPluginHookGateVerdict(toolName, toolInput, context);
  }
  return { blocked: false };
}

// ---------- Event ingestion with session side-effects ----------

function ingestHookEvent(eventData = {}) {
  const result = appendHookEvent(eventData);
  if (!result.ok) return result;

  const event = result.event;
  const sid = event.sessionId;

  // Session lifecycle side-effects
  if (event.eventType === "SessionStart" && sid) {
    upsertSession({
      sessionId: sid,
      sourceApp: event.sourceApp,
      agentType: event.agentType,
      model: event.modelName
    });
  }

  if (event.eventType === "UserPromptSubmit" && sid && event.payload?.prompt) {
    // Ensure session exists
    upsertSession({ sessionId: sid, sourceApp: event.sourceApp });
    addPromptToSession(sid, event.payload.prompt);
  }

  if ((event.eventType === "PreToolUse" || event.eventType === "PostToolUse") && sid) {
    incrementToolUse(sid);
  }

  if ((event.eventType === "SessionEnd" || event.eventType === "Stop") && sid) {
    endSession(sid, event.reason || event.eventType);
  }

  // Pre-compact: auto-backup transcript
  if (event.eventType === "PreCompact" && event.payload?.transcript_path) {
    backupTranscript(sid, event.payload.transcript_path, event.trigger || "auto");
  }

  return result;
}

// ---------- Dashboard / query ----------

function getHookDashboard() {
  const stats = getHookEventStats();
  const sessions = listActiveSessions();
  const recentEvents = queryHookEvents({ limit: 30 });
  const routeHooks = getRouteHookStats({ limit: 200 });
  const backups = listTranscriptBackups({ limit: 10 });

  return {
    stats,
    activeSessions: sessions,
    recentEvents,
    routeHooks,
    recentBackups: backups
  };
}

function getSessionDetail(sessionId) {
  const session = getSession(sessionId);
  const summary = getSessionSummary(sessionId);
  const backups = listTranscriptBackups({ sessionId });

  return {
    session,
    summary,
    backups
  };
}

// ---------- Context injection (replaces session_start.py) ----------

function injectSessionContext(sessionId, source = "startup") {
  const context = [];
  context.push(`Session started at: ${new Date().toISOString()}`);
  context.push(`Session source: ${source}`);

  // Git info
  try {
    const branchResult = childProcess.execSync("git rev-parse --abbrev-ref HEAD", {
      timeout: 5000, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"]
    }).trim();
    context.push(`Git branch: ${branchResult}`);

    const statusResult = childProcess.execSync("git status --porcelain", {
      timeout: 5000, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"]
    }).trim();
    const changes = statusResult ? statusResult.split("\n").length : 0;
    if (changes > 0) {
      context.push(`Uncommitted changes: ${changes} files`);
    }
  } catch (_err) {
    // Not in a git repo or git not available
  }

  return {
    sessionId,
    source,
    context: context.join("\n")
  };
}

function manifest() {
  return {
    id: "hooks",
    version: "1.0.0",
    description: "Claude Code hooks integration — guards, session tracking, transcript backup, context injection (ported from disler)",
    capabilities: ["pre_tool_guard", "event_ingestion", "session_tracking", "transcript_backup", "context_injection", "dashboard"],
    readScopes: ["hook_events", "sessions", "transcripts"],
    writeScopes: ["hook_events", "sessions", "transcript_backups"],
    approvalRequired: false,
    healthCheck: false,
    retrySemantics: "none",
    timeoutMs: 5000,
    secretRequirements: [],
    sideEffects: ["appends to hook-events.ndjson", "creates transcript backup files", "blocks dangerous tool calls", "denies unregistered Hermes-style plugin hooks"],
    failureModes: ["event_store_write_failed", "transcript_backup_failed", "plugin_hook_gate_denied"],
    emittedEvents: ["hook.event_ingested", "hook.guard_blocked", "hook.session_started", "hook.session_ended"],
    originalHermesPluginGate: {
      contractId: buildPluginHookGate().contractId,
      defaultDecision: "deny_runtime_hook_until_registered_and_gac_approved"
    }
  };
}

module.exports = {
  getGuardVerdict,
  getOriginalHermesPluginHookGateVerdict,
  ingestHookEvent,
  getHookDashboard,
  getSessionDetail,
  injectSessionContext,
  queryHookEvents,
  getRouteHookStats,
  getHookEventStats,
  listActiveSessions,
  backupTranscript,
  listTranscriptBackups,
  readTranscriptBackup,
  manifest
};
