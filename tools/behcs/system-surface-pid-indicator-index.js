#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const childProcess = require("child_process");

const repoRoot = path.resolve(__dirname, "..", "..");
const userRoot = path.dirname(repoRoot);
const pidFabricRoot = path.join(repoRoot, "data", "behcs", "pid-fabric");

const OUTPUTS = Object.freeze({
  index: path.join(pidFabricRoot, "index", "system-surface-pid-indicator-index-latest.json"),
  ndjson: path.join(pidFabricRoot, "requests", "system-surface-pid-indicator-latest.ndjson"),
  preload: path.join(pidFabricRoot, "preload", "system-surface-pid-preload-bindings-latest.json"),
  reportJson: path.join(repoRoot, "reports", "system-surface-pid-indicator-index-latest.json"),
  reportMd: path.join(repoRoot, "reports", "system-surface-pid-indicator-index-latest.md"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "system-surface-pid-indicator-index.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "system-surface-pid-map-map-mapped.v1.json"),
  cube: path.join(repoRoot, "data", "behcs", "cubes", "system-surface-pid-indicator-cube-cubed.cube.js"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "system-surface-pid-indicator.glpj.json")
});

const PID_PREFIX = Object.freeze({
  cpu: "BH.CPU.PID",
  gpu: "BH.GPU.PID",
  driver: "BH.DRIVER.PID",
  process: "BH.PROCESS.PID",
  program: "BH.PROGRAM.PID",
  tool: "BH.TOOL.PID",
  skill: "BH.SKILL.PID",
  mcp: "BH.MCP.PID",
  wiki: "BH.WIKI.PID",
  token: "BH.TOKEN.PID",
  cube: "BH.CUBE.PID",
  behcs: "BH.BEHCS.PID",
  supervisor: "BH.SUPXREF.PID",
  code: "BH.CODE.PID",
  system: "BH.SYSTEM.PID"
});

const FILE_GROUPS = Object.freeze([
  { kind: "tool", category: "asolaria_tool_script", root: "tools", extensions: [".js", ".ps1", ".cmd", ".mjs", ".cjs"] },
  { kind: "tool", category: "asolaria_script", root: "scripts", extensions: [".js", ".ps1", ".cmd", ".mjs", ".cjs"] },
  { kind: "skill", category: "asolaria_skill", root: "skills", extensions: [".json", ".md"] },
  { kind: "code", category: "asolaria_src_code", root: "src", extensions: [".js"] },
  { kind: "code", category: "asolaria_route_code", root: "routes", extensions: [".js"] },
  { kind: "cube", category: "behcs_cube", root: "data/behcs/cubes", extensions: [".js"] },
  { kind: "cube", category: "behcs_sovereignty_cube", root: "data/behcs/sovereignty/ix/cubes", extensions: [".js"] },
  { kind: "behcs", category: "behcs_codex_surface", root: "data/behcs/codex", extensions: [".json", ".js"] },
  { kind: "behcs", category: "behcs_index_surface", root: "data/behcs/index", extensions: [".json", ".md"] },
  { kind: "behcs", category: "behcs_map_surface", root: "data/behcs/maps", extensions: [".json"] },
  { kind: "wiki", category: "asolaria_agent_index_wiki", root: "data/agent-index", extensions: [".md", ".json"] }
]);

const EXPLICIT_FILES = Object.freeze([
  ["code", "asolaria_server", "server.js"],
  ["mcp", "asolaria_mcp_policy", "src/asolariaMcpPolicy.js"],
  ["mcp", "external_provider_mcp_gate", "src/connectors/externalBrainConnector.js"],
  ["mcp", "augment_context_mcp_gate", "src/connectors/augmentContextConnector.js"],
  ["mcp", "coordinator_mcp_surface", "src/coordinatorToolSurface.js"],
  ["mcp", "spawn_context_mcp_lane", "src/spawnContextBuilder.js"],
  ["token", "token_reduction_provider_policy", "src/connectors/externalBrainConnector.js"],
  ["token", "token_efficiency_skill", "skills/codebase-review-token-efficiency-snapshot/skill.json"],
  ["token", "pid_fabric_token_reduction", "data/behcs/pid-fabric/preload/global-pid-preload-pack.v1.json"],
  ["supervisor", "supervisor_pid_index", "data/behcs/pid-fabric/index/supervisor-pid-indicator-index-latest.json"],
  ["system", "device_pid_index", "data/behcs/pid-fabric/index/device-pid-indicator-index-latest.json"]
]);

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeJson(filePath, data) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function writeText(filePath, data) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, data.endsWith("\n") ? data : `${data}\n`, "utf8");
}

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_error) {
    return fallback;
  }
}

