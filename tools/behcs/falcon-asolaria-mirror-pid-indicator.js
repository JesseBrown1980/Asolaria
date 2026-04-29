#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const http = require("http");
const { spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..", "..");
const runId = "falcon-asolaria-mirror-pid-20260427";
const eventId = "EVT-FALCON-ASOLARIA-MIRROR-PID-2026-04-27";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", runId);
const pidFabricRoot = path.join(repoRoot, "data", "behcs", "pid-fabric");

const OUTPUTS = Object.freeze({
  index: path.join(pidFabricRoot, "index", "falcon-asolaria-mirror-pid-indicator-index-latest.json"),
  ndjson: path.join(pidFabricRoot, "requests", "falcon-asolaria-mirror-pid-indicator-latest.ndjson"),
  preload: path.join(pidFabricRoot, "preload", "falcon-asolaria-mirror-pid-preload-bindings-latest.json"),
  supervisorSet: path.join(repoRoot, "data", "behcs", "supervisors", "falcon", "falcon-asolaria-mirror-pid-supervisors.v1.json"),
  probe: path.join(runRoot, "falcon-asolaria-mirror-pid-probe.v1.json"),
  chain: path.join(runRoot, "COSIGN_CHAIN.ndjson"),
  localEnvelope: path.join(runRoot, "falcon-asolaria-mirror-pid-local-bus-envelope.json"),
  localPostResult: path.join(runRoot, "falcon-asolaria-mirror-pid-local-bus-post-result.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "falcon-asolaria-mirror-pid-indicator.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "falcon-asolaria-mirror-pid-map-map-mapped.v1.json"),
  cube: path.join(repoRoot, "data", "behcs", "cubes", "falcon-asolaria-mirror-pid-cube-cubed.cube.js"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "falcon-asolaria-mirror-pid-behcs256.glpj.json"),
  reportJson: path.join(repoRoot, "reports", "falcon-asolaria-mirror-pid-indicator-latest.json"),
  reportMd: path.join(repoRoot, "reports", "falcon-asolaria-mirror-pid-indicator-latest.md")
});

const GETPROP_KEYS = Object.freeze([
  "ro.product.manufacturer",
  "ro.product.model",
  "ro.product.device",
  "ro.product.name",
  "ro.product.board",
  "ro.build.version.release",
  "ro.build.version.sdk",
  "ro.build.version.security_patch",
  "ro.build.display.id",
  "ro.build.fingerprint",
  "ro.hardware",
  "ro.boot.hardware",
  "ro.soc.manufacturer",
  "ro.soc.model",
  "ro.product.cpu.abi",
  "ro.product.cpu.abilist",
  "ro.bootloader",
  "gsm.version.baseband"
]);

const FALCON_RELEVANCE = /falcon|phone|android|device|mirror|live-free-agent|mcp|law-033|base-os|processor|unison|dual-computer|opencode/i;

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeText(filePath, text) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, text.endsWith("\n") ? text : `${text}\n`, "utf8");
}

function writeJson(filePath, value) {
  writeText(filePath, JSON.stringify(value, null, 2));
}

function writeNdjson(filePath, rows) {
  writeText(filePath, rows.map((row) => JSON.stringify(row)).join("\n"));
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
  if (path.isAbsolute(relative) || relative.startsWith("..")) return filePath.replace(/\\/g, "/");
  return relative.replace(/\\/g, "/");
}

function sha(value) {
  return crypto.createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex");
}

function stableNumber(seed) {
  return (BigInt(`0x${sha(seed).slice(0, 15)}`) % 1000000000000n).toString().padStart(12, "0");
}

function pidFor(kind, seed) {
  const normalized = String(kind || "surface").toLowerCase();
  if (normalized === "node") return `BH.FALCON.NODE.${stableNumber(seed)}`;
  if (normalized === "device") return `BH.FALCON.DEVICE.${stableNumber(seed)}`;
  if (normalized === "firmware") return `BH.FALCON.FIRMWARE.${stableNumber(seed)}`;
  if (normalized === "chip") return `BH.FALCON.CHIP.${stableNumber(seed)}`;
  if (normalized === "package") return `BH.FALCON.PACKAGE.${stableNumber(seed)}`;
  if (normalized === "process") return `BH.FALCON.PROCESS.${stableNumber(seed)}`;
  if (normalized === "supervisor") return `BH.FALCON.SUP.${stableNumber(seed)}`;
  if (normalized === "hold") return `BH.FALCON.HOLD.${stableNumber(seed)}`;
  return `BH.FALCON.SURFACE.${stableNumber(seed)}`;
}

