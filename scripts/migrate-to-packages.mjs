#!/usr/bin/env node
// scripts/migrate-to-packages.mjs — A-010 migration skeleton
//
// Purpose: move legacy/scattered content into the canonical packages/ layout
// under C:/asolaria-acer. Skeleton ships with --dry-run default, --execute for
// real moves, --rollback <id> to reverse using the NDJSON log. Migration rules
// are loaded from MIGRATION_RULES (empty by default — track A-011 will wire
// the first real ruleset).
//
// Design rules:
//   1. SAFE BY DEFAULT — --dry-run is implicit; --execute must be opt-in
//   2. EVERY MUTATION IS LOGGED — append JSON line to rollback-log before
//      touching disk, so partial failure is still recoverable
//   3. ROLLBACK IS DETERMINISTIC — replay the log in reverse order; each entry
//      carries enough info to undo itself
//   4. HASH-VERIFIED — before moving a file we record its sha256; after moving
//      we verify the new location matches; rollback confirms sha256 match too
//   5. IDEMPOTENT — re-running with same rules on already-migrated state is a
//      no-op (detected via sha256 + path absence)
//
// CLI usage:
//   node scripts/migrate-to-packages.mjs                     # dry-run (default)
//   node scripts/migrate-to-packages.mjs --dry-run           # explicit dry-run
//   node scripts/migrate-to-packages.mjs --execute           # perform moves
//   node scripts/migrate-to-packages.mjs --rollback <id>     # reverse a session
//   node scripts/migrate-to-packages.mjs --list-rollbacks    # show past sessions
//   node scripts/migrate-to-packages.mjs --rules <path.json> # custom ruleset
//
// Rollback log format (plans/A/migration-rollback.ndjson, one JSON per line):
//   {"session":"<id>","ts":"<ISO>","kind":"SESSION_START","rules_sha256":"..."}
//   {"session":"<id>","ts":"<ISO>","kind":"MOVE","src":"...","dst":"...","sha256":"...","size":N}
//   {"session":"<id>","ts":"<ISO>","kind":"COPY","src":"...","dst":"...","sha256":"...","size":N}
//   {"session":"<id>","ts":"<ISO>","kind":"MKDIR","path":"...","had_to_create":true/false}
//   {"session":"<id>","ts":"<ISO>","kind":"SKIP","src":"...","reason":"..."}
//   {"session":"<id>","ts":"<ISO>","kind":"SESSION_END","moved":N,"copied":N,"skipped":N,"errors":N}
//
// Glyph stamps emitted on each session:
//   EVT-MIGRATION-DRY-RUN-PLANNED · session=<id> · moves=N · @ M-INDICATIVE .
//   EVT-MIGRATION-EXECUTED · session=<id> · moved=N · @ M-EYEWITNESS .
//   EVT-MIGRATION-ROLLED-BACK · session=<id> · restored=N · @ M-EYEWITNESS .

import {
  existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync,
  renameSync, copyFileSync, unlinkSync, statSync, readdirSync,
} from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import { join, dirname, resolve, relative } from "node:path";
import { homedir } from "node:os";

// ──────────────────────────────────────────────────────────────────────
// Paths
// ──────────────────────────────────────────────────────────────────────
const REPO_ROOT = resolve(process.cwd());
const ROLLBACK_LOG = join(REPO_ROOT, "plans", "A", "migration-rollback.ndjson");
const EVENTS = join(homedir(), ".asolaria-workers", "migration-events.ndjson");
const DEFAULT_RULES_PATH = join(REPO_ROOT, "scripts", "migration-rules.default.json");

// ──────────────────────────────────────────────────────────────────────
// Migration rule schema (empty ruleset ships with skeleton)
// ──────────────────────────────────────────────────────────────────────
// A rule is { from: <source path or glob>, to: <destination dir>, kind: "MOVE"|"COPY", filter?: fn }
// Rules are applied in order. Skeleton ships with empty rule list; A-011 wires the first real ones.
const MIGRATION_RULES = [
  // Example (commented out, not active):
  //   { from: "C:/asolaria-from-liris/packages/kernel/src/", to: "packages/kernel/src/", kind: "MOVE" },
];

// ──────────────────────────────────────────────────────────────────────
// Utilities
// ──────────────────────────────────────────────────────────────────────
function sha256OfFile(path) {
  const h = createHash("sha256");
  h.update(readFileSync(path));
  return h.digest("hex");
}

function ensureDir(path) {
  const created = !existsSync(path);
  if (created) mkdirSync(path, { recursive: true });
  return created;
}

function appendLog(obj) {
  ensureDir(dirname(ROLLBACK_LOG));
  appendFileSync(ROLLBACK_LOG, JSON.stringify(obj) + "\n");
}

function appendEvent(obj) {
  ensureDir(dirname(EVENTS));
  appendFileSync(EVENTS, JSON.stringify({ ts: new Date().toISOString(), ...obj }) + "\n");
}

