#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const VOTE_ID = "V6-FREE-CLAUDE-CODE-WHITE-ROOM-INGEST-20260428";
const RUN_ID = "free-claude-code-white-room-ingest-20260428";

const DISPOSITIONS = Object.freeze({
  "fcc.white_room.proxy_adapter": {
    disposition: "RESHAPE_AS_OPTIONAL_VERSIONED_ADAPTER",
    reason: "v6 approves the idea, but proxy adoption must be service-isolated and version-pinned."
  },
  "fcc.white_room.selector_table": {
    disposition: "ABSORB_SELECTOR_TABLE_IDEA",
    reason: "Low-blast idea: Claude tier routing maps cleanly to Asolaria model selector policy."
  },
  "fcc.white_room.local_provider_lanes": {
    disposition: "RESHAPE_UNDER_ROOK_SELECTOR",
    reason: "Local provider lanes are useful, but require capability probes for context length and tool use."
  },
  "fcc.white_room.security_logging": {
    disposition: "HOLD_SECURITY_POLICY_REQUIRED",
    reason: "Credentials, raw logging, and private-network fetch flags require Sentinel/KR deny rules before any run."
  },
  "fcc.white_room.version_control_update": {
    disposition: "RESHAPE_AS_REAL_UPDATE_DISCIPLINE",
    reason: "This is Jesse's main value: pinned version, review, rollback, and no live-terminal self-replacement."
  },
  "fcc.white_room.admin_terminal_integration": {
    disposition: "DEFER_UNTIL_BOOT_WAKE_AND_SELF_UPDATE_GUARDS",
    reason: "Admin-terminal integration should wait for compression-wake identity and self-update guard gates."
  }
});

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

function buildDecision(options = {}) {
  const root = rootDir(options);
  const generatedAt = options.generatedAt || new Date().toISOString();
  const votePath = rel(root, `data/votes/${VOTE_ID}/behcs-v6-candidate-file.json`);
  const packetPath = rel(root, `data/behcs/orchestration/${RUN_ID}/free-claude-code-white-room-v6-candidate-packet.json`);
  const vote = readJson(votePath, {});
  const packet = readJson(packetPath, {});
  const voteRows = Array.isArray(vote.results) ? vote.results : [];
  const candidateById = new Map((packet.candidates || []).map((candidate) => [candidate.id, candidate]));
  const dispositions = voteRows.map((row) => {
    const id = row.candidate_id || row.id || "";
    const candidate = candidateById.get(id) || {};
    const overlay = DISPOSITIONS[id] || {
      disposition: row.verdict === "PROCEED" ? "RESHAPE_UNDER_WHITE_ROOM" : "HOLD",
      reason: "No explicit overlay; preserve White Room review boundary."
    };
    return {
      candidate: id,
      label: row.candidate_label || candidate.label || id,
      v6Verdict: row.verdict || "",
      confidence: Number(row.avgConfidence || row.confidence || 0),
      beats: Number(row.totalBeats || 0),
      proposedDisposition: overlay.disposition,
      overlayReason: overlay.reason,
      originalProposedDisposition: candidate.metadata && candidate.metadata.proposedDisposition || ""
    };
  });
  const decision = {
    schema: "free-claude-code-white-room-decision.v1",
    generatedAt,
    status: "WHITE_ROOM_V6_REVIEW_COMPLETE_READY_FOR_SUPERVISOR_IMPLEMENTATION_PLAN",
    voteId: VOTE_ID,
    votePath: repoRel(root, votePath),
    packetPath: repoRel(root, packetPath),
    summary: {
      candidates: dispositions.length,
      proceed: dispositions.filter((row) => row.v6Verdict === "PROCEED").length,
      hold: dispositions.filter((row) => row.v6Verdict === "HOLD").length,
      block: dispositions.filter((row) => row.v6Verdict === "BLOCK").length,
      totalBeats: Number(vote.totalBeats || dispositions.reduce((sum, row) => sum + row.beats, 0)),
      executorDispatches: Number(vote.executorDispatches || 0)
    },
    dispositions,
    implementationPlan: [
      "Pin the exact Free Claude Code commit before any local import; do not use a moving branch as runtime authority.",
      "Run read-only code review and tests in quarantine; record license, dependencies, network surfaces, and logging flags.",
      "Extract the model-tier selector table into Asolaria's selector/brain policy as data, not as a replacement launcher.",
      "Prefer local/free provider lanes first: LM Studio, llama.cpp, Ollama; hosted providers require explicit key and rate-limit gates.",
      "Create a service-isolated proxy plan on a non-conflicting port with rollback and health probes.",
      "Add Sentinel/KR policy for token handling, raw prompt logging, private-network fetch, and Claude environment variables.",
      "Do not connect admin terminals until active-session marker, compression-wake identity, and self-update guards are all enforced."
    ],
    boundaries: {
      noInstall: true,
      noProxyStart: true,
      noClaudeEnvMutation: true,
      noCanonPromotion: true,
      noExecutorDispatch: true
    }
  };
  decision.stateHash = sha256Text(JSON.stringify({
    generatedAt,
    voteId: decision.voteId,
    summary: decision.summary,
    dispositions: decision.dispositions,
    implementationPlan: decision.implementationPlan,
    boundaries: decision.boundaries
  }));
  return { root, decision };
}

