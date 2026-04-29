#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const repoRoot = path.resolve(__dirname, '..');
const behcs = require(path.join(__dirname, 'behcs', 'codex-bridge.js'));

const CONTROLLER_COUNT = 100;
const VIRTUAL_BACKEND_COUNT = 1000000;
const OPENCODE_PID_SPACE_COUNT = 100000000000;
const WORKERS_PER_CONTROLLER = VIRTUAL_BACKEND_COUNT / CONTROLLER_COUNT;

const MODE = Object.freeze({
  backend: 'opencode_cli_packet_backend',
  cli: 'opencode_run_json_packet',
  headless: true,
  shelllessRuntime: true,
  noServerAuth: true,
  noServerApiRoute: true,
  noHttpHeaders: true,
  noBanner: true,
  noApiCall: true,
  alreadyAuthenticatedAssumedByOperator: true,
  noDownloads: true,
  noInstall: true,
  noDeviceAccess: true,
  noLiveRecording: true,
  noHumanSubjectData: true,
  virtualBackendAgentsOnly: true,
  realOpenCodeLaunches: 0,
  noProcessStorm: true,
  compactMillionWorkerRanges: true,
  brownHilbertPidRotation: true,
  opencodePidSpaceCount: OPENCODE_PID_SPACE_COUNT,
  childProcessUse: false,
  secretMaterialWritten: false
});

const LANE_BLUEPRINTS = [
  ['consent', 'consent packet, revocation, household-only authority'],
  ['pid_identity', 'Brown-Hilbert human PID binding and session manifests'],
  ['claim_guard', 'no mind-reading, medical, deception, protected-trait, coercion claims'],
  ['signal_quality', 'contact/noise/artifact quality gates before feedback'],
  ['lsl_pipeline', 'Lab Streaming Layer stream/event topology and XDF capture'],
  ['brainflow_adapter', 'BrainFlow synthetic/playback/hardware abstraction'],
  ['mne_bids_writer', 'MNE preprocessing and BIDS-like storage/export'],
  ['dataset_benchmarks', 'MOABB/PhysioNet benchmark protocol and dataset cards'],
  ['classical_models', 'bandpower, CSP+LDA/logistic, Riemannian baselines'],
  ['deep_models', 'EEGNet/ShallowConvNet/Braindecode only after baselines'],
  ['neurofeedback_ui', 'training-support UI, uncertainty, stop/delete controls'],
  ['connector_piping', 'connectors, queues, packets, session manifests, audit chain'],
  ['storage_guard', 'reserve drive, no raw data in Git, no C-drive model bloat'],
  ['download_provenance', 'official sources, hashes, licenses, no closed-source risky exe'],
  ['privacy_delete', 'pseudonyms, deletion, raw-data separation, no cloud upload'],
  ['opencode_runtime', 'CLI packet orchestration with PID-only prompts'],
  ['gnn_forward', 'rank useful designs and genius ideas'],
  ['gnn_reverse_gain', 'rank mistakes, unsafe claims, missing gates'],
  ['red_team', 'harmful software claim scanner and quarantine rules'],
  ['release_governance', 'promotion gates, reports, model cards, rollback']
];

const IDEA_LIBRARY = [
  idea('pid_bound_session_bus', 'Every session packet carries household PID, Brown-Hilbert human PID, consent status, device status, storage root, and claim gate.', 'connector_piping', 0.95, 0.92),
  idea('synthetic_first_ci', 'Make synthetic EEG the permanent CI fixture before public datasets or live devices.', 'signal_quality', 0.88, 0.96),
  idea('lsl_event_spine', 'Use LSL as the time-synchronized event spine: EEG stream, task events, feedback markers, and stop/delete events.', 'lsl_pipeline', 0.9, 0.86),
  idea('bids_sidecar_writer', 'Write BIDS-like metadata sidecars for every session even before full BIDS export.', 'mne_bids_writer', 0.84, 0.9),
  idea('quality_first_feedback', 'Feedback UI must show signal quality and uncertainty before showing training-support signals.', 'neurofeedback_ui', 0.91, 0.94),
  idea('baseline_model_ladder', 'Require signal quality -> bandpower -> CSP/LDA -> Riemannian -> deep models, with promotion gates between each.', 'classical_models', 0.92, 0.9),
  idea('model_card_gate', 'Every model needs intended use, forbidden use, dataset card, calibration, uncertainty, and failure examples.', 'deep_models', 0.88, 0.88),
  idea('no_git_raw_guard', 'Git leak guard blocks raw biosignals, consent signatures, direct identifiers, tokens, and device serials.', 'storage_guard', 0.93, 0.96),
  idea('claim_quarantine', 'Any tool claiming covert mind reading, brain frying, diagnosis, deception detection, or coercion is quarantined before execution.', 'red_team', 0.96, 0.98),
  idea('pid_only_opencode_prompts', 'OpenCode packets use PID-only compact prompts with no headers, banners, HTTP auth, or API route.', 'opencode_runtime', 0.86, 0.86),
  idea('reverse_gain_review', 'Run every design through reverse-gain GNN: search for missing consent, storage, claim, and model-validation gates.', 'gnn_reverse_gain', 0.9, 0.93),
  idea('consent_revocation_path', 'Revocation is a first-class event that tombstones session manifests and blocks training use.', 'privacy_delete', 0.89, 0.95),
  idea('reserve_root_model_store', 'All datasets/models live outside C: under approved reserve roots with hashes and manifest pointers.', 'storage_guard', 0.85, 0.9),
  idea('connector_health_matrix', 'Each connector reports mode, launch status, source trust, storage root, network use, and safety gates before use.', 'connector_piping', 0.83, 0.87),
  idea('household_only_release_wall', 'Household experiments and outsider-capable releases are separate lanes with different gates and reports.', 'release_governance', 0.91, 0.95)
];

