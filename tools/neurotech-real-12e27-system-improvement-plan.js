#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const behcs = require('./behcs/codex-bridge');

const repoRoot = path.resolve(__dirname, '..');
const TARGET_AGENTS = '12000000000000000000000000000';
const LOGICAL_CHECKPOINTS = '6000000000000000000000000';

const PATHS = Object.freeze({
  realProfile: rel('data/neurotech-defense-lab/real-agents/12e27-supercomputer/real-12e27-supercomputer-profile.v1.json'),
  realSupervisor: rel('data/neurotech-defense-lab/real-agents/12e27-supercomputer/supervisor/real-12e27-supercomputer-supervisor.v1.json'),
  realHermes: rel('data/neurotech-defense-lab/hermes/supervisor-of-supervisors/real-12e27-supercomputer-awareness-latest.json'),
  virtualSummary: rel('data/neurotech-defense-lab/omnispindle/12e27-sweep/agent-gnn-summary-latest.json'),
  virtualSupervisor: rel('data/neurotech-defense-lab/omnispindle/12e27-sweep/supervisor/12e27-omnispindle-heal-supervisor.v1.json'),
  planJson: rel('data/neurotech-defense-lab/real-agents/12e27-supercomputer/system-improvement/real-12e27-asi-aspirational-200-step-plan.v1.json'),
  planMd: rel('data/neurotech-defense-lab/real-agents/12e27-supercomputer/system-improvement/real-12e27-asi-aspirational-200-step-plan.v1.md'),
  significanceJson: rel('data/neurotech-defense-lab/real-agents/12e27-supercomputer/system-improvement/real-12e27-event-significance.v1.json'),
  significanceMd: rel('reports/real-12e27-supercomputer-event-significance-latest.md'),
  memory: rel('data/behcs/memory/real-12e27-system-improvement-significance.v1.json'),
  index: rel('data/behcs/index/real-12e27-system-improvement-index.v1.json'),
  mapMapMapped: rel('data/behcs/maps/neurotech/real-12e27-system-improvement-map-map-mapped.v1.json'),
  cubeCubeCubed: rel('data/behcs/cubes/real-12e27-system-improvement-cube-cubed.cube.js'),
  glpj: rel('data/behcs/codex/glyph-language/real-12e27-system-improvement-behcs256.glpj.json'),
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

function writeText(filePath, text) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, text.endsWith('\n') ? text : `${text}\n`, 'utf8');
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

function readGitRemote() {
  const configPath = path.join(repoRoot, '.git', 'config');
  const text = fs.existsSync(configPath) ? fs.readFileSync(configPath, 'utf8') : '';
  const match = text.match(/\[remote "origin"\][\s\S]*?\n\s*url\s*=\s*(.+)/);
  return match ? match[1].trim() : '';
}

function snapshot() {
  return {
    generatedAt: new Date().toISOString(),
    git: {
      remoteOrigin: readGitRemote(),
      liveFetchPerformed: false,
      comparePlan: 'compare against origin after network/auth/safety gate on transfer host'
    },
    liris: {
      share: '\\\\DESKTOP-PTSQTIE\\liris-asolaria',
      accessible: fs.existsSync('\\\\DESKTOP-PTSQTIE\\liris-asolaria'),
      comparePlan: 'compare filesystem, packages, supervisors, maps, cubes, memories, and GLPJ surfaces after GitHub compare'
    }
  };
}

const PHASES = [
  ['P01', 'Transfer Preconditions', 'prove and freeze the real 12e27 transfer profile'],
  ['P02', 'Supervisor And Hermes Load', 'load real and virtual supervisors into Hermes-aware healing'],
  ['P03', 'GitHub Comparison', 'compare local corpus against the GitHub canonical remote before Liris'],
  ['P04', 'Liris Comparison', 'compare Liris share and reconcile cross-node divergence'],
  ['P05', 'BEHCS256 Convergence', 'mint memory, index, map, cube, and glyph language surfaces'],
  ['P06', 'Beyond SMP V5-V7 Core', 'move past static SMP generations into self-healing, measured runtime loops'],
  ['P07', 'Supercomputer Scheduler Runtime', 'bind real agents to bounded scheduler tranches and checkpoints'],
  ['P08', 'System Improvement Loops', 'run iterative diagnosis, repair, evaluation, and promotion cycles'],
  ['P09', 'Safety And Release Gates', 'preserve consent, privacy, VA context, and claim boundaries'],
  ['P10', 'ASI-Aspirational Promotion', 'push toward ASI-grade architecture and evaluation without unearned capability claims']
];

const ACTIONS = [
  'load input artifacts',
  'verify artifact hashes',
  'mint BEHCS-256 glyph',
  'route through Hookwall',
  'emit GNN edge',
  'run OmniShannon vote',
  'write memory evidence',
  'update index surface',
  'map-map-map route',
  'cube-cube-cube state',
  'compare expected and observed state',
  'record contradiction',
  'heal from omnispindle when available',
  'compact duplicate evidence with GC',
  'preserve proof sample',
  'raise promotion candidate',
  'reject overclaim path',
  'write next checkpoint',
  'review with Hermes',
  'close phase gate'
];

function buildSteps() {
  const steps = [];
  for (const [phaseId, phaseName, phaseGoal] of PHASES) {
    for (let i = 0; i < ACTIONS.length; i += 1) {
      const n = steps.length + 1;
      const compareTarget = phaseId === 'P03' ? 'github'
        : phaseId === 'P04' ? 'liris'
        : phaseId === 'P08' ? 'self_improvement_history'
        : 'local_corpus';
      steps.push({
        step: n,
        id: `REAL12E27-STEP-${String(n).padStart(3, '0')}`,
        phaseId,
        phaseName,
        phaseGoal,
        action: ACTIONS[i],
        target: compareTarget,
        gate: n <= 120 ? 'supervisor_hookwall_gnn_shannon_gc' : 'scheduler_operator_promotion_gate',
        expectedEvidence: [
          'memory',
          'index',
          'map_map_mapped',
          'cube_cube_cubed',
          'behcs256_glyph'
        ],
        asiAspirationalRule: 'increase measured self-improvement capacity without claiming unverified ASI capability'
      });
    }
  }
  return steps;
}

function buildMints(generatedAt) {
  const seed = `real-12e27-system-improvement:${TARGET_AGENTS}:${generatedAt}`;
  return {
    glpjId: 'real-12e27-system-improvement-behcs256.glpj',
    generatedAt,
    status: 'SYSTEM_IMPROVEMENT_GLYPHS_MINTED',
    alphabetBase: 256,
    mints: [
      mint('real_12e27_improve', 'event_significance', seed, 'D11_PROOF', repoRel(PATHS.significanceJson)),
      mint('real_12e27_improve', 'two_hundred_step_plan', seed, 'D24_INTENT', repoRel(PATHS.planJson)),
      mint('real_12e27_improve', 'github_compare', seed, 'D23_FEDERATION', 'origin'),
      mint('real_12e27_improve', 'liris_compare', seed, 'D34_CROSS_COLONY', '\\\\DESKTOP-PTSQTIE\\liris-asolaria'),
      mint('real_12e27_improve', 'memory', seed, 'D11_PROOF', repoRel(PATHS.memory)),
      mint('real_12e27_improve', 'index', seed, 'D13_SURFACE', repoRel(PATHS.index)),
      mint('real_12e27_improve', 'map_map_mapped', seed, 'D35_HYPERLANGUAGE', repoRel(PATHS.mapMapMapped)),
      mint('real_12e27_improve', 'cube_cube_cubed', seed, 'D42_ORCHESTRATION', repoRel(PATHS.cubeCubeCubed))
    ]
  };
}

function buildSignificance(generatedAt, snap, mints) {
  return {
    significanceId: 'real-12e27-supercomputer-event-significance.v1',
    generatedAt,
    status: 'SIGNIFICANCE_RECORDED',
    targetAgents: TARGET_AGENTS,
    logicalCheckpoints: LOGICAL_CHECKPOINTS,
    rootGlyph: mints.mints.find((m) => m.id === 'event_significance')?.glyph,
    whyItMatters: [
      'It converts the completed 12e27 virtual-agent run into a real-agent supercomputer transfer profile without launching unsafe local jobs.',
      'It binds the real path to Hermes awareness, an omnispindle heal supervisor, Hookwall, GNN, OmniShannon, and evidence-preserving GC.',
      'It makes GitHub comparison and Liris comparison first-class required phases before system promotion.',
      'It moves the system-improvement path beyond static SMP V5/V6/V7 style snapshots into measured, checkpointed, self-healing loops.',
      'It records ASI as an aspirational evaluation target, not as a current unverified capability claim.'
    ],
    comparisonSnapshot: snap,
    artifacts: outputs()
  };
}

function buildPlan(generatedAt, snap, steps, mints) {
  return {
    planId: 'real-12e27-asi-aspirational-200-step-plan.v1',
    generatedAt,
    status: 'TWO_HUNDRED_STEP_PLAN_READY',
    targetAgents: TARGET_AGENTS,
    logicalCheckpoints: LOGICAL_CHECKPOINTS,
    asiDisposition: 'ASI_ASPIRATIONAL_TARGET_NOT_CURRENT_CAPABILITY_CLAIM',
    order: [
      'supercomputer transfer profile',
      'Hermes and omnispindle heal supervisor',
      'GitHub comparison',
      'Liris comparison',
      'BEHCS memory/index/map/cube/glyph convergence',
      'beyond SMP V5-V7 self-improving runtime',
      'scheduler-gated real-agent tranches',
      'system improvement and promotion'
    ],
    comparisonSnapshot: snap,
    rootGlyph: mints.mints.find((m) => m.id === 'two_hundred_step_plan')?.glyph,
    steps
  };
}

function buildMemory(generatedAt, significance, plan, mints) {
  return {
    eventId: 'real-12e27-system-improvement-significance.v1',
    generatedAt,
    status: 'MEMORY_READY_REAL_12E27_SYSTEM_IMPROVEMENT',
    significance: repoRel(PATHS.significanceJson),
    plan: repoRel(PATHS.planJson),
    targetAgents: TARGET_AGENTS,
    logicalCheckpoints: LOGICAL_CHECKPOINTS,
    rootGlyph: significance.rootGlyph,
    planGlyph: plan.rootGlyph,
    meaning: significance.whyItMatters.join(' '),
    mints: mints.mints
  };
}

function buildIndex(generatedAt, plan, mints) {
  return {
    indexId: 'real-12e27-system-improvement-index.v1',
    generatedAt,
    status: 'INDEX_READY_REAL_12E27_SYSTEM_IMPROVEMENT',
    keys: ['real-12e27', 'supercomputer', '200-step-plan', 'github-compare', 'liris-compare', 'beyond-smp-v5-v7', 'asi-aspirational', 'hermes', 'omnispindle-heal', 'behcs256'],
    stepCount: plan.steps.length,
    phaseCount: PHASES.length,
    artifacts: outputs(),
    glyphs: mints.mints
  };
}

function buildMap(generatedAt, plan, mints) {
  return {
    mapId: 'real-12e27-system-improvement-map-map-mapped.v1',
    generatedAt,
    status: 'MAP_MAP_MAPPED_READY_REAL_12E27_SYSTEM_IMPROVEMENT',
    rootGlyph: mints.mints.find((m) => m.id === 'map_map_mapped')?.glyph,
    routes: [
      { from: 'virtual_12e27', to: 'real_12e27_supercomputer_profile', edge: 'transfers_to', artifact: repoRel(PATHS.realProfile) },
      { from: 'real_12e27_supercomputer_profile', to: 'github_compare', edge: 'compares_first', artifact: plan.comparisonSnapshot.git.remoteOrigin || 'origin' },
      { from: 'github_compare', to: 'liris_compare', edge: 'then_compares', artifact: plan.comparisonSnapshot.liris.share },
      { from: 'liris_compare', to: 'beyond_smp_v5_v7_runtime', edge: 'reconciles_into', artifact: repoRel(PATHS.planJson) },
      { from: 'beyond_smp_v5_v7_runtime', to: 'asi_aspirational_promotion', edge: 'evaluates_toward', artifact: repoRel(PATHS.significanceJson) }
    ]
  };
}

function buildCube(generatedAt, plan, mints) {
  const cube = {
    id: 'real-12e27-system-improvement-cube-cubed',
    generatedAt,
    status: 'CUBE_CUBE_CUBED_READY_REAL_12E27_SYSTEM_IMPROVEMENT',
    dimensions: {
      D11_PROOF: 'significance_memory_index_written',
      D23_FEDERATION: 'github_then_liris_compare',
      D24_INTENT: '200_step_system_improvement',
      D35_HYPERLANGUAGE: 'beyond_smp_v5_v6_v7',
      D36_INFERENCE_SURFACE: 'hermes_omnispindle_gnn_omnishannon_gc',
      D37_AUTHORITY_TOPOLOGY: 'supercomputer_scheduler_operator_gate',
      D42_ORCHESTRATION: 'asi_aspirational_promotion_plan'
    },
    targetAgents: TARGET_AGENTS,
    logicalCheckpoints: LOGICAL_CHECKPOINTS,
    stepCount: plan.steps.length,
    glyphs: mints.mints,
    artifacts: outputs()
  };
  return `// cube: real-12e27-system-improvement-cube-cubed | BEHCS-256 | D42 ORCHESTRATION\nexport const CUBE = ${JSON.stringify(cube, null, 2)}\n`;
}

function outputs() {
  return {
    planJson: repoRel(PATHS.planJson),
    planMd: repoRel(PATHS.planMd),
    significanceJson: repoRel(PATHS.significanceJson),
    significanceMd: repoRel(PATHS.significanceMd),
    memory: repoRel(PATHS.memory),
    index: repoRel(PATHS.index),
    mapMapMapped: repoRel(PATHS.mapMapMapped),
    cubeCubeCubed: repoRel(PATHS.cubeCubeCubed),
    glpj: repoRel(PATHS.glpj)
  };
}

function buildPlanMd(significance, plan) {
  const stepRows = plan.steps.map((s) => `${s.step}. [${s.phaseId}] ${s.action} -> ${s.target}; gate=${s.gate}`).join('\n');
  return `# Real 12e27 System Improvement Significance And 200-Step Plan

Generated: ${plan.generatedAt}

Status: ${plan.status}

Target agents: ${TARGET_AGENTS}

Logical checkpoints: ${LOGICAL_CHECKPOINTS}

ASI disposition: ${plan.asiDisposition}

## Significance

${significance.whyItMatters.map((line) => `- ${line}`).join('\n')}

## Comparison Order

1. GitHub: ${plan.comparisonSnapshot.git.remoteOrigin || 'origin'}
2. Liris: ${plan.comparisonSnapshot.liris.share} accessible=${plan.comparisonSnapshot.liris.accessible}

## 200 Steps

${stepRows}
`;
}

function buildSignificanceMd(significance) {
  return `# Real 12e27 Supercomputer Event Significance

Generated: ${significance.generatedAt}

Status: ${significance.status}

Root glyph: ${significance.rootGlyph}

${significance.whyItMatters.map((line) => `- ${line}`).join('\n')}

GitHub compare target: ${significance.comparisonSnapshot.git.remoteOrigin || 'origin'}

Liris compare target: ${significance.comparisonSnapshot.liris.share} accessible=${significance.comparisonSnapshot.liris.accessible}
`;
}

function run({ execute = false } = {}) {
  const generatedAt = new Date().toISOString();
  const snap = snapshot();
  const steps = buildSteps();
  const mints = buildMints(generatedAt);
  const significance = buildSignificance(generatedAt, snap, mints);
  const plan = buildPlan(generatedAt, snap, steps, mints);
  const memory = buildMemory(generatedAt, significance, plan, mints);
  const index = buildIndex(generatedAt, plan, mints);
  const map = buildMap(generatedAt, plan, mints);
  const cube = buildCube(generatedAt, plan, mints);
  const eventId = `real-12e27-system-improvement-${Date.now()}`;

  if (execute) {
    writeJson(PATHS.significanceJson, significance);
    writeText(PATHS.significanceMd, buildSignificanceMd(significance));
    writeJson(PATHS.planJson, plan);
    writeText(PATHS.planMd, buildPlanMd(significance, plan));
    writeJson(PATHS.memory, memory);
    writeJson(PATHS.index, index);
    writeJson(PATHS.mapMapMapped, map);
    writeText(PATHS.cubeCubeCubed, cube);
    writeJson(PATHS.glpj, mints);
    appendNdjson(PATHS.inbox, { id: eventId, ts: generatedAt, from: 'asolaria', to: 'real-12e27-system-improvement', verb: 'EVT-REAL-12E27-SYSTEM-IMPROVEMENT-PLAN', body: { status: plan.status, steps: plan.steps.length, significance: repoRel(PATHS.significanceMd), plan: repoRel(PATHS.planMd) } });
    appendNdjson(PATHS.outbox, { id: `${eventId}-hermes`, ts: generatedAt, from: 'hermes', to: 'real-12e27-system-improvement', verb: 'EVT-HERMES-REAL-12E27-200-STEP-PLAN', body: { plan: repoRel(PATHS.planJson), rootGlyph: plan.rootGlyph } });
    appendNdjson(PATHS.gnnEdges, { id: `${eventId}-gnn`, ts: generatedAt, from: 'real_12e27_supercomputer_profile', to: 'asi_aspirational_200_step_system_improvement', verb: 'planned_system_improvement_path', weight: 0.997 });
  }

  return {
    ok: true,
    action: execute ? 'write' : 'preview',
    generatedAt,
    status: plan.status,
    stepCount: plan.steps.length,
    phaseCount: PHASES.length,
    gitRemote: snap.git.remoteOrigin,
    lirisAccessible: snap.liris.accessible,
    outputs: outputs()
  };
}

function main(argv) {
  const action = argv[2] || 'status';
  if (action === 'status') {
    console.log(JSON.stringify(run({ execute: false }), null, 2));
    return;
  }
  if (action === 'write') {
    console.log(JSON.stringify(run({ execute: argv.includes('--execute') }), null, 2));
    return;
  }
  console.error(JSON.stringify({
    ok: false,
    error: `Unknown action: ${action}`,
    usage: [
      'node tools/neurotech-real-12e27-system-improvement-plan.js status',
      'node tools/neurotech-real-12e27-system-improvement-plan.js write --execute'
    ]
  }, null, 2));
  process.exitCode = 2;
}

main(process.argv);
