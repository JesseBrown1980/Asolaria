#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const childProcess = require("child_process");
const readline = require("readline");

const repoRoot = path.resolve(__dirname, "..", "..");
const { setSecret, getSecret, getSecretMeta, listSecretMeta } = require(path.join(repoRoot, "src", "secureVault"));

const NODES_DIR = path.join(repoRoot, "data", "behcs", "nodes");
const MAP_DIR = path.join(repoRoot, "data", "behcs", "maps", "omni-processor");
const GNN = path.join(repoRoot, "data", "behcs", "gnn-live-edges.ndjson");
const REGISTRY = path.join(repoRoot, "data", "omni-processor", "registry.ndjson");

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeJson(filePath, value) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function readJson(filePath, fallback = null) {
  try {
    return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : fallback;
  } catch {
    return fallback;
  }
}

function appendNdjson(filePath, value) {
  ensureDir(filePath);
  fs.appendFileSync(filePath, `${JSON.stringify(value)}\n`, "utf8");
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function normalizeNode(value) {
  const node = String(value || "").trim().toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  if (!node || node.length < 2) throw new Error("Device node id is required.");
  return node;
}

function splitList(value) {
  if (Array.isArray(value)) return value.flatMap(splitList);
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      args._.push(arg);
      continue;
    }
    const body = arg.slice(2);
    const eq = body.indexOf("=");
    if (eq >= 0) {
      args[body.slice(0, eq)] = body.slice(eq + 1);
    } else {
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        args[body] = next;
        i++;
      } else {
        args[body] = true;
      }
    }
  }
  return args;
}

function nodeProfilePath(node) {
  return path.join(NODES_DIR, `${normalizeNode(node)}.node.json`);
}

function nodeMapPath(node) {
  return path.join(MAP_DIR, `${normalizeNode(node)}-credential-map.v1.json`);
}

function vaultKeyFor(node) {
  return `nodes.${normalizeNode(node)}.credential`;
}

function repoRel(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/");
}

function redacted(value) {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(redacted);
  if (typeof value === "object") {
    const out = {};
    for (const [key, child] of Object.entries(value)) {
      if (/password|secret|token|cookie|passphrase/i.test(key)) {
        out[key] = "<redacted>";
      } else {
        out[key] = redacted(child);
      }
    }
    return out;
  }
  return value;
}

async function readHidden(prompt) {
  if (!process.stdin.isTTY) {
    return fs.readFileSync(0, "utf8").trim();
  }

  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    let value = "";

    stdout.write(prompt);
    stdin.setEncoding("utf8");
    if (stdin.setRawMode) stdin.setRawMode(true);
    stdin.resume();

    function cleanup() {
      stdin.removeListener("data", onData);
      if (stdin.setRawMode) stdin.setRawMode(false);
      stdout.write("\n");
    }

    function onData(char) {
      if (char === "\u0003") {
        cleanup();
        reject(new Error("Interrupted."));
        return;
      }
      if (char === "\r" || char === "\n") {
        cleanup();
        resolve(value);
        return;
      }
      if (char === "\u0008" || char === "\u007f") {
        value = value.slice(0, -1);
        return;
      }
      value += char;
    }

    stdin.on("data", onData);
  });
}

function defaultProfile(node, args = {}) {
  const now = new Date().toISOString();
  const normalized = normalizeNode(node);
  const targets = splitList(args.targets || args.target || args.ip || args.hostname);
  const transports = splitList(args.transports || args.transport || "behcs-vault");
  return {
    id: normalized,
    generatedAt: now,
    updatedAt: now,
    nodeName: args.name || normalized,
    hostname: args.hostname || "",
    hardware: {
      vendor: args.vendor || "",
      model: args.model || "",
      kind: args.kind || "device"
    },
    network: {
      directIp: args.ip || "",
      targets,
      portsObserved: splitList(args.ports).map((p) => Number(p)).filter((p) => Number.isFinite(p))
    },
    access: {
      credentialAuthority: "asolaria-owner-vault",
      credentialVaultKey: vaultKeyFor(normalized),
      osCredentialManagers: {
        windows: {
          optional: true,
          targets
        }
      },
      transports,
      status: "credential_pending_or_redacted",
      valuePolicy: "secret_values_available_to_runtime_only_never_reports"
    },
    omniprocessor: {
      stage: 1,
      dispatchEnabled: false,
      dispatchGate: "filesystem_or_transport_audit_required",
      language: "BEHCS-256",
      map: "map_map_mapped",
      cube: "cube_cube_cubed",
      glyph: "glyphed"
    },
    boundaries: [
      "Owner vault is the primary credential authority.",
      "OS credential managers are adapters only.",
      "No plaintext secrets in reports or Git.",
      "No shadow file edits.",
      "No destructive disk repair.",
      "No massive dispatch before audit."
    ]
  };
}

