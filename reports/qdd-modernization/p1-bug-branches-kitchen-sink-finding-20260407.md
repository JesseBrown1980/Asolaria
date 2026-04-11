# P1 Bug Branches — All 3 are Kitchen Sinks (Finding)

**Date:** 2026-04-07T02:45Z
**Source:** `D:\projects\QDD\ebacmap-master`, branches `fix/bulk-select-reschedule-not-working`, `fix/edit-test-results-category-subcategory-blank`, `fix/issues-with-limit-line-prevents-save`
**Constellation agents:** `jbd.qdd.architect` (D13 SPACE) + `jbd.qdd.evidence-collector` (D3 TARGET) + Phase-Zero Diff-Size Rule (D11 PROOF)
**Status:** ⚠️ All 3 branches reclassified from `P1-OPEN bug fix` to `KITCHEN_SINK / monorepo migration`

---

## TL;DR

The 3 "P1 bug fix" branches are all kitchen sinks. Two of them are full **monorepo migration branches** with bug fixes embedded. The eBacMap repo is mid-migration to a turbo + swc monorepo with `apps/admin/` and other app splits, and the bug fix branches were cut off the migration trunk.

**The earlier estimate of "14-26 hours of P1 fix work" was wrong by ~100x.** These are not small fixes — they're entire migration branches.

## Diff stats (real `git diff --shortstat`)

| Branch | Files changed | Insertions | Deletions | Total churn |
|---|---|---|---|---|
| `fix/bulk-select-reschedule-not-working` | 401 | +31,664 | -18,270 | ~50K lines |
| `fix/edit-test-results-category-subcategory-blank` | **3,529** | +211,225 | -133,351 | ~344K lines |
| `fix/issues-with-limit-line-prevents-save` | **3,552** | +212,827 | -133,574 | ~346K lines |

## What's actually in these branches

### `bulk-select-reschedule-not-working` (401 files)
- The actual bug fix (per the research from 2026-03-22) is in `BulkRescheduleModal.tsx` + `SwabDetailDialog.tsx` — probably <50 line diff
- Plus a master merge that brought in 400+ unrelated files
- Plus `yarn.lock` changes (12,775 line diff in `yarn.lock` alone)

### `edit-test-results-category-subcategory-blank` (3,529 files)
- Sample paths: `apps/admin/.swcrc`, `apps/admin/.turbo/daemon/...turbo.log...`, `apps/admin/Dockerfile`, `apps/admin/index.d.ts`
- These are TURBOREPO + SWC build system files
- The repo is being migrated from a flat structure to a `apps/admin/` + (presumably) `apps/web-ebacmap/` multi-app turbo monorepo
- The actual category-subcategory bug fix is buried somewhere in this — need to identify the specific commit(s)

### `issues-with-limit-line-prevents-save` (3,552 files)
- Same `apps/admin/.turbo/...` paths
- Same monorepo migration footprint
- The actual limit-line bug fix is also buried in the migration

## What this means for the QDD modernization plan

### Earlier estimates (now invalid)
| Plan version | P1 bug estimate |
|---|---|
| v1 (master status doc) | "35 open × 4h = 140h" |
| v2 (research file based) | "14-26h realistic" |
| v3 (real git, 7 named branches) | "14-26h realistic" |
| v4 (real git, full 36 branches) | "30-50h realistic" |
| **v5 (POST kitchen-sink rule)** | **NOT ESTIMABLE without knowing migration completion timeline** |

### The real situation
The eBacMap codebase is mid-migration. Until the monorepo migration settles on master, **bug fixes can't be cleanly extracted from migration branches**. Any attempt to fix one of these P1 bugs would either:
1. Require pulling in the entire monorepo migration as part of the fix (huge risk)
2. Require manually identifying the bug-specific commits and cherry-picking them onto current master (hours of careful git archaeology per bug)
3. Require waiting for the monorepo migration to land on master, then re-cutting fresh bug fix branches

Option 3 is the right move for a clean modernization. Options 1-2 are emergency-fix territory.

### What's still actionable RIGHT NOW
- **The 16 dead branches** (already merged into master, just need cleanup) — operator-witnessed deletion batch
- **The Docker security commit `2972a4d19`** — cherry-pickable to a focused branch if not already on master
- **The wizard-month-bug verification** (already fixed via `6189678aa`, just needs Natalie confirm + branch close)
- **The CHARM_EZP flag clarification** (1-2h Option A from corrected proposal)
- **The Mar 9-11 sprint cluster** — but ALL 11 branches need their own diff-size check first (probably some are also kitchen sinks)

### What is BLOCKED by the monorepo migration
- All 3 P1 branches above
- Probably most of the recent (Mar 2026) fix/* branches that were cut off the migration trunk
- Any new bug fix work that touches files which moved as part of the migration

## Recommendation

1. **Find out who's leading the monorepo migration** (Brian? Natalie? Vince's team? a contractor?)
2. **Get a realistic timeline** for when the migration lands on master
3. **Until then, don't attempt to fix bugs in branches that contain the migration** — it's not technically wrong but the work won't be cleanly mergeable
4. **Focus on the actionable items** (16 dead cleanups, Docker security cherry-pick, wizard verify, CHARM_EZP clarify) until the migration settles
5. **Brief Brian/Natalie** with this finding so they're aware the original "35 open branches" framing significantly understated the actual situation

## Phase-Zero Diff-Size Rule (NEW)

This finding triggered a new sub-rule of the Phase-Zero rule: check diff size BEFORE classifying a branch as a single-bug fix. See `feedback_phase_zero_kitchen_sink_branch_pattern.md` for the codified rule.

## Cube alignment

- Primary: D11 PROOF (cube 29791) — proof-of-actual-scope
- Secondary: D13 SPACE (cube 68921) — spatial scope of the diff
- Secondary: D8 CHAIN (cube 6859) — chains back to Phase-Zero v1
- Indexed in: `data/cubes/jbd.qdd.evidence-collector/findings.ndjson` + `data/cubes/jbd.qdd.architect/findings.ndjson`

## Mirror status

Mirrored to D: in same turn.
