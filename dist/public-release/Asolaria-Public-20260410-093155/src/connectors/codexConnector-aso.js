/**
 * codexConnector-aso.js — ASO-aware wrapper around codexConnector.
 *
 * Re-exports every original export unchanged, except key operational
 * functions which are wrapped with `withAso` so that invocations, successes,
 * and failures are automatically recorded in the ASO index.
 */

const codex = require("./codexConnector");
const { withAso } = require("../aso-connector-middleware");

const wrappedRunCodex = withAso("codex", codex.runCodex);

module.exports = {
  ...codex,
  runCodex: wrappedRunCodex,
};
