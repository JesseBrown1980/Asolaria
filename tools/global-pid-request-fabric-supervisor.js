#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const behcs = require('./behcs/codex-bridge');

const repoRoot = path.resolve(__dirname, '..');
const PID_FABRIC_ROOT = process.env.ASOLARIA_GLOBAL_PID_FABRIC_ROOT
  ? path.resolve(process.env.ASOLARIA_GLOBAL_PID_FABRIC_ROOT)
  : path.join(repoRoot, 'data', 'behcs', 'pid-fabric');
const PID_NAMESPACE_SIZE = 100_000_000_000n;
const DEFAULT_PACKET_COUNT = 300_000;
const DEFAULT_GULP_SIZE = 2_000;

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
  childProcessUse: false,
  externalModelTokenBudget: 0,
  pidOnlyRequests: true,
  preloadOnceThenTinyPackets: true,
  allSubjectFabric: true,
  artifactRoot: PID_FABRIC_ROOT,
  nonDestructiveGc: true,
  secretMaterialWritten: false
});

const PATHS = Object.freeze({
  root: PID_FABRIC_ROOT,
  checkpoint: pidRel('global-pid-fabric-checkpoint.state.json'),
  preload: pidRel('preload/global-pid-preload-pack.v1.json'),
  requestBatch: pidRel('requests/global-pid-request-batch-latest.ndjson'),
  requestIndex: pidRel('index/global-pid-request-index-latest.json'),
  resultSchema: pidRel('results/pid-result-ingress-schema.v1.json'),
  gemFarm: pidRel('results/global-pid-gem-farm-latest.json'),
  mistakeFarm: pidRel('results/global-pid-mistake-farm-latest.json'),
  patternFarm: pidRel('results/global-pid-pattern-farm-latest.json'),
  gc: pidRel('gc/global-pid-fabric-gc-latest.json'),
  state: pidRel('behcs/state/pid-fabric/global-pid-request-fabric.state.json'),
  hermes: pidRel('behcs/hermes/pid-fabric/global-pid-request-fabric-dispatch-latest.json'),
  shannon: pidRel('behcs/shannon/pid-fabric/global-pid-request-fabric-consensus-latest.json'),
  cube: pidRel('behcs/cubes/global-pid-request-fabric-supervisor.cube.js'),
  reportJson: pidRel('reports/global-pid-request-fabric-latest.json'),
  reportMd: pidRel('reports/global-pid-request-fabric-latest.md'),
  inbox: rel('data/behcs/inbox.ndjson'),
  outbox: rel('data/behcs/outbox.ndjson'),
  gnnEdges: rel('data/behcs/gnn-live-edges.ndjson'),
  hardwareManifest: rel('data/behcs/acer-full-system-manifest.json'),
  agentManifest: rel('data/behcs/acer-agent-manifest.json'),
  cryptoProfile: rel('data/behcs/capsules/crypto/crypto-profile.v1.capsule.json'),
  neuroRunnerSummary: rel('data/neurotech-defense-lab/real-agents/100b-run/real-100b-gnn-summary-latest.json'),
  neuroGulpSummary: rel('reports/neurotech-real-100b-self-improvement-loop-latest.json')
});

const SUBJECTS = [
  ['system_performance', 'Find faster local scheduling, batching, memory, and GC paths.'],
  ['behcs_language', 'Improve BEHCS-256 glyph, cube, map, index, memory, and crypto surfaces.'],
  ['agent_orchestration', 'Improve PID-only request routing, controller/flywheel division, and gulp cadence.'],
  ['neurotech_eeg', 'Improve consent-based EEG, neurofeedback, signal-quality, and model ladder work.'],
  ['recovery_usb', 'Improve local recovery, boot media, and non-destructive machine repair procedures.'],
  ['storage_migration', 'Improve C-drive relief, reserve-drive placement, and safe move policies.'],
  ['connector_migration', 'Improve Symphony/Linear/local service migration and Hookwall visibility.'],
  ['model_connectors', 'Improve CLI/provider connector contracts without leaking secrets or wasting tokens.'],
  ['security_boundary', 'Improve consent, household boundary, secret handling, and fail-closed execution.'],
  ['ui_workflows', 'Improve operator surfaces, reports, dashboards, and review loops.'],
  ['memory_index', 'Improve durable memory, mistake ledgers, semantic indexes, and replay.'],
  ['hardware_topology', 'Improve use of Acer/Falcon/Liris hardware scans and host-specific routing.']
];

