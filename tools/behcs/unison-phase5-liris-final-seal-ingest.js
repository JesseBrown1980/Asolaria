#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const http = require("http");

const repoRoot = path.resolve(__dirname, "..", "..");
const runId = "unison-liris-acer-20260426";
const eventId = "EVT-ACER-LIRIS-CROSSPOLLINATION-2026-04-26";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", runId);
const inboxPath = path.join(repoRoot, "data", "behcs", "inbox.ndjson");
const replyTarget = "http://192.168.100.2:4947/behcs/send";

const paths = Object.freeze({
  acerFinalAttestation: path.join(runRoot, "unison-final-attestation.v1.json"),
  bilateralSeal: path.join(runRoot, "unison-bilateral-final-seal.v1.json"),
  envelope: path.join(runRoot, "unison-phase5-bilateral-seal-received-envelope.json"),
  postResult: path.join(runRoot, "unison-phase5-bilateral-seal-received-post-result.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "unison-liris-acer-bilateral-final-seal.v1.json"),
  index: path.join(repoRoot, "data", "behcs", "index", "unison-liris-acer-bilateral-final-seal-index.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "unison-liris-acer-bilateral-final-seal-map-map-mapped.v1.json"),
  cube: path.join(repoRoot, "data", "behcs", "cubes", "unison-liris-acer-bilateral-final-seal-cube-cubed.cube.js"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "unison-liris-acer-bilateral-final-seal-behcs256.glpj.json"),
  reportJson: path.join(repoRoot, "reports", "unison-liris-acer-bilateral-final-seal-latest.json"),
  reportMd: path.join(repoRoot, "reports", "unison-liris-acer-bilateral-final-seal-latest.md")
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

function readNdjson(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        return { parseError: error.message, line: index + 1 };
      }
    });
}

function repoRel(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/");
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function latestByTime(rows) {
  const copy = rows.slice();
  copy.sort((a, b) => String(a.received_at || a.ts || "").localeCompare(String(b.received_at || b.ts || "")));
  return copy[copy.length - 1] || null;
}

function latestFinalSeal() {
  return latestByTime(readNdjson(inboxPath)
    .filter((row) => !row.parseError)
    .filter((row) => row.verb === "unison-phase5-final-attestation-cosigned")
    .filter((row) => row.id === "unison-2026-04-27-liris-final-seal-001" || row.eventId === eventId));
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

function validateSeal(attestation, seal) {
  const errors = [];
  if (!seal) errors.push("liris_final_seal_missing");
  if (!attestation) errors.push("acer_final_attestation_missing");
  if (seal && seal.status !== "UNISON_PHASE5_BILATERALLY_SEALED") errors.push("unexpected_liris_seal_status");
  if (seal && seal.eventId !== eventId) errors.push("event_id_mismatch");
  if (seal && attestation && seal.acer_attestation_acknowledged?.attestation_sha256 !== attestation.sha256) {
    errors.push("attestation_sha_mismatch");
  }
  const confirmed = seal?.acer_attestation_acknowledged?.authority_shas_confirmed_match || [];
  for (const hash of Object.values(attestation?.authorityShas || {})) {
    if (!confirmed.includes(hash)) errors.push(`authority_sha_not_confirmed:${hash}`);
  }
  return errors;
}

async function run() {
  const generatedAt = new Date().toISOString();
  const attestation = readJson(paths.acerFinalAttestation);
  const lirisSeal = latestFinalSeal();
  const validationErrors = validateSeal(attestation, lirisSeal);
  if (validationErrors.length) {
    throw new Error(`cannot seal bilateral final state: ${validationErrors.join(", ")}`);
  }

  const bilateralSeal = {
    id: "unison-liris-acer-bilateral-final-seal-v1",
    eventId,
    runId,
    generatedAt,
    status: "UNISON_PHASE5_BILATERALLY_SEALED",
    d11: "PROVEN_OPERATOR_WITNESSED_BILATERAL",
    acerFinalAttestation: {
      id: attestation.id,
      sha256: attestation.sha256,
      status: attestation.status,
      d11: attestation.d11
    },
    lirisFinalSeal: {
      id: lirisSeal.id,
      received_at: lirisSeal.received_at,
      status: lirisSeal.status,
      d11: lirisSeal.d11,
      cosign: lirisSeal.cosign,
      operator_witness: lirisSeal.operator_witness,
      pathGlyph: lirisSeal.behcs?.pathGlyph || null,
      messageGlyph: lirisSeal.behcs?.messageGlyph || null
    },
    authorityShas: attestation.authorityShas,
    tails: attestation.tails,
    constituentAchievements: lirisSeal.bilateral_seal?.constituent_achievements || [],
    phaseCompletion: lirisSeal.phase_completion || {},
    followOnThreadsStillOpen: lirisSeal.follow_on_threads_still_open || [],
    glyph_sentence: lirisSeal.glyph_sentence,
    gates: {
      sensitiveRows: "blocked",
      sensitiveMutation: false,
      remoteFileOperation: false,
      processFanout: false,
      smbWrite: false
    }
  };
  bilateralSeal.sha256 = sha256(JSON.stringify(bilateralSeal));

  const memory = {
    type: "behcs-memory",
    id: "memory-unison-liris-acer-bilateral-final-seal-v1",
    eventId,
    generatedAt,
    status: bilateralSeal.status,
    d11: bilateralSeal.d11,
    significance: "UNISON-2026-04-26 is bilaterally sealed by Acer final attestation plus Liris final cosign; authority SHAs match and side-stamped chain difference is accepted.",
    attestationSha256: attestation.sha256,
    bilateralSealSha256: bilateralSeal.sha256,
    followOnThreadsStillOpen: bilateralSeal.followOnThreadsStillOpen
  };

  const index = {
    id: "index-unison-liris-acer-bilateral-final-seal-v1",
    eventId,
    generatedAt,
    status: bilateralSeal.status,
    keys: [
      "unison-2026-04-26",
      "bilateral-final-seal",
      "liris-final-cosign",
      "acer-final-attestation",
      "authority-shas",
      "crosspollination",
      "law001"
    ],
    artifacts: {
      bilateralSeal: repoRel(paths.bilateralSeal),
      memory: repoRel(paths.memory),
      map: repoRel(paths.map),
      cube: repoRel(paths.cube),
      glpj: repoRel(paths.glpj),
      report: repoRel(paths.reportMd)
    }
  };

  const map = {
    id: "unison-liris-acer-bilateral-final-seal-map-map-mapped-v1",
    eventId,
    generatedAt,
    route: [
      "acer-final-attestation",
      "liris-final-cosign",
      "bilateral-seal-ingest",
      "memory-index-map-cube-glpj",
      "seal-receipt"
    ],
    followOnThreadsStillOpen: bilateralSeal.followOnThreadsStillOpen
  };

  const glpj = {
    id: "unison-liris-acer-bilateral-final-seal-behcs256-glpj-v1",
    eventId,
    generatedAt,
    d11: bilateralSeal.d11,
    sentences: [
      "META-COSIGN-FINAL { ACER x LIRIS } AUTHORITY-SHAS-MATCH D11-PROVEN-BILATERAL.",
      "CHAIN { ACER-SIDE-STAMPED + LIRIS-SIDE-STAMPED } COEXIST.",
      "GATE { SENSITIVE-1675 } REMAINS-BLOCKED-UNTIL-QUORUM."
    ]
  };

  const cubeModule = `"use strict";

module.exports = ${JSON.stringify({
    id: "unison-liris-acer-bilateral-final-seal-cube-cubed-v1",
    eventId,
    generatedAt,
    status: bilateralSeal.status,
    d11: bilateralSeal.d11,
    authorityShas: bilateralSeal.authorityShas,
    followOnThreadsStillOpen: bilateralSeal.followOnThreadsStillOpen
  }, null, 2)};
`;

  writeJson(paths.bilateralSeal, bilateralSeal);
  writeJson(paths.memory, memory);
  writeJson(paths.index, index);
  writeJson(paths.map, map);
  writeJson(paths.glpj, glpj);
  writeText(paths.cube, cubeModule);

  const envelope = {
    verb: "unison-phase5-bilateral-seal-received",
    target: "liris",
    from: "acer-codex",
    id: "unison-2026-04-27-acer-bilateral-seal-received-001",
    ts: generatedAt,
    responding_to: lirisSeal.id,
    runId,
    eventId,
    status: bilateralSeal.status,
    d11: bilateralSeal.d11,
    acer_attestation_sha256: attestation.sha256,
    liris_final_seal_message_sha256: sha256(JSON.stringify(lirisSeal)),
    bilateral_seal_sha256: bilateralSeal.sha256,
    follow_on_threads_still_open: bilateralSeal.followOnThreadsStillOpen,
    glyph_sentence: "META-RECEIPT { ACER-INGESTS-LIRIS-FINAL-SEAL } UNISON-PHASE5-BILATERALLY-SEALED D11-PROVEN.",
    boundary: "Append-only receipt. No SMB write, no remote file operation, no sensitive mutation, no process fanout."
  };
  writeJson(paths.envelope, envelope);
  const post = await postJson(replyTarget, envelope);
  writeJson(paths.postResult, { replyTarget, postedAt: new Date().toISOString(), ...post });

  const report = {
    reportId: "unison-liris-acer-bilateral-final-seal-latest",
    generatedAt,
    status: post.ok ? "BILATERAL_FINAL_SEAL_INGESTED_AND_RECEIPT_POSTED" : "BILATERAL_FINAL_SEAL_INGESTED_RECEIPT_POST_FAILED",
    eventId,
    bilateralSeal,
    post: {
      ok: post.ok,
      statusCode: post.statusCode || null,
      body: post.body || post.error || null
    },
    outputs: {
      bilateralSeal: repoRel(paths.bilateralSeal),
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
  writeText(paths.reportMd, `# Unison Liris/Acer Bilateral Final Seal

Generated: ${generatedAt}

Status: ${report.status}

Event: \`${eventId}\`

Bilateral status: \`${bilateralSeal.status}\`

Attestation:
- Acer attestation sha: \`${attestation.sha256}\`
- Bilateral seal sha: \`${bilateralSeal.sha256}\`
- Liris final seal: \`${lirisSeal.id}\`
- Liris D11: \`${lirisSeal.d11}\`

Authority SHAs:
- sequence: \`${bilateralSeal.authorityShas.sequence}\`
- blocked-sensitive: \`${bilateralSeal.authorityShas.blockedSensitive}\`
- signed-map canonical: \`${bilateralSeal.authorityShas.signedMapCanonical}\`

Follow-on threads still open:
${bilateralSeal.followOnThreadsStillOpen.map((item) => `- ${item}`).join("\n")}

Receipt posted to Liris: ${post.ok}

Boundary: append-only receipt; no SMB write, no remote file operation, no sensitive mutation, no process fanout.
`);

  console.log(JSON.stringify({
    ok: post.ok,
    status: report.status,
    eventId,
    bilateralSealSha256: bilateralSeal.sha256,
    report: repoRel(paths.reportMd)
  }, null, 2));
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
