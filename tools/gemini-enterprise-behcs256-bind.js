#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const repoRoot = path.resolve(__dirname, '..');

const EVENT_ID = 'gemini-enterprise-seat-binding-20260423';
const MEMORY_ID = 'project_gemini_enterprise_seats_assigned_20260423';

const MODE = {
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
};

const VERIFIED_STATE = {
  assertion: 'Gemini Enterprise Plus seats are assigned for Asolaria, Liris, and Falcon.',
  verifiedDate: '2026-04-23',
  distributionProject: '742368506950',
  distributionRegion: 'global',
  subscriptionId: 'da54d5bb-be05-4c30-b71b-74feffb5c1eb',
  subscriptionPeriod: 'yearly',
  startDate: '2026-04-23',
  renewalDate: '2027-04-23',
  productTier: 'Gemini Enterprise Plus',
  discoverySubscriptionTier: 'SUBSCRIPTION_TIER_SEARCH_AND_ASSISTANT',
  licenseCount: 3,
  usedLicenseCount: 3,
  state: 'ACTIVE',
  geminiBundle: true,
  userStore: 'projects/742368506950/locations/global/userStores/default_user_store',
  licenseConfig: 'projects/742368506950/locations/global/licenseConfigs/bda82b1a-e0ae-4329-bca2-8a0632685fc7',
  licenseConfigId: 'bda82b1a-e0ae-4329-bca2-8a0632685fc7',
  targets: [
    {
      lane: 'asolaria',
      principal: 'asolaria@jbrowndevelopmentllc.com',
      assignmentState: 'ASSIGNED',
      seat: 'gemini_enterprise_plus'
    },
    {
      lane: 'liris',
      principal: 'liris@jbrowndevelopmentllc.com',
      assignmentState: 'ASSIGNED',
      seat: 'gemini_enterprise_plus'
    },
    {
      lane: 'falcon',
      principal: 'falcon@jbrowndevelopmentllc.com',
      assignmentState: 'ASSIGNED',
      seat: 'gemini_enterprise_plus'
    }
  ],
  residuals: [
    {
      id: 'workspace_identity_not_confirmed',
      state: 'OPEN',
      detail: 'License seats are assigned, but Google Workspace mailbox/user creation is a separate identity operation.'
    },
    {
      id: 'project_iam_binding_rejected_user_does_not_exist',
      state: 'OPEN',
      detail: 'Project IAM user binding was rejected because the Google user identity was not found at bind time.'
    }
  ]
};

const CHAIN = [
  'hookwall',
  'omni_gnn',
  'omnishannon',
  'shannon',
  'hermes',
  'omniwhite-room',
  'gc'
];

const ROLES = {
  chief_helm: 'seal verified truth and keep no-fake-green boundary',
  gaia_dasein_brain: 'memory and index projection',
  sentinel_kr: 'residual identity and IAM blocker tracking',
  falcon_selector: 'glyph and tuple transport',
  shannon_hermes: 'headless CLI delivery without server auth or API route',
  omnispindle_flywheels: 'map/cube fanout'
};

const OUTPUTS = {
  index: rel('data/behcs/index/gemini-enterprise-seat-bindings.v1.json'),
  map: rel('data/behcs/maps/gemini-enterprise-seat-map.v1.json'),
  glyph: rel('data/behcs/codex/glyph-language/gemini-enterprise-seat-wave.v1.json'),
  cube: rel('data/behcs/cubes/gemini-enterprise-seat-cube.cube.js'),
  brownHilbert: rel('brown-hilbert/13-2026-04-23-gemini-enterprise-seat-binding.md'),
  reportJson: rel('reports/gemini-enterprise-behcs256-seat-binding-latest.json'),
  reportMd: rel('reports/gemini-enterprise-behcs256-seat-binding-latest.md'),
  memoryIndex: rel('data/behcs/memory-cube-index.json'),
  inbox: rel('data/behcs/inbox.ndjson'),
  outbox: rel('data/behcs/outbox.ndjson'),
  gnnEdges: rel('data/behcs/gnn-live-edges.ndjson')
};

function rel(p) {
  return path.join(repoRoot, p);
}

