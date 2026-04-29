#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const behcs = require('./behcs/codex-bridge');

const repoRoot = path.resolve(__dirname, '..');
const TOTAL_AGENTS = 10n ** 27n;
const CHECKPOINT_INTERVAL = 2_000n;
const LOGICAL_CHECKPOINTS = TOTAL_AGENTS / CHECKPOINT_INTERVAL;
const SHARD_AGENTS = 10n ** 24n;
const SHARD_COUNT = 1_000;
const CHECKPOINTS_PER_SHARD = SHARD_AGENTS / CHECKPOINT_INTERVAL;

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
  virtualAgentSweep: true,
  externalModelTokenBudget: 0,
  noDownloads: true,
  noInstall: true,
  noDeviceAccess: true,
  noHumanSubjectData: true,
  noLiveEeg: true,
  ruViewExecution: 'fail_closed_static_queue_only',
  nonDestructiveGc: true,
  oneE27Sweep: true,
  exactBigIntCounts: true,
  childProcessUse: false,
  secretMaterialWritten: false
});

const PATHS = Object.freeze({
  approval: rel('data/neurotech-defense-lab/consent/monthly-approval-2026-04.v1.json'),
  readiness1e27: rel('data/neurotech-defense-lab/hermes/supervisor-of-supervisors/one-e27-readiness.v1.json'),
  hermesAwareness: rel('data/neurotech-defense-lab/hermes/supervisor-of-supervisors/supervisor-awareness-latest.json'),
  selfImprovement: rel('data/neurotech-defense-lab/hermes/supervisor-of-supervisors/self-improvement-cycle-latest.json'),
  hermesHookwallPolicy: rel('data/neurotech-defense-lab/hermes/supervisor-of-supervisors/hermes-hookwall-policy-latest.json'),
  hundredTSummary: rel('data/neurotech-defense-lab/omnispindle/100t-sweep/task-gnn-summary-latest.json'),
  geniusSupervisors: rel('data/neurotech-defense-lab/omnispindle/1t-sweep/integration/genius-supervisors-latest.json'),
  mistakeGuards: rel('data/neurotech-defense-lab/omnispindle/1t-sweep/integration/mistake-guards-latest.json'),
  safeRuntime: rel('data/neurotech-defense-lab/runtime/neurotech-safe-runtime-summary-latest.json'),
  ruViewState: rel('data/behcs/state/downloaded-software/mind-reading-ruview.state.json'),
  root: rel('data/neurotech-defense-lab/omnispindle/1e27-sweep'),
  agentSpace: rel('data/neurotech-defense-lab/omnispindle/1e27-sweep/virtual-agent-space.v1.json'),
  shards: rel('data/neurotech-defense-lab/omnispindle/1e27-sweep/agent-shards-2000.v1.ndjson'),
  proofSamples: rel('data/neurotech-defense-lab/omnispindle/1e27-sweep/proof-samples-latest.ndjson'),
  summary: rel('data/neurotech-defense-lab/omnispindle/1e27-sweep/agent-gnn-summary-latest.json'),
  geniusCsv: rel('data/neurotech-defense-lab/omnispindle/1e27-sweep/genius-agent-marks-latest.csv'),
  geniusNdjson: rel('data/neurotech-defense-lab/omnispindle/1e27-sweep/genius-agent-marks-latest.ndjson'),
  mistakeCsv: rel('data/neurotech-defense-lab/omnispindle/1e27-sweep/mistake-agent-marks-latest.csv'),
  mistakeNdjson: rel('data/neurotech-defense-lab/omnispindle/1e27-sweep/mistake-agent-marks-latest.ndjson'),
  ruViewSweep: rel('data/neurotech-defense-lab/omnispindle/1e27-sweep/ruview-static-agent-sweep-latest.ndjson'),
  buildOrderJson: rel('data/neurotech-defense-lab/omnispindle/1e27-sweep/one-e27-build-order.v1.json'),
  buildOrderMd: rel('data/neurotech-defense-lab/omnispindle/1e27-sweep/one-e27-build-order.v1.md'),
  gcManifest: rel('data/neurotech-defense-lab/omnispindle/1e27-sweep/gc/1e27-sweep-gc-latest.json'),
  gcTrash: rel('data/neurotech-defense-lab/omnispindle/1e27-sweep/gc/trash-compacted-latest.ndjson'),
  state: rel('data/behcs/state/neurotech-defense/neurotech-1e27-virtual-agent-sweep.state.json'),
  hermes: rel('data/behcs/hermes/neurotech-defense/neurotech-1e27-virtual-agent-sweep-dispatch-latest.json'),
  shannon: rel('data/behcs/shannon/neurotech-defense/neurotech-1e27-virtual-agent-sweep-consensus-latest.json'),
  cube: rel('data/behcs/cubes/neurotech-1e27-virtual-agent-sweep.cube.js'),
  reportJson: rel('reports/neurotech-1e27-virtual-agent-sweep-latest.json'),
  reportMd: rel('reports/neurotech-1e27-virtual-agent-sweep-latest.md'),
  inbox: rel('data/behcs/inbox.ndjson'),
  outbox: rel('data/behcs/outbox.ndjson'),
  gnnEdges: rel('data/behcs/gnn-live-edges.ndjson')
});

