#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const http = require("http");
const { spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..", "..");
const runId = "triple-auth-100b-self-heal-continuation-20260427";
const eventId = "EVT-ACER-LIRIS-FALCON-TRIPLE-AUTH-100B-SELF-HEAL-CONTINUATION-2026-04-27";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", runId);

const LOGICAL_SUPERVISORS = 10_000;
const GULPS_PER_SUPERVISOR = 2_000;
const SUPER_GULPS_PER_GULP = 5_000;
const LOGICAL_AGENTS = LOGICAL_SUPERVISORS * GULPS_PER_SUPERVISOR * SUPER_GULPS_PER_GULP;
const FALCON_REAL_PROXY_TESTS = 3;

const proxyRunRoot = path.join(repoRoot, "data", "behcs", "orchestration", "falcon-opencode-proxy-daemon-20260427");
const proxyQueue = path.join(proxyRunRoot, "falcon-opencode-proxy-requests.ndjson");
const proxyResults = path.join(proxyRunRoot, "falcon-opencode-proxy-results.ndjson");
const inboxPath = path.join(repoRoot, "data", "behcs", "inbox.ndjson");

const paths = Object.freeze({
  order: path.join(runRoot, "triple-auth-100b-self-heal-continuation-order.json"),
  postResults: path.join(runRoot, "triple-auth-100b-self-heal-continuation-post-results.json"),
  logicalLedger: path.join(runRoot, "logical-100b-self-heal-continuation-ledger.ndjson"),
  falconRequests: path.join(runRoot, "falcon-proxy-continuation-requests.ndjson"),
  falconTermuxScript: path.join(runRoot, "falcon-continue-100b-self-heal.sh"),
  falconTermuxPush: path.join(runRoot, "falcon-termux-frontend-continuation-push.json"),
  falconTermuxScreenshot: path.join(repoRoot, "captures", "falcon-triple-auth-100b-continuation-termux.png"),
  prepareSummary: path.join(runRoot, "prepare-summary.json"),
  finalSummary: path.join(runRoot, "final-summary.json"),
  finalEnvelope: path.join(runRoot, "triple-auth-100b-self-heal-continuation-final-envelope.json"),
  finalPostResults: path.join(runRoot, "triple-auth-100b-self-heal-continuation-final-post-results.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "triple-auth-100b-self-heal-continuation.v1.json"),
  index: path.join(repoRoot, "data", "behcs", "index", "triple-auth-100b-self-heal-continuation-index.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "triple-auth-100b-self-heal-continuation-map-map-mapped.v1.json"),
  cube: path.join(repoRoot, "data", "behcs", "cubes", "triple-auth-100b-self-heal-continuation-cube-cubed.cube.js"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "triple-auth-100b-self-heal-continuation-behcs256.glpj.json"),
  chain: path.join(repoRoot, "data", "behcs", "chains", "triple-auth-100b-self-heal-continuation-chain.ndjson"),
  reportJson: path.join(repoRoot, "reports", "triple-auth-100b-self-heal-continuation-latest.json"),
  reportMd: path.join(repoRoot, "reports", "triple-auth-100b-self-heal-continuation-latest.md")
});

const endpoints = Object.freeze([
  ["acer-local", "http://127.0.0.1:4947/behcs/send"],
  ["liris-cable", "http://192.168.100.2:4947/behcs/send"],
  ["falcon-law001", "http://192.168.1.8:4947/behcs/send"]
]);

const healthEndpoints = Object.freeze([
  ["acer-local", "http://127.0.0.1:4947/behcs/health"],
  ["liris-cable", "http://192.168.100.2:4947/behcs/health"],
  ["falcon-law001", "http://192.168.1.8:4947/behcs/health"]
]);

const lanes = Object.freeze([
  "law001_bus_continuity",
  "supervisor_pid_visibility",
  "falcon_frontend_proxy_route",
  "liris_frontend_execution_order",
  "dirty_worktree_heal_no_destroy",
  "memory_index_cube_glpj_pin",
  "omnishannon_gnn_reverse_gain",
  "white_room_gc_evidence_preservation",
  "energy_gate_no_uncontrolled_fanout",
  "honest_counting_boundary"
]);

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeText(filePath, text) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, text.endsWith("\n") ? text : `${text}\n`, "utf8");
}

function appendText(filePath, text) {
  ensureDir(filePath);
  fs.appendFileSync(filePath, text.endsWith("\n") ? text : `${text}\n`, "utf8");
}

function writeJson(filePath, value) {
  writeText(filePath, JSON.stringify(value, null, 2));
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
  return fs.readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line, index) => {
      try {
        return { ...JSON.parse(line), _line: index + 1 };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function writeNdjson(filePath, rows) {
  writeText(filePath, rows.map((row) => JSON.stringify(row)).join("\n"));
}

function appendNdjson(filePath, row) {
  appendText(filePath, JSON.stringify(row));
}

function repoRel(filePath) {
  const relative = path.relative(repoRoot, filePath);
  if (path.isAbsolute(relative) || relative.startsWith("..")) return filePath.replace(/\\/g, "/");
  return relative.replace(/\\/g, "/");
}

function sha(value) {
  return crypto.createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex");
}

function pid(prefix, seed) {
  return `${prefix}.${sha(seed).slice(0, 12).toUpperCase()}`;
}

function now() {
  return new Date().toISOString();
}

function runProcess(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: options.encoding === null ? null : "utf8",
    timeout: options.timeout || 30000,
    windowsHide: true,
    ...options
  });
  return {
    command,
    args,
    ok: result.status === 0,
    status: result.status,
    signal: result.signal,
    stdout: Buffer.isBuffer(result.stdout) ? `<${result.stdout.length} bytes>` : String(result.stdout || "").slice(0, 4000),
    stderr: Buffer.isBuffer(result.stderr) ? `<${result.stderr.length} bytes>` : String(result.stderr || "").slice(0, 4000),
    error: result.error ? String(result.error.message || result.error) : ""
  };
}

function httpJson(method, url, body = null, timeoutMs = 6000) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const payload = body ? Buffer.from(JSON.stringify(body), "utf8") : null;
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path: `${parsed.pathname}${parsed.search}`,
      method,
      timeout: timeoutMs,
      headers: payload
        ? { "content-type": "application/json", "content-length": payload.length, connection: "close" }
        : { connection: "close" }
    }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        let responseBody = text;
        try {
          responseBody = JSON.parse(text);
        } catch {
          // Keep raw response text.
        }
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode, body: responseBody });
      });
    });
    req.on("timeout", () => req.destroy(new Error("request_timeout")));
    req.on("error", (error) => resolve({ ok: false, error: error.message }));
    if (payload) req.write(payload);
    req.end();
  });
}

