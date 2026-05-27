"use strict";

const fs = require("fs");
const {
  listNetworkFixtures,
  listNetworkFixtureCategories,
  listNetworkFixtureAccessLevels,
  listBaseConnectionProfiles,
  buildFixtureApplication,
  resolveNetworkFixture
} = require("./networkFixtureCatalog");
const { getSelectorCatalogDoc } = require("./selectorCatalogStore");

const STATIC_WORKER_SELECTORS = Object.freeze([
  Object.freeze({
    id: "worker_lane.local_codex",
    title: "Local Codex Lane",
    category: "worker_lane",
    selectorKind: "control",
    profileId: "worker_lane",
    accessLevel: "operator",
    tumblerId: "gpu_primary_model",
    status: "active",
    version: 1,
    labels: ["worker", "codex", "local"],
    description: "Primary local Codex worker lane."
  }),
  Object.freeze({
    id: "worker_lane.claude_max",
    title: "Claude Max Lane",
    category: "worker_lane",
    selectorKind: "control",
    profileId: "worker_lane",
    accessLevel: "trusted_agent",
    tumblerId: "cpu_local_general",
    status: "active",
    version: 1,
    labels: ["worker", "claude", "external"],
    description: "Anthropic / Claude Max worker lane."
  }),
  Object.freeze({
    id: "worker_lane.abacus",
    title: "Abacus Lane",
    category: "worker_lane",
    selectorKind: "control",
    profileId: "worker_lane",
    accessLevel: "trusted_agent",
    tumblerId: "browser_remote_surface",
    status: "active",
    version: 1,
    labels: ["worker", "abacus", "browser"],
    description: "Managed browser-backed Abacus lane."
  }),
  Object.freeze({
    id: "worker_lane.symphony",
    title: "Symphony Lane",
    category: "worker_lane",
    selectorKind: "control",
    profileId: "worker_lane",
    accessLevel: "trusted_agent",
    tumblerId: "cpu_local_general",
    status: "active",
    version: 1,
    labels: ["worker", "symphony", "project"],
    description: "Symphony project lane and dispatch surface."
  }),
  Object.freeze({
    id: "worker_lane.openmythos",
    title: "OpenMythos Cognitive Engine Lane",
    category: "worker_lane",
    selectorKind: "control",
    profileId: "worker_lane",
    accessLevel: "trusted_agent",
    tumblerId: "gpu_primary_model",
    status: "active",
    version: 1,
    labels: ["worker", "cognitive_engine", "openmythos", "deep_reasoning", "law_099"],
    description: "PID-bound recurrent-depth reasoning lane governed by LAW-099 spectral stability."
  }),
  Object.freeze({
    id: "worker_lane.ga_svm",
    title: "GA-SVM Classification Engine Lane",
    category: "worker_lane",
    selectorKind: "control",
    profileId: "worker_lane",
    accessLevel: "trusted_agent",
    tumblerId: "cpu_local_general",
    status: "active",
    version: 1,
    labels: ["worker", "cognitive_engine", "ga_svm", "classification", "crop_disease", "law_100"],
    description: "Feature-validated GA-SVM classification lane with cross-validation and drift gates."
  }),
  Object.freeze({
    id: "worker_lane.openmythos_ga_svm_fusion",
    title: "OpenMythos + GA-SVM Fusion Lane",
    category: "worker_lane",
    selectorKind: "control",
    profileId: "worker_lane",
    accessLevel: "trusted_agent",
    tumblerId: "gpu_primary_model",
    status: "active",
    version: 1,
    labels: ["worker", "cognitive_engine", "fusion", "openmythos", "ga_svm", "law_099", "law_100"],
    description: "Staged classification plus deep reasoning lane routed through GAC, drift, memory, and ledger surfaces."
  })
]);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeText(value) {
  return String(value || "").trim();
}

function buildAvailability(bindings = {}) {
  const pathBindings = Array.isArray(bindings.paths) ? bindings.paths : [];
  const pathStates = pathBindings.map((entry) => {
    const targetPath = normalizeText(entry.path);
    const required = Boolean(entry.required);
    const exists = targetPath ? fs.existsSync(targetPath) : false;
    return {
      kind: String(entry.kind || "file").trim().toLowerCase(),
      path: targetPath,
      required,
      exists
    };
  });
  const missingRequiredPaths = pathStates.filter((entry) => entry.required && !entry.exists).map((entry) => entry.path);
  return {
    pathBindings: pathStates,
    pathsReady: missingRequiredPaths.length < 1,
    missingRequiredPaths
  };
}

