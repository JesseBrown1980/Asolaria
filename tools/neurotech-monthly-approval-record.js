#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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
  noDownloads: true,
  noInstall: true,
  noDeviceAccess: true,
  noHumanSubjectData: true,
  householdOnly: true,
  monthlyApprovalRecorded: true,
  childProcessUse: false,
  secretMaterialWritten: false
});

const PATHS = Object.freeze({
  pidMap: rel('data/neurotech-defense-lab/identity/brown-hilbert-household-pid-map.current.v1.json'),
  approvalJson: rel('data/neurotech-defense-lab/consent/monthly-approval-2026-04.v1.json'),
  approvalMd: rel('data/neurotech-defense-lab/consent/monthly-approval-2026-04.v1.md'),
  state: rel('data/behcs/state/neurotech-defense/neurotech-monthly-approval-record.state.json'),
  hermes: rel('data/behcs/hermes/neurotech-defense/neurotech-monthly-approval-record-dispatch-latest.json'),
  shannon: rel('data/behcs/shannon/neurotech-defense/neurotech-monthly-approval-record-consensus-latest.json'),
  cube: rel('data/behcs/cubes/neurotech-monthly-approval-record.cube.js'),
  reportJson: rel('reports/neurotech-monthly-approval-record-latest.json'),
  reportMd: rel('reports/neurotech-monthly-approval-record-latest.md'),
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

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_) {
    return fallback;
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

function sha256Text(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function buildApproval(generatedAt) {
  const pidMap = readJson(PATHS.pidMap, { assignments: [] });
  const participants = (pidMap.assignments || [])
    .filter((p) => ['jesse_brown', 'rayssa_chiqueto', 'felipe', 'dan', 'amy'].includes(p.participantId))
    .map((p) => ({
      participantId: p.participantId,
      displayName: p.displayName,
      canonicalPid: p.canonicalPid,
      glyph: p.glyph,
      approvalBasis: 'operator_reports_monthly_household_approval_for_research_and_development',
      approvalWindow: {
        month: '2026-04',
        recordedAt: generatedAt,
        effectiveFrom: generatedAt,
        expiresAtLocal: '2026-04-30T23:59:59-03:00'
      }
    }));

  const scope = {
    title: 'April 2026 household R&D approval for neural interaction and enhancement work',
    approvedResearch: [
      'synthetic EEG replay and CI',
      'local neuro-interface bus development',
      'non-invasive training-support and enhancement UI planning',
      'signal quality, artifact, and uncertainty gates',
      'PID-bound consent/session manifests',
      'local Symphony/Linear queue ingestion',
      'Hookwall/GNN/reverse-gain/GC collection',
      'RU-view static analysis and quarantine records only'
    ],
    hardGates: [
      'no RU-view executable launch or installer execution',
      'no live EEG or biosignal capture until per-session precheck passes',
      'no device access until hardware is identified and approved',
      'no outsiders without their own permission',
      'no medical diagnosis/treatment claims',
      'no literal private-thought mind-reading claims',
      'no raw human data in Git',
      'no cloud upload without explicit consent scope'
    ]
  };

  return {
    approvalId: 'neurotech-monthly-approval-2026-04.v1',
    generatedAt,
    status: 'MONTHLY_HOUSEHOLD_RND_APPROVAL_RECORDED_WITH_GATES',
    mode: MODE,
    capturedFrom: 'current_chat_operator',
    participants,
    scope,
    approvalHash: sha256Text(JSON.stringify({ generatedAt, participants, scope }))
  };
}

function buildMd(approval) {
  const participantRows = approval.participants.map((p) =>
    `| ${p.displayName} | ${p.canonicalPid} | ${p.glyph} | ${p.approvalWindow.expiresAtLocal} |`
  ).join('\n');
  const approved = approval.scope.approvedResearch.map((item) => `- ${item}`).join('\n');
  const gates = approval.scope.hardGates.map((item) => `- ${item}`).join('\n');
  return `# Neurotech Monthly Approval - April 2026

Generated: ${approval.generatedAt}

Status: ${approval.status}

This records the operator statement that Jesse, Rayssa, Felipe, Amy, and Dan approve this month's research and development work for neural interaction and enhancement. The approval is household-scoped and remains bounded by the gates below.

## Participants

| Participant | PID | Glyph | Approval Expires |
| --- | --- | --- | --- |
${participantRows}

## Approved R&D Scope

${approved}

## Hard Gates

${gates}

Approval hash: \`${approval.approvalHash}\`
`;
}

function buildHermes(approval, generatedAt) {
  return {
    integrationId: 'neurotech-monthly-approval-record-hermes-dispatch',
    generatedAt,
    status: approval.status,
    mode: MODE,
    packet: {
      verb: 'EVT-HERMES-NEUROTECH-MONTHLY-APPROVAL',
      summary: 'April 2026 household R&D approval recorded with hard safety gates.',
      participantCount: approval.participants.length,
      approval: repoRel(PATHS.approvalMd)
    }
  };
}

function buildShannon(approval, generatedAt) {
  return {
    integrationId: 'neurotech-monthly-approval-record-shannon-consensus',
    generatedAt,
    status: 'consensus_monthly_approval_recorded_with_gates',
    consensus: 'PROCEED_SAFE_LOCAL_RND_TESTS_WITH_GATES',
    executionDisposition: 'approval_recorded_no_device_no_ruview_execution',
    votes: [
      { part: 'scout', vote: 'PROCEED', reason: `${approval.participants.length} household participants are mapped to Brown-Hilbert PIDs.` },
      { part: 'evidence', vote: 'PROCEED', reason: 'Monthly R&D approval is recorded as local consent metadata.' },
      { part: 'executor', vote: 'HALT_RISKY_ACTIONS', reason: 'Approval does not override RU-view execution, live EEG precheck, or outsider consent gates.' },
      { part: 'fabric', vote: 'PROCEED', reason: 'Approval surfaces are written into BEHCS/Hermes/Shannon/report/cube.' },
      { part: 'voice', vote: 'CLAIM_GUARD', reason: 'Neural enhancement remains training support; literal mind reading remains blocked.' },
      { part: 'planner', vote: 'PROCEED_SAFE_RUNTIME_TEST', reason: 'Run synthetic/local/static programs and collect genius/mistake marks.' }
    ]
  };
}

function buildCube(approval, shannonPacket, generatedAt) {
  const cube = {
    id: 'neurotech-monthly-approval-record',
    generatedAt,
    primaryCatalog: { D: 37, name: 'AUTHORITY', prime: 157 },
    touches: [7, 24, 35, 37, 39, 42, 47, 59],
    gates: ['household_only', 'monthly_approval', 'live_precheck_required', 'ruview_fail_closed', 'claim_guard'],
    payload: {
      kind: 'monthly-household-rnd-approval',
      status: approval.status,
      participantCount: approval.participants.length,
      approvalHash: approval.approvalHash,
      shannon: {
        consensus: shannonPacket.consensus,
        executionDisposition: shannonPacket.executionDisposition
      }
    },
    translate: {
      human: 'April 2026 household R&D approval is recorded, with live/RU-view/claim gates preserved.',
      agent: '(asolaria, neurotech, household_approval, april_2026, safe_rnd_tests)',
      device: 'node tools/neurotech-monthly-approval-record.js record --execute'
    }
  };
  return `// cube: neurotech-monthly-approval-record | neurotech | D37 AUTHORITY\nexport const CUBE = ${JSON.stringify(cube, null, 2)}\n`;
}

function record({ execute = false } = {}) {
  const generatedAt = new Date().toISOString();
  const approval = buildApproval(generatedAt);
  const shannonPacket = buildShannon(approval, generatedAt);
  const hermesPacket = buildHermes(approval, generatedAt);
  const cube = buildCube(approval, shannonPacket, generatedAt);
  const md = buildMd(approval);
  const report = {
    reportId: 'neurotech-monthly-approval-record-latest',
    generatedAt,
    status: approval.status,
    mode: MODE,
    approval: repoRel(PATHS.approvalJson),
    shannon: shannonPacket
  };
  const eventId = `neurotech-monthly-approval-${Date.now()}`;

  if (execute) {
    writeJson(PATHS.approvalJson, approval);
    writeText(PATHS.approvalMd, md);
    writeJson(PATHS.state, { savedAt: generatedAt, status: approval.status, approval: repoRel(PATHS.approvalJson), report: repoRel(PATHS.reportMd) });
    writeJson(PATHS.hermes, hermesPacket);
    writeJson(PATHS.shannon, shannonPacket);
    writeText(PATHS.cube, cube);
    writeJson(PATHS.reportJson, report);
    writeText(PATHS.reportMd, md);
    appendNdjson(PATHS.inbox, {
      id: eventId,
      ts: generatedAt,
      from: 'asolaria',
      to: 'neurotech-monthly-approval',
      verb: 'EVT-NEUROTECH-MONTHLY-APPROVAL',
      body: { status: approval.status, participantCount: approval.participants.length, approval: repoRel(PATHS.approvalMd) }
    });
    appendNdjson(PATHS.outbox, {
      id: `${eventId}-hermes`,
      ts: generatedAt,
      from: 'hermes',
      to: 'neurotech-monthly-approval',
      verb: hermesPacket.packet.verb,
      body: hermesPacket
    });
    appendNdjson(PATHS.gnnEdges, {
      id: `${eventId}-edge`,
      ts: generatedAt,
      from: 'household_authority',
      to: 'safe_neurotech_rnd_tests',
      verb: 'monthly_approval_recorded_with_gates',
      weight: 0.86
    });
  }

  return {
    ok: true,
    action: execute ? 'record' : 'preview',
    generatedAt,
    status: approval.status,
    participantCount: approval.participants.length,
    approvalWindow: approval.participants[0]?.approvalWindow || null,
    outputs: {
      approvalJson: repoRel(PATHS.approvalJson),
      approvalMd: repoRel(PATHS.approvalMd),
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
    console.log(JSON.stringify(record({ execute: false }), null, 2));
    return;
  }
  if (action === 'record') {
    console.log(JSON.stringify(record({ execute }), null, 2));
    return;
  }
  console.error(JSON.stringify({
    ok: false,
    error: `Unknown action: ${action}`,
    usage: [
      'node tools/neurotech-monthly-approval-record.js status',
      'node tools/neurotech-monthly-approval-record.js record --execute'
    ]
  }, null, 2));
  process.exitCode = 2;
}

main(process.argv);
