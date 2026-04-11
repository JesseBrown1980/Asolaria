/**
 * notebooklmConnector-aso.js — ASO-aware wrapper around notebooklmConnector.
 *
 * Re-exports every original export unchanged, except key operational
 * functions which are wrapped with `withAso` so that invocations, successes,
 * and failures are automatically recorded in the ASO index.
 */

const nlm = require("./notebooklmConnector");
const { withAso } = require("../aso-connector-middleware");

const wrappedRunNotebooklmAsk                    = withAso("notebooklm", nlm.runNotebooklmAsk);
const wrappedListNotebooklmEnterpriseNotebooks   = withAso("notebooklm", nlm.listNotebooklmEnterpriseNotebooks);
const wrappedCreateNotebooklmEnterpriseNotebook  = withAso("notebooklm", nlm.createNotebooklmEnterpriseNotebook);
const wrappedBatchCreateNotebooklmSources        = withAso("notebooklm", nlm.batchCreateNotebooklmSources);
const wrappedGetNotebooklmEnterpriseStatus       = withAso("notebooklm", nlm.getNotebooklmEnterpriseStatus);

module.exports = {
  ...nlm,
  runNotebooklmAsk:                   wrappedRunNotebooklmAsk,
  listNotebooklmEnterpriseNotebooks:  wrappedListNotebooklmEnterpriseNotebooks,
  createNotebooklmEnterpriseNotebook: wrappedCreateNotebooklmEnterpriseNotebook,
  batchCreateNotebooklmSources:       wrappedBatchCreateNotebooklmSources,
  getNotebooklmEnterpriseStatus:      wrappedGetNotebooklmEnterpriseStatus,
};
