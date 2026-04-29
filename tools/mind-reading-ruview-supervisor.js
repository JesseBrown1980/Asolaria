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
const downloadsRoot = path.join(process.env.USERPROFILE || process.env.HOME || path.dirname(repoRoot), 'Downloads');

const SUPERVISOR_ID = 'mind-reading-ruview-supervisor';
const EVENT_PREFIX = 'mind-reading-ruview-supervisor';

const MODE = Object.freeze({
  backend: 'local_filesystem_free_backend',
  cli: 'bare_node_cli',
  headless: true,
  shelllessRuntime: true,
  noServerAuth: true,
  noServerApiRoute: true,
  noExternalApiCalls: true,
  noInstallerExecution: true,
  noProcessLaunch: true,
  noCloudMutation: true,
  childProcessUse: false,
  secretMaterialWritten: false
});

const SUPERVISOR = Object.freeze({
  actor: SUPERVISOR_ID,
  profGlyph: 'PROF-MIND-RUVIEW-SUPERVISOR',
  supervisorPid: 'PID-H04-A01-W027000000-P027-RUVIEW',
  hilbertHotelRoom: 27,
  authority: 'observe_inventory_classify_only'
});

const PATHS = Object.freeze({
  state: rel('data/behcs/state/downloaded-software/mind-reading-ruview.state.json'),
  index: rel('data/behcs/index/mind-reading-ruview-supervisor.v1.json'),
  hermes: rel('data/behcs/hermes/downloaded-software/mind-reading-ruview-dispatch-latest.json'),
  shannon: rel('data/behcs/shannon/downloaded-software/mind-reading-ruview-consensus-latest.json'),
  cube: rel('data/behcs/cubes/mind-reading-ruview-supervisor.cube.js'),
  reportJson: rel('reports/mind-reading-ruview-supervisor-latest.json'),
  reportMd: rel('reports/mind-reading-ruview-supervisor-latest.md'),
  inbox: rel('data/behcs/inbox.ndjson'),
  outbox: rel('data/behcs/outbox.ndjson'),
  gnnEdges: rel('data/behcs/gnn-live-edges.ndjson'),
  agentShannonState: rel('data/behcs/state/agent-shannon-state.ndjson')
});

const NAME_PATTERNS = [
  { id: 'mind', regex: /mind/i, weight: 4 },
  { id: 'ruview', regex: /ru[\s._-]*view/i, weight: 9 },
  { id: 'remote_view', regex: /remote.*view|view.*remote/i, weight: 7 },
  { id: 'viewer', regex: /viewer|view/i, weight: 3 },
  { id: 'ru_token', regex: /(^|[^a-z])ru([^a-z]|$)|4ru/i, weight: 3 },
  { id: 'brain', regex: /brain|neural|eeg|read/i, weight: 4 }
];

const SAMPLE_BYTES = 4096;
const MAX_FULL_HASH_BYTES = 256 * 1024 * 1024;
const DOWNLOAD_EXECUTABLE_HINT = /(ru|4ru|view|viewer|remote|mind|brain|neural|eeg|read|zoom_cm)/i;

function rel(p) {
  return path.join(repoRoot, p);
}

function repoRel(p) {
  return path.relative(repoRoot, p).replace(/\\/g, '/');
}

function pathRef(p) {
  const resolved = path.resolve(p);
  const relToRepo = path.relative(repoRoot, resolved).replace(/\\/g, '/');
  if (relToRepo && !relToRepo.startsWith('..') && !path.isAbsolute(relToRepo)) return relToRepo;
  const home = process.env.USERPROFILE || process.env.HOME;
  if (home) {
    const relToHome = path.relative(path.resolve(home), resolved).replace(/\\/g, '/');
    if (relToHome && !relToHome.startsWith('..') && !path.isAbsolute(relToHome)) return `home:${relToHome}`;
  }
  return `external:${path.basename(resolved)}`;
}

