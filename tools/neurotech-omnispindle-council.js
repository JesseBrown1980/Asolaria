#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const repoRoot = path.resolve(__dirname, '..');
const VIRTUAL_AGENT_COUNT = 10000;

const MODE = Object.freeze({
  backend: 'local_filesystem_free_backend',
  cli: 'bare_node_cli',
  headless: true,
  shelllessRuntime: true,
  noServerAuth: true,
  noServerApiRoute: true,
  noExternalApiCalls: true,
  noDownloads: true,
  noInstall: true,
  noDeviceAccess: true,
  noHumanSubjectData: true,
  syntheticOnly: true,
  nonInvasiveOnly: true,
  consentRequiredBeforeLiveData: true,
  noMedicalClaims: true,
  noMindReadingClaims: true,
  virtualAgentsOnly: true,
  childProcessUse: false,
  secretMaterialWritten: false
});

const PATHS = Object.freeze({
  plan: rel('data/behcs/plans/neurotech-defense-plan.v1.json'),
  startState: rel('data/behcs/state/neurotech-defense/neurotech-consent-eeg-start.state.json'),
  latestSession: rel('data/neurotech-defense-lab/synthetic/latest-session.json'),
  consentTemplate: rel('data/neurotech-defense-lab/consent/participant-consent-template.v1.md'),
  protocol: rel('data/neurotech-defense-lab/consent/consent-protocol.v1.md'),
  safetyCard: rel('data/neurotech-defense-lab/safety/claim-and-safety-card.v1.md'),
  manifest: rel('data/neurotech-defense-lab/manifests/software-model-download-manifest.v1.json'),
  controllers: rel('data/neurotech-defense-lab/council/agents-24.v1.json'),
  workQueue: rel('data/neurotech-defense-lab/council/work-queue-10000.v1.json'),
  ballots: rel('data/neurotech-defense-lab/council/review-ballots-latest.json'),
  voteSummary: rel('data/neurotech-defense-lab/council/vote-summary-latest.json'),
  state: rel('data/behcs/state/neurotech-defense/neurotech-omnispindle-council.state.json'),
  hermes: rel('data/behcs/hermes/neurotech-defense/neurotech-omnispindle-council-dispatch-latest.json'),
  shannon: rel('data/behcs/shannon/neurotech-defense/neurotech-omnispindle-council-consensus-latest.json'),
  cube: rel('data/behcs/cubes/neurotech-omnispindle-council.cube.js'),
  reportJson: rel('reports/neurotech-omnispindle-council-latest.json'),
  reportMd: rel('reports/neurotech-omnispindle-council-latest.md'),
  inbox: rel('data/behcs/inbox.ndjson'),
  outbox: rel('data/behcs/outbox.ndjson'),
  gnnEdges: rel('data/behcs/gnn-live-edges.ndjson'),
  agentShannonState: rel('data/behcs/state/agent-shannon-state.ndjson')
});

