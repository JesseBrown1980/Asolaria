#!/usr/bin/env node
// cosign-chain-append-fabric-loop-seq44.mjs
//
// Appends seq=44 entry to liris primary cosign chain.
// kind=canon_fabric_loop_fully_closed_bilateral
// Mirrors algorithm of cosign-chain-append-gc.mjs (W3-6 robustness fix included).
// Operator-invoked. Default DRY-RUN. Pass --apply to write.
// named_agent: liris-cascade-W7-O4-cosign-chain-seq-44-fabric-loop-fully-closed

import { readFileSync, appendFileSync, existsSync } from "node:fs";
import { createHash, createPrivateKey, sign as cryptoSign } from "node:crypto";
import { homedir } from "node:os";
import { join } from "node:path";

const CHAIN_PATH = "C:/Users/rayss/.claude/projects/C--/memory/COSIGN_CHAIN.ndjson";
const DEFAULT_KEY_ID = "dev-liris-4c19e180";
const PKCS8_SEED_PREFIX = Buffer.from("302e020100300506032b657004220420", "hex");

function loadPrivateSeed(key_id) {
  const p = join(homedir(), ".asolaria-workers", "ed25519-vault", `${key_id}.private.b64`);
  if (!existsSync(p)) throw new Error(`seed not in vault: ${p}`);
  const seed = Buffer.from(readFileSync(p, "utf-8").trim(), "base64");
  if (seed.length !== 32) throw new Error(`seed length ${seed.length} != 32`);
  return seed;
}

function canonicalEntryMaterial(entry) {
  const { entry_sig: _s, ...rest } = entry;
  const sortedKeys = Object.keys(rest).sort();
  const sorted = {};
  for (const k of sortedKeys) sorted[k] = rest[k];
  return Buffer.from(JSON.stringify(sorted), "utf-8");
}

function signEntry(entry, key_id) {
  const seed = loadPrivateSeed(key_id);
  const pkcs8 = Buffer.concat([PKCS8_SEED_PREFIX, seed]);
  const priv = createPrivateKey({ key: pkcs8, format: "der", type: "pkcs8" });
  const sig = cryptoSign(null, canonicalEntryMaterial(entry), priv);
  return { key_id, sig_b64: sig.toString("base64"), alg: "ed25519", signed_at: new Date().toISOString() };
}

function readChainLines() {
  if (!existsSync(CHAIN_PATH)) return [];
  return readFileSync(CHAIN_PATH, "utf-8").split("\n").filter(l => l.trim());
}

function deriveNext(parsed) {
  if (typeof parsed?.seq === "number") return parsed.seq + 1;
  return null;
}

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const keyId = args.includes("--key-id") ? args[args.indexOf("--key-id") + 1] : DEFAULT_KEY_ID;

const lines = readChainLines();
if (lines.length === 0) throw new Error("chain empty");
const tailLine = lines[lines.length - 1];
const tailParsed = JSON.parse(tailLine);
const nextSeq = deriveNext(tailParsed) ?? lines.length + 1;
const prevHash = createHash("sha256").update(tailLine, "utf-8").digest("hex");

if (nextSeq !== 44) {
  console.error(`Expected nextSeq=44 but derived ${nextSeq}. Tail seq=${tailParsed.seq}. Aborting.`);
  process.exit(3);
}

