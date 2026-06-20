#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const behcs = require('./behcs/codex-bridge');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_RUN = 'openclaw-424-executor-matrix-20260426';
const RUN_ID = 'brown-hilbert-room-executor-integration-20260426';
const RUN_ROOT = rel(`data/behcs/orchestration/${RUN_ID}`);
const ACTIVE_WINDOW_SIZE = 64;

const SOURCE_PATHS = Object.freeze({
  executorContracts: rel(`data/behcs/orchestration/${SOURCE_RUN}/executor-contracts.v1.json`),
  cascadeDivision: rel(`data/behcs/orchestration/${SOURCE_RUN}/cascade-division.v1.json`),
  energyBudget: rel(`data/behcs/orchestration/${SOURCE_RUN}/energy-budget.v1.json`),
  collisionReport: rel(`data/behcs/orchestration/${SOURCE_RUN}/collision-report.v1.json`),
  supervisorWorkerReady: rel(`data/behcs/orchestration/${SOURCE_RUN}/supervisor-worker-ready-latest.ndjson`),
  hilbert47d: rel('tools/hilbert-omni-49D.json')
});

const PATHS = Object.freeze({
  runRoot: RUN_ROOT,
  addressSpace: path.join(RUN_ROOT, 'brown-hilbert-room-address-space.v1.json'),
  activeRooms: path.join(RUN_ROOT, 'active-room-window-64.v1.json'),
  executorBindings: path.join(RUN_ROOT, 'executor-room-bindings.v1.json'),
  executorBindingsNdjson: path.join(RUN_ROOT, 'executor-room-bindings.v1.ndjson'),
  supervisorBindings: path.join(RUN_ROOT, 'supervisor-room-bindings.v1.json'),
  supervisorBindingsNdjson: path.join(RUN_ROOT, 'supervisor-room-bindings.v1.ndjson'),
  superWhiteRooms: path.join(RUN_ROOT, 'super-white-rooms.v1.json'),
  roomEnergySchedule: path.join(RUN_ROOT, 'room-energy-schedule.v1.json'),
  supervisorQueue: path.join(RUN_ROOT, 'room-supervisor-queue.ndjson'),
  memory: rel('data/behcs/memory/brown-hilbert-room-executor-integration.v1.json'),
  index: rel('data/behcs/index/brown-hilbert-room-executor-integration-index.v1.json'),
  map: rel('data/behcs/maps/asolaria/brown-hilbert-room-executor-integration-map-map-mapped.v1.json'),
  cube: rel('data/behcs/cubes/brown-hilbert-room-executor-integration-cube-cubed.cube.js'),
  glpj: rel('data/behcs/codex/glyph-language/brown-hilbert-room-executor-integration-behcs256.glpj.json'),
  reportJson: rel('reports/brown-hilbert-room-executor-integration-latest.json'),
  reportMd: rel('reports/brown-hilbert-room-executor-integration-latest.md'),
  globalInbox: rel('data/behcs/inbox.ndjson'),
  gnnEdges: rel('data/behcs/gnn-live-edges.ndjson')
});

const SUPER_WHITE_ROOM_SPECS = [
  { id: 'swr-global-contradiction', cascade: 'GLOBAL', purpose: 'Catch contradictions that cross cascades, supervisors, locks, or authority layers.' },
  { id: 'swr-proof-topology', cascade: 'C0-proof-topology', purpose: 'Disprove stale evidence, missing proof, and false map/cube/glyph claims.' },
  { id: 'swr-safety-authority', cascade: 'C1-safety-authority', purpose: 'Disprove unsafe auth, gateway, rollout, or CI assumptions.' },
  { id: 'swr-core-runtime', cascade: 'C2-core-runtime', purpose: 'Disprove runtime coupling, process leaks, bad compaction, memory drift, and diagnostics leakage.' },
  { id: 'swr-interaction-surfaces', cascade: 'C3-interaction-surfaces', purpose: 'Disprove unsafe browser, voice, meeting, media, or channel assumptions before live use.' },
  { id: 'swr-federation-gravity', cascade: 'C4-federation-rollout', purpose: 'Disprove Acer/Liris/Falcon/trinity reachability and D23 federation assumptions before deployment.' }
];

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

