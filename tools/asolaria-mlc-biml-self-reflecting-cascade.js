#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const behcs = require('./behcs/codex-bridge');

const ROOT = path.resolve(__dirname, '..');
const RUN_ID = 'asolaria-mlc-biml-self-reflecting-cascade-20260426';
const RUN_ROOT = rel(`data/behcs/orchestration/${RUN_ID}`);
const WAVE_SHAPE = '6x6x6x6x6x12 x omnishannon x GNN';

const STACKS = [
  {
    id: 's01-mlc-compositional-primitives',
    title: 'MLC Compositional Primitives',
    thesis: 'Freeze primitive symbols, roles, functions, and slot bindings before any larger synthesis.',
    cube: 3307949
  },
  {
    id: 's02-mlc-systematic-generalization',
    title: 'MLC Systematic Generalization',
    thesis: 'Test recombination across novel instruction patterns, not memorized examples.',
    cube: 3442951
  },
  {
    id: 's03-biml-bidirectional-update',
    title: 'BIML Bidirectional Update',
    thesis: 'Push learning both directions: model-to-index and index-to-model, with contradiction return paths.',
    cube: 3869893
  },
  {
    id: 's04-biml-multistack-cascade',
    title: 'BIML Multi-Stack Cascade',
    thesis: 'Layer MLC, BIML, BEHCS-256, Hookwall, GNN, Shannon, and supervisor surfaces into one proof chain.',
    cube: 4330747
  },
  {
    id: 's05-self-reflecting-repair',
    title: 'Self-Reflecting Repair',
    thesis: 'Fold weak dimensions back into repair candidates and require a white-room contradiction note.',
    cube: 4826809
  },
  {
    id: 's06-asi-readiness-governance',
    title: 'ASI Readiness Governance',
    thesis: 'Convert high-capacity plans into bounded, reviewable, reversible, evidence-preserving tasks.',
    cube: 5929741
  }
];

const COMPOSITIONAL_SURFACES = [
  'primitive_symbol_binding',
  'role_argument_mapping',
  'function_composition',
  'instruction_learning',
  'novel_combination',
  'systematicity_flexibility_balance',
  'bidirectional_error_flow',
  'multi_stack_memory_route',
  'hookwall_gnn_edge_fit',
  'omnishannon_vote_shape',
  'white_room_contradiction',
  'glyph_to_task_roundtrip'
];

const PATHS = Object.freeze({
  runRoot: RUN_ROOT,
  manifestsDir: path.join(RUN_ROOT, 'manifests'),
  modelCard: path.join(RUN_ROOT, 'model-cards', 'mlc-biml-self-reflecting-cascade.model-card.v1.json'),
  supervisorQueue: path.join(RUN_ROOT, 'supervisor-queue.ndjson'),
  supervisorDecisions: path.join(RUN_ROOT, 'supervisor-decisions-latest.ndjson'),
  supervisorWorkerReady: path.join(RUN_ROOT, 'supervisor-worker-ready-latest.ndjson'),
  supervisorMap: path.join(RUN_ROOT, 'supervisor-runner-map-latest.json'),
  supervisorState: path.join(RUN_ROOT, 'supervisor-runner.state.json'),
  supervisorHermes: path.join(RUN_ROOT, 'supervisor-runner-hermes-latest.json'),
  supervisorShannon: path.join(RUN_ROOT, 'supervisor-runner-shannon-latest.json'),
  supervisorCube: path.join(RUN_ROOT, 'supervisor-runner.cube.js'),
  supervisorReportJson: path.join(RUN_ROOT, 'supervisor-runner-latest.json'),
  supervisorReportMd: path.join(RUN_ROOT, 'supervisor-runner-latest.md'),
  aggregate: path.join(RUN_ROOT, 'mlc-biml-self-reflecting-cascade-aggregate-latest.json'),
  memory: rel('data/behcs/memory/asolaria-mlc-biml-self-reflecting-cascade.v1.json'),
  index: rel('data/behcs/index/asolaria-mlc-biml-self-reflecting-cascade-index.v1.json'),
  map: rel('data/behcs/maps/asolaria/asolaria-mlc-biml-self-reflecting-cascade-map-map-mapped.v1.json'),
  cube: rel('data/behcs/cubes/asolaria-mlc-biml-self-reflecting-cascade-cube-cubed.cube.js'),
  glpj: rel('data/behcs/codex/glyph-language/asolaria-mlc-biml-self-reflecting-cascade-behcs256.glpj.json'),
  reportJson: rel('reports/asolaria-mlc-biml-self-reflecting-cascade-latest.json'),
  reportMd: rel('reports/asolaria-mlc-biml-self-reflecting-cascade-latest.md'),
  globalInbox: rel('data/behcs/inbox.ndjson'),
  gnnEdges: rel('data/behcs/gnn-live-edges.ndjson')
});

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

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function glyph(kind, id, seed) {
  const hash = sha256(`${kind}:${id}:${seed || ''}`);
  return `HG256:${kind.toUpperCase()}:${hash.slice(0, 8).toUpperCase()}:${behcs.hilbertAddress(hash)}`;
}

