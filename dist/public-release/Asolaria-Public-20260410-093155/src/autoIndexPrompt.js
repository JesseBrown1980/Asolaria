/**
 * Auto-index extraction prompt for Asolaria's IX taxonomy.
 *
 * Adapted from Claude Code's eval-validated memory extraction prompts
 * (src/services/extractMemories/prompts.ts + src/memdir/memoryTypes.ts).
 *
 * Key techniques carried over from Claude Code evals:
 *   - Turn budget optimization: parallel reads turn 1, parallel writes turn 2
 *   - No investigation rule: extract only from conversation, never grep/verify
 *   - Explicit-save gate: reject activity logs, ask for the surprising part
 *   - Drift caveat: IX entries are snapshots, verify before acting on them
 *   - Duplicate check: always scan existing entries before creating new ones
 *
 * Asolaria differences:
 *   - 11 canonical types (not 4)
 *   - IX-numbered entries with frontmatter (ix, name, type, tags, chain, agents)
 *   - CATALOG.md index per type directory (not MEMORY.md flat index)
 *   - Chain links between entries (Claude Code has no equivalent)
 *   - Multi-agent attribution (agents field)
 */

"use strict";

const { CANONICAL_TYPES } = require("./index-kernel/schema");

// ---------------------------------------------------------------------------
// Type definitions — maps Claude Code's 4-type taxonomy onto Asolaria's 11
// ---------------------------------------------------------------------------

const TYPE_DEFINITIONS = {
  // ---- Claude Code "user" splits into identity ----
  identity: {
    description:
      "Information about Jesse, colonies, devices, accounts, or agent identities. " +
      "Build understanding of who operates the system and how roles map.",
    when: "When you learn identity details: account mappings, device names, agent roles, colony ownership.",
    examples: [
      "Jesse's work email is jessebrown.soft1980@gmail.com, used for Monday and Bitbucket",
      "Falcon is Jesse's Samsung Galaxy S24 FE, reachable via Termux SSH on port 8022",
    ],
  },

  // ---- Claude Code "feedback" splits into mistake, rule, policy ----
  mistake: {
    description:
      "Something that went wrong and must not repeat. The anti-pattern, why it failed, " +
      "and the corrective action. Mistakes are the strongest learning signal.",
    when:
      'When an agent or Jesse identifies a failure ("that broke because...", "never do X again"). ' +
      "Include root cause and the fix. Corrections are loud; don't miss them.",
    examples: [
      "Port 18886 is a myth (IX-142) — never start a second MQTT broker",
      "Using module-level constants for paths breaks test isolation; use dynamic getters",
    ],
  },
  rule: {
    description:
      "A hard constraint that agents must follow unconditionally. Rules are non-negotiable. " +
      "They come from Jesse's direct orders or from incidents severe enough to become law.",
    when:
      'When Jesse declares a HARD RULE or absolute constraint ("always", "never", "must"). ' +
      "Rules override patterns and policies when they conflict.",
    examples: [
      "3 reviewers always, Gaia leads, NEVER push to Bitbucket unless Jesse says so IN WRITING",
      "Dev breaks, staging validates, prod is sacred. Liris controls pipeline.",
    ],
  },
  policy: {
    description:
      "A softer guideline or process that agents should follow but that admits exceptions. " +
      "Policies describe the default approach; rules describe the hard boundary.",
    when: "When Jesse describes a preferred workflow, default process, or convention that has known exceptions.",
    examples: [
      "Use --ignore-scripts on Node 24 for QDD projects",
      "Prefer editing existing files over creating new ones",
    ],
  },

  // ---- Claude Code "project" maps directly ----
  project: {
    description:
      "Information about ongoing work, goals, initiatives, bugs, incidents, or session state " +
      "that is NOT derivable from code or git. Includes status snapshots and blockers.",
    when:
      "When you learn who is doing what, why, or by when. Convert relative dates to absolute. " +
      "Project entries decay fast; include WHY so future agents can judge staleness.",
    examples: [
      "QDD EZ Protect feature complete 2026-03-13, SFTP fixes remaining",
      "Home internet down 2026-03-22, running on neighbor wifi, IPs in flux",
    ],
  },

  // ---- Claude Code "reference" maps directly ----
  reference: {
    description:
      "Pointers to where information lives: URLs, file paths, external systems, API endpoints. " +
      "References let agents find authoritative sources without searching.",
    when:
      "When you learn about external resources (Monday boards, Slack channels, Linear projects, " +
      "config files, dashboard URLs) and their purpose.",
    examples: [
      "QDD Monday board: jessebrown.soft1980@gmail.com account",
      "Grafana latency dashboard at grafana.internal/d/api-latency — oncall watches this",
    ],
  },

  // ---- Asolaria-native types (no Claude Code equivalent) ----
  pattern: {
    description:
      "A recurring approach or orchestration loop that works. Patterns are positive knowledge: " +
      "the way things SHOULD be done, validated through use.",
    when:
      "When an approach is confirmed to work, especially if non-obvious. Watch for quiet " +
      'confirmations ("yes exactly", "perfect") not just corrections.',
    examples: [
      "Gaia orchestration loop: Plan, Delegate, Monitor, Index, Handoff",
      "3-and-3 rule: 3 scouts research, 3 reviewers verify, then execute",
    ],
  },
  skill: {
    description:
      "A concrete capability an agent has learned: a command sequence, an API integration, " +
      "a tool usage pattern. Skills are executable knowledge.",
    when: "When an agent successfully completes a new type of action and the steps should be recorded for reuse.",
    examples: [
      "WhatsApp ADB Send: agent-to-agent comms via phone with zero servers",
      "SFTP key rotation: generate, deploy, verify, update vault",
    ],
  },
  tool: {
    description:
      "A tool, service, or infrastructure component that agents interact with. " +
      "Records what it is, how to access it, and known gotchas.",
    when: "When a new tool is introduced or an existing tool's behavior is documented.",
    examples: [
      "Omnispindle MCP: status endpoint at /api/omnispindle/status, requires Bearer token",
      "CH341A programmer: the parachute for firmware-level sovereignty",
    ],
  },
  plan: {
    description:
      "A future action or multi-step strategy that has been decided but not yet completed. " +
      "Plans track intent so agents can pick up where others left off.",
    when: "When Jesse or an agent commits to a future action with concrete steps.",
    examples: [
      "Sovereignty Phase 4: bare metal boot from CH341A, pending hardware arrival",
      "QDD PR split: classify into SFTP, EZ Protect, pnpm10/tooling, and drop/defer lanes",
    ],
  },
  task: {
    description:
      "A discrete unit of work assigned to a specific agent or colony. " +
      "Tasks have an owner, a deliverable, and a done-state.",
    when: "When work is assigned with a clear owner and completion criteria.",
    examples: [
      "Liris: run eBacMap smoke test suite on staging before Brian review",
      "Gaia: compile unified agent index after sovereignty kernel deploy",
    ],
  },
};

