#!/usr/bin/env node
"use strict";

const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  modelPolicyForWorkItem,
  selectModelForWorkItem
} = require("./opencode-free-agent-supervisor-lane");

const repoRoot = path.resolve(__dirname, "..", "..");
const runId = process.env.ASOLARIA_LOGICAL_RUN_ID || "real-free-agent-system-test-logical-20b-20260428";
const eventId = "EVT-REAL-FREE-AGENT-LOGICAL-SCALE-LEDGER-2026-04-28";

// BigInt-aware coercion: accepts decimal Number or decimal-string BigInt.
// Returns Number if safely representable, BigInt otherwise. Negative or invalid → null.
function coerceCount(input, fallback) {
  if (input === undefined || input === null || input === "") return fallback;
  if (typeof input === "bigint") return input;
  if (typeof input === "number") {
    if (!Number.isFinite(input) || input < 0) return null;
    return Number.isSafeInteger(input) ? input : BigInt(Math.trunc(input));
  }
  const str = String(input).trim();
  if (!/^[0-9]+$/.test(str)) {
    const numeric = Number(str);
    if (!Number.isFinite(numeric) || numeric < 0) return null;
    return Number.isSafeInteger(numeric) ? numeric : BigInt(Math.trunc(numeric));
  }
  // Pure decimal-digit string: try Number first, fall back to BigInt.
  const asNumber = Number(str);
  if (Number.isSafeInteger(asNumber) && String(asNumber) === str) return asNumber;
  return BigInt(str);
}

// True if value is a positive integer (Number safe-int >=1 OR BigInt >=1n).
function isPositiveCount(value) {
  if (typeof value === "bigint") return value >= 1n;
  return Number.isSafeInteger(value) && value >= 1;
}

// Serialize Number/BigInt count to canonical decimal string.
function countToString(value) {
  if (typeof value === "bigint") return value.toString();
  return String(value);
}

// JSON replacer that stringifies BigInt as decimal string.
function bigintReplacer(_key, value) {
  return typeof value === "bigint" ? value.toString() : value;
}

const logicalAgents = coerceCount(process.env.ASOLARIA_LOGICAL_AGENTS, 20_000_000_000);
const logicalShards = Number(process.env.ASOLARIA_LOGICAL_SHARDS || 1000);
const gulpSize = Number(process.env.ASOLARIA_LOGICAL_GULP_SIZE || 2000);
const questionPacketRel = process.env.ASOLARIA_SUPERVISOR_QUESTION_PACKET || "data/behcs/orchestration/real-free-agent-system-test-20260428/real-free-agent-system-test-questions.v1.json";

const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", runId);
const paths = Object.freeze({
  questionPacket: path.join(repoRoot, questionPacketRel),
  manifest: path.join(runRoot, "real-free-agent-logical-scale-ledger-manifest.v1.json"),
  localLedger: path.join(runRoot, "logical-scale-ledger-preview.ndjson"),
  reportJson: path.join(repoRoot, "reports", "real-free-agent-logical-scale-ledger-latest.json"),
  reportMd: path.join(repoRoot, "reports", "real-free-agent-logical-scale-ledger-latest.md")
});

const lanes = Object.freeze([
  "memory_index",
  "supervisor_pid",
  "law001_bus",
  "drift_boundary",
  "inbox_gc",
  "white_room_gc",
  "forward_gnn",
  "reverse_gain_gnn",
  "omnishannon",
  "hookwall"
]);

const trackerLanes = Object.freeze([
  "opencode_pid_prompt",
  "omnispindle_range_control",
  "omniflywheel_coupling",
  "behcs_gulp_2000",
  "white_room_ingestion",
  "forward_gnn",
  "reverse_gain_gnn",
  "omnishannon",
  "hookwall_policy",
  "gc_compaction"
]);

const geniusTemplates = Object.freeze([
  "PID-only prompts should be a stable cache key so model workers reuse Brown-Hilbert language without banners.",
  "Each compact gulp window should commit a digest instead of materializing every worker row.",
  "Reverse-gain should run before promotion so surprising outputs become tests instead of direct build changes.",
  "Real model calls should validate sampled lanes while compact fanout carries the billion-scale coverage.",
  "White room ingestion should receive bounded proof slices while the full sweep remains compact and reproducible.",
  "GC should spill derived worker ranges while preserving reports, hashes, and top marks.",
  "OmniShannon should carry the honesty boundary: real sampled calls plus compact logical workers.",
  "Omniflywheel coupling needs an explicit enable token before shared state affects workers.",
  "A failed range can be replayed from worker start/end, gulp window, and seed.",
  "Model selector cost and token output should be recorded before larger empirical batches run."
]);