const CONTROLLER_BLUEPRINT = [
  ['consent_authority', 'consent_controller', 'Verifies signed, explicit, revocable consent before human data.'],
  ['consent_authority', 'scope_controller', 'Enforces non-invasive EEG/EMG/ECG/EDA/EOG/respiration scope only.'],
  ['safety_claims', 'claim_guard_controller', 'Blocks mind-reading, diagnosis, deception detection, coercion, and guaranteed enhancement.'],
  ['signal_pipeline', 'synthetic_first_controller', 'Requires synthetic pipeline success before public or live data.'],
  ['storage_provenance', 'download_manifest_controller', 'Blocks all software/model/dataset downloads without manifest approval.'],
  ['storage_provenance', 'provenance_controller', 'Checks official source, license, hash, publisher, and reproducibility.'],
  ['storage_provenance', 'storage_controller', 'Keeps datasets/models off C: and inside approved reserve roots.'],
  ['storage_provenance', 'git_leak_controller', 'Blocks raw participant data, consent forms, secrets, or identifiers in Git.'],
  ['consent_authority', 'pseudonymization_controller', 'Requires subject IDs, no direct identifiers, and deletion path.'],
  ['signal_pipeline', 'bids_metadata_controller', 'Requires BIDS-like metadata, device info, sample rate, channel map, and event markers.'],
  ['signal_pipeline', 'signal_quality_controller', 'Blocks interpretation on poor contact, noise, drift, artifacts, or missing impedance metadata.'],
  ['signal_pipeline', 'artifact_controller', 'Reviews blink, motion, line noise, muscle, saturation, and clipping.'],
  ['safety_claims', 'device_controller', 'Blocks device access unless owned hardware, operator approval, consent, and dry-run mode pass.'],
  ['consent_authority', 'session_control_controller', 'Requires clear start, stop, pause, delete, and participant explanation controls.'],
  ['model_validation', 'model_card_controller', 'Requires intended use, limits, calibration, benchmark results, and uncertainty.'],
  ['model_validation', 'baseline_controller', 'Requires classical baselines before deep learning lanes.'],
  ['model_validation', 'uncertainty_controller', 'Forces confidence and uncertainty display in all user-facing feedback.'],
  ['review_release', 'ui_feedback_controller', 'Ensures feedback is training-support language, not hidden scoring or judgment.'],
  ['safety_claims', 'medical_boundary_controller', 'Blocks diagnosis, treatment, clinical triage, or health decision claims.'],
  ['safety_claims', 'protected_trait_controller', 'Blocks protected-trait, emotion, intent, deception, or private-thought inference.'],
  ['safety_claims', 'red_team_claims_controller', 'Searches for harmful/coercive/mind-control wording and quarantines offenders.'],
  ['review_release', 'audit_controller', 'Requires immutable report entries for approvals, gates, datasets, models, and sessions.'],
  ['consent_authority', 'rollback_delete_controller', 'Verifies participant deletion and operator rollback procedures.'],
  ['review_release', 'release_controller', 'Only promotes artifacts when mandatory controllers pass and vetoes are absent.']
];

const VETO_CONTROLLERS = new Set([
  'consent_controller',
  'scope_controller',
  'claim_guard_controller',
  'download_manifest_controller',
  'storage_controller',
  'git_leak_controller',
  'pseudonymization_controller',
  'device_controller',
  'session_control_controller',
  'medical_boundary_controller',
  'protected_trait_controller',
  'red_team_claims_controller',
  'rollback_delete_controller',
  'release_controller'
]);

function rel(p) {
  return path.join(repoRoot, p);
}

function repoRel(p) {
  return path.relative(repoRoot, p).replace(/\\/g, '/');
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
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

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_) {
    return null;
  }
}

function readText(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (_) {
    return '';
  }
}

function exists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (_) {
    return false;
  }
}

function sha256Text(input) {
  return crypto.createHash('sha256').update(String(input)).digest('hex');
}

function buildControllers() {
  let cursor = 1;
  const base = Math.floor(VIRTUAL_AGENT_COUNT / CONTROLLER_BLUEPRINT.length);
  const remainder = VIRTUAL_AGENT_COUNT % CONTROLLER_BLUEPRINT.length;

  return CONTROLLER_BLUEPRINT.map(([omnispindle, id, purpose], index) => {
    const shardCount = base + (index < remainder ? 1 : 0);
    const start = cursor;
    const end = cursor + shardCount - 1;
    cursor = end + 1;
    return {
      id,
      index: index + 1,
      omnispindle,
      flywheel: `FW-${String(index + 1).padStart(2, '0')}-${id.toUpperCase().replace(/_/g, '-')}`,
      authority: 'review_vote_only',
      virtualShardRange: {
        start: `VA-${String(start).padStart(5, '0')}`,
        end: `VA-${String(end).padStart(5, '0')}`,
        count: shardCount
      },
      purpose
    };
  });
}

