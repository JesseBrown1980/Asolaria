"use strict";

const { spawnSync } = require("child_process");
const { projectRoot } = require("./runtimePaths");

const DEPLOYMENT_LANES = Object.freeze({
  live: Object.freeze({
    id: "live",
    title: "Live Branch",
    selectorId: "deployment_lane.live"
  }),
  pre_staging: Object.freeze({
    id: "pre_staging",
    title: "Pre-Staging Lane",
    selectorId: "deployment_lane.pre_staging"
  }),
  pre_dev: Object.freeze({
    id: "pre_dev",
    title: "Pre-Dev Lane",
    selectorId: "deployment_lane.pre_dev"
  }),
  staging: Object.freeze({
    id: "staging",
    title: "Staging Lane",
    selectorId: "deployment_lane.staging"
  }),
  pro: Object.freeze({
    id: "pro",
    title: "Pro Lane",
    selectorId: "deployment_lane.pro"
  }),
  pre_prod: Object.freeze({
    id: "pre_prod",
    title: "Pre-Prod Lane",
    selectorId: "deployment_lane.pre_prod"
  })
});

const LANE_ALIASES = Object.freeze({
  live: "live",
  main: "live",
  master: "live",
  pre_staging: "pre_staging",
  prestaging: "pre_staging",
  pre_staging_lane: "pre_staging",
  pre_stage: "pre_staging",
  predev: "pre_dev",
  pre_dev: "pre_dev",
  pre_development: "pre_dev",
  staging: "staging",
  stage: "staging",
  pro: "pro",
  prod: "pro",
  production: "pro",
  preprod: "pre_prod",
  pre_prod: "pre_prod",
  pre_production: "pre_prod"
});

let branchCache = {
  at: 0,
  branchName: ""
};

function normalizeText(value, maxLen = 120) {
  return String(value || "").trim().slice(0, maxLen);
}

function normalizeDeploymentLaneId(value) {
  const raw = normalizeText(value).toLowerCase();
  if (!raw) return "";
  const normalized = raw
    .replace(/[\\/]+/g, "_")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return LANE_ALIASES[normalized] || "";
}

function readCurrentBranchName() {
  if (Date.now() - Number(branchCache.at || 0) < 10_000 && branchCache.branchName) {
    return branchCache.branchName;
  }
  try {
    const result = spawnSync("git", ["-C", projectRoot, "branch", "--show-current"], {
      encoding: "utf8",
      timeout: 3000,
      windowsHide: true
    });
    const branchName = normalizeText(result.stdout || "");
    branchCache = {
      at: Date.now(),
      branchName
    };
    return branchName;
  } catch (_error) {
    branchCache = {
      at: Date.now(),
      branchName: ""
    };
    return "";
  }
}

function listDeploymentLanes() {
  return Object.values(DEPLOYMENT_LANES).map((entry) => ({ ...entry }));
}

function resolveCurrentDeploymentLane(options = {}) {
  const branchName = normalizeText(options.branchName) || readCurrentBranchName();
  const explicit = normalizeDeploymentLaneId(
    options.laneId
    || process.env.ASOLARIA_DEPLOYMENT_LANE
    || process.env.ASOLARIA_ENV_LANE
    || process.env.ASOLARIA_RUNTIME_LANE
  );
  const branchLane = normalizeDeploymentLaneId(branchName);
  const laneId = explicit || branchLane || "live";
  const lane = DEPLOYMENT_LANES[laneId] || DEPLOYMENT_LANES.live;
  return {
    laneId: lane.id,
    title: lane.title,
    selectorId: lane.selectorId,
    branchName,
    source: explicit ? "env" : branchLane ? "git" : "default",
    availableLanes: listDeploymentLanes()
  };
}

module.exports = {
  DEPLOYMENT_LANES,
  listDeploymentLanes,
  normalizeDeploymentLaneId,
  resolveCurrentDeploymentLane
};
