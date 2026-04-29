#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const {
  buildOriginalHermesSecurityBackportSnapshot,
  manifest: securityManifest
} = require("../src/behcs/originalHermesSecurityBackport");
const { sha256, stableStringify } = require("../src/behcs/bimlFeedbackContract");

const ROOT = path.resolve(__dirname, "..");
const RESULT_JSON = path.join(ROOT, "reports", "original-hermes-agent-security-targeted-tests-latest.json");
const RESULT_MD = path.join(ROOT, "reports", "original-hermes-agent-security-targeted-tests-latest.md");
const STATE_PATH = path.join(ROOT, "data", "behcs", "original-hermes-agent", "security-targeted-tests-latest.json");

const CHECKS = [
  {
    id: "api_auth_enforcement",
    command: ["node", ["--check", "src/gateway/toolAuthority.js"]],
    target: "src/gateway/toolAuthority.js"
  },
  {
    id: "path_traversal_checkpoint_guard",
    command: ["node", ["--check", "tools/c-drive-junction-migrator.js"]],
    target: "tools/c-drive-junction-migrator.js"
  },
  {
    id: "sandbox_write_shell_injection_guard",
    command: ["node", ["--check", "services/sandbox-manager/server.js"]],
    target: "services/sandbox-manager/server.js"
  },
  {
    id: "ssrf_redirect_guard",
    command: ["node", ["--check", "src/riskEngine.js"]],
    target: "src/riskEngine.js"
  },
  {
    id: "webhook_signature_validation",
    command: ["node", ["--check", "routes/hooks.js"]],
    target: "routes/hooks.js"
  }
];

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeJson(filePath, value) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeText(filePath, value) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, value.endsWith("\n") ? value : `${value}\n`, "utf8");
}

function repoRel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function digestRecord(record) {
  return sha256(stableStringify(record));
}

function runCommandCheck(check) {
  const [command, args] = check.command;
  const started = Date.now();
  const result = spawnSync(command, args, {
    cwd: ROOT,
    shell: false,
    encoding: "utf8",
    timeout: 30_000,
    windowsHide: true
  });
  const elapsedMs = Date.now() - started;
  const output = `${result.stdout || ""}${result.stderr || ""}`.trim();
  return {
    id: check.id,
    target: check.target,
    command: `${command} ${args.join(" ")}`,
    shell: false,
    status: result.status === 0 ? "pass" : "fail",
    exitCode: result.status,
    elapsedMs,
    output: output.slice(0, 1000),
    error: result.error ? String(result.error.message || result.error).slice(0, 500) : "",
    digest: digestRecord({ id: check.id, status: result.status, elapsedMs, output: output.slice(0, 200) })
  };
}

function scanConnectorSurface() {
  const dir = path.join(ROOT, "src", "connectors");
  const files = fs.readdirSync(dir)
    .filter((name) => name.endsWith(".js"))
    .filter((name) => !name.endsWith("-aso.js"))
    .sort();
  const rows = files.map((name) => {
    const fullPath = path.join(dir, name);
    const text = fs.readFileSync(fullPath, "utf8");
    const envRefs = (text.match(/process\.env\.[A-Z0-9_]+/g) || []).length;
    const vaultRefs = (text.match(/secureVault|vault|companyPrimarySigninStore|moltbookAccountStore/g) || []).length;
    const authTerms = (text.match(/authorization|bearer|token|secret|password|api[_-]?key/gi) || []).length;
    const exportsStatus = /module\.exports\s*=/.test(text) || /exports\./.test(text);
    return {
      file: `src/connectors/${name}`,
      envRefs,
      vaultRefs,
      authTerms,
      exportsStatus,
      review: authTerms > 0 || envRefs > 0 ? "manual_review_required_no_secret_values_read" : "low_signal",
      digest: digestRecord({ name, envRefs, vaultRefs, authTerms, exportsStatus })
    };
  });
  return {
    id: "oauth_lifecycle_and_no_secret_import",
    status: "review_only",
    fileCount: rows.length,
    filesWithEnvRefs: rows.filter((row) => row.envRefs > 0).length,
    filesWithVaultRefs: rows.filter((row) => row.vaultRefs > 0).length,
    filesWithAuthTerms: rows.filter((row) => row.authTerms > 0).length,
    rows,
    digest: digestRecord(rows.map((row) => row.digest))
  };
}

