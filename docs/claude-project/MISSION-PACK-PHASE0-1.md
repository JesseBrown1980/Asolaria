# CURRENT MISSION PACK: PHASE 0 + PHASE 1 FOUNDATION (DRIFT-HARDENED)

> Active mission pack for the Asolaria Super Swarm. Read CONSTITUTION.md first.
>
> **CRITICAL CONTEXT (2026-03-16):** This mission pack was written on 2026-03-15 BEFORE the massive build session.
> Since then, a huge amount of work was completed:
> - 33 commits modularized 37K-line monolith into 35 routes + 51 src modules + 48 connectors + 4 sidecars
> - Phase 3 (monolith decomposition) is LARGELY DONE — `remaining.js` and `integrationsRemaining.js` are the last catch-all buckets
> - 120+ dead references in extracted routes were fixed (2026-03-16)
> - Dan's hooks provide process-level crash recovery (Constitution Phase 1 partial)
> - MQTT broker is live on 4 ports (18883-18886) including LAN for sub-colony
> - Omnispindle is live with 5 lanes (Helm, Vector, Rook, Forge, Falcon)
> - Colony has 8 agents registered, 6 online, phone federation working
> - Vault has 44 secrets with AES-256-GCM + DPAPI
> - Phone RBAC is implemented (super_admin, phone_regular)
> - SwarmDesk/Madness Interactive integration is active with 2,997+ task objects
> - 12 ADRs exist in `docs/adr/`
> - 635 tasks in the task ledger, 2,362 events logged
>
> **The Constitution's LAWS still apply.** But the "what doesn't exist" list below is partially outdated.
> Agents: verify current state via `curl http://localhost:4781/api/health` before assuming anything.

---

## A. OPERATOR-DECLARED SESSION SNAPSHOT

Assume the operator states:
- Asolaria runtime is UP and healthy
- MQTT is connected
- semantic KB has been rebuilt
- skills/tools index has been rebuilt
- notebook has new injected notes
- REFERENCES.md has been refreshed
- current research package and connector updates are indexed

Treat this as `[OPERATOR-DECLARED]` until runtime-verified inside the session.

---

## B. EXACT OBJECTIVE

Do NOT build the whole civilization in this mission.

**Build the substrate that prevents drift and forgetting.**

This mission is successful only if it produces:
1. a truth table of the system,
2. a contract freeze,
3. a durable persistence/scheduler design,
4. a process supervision design,
5. an auth + approval hardening design,
6. a monolith extraction seam plan,
7. a first safe implementation backlog,
8. a state packet that allows the next session to continue without conceptual loss.

---

## C. IN SCOPE

- truth reconciliation
- verified inventory of what exists vs partial vs missing
- contract freeze
- route/connector/module inventory
- standing-directives design
- durable scheduler design
- message durability design
- process supervision design
- gateway auth plan
- secret hardening plan
- monolith seam map
- plugin contract design
- first 10 safe slices
- rollback strategy per slice
- artifact map for updates

---

## D. OUT OF SCOPE FOR THIS MISSION

- final 3D rendering polish
- full SwarmDesk visual buildout
- final GNN training
- GSL-GNN productionization
- wide Google write-scope rollout
- phone UI redesign
- federation autonomy rollout
- automatic program absorption execution

You may design their prerequisites only.

---

## E. REALITY RECONCILIATION TABLE

Before any recommendation, produce a table with five columns:

| Item | Status | Evidence Class | Risk If Wrong | Notes |
|------|--------|----------------|---------------|-------|

Allowed Status values:
- `VERIFIED_EXISTS`
- `VERIFIED_PARTIAL`
- `VERIFIED_MISSING`
- `OPERATOR_DECLARED`
- `UNKNOWN`
- `DEPRECATED`

This table must include at minimum:
- runtime
- graph runtime
- heuristic risk engine
- experimental edge prototypes
- civilization world
- MQTT broker / WSS path
- SwarmDesk export
- Omnispindle bridge
- provider hierarchy
- memory store
- task ledger
- job queue
- process supervision
- API auth
- approval engine
- vault / key handling
- connector plugin architecture
- Google write scopes
- phone path
- sub-colony registration
- GNN training pipeline
- Prototype-GNN sidecar
- visual dashboard rendering
- program absorption pipeline

---

## F. CONTRACT FREEZE TASK

List every contract that must survive the rebuild.

Include:
- schema contracts
- route contracts
- MQTT topic contracts
- identity contracts
- district/entity naming
- task status vocabulary
- risk output vocabulary
- bridge-room semantics
- approval-manifest expectations

For each contract specify:
- owner
- current source of truth
- compatibility strategy
- migration risk
- whether an adapter is required

---

## G. MONOLITH SEAM TASK

Produce the first decomposition seam map for server.js and related inline logic.

Do not propose a big-bang rewrite.

Return:
- seam name
- purpose
- routes/functions covered
- extracted destination module
- dependencies
- contract risk
- test requirement
- rollback plan
- whether shim/facade is needed

Required first seams:
1. gateway/auth middleware seam
2. config seam
3. approval seam
4. graph runtime seam
5. connector interface seam
6. job/scheduler seam
7. skills/tools registry seam
8. world export seam

---

## H. DURABLE SUBSTRATE TASK

Design the minimal durable substrate needed before major feature expansion.

Must include:
- standing directives store
- durable job queue
- retry/backoff
- dead-letter handling
- job evidence/result store
- message durability for critical topics
- crash recovery
- process supervisor plan
- health endpoints and structured logs
- WAL or equivalent integrity strategy

For each component specify:
- minimal viable implementation
- target implementation
- reasons for sequence
- exact failure prevented

---

## I. SECURITY HARDENING TASK

Design the minimal security hardening layer needed before expanding capabilities.

Must include:
- gateway auth
- request attribution
- approval-path attribution
- secret hardening
- master-key protection target
- RBAC path
- safer command analysis
- audit/event mapping

Explicitly separate:
- must happen before Google write scopes
- may happen in parallel
- later hardening

---

## J. GNN PRECONDITION TASK

Do NOT train a model yet.

Instead:
- define the edge label policy
- define node features
- define edge features
- define export format
- define temporal train/val/test split rules
- define shadow-mode evaluation contract
- define fallback-to-heuristics contract

Return:
- baseline EdgeLevelGCN fit-for-purpose verdict
- Prototype-GNN production readiness prerequisites
- Contrastive-GNN specialist use case
- GSL-GNN future gate criteria

---

## K. VISUAL WORLD PRECONDITION TASK

Do NOT redesign the Madness shell.

Define the event/render contract.

Return:
- truth events required by dashboard
- renderable entity schema
- route/risk visualization payload
- hover/task screen payload
- approval manifest payload
- quarantine/arrest payload
- update cadence
- replay/debug capability
- Playwright verification strategy

---

## L. FIRST 10 SAFE SLICES

Return the first 10 safe implementation slices.

Each slice must include:
- name
- objective
- touched contracts
- touched modules
- success test
- rollback
- why it must come before later work

The first 10 slices should heavily bias toward:
- truth table generation
- ADR scaffolding
- auth seam
- scheduler seam
- process supervision
- structured logging
- contract tests
- connector manifests
- standing-directives store
- critical MQTT durability

---

## M. MANDATORY OUTPUT ORDER

Return your response in this exact order:

1. Executive diagnosis
2. Reality reconciliation table
3. Contract freeze
4. Monolith seam map
5. Durable substrate design
6. Security hardening design
7. GNN preconditions
8. Visual world preconditions
9. First 10 safe slices
10. Rollback strategy by slice
11. Risk register
12. State packet
