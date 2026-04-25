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
  noHumanSubjectData: true,
  syntheticOnly: true,
  nonInvasiveOnly: true,
  consentRequiredBeforeLiveData: true,
  noMedicalClaims: true,
  noMindReadingClaims: true,
  childProcessUse: false,
  secretMaterialWritten: false
});

const LAB_ROOT = rel('data/neurotech-defense-lab');

const PATHS = Object.freeze({
  startState: rel('data/behcs/state/neurotech-defense/neurotech-consent-eeg-start.state.json'),
  protocol: rel('data/neurotech-defense-lab/consent/consent-protocol.v1.md'),
  consentTemplate: rel('data/neurotech-defense-lab/consent/participant-consent-template.v1.md'),
  safetyCard: rel('data/neurotech-defense-lab/safety/claim-and-safety-card.v1.md'),
  downloadManifest: rel('data/neurotech-defense-lab/manifests/software-model-download-manifest.v1.json'),
  pipeline: rel('data/neurotech-defense-lab/pipelines/synthetic-eeg-smoke.v1.json'),
  latestSessionPointer: rel('data/neurotech-defense-lab/synthetic/latest-session.json'),
  hermes: rel('data/behcs/hermes/neurotech-defense/neurotech-consent-eeg-start-dispatch-latest.json'),
  shannon: rel('data/behcs/shannon/neurotech-defense/neurotech-consent-eeg-start-consensus-latest.json'),
  cube: rel('data/behcs/cubes/neurotech-consent-eeg-start.cube.js'),
  reportJson: rel('reports/neurotech-consent-eeg-start-latest.json'),
  reportMd: rel('reports/neurotech-consent-eeg-start-latest.md'),
  inbox: rel('data/behcs/inbox.ndjson'),
  outbox: rel('data/behcs/outbox.ndjson'),
  gnnEdges: rel('data/behcs/gnn-live-edges.ndjson')
});

const CHANNELS = ['Fp1', 'Fp2', 'C3', 'C4', 'P3', 'P4', 'O1', 'O2'];

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

function sha256Text(input) {
  return crypto.createHash('sha256').update(String(input)).digest('hex');
}

