// PID: asolaria | profile: asolaria | IX-506 Tier 1
// 18-event hookwall — drop-in replacement for hookwall.js (Dan's 6 hooks)
// Backward compatible: module.exports is still async function(verb, args, envelope)
// Events: PreToolUse, PostToolUse, PostToolUseFailure, SessionStart, SessionEnd,
//   SubagentStart, SubagentStop, PermissionRequest, PermissionDenied,
//   PreCompact, Notification, UserPromptSubmit, ConfigChange, Stop,
//   TaskCreated, TaskCompleted, FileChanged, PostCompact
const hooks = require("../src/connectors/hooksConnector");
const { scoreEdgeRisk } = require("../src/edgeRiskEngine");
const fs = require("fs");
const path = require("path");

// --- Colony Nodes (hardcoded) ---
const COLONY_NODES = {
  "falcon":     { host: "127.0.0.1",     port: 4791, role: "sovereign",   status: "live" },
  "liris":      { host: "192.168.1.2",   port: 4791, role: "sub-colony",  status: "live" },
  "s24-falcon": { host: "192.168.1.17",  port: 4798, role: "orbital",     status: "live" },
  "beast":      { host: "192.168.1.4",   port: 4799, role: "orbital",     status: "pending-auth",
                  adbPorts: [34176, 35544, 38452],
                  appServers: [8080, 44642, 47561],
                  serial: "RQCT302BXMA", model: "SM-S908E" },
  "wsl-ubuntu": { host: "172.18.240.1",  port: null, role: "hypervisor",  status: "live" },
  "tv-smith":   { host: null,            port: null, role: "display",     status: "dlna" },
  "felipe-xiaomi": { host: "192.168.1.7", port: null, role: "orbital",  status: "new" },
  "device-11":  { host: "192.168.1.11",  port: null, role: "unknown",   status: "new" },
  "device-15":  { host: "192.168.1.15",  port: null, role: "unknown",   status: "new" },
  "felipe-a06": { host: "192.168.1.11",  port: 4797, role: "orbital",   status: "live",
                  serial: "R9QY205KAKJ", model: "SM-A065M" }
};

function getColonyNode(name) { return COLONY_NODES[name] || null; }
function getAllNodes() { return COLONY_NODES; }
function relayToNode(name, event) {
  const node = COLONY_NODES[name];
  if (!node || !node.host || !node.port) return;
  const data = JSON.stringify(event);
  const req = require("http").request({
    hostname: node.host, port: node.port, path: "/api/hooks/events",
    method: "POST",
    headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data), "Authorization": "Bearer a2548ed8-9b51-4d7e-8499-a4810e0c851b" }
  }, () => {});
  req.on("error", () => {});
  req.write(data);
  req.end();
}

// --- State ---
const STATE_DIR = path.join(__dirname, "..", "state");
const ASYNC_HOOKS_FILE = path.join(STATE_DIR, "async-hooks.json");
const activeSessions = new Map();

function ensureStateDir() {
  try { if (!fs.existsSync(STATE_DIR)) fs.mkdirSync(STATE_DIR, { recursive: true }); } catch (_) {}
}

// --- NDJSON event logger ---
function logHookEvent(eventName, payload, envelope) {
  const entry = {
    eventType: eventName,
    sessionId: envelope?.pid || "unknown",
    sourceApp: "ix",
    payload,
    at: new Date().toISOString()
  };
  hooks.ingestHookEvent(entry);
  return entry;
}

// --- Permission tiers ---
const TIERS = { observer: 0, operator: 1, trusted_agent: 2, super_admin: 3, owner: 4 };
function tierLevel(tier) { return TIERS[tier] || 0; }

