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
  noDownloads: true,
  noInstall: true,
  noDeviceAccess: true,
  noLiveRecording: true,
  noHumanSubjectData: true,
  brownHilbertLanguageMint: true,
  compactVirtualNamespace: true,
  noMassFileGeneration: true,
  householdSlotsAssigned: true,
  remainingSlotsUntaken: true,
  noMedicalClaims: true,
  noMindReadingClaims: true,
  childProcessUse: false,
  secretMaterialWritten: false
});

const HUMAN_PID_COUNT = 10000000000;
const HUMAN_PID_LAST_SLOT = HUMAN_PID_COUNT - 1;

const ASSIGNMENTS = [
  assignment(1, 'jesse_brown', 'Jesse Brown'),
  assignment(2, 'rayssa_chiqueto', 'Rayssa Chiqueto'),
  assignment(3, 'felipe', 'Felipe'),
  assignment(4, 'dan', 'Dan'),
  assignment(5, 'amy', 'Amy')
];

const BH_DIMS = Object.freeze([
  { id: 7, name: 'STATE', prime: 17, role: 'pid_slot_state' },
  { id: 24, name: 'INTENT', prime: 89, role: 'consent_intent' },
  { id: 37, name: 'AUTHORITY', prime: 157, role: 'authority_gate' },
  { id: 39, name: 'MEMORY', prime: 167, role: 'session_memory' },
  { id: 47, name: 'BOUNDARY', prime: 211, role: 'household_boundary' }
]);

