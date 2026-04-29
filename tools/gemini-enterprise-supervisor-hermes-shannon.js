#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let shannon = null;
try {
  shannon = require('./shannon-consensus/shannon-consensus.js');
} catch (_) {
  shannon = null;
}

const repoRoot = path.resolve(__dirname, '..');

const BINDING_EVENT_ID = 'gemini-enterprise-seat-binding-20260423';
const SUPERVISOR_ID = 'gemini-enterprise-seat-supervisor';
const HERMES_ID = 'gemini-enterprise-hermes-dispatch';
const SHANNON_ID = 'gemini-enterprise-shannon-consensus';

const SUPERVISOR_PROFILE = {
  actor: SUPERVISOR_ID,
  profGlyph: 'PROF-GEMINI-SEAT-SUPERVISOR',
  supervisorPid: 'PID-H04-A01-W027000000-P027-GEMINI',
  hilbertHotelRoom: 27,
  cadence: 'manual_tick_or_watch',
  authority: 'observe_verify_dispatch_only'
};

const MODE = Object.freeze({
  backend: 'local_filesystem_free_backend',
  cli: 'bare_node_cli',
  headless: true,
  shelllessRuntime: true,
  noServerAuth: true,
  noServerApiRoute: true,
  noGoogleApiCalls: true,
  noCloudMutation: true,
  childProcessUse: false,
  secretMaterialWritten: false
});

const PATHS = Object.freeze({
  bindingCli: rel('tools/gemini-enterprise-behcs256-bind.js'),
  bindingIndex: rel('data/behcs/index/gemini-enterprise-seat-bindings.v1.json'),
  bindingMap: rel('data/behcs/maps/gemini-enterprise-seat-map.v1.json'),
  bindingGlyph: rel('data/behcs/codex/glyph-language/gemini-enterprise-seat-wave.v1.json'),
  bindingCube: rel('data/behcs/cubes/gemini-enterprise-seat-cube.cube.js'),
  bindingBrownHilbert: rel('brown-hilbert/13-2026-04-23-gemini-enterprise-seat-binding.md'),
  bindingReportJson: rel('reports/gemini-enterprise-behcs256-seat-binding-latest.json'),
  bindingReportMd: rel('reports/gemini-enterprise-behcs256-seat-binding-latest.md'),
  memoryIndex: rel('data/behcs/memory-cube-index.json'),
  supervisorState: rel('data/behcs/state/gemini-enterprise-seat-supervisor.state.json'),
  supervisorIndex: rel('data/behcs/index/gemini-enterprise-supervisor-hermes-shannon.v1.json'),
  hermesPacket: rel('data/behcs/hermes/gemini-enterprise-seat-dispatch-latest.json'),
  shannonPacket: rel('data/behcs/shannon/gemini-enterprise-seat-consensus-latest.json'),
  integrationCube: rel('data/behcs/cubes/gemini-enterprise-supervisor-hermes-shannon.cube.js'),
  reportJson: rel('reports/gemini-enterprise-supervisor-hermes-shannon-latest.json'),
  reportMd: rel('reports/gemini-enterprise-supervisor-hermes-shannon-latest.md'),
  inbox: rel('data/behcs/inbox.ndjson'),
  outbox: rel('data/behcs/outbox.ndjson'),
  gnnEdges: rel('data/behcs/gnn-live-edges.ndjson'),
  agentShannonState: rel('data/behcs/state/agent-shannon-state.ndjson')
});

function rel(p) {
  return path.join(repoRoot, p);
}

function repoRel(p) {
  return path.relative(repoRoot, p).replace(/\\/g, '/');
}

function nowIso() {
  return new Date().toISOString();
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
}

function readJsonSafe(filePath) {
  try {
    if (!fs.existsSync(filePath)) return { ok: false, reason: 'missing' };
    return { ok: true, value: JSON.parse(readText(filePath)) };
  } catch (error) {
    return { ok: false, reason: `parse_error:${error.message}` };
  }
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
  const prefix = fs.existsSync(filePath) && fs.readFileSync(filePath, 'utf8').length > 0 ? '' : '';
  fs.appendFileSync(filePath, `${prefix}${JSON.stringify(data)}\n`, 'utf8');
}

function sha256(input) {
  return crypto.createHash('sha256').update(String(input)).digest('hex');
}

function fileHash(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return sha256(fs.readFileSync(filePath)).slice(0, 16);
}

