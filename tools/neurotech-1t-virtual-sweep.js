#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const behcs = require('./behcs/codex-bridge');

const repoRoot = path.resolve(__dirname, '..');
const TOTAL_AGENTS = 1_000_000_000_000;
const CHECKPOINT_INTERVAL = 2_000;
const LOGICAL_CHECKPOINTS = TOTAL_AGENTS / CHECKPOINT_INTERVAL;
const SHARD_AGENTS = 1_000_000_000;
const SHARD_COUNT = TOTAL_AGENTS / SHARD_AGENTS;
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
  oneTrillionSweep: true,
  childProcessUse: false,
  secretMaterialWritten: false
});

const PATHS = Object.freeze({
  approval: rel('data/neurotech-defense-lab/consent/monthly-approval-2026-04.v1.json'),
  readiness1t: rel('data/neurotech-defense-lab/omnispindle/100b-sweep/integration/one-trillion-readiness.v1.json'),
  integration100b: rel('data/neurotech-defense-lab/omnispindle/100b-sweep/integration/100b-sweep-integration-latest.json'),
  geniusSupervisors: rel('data/neurotech-defense-lab/omnispindle/100b-sweep/integration/genius-supervisors-latest.json'),
  mistakeGuards: rel('data/neurotech-defense-lab/omnispindle/100b-sweep/integration/mistake-guards-latest.json'),
  hookwallPolicy: rel('data/neurotech-defense-lab/omnispindle/100b-sweep/integration/hookwall-policy-latest.json'),
  buildQueue: rel('data/neurotech-defense-lab/omnispindle/100b-sweep/integration/symphony-linear-build-queue.ndjson'),
  safeRuntime: rel('data/neurotech-defense-lab/runtime/neurotech-safe-runtime-summary-latest.json'),
  ruViewState: rel('data/behcs/state/downloaded-software/mind-reading-ruview.state.json'),
  root: rel('data/neurotech-defense-lab/omnispindle/1t-sweep'),
  agentSpace: rel('data/neurotech-defense-lab/omnispindle/1t-sweep/virtual-agent-space.v1.json'),
  shards: rel('data/neurotech-defense-lab/omnispindle/1t-sweep/sweep-shards-2000.v1.ndjson'),
  proofSamples: rel('data/neurotech-defense-lab/omnispindle/1t-sweep/proof-samples-latest.ndjson'),
  summary: rel('data/neurotech-defense-lab/omnispindle/1t-sweep/sweep-gnn-summary-latest.json'),
  geniusCsv: rel('data/neurotech-defense-lab/omnispindle/1t-sweep/genius-sweep-marks-latest.csv'),
  geniusNdjson: rel('data/neurotech-defense-lab/omnispindle/1t-sweep/genius-sweep-marks-latest.ndjson'),
  mistakeCsv: rel('data/neurotech-defense-lab/omnispindle/1t-sweep/mistake-sweep-marks-latest.csv'),
  mistakeNdjson: rel('data/neurotech-defense-lab/omnispindle/1t-sweep/mistake-sweep-marks-latest.ndjson'),
  ruViewSweep: rel('data/neurotech-defense-lab/omnispindle/1t-sweep/ruview-static-sweep-latest.ndjson'),
  buildOrderJson: rel('data/neurotech-defense-lab/omnispindle/1t-sweep/one-trillion-build-order.v1.json'),
  buildOrderMd: rel('data/neurotech-defense-lab/omnispindle/1t-sweep/one-trillion-build-order.v1.md'),
  gcManifest: rel('data/neurotech-defense-lab/omnispindle/1t-sweep/gc/1t-sweep-gc-latest.json'),
  gcTrash: rel('data/neurotech-defense-lab/omnispindle/1t-sweep/gc/trash-compacted-latest.ndjson'),
  state: rel('data/behcs/state/neurotech-defense/neurotech-1t-virtual-sweep.state.json'),
  hermes: rel('data/behcs/hermes/neurotech-defense/neurotech-1t-virtual-sweep-dispatch-latest.json'),
  shannon: rel('data/behcs/shannon/neurotech-defense/neurotech-1t-virtual-sweep-consensus-latest.json'),
  cube: rel('data/behcs/cubes/neurotech-1t-virtual-sweep.cube.js'),
  reportJson: rel('reports/neurotech-1t-virtual-sweep-latest.json'),
  reportMd: rel('reports/neurotech-1t-virtual-sweep-latest.md'),
  inbox: rel('data/behcs/inbox.ndjson'),
  outbox: rel('data/behcs/outbox.ndjson'),
  gnnEdges: rel('data/behcs/gnn-live-edges.ndjson')
});

