"use strict";

const fs = require("fs");
const path = require("path");
const {
  buildWalStateContract
} = require("./originalHermesAgentContracts");
const { sha256, stableStringify } = require("./bimlFeedbackContract");
const { resolveDataPath } = require("../runtimePaths");
const agentSessionStore = require("../agentSessionStore");
const taskLedgerStore = require("../taskLedgerStore");
const mistakeLedgerStore = require("../mistakeLedgerStore");

const SNAPSHOT_ID = "original-hermes-agent-wal-state-runtime.v1";

const STORE_SURFACES = [
  {
    id: "agent_sessions",
    path: agentSessionStore.SESSIONS_PATH || resolveDataPath("agent-sessions.json"),
    owner: "agentSessionStore",
    mode: "json_atomic_rewrite",
    requiredNextGate: "wal_or_lock_before_multi_process_write"
  },
  {
    id: "task_ledger",
    path: taskLedgerStore.taskLedgerPath || resolveDataPath("task-ledger.json"),
    owner: "taskLedgerStore",
    mode: "json_atomic_rewrite",
    requiredNextGate: "wal_or_lock_before_multi_process_write"
  },
  {
    id: "mistake_ledger",
    path: mistakeLedgerStore.MISTAKE_LEDGER_PATH || resolveDataPath("mistake-ledger.ndjson"),
    owner: "mistakeLedgerStore",
    mode: "ndjson_append",
    requiredNextGate: "append_batch_file_cap_and_pattern_sync"
  },
  {
    id: "memory",
    path: resolveDataPath("memory.json"),
    owner: "memoryStore",
    mode: "json_store",
    requiredNextGate: "wal_manifest_before_session_lineage"
  },
  {
    id: "notebook",
    path: resolveDataPath("notebook.json"),
    owner: "notebookStore",
    mode: "json_store",
    requiredNextGate: "wal_manifest_before_session_lineage"
  }
];

function digestRecord(record) {
  return sha256(stableStringify(record));
}

function readTextSafe(filePath) {
  try {
    return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  } catch {
    return "";
  }
}

function statFile(filePath) {
  try {
    const stat = fs.statSync(filePath);
    return {
      exists: true,
      bytes: stat.size,
      modifiedAt: stat.mtime.toISOString()
    };
  } catch {
    return {
      exists: false,
      bytes: 0,
      modifiedAt: ""
    };
  }
}

function listTempSiblings(filePath) {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  try {
    return fs.readdirSync(dir)
      .filter((name) => name.startsWith(`${base}.tmp-`) || name.startsWith(`${base}.wal-`))
      .map((name) => {
        const fullPath = path.join(dir, name);
        return {
          name,
          path: fullPath,
          ...statFile(fullPath)
        };
      })
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));
  } catch {
    return [];
  }
}