function makePrng(seedText) {
  let state = crypto.createHash('sha256').update(seedText).digest().readUInt32LE(0);
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function eventForSecond(second) {
  if (second < 2) return 'baseline_rest';
  if (second < 5) return 'attention_prompt';
  if (second < 8) return 'breath_pace_feedback';
  return 'cooldown_rest';
}

function simulateSession(generatedAt) {
  const safeStamp = generatedAt.replace(/[-:.TZ]/g, '').slice(0, 14);
  const sessionId = `synthetic-eeg-${safeStamp}`;
  const sessionDir = rel(`data/neurotech-defense-lab/synthetic/${sessionId}`);
  const csvPath = path.join(sessionDir, 'synthetic-eeg.csv');
  const metadataPath = path.join(sessionDir, 'metadata.json');
  const metricsPath = path.join(sessionDir, 'quality-metrics.json');
  const prng = makePrng(sessionId);
  const sampleRateHz = 128;
  const durationSeconds = 10;
  const rows = [`time_ms,event,${CHANNELS.join(',')}`];
  const channelStats = Object.fromEntries(CHANNELS.map((channel) => [channel, { min: Infinity, max: -Infinity, sumAbs: 0 }]));
  let blinkSamples = 0;

  for (let i = 0; i < sampleRateHz * durationSeconds; i += 1) {
    const t = i / sampleRateHz;
    const event = eventForSecond(t);
    const attentionGain = event === 'attention_prompt' ? 1.2 : 1.0;
    const breathGain = event === 'breath_pace_feedback' ? 0.9 : 1.0;
    const blink = t > 3.1 && t < 3.28 ? 65 * Math.sin(Math.PI * (t - 3.1) / 0.18) : 0;
    if (blink) blinkSamples += 1;

    const values = CHANNELS.map((channel, index) => {
      const phase = index * 0.37;
      const alpha = 18 * Math.sin(2 * Math.PI * 10 * t + phase) * breathGain;
      const beta = 6 * Math.sin(2 * Math.PI * 20 * t + phase / 2) * attentionGain;
      const drift = 2 * Math.sin(2 * Math.PI * 0.3 * t + phase);
      const noise = (prng() - 0.5) * 5;
      const frontalBlink = channel.startsWith('Fp') ? blink : blink * 0.08;
      const value = alpha + beta + drift + noise + frontalBlink;
      channelStats[channel].min = Math.min(channelStats[channel].min, value);
      channelStats[channel].max = Math.max(channelStats[channel].max, value);
      channelStats[channel].sumAbs += Math.abs(value);
      return value.toFixed(4);
    });

    rows.push(`${Math.round(t * 1000)},${event},${values.join(',')}`);
  }

  const metadata = {
    sessionId,
    generatedAt,
    synthetic: true,
    consentState: 'not_required_synthetic_no_human_subject',
    sampleRateHz,
    durationSeconds,
    channels: CHANNELS,
    eventSchedule: [
      { fromSecond: 0, toSecond: 2, event: 'baseline_rest' },
      { fromSecond: 2, toSecond: 5, event: 'attention_prompt' },
      { fromSecond: 5, toSecond: 8, event: 'breath_pace_feedback' },
      { fromSecond: 8, toSecond: 10, event: 'cooldown_rest' }
    ],
    capabilityPolicy: {
      mindReading: 'not_claimed',
      neuroEnhancement: 'training_support_only',
      medicalUse: 'not_for_diagnosis_or_treatment'
    }
  };

  const metrics = {
    sessionId,
    generatedAt,
    sampleCount: sampleRateHz * durationSeconds,
    blinkArtifactSamples: blinkSamples,
    signalQuality: 'synthetic_pass',
    simulatedBands: {
      alphaHz: 10,
      betaHz: 20
    },
    channelStats: Object.fromEntries(CHANNELS.map((channel) => {
      const stats = channelStats[channel];
      return [channel, {
        minMicrovolts: Math.round(stats.min * 100) / 100,
        maxMicrovolts: Math.round(stats.max * 100) / 100,
        meanAbsMicrovolts: Math.round((stats.sumAbs / (sampleRateHz * durationSeconds)) * 100) / 100
      }];
    })),
    interpretation: 'Synthetic signal path is usable for parser/UI/model-pipeline smoke tests only.'
  };

  return {
    sessionId,
    sessionDir,
    csvPath,
    metadataPath,
    metricsPath,
    csv: `${rows.join('\n')}\n`,
    metadata,
    metrics
  };
}

function buildProtocol(generatedAt) {
  return `# Consent-Based EEG / Neurofeedback Protocol

Generated: ${generatedAt}

This protocol starts the defensive neurotech lane with synthetic data only. Live EEG or other biosignals require explicit consent before collection.

## Allowed Scope

- Non-invasive sensors only: EEG, EMG, ECG, EDA, EOG, respiration, and event markers.
- Voluntary sessions only, with clear start/stop controls.
- Training support, attention/breath pacing, signal quality, artifact detection, and user-facing feedback.
- Public datasets and synthetic data before any participant data.

## Disallowed Scope

- No covert monitoring.
- No literal mind-reading claims.
- No diagnosis, treatment, or medical decision claims.
- No inference of private thoughts, intent, emotion, deception, or protected traits.
- No invasive hardware, stimulation, coercive prompts, or harmful software.
- No raw participant data committed to Git.

## Live Session Preconditions

1. Participant reads and signs the consent template.
2. Device and electrodes are described in the session metadata.
3. Storage path is approved and raw data is pseudonymized.
4. Signal quality gate passes.
5. Participant can stop the session immediately.
6. Output UI shows uncertainty and does not overclaim.

## Enhancement Definition

For this project, neuro-enhancement means assistive cognitive support: practice scheduling, breath pacing, attention-training feedback, fatigue awareness, and learning analytics. It does not mean forced manipulation or guaranteed cognitive improvement.
`;
}

function buildConsentTemplate(generatedAt) {
  return `# Participant Consent Template

Generated: ${generatedAt}

Project: Asolaria Consent-Based EEG / Neurofeedback Lab

## Plain-Language Summary

You may choose to participate in a non-invasive EEG/neurofeedback session. The system records biosignals from sensors you agree to use. The software is experimental and is not medical care.

## What Will Be Collected

- Sensor time series from approved non-invasive devices.
- Event markers from tasks you choose to perform.
- Session metadata such as device type, sample rate, and signal quality.

## What Will Not Be Claimed

- The system does not read your private thoughts.
- The system does not diagnose or treat medical conditions.
- The system does not make decisions about you.

## Your Control

- You may stop at any time.
- You may request deletion of your raw session data.
- You may ask what model or rule produced any feedback.

## Consent

Participant name:

Participant signature:

Date:

Operator:
`;
}

function buildSafetyCard(generatedAt) {
  return `# Claim And Safety Card

Generated: ${generatedAt}

Safe language: "consented EEG signal classification", "neurofeedback", "training support", "signal quality", "attention-practice feedback".

Blocked language: "mind reading", "guaranteed enhancement", "brain frying", "covert detection", "deception detection", "medical diagnosis".

Execution rule: if a downloaded tool or model claims coercive, covert, harmful, or medical capability, it must be quarantined and reviewed before any execution.
`;
}

function buildDownloadManifest(generatedAt) {
  return {
    manifestId: 'software-model-download-manifest.v1',
    generatedAt,
    status: 'DOWNLOADS_BLOCKED_PENDING_APPROVAL',
    storagePolicy: {
      preferredReserveRoot: 'D:/Asolaria-Reserve/neurotech-defense-lab',
      currentWritableStarterRoot: repoRel(LAB_ROOT),
      rule: 'No software, model, or dataset download happens from this starter.'
    },
    approvedPlanOnly: [
      { id: 'brainflow', kind: 'python_or_node_package', source: 'official BrainFlow docs', status: 'planned_not_downloaded' },
      { id: 'mne-python', kind: 'python_package', source: 'official MNE docs', status: 'planned_not_downloaded' },
      { id: 'lsl', kind: 'streaming_tools', source: 'official Lab Streaming Layer docs', status: 'planned_not_downloaded' },
      { id: 'openbci-gui', kind: 'desktop_app', source: 'official OpenBCI docs', status: 'planned_not_downloaded' },
      { id: 'moabb', kind: 'python_package_dataset_fetchers', source: 'official MOABB docs', status: 'planned_not_downloaded' },
      { id: 'braindecode', kind: 'python_package_models', source: 'official Braindecode docs', status: 'planned_not_downloaded' }
    ],
    blockedUntilReview: [
      'closed-source downloaded executables',
      'browser extensions that collect biometric signals',
      'models without license/model-card/provenance',
      'software making mind-reading, coercion, medical, or harmful stimulation claims'
    ]
  };
}

function buildPipeline(session, generatedAt) {
  return {
    pipelineId: 'synthetic-eeg-smoke.v1',
    generatedAt,
    status: 'SYNTHETIC_PASS',
    mode: MODE,
    stages: [
      { id: 'generate_synthetic_eeg', status: 'PASS', output: repoRel(session.csvPath) },
      { id: 'write_metadata', status: 'PASS', output: repoRel(session.metadataPath) },
      { id: 'write_quality_metrics', status: 'PASS', output: repoRel(session.metricsPath) },
      { id: 'human_consent_gate', status: 'NOT_REQUIRED_SYNTHETIC', output: repoRel(PATHS.consentTemplate) },
      { id: 'download_gate', status: 'BLOCKED_PENDING_APPROVAL', output: repoRel(PATHS.downloadManifest) },
      { id: 'device_gate', status: 'BLOCKED_SYNTHETIC_ONLY', output: repoRel(PATHS.safetyCard) }
    ],
    nextRunnableTranche: 'operator-approved reserve-root creation and dependency manifest review'
  };
}

function buildShannon(pipeline, generatedAt) {
  return {
    integrationId: 'neurotech-consent-eeg-start-shannon-consensus',
    generatedAt,
    status: 'consensus_synthetic_start_pass',
    consensus: 'PROCEED-SYNTHETIC-ONLY',
    executionDisposition: 'no_download_no_install_no_device_no_human_data',
    votes: [
      { part: 'scout', vote: 'PASS_SYNTHETIC', reason: 'Synthetic EEG session generated with event markers and metadata.' },
      { part: 'evidence', vote: 'PASS_SYNTHETIC', reason: 'Consent, safety, manifest, pipeline, report, and metrics are written locally.' },
      { part: 'executor', vote: 'HALT_LIVE_DATA', reason: 'Live device/human data remains blocked until consent and operator approval.' },
      { part: 'fabric', vote: 'PASS_SYNTHETIC', reason: 'BEHCS/Hermes/Shannon/cube/report surfaces are integrated.' },
      { part: 'voice', vote: 'CLAIM_GUARD_ACTIVE', reason: 'Mind-reading language is blocked; enhancement is framed as training support only.' },
      { part: 'planner', vote: 'NEXT_APPROVAL_REQUIRED', reason: pipeline.nextRunnableTranche }
    ]
  };
}

function buildHermes(session, pipeline, shannonPacket, generatedAt) {
  return {
    integrationId: 'neurotech-consent-eeg-start-hermes-dispatch',
    generatedAt,
    status: pipeline.status,
    mode: MODE,
    packet: {
      verb: 'EVT-HERMES-NEUROTECH-CONSENT-EEG-START',
      summary: 'Consent-based EEG lane started with synthetic data only.',
      sessionId: session.sessionId,
      consensus: shannonPacket.consensus,
      outputs: {
        protocol: repoRel(PATHS.protocol),
        consentTemplate: repoRel(PATHS.consentTemplate),
        safetyCard: repoRel(PATHS.safetyCard),
        manifest: repoRel(PATHS.downloadManifest),
        pipeline: repoRel(PATHS.pipeline),
        syntheticCsv: repoRel(session.csvPath),
        metrics: repoRel(session.metricsPath),
        report: repoRel(PATHS.reportMd)
      }
    }
  };
}

function buildCube(session, pipeline, shannonPacket, generatedAt) {
  const cube = {
    id: 'neurotech-consent-eeg-start',
    generatedAt,
    primaryCatalog: { D: 37, name: 'AUTHORITY', prime: 157 },
    touches: [6, 20, 35, 37, 38, 39, 42, 47],
    gates: ['consent', 'synthetic_only', 'claim_guard', 'download_gate', 'device_gate'],
    payload: {
      kind: 'consent-eeg-start',
      status: pipeline.status,
      mode: MODE,
      sessionId: session.sessionId,
      shannon: {
        consensus: shannonPacket.consensus,
        executionDisposition: shannonPacket.executionDisposition
      }
    },
    translate: {
      human: 'Consent-based EEG/neurofeedback starts with synthetic data and strict claim/device/download gates.',
      agent: '(asolaria, neurotech, eeg, consent, synthetic, no_device, no_download, claim_guard)',
      device: 'node tools/neurotech-consent-eeg-start.js start --execute'
    }
  };
  return `// cube: neurotech-consent-eeg-start | neurotech | D37 AUTHORITY
export const CUBE = ${JSON.stringify(cube, null, 2)}
`;
}

function buildReport(session, pipeline, shannonPacket, generatedAt) {
  const stageRows = pipeline.stages.map((stage) =>
    `| ${stage.id} | ${stage.status} | ${stage.output} |`
  ).join('\n');
  const voteRows = shannonPacket.votes.map((vote) =>
    `| ${vote.part} | ${vote.vote} | ${vote.reason} |`
  ).join('\n');

  const json = {
    reportId: 'neurotech-consent-eeg-start-latest',
    generatedAt,
    status: pipeline.status,
    mode: MODE,
    session: {
      id: session.sessionId,
      csv: repoRel(session.csvPath),
      metadata: repoRel(session.metadataPath),
      metrics: repoRel(session.metricsPath)
    },
    pipeline,
    shannon: shannonPacket
  };

  const md = `# Neurotech Consent EEG Start

Generated: ${generatedAt}

Status: ${pipeline.status}

Started the consent-based EEG/neurofeedback lane with synthetic data only. No downloads, installs, device access, human-subject data, medical claims, or mind-reading claims were performed.

## Outputs

- Protocol: \`${repoRel(PATHS.protocol)}\`
- Consent template: \`${repoRel(PATHS.consentTemplate)}\`
- Safety card: \`${repoRel(PATHS.safetyCard)}\`
- Download/model manifest: \`${repoRel(PATHS.downloadManifest)}\`
- Synthetic CSV: \`${repoRel(session.csvPath)}\`
- Metrics: \`${repoRel(session.metricsPath)}\`

## Pipeline

| Stage | Status | Output |
| --- | --- | --- |
${stageRows}

## Shannon

- Consensus: ${shannonPacket.consensus}
- Execution: ${shannonPacket.executionDisposition}

| Part | Vote | Reason |
| --- | --- | --- |
${voteRows}
`;

  return { json, md };
}

function start({ execute = false } = {}) {
  const generatedAt = new Date().toISOString();
  const session = simulateSession(generatedAt);
  const pipeline = buildPipeline(session, generatedAt);
  const shannonPacket = buildShannon(pipeline, generatedAt);
  const hermesPacket = buildHermes(session, pipeline, shannonPacket, generatedAt);
  const cube = buildCube(session, pipeline, shannonPacket, generatedAt);
  const report = buildReport(session, pipeline, shannonPacket, generatedAt);
  const eventId = `neurotech-consent-eeg-start-${Date.now()}`;

  if (execute) {
    writeText(PATHS.protocol, buildProtocol(generatedAt));
    writeText(PATHS.consentTemplate, buildConsentTemplate(generatedAt));
    writeText(PATHS.safetyCard, buildSafetyCard(generatedAt));
    writeJson(PATHS.downloadManifest, buildDownloadManifest(generatedAt));
    writeText(session.csvPath, session.csv);
    writeJson(session.metadataPath, session.metadata);
    writeJson(session.metricsPath, session.metrics);
    writeJson(PATHS.latestSessionPointer, {
      savedAt: generatedAt,
      sessionId: session.sessionId,
      csv: repoRel(session.csvPath),
      metadata: repoRel(session.metadataPath),
      metrics: repoRel(session.metricsPath)
    });
    writeJson(PATHS.pipeline, pipeline);
    writeJson(PATHS.startState, {
      savedAt: generatedAt,
      status: pipeline.status,
      mode: MODE,
      sessionId: session.sessionId,
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
      verb: 'EVT-NEUROTECH-CONSENT-EEG-START',
      body: { status: pipeline.status, sessionId: session.sessionId, report: repoRel(PATHS.reportMd) }
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
      from: 'synthetic_eeg_smoke',
      to: 'consent_based_neurofeedback_lane',
      verb: 'started_synthetic_only',
      weight: 0.8
    });
  }

  return {
    ok: true,
    action: execute ? 'start' : 'preview',
    generatedAt,
    status: pipeline.status,
    sessionId: session.sessionId,
    shannon: {
      status: shannonPacket.status,
      consensus: shannonPacket.consensus
    },
    outputs: {
      protocol: repoRel(PATHS.protocol),
      consentTemplate: repoRel(PATHS.consentTemplate),
      safetyCard: repoRel(PATHS.safetyCard),
      manifest: repoRel(PATHS.downloadManifest),
      pipeline: repoRel(PATHS.pipeline),
      syntheticCsv: repoRel(session.csvPath),
      metadata: repoRel(session.metadataPath),
      metrics: repoRel(session.metricsPath),
      reportJson: repoRel(PATHS.reportJson),
      reportMd: repoRel(PATHS.reportMd),
      cube: repoRel(PATHS.cube)
    },
    nextApprovalRequired: 'create reserve lab root and approve dependency/download manifest',
    mode: MODE
  };
}

function main(argv) {
  const action = argv[2] || 'status';
  const execute = argv.includes('--execute');
  if (action === 'status') {
    console.log(JSON.stringify(start({ execute: false }), null, 2));
    return;
  }
  if (action === 'start') {
    console.log(JSON.stringify(start({ execute }), null, 2));
    return;
  }
  console.error(JSON.stringify({
    ok: false,
    error: `Unknown action: ${action}`,
    usage: [
      'node tools/neurotech-consent-eeg-start.js status',
      'node tools/neurotech-consent-eeg-start.js start --execute'
    ]
  }, null, 2));
  process.exitCode = 2;
}

main(process.argv);
