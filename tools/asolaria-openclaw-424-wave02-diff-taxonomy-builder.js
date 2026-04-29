#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const childProcess = require('child_process');
const behcs = require('./behcs/codex-bridge');

const ROOT = path.resolve(__dirname, '..');
const INGEST_RUN = 'openclaw-v2026-4-24-ingestion-20260426';
const ORCH_RUN = 'openclaw-424-room-execution-orchestration-20260426';
const WAVE_ID = 'wave-02';
const PHASE_ID = 'p02-diff-taxonomy-file-ownership';
const EXECUTOR_ID = 'exec-p02-diff-taxonomy-file-ownership';
const WAVE_ROOT = rel(`data/behcs/orchestration/${ORCH_RUN}/wave-execution/${WAVE_ID}`);

const SOURCE_PATHS = Object.freeze({
  ticket: rel(`data/behcs/orchestration/${ORCH_RUN}/executor-inboxes/${EXECUTOR_ID}/executor-ticket.v1.json`),
  cloneFacts: rel(`data/behcs/orchestration/${INGEST_RUN}/openclaw-clone-facts.v1.json`),
  diffIndex: rel(`data/behcs/orchestration/${INGEST_RUN}/openclaw-v2026-4-23-to-v2026-4-24-diff-index.v1.json`),
  aggregate: rel(`data/behcs/orchestration/${INGEST_RUN}/openclaw-v2026-4-24-ingestion-aggregate-latest.json`),
  modelCard: rel(`data/behcs/orchestration/${INGEST_RUN}/model-cards/openclaw-v2026-4-24-ingestion.model-card.v1.json`)
});

const PATHS = Object.freeze({
  waveRoot: WAVE_ROOT,
  taxonomyJson: path.join(WAVE_ROOT, 'diff-taxonomy.v1.json'),
  taxonomyNdjson: path.join(WAVE_ROOT, 'diff-taxonomy.v1.ndjson'),
  categorySummaryJson: path.join(WAVE_ROOT, 'category-summary.v1.json'),
  categorySummaryNdjson: path.join(WAVE_ROOT, 'category-summary.v1.ndjson'),
  ownershipJson: path.join(WAVE_ROOT, 'ownership-table.v1.json'),
  ownershipNdjson: path.join(WAVE_ROOT, 'ownership-table.v1.ndjson'),
  reviewQueue: path.join(WAVE_ROOT, 'review-boundary-queue.v1.ndjson'),
  taskResults: path.join(WAVE_ROOT, 'execution-task-results.v1.ndjson'),
  executionResult: path.join(WAVE_ROOT, 'execution-result.v1.json'),
  completionSupervisorQueue: path.join(WAVE_ROOT, 'completion-supervisor-queue.ndjson'),
  memory: rel('data/behcs/memory/openclaw-424-wave-02-diff-taxonomy.v1.json'),
  index: rel('data/behcs/index/openclaw-424-wave-02-diff-taxonomy-index.v1.json'),
  map: rel('data/behcs/maps/asolaria/openclaw-424-wave-02-diff-taxonomy-map-map-mapped.v1.json'),
  cube: rel('data/behcs/cubes/openclaw-424-wave-02-diff-taxonomy-cube-cubed.cube.js'),
  glpj: rel('data/behcs/codex/glyph-language/openclaw-424-wave-02-diff-taxonomy-behcs256.glpj.json'),
  reportJson: rel('reports/openclaw-424-wave-02-diff-taxonomy-latest.json'),
  reportMd: rel('reports/openclaw-424-wave-02-diff-taxonomy-latest.md'),
  globalInbox: rel('data/behcs/inbox.ndjson'),
  gnnEdges: rel('data/behcs/gnn-live-edges.ndjson')
});

