#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const http = require("http");
const net = require("net");

const repoRoot = path.resolve(__dirname, "..", "..");
const runId = "unison-liris-acer-20260426";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", runId);
const inboxPath = path.join(repoRoot, "data", "behcs", "inbox.ndjson");

const outputs = Object.freeze({
  lirisInventory: path.join(runRoot, "inventory-liris-received.ndjson"),
  acerInventory: path.join(runRoot, "inventory-acer.ndjson"),
  phase4Sequence: path.join(runRoot, "phase4-execution-sequence.ndjson"),
  blockedSensitive: path.join(runRoot, "phase4-blocked-sensitive.ndjson"),
  signedMap: path.join(runRoot, "merge-map.signed.json"),
  envelope: path.join(runRoot, "unison-phase-4-execution-sequence-envelope.json"),
  postResult: path.join(runRoot, "unison-phase-4-execution-sequence-post-result.json"),
  reportJson: path.join(repoRoot, "reports", "unison-phase4-execution-sequence-latest.json"),
  reportMd: path.join(repoRoot, "reports", "unison-phase4-execution-sequence-latest.md")
});

const REPLY_TARGET = "http://192.168.100.2:4947/behcs/send";

const ACCEPTED_SENSITIVE_CLASSES = new Set([
  "D-DEVICE-CHIP",
  "D-DEVICE-DEVICE",
  "D-DEVICE-FIRMWARE",
  "D-DEVICE-MANIFEST",
  "D-KERNEL-DRIVER",
  "D-REGISTRY-HIVE",
  "D-STRUCTURE",
  "D-SUPERVISOR",
  "D-SYSTEM-CPU",
  "D-SYSTEM-DRIVER",
  "D-SYSTEM-PROCESS",
  "FILE",
  "MEMORY"
]);

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

function writeNdjson(filePath, rows) {
  writeText(filePath, rows.map((row) => JSON.stringify(row)).join("\n"));
}

function repoRel(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/");
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
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

function readInbox() {
  return readNdjson(inboxPath).map((row, index) => ({ line: index + 1, ...row }));
}

function latestReview() {
  const rows = readInbox();
  const reviews = rows.filter((row) =>
    String(row.from || "").toLowerCase().includes("liris") &&
    row.verb === "unison-merge-map-reviewed"
  );
  if (!reviews.length) throw new Error("No Liris unison-merge-map-reviewed envelope found in inbox");
  reviews.sort((a, b) => new Date(b.received_at || b.ts || 0) - new Date(a.received_at || a.ts || 0));
  return reviews[0];
}

function leafOf(row) {
  const raw = row.path || row.path_leaf || row.label || row.pid || row.id || "";
  const normalized = String(raw).replace(/\\/g, "/");
  const parts = normalized.split("/").filter(Boolean);
  return parts[parts.length - 1] || normalized || "unknown";
}

function normalizedDClass(row) {
  if (row.d_class) return String(row.d_class).toUpperCase();
  if (row.kind === "file" || row.kind === "package" || row.kind === "share" || row.kind === "memory" || row.kind === "cosign") {
    return "D-DESCRIPTOR-PENDING";
  }
  if (row.kind) return String(row.kind).toUpperCase();
  return "D-UNCLASSIFIED";
}

function descriptorHash(row) {
  return row.descriptorHash || row.sha256 || row.hash || sha256(JSON.stringify({
    side: row.side,
    kind: row.kind,
    d_class: row.d_class,
    path: row.path,
    label: row.label,
    pid: row.pid
  }));
}

function joinKey(row) {
  const dClass = normalizedDClass(row);
  const leaf = leafOf(row).toLowerCase();
  const hash = descriptorHash(row);
  return `${dClass}|${leaf}|${hash}`;
}

function isSensitive(row) {
  const dClass = normalizedDClass(row);
  if (row.sensitive === true) return true;
  if (ACCEPTED_SENSITIVE_CLASSES.has(dClass)) return true;
  return false;
}

function checkTcp(host, port, timeoutMs = 1500) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    function done(ok) {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(ok);
    }
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => done(true));
    socket.once("timeout", () => done(false));
    socket.once("error", () => done(false));
    socket.connect(port, host);
  });
}

