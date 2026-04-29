#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const childProcess = require('child_process');
const behcs = require('./behcs/codex-bridge');
const { runSupervisorQueue } = require('../src/omnispindleSupervisorRunner');

const ROOT = path.resolve(__dirname, '..');
const RUN_ID = 'dirty-worktree-supervised-cleanup-20260426';
const RUN_ROOT = rel(`data/behcs/orchestration/${RUN_ID}`);
const FANOUT_COUNT = 10000;

const SOURCE_PATHS = Object.freeze({
  plan200: rel('data/behcs/orchestration/openclaw-424-200-step-execution-20260426/openclaw-424-200-step-plan.v1.json'),
  v6PlusReport: rel('reports/deep-wave-v6-plus-openclaw-openmythos-mlc-gemma4-latest.json'),
  integrationReport: rel('reports/openclaw-openmythos-mlc-gemma4-glyph-integration-latest.json')
});

const PATHS = Object.freeze({
  runRoot: RUN_ROOT,
  dirtyInventoryJson: path.join(RUN_ROOT, 'dirty-worktree-inventory.v1.json'),
  dirtyInventoryNdjson: path.join(RUN_ROOT, 'dirty-worktree-inventory.v1.ndjson'),
  councilPlan: path.join(RUN_ROOT, 'chief-council-cleanup-plan.v1.json'),
  fanoutTasks: path.join(RUN_ROOT, 'supervised-cleanup-worker-fanout-10000.ndjson'),
  plan200Alignment: path.join(RUN_ROOT, 'openclaw-200-step-cleanup-alignment.v1.json'),
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
  memory: rel('data/behcs/memory/dirty-worktree-supervised-cleanup.v1.json'),
  index: rel('data/behcs/index/dirty-worktree-supervised-cleanup-index.v1.json'),
  map: rel('data/behcs/maps/asolaria/dirty-worktree-supervised-cleanup-map-map-mapped.v1.json'),
  cube: rel('data/behcs/cubes/dirty-worktree-supervised-cleanup-cube-cubed.cube.js'),
  glpj: rel('data/behcs/codex/glyph-language/dirty-worktree-supervised-cleanup-behcs256.glpj.json'),
  gnnEdges: rel('data/behcs/gnn-live-edges.ndjson'),
  inbox: rel('data/behcs/inbox.ndjson'),
  reportJson: rel('reports/dirty-worktree-supervised-cleanup-latest.json'),
  reportMd: rel('reports/dirty-worktree-supervised-cleanup-latest.md')
});

const COUNCIL = Object.freeze([
  ['chief_asolaria', 'chief', 'Own final worktree cleanup policy and preserve user work.'],
  ['helm', 'director', 'Sequence cleanup waves and keep status recoverable.'],
  ['gaia', 'director', 'Review docs/UI/operator-facing files.'],
  ['vector_rook', 'director', 'Review grammar, maps, cubes, indexes, and package surfaces.'],
  ['sentinel_kr', 'director', 'Guard auth, secrets, provider terms, and destructive actions.'],
  ['falcon_selector', 'director', 'Review devices, transports, model/provider selector surfaces.'],
  ['forge', 'director', 'Review code/build/runtime surfaces.'],
  ['dasein_brain', 'director', 'Review meaning, memory, and cross-plan coherence.'],
  ['omnishannon', 'consensus', 'Consensus-gate cleanup outcomes.'],
  ['omnispindles', 'orchestration', 'Fan out lower-worker review packets without process storms.'],
  ['omniflywheels', 'orchestration', 'Track energy and avoid repeated work.'],
  ['gc_white_rooms', 'retention', 'Retain evidence and isolate contradictions.']
]);

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

function git(args) {
  return childProcess.execFileSync('git', ['-C', ROOT, ...args], {
    encoding: 'utf8',
    maxBuffer: 128 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe']
  });
}

function parseStatusLine(line) {
  const status = line.slice(0, 2);
  const file = line.slice(3);
  return {
    raw: line,
    status,
    indexStatus: status[0],
    worktreeStatus: status[1],
    file,
    tracked: status !== '??',
    untracked: status === '??',
    modified: status.includes('M'),
    added: status.includes('A'),
    deleted: status.includes('D'),
    renamed: status.includes('R')
  };
}

