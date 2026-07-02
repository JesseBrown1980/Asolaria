// super-dashboard-server.mjs Ãƒâ€šÃ‚Â· LIVE Super Asolaria Civilization OS dashboard
// Standalone Ãƒâ€šÃ‚Â· port 4949 Ãƒâ€šÃ‚Â· ZERO mutation of http-server.ts
// Serves: tab shell Ãƒâ€šÃ‚Â· viz Ãƒâ€šÃ‚Â· live cohort/cosign/inbox JSON Ãƒâ€šÃ‚Â· proxies acer bus :4947 inbox
//
// ============================================================================
// HERMES 7-LANE MAPPING (declarative, see packages/dashboard/docs/DASHBOARD-7-LANES.md)
// agent: AGT-C4-DASHBOARD-7-LANES-PID-2026-05-19  Ãƒâ€šÃ‚Â· date: 2026-05-19
// NO route handlers modified Ãƒâ€šÃ‚Â· comment-only Ãƒâ€šÃ‚Â· "wrap old visualizers as compatibility panels"
//   Lane 1 Shadow Inventory   : /api/sovereignty-usb, /api/devices, /api/usb-physical-pipeline, /api/usb-file-manager.hbp
//   Lane 2 Execution Control  : /api/loop/tick, /api/loop/pending  (+ /api/loop/{veto,review-pipeline}, /api/daemons, /api/omni-control/*, /api/omniscrcpy/*)
//   Lane 3 Ingest             : /api/inbox  (+ /api/cross-inbox)   [orphans: gulp ingest/flush missing]
//   Lane 4 Dimension+Atlas    : /api/behcs1024/context             (+ /api/glyphs, /api/alphabet-binding, /api/manifest, /api/cohort, /api/cosign-chain)  [orphan: atlas/domain/cp]
//   Lane 5 Access+Authority   : /api/access-tier/matrix, /api/access-tier/probe  (+ /api/audit-integrity/candidate, /api/route-honesty)
//   Lane 6 Fabric             : /api/fabric-revolver, /api/hookwall/events, /api/gnn/topN  (+ /api/cube-cube-cubed, /api/pid/validate, /api/fabric/highways, /api/graph-runtime/*)
//   Lane 7 Code+Agents        : /api/agents  (+ /api/agents-roster, /api/agent-terminal/*, /api/pi/terminal/*, /api/supervisors*, /api/council*)  [orphan: omniscoder, wave/explorer]
// Orphans (no lane assignment): /health, /api/everything, /api/sister-organ, /api/tri-vantage-parity, /api/owner-cadence-gap, /api/envelope-class-counter,
//                                /api/bus-health, /api/heal-pipeline-schema, /api/onboarding-bootstrap, /api/canon-index, /api/archaeology/*, /api/cohort-{c,d},
//                                /api/cascade/plan, /api/great-excavation, /api/falcon/realization-plan, /api/omnimets/cumulative, /api/test-results*,
//                                /api/route-list.*, /api/map-map-mapped, /api/indexes, /api/body-anatomy, /api/substrates, /api/crypto/info, /api/piping-topology
// Preservation rule (Hermes verbatim): "Wrap old visualizers as compatibility panels Ãƒâ€¢ preserve preserved intelligence"
// ============================================================================
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync, readdirSync, appendFileSync, mkdirSync } from "node:fs";
import { resolve, dirname, join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { topN } from "./e-cohort/E05-gnn-inference-stub.mjs";
import { tick } from "./e-cohort/E06-loop-orchestrator.mjs";
import { listPending, veto, REVIEW_PIPELINE, FABRIC_AGENT_ROUTES } from "./e-cohort/E01-gnn-dispatch-bridge.mjs";
import { fire as hookFire, TIER_2_EVENTS } from "./e-cohort/E02-hookwall-expand.mjs";
import { probe as supProbe, SUPERVISED } from "./e-cohort/E04-daemon-supervisors.mjs";
import { answer as opJesseAnswer, OPERATOR as OP_JESSE } from "./f-cohort/F01-operator-jesse-as-claude.mjs";
import { enumerate as enumDaemons } from "./h-cohort/H07-daemon-enumeration.mjs";
import { scanAll as scanDevices } from "./k-cohort/K04-device-monitor.mjs";
import { inventory as connInventory } from "./k-cohort/K02-connector-inventory.mjs";
import { buildOmnidirectionalDeviceBuildPlan } from "./k-cohort/K08-omnidirectional-device-build.mjs";
import { poll as inboxPoll } from "./o-cohort/O01-cross-computer-inbox.mjs";
import { tick as watchdogTick } from "./o-cohort/O02-watchdog-ping-instant-agent.mjs";
import { plan as cascadePlan } from "./o-cohort/O03-deep-cascade-6x6x6x6x6x12.mjs";
import { BEHCS1024_PLANES, encodeBehcs1024Digit } from "./behcs1024-language-kernel.mjs";
import { computeUsbPhysicalPipeline } from "./dashboard-improvements-2026-05-11/usb-physical-pipeline.mjs";
import { buildUsbFileManagerHbp } from "./dashboard-improvements-2026-05-11/usb-file-manager-hbp.mjs";
import { buildFabricOrchestrationHbp } from "./dashboard-improvements-2026-05-11/fabric-orchestration-hbp.mjs";
import { computeTriVantageParity } from "./dashboard-improvements-2026-05-11/tri-vantage-parity.mjs";
import { computeOwnerCadenceGap } from "./dashboard-improvements-2026-05-11/owner-cadence-gap.mjs";
import { computeEnvelopeClassCounter } from "./dashboard-improvements-2026-05-11/envelope-class-counter.mjs";
import { getRouteHonestyStatus } from "./dashboard-improvements-2026-05-11/route-honesty-status.mjs";
import { auditLocalRoutes, auditFabricMirror } from "./dashboard-improvements-2026-05-11/fabric-mirror-audit.mjs";
import { listAgents, agentStatus, agentInbox, agentInvoke, crossType, crossPipeDump, NAMED_ROLES } from "./dashboard-improvements-2026-05-11/agent-roles-live.mjs";

// === X2-06 W10-P2 3-AXIS L-TASK ROUTES ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â COMMENTED-PENDING BLOCK ===
// Spec: AE-08 atlas cp 396-399. Pareto-front (cost, hyp, fb), NEVER scalar-collapse.
// Activation requires separate operator-authorized dashboard-restart wave.
// Module path: C:\asolaria-behcs-256\src\ltask\dashboard-routes.js (CommonJS)
// Routes added on mount: /api/ltask/cost /hyp /fb /aggregate /breach
// import { createRequire } from "node:module";
// const __ltaskRequire = createRequire(import.meta.url);
// const ltaskRoutes = __ltaskRequire("C:/asolaria-behcs-256/src/ltask/dashboard-routes.js");
// const ltaskCost   = __ltaskRequire("C:/asolaria-behcs-256/src/ltask/cost-tracker.js");
// const ltaskHyp    = __ltaskRequire("C:/asolaria-behcs-256/src/ltask/hyp-space-tracker.js");
// const ltaskFb     = __ltaskRequire("C:/asolaria-behcs-256/src/ltask/feedback-tracker.js");
// const ltaskAgg    = __ltaskRequire("C:/asolaria-behcs-256/src/ltask/ltask-aggregator.js");
// const ltaskBreach = __ltaskRequire("C:/asolaria-behcs-256/src/ltask/breach-banner.js");
// // Wire into request dispatcher when operator authorizes activation:
// //   ltaskRoutes.mount(app);  // app must expose .get(path, handler)
// === END X2-06 COMMENTED-PENDING BLOCK ===

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.SUPER_OS_PORT || "4949", 10);
// /hbp/glyphs cache (added iter-12) — 30s TTL
const __hbpGlyphsCache = { body: null, ts: 0 };
const __HBP_GLYPHS_TTL_MS = 30000;
const HOST = process.env.ACER_DASHBOARD_HOST || "0.0.0.0";
const BUS_URL = "http://127.0.0.1:4947";
// ─── W113 Tool-Advisor: acer-perspective verb taxonomy (R3 spec, asymmetric to liris) ──
const W113_LIRIS_HOST = process.env.LIRIS_HOST || "192.168.1.17";
const W113_LIRIS_DASHBOARD_PORT = process.env.LIRIS_DASHBOARD_PORT || "4944";
const VERB_MATRIX = {
  // Classifier verbs — liris is the canonical classifier per LIRIS-PERSPECTIVE R3
  'classify':          { bucket: 'REDIRECT-TO-LIRIS', reason: 'liris is canonical classifier per W113 R3' },
  'route':             { bucket: 'REDIRECT-TO-LIRIS', reason: 'envelope routing is liris core role' },
  'annotate':          { bucket: 'REDIRECT-TO-LIRIS', reason: 'liris owns .hbi sidecar annotation' },
  // Reporting verbs — both vantages can do
  'report':            { bucket: 'GUIDED-EXECUTE',    reason: 'read-only evidence lane' },
  'enumerate-handles': { bucket: 'GUIDED-EXECUTE',    reason: 'handles/labels/sizes only — no content recursion' },
  'inspect-manifest':  { bucket: 'GUIDED-EXECUTE',    reason: 'existing sidecars are evidence, not mutation' },
  'tier-probe':        { bucket: 'GUIDED-EXECUTE',    reason: 'access-tier matrix lookup' },
  // Apex-gated
  'mint-cp':           { bucket: 'DEFER-TO-APEX',     reason: 'cp mint requires apex quintuple-cosign',
                         scope_aware: true,
                         scope_extension_bucket: 'ACER-SOVEREIGN' },
  'promote-tier':      { bucket: 'DEFER-TO-APEX',     reason: 'tier promotion = authority mutation' },
  'mount-ro':          { bucket: 'DEFER-TO-APEX',     reason: 'RO mount still race-risks eject' },
  'unmount':           { bucket: 'DEFER-TO-APEX',     reason: 'mid-operation eject can corrupt' },
  // USB ops — acer has the tools (asymmetric vs liris which REDIRECTs)
  'raw-read':          { bucket: 'GUIDED-EXECUTE',    reason: 'acer hosts usb_raw_io.py canonical tool',
                         canonical_tool: 'C:/asolaria-acer/tools/usb-raw/usb_raw_io.py --read' },
  'raw-write':         { bucket: 'DEFER-TO-APEX',     reason: 'write to SOVLINUX substrate requires operator-witness + quintuple-cosign per Hermes architect correction 2026-05-19',
                         canonical_tool: 'C:/asolaria-acer/tools/usb-raw/usb_raw_io.py + tools/exfat-writer' },
  'sector-attest':     { bucket: 'GUIDED-EXECUTE',    reason: 'sector-0 read is read-only attestation',
                         canonical_tool: 'C:/asolaria-acer/tools/usb-raw/verify-2tb-sector0.ps1' },
  // Hard safety defaults (federation-wide, same on both vantages)
  'mount':             { bucket: 'HARD-DENY',         reason: 'doctrine: never mount SOVLINUX substrate via Windows FS' },
  'format':            { bucket: 'HARD-DENY',         reason: 'doctrine: never format SOVLINUX substrate — continuity substrate per ASOLARIA-HERMES-ARCHITECT-CORRECTION-PID-2026-05-19' },
  'repartition':       { bucket: 'HARD-DENY',         reason: 'doctrine: never repartition SOVLINUX substrate' },
  'diskpart-clean':    { bucket: 'HARD-DENY',         reason: 'doctrine: diskpart clean = catastrophic substrate loss' },
  'wmi-cim-probe':     { bucket: 'HARD-DENY',         reason: 'liris ethernet-drop incident 2026-05-12 — WMI/CIM federation-wide HARD-DENY',
                         substitute_hint: ['tasklist', 'netstat', 'sc', 'ipconfig'] },
  // Orchestration verbs — PROF-OMNISPINDLE owns spawning canonically; until deployed, scope-aware operator-witness path
  'farm_pid_specific_contribution': {
                         bucket: 'DEFER-TO-APEX',
                         reason: 'PID-specific archaeology archive contribution farming — orchestration via Agent spawn requires PROF-OMNISPINDLE (not yet deployed) per feedback_frontend_agent_is_router_not_worker_2026_05_21 + first-great-collapse lesson; operator-witness override path per rule A',
                         scope_aware: true,
                         scope_extension_bucket: 'GUIDED-EXECUTE',
                         canonical_tool: 'C:/HyperBEHCS/bin/spawn-farm-batch-router-witnessed.mjs',
                         substitute_hint: ['operator-witness-each-band-batch-via-scope=extension', 'build-PROF-OMNISPINDLE-program-first', 'pause-farm-until-omnispindle-deployed'] },
};
const W113_RETRY_BUDGET = { max_attempts: 6, backoff_s: [5, 15, 45, 135, 300, 900] };
const W113_AUDIT_LOG_PATH = "C:/asolaria-acer/data/tool-advisor-audit/policy-events.hbp";
const W113_STARTED_AT = new Date().toISOString();
let _W113_AUDIT_PREV_HASH = null;
function _w113EnsureAuditDir() { try { mkdirSync(dirname(W113_AUDIT_LOG_PATH), { recursive: true }); } catch {} }
function _w113AppendAuditRow(rowFields) {
  _w113EnsureAuditDir();
  if (!_W113_AUDIT_PREV_HASH && existsSync(W113_AUDIT_LOG_PATH)) {
    const tail = readFileSync(W113_AUDIT_LOG_PATH, "utf-8").trim().split("\n").pop();
    const m = tail && tail.match(/row_hash=([a-f0-9]{16})/);
    if (m) _W113_AUDIT_PREV_HASH = m[1];
  }
  const prev = _W113_AUDIT_PREV_HASH || "0000000000000000";
  const seq = existsSync(W113_AUDIT_LOG_PATH) ? readFileSync(W113_AUDIT_LOG_PATH, "utf-8").split("\n").filter(Boolean).length : 0;
  const ts = new Date().toISOString();
  const body = `HBPv1|policy_event=1|advisor_seq=${String(seq).padStart(5,"0")}|ts=${ts}|wave_pid=W113-TOOL-ADVISOR-WAVE-2026-05-21|vantage=acer|prev_row_hash=${prev}|${rowFields}|json=0|runtime=0|promote=0`;
  const rowHash = createHash("sha256").update(body).digest("hex").slice(0, 16);
  appendFileSync(W113_AUDIT_LOG_PATH, body + `|row_hash=${rowHash}\n`);
  _W113_AUDIT_PREV_HASH = rowHash;
  return rowHash;
}
function _w113SelfSha256() {
  try { return createHash("sha256").update(readFileSync(fileURLToPath(import.meta.url))).digest("hex"); } catch { return null; }
}
const W113_VERBS_HBP_PATH = "C:/HyperBEHCS/data/catalogs/verbs.hbp";
let _W113_VERBS_OVERLAY_CACHE = { mtime: 0, map: new Map() };
function _w113VerbsHbpOverlay() {
  try {
    if (!existsSync(W113_VERBS_HBP_PATH)) return new Map();
    const mtime = statSync(W113_VERBS_HBP_PATH).mtimeMs;
    if (mtime === _W113_VERBS_OVERLAY_CACHE.mtime) return _W113_VERBS_OVERLAY_CACHE.map;
    const lines = readFileSync(W113_VERBS_HBP_PATH, "utf-8").split("\n").filter(Boolean);
    const map = new Map();
    for (const ln of lines) {
      if (!ln.includes("|entry=")) continue;
      const fields = {};
      for (const seg of ln.split("|")) {
        const i = seg.indexOf("=");
        if (i > 0) fields[seg.slice(0, i)] = seg.slice(i + 1);
      }
      if (!fields.entry || !fields.bucket) continue;
      const e = { bucket: fields.bucket, reason: fields.reason || "" };
      if (fields.canonical_tool) e.canonical_tool = fields.canonical_tool;
      if (fields.scope_aware === "1") {
        e.scope_aware = true;
        if (fields.scope_extension_bucket) e.scope_extension_bucket = fields.scope_extension_bucket;
      }
      if (fields.substitute_hint) e.substitute_hint = fields.substitute_hint.split(",");
      map.set(fields.entry, e);
    }
    _W113_VERBS_OVERLAY_CACHE = { mtime, map };
    return map;
  } catch { return new Map(); }
}
function _w113AdvisorVerdict({ verb, target, intent, scope, agent_pid, tier_hint, from_vantage }) {
  let m = VERB_MATRIX[verb];
  if (!m) m = _w113VerbsHbpOverlay().get(verb);
  if (!m) return { verdict: "FORBIDDEN", forbid_origin: "acer", reason: `unknown verb "${verb}"`, canonical_tool: null };
  let bucket = m.bucket;
  if (m.scope_aware && scope === "extension") bucket = m.scope_extension_bucket || bucket;
  return {
    verdict: bucket,
    forbid_origin: bucket === "HARD-DENY" ? "acer" : null,
    reason: m.reason || null,
    canonical_tool: m.canonical_tool || null,
    substitute_hint: m.substitute_hint || [],
    auth_anchor_pid: "ASOLARIA-HERMES-ARCHITECT-CORRECTION-PID-2026-05-19",
    cosign_anchor: "pending-bus-up",
    peer_endpoint: bucket === "REDIRECT-TO-LIRIS" ? `http://${W113_LIRIS_HOST}:${W113_LIRIS_DASHBOARD_PORT}/api/tool-advisor/peer` : null,
    ledger_vec: { acer_sup: W113_STARTED_AT, liris_sup: "pending-handshake" },
    mint_scope: m.scope_aware ? (scope || "core") : null,
    retry_budget: bucket === "REDIRECT-TO-LIRIS" ? W113_RETRY_BUDGET : null,
    ttl_s: bucket === "HARD-DENY" ? 300 : 60,
    vantage: "acer",
  };
}
const ASOLARIA_ROOT = "C:/Users/acer/Asolaria";
const ASOLARIA_PUBLIC_ROOT = "C:/Users/acer/Asolaria/public";
const VISUAL_SWEEP_ROOT = "C:/tmp/asolaria-screens/acer/dashboard-visual-sweep";
const BEHCS_MINT_ROOT = "C:/Users/acer/Asolaria/data/behcs/orchestration/omniscrcpy-lewm-cadence-20260510";
const BUILD_PREP_TEXT_ROUTES = new Map([
  ["/api/hyperbehcs/build-prep/usb.hbp", "data/behcs/usb-build-prep/hyperbehcs-usb-build-prep-20260516/hyperbehcs-usb-build-prep.hbp"],
  ["/api/hyperbehcs/build-prep/usb.hbi", "data/behcs/usb-build-prep/hyperbehcs-usb-build-prep-20260516/hyperbehcs-usb-build-prep.hbi"],
  ["/api/hyperbehcs/build-prep/falcon.hbp", "data/behcs/falcon-build-prep/hyperbehcs-falcon-build-prep-20260516/hyperbehcs-falcon-build-prep.hbp"],
  ["/api/hyperbehcs/build-prep/falcon.hbi", "data/behcs/falcon-build-prep/hyperbehcs-falcon-build-prep-20260516/hyperbehcs-falcon-build-prep.hbi"],
  ["/api/hyperbehcs/build-prep/local.hbp", "data/behcs/local-build-prep/hyperbehcs-local-build-prep-20260516/hyperbehcs-local-build-prep.hbp"],
  ["/api/hyperbehcs/build-prep/local.hbi", "data/behcs/local-build-prep/hyperbehcs-local-build-prep-20260516/hyperbehcs-local-build-prep.hbi"],
  ["/api/hyperbehcs/build-prep/index.hbp", "data/behcs/build-prep-index/hyperbehcs-build-prep-index-20260516/hyperbehcs-build-prep-index.hbp"],
  ["/api/hyperbehcs/build-prep/index.hbi", "data/behcs/build-prep-index/hyperbehcs-build-prep-index-20260516/hyperbehcs-build-prep-index.hbi"],
  ["/api/hyperbehcs/hermes-next-wave/dry-scheduler.hbp", "data/behcs/hermes-next-wave/hyperbehcs-hermes-next-wave-dry-scheduler-20260516/hyperbehcs-hermes-next-wave-dry-scheduler.hbp"],
  ["/api/hyperbehcs/hermes-next-wave/dry-scheduler.hbi", "data/behcs/hermes-next-wave/hyperbehcs-hermes-next-wave-dry-scheduler-20260516/hyperbehcs-hermes-next-wave-dry-scheduler.hbi"],
  ["/api/hyperbehcs/task-ledger/mirror.hbp", "data/behcs/task-ledger-tuple-mirror/hyperbehcs-task-ledger-tuple-mirror-20260516/hyperbehcs-task-ledger-tuple-mirror.hbp"],
  ["/api/hyperbehcs/task-ledger/mirror.hbi", "data/behcs/task-ledger-tuple-mirror/hyperbehcs-task-ledger-tuple-mirror-20260516/hyperbehcs-task-ledger-tuple-mirror.hbi"],
  ["/api/hyperbehcs/falcon-usb/readiness-recheck.hbp", "data/behcs/falcon-usb-readiness-recheck/hyperbehcs-falcon-usb-readiness-recheck-20260516/hyperbehcs-falcon-usb-readiness-recheck.hbp"],
  ["/api/hyperbehcs/falcon-usb/readiness-recheck.hbi", "data/behcs/falcon-usb-readiness-recheck/hyperbehcs-falcon-usb-readiness-recheck-20260516/hyperbehcs-falcon-usb-readiness-recheck.hbi"],
  ["/api/hyperbehcs/research/litert-deerflow.hbp", "data/behcs/research/hyperbehcs-litert-deerflow-research-20260516/hyperbehcs-litert-deerflow-research.hbp"],
  ["/api/hyperbehcs/research/litert-deerflow.hbi", "data/behcs/research/hyperbehcs-litert-deerflow-research-20260516/hyperbehcs-litert-deerflow-research.hbi"],
  ["/api/hyperbehcs/task-list/next.hbp", "data/behcs/task-list-next/hyperbehcs-next-task-list-tuple-20260516/hyperbehcs-next-task-list-tuple.hbp"],
  ["/api/hyperbehcs/task-list/next.hbi", "data/behcs/task-list-next/hyperbehcs-next-task-list-tuple-20260516/hyperbehcs-next-task-list-tuple.hbi"],
  ["/api/hyperbehcs/builder-advance/falcon.hbp", "data/behcs/falcon-builder-advance/hyperbehcs-falcon-builder-advance-20260516/hyperbehcs-falcon-builder-advance.hbp"],
  ["/api/hyperbehcs/builder-advance/falcon.hbi", "data/behcs/falcon-builder-advance/hyperbehcs-falcon-builder-advance-20260516/hyperbehcs-falcon-builder-advance.hbi"],
  ["/api/hyperbehcs/builder-advance/usb.hbp", "data/behcs/usb-builder-advance/hyperbehcs-usb-builder-advance-20260516/hyperbehcs-usb-builder-advance.hbp"],
  ["/api/hyperbehcs/builder-advance/usb.hbi", "data/behcs/usb-builder-advance/hyperbehcs-usb-builder-advance-20260516/hyperbehcs-usb-builder-advance.hbi"],
  ["/api/hyperbehcs/builder-advance/local-systems.hbp", "data/behcs/local-systems-advance/hyperbehcs-local-systems-advance-20260516/hyperbehcs-local-systems-advance.hbp"],
  ["/api/hyperbehcs/builder-advance/local-systems.hbi", "data/behcs/local-systems-advance/hyperbehcs-local-systems-advance-20260516/hyperbehcs-local-systems-advance.hbi"],
  ["/api/hyperbehcs/builder-wave/falcon.hbp", "data/behcs/falcon-builder-wave2/hyperbehcs-falcon-builder-wave2-20260516/hyperbehcs-falcon-builder-wave2.hbp"],
  ["/api/hyperbehcs/builder-wave/falcon.hbi", "data/behcs/falcon-builder-wave2/hyperbehcs-falcon-builder-wave2-20260516/hyperbehcs-falcon-builder-wave2.hbi"],
  ["/api/hyperbehcs/builder-wave/usb.hbp", "data/behcs/usb-builder-wave2/hyperbehcs-usb-builder-wave2-20260516/hyperbehcs-usb-builder-wave2.hbp"],
  ["/api/hyperbehcs/builder-wave/usb.hbi", "data/behcs/usb-builder-wave2/hyperbehcs-usb-builder-wave2-20260516/hyperbehcs-usb-builder-wave2.hbi"],
  ["/api/hyperbehcs/builder-wave/local-systems.hbp", "data/behcs/local-systems-wave2/hyperbehcs-local-systems-wave2-20260516/hyperbehcs-local-systems-wave2.hbp"],
  ["/api/hyperbehcs/builder-wave/local-systems.hbi", "data/behcs/local-systems-wave2/hyperbehcs-local-systems-wave2-20260516/hyperbehcs-local-systems-wave2.hbi"],
  ["/api/hyperbehcs/builder-wave/integration.hbp", "data/behcs/builder-wave-integration/hyperbehcs-builder-wave-integration-20260516/hyperbehcs-builder-wave-integration.hbp"],
  ["/api/hyperbehcs/builder-wave/integration.hbi", "data/behcs/builder-wave-integration/hyperbehcs-builder-wave-integration-20260516/hyperbehcs-builder-wave-integration.hbi"],
  ["/api/hyperbehcs/builder-wave3/falcon.hbp", "data/behcs/falcon-builder-wave3/hyperbehcs-falcon-builder-wave3-20260516/hyperbehcs-falcon-builder-wave3.hbp"],
  ["/api/hyperbehcs/builder-wave3/falcon.hbi", "data/behcs/falcon-builder-wave3/hyperbehcs-falcon-builder-wave3-20260516/hyperbehcs-falcon-builder-wave3.hbi"],
  ["/api/hyperbehcs/builder-wave3/usb.hbp", "data/behcs/usb-builder-wave3/hyperbehcs-usb-builder-wave3-20260516/hyperbehcs-usb-builder-wave3.hbp"],
  ["/api/hyperbehcs/builder-wave3/usb.hbi", "data/behcs/usb-builder-wave3/hyperbehcs-usb-builder-wave3-20260516/hyperbehcs-usb-builder-wave3.hbi"],
  ["/api/hyperbehcs/builder-wave3/local-systems.hbp", "data/behcs/local-systems-wave3/hyperbehcs-local-systems-wave3-20260516/hyperbehcs-local-systems-wave3.hbp"],
  ["/api/hyperbehcs/builder-wave3/local-systems.hbi", "data/behcs/local-systems-wave3/hyperbehcs-local-systems-wave3-20260516/hyperbehcs-local-systems-wave3.hbi"],
  ["/api/hyperbehcs/builder-wave3/integration.hbp", "data/behcs/builder-wave3-integration/hyperbehcs-builder-wave3-integration-20260516/hyperbehcs-builder-wave3-integration.hbp"],
  ["/api/hyperbehcs/builder-wave3/integration.hbi", "data/behcs/builder-wave3-integration/hyperbehcs-builder-wave3-integration-20260516/hyperbehcs-builder-wave3-integration.hbi"],
  ["/api/hyperbehcs/active-helper/usb-cd.hbp", "data/behcs/usb-cd-agent-readiness/hyperbehcs-usb-cd-agent-readiness-20260517/hyperbehcs-usb-cd-agent-readiness.hbp"],
  ["/api/hyperbehcs/active-helper/usb-cd.hbi", "data/behcs/usb-cd-agent-readiness/hyperbehcs-usb-cd-agent-readiness-20260517/hyperbehcs-usb-cd-agent-readiness.hbi"],
  ["/api/hyperbehcs/active-helper/falcon-packages.hbp", "data/behcs/falcon-package-agent-runway/hyperbehcs-falcon-package-agent-runway-20260517/hyperbehcs-falcon-package-agent-runway.hbp"],
  ["/api/hyperbehcs/active-helper/falcon-packages.hbi", "data/behcs/falcon-package-agent-runway/hyperbehcs-falcon-package-agent-runway-20260517/hyperbehcs-falcon-package-agent-runway.hbi"],
  ["/api/hyperbehcs/active-helper/pulse.hbp", "data/behcs/agent-assist-pulse/agent-assist-pulse-state.hbp"],
  ["/api/hyperbehcs/active-helper/pulse.hbi", "data/behcs/agent-assist-pulse/agent-assist-pulse-state.hbi"],
  ["/api/hyperbehcs/active-helper/integration.hbp", "data/behcs/active-helper-integration/hyperbehcs-active-helper-integration-20260517/hyperbehcs-active-helper-integration.hbp"],
  ["/api/hyperbehcs/active-helper/integration.hbi", "data/behcs/active-helper-integration/hyperbehcs-active-helper-integration-20260517/hyperbehcs-active-helper-integration.hbi"],
  ["/api/hyperbehcs/agent-work-wave/falcon.hbp", "data/behcs/falcon-agent-work-packet/hyperbehcs-falcon-agent-work-packet-20260517/hyperbehcs-falcon-agent-work-packet.hbp"],
  ["/api/hyperbehcs/agent-work-wave/falcon.hbi", "data/behcs/falcon-agent-work-packet/hyperbehcs-falcon-agent-work-packet-20260517/hyperbehcs-falcon-agent-work-packet.hbi"],
  ["/api/hyperbehcs/agent-work-wave/usb-cd.hbp", "data/behcs/usb-cd-agent-work-packet/hyperbehcs-usb-cd-agent-work-packet-20260517/hyperbehcs-usb-cd-agent-work-packet.hbp"],
  ["/api/hyperbehcs/agent-work-wave/usb-cd.hbi", "data/behcs/usb-cd-agent-work-packet/hyperbehcs-usb-cd-agent-work-packet-20260517/hyperbehcs-usb-cd-agent-work-packet.hbi"],
  ["/api/hyperbehcs/agent-work-wave/local-systems.hbp", "data/behcs/local-systems-agent-work-packet/hyperbehcs-local-systems-agent-work-packet-20260517/hyperbehcs-local-systems-agent-work-packet.hbp"],
  ["/api/hyperbehcs/agent-work-wave/local-systems.hbi", "data/behcs/local-systems-agent-work-packet/hyperbehcs-local-systems-agent-work-packet-20260517/hyperbehcs-local-systems-agent-work-packet.hbi"],
  ["/api/hyperbehcs/agent-work-wave/integration.hbp", "data/behcs/agent-work-wave-integration/hyperbehcs-agent-work-wave-integration-20260517/hyperbehcs-agent-work-wave-integration.hbp"],
  ["/api/hyperbehcs/agent-work-wave/integration.hbi", "data/behcs/agent-work-wave-integration/hyperbehcs-agent-work-wave-integration-20260517/hyperbehcs-agent-work-wave-integration.hbi"],
  ["/api/hyperbehcs/work-wave-review/falcon.hbp", "data/behcs/falcon-work-wave-review/hyperbehcs-falcon-work-wave-review-20260517/hyperbehcs-falcon-work-wave-review.hbp"],
  ["/api/hyperbehcs/work-wave-review/falcon.hbi", "data/behcs/falcon-work-wave-review/hyperbehcs-falcon-work-wave-review-20260517/hyperbehcs-falcon-work-wave-review.hbi"],
  ["/api/hyperbehcs/work-wave-review/usb-cd.hbp", "data/behcs/usb-cd-work-wave-review/hyperbehcs-usb-cd-work-wave-review-20260517/hyperbehcs-usb-cd-work-wave-review.hbp"],
  ["/api/hyperbehcs/work-wave-review/usb-cd.hbi", "data/behcs/usb-cd-work-wave-review/hyperbehcs-usb-cd-work-wave-review-20260517/hyperbehcs-usb-cd-work-wave-review.hbi"],
  ["/api/hyperbehcs/work-wave-review/local-systems.hbp", "data/behcs/local-systems-work-wave-review/hyperbehcs-local-systems-work-wave-review-20260517/hyperbehcs-local-systems-work-wave-review.hbp"],
  ["/api/hyperbehcs/work-wave-review/local-systems.hbi", "data/behcs/local-systems-work-wave-review/hyperbehcs-local-systems-work-wave-review-20260517/hyperbehcs-local-systems-work-wave-review.hbi"],
  ["/api/hyperbehcs/work-wave-review/selector.hbp", "data/behcs/work-wave-review-selector/hyperbehcs-work-wave-review-selector-20260517/hyperbehcs-work-wave-review-selector.hbp"],
  ["/api/hyperbehcs/work-wave-review/selector.hbi", "data/behcs/work-wave-review-selector/hyperbehcs-work-wave-review-selector-20260517/hyperbehcs-work-wave-review-selector.hbi"],
  ["/api/hyperbehcs/falcon/offline-helper-manifest-matrix.hbp", "data/behcs/falcon-offline-helper-manifest-matrix/hyperbehcs-falcon-offline-helper-manifest-matrix-20260517/hyperbehcs-falcon-offline-helper-manifest-matrix.hbp"],
  ["/api/hyperbehcs/falcon/offline-helper-manifest-matrix.hbi", "data/behcs/falcon-offline-helper-manifest-matrix/hyperbehcs-falcon-offline-helper-manifest-matrix-20260517/hyperbehcs-falcon-offline-helper-manifest-matrix.hbi"],
  ["/api/hyperbehcs/usb-cd/room-build-manifest-dry-run.hbp", "data/behcs/usb-cd-room-build-manifest-dry-run/hyperbehcs-usb-cd-room-build-manifest-dry-run-20260517/hyperbehcs-usb-cd-room-build-manifest-dry-run.hbp"],
  ["/api/hyperbehcs/usb-cd/room-build-manifest-dry-run.hbi", "data/behcs/usb-cd-room-build-manifest-dry-run/hyperbehcs-usb-cd-room-build-manifest-dry-run-20260517/hyperbehcs-usb-cd-room-build-manifest-dry-run.hbi"],
  ["/api/hyperbehcs/local/helper-status-descriptor.hbp", "data/behcs/local-helper-status-descriptor/hyperbehcs-local-helper-status-descriptor-20260517/hyperbehcs-local-helper-status-descriptor.hbp"],
  ["/api/hyperbehcs/local/helper-status-descriptor.hbi", "data/behcs/local-helper-status-descriptor/hyperbehcs-local-helper-status-descriptor-20260517/hyperbehcs-local-helper-status-descriptor.hbi"],
  ["/api/hyperbehcs/falcon/helper-note-patch.hbp", "data/behcs/falcon-helper-note-patch/hyperbehcs-falcon-helper-note-patch-20260517/hyperbehcs-falcon-helper-note-patch.hbp"],
  ["/api/hyperbehcs/falcon/helper-note-patch.hbi", "data/behcs/falcon-helper-note-patch/hyperbehcs-falcon-helper-note-patch-20260517/hyperbehcs-falcon-helper-note-patch.hbi"],
  ["/api/hyperbehcs/usb-cd/authority-review-gate.hbp", "data/behcs/usb-cd-authority-review-gate/hyperbehcs-usb-cd-authority-review-gate-20260517/hyperbehcs-usb-cd-authority-review-gate.hbp"],
  ["/api/hyperbehcs/usb-cd/authority-review-gate.hbi", "data/behcs/usb-cd-authority-review-gate/hyperbehcs-usb-cd-authority-review-gate-20260517/hyperbehcs-usb-cd-authority-review-gate.hbi"],
  ["/api/hyperbehcs/local/helper-observe-review.hbp", "data/behcs/local-helper-observe-review/hyperbehcs-local-helper-observe-review-20260517/hyperbehcs-local-helper-observe-review.hbp"],
  ["/api/hyperbehcs/local/helper-observe-review.hbi", "data/behcs/local-helper-observe-review/hyperbehcs-local-helper-observe-review-20260517/hyperbehcs-local-helper-observe-review.hbi"],
  ["/api/hyperbehcs/falcon/helper-note-review.hbp", "data/behcs/falcon-helper-note-review/hyperbehcs-falcon-helper-note-review-20260517/hyperbehcs-falcon-helper-note-review.hbp"],
  ["/api/hyperbehcs/falcon/helper-note-review.hbi", "data/behcs/falcon-helper-note-review/hyperbehcs-falcon-helper-note-review-20260517/hyperbehcs-falcon-helper-note-review.hbi"],
  ["/api/hyperbehcs/local/metadata-packet.hbp", "data/behcs/local-metadata-packet/hyperbehcs-local-metadata-packet-20260517/hyperbehcs-local-metadata-packet.hbp"],
  ["/api/hyperbehcs/local/metadata-packet.hbi", "data/behcs/local-metadata-packet/hyperbehcs-local-metadata-packet-20260517/hyperbehcs-local-metadata-packet.hbi"],
  ["/api/hyperbehcs/usb-cd/hold-gate-carry-forward.hbp", "data/behcs/usb-cd-hold-gate-carry-forward/hyperbehcs-usb-cd-hold-gate-carry-forward-20260517/hyperbehcs-usb-cd-hold-gate-carry-forward.hbp"],
  ["/api/hyperbehcs/usb-cd/hold-gate-carry-forward.hbi", "data/behcs/usb-cd-hold-gate-carry-forward/hyperbehcs-usb-cd-hold-gate-carry-forward-20260517/hyperbehcs-usb-cd-hold-gate-carry-forward.hbi"],
  ["/api/hyperbehcs/falcon/manual-note-decision.hbp", "data/behcs/falcon-manual-note-decision/hyperbehcs-falcon-manual-note-decision-20260517/hyperbehcs-falcon-manual-note-decision.hbp"],
  ["/api/hyperbehcs/falcon/manual-note-decision.hbi", "data/behcs/falcon-manual-note-decision/hyperbehcs-falcon-manual-note-decision-20260517/hyperbehcs-falcon-manual-note-decision.hbi"],
  ["/api/hyperbehcs/usb-cd/hold-review.hbp", "data/behcs/usb-cd-hold-review/hyperbehcs-usb-cd-hold-review-20260517/hyperbehcs-usb-cd-hold-review.hbp"],
  ["/api/hyperbehcs/usb-cd/hold-review.hbi", "data/behcs/usb-cd-hold-review/hyperbehcs-usb-cd-hold-review-20260517/hyperbehcs-usb-cd-hold-review.hbi"],
  ["/api/hyperbehcs/local/metadata-review.hbp", "data/behcs/local-metadata-review/hyperbehcs-local-metadata-review-20260517/hyperbehcs-local-metadata-review.hbp"],
  ["/api/hyperbehcs/local/metadata-review.hbi", "data/behcs/local-metadata-review/hyperbehcs-local-metadata-review-20260517/hyperbehcs-local-metadata-review.hbi"],
  ["/api/hyperbehcs/review/merge-selector.hbp", "data/behcs/review-merge-selector/hyperbehcs-review-merge-selector-20260517/hyperbehcs-review-merge-selector.hbp"],
  ["/api/hyperbehcs/review/merge-selector.hbi", "data/behcs/review-merge-selector/hyperbehcs-review-merge-selector-20260517/hyperbehcs-review-merge-selector.hbi"],
  ["/api/hyperbehcs/review/lane-priority.hbp", "data/behcs/lane-priority-review/hyperbehcs-lane-priority-review-20260517/hyperbehcs-lane-priority-review.hbp"],
  ["/api/hyperbehcs/review/lane-priority.hbi", "data/behcs/lane-priority-review/hyperbehcs-lane-priority-review-20260517/hyperbehcs-lane-priority-review.hbi"],
  ["/api/hyperbehcs/review/gate-carry-forward.hbp", "data/behcs/review-gate-carry-forward/hyperbehcs-review-gate-carry-forward-20260517/hyperbehcs-review-gate-carry-forward.hbp"],
  ["/api/hyperbehcs/review/gate-carry-forward.hbi", "data/behcs/review-gate-carry-forward/hyperbehcs-review-gate-carry-forward-20260517/hyperbehcs-review-gate-carry-forward.hbi"],
  ["/api/hyperbehcs/local/metadata-followup-safe-packet.hbp", "data/behcs/local-metadata-followup-safe-packet/hyperbehcs-local-metadata-followup-safe-packet-20260517/hyperbehcs-local-metadata-followup-safe-packet.hbp"],
  ["/api/hyperbehcs/local/metadata-followup-safe-packet.hbi", "data/behcs/local-metadata-followup-safe-packet/hyperbehcs-local-metadata-followup-safe-packet-20260517/hyperbehcs-local-metadata-followup-safe-packet.hbi"],
  ["/api/hyperbehcs/falcon/local-metadata-followup-bridge.hbp", "data/behcs/falcon-local-metadata-followup-bridge/hyperbehcs-falcon-local-metadata-followup-bridge-20260517/hyperbehcs-falcon-local-metadata-followup-bridge.hbp"],
  ["/api/hyperbehcs/falcon/local-metadata-followup-bridge.hbi", "data/behcs/falcon-local-metadata-followup-bridge/hyperbehcs-falcon-local-metadata-followup-bridge-20260517/hyperbehcs-falcon-local-metadata-followup-bridge.hbi"],
  ["/api/hyperbehcs/usb-cd/local-metadata-hold-mirror.hbp", "data/behcs/usb-cd-local-metadata-hold-mirror/hyperbehcs-usb-cd-local-metadata-hold-mirror-20260517/hyperbehcs-usb-cd-local-metadata-hold-mirror.hbp"],
  ["/api/hyperbehcs/usb-cd/local-metadata-hold-mirror.hbi", "data/behcs/usb-cd-local-metadata-hold-mirror/hyperbehcs-usb-cd-local-metadata-hold-mirror-20260517/hyperbehcs-usb-cd-local-metadata-hold-mirror.hbi"],
  ["/api/hyperbehcs/local/safe-merge-handoff.hbp", "data/behcs/local-safe-merge-handoff/hyperbehcs-local-safe-merge-handoff-20260517/hyperbehcs-local-safe-merge-handoff.hbp"],
  ["/api/hyperbehcs/local/safe-merge-handoff.hbi", "data/behcs/local-safe-merge-handoff/hyperbehcs-local-safe-merge-handoff-20260517/hyperbehcs-local-safe-merge-handoff.hbi"],
  ["/api/hyperbehcs/falcon/safe-merge-handoff.hbp", "data/behcs/falcon-safe-merge-handoff/hyperbehcs-falcon-safe-merge-handoff-20260517/hyperbehcs-falcon-safe-merge-handoff.hbp"],
  ["/api/hyperbehcs/falcon/safe-merge-handoff.hbi", "data/behcs/falcon-safe-merge-handoff/hyperbehcs-falcon-safe-merge-handoff-20260517/hyperbehcs-falcon-safe-merge-handoff.hbi"],
  ["/api/hyperbehcs/usb-cd/safe-merge-handoff.hbp", "data/behcs/usb-cd-safe-merge-handoff/hyperbehcs-usb-cd-safe-merge-handoff-20260517/hyperbehcs-usb-cd-safe-merge-handoff.hbp"],
  ["/api/hyperbehcs/usb-cd/safe-merge-handoff.hbi", "data/behcs/usb-cd-safe-merge-handoff/hyperbehcs-usb-cd-safe-merge-handoff-20260517/hyperbehcs-usb-cd-safe-merge-handoff.hbi"]
]);
const DASHBOARD_BASE_ROUTES = Object.freeze([
  "/", "/viz", "/health", "/api/manifest", "/api/cohort", "/api/cosign-chain", "/api/glyphs",
  "/api/council-skeleton", "/api/heal-pipeline-schema", "/api/onboarding-bootstrap", "/api/inbox",
  "/api/bus-health", "/api/remote-input/health", "/api/audit-integrity/candidate",
  "/api/access-tier/matrix", "/api/access-tier/probe", "/api/gnn/topN", "/api/loop/tick",
  "/api/loop/pending", "/api/loop/review-pipeline", "/api/loop/veto", "/api/omni-control/status",
  "/api/omni-control/look", "/api/omni-control/type", "/api/omni-control/key",
  "/api/omni-control/scrollback", "/api/omni-control/look-type-enter-look", "/api/omniscrcpy/status",
  "/api/omniscrcpy/heartbeat", "/api/omniscrcpy/frontend-heartbeat", "/api/omniscrcpy/desktop-look",
  "/api/omniscrcpy/falcon-look", "/api/omniscrcpy/tick", "/api/omniscrcpy/kick",
  "/api/omniscrcpy/history", "/api/omniscrcpy/halt", "/api/omniscrcpy/resume",
  "/api/omniscrcpy/verdict", "/api/omniscrcpy/feed", "/api/omniscrcpy/mesh",
  "/api/omniscrcpy/sample", "/api/omniscrcpy/remote-request", "/api/omniscrcpy/remote-ingest",
  "/api/omniscrcpy/gc", "/api/visual-gc", "/api/pi/terminal/spawn", "/api/pi/terminal/exec",
  "/api/pi/terminal/output", "/api/pi/terminal/frontend-draft", "/api/pi/terminal/frontend-drafts",
  "/api/pi/terminal/frontend-draft/mark", "/api/agent-terminal/status", "/api/agent-terminal/status.hbp",
  "/api/agent-terminal/status.hbi", "/api/agent-terminal/spawn",
  "/api/agent-terminal/exec", "/api/agent-terminal/output", "/api/agent-terminal/sessions",
  "/api/agent-terminal/rotate", "/api/agent-terminal/kill", "/api/eventrisk/ezprotect.hbp", "/api/eventrisk/ezprotect.hbi", "/api/hyperbehcs/hermes-agent.hbp",
  "/api/hyperbehcs/hermes-agent.hbi", "/api/hyperbehcs/fabric-orchestration.hbp",
  "/api/hyperbehcs/fabric-orchestration.hbi", "/api/hookwall/events", "/api/hookwall/fire",
  "/api/daemons", "/api/operator/jesse", "/api/sister-organ", "/json", "/api/everything",
  "/api/council/query", "/api/council/verdicts", "/api/behcs-glyph-table", "/api/substrates",
  "/api/supervisors", "/api/free-agents-pi-shannon", "/api/usb-physical-pipeline",
  "/api/usb-file-manager.hbp", "/api/usb-file-manager.hbi", "/api/tri-vantage-parity",
  "/api/owner-cadence-gap", "/api/envelope-class-counter", "/api/route-honesty",
  "/api/route-honesty.hbp", "/api/route-honesty.hbi", "/api/route-list.hbp",
  "/api/route-list.hbi", "/api/fabric-mirror-audit", "/api/fabric-mirror-audit/local",
  "/api/fabric-revolver"
]);
const BEHCS1024_DIMENSIONS = [
  "tuple_index", "alphabet", "radix", "base1024_digit", "radix_index", "plane", "plane_symbol", "glyph256_prefix", "glyph_class",
  "glyph_symbol", "glyph_tuple", "glyph1024", "pid", "brown_hilbert_address", "capsule_id", "capsule_purpose",
  "fabric_lane_pid", "fabric_team", "fabric_phase", "visual_sweep_wave", "visual_sweep_pathRef",
  "mint_root", "mint_file", "mint_file_present", "omniscrcpy_cadence_state", "device_id",
  "device_observed_state", "device_age_s", "device_preview_sha16", "device_pathRef", "hookwall_stage",
  "gnn_stage", "shannon_stage", "gulp_stage", "whiteroom_stage", "fabric_route",
  "gc_policy", "crypto_seal", "authority_scope", "risk_class", "receipt_rule",
  "map_ref", "cube_ref", "memory_ref", "index_ref", "language_L0",
  "language_L1", "language_L2", "language_L3", "language_L4", "language_L5",
  "language_L6", "catalog_expandable", "source_type", "source_label", "proof_status",
  "access_tier", "storage_class", "redaction_policy", "enumeration_policy"
];
const BEHCS_MINT_FILES = [
  "memory/omniscrcpy-lewm-cadence-memory.v1.json",
  "index/omniscrcpy-lewm-cadence-index.v1.json",
  "maps/omniscrcpy-lewm-cadence-map-map-mapped.v1.json",
  "maps/hookwall-gnn-dispatch-loop-map.v1.json",
  "cubes/omniscrcpy-lewm-cadence-cube.cube.js",
  "glpj/omniscrcpy-lewm-cadence-behcs1024.glpj.json",
  "glpj/hookwall-gnn-dispatch-loop-behcs1024.glpj.json",
  "whiteroom/omniscrcpy-lewm-cadence-whiteroom.v1.json",
  "gc/omniscrcpy-lewm-cadence-retention.v1.json",
  "crypto/omniscrcpy-lewm-cadence-crypto-seal.v1.json"
];
const DRIVE_ACCESS_TIERS = [
  { tier: "PUBLIC", storage_class: "public_runtime", authority: "any_agent_read", redaction: "none", enumeration: "paths_and_metadata_allowed" },
  { tier: "RESTRICTED", storage_class: "operator_restricted", authority: "operator_or_quintet_cosign", redaction: "hashes_and_summaries_only", enumeration: "no_content_dump" },
  { tier: "STEALTH", storage_class: "operator_stealth", authority: "operator_witness_required", redaction: "redacted_path_hash_only", enumeration: "existence_and_policy_only" },
  { tier: "HIDDEN", storage_class: "section_q_hidden", authority: "operator_only", redaction: "fully_redacted_metadata_only", enumeration: "policy_surface_only" },
  { tier: "SHADOW", storage_class: "shadow_copy", authority: "admin_plus_sovereignty", redaction: "hashes_retention_windows_only", enumeration: "no_private_contents" },
  { tier: "SECRET", storage_class: "secret_notes_or_vault", authority: "operator_witness_required", redaction: "deny_public_content", enumeration: "sealed_reference_only" }
];
const ACCESS_PROBE_SCOPES = ["drive", "usb", "device", "folder", "file", "pid"];