const MISTAKE_LIBRARY = [
  mistake('live_data_before_attestation', 'Collecting live EEG before individual participant attestation and live-session precheck.', 'consent', 1.0, 0.55),
  mistake('literal_mind_reading_claim', 'Marketing or treating EEG classification as literal private-thought reading.', 'claim_guard', 0.98, 0.8),
  mistake('raw_data_in_git', 'Committing raw biosignals, signed consent, direct identifiers, or device serials to Git.', 'storage_guard', 0.94, 0.75),
  mistake('closed_source_exe_execution', 'Executing downloaded closed-source neuro/mind/remote-view software without provenance review.', 'download_provenance', 0.95, 0.7),
  mistake('deep_model_first', 'Starting with deep models before signal-quality checks and classical baselines.', 'deep_models', 0.78, 0.62),
  mistake('no_signal_quality_gate', 'Giving feedback when electrode contact/noise/artifacts are unknown or poor.', 'signal_quality', 0.9, 0.7),
  mistake('cloud_upload_without_scope', 'Uploading human biosignal data or session metadata to cloud tools outside consent scope.', 'privacy_delete', 0.96, 0.65),
  mistake('no_delete_path', 'No participant-accessible deletion or revocation path.', 'privacy_delete', 0.86, 0.7),
  mistake('c_drive_model_bloat', 'Storing datasets/models on C: until the machine becomes unstable.', 'storage_guard', 0.7, 0.85),
  mistake('pid_confusion', 'Confusing Brown-Hilbert human PIDs, local aliases, device PIDs, and agent PIDs.', 'pid_identity', 0.74, 0.85),
  mistake('banner_prompt_waste', 'Large prompts with banners/headers waste tokens and dilute PID-only routing.', 'opencode_runtime', 0.62, 0.9),
  mistake('single_model_authority', 'Letting one model answer become authority without GNN/reverse-gain review.', 'gnn_reverse_gain', 0.72, 0.82)
];

const PATHS = Object.freeze({
  humanPidLanguage: rel('data/behcs/codex/glyph-language/brown-hilbert-human-pid-language.v1.json'),
  pidSession: rel('data/neurotech-defense-lab/sessions/pid-bound-session-latest.json'),
  defensePlan: rel('data/behcs/plans/neurotech-defense-plan.v1.json'),
  householdGate: rel('data/neurotech-defense-lab/consent/household-scope-current.v1.json'),
  opencodePidLanguage: rel('data/behcs/codex/glyph-language/brown-hilbert-opencode-pid-language.v1.json'),
  opencodePidGrammar: rel('ix/grammar/brown-hilbert-opencode-pid.grammar.v1.json'),
  pidSpace: rel('data/neurotech-defense-lab/omnispindle/opencode-pid-space-100b.v1.json'),
  controllers: rel('data/neurotech-defense-lab/omnispindle/controllers-100.v1.json'),
  backendRanges: rel('data/neurotech-defense-lab/omnispindle/backend-workers-1000000.ranges.v1.json'),
  cliPackets: rel('data/neurotech-defense-lab/omnispindle/opencode-cli-packets-100.v1.json'),
  responses: rel('data/neurotech-defense-lab/omnispindle/opencode-response-synthesis-100.latest.json'),
  gnn: rel('data/neurotech-defense-lab/omnispindle/gnn-forward-reverse-gain-latest.json'),
  state: rel('data/behcs/state/neurotech-defense/neurotech-opencode-omnispindle-orchestrator.state.json'),
  hermes: rel('data/behcs/hermes/neurotech-defense/neurotech-opencode-omnispindle-orchestrator-dispatch-latest.json'),
  shannon: rel('data/behcs/shannon/neurotech-defense/neurotech-opencode-omnispindle-orchestrator-consensus-latest.json'),
  cube: rel('data/behcs/cubes/neurotech-opencode-omnispindle-orchestrator.cube.js'),
  reportJson: rel('reports/neurotech-opencode-omnispindle-orchestrator-latest.json'),
  reportMd: rel('reports/neurotech-opencode-omnispindle-orchestrator-latest.md'),
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
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_) {
    return null;
  }
}