function nowIso() {
  return new Date().toISOString();
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

function appendNdjson(filePath, data) {
  ensureDir(filePath);
  fs.appendFileSync(filePath, `${JSON.stringify(data)}\n`, 'utf8');
}

function sha256Buffer(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function sha256Text(input) {
  return crypto.createHash('sha256').update(String(input)).digest('hex');
}

function readSample(filePath, size) {
  const length = Math.min(size, SAMPLE_BYTES);
  const buffer = Buffer.alloc(length);
  const fd = fs.openSync(filePath, 'r');
  try {
    const bytesRead = fs.readSync(fd, buffer, 0, length, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    fs.closeSync(fd);
  }
}

function safeStat(filePath) {
  try {
    return fs.statSync(filePath);
  } catch (_) {
    return null;
  }
}

function extensionKind(name) {
  const ext = path.extname(name).toLowerCase();
  if (['.exe', '.msi', '.msix', '.appx', '.bat', '.cmd', '.ps1', '.vbs', '.js'].includes(ext)) return 'executable';
  if (['.zip', '.7z', '.rar', '.tgz', '.gz'].includes(ext)) return 'archive';
  if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'].includes(ext)) return 'image';
  if (['.pdf', '.docx', '.doc', '.txt', '.md', '.rtf'].includes(ext)) return 'document';
  return ext ? ext.slice(1) : 'unknown';
}

function scoreName(name) {
  const matches = [];
  let score = 0;
  for (const pattern of NAME_PATTERNS) {
    if (pattern.regex.test(name)) {
      matches.push(pattern.id);
      score += pattern.weight;
    }
  }
  return { score, matches };
}

function shouldIncludeDownloadCandidate(name, scoring, kind) {
  if (scoring.score > 0) return true;
  if (['executable', 'archive'].includes(kind) && DOWNLOAD_EXECUTABLE_HINT.test(name)) return true;
  return false;
}

function readZoneIdentifier(filePath) {
  try {
    const raw = fs.readFileSync(`${filePath}:Zone.Identifier`, 'utf8');
    return raw.split(/\r?\n/).filter(Boolean).slice(0, 20);
  } catch (_) {
    return [];
  }
}

function inspectFile(filePath, name) {
  const stat = safeStat(filePath);
  if (!stat || !stat.isFile()) return null;

  const kind = extensionKind(name);
  const scoring = scoreName(name);
  const sample = readSample(filePath, stat.size);
  const fullHash = scoring.score > 0 && stat.size <= MAX_FULL_HASH_BYTES
    ? sha256Buffer(fs.readFileSync(filePath))
    : null;
  const mz = sample.length >= 2 && sample[0] === 0x4d && sample[1] === 0x5a;
  const zip = sample.length >= 2 && sample[0] === 0x50 && sample[1] === 0x4b;
  const png = sample.length >= 8 && sample.slice(0, 8).toString('hex') === '89504e470d0a1a0a';
  const zone = readZoneIdentifier(filePath);

  const riskReasons = [];
  if (kind === 'executable') riskReasons.push('downloaded_executable');
  if (mz) riskReasons.push('pe_mz_header');
  if (scoring.matches.includes('mind')) riskReasons.push('mind_claim_surface');
  if (scoring.matches.includes('ruview') || scoring.matches.includes('ru_token') || scoring.matches.includes('remote_view')) riskReasons.push('ru_or_remote_view_surface');
  if (zone.length) riskReasons.push('download_zone_identifier_present');

  return {
    name,
    pathRef: pathRef(filePath),
    relativePath: path.relative(downloadsRoot, filePath).replace(/\\/g, '/'),
    size: stat.size,
    modifiedAt: stat.mtime.toISOString(),
    kind,
    score: scoring.score,
    matchedPatterns: scoring.matches,
    sha256: fullHash,
    sampleSha256: sha256Buffer(sample),
    signatures: {
      mz,
      zip,
      png
    },
    zoneIdentifier: zone,
    riskReasons,
    launchPolicy: kind === 'executable' || kind === 'archive'
      ? 'FAIL_CLOSED_NO_EXECUTION'
      : 'OBSERVE_ONLY'
  };
}

function walkDownloads(root, maxEntries = 3000) {
  const out = [];
  const queue = [root];
  while (queue.length && out.length < maxEntries) {
    const dir = queue.shift();
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (_) {
      continue;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const scoring = scoreName(entry.name);
        if (scoring.score > 0 || full === root) queue.push(full);
        continue;
      }
      if (!entry.isFile()) continue;
      const scoring = scoreName(entry.name);
      const kind = extensionKind(entry.name);
      if (shouldIncludeDownloadCandidate(entry.name, scoring, kind)) {
        out.push({ full, name: entry.name, scoring, kind });
      }
    }
  }
  return out;
}

function discoverCandidates() {
  const entries = walkDownloads(downloadsRoot);
  const inspected = entries
    .map((entry) => inspectFile(entry.full, entry.name))
    .filter(Boolean)
    .map((item) => {
      let priority = item.score;
      if (item.kind === 'executable') priority += 6;
      if (item.name.toLowerCase().includes('zoom_cm') && item.name.toLowerCase().includes('4ru')) priority += 4;
      if (item.name.toLowerCase().includes('notebooklm mind map')) priority += 2;
      return { ...item, priority };
    })
    .sort((a, b) => b.priority - a.priority || b.modifiedAt.localeCompare(a.modifiedAt));

  return inspected.slice(0, 40);
}

function buildChecks(candidates) {
  const targetCandidates = candidates.filter((candidate) => candidate.score > 0);
  const executableCandidates = targetCandidates.filter((candidate) => candidate.kind === 'executable');
  const exactRuview = targetCandidates.filter((candidate) => candidate.matchedPatterns.includes('ruview'));
  const mindSurfaces = targetCandidates.filter((candidate) => candidate.matchedPatterns.includes('mind'));
  const suspiciousExecutable = executableCandidates.filter((candidate) =>
    candidate.matchedPatterns.includes('ru_token')
    || candidate.matchedPatterns.includes('remote_view')
    || candidate.matchedPatterns.includes('ruview')
    || candidate.name.toLowerCase().includes('4ru')
  );

  return [
    check('downloads_root_exists', fs.existsSync(downloadsRoot), pathRef(downloadsRoot)),
    check('candidate_surfaces_found', targetCandidates.length > 0, `${targetCandidates.length} matching candidate(s)`),
    check('exact_ruview_filename_found', exactRuview.length > 0, `${exactRuview.length} exact ruview-style match(es)`, 'soft'),
    check('mind_surfaces_found', mindSurfaces.length > 0, `${mindSurfaces.length} mind-surface match(es)`, 'soft'),
    check('downloaded_executable_present', executableCandidates.length === 0, `${executableCandidates.length} matching executable candidate(s)`, executableCandidates.length ? 'hard' : 'soft'),
    check('suspicious_ru_executable_present', suspiciousExecutable.length === 0, `${suspiciousExecutable.length} RU/remote executable candidate(s)`, suspiciousExecutable.length ? 'hard' : 'soft')
  ];
}

function check(id, ok, detail = '', severity = 'hard') {
  return { id, ok: Boolean(ok), detail: String(detail || ''), severity };
}

function classify(checks) {
  const hardFailures = checks.filter((entry) => !entry.ok && entry.severity !== 'soft');
  const softFailures = checks.filter((entry) => !entry.ok && entry.severity === 'soft');
  if (hardFailures.length) return { status: 'FAIL_CLOSED', hardFailures, softFailures };
  if (softFailures.length) return { status: 'PASS_WITH_RESIDUAL_OPEN', hardFailures, softFailures };
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

function buildShannon(candidates, classification, generatedAt) {
  const executableCount = candidates.filter((candidate) => candidate.kind === 'executable' && candidate.score > 0).length;
  const votes = shannonParts().map((part) => {
    const name = part.name || part.id || String(part);
    const vote = classification.hardFailures.length ? voteValue('HALT') : voteValue('NEEDS_CHANGE');
    let reason = `${candidates.length} candidate artifact(s) inventoried locally.`;
    if (name === 'scout') reason = 'Download surfaces were discovered without launching anything.';
    if (name === 'evidence') reason = 'Hashes, headers, file kinds, timestamps, and zone identifiers were recorded locally.';
    if (name === 'executor') reason = executableCount ? 'Executable candidate exists; execution remains fail-closed.' : 'No matching executable found.';
    if (name === 'fabric') reason = 'Artifact is integrated as BEHCS state, Hermes dispatch, Shannon verdict, report, and cube.';
    if (name === 'voice') reason = 'Mind-reading capability is treated as an unverified claim, not accepted as fact.';
    if (name === 'planner') reason = 'Next step is operator-approved sandbox/static analysis, not launch.';
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

  return {
    integrationId: 'mind-reading-ruview-shannon-consensus',
    generatedAt,
    status: classification.hardFailures.length ? 'consensus_halt_fail_closed' : 'consensus_needs_change_observe_only',
    consensus: classification.hardFailures.length ? 'HALT' : 'NEEDS-CHANGE',
    capabilityDisposition: 'mind_reading_claim_unverified',
    executionDisposition: 'no_launch_no_installer_no_background_process',
    votes,
    hardFailures: classification.hardFailures.map((entry) => entry.id),
    softFailures: classification.softFailures.map((entry) => entry.id)
  };
}

function buildHermes(candidates, classification, shannonPacket, generatedAt) {
  return {
    integrationId: 'mind-reading-ruview-hermes-dispatch',
    generatedAt,
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
      'HERMES_LOCAL_ARTIFACT_DISPATCH',
      'SHANNON_CLASSIC_6',
      'BEHCS_OUTBOX',
      'GNN_LIVE_EDGES'
    ],
    packet: {
      verb: 'EVT-HERMES-MIND-RUVIEW-DISPATCH',
      glyphSentence: `EVT-HERMES-MIND-RUVIEW-DISPATCH · status=${classification.status} · shannon=${shannonPacket.consensus} · exec=fail_closed @ M-EYEWITNESS .`,
      summary: 'Mind/RU-view downloaded software candidate integrated as observe-only local artifact supervisor.',
      candidateCount: candidates.length,
      topCandidates: candidates.slice(0, 5).map((candidate) => ({
        name: candidate.name,
        kind: candidate.kind,
        launchPolicy: candidate.launchPolicy,
        sha256: candidate.sha256
      }))
    }
  };
}

function buildState(candidates, checks, classification, hermesPacket, shannonPacket, generatedAt) {
  return {
    savedAt: generatedAt,
    supervisor: SUPERVISOR,
    status: classification.status,
    mode: MODE,
    downloadsRootRef: pathRef(downloadsRoot),
    claimPolicy: {
      mindReadingCapability: 'UNVERIFIED_CLAIM',
      execution: 'FAIL_CLOSED_NO_LAUNCH',
      integration: 'LOCAL_OBSERVE_ONLY'
    },
    checks,
    hardFailures: classification.hardFailures,
    softFailures: classification.softFailures,
    candidates,
    hermesPacket: repoRel(PATHS.hermes),
    shannonPacket: repoRel(PATHS.shannon)
  };
}

function buildIndex(state, generatedAt) {
  return {
    indexId: 'mind-reading-ruview-supervisor.v1',
    generatedAt,
    status: state.status,
    mode: MODE,
    supervisor: SUPERVISOR,
    downloadsRootRef: pathRef(downloadsRoot),
    surfaces: {
      state: repoRel(PATHS.state),
      hermes: repoRel(PATHS.hermes),
      shannon: repoRel(PATHS.shannon),
      cube: repoRel(PATHS.cube),
      reportJson: repoRel(PATHS.reportJson),
      reportMd: repoRel(PATHS.reportMd)
    },
    topCandidates: state.candidates.slice(0, 10).map((candidate) => ({
      name: candidate.name,
      kind: candidate.kind,
      priority: candidate.priority,
      launchPolicy: candidate.launchPolicy,
      sha256: candidate.sha256,
      riskReasons: candidate.riskReasons
    }))
  };
}

function buildCube(state, shannonPacket, generatedAt) {
  const cube = {
    id: 'mind-reading-ruview-supervisor',
    generatedAt,
    primaryCatalog: { D: 47, name: 'BOUNDARY', prime: 211 },
    touches: [6, 11, 20, 35, 37, 38, 39, 42, 46, 47],
    gates: ['supervisor', 'hermes', 'shannon', 'sentinel_kr'],
    waves: ['download_inventory', 'artifact_hash', 'fail_closed_execution', 'gnn_edge'],
    payload: {
      kind: 'downloaded-software-supervisor',
      mode: MODE,
      supervisor: SUPERVISOR,
      status: state.status,
      candidateCount: state.candidates.length,
      shannon: {
        status: shannonPacket.status,
        consensus: shannonPacket.consensus,
        executionDisposition: shannonPacket.executionDisposition
      },
      topCandidates: state.candidates.slice(0, 5).map((candidate) => ({
        name: candidate.name,
        kind: candidate.kind,
        launchPolicy: candidate.launchPolicy,
        sha256: candidate.sha256
      }))
    },
    translate: {
      human: 'Downloaded mind/RU-view candidates are inventoried and integrated as observe-only artifacts; executable launch is fail-closed.',
      agent: '(asolaria, downloaded_software, mind_ruview, observe_only, no_launch, no_external_api, no_secret_material)',
      device: 'node tools/mind-reading-ruview-supervisor.js tick --execute'
    }
  };
  return `// cube: mind-reading-ruview-supervisor | downloaded software | D47 BOUNDARY
// gates: supervisor, hermes, shannon, sentinel_kr | waves: inventory, hash, classify | kind: observe-only
export const CUBE = ${JSON.stringify(cube, null, 2)}
`;
}

function buildReport(state, hermesPacket, shannonPacket, generatedAt) {
  const rows = state.candidates.slice(0, 12).map((candidate) =>
    `| ${candidate.name} | ${candidate.kind} | ${candidate.launchPolicy} | ${candidate.sha256 || candidate.sampleSha256} | ${candidate.riskReasons.join(', ') || 'none'} |`
  ).join('\n');
  const checkRows = state.checks.map((entry) =>
    `| ${entry.id} | ${entry.ok ? 'PASS' : 'FAIL'} | ${entry.severity} | ${entry.detail} |`
  ).join('\n');
  const voteRows = shannonPacket.votes.map((vote) =>
    `| ${vote.part} | ${vote.vote} | ${vote.types.join(', ')} | ${vote.reason} |`
  ).join('\n');

  const json = {
    reportId: 'mind-reading-ruview-supervisor-latest',
    generatedAt,
    status: state.status,
    mode: MODE,
    supervisor: SUPERVISOR,
    claimPolicy: state.claimPolicy,
    state: repoRel(PATHS.state),
    hermes: hermesPacket,
    shannon: shannonPacket,
    candidateCount: state.candidates.length,
    candidates: state.candidates
  };

  const md = `# Mind / RU-View Download Supervisor

Generated: ${generatedAt}

Status: ${state.status}

This integration is local-only and shellless-runtime: no launch, no installer execution, no background process, no server route, no external API call, and no secret material.

Capability policy: \`mind_reading_claim_unverified\`. Treat any "mind reading" wording as a claim, not a proven capability.

## Candidates

| Name | Kind | Launch Policy | Hash | Risk Reasons |
| --- | --- | --- | --- | --- |
${rows || '| none | none | none | none | none |'}

## Checks

| Check | Result | Severity | Detail |
| --- | --- | --- | --- |
${checkRows}

## Shannon

- Consensus: ${shannonPacket.consensus}
- Execution: ${shannonPacket.executionDisposition}

| Part | Vote | Types | Reason |
| --- | --- | --- | --- |
${voteRows}
`;

  return { json, md };
}

function buildEvents(state, hermesPacket, shannonPacket, generatedAt) {
  const id = `${EVENT_PREFIX}-${Date.now()}`;
  const body = {
    status: state.status,
    candidateCount: state.candidates.length,
    topCandidates: state.candidates.slice(0, 5).map((candidate) => ({
      name: candidate.name,
      kind: candidate.kind,
      launchPolicy: candidate.launchPolicy,
      sha256: candidate.sha256
    })),
    state: repoRel(PATHS.state),
    hermes: repoRel(PATHS.hermes),
    shannon: repoRel(PATHS.shannon),
    mode: MODE
  };

  return {
    inbox: {
      id,
      from: 'asolaria',
      to: 'federation',
      mode: 'real',
      actor: SUPERVISOR.actor,
      target: 'downloads:mind-ruview',
      ts: generatedAt,
      verb: 'EVT-MIND-RUVIEW-SUPERVISOR-TICK',
      supervisor_pid: SUPERVISOR.supervisorPid,
      prof_glyph: SUPERVISOR.profGlyph,
      hilbert_hotel_room: SUPERVISOR.hilbertHotelRoom,
      payload: `Mind/RU-view supervisor tick status=${state.status} shannon=${shannonPacket.consensus}`,
      body,
      glyph_sentence: `EVT-MIND-RUVIEW-SUPERVISOR-TICK · status=${state.status} · exec=fail_closed · shannon=${shannonPacket.consensus} @ M-EYEWITNESS .`
    },
    outbox: {
      id: `${id}-hermes`,
      ts: generatedAt,
      from: 'hermes',
      to: 'downloads:mind-ruview',
      mode: 'real',
      type: 'message',
      verb: hermesPacket.packet.verb,
      payload: hermesPacket.packet.summary,
      body: hermesPacket,
      cube: {
        D1_ACTOR: 'hermes',
        D3_TARGET: 'downloads_mind_ruview',
        D6_GATE: 'shannon',
        D7_STATE: 'blocked',
        D20_TIME: generatedAt,
        D35_MEMORY: 'downloaded_software_mind_ruview',
        D37_AUTHORITY: 'observe_inventory_classify_only',
        D38_ENCRYPTION: 'no_secret_material',
        D47_BOUNDARY: 'no_launch_fail_closed'
      },
      hash: sha256Text(`${id}:hermes`).slice(0, 16),
      glyph_sentence: hermesPacket.packet.glyphSentence
    },
    edge: {
      id: `${id}-edge`,
      from: 'downloaded_software_supervisor',
      to: 'mind_ruview_candidates',
      verb: 'inventoried_fail_closed',
      weight: state.status === 'FAIL_CLOSED' ? 0 : 1,
      ts: generatedAt,
      wh: {
        who: { from: 'asolaria', agent: SUPERVISOR.actor },
        what: 'Downloaded mind/RU-view candidate inventory and fail-closed integration',
        where: {
          repo: repoRel(repoRoot),
          downloadsRootRef: pathRef(downloadsRoot),
          transport: 'local_filesystem'
        },
        when: generatedAt,
        how: 'bare_node_cli_inventory_hash_classify',
        why: 'operator requested supervisor integration for downloaded software'
      }
    },
    shannonState: {
      seq: Date.now(),
      timestamp: generatedAt,
      intent: 'downloaded_software_supervisor',
      verb: 'mind_ruview.consensus',
      target: 'downloads:mind-ruview',
      scope: 'local_filesystem',
      proof: repoRel(PATHS.shannon),
      event: shannonPacket.consensus,
      status: shannonPacket.status,
      executionDisposition: shannonPacket.executionDisposition
    }
  };
}

function tick({ execute = false } = {}) {
  const generatedAt = nowIso();
  const candidates = discoverCandidates();
  const checks = buildChecks(candidates);
  const classification = classify(checks);
  const shannonPacket = buildShannon(candidates, classification, generatedAt);
  const hermesPacket = buildHermes(candidates, classification, shannonPacket, generatedAt);
  const state = buildState(candidates, checks, classification, hermesPacket, shannonPacket, generatedAt);
  const index = buildIndex(state, generatedAt);
  const cube = buildCube(state, shannonPacket, generatedAt);
  const report = buildReport(state, hermesPacket, shannonPacket, generatedAt);
  const events = buildEvents(state, hermesPacket, shannonPacket, generatedAt);

  if (execute) {
    writeJson(PATHS.state, state);
    writeJson(PATHS.index, index);
    writeJson(PATHS.hermes, hermesPacket);
    writeJson(PATHS.shannon, shannonPacket);
    writeText(PATHS.cube, cube);
    writeJson(PATHS.reportJson, report.json);
    writeText(PATHS.reportMd, report.md);
    appendNdjson(PATHS.inbox, events.inbox);
    appendNdjson(PATHS.outbox, events.outbox);
    appendNdjson(PATHS.gnnEdges, events.edge);
    appendNdjson(PATHS.agentShannonState, events.shannonState);
  }

  return {
    ok: classification.hardFailures.length === 0,
    action: execute ? 'tick' : 'preview',
    generatedAt,
    status: classification.status,
    candidateCount: candidates.length,
    topCandidates: candidates.slice(0, 8).map((candidate) => ({
      name: candidate.name,
      kind: candidate.kind,
      launchPolicy: candidate.launchPolicy,
      priority: candidate.priority,
      riskReasons: candidate.riskReasons,
      sha256: candidate.sha256
    })),
    hardFailures: classification.hardFailures.map((entry) => entry.id),
    softFailures: classification.softFailures.map((entry) => entry.id),
    shannon: {
      status: shannonPacket.status,
      consensus: shannonPacket.consensus
    },
    outputs: {
      state: repoRel(PATHS.state),
      index: repoRel(PATHS.index),
      hermes: repoRel(PATHS.hermes),
      shannon: repoRel(PATHS.shannon),
      cube: repoRel(PATHS.cube),
      reportJson: repoRel(PATHS.reportJson),
      reportMd: repoRel(PATHS.reportMd)
    },
    mode: MODE
  };
}

function status() {
  const preview = tick({ execute: false });
  return {
    ...preview,
    action: 'status',
    existing: {
      state: fs.existsSync(PATHS.state),
      index: fs.existsSync(PATHS.index),
      hermes: fs.existsSync(PATHS.hermes),
      shannon: fs.existsSync(PATHS.shannon),
      cube: fs.existsSync(PATHS.cube),
      reportJson: fs.existsSync(PATHS.reportJson),
      reportMd: fs.existsSync(PATHS.reportMd)
    }
  };
}

function main(argv) {
  const action = argv[2] || 'status';
  const execute = argv.includes('--execute');
  if (action === 'status') {
    console.log(JSON.stringify(status(), null, 2));
    return;
  }
  if (action === 'tick') {
    console.log(JSON.stringify(tick({ execute }), null, 2));
    return;
  }
  console.error(JSON.stringify({
    ok: false,
    error: `Unknown action: ${action}`,
    usage: [
      'node tools/mind-reading-ruview-supervisor.js status',
      'node tools/mind-reading-ruview-supervisor.js tick --execute'
    ]
  }, null, 2));
  process.exitCode = 2;
}

main(process.argv);
