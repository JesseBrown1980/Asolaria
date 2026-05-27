#!/usr/bin/env node
// log-permission-request.mjs — Asolaria hookwall PermissionRequest audit hook.
//
// Triggered by Claude Code PermissionRequest hook (cascade C10 surfaced this as
// a top-3 unregistered hook). Reads the hook JSON from stdin and appends one
// structured NDJSON line to logs/permission-requests.ndjson with:
//   ts, session_id, tool_name, permission_type, requested_input_summary
//
// This hook is INFORMATIONAL ONLY. It never returns a decision — Claude Code's
// own prompt UI handles user approval. We emit a bare hookEventName ack so the
// harness sees a well-formed response, but we do NOT set behavior/decision.
//
// Failure modes are all stderr-log + exit 0; never fail-stop a permission
// prompt. If logging breaks, the operator still gets the prompt.
//
// Schema reference (Claude Code leaked source, src/utils/hooks.ts:4174-4180):
//   {
//     hook_event_name: 'PermissionRequest',
//     tool_name: string,
//     tool_input: Record<string, unknown>,
//     permission_suggestions?: PermissionUpdate[],
//     // base fields:
//     session_id, cwd, transcript_path, permission_mode
//   }

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const LOG_FILE = path.join(ROOT, "logs", "permission-requests.ndjson");
const SUMMARY_MAX = 200;

function readStdinJson() {
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
    setTimeout(finish, 250);
  });
}

// Truncate a JSON-stringified summary of tool_input to SUMMARY_MAX chars.
// Preserves a trailing ellipsis marker so downstream readers can tell the
// payload was clipped. Non-stringifiable inputs degrade to "[unstringifiable]".
function summarizeInput(toolInput) {
  if (toolInput === undefined || toolInput === null) return "";
  let s;
  try {
    s = typeof toolInput === "string" ? toolInput : JSON.stringify(toolInput);
  } catch {
    return "[unstringifiable]";
  }
  if (s.length <= SUMMARY_MAX) return s;
  return s.slice(0, SUMMARY_MAX - 3) + "...";
}

// Derive a permission_type label. Prefer explicit fields when present; fall
// back to permission_mode. We surface suggestions[0].behavior when the harness
// already has a recommended behavior (allow/deny/ask) so the audit line
// captures intent without us having to reconstruct it.
function derivePermissionType(stdin) {
  if (typeof stdin.permission_type === "string") return stdin.permission_type;
  const sugg = stdin.permission_suggestions;
  if (Array.isArray(sugg) && sugg.length > 0) {
    const first = sugg[0];
    if (first && typeof first.behavior === "string") return first.behavior;
    if (first && typeof first.type === "string") return first.type;
  }
  if (typeof stdin.permission_mode === "string") return stdin.permission_mode;
  return "unknown";
}

(async () => {
  const stdin = await readStdinJson();

  const entry = {
    ts: new Date().toISOString(),
    session_id: stdin.session_id || null,
    tool_name: stdin.tool_name || null,
    permission_type: derivePermissionType(stdin),
    requested_input_summary: summarizeInput(stdin.tool_input),
  };

  try {
    fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
    fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + "\n", "utf8");
  } catch (e) {
    process.stderr.write(
      `log-permission-request: append_failed ${e.message || e}\n`
    );
  }

  // Informational hook — emit bare ack, do NOT set decision/behavior.
  // Claude Code's own prompt UI handles user approval.
  process.stdout.write(
    JSON.stringify({ hookEventName: "PermissionRequest" }) + "\n"
  );
  process.exit(0);
})().catch((e) => {
  process.stderr.write(
    `log-permission-request: crashed ${e.message || String(e)}\n`
  );
  process.stdout.write(
    JSON.stringify({ hookEventName: "PermissionRequest" }) + "\n"
  );
  process.exit(0);
});
