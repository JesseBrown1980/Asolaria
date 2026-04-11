/**
 * coordinatorToolSurface.js
 *
 * Generates tool-surface declarations for Asolaria agent prompts.
 * When the orchestrator dispatches to sub-agents, this module tells each
 * agent exactly which verbs (tools) it can use — filtered by role and
 * reachable targets. Eliminates hallucinated tool calls.
 *
 * CommonJS, no dependencies beyond verb-table.json on disk.
 */

const fs = require("fs");
const path = require("path");
const { buildDeferredCatalog } = require("./deferredToolLoader");

const VERB_TABLE_PATH = path.join(
  __dirname,
  "..",
  "ix",
  "grammar",
  "verb-table.json"
);

// Permission tiers, ordered from least to most privileged.
// Each tier inherits every tier below it.
const PERMISSION_TIERS = [
  "observer",
  "operator",
  "trusted_agent",
  "super_admin",
  "owner",
];

/**
 * Load verb table from disk (fresh every call so hot-reloads work).
 * Returns the `verbs` array.
 */
function loadVerbs() {
  const raw = fs.readFileSync(VERB_TABLE_PATH, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed.verbs)) {
    throw new Error("verb-table.json missing verbs array");
  }
  return parsed.verbs;
}

/**
 * Returns the numeric index of a permission tier (0 = observer, 4 = owner).
 * Unrecognised tiers return -1 (no access).
 */
function tierIndex(tier) {
  const idx = PERMISSION_TIERS.indexOf(tier);
  return idx === -1 ? -1 : idx;
}

// ---------------------------------------------------------------------------
// Core filters
// ---------------------------------------------------------------------------

/**
 * Filter verbs by role permission tier.
 * A role can use any verb whose required permission is at or below its tier.
 *
 * @param {Array} verbs   — array of verb objects from verb-table.json
 * @param {string} role   — one of PERMISSION_TIERS
 * @returns {Array}       — filtered verb objects
 */
function filterVerbsByRole(verbs, role) {
  const ceiling = tierIndex(role);
  if (ceiling < 0) return [];
  return verbs.filter((v) => {
    const required = tierIndex(v.permission);
    return required >= 0 && required <= ceiling;
  });
}

/**
 * Filter verbs by reachable target domains.
 * Only keeps verbs that have at least one target in the provided set.
 *
 * @param {Array} verbs         — array of verb objects
 * @param {string[]} targets    — e.g. ["local","lan"]
 * @returns {Array}             — filtered verb objects
 */
function filterVerbsByTarget(verbs, targets) {
  if (!Array.isArray(targets) || targets.length === 0) return verbs;
  const allowed = new Set(targets);
  return verbs.filter((v) =>
    Array.isArray(v.targets) && v.targets.some((t) => allowed.has(t))
  );
}

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------

/**
 * Build a prompt section listing exactly what tools a sub-agent can use.
 *
 * @param {string}   agentRole       — permission tier of the agent
 * @param {string[]} [availableVerbs] — optional pre-filtered verb name list.
 *                                      If omitted, loads from verb-table and
 *                                      filters by role.
 * @param {string[]} [reachableTargets] — optional target filter
 * @returns {string} prompt fragment
 */
function buildToolSurfacePrompt(agentRole, availableVerbs, reachableTargets) {
  let verbs;

  if (Array.isArray(availableVerbs) && availableVerbs.length > 0) {
    // Caller passed explicit verb names — use them as-is
    verbs = availableVerbs.map((name) => ({ name, category: "explicit" }));
  } else {
    // Derive from verb-table
    let all = loadVerbs();
    all = filterVerbsByRole(all, agentRole);
    if (reachableTargets) {
      all = filterVerbsByTarget(all, reachableTargets);
    }
    verbs = all;
  }

  if (verbs.length === 0) {
    return [
      "## Available Tools",
      "",
      "You have NO tools available. You may only observe and report.",
    ].join("\n");
  }

  // Group by category for readability
  const grouped = {};
  for (const v of verbs) {
    const cat = v.category || "uncategorized";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(v.name);
  }

  const lines = [
    "## Available Tools",
    "",
    `Permission tier: **${agentRole}**`,
    `Total capabilities: ${verbs.length}`,
    "",
  ];

  const cats = Object.keys(grouped).sort();
  for (const cat of cats) {
    lines.push(`### ${cat}`);
    for (const name of grouped[cat].sort()) {
      lines.push(`- ${name}`);
    }
    lines.push("");
  }

  lines.push(
    "Do NOT call any tool not listed above. If you need a capability not listed, report it to the coordinator."
  );

  return lines.join("\n");
}