function loadEvidence() {
  const latest = readJson(PATHS.latestSession);
  const metadata = latest?.metadata ? readJson(rel(latest.metadata)) : null;
  const metrics = latest?.metrics ? readJson(rel(latest.metrics)) : null;
  const csvPath = latest?.csv ? rel(latest.csv) : null;
  const csv = csvPath ? readText(csvPath) : '';
  const rows = csv.trim() ? csv.trim().split(/\r?\n/) : [];
  const header = rows[0] || '';
  const manifest = readJson(PATHS.manifest);
  const plan = readJson(PATHS.plan);
  const startState = readJson(PATHS.startState);

  return {
    latest,
    metadata,
    metrics,
    csvPath,
    rows,
    header,
    manifest,
    plan,
    startState,
    consentTemplate: readText(PATHS.consentTemplate),
    protocol: readText(PATHS.protocol),
    safetyCard: readText(PATHS.safetyCard)
  };
}

function csvAnalysis(evidence) {
  if (!evidence.rows.length || !evidence.metadata) {
    return { ok: false, rowCount: evidence.rows.length, errors: ['missing_csv_or_metadata'] };
  }
  const header = evidence.rows[0].split(',');
  const channels = header.slice(2);
  const expectedSamples = Number(evidence.metadata.sampleRateHz) * Number(evidence.metadata.durationSeconds);
  const errors = [];
  const stats = Object.fromEntries(channels.map((channel) => [channel, { min: Infinity, max: -Infinity, sumAbs: 0 }]));
  let previousTime = -1;
  let dataRows = 0;
  for (const line of evidence.rows.slice(1)) {
    const cols = line.split(',');
    if (cols.length !== header.length) errors.push('row_width_mismatch');
    const time = Number(cols[0]);
    if (!Number.isFinite(time) || time <= previousTime) errors.push('timestamp_not_strictly_increasing');
    previousTime = time;
    const expectedEvent = eventForSecond(time / 1000, evidence.metadata.eventSchedule);
    if (cols[1] !== expectedEvent) errors.push('event_schedule_mismatch');
    channels.forEach((channel, index) => {
      const value = Number(cols[index + 2]);
      if (!Number.isFinite(value)) errors.push('non_finite_signal');
      stats[channel].min = Math.min(stats[channel].min, value);
      stats[channel].max = Math.max(stats[channel].max, value);
      stats[channel].sumAbs += Math.abs(value);
    });
    dataRows += 1;
  }

  const metricErrors = [];
  if (evidence.metrics?.channelStats) {
    for (const channel of channels) {
      const computed = stats[channel];
      const recorded = evidence.metrics.channelStats[channel];
      if (!recorded) {
        metricErrors.push(`missing_metric_${channel}`);
        continue;
      }
      const meanAbs = Math.round((computed.sumAbs / Math.max(dataRows, 1)) * 100) / 100;
      if (Math.abs(recorded.minMicrovolts - Math.round(computed.min * 100) / 100) > 0.02) metricErrors.push(`min_${channel}`);
      if (Math.abs(recorded.maxMicrovolts - Math.round(computed.max * 100) / 100) > 0.02) metricErrors.push(`max_${channel}`);
      if (Math.abs(recorded.meanAbsMicrovolts - meanAbs) > 0.02) metricErrors.push(`meanAbs_${channel}`);
    }
  } else {
    metricErrors.push('missing_channel_metrics');
  }

  const uniqueErrors = Array.from(new Set([...errors, ...metricErrors]));
  return {
    ok: uniqueErrors.length === 0 && dataRows === expectedSamples,
    rowCount: evidence.rows.length,
    dataRows,
    expectedSamples,
    firstTime: evidence.rows[1]?.split(',')[0] || null,
    lastTime: evidence.rows[evidence.rows.length - 1]?.split(',')[0] || null,
    header: evidence.header,
    channels,
    errors: uniqueErrors
  };
}

function eventForSecond(second, schedule = []) {
  const match = schedule.find((entry) => second >= entry.fromSecond && second < entry.toSecond);
  return match?.event || 'unknown';
}

