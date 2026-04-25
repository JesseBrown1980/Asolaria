#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const behcs = require('./behcs/codex-bridge');

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
  noRemoteLinearMutation: true,
  noAgentLaunch: true,
  noDownloads: true,
  noInstall: true,
  noDeviceAccess: true,
  localSymphonyLinearPacketsOnly: true,
  childProcessUse: false,
  secretMaterialWritten: false
});

const PATHS = Object.freeze({
  gems: rel('data/neurotech-defense-lab/omnispindle/collections/genius-gems-latest.ndjson'),
  mistakes: rel('data/neurotech-defense-lab/omnispindle/collections/mistake-ledger-latest.ndjson'),
  hookwall: rel('data/neurotech-defense-lab/omnispindle/collections/hookwall-events-latest.ndjson'),
  omnishannon: rel('data/neurotech-defense-lab/omnispindle/collections/omnishannon-consensus-latest.json'),
  symphonyLinearState: rel('data/behcs/state/connectors/symphony_linear.state.json'),
  supervisors: rel('data/neurotech-defense-lab/omnispindle/supervisors/genius-candidate-supervisors.v1.json'),
  supervisorsCsv: rel('data/neurotech-defense-lab/omnispindle/supervisors/genius-candidate-supervisors-latest.csv'),
  migrationQueue: rel('data/neurotech-defense-lab/omnispindle/supervisors/symphony-linear-local-migration-queue.ndjson'),
  state: rel('data/behcs/state/neurotech-defense/neurotech-genius-candidate-supervisors.state.json'),
  hermes: rel('data/behcs/hermes/neurotech-defense/neurotech-genius-candidate-supervisors-dispatch-latest.json'),
  shannon: rel('data/behcs/shannon/neurotech-defense/neurotech-genius-candidate-supervisors-consensus-latest.json'),
  cube: rel('data/behcs/cubes/neurotech-genius-candidate-supervisors.cube.js'),
  reportJson: rel('reports/neurotech-genius-candidate-supervisors-latest.json'),
  reportMd: rel('reports/neurotech-genius-candidate-supervisors-latest.md'),
  inbox: rel('data/behcs/inbox.ndjson'),
  outbox: rel('data/behcs/outbox.ndjson'),
  gnnEdges: rel('data/behcs/gnn-live-edges.ndjson')
});

const CSV_FIELDS = [
  'supervisorId',
  'supervisorPid',
  'candidateId',
  'candidateGlyph',
  'supervisorGlyph',
  'priority',
  'score',
  'sourceSupport',
  'pidScope',
  'subjectMatter',
  'dimensions',
  'hookwallStatus',
  'omnishannonStatus',
  'migrationPacketId',
  'relatedMistakes',
  'status',
  'summary'
];

function rel(p) {
  return path.join(repoRoot, p);
}

function repoRel(p) {
  return path.relative(repoRoot, p).replace(/\\/g, '/');
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_) {
    return fallback;
  }
}

