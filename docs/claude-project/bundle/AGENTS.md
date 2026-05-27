# AGENTS.md — Asolaria Agent Operating Manual
> **READ THIS FIRST.** Every agent working in this Claude Project must read this entire file before taking any action.
> **Last updated:** 2026-03-16 | Synthesized from Asolaria Notebook Mirrors + Owner directives

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
Jesse's Samsung Galaxy S25 (SM-S721U1) is codename **Falcon** — his mobile relay to the computer from anywhere.
- **Role:** `super_admin` (highest privilege)
- **Auth:** Claude OAuth (MAX 20x), Gemini API key, MCP to Asolaria
- **ADB bridges:** 4781 (HTTP), 18883 (MQTT TCP), 18884 (MQTT WS), 8788 (bridge relay)
- **Pro-mirror:** scrcpy running for screen access
- **CLAUDE.md:** Full falcon identity at `/data/data/com.termux/files/home/CLAUDE.md`

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

## 14. Connectors Reference (42 Total)

| Connector | Status | Notes |
|---|---|---|
| Google Suite | Active | plasmatoid@gmail.com |
| Telegram | Active | Polling; allowlisted IDs |
| Desktop capture | Active | Stable filenames |
| NotebookLM Enterprise | Partial | License-blocked |
| Vertex/Gemini | Active | GCP service account |
| Tailscale | Re-enabled | Was disabled by rogue agent |
| ADB/USB bridge | Active | Both phones |
| GitHub | Active | PAT in vault (full admin) |
| Slack | Active | Bot/app in vault |
| HubSpot | Active | OAuth in vault |
| Atlassian | Active | Jira/Confluence OAuth |
| MQTT | Active | Aedes, ports 18883-18885 |
| WhatsApp | Active | Guardian bridge |
| Symphony | Active | Linear/workflow |
| Abacus | Active | AbacusAI |
| Cursor | Vault present | IDE credentials stored |
| Antigravity | Vault present | IDE credentials stored |
| Augment Context | Active | Context engine |
| WoL | Active | Wake-on-LAN |
| Chrome | Active | Profile mgmt, CDP |
| OpenClaw | Disabled | Permanently disabled |

---

## 15. Deferred / Out of Scope (Don't Touch)

These items are explicitly deferred until current stabilization is complete:

- **MCP/WebMCP progressive disclosure architecture** — index-first routing, code-mode wrappers, schema slimming
- **Full public productization** of Asolaria
- **NotebookLM Enterprise notebooks** — blocked by license; don't attempt workarounds
- **New external AI provider integrations** — use existing fallback chain

---

## 10. Working in This Claude Project

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

## Changelog (keep this updated)

| Date | Change | Agent |
|---|---|---|
| 2026-03-16 | Initial synthesis from Notebook Mirrors + Drive | Claude (Asolaria Project) |

---

*This document is sourced from: Asolaria Notebook Mirror (2026-02-21), Asolaria Notebook Mirror 2026-03-10 (partial), and Jesse's owner directives captured in notebook notes. Update it whenever you establish new conventions or policies.*
