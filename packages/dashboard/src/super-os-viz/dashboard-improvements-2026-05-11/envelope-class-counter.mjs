// envelope-class-counter.mjs · top-N verb/type classes over rolling bus inbox window with recurrence flag
import { request } from "node:http";

function fetchInbox(busUrl, windowSize) {
  return new Promise((resolve, reject) => {
    let u;
    try { u = new URL("/behcs/inbox?last=" + encodeURIComponent(String(windowSize)), busUrl); }
    catch (e) { reject(e); return; }
    const opts = {
      hostname: u.hostname,
      port: u.port || 80,
      path: u.pathname + u.search,
      method: "GET",
      headers: { "accept": "application/json" },
      timeout: 15000
    };
    const req = request(opts, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf8");
        try {
          const parsed = JSON.parse(body);
          resolve(parsed);
        } catch (e) { reject(new Error("bus returned non-JSON: " + e.message)); }
      });
    });
    req.on("timeout", () => { req.destroy(new Error("bus request timeout")); });
    req.on("error", (e) => reject(e));
    req.end();
  });
}

function tsMillis(m) {
  const v = m && (m.ts || m.timestamp || m.received_at);
  const t = v ? Date.parse(v) : NaN;
  return Number.isFinite(t) ? t : 0;
}

function extractMessages(parsed) {
  if (Array.isArray(parsed && parsed.messages)) return parsed.messages;
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed && parsed.inbox)) return parsed.inbox;
  return [];
}

function classifyType(m) {
  const t = m && (m.type || m.verb);
  if (t === undefined || t === null || t === "") return "UNKNOWN";
  return String(t);
}

function summarizeClass(klass, msgs) {
  let earliestMs = Infinity;
  let latestMs = -Infinity;
  let earliestIso = null;
  let latestIso = null;
  const fromCounts = new Map();
  for (const m of msgs) {
    const t = tsMillis(m);
    const iso = m && (m.ts || m.timestamp || m.received_at) || null;
    if (t && t < earliestMs) { earliestMs = t; earliestIso = iso; }
    if (t && t > latestMs) { latestMs = t; latestIso = iso; }
    const f = m && m.from ? String(m.from) : "unknown";
    fromCounts.set(f, (fromCounts.get(f) || 0) + 1);
  }
  const dominantFrom = Array.from(fromCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(e => e[0]);
  return {
    type: klass,
    count: msgs.length,
    earliest_ts: earliestIso,
    latest_ts: latestIso,
    dominant_from: dominantFrom
  };
}

export async function computeEnvelopeClassCounter(busUrl = "http://127.0.0.1:4947", windowSize = 200, topN = 12) {
  const generatedAt = new Date().toISOString();
  let parsed;
  try {
    parsed = await fetchInbox(busUrl, windowSize);
  } catch (e) {
    return {
      ok: false,
      error: e && e.message ? e.message : String(e),
      generated_at: generatedAt,
      window_size: windowSize,
      messages_inspected: 0,
      top_classes: [],
      verb_count: 0,
      total_messages: 0
    };
  }
  const messages = extractMessages(parsed);
  const buckets = new Map();
  for (const m of messages) {
    if (!m || typeof m !== "object") continue;
    const klass = classifyType(m);
    if (!buckets.has(klass)) buckets.set(klass, []);
    buckets.get(klass).push(m);
  }
  const total = messages.length;
  const summaries = [];
  for (const [klass, msgs] of buckets.entries()) {
    const s = summarizeClass(klass, msgs);
    const pct = total > 0 ? Math.round((s.count / total) * 1000) / 10 : 0;
    summaries.push({
      type: s.type,
      count: s.count,
      pct_of_window: pct,
      earliest_ts: s.earliest_ts,
      latest_ts: s.latest_ts,
      recurrence_flag: s.count >= 3,
      dominant_from: s.dominant_from
    });
  }
  summaries.sort((a, b) => b.count - a.count);
  const top = summaries.slice(0, topN);
  return {
    ok: true,
    generated_at: generatedAt,
    window_size: windowSize,
    messages_inspected: total,
    top_classes: top,
    verb_count: buckets.size,
    total_messages: total
  };
}

if ((process.argv[1] || "").endsWith("envelope-class-counter.mjs")) {
  computeEnvelopeClassCounter().then(r => {
    console.log(JSON.stringify(r, null, 2));
  }).catch(e => {
    console.log(JSON.stringify({ ok: false, error: e.message }, null, 2));
  });
}
