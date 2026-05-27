/**
 * Manifest Sync Routes — IX-477 breakthrough as code.
 * Generates route manifests for colony sync.
 * The manifest IS the codebase spec. Colonies sync from contracts, not files.
 */
const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();

const ROUTES_DIR = path.join(__dirname);

function extractRouteManifest(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n").length;
    const endpoints = [...content.matchAll(/\.(get|post|put|delete|patch)\s*\(\s*["']([^"']+)["']/g)]
      .map(m => m[1].toUpperCase() + " " + m[2]);
    const deps = [...content.matchAll(/require\s*\(\s*["']([^"']+)["']\s*\)/g)]
      .map(m => m[1]).filter(r => r.startsWith("../"));
    const isFactory = /module\.exports\s*=\s*(create|function)/.test(content);
    const hasManifest = /function\s+manifest\s*\(/.test(content);
    return {
      file: path.basename(filePath),
      lines,
      endpoints: endpoints.length,
      routes: endpoints,
      deps,
      factory: isFactory,
      hasManifest
    };
  } catch (err) {
    return { file: path.basename(filePath), error: err.message };
  }
}

// GET /api/manifest-sync/routes — full route manifest
router.get("/routes", (_req, res) => {
  try {
    const files = fs.readdirSync(ROUTES_DIR).filter(f => f.endsWith(".js") && f !== "manifestSync.js");
    const manifests = files.map(f => extractRouteManifest(path.join(ROUTES_DIR, f)));
    return res.json({
      ok: true,
      count: manifests.length,
      totalEndpoints: manifests.reduce((sum, m) => sum + (m.endpoints || 0), 0),
      manifests
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/manifest-sync/connectors — connector manifest
router.get("/connectors", (_req, res) => {
  try {
    const connectorsDir = path.join(__dirname, "..", "src", "connectors");
    const files = fs.readdirSync(connectorsDir).filter(f => f.endsWith(".js"));
    const manifests = files.map(f => {
      try {
        const content = fs.readFileSync(path.join(connectorsDir, f), "utf8");
        const lines = content.split("\n").length;
        const hasManifest = /function\s+manifest\s*\(/.test(content);
        const exports = [...content.matchAll(/^\s*(async\s+)?function\s+(\w+)/gm)].map(m => m[2]);
        return { file: f, lines, hasManifest, exportCount: exports.length };
      } catch (err) {
        return { file: f, error: err.message };
      }
    });
    return res.json({ ok: true, count: manifests.length, manifests });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// POST /api/manifest-sync/diff — compare manifests
router.post("/diff", (req, res) => {
  try {
    const remoteManifests = req.body?.manifests || [];
    if (!Array.isArray(remoteManifests)) {
      return res.status(400).json({ ok: false, error: "manifests array required" });
    }

    const localFiles = fs.readdirSync(ROUTES_DIR).filter(f => f.endsWith(".js") && f !== "manifestSync.js");
    const localMap = {};
    for (const f of localFiles) {
      localMap[f] = extractRouteManifest(path.join(ROUTES_DIR, f));
    }

    const remoteMap = {};
    for (const m of remoteManifests) {
      if (m.file) remoteMap[m.file] = m;
    }

    const match = [];
    const diverged = [];
    const missingLocal = [];
    const extraLocal = [];

    for (const file of Object.keys(remoteMap)) {
      if (localMap[file]) {
        const local = localMap[file];
        const remote = remoteMap[file];
        if (local.endpoints === remote.endpoints && local.lines === remote.lines) {
          match.push(file);
        } else {
          diverged.push({
            file,
            local: { lines: local.lines, endpoints: local.endpoints },
            remote: { lines: remote.lines, endpoints: remote.endpoints }
          });
        }
      } else {
        missingLocal.push({ file, remote: remoteMap[file] });
      }
    }

    for (const file of Object.keys(localMap)) {
      if (!remoteMap[file]) {
        extraLocal.push(file);
      }
    }

    return res.json({
      ok: true,
      match: match.length,
      diverged: diverged.length,
      missingLocal: missingLocal.length,
      extraLocal: extraLocal.length,
      details: { match, diverged, missingLocal, extraLocal }
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// GET /api/manifest-sync/compact — one-line-per-route compact format
router.get("/compact", (_req, res) => {
  try {
    const files = fs.readdirSync(ROUTES_DIR).filter(f => f.endsWith(".js") && f !== "manifestSync.js");
    const lines = files.map(f => {
      const m = extractRouteManifest(path.join(ROUTES_DIR, f));
      if (m.error) return `${f}: ERROR ${m.error}`;
      return `${f} (${m.lines}L,${m.endpoints}ep${m.factory ? ",factory" : ""}): ${m.routes.slice(0, 8).join(", ")}${m.routes.length > 8 ? " +" + (m.routes.length - 8) + "more" : ""} | deps: ${m.deps.join(", ")}`;
    });
    return res.type("text/plain").send(lines.join("\n"));
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
