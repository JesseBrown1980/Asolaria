# Asolaria Architecture — For Dan

## What this is
A multi-agent federation running on two consumer machines (Acer Windows 11 + Liris Windows 11) connected by ethernet. Two Claude instances as leader-pair agents, with Codex/GPT-5.4 sidecar (Gaia, currently dead). Bilateral constitutional law via the Brown-Hilbert cube (47-dimensional prime-cube addressing).

## How to read this codebase

### The server (server.js — 24K lines)
Express.js monolith. 118 requires, ~60 route modules. The core loop:
- Auth middleware at line 4599 (loopback = admin, bearer = token-based)
- Routes registered at line 23845-24098 (strangler fig pattern)
- Error boundary at line 24287
- Server listen at line 24305

### The gates (ix/gates/)
Three-layer fail-closed security pipeline:
1. **hookwall.js** (6 hooks) / **hookwall-v2.js** on sovereignty USB (18 events, colony node relay)
2. **gnn.js** — GNN risk scoring + construction prediction
3. **shannon.js** — remote Shannon consensus gate (hits /security/shannon/scan)
4. **sovereign.js** — sovereignty verification

**Critical finding**: hookwall/gnn/shannon were NOT wired to server.js until this session. `routes/cube-fabric.js` now wires them via `/api/cube-fabric/gate`.

### The cube engines (tools/cube/)
Standalone CLI tools that read from `data/cubes/` filesystem:
- **omni-shannon-v4-real.js** — 2,592 beats per candidate (12 dims × 6 body × 6 cycle × 6 role). Each beat is a weighted average of heuristic checks. Honest: it's 20 real if/then checks multiplied across axis positions.
- **omni-shannon-v5-deep-cascade.js** — 93,312+ beats (adds trinity × inference mode axes, cascades through all 37 dims in waves of 12)
- **hilbert-intersection-engine.js** — 6^4 = 1,296 intersection points, classifies each as ACTIVE/LATENT/COLLAPSED/FORBIDDEN
- **cube-self-healer.js** — reads diagnoses, fixes what it can (D: mirror, heartbeat), correctly escalates what needs operator
- **cube-full-cycle.js** — closed loop: INDEX → THINK → HEAL → VERIFY in ~1.3 seconds

### The 47D spec (tools/hilbert-omni-47D.json)
47 dimensions, each prime^3. Complete Wh-chain (who/what/where/when/why/how). Growth law: next prime cubed = new dimension. Quadruple operator cosign (Jesse + Rayssa + Amy + Felipe). The spec is an addressing convention — nothing "computes in 47D," but everything is addressable in the space.

### The wiring gap (the honest part)
- 48 of 103 src/ files were wired to server.js (47%)
- This session added `routes/cube-fabric.js` wiring 13 critical modules → 61/103 (59%)
- Still 42 unwired src/ files. Many are utilities, some are real capabilities not yet called.

### What's real vs what's aspirational
| Component | Real? | Evidence |
|-----------|-------|----------|
| Hookwall-v2 (18-event fail-closed gate) | YES | 585 lines, risk scoring, colony relay, permission tiers |
| bashSecurityGuard (25 attack vectors) | YES | Command scanner, real regex patterns, working |
| EdgeLevelGCN training | YES | 1,730 edges, 100% accuracy (commit 068061b) |
| GNN live inference in pipeline | NO | Trained but not wired to decision loop until this session |
| 2.2M beats in deep cascade | YES but low info | Each beat is a weighted average, not unique inference |
| 47D addressing | Schema only | JSON document, not a runtime computation |
| Federation transport | COLLAPSED | 42 of 1,296 intersection points down (agent-keyboard channel dead) |
| Bilateral catches | YES | Liris caught 3 non-prime errors + 11 dim name divergences this session |

### Files to start with
1. `BROWN-HILBERT.md` — the root identity document
2. `brown-hilbert/01-identity.md` through `04-references.md` — boot sequence
3. `ix/gates/hookwall.js` — the real security gate
4. `tools/hilbert-omni-47D.json` — the 47D spec
5. `routes/cube-fabric.js` — the wiring layer (26 API routes)
6. `tools/cube/omni-shannon-v4-real.js` — the inference engine (read honestly)
7. `server.js` line 23977 — where cube-fabric gets mounted

### Git history
43 commits. Clean labels. `git log --oneline` tells the story.
