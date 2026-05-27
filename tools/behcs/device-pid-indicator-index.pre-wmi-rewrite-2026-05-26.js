#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const childProcess = require("child_process");

const repoRoot = path.resolve(__dirname, "..", "..");
const pidFabricRoot = path.join(repoRoot, "data", "behcs", "pid-fabric");

const OUTPUTS = Object.freeze({
  index: path.join(pidFabricRoot, "index", "device-pid-indicator-index-latest.json"),
  ndjson: path.join(pidFabricRoot, "requests", "device-pid-indicator-latest.ndjson"),
  preload: path.join(pidFabricRoot, "preload", "device-pid-preload-bindings-latest.json"),
  reportJson: path.join(repoRoot, "reports", "device-pid-indicator-index-latest.json"),
  reportMd: path.join(repoRoot, "reports", "device-pid-indicator-index-latest.md"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "device-pid-indicator-index.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "device-pid-map-map-mapped.v1.json"),
  cube: path.join(repoRoot, "data", "behcs", "cubes", "device-pid-indicator-cube-cubed.cube.js"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "device-pid-indicator.glpj.json")
});

const MANIFEST_INPUTS = Object.freeze([
  "data/behcs/device-registry.json",
  "data/behcs/acer-full-system-manifest.json",
  "data/behcs/nodes/liris-desktop-ptsqtie.node.json",
  "data/behcs/nodes/falcon.node.json",
  "data/behcs/nodes/aether.node.json",
  "data/behcs/novalum-unified-manifest.json",
  "data/behcs/novalum-behcs-manifest.json",
  "data/behcs/hb2/device.proof.json",
  "data/behcs/hb2/crc32.manifest.json",
  "data/behcs/hb3/hashes.v3.manifest.json",
  "data/behcs/qdd-full-behcs-manifest.json"
]);

const LANGUAGE_SURFACES = Object.freeze([
  "data/behcs/cubes/ix-noun-firmware.cube.js",
  "data/behcs/cubes/ix-verb-firmware-read.cube.js",
  "data/behcs/cubes/ix-verb-firmware-write.cube.js",
  "data/behcs/sovereignty/ix/nouns/firmware.js",
  "data/behcs/sovereignty/ix/verbs/firmware-read.js",
  "data/behcs/sovereignty/ix/verbs/firmware-write.js",
  "data/behcs/cubes/translator-device.cube.js",
  "data/behcs/sovereignty/ix/cubes/translator-device.cube.js"
]);

const UNOBSERVED_HOLDS = Object.freeze([
  ["uefi_firmware_image_dump", "Firmware descriptor may be OS-visible; raw UEFI image is not dumped by this pass."],
  ["embedded_controller_firmware_dump", "Embedded controller firmware is not read through ordinary Windows inventory."],
  ["management_engine_or_security_processor_region", "Intel ME or AMD PSP style regions need explicit approved tooling before claims."],
  ["gpu_vbios_image_dump", "GPU adapter is OS-visible; VBIOS image is not dumped here."],
  ["storage_controller_firmware_image", "Disk firmware version may be visible; controller firmware image is not extracted."],
  ["wifi_bluetooth_module_firmware_image", "Adapter presence is visible; module firmware image is not extracted."],
  ["usb_controller_internal_firmware", "USB controller presence is visible; internal controller firmware is not extracted."],
  ["keyboard_touchpad_controller_firmware", "HID devices are visible; embedded controller firmware is not extracted."],
  ["phone_baseband_firmware_dump", "Phone device may be visible through ADB/manifest; baseband firmware is not dumped here."],
  ["novalum_raw_firmware_image", "NovaLUM firmware descriptors exist; raw firmware image is not extracted by this pass."]
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

function pidFor(kind, seed) {
  const pidKind = String(kind || "device").toLowerCase();
  if (pidKind === "firmware") return `BH.FIRMWARE.PID.${stableNumber(seed)}`;
  if (pidKind === "chip") return `BH.CHIP.PID.${stableNumber(seed)}`;
  if (pidKind === "node") return `BH.NODE.PID.${stableNumber(seed)}`;
  if (pidKind === "manifest") return `BH.DEVMAN.PID.${stableNumber(seed)}`;
  if (pidKind === "hold") return `BH.DEVICE.HOLD.${stableNumber(seed)}`;
  return `BH.DEVICE.PID.${stableNumber(seed)}`;
}

function cleanText(value, maxLen = 240) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text ? text.slice(0, maxLen) : "";
}

function redactSensitiveValue(key, value) {
  const safeKey = String(key || "").toLowerCase();
  if (value === null || value === undefined || value === "") {
    return value;
  }
  if (/serial|uuid|guid|deviceid|pnpdeviceid|identifyingnumber|macaddress|physicaladdress|addresswidth/.test(safeKey)) {
    return {
      redacted: true,
      hash: sha256(String(value)).slice(0, 16)
    };
  }
  if (typeof value === "string") {
    const text = cleanText(value, 360);
    if (text.length >= 360) {
      return {
        preview: text.slice(0, 120),
        hash: sha256(value).slice(0, 16)
      };
    }
    return text;
  }
  if (Array.isArray(value)) {
    return value.slice(0, 24).map((item, index) => redactSensitiveValue(`${key}_${index}`, item));
  }
  if (value && typeof value === "object") {
    return sanitizeObject(value);
  }
  return value;
}

function sanitizeObject(input) {
  const source = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const output = {};
  for (const [key, value] of Object.entries(source)) {
    if (key.startsWith("__")) {
      output[key] = cleanText(value, 300);
      continue;
    }
    output[key] = redactSensitiveValue(key, value);
  }
  return output;
}

function normalizeRows(value) {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function classifyLiveKind(className, row) {
  const cls = String(className || "").toLowerCase();
  const pnpClass = cleanText(row.PNPClass || row.PnpClass || row.Class || "", 120).toLowerCase();
  const name = cleanText(row.Name || row.Caption || row.Description || "", 240).toLowerCase();
  if (/bios|firmware/.test(cls) || /firmware|bios|uefi/.test(name)) return ["firmware", "firmware_descriptor"];
  if (/processor|baseboard|physicalmemory|videocontroller|tpm|usbcontroller/.test(cls)) return ["chip", cls];
  if (/processor|system|display|net|usb|bluetooth|media|battery|monitor|keyboard|mouse|hid/.test(pnpClass)) {
    return [/processor|system|display|net|usb|bluetooth|media/.test(pnpClass) ? "chip" : "device", `pnp_${pnpClass || "entity"}`];
  }
  if (/diskdrive|networkadapter|sounddevice|keyboard|pointingdevice|monitor|printer|usb/.test(cls)) return ["device", cls];
  return ["device", cls || "windows_visible_device"];
}

function liveWindowsInventory() {
  const ps = `
$ErrorActionPreference = 'SilentlyContinue'
$defs = @(
  @{n='ComputerSystem'; c='Win32_ComputerSystem'; p=@('Name','Manufacturer','Model','SystemType','Domain','TotalPhysicalMemory')},
  @{n='BIOS'; c='Win32_BIOS'; p=@('Name','Manufacturer','SMBIOSBIOSVersion','Version','ReleaseDate','SerialNumber')},
  @{n='BaseBoard'; c='Win32_BaseBoard'; p=@('Manufacturer','Product','Version','SerialNumber')},
  @{n='Processor'; c='Win32_Processor'; p=@('Name','Manufacturer','Description','NumberOfCores','NumberOfLogicalProcessors','MaxClockSpeed','SocketDesignation','ProcessorId')},
  @{n='VideoController'; c='Win32_VideoController'; p=@('Name','AdapterCompatibility','DriverVersion','VideoProcessor','PNPDeviceID','Status')},
  @{n='PhysicalMemory'; c='Win32_PhysicalMemory'; p=@('Manufacturer','PartNumber','Capacity','Speed','ConfiguredClockSpeed','BankLabel','DeviceLocator','SerialNumber')},
  @{n='DiskDrive'; c='Win32_DiskDrive'; p=@('Model','Manufacturer','InterfaceType','MediaType','FirmwareRevision','SerialNumber','PNPDeviceID','Size','Status')},
  @{n='NetworkAdapter'; c='Win32_NetworkAdapter'; p=@('Name','Manufacturer','AdapterType','MACAddress','PNPDeviceID','PhysicalAdapter','NetConnectionStatus','Speed')},
  @{n='USBController'; c='Win32_USBController'; p=@('Name','Manufacturer','PNPDeviceID','Status')},
  @{n='USBHub'; c='Win32_USBHub'; p=@('Name','DeviceID','PNPDeviceID','Status')},
  @{n='SoundDevice'; c='Win32_SoundDevice'; p=@('Name','Manufacturer','PNPDeviceID','Status')},
  @{n='Keyboard'; c='Win32_Keyboard'; p=@('Name','Description','DeviceID','PNPDeviceID','Status')},
  @{n='PointingDevice'; c='Win32_PointingDevice'; p=@('Name','Manufacturer','DeviceID','PNPDeviceID','Status')},
  @{n='DesktopMonitor'; c='Win32_DesktopMonitor'; p=@('Name','MonitorManufacturer','MonitorType','PNPDeviceID','Status')},
  @{n='Battery'; c='Win32_Battery'; p=@('Name','DeviceID','Status','BatteryStatus','Chemistry')},
  @{n='SystemEnclosure'; c='Win32_SystemEnclosure'; p=@('Manufacturer','Model','ChassisTypes','SerialNumber','SMBIOSAssetTag')},
  @{n='PnPEntity'; c='Win32_PnPEntity'; p=@('Name','Manufacturer','PNPClass','Status','Service','DeviceID','PNPDeviceID','ClassGuid','ConfigManagerErrorCode')}
)
$out = [ordered]@{}
foreach ($d in $defs) {
  try {
    $rows = @(Get-CimInstance -ClassName $d.c | Where-Object { $_.Name -or $_.Caption -or $_.Description -or $_.Manufacturer -or $_.Model } | Select-Object -Property $d.p)
    $out[$d.n] = $rows
  } catch {
    $out[$d.n] = @(@{__error=$_.Exception.Message})
  }
}
try {
  $out['Tpm'] = @(Get-CimInstance -Namespace 'root\\CIMV2\\Security\\MicrosoftTpm' -ClassName Win32_Tpm | Select-Object -Property SpecVersion,ManufacturerVersion,ManufacturerId,IsEnabled_InitialValue,IsActivated_InitialValue,IsOwned_InitialValue)
} catch {
  $out['Tpm'] = @(@{__error=$_.Exception.Message})
}
$out | ConvertTo-Json -Depth 6 -Compress
`;
  const result = childProcess.spawnSync("powershell.exe", [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    ps
  ], {
    cwd: repoRoot,
    encoding: "utf8",
    timeout: 90000,
    windowsHide: true,
    maxBuffer: 20 * 1024 * 1024
  });
  if (result.error || result.status !== 0) {
    return {
      ok: false,
      error: result.error ? result.error.message : cleanText(result.stderr, 1000),
      classes: {}
    };
  }
  try {
    return {
      ok: true,
      classes: JSON.parse(result.stdout || "{}")
    };
  } catch (error) {
    return {
      ok: false,
      error: error.message,
      classes: {}
    };
  }
}

function recordFromDescriptor({ kind, category, label, source, sourceFile, evidenceLevel, descriptor, observed = true }) {
  const sanitized = sanitizeObject(descriptor || {});
  const descriptorHash = sha256(JSON.stringify({ kind, category, label, source, sourceFile, sanitized }));
  return {
    pid: pidFor(kind, descriptorHash),
    pidKind: kind,
    category,
    label: cleanText(label || category || kind, 240),
    source,
    sourceFile: sourceFile || null,
    evidenceLevel,
    observed,
    descriptorHash,
    descriptor: sanitized
  };
}

function collectLiveRecords(generatedAt) {
  const inventory = liveWindowsInventory();
  const records = [];
  for (const [className, rawRows] of Object.entries(inventory.classes || {})) {
    for (const row of normalizeRows(rawRows)) {
      if (!row || row.__error) {
        continue;
      }
      const label = cleanText(row.Name || row.Caption || row.Description || row.Model || row.Product || className, 240);
      if (!label) {
        continue;
      }
      const [kind, category] = classifyLiveKind(className, row);
      records.push(recordFromDescriptor({
        kind,
        category,
        label,
        source: `windows_cim.${className}`,
        sourceFile: null,
        evidenceLevel: "OS_VISIBLE_CIM",
        descriptor: {
          ...row,
          cimClass: className,
          generatedAt
        }
      }));
    }
  }
  return { inventoryStatus: inventory.ok ? "ok" : "partial_or_unavailable", inventoryError: inventory.error || "", records };
}

function collectManifestRecords(generatedAt) {
  const records = [];
  for (const relPath of MANIFEST_INPUTS) {
    const filePath = path.join(repoRoot, relPath);
    if (!fs.existsSync(filePath)) {
      continue;
    }
    const doc = readJson(filePath, null);
    if (!doc) {
      records.push(recordFromDescriptor({
        kind: "manifest",
        category: "unparsed_manifest",
        label: relPath,
        source: "manifest_parse_hold",
        sourceFile: relPath,
        evidenceLevel: "MANIFEST_PARSE_HOLD",
        descriptor: { generatedAt }
      }));
      continue;
    }
    if (doc.devices && typeof doc.devices === "object" && !Array.isArray(doc.devices)) {
      for (const [id, device] of Object.entries(doc.devices)) {
        records.push(recordFromDescriptor({
          kind: "device",
          category: "behcs_device_registry",
          label: device.label || device.id || id,
          source: "behcs.device_registry",
          sourceFile: relPath,
          evidenceLevel: "MANIFEST_OBSERVED",
          descriptor: { id, ...device, generatedAt }
        }));
      }
    }
    if (Array.isArray(doc.systems)) {
      for (const system of doc.systems) {
        records.push(recordFromDescriptor({
          kind: "manifest",
          category: `asolaria_system_${cleanText(system.type || "unknown", 80)}`,
          label: system.id || system.type || relPath,
          source: "behcs.full_system_manifest",
          sourceFile: relPath,
          evidenceLevel: "MANIFEST_OBSERVED",
          descriptor: { ...system, generatedAt }
        }));
      }
    }
    if (Array.isArray(doc.cubes)) {
      for (const cube of doc.cubes) {
        const id = cleanText(cube.id || cube.name || "", 160);
        const isFirmware = /firmware|fw|bios|uefi/i.test(id) || /firmware|fw|bios|uefi/i.test(String(cube.purpose || ""));
        const isDevice = /device|serial|adapter|unit|com\d+/i.test(id) || /device|serial|adapter|unit|com\d+/i.test(String(cube.purpose || ""));
        records.push(recordFromDescriptor({
          kind: isFirmware ? "firmware" : isDevice ? "device" : "manifest",
          category: `manifest_cube_${cleanText(cube.dim || "unknown", 60)}`,
          label: id || relPath,
          source: "behcs.manifest_cube",
          sourceFile: relPath,
          evidenceLevel: "MANIFEST_OBSERVED",
          descriptor: { ...cube, generatedAt }
        }));
      }
    }
    if (doc.id || doc.nodeName || doc.hostname || doc.hardware || doc.network || doc.access) {
      records.push(recordFromDescriptor({
        kind: "node",
        category: "behcs_node",
        label: doc.nodeName || doc.hostname || doc.id || relPath,
        source: "behcs.node",
        sourceFile: relPath,
        evidenceLevel: "MANIFEST_OBSERVED",
        descriptor: { ...doc, generatedAt }
      }));
    }
    if (!doc.devices && !Array.isArray(doc.systems) && !Array.isArray(doc.cubes) && !(doc.id || doc.nodeName || doc.hostname)) {
      records.push(recordFromDescriptor({
        kind: "manifest",
        category: "behcs_manifest_surface",
        label: doc.spec || doc.schemaId || doc.manifestId || relPath,
        source: "behcs.manifest",
        sourceFile: relPath,
        evidenceLevel: "MANIFEST_OBSERVED",
        descriptor: { summaryKeys: Object.keys(doc).slice(0, 40), generatedAt }
      }));
    }
  }
  for (const relPath of LANGUAGE_SURFACES) {
    const filePath = path.join(repoRoot, relPath);
    if (!fs.existsSync(filePath)) {
      continue;
    }
    const body = fs.readFileSync(filePath, "utf8");
    const isFirmware = /firmware/i.test(relPath);
    records.push(recordFromDescriptor({
      kind: isFirmware ? "firmware" : "device",
      category: "behcs_language_surface",
      label: path.basename(relPath),
      source: "behcs.language_surface",
      sourceFile: relPath,
      evidenceLevel: "LANGUAGE_SURFACE_OBSERVED",
      descriptor: {
        path: relPath,
        bytes: Buffer.byteLength(body, "utf8"),
        hash: sha256(body),
        generatedAt
      }
    }));
  }
  return records;
}

function collectHoldRecords(generatedAt) {
  return UNOBSERVED_HOLDS.map(([id, reason]) => recordFromDescriptor({
    kind: "hold",
    category: "unobserved_firmware_or_chip_internal",
    label: id,
    source: "unobserved_hold",
    sourceFile: null,
    evidenceLevel: "UNOBSERVED_HOLD",
    observed: false,
    descriptor: {
      id,
      reason,
      requiredBeforePromotion: [
        "owner-approved read-only acquisition path",
        "raw hash preservation",
        "vendor/tool provenance",
        "no write or flashing action"
      ],
      generatedAt
    }
  }));
}

function dedupeRecords(records) {
  const seen = new Set();
  const output = [];
  const pidSeen = new Set();
  for (const record of records) {
    const key = `${record.pidKind}:${record.category}:${record.descriptorHash}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    let row = record;
    let suffix = 1;
    while (pidSeen.has(row.pid)) {
      row = {
        ...row,
        pid: pidFor(row.pidKind, `${record.descriptorHash}:${suffix}`)
      };
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
  const live = collectLiveRecords(generatedAt);
  const manifestRecords = collectManifestRecords(generatedAt);
  const holdRecords = collectHoldRecords(generatedAt);
  const records = dedupeRecords([...live.records, ...manifestRecords, ...holdRecords]);
  const pidSet = new Set(records.map((row) => row.pid));
  const observedCount = records.filter((row) => row.observed).length;
  const holdCount = records.length - observedCount;
  const index = {
    indexId: "device-pid-indicator-index.v1",
    generatedAt,
    status: live.inventoryStatus === "ok" ? "DEVICE_PID_INDICATED" : "DEVICE_PID_INDICATED_WITH_LIVE_INVENTORY_HOLD",
    purpose: "Make OS-visible devices, firmware descriptors, chip/component descriptors, Asolaria device nodes, and firmware language surfaces addressable in the PID fabric.",
    truthBoundary: "This pass PIDs observed descriptors and creates hold PIDs for hidden firmware/chip internals. It does not dump firmware, read raw silicon internals, flash devices, or claim unobservable components as proven.",
    liveInventory: {
      status: live.inventoryStatus,
      error: live.inventoryError || null,
      records: live.records.length
    },
    counts: {
      totalRecords: records.length,
      uniquePids: pidSet.size,
      observedRecords: observedCount,
      holdRecords: holdCount,
      liveWindowsRecords: live.records.length,
      manifestRecords: manifestRecords.length,
      pidKind: countBy(records, "pidKind"),
      evidenceLevel: countBy(records, "evidenceLevel")
    },
    pidNamespace: {
      device: "BH.DEVICE.PID.<12>",
      firmware: "BH.FIRMWARE.PID.<12>",
      chip: "BH.CHIP.PID.<12>",
      node: "BH.NODE.PID.<12>",
      manifest: "BH.DEVMAN.PID.<12>",
      hold: "BH.DEVICE.HOLD.<12>"
    },
    records,
    d11: live.inventoryStatus === "ok" ? "PROVEN_OS_VISIBLE_AND_MANIFEST_INDEX" : "OBSERVED_WITH_LIVE_INVENTORY_HOLD"
  };
  index.indexHash = sha256(JSON.stringify(index));
  return index;
}

function buildPreload(index) {
  return {
    preloadId: "device-pid-preload-bindings.v1",
    generatedAt: index.generatedAt,
    status: index.status,
    indexHash: index.indexHash,
    devicePidIndex: repoRel(OUTPUTS.index),
    loadContract: {
      preloadOnce: true,
      sendPerDevice: ["pid", "pidKind", "category", "label", "descriptorHash", "evidenceLevel"],
      returnPerDevice: ["pid", "decision", "evidenceHash", "nextGate"],
      bannedPerDevice: ["raw serials", "secret material", "firmware flashing", "destructive hardware mutation"]
    },
    pids: index.records.map((row) => ({
      pid: row.pid,
      pidKind: row.pidKind,
      category: row.category,
      label: row.label,
      evidenceLevel: row.evidenceLevel,
      observed: row.observed,
      descriptorHash: row.descriptorHash
    }))
  };
}

function buildNdjson(index) {
  return index.records.map((row) => JSON.stringify({
    kind: "device_pid_indicator",
    generatedAt: index.generatedAt,
    pid: row.pid,
    pidKind: row.pidKind,
    category: row.category,
    label: row.label,
    observed: row.observed,
    evidenceLevel: row.evidenceLevel,
    descriptorHash: row.descriptorHash,
    payloadShape: "pid_device_identity_hash_only"
  })).join("\n") + (index.records.length ? "\n" : "");
}

function buildGlpj(index) {
  return {
    glpjId: "device-pid-indicator.glpj.v1",
    generatedAt: index.generatedAt,
    alphabet: "BEHCS-256",
    status: "MINTED",
    sentence: "DEVICE -> FIRMWARE -> CHIP -> PID_INDICATOR -> PRELOAD -> HERMES",
    glyphs: [
      {
        glyph: "DEVICE_PID_OBSERVED",
        meaning: "OS-visible or manifest-visible device descriptor has a PID."
      },
      {
        glyph: "FIRMWARE_PID_DESCRIPTOR",
        meaning: "Firmware descriptor or language surface has a PID; raw firmware image is not implied."
      },
      {
        glyph: "CHIP_PID_DESCRIPTOR",
        meaning: "OS-visible chip/component descriptor has a PID."
      },
      {
        glyph: "DEVICE_HOLD_UNOBSERVED",
        meaning: "Hidden firmware/chip internal has a hold PID until evidence exists."
      }
    ],
    counts: index.counts,
    d11: index.d11
  };
}

function buildMemory(index) {
  return {
    memoryId: "device-pid-indicator-index.v1",
    generatedAt: index.generatedAt,
    event: "Device, firmware descriptor, chip descriptor, node, manifest, and unobserved-hold PIDs were minted into the PID fabric.",
    significance: "The PID system now covers hardware-facing surfaces instead of only agents and supervisors. Asolaria can route device-specific work by PID while preserving the truth boundary between observed descriptors and hidden firmware/silicon internals.",
    counts: index.counts,
    indexHash: index.indexHash,
    d11: index.d11
  };
}

function buildMap(index) {
  return {
    mapId: "device-pid-map-map-mapped.v1",
    generatedAt: index.generatedAt,
    status: "MAP_MAP_MAPPED",
    indexHash: index.indexHash,
    root: "OS-visible devices and manifest-visible device surfaces are PID-indicated",
    edges: index.records.map((row) => ({
      from: row.pid,
      to: row.sourceFile || row.source,
      relation: row.observed ? "observed_descriptor_pid" : "unobserved_hold_pid",
      pidKind: row.pidKind,
      category: row.category
    })),
    d11: index.d11
  };
}

function buildCube(index) {
  return `"use strict";

const devicePidIndicatorCube = Object.freeze({
  cubeId: "device-pid-indicator-cube-cubed.v1",
  generatedAt: ${JSON.stringify(index.generatedAt)},
  status: "CUBE_CUBE_CUBED",
  index: "data/behcs/pid-fabric/index/device-pid-indicator-index-latest.json",
  dimensions: Object.freeze({
    device: "physical or logical device descriptor",
    firmware: "firmware descriptor or firmware language surface",
    chip: "OS-visible component/chip descriptor",
    node: "Asolaria node binding",
    manifest: "device-facing manifest surface",
    hold: "unobserved firmware/chip internal",
    preload: "preload-once compact PID binding",
    outcome: "observed|hold"
  }),
  classify(row) {
    if (!row || !row.pid) return "HOLD_NO_PID";
    if (row.observed === false || row.pidKind === "hold") return "UNOBSERVED_FIRMWARE_CHIP_HOLD";
    if (row.pidKind === "firmware") return "FIRMWARE_DESCRIPTOR_PID";
    if (row.pidKind === "chip") return "CHIP_DESCRIPTOR_PID";
    if (row.pidKind === "node") return "NODE_DEVICE_PID";
    if (row.pidKind === "manifest") return "DEVICE_MANIFEST_PID";
    return "DEVICE_DESCRIPTOR_PID";
  },
  route(row) {
    const classification = this.classify(row);
    return {
      classification,
      allowed: classification !== "HOLD_NO_PID",
      mutationAllowed: false,
      pid: row && row.pid || "",
      requiredPreload: "device-pid-preload-bindings-latest.json",
      firmwareTruthBoundary: "descriptor_pid_not_raw_firmware_dump"
    };
  }
});

export default devicePidIndicatorCube;
`;
}

function buildReport(index) {
  const topCategories = Object.entries(index.counts.pidKind)
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => `| ${key} | ${count} |`)
    .join("\n");
  const evidenceRows = Object.entries(index.counts.evidenceLevel)
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => `| ${key} | ${count} |`)
    .join("\n");
  const json = {
    reportId: "device-pid-indicator-index-latest",
    generatedAt: index.generatedAt,
    status: index.status,
    counts: index.counts,
    indexHash: index.indexHash,
    outputs: Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)])),
    truthBoundary: index.truthBoundary,
    d11: index.d11
  };
  const md = `# Device PID Indicator Index

Status: ${index.status}

Device-specific PIDs are now minted for OS-visible hardware, firmware descriptors, chip/component descriptors, Asolaria node records, device manifests, and firmware language surfaces. Hidden firmware/chip internals are marked with hold PIDs instead of being falsely claimed as dumped.

## Counts

- Total PID records: ${index.counts.totalRecords}
- Unique PIDs: ${index.counts.uniquePids}
- Observed records: ${index.counts.observedRecords}
- Hold records: ${index.counts.holdRecords}
- Live Windows records: ${index.counts.liveWindowsRecords}
- Manifest records: ${index.counts.manifestRecords}

## PID Kinds

| Kind | Count |
|---|---:|
${topCategories}

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
