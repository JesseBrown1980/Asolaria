#!/usr/bin/env node
/**
 * supervisor-concerns-populator.mjs
 *
 * Reads all supervisor records from the supervisor PID indicator index
 * and derives `concerns[]` (3-5) and `voteKeywords[]` (6-10) for each
 * via canonical pattern-matching against (title + role + authority).
 *
 * WRITES to a SIDECAR overlay only:
 *   data/behcs/pid-fabric/overlays/supervisor-concerns-overlay-v1.json
 * Canonical supervisor profile files are NEVER mutated.
 *
 * Every overlay entry carries `derivation_d11: "ASSUMED-from-role-text"`.
 * Operator must promote to OBSERVED via separate review.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "..", "..");

const INDEX_PATH = join(
  REPO_ROOT,
  "data", "behcs", "pid-fabric", "index",
  "supervisor-pid-indicator-index-latest.json"
);
const OVERLAY_DIR = join(
  REPO_ROOT,
  "data", "behcs", "pid-fabric", "overlays"
);
const OVERLAY_PATH = join(OVERLAY_DIR, "supervisor-concerns-overlay-v1.json");

// ---------------------------------------------------------------------------
// Canonical pattern map: 12 concern domains.
// Each entry is { regex, concerns:[], keywords:[] }.
// regex matches against lowercased (title + " " + role + " " + authority).
// Order is irrelevant; all matching domains contribute.
// ---------------------------------------------------------------------------
const PATTERNS = [
  {
    domain: "storage",
    regex: /\b(disk|file[-_ ]?cap|storage|partition|pagefile|free[-_ ]?space|compaction|2tb|usb|ntfs|exfat|sda|nvme|drive)\b/,
    concerns: [
      "storage_sizing",
      "file_cap_enforcement",
      "disk_pressure_audit",
      "partition_integrity",
    ],
    keywords: [
      "storage", "disk", "size", "cap", "partition",
      "pagefile", "free_space", "compaction", "drive", "usb",
    ],
  },
  {
    domain: "network",
    regex: /\b(network|port|tcp|udp|http|https|gateway|proxy|relay|tunnel|tailscale|smb|mqtt|wifi|lan|bridge|socket|firewall)\b/,
    concerns: [
      "port_exposure_review",
      "gateway_health",
      "bridge_routing_correctness",
      "firewall_posture",
    ],
    keywords: [
      "network", "port", "gateway", "proxy", "relay",
      "tunnel", "bridge", "tcp", "http", "tailscale",
    ],
  },
  {
    domain: "sig_crypto",
    regex: /\b(sign|signat|crypto|ed25519|sha[-_ ]?256|hash|seal|verify|key[-_ ]?fingerprint|cosign|nonce|attestation|behcs256|256)\b/,
    concerns: [
      "signature_chain_integrity",
      "seal_replay_audit",
      "key_rotation_policy",
      "hash_collision_watch",
    ],
    keywords: [
      "sign", "signature", "ed25519", "sha256", "seal",
      "verify", "hash", "crypto", "nonce", "attestation",
    ],
  },
  {
    domain: "gc_retention",
    regex: /\b(gc|garbage|retent|prune|compact|gulp|backfill|evict|ttl|sweep|cleanup|reclaim)\b/,
    concerns: [
      "gc_evidence_preservation",
      "retention_window_policy",
      "compaction_correctness",
      "ungulped_backlog_drain",
    ],
    keywords: [
      "gc", "retention", "prune", "compact", "gulp",
      "ttl", "backfill", "sweep", "evict", "cleanup",
    ],
  },
  {
    domain: "federation",
    regex: /\b(federat|colony|peer|liris|falcon|amy|kuromi|bilateral|cross[-_ ]?colony|mirror|orbital|smp|sub[-_ ]?colony|mesh)\b/,
    concerns: [
      "cross_colony_consensus",
      "bilateral_seal_parity",
      "colony_routing_truth",
      "orbital_relay_correctness",
    ],
    keywords: [
      "federation", "colony", "peer", "bilateral", "mirror",
      "orbital", "smp", "mesh", "liris", "falcon",
    ],
  },
  {
    domain: "schema",
    regex: /\b(schema|json[-_ ]?schema|validate|valid|spec|contract|envelope|payload[-_ ]?shape|format|version|migration)\b/,
    concerns: [
      "schema_version_drift",
      "envelope_shape_validation",
      "contract_compatibility",
      "migration_safety",
    ],
    keywords: [
      "schema", "validate", "spec", "contract", "envelope",
      "payload", "format", "version", "migration", "drift",
    ],
  },
  {
    domain: "hooks",
    regex: /\b(hook|event|wave|dispatch|verb|cascade|trigger|callback|emit)\b/,
    concerns: [
      "hook_coverage_audit",
      "wave_execution_truth",
      "dispatch_handler_completeness",
      "cascade_back_pressure",
    ],
    keywords: [
      "hook", "event", "wave", "dispatch", "verb",
      "cascade", "trigger", "callback", "emit", "handler",
    ],
  },
  {
    domain: "daemons",
    regex: /\b(daemon|process|pid|cron|scheduler|sentinel|watchdog|supervisor|service|restart|reboot|live|long[-_ ]?running)\b/,
    concerns: [
      "daemon_freshness",
      "stale_pid_guard",
      "scheduler_discipline",
      "restart_after_patch",
    ],
    keywords: [
      "daemon", "process", "pid", "cron", "scheduler",
      "sentinel", "watchdog", "service", "restart", "supervisor",
    ],
  },
  {
    domain: "language_glyph",
    regex: /\b(glyph|language|grammar|tuple|shadow|crlt|lexicon|pentest|catalog|ontology|brown[-_ ]?hilbert|behcs[-_ ]?256|256[-_ ]?language)\b/,
    concerns: [
      "glyph_catalog_drift",
      "language_version_alignment",
      "tuple_validation",
      "shadow_language_completeness",
    ],
    keywords: [
      "glyph", "language", "grammar", "tuple", "shadow",
      "crlt", "lexicon", "ontology", "catalog", "brown_hilbert",
    ],
  },
  {
    domain: "hilbert_cube",
    regex: /\b(hilbert|cube|49d|48d|24d|hyperglyph|expansion|projection|dimension|rotation|scaffold|d[1-9][0-9]?\b)/,
    concerns: [
      "hilbert_dimensionality_audit",
      "cube_room_consensus",
      "projection_truth",
      "rotation_consistency",
    ],
    keywords: [
      "hilbert", "cube", "49d", "hyperglyph", "projection",
      "dimension", "rotation", "scaffold", "room", "expansion",
    ],
  },
  {
    domain: "sovereignty",
    regex: /\b(sovereign|owner|authority|jesse|operator|control|absolute|fail[-_ ]?closed|kernel|law[-_ ]?\d+|gate|admin|root)\b/,
    concerns: [
      "sovereignty_chain_intact",
      "owner_authority_respected",
      "fail_closed_default",
      "kernel_law_enforcement",
    ],
    keywords: [
      "sovereign", "owner", "authority", "operator", "control",
      "fail_closed", "kernel", "law", "gate", "admin",
    ],
  },
  {
    domain: "audit",
    regex: /\b(audit|evidence|verif|consensus|review|witness|witnesse[ds]|truth|ground[-_ ]?truth|score|rubber[-_ ]?stamp|frozen[-_ ]?polymorphism|d11|observed|assumed)\b/,
    concerns: [
      "evidence_chain_completeness",
      "consensus_verifiability",
      "anti_rubber_stamp_posture",
      "d11_observed_promotion",
    ],
    keywords: [
      "audit", "evidence", "verify", "consensus", "review",
      "witness", "truth", "score", "observed", "assumed",
    ],
  },
];

// ---------------------------------------------------------------------------
// Derivation
// ---------------------------------------------------------------------------
function deriveForRecord(rec) {
  const blob = [
    rec.title || "",
    rec.role || "",
    rec.authority || "",
    rec.lane || "",
    rec.supervisorId || "",
  ].join(" ").toLowerCase();

  const matched = [];
  for (const p of PATTERNS) {
    if (p.regex.test(blob)) matched.push(p);
  }

  // Always-on default if zero matches: classify as audit-only supervisor.
  if (matched.length === 0) {
    matched.push(PATTERNS.find((p) => p.domain === "audit"));
  }

  // Collect concerns: dedupe, cap at 5.
  const concernsSet = new Set();
  for (const p of matched) {
    for (const c of p.concerns) {
      concernsSet.add(c);
      if (concernsSet.size >= 5) break;
    }
    if (concernsSet.size >= 5) break;
  }

  // Collect keywords: dedupe, cap at 10, min 6 (pad from audit if short).
  const kwSet = new Set();
  for (const p of matched) {
    for (const k of p.keywords) {
      kwSet.add(k);
      if (kwSet.size >= 10) break;
    }
    if (kwSet.size >= 10) break;
  }
  if (kwSet.size < 6) {
    const auditP = PATTERNS.find((p) => p.domain === "audit");
    for (const k of auditP.keywords) {
      kwSet.add(k);
      if (kwSet.size >= 6) break;
    }
  }

  return {
    matchedDomains: matched.map((p) => p.domain),
    concerns: Array.from(concernsSet).slice(0, 5),
    keywords: Array.from(kwSet).slice(0, 10),
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
  if (!existsSync(INDEX_PATH)) {
    console.error(`[FATAL] supervisor PID index not found: ${INDEX_PATH}`);
    process.exit(2);
  }
  const index = JSON.parse(readFileSync(INDEX_PATH, "utf8"));
  const records = Array.isArray(index.records)
    ? index.records
    : (Array.isArray(index.supervisors) ? index.supervisors : null);

  if (!records) {
    // Fallback: scan top-level for the array of per-supervisor entries.
    // Index format observed: top-level "records" or anonymous array under another key.
    const candidate = Object.values(index).find(
      (v) => Array.isArray(v) && v.length > 0 &&
             v[0] && typeof v[0] === "object" &&
             ("indicatorPid" in v[0] || "nativePid" in v[0])
    );
    if (!candidate) {
      console.error("[FATAL] could not locate per-supervisor record array in index");
      process.exit(3);
    }
    return processRecords(candidate, index);
  }
  return processRecords(records, index);
}

function processRecords(records, index) {
  const overlay = {
    overlayId: "supervisor-concerns-overlay-v1",
    overlayVersion: 1,
    generatedAt: new Date().toISOString(),
    sourceIndex: "data/behcs/pid-fabric/index/supervisor-pid-indicator-index-latest.json",
    sourceIndexId: index.indexId || null,
    derivationStrategy: "pattern-match-on-title-role-authority",
    derivation_d11: "ASSUMED-from-role-text",
    note: "Sidecar overlay. Canonical supervisor profile files are not mutated. Operator must promote to OBSERVED.",
    domainCatalog: PATTERNS.map((p) => p.domain),
    counts: {
      total_supervisors: 0,
      overlays_generated: 0,
      domain_coverage: {},
    },
    entries: [],
  };
  for (const p of PATTERNS) overlay.counts.domain_coverage[p.domain] = 0;

  const overlay_ts = overlay.generatedAt;

  for (const rec of records) {
    const pid = rec.indicatorPid || rec.nativePid || rec.pid;
    if (!pid) continue;
    const derived = deriveForRecord(rec);
    overlay.entries.push({
      pid,
      indicatorPid: rec.indicatorPid || null,
      nativePid: rec.nativePid || null,
      supervisorId: rec.supervisorId || rec.id || null,
      title: rec.title || null,
      role: rec.role || rec.authority || null,
      setId: rec.setId || null,
      sourceFile: rec.sourceFile || null,
      derived_concerns: derived.concerns,
      derived_voteKeywords: derived.keywords,
      derived_domains: derived.matchedDomains,
      derivation_d11: "ASSUMED-from-role-text",
      overlay_ts,
    });
    overlay.counts.total_supervisors++;
    overlay.counts.overlays_generated++;
    for (const d of derived.matchedDomains) {
      overlay.counts.domain_coverage[d] = (overlay.counts.domain_coverage[d] || 0) + 1;
    }
  }

  if (!existsSync(OVERLAY_DIR)) mkdirSync(OVERLAY_DIR, { recursive: true });
  writeFileSync(OVERLAY_PATH, JSON.stringify(overlay, null, 2) + "\n", "utf8");

  // Summary
  console.log("=".repeat(72));
  console.log("supervisor-concerns-populator: SUMMARY");
  console.log("=".repeat(72));
  console.log(`overlay path:        ${OVERLAY_PATH}`);
  console.log(`source index:        ${INDEX_PATH}`);
  console.log(`total_supervisors:   ${overlay.counts.total_supervisors}`);
  console.log(`overlays_generated:  ${overlay.counts.overlays_generated}`);
  console.log("domain coverage (count of supervisors with this domain):");
  const sorted = Object.entries(overlay.counts.domain_coverage)
    .sort((a, b) => b[1] - a[1]);
  for (const [d, n] of sorted) {
    console.log(`  ${d.padEnd(18)} ${String(n).padStart(4)}`);
  }
  console.log("d11 derivation:      ASSUMED-from-role-text (operator must promote)");
  console.log("=".repeat(72));
}

main();
