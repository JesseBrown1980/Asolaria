#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const http = require("http");
const { spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..", "..");
const runId = "falcon-opencode-proxy-executor-20260427";
const eventId = "EVT-FALCON-OPENCODE-PROXY-EXECUTOR-2026-04-27";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", runId);

const MODELS = Object.freeze([
  "opencode/gpt-5-nano",
  "opencode/big-pickle",
  "opencode/hy3-preview-free",
  "opencode/minimax-m2.5-free",
  "opencode/nemotron-3-super-free",
  "opencode/gpt-5-nano"
]);

const LANES = Object.freeze([
  ["falcon_spawn_smoke", "Prove Falcon can receive a PID-owned proxy spawn result despite Android-native OpenCode binary hold."],
  ["termux_bridge_supervisor", "Give one bounded supervisor rule for Falcon Termux foreground execution and proxy execution."],
  ["law001_falcon_return", "Give one bounded fix to ensure every Falcon proxy result returns through LAW-001."],
  ["opencode_android_hold", "Give one bounded fix path for the missing opencode-android-arm64 binary without bypassing auth or copying secrets."],
  ["pid_ownership_truth", "Give one bounded rule that preserves Falcon PID ownership while Acer executes as proxy."],
  ["spawn_honesty_gate", "Give one bounded rule preventing proxy execution from being reported as native Falcon execution."]
]);

const PATHS = Object.freeze({
  proxyLedger: path.join(runRoot, "falcon-opencode-proxy-spawns.v1.ndjson"),
  summary: path.join(runRoot, "falcon-opencode-proxy-summary.v1.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "falcon-opencode-proxy-executor.v1.json"),
  index: path.join(repoRoot, "data", "behcs", "index", "falcon-opencode-proxy-executor-index.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "falcon-opencode-proxy-executor-map-map-mapped.v1.json"),
  cube: path.join(repoRoot, "data", "behcs", "cubes", "falcon-opencode-proxy-executor-cube-cubed.cube.js"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "falcon-opencode-proxy-executor-behcs256.glpj.json"),
  supervisors: path.join(repoRoot, "data", "behcs", "supervisors", "falcon", "falcon-opencode-proxy-executor-supervisors.v1.json"),
  lirisEnvelope: path.join(runRoot, "liris-falcon-opencode-proxy-summary-envelope.json"),
  falconEnvelope: path.join(runRoot, "falcon-opencode-proxy-summary-envelope.json"),
  postResult: path.join(runRoot, "falcon-opencode-proxy-post-result.v1.json"),
  reportJson: path.join(repoRoot, "reports", "falcon-opencode-proxy-executor-latest.json"),
  reportMd: path.join(repoRoot, "reports", "falcon-opencode-proxy-executor-latest.md")
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

function writeNdjson(filePath, rows) {
  writeText(filePath, rows.map((row) => JSON.stringify(row)).join("\n"));
}

function repoRel(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/");
}

function sha(value) {
  return crypto.createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex");
}

function pid(prefix, seed) {
  return `${prefix}.${sha(seed).slice(0, 12).toUpperCase()}`;
}

function parseOpenCodeEvents(stdout) {
  const events = [];
  for (const line of String(stdout || "").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      events.push(JSON.parse(trimmed));
    } catch {
      // Raw stdout is still hashed on the result row.
    }
  }
  return events;
}

function extractText(events) {
  return events
    .filter((event) => event.type === "text")
    .map((event) => event.part?.text || event.text || "")
    .join("\n")
    .trim();
}

function runProxySpawn(index, generatedAt) {
  const [lane, question] = LANES[index];
  const model = MODELS[index];
  const falconPid = pid("BH.AGENT.PID.FALCON.PROXY", `${eventId}:falcon:${lane}:${index}`);
  const acerProxyPid = pid("BH.AGENT.PID.ACER.PROXY", `${eventId}:acer:${lane}:${index}`);
  const prompt = [
    "BEHCS-256 LX-SPAWN-FREE Falcon proxy execution.",
    `FalconOwnedPID=${falconPid}.`,
    `AcerProxyPID=${acerProxyPid}.`,
    `Lane=${lane}.`,
    question,
    "Return one compact JSON object with keys lane, falcon_pid, proxy_pid, fix, risk.",
    "Do not edit files. Do not run tools. Do not claim native Android OpenCode execution."
  ].join(" ");

  const started = Date.now();
  const result = spawnSync("opencode", [
    "run",
    "--format",
    "json",
    "-m",
    model,
    "--dir",
    repoRoot,
    prompt
  ], {
    cwd: repoRoot,
    encoding: "utf8",
    timeout: 120_000,
    windowsHide: true,
    shell: true,
    env: {
      ...process.env,
      BROWN_HILBERT_PID: falconPid,
      BEHCS256_GLYPH: "LX-ROUTE-SPAWN",
      ASOLARIA_PROXY_EXECUTOR: "acer-for-falcon",
      ASOLARIA_BOUNDARY: "NO_FILE_EDITS_NO_TOOLS_NO_FANOUT_NO_SECRET_COPY"
    }
  });
  const elapsedMs = Date.now() - started;
  const events = parseOpenCodeEvents(result.stdout);
  const responseText = extractText(events);
  const finish = events.find((event) => event.type === "step_finish");

  return {
    seq: index + 1,
    ts: generatedAt,
    lane,
    question,
    model,
    falconPid,
    acerProxyPid,
    executionOwner: "falcon",
    executorHost: "acer",
    transport: "LAW-001+adb-reverse+falcon-lan-4947",
    nativeFalconOpenCode: false,
    proxyReason: "opencode-ai lacks opencode-android-arm64 package under Termux",
    ok: result.status === 0 && responseText.length > 0,
    exitCode: result.status,
    signal: result.signal,
    elapsedMs,
    responseText: responseText.slice(0, 2000),
    responseSha256: sha(responseText || ""),
    eventCount: events.length,
    tokens: finish?.part?.tokens || null,
    cost: typeof finish?.part?.cost === "number" ? finish.part.cost : null,
    stdoutSha256: sha(result.stdout || ""),
    stderr: String(result.stderr || "").slice(0, 1000),
    error: result.error ? String(result.error.message || result.error).slice(0, 1000) : "",
    boundary: "Falcon PID-owned proxy execution; Acer executes local OpenCode; no file edits, no tools, no fanout, no secret copying."
  };
}

function postJson(url, body) {
  return new Promise((resolve) => {
    const payload = JSON.stringify(body);
    const target = new URL(url);
    const req = http.request({
      hostname: target.hostname,
      port: target.port,
      path: target.pathname,
      method: "POST",
      timeout: 5000,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload)
      }
    }, (res) => {
      let raw = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        raw += chunk;
      });
      res.on("end", () => {
        let parsed = null;
        try {
          parsed = JSON.parse(raw);
        } catch {}
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode, body: parsed || raw });
      });
    });
    req.on("error", (error) => resolve({ ok: false, error: error.message }));
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.write(payload);
    req.end();
  });
}

