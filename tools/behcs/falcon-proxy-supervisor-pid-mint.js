#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const http = require("http");

const repoRoot = path.resolve(__dirname, "..", "..");
const runId = "falcon-proxy-supervisor-pid-mint-20260427";
const eventId = "EVT-FALCON-PROXY-SUPERVISOR-PID-MINT-2026-04-27";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", runId);

const supervisors = Object.freeze([
  ["BH.SUPERVISOR.PID.FALCON.PROXY.DAEMON.INSTANT", "Keeps the Acer backend proxy daemon alive and bounded while Falcon is connected."],
  ["BH.SUPERVISOR.PID.FALCON.PROXY.LAW001", "Requires Falcon LAW-001 4947/4950 health before live return promotion."],
  ["BH.SUPERVISOR.PID.FALCON.PROXY.ADB.REVERSE", "Refreshes and verifies ADB reverse lanes 4781/4947/4950 without touching phone private data."],
  ["BH.SUPERVISOR.PID.FALCON.PROXY.REQUEST.QUEUE", "Accepts Falcon-owned spawn requests from queue or LAW-001 inbox."],
  ["BH.SUPERVISOR.PID.FALCON.PROXY.ACER.EXECUTOR", "Runs the unsupported OpenCode binary on Acer as Falcon-owned proxy executor."],
  ["BH.SUPERVISOR.PID.FALCON.PROXY.RETURN.ROUTER", "Returns proxy results to Falcon first, then mirrors to Liris and Acer local bus."],
  ["BH.SUPERVISOR.PID.FALCON.PROXY.SPOOL.REPLAY", "Spools results when Falcon transport is down and replays them when LAW-001 returns."],
  ["BH.SUPERVISOR.PID.FALCON.PROXY.TRUTH.GATE", "Prevents proxy execution from being reported as native Android OpenCode execution."],
  ["BH.SUPERVISOR.PID.FALCON.PROXY.NATIVE.HOLD.WATCH", "Keeps native Falcon OpenCode on hold until a supported Android arm64 binary exists."],
  ["BH.SUPERVISOR.PID.FALCON.PROXY.ENERGY.GATE", "Limits backend proxy execution to bounded one-job ticks and recorded costs."],
  ["BH.SUPERVISOR.PID.FALCON.PROXY.PID.OWNER", "Ensures every backend result carries a Falcon-owned BH.AGENT.PID.FALCON.PROXY.* PID."],
  ["BH.SUPERVISOR.PID.FALCON.PROXY.FRONTEND.FREE", "Keeps Falcon phone frontend free for Jesse while backend work runs on Acer."],
  ["BH.SUPERVISOR.PID.FALCON.PROXY.HERMES.AWARE", "Publishes the route to Hermes supervisor-of-supervisors awareness surfaces."],
  ["BH.SUPERVISOR.PID.FALCON.PROXY.SHANNON.GATE", "Gates proxy spawn evidence through BEHCS/Shannon-style proof and return checks."],
  ["BH.SUPERVISOR.PID.FALCON.PROXY.GC.WHITEROOM", "Keeps proxy artifacts append-only, bounded, and white-room auditable."],
  ["BH.SUPERVISOR.PID.FALCON.PROXY.RECOVERY", "Restarts the route by launcher when Acer is online and the daemon is absent."]
]);

