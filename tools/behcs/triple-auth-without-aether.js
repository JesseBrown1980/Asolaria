#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const http = require("http");

const repoRoot = path.resolve(__dirname, "..", "..");
const runId = "triple-auth-without-aether-20260427";
const eventId = "EVT-ACER-LIRIS-FALCON-TRIPLE-AUTH-NO-AETHER-2026-04-27";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", runId);

const paths = Object.freeze({
  envelope: path.join(runRoot, "triple-auth-without-aether-envelope.json"),
  postResult: path.join(runRoot, "triple-auth-without-aether-post-result.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "triple-auth-without-aether.v1.json"),
  index: path.join(repoRoot, "data", "behcs", "index", "triple-auth-without-aether-index.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "triple-auth-without-aether-map-map-mapped.v1.json"),
  cube: path.join(repoRoot, "data", "behcs", "cubes", "triple-auth-without-aether-cube-cubed.cube.js"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "triple-auth-without-aether-behcs256.glpj.json"),
  chain: path.join(repoRoot, "data", "behcs", "chains", "triple-auth-without-aether-chain.ndjson"),
  reportJson: path.join(repoRoot, "reports", "triple-auth-without-aether-latest.json"),
  reportMd: path.join(repoRoot, "reports", "triple-auth-without-aether-latest.md"),
  falconFrontendReport: path.join(repoRoot, "reports", "falcon-frontend-termux-force-fix-latest.md"),
  falconSystemReport: path.join(repoRoot, "reports", "falcon-sentinel-kr-system-update-latest.md"),
  sentinelKrReport: path.join(repoRoot, "reports", "sentinel-kr-profile-mint-latest.md")
});

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeText(filePath, text) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, text.endsWith("\n") ? text : `${text}\n`, "utf8");
}

function writeJson(filePath, value) {
  writeText(filePath, JSON.stringify(value, null, 2));
}

function appendNdjson(filePath, row) {
  ensureDir(filePath);
  fs.appendFileSync(filePath, `${JSON.stringify(row)}\n`, "utf8");
}

function repoRel(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/");
}

function sha(value) {
  return crypto.createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex");
}

function fileSha(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return sha(fs.readFileSync(filePath));
}

function httpJson(method, url, body = null, timeoutMs = 5000) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const payload = body ? Buffer.from(JSON.stringify(body), "utf8") : null;
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path: `${parsed.pathname}${parsed.search}`,
      method,
      timeout: timeoutMs,
      headers: payload ? {
        "content-type": "application/json",
        "content-length": payload.length,
        connection: "close"
      } : { connection: "close" }
    }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        let bodyOut = text;
        try {
          bodyOut = JSON.parse(text);
        } catch {}
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode, body: bodyOut });
      });
    });
    req.on("timeout", () => req.destroy(new Error("request_timeout")));
    req.on("error", (error) => resolve({ ok: false, error: error.message }));
    if (payload) req.write(payload);
    req.end();
  });
}

