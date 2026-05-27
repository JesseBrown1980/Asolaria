#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const behcs = require('./behcs/codex-bridge');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_RUN = 'openclaw-424-200-step-execution-20260426';
const RUN_ID = 'openclaw-424-executor-matrix-20260426';
const RUN_ROOT = rel(`data/behcs/orchestration/${RUN_ID}`);

const SOURCE_PATHS = Object.freeze({
  phaseInventory: rel(`data/behcs/orchestration/${SOURCE_RUN}/openclaw-424-phase-inventory.v1.json`),
  tasksNdjson: rel(`data/behcs/orchestration/${SOURCE_RUN}/openclaw-424-200-step-tasks.v1.ndjson`),
  implementationQueue: rel(`data/behcs/orchestration/${SOURCE_RUN}/openclaw-424-implementation-queue.v1.ndjson`),
  aggregate: rel(`data/behcs/orchestration/${SOURCE_RUN}/openclaw-424-200-step-execution-aggregate-latest.json`),
  report: rel('reports/openclaw-424-200-step-execution-latest.md')
});

const PATHS = Object.freeze({
  runRoot: RUN_ROOT,
  executorContracts: path.join(RUN_ROOT, 'executor-contracts.v1.json'),
  executorContractsNdjson: path.join(RUN_ROOT, 'executor-contracts.v1.ndjson'),
  executorReadyQueue: path.join(RUN_ROOT, 'executor-ready-queue.v1.ndjson'),
  supervisorQueue: path.join(RUN_ROOT, 'executor-supervisor-queue.ndjson'),
  cascadeDivision: path.join(RUN_ROOT, 'cascade-division.v1.json'),
  lockMatrix: path.join(RUN_ROOT, 'lock-matrix.v1.json'),
  energyBudget: path.join(RUN_ROOT, 'energy-budget.v1.json'),
  collisionReport: path.join(RUN_ROOT, 'collision-report.v1.json'),
  memory: rel('data/behcs/memory/openclaw-424-executor-matrix.v1.json'),
  index: rel('data/behcs/index/openclaw-424-executor-matrix-index.v1.json'),
  map: rel('data/behcs/maps/asolaria/openclaw-424-executor-matrix-map-map-mapped.v1.json'),
  cube: rel('data/behcs/cubes/openclaw-424-executor-matrix-cube-cubed.cube.js'),
  glpj: rel('data/behcs/codex/glyph-language/openclaw-424-executor-matrix-behcs256.glpj.json'),
  reportJson: rel('reports/openclaw-424-executor-matrix-latest.json'),
  reportMd: rel('reports/openclaw-424-executor-matrix-latest.md'),
  globalInbox: rel('data/behcs/inbox.ndjson'),
  gnnEdges: rel('data/behcs/gnn-live-edges.ndjson')
});

const LOCKS = {
  PROOF_DATA: {
    id: 'L00_PROOF_DATA',
    pathHints: ['data/behcs/orchestration', 'data/behcs/memory', 'reports'],
    rule: 'append_or_replace_owned_run_artifacts_only'
  },
  DOCS_TASKS: {
    id: 'L01_DOCS_TASKS',
    pathHints: ['TASKS.md', 'docs', 'reports'],
    rule: 'manual_hunk_review_for_shared_docs'
  },
  GATEWAY_SECURITY: {
    id: 'L02_GATEWAY_SECURITY',
    pathHints: ['src/gateway', 'routes/gateway.js', 'config/asolaria.gateway.json'],
    rule: 'exclusive_writer_reverse_gain_required'
  },
  BRAIN_WORKER: {
    id: 'L03_BRAIN_WORKER',
    pathHints: ['src/brainOrchestrator.js', 'src/brainPolicy.js', 'src/connectors/workerRouter.js', 'routes/workerRouter.js'],
    rule: 'exclusive_writer_codex_harness_contract_first'
  },
  PLUGIN_SKILL: {
    id: 'L04_PLUGIN_SKILL',
    pathHints: ['src/skillRegistry.js', 'src/skillRunner.js', 'skills', 'routes/hooks.js', 'src/connectors/hooksConnector.js'],
    rule: 'exclusive_writer_plugin_contract_tests_first'
  },
  BROWSER_DESKTOP: {
    id: 'L05_BROWSER_DESKTOP',
    pathHints: ['src/connectors/chromeConnector.js', 'src/connectors/desktopCaptureConnector.js', 'src/connectors/desktopControlConnector.js', 'public'],
    rule: 'exclusive_writer_look_type_look_required'
  },
  VOICE_MEDIA_CHANNELS: {
    id: 'L06_VOICE_MEDIA_CHANNELS',
    pathHints: ['src/connectors/telegramConnector.js', 'src/connectors/slackConnector.js', 'src/connectors/googleConnector.js', 'src/connectors/microsoftConnector.js', 'src/connectors/screenshotConnector.js'],
    rule: 'exclusive_writer_synthetic_channel_fixtures_first'
  },
  MEMORY_INDEX: {
    id: 'L07_MEMORY_INDEX',
    pathHints: ['src/memoryStore.js', 'src/semanticKnowledgeStore.js', 'services/memory-indexer', 'data/memory.json'],
    rule: 'exclusive_writer_backup_before_runtime_memory_change'
  },
  MCP_PROCESS: {
    id: 'L08_MCP_PROCESS',
    pathHints: ['mcp-servers', 'src/gateway', 'services/sandbox-manager', 'tools'],
    rule: 'exclusive_writer_process_lifecycle_proof_required'
  },
  FEDERATION_DEVICE: {
    id: 'L09_FEDERATION_DEVICE',
    pathHints: ['sovereignty', 'runtime', 'data/behcs/device-registry.json', 'runtime/outbound-liris-inbox.ndjson'],
    rule: 'exclusive_writer_no_peer_mutation_without_destination_cosign'
  },
  TESTS_CI: {
    id: 'L10_TESTS_CI',
    pathHints: ['tests', 'tools', 'package.json'],
    rule: 'one_test_harness_writer_at_a_time'
  }
};

