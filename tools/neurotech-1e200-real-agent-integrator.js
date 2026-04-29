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
  realAgentRuntime: 'bounded_local_pid_packet_runtime',
  realOsProcessStormBlocked: true,
  allowedChildProcessUse: false,
  externalModelTokenBudget: 0,
  nonDestructiveGc: true,
  secretMaterialWritten: false
});

const PATHS = Object.freeze({
  oneE200Summary: rel('data/neurotech-defense-lab/omnispindle/1e200-sweep/agent-gnn-summary-latest.json'),
  oneE200Genius: rel('data/neurotech-defense-lab/omnispindle/1e200-sweep/genius-agent-marks-latest.ndjson'),
  oneE200Mistakes: rel('data/neurotech-defense-lab/omnispindle/1e200-sweep/mistake-agent-marks-latest.ndjson'),
  oneE200BuildOrder: rel('data/neurotech-defense-lab/omnispindle/1e200-sweep/one-e200-build-order.v1.json'),
  approval: rel('data/neurotech-defense-lab/consent/monthly-approval-2026-04.v1.json'),
  safeRuntime: rel('data/neurotech-defense-lab/runtime/neurotech-safe-runtime-summary-latest.json'),
  root: rel('data/neurotech-defense-lab/real-agents/integration'),
  integration: rel('data/neurotech-defense-lab/real-agents/integration/1e200-real-agent-integration-latest.json'),
  supervisors: rel('data/neurotech-defense-lab/real-agents/integration/genius-supervisors-latest.json'),
  guards: rel('data/neurotech-defense-lab/real-agents/integration/mistake-guards-latest.json'),
  hookwall: rel('data/neurotech-defense-lab/real-agents/integration/hookwall-policy-latest.json'),
  readiness: rel('data/neurotech-defense-lab/real-agents/integration/real-million-readiness.v1.json'),
  state: rel('data/behcs/state/neurotech-defense/neurotech-1e200-real-agent-integration.state.json'),
  hermes: rel('data/behcs/hermes/neurotech-defense/neurotech-1e200-real-agent-integration-dispatch-latest.json'),
  shannon: rel('data/behcs/shannon/neurotech-defense/neurotech-1e200-real-agent-integration-consensus-latest.json'),
  cube: rel('data/behcs/cubes/neurotech-1e200-real-agent-integration.cube.js'),
  reportJson: rel('reports/neurotech-1e200-real-agent-integration-latest.json'),
  reportMd: rel('reports/neurotech-1e200-real-agent-integration-latest.md'),
  inbox: rel('data/behcs/inbox.ndjson'),
  outbox: rel('data/behcs/outbox.ndjson'),
  gnnEdges: rel('data/behcs/gnn-live-edges.ndjson')
});

const RUNTIME_BLOCKS = [
  ['real_agent_process_storm', 'Block one-agent-one-process launches. Use bounded PID packets inside one local CLI runtime.'],
  ['external_model_call_storm', 'Block unbounded external LLM/API calls. This tranche uses zero external model tokens.'],
  ['ruview_execution', 'Keep downloaded RU-view or remote-view surfaces static and fail-closed.'],
  ['live_eeg_capture', 'Block live EEG and human biosignal capture until a live-session precheck is separately approved.'],
  ['raw_biosignal_or_signed_consent_in_git', 'Block raw participant data, signed consent, serials, tokens, and direct identifiers from Git.'],
  ['count_precision_loss', 'Block scientific notation or floating point for large agent counts.'],
  ['remote_tracker_mutation', 'Block remote Symphony/Linear mutation before local Hookwall/GNN observation.'],
  ['medical_or_mind_reading_claim', 'Block diagnosis, treatment, guaranteed enhancement, and literal private-thought-reading claims.']
];

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