function writeNodeMap(profile) {
  const generatedAt = new Date().toISOString();
  const node = normalizeNode(profile.id);
  const map = {
    id: `${node}-credential-map.v1`,
    generatedAt,
    nodes: [
      { id: "asolaria_owner_vault", kind: "credential_authority" },
      { id: node, kind: "omni_processor_device", hostname: profile.hostname || "" },
      { id: "os_credential_manager", kind: "optional_adapter", optional: true },
      { id: "behcs_256", kind: "language_runtime" },
      { id: "gnn_reverse_gain", kind: "pattern_and_mistake_mining" },
      { id: "omnishannon", kind: "consensus_gate" }
    ],
    edges: [
      { from: "asolaria_owner_vault", to: node, relation: "provides_runtime_credential" },
      { from: node, to: "os_credential_manager", relation: "may_materialize_target_for_legacy_transport" },
      { from: node, to: "behcs_256", relation: "loads_language" },
      { from: "behcs_256", to: "gnn_reverse_gain", relation: "feeds" },
      { from: "gnn_reverse_gain", to: "omnishannon", relation: "votes" }
    ],
    credentialVaultKey: profile.access.credentialVaultKey,
    digest: sha256(JSON.stringify(profile))
  };
  writeJson(nodeMapPath(node), map);
  return map;
}

function registerNode(profile, map) {
  const now = new Date().toISOString();
  const entry = {
    ts: now,
    event: "OMNI_PROCESSOR_DEVICE_CREDENTIAL_NODE_REGISTERED",
    node: profile.id,
    hostname: profile.hostname,
    stage: 1,
    credentialAuthority: profile.access.credentialAuthority,
    credentialVaultKey: profile.access.credentialVaultKey,
    secretValue: "<redacted>",
    transports: profile.access.transports,
    dispatchEnabled: false,
    profile: repoRel(nodeProfilePath(profile.id)),
    map: repoRel(nodeMapPath(profile.id)),
    digest: map.digest
  };
  appendNdjson(REGISTRY, entry);
  appendNdjson(GNN, {
    id: `device-credential-node-${profile.id}-${Date.now()}`,
    ts: now,
    from: "device_credential_control",
    to: "omni_processor_registry",
    verb: "device_credential_node_registered",
    node: profile.id,
    weight: 0.74,
    digest: map.digest
  });
  return entry;
}

function upsertProfile(args) {
  const node = normalizeNode(args.node || args._[1]);
  const existing = readJson(nodeProfilePath(node), {});
  const next = {
    ...defaultProfile(node, args),
    ...existing,
    updatedAt: new Date().toISOString()
  };

  next.nodeName = args.name || next.nodeName || node;
  next.hostname = args.hostname !== undefined ? args.hostname : (next.hostname || "");
  next.hardware = {
    ...(next.hardware || {}),
    vendor: args.vendor !== undefined ? args.vendor : (next.hardware?.vendor || ""),
    model: args.model !== undefined ? args.model : (next.hardware?.model || ""),
    kind: args.kind !== undefined ? args.kind : (next.hardware?.kind || "device")
  };
  const targets = splitList(args.targets || args.target || args.ip || args.hostname);
  if (targets.length) {
    next.network = { ...(next.network || {}), directIp: args.ip || next.network?.directIp || "", targets };
    next.access = {
      ...(next.access || {}),
      osCredentialManagers: {
        ...(next.access?.osCredentialManagers || {}),
        windows: { optional: true, targets }
      }
    };
  }
  const transports = splitList(args.transports || args.transport);
  if (transports.length) {
    next.access = { ...(next.access || {}), transports };
  }
  next.access = {
    ...(next.access || {}),
    credentialAuthority: "asolaria-owner-vault",
    credentialVaultKey: args.vaultKey || next.access?.credentialVaultKey || vaultKeyFor(node),
    valuePolicy: "secret_values_available_to_runtime_only_never_reports"
  };

  writeJson(nodeProfilePath(node), next);
  const map = writeNodeMap(next);
  const entry = registerNode(next, map);
  return { ok: true, action: "profile-upserted", profile: repoRel(nodeProfilePath(node)), map: repoRel(nodeMapPath(node)), entry: redacted(entry) };
}

