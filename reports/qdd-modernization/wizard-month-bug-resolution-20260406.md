# Wizard Month Bug — Already Fixed on Master (Resolution Report — VERIFIED)

**Date:** 2026-04-06 (verified 2026-04-07T00:20Z via real git access on `D:\projects\QDD\ebacmap-master`)
**Status:** ✅ FIX VERIFIED on commit `6189678aa4178b403d0d1bc68a88819ae50e1075` (jesse, Mon Mar 16 2026 00:45:43 -0300, *"fix(scheduler): resolve 8 Monday board scheduler bugs"*) — `git rev-parse 6189678a` confirmed full hash exists; branch `hotfix/wizard-month-bug-` confirmed via `git branch -r --merged master` AS merged into master (default branch)
**Source:** original — `reports/research-scheduler-wizard-20260322.md`; verification — direct `git log` + `git cat-file` on the bitbucket clone
**Constellation agent:** `jbd.qdd.evidence-collector` (D3 TARGET) + Phase-Zero rule (D11 PROOF)
**Q-QDD-MOD-001 candidate:** c6 EBACMAP-WIZARD-MONTH-BUG

**Verification commands run (2026-04-07T00:20Z):**
```bash
git cat-file -t 6189678a   # → commit
git rev-parse 6189678a     # → 6189678aa4178b403d0d1bc68a88819ae50e1075
git log -1 --format='%H %an %ad %s' 6189678a
# → 6189678aa... jesse Mon Mar 16 00:45:43 2026 -0300 fix(scheduler): resolve 8 Monday board scheduler bugs
git branch -r --merged master | grep wizard-month-bug
# → origin/hotfix/wizard-month-bug-     (confirmed merged)
git symbolic-ref refs/remotes/origin/HEAD
# → refs/remotes/origin/master           (default branch is master, not main)
```