const CASCADES = [
  {
    id: 'C0-proof-topology',
    title: 'Proof And Topology Spark',
    energyMode: 'spark',
    objective: 'Freeze evidence, classify ownership, bind supervisors, and mint language before implementation.',
    phases: ['p01-release-freeze-proof-intake', 'p02-diff-taxonomy-file-ownership', 'p03-hermes-shannon-supervisor-binding', 'p04-behcs256-glyph-language-update'],
    parallelism: 2,
    barrier: 'source_evidence_and_language_ready'
  },
  {
    id: 'C1-safety-authority',
    title: 'Safety And Authority Rail',
    energyMode: 'shield',
    objective: 'Lay auth, gateway, CI, and rollout rails before core runtime changes.',
    phases: ['p06-provider-runtime-auth-boundaries', 'p13-gateway-pairing-node-security', 'p19-synthetic-ci-test-harness', 'p20-rollout-recovery-governance'],
    parallelism: 2,
    barrier: 'auth_gateway_ci_rollout_ready'
  },
  {
    id: 'C2-core-runtime',
    title: 'Core Runtime Forge',
    energyMode: 'forge',
    objective: 'Upgrade model catalogs, Codex harness, plugin seams, MCP cleanup, sessions, memory, and diagnostics.',
    phases: ['p05-model-catalog-manifest-alignment', 'p07-codex-harness-parity', 'p08-plugin-sdk-tool-result-middleware', 'p11-mcp-lifecycle-cleanup', 'p12-session-compaction-transcript-hygiene', 'p14-memory-hybrid-search-indexer', 'p15-diagnostics-otel-trace-context'],
    parallelism: 3,
    barrier: 'core_runtime_contracts_and_tests_ready'
  },
  {
    id: 'C3-interaction-surfaces',
    title: 'Interaction Surface Current',
    energyMode: 'current',
    objective: 'Build browser, voice/meeting, messaging, and media surfaces on top of safety and core contracts.',
    phases: ['p09-browser-coordinate-control', 'p10-realtime-voice-meeting-lanes', 'p16-messaging-channel-robustness', 'p17-audio-tts-media-handling'],
    parallelism: 2,
    barrier: 'synthetic_interaction_fixtures_pass'
  },
  {
    id: 'C4-federation-rollout',
    title: 'Federation Gravity',
    energyMode: 'gravity',
    objective: 'Repair D23 federation weakness and project onto Acer/Liris/Falcon only after local proof exists.',
    phases: ['p18-liris-falcon-trinity-deployment'],
    parallelism: 1,
    barrier: 'reviewed_deployment_projection_ready'
  }
];

