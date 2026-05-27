#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const behcs = require('./behcs/codex-bridge');

const ROOT = path.resolve(__dirname, '..');
const OPENCLAW_ROOT = 'C:/Users/acer/OpenClaw-v2026.4.24';
const BASE_TAG = 'v2026.4.23';
const HEAD_TAG = 'v2026.4.24';
const RUN_ID = 'openclaw-v2026-4-24-ingestion-20260426';
const RUN_ROOT = rel(`data/behcs/orchestration/${RUN_ID}`);
const WAVE_SHAPE = '2 x 12 candidates x 6x6x6x6x6x12 x omnishannon x GNN';
const PID_NAMESPACE_CAPACITY = 100_000_000_000;

const PLANES = [
  {
    id: 'openclaw-v2026-4-24-upgrades',
    title: 'OpenClaw 2026.4.24 Upgrade Intake',
    purpose: 'Evaluate which OpenClaw 4.24 changes should upgrade Asolaria architecture, connectors, runtime, diagnostics, and supervisor gates.',
    cube: 3442951,
    surfaces: [
      'google_meet_bundled_participant_plugin',
      'deepseek_v4_catalog_default',
      'full_agent_realtime_voice_consult',
      'browser_coordinate_click_recovery',
      'static_model_catalog_manifest_rows',
      'lazy_provider_dependencies_runtime_repair',
      'mcp_runtime_cleanup_idle_eviction',
      'session_browser_rollover_cleanup',
      'openai_codex_instructions_mapping',
      'telegram_webhook_ack_lane',
      'tts_audio_transcode_policy',
      'plugin_provider_runtime_contracts'
    ]
  },
  {
    id: 'openclaw-v2026-4-24-ingestion',
    title: 'OpenClaw 2026.4.24 Ingestion Into Asolaria',
    purpose: 'Absorb OpenClaw 4.24 into BEHCS-256 memory, index, map-map-mapped routes, cube-cube-cubed grammar, GLPJ glyphs, and supervisor task inventory.',
    cube: 3869893,
    surfaces: [
      'asolaria_provider_catalog_alignment',
      'asolaria_browser_connector_upgrade',
      'asolaria_voice_realtime_lane',
      'asolaria_meet_plugin_bound_adapter',
      'asolaria_mcp_lifecycle_cleanup',
      'asolaria_session_compaction_sync',
      'asolaria_plugin_sdk_parity',
      'asolaria_tool_result_pruning_guard',
      'asolaria_device_pairing_auth_scope',
      'asolaria_docs_indexer_absorption',
      'asolaria_liris_subcolony_projection',
      'asolaria_supervisor_gate_update'
    ]
  }
];

