#!/usr/bin/env node
// A-017-legacy-purge-dry-run.mjs — Section A Item 017
//
// Consumes A-008 legacy-inventory + A-009 sha-dedup findings and produces
// a PURGE PLAN — NOT an execution. Actual deletes require operator
// greenlight via a separate invocation with --execute.
//
// Strategy:
//   1. Enumerate orphans from A-008 report (C:/ root stragglers)
//   2. Archive-then-delete recommendation for asolaria-from-liris (59.8 MB,
//      0 cross-tree dups with asolaria-acer per A-009)
//   3. Recovery trees on D: → keep in place (intentional snapshot)
//   4. Any .bak files created by migration-to-packages.mjs and older
//
// Output: plans/A/A-017-purge-plan.json + human-readable .md

import { readFileSync, existsSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { execSync } from "node:child_process";

// G-090 staleness
const PROCESS_STARTED_AT = new Date().toISOString();
let SOURCE_COMMIT = "unknown";
try { SOURCE_COMMIT = execSync("git -C C:/asolaria-acer rev-parse HEAD", { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim().slice(0, 12); } catch {}

const PLAN_PATH = "C:/asolaria-acer/plans/A/A-017-purge-plan.json";
const PLAN_MD   = "C:/asolaria-acer/plans/A/A-017-purge-plan.md";

// Orphans identified in A-008 (7 items at C:/ root)
const KNOWN_ORPHANS = [
  { path: "C:/la.js",                   reason: "HTTP exec server stub, 319b, unreferenced (A-008 finding)" },
  { path: "C:/sc.ps1",                  reason: "Incomplete PowerShell screenshot script, 505b (A-008)" },
  { path: "C:/console.log('ACER",       reason: "Debug payload stub, 19b shell-paste accident (A-008)" },
  { path: "C:/{J[id].status",           reason: "Empty junk marker, 0b (A-008)" },
  { path: "C:/asolaria-gateway.log",    reason: "Stale gateway error log, 159kb (A-008)" },
  { path: "C:/DumpStack.log",           reason: "Windows debug artifact (A-008)" },
  { path: "C:/DumpStack.log.tmp",       reason: "Windows debug artifact" },
  { path: "C:/hiberfil.sys",            reason: "Windows hibernate file — DO NOT DELETE, system-managed" },
  { path: "C:/pagefile.sys",            reason: "Windows swap file — DO NOT DELETE, system-managed" },
  { path: "C:/swapfile.sys",            reason: "Windows swap file — DO NOT DELETE, system-managed" },
  { path: "C:/appverifUI.dll",          reason: "Windows artifact (A-008) — NOT asolaria" },
  { path: "C:/vfcompat.dll",            reason: "Windows artifact (A-008) — NOT asolaria" },
];

// System-owned files that must NEVER be deleted
const NEVER_DELETE = new Set([
  "C:/hiberfil.sys",
  "C:/pagefile.sys",
  "C:/swapfile.sys",
  "C:/appverifUI.dll",
  "C:/vfcompat.dll",
  "C:/DumpStack.log",
  "C:/DumpStack.log.tmp",
]);

// Archive candidate (not deletion): asolaria-from-liris
const ARCHIVE_CANDIDATES = [
  {
    path: "C:/asolaria-from-liris",
    reason: "Superseded by C:/asolaria-acer per A-008+A-009 (0 cross-tree dups with canonical). 59.8 MB archival archive candidate.",
    suggested_archive: "D:/archive/asolaria-from-liris-pre-purge-2026-04-19.tar.gz",
    size_mb_estimated: 59.8,
  },
];

// Recovery trees — KEEP IN PLACE
const PRESERVE = [
  { path: "D:/Asolaria-RECOVERED", reason: "Intentional pre-cleanup snapshot (memory: project_sovereignty_recovery). 950 MB." },
  { path: "D:/sovereignty-usb-rebuild", reason: "USB reconstruction artifact (memory: project_sovereignty_recovery). 3.7 MB." },
];

function statSafe(p) {
  try { const s = statSync(p); return { exists: true, size: s.size, isDirectory: s.isDirectory(), mtime: s.mtime.toISOString() }; }
  catch { return { exists: false, size: 0, isDirectory: false, mtime: null }; }
}

const orphan_rows = KNOWN_ORPHANS.map(o => {
  const s = statSafe(o.path);
  const systemProtected = NEVER_DELETE.has(o.path);
  return {
    ...o,
    exists: s.exists,
    size_bytes: s.size,
    mtime: s.mtime,
    is_dir: s.isDirectory,
    action: systemProtected ? "PRESERVE_SYSTEM_FILE"
          : s.exists ? "RECOMMEND_DELETE"
          : "ALREADY_GONE",
  };
});

const archive_rows = ARCHIVE_CANDIDATES.map(a => {
  const s = statSafe(a.path);
  return { ...a, exists: s.exists, is_dir: s.isDirectory, mtime: s.mtime, action: s.exists ? "RECOMMEND_ARCHIVE_THEN_DELETE" : "ALREADY_GONE" };
});

const preserve_rows = PRESERVE.map(p => {
  const s = statSafe(p.path);
  return { ...p, exists: s.exists, action: "PRESERVE_IN_PLACE", mtime: s.mtime };
});

const byAction = {};
for (const r of [...orphan_rows, ...archive_rows, ...preserve_rows]) {
  byAction[r.action] = (byAction[r.action] || 0) + 1;
}

const plan = {
  generated_at: PROCESS_STARTED_AT,
  source_commit: SOURCE_COMMIT,
  track: "A-017",
  mode: "DRY-RUN",
  warning: "This is a PLAN. No files modified. Execute with separate operator-greenlight script after review.",
  summary: {
    orphans_total: orphan_rows.length,
    orphans_recommend_delete: orphan_rows.filter(o => o.action === "RECOMMEND_DELETE").length,
    orphans_already_gone: orphan_rows.filter(o => o.action === "ALREADY_GONE").length,
    orphans_system_protected: orphan_rows.filter(o => o.action === "PRESERVE_SYSTEM_FILE").length,
    archive_candidates: archive_rows.length,
    preserve_in_place: preserve_rows.length,
    by_action: byAction,
    reclaim_estimate_bytes: orphan_rows.filter(o => o.action === "RECOMMEND_DELETE").reduce((a, o) => a + o.size_bytes, 0)
      + archive_rows.reduce((a, c) => a + c.size_mb_estimated * 1024 * 1024, 0),
  },
  orphans: orphan_rows,
  archive: archive_rows,
  preserve: preserve_rows,
  glyph_sentence: `EVT-A-017-PURGE-PLAN · DRY-RUN · orphans=${orphan_rows.length} · archive=${archive_rows.length} · preserve=${preserve_rows.length} · reclaim_estimate=${Math.round((orphan_rows.filter(o => o.action === "RECOMMEND_DELETE").reduce((a, o) => a + o.size_bytes, 0) + archive_rows.reduce((a, c) => a + c.size_mb_estimated * 1024 * 1024, 0)) / 1024 / 1024)}MB @ M-INDICATIVE .`,
};

mkdirSync(dirname(PLAN_PATH), { recursive: true });
writeFileSync(PLAN_PATH, JSON.stringify(plan, null, 2));

// Human-readable .md
const md = [
  `# A-017 Legacy Purge Plan (DRY-RUN)`,
  ``,
  `Generated: ${PROCESS_STARTED_AT}`,
  `Source commit: ${SOURCE_COMMIT}`,
  `Status: **${plan.mode}** — no files modified. Operator greenlight required for --execute.`,
  ``,
  `## Summary`,
  ``,
  `| Action | Count |`,
  `|---|---:|`,
  ...Object.entries(byAction).map(([a, n]) => `| ${a} | ${n} |`),
  ``,
  `**Reclaim estimate:** ${Math.round(plan.summary.reclaim_estimate_bytes / 1024 / 1024)} MB`,
  ``,
  `## Orphans`,
  ``,
  `| Path | Action | Size | Reason |`,
  `|---|---|---:|---|`,
  ...orphan_rows.map(o => `| \`${o.path}\` | ${o.action} | ${o.size_bytes} | ${o.reason} |`),
  ``,
  `## Archive Candidates (archive-then-delete, requires operator greenlight)`,
  ``,
  ...archive_rows.map(a => `- \`${a.path}\` → archive to \`${a.suggested_archive}\` (~${a.size_mb_estimated} MB). ${a.reason}`),
  ``,
  `## Preserved In Place (intentional snapshots)`,
  ``,
  ...preserve_rows.map(p => `- \`${p.path}\` — ${p.reason}`),
  ``,
  `## How to execute (after operator greenlight)`,
  ``,
  `\`\`\``,
  `# Review plan first:`,
  `cat ${PLAN_PATH}`,
  `# Then (FUTURE TRACK A-018):`,
  `node scripts/A-018-legacy-purge-execute.mjs --confirm --plan ${PLAN_PATH}`,
  `\`\`\``,
  ``,
  plan.glyph_sentence,
].join("\n");
writeFileSync(PLAN_MD, md);

console.log("A-017 DRY-RUN plan written:");
console.log("  " + PLAN_PATH);
console.log("  " + PLAN_MD);
console.log("");
console.log(plan.glyph_sentence);