function allAssigned(targets) {
  return Array.isArray(targets)
    && targets.length === 3
    && targets.every((target) => target && target.assignmentState === 'ASSIGNED' && typeof target.principal === 'string');
}

function addCheck(checks, id, ok, detail = '') {
  checks.push({ id, ok: Boolean(ok), detail: String(detail || '') });
}

function validateBinding() {
  const checks = [];
  const parsed = {
    index: readJsonSafe(PATHS.bindingIndex),
    map: readJsonSafe(PATHS.bindingMap),
    glyph: readJsonSafe(PATHS.bindingGlyph),
    report: readJsonSafe(PATHS.bindingReportJson),
    memoryIndex: readJsonSafe(PATHS.memoryIndex)
  };

  addCheck(checks, 'binding_cli_exists', fs.existsSync(PATHS.bindingCli), repoRel(PATHS.bindingCli));
  addCheck(checks, 'binding_index_exists_and_parses', parsed.index.ok, parsed.index.reason || repoRel(PATHS.bindingIndex));
  addCheck(checks, 'binding_map_exists_and_parses', parsed.map.ok, parsed.map.reason || repoRel(PATHS.bindingMap));
  addCheck(checks, 'binding_glyph_exists_and_parses', parsed.glyph.ok, parsed.glyph.reason || repoRel(PATHS.bindingGlyph));
  addCheck(checks, 'binding_cube_exists', fs.existsSync(PATHS.bindingCube), repoRel(PATHS.bindingCube));
  addCheck(checks, 'brown_hilbert_room_exists', fs.existsSync(PATHS.bindingBrownHilbert), repoRel(PATHS.bindingBrownHilbert));
  addCheck(checks, 'binding_report_exists_and_parses', parsed.report.ok, parsed.report.reason || repoRel(PATHS.bindingReportJson));
  addCheck(checks, 'binding_report_md_exists', fs.existsSync(PATHS.bindingReportMd), repoRel(PATHS.bindingReportMd));

  const index = parsed.index.value || {};
  const map = parsed.map.value || {};
  const glyph = parsed.glyph.value || {};
  const report = parsed.report.value || {};
  const memoryIndex = parsed.memoryIndex.value || {};
  const licenseTruth = index.licenseTruth || report.indexSummary || {};
  const targets = index.licenseTruth?.targets || [];
  const residuals = index.licenseTruth?.residuals || [];
  const mode = index.mode || report.mode || {};

  addCheck(checks, 'three_targets_assigned', allAssigned(targets), targets.map((target) => `${target.lane}:${target.assignmentState}`).join(','));
  addCheck(checks, 'license_count_three', Number(index.licenseTruth?.licenseCount) === 3, String(index.licenseTruth?.licenseCount || ''));
  addCheck(checks, 'license_state_active', index.licenseTruth?.state === 'ACTIVE', String(index.licenseTruth?.state || ''));
  addCheck(checks, 'local_mode_no_google_api', mode.noGoogleApiCalls === true, JSON.stringify(mode));
  addCheck(checks, 'local_mode_no_server_api', mode.noServerApiRoute === true && mode.noServerAuth === true, JSON.stringify(mode));
  addCheck(checks, 'map_has_three_assignment_edges', Array.isArray(map.edges) && map.edges.filter((edge) => edge.verb === 'assigned_seat').length === 3, 'assigned_seat edge count');
  addCheck(checks, 'glyph_has_principal_entries', Array.isArray(glyph.entries) && glyph.entries.filter((entry) => String(entry.catalogDimensionName || '').startsWith('PRINCIPAL_')).length === 3, 'principal glyph entries');
  addCheck(checks, 'memory_index_has_binding', Boolean(memoryIndex.memories?.project_gemini_enterprise_seats_assigned_20260423), 'memory key');
  addCheck(checks, 'identity_residual_tracked', Array.isArray(residuals) && residuals.length > 0, residuals.map((r) => r.id).join(','));

  const hardFailures = checks.filter((check) => !check.ok && check.id !== 'identity_residual_tracked');
  const status = hardFailures.length > 0
    ? 'FAIL_CLOSED'
    : (Array.isArray(residuals) && residuals.length > 0 ? 'PASS_WITH_IDENTITY_RESIDUAL_OPEN' : 'PASS');

  return {
    status,
    ok: hardFailures.length === 0,
    checks,
    hardFailures,
    residuals,
    licenseTruth: {
      assertion: index.licenseTruth?.assertion || 'Gemini Enterprise Plus seats local binding',
      state: index.licenseTruth?.state || null,
      licenseCount: index.licenseTruth?.licenseCount || null,
      usedLicenseCount: index.licenseTruth?.usedLicenseCount || null,
      productTier: index.licenseTruth?.productTier || null,
      userStore: index.licenseTruth?.userStore || null,
      licenseConfig: index.licenseTruth?.licenseConfig || null,
      targets
    },
    fileHashes: Object.fromEntries(
      Object.entries(PATHS)
        .filter(([key]) => key.startsWith('binding') || key === 'memoryIndex')
        .map(([key, value]) => [key, fileHash(value)])
    )
  };
}

