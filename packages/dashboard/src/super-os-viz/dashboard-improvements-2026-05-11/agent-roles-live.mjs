// Live agent roles · dashboard backend module · 2026-05-11
//
// Makes the 7 named agent roles (Hermes, Vanguard-Acer, PI, Space-Deck-Driver,
// Space-Agent, Omnispindle, Omniflywheel) into REAL queryable agents on the
// :4949 dashboard, with CROSS-PIPE typing so they can message each other to
// help run the backend.
//
// Operator directive 2026-05-11 (verbatim): "pipe it into the DASHBOARD as a REAL
// agent Like PI is and Hermes, and then give them cross pipe typing ability to
// eachother so they can ALL help run the Backend using the fabric AMAZING IDEA...
// Possible.. Yes, Very carefully using free models."
//
// FREE-MODEL DISCIPLINE: each role binds to a FREE inference backend by default
// (local Ollama / claude-cli local-spawn / deterministic stub). NO paid-API calls
// are made by these endpoints. Paid escalation requires operator-witness envelope.

import { createHash } from "node:crypto";

// ============================================================================
// Named role canon
// ============================================================================

export const NAMED_ROLES = [
  {
    id: "hermes",
    full_name: "Hermes-4-70b",
    role: "federation coordinator",
    backend_default: "free_local_ollama_nous-hermes-4-70b",
    pid_prefix: "HERMES-PID-",
  },
  {
    id: "vanguard-acer",
    full_name: "Vanguard-Acer",
    role: "acer-claude forward scout (Sentinel/Dasien/Falcon family)",
    backend_default: "free_claude_subagent_proxy",
    pid_prefix: "VANGUARD-ACER-PID-",
    parent_vantage: "acer",
  },
  {
    id: "pi",
    full_name: "PI",
    role: "inference / audit primitive (read-only)",
    backend_default: "free_local_ollama_inference_stub",
    pid_prefix: "PI-PID-",
  },
  {
    id: "space-deck-driver",
    full_name: "Space-Deck-Driver",
    role: "multi-device task orchestrator",
    backend_default: "free_deterministic_dispatcher",
    pid_prefix: "SDD-PID-",
  },
  {
    id: "space-agent",
    full_name: "Space-Agent",
    role: "vantage-aware traveler",
    backend_default: "free_deterministic_traverser",
    pid_prefix: "SA-PID-",
  },
  {
    id: "omnispindle",
    full_name: "Omnispindle",
    role: "supervisor · work-queue · bounded concurrency",
    backend_default: "free_deterministic_supervisor",
    pid_prefix: "OMNI-SPINDLE-PID-",
  },
  {
    id: "omniflywheel",
    full_name: "Omniflywheel",
    role: "prof / verdict aggregator",
    backend_default: "free_deterministic_aggregator",
    pid_prefix: "OMNI-FLYWHEEL-PID-",
  },
];

// Cross-pipe inbox per role (in-memory; ndjson durability lands in v0.2).
const CROSS_PIPE_INBOX = new Map(); // role_id -> Array<{from, ts, text, sha16}>

function ensureInbox(roleId) {
  if (!CROSS_PIPE_INBOX.has(roleId)) CROSS_PIPE_INBOX.set(roleId, []);
  return CROSS_PIPE_INBOX.get(roleId);
}

function sha16(s) {
  return createHash("sha256").update(s).digest("hex").slice(0, 16);
}

// ============================================================================
// /api/agents — list all named roles + their live status
// ============================================================================

export function listAgents() {
  const generated_at = new Date().toISOString();
  const agents = NAMED_ROLES.map((r) => ({
    id: r.id,
    full_name: r.full_name,
    role: r.role,
    backend: r.backend_default,
    pid_prefix: r.pid_prefix,
    inbox_depth: ensureInbox(r.id).length,
    status: "registered",
  }));
  return { ok: true, generated_at, count: agents.length, agents };
}

// ============================================================================
// /api/agents/<role-id>/status — per-role health
// ============================================================================

export function agentStatus(roleId) {
  const r = NAMED_ROLES.find((x) => x.id === roleId);
  if (!r) return { ok: false, error: "unknown_role", role_id: roleId };
  return {
    ok: true,
    generated_at: new Date().toISOString(),
    id: r.id,
    full_name: r.full_name,
    role: r.role,
    backend: r.backend_default,
    inbox_depth: ensureInbox(r.id).length,
    status: "registered_free_model_backend",
  };
}

// ============================================================================
// /api/agents/<role-id>/inbox — read inbox (cross-pipe messages)
// ============================================================================

