const http = require("http");
const fs = require("fs");
const path = require("path");

const TARGET_URL = "http://192.168.1.3:4781/api/health/fast";
const POLL_INTERVAL_MS = 30_000;
const FAIL_THRESHOLD = 3;
const ALERT_LOG = path.join(__dirname, "..", "logs", "liris-alert.log");
const HEALTH_LOG = path.join(__dirname, "..", "logs", "liris-health-monitor.log");

let consecutiveFailures = 0;
let totalChecks = 0;
let totalPasses = 0;
let totalFails = 0;

function timestamp() {
  return new Date().toISOString();
}

function appendLog(file, line) {
  const entry = `[${timestamp()}] ${line}\n`;
  fs.appendFileSync(file, entry);
  process.stdout.write(entry);
}

function httpGet(url, timeoutMs = 10_000) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout: timeoutMs }, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on("error", (err) => reject(err));
    req.on("timeout", () => { req.destroy(); reject(new Error("timeout")); });
  });
}

async function poll() {
  totalChecks++;
  try {
    const { status, body } = await httpGet(TARGET_URL);
    const ok = status === 200 && body && body.ok === true;

    if (ok) {
      consecutiveFailures = 0;
      totalPasses++;
      const uptime = body.uptimeSeconds || "?";
      appendLog(HEALTH_LOG, `PASS | status=${status} uptime=${uptime}s checks=${totalChecks} passes=${totalPasses} fails=${totalFails}`);
    } else {
      consecutiveFailures++;
      totalFails++;
      appendLog(HEALTH_LOG, `FAIL | status=${status} ok=${body?.ok} consecutive=${consecutiveFailures} checks=${totalChecks}`);
      checkAlert();
    }
  } catch (err) {
    consecutiveFailures++;
    totalFails++;
    appendLog(HEALTH_LOG, `FAIL | error="${err.message}" consecutive=${consecutiveFailures} checks=${totalChecks}`);
    checkAlert();
  }
}

function checkAlert() {
  if (consecutiveFailures >= FAIL_THRESHOLD) {
    const alertMsg = `ALERT: ${consecutiveFailures} consecutive failures on sovereign (192.168.1.3:4781). Last check at ${timestamp()}. Total checks=${totalChecks} passes=${totalPasses} fails=${totalFails}`;
    appendLog(ALERT_LOG, alertMsg);
    appendLog(HEALTH_LOG, `ALERT FIRED | consecutive=${consecutiveFailures}`);
  }
}

// Startup
appendLog(HEALTH_LOG, `START | target=${TARGET_URL} interval=${POLL_INTERVAL_MS}ms failThreshold=${FAIL_THRESHOLD}`);
poll();
setInterval(poll, POLL_INTERVAL_MS);
