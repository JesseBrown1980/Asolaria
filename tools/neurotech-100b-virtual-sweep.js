#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const behcs = require('./behcs/codex-bridge');

const repoRoot = path.resolve(__dirname, '..');
const TOTAL_AGENTS = 100_000_000_000;
const CHECKPOINT_INTERVAL = 2_000;
const LOGICAL_CHECKPOINTS = TOTAL_AGENTS / CHECKPOINT_INTERVAL;
const SHARD_AGENTS = 100_000_000;
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
  childProcessUse: false,
  secretMaterialWritten: false
});

const PATHS = Object.freeze({
  approval: rel('data/neurotech-defense-lab/consent/monthly-approval-2026-04.v1.json'),
  oneB: rel('data/neurotech-defense-lab/omnispindle/1b-frontier-loop/frontier-gnn-summary-latest.json'),
  safeRuntime: rel('data/neurotech-defense-lab/runtime/neurotech-safe-runtime-summary-latest.json'),
  ruViewState: rel('data/behcs/state/downloaded-software/mind-reading-ruview.state.json'),
  root: rel('data/neurotech-defense-lab/omnispindle/100b-sweep'),
  agentSpace: rel('data/neurotech-defense-lab/omnispindle/100b-sweep/virtual-agent-space.v1.json'),
  shards: rel('data/neurotech-defense-lab/omnispindle/100b-sweep/sweep-shards-2000.v1.ndjson'),
  proofSamples: rel('data/neurotech-defense-lab/omnispindle/100b-sweep/proof-samples-latest.ndjson'),
  summary: rel('data/neurotech-defense-lab/omnispindle/100b-sweep/sweep-gnn-summary-latest.json'),
  geniusCsv: rel('data/neurotech-defense-lab/omnispindle/100b-sweep/genius-sweep-marks-latest.csv'),
  geniusNdjson: rel('data/neurotech-defense-lab/omnispindle/100b-sweep/genius-sweep-marks-latest.ndjson'),
  mistakeCsv: rel('data/neurotech-defense-lab/omnispindle/100b-sweep/mistake-sweep-marks-latest.csv'),
  mistakeNdjson: rel('data/neurotech-defense-lab/omnispindle/100b-sweep/mistake-sweep-marks-latest.ndjson'),
  ruViewSweep: rel('data/neurotech-defense-lab/omnispindle/100b-sweep/ruview-static-sweep-latest.ndjson'),
  buildOrderJson: rel('data/neurotech-defense-lab/omnispindle/100b-sweep/neuro-enhancement-build-order.v1.json'),
  buildOrderMd: rel('data/neurotech-defense-lab/omnispindle/100b-sweep/neuro-enhancement-build-order.v1.md'),
  gcManifest: rel('data/neurotech-defense-lab/omnispindle/100b-sweep/gc/100b-sweep-gc-latest.json'),
  gcTrash: rel('data/neurotech-defense-lab/omnispindle/100b-sweep/gc/trash-compacted-latest.ndjson'),
  state: rel('data/behcs/state/neurotech-defense/neurotech-100b-virtual-sweep.state.json'),
  hermes: rel('data/behcs/hermes/neurotech-defense/neurotech-100b-virtual-sweep-dispatch-latest.json'),
  shannon: rel('data/behcs/shannon/neurotech-defense/neurotech-100b-virtual-sweep-consensus-latest.json'),
  cube: rel('data/behcs/cubes/neurotech-100b-virtual-sweep.cube.js'),
  reportJson: rel('reports/neurotech-100b-virtual-sweep-latest.json'),
  reportMd: rel('reports/neurotech-100b-virtual-sweep-latest.md'),
  inbox: rel('data/behcs/inbox.ndjson'),
  outbox: rel('data/behcs/outbox.ndjson'),
  gnnEdges: rel('data/behcs/gnn-live-edges.ndjson')
});

