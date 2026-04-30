#!/usr/bin/env node
// observation-status-auto-promoter.mjs — close the recursive promotion loop liris-side.
//
// Watches three evidence sources:
//   1. liris cosign chain entries with `exercises_supervisor` field
//   2. liris outbox.ndjson rows with payload.exercises_supervisor
//   3. acer hub inbox via /behcs/inbox?from=liris (envelopes liris dispatched)
//
// Counts evidence-receipts per supervisor PID + auto-writes overlay promotions:
//   0 receipts  → ASSUMED (no change)
//   1 receipt   → OBSERVED
//   ≥2 receipts → PROVEN
//
// BREADTH+DEPTH combined: new supervisors enter as OBSERVED on first evidence;
// existing supervisors elevate to PROVEN on second+. No skip-promoted filter,
// so re-exercise contributes more receipts and strengthens D11 over ticks.
//
// Per fabric-self-improvement loop tick-5 (cosign seq=43). Mirror of acer's
// observation-status-auto-promoter (acer tick-4) with breadth+depth combined.
// named_agent: liris-T5-observation-status-auto-promoter

import fs from "node:fs";
import path from "node:path";
import http from "node:http";

const COSIGN_CHAIN = "C:/Users/rayss/.claude/projects/C--/memory/COSIGN_CHAIN.ndjson";
const OUTBOX = "C:/Users/rayss/Asolaria/data/behcs/outbox.ndjson";
const SUPERVISOR_INDEX = "C:/Users/rayss/Asolaria/data/behcs/pid-fabric/index/supervisor-pid-indicator-index-latest.json";
const OVERLAY_PATH = "C:/Users/rayss/Asolaria/data/behcs/supervisors/federation/federation-reintegration-supervisors.v1.observation-status-20260429.json";
const HUB_INBOX_FROM_LIRIS = "http://192.168.100.1:4947/behcs/inbox?from=liris&last=200";

function readNdjson(p) {
  if (!fs.existsSync(p)) return [];
  return fs.readFileSync(p, "utf-8").split("\n").filter(l => l.trim()).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
}

function fetchHubInbox() {
  return new Promise((resolve) => {
    const url = new URL(HUB_INBOX_FROM_LIRIS);
    const req = http.get({ host: url.hostname, port: url.port, path: url.pathname + url.search, timeout: 10000 }, (res) => {
      let body = ""; res.on("data", c => body += c);
      res.on("end", () => { try { const j = JSON.parse(body); resolve(Array.isArray(j.messages) ? j.messages : []); } catch { resolve([]); } });
    });
    req.on("error", () => resolve([]));
    req.on("timeout", () => { req.destroy(); resolve([]); });
  });
}

// ────────────── Evidence harvesting ──────────────
function harvestFromCosignChain() {
  const entries = readNdjson(COSIGN_CHAIN);
  const evidence = []; // [{supervisor_pid, source, ref}]
  for (const e of entries) {
    // 1) Direct exercises_supervisor citation in chain entry
    const direct = e.exercises_supervisor ?? e?.payload?.exercises_supervisor;
    if (typeof direct === "string") evidence.push({ supervisor_pid: direct, source: "chain-direct", ref: `seq=${e.seq}` });
    // 2) Round-2/round-3 promotion entries with explicit supervisor_pid arrays
    const r2 = Array.isArray(e.round_2_promotions_real_time_T1_2026_04_29) ? e.round_2_promotions_real_time_T1_2026_04_29 : [];
    const r3 = Array.isArray(e.round_3_promotions_recursive_self_improvement_2026_04_29) ? e.round_3_promotions_recursive_self_improvement_2026_04_29 : [];
    for (const p of [...r2, ...r3]) if (p?.supervisor_pid) evidence.push({ supervisor_pid: p.supervisor_pid, source: "chain-promotion-block", ref: `seq=${e.seq}` });
    // 3) fabric_supervisor_verdicts dictionary keys
    const verdicts = e?.payload?.fabric_supervisor_verdicts ?? e?.fabric_supervisor_verdicts;
    if (verdicts && typeof verdicts === "object") {
      for (const supKey of Object.keys(verdicts)) evidence.push({ supervisor_pid: supKey, source: "chain-fabric-verdicts", ref: `seq=${e.seq}` });
    }
  }
  return evidence;
}

function harvestFromOutbox() {
  const rows = readNdjson(OUTBOX);
  const evidence = [];
  for (const r of rows) {
    const sup = r?.exercises_supervisor ?? r?.payload?.exercises_supervisor;
    if (typeof sup === "string") evidence.push({ supervisor_pid: sup, source: "outbox", ref: r.id });
  }
  return evidence;
}

function harvestFromHubFromLiris(messages) {
  // Mirror acer auto-promoter broadened-filter (acer tick-5/6 finding):
  // Different sides emit different envelope-type names but the supervisor
  // citation is in payload regardless. Catch all evidence-class envelope
  // types + all citation paths.
  const EVIDENCE_TYPES = new Set([
    "GNN_PREDICTED_ACTION_T1",     // liris-side (gnn-dispatch-bridge)
    "GNN_PREDICTED_DISPATCH",      // acer-side (mirror)
    "REALTIME_LOOP_ACER_TICK3",
    "REALTIME_LOOP_ACER_TICK4",
    "REALTIME_LOOP_ACER_TICK5",
    "FABRIC_IMPROVEMENT_PROGRESS", // tick summaries cite supervisors
    "FABRIC_IMPROVEMENT_TICK",
  ]);
  const evidence = [];
  for (const m of messages) {
    if (!EVIDENCE_TYPES.has(m.type)) continue;
    const directBody = m?.body?.signed_envelope?.payload;
    const sup =
      m?.exercises_supervisor ??
      m?.payload?.exercises_supervisor ??
      m?.payload?.supervisor_pid ??
      m?.payload?.prediction?.supervisor_pid ??
      directBody?.exercises_supervisor ??
      directBody?.supervisor_pid ??
      directBody?.prediction?.supervisor_pid;
    if (typeof sup === "string") evidence.push({ supervisor_pid: sup, source: "hub-from-liris", ref: m.id });
  }
  return evidence;
}