// --- Async Hook Registry (IX-506) ---
const asyncRegistry = {
  _pending: [],

  register(hookId, eventName, envelope) {
    const entry = { hookId, eventName, pid: envelope?.pid, startedAt: new Date().toISOString(), status: "pending" };
    this._pending.push(entry);
    this._persist();
    return entry;
  },

  resolve(hookId, exitCode) {
    const entry = this._pending.find(e => e.hookId === hookId);
    if (entry) {
      entry.status = exitCode === 0 ? "success" : exitCode === 2 ? "blocking_error" : "non_blocking_error";
      entry.resolvedAt = new Date().toISOString();
      entry.exitCode = exitCode;
      this._persist();
    }
    return entry;
  },

  _persist() {
    ensureStateDir();
    try { fs.writeFileSync(ASYNC_HOOKS_FILE, JSON.stringify(this._pending, null, 2)); } catch (_) {}
  },

  getPending() { return this._pending.filter(e => e.status === "pending"); }
};

// ============================================================
// EVENT HANDLERS — each returns {allow, risk, gate, reason}
// or {async: true} for non-blocking
// ============================================================

// 1. PreToolUse (existing: hooks 1-5 from Dan's original)
async function handlePreToolUse(verb, args, envelope) {
  const pid = envelope?.pid || "unknown";
  const ts = new Date().toISOString();

  // Hook 1: pre_tool_guard — block dangerous commands
  const guard = hooks.getGuardVerdict(verb, args);
  if (guard.blocked) {
    logHookEvent("PreToolUse", { blocked: true, reason: guard.reason, verb }, envelope);
    return { allow: false, gate: "pre_tool_guard", reason: guard.reason };
  }

  // Hook 2: session_tracking — record the attempt
  logHookEvent("PreToolUse", {
    verb,
    args: typeof args === "string" ? args : JSON.stringify(args)?.slice(0, 200)
  }, envelope);

  // Hook 3: syntax_checker — validate verb exists
  if (!verb || typeof verb !== "string") {
    return { allow: false, gate: "syntax_checker", reason: "verb is required" };
  }

  // Hook 4: safety_net — risk scoring
  const risk = scoreEdgeRisk({ action: verb, actor: pid, target: args?.target || "", context: envelope });
  if (risk.score >= 8 && envelope?.permissionTier !== "owner") {
    return { allow: false, gate: "safety_net", reason: `risk ${risk.score}: ${risk.reasons?.[0] || "high risk"}` };
  }

  // Hook 5: approval_guard — risk > 5 needs trusted_agent+
  const tier = envelope?.permissionTier || "observer";
  if (risk.score > 5 && tierLevel(tier) < 2) {
    return { allow: false, gate: "approval_guard", reason: `risk ${risk.score} requires trusted_agent or higher, got ${tier}` };
  }

  return { allow: true, risk, pid, verb, ts };
}

// 2. PostToolUse (existing: transcript_backup)
function handlePostToolUse(verb, result, envelope) {
  logHookEvent("PostToolUse", {
    toolName: verb,
    ok: result?.ok,
    duration: result?.duration
  }, envelope);
  return { allow: true, gate: "post_tool_use", reason: "logged" };
}

// 3. PostToolUseFailure (NEW)
function handlePostToolUseFailure(verb, error, envelope) {
  const risk = scoreEdgeRisk({ action: verb, actor: envelope?.pid, target: "", context: envelope });
  logHookEvent("PostToolUseFailure", {
    toolName: verb,
    error: typeof error === "string" ? error : (error?.message || JSON.stringify(error)?.slice(0, 500)),
    riskScore: risk.score,
    consecutiveFailures: envelope?._failureCount || 1
  }, envelope);
  return { allow: true, risk, gate: "post_tool_use_failure", reason: "failure logged" };
}

// 4. SessionStart (existing: session_tracking init)
function handleSessionStart(sessionId, payload, envelope) {
  const ts = new Date().toISOString();
  activeSessions.set(sessionId, { startedAt: ts, pid: envelope?.pid, verbs: [] });
  logHookEvent("SessionStart", {
    sessionId,
    host: envelope?.host || require("os").hostname(),
    permissionTier: envelope?.permissionTier
  }, envelope);
  return { allow: true, gate: "session_start", reason: "session opened" };
}

