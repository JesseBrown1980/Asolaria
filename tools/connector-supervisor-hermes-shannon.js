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

const MODE = Object.freeze({
  backend: 'local_filesystem_free_backend',
  cli: 'bare_node_cli',
  headless: true,
  shelllessRuntime: true,
  noServerAuth: true,
  noServerApiRoute: true,
  noExternalApiCalls: true,
  noCloudMutation: true,
  childProcessUse: false,
  secretMaterialWritten: false
});

const SUPERVISOR = Object.freeze({
  actor: 'connector-supervisor-hermes-shannon',
  profGlyph: 'PROF-CONNECTOR-SUPERVISOR',
  supervisorPid: 'PID-H04-A01-W027000000-P027-CONNECTORS',
  hilbertHotelRoom: 27,
  authority: 'observe_verify_dispatch_only'
});

const CONNECTORS = Object.freeze({
  symphony_linear: {
    id: 'symphony_linear',
    title: 'Symphony + Linear',
    lane: 'long_running_issue_lane',
    sourceConnector: 'src/connectors/symphonyConnector.js',
    indexRefs: ['IX-387', 'IX-334'],
    shannonHardFailOn: ['missing_config', 'missing_linear_project', 'missing_linear_api_key', 'missing_workflow']
  },
  hubspot: {
    id: 'hubspot',
    title: 'HubSpot CRM',
    lane: 'crm_oauth_lane',
    sourceConnector: 'src/connectors/hubspotConnector.js',
    indexRefs: ['IX-379'],
    shannonHardFailOn: ['missing_config', 'no_connected_portal', 'token_expired']
  }
});

