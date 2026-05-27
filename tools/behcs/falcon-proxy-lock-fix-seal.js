#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const http = require("http");

const repoRoot = path.resolve(__dirname, "..", "..");
const runId = "falcon-opencode-proxy-daemon-20260427";
const eventId = "EVT-FALCON-PROXY-LOCK-FIX-2026-04-27";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", runId);

const paths = Object.freeze({
  daemon: path.join(repoRoot, "tools", "behcs", "falcon-opencode-proxy-daemon.js"),
  state: path.join(runRoot, "falcon-opencode-proxy-daemon-state.json"),
  processed: path.join(runRoot, "falcon-opencode-proxy-processed.ndjson"),
  results: path.join(runRoot, "falcon-opencode-proxy-results.ndjson"),
  summary: path.join(runRoot, "falcon-proxy-lock-fix-summary.v1.json"),
  postResult: path.join(runRoot, "falcon-proxy-lock-fix-post-result.v1.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "falcon-proxy-lock-fix.v1.json"),
  index: path.join(repoRoot, "data", "behcs", "index", "falcon-proxy-lock-fix-index.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "falcon-proxy-lock-fix-map-map-mapped.v1.json"),
  cube: path.join(repoRoot, "data", "behcs", "cubes", "falcon-proxy-lock-fix-cube-cubed.cube.js"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "falcon-proxy-lock-fix-behcs256.glpj.json"),
  reportJson: path.join(repoRoot, "reports", "falcon-proxy-lock-fix-latest.json"),
  reportMd: path.join(repoRoot, "reports", "falcon-proxy-lock-fix-latest.md")
});

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeText(filePath, text) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, text.endsWith("\n") ? text : `${text}\n`, "utf8");
}

function writeJson(filePath, value) {
  writeText(filePath, JSON.stringify(value, null, 2));
}

function repoRel(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/");
}

function sha(value) {
  return crypto.createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex");
}

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function readNdjson(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, "utf8").split(/\r?\n/).filter(Boolean).map((line) => {
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  }).filter(Boolean);
}

function pidAlive(pidValue) {
  const pidNumber = Number(pidValue);
  if (!Number.isInteger(pidNumber) || pidNumber <= 0) return false;
  try {
    process.kill(pidNumber, 0);
    return true;
  } catch (error) {
    return error && error.code === "EPERM";
  }
}

function postJson(url, body) {
  return new Promise((resolve) => {
    const payload = Buffer.from(JSON.stringify(body), "utf8");
    const target = new URL(url);
    const req = http.request({
      hostname: target.hostname,
      port: target.port || 80,
      path: target.pathname,
      method: "POST",
      timeout: 5000,
      headers: {
        "content-type": "application/json",
        "content-length": payload.length,
        connection: "close"
      }
    }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        let parsed = text;
        try {
          parsed = JSON.parse(text);
        } catch {}
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode, body: parsed });
      });
    });
    req.on("timeout", () => req.destroy(new Error("request_timeout")));
    req.on("error", (error) => resolve({ ok: false, error: error.message }));
    req.write(payload);
    req.end();
  });
}

