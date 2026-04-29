#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const repoRoot = path.resolve(__dirname, '..');
const userRoot = process.env.USERPROFILE || 'C:/Users/acer';
const reserveRoot = process.env.ASOLARIA_RESERVE_ROOT || 'D:/Asolaria-Reserve';

const MODE = Object.freeze({
  backend: 'local_filesystem_free_backend',
  cli: 'bare_node_cli',
  headless: true,
  shelllessRuntime: true,
  noServerAuth: true,
  noServerApiRoute: true,
  noExternalApiCalls: true,
  noMove: true,
  noDelete: true,
  noInstall: true,
  noProcessLaunch: true,
  childProcessUse: false,
  secretMaterialWritten: false
});

const PATHS = Object.freeze({
  state: rel('data/behcs/state/storage/c-drive-reallocation.state.json'),
  plan: rel('data/behcs/plans/c-drive-reallocation-plan.v1.json'),
  reportJson: rel('reports/c-drive-reallocation-plan-latest.json'),
  reportMd: rel('reports/c-drive-reallocation-plan-latest.md'),
  hermes: rel('data/behcs/hermes/storage/c-drive-reallocation-dispatch-latest.json'),
  shannon: rel('data/behcs/shannon/storage/c-drive-reallocation-consensus-latest.json'),
  cube: rel('data/behcs/cubes/c-drive-reallocation-supervisor.cube.js'),
  inbox: rel('data/behcs/inbox.ndjson'),
  outbox: rel('data/behcs/outbox.ndjson'),
  gnnEdges: rel('data/behcs/gnn-live-edges.ndjson')
});

const TARGETS = [
  target('downloads', path.join(userRoot, 'Downloads'), 'safe_move_data', 'Move installers/archives/data after hash inventory; do not execute anything from Downloads.'),
  target('desktop', path.join(userRoot, 'Desktop'), 'safe_move_data', 'Move old media/reports manually after verifying shortcuts are not active project roots.'),
  target('videos', path.join(userRoot, 'Videos'), 'safe_move_data', 'Move media to reserve drive.'),
  target('captures', path.join(userRoot, 'captures'), 'safe_move_data', 'Move old captures to reserve archive after Asolaria report references are sealed.'),
  target('root-temp', 'C:/Temp', 'cache_regenerable', 'Clean or move only known scratch files; leave active installers alone.'),
  target('user-temp', path.join(userRoot, 'AppData/Local/Temp'), 'cache_regenerable', 'Clean through Windows/installer-safe tools; do not remove locked files by force.'),
  target('pnpm-store', path.join(userRoot, '.pnpm-store'), 'cache_regenerable', 'Can be relocated with pnpm store config or pruned and rebuilt.'),
  target('npm-cache', path.join(userRoot, '.npm'), 'cache_regenerable', 'Can be cleaned or moved with npm cache config.'),
  target('gradle-cache', path.join(userRoot, '.gradle'), 'cache_regenerable', 'Can be relocated with GRADLE_USER_HOME after builds are stopped.'),
  target('nuget-cache', path.join(userRoot, '.nuget'), 'cache_regenerable', 'Can be relocated with NUGET_PACKAGES after builds are stopped.'),
  target('anaconda-pkgs', path.join(userRoot, 'anaconda3/pkgs'), 'cache_regenerable', 'Package cache can be cleaned with conda tooling; do not move base env by hand.'),
  target('lmstudio-models', path.join(userRoot, '.lmstudio'), 'move_with_env_or_junction', 'Model storage candidate; move only with app stopped and a verified junction/env path.'),
  target('huggingface-cache', path.join(userRoot, '.cache/huggingface'), 'move_with_env_or_junction', 'Model cache candidate; prefer HF_HOME on reserve drive.'),
  target('docker-user', path.join(userRoot, '.docker'), 'move_with_vendor_tool', 'Docker config only; Docker engine data must move through Docker Desktop settings, not manual copy.'),
  target('appdata-docker', path.join(userRoot, 'AppData/Local/Docker'), 'move_with_vendor_tool', 'Move through Docker Desktop data-root settings only.'),
  target('public-runtime', path.join(userRoot, 'Asolaria-PublicRuntime'), 'project_move_with_config_update', 'Deployment artifact; archive/move after verifying it is not the canonical dev source.'),
  target('public-runtime-clean', path.join(userRoot, 'Asolaria-PublicRuntime-Clean-20260216124549'), 'project_move_with_config_update', 'Deployment artifact; archive/move after verifying it is not referenced.'),
  target('source-snapshots', path.join(userRoot, 'source'), 'project_move_with_config_update', 'Test/deployment snapshots can move after aliases and shortcuts are updated.'),
  target('root-projects', 'C:/projects', 'project_move_with_config_update', 'Noncanonical project roots can move per repo after git status and path aliases are updated.'),
  target('root-reports', 'C:/reports', 'safe_move_data', 'Archive old reports after latest pointers are preserved.'),
  target('top-node-modules', path.join(userRoot, 'node_modules'), 'cache_regenerable', 'Top-level node_modules can usually be removed and regenerated; do not affect project lockfiles.'),
  target('asolaria-canonical', path.join(userRoot, 'Asolaria'), 'keep_on_c', 'Canonical source. Do not move unless Asolaria path policy, shortcuts, services, and docs are rewritten together.'),
  target('program-files', 'C:/Program Files', 'do_not_move_manually', 'Installed apps must be moved by installer/vendor tooling only.'),
  target('program-files-x86', 'C:/Program Files (x86)', 'do_not_move_manually', 'Installed apps must be moved by installer/vendor tooling only.'),
  target('windows', 'C:/Windows', 'do_not_move_manually', 'Operating system. Never move manually.')
];

