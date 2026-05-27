#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const http = require("http");
const net = require("net");

const repoRoot = path.resolve(__dirname, "..", "..");
const runId = "processor-unification-20260427";
const eventId = "EVT-ACER-LIRIS-FALCON-PROCESSOR-UNIFICATION-2026-04-27";
const runRoot = path.join(repoRoot, "data", "behcs", "orchestration", runId);
const unisonRoot = path.join(repoRoot, "data", "behcs", "orchestration", "unison-liris-acer-20260426");

const INPUTS = Object.freeze({
  systemIndex: path.join(repoRoot, "data", "behcs", "pid-fabric", "index", "system-surface-pid-indicator-index-latest.json"),
  deviceIndex: path.join(repoRoot, "data", "behcs", "pid-fabric", "index", "device-pid-indicator-index-latest.json"),
  supervisorIndex: path.join(repoRoot, "data", "behcs", "pid-fabric", "index", "supervisor-pid-indicator-index-latest.json"),
  followons: path.join(unisonRoot, "followons-run-everything.v1.json"),
  lirisInventory: path.join(unisonRoot, "inventory-liris-received.ndjson"),
  acerInventory: path.join(unisonRoot, "inventory-acer.ndjson"),
  falconDiagnostic: path.join(unisonRoot, "falcon-adb-termux-diagnostic.v1.json"),
  bilateralSeal: path.join(unisonRoot, "unison-bilateral-final-seal.v1.json")
});

const OUTPUTS = Object.freeze({
  fabric: path.join(runRoot, "processor-unification-fabric.v1.json"),
  lanes: path.join(runRoot, "processor-unification-lanes.v1.ndjson"),
  dispatch: path.join(runRoot, "processor-unification-supervisor-dispatch.v1.ndjson"),
  cascadeCandidateFile: path.join(runRoot, "processor-unification-behcs-v6-candidates.json"),
  envelope: path.join(runRoot, "processor-unification-summary-envelope.json"),
  postResult: path.join(runRoot, "processor-unification-summary-post-result.json"),
  memory: path.join(repoRoot, "data", "behcs", "memory", "processor-unification.v1.json"),
  index: path.join(repoRoot, "data", "behcs", "index", "processor-unification-index.v1.json"),
  map: path.join(repoRoot, "data", "behcs", "maps", "asolaria", "processor-unification-map-map-mapped.v1.json"),
  cube: path.join(repoRoot, "data", "behcs", "cubes", "processor-unification-cube-cubed.cube.js"),
  glpj: path.join(repoRoot, "data", "behcs", "codex", "glyph-language", "processor-unification-behcs256.glpj.json"),
  reportJson: path.join(repoRoot, "reports", "processor-unification-latest.json"),
  reportMd: path.join(repoRoot, "reports", "processor-unification-latest.md")
});

const ENDPOINTS = Object.freeze({
  lirisSend: "http://192.168.100.2:4947/behcs/send",
  lirisHealth: "http://192.168.100.2:4947/behcs/health",
  falconHealth4947: "http://192.168.1.8:4947/behcs/health",
  falconHealth4950: "http://192.168.1.8:4950/behcs/health"
});

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
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        return { parseError: error.message, line: index + 1 };
      }
    });
}