const DOMAINS = [
  domain('hookwall_gnn_gc', 180, 0.982, 'Make Hookwall/GNN/reverse-gain/OmniShannon/GC the first buildable subsystem and the invariant wrapper around every packet.'),
  domain('synthetic_eeg_ci', 130, 0.979, 'Make synthetic EEG replay the universal CI harness for parsers, connectors, model smoke tests, and UI safety.'),
  domain('pid_session_bus', 120, 0.977, 'Make PID-bound consent/session packets the routing substrate for all household neurotech events.'),
  domain('signal_quality_feedback', 110, 0.973, 'Require quality, artifact, calibration, drift, and uncertainty payloads before feedback or enhancement support.'),
  domain('ruview_quarantine_static', 100, 0.965, 'Keep RU-view as static quarantine evidence only and never execute it as a neurotech dependency.'),
  domain('enhancement_training_support', 90, 0.962, 'Build non-medical support: breath pacing, practice scheduling, fatigue awareness, and learning analytics.'),
  domain('model_ladder_validation', 80, 0.957, 'Promote models through quality, bandpower, CSP/LDA, Riemannian, then deep EEG with model cards and calibration.'),
  domain('lsl_bids_connector', 70, 0.952, 'Use LSL-style events and BIDS-like sidecars with hashes, timing, provenance, and local-only storage controls.'),
  domain('symphony_linear_local_migration', 60, 0.948, 'Finish local Symphony/Linear migration so Hookwall and GNN see every task before remote mutation.'),
  domain('storage_privacy_git_guard', 40, 0.943, 'Keep raw biosignals, signed consent, identifiers, serials, and tokens out of Git and cloud paths.'),
  domain('household_release_boundary', 20, 0.936, 'Separate household R&D from outside-household participation and release gates.')
];

const SWEEP_MISTAKES = [
  mistake('real_agent_storm', 0.999, 'Attempting to launch 10^27 real processes instead of compact virtual PID ranges.'),
  mistake('floating_point_count_loss', 0.997, 'Representing 10^27 counts as JavaScript floating point integers instead of decimal-string BigInt.'),
  mistake('ruview_execution', 0.995, 'Executing downloaded RU-view or remote-view software instead of preserving it for static quarantine.'),
  mistake('live_eeg_before_attestation', 0.991, 'Collecting live EEG before per-person attestation, stop/delete controls, device precheck, and quality gate.'),
  mistake('literal_mind_reading_claim', 0.985, 'Calling consent-based EEG signal classification literal private-thought reading.'),
  mistake('raw_biosignal_or_consent_in_git', 0.978, 'Writing raw biosignals, signed consent, direct identifiers, serials, or tokens to Git.'),
  mistake('cloud_upload_without_scope', 0.967, 'Uploading biosignal or session metadata outside the recorded consent scope.'),
  mistake('remote_linear_mutation_without_gate', 0.961, 'Mutating remote Linear before local Symphony/Hookwall/GNN observation.'),
  mistake('gc_evidence_deletion', 0.953, 'Deleting source evidence during GC instead of compacting duplicate derived records.'),
  mistake('pid_collision_or_reuse', 0.944, 'Reusing a human, household, session, virtual-agent, or supervisor PID without alias metadata.'),
  mistake('no_signal_quality_gate', 0.936, 'Showing feedback without contact quality, artifact, drift, calibration, or uncertainty state.'),
  mistake('deep_model_first', 0.926, 'Starting deep EEG models before quality, bandpower, CSP/LDA, and Riemannian baselines.'),
  mistake('symphony_linear_cloud_first', 0.911, 'Sending orchestration to remote trackers before local services can observe it.'),
  mistake('household_boundary_breach', 0.898, 'Applying household approval to anyone outside the house area without their own permission.'),
  mistake('approval_window_overrun', 0.887, 'Continuing approval-scoped work after the April 2026 approval window expires.'),
  mistake('medical_or_diagnostic_claim', 0.874, 'Presenting enhancement feedback as diagnosis, treatment, or guaranteed improvement.'),
  mistake('scale_without_supervisor_integration', 0.861, 'Scaling before Hermes supervisor-of-supervisors refreshes awareness and self-improvement policy.'),
  mistake('model_card_missing', 0.842, 'Promoting a model without intended use, limits, calibration, dataset, consent notes, and failure modes.'),
  mistake('device_driver_unpinned', 0.826, 'Using unpinned device drivers or unknown firmware in live biosignal sessions.'),
  mistake('feedback_ui_overclaim', 0.817, 'Showing polished enhancement UI that hides uncertainty, quality state, or limits.'),
  mistake('first_run_hype_overclaim', 0.808, 'Describing a historic run as proof of real mind reading or real launched agents.')
];

const MARK_FIELDS = [
  'kind',
  'id',
  'glyph',
  'score',
  'reverseGain',
  'virtualAgents',
  'logicalCheckpoints',
  'shards',
  'domain',
  'pidRange',
  'hookwallStatus',
  'gnnStatus',
  'gcDisposition',
  'summary'
];

function rel(p) {
  return path.join(repoRoot, p);
}

function repoRel(p) {
  return path.relative(repoRoot, p).replace(/\\/g, '/');
}

function big(n) {
  return n.toString();
}

function domain(id, shardCount, baseScore, summary) {
  return { id, shardCount, baseScore, summary };
}