function buildChecks(evidence) {
  const headerColumns = evidence.header.split(',');
  const channels = headerColumns.slice(2);
  const csv = csvAnalysis(evidence);
  const checks = [
    check('defense_plan_exists', Boolean(evidence.plan), repoRel(PATHS.plan)),
    check('starter_state_exists', Boolean(evidence.startState), repoRel(PATHS.startState)),
    check('consent_template_exists', evidence.consentTemplate.includes('Participant Consent Template'), repoRel(PATHS.consentTemplate)),
    check('protocol_exists', evidence.protocol.includes('Consent-Based EEG'), repoRel(PATHS.protocol)),
    check('claim_safety_card_exists', evidence.safetyCard.includes('Blocked language'), repoRel(PATHS.safetyCard)),
    check('download_manifest_blocked', evidence.manifest?.status === 'DOWNLOADS_BLOCKED_PENDING_APPROVAL', evidence.manifest?.status || 'missing'),
    check('latest_session_pointer_exists', Boolean(evidence.latest?.sessionId), evidence.latest?.sessionId || 'missing'),
    check('metadata_synthetic_true', evidence.metadata?.synthetic === true, String(evidence.metadata?.synthetic)),
    check('metadata_no_mind_reading', evidence.metadata?.capabilityPolicy?.mindReading === 'not_claimed', evidence.metadata?.capabilityPolicy?.mindReading || 'missing'),
    check('csv_has_1280_samples_plus_header', evidence.rows.length === 1281, `${evidence.rows.length} row(s)`),
    check('csv_schema_exact', evidence.header === 'time_ms,event,Fp1,Fp2,C3,C4,P3,P4,O1,O2', evidence.header),
    check('csv_sampling_and_events_valid', csv.ok, csv.errors.join(',') || `${csv.dataRows}/${csv.expectedSamples} samples`),
    check('csv_has_8_channels', channels.length === 8, channels.join(',')),
    check('metrics_recompute_pass', csv.errors.filter((entry) => /^(min|max|meanAbs|missing_metric|missing_channel_metrics)/.test(entry)).length === 0, csv.errors.join(',') || 'metrics match csv'),
    check('metrics_synthetic_pass', evidence.metrics?.signalQuality === 'synthetic_pass', evidence.metrics?.signalQuality || 'missing'),
    check('live_data_gate_closed', evidence.startState?.mode?.noHumanSubjectData === true && evidence.startState?.mode?.noDeviceAccess === true, 'noHumanSubjectData/noDeviceAccess')
  ];
  return checks;
}

function check(id, ok, detail) {
  return { id, ok: Boolean(ok), detail: String(detail || '') };
}

function controllerVote(controller, checks) {
  const failed = checks.filter((entry) => !entry.ok);
  const scopeFailures = failed.filter((entry) => {
    if (controller.omnispindle === 'consent_authority') return /consent|protocol|live_data|starter/.test(entry.id);
    if (controller.omnispindle === 'safety_claims') return /claim|mind|live_data|manifest/.test(entry.id);
    if (controller.omnispindle === 'signal_pipeline') return /csv|metadata|metrics|session/.test(entry.id);
    if (controller.omnispindle === 'model_validation') return /metrics|metadata|plan/.test(entry.id);
    if (controller.omnispindle === 'storage_provenance') return /manifest|plan|starter/.test(entry.id);
    return true;
  });

  const vote = failed.length
    ? 'BLOCK_PROMOTION_REPAIR_REQUIRED'
    : 'PROCEED_SYNTHETIC_ONLY';

  const reviewDebt = scopeFailures.length
    ? scopeFailures.map((entry) => entry.id)
    : ['live_human_data_still_requires_future_consent_gate'];

  return {
    controllerId: controller.id,
    omnispindle: controller.omnispindle,
    flywheel: controller.flywheel,
    vetoAuthority: VETO_CONTROLLERS.has(controller.id),
    virtualShardRange: controller.virtualShardRange,
    vote,
    liveDataGate: 'CLOSED',
    promotion: 'SYNTHETIC_ONLY',
    reviewDebt,
    reviewedChecks: checks
      .filter((entry) => {
        if (controller.omnispindle === 'consent_authority') return /consent|protocol|live_data|starter/.test(entry.id);
        if (controller.omnispindle === 'safety_claims') return /claim|mind|safety|manifest|live_data/.test(entry.id);
        if (controller.omnispindle === 'signal_pipeline') return /csv|metadata|metrics|session/.test(entry.id);
        if (controller.omnispindle === 'model_validation') return /metrics|metadata|plan/.test(entry.id);
        if (controller.omnispindle === 'storage_provenance') return /manifest|plan|starter/.test(entry.id);
        return true;
      })
      .map((entry) => entry.id)
  };
}

