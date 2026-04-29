#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const behcs = require('./behcs/codex-bridge');

const repoRoot = path.resolve(__dirname, '..');

const MODE = Object.freeze({
  backend: 'local_filesystem_free_backend',
  cli: 'bare_node_cli',
  headless: true,
  shelllessRuntime: true,
  noServerAuth: true,
  noServerApiRoute: true,
  noExternalApiCalls: true,
  noAgentLaunch: true,
  noDownloads: true,
  noInstall: true,
  noDeviceAccess: true,
  nonDestructiveGc: true,
  sourceEvidencePreserved: true,
  childProcessUse: false,
  secretMaterialWritten: false
});

const PATHS = Object.freeze({
  synthesis: rel('data/neurotech-defense-lab/omnispindle/opencode-response-synthesis-100.latest.json'),
  gnn: rel('data/neurotech-defense-lab/omnispindle/gnn-forward-reverse-gain-latest.json'),
  gemCsv: rel('data/neurotech-defense-lab/omnispindle/collections/genius-gems-latest.csv'),
  gemNdjson: rel('data/neurotech-defense-lab/omnispindle/collections/genius-gems-latest.ndjson'),
  mistakeCsv: rel('data/neurotech-defense-lab/omnispindle/collections/mistake-ledger-latest.csv'),
  mistakeNdjson: rel('data/neurotech-defense-lab/omnispindle/collections/mistake-ledger-latest.ndjson'),
  hookwall: rel('data/neurotech-defense-lab/omnispindle/collections/hookwall-events-latest.ndjson'),
  omnishannon: rel('data/neurotech-defense-lab/omnispindle/collections/omnishannon-consensus-latest.json'),
  gcManifest: rel('data/neurotech-defense-lab/omnispindle/gc/gem-farm-gc-latest.json'),
  trashCompacted: rel('data/neurotech-defense-lab/omnispindle/gc/trash-compacted-latest.ndjson'),
  state: rel('data/behcs/state/neurotech-defense/neurotech-message-gem-gc-pipeline.state.json'),
  hermes: rel('data/behcs/hermes/neurotech-defense/neurotech-message-gem-gc-pipeline-dispatch-latest.json'),
  shannon: rel('data/behcs/shannon/neurotech-defense/neurotech-message-gem-gc-pipeline-consensus-latest.json'),
  cube: rel('data/behcs/cubes/neurotech-message-gem-gc-pipeline.cube.js'),
  reportJson: rel('reports/neurotech-message-gem-gc-pipeline-latest.json'),
  reportMd: rel('reports/neurotech-message-gem-gc-pipeline-latest.md'),
  inbox: rel('data/behcs/inbox.ndjson'),
  outbox: rel('data/behcs/outbox.ndjson'),
  gnnEdges: rel('data/behcs/gnn-live-edges.ndjson')
});

const SUBJECT_RULES = [
  subjectRule('consent', ['consent', 'attestation', 'scope', 'household', 'revocation', 'delete']),
  subjectRule('pid_identity', ['pid', 'identity', 'alias', 'session bus']),
  subjectRule('claim_guard', ['claim', 'mind reading', 'covert', 'deception', 'diagnosis', 'coercion', 'brain frying']),
  subjectRule('signal_quality', ['signal', 'quality', 'electrode', 'noise', 'artifact', 'blink', 'feedback']),
  subjectRule('storage_guard', ['git', 'raw', 'storage', 'c:', 'reserve', 'dataset', 'model store', 'cloud']),
  subjectRule('model_validation', ['model', 'baseline', 'deep', 'calibration', 'uncertainty', 'card']),
  subjectRule('connector_piping', ['connector', 'pipe', 'lsl', 'event spine', 'brainflow', 'bids', 'manifest']),
  subjectRule('opencode_runtime', ['opencode', 'banner', 'header', 'token', 'runtime']),
  subjectRule('release_governance', ['release', 'outsider', 'wall', 'governance'])
];

