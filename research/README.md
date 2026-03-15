# Asolaria Research Package
Generated: 2026-03-14T18:30:00Z
For: SURE AI / Big AI reasoning context upload

## How to Use This Package

Upload the entire `research/` folder. The Big AI should start with `asolaria-state-of-the-world-20260314.md` for full context, then drill into the other documents as needed. The source reports listed below are referenced by relative path from the Asolaria root.

---

## Research Documents (This Folder)

### 1. State of the World (START HERE)
`asolaria-state-of-the-world-20260314.md`
- Complete system overview, agent colony, Linear issues, completed work, blockers, integration status, hardware profile
- 12 sections covering everything the Big AI needs to plan

### 2. Agent Profiles Registry
`agent-profiles-registry.md`
- All agent identities: Helm, Sentinel, Vector, Rook, Forge, Falcon, Watchdog, Asolaria
- Two-layer naming system (admin terminals vs. bridge lanes) — critical distinction
- Avatar/NPC profile, bridge profile spec, civilization world entity mapping
- Restart bootstrap sequences for each terminal

### 3. Architectural Debt Brief
`architectural-debt-brief.md`
- Monolith analysis: server.js (29,500 lines), app.js (2,100+ lines)
- Global mutable state catalog (30+ variables)
- localStorage pseudo-database (15+ keys)
- Report sprawl (1,500+ files)
- Decomposition priorities and what's working well

---

## Source Reports (Referenced, in `reports/`)

### Agent Identity & Colony
- `reports/admin-terminal-helm-profile-latest.md` — Helm controller profile
- `reports/admin-terminal-sentinel-profile-latest.md` — Sentinel helper/watch profile
- `reports/admin-terminal-identities-latest.md` — Identity registry + naming correction
- `reports/qdd-super-swarm-contract-latest.md` — QDD super-swarm coordination contract
- `reports/agent-profile-notebooklm-untangle-20260308.md` — Identity lock + relay smoke test
- `reports/codex-state-freeze-latest.md` — Codex state freeze for restart
- `reports/helm-controller-packet-latest.md` — Active controller packet

### System Snapshots
- `reports/asolaria-snapshot-20260312-113157Z.md` — Full system snapshot (Mar 12)
- `reports/asolaria-current-build-profile.md` — Hardware + build profile
- `reports/cross-surface-audit-20260312-083420.md` — Cross-surface task/mobile/notebook audit

### QDD / EZ Protect
- `reports/qdd-ez-protect-rollout-evidence.md` — EZ Protect rollout evidence
- `reports/qdd-ez-protect-finish-checklist.md` — Finish checklist (blocked)
- `reports/qdd-codex-restart-packet-latest.md` — QDD restart packet
- `reports/qdd-monorepo-ez-protect-checkpoint-latest.md` — Monorepo checkpoint
- `reports/qdd-external-admin-handoff-latest.md` — External admin handoff

### SwarmDesk / Civilization World
- `reports/super-swarm/swarmdesk-browser-mqtt-hybrid.md` — MQTT transport for SwarmDesk
- `reports/super-swarm/civilization-world-latest.json` — Latest world state JSON
- `reports/super-swarm/swarmdesk-export-live.json` — Live SwarmDesk export

### Phone / Mobile
- `reports/task-closeout-phone-tunnel-startup-lane-falcon.md` — Phone tunnel smoke test
- `reports/phone-tunnel-smoke-falcon-latest.md` — Latest Falcon lane tunnel test
- `reports/asolaria-mobile-architecture-card-20260303.md` — Mobile architecture card

### Startup & Runtime
- `reports/one-button-start-latest.md` — Latest one-button startup report
- `reports/system-restart-handoff-latest.md` — System restart handoff
- `reports/startup-methods-latest.md` — Startup methods documentation
- `reports/morning-handoff-latest.md` — Morning handoff notes

### Sector Drift & Watch
- `reports/sector-drift-watch-latest.md` — Latest Sentinel drift watch report

### MCP & External Brain
- `reports/system-upgrade-loop-2026-02-19.md` — MCP runtime baseline
- `reports/mcp-webmcp-efficiency-validation-20260308.md` — MCP token efficiency

### Skills & Mistakes Index
- `reports/skills-tools-mistakes-index-latest.md` — Skills/tools/mistakes index

---

## External Sources (Not in This Folder)

### Bridge Infrastructure
- `C:\Users\acer\AGENTS.md` — Bridge relay setup, manual commands, agent creation rules
- `C:\Users\acer\codex-bridge\AGENT_PROFILE_SPEC.md` — Profile spec v1
- `C:\Users\acer\codex-bridge\profiles\agent-profile.template.json` — Template

### Linear (ASO Team)
- ASO-10: Integrate entity graph with SwarmDesk (In Progress, High)
- ASO-8: EZ Protect rollout (Urgent, BLOCKED — missing CHARM_EZ_PROTECT_* values)
- ASO-9: Track QDD rollout evidence blockers (Done)
- ASO-7: Asolaria runtime cleanup (Done)

### QDD Monorepo
- `D:\projects\QDD\ebacmap-master` — Authoritative repo, branch `feature/ez-protect-admin-monorepo`

### Natural 20 Daily Feed
- URL: `https://natural20.com`
- Server integration: `server.js:4359` (URL), `server.js:16072` (fetch function)
- Client integration: `app.js:72` (button), `app.js:1939-2023` (daily check + open)

### Avatar Data
- `data/avatar-npc/*/avatar-profile.json` — 4 generated NPC variants

---

## Active Blockers (Summary)

1. **EZ Protect**: Missing `CHARM_EZ_PROTECT_*` env values — all ASO-8 downstream tasks blocked
2. **NotebookLM Enterprise**: 3/4 Google accounts have RAPT/permission errors
3. **Phone bridge keeper**: Not running — no self-healing for USB/bridge recovery
4. **Google OAuth/GCP/Vertex/Gemini API**: Missing credentials block full integration stack
