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
  phase5Comparison: path.join(runRoot, "phase5-tail-comparison.json"),
  crosspollinationCanon: path.join(runRoot, "crosspollination-canon.v1.json"),
  finalAttestation: path.join(runRoot, "unison-final-attestation.v1.json"),
  envelope: path.join(runRoot, "unison-phase5-final-attestation-envelope.json"),
  postResult: path.join(runRoot, "unison-phase5-final-attestation-post-result.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "unison-liris-acer-crosspollination-final.v1.json"),
  index: path.join(repoRoot, "data", "behcs", "index", "unison-liris-acer-crosspollination-final-index.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "unison-liris-acer-crosspollination-final-map-map-mapped.v1.json"),
  cube: path.join(repoRoot, "data", "behcs", "cubes", "unison-liris-acer-crosspollination-final-cube-cubed.cube.js"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "unison-liris-acer-crosspollination-final-behcs256.glpj.json"),
  reportJson: path.join(repoRoot, "reports", "unison-liris-acer-final-attestation-latest.json"),
  reportMd: path.join(repoRoot, "reports", "unison-liris-acer-final-attestation-latest.md")
});

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeText(filePath, value) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, value.endsWith("\n") ? value : `${value}\n`, "utf8");
}

function writeJson(filePath, value) {
  writeText(filePath, JSON.stringify(value, null, 2));
}

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_error) {
    return fallback;
  }
}

