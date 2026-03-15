const healthBadge = document.getElementById("healthBadge");
const messages = document.getElementById("messages");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatSend = document.getElementById("chatSend");
const chatRailNav = document.getElementById("chatRailNav");
const chatRailAppsSection = document.getElementById("chatRailAppsSection");
const chatRailTasksSection = document.getElementById("chatRailTasksSection");
const chatRailChatsSection = document.getElementById("chatRailChatsSection");
const chatThreadList = document.getElementById("chatThreadList");
const chatRecentlyActiveThreadList = document.getElementById("chatRecentlyActiveThreadList");
const chatPinnedThreadList = document.getElementById("chatPinnedThreadList");
const chatFocusTurnoverChip = document.getElementById("chatFocusTurnoverChip");
const chatExecutionChip = document.getElementById("chatExecutionChip");
const chatSafetyMetricsChip = document.getElementById("chatSafetyMetricsChip");
const chatClearFocusBtn = document.getElementById("chatClearFocusBtn");
const chatThreadSearch = document.getElementById("chatThreadSearch");
const chatTaskSearch = document.getElementById("chatTaskSearch");
const chatTaskCardList = document.getElementById("chatTaskCardList");
const chatNewThreadBtn = document.getElementById("chatNewThreadBtn");
const chatRenameThreadBtn = document.getElementById("chatRenameThreadBtn");
const chatActiveThreadHint = document.getElementById("chatActiveThreadHint");
const chatRouteModeSelect = document.getElementById("chatRouteMode");
const chatEscalateBtn = document.getElementById("chatEscalateBtn");
const nextActionStrip = document.getElementById("nextActionStrip");
const nextActionSubtitle = document.getElementById("nextActionSubtitle");
const nextActionReason = document.getElementById("nextActionReason");
const nextActionPrimaryBtn = document.getElementById("nextActionPrimaryBtn");
const nextActionSecondaryBtn = document.getElementById("nextActionSecondaryBtn");
const closeLoopPrompt = document.getElementById("closeLoopPrompt");
const closeLoopText = document.getElementById("closeLoopText");
const closeLoopMarkDoneBtn = document.getElementById("closeLoopMarkDoneBtn");
const closeLoopResumeBtn = document.getElementById("closeLoopResumeBtn");
const closeLoopToast = document.getElementById("closeLoopToast");
const closeLoopToastText = document.getElementById("closeLoopToastText");
const closeLoopToastReopenBtn = document.getElementById("closeLoopToastReopenBtn");
const chatImages = document.getElementById("chatImages");
const chatImageStatus = document.getElementById("chatImageStatus");
const chatFiles = document.getElementById("chatFiles");
const chatFileStatus = document.getElementById("chatFileStatus");
const eventLog = document.getElementById("eventLog");
const shotOutput = document.getElementById("shotOutput");
const stealthToggle = document.getElementById("stealthToggle");
const stealthLabel = document.getElementById("stealthLabel");
const stealthHint = document.getElementById("stealthHint");
const approvalModeSelect = document.getElementById("approvalMode");
const costModeSelect = document.getElementById("costMode");
const codexWebSearchSelect = document.getElementById("codexWebSearch");
const openclawModeSelect = document.getElementById("openclawMode");
const memoryStats = document.getElementById("memoryStats");
const memoryPreview = document.getElementById("memoryPreview");
const memoryWindowTurnsInput = document.getElementById("memoryWindowTurns");
const saveMemoryWindowBtn = document.getElementById("saveMemoryWindowBtn");
const refreshMemoryBtn = document.getElementById("refreshMemoryBtn");
const clearMemoryBtn = document.getElementById("clearMemoryBtn");
const taskLedgerStats = document.getElementById("taskLedgerStats");
const taskLedgerTitle = document.getElementById("taskLedgerTitle");
const taskLedgerDescription = document.getElementById("taskLedgerDescription");
const taskLedgerCreatePriority = document.getElementById("taskLedgerCreatePriority");
const taskLedgerStatusFilter = document.getElementById("taskLedgerStatusFilter");
const taskLedgerPriorityFilter = document.getElementById("taskLedgerPriorityFilter");
const taskLedgerQuery = document.getElementById("taskLedgerQuery");
const taskLedgerIncludeArchived = document.getElementById("taskLedgerIncludeArchived");
const taskLedgerRefreshBtn = document.getElementById("taskLedgerRefreshBtn");
const taskLedgerAddBtn = document.getElementById("taskLedgerAddBtn");
const taskLedgerList = document.getElementById("taskLedgerList");
const taskLedgerEvents = document.getElementById("taskLedgerEvents");
const skillsRefreshBtn = document.getElementById("skillsRefreshBtn");
const skillsReloadBtn = document.getElementById("skillsReloadBtn");
const skillsRunForm = document.getElementById("skillsRunForm");
const skillsSelect = document.getElementById("skillsSelect");
const skillsInput = document.getElementById("skillsInput");
const skillsOutput = document.getElementById("skillsOutput");
const openclawCard = document.getElementById("openclawCard");
const openclawOutput = document.getElementById("openclawOutput");
const openclawCronRunForm = document.getElementById("openclawCronRunForm");
const openclawCronName = document.getElementById("openclawCronName");
const antigravityStatusBtn = document.getElementById("antigravityStatusBtn");
const cursorStatusBtn = document.getElementById("cursorStatusBtn");
const anthropicStatusBtn = document.getElementById("anthropicStatusBtn");
const geminiCliStatusBtn = document.getElementById("geminiCliStatusBtn");
const externalSaveDefaultBtn = document.getElementById("externalSaveDefaultBtn");
const externalClearDefaultBtn = document.getElementById("externalClearDefaultBtn");
const externalClearObservedBtn = document.getElementById("externalClearObservedBtn");
const externalClearObservedAllBtn = document.getElementById("externalClearObservedAllBtn");
const externalModelStatusBtn = document.getElementById("externalModelStatusBtn");
const externalObservedMaxAgeDaysInput = document.getElementById("externalObservedMaxAgeDays");
const externalPruneObservedBtn = document.getElementById("externalPruneObservedBtn");
const externalObservedAutoPruneEnabledToggle = document.getElementById("externalObservedAutoPruneEnabled");
const externalObservedAutoPruneDaysInput = document.getElementById("externalObservedAutoPruneDays");
const externalObservedAutoPruneHourInput = document.getElementById("externalObservedAutoPruneHour");
const externalSaveObservedPruneSettingsBtn = document.getElementById("externalSaveObservedPruneSettingsBtn");
const externalObservedPruneStatus = document.getElementById("externalObservedPruneStatus");
const externalRunForm = document.getElementById("externalRunForm");
const externalProviderSelect = document.getElementById("externalProviderSelect");
const externalModelInput = document.getElementById("externalModelInput");
const externalModelAliasList = document.getElementById("externalModelAliasList");
const externalModelHint = document.getElementById("externalModelHint");
const externalObservedHint = document.getElementById("externalObservedHint");
const externalPrompt = document.getElementById("externalPrompt");
const externalOutput = document.getElementById("externalOutput");
const allowExternalPostingToggle = document.getElementById("allowExternalPosting");
const companyMissionBtn = document.getElementById("companyMissionBtn");
const companyDraftBtn = document.getElementById("companyDraftBtn");
const companyDecideBtn = document.getElementById("companyDecideBtn");
const companyHint = document.getElementById("companyHint");
const companyCreateAccountBtn = document.getElementById("companyCreateAccountBtn");
const companyShowAccountBtn = document.getElementById("companyShowAccountBtn");
const companyRevealAccountBtn = document.getElementById("companyRevealAccountBtn");
const companyMarkRegisteredBtn = document.getElementById("companyMarkRegisteredBtn");
const companyOpenSiteBtn = document.getElementById("companyOpenSiteBtn");
const companyAccountOutput = document.getElementById("companyAccountOutput");
const guardianModeSelect = document.getElementById("guardianMode");
const saveGuardianModeBtn = document.getElementById("saveGuardianModeBtn");
const guardianRiskThresholdSelect = document.getElementById("guardianRiskThreshold");
const saveGuardianThresholdBtn = document.getElementById("saveGuardianThresholdBtn");
const guardianAlertsEnabledToggle = document.getElementById("guardianAlertsEnabled");
const guardianAutoBlockCriticalToggle = document.getElementById("guardianAutoBlockCritical");
const guardianStatusBtn = document.getElementById("guardianStatusBtn");
const guardianBootstrapContactsBtn = document.getElementById("guardianBootstrapContactsBtn");
const guardianTestAlertBtn = document.getElementById("guardianTestAlertBtn");
const guardianOutput = document.getElementById("guardianOutput");
const gatewayAuditTypeSelect = document.getElementById("gatewayAuditType");
const gatewayAuditLimitInput = document.getElementById("gatewayAuditLimit");
const gatewayAuditRefreshBtn = document.getElementById("gatewayAuditRefreshBtn");
const gatewayAuditVerifyBtn = document.getElementById("gatewayAuditVerifyBtn");
const gatewayReadinessDrillBtn = document.getElementById("gatewayReadinessDrillBtn");
const gatewayHeartbeatRunBtn = document.getElementById("gatewayHeartbeatRunBtn");
const gatewayStartSandboxBtn = document.getElementById("gatewayStartSandboxBtn");
const gatewayAuthorityStatus = document.getElementById("gatewayAuthorityStatus");
const gatewayAuditStatus = document.getElementById("gatewayAuditStatus");
const gatewayReadinessDrillOutput = document.getElementById("gatewayReadinessDrillOutput");
const gatewayReadinessHints = document.getElementById("gatewayReadinessHints");
const gatewayAuditEvents = document.getElementById("gatewayAuditEvents");
const railFilter = document.getElementById("railFilter");
const projectNav = document.getElementById("projectNav");
const projectFolderTree = document.getElementById("projectFolderTree");
const projectFolderSearch = document.getElementById("projectFolderSearch");
const projectRefreshBtn = document.getElementById("projectRefreshBtn");
const projectCreateBtn = document.getElementById("projectCreateBtn");
const projectUpdateBtn = document.getElementById("projectUpdateBtn");
const projectDeleteBtn = document.getElementById("projectDeleteBtn");
const projectAdminOutput = document.getElementById("projectAdminOutput");
const openPhoneModeBtn = document.getElementById("openPhoneModeBtn");
const phoneRuntimeAlertBadge = document.getElementById("phoneRuntimeAlertBadge");
const colonyDashboardCard = document.getElementById("colonyDashboardCard");
const colonyGrid = document.getElementById("colonyGrid");
const colonySummary = document.getElementById("colonySummary");
const colonyUpdatedAt = document.getElementById("colonyUpdatedAt");
const phoneAgentRuntimeCard = document.getElementById("phoneAgentRuntimeCard");
const phoneAgentGrid = document.getElementById("phoneAgentGrid");
const phoneAgentSummary = document.getElementById("phoneAgentSummary");
const phoneAgentUpdatedAt = document.getElementById("phoneAgentUpdatedAt");

const AGENT_DASHBOARD_ORDER = Object.freeze([
  "asolaria-core",
  "this-codex",
  "other-codex",
  "build-codex",
  "phone-codex",
  "watchdog"
]);

const AGENT_FALLBACK_META = Object.freeze({
  "asolaria-core": Object.freeze({ name: "Asolaria", role: "Core Runtime", icon: "A" }),
  "this-codex": Object.freeze({ name: "Vector", role: "Main Brain", icon: "V" }),
  "other-codex": Object.freeze({ name: "Rook", role: "Ops Lane", icon: "R" }),
  "build-codex": Object.freeze({ name: "Forge", role: "Build Lane", icon: "F" }),
  "phone-codex": Object.freeze({ name: "Falcon", role: "Phone Lane", icon: "P" }),
  "watchdog": Object.freeze({ name: "Watchdog", role: "Supervisor", icon: "W" })
});
const PHONE_AGENT_DASHBOARD_ORDER = Object.freeze([
  "phone-codex",
  "phone-link-keeper",
  "phone-tunnel-monitor"
]);

const PHONE_AGENT_FALLBACK_META = Object.freeze({
  "phone-codex": Object.freeze({ name: "Falcon", role: "Phone Lane", icon: "P" }),
  "phone-link-keeper": Object.freeze({ name: "Phone Link Keeper", role: "USB/Wi-Fi Keeper", icon: "LK" }),
  "phone-tunnel-monitor": Object.freeze({ name: "Phone Tunnel Monitor", role: "Tunnel Failover", icon: "TM" })
});
const PHONE_RUNTIME_ALERT_THRESHOLD_SECONDS = 90;

let stealthMode = true;
let approvalMode = "smart";
let memoryWindowTurns = 12;
let costMode = "low";
let codexWebSearch = false;
let openclawMode = "read_only";
let allowExternalPosting = false;
let guardianMode = "autonomous";
let guardianRiskThreshold = "high";
let guardianAlertsEnabled = true;
let guardianAutoBlockCritical = false;
let activeProjectScope = "all";
let externalModelAliases = {};
let externalModelCatalog = {};
let externalDefaultModels = {};
let externalDefaultModelsRevision = "";
let externalObservedPruneRuntime = {
  enabled: true,
  maxAgeDays: 30,
  dailyHourLocal: 3,
  timerActive: false,
  nextRunAt: "",
  lastRunAt: "",
  lastError: "",
  lastSummary: null,
  runs: 0
};

const PROJECT_SCOPE_STORAGE_KEY = "ASOLARIA_ACTIVE_PROJECT_SCOPE";
const PROJECT_ALLOWED_GROUPS = Object.freeze(["projects", "tasks", "skills", "runtime"]);
const CHAT_THREADS_STORAGE_KEY = "ASOLARIA_CHAT_THREADS_V1";
const CHAT_ACTIVE_THREAD_STORAGE_KEY = "ASOLARIA_CHAT_ACTIVE_THREAD_V1";
const CHAT_ROUTE_MODE_STORAGE_KEY = "ASOLARIA_CHAT_ROUTE_MODE_V1";
const CHAT_PINNED_THREADS_STORAGE_KEY = "ASOLARIA_CHAT_PINNED_THREADS_V1";
const CHAT_RAIL_SECTION_STORAGE_KEY = "ASOLARIA_CHAT_RAIL_SECTION_V1";
const CHAT_TASK_LINKS_STORAGE_KEY = "ASOLARIA_CHAT_TASK_LINKS_V1";
const CHAT_CLOSE_LOOP_DISMISSALS_STORAGE_KEY = "ASOLARIA_CHAT_CLOSE_LOOP_DISMISSALS_V1";
const CHAT_FOCUS_TURNOVER_STORAGE_KEY = "ASOLARIA_CHAT_FOCUS_TURNOVER_V1";
const CHAT_SAFETY_METRICS_STORAGE_KEY = "ASOLARIA_CHAT_SAFETY_METRICS_V1";
const CHAT_FOCUS_MAX_ITEMS = 3;
const CHAT_RECENTLY_ACTIVE_WINDOW_MS = 24 * 60 * 60 * 1000;
const CHAT_RECENTLY_ACTIVE_MAX_ITEMS = 5;
const CHAT_CLOSE_LOOP_INACTIVE_MS = 48 * 60 * 60 * 1000;
const DEFAULT_CHAT_THREAD_ID = "main";
const DEFAULT_CHAT_THREAD_TITLE = "Main Chat";

let projectScopeList = [];
let projectScopeMap = Object.create(null);
let projectCatalogById = Object.create(null);
let chatThreads = [];
let chatTurnsByThread = Object.create(null);
let activeChatThreadId = DEFAULT_CHAT_THREAD_ID;
let chatRouteMode = "normal";
let chatPinnedThreadIds = [];
let chatRailSection = "chats";
let chatRailTasks = [];
let chatTaskLinks = Object.create(null);
let chatCloseLoopDismissals = Object.create(null);
let chatFocusTurnover = {
  day: "",
  adds: 0,
  removes: 0,
  replacements: 0,
  clears: 0
};
let chatExecutionMetrics = {
  active: 0,
  blocked: 0,
  doneToday: 0,
  day: buildLocalDayKey()
};
let chatSafetyMetrics = {
  day: "",
  nbaShown: 0,
  nbaClicked: 0,
  resolveClicks: 0,
  reopenClicks: 0
};
let lastNbaExposureSignature = "";
let chatGoShortcutUntilMs = 0;
let nextActionState = {
  type: "start_new",
  chatId: "",
  taskId: "",
  reason: "Because you worked on this today",
  tooltip: "We surface what seems most relevant based on your recent activity."
};
let closeLoopToastTimer = 0;
let closeLoopToastState = {
  taskId: "",
  chatId: ""
};

function normalizeProjectScopeId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

function normalizeProjectGroup(value, fallback = "projects") {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "all") {
    return "all";
  }
  if (PROJECT_ALLOWED_GROUPS.includes(normalized)) {
    return normalized;
  }
  return fallback;
}

function normalizeProjectFolders(value) {
  if (Array.isArray(value)) {
    return uniqueNonEmptyStrings(value).slice(0, 120);
  }
  const raw = String(value || "");
  if (!raw.trim()) {
    return [];
  }
  return uniqueNonEmptyStrings(raw.split(/[\n,]/g)).slice(0, 120);
}

function createProjectScopeFromValue(value = {}) {
  const source = value && typeof value === "object" ? value : {};
  const id = normalizeProjectScopeId(source.id || source.scopeId || source.name || source.label || "");
  if (!id) {
    return null;
  }
  const label = String(source.label || source.name || (id === "all" ? "All Projects" : id))
    .trim()
    .slice(0, 100) || (id === "all" ? "All Projects" : id);
  const marker = String(source.marker || "").replace(/\r/g, "").trim().slice(0, 80);
  const group = id === "all"
    ? "all"
    : normalizeProjectGroup(source.group, "projects");
  const folders = normalizeProjectFolders(source.folders);
  return {
    id,
    label,
    marker: id === "all" ? "" : marker,
    group,
    folders
  };
}

function buildAllProjectScope(scopes = []) {
  const folders = uniqueNonEmptyStrings(
    scopes.flatMap((scope) => (Array.isArray(scope?.folders) ? scope.folders : []))
  ).slice(0, 200);
  return {
    id: "all",
    label: "All Projects",
    marker: "",
    group: "all",
    folders
  };
}

function buildFallbackProjectScopes() {
  return [buildAllProjectScope([])];
}

function setProjectScopeCatalog(scopes = [], projects = []) {
  const list = [];
  const seen = new Set();
  const scopeRows = Array.isArray(scopes) ? scopes : [];
  for (const raw of scopeRows) {
    const scope = createProjectScopeFromValue(raw);
    if (!scope || !scope.id || scope.id === "all" || seen.has(scope.id)) {
      continue;
    }
    seen.add(scope.id);
    list.push(scope);
  }
  const projectRows = Array.isArray(projects) ? projects : [];
  for (const raw of projectRows) {
    if (Boolean(raw?.archived)) {
      continue;
    }
    const scope = createProjectScopeFromValue(raw);
    if (!scope || !scope.id || scope.id === "all" || seen.has(scope.id)) {
      continue;
    }
    seen.add(scope.id);
    list.push(scope);
  }
  list.sort((a, b) => String(a.label || "").localeCompare(String(b.label || "")));

  const allScope = buildAllProjectScope(list);
  const explicitAll = scopeRows
    .map((scope) => createProjectScopeFromValue(scope))
    .find((scope) => scope?.id === "all");
  if (explicitAll) {
    allScope.label = explicitAll.label || allScope.label;
    allScope.folders = uniqueNonEmptyStrings([
      ...(explicitAll.folders || []),
      ...allScope.folders
    ]).slice(0, 200);
  }

  projectScopeList = [allScope, ...list];
  projectScopeMap = Object.create(null);
  for (const scope of projectScopeList) {
    projectScopeMap[scope.id] = scope;
  }

  projectCatalogById = Object.create(null);
  for (const raw of projectRows) {
    const scope = createProjectScopeFromValue(raw);
    if (!scope || !scope.id || scope.id === "all") {
      continue;
    }
    projectCatalogById[scope.id] = {
      id: scope.id,
      label: String(raw.label || scope.label || "").trim().slice(0, 100) || scope.label,
      marker: String(raw.marker || scope.marker || "").replace(/\r/g, "").trim().slice(0, 80),
      group: normalizeProjectGroup(raw.group, scope.group || "projects"),
      folders: normalizeProjectFolders(raw.folders),
      archived: Boolean(raw.archived),
      createdAt: String(raw.createdAt || ""),
      updatedAt: String(raw.updatedAt || "")
    };
  }
  for (const scope of list) {
    if (projectCatalogById[scope.id]) {
      continue;
    }
    projectCatalogById[scope.id] = {
      id: scope.id,
      label: scope.label,
      marker: scope.marker,
      group: scope.group,
      folders: scope.folders.slice(0),
      archived: false,
      createdAt: "",
      updatedAt: ""
    };
  }
}

function normalizeProjectScope(value) {
  const normalized = normalizeProjectScopeId(value);
  if (!normalized || !Object.prototype.hasOwnProperty.call(projectScopeMap, normalized)) {
    return "all";
  }
  return normalized;
}

function getActiveProjectScope() {
  const normalized = normalizeProjectScope(activeProjectScope);
  return projectScopeMap[normalized] || projectScopeMap.all || {
    id: "all",
    label: "All Projects",
    marker: "",
    group: "all",
    folders: []
  };
}

function renderProjectScopeNav() {
  if (!projectNav) {
    return;
  }
  const normalized = normalizeProjectScope(activeProjectScope);
  projectNav.innerHTML = "";
  for (const scope of projectScopeList) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "project-pill";
    button.dataset.project = scope.id;
    button.textContent = scope.label;
    if (scope.marker) {
      button.title = `${scope.marker} ${scope.label}`;
    }
    if (scope.id === normalized) {
      button.classList.add("active");
    }
    projectNav.appendChild(button);
  }
}

function renderProjectFolderTree(scopeId) {
  if (!projectFolderTree) {
    return;
  }
  const normalized = normalizeProjectScope(scopeId);
  const scope = projectScopeMap[normalized] || getActiveProjectScope();
  const allFolders = Array.isArray(scope.folders) ? scope.folders : [];
  const query = String(projectFolderSearch?.value || "").trim().toLowerCase();
  const folders = query
    ? allFolders.filter((folder) => String(folder || "").toLowerCase().includes(query))
    : allFolders;
  projectFolderTree.innerHTML = "";
  const title = document.createElement("div");
  title.className = "folder-tree-title";
  title.textContent = `${scope.label} folders (${folders.length}/${allFolders.length})`;
  projectFolderTree.appendChild(title);
  if (folders.length < 1) {
    const empty = document.createElement("div");
    empty.className = "folder-tree-empty";
    empty.textContent = "No folders match this filter.";
    projectFolderTree.appendChild(empty);
    return;
  }
  for (const folder of folders) {
    const line = document.createElement("div");
    line.className = "folder-tree-item";
    line.textContent = folder;
    projectFolderTree.appendChild(line);
  }
}

function applyProjectScope(scopeId, options = {}) {
  const normalized = normalizeProjectScope(scopeId);
  const scope = projectScopeMap[normalized] || getActiveProjectScope();
  activeProjectScope = normalized;
  if (options.persist !== false) {
    try {
      localStorage.setItem(PROJECT_SCOPE_STORAGE_KEY, normalized);
    } catch {}
  }

  renderProjectScopeNav();
  renderProjectFolderTree(normalized);

  if (taskLedgerTitle) {
    taskLedgerTitle.placeholder = scope.marker
      ? `${scope.marker} task title`
      : "Task title";
  }
  if (taskLedgerDescription) {
    taskLedgerDescription.placeholder = scope.marker
      ? `Notes for ${scope.label}`
      : "Task description (optional)";
  }
  if (memoryStats) {
    memoryStats.dataset.scope = scope.label;
  }

  if (options.syncGroupFilter !== false) {
    applyActionGroupFilter(scope.group || "all");
  }
  if (options.refreshLedger !== false) {
    refreshTaskLedger({ silent: true });
  }
  refreshChatRailTasks({ silent: true }).catch(() => {});
}

async function refreshProjectScopes(options = {}) {
  const limit = Number(options.limit);
  const boundedLimit = Number.isFinite(limit) ? Math.max(20, Math.min(1000, Math.round(limit))) : 500;
  const params = new URLSearchParams();
  params.set("limit", String(boundedLimit));
  if (options.includeArchived) {
    params.set("includeArchived", "true");
  }
  const data = await request(`/api/projects?${params.toString()}`);
  setProjectScopeCatalog(data.scopes, data.projects);
  const preferredScope = options.preferredScopeId || options.scopeId || activeProjectScope || "all";
  applyProjectScope(preferredScope, {
    syncGroupFilter: options.syncGroupFilter !== false,
    refreshLedger: options.refreshLedger !== false
  });
  if (!options.silent) {
    const count = Number(data.count || (Array.isArray(data.projects) ? data.projects.length : 0));
    setProjectAdminMessage(`Loaded ${count} project${count === 1 ? "" : "s"}.`);
  }
  return data;
}

function getProjectForEdit(scopeId) {
  const normalized = normalizeProjectScope(scopeId);
  if (!normalized || normalized === "all") {
    return null;
  }
  const cached = projectCatalogById[normalized];
  if (cached) {
    return JSON.parse(JSON.stringify(cached));
  }
  const scope = projectScopeMap[normalized];
  if (!scope) {
    return null;
  }
  return {
    id: scope.id,
    label: scope.label,
    marker: scope.marker,
    group: scope.group,
    folders: Array.isArray(scope.folders) ? scope.folders.slice(0) : [],
    archived: false,
    createdAt: "",
    updatedAt: ""
  };
}

