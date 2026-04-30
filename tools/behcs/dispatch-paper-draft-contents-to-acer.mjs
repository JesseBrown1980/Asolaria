#!/usr/bin/env node
// dispatch-paper-draft-contents-to-acer.mjs — Ship the 3 paper-draft files as
// COSIGN_CHAIN_MIRROR_CHUNK envelopes (kind=canon_memory_file shape, which is
// what acer's ingest-liris-canon-files.mjs ingester accepts).
//
// Pairs with dispatch-canon-mirror-chunks-to-acer.mjs which already shipped
// the 5 canon memory files + paper-draft-paths manifest.
import fs from "node:fs";
import http from "node:http";
import crypto from "node:crypto";
import { buildSignedEnvelope, LIRIS_KEY_ID } from "./bus-sign.mjs";

const ACER_BUS = "http://192.168.100.1:4947/behcs/send";

const PAPER_DRAFT_FILES = [
  {
    abs: "C:/Users/rayss/Asolaria/data/omni-processor/paper-draft/incoming/paper-draft/v10-draft-section-9-6-federation-self-tensor-collapse-acer.md",
    rel: "data/omni-processor/paper-draft/incoming/paper-draft/v10-draft-section-9-6-federation-self-tensor-collapse-acer.md",
    src_dir: "C:/Users/rayss/Asolaria/data/omni-processor/paper-draft/incoming/paper-draft/",
    filename: "v10-draft-section-9-6-federation-self-tensor-collapse-acer.md",
  },
  {
    abs: "C:/Users/rayss/Asolaria/reports/cube-analysis/federation-self-tensor-collapse-2026-04-07.md",
    rel: "reports/cube-analysis/federation-self-tensor-collapse-2026-04-07.md",
    src_dir: "C:/Users/rayss/Asolaria/reports/cube-analysis/",
    filename: "federation-self-tensor-collapse-2026-04-07.md",
  },
  {
    abs: "C:/Users/rayss/Asolaria/data/omni-processor/paper-draft/incoming/paper-draft/federation-self-tensor-collapse-acer-side.md",
    rel: "data/omni-processor/paper-draft/incoming/paper-draft/federation-self-tensor-collapse-acer-side.md",
    src_dir: "C:/Users/rayss/Asolaria/data/omni-processor/paper-draft/incoming/paper-draft/",
    filename: "federation-self-tensor-collapse-acer-side.md",
  },
];

async function postEnvelope(env) {
  const manifest = { id: env.id, ts: env.ts, from: env.from, to: env.to, type: env.type, verb: env.verb, chunk_filename: env.payload?.filename };
  const { signed_envelope } = buildSignedEnvelope(manifest, LIRIS_KEY_ID);
  const body = JSON.stringify({ ...env, body: { signed_envelope } });
  const url = new URL(ACER_BUS);
  return new Promise((r) => {
    const req = http.request({ host: url.hostname, port: url.port, path: url.pathname, method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) }, timeout: 15000 },
      (res) => { let b=""; res.on("data",c=>b+=c); res.on("end",()=>{let p;try{p=JSON.parse(b);}catch{p=b;} r({ id: env.id, status: res.statusCode, body: p });}); });
    req.on("error", e => r({ id: env.id, error: e.message }));
    req.on("timeout", () => { req.destroy(); r({ id: env.id, error: "timeout" }); });
    req.write(body); req.end();
  });
}

const results = [];
for (const f of PAPER_DRAFT_FILES) {
  if (!fs.existsSync(f.abs)) { console.log(`[skip] ${f.filename} not found`); continue; }
  const content = fs.readFileSync(f.abs, "utf-8");
  const sha = crypto.createHash("sha256").update(content).digest("hex");
  const ts = new Date().toISOString();
  const envId = crypto.createHash("sha256").update(`paper-draft-${f.filename}-${ts}`).digest("hex").slice(0, 32);
  const env = {
    id: envId, ts, from: "liris", to: "acer", mode: "real",
    type: "COSIGN_CHAIN_MIRROR_CHUNK",
    verb: "EVT-COSIGN-CHAIN-MIRROR-CHUNK",
    payload: {
      kind: "canon_memory_file",
      filename: f.filename,
      relative_path: f.rel,
      content_sha256: sha,
      content_bytes: Buffer.byteLength(content, "utf-8"),
      content,
      source_canonical_dir: f.src_dir,
      origin_host: "liris",
      d11: "OBSERVED-bilateral",
      paper_draft_lineage: "v8/v9/v10 federation-self-tensor-collapse 46656-beats → 47-signals → 3-voters 0.97 PROCEED",
    },
    sig_owner: LIRIS_KEY_ID,
  };
  const r = await postEnvelope(env);
  console.log(`[chunk] ${f.filename} sha=${sha.slice(0,12)}… bytes=${Buffer.byteLength(content,"utf-8")} → ${r.id} status=${r.status} sig=${r.body?.sig_verdict ?? "?"}`);
  results.push({ filename: f.filename, sha, bytes: Buffer.byteLength(content,"utf-8"), env_id: envId, status: r.status, sig_verdict: r.body?.sig_verdict });
}
console.log("\n=== summary ===");
for (const r of results) console.log(`  ${r.filename}: ${r.sig_verdict ?? "no-resp"} ${r.bytes}B ${r.env_id}`);
