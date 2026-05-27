# Asolaria — Project README
> **Last synthesized:** 2026-03-16 | **Source:** Asolaria Notebook Mirrors (Drive) + Project context + Anti-Drift Constitution v2
> **Living document.** Update this file as the project evolves. Agents: see `AGENTS.md` before starting any task.
> **Governance:** This project is governed by `CONSTITUTION.md` (23 binding laws). Current mission: `MISSION-PACK-PHASE0-1.md`. Every session must end with `SESSION-TRAILER-TEMPLATE.md`.

---

## What Is Asolaria?

**Asolaria** is Jesse's personal AI orchestration platform — a self-hosted, local-first Node.js server that serves as a command center for automation, AI-powered skills, phone control, cloud integrations, and agent workflows. It is the operating system for Jesse's digital life, running on a Windows desktop (C:\Users\acer\Asolaria) and exposed selectively via mobile app, Telegram, Tailscale VPN, and USB bridge.

**Liris AI** is the broader product/company layer being built on top of Asolaria's capabilities — the externally-facing AI brand and product suite. *(Note: Liris AI details are in the large 2026-03-10 Notebook Mirror which could not be fully fetched. Agents should query Jesse or search Drive for the latest Liris AI scope when working on product/brand tasks.)*

---

## Core Identity