const paths = Object.freeze({
  supervisorSet: path.join(repoRoot, "data", "behcs", "supervisors", "falcon", "falcon-proxy-instant-pid-supervisors.v1.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "falcon-proxy-supervisor-pid-mint.v1.json"),
  index: path.join(repoRoot, "data", "behcs", "index", "falcon-proxy-supervisor-pid-mint-index.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "falcon-proxy-supervisor-pid-mint-map-map-mapped.v1.json"),
  cube: path.join(repoRoot, "data", "behcs", "cubes", "falcon-proxy-supervisor-pid-mint-cube-cubed.cube.js"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "falcon-proxy-supervisor-pid-mint-behcs256.glpj.json"),
  chain: path.join(repoRoot, "data", "behcs", "chains", "falcon-proxy-supervisor-pid-mint-chain.ndjson"),
  reportJson: path.join(repoRoot, "reports", "falcon-proxy-supervisor-pid-mint-latest.json"),
  reportMd: path.join(repoRoot, "reports", "falcon-proxy-supervisor-pid-mint-latest.md"),
  postResult: path.join(runRoot, "falcon-proxy-supervisor-pid-mint-post-result.v1.json")
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

function appendNdjson(filePath, row) {
  ensureDir(filePath);
  fs.appendFileSync(filePath, `${JSON.stringify(row)}\n`, "utf8");
}

function repoRel(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/");
}

function sha(value) {
  return crypto.createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex");
}

function httpJson(method, url, body, timeoutMs = 5000) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const payload = Buffer.from(JSON.stringify(body), "utf8");
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path: `${parsed.pathname}${parsed.search}`,
      method,
      timeout: timeoutMs,
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
        let bodyOut = text;
        try {
          bodyOut = JSON.parse(text);
        } catch {}
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode, body: bodyOut });
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
  fs.mkdirSync(runRoot, { recursive: true });

  const supervisorRecords = supervisors.map(([pid, role], index) => ({
    pid,
    instantPid: true,
    seq: index + 1,
    role,
    domain: "falcon-opencode-proxy-daemon",
    authority: "FALCON_PID_OWNED_ACER_PROXY_ROUTE",
    routeGlyph: "LX-ROUTE-SPAWN",
    status: "MINTED_NATIVE_PID",
    gates: [
      "LAW-001",
      "PID_OWNER",
      "NO_NATIVE_ANDROID_OPENCODE_CLAIM",
      "NO_SECRET_COPY",
      "NO_UNCONTROLLED_FANOUT"
    ]
  }));

  const supervisorSet = {
    supervisorSet: "falcon-proxy-instant-pid-supervisors.v1",
    eventId,
    mintedAt: generatedAt,
    status: "FALCON_PROXY_INSTANT_PID_SUPERVISORS_MINTED",
    d11: "PROVEN_LOCAL_NATIVE_PID_MINT",
    daemon: {
      state: "data/behcs/orchestration/falcon-opencode-proxy-daemon-20260427/falcon-opencode-proxy-daemon-state.json",
      launcher: "Start-Falcon-OpenCode-Proxy.cmd",
      queue: "data/behcs/orchestration/falcon-opencode-proxy-daemon-20260427/falcon-opencode-proxy-requests.ndjson"
    },
    supervisors: supervisorRecords,
    boundary: "Supervisor mint only; daemon stays bounded; no new live model calls; no phone mutation; no secret copying."
  };

  writeJson(paths.supervisorSet, supervisorSet);

  const supervisorSha = sha(JSON.stringify(supervisorSet));
  const artifacts = {
    supervisorSet: repoRel(paths.supervisorSet),
    memory: repoRel(paths.memory),
    index: repoRel(paths.index),
    map: repoRel(paths.map),
    cube: repoRel(paths.cube),
    glpj: repoRel(paths.glpj),
    chain: repoRel(paths.chain),
    report: repoRel(paths.reportMd)
  };

  writeJson(paths.memory, {
    type: "memory",
    eventId,
    status: supervisorSet.status,
    significance: "The Falcon backend proxy route now has a full native supervisor PID fleet. Falcon can own backend spawn requests while Jesse uses the phone frontend; Acer executes unsupported OpenCode work only as the bounded proxy.",
    supervisorCount: supervisorRecords.length,
    supervisorSha,
    boundary: supervisorSet.boundary
  });
  writeJson(paths.index, {
    eventId,
    runId,
    status: supervisorSet.status,
    keys: [
      "falcon",
      "instant-pid-supervisors",
      "opencode-proxy-daemon",
      "law001",
      "hermes-aware",
      "shannon-gate"
    ],
    supervisorCount: supervisorRecords.length,
    supervisorSha,
    artifacts
  });
  writeJson(paths.map, {
    eventId,
    map: supervisorRecords.map((record) => [record.pid, "supervises", record.domain, record.routeGlyph])
  });
  writeText(paths.cube, `module.exports = ${JSON.stringify({
    eventId,
    cube: "falcon-proxy-supervisor-pid-mint-cube-cubed",
    dimensions: {
      D_DEVICE: "falcon",
      D_ROUTE: "opencode-proxy-daemon",
      D_SUPERVISORS: supervisorRecords.length,
      D_PID: "native-instant",
      D_HERMES: "aware",
      D_SHANNON: "gated",
      D_BOUNDARY: "no-secret-copy-no-native-claim-no-fanout"
    }
  }, null, 2)};\n`);
  writeJson(paths.glpj, {
    eventId,
    sentences: [
      "FALCON PROXY SUPERVISORS MINTED.",
      "INSTANT PIDS NATIVE.",
      "HERMES AWARE.",
      "SHANNON GATED.",
      "FRONTEND FREE.",
      "BACKEND SPAWNABLE."
    ],
    glyphs: [
      "LX-ROUTE-SPAWN",
      "LX-PID-MINT-AGENT",
      "D-LIVE-FREE-AGENT",
      "EVT-LIVE-FREE-AGENT-PID-MINTED"
    ],
    supervisors: supervisorRecords.map((record) => record.pid)
  });

  const chainRow = {
    seq: 1,
    ts: generatedAt,
    eventId,
    status: supervisorSet.status,
    supervisorSha,
    supervisorCount: supervisorRecords.length,
    artifacts,
    row_sha: sha(`${eventId}:${generatedAt}:${supervisorSha}`)
  };
  appendNdjson(paths.chain, chainRow);

  writeJson(paths.reportJson, { supervisorSet, supervisorSha, artifacts, chainRow });
  writeText(paths.reportMd, [
    "# Falcon Proxy Supervisor PID Mint",
    "",
    `Generated: ${generatedAt}`,
    "",
    `Status: ${supervisorSet.status}`,
    `Supervisor count: ${supervisorRecords.length}`,
    `Supervisor SHA: ${supervisorSha}`,
    "",
    "| # | PID | Role |",
    "|---:|---|---|",
    ...supervisorRecords.map((record) => `| ${record.seq} | \`${record.pid}\` | ${record.role} |`),
    "",
    `Boundary: ${supervisorSet.boundary}`,
    ""
  ].join("\n"));

  const envelope = {
    verb: "falcon-proxy-supervisor-pid-minted",
    target: "all-nodes",
    from: "acer-codex",
    id: "falcon-proxy-supervisor-pid-mint-20260427-acer-summary-001",
    ts: generatedAt,
    eventId,
    status: supervisorSet.status,
    d11: supervisorSet.d11,
    supervisorCount: supervisorRecords.length,
    supervisorSha,
    artifacts,
    boundary: supervisorSet.boundary
  };

  const posts = {
    falcon: await httpJson("POST", "http://192.168.1.8:4947/behcs/send", { ...envelope, target: "falcon" }),
    liris: await httpJson("POST", "http://192.168.100.2:4947/behcs/send", { ...envelope, target: "liris" }),
    local: await httpJson("POST", "http://127.0.0.1:4947/behcs/send", { ...envelope, target: "acer" })
  };
  writeJson(paths.postResult, { postedAt: new Date().toISOString(), posts });

  console.log(JSON.stringify({
    ok: true,
    status: supervisorSet.status,
    supervisorCount: supervisorRecords.length,
    supervisorSha,
    posts,
    artifacts: { ...artifacts, postResult: repoRel(paths.postResult) }
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