const mistakeTemplates = Object.freeze([
  "Spawning billions of OS processes or live model sessions would damage the machine and destroy the evidence trail.",
  "Calling compact logical ranges real model sessions would make the report unusable.",
  "Headers, banners, and long prompts waste tokens when PID-only packets are enough.",
  "Writing one row per logical worker would explode local storage; compact ranges are required.",
  "Letting workers influence each other without an Omniflywheel/GAC token can corrupt the run.",
  "Forward GNN alone can promote bad novelty; reverse-gain must demote risky anomalies.",
  "Garbage collection must compact duplicates, not delete source reports or top marks.",
  "Provider presence is not the same as a working model response; direct sampled smoke is required.",
  "Treating local CLI as free without checking token/cost output can burn quota.",
  "Device, EEG, browser, or phone surfaces do not belong in this compact logical tracker."
]);

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeText(filePath, text) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, String(text).endsWith("\n") ? String(text) : `${text}\n`, "utf8");
}

function writeJson(filePath, value) {
  writeText(filePath, JSON.stringify(value, bigintReplacer, 2));
}

function writeNdjson(filePath, rows) {
  writeText(filePath, rows.map((row) => JSON.stringify(row, bigintReplacer)).join("\n"));
}

function sha256Text(text) {
  return crypto.createHash("sha256").update(String(text), "utf8").digest("hex");
}

function sha256Json(value) {
  return sha256Text(JSON.stringify(sortDeep(value), bigintReplacer));
}

function round3(value) {
  return Math.round(Number(value || 0) * 1000) / 1000;
}

function padNumber(value, width) {
  return String(value).padStart(width, "0");
}

function logicalScaleLabel(total) {
  if (typeof total === "bigint") {
    if (total % 1_000_000_000_000_000_000n === 0n) return `${total / 1_000_000_000_000_000_000n}e`;
    if (total % 1_000_000_000_000_000n === 0n) return `${total / 1_000_000_000_000_000n}p`;
    if (total % 1_000_000_000_000n === 0n) return `${total / 1_000_000_000_000n}t`;
    if (total % 1_000_000_000n === 0n) return `${total / 1_000_000_000n}b`;
    if (total % 1_000_000n === 0n) return `${total / 1_000_000n}m`;
    if (total % 1_000n === 0n) return `${total / 1_000n}k`;
    return total.toString().replace(/[^0-9a-z_-]+/gi, "_");
  }
  const value = Number(total);
  if (Number.isSafeInteger(value) && value % 1_000_000_000 === 0) {
    return `${value / 1_000_000_000}b`;
  }
  if (Number.isSafeInteger(value) && value % 1_000_000 === 0) {
    return `${value / 1_000_000}m`;
  }
  if (Number.isSafeInteger(value) && value % 1_000 === 0) {
    return `${value / 1_000}k`;
  }
  return String(value).replace(/[^0-9a-z_-]+/gi, "_");
}

function sortDeep(value) {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sortDeep(value[key])]));
  }
  return value;
}

function repoRel(filePath) {
  const relative = path.relative(repoRoot, filePath);
  return (path.isAbsolute(relative) || relative.startsWith("..") ? filePath : relative).replace(/\\/g, "/");
}

function readJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    return {
      __readError: String(error && error.message ? error.message : error)
    };
  }
}

function normalizeQuestions(packet) {
  const raw = Array.isArray(packet?.questions) ? packet.questions : [];
  return raw.map((question, index) => ({
    id: String(question?.id || `question-${index + 1}`).trim(),
    question: String(question?.question || "").trim(),
    evidenceClass: String(question?.evidence_class || question?.evidenceClass || "").trim(),
    cube: question?.cube ?? null
  })).filter((question) => question.id && question.question);
}

function driveRootExists(root) {
  try {
    return fs.existsSync(root);
  } catch (_error) {
    return false;
  }
}

function chooseSpillRoot(options = {}) {
  const explicit = options.spillRoot || process.env.ASOLARIA_BEHCS_SPILL_ROOT;
  if (explicit) return path.resolve(explicit);
  const dRoot = "D:\\";
  if (driveRootExists(dRoot)) {
    return path.join(dRoot, "Asolaria-BEHCS-GC");
  }
  return path.join(repoRoot, "data", "behcs", "garbage-collector", "logical-scale-spill");
}

