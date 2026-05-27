#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const http = require("http");
const net = require("net");
const { execFileSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..", "..");
const runId = "unison-liris-acer-20260426";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", runId);

const paths = Object.freeze({
  falconNode: path.join(repoRoot, "data", "behcs", "nodes", "falcon.node.json"),
  falconCredentialMap: path.join(repoRoot, "data", "behcs", "maps", "omni-processor", "falcon-credential-map.v1.json"),
  networkTailscaleCube: path.join(repoRoot, "data", "behcs", "cubes", "network-tailscale.cube.js"),
  systemPidIndex: path.join(repoRoot, "data", "behcs", "pid-fabric", "index", "system-surface-pid-indicator-index-latest.json"),
  devicePidIndex: path.join(repoRoot, "data", "behcs", "pid-fabric", "index", "device-pid-indicator-index-latest.json"),
  extensionRows: path.join(runRoot, "falcon-tailscale-timescale-extension.ndjson"),
  extensionChain: path.join(runRoot, "FALCON_TIMESCALE_EXTENSION_CHAIN.ndjson"),
  envelope: path.join(runRoot, "unison-falcon-tailscale-timescale-update-envelope.json"),
  postResult: path.join(runRoot, "unison-falcon-tailscale-timescale-update-post-result.json"),
  reportJson: path.join(repoRoot, "reports", "falcon-tailscale-unison-update-latest.json"),
  reportMd: path.join(repoRoot, "reports", "falcon-tailscale-unison-update-latest.md"),
  basePhase4Chain: path.join(runRoot, "COSIGN_CHAIN.ndjson")
});

const REPLY_TARGET = "http://192.168.100.2:4947/behcs/send";

const PID_PREFIX = Object.freeze({
  device: "BH.DEVICE.PID",
  node: "BH.NODE.PID",
  system: "BH.SYSTEM.PID",
  mesh: "BH.MESH.PID"
});

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeText(filePath, value) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, value.endsWith("\n") ? value : `${value}\n`, "utf8");
}

function writeJson(filePath, value) {
  writeText(filePath, JSON.stringify(value, null, 2));
}

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_error) {
    return fallback;
  }
}

