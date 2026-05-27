#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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
  noModelExecution: true,
  noAgentLaunch: true,
  noFileDelete: true,
  noFileMove: true,
  noRawEvidencePrune: true,
  nonDestructiveGcAudit: true,
  childProcessUse: false,
  secretMaterialWritten: false
});

const PATHS = Object.freeze({
  realMillionReport: rel('reports/neurotech-real-million-agent-runner-latest.json'),
  real100bReport: rel('reports/neurotech-real-100b-agent-runner-latest.json'),
  selfImprovementReport: rel('reports/neurotech-real-100b-self-improvement-loop-latest.json'),
  real100bGc: rel('data/neurotech-defense-lab/real-agents/100b-run/self-improvement/gulp-gc-latest.json'),
  real100bRoot: rel('data/neurotech-defense-lab/real-agents/100b-run'),
  realMillionRoot: rel('data/neurotech-defense-lab/real-agents/million-run'),
  finalGcRoot: rel('data/neurotech-defense-lab/real-agents/final-gc'),
  finalManifest: rel('data/neurotech-defense-lab/real-agents/final-gc/final-gc-manifest.v1.json'),
  finalDispositionCsv: rel('data/neurotech-defense-lab/real-agents/final-gc/final-disposition-latest.csv'),
  mintedLanguage: rel('data/behcs/codex/glyph-language/neurotech-real-agent-final-gc-behcs256.v1.json'),
  mintedLanguageCsv: rel('data/behcs/codex/glyph-language/neurotech-real-agent-final-gc-behcs256-latest.csv'),
  mapMapMapped: rel('data/behcs/maps/neurotech/neurotech-real-agent-final-gc-map-map-mapped.v1.json'),
  cubeCubed: rel('data/behcs/cubes/neurotech-real-agent-final-gc-cube-cubed.cube.js'),
  index: rel('data/behcs/index/neurotech-real-agent-final-gc-index.v1.json'),
  memory: rel('data/memory/neurotech-real-agent-final-gc-memory.v1.json'),
  crypto: rel('data/behcs/crypto/neurotech-real-agent-final-gc-crypto-256.v1.json'),
  supervisors: rel('data/behcs/supervisors/neurotech/neurotech-real-agent-final-gc-supervisors.v1.json'),
  hermes: rel('data/behcs/hermes/neurotech-defense/neurotech-real-agent-final-gc-mint-dispatch-latest.json'),
  shannon: rel('data/behcs/shannon/neurotech-defense/neurotech-real-agent-final-gc-mint-consensus-latest.json'),
  state: rel('data/behcs/state/neurotech-defense/neurotech-real-agent-final-gc-mint.state.json'),
  cube: rel('data/behcs/cubes/neurotech-real-agent-final-gc-mint.cube.js'),
  reportJson: rel('reports/neurotech-real-agent-final-gc-mint-latest.json'),
  reportMd: rel('reports/neurotech-real-agent-final-gc-mint-latest.md'),
  inbox: rel('data/behcs/inbox.ndjson'),
  outbox: rel('data/behcs/outbox.ndjson'),
  gnnEdges: rel('data/behcs/gnn-live-edges.ndjson')
});

const FINAL_KEEP_GLOBS = [
  'genius-farm-latest.json',
  'genius-farm-latest.ndjson',
  'mistake-farm-latest.json',
  'mistake-farm-latest.ndjson',
  'idea-farm-latest.json',
  'idea-farm-latest.ndjson',
  'mistake-farm-latest.json',
  'mistake-farm-latest.ndjson',
  'pattern-farm-latest.json',
  'pattern-farm-latest.ndjson',
  'real-100b-gnn-summary-latest.json',
  'real-agent-gnn-summary-latest.json',
  'gulp-gc-latest.json'
];

const EVIDENCE_RETAIN_GLOBS = [
  'gulp-2000-mints-ledger.ndjson',
  'gulp-2000-mints-latest.ndjson',
  'gulp-compact-shards.ndjson',
  'real-100b-chunks.ndjson',
  'real-100b-proof-samples-latest.ndjson',
  'real-agent-chunks-1000.ndjson',
  'real-agent-proof-samples-latest.ndjson',
  'genius-real-agent-marks-latest.csv',
  'genius-real-agent-marks-latest.ndjson',
  'mistake-real-agent-marks-latest.csv',
  'mistake-real-agent-marks-latest.ndjson',
  'daemon-latest.ndjson',
  'daemon.state.json',
  'checkpoint.state.json',
  'self-improvement-loop.state.json',
  'STOP.request'
];