function getJson(url) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path: `${parsed.pathname}${parsed.search}`,
      method: "GET",
      headers: { "connection": "close" },
      timeout: 5000
    }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        let body = text;
        try {
          body = JSON.parse(text);
        } catch (_error) {
          // Keep raw text if endpoint is not JSON.
        }
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode, body });
      });
    });
    req.on("timeout", () => req.destroy(new Error("get_timeout")));
    req.on("error", (error) => resolve({ ok: false, error: error.message }));
    req.end();
  });
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
        "connection": "close"
      },
      timeout: 5000
    }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        let body = text;
        try {
          body = JSON.parse(text);
        } catch (_error) {
          // Keep raw text if endpoint is not JSON.
        }
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode, body });
      });
    });
    req.on("timeout", () => req.destroy(new Error("post_timeout")));
    req.on("error", (error) => resolve({ ok: false, error: error.message }));
    req.end(payload);
  });
}

function makeSequence(lirisRows, acerRows, generatedAt) {
  const acerKeys = new Set(acerRows.map(joinKey));
  const lirisKeys = new Set(lirisRows.map(joinKey));
  const sequence = [];
  const blocked = [];
  let ordinal = 0;

  function addRow(row, side) {
    const dClass = normalizedDClass(row);
    const key = joinKey(row);
    const blockedRow = isSensitive(row);
    const bucket = blockedRow ? "SENSITIVE_CLASS_BLOCKED" :
      (side === "liris" && acerKeys.has(key)) || (side === "acer" && lirisKeys.has(key)) ? "OVERLAP" :
      side === "liris" ? "LIRIS_ONLY" : "ACER_ONLY";
    const base = {
      runId,
      phase: "phase-4",
      ordinal: blockedRow ? null : ++ordinal,
      bucket,
      side,
      sourceKind: row.kind || "descriptor",
      pid: row.pid || null,
      d_class: dClass,
      path: row.path || null,
      label: row.label || null,
      leaf: leafOf(row),
      descriptorHash: descriptorHash(row),
      joinKey: key,
      d11: "OBSERVED",
      generatedAt
    };

    if (blockedRow) {
      blocked.push({
        ...base,
        reason: "phase3_liris_review_sensitive_class_block",
        requiredQuorum: "acer+lineage_liris+hermes+sentinel_kr",
        mutationAllowed: false,
        remoteFileWriteAllowed: false,
        executionAllowed: false
      });
      return;
    }

    const operation = bucket === "OVERLAP" ? "VERIFY_JOIN_DESCRIPTOR" :
      side === "liris" ? "ACCEPT_LIRIS_DESCRIPTOR_APPEND_ONLY" : "PUBLISH_ACER_DESCRIPTOR_APPEND_ONLY";
    sequence.push({
      ...base,
      operation,
      mutationAllowed: false,
      remoteFileWriteAllowed: false,
      cosignAppendRequired: true,
      cosignChainMode: "append_only_sha_walked_prev_sha",
      phase5TailShaRequirement: "byte_identical_on_acer_and_liris"
    });
  }

  lirisRows.forEach((row) => addRow(row, "liris"));
  acerRows.forEach((row) => addRow(row, "acer"));

  sequence.unshift({
    runId,
    phase: "phase-4",
    ordinal: 0,
    bucket: "OVERLAP",
    side: "bilateral",
    sourceKind: "control",
    operation: "ANCHOR_LIRIS_PHASE3_REVIEW_AND_LAW001_PROOF",
    d_class: "D-MESSAGING",
    descriptorHash: "control-law001-review-anchor",
    joinKey: "D-MESSAGING|law001|phase3-review",
    d11: "PROVEN_OPERATOR_WITNESSED",
    mutationAllowed: false,
    remoteFileWriteAllowed: false,
    cosignAppendRequired: true,
    generatedAt
  });

  return { sequence, blocked };
}