function readNdjson(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function writeNdjson(filePath, rows) {
  writeText(filePath, rows.map((row) => JSON.stringify(row)).join("\n"));
}

function repoRel(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/");
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function stableNumber(seed, digits = 12) {
  const mod = 10n ** BigInt(digits);
  return (BigInt(`0x${sha256(seed).slice(0, 15)}`) % mod).toString().padStart(digits, "0");
}

function pidFor(kind, seed) {
  return `${PID_PREFIX[kind] || PID_PREFIX.system}.${stableNumber(seed)}`;
}

function cleanText(value, maxLen = 320) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text ? text.slice(0, maxLen) : "";
}

function canonicalJson(value) {
  return JSON.stringify(value, Object.keys(value).sort());
}

function getTailscaleStatus() {
  const raw = execFileSync("tailscale", ["status", "--json"], { encoding: "utf8", windowsHide: true });
  return JSON.parse(raw);
}

function selectFalconPeer(status) {
  const peers = Object.values(status.Peer || {});
  const exact = peers.find((peer) => /jesse'?s s24 fe/i.test(String(peer.HostName || "")));
  if (exact) return exact;
  const android = peers.find((peer) => String(peer.OS || "").toLowerCase() === "android");
  if (android) return android;
  return null;
}

function redactTailnetName(status) {
  const suffix = status?.CurrentTailnet?.MagicDNSSuffix || status?.MagicDNSSuffix || "";
  return suffix ? `tailnet:${suffix}` : "tailnet:observed";
}

function tailIps(peer) {
  const ips = Array.isArray(peer?.TailscaleIPs) ? peer.TailscaleIPs : [];
  return {
    ipv4: ips.find((ip) => /^\d+\./.test(ip)) || "",
    ipv6: ips.find((ip) => ip.includes(":")) || ""
  };
}

function makePidRecord(kind, category, label, source, descriptor, evidenceLevel) {
  const descriptorHash = sha256(JSON.stringify({ kind, category, label, source, descriptor }));
  return {
    pid: pidFor(kind, descriptorHash),
    pidKind: kind,
    category,
    label: cleanText(label || category || kind, 240),
    source,
    evidenceLevel,
    observed: true,
    descriptorHash,
    descriptor
  };
}

function refreshPidIndex(index, observedAt) {
  const records = Array.isArray(index.records) ? index.records : [];
  const byKind = {};
  const byEvidence = {};
  for (const record of records) {
    byKind[record.pidKind || "unknown"] = (byKind[record.pidKind || "unknown"] || 0) + 1;
    byEvidence[record.evidenceLevel || "unknown"] = (byEvidence[record.evidenceLevel || "unknown"] || 0) + 1;
  }
  const uniquePids = new Set(records.map((record) => record.pid).filter(Boolean)).size;
  return {
    ...index,
    updatedAt: observedAt,
    counts: {
      ...(index.counts || {}),
      totalRecords: records.length,
      uniquePids,
      pidKind: byKind,
      evidenceLevel: byEvidence
    },
    indexHash: sha256(JSON.stringify(records.map((record) => ({
      pid: record.pid,
      kind: record.pidKind,
      category: record.category,
      hash: record.descriptorHash
    }))))
  };
}

function upsertPidRecord(index, record) {
  const records = Array.isArray(index.records) ? [...index.records] : [];
  const currentIndex = records.findIndex((candidate) => (
    candidate.pid === record.pid ||
    (
      candidate.pidKind === record.pidKind &&
      candidate.category === record.category &&
      candidate.source === record.source &&
      candidate.sourceFile === record.sourceFile &&
      candidate.label === record.label
    )
  ));
  if (currentIndex >= 0) {
    records[currentIndex] = {
      ...records[currentIndex],
      ...record,
      previousPid: records[currentIndex].pid === record.pid ? records[currentIndex].previousPid : records[currentIndex].pid
    };
  } else {
    records.push(record);
  }
  return { ...index, records };
}

function buildPidIdentity(status, falcon, falconNode, observedAt) {
  const falconIps = tailIps(falcon);
  const tailnet = redactTailnetName(status);
  const nodeDescriptor = {
    id: "falcon",
    sourceFile: repoRel(paths.falconNode),
    hostName: falcon.HostName || "",
    dnsName: falcon.DNSName || "",
    meshIpv4: falconIps.ipv4,
    meshIpv6: falconIps.ipv6,
    os: falcon.OS || "",
    online: Boolean(falcon.Online),
    transports: falconNode.access?.transports || [],
    observedAt
  };
  const peerDescriptor = {
    system: "tailscale",
    peer: "falcon",
    hostName: falcon.HostName || "",
    dnsName: falcon.DNSName || "",
    meshIpv4: falconIps.ipv4,
    meshIpv6: falconIps.ipv6,
    os: falcon.OS || "",
    online: Boolean(falcon.Online),
    taildropTarget: Boolean(falcon.TaildropTarget),
    tailnet,
    observedAt
  };
  const timescaleDescriptor = {
    system: "falcon-tailscale-timescale",
    role: "overlay mesh descriptor and D20 time-surface join",
    node: "falcon",
    d_classes: ["D16_PID", "D19_LOCATION", "D20_TIME"],
    law001Relation: "parallel_mesh_descriptor_not_law001_replacement",
    boundary: "descriptor_only_no_remote_execution",
    observedAt
  };
  const nodeRecord = makePidRecord(
    "node",
    "behcs_node",
    "Falcon",
    "behcs.node",
    nodeDescriptor,
    "TAILSCALE_STATUS_OBSERVED"
  );
  nodeRecord.sourceFile = repoRel(paths.falconNode);
  const peerRecord = makePidRecord(
    "device",
    "tailscale_peer",
    falcon.HostName || "Falcon Tailscale peer",
    "tailscale.status",
    peerDescriptor,
    "TAILSCALE_STATUS_OBSERVED"
  );
  const timescaleRecord = makePidRecord(
    "system",
    "falcon_tailscale_timescale_surface",
    "Falcon Tailscale timescale surface",
    "tailscale.status+unison.phase4",
    timescaleDescriptor,
    "TAILSCALE_STATUS_OBSERVED"
  );
  return {
    pidVersion: "BH-PID-FABRIC-v1",
    observedAt,
    nodePid: nodeRecord.pid,
    tailscalePeerPid: peerRecord.pid,
    timescaleSurfacePid: timescaleRecord.pid,
    records: { nodeRecord, peerRecord, timescaleRecord }
  };
}

function updatePidIndexes(pidIdentity, observedAt) {
  const deviceIndex = readJson(paths.devicePidIndex, { records: [] });
  let updatedDeviceIndex = upsertPidRecord(deviceIndex, pidIdentity.records.nodeRecord);
  updatedDeviceIndex = upsertPidRecord(updatedDeviceIndex, pidIdentity.records.peerRecord);
  updatedDeviceIndex = refreshPidIndex(updatedDeviceIndex, observedAt);
  writeJson(paths.devicePidIndex, updatedDeviceIndex);

  const systemIndex = readJson(paths.systemPidIndex, { records: [] });
  let updatedSystemIndex = upsertPidRecord(systemIndex, pidIdentity.records.timescaleRecord);
  const peerCrossrefDescriptor = {
      sourcePid: pidIdentity.records.peerRecord.pid,
      sourceCategory: pidIdentity.records.peerRecord.category,
      sourceEvidence: pidIdentity.records.peerRecord.evidenceLevel,
      sourceDescriptorHash: pidIdentity.records.peerRecord.descriptorHash,
      generatedAt: observedAt
  };
  updatedSystemIndex = upsertPidRecord(updatedSystemIndex, makePidRecord(
    "system",
    "tailscale_peer_crossref",
    "Falcon Tailscale peer PID crossref",
    "device-pid-index.crossref",
    peerCrossrefDescriptor,
    "DEVICE_PID_CROSSREF"
  ));
  updatedSystemIndex = refreshPidIndex(updatedSystemIndex, observedAt);
  writeJson(paths.systemPidIndex, updatedSystemIndex);
}

function updateFalconNode(status, falcon, observedAt) {
  const node = readJson(paths.falconNode, {});
  const ips = tailIps(falcon);
  const targetSet = new Set([...(node.network?.targets || [])]);
  [ips.ipv4, ips.ipv6, falcon.DNSName].filter(Boolean).forEach((value) => targetSet.add(value));
  const transports = new Set([...(node.access?.transports || []), "tailscale"]);

  const updated = {
    ...node,
    updatedAt: observedAt,
    hostname: node.hostname || falcon.HostName || "Jesse's S24 FE",
    hardware: {
      ...(node.hardware || {}),
      kind: "mobile-or-edge-device",
      model: node.hardware?.model || falcon.HostName || "Jesse's S24 FE",
      os: falcon.OS || "android"
    },
    network: {
      ...(node.network || {}),
      directIp: node.network?.directIp || "",
      targets: Array.from(targetSet),
      portsObserved: node.network?.portsObserved || [],
      tailscale: {
        observedAt,
        status: falcon.Online ? "online" : "offline",
        hostName: falcon.HostName || "",
        dnsName: falcon.DNSName || "",
        meshIpv4: ips.ipv4,
        meshIpv6: ips.ipv6,
        relay: falcon.Relay || "",
        taildropTarget: Boolean(falcon.TaildropTarget),
        tailnet: redactTailnetName(status),
        evidence: "tailscale status --json on acer"
      }
    },
    access: {
      ...(node.access || {}),
      transports: Array.from(transports),
      status: node.access?.status || "credential_pending_or_redacted"
    },
    omniprocessor: {
      ...(node.omniprocessor || {}),
      timescale: {
        status: "joined_as_falcon_tailscale_peer",
        observedAt,
        d_class: "D19_LOCATION",
        law001Relation: "parallel_mesh_descriptor_not_law001_replacement"
      }
    }
  };
  const pidIdentity = buildPidIdentity(status, falcon, updated, observedAt);
  updated.pidIdentity = {
    pidVersion: pidIdentity.pidVersion,
    observedAt,
    nodePid: pidIdentity.nodePid,
    tailscalePeerPid: pidIdentity.tailscalePeerPid,
    timescaleSurfacePid: pidIdentity.timescaleSurfacePid,
    d_classes: ["D16_PID", "D19_LOCATION", "D20_TIME"],
    evidence: "tailscale status --json on acer"
  };
  updatePidIndexes(pidIdentity, observedAt);
  writeJson(paths.falconNode, updated);
  return { node: updated, pidIdentity };
}

function updateCredentialMap(observedAt) {
  const map = readJson(paths.falconCredentialMap, { nodes: [], edges: [] });
  const nodes = Array.isArray(map.nodes) ? [...map.nodes] : [];
  const edges = Array.isArray(map.edges) ? [...map.edges] : [];
  if (!nodes.some((node) => node.id === "tailscale_mesh")) {
    nodes.push({ id: "tailscale_mesh", kind: "private_overlay_network", observedAt });
  }
  if (!edges.some((edge) => edge.from === "falcon" && edge.to === "tailscale_mesh")) {
    edges.push({ from: "falcon", to: "tailscale_mesh", relation: "has_private_mesh_descriptor" });
  }
  const updated = {
    ...map,
    updatedAt: observedAt,
    nodes,
    edges,
    digest: sha256(JSON.stringify({ nodes, edges, credentialVaultKey: map.credentialVaultKey || null }))
  };
  writeJson(paths.falconCredentialMap, updated);
  return updated;
}

function updateTailscaleCube(status, falcon, observedAt) {
  const selfIps = tailIps(status.Self || {});
  const falconIps = tailIps(falcon);
  const cube = `"use strict";

// cube: network-tailscale | IX-774 | D19 LOCATION (67) | touches 13,15,21,27
// gates: hookwall | waves: single | federation: falcon-local
// refreshed: ${observedAt} | evidence: tailscale status --json on acer
export const CUBE = {
  id: "network-tailscale",
  primaryCatalog: { D: 19, name: "LOCATION", prime: 67 },
  touches: [13, 15, 21, 27],
  gates: ["hookwall"],
  waves: ["single"],
  connectors: {
    "network-wlan": "underlay",
    "network-rmnet-mobile": "underlay",
    "agent-falcon": "mesh-peer",
    "agent-gaia": "mesh-peer",
    "mcp-asolaria-control": "tunneled-through"
  },
  payload: {
    source: "tailscale status --json",
    package: "com.tailscale.ipn",
    iface: "tailscale0",
    live: true,
    state: "running",
    acer_mesh_ip: ${JSON.stringify(selfIps.ipv4)},
    falcon_mesh_ip: ${JSON.stringify(falconIps.ipv4)},
    falcon_dns: ${JSON.stringify(falcon.DNSName || "")},
    falcon_hostname: ${JSON.stringify(falcon.HostName || "")},
    falcon_online: ${JSON.stringify(Boolean(falcon.Online))},
    cipher: "wireguard+noise",
    role: "overlay mesh descriptor for Acer/Falcon; not a replacement for LAW-001 4947/4950"
  },
  translate: {
    human: ${JSON.stringify(`Tailscale mesh is running; Falcon is visible as ${falcon.HostName || "android peer"} at ${falconIps.ipv4 || "unknown-ip"}.`)},
    agent: "(falcon, meta.observe, cloud.mesh, 3, runtime, hookwall, observe, [underlay,mesh-peer], single, IX, log, operational, falcon-gw, light)",
    device: ${JSON.stringify(`tailscale status -> ${falcon.HostName || "falcon"} ${falconIps.ipv4 || "no-ip"} ${falcon.Online ? "ONLINE" : "OFFLINE"}`)}
  }
};
`;
  writeText(paths.networkTailscaleCube, cube);
}

function buildRows(status, falcon, falconNode, pidIdentity, observedAt) {
  const selfIps = tailIps(status.Self || {});
  const falconIps = tailIps(falcon);
  return [
    {
      runId,
      extension: "falcon-tailscale-timescale",
      ordinal: 0,
      side: "acer",
      kind: "tailscale_self",
      d_class: "D19_LOCATION",
      label: "Acer Tailscale self descriptor",
      meshIpv4: selfIps.ipv4,
      meshIpv6: selfIps.ipv6,
      dnsName: status.Self?.DNSName || "",
      observedAt,
      mutationAllowed: false,
      remoteFileWriteAllowed: false,
      sensitiveMutation: false
    },
    {
      runId,
      extension: "falcon-tailscale-timescale",
      ordinal: 1,
      side: "falcon",
      kind: "tailscale_peer",
      d_class: "D19_LOCATION",
      label: "Falcon Tailscale peer descriptor",
      pid: pidIdentity.tailscalePeerPid,
      linkedNodePid: pidIdentity.nodePid,
      hostName: falcon.HostName || "",
      dnsName: falcon.DNSName || "",
      meshIpv4: falconIps.ipv4,
      meshIpv6: falconIps.ipv6,
      os: falcon.OS || "",
      online: Boolean(falcon.Online),
      observedAt,
      mutationAllowed: false,
      remoteFileWriteAllowed: false,
      sensitiveMutation: false
    },
    {
      runId,
      extension: "falcon-tailscale-timescale",
      ordinal: 2,
      side: "unison",
      kind: "timescale_join",
      d_class: "D20_TIME",
      label: "Falcon added to unison time surface as Tailscale-observed peer",
      pid: pidIdentity.timescaleSurfacePid,
      linkedNodePid: pidIdentity.nodePid,
      linkedPeerPid: pidIdentity.tailscalePeerPid,
      falconNode: repoRel(paths.falconNode),
      falconMeshIpv4: falconNode.network?.tailscale?.meshIpv4 || falconIps.ipv4,
      boundary: "descriptor_only_no_remote_execution",
      observedAt,
      mutationAllowed: false,
      remoteFileWriteAllowed: false,
      sensitiveMutation: false
    }
  ].map((row) => ({ ...row, descriptorHash: sha256(JSON.stringify(row)) }));
}

function buildChain(rows, observedAt) {
  const baseRows = readNdjson(paths.basePhase4Chain);
  const baseTail = baseRows.length ? baseRows[baseRows.length - 1].chain_sha : "GENESIS";
  let prev = baseTail;
  return rows.map((row, index) => {
    const base = {
      seq: index + 1,
      runId,
      extension: "falcon-tailscale-timescale",
      ts: observedAt,
      prev_sha: prev,
      descriptorHash: row.descriptorHash,
      kind: row.kind,
      d_class: row.d_class,
      side: row.side,
      mutationAllowed: false,
      remoteFileWriteAllowed: false,
      sensitiveMutation: false,
      basePhase4TailSha: baseTail
    };
    const chainSha = sha256(canonicalJson(base));
    prev = chainSha;
    return { ...base, chain_sha: chainSha };
  });
}

function checkTcp(host, port, timeoutMs = 1500) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    function done(ok) {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(ok);
    }
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => done(true));
    socket.once("timeout", () => done(false));
    socket.once("error", () => done(false));
    socket.connect(port, host);
  });
}

