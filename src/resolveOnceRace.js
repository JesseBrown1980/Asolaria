"use strict";

/**
 * resolveOnceRace.js — Resolve-once race pattern for multi-source decisions.
 *
 * Multiple async sources (MQTT, bridge, timer, policy) race to resolve a
 * single decision. First to call claim() wins. Others become no-ops.
 *
 * Adapted from Claude Code's createResolveOnce pattern
 * (src/hooks/toolPermission/PermissionContext.ts).
 *
 * CommonJS, zero dependencies.
 */

/**
 * Creates a resolve-once guard around a decision.
 *
 * @returns {{
 *   resolve: (value: *) => void,
 *   claim: () => boolean,
 *   isClaimed: () => boolean,
 *   onResolved: () => Promise<*>
 * }}
 */
function createResolveOnce() {
  let claimed = false;
  let delivered = false;
  let value = undefined;
  let _resolve = null;

  const promise = new Promise((r) => {
    _resolve = r;
  });

  return {
    /**
     * Resolve with a value. If already delivered, this is a no-op.
     * Calling resolve() also sets claimed = true.
     */
    resolve(val) {
      if (delivered) return;
      delivered = true;
      claimed = true;
      value = val;
      _resolve(val);
    },

    /**
     * Atomically check-and-mark as claimed. Returns true if this caller
     * won the race (nobody else has claimed yet), false otherwise.
     *
     * Use this in async callbacks BEFORE doing work, to close the window
     * between an isClaimed() check and the actual resolve() call.
     *
     * Typical pattern:
     *   if (!guard.claim()) return;  // lost the race
     *   // ... do work ...
     *   guard.resolve(result);
     */
    claim() {
      if (claimed) return false;
      claimed = true;
      return true;
    },

    /**
     * Returns true if claim() or resolve() has been called.
     */
    isClaimed() {
      return claimed;
    },

    /**
     * Returns a promise that resolves with the winning value.
     */
    onResolved() {
      return promise;
    },
  };
}

/**
 * Race a promise against a timeout. If the promise doesn't settle within
 * `ms` milliseconds, resolve with `fallback`.
 *
 * @param {Promise<*>} promise  - The promise to race.
 * @param {number}     ms       - Timeout in milliseconds.
 * @param {*}          fallback - Value returned on timeout.
 * @returns {Promise<*>}
 */
function withTimeout(promise, ms, fallback) {
  let timer;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });

  return Promise.race([promise, timeout]).finally(() => {
    clearTimeout(timer);
  });
}

/**
 * Race multiple async decision sources. First source to call claim() and
 * resolve wins. All others become no-ops.
 *
 * Each source is { name: string, fn: async (guard) => decision }.
 * The fn receives the resolve-once guard and must call guard.claim() before
 * guard.resolve(). If claim() returns false, the source lost and should bail.
 *
 * @param {Array<{ name: string, fn: (guard: ReturnType<createResolveOnce>) => Promise<*> }>} sources
 * @param {number} [timeoutMs=30000] - Maximum time to wait before resolving with __timeout__.
 * @returns {Promise<{ name: string, decision: * }>}
 */
function raceDecision(sources, timeoutMs = 30000) {
  if (!Array.isArray(sources) || sources.length === 0) {
    return Promise.reject(new Error("raceDecision requires at least one source"));
  }

  const guard = createResolveOnce();

  // Wrap each source so it captures the winning name
  let winnerName = null;

  const wrappedGuard = {
    isClaimed: guard.isClaimed,
    onResolved: guard.onResolved,
    claim() {
      return guard.claim();
    },
    resolve(value, sourceName) {
      if (winnerName === null) {
        winnerName = sourceName;
      }
      guard.resolve(value);
    },
  };

  // Launch all sources concurrently
  for (const source of sources) {
    const sourceGuard = {
      isClaimed: guard.isClaimed,
      onResolved: guard.onResolved,
      claim() {
        return wrappedGuard.claim();
      },
      resolve(value) {
        wrappedGuard.resolve(value, source.name);
      },
    };

    // Fire and forget — errors in a source should not crash the race.
    // A source that throws simply loses.
    Promise.resolve()
      .then(() => source.fn(sourceGuard))
      .catch(() => {});
  }

  const result = guard.onResolved().then((decision) => ({
    name: winnerName,
    decision,
  }));

  return withTimeout(result, timeoutMs, { name: "__timeout__", decision: null });
}

module.exports = { createResolveOnce, raceDecision, withTimeout };
