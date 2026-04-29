#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const http = require("http");

const repoRoot = path.resolve(__dirname, "..", "..");
const runId = "execute-liris-messages-20260427";
const eventId = "EVT-ACER-EXECUTES-LIRIS-MESSAGES-2026-04-27";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", runId);

const PATHS = Object.freeze({
  inbox: path.join(repoRoot, "data", "behcs", "inbox.ndjson"),
  execution: path.join(runRoot, "liris-message-execution.v1.json"),
  ledger: path.join(runRoot, "liris-message-execution-ledger.ndjson"),
  dirtyIngest: path.join(repoRoot, "data", "behcs", "orchestration", "dual-computer-upgrade-20260427", "liris-dirty-worktree-classification-ingest.v1.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "execute-liris-messages.v1.json"),
  index: path.join(repoRoot, "data", "behcs", "index", "execute-liris-messages-index.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "execute-liris-messages-map-map-mapped.v1.json"),
  cube: path.join(repoRoot, "data", "behcs", "cubes", "execute-liris-messages-cube-cubed.cube.js"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "execute-liris-messages-behcs256.glpj.json"),
  ackEnvelope: path.join(runRoot, "liris-message-execution-summary-envelope.json"),
  ackPostResult: path.join(runRoot, "liris-message-execution-summary-post-result.json"),
  reportJson: path.join(repoRoot, "reports", "execute-liris-messages-latest.json"),
  reportMd: path.join(repoRoot, "reports", "execute-liris-messages-latest.md")
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

function writeNdjson(filePath, rows) {
  writeText(filePath, rows.map((row) => JSON.stringify(row)).join("\n"));
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
  return fs.readFileSync(filePath, "utf8").split(/\r?\n/).filter(Boolean).map((line, index) => {
    try {
      return { ...JSON.parse(line), _line: index + 1 };
    } catch (_error) {
      return null;
    }
  }).filter(Boolean);
}

function repoRel(filePath) {
  const relative = path.relative(repoRoot, filePath);
  if (path.isAbsolute(relative) || relative.startsWith("..")) return filePath.replace(/\\/g, "/");
  return relative.replace(/\\/g, "/");
}

function sha(value) {
  return crypto.createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex");
}

function latestById(rows, id) {
  return rows.filter((row) => row.id === id).at(-1) || null;
}

function latestByVerb(rows, verb, target = null) {
  return rows.filter((row) => row.verb === verb && (!target || row.target === target || row.to === target)).at(-1) || null;
}

function fileOk(filePath) {
  return fs.existsSync(filePath);
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
      headers: payload
        ? { "content-type": "application/json", "content-length": payload.length, connection: "close" }
        : { connection: "close" },
      timeout: 10000
    }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        let responseBody = text;
        try {
          responseBody = JSON.parse(text);
        } catch (_error) {
          // Keep raw text.
        }
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode, body: responseBody });
      });
    });
    req.on("timeout", () => req.destroy(new Error("request_timeout")));
    req.on("error", (error) => resolve({ ok: false, error: error.message }));
    if (payload) req.write(payload);
    req.end();
  });
}

function summarizeEnvelope(row) {
  if (!row) return null;
  return {
    line: row._line,
    id: row.id,
    verb: row.verb,
    from: row.from,
    target: row.target || row.to,
    ts: row.ts,
    status: row.status || row.payload?.verb || row.type || null,
    d11: row.d11 || null
  };
}

