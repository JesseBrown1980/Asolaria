#!/usr/bin/env node
// WO-CASE-B — FIRST_MESSAGE_CANON SessionStart loader (acer-side).
//
// Triggered by Claude Code SessionStart hook. Drains the latest verified
// FIRST_MESSAGE_CANON envelope from data/behcs/inbox.ndjson and emits it as
// initialUserMessage so the new session sees the canon as if Jesse had just
// pasted it. Operator never re-pastes.
//
// Pairs with WO-L4-SIGN: prefers _sig_check.verdict=VERIFIED, accepts UNSIGNED,
// skips REJECTED.
//
// Stdout protocol per Claude Code hooks (src/types/hooks.ts:83-88):
//   { "hookEventName": "SessionStart", "initialUserMessage": "<preamble>" }
//
// Failure modes are all stderr-log + exit 0; never fail-stop a session boot.
// This hook is informational at the session start; if something is wrong
// the operator can still type the canon manually.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import {
  ACER_KEY_ID,
  loadAcerSigner as loadAcerSignerShared,
  signPayload as signPayloadShared,
} from "./acer-signer.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const INBOX = path.join(ROOT, "data", "behcs", "inbox.ndjson");
const OUTBOX = path.join(ROOT, "data", "behcs", "outbox.ndjson");
const CURSOR = path.join(ROOT, "data", "behcs", "state", "canon-cursor.json");
const AUDIT_LOG = path.join(ROOT, "logs", "canon-load.log");

const SCAN_TAIL_LINES = 200;
const ACCEPT_VERDICTS = new Set(["VERIFIED", "UNSIGNED"]);

// W2-2 drift guard: synthetic test envelopes (T1 harness etc.) MUST NOT pollute
// production canon. We skip on TWO heuristics:
//   1. canon_version matches /^(test|dev|staging|temp|tmp)[-_]/i (non-prod prefix)
//   2. payload length is suspiciously small (<200 bytes — real canon ~4700 bytes)
// EITHER condition triggers skip. The test harness opt-in is a single env var:
// CANON_LOAD_ALLOW_TEST=1 in the spawned hook process. Production hook runs
// never set it, so synthetic envelopes are dropped before they touch state.
const TEST_CANON_VERSION_RE = /^(test|dev|staging|temp|tmp)[-_]/i;
const REAL_CANON_MIN_BYTES = 200;
const ALLOW_TEST_CANON = process.env.CANON_LOAD_ALLOW_TEST === "1";

// ACK signing — dev-acer-4abb0a9c. Raw-seed private key files are searched in
// vault first (Asolaria-local), then asolaria-acer kernel (legacy). Registry
// pubkey must agree with derived pubkey or we fall back to UNSIGNED ack.
// Implementation lives in tools/behcs/acer-signer.mjs (shared with
// dispatch-canon.mjs) so the two cannot drift on key handling.

// TTL: default 7 days. Envelope can override via `canon_ttl_seconds`.
const DEFAULT_CANON_TTL_SECONDS = 7 * 24 * 3600;

// Cursor pruning: drop entries older than 30 days, but always keep the last
// 500 (whichever set is larger wins, same as before but with age filter).
const CURSOR_MAX_AGE_DAYS = 30;
const CURSOR_MIN_KEEP = 500;

// EVT-CANON-LOADED-ACK destination: acer's own bus on localhost. Acer is the
// shared-mailbox hub (per feedback_orbital_routing_liris_to_falcon.md);
// liris polls /behcs/inbox?target=liris to retrieve. Localhost loopback is
// <10ms so an 800ms timeout is generous. Outbox keeps a durable record of
// what acer sent regardless of bus availability.
const ACER_BUS_URL = "http://127.0.0.1:4947/behcs/send";
const ACK_TIMEOUT_MS = 800;

