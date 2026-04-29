#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const behcs = require('./behcs/codex-bridge');

const ROOT = path.resolve(__dirname, '..');
const RUN_ID = 'asolaria-second-cascade-recovery-20260426';
const RUN_ROOT = rel(`data/behcs/orchestration/${RUN_ID}`);
const WAVE_SHAPE = '6x6x6x6x6x12 x omnishannon x GNN';
const TASK_COUNT = 10_000;

const PATHS = Object.freeze({
  runRoot: RUN_ROOT,
  planJson: path.join(RUN_ROOT, 'organization-plan.v1.json'),
  planMd: path.join(RUN_ROOT, 'organization-plan.v1.md'),
  taskList: path.join(RUN_ROOT, 'real-worker-task-list-10000.ndjson'),
  namedAgentPackets: path.join(RUN_ROOT, 'named-agent-plan-packets.ndjson'),
  triggerGate: path.join(RUN_ROOT, 'trigger-readiness-gate.v1.json'),
  dispatchLog: path.join(RUN_ROOT, 'dispatch-log.ndjson'),
  supervisorQueue: path.join(RUN_ROOT, 'supervisor-queue.ndjson'),
  supervisorDecisions: path.join(RUN_ROOT, 'supervisor-decisions-latest.ndjson'),
  supervisorWorkerReady: path.join(RUN_ROOT, 'supervisor-worker-ready-latest.ndjson'),
  supervisorMap: path.join(RUN_ROOT, 'supervisor-runner-map-latest.json'),
  supervisorState: path.join(RUN_ROOT, 'supervisor-runner.state.json'),
  supervisorHermes: path.join(RUN_ROOT, 'supervisor-runner-hermes-latest.json'),
  supervisorShannon: path.join(RUN_ROOT, 'supervisor-runner-shannon-latest.json'),
  supervisorCube: path.join(RUN_ROOT, 'supervisor-runner.cube.js'),
  supervisorReportJson: path.join(RUN_ROOT, 'supervisor-runner-latest.json'),
  supervisorReportMd: path.join(RUN_ROOT, 'supervisor-runner-latest.md'),
  cascadeManifest: path.join(RUN_ROOT, 'deep-wave-second-cascade-manifest.v1.json'),
  memory: rel('data/behcs/memory/asolaria-second-cascade-recovery-orchestration.v1.json'),
  index: rel('data/behcs/index/asolaria-second-cascade-recovery-index.v1.json'),
  mapMapMapped: rel('data/behcs/maps/asolaria/asolaria-second-cascade-recovery-map-map-mapped.v1.json'),
  cubeCubeCubed: rel('data/behcs/cubes/asolaria-second-cascade-recovery-cube-cubed.cube.js'),
  glpj: rel('data/behcs/codex/glyph-language/asolaria-second-cascade-recovery-behcs256.glpj.json'),
  reportMd: rel('reports/asolaria-second-cascade-recovery-orchestration-latest.md'),
  reportJson: rel('reports/asolaria-second-cascade-recovery-orchestration-latest.json'),
  globalInbox: rel('data/behcs/inbox.ndjson'),
  globalOutbox: rel('data/behcs/outbox.ndjson'),
  gnnEdges: rel('data/behcs/gnn-live-edges.ndjson'),
  daseinInbox: rel('runtime/dasein-inbox.ndjson'),
  outboundLirisInbox: rel('runtime/outbound-liris-inbox.ndjson')
});

