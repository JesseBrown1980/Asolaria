#!/usr/bin/env node
// T1 acceptance test harness for the canon-dispatch loop on acer.
//
// Verifies the bilateral canon-load cycle end-to-end:
//   A) Inject a synthetic FIRST_MESSAGE_CANON envelope via :4947/behcs/send
//   B) Run the canon-load-on-session-start hook with simulated SessionStart stdin
//   C) Assert hook stdout has hookEventName=SessionStart and the matching
//      initialUserMessage payload
//   D) Poll the bus inbox for the EVT-CANON-LOADED-ACK round-trip
//   E) Cleanup is a no-op (live inbox archival owns retention)
//
// Uniqueness invariants:
//   - canon_version="test-T1" so it can never collide with live FIRST_MESSAGE_CANON v1
//     (the hook's W2-2 drift guard skips /^(test|dev|staging|temp|tmp)[-_]/i in prod)
//   - payload="TEST-T1-PAYLOAD-<random>" — small (<200 bytes) so the size guard
//     also flags it as test
//   - test_mode=true on the envelope is informational metadata (downstream
//     filters can also key on it); the *acceptance* gate is CANON_LOAD_ALLOW_TEST=1
//     in the spawned hook env
//   - Without the env var the hook drops the envelope; that's what stops
//     production cascades from getting polluted
//   - The hook prefers newest by ts so the test envelope wins selection
//
// Exit 0 = full pass; exit 1 = first failure with diagnostic.
//
// USAGE
//   node tools/behcs/test-canon-load.mjs

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HOOK_PATH = path.join(__dirname, "canon-load-on-session-start.mjs");

const BUS_BASE = "http://127.0.0.1:4947";
const SEND_URL = `${BUS_BASE}/behcs/send`;
const INBOX_URL = `${BUS_BASE}/behcs/inbox`;

const ACK_POLL_INTERVAL_MS = 250;
const ACK_POLL_TIMEOUT_MS = 8000;

function nowIso() {
  return new Date().toISOString();
}

function sha256Hex(s) {
  return crypto.createHash("sha256").update(s, "utf8").digest("hex");
}

function fail(step, detail, extra = {}) {
  console.error(`[T1 FAIL] step=${step} detail=${detail}`);
  for (const [k, v] of Object.entries(extra)) {
    const s = typeof v === "string" ? v : JSON.stringify(v);
    console.error(`  ${k}: ${s.length > 800 ? s.slice(0, 800) + "...[truncated]" : s}`);
  }
  process.exit(1);
}

function pass(step, detail) {
  console.log(`[T1 PASS] step=${step} ${detail}`);
}

function info(step, detail) {
  console.log(`[T1 INFO] step=${step} ${detail}`);
}

async function postCanon({ envelopeId, sessionTag, payload, payloadSha256, ts }) {
  const env = {
    id: envelopeId,
    ts,
    from: "liris",
    to: "acer",
    mode: "real",
    type: "FIRST_MESSAGE_CANON",
    verb: "CANON-DISPATCH",
    canon_version: "test-T1",
    payload,
    payload_sha256: payloadSha256,
    session_tag: sessionTag,
    // Informational metadata. The hook's actual acceptance gate is the env
    // var CANON_LOAD_ALLOW_TEST=1 (set in runHook below). Carrying test_mode
    // here keeps downstream consumers able to filter on the flag.
    test_mode: true,
    cube: {
      D1_ACTOR: "liris",
      D3_TARGET: "acer",
      D7_STATE: "dispatch",
      D20_TIME: ts,
      D26_OMNIDIRECTIONAL: "bilateral",
      D34_CROSS_COLONY: "cross_host_lan",
      D38_ENCRYPTION: "plaintext",
    },
  };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const res = await fetch(SEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(env),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    const bodyText = await res.text();
    let bodyJson = null;
    try {
      bodyJson = JSON.parse(bodyText);
    } catch {
      // ignore parse error; not all errors are JSON
    }
    return { ok: res.ok, status: res.status, body: bodyJson, raw: bodyText, env };
  } catch (e) {
    clearTimeout(timer);
    return { ok: false, status: 0, body: null, raw: "", error: e.message || String(e), env };
  }
}

