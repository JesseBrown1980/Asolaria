/**
 * Mobile Auth Middleware — extracted from server.js (ADR-0001 Phase 3)
 *
 * Auth middleware chain for mobile/phone/desktop routes.
 * Initialized with server.js auth functions via init().
 */

const { respondError } = require("./helpers");
const { isLoopbackRequest } = require("./network");
const settings = require("./settings");

let _ctx = null;

function init(ctx) {
  _ctx = ctx;
}

function requireMobileAuth(req, res, next) {
  if (!_ctx.verifyMobileToken(req)) {
    return respondError(res, "Unauthorized mobile approval access.", 403);
  }
  return next();
}

function requirePhoneBridgeAccess(req, res, next) {
  if (isLoopbackRequest(req)) return next();
  if (!_ctx.verifyMobileTokenStrict(req)) {
    return _ctx.denyRemoteRequest(res, "Unauthorized phone bridge access.");
  }
  const s = settings.get();
  if (s.networkRequireEncryptedRemote && !_ctx.isTransportEncrypted(req)) {
    return _ctx.denyRemoteRequest(res, "Encrypted transport is required for phone bridge access.");
  }
  return next();
}

function requireMobileDirectControlEnabled(_req, res, next) {
  if (settings.get().networkMobileDirectControlEnabled) return next();
  return respondError(res, "Direct mobile desktop control is disabled by policy. Use mobile chat (Ask Asolaria) instead.", 403);
}

function requireDesktopSuperMasterAuthority(req, res, next) {
  const authority = _ctx.resolveDesktopSuperMasterAccess(req);
  req.asolariaAuthority = authority;
  if (authority.allowed) return next();
  const actorHint = authority.actorId ? `actor "${authority.actorId}" (${authority.role})` : "actor is missing";
  return _ctx.denyRemoteRequest(res, `Desktop super-master authority is required (${actorHint}; reason=${authority.reason}).`);
}

function requireLoopbackOnly(req, res, next) {
  if (!isLoopbackRequest(req)) return respondError(res, "This endpoint is only allowed from local loopback.", 403);
  return next();
}

module.exports = {
  init,
  requireMobileAuth,
  requirePhoneBridgeAccess,
  requireMobileDirectControlEnabled,
  requireDesktopSuperMasterAuthority,
  requireLoopbackOnly
};
