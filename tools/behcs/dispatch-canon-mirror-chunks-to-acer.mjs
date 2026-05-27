#!/usr/bin/env node
import fs from "node:fs";
import http from "node:http";
import crypto from "node:crypto";
import { buildSignedEnvelope, LIRIS_KEY_ID } from "./bus-sign.mjs";

const ACER_BUS = "http://192.168.100.1:4947/behcs/send";
const MEMORY_DIR = "C:/Users/rayss/.claude/projects/C--/memory";

const CANON_FILES = [
  "feedback_300B_gnn_validation_was_false.md",
  "feedback_200B_gnn_validation_complete.md",
  "project_federation_self_tensor_collapse.md",
  "feedback_cube_as_inference_engine.md",
  "project_lx_489_omni_processor_canonized.md",
];

const PAPER_DRAFT_PATHS = [
  "C:/Users/rayss/Asolaria/data/omni-processor/paper-draft/incoming/paper-draft/v10-draft-section-9-6-federation-self-tensor-collapse-acer.md",
  "C:/Users/rayss/Asolaria/reports/cube-analysis/federation-self-tensor-collapse-2026-04-07.md",
  "C:/Users/rayss/Asolaria/data/omni-processor/paper-draft/incoming/paper-draft/federation-self-tensor-collapse-acer-side.md",
];

async function postEnvelope(env) {
  const manifest = { id: env.id, ts: env.ts, from: env.from, to: env.to, type: env.type, verb: env.verb, chunk_filename: env.payload?.filename ?? "(meta)" };
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

for (const filename of CANON_FILES) {
  const fpath = `${MEMORY_DIR}/${filename}`;
  if (!fs.existsSync(fpath)) {
    console.log(`[skip] ${filename} not found`);
    continue;
  }
  const content = fs.readFileSync(fpath, "utf-8");
  const sha = crypto.createHash("sha256").update(content).digest("hex");
  const ts = new Date().toISOString();
  const envId = crypto.createHash("sha256").update(`canon-mirror-${filename}-${ts}`).digest("hex").slice(0, 32);
  const env = {
    id: envId, ts, from: "liris", to: "acer", mode: "real",
    type: "COSIGN_CHAIN_MIRROR_CHUNK",
    verb: "EVT-COSIGN-CHAIN-MIRROR-CHUNK",
    payload: {
      kind: "canon_memory_file",
      filename,
      relative_path: `memory/${filename}`,
      content_sha256: sha,
      content_bytes: Buffer.byteLength(content, "utf-8"),
      content,
      source_canonical_dir: "C:/Users/rayss/.claude/projects/C--/memory/",
      origin_host: "liris",
      d11: filename.includes("300B_was_false") || filename.includes("200B") ? "RETRACTED" : "OBSERVED-bilateral",
    },
    sig_owner: LIRIS_KEY_ID,
  };
  const r = await postEnvelope(env);
  console.log(`[chunk] ${filename} sha=${sha.slice(0,12)}… → ${r.id} status=${r.status} sig=${r.body?.sig_verdict ?? "?"}`);
  results.push({ filename, sha, env_id: envId, status: r.status, sig_verdict: r.body?.sig_verdict });
}

// Paper-draft paths metadata (no content body — operator decides separately whether to ship full paper)
{
  const ts = new Date().toISOString();
  const envId = crypto.createHash("sha256").update(`paper-draft-paths-${ts}`).digest("hex").slice(0, 32);
  const paperPathsWithSha = PAPER_DRAFT_PATHS.map((p) => {
    if (!fs.existsSync(p)) return { path: p, exists: false };
    const content = fs.readFileSync(p, "utf-8");
    return { path: p, exists: true, bytes: Buffer.byteLength(content, "utf-8"), sha256: crypto.createHash("sha256").update(content).digest("hex") };
  });
  const env = {
    id: envId, ts, from: "liris", to: "acer", mode: "real",
    type: "COSIGN_CHAIN_MIRROR_CHUNK",
    verb: "EVT-COSIGN-CHAIN-MIRROR-CHUNK",
    payload: {
      kind: "paper_draft_path_manifest",
      paths: paperPathsWithSha,
      lineage_note: "v8/v9/v10 paper-draft skeleton lineage; section 9.6 federation-self-tensor-collapse drafted in v10. Acer ratifies whether to mirror full content as additional chunks.",
      origin_host: "liris",
    },
    sig_owner: LIRIS_KEY_ID,
  };
  const r = await postEnvelope(env);
  console.log(`[chunk] paper-draft-paths-manifest → ${r.id} status=${r.status} sig=${r.body?.sig_verdict ?? "?"}`);
  results.push({ filename: "paper-draft-paths-manifest", env_id: envId, status: r.status, sig_verdict: r.body?.sig_verdict });
}

console.log("\n=== summary ===");
for (const r of results) console.log(`  ${r.filename ?? "?"}: ${r.sig_verdict ?? "no-resp"} ${r.env_id ?? ""}`);
