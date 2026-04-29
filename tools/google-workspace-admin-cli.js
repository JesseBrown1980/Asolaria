#!/usr/bin/env node

const crypto = require("crypto");
const { getGcpConfigSummary, getServiceAccountAccessToken } = require("../src/connectors/gcpConnector");
const { getSecret, listSecretMeta, setSecret } = require("../src/secureVault");
const { ensureAccessToken, googleApiRequest, getGoogleIntegrationStatus } = require("../src/connectors/googleConnector");

const DIRECTORY_USER_SCOPE = "https://www.googleapis.com/auth/admin.directory.user";
const LICENSING_SCOPE = "https://www.googleapis.com/auth/apps.licensing";
const CLOUD_PLATFORM_SCOPE = "https://www.googleapis.com/auth/cloud-platform";
const REQUIRED_SERVICES = ["admin.googleapis.com", "licensing.googleapis.com"];
const DEFAULT_GEMINI_PRODUCT_ID = "101047";
const DEFAULT_GEMINI_ENTERPRISE_SKU_ID = "1010470001";
const DEFAULT_ADMIN = "jesse@jbrowndevelopmentllc.com";

const DEFAULT_TARGETS = [
  { local: "asolaria", givenName: "Asolaria", familyName: "Control Plane" },
  { local: "liris", givenName: "Liris", familyName: "Federated Admin" },
  { local: "falcon", givenName: "Falcon", familyName: "Phone Bridge" }
];

function normalizeEmail(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";
  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(raw)) return "";
  return raw;
}

function normalizeLocalPart(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";
  if (!/^[a-z0-9._-]{2,64}$/.test(raw)) return "";
  return raw;
}

function getDomainFromEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized || !normalized.includes("@")) return "";
  return normalized.split("@").pop();
}

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

function generateTemporaryPassword() {
  const random = crypto.randomBytes(18).toString("base64url");
  return `As0!${random}`;
}

function secretNameForUser(email) {
  const safe = normalizeEmail(email).replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return `integrations.google.workspace_user.${safe}`;
}

function sanitizeGoogleError(error) {
  const status = Number(error?.status || 0) || null;
  const message = String(error?.message || error || "google_request_failed").slice(0, 800);
  const reason = String(error?.data?.error?.errors?.[0]?.reason || error?.data?.error?.status || "").slice(0, 120);
  return { status, reason, message };
}

function collectEmails(value, out = new Set(), depth = 0) {
  if (depth > 8 || value === null || value === undefined) return out;
  if (typeof value === "string") {
    const matches = value.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) || [];
    for (const match of matches) {
      const email = normalizeEmail(match);
      if (email) out.add(email);
    }
    return out;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectEmails(item, out, depth + 1);
    return out;
  }
  if (typeof value === "object") {
    for (const item of Object.values(value)) collectEmails(item, out, depth + 1);
  }
  return out;
}