function manifestPath(stack) {
  return path.join(PATHS.manifestsDir, `${stack.id}.manifest.v1.json`);
}

function voteId(stack) {
  return `ASOLARIA-MLC-BIML-${stack.id.toUpperCase().replace(/[^A-Z0-9]+/g, '-')}-20260426`;
}

function votePath(stack) {
  return rel(`data/votes/${voteId(stack)}/behcs-v6-candidate-file.json`);
}

function buildCandidates(stack, stackIndex) {
  return COMPOSITIONAL_SURFACES.map((surface, surfaceIndex) => ({
    id: `aso.mlc_biml.${stack.id}.${surface}`,
    label: `${stack.title} :: ${surface.replace(/_/g, ' ')}`,
    cube: stack.cube,
    primary_cube: stack.cube,
    metadata: {
      stack: stack.id,
      stackIndex: stackIndex + 1,
      surface,
      surfaceIndex: surfaceIndex + 1,
      mlcReference: 'Lake-Baroni-2023-meta-learning-for-compositionality',
      bimlReference: 'Jesse-Brown-2023-BIML-multi-stacking-lineage',
      selfReflecting: true,
      planningOnly: true,
      proof_artifact: repoRel(PATHS.modelCard),
      noExternalApiCalls: true,
      noProviderAuthBypass: true,
      noUnboundedWorkers: true
    }
  }));
}

function buildManifest(stack, stackIndex, generatedAt) {
  return {
    vote_id: voteId(stack),
    generatedAt,
    mode: 'mlc-biml-self-reflecting-candidate-file',
    taskId: 'ASOLARIA-MLC-BIML-SELF-REFLECTING-CASCADE',
    planId: RUN_ID,
    purpose: `Run ${stack.title} through BEHCS v6 as a self-reflecting MLC/BIML multi-stack surface.`,
    waveShape: WAVE_SHAPE,
    sourceReferences: [
      {
        id: 'Lake-Baroni-2023',
        title: 'Human-like systematic generalization through a meta-learning neural network',
        doi: '10.1038/s41586-023-06668-3',
        url: 'https://www.nature.com/articles/s41586-023-06668-3'
      },
      {
        id: 'Jesse-Brown-2023-BIML',
        title: 'BIML multi-stacking MLC lineage as indexed in Asolaria IX corpus',
        localIndex: 'IX-090, IX-099, workspace-semantic-index'
      }
    ],
    chain: 'MLC -> BIML -> BEHCS-256 -> Hookwall -> GNN -> OmniShannon -> Shannon -> self_reflection',
    executionPolicy: {
      planningOnly: true,
      selfReflecting: true,
      externalApiCalls: false,
      providerAuthBypass: false,
      bootMutation: false,
      remoteMutation: false,
      spawnWorkers: false,
      uncontrolledFanout: false
    },
    candidates: buildCandidates(stack, stackIndex)
  };
}