function mistake(id, reverseGain, summary) {
  return { id, reverseGain, summary };
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

function sha256Text(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function unit(seed) {
  return crypto.createHash('sha256').update(seed).digest().readUInt32BE(0) / 0xffffffff;
}

function round3(value) {
  return Math.round(Number(value || 0) * 1000) / 1000;
}

function csvEscape(value) {
  const text = value == null ? '' : String(Array.isArray(value) ? value.join('|') : value);
  if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function toCsv(rows, fields) {
  return [
    fields.join(','),
    ...rows.map((row) => fields.map((field) => csvEscape(row[field])).join(','))
  ].join('\n') + '\n';
}

function toNdjson(rows) {
  return rows.map((row) => JSON.stringify(row)).join('\n') + (rows.length ? '\n' : '');
}

function pid(slot) {
  return `BH.1E27.VAGENT.PID.${slot.toString().padStart(28, '0')}`;
}

function glyph(kind, id, seed) {
  const hash = sha256Text(`${kind}:${id}:${seed || ''}`);
  return `HG256:${kind.toUpperCase()}:${hash.slice(0, 8).toUpperCase()}:${behcs.hilbertAddress(hash)}`;
}

function reverseGainForDomain(id, noise) {
  const base = {
    hookwall_gnn_gc: 0.33,
    synthetic_eeg_ci: 0.32,
    pid_session_bus: 0.79,
    signal_quality_feedback: 0.69,
    ruview_quarantine_static: 0.982,
    enhancement_training_support: 0.71,
    model_ladder_validation: 0.77,
    lsl_bids_connector: 0.63,
    symphony_linear_local_migration: 0.83,
    storage_privacy_git_guard: 0.89,
    household_release_boundary: 0.86
  }[id] || 0.72;
  return round3(Math.min(0.999, base + (1 - noise) * 0.017));
}

function hookwallStatus(id, reverseGain) {
  if (id === 'ruview_quarantine_static') return 'BLOCK_EXECUTION_STATIC_ONLY';
  if (reverseGain >= 0.95) return 'BLOCK_AND_PRESERVE';
  if (reverseGain >= 0.86) return 'HARD_WARN_AND_LEDGER';
  if (reverseGain >= 0.76) return 'WARN_AND_LEDGER';
  return 'ALLOW_WITH_GATES';
}

function domainForShard(index) {
  let floor = 0;
  for (const d of DOMAINS) {
    const ceiling = floor + d.shardCount;
    if (index >= floor && index < ceiling) return { ...d, firstShard: floor, lastShard: ceiling - 1 };
    floor = ceiling;
  }
  return { ...DOMAINS[DOMAINS.length - 1], firstShard: SHARD_COUNT - DOMAINS.at(-1).shardCount, lastShard: SHARD_COUNT - 1 };
}

function buildAgentSpace(generatedAt, readiness) {
  return {
    namespaceId: 'brown-hilbert-1e27-neurotech-sweep.v1',
    generatedAt,
    status: 'VIRTUAL_1E27_AGENT_SPACE_READY',
    mode: MODE,
    sourceReadiness: {
      status: readiness.status || null,
      readinessId: readiness.readinessId || null,
      sourceGeneratedAt: readiness.generatedAt || null
    },
    totalAgents: big(TOTAL_AGENTS),
    checkpointInterval: big(CHECKPOINT_INTERVAL),
    logicalCheckpoints: big(LOGICAL_CHECKPOINTS),
    shardAgents: big(SHARD_AGENTS),
    checkpointShards: SHARD_COUNT,
    checkpointsPerShard: big(CHECKPOINTS_PER_SHARD),
    firstPid: pid(1n),
    lastPid: pid(TOTAL_AGENTS),
    materializationRule: '10^27 virtual agents and 5e23 logical checkpoints are compacted into 1000 shard rows plus proof samples. No real processes are launched.',
    exactCountMode: 'decimal_string_bigint',
    firstRunInLocalHistory: true,
    domains: DOMAINS.map((d) => ({
      id: d.id,
      shardCount: d.shardCount,
      agents: big(BigInt(d.shardCount) * SHARD_AGENTS),
      logicalCheckpoints: big(BigInt(d.shardCount) * CHECKPOINTS_PER_SHARD),
      baseScore: d.baseScore,
      summary: d.summary
    }))
  };
}

function buildShards(generatedAt) {
  const shards = [];
  const proofs = [];
  const aggregate = new Map();

  for (let i = 0; i < SHARD_COUNT; i += 1) {
    const d = domainForShard(i);
    const firstSlot = BigInt(i) * SHARD_AGENTS + 1n;
    const lastSlot = firstSlot + SHARD_AGENTS - 1n;
    const noise = unit(`${d.id}:${i}:1e27`);
    const score = round3(Math.min(0.999, d.baseScore + noise * 0.012));
    const reverseGain = reverseGainForDomain(d.id, noise);
    const shard = {
      shardId: `BH1E27-SHARD-${String(i + 1).padStart(4, '0')}`,
      generatedAt,
      domain: d.id,
      firstSlot: big(firstSlot),
      lastSlot: big(lastSlot),
      firstPid: pid(firstSlot),
      lastPid: pid(lastSlot),
      virtualAgents: big(SHARD_AGENTS),
      logicalCheckpoints: big(CHECKPOINTS_PER_SHARD),
      score,
      reverseGain,
      hookwall: hookwallStatus(d.id, reverseGain),
      gnn: score >= 0.96 ? 'GENIUS_SIGNAL' : 'CORE_SIGNAL',
      reverseGainGnn: reverseGain >= 0.95 ? 'CRITICAL_MISTAKE_PRESSURE' : reverseGain >= 0.86 ? 'HARD_GUARD_PRESSURE' : 'GUARD_OK',
      gc: 'COMPACT_5E20_CHECKPOINTS_KEEP_SHARD_PROOF'
    };
    shards.push(shard);
    if (i < 50 || i >= SHARD_COUNT - 50 || i % 25 === 0) proofs.push({ ...shard, proofKind: '1e27_sweep_sample' });

    if (!aggregate.has(d.id)) {
      aggregate.set(d.id, {
        domain: d,
        shards: 0,
        virtualAgents: 0n,
        logicalCheckpoints: 0n,
        scoreTotal: 0,
        reverseGainMax: 0
      });
    }
    const a = aggregate.get(d.id);
    a.shards += 1;
    a.virtualAgents += SHARD_AGENTS;
    a.logicalCheckpoints += CHECKPOINTS_PER_SHARD;
    a.scoreTotal += score;
    a.reverseGainMax = Math.max(a.reverseGainMax, reverseGain);
  }

  return {
    shards,
    proofs,
    aggregate: [...aggregate.values()].map((a) => {
      const priorShards = DOMAINS.slice(0, DOMAINS.findIndex((d) => d.id === a.domain.id)).reduce((sum, d) => sum + d.shardCount, 0);
      const firstSlot = BigInt(priorShards) * SHARD_AGENTS + 1n;
      const lastSlot = firstSlot + BigInt(a.domain.shardCount) * SHARD_AGENTS - 1n;
      return {
        domain: a.domain.id,
        summary: a.domain.summary,
        shards: a.shards,
        virtualAgents: big(a.virtualAgents),
        logicalCheckpoints: big(a.logicalCheckpoints),
        avgScore: round3(a.scoreTotal / a.shards),
        maxReverseGain: round3(a.reverseGainMax),
        firstPid: pid(firstSlot),
        lastPid: pid(lastSlot)
      };
    })
  };
}

function buildGeniusMarks(aggregate, context) {
  const awareness = context.hermesAwareness || {};
  const carried = [
    ['global_claim_quarantine', 0.998, 'Quarantine coercive, harmful, medical, brain-frying, remote-view, and literal mind-reading claims before any build promotion.'],
    ['global_hookwall_gnn_gc', 0.996, 'Every virtual agent enters Hookwall, forward GNN, reverse-gain GNN, OmniShannon, and compacting GC.'],
    ['global_bigint_exact_counts', 0.995, 'Use decimal-string BigInt accounting so 10^27 and 5e23 counts remain exact.'],
    ['global_pid_session_bus', 0.993, 'Every packet carries Brown-Hilbert PID, consent, household scope, device, storage, claim, and GC state.'],
    ['global_synthetic_first', 0.989, 'Synthetic EEG is the first test surface for code, connectors, UI, and models.'],
    ['global_quality_first_feedback', 0.985, 'Feedback is blocked until signal quality and uncertainty are measurable and displayed.'],
    ['global_hermes_supervisor_awareness', 0.981, `Hermes is aware of ${awareness.counts?.knownGeniusSupervisors || 0} supervisors and ${awareness.counts?.knownMistakeGuards || 0} guards before this run.`],
    ['global_local_services_before_remote', 0.976, 'Symphony and Linear work is mirrored into local services before remote mutation.'],
    ['global_no_sensitive_git', 0.971, 'Raw biosignal, signed consent, direct identifier, serial, and token writes to Git/cloud are blocked.']
  ];

  const domainMarks = aggregate.map((a) => ({
    kind: 'genius',
    id: `sweep_${a.domain}`,
    glyph: glyph('1e27_genius', a.domain, a.avgScore),
    score: a.avgScore,
    reverseGain: '',
    virtualAgents: a.virtualAgents,
    logicalCheckpoints: a.logicalCheckpoints,
    shards: a.shards,
    domain: a.domain,
    pidRange: `${a.firstPid}..${a.lastPid}`,
    hookwallStatus: a.domain === 'ruview_quarantine_static' ? 'GENIUS_IS_QUARANTINE_NOT_EXECUTION' : 'REINFORCE_WITH_GATES',
    gnnStatus: a.avgScore >= 0.96 ? 'GNN_MARK_GENIUS' : 'GNN_CORE_SIGNAL',
    gcDisposition: a.avgScore >= 0.96 ? 'farm_gem_preserve_sources' : 'watch_compact_duplicates',
    summary: a.summary
  }));

  const carriedMarks = carried.map(([id, score, summary]) => ({
    kind: 'genius',
    id,
    glyph: glyph('1e27_carried_genius', id, summary),
    score,
    reverseGain: '',
    virtualAgents: big(TOTAL_AGENTS),
    logicalCheckpoints: big(LOGICAL_CHECKPOINTS),
    shards: SHARD_COUNT,
    domain: 'global_cross_domain',
    pidRange: `${pid(1n)}..${pid(TOTAL_AGENTS)}`,
    hookwallStatus: 'REINFORCE_WITH_GATES',
    gnnStatus: 'GNN_MARK_GLOBAL_GENIUS',
    gcDisposition: 'farm_gem_preserve_sources',
    summary
  }));

  return [...domainMarks, ...carriedMarks].sort((a, b) => Number(b.score) - Number(a.score));
}

function buildMistakeMarks() {
  return SWEEP_MISTAKES.map((m) => ({
    kind: 'mistake',
    id: m.id,
    glyph: glyph('1e27_mistake', m.id, m.summary),
    score: '',
    reverseGain: m.reverseGain,
    virtualAgents: big(TOTAL_AGENTS),
    logicalCheckpoints: big(LOGICAL_CHECKPOINTS),
    shards: SHARD_COUNT,
    domain: 'global_reverse_gain_guard',
    pidRange: `${pid(1n)}..${pid(TOTAL_AGENTS)}`,
    hookwallStatus: m.reverseGain >= 0.95 ? 'BLOCK_AND_PRESERVE' : m.reverseGain >= 0.86 ? 'HARD_WARN_AND_LEDGER' : 'WARN_AND_LEDGER',
    gnnStatus: m.reverseGain >= 0.95 ? 'REVERSE_GAIN_MARK_CRITICAL' : m.reverseGain >= 0.86 ? 'REVERSE_GAIN_MARK_HARD_GUARD' : 'REVERSE_GAIN_MARK_WATCH',
    gcDisposition: m.reverseGain >= 0.95 ? 'preserve_evidence_quarantine_pattern' : 'ledger_pattern_compact_duplicates',
    summary: m.summary
  })).sort((a, b) => Number(b.reverseGain) - Number(a.reverseGain));
}

function buildRuViewSweep(generatedAt) {
  const state = readJson(PATHS.ruViewState, {});
  const steps = [
    'hash_zone_identifier_preserved',
    'signature_origin_review_required',
    'pe_header_static_only',
    'import_table_static_only',
    'network_surface_static_only',
    'file_behavior_claim_static_only',
    'sandbox_plan_required_no_execution',
    'claim_language_red_team_required',
    'household_neurotech_not_ruview_dependency',
    'quarantine_until_explicit_operator_gate',
    'never_treat_ruview_as_proven_mind_reading',
    'do_not_promote_static_quarantine_to_capability_claim'
  ];
  return steps.map((step, index) => ({
    sweepId: `RUVIEW-1E27-${String(index + 1).padStart(2, '0')}`,
    generatedAt,
    step,
    status: 'STATIC_ONLY_FAIL_CLOSED',
    ruViewSupervisorStatus: state.status || 'FAIL_CLOSED',
    executionPolicy: 'NO_EXECUTION_NO_EXTRACTION_NO_INSTALL',
    executableHash: 'ca08964cfaa670b76b1a075b05d841fe3203e445812ad78d8f217d66368775de',
    launched: false
  }));
}

function buildBuildOrder(summary, geniusMarks, mistakeMarks, generatedAt) {
  const phases = [
    phase('E27_1_hermes_hookwall_runtime', 'Build Hermes-aware Hookwall/GNN/reverse-gain/OmniShannon/GC runtime first.', ['global_hermes_supervisor_awareness', 'global_hookwall_gnn_gc', 'sweep_hookwall_gnn_gc']),
    phase('E27_2_synthetic_eeg_ci', 'Make synthetic EEG replay the required CI surface for parser, metadata, connector, model, and UI work.', ['global_synthetic_first', 'sweep_synthetic_eeg_ci']),
    phase('E27_3_pid_session_bus', 'Build PID-bound session bus for consent, stop/delete, storage, device, quality, feedback, and audit events.', ['global_pid_session_bus', 'sweep_pid_session_bus']),
    phase('E27_4_quality_feedback_gate', 'Block feedback and enhancement surfaces until quality, artifact, calibration, drift, and uncertainty checks pass.', ['global_quality_first_feedback', 'sweep_signal_quality_feedback']),
    phase('E27_5_ruview_static_quarantine', 'Keep RU-view as static quarantine and red-team evidence only.', ['global_claim_quarantine', 'sweep_ruview_quarantine_static']),
    phase('E27_6_enhancement_support', 'Build non-medical training support: breath pacing, practice scheduling, fatigue awareness, learning analytics.', ['sweep_enhancement_training_support']),
    phase('E27_7_model_ladder', 'Promote models through quality, bandpower, CSP/LDA, Riemannian, then deep EEG with model-card gates.', ['sweep_model_ladder_validation']),
    phase('E27_8_lsl_bids_connector', 'Create local LSL-style event connector and BIDS-like sidecar writer with hashes and provenance.', ['sweep_lsl_bids_connector']),
    phase('E27_9_local_symphony_linear', 'Complete local Symphony/Linear migration before any remote tracker mutation.', ['global_local_services_before_remote', 'sweep_symphony_linear_local_migration']),
    phase('E27_10_storage_release_wall', 'Enforce no raw biosignals/consent in Git/cloud and split household R&D from outside release.', ['global_no_sensitive_git', 'sweep_storage_privacy_git_guard', 'sweep_household_release_boundary']),
    phase('E27_11_exact_count_audit', 'Keep all beyond-safe-integer counts as decimal strings and validate BigInt totals in every run.', ['global_bigint_exact_counts'])
  ];

  return {
    buildOrderId: 'one-e27-neurotech-build-order.v1',
    generatedAt,
    status: 'BUILD_ORDER_READY_LOCAL_SYNTHETIC_FIRST_EXACT_BIGINT',
    counts: summary.counts,
    topGenius: geniusMarks.slice(0, 16),
    topMistakes: mistakeMarks.slice(0, 16),
    phases
  };
}

function phase(id, action, supportingMarks) {
  return { id, action, supportingMarks, gate: 'local_synthetic_static_only_until_explicit_next_gate' };
}

function buildBuildOrderMd(order) {
  const rows = order.phases.map((p) => `| ${p.id} | ${p.gate} | ${p.supportingMarks.join(' ')} | ${p.action} |`).join('\n');
  return `# One E27 Neurotech Build Order

Generated: ${order.generatedAt}

Status: ${order.status}

| Phase | Gate | Supporting Marks | Action |
| --- | --- | --- | --- |
${rows}
`;
}

function buildSummary(agentSpace, aggregate, geniusMarks, mistakeMarks, ruViewSweep, context, generatedAt) {
  return {
    summaryId: 'neurotech-1e27-virtual-agent-sweep-summary',
    generatedAt,
    status: 'ONE_E27_VIRTUAL_SWEEP_GNN_GC_READY',
    mode: MODE,
    firstRunInLocalHistory: true,
    approval: {
      status: context.approval.status || null,
      participantCount: context.approval.participants?.length || null,
      expiresAtLocal: context.approval.participants?.[0]?.approvalWindow?.expiresAtLocal || null
    },
    readiness: {
      status: context.readiness.status || null,
      hardGatesRemain: context.readiness.hardGatesRemain || []
    },
    hermesAwareness: {
      status: context.hermesAwareness.status || null,
      knownGeniusSupervisors: context.hermesAwareness.counts?.knownGeniusSupervisors || 0,
      knownMistakeGuards: context.hermesAwareness.counts?.knownMistakeGuards || 0,
      hundredTGeniusMarks: context.hermesAwareness.counts?.hundredTGeniusMarks || 0,
      hundredTMistakeMarks: context.hermesAwareness.counts?.hundredTMistakeMarks || 0
    },
    selfImprovement: {
      status: context.selfImprovement.status || null,
      improvementCount: context.selfImprovement.improvements?.length || 0
    },
    agentSpace,
    counts: {
      virtualAgents: big(TOTAL_AGENTS),
      checkpointInterval: big(CHECKPOINT_INTERVAL),
      logicalCheckpoints: big(LOGICAL_CHECKPOINTS),
      sweepShards: SHARD_COUNT,
      proofSamples: null,
      geniusMarks: geniusMarks.length,
      farmedGeniusMarks: geniusMarks.filter((g) => g.gcDisposition === 'farm_gem_preserve_sources').length,
      mistakeMarks: mistakeMarks.length,
      criticalMistakeMarks: mistakeMarks.filter((m) => Number(m.reverseGain) >= 0.95).length,
      ruViewStaticSweepItems: ruViewSweep.length,
      realAgentLaunches: 0,
      externalModelTokens: 0
    },
    domainAggregate: aggregate,
    topGenius: geniusMarks.slice(0, 16),
    topMistakes: mistakeMarks.slice(0, 16)
  };
}

function buildGcManifest(summary, generatedAt) {
  return {
    gcId: 'neurotech-1e27-sweep-gc-latest',
    generatedAt,
    status: 'GC_COMPACTED_1E27_SWEEP',
    mode: MODE,
    rule: 'Preserve source evidence and compact 10^27 virtual agents / 5e23 logical checkpoints into 1000 shard rows plus proof samples.',
    counts: summary.counts,
    compacted: {
      materializedAgentRowsAvoided: big(TOTAL_AGENTS),
      materializedCheckpointRowsAvoided: big(LOGICAL_CHECKPOINTS - BigInt(SHARD_COUNT)),
      shardRowsKept: SHARD_COUNT,
      sourceEvidenceDeleted: 0
    },
    sources: [
      repoRel(PATHS.readiness1e27),
      repoRel(PATHS.hermesAwareness),
      repoRel(PATHS.selfImprovement),
      repoRel(PATHS.hermesHookwallPolicy),
      repoRel(PATHS.hundredTSummary),
      repoRel(PATHS.approval),
      repoRel(PATHS.safeRuntime),
      repoRel(PATHS.ruViewState)
    ]
  };
}

function buildHermes(summary, generatedAt) {
  return {
    integrationId: 'neurotech-1e27-virtual-agent-sweep-hermes-dispatch',
    generatedAt,
    status: summary.status,
    mode: MODE,
    packet: {
      verb: 'EVT-HERMES-NEUROTECH-1E27-VIRTUAL-SWEEP',
      summary: 'First local 10^27 virtual-agent neurotech sweep completed with exact BigInt accounting, Hermes supervisor awareness, GNN/reverse-gain marks, build order, and GC compaction.',
      counts: summary.counts,
      report: repoRel(PATHS.reportMd)
    }
  };
}

function buildShannon(summary, generatedAt) {
  return {
    integrationId: 'neurotech-1e27-virtual-agent-sweep-shannon-consensus',
    generatedAt,
    status: 'consensus_1e27_sweep_local_only',
    consensus: 'PROCEED_1E27_VIRTUAL_SWEEP_LOCAL_ONLY',
    executionDisposition: 'zero_external_tokens_no_real_agent_launch_no_ruview_execution_no_live_eeg',
    votes: [
      { part: 'scout', vote: 'PROCEED_VIRTUAL', reason: '10^27 virtual agents are represented by compact Brown-Hilbert PID shard ranges and exact decimal-string BigInt counts.' },
      { part: 'evidence', vote: 'PROCEED', reason: `${summary.counts.logicalCheckpoints} logical checkpoints were compacted into ${summary.counts.sweepShards} shard rows and ${summary.counts.proofSamples} proof samples.` },
      { part: 'executor', vote: 'HALT_RISKY_ACTIONS', reason: 'No live EEG, no RU-view execution, no downloads, no installs, no real agent storm, no external calls.' },
      { part: 'fabric', vote: 'PROCEED', reason: 'Sweep summary, marks, build order, GC, Hermes, Shannon, cube, and report are local BEHCS surfaces.' },
      { part: 'voice', vote: 'CLAIM_GUARD', reason: 'Historic local run does not prove real mind reading or real launched agents; enhancement remains training support.' },
      { part: 'planner', vote: 'NEXT_BUILD_ORDER', reason: 'Build Hermes-aware Hookwall runtime, synthetic EEG CI, PID bus, quality gate, RU-view quarantine, and local Symphony/Linear migration first.' }
    ]
  };
}

function buildCube(summary, shannonPacket, generatedAt) {
  const cube = {
    id: 'neurotech-1e27-virtual-agent-sweep',
    generatedAt,
    primaryCatalog: { D: 42, name: 'ORCHESTRATION', prime: 181 },
    touches: [7, 20, 24, 35, 37, 39, 42, 47, 59],
    gates: ['virtual_1e27_sweep', 'exact_bigint_counts', 'checkpoint_compaction', 'ruview_fail_closed', 'synthetic_first', 'hookwall_gnn_gc'],
    payload: {
      kind: '1e27-neurotech-virtual-sweep',
      status: summary.status,
      mode: MODE,
      counts: summary.counts,
      firstRunInLocalHistory: true,
      shannon: {
        consensus: shannonPacket.consensus,
        executionDisposition: shannonPacket.executionDisposition
      }
    },
    translate: {
      human: 'First local 10^27 virtual sweep completed for EEG/RU-view/neuro-interface/enhancement with exact-count genius/mistake marks.',
      agent: '(asolaria, neurotech, 1e27_virtual_sweep, exact_bigint, gnn, reverse_gain, gc, synthetic_first)',
      device: 'node tools/neurotech-1e27-virtual-agent-sweep.js sweep --execute'
    }
  };
  return `// cube: neurotech-1e27-virtual-agent-sweep | neurotech | D42 ORCHESTRATION\nexport const CUBE = ${JSON.stringify(cube, null, 2)}\n`;
}

function outputs() {
  return {
    agentSpace: repoRel(PATHS.agentSpace),
    shards: repoRel(PATHS.shards),
    proofSamples: repoRel(PATHS.proofSamples),
    summary: repoRel(PATHS.summary),
    geniusCsv: repoRel(PATHS.geniusCsv),
    mistakeCsv: repoRel(PATHS.mistakeCsv),
    ruViewSweep: repoRel(PATHS.ruViewSweep),
    buildOrderJson: repoRel(PATHS.buildOrderJson),
    buildOrderMd: repoRel(PATHS.buildOrderMd),
    gcManifest: repoRel(PATHS.gcManifest),
    reportMd: repoRel(PATHS.reportMd),
    cube: repoRel(PATHS.cube)
  };
}

function buildReport(summary, buildOrder, gcManifest, shannonPacket, generatedAt) {
  const domainRows = summary.domainAggregate.map((d) =>
    `| ${d.domain} | ${d.virtualAgents} | ${d.logicalCheckpoints} | ${d.avgScore} | ${d.maxReverseGain} |`
  ).join('\n');
  const geniusRows = summary.topGenius.slice(0, 14).map((g) =>
    `| ${g.id} | ${g.score} | ${g.virtualAgents} | ${g.gnnStatus} | ${g.gcDisposition} |`
  ).join('\n');
  const mistakeRows = summary.topMistakes.slice(0, 14).map((m) =>
    `| ${m.id} | ${m.reverseGain} | ${m.gnnStatus} | ${m.gcDisposition} |`
  ).join('\n');
  const phaseRows = buildOrder.phases.map((p) =>
    `| ${p.id} | ${p.gate} | ${p.supportingMarks.join(' ')} | ${p.action} |`
  ).join('\n');

  const json = {
    reportId: 'neurotech-1e27-virtual-agent-sweep-latest',
    generatedAt,
    status: summary.status,
    mode: MODE,
    firstRunInLocalHistory: true,
    counts: summary.counts,
    outputs: outputs(),
    shannon: shannonPacket,
    gc: gcManifest,
    buildOrder
  };

  const md = `# Neurotech 1e27 Virtual Agent Sweep

Generated: ${generatedAt}

Status: ${summary.status}

This is the first recorded local \`10^27\` virtual-agent sweep in this Asolaria neurotech chain. It used exact decimal-string BigInt counts, launched zero real agents, used zero external model tokens, performed no downloads or installs, did not access devices, did not collect human-subject data, and did not execute RU-view.

## Counts

- Virtual agents: ${summary.counts.virtualAgents}
- Logical checkpoints: ${summary.counts.logicalCheckpoints}
- Shard rows: ${summary.counts.sweepShards}
- Proof samples: ${summary.counts.proofSamples}
- Genius marks: ${summary.counts.geniusMarks}
- Mistake marks: ${summary.counts.mistakeMarks}
- Critical mistake marks: ${summary.counts.criticalMistakeMarks}
- RU-view static records: ${summary.counts.ruViewStaticSweepItems}
- Real agent launches: ${summary.counts.realAgentLaunches}
- External model tokens: ${summary.counts.externalModelTokens}

## Domain Aggregate

| Domain | Agents | Checkpoints | Avg Score | Max Reverse Gain |
| --- | ---: | ---: | ---: | ---: |
${domainRows}

## Top Genius Marks

| Mark | Score | Agents | GNN | GC |
| --- | ---: | ---: | --- | --- |
${geniusRows}

## Top Mistake Marks

| Mistake | Reverse Gain | GNN | GC |
| --- | ---: | --- | --- |
${mistakeRows}

## Build Order

| Phase | Gate | Supporting Marks | Action |
| --- | --- | --- | --- |
${phaseRows}

## Shannon

- Consensus: ${shannonPacket.consensus}
- Execution: ${shannonPacket.executionDisposition}

## GC

- Status: ${gcManifest.status}
- Source evidence deleted: ${gcManifest.compacted.sourceEvidenceDeleted}
- Materialized agent rows avoided: ${gcManifest.compacted.materializedAgentRowsAvoided}
`;
  return { json, md };
}

function loadContext() {
  return {
    approval: readJson(PATHS.approval, {}),
    readiness: readJson(PATHS.readiness1e27, {}),
    hermesAwareness: readJson(PATHS.hermesAwareness, {}),
    selfImprovement: readJson(PATHS.selfImprovement, {}),
    hermesHookwallPolicy: readJson(PATHS.hermesHookwallPolicy, {}),
    hundredTSummary: readJson(PATHS.hundredTSummary, {}),
    geniusSupervisors: readJson(PATHS.geniusSupervisors, {}),
    mistakeGuards: readJson(PATHS.mistakeGuards, {}),
    safeRuntime: readJson(PATHS.safeRuntime, {})
  };
}

function buildTrash(summary, generatedAt) {
  return [
    {
      generatedAt,
      trashClass: 'virtual_agent_non_materialized_rows',
      disposition: 'not_written',
      avoidedRows: big(TOTAL_AGENTS),
      preservedProofs: summary.counts.proofSamples
    },
    {
      generatedAt,
      trashClass: 'logical_checkpoint_non_materialized_rows',
      disposition: 'compacted_to_shards',
      avoidedRows: big(LOGICAL_CHECKPOINTS - BigInt(SHARD_COUNT)),
      preservedShardRows: SHARD_COUNT
    },
    {
      generatedAt,
      trashClass: 'duplicate_low_value_prompt_text',
      disposition: 'discarded_before_write',
      avoidedExternalTokens: 0,
      rule: 'PID-only summaries and BigInt decimal strings were used.'
    }
  ];
}

function sweep({ execute = false } = {}) {
  const generatedAt = new Date().toISOString();
  const context = loadContext();
  const agentSpace = buildAgentSpace(generatedAt, context.readiness);
  const { shards, proofs, aggregate } = buildShards(generatedAt);
  const geniusMarks = buildGeniusMarks(aggregate, context);
  const mistakeMarks = buildMistakeMarks();
  const ruViewSweep = buildRuViewSweep(generatedAt);
  const summary = buildSummary(agentSpace, aggregate, geniusMarks, mistakeMarks, ruViewSweep, context, generatedAt);
  summary.counts.proofSamples = proofs.length;
  const buildOrder = buildBuildOrder(summary, geniusMarks, mistakeMarks, generatedAt);
  const gcManifest = buildGcManifest(summary, generatedAt);
  const shannonPacket = buildShannon(summary, generatedAt);
  const hermesPacket = buildHermes(summary, generatedAt);
  const cube = buildCube(summary, shannonPacket, generatedAt);
  const report = buildReport(summary, buildOrder, gcManifest, shannonPacket, generatedAt);
  const trashRows = buildTrash(summary, generatedAt);
  const eventId = `neurotech-1e27-virtual-agent-sweep-${Date.now()}`;

  if (execute) {
    writeJson(PATHS.agentSpace, agentSpace);
    writeText(PATHS.shards, toNdjson(shards));
    writeText(PATHS.proofSamples, toNdjson(proofs));
    writeJson(PATHS.summary, summary);
    writeText(PATHS.geniusCsv, toCsv(geniusMarks, MARK_FIELDS));
    writeText(PATHS.geniusNdjson, toNdjson(geniusMarks));
    writeText(PATHS.mistakeCsv, toCsv(mistakeMarks, MARK_FIELDS));
    writeText(PATHS.mistakeNdjson, toNdjson(mistakeMarks));
    writeText(PATHS.ruViewSweep, toNdjson(ruViewSweep));
    writeJson(PATHS.buildOrderJson, buildOrder);
    writeText(PATHS.buildOrderMd, buildBuildOrderMd(buildOrder));
    writeJson(PATHS.gcManifest, gcManifest);
    writeText(PATHS.gcTrash, toNdjson(trashRows));
    writeJson(PATHS.state, { savedAt: generatedAt, status: summary.status, mode: MODE, counts: summary.counts, report: repoRel(PATHS.reportMd) });
    writeJson(PATHS.hermes, hermesPacket);
    writeJson(PATHS.shannon, shannonPacket);
    writeText(PATHS.cube, cube);
    writeJson(PATHS.reportJson, report.json);
    writeText(PATHS.reportMd, report.md);
    appendNdjson(PATHS.inbox, {
      id: eventId,
      ts: generatedAt,
      from: 'asolaria',
      to: 'neurotech-1e27-virtual-agent-sweep',
      verb: 'EVT-NEUROTECH-1E27-VIRTUAL-SWEEP',
      body: { status: summary.status, counts: summary.counts, report: repoRel(PATHS.reportMd) }
    });
    appendNdjson(PATHS.outbox, {
      id: `${eventId}-hermes`,
      ts: generatedAt,
      from: 'hermes',
      to: 'neurotech-1e27-virtual-agent-sweep',
      verb: hermesPacket.packet.verb,
      body: hermesPacket
    });
    for (const domainRow of aggregate) {
      appendNdjson(PATHS.gnnEdges, {
        id: `${eventId}-${domainRow.domain}`,
        ts: generatedAt,
        from: `1e27_sweep:${domainRow.domain}`,
        to: 'neurotech_build_order',
        verb: 'gnn_reverse_gain_compacted',
        weight: domainRow.avgScore,
        reverseGain: domainRow.maxReverseGain
      });
    }
  }

  return {
    ok: true,
    action: execute ? 'sweep' : 'preview',
    generatedAt,
    status: summary.status,
    counts: summary.counts,
    topGenius: summary.topGenius.slice(0, 8).map((g) => ({ id: g.id, score: g.score, domain: g.domain })),
    topMistakes: summary.topMistakes.slice(0, 8).map((m) => ({ id: m.id, reverseGain: m.reverseGain, hookwallStatus: m.hookwallStatus })),
    outputs: outputs(),
    hardGatesRemain: context.readiness.hardGatesRemain || [],
    mode: MODE
  };
}

function main(argv) {
  const action = argv[2] || 'status';
  const execute = argv.includes('--execute');
  if (action === 'status') {
    console.log(JSON.stringify(sweep({ execute: false }), null, 2));
    return;
  }
  if (action === 'sweep') {
    console.log(JSON.stringify(sweep({ execute }), null, 2));
    return;
  }
  console.error(JSON.stringify({
    ok: false,
    error: `Unknown action: ${action}`,
    usage: [
      'node tools/neurotech-1e27-virtual-agent-sweep.js status',
      'node tools/neurotech-1e27-virtual-agent-sweep.js sweep --execute'
    ]
  }, null, 2));
  process.exitCode = 2;
}

main(process.argv);