function uniqueSorted(items) {
  return Array.from(new Set(items.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function googleJsonRequest({ url, method = "GET", body, scopes, adminSubject, directServiceAccount }) {
  const token = await getServiceAccountAccessToken(
    scopes,
    directServiceAccount ? {} : { subject: adminSubject }
  );
  const headers = {
    Authorization: `Bearer ${token.accessToken}`,
    Accept: "application/json"
  };
  const init = { method, headers };
  if (body !== undefined && body !== null) {
    headers["Content-Type"] = "application/json; charset=utf-8";
    init.body = JSON.stringify(body);
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
    const msg = String(parsed?.error?.message || parsed?.error_description || parsed?.error || `HTTP ${response.status}`);
    const error = new Error(msg);
    error.status = response.status;
    error.data = parsed;
    throw error;
  }
  return parsed || {};
}

async function probeOAuthAccount(email, domain) {
  const row = {
    email,
    refresh: "unknown",
    adminDirectory: "unknown",
    errors: []
  };
  try {
    await ensureAccessToken(email);
    row.refresh = "ok";
  } catch (error) {
    row.refresh = "failed";
    row.errors.push({ stage: "oauth_refresh", message: String(error?.message || error || "").slice(0, 500) });
    return row;
  }

  try {
    await googleApiRequest({
      account: email,
      method: "GET",
      url: `https://admin.googleapis.com/admin/directory/v1/users?domain=${encodeURIComponent(domain)}&maxResults=1`
    }, {
      maxDepth: 3,
      maxEntries: 20,
      maxString: 500,
      maxBodyChars: 10000
    });
    row.adminDirectory = "ok";
  } catch (error) {
    row.adminDirectory = "failed";
    row.errors.push({ stage: "admin_directory", message: String(error?.message || error || "").slice(0, 500) });
  }
  return row;
}

async function probeServiceAccountDirect(domain) {
  const row = {
    mode: "service_account_direct",
    adminDirectory: "unknown",
    roleManagement: "unknown",
    errors: []
  };
  try {
    await googleJsonRequest({
      url: `https://admin.googleapis.com/admin/directory/v1/users?domain=${encodeURIComponent(domain)}&maxResults=1`,
      scopes: ["https://www.googleapis.com/auth/admin.directory.user.readonly"],
      directServiceAccount: true
    });
    row.adminDirectory = "ok";
  } catch (error) {
    row.adminDirectory = "failed";
    row.errors.push({ stage: "admin_directory_direct", ...sanitizeGoogleError(error) });
  }
  try {
    await googleJsonRequest({
      url: "https://admin.googleapis.com/admin/directory/v1/customer/my_customer/roles",
      scopes: ["https://www.googleapis.com/auth/admin.directory.rolemanagement.readonly"],
      directServiceAccount: true
    });
    row.roleManagement = "ok";
  } catch (error) {
    row.roleManagement = "failed";
    row.errors.push({ stage: "role_management_direct", ...sanitizeGoogleError(error) });
  }
  return row;
}

async function buildAuthorityProbe(domain) {
  const metas = listSecretMeta({ namespace: "owner" });
  const emailSources = [];
  const emails = new Set();
  for (const meta of metas) {
    const secret = getSecret(meta.name, { namespace: "owner" });
    const found = collectEmails(secret?.value);
    for (const email of found) {
      emails.add(email);
      emailSources.push({ email, secret: meta.name });
    }
  }
  const googleStatus = getGoogleIntegrationStatus({});
  const connected = Array.isArray(googleStatus.accounts)
    ? googleStatus.accounts.map((row) => normalizeEmail(row.email)).filter(Boolean)
    : [];
  for (const email of connected) emails.add(email);
  const candidates = uniqueSorted(Array.from(emails));
  const oauthCandidates = uniqueSorted(candidates.filter((email) => connected.includes(email)));
  const oauth = [];
  for (const email of oauthCandidates) {
    oauth.push(await probeOAuthAccount(email, domain));
  }
  const direct = await probeServiceAccountDirect(domain);
  return {
    domain,
    candidateEmails: candidates,
    emailSources,
    connectedOAuthAccounts: oauthCandidates,
    direct,
    oauth
  };
}

async function serviceUsageRequest({ project, service, method = "GET", body }) {
  const token = await getServiceAccountAccessToken([CLOUD_PLATFORM_SCOPE]);
  const url = `https://serviceusage.googleapis.com/v1/projects/${encodeURIComponent(project)}/services/${encodeURIComponent(service)}${method === "POST" ? ":enable" : ""}`;
  const headers = {
    Authorization: `Bearer ${token.accessToken}`,
    Accept: "application/json"
  };
  const init = { method, headers };
  if (body !== undefined && body !== null) {
    headers["Content-Type"] = "application/json; charset=utf-8";
    init.body = JSON.stringify(body);
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
    const msg = String(parsed?.error?.message || parsed?.error_description || parsed?.error || `HTTP ${response.status}`);
    const error = new Error(msg);
    error.status = response.status;
    error.data = parsed;
    throw error;
  }
  return parsed || {};
}

async function ensureServiceEnabled(service, options) {
  const row = { service, state: "unknown", action: "none", errors: [] };
  try {
    const current = await serviceUsageRequest({ project: options.project, service });
    const state = String(current?.state || "").trim().toUpperCase();
    row.state = state || "UNKNOWN";
    if (state === "ENABLED") {
      row.action = "already_enabled";
      return row;
    }
  } catch (error) {
    if (Number(error?.status) !== 404) {
      row.state = "probe_failed";
      row.errors.push({ stage: "service_get", ...sanitizeGoogleError(error) });
      return row;
    }
    row.state = "not_enabled";
  }

  if (!options.execute) {
    row.action = "would_enable";
    return row;
  }

  try {
    await serviceUsageRequest({ project: options.project, service, method: "POST", body: {} });
    row.action = "enable_requested";
    return row;
  } catch (error) {
    row.action = "enable_failed";
    row.errors.push({ stage: "service_enable", ...sanitizeGoogleError(error) });
    return row;
  }
}

async function getWorkspaceUser(email, options) {
  const url = `https://admin.googleapis.com/admin/directory/v1/users/${encodeURIComponent(email)}?projection=basic`;
  try {
    return await googleJsonRequest({
      url,
      scopes: [DIRECTORY_USER_SCOPE],
      adminSubject: options.adminSubject,
      directServiceAccount: options.directServiceAccount
    });
  } catch (error) {
    if (Number(error?.status) === 404) return null;
    throw error;
  }
}

async function createWorkspaceUser(target, options) {
  const password = generateTemporaryPassword();
  const body = {
    primaryEmail: target.email,
    name: {
      givenName: target.givenName,
      familyName: target.familyName
    },
    password,
    changePasswordAtNextLogin: true,
    suspended: false
  };
  if (options.orgUnitPath) {
    body.orgUnitPath = options.orgUnitPath;
  }

  const created = await googleJsonRequest({
    url: "https://admin.googleapis.com/admin/directory/v1/users",
    method: "POST",
    body,
    scopes: [DIRECTORY_USER_SCOPE],
    adminSubject: options.adminSubject,
    directServiceAccount: options.directServiceAccount
  });

  const secretName = secretNameForUser(target.email);
  setSecret(secretName, {
    primaryEmail: target.email,
    temporaryPassword: password,
    changePasswordAtNextLogin: true,
    createdAt: new Date().toISOString()
  }, {
    app: "Asolaria",
    component: "google-workspace-admin-cli",
    credentialOwner: "owner",
    actor: "codex",
    updatedBy: "google-workspace-admin-cli"
  }, { namespace: "owner" });

  return { created, secretName };
}

async function getLicense(userEmail, options) {
  const url = `https://licensing.googleapis.com/apps/licensing/v1/product/${encodeURIComponent(options.productId)}/sku/${encodeURIComponent(options.skuId)}/user/${encodeURIComponent(userEmail)}`;
  try {
    return await googleJsonRequest({
      url,
      scopes: [LICENSING_SCOPE],
      adminSubject: options.adminSubject,
      directServiceAccount: options.directServiceAccount
    });
  } catch (error) {
    if (Number(error?.status) === 404) return null;
    throw error;
  }
}

async function assignLicense(userEmail, options) {
  const url = `https://licensing.googleapis.com/apps/licensing/v1/product/${encodeURIComponent(options.productId)}/sku/${encodeURIComponent(options.skuId)}/user`;
  return googleJsonRequest({
    url,
    method: "POST",
    body: { userId: userEmail },
    scopes: [LICENSING_SCOPE],
    adminSubject: options.adminSubject,
    directServiceAccount: options.directServiceAccount
  });
}

function resolveTargets(rawUsers, domain) {
  const requested = splitCsv(rawUsers);
  const base = requested.length
    ? requested.map((item) => {
      const email = normalizeEmail(item);
      const local = email ? email.split("@")[0] : normalizeLocalPart(item);
      const template = DEFAULT_TARGETS.find((row) => row.local === local) || {};
      return {
        local,
        email: email || `${local}@${domain}`,
        givenName: template.givenName || local,
        familyName: template.familyName || "Asolaria"
      };
    })
    : DEFAULT_TARGETS.map((row) => ({ ...row, email: `${row.local}@${domain}` }));

  return base.map((row) => {
    const email = normalizeEmail(row.email);
    const local = normalizeLocalPart(row.local || (email ? email.split("@")[0] : ""));
    if (!email || !local) {
      throw new Error(`Invalid target user: ${row.email || row.local || "(empty)"}`);
    }
    return {
      local,
      email,
      givenName: String(row.givenName || local).trim(),
      familyName: String(row.familyName || "Asolaria").trim()
    };
  });
}

async function ensureTarget(target, options) {
  const row = {
    email: target.email,
    user: "unknown",
    license: "unknown",
    temporaryPasswordSecret: "",
    errors: []
  };

  let user = null;
  try {
    user = await getWorkspaceUser(target.email, options);
  } catch (error) {
    row.user = "probe_failed";
    row.errors.push({ stage: "user_get", ...sanitizeGoogleError(error) });
    return row;
  }

  if (user) {
    row.user = "exists";
  } else if (!options.execute) {
    row.user = "would_create";
  } else {
    try {
      const created = await createWorkspaceUser(target, options);
      row.user = "created";
      row.temporaryPasswordSecret = created.secretName;
      user = created.created;
    } catch (error) {
      row.user = "create_failed";
      row.errors.push({ stage: "user_create", ...sanitizeGoogleError(error) });
      return row;
    }
  }

  if (!user && !options.execute) {
    row.license = "would_assign_after_create";
    return row;
  }

  let license = null;
  try {
    license = await getLicense(target.email, options);
  } catch (error) {
    row.license = "probe_failed";
    row.errors.push({ stage: "license_get", ...sanitizeGoogleError(error) });
    return row;
  }

  if (license) {
    row.license = "assigned";
    return row;
  }

  if (!options.execute) {
    row.license = "would_assign";
    return row;
  }

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await assignLicense(target.email, options);
      row.license = "assigned";
      return row;
    } catch (error) {
      if (attempt >= 3) {
        row.license = "assign_failed";
        row.errors.push({ stage: "license_assign", attempt, ...sanitizeGoogleError(error) });
        return row;
      }
      await sleep(1500 * attempt);
    }
  }

  return row;
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  const action = String(args._[0] || "status").trim().toLowerCase();
  const hasDelegatedSubjectInput = Boolean(args.admin || args.subject || process.env.ASOLARIA_WORKSPACE_ADMIN);
  const directServiceAccount = isTruthy(args.direct)
    || isTruthy(args.serviceAccountDirect)
    || isTruthy(process.env.ASOLARIA_WORKSPACE_SERVICE_ACCOUNT_DIRECT)
    || (!hasDelegatedSubjectInput && !isTruthy(args.delegated));
  const adminSubject = directServiceAccount
    ? ""
    : normalizeEmail(args.admin || args.subject || process.env.ASOLARIA_WORKSPACE_ADMIN || DEFAULT_ADMIN);
  const inferredDomain = getDomainFromEmail(adminSubject);
  const domain = String(args.domain || process.env.ASOLARIA_WORKSPACE_DOMAIN || inferredDomain || "jbrowndevelopmentllc.com").trim().toLowerCase();
  const productId = String(args.product || args.productId || DEFAULT_GEMINI_PRODUCT_ID).trim();
  const skuId = String(args.sku || args.skuId || DEFAULT_GEMINI_ENTERPRISE_SKU_ID).trim();
  const execute = args.execute === true || String(args.execute || "").toLowerCase() === "true";
  const gcp = getGcpConfigSummary({});

  if (!directServiceAccount && !adminSubject) {
    throw new Error("Missing Workspace admin subject. Pass --admin admin@example.com.");
  }
  if (!domain) {
    throw new Error("Missing Workspace domain. Pass --domain example.com.");
  }

  if (action === "status") {
    return {
      ok: true,
      action,
      execute: false,
      authMode: directServiceAccount ? "service_account_direct" : "domain_wide_delegation",
      adminSubject,
      domain,
      productId,
      skuId,
      gcp: {
        configured: gcp.configured,
        clientEmail: gcp.clientEmail,
        clientId: gcp.clientId,
        defaultProject: gcp.defaultProject,
        projectNumber: gcp.projectNumber
      },
      requiredDomainWideDelegationScopes: [
        DIRECTORY_USER_SCOPE,
        LICENSING_SCOPE
      ]
    };
  }

  if (action === "enable-admin-apis") {
    const project = String(args.project || args.projectId || gcp.projectNumber || gcp.defaultProject || "").trim();
    if (!project) {
      throw new Error("Missing GCP project/project number.");
    }
    const services = splitCsv(args.services).length ? splitCsv(args.services) : REQUIRED_SERVICES;
    const results = [];
    for (const service of services) {
      results.push(await ensureServiceEnabled(service, { project, execute }));
    }
    const failed = results.filter((row) => row.errors.length > 0);
    return {
      ok: failed.length === 0,
      action,
      execute,
      project,
      services,
      results
    };
  }

  if (action === "probe-authority") {
    const probe = await buildAuthorityProbe(domain);
    const hasAdminPath = probe.direct.adminDirectory === "ok"
      || probe.oauth.some((row) => row.adminDirectory === "ok");
    return {
      ok: hasAdminPath,
      action,
      authMode: directServiceAccount ? "service_account_direct" : "domain_wide_delegation",
      gcp: {
        clientEmail: gcp.clientEmail,
        clientId: gcp.clientId,
        projectNumber: gcp.projectNumber
      },
      ...probe
    };
  }

  if (action !== "ensure-gemini-seats" && action !== "repair-gemini-seats") {
    throw new Error(`Unknown action: ${action}`);
  }

  const apiRepair = [];
  if (action === "repair-gemini-seats" || isTruthy(args.autoEnableApis)) {
    const project = String(args.project || args.projectId || gcp.projectNumber || gcp.defaultProject || "").trim();
    if (!project) {
      throw new Error("Missing GCP project/project number.");
    }
    for (const service of REQUIRED_SERVICES) {
      apiRepair.push(await ensureServiceEnabled(service, { project, execute: true }));
    }
  }

  const targets = resolveTargets(args.users, domain);
  const options = {
    adminSubject,
    authMode: directServiceAccount ? "service_account_direct" : "domain_wide_delegation",
    productId,
    skuId,
    execute,
    orgUnitPath: String(args.orgUnitPath || "").trim(),
    directServiceAccount
  };
  const results = [];
  for (const target of targets) {
    results.push(await ensureTarget(target, options));
  }

  const failed = results.filter((row) => row.errors.length > 0);
  return {
    ok: failed.length === 0,
    action,
    execute,
    apiRepair,
    authMode: directServiceAccount ? "service_account_direct" : "domain_wide_delegation",
    adminSubject,
    domain,
    productId,
    skuId,
    targets: targets.map((row) => row.email),
    results
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
