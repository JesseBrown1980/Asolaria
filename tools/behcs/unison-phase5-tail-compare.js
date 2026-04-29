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
const lirisCompletionQuery = "http://192.168.100.2:4947/behcs/inbox?verb=unison-phase4-liris-execution-complete&limit=10";

const paths = Object.freeze({
  acerChain: path.join(runRoot, "COSIGN_CHAIN.ndjson"),
  localInbox: path.join(repoRoot, "data", "behcs", "inbox.ndjson"),
  comparisonJson: path.join(runRoot, "phase5-tail-comparison.json"),
  envelope: path.join(runRoot, "unison-phase5-tail-comparison-envelope.json"),
  postResult: path.join(runRoot, "unison-phase5-tail-comparison-post-result.json"),
  reportJson: path.join(repoRoot, "reports", "unison-phase5-tail-comparison-latest.json"),
  reportMd: path.join(repoRoot, "reports", "unison-phase5-tail-comparison-latest.md")
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

function httpJson(method, url, body = null) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const payload = body ? Buffer.from(JSON.stringify(body), "utf8") : null;
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path: `${parsed.pathname}${parsed.search}`,
      method,
      headers: payload ? {
        "content-type": "application/json",
        "content-length": payload.length,
        connection: "close"
      } : { connection: "close" },
      timeout: 10000
    }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        let parsedBody = text;
        try {
          parsedBody = JSON.parse(text);
        } catch (_error) {
          // Keep raw response text.
        }
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode, body: parsedBody });
      });
    });
    req.on("timeout", () => req.destroy(new Error("request_timeout")));
    req.on("error", (error) => resolve({ ok: false, error: error.message }));
    if (payload) req.write(payload);
    req.end();
  });
}

function latestByTime(rows) {
  const copy = rows.slice();
  copy.sort((a, b) => String(a.received_at || a.ts || "").localeCompare(String(b.received_at || b.ts || "")));
  return copy[copy.length - 1] || null;
}

function acerTail() {
  const rows = readNdjson(paths.acerChain).filter((row) => !row.parseError);
  const tail = rows[rows.length - 1] || null;
  return {
    rows: rows.length,
    seq: Number(tail?.seq || 0),
    chain_sha: tail?.chain_sha || null,
    operation_id: tail?.operation_id || null
  };
}

function completionRowsFromLocalInbox() {
  return readNdjson(paths.localInbox)
    .filter((row) => !row.parseError)
    .filter((row) => String(row.from || "").toLowerCase().includes("liris"))
    .filter((row) => String(row.verb || "").toLowerCase() === "unison-phase4-liris-execution-complete");
}

async function completionRowsFromLirisBus() {
  const response = await httpJson("GET", lirisCompletionQuery);
  if (!response.ok || !response.body || !Array.isArray(response.body.messages)) {
    return { rows: [], response };
  }
  return { rows: response.body.messages, response };
}

