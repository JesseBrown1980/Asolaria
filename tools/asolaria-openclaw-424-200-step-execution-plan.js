#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const behcs = require('./behcs/codex-bridge');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_RUN = 'openclaw-v2026-4-24-ingestion-20260426';
const RUN_ID = 'openclaw-424-200-step-execution-20260426';
const RUN_ROOT = rel(`data/behcs/orchestration/${RUN_ID}`);
const WAVE_SHAPE = '20 phase candidates x 10 steps x 6x6x6x6x6x12 x omnishannon x GNN';
const LETTERED_GLYPHS = 246;
const GLYPH_SLOTS = 256;

const SOURCE_PATHS = Object.freeze({
  aggregate: rel(`data/behcs/orchestration/${SOURCE_RUN}/openclaw-v2026-4-24-ingestion-aggregate-latest.json`),
  diffIndex: rel(`data/behcs/orchestration/${SOURCE_RUN}/openclaw-v2026-4-23-to-v2026-4-24-diff-index.v1.json`),
  modelCard: rel(`data/behcs/orchestration/${SOURCE_RUN}/model-cards/openclaw-v2026-4-24-ingestion.model-card.v1.json`),
  report: rel('reports/openclaw-v2026-4-24-ingestion-latest.md')
});

const PATHS = Object.freeze({
  runRoot: RUN_ROOT,
  manifestsDir: path.join(RUN_ROOT, 'manifests'),
  plan: path.join(RUN_ROOT, 'openclaw-424-200-step-plan.v1.json'),
  tasksNdjson: path.join(RUN_ROOT, 'openclaw-424-200-step-tasks.v1.ndjson'),
  implementationQueue: path.join(RUN_ROOT, 'openclaw-424-implementation-queue.v1.ndjson'),
  phaseInventory: path.join(RUN_ROOT, 'openclaw-424-phase-inventory.v1.json'),
  modelCard: path.join(RUN_ROOT, 'model-cards', 'openclaw-424-200-step-execution.model-card.v1.json'),
  supervisorQueue: path.join(RUN_ROOT, 'supervisor-queue.ndjson'),
  supervisorReportJson: path.join(RUN_ROOT, 'supervisor-runner-latest.json'),
  aggregate: path.join(RUN_ROOT, 'openclaw-424-200-step-execution-aggregate-latest.json'),
  memory: rel('data/behcs/memory/openclaw-424-200-step-execution.v1.json'),
  index: rel('data/behcs/index/openclaw-424-200-step-execution-index.v1.json'),
  map: rel('data/behcs/maps/asolaria/openclaw-424-200-step-execution-map-map-mapped.v1.json'),
  cube: rel('data/behcs/cubes/openclaw-424-200-step-execution-cube-cubed.cube.js'),
  glpj: rel('data/behcs/codex/glyph-language/openclaw-424-200-step-execution-behcs256.glpj.json'),
  reportJson: rel('reports/openclaw-424-200-step-execution-latest.json'),
  reportMd: rel('reports/openclaw-424-200-step-execution-latest.md'),
  globalInbox: rel('data/behcs/inbox.ndjson'),
  gnnEdges: rel('data/behcs/gnn-live-edges.ndjson')
});