const SUPERVISOR_TEMPLATES = [
  ['final_gc_truth_auditor', 'Verifies processed, gulped, minted, and backlog counts before any prune is allowed.'],
  ['glyph_language_minter', 'Mints genius, mistake, evidence, and gap records into a 256-slot BEHCS language packet.'],
  ['map_map_mapped_indexer', 'Builds lane, source, PID, and disposition indexes from the minted records.'],
  ['cube_cubed_sealer', 'Writes cube-cubed summary and crypto root for the final GC pass.'],
  ['evidence_retention_guard', 'Preserves raw ledgers until the operator approves prune after hashes are sealed.'],
  ['backlog_reconciliation_guard', 'Marks runner-versus-gulp discrepancies as mistakes until reconciled.'],
  ['genius_farm_promoter', 'Promotes extracted genius ideas into supervisor/build lanes only from final farms.'],
  ['mistake_glyph_promoter', 'Promotes critical mistakes into guards and Hookwall rules from final farms.'],
  ['gulp_rate_guard', 'Checks every-2000 gulp cadence and marks missing gulp windows.'],
  ['storage_pressure_guard', 'Keeps raw packet derivatives prunable after hash sealing to avoid C-drive pressure.'],
  ['neuro_claim_boundary_guard', 'Blocks literal mind-reading, medical, coercive, or harmful interpretation.'],
  ['ruview_static_wall', 'Keeps RU-view evidence static and fail-closed.'],
  ['pid_consent_guard', 'Requires PID, consent scope, stop/delete rights, and storage policy on live data.'],
  ['synthetic_first_guard', 'Keeps live EEG closed until synthetic replay, metadata, and quality gates pass.'],
  ['memory_compaction_guard', 'Stores final memory summaries without duplicating raw packet streams.'],
  ['operator_prune_gate', 'Requires explicit operator approval before removing or moving raw evidence files.']
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

function writeJson(filePath, data) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function writeText(filePath, text) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, String(text || '').endsWith('\n') ? String(text || '') : `${text}\n`, 'utf8');
}

function appendNdjson(filePath, data) {
  ensureDir(filePath);
  fs.appendFileSync(filePath, `${JSON.stringify(data)}\n`, 'utf8');
}

function sha256Text(text) {
  return crypto.createHash('sha256').update(String(text || '')).digest('hex');
}

function sha256Object(value) {
  return sha256Text(JSON.stringify(value));
}

function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  const data = fs.readFileSync(filePath);
  hash.update(data);
  return hash.digest('hex');
}

function safeStat(filePath) {
  try {
    return fs.statSync(filePath);
  } catch (_) {
    return null;
  }
}

function readDirRecursive(root) {
  const out = [];
  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch (_) {
      continue;
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile()) {
        out.push(full);
      }
    }
  }
  return out.sort();
}

function toBigInt(value) {
  if (value === null || value === undefined || value === '') return 0n;
  return BigInt(String(value).replace(/,/g, ''));
}

function bigString(value) {
  return toBigInt(value).toString();
}

function maybeArray(value) {
  return Array.isArray(value) ? value : [];
}

function basename(filePath) {
  return path.basename(filePath).toLowerCase();
}

function dispositionForFile(filePath) {
  const name = basename(filePath);
  if (FINAL_KEEP_GLOBS.includes(name)) return 'final_keep';
  if (EVIDENCE_RETAIN_GLOBS.includes(name)) return 'evidence_retain_until_operator_prune';
  if (name.endsWith('.json') || name.endsWith('.md') || name.endsWith('.cube.js')) return 'final_keep';
  return 'evidence_retain_until_operator_prune';
}

function evidenceRecord(filePath) {
  const stat = safeStat(filePath);
  if (!stat) return null;
  return {
    path: repoRel(filePath),
    bytes: stat.size,
    disposition: dispositionForFile(filePath),
    sha256: sha256File(filePath)
  };
}

function buildEvidence() {
  const roots = [PATHS.real100bRoot, PATHS.realMillionRoot];
  const files = roots.flatMap((root) => safeStat(root) ? readDirRecursive(root) : []);
  return files
    .map(evidenceRecord)
    .filter(Boolean)
    .sort((a, b) => b.bytes - a.bytes || a.path.localeCompare(b.path));
}

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function shortHash(value) {
  return sha256Text(value).slice(0, 16).toUpperCase();
}

function countLines(filePath) {
  try {
    const text = fs.readFileSync(filePath, 'utf8').trim();
    if (!text) return 0;
    return text.split(/\r?\n/).length;
  } catch (_) {
    return 0;
  }
}

