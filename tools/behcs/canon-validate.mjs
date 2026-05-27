#!/usr/bin/env node
// canon-validate.mjs — structural validator for FIRST_MESSAGE_CANON payloads.
//
// FIRST_MESSAGE_CANON payloads are session-boot context that the canon-load
// SessionStart hook (canon-load-on-session-start.mjs) injects as the first
// user message. A malformed canon will silently degrade boot quality, so this
// validator exists as a structural gate other tools call before ingesting or
// dispatching a canon envelope.
//
// EXPORT
//   validateCanon(payload: string) -> {
//     ok:            boolean,              // true iff errors.length === 0
//     version:       string|null,          // canon version from prime header
//     sections:      string[],              // section headings actually found
//     warnings:      Array<string|object>, // non-blocking advisories
//     errors:        string[],              // blocking structural failures
//     is_test_canon: boolean,              // true if version has test/dev/staging/temp/tmp prefix
//   }
//
// REQUIRED STRUCTURE
//   1. First non-blank line MUST match:
//        /^\[PRIME-INFRA-PRELOADED:([^\]]+)\] \[MODEL-AGNOSTIC\] \[FIRST-MESSAGE-CANON\]/
//      The captured group becomes `version`.
//   2. The payload MUST contain (case-sensitive substring) all five sections:
//        WHO I AM
//        WHAT IS ALREADY BUILT
//        HOW YOU SHOULD BEHAVE
//        WHAT I WILL DO NEXT
//        END OF PRIME PRELOAD.
//   3. The block following `WHAT IS ALREADY BUILT` (up to the next section
//      heading) MUST contain at least 5 numbered items of shape /^\s*\d+[.)]\s+/.
//
// WARNINGS (non-blocking)
//   - Any line longer than 1000 chars (likely soft-wrap overflow / accidental
//     paste of base64 or JSON blob).
//   - Excessive whitespace runs (3+ consecutive blank lines), which usually
//     signals a copy/paste artifact rather than an authored canon.
//
// CLI
//   node canon-validate.mjs <path-to-canon.txt>
//   - Exits 0 if {ok:true}, exits 1 otherwise.
//   - Prints a single JSON line: {ok, version, errors, warnings}.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PRIME_HEADER_RE =
  /^\[PRIME-INFRA-PRELOADED:([^\]]+)\] \[MODEL-AGNOSTIC\] \[FIRST-MESSAGE-CANON\]/;

const REQUIRED_SECTIONS = [
  "WHO I AM",
  "WHAT IS ALREADY BUILT",
  "HOW YOU SHOULD BEHAVE",
  "WHAT I WILL DO NEXT",
  "END OF PRIME PRELOAD.",
];

const NUMBERED_ITEM_RE = /^\s*\d+[.)]\s+/;
const NUMBERED_ITEMS_MIN = 5;
const LONG_LINE_THRESHOLD = 1000;
const BLANK_RUN_THRESHOLD = 3; // 3+ consecutive blank lines triggers a warning
const TEST_CANON_PREFIX_RE = /^(test|dev|staging|temp|tmp)[-_]/i;

/**
 * Validate a FIRST_MESSAGE_CANON payload.
 * @param {string} payload
 * @returns {{ok:boolean, version:string|null, sections:string[], warnings:string[], errors:string[]}}
 */
