#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

const repoRoot = path.resolve(__dirname, '..');

const MODE = Object.freeze({
  backend: 'local_filesystem_free_backend',
  cli: 'bare_node_cli',
  headless: true,
  shelllessRuntime: true,
  noServerAuth: true,
  noServerApiRoute: true,
  noExternalApiCalls: true,
  noKimiApiCall: true,
  noKimiCliRun: true,
  noSecretWrite: true,
  noDownloads: true,
  noInstall: true,
  noModelExecution: true,
  noAgentLaunch: true,
  childProcessUse: false,
  secretMaterialWritten: false
});

const PATHS = Object.freeze({
  absorbNote: rel('reports/kimi-k2-6-absorb-latest.md'),
  state: rel('data/behcs/state/kimi/kimi-k2-6-supervisors.state.json'),
  supervisors: rel('data/behcs/supervisors/kimi/kimi-k2-6-supervisors.v1.json'),
  microPartsJson: rel('data/behcs/codex/glyph-language/kimi-k2-6-behcs256-micro-parts.v1.json'),
  microPartsCsv: rel('data/behcs/codex/glyph-language/kimi-k2-6-behcs256-micro-parts-latest.csv'),
  omniwhite: rel('data/behcs/omniwhite-room/kimi-k2-6-breakdown-latest.json'),
  hermes: rel('data/behcs/hermes/kimi/kimi-k2-6-supervisors-dispatch-latest.json'),
  shannon: rel('data/behcs/shannon/kimi/kimi-k2-6-supervisors-consensus-latest.json'),
  cube: rel('data/behcs/cubes/kimi-k2-6-supervisors.cube.js'),
  reportJson: rel('reports/kimi-k2-6-supervisor-breakdown-latest.json'),
  reportMd: rel('reports/kimi-k2-6-supervisor-breakdown-latest.md'),
  inbox: rel('data/behcs/inbox.ndjson'),
  outbox: rel('data/behcs/outbox.ndjson'),
  gnnEdges: rel('data/behcs/gnn-live-edges.ndjson')
});

const DOMAINS = Object.freeze([
  domain(0, 'official_source', 'Official source and provenance', 'source_anchor_required'),
  domain(1, 'auth_secret', 'Authentication and secret custody', 'vault_or_env_required_no_repo_secret'),
  domain(2, 'endpoint_transport', 'API endpoint and request transport', 'official_https_endpoint_required'),
  domain(3, 'model_catalog', 'Model id, aliases, and catalog fit', 'allowlisted_model_required'),
  domain(4, 'kimi_code_cli', 'Kimi Code CLI and local login status', 'cli_install_login_required_for_cli'),
  domain(5, 'brain_routing', 'Asolaria brain/external routing', 'provider_id_route_required'),
  domain(6, 'prompt_policy', 'Prompt policy and redaction', 'sensitive_material_redacted'),
  domain(7, 'output_safety', 'Output safety and claim boundaries', 'unsafe_claim_blocked'),
  domain(8, 'cost_budget', 'Cost, quota, timeout, and context budget', 'budget_limit_required'),
  domain(9, 'tool_mcp', 'Tool and MCP compatibility', 'tool_allowlist_required'),
  domain(10, 'observability', 'Audit, status, and telemetry', 'audit_event_required'),
  domain(11, 'test_harness', 'Smoke, negative, and regression tests', 'no_live_call_in_unit_tests'),
  domain(12, 'gc_lifecycle', 'Garbage collection and lifecycle', 'source_evidence_preserved'),
  domain(13, 'neurotech_boundary', 'Neurotech use boundary', 'planning_only_no_live_interpretation'),
  domain(14, 'storage_provenance', 'Storage, weights, and local provenance', 'hash_license_disk_gate_required'),
  domain(15, 'release_cutover', 'Release, rollback, and cutover', 'operator_cutover_required')
]);

const ASPECTS = Object.freeze([
  'identity',
  'input',
  'normalization',
  'provenance',
  'allowlist',
  'denylist',
  'secret_scope',
  'request_shape',
  'response_shape',
  'telemetry',
  'shannon_vote',
  'omniwhite_review',
  'gnn_edge',
  'gc_policy',
  'test_case',
  'rollback'
]);