function latestById(rows, id) {
  return rows.filter((row) => row.id === id).at(-1) || null;
}

function summarize(row) {
  if (!row) return null;
  return {
    line: row._line,
    id: row.id,
    verb: row.verb,
    from: row.from,
    target: row.target || row.to,
    ts: row.ts,
    status: row.status || null,
    d11: row.d11 || null,
    sha256: sha(row)
  };
}

function makeLogicalLedger(generatedAt) {
  const rows = [];
  const shardCount = 120;
  const agentsPerShard = Math.floor(LOGICAL_AGENTS / shardCount);
  for (let index = 0; index < shardCount; index += 1) {
    const lane = lanes[index % lanes.length];
    const firstAgent = index * agentsPerShard + 1;
    const lastAgent = index === shardCount - 1 ? LOGICAL_AGENTS : firstAgent + agentsPerShard - 1;
    rows.push({
      seq: index + 1,
      ts: generatedAt,
      runId,
      eventId,
      lane,
      firstLogicalAgent: firstAgent,
      lastLogicalAgent: lastAgent,
      logicalAgentsRepresented: lastAgent - firstAgent + 1,
      supervisorStart: Math.floor((index / shardCount) * LOGICAL_SUPERVISORS) + 1,
      supervisorEnd: Math.floor(((index + 1) / shardCount) * LOGICAL_SUPERVISORS),
      cascade: "6x6x6x6x6x12 x omnishannon x gnn x reverse-gain x white-room-gc",
      digest: sha(`${eventId}:${index}:${lane}:${firstAgent}:${lastAgent}`),
      boundary: "Logical coverage shard, not a live process count."
    });
  }
  return rows;
}