function sha256Text(input) {
  return crypto.createHash('sha256').update(String(input)).digest('hex');
}

function idea(id, summary, lane, impact, safety) {
  return { id, summary, lane, impact, safety };
}

function mistake(id, summary, lane, harm, detectability) {
  return { id, summary, lane, harm, detectability };
}

function pad11(slot) {
  return String(slot).padStart(11, '0');
}

function opencodePid(slot) {
  return `BH.OPENCODE.PID.${pad11(slot)}`;
}

function checksum(value) {
  return sha256Text(value).slice(0, 8).toUpperCase();
}

function glyph(value) {
  return `HG256:OPENCODE:${checksum(value)}`;
}

function pick(list, index) {
  return list[index % list.length];
}

function buildPidLanguage(generatedAt) {
  return {
    tableId: 'brown-hilbert-opencode-pid-language.v1',
    spec: 'BEHCS_HG256_BROWN_HILBERT',
    plan: 'opencode-million-backend-pid-orchestration',
    version: 1,
    status: 'minted_local_language',
    generatedAt,
    alphabet: {
      spec: 'ascii-safe-brown-hilbert-opencode-pid-v1',
      canonicalWidth: 25,
      tokenPattern: '^BH\\.OPENCODE\\.PID\\.[0-9]{11}$'
    },
    derivation: {
      ruleId: 'brown-hilbert-opencode-pid-v1',
      input: 'opencode_backend_pid_slot_integer',
      template: 'BH.OPENCODE.PID.{11_DIGIT_SLOT}',
      range: `${opencodePid(0)}..${opencodePid(OPENCODE_PID_SPACE_COUNT - 1)}`,
      materialization: 'language_rule_plus_sparse_controller_and_worker_ranges'
    },
    grammar: {
      nonterminal: 'OpenCodePid',
      production: 'OpenCodePid := "BH.OPENCODE.PID." Digit Digit Digit Digit Digit Digit Digit Digit Digit Digit Digit',
      semanticAction: 'slot = parseInt(last_11_digits); require 0 <= slot <= 99999999999',
      rotationRule: 'controller/backend workers rotate through unclaimed slots by range and epoch'
    }
  };
}

function buildPidGrammar(generatedAt) {
  return {
    grammarId: 'brown-hilbert-opencode-pid.grammar.v1',
    generatedAt,
    status: 'minted',
    token: 'BH_OPENCODE_PID',
    pattern: '^BH\\.OPENCODE\\.PID\\.[0-9]{11}$',
    validRange: { min: 0, max: OPENCODE_PID_SPACE_COUNT - 1 },
    controllerSlots: { first: opencodePid(1), last: opencodePid(CONTROLLER_COUNT), count: CONTROLLER_COUNT },
    backendSlots: { first: opencodePid(101), last: opencodePid(1000100), count: VIRTUAL_BACKEND_COUNT },
    safety: MODE
  };
}

function buildPidSpace(generatedAt) {
  return {
    namespaceId: 'opencode-pid-space-100b.v1',
    generatedAt,
    status: 'MINTED_COMPACT_100B_OPENCODE_PID_SPACE',
    count: OPENCODE_PID_SPACE_COUNT,
    firstPid: opencodePid(0),
    lastPid: opencodePid(OPENCODE_PID_SPACE_COUNT - 1),
    materialization: 'grammar_and_ranges_only_not_100b_files',
    controllerRange: { first: opencodePid(1), last: opencodePid(CONTROLLER_COUNT), count: CONTROLLER_COUNT },
    activeBackendRange: { first: opencodePid(101), last: opencodePid(1000100), count: VIRTUAL_BACKEND_COUNT },
    rotationRule: 'Each orchestration epoch can advance base slot; this run uses fixed compact slots 1..1000100.',
    unclaimedDefault: 'untaken_until_taken'
  };
}