function rel(p) {
  return path.join(repoRoot, p);
}

function repoRel(p) {
  return path.relative(repoRoot, p).replace(/\\/g, '/');
}

function redactLocalPath(filePath) {
  const text = String(filePath || '').trim();
  if (!text) return '';
  const resolved = path.resolve(text);
  const rootWithSep = repoRoot.endsWith(path.sep) ? repoRoot : `${repoRoot}${path.sep}`;
  if (resolved === repoRoot || resolved.startsWith(rootWithSep)) {
    return repoRel(resolved);
  }
  const home = os.homedir();
  const homeWithSep = home.endsWith(path.sep) ? home : `${home}${path.sep}`;
  if (resolved === home) return '~';
  if (resolved.startsWith(homeWithSep)) {
    return `~/${path.relative(home, resolved).replace(/\\/g, '/')}`;
  }
  return path.basename(resolved);
}

function domain(index, key, title, gate) {
  return { index, key, title, gate };
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
  fs.writeFileSync(filePath, String(text || '').endsWith('\n') ? String(text || '') : `${text}\n`, 'utf8');
}

function appendNdjson(filePath, data) {
  ensureDir(filePath);
  fs.appendFileSync(filePath, `${JSON.stringify(data)}\n`, 'utf8');
}

function sha256Text(text) {
  return crypto.createHash('sha256').update(String(text || '')).digest('hex');
}

function readTextIfExists(filePath) {
  try {
    return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  } catch (_) {
    return '';
  }
}

function fileHashIfExists(filePath) {
  try {
    return fs.existsSync(filePath)
      ? crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')
      : '';
  } catch (_) {
    return '';
  }
}

