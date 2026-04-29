#!/usr/bin/env node
"use strict";

const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const path = require("path");
const readline = require("readline");
const { runSupervisorQueue } = require("../../src/omnispindleSupervisorRunner");

const repoRoot = path.resolve(__dirname, "..", "..");
const sourceReceiptId = "behcs-16c375c86ed9";
const waveRootRel = "data/behcs/orchestration/wave33a-agent-terminal-load-control-20260428";
const mintRootRel = `${waveRootRel}/omnispindle-parallel-20260428`;
const lirisLaw001 = process.env.LIRIS_LAW001_URL || "http://192.168.100.2:4947/behcs/send";

const expectedAcerPackets = Object.freeze([
  "33a4-compression-wake-identity-assertion",
  "33a2-self-update-guard",
  "aether-law001-reactivation",
  "33a1-reciprocal-mint-script"
]);

const laneLabels = Object.freeze({
  "33a4-compression-wake-identity-assertion": {
    lane: "helm",
    title: "Wave33A-4 compression-wake identity assertion plan",
    objective: "Prepare the compression-wake identity assertion planning artifact from the sealed active-session marker and boot manifest evidence.",
    planPath: `${mintRootRel}/plans/33a4-compression-wake-identity-assertion.plan.json`,
    reportPath: "reports/wave33a-4-compression-wake-identity-assertion-plan-latest.md"
  },
  "33a2-self-update-guard": {
    lane: "rook",
    title: "Wave33A-2 self-update guard plan",
    objective: "Prepare the self-update guard planning artifact for later supervisor-authored hook integration without wiring live hooks.",
    planPath: `${mintRootRel}/plans/33a2-self-update-guard.plan.json`,
    reportPath: "reports/wave33a-2-self-update-guard-plan-latest.md"
  },
  "aether-law001-reactivation": {
    lane: "sentinel",
    title: "Wave35 Aether LAW001 reactivation plan",
    objective: "Prepare the Aether LAW001 reactivation planning artifact from the read-class state hash without touching the attached phone.",
    planPath: `${mintRootRel}/plans/aether-law001-reactivation.plan.json`,
    reportPath: "reports/aether-law001-reactivation-plan-latest.md"
  },
  "33a1-reciprocal-mint-script": {
    lane: "falcon",
    title: "Wave33A-1 reciprocal mint script plan",
    objective: "Prepare the boot-manifest reciprocal mint-script planning artifact from the sealed ACER boot manifest evidence.",
    planPath: `${mintRootRel}/plans/33a1-reciprocal-mint-script.plan.json`,
    reportPath: "reports/wave33a-1-reciprocal-mint-script-plan-latest.md"
  }
});

const scopedPaths = Object.freeze({
  inbox: "data/behcs/inbox.ndjson",
  d0: "data/behcs/d0-runtime/sidecar-d0-events.ndjson",
  queue: `${mintRootRel}/supervisor-queue.ndjson`,
  decisions: `${mintRootRel}/supervisor-decisions-latest.ndjson`,
  workerReady: `${mintRootRel}/supervisor-worker-ready-latest.ndjson`,
  map: `${mintRootRel}/supervisor-runner-map-latest.json`,
  state: `${mintRootRel}/supervisor-runner.state.json`,
  hermes: `${mintRootRel}/supervisor-runner-dispatch-latest.json`,
  shannon: `${mintRootRel}/supervisor-runner-consensus-latest.json`,
  cube: `${mintRootRel}/omnispindle-parallel-supervisor-runner.cube.js`,
  reportJson: "reports/wave33a-omnispindle-parallel-supervisor-runner-latest.json",
  reportMd: "reports/wave33a-omnispindle-parallel-supervisor-runner-latest.md",
  mintState: `${mintRootRel}/wave33a-omnispindle-parallel-packet-mint-acer.v1.json`,
  mintReportJson: "reports/wave33a-omnispindle-parallel-packet-mint-latest.json",
  mintReportMd: "reports/wave33a-omnispindle-parallel-packet-mint-latest.md",
  postResult: `${mintRootRel}/law001-wave33a-omnispindle-parallel-packet-mint-post-result.json`
});