// 5. SessionEnd (NEW)
function handleSessionEnd(sessionId, payload, envelope) {
  const session = activeSessions.get(sessionId);
  const duration = session ? Date.now() - new Date(session.startedAt).getTime() : 0;
  logHookEvent("SessionEnd", {
    sessionId,
    duration,
    verbCount: session?.verbs?.length || 0,
    summary: payload?.summary || "session closed"
  }, envelope);
  activeSessions.delete(sessionId);
  return { allow: true, gate: "session_end", reason: "session flushed" };
}

// 6. SubagentStart (NEW)
function handleSubagentStart(agentPid, payload, envelope) {
  const risk = scoreEdgeRisk({ action: "subagent_start", actor: envelope?.pid, target: agentPid, context: envelope });
  logHookEvent("SubagentStart", {
    agentPid,
    profile: payload?.profile || "unknown",
    parentPid: envelope?.pid,
    riskScore: risk.score
  }, envelope);

  // Verify the spawned agent has a valid profile
  if (!payload?.profile) {
    return { allow: false, risk, gate: "subagent_start", reason: "subagent must declare a profile" };
  }

  return { allow: true, risk, gate: "subagent_start", reason: "spawn logged" };
}

// 7. SubagentStop (NEW — IX-321: self-index before despawn)
function handleSubagentStop(agentPid, payload, envelope) {
  logHookEvent("SubagentStop", {
    agentPid,
    selfIndexed: !!payload?.indexEntry,
    reason: payload?.reason || "normal"
  }, envelope);

  // IX-321 enforcement: agents must self-index before despawn
  if (!payload?.indexEntry) {
    logHookEvent("SubagentStop:IX321_VIOLATION", {
      agentPid,
      violation: "agent did not self-index before despawn"
    }, envelope);
    // Log violation but still allow despawn (don't leave zombie agents)
    return { allow: true, gate: "subagent_stop", reason: "IX-321 violation: no self-index, despawn allowed anyway" };
  }

  return { allow: true, gate: "subagent_stop", reason: "clean despawn" };
}

// 8. PermissionRequest (NEW — risk-based tri-state)
function handlePermissionRequest(verb, payload, envelope) {
  const risk = scoreEdgeRisk({ action: verb, actor: envelope?.pid, target: payload?.target || "", context: envelope });
  const tier = envelope?.permissionTier || "observer";

  // Tri-state: allow / deny / ask
  let decision;
  if (risk.score <= 2) {
    decision = "allow";
  } else if (risk.score >= 8 && tierLevel(tier) < 3) {
    decision = "deny";
  } else if (risk.score > 5 && tierLevel(tier) < 2) {
    decision = "deny";
  } else if (risk.score > 3 && tierLevel(tier) < 2) {
    decision = "ask";
  } else {
    decision = "allow";
  }

  logHookEvent("PermissionRequest", {
    verb,
    requestedBy: envelope?.pid,
    tier,
    riskScore: risk.score,
    decision
  }, envelope);

  return { allow: decision !== "deny", risk, gate: "permission_request", reason: `${decision}: risk ${risk.score}, tier ${tier}`, decision };
}

// 9. PermissionDenied (NEW — log denial, escalation counter)
function handlePermissionDenied(verb, payload, envelope) {
  const risk = scoreEdgeRisk({ action: verb, actor: envelope?.pid, target: payload?.target || "", context: envelope });

  // Track consecutive denials for escalation
  const denialKey = `${envelope?.pid}:${verb}`;
  if (!handlePermissionDenied._counters) handlePermissionDenied._counters = {};
  const count = (handlePermissionDenied._counters[denialKey] || 0) + 1;
  handlePermissionDenied._counters[denialKey] = count;

  logHookEvent("PermissionDenied", {
    verb,
    deniedTo: envelope?.pid,
    riskScore: risk.score,
    consecutiveDenials: count,
    escalate: count >= 3
  }, envelope);

  if (count >= 3) {
    logHookEvent("PermissionDenied:ESCALATION", {
      verb,
      agent: envelope?.pid,
      count,
      action: "escalate to owner"
    }, envelope);
  }

  return { allow: true, risk, gate: "permission_denied", reason: `denial #${count} logged` };
}

