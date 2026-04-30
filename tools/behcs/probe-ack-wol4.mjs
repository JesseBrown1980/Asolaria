#!/usr/bin/env node
import fs from "node:fs";
import { typeToPeerSupervised } from "../../../Asolaria-BEHCS-256/packages/vision-keyboard-supervisor/src/supervisor.ts";

const TOKENS_PATH = "C:/Users/rayss/Asolaria/data/vault/owner/agent-keyboard/peer-tokens.json";
const tokens = JSON.parse(fs.readFileSync(TOKENS_PATH, "utf-8"));
const acer = tokens.peers.acer;

const probe = "ACK-WO-L4-2";
const targetWinId = 394510;
const targetTitle = "Asolaria Colony";

console.log(`[probe] ${probe.length}-char to win_id=${targetWinId} ("${targetTitle}")`);

const result = await typeToPeerSupervised({
  peer: acer.endpoint,
  peer_token: acer.token,
  text: probe,
  press_enter: false,
  intended_target_substring: "Asolaria",
  window_id: targetWinId,
  window_title: targetTitle,
  overlay_risk_tolerance: "medium",
  expected_top_titles: ["Asolaria Colony", "Initial session setup", "Claude"],
  timeout_ms: 15000,
  correlation_id: `ack-wol4-${Date.now()}`,
});

console.log(JSON.stringify({
  outcome: result.outcome,
  guard_ok: result.guard.ok,
  guard_halt: result.guard.halt_reason,
  type_status: result.type_result?.status,
  type_ok: result.type_result?.ok,
  type_body: result.type_result?.body,
  ms: result.ms,
}, null, 2));