const PATHS = Object.freeze({
  runRoot: RUN_ROOT,
  manifestsDir: path.join(RUN_ROOT, 'manifests'),
  modelCard: path.join(RUN_ROOT, 'model-cards', 'openclaw-v2026-4-24-ingestion.model-card.v1.json'),
  cloneFacts: path.join(RUN_ROOT, 'openclaw-clone-facts.v1.json'),
  diffIndex: path.join(RUN_ROOT, 'openclaw-v2026-4-23-to-v2026-4-24-diff-index.v1.json'),
  changelogExtract: path.join(RUN_ROOT, 'openclaw-v2026-4-24-changelog-extract.md'),
  pidProfile: path.join(RUN_ROOT, 'pid-namespace-reservation.v1.json'),
  supervisorQueue: path.join(RUN_ROOT, 'supervisor-queue.ndjson'),
  supervisorReportJson: path.join(RUN_ROOT, 'supervisor-runner-latest.json'),
  aggregate: path.join(RUN_ROOT, 'openclaw-v2026-4-24-ingestion-aggregate-latest.json'),
  memory: rel('data/behcs/memory/openclaw-v2026-4-24-ingestion.v1.json'),
  index: rel('data/behcs/index/openclaw-v2026-4-24-ingestion-index.v1.json'),
  map: rel('data/behcs/maps/asolaria/openclaw-v2026-4-24-ingestion-map-map-mapped.v1.json'),
  cube: rel('data/behcs/cubes/openclaw-v2026-4-24-ingestion-cube-cubed.cube.js'),
  glpj: rel('data/behcs/codex/glyph-language/openclaw-v2026-4-24-ingestion-behcs256.glpj.json'),
  reportJson: rel('reports/openclaw-v2026-4-24-ingestion-latest.json'),
  reportMd: rel('reports/openclaw-v2026-4-24-ingestion-latest.md'),
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

function git(args, options = {}) {
  return execFileSync('git', args, {
    cwd: options.cwd || OPENCLAW_ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: options.maxBuffer || 64 * 1024 * 1024
  }).trim();
}

function manifestPath(plane) {
  return path.join(PATHS.manifestsDir, `${plane.id}.manifest.v1.json`);
}

function voteId(plane) {
  return `ASOLARIA-OPENCLAW-424-${plane.id.toUpperCase().replace(/[^A-Z0-9]+/g, '-')}-20260426`;
}

function votePath(plane) {
  return rel(`data/votes/${voteId(plane)}/behcs-v6-candidate-file.json`);
}

function cloneFacts(generatedAt) {
  const head = git(['rev-parse', 'HEAD']);
  const status = git(['status', '--short']);
  const describe = git(['describe', '--tags', '--always', '--dirty']);
  const trackedFiles = git(['ls-files']).split(/\r?\n/).filter(Boolean).length;
  return {
    factId: 'openclaw-v2026-4-24-clone-facts.v1',
    generatedAt,
    openclawRoot: OPENCLAW_ROOT,
    baseTag: BASE_TAG,
    headTag: HEAD_TAG,
    head,
    describe,
    detachedCheckout: true,
    worktreeClean: status.length === 0,
    status,
    trackedFiles
  };
}

function extractChangelog() {
  const changelogPath = path.join(OPENCLAW_ROOT, 'CHANGELOG.md');
  const text = fs.readFileSync(changelogPath, 'utf8');
  const start = text.indexOf('## 2026.4.24');
  const next = text.indexOf('\n## 2026.4.23', start + 1);
  if (start === -1) return '# OpenClaw 2026.4.24\n\nCHANGELOG section not found.\n';
  return text.slice(start, next === -1 ? undefined : next).trim() + '\n';
}

function classifyFile(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  if (normalized.startsWith('plugins/') || normalized.includes('/plugins/')) return 'plugins';
  if (normalized.startsWith('packages/') || normalized.includes('/packages/')) return 'packages';
  if (normalized.startsWith('src/model') || normalized.includes('model-catalog')) return 'model_catalog';
  if (normalized.includes('codex')) return 'codex_harness';
  if (normalized.includes('browser') || normalized.includes('playwright')) return 'browser';
  if (normalized.includes('mcp')) return 'mcp';
  if (normalized.includes('gateway')) return 'gateway';
  if (normalized.includes('memory')) return 'memory';
  if (normalized.includes('telegram')) return 'telegram';
  if (normalized.includes('voice') || normalized.includes('talk') || normalized.includes('tts')) return 'voice_tts';
  if (normalized.includes('meet') || normalized.includes('google')) return 'google_meet';
  if (normalized.startsWith('docs/') || normalized.includes('/docs/')) return 'docs';
  if (normalized.includes('test') || normalized.includes('__tests__')) return 'tests';
  return normalized.split('/')[0] || 'root';
}

function buildDiffIndex(generatedAt) {
  const raw = git(['diff', '--name-status', `${BASE_TAG}..${HEAD_TAG}`], { maxBuffer: 128 * 1024 * 1024 });
  const rows = raw.split(/\r?\n/).filter(Boolean).map((line) => {
    const parts = line.split(/\t+/);
    const status = parts[0];
    const file = parts[parts.length - 1];
    return { status, file, category: classifyFile(file) };
  });
  const stat = git(['diff', '--shortstat', `${BASE_TAG}..${HEAD_TAG}`]);
  const categories = {};
  const statuses = {};
  for (const row of rows) {
    categories[row.category] = (categories[row.category] || 0) + 1;
    statuses[row.status] = (statuses[row.status] || 0) + 1;
  }
  const topCategories = Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([category, count]) => ({ category, count }));
  return {
    diffIndexId: 'openclaw-v2026-4-23-to-v2026-4-24-diff-index.v1',
    generatedAt,
    baseTag: BASE_TAG,
    headTag: HEAD_TAG,
    shortstat: stat,
    changedFileCount: rows.length,
    statuses,
    topCategories,
    sampleFiles: rows.slice(0, 250),
    fullChangedFileListLocalCommand: `git -C ${OPENCLAW_ROOT} diff --name-status ${BASE_TAG}..${HEAD_TAG}`
  };
}

function buildPidProfile(generatedAt) {
  const namespaceSeed = sha256(`${RUN_ID}:${HEAD_TAG}:${generatedAt}`);
  const sample = Array.from({ length: 24 }, (_, index) => {
    const ordinal = index + 1;
    const hash = sha256(`${namespaceSeed}:${ordinal}`);
    return {
      ordinal,
      pid: `BH.OPENCLAW.424.${hash.slice(0, 12).toUpperCase()}`,
      glyph: glyph('openclaw_pid', `sample_${ordinal}`, hash),
      status: 'RESERVED_NOT_BOUND_TO_PROCESS'
    };
  });
  return {
    profileId: 'openclaw-v2026-4-24-pid-namespace-reservation.v1',
    generatedAt,
    requestedCapacity: PID_NAMESPACE_CAPACITY,
    namespaceSeed,
    deterministicRange: '0..99999999999',
    realOsProcessesSpawned: 0,
    providerSessionsOpened: 0,
    externalApiCallsMade: 0,
    policy: {
      meaning: 'Brown-Hilbert logical PID namespace reservation for future authorized workers, not 100B running OS processes.',
      requiresExplicitAuthorizedWorkerBinding: true,
      noProviderAuthBypass: true,
      noPaymentBypass: true,
      noUnboundedFanout: true,
      localPlanningOnly: true
    },
    sample
  };
}

function buildCandidates(plane, diffIndex) {
  return plane.surfaces.map((surface, index) => ({
    id: `aso.openclaw424.${plane.id}.${surface}`,
    label: `${plane.title} :: ${surface.replace(/_/g, ' ')}`,
    cube: plane.cube,
    primary_cube: plane.cube,
    metadata: {
      release: HEAD_TAG,
      base: BASE_TAG,
      plane: plane.id,
      surface,
      surfaceIndex: index + 1,
      changedFileCount: diffIndex.changedFileCount,
      proof_artifact: repoRel(PATHS.diffIndex),
      changelog: repoRel(PATHS.changelogExtract),
      pidNamespace: repoRel(PATHS.pidProfile),
      planningOnly: true,
      noExternalApiCalls: true,
      noProviderAuthBypass: true,
      noUnboundedWorkers: true
    }
  }));
}

function buildManifest(plane, generatedAt, diffIndex) {
  return {
    vote_id: voteId(plane),
    generatedAt,
    mode: 'openclaw-v2026-4-24-ingestion-candidate-file',
    taskId: 'ASOLARIA-OPENCLAW-424-INGESTION',
    planId: RUN_ID,
    purpose: plane.purpose,
    waveShape: WAVE_SHAPE,
    sourceReferences: [
      {
        id: 'OpenClaw-v2026.4.24',
        title: 'OpenClaw 2026.4.24 release',
        url: 'https://github.com/openclaw/openclaw/releases/tag/v2026.4.24',
        localClone: OPENCLAW_ROOT,
        localHead: readJson(PATHS.cloneFacts, {})?.head || null
      },
      {
        id: 'OpenClaw-v2026.4.23-to-v2026.4.24-diff',
        artifact: repoRel(PATHS.diffIndex),
        changedFileCount: diffIndex.changedFileCount
      }
    ],
    chain: 'OpenClaw clone -> diff index -> upgrade/ingestion planes -> BEHCS-256 -> Hookwall -> GNN -> OmniShannon -> supervisors',
    executionPolicy: {
      planningOnly: true,
      selfReflecting: true,
      externalApiCalls: false,
      providerAuthBypass: false,
      paymentBypass: false,
      remoteMutation: false,
      spawnWorkers: false,
      uncontrolledFanout: false,
      executorDispatches: false
    },
    candidates: buildCandidates(plane, diffIndex)
  };
}

function buildModelCard(generatedAt, facts, diffIndex) {
  return {
    modelCardId: 'openclaw-v2026-4-24-ingestion.model-card.v1',
    generatedAt,
    status: 'READY_FOR_SUPERVISOR_REVIEW',
    owner: 'asolaria-canonical',
    mode: 'local_clone_diff_study_and_cascade_proof_only',
    purpose: 'Study OpenClaw 2026.4.24 for Asolaria upgrades and ingestion before the larger 200-step system plan.',
    sourceAnchors: [
      'OpenClaw v2026.4.24 stable release tag',
      'OpenClaw v2026.4.23..v2026.4.24 local git diff',
      'Asolaria BEHCS-256 supervisor/Hermes/OmniShannon/GNN surfaces'
    ],
    cloneFacts: {
      openclawRoot: facts.openclawRoot,
      headTag: facts.headTag,
      head: facts.head,
      trackedFiles: facts.trackedFiles,
      worktreeClean: facts.worktreeClean
    },
    diff: {
      baseTag: diffIndex.baseTag,
      headTag: diffIndex.headTag,
      shortstat: diffIndex.shortstat,
      changedFileCount: diffIndex.changedFileCount,
      topCategories: diffIndex.topCategories
    },
    releaseSignals: [
      'Google Meet bundled participant plugin',
      'Gemini Live and realtime voice tool handoff surfaces',
      'DeepSeek V4 Flash/Pro model catalog update',
      'browser coordinate clicks and tab recovery',
      'static model catalogs and manifest-backed model rows',
      'MCP runtime cleanup and idle eviction',
      'Codex harness context-engine and tool-hook bridge',
      'gateway pairing and security hardening',
      'tool-result pruning and diagnostics hardening'
    ],
    allowedActions: [
      'read cloned OpenClaw source',
      'run local git diff and status commands',
      'write local manifests and reports',
      'run local BEHCS v6 cascade engine',
      'write memory index map cube GLPJ artifacts'
    ],
    blockedActions: [
      'provider auth bypass',
      'payment bypass',
      'unbounded real worker fanout',
      'secret extraction',
      'remote mutation',
      'cloud upload',
      'boot firmware mutation',
      'evidence deletion'
    ],
    gates: [
      'Hermes supervisor-of-supervisors aware',
      'model_card_gate',
      'synthetic_first_ci',
      'reverse_gain_review',
      'connector_health_matrix',
      'supervisor_gate_update'
    ]
  };
}

function buildSupervisorPacket(plane, generatedAt) {
  return {
    id: `ASO-OPENCLAW-424-SUP-${plane.id}`,
    title: `${plane.title} supervisor packet`,
    objective: `${plane.purpose} Use local clone and diff artifacts only; do not spawn external workers or mutate provider/device/cloud surfaces.`,
    instructions: 'Evaluate OpenClaw 4.24 upgrade/ingestion readiness with BEHCS-256, map-map-mapped, cube-cube-cubed, Hookwall, GNN, OmniShannon, white rooms, GC, Hermes, and Shannon.',
    requestedWorker: 'local_behcs_v6_cascade_engine',
    pid: `BH.ASO.OPENCLAW.424.${plane.id.toUpperCase().replace(/[^A-Z0-9]+/g, '.')}`,
    pidScope: 'local_openclaw_ingestion_proof_only',
    consentScope: 'operator_authorized_local_planning',
    allowedPaths: [
      repoRel(RUN_ROOT),
      'data/behcs/orchestration',
      'data/behcs/maps/asolaria',
      'data/behcs/cubes',
      'data/votes',
      'reports',
      'C:/Users/acer/OpenClaw-v2026.4.24'
    ],
    expectedArtifacts: [
      repoRel(manifestPath(plane)),
      repoRel(PATHS.modelCard),
      repoRel(PATHS.diffIndex),
      `data/votes/${voteId(plane)}/behcs-v6-candidate-file.json`
    ],
    acceptanceGates: [
      'model_card_gate_review',
      'diff_index_present',
      'changelog_extract_present',
      'cascade_vote_present',
      'map_map_mapped_reference_present',
      'cube_cube_cubed_reference_present'
    ],
    proofRequired: true,
    proofRefs: [repoRel(PATHS.modelCard), repoRel(PATHS.diffIndex), repoRel(manifestPath(plane))],
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
    source: 'asolaria-openclaw-v2026-4-24-ingestion'
  };
}

function buildPreparedArtifacts(generatedAt) {
  const facts = cloneFacts(generatedAt);
  const diffIndex = buildDiffIndex(generatedAt);
  const changelog = extractChangelog();
  const pidProfile = buildPidProfile(generatedAt);
  const manifests = PLANES.map((plane) => buildManifest(plane, generatedAt, diffIndex));
  const modelCard = buildModelCard(generatedAt, facts, diffIndex);
  const supervisorPackets = PLANES.map((plane) => buildSupervisorPacket(plane, generatedAt));
  const mints = [
    ['openclaw424_clone_facts', PATHS.cloneFacts, 'D11_PROOF'],
    ['openclaw424_diff_index', PATHS.diffIndex, 'D13_SURFACE'],
    ['openclaw424_changelog_extract', PATHS.changelogExtract, 'D22_TRANSLATION'],
    ['openclaw424_pid_namespace', PATHS.pidProfile, 'D16_PID'],
    ['openclaw424_model_card', PATHS.modelCard, 'D11_PROOF'],
    ['openclaw424_supervisor_queue', PATHS.supervisorQueue, 'D41_SUPERVISOR'],
    ['openclaw424_upgrade_manifest', manifestPath(PLANES[0]), 'D36_INFERENCE_SURFACE'],
    ['openclaw424_ingestion_manifest', manifestPath(PLANES[1]), 'D36_INFERENCE_SURFACE'],
    ['openclaw424_map_map_mapped', PATHS.map, 'D35_HYPERLANGUAGE'],
    ['openclaw424_cube_cube_cubed', PATHS.cube, 'D42_ORCHESTRATION']
  ].map(([id, artifact, dimension]) => ({
    id,
    dimension,
    artifact: repoRel(artifact),
    glyph: glyph('openclaw424_ingestion', id, `${generatedAt}:${artifact}`)
  }));
  return { facts, diffIndex, changelog, pidProfile, manifests, modelCard, supervisorPackets, mints };
}

function prepare({ execute = false } = {}) {
  const generatedAt = new Date().toISOString();
  if (!fs.existsSync(OPENCLAW_ROOT)) {
    return { ok: false, error: `OpenClaw clone not found: ${OPENCLAW_ROOT}` };
  }
  const artifacts = buildPreparedArtifacts(generatedAt);
  const report = {
    reportId: 'openclaw-v2026-4-24-ingestion-latest',
    generatedAt,
    status: 'PREPARED_PENDING_SUPERVISOR_AND_CASCADE_RUNS',
    runId: RUN_ID,
    planeCount: PLANES.length,
    candidateCount: PLANES.reduce((sum, plane) => sum + plane.surfaces.length, 0),
    diffChangedFiles: artifacts.diffIndex.changedFileCount,
    diffShortstat: artifacts.diffIndex.shortstat,
    pidNamespaceCapacity: PID_NAMESPACE_CAPACITY,
    realOsProcessesSpawned: 0,
    providerSessionsOpened: 0,
    outputs: outputs()
  };

  if (execute) {
    writeJson(PATHS.cloneFacts, artifacts.facts);
    writeJson(PATHS.diffIndex, artifacts.diffIndex);
    writeText(PATHS.changelogExtract, artifacts.changelog);
    writeJson(PATHS.pidProfile, artifacts.pidProfile);
    for (const manifest of artifacts.manifests) {
      const plane = PLANES.find((item) => voteId(item) === manifest.vote_id);
      writeJson(manifestPath(plane), manifest);
    }
    writeJson(PATHS.modelCard, artifacts.modelCard);
    writeText(PATHS.supervisorQueue, artifacts.supervisorPackets.map((packet) => JSON.stringify(packet)).join('\n') + '\n');
    writeJson(PATHS.glpj, {
      glpjId: 'openclaw-v2026-4-24-ingestion-behcs256.glpj',
      generatedAt,
      status: 'BEHCS256_OPENCLAW_424_GLYPHS_PREPARED',
      alphabetBase: 256,
      mints: artifacts.mints
    });
    writeJson(PATHS.reportJson, report);
    writeText(PATHS.reportMd, buildReportMd(report, null));
    appendNdjson(PATHS.globalInbox, {
      id: `${RUN_ID}-prepare-${Date.now()}`,
      ts: generatedAt,
      from: 'asolaria-canonical',
      to: 'hermes-supervisor-of-supervisors',
      verb: 'EVT-OPENCLAW-424-INGESTION-PREPARED',
      body: {
        runId: RUN_ID,
        release: HEAD_TAG,
        changedFileCount: artifacts.diffIndex.changedFileCount,
        planes: PLANES.map((plane) => plane.id)
      }
    });
    appendNdjson(PATHS.gnnEdges, {
      id: `${RUN_ID}-prepare-gnn-${Date.now()}`,
      ts: generatedAt,
      from: 'OPENCLAW_424',
      to: 'ASOLARIA_UPGRADE_INGESTION',
      verb: 'prepares_stable_release_absorption',
      weight: 0.997,
      changedFileCount: artifacts.diffIndex.changedFileCount
    });
  }

  return {
    ok: true,
    action: execute ? 'prepare-write' : 'prepare-preview',
    generatedAt,
    runId: RUN_ID,
    release: HEAD_TAG,
    cloneHead: artifacts.facts.head,
    changedFileCount: artifacts.diffIndex.changedFileCount,
    candidateCount: report.candidateCount,
    manifests: PLANES.map((plane) => repoRel(manifestPath(plane))),
    outputs: outputs()
  };
}

function summarizeVote(plane) {
  const filePath = votePath(plane);
  const vote = readJson(filePath);
  if (!vote) {
    return {
      plane: plane.id,
      title: plane.title,
      voteId: voteId(plane),
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
    if (weakest) weakestDims[weakest] = (weakestDims[weakest] || 0) + 1;
    if (result.gnnOverride) gnnOverrides.add(result.gnnOverride);
  }
  return {
    plane: plane.id,
    title: plane.title,
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
  const planeVotes = PLANES.map(summarizeVote);
  const present = planeVotes.filter((item) => item.status === 'PRESENT');
  const missing = planeVotes.filter((item) => item.status !== 'PRESENT');
  const diffIndex = readJson(PATHS.diffIndex, { changedFileCount: 0, topCategories: [], shortstat: null });
  const facts = readJson(PATHS.cloneFacts, {});
  const pidProfile = readJson(PATHS.pidProfile, {});
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
    for (const override of vote.gnnOverrides || []) gnnOverrides.add(override);
  }

  const aggregate = {
    aggregateId: 'openclaw-v2026-4-24-ingestion-aggregate-latest',
    generatedAt,
    status: missing.length > 0 ? 'PARTIAL_PLANE_VOTES_PRESENT' : 'OPENCLAW_424_PLANES_VOTED_AND_READY_FOR_REVIEW',
    runId: RUN_ID,
    waveShape: WAVE_SHAPE,
    release: HEAD_TAG,
    cloneHead: facts.head,
    changedFileCount: diffIndex.changedFileCount,
    diffShortstat: diffIndex.shortstat,
    topCategories: diffIndex.topCategories || [],
    planeCount: PLANES.length,
    planesPresent: present.length,
    planesMissing: missing.length,
    candidateCount: present.reduce((sum, item) => sum + (item.candidatesScanned || 0), 0),
    totalBeats,
    verdictCounts,
    weakestDims,
    gnnOverrides: Array.from(gnnOverrides),
    planeVotes,
    pidNamespace: {
      requestedCapacity: pidProfile.requestedCapacity || PID_NAMESPACE_CAPACITY,
      realOsProcessesSpawned: pidProfile.realOsProcessesSpawned || 0,
      providerSessionsOpened: pidProfile.providerSessionsOpened || 0
    },
    triggerDisposition: 'review_before_execution'
  };

  const memory = {
    eventId: 'openclaw-v2026-4-24-ingestion.v1',
    generatedAt,
    status: aggregate.status,
    significance: 'OpenClaw 2026.4.24 was cloned, pinned, diffed, and passed into Asolaria as a two-plane upgrade and ingestion intake before the new 200-step system plan. The event shifts the next plan from abstract recovery into concrete parity targets: realtime voice handoff, Google Meet participant plugin shape, model catalog manifests, browser coordinate control, MCP cleanup, Codex harness parity, gateway pairing, diagnostics, and tool-result pruning.',
    release: HEAD_TAG,
    cloneHead: facts.head,
    changedFileCount: diffIndex.changedFileCount,
    aggregate: repoRel(PATHS.aggregate),
    totalBeats,
    verdictCounts,
    weakestDims,
    writePolicy: 'local_artifacts_only_review_before_execution'
  };

  const index = {
    indexId: 'openclaw-v2026-4-24-ingestion-index.v1',
    generatedAt,
    status: 'INDEX_READY_OPENCLAW_424_UPGRADE_INGESTION',
    keys: [
      'OpenClaw',
      'v2026.4.24',
      'Google Meet plugin',
      'Gemini Live',
      'DeepSeek V4 Flash',
      'browser coordinate clicks',
      'static model catalogs',
      'manifest-backed model rows',
      'Codex harness',
      'MCP cleanup',
      'tool-result pruning',
      'gateway pairing',
      'BEHCS-256',
      'map-map-mapped',
      'cube-cube-cubed',
      'GLPJ'
    ],
    artifacts: outputs(),
    planeVotes
  };

  const map = {
    mapId: 'openclaw-v2026-4-24-ingestion-map-map-mapped.v1',
    generatedAt,
    status: 'MAP_MAP_MAPPED_READY_OPENCLAW_424',
    routes: [
      { from: 'OpenClaw_v2026.4.24', to: 'Asolaria_upgrade_plane', edge: 'diff_drives_upgrade_candidates', artifact: repoRel(PATHS.diffIndex) },
      { from: 'OpenClaw_v2026.4.24', to: 'Asolaria_ingestion_plane', edge: 'changelog_drives_memory_index_cube_glpj', artifact: repoRel(PATHS.changelogExtract) },
      { from: 'Google_Meet_plugin', to: 'Asolaria_realtime_meeting_lane', edge: 'inspires_bounded_adapter', artifact: repoRel(PATHS.aggregate) },
      { from: 'Gemini_Live_and_voice_handoff', to: 'Asolaria_voice_realtime_lane', edge: 'maps_to_tool_backed_audio_loop', artifact: repoRel(PATHS.aggregate) },
      { from: 'static_model_catalogs', to: 'Asolaria_connector_catalogs', edge: 'reduces_startup_runtime_loading', artifact: repoRel(PATHS.modelCard) },
      { from: 'MCP_cleanup_idle_eviction', to: 'Asolaria_worker_lifecycle', edge: 'prevents_child_process_accumulation', artifact: repoRel(PATHS.aggregate) },
      { from: 'Codex_harness_hooks', to: 'Asolaria_worker_router', edge: 'targets_parity_without_provider_bypass', artifact: repoRel(PATHS.modelCard) },
      { from: 'OpenClaw_424_PID_namespace', to: 'future_authorized_workers', edge: 'reserves_logical_pid_range_without_process_fanout', artifact: repoRel(PATHS.pidProfile) }
    ]
  };

  const cube = buildCube(generatedAt, aggregate);
  const glpj = readJson(PATHS.glpj, {
    glpjId: 'openclaw-v2026-4-24-ingestion-behcs256.glpj',
    generatedAt,
    status: 'BEHCS256_OPENCLAW_424_GLYPHS_PREPARED',
    alphabetBase: 256,
    mints: []
  });
  const known = new Set((glpj.mints || []).map((mint) => mint.id));
  for (const [id, artifact, dimension] of [
    ['openclaw424_vote_aggregate', PATHS.aggregate, 'D11_PROOF'],
    ['openclaw424_memory_written', PATHS.memory, 'D11_PROOF'],
    ['openclaw424_index_written', PATHS.index, 'D13_SURFACE'],
    ['openclaw424_map_written', PATHS.map, 'D35_HYPERLANGUAGE'],
    ['openclaw424_cube_written', PATHS.cube, 'D42_ORCHESTRATION'],
    ['openclaw424_supervisor_awareness', PATHS.supervisorReportJson, 'D41_SUPERVISOR']
  ]) {
    if (!known.has(id)) {
      glpj.mints.push({
        id,
        dimension,
        artifact: repoRel(artifact),
        glyph: glyph('openclaw424_ingestion_proof', id, `${generatedAt}:${artifact}`)
      });
    }
  }
  glpj.status = 'BEHCS256_OPENCLAW_424_PROOF_GLYPHS_MINTED';

  const report = {
    reportId: 'openclaw-v2026-4-24-ingestion-latest',
    generatedAt,
    status: aggregate.status,
    runId: RUN_ID,
    release: HEAD_TAG,
    cloneHead: facts.head,
    changedFileCount: diffIndex.changedFileCount,
    planeCount: PLANES.length,
    planesPresent: present.length,
    planesMissing: missing.length,
    candidateCount: aggregate.candidateCount,
    totalBeats,
    verdictCounts,
    weakestDims,
    gnnOverrides: aggregate.gnnOverrides,
    pidNamespaceCapacity: pidProfile.requestedCapacity || PID_NAMESPACE_CAPACITY,
    realOsProcessesSpawned: pidProfile.realOsProcessesSpawned || 0,
    providerSessionsOpened: pidProfile.providerSessionsOpened || 0,
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
      from: 'OPENCLAW_424_INGESTION',
      to: 'ASOLARIA_MEMORY_INDEX_MAP_CUBE_GLPJ',
      verb: 'absorbs_release_diff_vote_evidence',
      weight: 0.998,
      totalBeats,
      changedFileCount: diffIndex.changedFileCount
    });
  }

  return {
    ok: true,
    action: execute ? 'absorb-write' : 'absorb-preview',
    generatedAt,
    status: aggregate.status,
    planesPresent: present.length,
    planesMissing: missing.length,
    candidateCount: aggregate.candidateCount,
    totalBeats,
    verdictCounts,
    weakestDims,
    outputs: outputs()
  };
}

