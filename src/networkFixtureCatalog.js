"use strict";

const CATEGORY_META = Object.freeze({
  general: Object.freeze({
    id: "general",
    label: "General",
    description: "Reusable connection fixtures for any project or host posture."
  }),
  work_hosted: Object.freeze({
    id: "work_hosted",
    label: "Hosted Work",
    description: "Hosted account access with work identity and policy gates."
  }),
  device_lab: Object.freeze({
    id: "device_lab",
    label: "Device Lab",
    description: "Local LAN and hardware-adjacent fixtures for devices and adapters."
  })
});

const ACCESS_LEVEL_META = Object.freeze({
  observer: Object.freeze({
    id: "observer",
    label: "Observer",
    description: "Read-only visibility. No mutation authority."
  }),
  operator: Object.freeze({
    id: "operator",
    label: "Operator",
    description: "Standard lane execution and profile selection authority."
  }),
  trusted_agent: Object.freeze({
    id: "trusted_agent",
    label: "Trusted Agent",
    description: "May apply hosted-work and higher-risk project fixtures."
  }),
  super_admin: Object.freeze({
    id: "super_admin",
    label: "Super Admin",
    description: "May apply topology-sensitive device and remote-control fixtures."
  }),
  owner: Object.freeze({
    id: "owner",
    label: "Owner",
    description: "Owner-plane authority for the strongest or most sensitive selectors."
  })
});

const BASE_CONNECTION_PROFILES = Object.freeze({
  home_wifi: Object.freeze({
    preference: ["private_internet", "vpn", "usb"],
    available: ["usb", "vpn", "private_internet"],
    allowPublicInternet: false,
    publicInternetPrivate: false,
    remoteAuthRequired: true,
    requireEncryptedRemote: true,
    stealthDeny: true
  }),
  internet_tunnel: Object.freeze({
    preference: ["vpn", "private_internet", "public_internet", "usb"],
    available: ["usb", "vpn", "private_internet", "public_internet"],
    allowPublicInternet: true,
    publicInternetPrivate: true,
    remoteAuthRequired: true,
    requireEncryptedRemote: true,
    stealthDeny: true
  }),
  public_fallback: Object.freeze({
    preference: ["public_internet", "vpn", "private_internet", "usb"],
    available: ["usb", "vpn", "private_internet", "public_internet"],
    allowPublicInternet: true,
    publicInternetPrivate: true,
    remoteAuthRequired: true,
    requireEncryptedRemote: true,
    stealthDeny: true
  }),
  usb_first: Object.freeze({
    preference: ["usb", "private_internet", "vpn"],
    available: ["usb", "vpn", "private_internet"],
    allowPublicInternet: false,
    publicInternetPrivate: false,
    remoteAuthRequired: true,
    requireEncryptedRemote: true,
    stealthDeny: true
  })
});

const FIXTURE_DEFINITIONS = Object.freeze({
  home_wifi: Object.freeze({
    id: "home_wifi",
    label: "Home Wi-Fi",
    category: "general",
    summary: "Private LAN first, no public internet fallback.",
    profileId: "home_wifi",
    accessLevel: "operator",
    selectorKind: "control",
    capabilities: ["apply", "persist"],
    tags: ["wifi", "lan", "private"]
  }),
  internet_tunnel: Object.freeze({
    id: "internet_tunnel",
    label: "Internet Tunnel",
    category: "general",
    summary: "VPN/tunnel-first hosted access with encrypted remote path.",
    profileId: "internet_tunnel",
    accessLevel: "operator",
    selectorKind: "control",
    capabilities: ["apply", "persist"],
    tags: ["vpn", "remote", "hosted"]
  }),
  public_fallback: Object.freeze({
    id: "public_fallback",
    label: "Public Fallback",
    category: "general",
    summary: "Allow public internet as a controlled emergency fallback.",
    profileId: "public_fallback",
    accessLevel: "operator",
    selectorKind: "control",
    capabilities: ["apply", "persist"],
    tags: ["public", "fallback", "remote"]
  }),
  usb_first: Object.freeze({
    id: "usb_first",
    label: "USB First",
    category: "general",
    summary: "Prefer loopback or USB-adjacent lanes before remote paths.",
    profileId: "usb_first",
    accessLevel: "operator",
    selectorKind: "control",
    capabilities: ["apply", "persist"],
    tags: ["usb", "loopback", "local"]
  }),
  qdd_hosted_work_usa: Object.freeze({
    id: "qdd_hosted_work_usa",
    label: "QDD Hosted Work (USA VPN)",
    category: "work_hosted",
    summary: "QDD work-account fixture using hosted-work routing and USA VPN policy.",
    profileId: "internet_tunnel",
    organization: "qdd",
    workIdentityEmail: "jessebrown.soft1980@gmail.com",
    vpnLocationHint: "charleston_sc_us",
    accessLevel: "trusted_agent",
    selectorKind: "control",
    capabilities: ["apply", "persist", "hosted_policy"],
    tags: ["qdd", "hosted", "vpn", "usa"]
  }),
  qdd_novalum_lan: Object.freeze({
    id: "qdd_novalum_lan",
    label: "QDD NovaLUM LAN",
    category: "device_lab",
    summary: "Same-LAN private network fixture for NovaLUM Wi-Fi device sync.",
    profileId: "home_wifi",
    organization: "qdd",
    accessLevel: "super_admin",
    selectorKind: "control",
    capabilities: ["apply", "persist", "device_lab"],
    tags: ["qdd", "novalum", "lan", "device"]
  }),
  qdd_novalum_proxy_usb: Object.freeze({
    id: "qdd_novalum_proxy_usb",
    label: "QDD NovaLUM Desktop Proxy",
    category: "device_lab",
    summary: "Desktop-app proxy fixture for COM/USB mediation before hosted paths.",
    profileId: "usb_first",
    organization: "qdd",
    accessLevel: "super_admin",
    selectorKind: "control",
    capabilities: ["apply", "persist", "device_lab", "proxy"],
    tags: ["qdd", "novalum", "usb", "proxy"]
  })
});