| Property | Value |
|---|---|
| Owner | Jesse Daniel Brown |
| Primary email | plasmatoid@gmail.com |
| GCP Project | winged-complex-390417 (proj #: 742368506950) |
| Local path | C:\Users\acer\Asolaria |
| Main server port | 4781 (HTTP) / 5443-5444 (HTTPS) |
| Android app | com.jessebrown.asolaria v0.1.0 |
| Phone device (Jesse) | Samsung Galaxy S24 FE (SM-S721U1), Android 16 (SDK 36), serial R5CXA4MGQXV |
| Phone device (Felipe) | Samsung SM-A065M, serial R9QY205KAKJ |
| Tailnet endpoint | desktop-j99vcnh.tailb47e0e.ts.net:4782 |
| Codebase size | ~24K server.js (wiring) + 35 routes + 51 src modules + 48 connectors + 4 sidecars (modularized 2026-03-15) |
| SwarmDesk | https://madnessinteractive.cc/dashboard (plasmatoid@gmail.com, Google OAuth) |
| GitHub PAT | Vault: `integrations.github.pat` (full admin scopes, no expiration) |
| Squarespace | krill-grape-wpzs.squarespace.com (jesse@jbrowndevelopmentllc.com, Google Auth) |
| Claude.ai Project | https://claude.ai/project/019cf67e-eb29-7465-b60e-b4c121172387 |

---

## Architecture Overview

### The 6-Layer Stack

```
┌─────────────────────────────────────────────┐
│  1. INGRESS (Channels)                       │
│     Local Admin UI · Mobile Console ·        │
│     Telegram · Relay/Airlock (future)        │
├─────────────────────────────────────────────┤
│  2. ROUTER + QUEUE                           │
│     intentRouter (strict command routing)    │
│     jobQueue (background + monitors)         │
├─────────────────────────────────────────────┤
│  3. SKILL SYSTEM                             │
│     skills/skill.json → skillRunner          │
│     Permissions · Approval gates · Allowlist │
├─────────────────────────────────────────────┤
│  4. POLICY ENGINE                            │
│     riskEngine · guardianApprovalStore       │
│     Per-ingress thresholds · Cost limits     │
├─────────────────────────────────────────────┤
│  5. CONNECTORS (Tools)                       │
│     Desktop · Browser · Google · GCP ·      │
│     Telegram · Phone/ADB                    │
├─────────────────────────────────────────────┤
│  6. MEMORY + TRACKING                        │
│     Notebook (narrative) · Task Ledger       │
│     Memory snapshots · Audit trail           │
└─────────────────────────────────────────────┘
```

### Brain Provider Fallback Chain
`Codex → Vertex Gemini → Gemini API → External → Template`

### Worker Router (Owner-Plane Execution)
4 worker profiles in `src/connectors/workerRouter.js`:
- `local_codex` — Owner-plane executor (OpenAI Codex CLI, gpt-5.4)
- `claude_max` — Claude Code CLI (Anthropic), plan mode (upgraded to full for owner-plane)
- `abacus` — AbacusAI integration
- `symphony` — Symphony/Linear integration

**Dual Owner-Plane Executor** (implemented 2026-03-16):
- Env var `ASOLARIA_OWNER_PLANE_EXECUTOR` controls routing: `codex` | `claude` | `auto` (default)
- `auto` mode: probes Codex health (6s timeout, 60s cache), falls back to Claude if Codex is down
- `resolveOwnerPlaneExecutor()` in workerRouter.js handles routing logic
- `probeCodexHealth()` in codexConnector.js spawns `codex --version` for health check
- `dispatchToClaudeMax()` uses `permissionMode: "full"` for owner-plane work (was "plan")

### Omnispindle (Agent Spawner)
`src/omnispindle.js` — 537-line agent spawner managing 5 lanes via Claude Code CLI:
| Lane | Role | System Prompt Focus |
|------|------|---------------------|
| **Helm** | Controller | Admin terminal, orchestration, command authority |
| **Vector** | Main Brain | Primary reasoning, research, analysis |
| **Rook** | Ops/Infra | Infrastructure, deployments, server ops |
| **Forge** | Build/CI-CD | Build pipelines, testing, compilation |
| **Falcon** | Phone Lane | ADB commands, mobile apps, phone-desktop bridge |

Each lane spawns a Claude Code CLI child process with a dedicated system prompt. Routes: `POST /api/omnispindle/start`, `/stop`, `/status`, `/prompt`, `/broadcast`

### MQTT Broker (Colony Coordination)
Aedes-based broker on ports **18883** (TCP), **18884** (WebSocket), **18885** (TLS) — bound to 127.0.0.1 by default.
**LAN broker** on port **18886** (TCP, 0.0.0.0) — for Rayssa's LIRIS sub-colony access (started 2026-03-16).
Used for real-time colony coordination between:
- Desktop Asolaria (primary node)
- Phone agents (via ADB reverse bridge)
- LIRIS sub-colony (Rayssa's PC at 192.168.1.8 — use port 18886)
- SwarmDesk dashboard (Dan's hooks)

### Colony Architecture
`src/civilizationWorld.js` — 1,284-line civilization world model:
- MCP towers and gates for external system bridging
- Remote node registration and health monitoring
- Colony agent lifecycle management
- Event-driven world state updates (1,338+ events logged in NDJSON)

### LIRIS Sub-Colony
Rayssa's PC at **192.168.1.8** running Claude Code + MCP bridge:
- SSH bridge (key currently revoked — needs re-authorization)
- Shared processing capacity with Asolaria
- Connected via MQTT for task distribution
- Manages separate agent lanes for parallel workloads

### GNN Security System
Graph Neural Network monitoring and intrusion detection:
- Edge-level GNN architecture for IoT traffic analysis
- Training pipeline: `data/gnn-training-export-20260315.json` (820KB)
- Research paper: `data/gnn-paper.txt` (Siemens, edge-level architectures)
- Graph runtime events: `data/graph-runtime-events.ndjson` (6.7MB, NDJSON)
- Runtime manifests: `data/graph-runtime-manifests.ndjson` (200KB)

### Vault (Secrets Management)
AES-256-GCM encryption with DPAPI key hardening:
- **44 secrets** across 2 namespaces (`owner` + `asolaria`)
- Key integrations stored: Google OAuth, GCP service account, Vertex AI, Gemini API, GitHub PAT, Slack, HubSpot, Atlassian, MQTT, WhatsApp, Symphony, Abacus, Cursor, Antigravity, Augment Context, OpenAI
- Personal credentials stored (2026-03-16): eBacMap staging, Squarespace, VPN, phone numbers, Israel address, banking, passport, VISA application, Cisco test, Georgia Southern, contact addresses
- Access: `getSecret(name, {namespace: "owner"})` — internal only, no REST write endpoint
- Vault status: `GET /api/vault/status` (read-only, metadata only, loopback-restricted)

---

## Key Systems & Components

### Phone Mode (Multi-Device)
Two phones connected via ADB reverse bridge + Tailscale:

| Device | Owner | Viewer ID | RBAC Role | Serial |
|--------|-------|-----------|-----------|--------|
| Samsung Galaxy S24 FE (SM-S721U1) | Jesse | `falcon` | `super_admin` | R5CXA4MGQXV |
| Samsung Galaxy A06 (SM-A065M) | Felipe | `felipe` | `phone_regular` | R9QY205KAKJ |

- **Connection priority:** USB (ADB) → Tailscale VPN (tailnet) → ExpressVPN fallback
- **Phone dashboard:** `public/phone-mode.html` — dynamic viewer names via `?viewer=falcon` or `?viewer=felipe`
- **RBAC hierarchy:** super_master > phone_master > desktop_regular > phone_regular > unknown
- **Termux on Felipe's phone:** nodejs, npm, python3.12, pip, curl, ssh installed (F-Droid)
- **Control guard:** 90s arm/disarm timer for phone control actions
- **ADB reverse bridges:** `adb reverse tcp:4781 tcp:4781` (HTTP) + `tcp:18883` (MQTT) + `tcp:18884` (WS) + `tcp:8788` (bridge relay)
- **Falcon (Jesse's phone) setup (2026-03-16):** Claude OAuth (MAX 20x), Gemini API key, CLAUDE.md with super_admin identity, MCP to Asolaria, pro-mirror (scrcpy) running
- **Felipe's phone:** ADB unauthorized (192.168.1.10:5555) — needs screen approval

### 🧠 Memory / Notebook
- **Local store:** `data/notebook.json` (NOT Google NotebookLM chats)
- **Policy:** Never delete notes unless explicitly approved by owner
- Memory clear creates backup snapshots automatically
- MCP speed path: cached tool catalogs + scoped context TTL + previous_response_id reuse
- Google Docs mirror sync available via `/api/notebook/google/mirror/sync`

### 🛠 Skills System
- Declarative JSON skills → skillRunner with hooks
- Registry supports thin list + detail-by-id fetch
- Per-ingress skill allowlists enforced
- Skills ship with: permissions, forced approvals on dangerous actions, dry-run mode (planned)

### Security Architecture (Multi-Layer)
Asolaria's security system watches and isolates all integrations:

1. **Gateway Tool Authority** (`src/gateway/toolAuthority.js`, 22KB) — Approval workflows, policy enforcement, graph event emission. All mutations go through authority chain.
2. **Gateway Audit** (`data/gateway-audit.ndjson`, 7,343 entries) — Every action logged with actor, tool, decision, timestamp.
3. **GNN Edge-Level Monitoring** — Graph Neural Network watches colony network traffic for anomalies. Trained model at `services/gnn*/baseline_model.pt` (55KB). Based on Siemens research (96.66% accuracy).
4. **Standing Directives** (`data/standing-directives.json`) — 6 active directives from Helm including contract preservation, anti-drift activation, OpenAI block policy.
5. **RBAC** (ADR-0006) — Per-viewer authority levels: super_master > phone_master > desktop_regular > phone_regular > unknown.
6. **Dan's Hooks** — Process-level crash recovery (server.js line 7). uncaughtException + unhandledRejection.
7. **Colony 4-Bot Shield** — Cloudflare secret rooms, security bots prevent direct agent-to-agent secrets extraction.
8. **Mistake Ledger** (`data/mistake-ledger.ndjson`) — Tracks agent errors for pattern learning.

**Key constraint:** You cannot directly POST to Asolaria's notebook or mutation endpoints from outside — you must go through the governance layer. This is by design.

- **OpenClaw:** DISABLED (`ASOLARIA_OPENCLAW_MODE=disabled`)
- **External posting:** DISABLED (`allowExternalPosting=false`)
- Public profile: `ASOLARIA_PROFILE=public`, `ASOLARIA_PUBLIC_MODE=true`, port 4791/5444
- Master/Public split via `ASOLARIA_INSTANCE_ROOT` runtime isolation

### ☁️ Cloud / GCP
- Default scopes: `https://www.googleapis.com/auth/cloud-platform`
- Enabled APIs: `discoveryengine`, `serviceusage`, `cloudresourcemanager`, `docs`
- NotebookLM Enterprise: API wired, but blocked by license tier (requires subscription assignment)
- GCP roles: `roles/owner` for service account + user

### Connectors (42 total, 33 manifests completed)
- **Google:** Gmail, Calendar, Drive, Docs, Keep, Tasks (OAuth via plasmatoid@gmail.com)
- **Telegram:** Polling + webhook, allowlisted IDs, approval gating
- **Desktop:** Capture, window list/focus, click/type (gated behind approvals)
- **GCP/Vertex/Gemini:** Service account auth, read-only default
- **NotebookLM Enterprise:** API wired via discoveryengine.googleapis.com (license-blocked)
- **Tailscale:** Private internet path (was disabled by rogue agent, re-enabled 2026-03-16)
- **GitHub:** PAT stored in vault (full admin scopes, no expiration)
- **Slack:** Bot/app credentials in vault
- **HubSpot:** OAuth in vault
- **Atlassian:** Jira/Confluence OAuth via plasmatoid@gmail.com
- **MQTT:** Aedes broker, credentials in vault
- **WhatsApp:** Guardian bridge for messaging
- **Symphony:** Linear/workflow integration
- **Abacus:** AbacusAI integration
- **Madness Interactive / SwarmDesk:** 3D project visualization dashboard at https://madnessinteractive.cc/dashboard (plasmatoid@gmail.com, Google OAuth). Omnispindle MCP registered at madnessinteractive.cc/api/mcp/. Export via `src/swarmDeskExport.js`, sync via `tools/Send-SwarmDeskAssistantSync.js`. Dan's hooks (process-level safety net) + SwarmDesk source at `C:/Users/acer/swarmdesk-src/`. 2,997+ task objects in `data/task-ledger.json`. MQTT real-time feeds to dashboard. Tracked issue: ASO-10
- **Cursor:** IDE integration (vault credentials present)
- **Antigravity:** IDE integration (vault credentials present)
- **Augment Context:** Context augmentation engine
- **Phone/ADB:** Mirror, dev options, scrcpy, virtual display, WhatsApp bridge
- **Chrome:** Profile management, extension detection, CDP integration
- **WoL:** Wake-on-LAN for remote power

---

## Active Google Accounts

| Account | Purpose |
|---|---|
| plasmatoid@gmail.com | Primary / phone / default |
| jessebrown.soft1980@gmail.com | Professional flows |
| jesse@jbrowndevelopmentllc.com | Workspace/org |
| plasmatoid@jbrowndevelopmentllc.com | Future connectors (allowlisted) |

---

## Codex Status (2026-03-16)
Codex CLI is working with model `gpt-5.4` (default). Locked model map for `/api/providers/openai/run` includes: `gpt-5.3-codex-spark` (fast research), `gpt-5.3-spark-mini`, `gpt-5-mini`, `gpt-5.2-instant`, `gpt-5.2`, `gpt-5.1`, `gpt-5`, `gpt-oss-120b`. However, 4 MCP servers fail on Codex startup:
- `omnispindle` — FAILED
- `augment-context` — FAILED
- `asolariaWeb` — timed out (10s)
- `notebooklmMcp` — timed out (10s)

Fix: increase `startup_timeout_sec` in Codex's `config.toml` for each MCP server.

## NextGen Roadmap (as of 2026-02-18)

| # | Task | Status |
|---|---|---|
| 1 | Skills v1 hardening | In progress |
| 2 | Telegram connector | ✅ Shipped |
| 3 | Brain provider fallback hardening/telemetry | Planned |
| 4 | Computer control layer | Planned |
| 5 | Rules engine | In progress |
| 6 | Audit + packaging (public profile, docs) | Planned |
| 7 | MCP/WebMCP progressive disclosure | Deferred |

---

## Key Policies (Owner Directives)

1. **Memory preservation:** Do not delete notebook notes unless explicitly approved
2. **Abstraction-first externally:** In internet-facing/public agent sessions, use architecture-level guidance + redact env fingerprints. In trusted/private channels, full details are OK
3. **OpenClaw off:** No OpenClaw execution on this host
4. **Secrets in vault only:** Never expose keys/tokens in notebooks, notes, or agent outputs
5. **Safe auto memory:** MCP flows must not overwrite existing notes
6. **USB-first for phone:** Default startup preference is USB, then tailnet, then VPN

---

## Important File Locations

```
C:\Users\acer\Asolaria\
├── AGENTS.md                          ← Agent rules (canonical)
├── TASKS.md                           ← Task ledger (source of truth)
├── data\
│   ├── notebook.json                  ← Memory store
│   └── memory.backup.*.json           ← Auto-backups on clear
├── tools\
│   ├── Start-Asolaria-Phone.ps1
│   ├── Start-Asolaria-Public.ps1
│   ├── Test-Asolaria-PhoneTunnelPath.ps1
│   ├── Refresh-Asolaria-PhoneDeployment.ps1
│   └── snapshot-asolaria.js
├── reports\
│   ├── asolaria-snapshot-latest.json
│   ├── phone-tunnel-smoke-latest.md
│   └── startup-methods-latest.md
├── logs\
│   └── startup-method-paths.json
└── PUBLIC_DEPLOYMENT.md
```

---

## Key API Endpoints (Reference)

```
GET  /api/health
GET  /api/mobile/control/status
POST /api/mobile/ui/open
POST /api/mobile/help/recover
GET  /api/mobile/tunnel/monitor/status
GET  /api/notebook/google/mirror/status
POST /api/notebook/google/mirror/sync
GET  /api/integrations/notebooklm/enterprise/status
GET  /api/captures
POST /api/settings
POST /api/mobile/screen/capture
```

---

## About Liris AI

Liris AI is the externally-facing product/company brand built on Asolaria's infrastructure. It represents the commercialization and productization layer. Full details are in the **Asolaria Notebook Mirror 2026-03-10** (Drive doc — too large to auto-fetch; Jesse or agents should access it directly for current Liris AI scope, positioning, and roadmap).

**To access:** https://docs.google.com/document/d/1mBCEosR3JFcsBKQGho7OX-z21V8jNXP7Wu2ljj8QITw/edit

---

## Current Status (2026-03-16 ~17:00 BRT)

### Completed This Session
- Fixed 120+ dead references in `routes/remaining.js` (50+) and `routes/integrationsRemaining.js` (72) — ADR-0001 Phase 3 ctx extraction cleanup
- Added `gpt-5.3-codex-spark` and `gpt-5.3-spark-mini` to locked model map
- Stored 11 credential sets from address.txt in vault (44 total secrets)
- Configured falcon phone (Jesse's SM-S721U1) as super_admin with Claude OAuth, Gemini API, CLAUDE.md identity
- Updated all project docs with Madness Interactive, modular architecture, colony details
- **Restarted Asolaria** — all code changes now live and verified:
  - `/api/providers/external/status` — working (returns provider list)
  - `/api/integrations/mqtt/browser-feed` — working (returns MQTT config)
  - `/api/health` — healthy with WAL, colony bridge, relay all running
- Cataloged full documentation inventory (system cards, mobile architecture, GNN paper, API specs, board decks)
- Integrated Anti-Drift Constitution v2 (23 sections of binding governance law)

### Blocked
- Chrome extension MCP bridge unreachable — blocks claude.ai upload, WhatsApp, Gmail
- Tailscale logged out — needs Jesse GUI authentication
- Felipe's phone ADB unauthorized (192.168.1.10:5555) — needs screen tap
- Jesse's phone ADB offline — last seen on WiFi 192.168.1.6:5555

### Documentation Ecosystem
Asolaria has a rich documentation ecosystem across multiple locations:
- **`docs/claude-project/`** — Governance stack (Constitution, Mission Pack, Session Trailer, Handoff)
- **`docs/adr/`** — 13 Architecture Decision Records (ADR-0000 through ADR-0012)
- **`docs/`** — Operational docs (gateway authority, authority modes, helm surfaces, startup contract, etc.)
- **`Downloads/`** — Reference docs from research sessions: system card (425 lines), mobile architecture card, GNN paper (Siemens, 96.66% accuracy), research synthesis, engineering assessment, OpenAI board deck/memo/system cards, API specs, OpenAPI YAML
- **`data/`** — Runtime data: GNN training export, graph events, standing directives, gateway audit, task ledger

---

## How to Update This Document

This README is a living document. When any agent completes significant work:
1. Add a note to `data/notebook.json` via Asolaria's notebook API
2. Sync the notebook mirror to Drive
3. If changes affect agent behavior rules, also update `AGENTS.md`
4. If working in this Claude Project, update this README directly

*Claude Project note: The most recent notebook mirror (2026-03-10) is too large to auto-fetch via Drive API. Jesse — consider exporting periodic summaries or a condensed "current state" doc for agent context.*
