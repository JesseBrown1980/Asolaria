"use strict";

const fs = require("fs");
const path = require("path");
const { resolveDataPath } = require("./runtimePaths");
const { getSelectorCatalogDoc } = require("./selectorCatalogStore");

const tumblerStatePath = resolveDataPath("selector-tumbler-state.json");
let cache = null;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function ensureDir() {
  fs.mkdirSync(path.dirname(tumblerStatePath), { recursive: true });
}

function nowIso() {
  return new Date().toISOString();
}

function cloneMetadata(value) {
  return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : {};
}

function buildInitialState() {
  const doc = getSelectorCatalogDoc();
  const tumblers = {};
  for (const tumblerId of Object.keys(doc.tumblers || {})) {
    tumblers[tumblerId] = {
      cursor: 0,
      activeLeases: [],
      waitQueue: []
    };
  }
  return {
    schemaVersion: 1,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    tumblers
  };
}

function hydrateState(raw = {}) {
  const doc = getSelectorCatalogDoc();
  const source = raw && typeof raw === "object" ? raw : {};
  const tumblers = {};
  for (const tumblerId of Object.keys(doc.tumblers || {})) {
    const entry = source.tumblers?.[tumblerId] || {};
    tumblers[tumblerId] = {
      cursor: Math.max(0, Number(entry.cursor || 0)),
      activeLeases: Array.isArray(entry.activeLeases) ? entry.activeLeases.map((lease) => clone(lease)) : [],
      waitQueue: Array.isArray(entry.waitQueue) ? entry.waitQueue.map((lease) => clone(lease)) : []
    };
  }
  return {
    schemaVersion: 1,
    createdAt: String(source.createdAt || nowIso()),
    updatedAt: String(source.updatedAt || nowIso()),
    tumblers
  };
}