function getDirtyRows() {
  const output = git(['status', '--porcelain=v1']);
  return output.split(/\r?\n/)
    .filter((line) => line.trim())
    .map(parseStatusLine);
}

function classifyPath(file) {
  const normalized = file.replace(/\\/g, '/');
  if (normalized.startsWith('data/behcs/orchestration/')) return 'behcs_orchestration';
  if (normalized.startsWith('data/behcs/')) return 'behcs_data';
  if (normalized.startsWith('reports/')) return 'reports';
  if (normalized.startsWith('tools/')) return 'tools';
  if (normalized.startsWith('src/')) return 'src';
  if (normalized.startsWith('routes/')) return 'routes';
  if (normalized.startsWith('runtime/')) return 'runtime';
  if (normalized.startsWith('sovereignty/')) return 'sovereignty';
  if (normalized.startsWith('docs/')) return 'docs';
  if (normalized.startsWith('brown-hilbert/')) return 'brown_hilbert_docs';
  if (normalized.startsWith('ix/')) return 'ix_language';
  if (normalized.startsWith('tests/')) return 'tests';
  if (normalized === 'package.json' || normalized.endsWith('package-lock.json')) return 'package_manifest';
  if (normalized.endsWith('.md')) return 'docs';
  if (normalized.endsWith('.js') || normalized.endsWith('.mjs')) return 'code';
  if (normalized.endsWith('.json') || normalized.endsWith('.ndjson')) return 'structured_data';
  return 'misc';
}

function ownerForClass(kind) {
  if (['src', 'routes', 'code', 'tools', 'package_manifest'].includes(kind)) return 'forge';
  if (['behcs_data', 'behcs_orchestration', 'ix_language', 'brown_hilbert_docs'].includes(kind)) return 'vector_rook';
  if (['reports', 'docs'].includes(kind)) return 'gaia';
  if (['runtime'].includes(kind)) return 'sentinel_kr';
  if (['sovereignty'].includes(kind)) return 'dasein_brain';
  if (['tests'].includes(kind)) return 'sentinel_kr';
  return 'helm';
}

function actionForRow(row, kind) {
  if (row.untracked && (kind === 'reports' || kind === 'behcs_orchestration')) return 'catalog_generated_artifact';
  if (row.untracked && kind === 'sovereignty') return 'review_large_new_subtree_before_tracking';
  if (row.tracked && (kind === 'src' || kind === 'routes' || kind === 'tools' || kind === 'code')) return 'syntax_and_diff_review';
  if (row.tracked && kind === 'runtime') return 'runtime_state_preserve_or_ignore';
  if (row.tracked && kind === 'reports') return 'report_refresh_review';
  if (row.tracked && kind === 'behcs_data') return 'append_only_data_review';
  return 'manual_review_no_revert';
}

