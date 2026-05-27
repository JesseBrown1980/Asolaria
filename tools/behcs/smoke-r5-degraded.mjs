// smoke-r5-degraded.mjs — exercises retry-with-backoff R5 DEGRADED branch
// using stub fns. NEVER touches the live bus. Speed-shimmed sleep.
import { retryWithBackoff, _internal } from "./retry-with-backoff.mjs";

// Patch global setTimeout for speed: 60s degraded pause -> 60ms simulated.
const realSetTimeout = global.setTimeout;
global.setTimeout = (fn, ms) => realSetTimeout(fn, Math.min(ms, 60));

function stubAlwaysDegraded() {
  return {
    ok: false, status: 503,
    body: { ok: false, service: "acer-bus", state: "DEGRADED",
      since: "2026-04-29T12:00:00Z", supervisor_action_required: true,
      restart_count_in_window: 9 },
  };
}
let recovered = 0;
function stubDegradedThenOK() {
  recovered += 1;
  if (recovered <= 1) return stubAlwaysDegraded();
  return { ok: true, status: 200, body: { id: "ok-x" } };
}
function stubPlain500() {
  return { ok: false, status: 500, body: "internal-error" };
}

console.log("[T1] persistent DEGRADED — expect bus_persistent_degraded after 3");
const t1 = await retryWithBackoff(stubAlwaysDegraded, { label: "smoke-r5-persistent" });
console.log(JSON.stringify({ ok: t1.ok, error: t1.error, attempts: t1.attempts,
  degraded_attempts: t1.degraded_attempts }));
const t1pass = !t1.ok && t1.error === "bus_persistent_degraded" && t1.attempts === 3;
console.log("  pass:", t1pass);

console.log("[T2] DEGRADED then OK — expect ok=true");
const t2 = await retryWithBackoff(stubDegradedThenOK, { label: "smoke-r5-recover" });
console.log(JSON.stringify({ ok: t2.ok, attempts: t2.attempts }));
const t2pass = t2.ok && t2.attempts === 2;
console.log("  pass:", t2pass);

console.log("[T3] plain 500 — expect normal exp-backoff path (5 attempts)");
const t3 = await retryWithBackoff(stubPlain500, { label: "smoke-r5-plain500",
  delays_ms: [1, 1, 1, 1, 1] });
console.log(JSON.stringify({ ok: t3.ok, attempts: t3.attempts,
  status: t3.result?.status }));
const t3pass = !t3.ok && t3.attempts === 5 && t3.result.status === 500
  && t3.error !== "bus_persistent_degraded";
console.log("  pass:", t3pass);

console.log("[T4] isBusDegraded unit — false on 200/no-state/4xx");
const ibd = _internal.isBusDegraded;
const t4pass = ibd({ status: 503, body: { state: "DEGRADED" } }) === true
  && ibd({ status: 503, body: { service: "acer-bus", state: "DEGRADED" } }) === true
  && ibd({ status: 200, body: { state: "DEGRADED" } }) === false
  && ibd({ status: 503, body: "string-body" }) === false
  && ibd({ status: 503 }) === false
  && ibd({ status: 500, body: { state: "DEGRADED" } }) === false;
console.log("  pass:", t4pass);

global.setTimeout = realSetTimeout;
const all = t1pass && t2pass && t3pass && t4pass;
console.log("\nSMOKE-R5:", all ? "ALL_PASS" : "FAIL");
process.exit(all ? 0 : 1);
