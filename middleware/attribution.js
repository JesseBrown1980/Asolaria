/**
 * Request Attribution Middleware
 * Phase 2: Logs actor, source, IP, and timestamp for every API request.
 * Feeds into request-attribution.ndjson so the chained gateway audit log
 * only contains hash-linked gateway events.
 */

const fs = require("fs");
const path = require("path");

const ATTRIBUTION_PATH = path.join(__dirname, "..", "data", "request-attribution.ndjson");

function nowIso() {
  return new Date().toISOString();
}

function getClientIp(req) {
  return req.ip || req.connection?.remoteAddress || "unknown";
}

function isLoopback(ip) {
  return ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1";
}

function attributionMiddleware(options = {}) {
  const { logAllRequests = false, logMutationsOnly = true } = options;

  return function attribution(req, _res, next) {
    const ip = getClientIp(req);
    const method = req.method;
    const url = req.originalUrl || req.url;

    // Attach attribution to request for downstream use
    req.attribution = {
      ip,
      isLoopback: isLoopback(ip),
      actor: req.authLabel || (isLoopback(ip) ? "loopback" : "external"),
      role: req.authRole || (isLoopback(ip) ? "admin" : "unknown"),
      source: req.authSource || (isLoopback(ip) ? "loopback" : "network"),
      method,
      path: url.split("?")[0],
      at: nowIso()
    };

    // Log mutations (POST/PUT/DELETE/PATCH) or all if configured
    const isMutation = ["POST", "PUT", "DELETE", "PATCH"].includes(method);
    if (logAllRequests || (logMutationsOnly && isMutation)) {
      const entry = {
        ...req.attribution,
        userAgent: (req.headers["user-agent"] || "").slice(0, 120),
        query: url.includes("?") ? url.split("?")[1]?.slice(0, 200) : undefined
      };

      try {
        fs.mkdirSync(path.dirname(ATTRIBUTION_PATH), { recursive: true });
        fs.appendFileSync(ATTRIBUTION_PATH, JSON.stringify(entry) + "\n", "utf8");
      } catch {}
    }

    // Phase 10: Emit graph event for GNN training dataset collection
    // Every request is an edge: actor → route → target
    try {
      const { appendGraphEvent } = require("../src/graphRuntimeStore");
      appendGraphEvent({
        component: "api_gateway",
        category: "route",
        action: `${method.toLowerCase()}_${req.attribution.path.replace(/\//g, "_").replace(/^_api_/, "")}`,
        actor: {
          type: req.attribution.isLoopback ? "local_client" : "remote_client",
          id: req.attribution.actor,
          domain: req.attribution.isLoopback ? "local" : "remote"
        },
        target: {
          type: "api_route",
          id: req.attribution.path,
          domain: "local"
        },
        context: {
          method, isMutation,
          role: req.attribution.role,
          source: req.attribution.source
        },
        policy: {
          approvalState: "not_required",
          mode: "request_logging",
          autonomous: true
        },
        status: "completed"
      });
    } catch (_) { /* non-critical — don't break requests for graph logging */ }

    next();
  };
}

module.exports = { attributionMiddleware, getClientIp, isLoopback };
