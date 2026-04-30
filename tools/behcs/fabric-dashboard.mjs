#!/usr/bin/env node
// fabric-dashboard.mjs — read-only HTTP endpoint summarizing colony fabric state.
//
// Operator at-a-glance view: D11 grid, chain tail, recent dispatch counts,
// per-supervisor evidence count, fabric-loop tick history.
//
// Listens on liris :4948 (NOT 4947 — that's reserved for the bus per LAW-001).
// Read-only; no mutations.
//
// Per "fabric drives fabric instant" + operator authorization 2026-04-29.
// named_agent: liris-fabric-dashboard-readonly

import http from "node:http";
import fs from "node:fs";
import { exec } from "node:child_process";

const PORT = parseInt(process.env.FABRIC_DASHBOARD_PORT ?? "4948", 10);
const STALE_LOG_MS = 5 * 60 * 1000;
// W7-O5 daemon-health: liris-side daemon registry. bus-supervisor is acer-only,
// reported here as MISSING by design so the histogram surfaces colony-wide gaps.
const DAEMONS = [
  { name: "fabric-loop",              match: /fabric-loop\.mjs.*--watch.*--interval-s\s+180/,            log: "C:/Users/rayss/Asolaria/data/behcs/state/fabric-loop.ndjson" },
  { name: "fabric-dashboard",         match: /fabric-dashboard\.mjs/,                                    log: null },
  { name: "fabric-verdict-consumer",  match: /fabric-verdict-consumer\.mjs.*--watch.*--interval-s\s+180/, log: "C:/Users/rayss/Asolaria/logs/fabric-verdict-consumer.log.ndjson" },
  { name: "fed-supervisor-exercise",  match: /fed-supervisor-exercise-daemon\.mjs.*--watch.*--interval-s\s+300/, log: null, note: "W7-O3 peer integration probes (GAIA/FALCON/AETHER); 300s cadence" },
  { name: "bus-supervisor",           match: /bus-supervisor\.mjs/,                                      log: null, note: "acer-side; liris has no local equivalent" },
];
const COSIGN_CHAIN = "C:/Users/rayss/.claude/projects/C--/memory/COSIGN_CHAIN.ndjson";
const OVERLAY = "C:/Users/rayss/Asolaria/data/behcs/supervisors/federation/federation-reintegration-supervisors.v1.observation-status-20260429.json";
const FABRIC_LOOP_LOG = "C:/Users/rayss/Asolaria/data/behcs/state/fabric-loop.ndjson";
const OUTBOX = "C:/Users/rayss/Asolaria/data/behcs/outbox.ndjson";
const ACER_HUB = "http://192.168.100.1:4947/behcs/health";
const ACER_DASHBOARD = "http://192.168.100.1:4948/summary";
const T2_APPROVED_TRACKING = "C:/Users/rayss/Asolaria/data/behcs/state/t2-approved-tracking.json";
const VERDICT_LOG = "C:/Users/rayss/Asolaria/logs/fabric-verdict-consumer.log.ndjson";

function readJsonSafe(p) { try { return JSON.parse(fs.readFileSync(p, "utf-8")); } catch { return null; } }
function readNdjsonTail(p, n) {
  if (!fs.existsSync(p)) return [];
  const lines = fs.readFileSync(p, "utf-8").split("\n").filter(l => l.trim());
  return lines.slice(-n).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
}

function probeUrl(urlStr, timeoutMs) {
  return new Promise((resolve) => {
    const url = new URL(urlStr);
    const req = http.get({ host: url.hostname, port: url.port, path: url.pathname, timeout: timeoutMs }, (res) => {
      let body = ""; res.on("data", c => body += c);
      res.on("end", () => { try { resolve(JSON.parse(body)); } catch (e) { resolve({ __err: "json_parse:" + e.message }); } });
    });
    req.on("error", (e) => resolve({ __err: "net:" + e.code }));
    req.on("timeout", () => { req.destroy(); resolve({ __err: "timeout_5s" }); });
  });
}

async function probeAcer() {
  const r = await probeUrl(ACER_HUB, 5000);
  return r && !r.__err ? r : null;
}

async function probeAcerDashboard() {
  const r = await probeUrl(ACER_DASHBOARD, 5000);
  if (!r || r.__err) return { ok: false, error: r?.__err ?? "unreachable" };
  return {
    ok: true,
    host: r.host ?? "acer",
    ts: r.ts ?? r.generated_at ?? null,
    chain_tail_seq: Array.isArray(r.chain_tail) && r.chain_tail.length ? r.chain_tail[r.chain_tail.length - 1].seq ?? null : null,
    d11_distribution: r.d11_grid ? { ASSUMED: r.d11_grid.assumed_count ?? 0, OBSERVED: r.d11_grid.observed_count ?? 0, PROVEN: r.d11_grid.proven_count ?? 0 } : null,
    unique_supervisor_count: r.d11_grid?.unique_supervisor_count ?? null,
    recent_loop_ticks_count: Array.isArray(r.loop_tail) ? r.loop_tail.length : 0,
    bus_health: r.bus_health ?? r.acer_bus ?? null,
  };
}