function buildConnectionFixtureSelector(fixture) {
  const resolved = resolveNetworkFixture(fixture.id);
  return {
    id: `connection_fixture.${fixture.id}`,
    title: fixture.label,
    category: "connection_fixture",
    selectorKind: fixture.selectorKind || "control",
    profileId: fixture.profileId || "",
    accessLevel: fixture.accessLevel || "operator",
    tumblerId: fixture.category === "device_lab" ? "device_lab_serial" : "cpu_local_general",
    status: "active",
    version: 1,
    labels: Array.isArray(fixture.tags) ? fixture.tags.slice() : [],
    description: fixture.summary,
    source: "dynamic.connection_fixture",
    capabilities: Array.isArray(fixture.capabilities) ? fixture.capabilities.slice() : [],
    metadata: {
      fixtureId: fixture.id,
      categoryLabel: fixture.categoryLabel || "",
      organization: fixture.organization || "",
      workIdentityEmail: fixture.workIdentityEmail || "",
      vpnLocationHint: fixture.vpnLocationHint || "",
      profile: resolved?.profile || null
    },
    bindings: {
      paths: [],
      ports: []
    }
  };
}

function buildWorkOrgSelectors(context = {}) {
  if (typeof context.getWorkOrgPolicySummary !== "function") {
    return [];
  }
  const summary = context.getWorkOrgPolicySummary({ includeProfiles: true }) || {};
  const profiles = summary.profiles && typeof summary.profiles === "object" ? summary.profiles : {};
  return Object.entries(profiles).map(([key, profile]) => ({
    id: `work_org.${key}`,
    title: String(profile.label || key),
    category: "work_identity",
    selectorKind: "control",
    profileId: "internet_tunnel",
    accessLevel: "trusted_agent",
    tumblerId: "cpu_local_general",
    status: "active",
    version: 1,
    labels: [key, "work_org"],
    description: String(profile.description || `Work identity selector for ${key}.`).trim(),
    source: "dynamic.work_org",
    capabilities: ["apply", "persist", "work_identity"],
    metadata: {
      organization: key,
      label: String(profile.label || key),
      teams: clone(profile.teams || {})
    },
    bindings: {
      paths: [],
      ports: []
    }
  }));
}

function listDynamicSelectors(context = {}) {
  const fixtureSelectors = listNetworkFixtures().map((fixture) => buildConnectionFixtureSelector(fixture));
  const workOrgSelectors = buildWorkOrgSelectors(context);
  const workerSelectors = STATIC_WORKER_SELECTORS.map((entry) => clone(entry));
  return [...fixtureSelectors, ...workOrgSelectors, ...workerSelectors];
}

function listStaticSelectors() {
  const doc = getSelectorCatalogDoc();
  return Array.isArray(doc.selectors) ? doc.selectors.map((entry) => clone(entry)) : [];
}

function mergeSelectors(context = {}) {
  const rows = [...listDynamicSelectors(context), ...listStaticSelectors()];
  const byId = new Map();
  for (const entry of rows) {
    if (!entry || !entry.id || byId.has(entry.id)) continue;
    const bindings = entry.bindings && typeof entry.bindings === "object" ? clone(entry.bindings) : { paths: [], ports: [] };
    byId.set(entry.id, {
      ...clone(entry),
      bindings,
      availability: buildAvailability(bindings)
    });
  }
  return Array.from(byId.values()).sort((a, b) => String(a.title || a.id || "").localeCompare(String(b.title || b.id || "")));
}

function decorateSelector(entry) {
  const doc = getSelectorCatalogDoc();
  const categoryId = String(entry?.category || "").trim();
  const profileId = String(entry?.profileId || "").trim();
  const accessLevel = String(entry?.accessLevel || "operator").trim().toLowerCase();
  const selectorKind = String(entry?.selectorKind || "reference").trim().toLowerCase();
  const categoryMeta = doc.categories?.[categoryId] || null;
  const profileMeta = doc.profiles?.[profileId] || null;
  const accessMeta = doc.accessLevels?.[accessLevel] || null;
  return {
    ...clone(entry),
    categoryId,
    categoryLabel: String(categoryMeta?.label || categoryId || "").trim(),
    profileId,
    profileLabel: String(profileMeta?.label || profileId || "").trim(),
    accessLevel,
    accessLevelLabel: String(accessMeta?.label || accessLevel || "").trim(),
    selectorKind,
    kind: selectorKind,
    executionMode: selectorKind
  };
}

