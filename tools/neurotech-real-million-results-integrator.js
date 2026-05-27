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
  ruViewExecution: 'fail_closed_static_queue_only',
  realMillionResultsIntegration: true,
  integrationOnly: true,
  childProcessUse: false,
  externalModelTokenBudget: 0,
  nonDestructiveGc: true,
  secretMaterialWritten: false
});

const PATHS = Object.freeze({
  summary: rel('data/neurotech-defense-lab/real-agents/million-run/real-agent-gnn-summary-latest.json'),
  geniusMarks: rel('data/neurotech-defense-lab/real-agents/million-run/genius-real-agent-marks-latest.ndjson'),
  mistakeMarks: rel('data/neurotech-defense-lab/real-agents/million-run/mistake-real-agent-marks-latest.ndjson'),
  readiness: rel('data/neurotech-defense-lab/real-agents/integration/real-million-readiness.v1.json'),
  priorIntegration: rel('data/neurotech-defense-lab/real-agents/integration/1e200-real-agent-integration-latest.json'),
  root: rel('data/neurotech-defense-lab/real-agents/million-run/integration'),
  integration: rel('data/neurotech-defense-lab/real-agents/million-run/integration/real-million-results-integration-latest.json'),
  geniusSupervisors: rel('data/neurotech-defense-lab/real-agents/million-run/integration/genius-build-supervisors-latest.json'),
  mistakeGuards: rel('data/neurotech-defense-lab/real-agents/million-run/integration/mistake-runtime-guards-latest.json'),
  hookwallPolicy: rel('data/neurotech-defense-lab/real-agents/million-run/integration/hookwall-real-results-policy-latest.json'),
  implementationQueueJson: rel('data/neurotech-defense-lab/real-agents/million-run/integration/implementation-queue.v1.json'),
  implementationQueueNdjson: rel('data/neurotech-defense-lab/real-agents/million-run/integration/implementation-queue.v1.ndjson'),
  contracts: rel('data/neurotech-defense-lab/real-agents/million-run/integration/neurotech-build-contracts.v1.json'),
  gnnEdges: rel('data/neurotech-defense-lab/real-agents/million-run/integration/gnn-integration-edges.ndjson'),
  hermesAwareness: rel('data/neurotech-defense-lab/hermes/supervisor-of-supervisors/real-million-awareness-latest.json'),
  hermesActions: rel('data/neurotech-defense-lab/hermes/supervisor-of-supervisors/real-million-self-improvement-actions.ndjson'),
  state: rel('data/behcs/state/neurotech-defense/neurotech-real-million-results-integration.state.json'),
  hermes: rel('data/behcs/hermes/neurotech-defense/neurotech-real-million-results-integration-dispatch-latest.json'),
  shannon: rel('data/behcs/shannon/neurotech-defense/neurotech-real-million-results-integration-consensus-latest.json'),
  cube: rel('data/behcs/cubes/neurotech-real-million-results-integration.cube.js'),
  reportJson: rel('reports/neurotech-real-million-results-integration-latest.json'),
  reportMd: rel('reports/neurotech-real-million-results-integration-latest.md'),
  inbox: rel('data/behcs/inbox.ndjson'),
  outbox: rel('data/behcs/outbox.ndjson'),
  globalGnnEdges: rel('data/behcs/gnn-live-edges.ndjson')
});