function runHook(stdinJson) {
  return new Promise((resolve) => {
    // CANON_LOAD_ALLOW_TEST=1 is the test-only opt-in. Without it (the
    // production case) the hook's W2-2 drift guard rejects this synthetic
    // envelope on canon_version=/^test/ and payload<200 bytes.
    const child = spawn(process.execPath, [HOOK_PATH], {
      cwd: ROOT,
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, CANON_LOAD_ALLOW_TEST: "1" },
    });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      try {
        child.kill();
      } catch {
        // best effort
      }
    }, 10000);
    child.stdout.on("data", (c) => (stdout += c.toString("utf8")));
    child.stderr.on("data", (c) => (stderr += c.toString("utf8")));
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr, timedOut });
    });
    child.stdin.write(JSON.stringify(stdinJson));
    child.stdin.end();
  });
}

async function pollForAck({ sessionId, deadlineMs }) {
  const url = new URL(INBOX_URL);
  url.searchParams.set("target", "liris");
  url.searchParams.set("verb", "EVT-CANON-LOADED-ACK");
  url.searchParams.set("limit", "10");
  let lastError = null;
  let attempts = 0;
  while (Date.now() < deadlineMs) {
    attempts += 1;
    try {
      const res = await fetch(url.toString());
      if (res.ok) {
        const body = await res.json();
        const messages = Array.isArray(body.messages) ? body.messages : [];
        // Newest-first preferable, but server returns ascending. Walk both ways.
        for (let i = messages.length - 1; i >= 0; i--) {
          const m = messages[i];
          if (m && m.payload && m.payload.session_id === sessionId) {
            return { found: true, ack: m, attempts, totalReturned: messages.length };
          }
        }
        lastError = {
          reason: "no_match_yet",
          totalReturned: messages.length,
          sample: messages.slice(-3).map((m) => ({
            id: m && m.id,
            session_id: m && m.payload && m.payload.session_id,
          })),
        };
      } else {
        lastError = { reason: `http_${res.status}` };
      }
    } catch (e) {
      lastError = { reason: e.message || String(e) };
    }
    await new Promise((r) => setTimeout(r, ACK_POLL_INTERVAL_MS));
  }
  return { found: false, attempts, lastError };
}