function buildCube(generatedAt, aggregate) {
  const cube = {
    id: 'openclaw-v2026-4-24-ingestion-cube-cubed',
    generatedAt,
    status: 'CUBE_CUBE_CUBED_READY_OPENCLAW_424_INGESTION',
    release: HEAD_TAG,
    waveShape: WAVE_SHAPE,
    dimensions: {
      D10_DIALECT: 'BEHCS_256_OPENCLAW_424_GLPJ',
      D11_PROOF: 'clone_diff_vote_aggregate_model_card',
      D13_SURFACE: 'upgrade_ingestion_candidate_planes',
      D16_PID: 'logical_pid_namespace_reservation',
      D18_AI_MODEL: 'model_catalog_manifest_rows',
      D22_TRANSLATION: 'OpenClaw_changelog_to_Asolaria_tasks',
      D24_INTENT: 'upgrade_then_ingest_before_200_step_plan',
      D35_HYPERLANGUAGE: 'map_map_mapped_openclaw424',
      D36_INFERENCE_SURFACE: 'deep_wave_openclaw_diff_cascade',
      D39_GNN_EDGE: 'release_features_to_asolaria_subsystems',
      D41_SUPERVISOR: 'Hermes_Shannon_supervisor_gate_update',
      D42_ORCHESTRATION: 'two_plane_upgrade_ingestion'
    },
    aggregate: {
      release: aggregate.release,
      changedFileCount: aggregate.changedFileCount,
      planeCount: aggregate.planeCount,
      planesPresent: aggregate.planesPresent,
      candidateCount: aggregate.candidateCount,
      totalBeats: aggregate.totalBeats,
      verdictCounts: aggregate.verdictCounts,
      weakestDims: aggregate.weakestDims,
      pidNamespace: aggregate.pidNamespace
    },
    artifacts: outputs()
  };
  return `// cube: openclaw-v2026-4-24-ingestion-cube-cubed | BEHCS-256 | OpenClaw 4.24\nexport const CUBE = ${JSON.stringify(cube, null, 2)}\n`;
}