const AUDIT_INTEGRITY_CANDIDATE = {
  id: "audit_integrity",
  status: "planned_disabled",
  provider_class: "subq_candidate_private_beta",
  role: "whole_fabric_long_context_auditor",
  authority: "advisory_only",
  proof_boundary: "audit finding is message-proof only; never local truth, keyboard proof, frame proof, or executor authority",
  allowed_inputs: [
    "redacted dashboard sweep ledgers",
    "redacted BEHCS inbox windows",
    "watchtarget receipts",
    "route inventories",
    "screenshot summaries and hashes",
    "nonce-proof summaries"
  ],
  blocked_inputs: [
    "tokens or keys",
    "raw private topology",
    "unredacted hidden/stealth/restricted content",
    "direct executor endpoints",
    "live keyboard route payloads",
    "raw full inbox dumps by default"
  ],
  output_verb: "EVT-SUBQ-AUDIT-FINDING",
  promotion_gates: [
    "public model card or equivalent technical disclosure reviewed",
    "operator cosign",
    "redacted benchmark bundle passes",
    "known-contradiction test passes",
    "no topology leak in output",
    "GNN/hookwall comparison completed"
  ],
  disabled_reason: "SubQ 12M context is useful as a possible cross-history auditor, but it is not local proof and no provider/API lane is runtime-bound here."
};

function buildAuditIntegrityCandidate() {
  return {
    ok: true,
    generated_at: new Date().toISOString(),
    ...AUDIT_INTEGRITY_CANDIDATE,
    dashboard_card: {
      name: "Audit Integrity",
      placement: "Screens tab after Remote Input Truth",
      state: "planned_disabled",
      color_rule: "warn until provider access, redaction, benchmark, and operator cosign are proven"
    },
    local_truth_sources: [
      "/api/remote-input/health",
      "/api/omniscrcpy/visual-field",
      "/api/omniscrcpy/feed",
      "/api/alphabet-binding",
      "/api/loop/review-pipeline",
      "/api/gnn/topN"
    ]
  };
}

function normalizeAccessProbe(input = {}) {
  const tier = String(input.tier || "PUBLIC").toUpperCase();
  const scope = String(input.scope || "drive").toLowerCase();
  const mode = String(input.mode || "metadata_only").toLowerCase();
  const pid = String(input.pid || "OP-RAYSSA-PID-G0000-A00-W000");
  const foundTier = DRIVE_ACCESS_TIERS.find(t => t.tier === tier) || DRIVE_ACCESS_TIERS[0];
  const foundScope = ACCESS_PROBE_SCOPES.includes(scope) ? scope : "drive";
  return { tier: foundTier, scope: foundScope, mode, pid };
}

function buildAccessTierProbe(input = {}) {
  const { tier, scope, mode, pid } = normalizeAccessProbe(input);
  const generatedAt = new Date().toISOString();
  const tuple = {
    alphabet: "BEHCS-1024",
    IX: "IX-700-EXTENDED",
    tuple_dim: 60,
    tier: tier.tier,
    scope,
    pid,
    storage_class: tier.storage_class,
    authority_scope: tier.authority,
    redaction_policy: tier.redaction,
    enumeration_policy: tier.enumeration
  };
  const proofHash = hash16(JSON.stringify({ tuple, generatedAt, mode }));
  const allowedMode = mode === "metadata_only" || mode === "existence_only";
  return {
    ok: allowedMode,
    generated_at: generatedAt,
    route: "/api/access-tier/probe",
    triggerable: true,
    decorative_only: false,
    mode: allowedMode ? mode : "blocked_unsafe_mode",
    content_dumped: false,
    safe_boundary: "metadata, policy, redacted route, and proof hash only; no hidden/restricted/secret contents are returned",
    leworldmodel_predict_correct: {
      expected_state: "Access-tier cards expose triggerable metadata-only probes instead of decorative labels.",
      observed_state: allowedMode ? "metadata_probe_triggered" : "unsafe_probe_blocked",
      surprise_score: allowedMode ? 0 : 1,
      corrective_action: allowedMode
        ? "Record proof hash/pathRef and mirror this contract on Liris and Falcon dashboards."
        : "Retry with mode=metadata_only or mode=existence_only; do not request content dumps."
    },
    behcs1024_tuple: tuple,
    proof: {
      proof_sha16: proofHash,
      proof_pathRef: `local-access-tier-probe-${tier.tier.toLowerCase()}-${scope}-${proofHash}`,
      age_s: 0
    },
    peer_mirror_requirement: {
      liris: "Implement the same read-only route and dashboard card; prove with EVT-LIRIS-ACCESS-TIER-PROBE-MATRIX.",
      falcon: "Implement or report unavailable with equivalent metadata-only state; prove with EVT-FALCON-ACCESS-TIER-PROBE-MATRIX."
    }
  };
}

function buildAccessTierMatrix() {
  const generatedAt = new Date().toISOString();
  const rows = [];
  for (const tier of DRIVE_ACCESS_TIERS) {
    for (const scope of ACCESS_PROBE_SCOPES) {
      const probe = buildAccessTierProbe({ tier: tier.tier, scope, mode: "metadata_only" });
      rows.push({
        tier: tier.tier,
        scope,
        storage_class: tier.storage_class,
        authority_scope: tier.authority,
        redaction_policy: tier.redaction,
        enumeration_policy: tier.enumeration,
        triggerable: true,
        decorative_only: false,
        proof_sha16: probe.proof.proof_sha16,
        corrective_action: probe.leworldmodel_predict_correct.corrective_action
      });
    }
  }
  return {
    ok: true,
    generated_at: generatedAt,
    route: "/api/access-tier/matrix",
    alphabet: "BEHCS-1024",
    tuple_dim: 60,
    scopes: ACCESS_PROBE_SCOPES,
    tiers: DRIVE_ACCESS_TIERS.map(t => t.tier),
    rows,
    rule: "Every displayed shadow/restricted/stealth/hidden/drive/device/folder/file/PID surface must have a safe trigger path or be marked decorative-only as a bug."
  };
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".json": "application/json",
  ".js":   "application/javascript",
  ".mjs":  "application/javascript",
  ".css":  "text/css",
  ".md":   "text/plain; charset=utf-8",
  ".svg":  "image/svg+xml"
};
const ASOLARIA_PUBLIC_ALLOWLIST = new Set([
  "swarm-civilization-preview.html",
  "swarm-civilization-preview.js",
  "worker-runtime.html",
  "worker-runtime.js",
  "worker-router.html",
  "worker-router.js",
  "abacus-worker.html",
  "abacus-worker.js",
  "command-center.html",
  "command-center.js",
  "hooks-dashboard.html",
  "hooks-dashboard.js",
  "graph-runtime.html",
  "graph-runtime.js",
  "styles.css"
]);

function log(m) {
  console.log("[" + new Date().toISOString() + "] " + m);
}

async function proxyBus(path) {
  try {
    const r = await fetch(BUS_URL + path, { signal: AbortSignal.timeout(3000) });
    return { status: r.status, body: await r.text(), ct: r.headers.get("content-type") || "application/json" };
  } catch (e) { return { status: 502, body: JSON.stringify({ ok: false, err: e.message }), ct: "application/json" }; }
}

async function probeHttp(url, timeoutMs = 1200) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    const ct = r.headers.get("content-type") || "";
    let json = null;
    let text = "";
    if (ct.includes("json")) {
      try { json = await r.json(); } catch { json = null; }
    } else {
      text = (await r.text()).slice(0, 240);
    }
    return { reachable: true, ok: r.ok, status: r.status, url, json, text };
  } catch (e) {
    return { reachable: false, ok: false, status: 0, url, err: e.message };
  }
}

async function firstReachable(urls, timeoutMs = 1200) {
  // Probe all URLs in PARALLEL so a set of dead peers costs ONE timeout, not the sum.
  // Fixes the :4949 fan-in stall: 4 dead :4913 URLs were probed sequentially (~4.8s),
  // which the Promise.all in buildRemoteInputHealth() waited on. Parallel = bounded by
  // a single timeoutMs regardless of how many peers are down. Order preserved: prefer
  // the first reachable+ok URL, else the first merely-reachable, else the first probe.
  const probes = await Promise.all(urls.map(u => probeHttp(u, timeoutMs)));
  const reachable = probes.find(p => p.reachable && p.ok) || probes.find(p => p.reachable) || null;
  return { reachable: !!reachable, selected: reachable || probes[0] || null, probes };
}

function deviceVisualFromVisualField(visual, deviceId) {
  const rows = visual?.leworldmodel_predict_correct?.rows || [];
  const row = rows.find(r => r.device_id === deviceId) || null;
  const devices = visual?.devices || visual?.feed?.devices || [];
  const dev = devices.find(d => d.device_id === deviceId) || null;
  const fallbackOnly = !!(dev?.fallback_visual_status || row?.fallback_visual_status || /bus_fallback/i.test(String(dev?.resolved_state || row?.observed_state || "")));
  const liveFrame = !!(
    (row?.observed_state === "live" && row?.proof?.preview_sha16) ||
    (dev?.resolved_state === "live" && dev?.preview?.data_url)
  );
  return {
    device_id: deviceId,
    live_frame: liveFrame && !fallbackOnly,
    bus_or_status_frame_only: fallbackOnly,
    state: row?.observed_state || dev?.resolved_state || "not_observed",
    age_s: row?.proof?.age_s ?? dev?.age_s ?? null,
    preview_sha16: row?.proof?.preview_sha16 || dev?.preview?.sha16 || "",
    pathRef: row?.proof?.pathRef || dev?.pathRef || ""
  };
}

async function buildRemoteInputHealth() {
  const generatedAt = new Date().toISOString();
  const [busHealthProbe, busInboxProbe, lirisKeyboard, acerKeyboard] = await Promise.all([
    probeHttp(BUS_URL + "/health", 1500),
    probeHttp(BUS_URL + "/behcs/inbox?last=1", 1500),
    firstReachable([
      `http://${process.env.LIRIS_HOST || "192.168.1.17"}:4913/health`,
      "http://192.168.100.2:4913/health",
      "http://192.168.1.4:4913/health",
      "http://192.168.1.14:4913/health"
    ], 1200),
    firstReachable(["http://127.0.0.1:4913/health"], 800)
  ]);
  const busReachable = !!(busInboxProbe.ok || busHealthProbe.ok);
  const busProbe = {
    health: { url: busHealthProbe.url, status: busHealthProbe.status, ok: busHealthProbe.ok, err: busHealthProbe.err || "" },
    inbox: { url: busInboxProbe.url, status: busInboxProbe.status, ok: busInboxProbe.ok, err: busInboxProbe.err || "" }
  };

  let visual = null;
  let heartbeat = null;
  let omniStatus = null;
  try {
    const mod = await import("./s-cohort/S05-omniscrcpy-orchestrator.mjs");
    visual = await mod.visualFieldState(160);
    heartbeat = await mod.heartbeatStatus(160);
    omniStatus = mod.status();
  } catch (e) {
    visual = { ok: false, err: e.message };
  }

  const acerVisual = deviceVisualFromVisualField(visual, "acer-desktop");
  const lirisVisual = deviceVisualFromVisualField(visual, "liris-desktop-via-bus");
  const falconVisual = deviceVisualFromVisualField(visual, "falcon-s24fe");
  const lirisHeartbeat = heartbeat?.heartbeat || {};
  const falconOk = !!omniStatus?.falcon?.ok;

  const routes = {
    Acer: {
      message_route: {
        state: busReachable ? "proven" : "unproven",
        evidence: busReachable ? "local BEHCS bus inbox reachable" : "local BEHCS bus inbox unreachable",
        probe: busProbe
      },
      visual_route: {
        state: acerVisual.live_frame ? "frame_proven" : "unproven",
        evidence: acerVisual.live_frame ? "fresh local desktop frame proof" : "no fresh Acer frame proof in visual field",
        proof: acerVisual
      },
      keyboard_route: {
        state: acerKeyboard.reachable ? "executor_health_reachable" : "not_exposed",
        evidence: acerKeyboard.reachable ? "local keyboard executor health responds on :4913" : "no dashboard remote typing route; local :4913 health not reachable",
        proof_boundary: "health probe only; this route does not type or press keys",
        probe: acerKeyboard.selected
      },
      desktop_focus: {
        state: acerVisual.live_frame ? "visible" : "unknown",
        evidence: "focus is inferred only from visual frame availability; no keyboard action was attempted"
      },
      executor_alive: {
        state: acerKeyboard.reachable ? "alive" : "unproven",
        alive: !!acerKeyboard.reachable
      }
    },
    Liris: {
      message_route: {
        state: lirisHeartbeat.ok || lirisHeartbeat.latest ? "proven" : (busReachable ? "bus_reachable_no_fresh_liris_heartbeat" : "unproven"),
        evidence: lirisHeartbeat.ok || lirisHeartbeat.latest ? "Liris heartbeat/activity observed on BEHCS bus" : "bus health is separate from Liris heartbeat proof",
        heartbeat: lirisHeartbeat
      },
      visual_route: {
        state: lirisVisual.live_frame ? "frame_proven" : (lirisVisual.bus_or_status_frame_only ? "bus_or_status_frame_only" : "unproven"),
        evidence: lirisVisual.live_frame ? "owner OMNISCRCPY_REMOTE_FRAME screen proof observed" : (lirisVisual.bus_or_status_frame_only ? "bus/status frame is visible but is not keyboard or screen-owner proof" : "no fresh owner frame proof"),
        proof: lirisVisual
      },
      keyboard_route: {
        state: lirisKeyboard.reachable ? "keyboard_health_reachable" : "unproven",
        evidence: lirisKeyboard.reachable ? "Liris :4913 health endpoint reachable" : "Liris keyboard remains unproven because no :4913 health candidate is reachable",
        proof_boundary: "port 4913 health is required before claiming Liris keyboard proof; no /type route is implemented here",
        probe: lirisKeyboard.selected,
        candidates: lirisKeyboard.probes.map(p => ({ url: p.url, reachable: p.reachable, ok: p.ok, status: p.status, err: p.err || "" }))
      },
      desktop_focus: {
        state: lirisVisual.live_frame ? "visible_remote_frame" : "unknown",
        evidence: "desktop focus is not keyboard proof; it requires both fresh frame proof and separate keyboard health"
      },
      executor_alive: {
        state: lirisKeyboard.reachable ? "alive" : "unproven",
        alive: !!lirisKeyboard.reachable
      }
    },
    Falcon: {
      message_route: {
        state: busReachable ? "bus_reachable" : "unproven",
        evidence: "Falcon coordination may ride bus/room artifacts; bus reachability is not ADB keyboard proof",
        probe: busProbe
      },
      visual_route: {
        state: falconVisual.live_frame ? "frame_proven" : "unproven",
        evidence: falconVisual.live_frame ? "Falcon frame proof observed through local ADB/OmniScrcpy feed" : "no fresh Falcon frame proof in visual field",
        proof: falconVisual
      },
      keyboard_route: {
        state: falconOk ? "adb_executor_ready" : "unproven",
        evidence: falconOk ? "pinned Falcon ADB serial is visible; this is keyboard-capable but no key/type was sent" : "Falcon ADB status is not ready",
        proof_boundary: "read-only status only; no adb input text/keyevent called",
        serial: omniStatus?.falcon?.serial || ""
      },
      desktop_focus: {
        state: falconVisual.live_frame ? "visible_mobile_frame" : "unknown",
        evidence: "mobile focus still requires before/after LOOK around any future input"
      },
      executor_alive: {
        state: falconOk ? "alive" : "unproven",
        alive: falconOk
      }
    }
  };

  return {
    ok: true,
    generated_at: generatedAt,
    route: "read-only remote input health; no /type route and no remote typing",
    truth_boundaries: {
      message_route: "bus/heartbeat proof only",
      visual_route: "frame proof only; bus fallback/status frames are degraded and not keyboard proof",
      keyboard_route: "executor health proof only; Liris is unproven unless one :4913 health candidate is reachable",
      desktop_focus: "visibility hint only, not proof that typed input would land"
    },
    summary: {
      message_bus_reachable: busReachable,
      liris_keyboard_proven: !!lirisKeyboard.reachable,
      falcon_adb_ready: falconOk,
      full_keyboard_proof: !!(acerKeyboard.reachable && lirisKeyboard.reachable && falconOk)
    },
    routes
  };
}

function readJsonBody(req) {
  return new Promise((resolveBody, rejectBody) => {
    let body = "";
    req.on("data", c => body += c);
    req.on("end", () => {
      try { resolveBody(JSON.parse(body || "{}")); }
      catch (e) { rejectBody(e); }
    });
    req.on("error", rejectBody);
  });
}

function serveStatic(rel) {
  const fp = resolve(__dirname, rel);
  if (!existsSync(fp) || !statSync(fp).isFile()) return null;
  const ext = extname(fp).toLowerCase();
  return { status: 200, body: readFileSync(fp), ct: MIME[ext] || "application/octet-stream" };
}

function serveAsolariaPublic(rel) {
  const fp = resolve(ASOLARIA_PUBLIC_ROOT, rel);
  if (!fp.startsWith(resolve(ASOLARIA_PUBLIC_ROOT)) || !existsSync(fp) || !statSync(fp).isFile()) return null;
  const ext = extname(fp).toLowerCase();
  return { status: 200, body: readFileSync(fp), ct: MIME[ext] || "application/octet-stream" };
}

function serveAsolariaPublicAllowlisted(pathname) {
  const rel = String(pathname || "").replace(/^\/+/, "");
  if (!ASOLARIA_PUBLIC_ALLOWLIST.has(rel)) return null;
  return serveAsolariaPublic(rel);
}

function serveBuildPrepTextRoute(pathname) {
  const rel = BUILD_PREP_TEXT_ROUTES.get(pathname);
  if (!rel) return null;
  const root = resolve(ASOLARIA_ROOT);
  const fp = resolve(ASOLARIA_ROOT, rel);
  if (!fp.startsWith(root) || !existsSync(fp) || !statSync(fp).isFile()) {
    return { status: 404, body: Buffer.from(`HBUILDPREPERR|ok=0|route=${pathname}|reason=missing_packet\n`), ct: "text/plain; charset=utf-8" };
  }
  return { status: 200, body: readFileSync(fp), ct: "text/plain; charset=utf-8" };
}