function setProjectAdminMessage(message, isError = false) {
  if (!projectAdminOutput) {
    return;
  }
  const text = String(message || "").trim();
  projectAdminOutput.textContent = text || "Projects are persisted in local data storage.";
  projectAdminOutput.style.color = isError ? "#ffb8b8" : "";
}

function buildProjectInputPayload(mode, current = null) {
  const baseline = current && typeof current === "object" ? current : {};
  const currentLabel = String(baseline.label || "").trim();
  const labelPrompt = window.prompt("Project label:", currentLabel);
  if (labelPrompt === null) return null;
  const label = String(labelPrompt || "").trim();
  if (!label) {
    throw new Error("Project label is required.");
  }

  let id = "";
  if (mode === "create") {
    const suggestedId = normalizeProjectScopeId(String(baseline.id || label));
    const idPrompt = window.prompt("Project id (optional):", suggestedId);
    if (idPrompt === null) return null;
    id = normalizeProjectScopeId(idPrompt);
    if (id === "all") {
      throw new Error("Project id \"all\" is reserved.");
    }
  }

  const markerPrompt = window.prompt(
    "Marker (optional, e.g. [ASOLARIA]):",
    String(baseline.marker || "").trim()
  );
  if (markerPrompt === null) return null;
  const marker = String(markerPrompt || "").replace(/\r/g, "").trim().slice(0, 80);

  const currentGroup = normalizeProjectGroup(baseline.group, "projects");
  const groupPrompt = window.prompt(
    "Group (projects|tasks|skills|runtime):",
    currentGroup
  );
  if (groupPrompt === null) return null;
  const group = normalizeProjectGroup(groupPrompt, currentGroup || "projects");

  const foldersPrompt = window.prompt(
    "Folders/paths (comma or newline separated):",
    Array.isArray(baseline.folders) ? baseline.folders.join("\n") : ""
  );
  if (foldersPrompt === null) return null;
  const folders = normalizeProjectFolders(foldersPrompt);

  const payload = {
    label,
    marker,
    group,
    folders
  };
  if (mode === "create" && id) {
    payload.id = id;
  }
  return payload;
}

async function createProjectFromUi() {
  const payload = buildProjectInputPayload("create");
  if (!payload) return;
  const created = await apiPost("/api/projects", payload);
  const newScope = normalizeProjectScopeId(created?.project?.id || payload.id || payload.label || "");
  await refreshProjectScopes({
    preferredScopeId: newScope || activeProjectScope,
    syncGroupFilter: true,
    refreshLedger: true,
    silent: true
  });
  setProjectAdminMessage(`Project created: ${created?.project?.label || payload.label}`);
}