function buildLogicalRows(options = {}) {
  const questions = Array.isArray(options.questions) && options.questions.length
    ? options.questions
    : [{ id: "system-self-knowledge", question: "System self-knowledge", evidenceClass: "default", cube: null }];
  const total = coerceCount(options.logicalAgents, logicalAgents);
  const shards = Number(options.logicalShards || logicalShards);
  const gulp = Number(options.gulpSize || gulpSize);
  if (!isPositiveCount(total)) throw new Error("logicalAgents must be a positive integer (Number or decimal-string BigInt)");
  if (!Number.isSafeInteger(shards) || shards < 1) throw new Error("logicalShards must be a positive safe integer");
  if (!Number.isSafeInteger(gulp) || gulp < 1) throw new Error("gulpSize must be a positive safe integer");
  const rows = [];
  const useBig = typeof total === "bigint";
  const big = (n) => (useBig ? BigInt(n) : n);
  const ONE = useBig ? 1n : 1;
  const shardsVal = useBig ? BigInt(shards) : shards;
  const gulpVal = useBig ? BigInt(gulp) : gulp;
  const base = useBig ? total / shardsVal : Math.floor(total / shards);
  let cursor = ONE;
  for (let index = 0; index < shards; index += 1) {
    const represented = index === shards - 1
      ? (useBig ? (total - cursor + 1n) : (total - cursor + 1))
      : base;
    const first = cursor;
    const last = useBig ? (cursor + represented - 1n) : (cursor + represented - 1);
    cursor = useBig ? (last + 1n) : (last + 1);
    const question = questions[index % questions.length];
    const lane = lanes[index % lanes.length];
    const workItem = {
      globalSeq: index + 1,
      question,
      localIndex: index + 1,
      supervisorIndex: (index % 50) + 1,
      round: Math.floor(index / Math.max(1, questions.length * 50)) + 1
    };
    const rowCore = {
      seq: index + 1,
      runId,
      eventId,
      lane,
      questionId: question.id,
      evidenceClass: question.evidenceClass,
      cube: question.cube,
      firstLogicalAgent: first,
      lastLogicalAgent: last,
      logicalAgentsRepresented: represented,
      logicalGulpsRepresented: useBig
        ? ((represented + gulpVal - 1n) / gulpVal)
        : Math.ceil(represented / gulp),
      gulpSize: gulp,
      modelPolicy: modelPolicyForWorkItem(workItem),
      selectedModelForEmpiricalSample: selectModelForWorkItem(workItem),
      boundary: "Compact logical ledger shard. This is not a live model call count and not an OS process count."
    };
    rows.push({ ...rowCore, shardHash: sha256Json(rowCore) });
  }
  return rows;
}