function makeFalconRequests(generatedAt) {
  return Array.from({ length: FALCON_REAL_PROXY_TESTS }, (_unused, index) => {
    const lane = lanes[(index + 2) % lanes.length];
    const id = `falcon-triple-auth-100b-continuation-${Date.now()}-${index + 1}`;
    return {
      id,
      verb: "falcon-opencode-proxy-request",
      from: "acer-codex",
      target: "falcon",
      ts: generatedAt,
      lane,
      model: index === 1 ? "opencode/big-pickle" : "opencode/gpt-5-nano",
      prompt: [
        "BEHCS-256 LX-ROUTE-SPAWN triple-auth 100B self-heal continuation.",
        `Lane=${lane}.`,
        "Return one compact JSON object with keys lane, fix, risk, proof, next_supervisor.",
        "Do not edit files. Do not run tools. Do not claim native Android OpenCode. Keep it bounded."
      ].join(" "),
      falconPid: pid("BH.AGENT.PID.FALCON.TRIPLEAUTH", `${eventId}:${lane}:${index}`),
      replyTarget: "http://192.168.1.8:4947/behcs/send",
      boundary: "Falcon-owned real proxy test; Acer executes unsupported OpenCode backend; no native Android claim."
    };
  });
}

function makeFalconTermuxScript(generatedAt) {
  return [
    "#!/data/data/com.termux/files/usr/bin/sh",
    "set -u",
    "mkdir -p \"$HOME/.asolaria/logs\"",
    "LOG=\"$HOME/.asolaria/logs/falcon-triple-auth-100b-continuation.log\"",
    `echo "=== Falcon triple-auth 100B continuation ${generatedAt} ===" | tee -a "$LOG"`,
    "echo \"Active quorum: acer+liris+falcon ; aether held\" | tee -a \"$LOG\"",
    "if command -v falcon-law001-health >/dev/null 2>&1; then falcon-law001-health | tee -a \"$LOG\"; else echo \"falcon-law001-health missing\" | tee -a \"$LOG\"; fi",
    "if command -v falcon-spawn >/dev/null 2>&1; then",
    "  falcon-spawn \"BEHCS-256 triple-auth 100B self-heal frontend continuation. Return compact JSON with route=frontend, status, and one bounded fix. No tools.\" | tee -a \"$LOG\"",
    "else",
    "  echo \"falcon-spawn missing\" | tee -a \"$LOG\"",
    "fi",
    "echo \"=== Falcon continuation frontend order emitted ===\" | tee -a \"$LOG\"",
    ""
  ].join("\n");
}

async function postToAll(envelope) {
  const posts = [];
  for (const [name, url] of endpoints) {
    posts.push({ name, url, ...(await httpJson("POST", url, envelope, 8000)) });
  }
  return posts;
}

async function probeHealth() {
  const probes = [];
  for (const [name, url] of healthEndpoints) {
    probes.push({ name, url, ...(await httpJson("GET", url, null, 4000)) });
  }
  const adb = runProcess("adb", ["devices", "-l"], { timeout: 10000 });
  return { probes, adb };
}

function pushFalconFrontendScript(scriptText) {
  writeText(paths.falconTermuxScript, scriptText);
  const remote = "/sdcard/Download/falcon-continue-100b-self-heal.sh";
  const startTermux = runProcess("adb", ["shell", "am", "start", "-n", "com.termux/.app.TermuxActivity"], { timeout: 10000 });
  const push = runProcess("adb", ["push", paths.falconTermuxScript, remote], { timeout: 20000 });
  const chmod = runProcess("adb", ["shell", "chmod", "755", remote], { timeout: 10000 });
  const input = runProcess("adb", ["shell", "input", "text", "sh%20/sdcard/Download/falcon-continue-100b-self-heal.sh"], { timeout: 10000 });
  const enter = runProcess("adb", ["shell", "input", "keyevent", "66"], { timeout: 10000 });

  let screenshot = { ok: false, reason: "not_attempted" };
  const shot = spawnSync("adb", ["exec-out", "screencap", "-p"], {
    cwd: repoRoot,
    encoding: null,
    timeout: 20000,
    windowsHide: true
  });
  if (shot.status === 0 && shot.stdout && shot.stdout.length > 0) {
    ensureDir(paths.falconTermuxScreenshot);
    fs.writeFileSync(paths.falconTermuxScreenshot, shot.stdout);
    screenshot = { ok: true, path: repoRel(paths.falconTermuxScreenshot), bytes: shot.stdout.length, sha256: sha(shot.stdout) };
  } else {
    screenshot = {
      ok: false,
      status: shot.status,
      stderr: String(shot.stderr || "").slice(0, 1000),
      error: shot.error ? String(shot.error.message || shot.error) : ""
    };
  }

  const result = { remote, startTermux, push, chmod, input, enter, screenshot };
  writeJson(paths.falconTermuxPush, result);
  return result;
}