function buildModelCard(generatedAt) {
  return {
    modelCardId: 'mlc-biml-self-reflecting-cascade.model-card.v1',
    generatedAt,
    status: 'READY_FOR_SUPERVISOR_REVIEW',
    owner: 'asolaria-canonical',
    mode: 'local_planning_and_cascade_proof_only',
    purpose: 'Run MLC and BIML multi-stacking surfaces through local BEHCS v6 self-reflecting cascades.',
    sourceAnchors: [
      'Lake and Baroni 2023 MLC systematic generalization',
      'Jesse Brown 2023 BIML multi-stacking lineage as indexed locally'
    ],
    inputs: STACKS.map((stack) => repoRel(manifestPath(stack))),
    outputs: [
      repoRel(PATHS.aggregate),
      repoRel(PATHS.memory),
      repoRel(PATHS.index),
      repoRel(PATHS.map),
      repoRel(PATHS.cube),
      repoRel(PATHS.glpj),
      repoRel(PATHS.reportMd)
    ],
    allowedActions: [
      'write local manifests',
      'run local BEHCS v6 cascade engine',
      'read local vote results',
      'write memory index map cube GLPJ and reports'
    ],
    blockedActions: [
      'external provider worker spawn',
      'auth bypass',
      'payment bypass',
      'boot mutation',
      'BIOS or firmware mutation',
      'USB-root execution',
      'remote mutation',
      'evidence deletion',
      'unbounded process fanout'
    ],
    gates: [
      'model_card_gate',
      'synthetic_first_ci',
      'reverse_gain_review',
      'evidence_retention_guard',
      'connector_health_matrix'
    ],
    behcs: {
      language: 'BEHCS-256',
      waveShape: WAVE_SHAPE,
      map: 'map-map-mapped',
      cube: 'cube-cube-cubed'
    }
  };
}

function buildSupervisorPacket(stack, generatedAt) {
  return {
    id: `ASO-MLC-BIML-SUP-${stack.id}`,
    title: `${stack.title} self-reflecting cascade packet`,
    objective: `${stack.thesis} Run local cascade proof only; do not spawn external workers or mutate boot/storage/provider/device surfaces.`,
    instructions: 'Evaluate MLC/BIML stack readiness with BEHCS-256, map-map-mapped, cube-cube-cubed, Hookwall, GNN, OmniShannon, white rooms, and GC.',
    requestedWorker: 'local_behcs_v6_cascade_engine',
    pid: `BH.ASO.MLC.BIML.${stack.id.toUpperCase().replace(/[^A-Z0-9]+/g, '.')}`,
    pidScope: 'local_cascade_proof_only',
    consentScope: 'operator_authorized_local_planning',
    allowedPaths: [
      repoRel(RUN_ROOT),
      'data/behcs/orchestration',
      'data/behcs/maps/asolaria',
      'data/behcs/cubes',
      'data/votes',
      'reports'
    ],
    expectedArtifacts: [
      repoRel(manifestPath(stack)),
      repoRel(PATHS.modelCard),
      `data/votes/${voteId(stack)}/behcs-v6-candidate-file.json`
    ],
    acceptanceGates: [
      'model_card_gate_review',
      'manifest_present',
      'cascade_vote_present',
      'map_map_mapped_reference_present',
      'cube_cube_cubed_reference_present'
    ],
    proofRequired: true,
    proofRefs: [repoRel(PATHS.modelCard), repoRel(manifestPath(stack))],
    syntheticFirstEvidence: true,
    modelCard: true,
    modelCardAttached: true,
    providerAuthMode: 'none_local_engine_only',
    legitimateCliEvidence: true,
    freeMethod: false,
    remoteMutation: false,
    externalApiCall: false,
    cloudUpload: false,
    deviceAccess: false,
    liveEeg: false,
    liveHumanData: false,
    downloads: false,
    installs: false,
    writesGit: false,
    deletesEvidence: false,
    sensitiveData: false,
    secretMaterial: false,
    bypassAuth: false,
    bypassPayment: false,
    needsCloudWorker: false,
    source: 'asolaria-mlc-biml-self-reflecting-cascade'
  };
}

function buildPreparedArtifacts(generatedAt) {
  const manifests = STACKS.map((stack, index) => buildManifest(stack, index, generatedAt));
  const mints = [
    ['mlc_biml_model_card', PATHS.modelCard, 'D11_PROOF'],
    ['mlc_biml_supervisor_queue', PATHS.supervisorQueue, 'D41_SUPERVISOR'],
    ['mlc_biml_manifests', PATHS.manifestsDir, 'D36_INFERENCE_SURFACE'],
    ['mlc_biml_aggregate', PATHS.aggregate, 'D11_PROOF'],
    ['mlc_biml_memory', PATHS.memory, 'D11_PROOF'],
    ['mlc_biml_index', PATHS.index, 'D13_SURFACE'],
    ['mlc_biml_map_map_mapped', PATHS.map, 'D35_HYPERLANGUAGE'],
    ['mlc_biml_cube_cube_cubed', PATHS.cube, 'D42_ORCHESTRATION'],
    ['mlc_biml_glpj', PATHS.glpj, 'D10_DIALECT']
  ].map(([id, artifact, dimension]) => ({
    id,
    dimension,
    artifact: repoRel(artifact),
    glyph: glyph('mlc_biml_self_reflect', id, `${generatedAt}:${artifact}`)
  }));
  return { manifests, mints };
}