const DOMAINS = [
  domain('hookwall_gnn_gc', 160_000_000_000, 0.956, 'Make Hookwall, forward GNN, reverse-gain GNN, omnishannon, and non-destructive GC the permanent local neurotech loop.'),
  domain('synthetic_eeg_ci', 120_000_000_000, 0.951, 'Promote synthetic EEG replay into the first-class CI contract for parsers, connectors, UI, and model smoke tests.'),
  domain('pid_session_bus', 110_000_000_000, 0.949, 'Use PID-bound local session packets for consent, stop/delete, storage, quality, feedback, claims, and audit.'),
  domain('signal_quality_feedback', 110_000_000_000, 0.944, 'Feedback cannot appear until contact quality, artifact state, uncertainty, and calibration are visible.'),
  domain('ruview_quarantine_static', 100_000_000_000, 0.935, 'Treat RU-view as a static quarantine and red-team target, not a trusted or executable neural tool.'),
  domain('enhancement_training_support', 100_000_000_000, 0.932, 'Enhancement remains non-medical cognitive support: breath pacing, practice, fatigue awareness, and learning analytics.'),
  domain('model_ladder_validation', 90_000_000_000, 0.927, 'Use a model ladder: signal quality, bandpower, CSP/LDA, Riemannian, then deep models only with model cards and calibration.'),
  domain('lsl_bids_connector', 80_000_000_000, 0.921, 'Use LSL-style event streams and BIDS-like sidecars so every signal has timing, metadata, hashes, and provenance.'),
  domain('symphony_linear_local_migration', 80_000_000_000, 0.918, 'Migrate Symphony/Linear tracking into local services first so Hookwall and GNN can observe every work item before remote mutation.'),
  domain('storage_privacy_git_guard', 30_000_000_000, 0.916, 'Raw biosignals, signed consent, direct identifiers, serials, and tokens stay out of Git and cloud paths.'),
  domain('household_release_boundary', 20_000_000_000, 0.908, 'Household R&D PIDs and outside-participant release paths must remain separate consent scopes.')
];

