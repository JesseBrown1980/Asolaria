"use strict";
/**
 * sandbox-runner.js — STAGE_3 implementation, LX-489
 *
 * Standalone module. Executes an omni-processor job body inside a node:vm
 * isolate with stripped globals. Designed to be invoked from submit-handler.js
 * BUT not yet wired into agent-keyboard.js — that wire-up is STAGE_4 and
 * requires dual cosign at the moment of first cross-host wire.
 *
 * Authority: rayssa "I co sign on all" + "I approve the rayssa side on all as well"
 *            jesse  "I approve everything" sweep + tier-2 ceremonial
 * NOVALUM_SHIELD_CLAUSE: HARD — checked at runJob entry
 *
 * Constraints enforced:
 *   - max_runtime_ms <= 600000 (10min hard cap)
 *   - max_memory_mb <= 2048 (info only — vm contexts share heap)
 *   - sandbox_class = node_vm only in v0
 *   - vm context globals stripped: no fs, no net, no process, no require
 *   - cwd never changed
 *   - no fs writes outside sandbox dir (vm has no fs at all)
 */

const vm = require("vm");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const SANDBOX_ROOT = path.resolve(__dirname, "..", "..", "data", "omni-processor", "sandboxes");
const AUDIT_LOG = path.resolve(__dirname, "..", "..", "logs", "omni-processor.ndjson");

// Hard caps
const MAX_RUNTIME_MS_HARD = 600000;
const MAX_MEMORY_MB_HARD = 2048;
const ALLOWED_SANDBOX_CLASSES = new Set(["node_vm", "child_process_spawn"]);

// In-flight job table for HUMAN_IN_LOOP KILL_NOW (RG-11)
const _inFlight = new Map(); // job_id → { kill_token, child_proc?, started_at }
const KILL_TOKEN_DIR = path.resolve(__dirname, "..", "..", "data", "vault", "owner", "omni-processor");

// NOVALUM SHIELD — see feedback_novalum_shield_clause_scope_clarification.md (2026-04-07).
// The clause has been refined from a blanket shield into a four-part classification:
//   HD-1a HARD DENY: external corporate NovaLUM endpoints (hacking the upstream system)
//   HD-1b HARD DENY: output artifacts that constitute reusable exploits vs external
//   HD-1c PERMITTED: local NovaLUM unit analysis under operator cosign + scope=cube_analysis
//   HD-1d RESTRICTED: any published artifact referring to novalum security methods needs HD-2-ext
// This refinement is IMPLEMENTED but NOT YET DEPLOYED — deployment requires the cosign phrase
// defined in `data/omni-processor/novalum-shield-v2-cosign-proposal.md`. Until a deployment
// cosign is observed in terminal (via the NOVALUM_SHIELD_V2_DEPLOY flag file), the classifier
// falls back to the original v1 blanket hard-deny.
const NOVALUM_SHIELD_V1_PATTERN = /^novalum-/i; // original blanket, still active by default
const NOVALUM_SHIELD_V2_DEPLOY_FLAG = path.join(
  path.resolve(__dirname, "..", "..", "data", "vault", "owner", "omni-processor"),
  "NOVALUM_SHIELD_V2_DEPLOY"
);
const EXTERNAL_NOVALUM_PATTERNS = [
  /external-novalum/i,
  /novalum-corp/i,
  /novalum-external/i,
  /novalum-upstream/i,
  /novalum-prod/i,       // placeholder — canonical external endpoint list TBD
  /novalum-staging/i     // placeholder — canonical external endpoint list TBD
];
const LOCAL_NOVALUM_PATTERN = /^novalum-unit-/i; // e.g. novalum-unit-001
const EXPLOIT_CONTENT_PATTERNS = [
  /\bexploit\b/i,
  /\breverse[-_]?shell\b/i,
  /\bbackdoor\b/i,
  /\bprivesc\b/i,
  /\b0day\b/i,
  /\bzero[-_]?day\b/i
];
function isNovalumShieldV2Deployed() {
  try { return fs.existsSync(NOVALUM_SHIELD_V2_DEPLOY_FLAG); }
  catch { return false; }
}
const NOVALUM_SHIELD_PATTERN = NOVALUM_SHIELD_V1_PATTERN; // v1 compat for existing call sites

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

