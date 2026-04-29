#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const councilRoot = path.join(repoRoot, "data", "agent-index", "council");
const reportJson = path.join(repoRoot, "reports", "federation-reintegration-gate-disposition-writer-latest.json");
const reportMd = path.join(repoRoot, "reports", "federation-reintegration-gate-disposition-writer-latest.md");

const GATES = Object.freeze({
  G2_21S_ANCHOR_SELECTION: {
    owner: "PROF-SCHEDULER",
    acceptedValues: ["ACER_EVENT_TIME_ANCHOR_2026-05-04T20:12:49Z", "LIRIS_LEDGER_WINDOW", "DUAL_TRACK_HOLD"],
    defaultValue: "DUAL_TRACK_HOLD",
    effect: "records schedule-anchor disposition only"
  },
  G3_21R_VISION_DISPOSITION: {
    owner: "PROF-VISION",
    acceptedValues: ["SEAL_MISSING", "ACCEPT_LIRIS_OPTION", "RERUN_WITNESS_PRESERVATION", "HOLD"],
    defaultValue: "HOLD",
    effect: "records vision asymmetry disposition only"
  },
  G4_CHIEFCOUNCIL_DISSENT_DISPOSITION: {
    owner: "PROF-CHIEFCOUNCIL",
    acceptedValues: ["OPERATOR_DIRECT_OVERRIDE_RECORD", "GENESIS_COSIGN_REINVOCATION", "HOLD"],
    defaultValue: "HOLD",
    effect: "records dissent disposition only; does not ratify by itself"
  },
  G5_LX383_RATIFICATION_DISPOSITION: {
    owner: "PROF-MCP",
    acceptedValues: ["RATIFY_DRAFT", "REVISE_DRAFT", "HOLD"],
    defaultValue: "HOLD",
    requires: "G4_CHIEFCOUNCIL_DISSENT_DISPOSITION resolved for non-HOLD values",
    effect: "records LX-383 disposition only; no rule promotion by itself"
  },
  G6_ED25519_CEREMONY_SCHEDULING: {
    owner: "PROF-SHANNON",
    acceptedValues: ["SCHEDULE_ONLY", "HOLD"],
    defaultValue: "HOLD",
    requires: "for SCHEDULE_ONLY: --timestamp=<ISO8601> --key-scope=<scope>",
    effect: "records ceremony schedule only; key generation remains in sign-d50-manifest-ed25519-acer.js"
  },
  G7_MULTI_FAMILY_COSIGNER_RECRUITMENT: {
    owner: "PROF-CONVERGENCE",
    acceptedValues: ["LM_STUDIO_LOCAL", "GROQ_CLOUD_KEY", "DEEPSEEK_OR_OTHER", "NEITHER_HOLD"],
    defaultValue: "NEITHER_HOLD",
    effect: "records cosigner path disposition only; no endpoint contact"
  }
});

function parseArgs(argv) {
  const args = {};
  for (const item of argv) {
    const match = item.match(/^--([^=]+)=(.*)$/);
    if (match) args[match[1]] = match[2];
  }
  return args;
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeJson(filePath, data) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function writeText(filePath, text) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, text.endsWith("\n") ? text : `${text}\n`, "utf8");
}

function repoRel(filePath) {
  const relative = path.relative(repoRoot, filePath);
  if (path.isAbsolute(relative) || relative.startsWith("..")) return filePath.replace(/\\/g, "/");
  return relative.replace(/\\/g, "/");
}

