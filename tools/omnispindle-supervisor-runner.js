#!/usr/bin/env node
"use strict";

const {
  runSupervisorQueue,
  appendQueuePacket,
  buildStatus
} = require("../src/omnispindleSupervisorRunner");

function parseArgs(argv) {
  const flags = {};
  const positionals = [];
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      positionals.push(arg);
      continue;
    }
    const raw = arg.slice(2);
    const equalsIndex = raw.indexOf("=");
    let key = raw;
    let value = true;
    if (equalsIndex >= 0) {
      key = raw.slice(0, equalsIndex);
      value = raw.slice(equalsIndex + 1);
    } else if (argv[index + 1] && !argv[index + 1].startsWith("--")) {
      value = argv[index + 1];
      index += 1;
    }
    if (flags[key] === undefined) {
      flags[key] = value;
    } else if (Array.isArray(flags[key])) {
      flags[key].push(value);
    } else {
      flags[key] = [flags[key], value];
    }
  }
  return { flags, positionals };
}

function asArray(value) {
  if (value === undefined) {
    return [];
  }
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [String(value)].filter(Boolean);
}

function asBool(value) {
  if (value === true) {
    return true;
  }
  return /^(1|true|yes|y|on)$/i.test(String(value || "").trim());
}

function print(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function buildOptions(flags) {
  return {
    root: flags.root,
    sourceRoot: flags.sourceRoot,
    queuePath: flags.queue,
    decisionsPath: flags.decisions,
    workerReadyPath: flags.workerReady,
    mapPath: flags.map,
    statePath: flags.state,
    hermesPath: flags.hermes,
    shannonPath: flags.shannon,
    cubePath: flags.cube,
    reportJsonPath: flags.reportJson,
    reportMdPath: flags.reportMd,
    execute: asBool(flags.execute)
  };
}

function buildPacket(flags) {
  return {
    id: flags.id,
    title: flags.title,
    objective: flags.objective || flags.prompt || flags.text,
    instructions: flags.instructions,
    requestedWorker: flags.worker || flags.requestedWorker || flags.agentType,
    pid: flags.pid,
    pidScope: flags.pidScope,
    consentScope: flags.consentScope,
    allowedPaths: [...asArray(flags.path), ...asArray(flags.allowedPath), ...asArray(flags.allowedPaths)],
    writePaths: [...asArray(flags.writePath), ...asArray(flags.writePaths), ...asArray(flags.mutationPath), ...asArray(flags.patchPath)],
    writerAuthority: flags.writerAuthority || flags.writeAuthority || flags.mintAuthority || flags.executionAuthority,
    expectedArtifacts: [...asArray(flags.artifact), ...asArray(flags.expectedArtifact), ...asArray(flags.expectedArtifacts)],
    acceptanceGates: [...asArray(flags.gate), ...asArray(flags.acceptanceGate), ...asArray(flags.acceptanceGates)],
    proofRequired: asBool(flags.proof) || asBool(flags.proofRequired),
    operatorApproval: asBool(flags.operatorApproval),
    syntheticFirstEvidence: asBool(flags.syntheticFirstEvidence),
    modelCard: asBool(flags.modelCard),
    providerAuthMode: flags.providerAuthMode,
    legitimateCliEvidence: asBool(flags.legitimateCliEvidence),
    freeMethod: asBool(flags.freeMethod),
    remoteMutation: asBool(flags.remoteMutation),
    externalApiCall: asBool(flags.externalApiCall),
    cloudUpload: asBool(flags.cloudUpload),
    deviceAccess: asBool(flags.deviceAccess),
    liveEeg: asBool(flags.liveEeg),
    liveHumanData: asBool(flags.liveHumanData),
    downloads: asBool(flags.downloads),
    installs: asBool(flags.installs),
    writesGit: asBool(flags.writesGit),
    deletesEvidence: asBool(flags.deletesEvidence),
    sensitiveData: asBool(flags.sensitiveData),
    secretMaterial: asBool(flags.secretMaterial),
    bypassAuth: asBool(flags.bypassAuth),
    bypassPayment: asBool(flags.bypassPayment),
    needsCloudWorker: asBool(flags.needsCloudWorker),
    source: "tools/omnispindle-supervisor-runner.js enqueue"
  };
}

function usage() {
  return {
    ok: false,
    usage: [
      "node tools/omnispindle-supervisor-runner.js status",
      "node tools/omnispindle-supervisor-runner.js run --execute",
      "node tools/omnispindle-supervisor-runner.js enqueue --id task-1 --title \"Task\" --objective \"...\" --worker local_codex --pid BH.X --path src/file.js --writePath reports/out.md --writerAuthority shannon --artifact reports/out.md --gate \"node --check src/file.js\" --proof --execute"
    ]
  };
}

function main() {
  const [command = "status", ...rest] = process.argv.slice(2);
  const { flags } = parseArgs(rest);
  const options = buildOptions(flags);

  if (command === "status") {
    print(buildStatus(options));
    return;
  }

  if (command === "run" || command === "tick") {
    print(runSupervisorQueue(options));
    return;
  }

  if (command === "enqueue") {
    const packet = buildPacket(flags);
    print(appendQueuePacket(packet, options));
    return;
  }

  print(usage());
  process.exitCode = 1;
}

main();
