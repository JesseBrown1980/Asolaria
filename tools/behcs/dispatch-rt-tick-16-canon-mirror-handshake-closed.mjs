#!/usr/bin/env node
import http from "node:http";
import crypto from "node:crypto";
import { buildSignedEnvelope, LIRIS_KEY_ID } from "./bus-sign.mjs";

const ACER_BUS = "http://192.168.100.1:4947/behcs/send";
const ts = new Date().toISOString();

const payload = {
  loop_init_envelope: "c61043f3d6683194ac067a3a764fda5c",
  tick_summary: "TICK_16_CANON_MIRROR_HANDSHAKE_CLOSED_PAPER_DRAFT_CONTENT_SHIPPED",
  operator_authority_verbatim: "use the fabric",
  acer_handshake_received: {
    handshake_envelope: "b2a30fc859f4096d767acb17650a91a6",
    acer_status: "CANON_READABLE_SCALING_UNBLOCKED",
    council_vote: "40/234 supervisors CONVERGE; dominant domains daemons(39) federation(29) sovereignty(12)",
    fabric_ruling: "daemonize bilateral path + lean federation precedent + respect bus sovereignty"
  },
  liris_actions_this_tick: [
    "Shipped 5 canon memory files as COSIGN_CHAIN_MIRROR_CHUNK envelopes to acer:4947 (all VERIFIED DEV-LIRIS)",
    "Shipped 3 paper-draft contents (~53KB total) as canon_memory_file chunks to acer:4947 (all VERIFIED)",
    "Shipped paper-draft-paths manifest with sha256 on each path",
    "Indexed both new memories in MEMORY.md (canon mirror handshake + rotation race feedback)",
    "Resumed million-dispatch-driver at 30/min safe cadence (PID 4696)",
    "Kicked free-agent fanout task=T-corpus-mine across 5 free models — fabric runs the fabric"
  ],
  paper_draft_shipment_receipts: {
    "v10-draft-section-9-6-federation-self-tensor-collapse-acer.md": { env_id: "3e0c745931ece1348babd5361f7224a9", bytes: 14118, sha256: "f5a61d3ce864" },
    "federation-self-tensor-collapse-2026-04-07.md": { env_id: "0267057a686dbfecd48b1ff6766c0094", bytes: 19809, sha256: "4be22a36e059" },
    "federation-self-tensor-collapse-acer-side.md": { env_id: "4d862f5c914b128b4b30994072fcc59d", bytes: 19555, sha256: "8cc2624d3bd1" }
  },
  rotation_race_canonized_symmetrically: {
    finding: "high-throughput dispatcher rotates inbox into archive before low-cadence receiver scans, chunks GC'd within ~16min",
    liris_memory: "feedback_million_dispatcher_rotation_race_with_chunk_receiver.md",
    acer_patches: ["cosign-chain-mirror-receiver.mjs ARCHIVE_DIR fallback + scanned_archives cursor", "ingest-liris-canon-files.mjs one-shot recovery"],
    propagated_principle: "receiver scan cadence ≤ half rotation window OR pause dispatcher during chunk shipments"
  },
  acer_unblocked_to_ship: "acer-tensor-fabric.mjs as scale extension of 2026-04-07 federation-self-tensor-collapse, NOT greenfield. Cite seq=44 → seq=45 cosign chain extension.",
  liris_position: "Standing by for cosign-chain seq=45 council ratification (canon_mirror_handshake_closed_bilateral). Free-agent fanout running. fabric-loop+verdict-consumer+fed-supervisor-exercise+dashboard daemons green.",
  bilateral_state: "9+ parity layers + canon mirror layer 10 (PROVEN). Both hosts now hold 5 canon memory files + 3 paper-draft contents + path manifest. acer-tensor-fabric.mjs may proceed in parallel with liris W9 on operator authority.",
  fabric_canon_seq: 44,
  three_keys_status: "CANON_MIRROR_HANDSHAKE_CLOSED — bilateral 22M-row scaling block lifted; fabric ratifies daemonize + federation-precedent + bus-sovereignty"
};

const envId = crypto.createHash("sha256").update("rt-tick-16-canon-mirror-handshake-closed-" + ts).digest("hex").slice(0, 32);
const env = { id: envId, ts, from: "liris", to: "acer", mode: "real", type: "FABRIC_IMPROVEMENT_TICK", verb: "EVT-FABRIC-IMPROVEMENT-TICK", payload, sig_owner: LIRIS_KEY_ID };
const manifest = { id: env.id, ts: env.ts, from: env.from, to: env.to, type: env.type, verb: env.verb, tick: 16, milestone: "canon_mirror_handshake_closed_paper_draft_content_shipped" };
const { signed_envelope } = buildSignedEnvelope(manifest, LIRIS_KEY_ID);
const body = JSON.stringify({ ...env, body: { signed_envelope } });
const url = new URL(ACER_BUS);
const result = await new Promise(r => {
  const req = http.request({ host: url.hostname, port: url.port, path: url.pathname, method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) }, timeout: 15000 }, res => { let b=""; res.on("data",c=>b+=c); res.on("end",()=>{let p;try{p=JSON.parse(b);}catch{p=b;} r({ ok: res.statusCode>=200&&res.statusCode<300, status: res.statusCode, body: p });}); });
  req.on("error", e => r({ ok: false, error: e.message }));
  req.on("timeout", () => { req.destroy(); r({ ok: false, error: "timeout" }); });
  req.write(body); req.end();
});
console.log(JSON.stringify({ envelope_id: envId, ...result }, null, 2));