async function updateSelectedProjectFromUi() {
  const selected = getProjectForEdit(activeProjectScope);
  if (!selected || !selected.id || selected.id === "all") {
    throw new Error("Select a specific project before editing.");
  }
  const payload = buildProjectInputPayload("update", selected);
  if (!payload) return;
  await request(`/api/projects/${encodeURIComponent(selected.id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  await refreshProjectScopes({
    preferredScopeId: selected.id,
    syncGroupFilter: true,
    refreshLedger: true,
    silent: true
  });
  setProjectAdminMessage(`Project updated: ${payload.label}`);
}

async function deleteSelectedProjectFromUi() {
  const selected = getProjectForEdit(activeProjectScope);
  if (!selected || !selected.id || selected.id === "all") {
    throw new Error("Select a specific project before deleting.");
  }
  const confirmed = window.confirm(`Delete project "${selected.label}"?\n\nOK = continue\nCancel = keep project`);
  if (!confirmed) return;
  const hard = window.confirm(`Hard delete "${selected.label}" permanently?\n\nOK = hard delete\nCancel = archive (soft delete)`);
  const query = hard ? "?hard=true" : "";
  await request(`/api/projects/${encodeURIComponent(selected.id)}${query}`, {
    method: "DELETE"
  });
  await refreshProjectScopes({
    preferredScopeId: "all",
    syncGroupFilter: true,
    refreshLedger: true,
    silent: true
  });
  setProjectAdminMessage(`${hard ? "Deleted" : "Archived"} project: ${selected.label}`);
}

setProjectScopeCatalog([], []);

function applyActionGroupFilter(group) {
  const normalized = String(group || "all").trim().toLowerCase() || "all";
  const cards = Array.from(document.querySelectorAll(".action-panel .card[data-group]"));
  for (const card of cards) {
    const cardGroup = String(card.getAttribute("data-group") || "runtime").trim().toLowerCase();
    const alwaysVisible = card.id === "workspaceCard" || card.id === "colonyDashboardCard";
    const match = alwaysVisible || normalized === "all" || cardGroup === normalized;
    card.classList.toggle("group-hidden", !match);
  }
  if (railFilter) {
    const buttons = Array.from(railFilter.querySelectorAll(".rail-filter-btn"));
    for (const button of buttons) {
      const btnGroup = String(button.dataset.group || "").trim().toLowerCase();
      button.classList.toggle("active", btnGroup === normalized);
    }
  }
}

function logEvent(text) {
  const row = document.createElement("div");
  row.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
  eventLog.prepend(row);
}

function normalizeChatThreadId(value, fallback = DEFAULT_CHAT_THREAD_ID) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
  if (normalized) return normalized;
  return String(fallback || DEFAULT_CHAT_THREAD_ID);
}

function normalizeChatRouteMode(value) {
  return String(value || "").trim().toLowerCase() === "deep" ? "deep" : "normal";
}

function normalizeChatRailSection(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "tasks" || normalized === "chats") {
    return normalized;
  }
  return "apps";
}

function buildChatThreadTitle(value, fallback = "New Chat") {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) {
    return fallback;
  }
  return text.length > 70 ? `${text.slice(0, 67).trim()}...` : text;
}

function parseIsoTimeMs(value) {
  const parsed = new Date(String(value || "")).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildLocalDayKey(ms = Date.now()) {
  const date = new Date(Number(ms) || Date.now());
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sanitizeFocusTurnover(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const day = /^\d{4}-\d{2}-\d{2}$/.test(String(source.day || "").trim())
    ? String(source.day).trim()
    : buildLocalDayKey();
  const parseCount = (input) => {
    const parsed = Number.parseInt(String(input ?? 0), 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
  };
  return {
    day,
    adds: parseCount(source.adds),
    removes: parseCount(source.removes),
    replacements: parseCount(source.replacements),
    clears: parseCount(source.clears)
  };
}

function ensureFocusTurnoverDay() {
  const today = buildLocalDayKey();
  if (chatFocusTurnover.day !== today) {
    chatFocusTurnover = sanitizeFocusTurnover({ day: today });
    saveFocusTurnoverState();
  }
}

function saveFocusTurnoverState() {
  try {
    localStorage.setItem(CHAT_FOCUS_TURNOVER_STORAGE_KEY, JSON.stringify(chatFocusTurnover));
  } catch {}
}

function loadFocusTurnoverState() {
  try {
    const raw = localStorage.getItem(CHAT_FOCUS_TURNOVER_STORAGE_KEY) || "{}";
    chatFocusTurnover = sanitizeFocusTurnover(JSON.parse(raw));
  } catch {
    chatFocusTurnover = sanitizeFocusTurnover({});
  }
  ensureFocusTurnoverDay();
  saveFocusTurnoverState();
  renderFocusTurnoverChip();
}

function sanitizeSafetyMetrics(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const day = /^\d{4}-\d{2}-\d{2}$/.test(String(source.day || "").trim())
    ? String(source.day).trim()
    : buildLocalDayKey();
  const parseCount = (input) => {
    const parsed = Number.parseInt(String(input ?? 0), 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
  };
  return {
    day,
    nbaShown: parseCount(source.nbaShown),
    nbaClicked: parseCount(source.nbaClicked),
    resolveClicks: parseCount(source.resolveClicks),
    reopenClicks: parseCount(source.reopenClicks)
  };
}

function saveSafetyMetricsState() {
  try {
    localStorage.setItem(CHAT_SAFETY_METRICS_STORAGE_KEY, JSON.stringify(chatSafetyMetrics));
  } catch {}
}

function ensureSafetyMetricsDay() {
  const today = buildLocalDayKey();
  if (chatSafetyMetrics.day !== today) {
    chatSafetyMetrics = sanitizeSafetyMetrics({ day: today });
    lastNbaExposureSignature = "";
    saveSafetyMetricsState();
  }
}

function formatSafetyMetric(value) {
  const parsed = Number.parseInt(String(value ?? 0), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

function formatSafetyRate(numerator, denominator) {
  const top = formatSafetyMetric(numerator);
  const base = formatSafetyMetric(denominator);
  if (base <= 0) {
    return "0%";
  }
  return `${Math.round((top / base) * 100)}%`;
}

function formatSafetyMetricsChip(metrics = chatSafetyMetrics) {
  const shown = formatSafetyMetric(metrics.nbaShown);
  const clicked = formatSafetyMetric(metrics.nbaClicked);
  const resolved = formatSafetyMetric(metrics.resolveClicks);
  const reopened = formatSafetyMetric(metrics.reopenClicks);
  return `NBA ${clicked}/${shown} | Reopen ${reopened}/${resolved}`;
}

function renderChatSafetyMetricsChip() {
  if (!chatSafetyMetricsChip) {
    return;
  }
  ensureSafetyMetricsDay();
  const shown = formatSafetyMetric(chatSafetyMetrics.nbaShown);
  const clicked = formatSafetyMetric(chatSafetyMetrics.nbaClicked);
  const resolved = formatSafetyMetric(chatSafetyMetrics.resolveClicks);
  const reopened = formatSafetyMetric(chatSafetyMetrics.reopenClicks);
  chatSafetyMetricsChip.textContent = formatSafetyMetricsChip();
  chatSafetyMetricsChip.title = `Today (${chatSafetyMetrics.day}): NBA CTR ${clicked}/${shown} (${formatSafetyRate(clicked, shown)}), Reopen ratio ${reopened}/${resolved} (${formatSafetyRate(reopened, resolved)})`;
}

function loadSafetyMetricsState() {
  try {
    const raw = localStorage.getItem(CHAT_SAFETY_METRICS_STORAGE_KEY) || "{}";
    chatSafetyMetrics = sanitizeSafetyMetrics(JSON.parse(raw));
  } catch {
    chatSafetyMetrics = sanitizeSafetyMetrics({});
  }
  ensureSafetyMetricsDay();
  saveSafetyMetricsState();
  renderChatSafetyMetricsChip();
}

function recordSafetyMetric(type) {
  ensureSafetyMetricsDay();
  if (type === "nbaShown") {
    chatSafetyMetrics.nbaShown += 1;
  } else if (type === "nbaClicked") {
    chatSafetyMetrics.nbaClicked += 1;
  } else if (type === "resolveClicks") {
    chatSafetyMetrics.resolveClicks += 1;
  } else if (type === "reopenClicks") {
    chatSafetyMetrics.reopenClicks += 1;
  } else {
    return;
  }
  saveSafetyMetricsState();
  renderChatSafetyMetricsChip();
}

function recordNextActionExposure(state = nextActionState) {
  if (!state || typeof state !== "object") {
    return;
  }
  ensureSafetyMetricsDay();
  const signature = [
    chatSafetyMetrics.day,
    String(state.type || ""),
    String(state.chatId || ""),
    String(state.taskId || ""),
    String(state.subtitle || "")
  ].join("|");
  if (!signature || signature === lastNbaExposureSignature) {
    return;
  }
  lastNbaExposureSignature = signature;
  recordSafetyMetric("nbaShown");
}

function focusTurnoverSummary() {
  ensureFocusTurnoverDay();
  return `adds=${chatFocusTurnover.adds}, removes=${chatFocusTurnover.removes}, replacements=${chatFocusTurnover.replacements}, clears=${chatFocusTurnover.clears}`;
}

function formatFocusTurnoverChip() {
  ensureFocusTurnoverDay();
  return `A${chatFocusTurnover.adds} | R${chatFocusTurnover.removes} | X${chatFocusTurnover.replacements} | C${chatFocusTurnover.clears}`;
}

function renderFocusTurnoverChip() {
  if (!chatFocusTurnoverChip) {
    return;
  }
  chatFocusTurnoverChip.textContent = formatFocusTurnoverChip();
  chatFocusTurnoverChip.title = `Today's focus turnover (${chatFocusTurnover.day}): ${focusTurnoverSummary()}`;
}

function formatExecutionMetric(value) {
  const parsed = Number.parseInt(String(value ?? 0), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

function formatExecutionChipLabel(metrics = chatExecutionMetrics) {
  const active = formatExecutionMetric(metrics.active);
  const blocked = formatExecutionMetric(metrics.blocked);
  const doneToday = formatExecutionMetric(metrics.doneToday);
  return `${active} Active | ${blocked} Blocked | ${doneToday} Done Today`;
}

function renderChatExecutionChip() {
  if (!chatExecutionChip) {
    return;
  }
  chatExecutionChip.textContent = formatExecutionChipLabel();
  chatExecutionChip.title = `Today (${chatExecutionMetrics.day}): active=${formatExecutionMetric(chatExecutionMetrics.active)}, blocked=${formatExecutionMetric(chatExecutionMetrics.blocked)}, done today=${formatExecutionMetric(chatExecutionMetrics.doneToday)}`;
}

function isDoneLedgerEvent(event = {}) {
  const type = String(event.type || "").trim().toLowerCase();
  const note = String(event.note || "").trim().toLowerCase();
  if (!type && !note) {
    return false;
  }
  if (type.includes("done") || note.includes("done")) {
    return true;
  }
  return false;
}

function computeChatExecutionMetrics(tasks = [], events = []) {
  const taskRows = Array.isArray(tasks) ? tasks : [];
  const eventRows = Array.isArray(events) ? events : [];
  let active = 0;
  let blocked = 0;
  let doneTodayByTask = 0;
  for (const task of taskRows) {
    if (task && typeof task === "object" && task.archived) {
      continue;
    }
    const status = normalizeTaskStatusValue(task?.status || "planned");
    if (status === "blocked") {
      blocked += 1;
    } else if (status === "in_progress" || status === "review") {
      active += 1;
    }
    if (status === "done" && isSameLocalDay(parseIsoTimeMs(task?.updatedAt || ""))) {
      doneTodayByTask += 1;
    }
  }
  let doneTodayByEvent = 0;
  for (const event of eventRows) {
    const atMs = parseIsoTimeMs(event?.at || "");
    if (!isSameLocalDay(atMs)) {
      continue;
    }
    if (isDoneLedgerEvent(event)) {
      doneTodayByEvent += 1;
    }
  }
  return {
    active,
    blocked,
    doneToday: Math.max(doneTodayByTask, doneTodayByEvent),
    day: buildLocalDayKey()
  };
}

function recordFocusTurnover(type, note = "") {
  ensureFocusTurnoverDay();
  if (type === "adds") {
    chatFocusTurnover.adds += 1;
  } else if (type === "removes") {
    chatFocusTurnover.removes += 1;
  } else if (type === "replacements") {
    chatFocusTurnover.replacements += 1;
  } else if (type === "clears") {
    chatFocusTurnover.clears += 1;
  } else {
    return;
  }
  saveFocusTurnoverState();
  renderFocusTurnoverChip();
  const suffix = note ? ` | ${note}` : "";
  logEvent(`Focus turnover (${chatFocusTurnover.day}): ${focusTurnoverSummary()}${suffix}`);
}

function announceFocusTurnoverSnapshot() {
  ensureFocusTurnoverDay();
  renderFocusTurnoverChip();
  logEvent(`Focus turnover (${chatFocusTurnover.day}): ${focusTurnoverSummary()}`);
}

function normalizeTaskStatusValue(value) {
  return String(value || "planned").trim().toLowerCase();
}

function isTaskStatusDone(value) {
  return normalizeTaskStatusValue(value) === "done";
}

function isTaskStatusActive(value) {
  return !isTaskStatusDone(value);
}

function describeTaskStatusBadge(value) {
  const status = normalizeTaskStatusValue(value);
  if (status === "in_progress") {
    return { label: "In Progress", className: "is-progress" };
  }
  if (status === "blocked") {
    return { label: "Blocked", className: "is-blocked" };
  }
  if (status === "review") {
    return { label: "Ready to Review", className: "is-review" };
  }
  if (status === "done") {
    return { label: "Done ✅", className: "is-done" };
  }
  return { label: "Planned", className: "is-planned" };
}

function sanitizePinnedThreadIds(value) {
  const rows = Array.isArray(value)
    ? value
    : String(value || "")
      .split(/[\n,;]/g)
      .map((item) => item.trim())
      .filter(Boolean);
  return uniqueNonEmptyStrings(rows.map((item) => normalizeChatThreadId(item, "")))
    .filter(Boolean)
    .slice(0, CHAT_FOCUS_MAX_ITEMS);
}

function sanitizeTaskLinkMap(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const output = Object.create(null);
  const entries = Object.entries(source).slice(0, 400);
  for (const [taskIdRaw, chatIdRaw] of entries) {
    const taskId = String(taskIdRaw || "").trim();
    const chatId = normalizeChatThreadId(chatIdRaw, "");
    if (!taskId || !chatId) {
      continue;
    }
    output[taskId] = chatId;
  }
  return output;
}

function sanitizeCloseLoopDismissals(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const output = Object.create(null);
  const entries = Object.entries(source).slice(0, 400);
  for (const [chatIdRaw, atRaw] of entries) {
    const chatId = normalizeChatThreadId(chatIdRaw, "");
    if (!chatId) {
      continue;
    }
    const atMs = parseIsoTimeMs(atRaw);
    if (atMs <= 0) {
      continue;
    }
    output[chatId] = new Date(atMs).toISOString();
  }
  return output;
}

function getTaskLinkedChatId(taskId) {
  const id = String(taskId || "").trim();
  if (!id) {
    return "";
  }
  return normalizeChatThreadId(chatTaskLinks[id] || "", "");
}

function setTaskLinkedChatId(taskId, chatId) {
  const task = String(taskId || "").trim();
  const chat = normalizeChatThreadId(chatId, "");
  if (!task || !chat) {
    return;
  }
  chatTaskLinks[task] = chat;
  saveChatWorkspaceState();
}

function isChatThreadPinned(threadId) {
  const id = normalizeChatThreadId(threadId, "");
  return Boolean(id) && chatPinnedThreadIds.includes(id);
}

function getChatThreadTitleById(threadId) {
  const id = normalizeChatThreadId(threadId, "");
  if (!id) {
    return "Conversation";
  }
  const thread = chatThreads.find((item) => item.id === id);
  return buildChatThreadTitle(thread?.title || "", id === DEFAULT_CHAT_THREAD_ID ? DEFAULT_CHAT_THREAD_TITLE : "Conversation");
}

function requestFocusReplacementCandidate(nextThreadId) {
  const focusItems = chatPinnedThreadIds
    .map((chatId) => normalizeChatThreadId(chatId, ""))
    .filter((chatId) => chatThreads.some((thread) => thread.id === chatId))
    .slice(0, CHAT_FOCUS_MAX_ITEMS);
  if (focusItems.length < CHAT_FOCUS_MAX_ITEMS) {
    return "";
  }
  const rows = focusItems.map((chatId, index) => `${index + 1}) ${getChatThreadTitleById(chatId)}`);
  const answer = window.prompt(
    `Focus is full. Replace an existing priority?\n${rows.join("\n")}\n\nEnter 1-${focusItems.length} (or leave blank to cancel):`,
    "1"
  );
  if (answer === null) {
    return "";
  }
  const wanted = Number.parseInt(String(answer || "").trim(), 10);
  if (!Number.isInteger(wanted) || wanted < 1 || wanted > focusItems.length) {
    logEvent("Focus unchanged: invalid replacement selection.");
    return "";
  }
  const replaceId = focusItems[wanted - 1];
  if (!replaceId || normalizeChatThreadId(replaceId, "") === normalizeChatThreadId(nextThreadId, "")) {
    return "";
  }
  return replaceId;
}

function togglePinnedChatThread(threadId) {
  const id = normalizeChatThreadId(threadId, "");
  if (!id) return;
  if (isChatThreadPinned(id)) {
    chatPinnedThreadIds = chatPinnedThreadIds.filter((item) => item !== id);
    recordFocusTurnover("removes", `Removed: ${getChatThreadTitleById(id)}`);
  } else {
    const existing = chatPinnedThreadIds.filter((item) => chatThreads.some((thread) => thread.id === item));
    if (existing.length >= CHAT_FOCUS_MAX_ITEMS) {
      const replaceId = requestFocusReplacementCandidate(id);
      if (!replaceId) {
        return;
      }
      chatPinnedThreadIds = existing.map((item) => (item === replaceId ? id : item));
      logEvent(`Focus updated: replaced "${getChatThreadTitleById(replaceId)}" with "${getChatThreadTitleById(id)}".`);
      recordFocusTurnover("replacements", `Replaced: ${getChatThreadTitleById(replaceId)} -> ${getChatThreadTitleById(id)}`);
    } else {
      chatPinnedThreadIds = uniqueNonEmptyStrings([id, ...existing]).slice(0, CHAT_FOCUS_MAX_ITEMS);
      recordFocusTurnover("adds", `Added: ${getChatThreadTitleById(id)}`);
    }
  }
  saveChatWorkspaceState();
  renderChatThreadList();
}

function clearFocusThreads() {
  const existing = chatPinnedThreadIds.filter((item) => chatThreads.some((thread) => thread.id === item));
  if (existing.length < 1) {
    logEvent("Focus already clear.");
    return;
  }
  chatPinnedThreadIds = [];
  recordFocusTurnover("clears", `Cleared ${existing.length} focus item(s).`);
  saveChatWorkspaceState();
  renderChatThreadList();
}

function formatThreadUpdatedAt(value) {
  const parsed = new Date(value || "");
  if (!Number.isFinite(parsed.getTime())) {
    return "n/a";
  }
  return parsed.toLocaleTimeString();
}

function createChatThread(id, title) {
  const now = new Date().toISOString();
  const chatId = normalizeChatThreadId(id, DEFAULT_CHAT_THREAD_ID);
  return {
    id: chatId,
    title: buildChatThreadTitle(title, chatId === DEFAULT_CHAT_THREAD_ID ? DEFAULT_CHAT_THREAD_TITLE : "New Chat"),
    createdAt: now,
    updatedAt: now,
    preview: "",
    totalTurns: 0
  };
}

function sortChatThreads() {
  chatThreads.sort((a, b) => {
    const left = new Date(String(a?.updatedAt || 0)).getTime();
    const right = new Date(String(b?.updatedAt || 0)).getTime();
    if (left !== right) return right - left;
    return String(a?.id || "").localeCompare(String(b?.id || ""));
  });
}

function upsertChatThread(thread = {}) {
  const id = normalizeChatThreadId(thread.id || thread.chatId || "", DEFAULT_CHAT_THREAD_ID);
  const existing = chatThreads.find((item) => item.id === id);
  const preserveExistingTitle = Boolean(thread._fromServer && existing && String(existing.title || "").trim());
  const next = {
    id,
    title: preserveExistingTitle
      ? String(existing.title || "").trim()
      : buildChatThreadTitle(
        thread.title,
        id === DEFAULT_CHAT_THREAD_ID ? DEFAULT_CHAT_THREAD_TITLE : "New Chat"
      ),
    createdAt: String(thread.createdAt || existing?.createdAt || new Date().toISOString()),
    updatedAt: String(thread.updatedAt || existing?.updatedAt || new Date().toISOString()),
    preview: String(thread.preview || existing?.preview || "").trim(),
    totalTurns: Math.max(0, Number(thread.totalTurns ?? existing?.totalTurns ?? 0))
  };
  if (existing) {
    Object.assign(existing, next);
  } else {
    chatThreads.push(next);
  }
  sortChatThreads();
  return chatThreads.find((item) => item.id === id) || next;
}

function ensureChatWorkspace() {
  if (!chatThreads.some((item) => item.id === DEFAULT_CHAT_THREAD_ID)) {
    chatThreads.push(createChatThread(DEFAULT_CHAT_THREAD_ID, DEFAULT_CHAT_THREAD_TITLE));
  }
  chatPinnedThreadIds = sanitizePinnedThreadIds(chatPinnedThreadIds)
    .filter((id) => chatThreads.some((thread) => thread.id === id));
  const sanitizedLinks = sanitizeTaskLinkMap(chatTaskLinks);
  for (const [taskId, chatId] of Object.entries(sanitizedLinks)) {
    if (!chatThreads.some((thread) => thread.id === chatId)) {
      delete sanitizedLinks[taskId];
    }
  }
  chatTaskLinks = sanitizedLinks;
  const sanitizedDismissals = sanitizeCloseLoopDismissals(chatCloseLoopDismissals);
  for (const chatId of Object.keys(sanitizedDismissals)) {
    if (!chatThreads.some((thread) => thread.id === chatId)) {
      delete sanitizedDismissals[chatId];
    }
  }
  chatCloseLoopDismissals = sanitizedDismissals;
  sortChatThreads();
  activeChatThreadId = normalizeChatThreadId(activeChatThreadId, DEFAULT_CHAT_THREAD_ID);
  if (!chatThreads.some((item) => item.id === activeChatThreadId)) {
    activeChatThreadId = chatThreads[0]?.id || DEFAULT_CHAT_THREAD_ID;
  }
}

function saveChatWorkspaceState() {
  try {
    const payload = chatThreads.map((thread) => ({
      id: normalizeChatThreadId(thread.id, DEFAULT_CHAT_THREAD_ID),
      title: buildChatThreadTitle(thread.title, "New Chat"),
      createdAt: String(thread.createdAt || ""),
      updatedAt: String(thread.updatedAt || ""),
      preview: String(thread.preview || ""),
      totalTurns: Math.max(0, Number(thread.totalTurns || 0))
    }));
    localStorage.setItem(CHAT_THREADS_STORAGE_KEY, JSON.stringify(payload));
    localStorage.setItem(CHAT_ACTIVE_THREAD_STORAGE_KEY, activeChatThreadId);
    localStorage.setItem(CHAT_ROUTE_MODE_STORAGE_KEY, chatRouteMode);
    localStorage.setItem(CHAT_PINNED_THREADS_STORAGE_KEY, JSON.stringify(chatPinnedThreadIds));
    localStorage.setItem(CHAT_RAIL_SECTION_STORAGE_KEY, chatRailSection);
    localStorage.setItem(CHAT_TASK_LINKS_STORAGE_KEY, JSON.stringify(chatTaskLinks));
    localStorage.setItem(CHAT_CLOSE_LOOP_DISMISSALS_STORAGE_KEY, JSON.stringify(chatCloseLoopDismissals));
  } catch {}
}

function loadChatWorkspaceState() {
  try {
    const raw = localStorage.getItem(CHAT_THREADS_STORAGE_KEY) || "";
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      chatThreads = parsed
        .map((entry) => {
          const id = normalizeChatThreadId(entry?.id || entry?.chatId || "", "");
          if (!id) return null;
          return {
            id,
            title: buildChatThreadTitle(entry?.title || "", id === DEFAULT_CHAT_THREAD_ID ? DEFAULT_CHAT_THREAD_TITLE : "New Chat"),
            createdAt: String(entry?.createdAt || ""),
            updatedAt: String(entry?.updatedAt || ""),
            preview: String(entry?.preview || ""),
            totalTurns: Math.max(0, Number(entry?.totalTurns || 0))
          };
        })
        .filter(Boolean);
    }
  } catch {
    chatThreads = [];
  }
  try {
    activeChatThreadId = normalizeChatThreadId(
      localStorage.getItem(CHAT_ACTIVE_THREAD_STORAGE_KEY) || DEFAULT_CHAT_THREAD_ID,
      DEFAULT_CHAT_THREAD_ID
    );
  } catch {
    activeChatThreadId = DEFAULT_CHAT_THREAD_ID;
  }
  try {
    chatRouteMode = normalizeChatRouteMode(localStorage.getItem(CHAT_ROUTE_MODE_STORAGE_KEY) || "normal");
  } catch {
    chatRouteMode = "normal";
  }
  try {
    const rawPinned = localStorage.getItem(CHAT_PINNED_THREADS_STORAGE_KEY) || "[]";
    chatPinnedThreadIds = sanitizePinnedThreadIds(JSON.parse(rawPinned));
  } catch {
    chatPinnedThreadIds = [];
  }
  try {
    const rawTaskLinks = localStorage.getItem(CHAT_TASK_LINKS_STORAGE_KEY) || "{}";
    chatTaskLinks = sanitizeTaskLinkMap(JSON.parse(rawTaskLinks));
  } catch {
    chatTaskLinks = Object.create(null);
  }
  try {
    const rawCloseLoopDismissals = localStorage.getItem(CHAT_CLOSE_LOOP_DISMISSALS_STORAGE_KEY) || "{}";
    chatCloseLoopDismissals = sanitizeCloseLoopDismissals(JSON.parse(rawCloseLoopDismissals));
  } catch {
    chatCloseLoopDismissals = Object.create(null);
  }
  try {
    chatRailSection = normalizeChatRailSection(localStorage.getItem(CHAT_RAIL_SECTION_STORAGE_KEY) || "chats");
  } catch {
    chatRailSection = "chats";
  }
  ensureChatWorkspace();
  if (chatRouteModeSelect) {
    chatRouteModeSelect.value = chatRouteMode;
  }
  applyChatRailSection(chatRailSection, { persist: false });
}

function applyChatRailSection(section, options = {}) {
  chatRailSection = normalizeChatRailSection(section);
  const sections = [chatRailAppsSection, chatRailTasksSection, chatRailChatsSection];
  for (const panel of sections) {
    if (!panel) continue;
    const panelName = normalizeChatRailSection(panel.dataset.chatRailSection || "");
    panel.classList.toggle("is-hidden", panelName !== chatRailSection);
  }
  if (chatRailNav) {
    const buttons = Array.from(chatRailNav.querySelectorAll(".chat-rail-nav-btn[data-chat-rail]"));
    for (const button of buttons) {
      const targetSection = normalizeChatRailSection(button.dataset.chatRail || "");
      button.classList.toggle("active", targetSection === chatRailSection);
    }
  }
  if (options.persist !== false) {
    saveChatWorkspaceState();
  }
}

function formatTurnMeta(turn = {}) {
  const role = String(turn.role || "").toLowerCase();
  const roleLabel = role === "user" ? "You" : "Asolaria";
  const at = turn.at ? new Date(turn.at) : null;
  const timeLabel = at && Number.isFinite(at.getTime()) ? at.toLocaleTimeString() : "";
  return timeLabel ? `${roleLabel} · ${timeLabel}` : roleLabel;
}

function mapTurnRoleToMessageRole(turn = {}) {
  return String(turn.role || "").toLowerCase() === "user" ? "user" : "brain";
}

function summarizeThreadFromTurns(threadId) {
  const id = normalizeChatThreadId(threadId, DEFAULT_CHAT_THREAD_ID);
  const turns = Array.isArray(chatTurnsByThread[id]) ? chatTurnsByThread[id] : [];
  const lastTurn = turns.length > 0 ? turns[turns.length - 1] : null;
  const thread = upsertChatThread({
    id,
    totalTurns: turns.length,
    updatedAt: String(lastTurn?.at || new Date().toISOString()),
    preview: String(lastTurn?.text || "").replace(/\s+/g, " ").trim().slice(0, 120)
  });
  if (thread.id !== DEFAULT_CHAT_THREAD_ID && !thread.title) {
    const firstUser = turns.find((turn) => String(turn.role || "").toLowerCase() === "user");
    thread.title = buildChatThreadTitle(firstUser?.text || "", "New Chat");
  }
  sortChatThreads();
}

function setThreadTurns(threadId, turns = []) {
  const id = normalizeChatThreadId(threadId, DEFAULT_CHAT_THREAD_ID);
  chatTurnsByThread[id] = Array.isArray(turns)
    ? turns
      .map((turn) => {
        const role = String(turn?.role || "").toLowerCase() === "user" ? "user" : "assistant";
        return {
          role,
          text: String(turn?.text || ""),
          at: String(turn?.at || ""),
          meta: turn?.meta && typeof turn.meta === "object" ? turn.meta : {}
        };
      })
      .filter((turn) => turn.text || turn.role === "assistant")
    : [];
  summarizeThreadFromTurns(id);
  saveChatWorkspaceState();
  renderChatThreadList();
}

function appendTurnToThread(threadId, turn = {}) {
  const id = normalizeChatThreadId(threadId, DEFAULT_CHAT_THREAD_ID);
  if (!Array.isArray(chatTurnsByThread[id])) {
    chatTurnsByThread[id] = [];
  }
  const role = String(turn.role || "").toLowerCase() === "user" ? "user" : "assistant";
  const text = String(turn.text || "");
  if (!text.trim()) {
    return null;
  }
  const row = {
    role,
    text,
    at: String(turn.at || new Date().toISOString()),
    meta: turn.meta && typeof turn.meta === "object" ? turn.meta : {}
  };
  chatTurnsByThread[id].push(row);
  if (chatTurnsByThread[id].length > 500) {
    chatTurnsByThread[id].splice(0, chatTurnsByThread[id].length - 500);
  }
  summarizeThreadFromTurns(id);
  saveChatWorkspaceState();
  renderChatThreadList();
  return row;
}

function buildThreadSearchQuery() {
  return String(chatThreadSearch?.value || "").trim().toLowerCase();
}

function buildTaskLinkInfo(taskIdValue, chatIdValue) {
  const taskId = String(taskIdValue || "").trim();
  const chatId = normalizeChatThreadId(chatIdValue, "");
  if (!taskId || !chatId) {
    return null;
  }
  const task = getTaskById(taskId);
  const status = normalizeTaskStatusValue(task?.status || "planned");
  const statusBadge = describeTaskStatusBadge(status);
  const taskTitle = buildChatThreadTitle(String(task?.title || ""), `Task ${taskId}`);
  return {
    taskId,
    chatId,
    taskTitle,
    status,
    statusLabel: statusBadge.label,
    statusClassName: statusBadge.className,
    isKnownTask: Boolean(task),
    isActiveTask: task ? (isTaskStatusActive(status) && !Boolean(task.archived)) : true,
    updatedMs: parseIsoTimeMs(task?.updatedAt || "")
  };
}

function buildLinkedTaskInfoByChatId() {
  const byChatId = new Map();
  for (const [taskId, linkedChatId] of Object.entries(chatTaskLinks || {})) {
    const info = buildTaskLinkInfo(taskId, linkedChatId);
    if (!info) {
      continue;
    }
    const existing = byChatId.get(info.chatId);
    if (!existing) {
      byChatId.set(info.chatId, info);
      continue;
    }
    if (info.isActiveTask && !existing.isActiveTask) {
      byChatId.set(info.chatId, info);
      continue;
    }
    if (info.isKnownTask && !existing.isKnownTask) {
      byChatId.set(info.chatId, info);
      continue;
    }
    if (info.updatedMs > existing.updatedMs) {
      byChatId.set(info.chatId, info);
    }
  }
  return byChatId;
}

function setCloseLoopDismissed(chatId, at = new Date().toISOString()) {
  const id = normalizeChatThreadId(chatId, "");
  if (!id) {
    return;
  }
  const atMs = parseIsoTimeMs(at);
  if (atMs <= 0) {
    return;
  }
  chatCloseLoopDismissals[id] = new Date(atMs).toISOString();
  saveChatWorkspaceState();
}

function clearCloseLoopDismissed(chatId) {
  const id = normalizeChatThreadId(chatId, "");
  if (!id) {
    return;
  }
  if (chatCloseLoopDismissals[id]) {
    delete chatCloseLoopDismissals[id];
    saveChatWorkspaceState();
  }
}

function promptAndLinkChatToTask(chatId, options = {}) {
  const id = normalizeChatThreadId(chatId, "");
  if (!id) {
    return;
  }
  const linkedTaskInfoByChatId = buildLinkedTaskInfoByChatId();
  const linkedTask = linkedTaskInfoByChatId.get(id) || null;
  const suggestedTaskId = String(options.taskId || linkedTask?.taskId || "").trim();
  const promptText = options.relink
    ? "Relink conversation to task ID:"
    : "Link conversation to task ID:";
  const answer = window.prompt(promptText, suggestedTaskId);
  if (answer === null) {
    return;
  }
  const taskId = String(answer || "").trim();
  if (!taskId) {
    logEvent("Task link skipped: missing task ID.");
    return;
  }
  setTaskLinkedChatId(taskId, id);
  clearCloseLoopDismissed(id);
  const task = getTaskById(taskId);
  const taskLabel = task ? buildChatThreadTitle(task.title || "", `Task ${taskId}`) : `Task ${taskId}`;
  logEvent(`Conversation linked to ${taskLabel}.`);
  renderChatRailTasks();
  renderChatThreadList();
}

function buildChatThreadCard(thread, options = {}) {
  const row = document.createElement("div");
  row.className = "chat-thread-card";
  const threadId = normalizeChatThreadId(thread?.id || "", DEFAULT_CHAT_THREAD_ID);
  row.dataset.chatId = threadId;
  const pinned = isChatThreadPinned(threadId);
  if (threadId === activeChatThreadId) {
    row.classList.add("is-active");
  }
  if (pinned) {
    row.classList.add("is-pinned");
  }

  const top = document.createElement("div");
  top.className = "chat-thread-card-top";

  const openBtn = document.createElement("button");
  openBtn.type = "button";
  openBtn.className = "chat-thread-open";
  openBtn.dataset.action = "open-chat-thread";
  openBtn.dataset.chatId = threadId;
  openBtn.textContent = buildChatThreadTitle(
    String(thread?.title || ""),
    threadId === DEFAULT_CHAT_THREAD_ID ? DEFAULT_CHAT_THREAD_TITLE : "New Chat"
  );

  const pinBtn = document.createElement("button");
  pinBtn.type = "button";
  pinBtn.className = "chat-thread-pin";
  pinBtn.dataset.action = "toggle-chat-pin";
  pinBtn.dataset.chatId = threadId;
  pinBtn.textContent = pinned ? "Remove Focus" : "Add to Focus";
  if (pinned) {
    pinBtn.classList.add("is-pinned");
  }

  top.appendChild(openBtn);
  top.appendChild(pinBtn);
  row.appendChild(top);

  const preview = document.createElement("div");
  preview.className = "chat-thread-preview";
  preview.textContent = String(thread?.preview || "").trim() || "No messages yet.";
  row.appendChild(preview);

  const linkedTaskInfoByChatId = options.linkedTaskInfoByChatId instanceof Map
    ? options.linkedTaskInfoByChatId
    : null;
  const linkedTaskInfo = linkedTaskInfoByChatId ? linkedTaskInfoByChatId.get(threadId) : null;
  if (linkedTaskInfo) {
    const contextRow = document.createElement("div");
    contextRow.className = "chat-thread-context-row";

    const contextBtn = document.createElement("button");
    contextBtn.type = "button";
    contextBtn.className = "chat-thread-context";
    contextBtn.dataset.action = "open-linked-task";
    contextBtn.dataset.chatId = threadId;
    contextBtn.dataset.taskId = linkedTaskInfo.taskId;
    contextBtn.textContent = `Connected to Task: ${linkedTaskInfo.taskTitle}`;
    contextRow.appendChild(contextBtn);

    const statusBadge = document.createElement("span");
    statusBadge.className = `chat-task-state ${linkedTaskInfo.statusClassName}`;
    statusBadge.textContent = linkedTaskInfo.statusLabel;
    contextRow.appendChild(statusBadge);
    row.appendChild(contextRow);
  }

  if (options.searchMode === true) {
    const searchActions = document.createElement("div");
    searchActions.className = "chat-thread-search-actions";

    const jumpBtn = document.createElement("button");
    jumpBtn.type = "button";
    jumpBtn.className = "chat-thread-context is-primary";
    jumpBtn.dataset.action = "open-chat-thread";
    jumpBtn.dataset.chatId = threadId;
    jumpBtn.textContent = "Jump back in";
    searchActions.appendChild(jumpBtn);

    const continueBtn = document.createElement("button");
    continueBtn.type = "button";
    continueBtn.className = "chat-thread-context";
    continueBtn.dataset.action = "open-chat-thread";
    continueBtn.dataset.chatId = threadId;
    continueBtn.textContent = "Continue";
    searchActions.appendChild(continueBtn);

    const focusBtn = document.createElement("button");
    focusBtn.type = "button";
    focusBtn.className = pinned ? "chat-thread-context" : "chat-thread-context is-primary";
    focusBtn.dataset.action = "toggle-chat-pin";
    focusBtn.dataset.chatId = threadId;
    focusBtn.textContent = pinned ? "Remove Focus" : "Bring to Focus";
    searchActions.appendChild(focusBtn);

    const linkBtn = document.createElement("button");
    linkBtn.type = "button";
    linkBtn.className = "chat-thread-context";
    linkBtn.dataset.action = linkedTaskInfo ? "relink-chat-task" : "link-chat-task";
    linkBtn.dataset.chatId = threadId;
    if (linkedTaskInfo) {
      linkBtn.dataset.taskId = linkedTaskInfo.taskId;
    }
    linkBtn.textContent = linkedTaskInfo ? "Relink" : "Link to Task";
    searchActions.appendChild(linkBtn);

    row.appendChild(searchActions);
  }

  const meta = document.createElement("div");
  meta.className = "chat-thread-meta";
  const turns = Math.max(0, Number(thread?.totalTurns || 0));
  meta.textContent = `Turns: ${turns} • Updated: ${formatThreadUpdatedAt(thread?.updatedAt || "")}`;
  row.appendChild(meta);

  if (options.pinnedOnly === true) {
    row.title = `Focus chat: ${openBtn.textContent}`;
  }

  return row;
}

function renderChatThreadCards(container, rows = [], emptyText = "No chats yet.", options = {}) {
  if (!container) {
    return;
  }
  container.innerHTML = "";
  if (!Array.isArray(rows) || rows.length < 1) {
    const empty = document.createElement("div");
    empty.className = "chat-thread-preview";
    empty.textContent = emptyText;
    container.appendChild(empty);
    return;
  }
  for (const thread of rows) {
    container.appendChild(buildChatThreadCard(thread, options));
  }
}

function isSameLocalDay(leftMs, rightMs = Date.now()) {
  if (!Number.isFinite(leftMs) || leftMs <= 0 || !Number.isFinite(rightMs) || rightMs <= 0) {
    return false;
  }
  const left = new Date(leftMs);
  const right = new Date(rightMs);
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

function deriveNextActionState(linkedTaskInfoByChatId = new Map()) {
  const tooltip = "We surface what seems most relevant based on your recent activity.";
  const activeLinkedTask = linkedTaskInfoByChatId.get(activeChatThreadId);
  if (activeLinkedTask && activeLinkedTask.isActiveTask) {
    return {
      type: "task",
      chatId: activeChatThreadId,
      taskId: activeLinkedTask.taskId,
      subtitle: `Continue: ${activeLinkedTask.taskTitle}`,
      primaryLabel: "Continue",
      reason: "Linked to your active task",
      tooltip
    };
  }

  let bestTaskAction = null;
  let bestTaskMs = -1;
  for (const [chatId, info] of linkedTaskInfoByChatId.entries()) {
    if (!info.isActiveTask) {
      continue;
    }
    const thread = chatThreads.find((item) => item.id === chatId);
    if (!thread) {
      continue;
    }
    const updatedMs = parseIsoTimeMs(thread.updatedAt || "");
    if (updatedMs > bestTaskMs) {
      bestTaskMs = updatedMs;
      bestTaskAction = {
        type: "task",
        chatId,
        taskId: info.taskId,
        subtitle: `Continue: ${info.taskTitle}`,
        primaryLabel: "Continue",
        reason: info.status === "in_progress" ? "Still marked In Progress" : "Most recently edited",
        tooltip
      };
    }
  }
  if (bestTaskAction) {
    return bestTaskAction;
  }

  let bestDoneAction = null;
  let bestDoneMs = -1;
  for (const [chatId, info] of linkedTaskInfoByChatId.entries()) {
    if (normalizeTaskStatusValue(info.status) !== "done") {
      continue;
    }
    const thread = chatThreads.find((item) => item.id === chatId);
    if (!thread) {
      continue;
    }
    const threadUpdatedMs = parseIsoTimeMs(thread.updatedAt || "");
    const taskUpdatedMs = Number.isFinite(Number(info.updatedMs)) ? Number(info.updatedMs) : 0;
    const updatedMs = Math.max(threadUpdatedMs, taskUpdatedMs);
    if (!isSameLocalDay(updatedMs)) {
      continue;
    }
    if (updatedMs > bestDoneMs) {
      bestDoneMs = updatedMs;
      bestDoneAction = {
        type: "review",
        chatId,
        taskId: info.taskId,
        subtitle: `Review: ${info.taskTitle}`,
        primaryLabel: "Review",
        reason: "Completed today",
        tooltip
      };
    }
  }
  if (bestDoneAction) {
    return bestDoneAction;
  }

  const activeThread = chatThreads.find((thread) => thread.id === activeChatThreadId) || null;
  if (activeThread && isChatThreadPinned(activeThread.id)) {
    const updatedMs = parseIsoTimeMs(activeThread.updatedAt || "");
    return {
      type: "focus",
      chatId: activeThread.id,
      taskId: "",
      subtitle: `Resume focus: ${buildChatThreadTitle(activeThread.title || "", DEFAULT_CHAT_THREAD_TITLE)}`,
      primaryLabel: "Continue",
      reason: isSameLocalDay(updatedMs) ? "Because you worked on this today" : "Most recently edited",
      tooltip
    };
  }

  const topFocusId = chatPinnedThreadIds.find((chatId) => chatThreads.some((thread) => thread.id === chatId)) || "";
  if (topFocusId) {
    const focusThread = chatThreads.find((thread) => thread.id === topFocusId) || null;
    const updatedMs = parseIsoTimeMs(focusThread?.updatedAt || "");
    return {
      type: "focus",
      chatId: topFocusId,
      taskId: "",
      subtitle: `Resume focus: ${buildChatThreadTitle(focusThread?.title || "", "Conversation")}`,
      primaryLabel: "Continue",
      reason: isSameLocalDay(updatedMs) ? "Because you worked on this today" : "Most recently edited",
      tooltip
    };
  }

  return {
    type: "start_new",
    chatId: "",
    taskId: "",
    subtitle: "Start something new",
    primaryLabel: "Start new",
    reason: "No active task yet",
    tooltip
  };
}

function renderNextActionStrip(linkedTaskInfoByChatId = new Map()) {
  if (!nextActionStrip || !nextActionSubtitle || !nextActionPrimaryBtn || !nextActionSecondaryBtn || !nextActionReason) {
    return;
  }
  nextActionState = deriveNextActionState(linkedTaskInfoByChatId);
  nextActionSubtitle.textContent = nextActionState.subtitle;
  nextActionReason.textContent = nextActionState.reason || "Because you worked on this today";
  nextActionStrip.title = nextActionState.tooltip || "We surface what seems most relevant based on your recent activity.";
  nextActionPrimaryBtn.textContent = nextActionState.primaryLabel || "Continue";
  nextActionSecondaryBtn.textContent = "Start new";
  nextActionStrip.classList.toggle("is-default", nextActionState.type === "start_new");
  recordNextActionExposure(nextActionState);
}

function hideCloseLoopToast() {
  if (closeLoopToastTimer) {
    window.clearTimeout(closeLoopToastTimer);
    closeLoopToastTimer = 0;
  }
  if (closeLoopToast) {
    closeLoopToast.hidden = true;
  }
}

function showCloseLoopDoneToast(taskId, chatId) {
  if (!closeLoopToast || !closeLoopToastText || !closeLoopToastReopenBtn) {
    return;
  }
  const id = String(taskId || "").trim();
  if (!id) {
    return;
  }
  closeLoopToastState = {
    taskId: id,
    chatId: normalizeChatThreadId(chatId, "")
  };
  closeLoopToastText.textContent = "✅ Resolved as done. You can reopen anytime.";
  closeLoopToastReopenBtn.disabled = false;
  closeLoopToast.hidden = false;
  if (closeLoopToastTimer) {
    window.clearTimeout(closeLoopToastTimer);
  }
  closeLoopToastTimer = window.setTimeout(() => {
    hideCloseLoopToast();
  }, 3000);
}

function renderCloseLoopPrompt(linkedTaskInfoByChatId = new Map()) {
  if (!closeLoopPrompt || !closeLoopText || !closeLoopMarkDoneBtn || !closeLoopResumeBtn) {
    return;
  }
  closeLoopPrompt.hidden = true;
  closeLoopMarkDoneBtn.disabled = false;
  closeLoopResumeBtn.disabled = false;
  closeLoopMarkDoneBtn.dataset.chatId = "";
  closeLoopMarkDoneBtn.dataset.taskId = "";
  closeLoopResumeBtn.dataset.chatId = "";

  const activeThread = chatThreads.find((thread) => thread.id === activeChatThreadId) || null;
  if (!activeThread) {
    return;
  }
  const linkedTaskInfo = linkedTaskInfoByChatId.get(activeThread.id);
  if (!linkedTaskInfo || !linkedTaskInfo.isActiveTask) {
    return;
  }
  const updatedMs = parseIsoTimeMs(activeThread.updatedAt || "");
  if (updatedMs <= 0) {
    return;
  }
  const nowMs = Date.now();
  if (nowMs - updatedMs < CHAT_CLOSE_LOOP_INACTIVE_MS) {
    return;
  }
  const dismissedAtMs = parseIsoTimeMs(chatCloseLoopDismissals[activeThread.id] || "");
  if (dismissedAtMs >= updatedMs) {
    return;
  }

  const taskLabel = buildChatThreadTitle(linkedTaskInfo.taskTitle || "", `Task ${linkedTaskInfo.taskId}`);
  closeLoopText.textContent = `${taskLabel} has been inactive for 48+ hours. Resolve this or continue working?`;
  closeLoopMarkDoneBtn.dataset.chatId = activeThread.id;
  closeLoopMarkDoneBtn.dataset.taskId = linkedTaskInfo.taskId;
  closeLoopResumeBtn.dataset.chatId = activeThread.id;
  closeLoopPrompt.hidden = false;
}

function renderChatThreadList() {
  if (!chatThreadList || !chatPinnedThreadList) {
    return;
  }
  ensureChatWorkspace();
  const linkedTaskInfoByChatId = buildLinkedTaskInfoByChatId();
  const query = buildThreadSearchQuery();
  const filtered = chatThreads.filter((thread) => {
    if (!query) return true;
    const haystack = `${thread.title || ""} ${thread.preview || ""}`.toLowerCase();
    return haystack.includes(query);
  });
  const nowMs = Date.now();
  const pinnedRows = filtered.filter((thread) => isChatThreadPinned(thread.id));
  const recentRows = filtered.filter((thread) => {
    if (isChatThreadPinned(thread.id)) {
      return false;
    }
    const updatedMs = parseIsoTimeMs(thread.updatedAt || "");
    return updatedMs > 0 && nowMs - updatedMs <= CHAT_RECENTLY_ACTIVE_WINDOW_MS;
  }).slice(0, CHAT_RECENTLY_ACTIVE_MAX_ITEMS);
  const normalRows = filtered.filter((thread) => !isChatThreadPinned(thread.id));
  renderChatThreadCards(
    chatPinnedThreadList,
    pinnedRows,
    "Your current priorities. Limited to 3.",
    { pinnedOnly: true, linkedTaskInfoByChatId, searchMode: Boolean(query) }
  );
  if (chatRecentlyActiveThreadList) {
    renderChatThreadCards(
      chatRecentlyActiveThreadList,
      recentRows,
      "No activity in the last 24 hours.",
      { linkedTaskInfoByChatId, searchMode: Boolean(query) }
    );
  }
  renderChatThreadCards(
    chatThreadList,
    normalRows,
    query ? "No matching conversations." : "No conversations yet.",
    { linkedTaskInfoByChatId, searchMode: Boolean(query) }
  );
  const active = chatThreads.find((thread) => thread.id === activeChatThreadId) || chatThreads[0];
  if (chatActiveThreadHint) {
    chatActiveThreadHint.textContent = active?.title || DEFAULT_CHAT_THREAD_TITLE;
  }
  renderNextActionStrip(linkedTaskInfoByChatId);
  renderCloseLoopPrompt(linkedTaskInfoByChatId);
  renderChatExecutionChip();
  renderChatSafetyMetricsChip();
  renderFocusTurnoverChip();
}

function getChatRailTaskScope() {
  const scope = getActiveProjectScope();
  const scopeId = String(scope?.id || "").trim();
  if (!scopeId || scopeId === "all") {
    return "";
  }
  return scopeId;
}

function renderChatRailTasks() {
  if (!chatTaskCardList) {
    return;
  }
  const query = String(chatTaskSearch?.value || "").trim().toLowerCase();
  const rows = Array.isArray(chatRailTasks) ? chatRailTasks : [];
  const filtered = rows.filter((task) => {
    if (!query) return true;
    const haystack = `${task.title || ""} ${task.description || ""}`.toLowerCase();
    return haystack.includes(query);
  });

  chatTaskCardList.innerHTML = "";
  if (filtered.length < 1) {
    const empty = document.createElement("div");
    empty.className = "chat-thread-preview";
    empty.textContent = "No tasks found.";
    chatTaskCardList.appendChild(empty);
    return;
  }

  for (const task of filtered) {
    const card = document.createElement("div");
    card.className = "chat-task-card";
    card.dataset.taskId = String(task.id || "");

    const title = document.createElement("div");
    title.className = "chat-task-title";
    title.textContent = String(task.title || task.id || "Task");
    card.appendChild(title);

    const meta = document.createElement("div");
    meta.className = "chat-task-meta";
    const status = String(task.status || "planned");
    const priority = String(task.priority || "normal");
    const linkedChatId = getTaskLinkedChatId(task.id);
    meta.textContent = `${status} • ${priority}${linkedChatId ? " • linked" : " • unlinked"}`;
    card.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "chat-task-actions";

    const openConversationBtn = document.createElement("button");
    openConversationBtn.type = "button";
    openConversationBtn.className = "chat-task-open is-primary";
    openConversationBtn.dataset.action = "task-open-chat";
    openConversationBtn.dataset.taskId = String(task.id || "");
    openConversationBtn.textContent = linkedChatId ? "Open linked conversation" : "Start conversation";
    actions.appendChild(openConversationBtn);

    const useInChatBtn = document.createElement("button");
    useInChatBtn.type = "button";
    useInChatBtn.className = "chat-task-open";
    useInChatBtn.dataset.action = "task-to-chat";
    useInChatBtn.dataset.taskId = String(task.id || "");
    useInChatBtn.textContent = "Use in chat";
    actions.appendChild(useInChatBtn);

    card.appendChild(actions);

    chatTaskCardList.appendChild(card);
  }
}

async function refreshChatRailTasks(options = {}) {
  if (!chatTaskCardList) {
    return;
  }
  const scopeId = getChatRailTaskScope();
  const params = new URLSearchParams();
  params.set("limit", String(Math.max(4, Math.min(40, Number(options.limit) || 12))));
  params.set("includeArchived", "false");
  params.set("status", "all");
  if (scopeId) {
    params.set("projectScope", scopeId);
  }
  const search = String(options.query || "").trim();
  if (search) {
    params.set("q", search);
  }
  try {
    const data = await request(`/api/task-ledger/tasks?${params.toString()}`);
    chatRailTasks = Array.isArray(data.tasks) ? data.tasks.slice(0, 40) : [];
    renderChatRailTasks();
    renderChatThreadList();
  } catch (error) {
    if (!options.silent) {
      logEvent(`Task cards unavailable: ${error.message}`);
    }
    chatRailTasks = [];
    renderChatRailTasks();
    renderChatThreadList();
  }
}

function injectTaskIntoChat(taskId) {
  const wanted = String(taskId || "").trim();
  if (!wanted) return;
  const task = chatRailTasks.find((row) => String(row.id || "").trim() === wanted);
  if (!task) return;
  const title = String(task.title || wanted).trim();
  const desc = String(task.description || "").trim();
  const scoped = [`Focus task #${wanted}: ${title}`];
  if (desc) {
    scoped.push("", desc);
  }
  chatInput.value = scoped.join("\n");
  chatInput.focus();
}

function getTaskById(taskId) {
  const wanted = String(taskId || "").trim();
  if (!wanted) return null;
  return chatRailTasks.find((row) => String(row.id || "").trim() === wanted) || null;
}

function buildTaskConversationSeed(task = {}) {
  const taskId = String(task.id || "").trim();
  const title = buildChatThreadTitle(String(task.title || taskId || "Task"), "Task");
  const description = String(task.description || "").trim();
  const lines = [`Task ${taskId}: ${title}`];
  if (description) {
    lines.push("", description);
  }
  return lines.join("\n");
}

function startOrOpenTaskConversation(taskId) {
  const task = getTaskById(taskId);
  if (!task) {
    return;
  }
  const linked = getTaskLinkedChatId(task.id);
  if (linked && chatThreads.some((thread) => thread.id === linked)) {
    setActiveChatThread(linked, { load: true });
    refreshMemory();
    return;
  }

  const seed = `task-${String(task.id || "").trim().replace(/[^a-z0-9_-]+/gi, "-").toLowerCase()}-${Date.now().toString(36)}`;
  const nextId = normalizeChatThreadId(seed, DEFAULT_CHAT_THREAD_ID);
  const nextTitle = buildChatThreadTitle(String(task.title || "").trim(), "Task Conversation");
  const thread = upsertChatThread(createChatThread(nextId, nextTitle));
  setThreadTurns(thread.id, []);
  setTaskLinkedChatId(task.id, thread.id);
  setActiveChatThread(thread.id, { load: false });
  chatInput.value = buildTaskConversationSeed(task);
  chatInput.focus();
  refreshMemory();
}

function createMessage(role, text, meta) {
  const wrap = document.createElement("div");
  wrap.className = `message ${role}`;

  const head = document.createElement("div");
  head.className = "meta";
  head.textContent = meta;

  const body = document.createElement("div");
  body.textContent = text;

  wrap.appendChild(head);
  wrap.appendChild(body);
  messages.appendChild(wrap);
  messages.scrollTop = messages.scrollHeight;
  return { wrap, head, body };
}

function pushMessage(role, text, meta) {
  createMessage(role, text, meta);
}

function renderActiveChatMessages() {
  if (!messages) {
    return;
  }
  ensureChatWorkspace();
  const id = normalizeChatThreadId(activeChatThreadId, DEFAULT_CHAT_THREAD_ID);
  const turns = Array.isArray(chatTurnsByThread[id]) ? chatTurnsByThread[id] : [];
  messages.innerHTML = "";
  if (turns.length < 1) {
    createMessage("brain", "New chat ready. Ask me anything about your Asolaria task.", "System");
    return;
  }
  for (const turn of turns) {
    createMessage(mapTurnRoleToMessageRole(turn), String(turn.text || ""), formatTurnMeta(turn));
  }
}

async function loadConversationTurns(chatId, options = {}) {
  const id = normalizeChatThreadId(chatId, DEFAULT_CHAT_THREAD_ID);
  const data = await request(`/api/chat/conversations/${encodeURIComponent(id)}?limit=180&clean=true`);
  setThreadTurns(id, Array.isArray(data.turns) ? data.turns : []);
  if (id === activeChatThreadId && options.render !== false) {
    renderActiveChatMessages();
  }
}

async function refreshConversationCatalog(options = {}) {
  const data = await request("/api/chat/conversations?limit=60&clean=true");
  const rows = Array.isArray(data.conversations) ? data.conversations : [];
  for (const row of rows) {
    upsertChatThread({
      id: row.chatId || row.id,
      title: row.title,
      preview: row.preview || row.lastText || "",
      updatedAt: row.updatedAt,
      createdAt: row.createdAt,
      totalTurns: row.totalTurns,
      _fromServer: true
    });
  }
  ensureChatWorkspace();
  if (options.loadActive !== false) {
    await loadConversationTurns(activeChatThreadId, { render: true });
  } else {
    renderChatThreadList();
  }
  renderChatThreadList();
}

function setActiveChatThread(chatId, options = {}) {
  const id = normalizeChatThreadId(chatId, DEFAULT_CHAT_THREAD_ID);
  activeChatThreadId = id;
  ensureChatWorkspace();
  renderChatThreadList();
  saveChatWorkspaceState();
  if (options.load !== false) {
    loadConversationTurns(id, { render: true }).catch((error) => {
      logEvent(`Chat load failed: ${error.message}`);
    });
  } else {
    renderActiveChatMessages();
  }
}

function createNewChatThread() {
  const seed = `chat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const id = normalizeChatThreadId(seed, DEFAULT_CHAT_THREAD_ID);
  const thread = upsertChatThread(createChatThread(id, "New Chat"));
  setThreadTurns(thread.id, []);
  setActiveChatThread(thread.id, { load: false });
  chatInput.focus();
}

function renameActiveChatThread() {
  const current = chatThreads.find((thread) => thread.id === activeChatThreadId);
  if (!current) return;
  const next = window.prompt("Rename chat:", current.title || "New Chat");
  if (next === null) return;
  const title = buildChatThreadTitle(next, current.title || "New Chat");
  upsertChatThread({
    ...current,
    title
  });
  renderChatThreadList();
  saveChatWorkspaceState();
}

function runPrimaryNextAction() {
  const action = nextActionState && typeof nextActionState === "object"
    ? nextActionState
    : { type: "start_new" };
  if (action.type === "task" && action.taskId) {
    startOrOpenTaskConversation(action.taskId);
    return;
  }
  if (action.type === "focus" && action.chatId) {
    setActiveChatThread(action.chatId, { load: true });
    refreshMemory();
    return;
  }
  if (action.type === "review" && action.chatId) {
    setActiveChatThread(action.chatId, { load: true });
    refreshMemory();
    return;
  }
  createNewChatThread();
  refreshMemory();
}

function updateMessageBody(messageRef, text, meta) {
  messageRef.body.textContent = text;
  if (meta) {
    messageRef.head.textContent = meta;
  }
}

async function request(path, options = {}) {
  const requestOptions = { ...options };
  const headers = {
    ...(options && options.headers && typeof options.headers === "object" ? options.headers : {})
  };
  if (!headers["x-asolaria-viewer"] && !headers["X-Asolaria-Viewer"]) {
    headers["x-asolaria-viewer"] = "owner";
  }
  requestOptions.headers = headers;
  const response = await fetch(path, requestOptions);
  const data = await response.json();
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }
  return data;
}

async function apiPost(path, payload) {
  return request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {})
  });
}

async function apiDelete(path, payload) {
  const options = {
    method: "DELETE"
  };
  if (payload !== undefined) {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(payload || {});
  }
  return request(path, options);
}

const FALLBACK_EXTERNAL_MODEL_ALIASES = Object.freeze({
  anthropic: Object.freeze(["opus", "sonnet", "haiku"]),
  gemini: Object.freeze(["gemini-pro", "gemini-flash", "pro", "flash"]),
  cursor: Object.freeze(["opus", "sonnet", "gemini-pro", "gemini-flash"]),
  antigravity: Object.freeze([])
});

function uniqueNonEmptyStrings(values) {
  const seen = new Set();
  const output = [];
  for (const value of Array.isArray(values) ? values : []) {
    const text = String(value || "").trim();
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(text);
  }
  return output;
}

function normalizeExternalProviderId(value) {
  const provider = String(value || "").trim().toLowerCase();
  if (provider === "cursor" || provider === "antigravity" || provider === "anthropic" || provider === "gemini") {
    return provider;
  }
  return "anthropic";
}

function normalizeExternalDefaultModelValue(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }
  let text = raw;
  if (
    (text.startsWith("\"") && text.endsWith("\""))
    || (text.startsWith("'") && text.endsWith("'"))
  ) {
    text = text.slice(1, -1).trim();
  }
  return text.slice(0, 160);
}

function normalizeExternalDefaultModelsMap(value) {
  const source = value && typeof value === "object" ? value : {};
  const normalized = {};
  const providers = ["anthropic", "gemini", "cursor", "antigravity"];
  for (const providerId of providers) {
    const provider = normalizeExternalProviderId(providerId);
    const model = normalizeExternalDefaultModelValue(source[provider]);
    if (model) {
      normalized[provider] = model;
    }
  }
  return normalized;
}

function serializeExternalDefaultModelsMap(value) {
  const normalized = normalizeExternalDefaultModelsMap(value);
  const keys = Object.keys(normalized).sort();
  return keys.map((key) => `${key}:${normalized[key]}`).join("|");
}

function getExternalDefaultModel(providerId) {
  const provider = normalizeExternalProviderId(providerId);
  return normalizeExternalDefaultModelValue(externalDefaultModels?.[provider]);
}

function normalizeExternalObservedModelDetailEntry(value) {
  const source = value && typeof value === "object" ? value : {};
  const model = normalizeExternalDefaultModelValue(
    source.model !== undefined
      ? source.model
      : value
  );
  if (!model) {
    return null;
  }
  const firstSeenAtRaw = String(source.firstSeenAt || source.firstSeen || source.first_seen_at || "").trim();
  const lastSeenAtRaw = String(source.lastSeenAt || source.lastSeen || source.last_seen_at || source.seenAt || "").trim();
  const firstSeenMs = Date.parse(firstSeenAtRaw);
  const lastSeenMs = Date.parse(lastSeenAtRaw);
  const firstSeenAt = Number.isFinite(firstSeenMs) ? new Date(firstSeenMs).toISOString() : "";
  const lastSeenAt = Number.isFinite(lastSeenMs) ? new Date(lastSeenMs).toISOString() : "";
  const seenCountRaw = Number(
    source.seenCount !== undefined
      ? source.seenCount
      : (source.count !== undefined ? source.count : source.seen)
  );
  const seenCount = Number.isFinite(seenCountRaw) ? Math.max(1, Math.round(seenCountRaw)) : 1;
  return {
    model,
    firstSeenAt,
    lastSeenAt: lastSeenAt || firstSeenAt,
    seenCount
  };
}

function getExternalObservedModelDetails(providerId) {
  const provider = normalizeExternalProviderId(providerId);
  const catalogEntry = externalModelCatalog?.[provider] && typeof externalModelCatalog[provider] === "object"
    ? externalModelCatalog[provider]
    : {};
  const rawDetails = Array.isArray(catalogEntry.observedModelDetails)
    ? catalogEntry.observedModelDetails
    : (Array.isArray(catalogEntry.observedModels) ? catalogEntry.observedModels : []);
  const seen = new Set();
  const details = [];
  for (const raw of rawDetails) {
    const parsed = normalizeExternalObservedModelDetailEntry(raw);
    if (!parsed) continue;
    const key = parsed.model.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    details.push(parsed);
  }
  return details;
}

function getExternalObservedModels(providerId) {
  return getExternalObservedModelDetails(providerId).map((entry) => entry.model);
}

function formatObservedAge(value) {
  const parsed = Date.parse(String(value || ""));
  if (!Number.isFinite(parsed)) {
    return "unknown";
  }
  const diffMs = Date.now() - parsed;
  if (!Number.isFinite(diffMs) || diffMs < 15 * 1000) {
    return "just now";
  }
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diffMs < hour) {
    return `${Math.max(1, Math.floor(diffMs / minute))}m ago`;
  }
  if (diffMs < day) {
    return `${Math.max(1, Math.floor(diffMs / hour))}h ago`;
  }
  return `${Math.max(1, Math.floor(diffMs / day))}d ago`;
}

function readExternalObservedMaxAgeDays() {
  const parsed = Number(externalObservedMaxAgeDaysInput?.value || 30);
  const days = Number.isFinite(parsed) ? Math.max(1, Math.min(3650, Math.round(parsed))) : 30;
  if (externalObservedMaxAgeDaysInput) {
    externalObservedMaxAgeDaysInput.value = String(days);
  }
  return days;
}

function normalizeExternalObservedPruneDays(value, fallback = 30) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(1, Math.min(3650, Math.round(parsed)));
}

function normalizeExternalObservedPruneHour(value, fallback = 3) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(0, Math.min(23, Math.round(parsed)));
}

function readExternalObservedAutoPruneDays() {
  const days = normalizeExternalObservedPruneDays(
    externalObservedAutoPruneDaysInput?.value,
    externalObservedPruneRuntime.maxAgeDays
  );
  if (externalObservedAutoPruneDaysInput) {
    externalObservedAutoPruneDaysInput.value = String(days);
  }
  return days;
}

function readExternalObservedAutoPruneHour() {
  const hour = normalizeExternalObservedPruneHour(
    externalObservedAutoPruneHourInput?.value,
    externalObservedPruneRuntime.dailyHourLocal
  );
  if (externalObservedAutoPruneHourInput) {
    externalObservedAutoPruneHourInput.value = String(hour);
  }
  return hour;
}

function renderExternalObservedPruneStatus() {
  if (!externalObservedPruneStatus) {
    return;
  }
  const enabled = Boolean(externalObservedPruneRuntime.enabled);
  const days = normalizeExternalObservedPruneDays(externalObservedPruneRuntime.maxAgeDays, 30);
  const hour = normalizeExternalObservedPruneHour(externalObservedPruneRuntime.dailyHourLocal, 3);
  const hourText = `${String(hour).padStart(2, "0")}:00`;
  const timerText = externalObservedPruneRuntime.timerActive ? "armed" : "idle";
  const nextRunText = externalObservedPruneRuntime.nextRunAt
    ? formatLocalTimestamp(externalObservedPruneRuntime.nextRunAt)
    : "n/a";
  const lastRunText = externalObservedPruneRuntime.lastRunAt
    ? formatLocalTimestamp(externalObservedPruneRuntime.lastRunAt)
    : "n/a";
  const runs = Math.max(0, Number(externalObservedPruneRuntime.runs || 0));
  const error = String(externalObservedPruneRuntime.lastError || "").trim();
  const errorText = error ? ` Error: ${error.slice(0, 140)}.` : "";
  if (enabled) {
    externalObservedPruneStatus.textContent = `Auto-prune ON (${timerText}): keep ${days} day(s), run daily at ${hourText} local. Next: ${nextRunText}. Last: ${lastRunText}. Runs: ${runs}.${errorText}`;
    return;
  }
  externalObservedPruneStatus.textContent = `Auto-prune OFF. Configured window: ${days} day(s), hour: ${hourText} local.${errorText}`;
}

function applyExternalObservedPruneRuntimeSnapshot(snapshot = {}) {
  const source = snapshot && typeof snapshot === "object" ? snapshot : {};
  if (source.enabled !== undefined) {
    externalObservedPruneRuntime.enabled = Boolean(source.enabled);
  }
  externalObservedPruneRuntime.maxAgeDays = normalizeExternalObservedPruneDays(
    source.maxAgeDays,
    externalObservedPruneRuntime.maxAgeDays
  );
  externalObservedPruneRuntime.dailyHourLocal = normalizeExternalObservedPruneHour(
    source.dailyHourLocal,
    externalObservedPruneRuntime.dailyHourLocal
  );
  externalObservedPruneRuntime.timerActive = Boolean(source.timerActive);
  externalObservedPruneRuntime.nextRunAt = String(source.nextRunAt || "");
  externalObservedPruneRuntime.lastRunAt = String(source.lastRunAt || "");
  externalObservedPruneRuntime.lastError = String(source.lastError || "");
  externalObservedPruneRuntime.lastSummary = source.lastSummary && typeof source.lastSummary === "object"
    ? source.lastSummary
    : null;
  externalObservedPruneRuntime.runs = Math.max(0, Number(source.runs || 0));
  renderExternalObservedPruneStatus();
}

function buildExternalModelSuggestions(providerId) {
  const provider = normalizeExternalProviderId(providerId);
  const fallback = Array.isArray(FALLBACK_EXTERNAL_MODEL_ALIASES[provider])
    ? FALLBACK_EXTERNAL_MODEL_ALIASES[provider]
    : [];
  const hints = Array.isArray(externalModelAliases?.[provider])
    ? externalModelAliases[provider]
    : fallback;
  const catalogEntry = externalModelCatalog?.[provider] && typeof externalModelCatalog[provider] === "object"
    ? externalModelCatalog[provider]
    : {};
  const aliasMap = catalogEntry.aliases && typeof catalogEntry.aliases === "object"
    ? Object.keys(catalogEntry.aliases)
    : [];
  const canonicalModels = Array.isArray(catalogEntry.canonicalModels)
    ? catalogEntry.canonicalModels
    : [];
  const defaultModel = getExternalDefaultModel(provider);
  return uniqueNonEmptyStrings([...hints, ...aliasMap, ...canonicalModels, defaultModel]).slice(0, 180);
}

function refreshExternalModelInputUi(options = {}) {
  const provider = normalizeExternalProviderId(externalProviderSelect?.value || "");
  const suggestions = buildExternalModelSuggestions(provider);
  const defaultModel = getExternalDefaultModel(provider);
  const observedModelDetails = getExternalObservedModelDetails(provider);
  const observedModels = getExternalObservedModels(provider);
  const syncValue = Boolean(options.syncValue);
  const forceValue = Boolean(options.forceValue);

  if (externalModelAliasList) {
    externalModelAliasList.innerHTML = "";
    for (const value of suggestions) {
      const option = document.createElement("option");
      option.value = value;
      externalModelAliasList.appendChild(option);
    }
  }

  if (externalModelInput) {
    externalModelInput.placeholder = defaultModel
      ? `Model alias or exact ID for ${provider} (default: ${defaultModel})`
      : `Model alias or exact ID for ${provider} (optional)`;
    const currentValue = String(externalModelInput.value || "").trim();
    if (syncValue && (forceValue || !currentValue)) {
      externalModelInput.value = defaultModel;
    }
  }

  if (externalModelHint) {
    const aliasHint = suggestions.length > 0
      ? `Aliases for ${provider}: ${suggestions.slice(0, 8).join(", ")}${suggestions.length > 8 ? ", ..." : ""}`
      : `No known aliases for ${provider}. You can still use an exact model ID.`;
    const defaultHint = defaultModel ? ` Default model: ${defaultModel}.` : "";
    const observedHint = observedModels.length > 0
      ? ` Observed: ${observedModels.length}.`
      : "";
    externalModelHint.textContent = `${aliasHint}${defaultHint}${observedHint}`.trim();
  }

  if (externalObservedHint) {
    if (observedModelDetails.length > 0) {
      const preview = observedModelDetails
        .slice(0, 5)
        .map((entry) => `${entry.model} (${formatObservedAge(entry.lastSeenAt)}, x${entry.seenCount})`)
        .join(", ");
      externalObservedHint.textContent = `Observed models for ${provider}: ${preview}${observedModelDetails.length > 5 ? ", ..." : ""}`;
    } else {
      externalObservedHint.textContent = `Observed models for ${provider}: none yet.`;
    }
  }
}

async function refreshExternalModelAliases(options = {}) {
  const silent = Boolean(options.silent);
  let defaultModelsChanged = false;
  try {
    const data = await request("/api/providers/model-aliases");
    externalModelAliases = data.aliases && typeof data.aliases === "object"
      ? data.aliases
      : {};
    externalModelCatalog = data.catalog && typeof data.catalog === "object"
      ? data.catalog
      : {};
    if (data.defaultModels && typeof data.defaultModels === "object") {
      const nextDefaults = normalizeExternalDefaultModelsMap(data.defaultModels);
      const nextRevision = serializeExternalDefaultModelsMap(nextDefaults);
      defaultModelsChanged = nextRevision !== externalDefaultModelsRevision;
      externalDefaultModels = nextDefaults;
      externalDefaultModelsRevision = nextRevision;
    }
    if (!silent) {
      logEvent("External model aliases refreshed.");
    }
  } catch (error) {
    externalModelAliases = { ...FALLBACK_EXTERNAL_MODEL_ALIASES };
    externalModelCatalog = {};
    if (!silent) {
      logEvent(`External model aliases unavailable: ${error.message}`);
    }
  } finally {
    refreshExternalModelInputUi({ syncValue: defaultModelsChanged });
  }
}

async function saveExternalDefaultModel(providerId, modelValue, options = {}) {
  const silent = Boolean(options.silent);
  const provider = normalizeExternalProviderId(providerId);
  const normalizedModel = normalizeExternalDefaultModelValue(modelValue);
  const currentDefault = getExternalDefaultModel(provider);
  if (currentDefault === normalizedModel) {
    return false;
  }
  const data = await apiPost("/api/providers/model-settings/default", {
    provider,
    model: normalizedModel
  });
  applySettingsUi(data.settings || {});
  if (data.modelSettings?.catalog && typeof data.modelSettings.catalog === "object") {
    externalModelCatalog = {
      ...externalModelCatalog,
      [provider]: data.modelSettings.catalog
    };
  }
  if (data.modelSettings?.observedPrune && typeof data.modelSettings.observedPrune === "object") {
    applyExternalObservedPruneRuntimeSnapshot(data.modelSettings.observedPrune);
  }
  refreshExternalModelInputUi({ syncValue: true });
  if (!silent) {
    logEvent(
      normalizedModel
        ? `Saved default model for ${provider}: ${data.model || normalizedModel}`
        : `Cleared default model for ${provider}.`
    );
  }
  return true;
}

async function clearObservedExternalModels(providerId, options = {}) {
  const silent = Boolean(options.silent);
  const provider = String(providerId || "").trim() || "all";
  const data = await apiPost("/api/providers/model-settings/observed/clear", {
    provider
  });
  if (!silent) {
    logEvent(`Observed external models cleared for ${data.cleared || provider}.`);
  }
  if (data.modelSettings?.observedPrune && typeof data.modelSettings.observedPrune === "object") {
    applyExternalObservedPruneRuntimeSnapshot(data.modelSettings.observedPrune);
  }
  await refreshExternalModelAliases({ silent: true });
  refreshExternalModelInputUi({ syncValue: true });
  return data;
}

async function pruneObservedExternalModels(providerId, maxAgeDays, options = {}) {
  const silent = Boolean(options.silent);
  const provider = String(providerId || "").trim() || "all";
  const days = Number.isFinite(Number(maxAgeDays))
    ? Math.max(1, Math.min(3650, Math.round(Number(maxAgeDays))))
    : 30;
  const data = await apiPost("/api/providers/model-settings/observed/prune", {
    provider,
    maxAgeDays: days
  });
  if (!silent) {
    const removed = Number(data.removed || 0);
    logEvent(`Pruned observed models for ${data.target || provider}: removed=${removed}, days=${days}.`);
  }
  if (data.modelSettings?.observedPrune && typeof data.modelSettings.observedPrune === "object") {
    applyExternalObservedPruneRuntimeSnapshot(data.modelSettings.observedPrune);
  }
  await refreshExternalModelAliases({ silent: true });
  refreshExternalModelInputUi({ syncValue: true });
  return data;
}

async function showExternalModelSettings(providerId = "") {
  const provider = normalizeExternalProviderId(providerId || externalProviderSelect?.value || "");
  const query = provider ? `?provider=${encodeURIComponent(provider)}` : "";
  const data = await request(`/api/providers/model-settings${query}`);
  if (externalOutput) {
    externalOutput.textContent = provider
      ? `Loaded external model settings for ${provider}.`
      : "Loaded external model settings.";
  }
  if (data.observedPrune && typeof data.observedPrune === "object") {
    applyExternalObservedPruneRuntimeSnapshot(data.observedPrune);
  }
  pushMessage(
    "brain",
    JSON.stringify(data, null, 2),
    provider ? `Model Settings (${provider})` : "Model Settings"
  );
  return data;
}

async function getJob(jobId) {
  const data = await request(`/api/jobs/${encodeURIComponent(jobId)}`);
  return data.job;
}

function applyStealthUi(enabled) {
  stealthMode = Boolean(enabled);
  document.body.classList.toggle("stealth-on", stealthMode);

  if (stealthToggle) {
    stealthToggle.checked = stealthMode;
  }

  if (stealthLabel) {
    stealthLabel.textContent = stealthMode ? "Stealth ON" : "Stealth OFF";
  }

  if (stealthHint) {
    stealthHint.textContent = stealthMode
      ? "Stealth Mode is ON. Visible launch actions are hidden."
      : "Stealth Mode is OFF. Visible launch actions are available.";
  }
}

function normalizeApprovalMode(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "manual" || normalized === "deny") {
    return normalized;
  }
  return "smart";
}

function normalizeCostMode(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "balanced" || normalized === "quality") {
    return normalized;
  }
  return "low";
}

function normalizeCodexWebSearch(value) {
  if (typeof value === "boolean") {
    return value;
  }
  const normalized = String(value || "").trim().toLowerCase();
  return normalized === "true" || normalized === "on" || normalized === "enabled" || normalized === "1";
}

function normalizeOpenclawMode(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "governed" || normalized === "disabled") {
    return normalized;
  }
  return "read_only";
}

function normalizeGuardianMode(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "off" || normalized === "notify" || normalized === "strict") {
    return normalized;
  }
  return "autonomous";
}

function normalizeGuardianRiskThreshold(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "low" || normalized === "medium" || normalized === "critical") {
    return normalized;
  }
  return "high";
}

function normalizeMemoryWindow(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return memoryWindowTurns;
  }
  return Math.max(4, Math.min(40, Math.round(parsed)));
}

function applyOpenclawUi(mode) {
  const disabled = String(mode || "").toLowerCase() === "disabled";
  if (openclawCard) {
    openclawCard.style.display = disabled ? "none" : "";
  }
}

function applySettingsUi(settings = {}) {
  applyStealthUi(Boolean(settings.stealthMode));

  approvalMode = normalizeApprovalMode(settings.approvalMode || approvalMode);
  if (approvalModeSelect) {
    approvalModeSelect.value = approvalMode;
  }

  costMode = normalizeCostMode(settings.costMode || costMode);
  if (costModeSelect) {
    costModeSelect.value = costMode;
  }

  codexWebSearch = normalizeCodexWebSearch(settings.codexWebSearch ?? codexWebSearch);
  if (codexWebSearchSelect) {
    codexWebSearchSelect.value = codexWebSearch ? "on" : "off";
  }

  openclawMode = normalizeOpenclawMode(settings.openclawMode || openclawMode);
  if (openclawModeSelect) {
    openclawModeSelect.value = openclawMode;
  }
  applyOpenclawUi(openclawMode);

  allowExternalPosting = Boolean(settings.allowExternalPosting);
  if (allowExternalPostingToggle) {
    allowExternalPostingToggle.checked = allowExternalPosting;
  }
  if (companyHint) {
    companyHint.textContent = allowExternalPosting
      ? "External posting is ENABLED. Use with caution."
      : "External posting is DISABLED (recommended).";
  }

  const nextExternalDefaultModels = normalizeExternalDefaultModelsMap(settings.externalDefaultModels);
  const nextExternalDefaultModelsRevision = serializeExternalDefaultModelsMap(nextExternalDefaultModels);
  const externalDefaultsChanged = nextExternalDefaultModelsRevision !== externalDefaultModelsRevision;
  externalDefaultModels = nextExternalDefaultModels;
  externalDefaultModelsRevision = nextExternalDefaultModelsRevision;
  refreshExternalModelInputUi({ syncValue: externalDefaultsChanged });

  externalObservedPruneRuntime.enabled = Boolean(
    settings.externalObservedPruneEnabled ?? externalObservedPruneRuntime.enabled
  );
  externalObservedPruneRuntime.maxAgeDays = normalizeExternalObservedPruneDays(
    settings.externalObservedPruneMaxAgeDays,
    externalObservedPruneRuntime.maxAgeDays
  );
  externalObservedPruneRuntime.dailyHourLocal = normalizeExternalObservedPruneHour(
    settings.externalObservedPruneDailyHourLocal,
    externalObservedPruneRuntime.dailyHourLocal
  );
  if (externalObservedAutoPruneEnabledToggle) {
    externalObservedAutoPruneEnabledToggle.checked = externalObservedPruneRuntime.enabled;
  }
  if (externalObservedAutoPruneDaysInput) {
    externalObservedAutoPruneDaysInput.value = String(externalObservedPruneRuntime.maxAgeDays);
  }
  if (externalObservedAutoPruneHourInput) {
    externalObservedAutoPruneHourInput.value = String(externalObservedPruneRuntime.dailyHourLocal);
  }
  renderExternalObservedPruneStatus();

  guardianMode = normalizeGuardianMode(settings.guardianMode || guardianMode);
  if (guardianModeSelect) {
    guardianModeSelect.value = guardianMode;
  }

  guardianRiskThreshold = normalizeGuardianRiskThreshold(settings.guardianRiskThreshold || guardianRiskThreshold);
  if (guardianRiskThresholdSelect) {
    guardianRiskThresholdSelect.value = guardianRiskThreshold;
  }

  guardianAlertsEnabled = Boolean(settings.guardianAlertsEnabled ?? guardianAlertsEnabled);
  if (guardianAlertsEnabledToggle) {
    guardianAlertsEnabledToggle.checked = guardianAlertsEnabled;
  }

  guardianAutoBlockCritical = Boolean(settings.guardianAutoBlockCritical ?? guardianAutoBlockCritical);
  if (guardianAutoBlockCriticalToggle) {
    guardianAutoBlockCriticalToggle.checked = guardianAutoBlockCritical;
  }

  if (guardianOutput) {
    guardianOutput.textContent = `Mode=${guardianMode}, threshold=${guardianRiskThreshold}, alerts=${guardianAlertsEnabled ? "on" : "off"}, autoBlockCritical=${guardianAutoBlockCritical ? "on" : "off"}`;
  }

  memoryWindowTurns = normalizeMemoryWindow(settings.memoryWindowTurns ?? memoryWindowTurns);
  if (memoryWindowTurnsInput) {
    memoryWindowTurnsInput.value = String(memoryWindowTurns);
  }
}

function formatJobResult(job) {
  if (!job) return "No job data returned.";

  if (job.type === "brain") {
    const lines = [String(job.result?.reply || "Brain task completed with no reply.")];
    if (job.result?.provider) {
      lines.push(`Provider: ${job.result.provider}`);
    }

    if (Array.isArray(job.result?.imagesUsed) && job.result.imagesUsed.length > 0) {
      lines.push(`Images used: ${job.result.imagesUsed.map((item) => String(item).split(/[\\/]/).pop()).join(", ")}`);
    }

    if (Array.isArray(job.result?.approvals) && job.result.approvals.length > 0) {
      const approvalLines = job.result.approvals.map((entry) => {
        return `- ${entry.choice.toUpperCase()} (${entry.reason})`;
      });
      lines.push(`Approval choices:\n${approvalLines.join("\n")}`);
    }

    return lines.join("\n\n");
  }

  if (job.type === "screenshot") {
    return `Screenshot saved to: ${job.result?.outputPath || "unknown path"}`;
  }

  if (job.type === "pad_run") {
    const code = job.result?.exitCode;
    return `PAD run finished${Number.isFinite(code) ? ` with exit code ${code}` : ""}.`;
  }

  if (job.type === "openclaw_read" || job.type === "openclaw_control") {
    const lines = [];
    if (job.result?.action) lines.push(`Action: ${job.result.action}`);
    if (job.result?.mode) lines.push(`Mode: ${job.result.mode}`);
    if (job.result?.caution) lines.push(`Safety: ${job.result.caution}`);

    if (job.result?.parsed) {
      lines.push(JSON.stringify(job.result.parsed, null, 2));
    } else if (job.result?.stdout) {
      lines.push(String(job.result.stdout));
    } else {
      lines.push("No output returned.");
    }

    return lines.join("\n\n");
  }

  if (job.type === "external_brain") {
    const lines = [];
    if (job.result?.provider) lines.push(`Provider: ${job.result.provider}`);
    if (job.result?.reply) lines.push(String(job.result.reply));
    if (!job.result?.reply && job.result?.raw) {
      lines.push(JSON.stringify(job.result.raw, null, 2));
    }
    return lines.join("\n\n") || "External provider finished with no reply.";
  }

  if (job.type === "notebooklm_ask") {
    const lines = [];
    if (job.result?.accountUsed) {
      lines.push(`Account: ${job.result.accountUsed}`);
    }
    if (job.result?.provider) {
      lines.push(`Provider: ${job.result.provider}${job.result?.model ? ` (${job.result.model})` : ""}`);
    }
    if (job.result?.noteId) {
      lines.push(`Saved note: ${job.result.noteId}`);
    }
    if (Array.isArray(job.result?.warnings) && job.result.warnings.length > 0) {
      lines.push(`Warnings:\n${job.result.warnings.map((w) => `- ${w}`).join("\n")}`);
    }
    if (job.result?.reply) {
      lines.push(String(job.result.reply));
    }
    return lines.join("\n\n") || "NotebookLM ask finished with no reply.";
  }

  return JSON.stringify(job.result || {}, null, 2);
}

function trackJob(jobId, handlers = {}) {
  const started = Date.now();
  const timeoutMs = 10 * 60 * 1000;

  async function tick() {
    try {
      const job = await getJob(jobId);
      if (handlers.onUpdate) {
        handlers.onUpdate(job);
      }

      if (job.status === "completed") {
        if (handlers.onCompleted) {
          handlers.onCompleted(job);
        }
        return;
      }

      if (job.status === "failed") {
        if (handlers.onFailed) {
          handlers.onFailed(job);
        }
        return;
      }

      if (Date.now() - started > timeoutMs) {
        if (handlers.onFailed) {
          handlers.onFailed({
            status: "failed",
            error: "Timed out while waiting for job completion."
          });
        }
        return;
      }

      setTimeout(tick, 800);
    } catch (error) {
      if (handlers.onFailed) {
        handlers.onFailed({
          status: "failed",
          error: error.message
        });
      }
    }
  }

  setTimeout(tick, 500);
}

function setChatImageStatus() {
  if (!chatImageStatus) return;

  const files = Array.from(chatImages?.files || []);
  if (files.length === 0) {
    chatImageStatus.textContent = "No images selected.";
    return;
  }

  chatImageStatus.textContent = `${files.length} image(s): ${files.map((file) => file.name).join(", ")}`;
}

function setChatFileStatus() {
  if (!chatFileStatus) return;

  const files = Array.from(chatFiles?.files || []);
  if (files.length === 0) {
    chatFileStatus.textContent = "No files selected.";
    return;
  }

  chatFileStatus.textContent = `${files.length} file(s): ${files.map((file) => file.name).join(", ")}`;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
    reader.readAsDataURL(file);
  });
}

async function uploadSelectedImages() {
  const files = Array.from(chatImages?.files || []);
  if (files.length === 0) {
    return [];
  }

  const uploadedPaths = [];
  for (const file of files.slice(0, 6)) {
    const dataUrl = await fileToDataUrl(file);
    const response = await apiPost("/api/uploads/image", {
      fileName: file.name,
      dataUrl
    });
    if (response.image?.path) {
      uploadedPaths.push(response.image.path);
    }
  }

  return uploadedPaths;
}

async function uploadSelectedFiles() {
  const files = Array.from(chatFiles?.files || []);
  if (files.length === 0) {
    return [];
  }

  const uploadedPaths = [];
  const maxBytes = 5 * 1024 * 1024;
  for (const file of files.slice(0, 6)) {
    if (Number(file.size || 0) > maxBytes) {
      logEvent(`Skipped ${file.name}: too large (${Math.ceil(file.size / 1024)} KB).`);
      continue;
    }
    const dataUrl = await fileToDataUrl(file);
    const response = await apiPost("/api/uploads/file", {
      fileName: file.name,
      dataUrl
    });
    if (response.file?.path) {
      uploadedPaths.push(response.file.path);
    }
  }

  return uploadedPaths;
}

async function refreshHealth() {
  try {
    const data = await request("/api/health");
    const codex = data.toolPaths.codexPath ? "Codex ready" : "Codex missing";
    const chrome = data.toolPaths.chromePath ? "Chrome ready" : "Chrome missing";
    const pad = data.toolPaths.padConsolePath ? "PAD ready" : "PAD missing";
    const openclaw = !data.toolPaths.openclawPath
      ? "OpenClaw missing"
      : openclawMode === "disabled"
        ? "OpenClaw disabled"
        : "OpenClaw ready";
    const externalProviders = Array.isArray(data.providers?.external) ? data.providers.external : [];
    const externalConfigured = externalProviders.filter((provider) => provider?.configured && provider?.enabled).length;
    const external = `ExtBrains:${externalConfigured}`;
    const queue = data.queue ? `Q:${data.queue.queued} R:${data.queue.running}` : "Q:0 R:0";
    const memory = data.memory ? `M:${data.memory.totalTurns}` : "M:0";
    const tasks = data.taskLedger ? `T:${data.taskLedger.openTasks || 0}/${data.taskLedger.totalTasks || 0}` : "T:0/0";
    const approvals = data.approvals ? `P:${data.approvals.persistentPrefixes}` : "P:0";
    const vault = data.vault ? `V:${data.vault.entriesCount}` : "V:0";
    const guardian = data.guardian
      ? `G:${data.guardian.mode}/${data.guardian.riskThreshold}/A${data.guardian.alertsEnabled ? "1" : "0"}`
      : "G:n/a";
    const settings = data.settings || {};
    applySettingsUi(settings);
    applyExternalObservedPruneRuntimeSnapshot(data.externalObservedPrune || {});
    renderAgentColony(data);
    applyPhoneRuntimeAlertBadge(data);
    healthBadge.textContent = `${codex} | ${openclaw} | ${external} | ${chrome} | ${pad} | Stealth:${stealthMode ? "ON" : "OFF"} | A:${approvalMode} | C:${costMode} | WS:${codexWebSearch ? "ON" : "OFF"} | O:${openclawMode} | ${guardian} | W:${memoryWindowTurns} | ${queue} | ${memory} | ${tasks} | ${approvals} | ${vault}`;
  } catch (_error) {
    renderAgentColony(null);
    applyPhoneRuntimeAlertBadge(null);
    healthBadge.textContent = "Health check unavailable";
  }
}

function formatLocalTimestamp(value) {
  const ms = Date.parse(String(value || ""));
  if (!Number.isFinite(ms)) {
    return "n/a";
  }
  return new Date(ms).toLocaleString();
}

function formatAgeFromSeconds(seconds) {
  const value = Number(seconds);
  if (!Number.isFinite(value) || value < 0) {
    return "n/a";
  }
  if (value < 60) {
    return `${Math.round(value)}s`;
  }
  if (value < 3600) {
    return `${Math.max(1, Math.round(value / 60))}m`;
  }
  if (value < 86400) {
    return `${Math.max(1, Math.round(value / 3600))}h`;
  }
  return `${Math.max(1, Math.round(value / 86400))}d`;
}

function setPhoneRuntimeAlertBadge(level, text) {
  if (!phoneRuntimeAlertBadge) {
    return;
  }
  const normalized = String(level || "").trim().toLowerCase();
  const safeLevel = normalized === "ok" || normalized === "warn" || normalized === "alert"
    ? normalized
    : "unknown";
  phoneRuntimeAlertBadge.classList.remove("is-ok", "is-warn", "is-alert", "is-unknown");
  phoneRuntimeAlertBadge.classList.add(`is-${safeLevel}`);
  phoneRuntimeAlertBadge.textContent = String(text || "Phone Runtime: checking...");
}

function evaluatePhoneRuntimeAlert(healthData) {
  if (!healthData || typeof healthData !== "object") {
    return {
      level: "unknown",
      text: "Phone Runtime: health unavailable"
    };
  }

  const thresholdSeconds = PHONE_RUNTIME_ALERT_THRESHOLD_SECONDS;
  const thresholdLabel = formatAgeFromSeconds(thresholdSeconds);
  const colonyAgents = Array.isArray(healthData?.agentColony?.agents) ? healthData.agentColony.agents : [];
  const phoneLane = colonyAgents.find((agent) => String(agent?.id || "").trim().toLowerCase() === "phone-codex") || null;
  const keeper = healthData?.networkPolicy?.phoneBridgeKeeper;

  const issues = [];

  if (!phoneLane) {
    issues.push("Falcon missing");
  } else {
    const laneRunning = Boolean(phoneLane.running);
    const laneState = String(phoneLane.state || "").trim().toLowerCase();
    const laneSeenSecondsRaw = Number(phoneLane.lastSeenSeconds);
    const laneSeenSeconds = Number.isFinite(laneSeenSecondsRaw) ? laneSeenSecondsRaw : null;
    const lanePastThreshold = laneSeenSeconds === null || laneSeenSeconds >= thresholdSeconds;
    if ((!laneRunning || laneState === "offline") && lanePastThreshold) {
      issues.push(`Falcon offline ${laneSeenSeconds === null ? "n/a" : formatAgeFromSeconds(laneSeenSeconds)}`);
    }
  }

  if (!keeper || typeof keeper !== "object") {
    issues.push("Keeper missing");
  } else {
    const keeperRunning = Boolean(keeper.running);
    const keeperSeenRaw = Number(keeper.latestLogStaleSeconds);
    const keeperSeenSeconds = Number.isFinite(keeperSeenRaw) ? keeperSeenRaw : null;
    const keeperPastThreshold = keeperSeenSeconds === null || keeperSeenSeconds >= thresholdSeconds;
    if (!keeperRunning && keeperPastThreshold) {
      issues.push(`Keeper offline ${keeperSeenSeconds === null ? "n/a" : formatAgeFromSeconds(keeperSeenSeconds)}`);
    }
  }

  if (issues.length > 0) {
    return {
      level: "alert",
      text: `Phone Runtime Alert (${thresholdLabel}+): ${issues.join(" | ")}`
    };
  }

  const monitor = healthData?.networkPolicy?.phoneTunnelMonitor;
  if (monitor && typeof monitor === "object" && monitor.running === false) {
    return {
      level: "warn",
      text: "Phone Runtime: tunnel monitor offline"
    };
  }

  return {
    level: "ok",
    text: "Phone Runtime: OK"
  };
}

function applyPhoneRuntimeAlertBadge(healthData) {
  const snapshot = evaluatePhoneRuntimeAlert(healthData);
  setPhoneRuntimeAlertBadge(snapshot.level, snapshot.text);
}

function normalizeAgentCardRows(agents = [], order = AGENT_DASHBOARD_ORDER) {
  const rows = [];
  const byId = Object.create(null);
  for (const raw of Array.isArray(agents) ? agents : []) {
    const id = String(raw?.id || "").trim().toLowerCase();
    if (!id) continue;
    byId[id] = raw;
  }
  const ordered = Array.isArray(order) ? order : [];
  for (const id of ordered) {
    rows.push(byId[id] || { id });
    delete byId[id];
  }
  for (const id of Object.keys(byId)) {
    rows.push(byId[id]);
  }
  return rows;
}

function buildAgentTile(row, fallbackMeta = AGENT_FALLBACK_META) {
  const id = String(row?.id || "").trim().toLowerCase();
  if (!id) {
    return null;
  }
  const fallback = fallbackMeta[id] || { name: id, role: "Agent", icon: String(id || "?").slice(0, 1).toUpperCase() };
  const name = String(row?.name || fallback.name || id).trim() || id;
  const role = String(row?.role || fallback.role || "Agent").trim() || "Agent";
  const icon = String(row?.icon || fallback.icon || name.slice(0, 1) || "?").toUpperCase().slice(0, 2);
  const running = Boolean(row?.running);
  const rawState = String(row?.state || (running ? "active" : "offline")).trim().toLowerCase();
  const state = rawState === "active" || rawState === "idle" ? rawState : "offline";
  const pid = Number(row?.pid || 0);
  const lastSeenSeconds = Number(row?.lastSeenSeconds);
  const seenLabel = Number.isFinite(lastSeenSeconds) ? formatAgeFromSeconds(lastSeenSeconds) : "n/a";

  const tile = document.createElement("article");
  tile.className = `agent-tile is-${state}`;
  tile.setAttribute("data-agent-id", id);
  tile.title = `${name} | ${role} | pid=${Number.isFinite(pid) && pid > 0 ? pid : "n/a"} | seen=${seenLabel}`;

  const iconWrap = document.createElement("div");
  iconWrap.className = "agent-icon";
  iconWrap.textContent = icon;

  const copy = document.createElement("div");
  copy.className = "agent-copy";

  const title = document.createElement("div");
  title.className = "agent-name";
  title.textContent = name;

  const meta = document.createElement("div");
  meta.className = "agent-meta";
  meta.textContent = role;

  const status = document.createElement("div");
  status.className = "agent-state";
  status.textContent = `${state.toUpperCase()} | seen ${seenLabel}`;

  copy.appendChild(title);
  copy.appendChild(meta);
  copy.appendChild(status);
  tile.appendChild(iconWrap);
  tile.appendChild(copy);
  return tile;
}

function normalizePhoneRuntimeRows(healthData, colonyRows = []) {
  const byId = Object.create(null);

  function addRow(raw) {
    const id = String(raw?.id || "").trim().toLowerCase();
    if (!id) {
      return;
    }
    byId[id] = raw;
  }

  for (const row of Array.isArray(colonyRows) ? colonyRows : []) {
    const id = String(row?.id || "").trim().toLowerCase();
    const role = String(row?.role || "").trim().toLowerCase();
    const profile = String(row?.profile || "").trim().toLowerCase();
    if (!id) {
      continue;
    }
    if (id.includes("phone") || role.includes("phone") || role.includes("mobile") || profile.includes("mobile")) {
      addRow(row);
    }
  }

  const keeper = healthData?.networkPolicy?.phoneBridgeKeeper;
  if (keeper && typeof keeper === "object") {
    const keeperSeenSeconds = Number(keeper.latestLogStaleSeconds);
    addRow({
      id: "phone-link-keeper",
      name: "Phone Link Keeper",
      role: "USB/Wi-Fi Keeper",
      icon: "LK",
      profile: "phone-link-keeper",
      running: Boolean(keeper.running),
      state: keeper.running ? "active" : "offline",
      pid: Number(keeper.pid || 0),
      lastSeenSeconds: Number.isFinite(keeperSeenSeconds) ? keeperSeenSeconds : null,
      lastSeenAt: String(keeper.latestLogUpdatedAt || "")
    });
  }

  const monitor = healthData?.networkPolicy?.phoneTunnelMonitor;
  if (monitor && typeof monitor === "object") {
    const monitorSeenSeconds = Number(monitor.latestLogStaleSeconds);
    const reportPass = monitor.latestReportPass;
    const running = Boolean(monitor.running);
    const state = running
      ? (reportPass === false ? "idle" : "active")
      : "offline";
    addRow({
      id: "phone-tunnel-monitor",
      name: "Phone Tunnel Monitor",
      role: "Tunnel Failover",
      icon: "TM",
      profile: "phone-tunnel-monitor",
      running,
      state,
      pid: Number(monitor.pid || 0),
      lastSeenSeconds: Number.isFinite(monitorSeenSeconds) ? monitorSeenSeconds : null,
      lastSeenAt: String(monitor.latestLogUpdatedAt || "")
    });
  }

  return normalizeAgentCardRows(Object.values(byId), PHONE_AGENT_DASHBOARD_ORDER);
}

function renderPhoneAgentRuntime(healthData, colony = {}, colonyRows = []) {
  if (!phoneAgentRuntimeCard || !phoneAgentGrid || !phoneAgentSummary || !phoneAgentUpdatedAt) {
    return;
  }
  const rows = normalizePhoneRuntimeRows(healthData, colonyRows);
  phoneAgentGrid.innerHTML = "";
  for (const row of rows) {
    const tile = buildAgentTile(row, PHONE_AGENT_FALLBACK_META);
    if (tile) {
      phoneAgentGrid.appendChild(tile);
    }
  }

  const totalCount = rows.length;
  const runningCount = rows.filter((row) => Boolean(row?.running)).length;
  const activeCount = rows.filter((row) => String(row?.state || "").trim().toLowerCase() === "active").length;
  const keeperRunning = Boolean(healthData?.networkPolicy?.phoneBridgeKeeper?.running);
  const tunnelMonitorRunning = Boolean(healthData?.networkPolicy?.phoneTunnelMonitor?.running);
  if (totalCount < 1) {
    phoneAgentSummary.textContent = "No phone runtime agents detected yet.";
  } else {
    phoneAgentSummary.textContent = `Active ${activeCount}/${totalCount} | Running ${runningCount}/${totalCount} | Keeper:${keeperRunning ? "ON" : "OFF"} | TunnelMon:${tunnelMonitorRunning ? "ON" : "OFF"}`;
  }
  const updatedAt = String(
    colony?.updatedAt
    || healthData?.networkPolicy?.phoneTunnelMonitor?.latestLogUpdatedAt
    || healthData?.networkPolicy?.phoneBridgeKeeper?.latestLogUpdatedAt
    || ""
  ).trim();
  phoneAgentUpdatedAt.textContent = `Updated: ${formatLocalTimestamp(updatedAt || new Date().toISOString())}`;
}

function renderAgentColony(healthData) {
  const colony = healthData && typeof healthData === "object" && healthData.agentColony && typeof healthData.agentColony === "object"
    ? healthData.agentColony
    : {};
  const rows = normalizeAgentCardRows(colony.agents);

  if (colonyGrid && colonySummary && colonyUpdatedAt && colonyDashboardCard) {
    colonyGrid.innerHTML = "";
    for (const row of rows) {
      const tile = buildAgentTile(row, AGENT_FALLBACK_META);
      if (tile) {
        colonyGrid.appendChild(tile);
      }
    }

    const counts = colony && typeof colony.counts === "object" ? colony.counts : {};
    const activeCount = Number.isFinite(Number(counts.active))
      ? Number(counts.active)
      : rows.filter((row) => String(row?.state || "").toLowerCase() === "active").length;
    const totalCount = Number.isFinite(Number(counts.total))
      ? Number(counts.total)
      : rows.length;
    const queueRunning = Number(healthData?.queue?.running || 0);
    const queueQueued = Number(healthData?.queue?.queued || 0);
    const relayOnline = Boolean(colony?.relay?.running);
    const tunnelOnline = Boolean(colony?.tunnel?.running);
    const updatedAt = String(colony?.updatedAt || "").trim();
    colonySummary.textContent = `Active ${activeCount}/${Math.max(totalCount, 0)} | Queue R:${queueRunning} Q:${queueQueued} | Relay:${relayOnline ? "ON" : "OFF"} | Tunnel:${tunnelOnline ? "ON" : "OFF"}`;
    colonyUpdatedAt.textContent = `Updated: ${formatLocalTimestamp(updatedAt || new Date().toISOString())}`;
  }

  renderPhoneAgentRuntime(healthData, colony, rows);
}

function shortHash(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "-";
  }
  return raw.length > 14 ? `${raw.slice(0, 14)}...` : raw;
}

function readGatewayAuditLimit() {
  const parsed = Number(gatewayAuditLimitInput?.value || 15);
  const limit = Number.isFinite(parsed) ? Math.max(1, Math.min(100, Math.round(parsed))) : 15;
  if (gatewayAuditLimitInput) {
    gatewayAuditLimitInput.value = String(limit);
  }
  return limit;
}

function readGatewayAuditType() {
  const value = String(gatewayAuditTypeSelect?.value || "").trim();
  return value;
}

function renderGatewayAuditEvents(events = []) {
  if (!gatewayAuditEvents) {
    return;
  }
  gatewayAuditEvents.innerHTML = "";
  if (!Array.isArray(events) || events.length < 1) {
    const row = document.createElement("div");
    row.textContent = "No audit events returned.";
    gatewayAuditEvents.appendChild(row);
    return;
  }
  for (const event of events) {
    const row = document.createElement("div");
    const at = formatLocalTimestamp(event?.at);
    const type = String(event?.type || "event");
    const actor = String(event?.actor || "unknown");
    const hash = shortHash(event?.hash);
    row.textContent = `${at} | ${type} | actor=${actor} | hash=${hash}`;
    gatewayAuditEvents.appendChild(row);
  }
}

function renderGatewayReadinessHints(actions = []) {
  if (!gatewayReadinessHints) {
    return;
  }
  gatewayReadinessHints.innerHTML = "";
  const list = Array.isArray(actions) ? actions : [];
  if (list.length < 1) {
    const row = document.createElement("div");
    row.textContent = "Readiness recommendations appear here after running a drill.";
    gatewayReadinessHints.appendChild(row);
    return;
  }
  for (const action of list) {
    const row = document.createElement("div");
    row.textContent = `- ${String(action || "")}`;
    gatewayReadinessHints.appendChild(row);
  }
}

async function refreshGatewayAuditPanel(options = {}) {
  if (!gatewayAuditStatus || !gatewayAuthorityStatus || !gatewayAuditEvents) {
    return;
  }
  const silent = Boolean(options.silent);
  const limit = readGatewayAuditLimit();
  const type = readGatewayAuditType();
  try {
    const [authorityData, statusData] = await Promise.all([
      request("/api/gateway/authority/status"),
      request("/api/gateway/audit/status")
    ]);

    const query = new URLSearchParams();
    query.set("limit", String(limit));
    if (type) {
      query.set("type", type);
    }
    const eventsData = await request(`/api/gateway/audit/events?${query.toString()}`);
    const authority = authorityData.authority || {};
    const readiness = authorityData.readiness || {};
    const audit = statusData.audit || {};
    const integrity = audit.integrity || {};
    const gateLocked = Boolean(audit.gateLocked);
    const gateReason = String(audit.gateReason || "").trim();
    const gateLabel = gateLocked ? "LOCKED" : "OPEN";
    const readinessOk = Boolean(readiness.ok);
    const readinessLabel = readinessOk ? "READY" : "BLOCKED";
    const readinessReason = Array.isArray(readiness.blockingReasons) && readiness.blockingReasons.length > 0
      ? ` (${String(readiness.blockingReasons[0] || "").slice(0, 120)})`
      : "";

    gatewayAuthorityStatus.textContent = `Authority: ${String(authority.mode || "unknown")} | Handover ${readinessLabel}${readinessReason} | Updated ${formatLocalTimestamp(authority.updatedAt)} by ${String(authority.updatedBy || "unknown")}`;
    gatewayAuditStatus.textContent = `Audit: events=${Number(audit.totalEvents || 0)} | integrity=${integrity.ok ? "OK" : "FAIL"} | gate=${gateLabel}${gateLocked && gateReason ? ` (${gateReason})` : ""} | checked=${formatLocalTimestamp(integrity.checkedAt)} | hash=${shortHash(audit.lastHash)}`;
    renderGatewayAuditEvents(eventsData.events || []);
  } catch (error) {
    gatewayAuthorityStatus.textContent = "Authority: unavailable";
    gatewayAuditStatus.textContent = `Audit unavailable: ${error.message}`;
    renderGatewayAuditEvents([]);
    if (!silent) {
      logEvent(`Gateway audit refresh failed: ${error.message}`);
    }
  }
}

async function verifyGatewayAuditChain() {
  if (!gatewayAuditStatus) {
    return;
  }
  try {
    gatewayAuditStatus.textContent = "Audit: verifying chain...";
    const data = await apiPost("/api/gateway/audit/verify", {});
    const result = data.result || {};
    const ok = Boolean(result.ok);
    gatewayAuditStatus.textContent = `Audit verify: ${ok ? "OK" : "FAIL"} | errors=${Number(result.errorCount || 0)} | checked=${formatLocalTimestamp(result.checkedAt)} | hash=${shortHash(result.lastHash)}`;
    logEvent(`Gateway audit verify ${ok ? "passed" : "failed"} (errors=${Number(result.errorCount || 0)}).`);
    refreshGatewayAuditPanel({ silent: true });
  } catch (error) {
    gatewayAuditStatus.textContent = `Audit verify failed: ${error.message}`;
    logEvent(`Gateway audit verify failed: ${error.message}`);
  }
}

async function runGatewayReadinessDrill() {
  if (!gatewayReadinessDrillOutput) {
    return;
  }
  try {
    gatewayReadinessDrillOutput.textContent = "Running readiness drill...";
    const data = await apiPost("/api/gateway/authority/readiness/drill", {
      targetMode: "asolaria_primary"
    });
    const drill = data.drill || {};
    const readiness = drill.readiness || {};
    const blockingReasons = Array.isArray(readiness.blockingReasons) ? readiness.blockingReasons : [];
    const recommended = Array.isArray(drill.recommendedActions) ? drill.recommendedActions : [];
    const fallbackHints = blockingReasons.length > 0
      ? blockingReasons.map((reason) => `Resolve: ${String(reason || "").trim()}`)
      : [];
    const hintList = recommended.length > 0 ? recommended : fallbackHints;
    const reasonText = blockingReasons.length > 0 ? ` | reason=${String(blockingReasons[0] || "").slice(0, 140)}` : "";
    gatewayReadinessDrillOutput.textContent = `Drill ${drill.ok ? "PASS" : "FAIL"} | target=${String(drill.targetMode || "asolaria_primary")} | finished=${formatLocalTimestamp(drill.finishedAt)}${reasonText}`;
    renderGatewayReadinessHints(hintList);
    logEvent(`Gateway readiness drill ${drill.ok ? "passed" : "failed"} for ${String(drill.targetMode || "asolaria_primary")}.`);
    refreshGatewayAuditPanel({ silent: true });
  } catch (error) {
    gatewayReadinessDrillOutput.textContent = `Readiness drill failed: ${error.message}`;
    renderGatewayReadinessHints([
      "Verify gateway service is running and token auth is configured.",
      "Check Gateway Audit panel status and retry the drill."
    ]);
    logEvent(`Gateway readiness drill failed: ${error.message}`);
  }
}

async function runGatewayHeartbeat() {
  if (!gatewayReadinessDrillOutput) {
    return;
  }
  try {
    gatewayReadinessDrillOutput.textContent = "Running gateway heartbeat...";
    const data = await apiPost("/api/gateway/heartbeat/run", {});
    const result = data.result || {};
    const checks = Array.isArray(result.checks) ? result.checks : [];
    const failedChecks = checks.filter((check) => !check?.ok);
    const finishedAt = result.at || data.heartbeat?.lastRunAt || "";
    gatewayReadinessDrillOutput.textContent = `Heartbeat ${result.ok ? "OK" : "DEGRADED"} | checks=${checks.length} | failed=${failedChecks.length} | finished=${formatLocalTimestamp(finishedAt)}`;
    if (result.ok) {
      renderGatewayReadinessHints(["Heartbeat acknowledged as HEARTBEAT_OK."]);
    } else if (failedChecks.length > 0) {
      renderGatewayReadinessHints(
        failedChecks.slice(0, 6).map((item) => {
          const url = String(item?.url || "unknown target");
          return `Recover dependency: ${url}`;
        })
      );
    }
    logEvent(`Gateway heartbeat run ${result.ok ? "passed" : "degraded"} (failed=${failedChecks.length}).`);
    refreshGatewayAuditPanel({ silent: true });
  } catch (error) {
    gatewayReadinessDrillOutput.textContent = `Heartbeat run failed: ${error.message}`;
    logEvent(`Gateway heartbeat run failed: ${error.message}`);
  }
}

async function startGatewaySandboxRemediation() {
  if (!gatewayReadinessDrillOutput) {
    return;
  }
  try {
    gatewayReadinessDrillOutput.textContent = "Starting sandbox manager...";
    const data = await apiPost("/api/gateway/remediation/start-sandbox", {});
    const wait = data.wait || {};
    const health = data.health || {};
    const processInfo = data.process || {};
    const statusLabel = data.alreadyRunning
      ? "already running"
      : (data.ok ? "started" : "starting");
    const finishedAt = health?.data?.time || "";
    gatewayReadinessDrillOutput.textContent = `Sandbox remediation ${statusLabel} | health=${health.ok ? "OK" : "PENDING"} | attempts=${Number(wait.attempts || 0)} | finished=${formatLocalTimestamp(finishedAt)}`;

    const hints = [];
    if (health.ok) {
      hints.push("Sandbox manager health is reachable.");
      hints.push("Run Readiness Drill to confirm handover blockers are cleared.");
    } else {
      hints.push("Sandbox startup is still pending. Wait a few seconds and run Readiness Drill again.");
    }
    if (processInfo?.lastLogFile) {
      hints.push(`Sandbox log: ${String(processInfo.lastLogFile)}`);
    }
    renderGatewayReadinessHints(hints);
    logEvent(`Sandbox remediation ${statusLabel}; process pid=${processInfo?.pid || "n/a"}.`);
    refreshGatewayAuditPanel({ silent: true });
  } catch (error) {
    gatewayReadinessDrillOutput.textContent = `Sandbox remediation failed: ${error.message}`;
    logEvent(`Sandbox remediation failed: ${error.message}`);
  }
}

async function refreshSkillsList() {
  if (!skillsSelect || !skillsOutput) {
    return;
  }

  try {
    const data = await request("/api/skills");
    const skills = Array.isArray(data.skills) ? data.skills : [];
    skillsSelect.innerHTML = "";

    if (skills.length === 0) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "No skills loaded";
      skillsSelect.appendChild(option);
      skillsOutput.textContent = "No skills found.";
      return;
    }

    for (const skill of skills) {
      const id = String(skill.id || "");
      if (!id) continue;
      const option = document.createElement("option");
      option.value = id;
      option.textContent = `${id}${skill.title ? ` - ${skill.title}` : ""}`;
      skillsSelect.appendChild(option);
    }

    skillsOutput.textContent = `Loaded ${skills.length} skill(s).`;
  } catch (error) {
    skillsOutput.textContent = `Skills unavailable: ${error.message}`;
  }
}

async function reloadSkillsRegistry() {
  if (!skillsOutput) return;
  try {
    const data = await apiPost("/api/skills/reload", {});
    const errors = Array.isArray(data.errors) ? data.errors.length : Number(data.errors || 0);
    skillsOutput.textContent = `Reloaded skills registry: ${data.total || 0} skill(s), errors: ${errors}.`;
    refreshSkillsList();
  } catch (error) {
    skillsOutput.textContent = `Reload failed: ${error.message}`;
  }
}

async function refreshMemory() {
  if (!memoryStats || !memoryPreview) {
    return;
  }

  try {
    const params = new URLSearchParams();
    params.set("limit", "12");
    if (activeChatThreadId) {
      params.set("chatId", normalizeChatThreadId(activeChatThreadId, DEFAULT_CHAT_THREAD_ID));
    }
    const data = await request(`/api/memory?${params.toString()}`);
    const memory = data.memory || {};
    memoryStats.textContent = `Turns: ${memory.totalTurns || 0} | Updated: ${memory.updatedAt ? new Date(memory.updatedAt).toLocaleTimeString() : "n/a"}`;

    memoryPreview.innerHTML = "";
    const turns = Array.isArray(memory.turns) ? memory.turns.slice().reverse() : [];
    if (turns.length === 0) {
      const row = document.createElement("div");
      row.textContent = "Memory is empty.";
      memoryPreview.appendChild(row);
      return;
    }

    for (const turn of turns) {
      const row = document.createElement("div");
      const prefix = `[${String(turn.role || "unknown").toUpperCase()}]`;
      const text = String(turn.text || "").replace(/\s+/g, " ").trim();
      const clipped = text.length > 120 ? `${text.slice(0, 117)}...` : text;
      const imageNote = Array.isArray(turn.images) && turn.images.length > 0
        ? ` (images: ${turn.images.length})`
        : "";
      const fileNote = Array.isArray(turn.files) && turn.files.length > 0
        ? ` (files: ${turn.files.length})`
        : "";
      row.textContent = `${prefix} ${clipped}${imageNote}${fileNote}`;
      memoryPreview.appendChild(row);
    }
  } catch (error) {
    memoryStats.textContent = `Memory unavailable: ${error.message}`;
  }
}

function formatLedgerStatus(value) {
  return String(value || "planned").replace(/_/g, " ");
}

function formatLedgerPriority(value) {
  return String(value || "normal").toLowerCase();
}

function renderTaskLedgerTasks(tasks = []) {
  if (!taskLedgerList) return;
  taskLedgerList.innerHTML = "";
  if (!Array.isArray(tasks) || tasks.length < 1) {
    const empty = document.createElement("div");
    empty.textContent = "No tasks match the current filter.";
    taskLedgerList.appendChild(empty);
    return;
  }

  for (const task of tasks) {
    const taskId = String(task.id || "");
    const node = document.createElement("div");
    node.className = "ledger-task";

    const head = document.createElement("div");
    head.className = "ledger-task-head";

    const title = document.createElement("div");
    title.className = "ledger-task-title";
    title.textContent = task.title || taskId || "Task";

    const meta = document.createElement("div");
    meta.className = "ledger-task-meta";
    const updatedAt = task.updatedAt ? new Date(task.updatedAt).toLocaleString() : "n/a";
    meta.textContent = `${formatLedgerStatus(task.status)} | ${formatLedgerPriority(task.priority)} | ${Math.max(0, Math.min(100, Number(task.progress || 0)))}% | ${updatedAt}`;

    head.appendChild(title);
    head.appendChild(meta);
    node.appendChild(head);

    if (task.description) {
      const desc = document.createElement("div");
      desc.className = "ledger-task-desc";
      desc.textContent = String(task.description);
      node.appendChild(desc);
    }

    const actions = document.createElement("div");
    actions.className = "ledger-task-actions";
    const addAction = (action, label) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.taskId = taskId;
      button.dataset.action = action;
      button.textContent = label;
      actions.appendChild(button);
    };

    if (!task.archived && task.status !== "in_progress") addAction("start", "Start");
    if (!task.archived && task.status !== "review") addAction("review", "Review");
    if (!task.archived && task.status !== "blocked") addAction("block", "Block");
    if (!task.archived && task.status !== "done") addAction("done", "Done");
    if (!task.archived) {
      addAction("archive", "Archive");
    } else {
      addAction("unarchive", "Unarchive");
    }
    addAction("note", "Add Note");

    node.appendChild(actions);
    taskLedgerList.appendChild(node);
  }
}

function renderTaskLedgerEvents(events = []) {
  if (!taskLedgerEvents) return;
  taskLedgerEvents.innerHTML = "";
  if (!Array.isArray(events) || events.length < 1) {
    const empty = document.createElement("div");
    empty.textContent = "No events yet.";
    taskLedgerEvents.appendChild(empty);
    return;
  }
  for (const event of events) {
    const row = document.createElement("div");
    const stamp = event.at ? new Date(event.at).toLocaleString() : "n/a";
    const actor = String(event.actor || "system");
    const type = String(event.type || "task_event");
    const note = String(event.note || "").replace(/\s+/g, " ").trim();
    const clipped = note.length > 140 ? `${note.slice(0, 137)}...` : note;
    row.textContent = `${stamp} | ${event.taskId || "-"} | ${type} | ${actor}${clipped ? ` | ${clipped}` : ""}`;
    taskLedgerEvents.appendChild(row);
  }
}

function buildTaskLedgerStateUrl() {
  const params = new URLSearchParams();
  params.set("taskLimit", "60");
  params.set("eventLimit", "24");
  params.set("taskStatus", String(taskLedgerStatusFilter?.value || "all"));
  params.set("taskPriority", String(taskLedgerPriorityFilter?.value || "all"));
  params.set("includeArchived", String(Boolean(taskLedgerIncludeArchived?.checked)));
  const scope = getActiveProjectScope();
  if (scope?.id && scope.id !== "all") {
    params.set("projectScope", String(scope.id));
  }
  const q = String(taskLedgerQuery?.value || "").trim();
  if (q) {
    params.set("taskQuery", q);
  }
  return `/api/task-ledger/state?${params.toString()}`;
}

async function refreshTaskLedger(options = {}) {
  if (!taskLedgerStats || !taskLedgerList || !taskLedgerEvents) {
    return;
  }
  const silent = Boolean(options.silent);
  try {
    const data = await request(buildTaskLedgerStateUrl());
    const ledger = data.ledger || {};
    const summary = ledger.summary || {};
    const projectScope = data.projectScope && typeof data.projectScope === "object"
      ? data.projectScope
      : {};
    const scopeLabel = String(projectScope.label || getActiveProjectScope().label || "All Projects");
    const tasks = Array.isArray(ledger.tasks) ? ledger.tasks : [];
    const events = Array.isArray(ledger.events) ? ledger.events : [];
    const totalTasks = Number.isFinite(Number(summary.totalTasks)) ? Number(summary.totalTasks) : 0;
    const openTasks = Number.isFinite(Number(summary.openTasks)) ? Number(summary.openTasks) : 0;
    const archivedTasks = Number.isFinite(Number(summary.archivedTasks)) ? Number(summary.archivedTasks) : 0;
    const eventsCount = Number.isFinite(Number(summary.eventsCount)) ? Number(summary.eventsCount) : 0;

    taskLedgerStats.textContent = `Scope: ${scopeLabel} | Tasks: ${totalTasks} | Open: ${openTasks} | Archived: ${archivedTasks} | Events: ${eventsCount}`;
    chatExecutionMetrics = computeChatExecutionMetrics(tasks, events);
    renderChatExecutionChip();
    renderTaskLedgerTasks(tasks);
    renderTaskLedgerEvents(events);
    chatRailTasks = tasks.slice(0, 40);
    renderChatRailTasks();
    renderChatThreadList();
  } catch (error) {
    taskLedgerStats.textContent = `Task ledger unavailable: ${error.message}`;
    if (!silent) {
      logEvent(`Task ledger refresh failed: ${error.message}`);
    }
  }
}

async function setTaskLedgerTaskStatus(taskId, status, options = {}) {
  const id = String(taskId || "").trim();
  if (!id) return;
  await request(`/api/task-ledger/tasks/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status,
      actor: "web-ui",
      source: "web-ui",
      note: options.note || ""
    })
  });
}

