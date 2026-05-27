// PID: asolaria | profile: asolaria | IX-484 Phase 0
// Dan's 6 hooks as one fail-closed gate membrane
const hooks = require("../../src/connectors/hooksConnector");
const { scoreEdgeRisk } = require("../../src/edgeRiskEngine");

async function hookwall(verb, args, envelope) {
  const pid = envelope?.pid || "unknown";
  const ts = new Date().toISOString();

  // Hook 1: pre_tool_guard — block dangerous commands
  const guard = hooks.getGuardVerdict(verb, args);
  if (guard.blocked) {
    hooks.ingestHookEvent({ eventType: "PreToolUse", toolName: verb, sessionId: pid, payload: { blocked: true, reason: guard.reason }, at: ts });
    return { allow: false, gate: "pre_tool_guard", reason: guard.reason };
  }

  // Hook 2: session_tracking — record the attempt
  hooks.ingestHookEvent({ eventType: "PreToolUse", toolName: verb, sessionId: pid, sourceApp: "ix", payload: { verb, args: typeof args === "string" ? args : JSON.stringify(args)?.slice(0, 200) }, at: ts });

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
  const tiers = { observer: 0, operator: 1, trusted_agent: 2, super_admin: 3, owner: 4 };
  if (risk.score > 5 && (tiers[tier] || 0) < 2) {
    return { allow: false, gate: "approval_guard", reason: `risk ${risk.score} requires trusted_agent or higher, got ${tier}` };
  }

  // All hooks pass — allow with metadata
  return { allow: true, risk, pid, verb, ts };
}

// Hook 6: transcript_backup — called post-execution by exec.js
hookwall.postExec = (verb, result, envelope) => {
  hooks.ingestHookEvent({ eventType: "PostToolUse", toolName: verb, sessionId: envelope?.pid, payload: { ok: result?.ok, ts: new Date().toISOString() } });
};

// T4 real-time fabric improvement (cosign seq=43): close the 3 deferred Claude
// Code hook events flagged by acer W3 cascade C10. These wire to Asolaria's
// hooks connector so Setup / PreCompact / PermissionRequest events get
// recorded into the same ledger as PreToolUse / PostToolUse.
//
// Registration in .claude/settings.json points each event to a wrapper that
// calls the matching method below.

hookwall.onSetup = (envelope) => {
  // Fires once per session at runtime boot. Records source_commit + started_at
  // so feedback_restart_daemons_after_patch's process-started + source-commit
  // requirement is satisfied for hookwall itself.
  hooks.ingestHookEvent({
    eventType: "Setup",
    sessionId: envelope?.pid ?? envelope?.sessionId ?? "unknown",
    sourceApp: "ix",
    payload: {
      ts: new Date().toISOString(),
      source_commit: process.env.LIRIS_SOURCE_COMMIT ?? "unknown",
      process_started_at: process.env.LIRIS_PROCESS_STARTED_AT ?? new Date().toISOString(),
    },
    at: new Date().toISOString(),
  });
  return { allow: true, gate: "setup", note: "session_setup_recorded" };
};

hookwall.onPreCompact = (envelope) => {
  // Fires before Claude Code compacts conversation history. Use as opportunity
  // to flush pending state + warn that ephemeral references will be lost.
  hooks.ingestHookEvent({
    eventType: "PreCompact",
    sessionId: envelope?.pid ?? envelope?.sessionId ?? "unknown",
    payload: {
      ts: new Date().toISOString(),
      compact_trigger: envelope?.compactTrigger ?? "auto",
    },
    at: new Date().toISOString(),
  });
  return { allow: true, gate: "pre_compact", note: "pre_compact_recorded_no_state_flush_needed" };
};

hookwall.onPermissionRequest = (verb, args, envelope) => {
  // Fires when Claude Code asks for tool permission. Records the request +
  // applies the same risk-tier gate as the regular hookwall flow.
  const pid = envelope?.pid ?? "unknown";
  const ts = new Date().toISOString();
  const risk = scoreEdgeRisk({ action: verb, actor: pid, target: args?.target ?? "", context: envelope });
  hooks.ingestHookEvent({
    eventType: "PermissionRequest",
    toolName: verb,
    sessionId: pid,
    sourceApp: "ix",
    payload: { verb, risk_score: risk.score, risk_reasons: risk.reasons, ts },
    at: ts,
  });
  // Don't auto-deny; just record. Claude Code's own permission UI handles the
  // user-facing approval. We surface the risk in the ledger for the fabric.
  return { allow: true, gate: "permission_request", risk_score: risk.score, ts };
};

module.exports = hookwall;