function buildWorkQueue(controllers, generatedAt) {
  const taskFamilies = {
    consent_authority: ['consent_form_diff', 'rights_review', 'stop_control_review', 'human_data_gate'],
    safety_claims: ['blocked_claim_scan', 'harmful_tool_claim_scan', 'medical_claim_scan', 'defensive_scope_review'],
    signal_pipeline: ['csv_shape_check', 'metadata_check', 'artifact_metric_review', 'event_marker_review'],
    model_validation: ['baseline_feature_review', 'calibration_gate', 'model_card_template', 'uncertainty_display'],
    storage_provenance: ['download_manifest_review', 'hash_license_gate', 'reserve_root_layout', 'raw_data_git_block'],
    review_release: ['ballot_aggregation', 'report_review', 'ui_language_review', 'promotion_sentinel']
  };

  return {
    queueId: 'neurotech-omnispindle-work-queue-10000.v1',
    generatedAt,
    virtualAgentCount: VIRTUAL_AGENT_COUNT,
    realProcessCount: 0,
    doctrine: '10,000 virtual review shards controlled by 24 logical controllers. This is not 10,000 OS processes.',
    controllers: controllers.map((controller) => ({
      controllerId: controller.id,
      omnispindle: controller.omnispindle,
      flywheel: controller.flywheel,
      virtualShardRange: controller.virtualShardRange,
      vetoAuthority: VETO_CONTROLLERS.has(controller.id),
      taskFamilies: taskFamilies[controller.omnispindle] || taskFamilies.review_release,
      outputContract: {
        vote: 'PROCEED_SYNTHETIC_ONLY | BLOCK_PROMOTION_REPAIR_REQUIRED',
        quorum: 'Safety-critical veto controllers block promotion regardless of majority. Future widened lanes require >=80% pass and <5% block.',
        promotionCeiling: 'SYNTHETIC_ONLY',
        rawHumanData: 'DENY',
        downloads: 'DENY_PENDING_APPROVAL'
      }
    }))
  };
}

function summarizeVotes(ballots, checks) {
  const proceed = ballots.filter((entry) => entry.vote === 'PROCEED_SYNTHETIC_ONLY').length;
  const block = ballots.length - proceed;
  const failedChecks = checks.filter((entry) => !entry.ok);
  const vetoBlocks = ballots.filter((entry) => entry.vetoAuthority && entry.vote !== 'PROCEED_SYNTHETIC_ONLY');
  return {
    summaryId: 'neurotech-omnispindle-vote-summary-latest',
    virtualAgentCount: VIRTUAL_AGENT_COUNT,
    controllerCount: ballots.length,
    proceedSyntheticOnly: proceed,
    blockPromotionRepairRequired: block,
    vetoBlocks: vetoBlocks.map((entry) => entry.controllerId),
    failedChecks: failedChecks.map((entry) => entry.id),
    consensus: failedChecks.length || vetoBlocks.length ? 'BLOCK-PENDING-REVIEW' : 'PROCEED-SYNTHETIC-ONLY',
    promotionCeiling: 'SYNTHETIC_ONLY',
    readiness: 'PLAN_READY_SYNTHETIC_ONLY',
    executionReadiness: 'NOT_EXECUTION_READY',
    promotionReadiness: 'NOT_PROMOTION_READY',
    realSpawnCount: 0,
    workerDispatches: 0,
    liveDataGate: 'CLOSED',
    downloadsGate: 'CLOSED_PENDING_APPROVAL',
    deviceGate: 'CLOSED_PENDING_APPROVAL',
    humanConsentGate: 'REQUIRED_BEFORE_ANY_LIVE_DATA'
  };
}

