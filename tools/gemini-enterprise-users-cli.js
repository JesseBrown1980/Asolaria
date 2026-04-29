#!/usr/bin/env node
"use strict";

const { getGcpConfigSummary, getServiceAccountAccessToken } = require("../src/connectors/gcpConnector");

const CLOUD_PLATFORM_SCOPE = "https://www.googleapis.com/auth/cloud-platform";
const DISCOVERY_ENGINE_API = "https://discoveryengine.googleapis.com";
const SERVICE_USAGE_API = "https://serviceusage.googleapis.com";
const RESOURCE_MANAGER_API = "https://cloudresourcemanager.googleapis.com";
const REQUIRED_SERVICE = "discoveryengine.googleapis.com";

const DEFAULT_PROJECT_NUMBER = "742368506950";
const DEFAULT_LOCATION = "global";
const DEFAULT_BILLING_ACCOUNT = "018AD9-3319F5-507615";
const DEFAULT_BILLING_ACCOUNT_LICENSE_CONFIG = "49633aa7-8d0d-473d-a362-cab7ced1f9ee";
const DEFAULT_LICENSE_CONFIG_ID = "asolar-gemini-enterprise-plus";
const DEFAULT_USER_STORE_ID = "default_user_store";
const TARGETS = [
  { email: "asolaria@jbrowndevelopmentllc.com", profile: "Asolaria" },
  { email: "liris@jbrowndevelopmentllc.com", profile: "Liris" },
  { email: "falcon@jbrowndevelopmentllc.com", profile: "Falcon" }
];
const ACCESS_ROLES = [
  "roles/discoveryengine.agentspaceUser",
  "roles/discoveryengine.notebookLmUser"
];

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const item = String(argv[i] || "").trim();
    if (!item) continue;
    if (!item.startsWith("--")) {
      out._.push(item);
      continue;
    }
    const eq = item.indexOf("=");
    if (eq > 2) {
      out[item.slice(2, eq)] = item.slice(eq + 1);
      continue;
    }
    const key = item.slice(2);
    const next = String(argv[i + 1] || "").trim();
    if (next && !next.startsWith("--")) {
      out[key] = next;
      i += 1;
    } else {
      out[key] = true;
    }
  }
  return out;
}

function isTruthy(value) {
  if (value === true) return true;
  const raw = String(value || "").trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}

function splitCsv(value) {
  return String(value || "")
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeEmail(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(raw)) return "";
  return raw;
}

function normalizeId(value, fallback) {
  const raw = String(value || fallback || "").trim();
  return raw.replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
}

function resolveTargets(raw) {
  const emails = splitCsv(raw);
  const base = emails.length
    ? emails.map((email) => {
      const normalized = normalizeEmail(email);
      if (!normalized) throw new Error(`Invalid email: ${email}`);
      const local = normalized.split("@")[0];
      return { email: normalized, profile: local.charAt(0).toUpperCase() + local.slice(1) };
    })
    : TARGETS;
  return base.map((row) => ({
    email: normalizeEmail(row.email),
    profile: String(row.profile || row.email.split("@")[0]).trim()
  }));
}

function sanitizeError(error) {
  return {
    status: Number(error?.status || 0) || null,
    code: String(error?.data?.error?.status || error?.data?.error?.code || "").slice(0, 120),
    message: String(error?.message || error || "request_failed").slice(0, 900)
  };
}

async function token() {
  const result = await getServiceAccountAccessToken([CLOUD_PLATFORM_SCOPE]);
  return result.accessToken;
}

async function requestJson(url, options = {}) {
  const accessToken = await token();
  const method = String(options.method || "GET").toUpperCase();
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json"
  };
  const init = { method, headers };
  if (options.body !== undefined && options.body !== null) {
    headers["Content-Type"] = "application/json; charset=utf-8";
    init.body = JSON.stringify(options.body);
  }
  const response = await fetch(url, init);
  const text = await response.text();
  let parsed = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch (_error) {
    parsed = null;
  }
  if (!response.ok) {
    const message = String(parsed?.error?.message || parsed?.error_description || parsed?.error || `HTTP ${response.status}`);
    const error = new Error(message);
    error.status = response.status;
    error.data = parsed;
    throw error;
  }
  return parsed || {};
}

async function optionalRequest(url, options = {}) {
  try {
    return { ok: true, data: await requestJson(url, options) };
  } catch (error) {
    return { ok: false, error: sanitizeError(error), raw: error };
  }
}

