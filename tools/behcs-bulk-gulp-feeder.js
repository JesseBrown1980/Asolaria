#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const gulpRuntime = require('./behcs/behcs-gulp-runtime');

const repoRoot = path.resolve(__dirname, '..');
const BEHCS_DIR = path.join(repoRoot, 'data', 'behcs');
const GC_DIR = path.join(BEHCS_DIR, 'garbage-collector');
const GC_STATE_PATH = path.join(GC_DIR, 'collector-state.json');
const GC_BUFFER_PATH = path.join(GC_DIR, 'message-paths.ndjson');
const REPORT_JSON = path.join(repoRoot, 'reports', 'behcs-bulk-gulp-feeder-latest.json');
const REPORT_MD = path.join(repoRoot, 'reports', 'behcs-bulk-gulp-feeder-latest.md');
const STATE_PATH = path.join(BEHCS_DIR, 'state', 'bulk-gulp-feeder', 'behcs-bulk-gulp-feeder.state.json');
const CUBE_PATH = path.join(BEHCS_DIR, 'cubes', 'behcs-bulk-gulp-feeder.cube.js');
const HERMES_PATH = path.join(BEHCS_DIR, 'hermes', 'bulk-gulp-feeder', 'behcs-bulk-gulp-feeder-dispatch-latest.json');
const SHANNON_PATH = path.join(BEHCS_DIR, 'shannon', 'bulk-gulp-feeder', 'behcs-bulk-gulp-feeder-consensus-latest.json');

const DEFAULT_COUNT = 2_000;
const DEFAULT_LOGICAL_WORKERS = 100_000_000;
const DEFAULT_WRITE_BUFFER = 5_000;

const MODE = Object.freeze({
  backend: 'local_filesystem_free_backend',
  noShadowRuntimeEdits: true,
  usesExistingBehcsGulpRuntime: true,
  usesAttachBehcsPath: true,
  bulkStateUpdate: true,
  bufferedNdjsonWrite: true,
  incrementalRecordDigest: true,
  noServerAuth: true,
  noServerApiRoute: true,
  noDownloads: true,
  noInstalls: true,
  noLiveEeg: true,
  oneWorkerOneProcessBlocked: true
});

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_) {
    return fallback;
  }
}

function writeJson(filePath, value) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeText(filePath, value) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, value.endsWith('\n') ? value : `${value}\n`, 'utf8');
}

class BufferedNdjsonWriter {
  constructor(filePath, bufferSize = DEFAULT_WRITE_BUFFER) {
    this.filePath = filePath;
    this.bufferSize = Math.max(1, safeInt(bufferSize, DEFAULT_WRITE_BUFFER));
    this.buffer = [];
    this.fd = null;
    this.linesWritten = 0;
  }

  open() {
    ensureDir(this.filePath);
    this.fd = fs.openSync(this.filePath, 'a');
  }

  write(row) {
    this.buffer.push(JSON.stringify(row));
    this.linesWritten += 1;
    if (this.buffer.length >= this.bufferSize) this.flush();
  }

  flush() {
    if (this.buffer.length === 0) return;
    const body = `${this.buffer.join('\n')}\n`;
    if (this.fd != null) {
      fs.writeSync(this.fd, body, undefined, 'utf8');
    } else {
      ensureDir(this.filePath);
      fs.appendFileSync(this.filePath, body, 'utf8');
    }
    this.buffer = [];
  }

  close() {
    this.flush();
    if (this.fd != null) {
      fs.closeSync(this.fd);
      this.fd = null;
    }
  }
}

function readNdjson(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => {
      try { return JSON.parse(line); } catch (_) { return null; }
    })
    .filter(Boolean);
}

function writeNdjson(filePath, rows) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, rows.map((row) => JSON.stringify(row)).join('\n') + '\n', 'utf8');
}

function repoRel(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, '/');
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function safeInt(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number) : fallback;
}

function clip(value, max = 160) {
  return String(value === undefined || value === null ? '' : value).replace(/\s+/g, ' ').trim().slice(0, max);
}

function updateStatePatch(patch) {
  const current = readJson(GC_STATE_PATH, {});
  const next = { ...current, ...patch };
  writeJson(GC_STATE_PATH, next);
  return next;
}

