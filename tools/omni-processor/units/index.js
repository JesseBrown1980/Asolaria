"use strict";
/**
 * Unit registry — named-unit dispatch for the omni-processor.
 *
 * When a POST /omni/submit arrives with target.unit_id that matches a
 * registered unit here, the handler calls unit.run(inputs, manifest_id)
 * INSTEAD of running body.code in the sandbox runner.
 *
 * This supports the acer-style call-by-named-operation dispatch model
 * alongside the liris-style send-code-to-sandbox model.
 */

const documentShare = require("./document-share");

const _units = new Map();

function register(unit) {
  if (!unit.unit_id) throw new Error("unit missing unit_id");
  if (typeof unit.run !== "function") throw new Error("unit missing run function");
  _units.set(unit.unit_id, unit);
}

function get(unit_id) {
  return _units.get(unit_id);
}

function list() {
  return Array.from(_units.values()).map(u => ({
    unit_id: u.unit_id,
    cube: u.cube,
    cube_law: u.cube_law,
    dim: u.dim,
    tier: u.tier,
    v2_class: u.v2_class
  }));
}

// ─── Register all units ───────────────────────────────────────────────────
register(documentShare);

module.exports = { register, get, list };
