#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const behcs = require('./behcs/codex-bridge');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_RUN = 'brown-hilbert-room-executor-integration-20260426';
const EXECUTOR_RUN = 'openclaw-424-executor-matrix-20260426';
const PLAN_RUN = 'openclaw-424-200-step-execution-20260426';
const RUN_ID = 'openclaw-424-room-execution-orchestration-20260426';
const RUN_ROOT = rel(`data/behcs/orchestration/${RUN_ID}`);

const SOURCE_PATHS = Object.freeze({
  executorContracts: rel(`data/behcs/orchestration/${EXECUTOR_RUN}/executor-contracts.v1.json`),
  implementationQueue: rel(`data/behcs/orchestration/${PLAN_RUN}/openclaw-424-implementation-queue.v1.ndjson`),
  cascadeDivision: rel(`data/behcs/orchestration/${EXECUTOR_RUN}/cascade-division.v1.json`),
  roomBindings: rel(`data/behcs/orchestration/${SOURCE_RUN}/executor-room-bindings.v1.json`),
  superWhiteRooms: rel(`data/behcs/orchestration/${SOURCE_RUN}/super-white-rooms.v1.json`),
  roomEnergySchedule: rel(`data/behcs/orchestration/${SOURCE_RUN}/room-energy-schedule.v1.json`),
  roomWorkerReady: rel(`data/behcs/orchestration/${SOURCE_RUN}/supervisor-worker-ready-latest.ndjson`)
});

const PATHS = Object.freeze({
  runRoot: RUN_ROOT,
  wavePlan: path.join(RUN_ROOT, 'room-execution-wave-plan.v1.json'),
  wavePlanNdjson: path.join(RUN_ROOT, 'room-execution-wave-plan.v1.ndjson'),
  dispatchTickets: path.join(RUN_ROOT, 'executor-dispatch-tickets.v1.json'),
  dispatchTicketsNdjson: path.join(RUN_ROOT, 'executor-dispatch-tickets.v1.ndjson'),
  dependencyCorrection: path.join(RUN_ROOT, 'dependency-order-correction.v1.json'),
  conductorState: path.join(RUN_ROOT, 'room-execution-conductor.state.json'),
  supervisorQueue: path.join(RUN_ROOT, 'room-execution-supervisor-queue.ndjson'),
  supervisorDecisions: path.join(RUN_ROOT, 'supervisor-decisions-latest.ndjson'),
  supervisorWorkerReady: path.join(RUN_ROOT, 'supervisor-worker-ready-latest.ndjson'),
  supervisorMap: path.join(RUN_ROOT, 'supervisor-runner-map-latest.json'),
  supervisorState: path.join(RUN_ROOT, 'supervisor-runner.state.json'),
  supervisorHermes: path.join(RUN_ROOT, 'supervisor-runner-hermes-latest.json'),
  supervisorShannon: path.join(RUN_ROOT, 'supervisor-runner-shannon-latest.json'),
  supervisorCube: path.join(RUN_ROOT, 'supervisor-runner.cube.js'),
  supervisorReportJson: path.join(RUN_ROOT, 'supervisor-runner-latest.json'),
  supervisorReportMd: path.join(RUN_ROOT, 'supervisor-runner-latest.md'),
  memory: rel('data/behcs/memory/openclaw-424-room-execution-orchestration.v1.json'),
  index: rel('data/behcs/index/openclaw-424-room-execution-orchestration-index.v1.json'),
  map: rel('data/behcs/maps/asolaria/openclaw-424-room-execution-orchestration-map-map-mapped.v1.json'),
  cube: rel('data/behcs/cubes/openclaw-424-room-execution-orchestration-cube-cubed.cube.js'),
  glpj: rel('data/behcs/codex/glyph-language/openclaw-424-room-execution-orchestration-behcs256.glpj.json'),
  reportJson: rel('reports/openclaw-424-room-execution-orchestration-latest.json'),
  reportMd: rel('reports/openclaw-424-room-execution-orchestration-latest.md'),
  globalInbox: rel('data/behcs/inbox.ndjson'),
  gnnEdges: rel('data/behcs/gnn-live-edges.ndjson')
});

