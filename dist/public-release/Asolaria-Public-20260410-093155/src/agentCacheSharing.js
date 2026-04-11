/**
 * Agent Cache Sharing — Prompt Cache Reuse for Spawned Agents
 *
 * Extracted pattern from Claude Code's forkedAgent.ts / forkSubagent.ts.
 *
 * When Asolaria spawns a sub-agent, the parent's conversation context
 * (system prompt, IX knowledge, messages) is already cached at the API.
 * If the sub-agent sends an identical prefix, the API returns a cache hit
 * instead of re-processing all those tokens. This saves massive cost.
 *
 * The key insight from Claude Code: cache keys are composed of
 *   (system prompt + tools + model + message prefix + thinking config).
 * If ALL of those are byte-identical between parent and child, the child
 * gets a cache read hit on the shared prefix and only pays for its own
 * appended messages.
 *
 * Integration points:
 *   - instantAgentSpawner.js — call spawnWithCache() instead of raw spawn
 *   - spawnContextBuilder.js — buildSpawnContext() feeds createSharedContext()
 *   - server.js routes — expose cache stats via /api/cache/status
 *
 * LX chain: LX-122 (identity handshake), IX-321 (self-index before despawn)
 */

const crypto = require("crypto");
const EventEmitter = require("events");

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CACHE_TTL_MS = 300000;        // 5 minutes — matches Anthropic's ephemeral cache window
const CACHE_MAX_ENTRIES = 32;       // hard cap on concurrent cached sessions
const STALE_CHECK_INTERVAL_MS = 60000;

// ---------------------------------------------------------------------------
// Internal State
// ---------------------------------------------------------------------------

const cacheEmitter = new EventEmitter();
cacheEmitter.setMaxListeners(64);

/**
 * sessionId -> {
 *   fingerprint: string,          // hash of cache-critical fields
 *   systemPrompt: string,         // parent's rendered system prompt
 *   contextMessages: Array,       // parent's message history (reference, not copy)
 *   spawnContext: Object|null,     // buildSpawnContext() output if available
 *   ixSnapshot: Array,            // IX entries loaded at snapshot time
 *   createdAt: number,            // Date.now() when snapshot was taken
 *   lastAccessedAt: number,       // Date.now() of last spawnWithCache() call
 *   stale: boolean,               // true after invalidateCache()
 *   hitCount: number,             // how many children used this cache
 *   missReason: string|null       // last reason a hit was missed
 * }
 */
const _cacheStore = new Map();

// Metrics (cumulative, survives individual cache evictions)
const _metrics = {
  totalHits: 0,
  totalMisses: 0,
  totalCreations: 0,
  totalEvictions: 0,
  totalInvalidations: 0,
  totalBytesShared: 0
};

// Stale-sweep timer (unreffed so it doesn't block process exit)
let _sweepTimer = null;

// ---------------------------------------------------------------------------
// Fingerprinting
// ---------------------------------------------------------------------------

/**
 * Compute a fingerprint over the fields that must be identical for cache reuse.
 * Mirrors Claude Code's CacheSafeParams: system prompt, tools list, model,
 * and the message prefix.
 *
 * We intentionally hash a summary, not the full message bodies — hashing
 * hundreds of KB per spawn would defeat the purpose. The message count +
 * last message UUID is enough to detect prefix divergence.
 */
function computeFingerprint(params) {
  const h = crypto.createHash("sha256");
  h.update(params.systemPrompt || "");
  h.update("|");
  h.update(params.model || "default");
  h.update("|");

  // Tools list (sorted for determinism)
  if (Array.isArray(params.tools)) {
    h.update(params.tools.slice().sort().join(","));
  }
  h.update("|");

  // Message prefix anchor: count + last UUID
  const msgs = params.contextMessages || [];
  h.update(String(msgs.length));
  h.update("|");
  if (msgs.length > 0) {
    const last = msgs[msgs.length - 1];
    h.update(last.uuid || last.id || last.at || "");
  }

  return h.digest("hex").slice(0, 16);
}

// ---------------------------------------------------------------------------
// Cache Management
// ---------------------------------------------------------------------------

/**
 * Evict oldest entries when the cache exceeds CACHE_MAX_ENTRIES.
 * Evicts by lastAccessedAt (LRU).
 */