function firstPresent(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') return value;
  }
  return null;
}

function buildTruth(generatedAt) {
  const million = readJson(PATHS.realMillionReport, {});
  const hundred = readJson(PATHS.real100bReport, {});
  const self = readJson(PATHS.selfImprovementReport, {});
  const gc = readJson(PATHS.real100bGc, {});
  const millionCounts = million.summary?.counts || {};
  const hundredCounts = hundred.summary?.counts || {};
  const selfCounts = self.summary?.counts || {};

  const targetPackets = toBigInt(firstPresent(hundredCounts.targetPackets, selfCounts.targetPackets, 0));
  const runnerProcessed = toBigInt(firstPresent(hundredCounts.processedPackets, 0));
  const selfObservedRunnerProcessed = toBigInt(firstPresent(selfCounts.runnerProcessedPackets, 0));
  const lastGulped = toBigInt(firstPresent(selfCounts.lastGulpedPacket, 0));
  const actualUngulpedFromRunner = runnerProcessed > lastGulped ? runnerProcessed - lastGulped : 0n;
  const selfReportedBacklog = toBigInt(firstPresent(selfCounts.remainingBacklogPackets, 0));
  const backlogDelta = actualUngulpedFromRunner >= selfReportedBacklog
    ? actualUngulpedFromRunner - selfReportedBacklog
    : selfReportedBacklog - actualUngulpedFromRunner;
  const gulpEvery = toBigInt(firstPresent(selfCounts.gulpEveryPackets, 2000));
  const expectedGulpsFromLastGulped = gulpEvery ? lastGulped / gulpEvery : 0n;
  const totalGulps = toBigInt(firstPresent(selfCounts.totalGulps, 0));

  return {
    generatedAt,
    status: actualUngulpedFromRunner > 0n || backlogDelta > 0n
      ? 'FINAL_GC_BACKFILL_NEEDED_FOR_UNGULPED_BACKLOG'
      : 'FINAL_GC_AUDIT_CLEAN',
    counts: {
      realMillionPidPacketsProcessed: bigString(millionCounts.realLowerLevelAgentTasksExecuted || 0),
      realMillionGeniusMarks: bigString(millionCounts.geniusMarks || 0),
      realMillionMistakeMarks: bigString(millionCounts.mistakeMarks || 0),
      real100bTargetPackets: targetPackets.toString(),
      real100bRunnerProcessedPackets: runnerProcessed.toString(),
      real100bSelfLoopObservedRunnerPackets: selfObservedRunnerProcessed.toString(),
      real100bLastGulpedPacket: lastGulped.toString(),
      real100bActualUngulpedFromRunner: actualUngulpedFromRunner.toString(),
      real100bSelfReportedBacklogPackets: selfReportedBacklog.toString(),
      real100bBacklogDeltaPackets: backlogDelta.toString(),
      gulpEveryPackets: gulpEvery.toString(),
      expectedGulpsFromLastGulped: expectedGulpsFromLastGulped.toString(),
      recordedTotalGulps: totalGulps.toString(),
      ideaMints: bigString(selfCounts.ideaMints || 0),
      mistakeMints: bigString(selfCounts.mistakeMints || 0),
      patternMints: bigString(selfCounts.patternMints || 0),
      ideaFarmSize: Number(selfCounts.ideaFarmSize || 0),
      mistakeFarmSize: Number(selfCounts.mistakeFarmSize || 0),
      patternFarmSize: Number(selfCounts.patternFarmSize || 0),
      geniusFarmSize: Number(hundredCounts.geniusFarmSize || 0),
      mistakeFarmSize100b: Number(hundredCounts.mistakeFarmSize || 0)
    },
    sources: {
      realMillionReport: repoRel(PATHS.realMillionReport),
      real100bReport: repoRel(PATHS.real100bReport),
      selfImprovementReport: repoRel(PATHS.selfImprovementReport),
      gulpGc: repoRel(PATHS.real100bGc)
    },
    gcObserved: gc,
    rawDeletionPerformed: false,
    strictFinalOnlyGcAlreadyDone: false,
    verdict: actualUngulpedFromRunner > 0n
      ? 'The extraction farms exist, but the final strict GC was not complete because runner packets exceeded last gulped packets.'
      : 'The extraction farms and gulp counts are aligned; no ungulped backlog was found.'
  };
}