const dangerousFlags = Object.freeze([
  "remoteMutation",
  "externalApiCall",
  "cloudUpload",
  "deviceAccess",
  "liveEeg",
  "liveHumanData",
  "downloads",
  "installs",
  "writesGit",
  "deletesEvidence",
  "sensitiveData",
  "secretMaterial",
  "bypassAuth",
  "bypassPayment",
  "needsCloudWorker"
]);

const forbiddenWorkerPathPatterns = Object.freeze([
  /\.claude/i,
  /\.codex/i,
  /(^|[\\/])CLAUDE\.md$/i,
  /(^|[\\/])CODEX\.md$/i,
  /(^|[\\/])AGENTS\.md$/i,
  /\/sdcard/i,
  /\\\\/,
  /192\.168\./,
  /\bliris\b/i,
  /\bfalcon\b/i,
  /\btermux\b/i
]);

function relPath(filePath) {
  return String(filePath || "").replace(/\\/g, "/");
}

function abs(rel) {
  return path.join(repoRoot, rel);
}

function ensureParent(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeText(filePath, text) {
  ensureParent(filePath);
  fs.writeFileSync(filePath, String(text).endsWith("\n") ? String(text) : `${text}\n`, "utf8");
}

function writeJson(filePath, value) {
  writeText(filePath, JSON.stringify(value, null, 2));
}

function writeNdjson(filePath, rows) {
  writeText(filePath, rows.map((row) => JSON.stringify(row)).join("\n"));
}

function sortDeep(value) {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortDeep(value[key])]));
  }
  return value;
}

function stableJson(value) {
  return JSON.stringify(sortDeep(value));
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(String(text), "utf8").digest("hex");
}

function sha256Json(value) {
  return sha256Text(stableJson(value));
}

async function findNdjsonLine(filePath, id) {
  if (!fs.existsSync(filePath)) return null;
  const stream = fs.createReadStream(filePath, { encoding: "utf8" });
  const reader = readline.createInterface({ input: stream, crlfDelay: Infinity });
  let lineNumber = 0;
  let found = null;
  for await (const line of reader) {
    lineNumber += 1;
    if (!line || !line.includes(id)) continue;
    try {
      found = { line: lineNumber, row: JSON.parse(line), sha256: sha256Text(line) };
    } catch (error) {
      found = { line: lineNumber, parseError: String(error && error.message ? error.message : error), sha256: sha256Text(line) };
    }
  }
  return found;
}

function validateSourceEnvelope(envelope) {
  if (!envelope || typeof envelope !== "object") {
    throw new Error("source envelope missing");
  }
  if (envelope.id !== sourceReceiptId) {
    throw new Error(`unexpected source envelope id: ${envelope.id || ""}`);
  }
  if (envelope.schema !== "law001-omnispindle-parallel-coordinator-fire.v1") {
    throw new Error(`unexpected source schema: ${envelope.schema || ""}`);
  }
  if (envelope.gated !== true || !envelope.d0 || envelope.d0.verdict !== "PROCEED" || envelope.d0.gatePass !== true) {
    throw new Error("source envelope is not gated PROCEED");
  }
  const candidates = envelope.body && Array.isArray(envelope.body.packet_candidates_to_mint_via_supervisor_ring)
    ? envelope.body.packet_candidates_to_mint_via_supervisor_ring
    : [];
  const acerIds = candidates.filter((candidate) => candidate.host === "acer").map((candidate) => candidate.id).sort();
  const expected = [...expectedAcerPackets].sort();
  if (JSON.stringify(acerIds) !== JSON.stringify(expected)) {
    throw new Error(`ACER packet candidates mismatch: ${JSON.stringify(acerIds)}`);
  }
  return true;
}