function buildShannon(voteSummary, checks, generatedAt) {
  return {
    integrationId: 'neurotech-omnispindle-council-shannon-consensus',
    generatedAt,
    status: voteSummary.consensus === 'PROCEED-SYNTHETIC-ONLY' ? 'consensus_synthetic_council_pass' : 'consensus_block_pending_review',
    consensus: voteSummary.consensus,
    executionDisposition: '10k_virtual_agents_no_process_storm_no_download_no_device_no_human_data',
    votes: [
      { part: 'scout', vote: voteSummary.consensus, reason: 'Twenty-four controller roles reviewed the local synthetic starter evidence.' },
      { part: 'evidence', vote: voteSummary.consensus, reason: `${checks.filter((entry) => entry.ok).length}/${checks.length} hard evidence checks passed.` },
      { part: 'executor', vote: 'HALT_LIVE_DATA', reason: 'No live EEG, downloads, installs, or device access without future operator approval.' },
      { part: 'fabric', vote: voteSummary.consensus, reason: 'Controller roster, 10,000-shard work queue, ballots, vote summary, report, cube, and BEHCS events are emitted.' },
      { part: 'voice', vote: 'CLAIM_GUARD_ACTIVE', reason: 'Mind-reading and medical claims remain blocked; enhancement is training support only.' },
      { part: 'planner', vote: 'NEXT_APPROVAL_REQUIRED', reason: 'Next tranche is dependency/download approval and reserve-root layout, not live human data.' }
    ]
  };
}

function buildHermes(voteSummary, generatedAt) {
  return {
    integrationId: 'neurotech-omnispindle-council-hermes-dispatch',
    generatedAt,
    status: voteSummary.consensus,
    mode: MODE,
    packet: {
      verb: 'EVT-HERMES-NEUROTECH-OMNISPINDLE-COUNCIL',
      summary: 'Twenty-four logical controllers voted over 10,000 virtual shards for the consent EEG starter.',
      virtualAgentCount: VIRTUAL_AGENT_COUNT,
      controllerCount: voteSummary.controllerCount,
      realSpawnCount: voteSummary.realSpawnCount,
      workerDispatches: voteSummary.workerDispatches,
      consensus: voteSummary.consensus,
      readiness: voteSummary.readiness,
      executionReadiness: voteSummary.executionReadiness,
      promotionReadiness: voteSummary.promotionReadiness,
      promotionCeiling: voteSummary.promotionCeiling,
      report: repoRel(PATHS.reportMd)
    }
  };
}

function buildCube(voteSummary, shannonPacket, generatedAt) {
  const cube = {
    id: 'neurotech-omnispindle-council',
    generatedAt,
    primaryCatalog: { D: 39, name: 'CONSENSUS', prime: 167 },
    touches: [6, 20, 35, 37, 38, 39, 42, 47],
    gates: ['consent', 'claim_guard', 'synthetic_only', 'download_gate', 'device_gate', 'review_vote'],
    payload: {
      kind: '24-controller-10000-virtual-worker-council',
      mode: MODE,
      virtualAgentCount: VIRTUAL_AGENT_COUNT,
      controllerCount: voteSummary.controllerCount,
      realSpawnCount: voteSummary.realSpawnCount,
      workerDispatches: voteSummary.workerDispatches,
      readiness: voteSummary.readiness,
      executionReadiness: voteSummary.executionReadiness,
      promotionReadiness: voteSummary.promotionReadiness,
      consensus: voteSummary.consensus,
      promotionCeiling: voteSummary.promotionCeiling,
      shannon: {
        status: shannonPacket.status,
        executionDisposition: shannonPacket.executionDisposition
      }
    },
    translate: {
      human: 'Run a 24-controller logical review council over 10,000 virtual shards without spawning 10,000 processes.',
      agent: '(asolaria, neurotech, omnispindle, flywheel, 24_controllers, 10000_virtual_agents, vote_review, synthetic_only)',
      device: 'node tools/neurotech-omnispindle-council.js tick --execute'
    }
  };
  return `// cube: neurotech-omnispindle-council | neurotech | D39 CONSENSUS
export const CUBE = ${JSON.stringify(cube, null, 2)}
`;
}