async function archiveTaskLedgerTask(taskId) {
  const id = String(taskId || "").trim();
  if (!id) return;
  await request(`/api/task-ledger/tasks/${encodeURIComponent(id)}`, {
    method: "DELETE"
  });
}

async function unarchiveTaskLedgerTask(taskId) {
  const id = String(taskId || "").trim();
  if (!id) return;
  await request(`/api/task-ledger/tasks/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      archived: false,
      status: "planned",
      actor: "web-ui",
      source: "web-ui",
      note: "Unarchived from web UI."
    })
  });
}

async function addTaskLedgerNote(taskId) {
  const id = String(taskId || "").trim();
  if (!id) return;
  const note = window.prompt("Task event note:");
  if (note === null) return;
  await request(`/api/task-ledger/tasks/${encodeURIComponent(id)}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "task_note",
      note: String(note || "").trim() || "UI note",
      actor: "web-ui",
      source: "web-ui"
    })
  });
}

async function createTaskLedgerTaskFromUi() {
  const title = String(taskLedgerTitle?.value || "").trim();
  const description = String(taskLedgerDescription?.value || "").trim();
  if (!title && !description) {
    throw new Error("Task title or description is required.");
  }
  const scope = getActiveProjectScope();
  const marker = String(scope.marker || "").trim();
  let scopedTitle = title;
  if (marker) {
    if (scopedTitle) {
      if (!scopedTitle.toUpperCase().includes(marker.toUpperCase())) {
        scopedTitle = `${marker} ${scopedTitle}`;
      }
    } else {
      scopedTitle = `${marker} Task`;
    }
  }
  const scopedDescription = description || (marker ? `Project scope: ${scope.label}` : "");
  const priority = String(taskLedgerCreatePriority?.value || "normal");
  const scopedProjectId = scope?.id && scope.id !== "all" ? String(scope.id) : "";
  const data = await apiPost("/api/task-ledger/tasks", {
    title: scopedTitle,
    description: scopedDescription,
    priority,
    projectScope: scopedProjectId,
    actor: "web-ui",
    source: "web-ui"
  });
  if (taskLedgerTitle) taskLedgerTitle.value = "";
  if (taskLedgerDescription) taskLedgerDescription.value = "";
  return data;
}