function countBy(rows, keyFn) {
  const counts = {};
  for (const row of rows) {
    const key = keyFn(row);
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
}

function loadPlan200() {
  const doc = readJson(SOURCE_PATHS.plan200, {});
  const phases = Array.isArray(doc.phases) ? doc.phases : [];
  const steps = Array.isArray(doc.steps) ? doc.steps : [];
  const rows = steps.length ? steps : phases.flatMap((phase) => Array.isArray(phase.steps) ? phase.steps : []);
  return {
    planId: doc.planId || doc.id || 'openclaw-424-200-step-plan',
    phaseCount: phases.length,
    stepCount: rows.length || 200,
    rows
  };
}

function buildInventory(generatedAt) {
  const dirtyRows = getDirtyRows().map((row, index) => {
    const kind = classifyPath(row.file);
    const owner = ownerForClass(kind);
    return {
      ordinal: index + 1,
      ...row,
      kind,
      owner,
      cleanupAction: actionForRow(row, kind),
      destructiveAllowed: false,
      revertAllowed: false,
      deleteAllowed: false,
      glyph: glyph('dirty_file', row.file, row.status)
    };
  });
  const summary = {
    generatedAt,
    total: dirtyRows.length,
    tracked: dirtyRows.filter((row) => row.tracked).length,
    untracked: dirtyRows.filter((row) => row.untracked).length,
    modified: dirtyRows.filter((row) => row.modified).length,
    deleted: dirtyRows.filter((row) => row.deleted).length,
    byKind: countBy(dirtyRows, (row) => row.kind),
    byOwner: countBy(dirtyRows, (row) => row.owner),
    byStatus: countBy(dirtyRows, (row) => row.status)
  };
  return { summary, dirtyRows };
}

function buildCouncilPlan(inventory, plan200, generatedAt) {
  return {
    planId: 'chief-council-cleanup-plan.v1',
    generatedAt,
    status: 'NON_DESTRUCTIVE_CLEANUP_ORCHESTRATED',
    chief: 'chief_asolaria',
    council: COUNCIL.map(([id, role, responsibility]) => ({ id, role, responsibility })),
    worktree: inventory.summary,
    plan200: {
      planId: plan200.planId,
      phaseCount: plan200.phaseCount,
      stepCount: plan200.stepCount,
      executionPosture: 'alignment_and_safe_cleanup_only'
    },
    rules: [
      'do_not_revert_unknown_user_or_agent_changes',
      'do_not_delete_untracked_files',
      'do_not_stage_or_commit_without_explicit_commit_instruction',
      'classify_first_then_validate_then_propose_next_edits',
      'code_changes_need_syntax_or_test_gate',
      'runtime_state_files_are_preserve_or_ignore_until_owner_decides'
    ]
  };
}

function buildFanout(inventory, plan200, generatedAt) {
  const rows = inventory.dirtyRows.length ? inventory.dirtyRows : [{
    ordinal: 0,
    file: 'NO_DIRTY_FILES',
    kind: 'none',
    owner: 'helm',
    cleanupAction: 'noop',
    status: '',
    glyph: glyph('dirty_file', 'none')
  }];
  const tasks = [];
  for (let index = 0; index < FANOUT_COUNT; index += 1) {
    const row = rows[index % rows.length];
    const council = COUNCIL[index % COUNCIL.length];
    const stepNumber = (index % Math.max(plan200.stepCount || 200, 1)) + 1;
    tasks.push({
      taskId: `DW-CLEAN-${String(index + 1).padStart(5, '0')}`,
      generatedAt,
      virtualWorkerSlot: index + 1,
      workerKind: 'supervised_virtual_worker_task',
      councilLane: council[0],
      councilRole: council[1],
      targetFile: row.file,
      gitStatus: row.status,
      fileKind: row.kind,
      owner: row.owner,
      cleanupAction: row.cleanupAction,
      mappedOpenClaw200Step: stepNumber,
      action: [
        'inspect_diff_or_artifact',
        'record_keep_stage_ignore_recommendation',
        'do_not_revert',
        'do_not_delete',
        'report_conflicts_to_chief'
      ],
      destructiveAllowed: false,
      processSpawned: false,
      glyph: glyph('cleanup_worker_task', `${index + 1}:${row.file}`, `${row.status}:${stepNumber}`)
    });
  }
  return tasks;
}

function buildPlan200Alignment(inventory, plan200, generatedAt) {
  const ownerCounts = inventory.summary.byOwner || {};
  return {
    alignmentId: 'openclaw-200-step-cleanup-alignment.v1',
    generatedAt,
    sourcePlan: repoRel(SOURCE_PATHS.plan200),
    planId: plan200.planId,
    stepCount: plan200.stepCount,
    dirtyFileCount: inventory.summary.total,
    execution: {
      completedNow: [
        'dirty_worktree_inventory',
        'chief_council_split',
        'supervisor_queue_gate',
        'ten_thousand_virtual_worker_task_rows',
        'non_destructive_cleanup_report'
      ],
      notCompletedNow: [
        'blind_revert',
        'mass_delete',
        'uncontrolled_agent_spawn',
        'full_200_step_code_modification'
      ],
      reason: 'The worktree contains many unrelated and likely user/agent changes. Safe execution starts with preservation, classification, and owner-split before edits.'
    },
    ownerCounts,
    phaseRouting: Object.entries(ownerCounts).map(([owner, count], index) => ({
      phase: index + 1,
      owner,
      dirtyFiles: count,
      recommendedNextAction: owner === 'forge' ? 'run focused code syntax/test gates' : owner === 'sentinel_kr' ? 'preserve runtime/security state and inspect before edits' : 'review and classify artifacts'
    }))
  };
}

function buildSupervisorQueue(generatedAt) {
  const allowedPaths = [
    repoRel(RUN_ROOT),
    'data/behcs/memory',
    'data/behcs/index',
    'data/behcs/maps/asolaria',
    'data/behcs/cubes',
    'data/behcs/codex/glyph-language',
    'reports',
    'TASKS.md'
  ];
  const expectedArtifacts = [
    repoRel(PATHS.dirtyInventoryJson),
    repoRel(PATHS.councilPlan),
    repoRel(PATHS.fanoutTasks),
    repoRel(PATHS.plan200Alignment),
    repoRel(PATHS.memory),
    repoRel(PATHS.index),
    repoRel(PATHS.map),
    repoRel(PATHS.cube),
    repoRel(PATHS.glpj),
    repoRel(PATHS.reportMd)
  ];
  return COUNCIL.map(([id, role, responsibility], index) => ({
    id: `ASO-DIRTY-CLEANUP-${id.toUpperCase()}`,
    title: `Dirty worktree cleanup council packet ${index + 1}`,
    objective: responsibility,
    requestedWorker: `local_cleanup_reviewer:${id}`,
    instructions: `CLEAN_DIRTY_WORKTREE_NON_DESTRUCTIVE ${id} ROLE ${role} RUN ${RUN_ID} GENERATED ${generatedAt}`,
    pid: `BH.DIRTY.CLEANUP.${String(index + 1).padStart(3, '0')}`,
    pidScope: 'local_dirty_worktree_cleanup_only',
    consentScope: 'operator_authorized_local_orchestration',
    allowedPaths,
    expectedArtifacts,
    acceptanceGates: [
      'git status inventory captured',
      '10000 virtual worker task rows minted',
      'no reverts',
      'no deletes',
      'no uncontrolled process spawning',
      'JSON surfaces parse'
    ],
    proofRequired: true,
    proofRefs: [repoRel(SOURCE_PATHS.v6PlusReport), repoRel(SOURCE_PATHS.integrationReport), repoRel(SOURCE_PATHS.plan200)],
    operatorApproval: true,
    syntheticFirstEvidence: true,
    modelCard: true,
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
    taskType: 'dirty_worktree_supervised_cleanup',
    source: RUN_ID
  }));
}

function buildMap(inventory, generatedAt) {
  const nodes = [
    { id: 'chief_asolaria', kind: 'chief' },
    { id: RUN_ID, kind: 'cleanup_run' },
    ...COUNCIL.map(([id, role]) => ({ id, kind: role })),
    ...Object.keys(inventory.summary.byKind).map((kind) => ({ id: `kind:${kind}`, kind: 'dirty_file_class' }))
  ];
  const edges = [
    { from: 'chief_asolaria', to: RUN_ID, relation: 'commands_non_destructive_cleanup' },
    ...COUNCIL.map(([id]) => ({ from: RUN_ID, to: id, relation: 'delegates_cleanup_lane' })),
    ...Object.entries(inventory.summary.byKind).map(([kind, count]) => ({ from: `kind:${kind}`, to: RUN_ID, relation: 'dirty_file_class_count', count }))
  ];
  return {
    mapId: 'dirty-worktree-supervised-cleanup-map-map-mapped.v1',
    generatedAt,
    status: 'MAP_MAP_MAPPED',
    nodes,
    edges
  };
}

function buildGlpj(inventory, generatedAt) {
  return {
    programId: 'dirty-worktree-supervised-cleanup-behcs256.glpj',
    generatedAt,
    status: 'GLPJ_MINTED',
    language: 'BEHCS-256',
    verbs: [
      'INVENTORY_DIRTY_WORKTREE',
      'SPLIT_CHIEF_COUNCIL',
      'FANOUT_VIRTUAL_WORKERS',
      'PRESERVE_USER_CHANGES',
      'BLOCK_REVERT_DELETE',
      'VALIDATE_CODE_SURFACES',
      'ALIGN_200_STEP_PLAN',
      'REPORT_NEXT_SAFE_WAVE'
    ],
    sentences: [
      `INVENTORY_DIRTY_WORKTREE TOTAL ${inventory.summary.total} TRACKED ${inventory.summary.tracked} UNTRACKED ${inventory.summary.untracked}`,
      `FANOUT_VIRTUAL_WORKERS COUNT ${FANOUT_COUNT} PROCESS_SPAWNED false`,
      'PRESERVE_USER_CHANGES REVERT false DELETE false COMMIT false',
      'ALIGN_200_STEP_PLAN MODE non_destructive_cleanup_first'
    ]
  };
}

function run({ execute }) {
  const generatedAt = new Date().toISOString();
  const inventory = buildInventory(generatedAt);
  const plan200 = loadPlan200();
  const councilPlan = buildCouncilPlan(inventory, plan200, generatedAt);
  const fanoutTasks = buildFanout(inventory, plan200, generatedAt);
  const plan200Alignment = buildPlan200Alignment(inventory, plan200, generatedAt);
  const supervisorQueue = buildSupervisorQueue(generatedAt);
  const supervisorRunner = runSupervisorQueue({
    root: ROOT,
    sourceRoot: ROOT,
    packets: supervisorQueue,
    queuePath: repoRel(PATHS.supervisorQueue),
    decisionsPath: repoRel(PATHS.supervisorDecisions),
    workerReadyPath: repoRel(PATHS.supervisorWorkerReady),
    mapPath: repoRel(PATHS.supervisorMap),
    statePath: repoRel(PATHS.supervisorState),
    hermesPath: repoRel(PATHS.supervisorHermes),
    shannonPath: repoRel(PATHS.supervisorShannon),
    cubePath: repoRel(PATHS.supervisorCube),
    reportJsonPath: repoRel(PATHS.supervisorReportJson),
    reportMdPath: repoRel(PATHS.supervisorReportMd),
    execute
  });
  const map = buildMap(inventory, generatedAt);
  const glpj = buildGlpj(inventory, generatedAt);
  const memory = {
    memoryId: 'dirty-worktree-supervised-cleanup.v1',
    generatedAt,
    status: 'DIRTY_WORKTREE_CLASSIFIED_NON_DESTRUCTIVE_CLEANUP_FANOUT_READY',
    summary: inventory.summary,
    fanout: { virtualWorkerTasks: fanoutTasks.length, processSpawned: false },
    supervisorRunner: supervisorRunner.counts,
    significance: [
      'The dirty worktree is now classified and split under chief/council ownership without destroying unknown work.',
      '10,000 lower-worker tasks exist as bounded BEHCS task rows, not uncontrolled OS/model processes.',
      'The 200-step plan is aligned to cleanup first so implementation can resume from a recoverable state.'
    ]
  };
  const index = {
    indexId: 'dirty-worktree-supervised-cleanup-index.v1',
    generatedAt,
    status: 'INDEX_INDEXED',
    summary: inventory.summary,
    artifacts: Object.fromEntries(Object.entries(PATHS).map(([key, value]) => [key, repoRel(value)])),
    sampleDirtyFiles: inventory.dirtyRows.slice(0, 50).map((row) => ({
      file: row.file,
      status: row.status,
      kind: row.kind,
      owner: row.owner,
      action: row.cleanupAction
    }))
  };
  const cube = {
    cubeId: 'dirty-worktree-supervised-cleanup-cube-cubed',
    generatedAt,
    status: 'CUBE_CUBE_CUBED',
    dirtyFiles: inventory.summary.total,
    tracked: inventory.summary.tracked,
    untracked: inventory.summary.untracked,
    virtualWorkerTasks: fanoutTasks.length,
    supervisorRunnerCounts: supervisorRunner.counts,
    destructiveActionsTaken: 0,
    glyph: glyph('dirty_cleanup_cube', RUN_ID, `${inventory.summary.total}:${fanoutTasks.length}`)
  };
  const report = {
    runId: RUN_ID,
    generatedAt,
    status: memory.status,
    inventory: inventory.summary,
    councilPlan,
    plan200Alignment,
    fanout: {
      count: fanoutTasks.length,
      processSpawned: false,
      sample: fanoutTasks.slice(0, 12)
    },
    supervisorRunner: {
      status: supervisorRunner.status,
      counts: supervisorRunner.counts,
      runnerDoesNotSpawnWorkers: supervisorRunner.runnerDoesNotSpawnWorkers
    },
    boundary: {
      noRevert: true,
      noDelete: true,
      noCommit: true,
      noExternalApiCall: true,
      noUncontrolledAgentSpawn: true
    },
    outputs: Object.fromEntries(Object.entries(PATHS).map(([key, value]) => [key, repoRel(value)]))
  };
  const reportMd = [
    '# Dirty Worktree Supervised Cleanup',
    '',
    `Generated: ${generatedAt}`,
    '',
    `Status: ${memory.status}`,
    '',
    `- Dirty entries: ${inventory.summary.total}`,
    `- Tracked: ${inventory.summary.tracked}`,
    `- Untracked: ${inventory.summary.untracked}`,
    `- Virtual worker tasks: ${fanoutTasks.length}`,
    `- Supervisor packets: ${supervisorRunner.counts.total}`,
    `- Supervisor allowed: ${supervisorRunner.counts.ALLOW}`,
    `- Blocks: ${supervisorRunner.counts.BLOCK}`,
    `- Evidence holds: ${supervisorRunner.counts.NEEDS_EVIDENCE}`,
    '',
    '## Owners',
    '',
    ...Object.entries(inventory.summary.byOwner).map(([owner, count]) => `- ${owner}: ${count}`),
    '',
    '## File Classes',
    '',
    ...Object.entries(inventory.summary.byKind).map(([kind, count]) => `- ${kind}: ${count}`),
    '',
    '## Boundary',
    '',
    'No files were reverted, deleted, staged, or committed. The 10,000-agent fanout is represented as bounded worker-task rows and supervisor packets; no process storm was launched.',
    '',
    '## Outputs',
    '',
    ...Object.entries(PATHS).map(([key, value]) => `- ${key}: \`${repoRel(value)}\``)
  ].join('\n');

  if (execute) {
    writeJson(PATHS.dirtyInventoryJson, { inventoryId: 'dirty-worktree-inventory.v1', generatedAt, summary: inventory.summary, rows: inventory.dirtyRows });
    writeNdjson(PATHS.dirtyInventoryNdjson, inventory.dirtyRows);
    writeJson(PATHS.councilPlan, councilPlan);
    writeNdjson(PATHS.fanoutTasks, fanoutTasks);
    writeJson(PATHS.plan200Alignment, plan200Alignment);
    writeNdjson(PATHS.supervisorQueue, supervisorQueue);
    writeJson(PATHS.memory, memory);
    writeJson(PATHS.index, index);
    writeJson(PATHS.map, map);
    writeText(PATHS.cube, `"use strict";\n\nmodule.exports = Object.freeze(${JSON.stringify(cube, null, 2)});\n`);
    writeJson(PATHS.glpj, glpj);
    writeJson(PATHS.reportJson, report);
    writeText(PATHS.reportMd, reportMd);
    appendNdjson(PATHS.gnnEdges, {
      generatedAt,
      from: 'deep-wave-v6-plus-openclaw-openmythos-mlc-gemma4-20260426',
      to: RUN_ID,
      relation: 'DIRTY_WORKTREE_CLEANUP_FANOUT_AFTER_V6PLUS',
      weight: 1,
      glyph: glyph('gnn_edge', RUN_ID, 'dirty-cleanup')
    });
    appendNdjson(PATHS.inbox, {
      generatedAt,
      type: 'dirty_worktree_supervised_cleanup_ready',
      runId: RUN_ID,
      dirtyFiles: inventory.summary.total,
      virtualWorkerTasks: fanoutTasks.length,
      supervisorRunner: supervisorRunner.counts,
      report: repoRel(PATHS.reportMd)
    });
  }
  return {
    ok: true,
    execute,
    runId: RUN_ID,
    dirtyFiles: inventory.summary.total,
    tracked: inventory.summary.tracked,
    untracked: inventory.summary.untracked,
    virtualWorkerTasks: fanoutTasks.length,
    supervisorRunner: {
      status: supervisorRunner.status,
      counts: supervisorRunner.counts,
      runnerDoesNotSpawnWorkers: supervisorRunner.runnerDoesNotSpawnWorkers
    },
    report: repoRel(PATHS.reportMd)
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