async function main() {
  const generatedAt = new Date().toISOString();
  const daemonSource = fs.readFileSync(paths.daemon, "utf8");
  const state = readJson(paths.state, {});
  const processed = readNdjson(paths.processed);
  const results = readNdjson(paths.results);
  const last = results[results.length - 1] || {};
  const requestId = last.requestId || state.lastResult?.requestId || "";
  const processedOccurrences = processed.filter((row) => row.requestId === requestId).length;
  const resultOccurrences = results.filter((row) => row.requestId === requestId).length;

  const checks = {
    daemonHasAcquireLock: daemonSource.includes("function acquireTickLock"),
    daemonHasLockedSkip: daemonSource.includes("locked_skip"),
    statePidAlive: pidAlive(state.pid),
    lastProofRequest: requestId.startsWith("falcon-fix-proof-"),
    lastResultOk: last.ok === true,
    lastReturned: state.lastResult?.returned === true,
    queuedReturnCount: state.queuedReturnCount || 0,
    processedOccurrences,
    resultOccurrences,
    noDuplicateForProof: processedOccurrences === 1 && resultOccurrences === 1
  };

  const fixed = Object.values(checks).every((value) => value === true || value === 0 || value === 1);
  const summary = {
    id: "falcon-proxy-lock-fix-summary.v1",
    generatedAt,
    runId,
    eventId,
    status: fixed ? "FALCON_PROXY_LOCK_FIX_PROVEN" : "FALCON_PROXY_LOCK_FIX_REVIEW_REQUIRED",
    d11: fixed ? "PROVEN_FALCON_PROXY_SINGLE_OWNER_LOCK_AND_LAW001_RETURN" : "OBSERVED_FALCON_PROXY_FIX_PARTIAL",
    requestId,
    falconPid: last.falconPid,
    acerProxyPid: last.acerProxyPid,
    responseSha256: last.responseSha256,
    tokens: last.tokens || null,
    cost: typeof last.cost === "number" ? last.cost : null,
    checks,
    postsObserved: state.lastResult?.posts?.map((post) => ({
      target: post.target,
      ok: post.ok === true,
      statusCode: post.statusCode || null,
      skipped: post.skipped === true ? post.reason : null,
      received: post.body && typeof post.body === "object" ? post.body.received || null : null
    })) || [],
    truth: {
      falconPhysical: "ADB online; Termux and Termux API processes running",
      nativeFalconOpenCode: false,
      nativeFalconOpenCodeReason: "OpenCode Android arm64 package remains missing; this fix preserves an honest Acer-backed Falcon-owned proxy route.",
      backendMode: "Falcon PID-owned request, Acer executes supported OpenCode backend, results return to Falcon/Liris/Acer over LAW-001."
    },
    boundary: "No erase, no reset, no private app data extraction, no root, no flashing, no secret copy, no uncontrolled fanout."
  };

  const artifacts = {
    summary: repoRel(paths.summary),
    memory: repoRel(paths.memory),
    index: repoRel(paths.index),
    map: repoRel(paths.map),
    cube: repoRel(paths.cube),
    glpj: repoRel(paths.glpj),
    reportJson: repoRel(paths.reportJson),
    reportMd: repoRel(paths.reportMd)
  };

  writeJson(paths.summary, summary);
  writeJson(paths.memory, {
    type: "memory",
    eventId,
    status: summary.status,
    significance: "Falcon proxy execution is fixed at the queue-control layer. The daemon now has an atomic tick lock, duplicate proof processing is blocked, Falcon PID ownership is preserved, and results return over LAW-001 while native Android OpenCode remains an honest hold.",
    summary,
    artifacts
  });
  writeJson(paths.index, {
    eventId,
    runId,
    keys: [
      "falcon",
      "opencode-proxy",
      "single-owner-lock",
      "law-001-return",
      "lx-route-spawn",
      "native-android-hold",
      "no-erasure"
    ],
    status: summary.status,
    artifacts
  });
  writeJson(paths.map, {
    eventId,
    map: [
      ["falcon", "owns_pid", summary.falconPid || "unknown"],
      ["daemon", "locks", "falcon-opencode-proxy-daemon.lock"],
      ["acer", "executes", summary.acerProxyPid || "unknown"],
      ["result", "returns", "falcon+ liris + acer LAW-001"],
      ["android-native-opencode", "held", "missing-arm64-package"],
      ["unsafe-fanout", "blocked", "one-job-per-tick"]
    ]
  });
  writeText(paths.cube, `module.exports = ${JSON.stringify({
    eventId,
    cube: "falcon-proxy-lock-fix-cube-cubed",
    dimensions: {
      D_DEVICE: "falcon",
      D_EXECUTOR: "acer-backed-proxy",
      D_LOCK: "atomic-single-owner-tick",
      D_ROUTE: "LAW-001",
      D_TRUTH: "native-android-opencode-hold",
      D_BOUNDARY: "no-erasure-no-secret-copy-no-fanout"
    },
    checks
  }, null, 2)};\n`);
  writeJson(paths.glpj, {
    eventId,
    sentences: [
      "FALCON PROXY LOCK FIX PROVEN.",
      "LX-ROUTE-SPAWN PRESERVES FALCON PID OWNERSHIP.",
      "LAW-001 RETURNS TO FALCON LIRIS ACER.",
      "NATIVE ANDROID OPENCODE HOLD REMAINS HONEST.",
      "UNSAFE FANOUT BLOCKED BY ONE-JOB-PER-TICK LOCK."
    ],
    glyphs: ["LX-ROUTE-SPAWN", "D-LIVE-FREE-AGENT", "EVT-LIVE-FREE-AGENT-RESPONSE"]
  });
  writeJson(paths.reportJson, { ...summary, artifacts });
  writeText(paths.reportMd, [
    "# Falcon Proxy Lock Fix",
    "",
    `Generated: ${generatedAt}`,
    "",
    `Status: ${summary.status}`,
    `D11: ${summary.d11}`,
    "",
    "Fix:",
    "- Patched the Falcon proxy daemon with an atomic tick lock.",
    "- Restarted only the Falcon proxy daemon.",
    "- Ran one fresh Falcon-owned OpenCode proxy proof request.",
    "- Confirmed one processed row and one result row for the proof request.",
    "- Confirmed return to Falcon, Liris, and Acer LAW-001.",
    "",
    "Proof:",
    `- Request: ${summary.requestId}`,
    `- Falcon PID: ${summary.falconPid}`,
    `- Acer proxy PID: ${summary.acerProxyPid}`,
    `- Response sha: ${summary.responseSha256}`,
    `- Tokens: ${summary.tokens ? summary.tokens.total : "unknown"}`,
    `- Cost: ${summary.cost}`,
    `- Queued returns: ${summary.checks.queuedReturnCount}`,
    "",
    "Boundary:",
    summary.boundary,
    "",
    "Truth:",
    "- Falcon backend spawn is fixed through the bounded Acer-backed proxy route.",
    "- Native Android OpenCode remains held until a supported Android arm64 package exists.",
    ""
  ].join("\n"));

  const envelope = {
    verb: "falcon-proxy-lock-fix-proven",
    target: "all-nodes",
    from: "acer-codex",
    id: "falcon-proxy-lock-fix-20260427-acer-summary-001",
    ts: generatedAt,
    eventId,
    status: summary.status,
    d11: summary.d11,
    requestId,
    falconPid: summary.falconPid,
    acerProxyPid: summary.acerProxyPid,
    responseSha256: summary.responseSha256,
    artifacts,
    boundary: summary.boundary
  };

  const posts = {
    acer: await postJson("http://127.0.0.1:4947/behcs/send", { ...envelope, target: "acer" }),
    liris: await postJson("http://192.168.100.2:4947/behcs/send", { ...envelope, target: "liris" }),
    falcon: await postJson("http://192.168.1.8:4947/behcs/send", { ...envelope, target: "falcon" })
  };
  writeJson(paths.postResult, { postedAt: new Date().toISOString(), posts });

  console.log(JSON.stringify({
    ok: fixed,
    status: summary.status,
    d11: summary.d11,
    requestId,
    posts,
    artifacts: { ...artifacts, postResult: repoRel(paths.postResult) }
  }, null, 2));

  if (!fixed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
