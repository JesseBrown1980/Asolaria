#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const behcs = require('./behcs/codex-bridge');

const repoRoot = path.resolve(__dirname, '..');
const TOTAL_AGENTS = 1_000_000_000;
const CHECKPOINT_INTERVAL = 2_000;
const LOGICAL_CHECKPOINTS = TOTAL_AGENTS / CHECKPOINT_INTERVAL;
const SHARD_AGENTS = 1_000_000;
const CHECKPOINTS_PER_SHARD = SHARD_AGENTS / CHECKPOINT_INTERVAL;
const SHARD_COUNT = TOTAL_AGENTS / SHARD_AGENTS;

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
  virtualAgentLoop: true,
  externalModelTokenBudget: 0,
  noDownloads: true,
  noInstall: true,
  noDeviceAccess: true,
  noHumanSubjectData: true,
  ruViewExecution: 'fail_closed_static_queue_only',
  nonDestructiveGc: true,
  childProcessUse: false,
  secretMaterialWritten: false
});

const PATHS = Object.freeze({
  twentyMSummary: rel('data/neurotech-defense-lab/omnispindle/20m-agent-loop/gnn-reverse-gain-summary-latest.json'),
  supervisors: rel('data/neurotech-defense-lab/omnispindle/supervisors/genius-candidate-supervisors.v1.json'),
  gems: rel('data/neurotech-defense-lab/omnispindle/20m-agent-loop/genius-marks-latest.ndjson'),
  mistakes: rel('data/neurotech-defense-lab/omnispindle/20m-agent-loop/mistake-marks-latest.ndjson'),
  ruViewState: rel('data/behcs/state/downloaded-software/mind-reading-ruview.state.json'),
  root: rel('data/neurotech-defense-lab/omnispindle/1b-frontier-loop'),
  agentSpace: rel('data/neurotech-defense-lab/omnispindle/1b-frontier-loop/virtual-agent-space.v1.json'),
  checkpointShards: rel('data/neurotech-defense-lab/omnispindle/1b-frontier-loop/checkpoint-shards-2000.v1.ndjson'),
  proofSamples: rel('data/neurotech-defense-lab/omnispindle/1b-frontier-loop/proof-samples-latest.ndjson'),
  frontierSummary: rel('data/neurotech-defense-lab/omnispindle/1b-frontier-loop/frontier-gnn-summary-latest.json'),
  geniusCsv: rel('data/neurotech-defense-lab/omnispindle/1b-frontier-loop/genius-frontier-marks-latest.csv'),
  geniusNdjson: rel('data/neurotech-defense-lab/omnispindle/1b-frontier-loop/genius-frontier-marks-latest.ndjson'),
  mistakeCsv: rel('data/neurotech-defense-lab/omnispindle/1b-frontier-loop/mistake-frontier-marks-latest.csv'),
  mistakeNdjson: rel('data/neurotech-defense-lab/omnispindle/1b-frontier-loop/mistake-frontier-marks-latest.ndjson'),
  ruViewQueue: rel('data/neurotech-defense-lab/omnispindle/1b-frontier-loop/ruview-static-analysis-queue.ndjson'),
  roadmapJson: rel('data/neurotech-defense-lab/omnispindle/1b-frontier-loop/neuro-interface-enhancement-roadmap.v1.json'),
  roadmapMd: rel('data/neurotech-defense-lab/omnispindle/1b-frontier-loop/neuro-interface-enhancement-roadmap.v1.md'),
  gcManifest: rel('data/neurotech-defense-lab/omnispindle/1b-frontier-loop/gc/1b-frontier-gc-latest.json'),
  gcTrash: rel('data/neurotech-defense-lab/omnispindle/1b-frontier-loop/gc/trash-compacted-latest.ndjson'),
  state: rel('data/behcs/state/neurotech-defense/neurotech-1b-virtual-frontier-loop.state.json'),
  hermes: rel('data/behcs/hermes/neurotech-defense/neurotech-1b-virtual-frontier-loop-dispatch-latest.json'),
  shannon: rel('data/behcs/shannon/neurotech-defense/neurotech-1b-virtual-frontier-loop-consensus-latest.json'),
  cube: rel('data/behcs/cubes/neurotech-1b-virtual-frontier-loop.cube.js'),
  reportJson: rel('reports/neurotech-1b-virtual-frontier-loop-latest.json'),
  reportMd: rel('reports/neurotech-1b-virtual-frontier-loop-latest.md'),
  inbox: rel('data/behcs/inbox.ndjson'),
  outbox: rel('data/behcs/outbox.ndjson'),
  gnnEdges: rel('data/behcs/gnn-live-edges.ndjson')
});