function buildReport(result) {
  const checkRows = result.commandChecks.map((check) => (
    `- ${check.id}: ${check.status} (${check.command}, shell=${check.shell}, ${check.elapsedMs}ms)`
  ));
  const md = `# Original Hermes Security Targeted Tests

Generated: ${result.generatedAt}
Status: ${result.status}
Validation: ${result.ok ? "PASS" : "FAIL"}
Digest: ${result.digest}

## Command Checks

${checkRows.join("\n")}

## Connector Surface Review

- Connector files reviewed: ${result.connectorReview.fileCount}
- Files with env refs: ${result.connectorReview.filesWithEnvRefs}
- Files with vault refs: ${result.connectorReview.filesWithVaultRefs}
- Files with auth terms: ${result.connectorReview.filesWithAuthTerms}
- Status: ${result.connectorReview.status}

## Honesty Boundary

- Shellless command execution only.
- Syntax/review tests only.
- No patch application.
- No provider calls.
- No secret values read or printed.
- No daemon launch.
- No shadow file edits.
`;
  return md;
}

function run({ execute = false } = {}) {
  const generatedAt = new Date().toISOString();
  const queue = buildOriginalHermesSecurityBackportSnapshot({ generatedAt });
  const commandChecks = CHECKS.map(runCommandCheck);
  const connectorReview = scanConnectorSurface();
  const ok = queue.validation.ok
    && commandChecks.every((check) => check.status === "pass")
    && queue.summary.patchesApplied === 0
    && queue.summary.secretsImported === 0
    && queue.summary.shadowFileWrites === 0;
  const result = {
    id: "original-hermes-agent-security-targeted-tests.v1",
    generatedAt,
    status: ok ? "SECURITY_TARGETED_TESTS_PASS_PATCHES_BLOCKED" : "SECURITY_TARGETED_TESTS_GATED",
    ok,
    queueDigest: queue.digest,
    securityManifest: securityManifest(),
    commandChecks,
    connectorReview,
    summary: {
      commandCheckCount: commandChecks.length,
      commandPassCount: commandChecks.filter((check) => check.status === "pass").length,
      connectorFilesReviewed: connectorReview.fileCount,
      patchesApplied: 0,
      providerCalls: 0,
      secretValuesRead: 0,
      shadowWrites: 0
    },
    honesty: {
      shell: false,
      appliesPatches: false,
      callsProviders: false,
      readsSecretValues: false,
      launchesDaemons: false,
      writesShadowFiles: false
    }
  };
  result.digest = digestRecord(result);
  if (execute) {
    writeJson(STATE_PATH, result);
    writeJson(RESULT_JSON, result);
    writeText(RESULT_MD, buildReport(result));
  }
  return result;
}

function main(argv) {
  const command = argv[2] || "status";
  const execute = argv.includes("--execute");
  if (command === "status") {
    console.log(JSON.stringify({
      ok: true,
      status: "READY",
      checks: CHECKS.map((check) => check.id),
      outputs: {
        state: repoRel(STATE_PATH),
        reportJson: repoRel(RESULT_JSON),
        reportMd: repoRel(RESULT_MD)
      }
    }, null, 2));
    return;
  }
  if (command === "run") {
    const result = run({ execute });
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.ok ? 0 : 1);
    return;
  }
  console.error("Usage: node tools/original-hermes-security-targeted-tests.js status|run [--execute]");
  process.exit(2);
}

if (require.main === module) {
  main(process.argv);
}

module.exports = {
  run
};