function postJson(url, body) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const payload = Buffer.from(JSON.stringify(body), "utf8");
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path: `${parsed.pathname}${parsed.search}`,
      method: "POST",
      headers: {
        "content-type": "application/json",
        "content-length": payload.length,
        "connection": "close"
      },
      timeout: 5000
    }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        let body = text;
        try {
          body = JSON.parse(text);
        } catch (_error) {
          // Keep raw text.
        }
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode, body });
      });
    });
    req.on("timeout", () => req.destroy(new Error("post_timeout")));
    req.on("error", (error) => resolve({ ok: false, error: error.message }));
    req.end(payload);
  });
}

function reportMd(report) {
  return `# Falcon Tailscale / Timescale Unison Update

Generated: ${report.generatedAt}

Status: ${report.status}

Falcon:
- Host: ${report.falcon.hostName}
- DNS: ${report.falcon.dnsName}
- Mesh IPv4: ${report.falcon.meshIpv4}
- Online: ${report.falcon.online}

PID:
- Node PID: ${report.pidIdentity.nodePid}
- Tailscale peer PID: ${report.pidIdentity.tailscalePeerPid}
- Timescale surface PID: ${report.pidIdentity.timescaleSurfacePid}

LAW-001:
- Acer 4947/4950: ${report.law001.acer4947 ? "open" : "closed"}/${report.law001.acer4950 ? "open" : "closed"}
- Liris 4947/4950: ${report.law001.liris4947 ? "open" : "closed"}/${report.law001.liris4950 ? "open" : "closed"}

Artifacts:
- Falcon node: \`${repoRel(paths.falconNode)}\`
- Device PID index: \`${repoRel(paths.devicePidIndex)}\`
- System PID index: \`${repoRel(paths.systemPidIndex)}\`
- Tailscale cube: \`${repoRel(paths.networkTailscaleCube)}\`
- Extension rows: \`${repoRel(paths.extensionRows)}\`
- Extension chain: \`${repoRel(paths.extensionChain)}\`
- Envelope: \`${repoRel(paths.envelope)}\`

Post:
- Liris accepted: ${report.post.ok}
- Status code: ${report.post.statusCode || "n/a"}

Boundary: descriptor update only; no phone mutation, no remote file operation, no sensitive mutation, no process fanout. Phase-4 Acer tail remains preserved separately.
`;
}

