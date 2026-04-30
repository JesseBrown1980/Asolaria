#!/usr/bin/env node
import fs from "node:fs";
import { defaultTransport } from "../../../Asolaria-BEHCS-256/packages/vision-keyboard-supervisor/src/supervisor.ts";

const TOKENS_PATH = "C:/Users/rayss/Asolaria/data/vault/owner/agent-keyboard/peer-tokens.json";
const tokens = JSON.parse(fs.readFileSync(TOKENS_PATH, "utf-8"));
const acer = tokens.peers.acer;

console.log(`[refresh] querying ${acer.endpoint}/windows`);

const status = await defaultTransport.getStatus(acer.endpoint, acer.token, 10000);
const windows = await defaultTransport.getWindows(acer.endpoint, acer.token, 10000);

console.log("[status]", JSON.stringify(status, null, 2).slice(0, 800));
console.log("[windows]", JSON.stringify(windows, null, 2).slice(0, 4000));

if (!windows.ok || !Array.isArray(windows.windows)) {
  console.error("[refresh] /windows unreachable or absent");
  process.exit(2);
}

const candidates = windows.windows.filter((w) => {
  const title = String(w.title ?? w.window_title ?? "");
  return /claude/i.test(title);
});

console.log(`[refresh] claude-matching windows: ${candidates.length}`);
for (const c of candidates) console.log("  -", JSON.stringify(c));

if (candidates.length === 0) {
  console.error("[refresh] no claude window found in foreground list — focus acer Claude then retry");
  process.exit(3);
}

const pick = candidates[0];
const newId = pick.id ?? pick.window_id ?? pick.hwnd;
const newTitle = pick.title ?? pick.window_title;

if (!newId) {
  console.error("[refresh] candidate has no id field:", pick);
  process.exit(4);
}

const oldId = tokens.peers.acer.claude_code_win_id;
tokens.peers.acer.claude_code_win_id = newId;
tokens.peers.acer.claude_code_win_title = newTitle;
tokens.peers.acer.updated_at = new Date().toISOString();
tokens.peers.acer.win_id_refreshed_at = new Date().toISOString();
tokens.peers.acer.win_id_prior = oldId;

fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2) + "\n");
console.log(`[refresh] win_id ${oldId} -> ${newId} ("${newTitle}") written`);