const PATHS = Object.freeze({
  fleetIndex: rel('data/behcs/index/connectors-supervisor-hermes-shannon.v1.json'),
  fleetCube: rel('data/behcs/cubes/connectors-supervisor-hermes-shannon.cube.js'),
  reportJson: rel('reports/connectors-supervisor-hermes-shannon-latest.json'),
  reportMd: rel('reports/connectors-supervisor-hermes-shannon-latest.md'),
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

function readTextSafe(filePath) {
  try {
    if (!fs.existsSync(filePath)) return '';
    return fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  } catch (_) {
    return '';
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
  fs.appendFileSync(filePath, `${JSON.stringify(data)}\n`, 'utf8');
}

function sha256(input) {
  return crypto.createHash('sha256').update(String(input)).digest('hex');
}

function outputPaths(connectorId) {
  return {
    state: rel(`data/behcs/state/connectors/${connectorId}.state.json`),
    hermes: rel(`data/behcs/hermes/connectors/${connectorId}-dispatch-latest.json`),
    shannon: rel(`data/behcs/shannon/connectors/${connectorId}-consensus-latest.json`)
  };
}

function check(id, ok, detail = '', severity = 'hard') {
  return { id, ok: Boolean(ok), detail: String(detail || ''), severity };
}

function requireConnectorModule(connectorId) {
  if (connectorId === 'symphony_linear') {
    return require('../src/connectors/symphonyConnector.js');
  }
  if (connectorId === 'hubspot') {
    return require('../src/connectors/hubspotConnector.js');
  }
  throw new Error(`Unsupported connector: ${connectorId}`);
}

function summarizeSymphonyLinear() {
  const connector = requireConnectorModule('symphony_linear');
  const status = connector.getSymphonyIntegrationStatus();
  const workflowText = readTextSafe(path.join(repoRoot, 'config/symphony/WORKFLOW.asolaria.md'));
  const linearSkillPath = path.join(process.env.USERPROFILE || 'C:/Users/acer', '.codex/skills/linear/SKILL.md');

  const summary = {
    enabled: Boolean(status.enabled),
    configured: Boolean(status.configured),
    runtime: String(status.runtime || ''),
    port: Number(status.port || 0),
    repoRootExists: Boolean(status.launch?.prerequisites?.repoExists),
    workflowExists: Boolean(status.launch?.prerequisites?.workflowExists),
    launchable: Boolean(status.launch?.launchable),
    processRunning: Boolean(status.process?.running),
    pid: Number(status.process?.pid || 0),
    linearProjectSlug: String(status.linearProjectSlug || ''),
    linearApiKeyConfigured: Boolean(status.linearApiKeyConfigured),
    workflowTrackerKind: workflowText.includes('kind: linear') ? 'linear' : 'unknown',
    workflowProjectSlugPresent: /project_slug:\s*["']?asolaria-symphony-e3159fb1e260["']?/i.test(workflowText),
    codexCommandConfigured: Boolean(String(status.codexCommand || '').trim()),
    linearSkillInstalled: fs.existsSync(linearSkillPath),
    workspaceRoot: status.workspaceRoot ? String(status.workspaceRoot) : '',
    source: 'local_connector_status'
  };

  const checks = [
    check('enabled', summary.enabled, 'Symphony connector enabled.'),
    check('configured', summary.configured, 'Symphony connector has local config.'),
    check('repo_root_exists', summary.repoRootExists, 'Symphony repo root exists.'),
    check('workflow_exists', summary.workflowExists, 'Workflow file exists.'),
    check('launchable', summary.launchable, 'Local prerequisites are launchable.'),
    check('linear_project_slug_present', Boolean(summary.linearProjectSlug), 'Linear project slug is configured.'),
    check('linear_api_key_configured', summary.linearApiKeyConfigured, 'Linear API key is configured in vault/status.'),
    check('workflow_tracker_is_linear', summary.workflowTrackerKind === 'linear', 'Workflow tracker kind is linear.'),
    check('codex_command_configured', summary.codexCommandConfigured, 'Codex command is configured.'),
    check('service_running', summary.processRunning, 'Symphony service is not running; start remains explicit/operator-gated.', 'soft'),
    check('linear_skill_installed', summary.linearSkillInstalled, 'Local Codex Linear skill is installed.', 'soft')
  ];

  return {
    connectorId: 'symphony_linear',
    summary,
    checks,
    residuals: [
      ...(summary.processRunning ? [] : [{
        id: 'symphony_service_stopped',
        state: 'OPEN',
        detail: 'Symphony is configured and launchable, but no process is currently running.'
      }]),
      ...(summary.linearSkillInstalled ? [] : [{
        id: 'linear_codex_skill_not_found',
        state: 'OPEN',
        detail: 'The local Codex Linear skill file was not found; Symphony can still use Linear via its configured API key.'
      }])
    ]
  };
}

function summarizeHubSpot() {
  const connector = requireConnectorModule('hubspot');
  const status = connector.getHubSpotIntegrationStatus({ enabled: true });
  const accounts = Array.isArray(status.connectedAccounts)
    ? status.connectedAccounts
    : Array.isArray(status.accounts) ? status.accounts : [];
  const expiredAccounts = accounts.filter((account) => Number(account.expiresInSec || 0) <= 0);

  const summary = {
    enabled: Boolean(status.enabled),
    configured: Boolean(status.configured),
    configSource: String(status.configSource || ''),
    redirectUri: String(status.redirectUri || ''),
    oauthScopes: Array.isArray(status.oauthScopes) ? status.oauthScopes.slice() : [],
    connectedPortalCount: accounts.length,
    portals: accounts.map((account) => ({
      portalId: String(account.portalId || account.hubId || ''),
      hasRefreshToken: Boolean(account.hasRefreshToken),
      expiresAt: String(account.expiresAt || ''),
      expiresInSec: Number(account.expiresInSec || 0),
      updatedAt: String(account.updatedAt || '')
    })),
    pendingStates: Number(status.oauth?.pendingStates || 0),
    source: 'local_connector_status'
  };

  const hasRefreshToken = summary.portals.some((portal) => portal.hasRefreshToken);
  const hasUnexpired = summary.portals.some((portal) => portal.expiresInSec > 0);

  const checks = [
    check('enabled', summary.enabled, 'HubSpot connector enabled by policy for local status evaluation.'),
    check('configured', summary.configured, 'HubSpot OAuth client is configured.'),
    check('redirect_uri_configured', Boolean(summary.redirectUri), 'Redirect URI is configured.'),
    check('connected_portal_exists', summary.connectedPortalCount > 0, 'At least one portal is connected.'),
    check('refresh_token_present', hasRefreshToken, 'At least one connected portal has a refresh token.'),
    check('access_token_unexpired', hasUnexpired, 'Current access token is expired; refresh/OAuth is required before CRM API use.'),
    check('read_scopes_present', summary.oauthScopes.length > 0, 'OAuth scopes are present.', 'soft')
  ];

  return {
    connectorId: 'hubspot',
    summary,
    checks,
    residuals: [
      ...(expiredAccounts.length ? [{
        id: 'hubspot_access_token_expired',
        state: 'OPEN',
        detail: `HubSpot access token is expired for ${expiredAccounts.length} portal(s); refresh or OAuth reconnect required before CRM API calls.`
      }] : [])
    ]
  };
}

function summarizeConnector(connectorId) {
  if (connectorId === 'symphony_linear') return summarizeSymphonyLinear();
  if (connectorId === 'hubspot') return summarizeHubSpot();
  throw new Error(`Unsupported connector: ${connectorId}`);
}

function classifyStatus(summary) {
  const hardFailures = summary.checks.filter((entry) => !entry.ok && entry.severity !== 'soft');
  const softFailures = summary.checks.filter((entry) => !entry.ok && entry.severity === 'soft');
  if (hardFailures.length > 0) return { status: 'FAIL_CLOSED', hardFailures, softFailures };
  if (summary.residuals.length > 0 || softFailures.length > 0) return { status: 'PASS_WITH_RESIDUAL_OPEN', hardFailures, softFailures };
  return { status: 'PASS', hardFailures, softFailures };
}

function shannonParts() {
  const fallback = [
    { name: 'scout' },
    { name: 'evidence' },
    { name: 'executor' },
    { name: 'fabric' },
    { name: 'voice' },
    { name: 'planner' }
  ];
  return Array.isArray(shannon?.SHANNON_PARTS_CLASSIC) && shannon.SHANNON_PARTS_CLASSIC.length
    ? shannon.SHANNON_PARTS_CLASSIC
    : fallback;
}

function voteValue(name) {
  return shannon?.VOTE_VALUES?.[name] || name;
}

function buildShannon(connectorDef, summary, classification, generatedAt) {
  const votes = shannonParts().map((part) => {
    const name = part.name || part.id || String(part);
    const vote = classification.hardFailures.length > 0
      ? voteValue('HALT')
      : (summary.residuals.length > 0 || classification.softFailures.length > 0 ? voteValue('NEEDS_CHANGE') : voteValue('PROCEED'));

    const reason = (() => {
      if (name === 'scout') return `${connectorDef.title} local surface discovered and classified as ${classification.status}.`;
      if (name === 'evidence') return `${summary.checks.filter((entry) => entry.ok).length}/${summary.checks.length} checks passed from local connector status.`;
      if (name === 'executor') return MODE.noExternalApiCalls ? 'Supervisor does not perform external API calls or mutations.' : 'External calls enabled.';
      if (name === 'fabric') return `${connectorDef.lane} mapped into Hermes local dispatch.`;
      if (name === 'voice') return `Reportable status is ${classification.status}.`;
      if (name === 'planner') return summary.residuals.length ? 'Residuals require operator-gated follow-up.' : 'No residuals found.';
      return `Connector status ${classification.status}.`;
    })();

    return {
      part: name,
      vote,
      types: name === 'planner'
        ? ['risk-authority-correlation', 'failure-concentration']
        : name === 'executor'
          ? ['deterministic-dispatch']
          : ['accuracy-reproducibility'],
      reason
    };
  });

  const consensus = classification.hardFailures.length > 0
    ? 'HALT'
    : (summary.residuals.length > 0 || classification.softFailures.length > 0 ? 'NEEDS-CHANGE' : 'PROCEED');

  return {
    integrationId: `${connectorDef.id}-shannon-consensus`,
    generatedAt,
    connectorId: connectorDef.id,
    status: consensus === 'HALT'
      ? 'consensus_halt'
      : consensus === 'NEEDS-CHANGE'
        ? 'consensus_needs_change_with_residual_tracking'
        : 'consensus_proceed',
    consensus,
    votes,
    hardFailures: classification.hardFailures.map((entry) => entry.id),
    softFailures: classification.softFailures.map((entry) => entry.id),
    residualDisposition: summary.residuals.length ? 'track_open_do_not_claim_green' : 'none'
  };
}

function buildHermes(connectorDef, summary, classification, shannonPacket, generatedAt) {
  return {
    integrationId: `${connectorDef.id}-hermes-dispatch`,
    generatedAt,
    connectorId: connectorDef.id,
    title: connectorDef.title,
    status: classification.status,
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
      SUPERVISOR.profGlyph,
      `HERMES_CONNECTOR_${connectorDef.id.toUpperCase()}`,
      'SHANNON_CLASSIC_6',
      'BEHCS_OUTBOX',
      'GNN_LIVE_EDGES'
    ],
    packet: {
      verb: `EVT-HERMES-CONNECTOR-${connectorDef.id.toUpperCase()}-DISPATCH`,
      glyphSentence: `EVT-HERMES-CONNECTOR-${connectorDef.id.toUpperCase()}-DISPATCH · status=${classification.status} · shannon=${shannonPacket.consensus} @ M-EYEWITNESS .`,
      summary: `${connectorDef.title} connector supervision tick: ${classification.status}.`,
      indexRefs: connectorDef.indexRefs
    },
    connectorSummary: summary.summary,
    residuals: summary.residuals
  };
}

function buildConnectorTick(connectorId, generatedAt) {
  const connectorDef = CONNECTORS[connectorId];
  if (!connectorDef) throw new Error(`Unsupported connector: ${connectorId}`);

  const summary = summarizeConnector(connectorId);
  const classification = classifyStatus(summary);
  const shannonPacket = buildShannon(connectorDef, summary, classification, generatedAt);
  const hermesPacket = buildHermes(connectorDef, summary, classification, shannonPacket, generatedAt);
  const paths = outputPaths(connectorId);

  const state = {
    savedAt: generatedAt,
    connectorId,
    title: connectorDef.title,
    status: classification.status,
    supervisor: SUPERVISOR,
    mode: MODE,
    summary: summary.summary,
    checks: summary.checks,
    hardFailures: classification.hardFailures,
    softFailures: classification.softFailures,
    residuals: summary.residuals,
    hermesPacket: repoRel(paths.hermes),
    shannonPacket: repoRel(paths.shannon)
  };

  const eventId = `connector-supervisor-${connectorId}-${Date.now()}`;
  const inboxEvent = {
    id: eventId,
    from: 'asolaria',
    to: 'federation',
    mode: 'real',
    actor: SUPERVISOR.actor,
    target: connectorId,
    ts: generatedAt,
    verb: 'EVT-CONNECTOR-SUPERVISOR-TICK',
    supervisor_pid: SUPERVISOR.supervisorPid,
    prof_glyph: SUPERVISOR.profGlyph,
    hilbert_hotel_room: SUPERVISOR.hilbertHotelRoom,
    payload: `${connectorDef.title} connector supervisor tick status=${classification.status} shannon=${shannonPacket.consensus}`,
    body: {
      connectorId,
      status: classification.status,
      hardFailures: classification.hardFailures.map((entry) => entry.id),
      softFailures: classification.softFailures.map((entry) => entry.id),
      residuals: summary.residuals.map((entry) => entry.id),
      state: repoRel(paths.state),
      hermes: repoRel(paths.hermes),
      shannon: repoRel(paths.shannon),
      mode: MODE
    },
    glyph_sentence: `EVT-CONNECTOR-SUPERVISOR-TICK · connector=${connectorId} · status=${classification.status} · shannon=${shannonPacket.consensus} @ M-EYEWITNESS .`
  };

  const outboxEvent = {
    id: `${eventId}-hermes`,
    ts: generatedAt,
    from: 'hermes',
    to: connectorId,
    mode: 'real',
    type: 'message',
    verb: hermesPacket.packet.verb,
    payload: hermesPacket.packet.summary,
    body: hermesPacket,
    cube: {
      D1_ACTOR: 'hermes',
      D3_TARGET: connectorId,
      D6_GATE: 'shannon',
      D7_STATE: classification.hardFailures.length ? 'blocked' : 'completed',
      D20_TIME: generatedAt,
      D35_MEMORY: `connector_${connectorId}`,
      D37_AUTHORITY: 'observe_verify_dispatch_only',
      D38_ENCRYPTION: 'no_secret_material',
      D47_BOUNDARY: summary.residuals.length ? 'residual_tracked' : 'closed'
    },
    hash: sha256(`${eventId}:hermes`).slice(0, 16),
    glyph_sentence: hermesPacket.packet.glyphSentence
  };

  const edgeEvent = {
    id: `${eventId}-edge`,
    from: 'connector_supervisor',
    to: connectorId,
    verb: 'supervised_connector_tick',
    weight: classification.hardFailures.length ? 0 : 1,
    ts: generatedAt,
    wh: {
      who: { from: 'asolaria', agent: SUPERVISOR.actor },
      what: `${connectorDef.title} local connector supervision status ${classification.status}`,
      where: {
        repo: 'C:/Users/acer/Asolaria',
        transport: 'local_filesystem',
        receivedBy: connectorId
      },
      when: generatedAt,
      how: 'supervisor_tick_to_hermes_dispatch_to_shannon_consensus',
      why: 'connector fleet supervision without secret material or external API calls'
    }
  };

  const shannonState = {
    seq: Date.now(),
    timestamp: generatedAt,
    intent: 'connector_supervisor',
    verb: `connector.${connectorId}.consensus`,
    target: connectorId,
    scope: 'local_filesystem',
    proof: repoRel(paths.shannon),
    event: shannonPacket.consensus,
    status: shannonPacket.status,
    residualDisposition: shannonPacket.residualDisposition
  };

  return {
    connectorId,
    connectorDef,
    paths,
    state,
    hermesPacket,
    shannonPacket,
    events: { inboxEvent, outboxEvent, edgeEvent, shannonState }
  };
}

function buildFleetIndex(ticks, generatedAt) {
  return {
    indexId: 'connectors-supervisor-hermes-shannon.v1',
    generatedAt,
    status: ticks.some((tick) => tick.state.status === 'FAIL_CLOSED')
      ? 'FLEET_HAS_FAIL_CLOSED'
      : ticks.some((tick) => tick.state.status === 'PASS_WITH_RESIDUAL_OPEN')
        ? 'FLEET_HAS_RESIDUALS'
        : 'FLEET_PASS',
    mode: MODE,
    supervisor: SUPERVISOR,
    connectors: ticks.map((tick) => ({
      id: tick.connectorId,
      title: tick.connectorDef.title,
      lane: tick.connectorDef.lane,
      status: tick.state.status,
      state: repoRel(tick.paths.state),
      hermes: repoRel(tick.paths.hermes),
      shannon: repoRel(tick.paths.shannon),
      hardFailures: tick.state.hardFailures.map((entry) => entry.id),
      softFailures: tick.state.softFailures.map((entry) => entry.id),
      residuals: tick.state.residuals.map((entry) => entry.id)
    }))
  };
}

function buildFleetCube(fleetIndex, generatedAt) {
  const cube = {
    id: 'connectors-supervisor-hermes-shannon',
    generatedAt,
    primaryCatalog: { D: 37, name: 'AUTHORITY_TOPOLOGY', prime: 157 },
    touches: [6, 11, 20, 35, 37, 39, 42, 46, 47],
    gates: ['supervisor', 'hermes', 'shannon', 'sentinel_kr'],
    waves: ['connector_tick', 'hermes_dispatch', 'shannon_consensus', 'gnn_edge'],
    connectors: Object.fromEntries(fleetIndex.connectors.map((entry) => [entry.id, entry.status])),
    payload: {
      kind: 'connector-supervisor-fleet',
      mode: MODE,
      supervisor: SUPERVISOR,
      status: fleetIndex.status,
      connectors: fleetIndex.connectors
    },
    translate: {
      human: 'Connector supervisors verify local connector readiness, dispatch Hermes packets, and run Shannon consensus without external calls.',
      agent: '(asolaria, connectors, supervisor_hermes_shannon, local_cli_only, no_external_api, no_secret_material)',
      device: 'node tools/connector-supervisor-hermes-shannon.js tick --connector all --execute'
    }
  };
  return `// cube: connectors-supervisor-hermes-shannon | local connector fleet | D37 AUTHORITY | D47 BOUNDARY
// gates: supervisor, hermes, shannon, sentinel_kr | waves: tick, dispatch, consensus | kind: local-connector-fleet
export const CUBE = ${JSON.stringify(cube, null, 2)}
`;
}

function buildReport(fleetIndex, ticks, generatedAt) {
  const json = {
    reportId: 'connectors-supervisor-hermes-shannon-latest',
    generatedAt,
    status: fleetIndex.status,
    mode: MODE,
    supervisor: SUPERVISOR,
    fleetIndex: repoRel(PATHS.fleetIndex),
    fleetCube: repoRel(PATHS.fleetCube),
    connectors: fleetIndex.connectors
  };

  const rows = fleetIndex.connectors.map((entry) =>
    `| ${entry.id} | ${entry.status} | ${entry.hardFailures.join(', ') || 'none'} | ${entry.softFailures.join(', ') || 'none'} | ${entry.residuals.join(', ') || 'none'} |`
  ).join('\n');

  const details = ticks.map((tick) => {
    const voteRows = tick.shannonPacket.votes.map((vote) =>
      `| ${vote.part} | ${vote.vote} | ${vote.types.join(', ')} | ${vote.reason} |`
    ).join('\n');
    return `## ${tick.connectorDef.title}

- State: \`${repoRel(tick.paths.state)}\`
- Hermes: \`${repoRel(tick.paths.hermes)}\`
- Shannon: \`${repoRel(tick.paths.shannon)}\`
- Consensus: ${tick.shannonPacket.consensus}

| Part | Vote | Types | Reason |
| --- | --- | --- | --- |
${voteRows}
`;
  }).join('\n');

  const md = `# Connector Supervisors / Hermes / Shannon

Generated: ${generatedAt}

Status: ${fleetIndex.status}

This supervisor is local-only: bare Node, headless, shellless runtime, no server auth, no server API route, no external API calls, no cloud mutation, and no secret material.

| Connector | Status | Hard Failures | Soft Failures | Residuals |
| --- | --- | --- | --- | --- |
${rows}

${details}
`;

  return { json, md };
}

function writeTick(tick) {
  writeJson(tick.paths.state, tick.state);
  writeJson(tick.paths.hermes, tick.hermesPacket);
  writeJson(tick.paths.shannon, tick.shannonPacket);
  appendNdjson(PATHS.inbox, tick.events.inboxEvent);
  appendNdjson(PATHS.outbox, tick.events.outboxEvent);
  appendNdjson(PATHS.gnnEdges, tick.events.edgeEvent);
  appendNdjson(PATHS.agentShannonState, tick.events.shannonState);
}

function resolveConnectorIds(argv) {
  const raw = valueAfter(argv, '--connector') || valueAfter(argv, '--connectors') || 'all';
  if (raw === 'all') return Object.keys(CONNECTORS);
  const ids = raw.split(',').map((entry) => entry.trim()).filter(Boolean);
  for (const id of ids) {
    if (!CONNECTORS[id]) throw new Error(`Unsupported connector "${id}". Supported: ${Object.keys(CONNECTORS).join(', ')}, all`);
  }
  return ids;
}

function tick(argv, { execute = false } = {}) {
  const generatedAt = nowIso();
  const connectorIds = resolveConnectorIds(argv);
  const ticks = connectorIds.map((connectorId) => buildConnectorTick(connectorId, generatedAt));
  const fleetIndex = buildFleetIndex(ticks, generatedAt);
  const fleetCube = buildFleetCube(fleetIndex, generatedAt);
  const report = buildReport(fleetIndex, ticks, generatedAt);

  if (execute) {
    for (const entry of ticks) writeTick(entry);
    writeJson(PATHS.fleetIndex, fleetIndex);
    writeText(PATHS.fleetCube, fleetCube);
    writeJson(PATHS.reportJson, report.json);
    writeText(PATHS.reportMd, report.md);
  }

  return {
    ok: !ticks.some((entry) => entry.state.status === 'FAIL_CLOSED'),
    action: execute ? 'tick' : 'preview',
    generatedAt,
    status: fleetIndex.status,
    connectors: fleetIndex.connectors,
    outputs: {
      fleetIndex: repoRel(PATHS.fleetIndex),
      fleetCube: repoRel(PATHS.fleetCube),
      reportJson: repoRel(PATHS.reportJson),
      reportMd: repoRel(PATHS.reportMd)
    },
    mode: MODE
  };
}

function status(argv) {
  const preview = tick(argv, { execute: false });
  return {
    ...preview,
    action: 'status',
    existing: {
      fleetIndex: fs.existsSync(PATHS.fleetIndex),
      fleetCube: fs.existsSync(PATHS.fleetCube),
      reportJson: fs.existsSync(PATHS.reportJson),
      reportMd: fs.existsSync(PATHS.reportMd)
    }
  };
}

function valueAfter(argv, flag) {
  const index = argv.indexOf(flag);
  if (index === -1 || index + 1 >= argv.length) return null;
  return argv[index + 1];
}

function main(argv) {
  const action = argv[2] || 'status';
  const execute = argv.includes('--execute');

  if (action === 'status') {
    console.log(JSON.stringify(status(argv), null, 2));
    return;
  }
  if (action === 'tick') {
    console.log(JSON.stringify(tick(argv, { execute }), null, 2));
    return;
  }
  if (action === 'list') {
    console.log(JSON.stringify({ ok: true, connectors: CONNECTORS, mode: MODE }, null, 2));
    return;
  }

  console.error(JSON.stringify({
    ok: false,
    error: `Unknown action: ${action}`,
    usage: [
      'node tools/connector-supervisor-hermes-shannon.js list',
      'node tools/connector-supervisor-hermes-shannon.js status --connector all',
      'node tools/connector-supervisor-hermes-shannon.js tick --connector all --execute',
      'node tools/connector-supervisor-hermes-shannon.js tick --connector symphony_linear --execute',
      'node tools/connector-supervisor-hermes-shannon.js tick --connector hubspot --execute'
    ]
  }, null, 2));
  process.exitCode = 2;
}

main(process.argv);