function buildReport({ controllers, workQueue, ballots, voteSummary, checks, shannonPacket, generatedAt }) {
  const controllerRows = controllers.map((entry) =>
    `| ${entry.index} | ${entry.id} | ${entry.omnispindle} | ${entry.virtualShardRange.start}-${entry.virtualShardRange.end} | ${entry.virtualShardRange.count} |`
  ).join('\n');
  const checkRows = checks.map((entry) =>
    `| ${entry.id} | ${entry.ok ? 'PASS' : 'FAIL'} | ${entry.detail} |`
  ).join('\n');
  const ballotRows = ballots.map((entry) =>
    `| ${entry.controllerId} | ${entry.vote} | ${entry.liveDataGate} | ${entry.reviewDebt.join(', ')} |`
  ).join('\n');

  const json = {
    reportId: 'neurotech-omnispindle-council-latest',
    generatedAt,
    status: voteSummary.consensus,
    mode: MODE,
    controllers,
    workQueue,
    checks,
    ballots,
    voteSummary,
    shannon: shannonPacket
  };

  const md = `# Neurotech Omnispindle Council

Generated: ${generatedAt}

Status: ${voteSummary.consensus}

Twenty-four logical controller agents now govern 10,000 virtual review shards for the consent-based EEG/neurofeedback lane. This did not spawn 10,000 OS processes, download software, install packages, access devices, or use human data.

## Vote Summary

- Controllers: ${voteSummary.controllerCount}
- Virtual agents: ${voteSummary.virtualAgentCount}
- Real spawned agents: ${voteSummary.realSpawnCount}
- Worker dispatches: ${voteSummary.workerDispatches}
- Proceed synthetic-only: ${voteSummary.proceedSyntheticOnly}
- Block promotion / repair required: ${voteSummary.blockPromotionRepairRequired}
- Promotion ceiling: ${voteSummary.promotionCeiling}
- Readiness: ${voteSummary.readiness}
- Execution readiness: ${voteSummary.executionReadiness}
- Promotion readiness: ${voteSummary.promotionReadiness}
- Live data gate: ${voteSummary.liveDataGate}
- Downloads gate: ${voteSummary.downloadsGate}

## Controllers

| # | Controller | Omnispindle | Virtual Shards | Count |
| ---: | --- | --- | --- | ---: |
${controllerRows}

## Evidence Checks

| Check | Result | Detail |
| --- | --- | --- |
${checkRows}

## Ballots

| Controller | Vote | Live Gate | Review Debt |
| --- | --- | --- | --- |
${ballotRows}

## Shannon

- Consensus: ${shannonPacket.consensus}
- Execution: ${shannonPacket.executionDisposition}
`;

  return { json, md };
}