function audit(...parts) {
  try {
    fs.mkdirSync(path.dirname(AUDIT_LOG), { recursive: true });
    fs.appendFileSync(
      AUDIT_LOG,
      `[${new Date().toISOString()}] ${parts.join(" ")}\n`,
      "utf8"
    );
  } catch (e) {
    process.stderr.write(`canon-load: audit_failed ${e.message}\n`);
  }
}

// C6 structured logger (additive to audit). Lazy dynamic import so the hook
// never blocks on module resolution and never throws on a missing module.
// We track in-flight slog promises so a final `await flushSlog()` before
// process.exit guarantees the lines hit disk (the hook is short-lived and
// exits before fire-and-forget fs.appendFile would otherwise complete).
let _slogModulePromise = null;
const _slogInFlight = new Set();
function slog(component, event, fields) {
  try {
    if (!_slogModulePromise) {
      _slogModulePromise = import("./structured-log.mjs").catch(() => null);
    }
    const p = _slogModulePromise
      .then((mod) => {
        if (mod && typeof mod.slog === "function") {
          return mod.slog(component, event, fields || {}).catch(() => {});
        }
      })
      .catch(() => {});
    _slogInFlight.add(p);
    p.finally(() => _slogInFlight.delete(p));
  } catch (_) {
    // never throw
  }
}
async function flushSlog() {
  try {
    if (_slogInFlight.size === 0) return;
    await Promise.all(Array.from(_slogInFlight));
  } catch (_) {
    // never throw
  }
}

// Local thin wrappers around the shared signer module so existing call sites
// (audit + signPayload) stay byte-identical without duplicating logic.
function loadAcerSigner() {
  return loadAcerSignerShared(audit);
}
const signPayload = signPayloadShared;

function emitNoop(reason) {
  audit("noop", reason);
  // C6 structured log: noop reason.
  slog("canon-load", "canon.noop", { reason: String(reason || "") });
  process.stdout.write(JSON.stringify({ hookEventName: "SessionStart" }) + "\n");
  // Best-effort flush of in-flight slog appends (≤80ms cap so we never
  // block session boot on a slow filesystem).
  flushSlog()
    .finally(() => process.exit(0));
  // Hard floor: if flushSlog is somehow stalled, force exit after 80ms.
  setTimeout(() => process.exit(0), 80).unref();
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
    setTimeout(finish, 250);
  });
}

function tailLines(filePath, maxLines) {
  if (!fs.existsSync(filePath)) return [];
  const data = fs.readFileSync(filePath, "utf8");
  const lines = data.split(/\r?\n/).filter((l) => l.trim());
  return lines.slice(-maxLines);
}

function parseSafe(line) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

function readCursor() {
  try {
    return JSON.parse(fs.readFileSync(CURSOR, "utf8"));
  } catch {
    return { sessions: [], last_envelope_id: null };
  }
}

function writeCursor(cursor) {
  try {
    fs.mkdirSync(path.dirname(CURSOR), { recursive: true });
    fs.writeFileSync(CURSOR, JSON.stringify(cursor, null, 2) + "\n", "utf8");
  } catch (e) {
    process.stderr.write(`canon-load: cursor_write_failed ${e.message}\n`);
  }
}

function appendOutbox(envelope) {
  try {
    fs.mkdirSync(path.dirname(OUTBOX), { recursive: true });
    fs.appendFileSync(OUTBOX, JSON.stringify(envelope) + "\n", "utf8");
  } catch (e) {
    process.stderr.write(`canon-load: outbox_write_failed ${e.message}\n`);
  }
}

