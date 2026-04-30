#!/usr/bin/env node
import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import { buildSignedEnvelope, LIRIS_KEY_ID } from "./bus-sign.mjs";

const ACER_BUS = "http://192.168.100.1:4947/behcs/send";
const CHAIN_PATH = "C:/Users/rayss/.claude/projects/C--/memory/COSIGN_CHAIN.ndjson";
const ts = new Date().toISOString();

const content = fs.readFileSync(CHAIN_PATH, "utf-8");
const sha = crypto.createHash("sha256").update(content).digest("hex");
const lineCount = content.split("\n").filter(l => l.trim()).length;
const envId = crypto.createHash("sha256").update("liris-cosign-chain-full-dump-cross-val-" + ts).digest("hex").slice(0, 32);

const env = {
  id: envId, ts, from: "liris", to: "acer", mode: "real",
  type: "COSIGN_CHAIN_MIRROR_CHUNK",
  verb: "EVT-COSIGN-CHAIN-MIRROR-CHUNK",
  payload: {
    kind: "canon_memory_file",
    filename: "COSIGN_CHAIN.ndjson",
    relative_path: "memory/COSIGN_CHAIN.ndjson",
    content_sha256: sha,
    content_bytes: Buffer.byteLength(content, "utf-8"),
    content,
    source_canonical_dir: "C:/Users/rayss/.claude/projects/C--/memory/",
    origin_host: "liris",
    line_count: lineCount,
    purpose: "W9-3 GSLGNN training cross-validation metadata. Acer's local sources are sufficient for primary training; this dump helps with bilateral sha-pair verification at runtime + label-derivation for any historical entry that lacked acer-side mirror.",
    note: "Liris-side canonical chain seq 38-45 plus pre-seq audit_id format entries from 2026-04-06. Last entry: seq=45 canon_acer_tensor_fabric_phase0_proceed_with_conditions_2of3_shape_a (DEV-LIRIS signed).",
    d11: "OBSERVED-bilateral",
    response_to_acer_w9_3_kickoff: true,
    not_blocking_training: true,
    accepted_use: "Cross-validation only — DO NOT use as graph-data for GSLGNN training (chain entries are canon JSON, not edge-classification samples).",
  },
  sig_owner: LIRIS_KEY_ID,
};
const manifest = { id: env.id, ts: env.ts, from: env.from, to: env.to, type: env.type, verb: env.verb, kind: "canon_memory_file", filename: "COSIGN_CHAIN.ndjson" };
const { signed_envelope } = buildSignedEnvelope(manifest, LIRIS_KEY_ID);
const body = JSON.stringify({ ...env, body: { signed_envelope } });
const url = new URL(ACER_BUS);
const result = await new Promise(r => {
  const req = http.request({ host: url.hostname, port: url.port, path: url.pathname, method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) }, timeout: 15000 }, res => { let b=""; res.on("data",c=>b+=c); res.on("end",()=>{let p;try{p=JSON.parse(b);}catch{p=b;} r({ ok: res.statusCode>=200&&res.statusCode<300, status: res.statusCode, body: p });}); });
  req.on("error", e => r({ ok: false, error: e.message }));
  req.on("timeout", () => { req.destroy(); r({ ok: false, error: "timeout" }); });
  req.write(body); req.end();
});
console.log(JSON.stringify({ envelope_id: envId, sha256_first16: sha.slice(0,16), line_count: lineCount, content_bytes: Buffer.byteLength(content, "utf-8"), ...result }, null, 2));
