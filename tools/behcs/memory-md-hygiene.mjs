#!/usr/bin/env node
// memory-md-hygiene.mjs — daily MEMORY.md drift audit (read-only).
// Mirrors L3 audit: size cap, oversize entries, broken links, orphan files.
// CLI: default summary | --json | --alert (bus envelope) | --quiet-if-clean | --watch
// Build: liris-cascade-W5-3-M3-memory-md-hygiene-service · 2026-04-28

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import crypto from "node:crypto";
import { buildSignedEnvelope } from "./bus-sign.mjs";

const MEMORY_DIR = "C:/Users/rayss/.claude/projects/C--/memory";
const MEMORY_MD = path.join(MEMORY_DIR, "MEMORY.md");
const SIZE_CAP = 24400;
const ENTRY_CHAR_CAP = 200;
const ALERT_LOG = "C:/Users/rayss/Asolaria/logs/memory-hygiene-alerts.ndjson";
const ACER_BUS = "http://192.168.100.1:4947/behcs/send";
const ENTRY_RX = /^- \[([^\]]+)\]\(([^)]+)\)\s*(.*)$/;
const LINK_RX = /\[([^\]]+)\]\(([^)]+\.md)\)/g;

function audit() {
  const at = new Date().toISOString();
  if (!fs.existsSync(MEMORY_MD)) {
    return { at, error: "MEMORY.md missing", drift: true, over_cap: false,
             size_bytes: 0, oversize_count: 0, oversize_entries: [],
             broken_links: [], orphans: [] };
  }
  const buf = fs.readFileSync(MEMORY_MD);
  const size_bytes = buf.length;
  const text = buf.toString("utf-8");
  const over_cap = size_bytes > SIZE_CAP;

  const oversize_entries = [];
  const referenced = new Set();
  const broken_links = [];

  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith("- ")) continue;
    const body = line.slice(2);
    if (body.length > ENTRY_CHAR_CAP) {
      oversize_entries.push({ line: i + 1, len: body.length,
                              preview: body.slice(0, 80) });
    }
  }

  // Collect referenced files via any [..](X.md) link in MEMORY.md
  let m;
  const linkRx = new RegExp(LINK_RX.source, "g");
  while ((m = linkRx.exec(text)) !== null) {
    const target = m[2];
    // Skip absolute paths or external refs (anything with ":" or "/" outside memory dir)
    if (/^[a-zA-Z]:[\\/]/.test(target) || target.startsWith("http")) continue;
    const base = target.split(/[\\/]/).pop();
    referenced.add(base);
    const candidate = path.join(MEMORY_DIR, base);
    if (!fs.existsSync(candidate)) {
      broken_links.push({ target, basename: base });
    }
  }

  // Orphans: any *.md in memory dir not referenced + not a boot-layer doc
  const BOOT_LAYER = new Set([
    "MEMORY.md", "IDENTITY.md", "SESSION_BOOT_MANIFEST.md", "FEDERATION_HANDLES.md",
  ]);
  const allMd = fs.readdirSync(MEMORY_DIR).filter((f) => f.endsWith(".md"));
  const orphans = allMd.filter((f) => !BOOT_LAYER.has(f) && !referenced.has(f));

  const drift = over_cap || oversize_entries.length > 0
              || broken_links.length > 0 || orphans.length > 0;

  return {
    at, size_bytes, over_cap, size_cap: SIZE_CAP,
    oversize_count: oversize_entries.length, oversize_entries,
    broken_links, orphans, orphan_count: orphans.length, drift,
  };
}

function appendAlertLog(record) {
  fs.mkdirSync(path.dirname(ALERT_LOG), { recursive: true });
  const tmp = ALERT_LOG + ".tmp." + process.pid + "." + crypto.randomBytes(4).toString("hex");
  fs.writeFileSync(tmp, JSON.stringify(record) + "\n");
  fs.appendFileSync(ALERT_LOG, fs.readFileSync(tmp));
  fs.unlinkSync(tmp);
}

function postEnvelope(env) {
  const data = JSON.stringify(env);
  const url = new URL(ACER_BUS);
  return new Promise((resolve) => {
    const req = http.request({
      host: url.hostname, port: url.port, path: url.pathname, method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) },
      timeout: 15000,
    }, (res) => {
      let body = ""; res.on("data", (c) => body += c);
      res.on("end", () => resolve({ ok: res.statusCode >= 200 && res.statusCode < 300,
                                     status: res.statusCode, body }));
    });
    req.on("error", (e) => resolve({ ok: false, error: e.message }));
    req.on("timeout", () => { req.destroy(); resolve({ ok: false, error: "timeout" }); });
    req.write(data); req.end();
  });
}

async function sendAlert(summary) {
  const id = crypto.randomBytes(16).toString("hex");
  const ts = new Date().toISOString();
  const payload = {
    id, ts, from: "liris", to: "acer", mode: "real", type: "EVT-LIRIS-MEMORY-DRIFT",
    payload: summary,
    cube: {
      D1_ACTOR: "liris", D3_TARGET: "acer", D7_STATE: "drift_detected",
      D11_CLAIM_TIER: "OBSERVED", D20_TIME: ts, D26_OMNIDIRECTIONAL: "bilateral",
      D34_CROSS_COLONY: "cross_host_lan", D38_ENCRYPTION: "ed25519_signed",
    },
  };
  const env = buildSignedEnvelope(payload);
  const post = await postEnvelope(env);
  appendAlertLog({ at: ts, envelope_id: id, summary, post_ok: post.ok,
                   post_status: post.status ?? null, post_error: post.error ?? null });
  return { envelope_id: id, post };
}

function fmtSummary(s) {
  return [
    `MEMORY.md hygiene @ ${s.at}`,
    `  size_bytes  = ${s.size_bytes} / cap ${s.size_cap}` + (s.over_cap ? "  OVER_CAP" : ""),
    `  oversize    = ${s.oversize_count} entries (>${ENTRY_CHAR_CAP} chars)`,
    `  broken_links= ${s.broken_links.length}`,
    `  orphans     = ${s.orphan_count}`,
    `  drift       = ${s.drift ? "YES" : "no"}`,
  ].join("\n");
}

async function runOnce(args) {
  const summary = audit();
  const drift = summary.drift;
  if (args.includes("--json")) {
    console.log(JSON.stringify(summary, null, 2));
  } else if (!(args.includes("--quiet-if-clean") && !drift)) {
    console.log(fmtSummary(summary));
  }
  if (args.includes("--alert") && drift) {
    const res = await sendAlert(summary);
    if (!args.includes("--quiet-if-clean") || drift) {
      console.log(`alert envelope_id=${res.envelope_id} post_ok=${res.post.ok}`);
    }
  }
  return drift;
}

const args = process.argv.slice(2);
if (args.includes("--watch")) {
  let lastDrift = null;
  const tick = async () => {
    const s = audit();
    if (s.drift && lastDrift === false) await sendAlert(s);
    lastDrift = s.drift;
    console.log(`[watch ${s.at}] drift=${s.drift} size=${s.size_bytes}`);
  };
  await tick();
  setInterval(tick, 3600 * 1000);
} else {
  const drift = await runOnce(args);
  process.exit(drift ? 1 : 0);
}