const CATEGORY_ROUTES = Object.freeze({
  tests: route('sentinel', ['helm'], 'p19-synthetic-ci-test-harness', 'tests and CI fixtures', ['L10_TESTS_CI'], 'test_or_fixture'),
  '.github': route('sentinel', ['falcon'], 'p19-synthetic-ci-test-harness', '.github workflows and policy automation', ['L10_TESTS_CI'], 'ci_policy'),
  qa: route('sentinel', ['rook'], 'p19-synthetic-ci-test-harness', 'QA harness and release checks', ['L10_TESTS_CI'], 'test_or_fixture'),
  src: route('forge', ['helm', 'sentinel'], 'p07-codex-harness-parity', 'core source/runtime candidates', ['L03_BRAIN_WORKER'], 'code_change'),
  packages: route('forge', ['vector'], 'p08-plugin-sdk-tool-result-middleware', 'package-level runtime/library candidates', ['L04_PLUGIN_SKILL'], 'code_change'),
  extensions: route('vector', ['sentinel'], 'p08-plugin-sdk-tool-result-middleware', 'extension/plugin compatibility candidates', ['L04_PLUGIN_SKILL'], 'code_change'),
  docs: route('helm', ['rook'], 'p20-rollout-recovery-governance', 'documentation and rollout notes', ['L01_DOCS_TASKS'], 'documentation'),
  gateway: route('falcon', ['sentinel'], 'p13-gateway-pairing-node-security', 'gateway, authority, pairing, and security surfaces', ['L02_GATEWAY_SECURITY'], 'security_code'),
  plugins: route('vector', ['sentinel'], 'p08-plugin-sdk-tool-result-middleware', 'plugin SDK and tool-result middleware surfaces', ['L04_PLUGIN_SKILL'], 'plugin_code'),
  browser: route('gaia', ['sentinel'], 'p09-browser-coordinate-control', 'browser, desktop, Playwright, and coordinate-control surfaces', ['L05_BROWSER_DESKTOP'], 'interaction_code'),
  codex_harness: route('helm', ['sentinel'], 'p07-codex-harness-parity', 'Codex harness and CLI parity surfaces', ['L03_BRAIN_WORKER'], 'worker_harness'),
  voice_tts: route('gaia', ['falcon'], 'p17-audio-tts-media-handling', 'audio, TTS, speech, and media handling surfaces', ['L06_VOICE_MEDIA_CHANNELS'], 'media_code'),
  memory: route('rook', ['helm'], 'p14-memory-hybrid-search-indexer', 'memory, hybrid search, compaction, and index surfaces', ['L07_MEMORY_INDEX'], 'memory_code'),
  google_meet: route('falcon', ['gaia'], 'p10-realtime-voice-meeting-lanes', 'Google/Meet/realtime meeting surfaces', ['L06_VOICE_MEDIA_CHANNELS'], 'meeting_code'),
  ui: route('gaia', ['vector'], 'p09-browser-coordinate-control', 'UI and operator-facing interaction surfaces', ['L05_BROWSER_DESKTOP'], 'ui_code'),
  scripts: route('dasein', ['sentinel'], 'p11-mcp-lifecycle-cleanup', 'scripts, lifecycle, install, and process helper surfaces', ['L08_MCP_PROCESS', 'L10_TESTS_CI'], 'runtime_lifecycle'),
  telegram: route('falcon', ['gaia'], 'p16-messaging-channel-robustness', 'Telegram and messaging connector surfaces', ['L06_VOICE_MEDIA_CHANNELS'], 'channel_code'),
  apps: route('vector', ['gaia'], 'p08-plugin-sdk-tool-result-middleware', 'app packages and app-facing integration surfaces', ['L04_PLUGIN_SKILL'], 'app_code'),
  mcp: route('dasein', ['falcon'], 'p11-mcp-lifecycle-cleanup', 'MCP lifecycle and process-bound tool surfaces', ['L08_MCP_PROCESS'], 'mcp_lifecycle'),
  model_catalog: route('selector', ['helm', 'sentinel'], 'p05-model-catalog-manifest-alignment', 'model catalog, provider manifest, and selection surfaces', ['L03_BRAIN_WORKER', 'L04_PLUGIN_SKILL'], 'model_catalog'),
  '.agents': route('sentinel', ['helm'], 'p19-synthetic-ci-test-harness', 'agent skill policy and QA surfaces', ['L10_TESTS_CI', 'L01_DOCS_TASKS'], 'agent_policy')
});

