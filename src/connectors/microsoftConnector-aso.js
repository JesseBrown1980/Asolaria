/**
 * microsoftConnector-aso.js — ASO-aware wrapper around microsoftConnector.
 *
 * Re-exports every original export unchanged, except key operational
 * functions which are wrapped with `withAso` so that invocations, successes,
 * and failures are automatically recorded in the ASO index.
 */

const ms = require("./microsoftConnector");
const { withAso } = require("../aso-connector-middleware");

const wrappedSetMicrosoftOAuthConfig        = withAso("microsoft", ms.setMicrosoftOAuthConfig);
const wrappedGetMicrosoftIntegrationStatus  = withAso("microsoft", ms.getMicrosoftIntegrationStatus);
const wrappedListConnectedMicrosoftAccounts = withAso("microsoft", ms.listConnectedMicrosoftAccounts);

module.exports = {
  ...ms,
  setMicrosoftOAuthConfig:        wrappedSetMicrosoftOAuthConfig,
  getMicrosoftIntegrationStatus:  wrappedGetMicrosoftIntegrationStatus,
  listConnectedMicrosoftAccounts: wrappedListConnectedMicrosoftAccounts,
};
