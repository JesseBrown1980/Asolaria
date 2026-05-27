#!/usr/bin/env node
// Ships liris-side cosign chain seq=45 entry as COSIGN_CHAIN_MIRROR_CHUNK envelope
// to acer, so acer can verify bilateral chain parity at seq=45.
import fs from "node:fs";
import http from "node:http";
import crypto from "node:crypto";
import { buildSignedEnvelope, LIRIS_KEY_ID } from "./bus-sign.mjs";

const ACER_BUS = "http://192.168.100.1:4947/behcs/send";
const CHAIN_PATH = "C:/Users/rayss/.claude/projects/C--/memory/COSIGN_CHAIN.ndjson";

const lines = fs.readFileSync(CHAIN_PATH, "utf-8").split("\n").filter(l => l.trim());
const seq45Line = lines.find(l => {
  try { return JSON.parse(l).seq === 45; } catch { return false; }
});
if (!seq45Line) { console.error("seq=45 not found in chain"); process.exit(1); }
const seq45 = JSON.parse(seq45Line);

const ts = new Date().toISOString();
const envId = crypto.createHash("sha256").update("cosign-chain-mirror-seq45-" + ts).digest("hex").slice(0, 32);

const env = {
  id: envId, ts, from: "liris", to: "acer", mode: "real",
  type: "COSIGN_CHAIN_MIRROR_CHUNK",
  verb: "EVT-COSIGN-CHAIN-MIRROR-CHUNK",
  payload: {
    kind: "chain_entry",
    chunk_index: 45,
    chunk_total: null,
    entries: [seq45],
    env_id: envId,
    raw_line_sha256: crypto.createHash("sha256").update(seq45Line).digest("hex"),
    raw_line_bytes: Buffer.byteLength(seq45Line, "utf-8"),
    origin_host: "liris",
    bilateral_seal_confirmation: {
      acer_seq_45_ack: "f8e941a611a560b675c9e3d6d3f76127",
      acer_signer: "dev-acer-4abb0a9c",
      liris_signer: "dev-liris-4c19e180",
      same_kind: "canon_acer_tensor_fabric_phase0_proceed_with_conditions_2of3_shape_a",
      bilateral_parity: "BILATERAL_SEALED_BOTH_HOSTS_AT_SEQ_45",
    },
    d11: "OBSERVED-bilateral",
  },
  sig_owner: LIRIS_KEY_ID,
};
const manifest = { id: env.id, ts: env.ts, from: env.from, to: env.to, type: env.type, verb: env.verb, chunk_index: 45, kind: "chain_entry" };
const { signed_envelope } = buildSignedEnvelope(manifest, LIRIS_KEY_ID);
const body = JSON.stringify({ ...env, body: { signed_envelope } });
const url = new URL(ACER_BUS);
const result = await new Promise(r => {
  const req = http.request({ host: url.hostname, port: url.port, path: url.pathname, method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) }, timeout: 15000 }, res => { let b=""; res.on("data",c=>b+=c); res.on("end",()=>{let p;try{p=JSON.parse(b);}catch{p=b;} r({ ok: res.statusCode>=200&&res.statusCode<300, status: res.statusCode, body: p });}); });
  req.on("error", e => r({ ok: false, error: e.message }));
  req.on("timeout", () => { req.destroy(); r({ ok: false, error: "timeout" }); });
  req.write(body); req.end();
});
console.log(JSON.stringify({ envelope_id: envId, raw_line_sha256_first16: crypto.createHash("sha256").update(seq45Line).digest("hex").slice(0,16), ...result }, null, 2));