export function validateCanon(payload) {
  const errors = [];
  const warnings = [];
  const sections = [];
  let version = null;
  let is_test_canon = false;

  if (typeof payload !== "string") {
    errors.push(`payload_not_string type=${typeof payload}`);
    return { ok: false, version, sections, warnings, errors, is_test_canon };
  }
  if (payload.length === 0) {
    errors.push("payload_empty");
    return { ok: false, version, sections, warnings, errors, is_test_canon };
  }

  const lines = payload.split(/\r?\n/);

  // 1) Prime header on first non-blank line
  const firstNonBlankIdx = lines.findIndex((l) => l.trim() !== "");
  if (firstNonBlankIdx === -1) {
    errors.push("payload_all_whitespace");
    return { ok: false, version, sections, warnings, errors, is_test_canon };
  }
  const headerLine = lines[firstNonBlankIdx];
  const headerMatch = headerLine.match(PRIME_HEADER_RE);
  if (!headerMatch) {
    errors.push(
      `prime_header_missing first_non_blank_line="${headerLine.slice(0, 120)}"`
    );
  } else {
    version = headerMatch[1];
  }

  // Test canon detection: flag when canon_version uses a test/dev/staging
  // prefix. Non-blocking warning so test envelopes don't break fleets, but
  // they're loud enough to catch leaks into production.
  if (version && TEST_CANON_PREFIX_RE.test(version)) {
    is_test_canon = true;
    warnings.push({
      level: "warn",
      code: "test_canon_prefix",
      detail: `canon_version ${version} indicates test/non-prod canon`,
    });
  }

  // 2) Required sections (substring, case-sensitive)
  for (const heading of REQUIRED_SECTIONS) {
    if (payload.includes(heading)) {
      sections.push(heading);
    } else {
      errors.push(`section_missing "${heading}"`);
    }
  }

  // 3) Numbered items under "WHAT IS ALREADY BUILT"
  // Only meaningful if the section exists.
  if (sections.includes("WHAT IS ALREADY BUILT")) {
    const builtIdx = payload.indexOf("WHAT IS ALREADY BUILT");
    // Cut at the next required section heading after this one (if any), so we
    // don't accidentally count numbered items that belong to other sections.
    let endIdx = payload.length;
    for (const heading of REQUIRED_SECTIONS) {
      if (heading === "WHAT IS ALREADY BUILT") continue;
      const i = payload.indexOf(heading, builtIdx + "WHAT IS ALREADY BUILT".length);
      if (i !== -1 && i < endIdx) endIdx = i;
    }
    const block = payload.slice(builtIdx, endIdx);
    const itemCount = block
      .split(/\r?\n/)
      .filter((l) => NUMBERED_ITEM_RE.test(l)).length;
    if (itemCount < NUMBERED_ITEMS_MIN) {
      errors.push(
        `numbered_items_insufficient section="WHAT IS ALREADY BUILT" found=${itemCount} required=${NUMBERED_ITEMS_MIN}`
      );
    }
  }

  // 4) Warnings: long lines
  let longLineCount = 0;
  let longestLineLen = 0;
  for (let i = 0; i < lines.length; i++) {
    const len = lines[i].length;
    if (len > longestLineLen) longestLineLen = len;
    if (len > LONG_LINE_THRESHOLD) longLineCount += 1;
  }
  if (longLineCount > 0) {
    warnings.push(
      `long_lines count=${longLineCount} threshold=${LONG_LINE_THRESHOLD} longest=${longestLineLen}`
    );
  }

  // 5) Warnings: excessive whitespace runs (3+ consecutive blank lines)
  let blankRun = 0;
  let maxBlankRun = 0;
  let blankRunsOverThreshold = 0;
  let inOverRun = false;
  for (const line of lines) {
    if (line.trim() === "") {
      blankRun += 1;
      if (blankRun > maxBlankRun) maxBlankRun = blankRun;
      if (blankRun === BLANK_RUN_THRESHOLD) {
        blankRunsOverThreshold += 1;
        inOverRun = true;
      }
    } else {
      blankRun = 0;
      inOverRun = false;
    }
  }
  if (blankRunsOverThreshold > 0) {
    warnings.push(
      `excessive_whitespace_runs count=${blankRunsOverThreshold} max_consecutive_blank=${maxBlankRun} threshold=${BLANK_RUN_THRESHOLD}`
    );
  }

  return {
    ok: errors.length === 0,
    version,
    sections,
    warnings,
    errors,
    is_test_canon,
  };
}

// CLI entry — only when invoked directly.
const __filename = fileURLToPath(import.meta.url);
const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);

if (invokedDirectly) {
  const argPath = process.argv[2];
  if (!argPath) {
    process.stderr.write(
      "usage: node canon-validate.mjs <path-to-canon.txt>\n"
    );
    process.exit(2);
  }
  let text;
  try {
    text = fs.readFileSync(argPath, "utf8");
  } catch (e) {
    process.stderr.write(`read_failed path=${argPath} err=${e.message}\n`);
    process.exit(2);
  }
  const result = validateCanon(text);
  // Print the contract: {ok, version, errors, warnings}. `sections` is not
  // required by the CLI contract but is useful in stderr for humans.
  process.stdout.write(
    JSON.stringify({
      ok: result.ok,
      version: result.version,
      errors: result.errors,
      warnings: result.warnings,
      is_test_canon: result.is_test_canon,
    }) + "\n"
  );
  if (!result.ok) {
    process.stderr.write(
      `sections_found=${JSON.stringify(result.sections)}\n`
    );
  }
  process.exit(result.ok ? 0 : 1);
}