function prepare({ execute = false } = {}) {
  const generatedAt = new Date().toISOString();
  const { manifests, mints } = buildPreparedArtifacts(generatedAt);
  const modelCard = buildModelCard(generatedAt);
  const supervisorPackets = STACKS.map((stack) => buildSupervisorPacket(stack, generatedAt));
  const report = {
    reportId: 'asolaria-mlc-biml-self-reflecting-cascade-latest',
    generatedAt,
    status: 'PREPARED_PENDING_SUPERVISOR_AND_CASCADE_RUNS',
    runId: RUN_ID,
    stackCount: STACKS.length,
    candidateCount: STACKS.length * COMPOSITIONAL_SURFACES.length,
    waveShape: WAVE_SHAPE,
    outputs: outputs()
  };

  if (execute) {
    for (const manifest of manifests) {
      const stack = STACKS.find((item) => voteId(item) === manifest.vote_id);
      writeJson(manifestPath(stack), manifest);
    }
    writeJson(PATHS.modelCard, modelCard);
    writeText(PATHS.supervisorQueue, supervisorPackets.map((packet) => JSON.stringify(packet)).join('\n') + '\n');
    writeJson(PATHS.glpj, {
      glpjId: 'asolaria-mlc-biml-self-reflecting-cascade-behcs256.glpj',
      generatedAt,
      status: 'BEHCS256_MLC_BIML_SELF_REFLECTING_GLYPHS_PREPARED',
      alphabetBase: 256,
      mints
    });
    writeJson(PATHS.reportJson, report);
    writeText(PATHS.reportMd, buildReportMd(report, null));
    appendNdjson(PATHS.globalInbox, {
      id: `${RUN_ID}-prepare-${Date.now()}`,
      ts: generatedAt,
      from: 'asolaria-canonical',
      to: 'mlc-biml-self-reflecting-cascade',
      verb: 'EVT-MLC-BIML-STACKS-PREPARED',
      body: { runId: RUN_ID, stackCount: STACKS.length, candidateCount: report.candidateCount }
    });
    appendNdjson(PATHS.gnnEdges, {
      id: `${RUN_ID}-prepare-gnn-${Date.now()}`,
      ts: generatedAt,
      from: 'MLC',
      to: 'BIML_MULTI_STACK',
      verb: 'prepares_self_reflecting_compositional_cascade',
      weight: 0.991,
      stackCount: STACKS.length
    });
  }

  return {
    ok: true,
    action: execute ? 'prepare-write' : 'prepare-preview',
    generatedAt,
    runId: RUN_ID,
    stackCount: STACKS.length,
    candidateCount: STACKS.length * COMPOSITIONAL_SURFACES.length,
    manifests: STACKS.map((stack) => repoRel(manifestPath(stack))),
    outputs: outputs()
  };
}

function summarizeVote(stack) {
  const filePath = votePath(stack);
  const vote = readJson(filePath);
  if (!vote) {
    return {
      stack: stack.id,
      title: stack.title,
      voteId: voteId(stack),
      votePath: repoRel(filePath),
      status: 'MISSING'
    };
  }
  const verdictCounts = {};
  const weakestDims = {};
  const gnnOverrides = new Set();
  for (const result of vote.results || []) {
    verdictCounts[result.verdict] = (verdictCounts[result.verdict] || 0) + 1;
    const weakest = result.selfReflection?.weakestOverall?.dim;
    if (weakest) {
      weakestDims[weakest] = (weakestDims[weakest] || 0) + 1;
    }
    if (result.gnnOverride) {
      gnnOverrides.add(result.gnnOverride);
    }
  }
  return {
    stack: stack.id,
    title: stack.title,
    voteId: vote.vote_id,
    votePath: repoRel(filePath),
    status: 'PRESENT',
    candidatesScanned: vote.candidatesScanned,
    totalBeats: vote.totalBeats,
    elapsedMs: vote.elapsed_ms,
    busAlive: Boolean(vote.liveState?.busAlive),
    executorDispatches: vote.executorDispatches || 0,
    verdictCounts,
    weakestDims,
    gnnOverrides: Array.from(gnnOverrides),
    topResult: (vote.results || [])[0] ? {
      candidateId: vote.results[0].candidate_id,
      verdict: vote.results[0].verdict,
      confidence: vote.results[0].avgConfidence,
      weakest: vote.results[0].selfReflection?.weakestOverall?.dim,
      strongest: vote.results[0].selfReflection?.strongestOverall?.dim
    } : null
  };
}