const PHASES = [
  {
    id: 'p01-release-freeze-proof-intake',
    title: 'Release Freeze And Proof Intake',
    owner: 'sentinel',
    lane: 'proof',
    cube: 29791,
    target: 'freeze OpenClaw 4.24 evidence before implementation',
    steps: [
      'Seal cloned tag, commit hash, changelog extract, and diff index as immutable intake proof.',
      'Record the OpenClaw 4.24 release source, local clone path, and base comparison tag.',
      'Attach the source model card and ingestion aggregate to the execution plan.',
      'Verify every later task references a local proof artifact instead of memory-only claims.',
      'Create failure notes for missing evidence, stale clone state, or dirty upstream worktree.',
      'Classify the 2,376 changed files into owned Asolaria intake categories.',
      'Tag the strongest and weakest dimensions from the previous cascade vote.',
      'Route proof packets to Hermes, Shannon, Hookwall, GNN, GC, and white-room review.',
      'Block implementation if any phase lacks diff, changelog, or model-card traceability.',
      'Emit the release-freeze checkpoint into memory, index, map, cube, and GLPJ.'
    ]
  },
  {
    id: 'p02-diff-taxonomy-file-ownership',
    title: 'Diff Taxonomy And File Ownership',
    owner: 'rook',
    lane: 'discovery',
    cube: 68921,
    target: 'turn the OpenClaw diff into owned Asolaria work lanes',
    steps: [
      'Sort changed files by test, source, extension, docs, gateway, plugin, browser, Codex, voice, and memory lanes.',
      'Map each OpenClaw category to an Asolaria directory, connector, service, or report surface.',
      'Identify lanes that need code changes versus documentation, tests, or policy-only updates.',
      'Create task-owner hints for helm, gaia, vector, rook, forge, falcon, sentinel, and dasein.',
      'Mark files with security implications for reverse-gain review before implementation.',
      'Mark runtime lifecycle changes for synthetic-first CI before live activation.',
      'Mark provider and model catalog changes for auth-boundary review.',
      'Mark meeting, browser, and voice changes for operator-consent and device-scope review.',
      'Create a no-remote-mutation boundary for comparison-only tasks.',
      'Emit an ownership table usable by the later implementation batches.'
    ]
  },
  {
    id: 'p03-hermes-shannon-supervisor-binding',
    title: 'Hermes Shannon Supervisor Binding',
    owner: 'hermes',
    lane: 'supervisor',
    cube: 5929741,
    target: 'bind the plan to the authority layer',
    steps: [
      'Create one supervisor packet for each of the 20 execution phases.',
      'Require model-card, source-diff, and acceptance-gate evidence for every packet.',
      'Load Hermes as supervisor-of-supervisors for phase awareness.',
      'Run Shannon consensus over phase readiness and evidence coverage.',
      'Expose worker-ready packets without spawning workers.',
      'Record hard blocks, evidence requests, and conditional proceeds per phase.',
      'Route blocked phases to white-room contradiction notes instead of execution.',
      'Make the supervisor run itself an artifact in map-map-mapped routes.',
      'Require reverse-gain review before code edits for provider, gateway, and auth surfaces.',
      'Emit supervisor awareness into the final cube and report.'
    ]
  },
  {
    id: 'p04-behcs256-glyph-language-update',
    title: 'BEHCS256 Glyph Language Update',
    owner: 'vector',
    lane: 'language',
    cube: 24389,
    target: 'encode the OpenClaw intake in the local glyph language',
    steps: [
      'Mint phase glyphs using the 246 lettered glyph discipline inside 256 available slots.',
      'Map release, diff, phase, owner, risk, proof, and implementation queue into GLPJ facts.',
      'Define glyphs for realtime voice, meeting participant, browser coordinates, MCP cleanup, and Codex harness parity.',
      'Add glyphs for gateway pairing, diagnostics, model catalogs, and tool-result pruning.',
      'Bind every glyph to a source artifact path and phase id.',
      'Prevent glyph mints from claiming live provider sessions or unbounded workers.',
      'Route glyphs through the map and cube so supervisors can reference them.',
      'Add language-level weak-dimension notes for federation, device, and twin-sync.',
      'Generate a compact index key set for search and later recovery.',
      'Seal GLPJ status after cascade votes are absorbed.'
    ]
  },
  {
    id: 'p05-model-catalog-manifest-alignment',
    title: 'Model Catalog Manifest Alignment',
    owner: 'selector',
    lane: 'models',
    cube: 226981,
    target: 'bring OpenClaw model catalog ideas into Asolaria safely',
    steps: [
      'Study OpenClaw static model catalogs and manifest-backed model rows.',
      'Inventory Asolaria provider and worker-router model listing surfaces.',
      'Define a manifest-owned model row contract for Asolaria without loading provider runtime.',
      'Add duplicate provider/model conflict detection to the design queue.',
      'Map DeepSeek V4 Flash and V4 Pro as catalog entries, not auto-enabled credentials.',
      'Preserve existing authenticated provider flows and avoid mixed auth assumptions.',
      'Design a startup-fast read-only model list path.',
      'Add stale-model suppression and recovery hints to future implementation tasks.',
      'Create tests for model catalog parsing, conflicts, and fallback rows.',
      'Gate catalog activation behind connector health and provider auth evidence.'
    ]
  },
  {
    id: 'p06-provider-runtime-auth-boundaries',
    title: 'Provider Runtime Auth Boundaries',
    owner: 'sentinel',
    lane: 'auth',
    cube: 3581577,
    target: 'prevent provider confusion while integrating new runtime ideas',
    steps: [
      'Compare OpenClaw provider-owned auth seams to Asolaria connector boundaries.',
      'Separate CLI-auth, OAuth, API-key, device-pairing, and local-model routes.',
      'Document which provider flows require explicit existing credentials.',
      'Block any task that attempts auth, payment, or rate-limit bypass.',
      'Add provider endpoint normalization requirements for future implementation.',
      'Add transport/header shaping requirements without removing required provider auth.',
      'Add local-only fallback policy for unauthenticated development surfaces.',
      'Map Gemini, OpenAI, Claude, OpenCode, DeepSeek, and local equivalent surfaces by legitimate path.',
      'Require redacted logging for provider errors, billing failures, and rate limits.',
      'Send provider-bound changes through reverse-gain review before code edits.'
    ]
  },
  {
    id: 'p07-codex-harness-parity',
    title: 'Codex Harness Parity',
    owner: 'brain',
    lane: 'codex',
    cube: 3307949,
    target: 'use OpenClaw Codex harness lessons to harden Asolaria worker routing',
    steps: [
      'Map OpenClaw Codex context-engine bootstrap and compaction lifecycle to Asolaria brain orchestration.',
      'Identify where Asolaria preserves native Codex thread state and audit trails.',
      'Design bounded tool-hook relay payloads for Codex-style runtimes.',
      'Add approval-spam protection requirements for any future hook bridge.',
      'Define result classification so Codex runtimes can participate in fallback policy.',
      'Preserve prompt lifecycle ownership when an agent owns its own context injection.',
      'Add tests for app-server style command approval amendments.',
      'Add tests for follow-up routing back to originating chat.',
      'Create a no-secret-copy rule for Codex auth paths.',
      'Queue implementation only after harness parity tests exist.'
    ]
  },
  {
    id: 'p08-plugin-sdk-tool-result-middleware',
    title: 'Plugin SDK Tool Result Middleware',
    owner: 'forge',
    lane: 'plugins',
    cube: 4826809,
    target: 'adopt plugin-owned extension seams without core special casing',
    steps: [
      'Study OpenClaw tool-result middleware and plugin manifest contracts.',
      'Map Asolaria skill, connector, and gateway tool boundaries.',
      'Design plugin-owned transforms for tool results with explicit harness targeting.',
      'Add schema checks for malformed text blocks and undefined tool outputs.',
      'Prevent transforms from bypassing approval, owner-only, or loopback-only gates.',
      'Add plugin source metadata fields for install provenance and integrity expectations.',
      'Design descriptor-only setup for plugins that do not require runtime loading.',
      'Warn on descriptor/runtime drift without breaking existing plugins.',
      'Create synthetic plugin fixtures for transform tests.',
      'Queue plugin implementation after security and compatibility review.'
    ]
  },
  {
    id: 'p09-browser-coordinate-control',
    title: 'Browser Coordinate Control',
    owner: 'falcon',
    lane: 'browser',
    cube: 103823,
    target: 'upgrade browser automation with coordinate and tab recovery discipline',
    steps: [
      'Compare OpenClaw coordinate-click flow with Asolaria browser and desktop connectors.',
      'Define coordinate-click API shape with viewport, screenshot, and target evidence.',
      'Require LOOK before click and LOOK after click for every coordinate action.',
      'Add longer action-budget configuration for healthy browser waits.',
      'Add per-profile headless override design without global headless drift.',
      'Add tab reuse and already-open tab recovery requirements.',
      'Reject browser control tasks that lack operator-visible proof.',
      'Create Playwright smoke tests for coordinate and aria-ref stability.',
      'Record browser security authority required for host/browser-node control.',
      'Queue implementation behind synthetic browser fixture runs.'
    ]
  },
  {
    id: 'p10-realtime-voice-meeting-lanes',
    title: 'Realtime Voice And Meeting Lanes',
    owner: 'gaia',
    lane: 'voice_meet',
    cube: 493039,
    target: 'translate OpenClaw voice and Meet capabilities into bounded Asolaria lanes',
    steps: [
      'Study Google Meet bundled participant plugin shape from OpenClaw 4.24.',
      'Map meeting join, attendance, artifact export, and tab recovery to Asolaria connector concepts.',
      'Design voice-call consult handoff to the full agent without bypassing auth.',
      'Define Gemini Live and other realtime providers as legitimate provider-backed lanes only.',
      'Add dry-run smoke requirements before live calls or meeting joins.',
      'Require owner consent and explicit meeting URL scope before any live join.',
      'Design audio artifact storage with redacted metadata and local proof hashes.',
      'Add recovery flow for already-open meeting tabs.',
      'Create synthetic voice/meeting fixtures before live integration.',
      'Queue implementation after consent, provider, and device gates pass.'
    ]
  },
  {
    id: 'p11-mcp-lifecycle-cleanup',
    title: 'MCP Lifecycle Cleanup',
    owner: 'dasein',
    lane: 'mcp',
    cube: 7189057,
    target: 'stop MCP child runtime leaks and add lifecycle proof',
    steps: [
      'Compare OpenClaw one-shot MCP retirement and idle eviction with Asolaria MCP usage.',
      'Inventory Asolaria gateway, tools, and MCP server child process surfaces.',
      'Design session idle TTL for bundled and external MCP runtimes.',
      'Dispose cached runtimes on config reload and gateway shutdown.',
      'Skip startup when runtime tool allowlists cannot reach required tools.',
      'Add process-count diagnostics before and after one-shot runs.',
      'Add cleanup tests for successful, failed, and interrupted runs.',
      'Record child-process lifecycle events without exposing command secrets.',
      'Route MCP cleanup through connector health matrix.',
      'Queue implementation after synthetic process fixtures pass.'
    ]
  },
  {
    id: 'p12-session-compaction-transcript-hygiene',
    title: 'Session Compaction And Transcript Hygiene',
    owner: 'helm',
    lane: 'sessions',
    cube: 6859,
    target: 'upgrade session rollover and transcript handling',
    steps: [
      'Study OpenClaw session rollover, fork, and compaction fixes.',
      'Inventory Asolaria memory, job, and transcript storage surfaces.',
      'Keep runtime-only prompt context out of visible transcript history.',
      'Preserve auditability for compaction and restore operations.',
      'Close or mark stale browser/session child links on rollover.',
      'Add parent token count fallback when cached totals are stale.',
      'Keep optimistic chat tail messages stable during refreshes.',
      'Reject UI clients from compaction-side mutations unless explicitly allowed.',
      'Create tests for forked context, stale child links, and transcript history scrub.',
      'Queue implementation after data migration backup exists.'
    ]
  },
  {
    id: 'p13-gateway-pairing-node-security',
    title: 'Gateway Pairing And Node Security',
    owner: 'sentinel',
    lane: 'gateway',
    cube: 571787,
    target: 'harden node pairing and gateway control surfaces',
    steps: [
      'Compare OpenClaw gateway node pairing and auto-approve CIDR controls to Asolaria gateway.',
      'Keep first-time node pairing manual unless explicit trusted CIDR policy exists.',
      'Require private-IP or loopback rules for cleartext pairing.',
      'Fail closed on config apply and patch paths outside narrow allowlists.',
      'Protect loopback-only config mutations and secret reveal surfaces.',
      'Redact tokenized UI URLs and SSH hints from logs.',
      'Re-resolve SecretRef route secrets on every webhook request.',
      'Restart secret-backed channels safely during secrets reload.',
      'Create gateway security smoke tests for pairing and config mutation.',
      'Queue implementation only after rollback path is documented.'
    ]
  },
  {
    id: 'p14-memory-hybrid-search-indexer',
    title: 'Memory Hybrid Search And Indexer',
    owner: 'rook',
    lane: 'memory',
    cube: 205379,
    target: 'upgrade memory search, indexing, and canonical memory handling',
    steps: [
      'Study OpenClaw raw vectorScore/textScore hybrid memory output.',
      'Inventory Asolaria memoryStore, semanticKnowledgeStore, workspaceKnowledgeStore, and memory-indexer.',
      'Add score provenance fields to future memory search results.',
      'Keep temporal decay and MMR effects explainable after raw scores.',
      'Avoid optional native embedding dependencies unless explicitly installed.',
      'Repair split-brain memory files into canonical memory paths with backups.',
      'Add memory doctor checks for stale managed collections.',
      'Index OpenClaw 4.24 intake keys into Asolaria semantic memory.',
      'Create tests for score fields, stale collection repair, and memory path canonicalization.',
      'Queue implementation after memory backup artifact exists.'
    ]
  },
  {
    id: 'p15-diagnostics-otel-trace-context',
    title: 'Diagnostics OTEL And Trace Context',
    owner: 'forge',
    lane: 'diagnostics',
    cube: 1295029,
    target: 'add payload-safe diagnostics and trace context',
    steps: [
      'Study OpenClaw diagnostic lifecycle events and OTEL trace context.',
      'Inventory Asolaria audit logs, gateway diagnostics, and graph runtime state.',
      'Define payload-free run, model-call, tool-execution, and exec-process events.',
      'Export spans without retaining live global span state.',
      'Keep raw model/tool content export disabled by default.',
      'Add bounded error metadata with redaction.',
      'Add restart-safe exporter startup and config reload behavior.',
      'Add immutable per-run trace context through tool hooks.',
      'Create diagnostics export for support without secrets.',
      'Queue implementation after redaction tests pass.'
    ]
  },
  {
    id: 'p16-messaging-channel-robustness',
    title: 'Messaging Channel Robustness',
    owner: 'falcon',
    lane: 'messaging',
    cube: 912673,
    target: 'adopt robust Telegram, Feishu, Discord, WhatsApp, Signal, and channel handling lessons',
    steps: [
      'Study OpenClaw Telegram webhook acknowledgement and duplicate poller diagnostics.',
      'Map Asolaria channel connectors and mobile inbox surfaces.',
      'Acknowledge inbound webhooks before slow agent turns where supported.',
      'Preserve per-chat processing lanes for slow replies.',
      'Suppress duplicate fallback messages after committed replies.',
      'Render untrusted group names and contact metadata through fenced JSON.',
      'Reject non-HTTP attachment URLs before media fetch.',
      'Preserve permission context through outbound delivery.',
      'Create channel-specific synthetic fixtures without live sends.',
      'Queue implementation after connector health passes.'
    ]
  },
  {
    id: 'p17-audio-tts-media-handling',
    title: 'Audio TTS And Media Handling',
    owner: 'gaia',
    lane: 'media',
    cube: 300763,
    target: 'improve audio, TTS, image, and media handling without hidden provider assumptions',
    steps: [
      'Study OpenClaw TTS, voice-note, Feishu Ogg/Opus, and audio transcript fixes.',
      'Inventory Asolaria media, image, screenshot, and desktop capture stores.',
      'Preserve audio-only transcripts for hooks without rendering them as captions.',
      'Transcode only where target channel requires it.',
      'Keep media attachments authenticated and restorable in history.',
      'Validate image and audio model routing through configured providers.',
      'Prevent media directive injection through unsupported model options.',
      'Add timeout controls for long media tasks only when task-specific.',
      'Create synthetic media fixtures and redacted metadata reports.',
      'Queue implementation after media storage and retention gates pass.'
    ]
  },
  {
    id: 'p18-liris-falcon-trinity-deployment',
    title: 'Liris Falcon Trinity Deployment Projection',
    owner: 'helm',
    lane: 'federation',
    cube: 1601613,
    target: 'project OpenClaw upgrades onto Acer, Liris, Falcon, and trinity links',
    steps: [
      'Map Asolaria-canonical, Liris sub-colony, and Falcon orbital authority correctly.',
      'Record Liris SMB, MWB, and BEHCS bus availability as deployment context.',
      'Route federation changes through D23_FEDERATION because it was the weakest OpenClaw intake dimension.',
      'Separate Acer canonical writes from Liris bounded-sub-colony writes.',
      'Define cable, WiFi, SMB, and BEHCS bus evidence requirements.',
      'Project browser, voice, and meeting features onto reachable devices only.',
      'Avoid assuming HDMI capture or USB bridge capabilities without proof.',
      'Create recovery path if Liris or Falcon is offline.',
      'Add cross-node artifact replication tasks after local proof exists.',
      'Queue deployment only after local Acer implementation and smoke tests pass.'
    ]
  },
  {
    id: 'p19-synthetic-ci-test-harness',
    title: 'Synthetic CI And Test Harness',
    owner: 'forge',
    lane: 'ci',
    cube: 704969,
    target: 'turn the plan into tests before implementation risk',
    steps: [
      'Create synthetic fixtures for provider catalog rows, plugin manifests, browser actions, sessions, gateway pairing, and channels.',
      'Add node --check coverage for every new script and cube.',
      'Add focused unit tests before broad integration tests.',
      'Run existing skills validation after metadata changes.',
      'Run health guardrail check after server or gateway edits.',
      'Record test commands and outputs in reports.',
      'Gate any live connector test behind explicit configured credentials and operator approval.',
      'Preserve all failed test evidence for reverse-gain review.',
      'Add rollback notes for changed runtime surfaces.',
      'Queue implementation batches only when synthetic tests are defined.'
    ]
  },
  {
    id: 'p20-rollout-recovery-governance',
    title: 'Rollout Recovery And Governance',
    owner: 'helm',
    lane: 'rollout',
    cube: 3581577,
    target: 'make implementation reversible, reviewable, and staged',
    steps: [
      'Convert the 200-step inventory into small implementation tranches.',
      'Prioritize federation weakness repair, model catalog manifests, MCP cleanup, and gateway security first.',
      'Defer live voice/meeting work until provider and consent gates pass.',
      'Require manual review for mixed dirty files.',
      'Write rollback notes for each tranche before merging.',
      'Update memory, index, map, cube, and GLPJ after each tranche.',
      'Run Hermes/Shannon review before moving from planning to code edits.',
      'Run reverse-gain review after each tranche to capture mistakes.',
      'Keep OpenClaw clone pinned so comparisons remain reproducible.',
      'Emit final significance and next execution queue for implementation.'
    ]
  }
];

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

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_) {
    return fallback;
  }
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function glyph(kind, id, seed) {
  const hash = sha256(`${kind}:${id}:${seed || ''}`);
  return `HG256:${kind.toUpperCase()}:${hash.slice(0, 8).toUpperCase()}:${behcs.hilbertAddress(hash)}`;
}

