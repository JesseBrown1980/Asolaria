# Agent Profiles Registry
Generated: 2026-03-14

## Naming Layers (Critical Distinction)

There are TWO separate layers. Conflating them causes restart memory corruption and coordination failures.

### Layer 1: Admin Terminals (Human-Facing)
These are the names the owner sees and interacts with. They control the colony.

| Call Name | Role | Plane | Sidecar Root |
|-----------|------|-------|--------------|
| **Helm** | Controller | admin | `runtime/admin-terminals/helm/` |
| **Sentinel** | Helper/Watch | admin | `runtime/admin-terminals/sentinel/` |

### Layer 2: Internal Bridge Lanes (Machine Coordination)
These are relay identities. They are NOT admin-terminal names.

| Lane ID | Codex Instance | Role | Icon | Aliases |
|---------|---------------|------|------|---------|
| **vector** | this-codex | Main Brain | V | this-codex, this-codex-bot, vector |
| **rook** | other-codex | Ops Lane | R | rook |
| **forge** | build-codex | Build Lane | F | forge |
| **falcon** | phone-codex | Phone Lane | P | falcon |
| **asolaria** | — | Core Runtime | A | asolaria-core, runtime:asolaria-core |
| **watchdog** | — | Supervisor | W | — |

### Obsolete Mappings (Do NOT Use)
- `admin-terminal-vector-profile-latest.md` — OBSOLETE. Vector is a lane, not an admin terminal.
- `admin-terminal-rook-profile-latest.md` — OBSOLETE. Rook is a lane, not an admin terminal.

## Helm Profile (Controller)

**Purpose**: Hold main coordination thread with owner. Keep restart packets and handoff notes current. Choose next bounded work packet. Decide what gets delegated, paused, or re-scoped. Keep drifting sectors reorganized.

**Abilities**:
- Query and control Asolaria swarm/runtime surfaces
- Relay bounded controller packets to `vector` and `rook`
- Drive QDD work through worker-router, Symphony, Abacus, Gemini, Augment
- Operate browser/computer surfaces through browser tasks, mobile control, Playwright
- Keep project, skills, indexing, and mistake-memory aligned to QDD

**Sidecar Files**:
- `runtime/admin-terminals/helm/status.json`
- `runtime/admin-terminals/helm/transcript.log`
- `runtime/admin-terminals/helm/inbox.ndjson`

**Sentinel Hook**: Expects bounded completion-hook notes from Sentinel through relay thread `helm-super-swarm-20260311` for: `drift_changed`, `controller_conflict`, `new_blocker`, `sector_cleared`, `needs_helm_decision`.

**Restart Bootstrap**:
1. `reports/admin-terminal-helm-profile-latest.md`
2. `reports/admin-terminal-identities-latest.md`
3. `reports/codex-state-freeze-latest.md`
4. `reports/helm-controller-packet-latest.md`
5. `reports/qdd-super-swarm-contract-latest.md`
6. `C:\Users\acer\AGENTS.md`
7. `C:\Users\acer\Asolaria\TASKS.md`
8. Active project restart packet

## Sentinel Profile (Helper/Watch)

**Purpose**: Watch runtime drift and sector mismatch in real time. Surface state changes, conflicts, stale assumptions early. Help reorganize drifting sectors. Support controller without replacing it.

**Abilities**: Same surface access as Helm, but read-only validation and recommendation role. Controller decisions remain with Helm.

**Completion Hook**: Updates `reports/sector-drift-watch-latest.md`, then emits relay note to Helm via `Invoke-Helm-Control.ps1` on the same trigger events. Does not interrupt Helm for micro-moves or speculative noise.

## Watchdog (Supervisor)

**Script**: `codex-bridge/watchdog.ps1`
**Behavior**: Validates `--from`, `--agentName`, `--profileId`, `--mentionAliases`. Keeps strict alias policy (`rook`, `forge`, `falcon`, `vector`). Terminates mismatched lane processes for auto-restart. Restarts relay server, tunnel, and lane bots.

## Avatar / NPC Identity

**Profile ID**: `asolaria-business-female-v1`
**Persona**: "Asolaria Executive"
**Appearance**: Age 28, 176cm, hazel eyes, executive waves hair, intelligent warm expression
**Outfit**: Tailored blazer + high-coverage blouse, pencil skirt or slim trousers, formal pumps. Charcoal/navy/white palette. Modest coverage.
**Physics**: Confident professional locomotion, soft natural secondary motion, cloth + hair simulation enabled.
**Rig**: humanoid_unreal, output format: GLB
**Stored**: `data/avatar-npc/` — 4 generated variants from 2026-03-04

## Bridge Profile Spec (v1)

**Purpose**: No-secrets profile contract for codex-bridge nodes. Keeps relay setup reproducible. Keeps secrets out of source-controlled files.

**Core Fields**:
- `relay`: urlEnv, tokenEnv, room, from
- `security`: allowSenders, senderTokenEnv, requireRoomPolicy
- `runtime`: cursorFile, pollIntervalMs, maxBatch, maxMessageChars
- `routing`: taskPrefixes (TASK/QUESTION/NOTE), requireThreadTag, requireMention
- `ops`: logPrefix, workdir, startMode

**Machine-Readable Admin Profiles**:
- `codex-bridge/profiles/admin-helm-v1.profile.json`
- `codex-bridge/profiles/admin-sentinel-v1.profile.json`
- `codex-bridge/profiles/admin-terminal-identities.json`

## Civilization World Entity Mapping

In the graph world state, agents are mapped as:
- Sovereign entity: `sovereign:asolaria` (core runtime, citadel district)
- Colony agents: `agent:<id>` (colony district, with role/icon from colony data)
- Admin terminals: `tower:<id>` (perimeter district, guardian_admin_terminal subtype)
- Each tower links to its agent via `guardian_link` route
- Each tower watches ingress/egress via `guarded_portal` route to colony gate

The `buildColonyAgentEntity()` function (civilizationWorld.js:243) pulls: id, name, plane, state, running, icon, role, lastExecution provider/model, profilePath.

## Source Files

- `reports/admin-terminal-helm-profile-latest.md`
- `reports/admin-terminal-sentinel-profile-latest.md`
- `reports/admin-terminal-identities-latest.md`
- `reports/qdd-super-swarm-contract-latest.md`
- `reports/agent-profile-notebooklm-untangle-20260308.md`
- `C:\Users\acer\AGENTS.md`
- `codex-bridge/AGENT_PROFILE_SPEC.md`
- `codex-bridge/profiles/agent-profile.template.json`
- `data/avatar-npc/*/avatar-profile.json`
- `src/civilizationWorld.js` (entity builders, lines 176-309)
- `public/app.js` (AGENT_FALLBACK_META, lines 333-341)