function route(primaryOwner, supportOwners, targetPhase, asolariaSurface, writeLocks, implementationType) {
  return {
    primaryOwner,
    supportOwners,
    targetPhase,
    asolariaSurface,
    writeLocks,
    implementationType
  };
}

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

function writeNdjson(filePath, rows) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, rows.map((row) => JSON.stringify(row)).join('\n') + (rows.length ? '\n' : ''), 'utf8');
}

function appendNdjson(filePath, row) {
  ensureDir(filePath);
  fs.appendFileSync(filePath, `${JSON.stringify(row)}\n`, 'utf8');
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

function glyph(kind, id, seed = '') {
  const hash = sha256(`${kind}:${id}:${seed}`);
  return `HG256:${kind.toUpperCase()}:${hash.slice(0, 8).toUpperCase()}:${behcs.hilbertAddress(hash)}`;
}

function git(openclawRoot, args, options = {}) {
  return childProcess.execFileSync('git', ['-C', openclawRoot, ...args], {
    encoding: 'utf8',
    maxBuffer: options.maxBuffer || 128 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe']
  }).trim();
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

function routeForCategory(category) {
  if (CATEGORY_ROUTES[category]) return CATEGORY_ROUTES[category];
  if (category.endsWith('.md')) return route('helm', ['rook'], 'p20-rollout-recovery-governance', 'root documentation', ['L01_DOCS_TASKS'], 'documentation');
  if (category.startsWith('.')) return route('sentinel', ['helm'], 'p19-synthetic-ci-test-harness', 'root config and automation policy', ['L10_TESTS_CI'], 'ci_policy');
  return route('rook', ['helm'], PHASE_ID, `unmapped OpenClaw category ${category}`, ['L00_PROOF_DATA'], 'taxonomy_only');
}

function riskFlags(file, category) {
  const text = `${file} ${category}`.toLowerCase();
  const flags = [];
  if (/(gateway|auth|oauth|token|secret|credential|permission|key|session|cookie|security)/.test(text)) {
    flags.push('reverse_gain_security_review');
  }
  if (/(api|provider|model|anthropic|openai|gemini|codex|claude|llm)/.test(text)) {
    flags.push('provider_auth_boundary_review');
  }
  if (/(browser|playwright|desktop|screenshot|coordinate|mouse|keyboard|device)/.test(text)) {
    flags.push('operator_consent_device_scope_review');
  }
  if (/(voice|tts|audio|media|meet|telegram|slack|channel|message)/.test(text)) {
    flags.push('channel_consent_and_fixture_review');
  }
  if (/(mcp|server|process|worker|daemon|lifecycle|install|script)/.test(text)) {
    flags.push('synthetic_first_runtime_lifecycle_review');
  }
  if (/(test|ci|workflow|qa|spec)/.test(text)) {
    flags.push('synthetic_ci_gate');
  }
  if (flags.length < 1) flags.push('comparison_only_no_remote_mutation');
  return Array.from(new Set(flags));
}

function parseDiffRows(openclawRoot, baseTag, headTag) {
  const raw = git(openclawRoot, ['diff', '--name-status', `${baseTag}..${headTag}`]);
  return raw.split(/\r?\n/)
    .filter(Boolean)
    .map((line, index) => {
      const parts = line.split(/\t+/);
      const status = parts[0];
      const oldFile = parts.length > 2 ? parts[1] : '';
      const file = parts[parts.length - 1];
      const category = classifyFile(file);
      const routeInfo = routeForCategory(category);
      const flags = riskFlags(file, category);
      return {
        ordinal: index + 1,
        status,
        oldFile,
        file,
        category,
        primaryOwner: routeInfo.primaryOwner,
        supportOwners: routeInfo.supportOwners,
        targetPhase: routeInfo.targetPhase,
        asolariaSurface: routeInfo.asolariaSurface,
        writeLocks: routeInfo.writeLocks,
        implementationType: routeInfo.implementationType,
        reviewFlags: flags,
        comparisonOnly: true,
        remoteMutationAllowed: false,
        glyph: glyph('openclaw_424_diff_row', file, `${status}:${category}:${routeInfo.targetPhase}`)
      };
    });
}

function countBy(rows, key) {
  const counts = {};
  for (const row of rows) {
    const value = row[key] || 'unknown';
    counts[value] = (counts[value] || 0) + 1;
  }
  return counts;
}

function sortCounts(counts) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([id, count]) => ({ id, count }));
}

