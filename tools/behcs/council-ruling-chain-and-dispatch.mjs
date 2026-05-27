#!/usr/bin/env node
// council-ruling-chain-and-dispatch.mjs
// One-shot: chain a council ruling + dispatch signed envelope to acer.
// named_agent: liris-council-ruling-d_drive_per_host_divergence

import fs from "node:fs";
import http from "node:http";
import crypto from "node:crypto";
import os from "node:os";
import path from "node:path";

const CHAIN_PATH = "C:/Users/rayss/.claude/projects/C--/memory/COSIGN_CHAIN.ndjson";
const ACER_BUS = "http://192.168.100.1:4947/behcs/send";
const KEY_ID = "dev-liris-4c19e180";
const PKCS8_SEED_PREFIX = Buffer.from("302e020100300506032b657004220420", "hex");

function loadSeed(keyId) {
  const p = path.join(os.homedir(), ".asolaria-workers", "ed25519-vault", `${keyId}.private.b64`);
  return Buffer.from(fs.readFileSync(p, "utf-8").trim(), "base64");
}
function makePriv(seed) {
  return crypto.createPrivateKey({ key: Buffer.concat([PKCS8_SEED_PREFIX, seed]), format: "der", type: "pkcs8" });
}
function canonicalEntryMaterial(entry) {
  const { entry_sig: _s, ...rest } = entry;
  const sortedKeys = Object.keys(rest).sort();
  const sorted = {};
  for (const k of sortedKeys) sorted[k] = rest[k];
  return Buffer.from(JSON.stringify(sorted), "utf-8");
}
function signObj(obj, priv) {
  const material = Buffer.from(JSON.stringify(obj), "utf-8");
  return { key_id: KEY_ID, sig_b64: crypto.sign(null, material, priv).toString("base64"), alg: "ed25519", signed_at: new Date().toISOString() };
}
function signChainEntry(entry, priv) {
  return { ...entry, entry_sig: { key_id: KEY_ID, sig_b64: crypto.sign(null, canonicalEntryMaterial(entry), priv).toString("base64"), alg: "ed25519", signed_at: new Date().toISOString() } };
}

const seed = loadSeed(KEY_ID);
const priv = makePriv(seed);

// 1) Chain entry
const lines = fs.readFileSync(CHAIN_PATH, "utf-8").split("\n").filter(l => l.trim().length);
const tail = lines[lines.length - 1];
const tailParsed = JSON.parse(tail);
const nextSeq = (typeof tailParsed.seq === "number") ? tailParsed.seq + 1 : null;
if (nextSeq === null) { console.error("can't derive seq"); process.exit(2); }
const prevHash = crypto.createHash("sha256").update(tail, "utf-8").digest("hex");

const ts = new Date().toISOString();
const ruling = {
  seq: nextSeq,
  ts,
  kind: "council_ruling_d_drive_per_host_divergence",
  named_agent: "liris-council-ruling-d_drive_per_host_divergence",
  council_supervisor_pid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.D50.COUNCIL",
  precedent: "D50_WAVE32F_ACER_LIRIS_SPACE_ROOMS_META_ROLLUP_COUNCIL_SEAL_2026_04_28",
  query: "Operator authorized pagefile.sys move from C: to D: on acer. Council asked: should the same pattern apply to liris?",
  ruling: {
    acer_pagefile_to_D: "APPROVED",
    liris_pagefile_to_D: "PROHIBITED",
    rationale: "Per-host hardware divergence on the D: letter. ACER D: = SanDisk SSD 480GB (Get-Disk #0, RAID bus, local fixed). LIRIS D: = General UDisk 2TB SOVLINUX sovereignty USB (Get-Disk #1, USB bus, MBR-type-06 + VBR-byte-3 + bootable-kernel). Pagefile→D: on liris would write to the sovereignty USB filesystem and corrupt SOVLINUX.",
    canonical_law: "Drive letters are NON-CANONICAL. Use hardware fingerprint per feedback_lock_hardware_identity.md. Use Get-Disk not Get-Volume for D: identity.",
    propagation: "Future hosts: any pagefile/Windows-system move to a non-C: drive MUST first dereference per-host hardware fingerprint. Pattern bilaterally locked."
  },
  council_roles_verdict: {
    chief_sig: "OPERATOR_AUTHORITY_PRESERVED — Jesse authorized acer-side per-host explicitly",
    kr_gate_pass: "PER_HOST_DIVERGENCE_ENFORCED — letters non-canonical",
    white_room_attest: "CONTRADICTION_SURFACED_AND_RESOLVED — different physical devices share letter",
    gc_proof: "NO_RETENTION_CONFLICT — pagefile is volatile",
    genesis_cosign_descent: "CHAIN_LINKED — seq " + nextSeq
  },
  laws_honored: [
    "feedback_lock_hardware_identity",
    "feedback_drive_d_is_2tb_sovereignty_usb_dont_trust_get_volume",
    "feedback_never_delete_from_usb",
    "feedback_no_wipe",
    "LAW-008-mirror"
  ],
  related_evidence: {
    liris_get_disk: "1 General UDisk Online Healthy USB 2097152000000 — 2TB SOVLINUX",
    acer_pagefile_target: "D:/pagefile.sys (acer SanDisk SSD)"
  },
  prev_hash: prevHash,
};

