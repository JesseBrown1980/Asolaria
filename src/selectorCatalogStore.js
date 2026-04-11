"use strict";

const fs = require("fs");
const path = require("path");
const { resolveDataPath } = require("./runtimePaths");

const selectorCatalogPath = resolveDataPath("selector-catalog.json");

const DEFAULT_CATALOG = Object.freeze({
  schemaVersion: 1,
  createdAt: "2026-03-29T00:00:00.000Z",
  updatedAt: "2026-03-29T00:00:00.000Z",
  categories: Object.freeze({
    connection_fixture: Object.freeze({
      id: "connection_fixture",
      label: "Connection Fixtures",
      description: "Named network, VPN, LAN, and USB routing postures."
    }),
    work_identity: Object.freeze({
      id: "work_identity",
      label: "Work Identity",
      description: "Hosted-work organization and account-routing selectors."
    }),
    remote_control_surface: Object.freeze({
      id: "remote_control_surface",
      label: "Remote Control",
      description: "Desktop-remote or operator-surface targets with explicit authority boundaries."
    }),
    messaging_surface: Object.freeze({
      id: "messaging_surface",
      label: "Messaging",
      description: "Chat, phone, and messaging targets such as WhatsApp or Telegram."
    }),
    cloud_surface: Object.freeze({
      id: "cloud_surface",
      label: "Cloud Surface",
      description: "Google Workspace, GCP, and hosted cloud project selectors."
    }),
    worker_lane: Object.freeze({
      id: "worker_lane",
      label: "Worker Lane",
      description: "AI worker/model routing selectors and execution lanes."
    }),
    deployment_lane: Object.freeze({
      id: "deployment_lane",
      label: "Deployment Lane",
      description: "Live, pre-dev, staging, and production-adjacent runtime branches."
    }),
    runtime_endpoint: Object.freeze({
      id: "runtime_endpoint",
      label: "Runtime Endpoint",
      description: "Local or remote endpoints with bindings and fast-action affordances."
    })
  }),
  accessLevels: Object.freeze({
    observer: Object.freeze({
      id: "observer",
      label: "Observer",
      description: "Read-only visibility."
    }),
    operator: Object.freeze({
      id: "operator",
      label: "Operator",
      description: "Standard selector and local-lane authority."
    }),
    trusted_agent: Object.freeze({
      id: "trusted_agent",
      label: "Trusted Agent",
      description: "May apply hosted-work and higher-risk project fixtures."
    }),
    super_admin: Object.freeze({
      id: "super_admin",
      label: "Super Admin",
      description: "May apply topology-sensitive or device-lab fixtures."
    }),
    owner: Object.freeze({
      id: "owner",
      label: "Owner",
      description: "Owner-plane authority."
    })
  }),
  profiles: Object.freeze({
    home_wifi: Object.freeze({
      id: "home_wifi",
      label: "Home Wi-Fi",
      description: "Private-LAN-first profile."
    }),
    internet_tunnel: Object.freeze({
      id: "internet_tunnel",
      label: "Internet Tunnel",
      description: "Hosted-work or VPN/tunnel-first profile."
    }),
    public_fallback: Object.freeze({
      id: "public_fallback",
      label: "Public Fallback",
      description: "Public internet fallback profile."
    }),
    usb_first: Object.freeze({
      id: "usb_first",
      label: "USB First",
      description: "USB/loopback-first profile."
    }),
    desktop_remote_control: Object.freeze({
      id: "desktop_remote_control",
      label: "Desktop Remote Control",
      description: "Remote desktop/control profile for operator tools."
    }),
    messaging_target: Object.freeze({
      id: "messaging_target",
      label: "Messaging Target",
      description: "Phone/chat destination profile."
    }),
    cloud_project: Object.freeze({
      id: "cloud_project",
      label: "Cloud Project",
      description: "Google/GCP project and account surface."
    }),
    worker_lane: Object.freeze({
      id: "worker_lane",
      label: "Worker Lane",
      description: "AI execution lane profile."
    }),
    deployment_lane: Object.freeze({
      id: "deployment_lane",
      label: "Deployment Lane",
      description: "Branch-aware deployment lane profile."
    })
  }),
  tumblers: Object.freeze({
    cpu_local_general: Object.freeze({
      id: "cpu_local_general",
      label: "CPU Local General",
      description: "General local CPU-bound execution slots.",
      maxActive: 4,
      rotate: "round_robin",
      queueDepth: 16
    }),
    gpu_primary_model: Object.freeze({
      id: "gpu_primary_model",
      label: "GPU Primary Model",
      description: "Primary local GPU-backed model slot.",
      maxActive: 1,
      rotate: "single_slot",
      queueDepth: 8
    }),
    browser_remote_surface: Object.freeze({
      id: "browser_remote_surface",
      label: "Browser Remote Surface",
      description: "Hosted browser or remote-control surfaces.",
      maxActive: 2,
      rotate: "round_robin",
      queueDepth: 12
    }),
    device_lab_serial: Object.freeze({
      id: "device_lab_serial",
      label: "Device Lab Serial",
      description: "Exclusive serial/adapter or hardware-lab slot.",
      maxActive: 1,
      rotate: "single_slot",
      queueDepth: 6
    })
  }),
  selectors: Object.freeze([
    Object.freeze({
      id: "remote_control.anydesk.desktop",
      title: "AnyDesk Desktop Surface",
      category: "remote_control_surface",
      selectorKind: "reference",
      profileId: "desktop_remote_control",
      accessLevel: "trusted_agent",
      tumblerId: "browser_remote_surface",
      status: "active",
      version: 1,
      labels: ["anydesk", "desktop", "remote"],
      description: "Installed AnyDesk desktop surface. Reference-only until a dedicated connector exists.",
      bindings: {
        paths: [
          {
            kind: "file",
            path: "C:/Program Files (x86)/AnyDesk/AnyDesk.exe",
            required: false
          }
        ],
        ports: []
      }
    }),
    Object.freeze({
      id: "remote_control.rdp.mstsc",
      title: "Windows Remote Desktop",
      category: "remote_control_surface",
      selectorKind: "reference",
      profileId: "desktop_remote_control",
      accessLevel: "trusted_agent",
      tumblerId: "browser_remote_surface",
      status: "active",
      version: 1,
      labels: ["rdp", "mstsc", "desktop", "remote"],
      description: "Windows Remote Desktop launch surface. Reference-only until a dedicated executor exists.",
      bindings: {
        paths: [
          {
            kind: "file",
            path: "C:/Windows/System32/mstsc.exe",
            required: true
          }
        ],
        ports: []
      }
    }),
    Object.freeze({
      id: "vpn.expressvpn.usa_charleston",
      title: "ExpressVPN Charleston USA Fixture",
      category: "connection_fixture",
      selectorKind: "reference",
      profileId: "internet_tunnel",
      accessLevel: "trusted_agent",
      tumblerId: "cpu_local_general",
      status: "active",
      version: 1,
      labels: ["vpn", "expressvpn", "usa", "charleston", "policy"],
      description: "Policy fixture for hosted-work flows that require USA/Charleston VPN routing.",
      bindings: {
        paths: [
          {
            kind: "file",
            path: "C:/Program Files (x86)/ExpressVPN/services/ExpressVPNService.exe",
            required: false
          },
          {
            kind: "file",
            path: "C:/Program Files/ExpressVPN/services/ExpressVPNService.exe",
            required: false
          }
        ],
        ports: []
      }
    }),
    Object.freeze({
      id: "deployment_lane.live",
      title: "Live Branch",
      category: "deployment_lane",
      selectorKind: "control",
      profileId: "deployment_lane",
      accessLevel: "trusted_agent",
      tumblerId: "cpu_local_general",
      status: "active",
      version: 1,
      labels: ["deployment", "lane", "live", "master"],
      description: "Primary live lane for the currently active branch/runtime.",
      bindings: {
        paths: [],
        ports: []
      }
    }),
    Object.freeze({
      id: "deployment_lane.pre_staging",
      title: "Pre-Staging Lane",
      category: "deployment_lane",
      selectorKind: "control",
      profileId: "deployment_lane",
      accessLevel: "trusted_agent",
      tumblerId: "cpu_local_general",
      status: "active",
      version: 1,
      labels: ["deployment", "lane", "pre-staging", "prestaging"],
      description: "Pre-staging lane for branch and environment hardening before staging.",
      bindings: {
        paths: [],
        ports: []
      }
    }),
    Object.freeze({
      id: "deployment_lane.pre_dev",
      title: "Pre-Dev Lane",
      category: "deployment_lane",
      selectorKind: "control",
      profileId: "deployment_lane",
      accessLevel: "trusted_agent",
      tumblerId: "cpu_local_general",
      status: "active",
      version: 1,
      labels: ["deployment", "lane", "pre-dev", "predev"],
      description: "Pre-dev lane for shaping work before it enters shared staging flow.",
      bindings: {
        paths: [],
        ports: []
      }
    }),
    Object.freeze({
      id: "deployment_lane.staging",
      title: "Staging Lane",
      category: "deployment_lane",
      selectorKind: "control",
      profileId: "deployment_lane",
      accessLevel: "trusted_agent",
      tumblerId: "cpu_local_general",
      status: "active",
      version: 1,
      labels: ["deployment", "lane", "staging"],
      description: "Shared staging lane for integrated runtime validation.",
      bindings: {
        paths: [],
        ports: []
      }
    }),
    Object.freeze({
      id: "deployment_lane.pro",
      title: "Pro Lane",
      category: "deployment_lane",
      selectorKind: "control",
      profileId: "deployment_lane",
      accessLevel: "trusted_agent",
      tumblerId: "cpu_local_general",
      status: "active",
      version: 1,
      labels: ["deployment", "lane", "pro", "prod", "production"],
      description: "Production-grade lane distinct from the live branch control surface.",
      bindings: {
        paths: [],
        ports: []
      }
    }),
    Object.freeze({
      id: "deployment_lane.pre_prod",
      title: "Pre-Prod Lane",
      category: "deployment_lane",
      selectorKind: "control",
      profileId: "deployment_lane",
      accessLevel: "trusted_agent",
      tumblerId: "cpu_local_general",
      status: "active",
      version: 1,
      labels: ["deployment", "lane", "pre-prod", "preprod"],
      description: "Pre-production lane for final release rehearsal and gate checks.",
      bindings: {
        paths: [],
        ports: []
      }
    }),
    Object.freeze({
      id: "messaging.telegram.default",
      title: "Telegram Default Chat Surface",
      category: "messaging_surface",
      selectorKind: "reference",
      profileId: "messaging_target",
      accessLevel: "operator",
      tumblerId: "cpu_local_general",
      status: "active",
      version: 1,
      labels: ["telegram", "chat", "default"],
      description: "Telegram target selection surface backed by configured default or allowlisted chat IDs.",
      bindings: {
        paths: [],
        ports: []
      }
    }),
    Object.freeze({
      id: "cloud.gcp.default",
      title: "Google Cloud Default Surface",
      category: "cloud_surface",
      selectorKind: "reference",
      profileId: "cloud_project",
      accessLevel: "trusted_agent",
      tumblerId: "cpu_local_general",
      status: "active",
      version: 1,
      labels: ["gcp", "google", "cloud", "project"],
      description: "Default Google Cloud / GCP selector surface for project/service operations.",
      bindings: {
        paths: [],
        ports: []
      }
    })
  ])
});