function listSelectorCategories() {
  const doc = getSelectorCatalogDoc();
  const categories = Object.values(doc.categories || {}).map((entry) => clone(entry));
  const networkCategories = listNetworkFixtureCategories().map((entry) => ({
    id: `network_fixture.${entry.id}`,
    label: `Network Fixture / ${entry.label}`,
    description: entry.description
  }));
  return [...categories, ...networkCategories];
}

function listSelectorProfiles() {
  const doc = getSelectorCatalogDoc();
  const baseProfiles = listBaseConnectionProfiles().map((entry) => ({
    id: entry.id,
    label: doc.profiles?.[entry.id]?.label || entry.id,
    description: doc.profiles?.[entry.id]?.description || "Connection profile",
    details: clone(entry)
  }));
  const catalogProfiles = Object.values(doc.profiles || {})
    .map((entry) => clone(entry))
    .filter((entry) => !baseProfiles.some((profile) => profile.id === entry.id));
  return [...baseProfiles, ...catalogProfiles];
}

function listSelectorAccessLevels() {
  const doc = getSelectorCatalogDoc();
  const catalogLevels = Object.values(doc.accessLevels || {}).map((entry) => clone(entry));
  const fixtureLevels = listNetworkFixtureAccessLevels()
    .filter((entry) => !catalogLevels.some((level) => level.id === entry.id))
    .map((entry) => clone(entry));
  return [...catalogLevels, ...fixtureLevels];
}

function listResolvedSelectors(context = {}, options = {}) {
  const category = normalizeText(options.category).toLowerCase();
  const accessLevel = normalizeText(options.accessLevel).toLowerCase();
  const selectorKind = normalizeText(options.selectorKind || options.kind).toLowerCase();
  return mergeSelectors(context).filter((entry) => {
    if (category && entry.category !== category) return false;
    if (accessLevel && entry.accessLevel !== accessLevel) return false;
    if (selectorKind && entry.selectorKind !== selectorKind) return false;
    return true;
  }).map((entry) => decorateSelector(entry));
}

function getResolvedSelector(context = {}, selectorId = "") {
  const targetId = normalizeText(selectorId);
  if (!targetId) return null;
  const match = mergeSelectors(context).find((entry) => entry.id === targetId) || null;
  return match ? decorateSelector(match) : null;
}

function summarizeSelectorCatalog(context = {}) {
  const selectors = mergeSelectors(context);
  const byCategory = {};
  for (const entry of selectors) {
    byCategory[entry.category] = Number(byCategory[entry.category] || 0) + 1;
  }
  return {
    totalSelectors: selectors.length,
    totalCategories: listSelectorCategories().length,
    totalProfiles: listSelectorProfiles().length,
    totalAccessLevels: listSelectorAccessLevels().length,
    byCategory
  };
}

function dryRunSelectorApplication(context = {}, selectorId = "", options = {}) {
  const selector = getResolvedSelector(context, selectorId);
  if (!selector) {
    return null;
  }
  if (selector.id.startsWith("connection_fixture.")) {
    const fixtureId = selector.metadata?.fixtureId || selector.id.slice("connection_fixture.".length);
    return {
      selectorId: selector.id,
      supported: true,
      action: "apply_connection_fixture",
      patch: buildFixtureApplication(fixtureId, {
        remoteBaseUrl: options.remoteBaseUrl
      })
    };
  }
  if (selector.id.startsWith("work_org.")) {
    return {
      selectorId: selector.id,
      supported: true,
      action: "select_work_org",
      patch: {
        activeWorkOrg: selector.metadata?.organization || selector.id.slice("work_org.".length)
      }
    };
  }
  if (selector.id.startsWith("deployment_lane.")) {
    return {
      selectorId: selector.id,
      supported: true,
      action: "select_deployment_lane",
      patch: {
        deploymentLane: selector.id.slice("deployment_lane.".length)
      }
    };
  }
  return {
    selectorId: selector.id,
    supported: false,
    action: "reference_only",
    patch: null
  };
}

module.exports = {
  listSelectorCategories,
  listSelectorProfiles,
  listSelectorAccessLevels,
  listResolvedSelectors,
  getResolvedSelector,
  summarizeSelectorCatalog,
  dryRunSelectorApplication
};
