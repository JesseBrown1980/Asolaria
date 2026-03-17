/**
 * Construction Simulation API Routes
 *
 * Exposes the construction pipeline, instant agent spawner, tracer spindles,
 * and GNN watcher to the Asolaria runtime API.
 */

const express = require("express");
const router = express.Router();

const {
  initializeConstructions,
  getConstruction,
  getAllConstructions,
  registerConstruction,
  removeConstruction,
  routeToConstruction,
  buildConstructionEntities,
  saveConstructionState,
  loadConstructionState
} = require("../src/constructionIndex");

const {
  spawnInstantAgent,
  completeAndTransfer,
  getActiveAgents,
  getSpawnerStatus,
  getAllTracers,
  initializeTracers
} = require("../src/instantAgentSpawner");

const {
  predictConstruction,
  getWatcherStatus,
  startWatcher,
  popPreSpawn
} = require("../src/gnnConstructionWatcher");

const {
  getOrCreateIndex,
  getIndex,
  getAllIndexes,
  initializeQddIndexes,
  saveIndexes
} = require("../src/constructionToolIndex");

// ── Initialization ──

let _initialized = false;

function ensureInitialized() {
  if (_initialized) return;
  _initialized = true;
  initializeConstructions();
  loadConstructionState();
  initializeTracers();
  initializeQddIndexes();
  startWatcher();
}

// ── Construction CRUD ──

/**
 * GET /api/constructions/status — Full simulation status
 */
router.get("/status", (req, res) => {
  ensureInitialized();
  const constructions = getAllConstructions().map(c => c.toJSON());
  const spawner = getSpawnerStatus();
  const watcher = getWatcherStatus();
  const { entities, routes } = buildConstructionEntities();

  res.json({
    ok: true,
    at: new Date().toISOString(),
    constructions,
    spawner,
    watcher,
    civilization: {
      entityCount: entities.length,
      routeCount: routes.length
    }
  });
});

/**
 * GET /api/constructions — List all constructions
 */
router.get("/", (req, res) => {
  ensureInitialized();
  res.json({
    ok: true,
    constructions: getAllConstructions().map(c => c.toJSON())
  });
});

/**
 * POST /api/constructions/register — Register a new construction
 */