function inspectStore(surface) {
  const stat = statFile(surface.path);
  const tempFiles = listTempSiblings(surface.path);
  const sourcePath = path.join(path.resolve(__dirname, ".."), `${surface.owner}.js`);
  const source = readTextSafe(sourcePath);
  const hasAtomicRename = /renameSync\s*\(/.test(source);
  const hasAppend = /appendFileSync\s*\(/.test(source);
  const hasExplicitWal = /\bwal\b/i.test(source);
  const secretPattern = /(secret|token|password|api[_-]?key|bearer|credential)/i;
  const risk = [];
  const jsonRewriteMode = surface.mode === "json_store" || surface.mode === "json_atomic_rewrite";
  if (jsonRewriteMode && !hasExplicitWal) risk.push("json_store_without_explicit_wal");
  if (tempFiles.length > 0) risk.push("stale_temp_siblings_present");
  if (secretPattern.test(source)) risk.push("source_mentions_secret_terms_verify_no_state_rows");
  return {
    ...surface,
    stat,
    sourcePath,
    sourceSignals: {
      hasAtomicRename,
      hasAppend,
      hasExplicitWal
    },
    tempFiles: tempFiles.map((item) => ({
      name: item.name,
      bytes: item.bytes,
      modifiedAt: item.modifiedAt
    })),
    risk,
    recommendedMode: surface.mode === "ndjson_append"
      ? "append_only_with_batch_digest_and_file_cap"
      : "sqlite_wal_or_single_writer_lock_manifest_before_runtime_migration",
    digest: digestRecord({ surface, stat, tempFiles: tempFiles.map((item) => item.name), risk })
  };
}

function buildOriginalHermesWalStateSnapshot(options = {}) {
  const generatedAt = options.generatedAt || new Date().toISOString();
  const contract = buildWalStateContract({
    generatedAt,
    sourceDigest: options.sourceDigest || ""
  });
  const stores = STORE_SURFACES.map(inspectStore);
  const tempFileCount = stores.reduce((sum, store) => sum + store.tempFiles.length, 0);
  const jsonRewriteStores = stores.filter((store) => store.mode === "json_store" || store.mode === "json_atomic_rewrite");
  const snapshot = {
    id: SNAPSHOT_ID,
    generatedAt,
    status: "WAL_STATE_MANIFEST_READY_MIGRATION_BLOCKED",
    contract,
    stores,
    summary: {
      storeCount: stores.length,
      jsonRewriteStoreCount: jsonRewriteStores.length,
      appendOnlyStoreCount: stores.filter((store) => store.mode === "ndjson_append").length,
      tempFileCount,
      migrationWrites: 0,
      dataDeletes: 0,
      secretsImported: 0
    },
    gates: [
      "manifest_first",
      "no_store_migration_until_smoke",
      "single_writer_or_sqlite_wal_required",
      "stale_temp_cleanup_requires_operator_review",
      "secret_material_forbidden_in_state_rows"
    ],
    executionPolicy: {
      manifestOnly: true,
      migratesStores: false,
      deletesTempFiles: false,
      importsSecrets: false,
      launchesDaemons: false
    },
    language: {
      human: "Original Hermes WAL/session state is staged as a store manifest and migration gate before any runtime state migration.",
      agent: "(original_hermes, wal.state, behcs, 1, session_memory, manifest, staged, [json+ndjson+temp_siblings], map_mapped, IX, log, persistent, whiteroom, light)",
      device: "original_hermes_wal_state status=manifest_only migration=0 deletes=0 secrets=0"
    }
  };
  return {
    ...snapshot,
    validation: validateWalStateSnapshot(snapshot),
    digest: digestRecord(snapshot)
  };
}

function validateWalStateSnapshot(snapshot = {}) {
  const errors = [];
  const warnings = [];
  if (snapshot.id !== SNAPSHOT_ID) errors.push("wrong_snapshot_id");
  if (!snapshot.contract?.digest) errors.push("missing_contract_digest");
  if (snapshot.executionPolicy?.manifestOnly !== true) errors.push("manifest_only_not_enforced");
  if (snapshot.executionPolicy?.migratesStores !== false) errors.push("migration_not_blocked");
  if (snapshot.executionPolicy?.deletesTempFiles !== false) errors.push("temp_deletion_not_blocked");
  if (snapshot.summary?.migrationWrites !== 0) errors.push("migration_write_count_nonzero");
  if (snapshot.summary?.dataDeletes !== 0) errors.push("data_delete_count_nonzero");
  if (!Array.isArray(snapshot.stores) || snapshot.stores.length < 1) errors.push("missing_store_surfaces");
  for (const store of snapshot.stores || []) {
    if (!store.digest) errors.push(`store_missing_digest:${store.id || "unknown"}`);
    if (!store.path) errors.push(`store_missing_path:${store.id || "unknown"}`);
    if (!store.requiredNextGate) warnings.push(`store_missing_required_gate:${store.id || "unknown"}`);
  }
  if (Number(snapshot.summary?.tempFileCount || 0) > 0) warnings.push("stale_temp_siblings_present_cleanup_blocked");
  return {
    ok: errors.length === 0,
    errors,
    warnings,
    digest: digestRecord({ id: snapshot.id, errors, warnings, summary: snapshot.summary })
  };
}

function manifest() {
  return {
    id: SNAPSHOT_ID,
    description: "Manifest-only Original Hermes WAL/session-state runtime staging for BEHCS stores.",
    capabilities: ["store_surface_inventory", "temp_sibling_detection", "wal_migration_gate", "session_lineage_readiness"],
    sideEffects: [],
    defaultExecution: "manifest_only_no_store_migration"
  };
}

module.exports = {
  SNAPSHOT_ID,
  STORE_SURFACES,
  buildOriginalHermesWalStateSnapshot,
  validateWalStateSnapshot,
  manifest
};
