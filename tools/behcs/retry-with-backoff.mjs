// retry-with-backoff.mjs — exponential-backoff helper for bus-post tools.
// WO L9 (id=e039054202099c75). Honors fetch-timeout-floor (5s/15s) by deferring
// per-attempt timeouts to caller's `fn`. Append-only NDJSON log.
// Spec note: feedback_exponential_backoff_retry.md NOT FOUND — designed to
// brief defaults (max_attempts=5, delays [1s,2s,4s,8s,16s]).
// R5 (WO-BUS-SUPERVISOR-HARDENING-SPEC 2026-04-29): 503+state=DEGRADED branch
// — pause 60s, cap 3 DEGRADED retries, log degraded_pause:true.

import fs from "node:fs";
import path from "node:path";

const LOG_PATH = "C:/Users/rayss/Asolaria/logs/dispatch-retry.ndjson";
const DEFAULT_DELAYS = [1000, 2000, 4000, 8000, 16000];
const DEGRADED_PAUSE_MS = 60000;
const DEGRADED_MAX_ATTEMPTS = 3;

function defaultIsRetryable(r) {
  if (!r || r.ok) return false;
  if (r.error === "timeout") return true;
  if (typeof r.error === "string" && r.error.includes("ECONNREFUSED")) return true;
  if (typeof r.error === "string" && r.error.includes("ECONNRESET")) return true;
  if (typeof r.error === "string" && r.error.includes("EHOSTUNREACH")) return true;
  if (typeof r.error === "string" && r.error.includes("ENETUNREACH")) return true;
  if (typeof r.error === "string" && r.error.includes("ETIMEDOUT")) return true;
  if (typeof r.status === "number" && r.status === 429) return true;
  if (typeof r.status === "number" && r.status >= 500 && r.status < 600) return true;
  return false; // 4xx (non-429) and other non-retryable.
}

// R5: classify 503-DEGRADED responses from acer-bus supervisor.
function isBusDegraded(r) {
  if (!r || r.status !== 503) return false;
  const b = r.body;
  if (!b || typeof b !== "object") return false;
  if (b.state === "DEGRADED") return true;
  if (b.service === "acer-bus" && b.state === "DEGRADED") return true;
  return false;
}

function appendLog(row) {
  try {
    fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
    fs.appendFileSync(LOG_PATH, JSON.stringify(row) + "\n");
  } catch (e) {
    // Last-resort stderr; never throw out of logger.
    console.error(`[retry-log] append failed: ${e.message}`);
  }
}

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

export async function retryWithBackoff(fn, options = {}) {
  const max_attempts = options.max_attempts ?? 5;
  const delays_ms = options.delays_ms ?? DEFAULT_DELAYS;
  const is_retryable = options.is_retryable ?? defaultIsRetryable;
  const on_attempt = options.on_attempt;
  const label = options.label ?? "unlabeled";

  const t0 = Date.now();
  let attempt = 0;
  let degraded_attempts = 0;
  let lastResult = { ok: false, error: "no-attempts" };
  let delay_before_ms = 0;
  let next_is_degraded_pause = false;

  while (attempt < max_attempts) {
    attempt += 1;
    if (delay_before_ms > 0) await sleep(delay_before_ms);

    const attemptStart = Date.now();
    try {
      lastResult = await fn();
      if (!lastResult || typeof lastResult !== "object") {
        lastResult = { ok: false, error: "non-object-result" };
      }
    } catch (e) {
      lastResult = { ok: false, error: e?.message ?? String(e) };
    }
    const total_ms_so_far = Date.now() - t0;
    const degraded = isBusDegraded(lastResult);

    const logRow = {
      ts: new Date().toISOString(),
      label,
      attempt,
      max_attempts,
      delay_before_ms,
      attempt_ms: Date.now() - attemptStart,
      ok: !!lastResult.ok,
      status: lastResult.status ?? null,
      error: lastResult.error ?? null,
      total_ms_so_far,
      degraded_pause: next_is_degraded_pause || degraded,
    };
    if (degraded && lastResult.body && typeof lastResult.body === "object") {
      if (lastResult.body.since !== undefined) logRow.degraded_since = lastResult.body.since;
      if (lastResult.body.supervisor_action_required !== undefined) {
        logRow.supervisor_action_required = lastResult.body.supervisor_action_required;
      }
    }
    appendLog(logRow);
    next_is_degraded_pause = false;
    if (typeof on_attempt === "function") {
      try { on_attempt(attempt, lastResult); } catch (_) { /* ignore */ }
    }

    if (lastResult.ok) {
      return { ok: true, result: lastResult, attempts: attempt, total_ms: total_ms_so_far };
    }
    if (degraded) {
      degraded_attempts += 1;
      if (degraded_attempts >= DEGRADED_MAX_ATTEMPTS) {
        return { ok: false, error: "bus_persistent_degraded", result: lastResult,
          attempts: attempt, degraded_attempts, total_ms: total_ms_so_far };
      }
      delay_before_ms = DEGRADED_PAUSE_MS;
      next_is_degraded_pause = true;
      continue;
    }
    if (!is_retryable(lastResult)) {
      return { ok: false, result: lastResult, attempts: attempt, total_ms: total_ms_so_far };
    }
    if (attempt >= max_attempts) {
      return { ok: false, result: lastResult, attempts: attempt, total_ms: total_ms_so_far };
    }
    delay_before_ms = delays_ms[Math.min(attempt - 1, delays_ms.length - 1)];
  }

  const total_ms = Date.now() - t0;
  return { ok: false, result: lastResult, attempts: attempt, total_ms };
}

export const _internal = { LOG_PATH, DEFAULT_DELAYS, DEGRADED_PAUSE_MS,
  DEGRADED_MAX_ATTEMPTS, defaultIsRetryable, isBusDegraded };