async function ensureDiscoveryEngineApi(projectNumber, execute) {
  const name = `projects/${projectNumber}/services/${REQUIRED_SERVICE}`;
  const getUrl = `${SERVICE_USAGE_API}/v1/${encodeURIComponent(name).replace(/%2F/g, "/")}`;
  const current = await optionalRequest(getUrl);
  if (current.ok && String(current.data.state || "").toUpperCase() === "ENABLED") {
    return { service: REQUIRED_SERVICE, state: "ENABLED", action: "already_enabled" };
  }
  if (!execute) {
    return { service: REQUIRED_SERVICE, state: current.ok ? String(current.data.state || "UNKNOWN") : "probe_failed", action: "would_enable", error: current.error || null };
  }
  const enableUrl = `${getUrl}:enable`;
  const enabled = await optionalRequest(enableUrl, { method: "POST", body: {} });
  return {
    service: REQUIRED_SERVICE,
    state: current.ok ? String(current.data.state || "UNKNOWN") : "unknown",
    action: enabled.ok ? "enable_requested" : "enable_failed",
    operation: enabled.ok ? enabled.data.name || "" : "",
    error: enabled.ok ? null : enabled.error
  };
}

async function getBillingAccountLicenseConfig(billingAccount, billingAccountLicenseConfigId) {
  const name = `billingAccounts/${billingAccount}/billingAccountLicenseConfigs/${billingAccountLicenseConfigId}`;
  const url = `${DISCOVERY_ENGINE_API}/v1alpha/${name}`;
  const result = await optionalRequest(url);
  return {
    name,
    status: result.ok ? "ok" : "failed",
    data: result.ok ? {
      name: result.data.name || name,
      licenseCount: result.data.licenseCount || "",
      subscriptionTier: result.data.subscriptionTier || "",
      state: result.data.state || "",
      startDate: result.data.startDate || null,
      endDate: result.data.endDate || null
    } : null,
    error: result.ok ? null : result.error
  };
}

async function getLicenseConfig(projectNumber, location, licenseConfigId) {
  const name = `projects/${projectNumber}/locations/${location}/licenseConfigs/${licenseConfigId}`;
  const result = await optionalRequest(`${DISCOVERY_ENGINE_API}/v1alpha/${name}`);
  return result.ok ? result.data : null;
}

async function distributeLicenseConfig(options) {
  const billingName = `billingAccounts/${options.billingAccount}/billingAccountLicenseConfigs/${options.billingAccountLicenseConfigId}`;
  const url = `${DISCOVERY_ENGINE_API}/v1alpha/${billingName}:distributeLicenseConfig`;
  return requestJson(url, {
    method: "POST",
    body: {
      projectNumber: options.projectNumber,
      location: options.location,
      licenseCount: String(options.licenseCount),
      licenseConfigId: options.licenseConfigId
    }
  });
}

async function ensureLicenseConfig(options) {
  const preferredName = String(options.preferredLicenseConfigName || "").trim();
  const preferredMatch = preferredName.match(/^projects\/[^/]+\/locations\/[^/]+\/licenseConfigs\/([^/]+)$/);
  if (preferredMatch) {
    const preferred = await getLicenseConfig(options.projectNumber, options.location, preferredMatch[1]);
    if (preferred && preferred.name) {
      return { action: "found_from_user_store_default", licenseConfig: preferred, tried: [preferredMatch[1]] };
    }
    return { action: "using_user_store_default", licenseConfig: { name: preferredName }, tried: [preferredMatch[1]] };
  }

  const tried = [];
  const candidates = [
    options.licenseConfigId,
    options.billingAccountLicenseConfigId,
    "search_and_assistant",
    "notebooklm_enterprise",
    "gemini_enterprise_plus"
  ].map((value) => normalizeId(value, "")).filter(Boolean);
  for (const candidate of Array.from(new Set(candidates))) {
    const existing = await getLicenseConfig(options.projectNumber, options.location, candidate);
    tried.push(candidate);
    if (existing && existing.name) {
      return { action: "found", licenseConfig: existing, tried };
    }
  }
  if (!options.execute) {
    const planned = `projects/${options.projectNumber}/locations/${options.location}/licenseConfigs/${options.licenseConfigId}`;
    return { action: "would_distribute", licenseConfig: { name: planned }, tried };
  }
  try {
    const distributed = await distributeLicenseConfig(options);
    return { action: "distributed", licenseConfig: distributed.licenseConfig || distributed, tried };
  } catch (error) {
    const post = await getLicenseConfig(options.projectNumber, options.location, options.licenseConfigId);
    if (post && post.name) {
      return { action: "found_after_distribute_conflict", licenseConfig: post, tried, warning: sanitizeError(error) };
    }
    throw error;
  }
}