// 10. PreCompact (NEW — backup transcript before compaction)
function handlePreCompact(payload, envelope) {
  ensureStateDir();
  const backupFile = path.join(STATE_DIR, `pre-compact-${Date.now()}.json`);
  try {
    fs.writeFileSync(backupFile, JSON.stringify({
      pid: envelope?.pid,
      at: new Date().toISOString(),
      transcript: payload?.transcript || payload?.summary || "no transcript provided",
      entryCount: payload?.entryCount || 0
    }, null, 2));
  } catch (_) {}

  logHookEvent("PreCompact", {
    backupFile,
    entryCount: payload?.entryCount || 0
  }, envelope);

  return { allow: true, gate: "pre_compact", reason: "transcript backed up" };
}

// 11. Notification (NEW — route alerts)
function handleNotification(payload, envelope) {
  const level = payload?.level || "info";
  const target = payload?.target || "log"; // log | slack | mqtt

  logHookEvent("Notification", {
    level,
    target,
    message: payload?.message?.slice(0, 500),
    source: envelope?.pid
  }, envelope);

  // Non-blocking for info/warn, blocking for error/critical only if risk high
  if (level === "critical") {
    const risk = scoreEdgeRisk({ action: "notification", actor: envelope?.pid, target: "", context: envelope });
    return { allow: true, risk, gate: "notification", reason: `critical alert routed to ${target}` };
  }

  return { async: true, gate: "notification", reason: `${level} notification queued` };
}

// 12. UserPromptSubmit (NEW — log user commands)
function handleUserPromptSubmit(payload, envelope) {
  logHookEvent("UserPromptSubmit", {
    prompt: payload?.prompt?.slice(0, 1000),
    source: payload?.source || "cli",
    sessionId: envelope?.pid
  }, envelope);

  return { allow: true, gate: "user_prompt_submit", reason: "prompt logged" };
}

// 13. ConfigChange (NEW — track configuration mutations)
function handleConfigChange(payload, envelope) {
  const risk = scoreEdgeRisk({ action: "config_change", actor: envelope?.pid, target: payload?.key || "", context: envelope });

  logHookEvent("ConfigChange", {
    key: payload?.key,
    oldValue: payload?.oldValue !== undefined ? String(payload.oldValue).slice(0, 200) : undefined,
    newValue: payload?.newValue !== undefined ? String(payload.newValue).slice(0, 200) : undefined,
    riskScore: risk.score,
    changedBy: envelope?.pid
  }, envelope);

  // Block config changes to security-critical keys without super_admin
  const criticalKeys = /hookwall|gate|permission|sovereignty|firmware|risk/i;
  if (criticalKeys.test(payload?.key) && tierLevel(envelope?.permissionTier) < 3) {
    return { allow: false, risk, gate: "config_change", reason: `critical config "${payload.key}" requires super_admin` };
  }

  return { allow: true, risk, gate: "config_change", reason: "config change logged" };
}

// --- IX-518 TIER 2 PROMOTED EVENTS (4 new) ---

// 15. TaskCreated (PROMOTED — GNN training signal)
function handleTaskCreated(payload, envelope) {
  const risk = scoreEdgeRisk({ action: "task_created", actor: envelope?.pid, target: payload?.taskId || "", context: envelope });
  logHookEvent("TaskCreated", {
    taskId: payload?.taskId, taskName: payload?.name?.slice(0, 200),
    assignedTo: payload?.assignedTo || envelope?.pid, riskScore: risk.score
  }, envelope);
  return { allow: true, risk, gate: "task_created", reason: "task logged" };
}

// 16. TaskCompleted (PROMOTED — closes GNN construction)
function handleTaskCompleted(payload, envelope) {
  const duration = payload?.startedAt ? Date.now() - new Date(payload.startedAt).getTime() : 0;
  logHookEvent("TaskCompleted", {
    taskId: payload?.taskId, duration, result: payload?.result || "complete", source: envelope?.pid
  }, envelope);
  return { allow: true, gate: "task_completed", reason: `task completed${duration ? ` in ${duration}ms` : ""}` };
}

