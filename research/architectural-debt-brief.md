# Architectural Debt Brief — Asolaria
Generated: 2026-03-14

## Executive Summary

Asolaria's feature set is substantial and largely functional. The architectural debt is not in the features themselves but in how they're composed. The system is a monolith with no module boundaries, extensive global mutable state, and a flat file system that has accumulated significant sprawl. This brief catalogs the debt so the Big AI can reason about decomposition priorities.

## 1. Monolith Scale

### server.js (~29,500 lines)
A single Node.js file containing:
- Express HTTP server setup and middleware
- 30+ connector modules (inline or imported)
- All API route handlers
- All business logic for: chat, tasks, skills, memory, graph runtime, worker router, swarm coordination, browser control, mobile control, voice, guardian, external model routing, phone bridge keeper, admin terminal cockpit, colony dashboard, Natural 20 feed, notification sounds, OpenClaw adapter, and more
- All utility functions (HTML stripping, secret masking, cache management, PID file handling)

### public/app.js (~2,100+ lines)
A single frontend file containing:
- 200+ `document.getElementById()` calls at top level
- All UI state management
- All API request functions
- All dashboard rendering logic
- All event handlers for every feature panel

### Impact
- Any change to any feature risks breaking unrelated features
- Search/navigation is painful (Natural 20 digest function lives at line 16072)
- No IDE can reliably provide module-level completions or refactoring
- Testing individual features in isolation is impossible without mocking the entire server

## 2. Global Mutable State (app.js)

30+ `let` declarations at module scope, mutated from multiple call paths:

```
stealthMode, uiExperienceMode, approvalMode, memoryWindowTurns, costMode,
codexWebSearch, openclawMode, voiceEnabled, voiceOutputMode, voiceAutoSpeakReplies,
voiceWakeWord, voiceInputCaptureMode, voiceInputDevice, voiceOutputDeviceId,
kittyTtsUrl, kittyTtsApiKeyConfigured, avatarEnabled, avatarMode,
allowExternalPosting, guardianMode, guardianRiskThreshold, guardianAlertsEnabled,
guardianAutoBlockCritical, activeProjectScope, externalModelAliases,
externalModelCatalog, externalDefaultModels, externalDefaultModelsRevision,
externalObservedPruneRuntime, externalMcpStatusByProvider, externalMcpProfilesCatalog,
externalMcpUiDirty, quickRealtimePasteHelperPayload, adminTerminalCockpitRefreshInFlight,
adminTerminalCockpitLastSnapshot, superCoderRefreshInFlight, superCoderLastSnapshot,
healthRefreshInFlight, chatThreads, chatTurnsByThread, activeChatThreadId,
chatRouteMode, chatPinnedThreadIds, chatRailSection, chatRailTasks, chatTaskLinks,
chatCloseLoopDismissals, chatFocusTurnover, chatExecutionMetrics
```

Any function can read or write any of these. There is no encapsulation, no events, and no state machine guarding transitions.

### Risk
- Race conditions between polling loops and user actions
- One bad write poisons the entire UI session
- Impossible to reason about state transitions without reading every function

## 3. localStorage as Pseudo-Database

15+ storage keys identified:

```
ASOLARIA_NATURAL20_DAILY_V1, ASOLARIA_UI_EXPERIENCE_MODE_V1,
ASOLARIA_ACTIVE_PROJECT_SCOPE, ASOLARIA_AVATAR_GREETING_V2,
ASOLARIA_CHAT_THREADS_V1, ASOLARIA_CHAT_ACTIVE_THREAD_V1,
ASOLARIA_CHAT_ROUTE_MODE_V1, ASOLARIA_CHAT_PINNED_THREADS_V1,
ASOLARIA_CHAT_RAIL_SECTION_V1, ASOLARIA_CHAT_TASK_LINKS_V1,
ASOLARIA_CHAT_CLOSE_LOOP_DISMISSALS_V1, ASOLARIA_CHAT_FOCUS_TURNOVER_V1,
ASOLARIA_CHAT_SAFETY_METRICS_V1, ASOLARIA_CHAT_ABACUS_PACK_V1,
ASOLARIA_STARTUP_BRAIN_AUTORUN_V1, ASOLARIA_ADMIN_TERMINAL_AUTOENSURE_V1
```