function repoRel(filePath) {
  const relative = path.relative(repoRoot, filePath);
  if (path.isAbsolute(relative) || relative.startsWith("..")) {
    return filePath.replace(/\\/g, "/");
  }
  return relative.replace(/\\/g, "/");
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function stableNumber(seed, digits = 12) {
  const mod = 10n ** BigInt(digits);
  return (BigInt(`0x${sha256(seed).slice(0, 15)}`) % mod).toString().padStart(digits, "0");
}

function cleanText(value, maxLen = 320) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text ? text.slice(0, maxLen) : "";
}

function pidFor(kind, seed) {
  const prefix = PID_PREFIX[kind] || PID_PREFIX.system;
  return `${prefix}.${stableNumber(seed)}`;
}

function basenameOrNull(value) {
  const text = cleanText(value, 900);
  if (!text) return null;
  try {
    return path.basename(text.replace(/^"|"$/g, ""));
  } catch (_error) {
    return null;
  }
}

function redactPath(value) {
  const text = cleanText(value, 1200);
  if (!text) return null;
  return {
    basename: basenameOrNull(text),
    hash: sha256(text).slice(0, 16)
  };
}

function sanitize(value, key = "") {
  const lowered = String(key || "").toLowerCase();
  if (value === null || value === undefined || value === "") {
    return value;
  }
  if (/token|secret|password|authorization|apikey|api_key|credential/.test(lowered)) {
    return { redacted: true, hash: sha256(String(value)).slice(0, 16) };
  }
  if (/serial|uuid|guid|deviceid|pnpdeviceid|hardwareid|mac|physicaladdress|processorid/.test(lowered)) {
    return { redacted: true, hash: sha256(String(value)).slice(0, 16) };
  }
  if (/path|location|commandline|pathname|installsource|installdate/.test(lowered) && typeof value === "string") {
    return redactPath(value);
  }
  if (Array.isArray(value)) {
    return value.slice(0, 40).map((item, index) => sanitize(item, `${key}_${index}`));
  }
  if (typeof value === "object") {
    const output = {};
    for (const [childKey, childValue] of Object.entries(value)) {
      output[childKey] = sanitize(childValue, childKey);
    }
    return output;
  }
  if (typeof value === "string") {
    return cleanText(value, 480);
  }
  return value;
}

function makeRecord(kind, category, label, source, descriptor, evidenceLevel = "LOCAL_OBSERVED") {
  const safeDescriptor = sanitize(descriptor || {});
  const descriptorHash = sha256(JSON.stringify({ kind, category, label, source, safeDescriptor }));
  return {
    pid: pidFor(kind, descriptorHash),
    pidKind: kind,
    category,
    label: cleanText(label || category || kind, 240),
    source,
    evidenceLevel,
    descriptorHash,
    descriptor: safeDescriptor
  };
}

function powershellJson(script, timeoutMs = 90000) {
  const result = childProcess.spawnSync("powershell.exe", [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    script
  ], {
    cwd: repoRoot,
    encoding: "utf8",
    timeout: timeoutMs,
    windowsHide: true,
    maxBuffer: 25 * 1024 * 1024
  });
  if (result.error || result.status !== 0) {
    return {
      ok: false,
      error: result.error ? result.error.message : cleanText(result.stderr, 1000),
      value: null
    };
  }
  try {
    return { ok: true, error: "", value: JSON.parse(result.stdout || "null") };
  } catch (error) {
    return { ok: false, error: error.message, value: null };
  }
}

