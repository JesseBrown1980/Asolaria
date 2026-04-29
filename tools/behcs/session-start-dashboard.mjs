#!/usr/bin/env node
// session-start-dashboard.mjs — operator-facing telemetry dashboard for the
// SessionStart canon-load pipeline. Aggregates four sources into a single
// summary so operators can spot anomalies at a glance:
//
//   - data/behcs/state/canon-cursor.json   (recent session ingestions)
//   - logs/canon-load.log                  (per-event audit trail)
//   - data/behcs/inbox.ndjson              (CANON_LOADED_ACK envelopes)
//   - data/behcs/gnn-live-edges.ndjson     (canon_loaded_at_session_start edges)
//
// Usage:
//   node session-start-dashboard.mjs [--days N] [--json]
//
// Default text mode renders a fixed-width report; --json emits a structured
// object suitable for automation / cron-scraping. All clocks are UTC ISO.
//
// Read-only by design: never mutates source files. Safe to run on prod inbox.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const CURSOR_PATH = path.join(ROOT, "data", "behcs", "state", "canon-cursor.json");
const LOG_PATH = path.join(ROOT, "logs", "canon-load.log");
const INBOX_PATH = path.join(ROOT, "data", "behcs", "inbox.ndjson");
const GNN_EDGES_PATH = path.join(ROOT, "data", "behcs", "gnn-live-edges.ndjson");

// gnn-live-edges.ndjson is large (94k+ lines). We tail-scan a generous
// window — 20k lines covers many days of bursty activity without loading
// the entire file. Adjust if cadence ever exceeds ~3k edges/day.
const GNN_TAIL_LINES = 20000;

function parseArgs(argv) {
  const out = { days: 7, json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--days") {
      const n = Number(argv[++i]);
      if (!Number.isFinite(n) || n <= 0) {
        process.stderr.write(`session-start-dashboard: invalid --days value\n`);
        process.exit(2);
      }
      out.days = n;
    } else if (a.startsWith("--days=")) {
      const n = Number(a.slice("--days=".length));
      if (!Number.isFinite(n) || n <= 0) {
        process.stderr.write(`session-start-dashboard: invalid --days value\n`);
        process.exit(2);
      }
      out.days = n;
    } else if (a === "--json") {
      out.json = true;
    } else if (a === "--help" || a === "-h") {
      process.stdout.write(
        `usage: node session-start-dashboard.mjs [--days N] [--json]\n`
      );
      process.exit(0);
    } else {
      process.stderr.write(`session-start-dashboard: unknown arg ${a}\n`);
      process.exit(2);
    }
  }
  return out;
}

function safeReadJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function readLines(p) {
  if (!fs.existsSync(p)) return [];
  try {
    const data = fs.readFileSync(p, "utf8");
    return data.split(/\r?\n/).filter((l) => l.trim());
  } catch {
    return [];
  }
}

function tailLines(p, maxLines) {
  const all = readLines(p);
  if (all.length <= maxLines) return all;
  return all.slice(-maxLines);
}

function parseSafe(line) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

// canon-load.log lines look like:
//   [2026-04-29T01:07:00.345Z] ingested session=e1-recovery source=recovery ...
// Robust against extra whitespace; first bracketed field is ts, first bare
// token after `]` is the event name, rest is k=v pairs (best-effort).
function parseLogLine(line) {
  const m = line.match(/^\[([^\]]+)\]\s+(\S+)\s*(.*)$/);
  if (!m) return null;
  const ts = m[1];
  const event = m[2];
  const rest = m[3] || "";
  const fields = {};
  // k=v parser tolerant of values with spaces only inside JSON-ish detail=
  // (we don't fully parse those; stop tokenizing once we hit a value that
  // starts with `{` and grab the rest verbatim).
  const tokens = rest.split(/\s+/);
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const k = t.slice(0, eq);
    const v = t.slice(eq + 1);
    if (v.startsWith("{")) {
      fields[k] = tokens.slice(i).join(" ").slice(eq + 1);
      break;
    }
    fields[k] = v;
  }
  return { ts, event, fields };
}

function withinWindow(isoTs, sinceMs) {
  if (!isoTs) return false;
  const t = Date.parse(isoTs);
  if (Number.isNaN(t)) return false;
  return t >= sinceMs;
}

