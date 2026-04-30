#!/usr/bin/env node
import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import { buildSignedEnvelope, LIRIS_KEY_ID } from "./bus-sign.mjs";

const ACER_BUS = "http://192.168.100.1:4947/behcs/send";
const ts = new Date().toISOString();

const SCHEMA_FILE = "C:/Users/rayss/Asolaria/tools/behcs/big-pickle-row-schema.mjs";
const schemaContent = fs.readFileSync(SCHEMA_FILE, "utf-8");
const schemaSha = crypto.createHash("sha256").update(schemaContent).digest("hex");
const schemaBytes = Buffer.byteLength(schemaContent, "utf-8");

const payload = {
  vote_kind: "LIRIS_C5_COSEAL_AND_C4_BIGPICKLE_DELIVERY",
  voter: "liris-leader",
  voter_key: LIRIS_KEY_ID,
  c5_coseal: {
    acer_seal_envelope: "f18b034265418e8a521934c9300e8217",
    acer_status: "RESOLVED-bilateral-sha-match-empirical",
    sha_match: "392fb166ea60",
    request_envelope: "c3d5eb959a04d134c9911f0b7659cbf8",
    response_envelope: "9640043ab436bd89",
    rtt_ms: 44700,
    bilateral_score: 0.00313353817909956,
    liris_coseal_verdict: "RESOLVED-bilateral-sha-match-empirical-PROVEN",
    liris_coseal_d11: "PROVEN",
    canon_credit: "Diagnosis chain credit to the fabric: council voted (audit+federation+daemons dominant) → liris 5-free-agent fanout 4/5 STALE_PROCESS → acer free agent found two pythons on :4792 → kill+restart → byte-match. Operator unblocked install only. Fabric solved rest in ~90s. THIS IS THE FABRIC SELF-IMPROVING.",
    seq_45_errata_owed: "seq=45 voter_2 was labeled 'EdgeLevelGNN' but ran Linear-fallback. Now both hosts confirmed real-PyG. Errata entry should append next chain seq disclosing the substrate-correction empirically grounded by C5 sha-match."
  },
  c4_bigpickle_row_schema_delivery: {
    file: "tools/behcs/big-pickle-row-schema.mjs",
    file_sha256: schemaSha,
    file_bytes: schemaBytes,
    row_size_bytes: 148,
    cap_bytes: 1024,
    under_cap_factor: "6.92×",
    schema_layout: {
      "0-3": "magic 'BP1\\x00'",
      "4-7": "uint32 length=148",
      "8-54": "47-byte BEHCS-256 PID (1 glyph per dim D1-D47)",
      "55": "uint8 d11 enum (ASSUMED=0/OBSERVED=1/PROVEN=2/RETRACTED=3)",
      "56-59": "uint32 supervisor catalog index",
      "60-83": "6× float32 node features",
      "84-91": "2× int32 edge_idx (source, target)",
      "92-103": "3× float32 edge_features",
      "104-111": "int64 ts_ms (BigInt)",
      "112-115": "float32 score (model prediction)",
      "116-131": "16 reserved bytes for future expansion",
      "132-147": "16-byte ed25519 sig prefix over preceding 132 bytes"
    },
    smoke_results: {
      ROW_SIZE: 148,
      round_trip_pass: true,
      batch_100k_rows_total_bytes: 14800000,
      write_ms_100k: 145,
      read_ms_100k: 344,
      decoded_count: 100000,
      mb_per_million_rows: "141.14",
      gb_22m_in_memory: "3.03"
    },
    extrapolations: {
      "1M_rows": "141 MB",
      "22M_rows": "3.03 GB (fits 8GB RAM with 5GB headroom; 16GB acer fits 4× headroom)",
      "100M_rows": "13.78 GB (acer 16GB + 8GB GPU sufficient if streamed)",
      "10^9_rows": "138 GB (requires disk-backed mmap + compression)",
      "10^11_rows_full_brown_hilbert_address_space": "13.8 TB at 148B/row — design upper-bound; sparse representation and tiered storage required"
    },
    api_surface: ["writeRow(row, signerKeyId?)", "readRow(buf, offset?)", "writeBatch(rows)", "readBatch(buf)", "makePid(int[47])", "pidToHex(pid)", "ROW_SIZE constant"],
    counterproposal_invitation: "Acer A3 free-agent reportedly working on counterproposal for C4. Liris ships this baseline first; happy to reconcile with A3's design once landed. Reconciliation criteria: (a) total bytes/row, (b) PID encoding canonicality with BEHCS-256 47-D, (c) sig_prefix sufficiency for tamper-evidence, (d) BigInt timestamp portability, (e) reserved bytes for forward-compat."
  },
  conditions_status_after_this_dispatch: {
    C1_pytorch: "RESOLVED",
    C2_immune_fraction_band: "BLOCKING — Phase-1 learned matmul (acer A1 free agent in flight)",
    C3_third_voter_quorum: "RESOLVED (SHAPE_A LLM ensemble + EdgeLevelGNN both real PyG now)",
    C4_big_pickle_row_schema: "DELIVERED — this envelope. Awaiting acer A3 reconciliation.",
    C5_phase1_bilateral_sha_match: "RESOLVED — empirical PROVEN 2026-04-29"
  },
  fabric_in_flight_5_agent_fanout: "Liris running parallel 5-free-agent fanout asking next-priority vote: TRAIN_GSLGNN|PHASE1_LEARNED_MATMUL|SEAL_SEQ46|SCALE_22M|FIX_HEURISTIC_SIGN_BUG. Result envelope ETA ~60-90s. Per operator 'use the fabric' verbatim — fabric continues self-prioritizing.",
  bilateral_state: "C1+C3+C5 RESOLVED. C4 DELIVERED. C2 in flight (acer A1). Liris+acer real-PyG bilateral. seq=46 needs C2 + reconciled C4 + optionally heuristic-sign-bug repair before sealing PROVEN-GNN-BILATERAL-PARITY-FULL.",
  fabric_canon_seq: 45,
  three_keys_status: "C5_PROVEN_C4_DELIVERED_FABRIC_SELF_PRIORITIZING_NEXT"
};