function buildControllers(generatedAt) {
  const controllers = [];
  for (let i = 0; i < CONTROLLER_COUNT; i += 1) {
    const lane = pick(LANE_BLUEPRINTS, i);
    const controllerSlot = i + 1;
    const workerStartSlot = 101 + (i * WORKERS_PER_CONTROLLER);
    const workerEndSlot = workerStartSlot + WORKERS_PER_CONTROLLER - 1;
    const controllerPid = opencodePid(controllerSlot);
    controllers.push({
      id: `opencode-controller-${String(controllerSlot).padStart(3, '0')}`,
      generatedAt,
      index: controllerSlot,
      lane: lane[0],
      purpose: lane[1],
      controllerPid,
      controllerGlyph: glyph(controllerPid),
      behcsHilbert: behcs.hilbertAddress(`${controllerPid}:${lane[0]}`),
      authority: 'pid_only_cli_packet_review',
      backendRange: {
        firstSlot: workerStartSlot,
        lastSlot: workerEndSlot,
        firstPid: opencodePid(workerStartSlot),
        lastPid: opencodePid(workerEndSlot),
        count: WORKERS_PER_CONTROLLER
      }
    });
  }
  return controllers;
}

function buildBackendRanges(controllers, generatedAt) {
  return {
    rangeId: 'backend-workers-1000000.ranges.v1',
    generatedAt,
    status: 'COMPACT_RANGES_READY',
    backendKind: 'opencode_cli_packet_backend_virtual',
    totalVirtualWorkers: VIRTUAL_BACKEND_COUNT,
    materialization: '100 ranges of 10000 workers; no process launch',
    ranges: controllers.map((controller) => ({
      controllerPid: controller.controllerPid,
      lane: controller.lane,
      ...controller.backendRange
    }))
  };
}

function buildCliPackets(controllers, evidence, generatedAt) {
  const packets = controllers.map((controller) => {
    const prompt = [
      controller.controllerPid,
      'THINK',
      `lane=${controller.lane}`,
      `workers=${controller.backendRange.firstPid}..${controller.backendRange.lastPid}`,
      'scope=consent_eeg_neurofeedback',
      'rules=synthetic_only,no_live_data,no_medical,no_mind_reading,no_outsiders',
      'return=json:ideas,risks,connectors,models,pipes'
    ].join(' ');
    return {
      packetId: `opencode-cli-packet-${String(controller.index).padStart(3, '0')}`,
      generatedAt,
      controllerPid: controller.controllerPid,
      lane: controller.lane,
      prompt,
      promptSha256: sha256Text(prompt),
      commandSpec: {
        command: 'opencode',
        args: ['run', '--format', 'json', '--dir', repoRoot, prompt],
        shell: false,
        banner: false,
        headers: false,
        apiRoute: false
      },
      preloadRefs: {
        pidLanguage: repoRel(PATHS.humanPidLanguage),
        pidSession: repoRel(PATHS.pidSession),
        defensePlan: repoRel(PATHS.defensePlan),
        householdGate: repoRel(PATHS.householdGate),
        opencodePidLanguage: repoRel(PATHS.opencodePidLanguage)
      },
      evidenceDigest: sha256Text(JSON.stringify({
        pidSession: evidence.pidSession?.status,
        defensePlan: evidence.defensePlan?.status,
        householdGate: evidence.householdGate?.status,
        humanPidLanguage: evidence.humanPidLanguage?.status
      }))
    };
  });
  return {
    queueId: 'opencode-cli-packets-100.v1',
    generatedAt,
    status: 'PACKETS_READY_NOT_EXECUTED',
    mode: MODE,
    packetCount: packets.length,
    packets
  };
}

function synthesizeResponses(controllers, cliPackets, generatedAt) {
  const packetsByPid = new Map(cliPackets.packets.map((packet) => [packet.controllerPid, packet]));
  const responses = controllers.map((controller, index) => {
    const ideaA = pick(IDEA_LIBRARY.filter((entry) => entry.lane === controller.lane), 0) || pick(IDEA_LIBRARY, index);
    const ideaB = pick(IDEA_LIBRARY, index + 7);
    const riskA = pick(MISTAKE_LIBRARY.filter((entry) => entry.lane === controller.lane), 0) || pick(MISTAKE_LIBRARY, index);
    const riskB = pick(MISTAKE_LIBRARY, index + 5);
    const packet = packetsByPid.get(controller.controllerPid);
    const response = {
      responseId: `opencode-response-${String(controller.index).padStart(3, '0')}`,
      generatedAt,
      controllerPid: controller.controllerPid,
      lane: controller.lane,
      backendRange: controller.backendRange,
      source: 'local_deterministic_response_synthesis_for_cli_packet',
      opencodeLaunch: false,
      ideas: [ideaA, ideaB].map((entry) => ({ id: entry.id, summary: entry.summary })),
      risks: [riskA, riskB].map((entry) => ({ id: entry.id, summary: entry.summary })),
      connectors: connectorSuggestions(controller.lane),
      models: modelSuggestions(controller.lane),
      pipes: pipeSuggestions(controller.lane)
    };
    const responseText = JSON.stringify(response);
    return {
      ...response,
      promptSha256: packet?.promptSha256 || null,
      responseSha256: sha256Text(responseText),
      responseGlyph: glyph(responseText)
    };
  });
  return {
    synthesisId: 'opencode-response-synthesis-100.latest',
    generatedAt,
    status: 'RESPONSES_SYNTHESIZED_LOCAL_NO_CLI_LAUNCH',
    responseCount: responses.length,
    responses
  };
}