let cache = null;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function ensureDir() {
  fs.mkdirSync(path.dirname(selectorCatalogPath), { recursive: true });
}

function normalizeObjectMap(input = {}) {
  const source = input && typeof input === "object" ? input : {};
  const out = {};
  for (const [key, value] of Object.entries(source)) {
    if (!key) continue;
    out[String(key).trim()] = clone(value);
  }
  return out;
}

function normalizeSelector(raw = {}) {
  const source = raw && typeof raw === "object" ? raw : {};
  return {
    id: String(source.id || "").trim(),
    title: String(source.title || source.label || "").trim(),
    category: String(source.category || "").trim(),
    selectorKind: String(source.selectorKind || "reference").trim().toLowerCase(),
    profileId: String(source.profileId || "").trim(),
    accessLevel: String(source.accessLevel || "operator").trim().toLowerCase(),
    tumblerId: String(source.tumblerId || "").trim(),
    status: String(source.status || "active").trim().toLowerCase(),
    version: Math.max(1, Number(source.version || 1)),
    labels: Array.isArray(source.labels) ? source.labels.map((item) => String(item || "").trim()).filter(Boolean) : [],
    description: String(source.description || "").trim(),
    bindings: {
      paths: Array.isArray(source.bindings?.paths) ? source.bindings.paths.map((entry) => clone(entry)) : [],
      ports: Array.isArray(source.bindings?.ports) ? source.bindings.ports.map((entry) => clone(entry)) : []
    }
  };
}