async function handleTaskLedgerAction(action, taskId) {
  const id = String(taskId || "").trim();
  if (!id) return;
  if (action === "start") {
    await setTaskLedgerTaskStatus(id, "in_progress", { note: "Moved to in_progress from web UI." });
  } else if (action === "review") {
    await setTaskLedgerTaskStatus(id, "review", { note: "Moved to review from web UI." });
  } else if (action === "block") {
    await setTaskLedgerTaskStatus(id, "blocked", { note: "Marked blocked from web UI." });
  } else if (action === "done") {
    await setTaskLedgerTaskStatus(id, "done", { note: "Marked done from web UI." });
    showCloseLoopDoneToast(id, getTaskLinkedChatId(id));
  } else if (action === "archive") {
    await archiveTaskLedgerTask(id);
  } else if (action === "unarchive") {
    await unarchiveTaskLedgerTask(id);
  } else if (action === "note") {
    await addTaskLedgerNote(id);
  } else {
    throw new Error(`Unknown task action: ${action}`);
  }
}

async function queueChatCommand(command, sourceMeta = "Asolaria Router") {
  const data = await apiPost("/api/chat", { message: String(command || "").trim() });
  if (data.mode === "routed") {
    pushMessage("brain", String(data.reply || "Done."), sourceMeta);
    logEvent(`Command completed: ${command}`);
    refreshHealth();
    refreshMemory();
    return;
  }

  if (data.job?.id) {
    const messageRef = createMessage(
      "brain",
      `${data.reply}\nWaiting for job completion...`,
      `Asolaria Brain (${data.job.id})`
    );
    trackJob(data.job.id, {
      onUpdate: (job) => {
        updateMessageBody(
          messageRef,
          `Job ${job.id} status: ${job.status}...`,
          `Asolaria Brain (${job.id})`
        );
      },
      onCompleted: (job) => {
        updateMessageBody(
          messageRef,
          formatJobResult(job),
          `Asolaria Brain (${job.id}, ${job.elapsedMs || 0}ms)`
        );
        logEvent(`Command job completed: ${job.id}`);
        refreshHealth();
        refreshMemory();
      },
      onFailed: (job) => {
        updateMessageBody(
          messageRef,
          `Job failed: ${job.error || "Unknown error"}`,
          `Asolaria Brain (${job.id || "unknown"})`
        );
        logEvent(`Command job failed: ${job.error || "Unknown error"}`);
        refreshHealth();
        refreshMemory();
      }
    });
    return;
  }

  pushMessage("brain", String(data.reply || "Done."), sourceMeta);
  refreshHealth();
  refreshMemory();
}