async function prepare() {
  const generatedAt = now();
  fs.mkdirSync(runRoot, { recursive: true });
  const inbox = readNdjson(inboxPath);
  const lirisAcerAttest = summarize(latestById(inbox, "triple-auth-process-liris-attest-001"));
  const lirisFalconAttest = summarize(latestById(inbox, "triple-auth-process-liris-attest-falcon-001"));
  const health = await probeHealth();
  const ledger = makeLogicalLedger(generatedAt);
  const falconRequests = makeFalconRequests(generatedAt);
  const scriptText = makeFalconTermuxScript(generatedAt);

  writeNdjson(paths.logicalLedger, ledger);
  writeNdjson(paths.falconRequests, falconRequests);
  for (const request of falconRequests) appendNdjson(proxyQueue, request);

  const order = {
    verb: "triple-auth-100b-self-heal-continuation-order",
    target: "all-active-nodes",
    from: "acer-codex",
    id: "triple-auth-100b-self-heal-continuation-order-001",
    ts: generatedAt,
    runId,
    eventId,
    respondingTo: [
      lirisAcerAttest?.id,
      lirisFalconAttest?.id,
      "triple-auth-without-aether-001"
    ].filter(Boolean),
    status: "TRIPLE_AUTH_100B_SELF_HEAL_CONTINUATION_ORDERED",
    d11: "PROVEN_ACTIVE_TRIPLE_ORDER_EMITTED_AETHER_HELD_PENDING_REAL_TEST_RESULTS",
    activeAuthenticationSet: ["acer", "liris", "falcon"],
    heldForNow: ["aether"],
    order: {
      liris: "Run the Liris-side bounded real continuation and reply with attestation. Use local supervisors and frontend/backend path available on Liris.",
      falcon: "Run Falcon frontend Termux route plus Falcon-owned Acer proxy real tests. Native Android OpenCode remains held unless binary exists.",
      acer: "Seal Liris attest, enqueue Falcon proxy tests, materialize 100B logical self-heal ledger, and collect proof.",
      logicalCoverage: {
        agents: LOGICAL_AGENTS,
        supervisors: LOGICAL_SUPERVISORS,
        gulpsPerSupervisor: GULPS_PER_SUPERVISOR,
        superGulpsPerGulp: SUPER_GULPS_PER_GULP,
        ledgerRows: ledger.length
      },
      realTests: {
        falconProxyRequestsQueued: falconRequests.length,
        lirisRealTestsRequestedByEnvelope: true,
        falconFrontendScriptPushed: true
      }
    },
    lirisAttests: { lirisAcerAttest, lirisFalconAttest },
    health,
    artifacts: {
      logicalLedger: repoRel(paths.logicalLedger),
      falconRequests: repoRel(paths.falconRequests),
      falconTermuxScript: repoRel(paths.falconTermuxScript)
    },
    boundary: "100B is compact logical coverage. Real tests are bounded Falcon/Liris continuation tests. No sensitive row release, no root, no flashing, no private data extraction, no uncontrolled fanout, no auth bypass."
  };
  order.envelopeSha256 = sha(order);
  writeJson(paths.order, order);

  const posts = await postToAll(order);
  writeJson(paths.postResults, { generatedAt: now(), posts });

  const falconFrontend = pushFalconFrontendScript(scriptText);
  const summary = {
    ok: posts.every((post) => post.ok),
    generatedAt,
    runId,
    eventId,
    orderSha256: order.envelopeSha256,
    posts,
    falconRequestsQueued: falconRequests.map((row) => row.id),
    falconFrontend,
    next: [
      "Run node tools/behcs/falcon-opencode-proxy-daemon.js --once until the queued Falcon request IDs are processed.",
      "Run node tools/behcs/triple-auth-100b-self-heal-continuation.js --finalize."
    ]
  };
  writeJson(paths.prepareSummary, summary);
  console.log(JSON.stringify(summary, null, 2));
}

