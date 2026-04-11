const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const repoRoot = path.resolve(__dirname, "..");
const compatPort = Number(process.env.ASOLARIA_COMPAT_4781_PORT || 4781);
const gatewayPort = Number(process.env.ASOLARIA_GATEWAY_PORT || 4791);
const bindHost = String(process.env.ASOLARIA_COMPAT_4781_BIND || "127.0.0.1").trim() || "127.0.0.1";
const forceRestart = String(process.env.ASOLARIA_COMPAT_4781_REUSE_HEALTHY || "").trim() !== "1";
const baseUrl = `http://${bindHost}:${compatPort}`;
const startScript = path.join(repoRoot, "tools", "Start-Asolaria-Compat4781.ps1");
const contractTest = path.join(repoRoot, "tests", "public-worker-runtime-contract.test.js");

function findPwsh() {
  const candidates = [
    process.env.PWSH_PATH,
    "C:\\Program Files\\PowerShell\\7\\pwsh.exe",
    "pwsh"
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (candidate === "pwsh" || fs.existsSync(candidate)) return candidate;
  }
  throw new Error("pwsh_not_found");
}

function findBrowserExecutable() {
  const candidates = [
    process.env.ASOLARIA_BROWSER_PATH,
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Google/Chrome/Application/chrome.exe"
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return "";
}

function runCommand(command, args, env = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    timeout: 30_000,
    env: {
      ...process.env,
      ...env
    }
  });
  return {
    ok: result.status === 0,
    status: result.status || 0,
    timedOut: Boolean(result.error && result.error.code === "ETIMEDOUT"),
    stdout: String(result.stdout || "").trim(),
    stderr: String(result.stderr || "").trim()
  };
}

async function request(pathname, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(options.timeoutMs || 10_000));
  try {
    const response = await fetch(new URL(pathname, `${baseUrl}/`), {
      method: options.method || "GET",
      signal: controller.signal,
      headers: {
        Accept: options.accept || "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {})
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const text = await response.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    return {
      status: response.status,
      ok: response.ok,
      text,
      json
    };
  } finally {
    clearTimeout(timeout);
  }
}

function summarizeJsonBody(payload) {
  if (!payload || typeof payload !== "object") return null;
  if (Array.isArray(payload.dispatches)) {
    return { dispatchCount: payload.dispatches.length };
  }
  if (payload.status && typeof payload.status === "object") {
    return {
      defaultWorker: payload.status.defaultWorker || "",
      workerCount: Array.isArray(payload.status.workers) ? payload.status.workers.length : 0
    };
  }
  if (payload.summary && typeof payload.summary === "object") {
    return {
      entities: Number(payload.summary.entities || 0),
      projectedTasks: Number(payload.summary.projectedTasks || 0)
    };
  }
  if (payload.workerRouter && payload.taskLedger) {
    return {
      dispatchCount: Array.isArray(payload.workerRouter.dispatches) ? payload.workerRouter.dispatches.length : 0,
      openTaskCount: Array.isArray(payload.taskLedger.openTasks) ? payload.taskLedger.openTasks.length : 0
    };
  }
  return null;
}

async function runBrowserSmoke() {
  const { chromium } = require("playwright");
  const executablePath = findBrowserExecutable();
  const browser = await chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {})
  });
  try {
    const workerRouterPage = await browser.newPage();
    await workerRouterPage.goto(`${baseUrl}/worker-router.html`, { waitUntil: "networkidle" });
    const workerRouter = await workerRouterPage.evaluate(() => ({
      title: document.title,
      routerModeMeta: document.querySelector("meta[name='asolaria-router-mode']")?.content || "",
      bodyMode: document.body?.dataset?.routerMode || "",
      modePill: document.getElementById("routerModePill")?.textContent || "",
      recommendDisabled: Boolean(document.getElementById("routerRecommendBtn")?.disabled),
      dispatchDisabled: Boolean(document.getElementById("routerDispatchBtn")?.disabled)
    }));

    const previewPage = await browser.newPage();
    const calls = [];
    previewPage.on("requestfinished", (request) => {
      const url = request.url();
      if (url.startsWith(`${baseUrl}/api/`)) {
        calls.push(url.replace(baseUrl, ""));
      }
    });
    await previewPage.goto(`${baseUrl}/swarm-civilization-preview.html`, { waitUntil: "networkidle" });
    const civilization = await previewPage.evaluate(() => ({
      title: document.title,
      liveState: document.getElementById("civilizationLiveState")?.textContent || "",
      jsonHref: document.getElementById("civilizationJsonLink")?.getAttribute("href") || ""
    }));

    return {
      workerRouter,
      civilization: {
        ...civilization,
        calls
      }
    };
  } finally {
    await browser.close();
  }
}