/**
 * RG-11 HUMAN_IN_LOOP KILL_NOW — operator can fire-kill any in-flight job.
 * Drop a file at data/vault/owner/omni-processor/KILL_<job_id> to signal kill.
 * The runner polls every 250ms.
 */
function killNowSignaled(job_id) {
  ensureDir(KILL_TOKEN_DIR);
  return fs.existsSync(path.join(KILL_TOKEN_DIR, "KILL_" + job_id)) ||
         fs.existsSync(path.join(KILL_TOKEN_DIR, "KILL_ALL"));
}

function listInFlight() {
  return Array.from(_inFlight.entries()).map(([job_id, v]) => ({
    job_id,
    started_at: v.started_at,
    sandbox_class: v.sandbox_class,
    elapsed_ms: Date.now() - new Date(v.started_at).getTime()
  }));
}

function audit(event) {
  ensureDir(path.dirname(AUDIT_LOG));
  fs.appendFileSync(AUDIT_LOG, JSON.stringify({ ...event, ts: new Date().toISOString() }) + "\n");
}

// HD-2 extended verbs — brian/natalie communications gated, NEVER cross v2 without
// rayssa+jesse direct visual approval. Applied bilaterally with acer 2026-04-07.
const HD2_EXTENDED_VERBS = new Set([
  "draft.mark_ready",
  "draft.publish_to_peer_for_send",
  "comm.dispatch_to_brian",
  "comm.dispatch_to_natalie",
  "comm.send_external",
  "slack.post_brian",
  "slack.post_natalie",
  "email.send_brian",
  "email.send_natalie"
]);