function normalizeRows(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function collectLiveOsRecords(generatedAt) {
  const script = `
$ErrorActionPreference = 'SilentlyContinue'
$out = [ordered]@{}
$out.Processes = @(Get-Process | Sort-Object ProcessName,Id | Select-Object -First 500 -Property Id,ProcessName,CPU,WorkingSet64,Path,Company,FileVersion)
# Delta L2 non-CIM rewrite 2026-05-26 — replaces Get-CimInstance Win32_SystemDriver + Win32_PnPSignedDriver
# per feedback_avoid_WMI_CIM_probes_on_liris Class-1 hazard. Path B pattern bilateral parity (Delta L1).
# Field-coverage trade-off: PathName/Signer/DriverVersion/DriverDate/InfName/IsSigned/DriverProviderName not directly
# exposed by non-CIM primitives; set null. Upgrade path: pnputil /enum-drivers /format:csv if fidelity needed.
$out.SystemDrivers = @(Get-Service -ServiceType KernelDriver,FileSystemDriver -ErrorAction SilentlyContinue | ForEach-Object {
  [PSCustomObject]@{
    Name = $_.Name
    DisplayName = $_.DisplayName
    State = $_.Status
    StartMode = $_.StartType
    PathName = $null
    ServiceType = $_.ServiceType
  }
})
$out.PnPSignedDrivers = @(Get-PnpDevice -PresentOnly -ErrorAction SilentlyContinue | ForEach-Object {
  [PSCustomObject]@{
    DeviceName = $_.FriendlyName
    Manufacturer = $_.Manufacturer
    DriverProviderName = $null
    DriverVersion = $null
    DriverDate = $null
    DeviceClass = $_.Class
    InfName = $null
    IsSigned = $null
    Signer = $null
    DeviceID = $_.InstanceId
  }
})
$uninstallRoots = @(
  'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',
  'HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',
  'HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*'
)
$programs = @()
foreach ($root in $uninstallRoots) {
  $programs += @(Get-ItemProperty $root | Where-Object { $_.DisplayName } | Select-Object -Property DisplayName,DisplayVersion,Publisher,InstallDate,InstallLocation,UninstallString)
}
$out.Programs = @($programs | Sort-Object DisplayName -Unique | Select-Object -First 700)
$out | ConvertTo-Json -Depth 5 -Compress
`;
  const live = powershellJson(script, 120000);
  const records = [];
  if (!live.ok || !live.value) {
    return {
      status: "live_os_partial_or_unavailable",
      error: live.error,
      records
    };
  }
  for (const processRow of normalizeRows(live.value.Processes)) {
    records.push(makeRecord(
      "process",
      "task_manager_process",
      processRow.ProcessName || `pid-${processRow.Id}`,
      "windows.get_process",
      { ...processRow, generatedAt },
      "OS_VISIBLE_TASK_MANAGER"
    ));
  }
  for (const driver of normalizeRows(live.value.SystemDrivers)) {
    records.push(makeRecord(
      "driver",
      "windows_system_driver",
      driver.DisplayName || driver.Name || "system-driver",
      "windows.cim.Win32_SystemDriver",
      { ...driver, generatedAt },
      "OS_VISIBLE_DRIVER"
    ));
  }
  for (const driver of normalizeRows(live.value.PnPSignedDrivers)) {
    records.push(makeRecord(
      "driver",
      "windows_pnp_signed_driver",
      driver.DeviceName || driver.InfName || "pnp-driver",
      "windows.cim.Win32_PnPSignedDriver",
      { ...driver, generatedAt },
      "OS_VISIBLE_DRIVER"
    ));
  }
  for (const program of normalizeRows(live.value.Programs)) {
    records.push(makeRecord(
      "program",
      "installed_program",
      program.DisplayName || "installed-program",
      "windows.registry.uninstall",
      { ...program, generatedAt },
      "OS_VISIBLE_INSTALLED_PROGRAM"
    ));
  }
  return { status: "ok", error: "", records };
}

function fileHash(filePath) {
  const stat = fs.statSync(filePath);
  const hash = crypto.createHash("sha256");
  const fd = fs.openSync(filePath, "r");
  try {
    const limit = Math.min(stat.size, 2 * 1024 * 1024);
    const buffer = Buffer.alloc(Math.min(limit, 64 * 1024));
    let offset = 0;
    while (offset < limit) {
      const read = fs.readSync(fd, buffer, 0, Math.min(buffer.length, limit - offset), offset);
      if (!read) break;
      hash.update(buffer.subarray(0, read));
      offset += read;
    }
    hash.update(String(stat.size));
    return hash.digest("hex");
  } finally {
    fs.closeSync(fd);
  }
}

function listFiles(root, extensions, limit = 2000) {
  const absRoot = path.join(repoRoot, root);
  if (!fs.existsSync(absRoot)) return [];
  const output = [];
  const stack = [absRoot];
  while (stack.length && output.length < limit) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile() && extensions.includes(path.extname(entry.name).toLowerCase())) {
        output.push(full);
        if (output.length >= limit) break;
      }
    }
  }
  return output.sort((a, b) => repoRel(a).localeCompare(repoRel(b)));
}