function appendNdjson(filePath, data) {
  ensureDir(filePath);
  fs.appendFileSync(filePath, `${JSON.stringify(data)}\n`, 'utf8');
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

function glyph(kind, id, seed) {
  const hash = sha256(`${kind}:${id}:${seed || ''}`);
  return `HG256:${kind.toUpperCase()}:${hash.slice(0, 8).toUpperCase()}:${behcs.hilbertAddress(hash)}`;
}

function loadDimensions() {
  const spec = readJson(SOURCE_PATHS.hilbert47d, {});
  const dimensions = Array.isArray(spec.dimensions) ? spec.dimensions : [];
  return dimensions.map((dim) => ({
    D: dim.D,
    name: dim.name,
    prime: dim.prime,
    cube: dim.cube
  }));
}

function roomAddress(ordinal, dimensions) {
  const dim = dimensions[ordinal % dimensions.length];
  const level = Math.floor(Math.sqrt(ordinal));
  const rightOffset = ordinal - level * level;
  const stride = dim.prime * (rightOffset + 1);
  const coordinate = dim.cube + level + stride;
  return {
    ordinal,
    notation: `BHROOM:right:${level}:${rightOffset}:D${dim.D}`,
    hilbertLevel: level,
    rightOffset,
    dimension: `D${dim.D}_${dim.name}`,
    prime: dim.prime,
    cube: dim.cube,
    coordinate,
    glyph: glyph('brown_hilbert_room', `room_${ordinal}`, `${level}:${rightOffset}:${dim.D}:${coordinate}`)
  };
}

function makeRoom(ordinal, type, name, purpose, dimensions, extra = {}) {
  return {
    id: `room-${String(ordinal).padStart(3, '0')}`,
    type,
    name,
    purpose,
    status: type === 'reserve' ? 'RESERVED_LAZY_RIGHT_SPACE' : 'ACTIVE_WINDOW_BOUND',
    address: roomAddress(ordinal, dimensions),
    ...extra
  };
}

function buildRooms(generatedAt, executorContracts, cascadeDivision, dimensions) {
  const rooms = [];
  let ordinal = 0;
  for (const cascade of cascadeDivision.cascades || []) {
    rooms.push(makeRoom(ordinal, 'cascade_anchor', cascade.id, cascade.objective, dimensions, {
      generatedAt,
      cascade: cascade.id,
      energyMode: cascade.energyMode,
      barrier: cascade.barrier
    }));
    ordinal += 1;
  }
  for (const executor of executorContracts.executors || []) {
    rooms.push(makeRoom(ordinal, 'executor', executor.id, `${executor.executor} executes ${executor.title}`, dimensions, {
      generatedAt,
      executorId: executor.id,
      phaseId: executor.phaseId,
      cascade: executor.cascade,
      energyScore: executor.energy?.score,
      writeLocks: executor.writeLocks,
      readLocks: executor.readLocks
    }));
    ordinal += 1;
  }
  for (const executor of executorContracts.executors || []) {
    rooms.push(makeRoom(ordinal, 'supervisor_gate', `supervisor-${executor.id}`, `Supervisor gate for ${executor.executor}`, dimensions, {
      generatedAt,
      executorId: executor.id,
      phaseId: executor.phaseId,
      cascade: executor.cascade,
      gate: 'Hermes/Shannon/supervisor runner gate'
    }));
    ordinal += 1;
  }
  for (const spec of SUPER_WHITE_ROOM_SPECS) {
    rooms.push(makeRoom(ordinal, 'super_white_room', spec.id, spec.purpose, dimensions, {
      generatedAt,
      cascade: spec.cascade,
      protocol: 'contradict_first_then_repair',
      garbageCollector: 'evidence_preserving_gc',
      allowedOutcome: ['prove_safe', 'needs_evidence', 'block_or_defer']
    }));
    ordinal += 1;
  }
  for (const cascade of cascadeDivision.cascades || []) {
    rooms.push(makeRoom(ordinal, 'energy_buffer', `energy-${cascade.id}`, `Energy capacitor for ${cascade.id}`, dimensions, {
      generatedAt,
      cascade: cascade.id,
      energyMode: cascade.energyMode,
      pauseRule: 'pause before next micro-wave if heat, RAM, IO, or attention pressure is high'
    }));
    ordinal += 1;
  }
  while (ordinal < ACTIVE_WINDOW_SIZE) {
    rooms.push(makeRoom(ordinal, 'reserve', `reserve-${ordinal}`, 'Lazy right-space reserve; do not materialize until needed.', dimensions, {
      generatedAt,
      allocationRule: 'available for future rooms after supervisor gate and energy check'
    }));
    ordinal += 1;
  }
  return rooms;
}

function buildAddressSpace(generatedAt, dimensions, rooms) {
  return {
    addressSpaceId: 'brown-hilbert-room-address-space.v1',
    generatedAt,
    status: 'RIGHT_OPEN_SPACE_ACTIVE_WINDOW_BOUND',
    source: 'tools/hilbert-omni-47D.json',
    dimensionCount: dimensions.length,
    activeWindowSize: ACTIVE_WINDOW_SIZE,
    activeRoomsUsed: rooms.filter((room) => room.type !== 'reserve').length,
    activeRoomsReserved: rooms.filter((room) => room.type === 'reserve').length,
    rightOpenSpace: {
      notation: 'BHROOM:right:[0,infinity)',
      meaning: 'The room space is right-open and lazy. Only the active window is materialized; future rooms are addressed by formula.',
      materializationPolicy: 'mint room only when a supervisor/executor/white-room binding needs it',
      formula: 'ordinal n -> level=floor(sqrt(n)), rightOffset=n-level^2, dimension=47D[n mod 47], coordinate=cube + level + prime*(rightOffset+1)'
    },
    energyPolicy: {
      thinkEnergyNotTokens: true,
      activeWindowConservesDiskAndRAM: true,
      reserveRoomsStayLazy: true,
      checkpointBeforeExpandingWindow: true
    },
    dimensions
  };
}

function roomByType(rooms, type) {
  return rooms.filter((room) => room.type === type);
}

function buildExecutorBindings(generatedAt, executorContracts, rooms) {
  const executorRooms = roomByType(rooms, 'executor');
  const supervisorRooms = roomByType(rooms, 'supervisor_gate');
  const whiteRooms = roomByType(rooms, 'super_white_room');
  const energyRooms = roomByType(rooms, 'energy_buffer');
  return (executorContracts.executors || []).map((executor, index) => {
    const executorRoom = executorRooms[index];
    const supervisorRoom = supervisorRooms[index];
    const whiteRoom = whiteRooms.find((room) => room.cascade === executor.cascade) || whiteRooms[0];
    const energyRoom = energyRooms.find((room) => room.cascade === executor.cascade);
    return {
      id: `binding-${executor.id}`,
      generatedAt,
      executorId: executor.id,
      phaseId: executor.phaseId,
      executor: executor.executor,
      cascade: executor.cascade,
      executorRoom: executorRoom.id,
      executorAddress: executorRoom.address,
      supervisorRoom: supervisorRoom.id,
      supervisorAddress: supervisorRoom.address,
      superWhiteRoom: whiteRoom.id,
      superWhiteRoomAddress: whiteRoom.address,
      energyRoom: energyRoom?.id || null,
      energyAddress: energyRoom?.address || null,
      energyScore: executor.energy?.score,
      writeLocks: executor.writeLocks,
      readLocks: executor.readLocks,
      behcs256: {
        glyph: glyph('executor_room_binding', executor.id, `${executorRoom.id}:${supervisorRoom.id}:${whiteRoom.id}`),
        programSentence: [
          'ROOM_BIND',
          executor.id,
          'EXECUTES_IN',
          executorRoom.address.notation,
          'SUPERVISED_BY',
          supervisorRoom.address.notation,
          'CONTRADICTED_IN',
          whiteRoom.address.notation,
          'ENERGY',
          String(executor.energy?.score || 0)
        ].join(' ')
      }
    };
  });
}

function buildSupervisorBindings(generatedAt, executorBindings, supervisorReady) {
  return executorBindings.map((binding) => {
    const ready = supervisorReady.find((item) => item.pid?.includes(binding.phaseId.toUpperCase().replace(/[^A-Z0-9]+/g, '.')));
    return {
      id: `supervisor-${binding.executorId}`,
      generatedAt,
      executorId: binding.executorId,
      phaseId: binding.phaseId,
      cascade: binding.cascade,
      supervisorRoom: binding.supervisorRoom,
      supervisorAddress: binding.supervisorAddress,
      workerReadyEvidence: ready?.id || null,
      status: ready ? 'SUPERVISOR_READY_BOUND_TO_ROOM' : 'SUPERVISOR_ROOM_BOUND_WITHOUT_READY_PACKET_MATCH',
      gates: [
        'model_card_gate',
        'pid_bound_session_bus',
        'connector_health_matrix',
        'reverse_gain_review',
        'evidence_retention_guard',
        'super_white_room_contradiction'
      ],
      behcs256: {
        glyph: glyph('supervisor_room_binding', binding.executorId, binding.supervisorRoom),
        programSentence: [
          'SUPERVISOR_BIND',
          binding.executorId,
          'ROOM',
          binding.supervisorAddress.notation,
          'GATES',
          binding.executorAddress.notation
        ].join(' ')
      }
    };
  });
}

function buildSuperWhiteRooms(generatedAt, rooms, executorBindings) {
  const superRooms = roomByType(rooms, 'super_white_room');
  return {
    superWhiteRoomId: 'brown-hilbert-super-white-rooms.v1',
    generatedAt,
    status: 'SUPER_WHITE_ROOMS_BOUND',
    protocol: {
      firstMove: 'try_to_disprove',
      secondMove: 'request_missing_evidence',
      thirdMove: 'block_or_repair',
      gcPolicy: 'evidence_preserving_gc_only',
      mutationPolicy: 'no_runtime_mutation_from_white_room'
    },
    rooms: superRooms.map((room) => ({
      id: room.id,
      name: room.name,
      cascade: room.cascade,
      purpose: room.purpose,
      address: room.address,
      boundExecutors: executorBindings.filter((binding) => binding.superWhiteRoom === room.id).map((binding) => binding.executorId),
      contradictionQuestions: [
        'What evidence would make this executor unsafe?',
        'Which write lock could collide with another executor?',
        'What assumption is memory-only and not artifact-backed?',
        'What energy pressure would require pausing?',
        'What must be deferred to avoid live/provider/device risk?'
      ],
      behcs256: {
        glyph: glyph('super_white_room', room.id, `${room.cascade}:${room.address.notation}`),
        programSentence: `SUPER_WHITE_ROOM ${room.id} ADDRESS ${room.address.notation} MODE CONTRADICT_FIRST GC EVIDENCE_PRESERVING`
      }
    }))
  };
}

function buildRoomEnergySchedule(generatedAt, cascadeDivision, rooms, executorBindings) {
  const energyRooms = roomByType(rooms, 'energy_buffer');
  return {
    scheduleId: 'brown-hilbert-room-energy-schedule.v1',
    generatedAt,
    status: 'ENERGY_SCHEDULE_BOUND_TO_ROOMS',
    principle: 'Use space carefully: the active window holds only anchors, executor rooms, supervisor rooms, super-white rooms, energy buffers, and reserve. Work advances by micro-wave barriers.',
    activeWindowSize: ACTIVE_WINDOW_SIZE,
    cascades: (cascadeDivision.cascades || []).map((cascade) => {
      const energyRoom = energyRooms.find((room) => room.cascade === cascade.id);
      return {
        cascade: cascade.id,
        energyMode: cascade.energyMode,
        barrier: cascade.barrier,
        energyRoom: energyRoom?.id || null,
        energyAddress: energyRoom?.address || null,
        microWaves: (cascade.microWaves || []).map((wave) => ({
          id: wave.id,
          energyScore: wave.energyScore,
          executorRooms: wave.executors.map((executorId) => {
            const binding = executorBindings.find((item) => item.executorId === executorId);
            return {
              executorId,
              executorRoom: binding?.executorRoom || null,
              supervisorRoom: binding?.supervisorRoom || null,
              superWhiteRoom: binding?.superWhiteRoom || null
            };
          }),
          pauseCheck: 'heat_or_ram_or_io_or_attention_pressure'
        }))
      };
    })
  };
}

function buildSupervisorQueue(generatedAt, executorBindings, superWhiteRooms) {
  const executorPackets = executorBindings.map((binding) => ({
    id: `ASO-BHROOM-EXEC-SUP-${binding.phaseId}`,
    generatedAt,
    title: `Brown-Hilbert room binding for ${binding.executor}`,
    objective: `Gate room binding ${binding.executorRoom} / ${binding.supervisorRoom} / ${binding.superWhiteRoom}.`,
    instructions: 'Verify executor room, supervisor room, super-white-room contradiction lane, energy room, write locks, and right-open lazy materialization.',
    requestedWorker: 'local_brown_hilbert_room_binding_review',
    pid: `BH.ROOM.EXEC.${binding.phaseId.toUpperCase().replace(/[^A-Z0-9]+/g, '.')}`,
    pidScope: 'local_room_binding_only',
    consentScope: 'operator_authorized_local_planning',
    allowedPaths: [repoRel(RUN_ROOT), 'data/behcs/orchestration', 'data/behcs/maps/asolaria', 'data/behcs/cubes', 'reports'],
    expectedArtifacts: [repoRel(PATHS.addressSpace), repoRel(PATHS.executorBindings), repoRel(PATHS.superWhiteRooms), repoRel(PATHS.roomEnergySchedule)],
    acceptanceGates: ['room_address_present', 'supervisor_room_present', 'super_white_room_present', 'energy_room_present', 'no_unbounded_materialization'],
    proofRequired: true,
    proofRefs: [repoRel(PATHS.executorBindings), repoRel(PATHS.superWhiteRooms)],
    syntheticFirstEvidence: true,
    modelCard: true,
    remoteMutation: false,
    externalApiCall: false,
    cloudUpload: false,
    downloads: false,
    installs: false,
    writesGit: false,
    deletesEvidence: false,
    sensitiveData: false,
    secretMaterial: false,
    bypassAuth: false,
    bypassPayment: false,
    needsCloudWorker: false,
    source: 'asolaria-brown-hilbert-room-executor-integration'
  }));
  const whitePackets = (superWhiteRooms.rooms || []).map((room) => ({
    id: `ASO-BHROOM-SWR-SUP-${room.id}`,
    generatedAt,
    title: `Super white room ${room.id}`,
    objective: `Gate contradiction lane for ${room.cascade}.`,
    instructions: 'Verify contradiction-first protocol, evidence-preserving GC, and no runtime mutation from white-room review.',
    requestedWorker: 'local_super_white_room_review',
    pid: `BH.ROOM.SWR.${room.id.toUpperCase().replace(/[^A-Z0-9]+/g, '.')}`,
    pidScope: 'local_super_white_room_only',
    consentScope: 'operator_authorized_local_planning',
    allowedPaths: [repoRel(RUN_ROOT), 'data/behcs/orchestration', 'reports'],
    expectedArtifacts: [repoRel(PATHS.superWhiteRooms), repoRel(PATHS.roomEnergySchedule)],
    acceptanceGates: ['contradiction_questions_present', 'evidence_preserving_gc', 'no_runtime_mutation'],
    proofRequired: true,
    proofRefs: [repoRel(PATHS.superWhiteRooms)],
    syntheticFirstEvidence: true,
    modelCard: true,
    remoteMutation: false,
    externalApiCall: false,
    cloudUpload: false,
    downloads: false,
    installs: false,
    writesGit: false,
    deletesEvidence: false,
    sensitiveData: false,
    secretMaterial: false,
    bypassAuth: false,
    bypassPayment: false,
    needsCloudWorker: false,
    source: 'asolaria-brown-hilbert-room-executor-integration'
  }));
  return [...executorPackets, ...whitePackets];
}

function buildMemoryIndexMapCubeGlpj(generatedAt, addressSpace, rooms, executorBindings, supervisorBindings, superWhiteRooms, energySchedule) {
  const memory = {
    eventId: 'brown-hilbert-room-executor-integration.v1',
    generatedAt,
    status: 'BROWN_HILBERT_ROOMS_BOUND_TO_EXECUTORS_SUPERVISORS_SUPER_WHITE_ROOMS',
    significance: 'The OpenClaw executor matrix is now addressable in Brown-Hilbert right-open rooms. Executors, supervisors, super-white rooms, and energy buffers have active room bindings while the infinite-right address space remains lazy and energy-conserving.',
    sourceRun: SOURCE_RUN,
    activeWindowSize: addressSpace.activeWindowSize,
    activeRoomsUsed: addressSpace.activeRoomsUsed,
    activeRoomsReserved: addressSpace.activeRoomsReserved,
    executorBindings: executorBindings.length,
    supervisorBindings: supervisorBindings.length,
    superWhiteRooms: superWhiteRooms.rooms.length
  };
  const index = {
    indexId: 'brown-hilbert-room-executor-integration-index.v1',
    generatedAt,
    status: 'INDEX_READY_BROWN_HILBERT_ROOM_EXECUTOR_INTEGRATION',
    keys: [
      'Brown-Hilbert rooms',
      'right-open address space',
      'infinite practical room space',
      'BEHCS-256 program language',
      'executor bindings',
      'supervisor bindings',
      'super white rooms',
      'energy not tokens',
      'active room window',
      'lazy materialization'
    ],
    artifacts: outputs()
  };
  const map = {
    mapId: 'brown-hilbert-room-executor-integration-map-map-mapped.v1',
    generatedAt,
    status: 'MAP_MAP_MAPPED_READY_BHROOM_EXECUTOR_INTEGRATION',
    routes: [
      { from: 'executor_matrix', to: 'brown_hilbert_room_space', edge: 'receives_right_open_addresses', artifact: repoRel(PATHS.addressSpace) },
      { from: 'executors', to: 'executor_rooms', edge: 'execute_in_room', artifact: repoRel(PATHS.executorBindings) },
      { from: 'supervisors', to: 'supervisor_rooms', edge: 'gate_executor_rooms', artifact: repoRel(PATHS.supervisorBindings) },
      { from: 'super_white_rooms', to: 'executors', edge: 'contradict_before_repair', artifact: repoRel(PATHS.superWhiteRooms) },
      { from: 'energy_buffers', to: 'micro_waves', edge: 'pace_work_by_energy', artifact: repoRel(PATHS.roomEnergySchedule) },
      { from: 'reserve_rooms', to: 'future_expansion', edge: 'stay_lazy_until_needed', artifact: repoRel(PATHS.activeRooms) }
    ]
  };
  const cube = buildCube(generatedAt, addressSpace, executorBindings, supervisorBindings, superWhiteRooms, energySchedule);
  const glpj = {
    glpjId: 'brown-hilbert-room-executor-integration-behcs256.glpj',
    generatedAt,
    status: 'BEHCS256_BROWN_HILBERT_ROOM_GLYPHS_MINTED',
    alphabetBase: 256,
    languageMode: 'program_sentences_and_room_mints',
    mints: [
      ['room_address_space', PATHS.addressSpace, 'D42_MEETING_ROOM'],
      ['active_room_window', PATHS.activeRooms, 'D36_INFERENCE_SURFACE'],
      ['executor_room_bindings', PATHS.executorBindings, 'D41_AGENT_TIER'],
      ['supervisor_room_bindings', PATHS.supervisorBindings, 'D37_AUTHORITY_TOPOLOGY'],
      ['super_white_rooms', PATHS.superWhiteRooms, 'D47_BOUNDARY'],
      ['room_energy_schedule', PATHS.roomEnergySchedule, 'D14_ENERGY'],
      ['room_memory', PATHS.memory, 'D11_PROOF'],
      ['room_map', PATHS.map, 'D35_HYPERLANGUAGE'],
      ['room_cube', PATHS.cube, 'D42_MEETING_ROOM']
    ].map(([id, artifact, dimension]) => ({
      id,
      dimension,
      artifact: repoRel(artifact),
      glyph: glyph('brown_hilbert_room_integration', id, `${generatedAt}:${artifact}`)
    })),
    roomMints: rooms.map((room) => ({
      roomId: room.id,
      type: room.type,
      name: room.name,
      address: room.address.notation,
      glyph: room.address.glyph
    })),
    programSentences: executorBindings.map((binding) => binding.behcs256.programSentence)
  };
  return { memory, index, map, cube, glpj };
}

function buildCube(generatedAt, addressSpace, executorBindings, supervisorBindings, superWhiteRooms, energySchedule) {
  const cube = {
    id: 'brown-hilbert-room-executor-integration-cube-cubed',
    generatedAt,
    status: 'CUBE_CUBE_CUBED_READY_BROWN_HILBERT_ROOMS',
    sourceRun: SOURCE_RUN,
    dimensions: {
      D9_WAVE: 'micro_waves_inside_room_energy_schedule',
      D10_DIALECT: 'BEHCS_256_program_sentences',
      D11_PROOF: 'room_bindings_and_supervisor_queue',
      D14_ENERGY: 'energy_buffers_not_token_budget',
      D23_FEDERATION: 'D23_repair_gets_super_white_room',
      D35_HYPERLANGUAGE: 'map_map_mapped_room_routes',
      D36_INFERENCE_SURFACE: 'executor_room_active_window',
      D37_AUTHORITY_TOPOLOGY: 'supervisor_rooms_gate_executor_rooms',
      D39_GNN_EDGE: 'room_binding_edges',
      D42_MEETING_ROOM: 'brown_hilbert_rooms',
      D47_BOUNDARY: 'super_white_room_contradiction_boundary'
    },
    addressSpace: {
      activeWindowSize: addressSpace.activeWindowSize,
      activeRoomsUsed: addressSpace.activeRoomsUsed,
      activeRoomsReserved: addressSpace.activeRoomsReserved,
      rightOpenNotation: addressSpace.rightOpenSpace.notation
    },
    counts: {
      executorBindings: executorBindings.length,
      supervisorBindings: supervisorBindings.length,
      superWhiteRooms: superWhiteRooms.rooms.length,
      cascades: energySchedule.cascades.length
    },
    artifacts: outputs()
  };
  return `// cube: brown-hilbert-room-executor-integration-cube-cubed | BEHCS-256 | Brown-Hilbert rooms\nexport const CUBE = ${JSON.stringify(cube, null, 2)}\n`;
}

function prepare({ execute = false } = {}) {
  const generatedAt = new Date().toISOString();
  const dimensions = loadDimensions();
  const executorContracts = readJson(SOURCE_PATHS.executorContracts, { executors: [] });
  const cascadeDivision = readJson(SOURCE_PATHS.cascadeDivision, { cascades: [] });
  const supervisorReady = readNdjson(SOURCE_PATHS.supervisorWorkerReady);
  const rooms = buildRooms(generatedAt, executorContracts, cascadeDivision, dimensions);
  const addressSpace = buildAddressSpace(generatedAt, dimensions, rooms);
  const executorBindings = buildExecutorBindings(generatedAt, executorContracts, rooms);
  const supervisorBindings = buildSupervisorBindings(generatedAt, executorBindings, supervisorReady);
  const superWhiteRooms = buildSuperWhiteRooms(generatedAt, rooms, executorBindings);
  const energySchedule = buildRoomEnergySchedule(generatedAt, cascadeDivision, rooms, executorBindings);
  const supervisorQueue = buildSupervisorQueue(generatedAt, executorBindings, superWhiteRooms);
  const { memory, index, map, cube, glpj } = buildMemoryIndexMapCubeGlpj(
    generatedAt,
    addressSpace,
    rooms,
    executorBindings,
    supervisorBindings,
    superWhiteRooms,
    energySchedule
  );
  const report = {
    reportId: 'brown-hilbert-room-executor-integration-latest',
    generatedAt,
    status: memory.status,
    runId: RUN_ID,
    sourceRun: SOURCE_RUN,
    activeWindowSize: addressSpace.activeWindowSize,
    activeRoomsUsed: addressSpace.activeRoomsUsed,
    activeRoomsReserved: addressSpace.activeRoomsReserved,
    executorBindings: executorBindings.length,
    supervisorBindings: supervisorBindings.length,
    superWhiteRooms: superWhiteRooms.rooms.length,
    supervisorQueuePackets: supervisorQueue.length,
    outputs: outputs()
  };

  if (execute) {
    writeJson(PATHS.addressSpace, addressSpace);
    writeJson(PATHS.activeRooms, {
      activeWindowId: 'active-room-window-64.v1',
      generatedAt,
      rooms
    });
    writeJson(PATHS.executorBindings, {
      bindingSetId: 'executor-room-bindings.v1',
      generatedAt,
      bindings: executorBindings
    });
    writeText(PATHS.executorBindingsNdjson, executorBindings.map((binding) => JSON.stringify(binding)).join('\n') + '\n');
    writeJson(PATHS.supervisorBindings, {
      bindingSetId: 'supervisor-room-bindings.v1',
      generatedAt,
      bindings: supervisorBindings
    });
    writeText(PATHS.supervisorBindingsNdjson, supervisorBindings.map((binding) => JSON.stringify(binding)).join('\n') + '\n');
    writeJson(PATHS.superWhiteRooms, superWhiteRooms);
    writeJson(PATHS.roomEnergySchedule, energySchedule);
    writeText(PATHS.supervisorQueue, supervisorQueue.map((packet) => JSON.stringify(packet)).join('\n') + '\n');
    writeJson(PATHS.memory, memory);
    writeJson(PATHS.index, index);
    writeJson(PATHS.map, map);
    writeText(PATHS.cube, cube);
    writeJson(PATHS.glpj, glpj);
    writeJson(PATHS.reportJson, report);
    writeText(PATHS.reportMd, buildReportMd(report, addressSpace, energySchedule));
    appendNdjson(PATHS.globalInbox, {
      id: `${RUN_ID}-prepare-${Date.now()}`,
      ts: generatedAt,
      from: 'asolaria-canonical',
      to: 'hermes-supervisor-of-supervisors',
      verb: 'EVT-BROWN-HILBERT-ROOMS-BOUND',
      body: {
        runId: RUN_ID,
        activeWindowSize: addressSpace.activeWindowSize,
        activeRoomsUsed: addressSpace.activeRoomsUsed,
        executorBindings: executorBindings.length,
        superWhiteRooms: superWhiteRooms.rooms.length
      }
    });
    appendNdjson(PATHS.gnnEdges, {
      id: `${RUN_ID}-prepare-gnn-${Date.now()}`,
      ts: generatedAt,
      from: 'EXECUTOR_MATRIX',
      to: 'BROWN_HILBERT_ROOM_SPACE',
      verb: 'binds_executors_supervisors_super_white_rooms',
      weight: 0.999,
      activeRoomsUsed: addressSpace.activeRoomsUsed
    });
  }

  return {
    ok: true,
    action: execute ? 'prepare-write' : 'prepare-preview',
    generatedAt,
    status: memory.status,
    runId: RUN_ID,
    activeWindowSize: addressSpace.activeWindowSize,
    activeRoomsUsed: addressSpace.activeRoomsUsed,
    activeRoomsReserved: addressSpace.activeRoomsReserved,
    executorBindings: executorBindings.length,
    supervisorBindings: supervisorBindings.length,
    superWhiteRooms: superWhiteRooms.rooms.length,
    supervisorQueuePackets: supervisorQueue.length,
    outputs: outputs()
  };
}

function buildReportMd(report, addressSpace, energySchedule) {
  const lines = [
    '# Brown-Hilbert Room Executor Integration',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `Status: ${report.status}`,
    '',
    `- Source run: ${report.sourceRun}`,
    `- Right-open room space: ${addressSpace.rightOpenSpace.notation}`,
    `- Active window: ${report.activeWindowSize}`,
    `- Active rooms used: ${report.activeRoomsUsed}`,
    `- Reserve rooms left lazy: ${report.activeRoomsReserved}`,
    `- Executor bindings: ${report.executorBindings}`,
    `- Supervisor bindings: ${report.supervisorBindings}`,
    `- Super white rooms: ${report.superWhiteRooms}`,
    `- Supervisor queue packets: ${report.supervisorQueuePackets}`,
    '',
    '## Energy Schedule',
    '',
    ...energySchedule.cascades.map((cascade) => `- ${cascade.cascade}: room=${cascade.energyRoom}; micro-waves=${cascade.microWaves.length}; barrier=${cascade.barrier}`),
    '',
    '## Rule',
    '',
    'The address space is infinite-right by formula, but only the 64-room active window is materialized. Executors use paired supervisor rooms and cascade-specific super-white rooms. Reserve rooms remain lazy until a supervisor gate and energy check require expansion.',
    '',
    '## Outputs',
    '',
    ...Object.entries(report.outputs || outputs()).map(([key, value]) => `- ${key}: \`${value}\``)
  ];
  return `${lines.join('\n')}\n`;
}

function outputs() {
  return {
    runRoot: repoRel(PATHS.runRoot),
    addressSpace: repoRel(PATHS.addressSpace),
    activeRooms: repoRel(PATHS.activeRooms),
    executorBindings: repoRel(PATHS.executorBindings),
    executorBindingsNdjson: repoRel(PATHS.executorBindingsNdjson),
    supervisorBindings: repoRel(PATHS.supervisorBindings),
    supervisorBindingsNdjson: repoRel(PATHS.supervisorBindingsNdjson),
    superWhiteRooms: repoRel(PATHS.superWhiteRooms),
    roomEnergySchedule: repoRel(PATHS.roomEnergySchedule),
    supervisorQueue: repoRel(PATHS.supervisorQueue),
    memory: repoRel(PATHS.memory),
    index: repoRel(PATHS.index),
    map: repoRel(PATHS.map),
    cube: repoRel(PATHS.cube),
    glpj: repoRel(PATHS.glpj),
    reportJson: repoRel(PATHS.reportJson),
    reportMd: repoRel(PATHS.reportMd)
  };
}

function main(argv) {
  const action = argv[2] || 'status';
  if (action === 'status' || action === 'prepare') {
    console.log(JSON.stringify(prepare({ execute: argv.includes('--execute') }), null, 2));
    return;
  }
  console.error(JSON.stringify({
    ok: false,
    error: `Unknown action: ${action}`,
    usage: ['node tools/asolaria-brown-hilbert-room-executor-integration.js prepare --execute']
  }, null, 2));
  process.exitCode = 2;
}

main(process.argv);