const PHASE_SPECS = {
  'p01-release-freeze-proof-intake': {
    executor: 'sentinel-proof-freezer',
    type: 'artifact_executor',
    writeLocks: ['L00_PROOF_DATA', 'L01_DOCS_TASKS'],
    readLocks: ['L00_PROOF_DATA'],
    outputMode: 'proof_seal',
    energy: { cpu: 1, io: 4, ram: 1, network: 0, attention: 3, thermal: 1 }
  },
  'p02-diff-taxonomy-file-ownership': {
    executor: 'rook-diff-cartographer',
    type: 'analysis_executor',
    writeLocks: ['L00_PROOF_DATA'],
    readLocks: ['L00_PROOF_DATA', 'L01_DOCS_TASKS'],
    outputMode: 'ownership_table',
    energy: { cpu: 2, io: 4, ram: 2, network: 0, attention: 3, thermal: 1 }
  },
  'p03-hermes-shannon-supervisor-binding': {
    executor: 'hermes-authority-binder',
    type: 'supervisor_executor',
    writeLocks: ['L00_PROOF_DATA'],
    readLocks: ['L00_PROOF_DATA'],
    outputMode: 'supervisor_packets',
    energy: { cpu: 2, io: 3, ram: 1, network: 0, attention: 4, thermal: 1 }
  },
  'p04-behcs256-glyph-language-update': {
    executor: 'vector-glyph-minter',
    type: 'language_executor',
    writeLocks: ['L00_PROOF_DATA'],
    readLocks: ['L00_PROOF_DATA'],
    outputMode: 'glpj_language',
    energy: { cpu: 2, io: 3, ram: 2, network: 0, attention: 4, thermal: 1 }
  },
  'p05-model-catalog-manifest-alignment': {
    executor: 'selector-model-catalog-builder',
    type: 'implementation_executor',
    writeLocks: ['L03_BRAIN_WORKER', 'L04_PLUGIN_SKILL', 'L10_TESTS_CI'],
    readLocks: ['L00_PROOF_DATA', 'L03_BRAIN_WORKER'],
    outputMode: 'contract_then_code',
    energy: { cpu: 3, io: 3, ram: 3, network: 0, attention: 4, thermal: 2 }
  },
  'p06-provider-runtime-auth-boundaries': {
    executor: 'sentinel-provider-boundary-guard',
    type: 'policy_executor',
    writeLocks: ['L02_GATEWAY_SECURITY', 'L03_BRAIN_WORKER', 'L10_TESTS_CI'],
    readLocks: ['L00_PROOF_DATA', 'L02_GATEWAY_SECURITY', 'L03_BRAIN_WORKER'],
    outputMode: 'auth_contract_tests',
    energy: { cpu: 2, io: 3, ram: 2, network: 0, attention: 5, thermal: 1 }
  },
  'p07-codex-harness-parity': {
    executor: 'brain-codex-harness-builder',
    type: 'implementation_executor',
    writeLocks: ['L03_BRAIN_WORKER', 'L10_TESTS_CI'],
    readLocks: ['L00_PROOF_DATA', 'L03_BRAIN_WORKER', 'L04_PLUGIN_SKILL'],
    outputMode: 'harness_parity_tests_then_code',
    energy: { cpu: 4, io: 3, ram: 4, network: 0, attention: 5, thermal: 2 }
  },
  'p08-plugin-sdk-tool-result-middleware': {
    executor: 'forge-plugin-middleware-builder',
    type: 'implementation_executor',
    writeLocks: ['L04_PLUGIN_SKILL', 'L10_TESTS_CI'],
    readLocks: ['L00_PROOF_DATA', 'L03_BRAIN_WORKER', 'L04_PLUGIN_SKILL'],
    outputMode: 'plugin_contract_tests_then_code',
    energy: { cpu: 3, io: 3, ram: 3, network: 0, attention: 4, thermal: 2 }
  },
  'p09-browser-coordinate-control': {
    executor: 'falcon-browser-coordinate-builder',
    type: 'interaction_executor',
    writeLocks: ['L05_BROWSER_DESKTOP', 'L10_TESTS_CI'],
    readLocks: ['L00_PROOF_DATA', 'L05_BROWSER_DESKTOP'],
    outputMode: 'synthetic_browser_fixture_then_code',
    energy: { cpu: 3, io: 3, ram: 3, network: 0, attention: 5, thermal: 2 }
  },
  'p10-realtime-voice-meeting-lanes': {
    executor: 'gaia-voice-meet-lane-builder',
    type: 'interaction_executor',
    writeLocks: ['L06_VOICE_MEDIA_CHANNELS', 'L10_TESTS_CI'],
    readLocks: ['L00_PROOF_DATA', 'L02_GATEWAY_SECURITY', 'L06_VOICE_MEDIA_CHANNELS'],
    outputMode: 'dry_run_fixtures_before_live_paths',
    energy: { cpu: 3, io: 3, ram: 4, network: 0, attention: 5, thermal: 2 }
  },
  'p11-mcp-lifecycle-cleanup': {
    executor: 'dasein-mcp-lifecycle-cleaner',
    type: 'process_lifecycle_executor',
    writeLocks: ['L08_MCP_PROCESS', 'L10_TESTS_CI'],
    readLocks: ['L00_PROOF_DATA', 'L02_GATEWAY_SECURITY', 'L08_MCP_PROCESS'],
    outputMode: 'process_fixture_tests_then_code',
    energy: { cpu: 3, io: 4, ram: 3, network: 0, attention: 4, thermal: 2 }
  },
  'p12-session-compaction-transcript-hygiene': {
    executor: 'helm-session-hygiene-builder',
    type: 'runtime_state_executor',
    writeLocks: ['L03_BRAIN_WORKER', 'L07_MEMORY_INDEX', 'L10_TESTS_CI'],
    readLocks: ['L00_PROOF_DATA', 'L03_BRAIN_WORKER', 'L07_MEMORY_INDEX'],
    outputMode: 'migration_backup_tests_then_code',
    energy: { cpu: 4, io: 4, ram: 4, network: 0, attention: 5, thermal: 2 }
  },
  'p13-gateway-pairing-node-security': {
    executor: 'sentinel-gateway-pairing-hardener',
    type: 'security_executor',
    writeLocks: ['L02_GATEWAY_SECURITY', 'L10_TESTS_CI'],
    readLocks: ['L00_PROOF_DATA', 'L02_GATEWAY_SECURITY'],
    outputMode: 'security_tests_then_code',
    energy: { cpu: 3, io: 3, ram: 3, network: 0, attention: 5, thermal: 2 }
  },
  'p14-memory-hybrid-search-indexer': {
    executor: 'rook-memory-index-builder',
    type: 'memory_executor',
    writeLocks: ['L07_MEMORY_INDEX', 'L10_TESTS_CI'],
    readLocks: ['L00_PROOF_DATA', 'L07_MEMORY_INDEX'],
    outputMode: 'backup_fixture_tests_then_code',
    energy: { cpu: 4, io: 4, ram: 4, network: 0, attention: 4, thermal: 2 }
  },
  'p15-diagnostics-otel-trace-context': {
    executor: 'forge-diagnostics-trace-builder',
    type: 'diagnostics_executor',
    writeLocks: ['L02_GATEWAY_SECURITY', 'L03_BRAIN_WORKER', 'L10_TESTS_CI'],
    readLocks: ['L00_PROOF_DATA', 'L02_GATEWAY_SECURITY', 'L03_BRAIN_WORKER'],
    outputMode: 'redaction_tests_then_code',
    energy: { cpu: 3, io: 3, ram: 3, network: 0, attention: 4, thermal: 2 }
  },
  'p16-messaging-channel-robustness': {
    executor: 'falcon-channel-robustness-builder',
    type: 'channel_executor',
    writeLocks: ['L06_VOICE_MEDIA_CHANNELS', 'L10_TESTS_CI'],
    readLocks: ['L00_PROOF_DATA', 'L06_VOICE_MEDIA_CHANNELS'],
    outputMode: 'synthetic_channel_fixtures_then_code',
    energy: { cpu: 3, io: 3, ram: 3, network: 0, attention: 4, thermal: 2 }
  },
  'p17-audio-tts-media-handling': {
    executor: 'gaia-media-transcode-builder',
    type: 'media_executor',
    writeLocks: ['L06_VOICE_MEDIA_CHANNELS', 'L10_TESTS_CI'],
    readLocks: ['L00_PROOF_DATA', 'L06_VOICE_MEDIA_CHANNELS'],
    outputMode: 'synthetic_media_fixtures_then_code',
    energy: { cpu: 4, io: 4, ram: 4, network: 0, attention: 4, thermal: 3 }
  },
  'p18-liris-falcon-trinity-deployment': {
    executor: 'helm-federation-gravity-router',
    type: 'deployment_projection_executor',
    writeLocks: ['L09_FEDERATION_DEVICE', 'L00_PROOF_DATA'],
    readLocks: ['L00_PROOF_DATA', 'L09_FEDERATION_DEVICE'],
    outputMode: 'projection_only_until_local_tranche_passes',
    energy: { cpu: 2, io: 3, ram: 2, network: 0, attention: 5, thermal: 1 }
  },
  'p19-synthetic-ci-test-harness': {
    executor: 'forge-synthetic-ci-builder',
    type: 'test_executor',
    writeLocks: ['L10_TESTS_CI'],
    readLocks: ['L00_PROOF_DATA', 'L02_GATEWAY_SECURITY', 'L03_BRAIN_WORKER', 'L04_PLUGIN_SKILL', 'L05_BROWSER_DESKTOP', 'L06_VOICE_MEDIA_CHANNELS', 'L07_MEMORY_INDEX', 'L08_MCP_PROCESS'],
    outputMode: 'test_harness_first',
    energy: { cpu: 4, io: 4, ram: 4, network: 0, attention: 5, thermal: 3 }
  },
  'p20-rollout-recovery-governance': {
    executor: 'helm-rollout-governor',
    type: 'rollout_executor',
    writeLocks: ['L01_DOCS_TASKS', 'L00_PROOF_DATA'],
    readLocks: ['L00_PROOF_DATA', 'L10_TESTS_CI'],
    outputMode: 'rollback_notes_and_tranche_plan',
    energy: { cpu: 2, io: 3, ram: 2, network: 0, attention: 5, thermal: 1 }
  }
};

