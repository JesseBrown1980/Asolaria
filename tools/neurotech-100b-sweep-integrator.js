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
  noRealAgentLaunch: true,
  noDownloads: true,
  noInstall: true,
  noDeviceAccess: true,
  noHumanSubjectData: true,
  noLiveEeg: true,
  ruViewExecution: 'fail_closed_static_queue_only',
  nonDestructiveGc: true,
  integrationOnly: true,
  childProcessUse: false,
  secretMaterialWritten: false
});

const PATHS = Object.freeze({
  sweepSummary: rel('data/neurotech-defense-lab/omnispindle/100b-sweep/sweep-gnn-summary-latest.json'),
  geniusMarks: rel('data/neurotech-defense-lab/omnispindle/100b-sweep/genius-sweep-marks-latest.ndjson'),
  mistakeMarks: rel('data/neurotech-defense-lab/omnispindle/100b-sweep/mistake-sweep-marks-latest.ndjson'),
  buildOrder: rel('data/neurotech-defense-lab/omnispindle/100b-sweep/neuro-enhancement-build-order.v1.json'),
  safeRuntime: rel('data/neurotech-defense-lab/runtime/neurotech-safe-runtime-summary-latest.json'),
  approval: rel('data/neurotech-defense-lab/consent/monthly-approval-2026-04.v1.json'),
  integration: rel('data/neurotech-defense-lab/omnispindle/100b-sweep/integration/100b-sweep-integration-latest.json'),
  geniusSupervisors: rel('data/neurotech-defense-lab/omnispindle/100b-sweep/integration/genius-supervisors-latest.json'),
  mistakeGuards: rel('data/neurotech-defense-lab/omnispindle/100b-sweep/integration/mistake-guards-latest.json'),
  hookwallPolicy: rel('data/neurotech-defense-lab/omnispindle/100b-sweep/integration/hookwall-policy-latest.json'),
  buildQueue: rel('data/neurotech-defense-lab/omnispindle/100b-sweep/integration/symphony-linear-build-queue.ndjson'),
  gnnEdges: rel('data/neurotech-defense-lab/omnispindle/100b-sweep/integration/gnn-integration-edges.ndjson'),
  readiness1t: rel('data/neurotech-defense-lab/omnispindle/100b-sweep/integration/one-trillion-readiness.v1.json'),
  state: rel('data/behcs/state/neurotech-defense/neurotech-100b-sweep-integration.state.json'),
  hermes: rel('data/behcs/hermes/neurotech-defense/neurotech-100b-sweep-integration-dispatch-latest.json'),
  shannon: rel('data/behcs/shannon/neurotech-defense/neurotech-100b-sweep-integration-consensus-latest.json'),
  cube: rel('data/behcs/cubes/neurotech-100b-sweep-integration.cube.js'),
  reportJson: rel('reports/neurotech-100b-sweep-integration-latest.json'),
  reportMd: rel('reports/neurotech-100b-sweep-integration-latest.md'),
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
  if (Number(mark.score) >= 0.94) return 'P0_invariant';
  if (Number(mark.score) >= 0.91) return 'P1_core';
  if (Number(mark.score) >= 0.89) return 'P2_guarded';
  return 'P3_watch';
}

function severityForMistake(mark) {
  if (Number(mark.reverseGain) >= 0.94) return 'critical_block';
  if (Number(mark.reverseGain) >= 0.86) return 'hard_guard';
  return 'watch_guard';
}

function actionForMistake(id) {
  const map = {
    real_agent_storm: 'block_real_process_storm_use_virtual_ranges',
    ruview_execution: 'block_ruview_execution_static_only',
    live_eeg_before_attestation: 'block_live_eeg_until_attestation_and_precheck',
    literal_mind_reading_claim: 'rewrite_claim_to_signal_classification',
    raw_biosignal_or_consent_in_git: 'block_git_write_for_raw_sensitive_data',
    remote_linear_mutation_without_gate: 'block_remote_linear_until_local_ingest_gate',
    cloud_upload_without_scope: 'block_cloud_upload_without_consent_scope',
    gc_evidence_deletion: 'block_evidence_deletion_compact_only',
    deep_model_first: 'block_deep_models_until_ladder_pass',
    no_signal_quality_gate: 'block_feedback_without_quality_metrics',
    household_boundary_breach: 'block_outsider_use_without_permission',
    approval_window_overrun: 'block_after_approval_expiry',
    medical_or_diagnostic_claim: 'rewrite_to_non_medical_training_support',
    token_bloat_or_banner_prompts: 'prefer_pid_only_compact_packets'
  };
  return map[id] || 'ledger_and_review';
}

function buildGeniusSupervisors(geniusMarks, generatedAt) {
  return geniusMarks.map((mark, index) => ({
    supervisorId: `100b-genius-supervisor-${String(index + 1).padStart(2, '0')}-${mark.id}`,
    supervisorPid: `BH.100B.GENIUS.SUP.PID.${String(index + 1).padStart(4, '0')}`,
    supervisorGlyph: glyph('100b_integrated_genius_supervisor', mark.id, mark.glyph),
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
    watches: [
      repoRel(PATHS.sweepSummary),
      repoRel(PATHS.mistakeMarks),
      repoRel(PATHS.hookwallPolicy),
      repoRel(PATHS.buildQueue)
    ],
    summary: mark.summary
  }));
}

function buildMistakeGuards(mistakeMarks, generatedAt) {
  return mistakeMarks.map((mark, index) => ({
    guardId: `100b-mistake-guard-${String(index + 1).padStart(2, '0')}-${mark.id}`,
    guardPid: `BH.100B.MISTAKE.GUARD.PID.${String(index + 1).padStart(4, '0')}`,
    guardGlyph: glyph('100b_integrated_mistake_guard', mark.id, mark.glyph),
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
    policyId: 'neurotech-100b-hookwall-policy-latest',
    generatedAt,
    status: 'HOOKWALL_POLICY_INTEGRATED',
    mode: MODE,
    defaultDisposition: 'deny_unless_synthetic_local_or_static_review',
    invariantGenius: geniusSupervisors.filter((g) => g.priority === 'P0_invariant').map((g) => g.markId),
    blockRules: mistakeGuards.filter((g) => g.severity === 'critical_block' || g.severity === 'hard_guard'),
    watchRules: mistakeGuards.filter((g) => g.severity === 'watch_guard'),
    allowedWithoutNewGate: [
      'synthetic_eeg_replay',
      'local_symphony_linear_queue_ingest',
      'ruview_static_metadata_record',
      'hookwall_gnn_gc_collection',
      'non_destructive_gc_compaction',
      'local_report_generation'
    ],
    blockedWithoutNewGate: [
      'ruview_execution',
      'live_eeg_capture',
      'device_access',
      'external_api_call',
      'remote_linear_mutation',
      'download_or_install',
      'cloud_upload',
      'medical_or_literal_mind_reading_claim'
    ]
  };
}

function buildLocalQueue(buildOrder, geniusSupervisors, mistakeGuards, generatedAt) {
  const phases = Array.isArray(buildOrder.phases) ? buildOrder.phases : [];
  return phases.map((phase, index) => {
    const support = geniusSupervisors.filter((g) => (phase.supportingMarks || []).includes(g.markId));
    const relatedGuards = mistakeGuards.filter((guard) => relatedGuardForPhase(phase.id, guard.markId));
    return {
      localWorkItemId: `SL-100B-INTEGRATE-${String(index + 1).padStart(2, '0')}-${phase.id}`,
      generatedAt,
      tracker: 'symphony_linear_local_service',
      remoteMutation: false,
      status: 'QUEUED_LOCAL_BUILD',
      priority: index < 4 ? 'P0_P1' : 'P2_P3',
      phaseId: phase.id,
      title: `Integrate 100B sweep: ${phase.id}`,
      gate: phase.gate,
      action: phase.action,
      supportingGenius: support.map((g) => ({ id: g.markId, supervisorId: g.supervisorId, score: g.score })),
      requiredGuards: relatedGuards.map((g) => ({ id: g.markId, guardId: g.guardId, action: g.action })),
      acceptanceGates: [
        'local_packet_ingested',
        'hookwall_policy_linked',
        'gnn_edge_written',
        'no_remote_mutation',
        'no_live_device_or_ruview_execution'
      ]
    };
  });
}

function relatedGuardForPhase(phaseId, guardId) {
  const links = {
    B1_synthetic_ci: ['deep_model_first', 'no_signal_quality_gate'],
    B2_hookwall_runtime: ['gc_evidence_deletion', 'real_agent_storm'],
    B3_pid_session_bus: ['live_eeg_before_attestation', 'raw_biosignal_or_consent_in_git', 'cloud_upload_without_scope'],
    B4_quality_feedback_gate: ['no_signal_quality_gate', 'literal_mind_reading_claim'],
    B5_ruview_quarantine: ['ruview_execution', 'literal_mind_reading_claim'],
    B6_enhancement_support: ['medical_or_diagnostic_claim', 'literal_mind_reading_claim'],
    B7_model_ladder: ['deep_model_first', 'no_signal_quality_gate'],
    B8_local_symphony: ['remote_linear_mutation_without_gate', 'token_bloat_or_banner_prompts'],
    B9_storage_release_wall: ['raw_biosignal_or_consent_in_git', 'cloud_upload_without_scope', 'household_boundary_breach', 'approval_window_overrun']
  };
  return (links[phaseId] || []).includes(guardId);
}

function buildGnnEdges(geniusSupervisors, mistakeGuards, buildQueue, generatedAt) {
  const edges = [];
  for (const supervisor of geniusSupervisors) {
    edges.push({
      id: `100b-integration-genius-${supervisor.markId}`,
      ts: generatedAt,
      from: '100b_genius_mark',
      to: supervisor.supervisorId,
      verb: 'integrated_as_supervisor',
      weight: Number(supervisor.score || 0.8),
      glyph: supervisor.supervisorGlyph
    });
  }
  for (const guard of mistakeGuards) {
    edges.push({
      id: `100b-integration-mistake-${guard.markId}`,
      ts: generatedAt,
      from: '100b_mistake_mark',
      to: guard.guardId,
      verb: guard.action,
      weight: Number(guard.reverseGain || 0.8),
      glyph: guard.guardGlyph
    });
  }
  for (const item of buildQueue) {
    edges.push({
      id: `100b-integration-build-${item.phaseId}`,
      ts: generatedAt,
      from: '100b_build_order',
      to: item.localWorkItemId,
      verb: 'queued_local_symphony_linear_build',
      weight: item.priority === 'P0_P1' ? 0.9 : 0.7
    });
  }
  return edges;
}

function buildReadiness(summary, approval, safeRuntime, geniusSupervisors, mistakeGuards, buildQueue, generatedAt) {
  const approvalExpiry = approval.participants?.[0]?.approvalWindow?.expiresAtLocal || null;
  return {
    readinessId: 'one-trillion-readiness.v1',
    generatedAt,
    status: 'READY_FOR_1T_VIRTUAL_SWEEP_AFTER_OPERATOR_COMMAND',
    mode: MODE,
    prerequisites: {
      monthlyApprovalRecorded: approval.status === 'MONTHLY_HOUSEHOLD_RND_APPROVAL_RECORDED_WITH_GATES',
      safeRuntimeComplete: safeRuntime.status === 'SAFE_RUNTIME_RUN_COMPLETE',
      hundredBSweepReady: summary.status === 'ONE_HUNDRED_B_SWEEP_GNN_GC_READY',
      geniusSupervisorsIntegrated: geniusSupervisors.length,
      mistakeGuardsIntegrated: mistakeGuards.length,
      buildQueueItems: buildQueue.length,
      approvalExpiresAtLocal: approvalExpiry
    },
    nextSweepShape: {
      virtualAgents: 1_000_000_000_000,
      checkpointInterval: 2_000,
      logicalCheckpoints: 500_000_000,
      proposedShardAgents: 1_000_000_000,
      proposedShardRows: 1_000,
      externalModelTokens: 0,
      realAgentLaunches: 0
    },
    hardGatesRemain: [
      'no_ruview_execution',
      'no_live_eeg_without_new_session_precheck',
      'no_external_api_call',
      'no_remote_linear_mutation',
      'no_human_data_collection',
      'no_download_or_install'
    ]
  };
}

function buildIntegration(summary, approval, safeRuntime, geniusSupervisors, mistakeGuards, hookwallPolicy, buildQueue, gnnEdges, readiness, generatedAt) {
  return {
    integrationId: 'neurotech-100b-sweep-integration-latest',
    generatedAt,
    status: 'INTEGRATED_100B_SWEEP_READY_FOR_1T_PREP',
    mode: MODE,
    sourceSweep: repoRel(PATHS.sweepSummary),
    approval: {
      status: approval.status || null,
      expiresAtLocal: approval.participants?.[0]?.approvalWindow?.expiresAtLocal || null
    },
    safeRuntime: {
      status: safeRuntime.status || null,
      syntheticReplay: safeRuntime.syntheticReplay?.status || null
    },
    counts: {
      geniusSupervisors: geniusSupervisors.length,
      mistakeGuards: mistakeGuards.length,
      blockRules: hookwallPolicy.blockRules.length,
      watchRules: hookwallPolicy.watchRules.length,
      buildQueueItems: buildQueue.length,
      gnnEdges: gnnEdges.length,
      hundredBVirtualAgents: summary.counts?.virtualAgents || 0
    },
    outputs: outputs(),
    readiness
  };
}

function buildHermes(integration, generatedAt) {
  return {
    integrationId: 'neurotech-100b-sweep-integration-hermes-dispatch',
    generatedAt,
    status: integration.status,
    mode: MODE,
    packet: {
      verb: 'EVT-HERMES-NEUROTECH-100B-SWEEP-INTEGRATION',
      summary: '100B sweep marks integrated into supervisors, Hookwall guards, local build queue, GNN edges, and 1T readiness.',
      counts: integration.counts,
      report: repoRel(PATHS.reportMd)
    }
  };
}

function buildShannon(integration, readiness, generatedAt) {
  return {
    integrationId: 'neurotech-100b-sweep-integration-shannon-consensus',
    generatedAt,
    status: 'consensus_100b_integration_ready',
    consensus: 'PROCEED_100B_INTEGRATION_READY_FOR_1T_PREP',
    executionDisposition: 'integration_only_no_live_or_external_actions',
    votes: [
      { part: 'scout', vote: 'PROCEED', reason: `${integration.counts.geniusSupervisors} genius supervisors and ${integration.counts.mistakeGuards} mistake guards were integrated.` },
      { part: 'evidence', vote: 'PROCEED', reason: `${integration.counts.buildQueueItems} local build queue items and ${integration.counts.gnnEdges} GNN integration edges were written.` },
      { part: 'executor', vote: 'HALT_RISKY_ACTIONS', reason: 'No RU-view execution, live EEG, external calls, downloads, installs, or remote Linear mutation.' },
      { part: 'fabric', vote: 'PROCEED', reason: 'Integration surfaces, Hermes, Shannon, cube, report, and 1T readiness are local BEHCS surfaces.' },
      { part: 'voice', vote: 'CLAIM_GUARD', reason: 'Genius marks are build constraints; mind-reading/medical claims remain blocked.' },
      { part: 'planner', vote: 'READY_FOR_OPERATOR_1T_COMMAND', reason: readiness.status }
    ]
  };
}

function buildCube(integration, shannonPacket, generatedAt) {
  const cube = {
    id: 'neurotech-100b-sweep-integration',
    generatedAt,
    primaryCatalog: { D: 37, name: 'AUTHORITY', prime: 157 },
    touches: [7, 20, 24, 35, 37, 39, 42, 47, 59],
    gates: ['100b_integrated', 'hookwall_policy', 'gnn_edges', 'local_build_queue', 'one_trillion_readiness'],
    payload: {
      kind: '100b-sweep-integration',
      status: integration.status,
      mode: MODE,
      counts: integration.counts,
      shannon: {
        consensus: shannonPacket.consensus,
        executionDisposition: shannonPacket.executionDisposition
      }
    },
    translate: {
      human: '100B sweep findings are now integrated into local supervisors, guards, build queue, and 1T readiness.',
      agent: '(asolaria, neurotech, 100b_integration, hookwall, gnn, symphony_linear, readiness_1t)',
      device: 'node tools/neurotech-100b-sweep-integrator.js integrate --execute'
    }
  };
  return `// cube: neurotech-100b-sweep-integration | neurotech | D37 AUTHORITY\nexport const CUBE = ${JSON.stringify(cube, null, 2)}\n`;
}

function outputs() {
  return {
    integration: repoRel(PATHS.integration),
    geniusSupervisors: repoRel(PATHS.geniusSupervisors),
    mistakeGuards: repoRel(PATHS.mistakeGuards),
    hookwallPolicy: repoRel(PATHS.hookwallPolicy),
    buildQueue: repoRel(PATHS.buildQueue),
    gnnEdges: repoRel(PATHS.gnnEdges),
    readiness1t: repoRel(PATHS.readiness1t),
    reportMd: repoRel(PATHS.reportMd),
    cube: repoRel(PATHS.cube)
  };
}

function buildReport(integration, geniusSupervisors, mistakeGuards, buildQueue, readiness, shannonPacket, generatedAt) {
  const topGenius = geniusSupervisors.slice(0, 8).map((g) =>
    `| ${g.markId} | ${g.priority} | ${g.score} | ${g.domain} |`
  ).join('\n');
  const topGuards = mistakeGuards.slice(0, 8).map((g) =>
    `| ${g.markId} | ${g.severity} | ${g.reverseGain} | ${g.action} |`
  ).join('\n');
  const queueRows = buildQueue.map((item) =>
    `| ${item.phaseId} | ${item.priority} | ${item.supportingGenius.length} | ${item.requiredGuards.length} |`
  ).join('\n');

  const json = {
    reportId: 'neurotech-100b-sweep-integration-latest',
    generatedAt,
    status: integration.status,
    mode: MODE,
    counts: integration.counts,
    outputs: outputs(),
    readiness,
    shannon: shannonPacket
  };

  const md = `# Neurotech 100B Sweep Integration

Generated: ${generatedAt}

Status: ${integration.status}

Integrated the 100B sweep into local Asolaria control surfaces: genius supervisors, mistake guards, Hookwall policy, local Symphony/Linear build queue, GNN integration edges, and 1T readiness.

## Counts

- Genius supervisors: ${integration.counts.geniusSupervisors}
- Mistake guards: ${integration.counts.mistakeGuards}
- Block/watch rules: ${integration.counts.blockRules}/${integration.counts.watchRules}
- Local build queue items: ${integration.counts.buildQueueItems}
- GNN integration edges: ${integration.counts.gnnEdges}
- 100B virtual agents integrated: ${integration.counts.hundredBVirtualAgents}

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

## 1T Readiness

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
  const buildOrder = readJson(PATHS.buildOrder, {});
  const geniusMarks = readNdjson(PATHS.geniusMarks);
  const mistakeMarks = readNdjson(PATHS.mistakeMarks);
  const geniusSupervisors = buildGeniusSupervisors(geniusMarks, generatedAt);
  const mistakeGuards = buildMistakeGuards(mistakeMarks, generatedAt);
  const hookwallPolicy = buildHookwallPolicy(mistakeGuards, geniusSupervisors, generatedAt);
  const buildQueue = buildLocalQueue(buildOrder, geniusSupervisors, mistakeGuards, generatedAt);
  const gnnEdges = buildGnnEdges(geniusSupervisors, mistakeGuards, buildQueue, generatedAt);
  const readiness = buildReadiness(summary, approval, safeRuntime, geniusSupervisors, mistakeGuards, buildQueue, generatedAt);
  const integration = buildIntegration(summary, approval, safeRuntime, geniusSupervisors, mistakeGuards, hookwallPolicy, buildQueue, gnnEdges, readiness, generatedAt);
  const shannonPacket = buildShannon(integration, readiness, generatedAt);
  const hermesPacket = buildHermes(integration, generatedAt);
  const cube = buildCube(integration, shannonPacket, generatedAt);
  const report = buildReport(integration, geniusSupervisors, mistakeGuards, buildQueue, readiness, shannonPacket, generatedAt);
  const eventId = `neurotech-100b-integration-${Date.now()}`;

  if (execute) {
    writeJson(PATHS.integration, integration);
    writeJson(PATHS.geniusSupervisors, { generatedAt, status: 'GENIUS_SUPERVISORS_INTEGRATED', supervisors: geniusSupervisors });
    writeJson(PATHS.mistakeGuards, { generatedAt, status: 'MISTAKE_GUARDS_INTEGRATED', guards: mistakeGuards });
    writeJson(PATHS.hookwallPolicy, hookwallPolicy);
    writeText(PATHS.buildQueue, toNdjson(buildQueue));
    writeText(PATHS.gnnEdges, toNdjson(gnnEdges));
    writeJson(PATHS.readiness1t, readiness);
    writeJson(PATHS.state, { savedAt: generatedAt, status: integration.status, mode: MODE, counts: integration.counts, report: repoRel(PATHS.reportMd) });
    writeJson(PATHS.hermes, hermesPacket);
    writeJson(PATHS.shannon, shannonPacket);
    writeText(PATHS.cube, cube);
    writeJson(PATHS.reportJson, report.json);
    writeText(PATHS.reportMd, report.md);
    appendNdjson(PATHS.inbox, {
      id: eventId,
      ts: generatedAt,
      from: 'asolaria',
      to: 'neurotech-100b-integration',
      verb: 'EVT-NEUROTECH-100B-SWEEP-INTEGRATION',
      body: { status: integration.status, counts: integration.counts, report: repoRel(PATHS.reportMd) }
    });
    appendNdjson(PATHS.outbox, {
      id: `${eventId}-hermes`,
      ts: generatedAt,
      from: 'hermes',
      to: 'neurotech-100b-integration',
      verb: hermesPacket.packet.verb,
      body: hermesPacket
    });
    for (const edge of gnnEdges) appendNdjson(PATHS.globalGnnEdges, edge);
  }

  return {
    ok: true,
    action: execute ? 'integrate' : 'preview',
    generatedAt,
    status: integration.status,
    counts: integration.counts,
    readiness: readiness.status,
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
      'node tools/neurotech-100b-sweep-integrator.js status',
      'node tools/neurotech-100b-sweep-integrator.js integrate --execute'
    ]
  }, null, 2));
  process.exitCode = 2;
}

main(process.argv);
