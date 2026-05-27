/**
 * googleConnector-aso.js — ASO-aware wrapper around googleConnector.
 */
const google = require("./googleConnector");
const { withAso, registerConnector } = require("../aso-connector-middleware");

registerConnector("google", "googleapis.com", 443);

const wrappedListGmail     = withAso("google", google.listGmailMessages);
const wrappedListCalendars = withAso("google", google.listCalendars);
const wrappedListEvents    = withAso("google", google.listUpcomingEvents);
const wrappedSearchDrive   = withAso("google", google.searchDriveDocs);
const wrappedGetDocText    = withAso("google", google.getGoogleDocPlainText);
const wrappedApiRequest    = withAso("google", google.googleApiRequest);
const wrappedGetStatus     = withAso("google", google.getGoogleIntegrationStatus);

module.exports = {
  ...google,
  listGmailMessages:        wrappedListGmail,
  listCalendars:            wrappedListCalendars,
  listUpcomingEvents:       wrappedListEvents,
  searchDriveDocs:          wrappedSearchDrive,
  getGoogleDocPlainText:    wrappedGetDocText,
  googleApiRequest:         wrappedApiRequest,
  getGoogleIntegrationStatus: wrappedGetStatus,
};