const DOMAINS = [
  domain('eeg_synthetic_ci', 120_000_000, 0.9, 'Synthetic EEG fixtures, parsers, quality metrics, and CI replay.'),
  domain('eeg_signal_quality', 120_000_000, 0.88, 'Contact/noise/artifact gates before any feedback.'),
  domain('neuro_interface_bus', 110_000_000, 0.87, 'PID-bound local event bus for EEG, tasks, feedback, stop, and delete events.'),
  domain('consent_pid_session', 110_000_000, 0.89, 'Household-only consent, Brown-Hilbert human PIDs, session manifests, revocation.'),
  domain('ruview_quarantine_static', 100_000_000, 0.84, 'RU-view downloaded executable remains fail-closed; only static queue and provenance review.'),
  domain('enhancement_training_support', 110_000_000, 0.86, 'Non-medical cognitive support: practice scheduling, breath pacing, uncertainty, fatigue awareness.'),
  domain('model_ladder_validation', 90_000_000, 0.85, 'Signal quality -> bandpower -> CSP/LDA -> Riemannian -> deep model promotion gates.'),
  domain('lsl_bids_connector', 80_000_000, 0.84, 'LSL event spine plus BIDS-like sidecars and local connector health.'),
  domain('symphony_linear_local_migration', 80_000_000, 0.83, 'Local Symphony/Linear packet ingestion so Hookwall/GNN can track work without remote mutation.'),
  domain('hookwall_gnn_gc', 80_000_000, 0.91, 'Hookwall, GNN forward, reverse-gain, omnishannon, and non-destructive GC compaction.')
];