function relative(p) {
  return path.relative(repoRoot, p).replace(/\\/g, '/');
}

function sha256(input) {
  return crypto.createHash('sha256').update(String(input)).digest('hex');
}

function hash8(input) {
  return sha256(input).slice(0, 8);
}

function hash16(input) {
  return sha256(input).slice(0, 16);
}

function hilbert(seed) {
  const h = sha256(seed);
  return `BH256-${h.slice(0, 4)}-${h.slice(4, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}`;
}

function glyph(seed, label) {
  return `HG256:GEMINI:${label}:${hash8(seed).toUpperCase()}`;
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

function appendNdjsonOnce(filePath, event) {
  ensureDir(filePath);
  const needle = `"id":"${event.id}"`;
  const altNeedle = `"eventId":"${event.id}"`;
  const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
  if (existing.includes(needle) || existing.includes(altNeedle)) {
    return false;
  }
  const prefix = existing.endsWith('\n') || existing.length === 0 ? '' : '\n';
  fs.appendFileSync(filePath, `${prefix}${JSON.stringify(event)}\n`, 'utf8');
  return true;
}

function buildSurfaces(generatedAt) {
  const targetNodes = VERIFIED_STATE.targets.map((target, index) => ({
    id: `principal:${target.lane}`,
    type: 'principal',
    lane: target.lane,
    principal: target.principal,
    licenseAssignmentState: target.assignmentState,
    hilbert: hilbert(`${EVENT_ID}:${target.principal}`),
    glyph: glyph(`${EVENT_ID}:${target.principal}`, target.lane.toUpperCase())
  }));

  const base = {
    eventId: EVENT_ID,
    memoryId: MEMORY_ID,
    generatedAt,
    mode: MODE,
    chain: CHAIN,
    roles: ROLES,
    licenseTruth: VERIFIED_STATE
  };

  const index = {
    indexId: 'gemini-enterprise-seat-bindings.v1',
    status: 'sealed_local_memory_index',
    ...base,
    brownHilbertRoom: relative(OUTPUTS.brownHilbert),
    surfaces: [
      relative(OUTPUTS.index),
      relative(OUTPUTS.map),
      relative(OUTPUTS.glyph),
      relative(OUTPUTS.cube),
      relative(OUTPUTS.brownHilbert),
      relative(OUTPUTS.reportJson),
      relative(OUTPUTS.reportMd)
    ],
    packet: {
      tuple: [
        'asolaria',
        'gemini_enterprise_plus',
        'seat_binding',
        '3',
        'active',
        'local_cli_only',
        'assigned',
        'no_google_api_call'
      ],
      glyph: glyph(EVENT_ID, 'SEAT_BIND'),
      hilbert: hilbert(EVENT_ID),
      shannonRoute: 'hookwall -> omni_gnn -> omnishannon -> shannon -> hermes -> omniwhite-room -> gc'
    }
  };

  const map = {
    mapId: 'gemini-enterprise-seat-map.v1',
    generatedAt,
    status: 'local_truth_map',
    dialect: 'BEHCS_HG256',
    mode: MODE,
    chain: CHAIN,
    nodes: [
      {
        id: 'subscription:gemini-enterprise-plus',
        type: 'subscription',
        subscriptionId: VERIFIED_STATE.subscriptionId,
        tier: VERIFIED_STATE.productTier,
        state: VERIFIED_STATE.state,
        hilbert: hilbert(`${EVENT_ID}:subscription`),
        glyph: glyph(`${EVENT_ID}:subscription`, 'SUBSCRIPTION')
      },
      {
        id: 'project:distribution',
        type: 'gcp_project',
        projectNumber: VERIFIED_STATE.distributionProject,
        location: VERIFIED_STATE.distributionRegion,
        hilbert: hilbert(`${EVENT_ID}:project`),
        glyph: glyph(`${EVENT_ID}:project`, 'PROJECT')
      },
      {
        id: 'userStore:default',
        type: 'discovery_engine_user_store',
        name: VERIFIED_STATE.userStore,
        hilbert: hilbert(`${EVENT_ID}:userStore`),
        glyph: glyph(`${EVENT_ID}:userStore`, 'USERSTORE')
      },
      {
        id: 'licenseConfig:default',
        type: 'license_config',
        name: VERIFIED_STATE.licenseConfig,
        licenseCount: VERIFIED_STATE.licenseCount,
        usedLicenseCount: VERIFIED_STATE.usedLicenseCount,
        hilbert: hilbert(`${EVENT_ID}:licenseConfig`),
        glyph: glyph(`${EVENT_ID}:licenseConfig`, 'LICENSE')
      },
      ...targetNodes,
      {
        id: 'residual:workspace_identity',
        type: 'residual',
        state: 'OPEN',
        detail: 'Mailbox / Google identity existence is not proven by license assignment.',
        hilbert: hilbert(`${EVENT_ID}:residual:workspace_identity`),
        glyph: glyph(`${EVENT_ID}:residual:workspace_identity`, 'RESIDUAL')
      },
      {
        id: 'surface:brown-hilbert-room-13',
        type: 'brown_hilbert_room',
        path: relative(OUTPUTS.brownHilbert),
        hilbert: hilbert(`${EVENT_ID}:brown-hilbert`),
        glyph: glyph(`${EVENT_ID}:brown-hilbert`, 'ROOM13')
      }
    ],
    edges: [
      {
        from: 'subscription:gemini-enterprise-plus',
        to: 'project:distribution',
        verb: 'distributed_to',
        weight: 1
      },
      {
        from: 'project:distribution',
        to: 'userStore:default',
        verb: 'hosts',
        weight: 1
      },
      {
        from: 'userStore:default',
        to: 'licenseConfig:default',
        verb: 'default_license_config',
        weight: 1
      },
      ...targetNodes.map((target) => ({
        from: 'licenseConfig:default',
        to: target.id,
        verb: 'assigned_seat',
        weight: 1
      })),
      {
        from: 'licenseConfig:default',
        to: 'residual:workspace_identity',
        verb: 'does_not_close_identity_residual',
        weight: 1
      },
      {
        from: 'subscription:gemini-enterprise-plus',
        to: 'surface:brown-hilbert-room-13',
        verb: 'sealed_in',
        weight: 1
      }
    ]
  };

  const glyphEntries = [
    entry(1, 'SUBSCRIPTION_STATE', VERIFIED_STATE.state, 'truth', 'license_state_active'),
    entry(2, 'LICENSE_COUNT', String(VERIFIED_STATE.licenseCount), 'truth', 'three_seats_purchased'),
    entry(3, 'USER_STORE', VERIFIED_STATE.userStore, 'route', 'default_user_store'),
    ...VERIFIED_STATE.targets.map((target, idx) =>
      entry(4 + idx, `PRINCIPAL_${target.lane.toUpperCase()}`, `${target.principal}:${target.assignmentState}`, 'seat', `${target.lane}_assigned`)
    ),
    entry(7, 'BACKEND_MODE', 'local_filesystem_free_backend:no_api:no_auth:headless:shellless', 'mode', 'cli_only_binding'),
    entry(8, 'RESIDUAL', 'workspace_identity_open:project_iam_user_missing', 'sentinel', 'identity_residual')
  ];

  const glyphTable = {
    tableId: 'gemini-enterprise-seat-wave.v1',
    spec: 'BEHCS_HG256',
    plan: 'gemini-enterprise-seat-binding',
    version: 1,
    status: 'local_cli_bound',
    generatedAt,
    alphabet: {
      spec: 'hg256-base256-canon.v1-ascii-safe-transport',
      base: 256,
      canonicalWidth: 32
    },
    derivation: {
      ruleId: 'sha256-hg256-ascii-safe-v1',
      input: EVENT_ID,
      template: 'HG256:GEMINI:{dimension}:{hash8}',
      hash: sha256(EVENT_ID),
      addressWidth: 32
    },
    promotion: {
      bootstrapTranche: 1,
      promotionGate: 'local_index_only_no_cloud_promotion'
    },
    entries: glyphEntries
  };

  const cube = `// cube: gemini-enterprise-seat-cube | ${EVENT_ID} | D35 MEMORY | D37 AUTHORITY | D47 BOUNDARY
// gates: hookwall, sentinel_kr | waves: local_cli, map, index, glyph | kind: enterprise-seat-binding
export const CUBE = ${JSON.stringify({
    id: 'gemini-enterprise-seat-cube',
    eventId: EVENT_ID,
    primaryCatalog: { D: 35, name: 'MEMORY', prime: 149 },
    touches: [11, 35, 37, 39, 42, 46, 47],
    gates: ['hookwall', 'sentinel_kr'],
    waves: ['local_cli', 'map', 'index', 'glyph', 'brown_hilbert'],
    connectors: {
      'gemini-enterprise-users-cli': 'source-verification-cli',
      'deep-wave-hg256-agent-guide': 'chain-law',
      'hyperglyph-map': 'glyph-dialect'
    },
    payload: {
      kind: 'enterprise-seat-binding',
      source: 'tools/gemini-enterprise-users-cli.js status verification',
      description: VERIFIED_STATE.assertion,
      mode: MODE,
      licenseTruth: VERIFIED_STATE,
      chain: CHAIN,
      roles: ROLES
    },
    translate: {
      human: 'Gemini Enterprise Plus: three assigned seats for Asolaria, Liris, and Falcon; local BEHCS surfaces bound.',
      agent: '(asolaria, gemini_enterprise_plus, seat_binding, 3, active, local_cli_only, assigned, [map,index,cube,glyph,brown_hilbert], no_api, no_auth, no_secret_material)',
      device: 'node tools/gemini-enterprise-behcs256-bind.js status'
    }
  }, null, 2)}
`;

  const brownHilbert = `<!-- provenance: file=brown-hilbert/13-2026-04-23-gemini-enterprise-seat-binding.md author=codex dispatch=${generatedAt} brief_id=GEMINI-ENTERPRISE-BEHCS256-SEAT-BINDING-2026-04-23 -->
# Gemini Enterprise Seat Binding - 2026-04-23

- Event: ${EVENT_ID}
- Mode: bare Node CLI, local filesystem backend, headless, shellless runtime, no server auth, no server API route, no Google API call.
- Distribution project: ${VERIFIED_STATE.distributionProject}
- User store: \`${VERIFIED_STATE.userStore}\`
- License config: \`${VERIFIED_STATE.licenseConfig}\`
- Subscription: ${VERIFIED_STATE.productTier}, ${VERIFIED_STATE.state}, ${VERIFIED_STATE.licenseCount} seats, ${VERIFIED_STATE.startDate} -> ${VERIFIED_STATE.renewalDate}
- Seat truth:
${VERIFIED_STATE.targets.map((target) => `  - ${target.lane}: \`${target.principal}\` -> ${target.assignmentState}`).join('\n')}
- BEHCS chain: ${CHAIN.join(' -> ')}
- Memory index: \`${relative(OUTPUTS.index)}\`
- Map: \`${relative(OUTPUTS.map)}\`
- Glyph table: \`${relative(OUTPUTS.glyph)}\`
- Cube: \`${relative(OUTPUTS.cube)}\`

## Sentinel Residual

License assignment is sealed. Workspace mailbox creation and Cloud IAM user binding are separate identity operations. The project IAM binding attempt rejected the user identity as missing, so do not claim Workspace/IAM identity closure from this room alone.
`;

  const report = {
    reportId: 'gemini-enterprise-behcs256-seat-binding-latest',
    generatedAt,
    eventId: EVENT_ID,
    status: 'local_surfaces_bound',
    mode: MODE,
    outputs: Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, relative(value)])),
    indexSummary: {
      licenseState: VERIFIED_STATE.state,
      licenseCount: VERIFIED_STATE.licenseCount,
      usedLicenseCount: VERIFIED_STATE.usedLicenseCount,
      assignedPrincipals: VERIFIED_STATE.targets.map((target) => target.principal),
      residualsOpen: VERIFIED_STATE.residuals.map((residual) => residual.id)
    },
    chain: CHAIN,
    roles: ROLES
  };

  const reportMd = `# Gemini Enterprise BEHCS-256 Seat Binding

Generated: ${generatedAt}

Status: local surfaces bound. This binder used no Google API calls, no server auth, no server API route, no browser, no shell spawn, and no secret material.

## Seat Truth

| Lane | Principal | State |
| --- | --- | --- |
${VERIFIED_STATE.targets.map((target) => `| ${target.lane} | ${target.principal} | ${target.assignmentState} |`).join('\n')}

## Surfaces

| Surface | Path |
| --- | --- |
| Index | \`${relative(OUTPUTS.index)}\` |
| Map | \`${relative(OUTPUTS.map)}\` |
| Glyph | \`${relative(OUTPUTS.glyph)}\` |
| Cube | \`${relative(OUTPUTS.cube)}\` |
| Brown-Hilbert | \`${relative(OUTPUTS.brownHilbert)}\` |
| Memory cube index | \`${relative(OUTPUTS.memoryIndex)}\` |

## Residual

Workspace mailbox creation and Cloud IAM user binding remain separate from seat assignment. Current residual: \`${VERIFIED_STATE.residuals.map((r) => r.id).join('`, `')}\`.
`;

  return { index, map, glyphTable, cube, brownHilbert, report, reportMd };
}

