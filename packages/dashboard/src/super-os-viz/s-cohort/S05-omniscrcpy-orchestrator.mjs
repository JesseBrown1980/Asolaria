// S05 · OmniScrcpy cross-colony visible control loop
// Front-end triggered look/type/verify cycles for Acer/Falcon plus
// Liris/Aether handoff envelopes. This is intentionally not a hidden daemon.
import { spawnSync } from "node:child_process";
import { createHash, createPrivateKey, generateKeyPairSync, sign as cryptoSign, verify as cryptoVerify } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { hilbertD2XY, pidToHilbert } from "../b-cohort/B04-hilbert-curve.mjs";
import {
  look as falconLookRaw,
  lookTypeEnterLook,
  status as falconStatusRaw,
  OMNICTRL_PID_AF,
  RESERVED_OMNICTRL_PIDS
} from "./S03-omni-control.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const RUNTIME_DIR = join(ROOT, "runtime", "omniscrcpy");
const OMNI_CONTROL_DIR = join(ROOT, "runtime", "omni-control");
const HISTORY_FILE = join(RUNTIME_DIR, "omniscrcpy-action-history.ndjson");
const HALT_FILE = join(RUNTIME_DIR, "halt-state.json");
const FEED_INDEX_FILE = join(RUNTIME_DIR, "omniscrcpy-feed-index.json");
const GC_STATE_FILE = join(RUNTIME_DIR, "omniscrcpy-gc-state.json");
const VISIBLE_TICK_GUARD_FILE = join(RUNTIME_DIR, "visible-tick-guard.json");
const FABRIC_TRIGGER_GUARD_FILE = join(RUNTIME_DIR, "fabric-trigger-guard.json");
const ORCHESTRATION_GUARD_FILE = join(RUNTIME_DIR, "orchestration-guard.json");
const JRI1024_KEY_FILE = join(RUNTIME_DIR, "jri1024-special-op-jesse-key.json");
const ACER_SCREEN_DIR = process.env.OMNISCRCPY_ACER_SCREEN_DIR || "C:\\tmp\\asolaria-screens\\acer";
const BUS_URL = process.env.BEHCS_BUS_URL || "http://127.0.0.1:4947";

export const OMNISCRCPY_PID = "OMNISCRCPY-PID-2026-05-09";
export const LIRIS_AETHER_PID = "OMNICTRL-PID-LA-LIRIS-AETHER-A06-R9QY205KAKJ-LOOK-TYPE-ENTER-LOOK-2026-05-09-N00001";
export const LIRIS_DESKTOP_PID = "OMNICTRL-PID-AL-LIRIS-DESKTOP-PTSQTIE-LOOK-TYPE-ENTER-LOOK-2026-05-09-N00001";
export const FRONTEND_LOOP_PID = "OMNISCRCPY-FRONTEND-LOOP-PID-HS05A-A04-W1024-P00-N00001";
const LEWORLD_CANON_PATHREFS = [
  "paper-ingest-leworldmodel-2603-19312v2-20260510T140822Z:39157",
  "leworldmodel-agent-review-synthesis-20260510T171042Z:39221"
];

const MAX_KICK_TEXT = 360;
const PREVIEW_MAX_WIDTH = 720;
const PREVIEW_MAX_WIDTH_CAP = 1280;
const PREVIEW_JPEG_QUALITY = 75;
const DEFAULT_GC = {
  image_ttl_ms: 30 * 60 * 1000,
  frame_ttl_ms: 30 * 60 * 1000,
  max_image_files: 72,
  max_image_bytes: 50 * 1024 * 1024,
  min_recent_files: 24,
  max_history_lines: 500,
  max_preview_data_url_chars: 350000
};
const VISUAL_FRAME_FRESH_MS = 120 * 1000;

const LANES = [
  {
    id: "acer-falcon",
    label: "Acer -> Falcon S24FE",
    mode: "local-adb-usb",
    pid: OMNICTRL_PID_AF,
    leader: "Acer front end + Codex backend",
    verbs: ["desktop-look", "falcon-look", "type", "enter", "verify"],
    status: "active-if-adb-device"
  },
  {
    id: "liris-aether",
    label: "Liris -> Aether A06",
    mode: "sister-handoff-envelope",
    pid: LIRIS_AETHER_PID,
    leader: "Liris front end watches Aether; Acer sends compact handoff",
    verbs: ["request-look", "request-type", "request-enter", "request-verify"],
    status: "active-when-liris-confirms"
  },
  {
    id: "acer-liris",
    label: "Acer -> Liris desktop",
    mode: "sister-desktop-frame-envelope",
    pid: LIRIS_DESKTOP_PID,
    leader: "Liris publishes desktop frames; Acer renders them on the screen wall",
    verbs: ["request-look", "request-type", "request-enter", "request-verify"],
    status: "active-when-liris-confirms"
  },
  {
    id: "acer-frontend",
    label: "Acer primary desktop",
    mode: "visible-browser-loop",
    pid: FRONTEND_LOOP_PID,
    leader: "operator-visible dashboard tab",
    verbs: ["screen-look", "tick", "kick", "receipt"],
    status: "active-when-tab-open"
  }
];

const EXPECTED_SCREEN_DEVICES = [
  {
    device_id: "acer-desktop",
    lane: "acer-frontend",
    transport: "local-desktop-capture",
    source: "expected-local",
    label: "Acer desktop"
  },
  {
    device_id: "falcon-s24fe",
    lane: "acer-falcon",
    transport: "local-adb-usb",
    source: "expected-local",
    label: "Falcon S24FE"
  },
  {
    device_id: "aether-a06-via-liris",
    lane: "liris-aether",
    transport: "usb-adb-via-liris-then-bus-relay",
    source: "expected-remote",
    label: "Aether A06 via Liris"
  },
  {
    device_id: "liris-desktop-via-bus",
    lane: "acer-liris",
    transport: "desktop-capture-via-liris-then-bus-relay",
    source: "expected-remote",
    label: "Liris desktop via bus"
  }
];
const REMOTE_OWNER_FRAME_DEVICES = new Set(["aether-a06-via-liris", "liris-desktop-via-bus"]);
const FRAME_NOVELTY_MEMORY = new Map();

const OMNIMESH_NODES = [
  {
    node_id: "acer",
    label: "Acer",
    screen_device_id: "acer-desktop",
    host: "192.168.1.50",
    role: "primary-organ",
    frame_producer: "local desktop capture",
    frame_consumer: "dashboard screen wall",
    mets_producer: "acer-sidecar heartbeat + bus receipts",
    type_channel: "local Pi terminal / local endpoints"
  },
  {
    node_id: "liris",
    label: "Liris",
    screen_device_id: "liris-desktop-via-bus",
    host: "192.168.1.4",
    alternate_hosts: ["192.168.1.14", "192.168.100.2"],
    role: "sister-organ",
    frame_producer: "gated desktop producer via bus",
    frame_consumer: "sister dashboard + heartbeat watcher",
    mets_producer: "LIRIS_HEARTBEAT_30S / ack envelopes",
    type_channel: "gated producer/control contract",
    transport_note: "Ethernet DHCP on router LAN observed 2026-05-10; legacy 192.168.100.x direct-wire is not current proof."
  },
  {
    node_id: "falcon",
    label: "Falcon S24FE",
    screen_device_id: "falcon-s24fe",
    host: "USB R5CXA4MGQXV / 192.168.1.44 when LAN",
    role: "sentinel mobile",
    frame_producer: "Acer ADB screencap",
    frame_consumer: "scrcpy operator window + room-40 files",
    mets_producer: "room-40 artifacts + Falcon envelopes",
    type_channel: "Acer ADB input text/keyevent"
  },
  {
    node_id: "aether",
    label: "Aether A06",
    screen_device_id: "aether-a06-via-liris",
    host: "USB R9QY205KAKJ via Liris",
    role: "sister mobile",
    frame_producer: "gated Liris ADB screencap relay",
    frame_consumer: "Liris scrcpy operator window",
    mets_producer: "aether hookwall via Liris",
    type_channel: "Liris operator-mediated until Class-1 lift"
  }
];

const MISTAKES = [
  "Do not rely on a backend daemon with no visible browser surface; the tab must show the last look and last action.",
  "Every type or enter needs a look before and after, otherwise focus drift is invisible.",
  "Acer can directly control Falcon only when ADB sees the pinned serial; Liris/Aether must be requested through an envelope until Acer has a proven route.",
  "scrcpy is useful for human vision, but backend control should use ADB primitives plus receipt images.",
  "Front-end timers are safer than hidden daemon loops because the operator can see, pause, and restart the cycle.",
  "A single screenshot is only a viewport sample; dashboard visual inspection requires scroll-sweep coverage or equivalent backend section proof before claiming the full picture."
];

function ensureDir() {
  if (!existsSync(RUNTIME_DIR)) mkdirSync(RUNTIME_DIR, { recursive: true });
}

function visualImageDirs() {
  return [
    { id: "omniscrcpy", dir: RUNTIME_DIR },
    { id: "omni-control", dir: OMNI_CONTROL_DIR }
  ];
}

function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function safeLabel(value) {
  return String(value || "look").replace(/[^a-z0-9_-]+/gi, "-").slice(0, 48) || "look";
}

function sha16(buffer) {
  return createHash("sha256").update(buffer).digest("hex").slice(0, 16);
}

function boundedText(text) {
  const raw = String(text || "").replace(/\r?\n/g, " ").trim();
  if (!raw) return "";
  return raw.slice(0, MAX_KICK_TEXT);
}

function chainId(kind = "cycle") {
  return `omniscrcpy-${kind}-${Date.now()}-${createHash("sha256").update(kind + "|" + Date.now() + "|" + Math.random()).digest("hex").slice(0, 8)}`;
}

function readHaltState() {
  ensureDir();
  try {
    if (existsSync(HALT_FILE)) return JSON.parse(readFileSync(HALT_FILE, "utf8"));
  } catch { /* fall through */ }
  return { halted: false, updated_at: new Date().toISOString(), reason: "initial" };
}

function writeHaltState(halted, reason = "manual") {
  ensureDir();
  const state = { halted: !!halted, reason: String(reason || "manual"), updated_at: new Date().toISOString() };
  writeFileSync(HALT_FILE, JSON.stringify(state, null, 2));
  return state;
}

function readVisibleTickGuard() {
  ensureDir();
  try {
    if (existsSync(VISIBLE_TICK_GUARD_FILE)) return JSON.parse(readFileSync(VISIBLE_TICK_GUARD_FILE, "utf8"));
  } catch { /* fall through */ }
  return { last_emit_ms: 0, chain_id: "", pathRef: "", reason: "initial" };
}

function writeVisibleTickGuard(state) {
  ensureDir();
  writeFileSync(VISIBLE_TICK_GUARD_FILE, JSON.stringify(state, null, 2));
  return state;
}

function readFabricTriggerGuard() {
  ensureDir();
  try {
    if (existsSync(FABRIC_TRIGGER_GUARD_FILE)) return JSON.parse(readFileSync(FABRIC_TRIGGER_GUARD_FILE, "utf8"));
  } catch { /* fall through */ }
  return { by_device: {}, last_sweep_at: null };
}

function writeFabricTriggerGuard(state) {
  ensureDir();
  writeFileSync(FABRIC_TRIGGER_GUARD_FILE, JSON.stringify(state, null, 2));
  return state;
}

function readOrchestrationGuard() {
  ensureDir();
  try {
    if (existsSync(ORCHESTRATION_GUARD_FILE)) return JSON.parse(readFileSync(ORCHESTRATION_GUARD_FILE, "utf8"));
  } catch { /* fall through */ }
  return { last_emit_ms: 0, pathRef: "", route: null };
}

function writeOrchestrationGuard(state) {
  ensureDir();
  writeFileSync(ORCHESTRATION_GUARD_FILE, JSON.stringify(state, null, 2));
  return state;
}

function brownHilbertRoute(seed, opts = {}) {
  const hash = createHash("sha256").update(String(seed || "orchestration")).digest("hex");
  const sha16 = hash.slice(0, 16);
  const [x, y] = pidToHilbert(sha16);
  const room = x * 16 + y;
  const portNamespace = 4947 + (room % 50);
  return {
    seed: String(seed || ""),
    sha16,
    hilbert_order: 4,
    hilbert_xy: [x, y],
    hilbert_room: room,
    logical_port_namespace: portNamespace,
    pid: `${opts.prefix || "SPECIAL-OP-JESSE"}-BH-PID-H${sha16.slice(0, 4).toUpperCase()}-A04-W${String(room).padStart(4, "0")}-P${String(portNamespace).padStart(5, "0")}-N${String(opts.n || 1).padStart(5, "0")}`,
    note: "Logical Brown-Hilbert route metadata only; this does not bind a network socket or mint an auth token."
  };
}

function jri1024KeyMaterial() {
  ensureDir();
  try {
    if (existsSync(JRI1024_KEY_FILE)) {
      const parsed = JSON.parse(readFileSync(JRI1024_KEY_FILE, "utf8"));
      if (parsed.private_key_pem && parsed.public_key_pem && parsed.seed_id) return parsed;
    }
  } catch { /* regenerate below */ }
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const public_key_pem = publicKey.export({ type: "spki", format: "pem" });
  const private_key_pem = privateKey.export({ type: "pkcs8", format: "pem" });
  const seed_id = sha16(Buffer.from(public_key_pem));
  const material = {
    version: "JRI-1024-ED25519-v1",
    created_at: new Date().toISOString(),
    owner: "ACER-SPECIAL-OP-JESSE-LOGICAL-ROTATOR",
    seed_id,
    public_key_pem,
    private_key_pem,
    warning: "Local runtime signing key. Public key may be shared; private key must not leave Acer."
  };
  writeFileSync(JRI1024_KEY_FILE, JSON.stringify(material, null, 2));
  return material;
}

function jri1024PortNamespace(room) {
  const ports = [];
  for (let p = 4948; p <= 5075; p += 1) {
    if (p === 4950) continue; // LAW-001 feedback relay anchor stays pinned.
    ports.push(p);
  }
  return ports[Math.abs(Number(room) || 0) % ports.length];
}

function jri1024Route(opts = {}) {
  const nowMs = Number(opts.nowMs || Date.now());
  const counter_t = Number.isFinite(Number(opts.counter_t)) ? Number(opts.counter_t) : Math.floor(nowMs / 1000);
  const generation = Math.max(1, Number(opts.generation || 1));
  const key = jri1024KeyMaterial();
  const payload_hash = opts.payload_hash || createHash("sha256").update(JSON.stringify(opts.context || {})).digest("hex").slice(0, 16);
  const nonce = createHash("sha256")
    .update([counter_t, generation, payload_hash, opts.trigger || "jri1024", Math.random()].join("|"))
    .digest("hex")
    .slice(0, 16);
  const seed = [
    "SPECIAL-OP-JESSE",
    key.seed_id,
    counter_t,
    generation,
    payload_hash,
    nonce,
    opts.trigger || "orchestration-cycle"
  ].join("|");
  const fullHash = createHash("sha256").update(seed).digest("hex");
  const route_sha16 = fullHash.slice(0, 16);
  const hilbert_d = parseInt(fullHash.slice(0, 8), 16) % 1024;
  const [x, y] = hilbertD2XY(hilbert_d, 32);
  const port_t = jri1024PortNamespace(hilbert_d);
  const pid_t = `SPECIAL-OP-JESSE-JRI1024-PID-H${route_sha16.slice(0, 4).toUpperCase()}-A05-W${String(hilbert_d).padStart(4, "0")}-P${String(port_t).padStart(5, "0")}-N${String(generation).padStart(5, "0")}`;
  const tuple = {
    algorithm: "JRI-1024-HILBERT-ORDER5-ED25519",
    role: "SPECIAL-OP-JESSE-AUTOMATED-SEAT",
    seed_id: key.seed_id,
    counter_t,
    generation,
    pid_t,
    port_t,
    room_t: hilbert_d,
    hilbert_order: 5,
    hilbert_side: 32,
    hilbert_points: 1024,
    hilbert_xy: [x, y],
    payload_hash,
    nonce
  };
  const canonical = JSON.stringify(tuple);
  const privateKey = createPrivateKey(key.private_key_pem);
  const signature = cryptoSign(null, Buffer.from(canonical), privateKey).toString("base64");
  const verified = cryptoVerify(null, Buffer.from(canonical), key.public_key_pem, Buffer.from(signature, "base64"));
  return {
    ...tuple,
    pid: pid_t,
    logical_port_namespace: port_t,
    hilbert_room: hilbert_d,
    sha16: route_sha16,
    signature,
    signature_format: "base64",
    public_key_pem: key.public_key_pem,
    verified,
    verification_contract: {
      canonical_json: canonical,
      verify: "ed25519 verify(signature, canonical_json, public_key_pem)",
      lookback_points: 8,
      pinned_ports: [4947, 4950],
      port_note: "port_t is a Brown-Hilbert logical namespace. It does not bind or expose a socket."
    }
  };
}

