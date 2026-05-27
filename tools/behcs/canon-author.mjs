#!/usr/bin/env node
// canon-author.mjs (WO L12, named_agent: liris-cascade-W4-5-L12-canon-author)
// Operator-facing CLI for drafting + dispatching versioned OPERATOR-FIRST-MESSAGE canons.
// Subcommands: new | validate | dispatch | list | promote
// Constraints: node:fs + node:crypto + node:readline only. NEVER WIPE (backups on promote).

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import readline from "node:readline";
import { spawnSync } from "node:child_process";

const ROOT = "C:/Users/rayss/Asolaria";
const CANON_DIR = path.join(ROOT, "data/canon");
const ACTIVE_PATH = path.join(ROOT, "OPERATOR-FIRST-MESSAGE.txt");
const V2_DRAFT = path.join(ROOT, "OPERATOR-FIRST-MESSAGE.v2.draft.txt");
const STATE_PATH = path.join(ROOT, "data/behcs/canon-deployment-state.json");
const REGISTRY_PATH = path.join(ROOT, "data/behcs/device-registry.json");
const DISPATCHER = path.join(ROOT, "tools/behcs/dispatch-preamble-to-acer.mjs");
const VALIDATOR = path.join(ROOT, "tools/behcs/canon-validate.mjs");

const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");
const fileName = (v) => `OPERATOR-FIRST-MESSAGE-${v}.txt`;
const filePath = (v) => path.join(CANON_DIR, fileName(v));
const versionFromName = (n) => { const m = n.match(/^OPERATOR-FIRST-MESSAGE-(v\d+)\.txt$/); return m ? m[1] : null; };
const versionNum = (v) => { const m = /^v(\d+)$/.exec(v); return m ? parseInt(m[1], 10) : NaN; };

function ensureDirs() { fs.mkdirSync(CANON_DIR, { recursive: true }); }

function migrateV1IfNeeded() {
  ensureDirs();
  const dst = filePath("v1");
  if (fs.existsSync(dst)) return { migrated: false, reason: "v1 already in canon dir" };
  if (!fs.existsSync(ACTIVE_PATH)) return { migrated: false, reason: "no active canon to migrate" };
  fs.copyFileSync(ACTIVE_PATH, dst);
  return { migrated: true, src: ACTIVE_PATH, dst };
}

function listVersions() {
  ensureDirs();
  return fs.readdirSync(CANON_DIR)
    .map(versionFromName).filter(Boolean)
    .sort((a, b) => versionNum(a) - versionNum(b));
}

function latestVersion() { const all = listVersions(); return all.length ? all[all.length - 1] : null; }

function readState() {
  if (!fs.existsSync(STATE_PATH)) return { peers: {} };
  try { return JSON.parse(fs.readFileSync(STATE_PATH, "utf-8")); } catch { return { peers: {} }; }
}

function readRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) return { devices: {} };
  try { return JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf-8")); } catch { return { devices: {} }; }
}

// ───── inline validator (used if canon-validate.mjs missing) ─────
function inlineValidate(text, version) {
  const violations = [];
  const headerRe = /^\[PRIME-INFRA-PRELOADED:([^\]]+)\][^\n]*\[FIRST-MESSAGE-CANON\]/;
  const m = text.match(headerRe);
  if (!m) violations.push("missing [PRIME-INFRA-PRELOADED:vN] [FIRST-MESSAGE-CANON] header on line 1");
  else if (version && m[1] !== version) violations.push(`header version=${m[1]} but expected ${version}`);
  const requiredSections = ["WHO I AM", "WHAT IS ALREADY BUILT"];
  for (const s of requiredSections) if (!text.includes(s)) violations.push(`missing required section: ${s}`);
  if (Buffer.byteLength(text) < 2000) violations.push(`canon too small (${Buffer.byteLength(text)}B < 2000B floor)`);
  if (Buffer.byteLength(text) > 16000) violations.push(`canon too large (${Buffer.byteLength(text)}B > 16000B ceiling)`);
  if (!/300B|300 billion/i.test(text) || !/falsified|superseded|replaces/i.test(text))
    violations.push("must explicitly mark 300B claim as falsified/superseded");
  return { ok: violations.length === 0, violations, header_version: m ? m[1] : null };
}