function repoRel(filePath) {
  const relative = path.relative(repoRoot, filePath);
  if (path.isAbsolute(relative) || relative.startsWith("..")) return filePath.replace(/\\/g, "/");
  return relative.replace(/\\/g, "/");
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function pid(namespace, seed) {
  const slot = crypto.createHash("sha256").update(seed).digest("hex").slice(0, 12).toUpperCase();
  return `${namespace}.${slot}`;
}

function countBy(rows, key) {
  return rows.reduce((acc, row) => {
    const value = row && row[key] ? row[key] : "unknown";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function sampleLabels(records, kind, limit = 8) {
  return records
    .filter((row) => row.pidKind === kind)
    .slice(0, limit)
    .map((row) => ({ pid: row.pid, label: row.label, evidenceLevel: row.evidenceLevel }));
}

function selectSupervisors(supervisorIndex) {
  const needles = [
    ["hermes", "hermes.root"],
    ["law001", "law001"],
    ["processor-silicon-hold", "law-033"],
    ["gnn", "gnn"],
    ["mcp-local", "mcp"],
    ["system-review", "system-review"],
    ["openclaw-openmythos", "openclaw"],
    ["gc", "gc"]
  ];
  const supervisors = supervisorIndex.supervisors || [];
  return needles.map(([role, needle]) => {
    const hit = supervisors.find((row) => {
      const haystack = `${row.setId} ${row.supervisorId} ${row.title} ${row.role} ${row.sourceFile}`.toLowerCase();
      return haystack.includes(needle.toLowerCase());
    }) || supervisors[0] || {
      indicatorPid: "BH.SUP.IND.000000000000",
      nativePid: null,
      supervisorId: "missing-supervisor",
      title: "missing supervisor",
      setId: "missing"
    };
    return {
      role,
      supervisorPid: hit.indicatorPid,
      nativeSupervisorPid: hit.nativePid || null,
      supervisorId: hit.supervisorId,
      title: hit.title,
      setId: hit.setId,
      sourceFile: hit.sourceFile || null
    };
  });
}

function tcpCheck(host, port, timeoutMs = 2500) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    const done = (ok, error = null) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve({ host, port, ok, error });
    };
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => done(true));
    socket.once("timeout", () => done(false, "timeout"));
    socket.once("error", (error) => done(false, error.message));
    socket.connect(port, host);
  });
}