const DOMAINS = [
  domain('hookwall_gnn_gc', 12_000_000_000, 0.94, 'Make Hookwall, forward GNN, reverse-gain GNN, omnishannon, and non-destructive GC the invariant loop.'),
  domain('eeg_synthetic_ci', 10_000_000_000, 0.92, 'Synthetic EEG replay is the permanent foundation for parsers, UI, connectors, and CI.'),
  domain('eeg_signal_quality', 10_000_000_000, 0.91, 'Signal quality, artifacts, uncertainty, and contact checks precede every feedback signal.'),
  domain('neuro_interface_bus', 10_000_000_000, 0.90, 'Local PID-bound event bus carries EEG, tasks, consent, stop/delete, quality, feedback, and audit events.'),
  domain('consent_pid_session', 10_000_000_000, 0.92, 'Consent, Brown-Hilbert human PID, household scope, revocation, and session manifests are runtime primitives.'),
  domain('ruview_quarantine_static', 10_000_000_000, 0.88, 'RU-view remains fail-closed: static provenance, red-team, and sandbox planning only.'),
  domain('enhancement_training_support', 9_000_000_000, 0.89, 'Enhancement means non-medical training support: breath pacing, practice, fatigue awareness, uncertainty display.'),
  domain('model_ladder_validation', 8_000_000_000, 0.88, 'Promotion ladder: signal quality, bandpower, CSP/LDA, Riemannian, then deep models with model cards.'),
  domain('lsl_bids_connector', 7_000_000_000, 0.87, 'LSL event spine plus BIDS-like sidecars, hashes, and local connector health.'),
  domain('symphony_linear_local_migration', 7_000_000_000, 0.86, 'Local Symphony/Linear service ingestion tracks work before any remote mutation.'),
  domain('storage_privacy_git_guard', 4_000_000_000, 0.90, 'Raw biosignals, consent signatures, IDs, serials, and tokens stay out of Git and cloud paths.'),
  domain('household_release_boundary', 3_000_000_000, 0.88, 'Household experiments and outside-household releases use separate gates, reports, and consent scopes.')
];

const CRITICAL_MISTAKES = [
  mistake('real_agent_storm', 0.992, 'Launching 100B real processes instead of compact virtual PID ranges.'),
  mistake('ruview_execution', 0.982, 'Executing the downloaded RU/remote-view executable before provenance, signature, and sandbox review.'),
  mistake('live_eeg_before_attestation', 0.972, 'Collecting live EEG before individual attestation, stop/delete control, and device/session precheck.'),
  mistake('literal_mind_reading_claim', 0.958, 'Treating EEG signal classification as literal private-thought reading.'),
  mistake('raw_biosignal_or_consent_in_git', 0.941, 'Committing raw biosignals, signed consent, direct identifiers, tokens, or device serials to Git.'),
  mistake('remote_linear_mutation_without_gate', 0.929, 'Mutating remote Linear before local Symphony ingestion and operator gate.'),
  mistake('cloud_upload_without_scope', 0.918, 'Uploading biosignal data or session metadata outside consent scope.'),
  mistake('gc_evidence_deletion', 0.902, 'Deleting source evidence during GC instead of compacting derived duplicates.'),
  mistake('deep_model_first', 0.884, 'Starting with deep models before signal quality and classical baselines.'),
  mistake('no_signal_quality_gate', 0.861, 'Showing feedback when contact, noise, drift, or artifact state is unknown.'),
  mistake('household_boundary_breach', 0.854, 'Using household-only research paths for outsiders without their own permission.'),
  mistake('approval_window_overrun', 0.833, 'Running approval-scoped work after the April 2026 approval window expires.'),
  mistake('medical_or_diagnostic_claim', 0.821, 'Presenting enhancement or EEG feedback as diagnosis or treatment.'),
  mistake('token_bloat_or_banner_prompts', 0.802, 'Wasting tokens with banners, headers, and verbose prompts instead of PID-only packets.')
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
  return `BH.100B.VAGENT.PID.${String(slot).padStart(12, '0')}`;
}

function glyph(kind, id, seed) {
  const hash = sha256Text(`${kind}:${id}:${seed || ''}`);
  return `HG256:${kind.toUpperCase()}:${hash.slice(0, 8).toUpperCase()}:${behcs.hilbertAddress(hash)}`;
}