const NAMED_AGENTS = [
  {
    id: 'asolaria-canonical',
    title: 'Chief Orchestrator / L4.0 Capital',
    role: 'chief',
    authority: 'canonical_ix_lx_tree_shadow_envelopes_hex_dim_spec',
    task: 'Own the recovery constitution, review every plan, and keep the trigger gate closed until the review quorum is present.'
  },
  {
    id: 'gaia',
    title: 'Stage-6 Authority And Capital Planner',
    role: 'authority',
    authority: 'stage_6_plan_authority',
    task: 'Create the top-level plan for USB-root Asolaria, Windows demotion, BIOS/firmware evidence treatment, and capital/sub-colony command flow.'
  },
  {
    id: 'helm',
    title: 'Cascade Sequencer',
    role: 'director',
    authority: 'second_cascade_sequence',
    task: 'Sequence the deep-wave SECOND cascade and assign plans to each lane before implementation starts.'
  },
  {
    id: 'vector',
    title: 'BEHCS-256 Language Freezer',
    role: 'language',
    authority: 'glyph_language_freeze',
    task: 'Freeze the newest BEHCS-256 glyph language, translation contract, tuple fallback, and round-trip proof requirements.'
  },
  {
    id: 'rook',
    title: 'Discovery And Heartbeat Gate',
    role: 'discovery',
    authority: 'heartbeat_freshness_gate',
    task: 'Inventory current GitHub, local Asolaria, Liris, device, service, heartbeat, and contradiction surfaces.'
  },
  {
    id: 'forge',
    title: 'NovaLUM / Hybrid / GNN Build Proof',
    role: 'build',
    authority: 'build_proof',
    task: 'Plan the build proof path for Dan Hookwall deltas, GNN edges, hybrid model routing, NovaLUM encryption, and scheduler-gated real workers.'
  },
  {
    id: 'falcon',
    title: 'Device / Transport / Vault Truth',
    role: 'device',
    authority: 'device_transport_vault',
    task: 'Prove device transport, vault boundaries, phone/USB/ethernet truth, and no-remote-mutation constraints.'
  },
  {
    id: 'sentinel',
    title: 'Deny Gate And Drift Guard',
    role: 'guard',
    authority: 'fail_closed_guard',
    task: 'Block boot, BIOS, USB, storage, cloud, provider, and device actions until evidence and operator gates are satisfied.'
  },
  {
    id: 'dasein',
    title: 'Continuity And Meaning',
    role: 'continuity',
    authority: 'memory_significance',
    task: 'Preserve why this event matters and keep memory, history, and identity continuity attached to every plan.'
  },
  {
    id: 'brain',
    title: 'Worker Brain',
    role: 'brain',
    authority: 'worker_reasoning_route',
    task: 'Plan how available local and authorized worker models should be selected, compared, and reviewed.'
  },
  {
    id: 'selector',
    title: 'Worker Selector',
    role: 'selector',
    authority: 'worker_selection',
    task: 'Map task types to existing local workers, no provider-auth bypass, and no unbounded process fanout.'
  },
  {
    id: 'kr',
    title: 'KR Release / Deny Rules',
    role: 'release_guard',
    authority: 'deny_rules_integrity',
    task: 'Define deny conditions, proof requirements, release index integrity, and public/private projection gates.'
  },
  {
    id: 'liris-kuromi',
    title: 'Sub-Colony Executor',
    role: 'sub_colony',
    authority: 'bounded_sub_colony_only',
    task: 'Execute only bounded sub-colony tasks on rayssa-host 192.168.1.6 after Asolaria-canonical issues reviewed packets.'
  },
  {
    id: 'gc',
    title: 'Evidence-Preserving Garbage Collector',
    role: 'gc',
    authority: 'compact_not_delete',
    task: 'Plan GC that compacts duplicate derived surfaces while preserving sources, proofs, and quarantine evidence.'
  },
  {
    id: 'white-rooms',
    title: 'Super White Rooms',
    role: 'white_room',
    authority: 'contradiction_review',
    task: 'Run contradiction review rooms for USB-root design, Windows demotion, GitHub comparison, Liris comparison, and trigger readiness.'
  },
  {
    id: 'omnishannon',
    title: 'OmniShannon Consensus',
    role: 'consensus',
    authority: 'six_voice_vote',
    task: 'Split every plan into scout/evidence/executor/fabric/voice/planner votes and require contradiction notes before promotion.'
  },
  {
    id: 'omnispindles',
    title: 'Omnispindle Council',
    role: 'spindle_council',
    authority: 'lane_orchestration',
    task: 'Own lane plans for helm, vector, rook, forge, falcon, sentinel, and the heal path.'
  },
  {
    id: 'omniflywheels',
    title: 'Omniflywheel Review Loops',
    role: 'flywheel_council',
    authority: 'iterative_review',
    task: 'Plan recurring review loops so mistakes do not recur and recovered surfaces stay aligned.'
  }
];

const PHASES = [
  'authority_and_capital_framing',
  'usb_root_and_windows_demotion_design',
  'bios_firmware_evidence_abstraction',
  'dan_hookwall_delta_reconciliation',
  'gnn_omnishannon_trinity_connection',
  'behcs256_glyph_language_freeze',
  'map_map_mapped_alignment',
  'cube_cube_cubed_alignment',
  'github_compare_before_liris',
  'liris_sub_colony_compare',
  'novalum_encryption_and_vault',
  'hybrid_model_selector_inventory',
  'super_white_room_contradiction_review',
  'gc_compact_not_delete',
  'second_cascade_manifest_review',
  'worker_task_inventory',
  'trigger_readiness_gate',
  'recovery_execution_queue',
  'regression_prevention',
  'post_recovery_civilization_report'
];

