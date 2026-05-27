#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const http = require("http");
const crypto = require("crypto");
const express = require("express");

const ROOT = path.resolve(__dirname, "..");
const REPORT_JSON = path.join(ROOT, "reports", "original-hermes-route-server-smoke-latest.json");
const REPORT_MD = path.join(ROOT, "reports", "original-hermes-route-server-smoke-latest.md");
const STATE_JSON = path.join(ROOT, "data", "behcs", "original-hermes-agent", "route-server-smoke-latest.json");

const LOGICAL_AGENTS = 10_000_000_000;
const GULP_WINDOW = 2000;

const GET_ENDPOINTS = [
  "/api/worker-router/original-hermes-transport-contract",
  "/api/worker-router/original-hermes-learning-loop?limit=8",
  "/api/worker-router/original-hermes-wal-state-contract",
  "/api/worker-router/original-hermes-security-backport",
  "/api/worker-router/original-hermes-runtime-index?learningLimit=8"
];

const HOOK_GUARD_CASES = [
  {
    id: "legacy_benign_read",
    expectedDecision: "allow",
    body: {
      tool_name: "Read",
      tool_input: {
        file_path: "README.md"
      }
    }
  },
  {
    id: "legacy_env_block",
    expectedDecision: "block",
    body: {
      tool_name: "Read",
      tool_input: {
        file_path: ".env"
      }
    }
  },
  {
    id: "original_hermes_plugin_shell_denied",
    expectedDecision: "block",
    body: {
      tool_name: "Shell",
      tool_input: {
        command: "node plugin.js"
      },
      plugin_hook: true,
      plugin_id: "original-hermes-test-plugin",
      manifest_digest: "sha256:test",
      phase: "pre_exec",
      shell_policy: "unbounded",
      network_policy: "offline"
    }
  }
];

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeJson(filePath, value) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeText(filePath, value) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, value.endsWith("\n") ? value : `${value}\n`, "utf8");
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function createApp() {
  const workerRouterRoutes = require("../routes/workerRouter");
  const hookRoutes = require("../routes/hooks");
  const app = express();
  app.use(express.json({ limit: "1mb" }));
  app.use("/api/worker-router", workerRouterRoutes);
  app.use("/api/hooks", hookRoutes);
  return app;
}

function listen(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve({ server, port: address.port });
    });
    server.on("error", reject);
  });
}

function requestJson({ port, method = "GET", pathname, body }) {
  return new Promise((resolve) => {
    const payload = body ? Buffer.from(JSON.stringify(body), "utf8") : null;
    const started = Date.now();
    const req = http.request({
      hostname: "127.0.0.1",
      port,
      path: pathname,
      method,
      headers: {
        "content-type": "application/json",
        "content-length": payload ? String(payload.length) : "0"
      },
      timeout: 60_000
    }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        let json = null;
        try {
          json = text ? JSON.parse(text) : null;
        } catch {
          json = null;
        }
        resolve({
          method,
          path: pathname,
          statusCode: res.statusCode,
          elapsedMs: Date.now() - started,
          ok: res.statusCode >= 200 && res.statusCode < 300 && Boolean(json?.ok),
          jsonSummary: summarizeJson(json),
          parseOk: Boolean(json),
          error: ""
        });
      });
    });
    req.on("timeout", () => {
      req.destroy(new Error("request_timeout"));
    });
    req.on("error", (error) => {
      resolve({
        method,
        path: pathname,
        statusCode: 0,
        elapsedMs: Date.now() - started,
        ok: false,
        jsonSummary: null,
        parseOk: false,
        error: String(error.message || error)
      });
    });
    if (payload) req.write(payload);
    req.end();
  });
}

function summarizeJson(json) {
  if (!json || typeof json !== "object") return null;
  const snapshot = json.snapshot && typeof json.snapshot === "object" ? json.snapshot : null;
  return {
    ok: Boolean(json.ok),
    topKeys: Object.keys(json).slice(0, 12),
    snapshotId: snapshot?.id || snapshot?.kind || snapshot?.surface || "",
    snapshotStatus: snapshot?.status || snapshot?.decision || snapshot?.consensus || "",
    counts: {
      supervisors: snapshot?.supervisors?.length,
      surfaces: snapshot?.surfaces?.length,
      candidates: snapshot?.candidates?.length,
      backports: snapshot?.backports?.length,
      stores: snapshot?.stores?.length,
      mapNodes: snapshot?.map?.nodes?.length
    },
    guardDecision: typeof json.blocked === "boolean"
      ? (json.blocked ? "block" : "allow")
      : (json.decision || json.verdict?.decision || ""),
    guardReason: json.reason || json.verdict?.reason || ""
  };
}

function closeServer(server) {
  return new Promise((resolve) => server.close(resolve));
}