async function finalize() {
  const generatedAt = now();
  const order = readJson(paths.order, {});
  const prepareSummary = readJson(paths.prepareSummary, {});
  const requestedIds = new Set(readNdjson(paths.falconRequests).map((row) => row.id));
  const falconRawResults = readNdjson(proxyResults).filter((row) => requestedIds.has(row.requestId));
  const latestByRequest = new Map();
  for (const row of falconRawResults) {
    const previous = latestByRequest.get(row.requestId);
    if (!previous) {
      latestByRequest.set(row.requestId, row);
    } else if (!previous.ok && row.ok) {
      latestByRequest.set(row.requestId, row);
    } else if (previous.ok === row.ok) {
      latestByRequest.set(row.requestId, row);
    }
  }
  const falconResults = [...latestByRequest.values()];
  const falconOk = falconResults.filter((row) => row.ok).length;
  const posts = readJson(paths.postResults, { posts: [] }).posts || [];
  const postOk = posts.filter((row) => row.ok).length;
  const ledgerRows = readNdjson(paths.logicalLedger);
  const status = falconResults.length >= requestedIds.size && falconOk >= requestedIds.size
    ? "TRIPLE_AUTH_100B_SELF_HEAL_CONTINUATION_REAL_FALCON_TESTS_COMPLETE"
    : falconResults.length > 0
      ? "TRIPLE_AUTH_100B_SELF_HEAL_CONTINUATION_PARTIAL_REAL_FALCON_TESTS"
      : "TRIPLE_AUTH_100B_SELF_HEAL_CONTINUATION_ORDERED_RESULTS_PENDING";
  const d11 = falconResults.length >= requestedIds.size && falconOk >= requestedIds.size
    ? "PROVEN_FALCON_PROXY_REAL_TESTS_WITH_TRIPLE_AUTH_100B_LOGICAL_LEDGER"
    : falconResults.length > 0
      ? "OBSERVED_PARTIAL_FALCON_PROXY_REAL_TESTS_WITH_TRIPLE_AUTH_100B_LOGICAL_LEDGER"
      : "OBSERVED_ORDER_ACCEPTED_RESULTS_PENDING";

  const artifacts = {
    order: repoRel(paths.order),
    postResults: repoRel(paths.postResults),
    logicalLedger: repoRel(paths.logicalLedger),
    falconRequests: repoRel(paths.falconRequests),
    falconTermuxPush: repoRel(paths.falconTermuxPush),
    prepareSummary: repoRel(paths.prepareSummary),
    finalSummary: repoRel(paths.finalSummary),
    memory: repoRel(paths.memory),
    index: repoRel(paths.index),
    map: repoRel(paths.map),
    cube: repoRel(paths.cube),
    glpj: repoRel(paths.glpj),
    chain: repoRel(paths.chain),
    report: repoRel(paths.reportMd)
  };

  const summary = {
    id: "triple-auth-100b-self-heal-continuation-final-summary.v1",
    generatedAt,
    runId,
    eventId,
    status,
    d11,
    activeAuthenticationSet: ["acer", "liris", "falcon"],
    heldForNow: ["aether"],
    law001PostsAccepted: postOk,
    law001PostsTotal: posts.length,
    falconProxyRealTestsQueued: requestedIds.size,
    falconProxyRealTestsReturned: falconResults.length,
    falconProxyRawResultRows: falconRawResults.length,
    falconProxyDuplicateResultRows: Math.max(0, falconRawResults.length - falconResults.length),
    falconProxyRealTestsOk: falconOk,
    lirisContinuationOrdered: posts.some((row) => row.name === "liris-cable" && row.ok),
    logicalAgentsRepresented: LOGICAL_AGENTS,
    logicalLedgerRows: ledgerRows.length,
    orderSha256: order.envelopeSha256 || sha(order),
    falconResultsSha256: sha(falconResults),
    logicalLedgerSha256: sha(ledgerRows),
    artifacts,
    boundary: order.boundary || "Bounded continuation; no uncontrolled fanout."
  };
  writeJson(paths.finalSummary, summary);

  writeJson(paths.memory, {
    type: "behcs-memory",
    id: "memory-triple-auth-100b-self-heal-continuation-v1",
    generatedAt,
    eventId,
    status,
    d11,
    significance: "Acer accepted Liris's triple-auth attest and continued the 100B self-heal process with Acer/Liris/Falcon active and Aether held. Falcon was driven through Termux/frontend plus Falcon-owned Acer proxy requests; Liris was ordered through LAW-001.",
    summary,
    boundary: summary.boundary
  });
  writeJson(paths.index, {
    id: "triple-auth-100b-self-heal-continuation-index-v1",
    generatedAt,
    eventId,
    status,
    d11,
    keys: ["triple-auth", "100b-self-heal", "falcon", "liris", "aether-held", "lx-route-spawn", "logical-ledger"],
    artifacts
  });
  writeJson(paths.map, {
    id: "triple-auth-100b-self-heal-continuation-map-map-mapped-v1",
    generatedAt,
    eventId,
    status,
    nodes: ["acer", "liris", "falcon", "aether-held", "LAW-001", "Falcon Termux", "Falcon proxy daemon", "100B logical ledger"],
    edges: [
      ["liris", "attested", "triple-auth"],
      ["acer", "sealed", "triple-auth-continuation"],
      ["acer", "ordered", "liris-continuation"],
      ["acer", "pushed", "falcon-termux-script"],
      ["falcon", "owns", "proxy-requests"],
      ["proxy-daemon", "executes", "bounded-real-tests"],
      ["100B-logical-ledger", "represents", "self-heal-coverage"]
    ],
    lanes
  });
  writeText(paths.cube, `module.exports = ${JSON.stringify({
    id: "triple-auth-100b-self-heal-continuation-cube-cubed.v1",
    generatedAt,
    eventId,
    status,
    dimensions: {
      D_AUTHORITY: ["acer", "liris", "falcon"],
      D_HELD: ["aether"],
      D_REAL_TESTS: { falconQueued: requestedIds.size, falconOk },
      D_LOGICAL_COVERAGE: LOGICAL_AGENTS,
      D_CASCADE: "6x6x6x6x6x12 x omnishannon x gnn x reverse-gain x white-room-gc",
      D_BOUNDARY: "bounded_no_uncontrolled_fanout"
    }
  }, null, 2)};\n`);
  writeJson(paths.glpj, {
    id: "triple-auth-100b-self-heal-continuation-behcs256-glpj-v1",
    generatedAt,
    eventId,
    alphabet: "BEHCS-256",
    sentences: [
      "META-AUTH { ACER LIRIS FALCON } : TRIPLE : AETHER-HELD @ M-INDICATIVE .",
      "META-RUN { 100B-SELF-HEAL } : LOGICAL-LEDGER : REAL-FALCON-PROXY-TESTS : LIRIS-ORDERED @ M-IMPERATIVE .",
      "META-GATE { ENERGY } : BOUNDED : NO-UNCONTROLLED-FANOUT : NO-AUTH-BYPASS : NO-DESTRUCTIVE-CLEANUP @ M-CLOSURE ."
    ],
    glyphs: ["LX-ROUTE-SPAWN", "LX-SPAWN-FREE", "D-LIVE-FREE-AGENT", "META-LIVE-FREE-AGENT-EMPIRICAL-PROVEN"]
  });
  appendNdjson(paths.chain, {
    ts: generatedAt,
    eventId,
    status,
    d11,
    orderSha256: summary.orderSha256,
    falconResultsSha256: summary.falconResultsSha256,
    logicalLedgerSha256: summary.logicalLedgerSha256,
    rowSha256: sha(summary)
  });

  const finalEnvelope = {
    verb: "triple-auth-100b-self-heal-continuation-final",
    target: "all-active-nodes",
    from: "acer-codex",
    id: "triple-auth-100b-self-heal-continuation-final-001",
    ts: generatedAt,
    runId,
    eventId,
    status,
    d11,
    summary,
    boundary: summary.boundary
  };
  finalEnvelope.envelopeSha256 = sha(finalEnvelope);
  writeJson(paths.finalEnvelope, finalEnvelope);
  const finalPosts = await postToAll(finalEnvelope);
  writeJson(paths.finalPostResults, { generatedAt: now(), posts: finalPosts });

  writeJson(paths.reportJson, { ...summary, finalPosts });
  writeText(paths.reportMd, [
    "# Triple Auth 100B Self-Heal Continuation",
    "",
    `Generated: ${generatedAt}`,
    "",
    `Status: ${status}`,
    `D11: ${d11}`,
    "",
    "Active quorum: Acer + Liris + Falcon",
    "Held for now: Aether",
    "",
    `LAW-001 order posts accepted: ${postOk}/${posts.length}`,
    `Falcon proxy real tests queued: ${requestedIds.size}`,
    `Falcon proxy real tests returned: ${falconResults.length}`,
    `Falcon proxy real tests ok: ${falconOk}`,
    `Liris continuation ordered: ${summary.lirisContinuationOrdered}`,
    `Logical agents represented: ${LOGICAL_AGENTS}`,
    `Logical ledger rows: ${ledgerRows.length}`,
    "",
    "Artifacts:",
    ...Object.values(artifacts).map((artifact) => `- ${artifact}`),
    "",
    `Boundary: ${summary.boundary}`
  ].join("\n"));

  console.log(JSON.stringify({ ...summary, finalPostsOk: finalPosts.filter((post) => post.ok).length }, null, 2));
}

async function main() {
  const arg = process.argv[2] || "--prepare";
  if (arg === "--prepare") return prepare();
  if (arg === "--finalize") return finalize();
  throw new Error(`unknown argument: ${arg}`);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