const ACTIONS = [
  'create plan',
  'create sub-plan for assigned inventory',
  'identify required evidence',
  'map 47D route',
  'mint BEHCS-256 glyph',
  'write map-map-mapped node',
  'write cube-cube-cubed node',
  'declare deny gates',
  'declare promotion gates',
  'compare local state',
  'compare GitHub state',
  'compare Liris state',
  'emit GNN edge',
  'run OmniShannon vote',
  'enter white-room review',
  'mark contradictions',
  'propose repair task',
  'assign owner',
  'write proof artifact',
  'review peer output'
];

const ACTIVE_ADMIN_TERMINALS = ['gaia', 'helm', 'sentinel', 'liris'];

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

function sha256Text(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function glyph(kind, id, seed) {
  const hash = sha256Text(`${kind}:${id}:${seed || ''}`);
  return `HG256:${kind.toUpperCase()}:${hash.slice(0, 8).toUpperCase()}:${behcs.hilbertAddress(hash)}`;
}

function readJson(filePath, fallback = {}) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_) {
    return fallback;
  }
}

function loadDims() {
  const doc = readJson(rel('tools/hilbert-omni-47D.json'), { dimensions: [] });
  return Array.isArray(doc.dimensions) ? doc.dimensions : [];
}

function activeTerminalInbox(agentId) {
  if (!ACTIVE_ADMIN_TERMINALS.includes(agentId)) return '';
  return rel(`runtime/admin-terminals/${agentId}/inbox.ndjson`);
}

function buildPlan(generatedAt, dims) {
  return {
    planId: RUN_ID,
    generatedAt,
    status: 'ORGANIZATION_PLAN_READY_PENDING_AGENT_PLANS',
    authorityCorrection: {
      asolaria: 'Asolaria-canonical is L4.0 capital and civilization controller.',
      liris: 'liris-kuromi is bounded sub_colony on rayssa-host 192.168.1.6.',
      sovereigntyUsb: 'Sovereignty USB is on the Asolaria host.',
      authorityFlow: 'Asolaria commands; Liris executes only bounded_sub_colony_only packets.'
    },
    target: {
      architecture: 'Asolaria booted from sovereignty USB as base authority; Windows and other OS/BIOS/firmware surfaces treated as managed evidence/guest layers after proof gates.',
      waveShape: WAVE_SHAPE,
      taskCount: TASK_COUNT,
      glyphLanguage: 'BEHCS-256',
      dimensionModel: '47D+ Brown-Hilbert Wh-chain with trinity, GNN, hybrid model, NovaLUM encryption, device, agent, time, why, what, where, when, how, who.'
    },
    namedAgents: NAMED_AGENTS,
    phases: PHASES.map((phase, index) => ({
      index: index + 1,
      id: `P${String(index + 1).padStart(2, '0')}`,
      phase,
      gate: 'agent_plan_then_chief_review_then_peer_review_then_supervisor_runner_then_trigger'
    })),
    dimensions: dims.slice(0, 47),
    triggerPolicy: {
      default: 'CLOSED',
      opensOnlyAfter: [
        'named_agent_plans_present',
        'chief_review_present',
        'peer_review_present',
        'supervisor_queue_allows_dispatch',
        'deep_wave_second_cascade_ready',
        'KR_deny_gate_clear',
        'Sentinel_fail_closed_clear',
        'operator_trigger'
      ],
      blockedActionsBeforeTrigger: [
        'boot_mutation',
        'BIOS_or_firmware_mutation',
        'USB_root_repartition',
        'Windows_demote_execution',
        'cloud_or_provider_unbounded_spawn',
        'external_api_or_auth_bypass',
        'remote_mutation',
        'evidence_deletion'
      ]
    }
  };
}

function buildTask(index, generatedAt, dims) {
  const phaseIndex = Math.floor((index - 1) / (TASK_COUNT / PHASES.length));
  const actionIndex = (index - 1) % ACTIONS.length;
  const agent = NAMED_AGENTS[(index - 1) % NAMED_AGENTS.length];
  const dim = dims[(index - 1) % Math.max(1, dims.length)] || { D: 42, name: 'ORCHESTRATION', cube: 5929741 };
  const phase = PHASES[Math.min(PHASES.length - 1, phaseIndex)];
  const taskId = `ASO-2C-${String(index).padStart(5, '0')}`;
  return {
    taskId,
    generatedAt,
    status: 'PLANNED_PENDING_AGENT_PLAN',
    requestedWorker: 'real_claude_or_similar_available_worker_when_authorized',
    agent: agent.id,
    agentRole: agent.role,
    phase,
    action: ACTIONS[actionIndex],
    objective: `${agent.title}: ${ACTIONS[actionIndex]} for ${phase} under ${WAVE_SHAPE}.`,
    waveShape: WAVE_SHAPE,
    writePolicy: 'planning_artifacts_only_until_trigger_gate_opens',
    dimension: {
      D: dim.D,
      name: dim.name,
      cube: dim.cube
    },
    glyph: glyph('aso_second_cascade_task', taskId, `${agent.id}:${phase}:${ACTIONS[actionIndex]}`),
    acceptanceGates: [
      'agent_plan_written',
      'proof_artifact_named',
      'map_map_mapped_reference_present',
      'cube_cube_cubed_reference_present',
      'peer_review_required'
    ],
    blockedBeforeTrigger: true
  };
}