// ────────────── Promotion logic ──────────────
function classifyD11(receiptCount) {
  if (receiptCount === 0) return "ASSUMED";
  if (receiptCount === 1) return "OBSERVED";
  return "PROVEN";
}

function loadOverlay() {
  if (!fs.existsSync(OVERLAY_PATH)) return null;
  try { return JSON.parse(fs.readFileSync(OVERLAY_PATH, "utf-8")); } catch { return null; }
}

function findExistingD11(overlay, supervisorPid) {
  if (!overlay) return "ASSUMED";
  // Check primary promotions
  for (const p of overlay.promotions ?? []) if (p.supervisor_pid === supervisorPid) return p.after ?? "ASSUMED";
  for (const p of overlay.round_2_promotions_real_time_T1_2026_04_29 ?? []) if (p.supervisor_pid === supervisorPid) return p.after ?? "ASSUMED";
  for (const p of overlay.round_3_promotions_recursive_self_improvement_2026_04_29 ?? []) if (p.supervisor_pid === supervisorPid) return p.after ?? "ASSUMED";
  return "ASSUMED";
}

const args = process.argv.slice(2);
const dryRun = !args.includes("--apply");

const hubMsgs = await fetchHubInbox();
const evidence = [
  ...harvestFromCosignChain(),
  ...harvestFromOutbox(),
  ...harvestFromHubFromLiris(hubMsgs),
];

// Aggregate per supervisor (dedup ref+source within same supervisor)
// Per tick-7 bilateral agreement + tick-9 drift fix:
// Liris overlay is canonical for FEDERATION REINTEGRATION supervisors ONLY.
// Cross-namespace supervisors (acer's BH.BEHCS256.BASEOS.SUP.*, BH.CLAUDE.*, etc.)
// are observable from liris's vantage but NOT promoted into liris's overlay.
// Acer's overlay stays canonical for those.
const LIRIS_CANONICAL_PREFIX = "BH.SUPERVISOR.PID.FED.REINTEGRATION.";
const perSup = new Map();
let crossNamespaceSkipped = 0;
for (const e of evidence) {
  if (!e.supervisor_pid.startsWith(LIRIS_CANONICAL_PREFIX)) {
    crossNamespaceSkipped++;
    continue;
  }
  if (!perSup.has(e.supervisor_pid)) perSup.set(e.supervisor_pid, new Set());
  perSup.get(e.supervisor_pid).add(`${e.source}:${e.ref}`);
}
if (crossNamespaceSkipped > 0) {
  console.log(`[auto-promoter] cross-namespace evidence skipped (acer canonical): ${crossNamespaceSkipped} entries`);
}

const overlay = loadOverlay();
const decisions = [];
for (const [sup, refs] of perSup.entries()) {
  const count = refs.size;
  const proposed = classifyD11(count);
  const existing = findExistingD11(overlay, sup);
  const needsPromote = (proposed !== existing) && (
    (existing === "ASSUMED" && (proposed === "OBSERVED" || proposed === "PROVEN")) ||
    (existing === "OBSERVED" && proposed === "PROVEN")
  );
  decisions.push({ supervisor_pid: sup, evidence_count: count, existing, proposed, needs_promote: needsPromote, refs: Array.from(refs).slice(0, 5) });
}

decisions.sort((a, b) => b.evidence_count - a.evidence_count);

console.log(`[auto-promoter] supervisors with evidence: ${decisions.length}`);
console.log(`[auto-promoter] dry-run=${dryRun}`);
for (const d of decisions.slice(0, 20)) {
  const flag = d.needs_promote ? "★" : " ";
  console.log(`  ${flag} ${d.supervisor_pid} count=${d.evidence_count} ${d.existing}→${d.proposed}`);
}
const promotionsNeeded = decisions.filter(d => d.needs_promote);
console.log(`\n[auto-promoter] promotions needed: ${promotionsNeeded.length}`);

if (!dryRun && promotionsNeeded.length > 0 && overlay) {
  const tickPromotionBlock = promotionsNeeded.map(d => ({
    supervisor_pid: d.supervisor_pid,
    before: d.existing,
    after: d.proposed,
    evidence_count: d.evidence_count,
    evidence_refs_sample: d.refs,
    auto_promoter: "liris-T5-observation-status-auto-promoter",
    promoted_at: new Date().toISOString(),
  }));
  const blockKey = `auto_promotions_${new Date().toISOString().replace(/[:.]/g, "_")}`;
  overlay[blockKey] = tickPromotionBlock;
  fs.writeFileSync(OVERLAY_PATH, JSON.stringify(overlay, null, 2));
  console.log(`[auto-promoter] APPLIED ${promotionsNeeded.length} promotions under ${blockKey}`);
} else if (dryRun) {
  console.log("[auto-promoter] pass --apply to write overlay updates");
}