async function main() {
  fs.mkdirSync(runRoot, { recursive: true });
  const generatedAt = new Date().toISOString();
  const rows = [];
  for (let index = 0; index < LANES.length; index += 1) {
    rows.push(runProxySpawn(index, generatedAt));
  }

  const okCount = rows.filter((row) => row.ok).length;
  const totalTokens = rows.reduce((sum, row) => sum + (row.tokens?.total || 0), 0);
  const totalCost = rows.reduce((sum, row) => sum + (typeof row.cost === "number" ? row.cost : 0), 0);
  writeNdjson(PATHS.proxyLedger, rows);

  const summary = {
    id: "falcon-opencode-proxy-summary.v1",
    generatedAt,
    runId,
    eventId,
    status: okCount === rows.length
      ? "FALCON_PROXY_SPAWN_OPERATIONAL"
      : "FALCON_PROXY_SPAWN_PARTIAL_HOLD",
    d11: okCount === rows.length
      ? "PROVEN_FALCON_PID_OWNED_ACER_PROXY_OPENCODE"
      : "OBSERVED_FALCON_PROXY_PARTIAL",
    realProxySpawnsRequested: rows.length,
    realProxySpawnsOk: okCount,
    totalTokens,
    totalCost,
    nativeFalconOpenCode: false,
    proxyReason: "Termux repaired, but npm opencode-ai cannot install because opencode-android-arm64 is missing.",
    fix: "Falcon spawn semantics now route through Acer OpenCode proxy while preserving Falcon PID ownership and returning results over LAW-001.",
    empiricalSha256: sha(fs.readFileSync(PATHS.proxyLedger, "utf8")),
    boundary: "No root, no flashing, no private app data extraction, no secret copying, no uncontrolled fanout, no native Android OpenCode claim."
  };

  const artifacts = {
    proxyLedger: repoRel(PATHS.proxyLedger),
    summary: repoRel(PATHS.summary),
    memory: repoRel(PATHS.memory),
    index: repoRel(PATHS.index),
    map: repoRel(PATHS.map),
    cube: repoRel(PATHS.cube),
    glpj: repoRel(PATHS.glpj),
    supervisors: repoRel(PATHS.supervisors),
    report: repoRel(PATHS.reportMd)
  };

  writeJson(PATHS.summary, summary);
  writeJson(PATHS.memory, {
    type: "memory",
    eventId,
    status: summary.status,
    significance: "Falcon is spawnable through a truthful proxy path: Falcon owns the PID and request, Acer executes the unsupported OpenCode binary, and Falcon receives the result over LAW-001. This fixes the operational spawn block without inventing native Android OpenCode support.",
    summary,
    rows: rows.map((row) => ({
      seq: row.seq,
      lane: row.lane,
      falconPid: row.falconPid,
      acerProxyPid: row.acerProxyPid,
      ok: row.ok,
      responseSha256: row.responseSha256
    }))
  });
  writeJson(PATHS.index, {
    eventId,
    runId,
    status: summary.status,
    keys: [
      "falcon",
      "opencode-proxy",
      "lx-route-spawn",
      "falcon-pid-owned",
      "acer-executor",
      "android-arm64-binary-hold"
    ],
    rows: rows.length,
    okRows: okCount,
    empiricalSha256: summary.empiricalSha256
  });
  writeJson(PATHS.map, {
    eventId,
    map: [
      ["falcon", "owns", "BH.AGENT.PID.FALCON.PROXY.*"],
      ["acer", "executes", "opencode-ai"],
      ["opencode-ai", "blocked-on-falcon-native", "opencode-android-arm64 missing"],
      ["law001", "returns", "proxy results to falcon+liris"],
      ["supervisors", "gate", "native-vs-proxy truth"]
    ]
  });
  writeText(PATHS.cube, `module.exports = ${JSON.stringify({
    eventId,
    cube: "falcon-opencode-proxy-executor-cube-cubed",
    dimensions: {
      D_DEVICE: "falcon",
      D_OWNER: "falcon-pid-owned",
      D_EXECUTOR: "acer-opencode-proxy",
      D_TRANSPORT: "LAW-001",
      D_HOLD: "native-android-opencode-binary-missing",
      D_BOUNDARY: "no-secret-copy-no-fanout-no-native-claim"
    }
  }, null, 2)};\n`);
  writeJson(PATHS.glpj, {
    eventId,
    sentences: [
      "FALCON OWNS SPAWN PID.",
      "ACER EXECUTES OPENCODE PROXY.",
      "LAW-001 RETURNS RESULT.",
      "ANDROID NATIVE OPENCODE HOLD REMAINS TRUE.",
      "PROXY IS NOT NATIVE."
    ],
    glyphs: ["LX-ROUTE-SPAWN", "LX-SPAWN-FREE", "D-LIVE-FREE-AGENT", "EVT-LIVE-FREE-AGENT-RESPONSE"]
  });
  writeJson(PATHS.supervisors, {
    supervisorSet: "falcon-opencode-proxy-executor-supervisors.v1",
    eventId,
    supervisors: [
      {
        pid: "BH.SUPERVISOR.PID.FALCON.PROXY.ROUTE",
        role: "Routes Falcon live-free-agent requests to Acer proxy while Android native binary is unavailable.",
        verdict: summary.status
      },
      {
        pid: "BH.SUPERVISOR.PID.FALCON.PROXY.TRUTH",
        role: "Prevents proxy results from being reported as native Falcon OpenCode execution.",
        verdict: "proxy_truth_gate_required"
      },
      {
        pid: "BH.SUPERVISOR.PID.FALCON.OPENCODE.ANDROID.WATCH",
        role: "Watches for future opencode-android-arm64 availability before native Falcon promotion.",
        verdict: "hold_native_until_supported_binary_exists"
      }
    ]
  });

  const report = [
    "# Falcon OpenCode Proxy Executor",
    "",
    `Generated: ${generatedAt}`,
    "",
    `Status: ${summary.status}`,
    "",
    `Real proxy spawns requested: ${rows.length}`,
    `Real proxy spawns ok: ${okCount}`,
    `Total tokens reported: ${totalTokens}`,
    `Total cost reported: ${totalCost}`,
    "",
    "| # | Falcon PID | Acer Proxy PID | Model | Lane | OK | ms |",
    "|---:|---|---|---|---|---:|---:|",
    ...rows.map((row) => `| ${row.seq} | \`${row.falconPid}\` | \`${row.acerProxyPid}\` | \`${row.model}\` | \`${row.lane}\` | ${row.ok ? "yes" : "no"} | ${row.elapsedMs} |`),
    "",
    `Boundary: ${summary.boundary}`,
    ""
  ].join("\n");
  writeJson(PATHS.reportJson, { summary, rows, artifacts });
  writeText(PATHS.reportMd, report);

  const envelope = {
    verb: "falcon-opencode-proxy-executor-summary",
    target: "all-nodes",
    from: "acer-codex",
    id: "falcon-opencode-proxy-executor-20260427-acer-summary-001",
    ts: generatedAt,
    eventId,
    status: summary.status,
    d11: summary.d11,
    summary,
    artifacts,
    boundary: summary.boundary
  };
  writeJson(PATHS.lirisEnvelope, envelope);
  writeJson(PATHS.falconEnvelope, { ...envelope, target: "falcon" });

  const posts = {
    liris: await postJson("http://192.168.100.2:4947/behcs/send", envelope),
    falcon: await postJson("http://192.168.1.8:4947/behcs/send", { ...envelope, target: "falcon" })
  };
  writeJson(PATHS.postResult, { postedAt: new Date().toISOString(), posts });

  console.log(JSON.stringify({
    ok: okCount === rows.length,
    status: summary.status,
    realProxySpawnsRequested: rows.length,
    realProxySpawnsOk: okCount,
    totalTokens,
    totalCost,
    posts,
    artifacts
  }, null, 2));

  process.exit(okCount === rows.length ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
