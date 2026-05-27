#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const repoRoot = path.resolve(__dirname, "..", "..");
const generatedAt = new Date().toISOString();
const chainRoot = path.join(repoRoot, "data", "behcs", "orchestration", "federation-reintegration-20260427");
const reportJson = path.join(repoRoot, "reports", "verify-closeout-chain-acer-latest.json");
const reportMd = path.join(repoRoot, "reports", "verify-closeout-chain-acer-latest.md");

function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function sha256File(filePath) {
  return sha256Buffer(fs.readFileSync(filePath));
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

function parseJsonFiles() {
  return fs.readdirSync(chainRoot)
    .filter((name) => name.endsWith(".v1.json"))
    .map((name) => {
      const full = path.join(chainRoot, name);
      try {
        const json = JSON.parse(fs.readFileSync(full, "utf8"));
        const link = json.closeoutChain && Number.isInteger(json.closeoutChain.linkNumber) ? json.closeoutChain.linkNumber : null;
        return { name, full, json, link };
      } catch (error) {
        return { name, full, json: null, link: null, parseError: error.message };
      }
    })
    .filter((row) => row.json && row.link !== null)
    .sort((a, b) => a.link - b.link || a.name.localeCompare(b.name));
}

function auditRow(row) {
  const priorPath = row.json.priorAcer && row.json.priorAcer.stateFile && row.json.priorAcer.stateFile.path;
  const recordedPriorSha = row.json.closeoutChain && row.json.closeoutChain.recordsPriorAcerStateSha256;
  if (!priorPath || !recordedPriorSha) {
    return {
      wave: row.json.wave && row.json.wave.name,
      linkNumber: row.link,
      path: repoRel(row.full),
      status: "SKIP_NO_PRIOR_POINTER",
      priorPath: priorPath || null,
      recordedPriorSha: recordedPriorSha || null
    };
  }
  const priorFull = path.join(repoRoot, priorPath);
  if (!fs.existsSync(priorFull)) {
    return {
      wave: row.json.wave && row.json.wave.name,
      linkNumber: row.link,
      path: repoRel(row.full),
      status: "FAIL_PRIOR_MISSING",
      priorPath,
      recordedPriorSha
    };
  }
  const actualPriorSha = sha256File(priorFull);
  return {
    wave: row.json.wave && row.json.wave.name,
    linkNumber: row.link,
    path: repoRel(row.full),
    status: actualPriorSha === recordedPriorSha ? "PASS_PRIOR_STATE_SHA_MATCH" : "FAIL_PRIOR_STATE_SHA_MISMATCH",
    priorPath,
    recordedPriorSha,
    actualPriorSha,
    selfSha256: sha256File(row.full),
    embeddedStateHash: row.json.stateHash || null
  };
}

function main() {
  const rows = parseJsonFiles();
  const audits = rows.map(auditRow);
  const failures = audits.filter((row) => row.status.startsWith("FAIL"));
  const passes = audits.filter((row) => row.status.startsWith("PASS"));
  const skipped = audits.filter((row) => row.status.startsWith("SKIP"));
  const result = {
    schema: "verify-closeout-chain-acer.v1",
    generatedAt,
    overallStatus: failures.length === 0 ? "PASS" : "FAIL",
    totalLinkRows: audits.length,
    passCount: passes.length,
    skipCount: skipped.length,
    failCount: failures.length,
    firstLink: audits[0] || null,
    lastLink: audits[audits.length - 1] || null,
    failures,
    skipped,
    audits,
    boundary: "Read-only audit. Verifies ACER closeout JSON prior-state sha256 pointers. No mutation, no gate execution, no content transfer, no ratification, no promotion."
  };
  writeJson(reportJson, result);
  writeText(reportMd, [
    "# ACER Closeout Chain Verification",
    "",
    `Generated: ${generatedAt}`,
    `Overall: ${result.overallStatus}`,
    `Rows: ${result.totalLinkRows}`,
    `PASS: ${result.passCount}`,
    `SKIP: ${result.skipCount}`,
    `FAIL: ${result.failCount}`,
    "",
    "## Tail",
    "",
    `- ${result.lastLink ? result.lastLink.wave : "none"} link ${result.lastLink ? result.lastLink.linkNumber : "none"}: ${result.lastLink ? result.lastLink.status : "none"}`,
    "",
    "## Boundary",
    "",
    result.boundary
  ].join("\n"));
  console.log(JSON.stringify({
    ok: true,
    overallStatus: result.overallStatus,
    totalLinkRows: result.totalLinkRows,
    passCount: result.passCount,
    skipCount: result.skipCount,
    failCount: result.failCount,
    tail: result.lastLink
  }, null, 2));
  if (failures.length > 0) process.exitCode = 1;
}

main();