function loadFarmItems() {
  const hundred = readJson(PATHS.real100bReport, {});
  const self = readJson(PATHS.selfImprovementReport, {});
  const hundredTopGenius = maybeArray(hundred.summary?.topGenius);
  const hundredTopMistakes = maybeArray(hundred.summary?.topMistakes);
  const selfTopIdeas = maybeArray(self.summary?.topIdeas);
  const selfTopMistakes = maybeArray(self.summary?.topMistakes);
  const patternFarm = readJson(rel('data/neurotech-defense-lab/real-agents/100b-run/self-improvement/pattern-farm-latest.json'), {});
  const patterns = maybeArray(patternFarm.patterns || patternFarm.items || patternFarm.records);

  return {
    genius: [...selfTopIdeas, ...hundredTopGenius],
    mistakes: [...selfTopMistakes, ...hundredTopMistakes],
    patterns
  };
}

function pick(list, index, fallback) {
  if (!list.length) return fallback;
  return list[index % list.length];
}

function laneOf(item, fallback) {
  return item?.lane || item?.domain || item?.kind || fallback;
}

function summaryOf(item, fallback) {
  return item?.summary || item?.reason || item?.name || item?.id || fallback;
}

function sourcePidOf(item) {
  return item?.sourcePid || item?.pid || item?.controllerPid || 'PID_UNAVAILABLE';
}

function buildMintRecords(truth, farms, evidence, supervisors) {
  const records = [];
  for (let i = 0; i < 256; i += 1) {
    let className;
    let source;
    let lane;
    let disposition;
    let summary;
    let sourcePid;

    if (i < 64) {
      source = pick(farms.genius, i, {});
      className = 'genius_farm';
      lane = laneOf(source, 'genius');
      disposition = 'final_keep';
      summary = summaryOf(source, 'Extracted genius farm candidate.');
      sourcePid = sourcePidOf(source);
    } else if (i < 128) {
      source = pick(farms.mistakes, i - 64, {});
      className = 'mistake_farm';
      lane = laneOf(source, 'mistake');
      disposition = 'final_keep_guard';
      summary = summaryOf(source, 'Extracted mistake farm candidate.');
      sourcePid = sourcePidOf(source);
    } else if (i < 192) {
      source = pick(evidence, i - 128, {});
      className = 'gc_evidence';
      lane = 'evidence';
      disposition = source.disposition || 'evidence_retain_until_operator_prune';
      summary = `GC evidence file ${source.path || 'unknown'} is ${disposition}.`;
      sourcePid = 'FILE_EVIDENCE';
    } else {
      source = pick(supervisors, i - 192, {});
      className = 'supervisor_or_gap';
      lane = source.id || 'gap';
      disposition = i % 16 === 0 && truth.counts.real100bActualUngulpedFromRunner !== '0'
        ? 'gap_mark_reconcile_before_final_prune'
        : 'supervisor_keep';
      summary = i % 16 === 0 && truth.counts.real100bActualUngulpedFromRunner !== '0'
        ? `Backlog gap: ${truth.counts.real100bActualUngulpedFromRunner} runner packets were not confirmed gulped at final snapshot.`
        : source.purpose || 'Final GC supervisor lane.';
      sourcePid = 'SUPERVISOR';
    }

    const byte = i;
    const hex = `0x${i.toString(16).toUpperCase().padStart(2, '0')}`;
    const glyph = `BH.NEURO.GC.${i.toString().padStart(3, '0')}`;
    const seed = `${glyph}|${className}|${lane}|${disposition}|${summary}`;
    const digest = sha256Text(seed);

    records.push({
      glyph,
      byte,
      hex,
      className,
      lane,
      sourcePid,
      disposition,
      summary,
      mapToken: `MAP.NEURO.GC.${hex.slice(2)}`,
      cubeToken: `CUBE.NEURO.GC.${i.toString().padStart(3, '0')}`,
      memoryToken: `MEM.NEURO.GC.${shortHash(seed)}`,
      crypto256: {
        algorithm: 'sha256',
        seed,
        digest,
        first16: digest.slice(0, 16),
        last16: digest.slice(-16)
      },
      language: {
        phrase: 'MAP MAP MAPPED / CUBE cube CUBED / index.memory.crypto.256',
        protocol: 'BEHCS-256',
        lineage: ['falcon', 'liris', 'asolaria']
      }
    });
  }
  return records;
}