### Problems
- Untyped: stored as JSON strings, parsed with try/catch fallback
- Unversioned: `_V1` suffix exists but no migration logic
- Mixed concerns: session state, preferences, caching, and feature flags all in the same bag
- No size management: chat threads and task links can grow unbounded
- Debugging: corrupt key requires manual console intervention

## 4. No Module Boundaries

### Server
All connectors, stores, and route handlers live in the same closure scope. There's no dependency injection, no service registry, no plugin architecture. Adding a new connector means editing `server.js` directly and having access to all other connectors' internal state.

**Positive exception**: The newer stores (`hookEventStore.js`, `agentSessionStore.js`, `transcriptBackupStore.js`) are separate files with clean interfaces. This pattern should be the model for decomposition.

### Frontend
All features share the same global namespace. The Natural 20 integration, colony dashboard, phone agent controls, guardian mode, chat thread management, voice control, external model routing, and super admin terminals are all interleaved in the same file.

**Positive exception**: Dashboard pages like `hooks-dashboard.html` and `swarm-civilization-preview.html` are standalone pages with their own JS — this pattern works and should be expanded.

## 5. Fragile External Integrations

### Natural 20 Daily Feed
- Fetches `https://natural20.com` and scrapes `<title>` and `<meta description>` with regex
- No structured API, no RSS, no fallback content
- If Natural 20 changes their HTML, the digest silently returns empty strings
- Error handling exists but returns stale cached data with no alert

### NotebookLM Enterprise
- 3/4 Google accounts have auth errors (invalid_rapt, permission denied)
- No automatic retry or re-auth flow
- Manual console intervention required

### Phone Bridge
- Keeper not running, tunnel monitor off
- Self-healing mechanism exists but is not actively engaged
- USB-only fallback mode works but remote access does not

## 6. Report Sprawl

The `reports/` directory contains an estimated 1,500+ files. Major categories:

- **android-threat-audit**: ~400+ files from a single Feb 21 automated run (~22 seconds apart)
- **phone-tunnel-smoke**: ~300+ files from automated tunnel checks
- **one-button-start**: ~200+ files from repeated startup reports
- **data-cleanup / heal-cure**: 50+ incremental cleanup reports
- **asolaria-snapshot**: ~20 timestamped snapshots

### Problems
- No retention policy — old reports accumulate forever
- No deduplication — each automated run creates a new timestamped file
- Difficult to find the *latest* meaningful report among hundreds of noise files
- The `-latest.md` convention helps but only covers a fraction of report types

### Recommendation
- Implement a rolling window: keep latest + last N per category
- Archive older reports to a compressed bundle or delete
- Add a report manifest that indexes what exists and when

## 7. What's Working Well (Don't Break These)

1. **Civilization World entity model** (`civilizationWorld.js`): Well-structured graph builder with clean entity types, district mapping, and route construction. This is the best-architected module in the codebase.

2. **Agent identity system**: Clear two-layer separation (admin terminals vs. bridge lanes), documented naming corrections, restart bootstrap sequences.

3. **Hooks Connector**: Clean store pattern (NDJSON events, JSON sessions, atomic writes). Follows the pattern that should be replicated.

4. **Super-swarm contract**: Explicit guardrails, documented participant roles, clear separation of authority.

5. **Bridge profile spec**: No-secrets contract, env var references, sender allowlists. Production-ready security posture for relay coordination.

## 8. Decomposition Priority (Suggested)

If the Big AI plans a restructuring:

1. **Extract connectors**: Each `src/connectors/*.js` file is already semi-isolated. Wire them through a service registry instead of direct `server.js` imports.
2. **Extract route handlers**: Group API routes by domain (hooks, swarm, mobile, integrations, chat) into separate route modules.
3. **Frontend page extraction**: Move each dashboard section into standalone pages (like `hooks-dashboard.html` already does).
4. **State management**: Replace global `let` variables with a simple pub/sub state container.
5. **Report retention**: Implement rolling window + manifest before the reports/ directory becomes unmanageable.
6. **Natural 20 reliability**: Add RSS/Atom fallback or structured API check before scraping.

## Source Evidence
- `server.js`: 29,500+ lines, single file
- `public/app.js`: 2,100+ lines, 200+ getElementById calls, 30+ global let variables, 15+ localStorage keys
- `reports/`: 1,500+ files, 400+ android-threat-audit from single run
- `src/civilizationWorld.js`: 1,260 lines, well-structured
- `src/hookEventStore.js`, `src/agentSessionStore.js`: clean separated stores
