const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const { withFreshAsolaria, repoRoot } = require("./_unitHarness");

function unload(modulePath) {
  delete require.cache[require.resolve(modulePath)];
}

function loadIndexKernelWithSchema(fakeSchema) {
  const schemaPath = path.join(repoRoot, "src", "index-kernel", "schema.js");
  const profilePath = path.join(repoRoot, "src", "index-kernel", "profile.js");
  const cachePath = path.join(repoRoot, "src", "index-kernel", "cache.js");

  unload(profilePath);
  unload(cachePath);
  unload(schemaPath);

  require.cache[require.resolve(schemaPath)] = {
    id: require.resolve(schemaPath),
    filename: require.resolve(schemaPath),
    loaded: true,
    exports: fakeSchema
  };

  return {
    profile: require(profilePath),
    cache: require(cachePath)
  };
}

test("index-kernel running profile uses manifest pointers and profile aliases", () => {
  withFreshAsolaria("index-kernel-running", ({ instanceRoot }) => {
    const kernelRoot = path.join(instanceRoot, "kernel-runtime");
    const fakeSchema = {
      projectRoot: kernelRoot,
      SCHEMA_VERSION: 3,
      stagingCachePath: path.join(kernelRoot, ".history", "staging", "compiled-unified-agent-index.json"),
      devCachePath: path.join(kernelRoot, ".history", "dev", "compiled-unified-agent-index.json"),
      runningManifestPath: path.join(kernelRoot, "data", "unified-agent-index-running-manifest.json"),
      prodCachePath: path.join(kernelRoot, "data", "unified-agent-index.json")
    };

    const { profile, cache } = loadIndexKernelWithSchema(fakeSchema);
    const runningProfile = profile.resolveUnifiedIndexProfile({ profile: "runtime" });
    assert.equal(runningProfile.profile, "running");
    assert.equal(runningProfile.usesManifestPointer, true);
    assert.equal(profile.resolveUnifiedIndexProfile("live").profile, "running");
    const previousEnv = process.env.ASOLARIA_UNIFIED_INDEX_PROFILE;
    process.env.ASOLARIA_UNIFIED_INDEX_PROFILE = "banana";
    assert.throws(() => profile.resolveUnifiedIndexProfile({}), /unknown_profile:banana/);
    if (previousEnv === undefined) {
      delete process.env.ASOLARIA_UNIFIED_INDEX_PROFILE;
    } else {
      process.env.ASOLARIA_UNIFIED_INDEX_PROFILE = previousEnv;
    }

    const payload = {
      schemaVersion: 3,
      generatedAt: "2026-03-25T00:00:00.000Z",
      signature: "unit-running-signature",
      profile: "running",
      stage: "running",
      validated: true,
      validationErrors: [],
      buildMode: "running-manifest",
      sourceContract: "running-validated-snapshot",
      promotedFromProfile: "staging",
      documentCount: 1,
      sourceCounts: { canonicalDocuments: 1, auxiliaryDocuments: 0 },
      documents: [
        {
          id: "LX-999",
          prefix: "LX",
          number: "999",
          source: "canonical_lx",
          sourceKind: "canonical_lx",
          layer: "canonical",
          title: "Running Manifest Test",
          type: "pattern",
          tags: ["running"],
          chain: [],
          summary: "Synthetic running manifest test document.",
          body: "Synthetic body for the running manifest pointer test.",
          updatedAt: "2026-03-25T00:00:00.000Z"
        }
      ]
    };

    const written = cache.writeProfilePayload({ profile: "run" }, payload);
    assert.ok(fs.existsSync(fakeSchema.runningManifestPath));
    assert.ok(fs.existsSync(written.activeSnapshotPath));

    const manifest = JSON.parse(fs.readFileSync(fakeSchema.runningManifestPath, "utf8"));
    assert.equal(manifest.profile, "running");
    assert.equal(manifest.documentCount, 1);
    assert.ok(manifest.activeSnapshotAbsolutePath.endsWith(".json"));
    delete manifest.activeSnapshotPath;
    fs.writeFileSync(fakeSchema.runningManifestPath, JSON.stringify(manifest, null, 2), "utf8");

    const readBack = cache.readProfilePayload({ profile: "live" });
    assert.equal(readBack.profile, "running");
    assert.equal(readBack.documents.length, 1);
    assert.equal(readBack.documents[0].id, "LX-999");
    assert.equal(readBack.runningManifest.profile, "running");

    const rogueSnapshotPath = path.join(kernelRoot, "rogue-running-snapshot.json");
    fs.writeFileSync(rogueSnapshotPath, JSON.stringify({
      ...payload,
      profile: "dev",
      sourceContract: "canonical-lx-plus-aux-ix"
    }, null, 2), "utf8");
    fs.writeFileSync(fakeSchema.runningManifestPath, JSON.stringify({
      ...manifest,
      activeSnapshotAbsolutePath: rogueSnapshotPath
    }, null, 2), "utf8");
    assert.throws(() => cache.readProfilePayload({ profile: "running" }), /manifest_snapshot_out_of_bounds/);

    const badInBoundsSnapshot = path.join(path.dirname(written.activeSnapshotPath), "compiled-unified-agent-index-bad.json");
    fs.writeFileSync(badInBoundsSnapshot, JSON.stringify({
      ...payload,
      profile: "dev",
      sourceContract: "canonical-lx-plus-aux-ix"
    }, null, 2), "utf8");
    fs.writeFileSync(fakeSchema.runningManifestPath, JSON.stringify({
      ...manifest,
      activeSnapshotAbsolutePath: badInBoundsSnapshot
    }, null, 2), "utf8");
    assert.throws(() => cache.readProfilePayload({ profile: "running" }), /profile_contract_failed/);
  });
});