export function agentInbox(roleId, last = 20) {
  const r = NAMED_ROLES.find((x) => x.id === roleId);
  if (!r) return { ok: false, error: "unknown_role", role_id: roleId };
  const inbox = ensureInbox(r.id);
  return {
    ok: true,
    generated_at: new Date().toISOString(),
    role_id: r.id,
    depth: inbox.length,
    items: inbox.slice(-last),
  };
}

// ============================================================================
// /api/agents/cross-type — POST · sender-role types to receiver-role's inbox
// ============================================================================

export function crossType({ from_role, to_role, text }) {
  if (!from_role || !to_role || typeof text !== "string") {
    return { ok: false, error: "missing_field", required: ["from_role", "to_role", "text"] };
  }
  const fromR = NAMED_ROLES.find((x) => x.id === from_role);
  const toR = NAMED_ROLES.find((x) => x.id === to_role);
  if (!fromR) return { ok: false, error: "unknown_from_role", from_role };
  if (!toR) return { ok: false, error: "unknown_to_role", to_role };
  if (text.length > 4096) return { ok: false, error: "text_too_long", max: 4096 };

  const ts = new Date().toISOString();
  const msg = { from: from_role, ts, text, sha16: sha16(`${from_role}|${to_role}|${ts}|${text}`) };
  ensureInbox(to_role).push(msg);

  // Cap inbox at 256 messages per role to avoid memory growth (BEHCS-256 alignment).
  const inbox = ensureInbox(to_role);
  if (inbox.length > 256) inbox.splice(0, inbox.length - 256);

  return {
    ok: true,
    generated_at: ts,
    delivered: { from_role, to_role, sha16: msg.sha16 },
    receiver_inbox_depth: ensureInbox(to_role).length,
    free_model_discipline: "no_paid_api_call_made_by_this_endpoint",
  };
}

// ============================================================================
// /api/agents/<role-id>/invoke — POST · ask a role to do something
//   v0.1: returns canonical deterministic response per role; real inference in v0.2
// ============================================================================

export function agentInvoke({ role_id, prompt }) {
  const r = NAMED_ROLES.find((x) => x.id === role_id);
  if (!r) return { ok: false, error: "unknown_role", role_id };
  if (typeof prompt !== "string" || prompt.length === 0) {
    return { ok: false, error: "prompt_required" };
  }

  // v0.1 deterministic responses per role. v0.2 binds to free local Ollama.
  let response = "";
  switch (r.id) {
    case "hermes":
      response = `[hermes-coordinator] received prompt sha16=${sha16(prompt)} — would dispatch via federation router in v0.2`;
      break;
    case "vanguard-acer":
      response = `[vanguard-acer] scouting forward · prompt sha16=${sha16(prompt)} · spawn dispatched via free claude sub-agent in v0.2`;
      break;
    case "pi":
      response = `[pi-audit] read-only inference · prompt sha16=${sha16(prompt)} · verdict pending v0.2 free-model binding`;
      break;
    case "space-deck-driver":
      response = `[space-deck-driver] orchestrating multi-device · prompt sha16=${sha16(prompt)} · cross-vantage dispatch in v0.2`;
      break;
    case "space-agent":
      response = `[space-agent] traversing vantages · prompt sha16=${sha16(prompt)} · 4-vantage hop in v0.2`;
      break;
    case "omnispindle":
      response = `[omnispindle-supervisor] queueing work · prompt sha16=${sha16(prompt)} · bounded-concurrency dispatch in v0.2`;
      break;
    case "omniflywheel":
      response = `[omniflywheel-prof] aggregating verdict · prompt sha16=${sha16(prompt)} · CONVERGE pattern in v0.2`;
      break;
    default:
      response = `[${r.id}] v0.1 stub`;
  }

  return {
    ok: true,
    generated_at: new Date().toISOString(),
    role_id: r.id,
    backend: r.backend_default,
    prompt_sha16: sha16(prompt),
    response,
    free_model_discipline: "no_paid_api_call_made_by_v0.1_stub",
    real_inference_lands_in: "v0.2 (Phase-4 GNN module + Phase-6 agent_runtime wiring)",
  };
}

// ============================================================================
// /api/agents/cross-pipe/dump — debug · dump all inboxes
// ============================================================================

export function crossPipeDump() {
  const dump = {};
  for (const r of NAMED_ROLES) {
    dump[r.id] = {
      depth: ensureInbox(r.id).length,
      latest: ensureInbox(r.id).slice(-3),
    };
  }
  return { ok: true, generated_at: new Date().toISOString(), inboxes: dump };
}

// ============================================================================
// Anti-bloat: this file IS the agent roles registry until v0.2. No DB until then.
// ============================================================================
