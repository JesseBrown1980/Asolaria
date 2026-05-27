/**
 * retryWithClassification.js — Retry/backoff with foreground/background classification
 *
 * Extracted patterns from claude-code withRetry.ts, adapted for Asolaria CommonJS.
 * No external dependencies beyond Node.js builtins.
 *
 * Exports:
 *   retryWithBackoff(fn, options) — async generator yielding status, returns result
 *   classifyQuery(source)        — "foreground" | "background"
 *   RETRY_CONSTANTS              — all thresholds for testing
 *   createCircuitBreaker(max)    — 3-strike halt pattern
 */

"use strict";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RETRY_CONSTANTS = Object.freeze({
  BASE_DELAY_MS: 500,
  DEFAULT_MAX_RETRIES: 10,
  MAX_BACKOFF_MS: 32_000,

  // Persistent / unattended mode
  PERSISTENT_MAX_BACKOFF_MS: 5 * 60 * 1000,   // 5 min
  PERSISTENT_RESET_CAP_MS: 6 * 60 * 60 * 1000, // 6 hr
  HEARTBEAT_INTERVAL_MS: 30_000,                // 30 s

  // 529 overloaded
  MAX_529_CONSECUTIVE: 3,

  // Circuit breaker default
  DEFAULT_CIRCUIT_BREAKER_MAX: 3,
});

// ---------------------------------------------------------------------------
// Foreground / background classification
// ---------------------------------------------------------------------------

/**
 * Sources where the user IS blocking on the result.
 * Background queries (summaries, titles, classifiers) bail immediately
 * on 529 to avoid 3-10x gateway amplification during capacity cascades.
 */
const FOREGROUND_SOURCES = new Set([
  "repl",
  "repl_main",
  "sdk",
  "agent",
  "agent:default",
  "agent:custom",
  "agent:builtin",
  "compact",
  "hook_agent",
  "hook_prompt",
  "verification_agent",
  "side_question",
  "auto_mode",
  "dispatch",         // Asolaria dispatch surface
  "colony_command",   // colony-level user command
]);

/**
 * Classify a query source as foreground (user-blocking) or background.
 * Unknown/undefined sources default to foreground (conservative).
 *
 * @param {string|undefined} source
 * @returns {"foreground"|"background"}
 */
function classifyQuery(source) {
  if (source === undefined || source === null) return "foreground";
  return FOREGROUND_SOURCES.has(source) ? "foreground" : "background";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal && signal.aborted) {
      return reject(new Error("Aborted"));
    }
    const timer = setTimeout(resolve, ms);
    if (signal) {
      const onAbort = () => {
        clearTimeout(timer);
        reject(new Error("Aborted"));
      };
      signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}

/**
 * Compute exponential backoff delay with jitter.
 * If retryAfterSec is provided (from header), use it directly.
 */
function computeDelay(attempt, retryAfterSec, maxDelayMs) {
  if (retryAfterSec != null && !isNaN(retryAfterSec)) {
    return retryAfterSec * 1000;
  }
  const cap = maxDelayMs || RETRY_CONSTANTS.MAX_BACKOFF_MS;
  const base = Math.min(
    RETRY_CONSTANTS.BASE_DELAY_MS * Math.pow(2, attempt - 1),
    cap,
  );
  const jitter = Math.random() * 0.25 * base;
  return base + jitter;
}

/**
 * Extract retry-after seconds from an error.
 * Checks error.headers (object or Headers-like) for 'retry-after'.
 */
function extractRetryAfter(error) {
  if (!error) return null;
  const headers = error.headers;
  if (!headers) return null;
  let raw;
  if (typeof headers.get === "function") {
    raw = headers.get("retry-after");
  } else if (typeof headers === "object") {
    raw = headers["retry-after"];
  }
  if (raw == null) return null;
  const sec = parseInt(raw, 10);
  return isNaN(sec) ? null : sec;
}

/**
 * Classify HTTP status code from an error.
 */
function getStatusCode(error) {
  if (!error) return null;
  return error.status || error.statusCode || null;
}

/**
 * Detect stale connection errors (ECONNRESET / EPIPE).
 */
function isStaleConnection(error) {
  if (!error) return false;
  const code = error.code || (error.cause && error.cause.code);
  return code === "ECONNRESET" || code === "EPIPE";
}