(async () => {
  const startedAt = nowIso();
  const random = crypto.randomBytes(6).toString("hex");
  const ts = nowIso();
  const sessionId = `test-T1-${Date.now()}`;
  const envelopeId = `test-T1-env-${Date.now()}-${random}`;
  const payload = `TEST-T1-PAYLOAD-${random}`;
  const payloadSha256 = sha256Hex(payload);

  info(
    "INIT",
    `started_at=${startedAt} session_id=${sessionId} envelope_id=${envelopeId} sha8=${payloadSha256.slice(0, 8)}`
  );

  // Step A: POST synthetic canon envelope
  const sendRes = await postCanon({
    envelopeId,
    sessionTag: sessionId,
    payload,
    payloadSha256,
    ts,
  });
  if (!sendRes.ok) {
    fail("A_POST_CANON", `bus rejected envelope status=${sendRes.status}`, {
      raw: sendRes.raw,
      error: sendRes.error || null,
    });
  }
  if (!sendRes.body || sendRes.body.ok !== true) {
    fail("A_POST_CANON", "bus returned non-ok body", { body: sendRes.body });
  }
  pass(
    "A_POST_CANON",
    `received_id=${sendRes.body.received} sig_verdict=${sendRes.body.sig_verdict || "n/a"}`
  );

  // Step B: invoke canon-load hook
  const hookStdin = { session_id: sessionId, source: "startup" };
  const hookRes = await runHook(hookStdin);
  if (hookRes.timedOut) {
    fail("B_RUN_HOOK", "hook timed out after 10s", {
      stdout: hookRes.stdout,
      stderr: hookRes.stderr,
    });
  }
  if (hookRes.code !== 0) {
    fail("B_RUN_HOOK", `hook exited code=${hookRes.code}`, {
      stdout: hookRes.stdout,
      stderr: hookRes.stderr,
    });
  }
  pass("B_RUN_HOOK", `exit=0 stdout_bytes=${hookRes.stdout.length}`);

  // Step C: parse stdout JSON and assert
  const stdoutTrim = hookRes.stdout.trim();
  if (!stdoutTrim) {
    fail("C_PARSE_STDOUT", "hook produced empty stdout", { stderr: hookRes.stderr });
  }
  // The hook writes a single JSON object then \n; pick the first line.
  const firstLine = stdoutTrim.split(/\r?\n/)[0];
  let hookOut;
  try {
    hookOut = JSON.parse(firstLine);
  } catch (e) {
    fail("C_PARSE_STDOUT", `stdout is not valid JSON: ${e.message}`, {
      firstLine,
      fullStdout: hookRes.stdout,
    });
  }
  if (hookOut.hookEventName !== "SessionStart") {
    fail(
      "C_ASSERT_HOOK_EVENT",
      `hookEventName mismatch expected=SessionStart actual=${hookOut.hookEventName}`,
      { hookOut }
    );
  }
  if (hookOut.initialUserMessage !== payload) {
    fail(
      "C_ASSERT_PAYLOAD",
      "initialUserMessage did not match injected payload",
      {
        expected: payload,
        actual:
          typeof hookOut.initialUserMessage === "string"
            ? hookOut.initialUserMessage.slice(0, 200)
            : hookOut.initialUserMessage,
        stderr: hookRes.stderr,
      }
    );
  }
  pass(
    "C_ASSERT_HOOK_OUTPUT",
    `hookEventName=SessionStart initialUserMessage=${payload}`
  );

  // Step D: poll bus for EVT-CANON-LOADED-ACK
  const deadline = Date.now() + ACK_POLL_TIMEOUT_MS;
  const ackRes = await pollForAck({ sessionId, deadlineMs: deadline });
  if (!ackRes.found) {
    fail(
      "D_POLL_ACK",
      `no ack with session_id=${sessionId} within ${ACK_POLL_TIMEOUT_MS}ms`,
      {
        attempts: ackRes.attempts,
        lastError: ackRes.lastError,
      }
    );
  }
  const ack = ackRes.ack;
  // Spot-check ack shape so a future regression in payload schema fails loudly.
  if (ack.verb !== "EVT-CANON-LOADED-ACK") {
    fail("D_ASSERT_ACK_VERB", `ack verb mismatch actual=${ack.verb}`, { ack });
  }
  if (ack.payload.canon_version !== "test-T1") {
    fail(
      "D_ASSERT_ACK_CANON_VERSION",
      `ack canon_version mismatch actual=${ack.payload.canon_version}`,
      { ack }
    );
  }
  if (ack.payload.payload_sha256 !== payloadSha256) {
    fail(
      "D_ASSERT_ACK_SHA",
      `ack payload_sha256 mismatch actual=${ack.payload.payload_sha256}`,
      { ack }
    );
  }
  pass(
    "D_POLL_ACK",
    `attempts=${ackRes.attempts} ack_id=${ack.id} canon_envelope_id=${ack.payload.canon_envelope_id} sig_verdict=${ack.payload.sig_verdict}`
  );

  // Step E: cleanup is intentionally a no-op. Live inbox archival owns
  // retention; deleting envelopes here would race the bus's own writers.
  info("E_CLEANUP", "no-op (inbox retention via natural archival)");

  // Final report
  console.log("");
  console.log("=== T1 CANON-DISPATCH LOOP ACCEPTANCE — PASS ===");
  console.log(`  session_id            : ${sessionId}`);
  console.log(`  canon envelope id     : ${envelopeId}`);
  console.log(`  payload sha256 (8)    : ${payloadSha256.slice(0, 8)}`);
  console.log(`  ack envelope id       : ${ack.id}`);
  console.log(`  ack received_at       : ${ack.received_at || "n/a"}`);
  console.log(`  total wall time (ms)  : ${Date.now() - Date.parse(startedAt)}`);
  process.exit(0);
})().catch((e) => {
  fail("HARNESS_CRASH", e.message || String(e), { stack: (e && e.stack) || null });
});