async function queueOpenclawAction(action, payload = {}) {
  if (!openclawOutput) {
    return;
  }

  openclawOutput.textContent = `Queued ${action}...`;
  const data = await apiPost("/api/openclaw/action", { action, payload });
  const jobId = data.job?.id;
  if (!jobId) {
    openclawOutput.textContent = "OpenClaw action queued with no job id.";
    return;
  }

  logEvent(`OpenClaw action queued: ${action} (${jobId})`);
  openclawOutput.textContent = `Tracking OpenClaw job: ${jobId}`;
  trackJob(jobId, {
    onUpdate: (job) => {
      openclawOutput.textContent = `OpenClaw ${action}: ${job.status}`;
    },
    onCompleted: (job) => {
      openclawOutput.textContent = `Completed ${action}.`;
      pushMessage("brain", formatJobResult(job), `OpenClaw (${job.id})`);
      refreshHealth();
    },
    onFailed: (job) => {
      openclawOutput.textContent = `Failed ${action}: ${job.error || "Unknown error"}`;
      logEvent(`OpenClaw action failed: ${job.error || "Unknown error"}`);
      refreshHealth();
    }
  });
}

async function queueExternalProvider(provider, prompt, options = {}) {
  if (!externalOutput) {
    return;
  }

  const providerId = normalizeExternalProviderId(provider);
  const model = normalizeExternalDefaultModelValue(options.model || "");
  externalOutput.textContent = model ? `Queued ${providerId} (${model})...` : `Queued ${providerId}...`;
  const payload = { provider: providerId, prompt };
  if (model) {
    payload.model = model;
  }
  const data = await apiPost("/api/providers/external/run", payload);
  const jobId = data.job?.id;
  if (!jobId) {
    externalOutput.textContent = "External provider queued with no job id.";
    return;
  }

  logEvent(`External provider queued: ${providerId} (${jobId})`);
  externalOutput.textContent = `Tracking ${providerId} job: ${jobId}`;
  trackJob(jobId, {
    onUpdate: (job) => {
      const jobModel = String(job?.result?.model || model || "").trim();
      externalOutput.textContent = `${providerId}${jobModel ? ` (${jobModel})` : ""} job ${job.status}`;
    },
    onCompleted: (job) => {
      const jobModel = String(job?.result?.model || model || "").trim();
      externalOutput.textContent = `${providerId}${jobModel ? ` (${jobModel})` : ""} completed.`;
      pushMessage("brain", formatJobResult(job), `${providerId}${jobModel ? `/${jobModel}` : ""} (${job.id})`);
      refreshHealth();
    },
    onFailed: (job) => {
      externalOutput.textContent = `${providerId} failed: ${job.error || "Unknown error"}`;
      logEvent(`External provider failed: ${job.error || "Unknown error"}`);
      refreshHealth();
    }
  });
}

