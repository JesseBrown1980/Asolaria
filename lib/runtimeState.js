/**
 * Runtime State Singleton — extracted from server.js (ADR-0001 Phase 3)
 *
 * Holds the live mutable runtime state (voice, avatar, telegram, mobile push, etc.)
 * Initialized by server.js at startup via init(). Route modules import directly.
 */

let _state = null;

function init(stateObj) {
  _state = stateObj;
}

function get() {
  if (!_state) throw new Error("runtimeState not initialized. Call runtimeState.init() from server.js first.");
  return _state;
}

function read(key, fallback) {
  if (!_state) return fallback;
  return _state[key] !== undefined ? _state[key] : fallback;
}

module.exports = { init, get, read };