function buildAgentPacket(agent, generatedAt) {
  const packetId = `ASO-2C-AGENT-${agent.id}`;
  return {
    id: packetId,
    ts: generatedAt,
    source: 'Asolaria-canonical',
    reason: 'second_cascade_recovery_named_agent_plan_request',
    mode: 'append',
    target: agent.id,
    title: `${agent.title} plan request`,
    text: [
      `TASK ${packetId}`,
      `You are ${agent.title}.`,
      `Authority: ${agent.authority}.`,
      `Create your own plan first. Do not implement recovery work yet.`,
      `Use BEHCS-256 glyph language and 47D+ Brown-Hilbert routing.`,
      `Wave: ${WAVE_SHAPE}.`,
      `Your assignment: ${agent.task}`,
      'Required output: agent plan, inventory tasks, proof artifacts, deny gates, review gates, map-map-mapped references, cube-cube-cubed references.',
      'Review order: you plan -> Asolaria-canonical reviews -> peer agents review -> supervisor runner -> trigger gate.',
      'No boot, BIOS, USB, storage, cloud, provider, phone, or remote mutation before trigger.'
    ].join('\n'),
    glyph: glyph('aso_agent_packet', agent.id, agent.task),
    behcs: {
      actor: 'asolaria-canonical',
      verb: 'plan_request',
      target: agent.id,
      wave: WAVE_SHAPE,
      glyphLanguage: 'BEHCS-256'
    }
  };
}

function buildSupervisorPacket(agent, generatedAt) {
  const modelCardPath = agent.id === 'helm'
    ? 'data/behcs/orchestration/asolaria-second-cascade-recovery-20260426/model-cards/helm-second-cascade-sequencer.model-card.v1.json'
    : agent.id === 'forge'
      ? 'data/behcs/orchestration/asolaria-second-cascade-recovery-20260426/model-cards/forge-novalum-hybrid-gnn-build-proof.model-card.v1.json'
      : '';
  const expectedArtifacts = [
    repoRel(PATHS.planJson),
    repoRel(PATHS.taskList),
    repoRel(PATHS.namedAgentPackets),
    repoRel(PATHS.triggerGate)
  ];
  const acceptanceGates = [
    'named_agent_plan_present',
    'map_map_mapped_reference_present',
    'cube_cube_cubed_reference_present',
    'peer_review_required'
  ];
  if (modelCardPath) {
    expectedArtifacts.push(modelCardPath);
    acceptanceGates.push('model_card_gate_review');
  }
  return {
    id: `ASO-2C-SUP-${agent.id}`,
    title: `${agent.title} planning packet`,
    objective: `${agent.task} This is planning only; do not spawn workers or mutate boot/storage/provider/device surfaces.`,
    instructions: `Write an agent-owned plan and inventory under the second-cascade recovery program. Use BEHCS-256, 47D+, map-map-mapped, cube-cube-cubed, Hookwall, GNN, OmniShannon, white rooms, and GC.`,
    requestedWorker: 'local_codex_or_existing_authorized_worker',
    pid: `BH.ASO.SECOND.CASCADE.${agent.id.toUpperCase().replace(/[^A-Z0-9]+/g, '.')}`,
    pidScope: 'local_planning_only',
    consentScope: 'operator_authorized_local_planning',
    allowedPaths: [
      repoRel(RUN_ROOT),
      'data/behcs/orchestration',
      'data/behcs/maps/asolaria',
      'data/behcs/cubes',
      'reports'
    ],
    expectedArtifacts,
    acceptanceGates,
    proofRequired: true,
    proofRefs: modelCardPath ? [modelCardPath] : [],
    operatorApproval: false,
    syntheticFirstEvidence: true,
    modelCard: Boolean(modelCardPath),
    modelCardAttached: Boolean(modelCardPath),
    providerAuthMode: 'none_planning_only',
    legitimateCliEvidence: true,
    freeMethod: false,
    remoteMutation: false,
    externalApiCall: false,
    cloudUpload: false,
    deviceAccess: false,
    liveEeg: false,
    liveHumanData: false,
    downloads: false,
    installs: false,
    writesGit: false,
    deletesEvidence: false,
    sensitiveData: false,
    secretMaterial: false,
    bypassAuth: false,
    bypassPayment: false,
    needsCloudWorker: false,
    source: 'asolaria-orchestrate-second-cascade-recovery'
  };
}