function buildOmniflywheelTracker(options = {}) {
  const total = coerceCount(options.logicalAgents, logicalAgents);
  const gulp = Number(options.gulpSize || gulpSize);
  const maxRows = Number(options.maxTrackerRows || process.env.ASOLARIA_LOGICAL_TRACKER_MAX_ROWS || 20_000);
  const controllerCount = Number(options.controllerCount || process.env.ASOLARIA_TRACKER_CONTROLLER_COUNT || 1000);
  const flywheelCount = Number(options.flywheelCount || process.env.ASOLARIA_TRACKER_FLYWHEEL_COUNT || 1000);
  if (!isPositiveCount(total)) throw new Error("logicalAgents must be a positive integer (Number or decimal-string BigInt)");
  if (!Number.isSafeInteger(gulp) || gulp < 1) throw new Error("gulpSize must be a positive safe integer");
  if (!Number.isSafeInteger(maxRows) || maxRows < 1) throw new Error("maxTrackerRows must be a positive safe integer");
  if (!Number.isSafeInteger(controllerCount) || controllerCount < 1) throw new Error("controllerCount must be a positive safe integer");
  if (!Number.isSafeInteger(flywheelCount) || flywheelCount < 1) throw new Error("flywheelCount must be a positive safe integer");

  const useBig = typeof total === "bigint";
  const gulpBig = useBig ? BigInt(gulp) : gulp;
  // totalGulps = ceil(total / gulp). For BigInt path stays BigInt; for Number path stays Number.
  const totalGulps = useBig
    ? ((total + gulpBig - 1n) / gulpBig)
    : Math.ceil(total / gulp);
  const scaleLabel = logicalScaleLabel(total);
  // strideGulps: floor(totalGulps / maxRows), at least 1. Stride remains Number-safe when collapsed but may be BigInt for huge totals.
  const strideGulps = useBig
    ? (totalGulps / BigInt(maxRows) > 0n ? totalGulps / BigInt(maxRows) : 1n)
    : Math.max(1, Math.floor(totalGulps / maxRows));
  const started = process.hrtime.bigint();
  const rows = [];
  const geniusCandidates = [];
  const mistakeCandidates = [];
  let checksum = 0;

  // Iterator must use the same numeric kind as totalGulps/strideGulps.
  const ZERO = useBig ? 0n : 0;
  const ONE = useBig ? 1n : 1;
  const lt = (a, b) => (useBig ? a < b : a < b);
  const minVal = (a, b) => (useBig ? (a < b ? a : b) : Math.min(a, b));
  for (let firstGulp = ZERO, rangeIndex = 0; lt(firstGulp, totalGulps); firstGulp = (useBig ? (firstGulp + strideGulps) : (firstGulp + strideGulps)), rangeIndex += 1) {
    const lastGulp = minVal(useBig ? (totalGulps - 1n) : (totalGulps - 1), useBig ? (firstGulp + strideGulps - 1n) : (firstGulp + strideGulps - 1));
    const firstWorker = useBig ? (firstGulp * gulpBig + 1n) : (firstGulp * gulp + 1);
    const lastWorker = useBig
      ? (total < (lastGulp + 1n) * gulpBig ? total : (lastGulp + 1n) * gulpBig)
      : Math.min(total, (lastGulp + 1) * gulp);
    const lane = trackerLanes[rangeIndex % trackerLanes.length];
    const controller = `BH.TRACKER.CTRL.${padNumber((rangeIndex % controllerCount) + 1, 4)}`;
    const flywheel = `BH.OMNIFLYWHEEL.${padNumber((rangeIndex % flywheelCount) + 1, 4)}`;
    const basis = `${runId}:${eventId}:${countToString(firstGulp)}:${countToString(lastGulp)}:${countToString(firstWorker)}:${countToString(lastWorker)}:${lane}`;
    const digest = sha256Text(basis);
    const score = round3((parseInt(digest.slice(0, 6), 16) % 1000) / 1000);
    const reverseGain = round3((parseInt(digest.slice(6, 12), 16) % 1000) / 1000);
    const row = {
      rangeId: `range-${padNumber(rangeIndex, 8)}`,
      firstGulp,
      lastGulp,
      gulpsRepresented: useBig ? (lastGulp - firstGulp + 1n) : (lastGulp - firstGulp + 1),
      firstWorker,
      lastWorker,
      logicalWorkersRepresented: useBig ? (lastWorker - firstWorker + 1n) : (lastWorker - firstWorker + 1),
      lane,
      controller,
      flywheel,
      score,
      reverseGain,
      digest,
      boundary: "Compact omniflywheel tracker range. This is not one live model call per worker."
    };
    rows.push(row);
    geniusCandidates.push(row);
    mistakeCandidates.push(row);
    checksum = (checksum + parseInt(digest.slice(0, 8), 16)) >>> 0;
  }

  const laneStats = trackerLanes.map((lane, laneIndex) => {
    const gulpsForLane = Math.floor((totalGulps + trackerLanes.length - 1 - laneIndex) / trackerLanes.length);
    const lastGulpIndex = totalGulps - 1;
    const lastGulpAgents = total - (totalGulps - 1) * gulp;
    const hasLastPartial = lastGulpIndex >= 0 && lastGulpIndex % trackerLanes.length === laneIndex && lastGulpAgents !== gulp;
    const workers = hasLastPartial ? ((gulpsForLane - 1) * gulp) + lastGulpAgents : gulpsForLane * gulp;
    const sampled = rows.filter((row) => row.lane === lane);
    return {
      lane,
      workers,
      gulps: gulpsForLane,
      trackerRows: sampled.length,
      avgScore: round3(sampled.reduce((sum, row) => sum + row.score, 0) / Math.max(1, sampled.length)),
      avgReverseGain: round3(sampled.reduce((sum, row) => sum + row.reverseGain, 0) / Math.max(1, sampled.length))
    };
  });

  const geniusRows = geniusCandidates
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(100, geniusCandidates.length))
    .map((row, index) => ({
      kind: "genius",
      id: `genius-${padNumber(index + 1, 3)}`,
      lane: row.lane,
      firstGulp: row.firstGulp,
      lastGulp: row.lastGulp,
      pidRange: `${row.firstWorker}..${row.lastWorker}`,
      score: row.score,
      glyph: row.digest.slice(0, 16),
      summary: geniusTemplates[index % geniusTemplates.length]
    }));

  const mistakeRows = mistakeCandidates
    .slice()
    .sort((a, b) => b.reverseGain - a.reverseGain)
    .slice(0, Math.min(100, mistakeCandidates.length))
    .map((row, index) => ({
      kind: "mistake",
      id: `mistake-${padNumber(index + 1, 3)}`,
      lane: row.lane,
      firstGulp: row.firstGulp,
      lastGulp: row.lastGulp,
      pidRange: `${row.firstWorker}..${row.lastWorker}`,
      reverseGain: row.reverseGain,
      hookwallStatus: "demote_or_halt_until_review",
      glyph: row.digest.slice(16, 32),
      summary: mistakeTemplates[index % mistakeTemplates.length]
    }));

  const elapsedMs = Number(process.hrtime.bigint() - started) / 1_000_000;
  return {
    schema: "real-free-agent-omniflywheel-tracker.v1",
    status: "OMNIFLYWHEEL_TRACKER_READY",
    logicalWorkers: total,
    logicalGulps: totalGulps,
    gulpSize: gulp,
    trackerStrideGulps: strideGulps,
    trackerRowsWritten: rows.length,
    controllers: controllerCount,
    flywheels: flywheelCount,
    lanes: laneStats,
    speed: {
      trackerBuildElapsedMs: round3(elapsedMs),
      compactLogicalThroughputWorkersPerSecond: Math.round(total / Math.max(0.001, elapsedMs / 1000))
    },
    honesty: {
      realWorkPerformed: [
        `compact_${scaleLabel}_pid_range_tracker`,
        "deterministic_gulp_range_digests",
        "genius_and_mistake_marks_from_tracker_rows"
      ],
      notPerformed: [
        `${scaleLabel}_os_processes`,
        `${scaleLabel}_live_llm_sessions`,
        "one_file_per_logical_worker"
      ]
    },
    rangeDigest: sha256Text(rows.map((row) => row.digest).join("|")),
    geniusDigest: sha256Text(geniusRows.map((row) => row.glyph).join("|")),
    mistakeDigest: sha256Text(mistakeRows.map((row) => row.glyph).join("|")),
    checksum,
    rows,
    geniusRows,
    mistakeRows
  };
}