function parseArgs(argv) {
  const out = { dryRun: true, execute: false, rollback: null, listRollbacks: false, rulesPath: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run")        out.dryRun = true;
    else if (a === "--execute")   { out.execute = true; out.dryRun = false; }
    else if (a === "--rollback")  out.rollback = argv[++i];
    else if (a === "--list-rollbacks") out.listRollbacks = true;
    else if (a === "--rules")     out.rulesPath = argv[++i];
  }
  return out;
}

function loadRules(rulesPath) {
  if (rulesPath && existsSync(rulesPath)) {
    const rules = JSON.parse(readFileSync(rulesPath, "utf-8"));
    const sha = createHash("sha256").update(readFileSync(rulesPath)).digest("hex");
    return { rules, sha };
  }
  return { rules: MIGRATION_RULES, sha: createHash("sha256").update(JSON.stringify(MIGRATION_RULES)).digest("hex") };
}

// ──────────────────────────────────────────────────────────────────────
// Plan phase — walk rules, emit intended actions
// ──────────────────────────────────────────────────────────────────────
function planActions(rules) {
  const plan = [];
  for (const rule of rules) {
    if (!existsSync(rule.from)) { plan.push({ rule, status: "SKIP", reason: "source_missing" }); continue; }
    const srcStat = statSync(rule.from);
    if (srcStat.isFile()) {
      const dstPath = join(rule.to, relative(dirname(rule.from), rule.from));
      plan.push({ kind: rule.kind ?? "MOVE", src: rule.from, dst: dstPath, size: srcStat.size });
    } else if (srcStat.isDirectory()) {
      const walk = (dir) => {
        for (const e of readdirSync(dir, { withFileTypes: true })) {
          const full = join(dir, e.name);
          if (e.isDirectory()) walk(full);
          else if (e.isFile()) {
            const rel = relative(rule.from, full);
            const dstPath = join(rule.to, rel);
            const st = statSync(full);
            plan.push({ kind: rule.kind ?? "MOVE", src: full, dst: dstPath, size: st.size });
          }
        }
      };
      walk(rule.from);
    }
  }
  return plan;
}

// ──────────────────────────────────────────────────────────────────────
// Execute phase — only runs when --execute is set
// ──────────────────────────────────────────────────────────────────────
function executePlan(plan, sessionId) {
  let moved = 0, copied = 0, skipped = 0, errors = 0;
  for (const a of plan) {
    if (a.status === "SKIP") { skipped++; appendLog({ session: sessionId, ts: new Date().toISOString(), kind: "SKIP", ...a }); continue; }
    try {
      const sha = sha256OfFile(a.src);
      ensureDir(dirname(a.dst));
      if (a.kind === "MOVE") {
        // Log BEFORE touching disk so partial failure is recoverable
        appendLog({ session: sessionId, ts: new Date().toISOString(), kind: "MOVE", src: a.src, dst: a.dst, sha256: sha, size: a.size });
        renameSync(a.src, a.dst);
        const newSha = sha256OfFile(a.dst);
        if (newSha !== sha) throw new Error(`sha256 mismatch after MOVE: src=${sha.slice(0,12)} dst=${newSha.slice(0,12)}`);
        moved++;
      } else if (a.kind === "COPY") {
        appendLog({ session: sessionId, ts: new Date().toISOString(), kind: "COPY", src: a.src, dst: a.dst, sha256: sha, size: a.size });
        copyFileSync(a.src, a.dst);
        const newSha = sha256OfFile(a.dst);
        if (newSha !== sha) throw new Error(`sha256 mismatch after COPY: src=${sha.slice(0,12)} dst=${newSha.slice(0,12)}`);
        copied++;
      }
    } catch (err) {
      errors++;
      appendLog({ session: sessionId, ts: new Date().toISOString(), kind: "ERROR", src: a.src, dst: a.dst, error: String(err.message || err) });
    }
  }
  return { moved, copied, skipped, errors };
}

// ──────────────────────────────────────────────────────────────────────
// Rollback phase — replay log in reverse
// ──────────────────────────────────────────────────────────────────────
function loadSession(sessionId) {
  if (!existsSync(ROLLBACK_LOG)) throw new Error("rollback log not found: " + ROLLBACK_LOG);
  const lines = readFileSync(ROLLBACK_LOG, "utf-8").split("\n").filter(Boolean);
  return lines.map((l) => JSON.parse(l)).filter((e) => e.session === sessionId);
}

