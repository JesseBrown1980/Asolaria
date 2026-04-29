const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const http = require("node:http");

const root = "C:/Users/acer/Asolaria";
const runId = "falcon-termux-repair-20260427";
const eventId = "EVT-FALCON-TERMUX-REPAIR-2026-04-27";
const baseDir = path.join(root, "data/behcs/orchestration/falcon-termux-repair-20260427");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function sha(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function ensureDir(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
}

function write(rel, value) {
  const file = path.join(root, rel);
  ensureDir(file);
  fs.writeFileSync(file, typeof value === "string" ? value : JSON.stringify(value, null, 2) + "\n");
  return rel;
}

function postJson(url, body) {
  return new Promise((resolve) => {
    const data = JSON.stringify(body);
    const target = new URL(url);
    const req = http.request(
      {
        hostname: target.hostname,
        port: target.port,
        path: target.pathname,
        method: "POST",
        timeout: 5000,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
        },
      },
      (res) => {
        let raw = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          let parsed = null;
          try {
            parsed = JSON.parse(raw);
          } catch {}
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, statusCode: res.statusCode, body: parsed || raw });
        });
      },
    );
    req.on("error", (error) => resolve({ ok: false, error: error.message }));
    req.on("timeout", () => {
      req.destroy(new Error("timeout"));
    });
    req.write(data);
    req.end();
  });
}