function createInitialDoc() {
  return clone(DEFAULT_CATALOG);
}

function normalizeCatalogDoc(raw = {}) {
  const now = new Date().toISOString();
  const source = raw && typeof raw === "object" ? raw : {};
  const selectorsById = new Map();
  for (const entry of DEFAULT_CATALOG.selectors) {
    const normalized = normalizeSelector(entry);
    if (!normalized.id) continue;
    selectorsById.set(normalized.id, normalized);
  }
  if (Array.isArray(source.selectors)) {
    for (const entry of source.selectors) {
      const normalized = normalizeSelector(entry);
      if (!normalized.id) continue;
      selectorsById.set(normalized.id, normalized);
    }
  }
  return {
    schemaVersion: 1,
    createdAt: String(source.createdAt || now),
    updatedAt: String(source.updatedAt || now),
    categories: normalizeObjectMap({ ...DEFAULT_CATALOG.categories, ...(source.categories || {}) }),
    accessLevels: normalizeObjectMap({ ...DEFAULT_CATALOG.accessLevels, ...(source.accessLevels || {}) }),
    profiles: normalizeObjectMap({ ...DEFAULT_CATALOG.profiles, ...(source.profiles || {}) }),
    tumblers: normalizeObjectMap({ ...DEFAULT_CATALOG.tumblers, ...(source.tumblers || {}) }),
    selectors: Array.from(selectorsById.values())
  };
}

function writeCatalogDoc(doc) {
  ensureDir();
  const normalized = normalizeCatalogDoc(doc);
  const tmpPath = `${selectorCatalogPath}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tmpPath, JSON.stringify(normalized, null, 2), "utf8");
  fs.renameSync(tmpPath, selectorCatalogPath);
  cache = normalized;
  return clone(normalized);
}

function getSelectorCatalogDoc() {
  if (cache) {
    return clone(cache);
  }
  ensureDir();
  if (!fs.existsSync(selectorCatalogPath)) {
    cache = createInitialDoc();
    writeCatalogDoc(cache);
    return clone(cache);
  }
  try {
    const raw = JSON.parse(fs.readFileSync(selectorCatalogPath, "utf8"));
    cache = normalizeCatalogDoc(raw);
    if (JSON.stringify(raw) !== JSON.stringify(cache)) {
      writeCatalogDoc(cache);
    }
    return clone(cache);
  } catch (_error) {
    cache = createInitialDoc();
    writeCatalogDoc(cache);
    return clone(cache);
  }
}

module.exports = {
  selectorCatalogPath,
  getSelectorCatalogDoc,
  writeCatalogDoc
};