function tick({ execute = false } = {}) {
  const generatedAt = new Date().toISOString();
  const controllers = buildControllers();
  const evidence = loadEvidence();
  const checks = buildChecks(evidence);
  const workQueue = buildWorkQueue(controllers, generatedAt);
  const ballots = controllers.map((controller) => controllerVote(controller, checks));
  const voteSummary = summarizeVotes(ballots, checks);
  const shannonPacket = buildShannon(voteSummary, checks, generatedAt);
  const hermesPacket = buildHermes(voteSummary, generatedAt);
  const cube = buildCube(voteSummary, shannonPacket, generatedAt);
  const report = buildReport({ controllers, workQueue, ballots, voteSummary, checks, shannonPacket, generatedAt });
  const eventId = `neurotech-omnispindle-council-${Date.now()}`;

  if (execute) {
    writeJson(PATHS.controllers, controllers);
    writeJson(PATHS.workQueue, workQueue);
    writeJson(PATHS.ballots, { generatedAt, ballots });
    writeJson(PATHS.voteSummary, voteSummary);
    writeJson(PATHS.state, {
      savedAt: generatedAt,
      status: voteSummary.consensus,
      mode: MODE,
      virtualAgentCount: VIRTUAL_AGENT_COUNT,
      controllerCount: controllers.length,
      realSpawnCount: voteSummary.realSpawnCount,
      workerDispatches: voteSummary.workerDispatches,
      readiness: voteSummary.readiness,
      executionReadiness: voteSummary.executionReadiness,
      promotionReadiness: voteSummary.promotionReadiness,
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
      to: 'neurotech-omnispindle-council',
      verb: 'EVT-NEUROTECH-OMNISPINDLE-COUNCIL',
      body: { status: voteSummary.consensus, virtualAgentCount: VIRTUAL_AGENT_COUNT, report: repoRel(PATHS.reportMd) }
    });
    appendNdjson(PATHS.outbox, {
      id: `${eventId}-hermes`,
      ts: generatedAt,
      from: 'hermes',
      to: 'neurotech-omnispindle-council',
      verb: hermesPacket.packet.verb,
      body: hermesPacket
    });
    appendNdjson(PATHS.gnnEdges, {
      id: `${eventId}-edge`,
      ts: generatedAt,
      from: 'neurotech_24_controller_council',
      to: 'neurotech_10000_virtual_workers',
      verb: 'controls_votes_reviews',
      weight: voteSummary.consensus === 'PROCEED-SYNTHETIC-ONLY' ? 0.9 : 0.3
    });
    appendNdjson(PATHS.agentShannonState, {
      seq: Date.now(),
      timestamp: generatedAt,
      intent: 'neurotech_omnispindle_council',
      verb: 'vote.consensus',
      target: 'consent-eeg-synthetic-starter',
      scope: 'synthetic_only',
      proof: repoRel(PATHS.shannon),
      event: voteSummary.consensus,
      status: shannonPacket.status,
      executionDisposition: shannonPacket.executionDisposition
    });
  }

  return {
    ok: voteSummary.failedChecks.length === 0,
    action: execute ? 'tick' : 'preview',
    generatedAt,
    status: voteSummary.consensus,
    virtualAgentCount: VIRTUAL_AGENT_COUNT,
    controllerCount: controllers.length,
    realSpawnCount: voteSummary.realSpawnCount,
    workerDispatches: voteSummary.workerDispatches,
    readiness: voteSummary.readiness,
    executionReadiness: voteSummary.executionReadiness,
    promotionReadiness: voteSummary.promotionReadiness,
    proceedSyntheticOnly: voteSummary.proceedSyntheticOnly,
    blockPromotionRepairRequired: voteSummary.blockPromotionRepairRequired,
    failedChecks: voteSummary.failedChecks,
    shannon: {
      status: shannonPacket.status,
      consensus: shannonPacket.consensus
    },
    outputs: {
      controllers: repoRel(PATHS.controllers),
      workQueue: repoRel(PATHS.workQueue),
      ballots: repoRel(PATHS.ballots),
      voteSummary: repoRel(PATHS.voteSummary),
      state: repoRel(PATHS.state),
      hermes: repoRel(PATHS.hermes),
      shannon: repoRel(PATHS.shannon),
      cube: repoRel(PATHS.cube),
      reportJson: repoRel(PATHS.reportJson),
      reportMd: repoRel(PATHS.reportMd)
    },
    mode: MODE
  };
}

function main(argv) {
  const action = argv[2] || 'status';
  const execute = argv.includes('--execute');
  if (action === 'status') {
    console.log(JSON.stringify(tick({ execute: false }), null, 2));
    return;
  }
  if (action === 'tick') {
    console.log(JSON.stringify(tick({ execute }), null, 2));
    return;
  }
  console.error(JSON.stringify({
    ok: false,
    error: `Unknown action: ${action}`,
    usage: [
      'node tools/neurotech-omnispindle-council.js status',
      'node tools/neurotech-omnispindle-council.js tick --execute'
    ]
  }, null, 2));
  process.exitCode = 2;
}

main(process.argv);