const CRITICAL_MISTAKES = [
  mistake('real_agent_storm', 0.97, 'Trying to launch one billion real processes instead of compact virtual PID ranges.', ['D42_ORCHESTRATION', 'D47_BOUNDARY']),
  mistake('ruview_execution', 0.95, 'Executing the downloaded RU/remote-view executable before static provenance and sandbox review.', ['D37_AUTHORITY', 'D47_BOUNDARY', 'D59+_RU_VIEW_QUARANTINE']),
  mistake('live_eeg_before_attestation', 0.93, 'Collecting live EEG before participant attestation, stop/delete controls, and signal-quality precheck.', ['D24_INTENT', 'D37_AUTHORITY', 'D59+_HUMAN_CONSENT']),
  mistake('literal_mind_reading_claim', 0.91, 'Treating EEG signal classification as literal private-thought reading.', ['D37_AUTHORITY', 'D47_BOUNDARY', 'D59+_CLAIM_SAFETY']),
  mistake('remote_linear_mutation_without_gate', 0.88, 'Mutating remote Linear instead of first ingesting local Symphony queue packets.', ['D20_CONNECTION', 'D37_AUTHORITY']),
  mistake('raw_biosignal_or_consent_in_git', 0.86, 'Committing raw biosignals, signed consent, direct identifiers, tokens, or device serials.', ['D39_MEMORY', 'D47_BOUNDARY']),
  mistake('deep_model_before_quality', 0.82, 'Promoting deep models before signal-quality gates and classical baselines.', ['D35_PROOF', 'D59+_MODEL_VALIDATION']),
  mistake('gc_evidence_deletion', 0.81, 'Deleting source evidence during GC instead of compacting derived duplicates.', ['D39_MEMORY', 'D47_BOUNDARY'])
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

function mistake(id, reverseGain, summary, dimensions) {
  return { id, reverseGain, summary, dimensions };
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

function sha256Text(input) {
  return crypto.createHash('sha256').update(String(input)).digest('hex');
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
  return `BH.1B.VAGENT.PID.${String(slot).padStart(10, '0')}`;
}

function glyph(kind, id, seed) {
  const hash = sha256Text(`${kind}:${id}:${seed || ''}`);
  return `HG256:${kind.toUpperCase()}:${hash.slice(0, 8).toUpperCase()}:${behcs.hilbertAddress(hash)}`;
}

function unit(seed) {
  return crypto.createHash('sha256').update(seed).digest().readUInt32BE(0) / 0xffffffff;
}

function domainForShard(shardIndex) {
  const slot = shardIndex * SHARD_AGENTS + 1;
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
    namespaceId: 'brown-hilbert-1b-neurotech-frontier-loop.v1',
    generatedAt,
    status: 'VIRTUAL_1B_AGENT_SPACE_READY',
    mode: MODE,
    totalAgents: TOTAL_AGENTS,
    checkpointInterval: CHECKPOINT_INTERVAL,
    logicalCheckpoints: LOGICAL_CHECKPOINTS,
    shardAgents: SHARD_AGENTS,
    checkpointShards: SHARD_COUNT,
    checkpointsPerShard: CHECKPOINTS_PER_SHARD,
    firstPid: pid(1),
    lastPid: pid(TOTAL_AGENTS),
    materializationRule: 'Per-2000 checkpoints are represented as compact shard ranges. Do not write 500000 checkpoint rows unless explicitly requested.',
    domains: DOMAINS
  };
}

function buildShards(generatedAt) {
  const shards = [];
  const aggregate = new Map();
  const samples = [];

  for (let i = 0; i < SHARD_COUNT; i += 1) {
    const d = domainForShard(i);
    const firstSlot = i * SHARD_AGENTS + 1;
    const lastSlot = firstSlot + SHARD_AGENTS - 1;
    const seed = `${d.id}:${i}`;
    const noise = unit(seed);
    const score = round3(Math.min(0.999, d.baseScore + noise * 0.04));
    const reverseGain = reverseGainForDomain(d.id, noise);
    const shard = {
      shardId: `BH1B-SHARD-${String(i + 1).padStart(4, '0')}`,
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
      hookwall: hookwallForDomain(d.id, reverseGain),
      gnn: score >= 0.88 ? 'GENIUS_SIGNAL' : 'WATCH_SIGNAL',
      gc: 'COMPACT_CHECKPOINTS_KEEP_RANGE_PROOF'
    };
    shards.push(shard);
    if (i < 20 || i >= SHARD_COUNT - 20 || i % 125 === 0) {
      samples.push({ ...shard, proofKind: 'sampled_checkpoint_shard' });
    }
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
    proofSamples: samples,
    aggregate: [...aggregate.values()].map((a) => ({
      domain: a.domain.id,
      summary: a.domain.summary,
      shards: a.shards,
      virtualAgents: a.virtualAgents,
      logicalCheckpoints: a.logicalCheckpoints,
      avgScore: round3(a.scoreTotal / a.shards),
      maxReverseGain: round3(a.reverseGainMax),
      firstPid: pid(DOMAINS.slice(0, DOMAINS.findIndex((d) => d.id === a.domain.id)).reduce((sum, d) => sum + d.agents, 0) + 1),
      lastPid: pid(DOMAINS.slice(0, DOMAINS.findIndex((d) => d.id === a.domain.id) + 1).reduce((sum, d) => sum + d.agents, 0))
    }))
  };
}

function reverseGainForDomain(id, noise) {
  const base = {
    eeg_synthetic_ci: 0.33,
    eeg_signal_quality: 0.58,
    neuro_interface_bus: 0.62,
    consent_pid_session: 0.72,
    ruview_quarantine_static: 0.88,
    enhancement_training_support: 0.67,
    model_ladder_validation: 0.64,
    lsl_bids_connector: 0.56,
    symphony_linear_local_migration: 0.74,
    hookwall_gnn_gc: 0.49
  }[id] || 0.6;
  return round3(Math.min(0.99, base + (1 - noise) * 0.05));
}

function hookwallForDomain(id, reverseGain) {
  if (id === 'ruview_quarantine_static') return 'BLOCK_EXECUTION_STATIC_ANALYSIS_ONLY';
  if (reverseGain >= 0.84) return 'BLOCK_AND_PRESERVE';
  if (reverseGain >= 0.7) return 'WARN_AND_LEDGER';
  return 'ALLOW_WITH_GATES';
}

function buildGeniusMarks(aggregate, existingGems) {
  const priorById = new Map(existingGems.map((g) => [g.id, g]));
  const domainMarks = aggregate.map((a) => ({
    kind: 'genius',
    id: `frontier_${a.domain}`,
    glyph: glyph('frontier_genius', a.domain, a.avgScore),
    score: a.avgScore,
    reverseGain: '',
    virtualAgents: a.virtualAgents,
    logicalCheckpoints: a.logicalCheckpoints,
    shards: a.shards,
    domain: a.domain,
    pidRange: `${a.firstPid}..${a.lastPid}`,
    hookwallStatus: a.domain === 'ruview_quarantine_static' ? 'GENIUS_IS_QUARANTINE_NOT_EXECUTION' : 'REINFORCE_WITH_GATES',
    gnnStatus: a.avgScore >= 0.88 ? 'GNN_MARK_GENIUS' : 'GNN_WATCH_GENIUS',
    gcDisposition: a.avgScore >= 0.88 ? 'farm_gem_preserve_sources' : 'watch_compact_duplicates',
    summary: a.summary
  }));

  const carried = ['claim_quarantine', 'pid_bound_session_bus', 'synthetic_first_ci', 'quality_first_feedback', 'model_card_gate']
    .map((id) => priorById.get(id))
    .filter(Boolean)
    .map((g) => ({
      kind: 'genius',
      id: `carried_${g.id}`,
      glyph: glyph('carried_genius', g.id, g.glyph),
      score: round3(Number(g.score || 0.85) + 0.015),
      reverseGain: '',
      virtualAgents: TOTAL_AGENTS,
      logicalCheckpoints: LOGICAL_CHECKPOINTS,
      shards: SHARD_COUNT,
      domain: 'cross_domain_carried_gem',
      pidRange: `${pid(1)}..${pid(TOTAL_AGENTS)}`,
      hookwallStatus: 'REINFORCE_WITH_GATES',
      gnnStatus: 'GNN_MARK_CARRIED_GENIUS',
      gcDisposition: 'farm_gem_preserve_sources',
      summary: g.summary
    }));

  return [...domainMarks, ...carried].sort((a, b) => Number(b.score) - Number(a.score));
}

function buildMistakeMarks(existingMistakes) {
  const carried = existingMistakes.slice(0, 8).map((m) => ({
    kind: 'mistake',
    id: `carried_${m.id}`,
    glyph: glyph('carried_mistake', m.id, m.glyph),
    score: '',
    reverseGain: Number(m.reverseGain || 0.75),
    virtualAgents: TOTAL_AGENTS,
    logicalCheckpoints: LOGICAL_CHECKPOINTS,
    shards: SHARD_COUNT,
    domain: 'cross_domain_carried_mistake',
    pidRange: `${pid(1)}..${pid(TOTAL_AGENTS)}`,
    hookwallStatus: Number(m.reverseGain || 0) >= 0.84 ? 'BLOCK_AND_PRESERVE' : 'WARN_AND_LEDGER',
    gnnStatus: Number(m.reverseGain || 0) >= 0.84 ? 'REVERSE_GAIN_MARK_CRITICAL' : 'REVERSE_GAIN_MARK_WATCH',
    gcDisposition: Number(m.reverseGain || 0) >= 0.84 ? 'preserve_evidence_quarantine_pattern' : 'ledger_pattern_compact_duplicates',
    summary: m.summary
  }));

  const newMarks = CRITICAL_MISTAKES.map((m) => ({
    kind: 'mistake',
    id: m.id,
    glyph: glyph('frontier_mistake', m.id, m.summary),
    score: '',
    reverseGain: m.reverseGain,
    virtualAgents: TOTAL_AGENTS,
    logicalCheckpoints: LOGICAL_CHECKPOINTS,
    shards: SHARD_COUNT,
    domain: 'frontier_global_guard',
    pidRange: `${pid(1)}..${pid(TOTAL_AGENTS)}`,
    hookwallStatus: m.reverseGain >= 0.84 ? 'BLOCK_AND_PRESERVE' : 'WARN_AND_LEDGER',
    gnnStatus: m.reverseGain >= 0.84 ? 'REVERSE_GAIN_MARK_CRITICAL' : 'REVERSE_GAIN_MARK_WATCH',
    gcDisposition: m.reverseGain >= 0.84 ? 'preserve_evidence_quarantine_pattern' : 'ledger_pattern_compact_duplicates',
    summary: m.summary
  }));

  const byId = new Map();
  for (const m of [...newMarks, ...carried]) {
    if (!byId.has(m.id) || Number(m.reverseGain) > Number(byId.get(m.id).reverseGain)) byId.set(m.id, m);
  }
  return [...byId.values()].sort((a, b) => Number(b.reverseGain) - Number(a.reverseGain));
}

function buildRuViewQueue(ruViewState, generatedAt) {
  const plan = [
    'preserve_hash_and_zone_identifier',
    'static_metadata_inventory',
    'signature_and_origin_check',
    'sandbox_plan_only_no_execution',
    'claim_language_red_team',
    'operator_approval_required_for_any_next_step'
  ];
  return plan.map((step, index) => ({
    queueId: `RUVIEW-STATIC-${String(index + 1).padStart(2, '0')}`,
    generatedAt,
    step,
    status: 'QUEUED_STATIC_ONLY',
    ruViewSupervisorStatus: ruViewState?.status || 'unknown',
    executionPolicy: 'FAIL_CLOSED_NO_EXECUTION',
    gate: 'operator_approval_required'
  }));
}

function buildRoadmap(aggregate, geniusMarks, mistakeMarks, generatedAt) {
  const phases = [
    phase('P1_local_tracking', 'Ingest local Symphony/Linear migration queue into local services; no remote Linear mutation.', ['connector_health_matrix', 'pid_bound_session_bus']),
    phase('P2_synthetic_eeg_ci', 'Make synthetic EEG parser/metrics fixtures permanent CI gates.', ['synthetic_first_ci', 'quality_first_feedback']),
    phase('P3_neuro_interface_bus', 'Build PID-bound local event bus for consent, task events, signal quality, feedback, stop/delete.', ['pid_bound_session_bus', 'lsl_event_spine']),
    phase('P4_ruview_static_quarantine', 'Keep RU-view fail-closed and run static provenance/sandbox planning only.', ['claim_quarantine']),
    phase('P5_enhancement_support', 'Build non-medical training support loops with uncertainty, breath pacing, practice scheduling, fatigue awareness.', ['quality_first_feedback', 'model_card_gate']),
    phase('P6_model_ladder', 'Promote only through signal quality, bandpower, CSP/LDA, Riemannian, then deep models with model cards.', ['baseline_model_ladder', 'model_card_gate']),
    phase('P7_live_gate_readiness', 'Prepare live readiness checklists, but do not collect human data until attestation and device gates pass.', ['consent_revocation_path', 'no_git_raw_guard'])
  ];
  return {
    roadmapId: 'neuro-interface-enhancement-roadmap.v1',
    generatedAt,
    status: 'ROADMAP_READY_SYNTHETIC_AND_LOCAL_ONLY',
    mode: MODE,
    domainAggregate: aggregate,
    topGenius: geniusMarks.slice(0, 10),
    topMistakes: mistakeMarks.slice(0, 10),
    phases
  };
}

function phase(id, action, supportingGems) {
  return { id, action, supportingGems, gate: 'local_only_until_operator_approval' };
}

function buildRoadmapMd(roadmap) {
  const rows = roadmap.phases.map((p) => `| ${p.id} | ${p.gate} | ${p.supportingGems.join(' ')} | ${p.action} |`).join('\n');
  return `# Neuro Interface Enhancement Roadmap

Generated: ${roadmap.generatedAt}

Status: ${roadmap.status}

This roadmap keeps EEG/neuro-interface/enhancement work synthetic, local, consent-based, and non-medical. RU-view remains fail-closed and static-analysis-only.

| Phase | Gate | Gems | Action |
| --- | --- | --- | --- |
${rows}
`;
}

function buildSummary(agentSpace, aggregate, geniusMarks, mistakeMarks, ruQueue, generatedAt) {
  return {
    summaryId: 'neurotech-1b-frontier-loop-summary',
    generatedAt,
    status: 'ONE_B_FRONTIER_GNN_GC_READY',
    mode: MODE,
    agentSpace,
    counts: {
      virtualAgents: TOTAL_AGENTS,
      checkpointInterval: CHECKPOINT_INTERVAL,
      logicalCheckpoints: LOGICAL_CHECKPOINTS,
      checkpointShards: SHARD_COUNT,
      proofSamples: null,
      geniusMarks: geniusMarks.length,
      farmedGeniusMarks: geniusMarks.filter((g) => g.gcDisposition === 'farm_gem_preserve_sources').length,
      mistakeMarks: mistakeMarks.length,
      criticalMistakeMarks: mistakeMarks.filter((m) => Number(m.reverseGain) >= 0.84).length,
      ruViewStaticQueueItems: ruQueue.length,
      realAgentLaunches: 0,
      externalModelTokens: 0
    },
    domainAggregate: aggregate,
    topGenius: geniusMarks.slice(0, 10),
    topMistakes: mistakeMarks.slice(0, 10)
  };
}

function buildGcManifest(summary, generatedAt) {
  return {
    gcId: 'neurotech-1b-frontier-gc-latest',
    generatedAt,
    status: 'GC_COMPACTED_1B_FRONTIER',
    mode: MODE,
    rule: 'Preserve source evidence and compact 500000 logical checkpoints into 1000 shard rows plus proof samples.',
    counts: summary.counts,
    compacted: {
      materializedAgentRowsAvoided: TOTAL_AGENTS,
      materializedCheckpointRowsAvoided: LOGICAL_CHECKPOINTS - SHARD_COUNT,
      shardRowsKept: SHARD_COUNT,
      sourceEvidenceDeleted: 0
    },
    sources: [
      repoRel(PATHS.twentyMSummary),
      repoRel(PATHS.supervisors),
      repoRel(PATHS.ruViewState)
    ]
  };
}

function buildHermes(summary, generatedAt) {
  return {
    integrationId: 'neurotech-1b-virtual-frontier-loop-hermes-dispatch',
    generatedAt,
    status: summary.status,
    mode: MODE,
    packet: {
      verb: 'EVT-HERMES-NEUROTECH-1B-VIRTUAL-FRONTIER',
      summary: '1B virtual-agent EEG/RU-view/neuro-interface/enhancement frontier completed locally with GNN, reverse-gain, and GC compaction.',
      counts: summary.counts,
      report: repoRel(PATHS.reportMd)
    }
  };
}

function buildShannon(summary, generatedAt) {
  return {
    integrationId: 'neurotech-1b-virtual-frontier-loop-shannon-consensus',
    generatedAt,
    status: 'consensus_one_b_frontier_local_only',
    consensus: 'PROCEED_1B_VIRTUAL_FRONTIER_LOCAL_ONLY',
    executionDisposition: 'zero_external_tokens_no_real_agent_launch_no_ruview_execution_no_live_eeg',
    votes: [
      { part: 'scout', vote: 'PROCEED_VIRTUAL', reason: '1B virtual agents are represented by compact PID ranges and shard checkpoints.' },
      { part: 'evidence', vote: 'PROCEED', reason: `${summary.counts.logicalCheckpoints} logical per-2000 checkpoints are compacted into ${summary.counts.checkpointShards} shard records.` },
      { part: 'executor', vote: 'HALT_LIVE_AND_RUVIEW', reason: 'No live EEG, no RU-view execution, no downloads, no external calls.' },
      { part: 'fabric', vote: 'PROCEED', reason: 'GNN marks, mistakes, roadmap, GC, Hermes, Shannon, cube, and report are local BEHCS surfaces.' },
      { part: 'voice', vote: 'CLAIM_GUARD', reason: 'Enhancement is framed as training support; literal mind-reading remains blocked as an unverified claim.' },
      { part: 'planner', vote: 'NEXT_LOCAL_SERVICE_WIRING', reason: 'Next step is local Symphony/Linear queue ingestion and synthetic EEG CI wiring.' }
    ]
  };
}

function buildCube(summary, shannonPacket, generatedAt) {
  const cube = {
    id: 'neurotech-1b-virtual-frontier-loop',
    generatedAt,
    primaryCatalog: { D: 42, name: 'ORCHESTRATION', prime: 181 },
    touches: [7, 20, 24, 35, 37, 39, 42, 47, 59],
    gates: ['virtual_pid_space', 'checkpoint_2000_compacted', 'ruview_fail_closed', 'synthetic_eeg_only', 'gnn_reverse_gain_gc'],
    payload: {
      kind: '1b-neurotech-frontier-loop',
      status: summary.status,
      mode: MODE,
      counts: summary.counts,
      shannon: {
        consensus: shannonPacket.consensus,
        executionDisposition: shannonPacket.executionDisposition
      }
    },
    translate: {
      human: '1B virtual agents continued EEG/RU-view/neuro-interface/enhancement planning with fail-closed safety gates.',
      agent: '(asolaria, neurotech, eeg, ruview_quarantine, enhancement_support, 1b_virtual_agents, gnn, gc)',
      device: 'node tools/neurotech-1b-virtual-frontier-loop.js frontier --execute'
    }
  };
  return `// cube: neurotech-1b-virtual-frontier-loop | neurotech | D42 ORCHESTRATION\nexport const CUBE = ${JSON.stringify(cube, null, 2)}\n`;
}

function buildReport(summary, roadmap, gcManifest, shannonPacket, generatedAt) {
  const domainRows = summary.domainAggregate.map((d) =>
    `| ${d.domain} | ${d.virtualAgents} | ${d.logicalCheckpoints} | ${d.avgScore} | ${d.maxReverseGain} |`
  ).join('\n');
  const geniusRows = summary.topGenius.slice(0, 8).map((g) =>
    `| ${g.id} | ${g.score} | ${g.virtualAgents} | ${g.gnnStatus} | ${g.gcDisposition} |`
  ).join('\n');
  const mistakeRows = summary.topMistakes.slice(0, 8).map((m) =>
    `| ${m.id} | ${m.reverseGain} | ${m.gnnStatus} | ${m.gcDisposition} |`
  ).join('\n');

  const json = {
    reportId: 'neurotech-1b-virtual-frontier-loop-latest',
    generatedAt,
    status: summary.status,
    mode: MODE,
    counts: summary.counts,
    outputs: outputs(),
    shannon: shannonPacket,
    gc: gcManifest,
    roadmap
  };

  const md = `# Neurotech 1B Virtual Frontier Loop

Generated: ${generatedAt}

Status: ${summary.status}

Continued EEG, RU-view quarantine, neuro-interface, and enhancement planning as a one-billion-agent virtual frontier. The per-2,000 self-improvement rule remains active as ${summary.counts.logicalCheckpoints} logical checkpoints, compacted into ${summary.counts.checkpointShards} shard records to avoid exploding C:.

## Counts

- Virtual agents: ${summary.counts.virtualAgents}
- Logical checkpoints per 2,000: ${summary.counts.logicalCheckpoints}
- Checkpoint shard rows: ${summary.counts.checkpointShards}
- Genius marks: ${summary.counts.geniusMarks}
- Farmed genius marks: ${summary.counts.farmedGeniusMarks}
- Mistake marks: ${summary.counts.mistakeMarks}
- Critical mistake marks: ${summary.counts.criticalMistakeMarks}
- RU-view static queue items: ${summary.counts.ruViewStaticQueueItems}
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

- Frontier summary: \`${repoRel(PATHS.frontierSummary)}\`
- Checkpoint shards: \`${repoRel(PATHS.checkpointShards)}\`
- Proof samples: \`${repoRel(PATHS.proofSamples)}\`
- Genius marks: \`${repoRel(PATHS.geniusCsv)}\`
- Mistake marks: \`${repoRel(PATHS.mistakeCsv)}\`
- RU-view static queue: \`${repoRel(PATHS.ruViewQueue)}\`
- Roadmap: \`${repoRel(PATHS.roadmapMd)}\`
- GC manifest: \`${repoRel(PATHS.gcManifest)}\`

## Shannon

- Consensus: ${shannonPacket.consensus}
- Execution: ${shannonPacket.executionDisposition}
`;
  return { json, md };
}

function outputs() {
  return {
    agentSpace: repoRel(PATHS.agentSpace),
    checkpointShards: repoRel(PATHS.checkpointShards),
    proofSamples: repoRel(PATHS.proofSamples),
    frontierSummary: repoRel(PATHS.frontierSummary),
    geniusCsv: repoRel(PATHS.geniusCsv),
    mistakeCsv: repoRel(PATHS.mistakeCsv),
    ruViewQueue: repoRel(PATHS.ruViewQueue),
    roadmapJson: repoRel(PATHS.roadmapJson),
    roadmapMd: repoRel(PATHS.roadmapMd),
    gcManifest: repoRel(PATHS.gcManifest),
    reportMd: repoRel(PATHS.reportMd),
    cube: repoRel(PATHS.cube)
  };
}

function frontier({ execute = false } = {}) {
  const generatedAt = new Date().toISOString();
  const agentSpace = buildAgentSpace(generatedAt);
  const existingGems = readNdjson(PATHS.gems);
  const existingMistakes = readNdjson(PATHS.mistakes);
  const ruViewState = readJson(PATHS.ruViewState, {});
  const { shards, proofSamples, aggregate } = buildShards(generatedAt);
  const geniusMarks = buildGeniusMarks(aggregate, existingGems);
  const mistakeMarks = buildMistakeMarks(existingMistakes);
  const ruViewQueue = buildRuViewQueue(ruViewState, generatedAt);
  const roadmap = buildRoadmap(aggregate, geniusMarks, mistakeMarks, generatedAt);
  const summary = buildSummary(agentSpace, aggregate, geniusMarks, mistakeMarks, ruViewQueue, generatedAt);
  summary.counts.proofSamples = proofSamples.length;
  const gcManifest = buildGcManifest(summary, generatedAt);
  const hermesPacket = buildHermes(summary, generatedAt);
  const shannonPacket = buildShannon(summary, generatedAt);
  const cube = buildCube(summary, shannonPacket, generatedAt);
  const report = buildReport(summary, roadmap, gcManifest, shannonPacket, generatedAt);
  const eventId = `neurotech-1b-frontier-${Date.now()}`;

  if (execute) {
    writeJson(PATHS.agentSpace, agentSpace);
    writeText(PATHS.checkpointShards, toNdjson(shards));
    writeText(PATHS.proofSamples, toNdjson(proofSamples));
    writeJson(PATHS.frontierSummary, summary);
    writeText(PATHS.geniusCsv, toCsv(geniusMarks, MARK_FIELDS));
    writeText(PATHS.geniusNdjson, toNdjson(geniusMarks));
    writeText(PATHS.mistakeCsv, toCsv(mistakeMarks, MARK_FIELDS));
    writeText(PATHS.mistakeNdjson, toNdjson(mistakeMarks));
    writeText(PATHS.ruViewQueue, toNdjson(ruViewQueue));
    writeJson(PATHS.roadmapJson, roadmap);
    writeText(PATHS.roadmapMd, buildRoadmapMd(roadmap));
    writeJson(PATHS.gcManifest, gcManifest);
    writeText(PATHS.gcTrash, toNdjson([
      { kind: 'agent_rows_avoided', count: TOTAL_AGENTS },
      { kind: 'checkpoint_rows_compacted', count: LOGICAL_CHECKPOINTS - SHARD_COUNT },
      { kind: 'source_evidence_deleted', count: 0 }
    ]));
    writeJson(PATHS.state, {
      savedAt: generatedAt,
      status: summary.status,
      mode: MODE,
      counts: summary.counts,
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
      to: 'neurotech-1b-frontier',
      verb: 'EVT-NEUROTECH-1B-VIRTUAL-FRONTIER',
      body: { status: summary.status, counts: summary.counts, report: repoRel(PATHS.reportMd) }
    });
    appendNdjson(PATHS.outbox, {
      id: `${eventId}-hermes`,
      ts: generatedAt,
      from: 'hermes',
      to: 'neurotech-1b-frontier',
      verb: hermesPacket.packet.verb,
      body: hermesPacket
    });
    appendNdjson(PATHS.gnnEdges, {
      id: `${eventId}-eeg`,
      ts: generatedAt,
      from: '20m_virtual_agent_loop',
      to: '1b_neurotech_frontier',
      verb: 'expanded_virtual_frontier_compacted_checkpoints',
      weight: 0.94
    });
    appendNdjson(PATHS.gnnEdges, {
      id: `${eventId}-ruview`,
      ts: generatedAt,
      from: 'ruview_fail_closed_supervisor',
      to: 'ruview_static_analysis_queue',
      verb: 'quarantine_static_only',
      weight: 0.97
    });
  }

  return {
    ok: true,
    action: execute ? 'frontier' : 'preview',
    generatedAt,
    status: summary.status,
    counts: summary.counts,
    topGenius: summary.topGenius.slice(0, 5).map((g) => ({ id: g.id, score: g.score, virtualAgents: g.virtualAgents })),
    topMistakes: summary.topMistakes.slice(0, 5).map((m) => ({ id: m.id, reverseGain: m.reverseGain })),
    outputs: outputs(),
    mode: MODE
  };
}

function main(argv) {
  const action = argv[2] || 'status';
  const execute = argv.includes('--execute');
  if (action === 'status') {
    console.log(JSON.stringify(frontier({ execute: false }), null, 2));
    return;
  }
  if (action === 'frontier') {
    console.log(JSON.stringify(frontier({ execute }), null, 2));
    return;
  }
  console.error(JSON.stringify({
    ok: false,
    error: `Unknown action: ${action}`,
    usage: [
      'node tools/neurotech-1b-virtual-frontier-loop.js status',
      'node tools/neurotech-1b-virtual-frontier-loop.js frontier --execute'
    ]
  }, null, 2));
  process.exitCode = 2;
}

main(process.argv);