/**
 * Build the full coordinator prompt that tells the orchestrator what its
 * workers can do and how dispatch works.
 *
 * @param {Object} [opts]
 * @param {string[]} [opts.workerTools]     — explicit tool list for workers
 * @param {string}   [opts.workerRole]      — permission tier for workers (default: "operator")
 * @param {string[]} [opts.reachableTargets]— reachable target domains
 * @param {string[]} [opts.mcpServers]      — names of connected MCP servers
 * @returns {string} full coordinator system prompt section
 */
function getCoordinatorPrompt(opts) {
  const options = opts || {};
  const workerRole = options.workerRole || "operator";
  const reachableTargets = options.reachableTargets || null;

  // Resolve the tool list workers will see
  let workerVerbs;
  if (Array.isArray(options.workerTools) && options.workerTools.length > 0) {
    workerVerbs = options.workerTools;
  } else {
    let all = loadVerbs();
    all = filterVerbsByRole(all, workerRole);
    if (reachableTargets) {
      all = filterVerbsByTarget(all, reachableTargets);
    }
    workerVerbs = all.map((v) => v.name);
  }

  const toolList = workerVerbs.sort().map((t) => `  - ${t}`).join("\n");

  const lines = [
    "## Coordinator Declaration",
    "",
    "You are the orchestrator. You dispatch work to sub-agents. You do NOT execute tools directly.",
    "",
    `Workers operate at permission tier: **${workerRole}**`,
    "",
    "Workers have access to the following tools:",
    toolList,
    "",
    `Total worker capabilities: ${workerVerbs.length}`,
    "",
  ];

  if (Array.isArray(options.mcpServers) && options.mcpServers.length > 0) {
    lines.push(
      `Workers also have access to MCP tools from: ${options.mcpServers.join(", ")}`,
      ""
    );
  }

  lines.push(
    "### Dispatch Rules",
    "",
    "1. Workers only see their declared tools. They cannot discover new ones.",
    "2. If a task needs a tool outside the worker tier, escalate to a higher-tier agent or to Jesse.",
    "3. Workers report results back. You synthesize and relay to Jesse.",
    "4. Never fabricate worker results. Wait for actual completion.",
    "5. Each worker prompt MUST include its tool surface (use buildToolSurfacePrompt).",
    ""
  );

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Deferred verb catalog bridge
// ---------------------------------------------------------------------------

/**
 * Bridge between verb-table.json (name-keyed) and deferredToolLoader (id-keyed).
 *
 * Loads verbs from verb-table.json, maps each to the { id, description }
 * shape that deferredToolLoader.buildDeferredCatalog() expects, then returns
 * the deferred catalog.
 *
 * @returns {ReturnType<typeof buildDeferredCatalog>}
 */
function buildDeferredVerbCatalog() {
  const verbs = loadVerbs();
  const mapped = verbs.map((verb) => ({
    id: verb.name,
    description: verb.category + ": " + verb.name,
  }));
  return buildDeferredCatalog(mapped);
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  buildToolSurfacePrompt,
  buildDeferredVerbCatalog,
  filterVerbsByRole,
  filterVerbsByTarget,
  getCoordinatorPrompt,
  PERMISSION_TIERS,
  // Exposed for testing
  _loadVerbs: loadVerbs,
  _tierIndex: tierIndex,
};