function cloneProfile(profile) {
  const raw = profile && typeof profile === "object" ? profile : {};
  return {
    preference: Array.isArray(raw.preference) ? raw.preference.slice() : [],
    available: Array.isArray(raw.available) ? raw.available.slice() : [],
    allowPublicInternet: Boolean(raw.allowPublicInternet),
    publicInternetPrivate: Boolean(raw.publicInternetPrivate),
    remoteAuthRequired: Boolean(raw.remoteAuthRequired),
    requireEncryptedRemote: Boolean(raw.requireEncryptedRemote),
    stealthDeny: Boolean(raw.stealthDeny)
  };
}

function getBaseConnectionProfile(profileId) {
  const key = String(profileId || "").trim().toLowerCase();
  return cloneProfile(BASE_CONNECTION_PROFILES[key] || {});
}

function resolveNetworkFixture(fixtureId) {
  const key = String(fixtureId || "").trim().toLowerCase();
  if (!key) return null;
  const fixture = FIXTURE_DEFINITIONS[key];
  if (!fixture) return null;
  const category = CATEGORY_META[fixture.category] || CATEGORY_META.general;
  const profile = getBaseConnectionProfile(fixture.profileId);
  return {
    ...fixture,
    categoryMeta: category,
    profile
  };
}

function summarizeNetworkFixture(fixtureId) {
  const fixture = resolveNetworkFixture(fixtureId);
  if (!fixture) return null;
  return {
    id: fixture.id,
    label: fixture.label,
    category: fixture.category,
    categoryLabel: fixture.categoryMeta.label,
    summary: fixture.summary,
    profileId: fixture.profileId || "",
    accessLevel: String(fixture.accessLevel || "operator").trim().toLowerCase(),
    accessLevelLabel: ACCESS_LEVEL_META[String(fixture.accessLevel || "operator").trim().toLowerCase()]?.label || "Operator",
    selectorKind: String(fixture.selectorKind || "control").trim().toLowerCase(),
    capabilities: Array.isArray(fixture.capabilities) ? fixture.capabilities.slice() : [],
    organization: fixture.organization || "",
    workIdentityEmail: fixture.workIdentityEmail || "",
    vpnLocationHint: fixture.vpnLocationHint || "",
    tags: Array.isArray(fixture.tags) ? fixture.tags.slice() : []
  };
}

function listNetworkFixtures() {
  return Object.keys(FIXTURE_DEFINITIONS)
    .sort((a, b) => a.localeCompare(b))
    .map((fixtureId) => summarizeNetworkFixture(fixtureId))
    .filter(Boolean);
}

function listNetworkFixtureCategories() {
  return Object.values(CATEGORY_META).map((entry) => ({
    id: entry.id,
    label: entry.label,
    description: entry.description
  }));
}

function listNetworkFixtureAccessLevels() {
  return Object.values(ACCESS_LEVEL_META).map((entry) => ({
    id: entry.id,
    label: entry.label,
    description: entry.description
  }));
}

function listBaseConnectionProfiles() {
  return Object.keys(BASE_CONNECTION_PROFILES)
    .sort((a, b) => a.localeCompare(b))
    .map((profileId) => ({
      id: profileId,
      ...getBaseConnectionProfile(profileId)
    }));
}

function buildFixtureApplication(fixtureId, options = {}) {
  const fixture = resolveNetworkFixture(fixtureId);
  if (!fixture) {
    return null;
  }
  const payload = {
    ...fixture.profile,
    activeNetworkFixtureId: fixture.id
  };
  if (fixture.organization) {
    payload.activeWorkOrg = fixture.organization;
  }
  const remoteBaseUrl = String(options.remoteBaseUrl || "").trim();
  if (remoteBaseUrl) {
    payload.remoteBaseUrl = remoteBaseUrl;
  }
  return payload;
}

module.exports = {
  CATEGORY_META,
  ACCESS_LEVEL_META,
  BASE_CONNECTION_PROFILES,
  FIXTURE_DEFINITIONS,
  getBaseConnectionProfile,
  resolveNetworkFixture,
  summarizeNetworkFixture,
  listNetworkFixtures,
  listNetworkFixtureCategories,
  listNetworkFixtureAccessLevels,
  listBaseConnectionProfiles,
  buildFixtureApplication
};
