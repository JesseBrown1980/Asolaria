#!/usr/bin/env node
// Spawn-time prime-knowledge injector.
// Reads 00-PRIME-INFRASTRUCTURE-ALREADY-BUILT.md once at import and provides
// hard-preamble wrappers for any spawner (Claude Code subagents, OpenCode
// subprocess, big-pickle, minimax, etc.) so no terminal agent runs without it.
//
// Use:
//   import { injectPrime, primedSpawnArgs, primeMarker } from "./spawn-prime-injector.mjs";
//   const wrapped = injectPrime(originalPrompt);
//   const args = primedSpawnArgs("opencode/big-pickle", originalPrompt);

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const primeMdPath = path.join(repoRoot, "00-PRIME-INFRASTRUCTURE-ALREADY-BUILT.md");

export const primeMarker = "[PRIME-INFRA-PRELOADED:v1]";

let primeText = "";
try {
  primeText = fs.readFileSync(primeMdPath, "utf8");
} catch (error) {
  primeText = `# PRIME INFRASTRUCTURE — preamble file missing\nExpected at: ${primeMdPath}\nReason: ${error?.message || error}\n`;
}

const primePreamble = [
  primeMarker,
  "ROOT-CLASS PRELOAD — DO NOT IGNORE.",
  "The following is canonical infrastructure knowledge that supersedes any contradicting assumption you might form from a smoke test, a single failed call, or a falsified pre-fix claim.",
  "If you find yourself proposing to rebuild any part of the system below, STOP and read the receipt cited in the source line.",
  "",
  primeText,
  "",
  "END PRIME PRELOAD. Continue with the user/operator instruction that follows."
].join("\n");

const primeSha = (() => {
  try {
    // lazy import to avoid forcing crypto for the module's hot path
    const { createHash } = require("node:crypto");
    return createHash("sha256").update(primePreamble, "utf8").digest("hex");
  } catch (_e) {
    return "";
  }
})();

export function injectPrime(prompt, options = {}) {
  const skip = options.skip === true || /^(1|true|yes|y|on)$/i.test(String(process.env.ASOLARIA_PRIME_INJECT_SKIP || ""));
  if (skip) return String(prompt || "");
  const original = String(prompt || "");
  if (original.includes(primeMarker)) return original;
  return `${primePreamble}\n\n--- OPERATOR INSTRUCTION FOLLOWS ---\n${original}`;
}

export function primedSpawnArgs(model, prompt, opencodeFlags = ["run", "--format", "json"]) {
  const wrappedPrompt = injectPrime(prompt);
  return [...opencodeFlags, "-m", model, wrappedPrompt];
}

export function primedEnv(extra = {}) {
  return {
    ASOLARIA_PRIME_PRELOADED: "1",
    ASOLARIA_PRIME_MARKER: primeMarker,
    ASOLARIA_PRIME_SHA256: primeSha,
    ...extra
  };
}

export function primeStatus() {
  return {
    preambleSourcePath: primeMdPath,
    preambleBytes: primeText.length,
    preambleSha256: primeSha,
    marker: primeMarker
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const action = process.argv[2] || "status";
  if (action === "status") {
    console.log(JSON.stringify(primeStatus(), null, 2));
  } else if (action === "preview") {
    console.log(injectPrime(process.argv[3] || "[no prompt provided]"));
  } else if (action === "dump") {
    process.stdout.write(primePreamble);
  } else {
    console.error(`Unknown action '${action}'. Use: status | preview <prompt> | dump`);
    process.exit(2);
  }
}
