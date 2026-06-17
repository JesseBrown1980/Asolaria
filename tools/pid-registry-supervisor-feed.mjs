#!/usr/bin/env node
"use strict";

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const DEFAULT_REGISTRY_SOURCES = [
  { label: "acer_pid_registration_office", dir: "D:/PID-Registration-Office/registered", priority: 10 },
  { label: "liris_local_pid_registry", dir: path.join(ROOT, "data", "pid-registry", "registered"), priority: 20 },
];

const DEFAULT_CACHE_PATH = "C:/Users/rayss/mcp-servers/asolaria-fabric/cache/api_supervisors.json";

function sha256(value) {
  return crypto.createHash("sha256").update(String(value), "utf8").digest("hex");
}

function clean(value) {
  return String(value ?? "").replace(/\r/g, "").replace(/\n/g, " ").trim();
}

function safeJsonValue(value) {
  return clean(value).slice(0, 800);
}

function readText(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  } catch {
    return "";
  }
}

function parseHbp(text) {
  const fields = {};
  const all = {};
  const rows = text.split(/\r?\n/).map((row) => row.trim()).filter(Boolean);
  for (const row of rows) {
    const i = row.indexOf("|");
    if (i <= 0) continue;
    const key = row.slice(0, i);
    const value = row.slice(i + 1);
    if (!(key in fields)) fields[key] = value;
    if (!all[key]) all[key] = [];
    all[key].push(value);
  }
  return { rows, fields, all };
}

function firstToken(value) {
  return clean(value).split("|")[0] || "";
}

function capabilityMarks(rows) {
  const wanted = /\b(TOOL|TOOLS|SKILL|SKILLS|MEMORY|MEMORIES|GENIUS|MISTAKE|PATTERN|CAPABILITY|GROUNDED_IN|PROCEDURE|ACER_AGENT_TERMINAL_LANE)\b/i;
  return rows
    .filter((row) => wanted.test(row))
    .slice(0, 12)
    .map((row) => row.slice(0, 500));
}

function classifyEntry(entry) {
  const name = clean(entry.name).toUpperCase();
  const layer = clean(entry.layer).toLowerCase();
  const klass = clean(entry.class).toLowerCase();
  if (name.startsWith("ROOM-SECTOR")) return "sector";
  if (name.startsWith("PROF-") || layer === "prof" || /\bprof\b/.test(klass)) return "prof";
  if (name.startsWith("SUP-") || name.startsWith("AGT-L") || layer.includes("supervisor") || klass.includes("supervisor")) return "supervisor";
  if (name.includes("SUBSTRATE") || layer.includes("substrate") || klass.includes("substrate")) return "substrate";
  if (name.includes("OPERATOR") || name.startsWith("SPECIAL-OP-") || layer.includes("operator") || klass.includes("operator")) return "operator";
  if (name.includes("-PID-")) return "pid";
  if (name.includes("SHANNON")) return "shannon";
  if (name.includes("FREE-AGENT")) return "free_agent";
  return "other";
}

function parseRegistryFile(source, fileName) {
  const filePath = path.join(source.dir, fileName);
  const body = readText(filePath);
  const parsed = parseHbp(body);
  const baseName = fileName.slice(0, -4);
  const fields = parsed.fields;
  const stat = fs.statSync(filePath);
  const name = clean(fields.NAME || baseName);
  const pid = firstToken(fields.PID || "");
  const sidecars = {
    hbi: fs.existsSync(path.join(source.dir, `${baseName}.hbi`)),
    hex: fs.existsSync(path.join(source.dir, `${baseName}.hex`)),
    sha256: fs.existsSync(path.join(source.dir, `${baseName}.sha256`)),
    ing: fs.existsSync(path.join(source.dir, `${baseName}.ing`)),
  };
  const entry = {
    name,
    pid: pid || "unknown",
    hilbert: fields.HILBERT ? Number(firstToken(fields.HILBERT)) : null,
    layer: clean(firstToken(fields.LAYER || "")) || null,
    class: safeJsonValue(fields.CLASS || "") || null,
    glyph_1024: firstToken(fields.GLYPH_BEHCS1024 || "") || null,
    glyph_5: firstToken(fields.GLYPH_BEHCS5 || "") || null,
    source: source.label,
    source_dir: source.dir,
    file: fileName,
    mtime: stat.mtime.toISOString(),
    bytes: stat.size,
    sha16: sha256(body).slice(0, 16),
    quintet: Object.values(sidecars).every(Boolean),
    sidecars,
    statuses: (parsed.all.STATUS || []).map(safeJsonValue),
    claim_total: fields.CLAIMED_TOTAL ? Number(firstToken(fields.CLAIMED_TOTAL)) : null,
    capability_marks: capabilityMarks(parsed.rows),
  };
  entry.kind = classifyEntry(entry);
  entry.has_capability_marks = entry.capability_marks.length > 0;
  entry.pid_bearing_name = /\bPID\b|-PID-/.test(name);
  return entry;
}