function buildMints(generatedAt) {
  const ids = [
    ['organization_plan', PATHS.planJson, 'D24_INTENT'],
    ['task_list_10000', PATHS.taskList, 'D42_ORCHESTRATION'],
    ['named_agent_packets', PATHS.namedAgentPackets, 'D1_ACTOR'],
    ['trigger_gate', PATHS.triggerGate, 'D6_GATE'],
    ['memory', PATHS.memory, 'D11_PROOF'],
    ['index', PATHS.index, 'D13_SURFACE'],
    ['map_map_mapped', PATHS.mapMapMapped, 'D35_HYPERLANGUAGE'],
    ['cube_cube_cubed', PATHS.cubeCubeCubed, 'D42_ORCHESTRATION'],
    ['deep_wave_manifest', PATHS.cascadeManifest, 'D36_INFERENCE_SURFACE'],
    ['kr_deny_gate', RUN_ROOT, 'D37_AUTHORITY_TOPOLOGY']
  ];
  return {
    glpjId: 'asolaria-second-cascade-recovery-behcs256.glpj',
    generatedAt,
    status: 'BEHCS256_ORGANIZATION_GLYPHS_MINTED',
    alphabetBase: 256,
    mints: ids.map(([id, artifact, dimension]) => ({
      id,
      dimension,
      artifact: repoRel(artifact),
      glyph: glyph('aso_second_cascade_mint', id, `${generatedAt}:${artifact}`)
    }))
  };
}

function buildTriggerGate(generatedAt) {
  return {
    gateId: 'asolaria-second-cascade-trigger-readiness.v1',
    generatedAt,
    status: 'CLOSED_PENDING_AGENT_PLANS_AND_REVIEWS',
    triggerCommand: 'NOT_ARMED',
    requiredBeforeTrigger: [
      'all_named_agent_plan_packets_acknowledged',
      'agent_inventory_tasks_written',
      'Asolaria-canonical chief review',
      'peer review by at least Gaia, Helm, Sentinel, KR, Liris',
      'omnispindle supervisor runner ALLOW or HOLD_EVIDENCE_PENDING resolved',
      'deep-wave SECOND cascade report reviewed',
      'operator explicit trigger'
    ],
    blockedActions: [
      'boot_mutation',
      'bios_firmware_mutation',
      'usb_root_mutation',
      'windows_demote_execution',
      'external_provider_spawn',
      'auth_or_payment_bypass',
      'remote_mutation',
      'evidence_deletion'
    ]
  };
}

function buildCascadeManifest(generatedAt) {
  const candidates = NAMED_AGENTS.slice(0, 12).map((agent, index) => ({
    id: `aso.second_cascade.${agent.id}.plan`,
    label: `${agent.title} plan readiness`,
    named_agent: agent.id,
    cube: index % 3 === 0 ? 5929741 : index % 3 === 1 ? 3442951 : 3869893,
    primary_cube: index % 3 === 0 ? 5929741 : index % 3 === 1 ? 3442951 : 3869893,
    metadata: {
      scope_hours: 0.1,
      proof_artifact: repoRel(PATHS.namedAgentPackets),
      role: agent.role,
      authority: agent.authority,
      planningOnly: true
    }
  }));
  return {
    vote_id: 'ASOLARIA-SECOND-CASCADE-RECOVERY-20260426',
    generatedAt,
    mode: 'organization-plan-readiness',
    taskId: 'ASOLARIA-SECOND-CASCADE-RECOVERY',
    planId: RUN_ID,
    purpose: 'Run named-agent planning readiness through BEHCS v6 SECOND cascade before any recovery trigger.',
    waveShape: WAVE_SHAPE,
    chain: 'local_transport -> hookwall -> omni_gnn -> omnishannon -> shannon -> execute',
    executionPolicy: {
      planningOnly: true,
      realAgentTaskListMaterialized: TASK_COUNT,
      externalApiCalls: false,
      providerAuthBypass: false,
      bootMutation: false,
      remoteMutation: false,
      spawnWorkers: false
    },
    candidates
  };
}