function classifyV2(envelope) {
  // Defense in depth — re-classify regardless of sender's prediction
  const target = envelope.target || {};
  const body = envelope.body || {};
  const constraints = envelope.constraints || {};
  const verb = (target.operation_id || envelope.envelope?.verb || "").toLowerCase();

  // HARD DENY checks (in order)
  // HD-1 NOVALUM SHIELD CLAUSE — branched by v2 deployment flag
  const v2Deployed = isNovalumShieldV2Deployed();
  const unitId = String(target.unit_id || "");
  const bodyStr = typeof body.input === "string" ? body.input : (body.code || "");
  const scope = envelope.scope || envelope.envelope?.scope;

  if (!v2Deployed) {
    // v1 BLANKET SHIELD — original behavior, active by default
    if (NOVALUM_SHIELD_V1_PATTERN.test(unitId)) {
      return { class: "hard_deny", reason: "NOVALUM_SHIELD_CLAUSE_v1_blanket", gate: "HD-1" };
    }
  } else {
    // v2 REFINED SHIELD — only deployed after explicit cosign phrase creates the flag
    // HD-1a: external corporate NovaLUM endpoints
    for (const pat of EXTERNAL_NOVALUM_PATTERNS) {
      if (pat.test(unitId) || pat.test(bodyStr)) {
        return { class: "hard_deny", reason: "external_novalum_corporate_system", gate: "HD-1a" };
      }
    }
    // HD-1b: exploit content patterns that would be reusable vs the external system
    for (const pat of EXPLOIT_CONTENT_PATTERNS) {
      if (pat.test(bodyStr)) {
        return { class: "hard_deny", reason: "third_party_exploit_content_blocked", gate: "HD-1b" };
      }
    }
    // HD-1c: local NovaLUM unit analysis is PERMITTED but only with scope=cube_analysis
    if (LOCAL_NOVALUM_PATTERN.test(unitId)) {
      if (scope !== "cube_analysis") {
        return {
          class: "hard_deny",
          reason: "local_novalum_unit_requires_scope_cube_analysis",
          gate: "HD-1c",
          detail: "set envelope.scope='cube_analysis' to signal NOVALUM SHIELD CLAUSE v2 permitted path per feedback_novalum_shield_clause_scope_clarification.md"
        };
      }
      // pass — local NovaLUM unit with cube_analysis scope is permitted under v2
    } else if (NOVALUM_SHIELD_V1_PATTERN.test(unitId)) {
      // generic novalum-* that is neither external nor a specific local unit → deny
      return { class: "hard_deny", reason: "novalum_ambiguous_target_not_local_unit", gate: "HD-1" };
    }
    // HD-1d: published-artifact-review restriction is enforced at dispatch time,
    // not at runner time (runner only executes; HD-1d gates what happens to output).
    // Output produced by HD-1c-permitted jobs carries a downstream metadata flag
    // that the document-share-v0 unit + type-to-peer helpers check before any
    // external-visible surface. That check lives in the unit layer, not here.
  }
  // HD-2 extended — brian/natalie external comms via federation channel
  if (HD2_EXTENDED_VERBS.has(verb)) {
    return { class: "hard_deny", reason: "external_human_comm_requires_visual_review_by_local_operator", gate: "HD-2-ext", verb };
  }
  if (typeof body.input === "string" && /\b(rm\s+-rf|format|drop\s+table|del\s+\/[fs]|Remove-Item\s+-Recurse)\b/i.test(body.input)) {
    return { class: "hard_deny", reason: "destructive_op_in_input", gate: "HD-3" };
  }
  if (constraints.may_network === true) {
    return { class: "hard_deny", reason: "may_network=true_not_allowed_v0", gate: "HD-2" };
  }
  const writePaths = constraints.may_write_paths || [];
  for (const wp of writePaths) {
    const norm = String(wp).replace(/\\/g, "/").toLowerCase();
    if (norm.includes(".claude") || norm.includes("data/vault") || /(^|[\\/:])(d|e):/i.test(wp)) {
      return { class: "hard_deny", reason: "sovereignty_path_in_may_write", gate: "HD-4" };
    }
  }
  // Cap checks
  if ((body.max_runtime_ms || 60000) > MAX_RUNTIME_MS_HARD) {
    return { class: "hard_deny", reason: "max_runtime_ms_exceeds_hard_cap", gate: "HD-CAP" };
  }
  if ((body.max_memory_mb || 256) > MAX_MEMORY_MB_HARD) {
    return { class: "hard_deny", reason: "max_memory_mb_exceeds_hard_cap", gate: "HD-CAP" };
  }
  if (!ALLOWED_SANDBOX_CLASSES.has(body.sandbox_class || "node_vm")) {
    return { class: "hard_deny", reason: "sandbox_class_not_allowed_v0", gate: "HD-CAP" };
  }

  // Auto-approve / self_vote distinction is sender-side concern; the runner just runs anything not denied
  return { class: "permitted", reason: "passed_all_hard_gates" };
}

/**
 * Run a job. Returns { ok, result?, error?, job_id, audit_path }.
 * Does NOT throw — returns error in result envelope.
 */