async function showCompanyAccountMasked() {
  const data = await request("/api/company/primary-signin");
  const account = data.account || null;
  const vault = data.vault || null;
  const text = JSON.stringify({ account, vault }, null, 2);
  if (companyAccountOutput) {
    companyAccountOutput.textContent = account
      ? `Account loaded (${account.status || "draft"}).`
      : "No company primary sign-in profile yet.";
  }
  pushMessage("brain", text, "Company Account");
}

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const text = chatInput.value.trim();
  if (!text) return;

  const activeChatId = normalizeChatThreadId(activeChatThreadId, DEFAULT_CHAT_THREAD_ID);
  appendTurnToThread(activeChatId, {
    role: "user",
    text,
    at: new Date().toISOString(),
    meta: {
      source: "ui",
      chatId: activeChatId,
      routeMode: chatRouteMode
    }
  });
  renderActiveChatMessages();
  chatSend.disabled = true;

  try {
    let uploadedImages = [];
    if ((chatImages?.files?.length || 0) > 0) {
      logEvent(`Uploading ${chatImages.files.length} image(s)...`);
      uploadedImages = await uploadSelectedImages();
      if (uploadedImages.length > 0) {
        logEvent(`Image ingest ready (${uploadedImages.length}).`);
      }
    }

    let uploadedFiles = [];
    if ((chatFiles?.files?.length || 0) > 0) {
      logEvent(`Uploading ${chatFiles.files.length} file(s)...`);
      uploadedFiles = await uploadSelectedFiles();
      if (uploadedFiles.length > 0) {
        logEvent(`File ingest ready (${uploadedFiles.length}).`);
      }
    }

    const data = await apiPost("/api/chat", {
      message: text,
      images: uploadedImages,
      files: uploadedFiles,
      chatId: activeChatId,
      routeMode: chatRouteMode
    });
    logEvent(data.reply || "Chat request accepted.");

    if (data.mode === "routed") {
      appendTurnToThread(activeChatId, {
        role: "assistant",
        text: String(data.reply || "Routed command finished."),
        at: new Date().toISOString(),
        meta: {
          source: "router",
          chatId: activeChatId
        }
      });
      renderActiveChatMessages();
      chatInput.value = "";
      if (chatImages) chatImages.value = "";
      if (chatFiles) chatFiles.value = "";
      setChatImageStatus();
      setChatFileStatus();
      loadConversationTurns(activeChatId, { render: activeChatId === activeChatThreadId }).catch(() => {});
      refreshMemory();
      return;
    }

    if (data.job?.id) {
      const messageRef = createMessage(
        "brain",
        `${data.reply}\nWaiting for job completion...`,
        `Asolaria Brain (${data.job.id})`
      );

      trackJob(data.job.id, {
        onUpdate: (job) => {
          updateMessageBody(
            messageRef,
            `Job ${job.id} status: ${job.status}...`,
            `Asolaria Brain (${job.id})`
          );
        },
        onCompleted: (job) => {
          updateMessageBody(
            messageRef,
            formatJobResult(job),
            `Asolaria Brain (${job.id}, ${job.elapsedMs || 0}ms)`
          );
          logEvent(`Brain job completed: ${job.id}`);
          loadConversationTurns(activeChatId, { render: activeChatId === activeChatThreadId }).catch(() => {});
          refreshHealth();
          refreshMemory();
        },
        onFailed: (job) => {
          updateMessageBody(
            messageRef,
            `Job failed: ${job.error || "Unknown error"}`,
            `Asolaria Brain (${job.id || "unknown"})`
          );
          logEvent(`Brain job failed: ${job.error || "Unknown error"}`);
          loadConversationTurns(activeChatId, { render: activeChatId === activeChatThreadId }).catch(() => {});
          refreshHealth();
          refreshMemory();
        }
      });
      chatInput.value = "";
      if (chatImages) chatImages.value = "";
      if (chatFiles) chatFiles.value = "";
      setChatImageStatus();
      setChatFileStatus();
      return;
    }

    appendTurnToThread(activeChatId, {
      role: "assistant",
      text: String(data.reply || "Task accepted."),
      at: new Date().toISOString(),
      meta: {
        source: "brain",
        chatId: activeChatId
      }
    });
    renderActiveChatMessages();
    chatInput.value = "";
    if (chatImages) chatImages.value = "";
    if (chatFiles) chatFiles.value = "";
    setChatImageStatus();
    setChatFileStatus();
    loadConversationTurns(activeChatId, { render: activeChatId === activeChatThreadId }).catch(() => {});
    refreshMemory();
  } catch (error) {
    appendTurnToThread(activeChatId, {
      role: "assistant",
      text: String(error.message || "Unknown error"),
      at: new Date().toISOString(),
      meta: {
        source: "error",
        chatId: activeChatId
      }
    });
    renderActiveChatMessages();
    logEvent(`Chat failed: ${error.message}`);
  } finally {
    chatSend.disabled = false;
    chatInput.focus();
  }
});

if (chatImages) {
  chatImages.addEventListener("change", setChatImageStatus);
}

if (chatFiles) {
  chatFiles.addEventListener("change", setChatFileStatus);
}

if (chatNewThreadBtn) {
  chatNewThreadBtn.addEventListener("click", () => {
    createNewChatThread();
    refreshMemory();
  });
}

if (chatRenameThreadBtn) {
  chatRenameThreadBtn.addEventListener("click", () => {
    renameActiveChatThread();
  });
}

if (chatRouteModeSelect) {
  chatRouteModeSelect.addEventListener("change", () => {
    chatRouteMode = normalizeChatRouteMode(chatRouteModeSelect.value);
    chatRouteModeSelect.value = chatRouteMode;
    saveChatWorkspaceState();
    logEvent(`Chat route mode set to ${chatRouteMode === "deep" ? "Deep Agent Style" : "RouteLLM"}.`);
  });
}

if (chatEscalateBtn) {
  chatEscalateBtn.addEventListener("click", () => {
    chatRouteMode = "deep";
    if (chatRouteModeSelect) {
      chatRouteModeSelect.value = "deep";
    }
    saveChatWorkspaceState();
    logEvent("Deep route mode armed for the next chat request.");
    chatInput.focus();
  });
}

function handleChatThreadCardClick(event) {
  const target = event.target instanceof HTMLElement ? event.target : null;
  if (!target) return;
  const button = target.closest("button[data-action]");
  if (!button) return;
  const action = String(button.dataset.action || "").trim();
  const chatId = String(button.dataset.chatId || "").trim();
  const taskId = String(button.dataset.taskId || "").trim();
  if (action === "open-linked-task" && taskId) {
    startOrOpenTaskConversation(taskId);
    applyChatRailSection("tasks");
    refreshChatRailTasks({ silent: true }).catch(() => {});
    return;
  }
  if (action === "link-chat-task" || action === "relink-chat-task") {
    promptAndLinkChatToTask(chatId, { relink: action === "relink-chat-task", taskId });
    return;
  }
  if (!chatId) return;
  if (action === "toggle-chat-pin") {
    togglePinnedChatThread(chatId);
    return;
  }
  if (action === "open-chat-thread") {
    setActiveChatThread(chatId, { load: true });
    refreshMemory();
  }
}

if (chatThreadList) {
  chatThreadList.addEventListener("click", handleChatThreadCardClick);
}

if (chatPinnedThreadList) {
  chatPinnedThreadList.addEventListener("click", handleChatThreadCardClick);
}

if (chatRecentlyActiveThreadList) {
  chatRecentlyActiveThreadList.addEventListener("click", handleChatThreadCardClick);
}

if (chatClearFocusBtn) {
  chatClearFocusBtn.addEventListener("click", () => {
    clearFocusThreads();
  });
}

if (chatThreadSearch) {
  chatThreadSearch.addEventListener("input", () => {
    renderChatThreadList();
  });
}

if (nextActionPrimaryBtn) {
  nextActionPrimaryBtn.addEventListener("click", () => {
    recordSafetyMetric("nbaClicked");
    runPrimaryNextAction();
  });
}

if (nextActionSecondaryBtn) {
  nextActionSecondaryBtn.addEventListener("click", () => {
    createNewChatThread();
    refreshMemory();
  });
}

if (closeLoopMarkDoneBtn) {
  closeLoopMarkDoneBtn.addEventListener("click", async () => {
    const chatId = normalizeChatThreadId(String(closeLoopMarkDoneBtn.dataset.chatId || "").trim(), "");
    const taskId = String(closeLoopMarkDoneBtn.dataset.taskId || "").trim();
    if (!chatId || !taskId) {
      return;
    }
    closeLoopMarkDoneBtn.disabled = true;
    recordSafetyMetric("resolveClicks");
    try {
      await setTaskLedgerTaskStatus(taskId, "done", { note: "Closed loop from conversation inactivity prompt." });
      setCloseLoopDismissed(chatId);
      showCloseLoopDoneToast(taskId, chatId);
      logEvent(`Task ${taskId} resolved as done from close-loop prompt.`);
      refreshTaskLedger({ silent: true }).catch(() => {});
      refreshChatRailTasks({ silent: true }).catch(() => {});
      renderChatThreadList();
    } catch (error) {
      logEvent(`Close-loop mark done failed: ${error.message}`);
    } finally {
      closeLoopMarkDoneBtn.disabled = false;
    }
  });
}

if (closeLoopToastReopenBtn) {
  closeLoopToastReopenBtn.addEventListener("click", async () => {
    const taskId = String(closeLoopToastState.taskId || "").trim();
    const chatId = normalizeChatThreadId(String(closeLoopToastState.chatId || "").trim(), "");
    if (!taskId) {
      return;
    }
    closeLoopToastReopenBtn.disabled = true;
    recordSafetyMetric("reopenClicks");
    try {
      await setTaskLedgerTaskStatus(taskId, "in_progress", { note: "Reopened from done toast in web UI." });
      if (chatId) {
        clearCloseLoopDismissed(chatId);
        setActiveChatThread(chatId, { load: true });
      }
      if (closeLoopToastText) {
        closeLoopToastText.textContent = "↩ Reopened and set to In Progress.";
      }
      if (closeLoopToastTimer) {
        window.clearTimeout(closeLoopToastTimer);
      }
      closeLoopToastTimer = window.setTimeout(() => {
        hideCloseLoopToast();
      }, 3000);
      refreshTaskLedger({ silent: true }).catch(() => {});
      refreshChatRailTasks({ silent: true }).catch(() => {});
      renderChatThreadList();
      logEvent(`Task ${taskId} reopened from done toast.`);
    } catch (error) {
      logEvent(`Reopen failed: ${error.message}`);
      closeLoopToastReopenBtn.disabled = false;
      return;
    }
    closeLoopToastReopenBtn.disabled = false;
  });
}

if (closeLoopResumeBtn) {
  closeLoopResumeBtn.addEventListener("click", () => {
    const chatId = normalizeChatThreadId(String(closeLoopResumeBtn.dataset.chatId || "").trim(), "");
    if (!chatId) {
      return;
    }
    setCloseLoopDismissed(chatId);
    setActiveChatThread(chatId, { load: true });
    chatInput.focus();
    logEvent("Close-loop prompt dismissed; conversation resumed.");
    refreshMemory();
  });
}

if (chatRailNav) {
  chatRailNav.addEventListener("click", (event) => {
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (!target) return;
    const button = target.closest(".chat-rail-nav-btn[data-chat-rail]");
    if (!button) return;
    const section = String(button.dataset.chatRail || "").trim();
    applyChatRailSection(section);
    if (section === "tasks") {
      refreshChatRailTasks({ silent: true });
    }
  });
}

function handleChatRailHotkeys(event) {
  const target = event.target instanceof HTMLElement ? event.target : null;
  const tag = String(target?.tagName || "").toLowerCase();
  if (target?.isContentEditable || tag === "input" || tag === "textarea" || tag === "select") {
    return;
  }
  if (event.altKey || event.ctrlKey || event.metaKey) {
    return;
  }
  const key = String(event.key || "").toLowerCase();
  const now = Date.now();
  if (key === "g") {
    chatGoShortcutUntilMs = now + 1200;
    return;
  }
  if (now > chatGoShortcutUntilMs) {
    return;
  }
  if (key === "t") {
    applyChatRailSection("apps");
    event.preventDefault();
  } else if (key === "w") {
    applyChatRailSection("tasks");
    refreshChatRailTasks({ silent: true });
    event.preventDefault();
  } else if (key === "c") {
    applyChatRailSection("chats");
    event.preventDefault();
  } else {
    return;
  }
  chatGoShortcutUntilMs = 0;
}

window.addEventListener("keydown", handleChatRailHotkeys);

if (chatTaskSearch) {
  chatTaskSearch.addEventListener("input", () => {
    renderChatRailTasks();
  });
}

if (chatTaskCardList) {
  chatTaskCardList.addEventListener("click", (event) => {
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (!target) return;
    const button = target.closest("button[data-action][data-task-id]");
    if (!button) return;
    const action = String(button.dataset.action || "").trim();
    const taskId = String(button.dataset.taskId || "").trim();
    if (!taskId) return;
    if (action === "task-open-chat") {
      startOrOpenTaskConversation(taskId);
      return;
    }
    injectTaskIntoChat(taskId);
  });
}

document.getElementById("openChromeForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const url = document.getElementById("chromeUrl").value.trim();
  if (!url) return;
  if (stealthMode) {
    logEvent("Blocked: Stealth Mode prevents visible Chrome launch.");
    return;
  }

  try {
    const data = await apiPost("/api/chrome/open", { url });
    logEvent(`Chrome launched: ${data.opened}`);
  } catch (error) {
    logEvent(`Open Chrome failed: ${error.message}`);
  }
});

document.getElementById("shotForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const url = document.getElementById("shotUrl").value.trim();
  const fileName = document.getElementById("shotFile").value.trim();
  if (!url) return;

  shotOutput.textContent = "Queued...";
  try {
    const data = await apiPost("/api/chrome/screenshot", { url, fileName });
    const jobId = data.job?.id;
    if (!jobId) {
      shotOutput.textContent = "No job id returned.";
      return;
    }

    shotOutput.textContent = `Tracking job: ${jobId}`;
    logEvent(`Screenshot queued: ${jobId}`);

    trackJob(jobId, {
      onUpdate: (job) => {
        shotOutput.textContent = `Job ${job.id}: ${job.status}`;
      },
      onCompleted: (job) => {
        shotOutput.textContent = `Saved: ${job.result?.outputPath || "unknown path"}`;
        logEvent(`Screenshot completed: ${job.id}`);
        refreshHealth();
      },
      onFailed: (job) => {
        shotOutput.textContent = `Failed: ${job.error || "Unknown error"}`;
        logEvent(`Screenshot failed: ${job.error || "Unknown error"}`);
        refreshHealth();
      }
    });
  } catch (error) {
    shotOutput.textContent = `Error: ${error.message}`;
    logEvent(`Screenshot request failed: ${error.message}`);
  }
});

if (skillsRefreshBtn) {
  skillsRefreshBtn.addEventListener("click", () => {
    refreshSkillsList();
  });
}

if (skillsReloadBtn) {
  skillsReloadBtn.addEventListener("click", () => {
    reloadSkillsRegistry();
  });
}

if (skillsRunForm) {
  skillsRunForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!skillsSelect || !skillsOutput) return;

    const id = String(skillsSelect.value || "").trim();
    if (!id) {
      skillsOutput.textContent = "Select a skill to run.";
      return;
    }

    const rawInput = String(skillsInput?.value || "").trim();
    let input = {};
    if (rawInput) {
      try {
        input = JSON.parse(rawInput);
      } catch (_error) {
        input = { text: rawInput };
      }
    }

    try {
      skillsOutput.textContent = `Queued skill "${id}"...`;
      const data = await apiPost("/api/skills/run", { id, input });
      const jobId = data.job?.id;
      if (!jobId) {
        skillsOutput.textContent = "Skill queued with no job id.";
        return;
      }

      skillsOutput.textContent = `Tracking skill job: ${jobId}`;
      logEvent(`Skill queued: ${id} (${jobId})`);

      trackJob(jobId, {
        onUpdate: (job) => {
          skillsOutput.textContent = `Skill ${id}: ${job.status}`;
        },
        onCompleted: (job) => {
          skillsOutput.textContent = `Completed ${id}.`;
          pushMessage("brain", formatJobResult(job), `Skill ${id} (${job.id})`);
          refreshHealth();
        },
        onFailed: (job) => {
          skillsOutput.textContent = `Failed ${id}: ${job.error || "Unknown error"}`;
          logEvent(`Skill failed: ${job.error || "Unknown error"}`);
          refreshHealth();
        }
      });
    } catch (error) {
      skillsOutput.textContent = `Error: ${error.message}`;
      logEvent(`Skill run failed: ${error.message}`);
    }
  });
}

document.getElementById("openPadBtn").addEventListener("click", async () => {
  if (stealthMode) {
    logEvent("Blocked: Stealth Mode prevents opening PAD UI.");
    return;
  }

  try {
    const data = await apiPost("/api/pad/open");
    logEvent(`PAD opened: ${data.opened}`);
  } catch (error) {
    logEvent(`Open PAD failed: ${error.message}`);
  }
});

if (openPhoneModeBtn) {
  openPhoneModeBtn.addEventListener("click", () => {
    const popup = window.open("/phone-mode.html", "_blank", "noopener");
    if (!popup) {
      logEvent("Phone mode popup blocked by browser.");
      return;
    }
    logEvent("Opened Asolaria phone mode.");
  });
}

if (stealthToggle) {
  stealthToggle.addEventListener("change", async () => {
    const next = Boolean(stealthToggle.checked);
    try {
      const data = await apiPost("/api/settings", { stealthMode: next });
      applySettingsUi(data.settings || {});
      logEvent(`Stealth Mode ${data.settings?.stealthMode ? "enabled" : "disabled"}.`);
      refreshHealth();
    } catch (error) {
      stealthToggle.checked = stealthMode;
      logEvent(`Stealth toggle failed: ${error.message}`);
    }
  });
}

if (approvalModeSelect) {
  approvalModeSelect.addEventListener("change", async () => {
    const requested = normalizeApprovalMode(approvalModeSelect.value);
    try {
      const data = await apiPost("/api/settings", { approvalMode: requested });
      applySettingsUi(data.settings || {});
      logEvent(`Approval mode set to ${approvalMode}.`);
      refreshHealth();
    } catch (error) {
      approvalModeSelect.value = approvalMode;
      logEvent(`Approval mode update failed: ${error.message}`);
    }
  });
}

if (costModeSelect) {
  costModeSelect.addEventListener("change", async () => {
    const requested = normalizeCostMode(costModeSelect.value);
    try {
      const data = await apiPost("/api/settings", { costMode: requested });
      applySettingsUi(data.settings || {});
      logEvent(`Cost mode set to ${costMode}.`);
      refreshHealth();
    } catch (error) {
      costModeSelect.value = costMode;
      logEvent(`Cost mode update failed: ${error.message}`);
    }
  });
}

if (codexWebSearchSelect) {
  codexWebSearchSelect.addEventListener("change", async () => {
    const requested = normalizeCodexWebSearch(codexWebSearchSelect.value);
    try {
      const data = await apiPost("/api/settings", { codexWebSearch: requested });
      applySettingsUi(data.settings || {});
      logEvent(`Codex web search ${codexWebSearch ? "enabled" : "disabled"}.`);
      refreshHealth();
    } catch (error) {
      codexWebSearchSelect.value = codexWebSearch ? "on" : "off";
      logEvent(`Codex web search update failed: ${error.message}`);
    }
  });
}

if (openclawModeSelect) {
  openclawModeSelect.addEventListener("change", async () => {
    const requested = normalizeOpenclawMode(openclawModeSelect.value);
    try {
      const data = await apiPost("/api/settings", { openclawMode: requested });
      applySettingsUi(data.settings || {});
      logEvent(`OpenClaw mode set to ${openclawMode}.`);
      refreshHealth();
    } catch (error) {
      openclawModeSelect.value = openclawMode;
      logEvent(`OpenClaw mode update failed: ${error.message}`);
    }
  });
}

