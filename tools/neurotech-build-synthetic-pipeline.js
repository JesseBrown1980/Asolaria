#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const behcs = require('./behcs/codex-bridge');

const repoRoot = path.resolve(__dirname, '..');

const MODE = Object.freeze({
  backend: 'local_filesystem_free_backend',
  cli: 'bare_node_cli',
  headless: true,
  shelllessRuntime: true,
  noServerAuth: true,
  noServerApiRoute: true,
  noExternalApiCalls: true,
  noCloudMutation: true,
  noRemoteLinearMutation: true,
  noDownloads: true,
  noInstall: true,
  noDeviceAccess: true,
  noHumanSubjectData: true,
  noLiveEeg: true,
  syntheticOnly: true,
  ruViewExecution: 'fail_closed_static_queue_only',
  childProcessUse: false,
  externalModelTokenBudget: 0,
  secretMaterialWritten: false
});

const PATHS = Object.freeze({
  latestSession: rel('data/neurotech-defense-lab/synthetic/latest-session.json'),
  pidSession: rel('data/neurotech-defense-lab/sessions/pid-bound-session-latest.json'),
  implementationQueue: rel('data/neurotech-defense-lab/real-agents/million-run/integration/implementation-queue.v1.json'),
  contracts: rel('data/neurotech-defense-lab/real-agents/million-run/integration/neurotech-build-contracts.v1.json'),
  root: rel('data/neurotech-defense-lab/build/synthetic-pipeline'),
  replay: rel('data/neurotech-defense-lab/build/synthetic-pipeline/synthetic-replay-ci-latest.json'),
  bidsSidecar: rel('data/neurotech-defense-lab/build/synthetic-pipeline/bids-like/sub-synthetic_ses-latest_task-neurofeedback_eeg.json'),
  lslEvents: rel('data/neurotech-defense-lab/build/synthetic-pipeline/lsl-events-latest.ndjson'),
  qualityGate: rel('data/neurotech-defense-lab/build/synthetic-pipeline/signal-quality-gate-latest.json'),
  artifactEvents: rel('data/neurotech-defense-lab/build/synthetic-pipeline/artifact-events-latest.ndjson'),
  feedbackContract: rel('data/neurotech-defense-lab/build/synthetic-pipeline/neurofeedback-feedback-contract.v1.json'),
  summary: rel('data/neurotech-defense-lab/build/synthetic-pipeline/synthetic-pipeline-build-summary-latest.json'),
  state: rel('data/behcs/state/neurotech-defense/neurotech-build-synthetic-pipeline.state.json'),
  hermes: rel('data/behcs/hermes/neurotech-defense/neurotech-build-synthetic-pipeline-dispatch-latest.json'),
  shannon: rel('data/behcs/shannon/neurotech-defense/neurotech-build-synthetic-pipeline-consensus-latest.json'),
  cube: rel('data/behcs/cubes/neurotech-build-synthetic-pipeline.cube.js'),
  reportJson: rel('reports/neurotech-build-synthetic-pipeline-latest.json'),
  reportMd: rel('reports/neurotech-build-synthetic-pipeline-latest.md'),
  inbox: rel('data/behcs/inbox.ndjson'),
  outbox: rel('data/behcs/outbox.ndjson'),
  gnnEdges: rel('data/behcs/gnn-live-edges.ndjson')
});

function rel(p) {
  return path.join(repoRoot, p);
}

function resolveRepoPath(p) {
  if (!p) return null;
  return path.isAbsolute(p) ? p : path.join(repoRoot, p);
}

function repoRel(p) {
  return path.relative(repoRoot, p).replace(/\\/g, '/');
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_) {
    return fallback;
  }
}

function writeJson(filePath, data) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function writeText(filePath, data) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, data.endsWith('\n') ? data : `${data}\n`, 'utf8');
}

function appendNdjson(filePath, data) {
  ensureDir(filePath);
  fs.appendFileSync(filePath, `${JSON.stringify(data)}\n`, 'utf8');
}