const SUBJECT_DIMENSIONS = Object.freeze({
  consent: ['D24_INTENT', 'D37_AUTHORITY', 'D47_BOUNDARY', 'D59+_HUMAN_CONSENT'],
  pid_identity: ['D7_STATE', 'D39_MEMORY', 'D47_BOUNDARY', 'D59+_HUMAN_PID'],
  claim_guard: ['D37_AUTHORITY', 'D47_BOUNDARY', 'D59+_CLAIM_SAFETY'],
  signal_quality: ['D35_PROOF', 'D39_MEMORY', 'D59+_SIGNAL_QUALITY'],
  storage_guard: ['D39_MEMORY', 'D47_BOUNDARY', 'D59+_STORAGE_POLICY'],
  model_validation: ['D35_PROOF', 'D37_AUTHORITY', 'D59+_MODEL_VALIDATION'],
  connector_piping: ['D20_CONNECTION', 'D42_ORCHESTRATION', 'D59+_PIPELINE'],
  opencode_runtime: ['D7_STATE', 'D42_ORCHESTRATION', 'D59+_PID_ONLY_RUNTIME'],
  release_governance: ['D37_AUTHORITY', 'D47_BOUNDARY', 'D59+_RELEASE_GOVERNANCE'],
  neurotech: ['D42_ORCHESTRATION', 'D59+_NEUROTECH_SUBJECT_MATTER']
});

const CSV_FIELDS = [
  'kind',
  'id',
  'glyph',
  'behcsHilbert',
  'itemHash',
  'score',
  'reverseGain',
  'class',
  'hits',
  'sourceSupport',
  'duplicateCount',
  'laneCount',
  'lanes',
  'subjectMatter',
  'dimensions',
  'pidScope',
  'controllerPidCount',
  'controllerPidSample',
  'backendPidSample',
  'hookwallStatus',
  'omnishannonStatus',
  'gcDisposition',
  'summary'
];

function rel(p) {
  return path.join(repoRoot, p);
}

function repoRel(p) {
  return path.relative(repoRoot, p).replace(/\\/g, '/');
}

