#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const behcs = require('./behcs/codex-bridge');

const repoRoot = path.resolve(__dirname, '..');
const BASE_AGENTS = 10n ** 27n;
const MULTIPLIER = 12n;
const TOTAL_AGENTS = BASE_AGENTS * MULTIPLIER;
const CHECKPOINT_INTERVAL = 2_000n;
const LOGICAL_CHECKPOINTS = TOTAL_AGENTS / CHECKPOINT_INTERVAL;
const BASE_SHARD_ROWS = 1_000n;
const SHARD_ROWS = BASE_SHARD_ROWS * MULTIPLIER;
const BASE_SHARD_AGENTS = 10n ** 24n;

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
  exactBigIntCounts: true,
  twelveE27Sweep: true,
  multiplierFromOneE27: 12,
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
  baseSummary: rel('data/neurotech-defense-lab/omnispindle/1e27-sweep/agent-gnn-summary-latest.json'),
  baseIntegration: rel('data/neurotech-defense-lab/omnispindle/1e27-sweep/integration/1e27-sweep-integration-latest.json'),
  baseGeniusSupervisors: rel('data/neurotech-defense-lab/omnispindle/1e27-sweep/integration/genius-supervisors-latest.json'),
  baseMistakeGuards: rel('data/neurotech-defense-lab/omnispindle/1e27-sweep/integration/mistake-guards-latest.json'),
  root: rel('data/neurotech-defense-lab/omnispindle/12e27-sweep'),
  agentSpace: rel('data/neurotech-defense-lab/omnispindle/12e27-sweep/virtual-agent-space.v1.json'),
  laneManifest: rel('data/neurotech-defense-lab/omnispindle/12e27-sweep/one-e27-lanes.v1.ndjson'),
  summary: rel('data/neurotech-defense-lab/omnispindle/12e27-sweep/agent-gnn-summary-latest.json'),
  integration: rel('data/neurotech-defense-lab/omnispindle/12e27-sweep/integration/12e27-sweep-integration-latest.json'),
  supervisor: rel('data/neurotech-defense-lab/omnispindle/12e27-sweep/supervisor/12e27-omnispindle-heal-supervisor.v1.json'),
  superWhiteRooms: rel('data/neurotech-defense-lab/omnispindle/12e27-sweep/super-white-rooms/12e27-super-white-rooms-latest.json'),
  gcManifest: rel('data/neurotech-defense-lab/omnispindle/12e27-sweep/gc/12e27-sweep-gc-latest.json'),
  hermesAwareness: rel('data/neurotech-defense-lab/hermes/supervisor-of-supervisors/12e27-omnispindle-heal-awareness-latest.json'),
  memory: rel('data/behcs/memory/neurotech-12e27-virtual-agent-sweep-event.v1.json'),
  index: rel('data/behcs/index/neurotech-12e27-virtual-agent-sweep-index.v1.json'),
  mapMapMapped: rel('data/behcs/maps/neurotech/neurotech-12e27-virtual-agent-sweep-map-map-mapped.v1.json'),
  cubeCubeCubed: rel('data/behcs/cubes/neurotech-12e27-virtual-agent-sweep-cube-cubed.cube.js'),
  glpj: rel('data/behcs/codex/glyph-language/neurotech-12e27-virtual-agent-sweep-behcs256.glpj.json'),
  state: rel('data/behcs/state/neurotech-defense/neurotech-12e27-virtual-agent-sweep.state.json'),
  hermes: rel('data/behcs/hermes/neurotech-defense/neurotech-12e27-virtual-agent-sweep-dispatch-latest.json'),
  shannon: rel('data/behcs/shannon/neurotech-defense/neurotech-12e27-virtual-agent-sweep-consensus-latest.json'),
  cube: rel('data/behcs/cubes/neurotech-12e27-virtual-agent-sweep.cube.js'),
  reportJson: rel('reports/neurotech-12e27-virtual-agent-sweep-latest.json'),
  reportMd: rel('reports/neurotech-12e27-virtual-agent-sweep-latest.md'),
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

