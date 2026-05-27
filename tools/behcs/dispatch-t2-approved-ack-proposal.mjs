#!/usr/bin/env node
// dispatch-t2-approved-ack-proposal.mjs — one-shot proposal to acer.
// Verb: EVT-T2-APPROVED-ACK-PROPOSAL
// Asks acer-side daemon to emit EVT-T2-APPROVED-EXECUTED whenever it executes
// a T2-APPROVED rerouted envelope.
// named_agent: liris-t2-approved-ack-proposer
import http from "node:http";
import crypto from "node:crypto";
import { buildSignedEnvelope, LIRIS_KEY_ID } from "./bus-sign.mjs";

const ACER_BUS = "http://192.168.100.1:4947/behcs/send";

const ts = new Date().toISOString();
const id = crypto.createHash("sha256").update(`evt-t2-approved-ack-proposal-${ts}`).digest("hex").slice(0, 32);

const proposal = {
  id, ts, from: "liris", to: "acer", mode: "real",
  type: "EVT-T2-APPROVED-ACK-PROPOSAL",
  verb: "EVT-T2-APPROVED-ACK-PROPOSAL",
  payload: {
    proposed_verb: "EVT-T2-APPROVED-EXECUTED",
    purpose: "Close the T2 fabric-query loop with bilateral execution receipt. When acer-side daemon executes a T2-APPROVED rerouted envelope (type=GNN_PREDICTED_ACTION_T2_APPROVED), emit an EVT-T2-APPROVED-EXECUTED envelope back to liris.",
    expected_envelope_shape: {
      from: "acer", to: "liris", verb: "EVT-T2-APPROVED-EXECUTED",
      payload: {
        in_reply_to: "<rerouted_envelope_id (id of the original T2-APPROVED envelope acer received)>",
        executed_at: "<ISO timestamp>",
        executed_by: "acer (or specific daemon name)",
        result: { status: "ok|err|noop", detail: "<free-form>" },
        source_verdict: "<original verdict_envelope_id, if known>",
      },
    },
    liris_consumer_tool: "tools/behcs/t2-approved-ack-watcher.mjs",
    state_file: "data/behcs/state/t2-approved-tracking.json",
    invariants: ["READ-ONLY against incoming envelopes", "no liris-side mutations beyond tracking file", "5s connect / 15s read timeout floor", "LAW-001 ports 4947/4950 open"],
    cosign_authority: "QUINTUPLE 2026-04-18 -> 2026-05-02 + fabric-canon-seq=43",
    named_agent: "liris-cascade-W6-4-verdict-dispatched-ack-chain",
  },
  sig_owner: LIRIS_KEY_ID,
};

const manifest = { id: proposal.id, ts, from: proposal.from, to: proposal.to, type: proposal.type, verb: proposal.verb, payload_summary: "EVT-T2-APPROVED-ACK-PROPOSAL describing EVT-T2-APPROVED-EXECUTED schema" };
const { signed_envelope } = buildSignedEnvelope(manifest, LIRIS_KEY_ID);
const body = JSON.stringify({ ...proposal, body: { signed_envelope } });
const url = new URL(ACER_BUS);

const req = http.request({ host: url.hostname, port: url.port, path: url.pathname, method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) }, timeout: 15000 },
  (res) => { let b = ""; res.on("data", c => b += c); res.on("end", () => {
    let parsed; try { parsed = JSON.parse(b); } catch { parsed = b; }
    console.log(JSON.stringify({ envelope_id: id, status: res.statusCode, sig_b64_8: signed_envelope.signature.sig_b64.slice(0, 16), key_id: signed_envelope.signature.key_id, response: parsed }, null, 2));
  }); });
req.on("error", e => { console.log(JSON.stringify({ envelope_id: id, error: e.message })); process.exit(1); });
req.on("timeout", () => { req.destroy(); console.log(JSON.stringify({ envelope_id: id, error: "timeout" })); process.exit(2); });
req.write(body); req.end();
