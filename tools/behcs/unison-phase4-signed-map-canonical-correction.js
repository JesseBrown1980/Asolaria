#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const http = require("http");

const repoRoot = path.resolve(__dirname, "..", "..");
const runId = "unison-liris-acer-20260426";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", runId);
const replyTarget = "http://192.168.100.2:4947/behcs/send";

const paths = Object.freeze({
  signedMap: path.join(runRoot, "merge-map.signed.json"),
  originalEnvelope: path.join(runRoot, "unison-phase-4-execution-sequence-envelope.json"),
  correctionEnvelope: path.join(runRoot, "unison-merge-map-signed-inline-canonical-correction-envelope.json"),
  postResult: path.join(runRoot, "unison-merge-map-signed-inline-canonical-correction-post-result.json"),
  reportJson: path.join(repoRoot, "reports", "unison-phase4-signed-map-canonical-correction-latest.json"),
  reportMd: path.join(repoRoot, "reports", "unison-phase4-signed-map-canonical-correction-latest.md")
});

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeJson(filePath, value) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeText(filePath, value) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, value.endsWith("\n") ? value : `${value}\n`, "utf8");
}

function repoRel(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/");
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function postJson(url, body) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const payload = Buffer.from(JSON.stringify(body), "utf8");
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path: `${parsed.pathname}${parsed.search}`,
      method: "POST",
      headers: {
        "content-type": "application/json",
        "content-length": payload.length,
        connection: "close"
      },
      timeout: 10000
    }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        let body = text;
        try {
          body = JSON.parse(text);
        } catch (_error) {
          // Keep raw response text.
        }
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode, body });
      });
    });
    req.on("timeout", () => req.destroy(new Error("post_timeout")));
    req.on("error", (error) => resolve({ ok: false, error: error.message }));
    req.end(payload);
  });
}

async function run() {
  const generatedAt = new Date().toISOString();
  const signedMap = readJson(paths.signedMap);
  const originalEnvelope = readJson(paths.originalEnvelope);
  const canonicalJson = JSON.stringify(signedMap);
  const canonicalSha = sha256(canonicalJson);
  const expectedSha = originalEnvelope.sha256_signed_map;
  if (canonicalSha !== expectedSha) {
    throw new Error(`canonical signed-map sha mismatch: expected ${expectedSha}, got ${canonicalSha}`);
  }

  const envelope = {
    verb: "unison-merge-map-signed-inline",
    target: "liris",
    from: "acer-codex",
    id: "unison-2026-04-26-acer-merge-map-signed-inline-canonical-001",
    ts: generatedAt,
    responding_to: "unison-2026-04-26-liris-phase4-sequence-reviewed-001",
    supersedes_for_replay: "unison-2026-04-26-acer-merge-map-signed-inline-001",
    runId,
    artifact: {
      name: "merge-map.signed.json",
      repoPath: repoRel(paths.signedMap),
      bytes: Buffer.byteLength(canonicalJson, "utf8"),
      sha256: canonicalSha,
      expectedSha256FromPhase4SequenceEnvelope: expectedSha,
      encoding: "utf8",
      canonicalization: "JSON.stringify(parsed merge-map.signed.json)",
      chunked: false
    },
    content_inline: canonicalJson,
    replay_instruction: "Use this canonical JSON payload for byte-identical phase-5 replay; ignore the earlier pretty-printed signed-map inline envelope for hash comparison.",
    boundary: {
      descriptorOnly: true,
      remoteFileOperation: false,
      sensitiveMutation: false,
      processFanout: false,
      smbWrite: false
    },
    glyph_sentence: `EVT-UNISON-PHASE4-CANONICAL-SIGNED-MAP-CORRECTION · SHA-${canonicalSha.slice(0, 12)} · D11-OBSERVED @ M-INDICATIVE .`,
    d11: "OBSERVED_LOCAL_CANONICAL_BYTES_SENT_FOR_LIRIS_REPLAY"
  };
  writeJson(paths.correctionEnvelope, envelope);
  const post = await postJson(replyTarget, envelope);
  writeJson(paths.postResult, { replyTarget, postedAt: new Date().toISOString(), ...post });

  const report = {
    reportId: "unison-phase4-signed-map-canonical-correction-latest",
    generatedAt,
    status: post.ok ? "CANONICAL_SIGNED_MAP_POSTED" : "CANONICAL_SIGNED_MAP_POST_FAILED",
    canonicalSha,
    expectedSha,
    prettyPrintedFileSha: sha256(fs.readFileSync(paths.signedMap, "utf8")),
    post: {
      ok: post.ok,
      statusCode: post.statusCode || null,
      body: post.body || post.error || null
    },
    outputs: {
      envelope: repoRel(paths.correctionEnvelope),
      postResult: repoRel(paths.postResult),
      reportMd: repoRel(paths.reportMd)
    }
  };
  writeJson(paths.reportJson, report);
  writeText(paths.reportMd, `# Unison Phase 4 Signed Map Canonical Correction

Generated: ${generatedAt}

Status: ${report.status}

- Expected canonical signed-map sha: \`${expectedSha}\`
- Posted canonical signed-map sha: \`${canonicalSha}\`
- Pretty-printed disk file sha: \`${report.prettyPrintedFileSha}\`
- Liris accepted: ${post.ok}
- Status code: ${post.statusCode || "n/a"}

Meaning: phase-5 replay should use the canonical JSON payload from \`${repoRel(paths.correctionEnvelope)}\`, not the earlier pretty-printed signed-map inline payload.

Boundary: descriptor replay correction only; no file mutation, no sensitive mutation, no process fanout.
`);

  console.log(JSON.stringify({
    ok: post.ok,
    status: report.status,
    canonicalSha,
    expectedSha,
    postStatusCode: post.statusCode || null,
    report: repoRel(paths.reportMd)
  }, null, 2));
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