test("index-kernel staging validation rejects non-canonical payloads and blink scan contracts", () => {
  withFreshAsolaria("index-kernel-staging", ({ load, instanceRoot }) => {
    const { SCHEMA_VERSION } = load("src/index-kernel/schema.js");
    const { buildScanContract } = load("src/index-kernel/state.js");
    const { resolveUnifiedIndexProfile } = load("src/index-kernel/profile.js");
    const { validatePayloadForProfile, runStagingGates } = load("src/index-kernel/validate.js");
    const cache = load("src/index-kernel/cache.js");

    const staging = resolveUnifiedIndexProfile({ profile: "staging" });
    assert.equal(resolveUnifiedIndexProfile({ profile: "staging", includeAuxiliaryIx: true }).includeAuxiliaryIx, false);
    assert.throws(() => resolveUnifiedIndexProfile({ profile: "banana" }), /unknown_profile:banana/);
    const baseDocument = {
      id: "LX-998",
      prefix: "LX",
      number: "998",
      source: "canonical_lx",
      sourceKind: "canonical_lx",
      layer: "canonical",
      title: "Staging Gate Test",
      type: "pattern",
      tags: ["staging"],
      chain: [],
      summary: "Synthetic canonical staging payload.",
      body: "This payload exists to exercise staging validation and search smoke.",
      updatedAt: "2026-03-25T00:00:00.000Z"
    };
    const validPayload = {
      schemaVersion: SCHEMA_VERSION,
      generatedAt: "2026-03-25T00:00:00.000Z",
      profile: "staging",
      stage: "staging",
      sourceContract: staging.sourceContract,
      validationErrors: [],
      auxiliarySourceFiles: [],
      sourceCounts: { canonicalDocuments: 1, auxiliaryDocuments: 0 },
      documents: [baseDocument],
      scanContract: buildScanContract(staging, "deep", {
        freshnessChecked: true,
        cacheState: "rebuilt",
        sourceWalk: "canonical-index-root",
        builtFromSource: true
      })
    };

    const validation = validatePayloadForProfile(validPayload, staging);
    assert.equal(validation.ok, true);

    const invalidPayload = {
      ...validPayload,
      profile: "dev",
      sourceContract: "canonical-lx-plus-aux-ix",
      auxiliarySourceFiles: ["gaia-IX-998.md"],
      documents: [
        {
          ...baseDocument,
          id: "IX-998",
          prefix: "IX",
          source: "auxiliary_ref_ix",
          sourceKind: "auxiliary_ref_ix",
          layer: "auxiliary"
        }
      ]
    };
    const invalid = validatePayloadForProfile(invalidPayload, staging);
    assert.equal(invalid.ok, false);
    assert.ok(invalid.errors.some((entry) => entry.startsWith("staging_non_lx")));
    assert.ok(invalid.errors.includes("staging_has_auxiliary_sources"));
    assert.ok(invalid.errors.some((entry) => entry.startsWith("profile_mismatch:")));
    assert.ok(invalid.errors.some((entry) => entry.startsWith("source_contract_mismatch:")));

    const blinkReport = runStagingGates({
      ...validPayload,
      scanContract: buildScanContract(staging, "blink", {
        cacheState: "rebuilt"
      })
    }, staging);
    assert.equal(blinkReport.ok, false);
    assert.ok(blinkReport.errors.some((entry) => entry.startsWith("scan_contract:")));

    const invalidPersistedReport = runStagingGates({
      ...validPayload,
      persistedScanContract: {
        mode: "deep",
        hashMode: "none",
        freshnessChecked: false,
        sourceWalk: "none",
        builtFromSource: false,
        manifestPointer: false
      },
      scanContract: buildScanContract(staging, "deep", {
        freshnessChecked: true,
        cacheState: "fresh",
        sourceWalk: "canonical-index-root",
        builtFromSource: true
      })
    }, staging);
    assert.equal(invalidPersistedReport.ok, false);
    assert.ok(invalidPersistedReport.errors.some((entry) => entry.startsWith("scan_contract:")));

    const invalidHashPairReport = runStagingGates({
      ...validPayload,
      persistedScanContract: {
        mode: "deep",
        hashMode: "stat",
        freshnessChecked: true,
        sourceWalk: "canonical-index-root",
        builtFromSource: true,
        manifestPointer: false
      }
    }, staging);
    assert.equal(invalidHashPairReport.ok, false);
    assert.ok(invalidHashPairReport.errors.some((entry) => entry.startsWith("scan_contract:")));

    const deepReport = runStagingGates(validPayload, staging);
    assert.equal(deepReport.ok, true);

    const invalidScanReport = runStagingGates({
      ...validPayload,
      scanContract: buildScanContract(staging, "banana", {
        cacheState: "rebuilt"
      })
    }, staging);
    assert.equal(invalidScanReport.ok, false);
    assert.ok(invalidScanReport.errors.some((entry) => entry.startsWith("scan_contract:")));

    const prodProfile = resolveUnifiedIndexProfile({ profile: "prod" });
    cache.writeProfilePayload({ profile: "prod" }, {
      schemaVersion: SCHEMA_VERSION,
      generatedAt: "2026-03-25T00:00:00.000Z",
      profile: "prod",
      stage: "prod",
      sourceContract: prodProfile.sourceContract,
      promotedFromProfile: "staging",
      validated: true,
      validationErrors: [],
      buildMode: "promoted-snapshot",
      documentCount: 1,
      sourceCounts: { canonicalDocuments: 1, auxiliaryDocuments: 0 },
      documents: [baseDocument]
    });
    const beforeEntries = fs.existsSync(prodProfile.snapshotDir) ? fs.readdirSync(prodProfile.snapshotDir).length : 0;
    assert.throws(() => {
      cache.writeProfilePayload({ profile: "prod" }, {
        schemaVersion: SCHEMA_VERSION,
        generatedAt: "2026-03-25T00:00:00.000Z",
        profile: "dev",
        stage: "prod",
        sourceContract: prodProfile.sourceContract,
        promotedFromProfile: "",
        validated: true,
        validationErrors: [],
        buildMode: "promoted-snapshot",
        documentCount: 1,
        sourceCounts: { canonicalDocuments: 1, auxiliaryDocuments: 0 },
        documents: [baseDocument]
      });
    }, /profile_contract_failed/);
    assert.equal(fs.existsSync(prodProfile.snapshotDir) ? fs.readdirSync(prodProfile.snapshotDir).length : 0, beforeEntries);

    const isolatedKernelRoot = path.join(instanceRoot, "isolated-running-kernel");
    const isolatedSchema = {
      projectRoot: isolatedKernelRoot,
      SCHEMA_VERSION,
      stagingCachePath: path.join(isolatedKernelRoot, ".history", "staging", "compiled-unified-agent-index.json"),
      devCachePath: path.join(isolatedKernelRoot, ".history", "dev", "compiled-unified-agent-index.json"),
      runningManifestPath: path.join(isolatedKernelRoot, "data", "unified-agent-index-running-manifest.json"),
      prodCachePath: path.join(isolatedKernelRoot, "data", "unified-agent-index.json")
    };
    const { profile: isolatedProfile, cache: isolatedCache } = loadIndexKernelWithSchema(isolatedSchema);
    const runningProfile = isolatedProfile.resolveUnifiedIndexProfile({ profile: "running" });
    assert.equal(fs.existsSync(runningProfile.snapshotDir), false);
    assert.throws(() => {
      isolatedCache.writeProfilePayload({ profile: "running" }, {
        schemaVersion: SCHEMA_VERSION,
        generatedAt: "2026-03-25T00:00:00.000Z",
        profile: "dev",
        stage: "dev",
        sourceContract: "canonical-lx-plus-aux-ix",
        promotedFromProfile: "",
        validated: false,
        validationErrors: [],
        buildMode: "running-manifest",
        documentCount: 1,
        sourceCounts: { canonicalDocuments: 1, auxiliaryDocuments: 0 },
        documents: [baseDocument]
      });
    }, /profile_contract_failed/);
    assert.equal(fs.existsSync(runningProfile.snapshotDir), false);
  });
});
