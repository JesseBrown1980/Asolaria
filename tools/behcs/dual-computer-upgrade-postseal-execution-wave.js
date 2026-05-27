#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const http = require("http");
const { spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..", "..");
const runId = "dual-computer-upgrade-20260427";
const eventId = "EVT-ACER-LIRIS-DUAL-COMPUTER-UPGRADE-2026-04-27";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", runId);
const waveRoot = path.join(runRoot, "postseal-execution-wave");

const INPUTS = Object.freeze({
  seal: path.join(runRoot, "bilateral-promotion-seal", "dual-computer-upgrade-bilateral-promotion-seal.v1.json"),
  executorReady: path.join(runRoot, "dual-computer-upgrade-executor-ready.v1.ndjson"),
  acerSummary: path.join(runRoot, "acer-promotion-run", "dual-computer-upgrade-acer-promotion-summary.v1.json"),
  lirisReceiptPost: path.join(runRoot, "bilateral-promotion-seal", "dual-computer-upgrade-bilateral-promotion-seal-receipt-post-result.json"),
  supervisorIndex: path.join(repoRoot, "data", "behcs", "pid-fabric", "index", "supervisor-pid-indicator-index-latest.json"),
  systemIndex: path.join(repoRoot, "data", "behcs", "pid-fabric", "index", "system-surface-pid-indicator-index-latest.json"),
  deviceIndex: path.join(repoRoot, "data", "behcs", "pid-fabric", "index", "device-pid-indicator-index-latest.json")
});

const OUTPUTS = Object.freeze({
  summary: path.join(waveRoot, "dual-computer-upgrade-postseal-execution-wave-summary.v1.json"),
  commands: path.join(waveRoot, "acer-bounded-verification-commands.v1.json"),
  laneLedger: path.join(waveRoot, "postseal-lane-ledger.v1.ndjson"),
  lirisEnvelope: path.join(waveRoot, "liris-postseal-mirror-request-envelope.json"),
  lirisPostResult: path.join(waveRoot, "liris-postseal-mirror-request-post-result.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "dual-computer-upgrade-postseal-execution-wave.v1.json"),
  index: path.join(repoRoot, "data", "behcs", "index", "dual-computer-upgrade-postseal-execution-wave-index.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "dual-computer-upgrade-postseal-execution-wave-map-map-mapped.v1.json"),
  cube: path.join(repoRoot, "data", "behcs", "cubes", "dual-computer-upgrade-postseal-execution-wave-cube-cubed.cube.js"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "dual-computer-upgrade-postseal-execution-wave-behcs256.glpj.json"),
  reportJson: path.join(repoRoot, "reports", "dual-computer-upgrade-postseal-execution-wave-latest.json"),
  reportMd: path.join(repoRoot, "reports", "dual-computer-upgrade-postseal-execution-wave-latest.md")
});

const CHECKS = Object.freeze([
  { id: "check-dual-orchestrator", cmd: "node", args: ["--check", "tools/behcs/dual-computer-upgrade-orchestrator.js"] },
  { id: "check-dual-cascade-integrator", cmd: "node", args: ["--check", "tools/behcs/dual-computer-upgrade-cascade-integrator.js"] },
  { id: "check-dual-executor-ready", cmd: "node", args: ["--check", "tools/behcs/dual-computer-upgrade-executor-ready.js"] },
  { id: "check-dual-acer-promotion", cmd: "node", args: ["--check", "tools/behcs/dual-computer-upgrade-acer-promotion-run.js"] },
  { id: "check-dual-liris-ingest", cmd: "node", args: ["--check", "tools/behcs/dual-computer-upgrade-liris-promotion-ingest.js"] },
  { id: "check-postseal-wave", cmd: "node", args: ["--check", "tools/behcs/dual-computer-upgrade-postseal-execution-wave.js"] }
]);

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

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_error) {
    return fallback;
  }
}

function readNdjson(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, "utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse);
}

function repoRel(filePath) {
  const relative = path.relative(repoRoot, filePath);
  if (path.isAbsolute(relative) || relative.startsWith("..")) return filePath.replace(/\\/g, "/");
  return relative.replace(/\\/g, "/");
}

function sha(value) {
  return crypto.createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex");
}

function runCommand(check) {
  const startedAt = new Date().toISOString();
  const result = spawnSync(check.cmd, check.args, {
    cwd: repoRoot,
    encoding: "utf8",
    timeout: 20000,
    windowsHide: true
  });
  return {
    id: check.id,
    command: [check.cmd, ...check.args].join(" "),
    startedAt,
    finishedAt: new Date().toISOString(),
    ok: result.status === 0,
    exitCode: result.status,
    stdout: (result.stdout || "").slice(0, 4000),
    stderr: (result.stderr || "").slice(0, 4000)
  };
}

function gitStatusSnapshot() {
  const result = spawnSync("git", ["status", "--short", "--untracked-files=all"], {
    cwd: repoRoot,
    encoding: "utf8",
    timeout: 20000,
    windowsHide: true
  });
  const lines = `${result.stdout || ""}${result.stderr || ""}`.split(/\r?\n/).filter(Boolean);
  const counts = { modified: 0, untracked: 0, deleted: 0, renamed: 0, other: 0 };
  for (const line of lines) {
    if (line.startsWith("??")) counts.untracked += 1;
    else if (line.includes("D")) counts.deleted += 1;
    else if (line.includes("R")) counts.renamed += 1;
    else if (line.includes("M")) counts.modified += 1;
    else counts.other += 1;
  }
  return {
    ok: result.status === 0,
    exitCode: result.status,
    total: lines.length,
    counts,
    sample: lines.slice(0, 80)
  };
}

function healthProbe(url, timeoutMs = 4000) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path: `${parsed.pathname}${parsed.search}`,
      method: "GET",
      headers: { connection: "close" },
      timeout: timeoutMs
    }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        let body = text;
        try {
          body = JSON.parse(text);
        } catch (_error) {
          // Keep raw text.
        }
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode, body });
      });
    });
    req.on("timeout", () => req.destroy(new Error("request_timeout")));
    req.on("error", (error) => resolve({ ok: false, error: error.message }));
    req.end();
  });
}

