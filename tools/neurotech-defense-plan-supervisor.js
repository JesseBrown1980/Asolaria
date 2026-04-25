#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const repoRoot = path.resolve(__dirname, '..');
const reserveRoot = process.env.ASOLARIA_RESERVE_ROOT || 'D:/Asolaria-Reserve';
const neuroRoot = path.join(reserveRoot, 'neurotech-defense-lab');

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
  noModelExecution: true,
  noDeviceAccess: true,
  noMedicalClaims: true,
  nonInvasiveOnly: true,
  consentRequired: true,
  childProcessUse: false,
  secretMaterialWritten: false
});

const PATHS = Object.freeze({
  state: rel('data/behcs/state/neurotech-defense/neurotech-defense-plan.state.json'),
  plan: rel('data/behcs/plans/neurotech-defense-plan.v1.json'),
  hermes: rel('data/behcs/hermes/neurotech-defense/neurotech-defense-plan-dispatch-latest.json'),
  shannon: rel('data/behcs/shannon/neurotech-defense/neurotech-defense-plan-consensus-latest.json'),
  cube: rel('data/behcs/cubes/neurotech-defense-plan-supervisor.cube.js'),
  reportJson: rel('reports/neurotech-defense-plan-latest.json'),
  reportMd: rel('reports/neurotech-defense-plan-latest.md'),
  inbox: rel('data/behcs/inbox.ndjson'),
  outbox: rel('data/behcs/outbox.ndjson'),
  gnnEdges: rel('data/behcs/gnn-live-edges.ndjson')
});

const SOURCES = [
  source('mne-python', 'MNE-Python', 'https://mne.tools/stable/auto_tutorials/intro/10_overview.html', 'EEG/MEG loading, epoching, averaging, plotting, and source-estimation pipeline.'),
  source('brainflow', 'BrainFlow', 'https://brainflow.readthedocs.io/', 'Device-agnostic biosensor acquisition and signal-processing API across many EEG/EMG/ECG boards.'),
  source('openbci-gui', 'OpenBCI GUI', 'https://docs.openbci.com/Software/OpenBCISoftware/GUIDocs/', 'OpenBCI board visualization, recording, CSV/BDF export, and streaming to third-party software.'),
  source('lsl', 'Lab Streaming Layer', 'https://labstreaminglayer.readthedocs.io/info/getting_started.html', 'Unified time-synchronized streaming and recording for EEG plus event/task streams.'),
  source('bids-eeg', 'BIDS EEG specification', 'https://bids-specification.readthedocs.io/en/stable/modality-specific-files/electroencephalography.html', 'EEG folder/file/metadata standard for EDF, BrainVision, EEGLAB, and BDF recordings.'),
  source('eeglab', 'EEGLAB', 'https://eeglab.org/', 'Widely used open-source EEG analysis environment with ICA, time/frequency analysis, artifact rejection, and visualization.'),
  source('moabb', 'MOABB', 'https://moabb.neurotechx.com/docs/index.html', 'Reproducible EEG/BCI benchmark framework built on MNE and scikit-learn.'),
  source('braindecode', 'Braindecode', 'https://braindecode.org/stable/index.html', 'Deep learning toolbox for decoding raw EEG/ECoG/MEG data with dataset fetchers and architectures.'),
  source('neurokit2', 'NeuroKit2', 'https://www.clinicalbrain.org/software/neurokit2/', 'Open-source Python package for ECG, EDA, RSP, EMG, EOG, and related biosignal processing.'),
  source('physionet-eegmmidb', 'PhysioNet EEG Motor Movement/Imagery', 'https://physionet.org/content/eegmmidb/', 'Open 64-channel EEG motor execution/imagery dataset from 109 volunteers.')
];

function rel(p) {
  return path.join(repoRoot, p);
}

function repoRel(p) {
  return path.relative(repoRoot, p).replace(/\\/g, '/');
}

