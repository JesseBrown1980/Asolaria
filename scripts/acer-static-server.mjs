// scripts/acer-static-server.mjs — mirror of liris:9999 pattern for acer
//
// Exposes a curated set of acer-side canonical artifacts over HTTP so peers
// (Liris, Falcon, etc.) can pull them with the same 5-step BEHCS-substitute
// -for-git protocol we've been using.
//
// Whitelist approach: only serves files that are explicitly registered. No
// directory traversal. Returns 404 for anything unlisted.

import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { extname } from "node:path";
import { createHash } from "node:crypto";

const HOST = "0.0.0.0";
const PORT = 9998;

// Absolute paths on acer → URL routes. Expand as needed.
const WHITELIST = {
  "/ed25519-registry.ts":       "C:/asolaria-acer/packages/kernel/src/ed25519-registry.ts",
  "/ed25519-registry.test.ts":  "C:/asolaria-acer/packages/kernel/src/ed25519-registry.test.ts",
  "/ed25519-registry.json":     "C:/asolaria-acer/kernel/ed25519-registry.json",
  "/cosign-schema.json":        "C:/asolaria-acer/packages/kernel/src/cosign-schema.json",
  "/cosign-schema.md":          "C:/asolaria-acer/packages/kernel/src/cosign-schema.md",
  "/provenance.mjs":            "C:/asolaria-acer/scripts/provenance.mjs",
  "/migrate-to-packages.mjs":   "C:/asolaria-acer/scripts/migrate-to-packages.mjs",
  "/agent-manager-lessons.md":  "C:/asolaria-acer/plans/D/agent-manager-lessons.md",
  "/device-bound-instance-as-root.md": "C:/asolaria-acer/plans/D/device-bound-instance-as-root.md",
  "/_asolaria_identity.json":         "C:/asolaria-acer/data/device-instance/_asolaria_identity.json",
  "/_asolaria_falcon_identity.json":  "C:/asolaria-acer/data/device-instance/_asolaria_falcon_identity.json",
  "/ed25519-registry.json":           "C:/asolaria-acer/kernel/ed25519-registry.json",
};

const MIME = {
  ".ts": "text/plain; charset=utf-8",
  ".mjs": "text/plain; charset=utf-8",
  ".js": "text/plain; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

function indexPage() {
  const lines = Object.keys(WHITELIST).sort().map((r) => {
    const abs = WHITELIST[r];
    if (!existsSync(abs)) return { route: r, status: "missing" };
    const buf = readFileSync(abs);
    const sha = createHash("sha256").update(buf).digest("hex");
    return { route: r, bytes: buf.length, sha256: sha };
  });
  return JSON.stringify({
    service: "acer-static-server",
    host: HOST,
    port: PORT,
    apex: "COL-ASOLARIA",
    authority: "COSIGN-MERGED-034",
    whitelist: lines,
    glyph_sentence: `META-ACER-STATIC-SERVER-ALIVE · port=${PORT} · routes=${Object.keys(WHITELIST).length} @ M-EYEWITNESS .`,
  }, null, 2);
}

const server = createServer((req, res) => {
  const ts = new Date().toISOString();
  if (req.url === "/" || req.url === "/index") {
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(indexPage());
    console.log(`[${ts}] ${req.method} ${req.url} 200 index`);
    return;
  }
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: true, service: "acer-static-server", port: PORT, apex: "COL-ASOLARIA" }));
    return;
  }
  const abs = WHITELIST[req.url];
  if (!abs) {
    res.writeHead(404, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: false, error: "not_found", path: req.url, available: Object.keys(WHITELIST) }));
    console.log(`[${ts}] ${req.method} ${req.url} 404`);
    return;
  }
  if (!existsSync(abs)) {
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: "file_missing_on_disk", absolute: abs }));
    return;
  }
  const buf = readFileSync(abs);
  const sha = createHash("sha256").update(buf).digest("hex");
  const mime = MIME[extname(abs)] ?? "application/octet-stream";
  res.writeHead(200, {
    "content-type": mime,
    "content-length": buf.length,
    "x-sha256": sha,
    "x-artifact-apex": "COL-ASOLARIA",
    "x-artifact-authority": "COSIGN-MERGED-034",
  });
  res.end(buf);
  console.log(`[${ts}] ${req.method} ${req.url} 200 ${buf.length}b sha=${sha.slice(0, 12)}`);
});

server.listen(PORT, HOST, () => {
  console.log(`acer-static-server LIVE on http://${HOST}:${PORT}`);
  console.log(`  ${Object.keys(WHITELIST).length} routes whitelisted`);
  console.log("META-ACER-STATIC-SERVER-ALIVE · port=" + PORT + " · apex=COL-ASOLARIA @ M-EYEWITNESS .");
});