function shannonParts() {
  const defaults = [
    { name: 'scout' },
    { name: 'evidence' },
    { name: 'executor' },
    { name: 'fabric' },
    { name: 'voice' },
    { name: 'planner' }
  ];
  return Array.isArray(shannon?.SHANNON_PARTS_CLASSIC) && shannon.SHANNON_PARTS_CLASSIC.length > 0
    ? shannon.SHANNON_PARTS_CLASSIC
    : defaults;
}

function voteValue(name) {
  return shannon?.VOTE_VALUES?.[name] || name;
}

function buildShannonConsensus(validation, generatedAt) {
  const partVotes = shannonParts().map((part) => {
    const name = part.name || part.id || String(part);
    const hardFail = validation.hardFailures.length > 0;
    const base = {
      part: name,
      vote: hardFail ? voteValue('HALT') : voteValue('PROCEED'),
      types: [],
      reason: ''
    };

    if (name === 'scout') {
      base.types = ['dimension-population'];
      base.reason = validation.licenseTruth.targets.length === 3
        ? 'three target lanes are visible'
        : 'target lane count is not three';
    } else if (name === 'evidence') {
      base.types = ['accuracy-reproducibility'];
      base.reason = 'binding index, map, glyph, report, and memory surfaces parsed locally';
    } else if (name === 'executor') {
      base.types = ['deterministic-dispatch'];
      base.reason = 'replay path is a bare Node CLI with no child process and no cloud call';
    } else if (name === 'fabric') {
      base.types = ['topology-star-not-dag', 'dimension-population'];
      base.reason = 'Hermes dispatch fans out from one verified license config to three principal lanes';
    } else if (name === 'voice') {
      base.types = ['compression-ratio'];
      base.reason = 'human report and Brown-Hilbert room summarize the binding without secrets';
    } else if (name === 'planner') {
      base.types = ['risk-authority-correlation', 'failure-concentration'];
      base.reason = validation.residuals.length > 0
        ? 'local binding can proceed, but Workspace/IAM identity residual stays open'
        : 'no residuals reported';
    } else {
      base.types = ['accuracy-reproducibility'];
      base.reason = 'default Shannon part confirmed local validation state';
    }
    return base;
  });

  const haltVotes = partVotes.filter((vote) => vote.vote === voteValue('HALT') || vote.vote === voteValue('REFUSED'));
  const consensus = haltVotes.length > 0 ? 'HALT' : 'PROCEED';

  return {
    integrationId: SHANNON_ID,
    generatedAt,
    status: consensus === 'PROCEED' ? 'consensus_proceed_with_residual_tracking' : 'consensus_halt',
    engine: {
      source: shannon ? 'tools/shannon-consensus/shannon-consensus.js' : 'local_fallback',
      partsMode: 'classic',
      partCount: partVotes.length,
      analysisSpaceSizeClassic: shannon?.ANALYSIS_SPACE_SIZE_CLASSIC || null,
      totalTypes: shannon?.TOTAL_TYPES || 12
    },
    consensus,
    residualDisposition: validation.residuals.length > 0 ? 'track_open_do_not_claim_identity_closure' : 'none',
    votes: partVotes,
    validationStatus: validation.status,
    nextActions: validation.residuals.length > 0
      ? ['obtain Workspace Directory authority or create the Google identities before claiming mailbox/IAM closure']
      : []
  };
}

