#!/usr/bin/env node
// prime.mjs — model-agnostic operator-first-message helper.
//
// Prints the canonical OPERATOR-FIRST-MESSAGE.txt to stdout so the operator
// can paste it as the very first user message into ANY model session
// (Claude, GPT, big-pickle, minimax, ling, hy3, nemotron, gpt-5-nano,
// Gemini, Llama, Ollama, LM Studio, etc.). Substrate-independent: plain
// prose, no Markdown headers, no tool calls, no Claude-specific framing.
//
// Usage:
//   node tools/behcs/prime.mjs                    # print to stdout
//   node tools/behcs/prime.mjs --copy             # copy to Windows clipboard via clip.exe
//   node tools/behcs/prime.mjs --status           # show file path + sha + bytes
//   node tools/behcs/prime.mjs --wrap "your prompt here"   # print preamble + your prompt
//
// Common aliases (set in your shell profile):
//   alias prime='node C:/Users/rayss/Asolaria/tools/behcs/prime.mjs --copy'
//   so you can type: prime <enter>, then Ctrl+V into any new model terminal.

import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const messagePath = path.join(repoRoot, "OPERATOR-FIRST-MESSAGE.txt");

function readMessage() {
  try {
    return fs.readFileSync(messagePath, "utf8");
  } catch (error) {
    return `[PRIME-INFRA-PRELOAD-MISSING] expected at ${messagePath} — ${error?.message || error}\n`;
  }
}

function sha256(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function copyToClipboard(text) {
  return new Promise((resolve, reject) => {
    if (process.platform === "win32") {
      const proc = spawn("clip.exe", [], { stdio: ["pipe", "ignore", "ignore"] });
      proc.on("error", reject);
      proc.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`clip.exe exit ${code}`))));
      proc.stdin.end(text);
      return;
    }
    if (process.platform === "darwin") {
      const proc = spawn("pbcopy", [], { stdio: ["pipe", "ignore", "ignore"] });
      proc.on("error", reject);
      proc.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`pbcopy exit ${code}`))));
      proc.stdin.end(text);
      return;
    }
    // linux fallback: try xclip then xsel
    const tryCmd = (cmd, args) => new Promise((res) => {
      const p = spawn(cmd, args, { stdio: ["pipe", "ignore", "ignore"] });
      p.on("error", () => res(false));
      p.on("exit", (code) => res(code === 0));
      p.stdin.end(text);
    });
    tryCmd("xclip", ["-selection", "clipboard"]).then((ok) => {
      if (ok) return resolve();
      tryCmd("xsel", ["--clipboard", "--input"]).then((ok2) => {
        if (ok2) return resolve();
        reject(new Error("no clipboard tool found (xclip/xsel/clip.exe/pbcopy)"));
      });
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const message = readMessage();

  if (args.includes("--status")) {
    console.log(JSON.stringify({
      path: messagePath,
      bytes: message.length,
      sha256: sha256(message),
      platform: process.platform
    }, null, 2));
    return;
  }

  if (args.includes("--copy")) {
    await copyToClipboard(message);
    process.stderr.write(`[prime] copied ${message.length} bytes to clipboard. sha256=${sha256(message).slice(0, 12)}…\n`);
    process.stderr.write(`[prime] paste it as your first message into the next model terminal.\n`);
    return;
  }

  const wrapIdx = args.indexOf("--wrap");
  if (wrapIdx !== -1) {
    const userPrompt = args.slice(wrapIdx + 1).join(" ").trim();
    process.stdout.write(message);
    process.stdout.write("\n--- OPERATOR INSTRUCTION FOLLOWS ---\n");
    process.stdout.write(userPrompt);
    process.stdout.write("\n");
    return;
  }

  process.stdout.write(message);
}

main().catch((error) => {
  process.stderr.write(`[prime] ${error?.message || error}\n`);
  process.exit(1);
});