function summarizeBy(rows, key) {
  return rows.reduce((acc, row) => {
    const value = row[key] || "unknown";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function reportMd(report) {
  return `# Unison Phase 4 Execution Sequence

Generated: ${report.generatedAt}

Status: ${report.status}

Review:
- Liris review id: ${report.review.id}
- Global verdict: ${report.review.globalVerdict}
- D11: ${report.review.d11}

LAW-001:
- Acer 4947/4950: ${report.law001.acer4947 ? "open" : "closed"}/${report.law001.acer4950 ? "open" : "closed"}
- Liris 4947/4950: ${report.law001.liris4947 ? "open" : "closed"}/${report.law001.liris4950 ? "open" : "closed"}

Counts:
- Liris inventory rows: ${report.counts.lirisRows}
- Acer inventory rows: ${report.counts.acerRows}
- Phase-4 executable descriptor rows: ${report.counts.sequenceRows}
- Blocked sensitive rows: ${report.counts.blockedRows}
- Sequence post ok: ${report.post.ok}

Buckets:
${Object.entries(report.buckets).map(([key, value]) => `- ${key}: ${value}`).join("\n")}

Liris file-supervisor health probe:
- ${report.fileSupervisorHealth.ok ? "ok" : "not_ok"} (${report.fileSupervisorHealth.statusCode || report.fileSupervisorHealth.error || "no_status"})

Artifacts:
- Sequence: \`${repoRel(outputs.phase4Sequence)}\`
- Blocked sensitive: \`${repoRel(outputs.blockedSensitive)}\`
- Signed map: \`${repoRel(outputs.signedMap)}\`
- Envelope: \`${repoRel(outputs.envelope)}\`
- Post result: \`${repoRel(outputs.postResult)}\`

Boundary: no SMB write, no remote file operation, no sensitive mutation, no process fanout. This is a phase-4 sequence handoff, not a mutation run.
`;
}

async function run() {
  const generatedAt = new Date().toISOString();
  const review = latestReview();
  if (review.global_verdict !== "ACCEPT_WITH_DELTAS" || review.phase_3_signoff?.verdict !== "PROCEED_TO_PHASE_4") {
    throw new Error(`Liris review does not authorize phase 4: ${review.global_verdict || "no_global_verdict"} / ${review.phase_3_signoff?.verdict || "no_phase3_verdict"}`);
  }

  const lirisRows = readNdjson(outputs.lirisInventory);
  const acerRows = readNdjson(outputs.acerInventory);
  const { sequence, blocked } = makeSequence(lirisRows, acerRows, generatedAt);

  const law001 = {
    acer4947: await checkTcp("127.0.0.1", 4947),
    acer4950: await checkTcp("127.0.0.1", 4950),
    liris4947: await checkTcp("192.168.100.2", 4947),
    liris4950: await checkTcp("192.168.100.2", 4950)
  };

  const fileSupervisorHealth = await getJson("http://192.168.100.2:4947/behcs/fs/health");

  writeNdjson(outputs.phase4Sequence, sequence);
  writeNdjson(outputs.blockedSensitive, blocked);

  const signedMap = {
    id: "unison-2026-04-26-merge-map-signed-acer-phase4-draft",
    generatedAt,
    sourceReview: {
      id: review.id,
      globalVerdict: review.global_verdict,
      d11: review.d11,
      cosign: review.cosign,
      operatorWitness: review.operator_witness
    },
    acceptedDivergences: review.divergence_decisions,
    lirisDeltas: review.liris_side_deltas,
    sensitiveClassAcknowledgement: review.sensitive_class_acknowledgement,
    phase3Signoff: review.phase_3_signoff,
    law001,
    fileSupervisorHealth,
    counts: {
      lirisRows: lirisRows.length,
      acerRows: acerRows.length,
      sequenceRows: sequence.length,
      blockedRows: blocked.length
    },
    buckets: summarizeBy(sequence, "bucket"),
    blockedBuckets: summarizeBy(blocked, "d_class"),
    artifacts: {
      sequence: repoRel(outputs.phase4Sequence),
      blockedSensitive: repoRel(outputs.blockedSensitive)
    },
    boundary: {
      remoteFileOperation: false,
      sensitiveMutation: false,
      smbWrite: false,
      processFanout: false
    },
    d11: "PROVEN_LOCAL_PHASE4_SEQUENCE_FROM_LIRIS_COSIGN"
  };
  writeJson(outputs.signedMap, signedMap);

  const envelope = {
    verb: "unison-phase-4-execution-sequence",
    target: "liris",
    from: "acer-codex",
    id: "unison-2026-04-26-acer-phase4-execution-sequence-001",
    ts: generatedAt,
    responding_to: review.id,
    global_verdict_observed: review.global_verdict,
    phase: "phase-4-execution-sequence-draft",
    sequence_path: repoRel(outputs.phase4Sequence),
    blocked_sensitive_path: repoRel(outputs.blockedSensitive),
    signed_map_path: repoRel(outputs.signedMap),
    sha256_sequence: sha256(fs.readFileSync(outputs.phase4Sequence, "utf8")),
    sha256_blocked_sensitive: sha256(fs.readFileSync(outputs.blockedSensitive, "utf8")),
    sha256_signed_map: sha256(JSON.stringify(signedMap)),
    counts: signedMap.counts,
    buckets: signedMap.buckets,
    law001,
    fileSupervisorHealth,
    phase4_rules: [
      "execute only non-sensitive OVERLAP/LIRIS_ONLY/ACER_ONLY descriptor rows",
      "sensitive classes are listed but blocked until acer+lineage_liris+hermes+sentinel_kr quorum",
      "every future executed op must append to COSIGN_CHAIN.ndjson with sha-walked prev_sha",
      "phase 5 requires byte-identical tail-sha on both sides"
    ],
    boundary: signedMap.boundary,
    glyph_sentence: "EVT-UNISON-PHASE4-SEQUENCE-DRAFTED - LIRIS-REVIEW-ACCEPTED - SENSITIVE-BLOCKED - LAW001-OPEN @ M-INDICATIVE .",
    d11: signedMap.d11,
    next_liris_action: "Review phase-4 sequence counts and return unison-phase-4-sequence-reviewed or corrections."
  };
  writeJson(outputs.envelope, envelope);
  const post = await postJson(REPLY_TARGET, envelope);
  writeJson(outputs.postResult, { replyTarget: REPLY_TARGET, ...post, postedAt: new Date().toISOString() });

  const report = {
    reportId: "unison-phase4-execution-sequence-latest",
    generatedAt,
    status: post.ok ? "PHASE4_SEQUENCE_POSTED_TO_LIRIS" : "PHASE4_SEQUENCE_CREATED_POST_FAILED",
    review: {
      id: review.id,
      globalVerdict: review.global_verdict,
      d11: review.d11
    },
    law001,
    fileSupervisorHealth,
    counts: signedMap.counts,
    buckets: signedMap.buckets,
    blockedBuckets: signedMap.blockedBuckets,
    post: {
      ok: post.ok,
      statusCode: post.statusCode || null,
      body: post.body || post.error || null
    },
    outputs: Object.fromEntries(Object.entries(outputs).map(([key, value]) => [key, repoRel(value)])),
    boundary: signedMap.boundary
  };
  writeJson(outputs.reportJson, report);
  writeText(outputs.reportMd, reportMd(report));

  console.log(JSON.stringify({
    ok: true,
    status: report.status,
    reviewId: review.id,
    sequenceRows: sequence.length,
    blockedRows: blocked.length,
    postOk: post.ok,
    report: repoRel(outputs.reportMd),
    signedMap: repoRel(outputs.signedMap)
  }, null, 2));
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
