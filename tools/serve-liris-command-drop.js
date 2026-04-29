#!/usr/bin/env node
"use strict";

const fs = require("fs");
const http = require("http");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const dropRoot = path.join(repoRoot, "runtime", "liris-command-drop");
const host = process.env.ASOLARIA_LIRIS_DROP_HOST || "192.168.100.1";
const port = Number(process.env.ASOLARIA_LIRIS_DROP_PORT || 8011);

const contentTypes = {
  ".cmd": "text/plain; charset=utf-8",
  ".ps1": "text/plain; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8"
};

function safeResolve(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0]).replace(/^\/+/, "");
  const resolved = path.resolve(dropRoot, clean || "index.txt");
  const rootWithSep = dropRoot.endsWith(path.sep) ? dropRoot : `${dropRoot}${path.sep}`;
  if (resolved !== dropRoot && !resolved.startsWith(rootWithSep)) return null;
  return resolved;
}

function send(res, status, body, type = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store"
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const resolved = safeResolve(req.url || "/");
  if (!resolved) return send(res, 403, "forbidden\n");
  fs.stat(resolved, (statErr, stat) => {
    if (statErr || !stat.isFile()) return send(res, 404, "not found\n");
    const type = contentTypes[path.extname(resolved).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": type,
      "Content-Length": stat.size,
      "Cache-Control": "no-store"
    });
    fs.createReadStream(resolved).pipe(res);
  });
});

server.listen(port, host, () => {
  console.log(JSON.stringify({
    ok: true,
    service: "liris-command-drop",
    url: `http://${host}:${port}/`,
    root: dropRoot
  }, null, 2));
});