function runCommand(cmd, args, timeout = 20000) {
  const result = spawnSync(cmd, args, {
    cwd: repoRoot,
    encoding: "utf8",
    timeout,
    windowsHide: true
  });
  return {
    command: [cmd, ...args].join(" "),
    ok: result.status === 0,
    exitCode: result.status,
    stdout: (result.stdout || "").trim(),
    stderr: (result.stderr || "").trim()
  };
}

function adbShell(command, timeout = 20000) {
  return runCommand("adb", ["shell", command], timeout);
}

function httpJson(method, url, body = null, timeoutMs = 10000) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const payload = body ? Buffer.from(JSON.stringify(body), "utf8") : null;
    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path: `${parsed.pathname}${parsed.search}`,
      method,
      headers: payload ? {
        "content-type": "application/json",
        "content-length": payload.length,
        connection: "close"
      } : { connection: "close" },
      timeout: timeoutMs
    }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        let responseBody = text;
        try {
          responseBody = JSON.parse(text);
        } catch (_error) {
          // Keep raw text.
        }
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode, body: responseBody });
      });
    });
    req.on("timeout", () => req.destroy(new Error("request_timeout")));
    req.on("error", (error) => resolve({ ok: false, error: error.message }));
    if (payload) req.write(payload);
    req.end();
  });
}

function parseAdbDevices(text) {
  return text.split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("List of devices"))
    .map((line) => {
      const [serial, state, ...rest] = line.split(/\s+/);
      const restText = rest.join(" ");
      return {
        serialHash: sha(serial).slice(0, 16),
        serialPreview: `${serial.slice(0, 4)}...${serial.slice(-3)}`,
        state,
        product: (restText.match(/product:([^\s]+)/) || [])[1] || "",
        model: (restText.match(/model:([^\s]+)/) || [])[1] || "",
        device: (restText.match(/device:([^\s]+)/) || [])[1] || "",
        transportId: (restText.match(/transport_id:([^\s]+)/) || [])[1] || ""
      };
    });
}

function parsePackages(text) {
  return text.split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("package:"))
    .map((line) => line.replace(/^package:/, ""));
}

function parseProcesses(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const records = [];
  for (const line of lines.slice(1)) {
    const parts = line.split(/\s+/);
    if (parts.length < 9) continue;
    records.push({
      user: parts[0],
      androidPid: parts[1],
      ppid: parts[2],
      state: parts[7],
      name: parts.slice(8).join(" ")
    });
  }
  return records;
}

function parseCpuInfo(text) {
  const processors = [];
  let current = {};
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([^:]+)\s*:\s*(.*)$/);
    if (!match) continue;
    const key = match[1].trim();
    const value = match[2].trim();
    if (key === "processor" && Object.keys(current).length) {
      processors.push(current);
      current = {};
    }
    current[key] = value;
  }
  if (Object.keys(current).length) processors.push(current);
  return processors;
}

function listSupervisorFiles(root) {
  if (!fs.existsSync(root)) return [];
  const out = [];
  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.isFile() && entry.name.toLowerCase().endsWith(".json")) out.push(full);
    }
  }
  return out.sort((a, b) => repoRel(a).localeCompare(repoRel(b)));
}

function supervisorRowsFromFile(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  if (!FALCON_RELEVANCE.test(`${repoRel(filePath)}\n${text}`)) return [];
  let doc = {};
  try {
    doc = JSON.parse(text);
  } catch (_error) {
    return [];
  }
  const setId = doc.supervisorSetId || doc.id || doc.setId || path.basename(filePath, ".json");
  const rows = Array.isArray(doc.supervisors) ? doc.supervisors : [];
  if (!rows.length) {
    return [{
      sourceFile: repoRel(filePath),
      setId,
      supervisorId: setId,
      title: setId,
      role: "falcon-relevant-supervisor-set",
      nativePid: null
    }];
  }
  return rows.map((row, index) => ({
    sourceFile: repoRel(filePath),
    setId,
    supervisorId: row.id || row.supervisorId || row.name || `${setId}#${index + 1}`,
    title: row.title || row.role || row.domain || row.id || `${setId}#${index + 1}`,
    role: row.role || row.domain || row.authority || "",
    nativePid: row.pid || row.pidRef || row.supervisorPid || null
  }));
}

