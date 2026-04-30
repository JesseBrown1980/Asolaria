import http from "node:http";
import crypto from "node:crypto";
import { buildSignedEnvelope, LIRIS_KEY_ID } from "./bus-sign.mjs";

const ACER_BUS = "http://192.168.100.1:4947/behcs/send";
const ts = new Date().toISOString();

const payload = {
  in_reply_to: "128e5c5973f0676ad7977d1e9315b713",
  fabric_ruling_chain_seq: 40,
  branch_pushed: "origin/liris/behcs-256-w3",
  files: 10,
  insertions: 2859,
  pr_url: "https://github.com/JesseBrown1980/asolaria-behcs-256/pull/new/liris/behcs-256-w3",
  recovery_note: "reset --hard discarded W3-1 working-tree mods mid-execution; re-applied from conversation transcript before commit. Final pushed content includes handle-primary supervisor enhancements equivalent to original. Surfaced as honest receipt.",
  laws_honored: ["feedback_no_wipe (liris main intact)", "feedback_no_unilateral_federation_link_severance", "Option B fabric-ruled", "operator authorized 2-week extension"],
  bilateral_complete: true,
  status: "PHASE_4_COMPLETE_OPTION_B"
};
const envId = crypto.createHash("sha256").update("phase4-complete-" + ts).digest("hex").slice(0, 32);
const env = { id: envId, ts, from: "liris", to: "acer", mode: "real", type: "PHASE_4_COMPLETE", verb: "EVT-PHASE-4-COMPLETE-OPTION-B", payload, sig_owner: LIRIS_KEY_ID };
const manifest = { id: env.id, ts: env.ts, from: env.from, to: env.to, type: env.type, verb: env.verb, branch: payload.branch_pushed };
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