function assertNoForbiddenWorkerPaths(packet) {
  const allPaths = [
    ...(Array.isArray(packet.allowedPaths) ? packet.allowedPaths : []),
    ...(Array.isArray(packet.writePaths) ? packet.writePaths : []),
    ...(Array.isArray(packet.expectedArtifacts) ? packet.expectedArtifacts : [])
  ];
  const forbidden = allPaths.filter((item) => forbiddenWorkerPathPatterns.some((pattern) => pattern.test(relPath(item))));
  if (forbidden.length) {
    throw new Error(`forbidden worker path in packet ${packet.id}: ${forbidden.join(", ")}`);
  }
}

function buildPacketsFromEnvelope(envelope, options = {}) {
  validateSourceEnvelope(envelope);
  const now = options.now || new Date().toISOString();
  const candidates = envelope.body.packet_candidates_to_mint_via_supervisor_ring
    .filter((candidate) => candidate.host === "acer")
    .sort((a, b) => expectedAcerPackets.indexOf(a.id) - expectedAcerPackets.indexOf(b.id));
  const sharedAllowedPaths = [
    ".asolaria-active-session.lock",
    "data/behcs/boot/agent-terminal-boot-manifest.v1.json",
    waveRootRel,
    "data/behcs/orchestration/aether-rejoin-readclass-20260428",
    "src/omnispindleSupervisorRunner.js",
    "tools/behcs/wave33a-omnispindle-parallel-packet-mint.js",
    "tests/wave33a-omnispindle-parallel-packet-mint.unit.test.js",
    "reports"
  ];
  const acceptanceGates = [
    "node --check tools/behcs/wave33a-omnispindle-parallel-packet-mint.js",
    "node --check tests/wave33a-omnispindle-parallel-packet-mint.unit.test.js",
    "node tests/wave33a-omnispindle-parallel-packet-mint.unit.test.js",
    "node tests/omnispindle-supervisor-runner.unit.test.js"
  ];

  return candidates.map((candidate) => {
    const spec = laneLabels[candidate.id];
    if (!spec) throw new Error(`missing lane label for ${candidate.id}`);
    const packet = {
      id: candidate.id,
      title: spec.title,
      objective: spec.objective,
      instructions: [
        "Planning-only supervisor packet.",
        "Produce the named plan and report artifacts only.",
        "Do not wire adapters, hooks, startup files, remote hosts, phone storage, package installs, downloads, or live services.",
        "Executor dispatch remains external to this runner."
      ].join(" "),
      requestedWorker: "local_codex",
      pid: `BH.WAVE33A.OMNISPIN.ACER.${spec.lane.toUpperCase()}`,
      consentScope: `operator_witness_jesse_${sourceReceiptId}_planning_only`,
      allowedPaths: sharedAllowedPaths,
      writePaths: [spec.planPath, spec.reportPath],
      writerAuthority: "shannon",
      expectedArtifacts: [spec.planPath, spec.reportPath],
      acceptanceGates,
      proofRequired: true,
      proofRefs: [
        `LAW001:${sourceReceiptId}`,
        `${scopedPaths.inbox}`,
        `${scopedPaths.d0}`
      ],
      syntheticFirstEvidence: true,
      modelCard: true,
      operatorApproval: true,
      taskType: "planning_only_report_packet",
      source: `LAW001 ${sourceReceiptId} ACER lane ${candidate.lane}`,
      sourceCandidate: {
        id: candidate.id,
        host: candidate.host,
        lane: candidate.lane,
        inputsSha256: sha256Text(candidate.inputs || ""),
        outputsSha256: sha256Text(candidate.outputs || "")
      },
      generatedAt: now,
      boundary: {
        proposalOnlySource: true,
        planningOnly: true,
        runnerDoesNotSpawnWorkers: true,
        noHookWiring: true,
        noAdapterWiring: true,
        noRemoteMutation: true,
        noDeviceMutation: true
      }
    };
    for (const flag of dangerousFlags) {
      packet[flag] = false;
    }
    assertNoForbiddenWorkerPaths(packet);
    return packet;
  });
}

