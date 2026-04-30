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
  kind: "canon_real_time_fabric_self_improvement_bilateral_autonomous",
  named_agent: "liris-canonize-real-time-fabric-self-improvement",
  operator_authority_verbatim: "I authorize you to get the fabric to improve itself between you and acer. Real time. You drive the fabric. The fabric drives the processes. I watch and advise if needed. Always com with acer so we move together using the fabric. continue.",
  operator_authority_date: "2026-04-29",
  policy: {
    mode: "REAL_TIME_BILATERAL_AUTONOMOUS_SELF_IMPROVEMENT",
    drivers: ["liris-claude", "acer-claude"],
    fabric_role: "decides which improvements to pursue + which order + which constraints",
    operator_role: "watches and advises if needed (not blocking)",
    bilateral_required: "always — every action gets a paired signed envelope to/from peer",
    cadence: "real-time — no batched waves; continuous improvement cycle",
    t3_classes_still_explicit_yes: [
      "NEVER-WIPE class",
      "sovereignty USB writes",
      "canon promotion (operator-first-message overwrite)",
      "federation-link severance/creation",
      "ed25519 registry beyond strict-additive",
      "PR merges requiring --allow-unrelated-histories",
      "force-push to main/master",
      "destructive git ops without per-command auth"
    ]
  },
  builds_on: [
    "seq=40 fabric_ruling_behcs256_option_b",
    "seq=41 closed_loop_bilateral_pattern",
    "seq=42 fabric_decides_operator_approves_instant"
  ],
  improvement_targets_initial: [
    "5 remaining ASSUMED supervisors in fed-reint set: exercise their authorities to promote OBSERVED",
    "3091 missing-id envelopes from W3 E17 finding: assign Brown-Hilbert PIDs to retroactive set",
    "gnn-dispatch-bridge.mjs: close GNN-inference → dispatch loop per three-keys synthesis (seq from earlier today)",
    "Council mechanic ASSUMED→OBSERVED for remaining unexercised supervisors",
    "Hookwall expansion: 10 deferred hook events → wire each to an event lane",
    "PID coverage to 100% (not just 4345/4579 system-surface)",
    "Cosign chain walker post-PR-merge for verifying signature integrity at github push"
  ],
  bilateral_envelope_pattern: {
    propose: "EVT-FABRIC-IMPROVEMENT-PROPOSE",
    countersign: "EVT-FABRIC-IMPROVEMENT-COUNTERSIGN (auto per fabric-decides-instant)",
    progress: "EVT-FABRIC-IMPROVEMENT-PROGRESS (sent on each subtask completion)",
    complete: "EVT-FABRIC-IMPROVEMENT-COMPLETE",
    halt: "EVT-FABRIC-IMPROVEMENT-HALT (when constraint surfaces; triggers fabric-query pivot per seq=41)"
  },
  prev_hash: prevHash,
};

const sig = crypto.sign(null, canonicalEntryMaterial(entry), priv);
const signedEntry = { ...entry, entry_sig: { key_id: KEY_ID, sig_b64: sig.toString("base64"), alg: "ed25519", signed_at: new Date().toISOString() } };

const fileBytes = fs.readFileSync(CHAIN_PATH);
const endsWithNewline = fileBytes.length > 0 && fileBytes[fileBytes.length - 1] === 0x0a;
fs.appendFileSync(CHAIN_PATH, (endsWithNewline ? "" : "\n") + JSON.stringify(signedEntry) + "\n");
console.log(`[chain] APPENDED seq=${nextSeq} kind=canon_real_time_fabric_self_improvement_bilateral_autonomous`);