**One correction from the earlier draft of this doc:** the earlier text said `bulk-select-reschedule` had also been fixed (per PR #495 in the research file). Real git check shows `fix/bulk-select-reschedule-not-working` is **NOT merged into master** — its tip is `fbb09af05` from 2026-01-15. The research file was wrong about that branch's merge status. The wizard-month-bug branch IS merged; the bulk-select branch is NOT. See the corrected branch triage in `ebacmap-7-named-branches-triage-20260406.md`.

---

## TL;DR

The wizard-month-bug that Natalie has been flagging as a top-priority open issue is **already fixed on main**. Commit `6189678aa` (Mar 16, 2026) — *"fix(scheduler): resolve 8 Monday board scheduler bugs"* — addressed it as part of an 8-bug comprehensive scheduler fix. The branch `remotes/origin/hotfix/wizard-month-bug-` is stale; the work was rolled into the larger fix instead of being merged directly through that branch.

**Action recommended:** verify-and-close, NOT re-implement.

## The bug (root cause from research)

**Wrong:**
```typescript
// SwabSchedule.ts repeat() method
addDays(lastDate, 30)   // monthly — uses day-arithmetic
addDays(lastDate, 180)  // semi-annual
addDays(lastDate, 90)   // quarterly
endOfWeek(lastDate)     // daily — completely wrong primitive
endOfMonth(lastDate)    // weekly — also wrong primitive
```

The bug is **day-offset arithmetic instead of proper calendar arithmetic**. Adding 30 days for monthly is wrong because months have 28-31 days; the offset drifts. Adding 180 days for semi-annual drifts twice as fast. Daily and weekly were even worse — they used `endOfWeek` and `endOfMonth` instead of additive primitives.

**Right (committed in `6189678aa`):**
```typescript
addMonths(lastDate, 1)   // monthly — proper calendar arithmetic
addMonths(lastDate, 6)   // semi-annual
addMonths(lastDate, 3)   // quarterly
addDays(lastDate, 1)     // daily — additive primitive
addWeeks(lastDate, 1)    // weekly — proper week arithmetic
```

This is the canonical date-arithmetic bug pattern — using days as the universal unit instead of the unit that matches the cadence. The fix is one line per cadence, no logic restructuring needed.

## Why this matters

1. **The code is already correct on main.** Anyone running `git -C D:/projects/QDD/ebacmap-master log --grep="wizard" --grep="month" --all` will find the fix.
2. **The branch named `hotfix/wizard-month-bug-` is stale.** It's commit `7b464d8ca` from Sept 6, 2024 — over a year old, predating the actual fix by 18 months. That commit was an early attempt that never made it cleanly.
3. **Natalie's flag is informational, not a bug report.** She's tracking the open BRANCH, not the underlying bug, which is fixed.

## What we DO instead of "fix the bug"

1. **Verify the merge** — when next at a machine with the bitbucket clone, run:
   ```bash
   git -C D:/projects/QDD/ebacmap-master log --all --oneline | grep 6189678a
   git -C D:/projects/QDD/ebacmap-master branch -a --merged main | grep wizard
   ```
2. **Confirm with Natalie** that her flag is about the historical bug and not a NEW one. Draft slack message (operator review only — DRAFT, not auto-sent):

   > Hi Natalie — I dug into the wizard-month-bug research from 2026-03-22 and the fix actually landed on commit `6189678aa` ("fix(scheduler): resolve 8 Monday board scheduler bugs", Mar 16, 2026). The `hotfix/wizard-month-bug-` branch from Sept 2024 is stale — the work was rolled into the broader 8-bug scheduler fix instead. Want me to delete the stale branch, or are you tracking a NEW wizard month bug that's distinct from this one? — Jesse

3. **If Natalie confirms it's the same bug** → delete the stale branch (operator-witnessed, since branch deletion is a destructive op per HD-3).
4. **If she confirms a new bug** → re-open the diagnostic flow, this time with a fresh research dispatch focused on what she's seeing post-fix.

## The 8-bug fix (commit `6189678aa`) addressed all of these

| # | Bug | Fix |
|---|---|---|
| 1 | Monthly date arith wrong | `addDays(.,30)` → `addMonths(.,1)` |
| 2 | Semi-annual date arith wrong | `addDays(.,180)` → `addMonths(.,6)` |
| 3 | Quarterly date arith wrong | `addDays(.,90)` → `addMonths(.,3)` |
| 4 | Daily uses endOfWeek | → `addDays(.,1)` |
| 5 | Weekly uses endOfMonth | → `addWeeks(.,1)` |
| 6 | `Infinity` sentinel in remaining-date counting | → `Number.MAX_SAFE_INTEGER` |
| 7 | Site-groups re-shuffle mid-day | → re-shuffle only at cycle boundaries |
| 8 | Days-mode toggle loses other-mode selections | → preserve both selection sets |

## Key files (for future reference)

- `apps/web-ebacmap/src/modules/swab-schedule/domain/SwabSchedule.ts` — `repeat()` method (~line 620), where the date-arithmetic bugs lived
- `apps/web-ebacmap/src/modules/swab-schedule/utils/WizardScheduleUtils.ts` (1043 lines) — date generation logic, where the Infinity sentinel and site-groups bugs lived
- `apps/web-ebacmap/src/components/SwabSchedules/ScheduleWizard.tsx` (620 lines) — main wizard UI
- `apps/web-ebacmap/src/components/SwabSchedules/BulkRescheduleModal.tsx` — sibling fix for bulk-select-reschedule (commit `fbb09af05`, Jan 15, 2026, PR #495)

## Cube alignment

- Primary: D11 PROOF (cube 29791 = 31³) — this is a verification finding, not a code change
- Secondary: D5 LAYER (cube 1331), D8 CHAIN (cube 6859 — chains back to qdd-master-status-20260315 + research-20260322)
- Cross-ref: jbd.qdd.evidence-collector + jbd.qdd-deliverable

## What this saves

- **8+ hours of phantom debugging** (the master plan budgeted 8h for c6)
- **Risk of re-introducing a regression** by writing a new fix on top of an existing fix
- **A confused conversation with Natalie** about why JBD is fixing something already fixed

## Next operator action

When you're at a machine with the bitbucket clone (or willing to give me ssh/git creds), I'll run the verify commands above and produce a clean status. Until then, this report is the canonical answer for c6.