function entry(index, dimension, value, role, reason) {
  const normalizedValue = value.toLowerCase().replace(/[^a-z0-9:_@./-]+/g, '_');
  const tupleKey = `${dimension}:${normalizedValue}`;
  const glyphValue = glyph(`${EVENT_ID}:${tupleKey}`, dimension);
  return {
    entryId: `gemini-seat-${String(index).padStart(2, '0')}`,
    index,
    dimensionId: index,
    catalogDimensionName: dimension,
    planAnchorName: 'gemini-enterprise-seat-binding',
    value,
    normalizedValue,
    tupleKey,
    glyph: glyphValue,
    glyphWidth: glyphValue.length,
    role,
    reason,
    status: 'bound',
    derivation: {
      hash: sha256(`${EVENT_ID}:${tupleKey}`),
      hilbert: hilbert(`${EVENT_ID}:${tupleKey}`),
      source: 'local_verified_state'
    },
    conflict: null
  };
}

function updateMemoryIndex(generatedAt) {
  const filePath = OUTPUTS.memoryIndex;
  const current = fs.existsSync(filePath)
    ? JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''))
    : { ts: generatedAt, count: 0, memories: {} };

  current.ts = generatedAt;
  current.memories = current.memories || {};
  current.memories[MEMORY_ID] = {
    file: relative(OUTPUTS.index),
    hilbert: hilbert(MEMORY_ID),
    name: 'Gemini Enterprise Plus seats assigned for Asolaria, Liris, and Falcon',
    type: 'enterprise-seat-binding',
    description: 'Local BEHCS-256 binding of the verified Gemini Enterprise Plus license state: three assigned seats, CLI-only replay path, and open Workspace/IAM identity residuals.',
    size: fs.existsSync(OUTPUTS.index) ? fs.statSync(OUTPUTS.index).size : 0,
    lines: fs.existsSync(OUTPUTS.index) ? fs.readFileSync(OUTPUTS.index, 'utf8').split(/\r?\n/).length : 0
  };
  current.count = Object.keys(current.memories).length;
  writeJson(filePath, current);
}