function buildOwnership(rows) {
  const byCategory = new Map();
  for (const row of rows) {
    if (!byCategory.has(row.category)) {
      byCategory.set(row.category, []);
    }
    byCategory.get(row.category).push(row);
  }
  return Array.from(byCategory.entries())
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    .map(([category, categoryRows]) => {
      const routeInfo = routeForCategory(category);
      const statusCounts = countBy(categoryRows, 'status');
      const reviewFlagCounts = {};
      for (const row of categoryRows) {
        for (const flag of row.reviewFlags) {
          reviewFlagCounts[flag] = (reviewFlagCounts[flag] || 0) + 1;
        }
      }
      return {
        category,
        count: categoryRows.length,
        primaryOwner: routeInfo.primaryOwner,
        supportOwners: routeInfo.supportOwners,
        targetPhase: routeInfo.targetPhase,
        asolariaSurface: routeInfo.asolariaSurface,
        writeLocks: routeInfo.writeLocks,
        implementationType: routeInfo.implementationType,
        statusCounts,
        reviewFlags: sortCounts(reviewFlagCounts),
        requiresCodeChange: !['documentation', 'ci_policy', 'taxonomy_only'].includes(routeInfo.implementationType),
        requiresSecurityReview: categoryRows.some((row) => row.reviewFlags.includes('reverse_gain_security_review')),
        requiresSyntheticFirst: categoryRows.some((row) => row.reviewFlags.includes('synthetic_first_runtime_lifecycle_review') || row.reviewFlags.includes('synthetic_ci_gate')),
        sampleFiles: categoryRows.slice(0, 12).map((row) => row.file),
        behcs256: {
          glyph: glyph('openclaw_424_category_owner', category, `${routeInfo.primaryOwner}:${routeInfo.targetPhase}`),
          programSentence: `OWN_CATEGORY ${category} COUNT ${categoryRows.length} OWNER ${routeInfo.primaryOwner} PHASE ${routeInfo.targetPhase} LOCKS ${routeInfo.writeLocks.join('+')}`
        }
      };
    });
}

function buildTaskRows(ticket, summary) {
  const taskStatuses = {
    'OC424-02-01': 'completed_full_diff_sorted_by_lanes',
    'OC424-02-02': 'completed_category_to_asolaria_surface_map',
    'OC424-02-03': 'completed_code_vs_docs_tests_policy_split',
    'OC424-02-04': 'completed_named_agent_owner_hints',
    'OC424-02-05': 'completed_security_reverse_gain_marks',
    'OC424-02-06': 'completed_runtime_synthetic_first_marks',
    'OC424-02-07': 'completed_provider_auth_boundary_marks',
    'OC424-02-08': 'completed_consent_device_scope_marks',
    'OC424-02-09': 'completed_no_remote_mutation_boundary',
    'OC424-02-10': 'completed_ownership_table_emitted'
  };
  return (ticket.tasks || []).map((task) => ({
    taskId: task.taskId,
    title: task.title,
    phaseId: task.phaseId,
    owner: task.owner,
    status: taskStatuses[task.taskId] || 'completed_wave_02_taxonomy_task',
    evidence: {
      taxonomyRows: summary.changedFileCount,
      ownershipRows: summary.ownershipRows,
      reviewQueueRows: summary.reviewQueueRows,
      report: repoRel(PATHS.reportMd)
    }
  }));
}

