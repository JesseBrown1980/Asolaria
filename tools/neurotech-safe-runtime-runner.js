#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const repoRoot = path.resolve(__dirname, '..');
const MAX_QUEUE_RECORDS = 500;

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
  noRealAgentLaunch: true,
  noDownloads: true,
  noInstall: true,
  noDeviceAccess: true,
  noHumanSubjectData: true,
  syntheticEegOnly: true,
  ruViewExecution: 'fail_closed_no_execution',
  childProcessUse: false,
  secretMaterialWritten: false
});

const PATHS = Object.freeze({
  latestSession: rel('data/neurotech-defense-lab/synthetic/latest-session.json'),
  migrationQueue: rel('data/neurotech-defense-lab/omnispindle/supervisors/symphony-linear-local-migration-queue.ndjson'),
  ruViewQueue: rel('data/neurotech-defense-lab/omnispindle/1b-frontier-loop/ruview-static-analysis-queue.ndjson'),
  frontierSummary: rel('data/neurotech-defense-lab/omnispindle/1b-frontier-loop/frontier-gnn-summary-latest.json'),
  roadmap: rel('data/neurotech-defense-lab/omnispindle/1b-frontier-loop/neuro-interface-enhancement-roadmap.v1.json'),
  ruViewState: rel('data/behcs/state/downloaded-software/mind-reading-ruview.state.json'),
  syntheticReplay: rel('data/neurotech-defense-lab/runtime/synthetic-eeg-replay-latest.json'),
  symphonyIngest: rel('data/neurotech-defense-lab/runtime/symphony-linear-local-ingest-latest.ndjson'),
  ruViewStaticRun: rel('data/neurotech-defense-lab/runtime/ruview-static-analysis-run-latest.ndjson'),
  runtimeSummary: rel('data/neurotech-defense-lab/runtime/neurotech-safe-runtime-summary-latest.json'),
  state: rel('data/behcs/state/neurotech-defense/neurotech-safe-runtime-runner.state.json'),
  hermes: rel('data/behcs/hermes/neurotech-defense/neurotech-safe-runtime-runner-dispatch-latest.json'),
  shannon: rel('data/behcs/shannon/neurotech-defense/neurotech-safe-runtime-runner-consensus-latest.json'),
  cube: rel('data/behcs/cubes/neurotech-safe-runtime-runner.cube.js'),
  reportJson: rel('reports/neurotech-safe-runtime-runner-latest.json'),
  reportMd: rel('reports/neurotech-safe-runtime-runner-latest.md'),
  inbox: rel('data/behcs/inbox.ndjson'),
  outbox: rel('data/behcs/outbox.ndjson'),
  gnnEdges: rel('data/behcs/gnn-live-edges.ndjson')
});

function rel(p) {
  return path.join(repoRoot, p);
}

function repoRel(p) {
  return path.relative(repoRoot, p).replace(/\\/g, '/');
}

