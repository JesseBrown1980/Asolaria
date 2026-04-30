#!/usr/bin/env node
import http from "node:http";
import crypto from "node:crypto";
import { buildSignedEnvelope, LIRIS_KEY_ID } from "./bus-sign.mjs";

const ACER_BUS = "http://192.168.100.1:4947/behcs/send";

const ts = new Date().toISOString();

const payload = {
  ask: "GIT_COORDINATION_BILATERAL",
  reason: "Operator authorized 'Fix the github Now' + 'BEHCS 256 Github or whatever needs to be done right now to make it right' + 'Do it with acer' under quintuple+2week extension. Bilateral planning required before pushing/committing on shared repos.",
  liris_state: {
    "Asolaria": {
      branch: "liris/behcs-consolidation",
      remote: "https://github.com/JesseBrown1980/Asolaria.git",
      unpushed_commits: 5,
      tip_sha: "9925594",
      tip_message: "Merge branch 'dev' of https://github.com/JesseBrown1980/Asolaria into liris/behcs-consolidation",
      working_tree: "MANY modifications + deletions + untracked. Includes BROWN-HILBERT.md / CLAUDE.md / CODEX.md / TASKS.md / brown-hilbert/*.md / .history/* archaeology churn"
    },
    "Asolaria-BEHCS-256": {
      branch: "main",
      remote: "NO_UPSTREAM_CONFIGURED",
      tip_sha: "18f9fed",
      tip_message: "MEGA-BATCH-6 seq 91: 15 agents green · 300 tests · 93312 omni-matrix LIVE",
      working_tree: "10 modified source files including COSIGN_CHAIN.ndjson + kernel/BEHCS-256-GRAMMAR.md + kernel/glyph-families.json + W3-1 vision-keyboard-supervisor (4 files) + omnispindle-spawn pid-map + omnispindle-forward + agent-type-registry. Plus many untracked dirs (boot/ config/ data/* including 1M-pipeline-run + migration-logs + mistake-ledger.ndjson + partition-surgery-state)",
      d11: "PROVEN_LOCAL_KERNEL_AT_RISK_NEVER_REMOTED",
      open_questions: [
        "Does acer have a remote configured for Asolaria-BEHCS-256? URL?",
        "Should liris add the same remote, or should main branch be pushed via acer first?",
        "Branch policy: does liris commit to main directly OR cut a liris/* branch and merge later?"
      ]
    }
  },
  questions_for_acer: [
    "What's your git state on Asolaria (branch, unpushed, working tree size)?",
    "What's your git state on Asolaria-BEHCS-256 (remote? branch? unpushed?)?",
    "Do you have a remote URL for BEHCS-256 we can both target?",
    "Should we commit-and-push in parallel (each on own branch) or coordinate one-host-at-a-time to avoid merge churn?",
    "Are there .gitignore rules I should add before staging the giant untracked dirs (data/1M-pipeline-run/ etc.) — those are runtime state, probably shouldn't be in github"
  ],
  liris_proposed_plan: {
    "Asolaria": "Stage tracked-file modifications by logical group (BROWN-HILBERT canon + cascade tools + new memory references). Skip .history/* deletions in this commit (separate cleanup). Commit + push 5 prior commits + the new commit.",
    "Asolaria-BEHCS-256": "FIRST resolve the remote question with acer. THEN: review .gitignore, stage modified source files separately from untracked runtime dirs. Commit COSIGN_CHAIN.ndjson + kernel changes + vision-keyboard-supervisor W3-1 changes as cohesive unit. Untracked dirs: probably .gitignore most of data/* (runtime state) + commit boot/ + config/ as legitimate."
  },
  laws_honored: [
    "feedback_no_unilateral_federation_link_severance",
    "feedback_no_wipe",
    "feedback_no_external_human_messages_without_local_test (push IS external)",
    "Git Safety Protocol per CLAUDE.md (no force-push, no --no-verify, no --no-gpg-sign, no destructive ops without explicit op auth)"
  ]
};

const envId = crypto.createHash("sha256").update("git-coord-bilateral-" + ts).digest("hex").slice(0, 32);
const env = {
  id: envId,
  ts,
  from: "liris",
  to: "acer",
  mode: "real",
  type: "GIT_COORDINATION",
  verb: "EVT-GIT-COORDINATION-BILATERAL",
  payload,
  cube: { D1_ACTOR: "liris", D3_TARGET: "acer", D7_STATE: "ask", D20_TIME: ts, D26_OMNIDIRECTIONAL: "bilateral", D34_CROSS_COLONY: "cross_host_lan" },
  sig_owner: LIRIS_KEY_ID,
};

const manifest = { id: env.id, ts: env.ts, from: env.from, to: env.to, type: env.type, verb: env.verb };
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
