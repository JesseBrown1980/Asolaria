#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const behcs = require('./behcs/codex-bridge');

const ROOT = path.resolve(__dirname, '..');
const ORCH_RUN = 'openclaw-424-room-execution-orchestration-20260426';
const WAVE_ID = 'wave-03';
const WAVE_ROOT = rel(`data/behcs/orchestration/${ORCH_RUN}/wave-execution/${WAVE_ID}`);
const ROOM_RUN_ROOT = rel(`data/behcs/orchestration/${ORCH_RUN}`);
const WAVE02_ROOT = rel(`data/behcs/orchestration/${ORCH_RUN}/wave-execution/wave-02`);

const SOURCE_PATHS = Object.freeze({
  tickets: rel(`data/behcs/orchestration/${ORCH_RUN}/executor-dispatch-tickets.v1.json`),
  dispatchQueue: rel(`data/behcs/orchestration/${ORCH_RUN}/room-execution-supervisor-queue.ndjson`),
  dispatchDecisions: rel(`data/behcs/orchestration/${ORCH_RUN}/supervisor-decisions-latest.ndjson`),
  dispatchWorkerReady: rel(`data/behcs/orchestration/${ORCH_RUN}/supervisor-worker-ready-latest.ndjson`),
  taxonomy: path.join(WAVE02_ROOT, 'diff-taxonomy.v1.json'),
  ownership: path.join(WAVE02_ROOT, 'ownership-table.v1.json'),
  reviewQueue: path.join(WAVE02_ROOT, 'review-boundary-queue.v1.ndjson'),
  deepCascadeVote: rel('data/votes/V6-OPENCLAW-424-WAVE03-SECOND-CASCADE/behcs-v6-candidate-file.json'),
  modelCard: rel('data/behcs/orchestration/openclaw-v2026-4-24-ingestion-20260426/model-cards/openclaw-v2026-4-24-ingestion.model-card.v1.json')
});

const PATHS = Object.freeze({
  waveRoot: WAVE_ROOT,
  phaseSupervisorBindings: path.join(WAVE_ROOT, 'phase-supervisor-bindings.v1.json'),
  phaseSupervisorBindingsNdjson: path.join(WAVE_ROOT, 'phase-supervisor-bindings.v1.ndjson'),
  providerAuthBoundaries: path.join(WAVE_ROOT, 'provider-auth-boundaries.v1.json'),
  providerAuthBoundariesNdjson: path.join(WAVE_ROOT, 'provider-auth-boundaries.v1.ndjson'),
  reverseGainQueue: path.join(WAVE_ROOT, 'reverse-gain-auth-review-queue.v1.ndjson'),
  deepCascadeInput: path.join(WAVE_ROOT, 'deep-wave-second-cascade-input.v1.json'),
  deepCascadeResult: path.join(WAVE_ROOT, 'deep-wave-second-cascade-result.v1.json'),
  taskResults: path.join(WAVE_ROOT, 'execution-task-results.v1.ndjson'),
  executionResult: path.join(WAVE_ROOT, 'execution-result.v1.json'),
  completionSupervisorQueue: path.join(WAVE_ROOT, 'completion-supervisor-queue.ndjson'),
  memory: rel('data/behcs/memory/openclaw-424-wave-03-supervisor-auth-boundary.v1.json'),
  index: rel('data/behcs/index/openclaw-424-wave-03-supervisor-auth-boundary-index.v1.json'),
  map: rel('data/behcs/maps/asolaria/openclaw-424-wave-03-supervisor-auth-boundary-map-map-mapped.v1.json'),
  cube: rel('data/behcs/cubes/openclaw-424-wave-03-supervisor-auth-boundary-cube-cubed.cube.js'),
  glpj: rel('data/behcs/codex/glyph-language/openclaw-424-wave-03-supervisor-auth-boundary-behcs256.glpj.json'),
  reportJson: rel('reports/openclaw-424-wave-03-supervisor-auth-boundary-latest.json'),
  reportMd: rel('reports/openclaw-424-wave-03-supervisor-auth-boundary-latest.md'),
  globalInbox: rel('data/behcs/inbox.ndjson'),
  gnnEdges: rel('data/behcs/gnn-live-edges.ndjson')
});

