#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const stagingRoot = path.join(repoRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427", "incoming-t1");

const EXPECTED = Object.freeze([
  {
    id: "liris-base-d11",
    label: "Liris base D11 ledger",
    path: path.join(stagingRoot, "liris-base-d11.raw.md"),
    expectedSha256: "0a399d05b704fe1199e3da6150e41aa861ed51b3a4903b241fb2fabf5336f635",
    expectedLines: 165,
    expectedBytes: 10470
  },
  {
    id: "liris-falcon-correction-addendum",
    label: "Liris Falcon-correction addendum",
    path: path.join(stagingRoot, "liris-falcon-correction-addendum.raw.md"),
    expectedSha256: "4067d94480370c8bf1301f16f289e93509c697cfd982b18fd7b90f33a3a8c16e",
    expectedLines: 92,
    expectedBytes: 6152
  }
]);

const OUTPUTS = Object.freeze({
  reportJson: path.join(repoRoot, "reports", "federation-reintegration-g1-t1-staging-verification-latest.json"),
  reportMd: path.join(repoRoot, "reports", "federation-reintegration-g1-t1-staging-verification-latest.md")
});

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

function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function inspect(item) {
  if (!fs.existsSync(item.path)) {
    return {
      id: item.id,
      label: item.label,
      path: repoRel(item.path),
      present: false,
      lines: 0,
      bytes: 0,
      sha256: null,
      expectedSha256: item.expectedSha256,
      sha256Matches: false,
      lineExpectation: item.expectedLines,
      byteExpectation: item.expectedBytes
    };
  }
  const buffer = fs.readFileSync(item.path);
  const text = buffer.toString("utf8").replace(/\r?\n$/, "");
  const sha256 = sha256Buffer(buffer);
  return {
    id: item.id,
    label: item.label,
    path: repoRel(item.path),
    present: true,
    lines: text ? text.split(/\r?\n/).length : 0,
    bytes: buffer.length,
    sha256,
    expectedSha256: item.expectedSha256,
    sha256Matches: sha256 === item.expectedSha256,
    lineExpectation: item.expectedLines,
    byteExpectation: item.expectedBytes
  };
}

function main() {
  fs.mkdirSync(stagingRoot, { recursive: true });
  const checks = EXPECTED.map(inspect);
  const allPresent = checks.every((row) => row.present);
  const allHashesMatch = checks.every((row) => row.sha256Matches);
  const status = allPresent && allHashesMatch ? "READY_FOR_SEPARATE_CANONICAL_WRITE_WAVE" : "PENDING_OPERATOR_T1_BYTES";
  const result = {
    schema: "federation-reintegration-g1-t1-staging-verification.v1",
    generatedAt,
    status,
    gate: "G1_T1_D11_CONTENT_PASTE",
    checks,
    allPresent,
    allHashesMatch,
    canonicalWriteAllowedByThisScript: false,
    nextIfReady: "prepare a separate DRAFT_ONLY_NOT_RATIFIED canonical-write proposal; do not promote automatically",
    nextIfPending: "operator paste required into incoming-t1 raw files",
    boundary: "Read-only verification of operator-staged T1 files. No content transfer, no canonical write, no peer call, no MCP invocation, no ratification, no promotion."
  };
  writeJson(OUTPUTS.reportJson, result);
  writeText(OUTPUTS.reportMd, [
    "# G1 T1 Staging Verification",
    "",
    `Generated: ${generatedAt}`,
    `Status: ${status}`,
    "",
    "## Checks",
    "",
    ...checks.map((row) => `- ${row.id}: present=${row.present}, sha256Matches=${row.sha256Matches}, sha256=${row.sha256 || "missing"}`),
    "",
    "## Boundary",
    "",
    result.boundary
  ].join("\n"));
  console.log(JSON.stringify(result, null, 2));
}

main();
