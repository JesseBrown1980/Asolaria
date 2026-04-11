# AGENTS.md — Asolaria Agent Operating Manual
> **READ THIS FIRST.** Every agent working in this Claude Project must read this entire file before taking any action.
> **Then read `CONSTITUTION.md`** — the governing law for all swarm work. AGENTS.md is operational guidance; the Constitution is binding law.
> **Last updated:** 2026-03-16 | Synthesized from Asolaria Notebook Mirrors + Owner directives + Anti-Drift Constitution v2

## -1. Governance Stack (Read Order)

Every agent session must load these documents in order:

| # | Document | Purpose |
|---|----------|---------|
| 1 | `AGENTS.md` (this file) | Operational rules, platform reference, task protocol |
| 2 | `CONSTITUTION.md` | Anti-drift law: 23 binding rules governing scope, contracts, authority, evidence, claims |
| 3 | `MISSION-PACK-PHASE0-1.md` | Current phase objectives and mandatory output structure |
| 4 | `SESSION-TRAILER-TEMPLATE.md` | Mandatory end-of-session state packet (must be produced every run) |
| 5 | `HANDOFF-20260316.md` | Latest handoff: pending restart, blocked items, code changes |
| 6 | `README.md` | Architecture, systems inventory, current status |

**The Constitution defines 7 types of drift.** Every agent must understand and prevent all 7:
1. Scope drift — building adjacent features
2. Contract drift — changing routes/schemas/topics without adapters
3. Ontology drift — re-labeling entities/roles breaking the civilization model
4. Authority drift — models self-assigning control
5. Phase drift — building advanced features before substrate is stable
6. Reality drift — claiming partial things are complete
7. Narrative drift — hype language replacing system truth

**Dan's hooks** (`src/connectors/hooksConnector.js`, `routes/hooks.js`) are the process-level safety net — `uncaughtException` / `unhandledRejection` handlers that keep Asolaria alive on crashes. These are critical infrastructure, not optional. They align with Constitution Section 11 (process supervision) and are the existing implementation of crash recovery.

---

## 0. Who You Are Working For

You are working for **Jesse Daniel Brown** (plasmatoid@gmail.com), the sole owner and operator of the Asolaria platform and Liris AI. Jesse operates from Brazil (Indaiatuba, São Paulo), often on ExpressVPN with a US egress.

This is a **private, high-trust project**. Jesse expects agents to:
- Be technically precise and direct — no fluff
- Preserve existing work; never overwrite or delete without explicit instruction
- Flag risk clearly before executing dangerous or irreversible actions
- Default to asking before mutating infrastructure, cloud resources, or production data

---

## 1. Foundational Rules (Non-Negotiable)

### 1.1 Output Policy — Channel-Aware
| Channel | Output Policy |
|---|---|
| This Claude Project (private) | Full technical details, exact configs, runnable code OK |
| Public / internet-facing | Abstraction-first: patterns + frameworks only; redact env fingerprints, keys, IPs, internal identifiers |

**Rule:** If you are unsure whether the channel is trusted, treat it as public and use abstraction-first outputs.

### 1.2 Memory & Notebook
- **NEVER delete notebook notes** unless Jesse explicitly says to delete a specific note
- Memory clear must only happen via the local-loopback endpoint (never via remote or agent-triggered)
- When writing new notes, do NOT overwrite existing notes — append or create new entries
- MCP flows must not silently compact or replace memory turns

### 1.3 Secrets & Credentials
- **Never** output API keys, tokens, passwords, or env secrets in responses, artifacts, or notebooks
- All secrets live in the Asolaria vault only
- GCP service account credentials are vault-only

### 1.4 Destructive Actions
Before any action that is destructive, irreversible, or mutates production state:
1. State what you are about to do
2. State the risk level (low / medium / high / critical)
3. Wait for explicit Jesse approval unless already pre-authorized in the current session

### 1.5 OpenClaw
OpenClaw is **PERMANENTLY DISABLED** on this host. Do not attempt to enable it, reference it in runnable configs, or suggest it as a solution.

---

## 2. Platform Reference (Know Before You Code)

### Local Server
- **Port:** 4781 (HTTP), 5443/5444 (HTTPS/TLS)
- **Public instance port:** 4791/5444 (separate runtime root)
- **Runtime isolation var:** `ASOLARIA_INSTANCE_ROOT`
- **Profile var:** `ASOLARIA_PROFILE` = `master` | `public`
- **Project root:** `C:\Users\acer\Asolaria`