function outputs() {
  return {
    openclawRoot: OPENCLAW_ROOT,
    runRoot: repoRel(PATHS.runRoot),
    manifestsDir: repoRel(PATHS.manifestsDir),
    cloneFacts: repoRel(PATHS.cloneFacts),
    diffIndex: repoRel(PATHS.diffIndex),
    changelogExtract: repoRel(PATHS.changelogExtract),
    pidProfile: repoRel(PATHS.pidProfile),
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
    votes: PLANES.map((plane) => `data/votes/${voteId(plane)}/behcs-v6-candidate-file.json`)
  };
}

function buildReportMd(report, aggregate) {
  const lines = [
    '# OpenClaw 2026.4.24 Ingestion',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `Status: ${report.status}`,
    '',
    `- Release: ${report.release || HEAD_TAG}`,
    `- Clone head: ${report.cloneHead || 'pending'}`,
    `- Changed files: ${(report.changedFileCount || 0).toLocaleString()}`,
    `- Wave: ${WAVE_SHAPE}`,
    `- Planes: ${report.planeCount || PLANES.length}`,
    `- Candidate votes present: ${report.candidateCount || 0}`,
    `- Total beats: ${(report.totalBeats || 0).toLocaleString()}`,
    `- Verdicts: ${JSON.stringify(report.verdictCounts || {})}`,
    `- Weakest dims: ${JSON.stringify(report.weakestDims || {})}`,
    `- PID namespace capacity: ${(report.pidNamespaceCapacity || PID_NAMESPACE_CAPACITY).toLocaleString()}`,
    `- Real OS processes spawned: ${report.realOsProcessesSpawned || 0}`,
    `- Provider sessions opened: ${report.providerSessionsOpened || 0}`,
    '',
    '## Intake Planes',
    '',
    ...PLANES.map((plane, index) => `${index + 1}. ${plane.title}: ${plane.purpose}`),
    '',
    '## Immediate Asolaria Upgrade Targets',
    '',
    '- Realtime voice handoff and meeting participant lanes',
    '- Browser coordinate control and tab recovery',
    '- Static model catalog and manifest-backed model rows',
    '- MCP runtime cleanup and idle eviction',
    '- Codex harness hook parity without provider bypass',
    '- Gateway pairing, diagnostics, and tool-result pruning hardening',
    '',
    '## Outputs',
    '',
    ...Object.entries(report.outputs || outputs()).map(([key, value]) => `- ${key}: \`${Array.isArray(value) ? value.join(', ') : value}\``)
  ];
  if (aggregate) {
    lines.push('', '## Plane Votes', '');
    for (const vote of aggregate.planeVotes) {
      lines.push(`- ${vote.plane}: ${vote.status}; beats=${vote.totalBeats || 0}; executorDispatches=${vote.executorDispatches || 0}; verdicts=${JSON.stringify(vote.verdictCounts || {})}`);
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
      'node tools/asolaria-openclaw-424-ingestion-cascade.js prepare --execute',
      'node tools/behcs/behcs-deep-cascade-v6.js data/behcs/orchestration/openclaw-v2026-4-24-ingestion-20260426/manifests/openclaw-v2026-4-24-upgrades.manifest.v1.json',
      'node tools/behcs/behcs-deep-cascade-v6.js data/behcs/orchestration/openclaw-v2026-4-24-ingestion-20260426/manifests/openclaw-v2026-4-24-ingestion.manifest.v1.json',
      'node tools/asolaria-openclaw-424-ingestion-cascade.js absorb --execute'
    ]
  }, null, 2));
  process.exitCode = 2;
}

main(process.argv);