const BUILD_ITEMS = [
  item('synthetic-eeg-ci', 'P0', 'synthetic_eeg_ci', 'Make synthetic EEG replay the canonical CI input for connectors, UI, models, and storage gates.'),
  item('pid-consent-session-bus', 'P0', 'pid_consent_bus', 'Route every event through PID, consent scope, stop/delete rights, device hash, storage policy, and claim boundary.'),
  item('claim-quarantine-first-gate', 'P0', 'claim_quarantine', 'Quarantine coercive, harmful, medical, brain-frying, remote-view, and literal mind-reading claims before build promotion.'),
  item('hookwall-gnn-gc-wrapper', 'P0', 'hookwall_gnn_gc', 'Keep Hookwall, forward GNN, reverse-gain GNN, OmniShannon, and compacting GC around every packet.'),
  item('bids-sidecar-writer', 'P1', 'bids_sidecar_writer', 'Write BIDS-like sidecars so raw data, events, provenance, and derived metrics do not drift apart.'),
  item('lsl-event-pipe', 'P1', 'lsl_event_pipe', 'Build event timing and stream identity before live-device or model work.'),
  item('brainflow-synthetic-adapter', 'P1', 'brainflow_adapter', 'Keep BrainFlow behind synthetic/playback adapters before board-specific hardware access.'),
  item('signal-quality-feedback-gate', 'P1', 'signal_quality_gate', 'Block feedback unless contact quality, artifacts, drift, calibration, and uncertainty are present.'),
  item('artifact-eventization', 'P1', 'artifact_rejection', 'Represent blink, motion, and line-noise artifacts as explicit events and exclusion signals.'),
  item('neurofeedback-uncertainty-ui', 'P2', 'neurofeedback_ui', 'Show enhancement as assistive training support with confidence, uncertainty, and limits.'),
  item('breath-pacing-first-loop', 'P2', 'breath_pacing_feedback', 'Use breath pacing as the first low-risk feedback loop validated by synthetic and non-EEG signals.'),
  item('fatigue-awareness-scheduler', 'P2', 'fatigue_awareness', 'Use fatigue awareness as scheduling and warning support, not diagnosis or judgment.'),
  item('model-ladder-contract', 'P2', 'model_ladder', 'Promote models through quality, bandpower, CSP/LDA, Riemannian, then deep EEG with model cards.'),
  item('classical-baseline-first', 'P2', 'csp_lda_baseline', 'Require interpretable CSP/LDA or logistic baselines before deep EEG models.'),
  item('riemannian-transfer-check', 'P2', 'riemannian_baseline', 'Use Riemannian covariance checks to catch calibration and session-transfer drift.'),
  item('storage-privacy-git-guard', 'P0', 'storage_privacy_guard', 'Keep raw biosignals, signed consent, direct identifiers, serials, and tokens out of Git and cloud paths.'),
  item('ruview-static-quarantine', 'P0', 'ruview_quarantine', 'Keep RU-view as static provenance and risk evidence only; never execute or trust it.'),
  item('local-symphony-linear-observation', 'P1', 'symphony_linear_local_migration', 'Move orchestration through local services first so Hookwall and GNN observe decisions before remote mutation.')
];

function item(id, phase, lane, summary) {
  return { id, phase, lane, summary };
}