function taskId(phaseIndex, stepIndex) {
  return `OC424-${String(phaseIndex + 1).padStart(2, '0')}-${String(stepIndex + 1).padStart(2, '0')}`;
}

function phaseVoteId(batchIndex) {
  return `ASOLARIA-OPENCLAW-424-200-STEP-BATCH-${String(batchIndex + 1).padStart(2, '0')}-20260426`;
}

function manifestPath(batchIndex) {
  return path.join(PATHS.manifestsDir, `openclaw-424-200-step-batch-${String(batchIndex + 1).padStart(2, '0')}.manifest.v1.json`);
}

function votePath(batchIndex) {
  return rel(`data/votes/${phaseVoteId(batchIndex)}/behcs-v6-candidate-file.json`);
}

function buildTasks(generatedAt) {
  const tasks = [];
  PHASES.forEach((phase, phaseIndex) => {
    phase.steps.forEach((title, stepIndex) => {
      tasks.push({
        id: taskId(phaseIndex, stepIndex),
        generatedAt,
        phaseId: phase.id,
        phaseTitle: phase.title,
        phaseIndex: phaseIndex + 1,
        stepIndex: stepIndex + 1,
        title,
        owner: phase.owner,
        lane: phase.lane,
        status: 'QUEUED_FOR_IMPLEMENTATION',
        proofRequired: true,
        supervisorGateRequired: true,
        sourceRun: SOURCE_RUN,
        artifacts: [repoRel(SOURCE_PATHS.aggregate), repoRel(SOURCE_PATHS.diffIndex), repoRel(SOURCE_PATHS.modelCard)],
        restrictions: {
          externalApiCalls: false,
          providerAuthBypass: false,
          paymentBypass: false,
          uncontrolledFanout: false,
          remoteMutation: false,
          destructiveAction: false
        },
        glyph: glyph('openclaw424_200_step_task', `${phase.id}:${stepIndex + 1}`, `${generatedAt}:${title}`)
      });
    });
  });
  return tasks;
}

