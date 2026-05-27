#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { execFileSync } = require("node:child_process");

const RUN_ID = "free-claude-code-white-room-ingest-20260428";
const PACKET_ID = "FCC-SUPERVISOR-IMPLEMENTATION-PACKET-20260428";
const REPO_URL = "https://github.com/Alishahryar1/free-claude-code";
const CLAIMED_LOCAL_PATH = "C:\\free-claude-code";

function rootDir(options = {}) {
  return path.resolve(options.root || process.env.ASOLARIA_TEAM_PLAN_ROOT || path.join(__dirname, "..", ".."));
}

function rel(root, repoPath) {
  return path.join(root, repoPath);
}

function repoRel(root, filePath) {
  return path.relative(root, filePath).replace(/\\/g, "/");
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeJson(filePath, value) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeText(filePath, value) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, value.endsWith("\n") ? value : `${value}\n`, "utf8");
}

function appendNdjson(filePath, value) {
  ensureDir(filePath);
  fs.appendFileSync(filePath, `${JSON.stringify(value)}\n`, "utf8");
}

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_error) {
    return fallback;
  }
}

function sha256Text(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function observeGitCommit(localClonePath) {
  if (!fs.existsSync(localClonePath)) {
    return {
      path: localClonePath,
      observed: false,
      git: false,
      commit: "",
      clean: false,
      error: "local clone path not visible on this host"
    };
  }
  try {
    const commit = execFileSync("git", ["-C", localClonePath, "rev-parse", "HEAD"], {
      encoding: "utf8",
      timeout: 10000
    }).trim();
    const status = execFileSync("git", ["-C", localClonePath, "status", "--porcelain"], {
      encoding: "utf8",
      timeout: 10000
    }).trim();
    return {
      path: localClonePath,
      observed: true,
      git: true,
      commit,
      clean: status.length === 0,
      error: ""
    };
  } catch (error) {
    return {
      path: localClonePath,
      observed: true,
      git: false,
      commit: "",
      clean: false,
      error: String(error && error.message || error)
    };
  }
}

function buildSelectorTable() {
  return {
    schema: "asolaria-model-selector-candidate.v1",
    sourceIdea: "Free Claude Code tier routing MODEL_OPUS / MODEL_SONNET / MODEL_HAIKU / MODEL fallback",
    defaultPolicy: "local-first-explicit-hosted",
    tiers: [
      {
        tier: "haiku",
        taskClasses: ["quick_chore", "small_patch", "formatting", "classification", "latency_probe"],
        preferredProviderClasses: ["lmstudio", "ollama", "llamacpp"],
        gates: ["tool_use_not_required_or_verified", "context_window_small", "no_secret_context"]
      },
      {
        tier: "sonnet",
        taskClasses: ["patch", "review", "research", "medium_orchestration", "inbox_classification"],
        preferredProviderClasses: ["lmstudio", "llamacpp", "nvidia_nim_explicit_key", "openrouter_explicit_key"],
        gates: ["tool_use_verified", "context_window_medium", "sentinel_policy_pass"]
      },
      {
        tier: "opus",
        taskClasses: ["large_refactor", "authority_boundary_review", "multi_host_plan", "deep_orchestration"],
        preferredProviderClasses: ["local_large_context", "nvidia_nim_explicit_key", "deepseek_explicit_key"],
        gates: ["operator_cosign", "sentinel_policy_pass", "white_room_packet_present", "rollback_plan_present"]
      },
      {
        tier: "validator",
        taskClasses: ["security_review", "test_oracle", "drift_detection", "hash_gate"],
        preferredProviderClasses: ["different_model_family", "local_or_explicit_hosted"],
        gates: ["independent_from_writer", "no_raw_secret_logging", "evidence_required"]
      }
    ],
    denyDefaults: [
      "do_not_mutate_ANTHROPIC_BASE_URL_for_live_admin_terminal",
      "do_not_write_provider_keys_to_repo",
      "do_not_enable_raw_payload_logging_by_default",
      "do_not_fetch_private_network_without_sentinel_gate"
    ]
  };
}

function implementationTasks(observation) {
  return [
    {
      taskId: "FCC-IMPL-01",
      lane: "helm",
      title: "Pin and quarantine the Free Claude Code source",
      status: observation.git && observation.commit ? "READY_FOR_STATIC_AUDIT" : "HOLD_CLONE_OR_PIN_MISSING",
      objective: "Use an exact commit as research input; never a moving branch or unverified local folder.",
      requiredEvidence: ["visible clone path", "git commit sha", "license file", "dependency lock file"],
      writeAuthority: "none",
      targetPaths: []
    },
    {
      taskId: "FCC-IMPL-02",
      lane: "white-room",
      title: "Static source audit before execution",
      status: "HOLD_UNTIL_PINNED_SOURCE",
      objective: "Read server, provider, CLI, config, logging, and dependency surfaces without starting the proxy.",
      requiredEvidence: ["server entrypoints", "provider adapters", "logging flags", "network surfaces", "test inventory"],
      writeAuthority: "report-only",
      targetPaths: ["reports/free-claude-code-static-audit-latest.md"]
    },
    {
      taskId: "FCC-IMPL-03",
      lane: "selector",
      title: "Extract model-tier selector table as data",
      status: "READY_FOR_SUPERVISOR_SCHEMA_REVIEW",
      objective: "Convert the tier idea into Asolaria selector policy without replacing existing worker routing.",
      requiredEvidence: ["task-class mapping", "provider capability gates", "fallback policy", "unit tests"],
      writeAuthority: "candidate-config-only",
      targetPaths: ["config/asolaria.model-selector.candidate.json", "tests/model-selector-policy.unit.test.js"]
    },
    {
      taskId: "FCC-IMPL-04",
      lane: "sentinel-kr",
      title: "Credentials, logging, and private-network policy",
      status: "HOLD_SECURITY_POLICY_REQUIRED",
      objective: "Deny unsafe defaults before any proxy service or admin-terminal integration is possible.",
      requiredEvidence: ["token boundary", "raw payload logging default off", "SSE logging default off", "private network fetch gate"],
      writeAuthority: "policy-candidate-only",
      targetPaths: ["data/behcs/policy/free-claude-code-security-policy.candidate.json"]
    },
    {
      taskId: "FCC-IMPL-05",
      lane: "rook-gc",
      title: "Service isolation, health probes, rollback, and GC",
      status: "HOLD_UNTIL_STATIC_AUDIT_AND_SECURITY_POLICY",
      objective: "If adopted, run the proxy as an isolated optional service with bounded logs and a clean stop path.",
      requiredEvidence: ["non-conflicting port", "process marker", "stop command", "log retention", "rollback path"],
      writeAuthority: "service-plan-only",
      targetPaths: ["data/behcs/orchestration/free-claude-code-service-plan.candidate.json"]
    },
    {
      taskId: "FCC-IMPL-06",
      lane: "brain",
      title: "Map selector tiers to existing Asolaria worker router",
      status: "READY_FOR_DESIGN_REVIEW",
      objective: "Integrate the selector with workerRouter/brainPolicy as a choice table, not a launcher takeover.",
      requiredEvidence: ["workerRouter task type mapping", "brainPolicy safety prefix compatibility", "external worker sensitivity gates"],
      writeAuthority: "design-only",
      targetPaths: ["src/connectors/workerRouter.js", "src/brainPolicy.js", "src/brainOrchestrator.js"]
    },
    {
      taskId: "FCC-IMPL-07",
      lane: "sentinel-helm",
      title: "Hold admin-terminal integration until wake and self-update guards",
      status: "DEFER_UNTIL_33A_4_AND_33A_2",
      objective: "Prevent Claude/Codex terminals from uninstalling boot discipline or mutating live environment while active.",
      requiredEvidence: ["33A-4 compression-wake assertion sealed", "33A-2 self-update guard sealed", "active-session marker observed"],
      writeAuthority: "none",
      targetPaths: []
    },
    {
      taskId: "FCC-IMPL-08",
      lane: "hookwall-gc",
      title: "Test and rollback gate",
      status: "READY_FOR_TEST_PLAN",
      objective: "Define tests that prove selector policy, safety holds, no environment mutation, and reversible service startup.",
      requiredEvidence: ["unit tests", "dry-run command", "rollback command", "no-secret fixtures", "hash-gated reports"],
      writeAuthority: "test-plan-only",
      targetPaths: ["tests/free-claude-code-supervisor-implementation-packet.unit.test.js"]
    }
  ];
}

function buildPacket(options = {}) {
  const root = rootDir(options);
  const generatedAt = options.generatedAt || new Date().toISOString();
  const localClonePath = options.localClonePath || CLAIMED_LOCAL_PATH;
  const observation = observeGitCommit(localClonePath);
  const decisionPath = rel(root, `data/behcs/orchestration/${RUN_ID}/free-claude-code-white-room-decision.v1.json`);
  const votePath = rel(root, "data/votes/V6-FREE-CLAUDE-CODE-WHITE-ROOM-INGEST-20260428/behcs-v6-candidate-file.json");
  const intakePath = rel(root, "data/behcs/orchestration/free-claude-code-github-solution-intake-20260428/free-claude-code-github-solution-intake.v1.json");
  const decision = readJson(decisionPath, {});
  const vote = readJson(votePath, {});
  const intake = readJson(intakePath, {});
  const selectorTable = buildSelectorTable();
  const tasks = implementationTasks(observation);
  const readiness = {
    status: observation.git && observation.commit ? "OPEN_FOR_STATIC_AUDIT_ONLY" : "CLOSED_PENDING_PINNED_LOCAL_SOURCE",
    reason: observation.git && observation.commit
      ? "A local git commit is visible; only read-only static audit is open."
      : "The claimed clone path is not visible as a pinned git commit on this host.",
    closedGates: [
      "install_dependencies",
      "start_proxy",
      "mutate_claude_environment",
      "admin_terminal_integration",
      "canon_promotion",
      "secret_read"
    ],
    openGates: observation.git && observation.commit ? ["static_audit_read_only"] : []
  };
  const packet = {
    schema: "free-claude-code-supervisor-implementation-packet.v1",
    packetId: PACKET_ID,
    generatedAt,
    status: "SUPERVISOR_IMPLEMENTATION_PACKET_MINTED_PLANNING_ONLY",
    source: {
      repoUrl: REPO_URL,
      claimedLocalPath: localClonePath,
      localObservation: observation,
      intakeState: repoRel(root, intakePath),
      intakeStateHash: intake.stateHash || "",
      whiteRoomDecision: repoRel(root, decisionPath),
      whiteRoomDecisionHash: decision.stateHash || "",
      vote: repoRel(root, votePath),
      voteSummary: {
        voteId: vote.vote_id || vote.voteId || "V6-FREE-CLAUDE-CODE-WHITE-ROOM-INGEST-20260428",
        totalBeats: Number(vote.totalBeats || 0),
        candidates: Array.isArray(vote.results) ? vote.results.length : 0,
        executorDispatches: Number(vote.executorDispatches || 0)
      }
    },
    authorityBoundary: {
      planningOnly: true,
      noInstall: true,
      noProxyStart: true,
      noClaudeEnvMutation: true,
      noAdminTerminalAttach: true,
      noSecretRead: true,
      noCanonPromotion: true,
      noThirdPartyCodeExecution: true
    },
    selectorTable,
    tasks,
    readiness,
    summon: {
      helm: "Direct pinned-source intake and version-controlled update discipline.",
      gaia: "Keep federation topology aware; no network expansion for this candidate.",
      dasein: "Track operator intent and memory/index/map continuity.",
      sentinel: "Enforce KR security holds for credentials, logging, and private-network fetch.",
      falcon: "Remain downstream until LAW-001 vertex is reactivated and service policy passes.",
      vector: "Classify small/medium/large task routing for selector table.",
      rook: "Own service isolation and rollback planning.",
      brain: "Map model tiers into Asolaria worker policy without replacing boot discipline.",
      selector: "Own choosable model policy table and tests.",
      omnispindles: "Consume tasks after supervisor gates open; no executor fanout from this packet.",
      omniflywheels: "Record tracker evidence and GC-retained reports only.",
      kr: "Deny unsafe token/logging/env defaults."
    }
  };
  packet.stateHash = sha256Text(JSON.stringify({
    generatedAt,
    source: packet.source,
    authorityBoundary: packet.authorityBoundary,
    selectorTable: packet.selectorTable,
    tasks: packet.tasks,
    readiness: packet.readiness,
    summon: packet.summon
  }));
  return { root, packet, tasks };
}

function taskNdjson(tasks) {
  return tasks.map((task) => JSON.stringify(task)).join("\n");
}

function reportMarkdown(packet) {
  const rows = packet.tasks
    .map((task) => `| ${task.taskId} | ${task.lane} | ${task.status} | ${task.title} |`)
    .join("\n");
  const tiers = packet.selectorTable.tiers
    .map((tier) => `- ${tier.tier}: ${tier.taskClasses.join(", ")} -> ${tier.preferredProviderClasses.join(", ")}`)
    .join("\n");
  return `# Free Claude Code Supervisor Implementation Packet

Generated: ${packet.generatedAt}

Status: ${packet.status}

State hash: \`${packet.stateHash}\`

Source: ${packet.source.repoUrl}

Local clone observed: ${packet.source.localObservation.observed}

Pinned commit: ${packet.source.localObservation.commit || "none"}

Readiness: ${packet.readiness.status}

## Selector Table

${tiers}

## Tasks

| Task | Lane | Status | Title |
| --- | --- | --- | --- |
${rows}

Boundary: planning-only; no install; no proxy start; no Claude environment mutation; no admin-terminal attach; no secret read; no canon promotion; no third-party execution.
`;
}

function writePacket(options = {}) {
  const { root, packet, tasks } = buildPacket(options);
  const runRoot = rel(root, `data/behcs/orchestration/${RUN_ID}`);
  const statePath = path.join(runRoot, "free-claude-code-supervisor-implementation-packet.v1.json");
  const tasksPath = path.join(runRoot, "free-claude-code-supervisor-implementation-tasks.ndjson");
  const selectorPath = path.join(runRoot, "free-claude-code-selector-table.candidate.json");
  const reportJson = rel(root, "reports/free-claude-code-supervisor-implementation-packet-latest.json");
  const reportMd = rel(root, "reports/free-claude-code-supervisor-implementation-packet-latest.md");
  writeJson(statePath, packet);
  writeText(tasksPath, taskNdjson(tasks));
  writeJson(selectorPath, packet.selectorTable);
  writeJson(reportJson, {
    reportId: "free-claude-code-supervisor-implementation-packet-latest",
    generatedAt: packet.generatedAt,
    status: packet.status,
    stateHash: packet.stateHash,
    readiness: packet.readiness,
    tasks: tasks.length,
    state: repoRel(root, statePath),
    taskLedger: repoRel(root, tasksPath),
    selectorTable: repoRel(root, selectorPath)
  });
  writeText(reportMd, reportMarkdown(packet));
  const inboxPacket = {
    id: `${PACKET_ID}-${Date.now()}`,
    ts: packet.generatedAt,
    source: "Asolaria-canonical",
    reason: "free_claude_code_supervisor_implementation_packet",
    mode: "append",
    text: [
      "BEHCS256_PACKET V1",
      "MODE=SUPERVISOR_IMPLEMENTATION_PACKET",
      `STATE=${repoRel(root, statePath)}`,
      `TASKS=${repoRel(root, tasksPath)}`,
      `SELECTOR=${repoRel(root, selectorPath)}`,
      `READINESS=${packet.readiness.status}`,
      "SUMMON=Helm Gaia Dasein Sentinel Falcon Vector Rook Brain Selector Omnispindles Omniflywheels KR",
      "BOUNDARY=planning-only; no install; no proxy start; no Claude env mutation; no admin-terminal attach; no secret read."
    ].join("\n")
  };
  for (const inbox of [
    rel(root, "runtime/admin-terminals/helm/inbox.ndjson"),
    rel(root, "runtime/admin-terminals/sentinel/inbox.ndjson"),
    rel(root, "runtime/gaia-inbox.ndjson"),
    rel(root, "runtime/dasein-inbox.ndjson"),
    rel(root, "runtime/outbound-liris-inbox.ndjson")
  ]) {
    appendNdjson(inbox, inboxPacket);
  }
  appendNdjson(rel(root, "data/behcs/outbox.ndjson"), {
    id: `${PACKET_ID}-OUTBOX-${Date.now()}`,
    ts: packet.generatedAt,
    from: "asolaria-canonical",
    to: "named-agent-team",
    verb: "FREE_CLAUDE_CODE_SUPERVISOR_IMPLEMENTATION_PACKET_MINTED",
    body: {
      stateHash: packet.stateHash,
      state: repoRel(root, statePath),
      tasks: repoRel(root, tasksPath),
      selectorTable: repoRel(root, selectorPath),
      readiness: packet.readiness.status
    }
  });
  return {
    ok: true,
    stateHash: packet.stateHash,
    readiness: packet.readiness.status,
    state: repoRel(root, statePath),
    tasks: repoRel(root, tasksPath),
    selectorTable: repoRel(root, selectorPath),
    report: repoRel(root, reportMd),
    taskCount: tasks.length
  };
}

if (require.main === module) {
  console.log(JSON.stringify(writePacket(), null, 2));
}

module.exports = {
  RUN_ID,
  PACKET_ID,
  REPO_URL,
  CLAIMED_LOCAL_PATH,
  buildPacket,
  buildSelectorTable,
  implementationTasks,
  observeGitCommit,
  writePacket
};