async function run() {
  const generatedAt = new Date().toISOString();
  const status = getTailscaleStatus();
  const falcon = selectFalconPeer(status);
  if (!falcon) throw new Error("Falcon Tailscale peer not found in tailscale status");

  const falconUpdate = updateFalconNode(status, falcon, generatedAt);
  const falconNode = falconUpdate.node;
  const pidIdentity = falconUpdate.pidIdentity;
  updateCredentialMap(generatedAt);
  updateTailscaleCube(status, falcon, generatedAt);

  const rows = buildRows(status, falcon, falconNode, pidIdentity, generatedAt);
  const chain = buildChain(rows, generatedAt);
  writeNdjson(paths.extensionRows, rows);
  writeNdjson(paths.extensionChain, chain);

  const law001 = {
    acer4947: await checkTcp("127.0.0.1", 4947),
    acer4950: await checkTcp("127.0.0.1", 4950),
    liris4947: await checkTcp("192.168.100.2", 4947),
    liris4950: await checkTcp("192.168.100.2", 4950)
  };

  const falconIps = tailIps(falcon);
  const envelope = {
    verb: "unison-falcon-tailscale-timescale-update",
    target: "liris",
    from: "acer-codex",
    id: "unison-2026-04-26-falcon-tailscale-timescale-update-001",
    ts: generatedAt,
    status: "FALCON_TAILSCALE_TIMESCALE_DESCRIPTOR_UPDATED",
    falcon: {
      hostName: falcon.HostName || "",
      dnsName: falcon.DNSName || "",
      meshIpv4: falconIps.ipv4,
      meshIpv6: falconIps.ipv6,
      online: Boolean(falcon.Online),
      os: falcon.OS || ""
    },
    pidIdentity: {
      pidVersion: pidIdentity.pidVersion,
      nodePid: pidIdentity.nodePid,
      tailscalePeerPid: pidIdentity.tailscalePeerPid,
      timescaleSurfacePid: pidIdentity.timescaleSurfacePid,
      d_classes: ["D16_PID", "D19_LOCATION", "D20_TIME"]
    },
    artifacts: {
      falconNode: repoRel(paths.falconNode),
      devicePidIndex: repoRel(paths.devicePidIndex),
      systemPidIndex: repoRel(paths.systemPidIndex),
      tailscaleCube: repoRel(paths.networkTailscaleCube),
      extensionRows: repoRel(paths.extensionRows),
      extensionChain: repoRel(paths.extensionChain)
    },
    chain: {
      rows: chain.length,
      tailSha: chain[chain.length - 1]?.chain_sha || null,
      basePhase4TailSha: chain[0]?.basePhase4TailSha || null
    },
    law001,
    boundary: {
      descriptorOnly: true,
      phoneMutation: false,
      remoteFileOperation: false,
      sensitiveMutation: false,
      processFanout: false
    },
    glyph_sentence: "EVT-FALCON-TAILSCALE-TIMESCALE-JOINED - D19-LOCATION - D20-TIME - LAW001-PRESERVED @ M-INDICATIVE .",
    d11: "PROVEN_LOCAL_TAILSCALE_STATUS_OBSERVED"
  };
  writeJson(paths.envelope, envelope);

  const post = await postJson(REPLY_TARGET, envelope);
  writeJson(paths.postResult, { replyTarget: REPLY_TARGET, ...post, postedAt: new Date().toISOString() });

  const report = {
    reportId: "falcon-tailscale-unison-update-latest",
    generatedAt,
    status: post.ok ? "FALCON_TAILSCALE_TIMESCALE_UPDATE_POSTED" : "FALCON_TAILSCALE_TIMESCALE_UPDATE_POST_FAILED",
    falcon: envelope.falcon,
    pidIdentity: envelope.pidIdentity,
    law001,
    chain: envelope.chain,
    post: {
      ok: post.ok,
      statusCode: post.statusCode || null,
      body: post.body || post.error || null
    },
    outputs: envelope.artifacts,
    boundary: envelope.boundary
  };
  writeJson(paths.reportJson, report);
  writeText(paths.reportMd, reportMd(report));

  console.log(JSON.stringify({
    ok: true,
    status: report.status,
    falcon: report.falcon,
    pidIdentity: report.pidIdentity,
    extensionRows: rows.length,
    extensionTailSha: envelope.chain.tailSha,
    postOk: post.ok,
    report: repoRel(paths.reportMd)
  }, null, 2));
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