function readNdjson(filePath) {
  try {
    const text = fs.readFileSync(filePath, 'utf8').trim();
    if (!text) return [];
    return text.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
  } catch (_) {
    return [];
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

function sha256Text(input) {
  return crypto.createHash('sha256').update(String(input)).digest('hex');
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function sorted(values) {
  return unique(values).sort((a, b) => String(a).localeCompare(String(b)));
}

function csvEscape(value) {
  const text = value == null ? '' : String(Array.isArray(value) ? value.join('|') : value);
  if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function toCsv(rows, fields) {
  return [
    fields.join(','),
    ...rows.map((row) => fields.map((field) => csvEscape(row[field])).join(','))
  ].join('\n') + '\n';
}

function toNdjson(rows) {
  return rows.map((row) => JSON.stringify(row)).join('\n') + (rows.length ? '\n' : '');
}

function supervisorPid(index) {
  return `BH.CANDIDATE.SUP.PID.${String(index + 1).padStart(11, '0')}`;
}

function supervisorGlyph(candidate, pid) {
  const hash = sha256Text(`${pid}:${candidate.id}:${candidate.glyph}:${candidate.summary}`);
  return `HG256:CANDIDATE_SUP:${hash.slice(0, 8).toUpperCase()}:${behcs.hilbertAddress(hash)}`;
}

function intersectionCount(a, b) {
  const right = new Set(b || []);
  return (a || []).filter((item) => right.has(item)).length;
}

function relatedMistakesFor(candidate, mistakes) {
  return mistakes
    .map((mistake) => {
      const subjectHits = intersectionCount(candidate.subjectMatter || [], mistake.subjectMatter || []);
      const laneHits = intersectionCount(candidate.lanes || [], mistake.lanes || []);
      return {
        id: mistake.id,
        glyph: mistake.glyph,
        reverseGain: Number(mistake.reverseGain || 0),
        relationScore: subjectHits * 2 + laneHits,
        hookwallStatus: mistake.hookwallStatus,
        gcDisposition: mistake.gcDisposition
      };
    })
    .filter((entry) => entry.relationScore > 0)
    .sort((a, b) => b.relationScore - a.relationScore || b.reverseGain - a.reverseGain)
    .slice(0, 5);
}

function priorityFor(candidate) {
  if (candidate.gcDisposition === 'farm_gem_preserve_sources') return 'farm_now';
  if (Number(candidate.score || 0) >= 0.84) return 'watch_high';
  return 'watch';
}

function buildMigrationPacket(candidate, supervisor, symphonyLinearState, generatedAt) {
  const localWorkItemId = `SL-GENIUS-${String(supervisor.index + 1).padStart(3, '0')}-${candidate.id}`;
  return {
    localWorkItemId,
    generatedAt,
    tracker: 'symphony_linear_local_service',
    remoteMutation: false,
    connectorStatus: symphonyLinearState?.status || 'unknown',
    projectSlug: symphonyLinearState?.summary?.linearProjectSlug || null,
    workspaceRoot: symphonyLinearState?.summary?.workspaceRoot || null,
    supervisorId: supervisor.supervisorId,
    supervisorPid: supervisor.supervisorPid,
    candidateId: candidate.id,
    candidateGlyph: candidate.glyph,
    supervisorGlyph: supervisor.supervisorGlyph,
    priority: supervisor.priority,
    title: `Genius supervisor: ${candidate.id}`,
    body: {
      summary: candidate.summary,
      score: candidate.score,
      sourceSupport: candidate.sourceSupport,
      pidScope: candidate.pidScope,
      subjectMatter: candidate.subjectMatter,
      dimensions: candidate.dimensions,
      hookwallStatus: candidate.hookwallStatus,
      omnishannonStatus: candidate.omnishannonStatus,
      relatedMistakes: supervisor.relatedMistakes.map((entry) => entry.id),
      acceptanceGates: [
        'local_packet_ingested',
        'hookwall_events_present',
        'gnn_edge_written',
        'related_mistakes_linked',
        'no_remote_linear_mutation_without_operator_gate'
      ]
    }
  };
}

function buildSupervisors(gems, mistakes, symphonyLinearState, generatedAt) {
  return gems.map((candidate, index) => {
    const pid = supervisorPid(index);
    const relatedMistakes = relatedMistakesFor(candidate, mistakes);
    const sup = {
      index,
      supervisorId: `candidate-supervisor-${String(index + 1).padStart(3, '0')}-${candidate.id}`,
      supervisorPid: pid,
      supervisorGlyph: supervisorGlyph(candidate, pid),
      authority: 'observe_verify_dispatch_only',
      status: 'LOCAL_TRACKING_PLAN',
      priority: priorityFor(candidate),
      candidateId: candidate.id,
      candidateGlyph: candidate.glyph,
      candidateHash: candidate.itemHash,
      score: candidate.score,
      sourceSupport: candidate.sourceSupport,
      pidScope: candidate.pidScope,
      subjectMatter: candidate.subjectMatter || [],
      dimensions: candidate.dimensions || [],
      hookwallStatus: candidate.hookwallStatus,
      omnishannonStatus: candidate.omnishannonStatus,
      gcDisposition: candidate.gcDisposition,
      relatedMistakes,
      watches: {
        gemCollection: repoRel(PATHS.gems),
        mistakeLedger: repoRel(PATHS.mistakes),
        hookwallEvents: repoRel(PATHS.hookwall),
        omnishannon: repoRel(PATHS.omnishannon),
        symphonyLinearState: repoRel(PATHS.symphonyLinearState),
        gnnEdges: repoRel(PATHS.gnnEdges)
      },
      migrationBinding: {
        connectorId: 'symphony_linear',
        connectorStatus: symphonyLinearState?.status || 'unknown',
        projectSlug: symphonyLinearState?.summary?.linearProjectSlug || null,
        workspaceRoot: symphonyLinearState?.summary?.workspaceRoot || null,
        localOnly: true,
        remoteMutation: false
      },
      summary: candidate.summary,
      generatedAt
    };
    sup.migrationPacket = buildMigrationPacket(candidate, sup, symphonyLinearState, generatedAt);
    return sup;
  });
}

function buildFleet(supervisors, symphonyLinearState, generatedAt) {
  const farmNow = supervisors.filter((entry) => entry.priority === 'farm_now').length;
  const watch = supervisors.length - farmNow;
  const mistakeLinks = supervisors.reduce((sum, entry) => sum + entry.relatedMistakes.length, 0);
  return {
    fleetId: 'neurotech-genius-candidate-supervisors.v1',
    generatedAt,
    status: 'CANDIDATE_SUPERVISORS_LOCAL_QUEUE_PLAN',
    mode: MODE,
    rule: 'One supervisor record per candidate mark; local Symphony/Linear packets only; no remote mutation.',
    sourceCollections: {
      gems: repoRel(PATHS.gems),
      mistakes: repoRel(PATHS.mistakes),
      hookwall: repoRel(PATHS.hookwall),
      omnishannon: repoRel(PATHS.omnishannon)
    },
    symphonyLinear: {
      status: symphonyLinearState?.status || 'unknown',
      processRunning: Boolean(symphonyLinearState?.summary?.processRunning),
      projectSlug: symphonyLinearState?.summary?.linearProjectSlug || null,
      workspaceRoot: symphonyLinearState?.summary?.workspaceRoot || null,
      localState: repoRel(PATHS.symphonyLinearState)
    },
    summary: {
      supervisorCount: supervisors.length,
      farmNow,
      watch,
      relatedMistakeLinks: mistakeLinks,
      remoteMutations: 0,
      realAgentLaunches: 0
    },
    supervisors
  };
}

function buildHermes(fleet, generatedAt) {
  return {
    integrationId: 'neurotech-genius-candidate-supervisors-hermes-dispatch',
    generatedAt,
    status: fleet.status,
    mode: MODE,
    packet: {
      verb: 'EVT-HERMES-NEUROTECH-GENIUS-SUPERVISORS',
      summary: 'Glyphed candidate marks mapped into local supervisor records and Symphony/Linear migration packets.',
      counts: fleet.summary,
      route: [
        'GENIUS_SUPERVISOR_FLEET',
        'HOOKWALL_EVENTS',
        'GNN_FORWARD',
        'REVERSE_GAIN_GNN',
        'SYMPHONY_LINEAR_LOCAL_QUEUE'
      ],
      report: repoRel(PATHS.reportMd)
    }
  };
}

function buildShannon(fleet, generatedAt) {
  return {
    integrationId: 'neurotech-genius-candidate-supervisors-shannon-consensus',
    generatedAt,
    status: 'consensus_candidate_supervisors_planned',
    consensus: 'RECORD_LOCAL_SUPERVISORS_AND_MIGRATION_PACKETS_ONLY',
    executionDisposition: 'no_remote_linear_mutation_no_agent_launch_no_device',
    votes: [
      { part: 'scout', vote: 'PROCEED', reason: `${fleet.summary.supervisorCount} candidate marks were present in the glyphed collection.` },
      { part: 'evidence', vote: 'PROCEED', reason: `${fleet.summary.relatedMistakeLinks} related mistake links bind supervisors to reverse-gain GNN evidence.` },
      { part: 'executor', vote: 'HALT_REMOTE_MUTATION', reason: 'This tranche writes local Symphony/Linear packets only.' },
      { part: 'fabric', vote: 'PROCEED', reason: 'Supervisor records, migration queue, Hermes, Shannon, report, and cube are local BEHCS surfaces.' },
      { part: 'voice', vote: 'PROCEED_WITH_CLAIM_GUARD', reason: 'Supervisors preserve claim guard and live-data gates from the gem/mistake ledgers.' },
      { part: 'planner', vote: 'PROCEED_LOCAL_MIGRATION_START', reason: 'Next tranche can wire the local queue into the running Symphony service if operator approves.' }
    ]
  };
}

function buildCube(fleet, shannonPacket, generatedAt) {
  const cube = {
    id: 'neurotech-genius-candidate-supervisors',
    generatedAt,
    primaryCatalog: { D: 37, name: 'AUTHORITY', prime: 157 },
    touches: [7, 20, 35, 37, 39, 42, 47, 59],
    gates: ['hookwall', 'gnn_forward', 'reverse_gain_gnn', 'symphony_linear_local_queue', 'no_remote_mutation'],
    payload: {
      kind: 'candidate-supervisor-fleet',
      status: fleet.status,
      mode: MODE,
      summary: fleet.summary,
      shannon: {
        consensus: shannonPacket.consensus,
        executionDisposition: shannonPacket.executionDisposition
      }
    },
    translate: {
      human: 'Each candidate mark now has a local supervisor record and a Symphony/Linear migration packet.',
      agent: '(asolaria, neurotech, candidate_supervisors, hookwall, gnn, symphony_linear, local_queue)',
      device: 'node tools/neurotech-genius-candidate-supervisors.js create --execute'
    }
  };
  return `// cube: neurotech-genius-candidate-supervisors | neurotech | D37 AUTHORITY\nexport const CUBE = ${JSON.stringify(cube, null, 2)}\n`;
}

function buildReport(fleet, shannonPacket, generatedAt) {
  const rows = fleet.supervisors.map((entry) =>
    `| ${entry.candidateId} | ${entry.priority} | ${entry.score} | ${entry.relatedMistakes.map((m) => m.id).join(' ')} | ${entry.supervisorPid} |`
  ).join('\n');

  const json = {
    reportId: 'neurotech-genius-candidate-supervisors-latest',
    generatedAt,
    status: fleet.status,
    mode: MODE,
    summary: fleet.summary,
    outputs: {
      supervisors: repoRel(PATHS.supervisors),
      supervisorsCsv: repoRel(PATHS.supervisorsCsv),
      migrationQueue: repoRel(PATHS.migrationQueue),
      hermes: repoRel(PATHS.hermes),
      shannon: repoRel(PATHS.shannon),
      cube: repoRel(PATHS.cube)
    },
    shannon: shannonPacket
  };

  const md = `# Neurotech Genius Candidate Supervisors

Generated: ${generatedAt}

Status: ${fleet.status}

Mapped one local supervisor record per glyphed candidate mark and wrote local Symphony/Linear migration packets. This did not call Linear, mutate a remote project, launch agents, start devices, download packages, or execute models.

## Summary

- Supervisors: ${fleet.summary.supervisorCount}
- Farm-now supervisors: ${fleet.summary.farmNow}
- Watch supervisors: ${fleet.summary.watch}
- Related mistake links: ${fleet.summary.relatedMistakeLinks}
- Remote mutations: ${fleet.summary.remoteMutations}
- Real agent launches: ${fleet.summary.realAgentLaunches}
- Symphony/Linear local status: ${fleet.symphonyLinear.status}

## Outputs

- Supervisors: \`${repoRel(PATHS.supervisors)}\`
- Supervisor CSV: \`${repoRel(PATHS.supervisorsCsv)}\`
- Local migration queue: \`${repoRel(PATHS.migrationQueue)}\`
- Hermes: \`${repoRel(PATHS.hermes)}\`
- Shannon: \`${repoRel(PATHS.shannon)}\`
- Cube: \`${repoRel(PATHS.cube)}\`

## Supervisors

| Candidate | Priority | Score | Linked Mistakes | Supervisor PID |
| --- | --- | ---: | --- | --- |
${rows}

## Shannon

- Consensus: ${shannonPacket.consensus}
- Execution: ${shannonPacket.executionDisposition}
`;

  return { json, md };
}

function create({ execute = false } = {}) {
  const generatedAt = new Date().toISOString();
  const gems = readNdjson(PATHS.gems);
  const mistakes = readNdjson(PATHS.mistakes);
  const symphonyLinearState = readJson(PATHS.symphonyLinearState, {});
  const supervisors = buildSupervisors(gems, mistakes, symphonyLinearState, generatedAt);
  const fleet = buildFleet(supervisors, symphonyLinearState, generatedAt);
  const shannonPacket = buildShannon(fleet, generatedAt);
  const hermesPacket = buildHermes(fleet, generatedAt);
  const cube = buildCube(fleet, shannonPacket, generatedAt);
  const report = buildReport(fleet, shannonPacket, generatedAt);
  const eventId = `neurotech-genius-supervisors-${Date.now()}`;

  if (execute) {
    writeJson(PATHS.supervisors, fleet);
    writeText(PATHS.supervisorsCsv, toCsv(supervisors, CSV_FIELDS));
    writeText(PATHS.migrationQueue, toNdjson(supervisors.map((entry) => entry.migrationPacket)));
    writeJson(PATHS.state, {
      savedAt: generatedAt,
      status: fleet.status,
      mode: MODE,
      summary: fleet.summary,
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
      to: 'neurotech-genius-supervisors',
      verb: 'EVT-NEUROTECH-GENIUS-SUPERVISORS',
      body: { status: fleet.status, summary: fleet.summary, report: repoRel(PATHS.reportMd) }
    });
    appendNdjson(PATHS.outbox, {
      id: `${eventId}-hermes`,
      ts: generatedAt,
      from: 'hermes',
      to: 'neurotech-genius-supervisors',
      verb: hermesPacket.packet.verb,
      body: hermesPacket
    });
    for (const supervisor of supervisors) {
      appendNdjson(PATHS.gnnEdges, {
        id: `${eventId}-${supervisor.candidateId}`,
        ts: generatedAt,
        from: 'genius_gem_farm',
        to: supervisor.supervisorId,
        verb: 'supervisor_created_for_gem',
        weight: supervisor.priority === 'farm_now' ? 0.86 : 0.63,
        glyph: supervisor.supervisorGlyph
      });
    }
  }

  return {
    ok: true,
    action: execute ? 'create' : 'preview',
    generatedAt,
    status: fleet.status,
    summary: fleet.summary,
    topSupervisors: supervisors.slice(0, 5).map((entry) => ({
      candidateId: entry.candidateId,
      priority: entry.priority,
      supervisorPid: entry.supervisorPid,
      relatedMistakes: entry.relatedMistakes.map((m) => m.id)
    })),
    outputs: {
      supervisors: repoRel(PATHS.supervisors),
      supervisorsCsv: repoRel(PATHS.supervisorsCsv),
      migrationQueue: repoRel(PATHS.migrationQueue),
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
    console.log(JSON.stringify(create({ execute: false }), null, 2));
    return;
  }
  if (action === 'create') {
    console.log(JSON.stringify(create({ execute }), null, 2));
    return;
  }
  console.error(JSON.stringify({
    ok: false,
    error: `Unknown action: ${action}`,
    usage: [
      'node tools/neurotech-genius-candidate-supervisors.js status',
      'node tools/neurotech-genius-candidate-supervisors.js create --execute'
    ]
  }, null, 2));
  process.exitCode = 2;
}

main(process.argv);