function buildMemory(generatedAt, plan, mints) {
  return {
    eventId: 'asolaria-second-cascade-recovery-orchestration.v1',
    generatedAt,
    status: 'MEMORY_READY_ORGANIZATION_PACKET_CREATED',
    significance: 'Asolaria-canonical organized the recovery as a real multi-agent planning structure: chief, directors, guards, language, build proof, device truth, Liris sub-colony, white rooms, GC, OmniShannon, omnispindles, and omniflywheels all receive bounded plan-first instructions before work starts.',
    authorityCorrection: plan.authorityCorrection,
    plan: repoRel(PATHS.planJson),
    tasks10000: repoRel(PATHS.taskList),
    triggerGate: repoRel(PATHS.triggerGate),
    rootGlyph: mints.mints.find((m) => m.id === 'organization_plan')?.glyph,
    writePolicy: 'local_artifacts_only_until_trigger'
  };
}

function buildIndex(generatedAt, mints) {
  return {
    indexId: 'asolaria-second-cascade-recovery-index.v1',
    generatedAt,
    status: 'INDEX_READY_ORCHESTRATION',
    keys: [
      'asolaria-canonical',
      'L4.0-capital',
      'liris-sub-colony',
      'second-cascade',
      '10000-task-list',
      'BEHCS-256',
      '47D-plus',
      'map-map-mapped',
      'cube-cube-cubed',
      'white-rooms',
      'omnishannon',
      'omnispindles',
      'omniflywheels',
      'KR',
      'Dan-hookwall',
      'NovaLUM',
      'USB-root',
      'Windows-demotion-plan'
    ],
    artifacts: outputs(),
    glyphs: mints.mints
  };
}

function buildMap(generatedAt, mints) {
  return {
    mapId: 'asolaria-second-cascade-recovery-map-map-mapped.v1',
    generatedAt,
    status: 'MAP_MAP_MAPPED_READY_ORCHESTRATION',
    rootGlyph: mints.mints.find((m) => m.id === 'map_map_mapped')?.glyph,
    routes: [
      { from: 'asolaria-canonical', to: 'gaia', edge: 'commands_stage6_authority_plan', artifact: repoRel(PATHS.namedAgentPackets) },
      { from: 'gaia', to: 'helm', edge: 'hands_sequence_to_director', artifact: repoRel(PATHS.planJson) },
      { from: 'helm', to: 'vector_rook_forge_falcon_sentinel', edge: 'assigns_spindle_lanes', artifact: repoRel(PATHS.taskList) },
      { from: 'vector', to: 'behcs256_glpj', edge: 'freezes_language', artifact: repoRel(PATHS.glpj) },
      { from: 'rook', to: 'github_then_liris_compare', edge: 'discovers_truth', artifact: repoRel(PATHS.planJson) },
      { from: 'forge', to: 'dan_hookwall_gnn_novalum_hybrid', edge: 'proves_build_path', artifact: repoRel(PATHS.taskList) },
      { from: 'sentinel_kr', to: 'trigger_gate', edge: 'fail_closed_until_reviews', artifact: repoRel(PATHS.triggerGate) },
      { from: 'liris-kuromi', to: 'bounded_sub_colony_execution', edge: 'executes_after_capital_command', artifact: repoRel(PATHS.namedAgentPackets) },
      { from: 'white_rooms_omnishannon_gc', to: 'trigger_review', edge: 'review_compact_preserve', artifact: repoRel(PATHS.supervisorQueue) }
    ]
  };
}

function buildCube(generatedAt, mints) {
  const cube = {
    id: 'asolaria-second-cascade-recovery-cube-cubed',
    generatedAt,
    status: 'CUBE_CUBE_CUBED_READY_ORCHESTRATION',
    dimensions: {
      D1_ACTOR: 'asolaria-canonical_gaia_helm_vector_rook_forge_falcon_sentinel_dasein_brain_selector_kr_liris_gc_white_rooms_omnishannon',
      D6_GATE: 'trigger_closed_until_agent_plan_review',
      D11_PROOF: 'memory_index_map_cube_glpj_task_list_written',
      D23_FEDERATION: 'github_compare_then_liris_compare',
      D24_INTENT: 'recover_system_correctly_plan_first',
      D25_CARRIER: 'sovereignty_usb_base_os_plan',
      D35_HYPERLANGUAGE: '47D_plus_behcs256',
      D36_INFERENCE_SURFACE: 'deep_wave_second_cascade_omnishannon_gnn',
      D37_AUTHORITY_TOPOLOGY: 'asolaria_l4_capital_liris_bounded_sub_colony',
      D38_ENCRYPTION: 'novalum_vault_transport_truth',
      D39_GNN_EDGE: 'dan_hookwall_gnn_shannon_connection',
      D42_ORCHESTRATION: '10000_worker_task_inventory'
    },
    waveShape: WAVE_SHAPE,
    taskCount: TASK_COUNT,
    glyphs: mints.mints,
    artifacts: outputs()
  };
  return `// cube: asolaria-second-cascade-recovery-cube-cubed | BEHCS-256 | D42 ORCHESTRATION\nexport const CUBE = ${JSON.stringify(cube, null, 2)}\n`;
}