async function runValidator(version) {
  const fp = filePath(version);
  if (!fs.existsSync(fp)) return { ok: false, violations: [`file not found: ${fp}`] };
  if (fs.existsSync(VALIDATOR)) {
    try {
      const mod = await import("file:///" + VALIDATOR.replace(/\\/g, "/"));
      if (typeof mod.validateCanon === "function") {
        const r = mod.validateCanon(fp);
        return { ok: !!r.ok, violations: (r.violations || []).map((v) => `${v.rule}: ${v.detail}`), external: true };
      }
    } catch (e) {
      return { ok: false, violations: [`canon-validate.mjs import failed: ${e.message}`], external: true };
    }
  }
  return inlineValidate(fs.readFileSync(fp, "utf-8"), version);
}

function fileSummary(version) {
  const fp = filePath(version);
  if (!fs.existsSync(fp)) return null;
  const buf = fs.readFileSync(fp);
  return { version, path: fp, bytes: buf.length, sha256: sha256(buf) };
}

// ───── subcommands ─────
function cmdNew(version) {
  if (!/^v\d+$/.test(version)) { console.error("ERROR: --version must match v<N> (e.g. v3)"); process.exit(2); }
  const dst = filePath(version);
  if (fs.existsSync(dst)) { console.error(`ERROR: ${dst} already exists — refusing overwrite (NEVER WIPE)`); process.exit(2); }
  const latest = latestVersion();
  if (!latest) { console.error("ERROR: no existing canon to template from. Run migration first."); process.exit(2); }
  const tmplPath = filePath(latest);
  let body = fs.readFileSync(tmplPath, "utf-8");
  body = body.replace(/^\[PRIME-INFRA-PRELOADED:v\d+\]/, `[PRIME-INFRA-PRELOADED:${version}]`);
  fs.writeFileSync(dst, body);
  const sum = fileSummary(version);
  console.log(`[new] template=${latest} -> ${version}`);
  console.log(`[new] path=${sum.path}`);
  console.log(`[new] bytes=${sum.bytes} sha256=${sum.sha256}`);
  console.log(`[new] open with: code "${sum.path}"  (or notepad / your editor)`);
  console.log(`[new] then run: node tools/behcs/canon-author.mjs validate --version ${version}`);
}

async function cmdValidate(version) {
  if (!/^v\d+$/.test(version)) { console.error("ERROR: --version must match v<N>"); process.exit(2); }
  const r = await runValidator(version);
  const sum = fileSummary(version);
  if (sum) console.log(`[validate] ${version} bytes=${sum.bytes} sha256=${sum.sha256.slice(0, 16)}…`);
  console.log(`[validate] result=${r.ok ? "PASS" : "FAIL"} (${r.external ? "external canon-validate.mjs" : "inline"})`);
  if (r.violations.length) for (const v of r.violations) console.log(`  - ${v}`);
  process.exit(r.ok ? 0 : 1);
}

async function cmdList() {
  const versions = listVersions();
  const state = readState();
  console.log("version  bytes   sha256_16        validated  last_dispatched_to        last_dispatched_at");
  console.log("-------  ------  ---------------- ---------  ------------------------  ----------------------");
  if (!versions.length) { console.log("(none — run migration / new)"); return; }
  for (const v of versions) {
    const sum = fileSummary(v);
    const valid = await runValidator(v);
    let dispPeer = "-", dispAt = "-";
    for (const [peer, r] of Object.entries(state.peers || {}))
      if (r.last_dispatched_canon_version === v) { dispPeer = peer; dispAt = r.last_dispatched_at || "-"; break; }
    console.log([v.padEnd(7), String(sum.bytes).padEnd(6), sum.sha256.slice(0, 16).padEnd(16),
                 (valid.ok ? "PASS" : "FAIL").padEnd(9), dispPeer.padEnd(24), dispAt].join("  "));
  }
  // Also note v2 draft if present at root
  if (fs.existsSync(V2_DRAFT)) {
    const buf = fs.readFileSync(V2_DRAFT);
    console.log(`(also: OPERATOR-FIRST-MESSAGE.v2.draft.txt at repo root, ${buf.length}B sha256=${sha256(buf).slice(0, 16)}… — not yet in canon dir)`);
  }
}