function httpJson(method, url, body = null) {
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
      timeout: 10000
    }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        let responseBody = text;
        try {
          responseBody = JSON.parse(text);
        } catch (_error) {
          // Keep raw response text.
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

function buildNodes(generatedAt, systemIndex, deviceIndex, lirisRows, acerRows, falconDiagnostic, followons) {
  const systemRecords = systemIndex.records || [];
  const deviceRecords = deviceIndex.records || [];
  const processorChips = deviceRecords.filter((row) => row.pidKind === "chip" && row.category === "processor");
  const videoChips = deviceRecords.filter((row) => row.pidKind === "chip" && row.category === "videocontroller");
  const lirisFileSupervisorRows = lirisRows.filter((row) => String(row.path || "").toLowerCase().includes("file-supervisor"));
  const lirisBusRows = lirisRows.filter((row) => String(row.path || "").toLowerCase().includes("liris-bus"));
  const falcon = falconDiagnostic.localFindings || {};
  return [
    {
      nodePid: pid("BH.PROC.NODE", "acer-compute-core"),
      nodeId: "acer-compute-core",
      host: "DESKTOP-J99VCNH",
      side: "acer",
      nodeType: "windows_compute_control_host",
      d11: "PROVEN_LOCAL_OS_VISIBLE",
      cpu: sampleLabels(systemRecords, "cpu", 8),
      gpu: sampleLabels(systemRecords, "gpu", 8),
      processorChipPids: processorChips.map((row) => row.pid),
      videoChipPids: videoChips.map((row) => row.pid),
      supportingSurfaceCounts: {
        processes: (systemIndex.counts && systemIndex.counts.pidKind && systemIndex.counts.pidKind.process) || 0,
        drivers: (systemIndex.counts && systemIndex.counts.pidKind && systemIndex.counts.pidKind.driver) || 0,
        tools: (systemIndex.counts && systemIndex.counts.pidKind && systemIndex.counts.pidKind.tool) || 0,
        mcp: (systemIndex.counts && systemIndex.counts.pidKind && systemIndex.counts.pidKind.mcp) || 0
      },
      boundaries: ["descriptor-first", "no-driver-mutation", "no-process-kill", "no-firmware-dump"]
    },
    {
      nodePid: pid("BH.PROC.NODE", "liris-logical-processor"),
      nodeId: "liris-logical-processor",
      host: "DESKTOP-PTSQTIE",
      side: "liris",
      nodeType: "law001_peer_file_supervisor_processor",
      d11: followons.threads?.lirisFileSupervisorCommit2?.commit2NetworkExposed ? "OBSERVED_PEER_COMMIT2_PROOF" : "OBSERVED_PEER_HOLD",
      commit2: followons.threads?.lirisFileSupervisorCommit2 || {},
      inventoryRows: lirisRows.length,
      fileSupervisorRows: lirisFileSupervisorRows.length,
      busRows: lirisBusRows.length,
      sampleFileSupervisorArtifacts: lirisFileSupervisorRows.slice(0, 6).map((row) => ({
        path: row.path,
        sha256: row.sha256,
        size: row.size
      })),
      boundaries: ["peer-owned", "no-smb-write", "no-remote-file-mutation", "law001-only-summary"]
    },
    {
      nodePid: pid("BH.PROC.NODE", "falcon-mobile-termux-processor"),
      nodeId: "falcon-mobile-termux-processor",
      host: "falcon",
      side: "falcon",
      nodeType: "android_termux_orbital_processor",
      d11: "OBSERVED_ADB_TERMUX_LAN_DESCRIPTOR",
      model: falcon.android?.model || "unknown",
      adb: falconDiagnostic.localFindings?.adb || null,
      termux: falcon.termux || {},
      network: falcon.network || {},
      lirisVerdict: falconDiagnostic.lirisVerdict || null,
      boundaries: ["descriptor-only", "no-phone-file-mutation", "orbital-mirror-caveat", "adb-reverse-only-restored"]
    },
    {
      nodePid: pid("BH.PROC.NODE", "unison-authority-processor"),
      nodeId: "unison-authority-processor",
      host: "acer+liris",
      side: "joint",
      nodeType: "sealed_authority_sha_processor",
      d11: "PROVEN_OPERATOR_WITNESSED_BILATERAL",
      inventoryRows: {
        acer: acerRows.length,
        liris: lirisRows.length
      },
      bilateralSealSha256: followons.bilateralSealSha256 || null,
      sensitiveRowsBlocked: followons.threads?.sensitiveQuorum?.rowCount || 0,
      boundaries: ["authority-sha-match", "side-stamped-chains-coexist", "sensitive-quorum-gated"]
    }
  ].map((node) => ({ ...node, generatedAt }));
}

function buildLanes(generatedAt, nodes, supervisors, systemIndex, deviceIndex, followons) {
  const supervisorByRole = Object.fromEntries(supervisors.map((row) => [row.role, row]));
  const counts = {
    systemRecords: systemIndex.counts?.totalRecords || 0,
    deviceRecords: deviceIndex.counts?.totalRecords || 0,
    sensitiveRowsBlocked: followons.threads?.sensitiveQuorum?.rowCount || 0
  };
  const laneInputs = [
    ["L01", "energy-scheduler", "Unify Acer CPU/GPU PIDs with process/tool PIDs as an energy-first scheduler surface.", "hermes", ["acer-compute-core"], ["cpu", "gpu", "process", "tool"], ["no process kill", "no hidden silicon claim"]],
    ["L02", "liris-peer-processor", "Bind Liris commit-2 file-supervisor processor into the mesh as a peer-owned LAW-001 surface.", "law001", ["liris-logical-processor"], ["LX-FINGERPRINT", "LX-INGEST"], ["no SMB write", "no remote file mutation"]],
    ["L03", "falcon-orbital-processor", "Bind Falcon Termux/LAN-direct processor as descriptor-only orbital compute with Acer mirror caveat preserved.", "law001", ["falcon-mobile-termux-processor"], ["adb", "termux", "4947", "4950"], ["no phone mutation", "no process fanout"]],
    ["L04", "firmware-driver-hold", "Keep firmware, drivers, BIOS, VBIOS, and chip internals on hold PIDs unless later read-only signed evidence exists.", "processor-silicon-hold", ["acer-compute-core"], ["firmware", "driver", "chip"], ["no flash", "no dump", "no driver mutation"]],
    ["L05", "supervisor-routing", "Route all processor tasks through Hermes, LAW-001, GNN, MCP-local, and system-review supervisors by PID.", "system-review", ["unison-authority-processor"], ["supervisor", "mcp", "cube", "behcs"], ["Asolaria MCP only", "bounded artifact queue"]],
    ["L06", "gnn-omnishannon-check", "Fold processor nodes into GNN/OmniShannon as graph evidence, not as uncontrolled execution agents.", "gnn", ["acer-compute-core", "liris-logical-processor", "falcon-mobile-termux-processor"], ["gnn", "shannon", "reverse_gain"], ["descriptor-only", "no external calls"]],
    ["L07", "openclaw-openmythos-research-feed", "Make processor fabric available to OpenClaw/OpenMythos/MLC/Gemma research ingestion as compact PID packets.", "openclaw-openmythos", ["unison-authority-processor"], ["research", "glyph", "cube"], ["local artifacts only", "no provider bypass"]],
    ["L08", "gc-white-room-cleanup", "Use GC and super-white-room lanes to clean language confusion around processor unification without deleting peer truth.", "gc", ["unison-authority-processor"], ["gc", "white_room", "shadow_language"], ["append-only", "no revert"]
    ]
  ];
  return laneInputs.map(([laneId, lane, objective, supervisorRole, nodeIds, processorClasses, boundary]) => {
    const supervisor = supervisorByRole[supervisorRole] || supervisors[0];
    return {
      kind: "processor_unification_lane",
      lanePid: pid("BH.PROC.LANE", `${laneId}:${lane}:${generatedAt}`),
      laneId,
      lane,
      objective,
      supervisorPid: supervisor.supervisorPid,
      supervisorRole,
      supervisorId: supervisor.supervisorId,
      nodePids: nodes.filter((node) => nodeIds.includes(node.nodeId)).map((node) => node.nodePid),
      processorClasses,
      counts,
      executionMode: "bounded_local_descriptor_orchestration",
      mutationAllowed: false,
      processFanout: 0,
      externalCalls: 0,
      boundary,
      d11: "TASK_READY_PROCESSOR_UNIFICATION_SUPERVISED"
    };
  });
}

async function run() {
  const generatedAt = new Date().toISOString();
  const systemIndex = readJson(INPUTS.systemIndex, { records: [], counts: {} });
  const deviceIndex = readJson(INPUTS.deviceIndex, { records: [], counts: {} });
  const supervisorIndex = readJson(INPUTS.supervisorIndex, { supervisors: [], counts: {} });
  const followons = readJson(INPUTS.followons, { threads: {} });
  const bilateralSeal = readJson(INPUTS.bilateralSeal, {});
  const falconDiagnostic = readJson(INPUTS.falconDiagnostic, { localFindings: {} });
  const lirisRows = readNdjson(INPUTS.lirisInventory).filter((row) => !row.parseError);
  const acerRows = readNdjson(INPUTS.acerInventory).filter((row) => !row.parseError);
  const supervisors = selectSupervisors(supervisorIndex);
  const nodes = buildNodes(generatedAt, systemIndex, deviceIndex, lirisRows, acerRows, falconDiagnostic, followons);
  const lanes = buildLanes(generatedAt, nodes, supervisors, systemIndex, deviceIndex, followons);

  const routeChecks = {
    lirisTcp4947: await tcpCheck("192.168.100.2", 4947),
    lirisTcp4950: await tcpCheck("192.168.100.2", 4950),
    falconTcp4947: await tcpCheck("192.168.1.8", 4947),
    falconTcp4950: await tcpCheck("192.168.1.8", 4950),
    lirisHealth: await httpJson("GET", ENDPOINTS.lirisHealth),
    falconHealth4947: await httpJson("GET", ENDPOINTS.falconHealth4947),
    falconHealth4950: await httpJson("GET", ENDPOINTS.falconHealth4950)
  };

  const fabric = {
    id: "processor-unification-fabric.v1",
    runId,
    eventId,
    generatedAt,
    status: "PROCESSOR_UNIFICATION_ORCHESTRATED_DESCRIPTOR_FABRIC_READY",
    d11: "OBSERVED_LOCAL_PLUS_BILATERAL_SEAL_ANCHORED",
    bilateralSealSha256: bilateralSeal.sha256 || followons.bilateralSealSha256 || null,
    processorNodes: nodes,
    laneCount: lanes.length,
    supervisors,
    routeChecks,
    counts: {
      systemSurfaceRecords: systemIndex.counts?.totalRecords || 0,
      devicePidRecords: deviceIndex.counts?.totalRecords || 0,
      supervisorRecords: supervisorIndex.counts?.supervisorRecords || 0,
      lirisInventoryRows: lirisRows.length,
      acerInventoryRows: acerRows.length,
      sensitiveRowsBlocked: followons.threads?.sensitiveQuorum?.rowCount || 0
    },
    truthBoundary: "Unifies processor descriptors, PID routes, supervisors, and LAW-001 message paths. It does not merge physical processors, flash firmware, mutate drivers, write remote files, bypass provider auth, or spawn uncontrolled agents."
  };

  writeJson(OUTPUTS.fabric, fabric);
  writeText(OUTPUTS.lanes, lanes.map((row) => JSON.stringify(row)).join("\n"));
  writeText(OUTPUTS.dispatch, lanes.map((lane) => JSON.stringify({
    kind: "processor_unification_supervisor_dispatch",
    dispatchPid: pid("BH.PROC.DISPATCH", lane.lanePid),
    runId,
    eventId,
    lanePid: lane.lanePid,
    lane: lane.lane,
    supervisorPid: lane.supervisorPid,
    supervisorId: lane.supervisorId,
    verdict: "WORKER_READY_DESCRIPTOR_ONLY",
    mutationAllowed: false,
    processFanout: 0,
    externalCalls: 0,
    d11: lane.d11
  })).join("\n"));
  const cubeByLane = {
    "energy-scheduler": 79507,
    "liris-peer-processor": 571787,
    "falcon-orbital-processor": 103823,
    "firmware-driver-hold": 389017,
    "supervisor-routing": 3581577,
    "gnn-omnishannon-check": 3307949,
    "openclaw-openmythos-research-feed": 704969,
    "gc-white-room-cleanup": 7189057
  };
  const cascadeCandidateFile = {
    vote_id: "PROCESSOR-UNIFICATION-V6-20260427",
    mode: "processor-unification-candidate-file",
    taskId: runId,
    planId: "processor-unification-fabric.v1",
    generatedAt,
    purpose: "Run the unified Acer/Liris/Falcon processor lanes through the local BEHCS v6 cascade as planning evidence only.",
    waveShape: "6x6x6x6x6x12 x omnishannon x gnn",
    chain: "processor-fabric -> supervisor-lanes -> BEHCS-v6-cascade -> report",
    executionPolicy: {
      planningOnly: true,
      spawnWorkers: false,
      executorDispatches: false
    },
    candidates: lanes.map((lane) => ({
      id: lane.lane,
      label: `Processor unification lane ${lane.laneId}: ${lane.lane}`,
      action: "evaluate_processor_unification_lane",
      target: lane.nodePids.join(","),
      cube: cubeByLane[lane.lane] || 704969,
      primary_cube: cubeByLane[lane.lane] || 704969,
      expected_outcome: lane.objective,
      next_step: "Use supervisor dispatch lane only after bounded proof review.",
      metadata: {
        scope_hours: 0.5,
        supervisorPid: lane.supervisorPid,
        supervisorId: lane.supervisorId,
        lanePid: lane.lanePid,
        processorClasses: lane.processorClasses,
        mutationAllowed: lane.mutationAllowed,
        processFanout: lane.processFanout,
        externalCalls: lane.externalCalls,
        boundary: lane.boundary,
        proof_artifact: repoRel(OUTPUTS.fabric)
      }
    }))
  };
  writeJson(OUTPUTS.cascadeCandidateFile, cascadeCandidateFile);

  const memory = {
    type: "behcs-memory",
    id: "memory-processor-unification-v1",
    generatedAt,
    runId,
    eventId,
    status: fabric.status,
    summary: "Acer, Liris, Falcon, and the sealed UNISON authority surface are now represented as one processor fabric by PID, supervisor lane, energy boundary, and LAW-001 route.",
    source: repoRel(OUTPUTS.fabric)
  };
  const index = {
    id: "processor-unification-index-v1",
    generatedAt,
    keys: ["processor-unification", "acer-cpu-gpu", "liris-commit2", "falcon-termux", "unison", "law001"],
    artifacts: {
      fabric: repoRel(OUTPUTS.fabric),
      lanes: repoRel(OUTPUTS.lanes),
      dispatch: repoRel(OUTPUTS.dispatch),
      cascadeCandidateFile: repoRel(OUTPUTS.cascadeCandidateFile),
      report: repoRel(OUTPUTS.reportMd),
      map: repoRel(OUTPUTS.map),
      cube: repoRel(OUTPUTS.cube),
      glpj: repoRel(OUTPUTS.glpj)
    }
  };
  const map = {
    id: "processor-unification-map-map-mapped-v1",
    generatedAt,
    route: [
      "device-pid-index",
      "system-surface-pid-index",
      "supervisor-pid-index",
      "unison-bilateral-seal",
      "liris-commit2",
      "falcon-termux-lan-direct",
      "processor-fabric",
      "supervisor-dispatch",
      "liris-law001-summary"
    ],
    nodes: nodes.map((node) => ({ nodePid: node.nodePid, nodeId: node.nodeId, nodeType: node.nodeType, d11: node.d11 })),
    lanes: lanes.map((lane) => ({ lanePid: lane.lanePid, lane: lane.lane, supervisorPid: lane.supervisorPid }))
  };
  const glpj = {
    id: "processor-unification-behcs256-glpj-v1",
    generatedAt,
    sentences: [
      "META-PROCESSOR-FABRIC { ACER } · CPU-GPU-DRIVER-PROCESS-PIDS · ENERGY-FIRST @ M-EYEWITNESS .",
      "META-PROCESSOR-FABRIC { LIRIS } · LAW001-COMMIT2-LX-FINGERPRINT-LX-INGEST · PEER-OWNED @ M-INDICATIVE .",
      "META-PROCESSOR-FABRIC { FALCON } · TERMUX-LAN-DIRECT-DESCRIPTOR · ORBITAL-MIRROR-CAVEAT @ M-INDICATIVE .",
      "META-GATE { PROCESSOR-UNIFICATION } · NO-FIRMWARE-FLASH · NO-DRIVER-MUTATION · NO-REMOTE-WRITE · NO-FANOUT @ M-IMPERATIVE ."
    ]
  };
  const cubeObject = {
    id: "processor-unification-cube-cubed-v1",
    generatedAt,
    eventId,
    runId,
    status: fabric.status,
    nodes: map.nodes,
    lanes: map.lanes,
    classify(packet) {
      const text = String(packet && (packet.lane || packet.nodeType || packet.id) || "").toLowerCase();
      if (text.includes("firmware") || text.includes("driver")) return "HOLD_DESCRIPTOR_ONLY";
      if (text.includes("liris")) return "PEER_LAW001_PROCESSOR";
      if (text.includes("falcon")) return "ORBITAL_TERMUX_PROCESSOR";
      if (text.includes("energy") || text.includes("cpu") || text.includes("gpu")) return "LOCAL_ENERGY_PROCESSOR";
      return "PROCESSOR_FABRIC_DESCRIPTOR";
    }
  };
  const cubeText = `const processorUnificationCube = Object.freeze(${JSON.stringify(cubeObject, null, 2)});

export const CUBE = processorUnificationCube;
export default processorUnificationCube;
`;
  writeJson(OUTPUTS.memory, memory);
  writeJson(OUTPUTS.index, index);
  writeJson(OUTPUTS.map, map);
  writeJson(OUTPUTS.glpj, glpj);
  writeText(OUTPUTS.cube, cubeText);

  const envelope = {
    verb: "processor-unification-summary",
    target: "liris",
    from: "acer-codex",
    id: "processor-unification-2026-04-27-acer-summary-001",
    ts: generatedAt,
    runId,
    eventId,
    status: fabric.status,
    d11: fabric.d11,
    nodes: map.nodes,
    laneCount: lanes.length,
    routeChecks: {
      liris4947: routeChecks.lirisTcp4947.ok,
      liris4950: routeChecks.lirisTcp4950.ok,
      falcon4947: routeChecks.falconTcp4947.ok,
      falcon4950: routeChecks.falconTcp4950.ok
    },
    artifacts: {
      fabric: repoRel(OUTPUTS.fabric),
      lanes: repoRel(OUTPUTS.lanes),
      cascadeCandidateFile: repoRel(OUTPUTS.cascadeCandidateFile),
      map: repoRel(OUTPUTS.map),
      glpj: repoRel(OUTPUTS.glpj)
    },
    glyph_sentence: "META-PROCESSOR-UNIFICATION { ACER+LIRIS+FALCON } · PID-FABRIC · SUPERVISOR-LANES · LAW001-ROUTES · D11-OBSERVED @ M-INDICATIVE .",
    boundary: fabric.truthBoundary
  };
  writeJson(OUTPUTS.envelope, envelope);
  const postResult = await httpJson("POST", ENDPOINTS.lirisSend, envelope);
  writeJson(OUTPUTS.postResult, { postedAt: new Date().toISOString(), endpoint: ENDPOINTS.lirisSend, ...postResult });

  const report = {
    reportId: "processor-unification-latest",
    generatedAt,
    fabric,
    lanes,
    postResult,
    outputs: Object.fromEntries(Object.entries(OUTPUTS).map(([key, value]) => [key, repoRel(value)]))
  };
  writeJson(OUTPUTS.reportJson, report);
  writeText(OUTPUTS.reportMd, `# Processor Unification

Generated: ${generatedAt}

Status: ${fabric.status}

Nodes:
- Acer compute core: ${nodes[0].cpu.length} CPU PID samples, ${nodes[0].gpu.length} GPU PID samples, ${nodes[0].supportingSurfaceCounts.drivers} driver descriptors, ${nodes[0].supportingSurfaceCounts.tools} tool descriptors.
- Liris logical processor: commit-2 exposed=${Boolean(followons.threads?.lirisFileSupervisorCommit2?.commit2NetworkExposed)}, inventory rows=${lirisRows.length}, file-supervisor rows=${nodes[1].fileSupervisorRows}.
- Falcon mobile processor: model=${nodes[2].model}, ports=${(nodes[2].network.openPortsObservedFromAcer || []).join(", ") || "none"}, verdict=${nodes[2].lirisVerdict}.
- Joint authority processor: bilateral seal=${fabric.bilateralSealSha256 || "missing"}, sensitive rows blocked=${nodes[3].sensitiveRowsBlocked}.

Lanes: ${lanes.length}

BEHCS v6 candidate file: ${repoRel(OUTPUTS.cascadeCandidateFile)}

LAW-001 routes:
- Liris 4947: ${routeChecks.lirisTcp4947.ok}
- Liris 4950: ${routeChecks.lirisTcp4950.ok}
- Falcon 4947: ${routeChecks.falconTcp4947.ok}
- Falcon 4950: ${routeChecks.falconTcp4950.ok}

Liris summary posted: ${postResult.ok}

Boundary: ${fabric.truthBoundary}
`);

  console.log(JSON.stringify({
    ok: true,
    status: fabric.status,
    nodes: nodes.length,
    lanes: lanes.length,
    lirisSummaryPosted: postResult.ok,
    lirisCommit2: Boolean(followons.threads?.lirisFileSupervisorCommit2?.commit2NetworkExposed),
    falconRoute: routeChecks.falconTcp4947.ok && routeChecks.falconTcp4950.ok,
    report: repoRel(OUTPUTS.reportMd)
  }, null, 2));
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