function buildBusEvents(generatedAt) {
  const body = {
    eventId: EVENT_ID,
    memoryId: MEMORY_ID,
    status: 'assigned',
    licenseCount: VERIFIED_STATE.licenseCount,
    targets: VERIFIED_STATE.targets,
    residuals: VERIFIED_STATE.residuals,
    surfaces: {
      index: relative(OUTPUTS.index),
      map: relative(OUTPUTS.map),
      glyph: relative(OUTPUTS.glyph),
      cube: relative(OUTPUTS.cube),
      brownHilbert: relative(OUTPUTS.brownHilbert)
    },
    mode: MODE
  };

  const inbox = {
    id: EVENT_ID,
    from: 'codex',
    to: 'asolaria',
    mode: 'real',
    actor: 'gemini-enterprise-behcs256-bind',
    target: 'memory-index-map-cube-glyph',
    ts: generatedAt,
    verb: 'EVT-GEMINI-ENTERPRISE-SEATS-BOUND',
    payload: 'Gemini Enterprise Plus seats assigned and bound into local BEHCS surfaces.',
    body
  };

  const outbox = {
    id: `${EVENT_ID}-out`,
    ts: generatedAt,
    from: 'asolaria',
    to: 'federation',
    mode: 'real',
    type: 'message',
    payload: 'BEHCS256 local seat binding complete: Asolaria, Liris, Falcon assigned.',
    cube: {
      D1_ACTOR: 'asolaria',
      D3_TARGET: 'federation',
      D7_STATE: 'assigned',
      D20_TIME: generatedAt,
      D35_MEMORY: MEMORY_ID,
      D37_AUTHORITY: 'local_cli_no_api',
      D38_ENCRYPTION: 'no_secret_material',
      D47_BOUNDARY: 'workspace_identity_residual_open'
    },
    hash: hash16(EVENT_ID)
  };

  const gnnEdge = {
    id: `${EVENT_ID}-edge`,
    from: 'gemini_enterprise_license_config',
    to: 'asolaria_liris_falcon',
    verb: 'assigned_seats_bound_locally',
    weight: 3,
    ts: generatedAt,
    wh: {
      who: { from: 'codex', agent: 'gemini-enterprise-behcs256-bind' },
      what: 'three Gemini Enterprise Plus seats bound into BEHCS map/index/cube/glyph surfaces',
      where: {
        repo: 'C:/Users/acer/Asolaria',
        transport: 'local_filesystem',
        receivedBy: 'asolaria'
      },
      when: generatedAt,
      how: 'bare_node_cli_no_api_no_auth_no_shell_spawn',
      why: 'operator requested durable BEHCS memory/index/map/cube/glyph binding'
    }
  };

  return { inbox, outbox, gnnEdge };
}