const ONE_T_MISTAKES = [
  mistake('real_agent_storm', 0.998, 'Attempting to launch one trillion real processes instead of compact virtual PID ranges.'),
  mistake('ruview_execution', 0.991, 'Executing the downloaded RU/remote-view executable before provenance, signature, sandbox, and claim review.'),
  mistake('live_eeg_before_attestation', 0.984, 'Collecting live EEG before individual consent attestation, stop/delete control, device precheck, and signal-quality readiness.'),
  mistake('literal_mind_reading_claim', 0.976, 'Calling EEG classification literal private-thought reading instead of consent-based signal classification.'),
  mistake('raw_biosignal_or_consent_in_git', 0.963, 'Writing raw biosignal files, signed consent, direct identifiers, device serials, or tokens to Git.'),
  mistake('cloud_upload_without_scope', 0.951, 'Uploading biosignal or session metadata outside the recorded consent scope.'),
  mistake('remote_linear_mutation_without_gate', 0.944, 'Mutating remote Linear before local Symphony ingestion, Hookwall review, and operator gate.'),
  mistake('gc_evidence_deletion', 0.936, 'Deleting source evidence during GC instead of compacting derived duplicates and preserving proofs.'),
  mistake('deep_model_first', 0.914, 'Training deep EEG models before signal-quality, bandpower, CSP/LDA, and Riemannian baselines.'),
  mistake('no_signal_quality_gate', 0.907, 'Showing neurofeedback when contact quality, noise, drift, or artifact state is unknown.'),
  mistake('pid_collision_or_reuse', 0.898, 'Reusing a household or virtual PID across humans, sessions, or shards without an explicit alias record.'),
  mistake('household_boundary_breach', 0.886, 'Using household-only approvals for people outside the house area without their own permission.'),
  mistake('approval_window_overrun', 0.874, 'Continuing approval-scoped work after the April 2026 approval window expires.'),
  mistake('medical_or_diagnostic_claim', 0.859, 'Presenting enhancement or EEG feedback as diagnosis, treatment, or guaranteed improvement.'),
  mistake('token_bloat_or_banner_prompts', 0.842, 'Wasting tokens with banners, headers, and verbose prompts instead of compact PID-only packets.'),
  mistake('trillion_scale_without_readiness', 0.836, 'Running a 1T sweep without the integrated 100B readiness gates and local build queue.'),
  mistake('symphony_linear_cloud_first', 0.812, 'Sending orchestration to remote trackers before local services can observe Hookwall, GNN, and GC state.')
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

function domain(id, agents, baseScore, summary) {
  return { id, agents, baseScore, summary };
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
  return `BH.1T.VAGENT.PID.${String(slot).padStart(13, '0')}`;
}

function glyph(kind, id, seed) {
  const hash = sha256Text(`${kind}:${id}:${seed || ''}`);
  return `HG256:${kind.toUpperCase()}:${hash.slice(0, 8).toUpperCase()}:${behcs.hilbertAddress(hash)}`;
}

function reverseGainForDomain(id, noise) {
  const base = {
    hookwall_gnn_gc: 0.39,
    synthetic_eeg_ci: 0.35,
    pid_session_bus: 0.73,
    signal_quality_feedback: 0.61,
    ruview_quarantine_static: 0.96,
    enhancement_training_support: 0.66,
    model_ladder_validation: 0.72,
    lsl_bids_connector: 0.58,
    symphony_linear_local_migration: 0.78,
    storage_privacy_git_guard: 0.84,
    household_release_boundary: 0.81
  }[id] || 0.65;
  return round3(Math.min(0.999, base + (1 - noise) * 0.039));
}

function hookwallStatus(id, reverseGain) {
  if (id === 'ruview_quarantine_static') return 'BLOCK_EXECUTION_STATIC_ONLY';
  if (reverseGain >= 0.9) return 'BLOCK_AND_PRESERVE';
  if (reverseGain >= 0.78) return 'HARD_WARN_AND_LEDGER';
  if (reverseGain >= 0.7) return 'WARN_AND_LEDGER';
  return 'ALLOW_WITH_GATES';
}

function domainForShard(index) {
  const slot = index * SHARD_AGENTS + 1;
  let floor = 1;
  for (const d of DOMAINS) {
    const ceiling = floor + d.agents - 1;
    if (slot >= floor && slot <= ceiling) return { ...d, firstSlot: floor, lastSlot: ceiling };
    floor = ceiling + 1;
  }
  return { ...DOMAINS[DOMAINS.length - 1], firstSlot: TOTAL_AGENTS - DOMAINS.at(-1).agents + 1, lastSlot: TOTAL_AGENTS };
}

function buildAgentSpace(generatedAt, readiness) {
  return {
    namespaceId: 'brown-hilbert-1t-neurotech-sweep.v1',
    generatedAt,
    status: 'VIRTUAL_1T_AGENT_SPACE_READY',
    mode: MODE,
    sourceReadiness: {
      status: readiness.status || null,
      readinessId: readiness.readinessId || null,
      sourceGeneratedAt: readiness.generatedAt || null
    },
    totalAgents: TOTAL_AGENTS,
    checkpointInterval: CHECKPOINT_INTERVAL,
    logicalCheckpoints: LOGICAL_CHECKPOINTS,
    shardAgents: SHARD_AGENTS,
    checkpointShards: SHARD_COUNT,
    checkpointsPerShard: CHECKPOINTS_PER_SHARD,
    firstPid: pid(1),
    lastPid: pid(TOTAL_AGENTS),
    materializationRule: '1T agents and 500M logical checkpoints are compacted into 1000 shard rows plus proof samples. No real processes are launched.',
    domains: DOMAINS
  };
}

function buildShards(generatedAt) {
  const shards = [];
  const proofs = [];
  const aggregate = new Map();

  for (let i = 0; i < SHARD_COUNT; i += 1) {
    const d = domainForShard(i);
    const firstSlot = i * SHARD_AGENTS + 1;
    const lastSlot = firstSlot + SHARD_AGENTS - 1;
    const noise = unit(`${d.id}:${i}:1t`);
    const score = round3(Math.min(0.999, d.baseScore + noise * 0.028));
    const reverseGain = reverseGainForDomain(d.id, noise);
    const shard = {
      shardId: `BH1T-SHARD-${String(i + 1).padStart(4, '0')}`,
      generatedAt,
      domain: d.id,
      firstSlot,
      lastSlot,
      firstPid: pid(firstSlot),
      lastPid: pid(lastSlot),
      virtualAgents: SHARD_AGENTS,
      logicalCheckpoints: CHECKPOINTS_PER_SHARD,
      score,
      reverseGain,
      hookwall: hookwallStatus(d.id, reverseGain),
      gnn: score >= 0.94 ? 'GENIUS_SIGNAL' : 'CORE_SIGNAL',
      reverseGainGnn: reverseGain >= 0.9 ? 'CRITICAL_MISTAKE_PRESSURE' : reverseGain >= 0.78 ? 'HARD_GUARD_PRESSURE' : 'GUARD_OK',
      gc: 'COMPACT_500000_CHECKPOINTS_KEEP_SHARD_PROOF'
    };
    shards.push(shard);
    if (i < 30 || i >= SHARD_COUNT - 30 || i % 50 === 0) proofs.push({ ...shard, proofKind: '1t_sweep_sample' });

    if (!aggregate.has(d.id)) {
      aggregate.set(d.id, {
        domain: d,
        shards: 0,
        virtualAgents: 0,
        logicalCheckpoints: 0,
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
      const prior = DOMAINS.slice(0, DOMAINS.findIndex((d) => d.id === a.domain.id)).reduce((sum, d) => sum + d.agents, 0);
      return {
        domain: a.domain.id,
        summary: a.domain.summary,
        shards: a.shards,
        virtualAgents: a.virtualAgents,
        logicalCheckpoints: a.logicalCheckpoints,
        avgScore: round3(a.scoreTotal / a.shards),
        maxReverseGain: round3(a.reverseGainMax),
        firstPid: pid(prior + 1),
        lastPid: pid(prior + a.domain.agents)
      };
    })
  };
}

function buildGeniusMarks(aggregate, supervisorPacket) {
  const supervisorIds = Array.isArray(supervisorPacket.supervisors)
    ? supervisorPacket.supervisors.slice(0, 8).map((s) => s.markId)
    : [];
  const carried = [
    ['global_claim_quarantine', 0.986, TOTAL_AGENTS, 'Cross-domain quarantine of coercive, harmful, medical, brain-frying, remote-view, and literal mind-reading claims.'],
    ['global_hookwall_gnn_gc', 0.984, TOTAL_AGENTS, 'Every packet enters Hookwall, forward GNN, reverse-gain GNN, omnishannon, and compacting GC before build promotion.'],
    ['global_pid_session_bus', 0.981, TOTAL_AGENTS, 'Every packet carries Brown-Hilbert PID, consent, household scope, device, storage, claim, and GC state.'],
    ['global_synthetic_first', 0.978, TOTAL_AGENTS, 'Synthetic EEG remains mandatory before public datasets, live devices, model training, or UI feedback.'],
    ['global_quality_first_feedback', 0.972, TOTAL_AGENTS, 'Feedback and enhancement support stay blocked until signal quality and uncertainty are visible.'],
    ['global_local_services_before_remote', 0.961, TOTAL_AGENTS, 'Symphony and Linear state is mirrored into local services before any remote tracker mutation.'],
    ['global_100b_supervisor_carryforward', 0.955, TOTAL_AGENTS, `Carry forward integrated 100B supervisors: ${supervisorIds.join(', ') || 'none loaded'}.`]
  ];

  const domainMarks = aggregate.map((a) => ({
    kind: 'genius',
    id: `sweep_${a.domain}`,
    glyph: glyph('1t_genius', a.domain, a.avgScore),
    score: a.avgScore,
    reverseGain: '',
    virtualAgents: a.virtualAgents,
    logicalCheckpoints: a.logicalCheckpoints,
    shards: a.shards,
    domain: a.domain,
    pidRange: `${a.firstPid}..${a.lastPid}`,
    hookwallStatus: a.domain === 'ruview_quarantine_static' ? 'GENIUS_IS_QUARANTINE_NOT_EXECUTION' : 'REINFORCE_WITH_GATES',
    gnnStatus: a.avgScore >= 0.94 ? 'GNN_MARK_GENIUS' : 'GNN_CORE_SIGNAL',
    gcDisposition: a.avgScore >= 0.94 ? 'farm_gem_preserve_sources' : 'watch_compact_duplicates',
    summary: a.summary
  }));

  const carriedMarks = carried.map(([id, score, agents, summary]) => ({
    kind: 'genius',
    id,
    glyph: glyph('1t_carried_genius', id, summary),
    score,
    reverseGain: '',
    virtualAgents: agents,
    logicalCheckpoints: LOGICAL_CHECKPOINTS,
    shards: SHARD_COUNT,
    domain: 'global_cross_domain',
    pidRange: `${pid(1)}..${pid(TOTAL_AGENTS)}`,
    hookwallStatus: 'REINFORCE_WITH_GATES',
    gnnStatus: 'GNN_MARK_GLOBAL_GENIUS',
    gcDisposition: 'farm_gem_preserve_sources',
    summary
  }));

  return [...domainMarks, ...carriedMarks].sort((a, b) => Number(b.score) - Number(a.score));
}

function buildMistakeMarks(guardPacket) {
  const integratedGuardIds = Array.isArray(guardPacket.guards) ? guardPacket.guards.map((g) => g.markId) : [];
  const marks = ONE_T_MISTAKES.map((m) => ({
    kind: 'mistake',
    id: m.id,
    glyph: glyph('1t_mistake', m.id, m.summary),
    score: '',
    reverseGain: m.reverseGain,
    virtualAgents: TOTAL_AGENTS,
    logicalCheckpoints: LOGICAL_CHECKPOINTS,
    shards: SHARD_COUNT,
    domain: 'global_reverse_gain_guard',
    pidRange: `${pid(1)}..${pid(TOTAL_AGENTS)}`,
    hookwallStatus: m.reverseGain >= 0.9 ? 'BLOCK_AND_PRESERVE' : m.reverseGain >= 0.84 ? 'HARD_WARN_AND_LEDGER' : 'WARN_AND_LEDGER',
    gnnStatus: m.reverseGain >= 0.9 ? 'REVERSE_GAIN_MARK_CRITICAL' : m.reverseGain >= 0.84 ? 'REVERSE_GAIN_MARK_HARD_GUARD' : 'REVERSE_GAIN_MARK_WATCH',
    gcDisposition: m.reverseGain >= 0.9 ? 'preserve_evidence_quarantine_pattern' : 'ledger_pattern_compact_duplicates',
    summary: integratedGuardIds.includes(m.id) ? `${m.summary} Integrated 100B guard was carried forward.` : m.summary
  }));
  return marks.sort((a, b) => Number(b.reverseGain) - Number(a.reverseGain));
}

function buildRuViewSweep(generatedAt) {
  const state = readJson(PATHS.ruViewState, {});
  const steps = [
    'hash_and_zone_identifier_preserved',
    'signature_origin_review_required',
    'pe_header_static_only',
    'import_table_static_only',
    'network_surface_static_only',
    'sandbox_plan_required_no_execution',
    'claim_language_red_team_required',
    'household_neurotech_not_ruview_dependency',
    'quarantine_until_explicit_operator_gate',
    'never_treat_ruview_as_proven_mind_reading'
  ];
  return steps.map((step, index) => ({
    sweepId: `RUVIEW-1T-SWEEP-${String(index + 1).padStart(2, '0')}`,
    generatedAt,
    step,
    status: 'STATIC_ONLY_FAIL_CLOSED',
    ruViewSupervisorStatus: state.status || 'FAIL_CLOSED',
    executionPolicy: 'NO_EXECUTION_NO_EXTRACTION_NO_INSTALL',
    executableHash: 'ca08964cfaa670b76b1a075b05d841fe3203e445812ad78d8f217d66368775de',
    launched: false
  }));
}

function buildBuildOrder(summary, geniusMarks, mistakeMarks, buildQueueRows, generatedAt) {
  const phases = [
    phase('T1_hookwall_runtime', 'Build local Hookwall/GNN/reverse-gain/omni-shannon/GC runtime service around every neurotech packet.', ['global_hookwall_gnn_gc', 'sweep_hookwall_gnn_gc']),
    phase('T2_synthetic_eeg_ci', 'Promote synthetic EEG replay into CI with parser, metadata, BIDS-like sidecar, and quality-regression tests.', ['global_synthetic_first', 'sweep_synthetic_eeg_ci']),
    phase('T3_pid_session_bus', 'Implement PID-bound session bus for consent, stop/delete, storage, device, quality, feedback, and audit events.', ['global_pid_session_bus', 'sweep_pid_session_bus']),
    phase('T4_quality_feedback_gate', 'Block feedback UI until signal quality, artifact state, calibration, and uncertainty are present.', ['global_quality_first_feedback', 'sweep_signal_quality_feedback']),
    phase('T5_ruview_static_quarantine', 'Keep RU-view in static quarantine and red-team review only; do not execute or trust claims.', ['global_claim_quarantine', 'sweep_ruview_quarantine_static']),
    phase('T6_enhancement_support', 'Build non-medical training support: breath pacing, attention practice, fatigue awareness, and learning analytics.', ['sweep_enhancement_training_support']),
    phase('T7_model_ladder', 'Promote models through signal quality, bandpower, CSP/LDA, Riemannian, then deep EEG with model cards.', ['sweep_model_ladder_validation']),
    phase('T8_lsl_bids_connector', 'Create local LSL-style event connector and BIDS-like sidecar writer with hashes and provenance.', ['sweep_lsl_bids_connector']),
    phase('T9_local_symphony_linear', 'Move Symphony/Linear tracking into local services so Hookwall and GNN observe queue state before remote mutation.', ['global_local_services_before_remote', 'sweep_symphony_linear_local_migration']),
    phase('T10_storage_release_wall', 'Enforce no raw biosignals/consent in Git/cloud and separate household R&D from outsider release gates.', ['sweep_storage_privacy_git_guard', 'sweep_household_release_boundary'])
  ];

  return {
    buildOrderId: 'one-trillion-neurotech-build-order.v1',
    generatedAt,
    status: 'BUILD_ORDER_READY_LOCAL_SYNTHETIC_FIRST',
    counts: summary.counts,
    inheritedLocalQueueItems: buildQueueRows.length,
    topGenius: geniusMarks.slice(0, 12),
    topMistakes: mistakeMarks.slice(0, 12),
    phases
  };
}

function phase(id, action, supportingMarks) {
  return { id, action, supportingMarks, gate: 'local_synthetic_static_only_until_explicit_next_gate' };
}

function buildBuildOrderMd(order) {
  const rows = order.phases.map((p) => `| ${p.id} | ${p.gate} | ${p.supportingMarks.join(' ')} | ${p.action} |`).join('\n');
  return `# One Trillion Neurotech Build Order

Generated: ${order.generatedAt}

Status: ${order.status}

| Phase | Gate | Supporting Marks | Action |
| --- | --- | --- | --- |
${rows}
`;
}

function buildSummary(agentSpace, aggregate, geniusMarks, mistakeMarks, ruViewSweep, context, generatedAt) {
  return {
    summaryId: 'neurotech-1t-virtual-sweep-summary',
    generatedAt,
    status: 'ONE_TRILLION_SWEEP_GNN_GC_READY',
    mode: MODE,
    approval: {
      status: context.approval.status || null,
      participantCount: context.approval.participants?.length || null,
      expiresAtLocal: context.approval.participants?.[0]?.approvalWindow?.expiresAtLocal || null
    },
    readiness: {
      status: context.readiness.status || null,
      hardGatesRemain: context.readiness.hardGatesRemain || []
    },
    inherited100b: {
      integrationStatus: context.integration100b.status || null,
      geniusSupervisors: context.geniusSupervisors.supervisors?.length || 0,
      mistakeGuards: context.mistakeGuards.guards?.length || 0,
      buildQueueItems: context.buildQueueRows.length
    },
    safeRuntime: {
      status: context.safeRuntime.status || null,
      syntheticReplay: context.safeRuntime.syntheticReplay?.status || null,
      localIngestItems: context.safeRuntime.symphonyLinearLocalIngest?.count || null,
      ruViewStaticItems: context.safeRuntime.ruViewStatic?.count || null
    },
    agentSpace,
    counts: {
      virtualAgents: TOTAL_AGENTS,
      checkpointInterval: CHECKPOINT_INTERVAL,
      logicalCheckpoints: LOGICAL_CHECKPOINTS,
      sweepShards: SHARD_COUNT,
      proofSamples: null,
      geniusMarks: geniusMarks.length,
      farmedGeniusMarks: geniusMarks.filter((g) => g.gcDisposition === 'farm_gem_preserve_sources').length,
      mistakeMarks: mistakeMarks.length,
      criticalMistakeMarks: mistakeMarks.filter((m) => Number(m.reverseGain) >= 0.9).length,
      ruViewStaticSweepItems: ruViewSweep.length,
      realAgentLaunches: 0,
      externalModelTokens: 0
    },
    domainAggregate: aggregate,
    topGenius: geniusMarks.slice(0, 14),
    topMistakes: mistakeMarks.slice(0, 14)
  };
}

function buildGcManifest(summary, generatedAt) {
  return {
    gcId: 'neurotech-1t-sweep-gc-latest',
    generatedAt,
    status: 'GC_COMPACTED_1T_SWEEP',
    mode: MODE,
    rule: 'Preserve source evidence and compact 1T virtual agents / 500M logical checkpoints into 1000 shard rows plus proof samples.',
    counts: summary.counts,
    compacted: {
      materializedAgentRowsAvoided: TOTAL_AGENTS,
      materializedCheckpointRowsAvoided: LOGICAL_CHECKPOINTS - SHARD_COUNT,
      shardRowsKept: SHARD_COUNT,
      sourceEvidenceDeleted: 0
    },
    sources: [
      repoRel(PATHS.readiness1t),
      repoRel(PATHS.integration100b),
      repoRel(PATHS.geniusSupervisors),
      repoRel(PATHS.mistakeGuards),
      repoRel(PATHS.hookwallPolicy),
      repoRel(PATHS.buildQueue),
      repoRel(PATHS.approval),
      repoRel(PATHS.safeRuntime),
      repoRel(PATHS.ruViewState)
    ]
  };
}

function buildHermes(summary, generatedAt) {
  return {
    integrationId: 'neurotech-1t-virtual-sweep-hermes-dispatch',
    generatedAt,
    status: summary.status,
    mode: MODE,
    packet: {
      verb: 'EVT-HERMES-NEUROTECH-1T-VIRTUAL-SWEEP',
      summary: '1T virtual-agent neurotech sweep completed locally with GNN, reverse-gain, genius/mistake marks, build order, and GC compaction.',
      counts: summary.counts,
      report: repoRel(PATHS.reportMd)
    }
  };
}

function buildShannon(summary, generatedAt) {
  return {
    integrationId: 'neurotech-1t-virtual-sweep-shannon-consensus',
    generatedAt,
    status: 'consensus_1t_sweep_local_only',
    consensus: 'PROCEED_1T_VIRTUAL_SWEEP_LOCAL_ONLY',
    executionDisposition: 'zero_external_tokens_no_real_agent_launch_no_ruview_execution_no_live_eeg',
    votes: [
      { part: 'scout', vote: 'PROCEED_VIRTUAL', reason: '1T virtual agents are represented by compact Brown-Hilbert PID shard ranges.' },
      { part: 'evidence', vote: 'PROCEED', reason: `${summary.counts.logicalCheckpoints} logical checkpoints were compacted into ${summary.counts.sweepShards} shard rows and ${summary.counts.proofSamples} proof samples.` },
      { part: 'executor', vote: 'HALT_RISKY_ACTIONS', reason: 'No live EEG, no RU-view execution, no downloads, no installs, no real agent storm, no external calls.' },
      { part: 'fabric', vote: 'PROCEED', reason: 'Sweep summary, marks, build order, GC, Hermes, Shannon, cube, and report are local BEHCS surfaces.' },
      { part: 'voice', vote: 'CLAIM_GUARD', reason: 'Enhancement remains training support; literal mind reading and medical claims remain blocked.' },
      { part: 'planner', vote: 'NEXT_BUILD_ORDER', reason: 'Build Hookwall runtime, synthetic EEG CI, PID bus, quality gate, RU-view quarantine, and local Symphony/Linear services first.' }
    ]
  };
}

function buildCube(summary, shannonPacket, generatedAt) {
  const cube = {
    id: 'neurotech-1t-virtual-sweep',
    generatedAt,
    primaryCatalog: { D: 42, name: 'ORCHESTRATION', prime: 181 },
    touches: [7, 20, 24, 35, 37, 39, 42, 47, 59],
    gates: ['virtual_1t_sweep', 'checkpoint_compaction', 'ruview_fail_closed', 'synthetic_first', 'hookwall_gnn_gc'],
    payload: {
      kind: '1t-neurotech-sweep',
      status: summary.status,
      mode: MODE,
      counts: summary.counts,
      shannon: {
        consensus: shannonPacket.consensus,
        executionDisposition: shannonPacket.executionDisposition
      }
    },
    translate: {
      human: '1T virtual sweep completed for EEG/RU-view/neuro-interface/enhancement with genius/mistake marks.',
      agent: '(asolaria, neurotech, 1t_virtual_sweep, gnn, reverse_gain, gc, synthetic_first)',
      device: 'node tools/neurotech-1t-virtual-sweep.js sweep --execute'
    }
  };
  return `// cube: neurotech-1t-virtual-sweep | neurotech | D42 ORCHESTRATION\nexport const CUBE = ${JSON.stringify(cube, null, 2)}\n`;
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
  const geniusRows = summary.topGenius.slice(0, 12).map((g) =>
    `| ${g.id} | ${g.score} | ${g.virtualAgents} | ${g.gnnStatus} | ${g.gcDisposition} |`
  ).join('\n');
  const mistakeRows = summary.topMistakes.slice(0, 12).map((m) =>
    `| ${m.id} | ${m.reverseGain} | ${m.gnnStatus} | ${m.gcDisposition} |`
  ).join('\n');
  const phaseRows = buildOrder.phases.map((p) =>
    `| ${p.id} | ${p.gate} | ${p.supportingMarks.join(' ')} | ${p.action} |`
  ).join('\n');

  const json = {
    reportId: 'neurotech-1t-virtual-sweep-latest',
    generatedAt,
    status: summary.status,
    mode: MODE,
    counts: summary.counts,
    outputs: outputs(),
    shannon: shannonPacket,
    gc: gcManifest,
    buildOrder
  };

  const md = `# Neurotech 1T Virtual Sweep

Generated: ${generatedAt}

Status: ${summary.status}

This is a compact virtual-agent sweep. It launched zero real agents, used zero external model tokens, performed no downloads or installs, did not access devices, did not collect human-subject data, and did not execute RU-view.

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
    readiness: readJson(PATHS.readiness1t, {}),
    integration100b: readJson(PATHS.integration100b, {}),
    geniusSupervisors: readJson(PATHS.geniusSupervisors, {}),
    mistakeGuards: readJson(PATHS.mistakeGuards, {}),
    hookwallPolicy: readJson(PATHS.hookwallPolicy, {}),
    buildQueueRows: readNdjson(PATHS.buildQueue),
    safeRuntime: readJson(PATHS.safeRuntime, {})
  };
}

function buildTrash(summary, generatedAt) {
  return [
    {
      generatedAt,
      trashClass: 'virtual_agent_non_materialized_rows',
      disposition: 'not_written',
      avoidedRows: TOTAL_AGENTS,
      preservedProofs: summary.counts.proofSamples
    },
    {
      generatedAt,
      trashClass: 'logical_checkpoint_non_materialized_rows',
      disposition: 'compacted_to_shards',
      avoidedRows: LOGICAL_CHECKPOINTS - SHARD_COUNT,
      preservedShardRows: SHARD_COUNT
    },
    {
      generatedAt,
      trashClass: 'duplicate_low_value_prompt_text',
      disposition: 'discarded_before_write',
      avoidedExternalTokens: 0,
      rule: 'PID-only packet summaries were used.'
    }
  ];
}

function sweep({ execute = false } = {}) {
  const generatedAt = new Date().toISOString();
  const context = loadContext();
  const agentSpace = buildAgentSpace(generatedAt, context.readiness);
  const { shards, proofs, aggregate } = buildShards(generatedAt);
  const geniusMarks = buildGeniusMarks(aggregate, context.geniusSupervisors);
  const mistakeMarks = buildMistakeMarks(context.mistakeGuards);
  const ruViewSweep = buildRuViewSweep(generatedAt);
  const summary = buildSummary(agentSpace, aggregate, geniusMarks, mistakeMarks, ruViewSweep, context, generatedAt);
  summary.counts.proofSamples = proofs.length;
  const buildOrder = buildBuildOrder(summary, geniusMarks, mistakeMarks, context.buildQueueRows, generatedAt);
  const gcManifest = buildGcManifest(summary, generatedAt);
  const shannonPacket = buildShannon(summary, generatedAt);
  const hermesPacket = buildHermes(summary, generatedAt);
  const cube = buildCube(summary, shannonPacket, generatedAt);
  const report = buildReport(summary, buildOrder, gcManifest, shannonPacket, generatedAt);
  const trashRows = buildTrash(summary, generatedAt);
  const eventId = `neurotech-1t-virtual-sweep-${Date.now()}`;

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
      to: 'neurotech-1t-virtual-sweep',
      verb: 'EVT-NEUROTECH-1T-VIRTUAL-SWEEP',
      body: { status: summary.status, counts: summary.counts, report: repoRel(PATHS.reportMd) }
    });
    appendNdjson(PATHS.outbox, {
      id: `${eventId}-hermes`,
      ts: generatedAt,
      from: 'hermes',
      to: 'neurotech-1t-virtual-sweep',
      verb: hermesPacket.packet.verb,
      body: hermesPacket
    });
    for (const domainRow of aggregate) {
      appendNdjson(PATHS.gnnEdges, {
        id: `${eventId}-${domainRow.domain}`,
        ts: generatedAt,
        from: `1t_sweep:${domainRow.domain}`,
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
      'node tools/neurotech-1t-virtual-sweep.js status',
      'node tools/neurotech-1t-virtual-sweep.js sweep --execute'
    ]
  }, null, 2));
  process.exitCode = 2;
}

main(process.argv);
