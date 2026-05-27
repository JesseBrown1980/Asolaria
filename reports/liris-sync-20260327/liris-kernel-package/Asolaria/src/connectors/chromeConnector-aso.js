/**
 * chromeConnector-aso.js — ASO-aware wrapper around chromeConnector.
 */
const chrome = require("./chromeConnector");
const { withAso, registerConnector } = require("../aso-connector-middleware");

registerConnector("chrome", "localhost", 0);

const wrappedOpenUrl   = withAso("chrome", chrome.openChromeUrl);
const wrappedLaunchUrl = withAso("chrome", chrome.launchChromeUrl);

module.exports = {
  ...chrome,
  openChromeUrl:   wrappedOpenUrl,
  launchChromeUrl: wrappedLaunchUrl,
};
