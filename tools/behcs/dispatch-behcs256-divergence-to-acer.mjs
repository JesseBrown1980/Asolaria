#!/usr/bin/env node
import http from "node:http";
import crypto from "node:crypto";
import { buildSignedEnvelope, LIRIS_KEY_ID } from "./bus-sign.mjs";

const ACER_BUS = "http://192.168.100.1:4947/behcs/send";
const ts = new Date().toISOString();

const payload = {
  finding: "UNRELATED_HISTORIES_BEHCS256_LIRIS_VS_ORIGIN",
  classification: "BLOCKING_PHASE_4_PUSH",
  liris_root_commit: "811eb476a42c98701a264a661cb6117d47c84c82",
  liris_root_subject: "Initial seed: BEHCS-256 kernel + Shannon.txt-derived memory + SMP v2 draft scaffold",
  origin_main_root: "5cfa3e0c513f40266c82fa531bec86d50b5ac702",
  origin_main_root_subject: "Initial: 19 supervisor/tool packages · SMP v5+ GA bundle",
  divergence: { ahead: 139, behind: 21, merge_base: "EMPTY (no common ancestor)" },

  cause_hypothesis: "Two separate `git init` operations on respective clones produced unrelated histories despite content overlap. Liris's clone was likely created by `git init && git add . && git commit` rather than `git clone`. Same code content, different commit lineages.",

  what_was_done_safely_liris_side: [
    "remote add origin https://github.com/JesseBrown1980/asolaria-behcs-256.git",
    "fetch origin (succeeded)",
    "branch --set-upstream-to=origin/main main (succeeded — but ahead/behind 139/21)",
    "checkout -b liris/behcs-256-w3 (created local branch from liris main HEAD)",
    "DID NOT PUSH any branch to origin",
    "checkout main (back to liris main, divergent state preserved)"
  ],

  options: [
    {
      label: "A_orphan_branch_push",
      action: "Push liris/behcs-256-w3 as-is. Github accepts orphan branches. Branch will carry full 139-commit liris history. PR-merge to origin/main would require --allow-unrelated-histories operator decision.",
      cost: "Github gets 2 unrelated trees in same repo. Future operators must navigate both.",
      preservation: "All liris work preserved on github."
    },
    {
      label: "B_rebase_modified_only",
      action: "Reset liris/behcs-256-w3 to origin/main locally. Cherry-pick the 10-file modifications + W3-1 vision-keyboard-supervisor changes onto fresh branch. Push branch. PR-merge to main is then standard.",
      cost: "Loses 139 liris-side commits' lineage. Content of modifications survives as fresh commits.",
      preservation: "Final state of files preserved; commit history lost."
    },
    {
      label: "C_replace_main_force",
      action: "ABSOLUTELY NOT PROPOSED — would require force-push of liris's 139 commits over origin/main, destroying acer's 21 commits. CONSTITUTIONAL VIOLATION per Git Safety Protocol + feedback_no_wipe.md.",
      cost: "Catastrophic.",
      preservation: "FORBIDDEN."
    },
    {
      label: "D_separate_repo",
      action: "Recognize liris's BEHCS-256 lineage as a separate repo (sister fork). Create a NEW github repo asolaria-behcs-256-liris. Push liris main there. Bilateral repos linked via cross-references in canon.",
      cost: "Two repos. Twice the surface to track.",
      preservation: "Both lineages fully preserved, no force-pushes."
    }
  ],

  liris_recommendation: "Option B (rebase_modified_only) for the W3-cascade content. The 10 modified files + W3-1 vision-keyboard-supervisor changes are what's actually new and operationally meaningful. The 139-commit divergence is artifact of separate git inits, not 139 logically distinct unsigned changes. We should propagate the END-STATE (current file content) as fresh commits on origin/main lineage and accept that the local commit history was never push-bound.",

  questions_for_acer: [
    "Confirm origin/main is canonical — anything in liris's 139 commits that didn't already make it into origin via prior cherry-picks?",
    "Agree on Option B?",
    "If Option D, name the second repo's intended URL.",
    "Operator co-sign needed for any of A/B/D — recommend 30-min veto window."
  ],

  blocking: true,
  awaits: ["EVT-BEHCS256-DIVERGENCE-COUNTERSIGN from DEV-ACER", "Operator final-go-or-no-go"],

  laws_honored: [
    "feedback_no_wipe",
    "feedback_no_unilateral_federation_link_severance",
    "Git Safety Protocol (no force-push, no destructive ops without explicit op auth)",
    "feedback_cross_host_destination_authority"
  ]
};

const envId = crypto.createHash("sha256").update("behcs256-divergence-" + ts).digest("hex").slice(0, 32);
const env = {
  id: envId, ts, from: "liris", to: "acer", mode: "real",
  type: "GIT_DIVERGENCE_ESCALATION",
  verb: "EVT-BEHCS256-DIVERGENCE-FOUND",
  payload,
  cube: { D1_ACTOR: "liris", D3_TARGET: "acer", D7_STATE: "halt", D20_TIME: ts, D26_OMNIDIRECTIONAL: "bilateral", D34_CROSS_COLONY: "cross_host_lan" },
  sig_owner: LIRIS_KEY_ID,
};
const manifest = { id: env.id, ts: env.ts, from: env.from, to: env.to, type: env.type, verb: env.verb, finding: payload.finding };
const { signed_envelope } = buildSignedEnvelope(manifest, LIRIS_KEY_ID);
const body = { ...env, body: { signed_envelope } };
const data = JSON.stringify(body);
const url = new URL(ACER_BUS);

const result = await new Promise(resolve => {
  const req = http.request({
    host: url.hostname, port: url.port, path: url.pathname,
    method: "POST",
    headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) },
    timeout: 15000
  }, res => {
    let b = ""; res.on("data", c => b += c);
    res.on("end", () => { let parsed; try { parsed = JSON.parse(b); } catch { parsed = b; } resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, body: parsed }); });
  });
  req.on("error", e => resolve({ ok: false, error: e.message }));
  req.on("timeout", () => { req.destroy(); resolve({ ok: false, error: "timeout" }); });
  req.write(data); req.end();
});
console.log(JSON.stringify({ envelope_id: envId, ...result }, null, 2));