function buildHermesDispatch(validation, shannonConsensus, generatedAt) {
  return {
    integrationId: HERMES_ID,
    generatedAt,
    status: validation.ok ? 'ready_to_dispatch_local_truth' : 'halted_validation_failed',
    mode: MODE,
    transport: {
      kind: 'local_behcs_ndjson',
      noNetwork: true,
      noServerRoute: true,
      noAuthHeader: true,
      noSecretMaterial: true,
      outbox: repoRel(PATHS.outbox),
      inbox: repoRel(PATHS.inbox)
    },
    route: [
      SUPERVISOR_PROFILE.profGlyph,
      'HERMES_LOCAL_DISPATCH',
      'SHANNON_CLASSIC_6',
      'BEHCS_OUTBOX',
      'GNN_LIVE_EDGES'
    ],
    recipients: validation.licenseTruth.targets.map((target) => ({
      lane: target.lane,
      principal: target.principal,
      assignmentState: target.assignmentState,
      delivery: 'local_truth_packet'
    })),
    packet: {
      verb: 'EVT-HERMES-GEMINI-SEAT-DISPATCH',
      glyphSentence: `EVT-HERMES-GEMINI-SEAT-DISPATCH · seats=3 · state=${validation.licenseTruth.state || 'unknown'} · shannon=${shannonConsensus.consensus} @ M-EYEWITNESS .`,
      summary: 'Gemini Enterprise Plus seat binding is locally supervised and dispatched to Asolaria, Liris, and Falcon surfaces.',
      surfaces: {
        supervisor: repoRel(PATHS.supervisorState),
        shannon: repoRel(PATHS.shannonPacket),
        index: repoRel(PATHS.bindingIndex),
        map: repoRel(PATHS.bindingMap),
        glyph: repoRel(PATHS.bindingGlyph),
        cube: repoRel(PATHS.bindingCube),
        brownHilbert: repoRel(PATHS.bindingBrownHilbert)
      }
    }
  };
}

function buildSupervisorIndex(validation, hermesDispatch, shannonConsensus, generatedAt) {
  return {
    indexId: 'gemini-enterprise-supervisor-hermes-shannon.v1',
    generatedAt,
    status: validation.status,
    bindingEventId: BINDING_EVENT_ID,
    supervisor: SUPERVISOR_PROFILE,
    mode: MODE,
    integrations: {
      hermes: {
        id: HERMES_ID,
        packet: repoRel(PATHS.hermesPacket),
        status: hermesDispatch.status
      },
      shannon: {
        id: SHANNON_ID,
        packet: repoRel(PATHS.shannonPacket),
        status: shannonConsensus.status,
        consensus: shannonConsensus.consensus
      }
    },
    validation,
    outputs: {
      supervisorState: repoRel(PATHS.supervisorState),
      supervisorIndex: repoRel(PATHS.supervisorIndex),
      hermesPacket: repoRel(PATHS.hermesPacket),
      shannonPacket: repoRel(PATHS.shannonPacket),
      integrationCube: repoRel(PATHS.integrationCube),
      reportJson: repoRel(PATHS.reportJson),
      reportMd: repoRel(PATHS.reportMd)
    }
  };
}

function buildCube(validation, hermesDispatch, shannonConsensus, generatedAt) {
  const cube = {
    id: 'gemini-enterprise-supervisor-hermes-shannon',
    eventId: `${BINDING_EVENT_ID}-supervised`,
    generatedAt,
    primaryCatalog: { D: 37, name: 'AUTHORITY_TOPOLOGY', prime: 157 },
    touches: [6, 11, 20, 35, 37, 39, 42, 46, 47],
    gates: ['supervisor', 'hermes', 'shannon', 'sentinel_kr'],
    waves: ['supervisor_tick', 'hermes_dispatch', 'shannon_consensus', 'gnn_edge'],
    connectors: {
      'gemini-enterprise-behcs256-bind': 'binding-source',
      'shannon-consensus': 'classic-six-part-local-vote',
      'behcs-ndjson': 'local-hermes-transport'
    },
    payload: {
      kind: 'supervisor-hermes-shannon-integration',
      mode: MODE,
      supervisor: SUPERVISOR_PROFILE,
      status: validation.status,
      hermes: {
        status: hermesDispatch.status,
        route: hermesDispatch.route
      },
      shannon: {
        status: shannonConsensus.status,
        consensus: shannonConsensus.consensus,
        residualDisposition: shannonConsensus.residualDisposition
      },
      licenseTruth: validation.licenseTruth
    },
    translate: {
      human: 'Supervisor verifies the Gemini Enterprise seat binding, Hermes dispatches the local truth packet, Shannon votes on the binding without cloud calls.',
      agent: '(asolaria, gemini_enterprise_plus, supervisor_hermes_shannon, local_cli_only, proceed_with_residual_tracking, no_api, no_auth, no_secret_material)',
      device: 'node tools/gemini-enterprise-supervisor-hermes-shannon.js tick --execute'
    }
  };

  return `// cube: gemini-enterprise-supervisor-hermes-shannon | ${BINDING_EVENT_ID} | D37 AUTHORITY | D47 BOUNDARY
// gates: supervisor, hermes, shannon, sentinel_kr | waves: tick, dispatch, consensus | kind: local-integration
export const CUBE = ${JSON.stringify(cube, null, 2)}
`;
}