function makeRecord(kind, category, label, descriptor, evidenceLevel, observed = true) {
  const seed = `${kind}:${category}:${label}:${JSON.stringify(descriptor)}`;
  return {
    pid: pidFor(kind, seed),
    pidKind: kind,
    category,
    label: String(label || category).slice(0, 240),
    source: "falcon_asolaria_mirror",
    evidenceLevel,
    observed,
    descriptorHash: sha(descriptor),
    descriptor
  };
}

function buildSupervisorSet(generatedAt, supervisorRecords) {
  const coreSupervisors = [
    ["falcon_asolaria_mirror_truth_gate", "Distinguish host-visible ADB online from in-app mirror status text."],
    ["falcon_law001_orbital_mirror_gate", "Accept Acer-stamped LAW-001 responses as intentional orbital mirror unless Falcon-native authority supersedes."],
    ["falcon_package_process_pid_gate", "Route package/process descriptors by PID without reading app data or mutating packages."],
    ["falcon_firmware_chip_hold_gate", "PID firmware/chip descriptors while holding raw firmware and silicon internals as unobserved."],
    ["falcon_live_free_agent_observer_gate", "Keep Falcon observer-only for live-free-agent protocol until a separate spawn ritual authorizes it."],
    ["falcon_no_phone_mutation_gate", "Block phone file, OS, app install/update, and destructive actions in this PID pass."]
  ].map(([id, authority]) => ({
    id,
    pid: pidFor("supervisor", `${id}:${authority}`),
    role: "falcon-pid-supervisor",
    authority,
    d11: "OBSERVED_LOCAL_HOST_AND_ASOLARIA_MIRROR",
    writePolicy: "descriptor_only_no_phone_mutation"
  }));
  return {
    supervisorSetId: "falcon-asolaria-mirror-pid-supervisors.v1",
    generatedAt,
    status: "FALCON_PID_SUPERVISORS_READY",
    eventId,
    supervisors: coreSupervisors,
    crossrefs: supervisorRecords.slice(0, 80).map((row) => ({
      pid: row.pid,
      label: row.label,
      sourceFile: row.descriptor.sourceFile,
      nativePid: row.descriptor.nativePid || null
    })),
    boundary: "Supervisor set for Falcon PID routing only. No phone mutation, no app update, no live model spawn."
  };
}

