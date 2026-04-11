const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const { withFreshAsolaria, repoRoot } = require("./_unitHarness");

// Pure-function modules — no file I/O needed for these imports
const {
  cleanLine,
  normalizeLxId,
  normalizeIxId,
  parseFrontMatter,
  tokenizeQuery,
  extractIndexRefs
} = require(path.join(repoRoot, "src", "index-kernel", "textIds"));

const { scoreDocument, searchDocuments } = require(path.join(repoRoot, "src", "index-kernel", "query"));

// ---------------------------------------------------------------------------
// 1. textIds — pure function tests
// ---------------------------------------------------------------------------

test("cleanLine trims whitespace and normalizes internal spaces", () => {
  assert.equal(cleanLine("  hello   world  "), "hello world");
  assert.equal(cleanLine("\r\n  foo\r\nbar  "), "foo bar");
  assert.equal(cleanLine(null), "");
  assert.equal(cleanLine(undefined), "");
  assert.equal(cleanLine(""), "");
  assert.equal(cleanLine("  \t\t  "), "");
});

test("normalizeLxId handles various LX formats", () => {
  assert.equal(normalizeLxId("LX-15"), "LX-015");
  assert.equal(normalizeLxId("LX 015"), "LX-015");
  assert.equal(normalizeLxId("lx015"), "LX-015");
  assert.equal(normalizeLxId("LX-1"), "LX-001");
  assert.equal(normalizeLxId("LX-1234"), "LX-1234");
  assert.equal(normalizeLxId(""), "");
  assert.equal(normalizeLxId(null), "");
});

test("normalizeIxId handles various IX formats", () => {
  assert.equal(normalizeIxId("IX-9"), "IX-009");
  assert.equal(normalizeIxId("IX 042"), "IX-042");
  assert.equal(normalizeIxId("ix042"), "IX-042");
  assert.equal(normalizeIxId("IX-394"), "IX-394");
  assert.equal(normalizeIxId(""), "");
  assert.equal(normalizeIxId(null), "");
});

test("parseFrontMatter extracts attrs and body", () => {
  const raw = [
    "---",
    "lx: 010",
    "name: Test Entry",
    "type: rule",
    "tags: [alpha, beta]",
    "chain: [LX-001, IX-009]",
    "---",
    "",
    "# Body heading",
    "",
    "Some content here."
  ].join("\n");

  const { attrs, body } = parseFrontMatter(raw);
  assert.equal(attrs.lx, "010");
  assert.equal(attrs.name, "Test Entry");
  assert.equal(attrs.type, "rule");
  assert.deepEqual(attrs.tags, ["alpha", "beta"]);
  assert.deepEqual(attrs.chain, ["LX-001", "IX-009"]);
  assert.ok(body.includes("# Body heading"));
  assert.ok(body.includes("Some content here."));
});

test("parseFrontMatter returns raw text when no front matter present", () => {
  const raw = "Just plain text, no front matter.";
  const { attrs, body } = parseFrontMatter(raw);
  assert.deepEqual(attrs, {});
  assert.equal(body, raw);
});

test("tokenizeQuery filters stopwords and deduplicates", () => {
  const tokens = tokenizeQuery("the security rule for agent identity");
  assert.ok(!tokens.includes("the"));
  assert.ok(!tokens.includes("for"));
  assert.ok(tokens.includes("security"));
  assert.ok(tokens.includes("rule"));
  assert.ok(tokens.includes("identity"));
});

test("tokenizeQuery returns empty for blank input", () => {
  assert.deepEqual(tokenizeQuery(""), []);
  assert.deepEqual(tokenizeQuery(null), []);
});

test("tokenizeQuery filters single-char tokens", () => {
  const tokens = tokenizeQuery("a b c de fgh");
  assert.ok(!tokens.includes("a"));
  assert.ok(!tokens.includes("b"));
  assert.ok(!tokens.includes("c"));
  assert.ok(tokens.includes("de"));
  assert.ok(tokens.includes("fgh"));
});

test("extractIndexRefs finds LX and IX references", () => {
  const refs = extractIndexRefs("See LX-015 and IX-042 for details, also LX 100");
  assert.ok(refs.includes("LX-015"));
  assert.ok(refs.includes("IX-042"));
  assert.ok(refs.includes("LX-100"));
});

test("extractIndexRefs returns empty for text without refs", () => {
  assert.deepEqual(extractIndexRefs("no references here"), []);
  assert.deepEqual(extractIndexRefs(""), []);
  assert.deepEqual(extractIndexRefs(null), []);
});

// ---------------------------------------------------------------------------
// 2. query — scoreDocument and searchDocuments
// ---------------------------------------------------------------------------