function buildPhaseInventory(generatedAt, tasks) {
  return {
    inventoryId: 'openclaw-424-phase-inventory.v1',
    generatedAt,
    runId: RUN_ID,
    sourceRun: SOURCE_RUN,
    phaseCount: PHASES.length,
    stepCount: tasks.length,
    phases: PHASES.map((phase, index) => ({
      id: phase.id,
      index: index + 1,
      title: phase.title,
      owner: phase.owner,
      lane: phase.lane,
      cube: phase.cube,
      target: phase.target,
      stepIds: tasks.filter((task) => task.phaseId === phase.id).map((task) => task.id)
    }))
  };
}

function buildPlan(generatedAt, tasks, sourceAggregate, diffIndex) {
  return {
    planId: 'openclaw-424-200-step-execution.v1',
    generatedAt,
    runId: RUN_ID,
    sourceRun: SOURCE_RUN,
    status: 'PLAN_MATERIALIZED_PENDING_SUPERVISOR_AND_CASCADE',
    purpose: 'Execute the OpenClaw 4.24 ingestion result as a 200-step Asolaria upgrade and ingestion task plan before code implementation.',
    sourceStatus: sourceAggregate.status || 'UNKNOWN',
    sourceChangedFiles: sourceAggregate.changedFileCount || diffIndex.changedFileCount || 0,
    sourceTotalBeats: sourceAggregate.totalBeats || 0,
    sourceWeakestDims: sourceAggregate.weakestDims || {},
    waveShape: WAVE_SHAPE,
    phaseCount: PHASES.length,
    stepCount: tasks.length,
    glyphLanguage: {
      slots: GLYPH_SLOTS,
      letteredGlyphs: LETTERED_GLYPHS,
      discipline: '246 lettered glyphs inside BEHCS-256 slot language'
    },
    executionPolicy: {
      localArtifactsOnly: true,
      supervisorGateRequired: true,
      cascadePhaseProofRequired: true,
      codeImplementationDeferredUntilReview: true,
      externalApiCalls: false,
      providerAuthBypass: false,
      paymentBypass: false,
      uncontrolledFanout: false,
      remoteMutation: false
    },
    priorities: [
      'Repair D23_FEDERATION weakness first.',
      'Import OpenClaw model catalog manifest discipline.',
      'Add MCP lifecycle cleanup and child-process proof.',
      'Harden gateway pairing and config mutation.',
      'Add Codex harness parity without provider bypass.',
      'Keep live voice and meeting work behind explicit consent and provider gates.'
    ],
    artifacts: outputs()
  };
}

