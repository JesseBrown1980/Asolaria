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
const nowIso = () => new Date().toISOString();

const paths = Object.freeze({
  phase4Sequence: path.join(runRoot, "phase4-execution-sequence.ndjson"),
  blockedSensitive: path.join(runRoot, "phase4-blocked-sensitive.ndjson"),
  signedMap: path.join(runRoot, "merge-map.signed.json"),
  cosignChain: path.join(runRoot, "COSIGN_CHAIN.ndjson"),
  executionLedger: path.join(runRoot, "phase4-acer-execution-ledger.ndjson"),
  skippedLedger: path.join(runRoot, "phase4-acer-execution-skipped.ndjson"),
  summaryJson: path.join(repoRoot, "reports", "unison-phase4-acer-execution-latest.json"),
  summaryMd: path.join(repoRoot, "reports", "unison-phase4-acer-execution-latest.md"),
  envelope: path.join(runRoot, "unison-phase4-acer-execution-complete-envelope.json"),
  postResult: path.join(runRoot, "unison-phase4-acer-execution-complete-post-result.json")
});

const REPLY_TARGET = "http://192.168.100.2:4947/behcs/send";
const SENSITIVE_QUORUM = "acer+lineage_liris+hermes+sentinel_kr";

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

function appendNdjson(filePath, rows) {
  if (!rows.length) return;
  ensureDir(filePath);
  const payload = rows.map((row) => JSON.stringify(row)).join("\n") + "\n";
  fs.appendFileSync(filePath, payload, "utf8");
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

function canonicalJson(value) {
  return JSON.stringify(value, Object.keys(value).sort());
}

function operationId(row) {
  return sha256(JSON.stringify({
    runId,
    phase: row.phase,
    ordinal: row.ordinal,
    bucket: row.bucket,
    side: row.side,
    operation: row.operation,
    joinKey: row.joinKey,
    descriptorHash: row.descriptorHash
  }));
}

function summarizeBy(rows, key) {
  return rows.reduce((acc, row) => {
    const value = row[key] || "unknown";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
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
        let parsedBody = text;
        try {
          parsedBody = JSON.parse(text);
        } catch (_error) {
          // Keep raw body.
        }
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode, body: parsedBody });
      });
    });
    req.on("timeout", () => req.destroy(new Error("post_timeout")));
    req.on("error", (error) => resolve({ ok: false, error: error.message }));
    req.end(payload);
  });
}

function lastChainState(chainRows) {
  if (!chainRows.length) return { seq: 0, sha: "GENESIS" };
  const last = chainRows[chainRows.length - 1];
  return { seq: Number(last.seq || 0), sha: last.chain_sha || last.row_sha || "GENESIS" };
}

function validateSequenceRow(row) {
  const errors = [];
  if (row.bucket === "SENSITIVE_CLASS_BLOCKED") errors.push("sensitive_class_row_in_sequence");
  if (row.mutationAllowed !== false) errors.push("mutation_allowed_not_false");
  if (row.remoteFileWriteAllowed !== false) errors.push("remote_file_write_allowed_not_false");
  if (!row.cosignAppendRequired) errors.push("cosign_append_required_missing");
  if (!row.operation) errors.push("operation_missing");
  if (!row.joinKey) errors.push("join_key_missing");
  return errors;
}

function executionRecord(row, generatedAt) {
  const id = operationId(row);
  return {
    id: `acer-exec-${row.ordinal}-${id.slice(0, 16)}`,
    operation_id: id,
    runId,
    phase: "phase-4",
    executor: "acer-codex",
    executedAt: generatedAt,
    sourceOrdinal: row.ordinal,
    bucket: row.bucket,
    side: row.side,
    operation: row.operation,
    d_class: row.d_class,
    joinKey: row.joinKey,
    descriptorHash: row.descriptorHash,
    sourcePath: row.path || null,
    actionTaken: "APPEND_ONLY_LOCAL_DESCRIPTOR_LEDGER",
    mutationAllowed: false,
    remoteFileWriteAllowed: false,
    sensitiveMutation: false,
    d11: row.d11 === "PROVEN_OPERATOR_WITNESSED" ? "PROVEN_LOCAL_APPEND" : "OBSERVED_LOCAL_APPEND",
    boundary: "no_remote_write_no_sensitive_mutation_no_process_fanout"
  };
}