const PROVIDER_RULES = Object.freeze({
  claude: {
    match: /\b(anthropic|claude)\b/,
    legitimateRoutes: ['existing_local_cli_session', 'configured_provider_connector_with_existing_credential'],
    localFallback: 'codex_or_local_model_lane'
  },
  openai: {
    match: /\b(openai|gpt|chatgpt)\b/,
    legitimateRoutes: ['configured_provider_connector_with_existing_credential', 'local_docs_only_when_no_credential'],
    localFallback: 'local_planning_only'
  },
  google_gemini: {
    match: /\b(gemini|vertex|google)\b/,
    legitimateRoutes: ['configured_google_or_vertex_credential', 'local_docs_only_when_no_credential'],
    localFallback: 'local_planning_only'
  },
  opencode: {
    match: /\b(opencode|open-code)\b/,
    legitimateRoutes: ['existing_opencode_install_and_account_state', 'local_smoke_only_without_model_call'],
    localFallback: 'local_runner_dry_run'
  },
  deepseek: {
    match: /\bdeepseek\b/,
    legitimateRoutes: ['configured_provider_connector_with_existing_credential'],
    localFallback: 'local_planning_only'
  },
  local_model: {
    match: /\b(ollama|lmstudio|lm-studio|local[-_ ]model)\b/,
    legitimateRoutes: ['local_loopback_model_runtime', 'offline_model_manifest'],
    localFallback: 'local_model_disabled_if_runtime_absent'
  },
  generic_provider: {
    match: /\b(api|provider|model|llm|runtime|connector)\b/,
    legitimateRoutes: ['explicit_connector_configuration', 'local_noop_or_fixture_when_absent'],
    localFallback: 'local_fixture_only'
  },
  auth_secret_surface: {
    match: /\b(auth|oauth|token|secret|credential|key|session|cookie|billing|rate[-_ ]?limit)\b/,
    legitimateRoutes: ['redacted_existing_secret_lookup_only', 'no_secret_material_in_artifacts'],
    localFallback: 'hold_until_operator_supplies_legitimate_existing_credential'
  }
});

function rel(p) {
  return path.join(ROOT, p);
}

function repoRel(p) {
  return path.relative(ROOT, p).replace(/\\/g, '/');
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeJson(filePath, data) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function writeText(filePath, text) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, text.endsWith('\n') ? text : `${text}\n`, 'utf8');
}

function writeNdjson(filePath, rows) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, rows.map((row) => JSON.stringify(row)).join('\n') + (rows.length ? '\n' : ''), 'utf8');
}

function appendNdjson(filePath, row) {
  ensureDir(filePath);
  fs.appendFileSync(filePath, `${JSON.stringify(row)}\n`, 'utf8');
}

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_) {
    return fallback;
  }
}