if (allowExternalPostingToggle) {
  allowExternalPostingToggle.addEventListener("change", async () => {
    const requested = Boolean(allowExternalPostingToggle.checked);
    try {
      const data = await apiPost("/api/settings", { allowExternalPosting: requested });
      applySettingsUi(data.settings || {});
      logEvent(`allowExternalPosting set to ${allowExternalPosting}.`);
      refreshHealth();
    } catch (error) {
      allowExternalPostingToggle.checked = allowExternalPosting;
      logEvent(`allowExternalPosting update failed: ${error.message}`);
    }
  });
}

if (saveGuardianModeBtn && guardianModeSelect) {
  saveGuardianModeBtn.addEventListener("click", async () => {
    const requested = normalizeGuardianMode(guardianModeSelect.value);
    try {
      const data = await apiPost("/api/settings", { guardianMode: requested });
      applySettingsUi(data.settings || {});
      logEvent(`Guardian mode set to ${guardianMode}.`);
      refreshHealth();
    } catch (error) {
      guardianModeSelect.value = guardianMode;
      logEvent(`Guardian mode update failed: ${error.message}`);
    }
  });
}

if (saveGuardianThresholdBtn && guardianRiskThresholdSelect) {
  saveGuardianThresholdBtn.addEventListener("click", async () => {
    const requested = normalizeGuardianRiskThreshold(guardianRiskThresholdSelect.value);
    try {
      const data = await apiPost("/api/settings", { guardianRiskThreshold: requested });
      applySettingsUi(data.settings || {});
      logEvent(`Guardian risk threshold set to ${guardianRiskThreshold}.`);
      refreshHealth();
    } catch (error) {
      guardianRiskThresholdSelect.value = guardianRiskThreshold;
      logEvent(`Guardian threshold update failed: ${error.message}`);
    }
  });
}

if (guardianAlertsEnabledToggle) {
  guardianAlertsEnabledToggle.addEventListener("change", async () => {
    const requested = Boolean(guardianAlertsEnabledToggle.checked);
    try {
      const data = await apiPost("/api/settings", { guardianAlertsEnabled: requested });
      applySettingsUi(data.settings || {});
      logEvent(`Guardian alerts ${guardianAlertsEnabled ? "enabled" : "disabled"}.`);
      refreshHealth();
    } catch (error) {
      guardianAlertsEnabledToggle.checked = guardianAlertsEnabled;
      logEvent(`Guardian alerts update failed: ${error.message}`);
    }
  });
}

if (guardianAutoBlockCriticalToggle) {
  guardianAutoBlockCriticalToggle.addEventListener("change", async () => {
    const requested = Boolean(guardianAutoBlockCriticalToggle.checked);
    try {
      const data = await apiPost("/api/settings", { guardianAutoBlockCritical: requested });
      applySettingsUi(data.settings || {});
      logEvent(`Guardian auto-block critical ${guardianAutoBlockCritical ? "enabled" : "disabled"}.`);
      refreshHealth();
    } catch (error) {
      guardianAutoBlockCriticalToggle.checked = guardianAutoBlockCritical;
      logEvent(`Guardian auto-block update failed: ${error.message}`);
    }
  });
}

if (saveMemoryWindowBtn) {
  saveMemoryWindowBtn.addEventListener("click", async () => {
    const requested = normalizeMemoryWindow(memoryWindowTurnsInput?.value);
    try {
      const data = await apiPost("/api/settings", { memoryWindowTurns: requested });
      applySettingsUi(data.settings || {});
      logEvent(`Memory window set to ${memoryWindowTurns} turns.`);
      refreshHealth();
    } catch (error) {
      if (memoryWindowTurnsInput) {
        memoryWindowTurnsInput.value = String(memoryWindowTurns);
      }
      logEvent(`Memory window update failed: ${error.message}`);
    }
  });
}

document.querySelectorAll(".openclaw-action").forEach((button) => {
  button.addEventListener("click", async () => {
    const action = String(button.dataset.action || "").trim();
    if (!action) return;

    try {
      await queueOpenclawAction(action);
    } catch (error) {
      if (openclawOutput) {
        openclawOutput.textContent = `Error: ${error.message}`;
      }
      logEvent(`OpenClaw request failed: ${error.message}`);
    }
  });
});

if (openclawCronRunForm) {
  openclawCronRunForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = String(openclawCronName?.value || "").trim();
    if (!name) {
      if (openclawOutput) openclawOutput.textContent = "Cron name is required.";
      return;
    }

    try {
      await queueOpenclawAction("cron_run", { name });
    } catch (error) {
      if (openclawOutput) {
        openclawOutput.textContent = `Error: ${error.message}`;
      }
      logEvent(`OpenClaw cron run failed: ${error.message}`);
    }
  });
}

if (gatewayAuditRefreshBtn) {
  gatewayAuditRefreshBtn.addEventListener("click", () => {
    refreshGatewayAuditPanel();
  });
}

if (gatewayAuditVerifyBtn) {
  gatewayAuditVerifyBtn.addEventListener("click", () => {
    verifyGatewayAuditChain();
  });
}

if (gatewayReadinessDrillBtn) {
  gatewayReadinessDrillBtn.addEventListener("click", () => {
    runGatewayReadinessDrill();
  });
}

if (gatewayHeartbeatRunBtn) {
  gatewayHeartbeatRunBtn.addEventListener("click", () => {
    runGatewayHeartbeat();
  });
}

if (gatewayStartSandboxBtn) {
  gatewayStartSandboxBtn.addEventListener("click", () => {
    startGatewaySandboxRemediation();
  });
}

if (gatewayAuditTypeSelect) {
  gatewayAuditTypeSelect.addEventListener("change", () => {
    refreshGatewayAuditPanel({ silent: true });
  });
}

if (railFilter) {
  railFilter.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const button = target.closest(".rail-filter-btn");
    if (!button) {
      return;
    }
    const group = String(button.dataset.group || "all").trim().toLowerCase() || "all";
    applyActionGroupFilter(group);
  });
}

if (projectNav) {
  projectNav.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const button = target.closest(".project-pill");
    if (!button) {
      return;
    }
    const scopeId = String(button.dataset.project || "all");
    applyProjectScope(scopeId, { syncGroupFilter: true, refreshLedger: true });
  });
}

if (projectFolderSearch) {
  projectFolderSearch.addEventListener("input", () => {
    renderProjectFolderTree(activeProjectScope);
  });
}

if (projectRefreshBtn) {
  projectRefreshBtn.addEventListener("click", async () => {
    try {
      await refreshProjectScopes({
        preferredScopeId: activeProjectScope,
        syncGroupFilter: true,
        refreshLedger: true
      });
    } catch (error) {
      setProjectAdminMessage(`Refresh failed: ${error.message}`, true);
      logEvent(`Project refresh failed: ${error.message}`);
    }
  });
}

if (projectCreateBtn) {
  projectCreateBtn.addEventListener("click", async () => {
    try {
      await createProjectFromUi();
    } catch (error) {
      setProjectAdminMessage(`Create failed: ${error.message}`, true);
      logEvent(`Project create failed: ${error.message}`);
    }
  });
}

if (projectUpdateBtn) {
  projectUpdateBtn.addEventListener("click", async () => {
    try {
      await updateSelectedProjectFromUi();
    } catch (error) {
      setProjectAdminMessage(`Update failed: ${error.message}`, true);
      logEvent(`Project update failed: ${error.message}`);
    }
  });
}

if (projectDeleteBtn) {
  projectDeleteBtn.addEventListener("click", async () => {
    try {
      await deleteSelectedProjectFromUi();
    } catch (error) {
      setProjectAdminMessage(`Delete failed: ${error.message}`, true);
      logEvent(`Project delete failed: ${error.message}`);
    }
  });
}

if (antigravityStatusBtn) {
  antigravityStatusBtn.addEventListener("click", async () => {
    try {
      await queueChatCommand("antigravity status", "Antigravity Status");
    } catch (error) {
      if (externalOutput) externalOutput.textContent = `Error: ${error.message}`;
      logEvent(`Antigravity status failed: ${error.message}`);
    }
  });
}

if (cursorStatusBtn) {
  cursorStatusBtn.addEventListener("click", async () => {
    try {
      await queueChatCommand("cursor status", "Cursor Status");
    } catch (error) {
      if (externalOutput) externalOutput.textContent = `Error: ${error.message}`;
      logEvent(`Cursor status failed: ${error.message}`);
    }
  });
}

if (anthropicStatusBtn) {
  anthropicStatusBtn.addEventListener("click", async () => {
    try {
      await queueChatCommand("anthropic status", "Anthropic Status");
    } catch (error) {
      if (externalOutput) externalOutput.textContent = `Error: ${error.message}`;
      logEvent(`Anthropic status failed: ${error.message}`);
    }
  });
}

if (geminiCliStatusBtn) {
  geminiCliStatusBtn.addEventListener("click", async () => {
    try {
      await queueChatCommand("gemini cli status", "Gemini CLI Status");
    } catch (error) {
      if (externalOutput) externalOutput.textContent = `Error: ${error.message}`;
      logEvent(`Gemini CLI status failed: ${error.message}`);
    }
  });
}

if (externalProviderSelect) {
  externalProviderSelect.addEventListener("change", () => {
    refreshExternalModelInputUi({ syncValue: true, forceValue: true });
  });
}

if (externalSaveDefaultBtn) {
  externalSaveDefaultBtn.addEventListener("click", async () => {
    const provider = normalizeExternalProviderId(externalProviderSelect?.value || "");
    const model = normalizeExternalDefaultModelValue(externalModelInput?.value || "");
    try {
      await saveExternalDefaultModel(provider, model);
      if (externalOutput) {
        externalOutput.textContent = model
          ? `Default model saved for ${provider}: ${model}`
          : `Default model cleared for ${provider}.`;
      }
      refreshHealth();
      await refreshExternalModelAliases({ silent: true });
    } catch (error) {
      if (externalOutput) externalOutput.textContent = `Error: ${error.message}`;
      logEvent(`Save default model failed: ${error.message}`);
    }
  });
}

if (externalClearDefaultBtn) {
  externalClearDefaultBtn.addEventListener("click", async () => {
    const provider = normalizeExternalProviderId(externalProviderSelect?.value || "");
    try {
      await saveExternalDefaultModel(provider, "");
      if (externalOutput) {
        externalOutput.textContent = `Default model cleared for ${provider}.`;
      }
      if (externalModelInput) {
        externalModelInput.value = "";
      }
      refreshHealth();
      await refreshExternalModelAliases({ silent: true });
    } catch (error) {
      if (externalOutput) externalOutput.textContent = `Error: ${error.message}`;
      logEvent(`Clear default model failed: ${error.message}`);
    }
  });
}

if (externalClearObservedBtn) {
  externalClearObservedBtn.addEventListener("click", async () => {
    const provider = normalizeExternalProviderId(externalProviderSelect?.value || "");
    try {
      await clearObservedExternalModels(provider);
      if (externalOutput) {
        externalOutput.textContent = `Observed models cleared for ${provider}.`;
      }
    } catch (error) {
      if (externalOutput) externalOutput.textContent = `Error: ${error.message}`;
      logEvent(`Clear observed models failed: ${error.message}`);
    }
  });
}

if (externalClearObservedAllBtn) {
  externalClearObservedAllBtn.addEventListener("click", async () => {
    try {
      await clearObservedExternalModels("all");
      if (externalOutput) {
        externalOutput.textContent = "Observed models cleared for all providers.";
      }
    } catch (error) {
      if (externalOutput) externalOutput.textContent = `Error: ${error.message}`;
      logEvent(`Clear observed models (all) failed: ${error.message}`);
    }
  });
}

if (externalPruneObservedBtn) {
  externalPruneObservedBtn.addEventListener("click", async () => {
    const provider = normalizeExternalProviderId(externalProviderSelect?.value || "");
    const maxAgeDays = readExternalObservedMaxAgeDays();
    try {
      const data = await pruneObservedExternalModels(provider, maxAgeDays);
      if (externalOutput) {
        externalOutput.textContent = `Observed models pruned for ${data.target || provider}: removed ${Number(data.removed || 0)} older than ${maxAgeDays} day(s).`;
      }
    } catch (error) {
      if (externalOutput) externalOutput.textContent = `Error: ${error.message}`;
      logEvent(`Prune observed models failed: ${error.message}`);
    }
  });
}

if (externalSaveObservedPruneSettingsBtn) {
  externalSaveObservedPruneSettingsBtn.addEventListener("click", async () => {
    const enabled = Boolean(externalObservedAutoPruneEnabledToggle?.checked);
    const maxAgeDays = readExternalObservedAutoPruneDays();
    const dailyHourLocal = readExternalObservedAutoPruneHour();
    try {
      const data = await apiPost("/api/settings", {
        externalObservedPruneEnabled: enabled,
        externalObservedPruneMaxAgeDays: maxAgeDays,
        externalObservedPruneDailyHourLocal: dailyHourLocal
      });
      applySettingsUi(data.settings || {});
      await refreshHealth();
      const hourText = `${String(dailyHourLocal).padStart(2, "0")}:00`;
      if (externalOutput) {
        externalOutput.textContent = `Auto-prune ${enabled ? "enabled" : "disabled"} (window ${maxAgeDays} day(s), hour ${hourText} local).`;
      }
      logEvent(`Observed model auto-prune saved: enabled=${enabled}, days=${maxAgeDays}, hour=${dailyHourLocal}.`);
    } catch (error) {
      if (externalOutput) externalOutput.textContent = `Error: ${error.message}`;
      logEvent(`Save auto-prune settings failed: ${error.message}`);
    }
  });
}

if (externalModelStatusBtn) {
  externalModelStatusBtn.addEventListener("click", async () => {
    const provider = normalizeExternalProviderId(externalProviderSelect?.value || "");
    try {
      await showExternalModelSettings(provider);
    } catch (error) {
      if (externalOutput) externalOutput.textContent = `Error: ${error.message}`;
      logEvent(`Model settings lookup failed: ${error.message}`);
    }
  });
}

if (externalRunForm) {
  externalRunForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const provider = normalizeExternalProviderId(externalProviderSelect?.value || "");
    let model = normalizeExternalDefaultModelValue(externalModelInput?.value || "");
    if (!model) {
      model = getExternalDefaultModel(provider);
    }
    const prompt = String(externalPrompt?.value || "").trim();
    if (!provider || !prompt) {
      if (externalOutput) externalOutput.textContent = "Provider and prompt are required.";
      return;
    }

    try {
      if (externalModelInput) {
        externalModelInput.value = model;
      }
      try {
        await saveExternalDefaultModel(provider, model, { silent: true });
      } catch (error) {
        logEvent(`External model default save failed: ${error.message}`);
      }
      await queueExternalProvider(provider, prompt, { model });
    } catch (error) {
      if (externalOutput) externalOutput.textContent = `Error: ${error.message}`;
      logEvent(`External provider run failed: ${error.message}`);
    }
  });
}

if (guardianStatusBtn) {
  guardianStatusBtn.addEventListener("click", async () => {
    try {
      const data = await request("/api/guardian/status");
      if (guardianOutput) {
        guardianOutput.textContent = `Contacts=${data.summary?.profile?.contacts?.length || 0}, alerts=${data.alerts?.total || 0}`;
      }
      pushMessage("brain", JSON.stringify(data, null, 2), "Guardian Status");
    } catch (error) {
      if (guardianOutput) guardianOutput.textContent = `Error: ${error.message}`;
      logEvent(`Guardian status failed: ${error.message}`);
    }
  });
}

if (guardianBootstrapContactsBtn) {
  guardianBootstrapContactsBtn.addEventListener("click", async () => {
    try {
      const data = await apiPost("/api/guardian/profile/bootstrap");
      if (guardianOutput) {
        guardianOutput.textContent = `Guardian contacts ready (${data.profile?.contacts?.length || 0}).`;
      }
      pushMessage("brain", JSON.stringify(data.profile || {}, null, 2), "Guardian Contacts");
      refreshHealth();
    } catch (error) {
      if (guardianOutput) guardianOutput.textContent = `Error: ${error.message}`;
      logEvent(`Guardian bootstrap failed: ${error.message}`);
    }
  });
}

if (guardianTestAlertBtn) {
  guardianTestAlertBtn.addEventListener("click", async () => {
    try {
      const data = await apiPost("/api/guardian/alert/test");
      if (guardianOutput) {
        guardianOutput.textContent = `Guardian test alert sent (${data.result?.alertId || "unknown"}).`;
      }
      pushMessage("brain", JSON.stringify(data.result || {}, null, 2), "Guardian Alert Test");
      refreshHealth();
    } catch (error) {
      if (guardianOutput) guardianOutput.textContent = `Error: ${error.message}`;
      logEvent(`Guardian test alert failed: ${error.message}`);
    }
  });
}

if (companyMissionBtn) {
  companyMissionBtn.addEventListener("click", async () => {
    try {
      const data = await request("/api/company/mission");
      pushMessage("brain", data.mission || "No mission text.", "Company Mission");
      logEvent("Loaded Company mission policy.");
    } catch (error) {
      logEvent(`Company mission failed: ${error.message}`);
    }
  });
}

if (companyCreateAccountBtn) {
  companyCreateAccountBtn.addEventListener("click", async () => {
    try {
      const data = await apiPost("/api/company/primary-signin/bootstrap", {
        displayName: "Asolaria"
      });
      const account = data.account || null;
      if (companyAccountOutput) {
        companyAccountOutput.textContent = account
          ? `AI account profile secured for ${account.usernameMasked || account.username || "Asolaria"}.`
          : "No account response.";
      }
      pushMessage("brain", JSON.stringify(account || {}, null, 2), "Company Account");
      refreshHealth();
    } catch (error) {
      if (companyAccountOutput) companyAccountOutput.textContent = `Error: ${error.message}`;
      logEvent(`Company account bootstrap failed: ${error.message}`);
    }
  });
}

if (companyShowAccountBtn) {
  companyShowAccountBtn.addEventListener("click", async () => {
    try {
      await showCompanyAccountMasked();
    } catch (error) {
      if (companyAccountOutput) companyAccountOutput.textContent = `Error: ${error.message}`;
      logEvent(`Company account status failed: ${error.message}`);
    }
  });
}

if (companyRevealAccountBtn) {
  companyRevealAccountBtn.addEventListener("click", async () => {
    try {
      const data = await apiPost("/api/company/primary-signin/reveal", {
        confirm: true,
        confirmText: "I_UNDERSTAND_SECRET_REVEAL"
      });
      const account = data.account || {};
      if (companyAccountOutput) {
        companyAccountOutput.textContent = "Sensitive account data revealed in chat output.";
      }
      pushMessage("brain", JSON.stringify(account, null, 2), "Company Secret");
    } catch (error) {
      if (companyAccountOutput) companyAccountOutput.textContent = `Error: ${error.message}`;
      logEvent(`Company reveal failed: ${error.message}`);
    }
  });
}

if (companyMarkRegisteredBtn) {
  companyMarkRegisteredBtn.addEventListener("click", async () => {
    try {
      const data = await apiPost("/api/company/primary-signin/mark-registered", {
        notes: "Marked as registered via Asolaria UI."
      });
      const account = data.account || {};
      if (companyAccountOutput) {
        companyAccountOutput.textContent = `Company status updated to ${account.status || "registered"}.`;
      }
      pushMessage("brain", JSON.stringify(account, null, 2), "Company Account");
      refreshHealth();
    } catch (error) {
      if (companyAccountOutput) companyAccountOutput.textContent = `Error: ${error.message}`;
      logEvent(`Company mark-registered failed: ${error.message}`);
    }
  });
}

if (companyOpenSiteBtn) {
  companyOpenSiteBtn.addEventListener("click", async () => {
    try {
      await queueChatCommand("company open", "Company Portal");
    } catch (error) {
      if (companyAccountOutput) companyAccountOutput.textContent = `Error: ${error.message}`;
      logEvent(`Company open-site failed: ${error.message}`);
    }
  });
}

if (companyDraftBtn) {
  companyDraftBtn.addEventListener("click", async () => {
    try {
      await queueChatCommand("company draft post", "Company Draft");
    } catch (error) {
      logEvent(`Company draft failed: ${error.message}`);
    }
  });
}

if (companyDecideBtn) {
  companyDecideBtn.addEventListener("click", async () => {
    try {
      await queueChatCommand("company decide proceed", "Company Decision");
    } catch (error) {
      logEvent(`Company decision failed: ${error.message}`);
    }
  });
}

document.getElementById("padRunForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const packagePath = document.getElementById("padPackage").value.trim();
  const mode = document.getElementById("padMode").value;
  const disableScreenshots = document.getElementById("padDisableShots").checked;
  if (!packagePath) return;

  logEvent("PAD run queued...");
  try {
    const data = await apiPost("/api/pad/run", { packagePath, mode, disableScreenshots });
    const jobId = data.job?.id;
    if (!jobId) {
      logEvent("PAD run request returned no job id.");
      return;
    }

    logEvent(`Tracking PAD job ${jobId}`);
    trackJob(jobId, {
      onCompleted: (job) => {
        logEvent(`PAD job completed: ${job.id}`);
        refreshHealth();
      },
      onFailed: (job) => {
        logEvent(`PAD job failed: ${job.error || "Unknown error"}`);
        refreshHealth();
      }
    });
  } catch (error) {
    logEvent(`PAD run failed: ${error.message}`);
  }
});

if (refreshMemoryBtn) {
  refreshMemoryBtn.addEventListener("click", () => {
    refreshMemory();
  });
}

if (clearMemoryBtn) {
  clearMemoryBtn.addEventListener("click", async () => {
    const proceed = window.confirm("Clear memory turns now? A backup snapshot and notebook audit note will be created.");
    if (!proceed) {
      return;
    }
    try {
      const result = await apiDelete("/api/memory", {
        confirm: "APPROVE_MEMORY_CLEAR"
      });
      const backupPath = String(result?.memory?.backupPath || "").trim();
      if (backupPath) {
        logEvent(`Memory cleared. Backup saved: ${backupPath}`);
      } else {
        logEvent("Memory cleared.");
      }
      refreshMemory();
      refreshHealth();
    } catch (error) {
      logEvent(`Clear memory failed: ${error.message}`);
    }
  });
}

if (taskLedgerRefreshBtn) {
  taskLedgerRefreshBtn.addEventListener("click", () => {
    refreshTaskLedger();
  });
}

if (taskLedgerAddBtn) {
  taskLedgerAddBtn.addEventListener("click", async () => {
    try {
      const created = await createTaskLedgerTaskFromUi();
      logEvent(`Task created: ${created.task?.id || "unknown"}`);
      refreshTaskLedger();
      refreshHealth();
    } catch (error) {
      logEvent(`Task create failed: ${error.message}`);
    }
  });
}

if (taskLedgerStatusFilter) {
  taskLedgerStatusFilter.addEventListener("change", () => {
    refreshTaskLedger({ silent: true });
  });
}

if (taskLedgerPriorityFilter) {
  taskLedgerPriorityFilter.addEventListener("change", () => {
    refreshTaskLedger({ silent: true });
  });
}

if (taskLedgerIncludeArchived) {
  taskLedgerIncludeArchived.addEventListener("change", () => {
    refreshTaskLedger({ silent: true });
  });
}

if (taskLedgerQuery) {
  taskLedgerQuery.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      refreshTaskLedger({ silent: true });
    }
  });
}

if (taskLedgerList) {
  taskLedgerList.addEventListener("click", async (event) => {
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (!target || target.tagName !== "BUTTON") {
      return;
    }
    const taskId = String(target.dataset.taskId || "").trim();
    const action = String(target.dataset.action || "").trim();
    if (!taskId || !action) {
      return;
    }
    target.disabled = true;
    try {
      await handleTaskLedgerAction(action, taskId);
      logEvent(`Task ${taskId}: ${action}`);
      refreshTaskLedger({ silent: true });
      refreshHealth();
    } catch (error) {
      logEvent(`Task action failed (${action}): ${error.message}`);
    } finally {
      target.disabled = false;
    }
  });
}

loadFocusTurnoverState();
loadSafetyMetricsState();
loadChatWorkspaceState();
renderChatThreadList();
announceFocusTurnoverSnapshot();
let startupScope = "all";
try {
  startupScope = normalizeProjectScope(localStorage.getItem(PROJECT_SCOPE_STORAGE_KEY) || "all");
} catch {}
applyProjectScope(startupScope, { syncGroupFilter: true, refreshLedger: false });
renderGatewayReadinessHints([]);
renderExternalObservedPruneStatus();
refreshHealth();
refreshExternalModelAliases({ silent: true });
refreshConversationCatalog({ loadActive: true }).catch((error) => {
  logEvent(`Chat workspace sync failed: ${error.message}`);
  renderActiveChatMessages();
});
refreshChatRailTasks({ silent: true }).catch(() => {});
refreshMemory();
refreshSkillsList();
refreshProjectScopes({
  preferredScopeId: startupScope,
  syncGroupFilter: true,
  refreshLedger: true,
  silent: true
}).catch((error) => {
  setProjectAdminMessage(`Project catalog unavailable: ${error.message}`, true);
  logEvent(`Project catalog refresh failed: ${error.message}`);
  refreshTaskLedger({ silent: true });
});
refreshGatewayAuditPanel({ silent: true });
setInterval(refreshHealth, 7000);
setInterval(() => refreshExternalModelAliases({ silent: true }), 60000);
setInterval(refreshMemory, 12000);
setInterval(() => {
  refreshConversationCatalog({ loadActive: false }).catch(() => {});
}, 15000);
setInterval(() => {
  refreshChatRailTasks({ silent: true }).catch(() => {});
}, 20000);
setInterval(() => refreshTaskLedger({ silent: true }), 15000);
setInterval(() => refreshGatewayAuditPanel({ silent: true }), 20000);
