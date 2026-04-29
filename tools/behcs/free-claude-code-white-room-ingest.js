#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const RUN_ID = "free-claude-code-white-room-ingest-20260428";
const VOTE_ID = "V6-FREE-CLAUDE-CODE-WHITE-ROOM-INGEST-20260428";
const INTAKE_RUN = "free-claude-code-github-solution-intake-20260428";

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

function sha256Text(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_error) {
    return fallback;
  }
}

function paths(root) {
  const runRoot = rel(root, `data/behcs/orchestration/${RUN_ID}`);
  return {
    runRoot,
    packet: path.join(runRoot, "free-claude-code-white-room-v6-candidate-packet.json"),
    plan: path.join(runRoot, "free-claude-code-white-room-plan.v1.json"),
    tasks: path.join(runRoot, "free-claude-code-white-room-tasks.ndjson"),
    reportJson: rel(root, "reports/free-claude-code-white-room-ingest-latest.json"),
    reportMd: rel(root, "reports/free-claude-code-white-room-ingest-latest.md"),
    intake: rel(root, `data/behcs/orchestration/${INTAKE_RUN}/free-claude-code-github-solution-intake.v1.json`),
    voteOutput: rel(root, `data/votes/${VOTE_ID}/behcs-v6-candidate-file.json`)
  };
}

function candidate(id, label, cube, summary, gates, metadata = {}) {
  return {
    id,
    label,
    cube,
    primary_cube: cube,
    action: "white_room_plan_review",
    expected_outcome: "READY/HOLD/BLOCK disposition for a version-controlled optional update path.",
    next_step: "If PROCEED, convert into supervisor-authored implementation packet; otherwise hold or reject.",
    metadata: {
      scope_hours: 2,
      planningOnly: true,
      source: "free-claude-code github solution intake",
      summary,
      requiredGates: gates,
      ...metadata
    }
  };
}

function buildCandidates(intakeRef) {
  return [
    candidate(
      "fcc.white_room.proxy_adapter",
      "White Room: optional Anthropic-compatible proxy adapter",
      704969,
      "Evaluate whether Free Claude Code can be a version-controlled optional adapter for Claude-style clients without replacing Asolaria boot discipline.",
      ["helm_director_review", "sentinel_kr_security_review", "operator_when_if_cosign"],
      { blastRadius: "medium", proposedDisposition: "RESHAPE_AS_OPTIONAL_ADAPTER", intakeStateHash: intakeRef.stateHash || "" }
    ),
    candidate(
      "fcc.white_room.selector_table",
      "White Room: choosable model selector table",
      3307949,
      "Extract MODEL_OPUS, MODEL_SONNET, MODEL_HAIKU, and fallback MODEL routing into Asolaria's selector/brain policy table.",
      ["selector_table_schema", "brain_router_mapping", "task_class_tests"],
      { blastRadius: "low", proposedDisposition: "ABSORB_AS_SELECTOR_IDEA", intakeStateHash: intakeRef.stateHash || "" }
    ),
    candidate(
      "fcc.white_room.local_provider_lanes",
      "White Room: local provider lanes for LM Studio, llama.cpp, and Ollama",
      5929741,
      "Plan local-provider integration for fast free/local tasks while preserving provider capability checks and context/tool-use gates.",
      ["local_service_probe", "context_length_gate", "tool_use_capability_gate"],
      { blastRadius: "medium", proposedDisposition: "RESHAPE_UNDER_ROOK_SELECTOR", intakeStateHash: intakeRef.stateHash || "" }
    ),
    candidate(
      "fcc.white_room.security_logging",
      "White Room: credentials, logging, and private-network safety",
      7189057,
      "Review token handling, raw payload logging flags, private-network web fetch flags, and secret isolation before any proxy is started.",
      ["sentinel_kr_deny_rules", "no_raw_prompt_logging", "secret_material_boundary", "private_network_fetch_gate"],
      { blastRadius: "high", proposedDisposition: "HOLD_UNTIL_SECURITY_POLICY", intakeStateHash: intakeRef.stateHash || "" }
    ),
    candidate(
      "fcc.white_room.version_control_update",
      "White Room: real version-controlled update mechanism",
      3869893,
      "Use the repo as a model for a real update path: pinned commit, review, rollback, service isolation, and no live terminal self-replacement.",
      ["pinned_commit", "rollback_plan", "active_terminal_self_update_guard", "white_room_diff_review"],
      { blastRadius: "high", proposedDisposition: "RESHAPE_AS_UPDATE_DISCIPLINE", intakeStateHash: intakeRef.stateHash || "" }
    ),
    candidate(
      "fcc.white_room.admin_terminal_integration",
      "White Room: admin-terminal integration boundary",
      3442951,
      "Decide how Claude/Codex admin terminals may use the proxy when/if combined without uninstalling boot locks, active-session markers, or model selector safeguards.",
      ["boot_manifest_check", "active_session_marker_check", "adapter_no_overwrite", "operator_gate"],
      { blastRadius: "high", proposedDisposition: "DEFER_UNTIL_33A_4_AND_33A_2", intakeStateHash: intakeRef.stateHash || "" }
    )
  ];
}

