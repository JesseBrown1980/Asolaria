#!/usr/bin/env node
// PreCompact transcript snapshotter (acer-side).
//
// Triggered by Claude Code PreCompact hook. Reads stdin JSON for
// `transcript_path` (and `session_id` when present), copies the transcript
// file to data/behcs/compact-snapshots/<session_id>-<ts>.transcript.snapshot
// before Claude Code rewrites it, and prunes snapshots older than 14 days.
//
// Per Claude Code hook contract (src/types/hooks.ts), PreCompact must NEVER
// block compaction — every failure path is stderr-log + exit 0.
//
// Surfaced by cascade C10 as a top-3 unregistered hook: without this,
// Asolaria has zero observability on transcript mutation.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const SNAPSHOT_DIR = path.join(ROOT, "data", "behcs", "compact-snapshots");
const AUDIT_LOG = path.join(ROOT, "logs", "compact-snapshot.log");

// Retention: drop snapshots older than 14 days.
const RETENTION_DAYS = 14;
const RETENTION_MS = RETENTION_DAYS * 24 * 3600 * 1000;

// Stdin read timeout — hook stdin should arrive in <100ms; 250ms is generous.
const STDIN_TIMEOUT_MS = 250;

function audit(...parts) {
  try {
    fs.mkdirSync(path.dirname(AUDIT_LOG), { recursive: true });
    fs.appendFileSync(
      AUDIT_LOG,
      `[${new Date().toISOString()}] ${parts.join(" ")}\n`,
      "utf8"
    );
  } catch (e) {
    process.stderr.write(`compact-snapshot: audit_failed ${e.message}\n`);
  }
}

async function readStdinJson() {
  return new Promise((resolve) => {
    let buf = "";
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      try {
        resolve(buf ? JSON.parse(buf) : {});
      } catch {
        resolve({});
      }
    };
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => (buf += c));
    process.stdin.on("end", finish);
    process.stdin.on("error", finish);
    setTimeout(finish, STDIN_TIMEOUT_MS);
  });
}

// Filesystem-safe session id: keep alnum/dash/underscore, replace rest.
function safeSessionId(raw) {
  const s = String(raw || "unknown").slice(0, 64);
  return s.replace(/[^A-Za-z0-9_\-]/g, "_") || "unknown";
}

// Filesystem-safe ISO timestamp (no colons, dots).
function tsTag() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function pruneOldSnapshots() {
  let pruned = 0;
  let kept = 0;
  try {
    if (!fs.existsSync(SNAPSHOT_DIR)) return { pruned, kept };
    const cutoffMs = Date.now() - RETENTION_MS;
    const entries = fs.readdirSync(SNAPSHOT_DIR);
    for (const name of entries) {
      const full = path.join(SNAPSHOT_DIR, name);
      try {
        const st = fs.statSync(full);
        if (!st.isFile()) {
          kept++;
          continue;
        }
        if (st.mtimeMs < cutoffMs) {
          fs.unlinkSync(full);
          pruned++;
        } else {
          kept++;
        }
      } catch {
        // Ignore individual file errors — keep going.
      }
    }
  } catch (e) {
    audit("prune_dir_error", `err=${(e.message || e).slice(0, 120)}`);
  }
  return { pruned, kept };
}

(async () => {
  let stdin;
  try {
    stdin = await readStdinJson();
  } catch (e) {
    audit("stdin_read_failed", `err=${(e.message || e).slice(0, 120)}`);
    process.exit(0);
  }

  const transcriptPath = stdin.transcript_path || stdin.transcriptPath || null;
  const sessionId = safeSessionId(
    stdin.session_id || stdin.sessionId || process.env.CLAUDE_SESSION_ID
  );
  const trigger = stdin.trigger || stdin.compact_trigger || "unknown";

  if (!transcriptPath) {
    audit("noop_no_transcript_path", `session=${sessionId}`, `trigger=${trigger}`);
    // Still prune so a misconfigured caller doesn't keep stale snapshots.
    const r = pruneOldSnapshots();
    audit("pruned", `pruned=${r.pruned}`, `kept=${r.kept}`);
    process.exit(0);
  }

  if (!fs.existsSync(transcriptPath)) {
    audit(
      "noop_transcript_missing",
      `session=${sessionId}`,
      `path=${transcriptPath}`
    );
    const r = pruneOldSnapshots();
    audit("pruned", `pruned=${r.pruned}`, `kept=${r.kept}`);
    process.exit(0);
  }

  try {
    fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  } catch (e) {
    audit("mkdir_failed", `err=${(e.message || e).slice(0, 120)}`);
    process.exit(0);
  }

  const dest = path.join(
    SNAPSHOT_DIR,
    `${sessionId}-${tsTag()}.transcript.snapshot`
  );

  try {
    // copyFile is atomic-on-success on Windows + POSIX; size-bounded by source.
    fs.copyFileSync(transcriptPath, dest);
    let size = 0;
    try {
      size = fs.statSync(dest).size;
    } catch {
      /* size is best-effort */
    }
    audit(
      "snapshot_ok",
      `session=${sessionId}`,
      `trigger=${trigger}`,
      `src=${transcriptPath}`,
      `dest=${path.basename(dest)}`,
      `bytes=${size}`
    );
  } catch (e) {
    audit(
      "copy_failed",
      `session=${sessionId}`,
      `src=${transcriptPath}`,
      `err=${(e.message || e).slice(0, 200)}`
    );
    // Continue — never block compaction.
  }

  const r = pruneOldSnapshots();
  audit(
    "pruned",
    `session=${sessionId}`,
    `pruned=${r.pruned}`,
    `kept=${r.kept}`,
    `retention_days=${RETENTION_DAYS}`
  );

  process.exit(0);
})().catch((e) => {
  try {
    audit("crashed", (e && e.message) || String(e));
  } catch {
    /* ignore */
  }
  process.exit(0);
});