function makeDoc(overrides = {}) {
  return {
    id: "LX-010",
    prefix: "LX",
    number: "010",
    title: "Security Policy",
    type: "rule",
    tags: ["security", "policy"],
    chain: ["LX-001"],
    agents: [],
    body: "This document describes the security policy.",
    summary: "Security policy overview.",
    source: "rule/LX-010.md",
    absolutePath: "/fake/LX-010.md",
    sourceKind: "canonical",
    layer: "canonical",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides
  };
}

// buildDocumentSearchText is needed by scoreDocument
const { buildDocumentSearchText } = require(path.join(repoRoot, "src", "index-kernel", "compile"));

test("scoreDocument scores exact ID match highest", () => {
  const doc = makeDoc({ id: "LX-010" });
  const idScore = scoreDocument(doc, "LX-010", [], ["LX-010"]);
  assert.ok(idScore > 0, "exact ID ref should produce a positive score");

  const titleScore = scoreDocument(doc, "security", ["security"], []);
  const bodyScore = scoreDocument(doc, "describes", ["describes"], []);

  assert.ok(idScore > titleScore, `ID score (${idScore}) should beat title score (${titleScore})`);
  assert.ok(titleScore > bodyScore, `title score (${titleScore}) should beat body score (${bodyScore})`);
});

test("scoreDocument returns 0 for completely unrelated query", () => {
  const doc = makeDoc();
  const score = scoreDocument(doc, "xyzzyplugh", ["xyzzyplugh"], []);
  assert.equal(score, 0);
});

test("searchDocuments returns sorted results with limit", () => {
  const docs = [
    makeDoc({ id: "LX-010", title: "Security Policy", body: "security rules" }),
    makeDoc({ id: "LX-020", title: "Deployment Plan", body: "deploy steps", type: "plan", tags: ["deploy"] }),
    makeDoc({ id: "LX-030", title: "Security Checklist", body: "security items", tags: ["security", "checklist"] })
  ];

  const result = searchDocuments(docs, "security", { limit: 2 });
  assert.equal(result.query, "security");
  assert.ok(result.tokens.includes("security"));
  assert.ok(result.count <= 2, "should respect limit");
  assert.ok(result.matches.length <= 2);

  // All returned matches should have positive scores
  for (const match of result.matches) {
    assert.ok(match.score > 0);
  }

  // Results should be sorted descending by score
  for (let i = 1; i < result.matches.length; i++) {
    assert.ok(result.matches[i - 1].score >= result.matches[i].score, "results should be sorted by score descending");
  }
});

test("searchDocuments returns empty for blank query", () => {
  const docs = [makeDoc()];
  const result = searchDocuments(docs, "");
  assert.equal(result.count, 0);
  assert.deepEqual(result.matches, []);
});

test("searchDocuments resolves index refs in query", () => {
  const docs = [
    makeDoc({ id: "LX-010" }),
    makeDoc({ id: "LX-050", title: "Unrelated", body: "nothing relevant", tags: [], chain: [] })
  ];

  const result = searchDocuments(docs, "LX-010");
  assert.ok(result.indexRefs.includes("LX-010"));
  assert.ok(result.matches.length >= 1);
  assert.equal(result.matches[0].id, "LX-010");
});

// ---------------------------------------------------------------------------
// 3. compile — buildDocumentFromFile and buildCompiledDocuments (need FS)
// ---------------------------------------------------------------------------

test("buildDocumentFromFile parses a real LX file", () => {
  withFreshAsolaria("compile-build-doc", ({ instanceRoot, load }) => {
    // Create a fake LX file on disk
    const typeDir = path.join(instanceRoot, "data", "agent-index", "rule");
    fs.mkdirSync(typeDir, { recursive: true });
    const filePath = path.join(typeDir, "LX-010.md");
    fs.writeFileSync(filePath, [
      "---",
      "lx: 010",
      "name: Test Security Rule",
      "type: rule",
      "tags: [security, encryption]",
      "chain: [LX-001, IX-009]",
      "agents: [liris]",
      "---",
      "",
      "# Test Security Rule",
      "",
      "All connections must use encryption."
    ].join("\n"), "utf8");

    const compile = load("src/index-kernel/compile");
    const fileDescriptor = {
      path: filePath,
      relativePath: "rule/LX-010.md",
      typeHint: "rule",
      sourceKind: "canonical",
      layer: "canonical",
      mtimeMs: Date.now()
    };

    const doc = require(path.join(repoRoot, "src", "index-kernel", "compile"))
      .buildDocumentFromFile
      ? null
      : null;

    // buildDocumentFromFile is not exported from compile directly — use the module
    // Actually it IS exported, re-check: the exports list shows buildDocumentSearchText,
    // buildCompiledDocuments, buildPayload, buildEmptyPayload — NOT buildDocumentFromFile.
    // We need to test via buildCompiledDocuments instead.

    const inventory = {
      canonicalFiles: [fileDescriptor],
      auxiliaryFiles: [],
      signature: "test-sig"
    };

    const documents = compile.buildCompiledDocuments(inventory);
    assert.equal(documents.length, 1);
    const doc2 = documents[0];
    assert.equal(doc2.id, "LX-010");
    assert.equal(doc2.title, "Test Security Rule");
    assert.equal(doc2.type, "rule");
    assert.deepEqual(doc2.tags, ["security", "encryption"]);
    assert.deepEqual(doc2.chain, ["LX-001", "IX-009"]);
    assert.deepEqual(doc2.agents, ["liris"]);
    assert.ok(doc2.body.includes("All connections must use encryption."));
    assert.equal(doc2.prefix, "LX");
    assert.equal(doc2.layer, "canonical");
  });
});