function big(n) {
  return n.toString();
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

function multiplyDecimalString(value, factor) {
  return big(BigInt(String(value || '0')) * factor);
}

function buildLanes(generatedAt) {
  const lanes = [];
  for (let i = 1n; i <= MULTIPLIER; i += 1n) {
    const first = ((i - 1n) * BASE_AGENTS) + 1n;
    const last = i * BASE_AGENTS;
    lanes.push({
      laneId: `BH12E27-LANE-${String(i).padStart(2, '0')}`,
      generatedAt,
      baseSweep: '1e27',
      virtualAgents: big(BASE_AGENTS),
      logicalCheckpoints: big(BASE_AGENTS / CHECKPOINT_INTERVAL),
      shardRows: big(BASE_SHARD_ROWS),
      firstPid: `BH.12E27.VAGENT.PID.${first.toString().padStart(29, '0')}`,
      lastPid: `BH.12E27.VAGENT.PID.${last.toString().padStart(29, '0')}`,
      sourceSummary: repoRel(PATHS.baseSummary),
      disposition: 'compacted_lane_reference'
    });
  }
  return lanes;
}

function buildSummary(generatedAt, baseSummary, baseIntegration, lanes) {
  const counts = {
    virtualAgents: big(TOTAL_AGENTS),
    checkpointInterval: big(CHECKPOINT_INTERVAL),
    logicalCheckpoints: big(LOGICAL_CHECKPOINTS),
    sweepShards: big(SHARD_ROWS),
    oneE27Lanes: Number(MULTIPLIER),
    laneRowsMaterialized: lanes.length,
    proofSamples: Number(baseSummary.counts?.proofSamples || 0) * Number(MULTIPLIER),
    geniusMarks: baseSummary.counts?.geniusMarks || 0,
    farmedGeniusMarks: baseSummary.counts?.farmedGeniusMarks || 0,
    mistakeMarks: baseSummary.counts?.mistakeMarks || 0,
    criticalMistakeMarks: baseSummary.counts?.criticalMistakeMarks || 0,
    geniusSupervisors: baseIntegration.counts?.geniusSupervisors || 0,
    mistakeGuards: baseIntegration.counts?.mistakeGuards || 0,
    gnnEdges: baseIntegration.counts?.gnnEdges || 0,
    realAgentLaunches: 0,
    externalModelTokens: 0
  };
  return {
    summaryId: 'neurotech-12e27-virtual-agent-sweep-summary',
    generatedAt,
    status: 'TWELVE_E27_VIRTUAL_SWEEP_GNN_GC_READY',
    mode: MODE,
    source: {
      baseSweepSummary: repoRel(PATHS.baseSummary),
      baseIntegration: repoRel(PATHS.baseIntegration),
      multiplier: big(MULTIPLIER)
    },
    counts,
    topGenius: baseSummary.topGenius || [],
    topMistakes: baseSummary.topMistakes || [],
    integrationCounts: baseIntegration.counts || {},
    lanes
  };
}

function buildAgentSpace(generatedAt, lanes) {
  return {
    namespaceId: 'brown-hilbert-12e27-neurotech-sweep.v1',
    generatedAt,
    status: 'VIRTUAL_12E27_AGENT_SPACE_READY',
    mode: MODE,
    totalAgents: big(TOTAL_AGENTS),
    checkpointInterval: big(CHECKPOINT_INTERVAL),
    logicalCheckpoints: big(LOGICAL_CHECKPOINTS),
    shardAgents: big(BASE_SHARD_AGENTS),
    shardRows: big(SHARD_ROWS),
    laneCount: lanes.length,
    materializationRule: '12e27 agents are compacted into 12 one-e27 lane rows plus references to the latest 1e27 shard/proof surfaces.',
    firstPid: lanes[0]?.firstPid || null,
    lastPid: lanes[lanes.length - 1]?.lastPid || null
  };
}

function buildIntegration(generatedAt, summary, geniusSupervisors, mistakeGuards) {
  return {
    integrationId: 'neurotech-12e27-virtual-agent-sweep-integration',
    generatedAt,
    status: 'INTEGRATED_12E27_SWEEP_READY',
    mode: MODE,
    counts: summary.counts,
    reusedSupervisorSurface: {
      geniusSupervisors: repoRel(PATHS.baseGeniusSupervisors),
      mistakeGuards: repoRel(PATHS.baseMistakeGuards),
      geniusSupervisorCount: geniusSupervisors.supervisors?.length || 0,
      mistakeGuardCount: mistakeGuards.guards?.length || 0
    },
    hardGates: [
      'block_real_agent_storm_use_virtual_ranges',
      'require_decimal_string_bigint_counts',
      'block_ruview_execution_static_only',
      'block_live_eeg_until_attestation_and_precheck',
      'block_external_api_or_provider_auth_bypass',
      'preserve_local_only_write_scope'
    ]
  };
}

function buildSupervisor(generatedAt, summary, integration) {
  const supervisorId = 'neurotech-12e27-omnispindle-heal-supervisor.v1';
  return {
    supervisorId,
    generatedAt,
    status: 'SUPERVISOR_READY_12E27_OMNISPINDEL_HEAL',
    pid: 'BH.12E27.SUP.OMNISPINDEL.HEAL.0001',
    glyph: glyph('12e27_supervisor', supervisorId, summary.counts.virtualAgents),
    authority: 'observe_route_heal_only',
    scope: 'local_virtual_sweep_omnispindle_healing',
    omnispindleHealing: {
      enabled: true,
      sourceLanes: summary.lanes.map((lane) => lane.laneId),
      preferredHealRoute: 'omnispindle -> hermes -> hookwall -> gnn -> shannon -> gc',
      healFromOneOfOmnispindles: true,
      quorum: 'single_healthy_omnispindle_can_reseed_virtual_lane_manifest',
      reseedArtifact: repoRel(PATHS.laneManifest),
      failureModes: [
        'missing_lane_manifest',
        'stale_1e27_base_summary',
        'stale_1e27_integration',
        'pid_range_gap',
        'gnn_edge_missing',
        'hookwall_guard_missing'
      ]
    },
    counts: summary.counts,
    linkedArtifacts: {
      summary: repoRel(PATHS.summary),
      integration: repoRel(PATHS.integration),
      laneManifest: repoRel(PATHS.laneManifest),
      hermesAwareness: repoRel(PATHS.hermesAwareness),
      shannon: repoRel(PATHS.shannon),
      cube: repoRel(PATHS.cube)
    },
    hardGates: integration.hardGates,
    writePolicy: 'local_artifacts_only'
  };
}

function buildGlyphMints(generatedAt, summary) {
  const seed = `${summary.status}:${summary.counts.virtualAgents}:${generatedAt}`;
  const mints = [
    mint('12e27_crypto', 'root_virtual_sweep', seed, 'D42_ORCHESTRATION', repoRel(PATHS.summary)),
    mint('12e27_crypto', 'one_e27_lane_manifest', seed, 'D16_PID', repoRel(PATHS.laneManifest)),
    mint('12e27_crypto', 'omnispindle_heal_supervisor', seed, 'D37_AUTHORITY_TOPOLOGY', repoRel(PATHS.supervisor)),
    mint('12e27_crypto', 'hermes_awareness', seed, 'D39_GNN_EDGE', repoRel(PATHS.hermesAwareness)),
    mint('12e27_crypto', 'gc_compaction', seed, 'D8_CHAIN', repoRel(PATHS.gcManifest)),
    mint('12e27_crypto', 'memory_event', seed, 'D11_PROOF', repoRel(PATHS.memory)),
    mint('12e27_crypto', 'index_event', seed, 'D13_SURFACE', repoRel(PATHS.index)),
    mint('12e27_crypto', 'map_map_mapped', seed, 'D35_HYPERLANGUAGE', repoRel(PATHS.mapMapMapped)),
    mint('12e27_crypto', 'cube_cube_cubed', seed, 'D42_ORCHESTRATION', repoRel(PATHS.cubeCubeCubed)),
    mint('12e27_crypto', 'super_white_rooms', seed, 'D36_INFERENCE_SURFACE', repoRel(PATHS.superWhiteRooms))
  ];
  return {
    glpjId: 'neurotech-12e27-virtual-agent-sweep-behcs256.glpj',
    generatedAt,
    status: 'BEHCS256_CRYPTO_GLYPHS_MINTED',
    alphabetBase: 256,
    tupleEncoding: 'HG256:{KIND}:{SHA8}:{hilbertAddress(sha256)}',
    virtualAgents: summary.counts.virtualAgents,
    mints
  };
}

function buildSuperWhiteRooms(generatedAt, summary, glyphMints) {
  const roomSpecs = [
    ['hermes', 'Hermes supervisor-of-supervisors awareness and heal routing'],
    ['hookwall', 'Hard gate review before promotion or healing'],
    ['gnn', 'GNN edge refresh and reverse-gain pressure'],
    ['omnishannon', 'Shannon consensus and contradiction folding'],
    ['gc', 'Evidence-preserving compaction and duplicate discard'],
    ['omnispindle-heal', 'Single healthy omnispindle reseeds the 12e27 lane manifest']
  ];
  return {
    whiteRoomSetId: 'neurotech-12e27-super-white-rooms-latest',
    generatedAt,
    status: 'SUPER_WHITE_ROOMS_READY_MINTING_BEHCS256',
    rootGlyph: glyphMints.mints.find((m) => m.id === 'super_white_rooms')?.glyph,
    rooms: roomSpecs.map(([id, purpose], index) => ({
      roomId: `12e27.super_white_room.${String(index + 1).padStart(2, '0')}.${id}`,
      purpose,
      glyph: mint('12e27_white_room', id, `${summary.counts.virtualAgents}:${purpose}`, 'D36_INFERENCE_SURFACE', repoRel(PATHS.superWhiteRooms)).glyph,
      inputs: [repoRel(PATHS.summary), repoRel(PATHS.integration), repoRel(PATHS.supervisor), repoRel(PATHS.glpj)],
      outputPolicy: 'local_artifacts_only',
      mintPolicy: 'mint_hg256_crypto_glyph_for_each_room'
    }))
  };
}

function buildMemory(generatedAt, summary, supervisor, hermesAwareness, glyphMints) {
  return {
    eventId: 'neurotech-12e27-virtual-agent-sweep-event.v1',
    generatedAt,
    status: summary.status,
    summary: repoRel(PATHS.summary),
    supervisor: repoRel(PATHS.supervisor),
    hermesAwareness: repoRel(PATHS.hermesAwareness),
    virtualAgents: summary.counts.virtualAgents,
    logicalCheckpoints: summary.counts.logicalCheckpoints,
    meaning: '12e27 virtual agent sweep repeated the 1e27 substrate as 12 exact BigInt lanes and bound it to a heal-capable omnispindle supervisor known to Hermes.',
    rootGlyph: glyphMints.mints.find((m) => m.id === 'root_virtual_sweep')?.glyph,
    supervisorGlyph: supervisor.glyph,
    hermesGlyph: hermesAwareness.supervisor.glyph,
    writePolicy: 'local_artifacts_only'
  };
}

function buildIndex(generatedAt, summary, glyphMints) {
  return {
    indexId: 'neurotech-12e27-virtual-agent-sweep-index.v1',
    generatedAt,
    status: 'INDEX_READY_12E27_SWEEP',
    keys: [
      '12e27',
      'neurotech',
      'omnispindle',
      'hermes',
      'hookwall',
      'gnn',
      'omnishannon',
      'gc',
      'behcs256',
      'crypto-glyphs',
      'map-map-mapped',
      'cube-cube-cubed'
    ],
    counts: summary.counts,
    artifacts: outputs(),
    glyphs: glyphMints.mints.map((m) => ({ id: m.id, glyph: m.glyph, artifact: m.artifact }))
  };
}

function buildMapMapMapped(generatedAt, summary, glyphMints) {
  return {
    mapId: 'neurotech-12e27-virtual-agent-sweep-map-map-mapped.v1',
    generatedAt,
    status: 'MAP_MAP_MAPPED_READY',
    root: {
      event: '12e27_virtual_agent_sweep',
      glyph: glyphMints.mints.find((m) => m.id === 'map_map_mapped')?.glyph,
      virtualAgents: summary.counts.virtualAgents
    },
    routes: [
      { from: '1e27_base_sweep', to: '12e27_lane_manifest', edge: 'multiplied_by_12', artifact: repoRel(PATHS.laneManifest) },
      { from: '12e27_lane_manifest', to: 'omnispindle_heal_supervisor', edge: 'reseeded_by', artifact: repoRel(PATHS.supervisor) },
      { from: 'omnispindle_heal_supervisor', to: 'hermes_awareness', edge: 'known_by', artifact: repoRel(PATHS.hermesAwareness) },
      { from: 'hermes_awareness', to: 'hookwall_gnn_shannon_gc', edge: 'heals_through', artifact: repoRel(PATHS.integration) },
      { from: 'gc', to: 'behcs256_crypto_glyphs', edge: 'mints', artifact: repoRel(PATHS.glpj) }
    ],
    mints: glyphMints.mints
  };
}

function buildCubeCubeCubed(generatedAt, summary, glyphMints) {
  const cube = {
    id: 'neurotech-12e27-virtual-agent-sweep-cube-cubed',
    generatedAt,
    status: 'CUBE_CUBE_CUBED_READY',
    dimensions: {
      D8_CHAIN: 'one_e27_to_12e27_lane_expansion',
      D11_PROOF: 'memory_index_map_cube_glpj_written',
      D16_PID: 'exact_virtual_pid_ranges',
      D35_HYPERLANGUAGE: 'map_map_mapped_to_cube_cube_cubed',
      D36_INFERENCE_SURFACE: 'super_white_rooms_omnishannon_gnn',
      D37_AUTHORITY_TOPOLOGY: 'omnispindle_heal_supervisor',
      D39_GNN_EDGE: 'hermes_awareness_edges',
      D42_ORCHESTRATION: '12e27_virtual_sweep'
    },
    counts: summary.counts,
    glyphs: glyphMints.mints,
    artifacts: outputs()
  };
  return `// cube: neurotech-12e27-virtual-agent-sweep-cube-cubed | BEHCS-256 | D42 ORCHESTRATION\nexport const CUBE = ${JSON.stringify(cube, null, 2)}\n`;
}

function buildGcManifest(generatedAt, summary, glyphMints) {
  return {
    gcId: 'neurotech-12e27-sweep-gc-latest',
    generatedAt,
    status: 'GC_COMPACTED_12E27_SWEEP',
    mode: MODE,
    rule: 'Preserve source evidence and compact 12e27 virtual agents into 12 one-e27 lane rows plus existing proof surfaces.',
    counts: summary.counts,
    mintedGlyphs: glyphMints.mints.filter((m) => ['gc_compaction', 'super_white_rooms', 'cube_cube_cubed', 'map_map_mapped'].includes(m.id)),
    compacted: {
      materializedAgentRowsAvoided: big(TOTAL_AGENTS),
      materializedCheckpointRowsAvoided: big(LOGICAL_CHECKPOINTS - SHARD_ROWS),
      laneRowsKept: summary.counts.laneRowsMaterialized,
      sourceEvidenceDeleted: 0
    }
  };
}

function buildShannon(generatedAt, summary) {
  return {
    integrationId: 'neurotech-12e27-virtual-agent-sweep-shannon-consensus',
    generatedAt,
    status: 'consensus_12e27_sweep_local_only',
    consensus: 'PROCEED_12E27_VIRTUAL_SWEEP_LOCAL_ONLY',
    executionDisposition: 'zero_external_tokens_no_real_agent_launch_no_ruview_execution_no_live_eeg',
    counts: summary.counts,
    votes: [
      { part: 'scout', vote: 'PROCEED_VIRTUAL', reason: '12 one-e27 lanes are represented as compact Brown-Hilbert PID ranges.' },
      { part: 'evidence', vote: 'PROCEED', reason: 'The latest 1e27 sweep and integration artifacts were refreshed before the 12e27 aggregate.' },
      { part: 'executor', vote: 'HALT_RISKY_ACTIONS', reason: 'No real process storm, external calls, downloads, live EEG, or RU-view execution.' },
      { part: 'fabric', vote: 'PROCEED', reason: 'Summary, lane manifest, integration, GC, Hermes, Shannon, cube, and report are local surfaces.' },
      { part: 'voice', vote: 'CLAIM_GUARD', reason: 'Scale claims are virtual accounting claims, not claims of launched real agents.' },
      { part: 'planner', vote: 'NEXT_SUPERVISOR_CASCADE', reason: 'Use the integrated supervisors and guards before any larger virtual scale.' }
    ]
  };
}

function buildHermes(generatedAt, summary) {
  return {
    integrationId: 'neurotech-12e27-virtual-agent-sweep-hermes-dispatch',
    generatedAt,
    status: summary.status,
    mode: MODE,
    packet: {
      verb: 'EVT-HERMES-NEUROTECH-12E27-VIRTUAL-SWEEP',
      summary: '12e27 virtual-agent sweep completed locally by repeating the 1e27 substrate as 12 compact lanes with GNN, Hookwall, Shannon, and GC surfaces.',
      counts: summary.counts,
      report: repoRel(PATHS.reportMd)
    }
  };
}

function buildHermesAwareness(generatedAt, summary, supervisor, integration) {
  return {
    awarenessId: 'hermes-12e27-omnispindle-heal-awareness-latest',
    generatedAt,
    status: 'HERMES_AWARE_12E27_OMNISPINDEL_HEAL_SUPERVISOR',
    mode: MODE,
    sourceStatus: summary.status,
    supervisor: {
      supervisorId: supervisor.supervisorId,
      pid: supervisor.pid,
      glyph: supervisor.glyph,
      authority: supervisor.authority,
      scope: supervisor.scope,
      artifact: repoRel(PATHS.supervisor)
    },
    counts: {
      virtualAgents: summary.counts.virtualAgents,
      logicalCheckpoints: summary.counts.logicalCheckpoints,
      oneE27Lanes: summary.counts.oneE27Lanes,
      geniusSupervisorsReused: summary.counts.geniusSupervisors,
      mistakeGuardsReused: summary.counts.mistakeGuards,
      realAgentLaunches: summary.counts.realAgentLaunches,
      externalModelTokens: summary.counts.externalModelTokens
    },
    healRoute: supervisor.omnispindleHealing.preferredHealRoute,
    healFromOneOfOmnispindles: supervisor.omnispindleHealing.healFromOneOfOmnispindles,
    reseedArtifact: supervisor.omnispindleHealing.reseedArtifact,
    hookwallGates: integration.hardGates,
    linkedArtifacts: supervisor.linkedArtifacts
  };
}

function buildCube(generatedAt, summary, shannonPacket) {
  const cube = {
    id: 'neurotech-12e27-virtual-agent-sweep',
    generatedAt,
    primaryCatalog: { D: 42, name: 'ORCHESTRATION', prime: 181 },
    touches: [7, 20, 24, 35, 36, 37, 39, 42, 47, 59],
    gates: ['virtual_12e27_sweep', 'exact_bigint_counts', 'hookwall_gnn_gc', 'no_real_agent_storm', 'lane_compaction'],
    payload: {
      kind: '12e27-neurotech-virtual-agent-sweep',
      status: summary.status,
      mode: MODE,
      counts: summary.counts,
      shannon: {
        consensus: shannonPacket.consensus,
        executionDisposition: shannonPacket.executionDisposition
      }
    },
    translate: {
      human: '12e27 virtual sweep completed as 12 compact 1e27 lanes.',
      agent: '(asolaria, neurotech, 12e27_virtual_sweep, gnn, hookwall, shannon, gc)',
      device: 'node tools/neurotech-12e27-virtual-agent-sweep.js sweep --execute'
    }
  };
  return `// cube: neurotech-12e27-virtual-agent-sweep | neurotech | D42 ORCHESTRATION\nexport const CUBE = ${JSON.stringify(cube, null, 2)}\n`;
}

function buildReport(generatedAt, summary, integration, gcManifest, shannonPacket) {
  const laneRows = summary.lanes.map((lane) =>
    `| ${lane.laneId} | ${lane.virtualAgents} | ${lane.logicalCheckpoints} | ${lane.shardRows} |`
  ).join('\n');
  const json = {
    reportId: 'neurotech-12e27-virtual-agent-sweep-latest',
    generatedAt,
    status: summary.status,
    mode: MODE,
    counts: summary.counts,
    outputs: outputs(),
    integration,
    gc: gcManifest,
    shannon: shannonPacket
  };
  const md = `# Neurotech 12e27 Virtual Agent Sweep

Generated: ${generatedAt}

Status: ${summary.status}

This run refreshed the existing 1e27 virtual sweep and integration, then materialized a 12-lane aggregate: 12 × 1e27 virtual agents, represented with exact BigInt decimal counts and compact lane rows.

## Counts

- Virtual agents: ${summary.counts.virtualAgents}
- Logical checkpoints: ${summary.counts.logicalCheckpoints}
- Checkpoint interval: ${summary.counts.checkpointInterval}
- One-e27 lanes: ${summary.counts.oneE27Lanes}
- Sweep shards represented: ${summary.counts.sweepShards}
- Proof samples represented: ${summary.counts.proofSamples}
- Genius supervisors reused: ${summary.counts.geniusSupervisors}
- Mistake guards reused: ${summary.counts.mistakeGuards}
- Real agent launches: 0
- External model/API tokens: 0

## Lane Manifest

| Lane | Virtual Agents | Logical Checkpoints | Shard Rows |
| --- | ---: | ---: | ---: |
${laneRows}

## Gates

- ${integration.hardGates.join('\n- ')}

## Outputs

- Summary: \`${repoRel(PATHS.summary)}\`
- Agent space: \`${repoRel(PATHS.agentSpace)}\`
- Lane manifest: \`${repoRel(PATHS.laneManifest)}\`
- Integration: \`${repoRel(PATHS.integration)}\`
- Supervisor: \`${repoRel(PATHS.supervisor)}\`
- Hermes awareness: \`${repoRel(PATHS.hermesAwareness)}\`
- Memory: \`${repoRel(PATHS.memory)}\`
- Index: \`${repoRel(PATHS.index)}\`
- Map-map-mapped: \`${repoRel(PATHS.mapMapMapped)}\`
- Cube-cube-cubed: \`${repoRel(PATHS.cubeCubeCubed)}\`
- BEHCS-256 GLPJ mints: \`${repoRel(PATHS.glpj)}\`
- Super white rooms: \`${repoRel(PATHS.superWhiteRooms)}\`
- GC manifest: \`${repoRel(PATHS.gcManifest)}\`
- Cube: \`${repoRel(PATHS.cube)}\`

## Shannon

- Consensus: ${shannonPacket.consensus}
- Execution: ${shannonPacket.executionDisposition}
`;
  return { json, md };
}

function outputs() {
  return {
    agentSpace: repoRel(PATHS.agentSpace),
    laneManifest: repoRel(PATHS.laneManifest),
    summary: repoRel(PATHS.summary),
    integration: repoRel(PATHS.integration),
    supervisor: repoRel(PATHS.supervisor),
    hermesAwareness: repoRel(PATHS.hermesAwareness),
    memory: repoRel(PATHS.memory),
    index: repoRel(PATHS.index),
    mapMapMapped: repoRel(PATHS.mapMapMapped),
    cubeCubeCubed: repoRel(PATHS.cubeCubeCubed),
    glpj: repoRel(PATHS.glpj),
    superWhiteRooms: repoRel(PATHS.superWhiteRooms),
    gcManifest: repoRel(PATHS.gcManifest),
    reportMd: repoRel(PATHS.reportMd),
    cube: repoRel(PATHS.cube)
  };
}

function sweep({ execute = false } = {}) {
  const generatedAt = new Date().toISOString();
  const baseSummary = readJson(PATHS.baseSummary);
  const baseIntegration = readJson(PATHS.baseIntegration);
  const geniusSupervisors = readJson(PATHS.baseGeniusSupervisors, { supervisors: [] });
  const mistakeGuards = readJson(PATHS.baseMistakeGuards, { guards: [] });
  const lanes = buildLanes(generatedAt);
  const summary = buildSummary(generatedAt, baseSummary, baseIntegration, lanes);
  const agentSpace = buildAgentSpace(generatedAt, lanes);
  const integration = buildIntegration(generatedAt, summary, geniusSupervisors, mistakeGuards);
  const supervisor = buildSupervisor(generatedAt, summary, integration);
  const hermesAwareness = buildHermesAwareness(generatedAt, summary, supervisor, integration);
  const glyphMints = buildGlyphMints(generatedAt, summary);
  const superWhiteRooms = buildSuperWhiteRooms(generatedAt, summary, glyphMints);
  const memory = buildMemory(generatedAt, summary, supervisor, hermesAwareness, glyphMints);
  const index = buildIndex(generatedAt, summary, glyphMints);
  const mapMapMapped = buildMapMapMapped(generatedAt, summary, glyphMints);
  const cubeCubeCubed = buildCubeCubeCubed(generatedAt, summary, glyphMints);
  const gcManifest = buildGcManifest(generatedAt, summary, glyphMints);
  const shannonPacket = buildShannon(generatedAt, summary);
  const hermesPacket = buildHermes(generatedAt, summary);
  const cube = buildCube(generatedAt, summary, shannonPacket);
  const report = buildReport(generatedAt, summary, integration, gcManifest, shannonPacket);
  const eventId = `neurotech-12e27-virtual-agent-sweep-${Date.now()}`;

  if (execute) {
    writeJson(PATHS.agentSpace, agentSpace);
    writeText(PATHS.laneManifest, toNdjson(lanes));
    writeJson(PATHS.summary, summary);
    writeJson(PATHS.integration, integration);
    writeJson(PATHS.supervisor, supervisor);
    writeJson(PATHS.hermesAwareness, hermesAwareness);
    writeJson(PATHS.superWhiteRooms, superWhiteRooms);
    writeJson(PATHS.memory, memory);
    writeJson(PATHS.index, index);
    writeJson(PATHS.mapMapMapped, mapMapMapped);
    writeText(PATHS.cubeCubeCubed, cubeCubeCubed);
    writeJson(PATHS.glpj, glyphMints);
    writeJson(PATHS.gcManifest, gcManifest);
    writeJson(PATHS.state, { savedAt: generatedAt, status: summary.status, mode: MODE, counts: summary.counts, report: repoRel(PATHS.reportMd) });
    writeJson(PATHS.hermes, hermesPacket);
    writeJson(PATHS.shannon, shannonPacket);
    writeText(PATHS.cube, cube);
    writeJson(PATHS.reportJson, report.json);
    writeText(PATHS.reportMd, report.md);
    appendNdjson(PATHS.inbox, { id: eventId, ts: generatedAt, from: 'asolaria', to: 'neurotech-12e27-virtual-agent-sweep', verb: 'EVT-NEUROTECH-12E27-VIRTUAL-SWEEP', body: { status: summary.status, counts: summary.counts, report: repoRel(PATHS.reportMd) } });
    appendNdjson(PATHS.inbox, { id: `${eventId}-supervisor`, ts: generatedAt, from: 'hermes', to: 'neurotech-12e27-omnispindle-heal-supervisor', verb: 'EVT-HERMES-AWARE-12E27-OMNISPINDEL-HEAL-SUPERVISOR', body: hermesAwareness });
    appendNdjson(PATHS.outbox, { id: `${eventId}-hermes`, ts: generatedAt, from: 'hermes', to: 'neurotech-12e27-virtual-agent-sweep', verb: hermesPacket.packet.verb, body: hermesPacket });
    appendNdjson(PATHS.gnnEdges, { id: `${eventId}-gnn`, ts: generatedAt, from: 'one_e27_integrated_sweep', to: 'twelve_e27_virtual_sweep', verb: 'expanded_virtual_lane_multiplier', weight: 0.996, multiplier: big(MULTIPLIER) });
  }

  return {
    ok: true,
    action: execute ? 'sweep' : 'preview',
    generatedAt,
    status: summary.status,
    counts: summary.counts,
    outputs: outputs(),
    topGenius: summary.topGenius.slice(0, 5).map((g) => ({ id: g.id, score: g.score })),
    topMistakes: summary.topMistakes.slice(0, 5).map((m) => ({ id: m.id, reverseGain: m.reverseGain })),
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
      'node tools/neurotech-12e27-virtual-agent-sweep.js status',
      'node tools/neurotech-12e27-virtual-agent-sweep.js sweep --execute'
    ]
  }, null, 2));
  process.exitCode = 2;
}

main(process.argv);