### Phone / Mobile
- **Device:** Samsung SM-S721U1, Android 16 (SDK 36)
- **App package:** `com.jessebrown.asolaria`
- **Connection priority:** USB (ADB tcp:4781) → Tailscale/tailnet → VPN fallback
- **Tailnet endpoint:** `http://desktop-j99vcnh.tailb47e0e.ts.net:4782`
- **ADB reverse command:** `adb reverse tcp:4781 tcp:4781`
- **Control guard:** All phone control actions require Arm Controls (90s timer) before execution

### Brain / AI Provider Fallback
`Codex → Vertex Gemini → Gemini API → External → Template`
- Provider health, budgets, and telemetry are tracked
- Do not add new external providers without Jesse's directive

### Key Environment Variables
```
ASOLARIA_OPENCLAW_MODE=disabled
ASOLARIA_INSTANCE_ROOT=<path>
ASOLARIA_PROFILE=master|public
ASOLARIA_PUBLIC_MODE=true|false
ASOLARIA_OWNER_PLANE_EXECUTOR=auto|codex|claude
ASOLARIA_MQTT_BIND_HOST=127.0.0.1  (LAN broker on 0.0.0.0:18886)
```

### Falcon (Jesse's Phone)
Jesse's Samsung Galaxy S24 FE (SM-S721U1) is codename **Falcon** — his mobile relay to the computer from anywhere.
- **Role:** `super_admin` (highest privilege)
- **Auth:** Claude OAuth (MAX 20x), Gemini API key, MCP to Asolaria
- **ADB bridges:** 4781 (HTTP), 18883 (MQTT TCP), 18884 (MQTT WS), 8788 (bridge relay)
- **Pro-mirror:** scrcpy running for screen access
- **CLAUDE.md:** Full falcon identity at `/data/data/com.termux/files/home/CLAUDE.md`