// ---------------------------------------------------------------------------
// Circuit breaker (3-strike halt pattern from autoCompact.ts)
// ---------------------------------------------------------------------------

/**
 * Create a circuit breaker that trips after maxFailures consecutive failures.
 *
 * @param {number} [maxFailures=3]
 * @returns {{ record: (success: boolean) => void, isOpen: () => boolean, reset: () => void, failures: () => number }}
 */
function createCircuitBreaker(maxFailures) {
  const max = maxFailures || RETRY_CONSTANTS.DEFAULT_CIRCUIT_BREAKER_MAX;
  let consecutiveFailures = 0;
  let tripped = false;

  return {
    /**
     * Record an outcome. Pass true for success, false for failure.
     * Success resets the counter. Failure increments; trips if threshold met.
     */
    record(success) {
      if (success) {
        consecutiveFailures = 0;
        tripped = false;
      } else {
        consecutiveFailures++;
        if (consecutiveFailures >= max) {
          tripped = true;
        }
      }
    },
    /** True when the breaker has tripped (halt further attempts). */
    isOpen() {
      return tripped;
    },
    /** Force-reset the breaker. */
    reset() {
      consecutiveFailures = 0;
      tripped = false;
    },
    /** Current consecutive failure count. */
    failures() {
      return consecutiveFailures;
    },
  };
}

// ---------------------------------------------------------------------------
// retryWithBackoff — async generator
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} RetryOptions
 * @property {number}          [maxRetries=10]       Max retry attempts
 * @property {string}          [querySource]         Source for fg/bg classification
 * @property {boolean}         [persistent=false]    Unattended mode (5min max backoff, 6hr cap, heartbeat)
 * @property {AbortSignal}     [signal]              Abort signal
 * @property {string}          [fallbackModel]       Model to suggest on 529 cascade
 * @property {function}        [onTokenRefresh]      Called on 401 to force token refresh
 * @property {function}        [onDisableKeepAlive]  Called on stale connection detection
 * @property {number}          [initial529Count=0]   Pre-seed consecutive 529 counter
 * @property {object}          [circuitBreaker]      Circuit breaker instance from createCircuitBreaker()
 */

/**
 * Retry an async function with exponential backoff.
 * Yields status objects between retries (for heartbeat / UI updates).
 *
 * Status objects: { type, attempt, delayMs, status, message, timestamp }
 *
 * @param {() => Promise<any>} fn          The operation to retry
 * @param {RetryOptions}       [options]   Configuration
 * @returns {AsyncGenerator<Object, any>}  Yields status, returns fn result
 */