function buildReport(validation, hermesDispatch, shannonConsensus, generatedAt) {
  const json = {
    reportId: 'gemini-enterprise-supervisor-hermes-shannon-latest',
    generatedAt,
    status: validation.status,
    mode: MODE,
    supervisor: SUPERVISOR_PROFILE,
    hermes: hermesDispatch,
    shannon: shannonConsensus,
    validation
  };

  const targetRows = validation.licenseTruth.targets
    .map((target) => `| ${target.lane} | ${target.principal} | ${target.assignmentState} |`)
    .join('\n');
  const voteRows = shannonConsensus.votes
    .map((vote) => `| ${vote.part} | ${vote.vote} | ${vote.types.join(', ')} | ${vote.reason} |`)
    .join('\n');
  const failedChecks = validation.checks.filter((check) => !check.ok);
  const failedText = failedChecks.length
    ? failedChecks.map((check) => `- ${check.id}: ${check.detail}`).join('\n')
    : '- none';
  const residualText = validation.residuals.length
    ? validation.residuals.map((residual) => `- ${residual.id}: ${residual.detail || residual.state || 'open'}`).join('\n')
    : '- none';

  const md = `# Gemini Enterprise Supervisor / Hermes / Shannon

Generated: ${generatedAt}

Status: ${validation.status}

This integration is local-only: bare Node, headless, shellless runtime, no server auth, no server API route, no Google API call, no cloud mutation, and no secret material.

## Supervisor

- Profile: ${SUPERVISOR_PROFILE.profGlyph}
- Room: ${SUPERVISOR_PROFILE.hilbertHotelRoom}
- PID glyph: ${SUPERVISOR_PROFILE.supervisorPid}
- State: \`${repoRel(PATHS.supervisorState)}\`

## Hermes Dispatch

- Packet: \`${repoRel(PATHS.hermesPacket)}\`
- Transport: ${hermesDispatch.transport.kind}
- Route: ${hermesDispatch.route.join(' -> ')}

| Lane | Principal | State |
| --- | --- | --- |
${targetRows}

## Shannon Consensus

- Packet: \`${repoRel(PATHS.shannonPacket)}\`
- Consensus: ${shannonConsensus.consensus}
- Residual disposition: ${shannonConsensus.residualDisposition}

| Part | Vote | Types | Reason |
| --- | --- | --- | --- |
${voteRows}

## Failed Checks

${failedText}

## Residuals

${residualText}
`;

  return { json, md };
}