function collectFileRecords(generatedAt) {
  const records = [];
  for (const group of FILE_GROUPS) {
    for (const filePath of listFiles(group.root, group.extensions)) {
      const rel = repoRel(filePath);
      const stat = fs.statSync(filePath);
      const label = path.basename(filePath);
      const descriptor = {
        path: rel,
        bytes: stat.size,
        mtimeMs: Math.round(stat.mtimeMs),
        fileHash: fileHash(filePath),
        generatedAt
      };
      let kind = group.kind;
      let category = group.category;
      if (/mcp/i.test(rel)) {
        kind = "mcp";
        category = `${category}_mcp`;
      } else if (/token|reduction|efficien/i.test(rel)) {
        kind = "token";
        category = `${category}_token_reduction`;
      } else if (/google-code-wiki|code-wiki|wiki/i.test(rel)) {
        kind = "wiki";
        category = `${category}_code_wiki`;
      }
      records.push(makeRecord(kind, category, label, "repo.file", descriptor, "REPO_FILE_OBSERVED"));
    }
  }
  for (const [kind, category, relPath] of EXPLICIT_FILES) {
    const filePath = path.join(repoRoot, relPath);
    if (!fs.existsSync(filePath)) continue;
    const stat = fs.statSync(filePath);
    records.push(makeRecord(kind, category, path.basename(relPath), "repo.explicit_surface", {
      path: relPath,
      bytes: stat.size,
      mtimeMs: Math.round(stat.mtimeMs),
      fileHash: fileHash(filePath),
      generatedAt
    }, "REPO_FILE_OBSERVED"));
  }
  return records;
}

function collectCodexSkillRecords(generatedAt) {
  const records = [];
  const codexSkillsRoot = path.join(userRoot, ".codex", "skills");
  if (!fs.existsSync(codexSkillsRoot)) return records;
  const stack = [codexSkillsRoot];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (entry.isFile() && entry.name === "SKILL.md") {
        const rel = path.relative(codexSkillsRoot, full).replace(/\\/g, "/");
        const body = fs.readFileSync(full, "utf8");
        const kind = /google-code-wiki|wiki/i.test(rel) ? "wiki" : "skill";
        records.push(makeRecord(kind, "codex_skill_reference", rel.replace(/\/SKILL\.md$/i, ""), "codex.skills", {
          relativePath: rel,
          bytes: Buffer.byteLength(body, "utf8"),
          fileHash: sha256(body),
          generatedAt
        }, "CODEX_SKILL_OBSERVED"));
      }
    }
  }
  return records;
}

function collectMcpServerRecords(generatedAt) {
  const records = [];
  const mcpRoot = path.join(userRoot, "mcp-servers");
  if (fs.existsSync(mcpRoot)) {
    const files = [];
    const stack = [mcpRoot];
    while (stack.length && files.length < 500) {
      const current = stack.pop();
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        if (entry.name === "node_modules" || entry.name === ".git") continue;
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) stack.push(full);
        else if (entry.isFile() && [".js", ".json", ".md", ".ts"].includes(path.extname(entry.name).toLowerCase())) files.push(full);
      }
    }
    for (const filePath of files.sort()) {
      const stat = fs.statSync(filePath);
      records.push(makeRecord("mcp", "local_mcp_server_file", path.basename(filePath), "local.mcp_servers", {
        pathHash: sha256(filePath).slice(0, 16),
        relativePath: path.relative(mcpRoot, filePath).replace(/\\/g, "/"),
        bytes: stat.size,
        fileHash: fileHash(filePath),
        generatedAt
      }, "LOCAL_MCP_SERVER_OBSERVED"));
    }
  }
  return records;
}