async function* retryWithBackoff(fn, options) {
  const opts = options || {};
  const maxRetries = opts.maxRetries != null ? opts.maxRetries : RETRY_CONSTANTS.DEFAULT_MAX_RETRIES;
  const persistent = !!opts.persistent;
  const classification = classifyQuery(opts.querySource);

  let consecutive529 = opts.initial529Count || 0;
  let persistentAttempt = 0;
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    // --- Abort check ---
    if (opts.signal && opts.signal.aborted) {
      throw new Error("Aborted");
    }

    // --- Circuit breaker check ---
    if (opts.circuitBreaker && opts.circuitBreaker.isOpen()) {
      const err = new Error("Circuit breaker is open — too many consecutive failures");
      err.code = "CIRCUIT_OPEN";
      throw err;
    }

    try {
      // --- Stale connection handling ---
      if (isStaleConnection(lastError) && typeof opts.onDisableKeepAlive === "function") {
        opts.onDisableKeepAlive();
      }

      // --- 401 token refresh ---
      if (lastError && getStatusCode(lastError) === 401 && typeof opts.onTokenRefresh === "function") {
        await opts.onTokenRefresh();
      }

      const result = await fn(attempt);
      if (opts.circuitBreaker) opts.circuitBreaker.record(true);
      return result;

    } catch (error) {
      if (opts.circuitBreaker) opts.circuitBreaker.record(false);
      lastError = error;
      const status = getStatusCode(error);

      // --- Background drops 529 immediately (no retry amplification) ---
      if (status === 529 && classification === "background") {
        const dropInfo = {
          type: "dropped",
          reason: "background_529",
          querySource: opts.querySource,
          timestamp: Date.now(),
        };
        yield dropInfo;
        throw error;
      }

      // --- 401: force token refresh, then retry ---
      if (status === 401) {
        if (typeof opts.onTokenRefresh === "function") {
          await opts.onTokenRefresh();
        }
        // Let retry loop continue with no extra delay
        yield {
          type: "retry",
          reason: "token_refresh",
          attempt,
          status: 401,
          timestamp: Date.now(),
        };
        continue;
      }

      // --- 529 consecutive tracking + model fallback ---
      if (status === 529) {
        consecutive529++;
        if (consecutive529 >= RETRY_CONSTANTS.MAX_529_CONSECUTIVE) {
          if (opts.fallbackModel) {
            yield {
              type: "fallback",
              reason: "529_cascade",
              originalModel: opts.model,
              fallbackModel: opts.fallbackModel,
              consecutive529,
              timestamp: Date.now(),
            };
            const err = new Error(
              `Model fallback triggered after ${consecutive529} consecutive 529s`,
            );
            err.fallbackModel = opts.fallbackModel;
            err.code = "FALLBACK_TRIGGERED";
            throw err;
          }
          if (!persistent) {
            const err = new Error(
              `Service overloaded: ${consecutive529} consecutive 529 errors`,
            );
            err.code = "MAX_529_EXCEEDED";
            throw err;
          }
        }
      } else {
        consecutive529 = 0; // reset on non-529
      }

      // --- Stale connection (ECONNRESET/EPIPE) ---
      if (isStaleConnection(error)) {
        if (typeof opts.onDisableKeepAlive === "function") {
          opts.onDisableKeepAlive();
        }
        yield {
          type: "retry",
          reason: "stale_connection",
          code: error.code || (error.cause && error.cause.code),
          attempt,
          timestamp: Date.now(),
        };
        // Retry immediately (fresh connection)
        continue;
      }

      // --- Check if error is retryable ---
      const retryable = status === 429 || status === 529 || status === 500 ||
                         status === 502 || status === 503 || status === 504 ||
                         error.code === "ECONNRESET" || error.code === "EPIPE" ||
                         error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT";

      const isPersistentCapacity = persistent && (status === 429 || status === 529);

      if (attempt > maxRetries && !isPersistentCapacity) {
        throw error;
      }

      if (!retryable && !isPersistentCapacity) {
        throw error;
      }

      // --- Compute delay ---
      const retryAfterSec = extractRetryAfter(error);
      let delayMs;

      if (isPersistentCapacity) {
        persistentAttempt++;
        delayMs = Math.min(
          computeDelay(persistentAttempt, retryAfterSec, RETRY_CONSTANTS.PERSISTENT_MAX_BACKOFF_MS),
          RETRY_CONSTANTS.PERSISTENT_RESET_CAP_MS,
        );
      } else {
        delayMs = computeDelay(attempt, retryAfterSec, RETRY_CONSTANTS.MAX_BACKOFF_MS);
      }

      const reportedAttempt = isPersistentCapacity ? persistentAttempt : attempt;

      // --- Persistent mode: chunked sleep with heartbeat yields ---
      if (isPersistentCapacity) {
        let remaining = delayMs;
        while (remaining > 0) {
          if (opts.signal && opts.signal.aborted) throw new Error("Aborted");

          yield {
            type: "heartbeat",
            attempt: reportedAttempt,
            delayMs: remaining,
            status,
            message: `Waiting ${Math.ceil(remaining / 1000)}s before retry (attempt ${reportedAttempt})`,
            timestamp: Date.now(),
          };

          const chunk = Math.min(remaining, RETRY_CONSTANTS.HEARTBEAT_INTERVAL_MS);
          await sleep(chunk, opts.signal);
          remaining -= chunk;
        }
        // Clamp attempt so the for-loop never terminates in persistent mode
        if (attempt >= maxRetries) attempt = maxRetries;
      } else {
        // --- Normal mode: single yield + sleep ---
        yield {
          type: "retry",
          attempt: reportedAttempt,
          delayMs,
          status,
          message: `Retrying in ${Math.ceil(delayMs / 1000)}s (attempt ${reportedAttempt}/${maxRetries})`,
          timestamp: Date.now(),
        };
        await sleep(delayMs, opts.signal);
      }
    }
  }

  throw lastError || new Error("Retry exhausted");
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  retryWithBackoff,
  classifyQuery,
  RETRY_CONSTANTS,
  createCircuitBreaker,
};