function chainRecord(execution, prev, generatedAt) {
  const rowSha = sha256(canonicalJson(execution));
  const base = {
    seq: prev.seq + 1,
    runId,
    phase: "phase-4",
    side: "acer",
    ts: generatedAt,
    prev_sha: prev.sha,
    row_sha: rowSha,
    operation_id: execution.operation_id,
    execution_id: execution.id,
    operation: execution.operation,
    bucket: execution.bucket,
    d_class: execution.d_class,
    joinKey: execution.joinKey,
    descriptorHash: execution.descriptorHash,
    cosign: "ACER-LOCAL-DESCRIPTOR-EXECUTION",
    d11: execution.d11,
    mutationAllowed: false,
    remoteFileWriteAllowed: false,
    sensitiveMutation: false
  };
  return { ...base, chain_sha: sha256(canonicalJson(base)) };
}

function reportMd(summary) {
  return `# Unison Phase 4 Acer Execution

Generated: ${summary.generatedAt}

Status: ${summary.status}

Counts:
- Sequence rows considered: ${summary.counts.sequenceRows}
- Newly executed rows: ${summary.counts.newExecutedRows}
- Already executed rows skipped: ${summary.counts.skippedAlreadyExecutedRows}
- Validation holds: ${summary.counts.validationHolds}
- Blocked sensitive rows retained: ${summary.counts.blockedSensitiveRows}

LAW-001:
- Acer 4947/4950: ${summary.law001.acer4947 ? "open" : "closed"}/${summary.law001.acer4950 ? "open" : "closed"}
- Liris 4947/4950: ${summary.law001.liris4947 ? "open" : "closed"}/${summary.law001.liris4950 ? "open" : "closed"}

Chain:
- Chain file: \`${summary.outputs.cosignChain}\`
- Tail seq: ${summary.chain.tailSeq}
- Tail sha: \`${summary.chain.tailSha}\`

Post:
- Liris accepted: ${summary.post.ok}
- Status code: ${summary.post.statusCode || "n/a"}

Artifacts:
- Execution ledger: \`${summary.outputs.executionLedger}\`
- Skipped ledger: \`${summary.outputs.skippedLedger}\`
- Envelope: \`${summary.outputs.envelope}\`
- Post result: \`${summary.outputs.postResult}\`

Boundary: Acer executed descriptor-ledger appends only. No SMB write, no remote file operation, no sensitive mutation, no process fanout.
`;
}