function rollbackSession(sessionId) {
  const entries = loadSession(sessionId);
  if (entries.length === 0) throw new Error("no entries found for session: " + sessionId);
  let restored = 0, failed = 0;
  // Replay in reverse order
  for (const e of entries.slice().reverse()) {
    try {
      if (e.kind === "MOVE") {
        if (!existsSync(e.dst)) { failed++; continue; }
        const currentSha = sha256OfFile(e.dst);
        if (currentSha !== e.sha256) { failed++; appendLog({ session: sessionId + "-rollback", ts: new Date().toISOString(), kind: "ROLLBACK_SHA_MISMATCH", dst: e.dst, expected: e.sha256, actual: currentSha }); continue; }
        ensureDir(dirname(e.src));
        renameSync(e.dst, e.src);
        restored++;
      } else if (e.kind === "COPY") {
        if (!existsSync(e.dst)) { failed++; continue; }
        unlinkSync(e.dst);  // copy → just delete the copy
        restored++;
      }
      // SKIP / MKDIR / SESSION_START / SESSION_END / ERROR not reversible
    } catch (err) {
      failed++;
      appendLog({ session: sessionId + "-rollback", ts: new Date().toISOString(), kind: "ROLLBACK_ERROR", entry: e, error: String(err.message || err) });
    }
  }
  return { restored, failed };
}

function listRollbacks() {
  if (!existsSync(ROLLBACK_LOG)) return [];
  const lines = readFileSync(ROLLBACK_LOG, "utf-8").split("\n").filter(Boolean);
  const sessions = new Map();
  for (const l of lines) {
    const e = JSON.parse(l);
    if (!sessions.has(e.session)) sessions.set(e.session, { session: e.session, start: null, end: null, moved: 0, copied: 0 });
    const s = sessions.get(e.session);
    if (e.kind === "SESSION_START") s.start = e.ts;
    if (e.kind === "SESSION_END") { s.end = e.ts; s.moved = e.moved; s.copied = e.copied; }
  }
  return Array.from(sessions.values());
}

// ──────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────
const args = parseArgs(process.argv);

if (args.listRollbacks) {
  const sessions = listRollbacks();
  console.log("ROLLBACK SESSIONS:");
  for (const s of sessions) console.log(`  ${s.session}  ${s.start}  moved=${s.moved}  copied=${s.copied}`);
  process.exit(0);
}

if (args.rollback) {
  console.log(`Rolling back session: ${args.rollback}`);
  const { restored, failed } = rollbackSession(args.rollback);
  appendEvent({ event: "EVT-MIGRATION-ROLLED-BACK", session: args.rollback, restored, failed, glyph_sentence: `EVT-MIGRATION-ROLLED-BACK · session=${args.rollback} · restored=${restored} · failed=${failed} @ M-EYEWITNESS .` });
  console.log(`restored=${restored} failed=${failed}`);
  console.log(`EVT-MIGRATION-ROLLED-BACK · session=${args.rollback} · restored=${restored} · failed=${failed} @ M-EYEWITNESS .`);
  process.exit(failed === 0 ? 0 : 1);
}

const { rules, sha: rulesSha } = loadRules(args.rulesPath);
const sessionId = new Date().toISOString().replace(/[:.]/g, "-") + "_" + randomUUID().slice(0, 8);

console.log("=== A-010 MIGRATION SKELETON ===");
console.log("session:", sessionId);
console.log("mode:", args.execute ? "EXECUTE" : "DRY-RUN");
console.log("rules:", rules.length, "entries (sha256:", rulesSha.slice(0, 12) + ")");

const plan = planActions(rules);
console.log("planned actions:", plan.length);
for (const a of plan.slice(0, 10)) {
  console.log(`  ${a.kind ?? a.status}  ${a.src ?? "-"}  →  ${a.dst ?? a.reason ?? "-"}  (${a.size ?? 0} b)`);
}
if (plan.length > 10) console.log(`  ... and ${plan.length - 10} more`);

if (args.execute) {
  appendLog({ session: sessionId, ts: new Date().toISOString(), kind: "SESSION_START", rules_sha256: rulesSha, plan_count: plan.length });
  const result = executePlan(plan, sessionId);
  appendLog({ session: sessionId, ts: new Date().toISOString(), kind: "SESSION_END", ...result });
  appendEvent({ event: "EVT-MIGRATION-EXECUTED", session: sessionId, ...result, glyph_sentence: `EVT-MIGRATION-EXECUTED · session=${sessionId} · moved=${result.moved} · copied=${result.copied} · errors=${result.errors} @ M-EYEWITNESS .` });
  console.log(JSON.stringify(result, null, 2));
  console.log(`EVT-MIGRATION-EXECUTED · session=${sessionId} · moved=${result.moved} · copied=${result.copied} · errors=${result.errors} @ M-EYEWITNESS .`);
  process.exit(result.errors === 0 ? 0 : 1);
} else {
  appendEvent({ event: "EVT-MIGRATION-DRY-RUN-PLANNED", session: sessionId, plan_count: plan.length, rules_sha256: rulesSha, glyph_sentence: `EVT-MIGRATION-DRY-RUN-PLANNED · session=${sessionId} · planned=${plan.length} · rules_sha=${rulesSha.slice(0, 12)} @ M-INDICATIVE .` });
  console.log(`EVT-MIGRATION-DRY-RUN-PLANNED · session=${sessionId} · planned=${plan.length} · rules_sha=${rulesSha.slice(0, 12)} @ M-INDICATIVE .`);
  console.log("\n(no changes made — pass --execute to perform the plan)");
  process.exit(0);
}