function writeState(doc) {
  ensureDir();
  const normalized = hydrateState(doc);
  const tmpPath = `${tumblerStatePath}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tmpPath, JSON.stringify(normalized, null, 2), "utf8");
  fs.renameSync(tmpPath, tumblerStatePath);
  cache = normalized;
  return clone(normalized);
}

function loadState() {
  if (cache) return clone(cache);
  ensureDir();
  if (!fs.existsSync(tumblerStatePath)) {
    cache = buildInitialState();
    writeState(cache);
    return clone(cache);
  }
  try {
    cache = hydrateState(JSON.parse(fs.readFileSync(tumblerStatePath, "utf8")));
    return clone(cache);
  } catch (_error) {
    cache = buildInitialState();
    writeState(cache);
    return clone(cache);
  }
}

function pruneExpired(state) {
  const now = Date.now();
  let changed = false;
  for (const entry of Object.values(state.tumblers || {})) {
    const beforeActive = entry.activeLeases.length;
    entry.activeLeases = entry.activeLeases.filter((lease) => Number(lease.expiresAtMs || 0) > now);
    if (entry.activeLeases.length !== beforeActive) {
      changed = true;
    }
    const beforeQueue = entry.waitQueue.length;
    entry.waitQueue = entry.waitQueue.filter((lease) => Number(lease.expiresAtMs || 0) > now);
    if (entry.waitQueue.length !== beforeQueue) {
      changed = true;
    }
  }
  if (changed) {
    state.updatedAt = nowIso();
  }
  return changed;
}

function makeLeaseId(tumblerId) {
  return `${tumblerId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createLeasePayload(tumblerId, request = {}, slotIndex = 0) {
  const leaseMs = Math.max(10_000, Math.min(8 * 60 * 60 * 1000, Number(request.leaseMs || 30 * 60 * 1000)));
  const createdAt = nowIso();
  const metadata = cloneMetadata(request.metadata);
  return {
    leaseId: makeLeaseId(tumblerId),
    tumblerId,
    selectorId: String(request.selectorId || "").trim(),
    profileId: String(request.profileId || "").trim(),
    modelKey: String(request.modelKey || request.workerId || "").trim(),
    requestedBy: String(request.requestedBy || "system").trim() || "system",
    slotIndex: Math.max(0, Number(slotIndex || 0)),
    createdAt,
    expiresAt: new Date(Date.now() + leaseMs).toISOString(),
    expiresAtMs: Date.now() + leaseMs,
    policyId: String(request.policyId || metadata.policyId || "").trim(),
    policyName: String(request.policyName || metadata.policyName || "").trim(),
    shannonAware: Boolean(request.shannonAware || metadata.shannonAware),
    partitionPattern: String(request.partitionPattern || metadata.partitionPattern || "").trim(),
    partitions: Array.isArray(request.partitions) ? request.partitions.slice(0, 8) : (Array.isArray(metadata.partitions) ? metadata.partitions.slice(0, 8) : []),
    totalUnits: Number.isFinite(Number(request.totalUnits || metadata.totalUnits)) ? Number(request.totalUnits || metadata.totalUnits) : 0,
    metadata
  };
}

function listTumblerProfiles() {
  const doc = getSelectorCatalogDoc();
  return Object.values(doc.tumblers || {}).map((entry) => clone(entry));
}

function summarizeTumblerState() {
  const doc = getSelectorCatalogDoc();
  const state = loadState();
  pruneExpired(state);
  const rows = [];
  for (const [tumblerId, config] of Object.entries(doc.tumblers || {})) {
    const entry = state.tumblers?.[tumblerId] || { cursor: 0, activeLeases: [], waitQueue: [] };
    rows.push({
      id: tumblerId,
      label: String(config.label || tumblerId),
      description: String(config.description || ""),
      maxActive: Math.max(1, Number(config.maxActive || 1)),
      rotate: String(config.rotate || "round_robin"),
      queueDepth: Math.max(0, Number(config.queueDepth || 0)),
      cursor: Math.max(0, Number(entry.cursor || 0)),
      activeCount: Array.isArray(entry.activeLeases) ? entry.activeLeases.length : 0,
      queueCount: Array.isArray(entry.waitQueue) ? entry.waitQueue.length : 0,
      activeLeases: Array.isArray(entry.activeLeases) ? entry.activeLeases.map((lease) => clone(lease)) : []
    });
  }
  if (state.updatedAt !== loadState().updatedAt) {
    writeState(state);
  }
  return rows;
}

function acquireTumblerLease(request = {}) {
  const tumblerId = String(request.tumblerId || "").trim();
  if (!tumblerId) {
    throw new Error("tumblerId is required.");
  }
  const doc = getSelectorCatalogDoc();
  const config = doc.tumblers?.[tumblerId];
  if (!config) {
    throw new Error(`Unknown tumbler "${tumblerId}".`);
  }
  const state = loadState();
  pruneExpired(state);
  const entry = state.tumblers[tumblerId];
  const existing = entry.activeLeases.find((lease) => (
    String(lease.selectorId || "") === String(request.selectorId || "")
    && String(lease.modelKey || "") === String(request.modelKey || request.workerId || "")
    && String(lease.requestedBy || "") === String(request.requestedBy || "system")
  ));
  if (existing) {
    return {
      ok: true,
      granted: true,
      reused: true,
      lease: clone(existing),
      tumbler: summarizeTumblerState().find((row) => row.id === tumblerId) || null
    };
  }
  const maxActive = Math.max(1, Number(config.maxActive || 1));
  if (entry.activeLeases.length < maxActive) {
    const slotIndex = String(config.rotate || "") === "single_slot"
      ? 0
      : entry.cursor % maxActive;
    const lease = createLeasePayload(tumblerId, request, slotIndex);
    entry.activeLeases.push(lease);
    entry.cursor = String(config.rotate || "") === "single_slot"
      ? 0
      : (slotIndex + 1) % maxActive;
    state.updatedAt = nowIso();
    writeState(state);
    return {
      ok: true,
      granted: true,
      reused: false,
      lease,
      tumbler: summarizeTumblerState().find((row) => row.id === tumblerId) || null
    };
  }

  const queueDepth = Math.max(0, Number(config.queueDepth || 0));
  if (request.queueIfBusy === false) {
    throw new Error(`Tumbler "${tumblerId}" is busy.`);
  }
  if (queueDepth > 0 && entry.waitQueue.length >= queueDepth) {
    throw new Error(`Tumbler "${tumblerId}" queue is full.`);
  }
  const queued = createLeasePayload(tumblerId, request, -1);
  entry.waitQueue.push(queued);
  state.updatedAt = nowIso();
  writeState(state);
  return {
    ok: true,
    granted: false,
    queued: true,
    request: queued,
    queuePosition: entry.waitQueue.length,
    tumbler: summarizeTumblerState().find((row) => row.id === tumblerId) || null
  };
}

function releaseTumblerLease(leaseId) {
  const id = String(leaseId || "").trim();
  if (!id) {
    throw new Error("leaseId is required.");
  }
  const doc = getSelectorCatalogDoc();
  const state = loadState();
  pruneExpired(state);

  for (const [tumblerId, entry] of Object.entries(state.tumblers || {})) {
    const config = doc.tumblers?.[tumblerId] || {};
    const index = entry.activeLeases.findIndex((lease) => String(lease.leaseId || "") === id);
    if (index < 0) continue;
    const released = entry.activeLeases.splice(index, 1)[0];
    let autoloaded = null;
    if (entry.waitQueue.length > 0) {
      const nextRequest = entry.waitQueue.shift();
      const maxActive = Math.max(1, Number(config.maxActive || 1));
      const slotIndex = String(config.rotate || "") === "single_slot"
        ? 0
        : entry.cursor % maxActive;
      autoloaded = createLeasePayload(tumblerId, nextRequest, slotIndex);
      autoloaded.requestedBy = String(nextRequest.requestedBy || autoloaded.requestedBy);
      autoloaded.selectorId = String(nextRequest.selectorId || autoloaded.selectorId);
      autoloaded.profileId = String(nextRequest.profileId || autoloaded.profileId);
      autoloaded.modelKey = String(nextRequest.modelKey || autoloaded.modelKey);
      entry.activeLeases.push(autoloaded);
      entry.cursor = String(config.rotate || "") === "single_slot"
        ? 0
        : (slotIndex + 1) % maxActive;
    }
    state.updatedAt = nowIso();
    writeState(state);
    return {
      ok: true,
      released,
      autoloaded,
      tumbler: summarizeTumblerState().find((row) => row.id === tumblerId) || null
    };
  }
  throw new Error(`Lease "${id}" not found.`);
}

module.exports = {
  tumblerStatePath,
  listTumblerProfiles,
  summarizeTumblerState,
  acquireTumblerLease,
  releaseTumblerLease
};