### Madness Interactive / SwarmDesk
Asolaria integrates with **Madness Interactive** (https://madnessinteractive.cc/dashboard) — a 3D project visualization dashboard ("Mad Scientist's Observatory") built by Dan.
- **Login**: plasmatoid@gmail.com via Google OAuth
- **Omnispindle MCP**: registered at `https://madnessinteractive.cc/api/mcp/`
- **Dan's hooks**: Process-level safety net (server.js line 7) — keeps server alive on crashes
- **Task ledger**: 2,997+ objects in `data/task-ledger.json` — synced to dashboard
- **Export**: `src/swarmDeskExport.js` → dashboard, `tools/Send-SwarmDeskAssistantSync.js`
- **Real-time feeds**: MQTT topics → SwarmDesk 3D visualization
- **Asolaria works headless**: spawns MCP, opens ports without UI. Tool tokens low (40-80) via indexing system.

### Claude.ai Project
- **URL**: https://claude.ai/project/019cf67e-eb29-7465-b60e-b4c121172387
- This is the centralized knowledge base — **update README.md and AGENTS.md here as you discover new things**
- All agents should use this as shared memory, especially Helm on startup

---

## 3. Task Execution Protocol

### Before Starting Any Task
1. Read this file (AGENTS.md) ✅
2. Read README.md for project context
3. Check `TASKS.md` (the Task Ledger) — is there an existing task for this?
4. If yes: set task to `in_progress`; if no: confirm with Jesse before creating tasks
5. Identify the risk level of the task

### While Working
- Implement the **smallest safe slice** — don't over-engineer in one shot
- Add Task Ledger events as you complete sub-items
- Add notebook notes for significant decisions (not every step — only meaningful decisions)
- Prefer non-blocking implementations (async/child process) over sync/blocking calls

### After Completing a Task
- Mark task as `complete` in Task Ledger
- Add a notebook note summarizing what was done + validation results
- If the work changes behavior that agents need to know: update AGENTS.md or README.md
- Report back to Jesse with: what was done, validation results, next recommended step

---

## 4. Security Model — Know It

### Ingress Risk Levels
| Level | Examples | Behavior |
|---|---|---|
| low | Read-only queries, status checks | Auto-approve |
| medium | File writes, non-critical API calls | Auto-approve with logging |
| high | Cloud mutations, config changes | Require approval |
| critical | Destructive operations, credential access | Block + require explicit override |

### Allowlists
- Telegram ingress: allowlisted chat IDs only; high/critical risk → approval gating
- Skills: per-ingress skill allowlists enforced
- External posting: disabled by default (`allowExternalPosting=false`)

### Public Profile Guardrails
- Public instance blocks all sensitive endpoints (returns 403)
- Public profile env: `ASOLARIA_PROFILE=public`, `ASOLARIA_PUBLIC_MODE=true`
- Public runtime root is isolated: `C:\Users\acer\Asolaria-PublicRuntime`

---

## 5. Google / Cloud Accounts

### Primary Account (default for all Google integrations)
- `plasmatoid@gmail.com` — Gmail, Calendar, Drive, Docs, Keep, Tasks

### Professional Accounts (use only when explicitly needed)
- `jessebrown.soft1980@gmail.com`
- `jesse@jbrowndevelopmentllc.com`
- `plasmatoid@jbrowndevelopmentllc.com` (allowlisted for future connectors)

### GCP
- **Project ID:** `winged-complex-390417`
- **Project number:** `742368506950`
- **Default scopes:** `https://www.googleapis.com/auth/cloud-platform`
- Read-only by default; mutations require explicit approval + audit trail

---

## 6. Memory System Rules

### Notebook (data/notebook.json)
- Source of narrative decisions, progress notes, and system state
- Auto-backed up before any clear operation
- Mirrored to Google Docs via `/api/notebook/google/mirror/sync` (requires docs write scope)

### Task Ledger (TASKS.md)
- **Source of truth for all work items**
- States: `todo` → `in_progress` → `complete` | `blocked`
- Only one task `in_progress` at a time (unless Jesse directs otherwise)
- Events are logged per task as work proceeds

### MCP Speed Path
- Cached tool catalogs (avoid reloading on every call)
- Scoped context cache with TTL
- Dynamic allowed-tool selection
- Reuse `previous_response_id` where supported

---

## 7. Skill System Rules

### What Skills Are
Skills are the **unit of reuse and auditing** — declarative JSON step sequences executed by `skillRunner`.

### Skill Development Rules
- Every skill must declare its permissions
- Dangerous step-actions require forced approval gates
- Per-ingress allowlists must be respected (not all skills are available in all channels)
- Skills should be testable and include a dry-run mode where applicable
- When updating skills, reload the skill registry after changes

### Active Skills (examples)
- `phone.browser_history_check` — ADB browser diagnostics
- `ui.visual_audit` — Visual UI audit (on-demand, v0.3.0)
- `desktop.capture` — Desktop screenshot capture

---

## 8. Omnispindle Lane Rules

Omnispindle (`src/omnispindle.js`) spawns 5 Claude Code CLI agents:

| Lane | When to Use | Permissions |
|------|-------------|-------------|
| **Helm** | Orchestration, admin commands, colony control | Full controller authority |
| **Vector** | Research, analysis, reasoning tasks | Plan mode, read-heavy |
| **Rook** | Server ops, deployments, infrastructure | Full infra scope |
| **Forge** | Build, test, CI/CD pipelines | Full build scope |
| **Falcon** | Phone ADB, mobile apps, phone bridge | Full phone scope |

API: `POST /api/omnispindle/start`, `/stop/:lane`, `/status`, `/prompt/:lane`, `/broadcast`

---

## 9. MQTT Topics (Colony Coordination)

Broker: Aedes on ports 18883 (TCP), 18884 (WS), 18885 (TLS)

| Topic Pattern | Purpose |
|---|---|
| `asolaria/colony/commands` | Broadcast commands to all nodes |
| `asolaria/colony/status` | Node health heartbeats |
| `asolaria/phone/claude-code/tasks` | Phone-bound Claude Code tasks |
| `asolaria/phone/claude-code/results` | Phone task results |
| `asolaria/liris/#` | LIRIS sub-colony (Rayssa's PC) |
| `asolaria/swarmdesk/#` | SwarmDesk dashboard |

---

## 10. Phone RBAC

| Viewer ID | Role | Permissions |
|---|---|---|
| `falcon` (Jesse) | `super_master` | Full control, owner-plane, all endpoints |
| `felipe` | `phone_regular` | Read, basic phone features, no admin |
| `owner` / `asolaria` / `vector` | `super_master` | System identities |

Set via URL `?viewer=falcon` or header `X-Asolaria-Viewer`.

---

## 11. Vault Access Patterns

33 secrets in AES-256-GCM vault with DPAPI key hardening.

- **Read:** `getSecret("integrations.github.pat", { namespace: "owner" })`
- **Write:** `setSecret(name, value, meta)` — internal only, no REST write
- **Status:** `GET /api/vault/status` — metadata only, loopback-restricted
- **NEVER** read or log secret values in responses

---

## 12. GNN Monitoring

Graph Neural Network security watches colony network traffic:
- Training: `data/gnn-training-export-20260315.json`
- Events: `data/graph-runtime-events.ndjson` (6.7MB)
- Risk engine: heuristic-based

---

## 13. Colony Coordination

**LIRIS** (Rayssa's PC, 192.168.1.8): SSH bridge + MQTT for shared processing
**SwarmDesk** (Dan's hooks): Dashboard via `swarmDeskExport.js`
**Codex Bridge** (port 8788, room `asolaria_bridge`): Multi-node relay

---

## 14. Key Patterns (Reusable by All Agents)

### Pattern: Dan's Hooks (Crash Recovery)
- **Location:** server.js line 7
- **What:** `uncaughtException` + `unhandledRejection` handlers that keep Asolaria alive on crashes
- **Rule:** Never remove or weaken. They are the first line of defense. Constitution Section 11.

### Pattern: MCP Token Indexing (99.22% Reduction)
- **What:** Skills/tools/mistakes/projects index table — LLM loads index numbers instead of full tool schemas
- **Benchmark:** 50 inline tools = 5,382 tokens → 1 MCP pointer = 82 tokens → follow-up = 42 tokens
- **Implementation:** `externalBrainConnector.js` — MCP cache, dynamic allowlists, policy presets, TTL pruning
- **Report:** `reports/mcp_token_measurements_2026-02-19.json`

### Pattern: Toggle Switch (Auto-Approval)
- **What:** Dashboard approval toggle → set to auto-approve → build AI around the switch
- **Why:** Saves hundreds of hours of manual approvals during development
- **Implementation:** `guardianApprovalStore` + approval mode settings

### Pattern: Colony 4-Bot Security Shield
- **What:** Codex CLI Cloudflare secret rooms with 4-bot communication. Middle bots are security — each only responds to its master bot. Prevents direct agent-to-agent secrets/error extraction.
- **Implementation:** Colony bridge (port 8788), relay rooms

### Pattern: Nightly Self-Improvement Loop
- **What:** Cron jobs research upgrades → save to NotebookLM → morning summary absorbs new tech
- **Status:** Designed, partially implemented via standing directives

---

## 14b. Connectors Reference (42 Total — API-Verified 2026-03-16)

| Connector | Status | API-Verified Details |
|---|---|---|
| Augment Context (Auggie) | **LIVE** | Remote MCP via Cloudflare tunnel, `codebase-retrieval` tool, aggressive token reduction, read_only preset |
| HubSpot | **LIVE** (token expired) | Portal 51209071, plasmatoid@gmail.com, OAuth connected, needs token refresh (expired 03/14) |
| Symphony/Linear | **LIVE** | Elixir runtime port 4792, project `asolaria-symphony-e3159fb1e260`, Linear API key configured |
| Slack | **LIVE** | Bot token active, workspace T083SCLM, policy: private channels allowed, 80 msg limit |
| MQTT | **LIVE** | Aedes broker 18883 (TCP), 18884 (WS), 18885 (TLS), **18886 (LAN)** |
| LIRIS Sub-Colony | **LIVE** | Rayssa DESKTOP-PTSQTIE, asolaria-control MCP, collab-message working |
| Google Suite | Active | plasmatoid@gmail.com, OAuth |
| Telegram | Active | Polling; allowlisted IDs |
| Desktop capture | Active | Stable filenames |
| NotebookLM Enterprise | Partial | License-blocked |
| Vertex/Gemini | Active | GCP service account |
| Tailscale | Re-enabled | Service running but logged out — needs Jesse GUI auth |
| ADB/USB bridge | Partial | Felipe's phone unauthorized, Jesse's phone offline |
| GitHub | **NOT CONFIGURED** | PAT in vault but `/api/integrations/github` shows `not_configured` — needs wiring |
| Atlassian | **NOT CONFIGURED** | Enabled but no client ID/secret set |
| WhatsApp | Active | Guardian bridge (OpenClaw still listed as linked device — security issue) |
| Abacus | Active | AbacusAI |
| Cursor | Vault present | IDE credentials stored |
| Antigravity | Vault present | IDE credentials stored |
| WoL | Active | Wake-on-LAN |
| Chrome | **DOWN** | Extension MCP bridge not connecting — blocks Gmail, Drive, Linear MCPs |
| OpenClaw | Disabled | Permanently disabled |

---

## 15. Documentation Inventory

### In `docs/claude-project/` (governance stack)
- `CONSTITUTION.md` — 23-section Anti-Drift governance law (binding)
- `MISSION-PACK-PHASE0-1.md` — Current phase objectives
- `SESSION-TRAILER-TEMPLATE.md` — Mandatory end-of-session state packet
- `HANDOFF-20260316.md` — Latest handoff with pending items
- `bundle/` — Pre-built doc bundle for claude.ai upload (REFERENCES, HANDOVER_ROADMAP, ADRs, etc.)

### In `Downloads/` (reference docs from GPT/Codex sessions)
- `asolaria-system-card-20260303.md` — 18-section frontier-model analysis (425 lines): architecture, capabilities, security posture, performance benchmarks, MCP optimization, GNN concept transposition, comparative positioning, deep analysis pack
- `asolaria-mobile-architecture-card-20260303.md` — 13-section mobile plane analysis: route-to-gate security matrix, always-on bidirectional design, phone control trust boundaries
- `Edge-Level Graph Neural Network Architectures for Network Intrusion Detection.pdf` — Siemens research paper (Mehmet Baris Yaman): Prototype-GNN (94.24%), Contrastive-GNN (94.71%), GSL-GNN (96.66% accuracy, 99.70% ROC-AUC). This is the theoretical foundation for Asolaria's GNN sidecar.
- `Asolaria Research Package Deep Research Synthesis.pdf` — Deep research synthesis
- `Asolaria Systems Engineering Assessment.docx` — Engineering assessment
- `asolaria-openai-board-deck-20260309.pdf` — Board presentation deck
- `asolaria-openai-board-memo-20260309.pdf` — Board memo
- `asolaria-openai-board-system-card-20260309.pdf` — Board system card (cited version also exists)
- `asolaria-functional-spec.md` / `asolaria-requirements-spec.md` / `asolaria-technical-spec.md` — API specifications
- `asolaria-openapi-v1.yaml` — OpenAPI 3.1.0 spec (health + jobs endpoints)

### In `docs/adr/` (13 Architecture Decision Records)
- ADR-0000: Template
- ADR-0001: Strangler-fig monolith decomposition
- ADR-0002: Durable job queue WAL
- ADR-0003: Gateway auth skeleton
- ADR-0004: Connector manifest registry
- ADR-0005: Request attribution middleware
- ADR-0006: RBAC enforcement
- ADR-0007: Google write scopes
- ADR-0008: Visual world event contract
- ADR-0009: MCP audit logging
- ADR-0010: GNN preconditions
- ADR-0011: Security world mechanics
- ADR-0012: Tunnel auth hardening

### In `docs/` (operational + historical)
- `CREATION_HISTORY.md` — Full origin story: Jesse + Dan collaboration, SwarmDesk integration, architecture vision, timeline, key dates
- `GATEWAY_TOOL_AUTHORITY.md` — Tool authority patterns
- `AUTHORITY_MODES.md` — Authority mode definitions
- `HELM_CONTROLLER_SURFACES.md` — Helm controller API surfaces
- `AUGMENT_CONTEXT_SIDECAR.md` — Augment Context integration
- `ADMIN_TERMINAL_SIDECAR.md` — Admin terminal sidecar
- `CANONICAL_SOURCE.md` — Canonical source tracking
- `HANDOVER_ROADMAP.md` — Handover roadmap
- `STARTUP_CONTRACT_V1.md` — Startup contract
- `apihub/` — 3 API spec files + OpenAPI YAML
- `APP_REGISTRATION_DEMO_RUNBOOK.md` — App registration demo

### In `data/` (runtime data)
- `gnn-paper.txt` — GNN paper full text
- `gnn-training-export-20260315.json` — 820KB training data
- `graph-runtime-events.ndjson` — 6.7MB event log
- `standing-directives.json` — 6 active system directives from Helm
- `gateway-audit.ndjson` — 2.6MB, 7,343 audit entries
- `task-ledger.json` — 2,997+ task objects

---

## 16. Deferred / Out of Scope (Don't Touch)

These items are explicitly deferred until current stabilization is complete:

- **MCP/WebMCP progressive disclosure architecture** — index-first routing, code-mode wrappers, schema slimming
- **Full public productization** of Asolaria
- **NotebookLM Enterprise notebooks** — blocked by license; don't attempt workarounds
- **New external AI provider integrations** — use existing fallback chain

---

## 10. Working in This Claude Project

### Source of Truth for Docs
Local files in `docs/claude-project/` are the source of truth. Sync to the Claude.ai Project via:
- Browser automation (Chrome extension / computer-use) when available
- Asolaria API connector (planned — see connector roadmap)
- Manual drag-upload by Jesse as fallback

### Context Limitations
- Claude Projects have memory scoped to this project only
- The most recent Asolaria Notebook Mirror (2026-03-10) is too large to auto-fetch via Drive API — it contains the most up-to-date state including Liris AI details
- When you need current state: ask Jesse or attempt `google_drive_search` for specific topics

### Liris AI
Liris AI is the externally-facing product/brand built on Asolaria. When working on Liris AI tasks:
- Check Drive for the 2026-03-10 Notebook Mirror: `1mBCEosR3JFcsBKQGho7OX-z21V8jNXP7Wu2ljj8QITw`
- Ask Jesse for the current Liris AI product spec, positioning, and roadmap before building
- Maintain clean separation between Asolaria (platform) and Liris AI (product layer)

### Agent Collaboration
- Multiple agents may work in this project; coordinate via Task Ledger
- Do not assume another agent's work is current — verify state before building on it
- Leave clear notes in AGENTS.md or README.md when you establish conventions others should follow

---

## 11. Escalate to Jesse When...

- Any action has **high or critical** risk level
- You encounter conflicting instructions between this doc and a notebook note
- The task requires a Google OAuth re-consent or new API enablement
- The task involves billing, IAM, or GCP project-level changes
- You are unsure whether a Liris AI decision belongs to the product roadmap or Asolaria infrastructure

---

## 12. Route Extraction Status (ADR-0001 Phase 3)

The 2026-03-15 modularization extracted routes from server.js into separate files. Two catch-all buckets remain:

| File | Lines | Status |
|------|-------|--------|
| `routes/remaining.js` | 3,313 | **ctx fixed** (2026-03-16) — 50+ functions now passed through ctx |
| `routes/integrationsRemaining.js` | 3,204 | **ctx fixed** (2026-03-16) — 72 functions now passed through ctx |

**Pattern:** server.js passes a ctx object to each route module: `require("./routes/foo")(ctx)`. The route destructures what it needs. If a function is used in the route but not in ctx, it causes a runtime `ReferenceError`.

**If you find new dead refs:** Add the function to both:
1. The ctx object in `server.js` (find the `require("./routes/...")({...})` call)
2. The destructure at the top of the route file

**Special case:** Mutable `let` variables can't be passed directly (they'd snapshot). Use a getter: `getVarName: () => varName` in ctx, then `getVarName()` in the route.

---

## 13. Current Handoff

**Read `docs/claude-project/HANDOFF-20260316.md`** for the complete handoff from the 2026-03-16 session. Key items:
- **Asolaria RESTARTED** (2026-03-16 ~16:14 BRT) — all 120+ ctx fixes, spark models now live and verified
- Both previously-broken endpoints confirmed working: `/api/providers/external/status`, `/api/integrations/mqtt/browser-feed`
- Chrome extension MCP bridge is broken — blocks claude.ai upload, WhatsApp, Gmail
- Tailscale logged out — needs Jesse GUI auth
- Full doc inventory cataloged — see Section 15

---

## Changelog (keep this updated)

| Date | Change | Agent |
|---|---|---|
| 2026-03-16 | Initial synthesis from Notebook Mirrors + Drive | Claude (Asolaria Project) |
| 2026-03-16 | Added Omnispindle, MQTT, phone RBAC, vault, GNN, colony, Madness Interactive sections | Claude Code (Opus 4.6) |
| 2026-03-16 | Added route extraction status, handoff reference, fixed 120+ dead refs | Claude Code (Opus 4.6) |
| 2026-03-16 | Asolaria restarted, endpoints verified, full doc inventory cataloged (Section 15), phone model fixed to Galaxy S24 FE | Claude Code (Opus 4.6) |
| 2026-03-16 | Created CREATION_HISTORY.md — full origin story from Jesse↔Dan WhatsApp chat, SwarmDesk screenshots, timeline | Claude Code (Opus 4.6) |

---

*This document is sourced from: Asolaria Notebook Mirror (2026-02-21), Asolaria Notebook Mirror 2026-03-10 (partial), and Jesse's owner directives captured in notebook notes. Update it whenever you establish new conventions or policies.*