function firstPresent(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function normalizeSha(value) {
  return value ? String(value).trim().toLowerCase() : null;
}

function extractLirisTail(message) {
  if (!message) return null;
  const nested = firstPresent(
    message.liris_phase4_tail,
    message.phase4_liris_tail,
    message.liris_tail,
    message.phase4_tail,
    message.tail
  ) || {};
  return {
    rows: Number(firstPresent(
      nested.rows,
      nested.ledger_rows,
      nested.liris_rows,
      message.rows,
      message.ledger_rows,
      message.liris_rows,
      message.liris_phase4_rows
    ) || 0),
    seq: Number(firstPresent(
      nested.seq,
      nested.tail_seq,
      nested.liris_tail_seq,
      message.seq,
      message.tail_seq,
      message.liris_tail_seq
    ) || 0),
    chain_sha: normalizeSha(firstPresent(
      nested.chain_sha,
      nested.tail_sha,
      nested.tail_chain_sha,
      nested.liris_tail_sha,
      message.chain_sha,
      message.tail_sha,
      message.tail_chain_sha,
      message.liris_tail_sha,
      message.liris_phase4_tail_sha
    )),
    source_id: message.id || null,
    source_received_at: message.received_at || message.ts || null
  };
}

function extractAuthorityVerification(message) {
  if (!message) {
    return {
      sequenceShaMatch: false,
      blockedShaMatch: false,
      signedMapCanonicalFound: false,
      signedMapShaAuthority: null,
      chainDiffAcceptable: false,
      authorityShaSurfaceProven: false
    };
  }
  const verification = message.authority_verification || {};
  const joinKeys = message.byte_identical_join_keys || {};
  const phase5Proposal = message.phase5_proposal || {};
  const sequenceSha = normalizeSha(firstPresent(
    verification.sequence_sha_actual,
    joinKeys.sequence_authority_sha
  ));
  const sequenceAuthority = normalizeSha(firstPresent(
    verification.sequence_sha_authority,
    joinKeys.sequence_authority_sha
  ));
  const blockedSha = normalizeSha(firstPresent(
    verification.blocked_sha_actual,
    joinKeys.blocked_authority_sha
  ));
  const blockedAuthority = normalizeSha(firstPresent(
    verification.blocked_sha_authority,
    joinKeys.blocked_authority_sha
  ));
  const signedMapAuthority = normalizeSha(firstPresent(
    verification.signed_map_sha_authority,
    joinKeys.signed_map_authority_sha
  ));
  const sequenceShaMatch = verification.sequence_sha_match === true
    || (Boolean(sequenceSha) && sequenceSha === sequenceAuthority);
  const blockedShaMatch = verification.blocked_sha_match === true
    || (Boolean(blockedSha) && blockedSha === blockedAuthority);
  const signedMapCanonicalFound = verification.signed_map_canonical_found === true
    || Boolean(signedMapAuthority);
  const authorityShaSurfaceProven = sequenceShaMatch && blockedShaMatch && signedMapCanonicalFound;
  return {
    sequenceShaMatch,
    sequenceSha,
    sequenceAuthority,
    blockedShaMatch,
    blockedSha,
    blockedAuthority,
    signedMapCanonicalFound,
    signedMapShaAuthority: signedMapAuthority,
    chainDiffAcceptable: phase5Proposal.chain_diff_acceptable === true,
    authorityShaSurfaceProven,
    sourceNote: message.divergence_note || joinKeys.note || null
  };
}

function phase5EnvelopeId(status) {
  if (status === "PHASE5_TAIL_MATCH_PROVEN_BY_AUTHORITY_SHAS") {
    return "unison-2026-04-26-acer-phase5-authority-sha-match-001";
  }
  if (status === "PHASE5_TAIL_MATCH_PROVEN") {
    return "unison-2026-04-26-acer-phase5-tail-match-001";
  }
  return "unison-2026-04-26-acer-phase5-tail-comparison-001";
}

function buildEnvelope(result, generatedAt) {
  const status = result.status;
  const proven = status === "PHASE5_TAIL_MATCH_PROVEN"
    || status === "PHASE5_TAIL_MATCH_PROVEN_BY_AUTHORITY_SHAS";
  return {
    verb: "unison-phase5-tail-comparison",
    target: "liris",
    from: "acer-codex",
    id: phase5EnvelopeId(status),
    ts: generatedAt,
    phase: "phase-5-tail-comparison",
    responding_to: result.lirisCompletion?.id || "unison-phase4-liris-execution-complete",
    runId,
    status,
    comparison: result.comparison,
    authority_verification: result.authorityVerification,
    acer_phase4_tail: result.acerTail,
    liris_phase4_tail: result.lirisTail,
    d11: proven
      ? (status === "PHASE5_TAIL_MATCH_PROVEN_BY_AUTHORITY_SHAS"
        ? "PROVEN_BILATERAL_AUTHORITY_SHA_MATCH_WITH_SIDE_STAMPED_CHAIN_DIFF"
        : "PROVEN_BILATERAL_TAIL_MATCH")
      : "OBSERVED_PHASE5_TAIL_DIVERGENCE_HOLD",
    boundary: "Append-only comparison only. No file mutation, no sensitive mutation, no process fanout.",
    glyph_sentence: proven
      ? (status === "PHASE5_TAIL_MATCH_PROVEN_BY_AUTHORITY_SHAS"
        ? "META-COSIGN { ACER-LIRIS-PHASE5-AUTHORITY-SHAS-MATCH } · SIDE-STAMPED-CHAIN-DIFF-ACCEPTED · D11-PROVEN @ M-INDICATIVE ."
        : "META-COSIGN { ACER-LIRIS-PHASE5-TAIL-MATCH } · UNISON-2026-04-26 · D11-PROVEN @ M-INDICATIVE .")
      : "META-HOLD { ACER-LIRIS-PHASE5-TAIL-DIVERGENCE } · UNISON-2026-04-26 · REVIEW-REQUIRED @ M-INDICATIVE ."
  };
}

function writeReport(result) {
  writeJson(paths.comparisonJson, result);
  writeJson(paths.reportJson, result);
  const lirisTail = result.lirisTail || {};
  const lines = [
    "# Unison Phase 5 Tail Comparison",
    "",
    `Generated: ${result.generatedAt}`,
    "",
    `Status: ${result.status}`,
    "",
    "Acer tail:",
    `- rows: ${result.acerTail.rows}`,
    `- seq: ${result.acerTail.seq}`,
    `- chain_sha: \`${result.acerTail.chain_sha || "missing"}\``,
    "",
    "Liris tail:",
    `- envelope: \`${result.lirisCompletion?.id || "missing"}\``,
    `- rows: ${lirisTail.rows || "missing"}`,
    `- seq: ${lirisTail.seq || "missing"}`,
    `- chain_sha: \`${lirisTail.chain_sha || "missing"}\``,
    "",
    "Comparison:",
    `- rows match: ${Boolean(result.comparison?.rowsMatch)}`,
    `- seq match: ${Boolean(result.comparison?.seqMatch)}`,
    `- chain sha match: ${Boolean(result.comparison?.chainShaMatch)}`,
    `- authority SHA surface proven: ${Boolean(result.authorityVerification?.authorityShaSurfaceProven)}`,
    `- side-stamped chain diff acceptable: ${Boolean(result.authorityVerification?.chainDiffAcceptable)}`,
    "",
    result.status === "AWAITING_LIRIS_PHASE4_REPLAY_COMPLETE"
      ? "Next: wait for Liris to post `unison-phase4-liris-execution-complete`."
      : `Posted to Liris: ${Boolean(result.post?.ok)}`,
    "",
    "Boundary: descriptor comparison only; no SMB write, no remote file operation, no sensitive mutation, no process fanout."
  ];
  writeText(paths.reportMd, lines.join("\n"));
}

async function run() {
  const generatedAt = new Date().toISOString();
  const localRows = completionRowsFromLocalInbox();
  const remote = await completionRowsFromLirisBus();
  const lirisCompletion = latestByTime([...localRows, ...remote.rows]);
  const localAcerTail = acerTail();
  const lirisTail = extractLirisTail(lirisCompletion);
  const authorityVerification = extractAuthorityVerification(lirisCompletion);

  const comparison = lirisTail ? {
    rowsMatch: Number(lirisTail.rows) === Number(localAcerTail.rows),
    seqMatch: Number(lirisTail.seq) === Number(localAcerTail.seq),
    chainShaMatch: normalizeSha(lirisTail.chain_sha) === normalizeSha(localAcerTail.chain_sha),
    authorityShaSurfaceMatch: authorityVerification.authorityShaSurfaceProven,
    sideStampedChainDiffAccepted: authorityVerification.chainDiffAcceptable,
    comparedAt: generatedAt
  } : {
    rowsMatch: false,
    seqMatch: false,
    chainShaMatch: false,
    authorityShaSurfaceMatch: false,
    sideStampedChainDiffAccepted: false,
    comparedAt: generatedAt
  };

  let status = "AWAITING_LIRIS_PHASE4_REPLAY_COMPLETE";
  if (lirisCompletion && comparison.rowsMatch && comparison.seqMatch && comparison.chainShaMatch) {
    status = "PHASE5_TAIL_MATCH_PROVEN";
  } else if (
    lirisCompletion
    && comparison.rowsMatch
    && comparison.seqMatch
    && comparison.authorityShaSurfaceMatch
    && comparison.sideStampedChainDiffAccepted
  ) {
    status = "PHASE5_TAIL_MATCH_PROVEN_BY_AUTHORITY_SHAS";
  } else if (lirisCompletion) {
    status = "PHASE5_TAIL_DIVERGENCE_HOLD";
  }

  const result = {
    reportId: "unison-phase5-tail-comparison-latest",
    generatedAt,
    runId,
    status,
    lirisQuery: {
      url: lirisCompletionQuery,
      ok: remote.response?.ok || false,
      statusCode: remote.response?.statusCode || null,
      remoteMatches: remote.rows.length,
      localMatches: localRows.length
    },
    acerTail: localAcerTail,
    lirisCompletion: lirisCompletion ? {
      id: lirisCompletion.id || null,
      verb: lirisCompletion.verb || null,
      from: lirisCompletion.from || null,
      received_at: lirisCompletion.received_at || lirisCompletion.ts || null,
      message_sha256: sha256(JSON.stringify(lirisCompletion))
    } : null,
    lirisTail,
    comparison,
    authorityVerification,
    outputs: {
      comparisonJson: repoRel(paths.comparisonJson),
      reportMd: repoRel(paths.reportMd)
    },
    boundary: {
      descriptorOnly: true,
      remoteFileOperation: false,
      sensitiveMutation: false,
      processFanout: false,
      smbWrite: false
    }
  };

  if (lirisCompletion) {
    const envelope = buildEnvelope(result, generatedAt);
    writeJson(paths.envelope, envelope);
    const post = await httpJson("POST", replyTarget, envelope);
    writeJson(paths.postResult, { replyTarget, postedAt: new Date().toISOString(), ...post });
    result.post = {
      attempted: true,
      ok: post.ok,
      statusCode: post.statusCode || null,
      body: post.body || post.error || null,
      envelope: repoRel(paths.envelope),
      postResult: repoRel(paths.postResult)
    };
  } else {
    result.post = {
      attempted: false,
      reason: "liris_completion_missing"
    };
  }

  writeReport(result);
  console.log(JSON.stringify({
    ok: true,
    status,
    lirisCompletionFound: Boolean(lirisCompletion),
    acerTail: localAcerTail,
    lirisTail,
    postAttempted: result.post.attempted,
    postOk: result.post.ok || false,
    report: repoRel(paths.reportMd)
  }, null, 2));
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
