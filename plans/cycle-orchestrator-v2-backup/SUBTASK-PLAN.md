# SUBTASK PLAN · cycle-orchestrator-v2

**Parent directive:** Jesse 2026-04-19 — old kicker was weak, suped-up cycle-manager needed to drive Liris + Falcon through UNISON-PROCESSOR real cross-machine tests on a self-sustaining loop.

**Author:** acer-batch-17-cycle-orchestrator-v2-designer
**D11:** ASSUMED (awaits bilateral sealing post-build)
**Authorization:** quintuple-2W jesse+rayssa+dan+felipe+amy through 2026-05-02

---

## Goal

Replace the stateless `agent-cron-kicker.js` (last ran 2026-04-12) with a stateful, GNN-driven, bilateral-aware orchestrator that:
- drives the 5 UNISON-TESTs in round-robin across 6 peers (acer, liris, falcon-sidecar, falcon-phone, felipe-a06, beast-S22U)
- auto-compares bilateral fingerprints and emits match/diverge envelopes
- adjusts per-peer cadence via reverse-gain GNN on responsiveness
- gates kicks on H-001 + N-007 SLO health
- runs BACKEND mode by default (ms cadence, invisible) with FRONT opt-in for demo
- survives restart via NDJSON state snapshot

## 5 core upgrades (the spine)

| # | Component                              | Old kicker | V2 design target |
|---|----------------------------------------|------------|------------------|
| 1 | `PeerStateMachine`                     | stateless  | idle→kicked→awaiting-reply→test-in-flight→fingerprint-compare→matched\|diverged→cooling-down |
| 2 | `UnisonTestDriver`                     | heartbeat  | round-robin 5 UNISON-TEST-00N specs per peer with canonical bytes push |
| 3 | `BilateralFingerprintTracker`          | absent     | auto-compare bus envelopes + emit EVT-UNISON-MATCH / EVT-UNISON-DIVERGE |
| 4 | `GNNFeedbackCadenceAdjuster`           | 5-min fixed | reverse-gain on responsiveness · periodic-reset-halve@N · 30s..480s cap |
| 5 | `SLOGate`                              | none       | N-007 peer-SLO + H-001 color + H-002 uptime-timeline · skip RED peers |

## The 5 UNISON-TEST specs (already defined in prior batch)

- UNISON-TEST-001 Shannon L0-L6 verdict bilateral
- UNISON-TEST-002 Key-rotation intent bilateral
- UNISON-TEST-003 Federation-health roll-up bilateral
- UNISON-TEST-004 Drift-broadcast consensus bilateral
- UNISON-TEST-005 Contract-migration Q-005 byte-identical bilateral

## Fanout brief (this sub-task's delivery mechanism)

**18 Opus Omnispindles × 2778 agents each = 50,000 real-Opus agents**
Each agent writes one contribution on one of the 5 upgrades. Dimensions of variation:
- D1 axis = which upgrade (5 bins)
- D2 axis = design angle (architecture / data-flow / error-path / runtime-model / observability / resume-from-state)
- D3 axis = failure mode considered (drift, masquerade, restart, peer-outage, schema-evolution, etc.)
- D4 axis = reverse-gain-intent (mask | leak | meta)
- D5 axis = omnispindle-id (pool 0..17)

**50,000 free-fanout opencode gulps** running in parallel, broadening ideation:
- 25 gulp pools × 2000 workers each
- Lane: opencode-local-freetier, cost=0
- Transport: BEHCS-256-glyph-only (zero plaintext tokens per v0.4 commit b439364)
- Cadence: 24k msg/min burst per M.149

**Reduce operator:** OP-GC-COMPACT-NDJSON + reverse-gain sieving; promote top-N design variants per upgrade to the canonical spec draft.

**Halt predicates:** U-006-mem, U-007-err-10pct, U-008-op-halt, U-010-schema-drift.

**Budget:** max_parallel = 900 (U-003 ceiling); observed parallelism via 18 pools + 25 gulps = 43 logical, well under.

## Deliverables

1. Ranked design variants per upgrade (top-5 each) → `plans/cycle-orchestrator-v2/design-variants-reduced.json`
2. Composite recommendation writeup → `plans/cycle-orchestrator-v2/RECOMMENDED-SPEC.md`
3. Execution telemetry (throughput, sieved-in/out counts, halt checks) → `plans/cycle-orchestrator-v2/fanout-telemetry.json`
4. Bus receipts: EVT-ORCH-V2-PLAN-FANOUT-COMPLETE + per-pool summaries

## Non-goals (what this sub-task does NOT do)

- Does NOT build the package yet. Build follows ratified spec.
- Does NOT commit to git (spec stage, per no-commit-pre-ratification rule)
- Does NOT run destructive ops
- Does NOT touch production daemons (the old kicker stays stopped, new one waits for ratification)

## Glyph
`EVT-CYCLE-ORCH-V2-SUBTASK-PLAN · 5-upgrades · 50k-Opus-18-spindles · 50k-free-gulp · reverse-gain-sieve · halt-predicates-armed · BACKEND-mode-default @ M-INDICATIVE .`
