/**
 * Storage Migration Layer — Phase 2 (OpenAI Recommendation 11)
 *
 * Provides an async IndexedDB-backed storage layer that replaces localStorage
 * for large/sensitive data while keeping localStorage for small UI preferences.
 *
 * Per OpenAI Deep Research: "move caches and pseudo-database content into IndexedDB
 * (async, transactional, built for larger client datasets), and enforce a schema/version
 * strategy so old keys can be migrated or discarded predictably."
 *
 * Usage:
 *   const store = new AsolariaStore();
 *   await store.init();
 *   await store.set("key", value);
 *   const val = await store.get("key");
 */

const DB_NAME = "asolaria_store";
const DB_VERSION = 1;
const STORE_NAME = "kv";

// Keys that are SAFE in localStorage (small, non-sensitive UI prefs)
const LOCALSTORAGE_SAFE_KEYS = new Set([
  "asolaria_ui_experience_mode",
  "asolaria_project_scope",
  "asolaria_chat_route_mode",
  "asolaria_admin_terminal_autoensure",
  "asolaria_startup_brain_autorun",
  "asolaria_avatar_greeting"
]);

// Keys that MUST migrate to IndexedDB (large data or sensitive)
const INDEXEDDB_REQUIRED_KEYS = new Set([
  "asolaria_chat_threads",
  "asolaria_chat_safety_metrics",
  "asolaria_chat_focus_turnover",
  "asolaria_chat_pinned_threads",
  "asolaria_chat_task_links",
  "asolaria_chat_abacus_pack",
  "asolaria_chat_close_loop_dismissals",
  "asolaria_realtime_flow_prefs",
  "asolaria_natural20_daily"
]);

class AsolariaStore {
  constructor() {
    this.db = null;
    this.ready = false;
  }

  async init() {
    if (this.ready) return;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = (event) => {
        this.db = event.target.result;
        this.ready = true;
        resolve();
      };
      request.onerror = () => reject(new Error("IndexedDB init failed"));
    });
  }

  async get(key) {
    if (!this.ready) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(new Error(`IndexedDB get failed: ${key}`));
    });
  }

  async set(key, value) {
    if (!this.ready) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`IndexedDB set failed: ${key}`));
    });
  }

  async remove(key) {
    if (!this.ready) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`IndexedDB remove failed: ${key}`));
    });
  }

  async keys() {
    if (!this.ready) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAllKeys();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error("IndexedDB keys failed"));
    });
  }

  // Migrate a key from localStorage to IndexedDB
  async migrateFromLocalStorage(localKey, idbKey) {
    const raw = localStorage.getItem(localKey);
    if (raw === null) return { migrated: false, reason: "not_found" };
    try {
      const value = JSON.parse(raw);
      await this.set(idbKey || localKey, value);
      localStorage.removeItem(localKey);
      return { migrated: true, key: idbKey || localKey, size: raw.length };
    } catch (e) {
      await this.set(idbKey || localKey, raw);
      localStorage.removeItem(localKey);
      return { migrated: true, key: idbKey || localKey, size: raw.length, parseError: true };
    }
  }

  // Run full migration for all INDEXEDDB_REQUIRED_KEYS
  async migrateAll() {
    const results = [];
    for (const key of INDEXEDDB_REQUIRED_KEYS) {
      const result = await this.migrateFromLocalStorage(key, key);
      if (result.migrated) results.push(result);
    }
    return { migrated: results.length, details: results };
  }

  // Smart get: try IndexedDB first, fall back to localStorage
  async smartGet(key) {
    try {
      const idbValue = await this.get(key);
      if (idbValue !== null) return idbValue;
    } catch (_) {}
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    try { return JSON.parse(raw); } catch (_) { return raw; }
  }

  // Smart set: route to IndexedDB or localStorage based on key classification
  async smartSet(key, value) {
    if (LOCALSTORAGE_SAFE_KEYS.has(key)) {
      localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
      return;
    }
    await this.set(key, value);
  }
}

// Export for use in app.js
if (typeof window !== "undefined") {
  window.AsolariaStore = AsolariaStore;
  window.LOCALSTORAGE_SAFE_KEYS = LOCALSTORAGE_SAFE_KEYS;
  window.INDEXEDDB_REQUIRED_KEYS = INDEXEDDB_REQUIRED_KEYS;
}