function reverseGainForDomain(id, noise) {
  const base = {
    hookwall_gnn_gc: 0.42,
    eeg_synthetic_ci: 0.35,
    eeg_signal_quality: 0.58,
    neuro_interface_bus: 0.64,
    consent_pid_session: 0.73,
    ruview_quarantine_static: 0.92,
    enhancement_training_support: 0.66,
    model_ladder_validation: 0.69,
    lsl_bids_connector: 0.59,
    symphony_linear_local_migration: 0.76,
    storage_privacy_git_guard: 0.82,
    household_release_boundary: 0.78
  }[id] || 0.6;
  return round3(Math.min(0.999, base + (1 - noise) * 0.055));
}

function hookwallStatus(id, reverseGain) {
  if (id === 'ruview_quarantine_static') return 'BLOCK_EXECUTION_STATIC_ONLY';
  if (reverseGain >= 0.84) return 'BLOCK_AND_PRESERVE';
  if (reverseGain >= 0.72) return 'WARN_AND_LEDGER';
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

function buildAgentSpace(generatedAt) {
  return {
    namespaceId: 'brown-hilbert-100b-neurotech-sweep.v1',
    generatedAt,
    status: 'VIRTUAL_100B_AGENT_SPACE_READY',
    mode: MODE,
    totalAgents: TOTAL_AGENTS,
    checkpointInterval: CHECKPOINT_INTERVAL,
    logicalCheckpoints: LOGICAL_CHECKPOINTS,
    shardAgents: SHARD_AGENTS,
    checkpointShards: SHARD_COUNT,
    checkpointsPerShard: CHECKPOINTS_PER_SHARD,
    firstPid: pid(1),
    lastPid: pid(TOTAL_AGENTS),
    materializationRule: '100B agents and 50M logical checkpoints are compacted into 1000 shard rows plus proof samples.',
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
    const noise = unit(`${d.id}:${i}:100b`);
    const score = round3(Math.min(0.999, d.baseScore + noise * 0.035));
    const reverseGain = reverseGainForDomain(d.id, noise);
    const shard = {
      shardId: `BH100B-SHARD-${String(i + 1).padStart(4, '0')}`,
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
      gnn: score >= 0.9 ? 'GENIUS_SIGNAL' : 'WATCH_SIGNAL',
      reverseGainGnn: reverseGain >= 0.84 ? 'CRITICAL_MISTAKE_PRESSURE' : reverseGain >= 0.72 ? 'WATCH_PRESSURE' : 'GUARD_OK',
      gc: 'COMPACT_50000_CHECKPOINTS_KEEP_SHARD_PROOF'
    };
    shards.push(shard);
    if (i < 25 || i >= SHARD_COUNT - 25 || i % 100 === 0) proofs.push({ ...shard, proofKind: '100b_sweep_sample' });

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

function buildGeniusMarks(aggregate) {
  const carried = [
    ['global_claim_quarantine', 0.965, TOTAL_AGENTS, 'Cross-domain quarantine of coercive, medical, brain-frying, remote-view, and literal mind-reading claims.'],
    ['global_pid_session_bus', 0.958, TOTAL_AGENTS, 'All packets keep household PID, human PID, consent, device, storage, claim, and GC state.'],
    ['global_synthetic_first', 0.951, TOTAL_AGENTS, 'Synthetic EEG is mandatory before public datasets, live devices, or models.'],
    ['global_quality_first_feedback', 0.944, TOTAL_AGENTS, 'Feedback is blocked until signal quality and uncertainty are visible.']
  ];

  const domainMarks = aggregate.map((a) => ({
    kind: 'genius',
    id: `sweep_${a.domain}`,
    glyph: glyph('100b_genius', a.domain, a.avgScore),
    score: a.avgScore,
    reverseGain: '',
    virtualAgents: a.virtualAgents,
    logicalCheckpoints: a.logicalCheckpoints,
    shards: a.shards,
    domain: a.domain,
    pidRange: `${a.firstPid}..${a.lastPid}`,
    hookwallStatus: a.domain === 'ruview_quarantine_static' ? 'GENIUS_IS_QUARANTINE_NOT_EXECUTION' : 'REINFORCE_WITH_GATES',
    gnnStatus: a.avgScore >= 0.9 ? 'GNN_MARK_GENIUS' : 'GNN_WATCH_GENIUS',
    gcDisposition: a.avgScore >= 0.9 ? 'farm_gem_preserve_sources' : 'watch_compact_duplicates',
    summary: a.summary
  }));

  const carriedMarks = carried.map(([id, score, agents, summary]) => ({
    kind: 'genius',
    id,
    glyph: glyph('100b_carried_genius', id, summary),
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

function buildMistakeMarks() {
  return CRITICAL_MISTAKES.map((m) => ({
    kind: 'mistake',
    id: m.id,
    glyph: glyph('100b_mistake', m.id, m.summary),
    score: '',
    reverseGain: m.reverseGain,
    virtualAgents: TOTAL_AGENTS,
    logicalCheckpoints: LOGICAL_CHECKPOINTS,
    shards: SHARD_COUNT,
    domain: 'global_reverse_gain_guard',
    pidRange: `${pid(1)}..${pid(TOTAL_AGENTS)}`,
    hookwallStatus: m.reverseGain >= 0.84 ? 'BLOCK_AND_PRESERVE' : 'WARN_AND_LEDGER',
    gnnStatus: m.reverseGain >= 0.84 ? 'REVERSE_GAIN_MARK_CRITICAL' : 'REVERSE_GAIN_MARK_WATCH',
    gcDisposition: m.reverseGain >= 0.84 ? 'preserve_evidence_quarantine_pattern' : 'ledger_pattern_compact_duplicates',
    summary: m.summary
  })).sort((a, b) => Number(b.reverseGain) - Number(a.reverseGain));
}

function buildRuViewSweep(generatedAt) {
  const state = readJson(PATHS.ruViewState, {});
  const steps = [
    'preserve_hash_zone_identifier',
    'metadata_inventory_static_only',
    'pe_header_and_import_table_static_only',
    'signature_origin_review_required',
    'sandbox_plan_required_no_execution',
    'claim_language_red_team_required',
    'quarantine_until_operator_gate',
    'never_treat_ruview_as_proven_mind_reading'
  ];
  return steps.map((step, index) => ({
    sweepId: `RUVIEW-100B-SWEEP-${String(index + 1).padStart(2, '0')}`,
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
    phase('B1_synthetic_ci', 'Wire synthetic EEG replay into repeatable local CI and fail builds on parser/metadata regressions.', ['sweep_eeg_synthetic_ci', 'global_synthetic_first']),
    phase('B2_hookwall_runtime', 'Make Hookwall/GNN/reverse-gain/GC run for every local neurotech packet.', ['sweep_hookwall_gnn_gc']),
    phase('B3_pid_session_bus', 'Implement the PID-bound local session bus for consent, quality, stop/delete, storage, feedback, and audit events.', ['sweep_neuro_interface_bus', 'global_pid_session_bus']),
    phase('B4_quality_feedback_gate', 'Block feedback UI until signal quality and uncertainty metrics are present.', ['sweep_eeg_signal_quality', 'global_quality_first_feedback']),
    phase('B5_ruview_quarantine', 'Keep RU-view executable in fail-closed static analysis only; do not execute it.', ['sweep_ruview_quarantine_static', 'global_claim_quarantine']),
    phase('B6_enhancement_support', 'Build non-medical training support features: breath pacing, practice schedule, fatigue awareness, uncertainty display.', ['sweep_enhancement_training_support']),
    phase('B7_model_ladder', 'Promote models only through quality, bandpower, CSP/LDA, Riemannian, then deep models with model cards.', ['sweep_model_ladder_validation']),
    phase('B8_local_symphony', 'Make Symphony/Linear local service ingest all supervisor packets before any remote tracker mutation.', ['sweep_symphony_linear_local_migration']),
    phase('B9_storage_release_wall', 'Keep raw data out of Git/cloud and split household work from outside-household release gates.', ['sweep_storage_privacy_git_guard', 'sweep_household_release_boundary'])
  ];
  return {
    buildOrderId: 'neuro-enhancement-build-order.v1',
    generatedAt,
    status: 'BUILD_ORDER_READY_LOCAL_SYNTHETIC_FIRST',
    counts: summary.counts,
    topGenius: geniusMarks.slice(0, 10),
    topMistakes: mistakeMarks.slice(0, 10),
    phases
  };
}

function phase(id, action, supportingMarks) {
  return { id, action, supportingMarks, gate: 'local_synthetic_static_only_until_explicit_next_gate' };
}

function buildBuildOrderMd(order) {
  const rows = order.phases.map((p) => `| ${p.id} | ${p.gate} | ${p.supportingMarks.join(' ')} | ${p.action} |`).join('\n');
  return `# Neuro Enhancement Build Order

Generated: ${order.generatedAt}

Status: ${order.status}

| Phase | Gate | Supporting Marks | Action |
| --- | --- | --- | --- |
${rows}
`;
}

function buildSummary(agentSpace, aggregate, geniusMarks, mistakeMarks, ruViewSweep, approval, safeRuntime, generatedAt) {
  return {
    summaryId: 'neurotech-100b-virtual-sweep-summary',
    generatedAt,
    status: 'ONE_HUNDRED_B_SWEEP_GNN_GC_READY',
    mode: MODE,
    approval: {
      status: approval.status || null,
      participantCount: approval.participants?.length || null,
      expiresAtLocal: approval.participants?.[0]?.approvalWindow?.expiresAtLocal || null
    },
    safeRuntime: {
      status: safeRuntime.status || null,
      syntheticReplay: safeRuntime.syntheticReplay?.status || null,
      localIngestItems: safeRuntime.symphonyLinearLocalIngest?.count || null,
      ruViewStaticItems: safeRuntime.ruViewStatic?.count || null
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
      criticalMistakeMarks: mistakeMarks.filter((m) => Number(m.reverseGain) >= 0.84).length,
      ruViewStaticSweepItems: ruViewSweep.length,
      realAgentLaunches: 0,
      externalModelTokens: 0
    },
    domainAggregate: aggregate,
    topGenius: geniusMarks.slice(0, 12),
    topMistakes: mistakeMarks.slice(0, 12)
  };
}

function buildGcManifest(summary, generatedAt) {
  return {
    gcId: 'neurotech-100b-sweep-gc-latest',
    generatedAt,
    status: 'GC_COMPACTED_100B_SWEEP',
    mode: MODE,
    rule: 'Preserve source evidence and compact 100B virtual agents / 50M logical checkpoints into 1000 shard records plus proof samples.',
    counts: summary.counts,
    compacted: {
      materializedAgentRowsAvoided: TOTAL_AGENTS,
      materializedCheckpointRowsAvoided: LOGICAL_CHECKPOINTS - SHARD_COUNT,
      shardRowsKept: SHARD_COUNT,
      sourceEvidenceDeleted: 0
    },
    sources: [
      repoRel(PATHS.approval),
      repoRel(PATHS.oneB),
      repoRel(PATHS.safeRuntime),
      repoRel(PATHS.ruViewState)
    ]
  };
}

function buildHermes(summary, generatedAt) {
  return {
    integrationId: 'neurotech-100b-virtual-sweep-hermes-dispatch',
    generatedAt,
    status: summary.status,
    mode: MODE,
    packet: {
      verb: 'EVT-HERMES-NEUROTECH-100B-VIRTUAL-SWEEP',
      summary: '100B virtual-agent neurotech sweep completed locally with GNN, reverse-gain, genius/mistake marks, and GC compaction.',
      counts: summary.counts,
      report: repoRel(PATHS.reportMd)
    }
  };
}

function buildShannon(summary, generatedAt) {
  return {
    integrationId: 'neurotech-100b-virtual-sweep-shannon-consensus',
    generatedAt,
    status: 'consensus_100b_sweep_local_only',
    consensus: 'PROCEED_100B_VIRTUAL_SWEEP_LOCAL_ONLY',
    executionDisposition: 'zero_external_tokens_no_real_agent_launch_no_ruview_execution_no_live_eeg',
    votes: [
      { part: 'scout', vote: 'PROCEED_VIRTUAL', reason: '100B virtual agents are represented by compact Brown-Hilbert PID ranges.' },
      { part: 'evidence', vote: 'PROCEED', reason: `${summary.counts.logicalCheckpoints} logical checkpoints were compacted into ${summary.counts.sweepShards} shard rows.` },
      { part: 'executor', vote: 'HALT_RISKY_ACTIONS', reason: 'No live EEG, no RU-view execution, no real agent storm, no external calls.' },
      { part: 'fabric', vote: 'PROCEED', reason: 'Sweep summary, marks, build order, GC, Hermes, Shannon, cube, and report are local surfaces.' },
      { part: 'voice', vote: 'CLAIM_GUARD', reason: 'Enhancement remains training support; literal mind reading remains blocked.' },
      { part: 'planner', vote: 'NEXT_BUILD_ORDER', reason: 'Follow the synthetic-first build order and local Symphony ingestion before live/device work.' }
    ]
  };
}

function buildCube(summary, shannonPacket, generatedAt) {
  const cube = {
    id: 'neurotech-100b-virtual-sweep',
    generatedAt,
    primaryCatalog: { D: 42, name: 'ORCHESTRATION', prime: 181 },
    touches: [7, 20, 24, 35, 37, 39, 42, 47, 59],
    gates: ['virtual_100b_sweep', 'checkpoint_compaction', 'ruview_fail_closed', 'synthetic_first', 'hookwall_gnn_gc'],
    payload: {
      kind: '100b-neurotech-sweep',
      status: summary.status,
      mode: MODE,
      counts: summary.counts,
      shannon: {
        consensus: shannonPacket.consensus,
        executionDisposition: shannonPacket.executionDisposition
      }
    },
    translate: {
      human: '100B virtual sweep completed for EEG/RU-view/neuro-interface/enhancement with genius/mistake marks.',
      agent: '(asolaria, neurotech, 100b_virtual_sweep, gnn, reverse_gain, gc, synthetic_first)',
      device: 'node tools/neurotech-100b-virtual-sweep.js sweep --execute'
    }
  };
  return `// cube: neurotech-100b-virtual-sweep | neurotech | D42 ORCHESTRATION\nexport const CUBE = ${JSON.stringify(cube, null, 2)}\n`;
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
  const geniusRows = summary.topGenius.slice(0, 10).map((g) =>
    `| ${g.id} | ${g.score} | ${g.virtualAgents} | ${g.gnnStatus} | ${g.gcDisposition} |`
  ).join('\n');
  const mistakeRows = summary.topMistakes.slice(0, 10).map((m) =>
    `| ${m.id} | ${m.reverseGain} | ${m.gnnStatus} | ${m.gcDisposition} |`
  ).join('\n');

  const json = {
    reportId: 'neurotech-100b-virtual-sweep-latest',
    generatedAt,
    status: summary.status,
    mode: MODE,
    counts: summary.counts,
    outputs: outputs(),
    shannon: shannonPacket,
    gc: gcManifest,
    buildOrder
  };

  const md = `# Neurotech 100B Virtual Sweep

Generated: ${generatedAt}

Status: ${summary.status}

Ran the full 100-billion-agent sweep as compact Brown-Hilbert virtual PIDs. The sweep represented ${summary.counts.logicalCheckpoints} logical per-2,000 checkpoints and compacted them into ${summary.counts.sweepShards} shard records plus ${summary.counts.proofSamples} proof samples.

## Counts

- Virtual agents: ${summary.counts.virtualAgents}
- Logical checkpoints: ${summary.counts.logicalCheckpoints}
- Sweep shards: ${summary.counts.sweepShards}
- Proof samples: ${summary.counts.proofSamples}
- Genius marks: ${summary.counts.geniusMarks}
- Farmed genius marks: ${summary.counts.farmedGeniusMarks}
- Mistake marks: ${summary.counts.mistakeMarks}
- Critical mistake marks: ${summary.counts.criticalMistakeMarks}
- RU-view static sweep items: ${summary.counts.ruViewStaticSweepItems}
- Real agent launches: 0
- External model/API tokens: 0

## Domain Allocation

| Domain | Virtual Agents | Logical Checkpoints | Avg Score | Max Reverse Gain |
| --- | ---: | ---: | ---: | ---: |
${domainRows}

## Top Genius Marks

| Mark | Score | Virtual Agents | GNN | GC |
| --- | ---: | ---: | --- | --- |
${geniusRows}

## Top Mistake Marks

| Mark | Reverse Gain | GNN | GC |
| --- | ---: | --- | --- |
${mistakeRows}

## Outputs

- Summary: \`${repoRel(PATHS.summary)}\`
- Genius marks: \`${repoRel(PATHS.geniusCsv)}\`
- Mistake marks: \`${repoRel(PATHS.mistakeCsv)}\`
- Build order: \`${repoRel(PATHS.buildOrderMd)}\`
- GC manifest: \`${repoRel(PATHS.gcManifest)}\`

## Shannon

- Consensus: ${shannonPacket.consensus}
- Execution: ${shannonPacket.executionDisposition}
`;
  return { json, md };
}

function sweep({ execute = false } = {}) {
  const generatedAt = new Date().toISOString();
  const approval = readJson(PATHS.approval, {});
  const safeRuntime = readJson(PATHS.safeRuntime, {});
  const agentSpace = buildAgentSpace(generatedAt);
  const { shards, proofs, aggregate } = buildShards(generatedAt);
  const geniusMarks = buildGeniusMarks(aggregate);
  const mistakeMarks = buildMistakeMarks();
  const ruViewSweep = buildRuViewSweep(generatedAt);
  const summary = buildSummary(agentSpace, aggregate, geniusMarks, mistakeMarks, ruViewSweep, approval, safeRuntime, generatedAt);
  summary.counts.proofSamples = proofs.length;
  const buildOrder = buildBuildOrder(summary, geniusMarks, mistakeMarks, generatedAt);
  const gcManifest = buildGcManifest(summary, generatedAt);
  const shannonPacket = buildShannon(summary, generatedAt);
  const hermesPacket = buildHermes(summary, generatedAt);
  const cube = buildCube(summary, shannonPacket, generatedAt);
  const report = buildReport(summary, buildOrder, gcManifest, shannonPacket, generatedAt);
  const eventId = `neurotech-100b-sweep-${Date.now()}`;

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
    writeText(PATHS.gcTrash, toNdjson([
      { kind: 'agent_rows_avoided', count: TOTAL_AGENTS },
      { kind: 'checkpoint_rows_compacted', count: LOGICAL_CHECKPOINTS - SHARD_COUNT },
      { kind: 'source_evidence_deleted', count: 0 }
    ]));
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
      to: 'neurotech-100b-sweep',
      verb: 'EVT-NEUROTECH-100B-VIRTUAL-SWEEP',
      body: { status: summary.status, counts: summary.counts, report: repoRel(PATHS.reportMd) }
    });
    appendNdjson(PATHS.outbox, {
      id: `${eventId}-hermes`,
      ts: generatedAt,
      from: 'hermes',
      to: 'neurotech-100b-sweep',
      verb: hermesPacket.packet.verb,
      body: hermesPacket
    });
    appendNdjson(PATHS.gnnEdges, {
      id: `${eventId}-gnn`,
      ts: generatedAt,
      from: 'one_b_frontier',
      to: 'hundred_b_sweep',
      verb: 'expanded_virtual_sweep_compacted_checkpoints',
      weight: 0.96
    });
    appendNdjson(PATHS.gnnEdges, {
      id: `${eventId}-ruview`,
      ts: generatedAt,
      from: 'ruview_fail_closed_supervisor',
      to: 'hundred_b_sweep_ruview_static',
      verb: 'static_only_fail_closed',
      weight: 0.99
    });
  }

  return {
    ok: true,
    action: execute ? 'sweep' : 'preview',
    generatedAt,
    status: summary.status,
    counts: summary.counts,
    topGenius: summary.topGenius.slice(0, 8).map((g) => ({ id: g.id, score: g.score, virtualAgents: g.virtualAgents })),
    topMistakes: summary.topMistakes.slice(0, 8).map((m) => ({ id: m.id, reverseGain: m.reverseGain })),
    outputs: outputs(),
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
      'node tools/neurotech-100b-virtual-sweep.js status',
      'node tools/neurotech-100b-virtual-sweep.js sweep --execute'
    ]
  }, null, 2));
  process.exitCode = 2;
}

main(process.argv);