function buildModelCard(generatedAt, tasks, sourceAggregate) {
  return {
    modelCardId: 'openclaw-424-200-step-execution.model-card.v1',
    generatedAt,
    status: 'READY_FOR_SUPERVISOR_REVIEW',
    owner: 'asolaria-canonical',
    mode: 'local_task_execution_plan_and_phase_cascade_proof',
    purpose: 'Convert OpenClaw 4.24 ingestion into a 200-step implementation queue with BEHCS-256, supervisor, Hermes, Shannon, Hookwall, GNN, white-room, and GC routing.',
    sourceRun: SOURCE_RUN,
    sourceAggregateStatus: sourceAggregate.status || 'UNKNOWN',
    phaseCount: PHASES.length,
    stepCount: tasks.length,
    allowedActions: [
      'write local plan artifacts',
      'write local task inventory',
      'run local supervisor gate',
      'run local BEHCS cascade over phase candidates',
      'write memory index map cube GLPJ and reports'
    ],
    blockedActions: [
      'provider auth bypass',
      'payment bypass',
      'unbounded real worker fanout',
      'secret extraction',
      'remote mutation',
      'cloud upload',
      'firmware mutation',
      'evidence deletion'
    ],
    gates: [
      'Hermes supervisor-of-supervisors aware',
      'model_card_gate',
      'synthetic_first_ci',
      'reverse_gain_review',
      'connector_health_matrix',
      'federation_weakness_repair'
    ]
  };
}

function buildSupervisorPacket(phase, phaseIndex, generatedAt) {
  return {
    id: `ASO-OPENCLAW-424-200STEP-SUP-${phase.id}`,
    title: `${phase.title} supervisor packet`,
    objective: `Gate phase ${phaseIndex + 1}/20: ${phase.target}.`,
    instructions: 'Evaluate the phase and its ten implementation steps under BEHCS-256, map-map-mapped, cube-cube-cubed, Hookwall, GNN, OmniShannon, white rooms, GC, Hermes, and Shannon.',
    requestedWorker: 'local_behcs_v6_cascade_engine',
    pid: `BH.ASO.OPENCLAW.424.200STEP.${phase.id.toUpperCase().replace(/[^A-Z0-9]+/g, '.')}`,
    pidScope: 'local_200_step_execution_plan_only',
    consentScope: 'operator_authorized_local_planning',
    allowedPaths: [
      repoRel(RUN_ROOT),
      'data/behcs/orchestration',
      'data/behcs/maps/asolaria',
      'data/behcs/cubes',
      'data/votes',
      'reports'
    ],
    expectedArtifacts: [
      repoRel(PATHS.plan),
      repoRel(PATHS.tasksNdjson),
      repoRel(PATHS.modelCard),
      repoRel(manifestPath(Math.floor(phaseIndex / 10)))
    ],
    acceptanceGates: [
      'model_card_gate_review',
      'phase_has_ten_steps',
      'source_openclaw_ingestion_present',
      'map_map_mapped_reference_present',
      'cube_cube_cubed_reference_present',
      'no_external_worker_spawn'
    ],
    proofRequired: true,
    proofRefs: [repoRel(PATHS.modelCard), repoRel(PATHS.plan), repoRel(PATHS.tasksNdjson)],
    syntheticFirstEvidence: true,
    modelCard: true,
    providerAuthMode: 'none_local_engine_only',
    remoteMutation: false,
    externalApiCall: false,
    cloudUpload: false,
    downloads: false,
    installs: false,
    writesGit: false,
    deletesEvidence: false,
    sensitiveData: false,
    secretMaterial: false,
    bypassAuth: false,
    bypassPayment: false,
    needsCloudWorker: false,
    source: 'asolaria-openclaw-424-200-step-execution-plan',
    generatedAt
  };
}

function buildManifest(batchIndex, generatedAt) {
  const phaseSlice = PHASES.slice(batchIndex * 10, batchIndex * 10 + 10);
  return {
    vote_id: phaseVoteId(batchIndex),
    generatedAt,
    mode: 'openclaw-424-200-step-phase-batch',
    taskId: 'ASOLARIA-OPENCLAW-424-200-STEP-EXECUTION',
    planId: RUN_ID,
    purpose: `Run OpenClaw 4.24 200-step execution phases ${batchIndex * 10 + 1}-${batchIndex * 10 + phaseSlice.length} through BEHCS v6 phase proof.`,
    waveShape: WAVE_SHAPE,
    sourceReferences: [
      {
        id: 'OpenClaw-424-ingestion-aggregate',
        artifact: repoRel(SOURCE_PATHS.aggregate)
      },
      {
        id: 'OpenClaw-424-diff-index',
        artifact: repoRel(SOURCE_PATHS.diffIndex)
      },
      {
        id: 'OpenClaw-424-200-step-plan',
        artifact: repoRel(PATHS.plan)
      }
    ],
    chain: 'OpenClaw 4.24 intake -> 200-step task inventory -> phase cascade -> supervisor-gated implementation queue',
    executionPolicy: {
      planningOnly: true,
      selfReflecting: true,
      externalApiCalls: false,
      providerAuthBypass: false,
      paymentBypass: false,
      remoteMutation: false,
      spawnWorkers: false,
      uncontrolledFanout: false,
      executorDispatches: false
    },
    candidates: phaseSlice.map((phase, index) => ({
      id: `aso.openclaw424.200step.${phase.id}`,
      label: `${phase.title} :: ${phase.target}`,
      cube: phase.cube,
      primary_cube: phase.cube,
      metadata: {
        phase: phase.id,
        phaseIndex: batchIndex * 10 + index + 1,
        owner: phase.owner,
        lane: phase.lane,
        stepIds: Array.from({ length: 10 }, (_, stepIndex) => taskId(batchIndex * 10 + index, stepIndex)),
        proof_artifact: repoRel(PATHS.plan),
        taskInventory: repoRel(PATHS.tasksNdjson),
        sourceRun: SOURCE_RUN,
        planningOnly: true,
        noExternalApiCalls: true,
        noProviderAuthBypass: true,
        noUnboundedWorkers: true
      }
    }))
  };
}

