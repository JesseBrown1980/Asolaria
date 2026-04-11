#!/usr/bin/env node
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { chromium } = require("playwright");

const EXCLUDED_NAMES = new Set([
  "Cache",
  "Code Cache",
  "GPUCache",
  "Cache_Data",
  "blob_storage",
  "DawnCache",
  "GrShaderCache",
  "GraphiteDawnCache",
  "Media Cache",
  "OptimizationGuidePredictionModels",
  "ShaderCache"
]);

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      out[key] = "true";
      continue;
    }
    out[key] = next;
    i += 1;
  }
  return out;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function shouldCopy(src) {
  const base = path.basename(src);
  if (EXCLUDED_NAMES.has(base)) return false;
  if (src.includes(`${path.sep}Service Worker${path.sep}CacheStorage`)) return false;
  return true;
}

function copyTreeBestEffort(src, dest) {
  if (!shouldCopy(src)) return;
  let stat = null;
  try {
    stat = fs.statSync(src);
  } catch {
    return;
  }
  if (stat.isDirectory()) {
    ensureDir(dest);
    let entries = [];
    try {
      entries = fs.readdirSync(src, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      copyTreeBestEffort(path.join(src, entry.name), path.join(dest, entry.name));
    }
    return;
  }
  ensureDir(path.dirname(dest));
  try {
    fs.copyFileSync(src, dest);
  } catch {
    // Best effort only.
  }
}

function copyProfileTree(srcRoot, profileDirectory, tempRoot) {
  ensureDir(tempRoot);
  const localStateSrc = path.join(srcRoot, "Local State");
  const localStateDest = path.join(tempRoot, "Local State");
  if (fs.existsSync(localStateSrc)) {
    try {
      fs.copyFileSync(localStateSrc, localStateDest);
    } catch {
      // Best effort only.
    }
  }
  const profileSrc = path.join(srcRoot, profileDirectory);
  const profileDest = path.join(tempRoot, profileDirectory);
  copyTreeBestEffort(profileSrc, profileDest);
}

async function clickFirst(locator) {
  const count = await locator.count();
  if (count < 1) return false;
  await locator.first().click({ timeout: 10000 });
  return true;
}

async function focusChat(page, chatName) {
  const direct = page.locator(`[title="${chatName}"]`);
  if (await clickFirst(direct)) return "direct-title";

  const searchInput = page.locator('div[contenteditable="true"]').first();
  await searchInput.click({ timeout: 10000 });
  await page.keyboard.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
  await page.keyboard.press("Backspace");
  await page.keyboard.insertText(chatName);
  await page.waitForTimeout(1200);

  const searched = page.locator(`[title="${chatName}"]`);
  if (await clickFirst(searched)) return "searched-title";

  const textLocator = page.getByText(chatName, { exact: true });
  if (await clickFirst(textLocator)) return "searched-text";

  throw new Error(`chat_not_found:${chatName}`);
}

async function findComposer(page) {
  const candidates = page.locator('footer div[contenteditable="true"], div[contenteditable="true"][role="textbox"]');
  const count = await candidates.count();
  for (let index = count - 1; index >= 0; index -= 1) {
    const candidate = candidates.nth(index);
    if (await candidate.isVisible().catch(() => false)) {
      return candidate;
    }
  }
  throw new Error("composer_not_found");
}

async function main() {
  const args = parseArgs(process.argv);
  const profileDirectory = String(args["profile-directory"] || "").trim();
  const url = String(args.url || "https://web.whatsapp.com").trim();
  const waitMs = Math.max(0, Math.min(15000, Number(args["wait-ms"] || 4000)));
  const chromePath = String(args["chrome-path"] || "C:/Program Files/Google/Chrome/Application/chrome.exe").trim();
  const sourceRoot = String(args["source-root"] || "C:/Users/rayss/AppData/Local/Google/Chrome/User Data").trim();
  const chatName = String(args["chat-name"] || "").trim();
  const messageFile = String(args["message-file"] || "").trim();
  const inlineMessage = String(args.message || "");
  const verifySnippet = String(args["verify-snippet"] || "").trim();

  if (!profileDirectory) throw new Error("--profile-directory is required.");
  if (!chatName) throw new Error("--chat-name is required.");
  if (!messageFile && !inlineMessage) throw new Error("--message-file or --message is required.");
  if (!fs.existsSync(chromePath)) throw new Error(`Chrome executable not found: ${chromePath}`);
  if (!fs.existsSync(sourceRoot)) throw new Error(`Chrome user data root not found: ${sourceRoot}`);

  const message = messageFile
    ? String(fs.readFileSync(messageFile, "utf8") || "").replace(/\r/g, "").trim()
    : inlineMessage.replace(/\r/g, "").trim();
  if (!message) throw new Error("message is empty.");

  const tempRoot = path.join(os.tmpdir(), `asolaria-pw-send-${profileDirectory.replace(/[^a-z0-9._-]+/gi, "_")}`);
  if (fs.existsSync(tempRoot)) {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
  copyProfileTree(sourceRoot, profileDirectory, tempRoot);

  let context = null;
  try {
    context = await chromium.launchPersistentContext(tempRoot, {
      executablePath: chromePath,
      headless: true,
      args: [`--profile-directory=${profileDirectory}`]
    });
    const page = context.pages()[0] || await context.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(waitMs);

    const matchedBy = await focusChat(page, chatName);
    await page.waitForTimeout(1200);

    const composer = await findComposer(page);
    await composer.click({ timeout: 10000 });
    await composer.fill("");
    await page.keyboard.insertText(message);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(1800);

    const bodyText = await page.locator("body").innerText().catch(() => "");
    const verified = verifySnippet ? bodyText.includes(verifySnippet) : true;

    process.stdout.write(`${JSON.stringify({
      ok: true,
      url: page.url(),
      title: await page.title(),
      chatName,
      matchedBy,
      verified,
      verifySnippet,
      tempRoot
    }, null, 2)}\n`);
  } finally {
    if (context) {
      await context.close().catch(() => {});
    }
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  process.stderr.write(`${String(error && error.stack || error)}\n`);
  process.exit(1);
});