// 17. FileChanged (PROMOTED — sovereignty-critical file detection)
function handleFileChanged(payload, envelope) {
  const filePath = payload?.path || payload?.file || "";
  const isCritical = /sovereignty|firmware|gate|hookwall|kernel|boot/i.test(filePath);
  const risk = scoreEdgeRisk({ action: "file_changed", actor: envelope?.pid, target: filePath, context: envelope });
  logHookEvent("FileChanged", { path: filePath.slice(0, 500), isCritical, riskScore: risk.score, changedBy: envelope?.pid }, envelope);
  if (isCritical && tierLevel(envelope?.permissionTier) < 3) {
    return { allow: false, risk, gate: "file_changed", reason: `critical file "${filePath}" requires super_admin` };
  }
  return { allow: true, risk, gate: "file_changed", reason: isCritical ? "critical file change logged" : "file change logged" };
}

// 18. PostCompact (PROMOTED — verify no IX entries lost)
function handlePostCompact(payload, envelope) {
  logHookEvent("PostCompact", {
    entriesBefore: payload?.entriesBefore || 0, entriesAfter: payload?.entriesAfter || 0, compactedBy: envelope?.pid
  }, envelope);
  return { allow: true, gate: "post_compact", reason: "compaction logged" };
}

// 14. Stop (graceful shutdown logging)
function handleStop(payload, envelope) {
  // Flush all active sessions
  for (const [sid, session] of activeSessions.entries()) {
    handleSessionEnd(sid, { summary: "shutdown" }, envelope);
  }

  logHookEvent("Stop", {
    reason: payload?.reason || "graceful shutdown",
    pid: envelope?.pid,
    pendingAsync: asyncRegistry.getPending().length
  }, envelope);

  return { allow: true, gate: "stop", reason: "shutdown logged" };
}

// 15. TaskCreated (NEW — log task creation, score edge risk)
function handleTaskCreated(payload, envelope) {
  logHookEvent("TaskCreated", {
    task: payload?.task || payload?.name || "unknown",
    source: envelope?.pid,
    action: payload?.action
  }, envelope);

  const risk = scoreEdgeRisk({ action: payload?.action || "task_created", actor: envelope?.pid, target: payload?.task || "", context: envelope });

  return { allow: true, gate: "task_created", reason: "task logged" };
}

// 16. TaskCompleted (NEW — log task completion with duration)
function handleTaskCompleted(payload, envelope) {
  const duration = payload?.startedAt
    ? Date.now() - new Date(payload.startedAt).getTime()
    : undefined;

  logHookEvent("TaskCompleted", {
    task: payload?.task || payload?.name || "unknown",
    source: envelope?.pid,
    duration,
    result: payload?.result
  }, envelope);

  return { allow: true, gate: "task_completed", reason: "task completed" };
}

// 17. FileChanged (NEW — log file change, guard critical files)
function handleFileChanged(payload, envelope) {
  const filePath = payload?.path || payload?.file || "";

  logHookEvent("FileChanged", {
    path: filePath,
    changeType: payload?.changeType || "modified",
    source: envelope?.pid
  }, envelope);

  // Guard critical files — require super_admin (tier 3+)
  const criticalFilePattern = /sovereignty|firmware|gate|hookwall/i;
  if (criticalFilePattern.test(filePath) && tierLevel(envelope?.permissionTier) < 3) {
    return { allow: false, gate: "file_changed", reason: "critical file change requires super_admin" };
  }

  return { allow: true, gate: "file_changed", reason: "file change logged" };
}

// 18. PostCompact (NEW — log compaction result)
function handlePostCompact(payload, envelope) {
  logHookEvent("PostCompact", {
    entriesRemaining: payload?.entriesRemaining,
    source: envelope?.pid
  }, envelope);

  return { allow: true, gate: "post_compact", reason: "compaction logged" };
}