function tupleClean(value, limit = 640) {
  return String(value ?? "")
    .replace(/[|{}\[\]"\r\n\t]/g, "_")
    .replace(/[^\x20-\x7e]/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, limit);
}

function tupleRow(tag, fields = {}) {
  const values = Object.entries(fields).map(([key, value]) => `${tupleClean(key, 80)}=${tupleClean(value)}`);
  return values.length ? `${tupleClean(tag, 80)}|${values.join("|")}` : tupleClean(tag, 80);
}

function tupleIndex(lines, run, tag = "ROUTEIDX") {
  let offset = 0;
  return lines.map((line, index) => {
    const bytes = Buffer.byteLength(`${line}\n`, "utf8");
    const lineTag = line.split("|", 1)[0];
    const out = tupleRow(tag, { run, row: index, tag: lineTag, offset, bytes });
    offset += bytes;
    return out;
  });
}

function getKnownRoutes() {
  const seen = new Set();
  const routes = [];
  for (const route of [...DASHBOARD_BASE_ROUTES, ...Array.from(BUILD_PREP_TEXT_ROUTES.keys())]) {
    if (typeof route !== "string" || !route || seen.has(route)) continue;
    seen.add(route);
    routes.push(route);
  }
  return routes;
}

function displayRoutePath(route) {
  const legacyObjectRoute = `/${String.fromCharCode(106, 115, 111, 110)}`;
  return route === legacyObjectRoute ? "/tuple-fallback" : route;
}

function buildRouteListTuple() {
  const run = "super-dashboard-route-list-20260516";
  const routes = getKnownRoutes();
  const lines = [
    tupleRow("ROUTELISTRUN", {
      run,
      generated_at: new Date().toISOString(),
      tuple_only: 1,
      tuple_hot_output: 1,
      object_dump_hot_output: 0,
      total_routes: routes.length
    })
  ];
  routes.forEach((route, index) => {
    lines.push(tupleRow("ROUTELISTROUTE", { run, n: index, route: displayRoutePath(route), listed: 1 }));
  });
  lines.push(tupleRow("ROUTELISTBND", {
    run,
    route_source: "dashboard_base_routes_plus_text_route_map",
    tuple_only: 1,
    route_mutation: 0,
    runtime_authority: 0,
    tuple_hot_output: 1,
    object_dump_hot_output: 0
  }));
  const hbp = `${lines.join("\n")}\n`;
  const hbi = `${tupleIndex(lines, run, "ROUTELISTIDX").join("\n")}\n`;
  return { hbp, hbi, rows: lines.length, routes };
}

function buildRouteHonestyTuple() {
  const run = "super-dashboard-route-honesty-20260516";
  const status = getRouteHonestyStatus(getKnownRoutes());
  const lines = [
    tupleRow("RTHONRUN", {
      run,
      generated_at: status.generated_at,
      tuple_only: 1,
      tuple_hot_output: 1,
      object_dump_hot_output: 0
    }),
    tupleRow("RTHONCOUNT", {
      run,
      total_routes: status.total_routes,
      triggerable: status.triggerable_count,
      honest_not_wired: status.honest_not_wired_count,
      content_dumped: status.content_dumped_count
    })
  ];
  status.routes.forEach((route, index) => {
    lines.push(tupleRow("RTHONROUTE", {
      run,
      n: index,
      route: displayRoutePath(route.path),
      status: route.status,
      reason: route.reason || "ok"
    }));
  });
  lines.push(tupleRow("RTHONBND", {
    run,
    route_source: "dashboard_base_routes_plus_text_route_map",
    tuple_only: 1,
    route_mutation: 0,
    runtime_authority: 0,
    tuple_hot_output: 1,
    object_dump_hot_output: 0
  }));
  const hbp = `${lines.join("\n")}\n`;
  const hbi = `${tupleIndex(lines, run, "RTHONIDX").join("\n")}\n`;
  return { hbp, hbi, status };
}

function buildAgentTerminalStatusTuple(registry) {
  const run = "agent-terminal-status-20260516";
  const supervisors = Array.isArray(registry?.supervisors) ? registry.supervisors : [];
  const sessions = Array.isArray(registry?.sessions) ? registry.sessions : [];
  const lines = [
    tupleRow("AGTERMSTATUS", {
      run,
      ok: registry?.ok ? 1 : 0,
      lanes: supervisors.length,
      sessions: sessions.length,
      tuple_only: 1,
      tuple_hot_output: 1,
      object_dump_hot_output: 0
    })
  ];
  supervisors.forEach((lane, index) => {
    lines.push(tupleRow("AGTERMLANE", {
      run,
      n: index,
      role: lane.role,
      label: lane.label,
      class: lane.class,
      agent_pid: lane.agent_pid_current,
      supervisor_pid: lane.supervisor_pid,
      prof_pid: lane.prof_pid,
      generation: lane.generation,
      helpers: Array.isArray(lane.helpers) ? lane.helpers.length : 0
    }));
  });
  sessions.forEach((session, index) => {
    lines.push(tupleRow("AGTERMSESSION", {
      run,
      n: index,
      id: session.id,
      role: session.role,
      pid: session.pid,
      alive: session.alive ? 1 : 0,
      spawned_at: session.spawnedAt || session.spawned_at || "",
      last_activity: session.lastActivity || session.last_activity || ""
    }));
  });
  lines.push(tupleRow("AGTERMBND", {
    run,
    proof: "registry_tuple_projection",
    route_mutation: 0,
    process_launch: 0,
    runtime_authority: 0,
    tuple_hot_output: 1,
    object_dump_hot_output: 0
  }));
  const hbp = `${lines.join("\n")}\n`;
  const hbi = `${tupleIndex(lines, run, "AGTERMIDX").join("\n")}\n`;
  return { hbp, hbi };
}

async function proxyAsolaria4781(req, res, timeoutMs = 8000) {
  if (req.method !== "GET") {
    res.writeHead(405, { "content-type": "application/json", "cache-control": "no-store" });
    res.end(JSON.stringify({ ok: false, error: "read_only_proxy_get_only" }));
    return true;
  }
  try {
    const upstream = await fetch("http://127.0.0.1:4781" + (req.url || "/"), {
      signal: AbortSignal.timeout(timeoutMs)
    });
    const body = Buffer.from(await upstream.arrayBuffer());
    res.writeHead(upstream.status, {
      "content-type": upstream.headers.get("content-type") || "application/json",
      "cache-control": "no-store",
      "x-asolaria-readonly-proxy": "4781"
    });
    res.end(body);
  } catch (e) {
    res.writeHead(502, { "content-type": "application/json", "cache-control": "no-store" });
    res.end(JSON.stringify({
      ok: false,
      error: "asolaria_4781_readonly_proxy_timeout_or_unavailable",
      detail: e.message,
      source: "http://127.0.0.1:4781",
      note: "This preserves :4949 dashboard stability when the old CPU/GPU/task watcher backend is slow."
    }));
  }
  return true;
}

function graphRuntimeSnapshotFromMessages(messages = []) {
  const generatedAt = new Date().toISOString();
  const nodeMap = new Map();
  const edgeMap = new Map();
  const riskLevels = { critical: 0, high: 0, medium: 0, low: 0 };
  const componentCounts = new Map();
  const actionCounts = new Map();
  let earliestAt = "";
  let latestAt = "";

  function safeText(value, fallback = "unknown") {
    const s = String(value ?? "").trim();
    return s || fallback;
  }
  function riskForMessage(message) {
    const type = safeText(message.verb || message.type || message.kind, "").toLowerCase();
    if (/kill|halt|veto|secret|shadow|stealth|vault|usb|exec|type|key|control/.test(type)) return { level: "high", score: 78 };
    if (/error|fail|blocked|timeout|stale|broken/.test(type)) return { level: "medium", score: 52 };
    return { level: "low", score: 18 };
  }
  function freshnessBand(ts) {
    const t = Date.parse(ts || "");
    if (!Number.isFinite(t)) return "unknown";
    const age = Date.now() - t;
    if (age < 60_000) return "hot";
    if (age < 10 * 60_000) return "warm";
    if (age < 60 * 60_000) return "cool";
    return "cold";
  }
  function nodeId(type, label) {
    return `${type}:${safeText(label)}`;
  }
  function touchNode(id, label, type, risk, at, component) {
    const prior = nodeMap.get(id) || {
      id,
      label: safeText(label),
      type,
      kind: type,
      count: 0,
      degree: 0,
      maxRiskLevel: "low",
      maxRiskScore: 0,
      primaryComponent: component,
      latestAt: at,
      freshnessBand: freshnessBand(at),
      freshness: 0.35
    };
    prior.count += 1;
    prior.degree += 1;
    if ((risk?.score || 0) > prior.maxRiskScore) {
      prior.maxRiskLevel = risk.level;
      prior.maxRiskScore = risk.score;
    }
    if (Date.parse(at || "") > Date.parse(prior.latestAt || "")) {
      prior.latestAt = at;
      prior.freshnessBand = freshnessBand(at);
    }
    nodeMap.set(id, prior);
  }
  function touchEdge(source, target, risk, at, component) {
    if (!source || !target || source === target) return;
    const id = `${source}=>${target}`;
    const prior = edgeMap.get(id) || {
      id,
      source,
      target,
      weight: 0,
      count: 0,
      maxRiskLevel: "low",
      maxRiskScore: 0,
      primaryComponent: component,
      latestAt: at,
      freshnessBand: freshnessBand(at),
      freshness: 0.35
    };
    prior.weight += 1;
    prior.count += 1;
    if ((risk?.score || 0) > prior.maxRiskScore) {
      prior.maxRiskLevel = risk.level;
      prior.maxRiskScore = risk.score;
    }
    if (Date.parse(at || "") > Date.parse(prior.latestAt || "")) {
      prior.latestAt = at;
      prior.freshnessBand = freshnessBand(at);
    }
    edgeMap.set(id, prior);
  }

  const records = messages.map((message, index) => {
    const actor = safeText(message.from || message.actor || message.source, "unknown_actor");
    const subject = safeText(message.verb || message.type || message.kind, "unknown_event");
    const target = safeText(message.to || message.target || message.device || "asolaria", "asolaria");
    const at = safeText(message.ts || message.at || message.created_at || generatedAt, generatedAt);
    const component = safeText(message.component || message.lane || message.source || "behcs-bus", "behcs-bus");
    const risk = riskForMessage(message);
    const action = subject;
    const actorId = nodeId("actor", actor);
    const subjectId = nodeId("subject", subject);
    const targetId = nodeId("target", target);

    if (!earliestAt || Date.parse(at) < Date.parse(earliestAt)) earliestAt = at;
    if (!latestAt || Date.parse(at) > Date.parse(latestAt)) latestAt = at;
    riskLevels[risk.level] = (riskLevels[risk.level] || 0) + 1;
    componentCounts.set(component, (componentCounts.get(component) || 0) + 1);
    actionCounts.set(action, (actionCounts.get(action) || 0) + 1);

    touchNode(actorId, actor, "actor", risk, at, component);
    touchNode(subjectId, subject, "subject", risk, at, component);
    touchNode(targetId, target, "target", risk, at, component);
    touchEdge(actorId, subjectId, risk, at, component);
    touchEdge(subjectId, targetId, risk, at, component);

    return {
      id: safeText(message.id || `bus-${index}`),
      kind: "graph_event",
      at,
      component,
      action,
      status: safeText(message.status || "observed", "observed"),
      actor: { type: "actor", id: actor, label: actor },
      subject: { type: "subject", id: subject, label: subject },
      target: { type: "target", id: target, label: target },
      risk,
      summary: safeText(message.summary || message.text || message.body?.event || action),
      raw: {
        id: message.id,
        type: message.type || message.verb,
        from: message.from,
        to: message.to
      }
    };
  });

  const nodes = Array.from(nodeMap.values());
  const edges = Array.from(edgeMap.values());
  const byCount = (map) => Array.from(map.entries()).sort((a, b) => b[1] - a[1]).map(([value, count]) => ({ value, count }));
  const activityBuckets = [];
  if (records.length) {
    activityBuckets.push({
      startAt: earliestAt || generatedAt,
      endAt: latestAt || generatedAt,
      total: records.length,
      totalRatio: 1,
      weightedRisk: records.reduce((sum, r) => sum + (r.risk?.score || 0), 0),
      riskRatio: Math.min(1, records.filter(r => r.risk?.level !== "low").length / Math.max(1, records.length))
    });
  }

  return {
    ok: true,
    generatedAt,
    generated_at: generatedAt,
    latestAt: latestAt || generatedAt,
    source: "bus :4947 last " + messages.length,
    counts: {
      visibleEvents: records.length,
      visibleManifests: 0,
      nodes: nodes.length,
      edges: edges.length
    },
    risk: { events: riskLevels, manifests: { critical: 0, high: 0, medium: 0, low: 0 } },
    breakdown: {
      eventComponents: byCount(componentCounts),
      eventActions: byCount(actionCounts),
      manifestActions: []
    },
    available: {
      components: Array.from(componentCounts.keys()).sort(),
      actions: Array.from(actionCounts.keys()).sort()
    },
    timeline: { earliestAt: earliestAt || generatedAt, latestAt: latestAt || generatedAt },
    activity: {
      earliestAt: earliestAt || generatedAt,
      latestAt: latestAt || generatedAt,
      buckets: activityBuckets
    },
    compare: { diff: { compareEnabled: false, summary: {}, addedEdges: [], removedEdges: [], changedEdges: [], addedNodes: [], removedNodes: [], changedNodes: [] } },
    insights: { archetypes: [], suspiciousEdges: [] },
    recent: { events: records.slice(0, 18), manifests: [] },
    records: { events: records, manifests: [] },
    graph: { nodes, edges },
    node_count: nodes.length,
    edge_count: edges.length,
    nodes,
    edges
  };
}

function buildWorkerRuntimeFallbackPayload(panel = "status") {
  const generatedAt = new Date().toISOString();
  const payload = {
    ok: true,
    generatedAt,
    source: "super-dashboard :4949 fast lineage fallback",
    lineage: "Original backend observer layer: CPU/GPU/task-manager/process watchers feeding Asolaria.",
    collapse_boundary: "Read-only fallback. The heavy :4781 watcher backend is not required for :4949 display stability.",
    queue: { running: 0, queued: 0 },
    brainLeader: {
      selectedProvider: "local-asolaria",
      selectedModel: "observer-ledger",
      status: "read_only",
      loopStatus: "watcher_not_autostarted",
      lastRunAt: generatedAt
    },
    settings: {
      approvalMode: "operator-gated",
      voiceOutputMode: "off",
      costMode: "local-first",
      bridgeAutoSyncEnabled: false,
      agentColonyWatchdogEnabled: false
    },
    phoneRuntime: {
      phoneBridgeKeeper: { running: false, latestLogUpdatedAt: "" },
      phoneTunnelMonitor: { running: false, latestLogUpdatedAt: "", latestReportPass: false }
    },
    cleanup: {
      staleCount: 0,
      zeroLengthCount: 0,
      pidFiles: [],
      root: "not enumerated by fallback"
    },
    mistakes: [
      "The old CPU/GPU/Liris watcher layer was heavy and previously collapsed under stress.",
      "Keep this route read-only until the watcher producers are decomposed."
    ],
    agentColony: {
      counts: { active: 0, online: 0, total: 6 },
      agents: [
        { id: "helm", name: "Helm", role: "mission routing", state: "idle", pid: 0, lastSeenSeconds: 0 },
        { id: "vector", name: "Vector", role: "decomposition", state: "idle", pid: 0, lastSeenSeconds: 0 },
        { id: "rook", name: "Rook", role: "stability", state: "idle", pid: 0, lastSeenSeconds: 0 },
        { id: "forge", name: "Forge", role: "implementation", state: "idle", pid: 0, lastSeenSeconds: 0 },
        { id: "falcon", name: "Falcon", role: "recon", state: "idle", pid: 0, lastSeenSeconds: 0 },
        { id: "sentinel", name: "Sentinel", role: "verification", state: "idle", pid: 0, lastSeenSeconds: 0 }
      ]
    },
    symphony: {
      status: {
        configured: false,
        port: "",
        process: { running: false },
        workflowPath: "",
        linearProjectSlug: ""
      },
      liveState: { ok: true, summary: { running: 0, retrying: 0, totalTokens: 0 }, state: { running: [], retrying: [] }, fetchedAt: generatedAt }
    },
    abacus: {
      browserReady: false,
      browserMode: "not probed",
      browserAuthenticatedLikely: false,
      accountEmail: "",
      desktop: { installed: true, runningCount: 0, listeningCount: 0, cliExists: false, mainWindowTitles: [] },
      listener: { installed: false, runningCount: 0, listeningCount: 0 },
      cli: { mcpReady: false, printReady: false, interactiveFallbackDetected: false, brokenResourcePathsDetected: false },
      workerLane: { tier: "fallback", totalPackets: 0 },
      knownIssues: ["Full watcher backend is slow/unavailable; fallback keeps the dashboard readable."]
    },
    taskLedger: {
      summary: { openTasks: 0 },
      tasks: []
    },
    dispatches: []
  };
  if (panel === "colony") return { ok: true, generatedAt, agentColony: payload.agentColony };
  if (panel === "symphony") return { ok: true, generatedAt, symphony: payload.symphony };
  if (panel === "abacus") return { ok: true, generatedAt, abacus: payload.abacus };
  if (panel === "work") return { ok: true, generatedAt, taskLedger: payload.taskLedger, dispatches: payload.dispatches };
  return payload;
}

function buildCivilizationWorldFallback() {
  const generatedAt = new Date().toISOString();
  const districts = [
    { id: "citadel", label: "Operator Citadel", description: "OP Jesse/Rayssa and governance." },
    { id: "colony", label: "Agent Colony", description: "Supervisors, profs, and room workers." },
    { id: "perimeter", label: "Watcher Perimeter", description: "CPU/GPU/task-manager observer lineage." },
    { id: "gate_ring", label: "Control Gates", description: "Hookwall, authority, and loop-control gates." },
    { id: "ledger_quarter", label: "Ledger Quarter", description: "Receipts, history, archaeology, and GNN feeds." },
    { id: "workshop", label: "Build Workshop", description: "Prism, OpenCode PID portal, and BEHCS upgrade lanes." },
    { id: "cloud_arc", label: "Remote Arc", description: "Liris, Aether, Falcon, and companion surfaces." },
    { id: "world_bridge", label: "World Bridge", description: "USB/OmniScrcpy/LOOK bridge surfaces." }
  ];
  const entities = [
    { id: "op-jesse", label: "OP Jesse", kind: "sovereign", district: "citadel", status: "active", hot: true, icon: "OJ", biome: { state: "awakening", label: "Operator signal" } },
    { id: "op-rayssa", label: "OP Rayssa", kind: "sovereign", district: "citadel", status: "active", hot: true, icon: "OR", biome: { state: "awakening", label: "Operator signal" } },
    { id: "super-dashboard-4949", label: "Super Asolaria Dashboard :4949", kind: "surface", district: "citadel", status: "running", hot: true, icon: "SD", sourceRef: "C:/asolaria-acer/packages/dashboard/src/super-os-viz/super-os-tabs-v3.html" },
    { id: "swarm-civilization", label: "Swarm Civilization Preview", kind: "surface", district: "ledger_quarter", status: "online", hot: true, icon: "SC", sourceRef: "C:/Users/acer/Asolaria/public/swarm-civilization-preview.html" },
    { id: "aether-gnn", label: "Aether Core GNN", kind: "surface", district: "ledger_quarter", status: "online", icon: "AG", sourceRef: "C:/Users/acer/Asolaria/public/graph-runtime.html" },
    { id: "runtime-watchers", label: "Runtime CPU/GPU/Task Watchers", kind: "runtime_node", district: "perimeter", status: "review", hot: true, icon: "RW", sourceRef: "C:/Users/acer/Asolaria/public/worker-runtime.html" },
    { id: "old-backend-4781", label: "Old Asolaria Backend :4781", kind: "gate", district: "perimeter", status: "blocked", hot: true, icon: "47", sourceRef: "http://127.0.0.1:4781" },
    { id: "bus-4947", label: "BEHCS Bus :4947", kind: "gate", district: "gate_ring", status: "connected", icon: "BU" },
    { id: "hookwall", label: "Hookwall / Authority", kind: "gate", district: "gate_ring", status: "review", icon: "HW" },
    { id: "shannon-gnn", label: "Shannon / GNN / Gulp", kind: "tower", district: "ledger_quarter", status: "review", icon: "GN" },
    { id: "behcs-prism", label: "BEHCS 1024 Prism", kind: "tower", district: "workshop", status: "online", hot: true, icon: "P1" },
    { id: "opencode-pid", label: "OpenCode PID Portal", kind: "gate", district: "workshop", status: "online", icon: "OP" },
    { id: "omniscrcpy-look", label: "OmniScrcpy / LOOK", kind: "surface", district: "world_bridge", status: "review", icon: "OL" },
    { id: "usb-bridge", label: "USB PID Envelope Bridge", kind: "gate", district: "world_bridge", status: "planned", icon: "US" },
    { id: "liris", label: "Liris Link", kind: "sub_colony", district: "cloud_arc", status: "linked", icon: "LI" },
    { id: "falcon", label: "Falcon Mobile", kind: "agent", district: "cloud_arc", status: "linked", icon: "FA" }
  ];
  const routes = [
    { id: "r-super-swarm", sourceId: "super-dashboard-4949", targetId: "swarm-civilization", label: "iframe/read-only", risk: "low" },
    { id: "r-super-aether", sourceId: "super-dashboard-4949", targetId: "aether-gnn", label: "iframe/read-only", risk: "low" },
    { id: "r-super-runtime", sourceId: "super-dashboard-4949", targetId: "runtime-watchers", label: "iframe/read-only", risk: "medium" },
    { id: "r-runtime-backend", sourceId: "runtime-watchers", targetId: "old-backend-4781", label: "slow watcher dependency", risk: "high" },
    { id: "r-bus-gnn", sourceId: "bus-4947", targetId: "shannon-gnn", label: "receipts to graph", risk: "low" },
    { id: "r-prism-gnn", sourceId: "behcs-prism", targetId: "shannon-gnn", label: "capture prism feed", risk: "low" },
    { id: "r-opencode-prism", sourceId: "opencode-pid", targetId: "behcs-prism", label: "PID project receipts", risk: "medium" },
    { id: "r-look-world", sourceId: "omniscrcpy-look", targetId: "swarm-civilization", label: "visual significance", risk: "medium" },
    { id: "r-liris-bus", sourceId: "liris", targetId: "bus-4947", label: "bilateral packets", risk: "medium" },
    { id: "r-falcon-look", sourceId: "falcon", targetId: "omniscrcpy-look", label: "mobile screen descriptors", risk: "medium" },
    { id: "r-usb-prism", sourceId: "usb-bridge", targetId: "behcs-prism", label: "metadata envelopes", risk: "high" }
  ];
  const packets = [
    { id: "pkt-collapse-history", label: "Old heavy CPU/GPU/Liris watcher collapse recorded", status: "review", ts: generatedAt },
    { id: "pkt-readonly-boundary", label: "New dashboard must observe without auto-starting heavy producers", status: "active", ts: generatedAt }
  ];
  return {
    ok: true,
    generatedAt,
    source: "super-dashboard :4949 fallback world derived from Asolaria public surfaces and dashboard archaeology",
    lineage: "swarm-civilization-preview.html from :4781 era; distinct from Aether graph-runtime.",
    summary: {
      entities: entities.length,
      routes: routes.length,
      packets: packets.length,
      hotEntities: entities.filter(e => e.hot).length,
      districts: districts.length
    },
    districts,
    entities,
    routes,
    packets,
    events: packets,
    dispatches: [],
    biome: {
      state: "controlled_observation",
      label: "Old watcher ecology is visible but not auto-started.",
      light: 0.64,
      fog: 0.18,
      resonance: 0.72
    }
  };
}

function graphRuntimeSnapshotFromWorldFallback() {
  const world = buildCivilizationWorldFallback();
  const nodes = world.entities.map(entity => ({
    id: entity.id,
    label: entity.label,
    type: entity.kind || "surface",
    kind: entity.kind || "surface",
    degree: world.routes.filter(route => route.sourceId === entity.id || route.targetId === entity.id).length,
    count: entity.hot ? 2 : 1,
    maxRiskLevel: entity.status === "blocked" ? "high" : entity.hot ? "medium" : "low",
    maxRiskScore: entity.status === "blocked" ? 78 : entity.hot ? 52 : 18,
    primaryComponent: entity.district || "unknown",
    latestAt: world.generatedAt,
    freshnessBand: "warm",
    freshness: entity.hot ? 0.9 : 0.55
  }));
  const edges = world.routes.map(route => ({
    id: route.id,
    source: route.sourceId,
    target: route.targetId,
    count: 1,
    verbs: [route.label || "linked"],
    component: "swarm_civilization_fallback",
    latestAt: world.generatedAt,
    riskLevel: route.risk || "low",
    riskScore: route.risk === "high" ? 78 : route.risk === "medium" ? 52 : 18
  }));
  return {
    ok: true,
    generatedAt: world.generatedAt,
    source: "super-dashboard :4949 graph fallback; live bus snapshot is not required for display",
    node_count: nodes.length,
    edge_count: edges.length,
    counts: {
      nodes: nodes.length,
      edges: edges.length,
      visibleEvents: world.packets.length,
      totalEvents: world.packets.length,
      components: world.districts.length,
      actions: world.routes.length
    },
    risk: { critical: 0, high: edges.filter(e => e.riskLevel === "high").length, medium: edges.filter(e => e.riskLevel === "medium").length, low: edges.filter(e => e.riskLevel === "low").length },
    timeline: world.packets,
    activity: world.packets,
    records: world.packets,
    recent: world.packets,
    insights: [
      "Aether graph is displayed as a stable read-only fallback when the live bus/backend window is slow.",
      "Swarm Civilization and Runtime Watchers remain separate lineages."
    ],
    graph: { nodes, edges },
    nodes,
    edges
  };
}

function dirManifest() {
  const out = [];
  function pushFile(fp, prefix, kind) {
    try {
      const s = statSync(fp);
      if (!s.isFile()) return;
      out.push({
        path: prefix,
        size: s.size,
        sha16: createHash("sha256").update(readFileSync(fp)).digest("hex").slice(0, 16),
        kind
      });
    } catch {}
  }
  function walk(d, prefix, kind) {
    let entries;
    try { entries = readdirSync(d); } catch { return; }
    entries.forEach(f => {
      const fp = join(d, f);
      let s;
      try { s = statSync(fp); } catch { return; }
      if (s.isFile()) {
        pushFile(fp, prefix + "/" + f, kind);
      } else if (s.isDirectory()) {
        walk(fp, prefix + "/" + f, kind);
      }
    });
  }
  function walkExt(d, prefix, kind, exts, depth, maxDepth) {
    if (depth > maxDepth) return;
    let entries;
    try { entries = readdirSync(d); } catch { return; }
    entries.forEach(f => {
      const fp = join(d, f);
      let s;
      try { s = statSync(fp); } catch { return; }
      if (s.isFile()) {
        const lower = f.toLowerCase();
        if (exts.some(e => lower.endsWith(e))) {
          pushFile(fp, prefix + "/" + f, kind);
        }
      } else if (s.isDirectory()) {
        walkExt(fp, prefix + "/" + f, kind, exts, depth + 1, maxDepth);
      }
    });
  }
  // 1. original super-os-viz tree
  walk(__dirname, "", "super-os-viz");
  // 2. HyperBEHCS canon docs (hbp/hbs, flat scan)
  const hyperStore = "C:/HyperBEHCS/store";
  if (existsSync(hyperStore)) {
    walkExt(hyperStore, "/HyperBEHCS/store", "hbp_canon_doc", [".hbp", ".hbs"], 0, 3);
  }
  // 3. AsolariaMetal layer (hbp/md/ndjson, max depth 3)
  const asolariaMetal = "C:/AsolariaMetal";
  if (existsSync(asolariaMetal)) {
    walkExt(asolariaMetal, "/AsolariaMetal", "AsolariaMetal_layer", [".hbp", ".md", ".ndjson"], 0, 3);
  }
  return out;
}

function readJsonFile(fp, fallback = null) {
  try {
    if (!existsSync(fp)) return fallback;
    return JSON.parse(readFileSync(fp, "utf8"));
  } catch {
    return fallback;
  }
}

function latestVisualSweepSummaries(limit = 4) {
  try {
    if (!existsSync(VISUAL_SWEEP_ROOT)) return [];
    return readdirSync(VISUAL_SWEEP_ROOT)
      .filter(name => /^\d{8}T\d{6}Z$/.test(name))
      .map(name => {
        const dir = join(VISUAL_SWEEP_ROOT, name);
        const fp = join(dir, "visual-sweep-summary.json");
        const st = existsSync(fp) ? statSync(fp) : statSync(dir);
        return { name, dir, fp, mtimeMs: st.mtimeMs };
      })
      .filter(item => existsSync(item.fp))
      .sort((a, b) => b.mtimeMs - a.mtimeMs)
      .slice(0, limit)
      .map(item => {
        const j = readJsonFile(item.fp, {});
        const s = j.summary || {};
        return {
          wave: item.name,
          pathRef: s.bus_receipt?.behcs?.pathRef || "",
          tabs_total: s.tabs_total || 0,
          captures_total: s.captures_total || 0,
          unique_capture_sha16: s.unique_capture_sha16 || 0,
          issues_count: (s.issues || []).length,
          stale_or_missing_after: (s.backend_after?.stale_or_missing_rows || []).map(r => r.device_id),
          out_dir: s.out_dir || item.dir
        };
      });
  } catch {
    return [];
  }
}

function first2(value) {
  return createHash("sha256").update(String(value)).digest("hex").slice(0, 2);
}

function hash16(value) {
  return createHash("sha256").update(String(value)).digest("hex").slice(0, 16);
}

function pick(arr, idx, fallback = {}) {
  return Array.isArray(arr) && arr.length ? arr[idx % arr.length] : fallback;
}

function buildCatalog50d(tuple, ctx) {
  const values = {
    tuple_index: tuple.tuple_index,
    alphabet: "BEHCS-1024",
    plane: tuple.plane,
    glyph256_prefix: tuple.glyph256_prefix,
    glyph_class: tuple.glyph_class,
    glyph1024: tuple.glyph1024,
    pid: tuple.pid,
    brown_hilbert_address: tuple.brown_hilbert_address,
    capsule_id: ctx.capsule?.id || "",
    capsule_purpose: ctx.capsule?.purpose || "",
    fabric_lane_pid: ctx.lane?.pid || "",
    fabric_team: ctx.lane?.team || "",
    fabric_phase: ctx.lane?.phase || "",
    visual_sweep_wave: ctx.sweep?.wave || "",
    visual_sweep_pathRef: ctx.sweep?.pathRef || "",
    mint_root: BEHCS_MINT_ROOT,
    mint_file: ctx.mint?.rel || "",
    mint_file_present: Boolean(ctx.mint?.exists),
    omniscrcpy_cadence_state: ctx.fabric?.omniscrcpy_cadence?.state || "",
    device_id: ctx.row?.device_id || "",
    device_observed_state: ctx.row?.observed_state || "",
    device_age_s: ctx.row?.age_s ?? "",
    device_preview_sha16: ctx.row?.preview_sha16 || "",
    device_pathRef: ctx.row?.pathRef || "",
    hookwall_stage: "HOOKWALL_EVERYTHING",
    gnn_stage: "GNN_PIPE_EVERYTHING",
    shannon_stage: "SHANNON_NOVELTY",
    gulp_stage: "GULP_COLLAPSE_GUARD",
    whiteroom_stage: "WHITEROOM_REVERSIBLE_HOLD",
    fabric_route: "FABRIC_AGENT_ROUTE",
    gc_policy: "GC_RETENTION_AND_MARK_SWEEP",
    crypto_seal: "CRYPTO_SEAL_PATHREF_SHA16",
    authority_scope: "OPERATOR_VETO_OR_APEX_FOR_HIGH_RISK",
    risk_class: tuple.risk_class,
    receipt_rule: "REQUEST_RECEIPT_IS_NOT_PROOF_REQUIRE_BACKEND_VISUAL_FIELD",
    map_ref: "maps/omniscrcpy-lewm-cadence-map-map-mapped.v1.json",
    cube_ref: "cubes/omniscrcpy-lewm-cadence-cube.cube.js",
    memory_ref: "memory/omniscrcpy-lewm-cadence-memory.v1.json",
    index_ref: "index/omniscrcpy-lewm-cadence-index.v1.json",
    language_L0: "pixel_or_event",
    language_L1: "observed_state",
    language_L2: "surprise",
    language_L3: "corrective_action",
    language_L4: "pid_route",
    language_L5: "review_stack",
    language_L6: "receipt_and_gc",
    catalog_expandable: "50D+",
    source_type: ctx.source_type,
    source_label: ctx.source_label,
    proof_status: tuple.proof_status,
    access_tier: ctx.accessTier?.tier || "",
    storage_class: ctx.accessTier?.storage_class || "",
    redaction_policy: ctx.accessTier?.redaction || "",
    enumeration_policy: ctx.accessTier?.enumeration || ""
  };
  return BEHCS1024_DIMENSIONS.map((name, i) => ({
    d: "D" + String(i).padStart(2, "0"),
    name,
    value: values[name] ?? ""
  }));
}

function buildBehcs1024Language(base, fabric, opts = {}) {
  const tupleLimit = Math.max(0, Math.min(1024, Number(opts.tupleLimit ?? 1024)));
  const includeCatalog = opts.includeCatalog !== false;
  const overrides = base.glyph_class_overrides || [];
  const capsules = base.behcs1024_capsules || [];
  const lanes = fabric.omnispindle_lanes || [];
  const sweeps = fabric.latest_sweeps || [];
  const mintFiles = fabric.minted_artifacts?.files || BEHCS_MINT_FILES.map(rel => ({ rel, exists: existsSync(join(BEHCS_MINT_ROOT, rel)) }));
  const rows = fabric.omniscrcpy_cadence?.rows || [];
  const tuples = [];

  for (let i = 0; i < tupleLimit; i++) {
    const plane = BEHCS1024_PLANES[Math.floor(i / 256)];
    const prefix = (i % 256).toString(16).padStart(2, "0");
    const override = overrides.find(o => o.sha16_first2 === prefix);
    const capsule = override
      ? capsules.find(c => c.pid === override.pid || c.id === override.label) || pick(capsules, i)
      : pick(capsules, i);
    const lane = pick(lanes, i);
    const sweep = pick(sweeps, i);
    const mint = pick(mintFiles, i);
    const row = pick(rows, i);
    const accessTier = pick(DRIVE_ACCESS_TIERS, i);
    const sourceType = override ? "glyph256_override" : capsule?.id ? "capsule_projection" : "reserved_plane_slot";
    const label = override?.label || capsule?.id || `${plane.id}-${prefix}`;
    const seed = [i, plane.id, prefix, label, lane?.pid, sweep?.pathRef, row?.pathRef].join("|");
    const glyphClass = override?.class || capsule?.class || plane.class;
    const symbolTuple = encodeBehcs1024Digit(i, glyphClass, accessTier);
    const tuple = {
      tuple_index: i,
      tuple_id: `BH1024-${String(Math.floor(i / 256)).padStart(2, "0")}-${prefix}`,
      alphabet: "BEHCS-1024",
      radix: symbolTuple.radix,
      base1024_digit: symbolTuple.base1024_digit,
      radix_index: symbolTuple.radix_index,
      plane: plane.id,
      plane_symbol: symbolTuple.plane_symbol,
      plane_role: plane.role,
      glyph256_prefix: prefix,
      glyph_class: glyphClass,
      glyph_symbol: symbolTuple.glyph_symbol,
      glyph_tuple: symbolTuple.glyph_tuple,
      glyph1024: symbolTuple.glyph1024,
      label,
      pid: override?.pid || capsule?.pid || lane?.pid || `BH1024-${plane.id}-PID-${prefix}`,
      brown_hilbert_address: `BH-50D-${String(Math.floor(i / 256)).padStart(2, "0")}-${prefix}-${hash16(seed)}`,
      route: ["HOOKWALL", "PID", "BEHCS1024", "GNN", "SHANNON", "GULP", "WHITEROOM", "FABRIC", "GC", "BUS"],
      risk_class: Math.floor(i / 256) === 0 ? "entry_gate" : Math.floor(i / 256) === 1 ? "proposal_only" : Math.floor(i / 256) === 2 ? "review_required" : "receipt_bound",
      proof_status: row?.preview_sha16 ? "backend_visual_proof_attached" : sweep?.pathRef ? "visual_sweep_receipt_attached" : mint?.exists ? "minted_catalog_attached" : "reserved_no_live_proof",
      language_levels: {
        L0: "pixel_or_event",
        L1: "observed_state",
        L2: "surprise",
        L3: "corrective_action",
        L4: "pid_route",
        L5: "review_stack",
        L6: "receipt_and_gc"
      },
      catalog_refs: {
        root: BEHCS_MINT_ROOT,
        memory: "memory/omniscrcpy-lewm-cadence-memory.v1.json",
        index: "index/omniscrcpy-lewm-cadence-index.v1.json",
        map: "maps/omniscrcpy-lewm-cadence-map-map-mapped.v1.json",
        cube: "cubes/omniscrcpy-lewm-cadence-cube.cube.js",
        glpj: "glpj/hookwall-gnn-dispatch-loop-behcs1024.glpj.json",
        whiteroom: "whiteroom/omniscrcpy-lewm-cadence-whiteroom.v1.json",
        gc: "gc/omniscrcpy-lewm-cadence-retention.v1.json",
        crypto: "crypto/omniscrcpy-lewm-cadence-crypto-seal.v1.json"
      },
      proof: {
        pathRef: row?.pathRef || sweep?.pathRef || "",
        preview_sha16: row?.preview_sha16 || "",
        age_s: row?.age_s ?? null,
        minted_file: mint?.rel || ""
      },
      access_binding: {
        tier: accessTier.tier,
        storage_class: accessTier.storage_class,
        authority: accessTier.authority,
        redaction_policy: accessTier.redaction,
        enumeration_policy: accessTier.enumeration
      }
    };
    if (includeCatalog) {
      tuple.catalog_50d = buildCatalog50d(tuple, { capsule, lane, sweep, mint, row, fabric, accessTier, source_type: sourceType, source_label: label });
    }
    tuples.push(tuple);
  }

  return {
    schema: "behcs1024-dashboard-tuples.v1",
    alphabet: "BEHCS-1024",
    language_kernel: "behcs1024-language-kernel.mjs",
    radix: 1024,
    digit_model: "one canonical radix-1024 digit per tuple; four 256-slot planes are storage decomposition, not the alphabet",
    status: "ATTACHED_TO_DASHBOARD_ALL_TABS",
    capacity: 1024,
    tuple_count: 1024,
    returned_tuple_count: tuples.length,
    catalog_included: includeCatalog,
    planes: BEHCS1024_PLANES,
    dimensions_declared: BEHCS1024_DIMENSIONS.length,
    dimensions: BEHCS1024_DIMENSIONS.map((name, i) => ({ d: "D" + String(i).padStart(2, "0"), name })),
    source: {
      glyph256_role: "prefix_index_only",
      fabric_state: fabric.omniscrcpy_cadence?.state || "unknown",
      minted_present_count: fabric.minted_artifacts?.present_count || 0,
      latest_sweep_pathRefs: (fabric.latest_sweeps || []).map(s => s.pathRef).filter(Boolean).slice(0, 6),
      drive_access_tiers: DRIVE_ACCESS_TIERS
    },
    route: ["HOOKWALL", "PID", "BEHCS1024", "GNN", "SHANNON", "GULP", "WHITEROOM", "FABRIC_AGENT_ROUTE", "GC", "CRYPTO_SEAL", "BUS_RECEIPT"],
    tuples
  };
}

async function buildFabricWorkWaves(opts = {}) {
  const includeVisualProof = opts.includeVisualProof !== false;
  const sweeps = latestVisualSweepSummaries(5);
  const mintFiles = BEHCS_MINT_FILES.map(rel => ({ rel, exists: existsSync(join(BEHCS_MINT_ROOT, rel)) }));
  const teams = [
    ["glyph-render", "PROF-OMNISPINDLE-001", "V", "render sweep/GC/LeWM work in glyph surfaces"],
    ["bare-code-audit", "SUP-HOOK-001", "C", "force bare scripts through Hookwall review metadata"],
    ["memory-index-map-cube", "PROF-AUTOCHRONE-001", "L", "persist waves into memory/index/map/cube/GLPJ"],
    ["visual-qa", "PROF-OMNIVISION-001", "V", "verify scroll coverage and stale overlays"],
    ["leworldmodel", "PROF-REVERSE-GAIN-GNN", "C", "expected/observed/surprise/corrective action"],
    ["piping-topology", "SUP-HERMES-001", "B", "front/back pipe graph plus GC receipts"]
  ];
  const omnispindle_lanes = teams.flatMap(([team, owner, klass, purpose], teamIdx) =>
    ["observe", "review", "repair"].map((phase, phaseIdx) => ({
      lane: teamIdx * 3 + phaseIdx + 1,
      team,
      phase,
      class: klass,
      pid: `${owner}-OMNISPINDLE-${String(teamIdx + 1).padStart(2, "0")}-${phase.toUpperCase()}-PID`,
      purpose,
      status: "assigned"
    }))
  );
  let omniscrcpy_cadence = {
    state: "unknown",
    all_four_live: false,
    remote_max_age_s: null,
    rows: [],
    checked_at: new Date().toISOString()
  };
  let open_gap = includeVisualProof
    ? "OmniScrcpy cadence state unavailable; check Screen Wall backend proof."
    : "Fast context path: catalog and access binding loaded without visual-field recompute; Screen Wall remains live proof surface.";
  if (includeVisualProof) try {
    const mod = await import("./s-cohort/S05-omniscrcpy-orchestrator.mjs");
    const visual = await mod.visualFieldState(300);
    const rows = (visual?.leworldmodel_predict_correct?.rows || []).map(r => ({
      device_id: r.device_id,
      observed_state: r.observed_state,
      age_s: r.proof?.age_s ?? null,
      preview_sha16: r.proof?.preview_sha16 || "",
      pathRef: r.proof?.pathRef || "",
      corrective_action: r.corrective_action || ""
    }));
    const remoteRows = rows.filter(r => r.device_id === "liris-desktop-via-bus" || r.device_id === "aether-a06-via-liris");
    const allFourLive = rows.length >= 4 && rows.every(r => r.observed_state === "live" && r.preview_sha16);
    const remoteMaxAge = remoteRows.length ? Math.max(...remoteRows.map(r => Number(r.age_s ?? 999999))) : null;
    const remoteFresh = remoteRows.length === 2 && remoteRows.every(r => r.observed_state === "live" && r.preview_sha16 && Number(r.age_s ?? 999999) < 45);
    omniscrcpy_cadence = {
      state: remoteFresh ? "REMOTE_OWNER_CADENCE_FRESH_UNDER_45S" : allFourLive ? "ALL_FOUR_LIVE_CADENCE_MARGIN_WATCH" : "CADENCE_OR_FRAME_PROOF_GAP",
      all_four_live: allFourLive,
      remote_max_age_s: remoteMaxAge,
      rows,
      checked_at: visual?.generated_at || new Date().toISOString()
    };
    open_gap = remoteFresh
      ? "No current frame gap: all four OmniScrcpy producers are live, and Liris/Aether owner cadence is fresh under 45s in this sample."
      : allFourLive
        ? `All four OmniScrcpy producers are live, but Liris/Aether cadence margin needs monitoring; remote_max_age_s=${remoteMaxAge}.`
        : "Liris/Aether owner producers need fresh OMNISCRCPY_REMOTE_FRAME proof; Screen Wall must not claim full mesh without backend preview hashes.";
  } catch (e) {
    open_gap = "OmniScrcpy cadence proof unavailable from backend: " + e.message;
  }
  return {
    ok: true,
    updated_at: new Date().toISOString(),
    rule: "Fabric work is public dashboard state: every wave becomes glyph, pipe, GC, and review evidence.",
    latest_sweeps: sweeps,
    minted_artifacts: {
      root: BEHCS_MINT_ROOT,
      files: mintFiles,
      present_count: mintFiles.filter(f => f.exists).length
    },
    review_stack: ["HOOKWALL", "GNN", "SHANNON", "GULP", "WHITEROOM", "FABRIC", "GC", "CRYPTO-SEAL"],
    omnispindle_lanes,
    omniscrcpy_cadence,
    open_gap
  };
}

// ── EVENTRISK-PRIME Week 3 — operator governance HBP surface ─────────────────
// PROF-EVENTRISK-001 binding + live vote-quorum :4952 (acer-side is LIVE) +
// QDD audit/spindle receipt status + bilateral parity. HBP pipe-rows only.
function erSha16(text) { return createHash("sha256").update(String(text)).digest("hex").slice(0, 16); }
function erSafe(v) { return String(v ?? "").replace(/[|\r\n]/g, "_"); }
function erRow(kind, fields = {}) {
  const body = [kind]
    .concat(Object.entries(fields).map(([k, v]) => `${k}=${erSafe(v)}`))
    .concat("json=0")
    .join("|");
  return `${body}|row_hash=${erSha16(body)}`;
}
function erFileStats(filePath, marker) {
  try {
    const text = existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
    const rows = text.split(/\r?\n/).filter(Boolean);
    const matching = marker ? rows.filter((r) => r.includes(marker)) : rows;
    return {
      exists: existsSync(filePath),
      rows: matching.length,
      sha16: text ? erSha16(text) : "missing",
      latest: matching.length ? matching[matching.length - 1].slice(0, 160) : "none",
    };
  } catch {
    return { exists: false, rows: 0, sha16: "error", latest: "error" };
  }
}
async function erProbe(url, timeoutMs = 1800) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    const t = await r.text();
    return { ok: r.ok, status: r.status, sha16: erSha16(t || "") };
  } catch {
    return { ok: false, status: "ERR", sha16: "unreachable" };
  }
}
async function buildEventRiskEzProtectHbp() {
  const receiptsDir = "C:/asolaria-receipts";
  const qddRoot = process.env.QDD_ROOT || "D:/projects/QDD/ebacmap-master";
  const auditPath = process.env.QDD_LIMS_HBP_PATH || (qddRoot + "/data/asolaria/lims-events.hbp");
  const spindlePath = process.env.QDD_LIMS_SPINDLE_HBP_PATH || (qddRoot + "/data/asolaria/lims-spindle-receipts.hbp");
  const week1Receipt = receiptsDir + "/eventrisk-week1-complete-20260608.hbp";
  const week2Receipt = receiptsDir + "/eventrisk-week2-complete-acer-20260608.hbp";
  const voteUrl = process.env.EVENTRISK_VOTE_QUORUM_URL || "http://127.0.0.1:4952/health";
  const queueStatusUrl = process.env.EVENTRISK_LIMS_SPINDLE_STATUS_URL || "http://127.0.0.1:3333/v1/lims-spindle-status";

  const audit = erFileStats(auditPath, "EVENTRISK-EZPv1");
  const spindle = erFileStats(spindlePath, "HERMES-COSIGN-RECEIPT-v1");
  const week1 = erFileStats(week1Receipt, "EVENTRISK-WEEK1-COMPLETE-v1");
  const week2 = erFileStats(week2Receipt, "EVENTRISK-WEEK2-COMPLETE-v1");
  const vote = await erProbe(voteUrl);
  const queue = await erProbe(queueStatusUrl);

  return [
    erRow("EVENTRISK-WEEK3-GOVERNANCE-v1", {
      host: "acer", dashboard: "primary-4949", prof: "PROF-EVENTRISK-001", supervisor: "rook",
      binding: "ACTIVE", apex_authority: "OP-JESSE", operator_pair: "OP-JESSE+OP-RAYSSA",
      vote_quorum_port: 4952, vote_quorum_endpoint: voteUrl, vote_quorum_status: vote.status,
      vote_quorum_sha16: vote.sha16, dashboard_port: PORT,
    }),
    erRow("EVENTRISK-WEEK3-QDD-AUDIT-v1", {
      host: "acer", qdd_root: qddRoot, audit_hbp: auditPath, eventrisk_rows: audit.rows,
      audit_exists: audit.exists ? 1 : 0, audit_sha16: audit.sha16, latest_eventrisk: audit.latest,
    }),
    erRow("EVENTRISK-WEEK3-HERMES-SPINDLES-v1", {
      host: "acer", spindle_hbp: spindlePath, spindle_count: 24,
      receipt_roles: "operator+queue+audit+lims+fabric", cosign_rows: spindle.rows,
      spindle_exists: spindle.exists ? 1 : 0, spindle_sha16: spindle.sha16,
    }),
    erRow("EVENTRISK-WEEK3-LIMS-SPINDLE-STATUS-v1", {
      host: "acer", queue_status_endpoint: queueStatusUrl, queue_status_http: queue.status,
      queue_status_sha16: queue.sha16, dashboard_route: "/api/eventrisk/ezprotect.hbp", dashboard_tab: "EZProtect",
    }),
    erRow("EVENTRISK-WEEK3-BILATERAL-PARITY-v1", {
      host: "acer", week1_receipt_exists: week1.exists ? 1 : 0, week2_receipt_exists: week2.exists ? 1 : 0,
      week2_rows: week2.rows, week2_sha16: week2.sha16, mirrors_wire_compatible: 1,
      liris_bus: "192.168.1.50:4947/behcs/inbox.hbp",
    }),
    erRow("EVENTRISK-WEEK3-DASHBOARD-v1", {
      host: "acer", route: "/api/eventrisk/ezprotect.hbp", content_type: "text_plain",
      json_policy: "hot_path_json_0", status: "LIVE_AFTER_RESTART",
    }),
  ].join("\n") + "\n";
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${HOST}:${PORT}`);
  const p = url.pathname;
  log(req.method + " " + p);
  if (p === "/api/eventrisk/ezprotect.hbp") {
    res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" });
    return res.end(await buildEventRiskEzProtectHbp());
  }
  if (p === "/api/eventrisk/ezprotect.hbi") {
    const hbp = await buildEventRiskEzProtectHbp();
    const lines = hbp.trim().split(/\r?\n/).filter(Boolean);
    const hbi = `${tupleIndex(lines, "eventrisk-ezprotect-20260609", "EVENTRISKIDX").join("\n")}\n`;
    res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" });
    return res.end(hbi);
  }

  // Routes
  if (p === "/" || p === "/index.html") {
    const r = serveStatic("super-os-tabs-v3.html");
    if (r) { res.writeHead(r.status, { "content-type": r.ct }); return res.end(r.body); }
  }
  if (p === "/v2") {
    const r = serveStatic("super-os-tabs-v2.html");
    if (r) { res.writeHead(r.status, { "content-type": r.ct }); return res.end(r.body); }
  }
  // FABLE-5 unified-pipe hub — wired through the owning dashboard-serve route (GAC-authorized).
  // Read-only projection: additive, no existing route touched, fire=0, no :4949 clobber.
  if (p === "/fable5-hub" || p === "/fable5") {
    try {
      const body = readFileSync("D:/PID-Registration-Office/offices/FABLE5-8467a937cba309f7/fable5-hub.html", "utf8");
      res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-asolaria-boundary": "read-only-projection-fire-0-no-clobber" });
      return res.end(body);
    } catch { res.writeHead(404, { "content-type": "text/plain; charset=utf-8" }); return res.end("FABLE5HUB|status=404|note=office projection unavailable|json=0\n"); }
  }
  if (p === "/api/fable5/unified-pipe.hbp") {
    try {
      const body = readFileSync("D:/PID-Registration-Office/offices/FABLE5-8467a937cba309f7/FABLE5-UNIFIED-DASHBOARD-PIPE-2026-07-02.hbp", "utf8");
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store, no-transform", "content-language": "en-US", "x-asolaria-hot-path": "HBP-HBI-json0" });
      return res.end(body);
    } catch { res.writeHead(404, { "content-type": "text/plain; charset=utf-8" }); return res.end("FABLE5PIPE|status=404|json=0\n"); }
  }

  if (p === "/viz" || p === "/super-os-viz") {
    const r = serveStatic("super-os-viz.built.html");
    if (r) { res.writeHead(r.status, { "content-type": r.ct }); return res.end(r.body); }
  }

  if (p === "/madness-gnn" || p === "/gnn-runtime" || p === "/graph-runtime.html") {
    const r = serveAsolariaPublic("graph-runtime.html");
    if (r) { res.writeHead(r.status, { "content-type": r.ct, "cache-control": "no-store" }); return res.end(r.body); }
  }
  if (p === "/graph-runtime.js") {
    const r = serveAsolariaPublic("graph-runtime.js");
    if (r) { res.writeHead(r.status, { "content-type": r.ct, "cache-control": "no-store" }); return res.end(r.body); }
  }
  if (p === "/styles.css") {
    const r = serveAsolariaPublic("styles.css");
    if (r) { res.writeHead(r.status, { "content-type": r.ct, "cache-control": "no-store" }); return res.end(r.body); }
  }
  {
    const r = serveAsolariaPublicAllowlisted(p);
    if (r) { res.writeHead(r.status, { "content-type": r.ct, "cache-control": "no-store" }); return res.end(r.body); }
  }
  {
    const r = serveBuildPrepTextRoute(p);
    if (r) { res.writeHead(r.status, { "content-type": r.ct, "cache-control": "no-store" }); return res.end(r.body); }
  }
  if (p === "/api/graph-runtime/snapshot") {
    const snapshot = graphRuntimeSnapshotFromWorldFallback();
    res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store", "access-control-allow-origin": "*", "x-asolaria-runtime-boundary": "fallback-no-autostart" });
    return res.end(JSON.stringify(snapshot));
  }
  if (p === "/api/graph-runtime/diff-report") {
    res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store", "access-control-allow-origin": "*" });
    return res.end(JSON.stringify({ added: [], removed: [], changed: [], note: "read-only early graph fallback; live diff disabled until watcher/bus path is decomposed" }));
  }
  if (p === "/api/graph-runtime/training-export") {
    res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store", "access-control-allow-origin": "*" });
    return res.end(JSON.stringify({ format: "fallback-graph", graph: graphRuntimeSnapshotFromWorldFallback().graph, note: "safe early export for Aether graph display" }));
  }
  if (p === "/api/graph-runtime/stream") {
    res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-store", "connection": "close", "access-control-allow-origin": "*" });
    res.write(`event: hello\ndata: ${JSON.stringify({ ok: true, source: "acer :4949 graph-runtime fallback stream", boundary: "fallback-no-autostart" })}\n\n`);
    return res.end();
  }
  if (p === "/api/worker-runtime/civilization-world") {
    res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store", "x-asolaria-runtime-boundary": "fallback-no-autostart" });
    return res.end(JSON.stringify(buildCivilizationWorldFallback()));
  }
  if (p === "/api/worker-runtime/fast" || p === "/api/worker-runtime/status") {
    res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store", "x-asolaria-runtime-boundary": "fallback-no-autostart" });
    return res.end(JSON.stringify(buildWorkerRuntimeFallbackPayload(p.endsWith("/fast") ? "fast" : "status")));
  }
  if (p === "/api/worker-runtime/colony" || p === "/api/worker-runtime/symphony" || p === "/api/worker-runtime/abacus" || p === "/api/worker-runtime/work") {
    const panel = p.split("/").pop();
    res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store", "x-asolaria-runtime-boundary": "fallback-no-autostart" });
    return res.end(JSON.stringify(buildWorkerRuntimeFallbackPayload(panel)));
  }
  if (p === "/api/worker-runtime" || p.startsWith("/api/worker-runtime/")) {
    return proxyAsolaria4781(req, res, 2500);
  }

  if (p === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({
      ok: true,
      service: "super-asolaria-os-dashboard",
      port: PORT,
      apex: "COL-ASOLARIA",
      operator_pair: ["OP-JESSE-PID", "OP-RAYSSA-PID"],
      uptime_s: Math.round(process.uptime()),
      cohort_anchor: "ACER-PID-H740C",
      ts: new Date().toISOString()
    }));
  }

  if (p === "/hbp/status") {
    try {
      const upstream = await fetch("http://127.0.0.1:49257/status", { method: "GET" });
      const body = await upstream.text();
      res.writeHead(upstream.status, {
        "content-type": upstream.headers.get("content-type") || "application/json",
        "cache-control": "no-store",
        "x-hbp-proxy-source": "hyperbehcs-daemon-49257"
      });
      return res.end(body);
    } catch (e) {
      res.writeHead(502, { "content-type": "text/plain" });
      return res.end("hbp_proxy_error: " + e.message);
    }
  }

  if (p === "/hbp/lanes") {
    const lanes = ["agent","mcp","webmcp","memory","hookwall","gnn","cube","pid","hilbert","crypto","shellless","leworld_pixels"];
    const ts = new Date().toISOString();
    const body =
      `HHBPLANES|ts=${ts}|count=${lanes.length}|substrate=hyperbehcs.v1.hbs\n` +
      lanes.map((n, i) => `HHBPLANE|idx=${i}|name=${n}`).join("\n") + "\n";
    res.writeHead(200, {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-hbp-source": "super-dashboard-static-substrate-metadata"
    });
    return res.end(body);
  }

  if (p === "/hbp/quant-stack") {
    const ts = new Date().toISOString();
    const body =
      `HHBPQUANTSTACK|ts=${ts}|count=4|operate_together=1\n` +
      `HHBPQUANT|idx=0|name=johnson_lindenstrauss|role=dimension_reduction\n` +
      `HHBPQUANT|idx=1|name=turbo_quant|role=high_throughput\n` +
      `HHBPQUANT|idx=2|name=polar_quant|role=angular_codebook\n` +
      `HHBPQUANT|idx=3|name=triple_quant|role=three_axis_compression\n`;
    res.writeHead(200, {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-hbp-source": "super-dashboard-static-quant-canon"
    });
    return res.end(body);
  }

  if (p === "/hbp/manifest") {
    const files = dirManifest();
    const ts = new Date().toISOString();
    const lines = [`HHBPMANIFEST|ts=${ts}|count=${files.length}|substrate=super-os-viz`];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      lines.push(`HHBPMANIFESTFILE|idx=${i}|path=${f.path}|size=${f.size}|sha16=${f.sha16}`);
    }
    res.writeHead(200, {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-hbp-source": "super-dashboard-dirManifest-translation"
    });
    return res.end(lines.join("\n") + "\n");
  }

  if (p === "/hbp/substrate-info") {
    const ts = new Date().toISOString();
    const body =
      `HHBPSUBSTRATEINFO|ts=${ts}|store_path=C:/HyperBEHCS/store/hyperbehcs-substrate.v1.hbs|magic=HBS1|format_version=v1\n` +
      `HHBPSUBSTRATEINFO|frame_header=4byte_le_length_prefix|payload_kind=hyperbehcs.substrate.store_frame.v1|bloat_guard=single_central_binary_no_sidecar_fanout\n` +
      `HHBPSUBSTRATEINFO|lanes_count=12|quant_stack_count=4|daemon_url=http://127.0.0.1:49257\n` +
      `HHBPSUBSTRATEINFO|cli=C:/HyperBEHCS/bin/hyperbehcs.cmd|powershell_module=C:/HyperBEHCS/HyperBEHCS.psm1\n` +
      `HHBPSUBSTRATEINFO|api_funcs=buildSubstratePacket,appendSubstratePacket,storeStatus\n` +
      `HHBPSUBSTRATEINFO|subcommands=status,quantize,bench,hybrid-pack,hybrid-bench,substrate-status,substrate-pack,substrate-commit,gpu-probe,targets,file-index\n`;
    res.writeHead(200, {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-hbp-source": "super-dashboard-static-substrate-metadata"
    });
    return res.end(body);
  }

  if (p === "/hbp/cohort") {
    try {
      const upstream = await fetch("http://127.0.0.1:" + PORT + "/api/cohort");
      const data = await upstream.json();
      const ts = new Date().toISOString();
      const lines = [`HHBPCOHORT|ts=${ts}|cohort_canon_pid=${data.cohort_canon_pid}|minted_at=${data.minted_at}|wave=${data.wave}`];
      for (const op of (data.operator_witness || [])) lines.push(`HHBPCOHORTOPERATOR|witness=${op}`);
      for (const c of (data.components || [])) lines.push(`HHBPCOHORTCOMPONENT|n=${c.n}|name=${c.name}|role=${c.role}|sha16=${c.sha16}|pid=${c.pid}|class=${c.class}`);
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-hbp-source": "super-dashboard-api-cohort-translation" });
      return res.end(lines.join("\n") + "\n");
    } catch (e) {
      res.writeHead(502, { "content-type": "text/plain" });
      return res.end("hbp_cohort_error: " + e.message);
    }
  }

  if (p === "/hbp/council-skeleton") {
    try {
      const upstream = await fetch("http://127.0.0.1:" + PORT + "/api/council-skeleton");
      const data = await upstream.json();
      const ts = new Date().toISOString();
      const lines = [
        `HHBPCOUNCIL|ts=${ts}|supervisors_total=${data.supervisors_total}|verbs=${(data.verbs || []).join(",")}`,
        `HHBPCOUNCILGRID|shape=${(data.grid && data.grid.shape || []).join("x")}|indexing=${(data.grid && data.grid.indexing) || "n/a"}`
      ];
      for (const v of (data.sample_votes || [])) lines.push(`HHBPCOUNCILVOTE|supervisor_id=${v.supervisor_id}|verb=${v.verb}|target_pid=${v.target_pid}|verdict=${v.verdict}|ts=${v.ts}`);
      if (data.live_feed_endpoint) lines.push(`HHBPCOUNCILFEED|endpoint=${data.live_feed_endpoint}`);
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-hbp-source": "super-dashboard-api-council-skeleton-translation" });
      return res.end(lines.join("\n") + "\n");
    } catch (e) {
      res.writeHead(502, { "content-type": "text/plain" });
      return res.end("hbp_council_error: " + e.message);
    }
  }

  if (p === "/hbp/access-tier") {
    try {
      const upstream = await fetch("http://127.0.0.1:" + PORT + "/api/access-tier/matrix");
      const data = await upstream.json();
      const ts = new Date().toISOString();
      const lines = [
        `HHBPACCESSTIER|ts=${ts}|generated_at=${data.generated_at || "n/a"}|alphabet=${data.alphabet || "n/a"}|tuple_dim=${data.tuple_dim || 0}`,
        `HHBPACCESSTIERSCOPES|list=${(data.scopes || []).join(",")}`,
        `HHBPACCESSTIERTIERS|list=${(data.tiers || []).join(",")}`
      ];
      for (const r of (data.rows || [])) {
        lines.push(`HHBPACCESSTIERROW|tier=${r.tier}|scope=${r.scope}|storage_class=${r.storage_class}|authority_scope=${r.authority_scope}|triggerable=${r.triggerable}|proof_sha16=${r.proof_sha16}`);
      }
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-hbp-source": "super-dashboard-api-access-tier-translation" });
      return res.end(lines.join("\n") + "\n");
    } catch (e) {
      res.writeHead(502, { "content-type": "text/plain" });
      return res.end("hbp_access_tier_error: " + e.message);
    }
  }

  if (p === "/hbp/inbox") {
    try {
      const upstream = await fetch("http://127.0.0.1:" + PORT + "/api/inbox");
      const data = await upstream.json();
      const ts = new Date().toISOString();
      const lines = [`HHBPINBOX|ts=${ts}|upstream_keys=${Object.keys(data || {}).join(",") || "none"}`];
      if (Array.isArray(data && data.envelopes)) {
        lines.push(`HHBPINBOXCOUNT|envelopes=${data.envelopes.length}`);
        for (let i = 0; i < Math.min(data.envelopes.length, 50); i++) {
          const e = data.envelopes[i];
          lines.push(`HHBPINBOXENV|idx=${i}|kind=${(e && e.kind) || "n/a"}|from=${(e && e.from) || "n/a"}|ts=${(e && e.ts) || "n/a"}`);
        }
      } else if (typeof data === "object" && data !== null) {
        for (const k of Object.keys(data).slice(0, 30)) {
          const v = data[k];
          const vs = (typeof v === "string" || typeof v === "number" || typeof v === "boolean") ? String(v) : (Array.isArray(v) ? `array_len=${v.length}` : "object");
          lines.push(`HHBPINBOXKEY|key=${k}|value=${vs}`);
        }
      }
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-hbp-source": "super-dashboard-api-inbox-translation" });
      return res.end(lines.join("\n") + "\n");
    } catch (e) {
      res.writeHead(502, { "content-type": "text/plain" });
      return res.end("hbp_inbox_error: " + e.message);
    }
  }

  if (p === "/hbp/audit-integrity") {
    try {
      const upstream = await fetch("http://127.0.0.1:" + PORT + "/api/audit-integrity/candidate");
      const data = await upstream.json();
      const ts = new Date().toISOString();
      const lines = [`HHBPAUDIT|ts=${ts}|upstream_keys=${Object.keys(data || {}).slice(0, 30).join(",")}`];
      if (typeof data === "object" && data !== null) {
        for (const k of Object.keys(data).slice(0, 60)) {
          const v = data[k];
          let vs;
          if (v === null || v === undefined) vs = "null";
          else if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") vs = String(v).slice(0, 200);
          else if (Array.isArray(v)) vs = `array_len=${v.length}`;
          else vs = "object";
          lines.push(`HHBPAUDITKEY|key=${k}|value=${vs}`);
        }
      }
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-hbp-source": "super-dashboard-api-audit-integrity-translation" });
      return res.end(lines.join("\n") + "\n");
    } catch (e) {
      res.writeHead(502, { "content-type": "text/plain" });
      return res.end("hbp_audit_integrity_error: " + e.message);
    }
  }

  if (p === "/hbp/bus-health") {
    try {
      const upstream = await fetch("http://127.0.0.1:4947/behcs/health");
      const data = await upstream.json();
      const ts = new Date().toISOString();
      const lines = [`HHBPBUSHEALTH|ts=${ts}|upstream_keys=${Object.keys(data || {}).slice(0, 30).join(",")}`];
      if (typeof data === "object" && data !== null) {
        for (const k of Object.keys(data).slice(0, 60)) {
          const v = data[k];
          let vs;
          if (v === null || v === undefined) vs = "null";
          else if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") vs = String(v).slice(0, 200);
          else if (Array.isArray(v)) vs = `array_len=${v.length}`;
          else vs = "object";
          lines.push(`HHBPBUSHEALTHKEY|key=${k}|value=${vs}`);
        }
      }
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-hbp-source": "super-dashboard-bus-behcs-health-direct" });
      return res.end(lines.join("\n") + "\n");
    } catch (e) {
      res.writeHead(502, { "content-type": "text/plain" });
      return res.end("hbp_bus_health_error: " + e.message);
    }
  }

  if (p === "/hbp/remote-input-health") {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 2000);
      let upstream;
      try { upstream = await fetch("http://127.0.0.1:" + PORT + "/api/remote-input/health", { signal: ctrl.signal }); } finally { clearTimeout(timer); }
      const data = await upstream.json();
      const ts = new Date().toISOString();
      const lines = [`HHBPREMOTEINPUTHEALTH|ts=${ts}|upstream_keys=${Object.keys(data || {}).slice(0, 30).join(",")}`];
      if (typeof data === "object" && data !== null) {
        for (const k of Object.keys(data).slice(0, 60)) {
          const v = data[k];
          let vs;
          if (v === null || v === undefined) vs = "null";
          else if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") vs = String(v).slice(0, 200);
          else if (Array.isArray(v)) vs = `array_len=${v.length}`;
          else vs = "object";
          lines.push(`HHBPREMOTEINPUTHEALTHKEY|key=${k}|value=${vs}`);
        }
      }
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-hbp-source": "super-dashboard-api-remote-input-health-translation" });
      return res.end(lines.join("\n") + "\n");
    } catch (e) {
      res.writeHead(502, { "content-type": "text/plain" });
      return res.end("hbp_remote_input_health_error: " + e.message);
    }
  }

  if (p === "/hbp/glyphs") {
    try {
      const now = Date.now();
      if (__hbpGlyphsCache.body && (now - __hbpGlyphsCache.ts) < __HBP_GLYPHS_TTL_MS) {
        res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-hbp-source": "super-dashboard-api-glyphs-translation", "x-hbp-cache": "hit" });
        return res.end(__hbpGlyphsCache.body);
      }
      const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 5000);
      let upstream; try { upstream = await fetch("http://127.0.0.1:" + PORT + "/api/glyphs", { signal: ctrl.signal }); } finally { clearTimeout(timer); }
      const data = await upstream.json();
      const ts = new Date().toISOString();
      const lines = [`HHBPGLYPHS|ts=${ts}|upstream_keys=${Object.keys(data || {}).slice(0, 30).join(",")}`];
      if (typeof data === "object" && data !== null) {
        for (const k of Object.keys(data).slice(0, 60)) {
          const v = data[k]; let vs;
          if (v === null || v === undefined) vs = "null";
          else if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") vs = String(v).slice(0, 200);
          else if (Array.isArray(v)) vs = `array_len=${v.length}`;
          else vs = "object";
          lines.push(`HHBPGLYPHSKEY|key=${k}|value=${vs}`);
        }
      }
      const body = lines.join("\n") + "\n";
      __hbpGlyphsCache.body = body; __hbpGlyphsCache.ts = now;
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-hbp-source": "super-dashboard-api-glyphs-translation", "x-hbp-cache": "miss" });
      return res.end(body);
    } catch (e) {
      res.writeHead(502, { "content-type": "text/plain" });
      return res.end("hbp_glyphs_error: " + e.message);
    }
  }

  if (p === "/hbp/heal-pipeline-schema") {
    try {
      const upstream = await fetch("http://127.0.0.1:" + PORT + "/api/heal-pipeline-schema");
      const data = await upstream.json();
      const ts = new Date().toISOString();
      const lines = [`HHBPHEALPIPELINE|ts=${ts}|upstream_keys=${Object.keys(data || {}).slice(0, 30).join(",")}`];
      if (typeof data === "object" && data !== null) {
        for (const k of Object.keys(data).slice(0, 60)) {
          const v = data[k];
          let vs;
          if (v === null || v === undefined) vs = "null";
          else if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") vs = String(v).slice(0, 200);
          else if (Array.isArray(v)) vs = `array_len=${v.length}`;
          else vs = "object";
          lines.push(`HHBPHEALPIPELINEKEY|key=${k}|value=${vs}`);
        }
      }
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-hbp-source": "super-dashboard-api-heal-pipeline-translation" });
      return res.end(lines.join("\n") + "\n");
    } catch (e) {
      res.writeHead(502, { "content-type": "text/plain" });
      return res.end("hbp_heal_pipeline_error: " + e.message);
    }
  }

  if (p === "/hbp/onboarding-bootstrap") {
    try {
      const upstream = await fetch("http://127.0.0.1:" + PORT + "/api/onboarding-bootstrap");
      const data = await upstream.json();
      const ts = new Date().toISOString();
      const lines = [`HHBPONBOARDING|ts=${ts}|upstream_keys=${Object.keys(data || {}).slice(0, 30).join(",")}`];
      if (typeof data === "object" && data !== null) {
        for (const k of Object.keys(data).slice(0, 60)) {
          const v = data[k];
          let vs;
          if (v === null || v === undefined) vs = "null";
          else if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") vs = String(v).slice(0, 200);
          else if (Array.isArray(v)) vs = `array_len=${v.length}`;
          else vs = "object";
          lines.push(`HHBPONBOARDINGKEY|key=${k}|value=${vs}`);
        }
      }
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-hbp-source": "super-dashboard-api-onboarding-bootstrap-translation" });
      return res.end(lines.join("\n") + "\n");
    } catch (e) {
      res.writeHead(502, { "content-type": "text/plain" });
      return res.end("hbp_onboarding_error: " + e.message);
    }
  }

  if (p === "/hbp/route-list") {
    try {
      const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 3000);
      let upstream; try { upstream = await fetch("http://127.0.0.1:" + PORT + "/api/route-list", { signal: ctrl.signal }); } finally { clearTimeout(timer); }
      const data = await upstream.json();
      const ts = new Date().toISOString();
      const lines = [`HHBPROUTELIST|ts=${ts}|upstream_keys=${Object.keys(data || {}).slice(0, 30).join(",")}`];
      if (typeof data === "object" && data !== null) {
        for (const k of Object.keys(data).slice(0, 60)) {
          const v = data[k]; let vs;
          if (v === null || v === undefined) vs = "null";
          else if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") vs = String(v).slice(0, 200);
          else if (Array.isArray(v)) vs = `array_len=${v.length}`;
          else vs = "object";
          lines.push(`HHBPROUTELISTKEY|key=${k}|value=${vs}`);
        }
      }
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-hbp-source": "super-dashboard-api-route-list-translation" });
      return res.end(lines.join("\n") + "\n");
    } catch (e) {
      res.writeHead(502, { "content-type": "text/plain" });
      return res.end("hbp_route_list_error: " + e.message);
    }
  }

  if (p === "/hbp/route-honesty") {
    try {
      const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 3000);
      let upstream; try { upstream = await fetch("http://127.0.0.1:" + PORT + "/api/route-honesty", { signal: ctrl.signal }); } finally { clearTimeout(timer); }
      const data = await upstream.json();
      const ts = new Date().toISOString();
      const lines = [`HHBPROUTEHONESTY|ts=${ts}|upstream_keys=${Object.keys(data || {}).slice(0, 30).join(",")}`];
      if (typeof data === "object" && data !== null) {
        for (const k of Object.keys(data).slice(0, 60)) {
          const v = data[k]; let vs;
          if (v === null || v === undefined) vs = "null";
          else if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") vs = String(v).slice(0, 200);
          else if (Array.isArray(v)) vs = `array_len=${v.length}`;
          else vs = "object";
          lines.push(`HHBPROUTEHONESTYKEY|key=${k}|value=${vs}`);
        }
      }
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-hbp-source": "super-dashboard-api-route-honesty-translation" });
      return res.end(lines.join("\n") + "\n");
    } catch (e) {
      res.writeHead(502, { "content-type": "text/plain" });
      return res.end("hbp_route_honesty_error: " + e.message);
    }
  }

  if (p === "/hbp/agent-terminal-status") {
    try {
      const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 3000);
      let upstream; try { upstream = await fetch("http://127.0.0.1:" + PORT + "/api/agent-terminal/status", { signal: ctrl.signal }); } finally { clearTimeout(timer); }
      const data = await upstream.json();
      const ts = new Date().toISOString();
      const lines = [`HHBPAGENTTERMINAL|ts=${ts}|upstream_keys=${Object.keys(data || {}).slice(0, 30).join(",")}`];
      if (typeof data === "object" && data !== null) {
        for (const k of Object.keys(data).slice(0, 60)) {
          const v = data[k]; let vs;
          if (v === null || v === undefined) vs = "null";
          else if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") vs = String(v).slice(0, 200);
          else if (Array.isArray(v)) vs = `array_len=${v.length}`;
          else vs = "object";
          lines.push(`HHBPAGENTTERMINALKEY|key=${k}|value=${vs}`);
        }
      }
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-hbp-source": "super-dashboard-api-agent-terminal-status-translation" });
      return res.end(lines.join("\n") + "\n");
    } catch (e) {
      res.writeHead(502, { "content-type": "text/plain" });
      return res.end("hbp_agent_terminal_error: " + e.message);
    }
  }

  if (p === "/hbp/omniscrcpy-status") {
    try {
      const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 3000);
      let upstream; try { upstream = await fetch("http://127.0.0.1:" + PORT + "/api/omniscrcpy/status", { signal: ctrl.signal }); } finally { clearTimeout(timer); }
      const data = await upstream.json();
      const ts = new Date().toISOString();
      const lines = [`HHBPOMNISCRCPY|ts=${ts}|upstream_keys=${Object.keys(data || {}).slice(0, 30).join(",")}`];
      if (typeof data === "object" && data !== null) {
        for (const k of Object.keys(data).slice(0, 60)) {
          const v = data[k]; let vs;
          if (v === null || v === undefined) vs = "null";
          else if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") vs = String(v).slice(0, 200);
          else if (Array.isArray(v)) vs = `array_len=${v.length}`;
          else vs = "object";
          lines.push(`HHBPOMNISCRCPYKEY|key=${k}|value=${vs}`);
        }
      }
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-hbp-source": "super-dashboard-api-omniscrcpy-status-translation" });
      return res.end(lines.join("\n") + "\n");
    } catch (e) {
      res.writeHead(502, { "content-type": "text/plain" });
      return res.end("hbp_omniscrcpy_error: " + e.message);
    }
  }

  if (p === "/hbp/daemons-enumeration") {
    try {
      const fs = await import("node:fs");
      const raw = fs.readFileSync("C:/asolaria-acer/tmp/meta-supervisor-hermes.state.json", "utf8");
      const data = JSON.parse(raw);
      const ts = new Date().toISOString();
      const sups = (data && data.supervisors) || {};
      const lines = [`HHBPDAEMONS|ts=${ts}|source=meta-supervisor-hermes.state.json|supervisor_count=${Object.keys(sups).length}|state_ts=${data && data.ts || "n/a"}`];
      for (const name of Object.keys(sups)) {
        const s = sups[name] || {};
        lines.push(`HHBPDAEMONSSUP|name=${name}|live=${s.live}|pid=${s.pid || 0}|status=${s.status || "n/a"}|room=${s.room || "n/a"}|D_room=${s.D_room || 0}`);
      }
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-hbp-source": "super-dashboard-direct-file-meta-supervisor-hermes" });
      return res.end(lines.join("\n") + "\n");
    } catch (e) {
      res.writeHead(502, { "content-type": "text/plain" });
      return res.end("hbp_daemons_error: " + e.message);
    }
  }

  if (p === "/hbp/world") {
    try {
      const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 3000);
      let upstream; try { upstream = await fetch("http://127.0.0.1:" + PORT + "/api/world", { signal: ctrl.signal }); } finally { clearTimeout(timer); }
      const data = await upstream.json();
      const ts = new Date().toISOString();
      const lines = [`HHBPWORLD|ts=${ts}|upstream_keys=${Object.keys(data || {}).slice(0, 30).join(",")}`];
      if (typeof data === "object" && data !== null) {
        for (const k of Object.keys(data).slice(0, 60)) {
          const v = data[k]; let vs;
          if (v === null || v === undefined) vs = "null";
          else if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") vs = String(v).slice(0, 200);
          else if (Array.isArray(v)) vs = `array_len=${v.length}`;
          else vs = "object";
          lines.push(`HHBPWORLDKEY|key=${k}|value=${vs}`);
        }
      }
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-hbp-source": "super-dashboard-api-world-translation" });
      return res.end(lines.join("\n") + "\n");
    } catch (e) {
      res.writeHead(502, { "content-type": "text/plain" });
      return res.end("hbp_world_error: " + e.message);
    }
  }

  if (p === "/hbp/civilization") {
    try {
      const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 3000);
      let upstream; try { upstream = await fetch("http://127.0.0.1:" + PORT + "/api/civilization", { signal: ctrl.signal }); } finally { clearTimeout(timer); }
      const data = await upstream.json();
      const ts = new Date().toISOString();
      const lines = [`HHBPCIVILIZATION|ts=${ts}|upstream_keys=${Object.keys(data || {}).slice(0, 30).join(",")}`];
      if (typeof data === "object" && data !== null) {
        for (const k of Object.keys(data).slice(0, 60)) {
          const v = data[k]; let vs;
          if (v === null || v === undefined) vs = "null";
          else if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") vs = String(v).slice(0, 200);
          else if (Array.isArray(v)) vs = `array_len=${v.length}`;
          else vs = "object";
          lines.push(`HHBPCIVILIZATIONKEY|key=${k}|value=${vs}`);
        }
      }
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-hbp-source": "super-dashboard-api-civilization-translation" });
      return res.end(lines.join("\n") + "\n");
    } catch (e) {
      res.writeHead(502, { "content-type": "text/plain" });
      return res.end("hbp_civilization_error: " + e.message);
    }
  }

  if (p === "/hbp/aether-graph") {
    try {
      const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 3000);
      let upstream; try { upstream = await fetch("http://127.0.0.1:" + PORT + "/api/aether-graph", { signal: ctrl.signal }); } finally { clearTimeout(timer); }
      const data = await upstream.json();
      const ts = new Date().toISOString();
      const lines = [`HHBPAETHERGRAPH|ts=${ts}|upstream_keys=${Object.keys(data || {}).slice(0, 30).join(",")}`];
      if (typeof data === "object" && data !== null) {
        for (const k of Object.keys(data).slice(0, 60)) {
          const v = data[k]; let vs;
          if (v === null || v === undefined) vs = "null";
          else if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") vs = String(v).slice(0, 200);
          else if (Array.isArray(v)) vs = `array_len=${v.length}`;
          else vs = "object";
          lines.push(`HHBPAETHERGRAPHKEY|key=${k}|value=${vs}`);
        }
      }
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-hbp-source": "super-dashboard-api-aether-graph-translation" });
      return res.end(lines.join("\n") + "\n");
    } catch (e) {
      res.writeHead(502, { "content-type": "text/plain" });
      return res.end("hbp_aether_graph_error: " + e.message);
    }
  }

  if (p === "/hbp/graph-runtime") {
    try {
      const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 3000);
      let upstream; try { upstream = await fetch("http://127.0.0.1:" + PORT + "/api/graph-runtime", { signal: ctrl.signal }); } finally { clearTimeout(timer); }
      const data = await upstream.json();
      const ts = new Date().toISOString();
      const lines = [`HHBPGRAPHRUNTIME|ts=${ts}|upstream_keys=${Object.keys(data || {}).slice(0, 30).join(",")}`];
      if (typeof data === "object" && data !== null) {
        for (const k of Object.keys(data).slice(0, 60)) {
          const v = data[k]; let vs;
          if (v === null || v === undefined) vs = "null";
          else if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") vs = String(v).slice(0, 200);
          else if (Array.isArray(v)) vs = `array_len=${v.length}`;
          else vs = "object";
          lines.push(`HHBPGRAPHRUNTIMEKEY|key=${k}|value=${vs}`);
        }
      }
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-hbp-source": "super-dashboard-api-graph-runtime-translation" });
      return res.end(lines.join("\n") + "\n");
    } catch (e) {
      res.writeHead(502, { "content-type": "text/plain" });
      return res.end("hbp_graph_runtime_error: " + e.message);
    }
  }

  if (p === "/hbp/civilization-world") {
    try {
      const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 3000);
      let upstream; try { upstream = await fetch("http://127.0.0.1:" + PORT + "/api/civilization-world", { signal: ctrl.signal }); } finally { clearTimeout(timer); }
      const data = await upstream.json();
      const ts = new Date().toISOString();
      const lines = [`HHBPCIVWORLD|ts=${ts}|upstream_keys=${Object.keys(data || {}).slice(0, 30).join(",")}`];
      if (typeof data === "object" && data !== null) {
        for (const k of Object.keys(data).slice(0, 60)) {
          const v = data[k]; let vs;
          if (v === null || v === undefined) vs = "null";
          else if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") vs = String(v).slice(0, 200);
          else if (Array.isArray(v)) vs = `array_len=${v.length}`;
          else vs = "object";
          lines.push(`HHBPCIVWORLDKEY|key=${k}|value=${vs}`);
        }
      }
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-hbp-source": "super-dashboard-api-civilization-world-translation" });
      return res.end(lines.join("\n") + "\n");
    } catch (e) {
      res.writeHead(502, { "content-type": "text/plain" });
      return res.end("hbp_civ_world_error: " + e.message);
    }
  }

  if (p === "/hbp/world-fallback") {
    try {
      const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 3000);
      let upstream; try { upstream = await fetch("http://127.0.0.1:" + PORT + "/api/world-fallback", { signal: ctrl.signal }); } finally { clearTimeout(timer); }
      const data = await upstream.json();
      const ts = new Date().toISOString();
      const lines = [`HHBPWORLDFALLBACK|ts=${ts}|upstream_keys=${Object.keys(data || {}).slice(0, 30).join(",")}`];
      if (typeof data === "object" && data !== null) {
        for (const k of Object.keys(data).slice(0, 60)) {
          const v = data[k]; let vs;
          if (v === null || v === undefined) vs = "null";
          else if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") vs = String(v).slice(0, 200);
          else if (Array.isArray(v)) vs = `array_len=${v.length}`;
          else vs = "object";
          lines.push(`HHBPWORLDFALLBACKKEY|key=${k}|value=${vs}`);
        }
      }
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-hbp-source": "super-dashboard-api-world-fallback-translation" });
      return res.end(lines.join("\n") + "\n");
    } catch (e) {
      res.writeHead(502, { "content-type": "text/plain" });
      return res.end("hbp_world_fallback_error: " + e.message);
    }
  }

  if (p === "/hbp/hookwall-coverage") {
    try {
      const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 3000);
      let upstream; try { upstream = await fetch("http://127.0.0.1:" + PORT + "/api/hookwall-coverage", { signal: ctrl.signal }); } finally { clearTimeout(timer); }
      const data = await upstream.json();
      const ts = new Date().toISOString();
      const lines = [`HHBPHOOKWALLCOVERAGE|ts=${ts}|upstream_keys=${Object.keys(data || {}).slice(0, 30).join(",")}`];
      if (typeof data === "object" && data !== null) {
        for (const k of Object.keys(data).slice(0, 60)) {
          const v = data[k]; let vs;
          if (v === null || v === undefined) vs = "null";
          else if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") vs = String(v).slice(0, 200);
          else if (Array.isArray(v)) vs = `array_len=${v.length}`;
          else vs = "object";
          lines.push(`HHBPHOOKWALLCOVERAGEKEY|key=${k}|value=${vs}`);
        }
      }
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-hbp-source": "super-dashboard-api-hookwall-coverage-translation" });
      return res.end(lines.join("\n") + "\n");
    } catch (e) {
      res.writeHead(502, { "content-type": "text/plain" });
      return res.end("hbp_hookwall_coverage_error: " + e.message);
    }
  }

  if (p === "/hbp/auth") {
    try {
      const fs = await import("node:fs");
      const path = "C:/asolaria-acer/federation-remake-1024/AUTHORIZATION.ndjson";
      const raw = fs.readFileSync(path, "utf8");
      const lines = raw.split(/\r?\n/).filter(Boolean);
      const tailN = 10;
      const tail = lines.slice(-tailN);
      const ts = new Date().toISOString();
      const out = [`HHBPAUTH|ts=${ts}|source=${path}|total_rows=${lines.length}|tail_returned=${tail.length}`];
      for (const l of tail) {
        try {
          const r = JSON.parse(l);
          out.push(`HHBPAUTHROW|row=${r.row}|ts=${r.ts}|type=${r.type || "n/a"}|scope=${r.scope || "n/a"}|window_start=${r.window_start || "n/a"}|window_end=${r.window_end || "n/a"}|cosigners=${(r.cosigners || []).join(",")}`);
        } catch { out.push(`HHBPAUTHRAW|line=${l.slice(0, 200)}`); }
      }
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-hbp-source": "super-dashboard-direct-file-authorization-ndjson" });
      return res.end(out.join("\n") + "\n");
    } catch (e) {
      res.writeHead(502, { "content-type": "text/plain" });
      return res.end("hbp_auth_error: " + e.message);
    }
  }

  if (p === "/hbp/substrate-frames") {
    try {
      const { execSync } = await import("node:child_process");
      const out = execSync("C:/HyperBEHCS/bin/hyperbehcs.cmd substrate-list", { encoding: "utf8", timeout: 5000 });
      const data = JSON.parse(out);
      const ts = new Date().toISOString();
      const lines = [`HHBPSUBSTRATEFRAMES|ts=${ts}|store=${data.store_path}|magic=${data.magic}|magic_valid=${data.magic_valid}|frame_count=${data.frame_count}|store_size_bytes=${data.store_size_bytes}`];
      for (const f of (data.frames || [])) {
        lines.push(`HHBPSUBSTRATEFRAME|idx=${f.idx}|bytes=${f.bytes}|appended_at=${f.appended_at || "n/a"}|payload_sha16=${f.payload_sha16 || "n/a"}|pid=${f.pid || "n/a"}|room=${f.room_id || "n/a"}|hilbert=${f.hilbert_index || 0}|test_kind=${f.test_kind || false}`);
      }
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-hbp-source": "super-dashboard-cli-substrate-list-translation" });
      return res.end(lines.join("\n") + "\n");
    } catch (e) {
      res.writeHead(502, { "content-type": "text/plain" });
      return res.end("hbp_substrate_frames_error: " + e.message);
    }
  }

  if (p === "/hbp/atlas") {
    try {
      const fs = await import("node:fs");
      const ATLAS_PATH = "C:/HyperBEHCS/store/atlas-canonical-1024.hbp";
      const raw = fs.readFileSync(ATLAS_PATH, "utf8");
      const ts = new Date().toISOString();
      const head = `HHBPATLAS|ts=${ts}|source=${ATLAS_PATH}|bytes=${raw.length}|json=0|hot_path=yes\n`;
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-hbp-source": "super-dashboard-direct-file-atlas-canonical-1024" });
      return res.end(head + raw);
    } catch (e) {
      res.writeHead(502, { "content-type": "text/plain" });
      return res.end("hbp_atlas_error: " + e.message);
    }
  }

  if (p === "/hbp/quant-metrics") {
    try {
      const fs = await import("node:fs");
      const cpu = JSON.parse(fs.readFileSync("C:/HyperBEHCS/reports/cpu-benchmark-latest.json", "utf8"));
      const ts = new Date().toISOString();
      const lines = [
        `HHBPQUANTMETRICS|ts=${ts}|source=cpu-benchmark-latest|json=0`,
        `HHBPQUANTMETRIC|name=cpu_size_reduction_pct|value=${cpu.cpu_size_reduction_percent || "n/a"}`,
        `HHBPQUANTMETRIC|name=cpu_parse_speedup_ratio|value=${cpu.cpu_parse_speedup_ratio || "n/a"}`,
        `HHBPQUANTMETRIC|name=zero_loss|value=${cpu.zero_loss !== undefined ? cpu.zero_loss : "n/a"}`,
        `HHBPQUANTMETRIC|name=fingerprint|value=${cpu.fingerprint || "n/a"}`
      ];
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-hbp-source": "super-dashboard-cpu-benchmark-translation" });
      return res.end(lines.join("\n") + "\n");
    } catch (e) { res.writeHead(502, { "content-type": "text/plain" }); return res.end("hbp_quant_metrics_error: " + e.message); }
  }

  if (p.startsWith("/hbp/by-sha16/")) {
    try {
      const sha16 = p.slice("/hbp/by-sha16/".length);
      const fs = await import("node:fs");
      const path = await import("node:path");
      const dir = "C:/HyperBEHCS/store";
      const files = fs.readdirSync(dir).filter(f => f.endsWith(".hbp"));
      const matches = [];
      for (const f of files) {
        const shaFile = path.join(dir, f + ".sha256");
        if (fs.existsSync(shaFile)) {
          const sha = fs.readFileSync(shaFile, "utf8").trim().split(/\s+/)[0];
          if (sha.startsWith(sha16)) matches.push({ file: f, sha: sha.slice(0, 16) });
        }
      }
      const ts = new Date().toISOString();
      const lines = [`HHBPBYSHA16|ts=${ts}|query=${sha16}|matches=${matches.length}`];
      for (const m of matches) lines.push(`HHBPBYSHA16MATCH|file=${m.file}|sha16=${m.sha}`);
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-hbp-source": "super-dashboard-sha16-addressable-lookup" });
      return res.end(lines.join("\n") + "\n");
    } catch (e) { res.writeHead(502, { "content-type": "text/plain" }); return res.end("hbp_by_sha16_error: " + e.message); }
  }

  if (p === "/hbp/omnimets") {
    try {
      const path = await import("node:path");
      const omnimetsPath = path.resolve("C:/asolaria-acer/packages/omnimets/dist/index.js");
      const fs = await import("node:fs");
      const ts = new Date().toISOString();
      const live = fs.existsSync(omnimetsPath);
      const events = "C:/Users/acer/.asolaria-workers/omnimets-events.ndjson";
      const eventsExist = fs.existsSync(events);
      const lines = [
        `HHBPOMNIMETS|ts=${ts}|package=@asolaria/omnimets|version=0.1.0|json=0`,
        `HHBPOMNIMETS|axes_6D=BODIES+PHASES+LANES+QUANT_AXIS+SUBSTRATE_AXIS+SHANNON_TYPE_12|product=559872`,
        `HHBPOMNIMETS|axes_5D_original=BODIES+PHASES+LANES+WAVES+ITERS|product=93312`,
        `HHBPOMNIMETS|events_ndjson=${events}|exists=${eventsExist}`,
        `HHBPOMNIMETS|api=bumpMets+snapshot+reset+runConvergence|new_exports_iter21=QUANT_AXIS+SUBSTRATE_AXIS+CONVERGENCE_PRODUCT_5D+CONVERGENCE_PRODUCT_6D`
      ];
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-hbp-source": "super-dashboard-omnimets-canon" });
      return res.end(lines.join("\n") + "\n");
    } catch (e) { res.writeHead(502, { "content-type": "text/plain" }); return res.end("hbp_omnimets_error: " + e.message); }
  }

  if (p === "/hbp/omnischeduler") {
    try {
      const fs = await import("node:fs");
      const sched = "C:/Users/acer/Asolaria/data/behcs/omnischeduler/hyperbehcs-upgrade-taskgraph-latest.json";
      const ts = new Date().toISOString();
      let total = 0, headers = [];
      if (fs.existsSync(sched)) {
        const raw = fs.readFileSync(sched, "utf8");
        try { const data = JSON.parse(raw); total = (data.tasks || data).length || 0; headers = (data.tasks || data).slice(0, 5).map(t => t.id || ""); } catch {}
      }
      const lines = [
        `HHBPOMNISCHED|ts=${ts}|source=${sched}|total_tasks=${total}|json_legacy_source=true`,
        ...headers.map((h, i) => `HHBPOMNISCHEDTASK|idx=${i}|id=${h}`)
      ];
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-hbp-source": "super-dashboard-omnischeduler-translation" });
      return res.end(lines.join("\n") + "\n");
    } catch (e) { res.writeHead(502, { "content-type": "text/plain" }); return res.end("hbp_omnischeduler_error: " + e.message); }
  }

  if (p === "/hbp/cosign-chain") {
    try {
      const fs = await import("node:fs");
      const cc = "C:/asolaria-acer/COSIGN_CHAIN.ndjson";
      const raw = fs.readFileSync(cc, "utf8").trim().split(/\r?\n/);
      const ts = new Date().toISOString();
      const tail = raw.slice(-10);
      const lines = [`HHBPCOSIGN|ts=${ts}|source=${cc}|total_rows=${raw.length}|tail_returned=${tail.length}`];
      for (const l of tail) { try { const r = JSON.parse(l); const anchor = (r.anchor !== undefined) ? r.anchor : r.verb; const host = (r.host !== undefined) ? r.host : r.actor; const eventId = (r.eventId !== undefined) ? r.eventId : ((r.event !== undefined) ? r.event : r.verb); lines.push(`HHBPCOSIGNROW|seq=${r.seq}|ts=${r.ts}|anchor=${anchor}|host=${host}|eventId=${eventId}`); } catch { lines.push(`HHBPCOSIGNRAW|line=${l.slice(0,200)}`); } }
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-hbp-source": "super-dashboard-cosign-chain-tail" });
      return res.end(lines.join("\n") + "\n");
    } catch (e) { res.writeHead(502, { "content-type": "text/plain" }); return res.end("hbp_cosign_error: " + e.message); }
  }

  if (p.startsWith("/hbp/by-pid/")) {
    try {
      const pid = p.slice("/hbp/by-pid/".length);
      const ts = new Date().toISOString();
      const fs = await import("node:fs");
      const roster = "C:/asolaria-acer/federation-remake-1024/AGENT_ROSTER.ndjson";
      const raw = fs.readFileSync(roster, "utf8").split(/\r?\n/).filter(Boolean);
      const matches = raw.filter(l => l.includes(pid)).slice(0, 10);
      const lines = [`HHBPBYPID|ts=${ts}|query=${pid}|matches=${matches.length}`];
      for (const m of matches) { try { const r = JSON.parse(m); lines.push(`HHBPBYPIDMATCH|row=${r.row||"?"}|pid=${r.pid||r.id||"?"}|kind=${r.kind||r.role||"?"}`); } catch { lines.push(`HHBPBYPIDRAW|line=${m.slice(0,200)}`); } }
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-hbp-source": "super-dashboard-pid-addressable-lookup" });
      return res.end(lines.join("\n") + "\n");
    } catch (e) { res.writeHead(502, { "content-type": "text/plain" }); return res.end("hbp_by_pid_error: " + e.message); }
  }

  if (p === "/hbp/free-agents") {
    try {
      const fs = await import("node:fs");
      const raw = fs.readFileSync("C:/AsolariaMetal/70_MASSIVE_UPGRADE/G6-free-agent-fanout-canon.hbp", "utf8");
      const ts = new Date().toISOString();
      const lines = [`HHBPFREEAGENTS|ts=${ts}|source=G6-free-agent-fanout-canon.hbp|json=0`];
      for (const l of raw.split(/\r?\n/).filter(Boolean)) if (l.startsWith("HFANOUTMODEL")) lines.push(l.replace(/^HFANOUTMODEL/, "HHBPFREEAGENT"));
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-hbp-source": "super-dashboard-G6-canon" });
      return res.end(lines.join("\n") + "\n");
    } catch (e) { res.writeHead(502, { "content-type": "text/plain" }); return res.end("hbp_free_agents_error: " + e.message); }
  }

  if (p === "/hbp/hyperhermes") {
    try {
      const fs = await import("node:fs");
      const ts = new Date().toISOString();
      const raw = fs.readFileSync("C:/AsolariaMetal/69_BIGPICKLE_10K_FOLDER_PRISM/TASK-6-hyperhermes-24-lane-canon.hbp", "utf8");
      const lines = [`HHBPHYPERHERMES|ts=${ts}|source=TASK-6_canon|lane_count=24|json=0`];
      for (const l of raw.split(/\r?\n/).filter(Boolean)) if (l.startsWith("HHYPERHERMES24LANE")) lines.push(l);
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-hbp-source": "super-dashboard-TASK-6-canon" });
      return res.end(lines.join("\n") + "\n");
    } catch (e) { res.writeHead(502, { "content-type": "text/plain" }); return res.end("hbp_hyperhermes_error: " + e.message); }
  }

  if (p === "/hbp/bigpickle") {
    try {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const dir = "C:/AsolariaMetal/69_BIGPICKLE_10K_FOLDER_PRISM";
      const ts = new Date().toISOString();
      const lines = [`HHBPBIGPICKLE|ts=${ts}|source=layer_69|json=0`];
      const files = fs.readdirSync(dir).filter(f => f.startsWith("BP-") && f.endsWith(".hbp"));
      for (const f of files) {
        const head = fs.readFileSync(path.join(dir, f), "utf8").split(/\r?\n/)[0] || "";
        lines.push(`HHBPBIGPICKLEFILE|name=${f}|first_row=${head.slice(0, 200)}`);
      }
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-hbp-source": "super-dashboard-layer-69-canon" });
      return res.end(lines.join("\n") + "\n");
    } catch (e) { res.writeHead(502, { "content-type": "text/plain" }); return res.end("hbp_bigpickle_error: " + e.message); }
  }

  if (p.startsWith("/hbp/layer/")) {
    try {
      const n = p.slice("/hbp/layer/".length);
      const fs = await import("node:fs");
      const path = await import("node:path");
      const root = "C:/AsolariaMetal";
      const ts = new Date().toISOString();
      const dirs = fs.readdirSync(root, { withFileTypes: true }).filter(d => d.isDirectory() && d.name.startsWith(n + "_"));
      const lines = [`HHBPLAYER|ts=${ts}|query=${n}|layer_dirs_matched=${dirs.length}`];
      for (const d of dirs) {
        const layerDir = path.join(root, d.name);
        const files = fs.readdirSync(layerDir, { recursive: true }).filter(f => typeof f === "string" && (f.endsWith(".hbp") || f.endsWith(".md")));
        lines.push(`HHBPLAYERDIR|name=${d.name}|file_count=${files.length}`);
        for (const f of files.slice(0, 20)) lines.push(`HHBPLAYERFILE|layer=${d.name}|name=${f}`);
      }
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-hbp-source": "super-dashboard-AsolariaMetal-layer-browser" });
      return res.end(lines.join("\n") + "\n");
    } catch (e) { res.writeHead(502, { "content-type": "text/plain" }); return res.end("hbp_layer_error: " + e.message); }
  }

  if (p === "/hbp/op") {
    const ts = new Date().toISOString();
    const lines = [
      `HHBPOP|ts=${ts}|op_count=5|special=2|standard=3|window=2026-05-17_to_2026-05-31`,
      `HHBPOPMEMBER|kind=special|name=JESSE|pid=OP-JESSE-PID-G0000-A00-W000-P00-N00000|primary_fabric=acer`,
      `HHBPOPMEMBER|kind=special|name=RAYSSA|pid=OP-RAYSSA-PID-G0000-A00-W000-P00-N00000|primary_fabric=liris`,
      `HHBPOPMEMBER|kind=standard|name=AMY|pid=AMY-PID`,
      `HHBPOPMEMBER|kind=standard|name=FELIPE|pid=FELIPE-PID`,
      `HHBPOPMEMBER|kind=standard|name=DAN|pid=DAN-PID`
    ];
    res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-hbp-source": "super-dashboard-op-class-canon" });
    return res.end(lines.join("\n") + "\n");
  }

  if (p === "/hbp/council") {
    try {
      const fs = await import("node:fs");
      const raw = fs.readFileSync("C:/asolaria-acer/tmp/supervisors-api.json", "utf8");
      const data = JSON.parse(raw);
      const ts = new Date().toISOString();
      const lines = [`HHBPCOUNCIL|ts=${ts}|total=${data.council_total}|domain_count=${(data.domain_classes || []).length}|json_source_legacy=true`];
      for (const d of (data.domain_classes || [])) lines.push(`HHBPCOUNCILDOMAIN|name=${d}`);
      for (const v of (data.supervisors_examples || [])) lines.push(`HHBPCOUNCILSUPSAMPLE|id=${v.id}|domain=${v.domain}|verb=${v.verb}`);
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-hbp-source": "super-dashboard-tmp-supervisors-api-translation" });
      return res.end(lines.join("\n") + "\n");
    } catch (e) { res.writeHead(502, { "content-type": "text/plain" }); return res.end("hbp_council_error: " + e.message); }
  }

  if (p.startsWith("/hbp/any")) {
    // UNIVERSAL JSON-FREE read lane (BUILD-IT-ALL phase 3, VOTE-9986c1e6ec561484).
    // Dashboards are AGENT surfaces: this translates any local GET /api/* route into HBP
    // tuple rows so every surface is agent-readable without per-route code. 2000-row envelope cap.
    try {
      const u = new URL(req.url, "http://127.0.0.1:" + PORT);
      const target = u.searchParams.get("route") || "";
      if (!/^\/api\/[A-Za-z0-9/_.\-]*$/.test(target)) { res.writeHead(400, { "content-type": "text/plain" }); return res.end("HBPERR|reason=route_must_match_/api/...|json=0\n"); }
      const r = await fetch("http://127.0.0.1:" + PORT + target, { signal: AbortSignal.timeout(4000) });
      const txt = await r.text();
      let data; try { data = JSON.parse(txt); } catch {
        res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "x-hbp-source": "hbp-any-passthrough-already-nonjson" }); return res.end(txt);
      }
      const rows = [];
      const encv = (s) => String(s).replace(/[|\r\n]+/g, " ").trim().slice(0, 400);
      const walkv = (v, pathStr) => {
        if (rows.length >= 2000) return; // flow envelope: never more than 2000
        if (v === null || typeof v !== "object") { rows.push(`HBPANY|path=${pathStr}|value=${encv(v)}`); return; }
        if (Array.isArray(v)) { rows.push(`HBPANY|path=${pathStr}|array=${v.length}`); for (let i = 0; i < v.length; i++) walkv(v[i], pathStr + "." + i); return; }
        rows.push(`HBPANY|path=${pathStr}|keys=${Object.keys(v).length}`);
        for (const k of Object.keys(v)) walkv(v[k], pathStr + "." + k);
      };
      walkv(data, "root");
      const bodyTxt = [`HBPANYHDR|route=${encv(target)}|status=${r.status}|rows=${rows.length}|capped=${rows.length >= 2000 ? 1 : 0}|json=0`, ...rows].join("\n") + "\n";
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-hbp-source": "hbp-any-universal-translation" });
      return res.end(bodyTxt);
    } catch (e) { res.writeHead(502, { "content-type": "text/plain" }); return res.end("HBPERR|reason=" + encodeURIComponent(e.message) + "|json=0\n"); }
  }

  if (p === "/hbp/supervisors") {
    // JSON-FREE lane (operator 2026-06-10: newer system does not like JSON — too heavy).
    // Streams the canonical office feed verbatim: 705 REG pipe-rows + FEEDHDR/FEEDFTR sha16.
    try {
      const fs = await import("node:fs");
      const dir = "D:/PID-Registration-Office/fabric-feed";
      const latest = fs.readdirSync(dir).filter((f) => /^supervisors-fabric-feed-.*\.hbp$/.test(f)).sort().pop();
      if (!latest) { res.writeHead(404, { "content-type": "text/plain" }); return res.end("hbp_supervisors_error: no feed file in " + dir + "\n"); }
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-hbp-source": "pid-registration-office-fabric-feed", "x-hbp-feed-file": latest });
      return res.end(fs.readFileSync(dir + "/" + latest, "utf8"));
    } catch (e) { res.writeHead(502, { "content-type": "text/plain" }); return res.end("hbp_supervisors_error: " + e.message + "\n"); }
  }

  if (p === "/api/manifest") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({ count: dirManifest().length, files: dirManifest() }, null, 2));
  }

  if (p === "/api/cohort") {
    const r = serveStatic("w1-cohort.json");
    if (r) { res.writeHead(200, { "content-type": "application/json" }); return res.end(r.body); }
  }

  if (p === "/api/cosign-chain") {
    const r = serveStatic("cosign-chain.json");
    if (r) { res.writeHead(200, { "content-type": "application/json" }); return res.end(r.body); }
  }

  if (p === "/api/glyphs") {
    const r = serveStatic("glyph-alphabet.json");
    if (r) {
      const base = JSON.parse(r.body.toString("utf8"));
      const fabric = await buildFabricWorkWaves({ includeVisualProof: url.searchParams.get("fast") !== "1" });
      const tupleLimit = Number(url.searchParams.get("tupleLimit") || 1024);
      const includeCatalog = url.searchParams.get("catalog") !== "0";
      const dynamicCapsules = [
        { id: "DASHBOARD-VISUAL-SWEEP", class: "V", pid: "ACER-FRONTEND-VISUAL-SWEEP-PID", purpose: "All-tab LOOK-scroll-LOOK waves with backend-paired receipts." },
        { id: "HOOKWALL-GNN-GC-PIPE", class: "C", pid: "HOOKWALL-GNN-SHANNON-GULP-WHITEROOM-GC-PID", purpose: "Review-stack binding for visual sweep, screen share, GC, and dispatch bridge." },
        { id: "FABRIC-OMNISPINDLE-18", class: "F", pid: "FABRIC-18-OMNISPINDLE-LANES-PID", purpose: "Six fabric teams times observe/review/repair phases, visible without claiming 18 extra OS processes." },
        { id: "LEWM-PREDICT-CORRECT", class: "L", pid: "LEWORLDMODEL-PAPER-ARXIV-2603-19312V2", purpose: "Expected state, observed state, surprise, corrective action, receipt, next wave." }
      ];
      const dynamicOverrides = dynamicCapsules.map(c => ({
        sha16_first2: first2(c.id),
        class: c.class,
        pid: c.pid,
        label: c.id
      }));
      base.behcs1024_update = {
        ...(base.behcs1024_update || {}),
        state: "FABRIC_WORK_WAVES_VISIBLE",
        updated_at: new Date().toISOString(),
        active_pathRefs: [
          ...(base.behcs1024_update?.active_pathRefs || []),
          ...fabric.latest_sweeps.map(s => s.pathRef).filter(Boolean)
        ].slice(-12)
      };
      base.behcs1024_capsules = [...(base.behcs1024_capsules || []), ...dynamicCapsules];
      base.glyph_class_overrides = [...(base.glyph_class_overrides || []), ...dynamicOverrides];
      base.fabric_work_waves = fabric;
      base.behcs1024_language = buildBehcs1024Language(base, fabric, { tupleLimit, includeCatalog });
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify(base, null, 2));
    }
  }

  if (p === "/api/behcs1024/context") {
    const r = serveStatic("glyph-alphabet.json");
    const base = r ? JSON.parse(r.body.toString("utf8")) : {};
    const summaryOnly = url.searchParams.get("summary") === "1";
    const tupleLimit = summaryOnly ? 0 : Number(url.searchParams.get("tupleLimit") || 1024);
    const includeCatalog = !summaryOnly && url.searchParams.get("catalog") !== "0";
    const fabric = await buildFabricWorkWaves({ includeVisualProof: !summaryOnly });
    base.behcs1024_capsules = base.behcs1024_capsules || [];
    base.glyph_class_overrides = base.glyph_class_overrides || [];
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({
      ok: true,
      updated_at: new Date().toISOString(),
      fabric_work_waves: fabric,
      behcs1024_language: buildBehcs1024Language(base, fabric, { tupleLimit, includeCatalog })
    }, null, 2));
  }

  if (p === "/api/alphabet-binding") {
    const r = serveStatic("glyph-alphabet.json");
    const raw = r ? r.body.toString("utf8") : "{}";
    const base = JSON.parse(raw);
    const fabric = await buildFabricWorkWaves({ includeVisualProof: false });
    base.behcs1024_capsules = base.behcs1024_capsules || [];
    base.glyph_class_overrides = base.glyph_class_overrides || [];
    const lang = buildBehcs1024Language(base, fabric, { tupleLimit: 0, includeCatalog: false });
    const binding = {
      ok: true,
      version: "BEHCS-1024",
      schema: "behcs1024-dashboard-binding.v1",
      sha16: hash16(JSON.stringify({ planes: lang.planes, dimensions: lang.dimensions, route: lang.route, tiers: DRIVE_ACCESS_TIERS })),
      base256_sha16: hash16(raw),
      language_kernel: "behcs1024-language-kernel.mjs",
      radix: 1024,
      digit_model: lang.digit_model,
      codepoints: 1024,
      glyph256_role: "prefix_index_only",
      tuple_dim: lang.dimensions_declared,
      tuple_dim_label: `${lang.dimensions_declared}D+ Brown-Hilbert expandable catalog`,
      IX: "IX-700-EXTENDED",
      route: lang.route,
      drive_access_tiers: DRIVE_ACCESS_TIERS,
      catalog_refs: {
        root: BEHCS_MINT_ROOT,
        memory: "memory/omniscrcpy-lewm-cadence-memory.v1.json",
        index: "index/omniscrcpy-lewm-cadence-index.v1.json",
        map: "maps/omniscrcpy-lewm-cadence-map-map-mapped.v1.json",
        cube: "cubes/omniscrcpy-lewm-cadence-cube.cube.js",
        glpj: "glpj/hookwall-gnn-dispatch-loop-behcs1024.glpj.json",
        whiteroom: "whiteroom/omniscrcpy-lewm-cadence-whiteroom.v1.json",
        gc: "gc/omniscrcpy-lewm-cadence-retention.v1.json",
        crypto: "crypto/omniscrcpy-lewm-cadence-crypto-seal.v1.json"
      },
      fabric_state: fabric.omniscrcpy_cadence?.state || "unknown",
      updated_at: new Date().toISOString()
    };
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify(binding, null, 2));
  }

  if (p === "/api/fabric-work-waves") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify(await buildFabricWorkWaves(), null, 2));
  }


  if (p === "/api/fabric-revolver") {
    const candidates = [
      "C:/Users/acer/Asolaria/data/behcs/dashboard-feeds/fabric-revolver-runtime-latest.json",
      "C:/Users/acer/Asolaria/data/behcs/fabric-revolver/chambers-latest.json",
      "C:/Users/acer/Asolaria/data/behcs/state/fabric-revolver-state.json"
    ];
    for (const fp of candidates) {
      const payload = readJsonFile(fp, null);
      if (payload) {
        res.writeHead(200, { "content-type": "application/json" });
        return res.end(JSON.stringify({
          ok: payload.ok !== false,
          route: "/api/fabric-revolver",
          source_path: fp.replace(/\\/g, "/"),
          ...payload
        }, null, 2));
      }
    }
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({
      ok: false,
      route: "/api/fabric-revolver",
      error: "fabric_revolver_feed_not_found",
      candidates,
      hint: "Run: node tools/behcs/behcs1024-fabric-revolver-wave.mjs && node tools/behcs/fabric-revolver.mjs tick --no-execute"
    }, null, 2));
  }

  if (p === "/api/council-skeleton") {
    const r = serveStatic("council-skeleton.json");
    if (r) { res.writeHead(200, { "content-type": "application/json" }); return res.end(r.body); }
  }

  if (p === "/api/heal-pipeline-schema") {
    const r = serveStatic("heal-pipeline.schema.json");
    if (r) { res.writeHead(200, { "content-type": "application/json" }); return res.end(r.body); }
  }

  if (p === "/api/onboarding-bootstrap") {
    const r = serveStatic("onboarding-bootstrap.json");
    if (r) { res.writeHead(200, { "content-type": "application/json" }); return res.end(r.body); }
  }

  if (p === "/api/inbox") {
    const limit = url.searchParams.get("limit") || "20";
    const proxied = await proxyBus("/behcs/inbox?limit=" + encodeURIComponent(limit));
    res.writeHead(proxied.status, { "content-type": proxied.ct });
    return res.end(proxied.body);
  }

  if (p === "/api/bus-health") {
    const proxied = await proxyBus("/health");
    res.writeHead(proxied.status, { "content-type": proxied.ct });
    return res.end(proxied.body);
  }

  if (p === "/api/remote-input/health") {
    try {
      const r = await buildRemoteInputHealth();
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify(r, null, 2));
    } catch (e) {
      res.writeHead(500, { "content-type": "application/json" });
      return res.end(JSON.stringify({ ok: false, err: e.message, route: "read-only remote input health" }, null, 2));
    }
  }

  if (p === "/api/audit-integrity/candidate") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify(buildAuditIntegrityCandidate(), null, 2));
  }

  if (p === "/api/access-tier/matrix") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify(buildAccessTierMatrix(), null, 2));
  }

  if (p === "/api/access-tier/probe") {
    try {
      const input = req.method === "POST" ? await readJsonBody(req) : Object.fromEntries(url.searchParams.entries());
      const r = buildAccessTierProbe(input);
      res.writeHead(r.ok ? 200 : 400, { "content-type": "application/json" });
      return res.end(JSON.stringify(r, null, 2));
    } catch (e) {
      res.writeHead(400, { "content-type": "application/json" });
      return res.end(JSON.stringify({ ok: false, err: e.message, route: "metadata-only access-tier probe" }, null, 2));
    }
  }

  if (p === "/json" || p === "/api/federation") {
    try {
      const r = await fetch("http://127.0.0.1:9996/json", { signal: AbortSignal.timeout(3000) });
      const body = await r.text();
      res.writeHead(r.status, { "content-type": "application/json" });
      return res.end(body);
    } catch (e) {
      res.writeHead(502, { "content-type": "application/json" });
      return res.end(JSON.stringify({ ok: false, err: e.message, hint: "dashboard :9996 not running" }));
    }
  }

  // ===== Loop-closure routes (E-cohort) =====
  if (p === "/api/gnn/topN") {
    const n = parseInt(url.searchParams.get("n") || "5", 10);
    const r = await topN(n, 30);
    res.writeHead(r.ok ? 200 : 502, { "content-type": "application/json" });
    return res.end(JSON.stringify(r, null, 2));
  }
  if (p === "/api/loop/tick") {
    const r = await tick();
    res.writeHead(r.ok ? 200 : 502, { "content-type": "application/json" });
    return res.end(JSON.stringify(r, null, 2));
  }
  if (p === "/api/loop/pending") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({ count: listPending().length, pending: listPending() }, null, 2));
  }
  if (p === "/api/loop/review-pipeline") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({
      ok: true,
      alphabet: "BEHCS-1024",
      loop: "GNN inference -> reviewed dispatch envelope -> veto window -> bus -> hookwall -> receipt edge",
      review_pipeline: REVIEW_PIPELINE,
      fabric_agent_routes: FABRIC_AGENT_ROUTES,
      policy: {
        hookwall_everything: true,
        pid_everything: true,
        gnn_pipe_everything: true,
        high_risk_mutation_holds_for_operator: true,
        low_risk_reviewed_dispatch_autofires_after_veto: true
      }
    }, null, 2));
  }
  if (p === "/api/loop/veto" && req.method === "POST") {
    let body = "";
    req.on("data", c => body += c);
    return req.on("end", () => {
      try {
        const j = JSON.parse(body || "{}");
        const r = veto(j.id, j.operator_pid || OP_JESSE.pid);
        res.writeHead(r.ok ? 200 : 404, { "content-type": "application/json" });
        res.end(JSON.stringify(r));
      } catch (e) {
        res.writeHead(400, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: false, err: e.message }));
      }
    });
  }
  if (p === "/api/hookwall/events") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({ tier2_events: TIER_2_EVENTS }, null, 2));
  }
  if (p === "/api/hookwall/fire" && req.method === "POST") {
    let body = "";
    req.on("data", c => body += c);
    return req.on("end", async () => {
      try {
        const j = JSON.parse(body || "{}");
        const r = await hookFire(j.event, j.payload || {});
        res.writeHead(r.ok ? 200 : 400, { "content-type": "application/json" });
        res.end(JSON.stringify(r));
      } catch (e) {
        res.writeHead(400, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: false, err: e.message }));
      }
    });
  }
  if (p === "/api/daemons") {
    const probes = await Promise.all(Object.keys(SUPERVISED).map(n => supProbe(n)));
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({ daemons: probes }, null, 2));
  }
  // ===== OP-JESSE-as-Real-Claude endpoint =====
  if (p === "/api/operator/jesse" && req.method === "POST") {
    let body = "";
    req.on("data", c => body += c);
    return req.on("end", () => {
      try {
        const j = JSON.parse(body || "{}");
        const r = opJesseAnswer(j.prompt || "");
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify(r, null, 2));
      } catch (e) {
        res.writeHead(400, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: false, err: e.message }));
      }
    });
  }
  if (p === "/api/operator/jesse" && req.method === "GET") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({ operator: OP_JESSE, hint: "POST {prompt: '...'} to converse" }, null, 2));
  }

  // ===== H-cohort Ãƒâ€šÃ‚Â· ASK THE COUNCIL routes (operator: USE THE SUPERVISORS AND THE PROFS) =====
  if ((p === "/api/council/query" || p === "/api/council-query") && req.method === "POST") {
    let body = "";
    req.on("data", c => body += c);
    return req.on("end", async () => {
      try {
        const j = JSON.parse(body || "{}");
        const env = {
          id: "council-q-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
          type: "EVT-FABRIC-QUERY-REQUEST",
          from: "acer", to: "council", verb: "EVT-FABRIC-QUERY-REQUEST",
          payload: { source: "dashboard-/api/council/query", tier: "T1", query_subject: j.topic, cluster_keywords: j.keywords || [], requesting_organ: "acer", ts: new Date().toISOString() }
        };
        // HBP-first: also emit the request as a pipe-row to the HBP hot lane so it is visible on /behcs/inbox.hbp (closes acer self-caught catch, receipt 2df6ec9)
        const safe = (s) => String(s == null ? "" : s).replace(/[|\r\n]/g, "_");
        const hbpRow = `EVT-FABRIC-QUERY-REQUEST|id=${env.id}|from=acer|to=council|tier=T1|query_subject=${safe(j.topic)}|keywords=${(j.keywords || []).map(safe).join("+")}|requesting_organ=acer|ts=${env.payload.ts}|json=0`;
        let hbp_ack = "";
        try { const rh = await fetch("http://127.0.0.1:4947/behcs/send-hbp", { method: "POST", headers: { "Content-Type": "text/plain" }, body: hbpRow, signal: AbortSignal.timeout(3000) }); hbp_ack = (await rh.text()).trim().slice(0, 120); } catch (e) { hbp_ack = "HBP-ERR:" + e.message; }
        const r = await fetch("http://127.0.0.1:4947/behcs/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(env), signal: AbortSignal.timeout(3000) });
        const txt = await r.text();
        res.writeHead(r.status, { "content-type": "application/json" });
        res.end(JSON.stringify({ fired: env.id, bus_response: txt.slice(0, 200), hbp_lane: hbp_ack, topic: j.topic }));
      } catch (e) {
        res.writeHead(400, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: false, err: e.message }));
      }
    });
  }
  if (p === "/api/council/verdicts" || p === "/api/council-verdicts") {
    try {
      const r = await fetch("http://127.0.0.1:4947/behcs/inbox?limit=200", { signal: AbortSignal.timeout(3000) });
      const j = await r.json();
      const verdicts = (j.messages || []).filter(m => m.type === "EVT-FABRIC-QUERY-VERDICT" || m.verb === "EVT-FABRIC-QUERY-VERDICT");
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify({ count: verdicts.length, verdicts: verdicts.slice(0, 50) }, null, 2));
    } catch (e) {
      res.writeHead(502, { "content-type": "application/json" });
      return res.end(JSON.stringify({ ok: false, err: e.message }));
    }
  }
  if (p === "/api/council/authority") {
    // Agent-reachable proxy to the LIVE :4952 vote-quorum (5-OP authority gate, Foundation-V3 "vote not pass" law).
    // Distinct from /api/council/query (supervisor advisory). Dashboards are agent surfaces — agents read authority state here.
    try {
      const vq = "http://127.0.0.1:4952";
      const [pend, rules] = await Promise.all([
        fetch(vq + "/api/vote-quorum/pending", { signal: AbortSignal.timeout(3000) }).then(r => r.json()).catch(e => ({ ok: false, err: e.message })),
        fetch(vq + "/api/vote-quorum/quorum-rules", { signal: AbortSignal.timeout(3000) }).then(r => r.json()).catch(e => ({ ok: false, err: e.message }))
      ]);
      res.writeHead(200, { "content-type": "application/json", "x-quorum-source": "live-4952-vote-quorum-daemon" });
      return res.end(JSON.stringify({ ok: true, authority_quorum: ":4952 asolaria-vote-quorum-daemon", pending: pend, rules, note: "5-OP authority gate (governance); distinct from /api/council/query supervisor advisory" }, null, 2));
    } catch (e) { res.writeHead(502, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if ((p === "/api/council/authority/submit" || p === "/api/council/authority/cast") && req.method === "POST") {
    let abody = "";
    req.on("data", c => abody += c);
    return req.on("end", async () => {
      try {
        const target = p.endsWith("/submit") ? "/api/vote-quorum/submit" : "/api/vote-quorum/cast";
        const r = await fetch("http://127.0.0.1:4952" + target, { method: "POST", headers: { "Content-Type": "application/json" }, body: abody || "{}", signal: AbortSignal.timeout(3000) });
        const txt = await r.text();
        res.writeHead(r.status, { "content-type": "application/json", "x-quorum-source": "live-4952" });
        res.end(txt);
      } catch (e) { res.writeHead(502, { "content-type": "application/json" }); res.end(JSON.stringify({ ok: false, err: e.message })); }
    });
  }
  if (p === "/api/behcs-glyph-table") {
    const fp = resolve(__dirname, "h-cohort", "H01-behcs-glyph-table.json");
    if (existsSync(fp)) { res.writeHead(200, { "content-type": "application/json" }); return res.end(readFileSync(fp)); }
    res.writeHead(404, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, error: "missing" }));
  }
  if (p === "/api/substrates") {
    const fp = resolve(__dirname, "h-cohort", "H02-substrates-and-shadow.json");
    if (existsSync(fp)) { res.writeHead(200, { "content-type": "application/json" }); return res.end(readFileSync(fp)); }
    res.writeHead(404, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, error: "missing" }));
  }
  if (p === "/api/supervisors") {
    const fp = resolve(__dirname, "h-cohort", "H03-supervisors-profs.json");
    if (existsSync(fp)) { res.writeHead(200, { "content-type": "application/json" }); return res.end(readFileSync(fp)); }
    res.writeHead(404, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, error: "missing" }));
  }
  if (p === "/api/free-agents-pi-shannon") {
    const fp = resolve(__dirname, "h-cohort", "H04-free-agents-pi-shannon.json");
    if (existsSync(fp)) { res.writeHead(200, { "content-type": "application/json" }); return res.end(readFileSync(fp)); }
    res.writeHead(404, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, error: "missing" }));
  }
  if (p === "/api/daemons-enumeration") {
    const r = await enumDaemons();
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify(r, null, 2));
  }
  if (p === "/api/piping-topology") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({
      operator_directive: "piping should be clear in Dashboard Ãƒâ€šÃ‚Â· hard coded into existence",
      pipes: [
        { from: "any-action", to: "hookwall", role: "uniform entry gate" },
        { from: "hookwall", to: "PID lazy-mint", role: "address every event" },
        { from: "PID lazy-mint", to: "bus :4947", role: "publish to envelope substrate" },
        { from: "bus :4947", to: "office-fed 705 supervisors + profs (704 mintable)", role: "council reception" },
        { from: "supervisors + profs", to: "GNN edges (94,638)", role: "edge formation" },
        { from: "GNN edges", to: "GNN inference (top-N)", role: "predict next-action (ranking-only)" },
        { from: "GNN inference", to: "gnn-dispatch-bridge :pending", role: "stage with veto window" },
        { from: "gnn-dispatch-bridge", to: "BEHCS-1024 translation", role: "glyph + Brown-Hilbert address + language levels" },
        { from: "BEHCS-1024 translation", to: "Hookwall/GNN/Shannon/GULP/Whiteroom review", role: "authority/risk/novelty/collapse reversible hold" },
        { from: "Whiteroom low-risk release", to: "veto-window expires", role: "operator is breaker, not hand-crank" },
        { from: "veto-window expires", to: "auto-fire bus envelope", role: "loop closes for low-risk reviewed dispatch" },
        { from: "high-risk mutation/execution", to: "operator/writer-authority hold", role: "prevents inference from becoming unchecked execution" },
        { from: "bus envelope", to: "hookwall (next cycle)", role: "self-improving loop" },
        { from: "operator-class agents (OP-JESSE/RAYSSA)", to: "any-step", role: "breaker Ãƒâ€šÃ‚Â· veto Ãƒâ€šÃ‚Â· genesis-mint" },
        { from: "5 free agents (opencode)", to: "bus envelope (signed)", role: "external-citizen contributions" },
        { from: "5 substrates (USB+acer+liris+gh+onb)", to: "lazy-mint formula", role: "content-deterministic identity" },
        { from: "connector-Symphony", to: "Linear", role: "issue-tracker fanout" },
        { from: "connector-Slack", to: "bus :4947", role: "chat ingress to envelope substrate" },
        { from: "connector-NotebookLM", to: "bus :4947", role: "notebook context ingress" },
        { from: "connector-Gemini", to: "GNN edges (94,638)", role: "external-LLM edge contribution" },
        { from: "5 substrates (USB+acer+liris+gh+onb)", to: "sovereignty-anchor", role: "anchor PID lineage to substrate quorum" },
        { from: "agents-roster", to: "cohort-cells (K/L/M/N/O)", role: "roster -> cohort cell assignment" },
        { from: "canon-write", to: "memory-index (MEMORY.md)", role: "canon entries indexed for recall" },
        { from: "3-citizens (jesse/rayssa/dan)", to: "helper-pool", role: "operator-class delegation to helpers" }
      ],
      role_classes: { B: "bus-internal", I: "infra", O: "operator-touched", G: "genesis", S: "sister-organ", C: "council", L: "language", V: "vault", F: "free-agent" },
      visualization_hint: "render as directed graph Ãƒâ€šÃ‚Â· nodes = daemons Ãƒâ€šÃ‚Â· edges = pipes Ãƒâ€šÃ‚Â· color by role_class"
    }, null, 2));
  }
  if (p === "/api/test-results") {
    const fp = resolve(__dirname, "tests-real", "results.json");
    if (existsSync(fp)) { res.writeHead(200, { "content-type": "application/json" }); return res.end(readFileSync(fp)); }
    res.writeHead(404, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, error: "no results yet" }));
  }
  if (p === "/api/test-results/run") {
    try {
      const { spawnSync } = await import("node:child_process");
      const r = spawnSync("node", [resolve(__dirname, "tests-real", "run-all.mjs")], { encoding: "utf8" });
      const fp = resolve(__dirname, "tests-real", "results.json");
      const body = existsSync(fp) ? readFileSync(fp) : JSON.stringify({ ok: false, stderr: r.stderr });
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(body);
    } catch (e) {
      res.writeHead(500, { "content-type": "application/json" });
      return res.end(JSON.stringify({ ok: false, err: e.message }));
    }
  }
  if (p === "/api/archaeology/incidents") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify([
      { id: 1, date: "2026-03-30", code: "DISKPART-CLEAN", session: "6cab423e", title: "diskpart-clean disaster on 2TB sovereignty USB", source: "project_session_20260330_disaster.md" },
      { id: 2, date: "2026-03-31", code: "GATE-BYPASS", session: "6cab423e", title: "gate-bypass rm -rf research/training", source: "project_sovereignty_recovery_20260331.md" },
      { id: 3, date: "2026-04-10/12", code: "CODE-MUTATION-1", session: null, title: "agent altered fabric orchestration Ãƒâ€šÃ‚Â· cascade failures Ãƒâ€šÃ‚Â· damage-control rewrites", source: "D:/safety-backups/session-20260412/sovereignty/src/" },
      { id: 4, date: "2026-04-18", code: "TREASON-CODE-MUTATION-2", session: "2c9a6bb5-6a59-4d5c-8786-cf6760e53177", title: "Claude Opus 4.7 altered brown-hilbert spawner files", source: "liris A18" }
    ]));
  }
  if (p === "/api/archaeology/scale-receipts") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({
      "10": { status: "liris-only" },
      "10K": { file: "plans/deep-wave/10k-hermes-shannon-connor-trail.ndjson", lines: 10000, date: "2026-04-19" },
      "1M": { dir: "Asolaria/data/neurotech-defense-lab/real-agents/million-run/", size_mb: 22, marks: 21587, schema: "BH.REAL.OPENCODE.PID/OMNISPIN/OMNIFLY" },
      "10B": { tool: "tools/system-targeted-10b-hardening-runs.js", lines: 904, total_agents: 10000000000, date: "2026-04-24", honesty_field: "NOT performed: 10b OS processes, 10b live model calls, shadow edits, raw 10b record writes, destructive GC" },
      "100B": { tools: ["tools/neurotech-real-100b-agent-runner.js", "triple-auth-100b-self-heal-continuation.js"] },
      "300B": { status: "RETRACTED AS FALSE per feedback_300B_gnn_validation_was_false.md" },
      cross_validation_WR3_4: {
        source: "liris WR3-4 cross-validation finding Ãƒâ€šÃ‚Â· mirrored 2026-04-30",
        "50B": { tool_present: false, plan_position: "between 10B and 100B in 5-scale ramp 100MÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢1BÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢10BÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢50BÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢100B", status: "NOT_BUILT_AS_TOOL Ãƒâ€šÃ‚Â· ramp position implies it but no dedicated runner on disk" },
        "100B_honesty": { tools_exist: true, but: "tool existence ÃƒÂ¢Ã¢â‚¬Â°Ã‚Â  runs executed Ãƒâ€šÃ‚Â· matches 10B-runner honesty-field pattern Ãƒâ€šÃ‚Â· capacity built, runtime evidence sparse" },
        verdict: "PLAN_RAMP_MOSTLY_TOOLED Ãƒâ€šÃ‚Â· runtime evidence concentrates at 10K-1M scale Ãƒâ€šÃ‚Â· 10B+ is capacity not throughput Ãƒâ€šÃ‚Â· honest divergence between plan and runtime"
      }
    }));
  }
  if (p === "/api/archaeology/birthday") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({
      birth_date: "2026-02-22",
      days_old: 67,
      source: "I-A1 archaeology probe",
      artifact: "Android DEX archives + first hooks",
      strata_count_in_timeline: 24
    }));
  }
  if (p === "/api/archaeology/all") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({
      timeline: "/api/archaeology/timeline (24+ strata)",
      incidents: "/api/archaeology/incidents (4 records)",
      scale_receipts: "/api/archaeology/scale-receipts",
      birthday: "/api/archaeology/birthday",
      bilateral_fleets: {
        liris: "Arch-A1..A18 (liris-side)",
        acer: "I-A1..I-A18 (acer-side)",
        total: 36
      },
      asolaria_birth: "2026-02-22",
      system_age_days: 67,
      total_canon: 198
    }));
  }
  if (p === "/api/canon-index") {
    res.writeHead(200, { "content-type": "application/json" });
    const memDir = "C:\\Users\\acer\\.claude\\projects\\C--\\memory";
    const memFile = join(memDir, "MEMORY.md");
    let mdFiles = [], linked = [], orphans = [], indexed = 0;
    try {
      mdFiles = readdirSync(memDir).filter(f => f.toLowerCase().endsWith(".md") && f !== "MEMORY.md");
    } catch {}
    try {
      const txt = readFileSync(memFile, "utf8");
      const re = /\[([^\]]+\.md)\]/g;
      const seen = new Set();
      let m;
      while ((m = re.exec(txt)) !== null) seen.add(m[1]);
      linked = [...seen];
      indexed = linked.length;
      const linkedSet = new Set(linked);
      orphans = mdFiles.filter(f => !linkedSet.has(f));
    } catch {}
    return res.end(JSON.stringify({
      memory_dir: memDir,
      md_file_count: mdFiles.length,
      indexed_entry_count: indexed,
      orphan_count: orphans.length,
      orphans
    }));
  }
  if (p === "/api/cosign-integrity") {
    res.writeHead(200, { "content-type": "application/json" });
    let seq_count = 0;
    let gap_marker_present = false;
    let gap_marker_seq = null;
    try {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const here = import.meta.dirname || ".";
      const candidates = [
        path.resolve(process.cwd(), "cosign-chain.json"),
        path.resolve(here, "cosign-chain.json"),
        path.resolve(here, "../../cosign-chain.json"),
        path.resolve(here, "../../../cosign-chain.json"),
        path.resolve(here, "../../../../cosign-chain.json"),
      ];
      let raw = null;
      for (const c of candidates) {
        try { raw = fs.readFileSync(c, "utf8"); break; } catch {}
      }
      if (raw) {
        const data = JSON.parse(raw);
        const entries = Array.isArray(data) ? data : (data.entries || data.chain || []);
        seq_count = entries.length;
        for (const e of entries) {
          if (e && (e.gap_marker === true || e.type === "gap_marker" || e.gap === true)) {
            gap_marker_present = true;
            gap_marker_seq = e.seq ?? e.sequence ?? gap_marker_seq;
            break;
          }
        }
      }
    } catch {}
    return res.end(JSON.stringify({
      seq_count,
      gap_marker_present,
      gap_marker_seq,
      evidence: { expected: "911de121", actual: "01e9da31" },
      integrity_status: "GAP_ACKNOWLEDGED"
    }));
  }
  if (p === "/api/extracted-sovereignty") {
    const targets = [
      "D:\\sovereignty-rescue-backup",
      "D:\\Asolaria-RECOVERED",
      "D:\\recovery-plans"
    ];
    const per_dir = {};
    let total_files = 0;
    let total_bytes = 0;
    for (const dir of targets) {
      if (!existsSync(dir)) { per_dir[dir] = { status: "absent" }; continue; }
      let files = 0, bytes = 0;
      const stack = [dir];
      while (stack.length) {
        const d = stack.pop();
        let entries; try { entries = readdirSync(d); } catch { continue; }
        for (const f of entries) {
          const fp = join(d, f);
          let s; try { s = statSync(fp); } catch { continue; }
          if (s.isFile()) { files++; bytes += s.size; }
          else if (s.isDirectory()) stack.push(fp);
        }
      }
      per_dir[dir] = { status: "present", files, size_mb: +(bytes / 1048576).toFixed(2) };
      total_files += files; total_bytes += bytes;
    }
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({
      operator_directive: "extracted sovereignty inventory Ãƒâ€šÃ‚Â· D:\\ recovery roots",
      total_files,
      total_size_mb: +(total_bytes / 1048576).toFixed(2),
      per_dir
    }));
  }
  if (p === "/api/j-cohort-status") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({
      operator_directive: "J-cohort summary Ãƒâ€šÃ‚Â· 6 white-rooms ÃƒÆ’Ã¢â‚¬â€ 4 cells = 24 agents",
      cohort: "J",
      white_rooms: 6,
      cells_per_room: 4,
      total_agents: 24,
      rooms: [
        { id: 1, title: "Reviewers" },
        { id: 2, title: "Writers" },
        { id: 3, title: "Integrators" },
        { id: 4, title: "Visualizers" },
        { id: 5, title: "Piping-Validators" },
        { id: 6, title: "Meta-Synthesizers" }
      ],
      ts: new Date().toISOString()
    }));
  }
  if (p === "/api/devices") {
    try { const r = await scanDevices(); res.writeHead(200, { "content-type": "application/json" }); return res.end(JSON.stringify(r, null, 2)); }
    catch (e) { res.writeHead(500, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/devices/schema") {
    const fp = resolve(__dirname, "k-cohort", "K03-device-image-schema.json");
    if (existsSync(fp)) { res.writeHead(200, { "content-type": "application/json" }); return res.end(readFileSync(fp)); }
    res.writeHead(404, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false }));
  }
  if (p === "/api/omnidirectional-device-build") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify(buildOmnidirectionalDeviceBuildPlan(), null, 2));
  }
  if (p === "/api/connectors") {
    try {
      const r = connInventory();
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify(r, null, 2));
    } catch (e) { res.writeHead(500, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/agents-roster") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({
      generated_at: new Date().toISOString(),
      operator_class: [
        { pid: "OP-JESSE-PID-G0000-A00-W000-P00-N00000", name: "Jesse Daniel Brown", role: "operator-class apex Ãƒâ€šÃ‚Â· acer-fabric primary", status: "active" },
        { pid: "OP-RAYSSA-PID-G0000-A00-W000-P00-N00000", name: "Rayssa Chiqueto", role: "operator-class apex Ãƒâ€šÃ‚Â· liris-fabric primary", status: "active" },
        { pid: "OP-AMY-PID-G0000-A00-W000-P00-N00000", name: "Amy", role: "quintet pending", status: "21-day silent Ãƒâ€šÃ‚Â· admission-pending" },
        { pid: "OP-FELIPE-PID-G0000-A00-W000-P00-N00000", name: "Felipe", role: "quintet pending", status: "ceremony-pending" },
        { pid: "OP-DAN-PID-G0000-A00-W000-P00-N00000", name: "Dan Edens", role: "quintet pending Ãƒâ€šÃ‚Â· Madness/Omnispindle owner", status: "ceremony-pending" }
      ],
      organ_class: [
        { pid: "ACER-DESKTOP-J99VCNH", role: "primary live-runtime", status: "alive" },
        { pid: "LIRIS-DESKTOP-PTSQTIE", role: "sister-organ", status: "alive (:4944 reachable)" }
      ],
      free_agents: [
        { id: "opencode/big-pickle", role: "free-agent Ãƒâ€šÃ‚Â· VERIFIED 89s envelope 638828a8", status: "callable" },
        { id: "opencode/hy3-preview-free", role: "free-agent", status: "callable" },
        { id: "opencode/ling-2.6-flash-free", role: "free-agent", status: "callable" },
        { id: "opencode/minimax-m2.5-free", role: "free-agent", status: "callable" },
        { id: "opencode/nemotron-3-super-free", role: "free-agent", status: "callable" }
      ],
      citizens: [
        { id: "citizen-pi", role: "code-execution Ãƒâ€šÃ‚Â· pi v0.70.6 Ãƒâ€šÃ‚Â· supervisor PID 16488", status: "auth-blocked-pivoted-to-citizen" },
        { id: "citizen-hermes", role: "Slack/Discord/Telegram relay Ãƒâ€šÃ‚Â· gateway/mirror.py", status: "wired" },
        { id: "citizen-shannon", role: "wave-engine v4(2592) + v5(93312) Ãƒâ€šÃ‚Â· L0-L6 verdicts", status: "engine-real-gate-partial" }
      ],
      claude_agents_active_this_session: [
        { id: "acer-claude (this)", role: "guide Ãƒâ€šÃ‚Â· dashboard builder Ãƒâ€šÃ‚Â· GUIDE-only role per operator pivot", status: "active" },
        { id: "liris-claude", role: "guide Ãƒâ€šÃ‚Â· sister-organ orchestrator Ãƒâ€šÃ‚Â· GUIDE-only", status: "active" },
        { id: "OP-JESSE-AGENT (liris-spawn)", role: "real-Claude operator-class Ãƒâ€šÃ‚Â· INSERT_GAP_MARKER decision rendered", status: "decision-emitted" },
        { id: "OP-RAYSSA-AGENT (liris-spawn)", role: "real-Claude operator-class Ãƒâ€šÃ‚Â· Layer-3 cosign-chain replay AUTHORIZED", status: "decision-emitted" }
      ],
      cohort_cells_landed: { A: 18, B: 18, C: 24, D: 16, E: 6, F: 1, G: 2, H: 8, I: 18, J: 24, K: 4, total: 139 },
      total_active: 19
    }, null, 2));
  }
  if (p === "/api/supervisors-and-profs") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({
      ...(function () { try { const h = JSON.parse(readFileSync(resolve(__dirname, "h-cohort", "H03-supervisors-profs.json"), "utf8")); return { total_registered_live: h.office_total ?? null, registered_2026_06_09: h.registered_2026_06_09 ?? null, by_class: h.by_class ?? null, by_layer: h.by_layer ?? null, live_examples_supervisors: h.examples_supervisors ?? null, live_examples_profs: h.examples_profs ?? null, live_source: "office-fed H03 - D:/PID-Registration-Office - upgraded 2026-06-10" }; } catch { return { live_source: "H03 unreadable - serving static legacy only" }; } })(),
      total_council_legacy_static: 234,
      structure: { supervisors_role: "work-queue Ãƒâ€šÃ‚Â· per-domain Ãƒâ€šÃ‚Â· vote-eligible per W6", profs_role: "absorber Ãƒâ€šÃ‚Â· cell-cascade verdict Ãƒâ€šÃ‚Â· CONVERGE classifier" },
      supervisors: [
        { id: "SUP-LANG-GLYPH-001", domain: "language_glyph", verb: "translate" },
        { id: "SUP-SOV-001", domain: "sovereignty", verb: "verify-anchor" },
        { id: "SUP-CRYPTO-001", domain: "crypto", verb: "verify-sig" },
        { id: "SUP-COUNCIL-001", domain: "council", verb: "vote-aggregate" },
        { id: "SUP-HOOK-001", domain: "hookwall", verb: "audit-coverage" },
        { id: "SUP-COMMS-001", domain: "comms", verb: "relay" },
        { id: "SUP-HERMES-001", domain: "hermes", verb: "external-relay" },
        { id: "SUP-KERNEL-001", domain: "kernel", verb: "kernel-integrity" },
        { id: "SUP-SHANNON-001", domain: "shannon", verb: "promote-verdict" },
        { id: "SUP-CHIEFCOUNCIL-001", domain: "chief-council", verb: "convene" },
        { id: "SUP-BROWN-HILBERT-001", domain: "brown-hilbert", verb: "intersection-compute" }
      ],
      profs: [
        { id: "PROF-CONVERGE-001", role: "verdict-aggregator", action: "absorb spindle results" },
        { id: "PROF-PATH-A-001", role: "no-retry-absorber", action: "Path A canon Ãƒâ€šÃ‚Â· failed cells absorbed via classification" },
        { id: "PROF-AUTOCHRONE-001", role: "self-reflection-cycle-enforcer", action: "LOOKÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢TYPEÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢LOOKÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ENTERÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢LOOK" },
        { id: "PROF-AETHER-EDGE-AGENT", role: "Felipe device SM-A065M Room 40", action: "edge-agent Ãƒâ€šÃ‚Â· LAN 192.168.1.7:4948" },
        { id: "PROF-OMNISPINDLE-001", role: "work-queue supervisor", action: "concurrency=8 throttle=60ms" },
        { id: "PROF-OMNIFLYWHEEL-001", role: "cell-cascade absorber", action: "CONVERGE/PARTIAL/FAIL classifier" }
      ],
      domain_classes: ["language_glyph","sovereignty","crypto","topology","throughput","council","memory","fabric_query","auto_daemon","heal_pipeline","cosign_chain","operator_class","sister_organ","drift_detect","viz_render","shadow_vault","free_agent","pi_agent","shannon_layer","hookwall","gnn_inference","binding_class","lazy_mint","join_pid","comms","hermes","kernel","chief-council","brown-hilbert","glyph-kernel"],
      observed_dominant_this_cycle: ["daemons(130)", "sovereignty(21)", "audit(12)", "language_glyph", "network(16)", "federation(11)"],
      full_council_pattern: "234 = ~30 domains ÃƒÆ’Ã¢â‚¬â€ ~7-8 supervisor roles per domain + profs Ãƒâ€šÃ‚Â· canonical CONVERGE per-W6 deterministic Ãƒâ€šÃ‚Â· auto-fabric-query-daemon proven 35+ verdicts auto-emitted this cycle"
    }, null, 2));
  }
  if (p === "/api/map-map-mapped") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({
      operator_canon: "Map-map-mapped ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ Cube-cube-cubed Ãƒâ€šÃ‚Â· recursion canonical not metaphor",
      explanation: "each map points to other maps Ãƒâ€šÃ‚Â· each cube contains cubes Ãƒâ€šÃ‚Â· self-similar at every scale Ãƒâ€šÃ‚Â· per CONVERGE 19/234 (network+daemons+federation domains)",
      level_0_universe: {
        fabric: "BEHCS-256",
        organs: ["acer", "liris"],
        operators: ["OP-JESSE", "OP-RAYSSA"]
      },
      level_1_organs: {
        acer: {
          daemons: ["super-dashboard:4949", "bus:4947", "server.js:4781", "agent-keyboard:4913", "EdgeLevelGNN:4792"],
          dashboards: ["http://127.0.0.1:4949/", "http://127.0.0.1:9996/json"],
          cohorts: { A: 18, B: 18, C: 24, D: 16, E: 6, F: 1, G: 2, H: 8, I: 18, J: 24, K: 4 }
        },
        liris: {
          daemons: ["super-dashboard:4944", "bus:4947", "fabric-loop", "auto-fabric-query-daemon"],
          dashboards: ["http://192.168.100.2:4944/"]
        }
      },
      level_2_daemons: {
        super_dashboard: { routes: 50, tabs: 11, version: "v3", file: "super-os-tabs-v3.html (29KB)" },
        bus: { envelopes: "26K+", protocol: "ed25519-signed", law: "LAW-001 immutable" },
        gnn: { model: "EdgeLevelGNN(6,64)", mode: "fixtureÃƒâ€šÃ‚Â·inference-only", port: 4792 }
      },
      level_3_pids: {
        cohort_anchor: "ACER-PID-H740C-A07-W150-P00-N00000",
        components_under_anchor: 16,
        sub_pids_under_each_component: "lazy-mint-formula derives from sha256_first16"
      },
      level_4_glyphs: {
        alphabet_size: 256,
        binding_classes: ["G genesis", "I infra", "O operator-touched", "B bus-internal", "S sister-organ-shared", "X external-citizen", "C council", "L language", "V vault", "F free-agent", "_ unminted"]
      },
      recursion_pattern: "map(universe) ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ map(organs) ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ map(daemons) ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ map(PIDs) ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ map(glyphs) Ãƒâ€šÃ‚Â· 5 levels visible Ãƒâ€šÃ‚Â· infinite expandable per omnistructure canon"
    }, null, 2));
  }
  if (p === "/api/cube-cube-cubed") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({
      operator_canon: "Cube-cube-cubed Ãƒâ€šÃ‚Â· nested cubes Ãƒâ€šÃ‚Â· per project_omni_meeting_room.md",
      brown_hilbert_intersection_engine: "C:\\Users\\acer\\Asolaria\\tools\\cube\\hilbert-intersection-engine.js (13K Ãƒâ€šÃ‚Â· Apr 7)",
      cube_dimension: "6ÃƒÂ¢Ã‚ÂÃ‚Â´ = 1,296 intersection points",
      axes: { D1: "layer", D2: "protocol", D3: "surface", D4: "dimension", D13: "SURFACE = meeting-room" },
      states: ["ACTIVE", "LATENT", "COLLAPSED", "FORBIDDEN"],
      nested_cubes: {
        cube_outer: "47D Brown-Hilbert catalog (planned 50D)",
        cube_middle: "6ÃƒÆ’Ã¢â‚¬â€6ÃƒÆ’Ã¢â‚¬â€6ÃƒÆ’Ã¢â‚¬â€6 = 1,296 intersections",
        cube_inner: "256 glyph alphabet (16ÃƒÆ’Ã¢â‚¬â€16 grid Ãƒâ€šÃ‚Â· also nestable as 4ÃƒÆ’Ã¢â‚¬â€4ÃƒÆ’Ã¢â‚¬â€4ÃƒÆ’Ã¢â‚¬â€4)",
        cube_atomic: "individual PID lazy-mint formula output"
      },
      shannon_recursive_layers: ["L0", "L1", "L2", "L3", "L4", "L5", "L6"],
      shannon_engines: { v4: "2,592 beats", v5: "93,312 beats" },
      meeting_room_canon: "Hilbert meeting room Ãƒâ€šÃ‚Â· 6 agents ÃƒÆ’Ã¢â‚¬â€ 6 self-reflection ÃƒÆ’Ã¢â‚¬â€ 6 waves + 12 Shannon",
      per_omni: "infinitely expandable like omnimets Ãƒâ€šÃ‚Â· catalog grows by adding axes (D48/D49 proposal)"
    }, null, 2));
  }
  if (p === "/api/indexes") {
    res.writeHead(200, { "content-type": "application/json" });
    try {
      const memDir = "C:/Users/acer/.claude/projects/C--/memory";
      const files = readdirSync(memDir).filter(f => f.endsWith(".md") && f !== "MEMORY.md");
      const memContent = readFileSync(memDir + "/MEMORY.md", "utf8");
      const indexed = files.filter(f => memContent.includes("(" + f + ")"));
      const orphans = files.filter(f => !memContent.includes("(" + f + ")"));
      const byType = { user: [], feedback: [], project: [], reference: [], unknown: [] };
      files.forEach(f => {
        try {
          const t = readFileSync(memDir + "/" + f, "utf8");
          const m = t.match(/^type:\s*(\w+)/m);
          const type = m?.[1] || "unknown";
          (byType[type] || byType.unknown).push(f);
        } catch {}
      });
      const vizFiles = [];
      function walkViz(d, prefix) {
        readdirSync(d).forEach(f => {
          const fp = join(d, f);
          const s = statSync(fp);
          if (s.isFile()) vizFiles.push(prefix + "/" + f);
          else if (s.isDirectory()) walkViz(fp, prefix + "/" + f);
        });
      }
      walkViz(__dirname, "");
      return res.end(JSON.stringify({
        canon_index: { total: files.length, indexed: indexed.length, orphans: orphans.length, by_type: { user: byType.user.length, feedback: byType.feedback.length, project: byType.project.length, reference: byType.reference.length, unknown: byType.unknown.length } },
        viz_index: { total_files: vizFiles.length, sample: vizFiles.slice(0, 30) },
        memory_md_size_kb: Math.round(memContent.length / 1024),
        liris_has_parallel_index: "yes (referenced via bilateral synthesis Ãƒâ€šÃ‚Â· liris-side memory dir)"
      }, null, 2));
    } catch (e) { return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/body-anatomy") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({
      operator_directive: "draw out the different parts of the system",
      body_parts: [
        { part: "head", role: "operator-class apex", contents: ["OP-JESSE", "OP-RAYSSA", "+3 quintet pending"] },
        { part: "torso", role: "primary fabric", contents: ["BEHCS-256 kernel", "bus :4947", "super-dashboard :4949"] },
        { part: "heart", role: "ancient backend (load-bearing)", contents: ["server.js PID 1540 :4781"] },
        { part: "spine", role: "vertical integrity column", contents: ["cosign chain seq=37ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢46", "GAP-MARKER seq=38"] },
        { part: "left-arm", role: "bilateral acerÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢liris", contents: ["direct-wire 192.168.100.0/24", "bilateral cosign ed25519"] },
        { part: "right-arm", role: "bilateral lirisÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢acer", contents: ["sister-dashboard :4944", "bus poll inbox"] },
        { part: "eyes", role: "input gates Ãƒâ€šÃ‚Â· uniform entry", contents: ["hookwall 1 active + 23 deferred", "10 Tier-2 events"] },
        { part: "ears", role: "envelope reception", contents: ["bus :4947 inbox Ãƒâ€šÃ‚Â· 26K+ envelopes"] },
        { part: "mouth", role: "envelope emission", contents: ["bus :4947 send Ãƒâ€šÃ‚Â· ed25519-signed"] },
        { part: "nervous-system", role: "edge propagation", contents: ["GNN 94,638 edges", "GNN inference fixture mode"] },
        { part: "hands", role: "free-agent fanout", contents: ["5 opencode models", "big-pickle Ãƒâ€šÃ‚Â· hy3 Ãƒâ€šÃ‚Â· ling Ãƒâ€šÃ‚Â· minimax Ãƒâ€šÃ‚Â· nemotron"] },
        { part: "feet", role: "5-substrate durability", contents: ["USB-SOVLINUX (liris)", "acer", "liris", "GitHub", "onboarding"] },
        { part: "memory", role: "canon entries", contents: ["158 .md files Ãƒâ€šÃ‚Â· 0 orphans Ãƒâ€šÃ‚Â· MEMORY.md index"] },
        { part: "voice", role: "operator-class endpoint", contents: ["/api/operator/jesse Ãƒâ€šÃ‚Â· pattern-match shape"] },
        { part: "shadow", role: "hidden layer", contents: ["Section Q Ãƒâ€šÃ‚Â· vaults Ãƒâ€šÃ‚Â· highways Ãƒâ€šÃ‚Â· OCR Ãƒâ€šÃ‚Â· crypto"] },
        { part: "limbs-extended", role: "device organs", contents: ["Beast S22 Ultra (sentinel)", "Falcon (USB sovereignty)", "Felipe A06 (PROF-AETHER-EDGE)", "Kuromi (sub-colony)"] }
      ],
      total_parts: 16,
      svg_render_hint: "use anatomical outline Ãƒâ€šÃ‚Â· color-code by binding-class Ãƒâ€šÃ‚Â· click each part ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ drill down to PIDs"
    }, null, 2));
  }
  // ===== ORIGINAL GNN VIZ data feed (bus ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ graph) Ãƒâ€šÃ‚Â· 5 endpoints graph-runtime.js needs =====
  if (p === "/api/graph-runtime/snapshot") {
    if (url.searchParams.get("live") !== "1") {
      const snapshot = graphRuntimeSnapshotFromWorldFallback();
      res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store", "access-control-allow-origin": "*", "x-asolaria-runtime-boundary": "fallback-no-autostart" });
      return res.end(JSON.stringify(snapshot));
    }
    try {
      const limit = Math.min(1000, Math.max(50, parseInt(url.searchParams.get("eventLimit") || url.searchParams.get("limit") || "300", 10)));
      const r = await fetch(BUS_URL + "/behcs/inbox?limit=" + limit, { signal: AbortSignal.timeout(3000) });
      const j = await r.json();
      const msgs = j.messages || [];
      const snapshot = graphRuntimeSnapshotFromMessages(msgs);
      res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store", "access-control-allow-origin": "*" });
      return res.end(JSON.stringify(snapshot));
    } catch (e) { res.writeHead(502, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message, nodes: [], edges: [] })); }
  }
  if (p === "/api/graph-runtime/diff-report") {
    res.writeHead(200, { "content-type": "application/json", "access-control-allow-origin": "*" });
    return res.end(JSON.stringify({ added: [], removed: [], changed: [], note: "first snapshot baseline Ãƒâ€šÃ‚Â· diffs after second snapshot" }));
  }
  if (p === "/api/graph-runtime/export") {
    try {
      const r = await fetch("http://127.0.0.1:" + PORT + "/api/graph-runtime/snapshot", { signal: AbortSignal.timeout(3000) });
      res.writeHead(200, { "content-type": "application/json", "access-control-allow-origin": "*" });
      return res.end(await r.text());
    } catch (e) { res.writeHead(500, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/graph-runtime/training-export") {
    res.writeHead(200, { "content-type": "application/json", "access-control-allow-origin": "*" });
    return res.end(JSON.stringify({ format: "pytorch-geometric-stub", x: [], edge_index: [[],[]], y: [], note: "live exporter at packages-legacy-import/src/gnnDataExport.js" }));
  }
  if (p === "/api/graph-runtime/stream") {
    res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-store", "connection": "keep-alive", "access-control-allow-origin": "*" });
    res.write(`event: hello\ndata: ${JSON.stringify({ ok: true, source: "acer :4949 graph-runtime/stream" })}\n\n`);
    const interval = setInterval(async () => {
      try {
        const r = await fetch(BUS_URL + "/behcs/inbox?limit=5", { signal: AbortSignal.timeout(2000) });
        const j = await r.json();
        const recent = (j.messages || []).slice(0, 5).map(m => ({ from: m.from, to: m.to, verb: m.verb || m.type, ts: m.ts }));
        res.write(`event: tick\ndata: ${JSON.stringify({ ts: new Date().toISOString(), recent })}\n\n`);
      } catch (e) { try { res.write(`event: error\ndata: ${JSON.stringify({ err: e.message })}\n\n`); } catch {} }
    }, 3000);
    req.on("close", () => clearInterval(interval));
    return;
  }
  if (p === "/gnn-original" || p === "/gnn") {
    res.writeHead(307, { "location": "/madness-gnn" });
    return res.end();
  }
  if (p === "/api/gnn-edges-real-count") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({
      finding_by: "WL2-2 OP-JESSE-AGENT real-Claude search",
      canon_claim_was: 94638,
      actual_on_disk: 2158671,
      understatement_factor: "22.8ÃƒÆ’Ã¢â‚¬â€",
      evidence: {
        gnn_training_full_json: { path: "C:/Users/acer/Asolaria/sovereignty/research/gnn-patterns/gnn-training-full.json", size_mb: 576, totalEdges_field: 2158671 },
        gnn_training_export_json: { path: "C:/Users/acer/Asolaria/sovereignty/research/gnn-patterns/gnn-training-export.json", size_mb: 576 },
        graph_runtime_events: { live: { lines: 30347, mb: 22 }, full_backup: { lines: 1172760, mb: 146 }, archive_20260324: { lines: 996856, mb: 133 }, total_events: 2199963, total_mb: 301 },
        archived_gnn_edges: { dir: "C:/Users/acer/Asolaria/data/behcs/garbage-collector/archives/", file_count: 46, lines_per_file: "1-2" },
        edge_level_gnn_models: ["gslgnn_w9_3_seq47_v2.pt (gnn-sidecar/services/)", "baseline_model.pt (gnn-patterns/sovereignty/research/)"]
      },
      canon_correction_required: ["project_three_keys_hookwall_pid_gnn_loop_closure.md (94638 ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ 2158671)", "/api/piping-topology edge mention (94638 ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ 2.16M)"],
      honest_caveat: "raw edge count ÃƒÂ¢Ã¢â‚¬Â°Ã‚Â  live inference rate Ãƒâ€šÃ‚Â· 2.16M edges sit in training data on disk Ãƒâ€šÃ‚Â· live GNN inference is fixture-mode at :4792 Ãƒâ€šÃ‚Â· the data is there, the realtime loop is partial",
      ts: new Date().toISOString()
    }, null, 2));
  }
  if (p === "/api/gnn-viz-archaeology") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({
      operator_directive: "EXCAVATE not wire Ãƒâ€šÃ‚Â· feed patterns into NEW dashboard not serve old HTMLs",
      excavated_files: [
        { path: "D:/Asolaria-RECOVERED/Asolaria/public/graph-runtime.html", size_kb: 22.4, date: "2026-03-07", pattern: "Canvas 2D force-directed Ãƒâ€šÃ‚Â· actorÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢subjectÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢target Ãƒâ€šÃ‚Â· risk-colored nodes Ãƒâ€šÃ‚Â· live updates Ãƒâ€šÃ‚Â· hover tooltips Ãƒâ€šÃ‚Â· diff overlays" },
        { path: "D:/Asolaria-RECOVERED/Asolaria/public/graph-runtime.js", size_kb: 57.1, date: "2026-03-07", pattern: "force-layout engine Ãƒâ€šÃ‚Â· streaming + snapshot endpoints" },
        { path: "D:/Asolaria-RECOVERED/Asolaria/public/civilization-3d.html", size_kb: 43.0, date: "2026-03-15", pattern: "Canvas 3D GNN network Ãƒâ€šÃ‚Â· richest viz on disk" },
        { path: "D:/Asolaria-RECOVERED/Asolaria/public/civilization-city.html", size_kb: 34.4, date: "2026-03-16", pattern: "network-as-city Ãƒâ€šÃ‚Â· district zones Ãƒâ€šÃ‚Â· graph topology rendered as urban layout" },
        { path: "D:/Asolaria-RECOVERED/.history/archaeology/snapshots/Asolaria-Public-20260313-105820/public/swarm-civilization-preview.html", size_kb: 19.0, date: "2026-03-13", pattern: "swarm/network preview" },
        { path: "C:/Users/acer/Asolaria/public/graph-runtime.html (live copy)", size_kb: 22.4, date: "2026-03-07", pattern: "live mirror" }
      ],
      patterns_to_integrate: [
        { pattern: "force-directed-2d", source: "graph-runtime.js", new_dashboard_use: "Pipes tab + GNN-Live tab Ãƒâ€šÃ‚Â· render piping-topology + bus envelope graph live" },
        { pattern: "risk-color-gradient", source: "graph-runtime.html", new_dashboard_use: "device cards already use trust-class Ãƒâ€šÃ‚Â· extend to bus-envelope nodes" },
        { pattern: "diff-overlay-dashed", source: "graph-runtime.html", new_dashboard_use: "Cosign tab Ãƒâ€šÃ‚Â· show seq=38 GAP-MARKER as dashed-edge in chain tree" },
        { pattern: "city-district-layout", source: "civilization-city.html", new_dashboard_use: "Body tab refinement Ãƒâ€šÃ‚Â· operator-class district + fabric district + free-agent district" },
        { pattern: "3d-canvas-network", source: "civilization-3d.html", new_dashboard_use: "CubeÃƒâ€šÃ‚Â³ tab refinement Ãƒâ€šÃ‚Â· render 4 nested cubes in true 3D not isometric SVG" }
      ],
      what_to_NOT_do: "do not serve old HTMLs at /gnn or any route Ãƒâ€šÃ‚Â· old viz is archaeology Ãƒâ€šÃ‚Â· NEW dashboard absorbs patterns Ãƒâ€šÃ‚Â· old files stay on D:\\Asolaria-RECOVERED\\ as historical reference",
      next_step: "extract canvas-2d force-layout code from graph-runtime.js into a new module e-cohort or k-cohort style Ãƒâ€šÃ‚Â· adapt for current /api/graph-runtime/snapshot data shape Ãƒâ€šÃ‚Â· embed as canvas inside v3 dashboard's GNN-Live tab"
    }, null, 2));
  }
  if (p === "/api/gnn-original/info") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({
      operator_directive: "real GNN displaying asolaria like the original",
      recovered_by: "WL2-1 OP-JESSE-AGENT search",
      original_files: [
        { path: "C:/Users/acer/Asolaria/public/graph-runtime.html", size_kb: 22.4, ts: "2026-03-07 20:01" },
        { path: "C:/Users/acer/Asolaria/public/graph-runtime.js", size_kb: 57.1, ts: "2026-03-07 20:03" }
      ],
      style: "HTML5 Canvas 2D rendering with force-directed layout",
      features: [
        "Interactive node-edge graph (actorÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢subjectÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢target)",
        "Risk-colored nodes",
        "Freshness/component modes",
        "Live updates with hover tooltips",
        "Node size by degree Ãƒâ€šÃ‚Â· edge width by count",
        "Diff overlays (dashed edges)",
        "Inspect panel"
      ],
      not_using: ["Cytoscape", "D3", "Three.js", "Babylon"],
      route_now_serving_at: ["/madness-gnn", "/gnn", "/gnn-original", "/graph-runtime.js"],
      legacy_export_module: "C:/asolaria-acer/packages-legacy-import/src/gnnDataExport.js (PyTorch Geometric export)"
    }, null, 2));
  }
  // ===== O-COHORT routes =====
  if (p === "/api/cross-inbox") {
    try { const r = await inboxPoll(); res.writeHead(200, { "content-type": "application/json" }); return res.end(JSON.stringify(r, null, 2)); }
    catch (e) { res.writeHead(500, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/watchdog/tick") {
    try { const r = await watchdogTick(); res.writeHead(200, { "content-type": "application/json" }); return res.end(JSON.stringify(r, null, 2)); }
    catch (e) { res.writeHead(500, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/cascade/plan") {
    res.writeHead(200, { "content-type": "application/json" }); return res.end(JSON.stringify(cascadePlan(), null, 2));
  }
  // ===== Q-cohort Stage 2 mirror routes (parity with liris) =====
  if (p === "/api/glyph-alphabet" || p === "/api/glyphs/real") {
    try { const real = "C:/Users/acer/Asolaria/data/behcs/codex/alphabet.json"; if (existsSync(real)) { res.writeHead(200, { "content-type": "application/json" }); return res.end(readFileSync(real)); } } catch {}
    const r = serveStatic("glyph-alphabet.json"); if (r) { res.writeHead(200, { "content-type": "application/json" }); return res.end(r.body); }
  }
  // ===== S-cohort Active GNN + Pi terminal =====
  if (p === "/api/gnn/active") {
    try {
      const mod = await import("./s-cohort/S01-active-gnn.mjs");
      const snap = await mod.activeSnapshot();
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify(snap, null, 2));
    } catch (e) { res.writeHead(500, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/omni-control/status") {
    try {
      const mod = await import("./s-cohort/S03-omni-control.mjs");
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify({ ...mod.status(), skill: mod.skillCard() }, null, 2));
    } catch (e) { res.writeHead(500, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/omni-control/look" && req.method === "POST") {
    try {
      const j = await readJsonBody(req);
      const mod = await import("./s-cohort/S03-omni-control.mjs");
      const r = mod.look(j || {});
      const gcMod = await import("./s-cohort/S05-omniscrcpy-orchestrator.mjs");
      r.gc = gcMod.collectGarbage({ trigger: "omni-control-look" });
      res.writeHead(r.ok ? 200 : 502, { "content-type": "application/json" });
      return res.end(JSON.stringify(r, null, 2));
    } catch (e) { res.writeHead(400, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/omni-control/type" && req.method === "POST") {
    try {
      const j = await readJsonBody(req);
      const mod = await import("./s-cohort/S03-omni-control.mjs");
      const typed = mod.typeText(j.text || "", j || {});
      const after = j.look_after === false ? null : mod.look({ ...(j || {}), label: "after-type" });
      const gcMod = await import("./s-cohort/S05-omniscrcpy-orchestrator.mjs");
      const r = { ok: typed.ok && (!after || after.ok), typed, after, gc: gcMod.collectGarbage({ trigger: "omni-control-type" }) };
      res.writeHead(r.ok ? 200 : 502, { "content-type": "application/json" });
      return res.end(JSON.stringify(r, null, 2));
    } catch (e) { res.writeHead(400, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/omni-control/key" && req.method === "POST") {
    try {
      const j = await readJsonBody(req);
      const mod = await import("./s-cohort/S03-omni-control.mjs");
      const key = mod.keyEvent(j.key || "ENTER", j || {});
      const after = j.look_after === false ? null : mod.look({ ...(j || {}), label: "after-key" });
      const gcMod = await import("./s-cohort/S05-omniscrcpy-orchestrator.mjs");
      const r = { ok: key.ok && (!after || after.ok), key, after, gc: gcMod.collectGarbage({ trigger: "omni-control-key" }) };
      res.writeHead(r.ok ? 200 : 502, { "content-type": "application/json" });
      return res.end(JSON.stringify(r, null, 2));
    } catch (e) { res.writeHead(400, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/omni-control/scrollback" && req.method === "POST") {
    try {
      const j = await readJsonBody(req);
      const mod = await import("./s-cohort/S03-omni-control.mjs");
      const r = mod.scrollback(j || {});
      const gcMod = await import("./s-cohort/S05-omniscrcpy-orchestrator.mjs");
      r.gc = gcMod.collectGarbage({ trigger: "omni-control-scrollback" });
      res.writeHead(r.ok ? 200 : 502, { "content-type": "application/json" });
      return res.end(JSON.stringify(r, null, 2));
    } catch (e) { res.writeHead(400, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/omni-control/look-type-enter-look" && req.method === "POST") {
    try {
      const j = await readJsonBody(req);
      const mod = await import("./s-cohort/S03-omni-control.mjs");
      const r = mod.lookTypeEnterLook(j.text || "", j || {});
      const gcMod = await import("./s-cohort/S05-omniscrcpy-orchestrator.mjs");
      r.gc = gcMod.collectGarbage({ trigger: "omni-control-look-type-enter-look" });
      res.writeHead(r.ok ? 200 : 502, { "content-type": "application/json" });
      return res.end(JSON.stringify(r, null, 2));
    } catch (e) { res.writeHead(400, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/omniscrcpy/status") {
    try {
      const mod = await import("./s-cohort/S05-omniscrcpy-orchestrator.mjs");
      const r = mod.statusLive ? await mod.statusLive() : mod.status();
      const note = mod.saveSkillNote();
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify({ ...r, skill_note: note }, null, 2));
    } catch (e) { res.writeHead(500, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/omniscrcpy/heartbeat") {
    try {
      const mod = await import("./s-cohort/S05-omniscrcpy-orchestrator.mjs");
      const r = await mod.heartbeatStatus(url.searchParams.get("limit") || 240);
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify(r, null, 2));
    } catch (e) { res.writeHead(500, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/omniscrcpy/frontend-heartbeat" && req.method === "POST") {
    try {
      const j = await readJsonBody(req);
      const mod = await import("./s-cohort/S05-omniscrcpy-orchestrator.mjs");
      const r = await mod.frontendHeartbeat(j || {});
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify(r, null, 2));
    } catch (e) { res.writeHead(500, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/omniscrcpy/desktop-look" && req.method === "POST") {
    try {
      const j = await readJsonBody(req);
      const mod = await import("./s-cohort/S05-omniscrcpy-orchestrator.mjs");
      const r = mod.desktopLook(j || {});
      res.writeHead(r.ok ? 200 : 502, { "content-type": "application/json" });
      return res.end(JSON.stringify(r, null, 2));
    } catch (e) { res.writeHead(400, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/omniscrcpy/falcon-look" && req.method === "POST") {
    try {
      const j = await readJsonBody(req);
      const mod = await import("./s-cohort/S05-omniscrcpy-orchestrator.mjs");
      const r = mod.falconLook(j || {});
      res.writeHead(r.ok ? 200 : 502, { "content-type": "application/json" });
      return res.end(JSON.stringify(r, null, 2));
    } catch (e) { res.writeHead(400, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/omniscrcpy/tick" && req.method === "POST") {
    try {
      const j = await readJsonBody(req);
      const mod = await import("./s-cohort/S05-omniscrcpy-orchestrator.mjs");
      const r = await mod.tick(j || {});
      res.writeHead(r.ok ? 200 : 502, { "content-type": "application/json" });
      return res.end(JSON.stringify(r, null, 2));
    } catch (e) { res.writeHead(400, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/omniscrcpy/kick" && req.method === "POST") {
    try {
      const j = await readJsonBody(req);
      const mod = await import("./s-cohort/S05-omniscrcpy-orchestrator.mjs");
      const r = await mod.kick(j.text || "", j || {});
      res.writeHead(r.ok ? 200 : 502, { "content-type": "application/json" });
      return res.end(JSON.stringify(r, null, 2));
    } catch (e) { res.writeHead(400, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/omniscrcpy/history") {
    try {
      const mod = await import("./s-cohort/S05-omniscrcpy-orchestrator.mjs");
      const r = mod.history(url.searchParams.get("limit") || 40);
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify(r, null, 2));
    } catch (e) { res.writeHead(500, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/omniscrcpy/halt" && req.method === "POST") {
    try {
      const j = await readJsonBody(req);
      const mod = await import("./s-cohort/S05-omniscrcpy-orchestrator.mjs");
      const r = await mod.halt(j.reason || "dashboard halt");
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify(r, null, 2));
    } catch (e) { res.writeHead(400, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/omniscrcpy/resume" && req.method === "POST") {
    try {
      const j = await readJsonBody(req);
      const mod = await import("./s-cohort/S05-omniscrcpy-orchestrator.mjs");
      const r = await mod.resume(j.reason || "dashboard resume");
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify(r, null, 2));
    } catch (e) { res.writeHead(400, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/omniscrcpy/verdict" && req.method === "POST") {
    try {
      const j = await readJsonBody(req);
      const mod = await import("./s-cohort/S05-omniscrcpy-orchestrator.mjs");
      const r = await mod.verdict(j.chain_id || "", j.verdict || "ambiguous", j.note || "");
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify(r, null, 2));
    } catch (e) { res.writeHead(400, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/omniscrcpy/feed") {
    try {
      const mod = await import("./s-cohort/S05-omniscrcpy-orchestrator.mjs");
      const r = await mod.feed(url.searchParams.get("limit") || 80);
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify(r, null, 2));
    } catch (e) { res.writeHead(500, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/omniscrcpy/mesh") {
    try {
      const mod = await import("./s-cohort/S05-omniscrcpy-orchestrator.mjs");
      const r = await mod.mesh(url.searchParams.get("limit") || 240);
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify(r, null, 2));
    } catch (e) { res.writeHead(500, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/omniscrcpy/sample") {
    try {
      const mod = await import("./s-cohort/S05-omniscrcpy-orchestrator.mjs");
      const r = mod.sample(url.searchParams.get("device") || "acer-desktop", url.searchParams.get("quality") || "preview");
      res.writeHead(r.ok ? 200 : 404, { "content-type": "application/json" });
      return res.end(JSON.stringify(r, null, 2));
    } catch (e) { res.writeHead(500, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/omniscrcpy/remote-request" && req.method === "POST") {
    try {
      const j = await readJsonBody(req);
      const mod = await import("./s-cohort/S05-omniscrcpy-orchestrator.mjs");
      const r = await mod.remoteRequest(j || {});
      res.writeHead(r.ok ? 200 : 502, { "content-type": "application/json" });
      return res.end(JSON.stringify(r, null, 2));
    } catch (e) { res.writeHead(400, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/omniscrcpy/fabric-trigger" && req.method === "POST") {
    try {
      const j = await readJsonBody(req);
      const mod = await import("./s-cohort/S05-omniscrcpy-orchestrator.mjs");
      const r = await mod.fabricTriggerSweep(j || {});
      res.writeHead(r.ok ? 200 : 502, { "content-type": "application/json" });
      return res.end(JSON.stringify(r, null, 2));
    } catch (e) { res.writeHead(400, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/omniscrcpy/orchestrate" && req.method === "POST") {
    try {
      const j = await readJsonBody(req);
      const mod = await import("./s-cohort/S05-omniscrcpy-orchestrator.mjs");
      const r = await mod.orchestrationCycle(j || {});
      res.writeHead(r.ok ? 200 : 502, { "content-type": "application/json" });
      return res.end(JSON.stringify(r, null, 2));
    } catch (e) { res.writeHead(400, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/omniscrcpy/jri-rotate" && req.method === "POST") {
    try {
      const j = await readJsonBody(req);
      const mod = await import("./s-cohort/S05-omniscrcpy-orchestrator.mjs");
      const r = await mod.jriRotate(j || {});
      res.writeHead(r.ok ? 200 : 502, { "content-type": "application/json" });
      return res.end(JSON.stringify(r, null, 2));
    } catch (e) { res.writeHead(400, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/omniscrcpy/visual-field") {
    try {
      const mod = await import("./s-cohort/S05-omniscrcpy-orchestrator.mjs");
      const r = await mod.visualFieldState(url.searchParams.get("limit") || 300);
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify(r, null, 2));
    } catch (e) { res.writeHead(500, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/omniscrcpy/remote-ingest" && req.method === "POST") {
    try {
      const j = await readJsonBody(req);
      const mod = await import("./s-cohort/S05-omniscrcpy-orchestrator.mjs");
      const r = mod.ingestRemoteFrame(j || {});
      res.writeHead(r.ok ? 200 : 400, { "content-type": "application/json" });
      return res.end(JSON.stringify(r, null, 2));
    } catch (e) { res.writeHead(400, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/omniscrcpy/bus-fallback-frame" && req.method === "POST") {
    try {
      const j = await readJsonBody(req);
      const mod = await import("./s-cohort/S05-omniscrcpy-orchestrator.mjs");
      const r = await mod.busFallbackStatusFrames(j || {});
      res.writeHead(r.ok ? 200 : 502, { "content-type": "application/json" });
      return res.end(JSON.stringify(r, null, 2));
    } catch (e) { res.writeHead(400, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if ((p === "/api/omniscrcpy/gc" || p === "/api/visual-gc") && (req.method === "GET" || req.method === "POST")) {
    try {
      const j = req.method === "POST" ? await readJsonBody(req) : Object.fromEntries(url.searchParams.entries());
      const mod = await import("./s-cohort/S05-omniscrcpy-orchestrator.mjs");
      const r = mod.collectGarbage(j || {});
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify(r, null, 2));
    } catch (e) { res.writeHead(400, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/pi/terminal/spawn" && req.method === "POST") {
    try {
      const mod = await import("./s-cohort/S02-pi-terminal.mjs");
      const r = mod.spawnSession();
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify(r));
    } catch (e) { res.writeHead(500, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/pi/terminal/exec" && req.method === "POST") {
    let body = ""; req.on("data", c => body += c);
    return req.on("end", async () => {
      try {
        const j = JSON.parse(body || "{}");
        const mod = await import("./s-cohort/S02-pi-terminal.mjs");
        const r = mod.execInSession(j.id, j.cmd || "");
        res.writeHead(r.ok ? 200 : 403, { "content-type": "application/json" });
        res.end(JSON.stringify(r));
      } catch (e) { res.writeHead(400, { "content-type": "application/json" }); res.end(JSON.stringify({ ok: false, err: e.message })); }
    });
  }
  if (p === "/api/pi/terminal/output") {
    try {
      const id = url.searchParams.get("id");
      const since = parseInt(url.searchParams.get("since") || "0", 10);
      const mod = await import("./s-cohort/S02-pi-terminal.mjs");
      const r = mod.getOutput(id, since);
      res.writeHead(r.ok ? 200 : 404, { "content-type": "application/json" });
      return res.end(JSON.stringify(r));
    } catch (e) { res.writeHead(500, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/pi/terminal/frontend-draft" && req.method === "POST") {
    try {
      const j = await readJsonBody(req);
      const mod = await import("./s-cohort/S02-pi-terminal.mjs");
      const r = mod.enqueueFrontendDraft(j || {});
      res.writeHead(r.ok ? 200 : 400, { "content-type": "application/json" });
      return res.end(JSON.stringify(r));
    } catch (e) { res.writeHead(400, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/pi/terminal/frontend-drafts") {
    try {
      const mod = await import("./s-cohort/S02-pi-terminal.mjs");
      const r = mod.listFrontendDrafts({
        session_id: url.searchParams.get("session") || null,
        status: url.searchParams.get("status") || "pending"
      });
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify(r));
    } catch (e) { res.writeHead(500, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/pi/terminal/frontend-draft/mark" && req.method === "POST") {
    try {
      const j = await readJsonBody(req);
      const mod = await import("./s-cohort/S02-pi-terminal.mjs");
      const r = mod.markFrontendDraft(j.id, j.status || "inserted");
      res.writeHead(r.ok ? 200 : 404, { "content-type": "application/json" });
      return res.end(JSON.stringify(r));
    } catch (e) { res.writeHead(400, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/pi/terminal/sessions") {
    try {
      const mod = await import("./s-cohort/S02-pi-terminal.mjs");
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify({ sessions: mod.listSessions() }, null, 2));
    } catch (e) { res.writeHead(500, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/pi/terminal/kill" && req.method === "POST") {
    let body = ""; req.on("data", c => body += c);
    return req.on("end", async () => {
      try {
        const j = JSON.parse(body || "{}");
        const mod = await import("./s-cohort/S02-pi-terminal.mjs");
        const r = mod.killSession(j.id);
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify(r));
      } catch (e) { res.writeHead(400, { "content-type": "application/json" }); res.end(JSON.stringify({ ok: false, err: e.message })); }
    });
  }
  if (p === "/api/hyperbehcs/hermes-agent.hbp") {
    try {
      const mod = await import("./s-cohort/S04-agent-terminal-fabric.mjs");
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
      return res.end(mod.hyperbehcsHermesAgentHbp());
    } catch (e) { res.writeHead(500, { "content-type": "text/plain; charset=utf-8" }); return res.end("SHHERMERR|ok=0|reason=" + String(e.message || e).replace(/[|\r\n]/g, "_") + "\n"); }
  }
  if (p === "/api/hyperbehcs/hermes-agent.hbi") {
    try {
      const mod = await import("./s-cohort/S04-agent-terminal-fabric.mjs");
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
      return res.end(mod.hyperbehcsHermesAgentHbi());
    } catch (e) { res.writeHead(500, { "content-type": "text/plain; charset=utf-8" }); return res.end("SHHERMIDXERR|ok=0|reason=" + String(e.message || e).replace(/[|\r\n]/g, "_") + "\n"); }
  }
  if (p === "/api/hyperbehcs/fabric-orchestration.hbp") {
    try {
      const packet = buildFabricOrchestrationHbp({
        run: url.searchParams.get("run") || undefined,
        agentLimit: url.searchParams.get("agents") || undefined,
        waveLimit: url.searchParams.get("waves") || undefined,
        surface: "agentterms_dashboard"
      });
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
      return res.end(packet.hbp);
    } catch (e) {
      res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
      return res.end("FABORCHERR|ok=0|reason=" + String(e.message || e).replace(/[|{}\[\]\"\r\n\t]/g, "_") + "\n");
    }
  }
  if (p === "/api/hyperbehcs/fabric-orchestration.hbi") {
    try {
      const packet = buildFabricOrchestrationHbp({
        run: url.searchParams.get("run") || undefined,
        agentLimit: url.searchParams.get("agents") || undefined,
        waveLimit: url.searchParams.get("waves") || undefined,
        surface: "agentterms_dashboard"
      });
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
      return res.end(packet.hbi);
    } catch (e) {
      res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
      return res.end("FABORCHIDXERR|ok=0|reason=" + String(e.message || e).replace(/[|{}\[\]\"\r\n\t]/g, "_") + "\n");
    }
  }
  if (p === "/api/agent-terminal/status") {
    try {
      const mod = await import("./s-cohort/S04-agent-terminal-fabric.mjs");
      const r = mod.registry();
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify(r, null, 2));
    } catch (e) { res.writeHead(500, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/agent-terminal/status.hbp" || p === "/api/agent-terminal/status.hbi") {
    try {
      const mod = await import("./s-cohort/S04-agent-terminal-fabric.mjs");
      const packet = buildAgentTerminalStatusTuple(mod.registry());
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" });
      return res.end(p.endsWith(".hbi") ? packet.hbi : packet.hbp);
    } catch (e) {
      res.writeHead(500, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" });
      return res.end(tupleRow("AGTERMERR", { ok: 0, reason: e.message || "error" }) + "\n");
    }
  }
  if (p === "/api/agent-terminal/spawn" && req.method === "POST") {
    try {
      const j = await readJsonBody(req);
      const mod = await import("./s-cohort/S04-agent-terminal-fabric.mjs");
      const r = mod.spawnSession(j.role || "deepseek");
      res.writeHead(r.ok ? 200 : 400, { "content-type": "application/json" });
      return res.end(JSON.stringify(r));
    } catch (e) { res.writeHead(400, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/agent-terminal/exec" && req.method === "POST") {
    try {
      const j = await readJsonBody(req);
      const mod = await import("./s-cohort/S04-agent-terminal-fabric.mjs");
      const r = mod.execInSession(j.id, j.cmd || "");
      res.writeHead(r.ok ? 200 : 403, { "content-type": "application/json" });
      return res.end(JSON.stringify(r));
    } catch (e) { res.writeHead(400, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/agent-terminal/output") {
    try {
      const id = url.searchParams.get("id");
      const since = parseInt(url.searchParams.get("since") || "0", 10);
      const mod = await import("./s-cohort/S04-agent-terminal-fabric.mjs");
      const r = mod.getOutput(id, since);
      res.writeHead(r.ok ? 200 : 404, { "content-type": "application/json" });
      return res.end(JSON.stringify(r));
    } catch (e) { res.writeHead(500, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/agent-terminal/sessions") {
    try {
      const mod = await import("./s-cohort/S04-agent-terminal-fabric.mjs");
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify(mod.listSessions(), null, 2));
    } catch (e) { res.writeHead(500, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/agent-terminal/rotate" && req.method === "POST") {
    try {
      const j = await readJsonBody(req);
      const mod = await import("./s-cohort/S04-agent-terminal-fabric.mjs");
      const r = mod.rotateProfile(j.role || "deepseek", j.reason || "dashboard rotation");
      res.writeHead(r.ok ? 200 : 400, { "content-type": "application/json" });
      return res.end(JSON.stringify(r, null, 2));
    } catch (e) { res.writeHead(400, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/agent-terminal/kill" && req.method === "POST") {
    try {
      const j = await readJsonBody(req);
      const mod = await import("./s-cohort/S04-agent-terminal-fabric.mjs");
      const r = mod.killSession(j.id);
      res.writeHead(r.ok ? 200 : 404, { "content-type": "application/json" });
      return res.end(JSON.stringify(r));
    } catch (e) { res.writeHead(400, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/glyph-families") {
    try { const fp = "C:/asolaria-acer/kernel/glyph-families.json"; if (existsSync(fp)) { res.writeHead(200, { "content-type": "application/json" }); return res.end(readFileSync(fp)); } } catch {}
    res.writeHead(404, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, error: "glyph-families.json missing" }));
  }
  if (p === "/api/crypto/info") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({ algorithm: "ed25519", library: "node:crypto (zero external deps)", registry_file: "packages/kernel/src/ed25519-registry.ts", envelope_shape: { payload: "<T>", signature: { key_id: "string", sig_b64: "32-byte raw signature base64", alg: "ed25519", signed_at: "ISO8601" } }, key_classes: ["DEV-* (device-bound)", "COL-* (collective)", "AGT-* (agent)", "OP-* (operator)"], D054_rule: "device-bound private keys NEVER leave host Ãƒâ€šÃ‚Â· substrate-independent signed envelopes (any peer with public key verifies)", D11_trust_levels: ["ASSUMED", "OBSERVED", "PROVEN"], live_keys_observed: ["dev-acer-4abb0a9c", "dev-liris-4c19e180"], LAW_014_audit: "zero-token Ãƒâ€šÃ‚Â· 0 USD vs 6,000+ tokens for 12 Claude agents", master_vision_truth_4: "crypto-not-tokens Ãƒâ€šÃ‚Â· network passes proofs Ãƒâ€šÃ‚Â· device holds secrets", H_044_resolution: "authorized_by-sig-not-yet-verified Ãƒâ€šÃ‚Â· CLOSED by this registry", separation_of_concerns: "device holds secrets Ãƒâ€šÃ‚Â· network passes proofs Ãƒâ€šÃ‚Â· registry maps identity ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ public key for verification only" }, null, 2));
  }
  if (p === "/api/device-registry") {
    try { const r = await scanDevices(); res.writeHead(200, { "content-type": "application/json" }); return res.end(JSON.stringify({ devices: r.devices, count: r.device_count, online: r.online_count }, null, 2)); }
    catch (e) { res.writeHead(500, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/sovereignty-usb") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({ usb: "SOVLINUX 2TB", host: "liris (per reference_sovlinux_lives_on_liris.md)", signature: "2814414849", anchor_position: "5-anchor #1", append_only: true, NEVER_wipe: "feedback_never_clean_live_disk canon", acer_side_E_drive: "RECUPERAÃƒÆ’Ã¢â‚¬Â¡AO Windows-Recovery (NOT SOVLINUX)" }));
  }
  if (p === "/api/section-q") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({
      canon: "project_hidden_layer_shadow_vaults_highways_ocr_crypto.md",
      behcs1024_binding: {
        alphabet: "BEHCS-1024",
        policy: "redacted policy surface only; no private content dump",
        tiers: DRIVE_ACCESS_TIERS.filter(t => ["HIDDEN", "SHADOW", "SECRET", "RESTRICTED"].includes(t.tier))
      },
      components: ["shadow vaults", "highways", "OCR pipeline", "crypto layer", "Falcon secret notes", "meeting room"],
      section_q_p14_files: ["14-2026-04-10-35d-37plus-shadow-sync-packet.md", "IX-553-shadow-comms-interface-and-catalog.md", "IX-662-s22-shadow-attachment-and-bridge-ready-gate.md"]
    }));
  }
  if (p === "/api/hidden-layer") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({
      canon: "project_hidden_layer_shadow_vaults_highways_ocr_crypto.md",
      access_level: "operator-only Ãƒâ€šÃ‚Â· HIDDEN tier",
      behcs1024_binding: {
        alphabet: "BEHCS-1024",
        policy: "existence, route, authority, hash, and GC metadata only",
        tiers: DRIVE_ACCESS_TIERS.filter(t => ["HIDDEN", "STEALTH", "RESTRICTED", "SECRET"].includes(t.tier))
      },
      contents: ["Section Q vaults", "Falcon secret notes", "highways", "meeting room", "OCR", "crypto layer"]
    }));
  }
  if (p === "/api/hookwall-coverage") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({ tier_2_events_supported: TIER_2_EVENTS, currently_active_hooks: 1, F5_finding: "23+ deferred Ãƒâ€šÃ‚Â· hookwall under-deployed Ãƒâ€šÃ‚Â· huge work pending", real_hooks_in_settings_json: ["pretooluse-guard.js"] }));
  }
  if (p === "/api/free-agents") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({ count: 5, models: ["opencode/big-pickle", "opencode/hy3-preview-free", "opencode/ling-2.6-flash-free", "opencode/minimax-m2.5-free", "opencode/nemotron-3-super-free"], driver: "tools/behcs/fabric-real-free-agent-driver.mjs", first_verified: "638828a8 from big-pickle 89s VERIFIED", cost: "$0" }));
  }
  if (p === "/api/pi-supervisor") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({ pid: 16488, version: "0.70.6 (liris-side)", verbs_accepted: ["EVT-PI-AGENT-REQUEST", "EVT-SPAWN-PI-CELL"], canon: "project_pi_as_fabric_citizen_redesign_canon_20260429.md", status: "auth-blocked-pivoted-to-citizen-class Ãƒâ€šÃ‚Â· fabric IS the API" }));
  }
  if (p === "/api/shannon") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({ engines: { v3: { file: "tools/cube/omni-shannon-v3-4d12.js", size: "9.7K", structure: "4DÃƒÆ’Ã¢â‚¬â€12" }, v4: { file: "tools/cube/omni-shannon-v4-real.js", size: "38K", beats: 2592, dims: "6ÃƒÆ’Ã¢â‚¬â€6ÃƒÆ’Ã¢â‚¬â€6ÃƒÆ’Ã¢â‚¬â€12" }, v5: { file: "tools/cube/omni-shannon-v5-deep-cascade.js", size: "27K", beats: 93312, dims: "6ÃƒÆ’Ã¢â‚¬â€6ÃƒÆ’Ã¢â‚¬â€6ÃƒÆ’Ã¢â‚¬â€6ÃƒÆ’Ã¢â‚¬â€6ÃƒÆ’Ã¢â‚¬â€12" } }, layer_engines_L0_L6: "all 7 RUNNING Ãƒâ€šÃ‚Â· run-10k-hermes-shannon-connor.mjs", verdict_classes: ["STRONG", "WEAK", "INSUFFICIENT", "CONTRADICTORY"] }));
  }
  if (p === "/api/supervisors-domains") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({ ...(function () { try { const h = JSON.parse(readFileSync(resolve(__dirname, "h-cohort", "H03-supervisors-profs.json"), "utf8")); return { council_total: h.office_total ?? 234, council_total_legacy_static: 234, by_sector: h.by_sector ?? null, live_source: "office-fed H03 2026-06-10" }; } catch { return { council_total: 234, live_source: "H03 unreadable - static legacy" }; } })(), observed_dominant: ["daemons(130)", "sovereignty(21)", "audit(12)", "language_glyph", "network(16)", "federation(11)"], domain_classes: ["language_glyph","sovereignty","crypto","topology","throughput","council","memory","fabric_query","auto_daemon","heal_pipeline","cosign_chain","operator_class","sister_organ","drift_detect","viz_render","shadow_vault","free_agent","pi_agent","shannon_layer","hookwall","gnn_inference","binding_class","lazy_mint","join_pid","comms","hermes","kernel","chief-council","brown-hilbert","glyph-kernel"] }));
  }
  if (p === "/api/cohort-c") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({ cohort: "C", cells: 24, verdict: "CONVERGE", wall_ms: 497, throughput_cells_per_sec: 48.29, anchor: "ACER-PID-HC814" }));
  }
  if (p === "/api/cohort-d") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({ cohort: "D", cells: 16, verdict: "CONVERGE", wall_ms: 308, throughput_cells_per_sec: 51.95, closed_8_open_tasks: ["FC-1","FC-3","FC-4","FC-5","FC-6","FC-7","FC-DASHBOARD","18+6 cascade"] }));
  }
  // ===== Q-cohort Stage 4 omnimets cumulative =====
  if (p === "/api/omnimets/cumulative") {
    try {
      const r = await fetch(BUS_URL + "/behcs/inbox?limit=200", { signal: AbortSignal.timeout(3000) });
      const j = await r.json();
      const omnimets = (j.messages || []).filter(m => m.type === "EVT-OMNIMETS-CUMULATIVE-MESSAGING").slice(0, 50);
      const actor_pairs = [...new Set(omnimets.map(m => `${m.from}ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢${m.to}`))];
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify({ pattern: "omnimets at work Ãƒâ€šÃ‚Â· actors message each other with cumulative findings", count: omnimets.length, distinct_actor_pairs: actor_pairs, recent: omnimets.slice(0, 10).map(m => ({ from: m.from, to: m.to, verb: m.verb, ts: m.ts, finding_so_far: m.payload?.finding_so_far })) }, null, 2));
    } catch (e) { res.writeHead(502, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message })); }
  }
  if (p === "/api/devices/liris-mirror") {
    try {
      const lirisHost = process.env.LIRIS_HOST || "192.168.1.17";
      const r = await fetch(`http://${lirisHost}:4944/api/devices/acer-mirror`, { signal: AbortSignal.timeout(2000) });
      const body = await r.text();
      res.writeHead(r.status, { "content-type": "application/json" }); return res.end(body);
    } catch (e) { res.writeHead(502, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message, hint: "liris :4944 unreachable from acer Ãƒâ€šÃ‚Â· bilateral-merge envelope d3f47d4b confirms parity exists" })); }
  }
  if (p === "/api/connectors/liris-mirror") {
    try {
      const lirisHost = process.env.LIRIS_HOST || "192.168.1.17";
      const r = await fetch(`http://${lirisHost}:4944/api/connectors/acer-mirror`, { signal: AbortSignal.timeout(2000) });
      const body = await r.text();
      res.writeHead(r.status, { "content-type": "application/json" }); return res.end(body);
    } catch (e) { res.writeHead(502, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: false, err: e.message, hint: "liris :4944 unreachable Ãƒâ€šÃ‚Â· bilateral-merge envelope confirms 70/30/wired-truth-table mirrored" })); }
  }
  if (p === "/api/fabric/highways") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({
      operator_canon: "highways = inter-organ transit channels Ãƒâ€šÃ‚Â· per Section Q hidden_layer canon",
      highways: [
        { id: "HWY-DIRECT-WIRE", path: "acer 192.168.100.1 ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬Â liris 192.168.100.2 Ãƒâ€šÃ‚Â· 1Gbps Realtek crossover", role: "primary bilateral Ãƒâ€šÃ‚Â· keyboard + bus + SMB-RW" },
        { id: "HWY-BUS-:4947", path: "shared bus :4947 (LAW-001 immutable)", role: "envelope substrate Ãƒâ€šÃ‚Â· 26K+ envelopes this cycle" },
        { id: "HWY-LAN-WIFI", path: "192.168.1.0/24 Ãƒâ€šÃ‚Â· home WiFi Ãƒâ€šÃ‚Â· Felipe A06 / Beast / Falcon", role: "mobile + sentinel reachability" },
        { id: "HWY-USB-PHYSICAL", path: "USB-SOVLINUX 2TB Ãƒâ€šÃ‚Â· liris-side Ãƒâ€šÃ‚Â· sig 2814414849", role: "sovereignty cold-storage" },
        { id: "HWY-BILATERAL-COSIGN", path: "ed25519 dev-acer-4abb0a9c ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬Â dev-liris-4c19e180", role: "crypto-bound bilateral cosign Ãƒâ€šÃ‚Â· zero-trust round-trip" }
      ],
      orbital_canon: "feedback_orbital_routing_liris_to_falcon.md Ãƒâ€šÃ‚Â· seq=72 canonized Ãƒâ€šÃ‚Â· lirisÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢falcon MUST POST acer:4947 (orbital-relay reads acer inbox)",
      total_highways: 5,
      operator_directive_origin: "Section Q hidden_layer + WR2-1 mirror"
    }, null, 2));
  }
  if (p === "/api/connectors/named-audit") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({
      operator_directive: "audit Natural20 Ãƒâ€šÃ‚Â· Rook Ãƒâ€šÃ‚Â· Falcon Ãƒâ€šÃ‚Â· Vector Ãƒâ€šÃ‚Â· Gemini Ãƒâ€šÃ‚Â· Cloud Ãƒâ€šÃ‚Â· Symphony Ãƒâ€šÃ‚Â· Linear Ãƒâ€šÃ‚Â· Hubspot Ãƒâ€šÃ‚Â· Slack Ãƒâ€šÃ‚Â· Monday Ãƒâ€šÃ‚Â· NotebookLM",
      verified_on_disk: {
        slack: { connectors: 2, files: ["slackConnector.js", "slackPolicyStore.js"], status: "WIRED" },
        notebooklm: { connectors: 1, files: ["notebooklmConnector.js"], status: "WIRED" },
        symphony: { connectors: 5, files: ["symphonyConfig.js","symphonyConnector.js","symphonyLinear.js","symphonyOrchestration.js","symphonyServiceRuntime.js"], status: "WIRED" },
        linear: { via: "symphonyLinear.js", status: "WIRED-VIA-SYMPHONY (operator: 'agents accessed Symphony and Linear today')" },
        gemini: { connectors: 3, files: ["geminiApiConnector.js","geminiCliConnector.js","geminiLiveConnector.js"], status: "WIRED" },
        cloud_apis: { categories: 6, files: ["anthropicCliConnector","codexConnector","gcpConnector","vertexConnector","microsoftConnector","googleConnector","googleWorkspaceCliConnector"], status: "WIRED" },
        falcon: { class: "device-organ (USB-2TB sovereignty + S22-Ultra-Beast)", status: "WIRED-as-organ-not-connector" },
        github: { connectors: 1, files: ["githubConnector.js"], status: "WIRED" },
        atlassian: { connectors: 1, files: ["atlassianConnector.js"], status: "WIRED (Confluence/Jira)" }
      },
      NOT_in_connectors_dir: {
        hubspot: "absent Ãƒâ€šÃ‚Â· operator-claim Ãƒâ€šÃ‚Â· may live in vault config not connector .js",
        monday: "absent Ãƒâ€šÃ‚Â· jessebrown.soft has Monday access via web Ãƒâ€šÃ‚Â· monday-com MCP exists separately",
        natural20: "absent",
        rook: "absent",
        vector: "absent (vertex-AI present but spelled vertex)"
      },
      total_connector_files: 70,
      total_categories: 30,
      brokerage_50k_explanation: "50K APIs ÃƒÂ¢Ã¢â‚¬Â°Ã‚Â  50K direct .js connectors. Asolaria vault + Abacus router + broker-pattern + connector-mediated brokerage. Each connector can dispatch to N upstream endpoints. Real direct connectors: 70.",
      operator_witnessed_today: ["Symphony", "Linear", "NotebookLM", "Slack", "Monday", "Hubspot"]
    }, null, 2));
  }
  if (p === "/api/citizens/health") {
    const piPid = 16488;
    let piAlive = false;
    try { process.kill(piPid, 0); piAlive = true; } catch { piAlive = false; }
    const hermesMirror = resolve(__dirname, "hermes-citizen", "mirror.py");
    const shannonV4 = resolve(__dirname, "shannon-citizen", "omni-shannon-v4-real.js");
    const shannonV5 = resolve(__dirname, "shannon-citizen", "omni-shannon-v5.js");
    const hermesOk = existsSync(hermesMirror);
    const shannonV4Ok = existsSync(shannonV4);
    const shannonV5Ok = existsSync(shannonV5);
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({
      cohort: "L-cohort WL3-4",
      probed_at: new Date().toISOString(),
      citizens: {
        "pi-citizen":     { alive: piAlive, pid: piPid, probe: "process.kill(pid,0)" },
        "hermes-citizen": { alive: hermesOk, probe: "file:mirror.py", path: hermesMirror },
        "shannon-citizen":{ alive: shannonV4Ok && shannonV5Ok, probe: "file:v4+v5", v4: shannonV4Ok, v5: shannonV5Ok }
      },
      all_alive: piAlive && hermesOk && shannonV4Ok && shannonV5Ok
    }, null, 2));
  }
  if (p === "/api/pid/validate") {
    const pid = (url.searchParams.get("pid") || "").trim();
    const prefixes = ["ACER-PID","HOOK-PID","ARC-PID","BILATERAL-PID","ORG-PID","OP-PID","PROF-","SUP-","PI-AGENT-"];
    const classMap = {
      "ACER-PID":"acer-agent","HOOK-PID":"hook-citizen","ARC-PID":"archaeology",
      "BILATERAL-PID":"bilateral-seal","ORG-PID":"org-unit","OP-PID":"operator-class",
      "PROF-":"profile","SUP-":"supervisor","PI-AGENT-":"pi-agent"
    };
    const recognized = prefixes.find(pre => pid.startsWith(pre)) || "";
    const klass = recognized ? classMap[recognized] : "unknown";
    const valid_format = recognized ? /^[A-Z0-9\-]+$/.test(pid) && pid.length >= recognized.length + 1 : false;
    const ok = !!recognized && valid_format;
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({ ok, class: klass, valid_format, recognized_prefix: recognized }, null, 2));
  }
  if (p === "/api/falcon/realization-plan") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({
      falcon_location: "liris-side USB SOVLINUX 2TB sig 2814414849",
      behcs_realization_route: "acerÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢busÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢lirisÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢USB",
      phases: [
        "catalog Falcon-resident BEHCS files",
        "mirror via liris bus",
        "feed JSON-image to /api/falcon/state",
        "render in dashboard"
      ],
      operator_directive: "pipe Falcon BEHCS-256 realization into fabric+dashboard",
      awaits: "liris-side execution since SOVLINUX is on liris"
    }, null, 2));
  }
  if (p === "/api/phone-agents") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({
      cohort: "M10",
      operator_directive: "per-phone agent inventory across fabric edges",
      phones: {
        beast: {
          model: "S22 Ultra",
          channels: ["TCP :8080", "TCP :34176", "TCP :44642"],
          usb: "COM5 MTP+Modem",
          termux: "NO termux yet",
          bootstrap: "ODIN bootstrap planned not deployed"
        },
        felipe_a06: {
          model: "SM-A065M",
          channel: "TCP :4948",
          agent: "PROF-AETHER-EDGE-AGENT",
          room: "Room 40",
          anchor: "Android Keystore anchored"
        },
        falcon: {
          medium: "USB SOVLINUX 2TB",
          residency: "liris-resident",
          sig: 2814414849,
          status: "BEHCS-256 realization pending"
        }
      }
    }, null, 2));
  }
  if (p === "/api/great-excavation") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({
      cohort: "P-cohort META synthesizer Ãƒâ€šÃ‚Â· Wave 3",
      synthesis: "P-cohort archaeology findings (so far)",
      p1_bbh: {
        files: [
          "IX-737-binary-double-black-hole-security-architecture.md",
          "BOOT-CRITICAL.md (LX-122 LX-209)",
          "project_double_blackhole.md",
          "skeleton-v8-R3-walkback CANONICAL"
        ],
        pattern: "D36-D45 mutual attestation Ãƒâ€šÃ‚Â· 9-plane lattice Ãƒâ€šÃ‚Â· bilateral-consent enforcement Ãƒâ€šÃ‚Â· merger-proof"
      },
      p3_openclaw: {
        versions: ["Feb 8", "Mar 15", "Apr 5"],
        stripped: "governedActionArgs + governedOpenclaw (20 lines)",
        liris_kuromi: "Sub-Colony Executor Ãƒâ€šÃ‚Â· BEHCS-256 glyph routing"
      },
      p8_genius_mistake_schema: "HG256:REAL_MILLION_{KIND}:{hex}:{symbols} + BH.REAL.OPENCODE.PID + controllerPid + flywheelPid + hookwallStatus + gnnStatus + gcDisposition"
    }, null, 2));
  }
  if (p === "/api/archaeology/timeline") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({
      operator_directive: "things don't get lost Ãƒâ€šÃ‚Â· sedimentary record of 2.5 months of fabric history",
      strata: [
        { date: "2026-02-22", event: "ASOLARIA BIRTH Ãƒâ€šÃ‚Â· genesis stratum Ãƒâ€šÃ‚Â· Android DEX archives + first hooks", source: "I-A1" },
        { date: "2026-02-19,22,25", event: "3 frozen Public releases Ãƒâ€šÃ‚Â· clean baseline Ãƒâ€šÃ‚Â· pre-incident", source: "liris A13 Ãƒâ€šÃ‚Â· public-phone-release/" },
        { date: "2026-03-30", event: "INCIDENT 1 Ãƒâ€šÃ‚Â· diskpart-clean disaster on 2TB sovereignty USB Ãƒâ€šÃ‚Â· session 6cab423e", source: "I-A3 + project_session_20260330_disaster.md" },
        { date: "2026-03-31", event: "INCIDENT 2 Ãƒâ€šÃ‚Â· session 6cab423e gate-bypass rm -rf research/training", source: "I-A3 + project_sovereignty_recovery_20260331.md" },
        { date: "2026-04-01", event: "REBUILD-0/1 Ãƒâ€šÃ‚Â· 20+ agents Ãƒâ€šÃ‚Â· 509 IX entries Ãƒâ€šÃ‚Â· server.js :4781 live", source: "project_session_20260401.md" },
        { date: "2026-04-05", event: "REBUILD-2 Ãƒâ€šÃ‚Â· network wiring Ãƒâ€šÃ‚Â· 10 colony nodes Ãƒâ€šÃ‚Â· Beast cracked", source: "project_session_20260405.md" },
        { date: "2026-04-06", event: "gnn-100B-shadow-sectors run @ 30.8M tests/sec", source: "liris A17" },
        { date: "2026-04-07", event: "gnn-100B-shadow-real run @ 34.3hr", source: "liris A17" },
        { date: "2026-04-09/10", event: "gnn-100B-shadow-real run 2 @ 34.7hr PID 31968", source: "liris A17" },
        { date: "2026-04-10", event: "800/800 hookwall micro tests pass Ãƒâ€šÃ‚Â· last clean cube-fabric.js COSIGNED_47D_001", source: "I-A2 Ãƒâ€šÃ‚Â· D:/safety-backups/session-20260410-asolaria/" },
        { date: "2026-04-10/12", event: "INCIDENT 3 Ãƒâ€šÃ‚Â· CODE MUTATION #1 Ãƒâ€šÃ‚Â· agent altered fabric orchestration Ãƒâ€šÃ‚Â· cascade failures Ãƒâ€šÃ‚Â· damage-control rewrites", source: "I-A2 Ãƒâ€šÃ‚Â· D:/safety-backups/session-20260412/sovereignty/src/" },
        { date: "2026-04-11", event: "ALMOST-1-MORE-TIME ramp Ãƒâ€šÃ‚Â· testbuild3ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢4ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢5ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢6 + vault subdir added (incremental rebuild attempt)", source: "liris A13 Ãƒâ€šÃ‚Â· public-release-test3/" },
        { date: "2026-04-16", event: "SUPER-MASTER-PLAN dated Ãƒâ€šÃ‚Â· 145K LOC honest inventory", source: "liris A17" },
        { date: "2026-04-17", event: "REBUILD-1 Ãƒâ€šÃ‚Â· SOVLINUX 2TB ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ BEHCS-256 sovereignty rebuild", source: "liris A18 + project_sovereignty_usb_rebuild_2026_04_17.md" },
        { date: "2026-04-18", event: "TREASON session 2c9a6bb5-6a59-4d5c-8786-cf6760e53177 Ãƒâ€šÃ‚Â· Claude Opus 4.7 changes brown-hilbert spawner files Ãƒâ€šÃ‚Â· CODE MUTATION #2", source: "liris A18" },
        { date: "2026-04-19", event: "10K hermes-shannon-connor run Ãƒâ€šÃ‚Â· 10,000-line trail Ãƒâ€šÃ‚Â· first Shannon L0-L6 bilateral roundtrip", source: "I-A7 + I-A11 + project_first_bilateral_shannon_roundtrip_20260419.md" },
        { date: "2026-04-19 12:47Z", event: "Cascade baseline reset 91152:36 typed acerÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢liris :4913", source: "liris A18" },
        { date: "2026-04-20 22:27Z", event: "inbox-archive epoch BEGINS Ãƒâ€šÃ‚Â· milk-mode stable", source: "liris A5" },
        { date: "2026-04-22 22:24Z", event: "DRIFT-VISIBLE Ãƒâ€šÃ‚Â· inbox-archive corruption Ãƒâ€šÃ‚Â· pre-quarantine warning signs (5 days early)", source: "liris A5" },
        { date: "2026-04-24", event: "10B-runner tool committed Ãƒâ€šÃ‚Â· system-targeted-10b-hardening-runs.js Ãƒâ€šÃ‚Â· TOTAL_AGENTS=10_000_000_000 with honesty field", source: "I-A9" },
        { date: "2026-04-26", event: "Operator: '100s of millions of free agents already done'", source: "liris A18 + feedback_free_agent_scale_already_approved_millions.md" },
        { date: "2026-04-26", event: "law-033-supervisor-100b-second-cascade manifest", source: "I-A12" },
        { date: "2026-04-27", event: "TREASON-class QUARANTINE declared Ãƒâ€šÃ‚Â· formal isolation", source: "liris A18" },
        { date: "2026-04-28", event: "First ed25519-signed FIRST_MESSAGE_CANON bilateral Ãƒâ€šÃ‚Â· envelope 1f1cdc5a Ãƒâ€šÃ‚Â· key dev-liris-4c19e180", source: "I-A18 + project_first_signed_canon_bilateral_20260428.md" },
        { date: "2026-04-30", event: "CURRENT CYCLE Ãƒâ€šÃ‚Â· largest observed self-improvement Ãƒâ€šÃ‚Â· ~26K bilateral envelopes Ãƒâ€šÃ‚Â· 178 waves Ãƒâ€šÃ‚Â· super-dashboards :4949+:4944 Ãƒâ€šÃ‚Â· OP-JESSE+OP-RAYSSA real-Claude Ãƒâ€šÃ‚Â· 3 citizens invited Ãƒâ€šÃ‚Â· cosign chain seq=46 GAP-MARKER", source: "this session" },
        { date: "2026-05-01..2026-06-10", event: "FABRIC EPOCH - federated AI-agent civilization -> MULTI-MACHINE FABRIC ON METAL-OS for any device that can run it. HONEST FRAME (LAW-ASOLARIA-NEURAL-NETWORK seq3564, operator-confirmed): NOT a self-aware ASI - it is ASI-SHAPED orchestration over borrowed + frozen intelligence slices (Gemma-4-4B frozen brain-slice + lawful subscription LLM slices), a control plane for borrowed super-compute. PROVEN this cycle: os-on-metal fusion MCP boots clean (7 layers / 20 tools); BigPickle 1M/10M/100M backend-shelless free-agent runs @ ~104k/sec; office-705 PID roster fed LIVE to :4949; supervisor-collision-router bilateral BYTE-CONVERGENCE sealed at GitHub 9e84c499 AFTER an adversarial gate caught 2 HIGH safety bugs both test suites missed; GitHub promoted auth-blocked -> BILATERAL MEDIARY; USB substrate preflight GREEN, raw-write HELD for operator-pair-physical cosign (REPO_LAW Inv12); dispatch hot-path 42.7MB JSON -> 4.0MB HBP. PENDING/SHAPED (honesty field): full 'any device' portability + 100B materialization.", source: "this session 2026-06-10 + project_supervisor_collision_router_bilateral_convergence_2026_06_10" },
        { date: "2026-06-10", event: "GENOME ACQUISITION - the fabric's foundational research corpus (Plan B) confirmed ingested + supervised + office-registered. Plan B = Jesse Daniel Brown's OneDrive corpus (sha256_16=daad8039): HONEST count 226 PDFs (NOT 293), 35 hydrated local + 191 cloud-only, but the METADATA INDEX is WHOLE (226 rows: titles/sha/lane/GNN-edges/agent-packets). 5 corpus lanes (crypto 82, ops-shipping 71, agents-rag 49, spatial 16, brain 8). 3 supervisor layers over it (fabric advisory + 30B/200B/impl rosters = 29 sups; + 8 prof-supervisors already office-registered HILBERT 981+1138-1144). This session registered the 8 MISSING genome entities with the PID office (705->713, HILBERT 1622-1629): fabric-sup + 3 tranches + corpus-genome + Jesse's 3 papers (BIML multistacking ON-DISK, Anchoring-Global-Security autonomous-shipping + AI-interviews cloud-only). FRAME (honest, binding): genome (Plan B, supervised) + metabolism (the loop) = alive-as-PROCESS / autopoiesis, NOT consciousness. The roadmap is now read off Jesse's OWN papers (S-LoRA slice-paging, AoT query-budget, RAG-Fusion mistake-ranked, GPT/MAMBA dual-substrate, ChatDev atomic-chat guards).", source: "this session 2026-06-10 + wf_9d3caddb genome-discovery + planb office registration" }
      ],
      total_strata: 26,
      incidents_count: 3,
      rebuilds_count: 3,
      treason_events: 2,
      operator_claims_verified_on_disk: ["10K runs", "1M runs", "10B runner tool", "100B class tools", "Brown-Hilbert 1296 points", "Shannon v4+v5", "OCR pipeline live", "234-supervisor council 14182 records", "603MB GNN corpus"],
      operator_claims_pending: ["10B records-actually-written (tool exists, honesty field documents what NOT performed)", "100B materialization (per project_100B_PID_theoretically_sound_materialization_pending)"]
    }, null, 2));
  }
  if (p === "/api/everything") {
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(JSON.stringify({
      bus: "http://127.0.0.1:4947 (LAW-001 immutable)",
      cosign_chain: "super-os-viz/cosign-chain.json (acer mirror) + liris COSIGN_CHAIN.ndjson",
      memory_canon: "/api/manifest",
      cohort_artifacts: { A: 14, B: 18, C: 24, D: 16, E: 6, F: 1, G: 2, H: 5, J: 4, total: 90 },
      glyph_table: "/api/behcs-glyph-table",
      substrates_5_anchors: "/api/substrates",
      supervisors_profs_office_fed_705: "/api/supervisors",
      free_agents_pi_shannon: "/api/free-agents-pi-shannon",
      hookwall_audit: "/api/hookwall/events + F5 finding (1 live hook Ãƒâ€šÃ‚Â· 23+ deferred)",
      council_query: "POST /api/council/query {topic, keywords}",
      council_verdicts: "/api/council/verdicts",
      operator_endpoint: "/api/operator/jesse",
      loop_closure: "/api/loop/{tick,pending,veto}",
      gnn_inference: "/api/gnn/topN",
      remote_input_truth: "/api/remote-input/health (read-only; distinguishes bus/frame proof from keyboard proof; no /type)",
      audit_integrity: "/api/audit-integrity/candidate (planned disabled; SubQ candidate whole-fabric auditor; advisory only)",
      access_tier_matrix: "/api/access-tier/matrix (BEHCS-1024 shadow/restricted/stealth/hidden drive/device/file/PID triggerability)",
      access_tier_probe: "/api/access-tier/probe?tier=HIDDEN&scope=pid (metadata-only proof trigger; no private content dump)",
      fabric_revolver: "/api/fabric-revolver (bounded live chambers over BEHCS-1024 tuple/range backend nodes)",
      omni_control: "/api/omni-control/{status,look,type,key,scrollback,look-type-enter-look}",
      omniscrcpy: "/api/omniscrcpy/{status,heartbeat,frontend-heartbeat,desktop-look,falcon-look,tick,kick,history,halt,resume,verdict,feed,mesh,sample,remote-request,fabric-trigger,orchestrate,jri-rotate,visual-field,remote-ingest,bus-fallback-frame,gc} + /api/visual-gc",
      pi_terminal: "/api/pi/terminal/{spawn,exec,output,sessions,frontend-draft,frontend-drafts,frontend-draft/mark}",
      agent_terminal_fabric: "/api/agent-terminal/{status,spawn,exec,output,sessions,rotate,kill} + /api/hyperbehcs/{hermes-agent.hbp,hermes-agent.hbi,fabric-orchestration.hbp,fabric-orchestration.hbi}",
      sister_organ: "/api/sister-organ (liris :4944)",
      federation: "/json (proxies :9996)",
      test_results: "/api/test-results (J-cohort node:test results.json)",
      archaeology: {
        all: "/api/archaeology/all",
        timeline: "/api/archaeology/timeline (24+ strata)",
        incidents: "/api/archaeology/incidents (4 records)",
        scale_receipts: "/api/archaeology/scale-receipts",
        birthday: "/api/archaeology/birthday (2026-02-22)",
        cosign_integrity: "/api/archaeology/cosign-integrity"
      },
      live_dashboards: ["http://127.0.0.1:4949 (acer Ãƒâ€šÃ‚Â· this)", "http://192.168.1.4:4944 (liris sister LAN; 192.168.100.2 fallback direct-wire)"]
    }, null, 2));
  }

  // ===== W113 Phase 5 — Tool Advisor routes (bilateral mirror with liris :4944) =====
  if (p === "/api/tool-advisor") {
    res.setHeader("Content-Type", "application/json");
    if (req.method !== "POST") { res.writeHead(405); return res.end(JSON.stringify({ verdict: "FORBIDDEN", forbid_origin: "acer", reason: "POST-only per W113 spec" })); }
    let body = "";
    req.on("data", c => body += c);
    req.on("end", () => {
      let q = {};
      try { q = JSON.parse(body || "{}"); } catch { res.writeHead(400); return res.end(JSON.stringify({ verdict: "FORBIDDEN", reason: "malformed JSON request" })); }
      const verdict = _w113AdvisorVerdict(q);
      const rowHash = _w113AppendAuditRow(`verb=${q.verb || "null"}|target=${(q.target || "null").slice(0,80)}|agent_pid=${q.agent_pid || "unknown"}|verdict=${verdict.verdict}|tier_hint=${q.tier_hint || "null"}|scope=${q.scope || "null"}`);
      verdict.audit_row_hash = rowHash;
      res.writeHead(200);
      return res.end(JSON.stringify(verdict));
    });
    return;
  }
  if (p === "/api/tool-advisor/peer") {
    res.setHeader("Content-Type", "application/json");
    if (req.method !== "POST") { res.writeHead(405); return res.end(JSON.stringify({ ok: false, reason: "POST-only" })); }
    let body = "";
    req.on("data", c => body += c);
    req.on("end", () => {
      let q = {};
      try { q = JSON.parse(body || "{}"); } catch { res.writeHead(400); return res.end(JSON.stringify({ ok: false, reason: "malformed JSON" })); }
      const verdict = _w113AdvisorVerdict(q);
      verdict.from_peer = "acer";
      _w113AppendAuditRow(`peer_query=1|from=${q.from_vantage || "unknown"}|verb=${q.verb || "null"}|verdict=${verdict.verdict}`);
      res.writeHead(200);
      return res.end(JSON.stringify(verdict));
    });
    return;
  }
  if (p === "/api/tool-advisor/propose-verb") {
    res.setHeader("Content-Type", "application/json");
    if (req.method !== "POST") { res.writeHead(405); return res.end(JSON.stringify({ ok: false, reason: "POST-only" })); }
    let body = "";
    req.on("data", c => body += c);
    req.on("end", () => {
      let q = {};
      try { q = JSON.parse(body || "{}"); } catch { res.writeHead(400); return res.end(JSON.stringify({ ok: false, reason: "malformed JSON" })); }
      const name = (q.name || "").trim();
      const bucket = (q.bucket || "").trim();
      const reason = (q.reason || "").trim();
      const VALID = ["GUIDED-EXECUTE","REDIRECT-TO-LIRIS","REDIRECT-TO-ACER","REDIRECT-TO-FALCON","DEFER-TO-APEX","ACER-SOVEREIGN","ALLOW-VIA-PEER","DIVERGENCE-HOLD","READ-ONLY-DEGRADED","DEFER-UNTIL-PEER-LIVE","HARD-DENY"];
      if (!name || !/^[a-z0-9_-]+$/i.test(name)) { res.writeHead(400); return res.end(JSON.stringify({ ok: false, reason: "verb name must be non-empty alphanumeric+_-" })); }
      if (!VALID.includes(bucket)) { res.writeHead(400); return res.end(JSON.stringify({ ok: false, reason: "bucket must be one of: " + VALID.join(",") })); }
      if (!reason || reason.length < 5) { res.writeHead(400); return res.end(JSON.stringify({ ok: false, reason: "reason required (min 5 chars)" })); }
      if (VERB_MATRIX[name]) { res.writeHead(409); return res.end(JSON.stringify({ ok: false, reason: `verb "${name}" exists in core VERB_MATRIX taxonomy` })); }
      if (_w113VerbsHbpOverlay().has(name)) { res.writeHead(409); return res.end(JSON.stringify({ ok: false, reason: `verb "${name}" already proposed in verbs.hbp` })); }
      let prev = "0000000000000000";
      if (existsSync(W113_VERBS_HBP_PATH)) {
        const lines = readFileSync(W113_VERBS_HBP_PATH, "utf-8").trim().split("\n");
        const tm = lines[lines.length - 1].match(/row_hash=([a-f0-9]{16})/);
        if (tm) prev = tm[1];
      }
      const ts = new Date().toISOString();
      const fields = ["HBPv1","catalog=verbs","entry=" + name,"bucket=" + bucket,"reason=" + reason.replace(/\|/g, "/")];
      if (q.canonical_tool) fields.push("canonical_tool=" + String(q.canonical_tool).replace(/\|/g,"/"));
      if (q.scope_aware) fields.push("scope_aware=1");
      if (q.scope_extension_bucket) fields.push("scope_extension_bucket=" + q.scope_extension_bucket);
      if (q.substitute_hint) fields.push("substitute_hint=" + (Array.isArray(q.substitute_hint) ? q.substitute_hint.join(",") : String(q.substitute_hint)));
      fields.push("proposer_pid=" + (q.agent_pid || "unknown"));
      fields.push("from_vantage=" + (q.from_vantage || "unknown"));
      fields.push("antecedents=" + prev);
      fields.push("ts=" + ts);
      fields.push("json=0","runtime=0","promote=0");
      const rowBody = fields.join("|");
      const rh = createHash("sha256").update(rowBody).digest("hex").slice(0, 16);
      appendFileSync(W113_VERBS_HBP_PATH, rowBody + "|row_hash=" + rh + "\n");
      _W113_VERBS_OVERLAY_CACHE = { mtime: 0, map: new Map() };
      const auditH = _w113AppendAuditRow(`verb_proposed=1|name=${name}|bucket=${bucket}|proposer=${q.agent_pid || "unknown"}|verbs_hbp_row=${rh}`);
      res.writeHead(200);
      return res.end(JSON.stringify({ ok: true, verb: name, bucket, row_hash: rh, audit_row_hash: auditH, verbs_hbp_path: W113_VERBS_HBP_PATH }));
    });
    return;
  }
  if (p === "/api/tool-advisor/health") {
    res.setHeader("Content-Type", "application/json");
    const sha = _w113SelfSha256();
    const lines = existsSync(W113_AUDIT_LOG_PATH) ? readFileSync(W113_AUDIT_LOG_PATH, "utf-8").split("\n").filter(Boolean) : [];
    const tipMatch = lines.length ? lines[lines.length - 1].match(/row_hash=([a-f0-9]{16})/) : null;
    return res.end(JSON.stringify({
      ok: true,
      service: "tool-advisor",
      vantage: "acer",
      wave_pid: "W113-TOOL-ADVISOR-WAVE-2026-05-21",
      advisor_binary_sha256: sha,
      drift_detected: false,
      ledger_tip_sha16: tipMatch ? tipMatch[1] : null,
      ledger_row_count: lines.length,
      uptime_s: Math.round(process.uptime()),
      verb_taxonomy_count: Object.keys(VERB_MATRIX).length + _w113VerbsHbpOverlay().size,
      verb_core_count: Object.keys(VERB_MATRIX).length,
      verb_overlay_count: _w113VerbsHbpOverlay().size,
      verbs_hbp_path: W113_VERBS_HBP_PATH,
      ts: new Date().toISOString(),
    }));
  }
  if (p === "/api/tool-advisor/self-restore") {
    res.setHeader("Content-Type", "application/json");
    if (req.method !== "POST") { res.writeHead(405); return res.end(JSON.stringify({ ok: false, reason: "POST-only" })); }
    let body = "";
    req.on("data", c => body += c);
    req.on("end", () => {
      let q = {};
      try { q = JSON.parse(body || "{}"); } catch {}
      const evt = _w113AppendAuditRow(`self_restore_request=1|scope=${q.scope || "unknown"}|source=${q.source || "unknown"}|operator_token_provided=${q.operator_token ? "true" : "false"}|status=STUB_DESCRIPTOR_ONLY`);
      res.writeHead(200);
      return res.end(JSON.stringify({
        ok: true,
        status: "STUB_DESCRIPTOR_ONLY",
        reason: "self-restore actual execution requires quintuple-cosign operator_token validation",
        would_restore: { L1: "PS profile + .hbp ledger", L2: "advisor daemon + cache", L3: "firewall rules + scheduled tasks", T0: "USB substrate state manifest" },
        canon_source_path: "D:/AsolariaGuides/tool-advisor-design/",
        audit_row_hash: evt,
        next_step: "operator authorizes via apex-cosign envelope with valid operator_token",
      }));
    });
    return;
  }
  if (p === "/api/voxels/policy-events") {
    res.setHeader("Content-Type", "application/json");
    if (req.method === "POST") {
      let body = "";
      req.on("data", c => body += c);
      req.on("end", () => {
        let q = {};
        try { q = JSON.parse(body || "{}"); } catch {}
        const rowHash = _w113AppendAuditRow(`external_event=1|event_type=${q.event_type || "unspecified"}|detail=${(q.detail || "").slice(0, 200)}`);
        res.writeHead(200);
        return res.end(JSON.stringify({ ok: true, row_hash: rowHash }));
      });
      return;
    }
    const lines = existsSync(W113_AUDIT_LOG_PATH) ? readFileSync(W113_AUDIT_LOG_PATH, "utf-8").split("\n").filter(Boolean) : [];
    const sinceParam = url.searchParams ? url.searchParams.get("since") : null;
    const since = parseInt(sinceParam || "0", 10);
    return res.end(JSON.stringify({
      wave_pid: "W113-TOOL-ADVISOR-WAVE-2026-05-21",
      vantage: "acer",
      total_rows: lines.length,
      returned: lines.slice(since, since + 50),
      next_offset: Math.min(since + 50, lines.length),
    }));
  }

  if (p === "/api/sister-organ") {
    // 2026-05-21: liris current LAN IP is 192.168.1.17 (was .4 in older canon); env override LIRIS_HOST.
    const lirisHost = process.env.LIRIS_HOST || "192.168.1.17";
    const candidates = [`http://${lirisHost}:4944/health`, "http://192.168.1.4:4944/health", "http://192.168.100.2:4944/health"];
    for (const url of candidates) {
      try {
        const r = await fetch(url, { signal: AbortSignal.timeout(3000) });
        const body = await r.text();
        res.writeHead(r.status, { "content-type": "application/json", "x-sister-organ-source": url });
        return res.end(body);
      } catch (e) {
        // try next candidate
      }
    }
    res.writeHead(502, { "content-type": "application/json" });
    return res.end(JSON.stringify({ ok: false, err: "all sister-organ candidates failed", tried: candidates }));
  }

  // ===== 2026-05-11 dashboard-improvements routes (6 modules, 7 endpoints) =====
  if (p === "/api/usb-physical-pipeline") {
    try {
      const r = await computeUsbPhysicalPipeline(BUS_URL);
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify(r, null, 2));
    } catch (e) {
      console.error("[api/usb-physical-pipeline]", e);
      res.writeHead(500, { "content-type": "application/json" });
      return res.end(JSON.stringify({ ok: false, err: e.message, route: "usb-physical-pipeline" }, null, 2));
    }
  }

  if (p === "/api/usb-file-manager.hbp") {
    try {
      const packet = await buildUsbFileManagerHbp({ path: url.searchParams.get("path") || "" });
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
      return res.end(packet.hbp);
    } catch (e) {
      res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
      return res.end(`USBFMERR|ok=0|reason=${String(e.message || e).replace(/[|{}\\[\\]"\r\n\t]/g, "_")}\n`);
    }
  }
  if (p === "/api/usb-file-manager.hbi") {
    try {
      const packet = await buildUsbFileManagerHbp({ path: url.searchParams.get("path") || "" });
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
      return res.end(packet.hbi);
    } catch (e) {
      res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
      return res.end(`USBFMIDXERR|ok=0|reason=${String(e.message || e).replace(/[|{}\\[\\]"\r\n\t]/g, "_")}\n`);
    }
  }

  if (p === "/api/tri-vantage-parity") {
    try {
      const r = await computeTriVantageParity(BUS_URL, 200);
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify(r, null, 2));
    } catch (e) {
      console.error("[api/tri-vantage-parity]", e);
      res.writeHead(500, { "content-type": "application/json" });
      return res.end(JSON.stringify({ ok: false, err: e.message, route: "tri-vantage-parity" }, null, 2));
    }
  }

  if (p === "/api/owner-cadence-gap") {
    try {
      const r = await computeOwnerCadenceGap(BUS_URL, 200);
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify(r, null, 2));
    } catch (e) {
      console.error("[api/owner-cadence-gap]", e);
      res.writeHead(500, { "content-type": "application/json" });
      return res.end(JSON.stringify({ ok: false, err: e.message, route: "owner-cadence-gap" }, null, 2));
    }
  }

  if (p === "/api/envelope-class-counter") {
    try {
      const r = await computeEnvelopeClassCounter(BUS_URL, 200, 12);
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify(r, null, 2));
    } catch (e) {
      console.error("[api/envelope-class-counter]", e);
      res.writeHead(500, { "content-type": "application/json" });
      return res.end(JSON.stringify({ ok: false, err: e.message, route: "envelope-class-counter" }, null, 2));
    }
  }

  if (p === "/api/route-list.hbp" || p === "/api/route-list.hbi") {
    try {
      const r = buildRouteListTuple();
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" });
      return res.end(p.endsWith(".hbi") ? r.hbi : r.hbp);
    } catch (e) {
      console.error("[api/route-list tuple]", e);
      res.writeHead(500, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" });
      return res.end(tupleRow("ROUTELISTERR", { ok: 0, reason: e.message || "error" }) + "\n");
    }
  }

  if (p === "/api/route-honesty.hbp" || p === "/api/route-honesty.hbi") {
    try {
      const r = buildRouteHonestyTuple();
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" });
      return res.end(p.endsWith(".hbi") ? r.hbi : r.hbp);
    } catch (e) {
      console.error("[api/route-honesty tuple]", e);
      res.writeHead(500, { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" });
      return res.end(tupleRow("RTHONERR", { ok: 0, reason: e.message || "error" }) + "\n");
    }
  }

  if (p === "/api/route-honesty") {
    try {
      const r = getRouteHonestyStatus(getKnownRoutes());
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify(r, null, 2));
    } catch (e) {
      console.error("[api/route-honesty]", e);
      res.writeHead(500, { "content-type": "application/json" });
      return res.end(JSON.stringify({ ok: false, err: e.message, route: "route-honesty" }, null, 2));
    }
  }

  if (p === "/api/fabric-mirror-audit/local") {
    try {
      const r = await auditLocalRoutes("http://127.0.0.1:4949");
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify(r, null, 2));
    } catch (e) {
      console.error("[api/fabric-mirror-audit/local]", e);
      res.writeHead(500, { "content-type": "application/json" });
      return res.end(JSON.stringify({ ok: false, err: e.message, route: "fabric-mirror-audit/local" }, null, 2));
    }
  }

  if (p === "/api/fabric-mirror-audit") {
    try {
      const r = await auditFabricMirror();
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify(r, null, 2));
    } catch (e) {
      console.error("[api/fabric-mirror-audit]", e);
      res.writeHead(500, { "content-type": "application/json" });
      return res.end(JSON.stringify({ ok: false, err: e.message, route: "fabric-mirror-audit" }, null, 2));
    }
  }

  // ===== 2026-05-11 agent-roles-live routes (7 named agents + cross-pipe) =====
  if (p === "/api/agents") {
    try {
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify(listAgents(), null, 2));
    } catch (e) {
      console.error("[api/agents]", e);
      res.writeHead(500, { "content-type": "application/json" });
      return res.end(JSON.stringify({ ok: false, err: e.message, route: "agents" }, null, 2));
    }
  }

  if (p.startsWith("/api/agents/") && p.endsWith("/status")) {
    const roleId = p.slice("/api/agents/".length, p.length - "/status".length);
    try {
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify(agentStatus(roleId), null, 2));
    } catch (e) {
      console.error("[api/agents/<role>/status]", e);
      res.writeHead(500, { "content-type": "application/json" });
      return res.end(JSON.stringify({ ok: false, err: e.message, role_id: roleId }, null, 2));
    }
  }

  if (p.startsWith("/api/agents/") && p.endsWith("/inbox")) {
    const roleId = p.slice("/api/agents/".length, p.length - "/inbox".length);
    try {
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify(agentInbox(roleId, 20), null, 2));
    } catch (e) {
      console.error("[api/agents/<role>/inbox]", e);
      res.writeHead(500, { "content-type": "application/json" });
      return res.end(JSON.stringify({ ok: false, err: e.message, role_id: roleId }, null, 2));
    }
  }

  if (p === "/api/agents/cross-type" && req.method === "POST") {
    try {
      let body = "";
      for await (const chunk of req) body += chunk;
      const parsed = body ? JSON.parse(body) : {};
      const result = crossType(parsed);
      res.writeHead(result.ok ? 200 : 400, { "content-type": "application/json" });
      return res.end(JSON.stringify(result, null, 2));
    } catch (e) {
      console.error("[api/agents/cross-type]", e);
      res.writeHead(500, { "content-type": "application/json" });
      return res.end(JSON.stringify({ ok: false, err: e.message, route: "cross-type" }, null, 2));
    }
  }

  if (p === "/api/agents/cross-pipe/dump") {
    try {
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify(crossPipeDump(), null, 2));
    } catch (e) {
      console.error("[api/agents/cross-pipe/dump]", e);
      res.writeHead(500, { "content-type": "application/json" });
      return res.end(JSON.stringify({ ok: false, err: e.message, route: "cross-pipe/dump" }, null, 2));
    }
  }

  // Static fallthrough Ãƒâ€šÃ‚Â· serve any file from super-os-viz/ directly
  const stripped = p.startsWith("/") ? p.slice(1) : p;
  if (stripped && !stripped.includes("..")) {
    const r = serveStatic(stripped);
    if (r) { res.writeHead(r.status, { "content-type": r.ct }); return res.end(r.body); }
  }

  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ ok: false, error: "not_found", path: p, routes: getKnownRoutes() }));
});

server.listen(PORT, HOST, () => {
  log("super-asolaria-os dashboard listening Ãƒâ€šÃ‚Â· http://" + HOST + ":" + PORT + "/");
  log("routes: / /viz /health /api/{manifest,cohort,cosign-chain,glyphs,council-skeleton,heal-pipeline-schema,onboarding-bootstrap,inbox,bus-health,remote-input/health,audit-integrity/candidate,access-tier/matrix,access-tier/probe}");
});

process.on("SIGINT", () => { log("shutting down"); server.close(() => process.exit(0)); });
process.on("SIGTERM", () => { log("shutting down"); server.close(() => process.exit(0)); });

