#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const behcs = require('./behcs/codex-bridge');

const repoRoot = path.resolve(__dirname, '..');
const TARGET_AGENTS = 12n * (10n ** 27n);
const CHECKPOINT_INTERVAL = 2_000n;
const LOGICAL_CHECKPOINTS = TARGET_AGENTS / CHECKPOINT_INTERVAL;

const MODE = Object.freeze({
  backend: 'supercomputer_transfer_profile',
  cli: 'bare_node_cli',
  realAgentVersion: true,
  supercomputerRequired: true,
  transferReady: true,
  launchesOnThisMachine: false,
  childProcessUse: false,
  externalModelTokenBudget: 0,
  noProviderAuthBypass: true,
  noUnboundedSchedulerFanout: true,
  exactBigIntCounts: true,
  importsVirtual12e27Supervision: true,
  nonDestructiveGc: true,
  secretMaterialWritten: false
});

const PATHS = Object.freeze({
  virtualSummary: rel('data/neurotech-defense-lab/omnispindle/12e27-sweep/agent-gnn-summary-latest.json'),
  virtualSupervisor: rel('data/neurotech-defense-lab/omnispindle/12e27-sweep/supervisor/12e27-omnispindle-heal-supervisor.v1.json'),
  virtualHermesAwareness: rel('data/neurotech-defense-lab/hermes/supervisor-of-supervisors/12e27-omnispindle-heal-awareness-latest.json'),
  virtualGlpj: rel('data/behcs/codex/glyph-language/neurotech-12e27-virtual-agent-sweep-behcs256.glpj.json'),
  root: rel('data/neurotech-defense-lab/real-agents/12e27-supercomputer'),
  profile: rel('data/neurotech-defense-lab/real-agents/12e27-supercomputer/real-12e27-supercomputer-profile.v1.json'),
  scheduler: rel('data/neurotech-defense-lab/real-agents/12e27-supercomputer/scheduler-contract.v1.json'),
  supervisor: rel('data/neurotech-defense-lab/real-agents/12e27-supercomputer/supervisor/real-12e27-supercomputer-supervisor.v1.json'),
  hermesAwareness: rel('data/neurotech-defense-lab/hermes/supervisor-of-supervisors/real-12e27-supercomputer-awareness-latest.json'),
  memory: rel('data/behcs/memory/real-12e27-supercomputer-transfer-event.v1.json'),
  index: rel('data/behcs/index/real-12e27-supercomputer-transfer-index.v1.json'),
  mapMapMapped: rel('data/behcs/maps/neurotech/real-12e27-supercomputer-map-map-mapped.v1.json'),
  cubeCubeCubed: rel('data/behcs/cubes/real-12e27-supercomputer-cube-cubed.cube.js'),
  glpj: rel('data/behcs/codex/glyph-language/real-12e27-supercomputer-behcs256.glpj.json'),
  state: rel('data/behcs/state/neurotech-defense/real-12e27-supercomputer-runner.state.json'),
  hermes: rel('data/behcs/hermes/neurotech-defense/real-12e27-supercomputer-runner-dispatch-latest.json'),
  shannon: rel('data/behcs/shannon/neurotech-defense/real-12e27-supercomputer-runner-consensus-latest.json'),
  reportJson: rel('reports/real-12e27-supercomputer-runner-latest.json'),
  reportMd: rel('reports/real-12e27-supercomputer-runner-latest.md'),
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

function readJson(filePath, fallback = {}) {
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

function glyph(kind, id, seed) {
  const hash = sha256Text(`${kind}:${id}:${seed || ''}`);
  return `HG256:${kind.toUpperCase()}:${hash.slice(0, 8).toUpperCase()}:${behcs.hilbertAddress(hash)}`;
}

function mint(kind, id, seed, dimension, artifact) {
  const sha256 = sha256Text(`${kind}:${id}:${seed || ''}:${dimension || ''}:${artifact || ''}`);
  return {
    id,
    kind,
    dimension,
    artifact,
    sha256,
    glyph: `HG256:${kind.toUpperCase()}:${sha256.slice(0, 8).toUpperCase()}:${behcs.hilbertAddress(sha256)}`
  };
}

function outputs() {
  return {
    profile: repoRel(PATHS.profile),
    scheduler: repoRel(PATHS.scheduler),
    supervisor: repoRel(PATHS.supervisor),
    hermesAwareness: repoRel(PATHS.hermesAwareness),
    memory: repoRel(PATHS.memory),
    index: repoRel(PATHS.index),
    mapMapMapped: repoRel(PATHS.mapMapMapped),
    cubeCubeCubed: repoRel(PATHS.cubeCubeCubed),
    glpj: repoRel(PATHS.glpj),
    reportMd: repoRel(PATHS.reportMd)
  };
}

function buildProfile(generatedAt, virtualSummary, virtualSupervisor, virtualHermes) {
  return {
    profileId: 'real-12e27-supercomputer-profile.v1',
    generatedAt,
    status: 'TRANSFER_READY_NOT_ARMED',
    mode: MODE,
    targetAgents: TARGET_AGENTS.toString(),
    checkpointInterval: CHECKPOINT_INTERVAL.toString(),
    logicalCheckpoints: LOGICAL_CHECKPOINTS.toString(),
    importedVirtualRun: {
      summary: repoRel(PATHS.virtualSummary),
      status: virtualSummary.status || 'missing',
      supervisor: repoRel(PATHS.virtualSupervisor),
      supervisorStatus: virtualSupervisor.status || 'missing',
      hermesAwareness: repoRel(PATHS.virtualHermesAwareness),
      hermesStatus: virtualHermes.status || 'missing',
      glpj: repoRel(PATHS.virtualGlpj)
    },
    executionModel: {
      scheduler: 'slurm_or_kubernetes_or_ray_on_supercomputer',
      unit: 'bounded_agent_packet_batch',
      oneAgentOneProcess: false,
      recommendedBatching: 'controller -> omnispindle lane -> bounded worker pool -> checkpoint -> GC',
      defaultLaneCount: 12,
      controllerCount: 12,
      workerPoolSizing: 'derived_from_scheduler_quota_not_hardcoded',
      checkpointEveryPackets: CHECKPOINT_INTERVAL.toString()
    },
    armingRequirements: [
      'supercomputer_scheduler_detected',
      'quota_contract_present',
      'scratch_and_checkpoint_paths_present',
      'provider_auth_or_local_model_runtime_present',
      'cost_budget_present_when_provider_calls_enabled',
      'hermes_awareness_loaded',
      'omnispindle_heal_supervisor_loaded',
      'hookwall_policy_loaded',
      'stop_file_and_kill_switch_present',
      'operator_start_gate_present'
    ],
    blockedOnAcer: [
      'no_supercomputer_scheduler',
      'no_scheduler_quota_contract',
      'no_real_worker_pool_launch_here'
    ]
  };
}

function buildScheduler(generatedAt, profile) {
  return {
    contractId: 'real-12e27-supercomputer-scheduler-contract.v1',
    generatedAt,
    status: 'SCHEDULER_CONTRACT_READY_NOT_ARMED',
    targetAgents: profile.targetAgents,
    logicalCheckpoints: profile.logicalCheckpoints,
    schedulerBackends: ['slurm', 'kubernetes', 'ray'],
    requiredEnvironment: {
      ASOLARIA_SUPERCOMPUTER_REAL_AGENTS: 'required_explicit_operator_gate',
      ASOLARIA_REAL_AGENT_SCHEDULER: 'slurm|kubernetes|ray',
      ASOLARIA_REAL_AGENT_MAX_CONCURRENT_JOBS: 'required_positive_integer_from_quota',
      ASOLARIA_REAL_AGENT_CHECKPOINT_ROOT: 'required_existing_path',
      ASOLARIA_REAL_AGENT_STOP_FILE: 'required_existing_parent',
      ASOLARIA_PROVIDER_AUTH_MODE: 'local_model|provider_api|none_for_dry_run'
    },
    hardBounds: {
      maxConcurrentJobs: 'must_be_less_than_or_equal_to_scheduler_quota',
      maxWalltime: 'must_be_less_than_or_equal_to_queue_policy',
      retryPolicy: 'bounded_retries_with_checkpoint_resume',
      failurePolicy: 'stop_lane_and_preserve_evidence',
      networkPolicy: 'deny_by_default_allow_explicit_model_endpoint_only'
    },
    launchDisposition: 'profile_only_no_jobs_launched'
  };
}

function buildSupervisor(generatedAt, profile) {
  const supervisorId = 'real-12e27-supercomputer-supervisor.v1';
  return {
    supervisorId,
    generatedAt,
    status: 'REAL_12E27_SUPERCOMPUTER_SUPERVISOR_READY_NOT_ARMED',
    pid: 'BH.REAL12E27.SUP.SUPERCOMPUTER.0001',
    glyph: glyph('real_12e27_supervisor', supervisorId, profile.targetAgents),
    authority: 'transfer_profile_observe_route_start_gate_only',
    imports: {
      virtualSupervisor: repoRel(PATHS.virtualSupervisor),
      virtualHermesAwareness: repoRel(PATHS.virtualHermesAwareness),
      virtualGlpj: repoRel(PATHS.virtualGlpj)
    },
    healRoute: 'supercomputer_omnispindle -> hermes -> hookwall -> gnn -> shannon -> gc -> checkpoint_resume',
    healFromOneOfOmnispindles: true,
    startGate: {
      armed: false,
      requiredOperatorGate: 'ASOLARIA_SUPERCOMPUTER_REAL_AGENTS',
      requiredSchedulerContract: repoRel(PATHS.scheduler)
    },
    writePolicy: 'local_transfer_artifacts_only_until_supercomputer_gate'
  };
}

function buildMints(generatedAt, profile, supervisor) {
  const seed = `${profile.profileId}:${profile.targetAgents}:${generatedAt}`;
  return {
    glpjId: 'real-12e27-supercomputer-behcs256.glpj',
    generatedAt,
    status: 'REAL_12E27_TRANSFER_GLYPHS_MINTED',
    alphabetBase: 256,
    mints: [
      mint('real_12e27', 'supercomputer_profile', seed, 'D42_ORCHESTRATION', repoRel(PATHS.profile)),
      mint('real_12e27', 'scheduler_contract', seed, 'D25_CARRIER', repoRel(PATHS.scheduler)),
      mint('real_12e27', 'real_agent_supervisor', supervisor.glyph, 'D37_AUTHORITY_TOPOLOGY', repoRel(PATHS.supervisor)),
      mint('real_12e27', 'hermes_awareness', seed, 'D39_GNN_EDGE', repoRel(PATHS.hermesAwareness)),
      mint('real_12e27', 'memory_event', seed, 'D11_PROOF', repoRel(PATHS.memory)),
      mint('real_12e27', 'index_event', seed, 'D13_SURFACE', repoRel(PATHS.index)),
      mint('real_12e27', 'map_map_mapped', seed, 'D35_HYPERLANGUAGE', repoRel(PATHS.mapMapMapped)),
      mint('real_12e27', 'cube_cube_cubed', seed, 'D42_ORCHESTRATION', repoRel(PATHS.cubeCubeCubed))
    ]
  };
}

function buildHermesAwareness(generatedAt, profile, supervisor, mints) {
  return {
    awarenessId: 'hermes-real-12e27-supercomputer-awareness-latest',
    generatedAt,
    status: 'HERMES_AWARE_REAL_12E27_SUPERCOMPUTER_TRANSFER',
    mode: MODE,
    sourceProfile: repoRel(PATHS.profile),
    supervisor: {
      supervisorId: supervisor.supervisorId,
      pid: supervisor.pid,
      glyph: supervisor.glyph,
      artifact: repoRel(PATHS.supervisor)
    },
    targetAgents: profile.targetAgents,
    healRoute: supervisor.healRoute,
    healFromOneOfOmnispindles: true,
    startGate: supervisor.startGate,
    mints: mints.mints.map((m) => ({ id: m.id, glyph: m.glyph, artifact: m.artifact }))
  };
}

function buildMemory(generatedAt, profile, supervisor, hermesAwareness, mints) {
  return {
    eventId: 'real-12e27-supercomputer-transfer-event.v1',
    generatedAt,
    status: 'REAL_12E27_SUPERCOMPUTER_TRANSFER_PROFILE_RECORDED',
    targetAgents: profile.targetAgents,
    logicalCheckpoints: profile.logicalCheckpoints,
    profile: repoRel(PATHS.profile),
    supervisor: repoRel(PATHS.supervisor),
    hermesAwareness: repoRel(PATHS.hermesAwareness),
    rootGlyph: mints.mints[0]?.glyph,
    supervisorGlyph: supervisor.glyph,
    meaning: 'The virtual 12e27 run has a corresponding real-agent supercomputer transfer profile, gated by scheduler capacity, provider/local runtime auth, kill switch, Hookwall, Hermes, and omnispindle healing.',
    launchDisposition: 'not_launched_on_acer'
  };
}

function buildIndex(generatedAt, profile, mints) {
  return {
    indexId: 'real-12e27-supercomputer-transfer-index.v1',
    generatedAt,
    status: 'INDEX_READY_REAL_12E27_SUPERCOMPUTER_TRANSFER',
    keys: ['real-agent-version', '12e27', 'supercomputer', 'scheduler-gated', 'hermes-aware', 'omnispindle-heal', 'behcs256', 'map-map-mapped', 'cube-cube-cubed'],
    targetAgents: profile.targetAgents,
    artifacts: outputs(),
    glyphs: mints.mints
  };
}

function buildMap(generatedAt, profile, mints) {
  return {
    mapId: 'real-12e27-supercomputer-map-map-mapped.v1',
    generatedAt,
    status: 'MAP_MAP_MAPPED_READY_REAL_12E27',
    root: {
      profile: profile.profileId,
      targetAgents: profile.targetAgents,
      glyph: mints.mints.find((m) => m.id === 'map_map_mapped')?.glyph
    },
    routes: [
      { from: 'virtual_12e27_supervisor', to: 'real_12e27_supercomputer_supervisor', edge: 'imports', artifact: repoRel(PATHS.supervisor) },
      { from: 'real_12e27_supercomputer_supervisor', to: 'scheduler_contract', edge: 'requires', artifact: repoRel(PATHS.scheduler) },
      { from: 'scheduler_contract', to: 'operator_start_gate', edge: 'blocks_until_present', artifact: repoRel(PATHS.profile) },
      { from: 'omnispindle_lane_failure', to: 'hermes_heal_route', edge: 'heals_through', artifact: repoRel(PATHS.hermesAwareness) },
      { from: 'real_run_checkpoint', to: 'gc', edge: 'preserve_and_compact', artifact: repoRel(PATHS.glpj) }
    ]
  };
}

function buildCube(generatedAt, profile, mints) {
  const cube = {
    id: 'real-12e27-supercomputer-cube-cubed',
    generatedAt,
    status: 'CUBE_CUBE_CUBED_READY_REAL_12E27_TRANSFER',
    dimensions: {
      D11_PROOF: 'transfer_profile_written_not_launched',
      D16_PID: 'real_agent_pid_ranges_deferred_to_scheduler',
      D25_CARRIER: 'supercomputer_scheduler',
      D35_HYPERLANGUAGE: 'virtual_to_real_transfer',
      D36_INFERENCE_SURFACE: 'omnispindle_hermes_gnn_shannon_gc',
      D37_AUTHORITY_TOPOLOGY: 'operator_start_gate',
      D39_GNN_EDGE: 'heal_route_edges',
      D42_ORCHESTRATION: 'real_12e27_supercomputer_profile'
    },
    targetAgents: profile.targetAgents,
    logicalCheckpoints: profile.logicalCheckpoints,
    launchDisposition: 'not_launched_on_acer',
    glyphs: mints.mints,
    artifacts: outputs()
  };
  return `// cube: real-12e27-supercomputer-cube-cubed | BEHCS-256 | D42 ORCHESTRATION\nexport const CUBE = ${JSON.stringify(cube, null, 2)}\n`;
}

function buildShannon(generatedAt, profile) {
  return {
    integrationId: 'real-12e27-supercomputer-runner-shannon-consensus',
    generatedAt,
    status: 'consensus_real_12e27_transfer_profile_only',
    consensus: 'PROCEED_TRANSFER_PROFILE_DO_NOT_LAUNCH_ON_ACER',
    executionDisposition: 'supercomputer_required_scheduler_gate_required_operator_start_gate_required',
    targetAgents: profile.targetAgents,
    votes: [
      { part: 'scout', vote: 'PROCEED_PROFILE', reason: 'Virtual 12e27 artifacts exist and were imported.' },
      { part: 'evidence', vote: 'PROCEED_PROFILE', reason: 'Memory, index, map, cube, GLPJ, supervisor, and Hermes awareness are written locally.' },
      { part: 'executor', vote: 'HALT_LAUNCH', reason: 'This machine is not the supercomputer and no scheduler quota is present.' },
      { part: 'fabric', vote: 'PROCEED_TRANSFER', reason: 'Scheduler contract defines bounded future execution.' },
      { part: 'voice', vote: 'CLAIM_GUARD', reason: 'Real-agent version is a transfer profile, not a claim that agents ran here.' },
      { part: 'planner', vote: 'NEXT_HANDOFF', reason: 'Move the profile to the supercomputer and arm only after gates pass.' }
    ]
  };
}

function buildHermes(generatedAt, profile) {
  return {
    integrationId: 'real-12e27-supercomputer-runner-hermes-dispatch',
    generatedAt,
    status: 'HERMES_DISPATCH_REAL_12E27_TRANSFER_PROFILE',
    mode: MODE,
    packet: {
      verb: 'EVT-HERMES-REAL-12E27-SUPERCOMPUTER-TRANSFER',
      summary: 'Real 12e27 supercomputer profile recorded from virtual 12e27 supervision. No jobs launched on Acer.',
      targetAgents: profile.targetAgents,
      profile: repoRel(PATHS.profile),
      report: repoRel(PATHS.reportMd)
    }
  };
}

function buildReport(generatedAt, profile, scheduler, supervisor, shannon) {
  const json = {
    reportId: 'real-12e27-supercomputer-runner-latest',
    generatedAt,
    status: profile.status,
    mode: MODE,
    targetAgents: profile.targetAgents,
    logicalCheckpoints: profile.logicalCheckpoints,
    outputs: outputs(),
    scheduler,
    supervisor,
    shannon
  };
  const md = `# Real 12e27 Supercomputer Runner

Generated: ${generatedAt}

Status: ${profile.status}

This is the real-agent transfer profile for the future supercomputer run. It imports the virtual 12e27 supervisor, Hermes awareness, and BEHCS-256 glyph mints, but it does not launch jobs on Acer.

## Counts

- Target agents: ${profile.targetAgents}
- Logical checkpoints: ${profile.logicalCheckpoints}
- Checkpoint interval: ${profile.checkpointInterval}
- Launches on this machine: false

## Required Gates

- ${profile.armingRequirements.join('\n- ')}

## Outputs

- Profile: \`${repoRel(PATHS.profile)}\`
- Scheduler contract: \`${repoRel(PATHS.scheduler)}\`
- Supervisor: \`${repoRel(PATHS.supervisor)}\`
- Hermes awareness: \`${repoRel(PATHS.hermesAwareness)}\`
- Memory: \`${repoRel(PATHS.memory)}\`
- Index: \`${repoRel(PATHS.index)}\`
- Map-map-mapped: \`${repoRel(PATHS.mapMapMapped)}\`
- Cube-cube-cubed: \`${repoRel(PATHS.cubeCubeCubed)}\`
- GLPJ: \`${repoRel(PATHS.glpj)}\`

## Shannon

- Consensus: ${shannon.consensus}
- Execution: ${shannon.executionDisposition}
`;
  return { json, md };
}

function plan({ execute = false } = {}) {
  const generatedAt = new Date().toISOString();
  const virtualSummary = readJson(PATHS.virtualSummary);
  const virtualSupervisor = readJson(PATHS.virtualSupervisor);
  const virtualHermes = readJson(PATHS.virtualHermesAwareness);
  const profile = buildProfile(generatedAt, virtualSummary, virtualSupervisor, virtualHermes);
  const scheduler = buildScheduler(generatedAt, profile);
  const supervisor = buildSupervisor(generatedAt, profile);
  const mints = buildMints(generatedAt, profile, supervisor);
  const hermesAwareness = buildHermesAwareness(generatedAt, profile, supervisor, mints);
  const memory = buildMemory(generatedAt, profile, supervisor, hermesAwareness, mints);
  const index = buildIndex(generatedAt, profile, mints);
  const map = buildMap(generatedAt, profile, mints);
  const cube = buildCube(generatedAt, profile, mints);
  const shannon = buildShannon(generatedAt, profile);
  const hermes = buildHermes(generatedAt, profile);
  const report = buildReport(generatedAt, profile, scheduler, supervisor, shannon);
  const eventId = `real-12e27-supercomputer-profile-${Date.now()}`;

  if (execute) {
    writeJson(PATHS.profile, profile);
    writeJson(PATHS.scheduler, scheduler);
    writeJson(PATHS.supervisor, supervisor);
    writeJson(PATHS.hermesAwareness, hermesAwareness);
    writeJson(PATHS.memory, memory);
    writeJson(PATHS.index, index);
    writeJson(PATHS.mapMapMapped, map);
    writeText(PATHS.cubeCubeCubed, cube);
    writeJson(PATHS.glpj, mints);
    writeJson(PATHS.state, { savedAt: generatedAt, status: profile.status, mode: MODE, targetAgents: profile.targetAgents, report: repoRel(PATHS.reportMd) });
    writeJson(PATHS.hermes, hermes);
    writeJson(PATHS.shannon, shannon);
    writeJson(PATHS.reportJson, report.json);
    writeText(PATHS.reportMd, report.md);
    appendNdjson(PATHS.inbox, { id: eventId, ts: generatedAt, from: 'asolaria', to: 'real-12e27-supercomputer-runner', verb: 'EVT-REAL-12E27-SUPERCOMPUTER-PROFILE', body: { status: profile.status, targetAgents: profile.targetAgents, report: repoRel(PATHS.reportMd) } });
    appendNdjson(PATHS.outbox, { id: `${eventId}-hermes`, ts: generatedAt, from: 'hermes', to: 'real-12e27-supercomputer-runner', verb: hermes.packet.verb, body: hermes });
    appendNdjson(PATHS.gnnEdges, { id: `${eventId}-gnn`, ts: generatedAt, from: 'virtual_12e27_supervision', to: 'real_12e27_supercomputer_profile', verb: 'transfer_profile_minted', weight: 0.997 });
  }

  return {
    ok: true,
    action: execute ? 'plan' : 'preview',
    generatedAt,
    status: profile.status,
    targetAgents: profile.targetAgents,
    logicalCheckpoints: profile.logicalCheckpoints,
    outputs: outputs(),
    launchDisposition: 'profile_only_no_jobs_launched',
    mode: MODE
  };
}

function status() {
  const profile = readJson(PATHS.profile, null);
  return {
    ok: true,
    action: 'status',
    generatedAt: new Date().toISOString(),
    status: profile?.status || 'NO_REAL_12E27_SUPERCOMPUTER_PROFILE',
    targetAgents: profile?.targetAgents || TARGET_AGENTS.toString(),
    profile: repoRel(PATHS.profile),
    launchDisposition: 'profile_only_no_jobs_launched',
    mode: MODE
  };
}

function main(argv) {
  const action = argv[2] || 'status';
  if (action === 'status') {
    console.log(JSON.stringify(status(), null, 2));
    return;
  }
  if (action === 'plan') {
    console.log(JSON.stringify(plan({ execute: argv.includes('--execute') }), null, 2));
    return;
  }
  console.error(JSON.stringify({
    ok: false,
    error: `Unknown action: ${action}`,
    usage: [
      'node tools/neurotech-real-12e27-supercomputer-runner.js status',
      'node tools/neurotech-real-12e27-supercomputer-runner.js plan --execute'
    ]
  }, null, 2));
  process.exitCode = 2;
}

main(process.argv);