function absorb({ execute = false } = {}) {
  const generatedAt = new Date().toISOString();
  const stackVotes = STACKS.map(summarizeVote);
  const present = stackVotes.filter((item) => item.status === 'PRESENT');
  const missing = stackVotes.filter((item) => item.status !== 'PRESENT');
  const totalBeats = present.reduce((sum, item) => sum + (item.totalBeats || 0), 0);
  const verdictCounts = {};
  const weakestDims = {};
  const gnnOverrides = new Set();
  for (const vote of present) {
    for (const [verdict, count] of Object.entries(vote.verdictCounts || {})) {
      verdictCounts[verdict] = (verdictCounts[verdict] || 0) + count;
    }
    for (const [dim, count] of Object.entries(vote.weakestDims || {})) {
      weakestDims[dim] = (weakestDims[dim] || 0) + count;
    }
    for (const override of vote.gnnOverrides || []) {
      gnnOverrides.add(override);
    }
  }

  const aggregate = {
    aggregateId: 'asolaria-mlc-biml-self-reflecting-cascade-aggregate-latest',
    generatedAt,
    status: missing.length > 0 ? 'PARTIAL_STACK_VOTES_PRESENT' : 'ALL_STACK_VOTES_PRESENT',
    runId: RUN_ID,
    waveShape: WAVE_SHAPE,
    stackCount: STACKS.length,
    stacksPresent: present.length,
    stacksMissing: missing.length,
    candidateCount: present.reduce((sum, item) => sum + (item.candidatesScanned || 0), 0),
    totalBeats,
    verdictCounts,
    weakestDims,
    gnnOverrides: Array.from(gnnOverrides),
    stackVotes,
    triggerDisposition: 'review_before_execution'
  };

  const memory = {
    eventId: 'asolaria-mlc-biml-self-reflecting-cascade.v1',
    generatedAt,
    status: aggregate.status,
    significance: 'MLC and BIML were lifted into Asolaria as a six-stack compositionality proof: primitives, systematic generalization, bidirectional update, multi-stack cascade, self-reflecting repair, and ASI governance now have local BEHCS v6 vote evidence.',
    sourceReferences: [
      'Lake-Baroni-2023-MLC',
      'Jesse-Brown-2023-BIML-multi-stacking'
    ],
    aggregate: repoRel(PATHS.aggregate),
    totalBeats,
    verdictCounts,
    weakestDims,
    writePolicy: 'local_artifacts_only_review_before_execution'
  };

  const index = {
    indexId: 'asolaria-mlc-biml-self-reflecting-cascade-index.v1',
    generatedAt,
    status: 'INDEX_READY_MLC_BIML_SELF_REFLECTING_CASCADE',
    keys: [
      'MLC',
      'meta-learning-for-compositionality',
      'Lake-Baroni-2023',
      'BIML',
      'Jesse-Brown-2023',
      'multi-stacking',
      'self-reflection',
      'systematic-generalization',
      'BEHCS-256',
      'deep-wave-second-cascade',
      'omnishannon',
      'GNN',
      'map-map-mapped',
      'cube-cube-cubed'
    ],
    artifacts: outputs(),
    stackVotes
  };

  const map = {
    mapId: 'asolaria-mlc-biml-self-reflecting-cascade-map-map-mapped.v1',
    generatedAt,
    status: 'MAP_MAP_MAPPED_READY_MLC_BIML',
    routes: [
      { from: 'Lake-Baroni-2023-MLC', to: 'compositional_primitives', edge: 'anchors_dynamic_compositional_task_stream', artifact: repoRel(PATHS.modelCard) },
      { from: 'Jesse-Brown-2023-BIML', to: 'multi_stack_cascade', edge: 'anchors_bidirectional_multi_stacking', artifact: repoRel(PATHS.modelCard) },
      { from: 'MLC', to: 'BIML', edge: 'systematicity_to_bidirectional_update', artifact: repoRel(PATHS.aggregate) },
      { from: 'BIML', to: 'BEHCS-256', edge: 'compresses_into_glyph_language', artifact: repoRel(PATHS.glpj) },
      { from: 'BEHCS-256', to: 'Hookwall_GNN_OmniShannon', edge: 'routes_self_reflecting_votes', artifact: repoRel(PATHS.aggregate) },
      { from: 'weakest_dims', to: 'white_rooms', edge: 'conditioned_repair_before_execution', artifact: repoRel(PATHS.reportMd) }
    ]
  };

  const cube = buildCube(generatedAt, aggregate);
  const glpj = readJson(PATHS.glpj, {
    glpjId: 'asolaria-mlc-biml-self-reflecting-cascade-behcs256.glpj',
    generatedAt,
    status: 'BEHCS256_MLC_BIML_SELF_REFLECTING_GLYPHS_PREPARED',
    alphabetBase: 256,
    mints: []
  });
  const known = new Set((glpj.mints || []).map((mint) => mint.id));
  for (const [id, artifact, dimension] of [
    ['mlc_biml_vote_aggregate', PATHS.aggregate, 'D11_PROOF'],
    ['mlc_biml_memory_written', PATHS.memory, 'D11_PROOF'],
    ['mlc_biml_map_written', PATHS.map, 'D35_HYPERLANGUAGE'],
    ['mlc_biml_cube_written', PATHS.cube, 'D42_ORCHESTRATION']
  ]) {
    if (!known.has(id)) {
      glpj.mints.push({
        id,
        dimension,
        artifact: repoRel(artifact),
        glyph: glyph('mlc_biml_self_reflect_proof', id, `${generatedAt}:${artifact}`)
      });
    }
  }
  glpj.status = 'BEHCS256_MLC_BIML_SELF_REFLECTING_PROOF_GLYPHS_MINTED';

  const report = {
    reportId: 'asolaria-mlc-biml-self-reflecting-cascade-latest',
    generatedAt,
    status: aggregate.status,
    runId: RUN_ID,
    stackCount: STACKS.length,
    stacksPresent: present.length,
    stacksMissing: missing.length,
    candidateCount: aggregate.candidateCount,
    totalBeats,
    verdictCounts,
    weakestDims,
    gnnOverrides: aggregate.gnnOverrides,
    outputs: outputs()
  };

  if (execute) {
    writeJson(PATHS.aggregate, aggregate);
    writeJson(PATHS.memory, memory);
    writeJson(PATHS.index, index);
    writeJson(PATHS.map, map);
    writeText(PATHS.cube, cube);
    writeJson(PATHS.glpj, glpj);
    writeJson(PATHS.reportJson, report);
    writeText(PATHS.reportMd, buildReportMd(report, aggregate));
    appendNdjson(PATHS.gnnEdges, {
      id: `${RUN_ID}-absorbed-gnn-${Date.now()}`,
      ts: generatedAt,
      from: 'MLC_BIML_SELF_REFLECTING_CASCADE',
      to: 'ASOLARIA_MEMORY_INDEX_MAP_CUBE_GLPJ',
      verb: 'absorbs_cascade_votes',
      weight: 0.996,
      totalBeats
    });
  }

  return {
    ok: true,
    action: execute ? 'absorb-write' : 'absorb-preview',
    generatedAt,
    status: aggregate.status,
    stacksPresent: present.length,
    stacksMissing: missing.length,
    candidateCount: aggregate.candidateCount,
    totalBeats,
    verdictCounts,
    weakestDims,
    outputs: outputs()
  };
}