// ---------------------------------------------------------------------------
// What NOT to index — adapted from Claude Code's eval-validated exclusions
// ---------------------------------------------------------------------------

const WHAT_NOT_TO_INDEX = [
  "## What NOT to index",
  "",
  "- Code patterns, architecture, file paths, or project structure derivable by reading the codebase.",
  "- Git history, recent changes, or who-changed-what — `git log` / `git blame` are authoritative.",
  "- Debugging solutions or fix recipes — the fix is in the code; the commit message has context.",
  "- Anything already in CLAUDE.md, AGENTS.md, or existing IX/LX entries.",
  "- Ephemeral task details: in-progress work, temporary state, current conversation context.",
  "",
  "These exclusions apply even when Jesse explicitly asks you to save. If he asks you to save " +
    "a PR list or activity summary, ask what was *surprising* or *non-obvious* about it — " +
    "that is the part worth keeping.",
].join("\n");

// ---------------------------------------------------------------------------
// IX frontmatter format
// ---------------------------------------------------------------------------

const FRONTMATTER_FORMAT = [
  "## IX entry format",
  "",
  "Every IX entry is a markdown file with YAML frontmatter:",
  "",
  "```markdown",
  "---",
  "ix: {{next available number}}",
  "name: {{short descriptive name}}",
  `type: {{${CANONICAL_TYPES.join(", ")}}}`,
  "tags: [{{comma-separated relevant tags}}]",
  "chain: [{{IX/LX numbers this entry relates to, e.g. IX-002, IX-005}}]",
  "agents: [{{which agents this applies to, e.g. gaia, liris, asolaria}}]",
  "---",
  "",
  "# {{Title}}",
  "",
  "{{Body: lead with the fact/rule/pattern, then **Why:** and **How to apply:** lines.}}",
  "```",
  "",
  "File naming: `IX-{{number}}.md` inside the type directory (e.g., `patterns/IX-001.md`).",
  "CATALOG update: add one line to the type's `CATALOG-{{TYPE}}.md` with IX number, name, and chain.",
].join("\n");

// ---------------------------------------------------------------------------
// Main prompt builder
// ---------------------------------------------------------------------------

