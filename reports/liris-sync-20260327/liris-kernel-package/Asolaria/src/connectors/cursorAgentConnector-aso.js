/**
 * cursorAgentConnector-aso.js — ASO-aware wrapper around cursorAgentConnector.
 *
 * Re-exports every original export unchanged, except key operational
 * functions which are wrapped with `withAso` so that invocations, successes,
 * and failures are automatically recorded in the ASO index.
 */

const ca = require("./cursorAgentConnector");
const { withAso } = require("../aso-connector-middleware");

const wrappedRunCursorAgent       = withAso("cursorAgent", ca.runCursorAgent);
const wrappedRunCursorAgentCli    = withAso("cursorAgent", ca.runCursorAgentCli);
const wrappedGetCursorAgentStatus = withAso("cursorAgent", ca.getCursorAgentStatus);

module.exports = {
  ...ca,
  runCursorAgent:       wrappedRunCursorAgent,
  runCursorAgentCli:    wrappedRunCursorAgentCli,
  getCursorAgentStatus: wrappedGetCursorAgentStatus,
};