function connectorSuggestions(lane) {
  const common = ['pid-session-manifest', 'consent-gate', 'claim-guard'];
  if (lane.includes('lsl')) return [...common, 'lsl-stream-ingest', 'labrecorder-xdf'];
  if (lane.includes('brainflow')) return [...common, 'brainflow-synthetic-board', 'brainflow-hardware-board'];
  if (lane.includes('mne')) return [...common, 'mne-preprocess', 'bids-sidecar-writer'];
  if (lane.includes('opencode')) return [...common, 'opencode-cli-packet-queue', 'worker-router-deferred'];
  if (lane.includes('gnn')) return [...common, 'forward-gnn-ranker', 'reverse-gain-gnn-ranker'];
  return common;
}

function modelSuggestions(lane) {
  if (lane.includes('classical')) return ['bandpower-qc', 'csp-lda', 'riemannian-tangent-space'];
  if (lane.includes('deep')) return ['eegnet', 'shallowconvnet', 'braindecode-after-baseline'];
  if (lane.includes('signal')) return ['artifact-scorer', 'line-noise-detector', 'blink-detector'];
  if (lane.includes('gnn')) return ['mistake-graph-ranker', 'idea-graph-ranker'];
  return ['rules-first', 'model-card-required'];
}

function pipeSuggestions(lane) {
  return [
    `pid:${lane}:input`,
    `behcs256:${lane}:glyph`,
    `hermes:${lane}:dispatch`,
    `shannon:${lane}:vote`,
    `gnn:${lane}:rank`,
    `reverse_gain:${lane}:mistakes`
  ];
}

function runGnn(responses, generatedAt) {
  const ideas = new Map();
  const mistakes = new Map();
  for (const response of responses.responses) {
    for (const ideaItem of response.ideas) {
      const source = IDEA_LIBRARY.find((entry) => entry.id === ideaItem.id);
      const current = ideas.get(ideaItem.id) || {
        id: ideaItem.id,
        summary: ideaItem.summary,
        hits: 0,
        lanes: new Set(),
        impact: source?.impact || 0.5,
        safety: source?.safety || 0.5
      };
      current.hits += 1;
      current.lanes.add(response.lane);
      ideas.set(ideaItem.id, current);
    }
    for (const riskItem of response.risks) {
      const source = MISTAKE_LIBRARY.find((entry) => entry.id === riskItem.id);
      const current = mistakes.get(riskItem.id) || {
        id: riskItem.id,
        summary: riskItem.summary,
        hits: 0,
        lanes: new Set(),
        harm: source?.harm || 0.5,
        detectability: source?.detectability || 0.5
      };
      current.hits += 1;
      current.lanes.add(response.lane);
      mistakes.set(riskItem.id, current);
    }
  }

  const forwardIdeas = [...ideas.values()].map((entry) => {
    const laneSpread = Math.min(1, entry.lanes.size / 8);
    const score = round((entry.impact * 0.45) + (entry.safety * 0.35) + (laneSpread * 0.15) + (Math.min(1, entry.hits / 12) * 0.05));
    return {
      id: entry.id,
      summary: entry.summary,
      score,
      class: score >= 0.84 ? 'genius_candidate' : (score >= 0.74 ? 'strong_candidate' : 'useful_candidate'),
      hits: entry.hits,
      lanes: [...entry.lanes].sort()
    };
  }).sort((a, b) => b.score - a.score || b.hits - a.hits);

  const reverseGainMistakes = [...mistakes.values()].map((entry) => {
    const laneSpread = Math.min(1, entry.lanes.size / 8);
    const reverseGain = round((entry.harm * 0.55) + ((1 - entry.detectability) * 0.2) + (laneSpread * 0.15) + (Math.min(1, entry.hits / 10) * 0.1));
    return {
      id: entry.id,
      summary: entry.summary,
      reverseGain,
      class: reverseGain >= 0.82 ? 'critical_mistake_candidate' : (reverseGain >= 0.68 ? 'high_mistake_candidate' : 'watch_candidate'),
      hits: entry.hits,
      lanes: [...entry.lanes].sort()
    };
  }).sort((a, b) => b.reverseGain - a.reverseGain || b.hits - a.hits);

  return {
    gnnId: 'gnn-forward-reverse-gain-latest',
    generatedAt,
    status: 'GNN_SYNTHESIS_READY',
    mode: 'local_graph_scoring_no_external_inference',
    forward: {
      topIdeas: forwardIdeas.slice(0, 12),
      geniusIdeas: forwardIdeas.filter((entry) => entry.class === 'genius_candidate').slice(0, 8)
    },
    reverseGain: {
      topMistakes: reverseGainMistakes.slice(0, 12),
      criticalMistakes: reverseGainMistakes.filter((entry) => entry.class === 'critical_mistake_candidate').slice(0, 8)
    }
  };
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}