function trimBuffer(maxLines) {
  const rows = readNdjson(GC_BUFFER_PATH);
  if (rows.length <= maxLines) return rows.length;
  writeNdjson(GC_BUFFER_PATH, rows.slice(-maxLines));
  return maxLines;
}

function buildMessage(index, generatedAt, logicalWorkers) {
  const firstWorker = index * 2_000 + 1;
  const lastWorker = firstWorker + 1_999;
  return {
    id: `bulk-gulp-proof-${generatedAt.replace(/[-:.TZ]/g, '').slice(0, 14)}-${String(index).padStart(5, '0')}`,
    ts: generatedAt,
    type: 'agent_packet',
    mode: 'bulk_gulp_feeder',
    from: 'omniflywheel_bulk_feeder',
    to: 'behcs_gulp_runtime',
    verb: 'EVT-BEHCS-BULK-GULP-FEEDER',
    payload: {
      room: 'whiteroom',
      logicalWorkers: String(logicalWorkers),
      logicalGulpSize: 2_000,
      proofSlice: index,
      workerRange: `${firstWorker}..${lastWorker}`,
      forwardGnn: 'score',
      reverseGainGnn: 'demote_risk',
      shannon: 'consensus',
      gc: 'compact',
      boundary: 'bulk_feeder_no_shadow_edit'
    }
  };
}

function buildRecord(index, logicalWorkers, generatedAt, startSequence) {
  const msg = buildMessage(index, generatedAt, logicalWorkers);
  return gulpRuntime.attachBehcsPath(msg, {
    sequence: startSequence + index + 1,
    reason: 'bulk_gulp_feeder',
    remoteMeta: {
      ip: '127.0.0.1',
      port: 4947,
      method: 'BULK_LOCAL',
      protocol: 'behcs'
    },
    reflex: {
      action: 'bulk_gulp_feeder',
      runInference: true
    }
  });
}

function streamRecords({ count, logicalWorkers, generatedAt, startSequence, execute, writer }) {
  const digest = crypto.createHash('sha256');
  let lastPathGlyph = '';
  let lastMessageGlyph = '';
  let written = 0;
  if (execute && writer) writer.open();
  try {
  for (let i = 0; i < count; i += 1) {
      const record = buildRecord(i, logicalWorkers, generatedAt, startSequence);
      if (i > 0) digest.update('|');
      digest.update(String(record.pathGlyph || ''));
      lastPathGlyph = record.pathGlyph || lastPathGlyph;
      lastMessageGlyph = record.messageGlyph || lastMessageGlyph;
      if (execute && writer) {
        writer.write(record);
        written += 1;
      }
    }
  } finally {
    if (execute && writer) writer.close();
  }
  return {
    recordDigest: digest.digest('hex'),
    lastPathGlyph,
    lastMessageGlyph,
    written
  };
}

function buildCube(summary, shannonPacket, generatedAt) {
  const cube = {
    id: 'behcs-bulk-gulp-feeder',
    generatedAt,
    primaryCatalog: { D: 42, name: 'ORCHESTRATION', prime: 181 },
    touches: [35, 37, 38, 39, 42, 47, 59],
    gates: ['law001', 'brown_hilbert', 'bulk_feeder', 'gulp_2000', 'whiteroom', 'gnn', 'shannon', 'gc'],
    payload: {
      kind: 'behcs-bulk-gulp-feeder',
      status: summary.status,
      mode: MODE,
      count: summary.count,
      gulp: summary.gulp,
      shannon: {
        consensus: shannonPacket.consensus,
        executionDisposition: shannonPacket.executionDisposition
      }
    },
    translate: {
      human: 'Bulk feeder hands sealed path records to existing BEHCS Gulp without editing shadow/runtime files.',
      agent: '(bulk_feeder, behcs, gulp2000, whiteroom, gnn, shannon, gc, law001)',
      device: 'node tools/behcs-bulk-gulp-feeder.js run --execute --count=2000'
    }
  };
  return `// cube: behcs-bulk-gulp-feeder | D42 ORCHESTRATION\nexport const CUBE = ${JSON.stringify(cube, null, 2)}\n`;
}