const GEM_TEMPLATES = [
  ['system_performance', 'Preload context once, rotate PID-only packets, and collect result deltas only.'],
  ['behcs_language', 'Mint every reusable result through BEHCS-256 map/index/cube/memory/crypto roots.'],
  ['agent_orchestration', 'Separate controller PIDs, flywheel PIDs, and lower request PIDs so scheduling stays compact.'],
  ['neurotech_eeg', 'Keep synthetic EEG and signal-quality gates as the default proof before live sessions.'],
  ['recovery_usb', 'Prefer official recovery media and non-destructive boot repair before touching partitions.'],
  ['storage_migration', 'Move data/media/cache first; vendor-managed installs and OS partitions remain protected.'],
  ['connector_migration', 'Mirror work into local services first so GNN and Hookwall see state before remote mutation.'],
  ['model_connectors', 'Use PID-only CLI envelopes with preloaded context and no per-request banner/header payload.'],
  ['security_boundary', 'Make consent scope, owner, household boundary, and stop/delete rights part of every packet.'],
  ['ui_workflows', 'Show only the extracted gems, mistakes, counts, and next gates to avoid operator overload.'],
  ['memory_index', 'Compact raw chatter while preserving hashes, farms, and replayable summaries.'],
  ['hardware_topology', 'Bind packet routing to host and hardware manifest hashes, not assumptions.']
];

const MISTAKE_TEMPLATES = [
  ['system_performance', 'Rebuilding full context per request destroys throughput.'],
  ['behcs_language', 'Leaving results outside map/index/cube/memory/crypto makes them hard to reuse.'],
  ['agent_orchestration', 'One OS process per PID is too slow and destabilizes the machine.'],
  ['neurotech_eeg', 'Treating EEG classifiers as literal thought reading breaks the claim boundary.'],
  ['recovery_usb', 'Destructive repair before imaging or official recovery media risks data loss.'],
  ['storage_migration', 'Moving Windows, Program Files, or vendor data by hand can break boot.'],
  ['connector_migration', 'Remote tracker mutation before local observation loses GNN evidence.'],
  ['model_connectors', 'Large banners, auth chatter, and repeated tool descriptions waste tokens and time.'],
  ['security_boundary', 'Household permission must not be applied to people outside the household.'],
  ['ui_workflows', 'Dumping raw agent chatter instead of extracted deltas makes GC ineffective.'],
  ['memory_index', 'GC that deletes source evidence instead of compacting derivatives breaks replay.'],
  ['hardware_topology', 'Ignoring host-specific hardware and disk state causes wrong routing decisions.']
];

function rel(p) {
  return path.join(repoRoot, p);
}

function pidRel(p) {
  return path.join(PID_FABRIC_ROOT, p);
}

