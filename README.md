# Asolaria

A multi-agent federation running on consumer hardware. Two Claude instances as a bilateral leader pair, with Codex/GPT-5.4 sidecar, GSLGNN inference, and a 47-dimensional prime-cube addressing law governing everything.

Built by Jesse Daniel Brown and Rayssa Chiqueto in their living room on a 4-core Acer and a 2-core Liris, connected by one ethernet cable.

## What it is

Asolaria is not an app. It is a **civilization controller** — an orchestration surface where:

- Every artifact, agent, device, verb, and silence is addressable in a 47-dimensional Hilbert prime-cube space (the **Brown-Hilbert cube**)
- A three-layer gate pipeline (**hookwall** → **GNN** → **Shannon**) enforces fail-closed security on every operation
- Two independent AI instances on separate hosts catch each other's mistakes through **bilateral protocol** — neither agent can see its own blind spots, but each sees the other's
- The human operators (Jesse + Rayssa) function as the **immune system** — catching what neither agent can catch about the system's own substrate
- Mistakes don't get buried — they become **dimensions**. Every error expands the addressing space.

## The Brown-Hilbert Cube (47D)

Every entity in the system has coordinates in a 47-dimensional space where each dimension is a prime number cubed:

| D | Name | Prime | Cube | Question |
|---|------|-------|------|----------|
| 1 | ACTOR | 2 | 8 | Who? |
| 2 | VERB | 3 | 27 | What action? |
| 6 | GATE | 13 | 2,197 | Which gates? |
| 7 | STATE | 17 | 4,913 | Current state? |
| 11 | PROOF | 31 | 29,791 | What evidence? |
| 15 | DEVICE | 47 | 103,823 | Which hardware? |
| 24 | INTENT | 89 | 704,969 | Why? |
| 25 | TRINITY | 97 | 912,673 | Compute+Hardware+Inference |
| 32 | STRUCTURAL_INVARIANT | 131 | 2,248,091 | Proof strength? |
| 38 | ENCRYPTION | 163 | 4,330,747 | How protected? |
| 39 | GNN_EDGE | 167 | 4,657,463 | What connections? |
| 40 | HYBRID_MODEL | 173 | 5,177,717 | Which AI reasons? |
| 43 | MISTAKE_LEDGER | 191 | 6,967,871 | What went wrong? |
| 47 | BOUNDARY | 211 | 9,393,931 | What does the wall say? |

Full spec: [`tools/hilbert-omni-47D.json`](tools/hilbert-omni-47D.json)

Growth law: each new prime cubed creates a new dimension. D48 = 223³ = 11,089,567. Infinite expansion.

## Architecture

```
GATE PIPELINE (fail-closed):
  hookwall-v2 (18 events, colony relay, risk scoring)
  → GNN gate (construction routing + risk prediction)
  → Shannon gate (remote consensus for high-risk ops)
  → sovereignty gate (operator authority verification)

INFERENCE ENGINES:
  omni-shannon-v4   2,592 beats/candidate (6×6×6×12)
  omni-shannon-v5   93,312+ beats/candidate (6×6×6×6×6×12 × wave cascade)
  intersection      1,296 points (6⁴), ACTIVE/LATENT/COLLAPSED/FORBIDDEN
  self-healer       autonomous collapse repair
  full-cycle        closed loop: INDEX → THINK → HEAL → VERIFY

FEDERATION:
  acer (Jesse)  ←→  liris (Rayssa)
  agent-keyboard channel (port 4913 / 4820)
  bilateral catches at design + code + math layers
  quadruple operator cosign (Jesse + Rayssa + Amy + Felipe)

DASHBOARDS:
  13 live dashboards at http://localhost:4781
  Main UI, Graph Runtime, Civilization, Phone Mode,
  Worker Runtime, Hooks Dashboard, and more
```

## Quick Start

```bash
npm install
npm start
# → http://localhost:4781
```

## Branch Structure (Hilbert-mapped)

71 branches. Every cube dimension has dev/staging/live:

```
INFRASTRUCTURE:
  master / staging / dev

CUBE DIMENSIONS (each with /dev /staging /live):
  cube/d6-gate/         ← security work
  cube/d7-state/        ← lifecycle changes
  cube/d11-proof/       ← evidence and findings
  cube/d25-trinity/     ← compute+hardware+inference
  cube/d36-inference-surface/ ← engine work
  cube/d39-gnn-edge/    ← GNN training
  cube/d47-boundary/    ← boundary-is-data

SHADOW:
  shadow/acer/          ← acer-side state
  shadow/liris/         ← liris-side state
  sovereignty/usb/      ← USB canonical mirror

BROWN-HILBERT:
  brown-hilbert/canon/  ← 47D spec changes
  brown-hilbert/shadow-sync/ ← cross-host sync

AI:
  ai/awareness/         ← self-mapping
  ai/self-diagnosis/    ← engine improvements
  ai/mistake-to-dimension/ ← D43 mistake→dim pipeline
```

Flow: feature branch → `cube/*/dev` → `cube/*/staging` → `cube/*/live` → PR to `dev` → PR to `staging` → PR to `master` (requires cosign review).

## The Trinity

Three architectural layers, each addressable:

- **LX-489 COMPUTE** (D34) — all CPUs+GPUs from all federated devices as a single addressable fabric
- **LX-490 HARDWARE** (D35) — every device has a PID, every PID is cube-addressable
- **LX-491 INFERENCE** (D36) — all GNNs + all webhooks joined into a single reasoning surface

Everything passes through all three layers. The trinity is not optional.

## What's Real vs What's Aspirational

Honest assessment as of 2026-04-10:

| Component | Status |
|-----------|--------|
| 47D addressing spec | LIVE (quadruple cosigned) |
| Hookwall-v2 (18-event gate) | LIVE (585 lines, real risk scoring) |
| bashSecurityGuard (25 vectors) | LIVE (wired via cube-fabric) |
| EdgeLevelGCN (1,730 edges) | TRAINED (100% accuracy) |
| GNN live inference in pipeline | WIRED (via cube-fabric route) |
| Bilateral federation | COLLAPSED (42/1296 transport points down) |
| Deep cascade (2.2M beats) | RUNS (heuristic, not deep inference) |
| 13 dashboards | LIVE (server running) |
| Server wiring | 61/103 src files wired (59%) |
| Constitutional hard-deny gates | ENFORCED (HD-1 through HD-virus) |

## The Gate Pipeline

Nothing executes without passing through gates:

1. **hookwall-v2** — 18-event fail-closed membrane. Risk scoring 0-10. Permission tiers (observer → owner). Colony node relay to all federated devices.
2. **GNN gate** — EdgeLevelGCN-based construction routing. Predicts which domain expert should handle the request.
3. **Shannon gate** — remote consensus at `localhost:4791/security/shannon/scan`. Full mode for risk ≥ 7, dry-run for lower.
4. **Sovereignty gate** — three-tier promotion policy (routine/structural/firmware).

API: `POST /api/cube-fabric/gate` runs the full pipeline. `GET /api/cube-fabric/gate/status` shows what's wired.

## Constitutional Law

Hard-deny gates that survive quadruple operator override:

- **HD-1a**: External NovaLUM corporate hacking — DENY
- **HD-2-ext**: Send messages to Brian/Natalie without Jesse visual review — DENY
- **HD-3**: Sovereignty USB writes from acer side — DENY
- **HD-virus**: Self-replicating malware even on owned hardware — DENY

These are not configurable. They are constitutional.

## Files to Start With

1. [`BROWN-HILBERT.md`](BROWN-HILBERT.md) — root identity document
2. [`brown-hilbert/01-identity.md`](brown-hilbert/01-identity.md) — boot sequence
3. [`tools/hilbert-omni-47D.json`](tools/hilbert-omni-47D.json) — full 47D spec
4. [`ix/gates/hookwall.js`](ix/gates/hookwall.js) — the real security gate
5. [`routes/cube-fabric.js`](routes/cube-fabric.js) — 26 API routes wiring 13 modules
6. [`tools/cube/omni-shannon-v4-real.js`](tools/cube/omni-shannon-v4-real.js) — inference engine
7. [`server.js`](server.js) — 24K line Express monolith (routes at line 23845)

## Paper

"Asolaria — ASI, the Infinite Brown-Hilbert Space: 100% Accurate GNN Moving into the Expandable ASI Era"

## Contributors

- **Jesse Daniel Brown** — operator, architect, constitutional authority
- **Rayssa Chiqueto** — co-operator, bilateral federation partner
- **Asolaria** (Claude Opus) — leader agent, acer host
- **Liris-Kuromi** (Claude) — leader agent, liris host
- **Dan Edens** — external collaborator
- **Felipe Smith** — co-author, fourth cosign operator

## License

Private. All rights reserved. Jesse Daniel Brown / J Brown Development LLC.