router.post("/register", (req, res) => {
  ensureInitialized();
  try {
    const construction = registerConstruction(req.body);
    res.json({ ok: true, construction: construction.toJSON() });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

/**
 * DELETE /api/constructions/:id — Remove a construction
 */
router.delete("/:id", (req, res) => {
  ensureInitialized();
  const removed = removeConstruction(req.params.id);
  if (!removed) {
    return res.status(404).json({ ok: false, error: "construction_not_found" });
  }
  res.json({ ok: true, removed: req.params.id });
});

// ── Message Processing Pipeline ──

/**
 * POST /api/constructions/process — Route a message through the construction pipeline
 *
 * This is the main entry point. It:
 * 1. Uses GNN prediction or keyword routing to find the target construction
 * 2. Spawns an instant agent at that construction
 * 3. Processes the message
 * 4. Returns the result and handles energy transfer
 *
 * Body: { text, projectScope?, constructionId? }
 */
router.post("/process", (req, res) => {
  ensureInitialized();
  const { text, projectScope, constructionId } = req.body || {};

  if (!text) {
    return res.status(400).json({ ok: false, error: "text is required" });
  }

  // Step 1: Route to construction
  let construction = null;

  // Direct targeting
  if (constructionId) {
    construction = getConstruction(constructionId);
  }

  // GNN prediction
  if (!construction) {
    const prediction = predictConstruction({ text });
    if (prediction) {
      construction = getConstruction(prediction.constructionId);
    }
  }

  // Keyword fallback
  if (!construction) {
    construction = routeToConstruction({ text });
  }

  if (!construction) {
    return res.json({
      ok: false,
      error: "no_matching_construction",
      hint: "No construction matched the message. Register a construction or provide constructionId."
    });
  }

  // Step 2: Check for pre-spawned agent
  const preSpawn = popPreSpawn();

  // Step 3: Spawn instant agent and process
  const spawnResult = spawnInstantAgent(construction, { text, source: "api" });
  if (!spawnResult.ok) {
    return res.status(503).json({ ok: false, error: spawnResult.error });
  }

  // Record inbound message on the construction
  construction.recordMessage({ text, direction: "inbound", source: "api" });

  // Step 4: In simulation mode, the agent processes synchronously
  // In production, this would be async via omnispindle lane
  const agent = spawnResult.agent;

  res.json({
    ok: true,
    constructionId: construction.id,
    constructionLabel: construction.label,
    agentId: agent.id,
    agentStatus: agent.status,
    systemPrompt: agent.systemPrompt,
    profile: {
      skills: agent.profile.skills || [],
      tools: agent.profile.tools || [],
      mistakeCount: (agent.profile.mistakes || []).length,
      patternCount: (agent.profile.patterns || []).length,
      contextFiles: agent.profile.contextFiles || []
    },
    gnnPrediction: predictConstruction({ text }, construction.id),
    preSpawnUsed: Boolean(preSpawn),
    energyLevel: construction.energyLevel,
    note: "Agent spawned and processing. POST /api/constructions/complete/:agentId to finalize with response."
  });
});

/**
 * POST /api/constructions/complete/:agentId — Complete an instant agent and transfer energy
 *
 * Body: { text, learnedPatterns?, mistakesEncountered?, nextConstructionId? }
 */
router.post("/complete/:agentId", (req, res) => {
  ensureInitialized();
  const { text, learnedPatterns, mistakesEncountered, nextConstructionId } = req.body || {};

  let nextConstruction = null;
  if (nextConstructionId) {
    nextConstruction = getConstruction(nextConstructionId);
  }

  const result = completeAndTransfer(req.params.agentId, {
    text: text || "",
    learnedPatterns: learnedPatterns || [],
    mistakesEncountered: mistakesEncountered || []
  }, nextConstruction);

  if (!result.ok) {
    return res.status(404).json(result);
  }

  // Save state after completion
  saveConstructionState();

  res.json({
    ok: true,
    ...result,
    nextConstruction: nextConstruction ? nextConstruction.toJSON() : null
  });
});

// ── Spawner & Tracers ──

/**
 * GET /api/constructions/spawner/status — Instant agent spawner status
 */
router.get("/spawner/status", (req, res) => {
  ensureInitialized();
  res.json({ ok: true, ...getSpawnerStatus() });
});

/**
 * GET /api/constructions/agents — List active instant agents
 */
router.get("/agents/active", (req, res) => {
  ensureInitialized();
  res.json({
    ok: true,
    agents: getActiveAgents().map(a => a.toJSON())
  });
});

/**
 * GET /api/constructions/tracers — List tracer spindles
 */
router.get("/tracers/list", (req, res) => {
  ensureInitialized();
  res.json({
    ok: true,
    tracers: getAllTracers().map(t => t.toJSON())
  });
});

// ── GNN Watcher ──

/**
 * GET /api/constructions/watcher/status — GNN watcher diagnostics
 */
router.get("/watcher/status", (req, res) => {
  ensureInitialized();
  res.json({ ok: true, ...getWatcherStatus() });
});

/**
 * POST /api/constructions/watcher/predict — Predict best construction for a message
 */
router.post("/watcher/predict", (req, res) => {
  ensureInitialized();
  const { text, currentConstructionId } = req.body || {};
  if (!text) {
    return res.status(400).json({ ok: false, error: "text is required" });
  }

  const prediction = predictConstruction({ text }, currentConstructionId);
  const keywordMatch = routeToConstruction({ text });

  res.json({
    ok: true,
    gnnPrediction: prediction,
    keywordMatch: keywordMatch ? { constructionId: keywordMatch.id, label: keywordMatch.label } : null
  });
});

// ── Civilization Integration ──

/**
 * GET /api/constructions/civilization — Get construction entities for civilization world
 */
router.get("/civilization/entities", (req, res) => {
  ensureInitialized();
  res.json({ ok: true, ...buildConstructionEntities() });
});

/**
 * POST /api/constructions/save — Persist construction state
 */
router.post("/save", (req, res) => {
  ensureInitialized();
  const saved = saveConstructionState();
  res.json({ ok: saved });
});

// ── Tool Index ──

/**
 * GET /api/constructions/index/:constructionId — Get the numbered tool index
 */
router.get("/index/:constructionId", (req, res) => {
  ensureInitialized();
  const index = getIndex(req.params.constructionId);
  if (!index) {
    return res.status(404).json({ ok: false, error: "index_not_found" });
  }
  res.json({ ok: true, index: index.toJSON() });
});

/**
 * GET /api/constructions/index/:constructionId/load-packet — Get instant load packet
 */
router.get("/index/:constructionId/load-packet", (req, res) => {
  ensureInitialized();
  const index = getIndex(req.params.constructionId);
  if (!index) {
    return res.status(404).json({ ok: false, error: "index_not_found" });
  }
  res.json({ ok: true, ...index.buildInstantLoadPacket() });
});

/**
 * GET /api/constructions/index/:constructionId/entry/:number — Get full entry by number
 */
router.get("/index/:constructionId/entry/:number", (req, res) => {
  ensureInitialized();
  const index = getIndex(req.params.constructionId);
  if (!index) {
    return res.status(404).json({ ok: false, error: "index_not_found" });
  }
  const entry = index.getByNumber(Number(req.params.number));
  if (!entry) {
    return res.status(404).json({ ok: false, error: "entry_not_found" });
  }
  res.json({
    ok: true,
    entry: {
      ...entry.toRef(),
      fullDefinition: entry.fullDefinition,
      accessCount: entry.accessCount,
      loadedAt: entry.loadedAt
    }
  });
});

/**
 * GET /api/constructions/indexes — List all construction indexes
 */
router.get("/indexes/all", (req, res) => {
  ensureInitialized();
  res.json({
    ok: true,
    indexes: getAllIndexes().map(i => i.toJSON())
  });
});

// ── Mistake & Pattern Recording ──

/**
 * POST /api/constructions/mistakes/record — Record a mistake on a construction
 * Body: { constructionId, id, description, agentId?, context? }
 */
router.post("/mistakes/record", (req, res) => {
  ensureInitialized();
  const { constructionId, id, description, agentId, context } = req.body || {};
  if (!constructionId || !description) {
    return res.status(400).json({ ok: false, error: "constructionId and description required" });
  }

  // Add to construction profile
  const construction = getConstruction(constructionId);
  if (construction) {
    const mistakeStr = `${id || "unknown"}: ${description}`;
    if (!construction.profile.mistakes.includes(mistakeStr) && construction.profile.mistakes.length < 100) {
      construction.profile.mistakes.push(mistakeStr);
    }
  }

  // Add to numbered index
  const index = getOrCreateIndex(constructionId);
  const entry = index.recordMistake({ id, description, agentId, context });

  // Save state
  saveIndexes();
  saveConstructionState();

  res.json({
    ok: true,
    constructionId,
    entry: entry.toRef(),
    totalMistakes: index.getByType("mistake").length
  });
});

/**
 * POST /api/constructions/patterns/record — Record a pattern on a construction
 * Body: { constructionId, id, description, agentId? }
 */
router.post("/patterns/record", (req, res) => {
  ensureInitialized();
  const { constructionId, id, description, agentId } = req.body || {};
  if (!constructionId || !description) {
    return res.status(400).json({ ok: false, error: "constructionId and description required" });
  }

  const construction = getConstruction(constructionId);
  if (construction) {
    const patternStr = `${id || "unknown"}: ${description}`;
    if (!construction.profile.patterns.includes(patternStr) && construction.profile.patterns.length < 100) {
      construction.profile.patterns.push(patternStr);
    }
  }

  const index = getOrCreateIndex(constructionId);
  const entry = index.recordPattern({ id, description, agentId });

  saveIndexes();
  saveConstructionState();

  res.json({
    ok: true,
    constructionId,
    entry: entry.toRef(),
    totalPatterns: index.getByType("pattern").length
  });
});

/**
 * POST /api/constructions/indexes/save — Persist all indexes
 */
router.post("/indexes/save", (req, res) => {
  ensureInitialized();
  const saved = saveIndexes();
  res.json({ ok: saved });
});

// ── Phone Construction Workers ──

const {
  initializePhoneWorkers,
  getAllPhoneWorkers,
  findBestPhoneWorker,
  dispatchPhoneToConstruction,
  getPhoneBridgeStatus
} = require("../src/phoneConstructionBridge");

function ensurePhoneInit() {
  ensureInitialized();
  initializePhoneWorkers();
}

/**
 * GET /api/constructions/phones/status — Phone construction bridge status
 */
router.get("/phones/status", (req, res) => {
  ensurePhoneInit();
  res.json({ ok: true, ...getPhoneBridgeStatus() });
});

/**
 * GET /api/constructions/phones — List phone workers
 */
router.get("/phones/list", (req, res) => {
  ensurePhoneInit();
  res.json({ ok: true, workers: getAllPhoneWorkers().map(w => w.toJSON()) });
});

/**
 * POST /api/constructions/phones/dispatch — Dispatch phone to construction
 * Body: { phoneId, constructionId, task }
 */
router.post("/phones/dispatch", (req, res) => {
  ensurePhoneInit();
  const { phoneId, constructionId, task } = req.body || {};
  if (!phoneId || !constructionId) {
    return res.status(400).json({ ok: false, error: "phoneId and constructionId required" });
  }
  const result = dispatchPhoneToConstruction(phoneId, constructionId, task);
  res.json(result);
});

/**
 * POST /api/constructions/phones/auto-dispatch — Auto-dispatch best phone to construction
 * Body: { constructionId, task }
 */
router.post("/phones/auto-dispatch", (req, res) => {
  ensurePhoneInit();
  const { constructionId, task } = req.body || {};
  if (!constructionId) {
    return res.status(400).json({ ok: false, error: "constructionId required" });
  }
  const worker = findBestPhoneWorker(constructionId);
  if (!worker) {
    return res.json({ ok: false, error: "no_available_phone_worker" });
  }
  const result = worker.dispatchToConstruction(constructionId, task);
  res.json({ ...result, phoneLabel: worker.label });
});

// ── Wildcard ID routes (MUST be last to avoid catching named routes) ──

/**
 * GET /api/constructions/:id — Get a specific construction
 */
router.get("/:id", (req, res) => {
  ensureInitialized();
  const construction = getConstruction(req.params.id);
  if (!construction) {
    return res.status(404).json({ ok: false, error: "construction_not_found" });
  }
  res.json({ ok: true, construction: construction.toJSON() });
});

module.exports = router;
module.exports.ensureConstructionsInitialized = ensureInitialized;