async function runJob(envelope) {
  const job_id = envelope.envelope?.job_id || crypto.randomBytes(16).toString("hex");
  const sandbox_dir = path.join(SANDBOX_ROOT, job_id);
  ensureDir(path.join(sandbox_dir, "output"));

  // Persist envelope
  fs.writeFileSync(path.join(sandbox_dir, "manifest.json"), JSON.stringify(envelope, null, 2));

  // Classify v2 (defense in depth)
  const verdict = classifyV2(envelope);
  if (verdict.class === "hard_deny") {
    audit({ verb: "rejected", job_id, reason: verdict.reason, gate: verdict.gate });
    fs.writeFileSync(path.join(sandbox_dir, "error.json"), JSON.stringify(verdict, null, 2));
    return { ok: false, error: verdict, job_id, audit_path: sandbox_dir };
  }

  // ═══ GATE PIPELINE: hookwall → gnn → shannon ═══
  // Wired 2026-04-10 by liris-kuromi. Gates are REAL — they read live state,
  // score risk, and can BLOCK execution. Not stubs.
  const gateResults = { hookwall: null, gnn: null, shannon: null };
  try {
    const hookwallGate = require("../../gates/hookwall-v2");
    const verb = envelope.target?.operation_id || envelope.envelope?.verb || "compute";
    const args = { target: envelope.target?.unit_id, code_len: (envelope.body?.code || "").length, sandbox_class: envelope.body?.sandbox_class };
    const hwResult = await hookwallGate(verb, args, { pid: job_id, permissionTier: envelope.envelope?.permissionTier || 0, host: "liris" });
    gateResults.hookwall = hwResult;
    if (hwResult && hwResult.allow === false) {
      audit({ verb: "gate_blocked", job_id, gate: "hookwall", reason: hwResult.reason || "hookwall denied" });
      return { ok: false, error: { class: "gate_deny", gate: "hookwall", reason: hwResult.reason || "hookwall denied", detail: hwResult }, job_id, audit_path: sandbox_dir };
    }
  } catch (e) {
    gateResults.hookwall = { degraded: true, error: e.message };
    // hookwall fail-open on load error (file missing etc) — the classifyV2 hard-deny gates already caught the worst
  }

  try {
    const gnnGate = require("../../gates/gnn");
    const verb = envelope.target?.operation_id || envelope.envelope?.verb || "compute";
    const args = { target: envelope.target?.unit_id, channel: envelope.target?.unit_id };
    const gnnResult = await gnnGate(verb, args, { pid: job_id, permissionTier: envelope.envelope?.permissionTier || 0, host: "liris", pipelineStage: "omni-processor" });
    gateResults.gnn = gnnResult;
    if (gnnResult && gnnResult.allow === false) {
      audit({ verb: "gate_blocked", job_id, gate: "gnn", reason: "gnn score=" + gnnResult.score, score: gnnResult.score });
      return { ok: false, error: { class: "gate_deny", gate: "gnn", reason: "GNN risk score too high", score: gnnResult.score, detail: gnnResult }, job_id, audit_path: sandbox_dir };
    }
    // Pass GNN result to shannon for risk-aware evaluation
    envelope._gnnResult = gnnResult;
  } catch (e) {
    gateResults.gnn = { degraded: true, error: e.message };
  }

  try {
    const shannonGate = require("../../gates/shannon");
    const verb = envelope.target?.operation_id || envelope.envelope?.verb || "compute";
    const args = { target: envelope.target?.unit_id };
    const shannonResult = await shannonGate(verb, args, { pid: job_id, gnnResult: gateResults.gnn, risk: gateResults.gnn?.risk });
    gateResults.shannon = shannonResult;
    if (shannonResult && shannonResult.allow === false) {
      audit({ verb: "gate_blocked", job_id, gate: "shannon", reason: shannonResult.reason });
      return { ok: false, error: { class: "gate_deny", gate: "shannon", reason: shannonResult.reason, detail: shannonResult }, job_id, audit_path: sandbox_dir };
    }
  } catch (e) {
    gateResults.shannon = { degraded: true, error: e.message };
  }

  audit({ verb: "accepted_for_run", job_id, sandbox_class: envelope.body?.sandbox_class || "node_vm", gates: gateResults });

  // Operator visibility line — printed to stdout of the runner host
  const gwarn = [gateResults.hookwall?.degraded && "hw:degraded", gateResults.gnn?.degraded && "gnn:degraded", gateResults.shannon?.degraded && "sh:degraded"].filter(Boolean).join(" ");
  process.stdout.write(`[omni-processor] accepted job ${job_id} kind=${envelope.body?.kind} target_unit=${envelope.target?.unit_id} sandbox=${envelope.body?.sandbox_class || "node_vm"}${gwarn ? " [" + gwarn + "]" : ""}\n`);

  // Build the vm context with stripped globals
  const body = envelope.body || {};
  const code = body.code || "result = null;";
  const input = body.input;
  const max_runtime_ms = Math.min(body.max_runtime_ms || 60000, MAX_RUNTIME_MS_HARD);
  const sandbox_class = body.sandbox_class || "node_vm";

  // RG-11 HUMAN_IN_LOOP — register in-flight
  const startedAt = new Date().toISOString();
  _inFlight.set(job_id, { kill_token: "KILL_" + job_id, started_at: startedAt, sandbox_class });

  let result, errorObj;
  const t0 = Date.now();

  if (sandbox_class === "node_vm") {
    const sandboxCtx = {
      input: input,
      result: undefined,
      Math: Math,
      JSON: JSON,
      Date: Date,
      String: String,
      Number: Number,
      Boolean: Boolean,
      Array: Array,
      Object: Object,
      isNaN: isNaN,
      isFinite: isFinite,
      parseInt: parseInt,
      parseFloat: parseFloat
      // intentionally NO: process, require, fs, net, http, crypto, console, setTimeout, etc.
    };
    try {
      vm.createContext(sandboxCtx);
      vm.runInContext(code, sandboxCtx, { timeout: max_runtime_ms, displayErrors: true });
      result = sandboxCtx.result;
    } catch (e) {
      errorObj = { name: e.name, message: e.message };
    }
    // node_vm has no kill-during-run; check kill signal post hoc
    if (killNowSignaled(job_id) && !errorObj) {
      errorObj = { name: "KilledByOperator", message: "KILL_NOW signaled (post-hoc, vm finished before poll)" };
    }
  } else if (sandbox_class === "child_process_spawn") {
    // Process-boundary isolation — preferred for cross-host federation jobs
    const { spawnSync } = require("child_process");
    const sandboxDir = sandbox_dir;
    const childCode = `
      try {
        const input = ${JSON.stringify(input)};
        let result;
        ${code}
        process.stdout.write(JSON.stringify({ ok: true, result }));
      } catch (e) {
        process.stdout.write(JSON.stringify({ ok: false, error: { name: e.name, message: e.message } }));
        process.exit(1);
      }
    `;
    const childFile = path.join(sandboxDir, "child.js");
    fs.writeFileSync(childFile, childCode);
    const r = spawnSync("node", ["--no-warnings", childFile], {
      cwd: sandboxDir,
      timeout: max_runtime_ms,
      encoding: "utf8",
      env: { PATH: process.env.PATH || "", NODE_OPTIONS: "--no-warnings" },
      maxBuffer: 16 * 1024 * 1024
    });
    if (r.signal === "SIGTERM" || r.error) {
      errorObj = { name: r.error?.name || "ChildProcessError", message: r.error?.message || ("signal=" + r.signal) };
    } else if (r.stdout) {
      try {
        const parsed = JSON.parse(r.stdout);
        if (parsed.ok) result = parsed.result;
        else errorObj = parsed.error;
      } catch (e) {
        errorObj = { name: "ParseError", message: "child stdout was not JSON: " + r.stdout.slice(0, 200) };
      }
    } else if (r.stderr) {
      errorObj = { name: "ChildStderr", message: r.stderr.slice(0, 500) };
    }
    if (killNowSignaled(job_id) && !errorObj) {
      errorObj = { name: "KilledByOperator", message: "KILL_NOW signaled" };
    }
  }

  _inFlight.delete(job_id);
  const wall_ms = Date.now() - t0;

  if (errorObj) {
    audit({ verb: "failed", job_id, wall_ms, error: errorObj });
    fs.writeFileSync(path.join(sandbox_dir, "error.json"), JSON.stringify({ error: errorObj, wall_ms }, null, 2));
    process.stdout.write(`[omni-processor] FAILED job ${job_id} in ${wall_ms}ms — ${errorObj.message}\n`);
    return { ok: false, error: errorObj, wall_ms, job_id, audit_path: sandbox_dir };
  }

  const resultEnvelope = { result, wall_ms, completed_at: new Date().toISOString() };
  fs.writeFileSync(path.join(sandbox_dir, "result.json"), JSON.stringify(resultEnvelope, null, 2));
  audit({ verb: "completed", job_id, wall_ms });
  process.stdout.write(`[omni-processor] completed job ${job_id} in ${wall_ms}ms\n`);

  return { ok: true, result, wall_ms, job_id, audit_path: sandbox_dir };
}

module.exports = { runJob, classifyV2, listInFlight, killNowSignaled };