function buildBundle(options = {}) {
  const root = rootDir(options);
  const p = paths(root);
  const generatedAt = options.generatedAt || new Date().toISOString();
  const intake = readJson(p.intake, {});
  const candidates = buildCandidates(intake);
  const packet = {
    vote_id: VOTE_ID,
    generatedAt,
    mode: "white-room-github-solution-ingest",
    taskId: RUN_ID,
    purpose: "Ingest Jesse's Free Claude Code GitHub solution into BEHCS White Rooms as a real version-controlled update candidate, not as an unreviewed install.",
    source: {
      intakeState: repoRel(root, p.intake),
      intakeStateHash: intake.stateHash || "",
      github: "https://github.com/Alishahryar1/free-claude-code"
    },
    executionPolicy: {
      planningOnly: true,
      spawnWorkers: false,
      executorDispatches: false,
      externalApiCalls: false,
      installDependencies: false,
      mutateClaudeEnv: false,
      startProxy: false,
      promoteToCanon: false
    },
    supervisorSlots: [
      "PROF-WHITEROOM",
      "PROF-HOOKWALL",
      "PROF-HERMES",
      "PROF-SHANNON",
      "PROF-KERNEL",
      "PROF-GC",
      "PROF-SELECTOR",
      "PROF-ROOK",
      "PROF-SENTINEL-KR",
      "COL-ASOLARIA"
    ],
    candidates
  };
  const tasks = candidates.map((item, index) => ({
    taskId: `FCC-WR-${String(index + 1).padStart(2, "0")}`,
    generatedAt,
    status: "PLANNED_WHITE_ROOM_REVIEW",
    candidate: item.id,
    label: item.label,
    owner: index === 1 ? "selector" : index === 3 ? "sentinel-kr" : index === 4 ? "helm-rook" : "white-rooms",
    evidence: [repoRel(root, p.intake)],
    executionAllowed: false,
    requestedOutput: "READY/HOLD/BLOCK plus integration improvement plan"
  }));
  const plan = {
    planId: RUN_ID,
    generatedAt,
    status: "WHITE_ROOM_PACKET_READY_PENDING_V6",
    stateHash: "",
    purpose: packet.purpose,
    candidates: candidates.map((item) => ({ id: item.id, proposedDisposition: item.metadata.proposedDisposition, blastRadius: item.metadata.blastRadius })),
    boundary: packet.executionPolicy,
    outputs: {
      packet: repoRel(root, p.packet),
      tasks: repoRel(root, p.tasks),
      voteOutput: repoRel(root, p.voteOutput)
    }
  };
  plan.stateHash = sha256Text(JSON.stringify({
    generatedAt,
    intakeHash: intake.stateHash || "",
    candidates,
    boundary: packet.executionPolicy
  }));
  packet.stateHash = plan.stateHash;
  const report = {
    reportId: "free-claude-code-white-room-ingest-latest",
    generatedAt,
    status: plan.status,
    stateHash: plan.stateHash,
    candidateCount: candidates.length,
    voteId: VOTE_ID,
    packet: repoRel(root, p.packet),
    voteOutput: repoRel(root, p.voteOutput),
    boundary: packet.executionPolicy
  };
  return { root, paths: p, packet, plan, tasks, report };
}

function reportMarkdown(report) {
  return `# Free Claude Code White Room Ingest

Generated: ${report.generatedAt}

Status: ${report.status}

State hash: \`${report.stateHash}\`

Vote id: \`${report.voteId}\`

Candidates: ${report.candidateCount}

Packet: \`${report.packet}\`

Vote output: \`${report.voteOutput}\`

Boundary: planning-only, no install, no proxy start, no Claude environment mutation, no canon promotion.
`;
}

function writeBundle(options = {}) {
  const bundle = buildBundle(options);
  writeJson(bundle.paths.packet, bundle.packet);
  writeJson(bundle.paths.plan, bundle.plan);
  writeText(bundle.paths.tasks, bundle.tasks.map((task) => JSON.stringify(task)).join("\n"));
  writeJson(bundle.paths.reportJson, bundle.report);
  writeText(bundle.paths.reportMd, reportMarkdown(bundle.report));
  const packet = {
    id: `FCC-WHITE-ROOM-INGEST-${Date.now()}`,
    ts: bundle.report.generatedAt,
    source: "Asolaria-canonical",
    reason: "white_room_github_solution_ingest",
    mode: "append",
    text: [
      "BEHCS256_PACKET V1",
      "MODE=WHITE_ROOM_PLAN_REVIEW",
      `RUN=${RUN_ID}`,
      `VOTE=${VOTE_ID}`,
      `PACKET=${repoRel(bundle.root, bundle.paths.packet)}`,
      `REPORT=${repoRel(bundle.root, bundle.paths.reportMd)}`,
      "BOUNDARY=planning-only; no install; no proxy start; no Claude env mutation.",
      "PURPOSE=use our faster BEHCS/WhiteRoom system to improve the GitHub solution before any real update."
    ].join("\n")
  };
  for (const inbox of [
    rel(bundle.root, "runtime/admin-terminals/helm/inbox.ndjson"),
    rel(bundle.root, "runtime/admin-terminals/sentinel/inbox.ndjson"),
    rel(bundle.root, "runtime/gaia-inbox.ndjson"),
    rel(bundle.root, "runtime/dasein-inbox.ndjson"),
    rel(bundle.root, "runtime/outbound-liris-inbox.ndjson")
  ]) {
    appendNdjson(inbox, packet);
  }
  return {
    ok: true,
    stateHash: bundle.plan.stateHash,
    packet: repoRel(bundle.root, bundle.paths.packet),
    voteOutput: repoRel(bundle.root, bundle.paths.voteOutput),
    report: repoRel(bundle.root, bundle.paths.reportMd),
    candidates: bundle.packet.candidates.length
  };
}

if (require.main === module) {
  console.log(JSON.stringify(writeBundle(), null, 2));
}

module.exports = {
  RUN_ID,
  VOTE_ID,
  buildBundle,
  buildCandidates,
  writeBundle
};