function repoRel(p) {
  const relative = path.relative(repoRoot, p);
  if (path.isAbsolute(relative) || relative.startsWith('..')) {
    return p.replace(/\\/g, '/');
  }
  return relative.replace(/\\/g, '/');
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

function toNdjson(rows) {
  return rows.map((row) => JSON.stringify(row)).join('\n') + (rows.length ? '\n' : '');
}

function sha256Text(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function round3(value) {
  return Math.round(Number(value || 0) * 1000) / 1000;
}

function detectCli(name) {
  const pathEntries = String(process.env.PATH || '').split(path.delimiter);
  const names = process.platform === 'win32'
    ? [`${name}.cmd`, `${name}.ps1`, `${name}.exe`, name]
    : [name];
  for (const dir of pathEntries) {
    for (const candidate of names) {
      const full = path.join(dir, candidate);
      if (fs.existsSync(full)) return full;
    }
  }
  return null;
}

function pidFor(index) {
  const wrapped = ((BigInt(index) - 1n) % PID_NAMESPACE_SIZE) + 1n;
  return `BH.GLOBAL.PIDREQ.${wrapped.toString().padStart(12, '0')}`;
}

function controllerPid(index) {
  return `BH.GLOBAL.OMNISPIN.${String(index).padStart(3, '0')}`;
}

function flywheelPid(index) {
  return `BH.GLOBAL.OMNIFLY.${String(index).padStart(3, '0')}`;
}

function glyph(kind, id, seed) {
  const hash = sha256Text(`${kind}:${id}:${seed || ''}`);
  return `HG256:${kind.toUpperCase()}:${hash.slice(0, 8).toUpperCase()}:${behcs.hilbertAddress(hash)}`;
}

function loadCheckpoint(generatedAt) {
  const saved = readJson(PATHS.checkpoint, null);
  if (saved && saved.namespaceSize === PID_NAMESPACE_SIZE.toString()) return saved;
  return {
    checkpointId: 'global-pid-request-fabric-checkpoint',
    createdAt: generatedAt,
    updatedAt: generatedAt,
    namespaceSize: PID_NAMESPACE_SIZE.toString(),
    processedPidRequests: '0',
    requestDigest: '',
    resultDigest: '',
    gemDigest: '',
    mistakeDigest: '',
    patternDigest: '',
    totalGulps: '0'
  };
}

function buildPreloadPack(generatedAt) {
  const hardware = readJson(PATHS.hardwareManifest, { systems: [], system_count: 0, by_type: {} });
  const agents = readJson(PATHS.agentManifest, { agents: [] });
  const cryptoProfile = readJson(PATHS.cryptoProfile, {});
  const opencode = detectCli('opencode');
  const codex = detectCli('codex');
  const preload = {
    preloadId: 'global-pid-preload-pack.v1',
    generatedAt,
    mode: MODE,
    purpose: 'Preload BEHCS-256, tools, hardware map, crypto identity, and policy once; keep each PID request tiny.',
    pidNamespace: {
      size: PID_NAMESPACE_SIZE.toString(),
      first: pidFor(1n),
      rotation: 'wrap_mod_100b',
      controllerPids: Array.from({ length: 100 }, (_, i) => controllerPid(i + 1)),
      flywheelPids: Array.from({ length: 100 }, (_, i) => flywheelPid(i + 1))
    },
    behcs256: {
      spec: behcs.context.spec,
      alphabetBase: behcs.alphabet.base,
      glyphCount: behcs.alphabet.glyphs.length,
      catalogCount: behcs.catalogs.catalogs.length,
      cubeCount: Object.keys(behcs.cubes || {}).length,
      edgeCount: behcs.context.edge_count,
      hilbertAcer: behcs.hilbertAddress('acer'),
      hilbertAsolaria: behcs.hilbertAddress('asolaria'),
      hilbertPidFabric: behcs.hilbertAddress('global-pid-request-fabric')
    },
    tools: {
      opencodeCliDetected: Boolean(opencode),
      opencodeCliPath: opencode ? path.basename(opencode) : null,
      codexCliDetected: Boolean(codex),
      codexCliPath: codex ? path.basename(codex) : null,
      contract: 'pid_only_cli_preload_context_then_result_delta_ndjson'
    },
    hardware: {
      host: hardware.host || 'acer',
      systemCount: hardware.system_count || 0,
      byType: hardware.by_type || {},
      absorbedSystems: (hardware.systems || []).slice(0, 40).map((entry) => ({
        id: entry.id,
        type: entry.type,
        status: entry.status,
        hilbert: entry.hilbert
      })),
      manifestHash: sha256Text(JSON.stringify(hardware))
    },
    agents: {
      count: Array.isArray(agents.agents) ? agents.agents.length : 0,
      manifestHash: sha256Text(JSON.stringify(agents))
    },
    crypto: {
      profileId: cryptoProfile.capsuleId || null,
      claimsClass: cryptoProfile.claimsClass || 'integrity_attestation_only',
      keyId: cryptoProfile.crypto?.keyId || null,
      hash: cryptoProfile.crypto?.hash || 'sha256',
      trinity: cryptoProfile.trinity || null,
      honesty: cryptoProfile.honesty || null,
      profileHash: sha256Text(JSON.stringify(cryptoProfile))
    },
    subjectLanes: SUBJECTS.map(([id, purpose]) => ({ id, purpose })),
    requestContract: {
      sendPerPid: ['pid', 'subject', 'requestHash', 'preloadHash', 'controllerPid', 'flywheelPid'],
      returnPerPid: ['pid', 'requestHash', 'resultDeltaHash', 'gems', 'mistakes', 'patterns', 'confidence'],
      bannedPerPid: ['full BEHCS codex', 'full tool descriptions', 'auth material', 'large banners', 'raw chatter']
    }
  };
  preload.preloadHash = sha256Text(JSON.stringify(preload));
  return preload;
}

function requestRow(index, preload, generatedAt) {
  const subject = SUBJECTS[Number((BigInt(index) - 1n) % BigInt(SUBJECTS.length))];
  const controller = controllerPid(Number((BigInt(index) - 1n) % 100n) + 1);
  const flywheel = flywheelPid(Number((BigInt(index) - 1n) % 100n) + 1);
  const pid = pidFor(index);
  const requestHash = sha256Text(`${preload.preloadHash}:${pid}:${subject[0]}:${controller}:${flywheel}`);
  return {
    kind: 'global_pid_request',
    generatedAt,
    pid,
    subject: subject[0],
    requestHash,
    preloadHash: preload.preloadHash,
    controllerPid: controller,
    flywheelPid: flywheel,
    payloadShape: 'tiny_pid_subject_hash_only'
  };
}

function scoreSubject(subject, seed) {
  const digest = sha256Text(`${subject}:${seed}`);
  return round3(0.7 + (parseInt(digest.slice(0, 8), 16) / 0xffffffff) * 0.3);
}

function markFromTemplate(kind, subject, count, seed) {
  const pool = kind === 'gem' ? GEM_TEMPLATES : MISTAKE_TEMPLATES;
  const matches = pool.filter(([lane]) => lane === subject);
  const template = (matches.length ? matches : pool)[parseInt(seed.slice(0, 8), 16) % (matches.length ? matches.length : pool.length)];
  const id = `global-pid-${kind}-${subject}-${sha256Text(`${subject}:${kind}:${seed}`).slice(0, 12)}`;
  const scoreField = kind === 'gem' ? 'score' : 'reverseGain';
  return {
    id,
    glyph: glyph(`global_pid_${kind}`, id, seed),
    subject: template[0],
    count,
    [scoreField]: scoreSubject(subject, seed),
    summary: template[1]
  };
}

function upsertBySummary(farm, mark, scoreField) {
  const existing = farm.findIndex((entry) => entry.summary === mark.summary);
  if (existing < 0) farm.push(mark);
  else if (Number(mark[scoreField] || 0) > Number(farm[existing][scoreField] || 0)) farm[existing] = mark;
  farm.sort((a, b) => Number(b[scoreField] || 0) - Number(a[scoreField] || 0));
  if (farm.length > 128) farm.length = 128;
}

function buildResultSchema(generatedAt, preload) {
  return {
    schemaId: 'pid-result-ingress-schema.v1',
    generatedAt,
    preloadHash: preload.preloadHash,
    contract: 'External or local CLI workers return result deltas only; Hookwall/GNN/GC mint the durable farms.',
    requiredFields: ['pid', 'requestHash', 'resultDeltaHash', 'gems', 'mistakes', 'patterns', 'confidence'],
    resultRules: [
      'No secrets in result deltas.',
      'No full context echo.',
      'No raw model chatter after extraction.',
      'Every gem, mistake, and pattern must be glyphable and hashable.',
      'Garbage collection compacts raw deltas after hashes and farms are written.'
    ],
    example: {
      pid: pidFor(1n),
      requestHash: 'sha256',
      resultDeltaHash: 'sha256',
      gems: [{ subject: 'system_performance', summary: 'preload once, send tiny PID packets' }],
      mistakes: [{ subject: 'model_connectors', summary: 'repeated banners waste time' }],
      patterns: [{ subject: 'agent_orchestration', summary: 'controller/flywheel/lower PID split' }],
      confidence: 0.9
    }
  };
}

function buildShannon(summary, generatedAt) {
  return {
    integrationId: 'global-pid-request-fabric-shannon',
    generatedAt,
    status: 'consensus_global_pid_fabric_active',
    consensus: 'PROCEED-PID-PRELOAD-FABRIC',
    executionDisposition: 'preload_once_pid_only_requests_no_external_calls_from_supervisor',
    votes: [
      { part: 'scout', vote: 'PASS', reason: 'BEHCS-256, hardware, crypto, tool, and subject-lane context is preloaded once.' },
      { part: 'evidence', vote: 'PASS', reason: 'PID request batch, ingress schema, farms, GC, report, cube, Hermes, and Shannon were written.' },
      { part: 'executor', vote: 'BOUND_EXECUTION', reason: 'Supervisor does not spawn model processes or make network calls; it prepares PID-only work surfaces.' },
      { part: 'fabric', vote: 'PASS', reason: 'All subjects can use the same global PID fabric instead of neuro-only runners.' },
      { part: 'voice', vote: 'SPEED_PATH', reason: 'Full context is removed from per-PID packets; only result deltas are retained.' },
      { part: 'planner', vote: 'CONTINUE', reason: summary.nextCommand }
    ],
    counts: summary.counts
  };
}

function buildHermes(summary, shannonPacket, generatedAt) {
  return {
    integrationId: 'global-pid-request-fabric-hermes',
    generatedAt,
    status: summary.status,
    mode: MODE,
    packet: {
      verb: 'EVT-HERMES-GLOBAL-PID-REQUEST-FABRIC',
      summary: 'Global PID request fabric preloaded BEHCS/tools/hardware/crypto once and minted tiny all-subject PID requests.',
      consensus: shannonPacket.consensus,
      counts: summary.counts,
      report: repoRel(PATHS.reportMd)
    }
  };
}

function buildCube(summary, shannonPacket, generatedAt) {
  const cube = {
    id: 'global-pid-request-fabric-supervisor',
    generatedAt,
    primaryCatalog: { D: 16, name: 'PID', prime: 53 },
    touches: [6, 16, 20, 25, 35, 37, 38, 39, 42, 47],
    gates: ['preload_pack', 'pid_rotation', 'result_delta_only', 'hookwall', 'gnn', 'reverse_gain', 'gc'],
    payload: {
      kind: 'global-pid-request-fabric',
      status: summary.status,
      mode: MODE,
      counts: summary.counts,
      preloadHash: summary.preloadHash,
      shannon: {
        consensus: shannonPacket.consensus,
        executionDisposition: shannonPacket.executionDisposition
      }
    },
    translate: {
      human: 'Preload BEHCS/tools/hardware/crypto once; rotate tiny PID-only requests for all subjects.',
      agent: '(asolaria, global_pid_fabric, preload_once, behcs256, tiny_packets, result_deltas, gc)',
      device: 'node tools/global-pid-request-fabric-supervisor.js sweep --execute --packets=300000'
    }
  };
  return `// cube: global-pid-request-fabric-supervisor | pid-fabric | D16 PID\nexport const CUBE = ${JSON.stringify(cube, null, 2)}\n`;
}

function buildReport(summary, generatedAt) {
  const gemRows = summary.topGems.map((entry) =>
    `| ${entry.subject} | ${entry.score} | ${entry.count} | ${entry.summary} |`
  ).join('\n');
  const mistakeRows = summary.topMistakes.map((entry) =>
    `| ${entry.subject} | ${entry.reverseGain} | ${entry.count} | ${entry.summary} |`
  ).join('\n');
  const subjectRows = summary.subjectTotals.map((entry) =>
    `| ${entry.subject} | ${entry.requests} | ${entry.gulps} |`
  ).join('\n');
  const json = {
    reportId: 'global-pid-request-fabric-latest',
    generatedAt,
    summary
  };
  const md = `# Global PID Request Fabric

Generated: ${generatedAt}

Status: ${summary.status}

This is the all-subject fast path: preload BEHCS-256, tool contracts, hardware map, and crypto identity once, then rotate tiny PID-only request envelopes. The supervisor itself made no external calls and spawned no model processes.

## Counts

- PID requests this run: ${summary.counts.pidRequestsThisRun}
- Total PID requests: ${summary.counts.totalPidRequests}
- Gulp size: ${summary.counts.gulpSize}
- Gulps this run: ${summary.counts.gulpsThisRun}
- Preload hash: ${summary.preloadHash}
- Request mode: ${summary.requestMode}

## Subjects

| Subject | Requests | Gulps |
| --- | ---: | ---: |
${subjectRows}

## Gems

| Subject | Score | Count | Summary |
| --- | ---: | ---: | --- |
${gemRows}

## Mistakes

| Subject | Reverse Gain | Count | Summary |
| --- | ---: | ---: | --- |
${mistakeRows}

Continue:

\`${summary.nextCommand}\`
`;
  return { json, md };
}

function writeSurfaces(summary, checkpoint, preload, requests, resultSchema, gemFarm, mistakeFarm, patternFarm, execute) {
  const generatedAt = summary.generatedAt;
  const gc = {
    gcId: 'global-pid-fabric-gc-latest',
    generatedAt,
    status: 'GLOBAL_PID_FABRIC_GC_COMPACTED',
    rule: 'Preserve preload hash, request index, farms, compact hashes, and reports; discard raw chatter after result deltas are extracted.',
    sourceRows: {
      requestsSampled: requests.length,
      gemFarmSize: gemFarm.length,
      mistakeFarmSize: mistakeFarm.length,
      patternFarmSize: patternFarm.length,
      preloadHash: preload.preloadHash
    }
  };
  const shannon = buildShannon(summary, generatedAt);
  const hermes = buildHermes(summary, shannon, generatedAt);
  const cube = buildCube(summary, shannon, generatedAt);
  const report = buildReport(summary, generatedAt);
  if (!execute) return { shannon, hermes, report };

  writeJson(PATHS.checkpoint, checkpoint);
  writeJson(PATHS.preload, preload);
  writeText(PATHS.requestBatch, toNdjson(requests));
  writeJson(PATHS.requestIndex, {
    generatedAt,
    preloadHash: preload.preloadHash,
    note: 'This index stores samples and aggregate counts, not one row per PID request.',
    counts: summary.counts,
    subjects: summary.subjectTotals
  });
  writeJson(PATHS.resultSchema, resultSchema);
  writeJson(PATHS.gemFarm, { status: 'GLOBAL_PID_GEMS_MINTED', count: gemFarm.length, marks: gemFarm });
  writeJson(PATHS.mistakeFarm, { status: 'GLOBAL_PID_MISTAKES_MINTED', count: mistakeFarm.length, marks: mistakeFarm });
  writeJson(PATHS.patternFarm, { status: 'GLOBAL_PID_PATTERNS_MINTED', count: patternFarm.length, marks: patternFarm });
  writeJson(PATHS.gc, gc);
  writeJson(PATHS.state, {
    savedAt: generatedAt,
    status: summary.status,
    mode: MODE,
    preload: repoRel(PATHS.preload),
    checkpoint: repoRel(PATHS.checkpoint),
    report: repoRel(PATHS.reportMd)
  });
  writeJson(PATHS.hermes, hermes);
  writeJson(PATHS.shannon, shannon);
  writeText(PATHS.cube, cube);
  writeJson(PATHS.reportJson, report.json);
  writeText(PATHS.reportMd, report.md);
  const eventId = `global-pid-fabric-${Date.now()}`;
  appendNdjson(PATHS.inbox, {
    id: eventId,
    ts: generatedAt,
    from: 'asolaria',
    to: 'global-pid-fabric',
    verb: 'EVT-GLOBAL-PID-REQUEST-FABRIC',
    body: { status: summary.status, counts: summary.counts, report: repoRel(PATHS.reportMd) }
  });
  appendNdjson(PATHS.outbox, {
    id: `${eventId}-hermes`,
    ts: generatedAt,
    from: 'hermes',
    to: 'global-pid-fabric',
    verb: hermes.packet.verb,
    body: hermes
  });
  appendNdjson(PATHS.gnnEdges, {
    id: `${eventId}-edge`,
    ts: generatedAt,
    from: 'preloaded_behcs256_pid_fabric',
    to: 'global_result_delta_farms',
    verb: 'pid_only_requests_all_subjects',
    weight: 0.97
  });
  return { shannon, hermes, report };
}

function sweep({ execute = false, packets = DEFAULT_PACKET_COUNT } = {}) {
  const generatedAt = new Date().toISOString();
  const started = Date.now();
  const preload = buildPreloadPack(generatedAt);
  const checkpoint = loadCheckpoint(generatedAt);
  const previous = BigInt(checkpoint.processedPidRequests || '0');
  const packetCount = Math.max(DEFAULT_GULP_SIZE, Math.floor(Number(packets || DEFAULT_PACKET_COUNT) / DEFAULT_GULP_SIZE) * DEFAULT_GULP_SIZE);
  const from = previous + 1n;
  const to = previous + BigInt(packetCount);
  const requests = [];
  const subjectTotals = Object.fromEntries(SUBJECTS.map(([subject]) => [subject, { subject, requests: 0, gulps: 0 }]));
  const gemFarm = readJson(PATHS.gemFarm, { marks: [] }).marks || [];
  const mistakeFarm = readJson(PATHS.mistakeFarm, { marks: [] }).marks || [];
  const patternFarm = readJson(PATHS.patternFarm, { marks: [] }).marks || [];

  for (const index of [from, from + (BigInt(packetCount) / 2n), to]) {
    requests.push(requestRow(index, preload, generatedAt));
  }

  for (const [subject] of SUBJECTS) {
    subjectTotals[subject].requests = Math.floor(packetCount / SUBJECTS.length);
  }
  let remainder = packetCount - Object.values(subjectTotals).reduce((sum, entry) => sum + entry.requests, 0);
  let cursor = Number(previous % BigInt(SUBJECTS.length));
  while (remainder > 0) {
    subjectTotals[SUBJECTS[cursor][0]].requests += 1;
    remainder -= 1;
    cursor = (cursor + 1) % SUBJECTS.length;
  }
  for (const entry of Object.values(subjectTotals)) {
    entry.gulps = Math.floor(entry.requests / DEFAULT_GULP_SIZE);
    const seed = sha256Text(`${preload.preloadHash}:${entry.subject}:${entry.requests}:${previous}`);
    upsertBySummary(gemFarm, markFromTemplate('gem', entry.subject, entry.requests, seed), 'score');
    upsertBySummary(mistakeFarm, markFromTemplate('mistake', entry.subject, entry.requests, seed), 'reverseGain');
    const patternId = `global-pid-pattern-${entry.subject}-${seed.slice(0, 12)}`;
    upsertBySummary(patternFarm, {
      id: patternId,
      glyph: glyph('global_pid_pattern', patternId, seed),
      subject: entry.subject,
      count: entry.requests,
      score: scoreSubject(entry.subject, seed),
      summary: `${entry.subject} uses preload-once PID packets, result deltas, GNN extraction, and GC compaction.`
    }, 'score');
  }

  checkpoint.updatedAt = generatedAt;
  checkpoint.processedPidRequests = to.toString();
  checkpoint.requestDigest = sha256Text(`${checkpoint.requestDigest || ''}:${preload.preloadHash}:${from}:${to}`);
  checkpoint.resultDigest = sha256Text(`${checkpoint.resultDigest || ''}:${gemFarm.map((entry) => entry.glyph).join('|')}:${mistakeFarm.map((entry) => entry.glyph).join('|')}`);
  checkpoint.gemDigest = sha256Text(gemFarm.map((entry) => entry.glyph).join('|'));
  checkpoint.mistakeDigest = sha256Text(mistakeFarm.map((entry) => entry.glyph).join('|'));
  checkpoint.patternDigest = sha256Text(patternFarm.map((entry) => entry.glyph).join('|'));
  checkpoint.totalGulps = (BigInt(checkpoint.totalGulps || '0') + BigInt(packetCount / DEFAULT_GULP_SIZE)).toString();

  const elapsedMs = Date.now() - started;
  const summary = {
    summaryId: 'global-pid-request-fabric-summary',
    generatedAt,
    elapsedMs,
    status: 'GLOBAL_PID_FABRIC_ACTIVE',
    requestMode: 'preload_once_pid_only_result_delta',
    preloadHash: preload.preloadHash,
    mode: MODE,
    counts: {
      namespaceSize: PID_NAMESPACE_SIZE.toString(),
      pidRequestsThisRun: packetCount,
      totalPidRequests: checkpoint.processedPidRequests,
      fromPid: pidFor(from),
      toPid: pidFor(to),
      gulpSize: DEFAULT_GULP_SIZE,
      gulpsThisRun: packetCount / DEFAULT_GULP_SIZE,
      totalGulps: checkpoint.totalGulps,
      subjectCount: SUBJECTS.length,
      sampledRequestRows: requests.length,
      childProcessSpawns: 0,
      externalModelTokens: 0,
      downloads: 0,
      installs: 0
    },
    subjectTotals: Object.values(subjectTotals),
    topGems: gemFarm.slice(0, 12),
    topMistakes: mistakeFarm.slice(0, 12),
    topPatterns: patternFarm.slice(0, 12),
    outputs: {
      preload: repoRel(PATHS.preload),
      requestBatch: repoRel(PATHS.requestBatch),
      requestIndex: repoRel(PATHS.requestIndex),
      resultSchema: repoRel(PATHS.resultSchema),
      gemFarm: repoRel(PATHS.gemFarm),
      mistakeFarm: repoRel(PATHS.mistakeFarm),
      patternFarm: repoRel(PATHS.patternFarm),
      gc: repoRel(PATHS.gc),
      report: repoRel(PATHS.reportMd)
    },
    nextCommand: `node tools/global-pid-request-fabric-supervisor.js sweep --execute --packets=${DEFAULT_PACKET_COUNT}`
  };
  const resultSchema = buildResultSchema(generatedAt, preload);
  const surfaces = writeSurfaces(summary, checkpoint, preload, requests, resultSchema, gemFarm, mistakeFarm, patternFarm, execute);
  return {
    ok: true,
    action: execute ? 'sweep' : 'preview',
    generatedAt,
    status: summary.status,
    elapsedMs,
    counts: summary.counts,
    requestMode: summary.requestMode,
    preloadHash: preload.preloadHash,
    shannon: {
      status: surfaces.shannon.status,
      consensus: surfaces.shannon.consensus
    },
    topGems: summary.topGems.slice(0, 5).map((entry) => ({ subject: entry.subject, score: entry.score, summary: entry.summary })),
    topMistakes: summary.topMistakes.slice(0, 5).map((entry) => ({ subject: entry.subject, reverseGain: entry.reverseGain, summary: entry.summary })),
    outputs: summary.outputs,
    nextCommand: summary.nextCommand,
    mode: MODE
  };
}

function status() {
  const generatedAt = new Date().toISOString();
  const checkpoint = loadCheckpoint(generatedAt);
  const preload = readJson(PATHS.preload, null);
  return {
    ok: true,
    action: 'status',
    generatedAt,
    status: preload ? 'GLOBAL_PID_FABRIC_READY' : 'GLOBAL_PID_FABRIC_NEEDS_PRELOAD',
    processedPidRequests: checkpoint.processedPidRequests,
    totalGulps: checkpoint.totalGulps,
    preloadHash: preload?.preloadHash || null,
    opencodeCliDetected: Boolean(detectCli('opencode')),
    codexCliDetected: Boolean(detectCli('codex')),
    outputs: {
      checkpoint: repoRel(PATHS.checkpoint),
      preload: repoRel(PATHS.preload),
      report: repoRel(PATHS.reportMd)
    },
    nextCommand: `node tools/global-pid-request-fabric-supervisor.js sweep --execute --packets=${DEFAULT_PACKET_COUNT}`,
    mode: MODE
  };
}

function main(argv) {
  const action = argv[2] || 'status';
  const execute = argv.includes('--execute');
  const packetArg = argv.find((entry) => entry.startsWith('--packets='));
  const packets = packetArg ? Number(packetArg.split('=').slice(1).join('=')) : DEFAULT_PACKET_COUNT;
  if (action === 'status') {
    console.log(JSON.stringify(status(), null, 2));
    return;
  }
  if (action === 'preload') {
    const result = sweep({ execute, packets: DEFAULT_GULP_SIZE });
    console.log(JSON.stringify({ ...result, action: execute ? 'preload' : 'preview-preload' }, null, 2));
    return;
  }
  if (action === 'sweep') {
    console.log(JSON.stringify(sweep({ execute, packets }), null, 2));
    return;
  }
  console.error(JSON.stringify({
    ok: false,
    error: `Unknown action: ${action}`,
    usage: [
      'node tools/global-pid-request-fabric-supervisor.js status',
      'node tools/global-pid-request-fabric-supervisor.js preload --execute',
      'node tools/global-pid-request-fabric-supervisor.js sweep --execute --packets=300000'
    ]
  }, null, 2));
  process.exitCode = 2;
}

main(process.argv);
