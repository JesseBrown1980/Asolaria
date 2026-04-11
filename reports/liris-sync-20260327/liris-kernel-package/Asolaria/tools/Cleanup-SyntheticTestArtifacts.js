const fs = require("node:fs");
const path = require("node:path");
const { resolveDataPath } = require("../src/runtimePaths");

const syntheticFailureTitle = "Failing local codex dispatch";
const syntheticFailureObjective = "Execute immediately and fail.";
const syntheticFailureError = "Synthetic Codex failure.";
const syntheticDispatchSuffix = "-failing-local-codex-dispatch";

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function cleanText(value) {
  return String(value || "").trim();
}

function normalizePath(value) {
  return cleanText(value).replace(/\\/g, "/");
}

function refreshUpdatedAt(document, candidates = []) {
  const latest = candidates
    .map((value) => new Date(String(value || "")).getTime())
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => b - a)[0];
  document.updatedAt = Number.isFinite(latest)
    ? new Date(latest).toISOString()
    : new Date().toISOString();
  return document;
}

function filterNdjson(filePath, shouldKeep) {
  if (!fs.existsSync(filePath)) return 0;
  const lines = String(fs.readFileSync(filePath, "utf8") || "").split(/\r?\n/g);
  const kept = [];
  let removed = 0;
  for (const line of lines) {
    if (!line.trim()) continue;
    if (shouldKeep(line)) {
      kept.push(line);
    } else {
      removed += 1;
    }
  }
  fs.writeFileSync(filePath, kept.length ? `${kept.join("\n")}\n` : "", "utf8");
  return removed;
}

function readNdjson(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  return String(fs.readFileSync(filePath, "utf8") || "")
    .split(/\r?\n/g)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function collectKeyValues(node, targetKey, output = []) {
  if (!node || typeof node !== "object") {
    return output;
  }
  if (Array.isArray(node)) {
    node.forEach((entry) => collectKeyValues(entry, targetKey, output));
    return output;
  }
  for (const [key, value] of Object.entries(node)) {
    if (key === targetKey && value !== undefined && value !== null) {
      output.push(cleanText(value));
    }
    collectKeyValues(value, targetKey, output);
  }
  return output;
}

function isSyntheticDispatchId(value) {
  const normalized = cleanText(value);
  return Boolean(normalized)
    && normalized.endsWith(syntheticDispatchSuffix)
    && /^\d{14}-/.test(normalized);
}

function buildDispatchFolderRef(dispatchId) {
  const normalized = cleanText(dispatchId);
  return normalized ? `integrations/worker-router/dispatches/${normalized}` : "";
}

function readDispatchPayloads(dispatchRoot) {
  if (!fs.existsSync(dispatchRoot)) {
    return [];
  }
  return fs.readdirSync(dispatchRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const dispatchDir = path.join(dispatchRoot, entry.name);
      const dispatchPath = path.join(dispatchDir, "dispatch.json");
      const payload = readJson(dispatchPath, null);
      return payload ? { dispatchDir, payload } : null;
    })
    .filter(Boolean);
}

function matchesSyntheticDispatch(payload = {}) {
  return String(payload.workerId || "").trim() === "local_codex"
    && String(payload.title || payload.recommendation?.input?.title || "").trim() === syntheticFailureTitle
    && String(payload.recommendation?.input?.objective || "").trim() === syntheticFailureObjective
    && String(payload.error || "").trim() === syntheticFailureError
    && String(payload.leaseStatus || payload.lease?.status || "").trim() === "failed";
}

function collectSyntheticRefs(dispatchRoot) {
  const refs = {
    dispatchIds: new Set(),
    taskIds: new Set(),
    leaseIds: new Set(),
    dispatchDirs: new Set(),
    dispatchFolders: new Set()
  };
  for (const { dispatchDir, payload } of readDispatchPayloads(dispatchRoot)) {
    if (!matchesSyntheticDispatch(payload)) {
      continue;
    }
    const dispatchId = String(payload.id || "").trim();
    const taskId = String(payload.taskId || "").trim();
    const leaseId = String(payload.leaseId || payload.lease?.leaseId || "").trim();
    if (dispatchId) refs.dispatchIds.add(dispatchId);
    if (taskId) refs.taskIds.add(taskId);
    if (leaseId) refs.leaseIds.add(leaseId);
    refs.dispatchDirs.add(dispatchDir);
    refs.dispatchFolders.add(dispatchDir.replace(/\\/g, "/"));
  }
  return refs;
}

function lineMentionsSyntheticRef(line, refs) {
  return [...refs.dispatchIds, ...refs.taskIds, ...refs.leaseIds, ...refs.dispatchFolders]
    .some((token) => token && line.includes(token));
}

function augmentRefsFromGraphRecords(records, refs) {
  const source = Array.isArray(records) ? records : [];
  for (const record of source) {
    const dispatchIds = collectKeyValues(record, "dispatchId", [])
      .map((value) => cleanText(value))
      .filter(Boolean);
    const taskIds = collectKeyValues(record, "taskId", [])
      .map((value) => cleanText(value))
      .filter(Boolean);
    const leaseIds = collectKeyValues(record, "leaseId", [])
      .map((value) => cleanText(value))
      .filter(Boolean);
    const isSynthetic = dispatchIds.some((dispatchId) => isSyntheticDispatchId(dispatchId) || refs.dispatchIds.has(dispatchId))
      || taskIds.some((taskId) => refs.taskIds.has(taskId))
      || leaseIds.some((leaseId) => refs.leaseIds.has(leaseId));
    if (!isSynthetic) {
      continue;
    }
    dispatchIds.forEach((dispatchId) => {
      refs.dispatchIds.add(dispatchId);
      const folderRef = buildDispatchFolderRef(dispatchId);
      if (folderRef) refs.dispatchFolders.add(folderRef);
    });
    taskIds.forEach((taskId) => refs.taskIds.add(taskId));
    leaseIds.forEach((leaseId) => refs.leaseIds.add(leaseId));
  }
}