async function main() {
  const generatedAt = new Date().toISOString();
  fs.mkdirSync(runRoot, { recursive: true });

  const evidence = {
    sentinelKrProfileMintReport: {
      path: repoRel(paths.sentinelKrReport),
      sha256: fileSha(paths.sentinelKrReport)
    },
    falconSentinelKrSystemUpdateReport: {
      path: repoRel(paths.falconSystemReport),
      sha256: fileSha(paths.falconSystemReport)
    },
    falconFrontendTermuxForceFixReport: {
      path: repoRel(paths.falconFrontendReport),
      sha256: fileSha(paths.falconFrontendReport)
    },
    activeTriple: ["acer", "liris", "falcon"],
    heldOut: ["aether"],
    holdReason: "Aether is not required for the current continuation; update later when explicitly brought into quorum."
  };

  const envelope = {
    verb: "triple-authenticate-and-continue-without-aether",
    target: "all-active-nodes",
    from: "acer-codex",
    id: "triple-auth-without-aether-001",
    ts: generatedAt,
    eventId,
    status: "TRIPLE_AUTH_ORDER_EMITTED_AETHER_HELD",
    d11: "PROVEN_ACTIVE_TRIPLE_ROUTE_BY_LAW001_POSTS_PENDING_NODE_ACK",
    order: {
      activeAuthenticationSet: ["acer", "liris", "falcon"],
      excludedForNow: ["aether"],
      continueProcess: true,
      continuationScope: [
        "sentinel_kr_profile_quorum",
        "falcon_frontend_termux_proxy_route",
        "LAW-001 bus continuity",
        "bounded supervisor execution"
      ],
      authenticationRules: [
        "Acer authenticates by local artifact hashes and local LAW-001 post.",
        "Liris authenticates by cable LAW-001 receipt and side-stamped response.",
        "Falcon authenticates by LAW-001 receipt plus Falcon-owned Termux frontend PID result.",
        "Aether is held; do not block current continuation waiting for Aether."
      ]
    },
    evidence,
    boundary: "Triple-authentication instruction only; no sensitive row release, no remote file mutation, no root, no flashing, no uncontrolled fanout."
  };
  envelope.envelopeSha256 = sha(envelope);
  writeJson(paths.envelope, envelope);

  const posts = [];
  for (const [name, url] of [
    ["acer-local", "http://127.0.0.1:4947/behcs/send"],
    ["liris-cable", "http://192.168.100.2:4947/behcs/send"],
    ["falcon-law001", "http://192.168.1.8:4947/behcs/send"]
  ]) {
    posts.push({ name, url, ...(await httpJson("POST", url, envelope, 5000)) });
  }
  writeJson(paths.postResult, { eventId, generatedAt, posts });

  const artifacts = {
    envelope: repoRel(paths.envelope),
    postResult: repoRel(paths.postResult),
    memory: repoRel(paths.memory),
    index: repoRel(paths.index),
    map: repoRel(paths.map),
    cube: repoRel(paths.cube),
    glpj: repoRel(paths.glpj),
    chain: repoRel(paths.chain),
    report: repoRel(paths.reportMd)
  };

  const status = posts.every((row) => row.ok)
    ? "TRIPLE_AUTH_ORDER_ACCEPTED_BY_ACTIVE_THREE"
    : "TRIPLE_AUTH_ORDER_PARTIAL_ACCEPT";
  const d11 = posts.every((row) => row.ok)
    ? "PROVEN_ACTIVE_TRIPLE_LAW001_ACCEPTED_AETHER_HELD"
    : "OBSERVED_PARTIAL_TRIPLE_AUTH_ACCEPT";

  writeJson(paths.memory, {
    type: "memory",
    eventId,
    generatedAt,
    status,
    d11,
    significance: "Acer, Liris, and Falcon were instructed to treat the current process as triple-authenticated and continue without waiting for Aether. Aether remains held for later expansion.",
    evidence,
    artifacts,
    boundary: envelope.boundary
  });
  writeJson(paths.index, {
    indexId: "triple-auth-without-aether-index.v1",
    eventId,
    generatedAt,
    status,
    d11,
    keys: ["triple-auth", "acer", "liris", "falcon", "aether-held", "sentinel_kr", "falcon-termux-frontend"],
    envelopeSha256: envelope.envelopeSha256,
    artifacts
  });
  writeJson(paths.map, {
    mapId: "triple-auth-without-aether-map-map-mapped.v1",
    eventId,
    generatedAt,
    nodes: ["acer", "liris", "falcon", "aether", "sentinel_kr", "LAW-001", "Falcon Termux frontend"],
    edges: [
      ["acer", "authenticates", "process"],
      ["liris", "authenticates", "process"],
      ["falcon", "authenticates", "process"],
      ["aether", "held_out_for_now", "process"],
      ["process", "continues_over", "LAW-001"],
      ["Falcon Termux frontend", "continues_via", "Acer proxy"]
    ]
  });
  writeText(paths.cube, `module.exports = ${JSON.stringify({
    cubeId: "triple-auth-without-aether-cube-cubed.v1",
    eventId,
    generatedAt,
    dimensions: {
      D_AUTHORITY: ["acer", "liris", "falcon"],
      D_HELD: ["aether"],
      D_PROCESS: "continue",
      D_GATE: "LAW-001",
      D_PROFILE: "sentinel_kr",
      D_FALCON_FRONTEND: "proxy_ready",
      D_BOUNDARY: "no_sensitive_release_no_remote_mutation_no_uncontrolled_fanout"
    }
  }, null, 2)};\n`);
  writeJson(paths.glpj, {
    glyphLanguageId: "triple-auth-without-aether-behcs256.glpj.v1",
    eventId,
    generatedAt,
    alphabet: "BEHCS-256",
    status: "GLPJ_MINTED",
    sentences: [
      "ACER LIRIS FALCON TRIPLE AUTHENTICATE.",
      "AETHER HELD FOR NOW.",
      "PROCESS CONTINUES.",
      "LAW-001 CARRIES.",
      "SENTINEL_KR GATES.",
      "FALCON FRONTEND PROXY READY."
    ]
  });

  const chainRow = {
    seq: 1,
    ts: generatedAt,
    eventId,
    status,
    d11,
    envelopeSha256: envelope.envelopeSha256,
    postsOk: posts.filter((row) => row.ok).length,
    postsTotal: posts.length,
    rowSha: null
  };
  chainRow.rowSha = sha({ ...chainRow, rowSha: null });
  appendNdjson(paths.chain, chainRow);

  const report = {
    eventId,
    generatedAt,
    status,
    d11,
    activeAuthenticationSet: envelope.order.activeAuthenticationSet,
    heldOut: envelope.order.excludedForNow,
    envelopeSha256: envelope.envelopeSha256,
    postsOk: posts.filter((row) => row.ok).length,
    postsTotal: posts.length,
    artifacts
  };
  writeJson(paths.reportJson, report);
  writeText(paths.reportMd, [
    "# Triple Authentication Without Aether",
    "",
    `Status: ${status}`,
    `D11: ${d11}`,
    "Active authentication set: Acer + Liris + Falcon",
    "Held for now: Aether",
    `LAW-001 posts accepted: ${report.postsOk}/${report.postsTotal}`,
    `Envelope SHA256: ${report.envelopeSha256}`,
    "",
    "Instruction: continue the process under Acer/Liris/Falcon triple authentication. Do not block on Aether.",
    "",
    "Boundary: instruction/authentication only; no sensitive row release, no remote file mutation, no root, no flashing, no uncontrolled fanout.",
    ""
  ].join("\n"));

  console.log(JSON.stringify({
    ok: true,
    eventId,
    status,
    d11,
    activeAuthenticationSet: report.activeAuthenticationSet,
    heldOut: report.heldOut,
    postsOk: report.postsOk,
    postsTotal: report.postsTotal,
    report: artifacts.report
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