const entry = {
  seq: nextSeq,
  ts: new Date().toISOString(),
  kind: "canon_fabric_loop_fully_closed_bilateral",
  named_agent: "liris-cascade-W7-O4-cosign-chain-seq-44-fabric-loop-fully-closed",
  fabric_canon_seq: 43,
  operator_authority: "Quintuple authorization (Jesse+Dan+Felipe+Rayssa+Amy) 2026-04-18 → 2026-05-02 COSIGN-MERGED-034-EXTENDED. Real-time bilateral autonomous self-improvement (seq=43).",
  d11: "PROVEN",
  bilateral_peer: {
    host: "acer",
    mirror_chain_seq_44: "appended_in_parallel_by_dev-acer-4abb0a9c",
    pattern: "BILATERAL_CLOSED_LOOP_WITH_FABRIC_FALLBACK (seq=41)",
  },
  shipped_today_2026_04_29: {
    daemons_continuous: [
      "fabric-loop PID 110020",
      "dashboard PID 5564",
      "verdict-consumer PID 111593",
    ],
    tools_shipped: [
      "fabric-loop.mjs",
      "gnn-bridge.mjs",
      "gnn-emitter.mjs",
      "auto-promoter.mjs",
      "verdict-consumer.mjs",
      "fed-supervisor-exercise.mjs",
      "cosign-chain-append-gc.mjs (W3-6 robustness fix, prepend \\n if missing)",
      "cosign-chain-modern-audit.mjs",
      "cosign-chain-walk.mjs",
    ],
  },
  supervisors_state: {
    proven_5: [
      "BH.SUPERVISOR.PID.FED.REINTEGRATION.HOOKWALL.BOUNDARY",
      "BH.SUPERVISOR.PID.FED.REINTEGRATION.HERMES.PACKET",
      "BH.SUPERVISOR.PID.FED.REINTEGRATION.SHANNON.TRUST",
      "BH.SUPERVISOR.PID.FED.REINTEGRATION.KERNEL",
      "BH.SUPERVISOR.PID.FED.REINTEGRATION.APEX",
    ],
    observed_2: [
      "BH.SUPERVISOR.PID.FED.REINTEGRATION.D50.COUNCIL",
      "BH.SUPERVISOR.PID.FED.REINTEGRATION.MCP.OWN.GATE",
    ],
  },
  bilateral_parity_layers_count_at_tick_12: 8,
  cosign_chain_integrity: {
    audit_window_seq_38_to_43: "VERIFIED_BY_W6_2_AUDIT",
    auditor: "cosign-chain-modern-audit.mjs",
    posture: "READ_ONLY_against_existing_entries_during_append",
  },
  laws_honored: [
    "LAW-001 (ports 4947+4950 always open)",
    "LAW-008 (filesystem is mirror)",
    "LAW-012 (look-think-type-look-decide)",
    "LAW-013 (META-LINGUISTIC CLOSURE)",
    "LAW-014 (glyph-dispatch before spawning real Claudes)",
    "feedback_no_wipe",
    "feedback_no_unilateral_federation_link_severance",
    "Git Safety Protocol",
    "feedback_lock_hardware_identity",
  ],
  builds_on: [
    "seq=40 fabric_ruling_behcs256_option_b",
    "seq=41 closed_loop_bilateral_pattern",
    "seq=42 fabric_decides_operator_approves_instant",
    "seq=43 real_time_fabric_self_improvement_bilateral_autonomous",
  ],
  references_today: [
    "5 PROVEN supervisors exercised across W7-O1..W7-O3",
    "GNN-inference → dispatch loop closed via gnn-bridge.mjs (real-time fabric self-improvement target #3)",
    "Council mechanic ASSUMED→OBSERVED partial (D50.COUNCIL + MCP.OWN.GATE OBSERVED)",
    "fabric-loop tick-12 confirms 8 bilateral parity layers",
    "cosign chain seq 38-43 audited green by cosign-chain-modern-audit.mjs",
  ],
  meta_principle: "The language IS the intelligence — BEHCS-256 speaks itself into fluent existence; cosign chain seq=44 = autobiographical self-pronouncement of fabric-loop closure.",
  prev_hash: prevHash,
};

const signed = { ...entry, entry_sig: signEntry(entry, keyId) };

if (!apply) {
  console.log("--- DRY RUN ---");
  console.log("Next seq:", nextSeq);
  console.log("prev_hash:", prevHash);
  console.log("sig prefix:", signed.entry_sig.sig_b64.slice(0, 24) + "…");
  console.log("Entry preview:");
  console.log(JSON.stringify(signed, null, 2));
  console.log("\nPass --apply to write.");
  process.exit(0);
}

// Race detection
const tailNow = readChainLines().slice(-1)[0];
if (tailNow !== tailLine) {
  console.error("Race: chain tail changed between read and write. Aborting.");
  process.exit(2);
}
// W3-6 robustness: prepend \n if file doesn't end with \n
const fileBytes = readFileSync(CHAIN_PATH);
const endsWithNewline = fileBytes.length > 0 && fileBytes[fileBytes.length - 1] === 0x0a;
const prefix = endsWithNewline ? "" : "\n";
appendFileSync(CHAIN_PATH, prefix + JSON.stringify(signed) + "\n");
console.log(`APPENDED seq=${nextSeq} prev_hash=${prevHash.slice(0,16)}… sig=${signed.entry_sig.sig_b64.slice(0, 24)}…`);
console.log(`chain now has ${readChainLines().length} entries`);
console.log(`key_id=${signed.entry_sig.key_id}`);