const PATHS = Object.freeze({
  priorPidMap: rel('data/neurotech-defense-lab/identity/household-pid-map.current.v1.json'),
  bhSpace: rel('data/neurotech-defense-lab/identity/brown-hilbert-human-pid-space.v1.json'),
  bhMapJson: rel('data/neurotech-defense-lab/identity/brown-hilbert-household-pid-map.current.v1.json'),
  bhMapMd: rel('data/neurotech-defense-lab/identity/brown-hilbert-household-pid-map.current.v1.md'),
  language: rel('data/behcs/codex/glyph-language/brown-hilbert-human-pid-language.v1.json'),
  grammar: rel('ix/grammar/brown-hilbert-human-pid.grammar.v1.json'),
  state: rel('data/behcs/state/neurotech-defense/brown-hilbert-human-pid-mint.state.json'),
  hermes: rel('data/behcs/hermes/neurotech-defense/brown-hilbert-human-pid-mint-dispatch-latest.json'),
  shannon: rel('data/behcs/shannon/neurotech-defense/brown-hilbert-human-pid-mint-consensus-latest.json'),
  cube: rel('data/behcs/cubes/brown-hilbert-human-pid-mint.cube.js'),
  reportJson: rel('reports/brown-hilbert-human-pid-mint-latest.json'),
  reportMd: rel('reports/brown-hilbert-human-pid-mint-latest.md'),
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

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function sha256Text(input) {
  return crypto.createHash('sha256').update(String(input)).digest('hex');
}

function assignment(slot, id, displayName) {
  return { slot, id, displayName };
}

function padSlot(slot) {
  if (!Number.isInteger(slot) || slot < 0 || slot > HUMAN_PID_LAST_SLOT) {
    throw new Error(`PID slot out of range: ${slot}`);
  }
  return String(slot).padStart(10, '0');
}

function bhPid(slot) {
  return `BH.HUMAN.PID.${padSlot(slot)}`;
}

function checksum(symbol) {
  return sha256Text(symbol).slice(0, 8).toUpperCase();
}

function bh256(symbol) {
  const hash = sha256Text(symbol);
  return `BH256-${hash.slice(0, 4)}-${hash.slice(4, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}`.toUpperCase();
}

function coordinate(slot, dim) {
  const cube = dim.prime ** 3;
  const residue = slot % dim.prime;
  const turn = Math.floor(slot / dim.prime);
  return {
    dimension: dim.id,
    name: dim.name,
    prime: dim.prime,
    primeCube: cube,
    role: dim.role,
    residue,
    turn,
    address: `D${dim.id}:${dim.name}:${cube}:${residue}:${turn}`
  };
}

function loadPriorPidMap() {
  if (!fs.existsSync(PATHS.priorPidMap)) return null;
  return readJson(PATHS.priorPidMap);
}

function priorPidFor(priorPidMap, participantId) {
  if (!priorPidMap) return null;
  const hit = priorPidMap.participantPids.find((entry) => entry.participantId === participantId);
  return hit?.personPid || null;
}

function buildMint(generatedAt) {
  const priorPidMap = loadPriorPidMap();
  const entries = ASSIGNMENTS.map((entry) => {
    const symbol = bhPid(entry.slot);
    const tupleKey = `${symbol}:${entry.id}`;
    const hash = sha256Text(tupleKey);
    return {
      slot: entry.slot,
      slot10: padSlot(entry.slot),
      participantId: entry.id,
      displayName: entry.displayName,
      canonicalPid: symbol,
      status: 'assigned_household_prep_only',
      priorLocalPersonPid: priorPidFor(priorPidMap, entry.id),
      glyph: `HG256:BH:HUMAN_PID:${padSlot(entry.slot)}:${checksum(tupleKey)}`,
      tupleKey,
      derivation: {
        ruleId: 'brown-hilbert-human-pid-v1',
        hash,
        hilbert: bh256(tupleKey),
        coordinates: BH_DIMS.map((dim) => coordinate(entry.slot, dim)),
        source: 'operator_assigned_household_slots'
      },
      gates: {
        liveData: 'closed',
        outsiderUse: 'blocked',
        medicalClaim: 'blocked',
        mindReadingClaim: 'blocked'
      }
    };
  });

  const space = {
    namespaceId: 'brown-hilbert-human-pid-space.v1',
    generatedAt,
    status: 'MINTED_LANGUAGE_SPACE_COMPACT',
    mode: MODE,
    count: HUMAN_PID_COUNT,
    firstPid: bhPid(0),
    lastPid: bhPid(HUMAN_PID_LAST_SLOT),
    canonicalForm: 'BH.HUMAN.PID.{10_DIGIT_SLOT}',
    generationRule: 'Every integer slot from 0 through 9999999999 maps to exactly one Brown-Hilbert human PID symbol by zero-padding the slot to 10 digits.',
    materialization: 'language_rule_plus_sparse_assignments_not_10_billion_files',
    dimensions: BH_DIMS,
    assignedSlots: entries.map((entry) => entry.slot),
    unclaimedRanges: [
      { first: bhPid(0), last: bhPid(0), status: 'unclaimed_reserved_zero_slot' },
      { first: bhPid(6), last: bhPid(HUMAN_PID_LAST_SLOT), status: 'untaken_until_taken' }
    ],
    claimRule: 'A slot can move from untaken to assigned only through consent/authority gates for that person or guardian.',
    privacyRule: 'The PID stores no biometric template, no raw EEG, no legal identity document, and no medical status.'
  };

  const map = {
    mapId: 'brown-hilbert-household-pid-map.current.v1',
    generatedAt,
    status: 'HOUSEHOLD_BH_PIDS_MINTED',
    mode: MODE,
    space: repoRel(PATHS.bhSpace),
    priorPidMap: priorPidMap ? repoRel(PATHS.priorPidMap) : null,
    assignments: entries,
    remaining: {
      status: 'untaken_until_taken',
      count: HUMAN_PID_COUNT - entries.length,
      ranges: space.unclaimedRanges
    }
  };

  return { space, map, entries };
}

function buildLanguage(space, map, generatedAt) {
  return {
    tableId: 'brown-hilbert-human-pid-language.v1',
    spec: 'BEHCS_HG256_BROWN_HILBERT',
    plan: 'human-pid-language-mint',
    version: 1,
    status: 'minted_local_language',
    generatedAt,
    alphabet: {
      spec: 'ascii-safe-brown-hilbert-human-pid-v1',
      canonicalWidth: 23,
      tokenPattern: '^BH\\.HUMAN\\.PID\\.[0-9]{10}$'
    },
    derivation: {
      ruleId: 'brown-hilbert-human-pid-v1',
      input: 'human_pid_slot_integer',
      template: space.canonicalForm,
      range: `${space.firstPid}..${space.lastPid}`,
      materialization: space.materialization
    },
    grammar: {
      nonterminal: 'HumanPid',
      production: 'HumanPid := "BH.HUMAN.PID." Digit Digit Digit Digit Digit Digit Digit Digit Digit Digit',
      semanticAction: 'slot = parseInt(last_10_digits); require 0 <= slot <= 9999999999',
      unclaimedDefault: 'slots not present in assignments are untaken_until_taken until explicitly claimed'
    },
    entries: map.assignments.map((entry) => ({
      entryId: `bh-human-pid-${entry.slot10}`,
      index: entry.slot,
      dimensionId: 7,
      catalogDimensionName: 'HUMAN_PID_SLOT',
      value: entry.canonicalPid,
      normalizedValue: entry.canonicalPid.toLowerCase(),
      tupleKey: entry.tupleKey,
      glyph: entry.glyph,
      role: 'household_pid',
      reason: 'operator_assigned_household_pid_slot',
      status: 'bound',
      participantId: entry.participantId,
      displayName: entry.displayName,
      derivation: entry.derivation,
      conflict: null
    })),
    defaultEntry: {
      match: 'BH.HUMAN.PID.0000000000 or BH.HUMAN.PID.0000000006..BH.HUMAN.PID.9999999999',
      status: 'untaken_until_taken',
      role: 'unclaimed_slot',
      rule: space.claimRule
    }
  };
}

function buildGrammar(space, generatedAt) {
  return {
    grammarId: 'brown-hilbert-human-pid.grammar.v1',
    generatedAt,
    status: 'minted',
    token: 'BH_HUMAN_PID',
    pattern: '^BH\\.HUMAN\\.PID\\.[0-9]{10}$',
    canonicalForm: space.canonicalForm,
    validRange: { min: 0, max: HUMAN_PID_LAST_SLOT },
    defaultState: 'untaken_until_taken',
    assignedSlots: ASSIGNMENTS.map((entry) => ({ slot: entry.slot, pid: bhPid(entry.slot), participantId: entry.id })),
    dimensions: BH_DIMS,
    safety: {
      noOutsiderAssignmentByDefault: true,
      noLiveDataAuthorityByPidAlone: true,
      noMedicalOrMindReadingClaim: true
    }
  };
}

function buildMapMarkdown(space, map) {
  const rows = map.assignments.map((entry) =>
    `| ${entry.slot} | ${entry.displayName} | ${entry.canonicalPid} | ${entry.glyph} | ${entry.priorLocalPersonPid || 'none'} |`
  ).join('\n');
  const rangeRows = map.remaining.ranges.map((entry) =>
    `| ${entry.first} | ${entry.last} | ${entry.status} |`
  ).join('\n');

  return `# Brown-Hilbert Household Human PID Map

Generated: ${map.generatedAt}

Status: ${map.status}

Canonical form: \`${space.canonicalForm}\`

Generation rule: ${space.generationRule}

## Assigned Household Slots

| PID Slot | Person | Brown-Hilbert PID | Glyph | Prior Local PID |
| ---: | --- | --- | --- | --- |
${rows}

## Untaken Slots

| First | Last | Status |
| --- | --- | --- |
${rangeRows}

The remaining slots are generated by language rule and are untaken until claimed. No outsider identity is created by default.
`;
}

function buildShannon(map, generatedAt) {
  return {
    integrationId: 'brown-hilbert-human-pid-mint-shannon-consensus',
    generatedAt,
    status: 'consensus_language_mint_pass',
    consensus: 'MINTED-BH-HUMAN-PID-LANGUAGE',
    executionDisposition: 'language_mint_only_no_mass_files_no_live_data',
    votes: [
      { part: 'scout', vote: 'PASS_MINT', reason: 'Slots 1-5 are assigned exactly as requested.' },
      { part: 'evidence', vote: 'PASS_COMPACT_SPACE', reason: '10B PID space is generated by canonical grammar/range rule.' },
      { part: 'executor', vote: 'HALT_MASS_FILES', reason: 'No attempt made to write 10 billion physical files.' },
      { part: 'fabric', vote: 'PASS_LANGUAGE_BIND', reason: 'Language, grammar, map, BEHCS, Hermes, Shannon, cube, and report surfaces are written.' },
      { part: 'voice', vote: 'UNTAKEN_DEFAULT', reason: 'All non-household slots remain untaken until claimed.' },
      { part: 'planner', vote: 'NEXT_BIND_SYNTHETIC', reason: 'Future session manifests should use canonical Brown-Hilbert PID symbols.' }
    ],
    assignmentCount: map.assignments.length
  };
}

function buildHermes(map, shannonPacket, generatedAt) {
  return {
    integrationId: 'brown-hilbert-human-pid-mint-hermes-dispatch',
    generatedAt,
    status: map.status,
    mode: MODE,
    packet: {
      verb: 'EVT-HERMES-BROWN-HILBERT-HUMAN-PID-MINT',
      summary: 'Human PID slots minted into Brown-Hilbert language; household slots 1-5 assigned.',
      consensus: shannonPacket.consensus,
      assignmentCount: map.assignments.length,
      remainingStatus: map.remaining.status,
      outputs: {
        space: repoRel(PATHS.bhSpace),
        map: repoRel(PATHS.bhMapJson),
        language: repoRel(PATHS.language),
        grammar: repoRel(PATHS.grammar),
        report: repoRel(PATHS.reportMd)
      }
    }
  };
}

function buildCube(map, shannonPacket, generatedAt) {
  const cube = {
    id: 'brown-hilbert-human-pid-mint',
    generatedAt,
    primaryCatalog: { D: 7, name: 'STATE', prime: 17 },
    touches: [6, 7, 20, 24, 35, 37, 38, 39, 42, 47],
    gates: ['language_mint', 'household_pid_slots', 'untaken_default', 'no_mass_files', 'live_data_closed'],
    payload: {
      kind: 'brown-hilbert-human-pid-language-mint',
      status: map.status,
      mode: MODE,
      assignments: map.assignments.map((entry) => ({
        slot: entry.slot,
        participantId: entry.participantId,
        canonicalPid: entry.canonicalPid,
        glyph: entry.glyph
      })),
      remaining: map.remaining,
      shannon: {
        consensus: shannonPacket.consensus,
        executionDisposition: shannonPacket.executionDisposition
      }
    },
    translate: {
      human: 'Human PID slots are minted into Brown-Hilbert language; 1-5 are assigned, the rest are untaken.',
      agent: '(brown_hilbert, human_pid, language_mint, slots_1_5_assigned, rest_untaken)',
      device: 'node tools/brown-hilbert-human-pid-mint.js mint --execute'
    }
  };
  return `// cube: brown-hilbert-human-pid-mint | identity | D7 STATE
export const CUBE = ${JSON.stringify(cube, null, 2)}
`;
}

function buildReport(space, map, language, grammar, shannonPacket, generatedAt) {
  const rows = map.assignments.map((entry) =>
    `| ${entry.slot} | ${entry.displayName} | ${entry.canonicalPid} | ${entry.glyph} |`
  ).join('\n');
  const voteRows = shannonPacket.votes.map((vote) =>
    `| ${vote.part} | ${vote.vote} | ${vote.reason} |`
  ).join('\n');

  const json = {
    reportId: 'brown-hilbert-human-pid-mint-latest',
    generatedAt,
    status: map.status,
    mode: MODE,
    space,
    map,
    language,
    grammar,
    shannon: shannonPacket
  };

  const md = `# Brown-Hilbert Human PID Language Mint

Generated: ${generatedAt}

Status: ${map.status}

Minted canonical Brown-Hilbert human PID language symbols for the 10-billion-slot namespace without writing 10 billion files.

## Assigned Household Slots

| Slot | Person | Canonical PID | Glyph |
| ---: | --- | --- | --- |
${rows}

## Language Rule

- Nonterminal: ${language.grammar.nonterminal}
- Production: \`${language.grammar.production}\`
- Range: \`${space.firstPid}\` through \`${space.lastPid}\`
- Default: ${language.defaultEntry.status}

## Remaining Slots

- Status: ${map.remaining.status}
- Count: ${map.remaining.count}
- Rule: ${space.claimRule}

## Shannon

- Consensus: ${shannonPacket.consensus}
- Execution: ${shannonPacket.executionDisposition}

| Part | Vote | Reason |
| --- | --- | --- |
${voteRows}
`;

  return { json, md };
}

function mint({ execute = false } = {}) {
  const generatedAt = new Date().toISOString();
  const { space, map } = buildMint(generatedAt);
  const language = buildLanguage(space, map, generatedAt);
  const grammar = buildGrammar(space, generatedAt);
  const shannonPacket = buildShannon(map, generatedAt);
  const hermesPacket = buildHermes(map, shannonPacket, generatedAt);
  const cube = buildCube(map, shannonPacket, generatedAt);
  const report = buildReport(space, map, language, grammar, shannonPacket, generatedAt);
  const eventId = `brown-hilbert-human-pid-mint-${Date.now()}`;

  if (execute) {
    writeJson(PATHS.bhSpace, space);
    writeJson(PATHS.bhMapJson, map);
    writeText(PATHS.bhMapMd, buildMapMarkdown(space, map));
    writeJson(PATHS.language, language);
    writeJson(PATHS.grammar, grammar);
    writeJson(PATHS.state, {
      savedAt: generatedAt,
      status: map.status,
      mode: MODE,
      space: repoRel(PATHS.bhSpace),
      map: repoRel(PATHS.bhMapJson),
      language: repoRel(PATHS.language),
      grammar: repoRel(PATHS.grammar),
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
      to: 'brown-hilbert-language',
      verb: 'EVT-BROWN-HILBERT-HUMAN-PID-MINT',
      body: { status: map.status, language: repoRel(PATHS.language), report: repoRel(PATHS.reportMd) }
    });
    appendNdjson(PATHS.outbox, {
      id: `${eventId}-hermes`,
      ts: generatedAt,
      from: 'hermes',
      to: 'brown-hilbert-language',
      verb: hermesPacket.packet.verb,
      body: hermesPacket
    });
    appendNdjson(PATHS.gnnEdges, {
      id: `${eventId}-edge`,
      ts: generatedAt,
      from: 'brown_hilbert_language',
      to: 'human_pid_namespace',
      verb: 'mints_human_pid_symbols',
      weight: 0.9
    });
  }

  return {
    ok: true,
    action: execute ? 'mint' : 'preview',
    generatedAt,
    status: map.status,
    assignments: map.assignments.map((entry) => ({
      slot: entry.slot,
      displayName: entry.displayName,
      canonicalPid: entry.canonicalPid,
      glyph: entry.glyph
    })),
    remaining: map.remaining,
    shannon: {
      status: shannonPacket.status,
      consensus: shannonPacket.consensus
    },
    outputs: {
      space: repoRel(PATHS.bhSpace),
      map: repoRel(PATHS.bhMapJson),
      language: repoRel(PATHS.language),
      grammar: repoRel(PATHS.grammar),
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
  try {
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
        'node tools/brown-hilbert-human-pid-mint.js status',
        'node tools/brown-hilbert-human-pid-mint.js mint --execute'
      ]
    }, null, 2));
    process.exitCode = 2;
  } catch (error) {
    console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
    process.exitCode = 1;
  }
}

main(process.argv);