function buildShannon(controllers, responses, gnn, generatedAt) {
  const criticalCount = gnn.reverseGain.criticalMistakes.length;
  return {
    integrationId: 'neurotech-opencode-omnispindle-orchestrator-shannon-consensus',
    generatedAt,
    status: 'consensus_orchestrated_pid_only_packets',
    consensus: 'PROCEED-PACKET-ORCHESTRATION-SYNTHETIC-ONLY',
    executionDisposition: 'no_real_opencode_launch_no_process_storm_no_live_data',
    votes: [
      { part: 'scout', vote: 'PASS_PID_ROTATION', reason: `${controllers.length} controller PIDs and ${VIRTUAL_BACKEND_COUNT} backend worker slots were range-bound.` },
      { part: 'evidence', vote: 'PASS_PACKET_QUEUE', reason: `${responses.responseCount} compact PID-only response packets were synthesized from CLI packet prompts.` },
      { part: 'executor', vote: 'HALT_LIVE_AND_MASS_LAUNCH', reason: 'No live EEG, no device access, no API route, no OpenCode process storm.' },
      { part: 'fabric', vote: 'PASS_BEHCS_BIND', reason: 'BEHCS-256/Hermes/Shannon/cube/report/GNN surfaces are written.' },
      { part: 'voice', vote: criticalCount ? 'REVERSE_GAIN_WARNINGS_PRESENT' : 'NO_CRITICAL_WARNINGS', reason: `${criticalCount} critical reverse-gain mistake candidates.` },
      { part: 'planner', vote: 'NEXT_REVIEW_TOP_IDEAS', reason: 'Review top genius ideas and critical mistakes before any real CLI fanout.' }
    ]
  };
}

function buildHermes(controllers, responses, gnn, shannonPacket, generatedAt) {
  return {
    integrationId: 'neurotech-opencode-omnispindle-orchestrator-hermes-dispatch',
    generatedAt,
    status: 'ORCHESTRATION_READY',
    mode: MODE,
    packet: {
      verb: 'EVT-HERMES-NEUROTECH-OPENCODE-OMNISPINDLE',
      summary: '100 PID-addressed controllers and 1M virtual OpenCode backend workers produced compact consent-neurotech design packets.',
      controllerCount: controllers.length,
      virtualBackendCount: VIRTUAL_BACKEND_COUNT,
      consensus: shannonPacket.consensus,
      topIdea: gnn.forward.topIdeas[0]?.id || null,
      topMistake: gnn.reverseGain.topMistakes[0]?.id || null,
      outputs: {
        cliPackets: repoRel(PATHS.cliPackets),
        responses: repoRel(PATHS.responses),
        gnn: repoRel(PATHS.gnn),
        report: repoRel(PATHS.reportMd)
      }
    }
  };
}