function subjectRule(subject, keywords) {
  return { subject, keywords };
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

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function sorted(values) {
  return unique(values).sort((a, b) => String(a).localeCompare(String(b)));
}

function round3(value) {
  return Math.round(Number(value || 0) * 1000) / 1000;
}

function csvEscape(value) {
  const text = value == null ? '' : String(Array.isArray(value) ? value.join('|') : value);
  if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function toCsv(rows, fields) {
  return [
    fields.join(','),
    ...rows.map((row) => fields.map((field) => csvEscape(row[field])).join(','))
  ].join('\n') + '\n';
}

function toNdjson(rows) {
  return rows.map((row) => JSON.stringify(row)).join('\n') + (rows.length ? '\n' : '');
}

function makeGlyph(kind, id, summary) {
  const hash = sha256Text(`${kind}:${id}:${summary}`);
  return `HG256:${kind.toUpperCase()}:${hash.slice(0, 8).toUpperCase()}:${behcs.hilbertAddress(hash)}`;
}

function inferSubjects(item) {
  const haystack = `${item.id || ''} ${item.summary || ''} ${(item.lanes || []).join(' ')}`.toLowerCase();
  const subjects = [];
  for (const rule of SUBJECT_RULES) {
    if (rule.keywords.some((keyword) => haystack.includes(keyword))) {
      subjects.push(rule.subject);
    }
  }
  subjects.push('neurotech');
  return sorted(subjects);
}

function inferDimensions(subjects) {
  const dims = [];
  for (const subject of subjects) {
    dims.push(...(SUBJECT_DIMENSIONS[subject] || []));
  }
  return sorted(dims);
}

function pidScopeFor(item, subjects) {
  if (subjects.includes('pid_identity')) return 'pid_specific_and_subject_matter';
  if ((item.lanes || []).includes('consent') || subjects.includes('consent')) return 'household_pid_specific';
  if (subjects.includes('claim_guard') || subjects.includes('release_governance')) return 'global_household_policy';
  return 'subject_matter';
}

function buildResponseIndex(responses) {
  const index = { idea: new Map(), risk: new Map() };

  function touch(kind, item, response) {
    const map = kind === 'idea' ? index.idea : index.risk;
    if (!map.has(item.id)) {
      map.set(item.id, {
        id: item.id,
        summaries: new Set(),
        lanes: new Set(),
        controllerPids: new Set(),
        backendPidRanges: [],
        responseIds: [],
        connectors: new Set(),
        models: new Set(),
        pipes: new Set()
      });
    }
    const entry = map.get(item.id);
    entry.summaries.add(item.summary);
    entry.lanes.add(response.lane);
    entry.controllerPids.add(response.controllerPid);
    entry.responseIds.push(response.responseId);
    if (response.backendRange) {
      entry.backendPidRanges.push(`${response.backendRange.firstPid}..${response.backendRange.lastPid}`);
    }
    for (const connector of response.connectors || []) entry.connectors.add(connector);
    for (const model of response.models || []) entry.models.add(model);
    for (const pipe of response.pipes || []) entry.pipes.add(pipe);
  }

  for (const response of responses || []) {
    for (const idea of response.ideas || []) touch('idea', idea, response);
    for (const risk of response.risks || []) touch('risk', risk, response);
  }

  return index;
}

function mapGnnById(items) {
  const map = new Map();
  for (const item of items || []) {
    if (item && item.id && !map.has(item.id)) map.set(item.id, item);
  }
  return map;
}

function normalizeCollections(synthesis, gnn) {
  const responses = Array.isArray(synthesis.responses) ? synthesis.responses : [];
  const responseIndex = buildResponseIndex(responses);
  const topIdeaMap = mapGnnById([
    ...(gnn.forward?.topIdeas || []),
    ...(gnn.forward?.geniusIdeas || [])
  ]);
  const topMistakeMap = mapGnnById([
    ...(gnn.reverseGain?.topMistakes || []),
    ...(gnn.reverseGain?.criticalMistakes || [])
  ]);

  const ideas = normalizeKind({
    kind: 'genius',
    sourceMap: responseIndex.idea,
    gnnMap: topIdeaMap
  });
  const mistakes = normalizeKind({
    kind: 'mistake',
    sourceMap: responseIndex.risk,
    gnnMap: topMistakeMap
  });

  return { ideas, mistakes };
}

function normalizeKind({ kind, sourceMap, gnnMap }) {
  const ids = sorted([...sourceMap.keys(), ...gnnMap.keys()]);
  return ids.map((id, rank) => {
    const source = sourceMap.get(id) || {};
    const gnnItem = gnnMap.get(id) || {};
    const lanes = sorted([...(gnnItem.lanes || []), ...(source.lanes || [])]);
    const summary = gnnItem.summary || [...(source.summaries || [])][0] || '';
    const support = source.responseIds?.length || 0;
    const score = kind === 'genius'
      ? round3(gnnItem.score ?? Math.min(0.99, 0.62 + support / 100))
      : '';
    const reverseGain = kind === 'mistake'
      ? round3(gnnItem.reverseGain ?? Math.min(0.99, 0.55 + support / 120))
      : '';
    const subjects = inferSubjects({ id, summary, lanes });
    const dimensions = inferDimensions(subjects);
    const hash = sha256Text(JSON.stringify({ kind, id, summary, lanes, support }));
    const hookwallStatus = hookwall(kind, { id, summary, score, reverseGain, subjects });
    const omnishannonStatus = omnishannon(kind, { score, reverseGain, hookwallStatus });
    const gcDisposition = gcDispositionFor(kind, { score, reverseGain, support, hookwallStatus });
    const controllerPids = sorted([...(source.controllerPids || [])]);
    const backendPids = unique(source.backendPidRanges || []);

    return {
      kind,
      id,
      glyph: makeGlyph(kind, id, summary),
      behcsHilbert: behcs.hilbertAddress(`${kind}:${id}:${hash}`),
      itemHash: hash,
      score,
      reverseGain,
      class: gnnItem.class || `${kind}_candidate_from_controller_messages`,
      hits: gnnItem.hits || support,
      sourceSupport: support,
      duplicateCount: Math.max(0, support - 1),
      laneCount: lanes.length,
      lanes,
      subjectMatter: subjects,
      dimensions,
      pidScope: pidScopeFor({ lanes }, subjects),
      controllerPidCount: controllerPids.length,
      controllerPidSample: controllerPids.slice(0, 12),
      backendPidSample: backendPids.slice(0, 5),
      sourceResponseIds: unique(source.responseIds || []).slice(0, 40),
      connectors: sorted([...(source.connectors || [])]),
      models: sorted([...(source.models || [])]),
      pipes: sorted([...(source.pipes || [])]),
      hookwallStatus,
      omnishannonStatus,
      gcDisposition,
      rank: rank + 1,
      summary
    };
  }).sort((a, b) => {
    const av = a.kind === 'genius' ? Number(a.score || 0) : Number(a.reverseGain || 0);
    const bv = b.kind === 'genius' ? Number(b.score || 0) : Number(b.reverseGain || 0);
    return bv - av || b.sourceSupport - a.sourceSupport || a.id.localeCompare(b.id);
  });
}

function hookwall(kind, item) {
  if (kind === 'mistake') {
    if (Number(item.reverseGain || 0) >= 0.8) return 'BLOCK_AND_QUARANTINE_PATTERN';
    if (Number(item.reverseGain || 0) >= 0.68) return 'WARN_AND_LEDGER_PATTERN';
    return 'WATCH_AND_COMPACT_PATTERN';
  }

  const text = `${item.id} ${item.summary}`.toLowerCase();
  if (/literal mind reading|deception|diagnosis|coercion|brain frying/.test(text)
      && !/quarantine|guard|blocked|safe language/.test(text)) {
    return 'WARN_CLAIM_GUARD_REQUIRED';
  }
  if (Number(item.score || 0) >= 0.88) return 'ALLOW_FARM_HIGH_VALUE_GEM';
  return 'ALLOW_FARM_WATCH_GEM';
}

function omnishannon(kind, item) {
  if (kind === 'mistake') {
    if (item.hookwallStatus.startsWith('BLOCK')) return 'CONSENSUS_PRESERVE_CRITICAL_MISTAKE_GLYPH';
    if (item.hookwallStatus.startsWith('WARN')) return 'CONSENSUS_LEDGER_MISTAKE_GLYPH';
    return 'CONSENSUS_WATCH_MISTAKE_GLYPH';
  }
  if (item.hookwallStatus.startsWith('WARN')) return 'CONSENSUS_FARM_WITH_CLAIM_GUARD';
  if (Number(item.score || 0) >= 0.88) return 'CONSENSUS_FARM_GENIUS_GEM';
  return 'CONSENSUS_KEEP_GEM_WATCH';
}

function gcDispositionFor(kind, item) {
  if (kind === 'mistake') {
    if (item.hookwallStatus.startsWith('BLOCK')) return 'quarantine_pattern_preserve_evidence';
    if (item.hookwallStatus.startsWith('WARN')) return 'ledger_pattern_preserve_evidence';
    return 'watch_pattern_compact_duplicates';
  }
  if (Number(item.score || 0) >= 0.88) return 'farm_gem_preserve_sources';
  return 'keep_watch_compact_duplicates';
}

function buildHookwallEvents(ideas, mistakes, generatedAt) {
  return [...ideas, ...mistakes].map((item) => ({
    eventId: `hookwall-${item.kind}-${item.id}`,
    generatedAt,
    itemId: item.id,
    kind: item.kind,
    glyph: item.glyph,
    status: item.hookwallStatus,
    pidScope: item.pidScope,
    controllerPidCount: item.controllerPidCount,
    subjectMatter: item.subjectMatter,
    dimensions: item.dimensions,
    gcDisposition: item.gcDisposition
  }));
}

function buildOmnishannon(ideas, mistakes, generatedAt) {
  const farmedGems = ideas.filter((item) => item.gcDisposition.startsWith('farm_gem')).length;
  const criticalMistakes = mistakes.filter((item) => item.gcDisposition.startsWith('quarantine')).length;
  const duplicateMessages = [...ideas, ...mistakes].reduce((sum, item) => sum + item.duplicateCount, 0);
  return {
    consensusId: 'omnishannon-neurotech-message-gem-gc-latest',
    generatedAt,
    status: 'OMNISHANNON_COLLECTION_READY',
    consensus: 'COLLECT_GLYPH_FARM_GEMS_LEDGER_MISTAKES_GC_COMPACT_ONLY',
    executionDisposition: 'no_agent_launch_no_delete_no_download_no_device',
    counts: {
      geniusItems: ideas.length,
      mistakeItems: mistakes.length,
      farmedGems,
      criticalMistakes,
      duplicateMessagesCompacted: duplicateMessages
    },
    votes: [
      { part: 'hookwall', vote: 'ALLOW_COLLECTION_WITH_GATES', reason: 'Each gem and mistake has a hookwall status and glyph.' },
      { part: 'gnn_forward', vote: 'FARM_GEMS', reason: `${ideas.length} unique idea candidates were extracted from controller messages and GNN rankings.` },
      { part: 'reverse_gain_gnn', vote: 'LEDGER_MISTAKES', reason: `${mistakes.length} mistake candidates were extracted and ranked by reverse gain.` },
      { part: 'gc', vote: 'COMPACT_DUPLICATES_ONLY', reason: `${duplicateMessages} duplicate source mentions are summarized without deleting source evidence.` },
      { part: 'authority', vote: 'KEEP_LIVE_GATE_CLOSED', reason: 'No live device, human data, downloads, installs, or model execution are part of this tranche.' }
    ]
  };
}

function buildGcManifest(ideas, mistakes, omnishannonPacket, generatedAt) {
  const items = [...ideas, ...mistakes];
  return {
    gcId: 'neurotech-message-gem-gc-latest',
    generatedAt,
    status: 'GC_COMPACTION_READY',
    mode: MODE,
    rule: 'Garbage collection is non-destructive reference compaction. Source synthesis and GNN files are preserved.',
    sourceEvidence: [repoRel(PATHS.synthesis), repoRel(PATHS.gnn)],
    collections: {
      geniusCsv: repoRel(PATHS.gemCsv),
      geniusNdjson: repoRel(PATHS.gemNdjson),
      mistakeCsv: repoRel(PATHS.mistakeCsv),
      mistakeNdjson: repoRel(PATHS.mistakeNdjson),
      hookwall: repoRel(PATHS.hookwall),
      omnishannon: repoRel(PATHS.omnishannon),
      trashCompacted: repoRel(PATHS.trashCompacted)
    },
    counts: omnishannonPacket.counts,
    compactedDuplicatePointers: items
      .filter((item) => item.duplicateCount > 0)
      .map((item) => ({
        id: item.id,
        kind: item.kind,
        glyph: item.glyph,
        duplicateCount: item.duplicateCount,
        retainedRecordHash: item.itemHash,
        sourceResponseIds: item.sourceResponseIds
      }))
  };
}

function buildHermes(omnishannonPacket, generatedAt) {
  return {
    integrationId: 'neurotech-message-gem-gc-hermes-dispatch',
    generatedAt,
    status: 'COLLECTION_DISPATCH_READY',
    mode: MODE,
    packet: {
      verb: 'EVT-HERMES-NEUROTECH-MESSAGE-GEM-GC',
      summary: 'Omnispindle messages extracted into glyphed genius-gem and mistake-ledger collections with non-destructive GC compaction.',
      counts: omnishannonPacket.counts,
      reports: {
        report: repoRel(PATHS.reportMd),
        gems: repoRel(PATHS.gemCsv),
        mistakes: repoRel(PATHS.mistakeCsv),
        gc: repoRel(PATHS.gcManifest)
      }
    }
  };
}

function buildShannon(omnishannonPacket, generatedAt) {
  return {
    integrationId: 'neurotech-message-gem-gc-shannon-consensus',
    generatedAt,
    status: 'consensus_collection_gc_compact_only',
    consensus: omnishannonPacket.consensus,
    executionDisposition: omnishannonPacket.executionDisposition,
    votes: omnishannonPacket.votes
  };
}

function buildCube(omnishannonPacket, generatedAt) {
  const cube = {
    id: 'neurotech-message-gem-gc-pipeline',
    generatedAt,
    primaryCatalog: { D: 42, name: 'ORCHESTRATION', prime: 181 },
    touches: [7, 20, 35, 37, 39, 42, 47, 59],
    gates: ['hookwall', 'omnishannon', 'gnn_forward', 'reverse_gain_gnn', 'non_destructive_gc'],
    payload: {
      kind: 'neurotech-message-gem-gc',
      status: omnishannonPacket.status,
      mode: MODE,
      counts: omnishannonPacket.counts,
      consensus: omnishannonPacket.consensus
    },
    translate: {
      human: 'Glyphed gems and mistakes are collected; duplicate source chatter is compacted without deleting evidence.',
      agent: '(asolaria, neurotech, omnispindle, hookwall, omnishannon, gnn, reverse_gain, gc_compact)',
      device: 'node tools/neurotech-message-gem-gc-pipeline.js collect --execute'
    }
  };
  return `// cube: neurotech-message-gem-gc-pipeline | neurotech | D42 ORCHESTRATION\nexport const CUBE = ${JSON.stringify(cube, null, 2)}\n`;
}

function buildReport(ideas, mistakes, omnishannonPacket, gcManifest, generatedAt) {
  const topGems = ideas.slice(0, 8).map((item) =>
    `| ${item.id} | ${item.score} | ${item.sourceSupport} | ${item.subjectMatter.join(' ')} | ${item.gcDisposition} |`
  ).join('\n');
  const topMistakes = mistakes.slice(0, 8).map((item) =>
    `| ${item.id} | ${item.reverseGain} | ${item.sourceSupport} | ${item.subjectMatter.join(' ')} | ${item.gcDisposition} |`
  ).join('\n');

  const json = {
    reportId: 'neurotech-message-gem-gc-pipeline-latest',
    generatedAt,
    status: omnishannonPacket.status,
    mode: MODE,
    counts: omnishannonPacket.counts,
    outputs: {
      geniusCsv: repoRel(PATHS.gemCsv),
      geniusNdjson: repoRel(PATHS.gemNdjson),
      mistakeCsv: repoRel(PATHS.mistakeCsv),
      mistakeNdjson: repoRel(PATHS.mistakeNdjson),
      hookwall: repoRel(PATHS.hookwall),
      omnishannon: repoRel(PATHS.omnishannon),
      gcManifest: repoRel(PATHS.gcManifest),
      trashCompacted: repoRel(PATHS.trashCompacted)
    },
    omnishannon: omnishannonPacket,
    gc: gcManifest
  };

  const md = `# Neurotech Message Gem GC Pipeline

Generated: ${generatedAt}

Status: ${omnishannonPacket.status}

Collected omnispindle controller messages through hookwall, GNN forward ranking, reverse-gain GNN, omnishannon consensus, and non-destructive garbage collection. Source synthesis and GNN evidence were preserved; only duplicate source chatter was compacted into pointers.

## Counts

- Genius items: ${omnishannonPacket.counts.geniusItems}
- Mistake items: ${omnishannonPacket.counts.mistakeItems}
- Farmed gems: ${omnishannonPacket.counts.farmedGems}
- Critical mistake patterns: ${omnishannonPacket.counts.criticalMistakes}
- Duplicate source messages compacted: ${omnishannonPacket.counts.duplicateMessagesCompacted}

## Outputs

- Gems CSV: \`${repoRel(PATHS.gemCsv)}\`
- Gems NDJSON: \`${repoRel(PATHS.gemNdjson)}\`
- Mistakes CSV: \`${repoRel(PATHS.mistakeCsv)}\`
- Mistakes NDJSON: \`${repoRel(PATHS.mistakeNdjson)}\`
- Hookwall events: \`${repoRel(PATHS.hookwall)}\`
- Omnishannon: \`${repoRel(PATHS.omnishannon)}\`
- GC manifest: \`${repoRel(PATHS.gcManifest)}\`
- Compacted trash pointers: \`${repoRel(PATHS.trashCompacted)}\`

## Top Gems

| Gem | Score | Support | Subjects | GC |
| --- | ---: | ---: | --- | --- |
${topGems}

## Top Mistakes

| Mistake | Reverse gain | Support | Subjects | GC |
| --- | ---: | ---: | --- | --- |
${topMistakes}

## Safety

This tranche launched no agents, made no downloads, installed nothing, accessed no devices, collected no human data, and deleted no source evidence.
`;

  return { json, md };
}

function collect({ execute = false } = {}) {
  const generatedAt = new Date().toISOString();
  const synthesis = readJson(PATHS.synthesis, { responses: [] });
  const gnn = readJson(PATHS.gnn, { forward: {}, reverseGain: {} });
  const { ideas, mistakes } = normalizeCollections(synthesis, gnn);
  const hookwallEvents = buildHookwallEvents(ideas, mistakes, generatedAt);
  const omnishannonPacket = buildOmnishannon(ideas, mistakes, generatedAt);
  const gcManifest = buildGcManifest(ideas, mistakes, omnishannonPacket, generatedAt);
  const hermesPacket = buildHermes(omnishannonPacket, generatedAt);
  const shannonPacket = buildShannon(omnishannonPacket, generatedAt);
  const cube = buildCube(omnishannonPacket, generatedAt);
  const report = buildReport(ideas, mistakes, omnishannonPacket, gcManifest, generatedAt);
  const eventId = `neurotech-message-gem-gc-${Date.now()}`;

  if (execute) {
    writeText(PATHS.gemCsv, toCsv(ideas, CSV_FIELDS));
    writeText(PATHS.gemNdjson, toNdjson(ideas));
    writeText(PATHS.mistakeCsv, toCsv(mistakes, CSV_FIELDS));
    writeText(PATHS.mistakeNdjson, toNdjson(mistakes));
    writeText(PATHS.hookwall, toNdjson(hookwallEvents));
    writeJson(PATHS.omnishannon, omnishannonPacket);
    writeJson(PATHS.gcManifest, gcManifest);
    writeText(PATHS.trashCompacted, toNdjson(gcManifest.compactedDuplicatePointers));
    writeJson(PATHS.state, {
      savedAt: generatedAt,
      status: omnishannonPacket.status,
      mode: MODE,
      counts: omnishannonPacket.counts,
      report: repoRel(PATHS.reportMd)
    });
    writeJson(PATHS.hermes, hermesPacket);
    writeJson(PATHS.shannon, shannonPacket);
    writeText(PATHS.cube, cube);
    writeJson(PATHS.reportJson, report.json);
    writeText(PATHS.reportMd, report.md);
    appendNdjson(PATHS.inbox, {
      id: eventId,
      ts: generatedAt,
      from: 'asolaria',
      to: 'neurotech-message-gem-gc',
      verb: 'EVT-NEUROTECH-MESSAGE-GEM-GC',
      body: { status: omnishannonPacket.status, counts: omnishannonPacket.counts, report: repoRel(PATHS.reportMd) }
    });
    appendNdjson(PATHS.outbox, {
      id: `${eventId}-hermes`,
      ts: generatedAt,
      from: 'hermes',
      to: 'neurotech-message-gem-gc',
      verb: hermesPacket.packet.verb,
      body: hermesPacket
    });
    appendNdjson(PATHS.gnnEdges, {
      id: `${eventId}-edge-gems`,
      ts: generatedAt,
      from: 'gnn_forward',
      to: 'genius_gem_farm',
      verb: 'glyphed_gems_collected',
      weight: 0.88
    });
    appendNdjson(PATHS.gnnEdges, {
      id: `${eventId}-edge-mistakes`,
      ts: generatedAt,
      from: 'reverse_gain_gnn',
      to: 'mistake_ledger',
      verb: 'glyphed_mistakes_collected',
      weight: 0.9
    });
  }

  return {
    ok: true,
    action: execute ? 'collect' : 'preview',
    generatedAt,
    status: omnishannonPacket.status,
    counts: omnishannonPacket.counts,
    topGems: ideas.slice(0, 5).map((item) => ({ id: item.id, score: item.score, glyph: item.glyph })),
    topMistakes: mistakes.slice(0, 5).map((item) => ({ id: item.id, reverseGain: item.reverseGain, glyph: item.glyph })),
    outputs: {
      geniusCsv: repoRel(PATHS.gemCsv),
      geniusNdjson: repoRel(PATHS.gemNdjson),
      mistakeCsv: repoRel(PATHS.mistakeCsv),
      mistakeNdjson: repoRel(PATHS.mistakeNdjson),
      hookwall: repoRel(PATHS.hookwall),
      omnishannon: repoRel(PATHS.omnishannon),
      gcManifest: repoRel(PATHS.gcManifest),
      trashCompacted: repoRel(PATHS.trashCompacted),
      reportJson: repoRel(PATHS.reportJson),
      reportMd: repoRel(PATHS.reportMd),
      cube: repoRel(PATHS.cube)
    },
    mode: MODE
  };
}

function main(argv) {
  const action = argv[2] || 'status';
  const execute = argv.includes('--execute');
  if (action === 'status') {
    console.log(JSON.stringify(collect({ execute: false }), null, 2));
    return;
  }
  if (action === 'collect') {
    console.log(JSON.stringify(collect({ execute }), null, 2));
    return;
  }
  console.error(JSON.stringify({
    ok: false,
    error: `Unknown action: ${action}`,
    usage: [
      'node tools/neurotech-message-gem-gc-pipeline.js status',
      'node tools/neurotech-message-gem-gc-pipeline.js collect --execute'
    ]
  }, null, 2));
  process.exitCode = 2;
}

main(process.argv);