async function prompt(q) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((res) => rl.question(q, (a) => { rl.close(); res(a); }));
}

async function cmdDispatch(version, target) {
  if (!/^v\d+$/.test(version)) { console.error("ERROR: --version must match v<N>"); process.exit(2); }
  if (!target) { console.error("ERROR: --target required"); process.exit(2); }
  const reg = readRegistry();
  if (!reg.devices || !reg.devices[target]) { console.error(`ERROR: target '${target}' not in device-registry`); process.exit(2); }
  const fp = filePath(version);
  if (!fs.existsSync(fp)) { console.error(`ERROR: ${fp} does not exist`); process.exit(2); }
  const v = await runValidator(version);
  if (!v.ok) { console.error(`ERROR: ${version} failed validation:`); for (const x of v.violations) console.error("  - " + x); process.exit(2); }
  const sum = fileSummary(version);
  console.log(`[dispatch] target=${target} version=${version} bytes=${sum.bytes} sha256=${sum.sha256.slice(0, 16)}…`);
  const ans = (await prompt(`TYPE 'yes' to confirm dispatch of ${version} to ${target}: `)).trim();
  if (ans !== "yes") { console.log("[dispatch] aborted by operator"); process.exit(1); }
  const r = spawnSync("node", [DISPATCHER], { encoding: "utf-8", env: { ...process.env, PREAMBLE_PATH: fp } });
  process.stdout.write(r.stdout || ""); process.stderr.write(r.stderr || "");
  console.log(`[dispatch] dispatcher exit=${r.status}`);
  process.exit(r.status ?? 1);
}

async function cmdPromote(version) {
  if (!/^v\d+$/.test(version)) { console.error("ERROR: --version must match v<N>"); process.exit(2); }
  const fp = filePath(version);
  if (!fs.existsSync(fp)) { console.error(`ERROR: ${fp} does not exist`); process.exit(2); }
  const v = await runValidator(version);
  if (!v.ok) { console.error(`ERROR: ${version} failed validation`); for (const x of v.violations) console.error("  - " + x); process.exit(2); }
  if (fs.existsSync(ACTIVE_PATH)) {
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const bak = `${ACTIVE_PATH}.bak.${ts}`;
    fs.copyFileSync(ACTIVE_PATH, bak);
    console.log(`[promote] backup -> ${bak}`);
  }
  fs.copyFileSync(fp, ACTIVE_PATH);
  const sum = { bytes: fs.statSync(ACTIVE_PATH).size, sha256: sha256(fs.readFileSync(ACTIVE_PATH)) };
  console.log(`[promote] ${version} -> ${ACTIVE_PATH} bytes=${sum.bytes} sha256=${sum.sha256.slice(0, 16)}…`);
}

// ───── main ─────
const args = process.argv.slice(2);
const sub = args[0];
const getArg = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };

const mig = migrateV1IfNeeded();
if (mig.migrated) console.log(`[migrate] copied ${mig.src} -> ${mig.dst}`);

(async () => {
  switch (sub) {
    case "new":      return cmdNew(getArg("--version"));
    case "validate": return await cmdValidate(getArg("--version"));
    case "dispatch": return await cmdDispatch(getArg("--version"), getArg("--target"));
    case "list":     return await cmdList();
    case "promote":  return await cmdPromote(getArg("--version"));
    default:
      console.log("canon-author.mjs — operator canon authoring tool");
      console.log("Usage:");
      console.log("  node tools/behcs/canon-author.mjs list");
      console.log("  node tools/behcs/canon-author.mjs new      --version v<N>");
      console.log("  node tools/behcs/canon-author.mjs validate --version v<N>");
      console.log("  node tools/behcs/canon-author.mjs dispatch --version v<N> --target <peer>");
      console.log("  node tools/behcs/canon-author.mjs promote  --version v<N>");
      process.exit(sub ? 2 : 0);
  }
})().catch((e) => { console.error(`[fatal] ${e.stack || e.message}`); process.exit(2); });