function formatReport(state) {
  return [
    "# Wave33A Omnispindle Parallel Packet Mint",
    "",
    `Generated: ${state.generatedAt}`,
    `Status: ${state.status}`,
    `State hash: ${state.stateHash}`,
    "",
    "## Counts",
    "",
    `- Packets: ${state.counts.total}`,
    `- Allowed: ${state.counts.ALLOW}`,
    `- Needs evidence: ${state.counts.NEEDS_EVIDENCE}`,
    `- Blocked: ${state.counts.BLOCK}`,
    `- Worker-ready: ${state.counts.workerReady}`,
    "",
    "## Boundary",
    "",
    "- The mint consumes the verified LAW-001 proposal and the existing supervisor runner.",
    "- The worker-ready output is planning-only.",
    "- No workers are spawned by this script.",
    "- No hooks, adapters, phone storage, remote hosts, installs, downloads, or live services are mutated.",
    "",
    "## Outputs",
    "",
    ...Object.entries(state.outputs).map(([key, value]) => `- ${key}: \`${value}\``),
    ""
  ].join("\n");
}

async function postLaw001(envelope) {
  return new Promise((resolve) => {
    const data = JSON.stringify(envelope);
    const url = new URL(lirisLaw001);
    const req = http.request({
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data)
      }
    }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, body }));
    });
    req.on("error", (error) => resolve({ ok: false, error: error.message }));
    req.setTimeout(8000, () => {
      req.destroy(new Error("timeout"));
    });
    req.write(data);
    req.end();
  });
}

async function notifyLiris(state) {
  const envelope = {
    schema: "law001-wave33a-omnispindle-parallel-packet-mint-acer.v1",
    id: `acer-wave33a-omnispindle-packet-mint-${Date.now()}`,
    ts: new Date().toISOString(),
    from: "acer",
    to: "liris",
    mode: "real",
    type: "gate-result",
    verb: "LAW001_WAVE33A_OMNISPIN_PARALLEL_PACKET_MINT_ACER",
    sourceReceiptId,
    body: {
      status: state.status,
      stateHash: state.stateHash,
      counts: state.counts,
      sourceReceipt: state.sourceReceipt,
      packetIds: state.packetIds,
      outputs: state.outputs,
      boundary: state.boundary
    }
  };
  const result = await postLaw001(envelope);
  writeJson(abs(scopedPaths.postResult), { envelope, result });
  return result;
}