function buildReport(summary, shannonPacket, generatedAt) {
  const json = {
    reportId: 'behcs-bulk-gulp-feeder-latest',
    generatedAt,
    status: summary.status,
    summary,
    shannon: shannonPacket
  };

  const md = `# BEHCS Bulk Gulp Feeder

Generated: ${generatedAt}

Status: ${summary.status}

This feeder does not edit shadow files or \`tools/behcs/behcs-gulp-runtime.js\`. It uses the runtime's exported \`attachBehcsPath()\` to seal records, bulk-appends them to \`message-paths.ndjson\`, updates collector state coherently, then calls the existing \`runGulpRehydration()\`.
The feeder now streams records through a buffered NDJSON writer and computes the record digest incrementally, so it no longer materializes the full record batch in memory.

## Results

- Records fed: ${summary.count}
- Records written: ${summary.recordsWritten}
- Write buffer size: ${summary.writeBufferSize}
- Logical workers represented: ${summary.logicalWorkers}
- Feed elapsed: ${summary.feedElapsedMs} ms
- Gulp elapsed: ${summary.gulpElapsedMs} ms
- Total elapsed: ${summary.elapsedMs} ms
- Gulp ok: ${summary.gulp.ok}
- Gulp id: ${summary.gulp.gulpId || '(none)'}
- Processed messages: ${summary.gulp.processedMessages || 0}
- Mistakes detected: ${summary.gulp.mistakesDetected || 0}
- GNN edges: ${summary.gulp.gnnEdges || 0}
- Final sinceLastGulp: ${summary.finalState.sinceLastGulp}
- Final buffer depth: ${summary.finalBufferDepth}

## Shannon

- Consensus: ${shannonPacket.consensus}
- Execution: ${shannonPacket.executionDisposition}
`;
  return { json, md };
}