function cleanupSyntheticTestArtifacts() {
  const taskLedgerPath = resolveDataPath("task-ledger.json");
  const leaseLedgerPath = resolveDataPath("task-lease-ledger.json");
  const eventLogPath = resolveDataPath("graph-runtime-events.ndjson");
  const manifestLogPath = resolveDataPath("graph-runtime-manifests.ndjson");
  const dispatchRoot = resolveDataPath("integrations", "worker-router", "dispatches");
  const refs = collectSyntheticRefs(dispatchRoot);
  augmentRefsFromGraphRecords(readNdjson(eventLogPath), refs);
  augmentRefsFromGraphRecords(readNdjson(manifestLogPath), refs);

  const taskLedger = readJson(taskLedgerPath, null);
  const leaseLedger = readJson(leaseLedgerPath, null);
  if (!taskLedger || !leaseLedger) {
    return { ok: true, removed: 0, reason: "missing_ledgers" };
  }
  const taskEvents = Array.isArray(taskLedger.events) ? taskLedger.events : [];
  const leases = Array.isArray(leaseLedger.leases) ? leaseLedger.leases : [];
  if (refs.leaseIds.size < 1) {
    for (const leaseId of leases
      .filter((lease) => refs.taskIds.has(cleanText(lease?.taskId)))
      .map((lease) => cleanText(lease?.leaseId))
      .filter(Boolean)) {
      refs.leaseIds.add(leaseId);
    }
  }
  if (refs.taskIds.size < 1) {
    for (const taskId of taskEvents
      .filter((event) => refs.leaseIds.has(cleanText(event?.detail?.leaseId)) || refs.leaseIds.has(cleanText(event?.leaseId)))
      .map((event) => cleanText(event?.taskId))
      .filter(Boolean)) {
      refs.taskIds.add(taskId);
    }
    for (const taskId of leases
      .filter((lease) => refs.leaseIds.has(cleanText(lease?.leaseId)))
      .map((lease) => cleanText(lease?.taskId))
      .filter(Boolean)) {
      refs.taskIds.add(taskId);
    }
  }
  if (refs.taskIds.size < 1 && refs.leaseIds.size < 1) {
    return { ok: true, removed: 0, reason: "no_synthetic_refs_found" };
  }

  const tasks = Array.isArray(taskLedger.tasks) ? taskLedger.tasks : [];
  const removedTaskIds = tasks
    .map((task) => cleanText(task?.id))
    .filter((taskId) => refs.taskIds.has(taskId));
  taskLedger.tasks = tasks
    .filter((task) => !refs.taskIds.has(cleanText(task.id)));
  taskLedger.events = taskEvents
    .filter((event) =>
      !refs.taskIds.has(cleanText(event.taskId))
      && !refs.leaseIds.has(cleanText(event.detail?.leaseId))
      && !refs.leaseIds.has(cleanText(event.leaseId)));
  refreshUpdatedAt(taskLedger, [
    ...(Array.isArray(taskLedger.tasks) ? taskLedger.tasks.flatMap((task) => [task.updatedAt, task.createdAt, task.completedAt]) : []),
    ...(Array.isArray(taskLedger.events) ? taskLedger.events.map((event) => event.at) : [])
  ]);
  writeJson(taskLedgerPath, taskLedger);

  const removedLeaseIds = leases
    .map((lease) => cleanText(lease?.leaseId))
    .filter((leaseId) => refs.leaseIds.has(leaseId));
  leaseLedger.leases = leases
    .filter((lease) => !refs.leaseIds.has(cleanText(lease.leaseId)));
  leaseLedger.events = (Array.isArray(leaseLedger.events) ? leaseLedger.events : [])
    .filter((event) =>
      !refs.leaseIds.has(cleanText(event.leaseId))
      && !refs.taskIds.has(cleanText(event.taskId)));
  refreshUpdatedAt(leaseLedger, [
    ...(Array.isArray(leaseLedger.leases) ? leaseLedger.leases.flatMap((lease) => [lease.updatedAt, lease.acquiredAt, lease.releasedAt, lease.expiresAt]) : []),
    ...(Array.isArray(leaseLedger.events) ? leaseLedger.events.map((event) => event.at) : [])
  ]);
  writeJson(leaseLedgerPath, leaseLedger);

  let removedDispatchDirs = 0;
  const removedDispatchIds = [];
  for (const dispatchDir of refs.dispatchDirs) {
    removedDispatchIds.push(cleanText(path.basename(dispatchDir)));
    fs.rmSync(dispatchDir, { recursive: true, force: true });
    removedDispatchDirs += 1;
  }

  const removedEventLines = filterNdjson(eventLogPath, (line) => !lineMentionsSyntheticRef(line, refs));
  const removedManifestLines = filterNdjson(manifestLogPath, (line) => !lineMentionsSyntheticRef(line, refs));

  return {
    ok: true,
    removedTasks: removedTaskIds.length,
    removedTaskIds,
    removedLeases: removedLeaseIds.length,
    removedLeaseIds,
    removedDispatchIds,
    removedDispatchDirs,
    removedEventLines,
    removedManifestLines
  };
}

if (require.main === module) {
  console.log(JSON.stringify(cleanupSyntheticTestArtifacts()));
}

module.exports = {
  cleanupSyntheticTestArtifacts
};
