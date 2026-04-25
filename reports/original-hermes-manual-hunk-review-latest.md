# Original Hermes Manual Hunk Review

Generated: 2026-04-25T01:10:17.950Z
Status: MANUAL_HUNK_REVIEW_READY
Digest: e1b3e3c73a5b9cdd85fa9cd8a5cd61c782c5a1855cbd559c554a7445fe1d8ef1

## Summary

- Files reviewed: 5
- Total hunks: 39
- Stage Original Hermes hunks: 7
- Stage separate hardening hunks: 1
- Manual split required hunks: 2
- Deferred/separate-lane hunks: 29
- Unknown/manual-review hunks: 0

## Operator Rules

- Use `git add -p`; do not whole-file stage these files.
- Keep provider/cache/ix server edits out of the Original Hermes commit.
- Keep route-hook telemetry out unless it is intentionally bundled with matching connector/store changes.
- Stage `server.js` hook loopback protection only as a separate hook-hardening lane or as a deliberately named companion hunk.
- No Git stage, commit, push, network call, secret read, or shadow edit was performed by this tool.

## TASKS.md

- Diff status: pass
- Hunks: 4
- Interactive command: `git add -p -- 'TASKS.md'`

### TASKS.md hunk 1

- Header: `@@ -4,0 +5,170 @@`
- Decision: `manual_split_required`
- Lane: `mixed_task_log`
- Stage guidance: stage only Original Hermes task-log lines for the Original Hermes commit; keep skills/deep-wave entries separate
- Risk: large prepended mixed task-log hunk
- Added/removed: 170/0

Preview:

```diff
+- [x] Original Hermes manual hunk review map (2026-04-25): added `tools/original-hermes-manual-hunk-review.js` to classify the mixed dirty files that must not be whole-file staged. The tool parses `git diff --unified=0`
+
+- [x] Original Hermes orchestrated 10B route/server smoke and hook hardening review (2026-04-25): added `tools/original-hermes-route-server-smoke.js` as a compact `10,000,000,000` logical-agent route coverage smoke that
+
+- [x] Repo-level skills validation repair (2026-04-25): after the Original Hermes partial-commit gate passed, ran `npm run skills:validate` as a broader repo preflight and found three unrelated skill metadata blockers.
+
```

### TASKS.md hunk 2

- Header: `@@ -41,0 +212 @@`
- Decision: `defer_or_stage_separate_lane`
- Lane: `non_original_hermes_task_log`
- Stage guidance: do not include in Original Hermes partial commit
- Risk: separate task-log lane
- Added/removed: 1/0

Preview:

```diff
+  - Update 2026-04-14 16:50 -03:00: Sentinel reloaded the Sentinel bootstrap anchors, Brown-Hilbert continuity files, and the current live controller surfaces before refreshing `reports/sector-drift-watch-latest.md`. Dr
```

### TASKS.md hunk 3

- Header: `@@ -93,0 +265 @@`
- Decision: `defer_or_stage_separate_lane`
- Lane: `deep_wave_task_log`
- Stage guidance: do not include in Original Hermes partial commit
- Risk: separate task-log lane
- Added/removed: 1/0

Preview:

```diff
+  - Update 2026-04-16 00:13 -03:00: the fresh external colony scan at `C:\Users\acer\OneDrive\Desktop\LIRIS.txt` sharpens the contradiction again instead of resolving it. It preserves the direct Ethernet peer at `192.16
```

### TASKS.md hunk 4

- Header: `@@ -861,0 +1034,29 @@`
- Decision: `defer_or_stage_separate_lane`
- Lane: `deep_wave_task_log`
- Stage guidance: do not include in Original Hermes partial commit
- Risk: separate task-log lane
- Added/removed: 29/0

Preview:

```diff
+- 2026-04-15 13:21:42 -03:00: Deep Wave SECOND cascade orchestration tranche emitted on `C:` only after the crash-locus packet was preserved to memory and indexed mistakes. Added task lattice `IX-1001..IX-1008` under `d
+- 2026-04-15 14:45:29 -03:00: Desktop archaeology + Falcon / BEHCS / OS-under-Windows packet sealed on `C:` at `reports/desktop-archaeology-behcs-os-index-20260415-144529.md` (`latest`: `reports/desktop-archaeology-behc
+- 2026-04-15 14:50:49 -03:00: Chief-director / Falcon USB delta appended on `C:` at `reports/chief-director-falcon-usb-delta-20260415-145049.md` and folded into `reports/desktop-archaeology-behcs-os-index-latest.md`. Pr
+- 2026-04-15 14:54:39 -03:00: Mirror / multilane Falcon bridge delta appended on `C:` at `reports/mirror-multilane-falcon-bridge-delta-20260415-145439.md` and folded into `reports/desktop-archaeology-behcs-os-index-late
+- [x] Falcon phone white-room intake + replication map (2026-04-15 15:07 -03:00): copied the newer Falcon payload off-device into `quarantine/falcon-phone-white-room-20260415-150246`, preserved separate `private-termux`
+- [x] Falcon C-side replication tranche + Windows codex repair (2026-04-15 15:15 -03:00): landed the first real replication slice from the phone payload onto `C:` and sealed it at `reports/falcon-c-side-replication-tran
```


## routes/workerRouter.js

- Diff status: pass
- Hunks: 3
- Interactive command: `git add -p -- 'routes/workerRouter.js'`

### routes/workerRouter.js hunk 1

- Header: `@@ -10 +10 @@ const {`
- Decision: `defer_or_stage_separate_lane`
- Lane: `worker_router_self_build`
- Stage guidance: do not include in Original Hermes partial commit
- Risk: non-Original-Hermes endpoint
- Added/removed: 1/1

Preview:

```diff
+  recommendWorker, dispatchWorkerTask, getWorkerRouterSelfBuildPosture
-  recommendWorker, dispatchWorkerTask
```

### routes/workerRouter.js hunk 2

- Header: `@@ -11,0 +12,15 @@ const {`
- Decision: `stage_original_hermes`
- Lane: `original_hermes_worker_router`
- Stage guidance: include in Original Hermes route/API lane
- Risk: low
- Added/removed: 15/0

Preview:

```diff
+const {
+  buildOriginalHermesTransportRouterSnapshot
+} = require("../src/behcs/originalHermesTransportRouter");
+const {
+  buildOriginalHermesLearningLoopSnapshot
+} = require("../src/behcs/originalHermesLearningLoop");
```

### routes/workerRouter.js hunk 3

- Header: `@@ -18,0 +34,57 @@ router.get("/status", (_req, res) => {`
- Decision: `manual_split_required`
- Lane: `mixed_worker_router`
- Stage guidance: stage Original Hermes imports; defer self-build import unless companion self-build files are staged
- Risk: mixed import hunk
- Added/removed: 57/0

Preview:

```diff
+router.get("/self-build", (_req, res) => {
+  try {
+    return res.json({ ok: true, selfBuild: getWorkerRouterSelfBuildPosture() });
+  } catch (error) { return respondError(res, error, inferHttpStatusForError(error, 500)); }
+});
+
```


## routes/hooks.js

- Diff status: pass
- Hunks: 4
- Interactive command: `git add -p -- 'routes/hooks.js'`

### routes/hooks.js hunk 1

- Header: `@@ -15,0 +16 @@ const {`
- Decision: `defer_or_stage_separate_lane`
- Lane: `route_hook_telemetry`
- Stage guidance: keep out of Original Hermes partial commit unless route-hook telemetry lane is intentional
- Risk: separate feature lane
- Added/removed: 1/0

Preview:

```diff
+  getRouteHookStats,
```

### routes/hooks.js hunk 2

- Header: `@@ -67 +68,2 @@ router.post("/guard", (req, res) => {`
- Decision: `stage_original_hermes`
- Lane: `original_hermes_guard_context`
- Stage guidance: include because plugin-gate needs full guard context
- Risk: low
- Added/removed: 2/1

Preview:

```diff
+      body.tool_input || {},
+      body
-      body.tool_input || {}
```

### routes/hooks.js hunk 3

- Header: `@@ -112,0 +115 @@ router.get("/events", (req, res) => {`
- Decision: `defer_or_stage_separate_lane`
- Lane: `route_hook_telemetry`
- Stage guidance: keep out of Original Hermes partial commit unless route-hook telemetry lane is intentional
- Risk: separate feature lane
- Added/removed: 1/0

Preview:

```diff
+      atlasLaneId: req.query?.atlasLaneId,
```

### routes/hooks.js hunk 4

- Header: `@@ -121,0 +125,37 @@ router.get("/events", (req, res) => {`
- Decision: `defer_or_stage_separate_lane`
- Lane: `route_hook_telemetry`
- Stage guidance: keep out of Original Hermes partial commit unless route-hook telemetry lane is intentional
- Risk: separate feature lane
- Added/removed: 37/0

Preview:

```diff
+router.get("/route-hooks", (req, res) => {
+  try {
+    const events = queryHookEvents({
+      eventType: "RouteHook",
+      route: String(req.query?.route || "").trim() || undefined,
+      routeStage: String(req.query?.routeStage || "").trim() || undefined,
```


## src/connectors/hooksConnector.js

- Diff status: pass
- Hunks: 9
- Interactive command: `git add -p -- 'src/connectors/hooksConnector.js'`

### src/connectors/hooksConnector.js hunk 1

- Header: `@@ -1 +1 @@`
- Decision: `defer_or_stage_separate_lane`
- Lane: `route_hook_telemetry`
- Stage guidance: keep out of Original Hermes partial commit unless route-hook telemetry lane is intentional
- Risk: separate feature lane
- Added/removed: 1/1

Preview:

```diff
+const { appendHookEvent, queryHookEvents, getRouteHookStats, getHookEventStats, getSessionSummary } = require("../hookEventStore");
-const { appendHookEvent, queryHookEvents, getHookEventStats, getSessionSummary } = require("../hookEventStore");
```

### src/connectors/hooksConnector.js hunk 2

- Header: `@@ -3,0 +4,4 @@ const { upsertSession, getSession, listActiveSessions, addPromptToSession, incre`
- Decision: `stage_original_hermes`
- Lane: `original_hermes_plugin_gate`
- Stage guidance: include in Original Hermes plugin-hook GAC gate
- Risk: low
- Added/removed: 4/0

Preview:

```diff
+const {
+  buildPluginHookGate,
+  evaluatePluginHook
+} = require("../behcs/originalHermesAgentContracts");
```

### src/connectors/hooksConnector.js hunk 3

- Header: `@@ -56 +60,102 @@ function isEnvFileAccess(toolName, toolInput = {}) {`
- Decision: `stage_original_hermes`
- Lane: `original_hermes_plugin_gate`
- Stage guidance: include in Original Hermes plugin-hook GAC gate
- Risk: low
- Added/removed: 102/1

Preview:

```diff
+function normalizeList(value) {
+  if (!value) return [];
+  if (Array.isArray(value)) return value.map((item) => String(item || "").trim()).filter(Boolean);
+  return String(value || "")
+    .split(/[,\s]+/)
+    .map((item) => item.trim())
-function getGuardVerdict(toolName, toolInput = {}) {
```

### src/connectors/hooksConnector.js hunk 4

- Header: `@@ -68,0 +174,3 @@ function getGuardVerdict(toolName, toolInput = {}) {`
- Decision: `stage_original_hermes`
- Lane: `original_hermes_plugin_gate`
- Stage guidance: include in Original Hermes plugin-hook GAC gate
- Risk: low
- Added/removed: 3/0

Preview:

```diff
+  if (shouldApplyOriginalHermesPluginGate(toolName, toolInput, context)) {
+    return getOriginalHermesPluginHookGateVerdict(toolName, toolInput, context);
+  }
```

### src/connectors/hooksConnector.js hunk 5

- Header: `@@ -118,0 +227 @@ function getHookDashboard() {`
- Decision: `defer_or_stage_separate_lane`
- Lane: `route_hook_telemetry`
- Stage guidance: keep out of Original Hermes partial commit unless route-hook telemetry lane is intentional
- Risk: separate feature lane
- Added/removed: 1/0

Preview:

```diff
+  const routeHooks = getRouteHookStats({ limit: 200 });
```

### src/connectors/hooksConnector.js hunk 6

- Header: `@@ -124,0 +234 @@ function getHookDashboard() {`
- Decision: `defer_or_stage_separate_lane`
- Lane: `route_hook_telemetry`
- Stage guidance: keep out of Original Hermes partial commit unless route-hook telemetry lane is intentional
- Risk: separate feature lane
- Added/removed: 1/0

Preview:

```diff
+    routeHooks,
```

### src/connectors/hooksConnector.js hunk 7

- Header: `@@ -186,3 +296,7 @@ function manifest() {`
- Decision: `stage_original_hermes`
- Lane: `original_hermes_plugin_gate`
- Stage guidance: include in Original Hermes plugin-hook GAC gate
- Risk: low
- Added/removed: 7/3

Preview:

```diff
+    sideEffects: ["appends to hook-events.ndjson", "creates transcript backup files", "blocks dangerous tool calls", "denies unregistered Hermes-style plugin hooks"],
+    failureModes: ["event_store_write_failed", "transcript_backup_failed", "plugin_hook_gate_denied"],
+    emittedEvents: ["hook.event_ingested", "hook.guard_blocked", "hook.session_started", "hook.session_ended"],
+    originalHermesPluginGate: {
+      contractId: buildPluginHookGate().contractId,
+      defaultDecision: "deny_runtime_hook_until_registered_and_gac_approved"
-    sideEffects: ["appends to hook-events.ndjson", "creates transcript backup files", "blocks dangerous tool calls"],
-    failureModes: ["event_store_write_failed", "transcript_backup_failed"],
-    emittedEvents: ["hook.event_ingested", "hook.guard_blocked", "hook.session_started", "hook.session_ended"]
```

### src/connectors/hooksConnector.js hunk 8

- Header: `@@ -193,0 +308 @@ module.exports = {`
- Decision: `stage_original_hermes`
- Lane: `original_hermes_plugin_gate`
- Stage guidance: include in Original Hermes plugin-hook GAC gate
- Risk: low
- Added/removed: 1/0

Preview:

```diff
+  getOriginalHermesPluginHookGateVerdict,
```

### src/connectors/hooksConnector.js hunk 9

- Header: `@@ -198,0 +314 @@ module.exports = {`
- Decision: `defer_or_stage_separate_lane`
- Lane: `route_hook_telemetry`
- Stage guidance: keep out of Original Hermes partial commit unless route-hook telemetry lane is intentional
- Risk: separate feature lane
- Added/removed: 1/0

Preview:

```diff
+  getRouteHookStats,
```


## server.js

- Diff status: pass
- Hunks: 19
- Interactive command: `git add -p -- 'server.js'`

### server.js hunk 1

- Header: `@@ -44,0 +45 @@ const { runBrainTask } = require("./src/brainOrchestrator");`
- Decision: `defer`
- Lane: `unrelated_server_changes`
- Stage guidance: do not stage for Original Hermes
- Risk: unrelated provider/cache/ix server edits
- Added/removed: 1/0

Preview:

```diff
+const { getCacheStatus } = require("./src/agentCacheSharing");
```

### server.js hunk 2

- Header: `@@ -137,0 +139,3 @@ const {`
- Decision: `defer`
- Lane: `unrelated_server_changes`
- Stage guidance: do not stage for Original Hermes
- Risk: unrelated provider/cache/ix server edits
- Added/removed: 3/0

Preview:

```diff
+const {
+  getKimiCodeStatus
+} = lazyConnector("./src/connectors/kimiCodeConnector");
```

### server.js hunk 3

- Header: `@@ -1866 +1870,4 @@ function defaultExternalProviderFallbackOrder(primaryProvider = "") {`
- Decision: `defer`
- Lane: `unrelated_server_changes`
- Stage guidance: do not stage for Original Hermes
- Risk: unrelated provider/cache/ix server edits
- Added/removed: 4/1

Preview:

```diff
+    return ["kimi", "antigravity", "gemini", "cursor"];
+  }
+  if (provider === "kimi") {
+    return ["gemini", "cursor", "antigravity", "anthropic"];
-    return ["antigravity", "gemini", "cursor"];
```

### server.js hunk 4

- Header: `@@ -1869 +1876 @@ function defaultExternalProviderFallbackOrder(primaryProvider = "") {`
- Decision: `defer`
- Lane: `unrelated_server_changes`
- Stage guidance: do not stage for Original Hermes
- Risk: unrelated provider/cache/ix server edits
- Added/removed: 1/1

Preview:

```diff
+    return ["kimi", "antigravity", "gemini", "anthropic"];
-    return ["antigravity", "gemini", "anthropic"];
```

### server.js hunk 5

- Header: `@@ -1872 +1879 @@ function defaultExternalProviderFallbackOrder(primaryProvider = "") {`
- Decision: `defer`
- Lane: `unrelated_server_changes`
- Stage guidance: do not stage for Original Hermes
- Risk: unrelated provider/cache/ix server edits
- Added/removed: 1/1

Preview:

```diff
+    return ["kimi", "antigravity", "cursor", "anthropic"];
-    return ["antigravity", "cursor", "anthropic"];
```

### server.js hunk 6

- Header: `@@ -1875 +1882 @@ function defaultExternalProviderFallbackOrder(primaryProvider = "") {`
- Decision: `defer`
- Lane: `unrelated_server_changes`
- Stage guidance: do not stage for Original Hermes
- Risk: unrelated provider/cache/ix server edits
- Added/removed: 1/1

Preview:

```diff
+    return ["kimi", "cursor", "gemini", "anthropic"];
-    return ["cursor", "gemini", "anthropic"];
```

### server.js hunk 7

- Header: `@@ -1877 +1884 @@ function defaultExternalProviderFallbackOrder(primaryProvider = "") {`
- Decision: `defer`
- Lane: `unrelated_server_changes`
- Stage guidance: do not stage for Original Hermes
- Risk: unrelated provider/cache/ix server edits
- Added/removed: 1/1

Preview:

```diff
+  return ["kimi", "antigravity", "cursor", "gemini", "anthropic"];
-  return ["antigravity", "cursor", "gemini", "anthropic"];
```

### server.js hunk 8

- Header: `@@ -3014,2 +3021,2 @@ const settings = {`
- Decision: `defer`
- Lane: `unrelated_server_changes`
- Stage guidance: do not stage for Original Hermes
- Risk: unrelated provider/cache/ix server edits
- Added/removed: 2/2

Preview:

```diff
+    process.env.ASOLARIA_BRAIN_FALLBACK_ORDER || "anthropic,gemini-api,vertex,openclaw,gemini-cli,kimi,cursor,antigravity",
+    ["anthropic", "gemini-api", "vertex", "openclaw", "gemini-cli", "kimi", "cursor", "antigravity"]
-    process.env.ASOLARIA_BRAIN_FALLBACK_ORDER || "anthropic,gemini-api,vertex,openclaw,gemini-cli,cursor,antigravity",
-    ["anthropic", "gemini-api", "vertex", "openclaw", "gemini-cli", "cursor", "antigravity"]
```

### server.js hunk 9

- Header: `@@ -6740,0 +6748,10 @@ const MODEL_ALIAS_TABLE = Object.freeze({`
- Decision: `defer`
- Lane: `unrelated_server_changes`
- Stage guidance: do not stage for Original Hermes
- Risk: unrelated provider/cache/ix server edits
- Added/removed: 10/0

Preview:

```diff
+  kimi: Object.freeze({
+    "k2.6": "kimi-k2.6",
+    k26: "kimi-k2.6",
+    "kimi-k2.6": "kimi-k2.6",
+    "kimi-2.6": "kimi-k2.6",
+    "k2.5": "kimi-k2.5",
```

### server.js hunk 10

- Header: `@@ -6760,0 +6778 @@ const MODEL_ALIAS_HINTS = Object.freeze({`
- Decision: `defer`
- Lane: `unrelated_server_changes`
- Stage guidance: do not stage for Original Hermes
- Risk: unrelated provider/cache/ix server edits
- Added/removed: 1/0

Preview:

```diff
+  kimi: Object.freeze(["kimi-k2.6", "k2.6", "kimi-k2.5", "k2.5"]),
```

### server.js hunk 11

- Header: `@@ -6887,0 +6906,3 @@ function looksLikeVersionedModelId(providerName, rawToken) {`
- Decision: `defer`
- Lane: `unrelated_server_changes`
- Stage guidance: do not stage for Original Hermes
- Risk: unrelated provider/cache/ix server edits
- Added/removed: 3/0

Preview:

```diff
+  if (providerName === "kimi") {
+    return /^kimi[-a-z0-9.]+$/.test(key);
+  }
```

### server.js hunk 12

- Header: `@@ -22987,0 +23009 @@ async function runRoutedIntent(message) {`
- Decision: `defer`
- Lane: `unrelated_server_changes`
- Stage guidance: do not stage for Original Hermes
- Risk: unrelated provider/cache/ix server edits
- Added/removed: 1/0

Preview:

```diff
+    || routed.action === "kimi_status"
```

### server.js hunk 13

- Header: `@@ -22995 +23017,3 @@ async function runRoutedIntent(message) {`
- Decision: `defer`
- Lane: `unrelated_server_changes`
- Stage guidance: do not stage for Original Hermes
- Risk: unrelated provider/cache/ix server edits
- Added/removed: 3/1

Preview:

```diff
+          : routed.action.startsWith("kimi")
+            ? "kimi"
+            : "gemini";
-          : "gemini";
```

### server.js hunk 14

- Header: `@@ -23026,0 +23051,17 @@ async function runRoutedIntent(message) {`
- Decision: `defer`
- Lane: `unrelated_server_changes`
- Stage guidance: do not stage for Original Hermes
- Risk: unrelated provider/cache/ix server edits
- Added/removed: 17/0

Preview:

```diff
+    if (providerId === "kimi") {
+      const apiStatus = providerStatusById(providerId);
+      const cliStatus = await getKimiCodeStatus({
+        timeoutMs: 3000
+      });
+      return {
```

### server.js hunk 15

- Header: `@@ -23061,0 +23103 @@ async function runRoutedIntent(message) {`
- Decision: `defer`
- Lane: `unrelated_server_changes`
- Stage guidance: do not stage for Original Hermes
- Risk: unrelated provider/cache/ix server edits
- Added/removed: 1/0

Preview:

```diff
+    || routed.action === "kimi_ask"
```

### server.js hunk 16

- Header: `@@ -23069 +23111,3 @@ async function runRoutedIntent(message) {`
- Decision: `defer`
- Lane: `unrelated_server_changes`
- Stage guidance: do not stage for Original Hermes
- Risk: unrelated provider/cache/ix server edits
- Added/removed: 3/1

Preview:

```diff
+          : routed.action.startsWith("kimi")
+            ? "kimi"
+            : "gemini";
-          : "gemini";
```

### server.js hunk 17

- Header: `@@ -23470,0 +23515,20 @@ app.get("/api/sovereignty/status", (_req, res) => {`
- Decision: `defer`
- Lane: `unrelated_server_changes`
- Stage guidance: do not stage for Original Hermes
- Risk: unrelated provider/cache/ix server edits
- Added/removed: 20/0

Preview:

```diff
+app.get("/api/cache/status", (req, res) => {
+  const payload = getCacheStatus();
+  if (isLoopbackRequest(req)) {
+    return res.json({
+      ok: true,
+      scope: "loopback",
```

### server.js hunk 18

- Header: `@@ -23845 +23909 @@ function handleCompanyPrimarySigninReveal(req, res, source) {`
- Decision: `stage_separate_hardening_lane`
- Lane: `hook_loopback_hardening`
- Stage guidance: include in a hook-hardening commit, not the Original Hermes core commit
- Risk: low
- Added/removed: 1/1

Preview:

```diff
+app.use("/api/hooks", requireLoopbackOnly, require("./routes/hooks"));
-app.use("/api/hooks", require("./routes/hooks"));
```

### server.js hunk 19

- Header: `@@ -23849 +23913 @@ app.use("/api/hooks", require("./routes/hooks"));`
- Decision: `defer`
- Lane: `unrelated_server_changes`
- Stage guidance: do not stage for Original Hermes
- Risk: unrelated provider/cache/ix server edits
- Added/removed: 1/1

Preview:

```diff
+try { app.use("/api/ix", require("./routes/ixExec")); } catch(e) { console.error("[SAFETY] ixExec route skipped:", e.message); }
-app.use("/api/ix", require("./routes/ixExec"));
```