function buildReport(days) {
  const nowMs = Date.now();
  const sinceMs = nowMs - days * 24 * 3600 * 1000;
  const sinceIso = new Date(sinceMs).toISOString();

  const anomalies = [];

  // --- canon-cursor.json --------------------------------------------------
  const cursor = safeReadJson(CURSOR_PATH);
  const cursorSessions =
    cursor && Array.isArray(cursor.sessions) ? cursor.sessions : [];
  if (!cursor) anomalies.push("canon-cursor.json missing or unreadable");

  const recentIngestions = cursorSessions.filter((s) =>
    withinWindow(s.ingested_at, sinceMs)
  );

  const lastIngestion = cursorSessions
    .slice()
    .sort((a, b) =>
      String(b.ingested_at || "").localeCompare(String(a.ingested_at || ""))
    )[0];

  // Current canon = most-recent ingestion's envelope/version/sha8/owner.
  // Falls back to top-level cursor.last_envelope_id if sessions array is
  // empty but the cursor was written.
  const currentCanon = lastIngestion
    ? {
        canon_version: lastIngestion.canon_version || "unknown",
        payload_sha256_8: lastIngestion.payload_sha256_8 || "unknown",
        envelope_id: lastIngestion.envelope_id || null,
        sig_owner: lastIngestion.sig_owner || null,
        sig_verdict: lastIngestion.sig_verdict || null,
      }
    : cursor && cursor.last_envelope_id
    ? {
        canon_version: cursor.last_canon_version || "unknown",
        payload_sha256_8: null,
        envelope_id: cursor.last_envelope_id,
        sig_owner: null,
        sig_verdict: null,
      }
    : null;

  // Drift-repair flag is informative; surface if the cursor had to be
  // patched. Operator should know about it, but it's not an error.
  if (cursor && cursor._drift_repair) {
    anomalies.push(
      `cursor drift-repair recorded at ${cursor._drift_repair.at} (` +
        `${cursor._drift_repair.from_canon_version || "?"}` +
        `→${cursor._drift_repair.to_canon_version || "?"})`
    );
  }

  // --- canon-load.log -----------------------------------------------------
  const logLines = readLines(LOG_PATH);
  const logCounts = {
    ingested: 0,
    ack_sent: 0,
    ack_failed: 0,
    noop: 0,
    signer_loaded: 0,
    signer_unavailable: 0,
    crashed: 0,
    other: 0,
  };
  const noopReasons = {};
  const ackFailedDetails = {};
  for (const line of logLines) {
    const parsed = parseLogLine(line);
    if (!parsed) continue;
    if (!withinWindow(parsed.ts, sinceMs)) continue;
    if (parsed.event in logCounts) {
      logCounts[parsed.event]++;
    } else {
      logCounts.other++;
    }
    if (parsed.event === "noop") {
      // canon-load emits noop with the reason as the first bare arg, e.g.
      //   "noop no_canon_envelope session=…" — the parser stuffed
      //   "session" into fields, so we extract the reason from the raw
      //   tail. Best-effort bucket: no_canon, empty_inbox, ttl_expired, etc.
      const raw = line.split("] noop ")[1] || "";
      const reasonTok = raw.trim().split(/\s+/)[0] || "unknown";
      // Strip any trailing key=value that snuck into reasonTok.
      const reason = reasonTok.includes("=") ? "unknown" : reasonTok;
      noopReasons[reason] = (noopReasons[reason] || 0) + 1;
    }
    if (parsed.event === "ack_failed") {
      const detail = (parsed.fields.detail || "unknown").slice(0, 40);
      ackFailedDetails[detail] = (ackFailedDetails[detail] || 0) + 1;
    }
  }

  // --- inbox.ndjson — CANON_LOADED_ACK ------------------------------------
  const inboxLines = readLines(INBOX_PATH);
  const ackEnvelopes = [];
  for (const line of inboxLines) {
    const row = parseSafe(line);
    if (!row) continue;
    if (row.type !== "CANON_LOADED_ACK") continue;
    const ts = row.ts || row.received_at;
    if (!withinWindow(ts, sinceMs)) continue;
    ackEnvelopes.push(row);
  }

  let acksSigned = 0;
  let acksUnsigned = 0;
  for (const ack of ackEnvelopes) {
    const verdict = ack?._sig_check?.verdict;
    // Signed = ack carried a body.signed_envelope verified at receipt.
    // We rely on the receiver's _sig_check verdict (VERIFIED / UNSIGNED /
    // REJECTED). REJECTED counts as unsigned-bad — surface as anomaly.
    if (verdict === "VERIFIED") acksSigned++;
    else acksUnsigned++;
    if (verdict === "REJECTED") {
      anomalies.push(`ack envelope ${ack.id} verdict=REJECTED`);
    }
  }

  // --- gnn-live-edges.ndjson — canon_loaded_at_session_start --------------
  const gnnTail = tailLines(GNN_EDGES_PATH, GNN_TAIL_LINES);
  let gnnEdgeCount = 0;
  let gnnVerified = 0;
  let gnnUnsigned = 0;
  for (const line of gnnTail) {
    const row = parseSafe(line);
    if (!row) continue;
    if (row.verb !== "canon_loaded_at_session_start") continue;
    if (!withinWindow(row.ts, sinceMs)) continue;
    gnnEdgeCount++;
    if (row.sig_verdict === "VERIFIED") gnnVerified++;
    else gnnUnsigned++;
  }

  // --- cross-source consistency anomalies ---------------------------------
  // Each ingested session in the window should produce: 1 ingested log
  // line, 1 ack envelope (or 1 ack_failed), 1 gnn edge. Material mismatches
  // are surfaced (not absolute counts; cursor entries with ingested_at
  // outside window won't have log lines and that's expected).
  if (recentIngestions.length > 0 && logCounts.ingested === 0) {
    anomalies.push(
      `${recentIngestions.length} cursor ingestions but 0 log "ingested" events in window`
    );
  }
  if (logCounts.ingested > 0 && gnnEdgeCount === 0) {
    anomalies.push(
      `${logCounts.ingested} log ingestions but 0 GNN edges in window (canon-to-gnn-edges may be stalled)`
    );
  }
  if (logCounts.ack_failed > 0) {
    const detailStr = Object.entries(ackFailedDetails)
      .map(([k, v]) => `${k} x${v}`)
      .join(", ");
    anomalies.push(`${logCounts.ack_failed} ack_failed events: ${detailStr}`);
  }
  if (logCounts.crashed > 0) {
    anomalies.push(`${logCounts.crashed} crashed events in canon-load.log`);
  }
  if (logCounts.signer_unavailable > 0 && logCounts.signer_loaded === 0) {
    anomalies.push(
      `signer never loaded in window — all acks would be UNSIGNED`
    );
  }

  return {
    window: {
      days,
      since: sinceIso,
      now: new Date(nowMs).toISOString(),
    },
    sessions_ingested: recentIngestions.length,
    log_events: {
      ingested: logCounts.ingested,
      ack_sent: logCounts.ack_sent,
      ack_failed: logCounts.ack_failed,
      noop: logCounts.noop,
      signer_loaded: logCounts.signer_loaded,
      signer_unavailable: logCounts.signer_unavailable,
      crashed: logCounts.crashed,
      other: logCounts.other,
    },
    noop_reasons: noopReasons,
    ack_failed_details: ackFailedDetails,
    acks: {
      total: ackEnvelopes.length,
      signed: acksSigned,
      unsigned: acksUnsigned,
    },
    gnn_edges: {
      total: gnnEdgeCount,
      verified: gnnVerified,
      unsigned: gnnUnsigned,
    },
    current_canon: currentCanon,
    last_ingestion_at: lastIngestion ? lastIngestion.ingested_at : null,
    anomalies,
  };
}