function buildEvents(validation, hermesDispatch, shannonConsensus, generatedAt) {
  const tickId = `${BINDING_EVENT_ID}-supervisor-${Date.now()}`;
  const commonBody = {
    bindingEventId: BINDING_EVENT_ID,
    status: validation.status,
    targets: validation.licenseTruth.targets,
    residuals: validation.residuals,
    supervisorState: repoRel(PATHS.supervisorState),
    hermesPacket: repoRel(PATHS.hermesPacket),
    shannonPacket: repoRel(PATHS.shannonPacket),
    mode: MODE
  };

  const supervisorTick = {
    id: tickId,
    from: 'asolaria',
    to: 'federation',
    mode: 'real',
    actor: SUPERVISOR_PROFILE.actor,
    target: 'gemini-enterprise-seat-binding',
    ts: generatedAt,
    verb: 'EVT-GEMINI-SEAT-SUPERVISOR-TICK',
    supervisor_pid: SUPERVISOR_PROFILE.supervisorPid,
    prof_glyph: SUPERVISOR_PROFILE.profGlyph,
    hilbert_hotel_room: SUPERVISOR_PROFILE.hilbertHotelRoom,
    payload: `Gemini seat supervisor tick status=${validation.status} shannon=${shannonConsensus.consensus}`,
    body: commonBody,
    glyph_sentence: `EVT-GEMINI-SEAT-SUPERVISOR-TICK · status=${validation.status} · shannon=${shannonConsensus.consensus} @ M-EYEWITNESS .`
  };

  const hermesOutbox = {
    id: `${tickId}-hermes`,
    ts: generatedAt,
    from: 'hermes',
    to: 'asolaria_liris_falcon',
    mode: 'real',
    type: 'message',
    verb: hermesDispatch.packet.verb,
    payload: hermesDispatch.packet.summary,
    body: hermesDispatch,
    cube: {
      D1_ACTOR: 'hermes',
      D3_TARGET: 'asolaria_liris_falcon',
      D6_GATE: 'shannon',
      D7_STATE: validation.ok ? 'completed' : 'blocked',
      D20_TIME: generatedAt,
      D35_MEMORY: 'project_gemini_enterprise_seats_assigned_20260423',
      D37_AUTHORITY: 'observe_verify_dispatch_only',
      D38_ENCRYPTION: 'no_secret_material',
      D47_BOUNDARY: 'identity_residual_tracked'
    },
    hash: sha256(`${tickId}:hermes`).slice(0, 16),
    glyph_sentence: hermesDispatch.packet.glyphSentence
  };

  const gnnEdge = {
    id: `${tickId}-shannon-edge`,
    from: 'gemini_enterprise_seat_supervisor',
    to: 'shannon_consensus',
    verb: 'supervised_local_seat_binding',
    weight: shannonConsensus.consensus === 'PROCEED' ? 1 : 0,
    ts: generatedAt,
    wh: {
      who: { from: 'asolaria', agent: SUPERVISOR_PROFILE.actor },
      what: `Shannon ${shannonConsensus.consensus} over Gemini Enterprise seat binding`,
      where: {
        repo: 'C:/Users/acer/Asolaria',
        transport: 'local_filesystem',
        receivedBy: 'shannon'
      },
      when: generatedAt,
      how: 'supervisor_tick_to_hermes_dispatch_to_shannon_consensus',
      why: 'durable local supervision of assigned Gemini Enterprise seats'
    }
  };

  const shannonState = {
    seq: Date.now(),
    timestamp: generatedAt,
    intent: 'supervisor_integration',
    verb: 'gemini_enterprise_seat_binding.consensus',
    target: 'asolaria_liris_falcon',
    scope: 'local_filesystem',
    proof: repoRel(PATHS.shannonPacket),
    event: shannonConsensus.consensus,
    status: shannonConsensus.status,
    residualDisposition: shannonConsensus.residualDisposition
  };

  return { supervisorTick, hermesOutbox, gnnEdge, shannonState };
}

function tick({ execute = false } = {}) {
  const generatedAt = nowIso();
  const validation = validateBinding();
  const shannonConsensus = buildShannonConsensus(validation, generatedAt);
  const hermesDispatch = buildHermesDispatch(validation, shannonConsensus, generatedAt);
  const supervisorIndex = buildSupervisorIndex(validation, hermesDispatch, shannonConsensus, generatedAt);
  const cube = buildCube(validation, hermesDispatch, shannonConsensus, generatedAt);
  const report = buildReport(validation, hermesDispatch, shannonConsensus, generatedAt);
  const events = buildEvents(validation, hermesDispatch, shannonConsensus, generatedAt);

  const result = {
    ok: validation.ok,
    action: execute ? 'tick' : 'preview',
    generatedAt,
    status: validation.status,
    supervisor: SUPERVISOR_PROFILE,
    hermes: {
      status: hermesDispatch.status,
      packet: repoRel(PATHS.hermesPacket)
    },
    shannon: {
      status: shannonConsensus.status,
      consensus: shannonConsensus.consensus,
      packet: repoRel(PATHS.shannonPacket)
    },
    outputs: {
      supervisorState: repoRel(PATHS.supervisorState),
      supervisorIndex: repoRel(PATHS.supervisorIndex),
      hermesPacket: repoRel(PATHS.hermesPacket),
      shannonPacket: repoRel(PATHS.shannonPacket),
      integrationCube: repoRel(PATHS.integrationCube),
      reportJson: repoRel(PATHS.reportJson),
      reportMd: repoRel(PATHS.reportMd)
    },
    failedChecks: validation.checks.filter((check) => !check.ok).map((check) => check.id),
    residuals: validation.residuals.map((residual) => residual.id)
  };

  if (!execute) return result;

  writeJson(PATHS.supervisorState, {
    savedAt: generatedAt,
    status: validation.status,
    supervisor: SUPERVISOR_PROFILE,
    mode: MODE,
    validation,
    hermes: {
      packet: repoRel(PATHS.hermesPacket),
      status: hermesDispatch.status
    },
    shannon: {
      packet: repoRel(PATHS.shannonPacket),
      status: shannonConsensus.status,
      consensus: shannonConsensus.consensus
    }
  });
  writeJson(PATHS.supervisorIndex, supervisorIndex);
  writeJson(PATHS.hermesPacket, hermesDispatch);
  writeJson(PATHS.shannonPacket, shannonConsensus);
  writeText(PATHS.integrationCube, cube);
  writeJson(PATHS.reportJson, report.json);
  writeText(PATHS.reportMd, report.md);
  appendNdjson(PATHS.inbox, events.supervisorTick);
  appendNdjson(PATHS.outbox, events.hermesOutbox);
  appendNdjson(PATHS.gnnEdges, events.gnnEdge);
  appendNdjson(PATHS.agentShannonState, events.shannonState);

  return result;
}