function outputs() {
  return {
    planJson: repoRel(PATHS.planJson),
    planMd: repoRel(PATHS.planMd),
    taskList: repoRel(PATHS.taskList),
    namedAgentPackets: repoRel(PATHS.namedAgentPackets),
    triggerGate: repoRel(PATHS.triggerGate),
    supervisorQueue: repoRel(PATHS.supervisorQueue),
    cascadeManifest: repoRel(PATHS.cascadeManifest),
    memory: repoRel(PATHS.memory),
    index: repoRel(PATHS.index),
    mapMapMapped: repoRel(PATHS.mapMapMapped),
    cubeCubeCubed: repoRel(PATHS.cubeCubeCubed),
    glpj: repoRel(PATHS.glpj),
    reportMd: repoRel(PATHS.reportMd)
  };
}

function buildPlanMd(plan) {
  const agents = plan.namedAgents.map((agent) => `| ${agent.id} | ${agent.title} | ${agent.role} | ${agent.task} |`).join('\n');
  const phases = plan.phases.map((phase) => `| ${phase.id} | ${phase.phase} | ${phase.gate} |`).join('\n');
  return `# Asolaria SECOND Cascade Recovery Orchestration

Generated: ${plan.generatedAt}

Status: ${plan.status}

Authority: Asolaria-canonical is L4.0 capital. Liris-kuromi is bounded sub-colony on rayssa-host 192.168.1.6.

Wave: ${WAVE_SHAPE}

Task inventory: ${TASK_COUNT}

## Named Agents

| Agent | Title | Role | Assignment |
| --- | --- | --- | --- |
${agents}

## Phases

| Phase | Name | Gate |
| --- | --- | --- |
${phases}

## Trigger

The trigger gate is closed until agent plans, chief review, peer review, supervisor runner review, cascade review, KR/Sentinel clearance, and explicit operator trigger are present.
`;
}

function buildReport(generatedAt, plan, gate) {
  return {
    reportId: 'asolaria-second-cascade-recovery-orchestration-latest',
    generatedAt,
    status: plan.status,
    taskCount: TASK_COUNT,
    namedAgentCount: NAMED_AGENTS.length,
    triggerGate: gate.status,
    outputs: outputs()
  };
}