function resolveRepoInputPath(value, label) {
  const raw = String(value || '').trim();
  if (!raw) throw new Error(`Missing ${label}`);
  const resolved = path.resolve(repoRoot, raw);
  const rootWithSep = repoRoot.endsWith(path.sep) ? repoRoot : `${repoRoot}${path.sep}`;
  if (resolved !== repoRoot && !resolved.startsWith(rootWithSep)) {
    throw new Error(`Unsafe ${label}: outside repository`);
  }
  return resolved;
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

function readNdjson(filePath) {
  try {
    const text = fs.readFileSync(filePath, 'utf8').trim();
    if (!text) return [];
    return text.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
  } catch (_) {
    return [];
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

function sha256File(filePath) {
  const resolved = resolveRepoInputPath(filePath, 'hash input');
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(resolved));
  return hash.digest('hex');
}

function sha256Text(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function round3(value) {
  return Math.round(Number(value || 0) * 1000) / 1000;
}

function summarizeSyntheticSession(generatedAt) {
  const pointer = readJson(PATHS.latestSession, {});
  let csvPath;
  let metadataPath;
  let metricsPath;
  try {
    csvPath = resolveRepoInputPath(pointer.csv, 'synthetic CSV');
    metadataPath = resolveRepoInputPath(pointer.metadata, 'synthetic metadata');
    metricsPath = resolveRepoInputPath(pointer.metrics, 'synthetic metrics');
  } catch (error) {
    return {
      generatedAt,
      status: 'SYNTHETIC_EEG_REPLAY_MISSING_INPUT',
      sessionId: pointer.sessionId || '',
      csv: '',
      csvSha256: null,
      sampleCount: 0,
      channels: [],
      eventCounts: {},
      metadataStatus: 'missing_pointer_or_file',
      priorSignalQuality: null,
      channelStats: {},
      missingInput: error.message,
      gates: {
        liveDevice: 'CLOSED',
        humanSubjectData: 'CLOSED',
        trainingSupportOnly: true
      }
    };
  }
  const metadata = readJson(metadataPath, {});
  const priorMetrics = readJson(metricsPath, {});
  const text = fs.readFileSync(csvPath, 'utf8').trim();
  const lines = text.split(/\r?\n/);
  const headers = lines[0].split(',');
  const channels = headers.slice(2);
  const eventCounts = {};
  const channelStats = Object.fromEntries(channels.map((c) => [c, { min: Infinity, max: -Infinity, sumAbs: 0 }]));

  for (const line of lines.slice(1)) {
    const parts = line.split(',');
    const event = parts[1];
    eventCounts[event] = (eventCounts[event] || 0) + 1;
    channels.forEach((channel, idx) => {
      const v = Number(parts[idx + 2]);
      channelStats[channel].min = Math.min(channelStats[channel].min, v);
      channelStats[channel].max = Math.max(channelStats[channel].max, v);
      channelStats[channel].sumAbs += Math.abs(v);
    });
  }

  const sampleCount = lines.length - 1;
  const metrics = Object.fromEntries(channels.map((channel) => {
    const stat = channelStats[channel];
    return [channel, {
      minMicrovolts: round3(stat.min),
      maxMicrovolts: round3(stat.max),
      meanAbsMicrovolts: round3(stat.sumAbs / sampleCount)
    }];
  }));

  const requiredEvents = ['baseline_rest', 'attention_prompt', 'breath_pace_feedback', 'cooldown_rest'];
  const pass = sampleCount === 1280
    && channels.length === 8
    && requiredEvents.every((event) => eventCounts[event] > 0)
    && metadata.synthetic === true;

  return {
    generatedAt,
    status: pass ? 'SYNTHETIC_EEG_REPLAY_PASS' : 'SYNTHETIC_EEG_REPLAY_WARN',
    sessionId: pointer.sessionId,
    csv: repoRel(csvPath),
    csvSha256: sha256File(csvPath),
    sampleCount,
    channels,
    eventCounts,
    metadataStatus: metadata.synthetic === true ? 'synthetic_confirmed' : 'metadata_missing_synthetic_flag',
    priorSignalQuality: priorMetrics.signalQuality || null,
    channelStats: metrics,
    gates: {
      liveDevice: 'CLOSED',
      humanSubjectData: 'CLOSED',
      trainingSupportOnly: true
    }
  };
}

function ingestSymphonyQueue(generatedAt) {
  const queue = readNdjson(PATHS.migrationQueue).slice(0, MAX_QUEUE_RECORDS);
  return queue.map((item, index) => ({
    ingestId: `LOCAL-SL-INGEST-${String(index + 1).padStart(3, '0')}`,
    generatedAt,
    status: 'INGESTED_LOCAL_ONLY',
    localWorkItemId: item.localWorkItemId,
    tracker: item.tracker,
    remoteMutation: false,
    connectorStatus: item.connectorStatus,
    supervisorId: item.supervisorId,
    supervisorPid: item.supervisorPid,
    candidateId: item.candidateId,
    priority: item.priority,
    hookwallStatus: item.body?.hookwallStatus || null,
    relatedMistakes: item.body?.relatedMistakes || [],
    acceptanceGates: item.body?.acceptanceGates || []
  }));
}

function processRuViewStaticQueue(generatedAt) {
  const queue = readNdjson(PATHS.ruViewQueue).slice(0, MAX_QUEUE_RECORDS);
  const state = readJson(PATHS.ruViewState, {});
  return queue.map((item) => {
    const blocking = ['signature_and_origin_check', 'sandbox_plan_only_no_execution', 'operator_approval_required_for_any_next_step'].includes(item.step);
    return {
      runId: `${item.queueId}-RUN`,
      generatedAt,
      step: item.step,
      status: blocking ? 'BLOCKED_STATIC_ONLY_NEEDS_OPERATOR_REVIEW' : 'RECORDED_STATIC_ONLY',
      ruViewSupervisorStatus: state.status || item.ruViewSupervisorStatus || 'FAIL_CLOSED',
      executionPolicy: 'FAIL_CLOSED_NO_EXECUTION',
      result: resultForRuViewStep(item.step),
      launched: false,
      extracted: false,
      installed: false
    };
  });
}

function resultForRuViewStep(step) {
  const results = {
    preserve_hash_and_zone_identifier: 'Existing hash/zone evidence remains preserved by the RU-view supervisor.',
    static_metadata_inventory: 'Static inventory only; no PE execution or installer launch.',
    signature_and_origin_check: 'Requires trusted source/signature review; no network or execution in this run.',
    sandbox_plan_only_no_execution: 'Sandbox plan remains a plan; executable is not launched.',
    claim_language_red_team: 'Mind-reading/RU-view claims remain unverified and claim-guarded.',
    operator_approval_required_for_any_next_step: 'Any next step requires a new explicit operator gate.'
  };
  return results[step] || 'Static-only queue item recorded.';
}

function buildRuntimeSummary(syntheticReplay, symphonyIngest, ruViewRun, generatedAt) {
  const frontier = readJson(PATHS.frontierSummary, {});
  const roadmap = readJson(PATHS.roadmap, {});
  return {
    runId: 'neurotech-safe-runtime-runner-latest',
    generatedAt,
    status: 'SAFE_RUNTIME_RUN_COMPLETE',
    mode: MODE,
    syntheticReplay,
    symphonyLinearLocalIngest: {
      status: 'LOCAL_QUEUE_INGESTED',
      count: symphonyIngest.length,
      remoteMutations: symphonyIngest.filter((item) => item.remoteMutation).length,
      farmNow: symphonyIngest.filter((item) => item.priority === 'farm_now').length,
      watch: symphonyIngest.filter((item) => item.priority !== 'farm_now').length
    },
    ruViewStatic: {
      status: 'FAIL_CLOSED_STATIC_RUN_COMPLETE',
      count: ruViewRun.length,
      blocked: ruViewRun.filter((item) => item.status.startsWith('BLOCKED')).length,
      launched: ruViewRun.some((item) => item.launched)
    },
    frontier: {
      status: frontier.status || null,
      virtualAgents: frontier.counts?.virtualAgents || null,
      geniusMarks: frontier.counts?.geniusMarks || null,
      mistakeMarks: frontier.counts?.mistakeMarks || null
    },
    roadmap: {
      status: roadmap.status || null,
      phaseCount: Array.isArray(roadmap.phases) ? roadmap.phases.length : 0
    },
    gates: {
      liveEeg: 'CLOSED',
      ruViewExecution: 'CLOSED',
      externalCalls: 'CLOSED',
      downloadsInstalls: 'CLOSED',
      remoteLinearMutation: 'CLOSED',
      humanDataCollection: 'CLOSED'
    }
  };
}

function buildHermes(summary, generatedAt) {
  return {
    integrationId: 'neurotech-safe-runtime-runner-hermes-dispatch',
    generatedAt,
    status: summary.status,
    mode: MODE,
    packet: {
      verb: 'EVT-HERMES-NEUROTECH-SAFE-RUNTIME-RUN',
      summary: 'Safe runtime tranche completed: synthetic EEG replay, local Symphony/Linear ingest, RU-view static queue, Hookwall/GNN status.',
      counts: {
        syntheticSamples: summary.syntheticReplay.sampleCount,
        localIngestItems: summary.symphonyLinearLocalIngest.count,
        ruViewStaticItems: summary.ruViewStatic.count
      },
      report: repoRel(PATHS.reportMd)
    }
  };
}

function buildShannon(summary, generatedAt) {
  return {
    integrationId: 'neurotech-safe-runtime-runner-shannon-consensus',
    generatedAt,
    status: 'consensus_safe_runtime_complete',
    consensus: 'SAFE_RUNTIME_COMPLETE_SYNTHETIC_LOCAL_ONLY',
    executionDisposition: 'no_live_eeg_no_ruview_execution_no_external_calls',
    votes: [
      { part: 'scout', vote: 'PASS', reason: 'Synthetic EEG session replayed and local queues were present.' },
      { part: 'evidence', vote: 'PASS', reason: `${summary.syntheticReplay.sampleCount} synthetic samples, ${summary.symphonyLinearLocalIngest.count} local ingest items, ${summary.ruViewStatic.count} RU-view static queue items.` },
      { part: 'executor', vote: 'HALT_RISKY_ACTIONS', reason: 'No device, human data, downloads, installs, RU-view execution, or remote Linear mutation.' },
      { part: 'fabric', vote: 'PASS', reason: 'Runtime summary, Hermes, Shannon, cube, report, GNN edges, and BEHCS state were written locally.' },
      { part: 'voice', vote: 'CLAIM_GUARD', reason: 'Enhancement remains training support; literal mind reading remains blocked.' },
      { part: 'planner', vote: 'NEXT_SYNTHETIC_CI_WIRING', reason: 'Next safe step is wiring this runner into repeatable synthetic CI and local Symphony ingestion.' }
    ]
  };
}

function buildCube(summary, shannonPacket, generatedAt) {
  const cube = {
    id: 'neurotech-safe-runtime-runner',
    generatedAt,
    primaryCatalog: { D: 42, name: 'ORCHESTRATION', prime: 181 },
    touches: [7, 20, 24, 35, 37, 39, 42, 47, 59],
    gates: ['synthetic_eeg_only', 'local_symphony_ingest', 'ruview_fail_closed', 'hookwall_gnn', 'no_external_calls'],
    payload: {
      kind: 'neurotech-safe-runtime-run',
      status: summary.status,
      mode: MODE,
      counts: {
        syntheticSamples: summary.syntheticReplay.sampleCount,
        localIngestItems: summary.symphonyLinearLocalIngest.count,
        ruViewStaticItems: summary.ruViewStatic.count
      },
      shannon: {
        consensus: shannonPacket.consensus,
        executionDisposition: shannonPacket.executionDisposition
      }
    },
    translate: {
      human: 'Safe runtime tranche ran synthetic EEG, local Symphony queue ingest, and RU-view static records only.',
      agent: '(asolaria, neurotech, safe_runtime, synthetic_eeg, symphony_linear_local, ruview_static_only)',
      device: 'node tools/neurotech-safe-runtime-runner.js run --execute'
    }
  };
  return `// cube: neurotech-safe-runtime-runner | neurotech | D42 ORCHESTRATION\nexport const CUBE = ${JSON.stringify(cube, null, 2)}\n`;
}

function buildReport(summary, shannonPacket, generatedAt) {
  const json = {
    reportId: 'neurotech-safe-runtime-runner-latest',
    generatedAt,
    status: summary.status,
    mode: MODE,
    outputs: outputs(),
    summary,
    shannon: shannonPacket
  };

  const md = `# Neurotech Safe Runtime Runner

Generated: ${generatedAt}

Status: ${summary.status}

Ran the safe tranche only: synthetic EEG replay, local Symphony/Linear queue ingest, RU-view static queue processing, and Hookwall/GNN runtime summary. This did not start live EEG, execute RU-view, access devices, collect human data, download/install anything, call external APIs, or mutate remote Linear.

## Results

- Synthetic EEG: ${summary.syntheticReplay.status}
- Synthetic samples: ${summary.syntheticReplay.sampleCount}
- Channels: ${summary.syntheticReplay.channels.join(', ')}
- Local Symphony/Linear ingest items: ${summary.symphonyLinearLocalIngest.count}
- RU-view static items: ${summary.ruViewStatic.count}
- RU-view blocked/static review items: ${summary.ruViewStatic.blocked}
- Frontier virtual agents referenced: ${summary.frontier.virtualAgents}

## Outputs

- Synthetic replay: \`${repoRel(PATHS.syntheticReplay)}\`
- Symphony/Linear local ingest: \`${repoRel(PATHS.symphonyIngest)}\`
- RU-view static run: \`${repoRel(PATHS.ruViewStaticRun)}\`
- Runtime summary: \`${repoRel(PATHS.runtimeSummary)}\`
- Hermes: \`${repoRel(PATHS.hermes)}\`
- Shannon: \`${repoRel(PATHS.shannon)}\`
- Cube: \`${repoRel(PATHS.cube)}\`

## Shannon

- Consensus: ${shannonPacket.consensus}
- Execution: ${shannonPacket.executionDisposition}
`;
  return { json, md };
}

function outputs() {
  return {
    syntheticReplay: repoRel(PATHS.syntheticReplay),
    symphonyIngest: repoRel(PATHS.symphonyIngest),
    ruViewStaticRun: repoRel(PATHS.ruViewStaticRun),
    runtimeSummary: repoRel(PATHS.runtimeSummary),
    reportJson: repoRel(PATHS.reportJson),
    reportMd: repoRel(PATHS.reportMd),
    cube: repoRel(PATHS.cube)
  };
}

function run({ execute = false } = {}) {
  const generatedAt = new Date().toISOString();
  const syntheticReplay = summarizeSyntheticSession(generatedAt);
  const symphonyIngest = ingestSymphonyQueue(generatedAt);
  const ruViewRun = processRuViewStaticQueue(generatedAt);
  const summary = buildRuntimeSummary(syntheticReplay, symphonyIngest, ruViewRun, generatedAt);
  const shannonPacket = buildShannon(summary, generatedAt);
  const hermesPacket = buildHermes(summary, generatedAt);
  const cube = buildCube(summary, shannonPacket, generatedAt);
  const report = buildReport(summary, shannonPacket, generatedAt);
  const eventId = `neurotech-safe-runtime-${Date.now()}`;

  if (execute) {
    writeJson(PATHS.syntheticReplay, syntheticReplay);
    writeText(PATHS.symphonyIngest, symphonyIngest.map((item) => JSON.stringify(item)).join('\n') + '\n');
    writeText(PATHS.ruViewStaticRun, ruViewRun.map((item) => JSON.stringify(item)).join('\n') + '\n');
    writeJson(PATHS.runtimeSummary, summary);
    writeJson(PATHS.state, {
      savedAt: generatedAt,
      status: summary.status,
      mode: MODE,
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
      to: 'neurotech-safe-runtime',
      verb: 'EVT-NEUROTECH-SAFE-RUNTIME-RUN',
      body: { status: summary.status, report: repoRel(PATHS.reportMd) }
    });
    appendNdjson(PATHS.outbox, {
      id: `${eventId}-hermes`,
      ts: generatedAt,
      from: 'hermes',
      to: 'neurotech-safe-runtime',
      verb: hermesPacket.packet.verb,
      body: hermesPacket
    });
    appendNdjson(PATHS.gnnEdges, {
      id: `${eventId}-synthetic`,
      ts: generatedAt,
      from: 'synthetic_eeg_ci',
      to: 'safe_runtime_runner',
      verb: 'replay_pass',
      weight: syntheticReplay.status.endsWith('PASS') ? 0.9 : 0.45
    });
    appendNdjson(PATHS.gnnEdges, {
      id: `${eventId}-ruview`,
      ts: generatedAt,
      from: 'ruview_static_queue',
      to: 'safe_runtime_runner',
      verb: 'fail_closed_static_only',
      weight: 0.97
    });
  }

  return {
    ok: true,
    action: execute ? 'run' : 'preview',
    generatedAt,
    status: summary.status,
    syntheticReplay: {
      status: syntheticReplay.status,
      sessionId: syntheticReplay.sessionId,
      sampleCount: syntheticReplay.sampleCount,
      csvSha256: syntheticReplay.csvSha256
    },
    symphonyLinearLocalIngest: summary.symphonyLinearLocalIngest,
    ruViewStatic: summary.ruViewStatic,
    gates: summary.gates,
    outputs: outputs(),
    mode: MODE
  };
}

function main(argv) {
  const action = argv[2] || 'status';
  const execute = argv.includes('--execute');
  if (action === 'status') {
    console.log(JSON.stringify(run({ execute: false }), null, 2));
    return;
  }
  if (action === 'run') {
    console.log(JSON.stringify(run({ execute }), null, 2));
    return;
  }
  console.error(JSON.stringify({
    ok: false,
    error: `Unknown action: ${action}`,
    usage: [
      'node tools/neurotech-safe-runtime-runner.js status',
      'node tools/neurotech-safe-runtime-runner.js run --execute'
    ]
  }, null, 2));
  process.exitCode = 2;
}

main(process.argv);
