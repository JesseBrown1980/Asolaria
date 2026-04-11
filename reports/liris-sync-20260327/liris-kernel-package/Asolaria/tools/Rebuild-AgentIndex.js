#!/usr/bin/env node

const {
  resolveUnifiedIndexProfile,
  rebuildUnifiedIndex,
  promoteUnifiedIndex,
  scanUnifiedIndex
} = require("../src/unifiedAgentIndexStore");

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = String(argv[index] || "");
    const next = argv[index + 1];
    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
      continue;
    }
    if (arg === "--force") {
      parsed.force = true;
      continue;
    }
    if (arg === "--with-auxiliary") {
      parsed.includeAuxiliaryIx = true;
      continue;
    }
    if (arg === "--no-auxiliary") {
      parsed.includeAuxiliaryIx = false;
      continue;
    }
    if (arg === "--allow-auxiliary-promotion") {
      parsed.allowAuxiliaryPromotion = true;
      continue;
    }
    if (arg === "--scan") {
      if (next && !String(next).startsWith("--")) {
        parsed.scanMode = next;
        index += 1;
      }
      continue;
    }
    if (["--stage", "--profile", "--from", "--to", "--promote", "--status"].includes(arg)) {
      if (next && !String(next).startsWith("--")) {
        parsed[arg.replace(/^--/, "")] = next;
        index += 1;
      } else {
        parsed[arg.replace(/^--/, "")] = true;
      }
    }
  }
  return parsed;
}

function summarize(action, payload) {
  return {
    ok: true,
    action,
    profile: payload.profile || "",
    stage: payload.stage || payload.profile || "",
    sourceContract: payload.sourceContract || "",
    buildMode: payload.buildMode || "",
    cachePath: payload.cachePath || "",
    snapshotPath: payload.snapshotPath || "",
    activeSnapshotPath: payload.activeSnapshotPath || "",
    runningManifestPath: payload.runningManifestPath || "",
    promotedFromProfile: payload.promotedFromProfile || "",
    documentCount: Number(payload.documentCount || payload.documents?.length || 0),
    canonicalDocuments: Number(payload?.sourceCounts?.canonicalDocuments || payload.canonicalDocuments || 0),
    auxiliaryDocuments: Number(payload?.sourceCounts?.auxiliaryDocuments || payload.auxiliaryDocuments || 0),
    signature: payload.signature || "",
    scanMode: payload?.scanContract?.mode || "",
    cacheFresh: "cacheFresh" in payload ? payload.cacheFresh : undefined,
    cacheFreshKnown: "cacheFreshKnown" in payload ? payload.cacheFreshKnown : undefined,
    gateErrors: Array.isArray(payload?.gateReport?.errors) ? payload.gateReport.errors.slice() : [],
    generatedAt: payload.generatedAt || payload.loadedAt || "",
    promotedAt: payload.promotedAt || ""
  };
}

function printUsage() {
  console.log([
    "Usage:",
    "  node tools/Rebuild-AgentIndex.js --stage staging",
    "  node tools/Rebuild-AgentIndex.js --stage dev --with-auxiliary",
    "  node tools/Rebuild-AgentIndex.js --promote running --from staging",
    "  node tools/Rebuild-AgentIndex.js --promote prod --from staging",
    "  node tools/Rebuild-AgentIndex.js --promote prod --from dev --allow-auxiliary-promotion",
    "  node tools/Rebuild-AgentIndex.js --status running --scan blink",
    "  node tools/Rebuild-AgentIndex.js --status staging --scan deep",
    "",
    "Notes:",
    "  staging = canonical LX only",
    "  dev = canonical LX plus optional auxiliary Gaia IX lookup",
    "  running = validated manifest pointer for live reads",
    "  prod/pro = durable promoted snapshot archive"
  ].join("\n"));
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    return;
  }

  if (args.status) {
    const profile = args.status === true ? (args.stage || args.profile || "running") : args.status;
    const resolved = resolveUnifiedIndexProfile({
      profile,
      includeAuxiliaryIx: args.includeAuxiliaryIx
    });
    const status = scanUnifiedIndex({
      ...resolved,
      scanMode: args.scanMode || resolved.defaultScanMode
    });
    console.log(JSON.stringify(summarize("status", status), null, 2));
    return;
  }

  if (args.promote) {
    const payload = promoteUnifiedIndex({
      sourceProfile: args.from || args.stage || args.profile || "staging",
      targetProfile: args.promote === true ? "prod" : args.promote,
      allowAuxiliaryPromotion: Boolean(args.allowAuxiliaryPromotion)
    });
    console.log(JSON.stringify(summarize("promote", payload), null, 2));
    return;
  }

  const resolved = resolveUnifiedIndexProfile({
    profile: args.stage || args.profile || "staging",
    includeAuxiliaryIx: args.includeAuxiliaryIx
  });
  const payload = rebuildUnifiedIndex({
    profile: resolved.profile,
    includeAuxiliaryIx: resolved.includeAuxiliaryIx,
    scanMode: args.scanMode || (resolved.strictSourceValidation ? "deep" : "warm"),
    forceSourceScan: Boolean(args.force)
  });
  console.log(JSON.stringify(summarize("rebuild", payload), null, 2));
}

try {
  main();
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    error: String(error?.message || error),
    validationErrors: Array.isArray(error?.validationErrors) ? error.validationErrors : []
  }, null, 2));
  process.exitCode = 1;
}