function writeAll() {
  const generatedAt = new Date().toISOString();
  const surfaces = buildSurfaces(generatedAt);

  writeJson(OUTPUTS.index, surfaces.index);
  writeJson(OUTPUTS.map, surfaces.map);
  writeJson(OUTPUTS.glyph, surfaces.glyphTable);
  writeText(OUTPUTS.cube, surfaces.cube);
  writeText(OUTPUTS.brownHilbert, surfaces.brownHilbert);
  writeJson(OUTPUTS.reportJson, surfaces.report);
  writeText(OUTPUTS.reportMd, surfaces.reportMd);
  updateMemoryIndex(generatedAt);

  const events = buildBusEvents(generatedAt);
  const appends = {
    inbox: appendNdjsonOnce(OUTPUTS.inbox, events.inbox),
    outbox: appendNdjsonOnce(OUTPUTS.outbox, events.outbox),
    gnnEdges: appendNdjsonOnce(OUTPUTS.gnnEdges, events.gnnEdge)
  };

  return {
    ok: true,
    action: 'write',
    generatedAt,
    eventId: EVENT_ID,
    outputs: Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, relative(value)])),
    appends,
    mode: MODE,
    residuals: VERIFIED_STATE.residuals
  };
}

function status() {
  return {
    ok: true,
    action: 'status',
    eventId: EVENT_ID,
    mode: MODE,
    verifiedState: VERIFIED_STATE,
    outputs: Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, {
      path: relative(value),
      exists: fs.existsSync(value)
    }]))
  };
}

function main(argv) {
  const action = argv[2] || 'status';
  const execute = argv.includes('--execute');

  if (action === 'status') {
    console.log(JSON.stringify(status(), null, 2));
    return;
  }

  if (action === 'write') {
    if (!execute) {
      console.log(JSON.stringify({
        ok: true,
        action: 'write',
        dryRun: true,
        message: 'Pass --execute to write local BEHCS surfaces.',
        outputs: Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, relative(value)])),
        mode: MODE
      }, null, 2));
      return;
    }
    console.log(JSON.stringify(writeAll(), null, 2));
    return;
  }

  console.error(JSON.stringify({
    ok: false,
    error: `Unknown action: ${action}`,
    usage: [
      'node tools/gemini-enterprise-behcs256-bind.js status',
      'node tools/gemini-enterprise-behcs256-bind.js write --execute'
    ]
  }, null, 2));
  process.exitCode = 2;
}

main(process.argv);