function formatReport(manifest) {
  return [
    "# Real Free Agent Logical Scale Ledger",
    "",
    `Generated: ${manifest.generatedAt}`,
    `Status: ${manifest.status}`,
    `State hash: ${manifest.stateHash}`,
    "",
    "## Scale",
    "",
    `- Logical agents represented: ${manifest.logicalAgentsRepresented}`,
    `- Logical shards: ${manifest.logicalShards}`,
    `- Gulp size: ${manifest.gulpSize}`,
    `- Logical gulps represented: ${manifest.logicalGulpsRepresented}`,
    `- Tracker rows written: ${manifest.tracker.counts.trackerRowsWritten}`,
    `- Tracker stride: ${manifest.tracker.counts.trackerStrideGulps} gulps per row`,
    `- Compact tracker throughput: ${manifest.tracker.speed.compactLogicalThroughputWorkersPerSecond} workers/sec`,
    "",
    "## Storage",
    "",
    `- Spill root: \`${manifest.storage.spillRoot}\``,
    `- Ledger path: \`${manifest.storage.ledgerPath}\``,
    `- Ledger sha256: \`${manifest.storage.ledgerSha256}\``,
    `- Tracker ranges: \`${manifest.tracker.outputs.ranges}\``,
    `- Tracker summary: \`${manifest.tracker.outputs.summary}\``,
    "",
    "## Boundary",
    "",
    "- Real OpenCode calls remain empirical samples.",
    "- Billions-scale coverage is compact BEHCS ledger/gulp/GC coverage.",
    "- The ledger does not claim billions of live model calls or OS processes.",
    "- Source evidence is preserved; derived scale rows are GC-spillable.",
    ""
  ].join("\n");
}

