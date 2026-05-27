/**
 * anthropicCliConnector-aso.js — ASO-aware wrapper around anthropicCliConnector.
 */
const anthropic = require("./anthropicCliConnector");
const { withAso, registerConnector } = require("../aso-connector-middleware");

registerConnector("anthropicCli", "localhost", 0);

const wrappedRunClaudeCli      = withAso("anthropicCli", anthropic.runClaudeCli);
const wrappedRunAnthropicCli   = withAso("anthropicCli", anthropic.runAnthropicCli);
const wrappedGetStatus         = withAso("anthropicCli", anthropic.getAnthropicCliStatus);

module.exports = {
  ...anthropic,
  runClaudeCli:          wrappedRunClaudeCli,
  runAnthropicCli:       wrappedRunAnthropicCli,
  getAnthropicCliStatus: wrappedGetStatus,
};