function readNdjson(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function glyph(kind, id, seed = '') {
  const hash = sha256(`${kind}:${id}:${seed}`);
  return `HG256:${kind.toUpperCase()}:${hash.slice(0, 8).toUpperCase()}:${behcs.hilbertAddress(hash)}`;
}

function loadInputs() {
  const ticketDoc = readJson(SOURCE_PATHS.tickets, { tickets: [] });
  const tickets = Array.isArray(ticketDoc.tickets) ? ticketDoc.tickets : [];
  const taxonomyDoc = readJson(SOURCE_PATHS.taxonomy, { rows: [] });
  const ownershipDoc = readJson(SOURCE_PATHS.ownership, { ownershipRows: [] });
  return {
    tickets,
    waveTickets: tickets.filter((ticket) => ticket.waveId === WAVE_ID),
    dispatchQueue: readNdjson(SOURCE_PATHS.dispatchQueue),
    dispatchDecisions: readNdjson(SOURCE_PATHS.dispatchDecisions),
    dispatchWorkerReady: readNdjson(SOURCE_PATHS.dispatchWorkerReady),
    taxonomyRows: Array.isArray(taxonomyDoc.rows) ? taxonomyDoc.rows : [],
    ownershipRows: Array.isArray(ownershipDoc.ownershipRows) ? ownershipDoc.ownershipRows : [],
    reviewQueueRows: readNdjson(SOURCE_PATHS.reviewQueue),
    deepCascadeVote: readJson(SOURCE_PATHS.deepCascadeVote, null),
    modelCard: readJson(SOURCE_PATHS.modelCard, {})
  };
}

function buildPhaseSupervisorBindings(inputs, generatedAt) {
  const decisionByPacket = new Map(inputs.dispatchDecisions.map((decision) => [decision.packetId, decision]));
  const workerReadyByPacket = new Map(inputs.dispatchWorkerReady.map((packet) => [packet.packetId, packet]));
  return inputs.tickets.map((ticket) => {
    const packetId = `ASO-ROOM-EXEC-DISPATCH-${ticket.phaseId}`;
    const decision = decisionByPacket.get(packetId) || {};
    const workerReady = workerReadyByPacket.get(packetId) || {};
    return {
      id: `phase-supervisor-${ticket.phaseId}`,
      generatedAt,
      packetId,
      phaseId: ticket.phaseId,
      executorId: ticket.executorId,
      namedAgent: ticket.namedAgent,
      owner: ticket.owner,
      cascade: ticket.cascade,
      rooms: ticket.brownHilbertRooms,
      decision: decision.decision || 'MISSING_DECISION',
      workerReady: Boolean(workerReady.id),
      supervisorDecisionId: workerReady.supervisorDecisionId || decision.id || '',
      supervisorDecisionSha256: workerReady.supervisorDecisionSha256 || decision.sha256 || '',
      modelCardRequired: true,
      sourceDiffRequired: true,
      acceptanceGates: ticket.acceptanceGates || [],
      hardBlocks: decision.hardBlocks || [],
      evidenceRequests: decision.evidenceRequests || [],
      route: decision.workerReady ? 'ready_for_worker_dispatch' : 'hold',
      behcs256: {
        glyph: glyph('phase_supervisor_binding', ticket.phaseId, `${decision.decision}:${ticket.executorId}`),
        programSentence: `SUPERVISE_PHASE ${ticket.phaseId} EXECUTOR ${ticket.executorId} DECISION ${decision.decision || 'MISSING'} ROOM ${ticket.brownHilbertRooms?.supervisorRoom || 'UNBOUND'}`
      }
    };
  });
}

function detectProviders(row) {
  const text = `${row.file || ''} ${row.category || ''} ${(row.reviewFlags || []).join(' ')}`.toLowerCase();
  const matched = [];
  for (const [provider, rule] of Object.entries(PROVIDER_RULES)) {
    if (rule.match.test(text)) matched.push(provider);
  }
  if (matched.length < 1 && (row.reviewFlags || []).includes('provider_auth_boundary_review')) {
    matched.push('generic_provider');
  }
  return Array.from(new Set(matched));
}

function buildProviderBoundaries(rows, generatedAt) {
  const providerRows = [];
  for (const row of rows) {
    const providers = detectProviders(row);
    for (const provider of providers) {
      providerRows.push({ provider, row });
    }
  }
  const grouped = new Map();
  for (const entry of providerRows) {
    if (!grouped.has(entry.provider)) grouped.set(entry.provider, []);
    grouped.get(entry.provider).push(entry.row);
  }
  return Array.from(grouped.entries())
    .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]))
    .map(([provider, rowsForProvider]) => {
      const rule = PROVIDER_RULES[provider] || PROVIDER_RULES.generic_provider;
      const categories = countValues(rowsForProvider.map((row) => row.category));
      const phases = countValues(rowsForProvider.map((row) => row.targetPhase));
      return {
        id: `provider-boundary-${provider}`,
        generatedAt,
        provider,
        rowCount: rowsForProvider.length,
        categories,
        targetPhases: phases,
        legitimateRoutes: rule.legitimateRoutes,
        localFallback: rule.localFallback,
        requiredControls: [
          'explicit_existing_credential_or_authenticated_local_session',
          'redacted_error_and_billing_logging',
          'no_secret_material_in_prompts_or_artifacts',
          'no_auth_bypass',
          'no_payment_or_rate_limit_bypass',
          'fixture_or_noop_when_legitimate_route_absent',
          'reverse_gain_review_before_code_edits'
        ],
        blockedControls: [
          'provider_auth_bypass',
          'payment_bypass',
          'rate_limit_bypass',
          'secret_extraction',
          'header_stripping_when_provider_requires_headers',
          'unauthorized_cloud_worker_dispatch'
        ],
        sampleFiles: rowsForProvider.slice(0, 20).map((row) => row.file),
        behcs256: {
          glyph: glyph('provider_auth_boundary', provider, String(rowsForProvider.length)),
          programSentence: `BOUND_PROVIDER ${provider} ROWS ${rowsForProvider.length} ROUTES ${rule.legitimateRoutes.join('+')} FALLBACK ${rule.localFallback}`
        }
      };
    });
}

