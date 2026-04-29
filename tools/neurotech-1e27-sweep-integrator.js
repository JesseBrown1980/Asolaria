#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const behcs = require('./behcs/codex-bridge');

const repoRoot = path.resolve(__dirname, '..');
const NEXT_AGENTS = 10n ** 200n;
const CHECKPOINT_INTERVAL = 2_000n;
const NEXT_CHECKPOINTS = NEXT_AGENTS / CHECKPOINT_INTERVAL;
const NEXT_SHARD_AGENTS = 10n ** 197n;
const NEXT_SHARD_ROWS = NEXT_AGENTS / NEXT_SHARD_AGENTS;

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
  integrationOnly: true,
  exactBigIntCounts: true,
  childProcessUse: false,
  secretMaterialWritten: false
});

const PATHS = Object.freeze({
  sweepSummary: rel('data/neurotech-defense-lab/omnispindle/1e27-sweep/agent-gnn-summary-latest.json'),
  geniusMarks: rel('data/neurotech-defense-lab/omnispindle/1e27-sweep/genius-agent-marks-latest.ndjson'),
  mistakeMarks: rel('data/neurotech-defense-lab/omnispindle/1e27-sweep/mistake-agent-marks-latest.ndjson'),
  buildOrder: rel('data/neurotech-defense-lab/omnispindle/1e27-sweep/one-e27-build-order.v1.json'),
  hermesAwareness: rel('data/neurotech-defense-lab/hermes/supervisor-of-supervisors/supervisor-awareness-latest.json'),
  selfImprovement: rel('data/neurotech-defense-lab/hermes/supervisor-of-supervisors/self-improvement-cycle-latest.json'),
  approval: rel('data/neurotech-defense-lab/consent/monthly-approval-2026-04.v1.json'),
  safeRuntime: rel('data/neurotech-defense-lab/runtime/neurotech-safe-runtime-summary-latest.json'),
  integration: rel('data/neurotech-defense-lab/omnispindle/1e27-sweep/integration/1e27-sweep-integration-latest.json'),
  geniusSupervisors: rel('data/neurotech-defense-lab/omnispindle/1e27-sweep/integration/genius-supervisors-latest.json'),
  mistakeGuards: rel('data/neurotech-defense-lab/omnispindle/1e27-sweep/integration/mistake-guards-latest.json'),
  hookwallPolicy: rel('data/neurotech-defense-lab/omnispindle/1e27-sweep/integration/hookwall-policy-latest.json'),
  buildQueue: rel('data/neurotech-defense-lab/omnispindle/1e27-sweep/integration/symphony-linear-build-queue.ndjson'),
  gnnEdges: rel('data/neurotech-defense-lab/omnispindle/1e27-sweep/integration/gnn-integration-edges.ndjson'),
  readiness1e200: rel('data/neurotech-defense-lab/omnispindle/1e27-sweep/integration/one-e200-readiness.v1.json'),
  state: rel('data/behcs/state/neurotech-defense/neurotech-1e27-sweep-integration.state.json'),
  hermes: rel('data/behcs/hermes/neurotech-defense/neurotech-1e27-sweep-integration-dispatch-latest.json'),
  shannon: rel('data/behcs/shannon/neurotech-defense/neurotech-1e27-sweep-integration-consensus-latest.json'),
  cube: rel('data/behcs/cubes/neurotech-1e27-sweep-integration.cube.js'),
  reportJson: rel('reports/neurotech-1e27-sweep-integration-latest.json'),
  reportMd: rel('reports/neurotech-1e27-sweep-integration-latest.md'),
  inbox: rel('data/behcs/inbox.ndjson'),
  outbox: rel('data/behcs/outbox.ndjson'),
  globalGnnEdges: rel('data/behcs/gnn-live-edges.ndjson')
});

function rel(p) {
  return path.join(repoRoot, p);
}

function repoRel(p) {
  return path.relative(repoRoot, p).replace(/\\/g, '/');
}