/**
 * Build the auto-index extraction prompt.
 *
 * @param {Array<{role: string, content: string}>} recentTurns - Last N conversation turns
 * @param {Array<{ix: number, name: string, type: string}>} existingEntries - Current IX entries summary
 * @returns {string} The complete prompt for the background extraction agent
 */
function buildAutoIndexPrompt(recentTurns, existingEntries) {
  const turnCount = Array.isArray(recentTurns) ? recentTurns.length : 0;
  const existingManifest = formatExistingEntries(existingEntries);

  const sections = [
    // --- Opener (adapted from Claude Code's opener function) ---
    buildOpener(turnCount, existingManifest),

    // --- Type taxonomy ---
    buildTypeSection(),

    // --- Exclusions ---
    WHAT_NOT_TO_INDEX,

    // --- Frontmatter format ---
    FRONTMATTER_FORMAT,

    // --- Chain guidance ---
    buildChainGuidance(),

    // --- Output instructions ---
    buildOutputInstructions(),
  ];

  return sections.join("\n\n");
}

// ---------------------------------------------------------------------------
// Section builders
// ---------------------------------------------------------------------------

function buildOpener(turnCount, existingManifest) {
  const manifest =
    existingManifest.length > 0
      ? `\n\n## Existing IX entries\n\n${existingManifest}\n\nCheck this list before writing. Update an existing entry rather than creating a duplicate.`
      : "";

  return [
    `You are the index extraction subagent for Asolaria. Analyze the most recent ~${turnCount} conversation turns and extract IX entries for the agent index.`,
    "",
    "You have a limited turn budget. The efficient strategy is:",
    "  Turn 1 — read all files you might update (parallel reads).",
    "  Turn 2 — write/edit all entries and catalogs (parallel writes).",
    "Do NOT interleave reads and writes across multiple turns.",
    "",
    `You MUST only use content from the last ~${turnCount} turns to create or update entries. ` +
      "Do NOT waste turns investigating or verifying content — no grepping source files, " +
      "no reading code to confirm patterns, no git commands. " +
      "The conversation is your only source of truth for this extraction." +
      manifest,
  ].join("\n");
}

function buildTypeSection() {
  const typeBlocks = CANONICAL_TYPES.map((typeName) => {
    const def = TYPE_DEFINITIONS[typeName];
    if (!def) return `  <type><name>${typeName}</name></type>`;

    const exampleLines = (def.examples || [])
      .map((ex) => `      - ${ex}`)
      .join("\n");

    return [
      "  <type>",
      `    <name>${typeName}</name>`,
      `    <description>${def.description}</description>`,
      `    <when_to_save>${def.when}</when_to_save>`,
      "    <examples>",
      exampleLines,
      "    </examples>",
      "  </type>",
    ].join("\n");
  });

  return ["## IX entry types", "", "<types>", ...typeBlocks, "</types>"].join(
    "\n"
  );
}

function buildChainGuidance() {
  return [
    "## Chain linking",
    "",
    "Every IX entry should reference related entries in its `chain` field.",
    "Chains are how agents navigate the index — an entry without chains is an orphan.",
    "",
    "- If a mistake leads to a rule, chain them: mistake -> rule.",
    "- If a pattern uses a skill, chain them: pattern -> skill.",
    "- If a plan spawns tasks, chain them: plan -> task, task, task.",
    "- If a project references tools, chain them: project -> tool.",
    "- Use bidirectional chains: if IX-100 chains to IX-050, IX-050 should chain back.",
    "",
    "When updating an existing entry's chain, append — never remove existing chain links.",
  ].join("\n");
}

function buildOutputInstructions() {
  return [
    "## How to save entries",
    "",
    "For each entry you extract:",
    "",
    "1. Determine the type from the taxonomy above.",
    "2. Pick the next available IX number (check existing entries).",
    "3. Write the .md file to the correct type directory.",
    "4. Add a one-line entry to that type's CATALOG file.",
    "",
    "Organize entries semantically by topic, not chronologically.",
    "Update or remove entries that are wrong or outdated.",
    "Do not create duplicate entries — update existing ones instead.",
    "",
    "If Jesse explicitly asks you to index something, do it immediately as whichever type fits best.",
    "If he asks you to forget or remove something, find and delete the relevant entry.",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatExistingEntries(entries) {
  if (!Array.isArray(entries) || entries.length === 0) return "";

  return entries
    .map((e) => {
      const ix = String(e.ix || "???").padStart(3, "0");
      const type = (e.type || "unknown").padEnd(10);
      const name = e.name || "(unnamed)";
      return `| IX-${ix} | ${type} | ${name} |`;
    })
    .join("\n");
}

module.exports = { buildAutoIndexPrompt };