function countValues(values) {
  const counts = {};
  for (const value of values) {
    const key = value || 'unknown';
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([id, count]) => ({ id, count }));
}

function buildReverseGainQueue(rows) {
  return rows
    .filter((row) => {
      const flags = row.reviewFlags || [];
      return flags.includes('provider_auth_boundary_review') || flags.includes('reverse_gain_security_review');
    })
    .map((row, index) => ({
      id: `reverse-gain-auth-${String(index + 1).padStart(5, '0')}`,
      file: row.file,
      status: row.status,
      category: row.category,
      primaryOwner: row.primaryOwner,
      targetPhase: row.targetPhase,
      reviewFlags: row.reviewFlags,
      requiredBeforeCodeEdit: true,
      boundary: 'no_auth_payment_rate_limit_or_secret_bypass',
      glyph: glyph('reverse_gain_auth_row', row.file, `${row.category}:${row.status}`)
    }));
}

function buildTaskResults(inputs, summary) {
  return inputs.waveTickets.flatMap((ticket) => (ticket.tasks || []).map((task) => ({
    taskId: task.taskId,
    phaseId: task.phaseId,
    executorId: ticket.executorId,
    namedAgent: ticket.namedAgent,
    owner: task.owner,
    title: task.title,
    status: 'COMPLETED_LOCAL_SUPERVISOR_AUTH_RAIL_BUILD',
    evidence: {
      phaseSupervisorBindings: summary.phaseSupervisorBindings,
      providerBoundaries: summary.providerBoundaries,
      reverseGainRows: summary.reverseGainRows,
      report: repoRel(PATHS.reportMd)
    }
  })));
}

function buildMap(phaseBindings, providerBoundaries, generatedAt) {
  const nodes = [];
  const edges = [];
  for (const binding of phaseBindings) {
    nodes.push({ id: binding.phaseId, kind: 'execution_phase', decision: binding.decision });
    nodes.push({ id: binding.executorId, kind: 'executor', owner: binding.owner });
    nodes.push({ id: binding.rooms?.supervisorRoom || `${binding.phaseId}:supervisor`, kind: 'supervisor_room' });
    edges.push({ from: binding.executorId, to: binding.phaseId, relation: 'executes_phase' });
    edges.push({ from: binding.rooms?.supervisorRoom || `${binding.phaseId}:supervisor`, to: binding.phaseId, relation: 'supervises_phase' });
  }
  for (const boundary of providerBoundaries) {
    nodes.push({ id: boundary.provider, kind: 'provider_boundary', rowCount: boundary.rowCount });
    for (const phase of boundary.targetPhases.slice(0, 6)) {
      edges.push({ from: boundary.provider, to: phase.id, relation: 'requires_auth_boundary', count: phase.count });
    }
  }
  return {
    mapId: 'openclaw-424-wave-03-supervisor-auth-boundary-map-map-mapped.v1',
    generatedAt,
    status: 'MAP_MAP_MAPPED',
    nodeCount: nodes.length,
    edgeCount: edges.length,
    nodes,
    edges
  };
}