async function getUserStore(projectNumber, location, userStoreId) {
  const name = `projects/${projectNumber}/locations/${location}/userStores/${userStoreId}`;
  const result = await optionalRequest(`${DISCOVERY_ENGINE_API}/v1/${name}`);
  return result.ok ? result.data : null;
}

async function createUserStore(options, licenseConfigName) {
  const parent = `projects/${options.projectNumber}/locations/${options.location}`;
  const url = `${DISCOVERY_ENGINE_API}/v1/${parent}/userStores?userStoreId=${encodeURIComponent(options.userStoreId)}`;
  return requestJson(url, {
    method: "POST",
    body: {
      displayName: "Asolaria Gemini Enterprise Users",
      defaultLicenseConfig: licenseConfigName,
      enableLicenseAutoRegister: true,
      enableExpiredLicenseAutoUpdate: true
    }
  });
}

async function patchUserStore(options, licenseConfigName) {
  const name = `projects/${options.projectNumber}/locations/${options.location}/userStores/${options.userStoreId}`;
  const qs = "updateMask=default_license_config,enable_license_auto_register,enable_expired_license_auto_update";
  return requestJson(`${DISCOVERY_ENGINE_API}/v1/${name}?${qs}`, {
    method: "PATCH",
    body: {
      name,
      defaultLicenseConfig: licenseConfigName,
      enableLicenseAutoRegister: true,
      enableExpiredLicenseAutoUpdate: true
    }
  });
}

async function ensureUserStore(options, licenseConfigName) {
  const existing = await getUserStore(options.projectNumber, options.location, options.userStoreId);
  if (!existing) {
    if (!options.execute) {
      return {
        action: "would_create",
        userStore: {
          name: `projects/${options.projectNumber}/locations/${options.location}/userStores/${options.userStoreId}`,
          defaultLicenseConfig: licenseConfigName
        }
      };
    }
    return { action: "created", userStore: await createUserStore(options, licenseConfigName) };
  }
  const needsPatch = existing.defaultLicenseConfig !== licenseConfigName
    || existing.enableLicenseAutoRegister !== true
    || existing.enableExpiredLicenseAutoUpdate !== true;
  if (!needsPatch) {
    return { action: "already_ready", userStore: existing };
  }
  if (!options.execute) {
    return { action: "would_patch", userStore: existing };
  }
  return { action: "patched", userStore: await patchUserStore(options, licenseConfigName) };
}

function bindingHasMember(binding, member) {
  return Array.isArray(binding.members) && binding.members.includes(member);
}

async function ensureProjectRoles(projectNumber, targets, execute) {
  const project = `projects/${projectNumber}`;
  const policyUrl = `${RESOURCE_MANAGER_API}/v1/${project}:getIamPolicy`;
  const policy = await requestJson(policyUrl, { method: "POST", body: {} });
  const bindings = Array.isArray(policy.bindings) ? policy.bindings : [];
  const requested = [];
  let changed = false;
  for (const role of ACCESS_ROLES) {
    let binding = bindings.find((row) => row.role === role);
    if (!binding) {
      binding = { role, members: [] };
      bindings.push(binding);
      changed = true;
    }
    for (const target of targets) {
      const member = `user:${target.email}`;
      if (!bindingHasMember(binding, member)) {
        requested.push({ role, member, action: execute ? "add" : "would_add" });
        binding.members.push(member);
        changed = true;
      } else {
        requested.push({ role, member, action: "already_bound" });
      }
    }
  }
  if (!changed || !execute) {
    return { action: !changed ? "already_ready" : "would_update", requested };
  }
  const nextPolicy = {
    ...policy,
    bindings
  };
  const setUrl = `${RESOURCE_MANAGER_API}/v1/${project}:setIamPolicy`;
  const updated = await requestJson(setUrl, { method: "POST", body: { policy: nextPolicy } });
  return { action: "updated", requested, etag: updated.etag || "" };
}

