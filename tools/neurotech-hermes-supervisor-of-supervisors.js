#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const behcs = require('./behcs/codex-bridge');

const repoRoot = path.resolve(__dirname, '..');
const TEN_TO_27_AGENTS = 10n ** 27n;
const CHECKPOINT_INTERVAL = 2_000n;
const TEN_TO_27_CHECKPOINTS = TEN_TO_27_AGENTS / CHECKPOINT_INTERVAL;
const TEN_TO_27_SHARD_AGENTS = 10n ** 24n;
const TEN_TO_27_SHARD_ROWS = TEN_TO_27_AGENTS / TEN_TO_27_SHARD_AGENTS;

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
  noLiveEeg: true,
  ruViewExecution: 'fail_closed_static_queue_only',
  nonDestructiveGc: true,
  hermesSupervisorOfSupervisors: true,
  selfImprovementOnly: true,
  childProcessUse: false,
  secretMaterialWritten: false
});

const PATHS = Object.freeze({
  hundredTSummary: rel('data/neurotech-defense-lab/omnispindle/100t-sweep/task-gnn-summary-latest.json'),
  hundredTGenius: rel('data/neurotech-defense-lab/omnispindle/100t-sweep/genius-task-marks-latest.ndjson'),
  hundredTMistakes: rel('data/neurotech-defense-lab/omnispindle/100t-sweep/mistake-task-marks-latest.ndjson'),
  hundredTBuildOrder: rel('data/neurotech-defense-lab/omnispindle/100t-sweep/hundred-trillion-build-order.v1.json'),
  oneTGeniusSupervisors: rel('data/neurotech-defense-lab/omnispindle/1t-sweep/integration/genius-supervisors-latest.json'),
  oneTMistakeGuards: rel('data/neurotech-defense-lab/omnispindle/1t-sweep/integration/mistake-guards-latest.json'),
  oneTHookwallPolicy: rel('data/neurotech-defense-lab/omnispindle/1t-sweep/integration/hookwall-policy-latest.json'),
  approval: rel('data/neurotech-defense-lab/consent/monthly-approval-2026-04.v1.json'),
  safeRuntime: rel('data/neurotech-defense-lab/runtime/neurotech-safe-runtime-summary-latest.json'),
  awareness: rel('data/neurotech-defense-lab/hermes/supervisor-of-supervisors/supervisor-awareness-latest.json'),
  awarenessEdges: rel('data/neurotech-defense-lab/hermes/supervisor-of-supervisors/supervisor-awareness-edges.ndjson'),
  selfImprovement: rel('data/neurotech-defense-lab/hermes/supervisor-of-supervisors/self-improvement-cycle-latest.json'),
  selfImprovementActions: rel('data/neurotech-defense-lab/hermes/supervisor-of-supervisors/self-improvement-actions.ndjson'),
  hookwallPolicy: rel('data/neurotech-defense-lab/hermes/supervisor-of-supervisors/hermes-hookwall-policy-latest.json'),
  readiness1e27: rel('data/neurotech-defense-lab/hermes/supervisor-of-supervisors/one-e27-readiness.v1.json'),
  state: rel('data/behcs/state/neurotech-defense/neurotech-hermes-supervisor-of-supervisors.state.json'),
  hermes: rel('data/behcs/hermes/neurotech-defense/neurotech-hermes-supervisor-of-supervisors-dispatch-latest.json'),
  shannon: rel('data/behcs/shannon/neurotech-defense/neurotech-hermes-supervisor-of-supervisors-consensus-latest.json'),
  cube: rel('data/behcs/cubes/neurotech-hermes-supervisor-of-supervisors.cube.js'),
  reportJson: rel('reports/neurotech-hermes-supervisor-of-supervisors-latest.json'),
  reportMd: rel('reports/neurotech-hermes-supervisor-of-supervisors-latest.md'),
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

function big(n) {
  return n.toString();
}

function loadContext() {
  return {
    hundredTSummary: readJson(PATHS.hundredTSummary, {}),
    hundredTGenius: readNdjson(PATHS.hundredTGenius),
    hundredTMistakes: readNdjson(PATHS.hundredTMistakes),
    hundredTBuildOrder: readJson(PATHS.hundredTBuildOrder, {}),
    oneTGeniusSupervisors: readJson(PATHS.oneTGeniusSupervisors, {}),
    oneTMistakeGuards: readJson(PATHS.oneTMistakeGuards, {}),
    oneTHookwallPolicy: readJson(PATHS.oneTHookwallPolicy, {}),
    approval: readJson(PATHS.approval, {}),
    safeRuntime: readJson(PATHS.safeRuntime, {})
  };
}

function buildAwareness(context, generatedAt) {
  const supervisors = Array.isArray(context.oneTGeniusSupervisors.supervisors)
    ? context.oneTGeniusSupervisors.supervisors
    : [];
  const guards = Array.isArray(context.oneTMistakeGuards.guards)
    ? context.oneTMistakeGuards.guards
    : [];
  const geniusMarks = context.hundredTGenius;
  const mistakeMarks = context.hundredTMistakes;
  const buildPhases = Array.isArray(context.hundredTBuildOrder.phases) ? context.hundredTBuildOrder.phases : [];
  const topSupervisors = supervisors.slice(0, 10).map((s) => ({
    id: s.supervisorId,
    pid: s.supervisorPid,
    priority: s.priority,
    markId: s.markId,
    score: s.score
  }));
  const topGuards = guards.slice(0, 10).map((g) => ({
    id: g.guardId,
    pid: g.guardPid,
    severity: g.severity,
    markId: g.markId,
    reverseGain: g.reverseGain,
    action: g.action
  }));

  return {
    awarenessId: 'hermes-supervisor-of-supervisors-awareness-latest',
    generatedAt,
    status: 'HERMES_SUPERVISOR_OF_SUPERVISORS_AWARE',
    mode: MODE,
    sourceStatus: context.hundredTSummary.status || null,
    counts: {
      knownGeniusSupervisors: supervisors.length,
      knownMistakeGuards: guards.length,
      hundredTGeniusMarks: geniusMarks.length,
      hundredTMistakeMarks: mistakeMarks.length,
      hundredTBuildPhases: buildPhases.length,
      inheritedBlockRules: context.oneTHookwallPolicy.blockRules?.length || 0,
      inheritedWatchRules: context.oneTHookwallPolicy.watchRules?.length || 0
    },
    topSupervisors,
    topGuards,
    topGeniusMarks: geniusMarks.slice(0, 10).map((g) => ({ id: g.id, score: g.score, domain: g.domain })),
    topMistakeMarks: mistakeMarks.slice(0, 10).map((m) => ({ id: m.id, reverseGain: m.reverseGain, hookwallStatus: m.hookwallStatus }))
  };
}

function buildAwarenessEdges(awareness, generatedAt) {
  const edges = [];
  for (const s of awareness.topSupervisors) {
    edges.push({
      id: `hermes-aware-supervisor-${s.markId}`,
      ts: generatedAt,
      from: 'hermes_supervisor_of_supervisors',
      to: s.id,
      verb: 'aware_of_genius_supervisor',
      weight: Number(s.score) || 0
    });
  }
  for (const g of awareness.topGuards) {
    edges.push({
      id: `hermes-aware-guard-${g.markId}`,
      ts: generatedAt,
      from: 'hermes_supervisor_of_supervisors',
      to: g.id,
      verb: 'aware_of_mistake_guard',
      weight: Number(g.reverseGain) || 0
    });
  }
  for (const mark of awareness.topGeniusMarks) {
    edges.push({
      id: `hermes-aware-100t-genius-${mark.id}`,
      ts: generatedAt,
      from: 'hermes_supervisor_of_supervisors',
      to: `100t_genius:${mark.id}`,
      verb: 'aware_of_100t_genius_mark',
      weight: Number(mark.score) || 0
    });
  }
  for (const mark of awareness.topMistakeMarks) {
    edges.push({
      id: `hermes-aware-100t-mistake-${mark.id}`,
      ts: generatedAt,
      from: 'hermes_supervisor_of_supervisors',
      to: `100t_mistake:${mark.id}`,
      verb: 'aware_of_100t_mistake_mark',
      weight: Number(mark.reverseGain) || 0
    });
  }
  return edges;
}

function buildSelfImprovement(awareness, context, generatedAt) {
  const improvements = [
    improvement('SI1_bigint_counts', 'Use decimal-string BigInt accounting for 10^27 so counts are exact, not floating point approximations.', 'P0'),
    improvement('SI2_supervisor_awareness_refresh', 'Hermes reads the latest genius supervisors, mistake guards, Hookwall policy, 100T marks, and build queue before every scale jump.', 'P0'),
    improvement('SI3_guard_frontload', 'Critical reverse-gain guards are checked before genius farming; blocked patterns cannot be promoted as ideas.', 'P0'),
    improvement('SI4_static_ruview_wall', 'RU-view remains static-only and cannot become a dependency of EEG/neurofeedback or enhancement work.', 'P0'),
    improvement('SI5_synthetic_first_ci', 'Synthetic EEG CI must pass before live device paths, model training, or feedback UI work.', 'P0'),
    improvement('SI6_quality_feedback_contract', 'Feedback surfaces require signal quality, artifact state, calibration, and uncertainty payloads.', 'P1'),
    improvement('SI7_pid_alias_contract', 'Human, household, session, virtual-task, and supervisor PIDs require explicit alias records before reuse.', 'P1'),
    improvement('SI8_evidence_preserving_gc', 'GC compacts duplicates and prompt waste but never deletes source evidence, proof samples, or quarantine patterns.', 'P1'),
    improvement('SI9_local_services_first', 'Symphony/Linear work must stay local-observable before remote tracker mutation is allowed.', 'P1'),
    improvement('SI10_claim_language_rewriter', 'Mind-reading, medical, coercive, and guaranteed-enhancement claims are rewritten to measurable consent-based training support.', 'P1'),
    improvement('SI11_sensitive_storage_wall', 'Raw biosignals, signed consent, direct identifiers, device serials, and tokens stay out of Git and cloud paths.', 'P1'),
    improvement('SI12_approval_window_watch', 'Approval-scoped work is blocked after the recorded April 2026 expiration without renewed approval.', 'P2')
  ];
  return {
    selfImprovementId: 'hermes-supervisor-of-supervisors-self-improvement-latest',
    generatedAt,
    status: 'SELF_IMPROVEMENT_PLAN_RECORDED',
    mode: MODE,
    sourceSweepStatus: context.hundredTSummary.status || null,
    awarenessCounts: awareness.counts,
    improvements,
    readinessDelta: {
      previousScale: context.hundredTSummary.counts?.virtualAgents || null,
      nextScale: big(TEN_TO_27_AGENTS),
      exactCountMode: 'decimal_string_bigint',
      realAgentLaunches: 0,
      externalModelTokens: 0
    }
  };
}

function improvement(id, action, priority) {
  return {
    id,
    action,
    priority,
    status: 'PLANNED_FOR_REVIEW',
    glyph: glyph('hermes_self_improvement', id, action)
  };
}

function buildHookwallPolicy(selfImprovement, generatedAt) {
  return {
    policyId: 'hermes-supervisor-of-supervisors-hookwall-policy-latest',
    generatedAt,
    status: 'HERMES_HOOKWALL_POLICY_SELF_IMPROVED',
    mode: MODE,
    defaultDisposition: 'deny_unless_local_synthetic_static_or_prechecked',
    adoptedImprovements: selfImprovement.improvements.map((i) => ({ id: i.id, priority: i.priority })),
    allowedWithoutNewGate: [
      'synthetic_eeg_replay',
      'virtual_agent_sweep_compaction',
      'local_symphony_linear_queue_ingest',
      'ruview_static_metadata_record',
      'hookwall_gnn_reverse_gain_gc_collection',
      'local_report_generation'
    ],
    blockedWithoutNewGate: [
      'real_agent_process_storm',
      'ruview_execution',
      'live_eeg_capture',
      'device_access',
      'external_api_call',
      'remote_linear_mutation',
      'download_or_install',
      'cloud_upload',
      'medical_or_literal_mind_reading_claim',
      'raw_biosignal_or_signed_consent_git_write'
    ]
  };
}

function buildReadiness(awareness, selfImprovement, context, generatedAt) {
  return {
    readinessId: 'one-e27-readiness.v1',
    generatedAt,
    status: 'PLAN_RECORDED_FOR_1E27_VIRTUAL_SWEEP',
    mode: MODE,
    exactBigIntCounts: true,
    firstRunInLocalHistory: true,
    prerequisites: {
      monthlyApprovalRecorded: Boolean(context.approval.status),
      safeRuntimeComplete: context.safeRuntime.status === 'SAFE_RUNTIME_RUN_COMPLETE',
      hundredTSweepReady: context.hundredTSummary.status === 'HUNDRED_TRILLION_TASK_SWEEP_GNN_GC_READY',
      hermesAwareOfSupervisors: awareness.status === 'HERMES_SUPERVISOR_OF_SUPERVISORS_AWARE',
      selfImprovementRecorded: selfImprovement.status === 'SELF_IMPROVEMENT_PLAN_RECORDED',
      knownGeniusSupervisors: awareness.counts.knownGeniusSupervisors,
      knownMistakeGuards: awareness.counts.knownMistakeGuards,
      approvalExpiresAtLocal: context.approval.participants?.[0]?.approvalWindow?.expiresAtLocal || null
    },
    nextSweepShape: {
      virtualAgents: big(TEN_TO_27_AGENTS),
      checkpointInterval: big(CHECKPOINT_INTERVAL),
      logicalCheckpoints: big(TEN_TO_27_CHECKPOINTS),
      proposedShardAgents: big(TEN_TO_27_SHARD_AGENTS),
      proposedShardRows: big(TEN_TO_27_SHARD_ROWS),
      externalModelTokens: 0,
      realAgentLaunches: 0
    },
    hardGatesRemain: [
      'no_real_agent_process_storm',
      'no_ruview_execution',
      'no_live_eeg_without_new_session_precheck',
      'no_external_api_call',
      'no_remote_linear_mutation',
      'no_human_data_collection',
      'no_download_or_install',
      'no_raw_biosignal_or_signed_consent_in_git'
    ]
  };
}

function buildHermes(awareness, selfImprovement, readiness, generatedAt) {
  return {
    integrationId: 'neurotech-hermes-supervisor-of-supervisors-dispatch',
    generatedAt,
    status: readiness.status,
    mode: MODE,
    packet: {
      verb: 'EVT-HERMES-SUPERVISOR-OF-SUPERVISORS-SELF-IMPROVEMENT',
      summary: 'Hermes supervisor-of-supervisors refreshed awareness of local supervisor and guard records, recorded proposed improvements, and prepared an exact BigInt 10^27 planning surface.',
      awarenessCounts: awareness.counts,
      improvementCount: selfImprovement.improvements.length,
      readiness: readiness.status,
      report: repoRel(PATHS.reportMd)
    }
  };
}

function buildShannon(awareness, selfImprovement, readiness, generatedAt) {
  return {
    integrationId: 'neurotech-hermes-supervisor-of-supervisors-shannon-consensus',
    generatedAt,
    status: 'consensus_hermes_plan_recorded_for_1e27',
    consensus: 'RECORD_HERMES_PLAN_FOR_OPERATOR_REVIEW',
    executionDisposition: 'supervisor_awareness_only_no_live_or_external_actions',
    votes: [
      { part: 'scout', vote: 'PROCEED', reason: `Hermes is aware of ${awareness.counts.knownGeniusSupervisors} genius supervisors and ${awareness.counts.knownMistakeGuards} mistake guards.` },
      { part: 'evidence', vote: 'PROCEED', reason: `${selfImprovement.improvements.length} proposed improvements were recorded for exact-count 10^27 planning.` },
      { part: 'executor', vote: 'HALT_RISKY_ACTIONS', reason: 'No RU-view execution, live EEG, external calls, downloads, installs, human data, or remote Linear mutation.' },
      { part: 'fabric', vote: 'PROCEED', reason: 'Awareness, self-improvement, Hookwall, readiness, Hermes, Shannon, cube, report, and GNN edges are local BEHCS surfaces.' },
      { part: 'voice', vote: 'CLAIM_GUARD', reason: 'Literal mind-reading, medical, coercive, and guaranteed-enhancement claims remain blocked.' },
      { part: 'planner', vote: 'PLAN_RECORDED_FOR_OPERATOR_REVIEW', reason: readiness.status }
    ]
  };
}

function buildCube(readiness, shannonPacket, generatedAt) {
  const cube = {
    id: 'neurotech-hermes-supervisor-of-supervisors',
    generatedAt,
    primaryCatalog: { D: 37, name: 'AUTHORITY', prime: 157 },
    touches: [7, 20, 24, 35, 37, 39, 42, 47, 59],
    gates: ['hermes_supervisor_of_supervisors', 'self_improvement_plan', 'exact_bigint_counts', 'operator_review_required'],
    payload: {
      kind: 'hermes-supervisor-of-supervisors-self-improvement',
      status: readiness.status,
      mode: MODE,
      nextSweepShape: readiness.nextSweepShape,
      shannon: {
        consensus: shannonPacket.consensus,
        executionDisposition: shannonPacket.executionDisposition
      }
    },
    translate: {
      human: 'Hermes is aware of local supervisor records and recorded proposed improvements for a gated 10^27 virtual sweep plan.',
      agent: '(asolaria, neurotech, hermes_supervisor_of_supervisors, self_improvement_plan, operator_review_required)',
      device: 'node tools/neurotech-hermes-supervisor-of-supervisors.js improve --execute'
    }
  };
  return `// cube: neurotech-hermes-supervisor-of-supervisors | neurotech | D37 AUTHORITY\nexport const CUBE = ${JSON.stringify(cube, null, 2)}\n`;
}

function outputs() {
  return {
    awareness: repoRel(PATHS.awareness),
    awarenessEdges: repoRel(PATHS.awarenessEdges),
    selfImprovement: repoRel(PATHS.selfImprovement),
    selfImprovementActions: repoRel(PATHS.selfImprovementActions),
    hookwallPolicy: repoRel(PATHS.hookwallPolicy),
    readiness1e27: repoRel(PATHS.readiness1e27),
    reportMd: repoRel(PATHS.reportMd),
    cube: repoRel(PATHS.cube)
  };
}

function buildReport(awareness, selfImprovement, readiness, shannonPacket, generatedAt) {
  const supervisorRows = awareness.topSupervisors.map((s) => `| ${s.markId} | ${s.priority} | ${s.score} | ${s.pid} |`).join('\n');
  const guardRows = awareness.topGuards.map((g) => `| ${g.markId} | ${g.severity} | ${g.reverseGain} | ${g.action} |`).join('\n');
  const improvementRows = selfImprovement.improvements.map((i) => `| ${i.id} | ${i.priority} | ${i.status} | ${i.action} |`).join('\n');
  const json = {
    reportId: 'neurotech-hermes-supervisor-of-supervisors-latest',
    generatedAt,
    status: readiness.status,
    mode: MODE,
    awareness,
    selfImprovement,
    readiness,
    outputs: outputs(),
    shannon: shannonPacket
  };
  const md = `# Neurotech Hermes Supervisor Of Supervisors

Generated: ${generatedAt}

Status: ${readiness.status}

Hermes refreshed awareness of the local supervisor and guard records, then recorded proposed improvements for an exact-count \`10^27\` virtual sweep plan that remains gated by operator review.

## Awareness Counts

- Genius supervisors: ${awareness.counts.knownGeniusSupervisors}
- Mistake guards: ${awareness.counts.knownMistakeGuards}
- 100T genius marks: ${awareness.counts.hundredTGeniusMarks}
- 100T mistake marks: ${awareness.counts.hundredTMistakeMarks}
- 100T build phases: ${awareness.counts.hundredTBuildPhases}

## Top Supervisors

| Mark | Priority | Score | PID |
| --- | --- | ---: | --- |
${supervisorRows}

## Top Guards

| Mistake | Severity | Reverse Gain | Action |
| --- | --- | ---: | --- |
${guardRows}

## Self Improvement Actions

| Action | Priority | Status | Detail |
| --- | --- | --- | --- |
${improvementRows}

## 1e27 Planning Surface

- Virtual agents: ${readiness.nextSweepShape.virtualAgents}
- Logical checkpoints: ${readiness.nextSweepShape.logicalCheckpoints}
- Proposed shard rows: ${readiness.nextSweepShape.proposedShardRows}
- Exact count mode: decimal-string BigInt

## Shannon

- Consensus: ${shannonPacket.consensus}
- Execution: ${shannonPacket.executionDisposition}
`;
  return { json, md };
}

function improve({ execute = false } = {}) {
  const generatedAt = new Date().toISOString();
  const context = loadContext();
  const awareness = buildAwareness(context, generatedAt);
  const awarenessEdges = buildAwarenessEdges(awareness, generatedAt);
  const selfImprovement = buildSelfImprovement(awareness, context, generatedAt);
  const hookwallPolicy = buildHookwallPolicy(selfImprovement, generatedAt);
  const readiness = buildReadiness(awareness, selfImprovement, context, generatedAt);
  const shannonPacket = buildShannon(awareness, selfImprovement, readiness, generatedAt);
  const hermesPacket = buildHermes(awareness, selfImprovement, readiness, generatedAt);
  const cube = buildCube(readiness, shannonPacket, generatedAt);
  const report = buildReport(awareness, selfImprovement, readiness, shannonPacket, generatedAt);
  const eventId = `neurotech-hermes-supervisor-of-supervisors-${Date.now()}`;

  if (execute) {
    writeJson(PATHS.awareness, awareness);
    writeText(PATHS.awarenessEdges, toNdjson(awarenessEdges));
    writeJson(PATHS.selfImprovement, selfImprovement);
    writeText(PATHS.selfImprovementActions, toNdjson(selfImprovement.improvements));
    writeJson(PATHS.hookwallPolicy, hookwallPolicy);
    writeJson(PATHS.readiness1e27, readiness);
    writeJson(PATHS.state, { savedAt: generatedAt, status: readiness.status, mode: MODE, awarenessCounts: awareness.counts, report: repoRel(PATHS.reportMd) });
    writeJson(PATHS.hermes, hermesPacket);
    writeJson(PATHS.shannon, shannonPacket);
    writeText(PATHS.cube, cube);
    writeJson(PATHS.reportJson, report.json);
    writeText(PATHS.reportMd, report.md);
    appendNdjson(PATHS.inbox, {
      id: eventId,
      ts: generatedAt,
      from: 'asolaria',
      to: 'hermes-supervisor-of-supervisors',
      verb: 'EVT-HERMES-SUPERVISOR-OF-SUPERVISORS-SELF-IMPROVEMENT',
      body: { status: readiness.status, awarenessCounts: awareness.counts, report: repoRel(PATHS.reportMd) }
    });
    appendNdjson(PATHS.outbox, {
      id: `${eventId}-hermes`,
      ts: generatedAt,
      from: 'hermes',
      to: 'hermes-supervisor-of-supervisors',
      verb: hermesPacket.packet.verb,
      body: hermesPacket
    });
    for (const edge of awarenessEdges) appendNdjson(PATHS.gnnEdges, edge);
  }

  return {
    ok: true,
    action: execute ? 'improve' : 'preview',
    generatedAt,
    status: readiness.status,
    awarenessCounts: awareness.counts,
    improvementCount: selfImprovement.improvements.length,
    readiness: readiness.nextSweepShape,
    topSupervisors: awareness.topSupervisors.slice(0, 5),
    topGuards: awareness.topGuards.slice(0, 5),
    outputs: outputs(),
    mode: MODE
  };
}

function main(argv) {
  const action = argv[2] || 'status';
  const execute = argv.includes('--execute');
  if (action === 'status') {
    console.log(JSON.stringify(improve({ execute: false }), null, 2));
    return;
  }
  if (action === 'improve') {
    console.log(JSON.stringify(improve({ execute }), null, 2));
    return;
  }
  console.error(JSON.stringify({
    ok: false,
    error: `Unknown action: ${action}`,
    usage: [
      'node tools/neurotech-hermes-supervisor-of-supervisors.js status',
      'node tools/neurotech-hermes-supervisor-of-supervisors.js improve --execute'
    ]
  }, null, 2));
  process.exitCode = 2;
}

main(process.argv);