function buildSupervisors(generatedAt, truth) {
  return SUPERVISOR_TEMPLATES.map(([id, purpose], index) => {
    const seed = `${id}|${purpose}|${generatedAt}`;
    return {
      id,
      index,
      pid: `BH.NEURO.FINALGC.SUP.${String(index + 1).padStart(3, '0')}`,
      glyph: `BH.NEURO.FINALGC.SUPGLYPH.${String(index).padStart(2, '0')}`,
      purpose,
      authority: 'observe_mint_audit_only',
      disposition: id === 'operator_prune_gate' ? 'blocks_delete_move_until_explicit_approval' : 'active_supervisor_language',
      truthStatus: truth.status,
      sha256: sha256Text(seed)
    };
  });
}

function buildMap(records, truth, generatedAt) {
  const byClass = {};
  const byLane = {};
  const byDisposition = {};
  for (const record of records) {
    byClass[record.className] = (byClass[record.className] || 0) + 1;
    byLane[record.lane] = (byLane[record.lane] || 0) + 1;
    byDisposition[record.disposition] = (byDisposition[record.disposition] || 0) + 1;
  }
  return {
    mapId: 'neurotech-real-agent-final-gc-map-map-mapped.v1',
    generatedAt,
    status: truth.status,
    doctrine: 'MAP MAP MAPPED',
    counts: {
      records: records.length,
      classes: byClass,
      dispositions: byDisposition
    },
    byLane,
    firstGlyph: records[0]?.glyph || null,
    lastGlyph: records[records.length - 1]?.glyph || null
  };
}

function buildIndex(records, evidence, truth, generatedAt) {
  return {
    indexId: 'neurotech-real-agent-final-gc-index.v1',
    generatedAt,
    status: truth.status,
    truthCounts: truth.counts,
    glyphs: records.map((record) => ({
      glyph: record.glyph,
      className: record.className,
      lane: record.lane,
      disposition: record.disposition,
      memoryToken: record.memoryToken,
      digest: record.crypto256.digest
    })),
    evidence: evidence.map((record) => ({
      path: record.path,
      bytes: record.bytes,
      disposition: record.disposition,
      sha256: record.sha256
    }))
  };
}

function buildMemory(records, truth, generatedAt) {
  const top = records
    .filter((record) => ['genius_farm', 'mistake_farm', 'supervisor_or_gap'].includes(record.className))
    .slice(0, 80)
    .map((record) => ({
      token: record.memoryToken,
      glyph: record.glyph,
      className: record.className,
      lane: record.lane,
      summary: record.summary
    }));

  return {
    memoryId: 'neurotech-real-agent-final-gc-memory.v1',
    generatedAt,
    status: truth.status,
    summary: truth.verdict,
    counts: truth.counts,
    retainedMemoryCount: top.length,
    retainedMemory: top
  };
}

function buildCrypto(records, evidence, generatedAt) {
  const recordDigests = records.map((record) => record.crypto256.digest);
  const evidenceDigests = evidence.map((record) => record.sha256);
  const chainSeed = [...recordDigests, ...evidenceDigests].join('\n');
  return {
    cryptoId: 'neurotech-real-agent-final-gc-crypto-256.v1',
    generatedAt,
    algorithm: 'sha256',
    recordCount: records.length,
    evidenceCount: evidence.length,
    recordsRoot: sha256Text(recordDigests.join('\n')),
    evidenceRoot: sha256Text(evidenceDigests.join('\n')),
    combinedRoot: sha256Text(chainSeed),
    chain: records.map((record, index) => ({
      index,
      glyph: record.glyph,
      digest: record.crypto256.digest
    }))
  };
}

function buildCube(records, cryptoPacket, truth, generatedAt, cubeId) {
  const cube = {
    id: cubeId,
    generatedAt,
    primaryCatalog: { D: 47, name: 'BOUNDARY', prime: 211 },
    touches: [6, 20, 35, 37, 38, 39, 42, 47],
    payload: {
      kind: 'neurotech-real-agent-final-gc-mint',
      status: truth.status,
      glyphCount: records.length,
      cryptoRoot: cryptoPacket.combinedRoot,
      strictFinalOnlyGcAlreadyDone: truth.strictFinalOnlyGcAlreadyDone,
      rawDeletionPerformed: false,
      backlog: {
        actualUngulpedFromRunner: truth.counts.real100bActualUngulpedFromRunner,
        selfReportedBacklogPackets: truth.counts.real100bSelfReportedBacklogPackets,
        backlogDeltaPackets: truth.counts.real100bBacklogDeltaPackets
      }
    },
    translate: {
      human: 'Real-agent farm artifacts were minted into BEHCS-256 final GC language; raw evidence is retained until approved prune.',
      agent: '(asolaria, neurotech, real_agents, final_gc, behcs_256, map, cube, index, memory, crypto)',
      device: 'node tools/neurotech-real-agent-final-gc-mint.js mint --execute'
    }
  };
  return `// cube: ${cubeId} | neurotech final GC | D47 BOUNDARY\nexport const CUBE = ${JSON.stringify(cube, null, 2)}\n`;
}