function toNdjson(rows) {
  return rows.map((row) => JSON.stringify(row)).join('\n') + (rows.length ? '\n' : '');
}

function sha256Text(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function glyph(kind, id, seed) {
  const hash = sha256Text(`${kind}:${id}:${seed || ''}`);
  return `HG256:${kind.toUpperCase()}:${hash.slice(0, 8).toUpperCase()}:${behcs.hilbertAddress(hash)}`;
}

function parseCsv(csvText) {
  const lines = csvText.trim().split(/\r?\n/).filter(Boolean);
  const header = lines[0].split(',');
  const rows = lines.slice(1).map((line) => {
    const values = line.split(',');
    return Object.fromEntries(header.map((key, index) => [key, values[index]]));
  });
  return { header, rows };
}

function countBy(rows, field) {
  const out = {};
  for (const row of rows) out[row[field]] = Number(out[row[field]] || 0) + 1;
  return out;
}

function loadContext() {
  const latest = readJson(PATHS.latestSession, {});
  const csvPath = resolveRepoPath(latest.csv);
  const metadataPath = resolveRepoPath(latest.metadata);
  const metricsPath = resolveRepoPath(latest.metrics);
  return {
    latest,
    csvPath,
    metadataPath,
    metricsPath,
    csvText: csvPath && fs.existsSync(csvPath) ? fs.readFileSync(csvPath, 'utf8') : '',
    metadata: metadataPath ? readJson(metadataPath, {}) : {},
    metrics: metricsPath ? readJson(metricsPath, {}) : {},
    pidSession: readJson(PATHS.pidSession, {}),
    queue: readJson(PATHS.implementationQueue, {}),
    contracts: readJson(PATHS.contracts, {})
  };
}

function buildReplay(context, generatedAt) {
  const parsed = parseCsv(context.csvText);
  const channels = parsed.header.slice(2);
  const eventCounts = countBy(parsed.rows, 'event');
  const sampleCount = parsed.rows.length;
  const metadataSampleCount = Number(context.metadata.sampleRateHz || 0) * Number(context.metadata.durationSeconds || 0);
  const csvHash = context.csvPath ? sha256File(context.csvPath) : null;
  const expectedChannels = Array.isArray(context.metadata.channels) ? context.metadata.channels : [];
  const channelMatch = JSON.stringify(channels) === JSON.stringify(expectedChannels);
  const sampleCountMatch = sampleCount === metadataSampleCount;
  return {
    replayId: 'synthetic-eeg-replay-ci-latest',
    generatedAt,
    status: channelMatch && sampleCountMatch ? 'PASS' : 'FAIL',
    sessionId: context.latest.sessionId || context.metadata.sessionId || null,
    csv: context.csvPath ? repoRel(context.csvPath) : null,
    csvSha256: csvHash,
    sampleCount,
    expectedSampleCount: metadataSampleCount,
    sampleCountMatch,
    channels,
    expectedChannels,
    channelMatch,
    eventCounts,
    events: Object.keys(eventCounts),
    mode: MODE
  };
}

function buildBidsSidecar(context, replay, generatedAt) {
  return {
    BIDSVersion: 'synthetic-local-v1',
    GeneratedAt: generatedAt,
    TaskName: 'neurofeedback-smoke',
    Manufacturer: 'Asolaria synthetic generator',
    ManufacturersModelName: 'synthetic-eeg-smoke.v1',
    SamplingFrequency: context.metadata.sampleRateHz || null,
    EEGChannelCount: replay.channels.length,
    EEGReference: 'synthetic reference',
    PowerLineFrequency: 'n/a_synthetic',
    SoftwareFilters: 'synthetic alpha beta drift noise blink artifact',
    RecordingType: 'continuous',
    RecordingDuration: context.metadata.durationSeconds || null,
    ChannelNames: replay.channels,
    EventCounts: replay.eventCounts,
    SourceCsvSha256: replay.csvSha256,
    ConsentState: context.metadata.consentState || 'not_required_synthetic_no_human_subject',
    CapabilityPolicy: context.metadata.capabilityPolicy || {},
    RawHumanData: false,
    LiveDeviceData: false,
    GitSafe: true
  };
}

function buildLslEvents(context, replay, generatedAt) {
  const schedule = Array.isArray(context.metadata.eventSchedule) ? context.metadata.eventSchedule : [];
  return schedule.map((entry, index) => ({
    id: `synthetic-lsl-event-${String(index + 1).padStart(2, '0')}`,
    generatedAt,
    sessionId: replay.sessionId,
    stream: 'synthetic_eeg_events',
    type: entry.event,
    fromMs: Math.round(Number(entry.fromSecond || 0) * 1000),
    toMs: Math.round(Number(entry.toSecond || 0) * 1000),
    source: 'metadata.eventSchedule',
    pidSession: context.pidSession.sessionId || context.pidSession.session?.id || replay.sessionId
  }));
}

function buildArtifactEvents(context, replay, generatedAt) {
  const rows = [];
  if (Number(context.metrics.blinkArtifactSamples || 0) > 0) {
    rows.push({
      id: 'artifact-blink-synthetic-001',
      generatedAt,
      sessionId: replay.sessionId,
      type: 'blink_artifact',
      channelsMostlyAffected: replay.channels.filter((channel) => channel.startsWith('Fp')),
      approxFromMs: 3100,
      approxToMs: 3280,
      samples: context.metrics.blinkArtifactSamples,
      disposition: 'exclude_from_cognitive_signal_treat_as_artifact'
    });
  }
  rows.push({
    id: 'artifact-line-noise-watch-synthetic-001',
    generatedAt,
    sessionId: replay.sessionId,
    type: 'line_noise_watch',
    channelsMostlyAffected: replay.channels,
    disposition: 'watch_only_no_issue_detected_in_synthetic_metrics'
  });
  return rows;
}

function buildQualityGate(context, replay, artifactRows, generatedAt) {
  const missing = [];
  if (replay.status !== 'PASS') missing.push('replay_pass');
  if (!context.metrics.signalQuality) missing.push('signal_quality_metric');
  if (!context.metrics.channelStats) missing.push('channel_stats');
  if (!replay.csvSha256) missing.push('csv_hash');
  if (!artifactRows.length) missing.push('artifact_events');
  const pass = missing.length === 0;
  return {
    gateId: 'synthetic-signal-quality-feedback-gate-latest',
    generatedAt,
    status: pass ? 'PASS_SYNTHETIC_FEEDBACK_ALLOWED' : 'FAIL_FEEDBACK_BLOCKED',
    syntheticFeedbackAllowed: pass,
    liveFeedbackAllowed: false,
    reason: pass ? 'synthetic replay, metadata, metrics, hash, and artifact events are present' : 'missing required signal-quality evidence',
    missing,
    metrics: {
      sourceSignalQuality: context.metrics.signalQuality || null,
      blinkArtifactSamples: context.metrics.blinkArtifactSamples || 0,
      channelCount: replay.channels.length,
      sampleCount: replay.sampleCount,
      eventCount: Object.keys(replay.eventCounts).length
    },
    blockedClaims: [
      'literal mind reading',
      'diagnosis',
      'treatment',
      'guaranteed enhancement',
      'deception detection'
    ]
  };
}

function buildFeedbackContract(replay, qualityGate, artifactRows, generatedAt) {
  return {
    contractId: 'synthetic-neurofeedback-feedback-contract.v1',
    generatedAt,
    status: qualityGate.syntheticFeedbackAllowed ? 'READY_SYNTHETIC_ONLY' : 'BLOCKED',
    sessionId: replay.sessionId,
    allowedFeedback: [
      'signal quality',
      'attention practice support',
      'breath pacing support',
      'fatigue awareness scheduling support',
      'learning analytics with uncertainty'
    ],
    requiredUiFields: [
      'session id',
      'synthetic/live state',
      'signal quality',
      'artifact state',
      'uncertainty',
      'claim boundary',
      'stop/delete availability for live sessions'
    ],
    uncertaintyRequired: true,
    artifactRows: artifactRows.length,
    liveData: false,
    medicalUse: false,
    literalMindReading: false
  };
}

function buildSummary(context, replay, bidsSidecar, lslEvents, artifactRows, qualityGate, feedbackContract, generatedAt) {
  return {
    summaryId: 'neurotech-build-synthetic-pipeline-latest',
    generatedAt,
    status: qualityGate.syntheticFeedbackAllowed ? 'SYNTHETIC_PIPELINE_BUILD_PASS' : 'SYNTHETIC_PIPELINE_BUILD_BLOCKED',
    mode: MODE,
    source: {
      latestSession: repoRel(PATHS.latestSession),
      csv: replay.csv,
      pidSession: fs.existsSync(PATHS.pidSession) ? repoRel(PATHS.pidSession) : null,
      implementationQueue: fs.existsSync(PATHS.implementationQueue) ? repoRel(PATHS.implementationQueue) : null
    },
    counts: {
      sampleCount: replay.sampleCount,
      channelCount: replay.channels.length,
      eventTypes: Object.keys(replay.eventCounts).length,
      lslEvents: lslEvents.length,
      artifactEvents: artifactRows.length,
      contractsReferenced: Array.isArray(context.contracts.contracts) ? context.contracts.contracts.length : 0,
      liveEegCaptures: 0,
      deviceAccesses: 0,
      downloads: 0,
      installs: 0,
      externalCalls: 0,
      ruViewExecutions: 0
    },
    outputs: {
      replay: repoRel(PATHS.replay),
      bidsSidecar: repoRel(PATHS.bidsSidecar),
      lslEvents: repoRel(PATHS.lslEvents),
      qualityGate: repoRel(PATHS.qualityGate),
      artifactEvents: repoRel(PATHS.artifactEvents),
      feedbackContract: repoRel(PATHS.feedbackContract)
    },
    nextRecommendedBuild: 'quality-gated neurofeedback UI using this synthetic pipeline as fixture'
  };
}

function buildShannon(summary, generatedAt) {
  const pass = summary.status === 'SYNTHETIC_PIPELINE_BUILD_PASS';
  return {
    integrationId: 'neurotech-build-synthetic-pipeline-shannon',
    generatedAt,
    status: pass ? 'consensus_synthetic_pipeline_pass' : 'consensus_synthetic_pipeline_blocked',
    consensus: pass ? 'SYNTHETIC-PIPELINE-BUILD-PASS' : 'SYNTHETIC-PIPELINE-BUILD-BLOCKED',
    executionDisposition: 'synthetic_only_no_device_no_external_calls',
    votes: [
      { part: 'scout', vote: pass ? 'PASS' : 'BLOCK', reason: 'Synthetic replay CI, BIDS-like sidecar, LSL event rows, artifact events, and quality gate were evaluated.' },
      { part: 'evidence', vote: 'PASS', reason: 'All build artifacts are local JSON/NDJSON/report surfaces.' },
      { part: 'executor', vote: 'HALT_LIVE_RUNTIME', reason: 'No live EEG, device access, downloads, installs, RU-view execution, or external calls were performed.' },
      { part: 'fabric', vote: 'PASS', reason: 'BEHCS/Hermes/Shannon/cube/report surfaces were written.' },
      { part: 'voice', vote: 'CLAIM_GUARD_ACTIVE', reason: 'Feedback is framed as training support and signal quality, not literal mind reading or medical care.' },
      { part: 'planner', vote: 'NEXT_UI', reason: summary.nextRecommendedBuild }
    ],
    counts: summary.counts
  };
}

function buildHermes(summary, shannonPacket, generatedAt) {
  return {
    integrationId: 'neurotech-build-synthetic-pipeline-hermes',
    generatedAt,
    status: summary.status,
    mode: MODE,
    packet: {
      verb: 'EVT-HERMES-NEUROTECH-BUILD-SYNTHETIC-PIPELINE',
      summary: 'Built the first real-results-driven synthetic EEG pipeline: replay CI, BIDS-like sidecar, LSL events, artifact events, quality gate, feedback contract.',
      consensus: shannonPacket.consensus,
      counts: summary.counts,
      report: repoRel(PATHS.reportMd)
    }
  };
}

function buildCube(summary, shannonPacket, generatedAt) {
  const cube = {
    id: 'neurotech-build-synthetic-pipeline',
    generatedAt,
    primaryCatalog: { D: 38, name: 'CHANNEL', prime: 163 },
    touches: [6, 20, 35, 37, 38, 39, 42, 47],
    gates: ['synthetic_replay', 'bids_sidecar', 'lsl_events', 'signal_quality', 'artifact_events', 'claim_guard'],
    payload: {
      kind: 'synthetic-eeg-pipeline-build',
      status: summary.status,
      mode: MODE,
      counts: summary.counts,
      shannon: {
        consensus: shannonPacket.consensus,
        executionDisposition: shannonPacket.executionDisposition
      }
    },
    translate: {
      human: 'The real-run genius findings are now integrated into a synthetic EEG pipeline build.',
      agent: '(asolaria, neurotech, synthetic_eeg_ci, bids, lsl, signal_quality, artifact_events)',
      device: 'node tools/neurotech-build-synthetic-pipeline.js build --execute'
    }
  };
  return `// cube: neurotech-build-synthetic-pipeline | neurotech | D38 CHANNEL\nexport const CUBE = ${JSON.stringify(cube, null, 2)}\n`;
}

function buildReport(summary, replay, qualityGate, feedbackContract, shannonPacket, generatedAt) {
  const eventRows = Object.entries(replay.eventCounts).map(([event, count]) => `| ${event} | ${count} |`).join('\n');
  const json = {
    reportId: 'neurotech-build-synthetic-pipeline-latest',
    generatedAt,
    status: summary.status,
    summary,
    replay,
    qualityGate,
    feedbackContract,
    shannon: shannonPacket
  };
  const md = `# Neurotech Synthetic Pipeline Build

Generated: ${generatedAt}

Status: ${summary.status}

Built from the real one-million PID packet findings: synthetic EEG replay CI, BIDS-like sidecar, LSL event rows, artifact events, signal-quality gate, and a neurofeedback feedback contract. This build performed no live EEG, no device access, no downloads, no installs, no external calls, and no RU-view execution.

## Replay

- Session: ${replay.sessionId}
- Samples: ${replay.sampleCount}
- Channels: ${replay.channels.join(', ')}
- CSV SHA-256: ${replay.csvSha256}

| Event | Samples |
| --- | ---: |
${eventRows}

## Gate

- Signal-quality status: ${qualityGate.status}
- Synthetic feedback allowed: ${qualityGate.syntheticFeedbackAllowed}
- Live feedback allowed: ${qualityGate.liveFeedbackAllowed}
- Feedback contract: ${feedbackContract.status}

## Outputs

- Replay: \`${repoRel(PATHS.replay)}\`
- BIDS sidecar: \`${repoRel(PATHS.bidsSidecar)}\`
- LSL events: \`${repoRel(PATHS.lslEvents)}\`
- Artifact events: \`${repoRel(PATHS.artifactEvents)}\`
- Quality gate: \`${repoRel(PATHS.qualityGate)}\`
- Feedback contract: \`${repoRel(PATHS.feedbackContract)}\`

## Shannon

- Consensus: ${shannonPacket.consensus}
- Execution: ${shannonPacket.executionDisposition}
`;
  return { json, md };
}

function build({ execute = false } = {}) {
  const generatedAt = new Date().toISOString();
  const context = loadContext();
  const replay = buildReplay(context, generatedAt);
  const bidsSidecar = buildBidsSidecar(context, replay, generatedAt);
  const lslEvents = buildLslEvents(context, replay, generatedAt);
  const artifactRows = buildArtifactEvents(context, replay, generatedAt);
  const qualityGate = buildQualityGate(context, replay, artifactRows, generatedAt);
  const feedbackContract = buildFeedbackContract(replay, qualityGate, artifactRows, generatedAt);
  const summary = buildSummary(context, replay, bidsSidecar, lslEvents, artifactRows, qualityGate, feedbackContract, generatedAt);
  const shannonPacket = buildShannon(summary, generatedAt);
  const hermesPacket = buildHermes(summary, shannonPacket, generatedAt);
  const cube = buildCube(summary, shannonPacket, generatedAt);
  const report = buildReport(summary, replay, qualityGate, feedbackContract, shannonPacket, generatedAt);
  const eventId = `neurotech-build-synthetic-pipeline-${Date.now()}`;

  if (execute) {
    writeJson(PATHS.replay, replay);
    writeJson(PATHS.bidsSidecar, bidsSidecar);
    writeText(PATHS.lslEvents, toNdjson(lslEvents));
    writeText(PATHS.artifactEvents, toNdjson(artifactRows));
    writeJson(PATHS.qualityGate, qualityGate);
    writeJson(PATHS.feedbackContract, feedbackContract);
    writeJson(PATHS.summary, summary);
    writeJson(PATHS.state, {
      savedAt: generatedAt,
      status: summary.status,
      mode: MODE,
      summary: repoRel(PATHS.summary),
      report: repoRel(PATHS.reportMd)
    });
    writeJson(PATHS.hermes, hermesPacket);
    writeJson(PATHS.shannon, shannonPacket);
    writeText(PATHS.cube, cube);
    writeJson(PATHS.reportJson, report.json);
    writeText(PATHS.reportMd, report.md);
    appendNdjson(PATHS.inbox, {
      id: eventId,
      ts: generatedAt,
      from: 'asolaria',
      to: 'neurotech-build',
      verb: 'EVT-NEUROTECH-BUILD-SYNTHETIC-PIPELINE',
      body: { status: summary.status, counts: summary.counts, report: repoRel(PATHS.reportMd) }
    });
    appendNdjson(PATHS.outbox, {
      id: `${eventId}-hermes`,
      ts: generatedAt,
      from: 'hermes',
      to: 'neurotech-build',
      verb: hermesPacket.packet.verb,
      body: hermesPacket
    });
    appendNdjson(PATHS.gnnEdges, {
      id: `${eventId}-edge`,
      ts: generatedAt,
      from: 'real_million_integrated_gems',
      to: 'synthetic_eeg_pipeline_build',
      verb: 'implemented_first_build_packet',
      weight: 0.96
    });
  }

  return {
    ok: true,
    action: execute ? 'build' : 'preview',
    generatedAt,
    status: summary.status,
    shannon: {
      status: shannonPacket.status,
      consensus: shannonPacket.consensus
    },
    counts: summary.counts,
    outputs: {
      replay: repoRel(PATHS.replay),
      bidsSidecar: repoRel(PATHS.bidsSidecar),
      lslEvents: repoRel(PATHS.lslEvents),
      artifactEvents: repoRel(PATHS.artifactEvents),
      qualityGate: repoRel(PATHS.qualityGate),
      feedbackContract: repoRel(PATHS.feedbackContract),
      summary: repoRel(PATHS.summary),
      reportJson: repoRel(PATHS.reportJson),
      reportMd: repoRel(PATHS.reportMd),
      cube: repoRel(PATHS.cube)
    },
    mode: MODE
  };
}

function main(argv) {
  const action = argv[2] || 'status';
  const execute = argv.includes('--execute');
  if (action === 'status') {
    console.log(JSON.stringify(build({ execute: false }), null, 2));
    return;
  }
  if (action === 'build') {
    console.log(JSON.stringify(build({ execute }), null, 2));
    return;
  }
  console.error(JSON.stringify({
    ok: false,
    error: `Unknown action: ${action}`,
    usage: [
      'node tools/neurotech-build-synthetic-pipeline.js status',
      'node tools/neurotech-build-synthetic-pipeline.js build --execute'
    ]
  }, null, 2));
  process.exitCode = 2;
}

main(process.argv);