function collectCpuGpuCrossRefs(generatedAt) {
  const deviceIndexPath = path.join(repoRoot, "data", "behcs", "pid-fabric", "index", "device-pid-indicator-index-latest.json");
  const deviceIndex = readJson(deviceIndexPath, { records: [] });
  return (deviceIndex.records || [])
    .filter((row) => /processor|video|gpu|display|graphics/i.test(`${row.category} ${row.label} ${JSON.stringify(row.descriptor || {})}`))
    .map((row) => {
      const isGpu = /video|gpu|display|graphics|nvidia|intel\(r\) uhd/i.test(`${row.category} ${row.label}`);
      return makeRecord(isGpu ? "gpu" : "cpu", isGpu ? "gpu_device_crossref" : "cpu_device_crossref", row.label, "device-pid-index.crossref", {
        sourcePid: row.pid,
        sourceCategory: row.category,
        sourceEvidence: row.evidenceLevel,
        sourceDescriptorHash: row.descriptorHash,
        generatedAt
      }, "DEVICE_PID_CROSSREF");
    });
}

function collectSupervisorCrossRefs(generatedAt) {
  const supervisorIndexPath = path.join(repoRoot, "data", "behcs", "pid-fabric", "index", "supervisor-pid-indicator-index-latest.json");
  const supervisorIndex = readJson(supervisorIndexPath, { supervisors: [] });
  return (supervisorIndex.supervisors || []).map((row) => makeRecord("supervisor", "supervisor_pid_crossref", row.supervisorId, "supervisor-pid-index.crossref", {
    supervisorPid: row.indicatorPid,
    nativePid: row.nativePid,
    supervisorSet: row.setId,
    sourceFile: row.sourceFile,
    generatedAt
  }, "SUPERVISOR_PID_CROSSREF"));
}

function dedupe(records) {
  const seen = new Set();
  const pidSeen = new Set();
  const output = [];
  for (const record of records) {
    const key = `${record.pidKind}:${record.category}:${record.descriptorHash}`;
    if (seen.has(key)) continue;
    seen.add(key);
    let row = record;
    let suffix = 1;
    while (pidSeen.has(row.pid)) {
      row = { ...row, pid: pidFor(row.pidKind, `${record.descriptorHash}:${suffix}`) };
      suffix += 1;
    }
    pidSeen.add(row.pid);
    output.push(row);
  }
  return output;
}