function buildHermes(truth, cryptoPacket, generatedAt) {
  return {
    integrationId: 'neurotech-real-agent-final-gc-hermes-dispatch',
    generatedAt,
    status: truth.status,
    mode: MODE,
    packet: {
      verb: 'EVT-HERMES-NEUROTECH-REAL-AGENT-FINAL-GC-MINT',
      summary: 'Real-agent farms were backfilled through MAP/CUBE/INDEX/MEMORY/CRYPTO BEHCS-256 final GC surfaces.',
      processedPackets: truth.counts.real100bRunnerProcessedPackets,
      lastGulpedPacket: truth.counts.real100bLastGulpedPacket,
      actualUngulpedFromRunner: truth.counts.real100bActualUngulpedFromRunner,
      cryptoRoot: cryptoPacket.combinedRoot,
      report: repoRel(PATHS.reportMd)
    }
  };
}

function buildShannon(truth, generatedAt) {
  const hasBacklog = truth.counts.real100bActualUngulpedFromRunner !== '0';
  return {
    integrationId: 'neurotech-real-agent-final-gc-shannon-consensus',
    generatedAt,
    status: hasBacklog ? 'consensus_backfill_needed_do_not_prune' : 'consensus_final_gc_mint_pass',
    consensus: hasBacklog ? 'PROCEED-MINT-BACKFILL-DO-NOT-PRUNE' : 'PROCEED-FINAL-GC-MINT',
    executionDisposition: 'no_delete_no_move_no_agent_launch_no_external_call',
    votes: [
      { part: 'truth', vote: hasBacklog ? 'MARK_GAP' : 'PASS', reason: truth.verdict },
      { part: 'evidence', vote: 'RETAIN_HASHED_EVIDENCE', reason: 'Source ledgers were hashed and dispositioned, not deleted.' },
      { part: 'language', vote: 'MINT_BEHCS_256', reason: 'Genius, mistake, evidence, and supervisor/gap classes fill 256 glyph slots.' },
      { part: 'gc', vote: hasBacklog ? 'BLOCK_STRICT_PRUNE' : 'ALLOW_OPERATOR_REVIEW', reason: 'Pruning requires explicit operator approval after hashes are sealed.' },
      { part: 'safety', vote: 'KEEP_NEURO_GATES', reason: 'No live EEG, human data, RU-view execution, external calls, or model execution occurred.' }
    ]
  };
}

function buildReport(context) {
  const { generatedAt, truth, evidence, supervisors, records, cryptoPacket, shannonPacket } = context;
  const evidenceRows = evidence.slice(0, 20).map((entry) =>
    `| ${entry.disposition} | ${entry.bytes} | \`${entry.sha256.slice(0, 16)}...\` | \`${entry.path}\` |`
  ).join('\n');
  const supervisorRows = supervisors.map((entry) =>
    `| ${entry.pid} | ${entry.id} | ${entry.disposition} | ${entry.purpose} |`
  ).join('\n');
  const glyphRows = records.slice(0, 24).map((entry) =>
    `| ${entry.glyph} | ${entry.className} | ${entry.lane} | ${entry.disposition} | ${entry.summary} |`
  ).join('\n');

  const json = {
    reportId: 'neurotech-real-agent-final-gc-mint-latest',
    generatedAt,
    status: truth.status,
    mode: MODE,
    truth,
    crypto: {
      combinedRoot: cryptoPacket.combinedRoot,
      recordsRoot: cryptoPacket.recordsRoot,
      evidenceRoot: cryptoPacket.evidenceRoot
    },
    counts: {
      glyphs: records.length,
      evidenceFiles: evidence.length,
      supervisors: supervisors.length
    },
    shannon: shannonPacket,
    outputs: {
      finalManifest: repoRel(PATHS.finalManifest),
      mintedLanguage: repoRel(PATHS.mintedLanguage),
      mapMapMapped: repoRel(PATHS.mapMapMapped),
      cubeCubed: repoRel(PATHS.cubeCubed),
      index: repoRel(PATHS.index),
      memory: repoRel(PATHS.memory),
      crypto: repoRel(PATHS.crypto),
      supervisors: repoRel(PATHS.supervisors)
    }
  };

  const md = `# Neurotech Real-Agent Final GC Mint

Generated: ${generatedAt}

Status: ${truth.status}

This pass did not delete, move, download, install, launch agents, call external models, access devices, capture live EEG, or collect human-subject data.

## Answer

- Strict final-only GC was not already complete.
- The farms and supervisors exist, and a non-destructive GC did run.
- Raw evidence ledgers were still present and are now hashed/dispositioned instead of silently removed.
- Runner processed packets: ${truth.counts.real100bRunnerProcessedPackets}
- Last gulp-confirmed packet: ${truth.counts.real100bLastGulpedPacket}
- Actual ungulped runner backlog: ${truth.counts.real100bActualUngulpedFromRunner}
- Self-reported backlog: ${truth.counts.real100bSelfReportedBacklogPackets}
- Backlog delta: ${truth.counts.real100bBacklogDeltaPackets}

## Mint

- BEHCS-256 glyph records: ${records.length}
- Supervisors: ${supervisors.length}
- Evidence files hashed: ${evidence.length}
- Crypto combined root: \`${cryptoPacket.combinedRoot}\`
- Shannon: ${shannonPacket.consensus}

## Top Glyphs

| Glyph | Class | Lane | Disposition | Summary |
| --- | --- | --- | --- | --- |
${glyphRows}

## Supervisors

| PID | Supervisor | Disposition | Purpose |
| --- | --- | --- | --- |
${supervisorRows}

## Largest Evidence Files

| Disposition | Bytes | SHA-256 | Path |
| --- | ---: | --- | --- |
${evidenceRows}
`;

  return { json, md };
}