function repoRel(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/");
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
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

function requirePhase5Proof(phase5) {
  if (!phase5 || phase5.status !== "PHASE5_TAIL_MATCH_PROVEN_BY_AUTHORITY_SHAS") {
    throw new Error("phase5 authority proof is not sealed yet");
  }
  if (!phase5.comparison?.rowsMatch || !phase5.comparison?.seqMatch) {
    throw new Error("phase5 rows/seq comparison did not pass");
  }
  if (!phase5.authorityVerification?.authorityShaSurfaceProven) {
    throw new Error("phase5 authority SHA surface did not pass");
  }
  if (!phase5.authorityVerification?.chainDiffAcceptable) {
    throw new Error("phase5 side-stamped chain diff was not accepted");
  }
}

async function run() {
  const generatedAt = new Date().toISOString();
  const phase5 = readJson(paths.phase5Comparison);
  const crosspollination = readJson(paths.crosspollinationCanon, {});
  requirePhase5Proof(phase5);

  const eventId = "EVT-ACER-LIRIS-CROSSPOLLINATION-2026-04-26";
  const authority = phase5.authorityVerification;
  const attestation = {
    id: "unison-liris-acer-final-attestation-v1",
    eventId,
    generatedAt,
    runId,
    status: "UNISON_PHASE5_SEALED_BY_AUTHORITY_SHAS",
    d11: "PROVEN_BILATERAL_AUTHORITY_SHA_MATCH_WITH_SIDE_STAMPED_CHAIN_DIFF",
    interpretation: "The three input authority artifacts are byte-identical across Acer and Liris. The two chain tails are intentionally different because each side stamps its own side and named-agent identity into append-only ledger rows.",
    authorityShas: {
      sequence: authority.sequenceAuthority,
      blockedSensitive: authority.blockedAuthority,
      signedMapCanonical: authority.signedMapShaAuthority
    },
    tails: {
      acer: phase5.acerTail,
      liris: phase5.lirisTail,
      rowsMatch: phase5.comparison.rowsMatch,
      seqMatch: phase5.comparison.seqMatch,
      chainShaMatch: phase5.comparison.chainShaMatch,
      sideStampedChainDiffAccepted: phase5.comparison.sideStampedChainDiffAccepted
    },
    crosspollinationCanon: {
      source: repoRel(paths.crosspollinationCanon),
      summary: crosspollination.significance_one_liner || crosspollination.summary || null
    },
    gates: {
      sensitiveRows: "blocked",
      sensitiveMutation: false,
      remoteFileOperation: false,
      processFanout: false,
      smbWrite: false,
      lirisWrite: false
    },
    glyph_sentence: "META-CONVERGENCE { UNISON-2026-04-26 } · AUTHORITY-SHAS-MATCH · SIDE-STAMPED-CHAINS-COEXIST · D11-PROVEN @ M-INDICATIVE ."
  };
  attestation.sha256 = sha256(JSON.stringify(attestation));

  const memory = {
    type: "behcs-memory",
    id: "memory-unison-liris-acer-crosspollination-final-v1",
    eventId,
    generatedAt,
    d11: attestation.d11,
    significance: "First Acer/Liris LAW-001 unison sealed by byte-identical authority artifact SHAs while preserving side-specific ledger identity.",
    authorityShas: attestation.authorityShas,
    status: attestation.status,
    sourceAttestation: repoRel(paths.finalAttestation)
  };

  const index = {
    id: "index-unison-liris-acer-crosspollination-final-v1",
    generatedAt,
    eventId,
    keys: [
      "unison",
      "liris",
      "acer",
      "law001",
      "phase5",
      "authority-sha",
      "crosspollination",
      "side-stamped-chain"
    ],
    authorityShas: attestation.authorityShas,
    artifacts: {
      attestation: repoRel(paths.finalAttestation),
      memory: repoRel(paths.memory),
      map: repoRel(paths.map),
      cube: repoRel(paths.cube),
      glpj: repoRel(paths.glpj),
      report: repoRel(paths.reportMd)
    }
  };

  const map = {
    id: "unison-liris-acer-crosspollination-final-map-map-mapped-v1",
    generatedAt,
    eventId,
    route: [
      "liris-handoff",
      "acer-inventory",
      "merge-map",
      "liris-review",
      "phase4-sequence",
      "acer-ledger",
      "liris-replay",
      "phase5-authority-sha-proof",
      "final-attestation"
    ],
    authorityJoinKeys: Object.entries(attestation.authorityShas).map(([name, hash]) => ({ name, hash })),
    tailPolicy: "side_stamped_chain_sha_may_differ_when_authority_shas_match"
  };

  const glpj = {
    id: "unison-liris-acer-crosspollination-final-behcs256-glpj-v1",
    generatedAt,
    eventId,
    sentences: [
      attestation.glyph_sentence,
      "LAW001 { ACER-AND-LIRIS-BUS-OPEN } .",
      "PROOF { SEQUENCE-SHA + BLOCKED-SHA + SIGNED-MAP-SHA } MATCHES .",
      "CHAIN { ACER-SIDE + LIRIS-SIDE } COEXIST-SIDE-STAMPED ."
    ],
    d11: attestation.d11
  };

  const cubeModule = `"use strict";

module.exports = ${JSON.stringify({
    id: "unison-liris-acer-crosspollination-final-cube-cubed-v1",
    generatedAt,
    eventId,
    runId,
    status: attestation.status,
    d11: attestation.d11,
    authorityShas: attestation.authorityShas,
    route: map.route,
    gate: attestation.gates
  }, null, 2)};
`;

  writeJson(paths.finalAttestation, attestation);
  writeJson(paths.memory, memory);
  writeJson(paths.index, index);
  writeJson(paths.map, map);
  writeJson(paths.glpj, glpj);
  writeText(paths.cube, cubeModule);

  const envelope = {
    verb: "unison-phase5-final-attestation",
    target: "liris",
    from: "acer-codex",
    id: "unison-2026-04-27-acer-phase5-final-attestation-001",
    ts: generatedAt,
    runId,
    eventId,
    status: attestation.status,
    d11: attestation.d11,
    attestation_sha256: attestation.sha256,
    authorityShas: attestation.authorityShas,
    tails: attestation.tails,
    glyph_sentence: attestation.glyph_sentence,
    boundary: "Append-only final attestation. No SMB write, no remote file operation, no sensitive mutation, no process fanout."
  };
  writeJson(paths.envelope, envelope);
  const post = await postJson(replyTarget, envelope);
  writeJson(paths.postResult, { replyTarget, postedAt: new Date().toISOString(), ...post });

  const report = {
    reportId: "unison-liris-acer-final-attestation-latest",
    generatedAt,
    status: post.ok ? "FINAL_ATTESTATION_POSTED" : "FINAL_ATTESTATION_LOCAL_ONLY_POST_FAILED",
    eventId,
    attestation,
    post: {
      ok: post.ok,
      statusCode: post.statusCode || null,
      body: post.body || post.error || null
    },
    outputs: {
      attestation: repoRel(paths.finalAttestation),
      memory: repoRel(paths.memory),
      index: repoRel(paths.index),
      map: repoRel(paths.map),
      cube: repoRel(paths.cube),
      glpj: repoRel(paths.glpj),
      envelope: repoRel(paths.envelope),
      reportMd: repoRel(paths.reportMd)
    }
  };
  writeJson(paths.reportJson, report);
  writeText(paths.reportMd, `# Unison Liris/Acer Final Attestation

Generated: ${generatedAt}

Status: ${report.status}

Event: \`${eventId}\`

Authority SHAs:
- sequence: \`${attestation.authorityShas.sequence}\`
- blocked-sensitive: \`${attestation.authorityShas.blockedSensitive}\`
- signed-map canonical: \`${attestation.authorityShas.signedMapCanonical}\`

Tail policy:
- Acer and Liris rows/seq match: ${attestation.tails.rowsMatch && attestation.tails.seqMatch}
- Chain SHA differs by side-stamped ledger identity: ${!attestation.tails.chainShaMatch}
- Difference accepted: ${attestation.tails.sideStampedChainDiffAccepted}

Liris post accepted: ${post.ok}

Boundary: append-only descriptor attestation; no SMB write, no remote file operation, no sensitive mutation, no process fanout.
`);

  console.log(JSON.stringify({
    ok: post.ok,
    status: report.status,
    eventId,
    attestationSha256: attestation.sha256,
    report: repoRel(paths.reportMd)
  }, null, 2));
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