function source(id, name, url, role) {
  return { id, name, url, role };
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

function buildPlan(generatedAt) {
  const directories = {
    software: path.join(neuroRoot, 'software'),
    envs: path.join(neuroRoot, 'envs'),
    datasetsRaw: path.join(neuroRoot, 'datasets/raw'),
    datasetsBids: path.join(neuroRoot, 'datasets/bids'),
    derivatives: path.join(neuroRoot, 'derivatives'),
    models: path.join(neuroRoot, 'models'),
    notebooks: path.join(neuroRoot, 'notebooks'),
    reports: path.join(neuroRoot, 'reports'),
    quarantine: path.join(neuroRoot, 'quarantine')
  };

  return {
    planId: 'neurotech-defense-plan.v1',
    generatedAt,
    status: 'PLAN_READY_DOWNLOADS_BLOCKED',
    mode: MODE,
    doctrine: {
      name: 'defensive_consensual_neurotech',
      mindReadingDisposition: 'UNVERIFIED_CLAIM_DO_NOT_MARKET',
      mindEnhancementDisposition: 'COGNITIVE_SUPPORT_AND_NEUROFEEDBACK_ONLY',
      prohibited: [
        'covert biometric inference',
        'medical diagnosis or treatment claims',
        'non-consensual monitoring',
        'invasive or stimulation hardware',
        'software that claims to fry, coerce, harm, or manipulate people',
        'closed-source downloaded executables without provenance review'
      ],
      allowed: [
        'consented non-invasive EEG/EMG/ECG/EDA acquisition',
        'synthetic data and public benchmark datasets',
        'artifact detection and signal quality scoring',
        'attention/fatigue workload support with explicit uncertainty',
        'neurofeedback and learning analytics framed as assistive training'
      ]
    },
    storage: {
      reserveRoot,
      neuroRoot,
      directories
    },
    softwarePlan: [
      item('streaming', 'Lab Streaming Layer + LabRecorder', 'approved_plan_only', ['lsl'], 'Use for local synchronized EEG/event streams and XDF recordings.'),
      item('hardware_gui', 'OpenBCI GUI', 'approved_plan_only', ['openbci-gui'], 'Use only with owned OpenBCI hardware or synthetic/demo modes.'),
      item('acquisition_sdk', 'BrainFlow', 'approved_plan_only', ['brainflow'], 'Primary device abstraction for EEG/EMG/ECG boards; start with synthetic/playback board.'),
      item('python_analysis', 'MNE-Python + MNE-BIDS pattern', 'approved_plan_only', ['mne-python', 'bids-eeg'], 'Primary Python EEG preprocessing/epoch/feature pipeline.'),
      item('matlab_analysis', 'EEGLAB', 'optional_plan_only', ['eeglab'], 'Optional second-opinion analysis lane; requires MATLAB/Octave planning and should not be first dependency.'),
      item('physiology', 'NeuroKit2', 'approved_plan_only', ['neurokit2'], 'Use for ECG/EDA/EMG/EOG support signals and quality metrics.'),
      item('benchmarks', 'MOABB', 'approved_plan_only', ['moabb'], 'Use to benchmark BCI algorithms reproducibly before using live user data.'),
      item('deep_learning', 'Braindecode', 'approved_plan_only', ['braindecode'], 'Use only after classical baselines are established; keep calibration and uncertainty reports.')
    ],
    datasetPlan: [
      item('public_motor_imagery', 'PhysioNet EEG Motor Movement/Imagery', 'approved_plan_only', ['physionet-eegmmidb'], 'Public benchmark lane for motor imagery and execution classification.'),
      item('bids_local', 'Local BIDS-formatted consent recordings', 'consent_required', ['bids-eeg'], 'Only after consent, device validation, and signal-quality gates pass.'),
      item('synthetic', 'BrainFlow synthetic/playback streams', 'approved_first', ['brainflow'], 'First validation target; no human subject data required.')
    ],
    modelPlan: [
      model('baseline_signal_quality', 'Signal quality and artifact scoring', 'classical', 'bandpower, line-noise, impedance metadata, motion/eye-blink artifacts', 'first'),
      model('baseline_bci', 'CSP + LDA / logistic regression', 'classical', 'motor imagery benchmark baseline', 'first'),
      model('riemannian', 'Riemannian tangent-space classifiers', 'classical', 'robust EEG covariance baselines', 'second'),
      model('deep_eeg', 'EEGNet/ShallowConvNet/DeepConvNet via Braindecode', 'deep_learning', 'only after public benchmark baselines and calibration reports', 'third'),
      model('assistant_layer', 'Cognitive support assistant', 'llm_or_rules', 'summarize training sessions, schedule practice, explain uncertainty; never infer private thoughts', 'parallel_safe')
    ],
    supervisorFleet: [
      supervisor('download_whitelist', 'Checks source URL, license, hash, expected storage root, and executable risk before any download.'),
      supervisor('dataset_bids_guard', 'Requires BIDS-style metadata, consent tags, subject pseudonymization, and no raw data in Git.'),
      supervisor('model_card_guard', 'Requires intended use, known limits, benchmark scores, calibration, and uncertainty for every model.'),
      supervisor('signal_quality_guard', 'Blocks live interpretation when contact quality, noise, or drift is poor.'),
      supervisor('claim_guard', 'Rewrites mind-reading/enhancement claims into measurable, consent-based signal-classification or training-support claims.'),
      supervisor('c_drive_storage_guard', 'Routes datasets/models to reserve storage and blocks large downloads on C:.')
    ],
    tenThousandAgentLattice: {
      realSpawnCount: 0,
      meaning: 'virtual task decomposition, not 10000 processes',
      shards: [
        { lane: 'literature_triage', count: 1200 },
        { lane: 'software_provenance', count: 900 },
        { lane: 'dataset_cards', count: 1200 },
        { lane: 'safety_ethics', count: 900 },
        { lane: 'signal_quality', count: 1100 },
        { lane: 'baseline_models', count: 1200 },
        { lane: 'deep_learning_models', count: 900 },
        { lane: 'ui_training_support', count: 800 },
        { lane: 'storage_migration', count: 700 },
        { lane: 'red_team_claims', count: 1100 }
      ]
    },
    phases: [
      phase('P0_guardrails', 'No downloads. Freeze doctrine, storage roots, allowed software list, and claim policy.', 'complete_with_this_report'),
      phase('P1_storage', 'Create reserve-drive folder layout and download manifest; no C: model/dataset storage.', 'requires_operator_approval'),
      phase('P2_synthetic_pipeline', 'Install only the minimum Python stack into a pinned env; run BrainFlow synthetic/playback -> MNE -> BIDS-like export -> report.', 'requires_download_approval'),
      phase('P3_public_benchmark', 'Use MOABB/PhysioNet public datasets to train classical baselines and publish model cards.', 'requires_dataset_manifest'),
      phase('P4_live_device_dry_run', 'Connect owned EEG hardware in demo/quality mode only; record short consented sessions.', 'requires_hardware_and_consent'),
      phase('P5_neurofeedback_support', 'Build user-facing training loops that show confidence, uncertainty, and signal quality; no covert inference.', 'requires_safety_review'),
      phase('P6_red_team_defense', 'Catalog harmful software claims, detect coercive/manipulative wording, and block unsafe downloads/execution.', 'ongoing')
    ],
    sources: SOURCES
  };
}

function item(id, name, disposition, sourceIds, purpose) {
  return { id, name, disposition, sourceIds, purpose };
}

function model(id, name, family, purpose, priority) {
  return { id, name, family, purpose, priority };
}

function supervisor(id, purpose) {
  return { id, purpose, authority: 'observe_plan_verify_only' };
}

function phase(id, action, gate) {
  return { id, action, gate };
}

function buildHermes(plan, generatedAt) {
  return {
    integrationId: 'neurotech-defense-plan-hermes-dispatch',
    generatedAt,
    status: plan.status,
    mode: MODE,
    packet: {
      verb: 'EVT-HERMES-NEUROTECH-DEFENSE-PLAN',
      summary: 'Defensive neurotech software/model plan integrated locally; all downloads and installs remain blocked pending approval.',
      neuroRoot,
      softwareCount: plan.softwarePlan.length,
      datasetCount: plan.datasetPlan.length,
      modelCount: plan.modelPlan.length,
      supervisorCount: plan.supervisorFleet.length,
      report: repoRel(PATHS.reportMd)
    }
  };
}

function buildShannon(plan, generatedAt) {
  return {
    integrationId: 'neurotech-defense-plan-shannon-consensus',
    generatedAt,
    status: 'consensus_proceed_plan_only',
    consensus: 'PROCEED-PLAN-ONLY',
    executionDisposition: 'no_download_no_install_no_device_access_no_model_execution',
    votes: [
      { part: 'scout', vote: 'PROCEED_PLAN_ONLY', reason: 'Official-source software and dataset lanes identified.' },
      { part: 'evidence', vote: 'PROCEED_PLAN_ONLY', reason: 'Plan includes citations, provenance requirements, and storage roots.' },
      { part: 'executor', vote: 'HALT_EXECUTION', reason: 'No downloads, installs, device access, or model execution are permitted in this tranche.' },
      { part: 'fabric', vote: 'PROCEED_PLAN_ONLY', reason: 'Plan integrated into BEHCS/Hermes/Shannon/report/cube surfaces.' },
      { part: 'voice', vote: 'CLAIM_GUARD_REQUIRED', reason: 'Mind-reading language remains an unverified claim; only consented signal classification is permitted.' },
      { part: 'planner', vote: 'PROCEED_PLAN_ONLY', reason: 'Next safe tranche is storage manifest plus synthetic-data pipeline.' }
    ]
  };
}

function buildCube(plan, shannonPacket, generatedAt) {
  const cube = {
    id: 'neurotech-defense-plan-supervisor',
    generatedAt,
    primaryCatalog: { D: 37, name: 'AUTHORITY', prime: 157 },
    touches: [6, 20, 35, 37, 38, 39, 42, 47],
    gates: ['consent', 'provenance', 'bids', 'claim_guard', 'storage_guard'],
    payload: {
      kind: 'defensive-neurotech-plan',
      status: plan.status,
      mode: MODE,
      neuroRoot,
      softwareCount: plan.softwarePlan.length,
      datasetCount: plan.datasetPlan.length,
      modelCount: plan.modelPlan.length,
      shannon: {
        consensus: shannonPacket.consensus,
        executionDisposition: shannonPacket.executionDisposition
      }
    },
    translate: {
      human: 'Plan consent-based EEG/neurofeedback software and models defensively; do not claim literal mind reading.',
      agent: '(asolaria, neurotech, eeg, consent, defensive, no_download, no_install, plan_only)',
      device: 'node tools/neurotech-defense-plan-supervisor.js tick --execute'
    }
  };
  return `// cube: neurotech-defense-plan-supervisor | neurotech | D37 AUTHORITY
export const CUBE = ${JSON.stringify(cube, null, 2)}
`;
}

function buildReport(plan, shannonPacket, generatedAt) {
  const softwareRows = plan.softwarePlan.map((entry) =>
    `| ${entry.name} | ${entry.disposition} | ${entry.sourceIds.join(', ')} | ${entry.purpose} |`
  ).join('\n');
  const modelRows = plan.modelPlan.map((entry) =>
    `| ${entry.name} | ${entry.family} | ${entry.priority} | ${entry.purpose} |`
  ).join('\n');
  const phaseRows = plan.phases.map((entry) =>
    `| ${entry.id} | ${entry.gate} | ${entry.action} |`
  ).join('\n');
  const sourceRows = plan.sources.map((entry) =>
    `| ${entry.name} | ${entry.url} | ${entry.role} |`
  ).join('\n');

  const md = `# Neurotech Defense Plan

Generated: ${generatedAt}

Status: ${plan.status}

This is a plan-only integration. It did not download, install, launch, access devices, execute models, or create medical claims.

Doctrine: non-invasive, consent-based EEG/neurofeedback and cognitive support only. Literal "mind reading" remains an unverified claim and must not be marketed or treated as proven capability.

Reserve lab root: \`${plan.storage.neuroRoot}\`

## Software Whitelist Plan

| Software | Disposition | Sources | Purpose |
| --- | --- | --- | --- |
${softwareRows}

## Model Plan

| Model Lane | Family | Priority | Purpose |
| --- | --- | --- | --- |
${modelRows}

## Phases

| Phase | Gate | Action |
| --- | --- | --- |
${phaseRows}

## Shannon

- Consensus: ${shannonPacket.consensus}
- Execution: ${shannonPacket.executionDisposition}

## Sources

| Source | URL | Role |
| --- | --- | --- |
${sourceRows}
`;

  return { json: plan, md };
}

function tick({ execute = false } = {}) {
  const generatedAt = new Date().toISOString();
  const plan = buildPlan(generatedAt);
  const hermesPacket = buildHermes(plan, generatedAt);
  const shannonPacket = buildShannon(plan, generatedAt);
  const cube = buildCube(plan, shannonPacket, generatedAt);
  const report = buildReport(plan, shannonPacket, generatedAt);
  const eventId = `neurotech-defense-plan-${Date.now()}`;

  if (execute) {
    writeJson(PATHS.state, {
      savedAt: generatedAt,
      status: plan.status,
      mode: MODE,
      plan: repoRel(PATHS.plan),
      report: repoRel(PATHS.reportMd)
    });
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
      to: 'neurotech-defense',
      verb: 'EVT-NEUROTECH-DEFENSE-PLAN',
      body: { status: plan.status, neuroRoot, report: repoRel(PATHS.reportMd) }
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
      from: 'defensive_neurotech_plan',
      to: 'consent_based_eeg_pipeline',
      verb: 'plan_only_no_download',
      weight: 0.7
    });
  }

  return {
    ok: true,
    action: execute ? 'tick' : 'preview',
    generatedAt,
    status: plan.status,
    neuroRoot,
    softwareCount: plan.softwarePlan.length,
    datasetCount: plan.datasetPlan.length,
    modelCount: plan.modelPlan.length,
    shannon: {
      status: shannonPacket.status,
      consensus: shannonPacket.consensus
    },
    nextTranche: 'storage_manifest_plus_synthetic_pipeline',
    outputs: {
      state: repoRel(PATHS.state),
      plan: repoRel(PATHS.plan),
      hermes: repoRel(PATHS.hermes),
      shannon: repoRel(PATHS.shannon),
      cube: repoRel(PATHS.cube),
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
      'node tools/neurotech-defense-plan-supervisor.js status',
      'node tools/neurotech-defense-plan-supervisor.js tick --execute'
    ]
  }, null, 2));
  process.exitCode = 2;
}

main(process.argv);