function buildCompletionQueue(inputs, summary) {
  return inputs.waveTickets.map((ticket) => ({
    id: `ASO-WAVE-COMPLETE-${WAVE_ID}-${ticket.phaseId}`,
    title: `Wave 03 completion proof for ${ticket.namedAgent}`,
    objective: `Review ${ticket.phaseId} output for supervisor/auth rail build. Phase bindings=${summary.phaseSupervisorBindings}, provider boundaries=${summary.providerBoundaries}, reverse-gain rows=${summary.reverseGainRows}.`,
    requestedWorker: `local_wave_completion_reviewer:${ticket.namedAgent}`,
    instructions: `WAVE_EXECUTED ${WAVE_ID} EXECUTOR ${ticket.executorId} STATUS ${summary.status} SUPERVISORS ${summary.phaseSupervisorBindings} PROVIDERS ${summary.providerBoundaries} REVERSE_GAIN ${summary.reverseGainRows}`,
    pid: `BH.WAVE.COMPLETE.WAVE-03.${ticket.phaseId.toUpperCase().replace(/[^A-Z0-9]+/g, '.')}`,
    pidScope: 'local_wave_completion_only',
    consentScope: 'operator_authorized_local_orchestration',
    allowedPaths: ticket.allowedPaths,
    expectedArtifacts: [
      repoRel(PATHS.phaseSupervisorBindings),
      repoRel(PATHS.providerAuthBoundaries),
      repoRel(PATHS.reverseGainQueue),
      repoRel(PATHS.deepCascadeInput),
      repoRel(PATHS.deepCascadeResult),
      repoRel(PATHS.memory),
      repoRel(PATHS.index),
      repoRel(PATHS.map),
      repoRel(PATHS.cube),
      repoRel(PATHS.glpj),
      repoRel(PATHS.reportMd)
    ],
    acceptanceGates: [
      'all_20_phase_supervisor_bindings_present',
      'provider_auth_boundary_rows_present',
      'reverse_gain_auth_review_queue_present',
      'no_auth_payment_rate_limit_bypass',
      'no_secret_material_in_artifacts',
      'BEHCS_mints_present'
    ],
    proofRequired: true,
    proofRefs: [
      repoRel(PATHS.phaseSupervisorBindings),
      repoRel(PATHS.providerAuthBoundaries),
      repoRel(PATHS.reverseGainQueue),
      repoRel(SOURCE_PATHS.modelCard)
    ],
    operatorApproval: true,
    syntheticFirstEvidence: true,
    modelCard: true,
    externalApiCall: false,
    cloudUpload: false,
    remoteMutation: false,
    deviceAccess: false,
    liveEeg: false,
    liveHumanData: false,
    downloads: false,
    installs: false,
    writesGit: false,
    bypassAuth: false,
    bypassPayment: false,
    needsCloudWorker: false,
    taskType: 'brown_hilbert_wave_03_supervisor_auth_completion',
    source: ORCH_RUN
  }));
}

function buildDeepCascadeInput(summary, generatedAt) {
  return {
    vote_id: 'V6-OPENCLAW-424-WAVE03-SECOND-CASCADE',
    generatedAt,
    mode: 'openclaw-424-wave-03-second-cascade',
    taskId: 'openclaw-424-wave-03-supervisor-auth-boundary',
    planId: ORCH_RUN,
    purpose: 'Deep wave SECOND cascade over Brown-Hilbert room execution, Omnishannon/Shannon, GNN, reverse-gain, super-white-room, and GC readiness for wave 03.',
    waveShape: '6x6x6x6x6x12 x omnishannon x GNN x reverse_gain_GNN x super_white_room x GC',
    chain: [
      'brown_hilbert_room',
      'second_cascade',
      'omnishannon',
      'gnn',
      'reverse_gain_gnn',
      'super_white_room',
      'gc'
    ],
    executionPolicy: {
      planningOnly: true,
      executorDispatches: false,
      spawnWorkers: false,
      remoteMutation: false,
      externalApiCall: false
    },
    candidates: [
      {
        id: 'wave03-phase-supervisor-bindings',
        label: '20 phase supervisor bindings ready',
        metadata: { proof_artifact: repoRel(PATHS.phaseSupervisorBindings), scope_hours: 0.5, count: summary.phaseSupervisorBindings },
        cube: 1225043,
        expected_outcome: 'All execution phases have Hermes/Shannon supervisor awareness.',
        next_step: 'Use binding table before any code-edit wave.'
      },
      {
        id: 'wave03-provider-auth-boundaries',
        label: 'Provider runtime auth boundaries',
        metadata: { proof_artifact: repoRel(PATHS.providerAuthBoundaries), scope_hours: 0.5, count: summary.providerBoundaries },
        cube: 1295029,
        expected_outcome: 'Provider routes require legitimate existing credentials or local fallback.',
        next_step: 'Apply before provider/runtime implementation waves.'
      },
      {
        id: 'wave03-reverse-gain-auth-queue',
        label: 'Reverse-gain auth/security review queue',
        metadata: { proof_artifact: repoRel(PATHS.reverseGainQueue), scope_hours: 0.5, count: summary.reverseGainRows },
        cube: 3581577,
        expected_outcome: 'Auth/security/provider rows are reviewed before implementation.',
        next_step: 'Feed into gateway, provider, and Codex harness waves.'
      },
      {
        id: 'wave03-super-white-room-boundary',
        label: 'Super-white contradiction chamber for auth rails',
        metadata: { proof_artifact: repoRel(PATHS.map), scope_hours: 0.5 },
        cube: 9393931,
        expected_outcome: 'Contradictions route to white-room notes instead of execution.',
        next_step: 'Keep hard blocks visible in map/cube/report outputs.'
      },
      {
        id: 'wave03-gc-artifact-safety',
        label: 'GC-safe local artifact output',
        metadata: { proof_artifact: repoRel(PATHS.reportJson), scope_hours: 0.5 },
        cube: 7189057,
        expected_outcome: 'Artifacts stay bounded, local, indexed, and recoverable.',
        next_step: 'Validate row counts and keep generated outputs under owned run roots.'
      },
      {
        id: 'wave04-readiness-gate',
        label: 'Wave 04 readiness after supervisor/auth rails',
        metadata: { proof_artifact: repoRel(PATHS.executionResult), scope_hours: 0.5 },
        cube: 2248091,
        expected_outcome: 'Next wave can proceed only after supervisor/auth rails are sealed.',
        next_step: 'Prepare BEHCS glyph language update and gateway pairing follow-on.'
      }
    ]
  };
}

