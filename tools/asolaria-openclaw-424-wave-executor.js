#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const behcs = require('./behcs/codex-bridge');

const ROOT = path.resolve(__dirname, '..');
const ORCH_RUN = 'openclaw-424-room-execution-orchestration-20260426';
const RUN_ROOT = rel(`data/behcs/orchestration/${ORCH_RUN}`);
const WAVE_ROOT = path.join(RUN_ROOT, 'wave-execution');

const PATHS = Object.freeze({
  wavePlan: path.join(RUN_ROOT, 'room-execution-wave-plan.v1.json'),
  tickets: path.join(RUN_ROOT, 'executor-dispatch-tickets.v1.json'),
  conductorState: path.join(RUN_ROOT, 'room-execution-conductor.state.json'),
  waveRoot: WAVE_ROOT,
  globalInbox: rel('data/behcs/inbox.ndjson'),
  gnnEdges: rel('data/behcs/gnn-live-edges.ndjson')
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

function sha256Buffer(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function glyph(kind, id, seed = '') {
  const hash = sha256(`${kind}:${id}:${seed}`);
  return `HG256:${kind.toUpperCase()}:${hash.slice(0, 8).toUpperCase()}:${behcs.hilbertAddress(hash)}`;
}

function loadInputs() {
  const wavePlan = readJson(PATHS.wavePlan, { waves: [] });
  const ticketDoc = readJson(PATHS.tickets, { tickets: [] });
  return {
    waves: Array.isArray(wavePlan.waves) ? wavePlan.waves : [],
    tickets: Array.isArray(ticketDoc.tickets) ? ticketDoc.tickets : []
  };
}

function summarizeProofRef(proofRef) {
  const absolute = rel(proofRef);
  if (!fs.existsSync(absolute)) {
    return {
      proofRef,
      exists: false,
      bytes: 0,
      sha256: '',
      json: false,
      topLevelKeys: []
    };
  }
  const buffer = fs.readFileSync(absolute);
  const summary = {
    proofRef,
    exists: true,
    bytes: buffer.length,
    sha256: sha256Buffer(buffer),
    json: false,
    topLevelKeys: []
  };
  if (proofRef.endsWith('.json')) {
    try {
      const parsed = JSON.parse(buffer.toString('utf8'));
      summary.json = true;
      summary.topLevelKeys = parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? Object.keys(parsed).slice(0, 20)
        : [];
    } catch (_) {
      summary.json = false;
    }
  }
  return summary;
}

function executeTicket(ticket, wave, generatedAt) {
  const allProofRefs = Array.from(new Set((ticket.tasks || []).flatMap((task) => task.proofRefs || [])));
  const proofRefs = allProofRefs.map(summarizeProofRef);
  const missingProofRefs = proofRefs.filter((proof) => !proof.exists).map((proof) => proof.proofRef);
  const taskRows = (ticket.tasks || []).map((task) => {
    const refs = (task.proofRefs || []).map((proofRef) => proofRefs.find((proof) => proof.proofRef === proofRef));
    const missing = refs.filter((proof) => !proof?.exists).map((proof) => proof?.proofRef || '');
    return {
      taskId: task.taskId,
      title: task.title,
      phaseId: task.phaseId,
      owner: task.owner,
      status: missing.length ? 'HOLD_MISSING_PROOF' : 'COMPLETED_LOCAL_PROOF_VERIFICATION',
      missingProofRefs: missing,
      proofRefSha256: refs.filter(Boolean).map((proof) => ({
        proofRef: proof.proofRef,
        sha256: proof.sha256,
        bytes: proof.bytes
      }))
    };
  });
  const status = missingProofRefs.length ? 'HOLD_MISSING_PROOF' : 'WAVE_TICKET_PROOF_EXECUTED';
  return {
    id: `wave-result-${wave.id}-${ticket.executorId}`,
    generatedAt,
    runId: ORCH_RUN,
    waveId: wave.id,
    executorId: ticket.executorId,
    phaseId: ticket.phaseId,
    namedAgent: ticket.namedAgent,
    owner: ticket.owner,
    cascade: ticket.cascade,
    status,
    dependencies: ticket.dependencies,
    writeLocks: ticket.writeLocks,
    brownHilbertRooms: ticket.brownHilbertRooms,
    proofRefs,
    missingProofRefs,
    taskCount: taskRows.length,
    taskRows,
    behcs256: {
      glyph: glyph('wave_execution_result', `${wave.id}:${ticket.executorId}`, status),
      programSentence: `WAVE_EXECUTED ${wave.id} EXECUTOR ${ticket.executorId} STATUS ${status} PROOF_REFS ${proofRefs.length} MISSING ${missingProofRefs.length}`
    }
  };
}

function buildSupervisorQueue(wave, results) {
  return results.map((result) => ({
    id: `ASO-WAVE-COMPLETE-${wave.id}-${result.phaseId}`,
    title: `Wave completion proof for ${result.namedAgent}`,
    objective: `Review local completion proof for ${result.executorId} in ${wave.id}; this is proof verification and checkpoint sealing only.`,
    requestedWorker: `local_wave_completion_reviewer:${result.namedAgent}`,
    instructions: result.behcs256.programSentence,
    pid: `BH.WAVE.COMPLETE.${wave.id.toUpperCase()}.${result.phaseId.toUpperCase().replace(/[^A-Z0-9]+/g, '.')}`,
    pidScope: 'local_wave_completion_only',
    consentScope: 'operator_authorized_local_orchestration',
    allowedPaths: [
      `data/behcs/orchestration/${ORCH_RUN}`,
      'data/behcs/memory',
      'data/behcs/index',
      'data/behcs/maps/asolaria',
      'data/behcs/cubes',
      'data/behcs/codex/glyph-language',
      'reports',
      'TASKS.md'
    ],
    expectedArtifacts: result.proofRefs.map((proof) => proof.proofRef),
    acceptanceGates: [
      'proof_refs_present',
      'task_rows_status_complete_or_hold',
      'wave_lock_scope_preserved',
      'no_code_write_claim',
      'no_external_api_or_provider_bypass',
      'no_remote_mutation'
    ],
    proofRequired: true,
    proofRefs: result.proofRefs.map((proof) => proof.proofRef),
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
    taskType: 'brown_hilbert_wave_completion_proof',
    source: ORCH_RUN
  }));
}

function buildArtifacts(wave, tickets, results, generatedAt) {
  const waveDir = path.join(WAVE_ROOT, wave.id);
  const status = results.some((result) => result.status !== 'WAVE_TICKET_PROOF_EXECUTED')
    ? 'HOLD_MISSING_PROOF'
    : 'WAVE_EXECUTION_PROOF_COMPLETE';
  const summary = {
    runId: ORCH_RUN,
    waveId: wave.id,
    generatedAt,
    status,
    executorCount: tickets.length,
    taskCount: results.reduce((sum, result) => sum + result.taskCount, 0),
    proofRefCount: results.reduce((sum, result) => sum + result.proofRefs.length, 0),
    missingProofRefs: results.flatMap((result) => result.missingProofRefs),
    boundary: {
      codeImplementationClaimed: false,
      externalApiCall: false,
      providerAuthBypass: false,
      paymentBypass: false,
      remoteMutation: false,
      processFanout: false
    },
    outputs: {
      resultJson: repoRel(path.join(waveDir, 'execution-result.v1.json')),
      taskRows: repoRel(path.join(waveDir, 'execution-task-results.v1.ndjson')),
      supervisorQueue: repoRel(path.join(waveDir, 'completion-supervisor-queue.ndjson')),
      reportMd: repoRel(rel(`reports/openclaw-424-${wave.id}-execution-latest.md`))
    }
  };
  const reportMd = [
    `# OpenClaw 4.24 ${wave.id} Execution`,
    '',
    `Generated: ${generatedAt}`,
    '',
    `Status: ${status}`,
    '',
    `- Executors: ${tickets.length}`,
    `- Tasks checked: ${summary.taskCount}`,
    `- Proof refs checked: ${summary.proofRefCount}`,
    `- Missing proof refs: ${summary.missingProofRefs.length}`,
    '',
    '## Executors',
    '',
    ...results.map((result) => `- ${result.executorId}: ${result.status}; tasks=${result.taskCount}; proofRefs=${result.proofRefs.length}; room=${result.brownHilbertRooms.executorRoom}`),
    '',
    '## Boundary',
    '',
    'This wave executed local proof verification and checkpoint sealing only. It does not claim downstream code implementation is complete, and it did not call external providers, bypass auth/payment, mutate remote systems, or spawn uncontrolled processes.'
  ].join('\n');
  return { summary, reportMd };
}

function runWave({ waveId, execute }) {
  const generatedAt = new Date().toISOString();
  const inputs = loadInputs();
  const wave = inputs.waves.find((item) => item.id === waveId);
  if (!wave) {
    throw new Error(`wave not found: ${waveId}`);
  }
  const tickets = inputs.tickets.filter((ticket) => ticket.waveId === waveId);
  if (tickets.length < 1) {
    throw new Error(`no tickets found for wave: ${waveId}`);
  }
  const unsupported = tickets.filter((ticket) => (ticket.phaseId || '') !== 'p01-release-freeze-proof-intake');
  if (unsupported.length) {
    throw new Error(`wave runner currently supports proof-intake wave only; unsupported=${unsupported.map((ticket) => ticket.phaseId).join(',')}`);
  }
  const waveDir = path.join(WAVE_ROOT, wave.id);
  const results = tickets.map((ticket) => executeTicket(ticket, wave, generatedAt));
  const artifacts = buildArtifacts(wave, tickets, results, generatedAt);
  const supervisorQueue = buildSupervisorQueue(wave, results);
  const taskRows = results.flatMap((result) => result.taskRows.map((row) => ({
    ...row,
    waveId: wave.id,
    executorId: result.executorId
  })));
  const resultJsonPath = path.join(waveDir, 'execution-result.v1.json');
  const taskRowsPath = path.join(waveDir, 'execution-task-results.v1.ndjson');
  const supervisorQueuePath = path.join(waveDir, 'completion-supervisor-queue.ndjson');
  const reportJsonPath = rel(`reports/openclaw-424-${wave.id}-execution-latest.json`);
  const reportMdPath = rel(`reports/openclaw-424-${wave.id}-execution-latest.md`);
  if (execute) {
    writeJson(resultJsonPath, { summary: artifacts.summary, results });
    writeNdjson(taskRowsPath, taskRows);
    writeNdjson(supervisorQueuePath, supervisorQueue);
    writeJson(reportJsonPath, artifacts.summary);
    writeText(reportMdPath, artifacts.reportMd);
    appendNdjson(PATHS.globalInbox, {
      generatedAt,
      type: 'openclaw_424_wave_execution_completed',
      runId: ORCH_RUN,
      waveId: wave.id,
      status: artifacts.summary.status,
      report: repoRel(reportMdPath)
    });
    appendNdjson(PATHS.gnnEdges, {
      generatedAt,
      from: ORCH_RUN,
      to: `${ORCH_RUN}:${wave.id}`,
      relation: 'EXECUTES_WAVE_PROOF',
      weight: 1,
      glyph: glyph('gnn_edge', `${ORCH_RUN}:${wave.id}`, 'executes_wave_proof')
    });
  }
  return {
    ok: true,
    execute,
    runId: ORCH_RUN,
    waveId: wave.id,
    status: artifacts.summary.status,
    executorCount: tickets.length,
    taskCount: artifacts.summary.taskCount,
    proofRefCount: artifacts.summary.proofRefCount,
    missingProofRefs: artifacts.summary.missingProofRefs.length,
    supervisorQueue: repoRel(supervisorQueuePath),
    report: repoRel(reportMdPath)
  };
}

function parseArgs(argv) {
  const flags = {
    command: argv.find((arg) => !arg.startsWith('--')) || 'run-wave',
    waveId: 'wave-01',
    execute: argv.includes('--execute')
  };
  for (const arg of argv) {
    if (arg.startsWith('--wave=')) {
      flags.waveId = arg.slice('--wave='.length);
    }
  }
  return flags;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.command !== 'run-wave') {
    console.error('Usage: node tools/asolaria-openclaw-424-wave-executor.js run-wave --wave=wave-01 [--execute]');
    process.exitCode = 1;
    return;
  }
  console.log(JSON.stringify(runWave(args), null, 2));
}

if (require.main === module) {
  main();
}