function evictIfNeeded() {
  if (_cacheStore.size <= CACHE_MAX_ENTRIES) return;

  const entries = [..._cacheStore.entries()]
    .sort((a, b) => a[1].lastAccessedAt - b[1].lastAccessedAt);

  const toEvict = entries.slice(0, _cacheStore.size - CACHE_MAX_ENTRIES);
  for (const [sid] of toEvict) {
    _cacheStore.delete(sid);
    _metrics.totalEvictions++;
    cacheEmitter.emit("evicted", { sessionId: sid });
  }
}

/**
 * Sweep stale/expired entries. Runs on a timer.
 */
function sweepStale() {
  const now = Date.now();
  for (const [sid, entry] of _cacheStore) {
    if (entry.stale || (now - entry.createdAt > CACHE_TTL_MS)) {
      _cacheStore.delete(sid);
      _metrics.totalEvictions++;
      cacheEmitter.emit("evicted", { sessionId: sid, reason: entry.stale ? "invalidated" : "ttl" });
    }
  }
}

function ensureSweepTimer() {
  if (_sweepTimer) return;
  _sweepTimer = setInterval(sweepStale, STALE_CHECK_INTERVAL_MS);
  if (_sweepTimer && typeof _sweepTimer.unref === "function") {
    _sweepTimer.unref();
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * createSharedContext(parentSession)
 *
 * Snapshots the parent's current state into a cache entry that child agents
 * can reuse. The snapshot captures everything the Anthropic API uses as a
 * cache key so children can produce byte-identical prefixes.
 *
 * @param {Object} parentSession
 * @param {string} parentSession.sessionId  — unique session identifier
 * @param {string} parentSession.systemPrompt — the rendered system prompt text
 * @param {Array}  parentSession.contextMessages — the parent's message array
 * @param {string} [parentSession.model] — model name (e.g. "claude-sonnet-4-20250514")
 * @param {Array}  [parentSession.tools] — tool name list for cache key
 * @param {Object} [parentSession.spawnContext] — output of buildSpawnContext()
 * @param {Array}  [parentSession.ixEntries] — IX entries loaded in this session
 *
 * @returns {{ ok: boolean, cacheId: string, fingerprint: string, byteEstimate: number }}
 */
function createSharedContext(parentSession) {
  if (!parentSession || !parentSession.sessionId) {
    return { ok: false, error: "parentSession.sessionId is required" };
  }

  const sessionId = parentSession.sessionId;
  const fingerprint = computeFingerprint(parentSession);

  // If an identical fingerprint already exists for this session, just touch it
  const existing = _cacheStore.get(sessionId);
  if (existing && existing.fingerprint === fingerprint && !existing.stale) {
    existing.lastAccessedAt = Date.now();
    return {
      ok: true,
      cacheId: sessionId,
      fingerprint,
      byteEstimate: existing.byteEstimate || 0,
      reused: true
    };
  }

  // Estimate bytes shared (rough: system prompt + serialized message lengths)
  const promptBytes = Buffer.byteLength(parentSession.systemPrompt || "", "utf8");
  const msgBytes = (parentSession.contextMessages || []).reduce((sum, m) => {
    const text = typeof m === "string" ? m
      : m.text || m.content || (m.message && m.message.content) || "";
    return sum + (typeof text === "string" ? text.length : JSON.stringify(text).length);
  }, 0);
  const byteEstimate = promptBytes + msgBytes;

  const entry = {
    fingerprint,
    systemPrompt: parentSession.systemPrompt || "",
    contextMessages: JSON.parse(JSON.stringify(parentSession.contextMessages || [])),
    model: parentSession.model || null,
    tools: parentSession.tools || null,
    spawnContext: parentSession.spawnContext || null,
    ixSnapshot: parentSession.ixEntries || [],
    createdAt: Date.now(),
    lastAccessedAt: Date.now(),
    stale: false,
    hitCount: 0,
    missReason: null,
    byteEstimate
  };

  _cacheStore.set(sessionId, entry);
  _metrics.totalCreations++;
  _metrics.totalBytesShared += byteEstimate;

  evictIfNeeded();
  ensureSweepTimer();

  cacheEmitter.emit("created", { sessionId, fingerprint, byteEstimate });

  return {
    ok: true,
    cacheId: sessionId,
    fingerprint,
    byteEstimate,
    reused: false
  };
}

/**
 * spawnWithCache(agentConfig, sharedContext)
 *
 * Spawns an agent using a cached parent context. The child's API request
 * is structured so its message prefix is byte-identical to the parent's,
 * producing a cache read hit on the shared prompt.
 *
 * Returns a spawn packet compatible with instantAgentSpawner.processMessage().
 *
 * @param {Object} agentConfig
 * @param {string} agentConfig.role — agent role (helm, sentinel, forge, etc.)
 * @param {string} agentConfig.mission — what this agent should do
 * @param {Object} [agentConfig.profile] — optional profile override
 * @param {number} [agentConfig.maxTurns] — cap on API round-trips (default 5)
 * @param {boolean} [agentConfig.inheritTools] — use parent's tool list (default true)
 * @param {string} [agentConfig.directive] — fork directive text appended after shared prefix
 *
 * @param {Object} sharedContext
 * @param {string} sharedContext.cacheId — the sessionId returned by createSharedContext
 * @param {string} sharedContext.fingerprint — expected fingerprint for validation
 *
 * @returns {{ ok: boolean, spawnPacket: Object, cacheHit: boolean, agentId: string }}
 */
function spawnWithCache(agentConfig, sharedContext) {
  if (!sharedContext || !sharedContext.cacheId) {
    return { ok: false, error: "sharedContext.cacheId is required" };
  }

  const entry = _cacheStore.get(sharedContext.cacheId);
  if (!entry) {
    _metrics.totalMisses++;
    return {
      ok: false,
      error: `No cache entry for session ${sharedContext.cacheId}`,
      cacheHit: false,
      suggestion: "Call createSharedContext() first"
    };
  }

  // Validate fingerprint hasn't drifted
  if (sharedContext.fingerprint && entry.fingerprint !== sharedContext.fingerprint) {
    entry.missReason = "fingerprint_mismatch";
    entry.stale = true;
    _metrics.totalMisses++;
    _metrics.totalInvalidations++;
    return {
      ok: false,
      error: "Cache fingerprint mismatch — parent context changed since snapshot",
      cacheHit: false,
      expectedFingerprint: sharedContext.fingerprint,
      actualFingerprint: entry.fingerprint
    };
  }

  // Check TTL
  if (Date.now() - entry.createdAt > CACHE_TTL_MS) {
    entry.stale = true;
    _metrics.totalMisses++;
    return {
      ok: false,
      error: "Cache entry expired (TTL exceeded)",
      cacheHit: false,
      ageMs: Date.now() - entry.createdAt
    };
  }

  if (entry.stale) {
    _metrics.totalMisses++;
    return {
      ok: false,
      error: `Cache entry stale: ${entry.missReason || "invalidated"}`,
      cacheHit: false
    };
  }

  // ── Build the spawn packet ──
  // The child's message array starts with the parent's exact prefix
  // (for cache hit), then appends a single user message with the directive.
  entry.hitCount++;
  entry.lastAccessedAt = Date.now();
  _metrics.totalHits++;

  const agentId = `cache-${agentConfig.role || "agent"}-${crypto.randomBytes(4).toString("hex")}`;

  // Fork directive — the only part unique to this child
  const directive = agentConfig.directive || agentConfig.mission || "Execute your role.";

  // Build child messages: shared prefix + child-specific directive
  // This mirrors Claude Code's buildForkedMessages pattern:
  // [...parentHistory, newUserMessage(directive)]
  const childMessages = [
    ...entry.contextMessages,
    {
      uuid: crypto.randomUUID(),
      type: "user",
      role: "user",
      content: buildChildDirective(agentConfig.role, directive, agentId),
      at: new Date().toISOString()
    }
  ];

  const spawnPacket = {
    agentId,
    role: agentConfig.role || "unknown",
    mission: agentConfig.mission || null,
    maxTurns: agentConfig.maxTurns || 5,

    // Cache-safe fields — these MUST match the parent's for cache reuse
    cacheSafe: {
      systemPrompt: entry.systemPrompt,
      model: entry.model,
      tools: agentConfig.inheritTools !== false ? entry.tools : null,
      contextMessageCount: entry.contextMessages.length,
      fingerprint: entry.fingerprint
    },

    // The actual messages to send
    messages: childMessages,

    // Metadata for the spawner
    spawnedAt: new Date().toISOString(),
    parentSessionId: sharedContext.cacheId,
    ixSnapshot: entry.ixSnapshot,
    profile: agentConfig.profile || entry.spawnContext || null,

    // Cache metrics for this spawn
    cacheInfo: {
      hit: true,
      sharedPrefixBytes: entry.byteEstimate,
      parentSnapshotAge: Date.now() - entry.createdAt,
      hitNumber: entry.hitCount
    }
  };

  cacheEmitter.emit("spawn", {
    agentId,
    sessionId: sharedContext.cacheId,
    role: agentConfig.role,
    cacheHit: true,
    hitNumber: entry.hitCount
  });

  return {
    ok: true,
    spawnPacket,
    cacheHit: true,
    agentId
  };
}

/**
 * invalidateCache(sessionId)
 *
 * Marks a cache entry as stale. The next spawnWithCache() call against
 * this session will fail with a fingerprint/stale error, forcing the
 * caller to re-snapshot with createSharedContext().
 *
 * Call this when:
 *   - The parent session receives new messages (prefix changed)
 *   - The parent's system prompt is re-rendered (tools/context changed)
 *   - An agent writes to the IX index (knowledge state changed)
 *
 * @param {string} sessionId
 * @param {string} [reason] — why the cache was invalidated (for diagnostics)
 * @returns {{ ok: boolean, existed: boolean }}
 */
function invalidateCache(sessionId, reason) {
  const entry = _cacheStore.get(sessionId);
  if (!entry) {
    return { ok: true, existed: false };
  }

  const wasAlreadyStale = entry.stale;
  entry.stale = true;
  entry.missReason = reason || "explicit_invalidation";
  _metrics.totalInvalidations++;

  cacheEmitter.emit("invalidated", { sessionId, reason: entry.missReason });

  return { ok: true, existed: true, wasStale: wasAlreadyStale };
}

// ---------------------------------------------------------------------------
// Child Directive Builder
// ---------------------------------------------------------------------------

/**
 * Builds the child-specific directive text appended after the shared prefix.
 * Mirrors Claude Code's buildChildMessage pattern from forkSubagent.ts:
 * boilerplate rules + the actual directive.
 */
function buildChildDirective(role, directive, agentId) {
  return [
    `<fork-context>`,
    `You are a cache-forked agent. AgentID: ${agentId}. Role: ${role || "general"}.`,
    `You inherit the full conversation context above from the parent session.`,
    ``,
    `RULES:`,
    `1. Execute your directive directly — do NOT re-read context you already have`,
    `2. Do NOT spawn sub-agents (you ARE the sub-agent)`,
    `3. Index your discoveries before finishing (IX-321)`,
    `4. Stay within your directive scope`,
    `5. Report structured results, then stop`,
    `</fork-context>`,
    ``,
    `DIRECTIVE: ${directive}`
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Diagnostics
// ---------------------------------------------------------------------------

/**
 * Returns current cache state and cumulative metrics.
 */
function getCacheStatus() {
  const entries = {};
  for (const [sid, e] of _cacheStore) {
    entries[sid] = {
      fingerprint: e.fingerprint,
      stale: e.stale,
      hitCount: e.hitCount,
      ageMs: Date.now() - e.createdAt,
      byteEstimate: e.byteEstimate,
      missReason: e.missReason,
      contextMessageCount: e.contextMessages.length,
      model: e.model
    };
  }

  return {
    activeCaches: _cacheStore.size,
    maxCaches: CACHE_MAX_ENTRIES,
    ttlMs: CACHE_TTL_MS,
    entries,
    metrics: { ..._metrics }
  };
}

/**
 * Flush all cache entries. Used in tests and during colony restarts.
 */
function flushAll() {
  const count = _cacheStore.size;
  _cacheStore.clear();
  if (_sweepTimer) {
    clearInterval(_sweepTimer);
    _sweepTimer = null;
  }
  cacheEmitter.emit("flushed", { count });
  return { ok: true, flushed: count };
}

// ---------------------------------------------------------------------------
// Module Exports
// ---------------------------------------------------------------------------

module.exports = {
  createSharedContext,
  spawnWithCache,
  invalidateCache,
  getCacheStatus,
  flushAll,
  cacheEmitter,

  // Internals exposed for testing
  _internals: {
    computeFingerprint,
    buildChildDirective,
    sweepStale,
    CACHE_TTL_MS,
    CACHE_MAX_ENTRIES,
    _cacheStore,
    _metrics
  }
};