function buildAckEnvelope({ sessionId, source, chosen, sha8, signer }) {
  const ts = new Date().toISOString();
  const payload = {
    session_id: sessionId,
    boot_source: source,
    canon_envelope_id: chosen.id,
    canon_version: chosen.canon_version || "unknown",
    payload_sha256: chosen.payload_sha256 || null,
    payload_sha256_8: sha8,
    sig_verdict: chosen?._sig_check?.verdict || "UNSIGNED",
    sig_owner: chosen?._sig_check?.owner_glyph || null,
    ingested_at: ts,
    received_canon_at: chosen.received_at || chosen.ts || null,
  };
  // Deterministic id over (session_id + canon_envelope_id) so re-runs of the
  // same session ingesting the same canon dedupe at liris-side bus.
  const id = crypto
    .createHash("sha256")
    .update(`${sessionId}\n${chosen.id}`)
    .digest("hex")
    .slice(0, 32);

  const env = {
    id,
    ts,
    from: "acer",
    to: "liris",
    mode: "real",
    type: "CANON_LOADED_ACK",
    verb: "EVT-CANON-LOADED-ACK",
    payload,
    cube: {
      D1_ACTOR: "acer",
      D3_TARGET: "liris",
      D7_STATE: "completed",
      D20_TIME: ts,
      D26_OMNIDIRECTIONAL: "bilateral",
      D34_CROSS_COLONY: "cross_host_lan",
      D38_ENCRYPTION: "plaintext",
    },
  };

  // ACK-SIGN: nest a signed_envelope under body.* matching liris's shape (the
  // bus accepts top-level OR body.<any>.{payload,signature}). The signed
  // payload is a small subset — id, routing, verb, and ack-relevant payload
  // fields — kept lean so re-validation is cheap and stable.
  if (signer) {
    const signedPayload = {
      id,
      ts,
      from: "acer",
      to: "liris",
      type: "CANON_LOADED_ACK",
      verb: "EVT-CANON-LOADED-ACK",
      session_id: sessionId,
      canon_envelope_id: chosen.id,
      canon_version: chosen.canon_version || "unknown",
      payload_sha256: chosen.payload_sha256 || null,
    };
    env.body = { signed_envelope: signPayload(signer, signedPayload) };
    env.sig_owner = ACER_KEY_ID;
  }

  return env;
}

async function sendAck(envelope) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ACK_TIMEOUT_MS);
  try {
    const res = await fetch(ACER_BUS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(envelope),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      return { ok: false, detail: `http_${res.status}` };
    }
    const body = await res.text();
    return { ok: true, detail: body.slice(0, 100) };
  } catch (e) {
    clearTimeout(timer);
    if (e.name === "AbortError") return { ok: false, detail: "timeout" };
    return { ok: false, detail: (e.message || String(e)).slice(0, 120) };
  }
}