function buildCube(generatedAt, aggregate) {
  const cube = {
    id: 'asolaria-mlc-biml-self-reflecting-cascade-cube-cubed',
    generatedAt,
    status: 'CUBE_CUBE_CUBED_READY_MLC_BIML_SELF_REFLECTION',
    waveShape: WAVE_SHAPE,
    stacks: STACKS.map((stack) => stack.id),
    dimensions: {
      D10_DIALECT: 'BEHCS_256_MLC_BIML_GLPJ',
      D11_PROOF: 'vote_aggregate_memory_model_card',
      D24_INTENT: 'systematic_compositional_generalization_for_asolaria',
      D35_HYPERLANGUAGE: 'map_map_mapped_mlc_biml',
      D36_INFERENCE_SURFACE: 'self_reflecting_deep_wave_cascade',
      D39_GNN_EDGE: 'weakest_dims_feed_repair',
      D42_ORCHESTRATION: 'six_stack_multi_cascade'
    },
    aggregate: {
      stackCount: aggregate.stackCount,
      stacksPresent: aggregate.stacksPresent,
      candidateCount: aggregate.candidateCount,
      totalBeats: aggregate.totalBeats,
      verdictCounts: aggregate.verdictCounts,
      weakestDims: aggregate.weakestDims
    },
    artifacts: outputs()
  };
  return `// cube: asolaria-mlc-biml-self-reflecting-cascade-cube-cubed | BEHCS-256 | MLC/BIML\nexport const CUBE = ${JSON.stringify(cube, null, 2)}\n`;
}