const DEPENDENCIES = {
  'p01-release-freeze-proof-intake': [],
  'p02-diff-taxonomy-file-ownership': ['p01-release-freeze-proof-intake'],
  'p03-hermes-shannon-supervisor-binding': ['p01-release-freeze-proof-intake', 'p02-diff-taxonomy-file-ownership'],
  'p04-behcs256-glyph-language-update': ['p01-release-freeze-proof-intake', 'p02-diff-taxonomy-file-ownership'],
  'p05-model-catalog-manifest-alignment': ['p01-release-freeze-proof-intake', 'p02-diff-taxonomy-file-ownership', 'p06-provider-runtime-auth-boundaries', 'p19-synthetic-ci-test-harness'],
  'p06-provider-runtime-auth-boundaries': ['p01-release-freeze-proof-intake', 'p02-diff-taxonomy-file-ownership'],
  'p07-codex-harness-parity': ['p03-hermes-shannon-supervisor-binding', 'p06-provider-runtime-auth-boundaries', 'p19-synthetic-ci-test-harness'],
  'p08-plugin-sdk-tool-result-middleware': ['p03-hermes-shannon-supervisor-binding', 'p06-provider-runtime-auth-boundaries', 'p19-synthetic-ci-test-harness'],
  'p09-browser-coordinate-control': ['p06-provider-runtime-auth-boundaries', 'p13-gateway-pairing-node-security', 'p19-synthetic-ci-test-harness'],
  'p10-realtime-voice-meeting-lanes': ['p06-provider-runtime-auth-boundaries', 'p13-gateway-pairing-node-security', 'p19-synthetic-ci-test-harness'],
  'p11-mcp-lifecycle-cleanup': ['p06-provider-runtime-auth-boundaries', 'p13-gateway-pairing-node-security', 'p19-synthetic-ci-test-harness'],
  'p12-session-compaction-transcript-hygiene': ['p07-codex-harness-parity', 'p14-memory-hybrid-search-indexer', 'p19-synthetic-ci-test-harness'],
  'p13-gateway-pairing-node-security': ['p01-release-freeze-proof-intake', 'p06-provider-runtime-auth-boundaries'],
  'p14-memory-hybrid-search-indexer': ['p01-release-freeze-proof-intake', 'p19-synthetic-ci-test-harness'],
  'p15-diagnostics-otel-trace-context': ['p06-provider-runtime-auth-boundaries', 'p13-gateway-pairing-node-security', 'p19-synthetic-ci-test-harness'],
  'p16-messaging-channel-robustness': ['p06-provider-runtime-auth-boundaries', 'p13-gateway-pairing-node-security', 'p19-synthetic-ci-test-harness'],
  'p17-audio-tts-media-handling': ['p06-provider-runtime-auth-boundaries', 'p13-gateway-pairing-node-security', 'p19-synthetic-ci-test-harness'],
  'p18-liris-falcon-trinity-deployment': ['p05-model-catalog-manifest-alignment', 'p07-codex-harness-parity', 'p09-browser-coordinate-control', 'p10-realtime-voice-meeting-lanes', 'p11-mcp-lifecycle-cleanup', 'p13-gateway-pairing-node-security', 'p16-messaging-channel-robustness', 'p17-audio-tts-media-handling'],
  'p19-synthetic-ci-test-harness': ['p01-release-freeze-proof-intake', 'p02-diff-taxonomy-file-ownership'],
  'p20-rollout-recovery-governance': ['p03-hermes-shannon-supervisor-binding', 'p19-synthetic-ci-test-harness']
};

function rel(p) {
  return path.join(ROOT, p);
}

function repoRel(p) {
  return path.relative(ROOT, p).replace(/\\/g, '/');
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeJson(filePath, data) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function writeText(filePath, text) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, text.endsWith('\n') ? text : `${text}\n`, 'utf8');
}

function appendNdjson(filePath, data) {
  ensureDir(filePath);
  fs.appendFileSync(filePath, `${JSON.stringify(data)}\n`, 'utf8');
}

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_) {
    return fallback;
  }
}

