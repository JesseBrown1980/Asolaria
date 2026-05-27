#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const http = require("http");
const net = require("net");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const runId = "unison-liris-acer-20260426";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", runId);
const inboxPath = path.join(repoRoot, "data", "behcs", "inbox.ndjson");
const latestReportPath = path.join(repoRoot, "reports", "law001-liris-bus-check-latest.json");
const latestReportMdPath = path.join(repoRoot, "reports", "law001-liris-bus-check-latest.md");

const paths = Object.freeze({
  unisonReport: path.join(repoRoot, "reports", "unison-liris-acer-orchestration-latest.json"),
  unisonPostResult: path.join(runRoot, "unison-merge-map-draft-ready-post-result.json"),
  waitEnvelope: path.join(runRoot, "unison-phase3-awaiting-liris-review-envelope.json"),
  waitPostResult: path.join(runRoot, "unison-phase3-awaiting-liris-review-post-result.json")
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

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_error) {
    return fallback;
  }
}

function readInbox() {
  if (!fs.existsSync(inboxPath)) return [];
  return fs.readFileSync(inboxPath, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line, index) => {
      try {
        return { line: index + 1, ...JSON.parse(line) };
      } catch (error) {
        return { line: index + 1, parseError: error.message };
      }
    });
}

function timestampOf(row) {
  const value = row.received_at || row.ts || row.postedAt || null;
  const date = value ? new Date(value) : new Date(0);
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
}

function lirisLike(row) {
  return String(row.from || row.by || "").toLowerCase().includes("liris");
}

function reviewLike(row) {
  const text = `${row.verb || ""} ${row.type || ""} ${row.id || ""}`.toLowerCase();
  return text.includes("unison") && (text.includes("review") || text.includes("cosign"));
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
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path: `${parsed.pathname}${parsed.search}`,
      method: "POST",
      headers: {
        "content-type": "application/json",
        "content-length": payload.length
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
          // Keep raw text for non-JSON endpoints.
        }
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode, body: parsedBody });
      });
    });
    req.on("timeout", () => {
      req.destroy(new Error("post_timeout"));
    });
    req.on("error", (error) => resolve({ ok: false, error: error.message }));
    req.end(payload);
  });
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function md(report) {
  const lastRows = report.lastAfterPost.map((row) => `- ${row.ts}: ${row.from} ${row.verb || row.type || row.id}`).join("\n") || "- none";
  const lirisAfter = report.lirisRowsAfterPost.map((row) => `- ${row.ts}: ${row.verb || row.type || row.id}`).join("\n") || "- none";
  return `# LAW-001 Liris Bus Check

Generated: ${report.generatedAt}

Status: ${report.status}

LAW-001:
- Acer 127.0.0.1:4947 = ${report.law001.acer4947 ? "open" : "closed"}
- Acer 127.0.0.1:4950 = ${report.law001.acer4950 ? "open" : "closed"}
- Liris 192.168.100.2:4947 = ${report.law001.liris4947 ? "open" : "closed"}
- Liris 192.168.100.2:4950 = ${report.law001.liris4950 ? "open" : "closed"}

Unison:
- Draft posted at: ${report.unison.postedAt || "unknown"}
- Draft post ok: ${report.unison.postOk}
- Inbox rows after draft post: ${report.rowsAfterPost}
- Liris rows after draft post: ${report.lirisRowsAfterPost.length}
- Review received: ${report.reviewReceived}

Liris rows after draft post:
${lirisAfter}

Last rows after draft post:
${lastRows}

Boundary: check-only plus optional status envelope; no remote file operation, no sensitive mutation, no SMB write, no process fanout.
`;
}