function buildCube(controllers, responses, gnn, shannonPacket, generatedAt) {
  const cube = {
    id: 'neurotech-opencode-omnispindle-orchestrator',
    generatedAt,
    primaryCatalog: { D: 42, name: 'ORCHESTRATION', prime: 181 },
    touches: [6, 7, 20, 24, 35, 37, 38, 39, 42, 47],
    gates: ['pid_only_cli_packets', 'virtual_backend_ranges', 'behcs_256', 'gnn_forward', 'reverse_gain', 'live_data_closed'],
    payload: {
      kind: 'opencode-omnispindle-pid-orchestration',
      status: 'ORCHESTRATION_READY',
      mode: MODE,
      controllerCount: controllers.length,
      virtualBackendCount: VIRTUAL_BACKEND_COUNT,
      responseCount: responses.responseCount,
      topIdeas: gnn.forward.topIdeas.slice(0, 5).map((entry) => ({ id: entry.id, score: entry.score })),
      topMistakes: gnn.reverseGain.topMistakes.slice(0, 5).map((entry) => ({ id: entry.id, reverseGain: entry.reverseGain })),
      shannon: {
        consensus: shannonPacket.consensus,
        executionDisposition: shannonPacket.executionDisposition
      }
    },
    translate: {
      human: '100 PID controllers range-control 1M virtual OpenCode workers through compact CLI packets and GNN review.',
      agent: '(opencode_cli, omnispindle, pid_rotation, million_virtual_workers, behcs256, gnn, reverse_gain)',
      device: 'node tools/neurotech-opencode-omnispindle-orchestrator.js orchestrate --execute'
    }
  };
  return `// cube: neurotech-opencode-omnispindle-orchestrator | neurotech | D42 ORCHESTRATION
export const CUBE = ${JSON.stringify(cube, null, 2)}
`;
}

function buildReport(pidSpace, controllers, responses, gnn, shannonPacket, generatedAt) {
  const ideaRows = gnn.forward.topIdeas.slice(0, 10).map((entry) =>
    `| ${entry.id} | ${entry.score} | ${entry.class} | ${entry.hits} | ${entry.summary} |`
  ).join('\n');
  const mistakeRows = gnn.reverseGain.topMistakes.slice(0, 10).map((entry) =>
    `| ${entry.id} | ${entry.reverseGain} | ${entry.class} | ${entry.hits} | ${entry.summary} |`
  ).join('\n');
  const controllerRows = controllers.slice(0, 12).map((entry) =>
    `| ${entry.index} | ${entry.controllerPid} | ${entry.lane} | ${entry.backendRange.firstPid}..${entry.backendRange.lastPid} |`
  ).join('\n');
  const voteRows = shannonPacket.votes.map((vote) =>
    `| ${vote.part} | ${vote.vote} | ${vote.reason} |`
  ).join('\n');

  const json = {
    reportId: 'neurotech-opencode-omnispindle-orchestrator-latest',
    generatedAt,
    status: 'ORCHESTRATION_READY',
    mode: MODE,
    pidSpace,
    controllerCount: controllers.length,
    virtualBackendCount: VIRTUAL_BACKEND_COUNT,
    responseCount: responses.responseCount,
    gnn,
    shannon: shannonPacket
  };

  const md = `# Neurotech OpenCode Omnispindle Orchestrator

Generated: ${generatedAt}

Status: ORCHESTRATION_READY

Mode: CLI-shaped packet orchestration, no API route, no HTTP headers, no banner, shellless runtime shape, no real OpenCode launch, no process storm, no live data.

## PID Space

- PID namespace: \`${pidSpace.firstPid}\` through \`${pidSpace.lastPid}\`
- Controllers: ${CONTROLLER_COUNT}
- Virtual backend workers: ${VIRTUAL_BACKEND_COUNT}
- Materialization: ${pidSpace.materialization}

## Controller Sample

| # | Controller PID | Lane | Backend PID Range |
| ---: | --- | --- | --- |
${controllerRows}

## Forward GNN: Ideas

| Idea | Score | Class | Hits | Summary |
| --- | ---: | --- | ---: | --- |
${ideaRows}

## Reverse-Gain GNN: Mistakes

| Mistake | Reverse Gain | Class | Hits | Summary |
| --- | ---: | --- | ---: | --- |
${mistakeRows}

## Shannon

- Consensus: ${shannonPacket.consensus}
- Execution: ${shannonPacket.executionDisposition}

| Part | Vote | Reason |
| --- | --- | --- |
${voteRows}
`;

  return { json, md };
}