function buildSupervisorQueue(ticket, summary) {
  return [{
    id: `ASO-WAVE-COMPLETE-${WAVE_ID}-${PHASE_ID}`,
    title: 'Wave 02 completion proof for rook-diff-cartographer',
    objective: `Review OpenClaw 4.24 diff taxonomy and ownership table: ${summary.changedFileCount} files, ${summary.ownershipRows} ownership rows, ${summary.reviewQueueRows} review-boundary rows.`,
    requestedWorker: 'local_wave_completion_reviewer:rook-diff-cartographer',
    instructions: `WAVE_EXECUTED ${WAVE_ID} EXECUTOR ${EXECUTOR_ID} STATUS ${summary.status} ROWS ${summary.changedFileCount} OWNERSHIP ${summary.ownershipRows} REVIEW ${summary.reviewQueueRows}`,
    pid: 'BH.WAVE.COMPLETE.WAVE-02.P02.DIFF.TAXONOMY.FILE.OWNERSHIP',
    pidScope: 'local_wave_completion_only',
    consentScope: 'operator_authorized_local_orchestration',
    allowedPaths: ticket.allowedPaths,
    expectedArtifacts: [
      repoRel(PATHS.taxonomyJson),
      repoRel(PATHS.taxonomyNdjson),
      repoRel(PATHS.ownershipJson),
      repoRel(PATHS.ownershipNdjson),
      repoRel(PATHS.reviewQueue),
      repoRel(PATHS.reportMd),
      repoRel(PATHS.memory),
      repoRel(PATHS.index),
      repoRel(PATHS.map),
      repoRel(PATHS.cube),
      repoRel(PATHS.glpj)
    ],
    acceptanceGates: [
      'changed_file_count_matches_diff_index',
      'category_counts_match_ingestion_classifier',
      'ownership_rows_present',
      'security_review_queue_present',
      'no_remote_mutation_boundary_present',
      'BEHCS_mints_present'
    ],
    proofRequired: true,
    proofRefs: [
      repoRel(SOURCE_PATHS.diffIndex),
      repoRel(SOURCE_PATHS.aggregate),
      repoRel(SOURCE_PATHS.modelCard),
      repoRel(PATHS.taxonomyJson),
      repoRel(PATHS.ownershipJson)
    ],
    operatorApproval: true,
    syntheticFirstEvidence: true,
    modelCard: true,
    externalApiCall: false,
    cloudUpload: false,
    remoteMutation: false,
    deviceAccess: false,
    liveEeg: false,
    liveHumanData: false,
    downloads: false,
    installs: false,
    writesGit: false,
    bypassAuth: false,
    bypassPayment: false,
    needsCloudWorker: false,
    taskType: 'brown_hilbert_wave_02_diff_taxonomy_completion',
    source: ORCH_RUN
  }];
}

function buildMap(rows, ownershipRows, generatedAt) {
  const nodes = [];
  const edges = [];
  for (const owner of Array.from(new Set(ownershipRows.map((row) => row.primaryOwner))).sort()) {
    nodes.push({ id: owner, kind: 'named_agent_owner' });
  }
  for (const row of ownershipRows) {
    nodes.push({
      id: `category:${row.category}`,
      kind: 'diff_category',
      count: row.count,
      targetPhase: row.targetPhase,
      writeLocks: row.writeLocks
    });
    nodes.push({
      id: `phase:${row.targetPhase}`,
      kind: 'target_phase'
    });
    edges.push({ from: row.primaryOwner, to: `category:${row.category}`, relation: 'owns_category' });
    edges.push({ from: `category:${row.category}`, to: `phase:${row.targetPhase}`, relation: 'routes_to_phase' });
  }
  for (const row of rows.slice(0, 250)) {
    nodes.push({ id: `file:${row.file}`, kind: 'sample_changed_file', status: row.status });
    edges.push({ from: `category:${row.category}`, to: `file:${row.file}`, relation: 'classifies_file' });
  }
  return {
    mapId: 'openclaw-424-wave-02-diff-taxonomy-map-map-mapped.v1',
    generatedAt,
    status: 'MAP_MAP_MAPPED',
    nodeCount: nodes.length,
    edgeCount: edges.length,
    nodes,
    edges
  };
}

