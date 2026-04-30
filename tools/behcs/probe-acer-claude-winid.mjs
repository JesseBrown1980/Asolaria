#!/usr/bin/env node
import fs from "node:fs";
import { typeToPeerSupervised } from "../../../Asolaria-BEHCS-256/packages/vision-keyboard-supervisor/src/supervisor.ts";

const TOKENS_PATH = "C:/Users/rayss/Asolaria/data/vault/owner/agent-keyboard/peer-tokens.json";
const tokens = JSON.parse(fs.readFileSync(TOKENS_PATH, "utf-8"));
const acer = tokens.peers.acer;

const probe = `[LIRIS-PROBE-${Date.now()}] win_id=${acer.claude_code_win_id} pid=${acer.claude_code_win_pid} title="${acer.claude_code_win_title}" — if you see this, reply LANDED with your foreground title; if not, fallback win_id=14688.`;

console.log(`[probe] dispatching ${probe.length}-char probe to win_id=${acer.claude_code_win_id} ("${acer.claude_code_win_title}")`);

const result = await typeToPeerSupervised({
  peer: acer.endpoint,
  peer_token: acer.token,
  text: probe,
  press_enter: true,
  intended_target_substring: acer.claude_code_win_substring ?? "Initial session setup",
  window_id: acer.claude_code_win_id,
  window_title: acer.claude_code_win_title,
  overlay_risk_tolerance: "medium",
  expected_top_titles: ["Initial session setup", "Asolaria Colony", "Claude"],
  timeout_ms: 15000,
  correlation_id: `probe-acer-winid-${Date.now()}`,
});

console.log(JSON.stringify({
  outcome: result.outcome,
  guard_ok: result.guard.ok,
  guard_halt: result.guard.halt_reason,
  type_status: result.type_result?.status,
  type_ok: result.type_result?.ok,
  type_body: result.type_result?.body,
  ms: result.ms,
  escalation: result.escalation,
}, null, 2));

if (result.outcome !== "typed-verified" && result.outcome !== "typed-post-mismatch") {
  process.exit(2);
}