async function run() {
  const notify = process.argv.includes("--notify");
  const generatedAt = new Date().toISOString();
  const unisonReport = readJson(paths.unisonReport, {});
  const unisonPost = readJson(paths.unisonPostResult, {});
  const postedAt = unisonPost.postedAt ? new Date(unisonPost.postedAt) : new Date(0);
  const inboxRows = readInbox();
  const rowsAfterPost = inboxRows.filter((row) => timestampOf(row) > postedAt);
  const lirisRowsAfterPost = rowsAfterPost.filter(lirisLike);
  const reviewRows = lirisRowsAfterPost.filter(reviewLike);
  const reviewReceived = reviewRows.length > 0;

  const law001 = {
    acer4947: await checkTcp("127.0.0.1", 4947),
    acer4950: await checkTcp("127.0.0.1", 4950),
    liris4947: await checkTcp("192.168.100.2", 4947),
    liris4950: await checkTcp("192.168.100.2", 4950)
  };

  const report = {
    reportId: "law001-liris-bus-check-latest",
    generatedAt,
    status: reviewReceived ? "LIRIS_PHASE3_REVIEW_RECEIVED" : "AWAITING_LIRIS_PHASE3_REVIEW",
    law001,
    unison: {
      postedAt: unisonPost.postedAt || null,
      postOk: Boolean(unisonPost.ok),
      lirisAccepted: unisonPost.body && unisonPost.body.ok === true,
      replyTarget: unisonPost.replyTarget || unisonReport.replyTarget || "http://192.168.100.2:4947/behcs/send",
      handoffId: unisonReport.handoffId || "unknown"
    },
    totalInboxRows: inboxRows.length,
    totalLirisRows: inboxRows.filter(lirisLike).length,
    rowsAfterPost: rowsAfterPost.length,
    lirisRowsAfterPost: lirisRowsAfterPost.map((row) => ({
      line: row.line,
      from: row.from || null,
      verb: row.verb || row.type || null,
      id: row.id || null,
      ts: row.received_at || row.ts || null
    })),
    reviewReceived,
    reviewRows: reviewRows.map((row) => ({
      line: row.line,
      from: row.from || null,
      verb: row.verb || row.type || null,
      id: row.id || null,
      ts: row.received_at || row.ts || null
    })),
    lastAfterPost: rowsAfterPost.slice(-8).map((row) => ({
      line: row.line,
      from: row.from || null,
      verb: row.verb || row.type || null,
      id: row.id || null,
      ts: row.received_at || row.ts || null
    })),
    boundary: {
      remoteFileOperation: false,
      sensitiveMutation: false,
      smbWrite: false,
      processFanout: false
    }
  };

  writeJson(latestReportPath, report);
  writeText(latestReportMdPath, md(report));

  if (notify && !reviewReceived && law001.liris4947) {
    const envelope = {
      verb: "unison-phase3-awaiting-liris-review",
      target: "liris",
      from: "acer-codex",
      id: "unison-2026-04-26-acer-awaiting-liris-review-001",
      ts: generatedAt,
      status: report.status,
      references: {
        sourceHandoff: report.unison.handoffId,
        mergeMapDraft: "data/behcs/orchestration/unison-liris-acer-20260426/merge-map-draft.md",
        report: "reports/law001-liris-bus-check-latest.md"
      },
      counts: {
        lirisRowsAfterPost: report.lirisRowsAfterPost.length,
        inboxRowsAfterPost: report.rowsAfterPost
      },
      law001,
      sha256_report: sha256(JSON.stringify(report)),
      glyph_sentence: "EVT-UNISON-PHASE3-AWAITING-LIRIS-REVIEW - LAW001-OPEN - ACER-NONMUTATING-WAIT @ M-INDICATIVE .",
      boundary: report.boundary,
      next_liris_action: "Return cosigned unison-merge-map-reviewed envelope, or send divergence corrections."
    };
    writeJson(paths.waitEnvelope, envelope);
    const postResult = await postJson(report.unison.replyTarget, envelope);
    writeJson(paths.waitPostResult, { replyTarget: report.unison.replyTarget, ...postResult, postedAt: new Date().toISOString() });
    report.notify = { attempted: true, postOk: postResult.ok, postResultPath: path.relative(repoRoot, paths.waitPostResult).replace(/\\/g, "/") };
    writeJson(latestReportPath, report);
    writeText(latestReportMdPath, md(report));
  } else {
    const reason = reviewReceived ? "review_already_received" : (notify ? "liris_4947_closed" : "notify_not_requested");
    report.notify = { attempted: false, reason };
    writeJson(latestReportPath, report);
  }

  console.log(JSON.stringify({
    ok: true,
    status: report.status,
    law001,
    rowsAfterPost: report.rowsAfterPost,
    lirisRowsAfterPost: report.lirisRowsAfterPost.length,
    reviewReceived,
    notify: report.notify,
    report: path.relative(repoRoot, latestReportMdPath).replace(/\\/g, "/")
  }, null, 2));
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