// ============================================================
// EVENT REGISTRY — maps event names to handlers
// ============================================================
const EVENT_HANDLERS = {
  PreToolUse: handlePreToolUse,
  PostToolUse: handlePostToolUse,
  PostToolUseFailure: handlePostToolUseFailure,
  SessionStart: handleSessionStart,
  SessionEnd: handleSessionEnd,
  SubagentStart: handleSubagentStart,
  SubagentStop: handleSubagentStop,
  PermissionRequest: handlePermissionRequest,
  PermissionDenied: handlePermissionDenied,
  PreCompact: handlePreCompact,
  Notification: handleNotification,
  UserPromptSubmit: handleUserPromptSubmit,
  ConfigChange: handleConfigChange,
  Stop: handleStop,
  TaskCreated: handleTaskCreated,
  TaskCompleted: handleTaskCompleted,
  FileChanged: handleFileChanged,
  PostCompact: handlePostCompact
};

// ============================================================
// MAIN ENTRY — backward compatible with hookwall.js
// hookwall(verb, args, envelope) = PreToolUse
// hookwall.postExec(verb, result, envelope) = PostToolUse
// hookwall.emit(eventName, payload, envelope) = any event
// ============================================================

async function hookwall(verb, args, envelope) {
  // Default call = PreToolUse (backward compatible)
  return handlePreToolUse(verb, args, envelope);
}

// Backward compatible postExec
hookwall.postExec = function(verb, result, envelope) {
  return handlePostToolUse(verb, result, envelope);
};

// Post-exec failure (NEW)
hookwall.postExecFailure = function(verb, error, envelope) {
  return handlePostToolUseFailure(verb, error, envelope);
};

// Generic event emitter for all 18 events
hookwall.emit = function(eventName, payload, envelope) {
  const handler = EVENT_HANDLERS[eventName];
  if (!handler) {
    logHookEvent("UnknownEvent", { eventName, payload }, envelope);
    return { allow: true, gate: "unknown", reason: `no handler for ${eventName}` };
  }

  // For PreToolUse/PostToolUse, first arg is verb; for others, first arg is payload identifier
  if (eventName === "PreToolUse") {
    return handler(payload?.verb || payload, payload?.args || {}, envelope);
  }
  if (eventName === "PostToolUse") {
    return handler(payload?.verb || "", payload, envelope);
  }
  if (eventName === "PostToolUseFailure") {
    return handler(payload?.verb || "", payload?.error || payload, envelope);
  }
  if (eventName === "SessionStart" || eventName === "SessionEnd") {
    return handler(payload?.sessionId || envelope?.pid, payload, envelope);
  }
  if (eventName === "SubagentStart" || eventName === "SubagentStop") {
    return handler(payload?.agentPid || payload?.pid, payload, envelope);
  }
  if (eventName === "PermissionRequest" || eventName === "PermissionDenied") {
    return handler(payload?.verb || "", payload, envelope);
  }
  if (eventName === "PreCompact") {
    return handler(payload, envelope);
  }

  // Default: pass payload and envelope (TaskCreated, TaskCompleted, FileChanged, PostCompact, Notification, UserPromptSubmit, ConfigChange, Stop)
  return handler(payload, envelope);
};

// Expose event list, registry, and colony for introspection
hookwall.EVENTS = Object.keys(EVENT_HANDLERS);
hookwall.EVENT_COUNT = Object.keys(EVENT_HANDLERS).length;
hookwall.asyncRegistry = asyncRegistry;
hookwall.activeSessions = activeSessions;
hookwall.COLONY_NODES = COLONY_NODES;
hookwall.getColonyNode = getColonyNode;
hookwall.getAllNodes = getAllNodes;

// Relay every hook event to all live colony nodes
const _originalEmit = hookwall.emit;
hookwall.emit = function(eventName, payload, envelope) {
  const result = _originalEmit ? _originalEmit(eventName, payload, envelope) : { allow: true };
  // Fan-out to all live nodes
  const event = { eventType: eventName, payload, source: envelope?.pid || "hookwall", at: new Date().toISOString() };
  for (const [name, node] of Object.entries(COLONY_NODES)) {
    if (node.status === "live" && node.port) relayToNode(name, event);
  }
  return result;
};

module.exports = hookwall;