function sha256Text(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function normalize(value) {
  return String(value || "").trim();
}

function emitStatus(status, extra = {}) {
  const result = {
    schema: "federation-reintegration-gate-disposition-writer.v1",
    generatedAt,
    status,
    gates: GATES,
    usage: [
      "node tools/behcs/federation-reintegration-gate-disposition-writer.js --gate=G2_21S_ANCHOR_SELECTION --value=DUAL_TRACK_HOLD",
      "node tools/behcs/federation-reintegration-gate-disposition-writer.js --gate=G6_ED25519_CEREMONY_SCHEDULING --value=SCHEDULE_ONLY --timestamp=2026-04-28T12:00:00Z --key-scope=D50_CORPUS_MANIFEST"
    ],
    ...extra,
    boundary: "Disposition writer only. No peer call, no content transfer, no key generation, no ratification, no promotion, no device action."
  };
  writeJson(reportJson, result);
  writeText(reportMd, [
    "# Gate Disposition Writer",
    "",
    `Generated: ${generatedAt}`,
    `Status: ${status}`,
    "",
    "## Usage",
    "",
    ...result.usage.map((line) => `- \`${line}\``),
    "",
    "## Boundary",
    "",
    result.boundary
  ].join("\n"));
  console.log(JSON.stringify(result, null, 2));
  return result;
}

function buildDispositionMd(disposition) {
  return [
    `# D50 Gate Disposition - ${disposition.gate}`,
    "",
    `Generated: ${disposition.generatedAt}`,
    `Status: ${disposition.status}`,
    `Owner: ${disposition.owner}`,
    `Value: ${disposition.value}`,
    "",
    "## Inputs",
    "",
    `- Notes: ${disposition.notes || "none"}`,
    `- Timestamp: ${disposition.timestamp || "n/a"}`,
    `- Key scope: ${disposition.keyScope || "n/a"}`,
    "",
    "## Effect",
    "",
    disposition.effect,
    "",
    "## Boundary",
    "",
    disposition.boundary
  ].join("\n");
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const gate = normalize(args.gate);
  const value = normalize(args.value);
  if (!gate && !value) {
    emitStatus("AWAITING_OPERATOR_GATE_VALUE");
    return;
  }
  if (!GATES[gate]) {
    emitStatus("REFUSED_UNKNOWN_GATE", { providedGate: gate });
    process.exitCode = 2;
    return;
  }
  const definition = GATES[gate];
  if (!definition.acceptedValues.includes(value)) {
    emitStatus("REFUSED_UNACCEPTED_VALUE", { providedGate: gate, providedValue: value, acceptedValues: definition.acceptedValues });
    process.exitCode = 2;
    return;
  }
  if (gate === "G6_ED25519_CEREMONY_SCHEDULING" && value === "SCHEDULE_ONLY" && (!args.timestamp || !args["key-scope"])) {
    emitStatus("REFUSED_MISSING_G6_TIMESTAMP_OR_KEY_SCOPE", { providedGate: gate, providedValue: value });
    process.exitCode = 2;
    return;
  }
  if (gate === "G5_LX383_RATIFICATION_DISPOSITION" && value !== "HOLD" && args["ack-g4-dependency"] !== "YES") {
    emitStatus("REFUSED_G5_REQUIRES_G4_DEPENDENCY_ACK", { providedGate: gate, providedValue: value, required: "--ack-g4-dependency=YES" });
    process.exitCode = 2;
    return;
  }

  const safeGate = gate.replace(/[^A-Z0-9_]/g, "-");
  const outputJson = path.join(councilRoot, `D50-GATE-DISPOSITION-${safeGate}-ACER-2026-04-27.json`);
  const outputMd = path.join(councilRoot, `D50-GATE-DISPOSITION-${safeGate}-ACER-2026-04-27.md`);
  const disposition = {
    schema: "federation-reintegration-gate-disposition.v1",
    generatedAt,
    status: "DRAFT_ONLY_NOT_RATIFIED",
    gate,
    owner: definition.owner,
    value,
    notes: args.notes || null,
    timestamp: args.timestamp || null,
    keyScope: args["key-scope"] || null,
    effect: definition.effect,
    executedRealWorldAction: false,
    boundary: "Records operator gate disposition only. No peer call, no content transfer, no key generation, no ratification, no promotion, no device action."
  };
  disposition.stateHash = sha256Text(JSON.stringify(disposition));
  writeJson(outputJson, disposition);
  writeText(outputMd, buildDispositionMd(disposition));
  emitStatus("DISPOSITION_RECORDED", {
    disposition,
    outputs: { json: repoRel(outputJson), md: repoRel(outputMd) }
  });
}

main();