function buildPreparedArtifacts(generatedAt) {
  const sourceAggregate = readJson(SOURCE_PATHS.aggregate, {});
  const diffIndex = readJson(SOURCE_PATHS.diffIndex, {});
  const tasks = buildTasks(generatedAt);
  const plan = buildPlan(generatedAt, tasks, sourceAggregate, diffIndex);
  const phaseInventory = buildPhaseInventory(generatedAt, tasks);
  const modelCard = buildModelCard(generatedAt, tasks, sourceAggregate);
  const manifests = [buildManifest(0, generatedAt), buildManifest(1, generatedAt)];
  const supervisorPackets = PHASES.map((phase, index) => buildSupervisorPacket(phase, index, generatedAt));
  const glpj = {
    glpjId: 'openclaw-424-200-step-execution-behcs256.glpj',
    generatedAt,
    status: 'BEHCS256_OPENCLAW_424_200_STEP_GLYPHS_PREPARED',
    alphabetBase: GLYPH_SLOTS,
    letteredGlyphs: LETTERED_GLYPHS,
    mints: [
      ['openclaw424_200_plan', PATHS.plan, 'D24_INTENT'],
      ['openclaw424_200_tasks', PATHS.tasksNdjson, 'D13_SURFACE'],
      ['openclaw424_implementation_queue', PATHS.implementationQueue, 'D42_ORCHESTRATION'],
      ['openclaw424_phase_inventory', PATHS.phaseInventory, 'D36_INFERENCE_SURFACE'],
      ['openclaw424_200_model_card', PATHS.modelCard, 'D11_PROOF'],
      ['openclaw424_200_supervisors', PATHS.supervisorQueue, 'D41_SUPERVISOR'],
      ['openclaw424_200_batch_01', manifestPath(0), 'D39_GNN_EDGE'],
      ['openclaw424_200_batch_02', manifestPath(1), 'D39_GNN_EDGE']
    ].map(([id, artifact, dimension]) => ({
      id,
      dimension,
      artifact: repoRel(artifact),
      glyph: glyph('openclaw424_200_step', id, `${generatedAt}:${artifact}`)
    }))
  };
  return { sourceAggregate, diffIndex, tasks, plan, phaseInventory, modelCard, manifests, supervisorPackets, glpj };
}

function prepare({ execute = false } = {}) {
  const generatedAt = new Date().toISOString();
  const artifacts = buildPreparedArtifacts(generatedAt);
  const report = {
    reportId: 'openclaw-424-200-step-execution-latest',
    generatedAt,
    status: 'PREPARED_PENDING_SUPERVISOR_AND_CASCADE_RUNS',
    runId: RUN_ID,
    sourceRun: SOURCE_RUN,
    phaseCount: PHASES.length,
    stepCount: artifacts.tasks.length,
    manifestCount: artifacts.manifests.length,
    sourceChangedFiles: artifacts.plan.sourceChangedFiles,
    sourceTotalBeats: artifacts.plan.sourceTotalBeats,
    outputs: outputs()
  };

  if (execute) {
    writeJson(PATHS.plan, artifacts.plan);
    writeText(PATHS.tasksNdjson, artifacts.tasks.map((task) => JSON.stringify(task)).join('\n') + '\n');
    writeText(PATHS.implementationQueue, artifacts.tasks.map((task) => JSON.stringify({
      id: `impl-${task.id}`,
      taskId: task.id,
      phaseId: task.phaseId,
      owner: task.owner,
      lane: task.lane,
      status: 'READY_FOR_REVIEWED_IMPLEMENTATION',
      title: task.title,
      proofRefs: task.artifacts
    })).join('\n') + '\n');
    writeJson(PATHS.phaseInventory, artifacts.phaseInventory);
    writeJson(PATHS.modelCard, artifacts.modelCard);
    for (let index = 0; index < artifacts.manifests.length; index += 1) {
      writeJson(manifestPath(index), artifacts.manifests[index]);
    }
    writeText(PATHS.supervisorQueue, artifacts.supervisorPackets.map((packet) => JSON.stringify(packet)).join('\n') + '\n');
    writeJson(PATHS.glpj, artifacts.glpj);
    writeJson(PATHS.reportJson, report);
    writeText(PATHS.reportMd, buildReportMd(report, null));
    appendNdjson(PATHS.globalInbox, {
      id: `${RUN_ID}-prepare-${Date.now()}`,
      ts: generatedAt,
      from: 'asolaria-canonical',
      to: 'hermes-supervisor-of-supervisors',
      verb: 'EVT-OPENCLAW-424-200-STEP-PLAN-PREPARED',
      body: { runId: RUN_ID, phaseCount: PHASES.length, stepCount: artifacts.tasks.length }
    });
    appendNdjson(PATHS.gnnEdges, {
      id: `${RUN_ID}-prepare-gnn-${Date.now()}`,
      ts: generatedAt,
      from: 'OPENCLAW_424_INGESTION',
      to: 'OPENCLAW_424_200_STEP_EXECUTION',
      verb: 'materializes_200_step_task_inventory',
      weight: 0.998,
      phaseCount: PHASES.length,
      stepCount: artifacts.tasks.length
    });
  }

  return {
    ok: true,
    action: execute ? 'prepare-write' : 'prepare-preview',
    generatedAt,
    runId: RUN_ID,
    phaseCount: PHASES.length,
    stepCount: artifacts.tasks.length,
    manifestCount: artifacts.manifests.length,
    outputs: outputs()
  };
}

function summarizeVote(batchIndex) {
  const filePath = votePath(batchIndex);
  const vote = readJson(filePath);
  if (!vote) {
    return {
      batch: batchIndex + 1,
      voteId: phaseVoteId(batchIndex),
      votePath: repoRel(filePath),
      status: 'MISSING'
    };
  }
  const verdictCounts = {};
  const weakestDims = {};
  const gnnOverrides = new Set();
  for (const result of vote.results || []) {
    verdictCounts[result.verdict] = (verdictCounts[result.verdict] || 0) + 1;
    const weakest = result.selfReflection?.weakestOverall?.dim;
    if (weakest) weakestDims[weakest] = (weakestDims[weakest] || 0) + 1;
    if (result.gnnOverride) gnnOverrides.add(result.gnnOverride);
  }
  return {
    batch: batchIndex + 1,
    voteId: vote.vote_id,
    votePath: repoRel(filePath),
    status: 'PRESENT',
    candidatesScanned: vote.candidatesScanned,
    totalBeats: vote.totalBeats,
    elapsedMs: vote.elapsed_ms,
    busAlive: Boolean(vote.liveState?.busAlive),
    executorDispatches: vote.executorDispatches || 0,
    verdictCounts,
    weakestDims,
    gnnOverrides: Array.from(gnnOverrides)
  };
}