function readNdjson(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function glyph(kind, id, seed) {
  const hash = sha256(`${kind}:${id}:${seed || ''}`);
  return `HG256:${kind.toUpperCase()}:${hash.slice(0, 8).toUpperCase()}:${behcs.hilbertAddress(hash)}`;
}

function phaseCascadeId(phaseId) {
  return CASCADES.find((cascade) => cascade.phases.includes(phaseId))?.id || 'unassigned';
}

function energyScore(energy) {
  return Object.entries(energy).reduce((sum, [key, value]) => {
    const weight = key === 'attention' ? 2 : key === 'thermal' ? 1.5 : 1;
    return sum + value * weight;
  }, 0);
}

function loadPhaseTasks() {
  const tasks = readNdjson(SOURCE_PATHS.tasksNdjson);
  const byPhase = new Map();
  for (const task of tasks) {
    const list = byPhase.get(task.phaseId) || [];
    list.push(task);
    byPhase.set(task.phaseId, list);
  }
  return byPhase;
}

function buildExecutors(generatedAt) {
  const phaseInventory = readJson(SOURCE_PATHS.phaseInventory, { phases: [] });
  const phaseTasks = loadPhaseTasks();
  return phaseInventory.phases.map((phase) => {
    const spec = PHASE_SPECS[phase.id];
    if (!spec) throw new Error(`Missing executor spec for ${phase.id}`);
    const tasks = phaseTasks.get(phase.id) || [];
    return {
      id: `exec-${phase.id}`,
      generatedAt,
      phaseId: phase.id,
      phaseIndex: phase.index,
      title: phase.title,
      executor: spec.executor,
      owner: phase.owner,
      lane: phase.lane,
      cascade: phaseCascadeId(phase.id),
      type: spec.type,
      outputMode: spec.outputMode,
      status: 'READY_FOR_REVIEWED_IMPLEMENTATION',
      stepCount: tasks.length,
      stepIds: tasks.map((task) => task.id),
      dependencies: DEPENDENCIES[phase.id] || [],
      writeLocks: spec.writeLocks,
      readLocks: spec.readLocks,
      energy: {
        ...spec.energy,
        score: Number(energyScore(spec.energy).toFixed(2)),
        unit: 'local_energy_not_tokens',
        policy: 'schedule by heat/io/attention/lock contention, not prompt tokens'
      },
      allowedActions: [
        'read source artifacts',
        'write owned local tranche artifacts',
        'write tests before runtime implementation',
        'update memory/index/map/cube/GLPJ after reviewed tranche'
      ],
      blockedActions: [
        'provider auth bypass',
        'payment bypass',
        'uncontrolled fanout',
        'remote mutation',
        'secret extraction',
        'firmware mutation',
        'destructive delete'
      ],
      evidenceRequired: [
        repoRel(SOURCE_PATHS.aggregate),
        repoRel(SOURCE_PATHS.phaseInventory),
        repoRel(SOURCE_PATHS.tasksNdjson),
        repoRel(PATHS.executorContracts)
      ],
      glyph: glyph('openclaw424_executor', phase.id, `${generatedAt}:${spec.executor}`)
    };
  });
}

function conflict(a, b) {
  const aWrites = new Set(a.writeLocks);
  const bWrites = new Set(b.writeLocks);
  const aReads = new Set(a.readLocks);
  const bReads = new Set(b.readLocks);
  const writeWrite = [...aWrites].filter((lock) => bWrites.has(lock));
  const writeRead = [...aWrites].filter((lock) => bReads.has(lock));
  const readWrite = [...aReads].filter((lock) => bWrites.has(lock));
  const locks = Array.from(new Set([...writeWrite, ...writeRead, ...readWrite]));
  return {
    conflicts: locks.length > 0,
    locks,
    reason: locks.length > 0 ? 'shared write/read lock requires order or barrier' : 'no lock collision'
  };
}

function buildLockMatrix(executors, generatedAt) {
  const lockUse = {};
  for (const executor of executors) {
    for (const lock of executor.writeLocks) {
      lockUse[lock] = lockUse[lock] || { writers: [], readers: [] };
      lockUse[lock].writers.push(executor.id);
    }
    for (const lock of executor.readLocks) {
      lockUse[lock] = lockUse[lock] || { writers: [], readers: [] };
      lockUse[lock].readers.push(executor.id);
    }
  }
  const pairs = [];
  for (let i = 0; i < executors.length; i += 1) {
    for (let j = i + 1; j < executors.length; j += 1) {
      const result = conflict(executors[i], executors[j]);
      if (result.conflicts) {
        pairs.push({
          a: executors[i].id,
          b: executors[j].id,
          locks: result.locks,
          reason: result.reason
        });
      }
    }
  }
  return {
    matrixId: 'openclaw-424-executor-lock-matrix.v1',
    generatedAt,
    rule: 'parallel execution is allowed only when write lock sets are disjoint and dependency barriers are satisfied',
    locks: Object.fromEntries(Object.entries(LOCKS).map(([, lock]) => [lock.id, lock])),
    lockUse,
    conflictPairCount: pairs.length,
    conflictPairs: pairs
  };
}

function buildCascadeDivision(executors, lockMatrix, generatedAt) {
  return {
    divisionId: 'openclaw-424-cascade-division.v1',
    generatedAt,
    rule: 'Run cascades by energy waves. Inside a cascade, run only executors with disjoint write locks; otherwise split into micro-waves.',
    cascades: CASCADES.map((cascade) => {
      const members = executors.filter((executor) => executor.cascade === cascade.id);
      return {
        ...cascade,
        executors: members.map((executor) => executor.id),
        totalEnergyScore: Number(members.reduce((sum, executor) => sum + executor.energy.score, 0).toFixed(2)),
        writeLocks: Array.from(new Set(members.flatMap((executor) => executor.writeLocks))).sort(),
        microWaves: planMicroWaves(members)
      };
    }),
    globalBarriers: [
      'C0 must finish before C1/C2 implementation edits.',
      'C1 safety rails must finish before C3 interaction surfaces.',
      'C2 core runtime must finish before C4 federation projection.',
      'C3 interaction surfaces must finish before C4 deployment projection.',
      'C4 remains projection-only until local implementation tranches pass review.'
    ],
    collisionPairCount: lockMatrix.conflictPairCount
  };
}

function planMicroWaves(executors) {
  const pending = [...executors].sort((a, b) => b.energy.score - a.energy.score);
  const waves = [];
  while (pending.length > 0) {
    const wave = [];
    const waveWriteLocks = new Set();
    for (let i = pending.length - 1; i >= 0; i -= 1) {
      const executor = pending[i];
      const overlaps = executor.writeLocks.some((lock) => waveWriteLocks.has(lock))
        || wave.some((existing) => conflict(executor, existing).conflicts);
      if (!overlaps) {
        wave.push(executor);
        for (const lock of executor.writeLocks) waveWriteLocks.add(lock);
        pending.splice(i, 1);
      }
    }
    waves.push({
      id: `micro-${String(waves.length + 1).padStart(2, '0')}`,
      executors: wave.map((executor) => executor.id),
      writeLocks: Array.from(waveWriteLocks).sort(),
      energyScore: Number(wave.reduce((sum, executor) => sum + executor.energy.score, 0).toFixed(2))
    });
  }
  return waves;
}

function buildEnergyBudget(executors, cascadeDivision, generatedAt) {
  const totals = executors.reduce((acc, executor) => {
    for (const [key, value] of Object.entries(executor.energy)) {
      if (typeof value === 'number') acc[key] = Number(((acc[key] || 0) + value).toFixed(2));
    }
    return acc;
  }, {});
  return {
    budgetId: 'openclaw-424-energy-budget.v1',
    generatedAt,
    principle: 'Think energy, not tokens: schedule work by lock contention, heat, IO, RAM, CPU, and human review attention.',
    tokenPolicy: {
      tokensAreNotSchedulerCurrency: true,
      externalProviderSessionsDefault: false,
      localArtifactsFirst: true
    },
    systemPolicy: {
      maxConcurrentHeavyExecutors: 2,
      maxConcurrentMediumExecutors: 3,
      pauseIfThermalOrRamPressureHigh: true,
      checkpointAfterEveryMicroWave: true,
      requireCleanEvidenceBeforeNextBarrier: true
    },
    totalEnergy: totals,
    cascadeEnergy: cascadeDivision.cascades.map((cascade) => ({
      cascade: cascade.id,
      energyMode: cascade.energyMode,
      totalEnergyScore: cascade.totalEnergyScore,
      microWaveCount: cascade.microWaves.length,
      recommendedParallelism: cascade.parallelism
    })),
    executorEnergy: executors.map((executor) => ({
      id: executor.id,
      executor: executor.executor,
      phaseId: executor.phaseId,
      cascade: executor.cascade,
      score: executor.energy.score,
      cpu: executor.energy.cpu,
      io: executor.energy.io,
      ram: executor.energy.ram,
      network: executor.energy.network,
      attention: executor.energy.attention,
      thermal: executor.energy.thermal
    }))
  };
}

function buildCollisionReport(executors, cascadeDivision, lockMatrix, generatedAt) {
  const unsafeSameMicroWave = [];
  const byId = new Map(executors.map((executor) => [executor.id, executor]));
  for (const cascade of cascadeDivision.cascades) {
    for (const wave of cascade.microWaves) {
      for (let i = 0; i < wave.executors.length; i += 1) {
        for (let j = i + 1; j < wave.executors.length; j += 1) {
          const result = conflict(byId.get(wave.executors[i]), byId.get(wave.executors[j]));
          if (result.conflicts) {
            unsafeSameMicroWave.push({
              cascade: cascade.id,
              microWave: wave.id,
              a: wave.executors[i],
              b: wave.executors[j],
              locks: result.locks
            });
          }
        }
      }
    }
  }
  return {
    reportId: 'openclaw-424-executor-collision-report.v1',
    generatedAt,
    status: unsafeSameMicroWave.length === 0 ? 'NO_MICROWAVE_COLLISIONS' : 'MICROWAVE_COLLISIONS_REQUIRE_REPLAN',
    totalExecutors: executors.length,
    knownConflictPairs: lockMatrix.conflictPairCount,
    unsafeSameMicroWaveCount: unsafeSameMicroWave.length,
    unsafeSameMicroWave,
    rule: 'Known conflicts are acceptable only across different micro-waves or barrier-separated cascades.'
  };
}

function buildSupervisorPackets(executors, generatedAt) {
  return executors.map((executor) => ({
    id: `ASO-OPENCLAW-424-EXECUTOR-SUP-${executor.phaseId}`,
    generatedAt,
    title: `${executor.executor} contract gate`,
    objective: `Gate executor ${executor.executor} for ${executor.title}.`,
    instructions: 'Verify dependencies, write locks, energy budget, evidence refs, and no-collision cascade placement before implementation.',
    requestedWorker: 'local_executor_contract_review',
    pid: `BH.ASO.OPENCLAW.424.EXEC.${executor.phaseId.toUpperCase().replace(/[^A-Z0-9]+/g, '.')}`,
    pidScope: 'local_executor_contract_only',
    consentScope: 'operator_authorized_local_planning',
    allowedPaths: [
      repoRel(RUN_ROOT),
      'data/behcs/orchestration',
      'data/behcs/maps/asolaria',
      'data/behcs/cubes',
      'reports'
    ],
    expectedArtifacts: [
      repoRel(PATHS.executorContracts),
      repoRel(PATHS.cascadeDivision),
      repoRel(PATHS.lockMatrix),
      repoRel(PATHS.energyBudget),
      repoRel(PATHS.collisionReport)
    ],
    acceptanceGates: [
      'dependencies_named',
      'write_locks_named',
      'micro_wave_no_collision',
      'energy_budget_present',
      'no_external_worker_spawn'
    ],
    proofRequired: true,
    proofRefs: [repoRel(PATHS.executorContracts), repoRel(PATHS.cascadeDivision), repoRel(PATHS.collisionReport)],
    syntheticFirstEvidence: true,
    modelCard: true,
    providerAuthMode: 'none_local_contract_only',
    remoteMutation: false,
    externalApiCall: false,
    cloudUpload: false,
    downloads: false,
    installs: false,
    writesGit: false,
    deletesEvidence: false,
    sensitiveData: false,
    secretMaterial: false,
    bypassAuth: false,
    bypassPayment: false,
    needsCloudWorker: false,
    source: 'asolaria-openclaw-424-executor-matrix'
  }));
}

function buildMemoryIndexMapCubeGlpj(generatedAt, executors, cascadeDivision, lockMatrix, energyBudget, collisionReport) {
  const memory = {
    eventId: 'openclaw-424-executor-matrix.v1',
    generatedAt,
    status: collisionReport.status,
    significance: 'The OpenClaw 4.24 200-step plan now has executor contracts, lock ownership, energy scheduling, and cascade micro-waves. This turns the plan into buildable non-colliding work without treating tokens as the scheduling currency.',
    sourceRun: SOURCE_RUN,
    executorCount: executors.length,
    cascadeCount: cascadeDivision.cascades.length,
    conflictPairs: lockMatrix.conflictPairCount,
    unsafeSameMicroWaveCount: collisionReport.unsafeSameMicroWaveCount,
    energyPrinciple: energyBudget.principle
  };
  const index = {
    indexId: 'openclaw-424-executor-matrix-index.v1',
    generatedAt,
    status: 'INDEX_READY_OPENCLAW_424_EXECUTOR_MATRIX',
    keys: [
      'executor matrix',
      'energy not tokens',
      'cascade division',
      'write locks',
      'micro-waves',
      'non-collision build',
      'OpenClaw 4.24',
      '200-step implementation queue',
      'D23 federation repair',
      'Hermes',
      'Shannon',
      'BEHCS-256'
    ],
    artifacts: outputs()
  };
  const map = {
    mapId: 'openclaw-424-executor-matrix-map-map-mapped.v1',
    generatedAt,
    status: 'MAP_MAP_MAPPED_READY_OPENCLAW_424_EXECUTORS',
    routes: [
      { from: '200_step_execution_plan', to: 'executor_contracts', edge: 'materializes_phase_executors', artifact: repoRel(PATHS.executorContracts) },
      { from: 'executor_contracts', to: 'lock_matrix', edge: 'declares_no_bump_heads_rules', artifact: repoRel(PATHS.lockMatrix) },
      { from: 'lock_matrix', to: 'cascade_micro_waves', edge: 'splits_parallel_work_by_write_locks', artifact: repoRel(PATHS.cascadeDivision) },
      { from: 'energy_budget', to: 'scheduler_policy', edge: 'uses_cpu_io_ram_heat_attention_not_tokens', artifact: repoRel(PATHS.energyBudget) },
      { from: 'collision_report', to: 'implementation_queue', edge: 'allows_reviewed_tranches_only_if_micro_waves_clean', artifact: repoRel(PATHS.collisionReport) }
    ]
  };
  const cube = buildCube(generatedAt, executors, cascadeDivision, lockMatrix, energyBudget, collisionReport);
  const glpj = {
    glpjId: 'openclaw-424-executor-matrix-behcs256.glpj',
    generatedAt,
    status: 'BEHCS256_OPENCLAW_424_EXECUTOR_MATRIX_GLYPHS_MINTED',
    alphabetBase: 256,
    mints: [
      ['executor_contracts', PATHS.executorContracts, 'D42_ORCHESTRATION'],
      ['executor_locks', PATHS.lockMatrix, 'D29_ACL_SIGNATURE'],
      ['cascade_division', PATHS.cascadeDivision, 'D9_WAVE'],
      ['energy_budget', PATHS.energyBudget, 'D14_ENERGY'],
      ['collision_report', PATHS.collisionReport, 'D11_PROOF'],
      ['executor_memory', PATHS.memory, 'D11_PROOF'],
      ['executor_map', PATHS.map, 'D35_HYPERLANGUAGE'],
      ['executor_cube', PATHS.cube, 'D42_ORCHESTRATION']
    ].map(([id, artifact, dimension]) => ({
      id,
      dimension,
      artifact: repoRel(artifact),
      glyph: glyph('openclaw424_executor_matrix', id, `${generatedAt}:${artifact}`)
    })),
    executorGlyphs: executors.map((executor) => ({
      executor: executor.executor,
      phaseId: executor.phaseId,
      glyph: executor.glyph
    }))
  };
  return { memory, index, map, cube, glpj };
}

function buildCube(generatedAt, executors, cascadeDivision, lockMatrix, energyBudget, collisionReport) {
  const cube = {
    id: 'openclaw-424-executor-matrix-cube-cubed',
    generatedAt,
    status: 'CUBE_CUBE_CUBED_READY_EXECUTOR_MATRIX',
    sourceRun: SOURCE_RUN,
    dimensions: {
      D9_WAVE: 'cascade_micro_waves',
      D11_PROOF: 'collision_report_and_supervisor_queue',
      D14_ENERGY: 'energy_not_tokens_scheduler',
      D15_DEVICE: 'local_resource_pressure_awareness',
      D23_FEDERATION: 'federation_repair_separate_gravity_cascade',
      D24_INTENT: 'build_fast_without_bumping_heads',
      D29_ACL_SIGNATURE: 'write_lock_matrix',
      D35_HYPERLANGUAGE: 'map_map_mapped_executor_routes',
      D42_ORCHESTRATION: 'executor_contracts_and_ready_queue'
    },
    executorCount: executors.length,
    cascades: cascadeDivision.cascades.map((cascade) => ({
      id: cascade.id,
      energyMode: cascade.energyMode,
      executors: cascade.executors,
      microWaveCount: cascade.microWaves.length,
      totalEnergyScore: cascade.totalEnergyScore
    })),
    locks: Object.keys(lockMatrix.locks),
    energy: {
      totalScore: energyBudget.totalEnergy.score,
      principle: energyBudget.principle
    },
    collision: {
      knownConflictPairs: lockMatrix.conflictPairCount,
      unsafeSameMicroWaveCount: collisionReport.unsafeSameMicroWaveCount,
      status: collisionReport.status
    },
    artifacts: outputs()
  };
  return `// cube: openclaw-424-executor-matrix-cube-cubed | BEHCS-256 | energy not tokens\nexport const CUBE = ${JSON.stringify(cube, null, 2)}\n`;
}

function prepare({ execute = false } = {}) {
  const generatedAt = new Date().toISOString();
  const executors = buildExecutors(generatedAt);
  const lockMatrix = buildLockMatrix(executors, generatedAt);
  const cascadeDivision = buildCascadeDivision(executors, lockMatrix, generatedAt);
  const energyBudget = buildEnergyBudget(executors, cascadeDivision, generatedAt);
  const collisionReport = buildCollisionReport(executors, cascadeDivision, lockMatrix, generatedAt);
  const supervisorPackets = buildSupervisorPackets(executors, generatedAt);
  const { memory, index, map, cube, glpj } = buildMemoryIndexMapCubeGlpj(
    generatedAt,
    executors,
    cascadeDivision,
    lockMatrix,
    energyBudget,
    collisionReport
  );
  const report = {
    reportId: 'openclaw-424-executor-matrix-latest',
    generatedAt,
    status: collisionReport.status,
    runId: RUN_ID,
    sourceRun: SOURCE_RUN,
    executorCount: executors.length,
    cascadeCount: cascadeDivision.cascades.length,
    conflictPairCount: lockMatrix.conflictPairCount,
    unsafeSameMicroWaveCount: collisionReport.unsafeSameMicroWaveCount,
    energyPrinciple: energyBudget.principle,
    outputs: outputs()
  };

  if (execute) {
    writeJson(PATHS.executorContracts, {
      contractId: 'openclaw-424-executor-contracts.v1',
      generatedAt,
      sourceRun: SOURCE_RUN,
      executorCount: executors.length,
      executors
    });
    writeText(PATHS.executorContractsNdjson, executors.map((executor) => JSON.stringify(executor)).join('\n') + '\n');
    writeText(PATHS.executorReadyQueue, executors.map((executor) => JSON.stringify({
      id: `ready-${executor.id}`,
      generatedAt,
      executorId: executor.id,
      phaseId: executor.phaseId,
      cascade: executor.cascade,
      dependencies: executor.dependencies,
      writeLocks: executor.writeLocks,
      energy: executor.energy,
      status: 'READY_AFTER_SUPERVISOR_AND_BARRIER_REVIEW'
    })).join('\n') + '\n');
    writeText(PATHS.supervisorQueue, supervisorPackets.map((packet) => JSON.stringify(packet)).join('\n') + '\n');
    writeJson(PATHS.cascadeDivision, cascadeDivision);
    writeJson(PATHS.lockMatrix, lockMatrix);
    writeJson(PATHS.energyBudget, energyBudget);
    writeJson(PATHS.collisionReport, collisionReport);
    writeJson(PATHS.memory, memory);
    writeJson(PATHS.index, index);
    writeJson(PATHS.map, map);
    writeText(PATHS.cube, cube);
    writeJson(PATHS.glpj, glpj);
    writeJson(PATHS.reportJson, report);
    writeText(PATHS.reportMd, buildReportMd(report, executors, cascadeDivision, energyBudget, collisionReport));
    appendNdjson(PATHS.globalInbox, {
      id: `${RUN_ID}-prepare-${Date.now()}`,
      ts: generatedAt,
      from: 'asolaria-canonical',
      to: 'hermes-supervisor-of-supervisors',
      verb: 'EVT-OPENCLAW-424-EXECUTOR-MATRIX-PREPARED',
      body: {
        runId: RUN_ID,
        executorCount: executors.length,
        cascadeCount: cascadeDivision.cascades.length,
        status: collisionReport.status
      }
    });
    appendNdjson(PATHS.gnnEdges, {
      id: `${RUN_ID}-prepare-gnn-${Date.now()}`,
      ts: generatedAt,
      from: 'OPENCLAW_424_200_STEP_EXECUTION',
      to: 'ENERGY_EXECUTOR_MATRIX',
      verb: 'splits_work_by_locks_energy_and_barriers',
      weight: 0.999,
      executorCount: executors.length,
      unsafeSameMicroWaveCount: collisionReport.unsafeSameMicroWaveCount
    });
  }

  return {
    ok: true,
    action: execute ? 'prepare-write' : 'prepare-preview',
    generatedAt,
    status: collisionReport.status,
    runId: RUN_ID,
    executorCount: executors.length,
    cascadeCount: cascadeDivision.cascades.length,
    conflictPairCount: lockMatrix.conflictPairCount,
    unsafeSameMicroWaveCount: collisionReport.unsafeSameMicroWaveCount,
    outputs: outputs()
  };
}

function buildReportMd(report, executors, cascadeDivision, energyBudget, collisionReport) {
  const lines = [
    '# OpenClaw 4.24 Executor Matrix',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `Status: ${report.status}`,
    '',
    `- Source run: ${report.sourceRun}`,
    `- Executors: ${report.executorCount}`,
    `- Cascades: ${report.cascadeCount}`,
    `- Known lock conflict pairs: ${report.conflictPairCount}`,
    `- Unsafe same-micro-wave collisions: ${report.unsafeSameMicroWaveCount}`,
    `- Principle: ${energyBudget.principle}`,
    '',
    '## Cascades',
    ''
  ];
  for (const cascade of cascadeDivision.cascades) {
    lines.push(`### ${cascade.id} - ${cascade.title}`);
    lines.push(`- Energy mode: ${cascade.energyMode}`);
    lines.push(`- Parallelism: ${cascade.parallelism}`);
    lines.push(`- Barrier: ${cascade.barrier}`);
    lines.push(`- Executors: ${cascade.executors.join(', ')}`);
    lines.push(`- Micro-waves: ${cascade.microWaves.map((wave) => `${wave.id}[${wave.executors.join(', ')}]`).join(' | ')}`);
    lines.push('');
  }
  lines.push('## Executor Contracts', '');
  for (const executor of executors) {
    lines.push(`- ${executor.id}: ${executor.executor}; cascade=${executor.cascade}; locks=${executor.writeLocks.join(',')}; energy=${executor.energy.score}`);
  }
  lines.push('', '## Collision Result', '');
  lines.push(`- ${collisionReport.status}`);
  lines.push(`- Known conflict pairs are scheduled across separate micro-waves or cascade barriers.`);
  lines.push('', '## Outputs', '');
  for (const [key, value] of Object.entries(report.outputs || outputs())) {
    lines.push(`- ${key}: \`${Array.isArray(value) ? value.join(', ') : value}\``);
  }
  return `${lines.join('\n')}\n`;
}

function outputs() {
  return {
    runRoot: repoRel(PATHS.runRoot),
    executorContracts: repoRel(PATHS.executorContracts),
    executorContractsNdjson: repoRel(PATHS.executorContractsNdjson),
    executorReadyQueue: repoRel(PATHS.executorReadyQueue),
    supervisorQueue: repoRel(PATHS.supervisorQueue),
    cascadeDivision: repoRel(PATHS.cascadeDivision),
    lockMatrix: repoRel(PATHS.lockMatrix),
    energyBudget: repoRel(PATHS.energyBudget),
    collisionReport: repoRel(PATHS.collisionReport),
    memory: repoRel(PATHS.memory),
    index: repoRel(PATHS.index),
    map: repoRel(PATHS.map),
    cube: repoRel(PATHS.cube),
    glpj: repoRel(PATHS.glpj),
    reportJson: repoRel(PATHS.reportJson),
    reportMd: repoRel(PATHS.reportMd)
  };
}

function main(argv) {
  const action = argv[2] || 'status';
  if (action === 'status' || action === 'prepare') {
    console.log(JSON.stringify(prepare({ execute: argv.includes('--execute') }), null, 2));
    return;
  }
  console.error(JSON.stringify({
    ok: false,
    error: `Unknown action: ${action}`,
    usage: ['node tools/asolaria-openclaw-424-executor-matrix.js prepare --execute']
  }, null, 2));
  process.exitCode = 2;
}

main(process.argv);