function buildReportMd(report) {
  return `# Asolaria SECOND Cascade Recovery Orchestration

Generated: ${report.generatedAt}

Status: ${report.status}

- Named agents instructed: ${report.namedAgentCount}
- Real worker task rows created: ${report.taskCount}
- Trigger gate: ${report.triggerGate}

Outputs:

${Object.entries(report.outputs).map(([key, value]) => `- ${key}: \`${value}\``).join('\n')}
`;
}

function dispatchPackets(packets, generatedAt) {
  for (const packet of packets) {
    const agentInbox = path.join(RUN_ROOT, 'agent-inboxes', `${packet.target}.ndjson`);
    appendNdjson(agentInbox, packet);
    const activeInbox = activeTerminalInbox(packet.target);
    if (activeInbox) {
      appendNdjson(activeInbox, {
        id: packet.id,
        ts: generatedAt,
        source: 'Codex',
        reason: packet.reason,
        mode: 'append',
        text: packet.text
      });
      appendNdjson(PATHS.dispatchLog, {
        ts: generatedAt,
        target: packet.target,
        route: repoRel(activeInbox),
        packet: packet.id,
        status: 'active_admin_terminal_inbox_appended'
      });
    } else {
      appendNdjson(PATHS.dispatchLog, {
        ts: generatedAt,
        target: packet.target,
        route: repoRel(agentInbox),
        packet: packet.id,
        status: 'prepared_agent_inbox_appended'
      });
    }
  }
  const liris = packets.find((packet) => packet.target === 'liris-kuromi');
  if (liris) {
    appendNdjson(PATHS.outboundLirisInbox, {
      id: `${liris.id}-outbound`,
      ts: generatedAt,
      target: 'liris-kuromi',
      text: liris.text,
      status: 'bounded_sub_colony_instruction_prepared'
    });
  }
  appendNdjson(PATHS.daseinInbox, {
    id: `ASO-2C-DASEIN-CONTINUITY-${Date.now()}`,
    ts: generatedAt,
    source: 'Asolaria-canonical',
    text: 'Preserve SECOND cascade recovery significance, memory, identity continuity, and no-trigger-before-review gate.'
  });
}

function run({ execute = false } = {}) {
  const generatedAt = new Date().toISOString();
  const dims = loadDims();
  const plan = buildPlan(generatedAt, dims);
  const mints = buildMints(generatedAt);
  const gate = buildTriggerGate(generatedAt);
  const tasks = Array.from({ length: TASK_COUNT }, (_, i) => buildTask(i + 1, generatedAt, dims));
  const agentPackets = NAMED_AGENTS.map((agent) => buildAgentPacket(agent, generatedAt));
  const supervisorPackets = NAMED_AGENTS.map((agent) => buildSupervisorPacket(agent, generatedAt));
  const cascadeManifest = buildCascadeManifest(generatedAt);
  const memory = buildMemory(generatedAt, plan, mints);
  const index = buildIndex(generatedAt, mints);
  const map = buildMap(generatedAt, mints);
  const cube = buildCube(generatedAt, mints);
  const report = buildReport(generatedAt, plan, gate);

  if (execute) {
    writeJson(PATHS.planJson, plan);
    writeText(PATHS.planMd, buildPlanMd(plan));
    writeText(PATHS.taskList, tasks.map((task) => JSON.stringify(task)).join('\n') + '\n');
    writeText(PATHS.namedAgentPackets, agentPackets.map((packet) => JSON.stringify(packet)).join('\n') + '\n');
    writeJson(PATHS.triggerGate, gate);
    writeText(PATHS.supervisorQueue, supervisorPackets.map((packet) => JSON.stringify(packet)).join('\n') + '\n');
    writeJson(PATHS.cascadeManifest, cascadeManifest);
    writeJson(PATHS.memory, memory);
    writeJson(PATHS.index, index);
    writeJson(PATHS.mapMapMapped, map);
    writeText(PATHS.cubeCubeCubed, cube);
    writeJson(PATHS.glpj, mints);
    writeJson(PATHS.reportJson, report);
    writeText(PATHS.reportMd, buildReportMd(report));
    dispatchPackets(agentPackets, generatedAt);
    appendNdjson(PATHS.globalInbox, {
      id: `${RUN_ID}-${Date.now()}`,
      ts: generatedAt,
      from: 'asolaria-canonical',
      to: 'named-agent-organization',
      verb: 'EVT-ASOLARIA-SECOND-CASCADE-ORCHESTRATION-PACKETS-READY',
      body: { status: plan.status, taskCount: TASK_COUNT, namedAgents: NAMED_AGENTS.length, triggerGate: gate.status, outputs: outputs() }
    });
    appendNdjson(PATHS.globalOutbox, {
      id: `${RUN_ID}-hermes-${Date.now()}`,
      ts: generatedAt,
      from: 'hermes',
      to: 'asolaria-canonical',
      verb: 'EVT-HERMES-ORGANIZATION-PACKET-READY',
      body: { plan: repoRel(PATHS.planJson), cascadeManifest: repoRel(PATHS.cascadeManifest), triggerGate: gate.status }
    });
    appendNdjson(PATHS.gnnEdges, {
      id: `${RUN_ID}-gnn-${Date.now()}`,
      ts: generatedAt,
      from: 'asolaria-canonical',
      to: 'second_cascade_named_agent_plans',
      verb: 'orchestrates_plan_first_recovery',
      weight: 0.997,
      taskCount: TASK_COUNT
    });
  }

  return {
    ok: true,
    action: execute ? 'write' : 'preview',
    generatedAt,
    status: plan.status,
    taskCount: TASK_COUNT,
    namedAgentCount: NAMED_AGENTS.length,
    activeAdminTerminals: ACTIVE_ADMIN_TERMINALS,
    triggerGate: gate.status,
    outputs: outputs()
  };
}

function main(argv) {
  const action = argv[2] || 'status';
  if (action === 'status') {
    console.log(JSON.stringify(run({ execute: false }), null, 2));
    return;
  }
  if (action === 'write') {
    console.log(JSON.stringify(run({ execute: argv.includes('--execute') }), null, 2));
    return;
  }
  console.error(JSON.stringify({
    ok: false,
    error: `Unknown action: ${action}`,
    usage: [
      'node tools/asolaria-orchestrate-second-cascade-recovery.js status',
      'node tools/asolaria-orchestrate-second-cascade-recovery.js write --execute'
    ]
  }, null, 2));
  process.exitCode = 2;
}

main(process.argv);