function csvEscape(value) {
  const text = String(value ?? '');
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function supervisorId(domainKey) {
  return `kimi.${domainKey}.supervisor`;
}

function buildSupervisors() {
  return DOMAINS.map((entry) => ({
    id: supervisorId(entry.key),
    domainIndex: entry.index,
    domain: entry.key,
    title: entry.title,
    gate: entry.gate,
    authority: 'observe_plan_verify_only',
    ownsMicroRange: {
      from: entry.index * 16,
      to: entry.index * 16 + 15
    },
    responsibilities: [
      `Validate Kimi ${entry.key} evidence before runtime use.`,
      'Emit one Shannon vote for its owned domain.',
      'Map findings into BEHCS-256 micro-parts.',
      'Block promotion if gate evidence is missing.'
    ],
    writePolicy: 'local_artifacts_only',
    runtimePolicy: {
      apiCalls: 'blocked',
      cliRuns: 'blocked',
      secrets: 'not_written',
      downloads: 'blocked'
    }
  }));
}

function microDetail(domainEntry, aspect) {
  return `${domainEntry.title}: ${aspect.replace(/_/g, ' ')} check for Kimi K2.6 provider integration.`;
}

function buildMicroParts(supervisors) {
  const supervisorByDomain = new Map(supervisors.map((entry) => [entry.domain, entry]));
  const parts = [];
  for (const domainEntry of DOMAINS) {
    const owner = supervisorByDomain.get(domainEntry.key);
    for (let aspectIndex = 0; aspectIndex < ASPECTS.length; aspectIndex += 1) {
      const globalIndex = domainEntry.index * 16 + aspectIndex;
      const aspect = ASPECTS[aspectIndex];
      parts.push({
        index: globalIndex,
        glyph: `BH.KIMI.${String(globalIndex).padStart(3, '0')}`,
        behcs256: {
          domain: domainEntry.index,
          slot: aspectIndex,
          byte: globalIndex,
          hex: `0x${globalIndex.toString(16).toUpperCase().padStart(2, '0')}`
        },
        domain: domainEntry.key,
        aspect,
        supervisor: owner.id,
        gate: domainEntry.gate,
        status: 'MICRO_PART_READY_PLAN_ONLY',
        detail: microDetail(domainEntry, aspect),
        evidenceRequired: evidenceFor(domainEntry.key, aspect),
        failureMode: failureFor(domainEntry.key, aspect)
      });
    }
  }
  return parts;
}

function evidenceFor(domainKey, aspect) {
  if (domainKey === 'auth_secret') return 'API key exists only in vault/env, never in repo artifacts.';
  if (domainKey === 'endpoint_transport') return 'Base URL host is api.moonshot.ai or api.moonshot.cn over HTTPS.';
  if (domainKey === 'kimi_code_cli') return 'Kimi Code executable and ~/.kimi/config.toml are present before CLI transport.';
  if (domainKey === 'neurotech_boundary') return 'Prompt is planning/safety/code only, with no live EEG interpretation.';
  if (domainKey === 'storage_provenance') return 'Model weights have license, hash, model card, and disk budget before download.';
  if (aspect === 'rollback') return 'Rollback path is documented before enabling runtime.';
  return 'Local connector, report, or official-source evidence exists.';
}

function failureFor(domainKey, aspect) {
  if (domainKey === 'auth_secret') return 'secret_leak_or_missing_key';
  if (domainKey === 'endpoint_transport') return 'non_official_endpoint_or_http_transport';
  if (domainKey === 'model_catalog') return 'unallowlisted_model_id';
  if (domainKey === 'kimi_code_cli') return 'cli_not_installed_or_not_logged_in';
  if (domainKey === 'neurotech_boundary') return 'unsafe_live_neurotech_claim';
  if (aspect === 'denylist') return 'known_bad_condition_not_blocked';
  return 'missing_evidence';
}

function buildOmniwhiteRoom(supervisors, microParts, generatedAt) {
  return {
    roomId: 'kimi-k2-6-omniwhite-room-breakdown.v1',
    generatedAt,
    status: 'BREAKDOWN_COMPLETE_PLAN_ONLY',
    mode: MODE,
    panels: [
      panel('chief_helm', 'Keep Kimi as its own provider id; do not smuggle it through OpenAI/Cursor lanes.', 'PROCEED_SUPERVISORS_ONLY'),
      panel('gaia_dasein_brain', 'Break the connector into 16 domains x 16 micro-parts so the system can reason locally.', 'PROCEED_BEHCS256_MICRO'),
      panel('sentinel_kr', 'Block runtime until secret custody, endpoint allowlist, budget, and operator cutover are satisfied.', 'HALT_RUNTIME_UNTIL_GATED'),
      panel('falcon_selector', 'Use BH.KIMI.000..255 glyphs as packet-addressable micro-parts for future BEHCS routing.', 'PROCEED_LANGUAGE_BINDING'),
      panel('shannon_gnn_omnishannon_gc', 'Rank risks before gains; preserve source evidence; compact generated artifacts without deleting proof.', 'PROCEED_GNN_GC_PLAN_ONLY'),
      panel('omniwhite_room', 'Separate API, CLI, local weights, neurotech planning, and agent orchestration into isolated lanes.', 'PROCEED_DECOMPOSITION')
    ],
    supervisors: supervisors.map((entry) => ({
      id: entry.id,
      domain: entry.domain,
      gate: entry.gate,
      range: entry.ownsMicroRange
    })),
    microPartCount: microParts.length,
    microPartRange: {
      from: microParts[0]?.glyph || '',
      to: microParts[microParts.length - 1]?.glyph || ''
    }
  };
}

function panel(id, finding, vote) {
  return { id, finding, vote };
}

function buildShannon(omniwhite, generatedAt) {
  return {
    integrationId: 'kimi-k2-6-supervisors-shannon-consensus',
    generatedAt,
    status: 'consensus_supervisors_ready_runtime_blocked',
    consensus: 'PROCEED-SUPERVISORS-ONLY',
    executionDisposition: 'no_api_no_cli_no_secret_no_download_no_agent_launch',
    votes: [
      { part: 'source', vote: 'PROCEED', reason: 'Official Kimi/Moonshot source anchors are recorded.' },
      { part: 'auth', vote: 'HALT_RUNTIME', reason: 'No Kimi API key is present or written by this tranche.' },
      { part: 'api', vote: 'PROCEED_PLAN_ONLY', reason: 'OpenAI-compatible Kimi API transport is wired but unconfigured.' },
      { part: 'cli', vote: 'HALT_CLI_RUNTIME', reason: 'Kimi Code CLI is not installed/logged in locally.' },
      { part: 'bechcs256', vote: 'PROCEED', reason: `Exactly ${omniwhite.microPartCount} BEHCS-256 micro-parts are emitted.` },
      { part: 'neurotech', vote: 'HALT_LIVE_INTERPRETATION', reason: 'Kimi may review plans/code only; no live EEG or medical inference.' }
    ]
  };
}

function buildHermes(supervisors, microParts, shannon, generatedAt) {
  return {
    integrationId: 'kimi-k2-6-supervisors-hermes-dispatch',
    generatedAt,
    status: 'KIMI_SUPERVISORS_READY_PLAN_ONLY',
    mode: MODE,
    packet: {
      verb: 'EVT-HERMES-KIMI-K2-6-SUPERVISOR-BREAKDOWN',
      summary: 'Kimi K2.6 connector decomposed into supervisors and BEHCS-256 micro-parts.',
      provider: 'kimi',
      model: 'kimi-k2.6',
      supervisorCount: supervisors.length,
      microPartCount: microParts.length,
      consensus: shannon.consensus,
      report: repoRel(PATHS.reportMd)
    }
  };
}

function buildCube(supervisors, microParts, shannon, generatedAt) {
  const cube = {
    id: 'kimi-k2-6-supervisors',
    generatedAt,
    primaryCatalog: { D: 37, name: 'AUTHORITY', prime: 157 },
    touches: [6, 20, 35, 37, 38, 39, 42, 47],
    gates: ['source', 'secret', 'endpoint', 'budget', 'cli', 'neurotech_boundary', 'operator_cutover'],
    payload: {
      kind: 'kimi-provider-supervisor-breakdown',
      status: 'KIMI_SUPERVISORS_READY_PLAN_ONLY',
      provider: 'kimi',
      model: 'kimi-k2.6',
      supervisorCount: supervisors.length,
      microPartCount: microParts.length,
      shannon: {
        consensus: shannon.consensus,
        executionDisposition: shannon.executionDisposition
      }
    },
    translate: {
      human: 'Kimi K2.6 is decomposed into local supervisors and BEHCS-256 micro-parts; runtime remains gated.',
      agent: '(asolaria, kimi, moonshot, supervisor, behcs256, shannon, omniwhite, no_api, no_secret)',
      device: 'node tools/kimi-k2-6-supervisor-breakdown.js breakdown --execute'
    }
  };
  return `// cube: kimi-k2-6-supervisors | kimi | D37 AUTHORITY
export const CUBE = ${JSON.stringify(cube, null, 2)}
`;
}

function buildCsv(microParts) {
  const header = [
    'index',
    'glyph',
    'hex',
    'domain',
    'aspect',
    'supervisor',
    'gate',
    'status',
    'failureMode'
  ];
  const rows = microParts.map((entry) => [
    entry.index,
    entry.glyph,
    entry.behcs256.hex,
    entry.domain,
    entry.aspect,
    entry.supervisor,
    entry.gate,
    entry.status,
    entry.failureMode
  ].map(csvEscape).join(','));
  return `${header.join(',')}\n${rows.join('\n')}\n`;
}

function buildReport(payload) {
  const { generatedAt, source, supervisors, microParts, omniwhite, shannon } = payload;
  const supervisorRows = supervisors.map((entry) =>
    `| ${entry.id} | ${entry.domain} | ${entry.ownsMicroRange.from}-${entry.ownsMicroRange.to} | ${entry.gate} |`
  ).join('\n');
  const panelRows = omniwhite.panels.map((entry) =>
    `| ${entry.id} | ${entry.vote} | ${entry.finding} |`
  ).join('\n');
  const sampleRows = microParts.slice(0, 16).map((entry) =>
    `| ${entry.index} | ${entry.glyph} | ${entry.domain} | ${entry.aspect} | ${entry.gate} |`
  ).join('\n');

  const json = {
    reportId: 'kimi-k2-6-supervisor-breakdown-latest',
    generatedAt,
    status: 'KIMI_SUPERVISORS_READY_PLAN_ONLY',
    mode: MODE,
    source,
    supervisorCount: supervisors.length,
    microPartCount: microParts.length,
    omniwhite,
    shannon,
    outputs: outputMap()
  };

  const md = `# Kimi K2.6 Supervisor Breakdown

Generated: ${generatedAt}

Status: KIMI_SUPERVISORS_READY_PLAN_ONLY

This is a local decomposition pass. It did not call Kimi, run Kimi Code, write secrets, download models, install tools, launch agents, or switch the active runtime.

## Source

- Absorb note: \`${source.absorbNote}\`
- Absorb note sha256: \`${source.absorbNoteSha256}\`
- API connector: \`${source.apiConnector}\`
- CLI probe connector: \`${source.cliConnector}\`

## Supervisors

| Supervisor | Domain | Micro Range | Gate |
| --- | --- | ---: | --- |
${supervisorRows}

## Omniwhite Room

| Panel | Vote | Finding |
| --- | --- | --- |
${panelRows}

## Shannon

- Consensus: ${shannon.consensus}
- Execution: ${shannon.executionDisposition}

## BEHCS-256 Micro-Parts

- Count: ${microParts.length}
- Range: \`${microParts[0].glyph}\` through \`${microParts[microParts.length - 1].glyph}\`
- JSON: \`${repoRel(PATHS.microPartsJson)}\`
- CSV: \`${repoRel(PATHS.microPartsCsv)}\`

| Index | Glyph | Domain | Aspect | Gate |
| ---: | --- | --- | --- | --- |
${sampleRows}
`;

  return { json, md };
}

function outputMap() {
  return {
    state: repoRel(PATHS.state),
    supervisors: repoRel(PATHS.supervisors),
    microPartsJson: repoRel(PATHS.microPartsJson),
    microPartsCsv: repoRel(PATHS.microPartsCsv),
    omniwhite: repoRel(PATHS.omniwhite),
    hermes: repoRel(PATHS.hermes),
    shannon: repoRel(PATHS.shannon),
    cube: repoRel(PATHS.cube),
    reportJson: repoRel(PATHS.reportJson),
    reportMd: repoRel(PATHS.reportMd)
  };
}

function sourceSnapshot() {
  const absorbText = readTextIfExists(PATHS.absorbNote);
  const kimiConfigPath = path.join(os.homedir(), '.kimi', 'config.toml');
  return {
    absorbNote: repoRel(PATHS.absorbNote),
    absorbNoteExists: Boolean(absorbText),
    absorbNoteSha256: sha256Text(absorbText),
    apiConnector: 'src/connectors/externalBrainConnector.js',
    apiConnectorSha256: fileHashIfExists(rel('src/connectors/externalBrainConnector.js')),
    cliConnector: 'src/connectors/kimiCodeConnector.js',
    cliConnectorSha256: fileHashIfExists(rel('src/connectors/kimiCodeConnector.js')),
    brainOrchestrator: 'src/brainOrchestrator.js',
    server: 'server.js',
    intentRouter: 'src/intentRouter.js',
    provider: {
      id: 'kimi',
      model: 'kimi-k2.6',
      vaultKey: 'integrations.external.kimi',
      envPrefix: 'ASOLARIA_KIMI_',
      apiBase: 'https://api.moonshot.ai',
      apiPath: '/v1/chat/completions',
      apiStyle: 'openai_chat_completions',
      authHeader: 'Authorization: Bearer <Kimi/Moonshot API key>'
    },
    localCli: {
      configPathRef: redactLocalPath(kimiConfigPath),
      configExists: fs.existsSync(kimiConfigPath),
      executableEnvRef: redactLocalPath(process.env.ASOLARIA_KIMI_CODE_PATH || ''),
      status: fs.existsSync(kimiConfigPath) ? 'CONFIG_PRESENT_CLI_NOT_RUN' : 'CONFIG_ABSENT_CLI_NOT_RUN'
    }
  };
}

function breakdown({ execute = false } = {}) {
  const generatedAt = new Date().toISOString();
  const source = sourceSnapshot();
  const supervisors = buildSupervisors();
  const microParts = buildMicroParts(supervisors);
  const omniwhite = buildOmniwhiteRoom(supervisors, microParts, generatedAt);
  const shannon = buildShannon(omniwhite, generatedAt);
  const hermes = buildHermes(supervisors, microParts, shannon, generatedAt);
  const cube = buildCube(supervisors, microParts, shannon, generatedAt);
  const report = buildReport({ generatedAt, source, supervisors, microParts, omniwhite, shannon });
  const eventId = `kimi-k2-6-supervisors-${Date.now()}`;

  const supervisorPayload = {
    supervisorSetId: 'kimi-k2-6-supervisors.v1',
    generatedAt,
    status: 'KIMI_SUPERVISORS_READY_PLAN_ONLY',
    mode: MODE,
    provider: source.provider,
    supervisors
  };

  const microPayload = {
    languageId: 'kimi-k2-6-behcs256-micro-parts.v1',
    generatedAt,
    status: 'BEHCS256_MICRO_PARTS_READY',
    provider: 'kimi',
    model: 'kimi-k2.6',
    count: microParts.length,
    encoding: {
      scheme: '16_domains_x_16_slots',
      byteRange: '0x00..0xFF',
      glyphRange: 'BH.KIMI.000..BH.KIMI.255'
    },
    domains: DOMAINS,
    aspects: ASPECTS,
    microParts
  };

  if (execute) {
    writeJson(PATHS.state, {
      savedAt: generatedAt,
      status: 'KIMI_SUPERVISORS_READY_PLAN_ONLY',
      mode: MODE,
      outputs: outputMap()
    });
    writeJson(PATHS.supervisors, supervisorPayload);
    writeJson(PATHS.microPartsJson, microPayload);
    writeText(PATHS.microPartsCsv, buildCsv(microParts));
    writeJson(PATHS.omniwhite, omniwhite);
    writeJson(PATHS.hermes, hermes);
    writeJson(PATHS.shannon, shannon);
    writeText(PATHS.cube, cube);
    writeJson(PATHS.reportJson, report.json);
    writeText(PATHS.reportMd, report.md);
    appendNdjson(PATHS.inbox, {
      id: eventId,
      ts: generatedAt,
      from: 'asolaria',
      to: 'kimi-supervisors',
      verb: 'EVT-KIMI-K2-6-SUPERVISOR-BREAKDOWN',
      body: {
        status: 'KIMI_SUPERVISORS_READY_PLAN_ONLY',
        supervisorCount: supervisors.length,
        microPartCount: microParts.length,
        report: repoRel(PATHS.reportMd)
      }
    });
    appendNdjson(PATHS.outbox, {
      id: `${eventId}-hermes`,
      ts: generatedAt,
      from: 'hermes',
      to: 'kimi-supervisors',
      verb: hermes.packet.verb,
      body: hermes
    });
    for (const entry of DOMAINS) {
      appendNdjson(PATHS.gnnEdges, {
        id: `${eventId}-edge-${entry.key}`,
        ts: generatedAt,
        from: 'kimi_k2_6_provider',
        to: `behcs256_${entry.key}`,
        verb: 'decomposes_into_supervised_micro_parts',
        weight: 0.5 + entry.index / 40
      });
    }
  }

  return {
    ok: true,
    action: execute ? 'breakdown' : 'preview',
    generatedAt,
    status: 'KIMI_SUPERVISORS_READY_PLAN_ONLY',
    supervisorCount: supervisors.length,
    microPartCount: microParts.length,
    shannon: {
      status: shannon.status,
      consensus: shannon.consensus
    },
    omniwhitePanels: omniwhite.panels.length,
    outputs: outputMap(),
    mode: MODE
  };
}

function main(argv) {
  const action = argv[2] || 'status';
  const execute = argv.includes('--execute');
  if (action === 'status') {
    console.log(JSON.stringify(breakdown({ execute: false }), null, 2));
    return;
  }
  if (action === 'breakdown') {
    console.log(JSON.stringify(breakdown({ execute }), null, 2));
    return;
  }
  console.error(JSON.stringify({
    ok: false,
    error: `Unknown action: ${action}`,
    usage: [
      'node tools/kimi-k2-6-supervisor-breakdown.js status',
      'node tools/kimi-k2-6-supervisor-breakdown.js breakdown --execute'
    ]
  }, null, 2));
  process.exitCode = 2;
}

main(process.argv);