function absorb({ execute = false } = {}) {
  const generatedAt = new Date().toISOString();
  const plan = readJson(PATHS.plan, {});
  const phaseInventory = readJson(PATHS.phaseInventory, {});
  const batchVotes = [summarizeVote(0), summarizeVote(1)];
  const present = batchVotes.filter((item) => item.status === 'PRESENT');
  const missing = batchVotes.filter((item) => item.status !== 'PRESENT');
  const totalBeats = present.reduce((sum, item) => sum + (item.totalBeats || 0), 0);
  const verdictCounts = {};
  const weakestDims = {};
  const gnnOverrides = new Set();
  for (const vote of present) {
    for (const [verdict, count] of Object.entries(vote.verdictCounts || {})) {
      verdictCounts[verdict] = (verdictCounts[verdict] || 0) + count;
    }
    for (const [dim, count] of Object.entries(vote.weakestDims || {})) {
      weakestDims[dim] = (weakestDims[dim] || 0) + count;
    }
    for (const override of vote.gnnOverrides || []) gnnOverrides.add(override);
  }
  const aggregate = {
    aggregateId: 'openclaw-424-200-step-execution-aggregate-latest',
    generatedAt,
    status: missing.length > 0 ? 'PARTIAL_PHASE_BATCH_VOTES_PRESENT' : 'OPENCLAW_424_200_STEP_EXECUTION_READY_FOR_IMPLEMENTATION_REVIEW',
    runId: RUN_ID,
    sourceRun: SOURCE_RUN,
    waveShape: WAVE_SHAPE,
    phaseCount: phaseInventory.phaseCount || PHASES.length,
    stepCount: phaseInventory.stepCount || 200,
    batchesPresent: present.length,
    batchesMissing: missing.length,
    candidateCount: present.reduce((sum, item) => sum + (item.candidatesScanned || 0), 0),
    totalBeats,
    verdictCounts,
    weakestDims,
    gnnOverrides: Array.from(gnnOverrides),
    batchVotes,
    implementationDisposition: 'ready_for_reviewed_code_tranches'
  };

  const memory = {
    eventId: 'openclaw-424-200-step-execution.v1',
    generatedAt,
    status: aggregate.status,
    significance: 'The OpenClaw 4.24 intake was converted into a 200-step Asolaria upgrade and ingestion execution queue. The system now has phase-owned tasks, supervisor readiness, BEHCS-256 glyph bindings, map-map-mapped routes, cube-cube-cubed orchestration, and local cascade evidence before code changes.',
    sourceRun: SOURCE_RUN,
    phaseCount: aggregate.phaseCount,
    stepCount: aggregate.stepCount,
    totalBeats,
    verdictCounts,
    weakestDims,
    writePolicy: 'local_artifacts_only_review_before_code_implementation'
  };

  const index = {
    indexId: 'openclaw-424-200-step-execution-index.v1',
    generatedAt,
    status: 'INDEX_READY_OPENCLAW_424_200_STEP_EXECUTION',
    keys: [
      'OpenClaw 4.24',
      '200-step execution',
      'Asolaria upgrade',
      'BEHCS-256',
      '246 lettered glyphs',
      'map-map-mapped',
      'cube-cube-cubed',
      'Hermes',
      'Shannon',
      'Hookwall',
      'GNN',
      'model catalog',
      'Codex harness',
      'MCP cleanup',
      'gateway pairing',
      'browser coordinates',
      'realtime voice',
      'Liris Falcon trinity'
    ],
    artifacts: outputs(),
    phaseInventory: repoRel(PATHS.phaseInventory),
    batchVotes
  };

  const map = {
    mapId: 'openclaw-424-200-step-execution-map-map-mapped.v1',
    generatedAt,
    status: 'MAP_MAP_MAPPED_READY_OPENCLAW_424_200_STEP_EXECUTION',
    routes: [
      { from: 'OpenClaw_424_ingestion', to: '200_step_plan', edge: 'produces_execution_inventory', artifact: repoRel(PATHS.plan) },
      { from: '200_step_plan', to: 'supervisor_queue', edge: 'binds_phase_authority', artifact: repoRel(PATHS.supervisorQueue) },
      { from: 'supervisor_queue', to: 'phase_cascade_batches', edge: 'allows_worker_ready_without_spawning', artifact: repoRel(PATHS.supervisorReportJson) },
      { from: 'phase_cascade_batches', to: 'implementation_queue', edge: 'gates_reviewed_code_tranches', artifact: repoRel(PATHS.implementationQueue) },
      { from: 'D23_FEDERATION', to: 'p18_liris_falcon_trinity', edge: 'weakest_dimension_repair_priority', artifact: repoRel(PATHS.aggregate) },
      { from: 'GLPJ_246_lettered_glyphs', to: 'BEHCS_256_slots', edge: 'encodes_phase_task_language', artifact: repoRel(PATHS.glpj) }
    ],
    phaseRoutes: PHASES.map((phase, index) => ({
      phaseId: phase.id,
      phaseIndex: index + 1,
      owner: phase.owner,
      lane: phase.lane,
      to: 'implementation_queue',
      artifact: repoRel(PATHS.tasksNdjson)
    }))
  };

  const cube = buildCube(generatedAt, aggregate);
  const glpj = readJson(PATHS.glpj, {
    glpjId: 'openclaw-424-200-step-execution-behcs256.glpj',
    generatedAt,
    status: 'BEHCS256_OPENCLAW_424_200_STEP_GLYPHS_PREPARED',
    alphabetBase: GLYPH_SLOTS,
    letteredGlyphs: LETTERED_GLYPHS,
    mints: []
  });
  const known = new Set((glpj.mints || []).map((mint) => mint.id));
  for (const [id, artifact, dimension] of [
    ['openclaw424_200_aggregate', PATHS.aggregate, 'D11_PROOF'],
    ['openclaw424_200_memory_written', PATHS.memory, 'D11_PROOF'],
    ['openclaw424_200_index_written', PATHS.index, 'D13_SURFACE'],
    ['openclaw424_200_map_written', PATHS.map, 'D35_HYPERLANGUAGE'],
    ['openclaw424_200_cube_written', PATHS.cube, 'D42_ORCHESTRATION'],
    ['openclaw424_200_supervisor_awareness', PATHS.supervisorReportJson, 'D41_SUPERVISOR']
  ]) {
    if (!known.has(id)) {
      glpj.mints.push({
        id,
        dimension,
        artifact: repoRel(artifact),
        glyph: glyph('openclaw424_200_step_proof', id, `${generatedAt}:${artifact}`)
      });
    }
  }
  glpj.status = 'BEHCS256_OPENCLAW_424_200_STEP_PROOF_GLYPHS_MINTED';

  const report = {
    reportId: 'openclaw-424-200-step-execution-latest',
    generatedAt,
    status: aggregate.status,
    runId: RUN_ID,
    sourceRun: SOURCE_RUN,
    phaseCount: aggregate.phaseCount,
    stepCount: aggregate.stepCount,
    candidateCount: aggregate.candidateCount,
    totalBeats,
    verdictCounts,
    weakestDims,
    gnnOverrides: aggregate.gnnOverrides,
    implementationDisposition: aggregate.implementationDisposition,
    outputs: outputs()
  };

  if (execute) {
    writeJson(PATHS.aggregate, aggregate);
    writeJson(PATHS.memory, memory);
    writeJson(PATHS.index, index);
    writeJson(PATHS.map, map);
    writeText(PATHS.cube, cube);
    writeJson(PATHS.glpj, glpj);
    writeJson(PATHS.reportJson, report);
    writeText(PATHS.reportMd, buildReportMd(report, aggregate, plan));
    appendNdjson(PATHS.gnnEdges, {
      id: `${RUN_ID}-absorbed-gnn-${Date.now()}`,
      ts: generatedAt,
      from: 'OPENCLAW_424_200_STEP_EXECUTION',
      to: 'ASOLARIA_IMPLEMENTATION_QUEUE',
      verb: 'absorbs_phase_votes_into_reviewed_tranches',
      weight: 0.999,
      phaseCount: aggregate.phaseCount,
      stepCount: aggregate.stepCount,
      totalBeats
    });
  }

  return {
    ok: true,
    action: execute ? 'absorb-write' : 'absorb-preview',
    generatedAt,
    status: aggregate.status,
    phaseCount: aggregate.phaseCount,
    stepCount: aggregate.stepCount,
    batchesPresent: aggregate.batchesPresent,
    batchesMissing: aggregate.batchesMissing,
    candidateCount: aggregate.candidateCount,
    totalBeats,
    verdictCounts,
    weakestDims,
    outputs: outputs()
  };
}