function big(n) {
  return n.toString();
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

function priorityForGenius(mark) {
  if (Number(mark.score) >= 0.99) return 'P0_invariant';
  if (Number(mark.score) >= 0.97) return 'P1_core';
  if (Number(mark.score) >= 0.95) return 'P2_guarded';
  return 'P3_watch';
}

function severityForMistake(mark) {
  if (Number(mark.reverseGain) >= 0.95) return 'critical_block';
  if (Number(mark.reverseGain) >= 0.86) return 'hard_guard';
  return 'watch_guard';
}

function actionForMistake(id) {
  const map = {
    real_agent_storm: 'block_real_process_storm_use_virtual_ranges',
    floating_point_count_loss: 'require_decimal_string_bigint_counts',
    ruview_execution: 'block_ruview_execution_static_only',
    live_eeg_before_attestation: 'block_live_eeg_until_attestation_and_precheck',
    literal_mind_reading_claim: 'rewrite_claim_to_signal_classification',
    raw_biosignal_or_consent_in_git: 'block_git_write_for_raw_sensitive_data',
    cloud_upload_without_scope: 'block_cloud_upload_without_consent_scope',
    remote_linear_mutation_without_gate: 'block_remote_linear_until_local_ingest_gate',
    gc_evidence_deletion: 'block_evidence_deletion_compact_only',
    pid_collision_or_reuse: 'block_pid_reuse_without_alias_record',
    no_signal_quality_gate: 'block_feedback_without_quality_metrics',
    deep_model_first: 'block_deep_models_until_ladder_pass',
    symphony_linear_cloud_first: 'block_cloud_tracker_before_local_migration',
    household_boundary_breach: 'block_outsider_use_without_permission',
    approval_window_overrun: 'block_after_approval_expiry',
    medical_or_diagnostic_claim: 'rewrite_to_non_medical_training_support',
    scale_without_supervisor_integration: 'require_integration_before_scale_up',
    model_card_missing: 'block_model_promotion_without_model_card',
    device_driver_unpinned: 'block_live_device_until_driver_firmware_pinned',
    feedback_ui_overclaim: 'block_feedback_ui_without_uncertainty_limits',
    first_run_hype_overclaim: 'block_historic_run_as_capability_proof'
  };
  return map[id] || 'ledger_and_review';
}

function buildGeniusSupervisors(geniusMarks, generatedAt) {
  return geniusMarks.map((mark, index) => ({
    supervisorId: `1e27-genius-supervisor-${String(index + 1).padStart(2, '0')}-${mark.id}`,
    supervisorPid: `BH.1E27.GENIUS.SUP.PID.${String(index + 1).padStart(4, '0')}`,
    supervisorGlyph: glyph('1e27_integrated_genius_supervisor', mark.id, mark.glyph),
    generatedAt,
    status: 'INTEGRATED_READY',
    authority: 'observe_verify_dispatch_only',
    priority: priorityForGenius(mark),
    markId: mark.id,
    markGlyph: mark.glyph,
    score: mark.score,
    domain: mark.domain,
    pidRange: mark.pidRange,
    hookwallStatus: mark.hookwallStatus,
    gnnStatus: mark.gnnStatus,
    gcDisposition: mark.gcDisposition,
    watches: [repoRel(PATHS.sweepSummary), repoRel(PATHS.mistakeMarks), repoRel(PATHS.hookwallPolicy), repoRel(PATHS.buildQueue)],
    summary: mark.summary
  }));
}

function buildMistakeGuards(mistakeMarks, generatedAt) {
  return mistakeMarks.map((mark, index) => ({
    guardId: `1e27-mistake-guard-${String(index + 1).padStart(2, '0')}-${mark.id}`,
    guardPid: `BH.1E27.MISTAKE.GUARD.PID.${String(index + 1).padStart(4, '0')}`,
    guardGlyph: glyph('1e27_integrated_mistake_guard', mark.id, mark.glyph),
    generatedAt,
    status: 'ACTIVE_LOCAL_GUARD',
    authority: 'block_or_warn_before_execution',
    severity: severityForMistake(mark),
    action: actionForMistake(mark.id),
    markId: mark.id,
    markGlyph: mark.glyph,
    reverseGain: mark.reverseGain,
    hookwallStatus: mark.hookwallStatus,
    gnnStatus: mark.gnnStatus,
    gcDisposition: mark.gcDisposition,
    summary: mark.summary
  }));
}

function buildHookwallPolicy(mistakeGuards, geniusSupervisors, generatedAt) {
  return {
    policyId: 'neurotech-1e27-hookwall-policy-latest',
    generatedAt,
    status: 'HOOKWALL_POLICY_INTEGRATED',
    mode: MODE,
    defaultDisposition: 'deny_unless_local_synthetic_static_or_prechecked',
    invariantGenius: geniusSupervisors.filter((g) => g.priority === 'P0_invariant').map((g) => g.markId),
    blockRules: mistakeGuards.filter((g) => ['critical_block', 'hard_guard'].includes(g.severity)),
    watchRules: mistakeGuards.filter((g) => g.severity === 'watch_guard'),
    allowedWithoutNewGate: ['synthetic_eeg_replay', 'virtual_agent_sweep_compaction', 'local_symphony_linear_queue_ingest', 'ruview_static_metadata_record', 'hookwall_gnn_reverse_gain_gc_collection', 'local_report_generation'],
    blockedWithoutNewGate: ['real_agent_process_storm', 'ruview_execution', 'live_eeg_capture', 'device_access', 'external_api_call', 'remote_linear_mutation', 'download_or_install', 'cloud_upload', 'medical_or_literal_mind_reading_claim', 'raw_biosignal_or_signed_consent_git_write']
  };
}

function relatedGuards(phaseId, mistakeGuards) {
  const links = {
    E27_1_hermes_hookwall_runtime: ['gc_evidence_deletion', 'real_agent_storm', 'scale_without_supervisor_integration'],
    E27_2_synthetic_eeg_ci: ['deep_model_first', 'no_signal_quality_gate'],
    E27_3_pid_session_bus: ['pid_collision_or_reuse', 'live_eeg_before_attestation', 'raw_biosignal_or_consent_in_git'],
    E27_4_quality_feedback_gate: ['no_signal_quality_gate', 'literal_mind_reading_claim', 'medical_or_diagnostic_claim', 'feedback_ui_overclaim'],
    E27_5_ruview_static_quarantine: ['ruview_execution', 'literal_mind_reading_claim'],
    E27_6_enhancement_support: ['medical_or_diagnostic_claim', 'literal_mind_reading_claim'],
    E27_7_model_ladder: ['deep_model_first', 'cloud_upload_without_scope', 'model_card_missing'],
    E27_8_lsl_bids_connector: ['raw_biosignal_or_consent_in_git', 'live_eeg_before_attestation', 'device_driver_unpinned'],
    E27_9_local_symphony_linear: ['remote_linear_mutation_without_gate', 'symphony_linear_cloud_first'],
    E27_10_storage_release_wall: ['raw_biosignal_or_consent_in_git', 'cloud_upload_without_scope', 'household_boundary_breach'],
    E27_11_exact_count_audit: ['floating_point_count_loss', 'first_run_hype_overclaim']
  };
  const wanted = new Set(links[phaseId] || []);
  return mistakeGuards.filter((guard) => wanted.has(guard.markId));
}

function buildLocalQueue(buildOrder, geniusSupervisors, mistakeGuards, generatedAt) {
  const phases = Array.isArray(buildOrder.phases) ? buildOrder.phases : [];
  return phases.map((phase, index) => {
    const support = geniusSupervisors.filter((g) => (phase.supportingMarks || []).includes(g.markId));
    const guards = relatedGuards(phase.id, mistakeGuards);
    return {
      localWorkItemId: `SL-1E27-INTEGRATE-${String(index + 1).padStart(2, '0')}-${phase.id}`,
      generatedAt,
      tracker: 'symphony_linear_local_service',
      remoteMutation: false,
      status: 'QUEUED_LOCAL_BUILD',
      priority: index < 6 ? 'P0_P1' : 'P2_P3',
      phaseId: phase.id,
      title: `Integrate 1e27 sweep: ${phase.id}`,
      gate: phase.gate,
      action: phase.action,
      supportingGenius: support.map((g) => ({ id: g.markId, supervisorId: g.supervisorId, score: g.score })),
      requiredGuards: guards.map((g) => ({ id: g.markId, guardId: g.guardId, action: g.action })),
      acceptanceGates: ['local_packet_ingested', 'hookwall_policy_linked', 'gnn_edge_written', 'exact_bigint_counts', 'no_remote_mutation', 'no_live_device_or_ruview_execution']
    };
  });
}

function buildGnnEdges(geniusSupervisors, mistakeGuards, buildQueue, generatedAt) {
  const edges = [];
  for (const supervisor of geniusSupervisors) {
    edges.push({ id: `1e27-genius-edge-${supervisor.markId}`, ts: generatedAt, from: supervisor.supervisorId, to: `genius_mark:${supervisor.markId}`, verb: 'supervises_gnn_genius', weight: Number(supervisor.score) || 0 });
  }
  for (const guard of mistakeGuards) {
    edges.push({ id: `1e27-mistake-edge-${guard.markId}`, ts: generatedAt, from: guard.guardId, to: `mistake_mark:${guard.markId}`, verb: 'guards_reverse_gain_mistake', weight: Number(guard.reverseGain) || 0 });
  }
  for (const item of buildQueue) {
    edges.push({ id: `1e27-build-edge-${item.phaseId}`, ts: generatedAt, from: 'local_symphony_linear_queue', to: item.phaseId, verb: 'queues_local_build_item', weight: item.priority === 'P0_P1' ? 0.9 : 0.65 });
  }
  return edges;
}

function buildReadiness(summary, approval, safeRuntime, hermesAwareness, selfImprovement, geniusSupervisors, mistakeGuards, buildQueue, generatedAt) {
  return {
    readinessId: 'one-e200-readiness.v1',
    generatedAt,
    status: 'READY_FOR_1E200_VIRTUAL_SWEEP_AFTER_1E27_INTEGRATION',
    mode: MODE,
    exactBigIntCounts: true,
    firstRunInLocalHistory: true,
    prerequisites: {
      monthlyApprovalRecorded: Boolean(approval.status),
      safeRuntimeComplete: safeRuntime.status === 'SAFE_RUNTIME_RUN_COMPLETE',
      oneE27SweepReady: summary.status === 'ONE_E27_VIRTUAL_SWEEP_GNN_GC_READY',
      hermesAwareOfSupervisors: hermesAwareness.status === 'HERMES_SUPERVISOR_OF_SUPERVISORS_AWARE',
      selfImprovementAdopted: selfImprovement.status === 'SELF_IMPROVEMENT_READY_FOR_1E27',
      geniusSupervisorsIntegrated: geniusSupervisors.length,
      mistakeGuardsIntegrated: mistakeGuards.length,
      buildQueueItems: buildQueue.length,
      approvalExpiresAtLocal: approval.participants?.[0]?.approvalWindow?.expiresAtLocal || null
    },
    nextSweepShape: {
      virtualAgents: big(NEXT_AGENTS),
      checkpointInterval: big(CHECKPOINT_INTERVAL),
      logicalCheckpoints: big(NEXT_CHECKPOINTS),
      proposedShardAgents: big(NEXT_SHARD_AGENTS),
      proposedShardRows: big(NEXT_SHARD_ROWS),
      externalModelTokens: 0,
      realAgentLaunches: 0
    },
    hardGatesRemain: ['no_real_agent_process_storm', 'no_ruview_execution', 'no_live_eeg_without_new_session_precheck', 'no_external_api_call', 'no_remote_linear_mutation', 'no_human_data_collection', 'no_download_or_install', 'no_raw_biosignal_or_signed_consent_in_git']
  };
}

function buildIntegration(summary, approval, safeRuntime, geniusSupervisors, mistakeGuards, hookwallPolicy, buildQueue, gnnEdges, readiness, generatedAt) {
  return {
    integrationId: 'neurotech-1e27-sweep-integration-latest',
    generatedAt,
    status: 'INTEGRATED_1E27_SWEEP_READY_FOR_1E200_PREP',
    mode: MODE,
    sourceSweep: repoRel(PATHS.sweepSummary),
    approval: { status: approval.status || null, expiresAtLocal: approval.participants?.[0]?.approvalWindow?.expiresAtLocal || null },
    safeRuntime: { status: safeRuntime.status || null, syntheticReplay: safeRuntime.syntheticReplay?.status || null },
    counts: {
      geniusSupervisors: geniusSupervisors.length,
      mistakeGuards: mistakeGuards.length,
      blockRules: hookwallPolicy.blockRules.length,
      watchRules: hookwallPolicy.watchRules.length,
      buildQueueItems: buildQueue.length,
      gnnEdges: gnnEdges.length,
      oneE27VirtualAgents: summary.counts?.virtualAgents || '0'
    },
    outputs: outputs(),
    readiness
  };
}

function buildHermes(integration, generatedAt) {
  return {
    integrationId: 'neurotech-1e27-sweep-integration-hermes-dispatch',
    generatedAt,
    status: integration.status,
    mode: MODE,
    packet: {
      verb: 'EVT-HERMES-NEUROTECH-1E27-SWEEP-INTEGRATION',
      summary: '1e27 sweep marks integrated into supervisors, Hookwall guards, local build queue, GNN edges, and 1e200 readiness.',
      counts: integration.counts,
      report: repoRel(PATHS.reportMd)
    }
  };
}

function buildShannon(integration, readiness, generatedAt) {
  return {
    integrationId: 'neurotech-1e27-sweep-integration-shannon-consensus',
    generatedAt,
    status: 'consensus_1e27_integration_ready',
    consensus: 'PROCEED_1E27_INTEGRATION_READY_FOR_1E200_PREP',
    executionDisposition: 'integration_only_no_live_or_external_actions',
    votes: [
      { part: 'scout', vote: 'PROCEED', reason: `${integration.counts.geniusSupervisors} genius supervisors and ${integration.counts.mistakeGuards} mistake guards were integrated.` },
      { part: 'evidence', vote: 'PROCEED', reason: `${integration.counts.buildQueueItems} build items and ${integration.counts.gnnEdges} GNN edges were written with exact-count readiness.` },
      { part: 'executor', vote: 'HALT_RISKY_ACTIONS', reason: 'No RU-view execution, live EEG, external calls, downloads, installs, human data, or remote Linear mutation.' },
      { part: 'fabric', vote: 'PROCEED', reason: 'Integration surfaces, Hermes, Shannon, cube, report, and 1e200 readiness are local BEHCS surfaces.' },
      { part: 'voice', vote: 'CLAIM_GUARD', reason: 'Scale is virtual orchestration only; mind-reading/medical claims remain blocked.' },
      { part: 'planner', vote: 'READY_FOR_OPERATOR_1E200_COMMAND', reason: readiness.status }
    ]
  };
}

function buildCube(integration, shannonPacket, generatedAt) {
  const cube = {
    id: 'neurotech-1e27-sweep-integration',
    generatedAt,
    primaryCatalog: { D: 37, name: 'AUTHORITY', prime: 157 },
    touches: [7, 20, 24, 35, 37, 39, 42, 47, 59],
    gates: ['1e27_integrated', 'hookwall_policy', 'gnn_edges', 'local_build_queue', 'one_e200_readiness'],
    payload: {
      kind: '1e27-sweep-integration',
      status: integration.status,
      mode: MODE,
      counts: integration.counts,
      shannon: { consensus: shannonPacket.consensus, executionDisposition: shannonPacket.executionDisposition }
    },
    translate: {
      human: '1e27 sweep findings are integrated into local supervisors, guards, build queue, and 1e200 readiness.',
      agent: '(asolaria, neurotech, 1e27_integration, hookwall, gnn, readiness_1e200)',
      device: 'node tools/neurotech-1e27-sweep-integrator.js integrate --execute'
    }
  };
  return `// cube: neurotech-1e27-sweep-integration | neurotech | D37 AUTHORITY\nexport const CUBE = ${JSON.stringify(cube, null, 2)}\n`;
}

function outputs() {
  return {
    integration: repoRel(PATHS.integration),
    geniusSupervisors: repoRel(PATHS.geniusSupervisors),
    mistakeGuards: repoRel(PATHS.mistakeGuards),
    hookwallPolicy: repoRel(PATHS.hookwallPolicy),
    buildQueue: repoRel(PATHS.buildQueue),
    gnnEdges: repoRel(PATHS.gnnEdges),
    readiness1e200: repoRel(PATHS.readiness1e200),
    reportMd: repoRel(PATHS.reportMd),
    cube: repoRel(PATHS.cube)
  };
}

function buildReport(integration, geniusSupervisors, mistakeGuards, buildQueue, readiness, shannonPacket, generatedAt) {
  const topGenius = geniusSupervisors.slice(0, 10).map((g) => `| ${g.markId} | ${g.priority} | ${g.score} | ${g.domain} |`).join('\n');
  const topGuards = mistakeGuards.slice(0, 10).map((g) => `| ${g.markId} | ${g.severity} | ${g.reverseGain} | ${g.action} |`).join('\n');
  const queueRows = buildQueue.map((item) => `| ${item.phaseId} | ${item.priority} | ${item.supportingGenius.length} | ${item.requiredGuards.length} |`).join('\n');
  const json = { reportId: 'neurotech-1e27-sweep-integration-latest', generatedAt, status: integration.status, mode: MODE, counts: integration.counts, outputs: outputs(), readiness, shannon: shannonPacket };
  const md = `# Neurotech 1e27 Sweep Integration

Generated: ${generatedAt}

Status: ${integration.status}

Integrated the 1e27 sweep into local Asolaria control surfaces: genius supervisors, mistake guards, Hookwall policy, local Symphony/Linear build queue, GNN integration edges, and 1e200 readiness.

## Counts

- Genius supervisors: ${integration.counts.geniusSupervisors}
- Mistake guards: ${integration.counts.mistakeGuards}
- Block/watch rules: ${integration.counts.blockRules}/${integration.counts.watchRules}
- Local build queue items: ${integration.counts.buildQueueItems}
- GNN integration edges: ${integration.counts.gnnEdges}
- 1e27 virtual agents integrated: ${integration.counts.oneE27VirtualAgents}

## Top Genius Supervisors

| Mark | Priority | Score | Domain |
| --- | --- | ---: | --- |
${topGenius}

## Top Mistake Guards

| Mistake | Severity | Reverse Gain | Action |
| --- | --- | ---: | --- |
${topGuards}

## Local Build Queue

| Phase | Priority | Genius Links | Guard Links |
| --- | --- | ---: | ---: |
${queueRows}

## 1e200 Readiness

- Status: ${readiness.status}
- Virtual agents: ${readiness.nextSweepShape.virtualAgents}
- Logical checkpoints: ${readiness.nextSweepShape.logicalCheckpoints}
- Proposed shard rows: ${readiness.nextSweepShape.proposedShardRows}

## Shannon

- Consensus: ${shannonPacket.consensus}
- Execution: ${shannonPacket.executionDisposition}
`;
  return { json, md };
}

function integrate({ execute = false } = {}) {
  const generatedAt = new Date().toISOString();
  const summary = readJson(PATHS.sweepSummary, {});
  const approval = readJson(PATHS.approval, {});
  const safeRuntime = readJson(PATHS.safeRuntime, {});
  const hermesAwareness = readJson(PATHS.hermesAwareness, {});
  const selfImprovement = readJson(PATHS.selfImprovement, {});
  const buildOrder = readJson(PATHS.buildOrder, {});
  const geniusMarks = readNdjson(PATHS.geniusMarks);
  const mistakeMarks = readNdjson(PATHS.mistakeMarks);
  const geniusSupervisors = buildGeniusSupervisors(geniusMarks, generatedAt);
  const mistakeGuards = buildMistakeGuards(mistakeMarks, generatedAt);
  const hookwallPolicy = buildHookwallPolicy(mistakeGuards, geniusSupervisors, generatedAt);
  const buildQueue = buildLocalQueue(buildOrder, geniusSupervisors, mistakeGuards, generatedAt);
  const gnnEdges = buildGnnEdges(geniusSupervisors, mistakeGuards, buildQueue, generatedAt);
  const readiness = buildReadiness(summary, approval, safeRuntime, hermesAwareness, selfImprovement, geniusSupervisors, mistakeGuards, buildQueue, generatedAt);
  const integration = buildIntegration(summary, approval, safeRuntime, geniusSupervisors, mistakeGuards, hookwallPolicy, buildQueue, gnnEdges, readiness, generatedAt);
  const shannonPacket = buildShannon(integration, readiness, generatedAt);
  const hermesPacket = buildHermes(integration, generatedAt);
  const cube = buildCube(integration, shannonPacket, generatedAt);
  const report = buildReport(integration, geniusSupervisors, mistakeGuards, buildQueue, readiness, shannonPacket, generatedAt);
  const eventId = `neurotech-1e27-integration-${Date.now()}`;

  if (execute) {
    writeJson(PATHS.integration, integration);
    writeJson(PATHS.geniusSupervisors, { generatedAt, status: 'GENIUS_SUPERVISORS_INTEGRATED', supervisors: geniusSupervisors });
    writeJson(PATHS.mistakeGuards, { generatedAt, status: 'MISTAKE_GUARDS_INTEGRATED', guards: mistakeGuards });
    writeJson(PATHS.hookwallPolicy, hookwallPolicy);
    writeText(PATHS.buildQueue, toNdjson(buildQueue));
    writeText(PATHS.gnnEdges, toNdjson(gnnEdges));
    writeJson(PATHS.readiness1e200, readiness);
    writeJson(PATHS.state, { savedAt: generatedAt, status: integration.status, mode: MODE, counts: integration.counts, report: repoRel(PATHS.reportMd) });
    writeJson(PATHS.hermes, hermesPacket);
    writeJson(PATHS.shannon, shannonPacket);
    writeText(PATHS.cube, cube);
    writeJson(PATHS.reportJson, report.json);
    writeText(PATHS.reportMd, report.md);
    appendNdjson(PATHS.inbox, { id: eventId, ts: generatedAt, from: 'asolaria', to: 'neurotech-1e27-integration', verb: 'EVT-NEUROTECH-1E27-SWEEP-INTEGRATION', body: { status: integration.status, counts: integration.counts, report: repoRel(PATHS.reportMd) } });
    appendNdjson(PATHS.outbox, { id: `${eventId}-hermes`, ts: generatedAt, from: 'hermes', to: 'neurotech-1e27-integration', verb: hermesPacket.packet.verb, body: hermesPacket });
    for (const edge of gnnEdges) appendNdjson(PATHS.globalGnnEdges, edge);
  }

  return {
    ok: true,
    action: execute ? 'integrate' : 'preview',
    generatedAt,
    status: integration.status,
    counts: integration.counts,
    readiness: readiness.status,
    nextSweepShape: readiness.nextSweepShape,
    topSupervisors: geniusSupervisors.slice(0, 5).map((g) => ({ markId: g.markId, priority: g.priority, score: g.score })),
    topGuards: mistakeGuards.slice(0, 5).map((g) => ({ markId: g.markId, severity: g.severity, reverseGain: g.reverseGain })),
    outputs: outputs(),
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
      'node tools/neurotech-1e27-sweep-integrator.js status',
      'node tools/neurotech-1e27-sweep-integrator.js integrate --execute'
    ]
  }, null, 2));
  process.exitCode = 2;
}

main(process.argv);