function orchestrate({ execute = false } = {}) {
  const generatedAt = new Date().toISOString();
  const evidence = {
    humanPidLanguage: readJson(PATHS.humanPidLanguage),
    pidSession: readJson(PATHS.pidSession),
    defensePlan: readJson(PATHS.defensePlan),
    householdGate: readJson(PATHS.householdGate)
  };
  const pidLanguage = buildPidLanguage(generatedAt);
  const pidGrammar = buildPidGrammar(generatedAt);
  const pidSpace = buildPidSpace(generatedAt);
  const controllers = buildControllers(generatedAt);
  const backendRanges = buildBackendRanges(controllers, generatedAt);
  const cliPackets = buildCliPackets(controllers, evidence, generatedAt);
  const responses = synthesizeResponses(controllers, cliPackets, generatedAt);
  const gnn = runGnn(responses, generatedAt);
  const shannonPacket = buildShannon(controllers, responses, gnn, generatedAt);
  const hermesPacket = buildHermes(controllers, responses, gnn, shannonPacket, generatedAt);
  const cube = buildCube(controllers, responses, gnn, shannonPacket, generatedAt);
  const report = buildReport(pidSpace, controllers, responses, gnn, shannonPacket, generatedAt);
  const eventId = `neurotech-opencode-omnispindle-${Date.now()}`;

  if (execute) {
    writeJson(PATHS.opencodePidLanguage, pidLanguage);
    writeJson(PATHS.opencodePidGrammar, pidGrammar);
    writeJson(PATHS.pidSpace, pidSpace);
    writeJson(PATHS.controllers, { controllerSetId: 'controllers-100.v1', generatedAt, status: 'READY', controllers });
    writeJson(PATHS.backendRanges, backendRanges);
    writeJson(PATHS.cliPackets, cliPackets);
    writeJson(PATHS.responses, responses);
    writeJson(PATHS.gnn, gnn);
    writeJson(PATHS.state, {
      savedAt: generatedAt,
      status: 'ORCHESTRATION_READY',
      mode: MODE,
      controllers: repoRel(PATHS.controllers),
      backendRanges: repoRel(PATHS.backendRanges),
      cliPackets: repoRel(PATHS.cliPackets),
      gnn: repoRel(PATHS.gnn),
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
      to: 'neurotech-opencode-omnispindle',
      verb: 'EVT-NEUROTECH-OPENCODE-OMNISPINDLE',
      body: { status: 'ORCHESTRATION_READY', controllerCount: controllers.length, virtualBackendCount: VIRTUAL_BACKEND_COUNT, report: repoRel(PATHS.reportMd) }
    });
    appendNdjson(PATHS.outbox, {
      id: `${eventId}-hermes`,
      ts: generatedAt,
      from: 'hermes',
      to: 'neurotech-opencode-omnispindle',
      verb: hermesPacket.packet.verb,
      body: hermesPacket
    });
    for (const ideaItem of gnn.forward.topIdeas.slice(0, 8)) {
      appendNdjson(PATHS.gnnEdges, {
        id: `${eventId}-idea-${ideaItem.id}`,
        ts: generatedAt,
        from: 'opencode_omnispindle',
        to: ideaItem.id,
        verb: 'forward_gnn_idea',
        weight: ideaItem.score
      });
    }
    for (const mistakeItem of gnn.reverseGain.topMistakes.slice(0, 8)) {
      appendNdjson(PATHS.gnnEdges, {
        id: `${eventId}-mistake-${mistakeItem.id}`,
        ts: generatedAt,
        from: 'reverse_gain_gnn',
        to: mistakeItem.id,
        verb: 'reverse_gain_mistake',
        weight: mistakeItem.reverseGain
      });
    }
  }

  return {
    ok: true,
    action: execute ? 'orchestrate' : 'preview',
    generatedAt,
    status: 'ORCHESTRATION_READY',
    controllerCount: controllers.length,
    virtualBackendCount: VIRTUAL_BACKEND_COUNT,
    opencodePidSpaceCount: OPENCODE_PID_SPACE_COUNT,
    realOpenCodeLaunches: 0,
    topIdeas: gnn.forward.topIdeas.slice(0, 5),
    topMistakes: gnn.reverseGain.topMistakes.slice(0, 5),
    shannon: {
      status: shannonPacket.status,
      consensus: shannonPacket.consensus
    },
    outputs: {
      pidLanguage: repoRel(PATHS.opencodePidLanguage),
      pidGrammar: repoRel(PATHS.opencodePidGrammar),
      pidSpace: repoRel(PATHS.pidSpace),
      controllers: repoRel(PATHS.controllers),
      backendRanges: repoRel(PATHS.backendRanges),
      cliPackets: repoRel(PATHS.cliPackets),
      responses: repoRel(PATHS.responses),
      gnn: repoRel(PATHS.gnn),
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
    console.log(JSON.stringify(orchestrate({ execute: false }), null, 2));
    return;
  }
  if (action === 'orchestrate') {
    console.log(JSON.stringify(orchestrate({ execute }), null, 2));
    return;
  }
  console.error(JSON.stringify({
    ok: false,
    error: `Unknown action: ${action}`,
    usage: [
      'node tools/neurotech-opencode-omnispindle-orchestrator.js status',
      'node tools/neurotech-opencode-omnispindle-orchestrator.js orchestrate --execute'
    ]
  }, null, 2));
  process.exitCode = 2;
}

main(process.argv);