function decisionMarkdown(decision) {
  const rows = decision.dispositions
    .map((row) => `| ${row.candidate} | ${row.v6Verdict} | ${row.confidence.toFixed(4)} | ${row.proposedDisposition} |`)
    .join("\n");
  return `# Free Claude Code White Room Decision

Generated: ${decision.generatedAt}

Status: ${decision.status}

State hash: \`${decision.stateHash}\`

Vote: \`${decision.voteId}\`

Total beats: ${decision.summary.totalBeats}

Executor dispatches: ${decision.summary.executorDispatches}

## Dispositions

| Candidate | v6 | Confidence | White Room disposition |
| --- | --- | --- | --- |
${rows}

## Implementation Plan

${decision.implementationPlan.map((item, index) => `${index + 1}. ${item}`).join("\n")}

Boundary: no install, no proxy start, no Claude environment mutation, no canon promotion, no executor dispatch.
`;
}

function writeDecision(options = {}) {
  const { root, decision } = buildDecision(options);
  const runRoot = rel(root, `data/behcs/orchestration/${RUN_ID}`);
  const statePath = path.join(runRoot, "free-claude-code-white-room-decision.v1.json");
  const reportPath = rel(root, "reports/free-claude-code-white-room-decision-latest.md");
  writeJson(statePath, decision);
  writeText(reportPath, decisionMarkdown(decision));
  const packet = {
    id: `FCC-WHITE-ROOM-DECISION-${Date.now()}`,
    ts: decision.generatedAt,
    source: "Asolaria-canonical",
    reason: "white_room_decision_ready",
    mode: "append",
    text: [
      "BEHCS256_PACKET V1",
      "MODE=WHITE_ROOM_DECISION",
      `VOTE=${decision.voteId}`,
      `STATE=${repoRel(root, statePath)}`,
      `REPORT=${repoRel(root, reportPath)}`,
      "RESULT=v6 all PROCEED, authority overlay: absorb selector idea, reshape proxy/update, hold security, defer admin-terminal wiring.",
      "NEXT=supervisor-authored implementation packet only; no install/proxy/env mutation yet."
    ].join("\n")
  };
  for (const inbox of [
    rel(root, "runtime/admin-terminals/helm/inbox.ndjson"),
    rel(root, "runtime/admin-terminals/sentinel/inbox.ndjson"),
    rel(root, "runtime/gaia-inbox.ndjson"),
    rel(root, "runtime/dasein-inbox.ndjson"),
    rel(root, "runtime/outbound-liris-inbox.ndjson")
  ]) {
    appendNdjson(inbox, packet);
  }
  return {
    ok: true,
    stateHash: decision.stateHash,
    state: repoRel(root, statePath),
    report: repoRel(root, reportPath),
    dispositions: decision.dispositions.length,
    totalBeats: decision.summary.totalBeats
  };
}

if (require.main === module) {
  console.log(JSON.stringify(writeDecision(), null, 2));
}

module.exports = {
  VOTE_ID,
  RUN_ID,
  DISPOSITIONS,
  buildDecision,
  writeDecision
};