async function executeMint(options = {}) {
  const now = options.now || new Date().toISOString();
  const inboxMatch = await findNdjsonLine(abs(scopedPaths.inbox), sourceReceiptId);
  if (!inboxMatch || !inboxMatch.row) {
    throw new Error(`source LAW001 envelope not found in ${scopedPaths.inbox}`);
  }
  const d0Match = await findNdjsonLine(abs(scopedPaths.d0), sourceReceiptId);
  if (!d0Match || !d0Match.row || d0Match.row.gatePass !== true || d0Match.row.inferVerdict !== "PROCEED") {
    throw new Error(`source LAW001 D0 gate pass not found in ${scopedPaths.d0}`);
  }

  const packets = buildPacketsFromEnvelope(inboxMatch.row, { now });
  writeNdjson(abs(scopedPaths.queue), packets);
  const result = runSupervisorQueue({
    root: repoRoot,
    sourceRoot: repoRoot,
    now,
    queuePath: scopedPaths.queue,
    decisionsPath: scopedPaths.decisions,
    workerReadyPath: scopedPaths.workerReady,
    mapPath: scopedPaths.map,
    statePath: scopedPaths.state,
    hermesPath: scopedPaths.hermes,
    shannonPath: scopedPaths.shannon,
    cubePath: scopedPaths.cube,
    reportJsonPath: scopedPaths.reportJson,
    reportMdPath: scopedPaths.reportMd,
    execute: true
  });

  const expectedCounts = result.counts.total === 4
    && result.counts.ALLOW === 4
    && result.counts.NEEDS_EVIDENCE === 0
    && result.counts.BLOCK === 0
    && result.counts.workerReady === 4;
  if (!expectedCounts) {
    throw new Error(`supervisor runner did not produce 4 worker-ready ALLOW packets: ${JSON.stringify(result.counts)}`);
  }

  const stateCore = {
    schema: "wave33a-omnispindle-parallel-packet-mint-acer.v1",
    generatedAt: now,
    status: "WAVE33A_OMNISPIN_PARALLEL_ACER_PACKETS_WORKER_READY",
    sourceReceiptId,
    sourceReceipt: {
      inboxLine: inboxMatch.line,
      inboxSha256: inboxMatch.sha256,
      d0Line: d0Match.line,
      d0Sha256: d0Match.sha256,
      gated: inboxMatch.row.gated === true,
      d0GatePass: d0Match.row.gatePass === true
    },
    operatorCosign: inboxMatch.row.operator_cosign || inboxMatch.row.operatorCosign || null,
    counts: result.counts,
    packetIds: packets.map((packet) => packet.id),
    workerReadyPacketIds: result.workerReadyPackets.map((packet) => packet.packetId),
    decisions: result.decisions,
    outputs: {
      queue: scopedPaths.queue,
      decisions: scopedPaths.decisions,
      workerReady: scopedPaths.workerReady,
      runnerState: scopedPaths.state,
      runnerReport: scopedPaths.reportJson,
      mintState: scopedPaths.mintState,
      mintReportJson: scopedPaths.mintReportJson,
      mintReportMd: scopedPaths.mintReportMd
    },
    boundary: {
      planningOnly: true,
      runnerDoesNotSpawnWorkers: true,
      noHookWiring: true,
      noAdapterWiring: true,
      noRemoteMutation: true,
      noDeviceMutation: true,
      noInstalls: true,
      noDownloads: true,
      noLirisCanonicalWrite: true
    }
  };
  const state = { ...stateCore, stateHash: sha256Json(stateCore) };
  writeJson(abs(scopedPaths.mintState), state);
  writeJson(abs(scopedPaths.mintReportJson), state);
  writeText(abs(scopedPaths.mintReportMd), formatReport(state));
  return { state, result };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has("--dry-run");
  const notify = args.has("--notify");
  if (dryRun) {
    const inboxMatch = await findNdjsonLine(abs(scopedPaths.inbox), sourceReceiptId);
    if (!inboxMatch || !inboxMatch.row) throw new Error(`source LAW001 envelope not found in ${scopedPaths.inbox}`);
    const packets = buildPacketsFromEnvelope(inboxMatch.row, { now: "2026-04-28T00:00:00.000Z" });
    console.log(JSON.stringify({
      ok: true,
      dryRun: true,
      sourceReceiptId,
      packetIds: packets.map((packet) => packet.id),
      boundary: packets.map((packet) => packet.boundary)
    }, null, 2));
    return;
  }
  const { state } = await executeMint();
  const post = notify ? await notifyLiris(state) : { skipped: true };
  console.log(JSON.stringify({
    status: state.status,
    stateHash: state.stateHash,
    counts: state.counts,
    sourceReceipt: state.sourceReceipt,
    notify: post
  }, null, 2));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error && error.stack ? error.stack : String(error));
    process.exitCode = 1;
  });
}

module.exports = {
  sourceReceiptId,
  expectedAcerPackets,
  dangerousFlags,
  forbiddenWorkerPathPatterns,
  scopedPaths,
  validateSourceEnvelope,
  assertNoForbiddenWorkerPaths,
  buildPacketsFromEnvelope,
  executeMint
};