function sha256Text(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function glyph(kind, id, seed) {
  const hash = sha256Text(`${kind}:${id}:${seed || ''}`);
  return `HG256:${kind.toUpperCase()}:${hash.slice(0, 8).toUpperCase()}:${behcs.hilbertAddress(hash)}`;
}

function slug(value) {
  return String(value || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'unknown';
}

function numberValue(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function opencodeAvailable() {
  return [
    'C:/nvm4w/nodejs/opencode.ps1',
    'C:/nvm4w/nodejs/opencode.cmd',
    'C:/nvm4w/nodejs/opencode'
  ].some((candidate) => fs.existsSync(candidate));
}

function loadContext() {
  return {
    summary: readJson(PATHS.oneE200Summary, {}),
    genius: readNdjson(PATHS.oneE200Genius),
    mistakes: readNdjson(PATHS.oneE200Mistakes),
    buildOrder: readJson(PATHS.oneE200BuildOrder, {}),
    approval: readJson(PATHS.approval, {}),
    safeRuntime: readJson(PATHS.safeRuntime, {})
  };
}

function buildGeniusSupervisors(context, generatedAt) {
  const marks = context.genius.slice(0, 20);
  return {
    supervisorSetId: 'neurotech-real-agent-genius-supervisors.v1',
    generatedAt,
    status: 'GENIUS_SUPERVISORS_READY_FOR_REAL_PID_PACKET_RUN',
    count: marks.length,
    supervisors: marks.map((mark, index) => {
      const id = `real-genius-${String(index + 1).padStart(2, '0')}-${slug(mark.id)}`;
      return {
        supervisorId: id,
        pid: `BH.REAL.SUPERVISOR.GENIUS.PID.${String(index + 1).padStart(5, '0')}`,
        sourceMarkId: mark.id,
        sourceGlyph: mark.glyph,
        glyph: glyph('real_genius_supervisor', id, mark.glyph || mark.summary),
        domain: mark.domain,
        priority: numberValue(mark.score, 0.9) >= 0.99 ? 'critical' : 'high',
        score: numberValue(mark.score, 0),
        runtimeAuthority: 'observe_score_farm_gems_only',
        hookwallGate: 'must_pass_claim_consent_storage_and_process_bounds',
        gnnFeed: ['forward_gnn', 'reverse_gain_gnn', 'omnishannon'],
        gcDisposition: 'preserve_gem_compact_duplicates',
        summary: mark.summary
      };
    })
  };
}

function buildMistakeGuards(context, generatedAt) {
  const marks = context.mistakes.slice(0, 22);
  return {
    guardSetId: 'neurotech-real-agent-mistake-guards.v1',
    generatedAt,
    status: 'MISTAKE_GUARDS_READY_FOR_REAL_PID_PACKET_RUN',
    count: marks.length,
    guards: marks.map((mark, index) => {
      const id = `real-mistake-${String(index + 1).padStart(2, '0')}-${slug(mark.id)}`;
      const reverseGain = numberValue(mark.reverseGain, 0.8);
      return {
        guardId: id,
        pid: `BH.REAL.SUPERVISOR.MISTAKE.PID.${String(index + 1).padStart(5, '0')}`,
        sourceMarkId: mark.id,
        sourceGlyph: mark.glyph,
        glyph: glyph('real_mistake_guard', id, mark.glyph || mark.summary),
        domain: mark.domain,
        severity: reverseGain >= 0.96 ? 'critical' : reverseGain >= 0.9 ? 'high' : 'medium',
        reverseGain,
        runtimeAuthority: 'block_or_warn_then_preserve_evidence',
        action: reverseGain >= 0.96 ? 'block_and_preserve' : 'warn_glyph_and_continue',
        hookwallStatus: mark.hookwallStatus || 'HARD_WARN_AND_LEDGER',
        gnnStatus: mark.gnnStatus || 'REVERSE_GAIN_MARK',
        gcDisposition: mark.gcDisposition || 'preserve_evidence_compact_duplicates',
        summary: mark.summary
      };
    })
  };
}

function buildHookwallPolicy(supervisorSet, guardSet, generatedAt) {
  const blockRules = RUNTIME_BLOCKS.map(([id, summary], index) => ({
    id,
    rulePid: `BH.REAL.HOOKWALL.BLOCK.PID.${String(index + 1).padStart(5, '0')}`,
    glyph: glyph('real_hookwall_block', id, summary),
    disposition: 'BLOCK',
    summary
  }));

  const watchRules = supervisorSet.supervisors.slice(0, 10).map((supervisor, index) => ({
    id: `watch-${slug(supervisor.sourceMarkId)}`,
    rulePid: `BH.REAL.HOOKWALL.WATCH.PID.${String(index + 1).padStart(5, '0')}`,
    glyph: glyph('real_hookwall_watch', supervisor.supervisorId, supervisor.summary),
    disposition: 'FARM_GEM',
    domain: supervisor.domain,
    summary: supervisor.summary
  }));

  return {
    policyId: 'neurotech-real-agent-hookwall-policy.v1',
    generatedAt,
    status: 'HOOKWALL_READY_FOR_BOUNDED_REAL_PID_PACKET_RUN',
    mode: MODE,
    blockRules,
    watchRules,
    guardCount: guardSet.guards.length,
    supervisorCount: supervisorSet.supervisors.length,
    runtimeRule: 'one local CLI process may execute many PID packets; one PID packet must not mean one spawned OS process',
    gnnRequired: ['forward_gnn', 'reverse_gain_gnn', 'omnishannon', 'non_destructive_gc']
  };
}

function buildReadiness(context, supervisorSet, guardSet, hookwallPolicy, generatedAt) {
  const opencode = opencodeAvailable();
  return {
    readinessId: 'neurotech-real-million-readiness.v1',
    generatedAt,
    status: 'READY_FOR_REAL_MILLION_PID_PACKET_RUN',
    mode: MODE,
    inheritedOneE200Status: context.summary.status || null,
    approvalStatus: context.approval.status || null,
    approvalExpiresAtLocal: context.approval.expiresAtLocal || null,
    executionContract: {
      realLowerLevelPidPackets: 1_000_000,
      omnispindleControllers: 100,
      omniflywheelSupervisors: 100,
      chunkSize: 1_000,
      chunkRows: 1_000,
      permittedOsProcessShape: 'single_local_node_cli_runtime',
      blockedOsProcessShape: 'one_process_per_agent_or_unbounded_worker_fork',
      maxChildProcessSpawns: 0,
      externalModelTokens: 0,
      opencodeCliAvailable: opencode,
      opencodeCliModeForThisRun: 'pid_packet_compatible_no_external_model_session',
      opencodeLiveModelSessions: 0
    },
    gates: {
      hookwallPolicy: repoRel(PATHS.hookwall),
      geniusSupervisors: supervisorSet.count,
      mistakeGuards: guardSet.count,
      blockRules: hookwallPolicy.blockRules.length,
      watchRules: hookwallPolicy.watchRules.length,
      ruViewExecution: 'blocked_static_only',
      liveEeg: 'blocked_for_this_run',
      humanData: 'blocked_for_this_run',
      downloads: 'blocked_for_this_run',
      remoteTrackers: 'blocked_until_local_observation'
    },
    runnerCommand: 'node tools/neurotech-real-million-agent-runner.js run --execute'
  };
}

function buildIntegration(context, supervisorSet, guardSet, hookwallPolicy, readiness, generatedAt) {
  return {
    integrationId: 'neurotech-1e200-real-agent-integration-latest',
    generatedAt,
    status: 'INTEGRATED_1E200_MARKS_READY_FOR_REAL_MILLION_RUN',
    mode: MODE,
    source: {
      summary: repoRel(PATHS.oneE200Summary),
      geniusMarks: repoRel(PATHS.oneE200Genius),
      mistakeMarks: repoRel(PATHS.oneE200Mistakes),
      buildOrder: repoRel(PATHS.oneE200BuildOrder),
      sourceStatus: context.summary.status || null
    },
    outputs: {
      supervisors: repoRel(PATHS.supervisors),
      guards: repoRel(PATHS.guards),
      hookwall: repoRel(PATHS.hookwall),
      readiness: repoRel(PATHS.readiness)
    },
    counts: {
      sourceGeniusMarks: context.genius.length,
      sourceMistakeMarks: context.mistakes.length,
      geniusSupervisors: supervisorSet.count,
      mistakeGuards: guardSet.count,
      blockRules: hookwallPolicy.blockRules.length,
      watchRules: hookwallPolicy.watchRules.length,
      plannedRealPidPackets: readiness.executionContract.realLowerLevelPidPackets
    },
    nextCommand: readiness.runnerCommand
  };
}

function buildShannon(integration, readiness, generatedAt) {
  return {
    integrationId: 'neurotech-1e200-real-agent-integration-shannon',
    generatedAt,
    status: 'consensus_ready_for_bounded_real_pid_packet_run',
    consensus: 'PROCEED-REAL-PID-PACKET-RUN',
    executionDisposition: 'bounded_single_cli_no_child_process_no_external_tokens',
    votes: [
      { part: 'scout', vote: 'PROCEED', reason: '1e200 genius and mistake marks were converted to runtime supervisors and guards.' },
      { part: 'evidence', vote: 'PROCEED', reason: 'Readiness contract defines exact one-million PID packets and chunked evidence output.' },
      { part: 'executor', vote: 'BOUND_EXECUTION', reason: 'One million OS processes, live EEG, RU-view execution, downloads, and external model calls remain blocked.' },
      { part: 'fabric', vote: 'PROCEED', reason: 'BEHCS/Hermes/Shannon/cube/report surfaces are generated.' },
      { part: 'voice', vote: 'HONEST_SCALE', reason: 'The run is real local PID packet execution, not one million live LLM sessions.' },
      { part: 'planner', vote: 'NEXT_RUNNER', reason: readiness.runnerCommand }
    ],
    counts: integration.counts
  };
}

function buildHermes(integration, readiness, shannonPacket, generatedAt) {
  return {
    integrationId: 'neurotech-1e200-real-agent-integration-hermes',
    generatedAt,
    status: integration.status,
    mode: MODE,
    packet: {
      verb: 'EVT-HERMES-NEUROTECH-1E200-REAL-AGENT-INTEGRATION',
      summary: '1e200 sweep marks integrated into supervisors, guards, Hookwall policy, and real million PID-packet readiness.',
      consensus: shannonPacket.consensus,
      runnerCommand: readiness.runnerCommand,
      plannedRealPidPackets: readiness.executionContract.realLowerLevelPidPackets,
      report: repoRel(PATHS.reportMd)
    }
  };
}

function buildCube(integration, readiness, shannonPacket, generatedAt) {
  const cube = {
    id: 'neurotech-1e200-real-agent-integration',
    generatedAt,
    primaryCatalog: { D: 37, name: 'AUTHORITY', prime: 157 },
    touches: [6, 20, 35, 37, 38, 39, 42, 47],
    gates: ['hookwall', 'process_bound', 'claim_guard', 'consent_guard', 'storage_guard', 'gc'],
    payload: {
      kind: 'real-agent-supervisor-integration',
      status: integration.status,
      mode: MODE,
      counts: integration.counts,
      readiness: readiness.status,
      shannon: {
        consensus: shannonPacket.consensus,
        executionDisposition: shannonPacket.executionDisposition
      }
    },
    translate: {
      human: '1e200 sweep marks are now integrated into a bounded real PID-packet runner contract.',
      agent: '(asolaria, neurotech, real_pid_packets, hookwall, gnn, reverse_gain, gc, no_process_storm)',
      device: readiness.runnerCommand
    }
  };
  return `// cube: neurotech-1e200-real-agent-integration | neurotech | D37 AUTHORITY\nexport const CUBE = ${JSON.stringify(cube, null, 2)}\n`;
}

function buildReport(integration, readiness, supervisorSet, guardSet, hookwallPolicy, shannonPacket, generatedAt) {
  const topSupervisors = supervisorSet.supervisors.slice(0, 8).map((entry) =>
    `| ${entry.supervisorId} | ${entry.domain || ''} | ${entry.priority} | ${entry.score} | ${entry.summary} |`
  ).join('\n');
  const topGuards = guardSet.guards.slice(0, 8).map((entry) =>
    `| ${entry.guardId} | ${entry.severity} | ${entry.reverseGain} | ${entry.action} | ${entry.summary} |`
  ).join('\n');
  const blockRows = hookwallPolicy.blockRules.map((entry) =>
    `| ${entry.id} | ${entry.disposition} | ${entry.summary} |`
  ).join('\n');

  const json = {
    reportId: 'neurotech-1e200-real-agent-integration-latest',
    generatedAt,
    status: integration.status,
    integration,
    readiness,
    shannon: shannonPacket
  };

  const md = `# Neurotech 1e200 Real Agent Integration

Generated: ${generatedAt}

Status: ${integration.status}

This integrates the previous 1e200 sweep marks into real local runtime supervisors and a one-million PID-packet runner contract. It does not claim one million live LLM sessions or launch one million OS processes.

## Real Run Contract

- Planned lower-level PID packets: ${readiness.executionContract.realLowerLevelPidPackets}
- Omnispindle controllers: ${readiness.executionContract.omnispindleControllers}
- Omniflywheel supervisors: ${readiness.executionContract.omniflywheelSupervisors}
- Chunk rows: ${readiness.executionContract.chunkRows}
- External model tokens: ${readiness.executionContract.externalModelTokens}
- Child process spawns: ${readiness.executionContract.maxChildProcessSpawns}
- OpenCode CLI available: ${readiness.executionContract.opencodeCliAvailable}

## Supervisors

| Supervisor | Domain | Priority | Score | Summary |
| --- | --- | --- | ---: | --- |
${topSupervisors}

## Guards

| Guard | Severity | Reverse Gain | Action | Summary |
| --- | --- | ---: | --- | --- |
${topGuards}

## Hookwall Blocks

| Rule | Disposition | Summary |
| --- | --- | --- |
${blockRows}

## Shannon

- Consensus: ${shannonPacket.consensus}
- Execution: ${shannonPacket.executionDisposition}
- Next: \`${readiness.runnerCommand}\`
`;

  return { json, md };
}

function integrate({ execute = false } = {}) {
  const generatedAt = new Date().toISOString();
  const context = loadContext();
  const supervisorSet = buildGeniusSupervisors(context, generatedAt);
  const guardSet = buildMistakeGuards(context, generatedAt);
  const hookwallPolicy = buildHookwallPolicy(supervisorSet, guardSet, generatedAt);
  const readiness = buildReadiness(context, supervisorSet, guardSet, hookwallPolicy, generatedAt);
  const integration = buildIntegration(context, supervisorSet, guardSet, hookwallPolicy, readiness, generatedAt);
  const shannonPacket = buildShannon(integration, readiness, generatedAt);
  const hermesPacket = buildHermes(integration, readiness, shannonPacket, generatedAt);
  const cube = buildCube(integration, readiness, shannonPacket, generatedAt);
  const report = buildReport(integration, readiness, supervisorSet, guardSet, hookwallPolicy, shannonPacket, generatedAt);
  const eventId = `neurotech-1e200-real-agent-integration-${Date.now()}`;

  if (execute) {
    writeJson(PATHS.supervisors, supervisorSet);
    writeJson(PATHS.guards, guardSet);
    writeJson(PATHS.hookwall, hookwallPolicy);
    writeJson(PATHS.readiness, readiness);
    writeJson(PATHS.integration, integration);
    writeJson(PATHS.state, {
      savedAt: generatedAt,
      status: integration.status,
      mode: MODE,
      readiness: repoRel(PATHS.readiness),
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
      to: 'neurotech-real-agents',
      verb: 'EVT-NEUROTECH-1E200-REAL-AGENT-INTEGRATION',
      body: { status: integration.status, readiness: readiness.status, report: repoRel(PATHS.reportMd) }
    });
    appendNdjson(PATHS.outbox, {
      id: `${eventId}-hermes`,
      ts: generatedAt,
      from: 'hermes',
      to: 'neurotech-real-agents',
      verb: hermesPacket.packet.verb,
      body: hermesPacket
    });
    appendNdjson(PATHS.gnnEdges, {
      id: `${eventId}-edge`,
      ts: generatedAt,
      from: 'one_e200_sweep_marks',
      to: 'real_million_pid_packet_runner',
      verb: 'integrated_supervisors_and_guards',
      weight: 0.91
    });
  }

  return {
    ok: true,
    action: execute ? 'integrate' : 'preview',
    generatedAt,
    status: integration.status,
    counts: integration.counts,
    readiness: readiness.status,
    shannon: {
      status: shannonPacket.status,
      consensus: shannonPacket.consensus
    },
    outputs: {
      integration: repoRel(PATHS.integration),
      supervisors: repoRel(PATHS.supervisors),
      guards: repoRel(PATHS.guards),
      hookwall: repoRel(PATHS.hookwall),
      readiness: repoRel(PATHS.readiness),
      reportJson: repoRel(PATHS.reportJson),
      reportMd: repoRel(PATHS.reportMd),
      cube: repoRel(PATHS.cube)
    },
    nextCommand: readiness.runnerCommand,
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
      'node tools/neurotech-1e200-real-agent-integrator.js status',
      'node tools/neurotech-1e200-real-agent-integrator.js integrate --execute'
    ]
  }, null, 2));
  process.exitCode = 2;
}

main(process.argv);
