#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { execFileSync } = require("node:child_process");

const RUN_ID = "free-claude-code-github-solution-intake-20260428";
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

function sha256Text(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function commandVersion(command, args = ["--version"]) {
  try {
    return {
      ok: true,
      value: execFileSync(command, args, { encoding: "utf8", timeout: 10000 }).trim()
    };
  } catch (error) {
    return {
      ok: false,
      value: String(error && error.message || error)
    };
  }
}

function buildState(options = {}) {
  const root = rootDir(options);
  const generatedAt = options.generatedAt || new Date().toISOString();
  const runRoot = rel(root, `data/behcs/orchestration/${RUN_ID}`);
  const localExists = fs.existsSync(CLAIMED_LOCAL_PATH);
  const tools = {
    uv: commandVersion("uv"),
    python: commandVersion("python"),
    claude: commandVersion("claude"),
    git: commandVersion("git")
  };
  const state = {
    schema: "free-claude-code-github-solution-intake.v1",
    generatedAt,
    status: "RESEARCH_INPUT_READY_NOT_EXECUTED",
    source: {
      repoUrl: REPO_URL,
      claimedLocalPath: CLAIMED_LOCAL_PATH,
      claimedLocalPathObserved: localExists
    },
    observedFromGithubReadme: {
      purpose: "Anthropic-compatible proxy for Claude Code and IDE clients.",
      providers: ["nvidia_nim", "open_router", "deepseek", "lmstudio", "llamacpp", "ollama"],
      routing: "MODEL_OPUS, MODEL_SONNET, MODEL_HAIKU, and fallback MODEL route Claude tiers to different providers.",
      modelPicker: "claude-pick can choose a launch model by appending the selected model to ANTHROPIC_AUTH_TOKEN.",
      serverDefault: "uvicorn server:app on port 8082; client uses ANTHROPIC_BASE_URL=http://localhost:8082",
      securityNotes: [
        "Raw payload and SSE logging flags can expose prompts and tool arguments.",
        "Private-network web fetch is disabled by default.",
        "Third-party code must be inspected before execution."
      ]
    },
    acerPrerequisites: {
      uv: tools.uv,
      python: tools.python,
      claude: tools.claude,
      git: tools.git,
      python314RequiredByProject: true,
      localPythonMeetsRequirement: /^Python 3\.14\./.test(tools.python.value || ""),
      readyToRunWithoutInstall: localExists && tools.uv.ok && /^Python 3\.14\./.test(tools.python.value || "")
    },
    routingDisposition: {
      useAs: "when_if_combined_selector_brain_proxy_candidate_research_input",
      doNotUseAs: [
        "authority artifact",
        "unreviewed executor",
        "credential store",
        "automatic replacement for existing Codex/Claude terminals"
      ],
      proposedAgentAssignments: {
        helm: "Evaluate as a version-controlled adapter candidate only when/if the team combines it.",
        selector: "Extract tier-to-provider model table idea for a real choosable selector.",
        brain: "Map task classes to Claude tier names and model policy without replacing existing boot discipline.",
        sentinel_kr: "Review credentials, logging, private-network fetch, and installation gates.",
        rook_gc: "Plan local service isolation, logs, retention, rollback, and version control if adopted."
      }
    },
    boundary: {
      noCloneRunObservedOnAcer: !localExists,
      noInstall: true,
      noSecretRead: true,
      noProxyStarted: true,
      noClaudeEnvironmentChanged: true
    }
  };
  state.stateHash = sha256Text(JSON.stringify({
    generatedAt,
    source: state.source,
    observedFromGithubReadme: state.observedFromGithubReadme,
    acerPrerequisites: state.acerPrerequisites,
    routingDisposition: state.routingDisposition,
    boundary: state.boundary
  }));
  return { root, runRoot, state };
}

function buildReport(state) {
  return `# Free Claude Code GitHub Solution Intake

Generated: ${state.generatedAt}

Status: ${state.status}

State hash: \`${state.stateHash}\`

Source: ${state.source.repoUrl}

Claimed local path: \`${state.source.claimedLocalPath}\`

Observed locally: ${state.source.claimedLocalPathObserved ? "yes" : "no"}

## What It Is

- Anthropic-compatible proxy for Claude Code.
- Routes Claude tier requests through provider backends: NVIDIA NIM, OpenRouter, DeepSeek, LM Studio, llama.cpp, and Ollama.
- Has a model-picker pattern that can select models at launch.

## ACER Readiness

- uv: ${state.acerPrerequisites.uv.ok ? state.acerPrerequisites.uv.value : "missing"}
- python: ${state.acerPrerequisites.python.value}
- claude: ${state.acerPrerequisites.claude.value}
- ready to run without install: ${state.acerPrerequisites.readyToRunWithoutInstall}

## Disposition

Treat as a WHEN/IF combined selector/brain proxy candidate. The value is the version-controlled model/proxy selection pattern. Do not run or install until Sentinel/KR and Helm approve the plan, credentials/logging policy, rollback, and integration boundary.
`;
}

function writeState(options = {}) {
  const { root, runRoot, state } = buildState(options);
  const statePath = path.join(runRoot, "free-claude-code-github-solution-intake.v1.json");
  const reportPath = rel(root, "reports/free-claude-code-github-solution-intake-latest.md");
  writeJson(statePath, state);
  writeText(reportPath, buildReport(state));
  const packet = {
    id: `FCC-GITHUB-SOLUTION-${Date.now()}`,
    ts: state.generatedAt,
    source: "Asolaria-canonical",
    reason: "github_solution_research_input",
    mode: "append",
    text: [
      "BEHCS256_PACKET V1",
      "MODE=PLAN_AMENDMENT_ONLY",
      `SOURCE=${state.source.repoUrl}`,
      `STATE=${repoRel(root, statePath)}`,
      `REPORT=${repoRel(root, reportPath)}`,
      "DISPOSITION=when_if_combined_selector_brain_proxy_candidate_research_input",
      "ASSIGN=Helm evaluate when/if combined, Selector extract model table, Brain map task classes, Sentinel/KR review security, Rook/GC plan service isolation and version rollback.",
      "BOUNDARY=no install, no proxy start, no secrets, no Claude env mutation until READY gate; this is Jesse's idea for real version-controlled model/proxy selection."
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
  appendNdjson(rel(root, "data/behcs/outbox.ndjson"), {
    id: `FCC-GITHUB-SOLUTION-OUTBOX-${Date.now()}`,
    ts: state.generatedAt,
    from: "asolaria-canonical",
    to: "named-agent-team",
    verb: "GITHUB_SOLUTION_RESEARCH_INPUT_RECORDED",
    body: {
      stateHash: state.stateHash,
      state: repoRel(root, statePath),
      report: repoRel(root, reportPath)
    }
  });
  return {
    ok: true,
    stateHash: state.stateHash,
    state: repoRel(root, statePath),
    report: repoRel(root, reportPath),
    localCloneObserved: state.source.claimedLocalPathObserved,
    readyToRunWithoutInstall: state.acerPrerequisites.readyToRunWithoutInstall
  };
}

if (require.main === module) {
  console.log(JSON.stringify(writeState(), null, 2));
}

module.exports = {
  RUN_ID,
  REPO_URL,
  CLAIMED_LOCAL_PATH,
  buildState,
  writeState
};
