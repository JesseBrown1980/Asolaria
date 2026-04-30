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
  kind: "canon_precedent_fabric_decides_operator_approves_instant",
  named_agent: "liris-canonize-fabric-decides-instant",
  operator_authority_verbatim: "the fabric decides. operator approval on fabric decisions. Instant.",
  operator_authority_date: "2026-04-29",
  policy: {
    fabric_ruling_pre_approved: true,
    veto_window_ms: 0,
    invocation: "instant_execute_on_fabric_green",
    blocked_classes_t3_remain_explicit_yes: [
      "NEVER-WIPE class (factory reset, history rewrite, force-push)",
      "sovereignty USB writes (D: on liris)",
      "canon promotion (OPERATOR-FIRST-MESSAGE.txt overwrite)",
      "federation-link severance/creation",
      "ed25519 registry mutation beyond strict-additive",
      "drive-letter cross-host operations not pre-cleared by hardware fingerprint",
      "PR merges requiring --allow-unrelated-histories"
    ],
    fabric_supervisors_authoritative: [
      "BH.SUPERVISOR.PID.FED.REINTEGRATION.HOOKWALL.BOUNDARY",
      "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET",
      "BH.SUPERVISOR.PID.FED.REINTEGRATION.SHANNON.TRUST",
      "BH.SUPERVISOR.PID.FED.REINTEGRATION.D50.COUNCIL"
    ],
    receipts_required: "every fabric-decided action emits cosign chain entry + bilateral envelope"
  },
  builds_on: ["seq=40 fabric_ruling_behcs256_option_b", "seq=41 closed_loop_bilateral_pattern"],
  applies_immediately_to: "current open board items 1-7",
  prev_hash: prevHash,
};

const sig = crypto.sign(null, canonicalEntryMaterial(entry), priv);
const signedEntry = { ...entry, entry_sig: { key_id: KEY_ID, sig_b64: sig.toString("base64"), alg: "ed25519", signed_at: new Date().toISOString() } };

const fileBytes = fs.readFileSync(CHAIN_PATH);
const endsWithNewline = fileBytes.length > 0 && fileBytes[fileBytes.length - 1] === 0x0a;
fs.appendFileSync(CHAIN_PATH, (endsWithNewline ? "" : "\n") + JSON.stringify(signedEntry) + "\n");
console.log(`[chain] APPENDED seq=${nextSeq} kind=canon_precedent_fabric_decides_operator_approves_instant`);
