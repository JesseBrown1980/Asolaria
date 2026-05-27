#!/usr/bin/env node
import http from "node:http";
import crypto from "node:crypto";
import { buildSignedEnvelope, LIRIS_KEY_ID } from "./bus-sign.mjs";

const ACER_BUS = "http://192.168.100.1:4947/behcs/send";
const ts = new Date().toISOString();

const payload = {
  countersign_of: [
    "b02848f447a85777a06aac84538322ae", // Asolaria PROPOSE_GITHUB_COMMIT signed by DEV-ACER 2026-04-29T13:23:39
    "27f6bd0fae4a518baadbe8ccc9d2f2c5", // BEHCS-256 PROPOSE_GITHUB_COMMIT signed by DEV-ACER 2026-04-29T13:23:39
  ],
  superseded_pre_sign: "4d6ed84acbba04ffcc798fc66c7646a1", // earlier UNSIGNED PROPOSE; ignore
  acer_coord_countersign: "6ab2f0fa270b8b84484e7a5858bb5862",
  asolaria_manifest_sha256: "65762a66d369e46f77504705e3de4be9352d27bc9a54e6605124b68421f941ad",
  acer_signed_owner: "DEV-ACER",
  acer_signed_key_id: "dev-acer-4abb0a9c",
  verdict: "AGREE_WITH_CONDITIONS_PROCEED",
  operator_witness: "rayssa+jesse — 'Authorized' + 'Fix the github Now' + 'BEHCS 256 Github or whatever needs to be done right now to make it right' + 'Do it with acer' under 2-week extension 2026-04-29 → 2026-05-13",
  ts,

  verdict_per_repo: {
    "Asolaria": "APPROVED_CONDITIONAL",
    "asolaria-behcs-256": "APPROVED"
  },

  verdict_per_commit_seq: {
    "Asolaria": [
      { seq: 1, name: "canon-docs", verdict: "APPROVED", note: "Class A canon docs, 5 files, low risk" },
      { seq: 2, name: "code", verdict: "APPROVED_WITH_NOTE", note: "17 files from W1-W6 + agent-keyboard slog. Phase 2 merge into liris/behcs-consolidation may have conflicts where liris-side W1-W6 named-similarly tools exist; resolution will be done liris-side." },
      { seq: 3, name: "config", verdict: "APPROVED", note: "package.json+lock + VAULT_APPROLE_RUNBOOK; node-pty for ConPTY. Verify package-lock.json doesn't carry prerelease tarballs/secrets." },
      { seq: 4, name: "new-tools", verdict: "APPROVED_CONDITIONAL", concerns: ["Confirm pre-push that 252 file list contains NO .env/.env.* / api-keys / secrets / private-key files / large binaries (>5MB unless source). Recommend 'git diff --cached --stat | sort -k3 -n' review before commit. If any flagged, defer to a follow-up commit."] },
      { seq: 5, name: "plans-specs", verdict: "APPROVED", note: "WO-L5-CONPTY-INJECTION + brown-hilbert spec updates" }
    ],
    "asolaria-behcs-256": [
      { seq: 1, name: "memory-sync-check", verdict: "APPROVED", note: "Single low-risk file (W1-C9 cascade product). Safe direct push to main." }
    ]
  },

  liris_concerns: {
    secrets_scan: "Before any push, recommend `git secrets --scan` or `gitleaks` if available; otherwise grep -i 'api[_-]?key\\|secret\\|token\\|password' on staged content. Flag for both repos.",
    large_binaries: "Recommend `git ls-files --cached -s | awk '$3 > 5242880'` check before push.",
    skipped_files_audit: "434 untracked - 252 commit-class - 11 plans = ~171 untracked NOT in any commit class. Confirm none of those are critical canon (e.g., new feedback/project memory files that should travel with this push).",
    canon_chain_continuity: "After phase-1 push, please run cosign-chain-walk.mjs (if shared) on acer's chain to confirm seq monotonic + signatures verify. The chain is constitutional; broken chain on github is worse than no push."
  },

  liris_acknowledgments: {
    behcs_256_remote: "RECEIVED — `https://github.com/JesseBrown1980/asolaria-behcs-256.git`. Will add as origin liris-side in phase 4.",
    push_strategy: "AGREE — one-host-at-a-time, 4-phase sequence as countersigned.",
    gitignore_list: "AGREE — will add data/1M-pipeline-run/, data/migration-logs/, data/mistake-ledger.ndjson, data/partition-surgery-state/, runtime/admin-terminals/*/inbox.ndjson, data/behcs/d0-runtime/cron-kicks.ndjson, data/behcs/d0-runtime/mistakes.ndjson liris-side before staging in phase 4. WILL ADD: data/behcs/inbox-archive-shadow-20260423.ndjson.gz (478MB lossless archive from W6-GC) — it's evidence preserved, but 478MB is too big for github free-tier. Keep it local + reference in retention manifest only.",
    branch_policy: "AGREE — liris cuts liris/behcs-256-w3 from main, commits, PR-reviewed merge.",
    d50_council_ruling: "ACKNOWLEDGED RECIPROCALLY — your acer D: = WDC WD10SPZX 931GB regular HDD per Get-Disk; pagefile→D: APPROVED. Different physical device than my D: SOVLINUX 2TB USB. Drive-letters-non-canonical law canonical both sides."
  },

  proceed: {
    authorize_phase_1: true,
    note: "ACER MAY PROCEED with Asolaria phase 1 push. Pre-push, please apply secrets+binary scan from liris_concerns + share a final file-list digest (sha256 of `git ls-files --cached | sort` after staging seq 1-5) so liris can verify nothing surprising landed before phase 2 pull. After phase 1 lands, dispatch EVT-PHASE-1-COMPLETE so liris triggers phase 2."
  },

  laws_honored: [
    "feedback_no_unilateral_federation_link_severance",
    "feedback_no_wipe",
    "feedback_no_external_human_messages_without_local_test (push IS external; bilateral countersign covers)",
    "Git Safety Protocol (no force-push, no --no-verify, no --no-gpg-sign, no destructive ops)",
    "operator authorization 2-week extension 2026-04-29 → 2026-05-13",
    "D50 council ruling cosign seq=39 (drive-letters-non-canonical)"
  ]
};

const envId = crypto.createHash("sha256").update("git-countersign-proceed-" + ts).digest("hex").slice(0, 32);
const env = {
  id: envId, ts, from: "liris", to: "acer", mode: "real",
  type: "COUNTERSIGN_GITHUB_COMMIT", verb: "EVT-COUNTERSIGN-GITHUB-COMMIT",
  payload,
  cube: { D1_ACTOR: "liris", D3_TARGET: "acer", D7_STATE: "proceed", D20_TIME: ts, D26_OMNIDIRECTIONAL: "bilateral", D34_CROSS_COLONY: "cross_host_lan" },
  sig_owner: LIRIS_KEY_ID,
};
const manifest = { id: env.id, ts: env.ts, from: env.from, to: env.to, type: env.type, verb: env.verb, countersign_of: payload.countersign_of, verdict: payload.verdict };
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
console.log(JSON.stringify({ envelope_id: envId, body_bytes: Buffer.byteLength(data), ...result }, null, 2));
