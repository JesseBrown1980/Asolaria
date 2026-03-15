# Asolaria State of the World — 2026-03-14
Generated: 2026-03-14T18:27:00Z

## 1. System Overview
Asolaria is a local control plane running on Node.js (v22.12.0) at `http://127.0.0.1:4781` on an Acer Nitro AN515-52 (i5-8300H, 16GB, GTX 1050, Windows 11). It serves as the sovereign runtime for a multi-agent colony, orchestrating reasoning lanes, phone/mobile control, browser automation, integration connectors, and a graph-based observation layer.

Core server: `C:\Users\acer\Asolaria\server.js` (~29,500 lines)
Frontend: `C:\Users\acer\Asolaria\public\app.js` (~2,100+ lines)
Data: `C:\Users\acer\Asolaria\data\`
Reports: `C:\Users\acer\Asolaria\reports\`

## 2. Agent Colony — Identity Registry

### Admin Terminals (Human-Facing)
- **Helm** — Controller admin terminal. Holds main coordination thread with owner. Chooses next work packet, delegates/pauses/re-scopes, keeps restart packets current.
  - Profile: `reports/admin-terminal-helm-profile-latest.md`
  - Sidecar: `runtime/admin-terminals/helm/`
- **Sentinel** — Helper/watch admin terminal. Watches runtime drift and sector mismatch in real time. Surfaces state changes, conflicts, stale assumptions early.
  - Profile: `reports/admin-terminal-sentinel-profile-latest.md`
  - Sidecar: `runtime/admin-terminals/sentinel/`

### Internal Bridge Lanes (NOT admin-terminal names)
- **vector** — Main Brain lane (`this-codex`). Aliases: `this-codex, this-codex-bot, vector`. Pings to `rook`.
- **rook** — Ops Lane (`other-codex`). Aliases: `rook`.
- **forge** — Build Lane (`build-codex`). Aliases: `forge`.
- **falcon** — Phone Lane (`phone-codex`). Aliases: `falcon`.
- **asolaria** — Core Runtime identity (the sovereign entity in Civilization World).
- **watchdog** — Supervisor. Validates `--from`, `--agentName`, `--profileId`, `--mentionAliases`. Terminates mismatched lane processes for auto-restart.

### Avatar / NPC Profile
- Profile ID: `asolaria-business-female-v1`
- Persona: "Asolaria Executive", age 28, 176cm
- Outfit: modern business (blazer, pencil skirt, charcoal/navy/white)
- Rig: humanoid_unreal, output: GLB
- Stored: `data/avatar-npc/` (4 generated variants)

### Bridge Profile Spec (v1)
- Template: `codex-bridge/profiles/agent-profile.template.json`
- Scaffold: `codex-bridge/new-agent-profile.ps1`
- Spec: `codex-bridge/AGENT_PROFILE_SPEC.md`
- No-secrets contract: relay URL/token via env vars, sender allowlists, room policy enforcement
- Permanent lane names: `vector`, `rook`, `forge`, `falcon`, `asolaria`, `oli`, `watchdog`

### Super Swarm Contract
- Method: `super_swarm`, Mission: `qdd`, Fanout: 3 per Codex terminal
- Coordinated participants: `local_codex` (repo writer), `abacus` (bounded worker), `symphony` (long-running issues), `gemini_api` (alternate brain), `augment_context` (read-only indexer)
- Guardrails: augment stays read-only, symphony stays issue lane, vector/rook are relay-only (not admin terminal names)
- Confirmation thread: `asolaria_bridge` / `helm-super-swarm-20260311`

## 3. Linear Issue State (ASO Team)

### In Progress
- **ASO-10** — "Integrate Asolaria entity graph with MadnessInteractive SwarmDesk" (High priority, created Mar 12)
  - Objective: Emit Asolaria entities into SwarmDesk/GNN
  - Expected artifacts: network map report, entity schema proposal, integration checklist
  - Code: `src/civilizationWorld.js`, `public/swarm-civilization-preview.html/.js`, `reports/super-swarm/`
  - SwarmDesk MQTT hybrid transport documented: `reports/super-swarm/swarmdesk-browser-mqtt-hybrid.md`

### Blocked
- **ASO-8** — "EZ Protect rollout" (Urgent, labeled BLOCKED)
  - Blocker: Missing real `CHARM_EZ_PROTECT_*` environment values
  - Jest/TS pass, but ordered tasks 2-6 cannot proceed
  - QDD repo: `D:\projects\QDD\ebacmap-master` (branch `feature/ez-protect-admin-monorepo`)
  - Evidence: `reports/qdd-ez-protect-rollout-evidence.md`, `reports/qdd-ez-protect-finish-checklist.md`

### Done
- **ASO-9** — "Track QDD rollout evidence blockers" ✅
- **ASO-7** — "Asolaria runtime cleanup" ✅

## 4. Completed Work — Hooks Connector (Mar 13-14)

Full agent observability micro-tools system. All 8 plan sections built, tested, bug-fixed, verified.

### Key Files
- `src/hookEventStore.js` — NDJSON event store with graph runtime + mistake ledger cross-links
- `src/transcriptBackupStore.js` — PreCompact transcript backup
- `src/agentSessionStore.js` — JSON store tracking sessions with prompt history
- `src/connectors/hooksConnector.js` — Core connector: guard logic, event ingestion, dashboard, context injection
- `.claude/hooks/asolaria_hook.py` + `.claude/hooks/asolaria_guard.py` — Python shims
- `.claude/settings.json` — Template wiring 12 event types
- `public/hooks-dashboard.html` — Frontend dashboard
- Routes in `server.js` (lines ~29469-29566): 9 endpoints

### Endpoints
- POST `/api/hooks/events` — Ingest hook event
- GET `/api/hooks/dashboard` — Full dashboard view
- GET `/api/hooks/sessions` — List sessions
- GET `/api/hooks/sessions/:id` — Session detail
- POST `/api/hooks/backup-transcript` — Transcript backup
- POST `/api/hooks/guard` — Guard verdict (blocks rm -rf, .env access)
- GET `/api/hooks/context/:id` — Inject session context
- GET `/api/hooks/stats` — Live stats
- GET `/hooks-dashboard.html` — Dashboard frontend

### Integration Points
- Graph runtime gets 22 hooks-connector events
- Mistake ledger gets PostToolUseFailure entries
- Skills-tools index: 9 hook micro-tools registered with live stats

## 5. Natural 20 Daily Research Feed

### Server Side
- URL constant: `NATURAL20_DAILY_URL = "https://natural20.com"` (server.js:4359)
- State object: `natural20DailyDigest` — tracks `checkedDay`, `checkedAt`, `title`, `summary`, `url`, `finalUrl`, `lastError`
- Function: `getNatural20DailyDigest()` (server.js:16072) — fetches site HTML, extracts `<title>` and `<meta description>` via regex, caches per-day
- API route: `/api/daily-sites/natural20` (query param `?refresh=true` to force)
- Fragility: HTML scraping with regex — no structured API, silent empty returns on markup changes

### Client Side
- Button: `natural20DailyBtn` (#natural20DailyBtn)
- localStorage key: `ASOLARIA_NATURAL20_DAILY_V1`
- Startup check: `runNatural20DailyStartupCheck()` — checks cache, fetches if stale
- Fresh/stale indicator: `.is-fresh` CSS class toggles on button
- Dashboard launcher action: `"natural20"` triggers `openNatural20Daily({ force: true })`
- Opens in new window via `window.open()`

### Current State
- Integration is functional but fragile (HTML scraping)
- One-click daily check from dashboard
- Per-day caching in both server memory and localStorage

## 6. Civilization World / SwarmDesk Integration

### Entity Model (`src/civilizationWorld.js`, ~1,260 lines)
- Builds a full graph world state from live Asolaria data
- Entity types: sovereign, agent, gate, tower, trusted_surface, task, packet
- Districts: citadel, colony, perimeter, cloud, swarm
- Motion states: moving, idle, offline, degraded
- Registered entities include all colony agents, admin terminals, connectors, tasks from ledger

### Key Entities Built
- **Sovereign**: Asolaria core runtime
- **Gates**: Agent Colony Gate, Bridge Relay Gate, Bridge Tunnel Gate (Cloudflare), Codex Gate, Claude Max Gate, Symphony Gate, Gemini Cloud Gate, SwarmDesk World Gate
- **Towers**: Relay Tower, Public Tunnel Tower, Codex Tower, Claude Max Tower, Gemini Cloud Tower, SwarmDesk World Tower, per-connector towers
- **Routes**: sovereign_control, guarded_portal, colony_route, guardian_link, task_route, observed_route, world_bridge, cloud_route

### SwarmDesk MQTT Transport
- Connector: `src/connectors/mqttConnector.js`
- Config via env vars or vault secrets
- Topics: `asolaria/graph/events`, `asolaria/graph/manifests`, `asolaria/agents/colony/status`, `asolaria/world/state`, `asolaria/runtime/health`, `asolaria/control/request`
- Publishes: graph events, action manifests, colony status, world state, health heartbeat
- Subscribes: control requests with ACK responses
- SwarmDesk export: `src/swarmDeskExport.js`
- Frontend: `public/swarm-civilization-preview.html`

## 7. March 12 Work Inventory

14 files modified on March 12, 2026:
- `src/screenshotConnector.js` — Desktop capture updates
- `src/workspaceKnowledgeStore.js` — Knowledge indexing
- `src/notebookStore.js` — Notebook persistence
- `src/gateway/server.js` — Gateway routing
- `src/notebooklmConnector.js` — NotebookLM Enterprise connector
- `src/augmentContextConnector.js` — Augment MCP bridge
- `src/geminiApiConnector.js` — Gemini API connector
- `src/semanticKnowledgeStore.js` — Semantic knowledge
- `src/swarmDeskExport.js` — SwarmDesk export
- `src/mqttLocalBrokerManager.js` — Local MQTT broker
- `public/styles.css` — UI styling
- `src/systemPaths.js` — System path resolution
- `public/index.html` — Dashboard HTML
- `public/app.js` — Dashboard JS

Cross-surface audit generated: `reports/cross-surface-audit-20260312-083420.md`
Full system snapshot: `reports/asolaria-snapshot-20260312-113157Z.md`

## 8. Architectural Debt Assessment

### Critical Issues
See `research/architectural-debt-brief.md` for full analysis. Summary:

1. **Monolith scale**: `server.js` at ~35,000+ lines (grew from ~29,500 with HubSpot/Hooks/route additions), `app.js` at ~2,100+ lines — no module boundaries
2. **Global mutable state**: 30+ `let` globals in `app.js` mutated by different call paths
3. **localStorage as pseudo-database**: 15+ `_STORAGE_KEY` constants — untyped, unversioned
4. **No separation of concerns**: Natural 20, colony dashboard, phone agent, super admin, guardian, chat, task ledger, external model routing, voice — all in same file scope
5. **Fragile integrations**: Natural 20 scrapes HTML with regex; any markup change causes silent failure
6. **Report sprawl**: `reports/` directory contains 1,500+ files, many duplicate timestamped variants (e.g., 400+ android-threat-audit files from a single Feb 21 run)

### What Works Despite the Debt
- The entity/graph model in `civilizationWorld.js` is well-structured
- Agent profile spec and identity registry are cleanly documented
- Hooks Connector follows clean store patterns (NDJSON, JSON atomic writes)
- HubSpot Connector follows same vault/OAuth/retry patterns as Google/Atlassian connectors
- Super-swarm contract has explicit guardrails
- Restart bootstrap sequences are documented and reproducible

## 9. Integration Status Summary (updated 2026-03-14T19:50Z)

### Healthy / Live
- External Cursor: gpt-5.2-codex + MCP=off
- **HubSpot CRM**: OAuth 2.1 PKCE connected, portal 51209071, plasmatoid@gmail.com, refresh token stored
- **Hooks Connector**: 9 endpoints, 12 event types, 9 micro-tools, 22 events ingested
- **MQTT**: Connected, base topic asolaria/test/local
- **Google Cloud Billing**: Gemini Business plan active, project 143194762561

### Degraded
- NotebookLM Enterprise: 1/4 accounts ready (seat_blocked, invalid_rapt)
- Abacus: desktop=off, cli_print=limited
- Computer-use USB lane: keeper=off
- Phone mobile push: 0 subscriptions
- Phone remote tunnel: monitor=off

### Blocked
- Google OAuth: OAuth client missing
- GCP: service account missing
- Vertex: config missing
- Gemini API: API key missing

### Unconfigured
- Slack, Symphony, Augment Context, GitHub, Microsoft, Telegram

## 9b. Completed Work — HubSpot CRM Connector (Mar 14)

Full OAuth 2.1 PKCE connector for HubSpot MCP Auth Apps.

### Key Files
- `src/connectors/hubspotConnector.js` — OAuth flow, PKCE, token refresh, CRM API wrappers
- Routes in `server.js`: 4 endpoints (status, config, oauth/start, oauth/callback)
- Chat actions: `hubspot_status`, `hubspot_auth_start`

### Capabilities
- OAuth 2.1 with PKCE (S256) via `mcp.hubspot.com`
- Token auto-refresh via secureVault
- CRM read: contacts, companies, deals (with pagination)
- Generic API request wrapper for any `*.hubapi.com` endpoint
- Guardian-guarded config and auth routes

### Connected Account
- Portal: 51209071 (J Brown Development)
- User: plasmatoid@gmail.com
- Hub domain: www.jbrowndevelopmentllc.com
- 13+ scopes granted (full CRM read)

## 10. Active Blockers

1. **EZ Protect (ASO-8)**: Missing `CHARM_EZ_PROTECT_*` environment values. All downstream tasks blocked.
2. **NotebookLM Enterprise**: 3/4 Google accounts have invalid RAPT or permission errors.
3. **Phone bridge keeper**: Not running. USB/bridge recovery not self-healing.
4. **Google OAuth/GCP/Vertex/Gemini API**: Missing credentials prevent full integration stack.

## 11. Relay & Communication Infrastructure

- Bridge server: `codex-bridge/bridge.js` at port 8788 with token auth
- Cloudflare quick tunnel for remote access
- Watchdog: `codex-bridge/watchdog.ps1` — restarts relay, tunnel, lane bots
- Colony-agent-bot: `codex-bridge/colony-agent-bot.js` — shared lane runner, ~1s poll, 5min heartbeat
- Airlock pattern: two-hop ingress for external-to-internal security
- Oli Night Ops: `codex-bridge/oli-night-ops.ps1` — relay follow-ups + AnyDesk desktop prompts
- MCP servers: Google Developer Knowledge, OpenAI Developer Docs
- Internet-facing policy: architecture-level guidance only, redact environment fingerprints

## 12. Hardware & Build Profile

- Device: Acer Nitro AN515-52
- OS: Windows 11 Home (build 26200, 64-bit)
- CPU: Intel i5-8300H (4c/8t @ 2.30GHz)
- RAM: 15.85 GB
- GPU: NVIDIA GTX 1050 + Intel UHD 630
- Node: v22.12.0
- Port 4781: Asolaria primary
- ADB: authorized device R5CXA4MGQXV (Samsung phone)
- Google Play: `com.jessebrown.asolaria` (not yet published — 404)