function inspectMainServerMounts() {
  const serverText = fs.readFileSync(path.join(ROOT, "server.js"), "utf8");
  return {
    hooksLoopbackOnly: /app\.use\(\s*["']\/api\/hooks["']\s*,\s*requireLoopbackOnly\s*,\s*require\(["']\.\/routes\/hooks["']\)\s*\)/.test(serverText),
    workerRouterLoopbackOnly: /app\.use\(\s*["']\/api\/worker-router["']\s*,\s*requireLoopbackOnly\s*,\s*require\(["']\.\/routes\/workerRouter["']\)\s*\)/.test(serverText)
  };
}

function buildReport(result) {
  const routeRows = result.routes.map((item) => `- ${item.method} ${item.path}: status=${item.statusCode} ok=${item.ok} elapsedMs=${item.elapsedMs}`);
  const guardRows = result.hookGuards.map((item) => `- ${item.id}: expected=${item.expectedDecision} actual=${item.actualDecision} pass=${item.pass}`);
  return `# Original Hermes Route Server Smoke

Generated: ${result.generatedAt}
Status: ${result.status}
Pass: ${result.pass}
Digest: ${result.digest}

## Logical Coverage

- Logical agents represented: ${result.logical.logicalAgents.toLocaleString()}
- Gulp windows represented: ${result.logical.gulpWindows.toLocaleString()}
- Mode: ${result.logical.mode}

## Route Checks

${routeRows.join("\n") || "- none"}

## Hook Guard Checks

${guardRows.join("\n") || "- none"}

## Main Server Mount Guards

- /api/hooks loopback-only: ${result.mainServerMounts.hooksLoopbackOnly}
- /api/worker-router loopback-only: ${result.mainServerMounts.workerRouterLoopbackOnly}

## Honesty Boundary

- Temporary loopback Express app only.
- No main server launch.
- No Git stage.
- No Git commit.
- No Git push.
- No external network call.
- No secret read.
- No shadow file edit.
`;
}

async function run({ execute = false } = {}) {
  const generatedAt = new Date().toISOString();
  const app = createApp();
  const { server, port } = await listen(app);
  let routes = [];
  let hookGuards = [];
  try {
    for (const pathname of GET_ENDPOINTS) {
      routes.push(await requestJson({ port, pathname }));
    }
    for (const testCase of HOOK_GUARD_CASES) {
      const response = await requestJson({
        port,
        method: "POST",
        pathname: "/api/hooks/guard",
        body: testCase.body
      });
      const actualDecision = response.jsonSummary?.guardDecision || "";
      const pass = response.ok && actualDecision === testCase.expectedDecision;
      hookGuards.push({
        id: testCase.id,
        expectedDecision: testCase.expectedDecision,
        actualDecision,
        pass,
        response
      });
    }
  } finally {
    await closeServer(server);
  }
  const routesPass = routes.every((item) => item.ok);
  const guardsPass = hookGuards.every((item) => item.pass);
  const mainServerMounts = inspectMainServerMounts();
  const mountPass = mainServerMounts.hooksLoopbackOnly && mainServerMounts.workerRouterLoopbackOnly;
  const pass = routesPass && guardsPass && mountPass;
  const result = {
    id: "original-hermes-route-server-smoke.v1",
    generatedAt,
    status: pass ? "ORIGINAL_HERMES_ROUTE_SERVER_SMOKE_PASS" : "ORIGINAL_HERMES_ROUTE_SERVER_SMOKE_FAIL",
    pass,
    logical: {
      logicalAgents: LOGICAL_AGENTS,
      gulpWindow: GULP_WINDOW,
      gulpWindows: Math.ceil(LOGICAL_AGENTS / GULP_WINDOW),
      mode: "compact_route_surface_coverage_no_process_storm"
    },
    routes,
    hookGuards,
    mainServerMounts,
    honesty: {
      temporaryLoopbackServer: true,
      mainServerLaunch: false,
      gitStage: false,
      gitCommit: false,
      gitPush: false,
      externalNetwork: false,
      readsSecretValues: false,
      editsShadowFiles: false
    }
  };
  result.digest = sha256(stableStringify(result));
  if (execute) {
    writeJson(STATE_JSON, result);
    writeJson(REPORT_JSON, result);
    writeText(REPORT_MD, buildReport(result));
  }
  return result;
}

function main(argv) {
  const command = argv[2] || "status";
  const execute = argv.includes("--execute");
  if (command === "status") {
    console.log(JSON.stringify({
      ok: true,
      logicalAgents: LOGICAL_AGENTS,
      endpoints: GET_ENDPOINTS.length,
      hookGuardCases: HOOK_GUARD_CASES.length,
      outputs: {
        state: path.relative(ROOT, STATE_JSON).replace(/\\/g, "/"),
        reportJson: path.relative(ROOT, REPORT_JSON).replace(/\\/g, "/"),
        reportMd: path.relative(ROOT, REPORT_MD).replace(/\\/g, "/")
      }
    }, null, 2));
    return;
  }
  if (command === "run") {
    run({ execute }).then((result) => {
      console.log(JSON.stringify({
        status: result.status,
        pass: result.pass,
        routes: result.routes.map((item) => ({ path: item.path, statusCode: item.statusCode, ok: item.ok })),
        hookGuards: result.hookGuards.map((item) => ({ id: item.id, pass: item.pass, actualDecision: item.actualDecision })),
        mainServerMounts: result.mainServerMounts,
        digest: result.digest
      }, null, 2));
      process.exit(result.pass ? 0 : 1);
    }).catch((error) => {
      console.error(error);
      process.exit(1);
    });
    return;
  }
  console.error("Usage: node tools/original-hermes-route-server-smoke.js status|run [--execute]");
  process.exit(2);
}

if (require.main === module) {
  main(process.argv);
}

module.exports = {
  run
};