function rel(p) {
  return path.join(repoRoot, p);
}

function repoRel(p) {
  return path.relative(repoRoot, p).replace(/\\/g, '/');
}

function target(id, root, policy, note) {
  return { id, root: path.resolve(root), policy, note };
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
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

function sha256Text(input) {
  return crypto.createHash('sha256').update(String(input)).digest('hex');
}

function bytes(n) {
  return Number.isFinite(n) ? n : 0;
}

function gib(n) {
  return Math.round((bytes(n) / 1024 / 1024 / 1024) * 10) / 10;
}

function volume(root) {
  try {
    const stats = fs.statfsSync(root);
    const total = Number(stats.blocks) * Number(stats.bsize);
    const free = Number(stats.bavail) * Number(stats.bsize);
    return {
      root,
      ok: true,
      totalBytes: total,
      freeBytes: free,
      usedBytes: total - free,
      totalGiB: gib(total),
      freeGiB: gib(free),
      usedGiB: gib(total - free),
      freePercent: total ? Math.round((free / total) * 1000) / 10 : null
    };
  } catch (error) {
    return { root, ok: false, error: error.message };
  }
}

function safeLstat(p) {
  try {
    return fs.lstatSync(p);
  } catch (_) {
    return null;
  }
}

function scanTree(root, maxEntries = 6000, maxDepth = 3) {
  const rootStat = safeLstat(root);
  if (!rootStat) {
    return { exists: false, bytes: 0, files: 0, dirs: 0, skippedLinks: 0, errors: 0, truncated: false };
  }

  const stack = [{ p: root, depth: 0 }];
  let total = 0;
  let files = 0;
  let dirs = 0;
  let skippedLinks = 0;
  let errors = 0;
  let seen = 0;
  let truncated = false;

  while (stack.length) {
    const { p: current, depth } = stack.pop();
    if (++seen > maxEntries) {
      truncated = true;
      break;
    }
    const stat = safeLstat(current);
    if (!stat) {
      errors += 1;
      continue;
    }
    if (stat.isSymbolicLink()) {
      skippedLinks += 1;
      continue;
    }
    if (stat.isFile()) {
      files += 1;
      total += stat.size;
      continue;
    }
    if (!stat.isDirectory()) continue;
    dirs += 1;
    if (depth >= maxDepth) {
      truncated = true;
      continue;
    }
    let entries = [];
    try {
      entries = fs.readdirSync(current);
    } catch (_) {
      errors += 1;
      continue;
    }
    for (const entry of entries) {
      stack.push({ p: path.join(current, entry), depth: depth + 1 });
    }
  }

  return { exists: true, bytes: total, files, dirs, skippedLinks, errors, truncated };
}

function scanTarget(entry) {
  const stat = safeLstat(entry.root);
  if (['do_not_move_manually', 'move_with_vendor_tool'].includes(entry.policy)) {
    return {
      exists: Boolean(stat),
      bytes: 0,
      files: 0,
      dirs: stat && stat.isDirectory() ? 1 : 0,
      skippedLinks: 0,
      errors: 0,
      truncated: true,
      scanNote: 'deep_scan_skipped_by_policy'
    };
  }
  return scanTree(entry.root);
}

function riskForPolicy(policy) {
  if (policy === 'safe_move_data') return 'low';
  if (policy === 'cache_regenerable') return 'low_to_medium';
  if (policy === 'move_with_env_or_junction') return 'medium';
  if (policy === 'project_move_with_config_update') return 'medium';
  if (policy === 'move_with_vendor_tool') return 'medium_to_high';
  if (policy === 'keep_on_c') return 'high';
  return 'critical';
}

function buildPlan(targets, volumes, generatedAt) {
  const movable = targets.filter((entry) => ['safe_move_data', 'cache_regenerable', 'move_with_env_or_junction', 'project_move_with_config_update'].includes(entry.policy));
  const reclaimableBytes = movable.reduce((sum, entry) => sum + entry.bytes, 0);
  const cVolume = volumes.find((entry) => entry.root === 'C:/');

  return {
    planId: 'c-drive-reallocation-plan.v1',
    generatedAt,
    status: cVolume && cVolume.ok && cVolume.freePercent < 12 ? 'PRESSURE_HIGH_PLAN_ONLY' : 'PRESSURE_MANAGEABLE_PLAN_ONLY',
    mode: MODE,
    reserveRoot,
    rule: 'No move/delete/install is performed by this supervisor.',
    volumes,
    summary: {
      cFreeGiB: cVolume?.freeGiB ?? null,
      cFreePercent: cVolume?.freePercent ?? null,
      scannedTargets: targets.length,
      estimatedReclaimableGiB: gib(reclaimableBytes)
    },
    stages: [
      {
        id: 'stage_0_backups_and_freeze',
        action: 'Create restore point/backups and stop Asolaria, Docker, IDEs, model servers, and package managers before any real move.',
        gate: 'operator_approved'
      },
      {
        id: 'stage_1_low_risk_data_archive',
        action: `Move old Downloads, captures, videos, public runtime snapshots, and root reports to ${reserveRoot}/archive after checksum inventory.`,
        gate: 'hash_verified_copy_before_delete'
      },
      {
        id: 'stage_2_cache_relocation',
        action: 'Relocate regenerable caches using tool-supported settings: pnpm store, npm cache, GRADLE_USER_HOME, NUGET_PACKAGES, conda package cache cleanup.',
        gate: 'build_smoke_after_each_cache'
      },
      {
        id: 'stage_3_model_cache_relocation',
        action: `Move model caches to ${reserveRoot}/models with environment variables such as HF_HOME and app-specific model directories; use junction only after full shutdown and verified copy.`,
        gate: 'model_load_smoke'
      },
      {
        id: 'stage_4_project_rehome',
        action: 'Move only noncanonical project snapshots after git status, path aliases, shortcuts, and Asolaria local-ops aliases are updated.',
        gate: 'git_status_and_asolaria_health_pass'
      },
      {
        id: 'stage_5_installed_apps',
        action: 'Move installed applications only through vendor uninstall/reinstall or official settings. Never drag Program Files, Windows, or Docker engine data.',
        gate: 'vendor_tool_only'
      }
    ],
    doNotMoveManually: targets
      .filter((entry) => ['do_not_move_manually', 'keep_on_c', 'move_with_vendor_tool'].includes(entry.policy))
      .map((entry) => ({ id: entry.id, root: entry.root, policy: entry.policy, note: entry.note })),
    candidates: targets
      .filter((entry) => entry.exists)
      .sort((a, b) => b.bytes - a.bytes)
      .map((entry) => ({
        id: entry.id,
        root: entry.root,
        policy: entry.policy,
        risk: entry.risk,
        sizeGiB: entry.sizeGiB,
        files: entry.files,
        dirs: entry.dirs,
        truncated: entry.truncated,
        note: entry.note
      }))
  };
}

function buildHermes(plan, generatedAt) {
  return {
    integrationId: 'c-drive-reallocation-hermes-dispatch',
    generatedAt,
    status: plan.status,
    mode: MODE,
    packet: {
      verb: 'EVT-HERMES-C-DRIVE-REALLOCATION-PLAN',
      summary: 'C-drive pressure inventoried locally; migration remains plan-only and fail-closed for destructive actions.',
      cFreeGiB: plan.summary.cFreeGiB,
      estimatedReclaimableGiB: plan.summary.estimatedReclaimableGiB,
      reserveRoot,
      report: repoRel(PATHS.reportMd)
    }
  };
}

function buildShannon(plan, generatedAt) {
  const pressureHigh = plan.status === 'PRESSURE_HIGH_PLAN_ONLY';
  return {
    integrationId: 'c-drive-reallocation-shannon-consensus',
    generatedAt,
    status: pressureHigh ? 'consensus_needs_operator_staged_migration' : 'consensus_watch_and_stage',
    consensus: pressureHigh ? 'NEEDS-STAGED-MIGRATION' : 'WATCH',
    executionDisposition: 'no_move_no_delete_no_install',
    votes: [
      { part: 'scout', vote: 'PROCEED_PLAN_ONLY', reason: 'Volume and target sizes were inventoried without mutation.' },
      { part: 'evidence', vote: 'PROCEED_PLAN_ONLY', reason: 'Report stores only directory-level sizing and policy classes.' },
      { part: 'executor', vote: 'HALT_DESTRUCTIVE', reason: 'Any real move/delete/install remains blocked until operator approves a staged command plan.' },
      { part: 'fabric', vote: 'PROCEED_PLAN_ONLY', reason: 'Plan integrated into BEHCS/Hermes/Shannon/report/cube surfaces.' },
      { part: 'voice', vote: 'PROCEED_PLAN_ONLY', reason: 'Canonical Asolaria source remains protected on C:.' },
      { part: 'planner', vote: pressureHigh ? 'NEEDS-STAGED-MIGRATION' : 'WATCH', reason: `C: free space is ${plan.summary.cFreeGiB} GiB.` }
    ]
  };
}

function buildCube(plan, shannonPacket, generatedAt) {
  const cube = {
    id: 'c-drive-reallocation-supervisor',
    generatedAt,
    primaryCatalog: { D: 47, name: 'BOUNDARY', prime: 211 },
    touches: [6, 20, 35, 37, 38, 39, 42, 47],
    payload: {
      kind: 'storage-reallocation-plan',
      status: plan.status,
      reserveRoot,
      mode: MODE,
      summary: plan.summary,
      shannon: {
        consensus: shannonPacket.consensus,
        executionDisposition: shannonPacket.executionDisposition
      }
    },
    translate: {
      human: 'C-drive reallocation is planned from local evidence; destructive action is fail-closed.',
      agent: '(asolaria, storage, c_drive, reserve_drive, plan_only, no_move, no_delete)',
      device: 'node tools/c-drive-reallocation-supervisor.js tick --execute'
    }
  };
  return `// cube: c-drive-reallocation-supervisor | storage | D47 BOUNDARY
export const CUBE = ${JSON.stringify(cube, null, 2)}
`;
}

function buildReport(plan, generatedAt) {
  const rows = plan.candidates.slice(0, 20).map((entry) =>
    `| ${entry.id} | ${entry.sizeGiB} | ${entry.policy} | ${entry.risk} | ${entry.truncated ? 'yes' : 'no'} | ${entry.root} |`
  ).join('\n');
  const stageRows = plan.stages.map((entry) =>
    `| ${entry.id} | ${entry.gate} | ${entry.action} |`
  ).join('\n');
  const lockRows = plan.doNotMoveManually.map((entry) =>
    `| ${entry.id} | ${entry.policy} | ${entry.root} | ${entry.note} |`
  ).join('\n');

  const md = `# C-Drive Reallocation Plan

Generated: ${generatedAt}

Status: ${plan.status}

Mode: local-only, plan-only. This supervisor did not move, delete, install, download, launch, or mutate anything.

Reserve target: \`${reserveRoot}\`

## Summary

- C: free: ${plan.summary.cFreeGiB} GiB (${plan.summary.cFreePercent}%)
- Estimated scanned reclaimable candidate total: ${plan.summary.estimatedReclaimableGiB} GiB
- Scanned target count: ${plan.summary.scannedTargets}

## Top Candidates

| Target | GiB | Policy | Risk | Truncated | Root |
| --- | ---: | --- | --- | --- | --- |
${rows || '| none | 0 | none | none | no | none |'}

## Stages

| Stage | Gate | Action |
| --- | --- | --- |
${stageRows}

## Do Not Move Manually

| Target | Policy | Root | Note |
| --- | --- | --- | --- |
${lockRows}
`;

  return { json: plan, md };
}

function tick({ execute = false } = {}) {
  const generatedAt = new Date().toISOString();
  const volumes = [volume('C:/'), volume('D:/')];
  const scannedTargets = TARGETS.map((entry) => {
    const scan = scanTarget(entry);
    return {
      ...entry,
      ...scan,
      sizeGiB: gib(scan.bytes),
      risk: riskForPolicy(entry.policy)
    };
  });
  const plan = buildPlan(scannedTargets, volumes, generatedAt);
  const hermesPacket = buildHermes(plan, generatedAt);
  const shannonPacket = buildShannon(plan, generatedAt);
  const cube = buildCube(plan, shannonPacket, generatedAt);
  const report = buildReport(plan, generatedAt);
  const eventId = `c-drive-reallocation-${Date.now()}`;

  if (execute) {
    writeJson(PATHS.state, { savedAt: generatedAt, mode: MODE, status: plan.status, plan: repoRel(PATHS.plan) });
    writeJson(PATHS.plan, plan);
    writeJson(PATHS.hermes, hermesPacket);
    writeJson(PATHS.shannon, shannonPacket);
    writeText(PATHS.cube, cube);
    writeJson(PATHS.reportJson, report.json);
    writeText(PATHS.reportMd, report.md);
    appendNdjson(PATHS.inbox, {
      id: eventId,
      ts: generatedAt,
      from: 'asolaria',
      to: 'storage-supervisor',
      verb: 'EVT-C-DRIVE-REALLOCATION-PLAN',
      body: { status: plan.status, summary: plan.summary, report: repoRel(PATHS.reportMd) }
    });
    appendNdjson(PATHS.outbox, {
      id: `${eventId}-hermes`,
      ts: generatedAt,
      from: 'hermes',
      to: 'storage-supervisor',
      verb: hermesPacket.packet.verb,
      body: hermesPacket
    });
    appendNdjson(PATHS.gnnEdges, {
      id: `${eventId}-edge`,
      ts: generatedAt,
      from: 'c_drive',
      to: 'reserve_drive',
      verb: 'plan_only_reallocation_candidate',
      weight: plan.status === 'PRESSURE_HIGH_PLAN_ONLY' ? 0.5 : 0.2
    });
  }

  return {
    ok: true,
    action: execute ? 'tick' : 'preview',
    generatedAt,
    status: plan.status,
    cFreeGiB: plan.summary.cFreeGiB,
    cFreePercent: plan.summary.cFreePercent,
    reserveRoot,
    estimatedReclaimableGiB: plan.summary.estimatedReclaimableGiB,
    topCandidates: plan.candidates.slice(0, 8),
    shannon: {
      status: shannonPacket.status,
      consensus: shannonPacket.consensus
    },
    outputs: {
      state: repoRel(PATHS.state),
      plan: repoRel(PATHS.plan),
      reportJson: repoRel(PATHS.reportJson),
      reportMd: repoRel(PATHS.reportMd),
      hermes: repoRel(PATHS.hermes),
      shannon: repoRel(PATHS.shannon),
      cube: repoRel(PATHS.cube)
    },
    mode: MODE
  };
}

function main(argv) {
  const action = argv[2] || 'status';
  const execute = argv.includes('--execute');
  if (action === 'status') {
    console.log(JSON.stringify(tick({ execute: false }), null, 2));
    return;
  }
  if (action === 'tick') {
    console.log(JSON.stringify(tick({ execute }), null, 2));
    return;
  }
  console.error(JSON.stringify({
    ok: false,
    error: `Unknown action: ${action}`,
    usage: [
      'node tools/c-drive-reallocation-supervisor.js status',
      'node tools/c-drive-reallocation-supervisor.js tick --execute'
    ]
  }, null, 2));
  process.exitCode = 2;
}

main(process.argv);