async function run() {
  const generatedAt = new Date().toISOString();
  const adbDevicesRaw = runCommand("adb", ["devices", "-l"], 15000);
  const adbDevices = parseAdbDevices(adbDevicesRaw.stdout || "");
  const getprops = {};
  for (const key of GETPROP_KEYS) {
    getprops[key] = adbShell(`getprop ${key}`, 10000).stdout;
  }
  const packagesRaw = adbShell("pm list packages", 30000);
  const processesRaw = adbShell("ps -A", 30000);
  const cpuInfoRaw = adbShell("cat /proc/cpuinfo", 20000);
  const termuxProcessRaw = adbShell("ps -A | grep -i termux", 15000);
  const ipRaw = adbShell("ip -f inet addr show wlan0", 15000);
  const mirrorCapture = await httpJson("POST", "http://127.0.0.1:4781/api/phone/mirror/capture", {}, 20000);
  const falcon4947 = await httpJson("GET", "http://192.168.1.8:4947/behcs/health", null, 7000);
  const falcon4950 = await httpJson("GET", "http://192.168.1.8:4950/behcs/health", null, 7000);

  const packages = parsePackages(packagesRaw.stdout || "");
  const processes = parseProcesses(processesRaw.stdout || "");
  const cpuCores = parseCpuInfo(cpuInfoRaw.stdout || "");
  const records = [];

  records.push(makeRecord("node", "falcon_node", "Falcon / Jesse's S24 FE", {
    eventId,
    generatedAt,
    nodeId: "falcon",
    hostRole: "Asolaria orbital phone node",
    adbOnline: adbDevices.some((row) => row.state === "device"),
    mirrorCaptureOk: mirrorCapture.ok,
    law001: { port4947: falcon4947.ok, port4950: falcon4950.ok }
  }, "ASOLARIA_MIRROR_AND_ADB_OBSERVED"));

  for (const device of adbDevices) {
    records.push(makeRecord("device", "adb_device", `${device.model || "android"}:${device.device || "device"}`, device, "ADB_HOST_VISIBLE"));
  }

  records.push(makeRecord("device", "android_product", `${getprops["ro.product.manufacturer"]} ${getprops["ro.product.model"]}`, {
    manufacturer: getprops["ro.product.manufacturer"],
    model: getprops["ro.product.model"],
    device: getprops["ro.product.device"],
    name: getprops["ro.product.name"],
    board: getprops["ro.product.board"],
    androidRelease: getprops["ro.build.version.release"],
    sdk: getprops["ro.build.version.sdk"],
    securityPatch: getprops["ro.build.version.security_patch"]
  }, "ADB_GETPROP_OBSERVED"));

  records.push(makeRecord("firmware", "android_build_firmware_descriptor", getprops["ro.build.display.id"] || "android-build", {
    displayId: getprops["ro.build.display.id"],
    fingerprintHash: sha(getprops["ro.build.fingerprint"] || "").slice(0, 20),
    bootloader: getprops["ro.bootloader"],
    baseband: getprops["gsm.version.baseband"]
  }, "ADB_GETPROP_OBSERVED"));

  records.push(makeRecord("chip", "soc_descriptor", getprops["ro.hardware"] || getprops["ro.soc.model"] || "soc", {
    hardware: getprops["ro.hardware"],
    bootHardware: getprops["ro.boot.hardware"],
    socManufacturer: getprops["ro.soc.manufacturer"],
    socModel: getprops["ro.soc.model"],
    abi: getprops["ro.product.cpu.abi"],
    abiList: getprops["ro.product.cpu.abilist"]
  }, "ADB_GETPROP_OBSERVED"));

  for (const core of cpuCores) {
    records.push(makeRecord("chip", "cpu_core_descriptor", `cpu${core.processor || records.length}`, {
      processor: core.processor,
      implementer: core["CPU implementer"],
      architecture: core["CPU architecture"],
      variant: core["CPU variant"],
      part: core["CPU part"],
      revision: core["CPU revision"],
      featuresHash: sha(core.Features || "").slice(0, 20)
    }, "ADB_PROC_CPUINFO_OBSERVED"));
  }

  records.push(makeRecord("surface", "asolaria_phone_mirror_capture", "phone-screen-latest.png", {
    ok: mirrorCapture.ok,
    snapshot: mirrorCapture.body?.snapshot || null,
    uiObservation: "Asolaria phone link visible; UI said mirror adb missing while host ADB was online.",
    truthBoundary: "screen text is a UI state, not the only connectivity authority"
  }, "ASOLARIA_MIRROR_SCREEN_OBSERVED"));

  records.push(makeRecord("surface", "law001_4947", "falcon:4947", {
    endpoint: "http://192.168.1.8:4947/behcs/health",
    ok: falcon4947.ok,
    body: falcon4947.body
  }, "LAW001_LAN_OBSERVED"));
  records.push(makeRecord("surface", "law001_4950", "falcon:4950", {
    endpoint: "http://192.168.1.8:4950/behcs/health",
    ok: falcon4950.ok,
    body: falcon4950.body
  }, "LAW001_LAN_OBSERVED"));
  records.push(makeRecord("surface", "falcon_network_wlan0", "wlan0", {
    outputHash: sha(ipRaw.stdout || "").slice(0, 20),
    outputPreview: (ipRaw.stdout || "").split(/\r?\n/).slice(0, 6)
  }, "ADB_NETWORK_DESCRIPTOR_OBSERVED"));

  for (const pkg of packages) {
    records.push(makeRecord("package", "android_package", pkg, { packageName: pkg }, "ADB_PACKAGE_LIST_OBSERVED"));
  }
  for (const proc of processes) {
    records.push(makeRecord("process", "android_process", proc.name, proc, "ADB_PROCESS_LIST_OBSERVED"));
  }

  records.push(makeRecord("process", "termux_process_surface", "termux", {
    outputHash: sha(termuxProcessRaw.stdout || "").slice(0, 20),
    lines: (termuxProcessRaw.stdout || "").split(/\r?\n/).filter(Boolean).slice(0, 20)
  }, "ADB_PROCESS_LIST_OBSERVED"));

  for (const [label, reason] of [
    ["phone_baseband_raw_dump", "Baseband version descriptor is observed; raw baseband firmware is not dumped."],
    ["secure_enclave_or_tee_internals", "TEE/secure element internals are not readable through this pass."],
    ["gpu_firmware_raw_dump", "GPU/firmware internals are not dumped."],
    ["modem_nv_items", "Modem NV state is not read or modified."],
    ["app_private_data", "Installed package names are observed; app private data is not read."]
  ]) {
    records.push(makeRecord("hold", "falcon_unobserved_sensitive_internal", label, { label, reason }, "UNOBSERVED_HOLD", false));
  }

  const supervisorSourceRows = listSupervisorFiles(path.join(repoRoot, "data", "behcs", "supervisors"))
    .flatMap(supervisorRowsFromFile);
  const supervisorRecords = supervisorSourceRows.map((row) => makeRecord("supervisor", "falcon_relevant_supervisor", row.supervisorId, row, "SUPERVISOR_SOURCE_OBSERVED"));
  records.push(...supervisorRecords);

  const supervisorSet = buildSupervisorSet(generatedAt, supervisorRecords);
  writeJson(OUTPUTS.supervisorSet, supervisorSet);
  for (const row of supervisorSet.supervisors) {
    records.push(makeRecord("supervisor", "falcon_pid_supervisor_native", row.id, row, "SUPERVISOR_SOURCE_OBSERVED"));
  }

  const unique = new Map();
  for (const record of records) {
    if (!unique.has(record.pid)) unique.set(record.pid, record);
  }
  const uniqueRecords = [...unique.values()];
  const counts = {
    totalRecords: uniqueRecords.length,
    observedRecords: uniqueRecords.filter((row) => row.observed).length,
    holdRecords: uniqueRecords.filter((row) => !row.observed || row.pidKind === "hold").length,
    packages: uniqueRecords.filter((row) => row.pidKind === "package").length,
    processes: uniqueRecords.filter((row) => row.pidKind === "process").length,
    supervisors: uniqueRecords.filter((row) => row.pidKind === "supervisor").length,
    chips: uniqueRecords.filter((row) => row.pidKind === "chip").length,
    firmware: uniqueRecords.filter((row) => row.pidKind === "firmware").length,
    surfaces: uniqueRecords.filter((row) => row.pidKind === "surface").length
  };
  const index = {
    indexId: "falcon-asolaria-mirror-pid-indicator-index.v1",
    generatedAt,
    runId,
    eventId,
    status: "FALCON_ASOLARIA_MIRROR_PID_INDICATED",
    d11: "OBSERVED_HOST_ADB_PLUS_ASOLARIA_MIRROR_PLUS_LAW001",
    counts,
    truthBoundary: "PIDs cover host-visible Falcon descriptors, Asolaria mirror evidence, LAW-001 surfaces, packages, processes, and supervisor descriptors. This pass does not read app private data, dump firmware, flash devices, install apps, or mutate Falcon.",
    records: uniqueRecords
  };
  index.indexHash = sha(index);
  writeJson(OUTPUTS.index, index);
  writeNdjson(OUTPUTS.ndjson, uniqueRecords.map((row) => ({
    kind: "falcon_asolaria_mirror_pid_indicator",
    generatedAt,
    pid: row.pid,
    pidKind: row.pidKind,
    category: row.category,
    label: row.label,
    observed: row.observed,
    evidenceLevel: row.evidenceLevel,
    descriptorHash: row.descriptorHash
  })));
  writeJson(OUTPUTS.preload, {
    preloadId: "falcon-asolaria-mirror-pid-preload-bindings.v1",
    generatedAt,
    indexHash: index.indexHash,
    count: uniqueRecords.length,
    pids: uniqueRecords.map((row) => ({
      pid: row.pid,
      pidKind: row.pidKind,
      label: row.label,
      evidenceLevel: row.evidenceLevel,
      descriptorHash: row.descriptorHash
    }))
  });
  let previous = "";
  const chainRows = uniqueRecords.map((row, idx) => {
    const base = { seq: idx + 1, ts: generatedAt, eventId, runId, pid: row.pid, descriptorHash: row.descriptorHash, previous };
    const rowSha = sha(base);
    previous = rowSha;
    return { ...base, rowSha };
  });
  writeNdjson(OUTPUTS.chain, chainRows);
  writeJson(OUTPUTS.probe, {
    id: "falcon-asolaria-mirror-pid-probe.v1",
    generatedAt,
    adbDevicesRaw,
    getprops,
    packagesCount: packages.length,
    processesCount: processes.length,
    cpuCoreCount: cpuCores.length,
    mirrorCapture,
    falconLaw001: { port4947: falcon4947, port4950: falcon4950 },
    index: repoRel(OUTPUTS.index),
    supervisorSet: repoRel(OUTPUTS.supervisorSet)
  });
  writeJson(OUTPUTS.memory, {
    memoryId: "falcon-asolaria-mirror-pid-indicator.v1",
    generatedAt,
    eventId,
    status: index.status,
    summary: "Falcon was PID-indicated through Asolaria mirror, host ADB, LAW-001, Android package/process descriptors, firmware/chip descriptors, and Falcon-relevant supervisors.",
    counts,
    indexHash: index.indexHash
  });
  writeJson(OUTPUTS.map, {
    mapId: "falcon-asolaria-mirror-pid-map-map-mapped.v1",
    generatedAt,
    route: ["Asolaria mirror", "host ADB", "Android descriptors", "LAW-001", "supervisor source", "PID preload", "Falcon observer"],
    indexHash: index.indexHash,
    counts
  });
  writeText(OUTPUTS.cube, `const falconAsolariaMirrorPidCube = Object.freeze(${JSON.stringify({
    cubeId: "falcon-asolaria-mirror-pid-cube-cubed.v1",
    generatedAt,
    eventId,
    status: index.status,
    counts,
    mutationAllowed: false
  }, null, 2)});

export const CUBE = falconAsolariaMirrorPidCube;
export default falconAsolariaMirrorPidCube;
`);
  writeJson(OUTPUTS.glpj, {
    glpjId: "falcon-asolaria-mirror-pid-behcs256.glpj.v1",
    generatedAt,
    sentences: [
      "META-PID { FALCON } : ASOLARIA-MIRROR : ADB-HOST-VISIBLE : LAW001 : PACKAGE-PROCESS-SUPERVISOR @ M-EYEWITNESS .",
      "META-GATE { FALCON-MUTATION } : NO-APP-DATA : NO-FIRMWARE-DUMP : NO-FLASH : NO-SPAWN : DESCRIPTOR-ONLY @ M-IMPERATIVE ."
    ],
    counts
  });
  const envelope = {
    verb: "falcon-asolaria-mirror-pid-indicator-summary",
    target: "falcon",
    to: "falcon",
    from: "acer-codex",
    id: "falcon-asolaria-mirror-pid-2026-04-27-summary-001",
    ts: generatedAt,
    runId,
    eventId,
    status: index.status,
    counts,
    artifacts: {
      index: repoRel(OUTPUTS.index),
      preload: repoRel(OUTPUTS.preload),
      supervisorSet: repoRel(OUTPUTS.supervisorSet),
      report: repoRel(OUTPUTS.reportMd)
    },
    glyph_sentence: "META-PID { FALCON-ASOLARIA-MIRROR } : EVERYTHING-VISIBLE-PIDED : SUPERVISORS-PIDED : MUTATION-0 @ M-INDICATIVE .",
    boundary: index.truthBoundary,
    remoteWritesPerformed: 0,
    phoneMutationsPerformed: 0,
    processFanout: 0
  };
  writeJson(OUTPUTS.localEnvelope, envelope);
  const localPost = await httpJson("POST", "http://127.0.0.1:4947/behcs/send", envelope, 10000);
  writeJson(OUTPUTS.localPostResult, { postedAt: new Date().toISOString(), endpoint: "http://127.0.0.1:4947/behcs/send", ...localPost });
  const report = {
    reportId: "falcon-asolaria-mirror-pid-indicator-latest",
    generatedAt,
    status: index.status,
    counts,
    indexHash: index.indexHash,
    outputs: Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)])),
    localPost
  };
  writeJson(OUTPUTS.reportJson, report);
  writeText(OUTPUTS.reportMd, `# Falcon Asolaria Mirror PID Indicator

Generated: ${generatedAt}

Status: ${index.status}

Counts:
- total PID records: ${counts.totalRecords}
- observed records: ${counts.observedRecords}
- hold records: ${counts.holdRecords}
- packages: ${counts.packages}
- processes: ${counts.processes}
- supervisors: ${counts.supervisors}
- chip descriptors: ${counts.chips}
- firmware descriptors: ${counts.firmware}
- Asolaria/LAW-001 surfaces: ${counts.surfaces}

Evidence:
- host ADB online: ${adbDevices.some((row) => row.state === "device")}
- mirror capture ok: ${mirrorCapture.ok}
- Falcon LAW-001 4947 ok: ${falcon4947.ok}
- Falcon LAW-001 4950 ok: ${falcon4950.ok}

Supervisor set:
- ${repoRel(OUTPUTS.supervisorSet)}

Local Asolaria bus post:
- ok: ${localPost.ok}

Boundary: ${index.truthBoundary}
`);
  console.log(JSON.stringify({
    ok: true,
    status: index.status,
    counts,
    localBusPosted: localPost.ok,
    report: repoRel(OUTPUTS.reportMd)
  }, null, 2));
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