async function run(options = {}) {
  const count = safeInt(options.count, DEFAULT_COUNT);
  const logicalWorkers = safeInt(options.logicalWorkers, DEFAULT_LOGICAL_WORKERS);
  const execute = options.execute === true;
  const generatedAt = new Date().toISOString();
  const start = Date.now();
  const beforeStatus = gulpRuntime.collectorStatus();
  const beforeState = beforeStatus.state || {};
  const startSequence = safeInt(beforeState.totalReceived, 0);
  let stream = streamRecords({ count, logicalWorkers, generatedAt, startSequence, execute: false });
  let feedElapsedMs = 0;
  let gulp = { ok: true, skipped: true, reason: 'preview' };
  let gulpElapsedMs = 0;
  let finalStatus = beforeStatus;

  if (execute) {
    const feedStart = Date.now();
    const writer = new BufferedNdjsonWriter(GC_BUFFER_PATH, DEFAULT_WRITE_BUFFER);
    stream = streamRecords({ count, logicalWorkers, generatedAt, startSequence, execute: true, writer });
    const retained = trimBuffer(Math.max(count + 500, 2_500));
    updateStatePatch({
      totalReceived: startSequence + count,
      sinceLastGulp: safeInt(beforeState.sinceLastGulp, 0) + count,
      lastReceivedAt: generatedAt,
      lastPathGlyph: stream.lastPathGlyph || beforeState.lastPathGlyph || '',
      lastMessageGlyph: stream.lastMessageGlyph || beforeState.lastMessageGlyph || '',
      lastError: '',
      lastFileCapReason: 'bulk_gulp_feeder'
    });
    feedElapsedMs = Date.now() - feedStart;
    const gulpStart = Date.now();
    gulp = await gulpRuntime.runGulpRehydration({ reason: 'bulk_gulp_feeder' });
    gulpElapsedMs = Date.now() - gulpStart;
    finalStatus = gulpRuntime.collectorStatus();
    finalStatus.bulkRetainedAfterAppend = retained;
  }

  const elapsedMs = Date.now() - start;
  const summary = {
    summaryId: 'behcs-bulk-gulp-feeder-summary',
    generatedAt,
    status: execute ? 'BULK_GULP_FEEDER_COMPLETE' : 'BULK_GULP_FEEDER_PREVIEW',
    mode: MODE,
    count,
    logicalWorkers,
    recordDigest: stream.recordDigest,
    recordsWritten: stream.written,
    writeBufferSize: DEFAULT_WRITE_BUFFER,
    feedElapsedMs,
    gulpElapsedMs,
    elapsedMs,
    beforeState,
    gulp,
    finalState: finalStatus.state || beforeState,
    finalBufferDepth: finalStatus.bufferDepth || 0,
    honesty: {
      editsShadowFiles: false,
      editsBehcsGulpRuntime: false,
      writesRuntimeData: execute,
      callsExistingGulpRuntime: execute
    },
    outputs: {
      reportJson: repoRel(REPORT_JSON),
      reportMd: repoRel(REPORT_MD),
      state: repoRel(STATE_PATH),
      cube: repoRel(CUBE_PATH)
    }
  };
  const shannonPacket = {
    integrationId: 'behcs-bulk-gulp-feeder-shannon',
    generatedAt,
    status: summary.status,
    consensus: gulp.ok === false ? 'HALT-BULK-GULP-FEEDER' : 'PROCEED-BULK-GULP-FEEDER',
    executionDisposition: 'existing_gulp_runtime_no_shadow_edits',
    votes: [
      { part: 'law001', vote: 'PASS', reason: 'No port closure or runtime-file edit.' },
      { part: 'brown_hilbert', vote: 'PASS', reason: 'Records sealed through attachBehcsPath before ingestion.' },
      { part: 'gulp', vote: gulp.ok === false ? 'FAIL' : 'PASS', reason: gulp.ok === false ? String(gulp.reason || 'gulp failed') : `Processed ${gulp.processedMessages || 0} messages.` },
      { part: 'gc', vote: 'PASS', reason: 'Existing collector performed compaction/reporting.' }
    ]
  };
  const hermesPacket = {
    integrationId: 'behcs-bulk-gulp-feeder-hermes',
    generatedAt,
    status: summary.status,
    packet: {
      verb: 'EVT-HERMES-BEHCS-BULK-GULP-FEEDER',
      summary: 'Bulk feeder proof ran through existing BEHCS Gulp runtime.',
      outputs: summary.outputs
    }
  };
  const cube = buildCube(summary, shannonPacket, generatedAt);
  const report = buildReport(summary, shannonPacket, generatedAt);

  if (execute) {
    writeJson(REPORT_JSON, report.json);
    writeText(REPORT_MD, report.md);
    writeJson(STATE_PATH, {
      savedAt: generatedAt,
      status: summary.status,
      mode: MODE,
      report: repoRel(REPORT_MD)
    });
    writeJson(HERMES_PATH, hermesPacket);
    writeJson(SHANNON_PATH, shannonPacket);
    writeText(CUBE_PATH, cube);
  }

  return {
    ok: true,
    action: execute ? 'run' : 'preview',
    generatedAt,
    status: summary.status,
    count,
    recordsWritten: summary.recordsWritten,
    writeBufferSize: summary.writeBufferSize,
    logicalWorkers,
    feedElapsedMs,
    gulpElapsedMs,
    elapsedMs,
    gulp: {
      ok: gulp.ok,
      gulpId: gulp.gulpId,
      processedMessages: gulp.processedMessages,
      mistakesDetected: gulp.mistakesDetected,
      gnnEdges: gulp.gnnEdges
    },
    finalSinceLastGulp: summary.finalState.sinceLastGulp,
    finalBufferDepth: summary.finalBufferDepth,
    outputs: summary.outputs
  };
}

function parseArgValue(argv, name, fallback) {
  const prefix = `--${name}=`;
  const found = argv.find((arg) => String(arg).startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

function main(argv) {
  const action = argv[2] || 'status';
  const execute = argv.includes('--execute');
  const count = safeInt(parseArgValue(argv, 'count', DEFAULT_COUNT), DEFAULT_COUNT);
  const logicalWorkers = safeInt(parseArgValue(argv, 'logical-workers', DEFAULT_LOGICAL_WORKERS), DEFAULT_LOGICAL_WORKERS);
  if (action === 'status') {
    console.log(JSON.stringify({
      ok: true,
      status: 'READY',
      mode: MODE,
      collector: gulpRuntime.collectorStatus()
    }, null, 2));
    return;
  }
  if (action === 'run') {
    run({ execute, count, logicalWorkers }).then((result) => {
      console.log(JSON.stringify(result, null, 2));
    }).catch((error) => {
      console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
      process.exitCode = 1;
    });
    return;
  }
  console.error(JSON.stringify({
    ok: false,
    error: `Unknown action: ${action}`,
    usage: [
      'node tools/behcs-bulk-gulp-feeder.js status',
      'node tools/behcs-bulk-gulp-feeder.js run --execute --count=2000'
    ]
  }, null, 2));
  process.exitCode = 2;
}

main(process.argv);