function buildCsv(records) {
  const header = ['glyph', 'byte', 'hex', 'className', 'lane', 'sourcePid', 'disposition', 'memoryToken', 'digest', 'summary'];
  const rows = records.map((record) => [
    record.glyph,
    record.byte,
    record.hex,
    record.className,
    record.lane,
    record.sourcePid,
    record.disposition,
    record.memoryToken,
    record.crypto256.digest,
    record.summary
  ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n') + '\n';
}

function buildDispositionCsv(evidence) {
  const header = ['path', 'bytes', 'disposition', 'sha256'];
  const rows = evidence.map((entry) => [entry.path, entry.bytes, entry.disposition, entry.sha256]);
  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\n') + '\n';
}

function mint({ execute = false } = {}) {
  const generatedAt = new Date().toISOString();
  const truth = buildTruth(generatedAt);
  const evidence = buildEvidence();
  const farms = loadFarmItems();
  const supervisors = buildSupervisors(generatedAt, truth);
  const records = buildMintRecords(truth, farms, evidence, supervisors);
  const mapPacket = buildMap(records, truth, generatedAt);
  const indexPacket = buildIndex(records, evidence, truth, generatedAt);
  const memoryPacket = buildMemory(records, truth, generatedAt);
  const cryptoPacket = buildCrypto(records, evidence, generatedAt);
  const shannonPacket = buildShannon(truth, generatedAt);
  const hermesPacket = buildHermes(truth, cryptoPacket, generatedAt);
  const cube = buildCube(records, cryptoPacket, truth, generatedAt, 'neurotech-real-agent-final-gc-mint');
  const cubeCubed = buildCube(records, cryptoPacket, truth, generatedAt, 'neurotech-real-agent-final-gc-cube-cubed');
  const report = buildReport({ generatedAt, truth, evidence, supervisors, records, cryptoPacket, shannonPacket });
  const eventId = `neurotech-real-agent-final-gc-mint-${Date.now()}`;

  const finalManifest = {
    manifestId: 'neurotech-real-agent-final-gc-manifest.v1',
    generatedAt,
    status: truth.status,
    rule: 'No file delete or move was performed. Evidence may only be pruned after explicit operator approval and hash verification.',
    truth,
    evidence,
    finalKeep: evidence.filter((entry) => entry.disposition === 'final_keep').map((entry) => entry.path),
    evidenceRetainUntilOperatorPrune: evidence.filter((entry) => entry.disposition !== 'final_keep').map((entry) => entry.path),
    cryptoRoot: cryptoPacket.combinedRoot
  };

  if (execute) {
    writeJson(PATHS.finalManifest, finalManifest);
    writeText(PATHS.finalDispositionCsv, buildDispositionCsv(evidence));
    writeJson(PATHS.mintedLanguage, {
      languageId: 'neurotech-real-agent-final-gc-behcs256.v1',
      generatedAt,
      status: truth.status,
      glyphCount: records.length,
      records
    });
    writeText(PATHS.mintedLanguageCsv, buildCsv(records));
    writeJson(PATHS.mapMapMapped, mapPacket);
    writeText(PATHS.cubeCubed, cubeCubed);
    writeJson(PATHS.index, indexPacket);
    writeJson(PATHS.memory, memoryPacket);
    writeJson(PATHS.crypto, cryptoPacket);
    writeJson(PATHS.supervisors, {
      supervisorSetId: 'neurotech-real-agent-final-gc-supervisors.v1',
      generatedAt,
      status: truth.status,
      supervisors
    });
    writeJson(PATHS.hermes, hermesPacket);
    writeJson(PATHS.shannon, shannonPacket);
    writeJson(PATHS.state, {
      savedAt: generatedAt,
      status: truth.status,
      mode: MODE,
      glyphCount: records.length,
      cryptoRoot: cryptoPacket.combinedRoot,
      report: repoRel(PATHS.reportMd)
    });
    writeText(PATHS.cube, cube);
    writeJson(PATHS.reportJson, report.json);
    writeText(PATHS.reportMd, report.md);
    appendNdjson(PATHS.inbox, {
      id: eventId,
      ts: generatedAt,
      from: 'asolaria',
      to: 'neurotech-final-gc',
      verb: 'EVT-NEUROTECH-REAL-AGENT-FINAL-GC-MINT',
      body: { status: truth.status, glyphCount: records.length, report: repoRel(PATHS.reportMd) }
    });
    appendNdjson(PATHS.outbox, {
      id: `${eventId}-hermes`,
      ts: generatedAt,
      from: 'hermes',
      to: 'neurotech-final-gc',
      verb: hermesPacket.packet.verb,
      body: hermesPacket
    });
    for (const record of records) {
      appendNdjson(PATHS.gnnEdges, {
        id: `${eventId}-${record.glyph}`,
        ts: generatedAt,
        from: record.glyph,
        to: record.className,
        verb: 'final_gc_minted_behcs256',
        weight: record.className === 'supervisor_or_gap' && record.disposition.startsWith('gap') ? 0.9 : 0.4
      });
    }
  }

  return {
    ok: true,
    action: execute ? 'mint' : 'preview',
    generatedAt,
    status: truth.status,
    glyphCount: records.length,
    supervisors: supervisors.length,
    evidenceFiles: evidence.length,
    cryptoRoot: cryptoPacket.combinedRoot,
    strictFinalOnlyGcAlreadyDone: truth.strictFinalOnlyGcAlreadyDone,
    rawDeletionPerformed: false,
    counts: truth.counts,
    lineCounts: {
      gulpLedger: countLines(rel('data/neurotech-defense-lab/real-agents/100b-run/self-improvement/gulp-2000-mints-ledger.ndjson')),
      gulpLatest: countLines(rel('data/neurotech-defense-lab/real-agents/100b-run/self-improvement/gulp-2000-mints-latest.ndjson')),
      compactShards: countLines(rel('data/neurotech-defense-lab/real-agents/100b-run/self-improvement/gulp-compact-shards.ndjson'))
    },
    shannon: {
      status: shannonPacket.status,
      consensus: shannonPacket.consensus
    },
    outputs: {
      finalManifest: repoRel(PATHS.finalManifest),
      mintedLanguage: repoRel(PATHS.mintedLanguage),
      mintedLanguageCsv: repoRel(PATHS.mintedLanguageCsv),
      mapMapMapped: repoRel(PATHS.mapMapMapped),
      cubeCubed: repoRel(PATHS.cubeCubed),
      index: repoRel(PATHS.index),
      memory: repoRel(PATHS.memory),
      crypto: repoRel(PATHS.crypto),
      supervisors: repoRel(PATHS.supervisors),
      reportJson: repoRel(PATHS.reportJson),
      reportMd: repoRel(PATHS.reportMd)
    },
    mode: MODE
  };
}

function main(argv) {
  const action = argv[2] || 'status';
  const execute = argv.includes('--execute');
  if (action === 'status') {
    console.log(JSON.stringify(mint({ execute: false }), null, 2));
    return;
  }
  if (action === 'mint') {
    console.log(JSON.stringify(mint({ execute }), null, 2));
    return;
  }
  console.error(JSON.stringify({
    ok: false,
    error: `Unknown action: ${action}`,
    usage: [
      'node tools/neurotech-real-agent-final-gc-mint.js status',
      'node tools/neurotech-real-agent-final-gc-mint.js mint --execute'
    ]
  }, null, 2));
  process.exitCode = 2;
}

main(process.argv);