async function batchUpdateUserLicenses(options, licenseConfigName, targets) {
  const parent = `projects/${options.projectNumber}/locations/${options.location}/userStores/${options.userStoreId}`;
  const url = `${DISCOVERY_ENGINE_API}/v1/${parent}:batchUpdateUserLicenses`;
  return requestJson(url, {
    method: "POST",
    body: {
      deleteUnassignedUserLicenses: false,
      inlineSource: {
        userLicenses: targets.map((target) => ({
          userPrincipal: target.email,
          userProfile: target.profile,
          licenseConfig: licenseConfigName
        }))
      }
    }
  });
}

async function pollOperation(operationName, timeoutMs = 90000) {
  const started = Date.now();
  let last = null;
  while (Date.now() - started < timeoutMs) {
    let fetched = null;
    let lastError = null;
    for (const version of ["v1", "v1alpha", "v1beta"]) {
      try {
        fetched = await requestJson(`${DISCOVERY_ENGINE_API}/${version}/${operationName}`);
        break;
      } catch (error) {
        lastError = error;
      }
    }
    if (!fetched) {
      return { done: false, pollError: sanitizeError(lastError) };
    }
    last = fetched;
    if (fetched.done === true) {
      return fetched;
    }
    await new Promise((resolve) => setTimeout(resolve, 2500));
  }
  return last || { done: false };
}

async function listUserLicenses(projectNumber, location, userStoreId, targets) {
  const parent = `projects/${projectNumber}/locations/${location}/userStores/${userStoreId}`;
  const wanted = new Set(targets.map((target) => target.email));
  const out = [];
  let pageToken = "";
  for (let page = 0; page < 20; page += 1) {
    const url = new URL(`${DISCOVERY_ENGINE_API}/v1/${parent}/userLicenses`);
    url.searchParams.set("pageSize", "50");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const data = await requestJson(url.toString());
    const rows = Array.isArray(data.userLicenses) ? data.userLicenses : [];
    for (const row of rows) {
      if (wanted.has(String(row.userPrincipal || "").toLowerCase())) {
        out.push({
          userPrincipal: row.userPrincipal || "",
          userProfile: row.userProfile || "",
          licenseAssignmentState: row.licenseAssignmentState || "",
          licenseConfig: row.licenseConfig || ""
        });
      }
    }
    pageToken = String(data.nextPageToken || "");
    if (!pageToken || out.length >= wanted.size) break;
  }
  return out.sort((a, b) => a.userPrincipal.localeCompare(b.userPrincipal));
}