async function waitForReady(pathname, validator, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = "";
  while (Date.now() < deadline) {
    try {
      const result = await request(pathname, { timeoutMs: 12_000 });
      if (validator(result)) return result;
      lastError = `unexpected_status:${result.status}`;
    } catch (error) {
      lastError = String(error && error.message ? error.message : error);
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error(`wait_for_ready_failed:${pathname}:${lastError || "timeout"}`);
}

async function main() {
  const pwsh = findPwsh();
  const launcherArgs = [
    "-File",
    startScript,
    "-Port",
    String(compatPort),
    "-GatewayPort",
    String(gatewayPort),
    "-BindHost",
    bindHost
  ];
  if (forceRestart) launcherArgs.push("-ForceRestart");
  const launcher = runCommand(pwsh, launcherArgs);
  if (!launcher.ok && !launcher.timedOut) {
    throw new Error(`compat_start_failed: ${launcher.stderr || launcher.stdout || launcher.status}`);
  }
  await waitForReady("/api/health/fast", (result) => result.ok && result.json?.ok === true, 60_000);
  await waitForReady("/api/worker-runtime/status", (result) => result.ok && result.json?.ok === true, 60_000);

  const endpointChecks = [];
  for (const pathname of [
    "/api/worker-router/status",
    "/api/worker-router/dispatches?limit=5",
    "/api/worker-runtime/status",
    "/api/worker-runtime/civilization-world?trusted=1&admin=0"
  ]) {
    const result = await request(pathname);
    endpointChecks.push({
      path: pathname,
      status: result.status,
      ok: result.ok,
      summary: summarizeJsonBody(result.json)
    });
  }
  for (const blocked of [
    { path: "/api/worker-router/recommend", body: { title: "compat gate probe" } },
    { path: "/api/worker-router/dispatch", body: { title: "compat gate probe" } }
  ]) {
    const result = await request(blocked.path, { method: "POST", body: blocked.body });
    endpointChecks.push({
      path: blocked.path,
      status: result.status,
      ok: result.status === 404
    });
  }

  const contract = runCommand(process.execPath, ["--test", contractTest], {
    ASOLARIA_CONTRACT_BASE: baseUrl
  });
  if (!contract.ok) {
    throw new Error(`compat_contract_failed: ${contract.stderr || contract.stdout || contract.status}`);
  }

  const browser = await runBrowserSmoke();
  const summary = {
    ok: true,
    baseUrl,
    launcher: {
      ok: launcher.ok,
      forceRestart,
      stdout: launcher.stdout.split(/\r?\n/).slice(-6)
    },
    endpointChecks,
    contract: {
      ok: contract.ok,
      stdout: contract.stdout.split(/\r?\n/).slice(-12)
    },
    browser
  };

  const workerRouterOk = browser.workerRouter.routerModeMeta === "read-only"
    && browser.workerRouter.bodyMode === "read-only"
    && browser.workerRouter.recommendDisabled
    && browser.workerRouter.dispatchDisabled;
  const civilizationOk = browser.civilization.liveState.includes("Live local projection")
    && browser.civilization.calls.includes("/api/worker-runtime/civilization-world?trusted=1&admin=1")
    && browser.civilization.calls.includes("/api/worker-router/dispatches?limit=12");
  const endpointsOk = endpointChecks.every((item) => item.ok);
  if (!workerRouterOk || !civilizationOk || !endpointsOk) {
    summary.ok = false;
    console.log(JSON.stringify(summary, null, 2));
    process.exit(1);
  }

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    baseUrl,
    error: String(error && error.message ? error.message : error)
  }, null, 2));
  process.exit(1);
});
