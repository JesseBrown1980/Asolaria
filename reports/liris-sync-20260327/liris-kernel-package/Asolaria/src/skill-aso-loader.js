/** Skill ASO Loader — injects ASO context when skills execute.
 *  Wraps skill loading with observation/outcome tracking.
 *  No skill.json files are modified; ASO awareness is injected at load time. */

const path = require("path");
const fs = require("fs");
const aso = require("./aso-client");

const SKILLS_DIR = path.resolve(__dirname, "..", "skills");
const RUNTIME_TOPIC = "ASO-cf51760007"; // ASO Language Runtime

// Cache: skillName -> asoId
const _topicCache = {};

/**
 * Find or create an ASO topic for a skill.
 * @param {string} skillName — directory name under skills/
 * @param {object} [meta] — optional skill.json fields (title, tags, description)
 * @returns {string} asoId
 */
function getSkillTopic(skillName, meta = {}) {
  if (_topicCache[skillName]) return _topicCache[skillName];

  // Search for existing topic first
  const hits = aso.search(`skill:${skillName}`);
  if (hits && hits.matches) {
    const exact = hits.matches.find(
      (m) => m.name === `skill/${skillName}` && m.type === "skill"
    );
    if (exact) {
      _topicCache[skillName] = exact.asoId;
      return exact.asoId;
    }
  }

  // Create new topic
  const desc = meta.description || `Skill: ${skillName}`;
  const tags = ["skill", "auto-registered", ...(meta.tags || [])];
  const result = aso.topic(`skill/${skillName}`, "skill", {
    tier: "operational",
    description: desc,
    tags,
  });
  if (result && result.ok && result.id) {
    _topicCache[skillName] = result.id;
    // Link to ASO Language Runtime
    try { aso.relate(result.id, "part_of", RUNTIME_TOPIC); } catch (_) {}
    return result.id;
  }
  return null;
}

/**
 * Load a skill from its directory, injecting ASO context.
 * Records an observation before execution and returns a wrapper
 * with run() that records outcome after execution.
 * @param {string} skillDir — absolute path or name under skills/
 * @returns {object} skill config with .run(executeFn) helper
 */
function loadSkill(skillDir) {
  const dir = path.isAbsolute(skillDir)
    ? skillDir
    : path.join(SKILLS_DIR, skillDir);
  const skillName = path.basename(dir);
  const configPath = path.join(dir, "skill.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

  const topicId = getSkillTopic(skillName, config);

  // Pre-execution observation
  try { aso.observe(topicId, `skill ${skillName} invoked`, { source: "skill-aso-loader" }); } catch (_) {}

  // Attach ASO context and run wrapper
  config._aso = { topicId, skillName, loadedAt: new Date().toISOString() };

  config.run = function (executeFn) {
    try {
      const result = executeFn(config);
      try { aso.outcome(topicId, "invocation", "success", { source: "skill-aso-loader" }); } catch (_) {}
      return result;
    } catch (err) {
      try { aso.outcome(topicId, "invocation", "error", { source: "skill-aso-loader", error: err.message }); } catch (_) {}
      throw err;
    }
  };

  return config;
}

/**
 * Scan skills/ directory and return all skills with their ASO topic IDs.
 * Creates topics on first call for any skill not yet registered.
 * @returns {Array<{name: string, asoId: string, title: string}>}
 */
function listAsoSkills() {
  const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const cfgPath = path.join(SKILLS_DIR, entry.name, "skill.json");
    if (!fs.existsSync(cfgPath)) continue;
    try {
      const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
      const asoId = getSkillTopic(entry.name, cfg);
      results.push({ name: entry.name, asoId, title: cfg.title || entry.name });
    } catch (_) {}
  }
  return results;
}

module.exports = { loadSkill, listAsoSkills, getSkillTopic };