function httpJson(method, url, body = null) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const payload = body ? Buffer.from(JSON.stringify(body), "utf8") : null;
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path: `${parsed.pathname}${parsed.search}`,
      method,
      headers: payload ? {
        "content-type": "application/json",
        "content-length": payload.length,
        connection: "close"
      } : { connection: "close" },
      timeout: 10000
    }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        let responseBody = text;
        try {
          responseBody = JSON.parse(text);
        } catch (_error) {
          // Keep raw text.
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

function surfaceCounts(index) {
  const records = index?.records || [];
  const byKind = {};
  for (const row of records) {
    byKind[row.pidKind || row.kind || "unknown"] = (byKind[row.pidKind || row.kind || "unknown"] || 0) + 1;
  }
  return { total: records.length, byKind };
}

async function run() {
  const generatedAt = new Date().toISOString();
  const seal = readJson(INPUTS.seal);
  const executorRows = readNdjson(INPUTS.executorReady);
  const acerSummary = readJson(INPUTS.acerSummary);
  const lirisReceiptPost = readJson(INPUTS.lirisReceiptPost, {});
  const supervisorIndex = readJson(INPUTS.supervisorIndex, { records: [] });
  const systemIndex = readJson(INPUTS.systemIndex, { records: [] });
  const deviceIndex = readJson(INPUTS.deviceIndex, { records: [] });
  if (!seal || seal.status !== "DUAL_COMPUTER_UPGRADE_BILATERAL_LOCAL_PROMOTION_SEALED") {
    throw new Error("Post-seal wave requires bilateral promotion seal");
  }

  const commands = CHECKS.map(runCommand);
  const git = gitStatusSnapshot();
  const localHealth = await healthProbe("http://127.0.0.1:4781/api/health/fast", 3000);
  const acerBusHealth = await healthProbe("http://127.0.0.1:4947/behcs/health", 3000);
  const lirisBusHealth = await healthProbe("http://192.168.100.2:4947/behcs/health", 5000);

  const laneLedgerRows = executorRows.map((row) => ({
    kind: "dual_computer_upgrade_postseal_lane",
    ts: generatedAt,
    runId,
    eventId,
    readyPid: row.readyPid,
    computer: row.computer,
    lane: row.lane,
    supervisorPid: row.supervisorPid,
    sealSha256: seal.sealSha256,
    postSealAction: row.computer === "acer" ? "acer_verified_by_postseal_wave" : "liris_mirror_requested_over_law001",
    mutationAllowed: false,
    remoteWriteAllowed: false,
    liveModelCalls: 0,
    agentProcessFanout: 0
  }));
  writeText(OUTPUTS.laneLedger, laneLedgerRows.map((row) => JSON.stringify(row)).join("\n"));

  const commandSummary = {
    id: "acer-bounded-verification-commands.v1",
    generatedAt,
    commandCount: commands.length,
    okCount: commands.filter((row) => row.ok).length,
    failCount: commands.filter((row) => !row.ok).length,
    commands
  };
  writeJson(OUTPUTS.commands, commandSummary);

  const status = commandSummary.failCount === 0 && lirisReceiptPost.ok && lirisBusHealth.ok
    ? "DUAL_COMPUTER_UPGRADE_POSTSEAL_EXECUTION_WAVE_READY"
    : "DUAL_COMPUTER_UPGRADE_POSTSEAL_EXECUTION_WAVE_HOLD";
  const summary = {
    id: "dual-computer-upgrade-postseal-execution-wave-summary.v1",
    generatedAt,
    runId,
    eventId,
    status,
    sealSha256: seal.sealSha256,
    d11: seal.d11,
    promotedLanes: seal.totals.promotedLanes,
    logicalRunsRepresented: seal.totals.logicalRunsRepresented,
    localArtifactsProduced: seal.totals.localArtifactsProduced,
    boundedVerificationCommands: commandSummary.commandCount,
    boundedVerificationPasses: commandSummary.okCount,
    boundedVerificationFailures: commandSummary.failCount,
    health: {
      asolaria4781: localHealth,
      acerLaw001: acerBusHealth,
      lirisLaw001: lirisBusHealth
    },
    gitStatus: git,
    surfaceCounts: {
      supervisors: surfaceCounts(supervisorIndex),
      system: surfaceCounts(systemIndex),
      devices: surfaceCounts(deviceIndex)
    },
    modelPolicy: {
      liveModelCalls: 0,
      agentProcessFanout: 0,
      openCodeFreeModels: "held_for_evidence_and_small_tranche_smoke",
      authBypass: false
    },
    lirisMirrorRequired: true,
    remoteWritesPerformed: 0,
    boundary: "Post-seal execution wave is bounded verification and peer handoff. It does not clean files, run external models, or mutate Liris."
  };
  writeJson(OUTPUTS.summary, summary);

  writeJson(OUTPUTS.memory, {
    type: "behcs-memory",
    id: "memory-dual-computer-upgrade-postseal-execution-wave-v1",
    generatedAt,
    runId,
    eventId,
    status,
    summary: "Post-seal wave verified Acer dual-upgrade scripts, sampled health and PID surfaces, and asked Liris to mirror the post-seal verification lane.",
    source: repoRel(OUTPUTS.summary)
  });
  writeJson(OUTPUTS.index, {
    id: "dual-computer-upgrade-postseal-execution-wave-index-v1",
    generatedAt,
    keys: ["dual-computer-upgrade", "postseal", "bounded-verification", "liris-mirror", "no-fanout"],
    artifacts: {
      summary: repoRel(OUTPUTS.summary),
      commands: repoRel(OUTPUTS.commands),
      laneLedger: repoRel(OUTPUTS.laneLedger),
      report: repoRel(OUTPUTS.reportMd),
      map: repoRel(OUTPUTS.map),
      cube: repoRel(OUTPUTS.cube),
      glpj: repoRel(OUTPUTS.glpj)
    }
  });
  writeJson(OUTPUTS.map, {
    id: "dual-computer-upgrade-postseal-execution-wave-map-map-mapped-v1",
    generatedAt,
    route: ["bilateral-promotion-seal", "bounded-acer-verification", "liris-postseal-mirror-request", "hold-live-models-until-evidence"],
    laneLedger: repoRel(OUTPUTS.laneLedger),
    commandSummary: repoRel(OUTPUTS.commands),
    sealSha256: seal.sealSha256
  });
  const cubeObject = {
    id: "dual-computer-upgrade-postseal-execution-wave-cube-cubed-v1",
    generatedAt,
    runId,
    eventId,
    status,
    sealSha256: seal.sealSha256,
    boundedVerificationCommands: commandSummary.commandCount,
    boundedVerificationPasses: commandSummary.okCount,
    lirisMirrorRequired: true,
    liveModelCalls: 0,
    agentProcessFanout: 0
  };
  writeText(OUTPUTS.cube, `const dualComputerUpgradePostsealExecutionWaveCube = Object.freeze(${JSON.stringify(cubeObject, null, 2)});

export const CUBE = dualComputerUpgradePostsealExecutionWaveCube;
export default dualComputerUpgradePostsealExecutionWaveCube;
`);
  writeJson(OUTPUTS.glpj, {
    id: "dual-computer-upgrade-postseal-execution-wave-behcs256-glpj-v1",
    generatedAt,
    sentences: [
      "META-WAVE { DUAL-COMPUTER-UPGRADE.POSTSEAL } · BOUNDED-VERIFICATION · ACER-CHECKS · LIRIS-MIRROR-REQUEST @ M-INDICATIVE .",
      "META-GATE { OPEN-CODE-FREE-MODELS } · EVIDENCE-FIRST · SMALL-TRANCHE-SMOKE-REQUIRED · LIVE-MODELS-0 @ M-IMPERATIVE ."
    ]
  });

  const lirisEnvelope = {
    verb: "dual-computer-upgrade-postseal-mirror-request",
    target: "liris",
    from: "acer-codex",
    id: "dual-computer-upgrade-2026-04-27-acer-postseal-mirror-request-001",
    ts: generatedAt,
    runId,
    eventId,
    status,
    responding_to: "dual-computer-upgrade-2026-04-27-liris-local-promotion-summary-001",
    sealSha256: seal.sealSha256,
    request: "Mirror the post-seal bounded verification lane on Liris locally and return dual-computer-upgrade-liris-postseal-mirror-complete. No remote writes from Acer.",
    acerVerification: {
      commandCount: commandSummary.commandCount,
      okCount: commandSummary.okCount,
      failCount: commandSummary.failCount
    },
    artifacts: {
      summary: repoRel(OUTPUTS.summary),
      laneLedger: repoRel(OUTPUTS.laneLedger),
      report: repoRel(OUTPUTS.reportMd)
    },
    glyph_sentence: "META-REQUEST { DUAL-COMPUTER-UPGRADE.POSTSEAL.LIRIS-MIRROR } · BOUNDED-VERIFY · NO-REMOTE-WRITE · LIVE-MODELS-0 @ M-INTERROGATIVE .",
    boundary: summary.boundary
  };
  writeJson(OUTPUTS.lirisEnvelope, lirisEnvelope);
  const lirisPostResult = await httpJson("POST", "http://192.168.100.2:4947/behcs/send", lirisEnvelope);
  writeJson(OUTPUTS.lirisPostResult, { postedAt: new Date().toISOString(), endpoint: "http://192.168.100.2:4947/behcs/send", ...lirisPostResult });

  const report = { reportId: "dual-computer-upgrade-postseal-execution-wave-latest", generatedAt, summary, lirisPostResult };
  writeJson(OUTPUTS.reportJson, report);
  writeText(OUTPUTS.reportMd, `# Dual Computer Upgrade Post-Seal Execution Wave

Generated: ${generatedAt}

Status: ${status}

Seal:
- sha256: ${seal.sealSha256}
- D11: ${seal.d11}
- promoted lanes: ${seal.totals.promotedLanes}
- logical runs represented: ${seal.totals.logicalRunsRepresented}

Bounded Acer verification:
- commands: ${commandSummary.commandCount}
- passed: ${commandSummary.okCount}
- failed: ${commandSummary.failCount}
- git status rows: ${git.total}
- Asolaria health ok: ${localHealth.ok}
- Acer LAW-001 ok: ${acerBusHealth.ok}
- Liris LAW-001 ok: ${lirisBusHealth.ok}

Liris mirror request posted: ${lirisPostResult.ok}

Boundary: ${summary.boundary}
`);

  console.log(JSON.stringify({
    ok: true,
    status,
    sealSha256: seal.sealSha256,
    boundedVerificationPasses: commandSummary.okCount,
    boundedVerificationFailures: commandSummary.failCount,
    lirisMirrorPosted: lirisPostResult.ok,
    report: repoRel(OUTPUTS.reportMd)
  }, null, 2));
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