(async () => {
  const stdin = await readStdinJson();
  const sessionId =
    stdin.session_id ||
    process.env.CLAUDE_SESSION_ID ||
    `${process.env.COMPUTERNAME || "acer"}-${Date.now()}`;
  const source = stdin.source || "startup";

  if (!fs.existsSync(INBOX)) emitNoop(`no_inbox session=${sessionId}`);

  const lines = tailLines(INBOX, SCAN_TAIL_LINES);
  if (lines.length === 0) emitNoop(`empty_inbox session=${sessionId}`);

  // Gather candidate canon envelopes (newest-first).
  const candidates = [];
  for (let i = lines.length - 1; i >= 0; i--) {
    const row = parseSafe(lines[i]);
    if (!row) continue;
    if (row.type !== "FIRST_MESSAGE_CANON") continue;
    if (row.to !== "acer") continue;
    candidates.push(row);
  }
  if (candidates.length === 0)
    emitNoop(`no_canon_envelope session=${sessionId}`);

  // Sort descending by ts so newest wins; stable on tie via received_at.
  candidates.sort((a, b) => {
    const aTs = a.ts || a.received_at || "";
    const bTs = b.ts || b.received_at || "";
    return bTs.localeCompare(aTs);
  });

  // Track ids that have been superseded (id appears as `supersedes` field on
  // a newer envelope). Skip those even if otherwise valid.
  const supersededIds = new Set();
  for (const c of candidates) {
    if (c && typeof c.supersedes === "string") supersededIds.add(c.supersedes);
    if (Array.isArray(c?.supersedes))
      for (const s of c.supersedes) supersededIds.add(s);
  }

  const nowMs = Date.now();
  // Validate one candidate; returns { ok, reason? }.
  function validate(cand) {
    if (supersededIds.has(cand.id)) return { ok: false, reason: "superseded" };
    const verdict = cand?._sig_check?.verdict || "UNSIGNED";
    if (!ACCEPT_VERDICTS.has(verdict))
      return { ok: false, reason: `verdict=${verdict}` };
    if (typeof cand.payload !== "string" || cand.payload.length === 0)
      return { ok: false, reason: "empty_or_non_string_payload" };
    // Test-canon drift guard. Either heuristic flags the envelope as a test
    // canon. The single opt-in is CANON_LOAD_ALLOW_TEST=1 in the hook process
    // env (set by tools/behcs/test-canon-load.mjs when invoking the hook).
    // Production runs never set the env var, so synthetic envelopes are
    // dropped before they can advance the cursor or fire an ack.
    const looksTestVersion =
      typeof cand.canon_version === "string" &&
      TEST_CANON_VERSION_RE.test(cand.canon_version);
    const looksTestSize = cand.payload.length < REAL_CANON_MIN_BYTES;
    if (looksTestVersion || looksTestSize) {
      if (!ALLOW_TEST_CANON) {
        return {
          ok: false,
          reason: `skipped=test_canon canon_version=${cand.canon_version || "unknown"} bytes=${cand.payload.length} version_flag=${looksTestVersion} size_flag=${looksTestSize}`,
        };
      }
    }
    if (cand.payload_sha256) {
      const actual = crypto
        .createHash("sha256")
        .update(cand.payload, "utf8")
        .digest("hex");
      if (actual !== cand.payload_sha256)
        return {
          ok: false,
          reason: `sha256_mismatch expected=${cand.payload_sha256.slice(
            0,
            8
          )} actual=${actual.slice(0, 8)}`,
        };
    }
    // TTL check. Default 7 days; override via canon_ttl_seconds.
    const ttlSeconds =
      typeof cand.canon_ttl_seconds === "number" && cand.canon_ttl_seconds > 0
        ? cand.canon_ttl_seconds
        : DEFAULT_CANON_TTL_SECONDS;
    const tsRaw = cand.ts || cand.received_at;
    if (tsRaw) {
      const tsMs = Date.parse(tsRaw);
      if (!Number.isNaN(tsMs) && tsMs + ttlSeconds * 1000 < nowMs)
        return {
          ok: false,
          reason: `ttl_expired age_s=${Math.floor(
            (nowMs - tsMs) / 1000
          )} ttl_s=${ttlSeconds}`,
        };
    }
    return { ok: true };
  }

  // First pass: pick the newest valid envelope (default behavior).
  let chosen = null;
  const skipped = [];
  for (const cand of candidates) {
    const v = validate(cand);
    if (!v.ok) {
      skipped.push({ id: cand.id, reason: v.reason });
      continue;
    }
    chosen = cand;
    break;
  }

  if (!chosen) {
    audit(
      "no_acceptable_canon",
      `session=${sessionId}`,
      `skipped=${skipped.length}`,
      ...skipped.map((s) => `[${s.id}:${s.reason}]`)
    );
    emitNoop(`no_acceptable_canon skipped=${skipped.length}`);
  }

  // Multi-envelope merge: if any candidate carries an explicit `canon_kind`
  // field, gather every valid (non-superseded, fresh, sig-accepted, payload-
  // matching) candidate that ALSO has `canon_kind` and concat their payloads
  // with `\n\n--- canon_kind=<x> ---\n\n`. Stable ordering by canon_kind then
  // ts, preamble first if present. If `chosen` has no canon_kind, default
  // behavior is preserved.
  let effectivePayload = chosen.payload;
  let mergedKinds = null;
  if (chosen.canon_kind) {
    const kindCandidates = [];
    const seenKinds = new Set();
    // Reverse so older candidates that survived dedup still get represented;
    // but we dedupe by canon_kind, keeping the freshest per kind (candidates
    // are already sorted newest-first).
    for (const cand of candidates) {
      if (typeof cand.canon_kind !== "string" || !cand.canon_kind) continue;
      if (seenKinds.has(cand.canon_kind)) continue;
      const v = validate(cand);
      if (!v.ok) continue;
      seenKinds.add(cand.canon_kind);
      kindCandidates.push(cand);
    }
    if (kindCandidates.length > 1) {
      // Stable sort: preamble first, then alphabetical, addendum last.
      const order = (k) =>
        k === "preamble" ? 0 : k === "addendum" ? 2 : 1;
      kindCandidates.sort((a, b) => {
        const oa = order(a.canon_kind);
        const ob = order(b.canon_kind);
        if (oa !== ob) return oa - ob;
        return a.canon_kind.localeCompare(b.canon_kind);
      });
      effectivePayload = kindCandidates
        .map(
          (c) =>
            `--- canon_kind=${c.canon_kind} ---\n\n${c.payload}`
        )
        .join("\n\n");
      mergedKinds = kindCandidates.map((c) => c.canon_kind);
    }
  }

  // sha8 is computed from the EFFECTIVE payload that the session will see
  // (post-merge if applicable) so cursor + ack reflect what was emitted.
  const sha8 = crypto
    .createHash("sha256")
    .update(effectivePayload, "utf8")
    .digest("hex")
    .slice(0, 8);

  // Update cursor with age-based pruning + 500-min-keep floor.
  const cursor = readCursor();
  cursor.sessions = cursor.sessions || [];
  cursor.sessions.push({
    session_id: sessionId,
    source,
    envelope_id: chosen.id,
    canon_version: chosen.canon_version || "unknown",
    payload_sha256_8: sha8,
    sig_verdict: chosen?._sig_check?.verdict || "UNSIGNED",
    sig_owner: chosen?._sig_check?.owner_glyph || null,
    merged_kinds: mergedKinds,
    ingested_at: new Date().toISOString(),
  });

  // GC: drop entries older than CURSOR_MAX_AGE_DAYS, but ALWAYS keep the last
  // CURSOR_MIN_KEEP entries (most-recent floor). Floor wins on conflict.
  const cutoffMs = nowMs - CURSOR_MAX_AGE_DAYS * 24 * 3600 * 1000;
  const total = cursor.sessions.length;
  let prunedByAge = 0;
  if (total > CURSOR_MIN_KEEP) {
    // Only the prefix older than (total - CURSOR_MIN_KEEP) is eligible for
    // age-based eviction. The last CURSOR_MIN_KEEP are sticky regardless.
    const sticky = cursor.sessions.slice(-CURSOR_MIN_KEEP);
    const candidatesForGc = cursor.sessions.slice(0, -CURSOR_MIN_KEEP);
    const kept = candidatesForGc.filter((s) => {
      const t = Date.parse(s.ingested_at || "");
      if (Number.isNaN(t)) return true; // unparseable ts — keep, don't lose
      const fresh = t >= cutoffMs;
      if (!fresh) prunedByAge++;
      return fresh;
    });
    cursor.sessions = kept.concat(sticky);
  }
  cursor.last_envelope_id = chosen.id;
  cursor.last_canon_version = chosen.canon_version || "unknown";
  cursor.last_pruned_at = new Date().toISOString();
  cursor.last_pruned_count = prunedByAge;
  writeCursor(cursor);

  audit(
    "ingested",
    `session=${sessionId}`,
    `source=${source}`,
    `envelope=${chosen.id}`,
    `canon_version=${chosen.canon_version || "unknown"}`,
    `sha256_8=${sha8}`,
    `verdict=${chosen?._sig_check?.verdict || "UNSIGNED"}`,
    `owner=${chosen?._sig_check?.owner_glyph || "null"}`,
    `len=${effectivePayload.length}`,
    `merged_kinds=${mergedKinds ? mergedKinds.join(",") : "none"}`,
    `pruned_by_age=${prunedByAge}`,
    `cursor_size=${cursor.sessions.length}`
  );
  // C6 structured log: canon ingested.
  slog("canon-load", "canon.loaded", {
    session_id: sessionId,
    source,
    envelope_id: chosen.id,
    canon_version: chosen.canon_version || "unknown",
    sha256_8: sha8,
    sig_verdict: chosen?._sig_check?.verdict || "UNSIGNED",
    sig_owner: chosen?._sig_check?.owner_glyph || null,
    payload_len: effectivePayload.length,
    merged_kinds: mergedKinds || null,
    pruned_by_age: prunedByAge,
    cursor_size: cursor.sessions.length,
  });

  // Emit hook output FIRST so session boot doesn't block on the ack network
  // round-trip. initialUserMessage = canon (merged if multi-kind) → session
  // sees it as if operator just typed it.
  process.stdout.write(
    JSON.stringify({
      hookEventName: "SessionStart",
      initialUserMessage: effectivePayload,
    }) + "\n"
  );

  // Load signer for ACK signing. Falls back to UNSIGNED ack if key isn't on
  // disk or pubkey doesn't match registry — never fail-stop.
  const signer = loadAcerSigner();
  if (signer) {
    audit("signer_loaded", `key_id=${ACER_KEY_ID}`, `source=${signer.source}`);
  } else {
    audit("signer_unavailable", `key_id=${ACER_KEY_ID}`, "ack_will_be_unsigned");
  }

  // Post-stdout: send EVT-CANON-LOADED-ACK back to liris. Outbox first
  // (durable audit), then HTTP POST (best-effort, capped at ACK_TIMEOUT_MS
  // so a slow/unreachable liris doesn't extend boot beyond ~800ms).
  const ackEnv = buildAckEnvelope({
    sessionId,
    source,
    chosen,
    sha8,
    signer,
  });
  appendOutbox(ackEnv);
  const ackResult = await sendAck(ackEnv);
  audit(
    ackResult.ok ? "ack_sent" : "ack_failed",
    `session=${sessionId}`,
    `envelope=${chosen.id}`,
    `to=liris`,
    `signed=${signer ? "true" : "false"}`,
    `detail=${ackResult.detail || ""}`
  );
  // C6 structured log: ack result.
  slog("canon-load", ackResult.ok ? "canon.ack_sent" : "canon.ack_failed", {
    session_id: sessionId,
    envelope_id: chosen.id,
    ack_id: ackEnv.id,
    to: "liris",
    signed: !!signer,
    sig_owner: signer ? ACER_KEY_ID : null,
    detail: ackResult.detail || "",
  });

  // Post-ack: fire-and-forget the canon-to-gnn-edges post-processor so the
  // GNN feed picks up this just-ingested session within ~hundreds of ms,
  // not the 5-minute cron-kicker tick. Detached + unref'd so we exit
  // immediately and the child runs to completion independently. Errors are
  // swallowed by design — canon-to-gnn-edges has its own audit log.
  try {
    const { spawn } = await import("node:child_process");
    const child = spawn(
      process.execPath,
      [path.join(__dirname, "canon-to-gnn-edges.mjs")],
      { detached: true, stdio: "ignore", windowsHide: true }
    );
    child.on("error", () => {});
    child.unref();
    audit("gnn_edges_spawned", `session=${sessionId}`, `pid=${child.pid || "?"}`);
  } catch (e) {
    audit("gnn_edges_spawn_failed", (e && e.message) || String(e));
  }

  // Best-effort flush of structured-log appends before exit (hook is short-
  // lived and would otherwise lose the fire-and-forget appendFile race).
  await flushSlog();
  process.exit(0);
})().catch(async (e) => {
  audit("crashed", e.message || String(e));
  process.stdout.write(
    JSON.stringify({ hookEventName: "SessionStart" }) + "\n"
  );
  await flushSlog();
  process.exit(0);
});