function run({ execute }) {
  const generatedAt = new Date().toISOString();
  const inputs = loadInputs();
  const phaseBindings = buildPhaseSupervisorBindings(inputs, generatedAt);
  const providerBoundaries = buildProviderBoundaries(inputs.taxonomyRows, generatedAt);
  const reverseGainRows = buildReverseGainQueue(inputs.taxonomyRows);
  const status = phaseBindings.length === 20 && providerBoundaries.length > 0
    ? 'WAVE_03_SUPERVISOR_AUTH_RAIL_COMPLETE'
    : 'WAVE_03_SUPERVISOR_AUTH_RAIL_INCOMPLETE';
  const deepCascadeSummary = inputs.deepCascadeVote ? {
    voteId: inputs.deepCascadeVote.vote_id,
    mode: inputs.deepCascadeVote.mode,
    engine: inputs.deepCascadeVote.engine,
    totalBeats: inputs.deepCascadeVote.totalBeats,
    beatsPerCandidate: inputs.deepCascadeVote.beatsPerCandidate,
    candidatesScanned: inputs.deepCascadeVote.candidatesScanned,
    executorDispatches: inputs.deepCascadeVote.executorDispatches,
    busAlive: inputs.deepCascadeVote.liveState?.busAlive,
    federationAlive: inputs.deepCascadeVote.liveState?.federationAlive,
    collapseDetected: inputs.deepCascadeVote.liveState?.collapseDetected,
    weakestDims: Array.from(new Set((inputs.deepCascadeVote.results || [])
      .map((result) => result.selfReflection?.weakestOverall?.dim)
      .filter(Boolean))),
    verdicts: (inputs.deepCascadeVote.results || []).map((result) => ({
      candidateId: result.candidate_id,
      verdict: result.verdict,
      confidence: result.avgConfidence,
      beats: result.totalBeats
    }))
  } : null;
  const summary = {
    runId: ORCH_RUN,
    waveId: WAVE_ID,
    generatedAt,
    status,
    waveExecutors: inputs.waveTickets.map((ticket) => ticket.executorId),
    phaseSupervisorBindings: phaseBindings.length,
    supervisorBindingsReady: phaseBindings.filter((binding) => binding.workerReady).length,
    providerBoundaries: providerBoundaries.length,
    reverseGainRows: reverseGainRows.length,
    taxonomyRowsRead: inputs.taxonomyRows.length,
    modelCardPresent: Object.keys(inputs.modelCard || {}).length > 0,
    deepCascade: deepCascadeSummary,
    boundary: {
      externalApiCall: false,
      providerAuthBypass: false,
      paymentBypass: false,
      rateLimitBypass: false,
      secretMaterialInArtifacts: false,
      remoteMutation: false,
      codeImplementationClaimed: false
    },
    outputs: Object.fromEntries(Object.entries(PATHS).map(([key, value]) => [key, repoRel(value)]))
  };
  const taskResults = buildTaskResults(inputs, summary);
  const map = buildMap(phaseBindings, providerBoundaries, generatedAt);
  const memory = {
    memoryId: 'openclaw-424-wave-03-supervisor-auth-boundary.v1',
    generatedAt,
    status,
    summary,
    significance: [
      'The conductor now has one supervisor binding per OpenClaw execution phase.',
      'Provider and auth-sensitive surfaces are separated into legitimate routes, fallback routes, and hard blocked controls before implementation.',
      'Reverse-gain auth/security rows are available for later code-edit waves.'
    ]
  };
  const index = {
    indexId: 'openclaw-424-wave-03-supervisor-auth-boundary-index.v1',
    generatedAt,
    status: 'INDEX_INDEXED',
    phaseBindings: phaseBindings.map((binding) => ({
      phaseId: binding.phaseId,
      executorId: binding.executorId,
      decision: binding.decision,
      workerReady: binding.workerReady,
      glyph: binding.behcs256.glyph
    })),
    providerBoundaries: providerBoundaries.map((boundary) => ({
      provider: boundary.provider,
      rowCount: boundary.rowCount,
      localFallback: boundary.localFallback,
      glyph: boundary.behcs256.glyph
    }))
  };
  const cube = {
    cubeId: 'openclaw-424-wave-03-supervisor-auth-boundary-cube-cubed',
    generatedAt,
    status: 'CUBE_CUBE_CUBED',
    phaseSupervisorBindings: phaseBindings.length,
    supervisorBindingsReady: summary.supervisorBindingsReady,
    providerBoundaries: providerBoundaries.length,
    reverseGainRows: reverseGainRows.length,
    deepCascadeTotalBeats: deepCascadeSummary?.totalBeats || 0,
    deepCascadeExecutorDispatches: deepCascadeSummary?.executorDispatches || 0,
    glyph: glyph('openclaw_424_wave03_cube', WAVE_ID, `${phaseBindings.length}:${providerBoundaries.length}:${reverseGainRows.length}`)
  };
  const glpj = {
    programId: 'openclaw-424-wave-03-supervisor-auth-boundary-behcs256.glpj',
    generatedAt,
    status: 'GLPJ_MINTED',
    language: 'BEHCS-256',
    verbs: [
      'SUPERVISE_PHASE',
      'BOUND_PROVIDER',
      'REQUIRE_EXISTING_CREDENTIAL',
      'USE_LOCAL_FIXTURE_WHEN_ABSENT',
      'BLOCK_AUTH_BYPASS',
      'BLOCK_PAYMENT_BYPASS',
      'REDACT_PROVIDER_ERROR',
      'REVERSE_GAIN_BEFORE_EDIT'
    ],
    sentences: [
      ...phaseBindings.map((binding) => binding.behcs256.programSentence),
      ...providerBoundaries.map((boundary) => boundary.behcs256.programSentence)
    ]
  };
  const deepCascadeInput = buildDeepCascadeInput(summary, generatedAt);
  const completionQueue = buildCompletionQueue(inputs, summary);
  const reportMd = [
    '# OpenClaw 4.24 Wave 03 Supervisor/Auth Rail',
    '',
    `Generated: ${generatedAt}`,
    '',
    `Status: ${status}`,
    '',
    `- Phase supervisor bindings: ${phaseBindings.length}`,
    `- Supervisor bindings ready: ${summary.supervisorBindingsReady}`,
    `- Provider boundaries: ${providerBoundaries.length}`,
    `- Reverse-gain auth/security rows: ${reverseGainRows.length}`,
    `- Taxonomy rows read: ${inputs.taxonomyRows.length}`,
    `- Deep cascade total beats: ${deepCascadeSummary?.totalBeats || 0}`,
    `- Deep cascade executor dispatches: ${deepCascadeSummary?.executorDispatches || 0}`,
    '',
    '## Provider Boundaries',
    '',
    ...providerBoundaries.map((boundary) => `- ${boundary.provider}: rows=${boundary.rowCount}; fallback=${boundary.localFallback}`),
    '',
    '## Deep Wave',
    '',
    deepCascadeSummary
      ? `- ${deepCascadeSummary.voteId}: candidates=${deepCascadeSummary.candidatesScanned}; beats=${deepCascadeSummary.totalBeats}; dispatches=${deepCascadeSummary.executorDispatches}; busAlive=${deepCascadeSummary.busAlive}; weakest=${deepCascadeSummary.weakestDims.join(', ')}`
      : '- Deep cascade vote not absorbed yet.',
    '',
    '## Boundary',
    '',
    'This wave writes supervisor and provider-auth rails only. It does not call providers, reveal secrets, bypass auth/payment/rate limits, mutate remote systems, or claim runtime implementation is complete.',
    '',
    '## Outputs',
    '',
    ...Object.entries(PATHS).map(([key, value]) => `- ${key}: \`${repoRel(value)}\``)
  ].join('\n');
  if (execute) {
    writeJson(PATHS.phaseSupervisorBindings, { bindingId: 'openclaw-424-wave-03-phase-supervisor-bindings.v1', generatedAt, phaseBindings });
    writeNdjson(PATHS.phaseSupervisorBindingsNdjson, phaseBindings);
    writeJson(PATHS.providerAuthBoundaries, { boundaryId: 'openclaw-424-wave-03-provider-auth-boundaries.v1', generatedAt, providerBoundaries });
    writeNdjson(PATHS.providerAuthBoundariesNdjson, providerBoundaries);
    writeNdjson(PATHS.reverseGainQueue, reverseGainRows);
    writeJson(PATHS.deepCascadeInput, deepCascadeInput);
    if (deepCascadeSummary) {
      writeJson(PATHS.deepCascadeResult, {
        resultId: 'openclaw-424-wave-03-deep-wave-second-cascade-result.v1',
        generatedAt,
        source: repoRel(SOURCE_PATHS.deepCascadeVote),
        summary: deepCascadeSummary
      });
    }
    writeNdjson(PATHS.taskResults, taskResults);
    writeJson(PATHS.executionResult, { summary, taskResults });
    writeNdjson(PATHS.completionSupervisorQueue, completionQueue);
    writeJson(PATHS.memory, memory);
    writeJson(PATHS.index, index);
    writeJson(PATHS.map, map);
    writeText(PATHS.cube, `export const CUBE = ${JSON.stringify(cube, null, 2)};\n`);
    writeJson(PATHS.glpj, glpj);
    writeJson(PATHS.reportJson, summary);
    writeText(PATHS.reportMd, reportMd);
    appendNdjson(PATHS.globalInbox, {
      generatedAt,
      type: 'openclaw_424_wave_03_supervisor_auth_rail_complete',
      runId: ORCH_RUN,
      waveId: WAVE_ID,
      status,
      phaseSupervisorBindings: phaseBindings.length,
      providerBoundaries: providerBoundaries.length,
      reverseGainRows: reverseGainRows.length,
      report: repoRel(PATHS.reportMd)
    });
    appendNdjson(PATHS.gnnEdges, {
      generatedAt,
      from: `${ORCH_RUN}:wave-02`,
      to: `${ORCH_RUN}:wave-03`,
      relation: 'BUILDS_SUPERVISOR_AUTH_RAILS_AFTER_DIFF_TAXONOMY',
      weight: 1,
      glyph: glyph('gnn_edge', `${ORCH_RUN}:${WAVE_ID}`, 'supervisor_auth_after_taxonomy')
    });
  }
  return {
    ok: true,
    execute,
    status,
    waveId: WAVE_ID,
    phaseSupervisorBindings: phaseBindings.length,
    supervisorBindingsReady: summary.supervisorBindingsReady,
    providerBoundaries: providerBoundaries.length,
    reverseGainRows: reverseGainRows.length,
    report: repoRel(PATHS.reportMd),
    supervisorQueue: repoRel(PATHS.completionSupervisorQueue)
  };
}

function parseArgs(argv) {
  return { execute: argv.includes('--execute') };
}

function main() {
  console.log(JSON.stringify(run(parseArgs(process.argv.slice(2))), null, 2));
}

if (require.main === module) {
  main();
}