function execute(options = {}) {
  const generatedAt = options.generatedAt || new Date().toISOString();
  const questionPacket = readJson(paths.questionPacket, { questions: [] });
  const questions = normalizeQuestions(questionPacket);
  const rows = buildLogicalRows({
    questions,
    logicalAgents: options.logicalAgents || logicalAgents,
    logicalShards: options.logicalShards || logicalShards,
    gulpSize: options.gulpSize || gulpSize
  });
  const spillRoot = chooseSpillRoot(options);
  const spillDir = path.join(spillRoot, runId);
  const ledgerPath = path.join(spillDir, "logical-scale-ledger.ndjson");
  const tracker = buildOmniflywheelTracker({
    logicalAgents: options.logicalAgents || logicalAgents,
    gulpSize: options.gulpSize || gulpSize,
    maxTrackerRows: options.maxTrackerRows,
    controllerCount: options.controllerCount,
    flywheelCount: options.flywheelCount
  });
  const trackerPaths = {
    ranges: path.join(spillDir, "compact-gulp-ranges.ndjson"),
    genius: path.join(spillDir, "genius-marks-latest.ndjson"),
    mistakes: path.join(spillDir, "mistake-marks-latest.ndjson"),
    summary: path.join(spillDir, "omniflywheel-tracker-summary.v1.json"),
    localRangesPreview: path.join(runRoot, "compact-gulp-ranges-preview.ndjson"),
    localGenius: path.join(runRoot, "genius-marks-latest.ndjson"),
    localMistakes: path.join(runRoot, "mistake-marks-latest.ndjson"),
    localSummary: path.join(runRoot, "omniflywheel-tracker-summary.v1.json")
  };
  writeNdjson(ledgerPath, rows);
  writeNdjson(trackerPaths.ranges, tracker.rows);
  writeNdjson(trackerPaths.genius, tracker.geniusRows);
  writeNdjson(trackerPaths.mistakes, tracker.mistakeRows);
  const trackerSummary = {
    schema: tracker.schema,
    generatedAt,
    status: tracker.status,
    runId,
    eventId,
    host: os.hostname(),
    logicalWorkers: tracker.logicalWorkers,
    logicalGulps: tracker.logicalGulps,
    gulpSize: tracker.gulpSize,
    trackerStrideGulps: tracker.trackerStrideGulps,
    trackerRowsWritten: tracker.trackerRowsWritten,
    controllers: tracker.controllers,
    flywheels: tracker.flywheels,
    lanes: tracker.lanes,
    speed: tracker.speed,
    honesty: tracker.honesty,
    rangeDigest: tracker.rangeDigest,
    geniusDigest: tracker.geniusDigest,
    mistakeDigest: tracker.mistakeDigest,
    checksum: tracker.checksum,
    topGenius: tracker.geniusRows.slice(0, 10),
    topMistakes: tracker.mistakeRows.slice(0, 10)
  };
  writeJson(trackerPaths.summary, trackerSummary);
  writeNdjson(paths.localLedger, rows.slice(0, Math.min(50, rows.length)));
  writeNdjson(trackerPaths.localRangesPreview, tracker.rows.slice(0, Math.min(100, tracker.rows.length)));
  writeNdjson(trackerPaths.localGenius, tracker.geniusRows);
  writeNdjson(trackerPaths.localMistakes, tracker.mistakeRows);
  writeJson(trackerPaths.localSummary, {
    ...trackerSummary,
    outputs: {
      ranges: trackerPaths.ranges.replace(/\\/g, "/"),
      genius: trackerPaths.genius.replace(/\\/g, "/"),
      mistakes: trackerPaths.mistakes.replace(/\\/g, "/"),
      summary: trackerPaths.summary.replace(/\\/g, "/")
    }
  });
  const ledgerText = fs.readFileSync(ledgerPath, "utf8");
  const trackerRangesText = fs.readFileSync(trackerPaths.ranges, "utf8");
  const trackerGeniusText = fs.readFileSync(trackerPaths.genius, "utf8");
  const trackerMistakesText = fs.readFileSync(trackerPaths.mistakes, "utf8");
  const totalLogical = rows.reduce((sum, row) => sum + row.logicalAgentsRepresented, 0);
  const totalGulps = rows.reduce((sum, row) => sum + row.logicalGulpsRepresented, 0);
  const manifestCore = {
    schema: "real-free-agent-logical-scale-ledger-manifest.v1",
    generatedAt,
    status: "REAL_FREE_AGENT_LOGICAL_SCALE_LEDGER_READY",
    runId,
    eventId,
    host: os.hostname(),
    questionPacket: {
      path: repoRel(paths.questionPacket),
      present: fs.existsSync(paths.questionPacket),
      sha256: fs.existsSync(paths.questionPacket) ? sha256Text(fs.readFileSync(paths.questionPacket, "utf8")) : null,
      questionCount: questions.length
    },
    logicalAgentsRepresented: totalLogical,
    logicalShards: rows.length,
    gulpSize,
    logicalGulpsRepresented: totalGulps,
    storage: {
      spillRoot: spillRoot.replace(/\\/g, "/"),
      ledgerPath: ledgerPath.replace(/\\/g, "/"),
      ledgerBytes: fs.statSync(ledgerPath).size,
      ledgerSha256: sha256Text(ledgerText),
      localPreviewPath: repoRel(paths.localLedger),
      localPreviewRows: Math.min(50, rows.length)
    },
    tracker: {
      status: tracker.status,
      counts: {
        logicalWorkers: tracker.logicalWorkers,
        logicalGulps: tracker.logicalGulps,
        trackerRowsWritten: tracker.trackerRowsWritten,
        trackerStrideGulps: tracker.trackerStrideGulps,
        geniusMarks: tracker.geniusRows.length,
        mistakeMarks: tracker.mistakeRows.length,
        controllers: tracker.controllers,
        flywheels: tracker.flywheels
      },
      speed: tracker.speed,
      rangeDigest: tracker.rangeDigest,
      geniusDigest: tracker.geniusDigest,
      mistakeDigest: tracker.mistakeDigest,
      outputs: {
        ranges: trackerPaths.ranges.replace(/\\/g, "/"),
        rangesSha256: sha256Text(trackerRangesText),
        genius: trackerPaths.genius.replace(/\\/g, "/"),
        geniusSha256: sha256Text(trackerGeniusText),
        mistakes: trackerPaths.mistakes.replace(/\\/g, "/"),
        mistakesSha256: sha256Text(trackerMistakesText),
        summary: trackerPaths.summary.replace(/\\/g, "/"),
        localRangesPreview: repoRel(trackerPaths.localRangesPreview),
        localSummary: repoRel(trackerPaths.localSummary)
      },
      honesty: tracker.honesty
    },
    boundary: {
      empiricalCallsAreSeparate: true,
      logicalCoverageNotLiveProcessCount: true,
      logicalCoverageNotLiveModelCallCount: true,
      gcSpillableDerivedRows: true,
      sourceEvidencePreserved: true
    }
  };
  const manifest = { ...manifestCore, stateHash: sha256Json(manifestCore) };
  writeJson(paths.manifest, manifest);
  writeJson(paths.reportJson, manifest);
  writeText(paths.reportMd, formatReport(manifest));
  return manifest;
}

