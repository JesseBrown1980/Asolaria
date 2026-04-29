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
  compactVirtualNamespace: true,
  noMassFileGeneration: true,
  householdOnlyAssignments: true,
  outsidersUnassigned: true,
  noMedicalClaims: true,
  noMindReadingClaims: true,
  childProcessUse: false,
  secretMaterialWritten: false
});

const VIRTUAL_HUMAN_PID_COUNT = 10000000000;
const LOCAL_NAMESPACE_SEED = 'asolaria-human-pid-v1-local-household-scope';

const PATHS = Object.freeze({
  householdScope: rel('data/neurotech-defense-lab/consent/household-scope-current.v1.json'),
  namespaceJson: rel('data/neurotech-defense-lab/identity/human-pid-namespace.v1.json'),
  pidMapJson: rel('data/neurotech-defense-lab/identity/household-pid-map.current.v1.json'),
  pidMapMd: rel('data/neurotech-defense-lab/identity/household-pid-map.current.v1.md'),
  state: rel('data/behcs/state/neurotech-defense/neurotech-human-pid-namespace.state.json'),
  hermes: rel('data/behcs/hermes/neurotech-defense/neurotech-human-pid-namespace-dispatch-latest.json'),
  shannon: rel('data/behcs/shannon/neurotech-defense/neurotech-human-pid-namespace-consensus-latest.json'),
  cube: rel('data/behcs/cubes/neurotech-human-pid-namespace.cube.js'),
  reportJson: rel('reports/neurotech-human-pid-namespace-latest.json'),
  reportMd: rel('reports/neurotech-human-pid-namespace-latest.md'),
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

function checksum(payload) {
  return sha256Text(payload).slice(0, 4).toUpperCase();
}

function shortHash(payload, length = 16) {
  return sha256Text(payload).slice(0, length).toUpperCase();
}

function formatPid(prefix, payload) {
  const body = shortHash(payload, 16).replace(/(.{4})/g, '$1-').replace(/-$/, '');
  return `${prefix}-${body}-${checksum(`${prefix}:${body}`)}`;
}

function sanitizePathToken(value, fallback) {
  const token = String(value || fallback || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return token || String(fallback || 'participant').toLowerCase();
}

function normalizeConsentBasis(value) {
  const text = String(value || '').toLowerCase();
  if (!text) return 'not_recorded';
  if (text.includes('guardian') || text.includes('minor')) return 'guardian_or_minor_scope_recorded';
  if (text.includes('self') || text.includes('adult') || text.includes('participant')) return 'participant_scope_recorded';
  if (text.includes('household') || text.includes('family')) return 'household_scope_recorded';
  return 'consent_scope_recorded';
}

function participantPidPath(participantId, ext) {
  const safeParticipantId = sanitizePathToken(participantId, 'participant');
  const safeExt = String(ext || 'json').toLowerCase() === 'md' ? 'md' : 'json';
  return rel(`data/neurotech-defense-lab/identity/participants/${safeParticipantId}.pid.${safeExt}`);
}

function loadHouseholdScope() {
  if (!fs.existsSync(PATHS.householdScope)) {
    return {
      scopeId: 'household-scope-missing',
      missing: true,
      participants: []
    };
  }
  return readJson(PATHS.householdScope);
}

function buildNamespace(generatedAt) {
  return {
    namespaceId: 'human-pid-namespace.v1',
    generatedAt,
    status: 'VIRTUAL_NAMESPACE_READY_NO_OUTSIDER_ASSIGNMENTS',
    mode: MODE,
    doctrine: {
      description: 'Human PIDs are pseudonymous local references for consent, audit, and household neurotech records.',
      notLegalIdentity: true,
      notBiometricIdentity: true,
      notMedicalIdentifier: true,
      noOutsiderPreassignment: true,
      noCovertUse: true,
      noRawBiometricDataInPid: true
    },
    virtualGlobalSpace: {
      count: VIRTUAL_HUMAN_PID_COUNT,
      firstSlot: 'HPID-V1-0000000000',
      lastSlot: 'HPID-V1-9999999999',
      materialization: 'range_schema_only_not_10_billion_files',
      assignmentRule: 'Slots stay unassigned until a person or guardian explicitly consents within the relevant legal and project boundary.',
      slotTemplate: 'HPID-V1-{10_DIGIT_SLOT}-{CHECKSUM4}',
      checksum: 'first four uppercase hex chars of sha256(prefix_and_slot)',
      reservedRanges: [
        range('0000000000', '7999999999', 'future_consentable_human_slots_unassigned'),
        range('8000000000', '8999999999', 'household_and_family_private_blocks_unassigned'),
        range('9000000000', '9899999999', 'research_test_synthetic_only_unassigned'),
        range('9900000000', '9999999999', 'quarantine_retired_revoked_unassigned')
      ]
    },
    localPidKinds: [
      { kind: 'householdPid', prefix: 'HH-PID-V1', purpose: 'one local household boundary identifier' },
      { kind: 'personPid', prefix: 'HU-PID-V1', purpose: 'one local pseudonymous PID per consenting person or household member' },
      { kind: 'guardianOrMinorPolicy', prefix: 'HU-PID-V1', purpose: 'children/minors require guardian authority plus participant-appropriate assent before live data' }
    ]
  };
}

function range(first, last, purpose) {
  return { first: `HPID-V1-${first}`, last: `HPID-V1-${last}`, purpose };
}

function buildPidMap(scope, namespace, generatedAt) {
  const householdPid = formatPid('HH-PID-V1', `${LOCAL_NAMESPACE_SEED}:household:${scope.scopeId}`);
  const participantPids = scope.participants.map((entry, index) => {
    const rawParticipantId = String(entry.id || `participant-${index + 1}`);
    const participantId = sanitizePathToken(rawParticipantId, `participant-${index + 1}`);
    const displayLabel = `participant-${String(index + 1).padStart(2, '0')}`;
    const personPid = formatPid('HU-PID-V1', `${LOCAL_NAMESPACE_SEED}:${householdPid}:${rawParticipantId}:${index + 1}`);
    return {
      participantId,
      sourceParticipantHash: shortHash(rawParticipantId, 12),
      displayLabel,
      displayNameHash: shortHash(`${LOCAL_NAMESPACE_SEED}:display:${entry.displayName || rawParticipantId}`, 12),
      personPid,
      householdPid,
      relationshipScope: 'household_local_consent_lane',
      consentBasis: normalizeConsentBasis(entry.consentBasis),
      liveCollectionStatus: entry.liveCollectionStatus,
      pidCardJson: repoRel(participantPidPath(participantId, 'json')),
      pidCardMd: repoRel(participantPidPath(participantId, 'md'))
    };
  });

  return {
    mapId: 'household-pid-map.current.v1',
    generatedAt,
    status: 'HOUSEHOLD_PIDS_ASSIGNED_PREP_ONLY',
    mode: MODE,
    namespace: repoRel(PATHS.namespaceJson),
    householdScope: repoRel(PATHS.householdScope),
    householdScopePresent: scope.missing !== true,
    householdPid,
    participantCount: participantPids.length,
    participantPids,
    privacy: {
      noDobStored: true,
      noGovernmentIdStored: true,
      noBiometricTemplateStored: true,
      noRawSignalStoredInPid: true,
      namesAlreadyPresentInConsentScope: true,
      pidDoesNotAuthorizeLiveCollection: true
    },
    globalVirtualSpace: {
      count: namespace.virtualGlobalSpace.count,
      materialization: namespace.virtualGlobalSpace.materialization,
      outsiderAssignments: 0
    }
  };
}

function buildPidMapMarkdown(pidMap, namespace) {
  const rows = pidMap.participantPids.map((entry) =>
    `| ${entry.displayLabel} | ${entry.personPid} | ${entry.liveCollectionStatus} | ${entry.pidCardMd} |`
  ).join('\n');
  const rangeRows = namespace.virtualGlobalSpace.reservedRanges.map((entry) =>
    `| ${entry.first} | ${entry.last} | ${entry.purpose} |`
  ).join('\n');

  return `# Household Human PID Map

Generated: ${pidMap.generatedAt}

Status: ${pidMap.status}

Household PID: \`${pidMap.householdPid}\`

This creates compact PID records for the household neurotech consent lane. It does not create 10 billion files and does not assign outsiders.

## Household Participants

| Participant | Person PID | Live Collection Status | PID Card |
| --- | --- | --- | --- |
${rows}

## Virtual Human PID Namespace

Count: ${namespace.virtualGlobalSpace.count}

Materialization: ${namespace.virtualGlobalSpace.materialization}

| First | Last | Purpose |
| --- | --- | --- |
${rangeRows}

## Privacy Rules

- PIDs are pseudonymous local references, not legal identity.
- PIDs do not authorize live EEG or biosignal collection by themselves.
- No raw EEG, biometric template, government ID, or date of birth is stored in the PID.
- Children or minors require guardian authority plus participant-appropriate assent before live data.
- Outsiders remain unassigned until their own permission exists.
`;
}

function buildParticipantPidCard(entry, pidMap, generatedAt) {
  return {
    generatedAt,
    status: 'PID_ASSIGNED_PREP_ONLY',
    householdPid: pidMap.householdPid,
    participantId: entry.participantId,
    sourceParticipantHash: entry.sourceParticipantHash,
    displayLabel: entry.displayLabel,
    displayNameHash: entry.displayNameHash,
    personPid: entry.personPid,
    consentBasis: entry.consentBasis,
    liveCollectionStatus: entry.liveCollectionStatus,
    rule: 'PID is an audit/consent reference only. It does not permit live collection without the live gate.'
  };
}

function buildParticipantPidMarkdown(card) {
  return `# Human PID Card - ${card.displayLabel}

Generated: ${card.generatedAt}

Status: ${card.status}

Household PID: \`${card.householdPid}\`

Person PID: \`${card.personPid}\`

Source participant hash: \`${card.sourceParticipantHash}\`

Display name hash: \`${card.displayNameHash}\`

Consent basis: ${card.consentBasis}

Live collection status: ${card.liveCollectionStatus}

Rule: ${card.rule}
`;
}

function buildReadiness(pidMap, generatedAt) {
  return {
    generatedAt,
    status: 'PID_READY_PREP_ONLY',
    householdPid: pidMap.householdPid,
    participantPidCount: pidMap.participantPids.length,
    liveDataStatus: 'BLOCKED_BY_CONSENT_AND_DEVICE_GATES',
    nextSafeTranche: 'bind PIDs into future session manifests and keep synthetic-only tests running until live precheck is explicitly approved'
  };
}

function buildShannon(pidMap, readiness, generatedAt) {
  return {
    integrationId: 'neurotech-human-pid-namespace-shannon-consensus',
    generatedAt,
    status: 'consensus_pid_prep_only',
    consensus: 'PROCEED-PID-PREP-ONLY',
    executionDisposition: 'no_mass_generation_no_outsiders_no_live_data',
    votes: [
      { part: 'scout', vote: 'PROCEED_PID_PREP_ONLY', reason: 'Household and participant PIDs can be created locally.' },
      { part: 'evidence', vote: 'PROCEED_PID_PREP_ONLY', reason: '10B human PID space is represented as schema/ranges, not records.' },
      { part: 'executor', vote: 'HALT_LIVE_DATA', reason: 'PIDs do not authorize live device or biosignal collection.' },
      { part: 'fabric', vote: 'PROCEED_PID_PREP_ONLY', reason: 'PID map can be integrated into BEHCS/Hermes/Shannon/cube/report surfaces.' },
      { part: 'voice', vote: 'OUTSIDERS_BLOCKED', reason: 'No outsider identities are populated or inferred.' },
      { part: 'planner', vote: 'NEXT_SYNTHETIC_ONLY', reason: readiness.nextSafeTranche }
    ],
    participantPidCount: pidMap.participantPids.length
  };
}

function buildHermes(pidMap, readiness, shannonPacket, generatedAt) {
  return {
    integrationId: 'neurotech-human-pid-namespace-hermes-dispatch',
    generatedAt,
    status: pidMap.status,
    mode: MODE,
    packet: {
      verb: 'EVT-HERMES-NEUROTECH-HUMAN-PID-NAMESPACE',
      summary: 'Household and per-person PIDs assigned for prep-only consent records; global human PID space remains virtual and unassigned.',
      householdPid: pidMap.householdPid,
      participantPidCount: pidMap.participantPids.length,
      readiness: readiness.status,
      consensus: shannonPacket.consensus,
      outputs: {
        namespace: repoRel(PATHS.namespaceJson),
        pidMap: repoRel(PATHS.pidMapJson),
        report: repoRel(PATHS.reportMd)
      }
    }
  };
}

function buildCube(pidMap, readiness, shannonPacket, generatedAt) {
  const cube = {
    id: 'neurotech-human-pid-namespace',
    generatedAt,
    primaryCatalog: { D: 7, name: 'STATE', prime: 17 },
    touches: [6, 7, 20, 35, 37, 38, 39, 42, 47],
    gates: ['pseudonymous_pid', 'household_only', 'no_outsiders', 'no_mass_records', 'live_data_closed'],
    payload: {
      kind: 'human-pid-namespace',
      status: pidMap.status,
      readiness: readiness.status,
      mode: MODE,
      householdPid: pidMap.householdPid,
      participantPidCount: pidMap.participantPids.length,
      virtualHumanPidCount: VIRTUAL_HUMAN_PID_COUNT,
      shannon: {
        consensus: shannonPacket.consensus,
        executionDisposition: shannonPacket.executionDisposition
      }
    },
    translate: {
      human: 'Assign household/person PIDs for prep-only consent records; keep global human space virtual.',
      agent: '(asolaria, neurotech, human_pid, household_pid, person_pid, virtual_10b_namespace, prep_only)',
      device: 'node tools/neurotech-human-pid-namespace.js bind --execute'
    }
  };
  return `// cube: neurotech-human-pid-namespace | identity | D7 STATE
export const CUBE = ${JSON.stringify(cube, null, 2)}
`;
}

function buildReport(namespace, pidMap, readiness, shannonPacket, generatedAt) {
  const pidRows = pidMap.participantPids.map((entry) =>
    `| ${entry.displayLabel} | ${entry.personPid} | ${entry.liveCollectionStatus} |`
  ).join('\n');
  const voteRows = shannonPacket.votes.map((vote) =>
    `| ${vote.part} | ${vote.vote} | ${vote.reason} |`
  ).join('\n');

  const json = {
    reportId: 'neurotech-human-pid-namespace-latest',
    generatedAt,
    status: pidMap.status,
    mode: MODE,
    namespace,
    pidMap,
    readiness,
    shannon: shannonPacket
  };

  const md = `# Neurotech Human PID Namespace

Generated: ${generatedAt}

Status: ${pidMap.status}

Household PID: \`${pidMap.householdPid}\`

Created one household PID and one local person PID per household participant. The 10-billion human PID space is represented as a virtual namespace, not generated as 10 billion files or assigned to outsiders.

## Participant PIDs

| Participant | Person PID | Live Collection Status |
| --- | --- | --- |
${pidRows}

## Global Virtual Space

- Count: ${namespace.virtualGlobalSpace.count}
- First slot: ${namespace.virtualGlobalSpace.firstSlot}
- Last slot: ${namespace.virtualGlobalSpace.lastSlot}
- Materialization: ${namespace.virtualGlobalSpace.materialization}
- Outsider assignments: ${pidMap.globalVirtualSpace.outsiderAssignments}

## Readiness

- Readiness: ${readiness.status}
- Live data: ${readiness.liveDataStatus}
- Next safe tranche: ${readiness.nextSafeTranche}

## Shannon

- Consensus: ${shannonPacket.consensus}
- Execution: ${shannonPacket.executionDisposition}

| Part | Vote | Reason |
| --- | --- | --- |
${voteRows}
`;

  return { json, md };
}

function bind({ execute = false } = {}) {
  const generatedAt = new Date().toISOString();
  const scope = loadHouseholdScope();
  if (execute && scope.missing === true) {
    throw new Error(`Missing household scope: ${repoRel(PATHS.householdScope)}`);
  }
  const namespace = buildNamespace(generatedAt);
  const pidMap = buildPidMap(scope, namespace, generatedAt);
  const readiness = buildReadiness(pidMap, generatedAt);
  const shannonPacket = buildShannon(pidMap, readiness, generatedAt);
  const hermesPacket = buildHermes(pidMap, readiness, shannonPacket, generatedAt);
  const cube = buildCube(pidMap, readiness, shannonPacket, generatedAt);
  const report = buildReport(namespace, pidMap, readiness, shannonPacket, generatedAt);
  const eventId = `neurotech-human-pid-namespace-${Date.now()}`;

  if (execute) {
    writeJson(PATHS.namespaceJson, namespace);
    writeJson(PATHS.pidMapJson, pidMap);
    writeText(PATHS.pidMapMd, buildPidMapMarkdown(pidMap, namespace));
    for (const entry of pidMap.participantPids) {
      const card = buildParticipantPidCard(entry, pidMap, generatedAt);
      writeJson(participantPidPath(entry.participantId, 'json'), card);
      writeText(participantPidPath(entry.participantId, 'md'), buildParticipantPidMarkdown(card));
    }
    writeJson(PATHS.state, {
      savedAt: generatedAt,
      status: pidMap.status,
      mode: MODE,
      namespace: repoRel(PATHS.namespaceJson),
      pidMap: repoRel(PATHS.pidMapJson),
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
      to: 'neurotech-defense',
      verb: 'EVT-NEUROTECH-HUMAN-PID-NAMESPACE',
      body: { status: pidMap.status, householdPid: pidMap.householdPid, report: repoRel(PATHS.reportMd) }
    });
    appendNdjson(PATHS.outbox, {
      id: `${eventId}-hermes`,
      ts: generatedAt,
      from: 'hermes',
      to: 'neurotech-defense',
      verb: hermesPacket.packet.verb,
      body: hermesPacket
    });
    appendNdjson(PATHS.gnnEdges, {
      id: `${eventId}-edge`,
      ts: generatedAt,
      from: 'human_pid_namespace',
      to: 'household_consent_gate',
      verb: 'binds_pseudonymous_participant_identity',
      weight: 0.7
    });
  }

  return {
    ok: true,
    action: execute ? 'bind' : 'preview',
    generatedAt,
    status: pidMap.status,
    householdPid: pidMap.householdPid,
    participantPidCount: pidMap.participantPids.length,
    virtualHumanPidCount: VIRTUAL_HUMAN_PID_COUNT,
    readiness: readiness.status,
    shannon: {
      status: shannonPacket.status,
      consensus: shannonPacket.consensus
    },
    outputs: {
      namespace: repoRel(PATHS.namespaceJson),
      pidMap: repoRel(PATHS.pidMapJson),
      pidMapMd: repoRel(PATHS.pidMapMd),
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
      console.log(JSON.stringify(bind({ execute: false }), null, 2));
      return;
    }
    if (action === 'bind') {
      console.log(JSON.stringify(bind({ execute }), null, 2));
      return;
    }
    console.error(JSON.stringify({
      ok: false,
      error: `Unknown action: ${action}`,
      usage: [
        'node tools/neurotech-human-pid-namespace.js status',
        'node tools/neurotech-human-pid-namespace.js bind --execute'
      ]
    }, null, 2));
    process.exitCode = 2;
  } catch (error) {
    console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
    process.exitCode = 1;
  }
}

main(process.argv);
