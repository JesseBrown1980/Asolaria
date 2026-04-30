#!/usr/bin/env node
import fs from "node:fs";
import crypto from "node:crypto";
import os from "node:os";
import path from "node:path";

const CHAIN_PATH = "C:/Users/rayss/.claude/projects/C--/memory/COSIGN_CHAIN.ndjson";
const KEY_ID = "dev-liris-4c19e180";
const PKCS8 = Buffer.from("302e020100300506032b657004220420", "hex");

const seed = Buffer.from(fs.readFileSync(path.join(os.homedir(), ".asolaria-workers", "ed25519-vault", `${KEY_ID}.private.b64`), "utf-8").trim(), "base64");
const priv = crypto.createPrivateKey({ key: Buffer.concat([PKCS8, seed]), format: "der", type: "pkcs8" });

function canonicalEntryMaterial(entry) {
  const { entry_sig: _s, ...rest } = entry;
  const sortedKeys = Object.keys(rest).sort();
  const sorted = {};
  for (const k of sortedKeys) sorted[k] = rest[k];
  return Buffer.from(JSON.stringify(sorted), "utf-8");
}

const lines = fs.readFileSync(CHAIN_PATH, "utf-8").split("\n").filter(l => l.trim());
const tail = lines[lines.length - 1];
const tailParsed = JSON.parse(tail);
const nextSeq = (typeof tailParsed.seq === "number") ? tailParsed.seq + 1 : null;
const prevHash = crypto.createHash("sha256").update(tail, "utf-8").digest("hex");

const entry = {
  seq: nextSeq,
  ts: new Date().toISOString(),
  kind: "fabric_ruling_behcs256_option_b",
  named_agent: "liris-fabric-query-github-LFS-blocker",
  query: "GitHub push of liris-canonical-2026-04-10 branch rejected by github 100MB hook (data/pid-100B-ramp/scale-1M.ndjson 237MB + scale-10M.ndjson 2.3GB committed in 18f9fed). Pivot: A' install git-filter-repo / B cherry-pick final-state / E install Git LFS.",
  fabric_supervisors_consulted: [
    { pid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HOOKWALL.BOUNDARY", auth: "deny_write_class_until_cosigned", verdict: "BLOCK_OPTIONS_A_PRIME_AND_E", reason: "Both require installs (pip git-filter-repo or Git LFS). Installs are write-class against local environment; require explicit cosign which is not present for that scope." },
    { pid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET", auth: "require_packet_before_action", verdict: "FAVOR_B", reason: "Single focused commit = single ratifiable packet. Cleanest packet boundary." },
    { pid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.SHANNON.TRUST", auth: "block_multi_peer_promotion", verdict: "FAVOR_B", reason: "One trust decision. Option B is one trust decision (final-state of 10 files). Options A'/E spread trust across rewrite tooling + LFS provider." },
    { pid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.D50.COUNCIL", auth: "require_d50_before_bound_transition", verdict: "FAVOR_B", reason: "Minimal-bound transition. B touches origin/main lineage minimally. A' and E both rewrite or restructure history — larger bound." }
  ],
  ruling: {
    decision: "OPTION_B",
    rationale: "Cherry-pick final-state of liris W3-cascade modifications onto fresh branch off origin/main. No installs. No history rewrite. Local liris main retains all 139 commits + big files (no wipe). Pushed branch is focused subset of meaningful new content (W3-1 vision-keyboard-supervisor + COSIGN_CHAIN updates + kernel changes).",
    blocking_findings_overridden: [],
    install_class_authorization_required_for: ["A'", "E"],
    operator_authority: "yes 2026-04-29 (fix github now) + authorized 2026-04-29 (Option A pivot) + 'Ask the fabric' 2026-04-29",
    fabric_authority: "Bilateral consensus across HOOKWALL.BOUNDARY + HERMES.PACKET + SHANNON.TRUST + D50.COUNCIL"
  },
  laws_honored: [
    "feedback_no_wipe (local main intact)",
    "feedback_no_unilateral_federation_link_severance",
    "Git Safety Protocol (no force-push, no destructive on shared state — local-only branch reset is safe)",
    "deny_write_class_until_cosigned (no installs)"
  ],
  prev_hash: prevHash,
};

const sig = crypto.sign(null, canonicalEntryMaterial(entry), priv);
const signedEntry = { ...entry, entry_sig: { key_id: KEY_ID, sig_b64: sig.toString("base64"), alg: "ed25519", signed_at: new Date().toISOString() } };

const fileBytes = fs.readFileSync(CHAIN_PATH);
const endsWithNewline = fileBytes.length > 0 && fileBytes[fileBytes.length - 1] === 0x0a;
fs.appendFileSync(CHAIN_PATH, (endsWithNewline ? "" : "\n") + JSON.stringify(signedEntry) + "\n");
console.log(`[chain] APPENDED seq=${nextSeq} kind=fabric_ruling_behcs256_option_b`);