function computeParity(liris, acer) {
  if (!acer || !acer.ok) return { ok: false, reason: "acer_dashboard_unreachable", score: 0, max: 4, layers: {} };
  const layers = {};
  layers.chain_tail_seq_match = (liris.cosign_chain_tail_seq ?? null) === (acer.chain_tail_seq ?? null);
  layers.d11_proven_count_match = (liris.overlay?.d11_distribution?.PROVEN ?? -1) === (acer.d11_distribution?.PROVEN ?? -2);
  const liris_total = liris.overlay?.total_supervisors_with_promotion ?? -1;
  const acer_total = acer.unique_supervisor_count ?? -2;
  layers.supervisor_count_match = liris_total === acer_total;
  layers.bus_reachable_both = (liris.acer_bus?.ok === true) && !!acer.bus_health;
  const score = Object.values(layers).filter(Boolean).length;
  return { ok: true, score, max: 4, layers, liris_seq: liris.cosign_chain_tail_seq, acer_seq: acer.chain_tail_seq, liris_total, acer_total };
}

function psSnapshot() {
  return new Promise((resolve) => {
    exec("ps -ef", { timeout: 5000, windowsHide: true, maxBuffer: 4 * 1024 * 1024 }, (err, stdout) => {
      if (err) return resolve({ ok: false, error: String(err.code ?? err.message ?? "ps_failed"), lines: [] });
      resolve({ ok: true, lines: stdout.split("\n").filter(Boolean) });
    });
  });
}

function tailLastLine(p) {
  try {
    const txt = fs.readFileSync(p, "utf-8");
    const lines = txt.split("\n").filter(l => l.trim());
    return lines.length ? lines[lines.length - 1].slice(0, 240) : null;
  } catch { return null; }
}

async function buildDaemons(expectedPids = {}) {
  const snap = await psSnapshot();
  const now = Date.now();
  const lines = snap.lines ?? [];
  const out = [];
  for (const d of DAEMONS) {
    let foundPid = null, startedAt = null;
    for (const line of lines) {
      if (!d.match.test(line)) continue;
      // ps -ef Cygwin/MSYS columns: USER PID PPID TTY STIME COMMAND
      const m = line.trim().split(/\s+/);
      const pid = parseInt(m[1], 10);
      if (Number.isFinite(pid) && /\.mjs/.test(line)) { foundPid = pid; startedAt = m[4] ?? null; break; }
    }
    let logMtime = null, logAgeMs = null, lastLine = null;
    if (d.log && fs.existsSync(d.log)) {
      try {
        const st = fs.statSync(d.log);
        logMtime = st.mtimeMs;
        logAgeMs = now - logMtime;
        lastLine = tailLastLine(d.log);
      } catch {}
    }
    let status;
    if (!foundPid) status = "MISSING";
    else if (d.log && logAgeMs !== null && logAgeMs > STALE_LOG_MS) status = "STALE";
    else status = "RUNNING";
    out.push({
      name: d.name,
      expected_pid: expectedPids[d.name] ?? null,
      found_pid: foundPid,
      pid_match: expectedPids[d.name] != null && expectedPids[d.name] === foundPid,
      started_at: startedAt,
      uptime_s: null, // ps -ef STIME is wall-clock; precise uptime needs PID birth — surfaced via started_at
      log_path: d.log,
      log_last_modified_ms: logMtime,
      log_age_s: logAgeMs !== null ? Math.round(logAgeMs / 1000) : null,
      log_last_line: lastLine,
      status,
      note: d.note ?? null,
    });
  }
  const histogram = { RUNNING: 0, STALE: 0, MISSING: 0 };
  for (const d of out) histogram[d.status] = (histogram[d.status] ?? 0) + 1;
  return { ok: snap.ok, ps_error: snap.ok ? null : snap.error, count: out.length, histogram, daemons: out, generated_at: new Date().toISOString() };
}

const EXPECTED_PIDS = { "fabric-loop": 110020, "fabric-verdict-consumer": 111593, "fed-supervisor-exercise": 149915 }; // dashboard PID self-resolves

