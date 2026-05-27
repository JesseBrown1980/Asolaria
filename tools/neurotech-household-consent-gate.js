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
  nonInvasiveOnly: true,
  householdOnly: true,
  outsidersBlocked: true,
  individualConsentRequiredBeforeLiveData: true,
  noMedicalClaims: true,
  noMindReadingClaims: true,
  childProcessUse: false,
  secretMaterialWritten: false
});

const PARTICIPANTS = [
  participant('jesse_brown', 'Jesse Brown', 'current_chat_operator_directive_recorded'),
  participant('rayssa_chiqueto', 'Rayssa Chiqueto', 'operator_reports_prior_permission_individual_attestation_required'),
  participant('felipe', 'Felipe', 'operator_reports_prior_permission_individual_attestation_required'),
  participant('dan', 'Dan', 'operator_reports_prior_permission_individual_attestation_required'),
  participant('amy', 'Amy', 'operator_reports_prior_permission_individual_attestation_required')
];

const PATHS = Object.freeze({
  householdJson: rel('data/neurotech-defense-lab/consent/household-scope-current.v1.json'),
  householdMd: rel('data/neurotech-defense-lab/consent/household-scope-current.v1.md'),
  readiness: rel('data/neurotech-defense-lab/sessions/household-live-readiness.v1.json'),
  state: rel('data/behcs/state/neurotech-defense/neurotech-household-consent-gate.state.json'),
  hermes: rel('data/behcs/hermes/neurotech-defense/neurotech-household-consent-gate-dispatch-latest.json'),
  shannon: rel('data/behcs/shannon/neurotech-defense/neurotech-household-consent-gate-consensus-latest.json'),
  cube: rel('data/behcs/cubes/neurotech-household-consent-gate.cube.js'),
  reportJson: rel('reports/neurotech-household-consent-gate-latest.json'),
  reportMd: rel('reports/neurotech-household-consent-gate-latest.md'),
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

function participant(id, displayName, consentBasis) {
  return { id, displayName, consentBasis };
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

function participantPacketPath(participantId) {
  return rel(`data/neurotech-defense-lab/consent/participants/${participantId}.consent.md`);
}

function buildHouseholdScope(generatedAt) {
  return {
    scopeId: 'household-scope-current.v1',
    generatedAt,
    status: 'HOUSEHOLD_SCOPE_RECORDED_PREP_ONLY',
    mode: MODE,
    currentDirective: {
      capturedFrom: 'current_chat_operator',
      capturedMeaning: 'Household-only consent-based neurotech prep is authorized to continue now.',
      boundary: 'Only household/local consenting people. No outsiders without their own permission.',
      expires: 'operator_can_revoke_any_time'
    },
    participants: PARTICIPANTS.map((entry) => ({
      ...entry,
      liveCollectionStatus: entry.id === 'jesse_brown'
        ? 'blocked_until_live_session_precheck'
        : 'blocked_until_individual_attestation_and_live_session_precheck',
      packet: repoRel(participantPacketPath(entry.id))
    })),
    allowedNow: [
      'consent packet creation',
      'synthetic EEG sessions',
      'offline protocol and checklist work',
      'local-only training-support UI planning',
      'download and hardware manifest review'
    ],
    blockedNow: [
      'outsider collection or inference',
      'covert recording',
      'live EEG or biosignal recording',
      'device access',
      'software/model downloads',
      'medical claims',
      'mind-reading claims',
      'protected-trait or private-thought inference'
    ],
    liveGate: {
      status: 'CLOSED',
      reason: 'Live biosignal recording requires individual participant attestation, device selection, storage root approval, and signal-quality precheck.',
      minimumPreconditions: [
        'participant consent packet completed by the participant',
        'participant can stop immediately',
        'device is owned/approved and non-invasive',
        'raw data path is outside Git and pseudonymized',
        'no cloud upload',
        'signal quality gate passes before feedback',
        'feedback UI displays uncertainty and avoids overclaiming'
      ]
    }
  };
}

function buildHouseholdMarkdown(scope) {
  const participantRows = scope.participants.map((entry) =>
    `| ${entry.displayName} | ${entry.consentBasis} | ${entry.liveCollectionStatus} | ${entry.packet} |`
  ).join('\n');
  const allowedRows = scope.allowedNow.map((entry) => `- ${entry}`).join('\n');
  const blockedRows = scope.blockedNow.map((entry) => `- ${entry}`).join('\n');
  const gateRows = scope.liveGate.minimumPreconditions.map((entry) => `- ${entry}`).join('\n');

  return `# Household Neurotech Consent Scope

Generated: ${scope.generatedAt}

Status: ${scope.status}

This records the current household-only directive for the consent-based EEG/neurofeedback lane. It does not collect live biosignals, access devices, download software, install packages, or create medical or mind-reading claims.

Boundary: ${scope.currentDirective.boundary}

## Participants

| Participant | Consent Basis | Live Collection Status | Packet |
| --- | --- | --- | --- |
${participantRows}

## Allowed Now

${allowedRows}

## Blocked Now

${blockedRows}

## Live Gate

Status: ${scope.liveGate.status}

${scope.liveGate.reason}

${gateRows}
`;
}

function buildParticipantPacket(entry, generatedAt) {
  return `# Neurotech Consent Packet - ${entry.displayName}

Generated: ${generatedAt}

Project: Asolaria household consent-based EEG/neurofeedback lab

## Scope

This is for voluntary, non-invasive training support only: attention-practice feedback, breath pacing, fatigue awareness, signal quality, and learning analytics.

## Not Claimed

- The system does not read private thoughts.
- The system does not diagnose or treat medical conditions.
- The system does not infer protected traits.
- The system does not make decisions about you.

## Control

- You may stop before or during a session.
- You may decline any device or task.
- You may request deletion of raw session data.
- You may ask what rule or model produced feedback.

## Consent Status

Consent basis recorded now: ${entry.consentBasis}

Live collection remains blocked until this packet is personally completed by the participant and the live-session precheck passes.

Participant name:

Participant signature:

Date:

Operator:
`;
}

function buildReadiness(scope, generatedAt) {
  return {
    readinessId: 'household-live-readiness.v1',
    generatedAt,
    status: 'NOT_LIVE_READY',
    householdScope: repoRel(PATHS.householdJson),
    participantCount: scope.participants.length,
    liveGate: scope.liveGate,
    nextSafeTranche: 'review consent packets, choose owned non-invasive hardware, create outside-Git raw-data storage root, then run device-dry-run only after explicit approval'
  };
}

function buildShannon(scope, readiness, generatedAt) {
  return {
    integrationId: 'neurotech-household-consent-gate-shannon-consensus',
    generatedAt,
    status: 'consensus_household_prep_only',
    consensus: 'PROCEED-PREP-ONLY',
    executionDisposition: 'no_live_recording_no_device_no_download_no_outsiders',
    votes: [
      { part: 'scout', vote: 'PROCEED_PREP_ONLY', reason: 'Household-only scope was recorded without collecting data.' },
      { part: 'evidence', vote: 'PROCEED_PREP_ONLY', reason: 'Participant packets and readiness gate are local artifacts.' },
      { part: 'executor', vote: 'HALT_LIVE_DATA', reason: 'Live recording and device access remain closed.' },
      { part: 'fabric', vote: 'PROCEED_PREP_ONLY', reason: 'BEHCS/Hermes/Shannon/cube/report surfaces can carry the new gate.' },
      { part: 'voice', vote: 'CLAIM_GUARD_ACTIVE', reason: 'No mind-reading, medical, or outsider claims are allowed.' },
      { part: 'planner', vote: 'NEXT_APPROVAL_REQUIRED', reason: readiness.nextSafeTranche }
    ]
  };
}

function buildHermes(scope, readiness, shannonPacket, generatedAt) {
  return {
    integrationId: 'neurotech-household-consent-gate-hermes-dispatch',
    generatedAt,
    status: scope.status,
    mode: MODE,
    packet: {
      verb: 'EVT-HERMES-NEUROTECH-HOUSEHOLD-CONSENT-GATE',
      summary: 'Household-only neurotech prep scope recorded; live recording remains gated closed.',
      consensus: shannonPacket.consensus,
      participantCount: scope.participants.length,
      readiness: readiness.status,
      outputs: {
        householdScope: repoRel(PATHS.householdJson),
        readiness: repoRel(PATHS.readiness),
        report: repoRel(PATHS.reportMd)
      }
    }
  };
}

function buildCube(scope, readiness, shannonPacket, generatedAt) {
  const cube = {
    id: 'neurotech-household-consent-gate',
    generatedAt,
    primaryCatalog: { D: 37, name: 'AUTHORITY', prime: 157 },
    touches: [6, 20, 35, 37, 38, 39, 42, 47],
    gates: ['household_only', 'individual_consent', 'live_data_closed', 'claim_guard', 'outsider_block'],
    payload: {
      kind: 'household-consent-gate',
      status: scope.status,
      readiness: readiness.status,
      mode: MODE,
      participants: scope.participants.map((entry) => ({
        id: entry.id,
        liveCollectionStatus: entry.liveCollectionStatus
      })),
      shannon: {
        consensus: shannonPacket.consensus,
        executionDisposition: shannonPacket.executionDisposition
      }
    },
    translate: {
      human: 'Household neurotech prep may continue; live biosignal collection remains gated.',
      agent: '(asolaria, neurotech, household, consent, prep_only, no_outsiders, no_live_recording)',
      device: 'node tools/neurotech-household-consent-gate.js record --execute'
    }
  };
  return `// cube: neurotech-household-consent-gate | neurotech | D37 AUTHORITY
export const CUBE = ${JSON.stringify(cube, null, 2)}
`;
}

function buildReport(scope, readiness, shannonPacket, generatedAt) {
  const participantRows = scope.participants.map((entry) =>
    `| ${entry.displayName} | ${entry.liveCollectionStatus} | ${entry.packet} |`
  ).join('\n');
  const voteRows = shannonPacket.votes.map((vote) =>
    `| ${vote.part} | ${vote.vote} | ${vote.reason} |`
  ).join('\n');

  const json = {
    reportId: 'neurotech-household-consent-gate-latest',
    generatedAt,
    status: scope.status,
    mode: MODE,
    householdScope: scope,
    readiness,
    shannon: shannonPacket
  };

  const md = `# Neurotech Household Consent Gate

Generated: ${generatedAt}

Status: ${scope.status}

Recorded the current household-only directive and created participant consent packets. No live biosignal recording, device access, download, install, outsider collection, medical claim, or mind-reading claim was performed.

## Participants

| Participant | Live Collection Status | Packet |
| --- | --- | --- |
${participantRows}

## Readiness

- Live gate: ${scope.liveGate.status}
- Readiness: ${readiness.status}
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

function record({ execute = false } = {}) {
  const generatedAt = new Date().toISOString();
  const scope = buildHouseholdScope(generatedAt);
  const readiness = buildReadiness(scope, generatedAt);
  const shannonPacket = buildShannon(scope, readiness, generatedAt);
  const hermesPacket = buildHermes(scope, readiness, shannonPacket, generatedAt);
  const cube = buildCube(scope, readiness, shannonPacket, generatedAt);
  const report = buildReport(scope, readiness, shannonPacket, generatedAt);
  const eventId = `neurotech-household-consent-gate-${Date.now()}`;

  if (execute) {
    writeJson(PATHS.householdJson, scope);
    writeText(PATHS.householdMd, buildHouseholdMarkdown(scope));
    for (const entry of PARTICIPANTS) {
      writeText(participantPacketPath(entry.id), buildParticipantPacket(entry, generatedAt));
    }
    writeJson(PATHS.readiness, readiness);
    writeJson(PATHS.state, {
      savedAt: generatedAt,
      status: scope.status,
      mode: MODE,
      householdScope: repoRel(PATHS.householdJson),
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
      verb: 'EVT-NEUROTECH-HOUSEHOLD-CONSENT-GATE',
      body: { status: scope.status, readiness: readiness.status, report: repoRel(PATHS.reportMd) }
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
      from: 'household_consent_gate',
      to: 'consent_based_neurofeedback_lane',
      verb: 'prep_only_scope_recorded',
      weight: 0.75
    });
  }

  return {
    ok: true,
    action: execute ? 'record' : 'preview',
    generatedAt,
    status: scope.status,
    readiness: readiness.status,
    participantCount: scope.participants.length,
    liveGate: scope.liveGate.status,
    shannon: {
      status: shannonPacket.status,
      consensus: shannonPacket.consensus
    },
    outputs: {
      householdScope: repoRel(PATHS.householdJson),
      householdMd: repoRel(PATHS.householdMd),
      readiness: repoRel(PATHS.readiness),
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
    console.log(JSON.stringify(record({ execute: false }), null, 2));
    return;
  }
  if (action === 'record') {
    console.log(JSON.stringify(record({ execute }), null, 2));
    return;
  }
  console.error(JSON.stringify({
    ok: false,
    error: `Unknown action: ${action}`,
    usage: [
      'node tools/neurotech-household-consent-gate.js status',
      'node tools/neurotech-household-consent-gate.js record --execute'
    ]
  }, null, 2));
  process.exitCode = 2;
}

main(process.argv);
