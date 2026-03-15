/**
 * Server Context Singleton — Phase 3 final unlock
 *
 * Bundles all server.js inline functions into a single importable context.
 * Initialized once by server.js after all functions are defined.
 * Route modules can require("../lib/serverContext").get() to access any function.
 */

let _ctx = null;

function init(ctx) {
  _ctx = ctx;
}

function get() {
  if (!_ctx) throw new Error("serverContext not initialized.");
  return _ctx;
}

function call(name, ...args) {
  if (!_ctx || typeof _ctx[name] !== "function") {
    throw new Error(`serverContext.${name} is not available.`);
  }
  return _ctx[name](...args);
}

module.exports = { init, get, call };
