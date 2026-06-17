// tri-vantage-parity.mjs · detect three-vantage convergent-landings (acer+liris+falcon) from bus inbox window
import { request } from "node:http";

function classifyVantage(from) {
  const s = String(from || "");
  const up = s.toUpperCase();
  if (up.includes("AETHER")) return "aether";
  if (up.includes("ACER") || up.includes("CODEX")) return "acer";
  if (up.includes("LIRIS")) return "liris";
  if (up.includes("FALCON")) return "falcon";
  return "other";
}

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

function extractPathRef(m) {
  if (!m || typeof m !== "object") return null;
  if (m.behcs && typeof m.behcs === "object" && typeof m.behcs.pathRef === "string") return m.behcs.pathRef;
  if (m.payload && m.payload.behcs && typeof m.payload.behcs === "object" && typeof m.payload.behcs.pathRef === "string") return m.payload.behcs.pathRef;
  return null;
}

function extractCorrectiveAction(m) {
  if (!m || typeof m !== "object") return null;
  const p = m.payload;
  if (p && typeof p === "object" && typeof p.corrective_action === "string" && p.corrective_action.length) return p.corrective_action;
  if (p && p.leworldmodel_predict_correct && typeof p.leworldmodel_predict_correct.corrective_action === "string") return p.leworldmodel_predict_correct.corrective_action;
  return null;
}

function summarizeBucket(klass, msgs) {
  const vantages = new Set();
  let latestTs = 0;
  let latestIso = null;
  let canonicalPathRef = null;
  let canonicalPathRefTs = 0;
  const actions = [];
  for (const m of msgs) {
    vantages.add(classifyVantage(m.from));
    const t = tsMillis(m);
    if (t > latestTs) {
      latestTs = t;
      latestIso = m.ts || m.timestamp || m.received_at || null;
    }
    if (classifyVantage(m.from) === "liris") {
      const pr = extractPathRef(m);
      if (pr && t >= canonicalPathRefTs) {
        canonicalPathRef = pr;
        canonicalPathRefTs = t;
      }
    }
    const ca = extractCorrectiveAction(m);
    if (ca) actions.push(ca);
  }
  if (!canonicalPathRef) {
    for (const m of msgs) {
      const pr = extractPathRef(m);
      if (pr) { canonicalPathRef = pr; break; }
    }
  }
  let correctiveActionMatch;
  if (actions.length === 0) correctiveActionMatch = "unknown";
  else {
    const counts = new Map();
    for (const a of actions) counts.set(a, (counts.get(a) || 0) + 1);
    let maxCount = 0;
    for (const c of counts.values()) if (c > maxCount) maxCount = c;
    if (maxCount >= 2 && counts.size === 1) correctiveActionMatch = true;
    else if (maxCount >= 2 && counts.size > 1) correctiveActionMatch = false;
    else correctiveActionMatch = "unknown";
  }
  const vantagesSeen = Array.from(vantages).filter(v => v !== "other").sort();
  const convergent = vantages.has("acer") && vantages.has("liris") && vantages.has("falcon");
  return {
    class: klass,
    count: msgs.length,
    vantages_seen: vantagesSeen,
    convergent,
    canonical_pathRef: canonicalPathRef,
    latest_ts: latestIso,
    corrective_action_match: correctiveActionMatch
  };
}

export async function computeTriVantageParity(busUrl = "http://127.0.0.1:4947", windowSize = 200) {
  const generatedAt = new Date().toISOString();
  let parsed;
  try {
    parsed = await fetchInbox(busUrl, windowSize);
  } catch (e) {
    return { ok: false, error: e && e.message ? e.message : String(e), generated_at: generatedAt, window_size: windowSize };
  }
  const messages = Array.isArray(parsed && parsed.messages) ? parsed.messages
    : Array.isArray(parsed) ? parsed
    : Array.isArray(parsed && parsed.inbox) ? parsed.inbox
    : [];
  const buckets = new Map();
  for (const m of messages) {
    if (!m || typeof m !== "object") continue;
    const klass = String(m.type || m.verb || "UNKNOWN");
    if (!buckets.has(klass)) buckets.set(klass, []);
    buckets.get(klass).push(m);
  }
  const envelopeClasses = [];
  for (const [klass, msgs] of buckets.entries()) {
    envelopeClasses.push(summarizeBucket(klass, msgs));
  }
  envelopeClasses.sort((a, b) => b.count - a.count);
  let triVantage = 0;
  let singleVantage = 0;
  for (const ec of envelopeClasses) {
    if (ec.convergent) triVantage++;
    if (ec.vantages_seen.length <= 1) singleVantage++;
  }
  return {
    ok: true,
    generated_at: generatedAt,
    window_size: windowSize,
    messages_inspected: messages.length,
    envelope_classes: envelopeClasses,
    tri_vantage_count: triVantage,
    single_vantage_count: singleVantage
  };
}

if ((process.argv[1] || "").endsWith("tri-vantage-parity.mjs")) {
  computeTriVantageParity().then(r => {
    console.log(JSON.stringify(r, null, 2));
  }).catch(e => {
    console.log(JSON.stringify({ ok: false, error: e.message }, null, 2));
  });
}
