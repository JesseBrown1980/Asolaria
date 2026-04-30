#!/usr/bin/env node
// Poll acer shared-hub inbox for EVT-CANON-LOADED-ACK envelopes targeted to liris.
// Liris is a mailbox client of acer:4947, not a listener — per
// feedback_orbital_routing_liris_to_falcon.md and the hub-pattern memory.
//
// Usage:
//   node tools/behcs/poll-canon-acks.mjs              — show last 10 ACKs
//   node tools/behcs/poll-canon-acks.mjs --since <iso> — only ACKs after timestamp
//   node tools/behcs/poll-canon-acks.mjs --watch       — poll every 5s
//   node tools/behcs/poll-canon-acks.mjs --strict      — only print ACKs whose
//                                                         ack_verdict=VERIFIED
//
// Each ACK confirms a specific (session_id, canon_envelope_id) ingestion on
// acer's SessionStart hook. payload_sha256 cross-check proves byte-exact canon
// landing. sig_verdict on the inner _sig_check field reflects the ORIGINAL
// canon dispatch's verdict (VERIFIED via DEV-LIRIS for now); the ACK envelope
// itself is currently UNSIGNED until acer signs with dev-acer-4abb0a9c
// (WO-CANON-ACK-SIGN). ack_verdict column on each line shows the verifier's
// verdict on the ACK envelope ITSELF (VERIFIED / TAMPERED / UNSIGNED).

import http from "node:http";
import { verifyEnvelopeSig } from "./bus-verify.mjs";

const HUB = "http://192.168.100.1:4947/behcs/inbox";
const TARGET = "liris";
const VERB = "EVT-CANON-LOADED-ACK";

const args = process.argv.slice(2);
const since = (() => {
  const i = args.indexOf("--since");
  return i >= 0 ? args[i + 1] : null;
})();
const watch = args.includes("--watch");
const strict = args.includes("--strict");
const last = (() => {
  const i = args.indexOf("--last");
  return i >= 0 ? parseInt(args[i + 1], 10) : 10;
})();

function pollOnce() {
  return new Promise((resolve) => {
    const url = new URL(HUB);
    url.searchParams.set("target", TARGET);
    url.searchParams.set("verb", VERB);
    url.searchParams.set("last", String(last));
    if (since) url.searchParams.set("since", since);

    const req = http.get(url, { timeout: 10000 }, (res) => {
      let body = "";
      res.on("data", (c) => body += c);
      res.on("end", () => {
        try { resolve(JSON.parse(body)); } catch { resolve({ ok: false, error: "unparseable", raw: body.slice(0, 200) }); }
      });
    });
    req.on("error", (e) => resolve({ ok: false, error: e.message }));
    req.on("timeout", () => { req.destroy(); resolve({ ok: false, error: "timeout" }); });
  });
}

function summarize(result) {
  if (!result.ok) {
    console.log(`[poll] FAIL: ${result.error}`);
    return;
  }
  const acks = result.messages ?? [];
  let printed = 0, skippedByStrict = 0;
  for (const ack of acks) {
    const p = ack.payload ?? {};
    const ackSig = verifyEnvelopeSig(ack);
    if (strict && ackSig.verdict !== "VERIFIED") { skippedByStrict++; continue; }
    console.log(
      `  ts=${ack.ts} session=${p.session_id} canon=${p.canon_envelope_id?.slice(0, 16)}… ` +
      `sha8=${p.payload_sha256_8} canon_verdict=${p.sig_verdict} canon_owner=${p.sig_owner} ` +
      `ack_verdict=${ackSig.verdict} ack_owner=${ackSig.owner ?? "-"}`
    );
    printed++;
  }
  const strictTag = strict ? ` strict_skipped=${skippedByStrict}` : "";
  console.log(`[poll] hub_total=${result.count} matched=${result.filtered} returned=${acks.length} printed=${printed}${strictTag}`);
}

if (watch) {
  console.log(`[poll] watching ${HUB} every 5s for verb=${VERB} target=${TARGET}`);
  let lastSeen = since;
  setInterval(async () => {
    const result = await pollOnce();
    summarize(result);
    if (result.ok && result.messages?.length) {
      lastSeen = result.messages[result.messages.length - 1].ts;
    }
  }, 5000);
} else {
  const result = await pollOnce();
  summarize(result);
}
