/**
 * desktopCaptureConnector-aso.js — ASO-aware wrapper around desktopCaptureConnector.
 *
 * Re-exports every original export unchanged, except key operational
 * functions which are wrapped with `withAso` so that invocations, successes,
 * and failures are automatically recorded in the ASO index.
 */

const dc = require("./desktopCaptureConnector");
const { withAso } = require("../aso-connector-middleware");

const wrappedCaptureDesktopSnapshot       = withAso("desktopCapture", dc.captureDesktopSnapshot);
const wrappedCaptureDesktopLayoutAndWindow = withAso("desktopCapture", dc.captureDesktopLayoutAndWindow);

module.exports = {
  ...dc,
  captureDesktopSnapshot:       wrappedCaptureDesktopSnapshot,
  captureDesktopLayoutAndWindow: wrappedCaptureDesktopLayoutAndWindow,
};