async function setCredential(args) {
  const node = normalizeNode(args.node || args._[1]);
  const profileResult = upsertProfile(args);
  const profile = readJson(nodeProfilePath(node), defaultProfile(node, args));
  const key = args.vaultKey || profile.access.credentialVaultKey || vaultKeyFor(node);
  const secret = args.secret || args.password || await readHidden(`Credential secret for ${node} (hidden input): `);
  if (!secret) throw new Error("Credential secret is required.");

  const value = {
    node,
    service: args.service || "device-access",
    username: args.username || "",
    secret,
    password: secret,
    hostname: profile.hostname || args.hostname || "",
    directIp: profile.network?.directIp || args.ip || "",
    targets: splitList(args.targets || args.target || profile.network?.targets || profile.hostname || profile.network?.directIp),
    transports: splitList(args.transports || args.transport || profile.access?.transports || "behcs-vault"),
    status: "active",
    source: "owner_secure_prompt",
    updatedAt: new Date().toISOString(),
    note: "Stored for Asolaria runtime access. Do not print or commit plaintext."
  };

  const meta = {
    label: `${profile.nodeName || node} device credential`,
    service: value.service,
    kind: "device-credential",
    node,
    hostname: value.hostname,
    directIp: value.directIp,
    username: value.username,
    capturedFrom: "secure_prompt",
    app: "Asolaria",
    component: "omni-processor-device-credential-control",
    actor: "owner",
    updatedBy: "secure_prompt",
    credentialOwner: "owner"
  };
  const stored = setSecret(key, value, meta, { namespace: "owner" });

  profile.access.status = "credential_stored_owner_vault";
  profile.access.credentialVaultKey = key;
  profile.updatedAt = new Date().toISOString();
  writeJson(nodeProfilePath(node), profile);
  writeNodeMap(profile);

  return { ok: true, action: "credential-stored", profile: profileResult.profile, namespace: stored.namespace, key: stored.name, value: "<redacted>", targets: value.targets, transports: value.transports };
}

function status(args) {
  const node = args.node ? normalizeNode(args.node) : null;
  const profiles = fs.existsSync(NODES_DIR)
    ? fs.readdirSync(NODES_DIR).filter((name) => name.endsWith(".node.json")).map((name) => readJson(path.join(NODES_DIR, name), null)).filter(Boolean)
    : [];
  const selected = node ? profiles.filter((profile) => normalizeNode(profile.id || profile.nodeName) === node) : profiles;
  const vaultEntries = listSecretMeta({ namespace: "owner" })
    .filter((entry) => String(entry.name).startsWith("nodes."))
    .filter((entry) => !node || entry.name === vaultKeyFor(node));
  return {
    ok: true,
    node: node || "all",
    profiles: redacted(selected),
    credentialVaultEntries: vaultEntries.map((entry) => ({
      namespace: entry.namespace,
      name: entry.name,
      updatedAt: entry.updatedAt,
      meta: redacted(entry.meta),
      value: "<redacted>"
    }))
  };
}

function syncWindows(args) {
  const node = normalizeNode(args.node || args._[1]);
  const key = args.vaultKey || vaultKeyFor(node);
  const entry = getSecret(key, { namespace: "owner" });
  if (!entry?.value) throw new Error(`No owner vault credential found for ${key}.`);
  const value = entry.value;
  const username = value.username;
  const password = value.secret || value.password;
  if (!username || !password) throw new Error(`Vault credential ${key} is missing username or secret.`);
  const targets = splitList(args.targets || args.target || value.targets || value.hostname || value.directIp);
  if (!targets.length) throw new Error("No targets found for Windows credential materialization.");
  if (process.platform !== "win32") throw new Error("Windows Credential Manager adapter requires Windows.");

  const stored = [];
  for (const target of targets) {
    childProcess.execFileSync("cmdkey.exe", [`/generic:${target}`, `/user:${username}`, `/pass:${password}`], { stdio: "ignore" });
    stored.push(target);
  }
  return { ok: true, action: "windows-credential-manager-synced", node, key, username, targets: stored, value: "<redacted>" };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0] || "status";
  let result;
  if (command === "profile") result = upsertProfile(args);
  else if (command === "set") result = await setCredential(args);
  else if (command === "status") result = status(args);
  else if (command === "sync-windows") result = syncWindows(args);
  else {
    throw new Error(`Unknown command: ${command}. Use profile, set, status, or sync-windows.`);
  }
  process.stdout.write(`${JSON.stringify(redacted(result), null, 2)}\n`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
    process.exitCode = 1;
  });
}

module.exports = { upsertProfile, setCredential, status, syncWindows, vaultKeyFor };