function countBy(records, field) {
  return records.reduce((acc, row) => {
    const key = String(row[field] || "unknown");
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function buildIndex(generatedAt) {
  const live = collectLiveOsRecords(generatedAt);
  const records = dedupe([
    ...collectCpuGpuCrossRefs(generatedAt),
    ...live.records,
    ...collectFileRecords(generatedAt),
    ...collectCodexSkillRecords(generatedAt),
    ...collectMcpServerRecords(generatedAt),
    ...collectSupervisorCrossRefs(generatedAt)
  ]);
  const index = {
    indexId: "system-surface-pid-indicator-index.v1",
    generatedAt,
    status: live.status === "ok" ? "SYSTEM_SURFACE_PID_INDICATED" : "SYSTEM_SURFACE_PID_INDICATED_WITH_LIVE_OS_HOLD",
    purpose: "PID GPU/CPU crossrefs, drivers, task-manager processes, installed programs, tools, skills, MCP surfaces, Asolaria code/wiki surfaces, token-reduction surfaces, cubes, BEHCS surfaces, and supervisor crossrefs.",
    truthBoundary: "Descriptors are PIDed. Secrets, raw command lines, raw serials, tokens, and provider credentials are redacted or hashed. No process is killed, installed, spawned, or remotely called by this pass.",
    liveOs: {
      status: live.status,
      error: live.error || null,
      records: live.records.length
    },
    counts: {
      totalRecords: records.length,
      uniquePids: new Set(records.map((row) => row.pid)).size,
      pidKind: countBy(records, "pidKind"),
      evidenceLevel: countBy(records, "evidenceLevel")
    },
    pidNamespace: PID_PREFIX,
    records,
    d11: live.status === "ok" ? "PROVEN_LOCAL_DESCRIPTOR_INDEX" : "OBSERVED_WITH_LIVE_OS_HOLD"
  };
  index.indexHash = sha256(JSON.stringify(index));
  return index;
}

function buildPreload(index) {
  return {
    preloadId: "system-surface-pid-preload-bindings.v1",
    generatedAt: index.generatedAt,
    status: index.status,
    indexHash: index.indexHash,
    systemSurfacePidIndex: repoRel(OUTPUTS.index),
    loadContract: {
      preloadOnce: true,
      sendPerSurface: ["pid", "pidKind", "category", "label", "descriptorHash", "evidenceLevel"],
      returnPerSurface: ["pid", "decision", "evidenceHash", "nextGate"],
      bannedPerSurface: ["raw command lines", "raw serials", "tokens", "secrets", "full repeated tool schemas"]
    },
    pids: index.records.map((row) => ({
      pid: row.pid,
      pidKind: row.pidKind,
      category: row.category,
      label: row.label,
      evidenceLevel: row.evidenceLevel,
      descriptorHash: row.descriptorHash
    }))
  };
}

function buildNdjson(index) {
  return index.records.map((row) => JSON.stringify({
    kind: "system_surface_pid_indicator",
    generatedAt: index.generatedAt,
    pid: row.pid,
    pidKind: row.pidKind,
    category: row.category,
    label: row.label,
    evidenceLevel: row.evidenceLevel,
    descriptorHash: row.descriptorHash,
    payloadShape: "pid_surface_identity_hash_only"
  })).join("\n") + (index.records.length ? "\n" : "");
}

function buildGlpj(index) {
  return {
    glpjId: "system-surface-pid-indicator.glpj.v1",
    generatedAt: index.generatedAt,
    alphabet: "BEHCS-256",
    status: "MINTED",
    sentence: "CPU_GPU_DRIVER_PROCESS_PROGRAM_TOOL_SKILL_MCP_WIKI_TOKEN_CUBE_BEHCS_SUPERVISOR -> PID -> PRELOAD -> TOKEN_REDUCTION",
    glyphs: [
      { glyph: "SURFACE_PID_DESCRIPTOR", meaning: "Every routable system surface has a compact PID descriptor." },
      { glyph: "TOKEN_REDUCTION_PRELOAD", meaning: "Tools, skills, cubes, MCP and BEHCS surfaces are preloaded once and referenced by PID." },
      { glyph: "TASK_MANAGER_PID", meaning: "Running processes are addressable as observed descriptors, not mutation targets." },
      { glyph: "DRIVER_PROGRAM_PID", meaning: "Drivers and installed programs are visible to routing without exposing command lines or secrets." },
      { glyph: "CODE_WIKI_BEHCS_PID", meaning: "Agent index, code wiki, cubes, BEHCS, and supervisors are in the same PID language." }
    ],
    counts: index.counts,
    d11: index.d11
  };
}

function buildMemory(index) {
  return {
    memoryId: "system-surface-pid-indicator-index.v1",
    generatedAt: index.generatedAt,
    event: "System surfaces were PID-indicated across CPU/GPU, drivers, processes, programs, tools, skills, MCP, wiki, token reduction, cubes, BEHCS, and supervisors.",
    significance: "The PID fabric now covers the operating and language surfaces that make Asolaria efficient: hardware descriptors, runtime processes, tool/skill catalogs, MCP gates, code/wiki knowledge, token-reduction rules, cubes, BEHCS-256, and supervisor crossrefs can be preloaded once and addressed by compact PID packets.",
    counts: index.counts,
    indexHash: index.indexHash,
    d11: index.d11
  };
}

function buildMap(index) {
  return {
    mapId: "system-surface-pid-map-map-mapped.v1",
    generatedAt: index.generatedAt,
    status: "MAP_MAP_MAPPED",
    indexHash: index.indexHash,
    edges: index.records.map((row) => ({
      from: row.pid,
      to: row.source,
      relation: "system_surface_pid_descriptor",
      pidKind: row.pidKind,
      category: row.category
    })),
    d11: index.d11
  };
}

function buildCube(index) {
  return `"use strict";

const systemSurfacePidIndicatorCube = Object.freeze({
  cubeId: "system-surface-pid-indicator-cube-cubed.v1",
  generatedAt: ${JSON.stringify(index.generatedAt)},
  status: "CUBE_CUBE_CUBED",
  index: "data/behcs/pid-fabric/index/system-surface-pid-indicator-index-latest.json",
  dimensions: Object.freeze({
    hardware: "cpu/gpu descriptors and device crossrefs",
    drivers: "Windows system and PnP driver descriptors",
    runtime: "task manager process descriptors",
    programs: "installed program descriptors",
    tools: "Asolaria tool/script surfaces",
    skills: "Asolaria and Codex skill surfaces",
    mcp: "Asolaria BEHCS-256 MCP gates and local MCP server files",
    tokenReduction: "preload, pointer, compact, and schema-reduction surfaces",
    cubesBehcs: "cube-cubed and BEHCS-256 language surfaces",
    supervisors: "supervisor PID crossrefs"
  }),
  classify(row) {
    if (!row || !row.pid) return "HOLD_NO_PID";
    if (row.pidKind === "process") return "TASK_MANAGER_PROCESS_PID";
    if (row.pidKind === "driver") return "DRIVER_DESCRIPTOR_PID";
    if (row.pidKind === "program") return "PROGRAM_DESCRIPTOR_PID";
    if (row.pidKind === "mcp") return "ASOLARIA_MCP_SURFACE_PID";
    if (row.pidKind === "token") return "TOKEN_REDUCTION_SURFACE_PID";
    if (row.pidKind === "cube" || row.pidKind === "behcs") return "BEHCS_CUBE_LANGUAGE_PID";
    if (row.pidKind === "supervisor") return "SUPERVISOR_CROSSREF_PID";
    return "SYSTEM_SURFACE_PID";
  },
  route(row) {
    const classification = this.classify(row);
    return {
      classification,
      allowed: classification !== "HOLD_NO_PID",
      mutationAllowed: false,
      pid: row && row.pid || "",
      requiredPreload: "system-surface-pid-preload-bindings-latest.json",
      tokenReduction: "preload_once_reference_by_pid"
    };
  }
});

export default systemSurfacePidIndicatorCube;
`;
}

function buildReport(index) {
  const kindRows = Object.entries(index.counts.pidKind).sort((a, b) => b[1] - a[1]).map(([kind, count]) => `| ${kind} | ${count} |`).join("\n");
  const evidenceRows = Object.entries(index.counts.evidenceLevel).sort((a, b) => b[1] - a[1]).map(([kind, count]) => `| ${kind} | ${count} |`).join("\n");
  const json = {
    reportId: "system-surface-pid-indicator-index-latest",
    generatedAt: index.generatedAt,
    status: index.status,
    counts: index.counts,
    indexHash: index.indexHash,
    truthBoundary: index.truthBoundary,
    outputs: Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)])),
    d11: index.d11
  };
  const md = `# System Surface PID Indicator Index

Status: ${index.status}

GPU/CPU crossrefs, drivers, task-manager processes, installed programs, tools, skills, MCP, Asolaria code/wiki, token-reduction surfaces, cubes, BEHCS-256 surfaces, and supervisor crossrefs are now PID-indicated.

## Counts

- Total PID records: ${index.counts.totalRecords}
- Unique PIDs: ${index.counts.uniquePids}
- Live OS records: ${index.liveOs.records}

## PID Kinds

| Kind | Count |
|---|---:|
${kindRows}

## Evidence

| Evidence | Count |
|---|---:|
${evidenceRows}

## Truth Boundary

${index.truthBoundary}

## Outputs

- \`${repoRel(OUTPUTS.index)}\`
- \`${repoRel(OUTPUTS.ndjson)}\`
- \`${repoRel(OUTPUTS.preload)}\`
- \`${repoRel(OUTPUTS.map)}\`
- \`${repoRel(OUTPUTS.cube)}\`
- \`${repoRel(OUTPUTS.glpj)}\`

D11: ${index.d11}
`;
  return { json, md };
}

function run() {
  const generatedAt = new Date().toISOString();
  const index = buildIndex(generatedAt);
  const preload = buildPreload(index);
  const report = buildReport(index);
  writeJson(OUTPUTS.index, index);
  writeText(OUTPUTS.ndjson, buildNdjson(index));
  writeJson(OUTPUTS.preload, preload);
  writeJson(OUTPUTS.reportJson, report.json);
  writeText(OUTPUTS.reportMd, report.md);
  writeJson(OUTPUTS.memory, buildMemory(index));
  writeJson(OUTPUTS.map, buildMap(index));
  writeJson(OUTPUTS.glpj, buildGlpj(index));
  writeText(OUTPUTS.cube, buildCube(index));
  console.log(JSON.stringify({
    ok: true,
    status: index.status,
    counts: index.counts,
    index: repoRel(OUTPUTS.index),
    report: repoRel(OUTPUTS.reportMd)
  }, null, 2));
}

if (require.main === module) {
  run();
}

module.exports = {
  buildIndex,
  pidFor
};