function pad(label, width) {
  if (label.length >= width) return label;
  return label + " ".repeat(width - label.length);
}

function renderText(r) {
  const lines = [];
  const w = 26; // label width — keeps the colon-aligned look from the spec
  lines.push(`Session-Start Health (last ${r.window.days} days)`);
  lines.push("─".repeat(33));
  lines.push(`${pad("Sessions ingested:", w)}${r.sessions_ingested}`);
  lines.push(
    `${pad("Acks sent:", w)}${r.log_events.ack_sent} (signed: ${r.acks.signed})`
  );
  lines.push(`${pad("Acks failed:", w)}${r.log_events.ack_failed}`);
  const noCanon = r.noop_reasons.no_canon_envelope || 0;
  const emptyInbox = r.noop_reasons.empty_inbox || 0;
  lines.push(
    `${pad("Noops:", w)}${r.log_events.noop} (no_canon: ${noCanon}, empty_inbox: ${emptyInbox})`
  );
  lines.push(`${pad("GNN edges emitted:", w)}${r.gnn_edges.total}`);
  if (r.current_canon) {
    const cv = r.current_canon.canon_version || "?";
    const sha = r.current_canon.payload_sha256_8 || "?";
    const owner = r.current_canon.sig_owner || "null";
    lines.push(
      `${pad("Current canon:", w)}${cv} sha8=${sha} owner=${owner}`
    );
  } else {
    lines.push(`${pad("Current canon:", w)}<none>`);
  }
  lines.push(
    `${pad("Last ingestion:", w)}${r.last_ingestion_at || "<none>"}`
  );
  if (r.anomalies.length === 0) {
    lines.push(`${pad("Anomalies:", w)}none`);
  } else {
    lines.push(`${pad("Anomalies:", w)}${r.anomalies[0]}`);
    for (let i = 1; i < r.anomalies.length; i++) {
      lines.push(`${" ".repeat(w)}${r.anomalies[i]}`);
    }
  }
  return lines.join("\n") + "\n";
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const report = buildReport(args.days);
  if (args.json) {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  } else {
    process.stdout.write(renderText(report));
  }
  process.exit(0);
}

main();