async function main() {
  const termuxStatusText = read("data/behcs/orchestration/falcon-termux-repair-20260427/falcon-termux-repair-20260427.status.json");
  const termuxLogText = read("data/behcs/orchestration/falcon-termux-repair-20260427/falcon-termux-repair-20260427.log");
  const opencodeStatusText = read("data/behcs/orchestration/falcon-termux-repair-20260427/falcon-opencode-install-20260427.status.json");
  const opencodeLogText = read("data/behcs/orchestration/falcon-termux-repair-20260427/falcon-opencode-install-20260427.log");

  const termuxStatus = JSON.parse(termuxStatusText);
  const opencodeStatus = JSON.parse(opencodeStatusText);

  const facts = {
    adb: {
      deviceSerial: "R5CXA4MGQXV",
      model: "SM-S721U1",
      state: "device",
      reversePorts: [4781, 4947, 4950],
    },
    termux: {
      appVersion: "0.118.3",
      apiVersion: "0.53.0",
      repairStatus: termuxStatus.status,
      failures: termuxStatus.failures,
      allowExternalApps: true,
      foregroundExecution: "proven",
      installedBins: {
        node: "v25.8.2",
        npm: "11.12.1",
        python: "3.13.13",
        git: "2.53.0",
        curl: "8.19.0",
        jq: "1.8.1",
      },
      spawnProbe: "FALCON_TERMUX_SPAWN_PROBE_OK",
    },
    termuxRunCommand: {
      adbShellDirect: "blocked",
      reason: "Android requires com.termux.permission.RUN_COMMAND for RunCommandService; adb shell does not hold it.",
      safeRoute: "visible foreground Termux command via mirror/adb input",
    },
    opencode: {
      installStatus: opencodeStatus.status,
      failures: opencodeStatus.failures,
      blocker: "opencode-ai postinstall could not find opencode-android-arm64/package.json",
      authStatus: "not_tested_binary_missing",
      spawnStatus: "hold_binary_missing",
      noSecretCopying: true,
    },
  };

  const summary = {
    id: "falcon-termux-repair-summary.v1",
    generatedAt: new Date().toISOString(),
    runId,
    eventId,
    status: termuxStatus.status === "ok" && opencodeStatus.status === "hold"
      ? "FALCON_TERMUX_REPAIRED_OPENCODE_ANDROID_BINARY_HOLD"
      : "FALCON_TERMUX_REPAIR_REVIEW_REQUIRED",
    d11: "PROVEN_TERMUX_FOREGROUND_REPAIR_WITH_OPENCODE_BINARY_HOLD",
    facts,
    shas: {
      termuxStatus: sha(termuxStatusText),
      termuxLog: sha(termuxLogText),
      opencodeStatus: sha(opencodeStatusText),
      opencodeLog: sha(opencodeLogText),
    },
    boundary: "No root, no flashing, no private app data extraction, no secret copying, no uncontrolled fanout. Reverse ADB ports refreshed and Termux self-updated through foreground mirror execution.",
  };

  const artifacts = {
    summary: write("data/behcs/orchestration/falcon-termux-repair-20260427/falcon-termux-repair-summary.v1.json", summary),
    memory: write("data/behcs/memory/falcon-termux-repair.v1.json", {
      type: "memory",
      eventId,
      status: summary.status,
      significance: "Falcon was not refusing all execution. Termux foreground execution works after update; the remaining live-free-agent blocker is OpenCode's missing Android arm64 binary package, not bus failure or auth proof.",
      facts,
    }),
    index: write("data/behcs/index/falcon-termux-repair-index.v1.json", {
      eventId,
      runId,
      keys: [
        "falcon",
        "termux",
        "termux-api",
        "adb-reverse",
        "opencode-android-arm64-missing",
        "live-free-agent-hold",
      ],
      status: summary.status,
    }),
    map: write("data/behcs/maps/asolaria/falcon-termux-repair-map-map-mapped.v1.json", {
      eventId,
      map: [
        ["adb", "reverse", "4781/4947/4950"],
        ["termux", "foreground", "spawn-probe-ok"],
        ["termux", "packages", "updated"],
        ["opencode", "android-arm64-binary", "missing"],
        ["supervisor", "decision", "hold-falcon-live-opencode-spawn"],
      ],
    }),
    cube: write("data/behcs/cubes/falcon-termux-repair-cube-cubed.cube.js", `module.exports = ${JSON.stringify({
      eventId,
      cube: "falcon-termux-repair-cube-cubed",
      dimensions: {
        D_DEVICE: "falcon",
        D_TRANSPORT: "adb-reverse+lan-4947",
        D_EXECUTION: "termux-foreground-proven",
        D_HOLD: "opencode-android-arm64-missing",
        D_BOUNDARY: "no-root-no-secret-copy-no-fanout",
      },
    }, null, 2)};\n`),
    glpj: write("data/behcs/codex/glyph-language/falcon-termux-repair-behcs256.glpj.json", {
      eventId,
      sentences: [
        "FALCON TERMUX REPAIR PROVEN.",
        "ADB REVERSE 4781 4947 4950 REFRESHED.",
        "TERMUX FOREGROUND SPAWN PROBE OK.",
        "OPENCODE LIVE SPAWN HOLD: ANDROID ARM64 BINARY MISSING.",
      ],
      mintedVerbs: ["LX-WITNESS", "LX-MIRROR", "LX-PID-MINT-AGENT"],
    }),
    supervisors: write("data/behcs/supervisors/falcon/falcon-termux-repair-supervisors.v1.json", {
      supervisorSet: "falcon-termux-repair-supervisors.v1",
      eventId,
      supervisors: [
        {
          pid: "BH.SUPERVISOR.PID.FALCON.TERMUX.REPAIR",
          role: "Falcon Termux repair truth gate",
          verdict: "termux_repaired",
        },
        {
          pid: "BH.SUPERVISOR.PID.FALCON.OPENCODE.ANDROID.HOLD",
          role: "Falcon OpenCode Android binary hold gate",
          verdict: "hold_until_android_arm64_binary_or_supported_runtime_exists",
        },
      ],
    }),
    report: write("reports/falcon-termux-repair-latest.md", [
      "# Falcon Termux Repair",
      "",
      `Generated: ${summary.generatedAt}`,
      "",
      `Status: ${summary.status}`,
      "",
      "Results:",
      "- ADB online: R5CXA4MGQXV / SM-S721U1",
      "- Reverse ports refreshed: 4781, 4947, 4950",
      "- Termux update: ok, failures 0",
      "- Termux foreground spawn probe: FALCON_TERMUX_SPAWN_PROBE_OK",
      "- Node: v25.8.2",
      "- npm: 11.12.1",
      "- Python: 3.13.13",
      "- OpenCode: hold, opencode-ai lacks opencode-android-arm64 package",
      "",
      `Boundary: ${summary.boundary}`,
      "",
    ].join("\n")),
  };

  const envelope = {
    verb: "falcon-termux-repair-summary",
    target: "all-nodes",
    from: "acer-codex",
    id: "falcon-termux-repair-20260427-acer-summary-001",
    ts: summary.generatedAt,
    eventId,
    status: summary.status,
    d11: summary.d11,
    facts,
    artifacts,
    boundary: summary.boundary,
  };

  const posts = {
    liris: await postJson("http://192.168.100.2:4947/behcs/send", envelope),
    falcon: await postJson("http://192.168.1.8:4947/behcs/send", { ...envelope, target: "falcon" }),
  };

  const posted = write("data/behcs/orchestration/falcon-termux-repair-20260427/falcon-termux-repair-post-result.v1.json", {
    postedAt: new Date().toISOString(),
    posts,
  });

  console.log(JSON.stringify({ ok: true, status: summary.status, posts, artifacts: { ...artifacts, posted } }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