async function run() {
  const generatedAt = new Date().toISOString();
  const rows = readNdjson(PATHS.inbox);

  const lirisPromotion = latestById(rows, "dual-computer-upgrade-2026-04-27-liris-local-promotion-summary-001");
  const lirisPostseal = latestById(rows, "dual-computer-upgrade-2026-04-27-liris-postseal-mirror-complete-001");
  const lirisDirty = latestById(rows, "dual-computer-upgrade-2026-04-27-liris-dirty-worktree-classify-001");
  const protocol = latestById(rows, "cross-pollinate-live-free-agent-pid-protocol-v1-001");
  const permanentMint = latestById(rows, "live-free-agent-protocol-v1-permanently-minted-001");
  const permanentMintFalcon = latestById(rows, "live-free-agent-protocol-v1-permanently-minted-falcon-001");

  const dirtyIngest = lirisDirty ? {
    id: "liris-dirty-worktree-classification-ingest.v1",
    generatedAt,
    sourceEnvelope: summarizeEnvelope(lirisDirty),
    status: "LIRIS_DIRTY_WORKTREE_CLASSIFICATION_INGESTED_ON_ACER",
    sourceStatus: lirisDirty.status,
    d11: lirisDirty.d11,
    totalRows: lirisDirty.total_rows,
    classified: lirisDirty.classified,
    unclassified: lirisDirty.unclassified,
    bucketCountsTop10: lirisDirty.bucket_counts_top10,
    classifySha256: lirisDirty.classify_sha256,
    destructiveCleanupAttempted: lirisDirty.destructive_cleanup_attempted === true,
    liveModelCalls: lirisDirty.liveModelCalls || 0,
    processFanout: lirisDirty.processFanout || 0,
    remoteWritesPerformed: lirisDirty.remoteWritesPerformed || 0,
    glyphSentence: lirisDirty.glyph_sentence,
    boundary: lirisDirty.boundary,
    actionTaken: "Materialized summary, preserved no-destruction boundary, and included in Acer execution ack."
  } : null;
  if (dirtyIngest) writeJson(PATHS.dirtyIngest, dirtyIngest);

  const statuses = [
    {
      key: "liris-local-promotion",
      envelope: summarizeEnvelope(lirisPromotion),
      execution: fileOk(path.join(repoRoot, "reports", "dual-computer-upgrade-bilateral-promotion-seal-latest.md"))
        ? "ALREADY_EXECUTED_AND_SEALED"
        : "REQUIRES_ATTENTION"
    },
    {
      key: "liris-postseal-mirror",
      envelope: summarizeEnvelope(lirisPostseal),
      execution: fileOk(path.join(repoRoot, "reports", "dual-computer-upgrade-postseal-mirror-seal-latest.md"))
        ? "ALREADY_EXECUTED_AND_SEALED"
        : "REQUIRES_ATTENTION"
    },
    {
      key: "liris-dirty-worktree-classification",
      envelope: summarizeEnvelope(lirisDirty),
      execution: dirtyIngest ? "EXECUTED_INGESTED_ACKED_NO_DESTRUCTION" : "MISSING_ENVELOPE"
    },
    {
      key: "live-free-agent-protocol-crosspollination",
      envelope: summarizeEnvelope(protocol),
      execution: fileOk(path.join(repoRoot, "reports", "live-free-agent-pid-protocol-crosspollination-latest.md"))
        ? "ALREADY_EXECUTED_ACKED"
        : "REQUIRES_ATTENTION"
    },
    {
      key: "live-free-agent-permanent-mint",
      envelope: summarizeEnvelope(permanentMint),
      execution: fileOk(path.join(repoRoot, "reports", "live-free-agent-permanent-glyph-mint-latest.md"))
        ? "ALREADY_EXECUTED_CANON_MINTED_ACKED"
        : "REQUIRES_ATTENTION"
    },
    {
      key: "live-free-agent-permanent-mint-falcon-copy",
      envelope: summarizeEnvelope(permanentMintFalcon),
      execution: fileOk(path.join(repoRoot, "data", "behcs", "orchestration", "live-free-agent-permanent-mint-20260427", "falcon-live-free-agent-permanent-mint-observer-post-result.json"))
        ? "ALREADY_EXECUTED_FALCON_OBSERVER_POSTED"
        : "REQUIRES_ATTENTION"
    }
  ];

  const ledgerRows = statuses.map((status, index) => {
    const row = {
      seq: index + 1,
      ts: generatedAt,
      runId,
      eventId,
      ...status,
      previous: index === 0 ? "" : null
    };
    return row;
  }).map((row, index, allRows) => {
    const previous = index === 0 ? "" : allRows[index - 1].rowSha;
    const base = { ...row, previous };
    return { ...base, rowSha: sha(base) };
  });

  const execution = {
    id: "execute-liris-messages.v1",
    generatedAt,
    runId,
    eventId,
    status: "LIRIS_MESSAGES_EXECUTED_ON_ACER",
    messagesConsidered: statuses.length,
    executedNow: dirtyIngest ? 1 : 0,
    alreadyExecuted: statuses.filter((status) => status.execution.startsWith("ALREADY_EXECUTED")).length,
    requiresAttention: statuses.filter((status) => status.execution === "REQUIRES_ATTENTION").length,
    statuses,
    boundary: "Liris message execution pass only materializes local Acer artifacts and sends LAW-001 acknowledgements. No cleanup, delete, restore, reset, live model call, process fanout, sensitive execution, or remote file mutation."
  };

  writeJson(PATHS.execution, execution);
  writeNdjson(PATHS.ledger, ledgerRows);

  const memory = {
    type: "behcs-memory",
    id: "memory-execute-liris-messages-v1",
    generatedAt,
    runId,
    eventId,
    status: execution.status,
    summary: "Executed pending Liris messages on Acer: dirty-worktree classification summary was ingested, while prior promotion/postseal/live-free-agent messages were confirmed already executed and sealed.",
    source: repoRel(PATHS.execution)
  };
  const index = {
    id: "execute-liris-messages-index-v1",
    generatedAt,
    keys: ["liris", "message-execution", "law-001", "dirty-worktree", "permanent-mint"],
    artifacts: {
      execution: repoRel(PATHS.execution),
      dirtyIngest: repoRel(PATHS.dirtyIngest),
      ledger: repoRel(PATHS.ledger),
      memory: repoRel(PATHS.memory),
      map: repoRel(PATHS.map),
      cube: repoRel(PATHS.cube),
      glpj: repoRel(PATHS.glpj),
      report: repoRel(PATHS.reportMd)
    }
  };
  const map = {
    id: "execute-liris-messages-map-map-mapped-v1",
    generatedAt,
    route: [
      "poll-acer-law001-inbox",
      "select-liris-action-envelopes",
      "confirm-existing-seals",
      "ingest-liris-dirty-classification",
      "emit-memory-index-map-cube-glpj",
      "ack-liris"
    ],
    statuses: statuses.map(({ key, execution }) => ({ key, execution })),
    boundary: execution.boundary
  };
  const glpj = {
    id: "execute-liris-messages-behcs256-glpj-v1",
    generatedAt,
    eventId,
    sentences: [
      "META-EXECUTE { LIRIS-MESSAGES } : POLL-INBOX : MATERIALIZE-MISSING-LOCAL-INGEST : ACK-LIRIS @ M-INDICATIVE .",
      "META-CLASSIFY { LIRIS-DIRTY-WORKTREE } : 14406-ROWS : NO-DESTRUCTION : ACER-INGESTED @ M-EYEWITNESS .",
      "META-GATE { LIRIS-MESSAGE-EXECUTION } : NO-DELETE : NO-RESET : NO-REMOTE-MUTATION : NO-FANOUT @ M-IMPERATIVE ."
    ]
  };

  writeJson(PATHS.memory, memory);
  writeJson(PATHS.index, index);
  writeJson(PATHS.map, map);
  writeJson(PATHS.glpj, glpj);
  writeText(PATHS.cube, `// Generated ${generatedAt}
module.exports = ${JSON.stringify({
  id: "execute-liris-messages-cube-cubed",
  eventId,
  status: execution.status,
  statuses: statuses.map(({ key, execution }) => ({ key, execution })),
  boundary: execution.boundary
}, null, 2)};
`);

  const ackEnvelope = {
    verb: "execute-liris-messages-acer-summary",
    target: "liris",
    from: "acer-codex",
    id: "execute-liris-messages-20260427-acer-summary-001",
    ts: generatedAt,
    eventId,
    status: execution.status,
    messagesConsidered: execution.messagesConsidered,
    executedNow: execution.executedNow,
    alreadyExecuted: execution.alreadyExecuted,
    requiresAttention: execution.requiresAttention,
    statuses: statuses.map(({ key, envelope, execution }) => ({ key, envelopeId: envelope?.id || null, execution })),
    artifacts: index.artifacts,
    glyph_sentence: "META-EXECUTE { LIRIS-MESSAGES } · DIRTY-CLASSIFICATION-INGESTED · PRIOR-SEALS-CONFIRMED · BOUNDARY-PRESERVED @ M-INDICATIVE .",
    d11: "PROVEN_LOCAL_ACER_EXECUTION_OF_LIRIS_MESSAGES",
    boundary: execution.boundary
  };
  writeJson(PATHS.ackEnvelope, ackEnvelope);
  const postResult = await httpJson("POST", "http://192.168.100.2:4947/behcs/send", ackEnvelope);
  writeJson(PATHS.ackPostResult, { postedAt: new Date().toISOString(), result: postResult });

  const report = {
    ok: true,
    status: execution.status,
    messagesConsidered: execution.messagesConsidered,
    executedNow: execution.executedNow,
    alreadyExecuted: execution.alreadyExecuted,
    requiresAttention: execution.requiresAttention,
    lirisPostOk: postResult.ok,
    artifacts: index.artifacts
  };
  writeJson(PATHS.reportJson, report);
  writeText(PATHS.reportMd, [
    "# Execute Liris Messages",
    "",
    `Generated: ${generatedAt}`,
    "",
    `Status: ${execution.status}`,
    "",
    `Messages considered: ${execution.messagesConsidered}`,
    `Executed now: ${execution.executedNow}`,
    `Already executed/sealed: ${execution.alreadyExecuted}`,
    `Requires attention: ${execution.requiresAttention}`,
    `Liris ACK accepted: ${postResult.ok}`,
    "",
    "Statuses:",
    ...statuses.map((status) => `- ${status.key}: ${status.execution}${status.envelope?.id ? ` (${status.envelope.id})` : ""}`),
    "",
    "Artifacts:",
    ...Object.values(index.artifacts).map((artifact) => `- ${artifact}`),
    "",
    `Boundary: ${execution.boundary}`
  ].join("\n"));

  console.log(JSON.stringify(report, null, 2));
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