function outputs() {
  return {
    runRoot: repoRel(PATHS.runRoot),
    manifestsDir: repoRel(PATHS.manifestsDir),
    modelCard: repoRel(PATHS.modelCard),
    supervisorQueue: repoRel(PATHS.supervisorQueue),
    supervisorRunner: repoRel(PATHS.supervisorReportJson),
    aggregate: repoRel(PATHS.aggregate),
    memory: repoRel(PATHS.memory),
    index: repoRel(PATHS.index),
    map: repoRel(PATHS.map),
    cube: repoRel(PATHS.cube),
    glpj: repoRel(PATHS.glpj),
    reportJson: repoRel(PATHS.reportJson),
    reportMd: repoRel(PATHS.reportMd),
    votes: STACKS.map((stack) => `data/votes/${voteId(stack)}/behcs-v6-candidate-file.json`)
  };
}

function buildReportMd(report, aggregate) {
  const lines = [
    '# Asolaria MLC/BIML Self-Reflecting Cascade',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `Status: ${report.status}`,
    '',
    `- Wave: ${WAVE_SHAPE}`,
    `- Stacks: ${report.stackCount || STACKS.length}`,
    `- Candidate votes present: ${report.candidateCount || 0}`,
    `- Total beats: ${(report.totalBeats || 0).toLocaleString()}`,
    `- Verdicts: ${JSON.stringify(report.verdictCounts || {})}`,
    `- Weakest dims: ${JSON.stringify(report.weakestDims || {})}`,
    '',
    '## Stacks',
    '',
    ...STACKS.map((stack, index) => `${index + 1}. ${stack.title}: ${stack.thesis}`),
    '',
    '## Outputs',
    '',
    ...Object.entries(report.outputs || outputs()).map(([key, value]) => `- ${key}: \`${Array.isArray(value) ? value.join(', ') : value}\``)
  ];
  if (aggregate) {
    lines.push('', '## Stack Votes', '');
    for (const vote of aggregate.stackVotes) {
      lines.push(`- ${vote.stack}: ${vote.status}; beats=${vote.totalBeats || 0}; verdicts=${JSON.stringify(vote.verdictCounts || {})}`);
    }
  }
  return `${lines.join('\n')}\n`;
}

function main(argv) {
  const action = argv[2] || 'status';
  if (action === 'status' || action === 'prepare') {
    console.log(JSON.stringify(prepare({ execute: argv.includes('--execute') }), null, 2));
    return;
  }
  if (action === 'absorb') {
    console.log(JSON.stringify(absorb({ execute: argv.includes('--execute') }), null, 2));
    return;
  }
  console.error(JSON.stringify({
    ok: false,
    error: `Unknown action: ${action}`,
    usage: [
      'node tools/asolaria-mlc-biml-self-reflecting-cascade.js prepare --execute',
      'node tools/asolaria-mlc-biml-self-reflecting-cascade.js absorb --execute'
    ]
  }, null, 2));
  process.exitCode = 2;
}

main(process.argv);