async function buildSummary() {
  const overlay = readJsonSafe(OVERLAY) ?? {};
  const chainTail = readNdjsonTail(COSIGN_CHAIN, 10);
  const loopTail = readNdjsonTail(FABRIC_LOOP_LOG, 10);
  const outboxTail = readNdjsonTail(OUTBOX, 10);
  const [acerHealth, acerDashboard] = await Promise.all([probeAcer(), probeAcerDashboard()]);

  // D11 distribution from overlay — dedup by supervisor_pid keeping LATEST state
  // (a supervisor can appear in multiple promotion blocks across rounds; we
  // count each unique supervisor once based on the highest D11 seen).
  const d11ByPid = new Map(); // supervisor_pid → latest D11
  const blocks = [
    overlay.promotions ?? [],
    overlay.round_2_promotions_real_time_T1_2026_04_29 ?? [],
    overlay.round_3_promotions_recursive_self_improvement_2026_04_29 ?? [],
  ];
  for (const k of Object.keys(overlay)) if (k.startsWith("auto_promotions_") && Array.isArray(overlay[k])) blocks.push(overlay[k]);
  const RANK = { ASSUMED: 0, OBSERVED: 1, PROVEN: 2 };
  for (const b of blocks) for (const p of b) {
    const after = String(p.after ?? "").includes("PROVEN") ? "PROVEN" : String(p.after ?? "").includes("OBSERVED") ? "OBSERVED" : "ASSUMED";
    const prev = d11ByPid.get(p.supervisor_pid);
    if (prev === undefined || RANK[after] > RANK[prev]) d11ByPid.set(p.supervisor_pid, after);
  }
  const promotedSupervisors = new Set(d11ByPid.keys());
  const d11Counts = { ASSUMED: 0, OBSERVED: 0, PROVEN: 0 };
  for (const v of d11ByPid.values()) d11Counts[v] = (d11Counts[v] ?? 0) + 1;

  // T2-APPROVED ack tracking: count APPROVE verdicts emitted vs executions ack'd back.
  const tracking = readJsonSafe(T2_APPROVED_TRACKING) ?? {};
  let approvedDispatched = 0;
  if (fs.existsSync(VERDICT_LOG)) {
    const lines = fs.readFileSync(VERDICT_LOG, "utf-8").split("\n").filter(Boolean);
    for (const l of lines) { try { const r = JSON.parse(l); if (r.verdict === "APPROVE" && r.reroute?.envelope_id) approvedDispatched++; } catch {} }
  }
  const trackedKeys = Object.keys(tracking);
  const executed = trackedKeys.filter(k => tracking[k]?.executed_at).length;
  const t2Approved = {
    approved_dispatched: approvedDispatched,
    executed_acks_received: executed,
    pending: Math.max(0, approvedDispatched - executed),
    tracking_file: T2_APPROVED_TRACKING,
  };

  const liris = {
    generated_at: new Date().toISOString(),
    fabric_canon_seq: 43,
    operator_authority: "the fabric decides + operator approves fabric instant + watch+advise",
    cosign_chain_tail_seq: chainTail[chainTail.length - 1]?.seq ?? null,
    cosign_chain_recent_kinds: chainTail.map(e => ({ seq: e.seq, kind: e.kind ?? e.type ?? e.event })),
    overlay: {
      total_supervisors_with_promotion: promotedSupervisors.size,
      d11_distribution: d11Counts,
      file: OVERLAY,
    },
    fabric_loop: {
      log_file: FABRIC_LOOP_LOG,
      recent_ticks: loopTail.map(t => ({ ts: t.ts, kind: t.kind ?? "tick", bridge_dispatched: t.bridge?.dispatched })),
    },
    outbox_tail: outboxTail.map(o => ({ id: o.id?.slice(0, 16), verb: o.verb, status: o.response_status ?? o.status })),
    t2_approved: t2Approved,
    acer_bus: acerHealth ? { ok: true, uptime_s: acerHealth.uptime_s, inbox_depth: acerHealth.inbox_depth, pid_started_at: acerHealth.process_started_at } : { ok: false, error: "unreachable" },
  };
  liris.acer_dashboard = acerDashboard;
  liris.bilateral_parity = computeParity(liris, acerDashboard);
  const daemons = await buildDaemons({ ...EXPECTED_PIDS, "fabric-dashboard": process.pid });
  liris.daemons = { count: daemons.count, histogram: daemons.histogram, ps_ok: daemons.ok };
  return liris;
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.url === "/" || req.url === "/summary") {
    const s = await buildSummary();
    res.writeHead(200);
    res.end(JSON.stringify(s, null, 2));
  } else if (req.url === "/api/daemons") {
    const d = await buildDaemons({ ...EXPECTED_PIDS, "fabric-dashboard": process.pid });
    res.writeHead(200);
    res.end(JSON.stringify(d, null, 2));
  } else if (req.url === "/health") {
    res.writeHead(200);
    res.end(JSON.stringify({ ok: true, service: "liris-fabric-dashboard", port: PORT, ts: new Date().toISOString() }));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ ok: false, error: "not found", routes: ["/", "/summary", "/health", "/api/daemons"] }));
  }
});
server.listen(PORT, "0.0.0.0", () => {
  console.log(`[fabric-dashboard] listening on ${PORT} — GET /summary for full read-only state`);
});
