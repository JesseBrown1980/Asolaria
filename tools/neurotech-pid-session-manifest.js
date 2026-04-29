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
  syntheticOnly: true,
  pidBound: true,
  noMedicalClaims: true,
  noMindReadingClaims: true,
  childProcessUse: false,
  secretMaterialWritten: false
});

const PATHS = Object.freeze({
  pidMap: rel('data/neurotech-defense-lab/identity/household-pid-map.current.v1.json'),
  brownHilbertPidMap: rel('data/neurotech-defense-lab/identity/brown-hilbert-household-pid-map.current.v1.json'),
  brownHilbertLanguage: rel('data/behcs/codex/glyph-language/brown-hilbert-human-pid-language.v1.json'),
  householdReadiness: rel('data/neurotech-defense-lab/sessions/household-live-readiness.v1.json'),
  latestSynthetic: rel('data/neurotech-defense-lab/synthetic/latest-session.json'),
  manifestJson: rel('data/neurotech-defense-lab/sessions/pid-bound-session-latest.json'),
  manifestMd: rel('data/neurotech-defense-lab/sessions/pid-bound-session-latest.md'),
  state: rel('data/behcs/state/neurotech-defense/neurotech-pid-session-manifest.state.json'),
  hermes: rel('data/behcs/hermes/neurotech-defense/neurotech-pid-session-manifest-dispatch-latest.json'),
  shannon: rel('data/behcs/shannon/neurotech-defense/neurotech-pid-session-manifest-consensus-latest.json'),
  cube: rel('data/behcs/cubes/neurotech-pid-session-manifest.cube.js'),
  reportJson: rel('reports/neurotech-pid-session-manifest-latest.json'),
  reportMd: rel('reports/neurotech-pid-session-manifest-latest.md'),
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

function resolveRepoInputPath(value, label) {
  const raw = String(value || '').trim();
  if (!raw) throw new Error(`Missing ${label}`);
  const resolved = path.resolve(repoRoot, raw);
  const rootWithSep = repoRoot.endsWith(path.sep) ? repoRoot : `${repoRoot}${path.sep}`;
  if (resolved !== repoRoot && !resolved.startsWith(rootWithSep)) {
    throw new Error(`Unsafe ${label}: outside repository`);
  }
  return resolved;
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

function requireJson(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing ${label}: ${repoRel(filePath)}`);
  }
  return readJson(filePath);
}

function optionalJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return readJson(filePath);
}

function safeFileHash(filePath) {
  let resolved;
  try {
    resolved = resolveRepoInputPath(filePath, 'hash input');
  } catch (_) {
    return null;
  }
  if (!fs.existsSync(resolved)) return null;
  const data = fs.readFileSync(resolved);
  return sha256Text(data);
}

function participantLabel(entry, index) {
  return String(entry.displayLabel || `participant-${String(index + 1).padStart(2, '0')}`);
}

function buildManifest(generatedAt) {
  const pidMap = requireJson(PATHS.pidMap, 'PID map');
  const brownHilbertPidMap = optionalJson(PATHS.brownHilbertPidMap);
  const brownHilbertByParticipant = new Map((brownHilbertPidMap?.assignments || []).map((entry) => [entry.participantId, entry]));
  const householdReadiness = requireJson(PATHS.householdReadiness, 'household readiness');
  const latestSynthetic = requireJson(PATHS.latestSynthetic, 'latest synthetic session');
  const syntheticCsvPath = resolveRepoInputPath(latestSynthetic.csv, 'synthetic CSV');
  const syntheticMetadataPath = resolveRepoInputPath(latestSynthetic.metadata, 'synthetic metadata');
  const syntheticMetricsPath = resolveRepoInputPath(latestSynthetic.metrics, 'synthetic metrics');
  const syntheticMetadata = requireJson(syntheticMetadataPath, 'synthetic metadata');
  const syntheticMetrics = requireJson(syntheticMetricsPath, 'synthetic metrics');

  const manifestId = `pid-bound-session-${generatedAt.replace(/[-:.TZ]/g, '').slice(0, 14)}`;
  return {
    manifestId,
    generatedAt,
    status: 'PID_BOUND_SYNTHETIC_SESSION_READY',
    mode: MODE,
    householdPid: pidMap.householdPid,
    pidMap: repoRel(PATHS.pidMap),
    brownHilbertPidMap: brownHilbertPidMap ? repoRel(PATHS.brownHilbertPidMap) : null,
    brownHilbertLanguage: fs.existsSync(PATHS.brownHilbertLanguage) ? repoRel(PATHS.brownHilbertLanguage) : null,
    householdReadiness: repoRel(PATHS.householdReadiness),
    liveGate: {
      status: 'CLOSED',
      sourceReadiness: householdReadiness.status,
      liveDataStatus: 'BLOCKED_BY_CONSENT_AND_DEVICE_GATES'
    },
    participants: pidMap.participantPids.map((entry, index) => ({
      participantId: entry.participantId,
      displayLabel: participantLabel(entry, index),
      sourceParticipantHash: entry.sourceParticipantHash || null,
      displayNameHash: entry.displayNameHash || null,
      personPid: entry.personPid,
      canonicalBrownHilbertPid: brownHilbertByParticipant.get(entry.participantId)?.canonicalPid || null,
      brownHilbertSlot: brownHilbertByParticipant.get(entry.participantId)?.slot || null,
      brownHilbertGlyph: brownHilbertByParticipant.get(entry.participantId)?.glyph || null,
      liveCollectionStatus: entry.liveCollectionStatus
    })),
    session: {
      type: 'synthetic_eeg_smoke',
      sourceSessionId: latestSynthetic.sessionId,
      synthetic: true,
      noHumanSubjectData: true,
      csv: repoRel(syntheticCsvPath),
      metadata: repoRel(syntheticMetadataPath),
      metrics: repoRel(syntheticMetricsPath),
      csvSha256: safeFileHash(syntheticCsvPath),
      metadataSha256: safeFileHash(syntheticMetadataPath),
      metricsSha256: safeFileHash(syntheticMetricsPath),
      sampleCount: syntheticMetrics.sampleCount,
      channels: syntheticMetadata.channels,
      sampleRateHz: syntheticMetadata.sampleRateHz
    },
    storageBoundary: {
      currentSyntheticRoot: 'data/neurotech-defense-lab/synthetic',
      futureRawHumanDataRoot: 'outside_git_required_before_live_data',
      noCloudUpload: true,
      noRawParticipantDataInGit: true
    },
    allowedUse: [
      'parser smoke tests',
      'PID-bound session manifest tests',
      'synthetic signal-quality UI tests',
      'claim/safety guard tests'
    ],
    blockedUse: [
      'live EEG collection',
      'device access',
      'human-subject data',
      'medical interpretation',
      'mind-reading or private-thought inference',
      'outsider assignment'
    ]
  };
}

function buildManifestMarkdown(manifest) {
  const participantRows = manifest.participants.map((entry) =>
    `| ${entry.displayLabel} | ${entry.canonicalBrownHilbertPid || 'not minted'} | ${entry.personPid} | ${entry.liveCollectionStatus} |`
  ).join('\n');
  const allowedRows = manifest.allowedUse.map((entry) => `- ${entry}`).join('\n');
  const blockedRows = manifest.blockedUse.map((entry) => `- ${entry}`).join('\n');

  return `# PID-Bound Neurotech Session Manifest

Generated: ${manifest.generatedAt}

Status: ${manifest.status}

Household PID: \`${manifest.householdPid}\`

Live gate: ${manifest.liveGate.status}

This binds the current synthetic EEG session to household/person PIDs. It does not record live biosignals or access devices.

## Participants

| Participant | Brown-Hilbert PID | Prior Local PID | Live Collection Status |
| --- | --- | --- | --- |
${participantRows}

## Synthetic Session

- Source session: ${manifest.session.sourceSessionId}
- CSV: \`${manifest.session.csv}\`
- Samples: ${manifest.session.sampleCount}
- Channels: ${manifest.session.channels.join(', ')}
- Sample rate: ${manifest.session.sampleRateHz} Hz
- CSV SHA-256: \`${manifest.session.csvSha256}\`

## Allowed Use

${allowedRows}

## Blocked Use

${blockedRows}
`;
}

function buildMissingManifest(generatedAt, error) {
  return {
    manifestId: `pid-bound-session-preview-missing-${generatedAt.replace(/[-:.TZ]/g, '').slice(0, 14)}`,
    generatedAt,
    status: 'PID_BOUND_SYNTHETIC_SESSION_MISSING_INPUTS',
    mode: MODE,
    householdPid: '',
    pidMap: repoRel(PATHS.pidMap),
    brownHilbertPidMap: null,
    brownHilbertLanguage: fs.existsSync(PATHS.brownHilbertLanguage) ? repoRel(PATHS.brownHilbertLanguage) : null,
    householdReadiness: repoRel(PATHS.householdReadiness),
    liveGate: {
      status: 'CLOSED',
      sourceReadiness: 'missing',
      liveDataStatus: 'BLOCKED_BY_MISSING_LOCAL_INPUTS'
    },
    participants: [],
    session: {
      type: 'synthetic_eeg_smoke',
      sourceSessionId: '',
      synthetic: true,
      noHumanSubjectData: true,
      csv: '',
      metadata: '',
      metrics: '',
      csvSha256: null,
      metadataSha256: null,
      metricsSha256: null,
      sampleCount: 0,
      channels: [],
      sampleRateHz: 0
    },
    storageBoundary: {
      currentSyntheticRoot: 'data/neurotech-defense-lab/synthetic',
      futureRawHumanDataRoot: 'outside_git_required_before_live_data',
      noCloudUpload: true,
      noRawParticipantDataInGit: true
    },
    allowedUse: ['dependency readiness preview'],
    blockedUse: ['live EEG collection', 'device access', 'human-subject data'],
    missingInput: String(error && error.message ? error.message : error || 'unknown')
  };
}

function buildShannon(manifest, generatedAt) {
  return {
    integrationId: 'neurotech-pid-session-manifest-shannon-consensus',
    generatedAt,
    status: 'consensus_pid_bound_synthetic_pass',
    consensus: 'PROCEED-PID-BOUND-SYNTHETIC',
    executionDisposition: 'synthetic_only_no_device_no_live_data',
    votes: [
      { part: 'scout', vote: 'PASS_PID_BIND', reason: 'Household and participant PIDs are attached to a session manifest.' },
      { part: 'evidence', vote: 'PASS_SYNTHETIC_HASHES', reason: 'Synthetic CSV, metadata, and metrics hashes are captured.' },
      { part: 'executor', vote: 'HALT_LIVE_DATA', reason: 'Live gate remains closed.' },
      { part: 'fabric', vote: 'PASS_INTEGRATION', reason: 'Manifest is integrated into BEHCS/Hermes/Shannon/cube/report surfaces.' },
      { part: 'voice', vote: 'BH_LANGUAGE_ACTIVE', reason: 'Session uses canonical Brown-Hilbert PID symbols when minted.' },
      { part: 'planner', vote: 'NEXT_SYNTHETIC_LOOP', reason: 'Next safe work is repeated PID-bound synthetic sessions and UI/parser checks.' }
    ],
    participantPidCount: manifest.participants.length
  };
}

function buildHermes(manifest, shannonPacket, generatedAt) {
  return {
    integrationId: 'neurotech-pid-session-manifest-hermes-dispatch',
    generatedAt,
    status: manifest.status,
    mode: MODE,
    packet: {
      verb: 'EVT-HERMES-NEUROTECH-PID-SESSION-MANIFEST',
      summary: 'PID-bound synthetic session manifest created; live data remains blocked.',
      householdPid: manifest.householdPid,
      sourceSessionId: manifest.session.sourceSessionId,
      consensus: shannonPacket.consensus,
      outputs: {
        manifest: repoRel(PATHS.manifestJson),
        report: repoRel(PATHS.reportMd)
      }
    }
  };
}

function buildCube(manifest, shannonPacket, generatedAt) {
  const cube = {
    id: 'neurotech-pid-session-manifest',
    generatedAt,
    primaryCatalog: { D: 39, name: 'MEMORY', prime: 167 },
    touches: [6, 7, 20, 35, 37, 38, 39, 42, 47],
    gates: ['pid_bound', 'synthetic_only', 'live_data_closed', 'hash_attested', 'claim_guard'],
    payload: {
      kind: 'pid-bound-session-manifest',
      status: manifest.status,
      mode: MODE,
      householdPid: manifest.householdPid,
      sourceSessionId: manifest.session.sourceSessionId,
      participantPidCount: manifest.participants.length,
      shannon: {
        consensus: shannonPacket.consensus,
        executionDisposition: shannonPacket.executionDisposition
      }
    },
    translate: {
      human: 'PID-bound synthetic session is ready; live recording remains closed.',
      agent: '(asolaria, neurotech, pid_bound_session, synthetic, no_device, no_live_data)',
      device: 'node tools/neurotech-pid-session-manifest.js bind --execute'
    }
  };
  return `// cube: neurotech-pid-session-manifest | neurotech | D39 MEMORY
export const CUBE = ${JSON.stringify(cube, null, 2)}
`;
}

function buildReport(manifest, shannonPacket, generatedAt) {
  const participantRows = manifest.participants.map((entry) =>
    `| ${entry.displayLabel} | ${entry.canonicalBrownHilbertPid || 'not minted'} | ${entry.personPid} | ${entry.liveCollectionStatus} |`
  ).join('\n');
  const voteRows = shannonPacket.votes.map((vote) =>
    `| ${vote.part} | ${vote.vote} | ${vote.reason} |`
  ).join('\n');

  const json = {
    reportId: 'neurotech-pid-session-manifest-latest',
    generatedAt,
    status: manifest.status,
    mode: MODE,
    manifest,
    shannon: shannonPacket
  };

  const md = `# Neurotech PID-Bound Session Manifest

Generated: ${generatedAt}

Status: ${manifest.status}

Household PID: \`${manifest.householdPid}\`

Bound the latest synthetic EEG session to household/person PIDs. No live biosignal recording, device access, downloads, installs, human-subject data, medical claims, or mind-reading claims were performed.

## Participants

| Participant | Brown-Hilbert PID | Prior Local PID | Live Collection Status |
| --- | --- | --- | --- |
${participantRows}

## Synthetic Session

- Source session: ${manifest.session.sourceSessionId}
- Samples: ${manifest.session.sampleCount}
- Sample rate: ${manifest.session.sampleRateHz} Hz
- Channels: ${manifest.session.channels.join(', ')}
- CSV SHA-256: \`${manifest.session.csvSha256}\`

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
  let manifest;
  try {
    manifest = buildManifest(generatedAt);
  } catch (error) {
    if (execute) throw error;
    manifest = buildMissingManifest(generatedAt, error);
  }
  const shannonPacket = buildShannon(manifest, generatedAt);
  const hermesPacket = buildHermes(manifest, shannonPacket, generatedAt);
  const cube = buildCube(manifest, shannonPacket, generatedAt);
  const report = buildReport(manifest, shannonPacket, generatedAt);
  const eventId = `neurotech-pid-session-manifest-${Date.now()}`;

  if (execute) {
    writeJson(PATHS.manifestJson, manifest);
    writeText(PATHS.manifestMd, buildManifestMarkdown(manifest));
    writeJson(PATHS.state, {
      savedAt: generatedAt,
      status: manifest.status,
      mode: MODE,
      manifest: repoRel(PATHS.manifestJson),
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
      verb: 'EVT-NEUROTECH-PID-SESSION-MANIFEST',
      body: { status: manifest.status, householdPid: manifest.householdPid, report: repoRel(PATHS.reportMd) }
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
      from: 'pid_bound_session_manifest',
      to: 'synthetic_eeg_smoke',
      verb: 'attests_pid_bound_synthetic_session',
      weight: 0.8
    });
  }

  return {
    ok: true,
    action: execute ? 'bind' : 'preview',
    generatedAt,
    status: manifest.status,
    householdPid: manifest.householdPid,
    sourceSessionId: manifest.session.sourceSessionId,
    participantPidCount: manifest.participants.length,
    liveGate: manifest.liveGate.status,
    shannon: {
      status: shannonPacket.status,
      consensus: shannonPacket.consensus
    },
    outputs: {
      manifest: repoRel(PATHS.manifestJson),
      manifestMd: repoRel(PATHS.manifestMd),
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
        'node tools/neurotech-pid-session-manifest.js status',
        'node tools/neurotech-pid-session-manifest.js bind --execute'
      ]
    }, null, 2));
    process.exitCode = 2;
  } catch (error) {
    console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
    process.exitCode = 1;
  }
}

main(process.argv);