function buildArtifacts({ generatedAt, ticket, cloneFacts, diffIndex, rows, ownershipRows, reviewQueue, taskRows, mismatches }) {
  const categoryCounts = sortCounts(countBy(rows, 'category')).map(({ id, count }) => ({ category: id, count }));
  const ownerCounts = sortCounts(countBy(rows, 'primaryOwner')).map(({ id, count }) => ({ owner: id, count }));
  const targetPhaseCounts = sortCounts(countBy(rows, 'targetPhase')).map(({ id, count }) => ({ phase: id, count }));
  const implementationTypeCounts = sortCounts(countBy(rows, 'implementationType')).map(({ id, count }) => ({ implementationType: id, count }));
  const statusCounts = countBy(rows, 'status');
  const status = mismatches.length ? 'WAVE_02_TAXONOMY_COMPLETE_WITH_MISMATCH_NOTES' : 'WAVE_02_TAXONOMY_COMPLETE';
  const summary = {
    runId: ORCH_RUN,
    waveId: WAVE_ID,
    phaseId: PHASE_ID,
    executorId: EXECUTOR_ID,
    generatedAt,
    status,
    openclawRoot: cloneFacts.openclawRoot,
    baseTag: cloneFacts.baseTag,
    headTag: cloneFacts.headTag,
    head: cloneFacts.head,
    changedFileCount: rows.length,
    expectedChangedFileCount: diffIndex.changedFileCount,
    statusCounts,
    topCategories: categoryCounts.slice(0, 30),
    ownerCounts,
    targetPhaseCounts,
    implementationTypeCounts,
    ownershipRows: ownershipRows.length,
    reviewQueueRows: reviewQueue.length,
    mismatches,
    boundary: {
      comparisonOnly: true,
      remoteMutationAllowed: false,
      externalApiCall: false,
      providerAuthBypass: false,
      paymentBypass: false,
      liveDeviceOrHumanData: false,
      processFanout: false
    },
    outputs: Object.fromEntries(Object.entries(PATHS).map(([key, value]) => [key, repoRel(value)]))
  };
  const memory = {
    memoryId: 'openclaw-424-wave-02-diff-taxonomy.v1',
    generatedAt,
    status,
    summary,
    significance: [
      'The full OpenClaw 4.24 diff is now routed into Asolaria ownership lanes.',
      'Later build waves can consume category owners, target phases, write locks, and review gates without re-reading the full upstream diff.',
      'Security, provider-auth, consent/device, channel, runtime, and CI review boundaries are materialized before code edits.'
    ]
  };
  const index = {
    indexId: 'openclaw-424-wave-02-diff-taxonomy-index.v1',
    generatedAt,
    status: 'INDEX_INDEXED',
    entries: ownershipRows.map((row) => ({
      category: row.category,
      count: row.count,
      primaryOwner: row.primaryOwner,
      targetPhase: row.targetPhase,
      implementationType: row.implementationType,
      writeLocks: row.writeLocks,
      glyph: row.behcs256.glyph
    }))
  };
  const map = buildMap(rows, ownershipRows, generatedAt);
  const cube = {
    cubeId: 'openclaw-424-wave-02-diff-taxonomy-cube-cubed',
    generatedAt,
    status: 'CUBE_CUBE_CUBED',
    changedFileCount: rows.length,
    ownershipRows: ownershipRows.length,
    reviewQueueRows: reviewQueue.length,
    topCategories: categoryCounts.slice(0, 20),
    ownerCounts,
    glyph: glyph('openclaw_424_wave02_cube', WAVE_ID, `${rows.length}:${ownershipRows.length}:${reviewQueue.length}`)
  };
  const glpj = {
    programId: 'openclaw-424-wave-02-diff-taxonomy-behcs256.glpj',
    generatedAt,
    status: 'GLPJ_MINTED',
    language: 'BEHCS-256',
    verbs: [
      'CLASSIFY_DIFF_FILE',
      'OWN_CATEGORY',
      'ROUTE_TO_PHASE',
      'MARK_REVERSE_GAIN',
      'MARK_SYNTHETIC_FIRST',
      'MARK_PROVIDER_AUTH_BOUNDARY',
      'MARK_CONSENT_DEVICE_SCOPE',
      'NO_REMOTE_MUTATION'
    ],
    sentences: ownershipRows.map((row) => row.behcs256.programSentence)
  };
  const reportMd = [
    '# OpenClaw 4.24 Wave 02 Diff Taxonomy',
    '',
    `Generated: ${generatedAt}`,
    '',
    `Status: ${status}`,
    '',
    `- Changed files: ${rows.length}`,
    `- Expected changed files: ${diffIndex.changedFileCount}`,
    `- Ownership rows: ${ownershipRows.length}`,
    `- Review-boundary queue rows: ${reviewQueue.length}`,
    `- Mismatches: ${mismatches.length}`,
    '',
    '## Top Categories',
    '',
    ...categoryCounts.slice(0, 20).map((row) => `- ${row.category}: ${row.count}`),
    '',
    '## Owners',
    '',
    ...ownerCounts.map((row) => `- ${row.owner}: ${row.count}`),
    '',
    '## Target Phases',
    '',
    ...targetPhaseCounts.map((row) => `- ${row.phase}: ${row.count}`),
    '',
    '## Boundary',
    '',
    'This is a local comparison and ownership tranche. It does not mutate OpenClaw, Asolaria runtime code, remote repositories, providers, credentials, devices, or live human data.',
    '',
    '## Outputs',
    '',
    ...Object.entries(PATHS).map(([key, value]) => `- ${key}: \`${repoRel(value)}\``)
  ].join('\n');
  return { summary, memory, index, map, cube, glpj, reportMd, taskRows };
}