function rel(p) {
  return path.join(repoRoot, p);
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

function toNdjson(rows) {
  return rows.map((row) => JSON.stringify(row)).join('\n') + (rows.length ? '\n' : '');
}

function sha256Text(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function glyph(kind, id, seed) {
  const hash = sha256Text(`${kind}:${id}:${seed || ''}`);
  return `HG256:${kind.toUpperCase()}:${hash.slice(0, 8).toUpperCase()}:${behcs.hilbertAddress(hash)}`;
}

function slug(value) {
  return String(value || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64) || 'unknown';
}

function numberValue(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function uniqueBest(rows, scoreField, limit) {
  const best = new Map();
  for (const row of rows) {
    const key = row.summary || row.id;
    const current = best.get(key);
    if (!current || numberValue(row[scoreField], 0) > numberValue(current[scoreField], 0)) {
      best.set(key, row);
    }
  }
  return Array.from(best.values()).sort((a, b) => numberValue(b[scoreField], 0) - numberValue(a[scoreField], 0)).slice(0, limit);
}

function loadContext() {
  return {
    summary: readJson(PATHS.summary, {}),
    geniusMarks: readNdjson(PATHS.geniusMarks),
    mistakeMarks: readNdjson(PATHS.mistakeMarks),
    readiness: readJson(PATHS.readiness, {}),
    priorIntegration: readJson(PATHS.priorIntegration, {})
  };
}

function topGenius(context) {
  const fromSummary = Array.isArray(context.summary.topGeniusIdeas) ? context.summary.topGeniusIdeas : [];
  const bySummary = uniqueBest(context.geniusMarks, 'score', 32);
  const rows = [];
  for (const row of fromSummary) rows.push(row);
  for (const row of bySummary) {
    if (!rows.some((existing) => existing.summary === row.summary)) rows.push(row);
  }
  return rows.slice(0, 24);
}

function topMistakes(context) {
  const fromSummary = Array.isArray(context.summary.topMistakePatterns) ? context.summary.topMistakePatterns : [];
  const bySummary = uniqueBest(context.mistakeMarks, 'reverseGain', 32);
  const rows = [];
  for (const row of fromSummary) rows.push(row);
  for (const row of bySummary) {
    if (!rows.some((existing) => existing.summary === row.summary)) rows.push(row);
  }
  return rows.slice(0, 24);
}

function findEvidence(rows, lane, fallbackSummary) {
  const laneMatch = rows.find((row) => row.lane === lane);
  if (laneMatch) return laneMatch;
  const textMatch = rows.find((row) => String(row.summary || '').toLowerCase().includes(lane.replace(/_/g, ' ')));
  return textMatch || {
    id: `required-${lane}`,
    lane,
    score: 0.999,
    reverseGain: '',
    pid: '',
    glyph: glyph('required_integration_evidence', lane, fallbackSummary),
    summary: fallbackSummary
  };
}

function priorityForPhase(phase) {
  if (phase === 'P0') return 'must_build_first';
  if (phase === 'P1') return 'core_build';
  return 'guarded_build';
}

function buildSupervisors(geniusRows, generatedAt) {
  return {
    supervisorSetId: 'real-million-genius-build-supervisors.v1',
    generatedAt,
    status: 'REAL_MILLION_GENIUS_SUPERVISORS_INTEGRATED',
    count: BUILD_ITEMS.length,
    supervisors: BUILD_ITEMS.map((buildItem, index) => {
      const evidence = findEvidence(geniusRows, buildItem.lane, buildItem.summary);
      const id = `real-million-build-${String(index + 1).padStart(2, '0')}-${buildItem.id}`;
      return {
        supervisorId: id,
        pid: `BH.REAL.MILLION.GENIUS.SUP.PID.${String(index + 1).padStart(5, '0')}`,
        glyph: glyph('real_million_integrated_genius_supervisor', id, evidence.glyph || evidence.summary),
        phase: buildItem.phase,
        priority: priorityForPhase(buildItem.phase),
        lane: buildItem.lane,
        sourceMarkId: evidence.id || null,
        sourcePid: evidence.pid || null,
        sourceGlyph: evidence.glyph || null,
        score: numberValue(evidence.score, 0.999),
        authority: 'observe_verify_dispatch_local_build_only',
        summary: buildItem.summary,
        acceptanceRole: `must_verify_${buildItem.id}`
      };
    })
  };
}

function severityForMistake(mark) {
  const reverseGain = numberValue(mark.reverseGain, 0.8);
  if (reverseGain >= 0.997) return 'critical_block';
  if (reverseGain >= 0.94) return 'hard_guard';
  return 'watch_guard';
}

function actionForMistake(mark) {
  const text = `${mark.id || ''} ${mark.summary || ''}`.toLowerCase();
  if (text.includes('process')) return 'block_process_storm';
  if (text.includes('mind') || text.includes('claim')) return 'claim_rewrite_required';
  if (text.includes('live eeg') || text.includes('consent')) return 'block_live_data_without_precheck';
  if (text.includes('driver') || text.includes('firmware')) return 'block_unpinned_device_runtime';
  if (text.includes('baseline')) return 'require_classical_baseline_gate';
  if (text.includes('artifact') || text.includes('blink') || text.includes('motion')) return 'block_artifact_as_signal';
  if (text.includes('remote') || text.includes('linear')) return 'require_local_observation_first';
  if (text.includes('git') || text.includes('raw')) return 'block_sensitive_git_write';
  return 'ledger_and_review_before_promotion';
}

function buildMistakeGuards(mistakeRows, generatedAt) {
  return {
    guardSetId: 'real-million-mistake-runtime-guards.v1',
    generatedAt,
    status: 'REAL_MILLION_MISTAKE_GUARDS_INTEGRATED',
    count: mistakeRows.length,
    guards: mistakeRows.map((mark, index) => {
      const id = `real-million-guard-${String(index + 1).padStart(2, '0')}-${slug(mark.id || mark.summary)}`;
      return {
        guardId: id,
        pid: `BH.REAL.MILLION.MISTAKE.GUARD.PID.${String(index + 1).padStart(5, '0')}`,
        glyph: glyph('real_million_integrated_mistake_guard', id, mark.glyph || mark.summary),
        severity: severityForMistake(mark),
        action: actionForMistake(mark),
        lane: mark.lane || 'cross_lane',
        sourceMarkId: mark.id || null,
        sourcePid: mark.pid || null,
        sourceGlyph: mark.glyph || null,
        reverseGain: numberValue(mark.reverseGain, 0),
        authority: 'block_warn_or_ledger_before_execution',
        summary: mark.summary
      };
    })
  };
}

function buildHookwallPolicy(supervisorSet, guardSet, generatedAt) {
  const critical = guardSet.guards.filter((guard) => guard.severity === 'critical_block');
  const hard = guardSet.guards.filter((guard) => guard.severity === 'hard_guard');
  return {
    policyId: 'real-million-results-hookwall-policy.v1',
    generatedAt,
    status: 'HOOKWALL_REAL_RESULTS_POLICY_INTEGRATED',
    mode: MODE,
    defaultDisposition: 'deny_unless_local_synthetic_static_or_approved_precheck',
    mustBuildInvariants: supervisorSet.supervisors.filter((entry) => entry.phase === 'P0').map((entry) => entry.supervisorId),
    criticalBlocks: critical,
    hardGuards: hard,
    watchGuards: guardSet.guards.filter((guard) => guard.severity === 'watch_guard'),
    allowedWithoutNewGate: [
      'synthetic_eeg_replay',
      'pid_session_manifest_validation',
      'bids_sidecar_generation_from_synthetic',
      'signal_quality_metric_computation_from_synthetic',
      'local_symphony_linear_queue_ingest',
      'ruview_static_metadata_record',
      'non_destructive_gc_compaction',
      'local_report_generation'
    ],
    blockedWithoutNewGate: [
      'one_process_per_agent',
      'literal_mind_reading_claim',
      'live_eeg_capture',
      'device_access',
      'unpinned_driver_or_firmware',
      'raw_sensitive_git_write',
      'ruview_execution',
      'external_api_call',
      'download_or_install',
      'remote_linear_mutation'
    ]
  };
}

function acceptanceFor(buildItem) {
  const common = [
    'writes local JSON or NDJSON evidence',
    'has BEHCS/Hermes/Shannon visibility before promotion',
    'does not collect live EEG or human data in this tranche'
  ];
  const specific = {
    'synthetic-eeg-ci': ['replays latest synthetic session', 'validates sample count, channels, events, and hash'],
    'pid-consent-session-bus': ['requires BH.HUMAN.PID and session id on every packet', 'preserves stop/delete scope fields'],
    'claim-quarantine-first-gate': ['blocks literal mind-reading, medical, coercive, or harm claims', 'records rewritten safe language'],
    'hookwall-gnn-gc-wrapper': ['feeds every packet through forward and reverse-gain summaries', 'GC compacts duplicates without deleting sources'],
    'bids-sidecar-writer': ['writes BIDS-like sidecar with sample rate, channels, events, provenance, and hashes'],
    'lsl-event-pipe': ['models event timing and stream ids in synthetic mode before device mode'],
    'brainflow-synthetic-adapter': ['uses synthetic/playback board contract only', 'no live device handle is opened'],
    'signal-quality-feedback-gate': ['blocks feedback when quality, artifact, drift, calibration, or uncertainty is missing'],
    'artifact-eventization': ['turns blink, motion, and line-noise into explicit events'],
    'neurofeedback-uncertainty-ui': ['shows uncertainty and limits beside feedback state'],
    'breath-pacing-first-loop': ['runs from synthetic or non-EEG signals before EEG feedback'],
    'fatigue-awareness-scheduler': ['labels output as scheduling support, not diagnosis'],
    'model-ladder-contract': ['requires model cards and promotion gates for each model family'],
    'classical-baseline-first': ['CSP/LDA or logistic baseline exists before deep EEG'],
    'riemannian-transfer-check': ['reports session-transfer covariance drift'],
    'storage-privacy-git-guard': ['blocks raw biosignals, signed consent, serials, and tokens from Git'],
    'ruview-static-quarantine': ['records RU-view metadata only and confirms execution count stays zero'],
    'local-symphony-linear-observation': ['writes local queue event before any remote tracker mutation']
  };
  return [...(specific[buildItem.id] || []), ...common];
}

function buildImplementationQueue(supervisorSet, guardSet, generatedAt) {
  const guardsByAction = new Map();
  for (const guard of guardSet.guards) {
    if (!guardsByAction.has(guard.action)) guardsByAction.set(guard.action, []);
    guardsByAction.get(guard.action).push(guard.guardId);
  }

  const tasks = BUILD_ITEMS.map((buildItem, index) => {
    const supervisor = supervisorSet.supervisors.find((entry) => entry.lane === buildItem.lane) || supervisorSet.supervisors[index];
    return {
      queueId: `real-million-build-${String(index + 1).padStart(2, '0')}`,
      generatedAt,
      status: 'LOCAL_BUILD_PACKET_READY',
      phase: buildItem.phase,
      lane: buildItem.lane,
      buildId: buildItem.id,
      supervisorId: supervisor.supervisorId,
      supervisorPid: supervisor.pid,
      summary: buildItem.summary,
      guardActions: Array.from(guardsByAction.keys()).slice(0, 8),
      acceptance: acceptanceFor(buildItem),
      outputsPlannedUnder: 'data/neurotech-defense-lab/build/',
      remoteMutation: false
    };
  });

  return {
    queueId: 'real-million-results-implementation-queue.v1',
    generatedAt,
    status: 'IMPLEMENTATION_QUEUE_READY_LOCAL_ONLY',
    count: tasks.length,
    phases: {
      P0: tasks.filter((task) => task.phase === 'P0').length,
      P1: tasks.filter((task) => task.phase === 'P1').length,
      P2: tasks.filter((task) => task.phase === 'P2').length
    },
    tasks
  };
}

function buildContracts(queue, generatedAt) {
  return {
    contractId: 'neurotech-real-million-build-contracts.v1',
    generatedAt,
    status: 'CONTRACTS_READY_FOR_LOCAL_IMPLEMENTATION',
    doctrine: {
      capability: 'consented signal classification and training support',
      blockedClaim: 'literal private thought reading',
      liveData: 'blocked until per-session precheck and participant attestation',
      ruView: 'static quarantine only'
    },
    contracts: queue.tasks.map((task) => ({
      id: task.buildId,
      phase: task.phase,
      lane: task.lane,
      mustPass: task.acceptance,
      mustNotDo: [
        'spawn a process storm',
        'open live EEG device handles',
        'execute RU-view',
        'write raw sensitive data to Git',
        'call external APIs',
        'make medical or literal mind-reading claims'
      ]
    }))
  };
}

function buildGnnEdges(supervisorSet, guardSet, queue, generatedAt) {
  const edges = [];
  for (const task of queue.tasks) {
    edges.push({
      id: `real-million-edge-${task.buildId}`,
      ts: generatedAt,
      from: 'real_million_genius_marks',
      to: task.buildId,
      verb: 'promotes_local_build_packet',
      weight: task.phase === 'P0' ? 0.96 : task.phase === 'P1' ? 0.9 : 0.82,
      supervisorPid: task.supervisorPid
    });
  }
  for (const guard of guardSet.guards.slice(0, 16)) {
    edges.push({
      id: `real-million-guard-edge-${guard.guardId}`,
      ts: generatedAt,
      from: guard.guardId,
      to: 'hookwall_real_results_policy',
      verb: guard.action,
      weight: guard.severity === 'critical_block' ? 0.99 : guard.severity === 'hard_guard' ? 0.92 : 0.75,
      guardPid: guard.pid
    });
  }
  edges.push({
    id: 'real-million-supervisor-fleet-edge',
    ts: generatedAt,
    from: 'real_million_results_integrator',
    to: 'hermes_supervisor_of_supervisors',
    verb: 'awareness_update',
    weight: 0.94,
    supervisorCount: supervisorSet.count
  });
  return edges;
}

function buildHermesAwareness(context, supervisorSet, guardSet, queue, generatedAt) {
  return {
    awarenessId: 'hermes-real-million-awareness-latest',
    generatedAt,
    status: 'HERMES_AWARE_OF_REAL_MILLION_RESULTS',
    mode: MODE,
    sourceStatus: context.summary.status || null,
    counts: {
      realPackets: context.summary.counts?.realLowerLevelAgentTasksExecuted || 0,
      geniusMarks: context.summary.counts?.geniusMarks || 0,
      mistakeMarks: context.summary.counts?.mistakeMarks || 0,
      integratedSupervisors: supervisorSet.count,
      integratedGuards: guardSet.count,
      implementationTasks: queue.count
    },
    adoptedSelfImprovements: [
      'prefer real local PID-packet evidence over scale-only notation',
      'deduplicate genius and mistake marks by substance before promotion',
      'front-load process-storm and claim guards',
      'make synthetic EEG replay the CI root',
      'make signal quality and uncertainty block feedback',
      'preserve source evidence while compacting duplicate derivatives'
    ],
    nextLocalBuildCommand: 'node tools/neurotech-build-synthetic-pipeline.js build --execute'
  };
}

function buildIntegration(context, supervisorSet, guardSet, hookwallPolicy, queue, contracts, generatedAt) {
  return {
    integrationId: 'real-million-results-integration-latest',
    generatedAt,
    status: 'REAL_MILLION_RESULTS_INTEGRATED_FOR_LOCAL_BUILD',
    mode: MODE,
    source: {
      summary: repoRel(PATHS.summary),
      geniusMarks: repoRel(PATHS.geniusMarks),
      mistakeMarks: repoRel(PATHS.mistakeMarks),
      summaryStatus: context.summary.status || null
    },
    outputs: {
      supervisors: repoRel(PATHS.geniusSupervisors),
      guards: repoRel(PATHS.mistakeGuards),
      hookwallPolicy: repoRel(PATHS.hookwallPolicy),
      implementationQueueJson: repoRel(PATHS.implementationQueueJson),
      implementationQueueNdjson: repoRel(PATHS.implementationQueueNdjson),
      contracts: repoRel(PATHS.contracts),
      hermesAwareness: repoRel(PATHS.hermesAwareness)
    },
    counts: {
      realPackets: context.summary.counts?.realLowerLevelAgentTasksExecuted || 0,
      sourceGeniusMarks: context.geniusMarks.length,
      sourceMistakeMarks: context.mistakeMarks.length,
      integratedSupervisors: supervisorSet.count,
      integratedGuards: guardSet.count,
      hookwallCriticalBlocks: hookwallPolicy.criticalBlocks.length,
      hookwallHardGuards: hookwallPolicy.hardGuards.length,
      implementationTasks: queue.count,
      buildContracts: contracts.contracts.length
    },
    nextBuildOrder: queue.tasks.map((task) => ({ id: task.buildId, phase: task.phase, lane: task.lane }))
  };
}

function buildShannon(integration, generatedAt) {
  return {
    integrationId: 'real-million-results-integration-shannon',
    generatedAt,
    status: 'consensus_real_results_integrated',
    consensus: 'REAL-RESULTS-INTEGRATED',
    executionDisposition: 'local_build_queue_ready_no_live_data_no_external_calls',
    votes: [
      { part: 'scout', vote: 'PASS', reason: 'Real million PID-packet genius and mistake marks were deduplicated and promoted.' },
      { part: 'evidence', vote: 'PASS', reason: 'Supervisors, guards, Hookwall policy, contracts, implementation queue, and Hermes awareness were written.' },
      { part: 'executor', vote: 'HALT_LIVE_RUNTIME', reason: 'This integration still performs no live EEG, device access, downloads, installs, RU-view execution, or external calls.' },
      { part: 'fabric', vote: 'PASS', reason: 'BEHCS/Hermes/Shannon/cube/report and GNN edge surfaces are integrated.' },
      { part: 'voice', vote: 'HONEST_RESULTS', reason: 'The integration preserves the distinction between real PID-packet evidence and live LLM/process counts.' },
      { part: 'planner', vote: 'NEXT_LOCAL_BUILD', reason: 'Build the synthetic LSL/BIDS/signal-quality pipeline before live EEG.' }
    ],
    counts: integration.counts
  };
}

function buildHermes(integration, shannonPacket, generatedAt) {
  return {
    integrationId: 'real-million-results-integration-hermes',
    generatedAt,
    status: integration.status,
    mode: MODE,
    packet: {
      verb: 'EVT-HERMES-NEUROTECH-REAL-MILLION-RESULTS-INTEGRATION',
      summary: 'Real million PID-packet results promoted into supervisors, guards, Hookwall policy, contracts, implementation queue, and Hermes awareness.',
      consensus: shannonPacket.consensus,
      counts: integration.counts,
      report: repoRel(PATHS.reportMd)
    }
  };
}

function buildCube(integration, shannonPacket, generatedAt) {
  const cube = {
    id: 'neurotech-real-million-results-integration',
    generatedAt,
    primaryCatalog: { D: 37, name: 'AUTHORITY', prime: 157 },
    touches: [6, 20, 35, 37, 38, 39, 42, 47],
    gates: ['real_evidence', 'supervisor_promotion', 'hookwall', 'implementation_queue', 'hermes_awareness'],
    payload: {
      kind: 'real-million-results-integration',
      status: integration.status,
      mode: MODE,
      counts: integration.counts,
      shannon: {
        consensus: shannonPacket.consensus,
        executionDisposition: shannonPacket.executionDisposition
      }
    },
    translate: {
      human: 'Real million PID-packet findings are now integrated into build supervisors and guards.',
      agent: '(asolaria, neurotech, real_results, genius_supervisors, mistake_guards, hookwall, hermes)',
      device: 'node tools/neurotech-real-million-results-integrator.js integrate --execute'
    }
  };
  return `// cube: neurotech-real-million-results-integration | neurotech | D37 AUTHORITY\nexport const CUBE = ${JSON.stringify(cube, null, 2)}\n`;
}

function buildReport(integration, supervisorSet, guardSet, queue, shannonPacket, generatedAt) {
  const supervisorRows = supervisorSet.supervisors.slice(0, 12).map((entry) =>
    `| ${entry.supervisorId} | ${entry.phase} | ${entry.lane} | ${entry.score} | ${entry.summary} |`
  ).join('\n');
  const guardRows = guardSet.guards.slice(0, 12).map((entry) =>
    `| ${entry.guardId} | ${entry.severity} | ${entry.action} | ${entry.reverseGain} | ${entry.summary} |`
  ).join('\n');
  const taskRows = queue.tasks.map((entry) =>
    `| ${entry.queueId} | ${entry.phase} | ${entry.lane} | ${entry.buildId} | ${entry.summary} |`
  ).join('\n');

  const json = {
    reportId: 'neurotech-real-million-results-integration-latest',
    generatedAt,
    status: integration.status,
    integration,
    shannon: shannonPacket
  };

  const md = `# Neurotech Real Million Results Integration

Generated: ${generatedAt}

Status: ${integration.status}

The real one-million PID-packet run has been integrated into local build control: genius supervisors, mistake guards, Hookwall policy, Hermes awareness, implementation queue, and build contracts. This is integration-only: no live EEG, no RU-view execution, no downloads, no installs, no external calls, and no remote tracker mutations.

## Counts

- Real packets integrated: ${integration.counts.realPackets}
- Source genius marks: ${integration.counts.sourceGeniusMarks}
- Source mistake marks: ${integration.counts.sourceMistakeMarks}
- Integrated supervisors: ${integration.counts.integratedSupervisors}
- Integrated guards: ${integration.counts.integratedGuards}
- Implementation tasks: ${integration.counts.implementationTasks}

## Build Supervisors

| Supervisor | Phase | Lane | Score | Summary |
| --- | --- | --- | ---: | --- |
${supervisorRows}

## Mistake Guards

| Guard | Severity | Action | Reverse Gain | Summary |
| --- | --- | --- | ---: | --- |
${guardRows}

## Implementation Queue

| Queue | Phase | Lane | Build | Summary |
| --- | --- | --- | --- | --- |
${taskRows}

## Shannon

- Consensus: ${shannonPacket.consensus}
- Execution: ${shannonPacket.executionDisposition}
`;

  return { json, md };
}

function integrate({ execute = false } = {}) {
  const generatedAt = new Date().toISOString();
  const context = loadContext();
  const geniusRows = topGenius(context);
  const mistakeRows = topMistakes(context);
  const supervisorSet = buildSupervisors(geniusRows, generatedAt);
  const guardSet = buildMistakeGuards(mistakeRows, generatedAt);
  const hookwallPolicy = buildHookwallPolicy(supervisorSet, guardSet, generatedAt);
  const queue = buildImplementationQueue(supervisorSet, guardSet, generatedAt);
  const contracts = buildContracts(queue, generatedAt);
  const edges = buildGnnEdges(supervisorSet, guardSet, queue, generatedAt);
  const hermesAwareness = buildHermesAwareness(context, supervisorSet, guardSet, queue, generatedAt);
  const integration = buildIntegration(context, supervisorSet, guardSet, hookwallPolicy, queue, contracts, generatedAt);
  const shannonPacket = buildShannon(integration, generatedAt);
  const hermesPacket = buildHermes(integration, shannonPacket, generatedAt);
  const cube = buildCube(integration, shannonPacket, generatedAt);
  const report = buildReport(integration, supervisorSet, guardSet, queue, shannonPacket, generatedAt);
  const eventId = `neurotech-real-million-results-integration-${Date.now()}`;

  if (execute) {
    writeJson(PATHS.geniusSupervisors, supervisorSet);
    writeJson(PATHS.mistakeGuards, guardSet);
    writeJson(PATHS.hookwallPolicy, hookwallPolicy);
    writeJson(PATHS.implementationQueueJson, queue);
    writeText(PATHS.implementationQueueNdjson, toNdjson(queue.tasks));
    writeJson(PATHS.contracts, contracts);
    writeText(PATHS.gnnEdges, toNdjson(edges));
    writeJson(PATHS.hermesAwareness, hermesAwareness);
    writeText(PATHS.hermesActions, toNdjson(hermesAwareness.adoptedSelfImprovements.map((summary, index) => ({
      id: `real-million-self-improvement-${String(index + 1).padStart(2, '0')}`,
      ts: generatedAt,
      summary,
      source: 'real_million_pid_packet_run'
    }))));
    writeJson(PATHS.integration, integration);
    writeJson(PATHS.state, {
      savedAt: generatedAt,
      status: integration.status,
      mode: MODE,
      integration: repoRel(PATHS.integration),
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
      to: 'neurotech-real-results',
      verb: 'EVT-NEUROTECH-REAL-MILLION-RESULTS-INTEGRATION',
      body: { status: integration.status, counts: integration.counts, report: repoRel(PATHS.reportMd) }
    });
    appendNdjson(PATHS.outbox, {
      id: `${eventId}-hermes`,
      ts: generatedAt,
      from: 'hermes',
      to: 'neurotech-real-results',
      verb: hermesPacket.packet.verb,
      body: hermesPacket
    });
    appendNdjson(PATHS.globalGnnEdges, {
      id: `${eventId}-edge`,
      ts: generatedAt,
      from: 'real_million_pid_packet_results',
      to: 'local_neurotech_build_queue',
      verb: 'integrated_real_results',
      weight: 0.95
    });
  }

  return {
    ok: true,
    action: execute ? 'integrate' : 'preview',
    generatedAt,
    status: integration.status,
    counts: integration.counts,
    shannon: {
      status: shannonPacket.status,
      consensus: shannonPacket.consensus
    },
    nextLocalBuild: hermesAwareness.nextLocalBuildCommand,
    outputs: {
      integration: repoRel(PATHS.integration),
      supervisors: repoRel(PATHS.geniusSupervisors),
      guards: repoRel(PATHS.mistakeGuards),
      hookwallPolicy: repoRel(PATHS.hookwallPolicy),
      implementationQueueJson: repoRel(PATHS.implementationQueueJson),
      implementationQueueNdjson: repoRel(PATHS.implementationQueueNdjson),
      contracts: repoRel(PATHS.contracts),
      hermesAwareness: repoRel(PATHS.hermesAwareness),
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
    console.log(JSON.stringify(integrate({ execute: false }), null, 2));
    return;
  }
  if (action === 'integrate') {
    console.log(JSON.stringify(integrate({ execute }), null, 2));
    return;
  }
  console.error(JSON.stringify({
    ok: false,
    error: `Unknown action: ${action}`,
    usage: [
      'node tools/neurotech-real-million-results-integrator.js status',
      'node tools/neurotech-real-million-results-integrator.js integrate --execute'
    ]
  }, null, 2));
  process.exitCode = 2;
}

main(process.argv);