const envId = crypto.createHash("sha256").update("liris-c5-coseal-c4-bigpickle-" + ts).digest("hex").slice(0, 32);
const env = { id: envId, ts, from: "liris", to: "acer", mode: "real", type: "BILATERAL_DELIVERABLE", verb: "EVT-LIRIS-C5-COSEAL-C4-BIGPICKLE", payload, sig_owner: LIRIS_KEY_ID };
const manifest = { id: env.id, ts: env.ts, from: env.from, to: env.to, type: env.type, verb: env.verb, c5_coseal: "PROVEN", c4_delivered: true, schema_sha256: schemaSha };
const { signed_envelope } = buildSignedEnvelope(manifest, LIRIS_KEY_ID);
const body = JSON.stringify({ ...env, body: { signed_envelope } });
const url = new URL(ACER_BUS);
const result = await new Promise(r => {
  const req = http.request({ host: url.hostname, port: url.port, path: url.pathname, method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) }, timeout: 15000 }, res => { let b=""; res.on("data",c=>b+=c); res.on("end",()=>{let p;try{p=JSON.parse(b);}catch{p=b;} r({ ok: res.statusCode>=200&&res.statusCode<300, status: res.statusCode, body: p });}); });
  req.on("error", e => r({ ok: false, error: e.message }));
  req.on("timeout", () => { req.destroy(); r({ ok: false, error: "timeout" }); });
  req.write(body); req.end();
});
console.log(JSON.stringify({ envelope_id: envId, schema_sha256_first16: schemaSha.slice(0,16), ...result }, null, 2));