async function listUsageStats(projectNumber, location, userStoreId) {
  const parent = `projects/${projectNumber}/locations/${location}/userStores/${userStoreId}`;
  const result = await optionalRequest(`${DISCOVERY_ENGINE_API}/v1/${parent}/licenseConfigsUsageStats`);
  if (!result.ok) return { status: "failed", error: result.error, licenseConfigUsageStats: [] };
  return {
    status: "ok",
    licenseConfigUsageStats: Array.isArray(result.data.licenseConfigUsageStats)
      ? result.data.licenseConfigUsageStats
      : []
  };
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  const action = String(args._[0] || "status").trim().toLowerCase();
  const execute = isTruthy(args.execute);
  const skipIam = isTruthy(args.skipIam);
  const gcp = getGcpConfigSummary({});
  const options = {
    execute,
    projectNumber: String(args.projectNumber || args.project || gcp.projectNumber || DEFAULT_PROJECT_NUMBER).trim(),
    location: String(args.location || DEFAULT_LOCATION).trim(),
    billingAccount: String(args.billingAccount || DEFAULT_BILLING_ACCOUNT).trim(),
    billingAccountLicenseConfigId: String(args.billingAccountLicenseConfigId || DEFAULT_BILLING_ACCOUNT_LICENSE_CONFIG).trim(),
    licenseConfigId: normalizeId(args.licenseConfigId, DEFAULT_LICENSE_CONFIG_ID),
    licenseCount: Number(args.licenseCount || 3) || 3,
    userStoreId: normalizeId(args.userStoreId, DEFAULT_USER_STORE_ID)
  };
  const targets = resolveTargets(args.users);

  if (!options.projectNumber) throw new Error("Missing project number.");
  if (!options.billingAccount) throw new Error("Missing billing account.");
  if (!options.billingAccountLicenseConfigId) throw new Error("Missing billing account license config ID.");

  if (action === "status") {
    const billingConfig = await getBillingAccountLicenseConfig(options.billingAccount, options.billingAccountLicenseConfigId);
    const userStore = await optionalRequest(`${DISCOVERY_ENGINE_API}/v1/projects/${options.projectNumber}/locations/${options.location}/userStores/${options.userStoreId}`);
    const usage = await listUsageStats(options.projectNumber, options.location, options.userStoreId);
    const licenses = userStore.ok ? await listUserLicenses(options.projectNumber, options.location, options.userStoreId, targets).catch((error) => ({ error: sanitizeError(error) })) : [];
    return {
      ok: true,
      action,
      execute: false,
      serviceAccount: {
        configured: gcp.configured,
        clientEmail: gcp.clientEmail,
        projectNumber: gcp.projectNumber
      },
      projectNumber: options.projectNumber,
      location: options.location,
      billingConfig,
      userStore: userStore.ok ? {
        status: "ok",
        name: userStore.data.name || "",
        defaultLicenseConfig: userStore.data.defaultLicenseConfig || "",
        enableLicenseAutoRegister: Boolean(userStore.data.enableLicenseAutoRegister),
        enableExpiredLicenseAutoUpdate: Boolean(userStore.data.enableExpiredLicenseAutoUpdate)
      } : { status: "failed", error: userStore.error },
      usage,
      targets: targets.map((target) => target.email),
      licenses
    };
  }

  if (action !== "ensure-users") {
    throw new Error(`Unknown action: ${action}`);
  }

  const service = await ensureDiscoveryEngineApi(options.projectNumber, execute);
  const billingConfig = await getBillingAccountLicenseConfig(options.billingAccount, options.billingAccountLicenseConfigId);
  const existingUserStore = await getUserStore(options.projectNumber, options.location, options.userStoreId);
  if (existingUserStore && existingUserStore.defaultLicenseConfig) {
    options.preferredLicenseConfigName = existingUserStore.defaultLicenseConfig;
  }
  const license = await ensureLicenseConfig(options);
  const licenseConfigName = String(license.licenseConfig?.name || "").trim();
  if (!licenseConfigName) {
    throw new Error("Could not resolve a project license config.");
  }
  const userStore = await ensureUserStore(options, licenseConfigName);
  let iam = { action: "skipped" };
  if (!skipIam) {
    try {
      iam = await ensureProjectRoles(options.projectNumber, targets, execute);
    } catch (error) {
      iam = { action: "failed_nonfatal", error: sanitizeError(error) };
    }
  }
  let assignment = { action: "would_assign", operation: null };
  let operation = null;
  if (execute) {
    const before = await listUserLicenses(options.projectNumber, options.location, options.userStoreId, targets)
      .catch(() => []);
    const alreadyAssigned = Array.isArray(before)
      && targets.every((target) => before.some((row) => row.userPrincipal === target.email && row.licenseAssignmentState === "ASSIGNED"));
    if (alreadyAssigned) {
      assignment = { action: "already_assigned", operation: null };
    } else {
      try {
        const op = await batchUpdateUserLicenses(options, licenseConfigName, targets);
        assignment = { action: "assign_requested", operation: op.name || "" };
        if (op.name) {
          operation = await pollOperation(op.name);
        }
      } catch (error) {
        assignment = { action: "assign_failed_nonfatal", error: sanitizeError(error) };
      }
    }
  }
  const licenses = await listUserLicenses(options.projectNumber, options.location, options.userStoreId, targets).catch((error) => ({ error: sanitizeError(error) }));
  const usage = await listUsageStats(options.projectNumber, options.location, options.userStoreId);
  const allAssigned = Array.isArray(licenses)
    && targets.every((target) => licenses.some((row) => row.userPrincipal === target.email && row.licenseAssignmentState === "ASSIGNED"));
  return {
    ok: execute ? allAssigned : true,
    action,
    execute,
    projectNumber: options.projectNumber,
    location: options.location,
    service,
    billingConfig,
    license,
    userStore,
    iam,
    assignment,
    operation: operation ? {
      done: Boolean(operation.done),
      error: operation.error || null,
      response: operation.response || null
    } : null,
    targets: targets.map((target) => target.email),
    licenses,
    usage
  };
}

run()
  .then((result) => {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    process.exit(result.ok === false ? 1 : 0);
  })
  .catch((error) => {
    process.stdout.write(`${JSON.stringify({ ok: false, error: String(error?.message || error || "failed") }, null, 2)}\n`);
    process.exit(1);
  });