function appendHistory(row) {
  ensureDir();
  const enriched = { ts: new Date().toISOString(), ...row };
  appendFileSync(HISTORY_FILE, JSON.stringify(enriched) + "\n");
  return enriched;
}

function readHistory(limit = 40) {
  ensureDir();
  if (!existsSync(HISTORY_FILE)) return [];
  return readFileSync(HISTORY_FILE, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .slice(-Math.max(1, Math.min(parseInt(limit || "40", 10), 200)))
    .map((line) => {
      try { return JSON.parse(line); } catch { return null; }
    })
    .filter(Boolean);
}

function intFromEnv(name, fallback, min = 1) {
  const n = parseInt(process.env[name] || "", 10);
  return Number.isFinite(n) && n >= min ? n : fallback;
}

function gcPolicy(overrides = {}) {
  return {
    image_ttl_ms: Math.max(60_000, parseInt(overrides.image_ttl_ms || "", 10) || intFromEnv("OMNISCRCPY_IMAGE_TTL_MS", DEFAULT_GC.image_ttl_ms)),
    frame_ttl_ms: Math.max(60_000, parseInt(overrides.frame_ttl_ms || "", 10) || intFromEnv("OMNISCRCPY_FRAME_TTL_MS", DEFAULT_GC.frame_ttl_ms)),
    max_image_files: Math.max(8, parseInt(overrides.max_image_files || "", 10) || intFromEnv("OMNISCRCPY_MAX_IMAGE_FILES", DEFAULT_GC.max_image_files)),
    max_image_bytes: Math.max(1024 * 1024, parseInt(overrides.max_image_bytes || "", 10) || intFromEnv("OMNISCRCPY_MAX_IMAGE_BYTES", DEFAULT_GC.max_image_bytes)),
    min_recent_files: Math.max(4, parseInt(overrides.min_recent_files || "", 10) || intFromEnv("OMNISCRCPY_MIN_RECENT_FILES", DEFAULT_GC.min_recent_files)),
    max_history_lines: Math.max(50, parseInt(overrides.max_history_lines || "", 10) || intFromEnv("OMNISCRCPY_MAX_HISTORY_LINES", DEFAULT_GC.max_history_lines)),
    max_preview_data_url_chars: Math.max(20000, parseInt(overrides.max_preview_data_url_chars || "", 10) || intFromEnv("OMNISCRCPY_MAX_PREVIEW_DATA_URL_CHARS", DEFAULT_GC.max_preview_data_url_chars))
  };
}

function parseTimeMs(value) {
  const t = Date.parse(value || "");
  return Number.isFinite(t) ? t : 0;
}

function readFeedIndex() {
  ensureDir();
  try {
    if (existsSync(FEED_INDEX_FILE)) return JSON.parse(readFileSync(FEED_INDEX_FILE, "utf8"));
  } catch { /* fall through */ }
  return { version: 1, updated_at: new Date().toISOString(), frames: {} };
}

function sanitizeFrameForStorage(frame, policy = gcPolicy()) {
  const f = JSON.parse(JSON.stringify(frame || {}));
  if (f.full?.data_url) {
    f.full.data_url_available = true;
    f.full.data_url_stripped_by_gc = true;
    delete f.full.data_url;
  }
  if (f.preview?.data_url && String(f.preview.data_url).length > policy.max_preview_data_url_chars) {
    f.preview.data_url_available = true;
    f.preview.data_url_stripped_by_gc = true;
    delete f.preview.data_url;
  }
  return f;
}

function writeFeedIndex(index) {
  ensureDir();
  const policy = gcPolicy();
  const frames = {};
  for (const [device, frame] of Object.entries(index.frames || {})) frames[device] = sanitizeFrameForStorage(frame, policy);
  const clean = { version: 1, updated_at: new Date().toISOString(), frames };
  writeFileSync(FEED_INDEX_FILE, JSON.stringify(clean, null, 2));
  return clean;
}

function frameFileRefs(frame) {
  return [frame?.full?.file, frame?.preview?.file].filter(Boolean);
}

function trimHistory(maxLines, dryRun = false) {
  if (!existsSync(HISTORY_FILE)) return { before: 0, after: 0, trimmed: 0 };
  const lines = readFileSync(HISTORY_FILE, "utf8").split(/\r?\n/).filter(Boolean);
  if (lines.length <= maxLines) return { before: lines.length, after: lines.length, trimmed: 0 };
  const kept = lines.slice(-maxLines);
  if (!dryRun) writeFileSync(HISTORY_FILE, kept.join("\n") + "\n");
  return { before: lines.length, after: kept.length, trimmed: lines.length - kept.length };
}

function readGcState() {
  ensureDir();
  try {
    if (existsSync(GC_STATE_FILE)) return JSON.parse(readFileSync(GC_STATE_FILE, "utf8"));
  } catch { /* fall through */ }
  return null;
}

function writeGcState(state) {
  ensureDir();
  writeFileSync(GC_STATE_FILE, JSON.stringify(state, null, 2));
  return state;
}

export function collectGarbage(opts = {}) {
  ensureDir();
  const policy = gcPolicy(opts);
  const now = Date.now();
  const dryRun = opts.dry_run === true;
  const index = readFeedIndex();
  const nextFrames = {};
  const protectedFiles = new Set();
  const pruned_frames = [];
  const sanitized_frames = [];

  for (const [device, rawFrame] of Object.entries(index.frames || {})) {
    const frame = sanitizeFrameForStorage(rawFrame, policy);
    const age = now - (parseTimeMs(frame.captured_at) || now);
    if (age > policy.frame_ttl_ms) {
      pruned_frames.push({ device_id: device, captured_at: frame.captured_at, age_ms: age });
      continue;
    }
    if (JSON.stringify(frame) !== JSON.stringify(rawFrame)) sanitized_frames.push(device);
    nextFrames[device] = frame;
    for (const file of frameFileRefs(frame)) protectedFiles.add(resolve(file));
  }
  if (!dryRun && (pruned_frames.length || sanitized_frames.length)) writeFeedIndex({ frames: nextFrames });

  const files = [];
  for (const source of visualImageDirs()) {
    if (!existsSync(source.dir)) continue;
    try {
      for (const name of readdirSync(source.dir)) {
      if (!/\.(png|jpg|jpeg)$/i.test(name)) continue;
      const file = resolve(join(source.dir, name));
      const st = statSync(file);
      files.push({ source: source.id, file, name, bytes: st.size, mtime_ms: st.mtimeMs, age_ms: now - st.mtimeMs });
      }
    } catch { /* best effort per visual pipe */ }
  }

  const recentProtected = new Set(files.slice().sort((a, b) => b.mtime_ms - a.mtime_ms).slice(0, policy.min_recent_files).map(f => f.file));
  let totalBytes = files.reduce((sum, f) => sum + f.bytes, 0);
  let totalCount = files.length;
  const deleted_files = [];

  for (const f of files.slice().sort((a, b) => a.mtime_ms - b.mtime_ms)) {
    if (protectedFiles.has(f.file) || recentProtected.has(f.file)) continue;
    const overAge = f.age_ms > policy.image_ttl_ms;
    const overCount = totalCount > policy.max_image_files;
    const overBytes = totalBytes > policy.max_image_bytes;
    if (!overAge && !overCount && !overBytes) continue;
    deleted_files.push({ source: f.source, name: f.name, bytes: f.bytes, age_ms: Math.round(f.age_ms), reason: overAge ? "ttl" : overCount ? "count-cap" : "byte-cap" });
    if (!dryRun) {
      try { unlinkSync(f.file); } catch { /* best effort */ }
    }
    totalBytes -= f.bytes;
    totalCount -= 1;
  }

  const history = trimHistory(policy.max_history_lines, dryRun);
  const state = {
    ok: true,
    ts: new Date().toISOString(),
    dry_run: dryRun,
    universal: true,
    scope: ["runtime/omniscrcpy", "runtime/omni-control", "acer-desktop", "falcon-s24fe", "aether-a06-via-liris", "liris-desktop-via-bus", "future-registered-devices"],
    image_dirs: visualImageDirs(),
    policy,
    protected_current_files: protectedFiles.size,
    files_before: files.length,
    files_after: totalCount,
    bytes_before: files.reduce((sum, f) => sum + f.bytes, 0),
    bytes_after: totalBytes,
    deleted_files,
    pruned_frames,
    sanitized_frames,
    history
  };
  if (!dryRun) writeGcState(state);
  return state;
}

function imageSummary(look) {
  if (!look) return null;
  return {
    ok: !!look.ok,
    file: look.file || "",
    bytes: look.bytes || 0,
    sha16: look.sha16 || "",
    captured_at: look.captured_at || ""
  };
}

function previewFromFile(file, opts = {}) {
  if (!file || !existsSync(file)) return { ok: false, err: "source image missing", file };
  const maxWidth = Math.max(160, Math.min(parseInt(opts.max_width || PREVIEW_MAX_WIDTH, 10), PREVIEW_MAX_WIDTH_CAP));
  const out = file.replace(/\.[^.\\/:]+$/, "") + `-preview-${maxWidth}.jpg`;
  const srcPs = file.replace(/'/g, "''");
  const outPs = out.replace(/'/g, "''");
  const script = `
Add-Type -AssemblyName System.Drawing
$src='${srcPs}'
$dst='${outPs}'
$maxW=${maxWidth}
$img=[System.Drawing.Image]::FromFile($src)
$scale=[Math]::Min(1.0, $maxW / [double]$img.Width)
$w=[Math]::Max(1, [int]($img.Width * $scale))
$h=[Math]::Max(1, [int]($img.Height * $scale))
$bmp=New-Object System.Drawing.Bitmap $w,$h
$g=[System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode=[System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode=[System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.DrawImage($img,0,0,$w,$h)
$codec=[System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' } | Select-Object -First 1
$encParams=New-Object System.Drawing.Imaging.EncoderParameters 1
$encParams.Param[0]=New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [int64]${PREVIEW_JPEG_QUALITY})
$bmp.Save($dst,$codec,$encParams)
$g.Dispose(); $bmp.Dispose(); $img.Dispose()
[pscustomobject]@{ ok=$true; width=$w; height=$h; file=$dst } | ConvertTo-Json -Compress
`;
  const r = spawnSync("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script], {
    encoding: "utf8",
    timeout: 15000,
    windowsHide: true
  });
  if (r.error || r.status !== 0 || !existsSync(out)) {
    return { ok: false, err: r.error?.message || r.stderr || "preview failed", status: r.status };
  }
  const jpg = readFileSync(out);
  let meta = {};
  try { meta = JSON.parse(String(r.stdout || "{}")); } catch { meta = {}; }
  return {
    ok: true,
    file: out,
    bytes: jpg.length,
    sha16: sha16(jpg),
    width: meta.width || 0,
    height: meta.height || 0,
    data_url: "data:image/jpeg;base64," + jpg.toString("base64")
  };
}

function registerFrame(device_id, lane, look, opts = {}) {
  if (!look?.ok || !look.file) return null;
  const preview = previewFromFile(look.file, opts);
  const frame = {
    device_id,
    lane,
    transport: opts.transport || "local",
    source: opts.source || "omniscrcpy",
    captured_at: look.captured_at || new Date().toISOString(),
    full: {
      file: look.file,
      bytes: look.bytes || 0,
      sha16: look.sha16 || "",
      width: look.width || 0,
      height: look.height || 0,
      data_url_available: true
    },
    preview: preview.ok ? {
      file: preview.file,
      bytes: preview.bytes,
      sha16: preview.sha16,
      width: preview.width,
      height: preview.height,
      data_url: preview.data_url
    } : { ok: false, err: preview.err || "preview unavailable" },
    capabilities: {
      preview_feed: true,
      full_quality_sample: true,
      type_channel: opts.type_channel || "none",
      remote_ready: !!opts.remote_ready
    }
  };
  const index = readFeedIndex();
  index.frames[device_id] = frame;
  writeFeedIndex(index);
  collectGarbage({ trigger: "register-frame" });
  return frame;
}

function fullSampleFromFrame(frame) {
  if (!frame?.full?.file || !existsSync(frame.full.file)) return { ok: false, err: "full sample file unavailable", frame };
  const data = readImageDataUrl(frame.full.file);
  return { ok: true, device_id: frame.device_id, lane: frame.lane, captured_at: frame.captured_at, full: { ...frame.full, ...data } };
}

function placeholderFrame(device) {
  return {
    ...device,
    captured_at: "",
    preview: null,
    full: null,
    required: true,
    missing_frame: true,
    stale_reason: "required registered screen has no current frame in feed index",
    capabilities: {
      preview_feed: false,
      full_quality_sample: false,
      type_channel: device.source === "expected-remote" ? "remote-request-envelope" : "local-capture-endpoint",
      remote_ready: device.source === "expected-remote"
    }
  };
}

function compactFalconLoop(loop) {
  if (!loop) return null;
  return {
    ok: !!loop.ok,
    serial: loop.serial,
    before: imageSummary(loop.before),
    after_type: imageSummary(loop.after_type),
    after_enter: imageSummary(loop.after_enter),
    typed: loop.typed ? { ok: loop.typed.ok, text_length: loop.typed.text_length, warning: loop.typed.warning || "" } : null,
    enter: loop.enter ? { ok: loop.enter.ok, key: loop.enter.key, code: loop.enter.code } : null
  };
}

function readImageDataUrl(file) {
  const png = readFileSync(file);
  return {
    bytes: png.length,
    sha16: sha16(png),
    data_url: "data:image/png;base64," + png.toString("base64")
  };
}

function isBusFallbackFrame(frame) {
  return !!(
    frame?.fallback_visual_status ||
    frame?.source === "bus-fallback-not-screen" ||
    frame?.transport === "bus-fallback-status"
  );
}

function escapeSvgText(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function svgDataUrl(svg) {
  const bytes = Buffer.from(svg, "utf8");
  return {
    data_url: "data:image/svg+xml;base64," + bytes.toString("base64"),
    bytes: bytes.length,
    sha16: sha16(bytes)
  };
}

function latestBusSignal(messages, deviceId) {
  const reversed = [...(messages || [])].reverse();
  const wantsAether = String(deviceId).includes("aether");
  const ownerTerms = wantsAether ? ["aether", "aether-claude"] : ["liris", "liris-residual"];
  const ownerHit = reversed.find((m) => {
    const from = String(m?.from || "").toLowerCase();
    return ownerTerms.some((term) => from.includes(term));
  });
  const exactDeviceHit = reversed.find((m) => JSON.stringify(m || {}).toLowerCase().includes(String(deviceId).toLowerCase()));
  return ownerHit || exactDeviceHit || null;
}

function buildBusFallbackSvg({ deviceId, signal, trigger, checkedAt }) {
  const from = signal?.from || "not_observed";
  const verb = signal?.verb || signal?.type || "no_recent_owner_frame";
  const ts = signal?.ts || signal?.received_at || "";
  const pathRef = pathRefOf(signal) || "no_pathRef";
  const isAether = String(deviceId).includes("aether");
  const lines = [
    isAether ? "AETHER TWO-PATH STATUS" : "BUS FALLBACK STATUS",
    deviceId,
    "NOT SCREEN PROOF",
    "bus publish: alive if pathRef present",
    isAether ? "owner screen capture: USB/ADB path down" : "owner screen capture: not proven",
    `from: ${from}`,
    `verb: ${verb}`,
    `pathRef: ${pathRef}`,
    `signal_ts: ${ts || "unknown"}`,
    `checked_at: ${checkedAt}`,
    `trigger: ${trigger || "operator-reactive-fix"}`,
    isAether ? "fix: reseat USB or pair ADB-over-LAN" : "owner producer absent; request receipt is not frame proof"
  ];
  const body = lines.map((line, i) => {
    const y = 38 + (i * 21);
    const fill = i === 0 ? "#8bd7ff" : (i >= 2 && i <= 4 ? "#ffcf6b" : "#d9e7ff");
    const weight = i <= 4 ? "700" : "500";
    const size = i === 0 ? 20 : (i === 1 ? 16 : 12);
    return `<text x="24" y="${y}" fill="${fill}" font-size="${size}" font-weight="${weight}">${escapeSvgText(line).slice(0, 72)}</text>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="270" viewBox="0 0 480 270">
  <rect width="480" height="270" fill="#07111f"/>
  <rect x="10" y="10" width="460" height="250" fill="#0d1829" stroke="#ffcf6b" stroke-width="2" rx="6"/>
  <rect x="22" y="26" width="436" height="32" fill="#14243a" opacity="0.72"/>
  ${body}
</svg>`;
}

function busFallbackFrameForDevice({ deviceId, signal, trigger, checkedAt }) {
  const svg = buildBusFallbackSvg({ deviceId, signal, trigger, checkedAt });
  const encoded = svgDataUrl(svg);
  const pathRef = pathRefOf(signal);
  const busAlive = !!pathRef;
  const isAether = String(deviceId).includes("aether");
  return {
    device_id: deviceId,
    lane: "remote-relay",
    transport: "bus-fallback-status",
    source: "bus-fallback-not-screen",
    captured_at: checkedAt,
    pathRef,
    fallback_visual_status: true,
    fallback_reason: "owner screen producer absent; rendered latest bus signal as degraded status, not screen proof",
    owner_frame_absent: true,
    capture_channels: {
      bus_publish: busAlive ? "alive" : "not_observed",
      owner_screen_capture: "down_or_unproven",
      screen_capture_route: isAether ? "liris_usb_adb_to_aether" : "owner_remote_frame",
      operator_action: isAether ? "reseat_usb_or_pair_adb_tcpip" : "restart_owner_frame_producer",
      truth_boundary: "bus publish proves agent/message life; it does not prove live screen capture"
    },
    bus_fallback: {
      checked_at: checkedAt,
      signal_from: signal?.from || "",
      signal_verb: signal?.verb || signal?.type || "",
      signal_ts: signal?.ts || signal?.received_at || "",
      signal_pathRef: pathRef
    },
    preview: {
      width: 480,
      height: 270,
      format: "svg-status",
      bytes: encoded.bytes,
      sha16: encoded.sha16,
      data_url: encoded.data_url
    },
    full: {
      width: 480,
      height: 270,
      format: "svg-status",
      bytes: encoded.bytes,
      sha16: encoded.sha16,
      data_url_available: true
    },
    capabilities: {
      preview_feed: true,
      full_quality_sample: false,
      type_channel: "bus-fallback-status-not-screen",
      remote_ready: false,
      screen_proof: false
    }
  };
}

async function busSend(envelope) {
  const body = JSON.stringify(envelope);
  const attempts = [7000, 15000, 25000];
  let last = null;
  for (let i = 0; i < attempts.length; i++) {
    try {
      const r = await fetch(BUS_URL + "/behcs/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
        signal: AbortSignal.timeout(attempts[i])
      });
      const text = await r.text();
      let json = null;
      try { json = JSON.parse(text); } catch { /* keep text */ }
      const receipt = { ok: r.ok, status: r.status, json, text: json ? "" : text.slice(0, 2000), attempts: i + 1 };
      if (r.ok) return receipt;
      last = receipt;
    } catch (e) {
      last = { ok: false, err: e.message, attempts: i + 1 };
    }
    await new Promise((resolve) => setTimeout(resolve, 250 * (i + 1)));
  }
  return last || { ok: false, err: "bus send failed without receipt", attempts: attempts.length };
}

async function busInbox(limit = 12) {
  try {
    const r = await fetch(BUS_URL + "/behcs/inbox?last=" + encodeURIComponent(String(limit)), {
      signal: AbortSignal.timeout(4000)
    });
    const json = await r.json();
    const items = Array.isArray(json) ? json : (json.items || json.messages || []);
    return { ok: true, count: items.length, items: items.slice(-limit).map((m) => ({
      id: m.id || "",
      pathRef: m.behcs?.pathRef || m.pathRef || "",
      from: m.from || "",
      to: m.to || "",
      verb: m.verb || m.type || "",
      ts: m.ts || m.received_at || ""
    })) };
  } catch (e) {
    return { ok: false, err: e.message, items: [] };
  }
}

async function busMessages(limit = 100) {
  try {
    const r = await fetch(BUS_URL + "/behcs/inbox?last=" + encodeURIComponent(String(limit)), {
      signal: AbortSignal.timeout(5000)
    });
    const json = await r.json();
    return Array.isArray(json) ? json : (json.items || json.messages || []);
  } catch {
    return [];
  }
}

function truncateText(value, max = 520) {
  const raw = String(value || "").replace(/\s+/g, " ").trim();
  return raw.length > max ? raw.slice(0, max - 1) + "..." : raw;
}

function pathRefOf(message) {
  return message?.behcs?.pathRef || message?.pathRef || message?.id || "";
}

function messageTime(message) {
  return message?.ts || message?.received_at || "";
}

function messageAgeSeconds(message) {
  const t = parseTimeMs(messageTime(message));
  return t ? Math.max(0, Math.round((Date.now() - t) / 1000)) : null;
}

function newestMessage(messages) {
  return (messages || [])
    .filter(Boolean)
    .sort((a, b) => (parseTimeMs(messageTime(a)) || 0) - (parseTimeMs(messageTime(b)) || 0))
    .at(-1) || null;
}

function heartbeatWatchtargets(payload = {}) {
  const key = Object.keys(payload || {}).find((k) => /^watchtargets_\d+_cycles$/.test(k));
  return key ? payload[key] : {};
}

function frameRequestsFromHeartbeat(payload = {}) {
  const text = [payload.summary, payload.S2A_observation, payload.frame_request_storm_periods].map((v) => String(v || "")).join(" ");
  const hit = /FRAME_REQS\s*=\s*(\d+)/i.exec(text);
  return hit ? parseInt(hit[1], 10) : null;
}

function compactHeartbeatMessage(message) {
  if (!message) return null;
  const payload = message.payload || {};
  const frameReqs = frameRequestsFromHeartbeat(payload);
  const watchtargets = heartbeatWatchtargets(payload);
  const pendingTokens = Array.isArray(payload.cosign_tokens_still_pending)
    ? payload.cosign_tokens_still_pending.slice(0, 8)
    : [];
  return {
    id: message.id || "",
    pathRef: pathRefOf(message),
    from: message.from || "",
    to: message.to || "",
    type: message.type || "",
    verb: message.verb || "",
    ts: messageTime(message),
    age_s: messageAgeSeconds(message),
    gated: message.gated === true,
    verdict: message.d0?.verdict || "",
    cycle: payload.cycle || null,
    coms: truncateText(payload.coms || "", 120),
    summary: truncateText(payload.summary || payload.verdict || "", 700),
    watchtargets,
    frame_requests_last_poll: frameReqs,
    frame_request_state: frameReqs === 0 ? "suppressed/quiet" : (frameReqs === null ? "unknown" : "active"),
    cosign_tokens_pending: pendingTokens,
    cosign_state: pendingTokens.length ? "pending" : (String(payload.summary || "").match(/cosign.*pending/i) ? "pending" : "not_observed"),
    artifact: payload["FA-054_file_artifact"] || null
  };
}

function heartbeatLivenessState(age_s) {
  if (age_s === null || age_s === undefined) return "unknown";
  if (age_s <= 180) return "alive";
  if (age_s <= 600) return "delayed";
  return "stale";
}

function recentActorState(messages = [], pattern, maxAgeSeconds = 600) {
  const re = pattern instanceof RegExp ? pattern : new RegExp(String(pattern || "$.^"), "i");
  const msg = newestMessage((messages || []).filter((m) => re.test(String(m?.from || "")) || re.test(String(m?.to || "")) || re.test(String(m?.type || "")) || re.test(String(m?.verb || ""))));
  if (!msg) return { state: "not_observed", pathRef: "", age_s: null, type: "" };
  const age_s = messageAgeSeconds(msg);
  return {
    state: (age_s ?? 999999) <= maxAgeSeconds ? "observed" : "stale",
    pathRef: pathRefOf(msg),
    age_s,
    type: msg.type || msg.verb || "",
    from: msg.from || "",
    to: msg.to || ""
  };
}

function latestMessageMatching(messages = [], pattern) {
  const re = pattern instanceof RegExp ? pattern : new RegExp(String(pattern || "$.^"), "i");
  return newestMessage((messages || []).filter((m) => re.test(JSON.stringify({
    id: m?.id,
    from: m?.from,
    to: m?.to,
    type: m?.type,
    verb: m?.verb,
    payload: m?.payload,
    body: m?.body
  }))));
}

function behcs1024GlyphCapsules(messages = []) {
  const lewm = latestMessageMatching(messages, /LEWORLDMODEL|2603\.19312|LeWorldModel/i);
  const jesse = latestMessageMatching(messages, /SPECIAL-OP-JESSE|JRI1024|ACER_FRONTEND_ORCHESTRATION/i);
  const aether = latestMessageMatching(messages, /AETHER|aether-hookwall|UNIVERSAL_CYCLE/i);
  const liris = latestMessageMatching(messages, /LIRIS/i);
  const room37 = latestMessageMatching(messages, /ROOM37|SUPER-GULP|DUAL-GNN|PROF-SUPER-GULP/i);
  const glyphs = [
    {
      class: "G",
      pid: jesse?.pid || jesse?.payload?.route?.pid || "SPECIAL-OP-JESSE-JRI1024-PID-*",
      role: "Special OP Jesse rotating task seat",
      state: jesse ? "observed" : "not_observed",
      pathRef: pathRefOf(jesse)
    },
    {
      class: "B",
      pid: OMNISCRCPY_PID,
      role: "OmniScrcpy four-vantage visual bus",
      state: "active",
      pathRef: ""
    },
    {
      class: "V",
      pid: "VISUAL-FIELD-PID-ACER-BEHCS1024-SCREEN-BUS-MESH-2026-05-10-N00001",
      role: "OmniVision visual-field observer",
      state: "active",
      pathRef: ""
    },
    {
      class: "L",
      pid: "LEWORLDMODEL-PAPER-ARXIV-2603-19312V2",
      role: "LeWorldModel paper ingest and predictive latent monitor plan",
      state: "ingested",
      pathRef: LEWORLD_CANON_PATHREFS[0],
      latest_related_pathRef: pathRefOf(lewm)
    },
    {
      class: "C",
      pid: "PROF-GNN-FORWARD-001 + PROF-REVERSE-GNN-001",
      role: "Forward/reverse GNN review",
      state: room37 ? "room37_active" : "observing",
      pathRef: pathRefOf(room37)
    },
    {
      class: "S",
      pid: LIRIS_DESKTOP_PID,
      role: "Liris desktop producer/consumer lane",
      state: liris ? "heartbeat_seen" : "waiting",
      pathRef: pathRefOf(liris)
    },
    {
      class: "S",
      pid: LIRIS_AETHER_PID,
      role: "Aether via Liris screen and hookwall lane",
      state: aether ? "hookwall_seen" : "waiting",
      pathRef: pathRefOf(aether)
    },
    {
      class: "X",
      pid: OMNICTRL_PID_AF,
      role: "Falcon S24FE ADB/scrcpy lane",
      state: "local_adb_ready",
      pathRef: ""
    }
  ];
  return {
    state: "BEHCS1024_GLYPH_CAPSULES_ACTIVE",
    updated_at: new Date().toISOString(),
    rule: "Glyphs summarize backend proof; pathRefs and frame hashes remain authoritative.",
    leworldmodel: {
      state: "ingested",
      pathRef: LEWORLD_CANON_PATHREFS[0],
      synthesis_pathRef: LEWORLD_CANON_PATHREFS[1],
      latest_related_pathRef: pathRefOf(lewm),
      source: "arXiv 2603.19312v2",
      role: "predictive latent visual-field monitor design input"
    },
    special_op_jesse: {
      state: jesse ? "rotating_pid_observed" : "not_observed",
      pathRef: pathRefOf(jesse),
      pid: jesse?.pid || jesse?.payload?.route?.pid || "",
      note: "Logical Brown-Hilbert/JRI route only; no new bearer credential or socket is implied."
    },
    glyphs
  };
}

function remoteProducerLiftState(messages = []) {
  const relevant = (messages || []).filter((m) => /FA-054|CLASS-1|LIFT|COSIGN|RAYSSA-GO|JESSE-COSIGN|JRI1024|MSMW|MY SILICONE MY WAY|OPERATOR_ORIGIN_CANON_ROOT_ANCHOR|QUINTUPLE/i.test(JSON.stringify({
    id: m?.id,
    from: m?.from,
    to: m?.to,
    type: m?.type,
    verb: m?.verb,
    in_reply_to: m?.in_reply_to,
    payload: m?.payload,
    cosign_action: m?.cosign_action,
    attestation: m?.attestation
  })));
  const authorizedMessages = relevant.filter((m) => /FA-054[\s\S]{0,900}(2-of-2|RAYSSA-GO[\s\S]{0,200}JESSE-COSIGN|JESSE-COSIGN[\s\S]{0,200}RAYSSA-GO|lift is in effect|class-1 lift landed)/i.test(JSON.stringify(m)));
  const rootAnchorMessages = relevant.filter((m) => /JRI1024|MSMW|MY SILICONE MY WAY|OPERATOR_ORIGIN_CANON_ROOT_ANCHOR|QUINTUPLE/i.test(JSON.stringify(m)));
  const authorized = authorizedMessages.length > 0;
  const rootAnchored = rootAnchorMessages.length > 0;
  const latest = newestMessage(authorizedMessages) || newestMessage(rootAnchorMessages) || newestMessage(relevant);
  const state = authorized
    ? "lift_authorized_waiting_first_frame"
    : rootAnchored
      ? "operator_root_anchor_waiting_first_frame"
      : "request_allowed_waiting_first_frame";
  return {
    state,
    pathRef: pathRefOf(latest),
    evidence_type: latest?.type || latest?.verb || "",
    note: authorized
      ? "FA-054 lift evidence observed; promote to live only after first OMNISCRCPY_REMOTE_FRAME ingest."
      : rootAnchored
        ? "Operator-origin root/JRI/MSMW evidence observed; frame requests are allowed, but live status still requires OMNISCRCPY_REMOTE_FRAME ingest."
        : "No fresh lift/root evidence observed in current bus window; registered remote frame requests are still allowed and live status waits for backend visual proof."
  };
}

export function lirisHeartbeatFromMessages(messages = []) {
  const lirisActivity = (messages || []).filter((m) => /LIRIS/i.test(String(m?.from || "")));
  const liris = (messages || []).filter((m) => {
    const from = String(m?.from || "");
    const type = String(m?.type || "");
    const verb = String(m?.verb || "");
    return /LIRIS/i.test(from) && (/^LIRIS_HEARTBEAT/i.test(type) || /^EVT-LIRIS-HEARTBEAT/i.test(verb));
  });
  const spec = newestMessage(liris.filter((m) => /HEARTBEAT_SYSTEM_SPEC/i.test(String(m.type || m.verb || ""))));
  const statusMessages = liris.filter((m) => !/HEARTBEAT_SYSTEM_SPEC/i.test(String(m.type || m.verb || "")));
  const latest = newestMessage(statusMessages) || newestMessage(liris);
  const latestActivity = newestMessage(lirisActivity);
  const compact = compactHeartbeatMessage(latest);
  const activity = compactHeartbeatMessage(latestActivity);
  const activityAge = activity?.age_s ?? compact?.age_s ?? null;
  return {
    ok: !!(compact || activity),
    source: "acer bus /behcs/inbox",
    bus_url: BUS_URL,
    expected_cadence_s: 30,
    state: activity ? heartbeatLivenessState(activityAge) : "not_observed",
    latest: compact,
    latest_activity: activity,
    system_spec: compactHeartbeatMessage(spec),
    purpose: [
      "30-second Liris poll plus heartbeat-or-ack publication",
      "watchtarget tracking for FA-044/FA-054, Zeno, room-37, and K08",
      "frame-request storm detection and suppression confirmation",
      "ack-gated boundary state before any Liris/Aether producer is spawned"
    ]
  };
}

function meshStateFromFrame(frame) {
  if (!frame) return "not_registered";
  if (frame.missing_frame) return REMOTE_OWNER_FRAME_DEVICES.has(frame.device_id) ? "waiting_first_frame" : "missing";
  if (isBusFallbackFrame(frame)) return "bus_fallback_status";
  const age = Date.now() - (parseTimeMs(frame.captured_at) || Date.now());
  if (age > VISUAL_FRAME_FRESH_MS) return "stale";
  return frame.preview?.data_url ? "live_preview" : "metadata_only";
}

function latestAcerScreenshot() {
  try {
    if (!existsSync(ACER_SCREEN_DIR)) return null;
    const files = readdirSync(ACER_SCREEN_DIR)
      .filter((name) => /^acer-(primary|fullscreen)-.+\.png$/i.test(name))
      .map((name) => {
        const file = join(ACER_SCREEN_DIR, name);
        const st = statSync(file);
        return { file, name, mtimeMs: st.mtimeMs, bytes: st.size };
      })
      .sort((a, b) => b.mtimeMs - a.mtimeMs);
    const latest = files[0];
    if (!latest) return null;
    const buffer = readFileSync(latest.file);
    return {
      file: latest.file,
      bytes: latest.bytes,
      captured_at: new Date(latest.mtimeMs).toISOString(),
      sha16: sha16(buffer),
      source: latest.name.includes("primary") ? "primary-screen" : "virtual-fullscreen",
      limitation: latest.name.includes("primary") ? "primary-monitor evidence; all-monitor stitch may be unavailable" : "virtual-desktop evidence"
    };
  } catch (e) {
    return { ok: false, err: e.message };
  }
}

function visualDeviceState(frame) {
  const age_s = frame?.captured_at ? Math.max(0, Math.round((Date.now() - (parseTimeMs(frame.captured_at) || Date.now())) / 1000)) : null;
  const stale = age_s !== null && age_s > Math.round(VISUAL_FRAME_FRESH_MS / 1000);
  const hasPreview = !!frame?.preview?.data_url;
  const missing = !!frame?.missing_frame;
  const fallback = isBusFallbackFrame(frame);
  return {
    device_id: frame?.device_id || "unknown",
    lane: frame?.lane || "",
    visual_state: fallback ? "bus_fallback_status_visible" : (hasPreview ? (stale ? "stale_preview_visible" : "preview_live") : (missing ? "missing" : "metadata_only")),
    backend_state: fallback ? "bus_fallback_status_frame" : (missing ? "missing_frame" : (hasPreview ? (stale ? "stale_frame" : "fresh_frame") : "metadata_only")),
    resolved_state: fallback ? "degraded_bus_fallback" : (missing ? "missing" : (stale ? "stale" : (hasPreview ? "live" : "metadata_only"))),
    age_s,
    captured_at: frame?.captured_at || "",
    pathRef: frame?.pathRef || "",
    preview_sha16: frame?.preview?.sha16 || "",
    fallback_visual_status: fallback,
    capture_channels: frame?.capture_channels || null,
    stale_reason: fallback
      ? (frame?.fallback_reason || "bus fallback status frame; not screen proof")
      : (missing ? (frame?.stale_reason || "missing frame") : (stale ? "frame older than 120s visual field threshold" : ""))
  };
}

function frameNoveltyState(device = {}) {
  const now = Date.now();
  const key = device.device_id || "unknown";
  const sha = device.preview_sha16 || "";
  const pathRef = device.pathRef || "";
  const previous = FRAME_NOVELTY_MEMORY.get(key) || {};
  const sameHash = !!sha && previous.preview_sha16 === sha;
  const samePath = !!pathRef && previous.pathRef === pathRef;
  const firstSeenMs = sameHash ? (previous.first_seen_ms || now) : now;
  const sameHashSamples = sameHash ? Number(previous.same_hash_samples || 0) + 1 : 1;
  const samePathSamples = samePath ? Number(previous.same_path_samples || 0) + 1 : 1;
  const sameHashDurationS = Math.round((now - firstSeenMs) / 1000);
  const age = Number(device.age_s || 0);
  let novelty_state = sha ? (sameHash ? "same_preview_hash" : "new_preview_hash") : "no_preview_hash";
  let collapse_risk = "nominal";
  let corrective_action = "preserve_hash_lineage";

  if (!sha) {
    collapse_risk = "unknown_no_preview_hash";
    corrective_action = "require_preview_hash_before_novelty_judgment";
  } else if (sameHash && samePath && age >= 75) {
    collapse_risk = "proof_age_and_hash_static";
    corrective_action = `preemptive_refresh_for_${key}`;
  } else if (sameHash && sameHashSamples >= 4 && sameHashDurationS >= 60) {
    collapse_risk = "possible_static_scene_or_representation_collapse";
    corrective_action = `compare_against_task_context_for_${key}`;
  } else if (!sameHash) {
    corrective_action = "accept_new_visual_embedding_sample";
  }

  const next = {
    preview_sha16: sha,
    pathRef,
    first_seen_ms: firstSeenMs,
    last_seen_ms: now,
    same_hash_samples: sameHashSamples,
    same_path_samples: samePathSamples
  };
  FRAME_NOVELTY_MEMORY.set(key, next);

  return {
    novelty_state,
    collapse_risk,
    corrective_action,
    same_hash_samples: sameHashSamples,
    same_path_samples: samePathSamples,
    same_hash_duration_s: sameHashDurationS,
    previous_preview_sha16: previous.preview_sha16 || "",
    previous_pathRef: previous.pathRef || ""
  };
}

function leworldPredictCorrect(devices = [], meshResult = {}) {
  const rows = (devices || []).map((device) => {
    const remoteOwned = REMOTE_OWNER_FRAME_DEVICES.has(device.device_id);
    const novelty = frameNoveltyState(device);
    const expected_state = remoteOwned
      ? "fresh_remote_preview_data_url_from_owner_host"
      : "fresh_local_preview_data_url";
    const observed_state = device.resolved_state || "unknown";
    let surprise = 0.05;
    let corrective_action = "render_consume_and_preserve_recent_hash_lineage";
    if (observed_state === "missing") {
      surprise = 1.0;
      corrective_action = remoteOwned
        ? `owner_host_publish_OMNISCRCPY_REMOTE_FRAME_for_${device.device_id}`
        : `run_local_capture_for_${device.device_id}`;
    } else if (observed_state === "degraded_bus_fallback") {
      surprise = 0.65;
      corrective_action = String(device.device_id).includes("aether")
        ? "operator_reseat_usb_or_pair_adb_tcpip_for_aether_screen_capture"
        : `restore_owner_screen_capture_for_${device.device_id}`;
    } else if (observed_state === "stale") {
      surprise = 0.75;
      corrective_action = `force_refresh_frame_for_${device.device_id}`;
    } else if (observed_state === "metadata_only") {
      surprise = 0.55;
      corrective_action = `republish_${device.device_id}_with_preview_data_url`;
    } else if ((device.age_s ?? 0) > 60) {
      surprise = 0.25;
      corrective_action = `refresh_aging_frame_for_${device.device_id}`;
    } else if (novelty.collapse_risk === "possible_static_scene_or_representation_collapse") {
      surprise = 0.18;
      corrective_action = novelty.corrective_action;
    }
    const ageFactor = Math.min(1, Number(device.age_s || 0) / 240);
    const salience = Number((surprise * (remoteOwned ? 1.15 : 1.0) + ageFactor * 0.2).toFixed(3));
    return {
      device_id: device.device_id,
      lane: device.lane,
      expected_state,
      observed_state,
      surprise,
      salience,
      surprise_class: surprise >= 1 ? "max_missing_frame" : surprise >= 0.75 ? "high_stale" : surprise >= 0.6 ? "degraded_path_split" : surprise >= 0.5 ? "medium_metadata_gap" : surprise >= 0.2 ? "low_aging" : "nominal",
      corrective_action,
      novelty,
      proof: {
        preview_sha16: device.preview_sha16 || "",
        pathRef: device.pathRef || "",
        age_s: device.age_s,
        stale_reason: device.stale_reason || "",
        capture_channels: device.capture_channels || null
      }
    };
  });
  const maxSurprise = rows.reduce((m, row) => Math.max(m, row.surprise), 0);
  const corrective_events = rows
    .filter(row => Number(row.surprise || 0) >= 0.18 || String(row.novelty?.collapse_risk || "nominal") !== "nominal")
    .map(row => ({
      type: "LEWM_VISUAL_CORRECTIVE_EVENT",
      hookwall_event: Number(row.surprise || 0) >= 0.5 ? "VisualFieldCorrective" : "VisualFieldObserve",
      device_id: row.device_id,
      expected_state: row.expected_state,
      observed_state: row.observed_state,
      surprise: row.surprise,
      salience: row.salience,
      corrective_action: row.corrective_action,
      gc_hint: row.observed_state === "stale"
        ? "protect_latest_stale_until_owner_republishes_then_quarantine_superseded"
        : row.observed_state === "missing"
          ? "do_not_gc_absent_proof_request_owner_frame"
          : row.novelty?.collapse_risk === "possible_static_scene_or_representation_collapse"
            ? "retain_hash_lineage_for_context_compare"
            : "retain_recent",
      proof: row.proof,
      novelty: row.novelty
    }));
  const tileSalience = rows
    .map((row) => ({
      device_id: row.device_id,
      lane: row.lane,
      salience: row.salience,
      surprise: row.surprise,
      observed_state: row.observed_state,
      corrective_action: row.corrective_action
    }))
    .sort((a, b) => Number(b.salience || 0) - Number(a.salience || 0));
  return {
    state: "LEWORLDMODEL_PREDICT_CORRECT_ACTIVE",
    paper_pathRef: LEWORLD_CANON_PATHREFS[0],
    synthesis_pathRef: LEWORLD_CANON_PATHREFS[1],
    model_translation: "expected screen state from previous frame/action is compared against backend frame proof; missing frame is treated as maximal prediction error, per-tile salience prevents one stale lane from flattening the whole screen field, and preview-hash novelty guards against fresh timestamp / static-pixel collapse.",
    mesh_verdict: meshResult.current_verdict || "unknown",
    max_surprise: maxSurprise,
    tile_salience: tileSalience,
    dispatch_policy: maxSurprise >= 1
      ? "request_owner_frame_producer_then_hold_full_mesh_claim"
      : maxSurprise >= 0.5
        ? "refresh_or_republish_before_autonomous_type"
        : "render_and_continue_visible_loop",
    rows,
    corrective_events
  };
}

function visualInspectionTask(screenshot, devices = [], meshResult = {}, transport = {}, leworldmodel = {}) {
  const requiredSections = [
    { id: "top-status", expected: "server/bus/test counters and page identity visible" },
    { id: "visual-field", expected: "BEHCS-1024 Visual Field, transport table, and LEWM table visible or backend-proven" },
    { id: "screen-tiles", expected: "all registered device preview tiles visible or backend feed-proven" },
    { id: "low-data-topology", expected: "topology graph visible or mesh endpoint backend-proven" },
    { id: "omnidirectional-mesh", expected: "mesh stat/table visible or mesh endpoint backend-proven" },
    { id: "feed-details", expected: "feed details, sample metadata, and stale reasons visible or backend-proven" },
    { id: "page-bottom", expected: "bottom reached so hidden lower panels cannot be missed" }
  ];
  const backendProof = [
    { section: "visual-field", ok: !!leworldmodel?.state && !!transport?.state },
    { section: "screen-tiles", ok: Array.isArray(devices) && devices.length >= EXPECTED_SCREEN_DEVICES.length },
    { section: "low-data-topology", ok: !!meshResult?.counts && Number(meshResult.counts.directed_edges || 0) > 0 },
    { section: "omnidirectional-mesh", ok: !!meshResult?.current_verdict },
    { section: "feed-details", ok: Array.isArray(devices) && devices.every((d) => "age_s" in d && "resolved_state" in d) }
  ];
  const backendOk = backendProof.every((p) => p.ok);
  const viewportOnly = !!screenshot?.limitation || !!screenshot?.file;
  return {
    state: backendOk ? "BACKEND_SECTIONS_PROVEN_VISUAL_SCROLL_SWEEP_STILL_REQUIRED_FOR_HUMAN_UI" : "VISUAL_INSPECTION_INCOMPLETE",
    mistake_marker: "MISTAKE_SINGLE_SCREENSHOT_DOES_NOT_EQUAL_FULL_DASHBOARD",
    mistake_saved: true,
    viewport_sample_only: viewportOnly,
    scroll_required: true,
    required_loop: ["LOOK_VIEWPORT", "IDENTIFY_VISIBLE_SECTION", "COMPARE_TO_BACKEND_MODEL", "SCROLL_TO_NEXT_UNSEEN_SECTION", "THINK", "REPEAT_UNTIL_BOTTOM", "BACKEND_RECEIPT"],
    required_sections: requiredSections,
    backend_section_proof: backendProof,
    completion_condition: "Complete only when scroll sweep reaches page bottom or backend proves every required section and the visual receipt explicitly says viewport_sample_only=false or backend_sections_proven=true.",
    current_completion: backendOk ? "backend_sections_proven_but_visual_sweep_receipt_pending" : "incomplete_backend_and_visual",
    anti_drift_rule: "Do not promote one viewport screenshot to whole-dashboard truth; use scroll positions, DOM/backend sections, or full-page capture metadata."
  };
}

async function httpProbe(url, timeoutMs = 1800) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    return {
      ok: r.ok,
      status: r.status,
      url
    };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      url,
      err: e?.message || "probe failed"
    };
  }
}

async function transportPredictCorrect(devices = [], messages = []) {
  const lirisHealth = await httpProbe("http://192.168.1.4:4944/health");
  const legacyHealth = await httpProbe("http://192.168.100.2:4944/health", 900);
  const lirisHeartbeat = lirisHeartbeatFromMessages(messages);
  const remoteFrames = (devices || []).filter((d) => REMOTE_OWNER_FRAME_DEVICES.has(d.device_id));
  const staleRemote = remoteFrames.filter((d) => d.resolved_state !== "live");
  const newestRemoteAge = remoteFrames.reduce((max, d) => Math.max(max, Number(d.age_s || 0)), 0);
  const frameCadenceSurprise = staleRemote.length ? 0.75 : 0.05;
  const transportSurprise = lirisHealth.ok ? 0.05 : 0.9;
  const heartbeatSurprise = lirisHeartbeat.state === "live" ? 0.05 : lirisHeartbeat.ok ? 0.35 : 0.85;
  const legacySurprise = legacyHealth.ok ? 0.05 : 0.2;
  const rows = [
    {
      subject: "liris-ethernet-dhcp",
      expected_state: "liris dashboard reachable on router Ethernet address 192.168.1.4:4944",
      observed_state: lirisHealth.ok ? `reachable_http_${lirisHealth.status}` : `unreachable_${lirisHealth.err || lirisHealth.status}`,
      surprise: transportSurprise,
      surprise_class: transportSurprise >= 0.75 ? "transport_gap" : "nominal",
      corrective_action: lirisHealth.ok ? "use_192_168_1_4_as_current_liris_transport_fact" : "verify_liris_ethernet_dhcp_and_firewall",
      proof: lirisHealth
    },
    {
      subject: "liris-outbound-bus",
      expected_state: "liris publishes outbound heartbeats/frames to Acer bus, not inbound Acer calls to liris:4947",
      observed_state: lirisHeartbeat.state || "not_observed",
      surprise: heartbeatSurprise,
      surprise_class: heartbeatSurprise >= 0.75 ? "bus_silence" : heartbeatSurprise >= 0.3 ? "aging_heartbeat" : "nominal",
      corrective_action: heartbeatSurprise >= 0.3 ? "request_liris_heartbeat_or_rollup" : "continue_outbound_push_model",
      proof: {
        latest_pathRef: lirisHeartbeat.latest_activity?.pathRef || lirisHeartbeat.latest?.pathRef || "",
        latest_age_s: lirisHeartbeat.latest_activity?.age_s ?? lirisHeartbeat.latest?.age_s ?? null
      }
    },
    {
      subject: "liris-owner-frame-cadence",
      expected_state: "liris desktop and aether frames refreshed under 120s while Screen Wall is active",
      observed_state: staleRemote.length ? `stale_remote_frames:${staleRemote.map((d) => d.device_id).join(",")}` : "remote_frames_live",
      surprise: frameCadenceSurprise,
      surprise_class: frameCadenceSurprise >= 0.75 ? "cadence_gap" : "nominal",
      corrective_action: staleRemote.length ? "trigger_SUP_LIRIS_AUTO_REFRESH_001_or_operator_refresh" : "render_and_continue",
      proof: {
        newest_remote_age_s: newestRemoteAge,
        stale_remote_devices: staleRemote.map((d) => ({
          device_id: d.device_id,
          age_s: d.age_s,
          pathRef: d.pathRef || "",
          preview_sha16: d.preview_sha16 || ""
        }))
      }
    },
    {
      subject: "legacy-direct-wire-100x",
      expected_state: "legacy 192.168.100.x is optional historical route, not current live proof",
      observed_state: legacyHealth.ok ? `reachable_http_${legacyHealth.status}` : "not_reachable_or_not_serving",
      surprise: legacySurprise,
      surprise_class: legacyHealth.ok ? "legacy_path_available" : "canon_retired_or_unproven",
      corrective_action: legacyHealth.ok ? "record_as_secondary_path" : "do_not_block_on_100x_direct_wire",
      proof: legacyHealth
    }
  ];
  const maxSurprise = rows.reduce((m, row) => Math.max(m, Number(row.surprise || 0)), 0);
  const conclusion = !lirisHealth.ok
    ? "transport_unreachable"
    : staleRemote.length
      ? "transport_live_frame_cadence_gap"
      : "transport_and_frames_live";
  return {
    state: "BEHCS1024_TRANSPORT_PREDICT_CORRECT_ACTIVE",
    paper_pathRef: LEWORLD_CANON_PATHREFS[0],
    model_translation: "network route, heartbeat route, and frame cadence are separate latent variables; only frame cadence may keep Screen Wall in partial mesh after transport is live.",
    max_transport_surprise: maxSurprise,
    conclusion,
    route_policy: conclusion === "transport_live_frame_cadence_gap"
      ? "stop_debugging_ethernet_and_trigger_owner_frame_cadence"
      : conclusion === "transport_unreachable"
        ? "repair_transport_before_frame_expectation"
        : "render_and_continue_visible_loop",
    current_liris_host: "192.168.1.4",
    rows
  };
}

function controlLaneState(from, to) {
  if (from.node_id === "acer" && to.node_id === "falcon") return "live_adb_visible";
  if (from.node_id === "liris" && to.node_id === "aether") return "operator_scrcpy_visible";
  if ((to.node_id === "liris" || to.node_id === "aether") && from.node_id === "acer") return "fabric_request_allowed_visual_proof_pending";
  if (to.node_id === "acer" && from.node_id !== "acer") return "not_armed_ack_only";
  return "planned_no_direct_type";
}

function buildOmniMesh(feedResult, messages = []) {
  const frames = new Map((feedResult.devices || []).map((frame) => [frame.device_id, frame]));
  const liris = feedResult.liris_heartbeat || lirisHeartbeatFromMessages(messages);
  const remoteLift = remoteProducerLiftState(messages);
  const observed = {
    acer: recentActorState(messages, /acer-sidecar|ACER-OMNISCRCPY/i),
    liris: recentActorState(messages, /LIRIS/i),
    falcon: recentActorState(messages, /FALCON|asolaria@falcon|room-40/i),
    aether: recentActorState(messages, /AETHER|aether-hookwall/i)
  };
  const nodes = OMNIMESH_NODES.map((node) => {
    const frame = frames.get(node.screen_device_id) || null;
    const frame_state = meshStateFromFrame(frame);
    const remoteOwned = REMOTE_OWNER_FRAME_DEVICES.has(node.screen_device_id);
    const hasPreview = !!frame?.preview?.data_url;
    const screenProofLive = frame_state === "live_preview";
    const busFallbackVisible = frame_state === "bus_fallback_status";
    const producer_state = screenProofLive
      ? "publishing"
      : busFallbackVisible
        ? "bus_fallback_waiting_owner_frame"
        : (remoteOwned ? remoteLift.state : frame_state);
    return {
      ...node,
      frame_state,
      frame_pathRef: frame?.pathRef || "",
      captured_at: frame?.captured_at || "",
      preview_available: hasPreview,
      preview_live: screenProofLive,
      screen_proof_live: screenProofLive,
      bus_fallback_visible: busFallbackVisible,
      missing_frame: !!frame?.missing_frame,
      mets_state: node.node_id === "liris" ? liris.state : observed[node.node_id]?.state,
      mets_pathRef: node.node_id === "liris" ? (liris.latest_activity?.pathRef || liris.latest?.pathRef || "") : observed[node.node_id]?.pathRef,
      producer_state,
      producer_authority_pathRef: remoteOwned ? remoteLift.pathRef : ""
    };
  });
  const edges = [];
  for (const from of nodes) {
    for (const to of nodes) {
      if (from.node_id === to.node_id) continue;
      edges.push({
        id: `${from.node_id}->${to.node_id}`,
        from: from.node_id,
        to: to.node_id,
        frame: from.screen_proof_live ? "servable_to_consumer" : (from.bus_fallback_visible ? "bus_fallback_status_only" : from.producer_state),
        mets: from.mets_state || "unknown",
        type_control: controlLaneState(from, to),
        status: from.screen_proof_live && from.mets_state !== "not_observed" ? "partial_live" : (from.bus_fallback_visible ? "degraded_fallback" : "incomplete"),
        next_action: from.screen_proof_live ? "render/consume" : (from.bus_fallback_visible ? "restore_owner_screen_frame_producer" : "capture_or_ingest_frame")
      });
    }
  }
  const liveFrameCount = nodes.filter((n) => n.screen_proof_live).length;
  const fallbackFrameCount = nodes.filter((n) => n.bus_fallback_visible).length;
  const activeMetsCount = nodes.filter((n) => !["not_observed", "stale", undefined].includes(n.mets_state)).length;
  const fullMeshLive = liveFrameCount === nodes.length && activeMetsCount === nodes.length;
  const partialMeshWithFallback = liveFrameCount >= 2 && fallbackFrameCount > 0;
  const partialMeshLive = liveFrameCount >= 2 && activeMetsCount >= 3;
  const currentVerdict = fullMeshLive
    ? "FULL_MESH_LIVE"
    : partialMeshWithFallback
      ? "PARTIAL_MESH_WITH_BUS_FALLBACK"
      : partialMeshLive ? "PARTIAL_MESH_LIVE" : "MESH_INCOMPLETE";
  const authorityCurrent = fullMeshLive
    ? "Acer/Falcon/Liris/Aether all have live frame producers and active mets; continue cadence monitoring and do not expand control scope without separate authority."
    : fallbackFrameCount > 0
      ? "Acer/Falcon have live screen proof; Liris/Aether are visible only through bus fallback status frames and still require owner OMNISCRCPY_REMOTE_FRAME screen proof before full mesh is claimed."
      : "Acer/Falcon local producers are live; Liris/Aether registered owner-producers require fresh OMNISCRCPY_REMOTE_FRAME ingest before full mesh is claimed.";
  return {
    ok: true,
    generated_at: new Date().toISOString(),
    mesh_id: "OMNIMESH-4X4-ACER-LIRIS-FALCON-AETHER-BEHCS1024",
    topology: "4 nodes, 12 directed cross-device lanes, 4 self-capture lanes",
    current_verdict: currentVerdict,
    nodes,
    edges,
    counts: {
      nodes: nodes.length,
      directed_edges: edges.length,
      live_frame_producers: liveFrameCount,
      bus_fallback_status_frames: fallbackFrameCount,
      preview_visible_total: nodes.filter((n) => n.preview_available).length,
      active_mets_producers: activeMetsCount,
      gated_remote_producers: nodes.filter((n) => n.producer_state === "producer_auth_pending").length,
      remote_producers_waiting_first_frame: nodes.filter((n) => /waiting_first_frame/i.test(n.producer_state || "")).length
    },
    authority: {
      current: authorityCurrent,
      class1_required_for: ["autonomous remote type/control", "unregistered devices", "secret/restricted content disclosure"],
      pending_tokens: liris.latest?.cosign_tokens_pending || [],
      remote_lift: remoteLift
    },
    design_rule: "Every node must be both producer and consumer: frames via OMNISCRCPY_REMOTE_FRAME, metrics via heartbeat/OmniMets, typing via explicit gated kick lanes."
  };
}

function remoteFramesFromMessages(messages) {
  const frames = [];
  for (const m of messages || []) {
    if (m?.type === "OMNISCRCPY_REMOTE_FRAME" || m?.verb === "EVT-OMNISCRCPY-REMOTE-FRAME") {
      const p = m.payload || {};
      frames.push({
        device_id: p.device_id || m.from || "remote-device",
        lane: p.lane || "remote-relay",
        transport: p.transport || "bus-relay",
        source: m.from || "remote",
        captured_at: p.captured_at || m.ts || m.received_at || "",
        preview: p.preview || null,
        full: p.full || null,
        pathRef: m.behcs?.pathRef || m.pathRef || "",
        capabilities: {
          preview_feed: !!p.preview?.data_url,
          full_quality_sample: !!(p.full?.data_url || p.full?.artifact_url || p.full?.file),
          type_channel: p.type_channel || "remote-request-envelope",
          remote_ready: true
        }
      });
    }
    if (m?.type === "LIRIS_AETHER_HANDOFF_BEFORE_AFTER_LOOK_RECEIPT") {
      const p = m.autochrone_LOOK_pair_aether || {};
      frames.push({
        device_id: "aether-a06-via-liris",
        lane: "liris-aether",
        transport: "sister-bus-receipt",
        source: m.from || "LIRIS",
        captured_at: m.ts || m.received_at || "",
        preview: null,
        full: {
          file: p.LOOK_2_after?.file || "",
          bytes: p.LOOK_2_after?.size_bytes || 0,
          sha16: p.LOOK_2_after?.sha16 || "",
          remote_path_only: true
        },
        pathRef: m.behcs?.pathRef || "",
        delta: p.delta || null,
        capabilities: {
          preview_feed: false,
          full_quality_sample: false,
          type_channel: "liris local adb/scrcpy",
          remote_ready: true
        }
      });
    }
  }
  return frames.map((frame) => sanitizeFrameForStorage(frame));
}

export function cadencePlan() {
  return {
    bus_poll_seconds: 30,
    visual_check_seconds: 60,
    backend_daemon: false,
    driver: "visible browser tab plus explicit backend endpoints",
    loop: ["look desktop", "look Falcon", "read bus", "think next action", "type only on explicit kick", "look again", "emit receipt"]
  };
}

export function messageChannelMap() {
  return [
    {
      id: "behcs-bus",
      surface: "http://127.0.0.1:4947/behcs",
      purpose: "Durable fabric envelopes: build receipts, frame requests, heartbeats, watchtarget acks, and governance state.",
      dashboard_role: "source of truth for cross-colony coordination"
    },
    {
      id: "liris-heartbeat",
      surface: "LIRIS_HEARTBEAT_30S envelopes on the BEHCS bus",
      purpose: "Liris health, cycle count, watchtargets, frame-request storm state, and Class-1 boundary/cosign status.",
      dashboard_role: "control-plane signal that tells Acer whether Liris/Aether frames are alive, gated, or stale"
    },
    {
      id: "omniscrcpy-remote-frame",
      surface: "OMNISCRCPY_REMOTE_FRAME envelopes",
      purpose: "Low-bandwidth preview screenshots plus full-sample metadata for remote or off-host screens.",
      dashboard_role: "visual mirror feed for Aether/Liris/Falcon/Acer screens"
    },
    {
      id: "hookwall-events",
      surface: "aether-hookwall and local hookwall event streams",
      purpose: "Tool calls, prompt submits, notifications, and UI actions converted into PID/GNN edges.",
      dashboard_role: "anti-drift audit trail for what agents are actually doing"
    },
    {
      id: "room-40-and-relay",
      surface: "room-40 files plus codex-bridge/asolaria_bridge",
      purpose: "Human/agent coordination, proposals, cosign requests, and durable file artifacts like FA-054.",
      dashboard_role: "operator-visible collaboration lane, not the same thing as the bus"
    }
  ];
}

export function status() {
  ensureDir();
  const falcon = falconStatusRaw();
  return {
    ok: true,
    pid: OMNISCRCPY_PID,
    runtime_dir: RUNTIME_DIR,
    generated_at: new Date().toISOString(),
    halt_state: readHaltState(),
    history_file: HISTORY_FILE,
    lanes: LANES,
    cadence: cadencePlan(),
    falcon,
    reserved_pids: RESERVED_OMNICTRL_PIDS.concat([LIRIS_AETHER_PID, LIRIS_DESKTOP_PID, FRONTEND_LOOP_PID]),
    feed_contract: {
      preview: "low-bandwidth JPEG data_url for operator dashboard feed",
      full_sample: "full PNG sample returned only on explicit sample/look request",
      remote: "remote/off-LAN devices must publish signed/allowed bus envelopes or bridge-relay frames; dashboard does not open unauthenticated internet control",
      registered_devices_only: true,
      universal_gc: "runtime images + feed-index frames + action history are garbage-collected for all registered devices",
      required_screen_devices: EXPECTED_SCREEN_DEVICES.map((d) => d.device_id),
      operator_authorized_waiting_first_frame_devices: ["aether-a06-via-liris", "liris-desktop-via-bus"],
      boundary_state: "Operator-origin MSMW/JRI root anchor permits registered remote frame requests through the fabric; dashboard live status still requires OMNISCRCPY_REMOTE_FRAME preview.data_url from the owner device."
    },
    message_channels: messageChannelMap(),
    behcs1024_glyph_capsules: behcs1024GlyphCapsules([]),
    gc_policy: gcPolicy(),
    gc_state: readGcState(),
    routes: [
      "GET /api/omniscrcpy/status",
      "GET /api/omniscrcpy/heartbeat",
      "POST /api/omniscrcpy/desktop-look",
      "POST /api/omniscrcpy/falcon-look",
      "POST /api/omniscrcpy/kick",
      "POST /api/omniscrcpy/tick",
      "GET /api/omniscrcpy/history",
      "POST /api/omniscrcpy/halt",
      "POST /api/omniscrcpy/resume",
      "POST /api/omniscrcpy/verdict",
      "GET /api/omniscrcpy/feed",
      "GET /api/omniscrcpy/mesh",
      "GET /api/omniscrcpy/sample",
      "POST /api/omniscrcpy/remote-request",
      "POST /api/omniscrcpy/remote-ingest"
    ],
    mistakes_saved: MISTAKES
  };
}

export async function heartbeatStatus(limit = 240) {
  const messages = await busMessages(limit);
  return {
    ok: true,
    generated_at: new Date().toISOString(),
    heartbeat: lirisHeartbeatFromMessages(messages),
    message_channels: messageChannelMap()
  };
}

export async function frontendHeartbeat(opts = {}) {
  const visual = await visualFieldState(opts.limit || 300);
  const envelope = {
    from: "ACER-FRONTEND-VISUAL-OPERATOR",
    to: "@ASOLARIA-CHIEF @SPECIAL-OP-JESSE @OP-JESSE @OP-RAYSSA @LIRIS @AETHER @FALCON @ACER-OMNISCRCPY-CONTROLLER @SUP-HOOK-001 @SUP-SHANNON-001 @PROF-OMNIVISION-001 @PROF-AUTOCHRONE-001 @QUAD-FALCON-ACER-LIRIS-AETHER",
    type: "ACER_FRONTEND_HEARTBEAT_30S",
    verb: "EVT-ACER-FRONTEND-HEARTBEAT",
    id: "acer-frontend-heartbeat-" + createHash("sha256").update(String(Date.now()) + "|" + (opts.trigger || "screenwall")).digest("hex").slice(0, 16),
    pid: "ACER-PID-H740C-A07-W104-P00-N00000",
    payload: {
      trigger: opts.trigger || "screenwall-auto",
      surface: "Chrome Screen Wall + Codex visible operator loop",
      cadence_s: 30,
      visual_verdict: visual.resolved_verdict,
      live_frame_producers: visual.live_frame_producers,
      stale_remote_frames: visual.stale_remote_frames,
      max_surprise: visual.leworldmodel_predict_correct?.max_surprise ?? null,
      dispatch_policy: visual.leworldmodel_predict_correct?.dispatch_policy || "",
      visual_inspection_task: {
        state: visual.visual_inspection_task?.state || "",
        mistake_marker: visual.visual_inspection_task?.mistake_marker || "",
        viewport_sample_only: !!visual.visual_inspection_task?.viewport_sample_only,
        scroll_required: !!visual.visual_inspection_task?.scroll_required,
        current_completion: visual.visual_inspection_task?.current_completion || "",
        required_loop: visual.visual_inspection_task?.required_loop || []
      },
      rows: (visual.leworldmodel_predict_correct?.rows || []).map((r) => ({
        device_id: r.device_id,
        observed_state: r.observed_state,
        surprise: r.surprise,
        corrective_action: r.corrective_action,
        pathRef: r.proof?.pathRef || "",
        age_s: r.proof?.age_s ?? null
      })),
      loop: "front-end LOOK -> backend visual-field -> LEWM predict-correct -> bus heartbeat -> remote refresh if stale"
    },
    ts: new Date().toISOString()
  };
  const receipt = opts.emit === false ? null : await busSend(envelope);
  appendHistory({
    chain_id: chainId("frontend-heartbeat"),
    channel: "acer-frontend-heartbeat",
    action: "heartbeat",
    outcome: visual.resolved_verdict,
    reason: (visual.stale_remote_frames || []).join(",") || "all-live",
    receipt_pathRef: receipt?.json?.behcs?.pathRef || ""
  });
  return { ok: true, visual, receipt };
}

export async function statusLive(limit = 240) {
  const messages = await busMessages(limit);
  return {
    ...status(),
    liris_heartbeat: lirisHeartbeatFromMessages(messages),
    behcs1024_glyph_capsules: behcs1024GlyphCapsules(messages)
  };
}

export function desktopLook(opts = {}) {
  ensureDir();
  const file = join(RUNTIME_DIR, `${stamp()}-${safeLabel(opts.label || "desktop")}.png`);
  const psPath = file.replace(/'/g, "''");
  const script = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$bmp = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)
$bmp.Save('${psPath}', [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
[pscustomobject]@{ ok=$true; width=$bounds.Width; height=$bounds.Height; file='${psPath}'; captured_at=(Get-Date).ToUniversalTime().ToString('o') } | ConvertTo-Json -Compress
`;
  const r = spawnSync("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script], {
    encoding: "utf8",
    timeout: 15000,
    windowsHide: true
  });
  if (r.error || r.status !== 0 || !existsSync(file)) {
    return { ok: false, step: "DESKTOP_LOOK", err: r.error?.message || r.stderr || "screenshot failed", status: r.status };
  }
  const img = readImageDataUrl(file);
  let meta = {};
  try { meta = JSON.parse(String(r.stdout || "{}")); } catch { meta = {}; }
  const result = {
    ok: true,
    step: "DESKTOP_LOOK",
    file,
    bytes: img.bytes,
    sha16: img.sha16,
    data_url: img.data_url,
    width: meta.width || 0,
    height: meta.height || 0,
    captured_at: meta.captured_at || new Date().toISOString()
  };
  result.feed_frame = registerFrame("acer-desktop", "acer-frontend", result, {
    source: "desktopLook",
    transport: "local-desktop-capture",
    type_channel: "front-end dashboard commands"
  });
  return result;
}

export function falconLook(opts = {}) {
  const result = falconLookRaw({ ...(opts || {}), label: opts.label || "omniscrcpy-falcon" });
  if (result.ok) {
    result.feed_frame = registerFrame("falcon-s24fe", "acer-falcon", result, {
      source: "falconLook",
      transport: "local-adb-usb",
      type_channel: "adb input text/keyevent",
      remote_ready: false
    });
  }
  return result;
}

export function buildHandoffEnvelope(text, opts = {}) {
  const msg = boundedText(text);
  return {
    from: "ACER-OMNISCRCPY-CONTROLLER",
    to: "@LIRIS @AETHER @ASOLARIA-CHIEF @TRIAD-FALCON-ACER-LIRIS",
    type: "OMNISCRCPY_LIRIS_AETHER_HANDOFF",
    verb: "EVT-OMNISCRCPY-LIRIS-AETHER-HANDOFF",
    id: "omniscrcpy-liris-aether-handoff-" + createHash("sha256").update(msg + "|" + Date.now()).digest("hex").slice(0, 16),
    pid: LIRIS_AETHER_PID,
    payload: {
      requested_by: "Acer visible OmniScrcpy tab",
      chain_id: opts.chain_id || "",
      mode: "LOOK-TYPE-ENTER-LOOK on Liris-connected Aether",
      text: msg,
      text_chars: msg.length,
      aether_hint: {
        device: "Aether A06",
        serial_hint: "R9QY205KAKJ",
        lane: "Liris local ADB/scrcpy"
      },
      method: [
        "LOOK with adb exec-out screencap -p",
        "TYPE with adb shell input text after space-to-%s encoding",
        "ENTER with adb shell input keyevent 66",
        "LOOK again and report image path/sha plus visible verdict"
      ],
      context: opts.context || "cross-colony typing initiative",
      guardrails: [
        "Liris executes only if Aether focus is visually confirmed",
        "No hidden daemon; receipt must include before/after look",
        "If API socket is unavailable, type only a visible concise kick message"
      ]
    }
  };
}

export async function requestLirisAether(text, opts = {}) {
  const envelope = buildHandoffEnvelope(text, opts);
  const receipt = await busSend(envelope);
  return { ok: receipt.ok, envelope, receipt };
}

export async function tick(opts = {}) {
  const chain_id = opts.chain_id || chainId("tick");
  const minIntervalMs = Math.max(10000, Number(opts.min_interval_ms || 25000));
  const nowMs = Date.now();
  const guard = readVisibleTickGuard();
  if (opts.force_tick !== true && guard.last_emit_ms && nowMs - guard.last_emit_ms < minIntervalMs) {
    const row = appendHistory({
      chain_id,
      channel: "acer-visible-tick",
      action: "tick",
      before_sha: "",
      after_sha: "",
      outcome: "throttled",
      reason: "visible-loop-cadence-guard",
      receipt_pathRef: guard.pathRef || ""
    });
    return {
      ok: true,
      throttled: true,
      pid: OMNISCRCPY_PID,
      chain_id,
      min_interval_ms: minIntervalMs,
      wait_ms: Math.max(0, minIntervalMs - (nowMs - guard.last_emit_ms)),
      previous: guard,
      history: row
    };
  }
  writeVisibleTickGuard({ last_emit_ms: nowMs, chain_id, pathRef: "", reason: "tick-started" });
  const visual = opts.visual !== false;
  const desktop = visual ? desktopLook({ label: opts.label || "tick-desktop" }) : null;
  const falcon = opts.falcon_look === false ? null : falconLook({ label: opts.label || "tick-falcon" });
  const inbox = await busInbox(opts.inbox_limit || 12);
  const next_actions = [
    falcon?.ok ? "Falcon visible; continue watched front-end loop" : "Falcon look failed; check ADB/scrcpy focus before typing",
    "Liris/Aether remains handoff-driven until Liris returns before/after look receipt",
    "Use Kick only for concise action messages; long plans stay in bus envelopes"
  ];
  const envelope = {
    from: "ACER-OMNISCRCPY-CONTROLLER",
    to: "@ASOLARIA-CHIEF @OP-JESSE @LIRIS @FALCON",
    type: "OMNISCRCPY_VISIBLE_TICK",
    verb: "EVT-OMNISCRCPY-VISIBLE-TICK",
    id: "omniscrcpy-visible-tick-" + createHash("sha256").update(JSON.stringify({ t: Date.now(), visual })).digest("hex").slice(0, 16),
    pid: OMNISCRCPY_PID,
    payload: {
      chain_id,
      cadence: cadencePlan(),
      desktop: imageSummary(desktop),
      falcon: imageSummary(falcon),
      inbox_count: inbox.count || 0,
      next_actions
    }
  };
  const receipt = opts.emit === false ? null : await busSend(envelope);
  writeVisibleTickGuard({ last_emit_ms: nowMs, chain_id, pathRef: receipt?.json?.behcs?.pathRef || "", reason: "tick-emitted" });
  appendHistory({
    chain_id,
    channel: "acer-visible-tick",
    action: "tick",
    before_sha: "",
    after_sha: falcon?.sha16 || desktop?.sha16 || "",
    outcome: "observed",
    receipt_pathRef: receipt?.json?.behcs?.pathRef || ""
  });
  return { ok: true, pid: OMNISCRCPY_PID, chain_id, desktop, falcon, inbox, next_actions, receipt };
}

export async function kick(text, opts = {}) {
  const halted = readHaltState();
  if (halted.halted && opts.override_halt !== true) {
    const row = appendHistory({
      chain_id: opts.chain_id || chainId("halted"),
      channel: "acer-falcon+liris-aether",
      action: "kick",
      outcome: "halted",
      operator_verdict: "halted",
      reason: halted.reason
    });
    return { ok: false, pid: OMNISCRCPY_PID, halted: true, halt_state: halted, history: row };
  }
  const chain_id = opts.chain_id || chainId("kick");
  const msg = boundedText(text);
  const before_desktop = desktopLook({ label: "kick-before-desktop" });
  const falcon_loop = opts.falcon === false ? null : lookTypeEnterLook(msg, opts);
  const after_desktop = desktopLook({ label: "kick-after-desktop" });
  const liris = opts.liris === false ? null : await requestLirisAether(msg, { context: opts.context || "paired Falcon+Aether kick", chain_id });
  const envelope = {
    from: "ACER-OMNISCRCPY-CONTROLLER",
    to: "@ASOLARIA-CHIEF @OP-JESSE @LIRIS @FALCON @AETHER",
    type: "OMNISCRCPY_KICK_CYCLE",
    verb: "EVT-OMNISCRCPY-KICK-CYCLE",
    id: "omniscrcpy-kick-cycle-" + createHash("sha256").update(msg + "|" + Date.now()).digest("hex").slice(0, 16),
    pid: OMNISCRCPY_PID,
    payload: {
      chain_id,
      text_chars: msg.length,
      before_desktop: imageSummary(before_desktop),
      after_desktop: imageSummary(after_desktop),
      falcon: compactFalconLoop(falcon_loop),
      liris_handoff_id: liris?.envelope?.id || "",
      loop: "desktop-look -> Falcon LOOK-TYPE-LOOK-ENTER-LOOK -> desktop-look -> Liris/Aether handoff -> receipt"
    }
  };
  const receipt = await busSend(envelope);
  const feedback = {
    from: "ACER-OMNISCRCPY-CONTROLLER",
    to: "@ASOLARIA-CHIEF @OP-JESSE @LIRIS @FALCON @AETHER @GNN @REVERSE-GAIN-GNN",
    type: "OMNISCRCPY_VISUAL_FEEDBACK",
    verb: "EVT-OMNISCRCPY-VISUAL-FEEDBACK",
    id: "omniscrcpy-visual-feedback-" + createHash("sha256").update(chain_id).digest("hex").slice(0, 16),
    pid: OMNISCRCPY_PID,
    payload: {
      chain_id,
      channel: "AF+LE",
      before_desktop: imageSummary(before_desktop),
      after_desktop: imageSummary(after_desktop),
      falcon: compactFalconLoop(falcon_loop),
      outcome: (!falcon_loop || falcon_loop.ok) ? "partial-success-needs-operator-verdict" : "failed",
      operator_verdict_needed: true
    }
  };
  const feedbackReceipt = await busSend(feedback);
  const history = appendHistory({
    chain_id,
    channel: "AF+LE",
    action: "kick",
    intent: msg,
    before_sha: falcon_loop?.before?.sha16 || before_desktop.sha16 || "",
    after_sha: falcon_loop?.after_enter?.sha16 || after_desktop.sha16 || "",
    desktop_before_sha: before_desktop.sha16 || "",
    desktop_after_sha: after_desktop.sha16 || "",
    outcome: feedback.payload.outcome,
    receipt_pathRef: receipt?.json?.behcs?.pathRef || "",
    feedback_pathRef: feedbackReceipt?.json?.behcs?.pathRef || "",
    liris_pathRef: liris?.receipt?.json?.behcs?.pathRef || ""
  });
  return {
    ok: (!falcon_loop || falcon_loop.ok) && (!liris || liris.ok),
    pid: OMNISCRCPY_PID,
    chain_id,
    text_chars: msg.length,
    before_desktop,
    falcon_loop,
    after_desktop,
    liris,
    receipt,
    feedbackReceipt,
    history
  };
}

export async function halt(reason = "operator halt") {
  const state = writeHaltState(true, reason);
  const receipt = await busSend({
    from: "ACER-OMNISCRCPY-CONTROLLER",
    to: "@ASOLARIA-CHIEF @OP-JESSE @LIRIS @FALCON @AETHER @SUPERVISORS",
    type: "OMNISCRCPY_MASTER_HALT",
    verb: "EVT-OPERATOR-KICK-MASTER-HALT",
    id: "omniscrcpy-master-halt-" + createHash("sha256").update(state.updated_at + "|" + state.reason).digest("hex").slice(0, 16),
    pid: OMNISCRCPY_PID,
    payload: { state }
  });
  appendHistory({ chain_id: chainId("halt"), channel: "all", action: "halt", outcome: "halted", reason: state.reason, receipt_pathRef: receipt?.json?.behcs?.pathRef || "" });
  return { ok: true, state, receipt };
}

export async function resume(reason = "operator resume") {
  const state = writeHaltState(false, reason);
  const receipt = await busSend({
    from: "ACER-OMNISCRCPY-CONTROLLER",
    to: "@ASOLARIA-CHIEF @OP-JESSE @LIRIS @FALCON @AETHER @SUPERVISORS",
    type: "OMNISCRCPY_MASTER_RESUME",
    verb: "EVT-OPERATOR-KICK-RESUME-ALL",
    id: "omniscrcpy-master-resume-" + createHash("sha256").update(state.updated_at + "|" + state.reason).digest("hex").slice(0, 16),
    pid: OMNISCRCPY_PID,
    payload: { state }
  });
  appendHistory({ chain_id: chainId("resume"), channel: "all", action: "resume", outcome: "resumed", reason: state.reason, receipt_pathRef: receipt?.json?.behcs?.pathRef || "" });
  return { ok: true, state, receipt };
}

export async function verdict(chain_id, verdictValue, note = "") {
  const allowed = new Set(["worked", "misfired", "ambiguous"]);
  const v = allowed.has(String(verdictValue)) ? String(verdictValue) : "ambiguous";
  const row = appendHistory({
    chain_id: String(chain_id || chainId("verdict")),
    channel: "operator-verdict",
    action: "verdict",
    operator_verdict: v,
    note: String(note || ""),
    outcome: "verdict-recorded"
  });
  const receipt = await busSend({
    from: "ACER-OMNISCRCPY-CONTROLLER",
    to: "@ASOLARIA-CHIEF @OP-JESSE @GNN @REVERSE-GAIN-GNN @LIRIS @FALCON",
    type: "OMNISCRCPY_OPERATOR_VERDICT",
    verb: "EVT-OMNISCRCPY-OPERATOR-VERDICT",
    id: "omniscrcpy-operator-verdict-" + createHash("sha256").update(row.chain_id + "|" + v + "|" + row.ts).digest("hex").slice(0, 16),
    pid: OMNISCRCPY_PID,
    payload: row
  });
  return { ok: true, row, receipt };
}

export function history(limit = 40) {
  return { ok: true, file: HISTORY_FILE, items: readHistory(limit) };
}

export async function feed(limit = 80) {
  const policy = gcPolicy();
  const index = readFeedIndex();
  const messages = await busMessages(limit);
  const remote = remoteFramesFromMessages(messages);
  const liris_heartbeat = lirisHeartbeatFromMessages(messages);
  let changed = false;
  for (const frame of remote) {
    if (!frame?.device_id) continue;
    const age = Date.now() - (parseTimeMs(frame.captured_at) || Date.now());
    if (age > policy.frame_ttl_ms) continue;
    const prior = index.frames?.[frame.device_id];
    if (!prior || String(frame.captured_at || "") >= String(prior.captured_at || "")) {
      index.frames[frame.device_id] = sanitizeFrameForStorage(frame, policy);
      changed = true;
    }
  }
  if (changed) writeFeedIndex(index);
  const gc = collectGarbage({ trigger: "feed" });
  const postGcIndex = readFeedIndex();
  const local = Object.values(postGcIndex.frames || {});
  const byDevice = new Map();
  for (const f of local.concat(remote)) {
    if (!f?.device_id) continue;
    const age = Date.now() - (parseTimeMs(f.captured_at) || Date.now());
    if (age > policy.frame_ttl_ms) continue;
    const prior = byDevice.get(f.device_id);
    if (!prior || String(f.captured_at || "") >= String(prior.captured_at || "")) byDevice.set(f.device_id, f);
  }
  const fallbackCheckedAt = new Date().toISOString();
  for (const device of EXPECTED_SCREEN_DEVICES) {
    if (!REMOTE_OWNER_FRAME_DEVICES.has(device.device_id)) continue;
    const existing = byDevice.get(device.device_id);
    const state = meshStateFromFrame(existing);
    const needsFallbackStatus = !existing || state === "waiting_first_frame" || state === "missing" || state === "metadata_only" || state === "stale" || state === "bus_fallback_status";
    if (needsFallbackStatus && state !== "live_preview") {
      const signal = latestBusSignal(messages, device.device_id);
      byDevice.set(device.device_id, busFallbackFrameForDevice({
        deviceId: device.device_id,
        signal,
        trigger: "feed-auto-fallback-status-refresh",
        checkedAt: fallbackCheckedAt
      }));
    }
  }
  for (const device of EXPECTED_SCREEN_DEVICES) {
    if (!byDevice.has(device.device_id)) byDevice.set(device.device_id, placeholderFrame(device));
  }
  return {
    ok: true,
    feed_index_file: FEED_INDEX_FILE,
    generated_at: new Date().toISOString(),
    gc,
    contract: status().feed_contract,
    liris_heartbeat,
    message_channels: messageChannelMap(),
    devices: Array.from(byDevice.values()).sort((a, b) => String(b.captured_at || "").localeCompare(String(a.captured_at || "")))
  };
}

export async function mesh(limit = 240) {
  const messages = await busMessages(limit);
  const feedResult = await feed(limit);
  return buildOmniMesh(feedResult, messages);
}

export async function visualFieldState(limit = 300) {
  const messages = await busMessages(limit);
  const feedResult = await feed(limit);
  const meshResult = buildOmniMesh(feedResult, messages);
  const screenshot = latestAcerScreenshot();
  const devices = (feedResult.devices || []).map(visualDeviceState);
  const leworldmodel = leworldPredictCorrect(devices, meshResult);
  const transport = await transportPredictCorrect(devices, messages);
  const visual_inspection_task = visualInspectionTask(screenshot, devices, meshResult, transport, leworldmodel);
  const stale = devices.filter((d) => d.resolved_state === "stale" || d.resolved_state === "missing");
  const controlReady = [];
  if (devices.some((d) => d.device_id === "falcon-s24fe" && d.resolved_state === "live")) controlReady.push("falcon-s24fe");
  const drift_flags = [];
  if (screenshot?.limitation) drift_flags.push("SCREENSHOT_PRIMARY_ONLY");
  for (const d of stale) drift_flags.push(`STALE_OR_MISSING:${d.device_id}`);
  if (meshResult.current_verdict !== "FULL_MESH_LIVE") drift_flags.push(`MESH_NOT_FULL:${meshResult.current_verdict}`);
  if (transport.conclusion === "transport_live_frame_cadence_gap") drift_flags.push("TRANSPORT_LIVE_FRAME_CADENCE_GAP");
  if (transport.conclusion === "transport_unreachable") drift_flags.push("TRANSPORT_UNREACHABLE");
  if (visual_inspection_task.viewport_sample_only) drift_flags.push("VISUAL_SWEEP_REQUIRED_SINGLE_VIEWPORT_SAMPLE");
  return {
    ok: true,
    type: "VISUAL_FIELD_STATE",
    verb: "EVT-VISION-MESH-SCREEN-WALL-OBSERVED",
    generated_at: new Date().toISOString(),
    observer_pid: "VISUAL-FIELD-PID-ACER-BEHCS1024-SCREEN-BUS-MESH-2026-05-10-N00001",
    screenshot,
    resolved_verdict: meshResult.current_verdict,
    visual_truth_rule: "Visual evidence may downgrade or request refresh, but cannot upgrade stale remote lanes to live without fresh OMNISCRCPY_REMOTE_FRAME backend proof.",
    devices,
    live_frame_producers: devices.filter((d) => d.resolved_state === "live").map((d) => d.device_id),
    stale_remote_frames: devices.filter((d) => d.resolved_state === "stale" || d.resolved_state === "missing").map((d) => d.device_id),
    control_ready: controlReady,
    mesh_counts: meshResult.counts,
    authority: meshResult.authority,
    behcs1024: behcs1024GlyphCapsules(messages),
    leworldmodel_predict_correct: leworldmodel,
    corrective_events: leworldmodel.corrective_events,
    transport_predict_correct: transport,
    visual_inspection_task,
    omnimets_event_model: {
      kind: "OMNIMETS_EVENT_V1",
      fields: ["event_id", "source", "subject", "signal", "ts", "window_ms", "pathRef", "state", "artifacts", "edges"],
      edge_vocabulary: ["observed", "published_frame", "requested_frame", "acknowledged", "gated", "blocked", "awaits_cosign", "cosigned", "deposited", "mirrored", "stale_after", "supersedes", "rolls_up"]
    },
    drift_flags,
    recommended_next_actions: stale.length === 0
      ? [
          "Maintain owner producer cadence and monitor frame age margins.",
          "Run a scroll-sweep visual receipt before claiming the human dashboard's full picture.",
          "Keep Falcon type/control separate from frame proof and record post-action LOOK receipts."
        ]
      : [
          transport.conclusion === "transport_live_frame_cadence_gap"
            ? "Transport to Liris is live on 192.168.1.4; trigger owner-side frame refresh cadence instead of debugging Ethernet."
            : "Verify Liris transport before treating frame absence as only a cadence issue.",
          "Request fresh OMNISCRCPY_REMOTE_FRAME ingest for liris-desktop-via-bus.",
          "Request fresh OMNISCRCPY_REMOTE_FRAME ingest for aether-a06-via-liris.",
          "Run a scroll-sweep visual receipt before claiming the human dashboard's full picture.",
          "Ask Aether to publish a compact AETHER_HEARTBEAT_OR_ROLLUP instead of raw hookwall-only traffic.",
          "Keep Falcon type/control separate from frame proof and record post-action LOOK receipts."
        ]
  };
}

export function sample(device_id = "acer-desktop", quality = "preview") {
  collectGarbage({ trigger: "sample" });
  const frame = readFeedIndex().frames[String(device_id || "acer-desktop")];
  if (!frame) return { ok: false, err: "no local frame for device", device_id };
  if (quality === "full") return fullSampleFromFrame(frame);
  return { ok: true, device_id: frame.device_id, lane: frame.lane, captured_at: frame.captured_at, preview: frame.preview, full: { ...frame.full, data_url_available: true } };
}

export async function remoteRequest(opts = {}) {
  const device_id = String(opts.device_id || "aether-a06-via-liris");
  const chain_id = opts.chain_id || chainId("remote-frame");
  const expectedDevice = EXPECTED_SCREEN_DEVICES.find((d) => d.device_id === device_id);
  if (!expectedDevice && opts.allow_unregistered !== true) {
    appendHistory({ chain_id, channel: "remote-frame-request", action: "request-frame", outcome: "rejected-unregistered-device", device_id });
    return { ok: false, rejected: true, device_id, chain_id, reason: "registered screen devices only", expected_devices: EXPECTED_SCREEN_DEVICES.map((d) => d.device_id) };
  }
  const remoteOwned = REMOTE_OWNER_FRAME_DEVICES.has(device_id);
  const envelope = {
    from: "ACER-OMNISCRCPY-CONTROLLER",
    to: opts.to || "@LIRIS @FALCON @AETHER @TRIAD-FALCON-ACER-LIRIS",
    type: "OMNISCRCPY_REMOTE_FRAME_REQUEST",
    verb: "EVT-OMNISCRCPY-REMOTE-FRAME-REQUEST",
    id: "omniscrcpy-remote-frame-request-" + createHash("sha256").update(device_id + "|" + chain_id).digest("hex").slice(0, 16),
    pid: OMNISCRCPY_PID,
    payload: {
      chain_id,
      device_id,
      requested_quality: opts.quality || "preview+full-sample-metadata",
      force_refresh: opts.force_refresh === true,
      dedup_ok: opts.dedup_ok !== false,
      requires_preview_data_url: opts.requires_preview_data_url === true,
      respond_even_if_canonical_exists: opts.respond_even_if_canonical_exists === true,
      preview_contract: { max_width: PREVIEW_MAX_WIDTH, format: "jpeg", include_data_url: true },
      full_sample_contract: { include_data_url: opts.include_full_data_url === true, include_hash_and_bytes: true, allow_artifact_url: true },
      type_channel: "respond with OMNISCRCPY_REMOTE_FRAME; do not expose unauthenticated remote desktop",
      authority_state: remoteOwned ? "operator-root-authorized-request; live-proof-pending" : "local-or-registered-request",
      guardrails: [
        "registered/expected device only",
        "operator-visible capture request",
        "preview is low-bandwidth; full sample is on-demand",
        "typing remains separate from seeing; remote type requires explicit kick/command envelope",
        "if force_refresh=true, publish a fresh OMNISCRCPY_REMOTE_FRAME with preview.data_url instead of dedup-only ack"
      ]
    }
  };
  const receipt = await busSend(envelope);
  appendHistory({ chain_id, channel: "remote-frame-request", action: "request-frame", outcome: receipt.ok ? "requested" : "request-failed", device_id, receipt_pathRef: receipt?.json?.behcs?.pathRef || "" });
  return { ok: receipt.ok, chain_id, envelope, receipt };
}

export async function fabricTriggerSweep(opts = {}) {
  const limit = opts.limit || 240;
  const cooldownMs = Math.max(30000, Number(opts.cooldown_ms || 60000));
  const nowMs = Date.now();
  const guard = readFabricTriggerGuard();
  const feedResult = await feed(limit);
  const devices = feedResult.devices || [];
  const targets = devices.filter((d) => {
    if (!REMOTE_OWNER_FRAME_DEVICES.has(d.device_id)) return false;
    const age = d.captured_at ? Date.now() - (parseTimeMs(d.captured_at) || Date.now()) : Number.POSITIVE_INFINITY;
    return d.missing_frame || !d.preview?.data_url || age > 60000;
  });
  const requested = [];
  const suppressed = [];
  guard.by_device ||= {};
  for (const device of targets) {
    const prior = guard.by_device[device.device_id] || {};
    const age = nowMs - (prior.last_request_ms || 0);
    if (prior.last_request_ms && age < cooldownMs && opts.force !== true) {
      suppressed.push({ device_id: device.device_id, reason: "cooldown", wait_ms: cooldownMs - age, prior_pathRef: prior.pathRef || "" });
      continue;
    }
    const r = await remoteRequest({
      device_id: device.device_id,
      quality: "fresh-preview+full-sample",
      force_refresh: true,
      dedup_ok: false,
      requires_preview_data_url: true,
      respond_even_if_canonical_exists: true,
      operator_override: true,
      operator_visible: true,
      include_full_data_url: false,
      trigger: opts.trigger || "fabric-trigger-sweep",
      chain_id: chainId("fabric-frame-" + device.device_id),
      to: "@LIRIS @AETHER @FALCON @TRIAD-FALCON-ACER-LIRIS @SUP-HOOK-001 @SUP-SHANNON-001 @PROF-OMNISPINDLE-001"
    });
    const pathRef = r?.receipt?.json?.behcs?.pathRef || "";
    guard.by_device[device.device_id] = { last_request_ms: nowMs, pathRef, trigger: opts.trigger || "fabric-trigger-sweep" };
    requested.push({ device_id: device.device_id, pathRef, ok: r.ok, chain_id: r.chain_id });
  }
  guard.last_sweep_at = new Date().toISOString();
  writeFabricTriggerGuard(guard);
  const summary = {
    from: "ACER-OMNISCRCPY-CONTROLLER",
    to: "@ASOLARIA-CHIEF @OP-JESSE @OP-RAYSSA @LIRIS @AETHER @FALCON @SUP-HOOK-001 @SUP-SHANNON-001 @PROF-SUPER-GULP-SUPERVISOR @TRIAD-FALCON-ACER-LIRIS",
    type: "OMNISCRCPY_FABRIC_TRIGGER_SWEEP",
    verb: "EVT-OMNISCRCPY-FABRIC-TRIGGER-SWEEP",
    id: "omniscrcpy-fabric-trigger-sweep-" + createHash("sha256").update(String(nowMs) + JSON.stringify(requested)).digest("hex").slice(0, 16),
    pid: OMNISCRCPY_PID,
    payload: {
      trigger: opts.trigger || "fabric-trigger-sweep",
      rule: "missing/stale registered remote frame -> owner hookwall/GNN request envelope -> remote frame publish -> Acer feed ingest",
      mesh_verdict: (await mesh(80)).current_verdict,
      requested,
      suppressed,
      remote_targets: targets.map((d) => ({ device_id: d.device_id, missing_frame: !!d.missing_frame, stale_reason: d.stale_reason || "", captured_at: d.captured_at || "" })),
      next_loop: [
        "Liris/Aether must answer with OMNISCRCPY_REMOTE_FRAME including preview.data_url.",
        "Acer feed will ingest only backend proof, not heartbeat-only evidence.",
        "Room-37 should stabilize stage-to-actual disagreements before raising autonomous type authority."
      ]
    }
  };
  const summaryReceipt = opts.emit_summary === false ? null : await busSend(summary);
  appendHistory({
    chain_id: chainId("fabric-trigger-sweep"),
    channel: "fabric-trigger",
    action: "sweep",
    outcome: requested.length ? "requested-remote-frames" : "no-new-request",
    after_sha: "",
    reason: suppressed.length ? "some-targets-cooldown" : "sweep-complete",
    receipt_pathRef: summaryReceipt?.json?.behcs?.pathRef || ""
  });
  return { ok: true, requested, suppressed, targets: targets.map((d) => d.device_id), summary_receipt: summaryReceipt, guard };
}

export async function jriRotate(opts = {}) {
  const context = {
    trigger: opts.trigger || "manual-jri-rotate",
    applies_to: opts.applies_to || ["aether-a06-via-liris", "liris-desktop-via-bus"],
    operator_visible: opts.operator_visible !== false,
    target_language: "BEHCS-1024",
    reason: opts.reason || "Special OP Jesse rotating PID/port proof for fabric-triggered remote frame producers"
  };
  const proof = jri1024Route({
    trigger: context.trigger,
    generation: Number(opts.generation || readOrchestrationGuard().generation || 1),
    context
  });
  const envelope = {
    from: "ACER-JRI1024-ROTATOR",
    to: "@SPECIAL-OP-JESSE @OP-JESSE @OP-RAYSSA @LIRIS-RESIDUAL-BIAS-MONITOR @AETHER @FALCON @SUP-HOOK-001 @SUP-COMMS-001 @SUP-SHANNON-001 @SUP-HERMES-001 @PROF-OMNISPINDLE-001 @PROF-OMNIFLYWHEEL-001 @PROF-AUTOCHRONE-001 @TRIAD-FALCON-ACER-LIRIS",
    type: "JRI1024_SPECIAL_OP_JESSE_ROTATION_PROOF",
    verb: "EVT-JRI1024-SPECIAL-OP-JESSE-ROTATION-PROOF",
    id: "jri1024-special-op-jesse-rotation-" + proof.sha16,
    pid: proof.pid_t,
    payload: {
      context,
      proof,
      instruction: [
        "Use this as a logical route proof for owner-hookwall frame-producer requests.",
        "Do not treat the port as an open socket or bearer token.",
        "Remote producers still must return OMNISCRCPY_REMOTE_FRAME with preview.data_url before the dashboard marks them live."
      ]
    }
  };
  const receipt = opts.emit === false ? null : await busSend(envelope);
  appendHistory({
    chain_id: chainId("jri1024-rotation"),
    channel: "jri1024-rotator",
    action: "rotate",
    outcome: proof.verified ? "signed" : "signature-failed",
    reason: context.trigger,
    receipt_pathRef: receipt?.json?.behcs?.pathRef || ""
  });
  return { ok: proof.verified, proof, receipt };
}

function orchestrationTasks(visual, sweep, route) {
  const missing = visual.stale_remote_frames || [];
  const tasks = [
    {
      id: "O1-VISUAL-TRUTH",
      owner: "ACER-CODEX-VISUAL-QA",
      supervisor_pid: "SUP-HOOK-001",
      prof_pid: "PROF-OMNIVISION-001",
      status: missing.length ? "partial" : "live",
      action: "render only backend-proven frames; placeholders stay visible for missing remotes"
    },
    {
      id: "O2-FABRIC-TRIGGER",
      owner: "ACER-OMNISCRCPY-CONTROLLER",
      supervisor_pid: "SUP-COMMS-001",
      prof_pid: "PROF-OMNISPINDLE-001",
      status: sweep.requested?.length ? "requested" : "cooldown-or-clear",
      action: "missing/stale registered remote frame routes to owner hookwall/GNN as OMNISCRCPY_REMOTE_FRAME_REQUEST"
    },
    {
      id: "O3-OWNER-PRODUCERS",
      owner: "LIRIS-RESIDUAL-BIAS-MONITOR + AETHER",
      supervisor_pid: "SUP-HOOK-001",
      prof_pid: "PROF-AUTOCHRONE-001",
      status: missing.length ? "awaiting_remote_frame" : "satisfied",
      action: "publish OMNISCRCPY_REMOTE_FRAME with preview.data_url and full sha/bytes metadata"
    },
    {
      id: "O4-ROOM37-SPINE",
      owner: "PROF-SUPER-GULP-SUPERVISOR",
      supervisor_pid: "PID-H04-A01-W037000000-P037-N00001",
      prof_pid: "PROF-SUPER-GULP-SUPERVISOR",
      status: visual.drift_flags?.some((f) => /MESH_NOT_FULL|STALE_OR_MISSING/.test(f)) ? "stabilize" : "observe",
      action: "collapse dual-GNN disagreements before autonomous type/kick authority expands"
    },
    {
      id: "O5-SPECIAL-OP-JESSE-ROTATE",
      owner: "SPECIAL-OP-JESSE-AUTOMATED-SEAT",
      supervisor_pid: "SUP-HERMES-001",
      prof_pid: "PROF-OMNIFLYWHEEL-001",
      status: "logical_route_ready",
      action: `load route ${route.pid} at room ${route.hilbert_room}; preserve resume packet through compaction/restart`
    }
  ];
  return tasks;
}

export async function orchestrationCycle(opts = {}) {
  const minIntervalMs = Math.max(30000, Number(opts.min_interval_ms || 60000));
  const nowMs = Date.now();
  const guard = readOrchestrationGuard();
  if (opts.force !== true && guard.last_emit_ms && nowMs - guard.last_emit_ms < minIntervalMs) {
    return {
      ok: true,
      throttled: true,
      wait_ms: Math.max(0, minIntervalMs - (nowMs - guard.last_emit_ms)),
      previous: guard
    };
  }
  const limit = opts.limit || 300;
  const visual = await visualFieldState(limit);
  const sweep = await fabricTriggerSweep({
    trigger: opts.trigger || "orchestration-cycle",
    cooldown_ms: opts.fabric_cooldown_ms || 60000,
    force: opts.force_remote === true,
    limit
  });
  const routeContext = {
    trigger: opts.trigger || "orchestration-cycle",
    visual_generated_at: visual.generated_at,
    visual_verdict: visual.resolved_verdict,
    stale_remote_frames: visual.stale_remote_frames || [],
    requested_remote_frames: sweep.requested || [],
    language: "BEHCS-1024",
    bus_spec: "IX-700/47D"
  };
  const route = jri1024Route({
    trigger: opts.trigger || "orchestration-cycle",
    generation: (guard.generation || 0) + 1,
    context: routeContext
  });
  const tasks = orchestrationTasks(visual, sweep, route);
  const envelope = {
    from: "ACER-FRONTEND-ORCHESTRATOR",
    to: "@ASOLARIA-CHIEF @SPECIAL-OP-JESSE @OP-JESSE @OP-RAYSSA @LIRIS-RESIDUAL-BIAS-MONITOR @AETHER @FALCON @SUP-HOOK-001 @SUP-SHANNON-001 @SUP-HERMES-001 @PROF-SUPER-GULP-SUPERVISOR @PROF-OMNISPINDLE-001 @PROF-OMNIFLYWHEEL-001 @PROF-AUTOCHRONE-001 @TRIAD-FALCON-ACER-LIRIS",
    type: "ACER_FRONTEND_ORCHESTRATION_CYCLE",
    verb: "EVT-ACER-FRONTEND-ORCHESTRATION-BEHCS1024-CYCLE",
    id: "acer-frontend-orchestration-" + createHash("sha256").update(String(nowMs) + route.sha16).digest("hex").slice(0, 16),
    pid: route.pid,
    payload: {
      trigger: opts.trigger || "orchestration-cycle",
      route,
      crypto_anchor: {
        sha16: route.sha16,
        hash: "sha256",
        signature: route.signature,
        signature_format: route.signature_format,
        signature_verified_locally: route.verified,
        seed_id: route.seed_id,
        algorithm: route.algorithm,
        auth_note: "Signature anchors route identity. It is not a bearer credential and it does not bind a network socket."
      },
      language: {
        target: "BEHCS-1024",
        current_bus_spec: "IX-700 / hyperlanguage 47D",
        rule: "Use structured envelope fields first; glyph/language layers summarize, never replace backend proof."
      },
      visual_truth: {
        verdict: visual.resolved_verdict,
        live_frame_producers: visual.live_frame_producers,
        stale_remote_frames: visual.stale_remote_frames,
        drift_flags: visual.drift_flags
      },
      fabric_trigger: {
        requested: sweep.requested,
        suppressed: sweep.suppressed,
        summary_pathRef: sweep.summary_receipt?.json?.behcs?.pathRef || ""
      },
      supervisors_and_profs: tasks,
      loop: [
        "LOOK screen wall + mesh",
        "THINK from visual truth plus bus/GNN signals",
        "REQUEST missing remote frames through fabric-trigger sweep",
        "WAIT for owner hookwall frame producer",
        "INGEST OMNISCRCPY_REMOTE_FRAME only when backend proof arrives",
        "REVIEW room-37/GNN disagreement state",
        "UPDATE dashboard and emit receipt"
      ]
    }
  };
  const receipt = opts.emit === false ? null : await busSend(envelope);
  const nextGuard = {
    generation: (guard.generation || 0) + 1,
    last_emit_ms: nowMs,
    pathRef: receipt?.json?.behcs?.pathRef || "",
    route,
    visual_verdict: visual.resolved_verdict
  };
  writeOrchestrationGuard(nextGuard);
  appendHistory({
    chain_id: chainId("orchestration"),
    channel: "frontend-orchestrator",
    action: "orchestrate",
    outcome: visual.resolved_verdict,
    reason: (visual.stale_remote_frames || []).join(",") || "all-live",
    receipt_pathRef: receipt?.json?.behcs?.pathRef || ""
  });
  return { ok: true, visual, sweep, route, tasks, receipt, guard: nextGuard };
}

export function ingestRemoteFrame(frame = {}) {
  const device_id = String(frame.device_id || "remote-device");
  const incomingCapabilities = frame.capabilities || {};
  const normalized = {
    device_id,
    lane: frame.lane || "remote-relay",
    transport: frame.transport || "local-ingest",
    source: frame.source || "manual-ingest",
    captured_at: frame.captured_at || new Date().toISOString(),
    preview: frame.preview || null,
    full: frame.full || null,
    pathRef: frame.pathRef || "",
    chain_id: frame.chain_id || "",
    fallback_visual_status: !!frame.fallback_visual_status,
    fallback_reason: frame.fallback_reason || "",
    owner_frame_absent: !!frame.owner_frame_absent,
    bus_fallback: frame.bus_fallback || null,
    capabilities: {
      preview_feed: !!frame.preview?.data_url,
      full_quality_sample: !!(frame.full?.data_url || frame.full?.file || frame.full?.artifact_url),
      type_channel: frame.type_channel || "remote-request-envelope",
      remote_ready: incomingCapabilities.remote_ready ?? true,
      ...incomingCapabilities
    }
  };
  const index = readFeedIndex();
  index.frames[device_id] = normalized;
  writeFeedIndex(index);
  const gc = collectGarbage({ trigger: "remote-ingest" });
  appendHistory({ chain_id: frame.chain_id || chainId("remote-ingest"), channel: "remote-feed", action: "ingest-frame", outcome: "ingested", device_id, receipt_pathRef: frame.pathRef || "" });
  return { ok: true, frame: normalized, gc };
}

export async function busFallbackStatusFrames(opts = {}) {
  const checkedAt = new Date().toISOString();
  const trigger = opts.trigger || "operator-reactive-fix";
  const requested = Array.isArray(opts.devices) && opts.devices.length
    ? opts.devices.map(String)
    : ["liris-desktop-via-bus", "aether-a06-via-liris"];
  const messages = await busMessages(Number(opts.limit || 200));
  const ingested = [];

  for (const deviceId of requested) {
    const signal = latestBusSignal(messages, deviceId);
    const frame = busFallbackFrameForDevice({ deviceId, signal, trigger, checkedAt });
    const result = ingestRemoteFrame(frame);
    ingested.push({
      device_id: deviceId,
      preview_sha16: frame.preview.sha16,
      pathRef: frame.pathRef,
      resolved_state: "degraded_bus_fallback",
      signal_from: frame.bus_fallback.signal_from,
      signal_verb: frame.bus_fallback.signal_verb,
      ingested: result.ok
    });
  }

  const envelope = {
    from: "ACER-OMNISCRCPY-CONTROLLER",
    to: "@LIRIS @AETHER @FALCON @ACER-CODEX-VISUAL-QA @ACER-CODEX-FRONTEND-VISUAL-OPERATOR @OP-RAYSSA",
    type: "OMNISCRCPY_BUS_FALLBACK_STATUS_FRAME",
    verb: "EVT-OMNISCRCPY-BUS-FALLBACK-STATUS-FRAME",
    id: "acer-omniscrcpy-bus-fallback-status-frame-" + Date.now().toString(36),
    ts: checkedAt,
    payload: {
      trigger,
      degraded_truth: "fallback frames are bus status only; they are not owner screen proof",
      devices: ingested,
      next_required_fix: "owner producer must resume OMNISCRCPY_REMOTE_FRAME cadence"
    }
  };
  const receipt = await busSend(envelope);
  return { ok: true, checked_at: checkedAt, ingested, receipt };
}

export function saveSkillNote() {
  ensureDir();
  const file = join(__dirname, "S05-omniscrcpy-skill.md");
  const body = `# S05 OmniScrcpy Visible Loop

## Ability

Use a visible browser tab to trigger backend look/type/enter/look control cycles. Acer controls Falcon through local ADB. Liris controls Aether through a handoff envelope until direct routes are proven.

## Loop

1. Desktop LOOK.
2. Device LOOK.
3. Think against current screen and recent bus messages.
4. TYPE only a concise kick message.
5. ENTER.
6. LOOK again.
7. Emit a bus receipt with image paths and hashes.

## S05.1 Additions

- Every tick and kick gets a chain_id so Falcon, Liris, Aether, GNN, and reverse-GNN can discuss the same cycle without drift.
- The action ledger lives at runtime/omniscrcpy/omniscrcpy-action-history.ndjson and records visual hashes, receipt pathRefs, and operator verdicts.
- HALT and Resume are front-end buttons backed by /api/omniscrcpy/halt and /api/omniscrcpy/resume.
- Worked, Misfired, and Ambiguous buttons emit OMNISCRCPY_OPERATOR_VERDICT for the active chain_id.
- Kick cycles emit OMNISCRCPY_VISUAL_FEEDBACK so visual results can be judged before future automation trusts them.

## S05.2 Feed Contract

- Local Acer/Falcon captures register both a low-bandwidth preview frame and a full-quality backend sample.
- Remote/off-LAN devices respond through OMNISCRCPY_REMOTE_FRAME envelopes or a trusted relay; the dashboard does not expose open internet control.
- /api/omniscrcpy/feed lists local frames plus remote bus receipts.
- /api/omniscrcpy/sample returns preview by default and full PNG data only when explicitly requested.
- /api/omniscrcpy/remote-request asks registered remote devices to publish a preview plus full-sample metadata.

## Mistakes Saved

${MISTAKES.map((m) => "- " + m).join("\n")}
`;
  writeFileSync(file, body);
  return { ok: true, file, bytes: Buffer.byteLength(body) };
}

if ((process.argv[1] || "").endsWith("S05-omniscrcpy-orchestrator.mjs")) {
  saveSkillNote();
  console.log(JSON.stringify(status(), null, 2));
}