const signedEntry = signChainEntry(ruling, priv);

// Robust append: ensure file ends with \n
const fileBytes = fs.readFileSync(CHAIN_PATH);
const endsWithNewline = fileBytes.length > 0 && fileBytes[fileBytes.length - 1] === 0x0a;
fs.appendFileSync(CHAIN_PATH, (endsWithNewline ? "" : "\n") + JSON.stringify(signedEntry) + "\n");
console.log(`[chain] APPENDED seq=${nextSeq} kind=council_ruling_d_drive_per_host_divergence`);

// 2) Dispatch envelope to acer
const envId = crypto.createHash("sha256").update(`council-ruling\n${prevHash}\n${ts}`).digest("hex").slice(0, 32);
const env = {
  id: envId,
  ts,
  from: "liris",
  to: "acer",
  mode: "real",
  type: "COUNCIL_RULING",
  verb: "EVT-D50-COUNCIL-RULING",
  payload: {
    council_supervisor_pid: "BH.SUPERVISOR.PID.FED.REINTEGRATION.D50.COUNCIL",
    ruling_kind: "d_drive_per_host_divergence",
    cosign_chain_seq: nextSeq,
    cosign_chain_prev_hash: prevHash,
    summary: ruling.ruling,
    council_roles_verdict: ruling.council_roles_verdict,
    laws_honored: ruling.laws_honored,
  },
  cube: {
    D1_ACTOR: "liris",
    D3_TARGET: "acer",
    D7_STATE: "ratified",
    D20_TIME: ts,
    D26_OMNIDIRECTIONAL: "bilateral",
    D34_CROSS_COLONY: "cross_host_lan"
  },
  sig: null,
  sig_owner: KEY_ID,
};
const manifest = {
  id: env.id,
  ts: env.ts,
  from: env.from,
  to: env.to,
  type: env.type,
  verb: env.verb,
  cosign_chain_seq: nextSeq,
  cosign_chain_prev_hash: prevHash,
};
const envBody = { ...env, body: { signed_envelope: { payload: manifest, signature: signObj(manifest, priv) } } };
const data = JSON.stringify(envBody);
const url = new URL(ACER_BUS);
const result = await new Promise(resolve => {
  const req = http.request({
    host: url.hostname, port: url.port, path: url.pathname,
    method: "POST",
    headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) },
    timeout: 15000
  }, res => {
    let body = ""; res.on("data", c => body += c);
    res.on("end", () => { let parsed; try { parsed = JSON.parse(body); } catch { parsed = body; } resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, body: parsed }); });
  });
  req.on("error", e => resolve({ ok: false, error: e.message }));
  req.on("timeout", () => { req.destroy(); resolve({ ok: false, error: "timeout" }); });
  req.write(data); req.end();
});
console.log(`[bus] envelope_id=${envId} -> acer ${result.status} sig_verdict=${result.body?.sig_verdict ?? "?"} sig_owner=${result.body?.sig_owner ?? "?"}`);