function status() {
  const validation = validateBinding();
  const state = readJsonSafe(PATHS.supervisorState);
  return {
    ok: validation.ok,
    action: 'status',
    status: validation.status,
    supervisorState: {
      path: repoRel(PATHS.supervisorState),
      exists: fs.existsSync(PATHS.supervisorState),
      savedAt: state.value?.savedAt || null
    },
    hermesPacket: {
      path: repoRel(PATHS.hermesPacket),
      exists: fs.existsSync(PATHS.hermesPacket)
    },
    shannonPacket: {
      path: repoRel(PATHS.shannonPacket),
      exists: fs.existsSync(PATHS.shannonPacket)
    },
    failedChecks: validation.checks.filter((check) => !check.ok),
    residuals: validation.residuals,
    mode: MODE
  };
}

async function watch(argv) {
  const execute = argv.includes('--execute');
  if (!execute) {
    return {
      ok: true,
      action: 'watch',
      dryRun: true,
      message: 'Pass --execute to run watch mode. Use --max-ticks to bound it.'
    };
  }

  const intervalArg = valueAfter(argv, '--interval-ms') || valueAfter(argv, '--interval');
  const maxTicksArg = valueAfter(argv, '--max-ticks');
  const intervalMs = Math.max(1000, Number(intervalArg || 30000));
  const maxTicks = Math.max(1, Number(maxTicksArg || 1));
  const ticks = [];
  for (let i = 0; i < maxTicks; i += 1) {
    ticks.push(tick({ execute: true }));
    if (i < maxTicks - 1) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }
  return {
    ok: ticks.every((entry) => entry.ok),
    action: 'watch',
    intervalMs,
    maxTicks,
    ticks
  };
}

function valueAfter(argv, flag) {
  const index = argv.indexOf(flag);
  if (index === -1 || index + 1 >= argv.length) return null;
  return argv[index + 1];
}

async function main(argv) {
  const action = argv[2] || 'status';
  const execute = argv.includes('--execute');

  if (action === 'status') {
    console.log(JSON.stringify(status(), null, 2));
    return;
  }

  if (action === 'tick') {
    if (!execute) {
      console.log(JSON.stringify(tick({ execute: false }), null, 2));
      return;
    }
    console.log(JSON.stringify(tick({ execute: true }), null, 2));
    return;
  }

  if (action === 'watch') {
    console.log(JSON.stringify(await watch(argv), null, 2));
    return;
  }

  console.error(JSON.stringify({
    ok: false,
    error: `Unknown action: ${action}`,
    usage: [
      'node tools/gemini-enterprise-supervisor-hermes-shannon.js status',
      'node tools/gemini-enterprise-supervisor-hermes-shannon.js tick --execute',
      'node tools/gemini-enterprise-supervisor-hermes-shannon.js watch --execute --interval-ms 30000 --max-ticks 3'
    ]
  }, null, 2));
  process.exitCode = 2;
}

main(process.argv).catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
  process.exitCode = 1;
});