function registrySources(inputSources = DEFAULT_REGISTRY_SOURCES) {
  return inputSources
    .map((source) => {
      let hbpCount = 0;
      let error = null;
      const exists = fs.existsSync(source.dir);
      if (exists) {
        try {
          hbpCount = fs.readdirSync(source.dir).filter((file) => file.endsWith(".hbp")).length;
        } catch (e) {
          error = e.message;
        }
      }
      return { ...source, exists, hbp_count: hbpCount, error };
    })
    .sort((a, b) => a.priority - b.priority);
}

function collectEntries(sources) {
  const entries = [];
  const seen = new Set();
  for (const source of sources) {
    if (!source.exists || source.error) continue;
    const files = fs.readdirSync(source.dir).filter((file) => file.endsWith(".hbp")).sort();
    for (const file of files) {
      const entry = parseRegistryFile(source, file);
      const key = entry.pid && entry.pid !== "unknown" ? `pid:${entry.pid.toLowerCase()}` : `name:${entry.name.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      entries.push(entry);
    }
  }
  return entries;
}

function countBy(entries, field) {
  const out = {};
  for (const entry of entries) {
    const key = clean(entry[field] || "unknown") || "unknown";
    out[key] = (out[key] || 0) + 1;
  }
  return out;
}

function domainClasses(entries) {
  const explicit = new Set();
  for (const entry of entries) {
    if (!entry.name.includes("SUPERVISOR-COUNCIL") || !entry.file.endsWith(".hbp")) continue;
    const body = readText(path.join(entry.source_dir, entry.file));
    const m = body.match(/^DOMAIN_CLASSES\|(.+)$/m);
    if (m) for (const item of m[1].split(",")) if (item.trim()) explicit.add(item.trim());
  }
  if (explicit.size) return [...explicit];
  return Object.keys(countBy(entries.filter((entry) => entry.class), "class")).sort();
}

function buildCounts(entries) {
  const byKind = countBy(entries, "kind");
  return {
    total: entries.length,
    supervisors: byKind.supervisor || 0,
    profs: byKind.prof || 0,
    supervisor_class_total: (byKind.supervisor || 0) + (byKind.prof || 0),
    pid_bearing_names: entries.filter((entry) => entry.pid_bearing_name).length,
    sectors: byKind.sector || 0,
    substrates: byKind.substrate || 0,
    operators: byKind.operator || 0,
    free_agents: byKind.free_agent || 0,
    shannon: byKind.shannon || 0,
    other: byKind.other || 0,
    quintet_full: entries.filter((entry) => entry.quintet).length,
    capability_marked: entries.filter((entry) => entry.has_capability_marks).length,
  };
}

function buildClaims(entries, counts) {
  const claimed = Math.max(0, ...entries.map((entry) => Number(entry.claim_total || 0)));
  return {
    claimed_total: claimed || null,
    actual_loaded_total: counts.total,
    pending_full_office: Boolean(claimed && claimed > counts.total),
    pending_missing: claimed && claimed > counts.total ? claimed - counts.total : 0,
  };
}

function example(entry) {
  return {
    id: entry.name,
    pid: entry.pid,
    domain: entry.class || entry.layer || entry.kind,
    role: entry.layer || entry.kind,
    hilbert: entry.hilbert,
    glyph_1024: entry.glyph_1024,
    source: entry.source,
    capability_marks: entry.capability_marks,
  };
}

function hbpValue(value, max = 1200) {
  return clean(value)
    .replace(/[|\t]/g, "_")
    .replace(/[^\x20-\x7e]/g, "_")
    .slice(0, max);
}

function hbpRow(tag, fields = {}) {
  return `${tag}|${Object.entries(fields)
    .map(([key, value]) => `${hbpValue(key, 80)}=${hbpValue(value)}`)
    .join("|")}`;
}

export function buildSupervisorFeed(options = {}) {
  const sources = registrySources(options.sources || DEFAULT_REGISTRY_SOURCES);
  const entries = collectEntries(sources);
  const counts = buildCounts(entries);
  const claims = buildClaims(entries, counts);
  const domains = domainClasses(entries);
  const supervisors = entries.filter((entry) => entry.kind === "supervisor");
  const profs = entries.filter((entry) => entry.kind === "prof");
  const sectors = entries.filter((entry) => entry.kind === "sector");
  return {
    ok: true,
    generated_at: new Date().toISOString(),
    route: "/api/supervisors",
    source: "pid_registry_supervisor_feed",
    registry: {
      sources: sources.map(({ label, dir, exists, hbp_count, error }) => ({ label, dir, exists, hbp_count, error })),
      primary_loaded_source: sources.find((source) => source.exists && source.hbp_count > 0)?.label || null,
      dedupe: "pid_then_name_first_source_wins",
    },
    counts,
    claims,
    count: entries.length,
    council_total: counts.supervisor_class_total,
    domain_classes: domains,
    structure: {
      supervisors: "registry-derived SUP/AGT-L/supervisor-layer entries",
      profs: "registry-derived PROF/prof-layer entries",
      capability_marks: "bounded rows containing tool/skill/memory/pattern/mistake/genius keywords; absence is reported, not fabricated",
    },
    supervisors_examples: supervisors.slice(0, 40).map(example),
    profs_examples: profs.slice(0, 40).map(example),
    sectors: sectors.slice(0, 140).map(example),
    supervisors: entries,
    capability_summary: {
      marked_entries: counts.capability_marked,
      unmarked_entries: counts.total - counts.capability_marked,
      mark_policy: "hbp_row_keyword_scan_only",
    },
    by_kind: countBy(entries, "kind"),
    by_class: countBy(entries.filter((entry) => entry.class), "class"),
    council_query_pattern: "registry entries are identity/address records; voting runtime remains /api/council/query",
    voting_determinism: "not inferred by this feeder",
  };
}

export function supervisorFeedToHbp(feed = buildSupervisorFeed()) {
  const rows = [
    hbpRow("SUPFEEDHDR", {
      ok: feed.ok ? 1 : 0,
      route: "/hbp/supervisors",
      source: feed.source,
      generated_at: feed.generated_at,
      count: feed.count,
      json: 0,
    }),
    hbpRow("SUPFEEDCOUNTS", {
      total: feed.counts.total,
      supervisors: feed.counts.supervisors,
      profs: feed.counts.profs,
      supervisor_class_total: feed.counts.supervisor_class_total,
      pid_bearing_names: feed.counts.pid_bearing_names,
      sectors: feed.counts.sectors,
      quintet_full: feed.counts.quintet_full,
      capability_marked: feed.counts.capability_marked,
    }),
    hbpRow("SUPFEEDCLAIMS", {
      claimed_total: feed.claims.claimed_total || "",
      actual_loaded_total: feed.claims.actual_loaded_total,
      pending_full_office: feed.claims.pending_full_office ? 1 : 0,
      pending_missing: feed.claims.pending_missing,
    }),
  ];
  for (const source of feed.registry.sources || []) {
    rows.push(hbpRow("SUPFEEDSOURCE", source));
  }
  for (const domain of feed.domain_classes || []) {
    rows.push(hbpRow("SUPFEEDDOMAIN", { domain }));
  }
  for (const entry of feed.supervisors || []) {
    rows.push(hbpRow("SUPFEEDENTRY", {
      name: entry.name,
      pid: entry.pid,
      kind: entry.kind,
      hilbert: entry.hilbert ?? "",
      layer: entry.layer || "",
      class: entry.class || "",
      glyph_1024: entry.glyph_1024 || "",
      glyph_5: entry.glyph_5 || "",
      quintet: entry.quintet ? 1 : 0,
      capability_marked: entry.has_capability_marks ? 1 : 0,
      sha16: entry.sha16,
      source: entry.source,
      file: entry.file,
    }));
  }
  const body = rows.join("\n");
  rows.push(hbpRow("SUPFEEDFTR", { rows: rows.length + 1, body_sha16: sha256(body).slice(0, 16) }));
  return `${rows.join("\n")}\n`;
}

export function writeSupervisorFeedCache(feed, cachePath = DEFAULT_CACHE_PATH) {
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  fs.writeFileSync(cachePath, JSON.stringify({ cached_at: new Date().toISOString(), body: feed }), "utf8");
  return cachePath;
}

function parseArgs(argv) {
  const args = { writeCache: false, cachePath: DEFAULT_CACHE_PATH, format: "json" };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--write-cache") args.writeCache = true;
    else if (arg === "--cache") args.cachePath = argv[++i] || args.cachePath;
    else if (arg === "--format") args.format = argv[++i] || args.format;
    else if (arg === "--hbp") args.format = "hbp";
  }
  return args;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const args = parseArgs(process.argv.slice(2));
  const feed = buildSupervisorFeed();
  const cache = args.writeCache ? writeSupervisorFeedCache(feed, args.cachePath) : null;
  if (args.format === "hbp") {
    process.stdout.write(supervisorFeedToHbp(feed));
    process.exit(0);
  }
  console.log(JSON.stringify({
    ok: true,
    wrote_cache: Boolean(cache),
    cache,
    count: feed.count,
    counts: feed.counts,
    claims: feed.claims,
    sources: feed.registry.sources,
  }, null, 2));
}
