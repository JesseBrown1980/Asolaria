/**
 * Self Watchdog — Phase 1 Process Supervision
 *
 * Periodic self-health check that logs warnings when the server
 * is degraded. Does NOT restart — that's the external supervisor's job.
 * Emits graph events for observability.
 */

const { appendGraphEvent } = require("../src/graphRuntimeStore");

let _interval = null;
let _checkCount = 0;
let _lastHealthy = Date.now();

function start(options = {}) {
  const intervalMs = Math.max(30000, Number(options.intervalMs || 60000));
  const healthUrl = options.healthUrl || "http://127.0.0.1:4781/api/health/fast";

  if (_interval) return { started: false, reason: "already_running" };

  _interval = setInterval(async () => {
    _checkCount++;
    try {
      const http = require("http");
      const result = await new Promise((resolve, reject) => {
        const req = http.get(healthUrl, { timeout: 10000 }, (res) => {
          let data = "";
          res.on("data", (chunk) => { data += chunk; });
          res.on("end", () => {
            try { resolve({ ok: JSON.parse(data).ok === true, status: res.statusCode }); }
            catch { resolve({ ok: false, status: res.statusCode }); }
          });
        });
        req.on("error", (err) => reject(err));
        req.on("timeout", () => { req.destroy(); reject(new Error("timeout")); });
      });

      if (result.ok) {
        _lastHealthy = Date.now();
      } else {
        const degradedMs = Date.now() - _lastHealthy;
        console.warn(`[selfWatchdog] Health check #${_checkCount} DEGRADED (${degradedMs}ms since last healthy)`);
        appendGraphEvent({
          component: "self_watchdog", category: "supervision", action: "health_degraded",
          actor: { type: "runtime", id: "self-watchdog" },
          target: { type: "runtime", id: "asolaria-main" },
          context: { checkCount: _checkCount, degradedMs, status: result.status },
          risk: { score: 3, level: "medium", reasons: ["self_health_degraded"] }
        });
      }
    } catch (error) {
      const degradedMs = Date.now() - _lastHealthy;
      console.error(`[selfWatchdog] Health check #${_checkCount} FAILED: ${error.message} (${degradedMs}ms since last healthy)`);
      appendGraphEvent({
        component: "self_watchdog", category: "supervision", action: "health_check_failed",
        actor: { type: "runtime", id: "self-watchdog" },
        target: { type: "runtime", id: "asolaria-main" },
        context: { checkCount: _checkCount, degradedMs, error: error.message },
        risk: { score: 5, level: "high", reasons: ["self_health_check_failed"] }
      });
    }
  }, intervalMs);

  return { started: true, intervalMs, checkCount: _checkCount };
}

function stop() {
  if (_interval) {
    clearInterval(_interval);
    _interval = null;
  }
  return { stopped: true, totalChecks: _checkCount };
}

function status() {
  return {
    running: Boolean(_interval),
    checkCount: _checkCount,
    lastHealthyAt: new Date(_lastHealthy).toISOString(),
    degradedMs: _interval ? Date.now() - _lastHealthy : 0
  };
}

module.exports = { start, stop, status };