function main() {
  const args = new Set(process.argv.slice(2));
  if (args.has("--dry-run")) {
    const questionPacket = readJson(paths.questionPacket, { questions: [] });
    const rows = buildLogicalRows({ questions: normalizeQuestions(questionPacket), logicalShards: 5 });
    console.log(JSON.stringify({
      ok: true,
      dryRun: true,
      runId,
      logicalAgentsRepresented: logicalAgents,
      logicalShards,
      spillRoot: chooseSpillRoot().replace(/\\/g, "/"),
      sampleRows: rows
    }, null, 2));
    return;
  }
  const manifest = execute();
  console.log(JSON.stringify({
    status: manifest.status,
    stateHash: manifest.stateHash,
    logicalAgentsRepresented: manifest.logicalAgentsRepresented,
    logicalShards: manifest.logicalShards,
      ledgerPath: manifest.storage.ledgerPath,
      ledgerSha256: manifest.storage.ledgerSha256,
      trackerRowsWritten: manifest.tracker.counts.trackerRowsWritten,
      trackerRangeDigest: manifest.tracker.rangeDigest
    }, null, 2));
}

if (require.main === module) {
  main();
}

module.exports = {
  chooseSpillRoot,
  normalizeQuestions,
  buildLogicalRows,
  buildOmniflywheelTracker,
  logicalScaleLabel,
  execute
};