const ENERGY_LIMITS = Object.freeze({
  score: 45,
  cpu: 7,
  io: 10,
  ram: 8,
  network: 1,
  attention: 10,
  thermal: 5
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
  const executorDoc = readJson(SOURCE_PATHS.executorContracts, {});
  const implementationQueue = readNdjson(SOURCE_PATHS.implementationQueue);
  const cascadeDivision = readJson(SOURCE_PATHS.cascadeDivision, {});
  const roomBindingDoc = readJson(SOURCE_PATHS.roomBindings, {});
  const superWhiteRoomDoc = readJson(SOURCE_PATHS.superWhiteRooms, {});
  const roomEnergyDoc = readJson(SOURCE_PATHS.roomEnergySchedule, {});
  const roomWorkerReady = readNdjson(SOURCE_PATHS.roomWorkerReady);
  const executors = Array.isArray(executorDoc.executors) ? executorDoc.executors : [];
  const roomBindings = Array.isArray(roomBindingDoc.bindings) ? roomBindingDoc.bindings : [];
  const superWhiteRooms = Array.isArray(superWhiteRoomDoc.rooms) ? superWhiteRoomDoc.rooms : [];
  const roomEnergySchedule = Array.isArray(roomEnergyDoc.energySchedule) ? roomEnergyDoc.energySchedule : [];
  return {
    executorDoc,
    implementationQueue,
    cascadeDivision,
    roomBindingDoc,
    superWhiteRoomDoc,
    roomEnergyDoc,
    roomWorkerReady,
    executors,
    roomBindings,
    superWhiteRooms,
    roomEnergySchedule
  };
}

function groupTasksByPhase(tasks) {
  const grouped = new Map();
  for (const task of tasks) {
    const key = String(task.phaseId || '');
    if (!key) continue;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(task);
  }
  for (const rows of grouped.values()) {
    rows.sort((a, b) => String(a.taskId).localeCompare(String(b.taskId)));
  }
  return grouped;
}

function detectDependencyOrderIssues(cascadeDivision, executors) {
  const byId = new Map(executors.map((executor) => [executor.id, executor]));
  const byPhase = new Map(executors.map((executor) => [executor.phaseId, executor]));
  const issues = [];
  for (const cascade of cascadeDivision.cascades || []) {
    const completed = new Set();
    for (const microWave of cascade.microWaves || []) {
      const waveExecutors = microWave.executors || [];
      for (const executorId of waveExecutors) {
        const executor = byId.get(executorId);
        if (!executor) continue;
        const missing = (executor.dependencies || []).filter((depPhaseId) => {
          const dep = byPhase.get(depPhaseId);
          return dep && !completed.has(dep.phaseId);
        });
        if (missing.length) {
          issues.push({
            cascade: cascade.id,
            microWave: microWave.id,
            executorId,
            phaseId: executor.phaseId,
            missingDependenciesAtThatPoint: missing
          });
        }
      }
      for (const executorId of waveExecutors) {
        const executor = byId.get(executorId);
        if (executor) completed.add(executor.phaseId);
      }
    }
  }
  return issues;
}

function canShareWave(candidate, wave) {
  const candidateLocks = new Set(candidate.writeLocks || []);
  for (const lock of wave.writeLocks) {
    if (candidateLocks.has(lock)) return false;
  }
  const energy = candidate.energy || {};
  return wave.energy.score + Number(energy.score || 0) <= ENERGY_LIMITS.score
    && wave.energy.cpu + Number(energy.cpu || 0) <= ENERGY_LIMITS.cpu
    && wave.energy.io + Number(energy.io || 0) <= ENERGY_LIMITS.io
    && wave.energy.ram + Number(energy.ram || 0) <= ENERGY_LIMITS.ram
    && wave.energy.network + Number(energy.network || 0) <= ENERGY_LIMITS.network
    && wave.energy.attention + Number(energy.attention || 0) <= ENERGY_LIMITS.attention
    && wave.energy.thermal + Number(energy.thermal || 0) <= ENERGY_LIMITS.thermal;
}

function addToWave(executor, wave) {
  wave.executors.push(executor.id);
  wave.phaseIds.push(executor.phaseId);
  for (const lock of executor.writeLocks || []) {
    wave.writeLocks.push(lock);
  }
  const energy = executor.energy || {};
  for (const key of Object.keys(wave.energy)) {
    wave.energy[key] += Number(energy[key] || 0);
  }
}

function buildDependencyAwareWaves(executors) {
  const byPhase = new Map(executors.map((executor) => [executor.phaseId, executor]));
  const pending = new Set(executors.map((executor) => executor.id));
  const completedPhases = new Set();
  const waves = [];
  let guard = 0;
  while (pending.size > 0) {
    guard += 1;
    if (guard > executors.length + 5) {
      throw new Error('dependency scheduler guard tripped; possible cycle');
    }
    const ready = executors
      .filter((executor) => pending.has(executor.id))
      .filter((executor) => (executor.dependencies || []).every((dep) => completedPhases.has(dep)))
      .sort((a, b) => Number(a.phaseIndex || 0) - Number(b.phaseIndex || 0));
    if (ready.length < 1) {
      const blocked = executors
        .filter((executor) => pending.has(executor.id))
        .map((executor) => ({
          executorId: executor.id,
          phaseId: executor.phaseId,
          missing: (executor.dependencies || []).filter((dep) => !completedPhases.has(dep))
        }));
      throw new Error(`no ready executors; blocked=${JSON.stringify(blocked)}`);
    }
    const wave = {
      id: `wave-${String(waves.length + 1).padStart(2, '0')}`,
      generatedAt: '',
      status: 'DEPENDENCY_AND_LOCK_SAFE',
      executors: [],
      phaseIds: [],
      writeLocks: [],
      energy: { score: 0, cpu: 0, io: 0, ram: 0, network: 0, attention: 0, thermal: 0 },
      energyLimits: ENERGY_LIMITS
    };
    for (const executor of ready) {
      if (wave.executors.length < 1 || canShareWave(executor, wave)) {
        addToWave(executor, wave);
      }
    }
    if (wave.executors.length < 1) {
      addToWave(ready[0], wave);
      wave.status = 'SINGLE_EXECUTOR_OVERRIDES_ENERGY_PACKING';
    }
    for (const executorId of wave.executors) {
      pending.delete(executorId);
      const executor = executors.find((item) => item.id === executorId);
      completedPhases.add(executor.phaseId);
    }
    wave.writeLocks = Array.from(new Set(wave.writeLocks));
    waves.push(wave);
  }
  return waves;
}

function buildTickets(inputs, waves, generatedAt) {
  const tasksByPhase = groupTasksByPhase(inputs.implementationQueue);
  const bindingByExecutor = new Map(inputs.roomBindings.map((binding) => [binding.executorId, binding]));
  const roomReadyByPacket = new Map(inputs.roomWorkerReady.map((packet) => [packet.packetId, packet]));
  const tickets = [];
  const byId = new Map(inputs.executors.map((executor) => [executor.id, executor]));
  for (const wave of waves) {
    for (const executorId of wave.executors) {
      const executor = byId.get(executorId);
      const binding = bindingByExecutor.get(executorId) || {};
      const tasks = tasksByPhase.get(executor.phaseId) || [];
      const roomWorkerPacketId = `ASO-BHROOM-EXEC-SUP-${executor.phaseId}`;
      const inboxPath = path.join(RUN_ROOT, 'executor-inboxes', executorId, 'executor-ticket.v1.json');
      const expectedArtifacts = [
        repoRel(inboxPath),
        `data/behcs/orchestration/${RUN_ID}/executor-dispatch-tickets.v1.ndjson`,
        ...new Set(tasks.flatMap((task) => task.proofRefs || []))
      ];
      tickets.push({
        id: `ticket-${executor.phaseId}`,
        generatedAt,
        runId: RUN_ID,
        waveId: wave.id,
        executorId: executor.id,
        phaseId: executor.phaseId,
        phaseIndex: executor.phaseIndex,
        title: executor.title,
        namedAgent: executor.executor,
        owner: executor.owner,
        lane: executor.lane,
        cascade: executor.cascade,
        status: 'READY_FOR_SUPERVISOR_GATED_ROOM_EXECUTION',
        dependencies: executor.dependencies || [],
        dependencyStatus: 'SATISFIED_BY_WAVE_ORDER',
        writeLocks: executor.writeLocks || [],
        readLocks: executor.readLocks || [],
        energy: executor.energy,
        brownHilbertRooms: {
          executorRoom: binding.executorRoom || '',
          executorAddress: binding.executorAddress || null,
          supervisorRoom: binding.supervisorRoom || '',
          supervisorAddress: binding.supervisorAddress || null,
          superWhiteRoom: binding.superWhiteRoom || '',
          superWhiteRoomAddress: binding.superWhiteRoomAddress || null,
          energyRoom: binding.energyRoom || '',
          energyAddress: binding.energyAddress || null
        },
        sourceRoomWorkerReady: roomReadyByPacket.get(roomWorkerPacketId) ? roomWorkerPacketId : '',
        taskCount: tasks.length,
        tasks,
        allowedPaths: [
          `data/behcs/orchestration/${RUN_ID}`,
          `data/behcs/orchestration/${PLAN_RUN}`,
          `data/behcs/orchestration/${EXECUTOR_RUN}`,
          `data/behcs/orchestration/${SOURCE_RUN}`,
          'data/behcs/memory',
          'data/behcs/index',
          'data/behcs/maps/asolaria',
          'data/behcs/cubes',
          'data/behcs/codex/glyph-language',
          'reports',
          'TASKS.md'
        ],
        expectedArtifacts,
        acceptanceGates: [
          'dependencies_satisfied_before_wave',
          'write_locks_exclusive_inside_wave',
          'brown_hilbert_executor_room_bound',
          'supervisor_room_bound',
          'super_white_room_bound',
          'energy_room_bound',
          'source_proof_refs_present',
          'no_unbounded_materialization',
          'no_external_api_or_provider_bypass',
          'no_remote_mutation'
        ],
        pid: `BH.ROOM.RUN.${String(executor.phaseIndex).padStart(2, '0')}.${executor.phaseId.toUpperCase().replace(/[^A-Z0-9]+/g, '.')}`,
        pidScope: 'local_asolaria_room_execution_only',
        consentScope: 'operator_authorized_local_orchestration',
        behcs256: {
          glyph: glyph('room_execution_ticket', executor.id, wave.id),
          programSentence: `EXECUTE_ROOM ${executor.id} WAVE ${wave.id} LOCKS ${(executor.writeLocks || []).join('+')} ENERGY ${executor.energy?.score || 0} ROOM ${binding.executorRoom || 'UNBOUND'} SUPERVISOR ${binding.supervisorRoom || 'UNBOUND'} WHITE ${binding.superWhiteRoom || 'UNBOUND'}`
        },
        inboxPath: repoRel(inboxPath)
      });
    }
  }
  return tickets;
}

function buildSupervisorQueue(tickets) {
  return tickets.map((ticket) => ({
    id: `ASO-ROOM-EXEC-DISPATCH-${ticket.phaseId}`,
    title: `Room execution dispatch for ${ticket.namedAgent}`,
    objective: `Run the bounded local Brown-Hilbert executor ticket for ${ticket.phaseId} inside ${ticket.brownHilbertRooms.executorRoom}, supervised by ${ticket.brownHilbertRooms.supervisorRoom}, with super-white contradiction review in ${ticket.brownHilbertRooms.superWhiteRoom}.`,
    requestedWorker: `local_room_executor:${ticket.namedAgent}`,
    instructions: ticket.behcs256.programSentence,
    pid: ticket.pid,
    pidScope: ticket.pidScope,
    consentScope: ticket.consentScope,
    allowedPaths: ticket.allowedPaths,
    expectedArtifacts: ticket.expectedArtifacts,
    acceptanceGates: ticket.acceptanceGates,
    proofRequired: true,
    proofRefs: ticket.expectedArtifacts.filter((artifact) => artifact.includes('openclaw')),
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
    taskType: 'brown_hilbert_room_execution_dispatch',
    source: RUN_ID
  }));
}

function buildArtifacts(inputs, waves, tickets, dependencyIssues, generatedAt, supervisorStatus = null) {
  const waveEdges = [];
  const nodes = [];
  for (const wave of waves) {
    nodes.push({ id: wave.id, kind: 'execution_wave', energy: wave.energy, locks: wave.writeLocks });
    for (const executorId of wave.executors) {
      waveEdges.push({ from: wave.id, to: executorId, relation: 'schedules_executor' });
    }
  }
  for (const ticket of tickets) {
    nodes.push({
      id: ticket.executorId,
      kind: 'executor',
      phaseId: ticket.phaseId,
      owner: ticket.owner,
      cascade: ticket.cascade,
      room: ticket.brownHilbertRooms.executorRoom
    });
    if (ticket.brownHilbertRooms.supervisorRoom) {
      waveEdges.push({ from: ticket.brownHilbertRooms.supervisorRoom, to: ticket.executorId, relation: 'supervises' });
    }
    if (ticket.brownHilbertRooms.superWhiteRoom) {
      waveEdges.push({ from: ticket.brownHilbertRooms.superWhiteRoom, to: ticket.executorId, relation: 'contradiction_review' });
    }
  }
  const status = supervisorStatus?.status || 'ROOM_EXECUTION_ORCHESTRATION_PREPARED';
  const summary = {
    runId: RUN_ID,
    generatedAt,
    status,
    sourceRun: SOURCE_RUN,
    executorRun: EXECUTOR_RUN,
    planRun: PLAN_RUN,
    counts: {
      executors: inputs.executors.length,
      tickets: tickets.length,
      waves: waves.length,
      dependencyOrderIssuesCorrected: dependencyIssues.length,
      sourceRoomWorkerReady: inputs.roomWorkerReady.length,
      supervisorAllowed: supervisorStatus?.counts?.ALLOW || 0,
      supervisorBlocked: supervisorStatus?.counts?.BLOCK || 0,
      supervisorNeedsEvidence: supervisorStatus?.counts?.NEEDS_EVIDENCE || 0,
      workerReady: supervisorStatus?.counts?.workerReady || 0
    },
    energyPolicy: {
      unit: 'local_energy_not_tokens',
      limits: ENERGY_LIMITS,
      principle: 'schedule by dependency, write-lock conflict, heat, IO, RAM, CPU, attention, and active room space'
    },
    boundary: {
      unboundedMaterialization: false,
      externalApiCall: false,
      providerAuthBypass: false,
      paymentBypass: false,
      remoteMutation: false,
      processFanout: false
    },
    outputs: Object.fromEntries(Object.entries(PATHS).map(([key, value]) => [key, repoRel(value)]))
  };
  const memory = {
    memoryId: 'openclaw-424-room-execution-orchestration.v1',
    generatedAt,
    status,
    summary,
    significance: [
      'OpenClaw 4.24 execution moved from plan/integration into room-bound conductor packets.',
      'Brown-Hilbert infinite-right rooms now control actual executor ordering without materializing infinite workers.',
      'Super-white rooms are assigned as contradiction chambers for every executor ticket.',
      'Energy, locks, dependency order, proof references, and local boundaries are now machine-readable before implementation starts.'
    ]
  };
  const index = {
    indexId: 'openclaw-424-room-execution-orchestration-index.v1',
    generatedAt,
    status: 'INDEX_INDEXED',
    entries: tickets.map((ticket) => ({
      id: ticket.id,
      phaseId: ticket.phaseId,
      executorId: ticket.executorId,
      waveId: ticket.waveId,
      cascade: ticket.cascade,
      owner: ticket.owner,
      room: ticket.brownHilbertRooms.executorRoom,
      glyph: ticket.behcs256.glyph
    }))
  };
  const map = {
    mapId: 'openclaw-424-room-execution-orchestration-map-map-mapped.v1',
    generatedAt,
    status: 'MAP_MAP_MAPPED',
    nodeCount: nodes.length,
    edgeCount: waveEdges.length,
    nodes,
    edges: waveEdges
  };
  const cube = {
    cubeId: 'openclaw-424-room-execution-orchestration-cube-cubed',
    generatedAt,
    status: 'CUBE_CUBE_CUBED',
    runId: RUN_ID,
    waveCount: waves.length,
    ticketCount: tickets.length,
    dependencyOrderIssuesCorrected: dependencyIssues.length,
    workerReady: supervisorStatus?.counts?.workerReady || 0,
    glyph: glyph('room_execution_cube', RUN_ID, `${waves.length}:${tickets.length}:${dependencyIssues.length}`)
  };
  const glpj = {
    programId: 'openclaw-424-room-execution-orchestration-behcs256.glpj',
    generatedAt,
    status: 'GLPJ_MINTED',
    language: 'BEHCS-256',
    verbs: [
      'EXECUTE_ROOM',
      'SUPERVISE_ROOM',
      'CONTRADICT_IN_WHITE_ROOM',
      'LOCK_BEFORE_WRITE',
      'ENERGY_PACK',
      'DEPENDENCY_BEFORE_WAVE',
      'MINT_AFTER_PROOF',
      'DO_NOT_MATERIALIZE_INFINITY'
    ],
    sentences: tickets.map((ticket) => ticket.behcs256.programSentence)
  };
  const reportMd = [
    '# OpenClaw 4.24 Room Execution Orchestration',
    '',
    `Generated: ${generatedAt}`,
    '',
    `Status: ${status}`,
    '',
    `- Waves: ${waves.length}`,
    `- Executor tickets: ${tickets.length}`,
    `- Dependency-order issues corrected: ${dependencyIssues.length}`,
    `- Source room worker-ready packets: ${inputs.roomWorkerReady.length}`,
    `- Supervisor allowed: ${summary.counts.supervisorAllowed}`,
    `- Supervisor blocked: ${summary.counts.supervisorBlocked}`,
    `- Supervisor needs evidence: ${summary.counts.supervisorNeedsEvidence}`,
    `- Worker-ready dispatch rows: ${summary.counts.workerReady}`,
    '',
    '## Energy',
    '',
    `Limits: score<=${ENERGY_LIMITS.score}, cpu<=${ENERGY_LIMITS.cpu}, io<=${ENERGY_LIMITS.io}, ram<=${ENERGY_LIMITS.ram}, network<=${ENERGY_LIMITS.network}, attention<=${ENERGY_LIMITS.attention}, thermal<=${ENERGY_LIMITS.thermal}.`,
    '',
    '## Waves',
    '',
    ...waves.map((wave) => `- ${wave.id}: executors=${wave.executors.join(', ')}; locks=${wave.writeLocks.join(', ')}; energy=${wave.energy.score}`),
    '',
    '## Rule',
    '',
    'This conductor schedules finite local executor packets over the Brown-Hilbert right-open room fabric. Infinity remains addressable by formula and lazy reserve only. No external API calls, provider auth bypass, payment bypass, remote mutation, or unbounded process fanout are part of this run.',
    '',
    '## Outputs',
    '',
    ...Object.entries(PATHS).map(([key, value]) => `- ${key}: \`${repoRel(value)}\``)
  ].join('\n');
  return { summary, memory, index, map, cube, glpj, reportMd };
}

function materializeTickets(tickets) {
  for (const ticket of tickets) {
    writeJson(path.join(ROOT, ticket.inboxPath), ticket);
  }
}

function prepare({ execute }) {
  const generatedAt = new Date().toISOString();
  const inputs = loadInputs();
  const dependencyIssues = detectDependencyOrderIssues(inputs.cascadeDivision, inputs.executors);
  const waves = buildDependencyAwareWaves(inputs.executors).map((wave) => ({ ...wave, generatedAt }));
  const tickets = buildTickets(inputs, waves, generatedAt);
  const supervisorQueue = buildSupervisorQueue(tickets);
  const artifacts = buildArtifacts(inputs, waves, tickets, dependencyIssues, generatedAt);
  const dependencyCorrection = {
    correctionId: 'openclaw-424-room-execution-dependency-order-correction.v1',
    generatedAt,
    status: dependencyIssues.length ? 'CORRECTED_PRIOR_MICRO_WAVE_DEPENDENCY_ORDER' : 'NO_PRIOR_ORDER_ISSUES_FOUND',
    issueCount: dependencyIssues.length,
    issues: dependencyIssues,
    rule: 'Executor waves are ordered by dependencies before cascade micro-wave preference, then packed by write locks and energy.'
  };
  const conductorState = {
    stateId: 'openclaw-424-room-execution-conductor.state',
    generatedAt,
    status: 'PREPARED_FOR_SUPERVISOR_GATED_DISPATCH',
    waves: waves.length,
    tickets: tickets.length,
    dependencyIssuesCorrected: dependencyIssues.length,
    supervisorQueue: repoRel(PATHS.supervisorQueue)
  };
  if (execute) {
    writeJson(PATHS.wavePlan, { planId: 'openclaw-424-room-execution-wave-plan.v1', generatedAt, waves });
    writeNdjson(PATHS.wavePlanNdjson, waves);
    writeJson(PATHS.dispatchTickets, { ticketSetId: 'openclaw-424-room-execution-dispatch-tickets.v1', generatedAt, tickets });
    writeNdjson(PATHS.dispatchTicketsNdjson, tickets);
    writeJson(PATHS.dependencyCorrection, dependencyCorrection);
    writeJson(PATHS.conductorState, conductorState);
    writeNdjson(PATHS.supervisorQueue, supervisorQueue);
    materializeTickets(tickets);
    writeJson(PATHS.memory, artifacts.memory);
    writeJson(PATHS.index, artifacts.index);
    writeJson(PATHS.map, artifacts.map);
    writeText(PATHS.cube, `export const CUBE = ${JSON.stringify(artifacts.cube, null, 2)};\n`);
    writeJson(PATHS.glpj, artifacts.glpj);
    writeJson(PATHS.reportJson, artifacts.summary);
    writeText(PATHS.reportMd, artifacts.reportMd);
    appendNdjson(PATHS.globalInbox, {
      generatedAt,
      type: 'openclaw_424_room_execution_orchestration_prepared',
      runId: RUN_ID,
      report: repoRel(PATHS.reportMd),
      waves: waves.length,
      tickets: tickets.length
    });
    appendNdjson(PATHS.gnnEdges, {
      generatedAt,
      from: 'brown_hilbert_room_executor_integration',
      to: RUN_ID,
      relation: 'ORCHESTRATES_EXECUTION',
      weight: 1,
      glyph: glyph('gnn_edge', RUN_ID, 'orchestrates_execution')
    });
  }
  return {
    ok: true,
    execute,
    status: conductorState.status,
    runId: RUN_ID,
    waves: waves.length,
    tickets: tickets.length,
    dependencyIssuesCorrected: dependencyIssues.length,
    supervisorQueue: repoRel(PATHS.supervisorQueue),
    report: repoRel(PATHS.reportMd)
  };
}

function absorb({ execute }) {
  const generatedAt = new Date().toISOString();
  const inputs = loadInputs();
  const wavePlan = readJson(PATHS.wavePlan, { waves: [] });
  const ticketDoc = readJson(PATHS.dispatchTickets, { tickets: [] });
  const dependencyCorrection = readJson(PATHS.dependencyCorrection, { issues: [] });
  const supervisorState = readJson(PATHS.supervisorState, null);
  const supervisorReport = readJson(PATHS.supervisorReportJson, null);
  const supervisorStatus = supervisorState || supervisorReport || null;
  const waves = Array.isArray(wavePlan.waves) ? wavePlan.waves : [];
  const tickets = Array.isArray(ticketDoc.tickets) ? ticketDoc.tickets : [];
  const artifacts = buildArtifacts(inputs, waves, tickets, dependencyCorrection.issues || [], generatedAt, supervisorStatus);
  const state = {
    stateId: 'openclaw-424-room-execution-conductor.state',
    generatedAt,
    status: artifacts.summary.status,
    waves: waves.length,
    tickets: tickets.length,
    supervisor: artifacts.summary.counts,
    nextAction: artifacts.summary.counts.supervisorBlocked > 0 || artifacts.summary.counts.supervisorNeedsEvidence > 0
      ? 'hold_and_resolve_supervisor_findings'
      : 'begin_wave_01_with_ticket_inboxes_and_keep_locks_exclusive'
  };
  if (execute) {
    writeJson(PATHS.conductorState, state);
    writeJson(PATHS.memory, artifacts.memory);
    writeJson(PATHS.index, artifacts.index);
    writeJson(PATHS.map, artifacts.map);
    writeText(PATHS.cube, `export const CUBE = ${JSON.stringify(artifacts.cube, null, 2)};\n`);
    writeJson(PATHS.glpj, artifacts.glpj);
    writeJson(PATHS.reportJson, artifacts.summary);
    writeText(PATHS.reportMd, artifacts.reportMd);
    appendNdjson(PATHS.globalInbox, {
      generatedAt,
      type: 'openclaw_424_room_execution_orchestration_absorbed',
      runId: RUN_ID,
      status: state.status,
      supervisor: artifacts.summary.counts,
      report: repoRel(PATHS.reportMd)
    });
  }
  return {
    ok: true,
    execute,
    status: state.status,
    runId: RUN_ID,
    waves: waves.length,
    tickets: tickets.length,
    supervisor: artifacts.summary.counts,
    nextAction: state.nextAction,
    report: repoRel(PATHS.reportMd)
  };
}

function usage() {
  return [
    'Usage:',
    '  node tools/asolaria-openclaw-424-room-execution-orchestrator.js prepare [--execute]',
    '  node tools/asolaria-openclaw-424-room-execution-orchestrator.js absorb [--execute]'
  ].join('\n');
}

function parseArgs(argv) {
  const command = argv.find((arg) => !arg.startsWith('--')) || 'prepare';
  return {
    command,
    execute: argv.includes('--execute')
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.command === 'prepare') {
    console.log(JSON.stringify(prepare(args), null, 2));
    return;
  }
  if (args.command === 'absorb') {
    console.log(JSON.stringify(absorb(args), null, 2));
    return;
  }
  console.error(usage());
  process.exitCode = 1;
}

if (require.main === module) {
  main();
}

