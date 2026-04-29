const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

function cleanText(value, maxLen = 400) {
  return String(value || "").replace(/\r/g, "").trim().slice(0, maxLen);
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function redactLocalPath(value) {
  const text = cleanText(value, 1000);
  if (!text) return "";
  const normalized = text.replace(/\\/g, "/");
  const home = os.homedir().replace(/\\/g, "/");
  let redacted = normalized;
  if (home) {
    redacted = redacted.replace(new RegExp(escapeRegExp(home), "ig"), "~");
  }
  redacted = redacted.replace(/[A-Za-z]:\/[^\s"'<>]+/g, (match) => path.basename(match));
  if (redacted !== normalized) {
    return redacted;
  }
  if (path.isAbsolute(normalized)) {
    return path.basename(normalized);
  }
  return normalized;
}

function probeEnv() {
  return {
    PATH: process.env.PATH || "",
    Path: process.env.Path || process.env.PATH || "",
    PATHEXT: process.env.PATHEXT || "",
    SystemRoot: process.env.SystemRoot || "",
    WINDIR: process.env.WINDIR || "",
    ComSpec: process.env.ComSpec || ""
  };
}

function candidateExecutables() {
  const explicit = cleanText(process.env.ASOLARIA_KIMI_CODE_PATH || "", 500);
  return [
    explicit,
    "kimi-code",
    "kimi",
    "kimi-code-cli"
  ].filter(Boolean);
}

function configPath() {
  return path.join(os.homedir(), ".kimi", "config.toml");
}

function probeExecutable(executable, timeoutMs = 2500) {
  return new Promise((resolve) => {
    const child = spawn(executable, ["--version"], {
      windowsHide: true,
      env: probeEnv()
    });
    let stdout = "";
    let stderr = "";
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        child.kill();
      } catch (_error) {}
      resolve({
        executable: redactLocalPath(executable),
        available: false,
        version: null,
        error: "timeout"
      });
    }, Math.max(1000, Number(timeoutMs || 2500)));

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({
        executable: redactLocalPath(executable),
        available: false,
        version: null,
        error: redactLocalPath(error?.message || error)
      });
    });
    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      const text = cleanText(stdout || stderr || "");
      resolve({
        executable: redactLocalPath(executable),
        available: Number(code || 0) === 0,
        version: text || null,
        error: Number(code || 0) === 0 ? "" : redactLocalPath(stderr || stdout || `exit ${code}`)
      });
    });
  });
}

async function getKimiCodeStatus(options = {}) {
  const timeoutMs = Math.max(1000, Number(options.timeoutMs || 2500));
  const probes = [];
  for (const executable of candidateExecutables()) {
    const probe = await probeExecutable(executable, timeoutMs);
    probes.push(probe);
    if (probe.available) {
      break;
    }
  }

  const selected = probes.find((probe) => probe.available) || null;
  const kimiConfigPath = configPath();
  const configExists = fs.existsSync(kimiConfigPath);
  const configBytes = configExists ? fs.statSync(kimiConfigPath).size : 0;

  return {
    available: Boolean(selected),
    executable: selected?.executable || "",
    version: selected?.version || null,
    authenticated: Boolean(configExists && configBytes > 0),
    authentication: configExists && configBytes > 0 ? "config:~/.kimi/config.toml" : "",
    configPath: "~/.kimi/config.toml",
    configExists,
    statusText: selected
      ? "Kimi Code CLI detected."
      : "Kimi Code CLI not detected. Install Kimi Code CLI and run /login or /setup before using CLI transport.",
    probes: probes.slice(0, 6)
  };
}

function manifest() {
  return {
    id: "kimi_code",
    title: "Kimi Code CLI",
    description: "Read-only status probe for Kimi Code CLI availability and login configuration.",
    capabilities: ["provider_status", "cli_auth_status"],
    readScopes: ["kimi_code_status", "home_kimi_config_presence"],
    writeScopes: [],
    approvalRequired: false,
    healthCheck: true,
    secretRequirements: ["Kimi Code /login session or Moonshot API key stored outside the repo"],
    sideEffects: ["runs a short --version probe if a Kimi executable is present"],
    failureModes: ["cli_not_found", "config_missing", "timeout"]
  };
}

module.exports = {
  getKimiCodeStatus,
  manifest
};
