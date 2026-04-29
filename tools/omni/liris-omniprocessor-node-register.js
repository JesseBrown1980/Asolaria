#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const NODE_PROFILE = path.join(repoRoot, "data", "behcs", "nodes", "liris-desktop-ptsqtie.node.json");
const REGISTRY = path.join(repoRoot, "data", "omni-processor", "registry.ndjson");
const STATE = path.join(repoRoot, "data", "omni-processor", "nodes", "liris-desktop-ptsqtie.state.json");
const MAP = path.join(repoRoot, "data", "behcs", "maps", "omni-processor", "liris-omniprocessor-node-map.v1.json");
const REPORT = path.join(repoRoot, "reports", "liris-omniprocessor-node-register-latest.md");
const GNN = path.join(repoRoot, "data", "behcs", "gnn-live-edges.ndjson");

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeText(filePath, value) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, value.endsWith("\n") ? value : `${value}\n`, "utf8");
}

function appendNdjson(filePath, value) {
  ensureDir(filePath);
  fs.appendFileSync(filePath, `${JSON.stringify(value)}\n`, "utf8");
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function repoRel(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/");
}

function buildEntry(profile, generatedAt) {
  return {
    ts: generatedAt,
    event: "OMNI_PROCESSOR_REGISTRY_REGISTER_REMOTE",
    named_agent: "liris-omniprocessor-node-register",
    cube: [704969, 1331, 14641],
    dims: "D24_INTENT/D5_LAYER/D14_ENERGY",
    axis_map_version: "v1.2",
    ref: "LX-489",
    stage: 1,
    capability: {
      host_id: "asolaria-liris",
      host_name: profile.hostname,
      node_name: profile.nodeName,
      hardware: profile.hardware,
      direct_ethernet_ip: profile.network.directEthernetIp,
      acer_direct_ethernet_ip: profile.network.acerDirectEthernetIp,
      mac_observed: profile.network.macObserved,
      open_ports_observed: profile.network.openPortsObserved,
      smb_reachable: profile.access.smbReachable,
      winrm_reachable: profile.access.winrmReachable,
      filesystem_auth_state: "blocked_credentials_rejected_currently",
      filesystem_audit_state: "pending_local_liris_run_or_valid_smb_credential",
      memory_gb_observed_by_operator: 8,
      storage_note: "operator reports C space recovered; Liris D currently recovery USB unless proven otherwise"
    },
    dispatch: {
      enabled: false,
      reason: "Stage 1 registry only; filesystem audit must complete before dispatch.",
      allowed: ["metadata_inventory", "local_audit_script_download", "read_only_manifest_ingest"],
      denied: ["massive_agent_run_before_audit", "destructive_disk_repair", "shadow_file_edit", "secret_content_read"]
    },
    novalum_shield_clause: "HD-1 EXCLUDES novalum from cross-host dispatch — read-only on physical-USB host",
    boundaries: profile.boundaries,
    sourceProfile: repoRel(NODE_PROFILE),
    digest: sha256(JSON.stringify(profile))
  };
}

function buildMap(entry, generatedAt) {
  const nodes = [
    { id: "omni_processor_registry", kind: "registry" },
    { id: "acer", kind: "base_station", ip: entry.capability.acer_direct_ethernet_ip },
    { id: "liris", kind: "remote_node", host: entry.capability.host_name, ip: entry.capability.direct_ethernet_ip },
    { id: "smb", kind: "filesystem_transport", reachable: entry.capability.smb_reachable, auth: entry.capability.filesystem_auth_state },
    { id: "winrm", kind: "remote_shell_transport", reachable: entry.capability.winrm_reachable, auth: "trustedhosts_or_credential_required" },
    { id: "audit_script", kind: "read_only_collector", path: "tools/Invoke-LirisFullFilesystemAudit.ps1" },
    { id: "behcs_256", kind: "language_map" },
    { id: "cube_cube_cubed", kind: "seal" },
    { id: "gnn_reverse_gain", kind: "pattern_and_mistake_mining" },
    { id: "omnishannon", kind: "consensus_gate" }
  ];
  const edges = [
    { from: "acer", to: "liris", relation: "direct_ethernet_link" },
    { from: "liris", to: "smb", relation: "exposes_port_445" },
    { from: "liris", to: "winrm", relation: "exposes_port_5985" },
    { from: "acer", to: "audit_script", relation: "serves_over_http_8011" },
    { from: "audit_script", to: "liris", relation: "runs_locally_on_liris" },
    { from: "liris", to: "omni_processor_registry", relation: "registered_stage1" },
    { from: "omni_processor_registry", to: "behcs_256", relation: "mapped" },
    { from: "behcs_256", to: "cube_cube_cubed", relation: "sealed" },
    { from: "cube_cube_cubed", to: "gnn_reverse_gain", relation: "mines" },
    { from: "gnn_reverse_gain", to: "omnishannon", relation: "votes" }
  ];
  return {
    id: "liris-omniprocessor-node-map.v1",
    generatedAt,
    nodes,
    edges,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    digest: sha256(JSON.stringify({ nodes, edges }))
  };
}

function run() {
  const generatedAt = new Date().toISOString();
  const profile = readJson(NODE_PROFILE);
  const entry = buildEntry(profile, generatedAt);
  const map = buildMap(entry, generatedAt);
  const state = {
    generatedAt,
    status: "LIRIS_OMNIPROCESSOR_STAGE1_REGISTERED_AUDIT_PENDING",
    registry: repoRel(REGISTRY),
    nodeProfile: repoRel(NODE_PROFILE),
    map: repoRel(MAP),
    report: repoRel(REPORT),
    entry
  };
  const report = `# Liris OmniProcessor Node Register

Generated: ${generatedAt}

Status: ${state.status}

## Node

- Hostname: ${entry.capability.host_name}
- Node: ${entry.capability.node_name}
- Hardware: ${entry.capability.hardware.vendor} ${entry.capability.hardware.model}
- Direct Ethernet: ${entry.capability.direct_ethernet_ip}
- Acer base IP: ${entry.capability.acer_direct_ethernet_ip}
- MAC: ${entry.capability.mac_observed}
- SMB reachable: ${entry.capability.smb_reachable}
- WinRM reachable: ${entry.capability.winrm_reachable}
- Filesystem auth: ${entry.capability.filesystem_auth_state}

## Current Gate

Filesystem audit is pending. Run the local Liris audit script or supply a working SMB credential.

## Boundaries

- Stage 1 registry only.
- No dispatch yet.
- No shadow file edits.
- No secret contents read.
- No destructive disk repair.
`;
  appendNdjson(REGISTRY, entry);
  writeJson(STATE, state);
  writeJson(MAP, map);
  writeText(REPORT, report);
  appendNdjson(GNN, {
    id: `liris-omniprocessor-node-${Date.now()}`,
    ts: generatedAt,
    from: "liris_omniprocessor_node_register",
    to: "omni_processor_registry",
    verb: "stage1_remote_node_registered",
    weight: 0.72,
    digest: entry.digest
  });
  return { ok: true, status: state.status, entry, outputs: { state: repoRel(STATE), map: repoRel(MAP), report: repoRel(REPORT), registry: repoRel(REGISTRY) } };
}

if (require.main === module) {
  try {
    console.log(JSON.stringify(run(), null, 2));
  } catch (error) {
    console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
    process.exitCode = 1;
  }
}

module.exports = { run };