test("buildCompiledDocuments deduplicates by ID", () => {
  withFreshAsolaria("compile-dedup", ({ instanceRoot, load }) => {
    const typeDir = path.join(instanceRoot, "data", "agent-index", "rule");
    fs.mkdirSync(typeDir, { recursive: true });

    // Create two files that resolve to the same LX-010 ID
    const file1 = path.join(typeDir, "LX-010.md");
    fs.writeFileSync(file1, [
      "---",
      "lx: 010",
      "name: First Version",
      "type: rule",
      "---",
      "",
      "First body."
    ].join("\n"), "utf8");

    const file2 = path.join(typeDir, "LX-010-copy.md");
    fs.writeFileSync(file2, [
      "---",
      "lx: 010",
      "name: Second Version",
      "type: rule",
      "---",
      "",
      "Second body."
    ].join("\n"), "utf8");

    const compile = load("src/index-kernel/compile");
    const inventory = {
      canonicalFiles: [
        {
          path: file1,
          relativePath: "rule/LX-010.md",
          typeHint: "rule",
          sourceKind: "canonical",
          layer: "canonical",
          mtimeMs: Date.now() - 10000
        },
        {
          path: file2,
          relativePath: "rule/LX-010-copy.md",
          typeHint: "rule",
          sourceKind: "canonical",
          layer: "canonical",
          mtimeMs: Date.now()
        }
      ],
      auxiliaryFiles: [],
      signature: "test-sig-dedup"
    };

    const documents = compile.buildCompiledDocuments(inventory);

    // Should have exactly 1 document — deduplicated by ID
    const lx010Docs = documents.filter((d) => d.id === "LX-010");
    assert.equal(lx010Docs.length, 1, "should deduplicate LX-010 to a single entry");
  });
});

test("buildCompiledDocuments handles mixed LX and IX files", () => {
  withFreshAsolaria("compile-mixed", ({ instanceRoot, load }) => {
    const ruleDir = path.join(instanceRoot, "data", "agent-index", "rule");
    const ixDir = path.join(instanceRoot, "data", "agent-index", "gaia-ix-refs");
    fs.mkdirSync(ruleDir, { recursive: true });
    fs.mkdirSync(ixDir, { recursive: true });

    const lxFile = path.join(ruleDir, "LX-020.md");
    fs.writeFileSync(lxFile, [
      "---",
      "lx: 020",
      "name: An LX Entry",
      "type: rule",
      "---",
      "",
      "LX body."
    ].join("\n"), "utf8");

    const ixFile = path.join(ixDir, "IX-394.md");
    fs.writeFileSync(ixFile, [
      "---",
      "ix: 394",
      "name: An IX Entry",
      "type: reference",
      "---",
      "",
      "IX body."
    ].join("\n"), "utf8");

    const compile = load("src/index-kernel/compile");
    const inventory = {
      canonicalFiles: [{
        path: lxFile,
        relativePath: "rule/LX-020.md",
        typeHint: "rule",
        sourceKind: "canonical",
        layer: "canonical",
        mtimeMs: Date.now()
      }],
      auxiliaryFiles: [{
        path: ixFile,
        relativePath: "gaia-ix-refs/IX-394.md",
        typeHint: "reference",
        sourceKind: "auxiliary",
        layer: "auxiliary",
        mtimeMs: Date.now()
      }],
      signature: "test-sig-mixed"
    };

    const documents = compile.buildCompiledDocuments(inventory);
    assert.ok(documents.length >= 2, "should contain both LX and IX documents");

    const lxDoc = documents.find((d) => d.id === "LX-020");
    const ixDoc = documents.find((d) => d.id === "IX-394");
    assert.ok(lxDoc, "LX-020 should be present");
    assert.ok(ixDoc, "IX-394 should be present");
    assert.equal(lxDoc.prefix, "LX");
    assert.equal(ixDoc.prefix, "IX");
  });
});