function buildCube(generatedAt, aggregate) {
  const cube = {
    id: 'openclaw-424-200-step-execution-cube-cubed',
    generatedAt,
    status: 'CUBE_CUBE_CUBED_READY_OPENCLAW_424_200_STEP_EXECUTION',
    sourceRun: SOURCE_RUN,
    waveShape: WAVE_SHAPE,
    dimensions: {
      D10_DIALECT: 'BEHCS_256_WITH_246_LETTERED_GLYPHS',
      D11_PROOF: 'phase_batch_votes_memory_model_card',
      D13_SURFACE: '200_step_task_inventory',
      D16_PID: 'phase_bound_logical_task_ids',
      D18_AI_MODEL: 'model_catalog_and_harness_parity_targets',
      D23_FEDERATION: 'liris_falcon_trinity_repair_priority',
      D24_INTENT: 'upgrade_ingest_and_prepare_implementation',
      D35_HYPERLANGUAGE: 'map_map_mapped_200_step_routes',
      D36_INFERENCE_SURFACE: 'phase_cascade_batches',
      D39_GNN_EDGE: 'openclaw_features_to_asolaria_work_lanes',
      D41_SUPERVISOR: 'Hermes_Shannon_phase_gate',
      D42_ORCHESTRATION: 'reviewed_implementation_queue'
    },
    aggregate: {
      phaseCount: aggregate.phaseCount,
      stepCount: aggregate.stepCount,
      candidateCount: aggregate.candidateCount,
      totalBeats: aggregate.totalBeats,
      verdictCounts: aggregate.verdictCounts,
      weakestDims: aggregate.weakestDims,
      implementationDisposition: aggregate.implementationDisposition
    },
    artifacts: outputs()
  };
  return `// cube: openclaw-424-200-step-execution-cube-cubed | BEHCS-256 | 246 lettered glyphs\nexport const CUBE = ${JSON.stringify(cube, null, 2)}\n`;
}

function outputs() {
  return {
    runRoot: repoRel(PATHS.runRoot),
    plan: repoRel(PATHS.plan),
    tasksNdjson: repoRel(PATHS.tasksNdjson),
    implementationQueue: repoRel(PATHS.implementationQueue),
    phaseInventory: repoRel(PATHS.phaseInventory),
    manifestsDir: repoRel(PATHS.manifestsDir),
    modelCard: repoRel(PATHS.modelCard),
    supervisorQueue: repoRel(PATHS.supervisorQueue),
    supervisorRunner: repoRel(PATHS.supervisorReportJson),
    aggregate: repoRel(PATHS.aggregate),
    memory: repoRel(PATHS.memory),
    index: repoRel(PATHS.index),
    map: repoRel(PATHS.map),
    cube: repoRel(PATHS.cube),
    glpj: repoRel(PATHS.glpj),
    reportJson: repoRel(PATHS.reportJson),
    reportMd: repoRel(PATHS.reportMd),
    votes: [0, 1].map((batchIndex) => `data/votes/${phaseVoteId(batchIndex)}/behcs-v6-candidate-file.json`)
  };
}

function buildReportMd(report, aggregate, plan) {
  const lines = [
    '# OpenClaw 4.24 200-Step Execution',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `Status: ${report.status}`,
    '',
    `- Source run: ${report.sourceRun || SOURCE_RUN}`,
    `- Phases: ${report.phaseCount || PHASES.length}`,
    `- Steps: ${report.stepCount || 200}`,
    `- Phase candidates voted: ${report.candidateCount || 0}`,
    `- Total beats: ${(report.totalBeats || 0).toLocaleString()}`,
    `- Verdicts: ${JSON.stringify(report.verdictCounts || {})}`,
    `- Weakest dims: ${JSON.stringify(report.weakestDims || {})}`,
    `- Implementation disposition: ${report.implementationDisposition || 'pending'}`,
    `- Glyph language: ${LETTERED_GLYPHS} lettered glyphs inside ${GLYPH_SLOTS} slots`,
    '',
    '## Phase Plan',
    '',
    ...PHASES.map((phase, index) => `${index + 1}. ${phase.title} (${phase.owner}/${phase.lane}): ${phase.target}`),
    '',
    '## Priority Result',
    '',
    ...((plan && plan.priorities) || [
      'Repair D23_FEDERATION weakness first.',
      'Import model catalog manifest discipline.',
      'Add MCP lifecycle cleanup and gateway hardening.'
    ]).map((item) => `- ${item}`),
    '',
    '## Outputs',
    '',
    ...Object.entries(report.outputs || outputs()).map(([key, value]) => `- ${key}: \`${Array.isArray(value) ? value.join(', ') : value}\``)
  ];
  if (aggregate) {
    lines.push('', '## Batch Votes', '');
    for (const vote of aggregate.batchVotes) {
      lines.push(`- batch ${vote.batch}: ${vote.status}; beats=${vote.totalBeats || 0}; executorDispatches=${vote.executorDispatches || 0}; verdicts=${JSON.stringify(vote.verdictCounts || {})}`);
    }
  }
  return `${lines.join('\n')}\n`;
}

function main(argv) {
  const action = argv[2] || 'status';
  if (action === 'status' || action === 'prepare') {
    console.log(JSON.stringify(prepare({ execute: argv.includes('--execute') }), null, 2));
    return;
  }
  if (action === 'absorb') {
    console.log(JSON.stringify(absorb({ execute: argv.includes('--execute') }), null, 2));
    return;
  }
  console.error(JSON.stringify({
    ok: false,
    error: `Unknown action: ${action}`,
    usage: [
      'node tools/asolaria-openclaw-424-200-step-execution-plan.js prepare --execute',
      'node tools/behcs/behcs-deep-cascade-v6.js data/behcs/orchestration/openclaw-424-200-step-execution-20260426/manifests/openclaw-424-200-step-batch-01.manifest.v1.json',
      'node tools/behcs/behcs-deep-cascade-v6.js data/behcs/orchestration/openclaw-424-200-step-execution-20260426/manifests/openclaw-424-200-step-batch-02.manifest.v1.json',
      'node tools/asolaria-openclaw-424-200-step-execution-plan.js absorb --execute'
    ]
  }, null, 2));
  process.exitCode = 2;
}

main(process.argv);