function run({ execute }) {
  const generatedAt = new Date().toISOString();
  const ticket = readJson(SOURCE_PATHS.ticket, {});
  const cloneFacts = readJson(SOURCE_PATHS.cloneFacts, {});
  const diffIndex = readJson(SOURCE_PATHS.diffIndex, {});
  if (!cloneFacts.openclawRoot || !fs.existsSync(cloneFacts.openclawRoot)) {
    throw new Error(`missing OpenClaw root: ${cloneFacts.openclawRoot || '<empty>'}`);
  }
  const rows = parseDiffRows(cloneFacts.openclawRoot, cloneFacts.baseTag, cloneFacts.headTag);
  const ownershipRows = buildOwnership(rows);
  const reviewQueue = rows.filter((row) => row.reviewFlags.some((flag) => flag !== 'comparison_only_no_remote_mutation'));
  const categoryCounts = sortCounts(countBy(rows, 'category')).map(({ id, count }) => ({ category: id, count }));
  const diffTopCounts = new Map((diffIndex.topCategories || []).map((row) => [row.category, row.count]));
  const mismatches = [];
  if (rows.length !== diffIndex.changedFileCount) {
    mismatches.push({ code: 'changed_file_count_mismatch', expected: diffIndex.changedFileCount, actual: rows.length });
  }
  for (const row of categoryCounts.slice(0, 20)) {
    if (diffTopCounts.has(row.category) && diffTopCounts.get(row.category) !== row.count) {
      mismatches.push({ code: 'category_count_mismatch', category: row.category, expected: diffTopCounts.get(row.category), actual: row.count });
    }
  }
  const temporarySummary = {
    status: mismatches.length ? 'WAVE_02_TAXONOMY_COMPLETE_WITH_MISMATCH_NOTES' : 'WAVE_02_TAXONOMY_COMPLETE',
    changedFileCount: rows.length,
    ownershipRows: ownershipRows.length,
    reviewQueueRows: reviewQueue.length
  };
  const taskRows = buildTaskRows(ticket, temporarySummary);
  const artifacts = buildArtifacts({ generatedAt, ticket, cloneFacts, diffIndex, rows, ownershipRows, reviewQueue, taskRows, mismatches });
  const supervisorQueue = buildSupervisorQueue(ticket, artifacts.summary);
  if (execute) {
    writeJson(PATHS.taxonomyJson, { taxonomyId: 'openclaw-424-wave-02-diff-taxonomy.v1', generatedAt, rows });
    writeNdjson(PATHS.taxonomyNdjson, rows);
    writeJson(PATHS.categorySummaryJson, { generatedAt, categories: artifacts.summary.topCategories, statusCounts: artifacts.summary.statusCounts });
    writeNdjson(PATHS.categorySummaryNdjson, artifacts.summary.topCategories);
    writeJson(PATHS.ownershipJson, { ownershipId: 'openclaw-424-wave-02-ownership-table.v1', generatedAt, ownershipRows });
    writeNdjson(PATHS.ownershipNdjson, ownershipRows);
    writeNdjson(PATHS.reviewQueue, reviewQueue);
    writeNdjson(PATHS.taskResults, artifacts.taskRows);
    writeJson(PATHS.executionResult, { summary: artifacts.summary, taskRows: artifacts.taskRows });
    writeNdjson(PATHS.completionSupervisorQueue, supervisorQueue);
    writeJson(PATHS.memory, artifacts.memory);
    writeJson(PATHS.index, artifacts.index);
    writeJson(PATHS.map, artifacts.map);
    writeText(PATHS.cube, `export const CUBE = ${JSON.stringify(artifacts.cube, null, 2)};\n`);
    writeJson(PATHS.glpj, artifacts.glpj);
    writeJson(PATHS.reportJson, artifacts.summary);
    writeText(PATHS.reportMd, artifacts.reportMd);
    appendNdjson(PATHS.globalInbox, {
      generatedAt,
      type: 'openclaw_424_wave_02_diff_taxonomy_complete',
      runId: ORCH_RUN,
      waveId: WAVE_ID,
      status: artifacts.summary.status,
      changedFileCount: rows.length,
      ownershipRows: ownershipRows.length,
      reviewQueueRows: reviewQueue.length,
      report: repoRel(PATHS.reportMd)
    });
    appendNdjson(PATHS.gnnEdges, {
      generatedAt,
      from: `${ORCH_RUN}:wave-01`,
      to: `${ORCH_RUN}:wave-02`,
      relation: 'BUILDS_DIFF_TAXONOMY_AFTER_PROOF_FREEZE',
      weight: 1,
      glyph: glyph('gnn_edge', `${ORCH_RUN}:${WAVE_ID}`, 'diff_taxonomy_after_proof')
    });
  }
  return {
    ok: true,
    execute,
    status: artifacts.summary.status,
    waveId: WAVE_ID,
    changedFileCount: rows.length,
    expectedChangedFileCount: diffIndex.changedFileCount,
    ownershipRows: ownershipRows.length,
    reviewQueueRows: reviewQueue.length,
    mismatches: mismatches.length,
    report: repoRel(PATHS.reportMd),
    supervisorQueue: repoRel(PATHS.completionSupervisorQueue)
  };
}

function parseArgs(argv) {
  return { execute: argv.includes('--execute') };
}

function main() {
  console.log(JSON.stringify(run(parseArgs(process.argv.slice(2))), null, 2));
}

if (require.main === module) {
  main();
}