async function run() {
  const generatedAt = nowIso();
  const sequenceRows = readNdjson(paths.phase4Sequence);
  const blockedRows = readNdjson(paths.blockedSensitive);
  const signedMap = readJson(paths.signedMap, {});
  const chainRows = readNdjson(paths.cosignChain);
  const executedIds = new Set(chainRows.map((row) => row.operation_id).filter(Boolean));

  const validationHolds = [];
  const executable = [];
  for (const row of sequenceRows) {
    const errors = validateSequenceRow(row);
    if (errors.length) {
      validationHolds.push({ row, errors });
    } else {
      executable.push(row);
    }
  }

  let prev = lastChainState(chainRows);
  const newExecutions = [];
  const newChainRows = [];
  const skipped = [];

  for (const row of executable) {
    const id = operationId(row);
    if (executedIds.has(id)) {
      skipped.push({
        operation_id: id,
        sourceOrdinal: row.ordinal,
        bucket: row.bucket,
        operation: row.operation,
        joinKey: row.joinKey,
        skippedAt: generatedAt,
        reason: "already_in_cosign_chain"
      });
      continue;
    }
    const execution = executionRecord(row, generatedAt);
    const chain = chainRecord(execution, prev, generatedAt);
    prev = { seq: chain.seq, sha: chain.chain_sha };
    newExecutions.push(execution);
    newChainRows.push(chain);
    executedIds.add(id);
  }

  appendNdjson(paths.executionLedger, newExecutions);
  appendNdjson(paths.cosignChain, newChainRows);
  writeText(paths.skippedLedger, skipped.map((row) => JSON.stringify(row)).join("\n"));

  const law001 = {
    acer4947: await checkTcp("127.0.0.1", 4947),
    acer4950: await checkTcp("127.0.0.1", 4950),
    liris4947: await checkTcp("192.168.100.2", 4947),
    liris4950: await checkTcp("192.168.100.2", 4950)
  };

  const finalChain = readNdjson(paths.cosignChain);
  const tail = lastChainState(finalChain);
  const summaryCore = {
    generatedAt,
    status: validationHolds.length === 0 ? "ACER_PHASE4_DESCRIPTOR_EXECUTION_COMPLETE" : "ACER_PHASE4_DESCRIPTOR_EXECUTION_WITH_HOLDS",
    sourceSignedMap: {
      id: signedMap.id || null,
      sourceReview: signedMap.sourceReview || null,
      d11: signedMap.d11 || null
    },
    counts: {
      sequenceRows: sequenceRows.length,
      newExecutedRows: newExecutions.length,
      skippedAlreadyExecutedRows: skipped.length,
      validationHolds: validationHolds.length,
      blockedSensitiveRows: blockedRows.length
    },
    buckets: summarizeBy(newExecutions, "bucket"),
    law001,
    chain: {
      tailSeq: tail.seq,
      tailSha: tail.sha,
      newChainRows: newChainRows.length,
      chainRowsTotal: finalChain.length
    },
    boundary: {
      smbWrite: false,
      remoteFileOperation: false,
      sensitiveMutation: false,
      processFanout: false,
      blockedSensitiveQuorum: SENSITIVE_QUORUM
    },
    outputs: {
      cosignChain: repoRel(paths.cosignChain),
      executionLedger: repoRel(paths.executionLedger),
      skippedLedger: repoRel(paths.skippedLedger),
      summaryJson: repoRel(paths.summaryJson),
      summaryMd: repoRel(paths.summaryMd),
      envelope: repoRel(paths.envelope),
      postResult: repoRel(paths.postResult)
    }
  };

  const envelope = {
    verb: "unison-phase4-acer-execution-complete",
    target: "liris",
    from: "acer-codex",
    id: "unison-2026-04-26-acer-phase4-execution-complete-001",
    ts: generatedAt,
    responding_to: "unison-2026-04-26-acer-phase4-execution-sequence-001",
    status: summaryCore.status,
    counts: summaryCore.counts,
    chain: summaryCore.chain,
    law001,
    artifacts: summaryCore.outputs,
    sha256_cosign_chain: fs.existsSync(paths.cosignChain) ? sha256(fs.readFileSync(paths.cosignChain, "utf8")) : null,
    sha256_execution_ledger: fs.existsSync(paths.executionLedger) ? sha256(fs.readFileSync(paths.executionLedger, "utf8")) : null,
    sha256_blocked_sensitive: fs.existsSync(paths.blockedSensitive) ? sha256(fs.readFileSync(paths.blockedSensitive, "utf8")) : null,
    phase5_requirement: "liris executes/records its counterpart and returns tail-sha for byte-identical comparison where applicable",
    boundary: summaryCore.boundary,
    glyph_sentence: "EVT-UNISON-PHASE4-ACER-EXECUTION-COMPLETE - DESCRIPTOR-APPEND-ONLY - SENSITIVE-BLOCKED - COSIGN-CHAIN-SHA-WALKED @ M-INDICATIVE .",
    d11: "PROVEN_LOCAL_APPEND_ONLY_EXECUTION"
  };
  writeJson(paths.envelope, envelope);

  const post = await postJson(REPLY_TARGET, envelope);
  writeJson(paths.postResult, { replyTarget: REPLY_TARGET, ...post, postedAt: nowIso() });

  const summary = {
    reportId: "unison-phase4-acer-execution-latest",
    ...summaryCore,
    post: {
      ok: post.ok,
      statusCode: post.statusCode || null,
      body: post.body || post.error || null
    },
    validationHolds
  };

  writeJson(paths.summaryJson, summary);
  writeText(paths.summaryMd, reportMd(summary));

  console.log(JSON.stringify({
    ok: true,
    status: summary.status,
    newExecutedRows: newExecutions.length,
    skippedAlreadyExecutedRows: skipped.length,
    validationHolds: validationHolds.length,
    blockedSensitiveRows: blockedRows.length,
    tailSeq: tail.seq,
    tailSha: tail.sha,
    postOk: post.ok,
    report: repoRel(paths.summaryMd)
  }, null, 2));
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
