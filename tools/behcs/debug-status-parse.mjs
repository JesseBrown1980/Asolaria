#!/usr/bin/env node
import fs from "node:fs";
import { defaultTransport } from "../../../Asolaria-BEHCS-256/packages/vision-keyboard-supervisor/src/supervisor.ts";
import { combineGroundTruth } from "../../../Asolaria-BEHCS-256/packages/vision-keyboard-supervisor/src/foreground-ground-truth.ts";

const TOKENS_PATH = "C:/Users/rayss/Asolaria/data/vault/owner/agent-keyboard/peer-tokens.json";
const tokens = JSON.parse(fs.readFileSync(TOKENS_PATH, "utf-8"));
const acer = tokens.peers.acer;

const status = await defaultTransport.getStatus(acer.endpoint, acer.token, 10000);
const windows = await defaultTransport.getWindows(acer.endpoint, acer.token, 10000);

console.log("[status parsed by supervisor]", JSON.stringify(status, null, 2));
console.log("[windows parsed by supervisor]", JSON.stringify(windows, null, 2).slice(0, 1200));

const gt = combineGroundTruth({
  intended_target_substring: "Initial session setup",
  status,
  windows,
  intended_target_window_id: acer.claude_code_win_id,
});

console.log("[ground-truth]", JSON.stringify(gt, null, 2));
