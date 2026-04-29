#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { getSecret, listSecretMeta } = require("../src/secureVault");
const { invokeDesktopInput } = require("../src/connectors/desktopControlConnector");
const { captureDesktopSnapshot } = require("../src/connectors/desktopCaptureConnector");

const PASSWORD_KEYS = /(password|passwd|pwd|passphrase|recovery|backup|secret)$/i;
const DEFAULT_SCAN_ROOTS = [
  "C:/Users/acer/Desktop",
  "C:/Users/acer/OneDrive/Desktop",
  "C:/Users/acer/Downloads",
  "C:/Users/acer/Asolaria/data",
  "C:/Users/acer/Asolaria/reports"
];

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const item = String(argv[i] || "").trim();
    if (!item) continue;
    if (!item.startsWith("--")) {
      out._.push(item);
      continue;
    }
    const key = item.slice(2);
    const next = String(argv[i + 1] || "").trim();
    if (next && !next.startsWith("--")) {
      out[key] = next;
      i += 1;
    } else {
      out[key] = true;
    }
  }
  return out;
}

function hash12(value) {
  return crypto.createHash("sha256").update(String(value || ""), "utf8").digest("hex").slice(0, 12);
}

function addCandidate(candidates, source, value, meta = {}) {
  const text = String(value || "");
  if (text.length < 6 || text.length > 256) return;
  if (/^\*+$/.test(text)) return;
  if (/^(true|false|null|undefined)$/i.test(text)) return;
  const key = hash12(text);
  if (candidates.some((row) => row.hash12 === key)) return;
  candidates.push({
    source,
    value: text,
    hash12: key,
    length: text.length,
    meta
  });
}

function walkVaultObject(candidates, source, value, pathParts = []) {
  if (value === null || value === undefined) return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkVaultObject(candidates, source, item, [...pathParts, String(index)]));
    return;
  }
  if (typeof value !== "object") {
    const last = pathParts[pathParts.length - 1] || "";
    if (PASSWORD_KEYS.test(last)) {
      addCandidate(candidates, source, value, { keyPath: pathParts.join(".") });
    }
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    walkVaultObject(candidates, source, child, [...pathParts, key]);
  }
}

function collectVaultCandidates(candidates) {
  for (const namespace of ["owner", "asolaria"]) {
    let metas = [];
    try {
      metas = listSecretMeta({ namespace });
    } catch (_error) {
      metas = [];
    }
    for (const meta of metas) {
      const name = String(meta.name || "");
      let secret = null;
      try {
        secret = getSecret(name, { namespace });
      } catch (_error) {
        secret = null;
      }
      if (!secret || !secret.value) continue;
      walkVaultObject(candidates, `vault:${namespace}:${name}`, secret.value);
    }
  }
}

function shouldReadFile(filePath) {
  const lower = filePath.toLowerCase();
  if (!/\.(txt|md|json|ndjson|env|csv|log|yaml|yml)$/i.test(lower)) return false;
  if (/(node_modules|\.git|captures|dist|archives|quarantine)/i.test(lower)) return false;
  return true;
}

function walkFiles(root, out, limit) {
  if (out.length >= limit) return;
  let entries = [];
  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch (_error) {
    return;
  }
  for (const entry of entries) {
    if (out.length >= limit) return;
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) {
      if (/(node_modules|\.git|captures|dist|archives|quarantine)/i.test(full)) continue;
      walkFiles(full, out, limit);
    } else if (entry.isFile() && shouldReadFile(full)) {
      out.push(full);
    }
  }
}

function collectTextCandidates(candidates, roots, maxFiles = 800) {
  const files = [];
  for (const root of roots) {
    walkFiles(root, files, maxFiles);
    if (files.length >= maxFiles) break;
  }
  const patterns = [
    /(?:password|passwd|pwd|passphrase)\s*[:=]\s*["']?([^"'\r\n,;]{6,160})/ig,
    /["'](?:password|passwd|pwd|passphrase)["']\s*:\s*["']([^"']{6,160})["']/ig
  ];
  for (const file of files) {
    let text = "";
    try {
      const stat = fs.statSync(file);
      if (stat.size > 2_000_000) continue;
      text = fs.readFileSync(file, "utf8");
    } catch (_error) {
      continue;
    }
    for (const pattern of patterns) {
      let match = null;
      while ((match = pattern.exec(text)) !== null) {
        addCandidate(candidates, `file:${file}`, match[1].trim(), { pattern: pattern.source.slice(0, 40) });
      }
    }
  }
}

function safeRows(candidates) {
  return candidates.map((row, index) => ({
    index,
    source: row.source,
    length: row.length,
    hash12: row.hash12,
    meta: row.meta || {}
  }));
}

async function typeCandidate(candidate, options = {}) {
  const fieldX = Number(options.fieldX || 1540);
  const fieldY = Number(options.fieldY || 346);
  const nextX = Number(options.nextX || 1715);
  const nextY = Number(options.nextY || 520);
  const waitMs = Math.max(1000, Math.min(20000, Number(options.waitMs || 4500)));
  await invokeDesktopInput({ action: "click", x: fieldX, y: fieldY, timeoutMs: 12000 });
  await invokeDesktopInput({ action: "key", key: "ctrl+a", timeoutMs: 12000 });
  await invokeDesktopInput({ action: "key", key: "backspace", timeoutMs: 12000 });
  await invokeDesktopInput({ action: "type", text: candidate.value, timeoutMs: 20000 });
  await invokeDesktopInput({ action: "click", x: nextX, y: nextY, timeoutMs: 12000 });
  await new Promise((resolve) => setTimeout(resolve, waitMs));
  const capture = await captureDesktopSnapshot({
    fileName: `google-reauth-candidate-${candidate.hash12}.png`,
    captureAll: true,
    timeoutMs: 45000
  });
  return {
    source: candidate.source,
    length: candidate.length,
    hash12: candidate.hash12,
    capturePath: capture.outputPath
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const action = String(args._[0] || "list").toLowerCase();
  const candidates = [];
  collectVaultCandidates(candidates);
  if (args.files !== "false") {
    collectTextCandidates(candidates, DEFAULT_SCAN_ROOTS);
  }
  if (action === "list") {
    process.stdout.write(`${JSON.stringify({ ok: true, count: candidates.length, rows: safeRows(candidates) }, null, 2)}\n`);
    return;
  }
  if (action === "type") {
    const index = Number(args.index);
    if (!Number.isInteger(index) || index < 0 || index >= candidates.length) {
      throw new Error(`Invalid candidate index. Available: 0..${Math.max(0, candidates.length - 1)}`);
    }
    const result = await typeCandidate(candidates[index], args);
    process.stdout.write(`${JSON.stringify({ ok: true, result }, null, 2)}\n`);
    return;
  }
  throw new Error(`Unknown action: ${action}`);
}

main().catch((error) => {
  process.stdout.write(`${JSON.stringify({ ok: false, error: String(error && error.message || error) }, null, 2)}\n`);
  process.exit(1);
});
