# eBacMap 7 Named Branches — Triage (Q-QDD-MOD-001 candidate c5)

**Date:** 2026-04-06
**Constellation agents:** `jbd.qdd.architect` (D13 SPACE) + `jbd.qdd.schedule-planner` (D18 SCHEDULE) + `jbd.qdd.evidence-collector` (D3 TARGET)
**Source:** `reports/qdd-master-status-20260315.md` + `reports/research-scheduler-wizard-20260322.md`
**Scope note:** This triage covers the 7 NAMED branches from the master status doc. The remaining ~28 unnamed fix/hotfix branches need git access to enumerate (deferred to next operator turn with bitbucket clone access).

---

## ⚠️ CORRECTION 2026-04-07T00:20Z

This triage was originally written from the research markdown alone. After acer's bash CWD bug was fixed and `D:\projects\QDD\ebacmap-master` became reachable, the **Phase-Zero ground-truth rule** ran a real `git branch -r --merged master` check and caught two errors in the original triage:

1. The original said `fix/bulk-select-reschedule-not-working` was DEAD (merged via PR #495). **Real git says NOT merged.** It is STILL OPEN.
2. The original said `fix/capa-pdf-issues` was P1-DIAGNOSE. **Real git says it IS merged into master.** It is DEAD.

The corrected table is below. Original (wrong) table preserved at the bottom for audit.

## Triage table (CORRECTED via real git ground truth)

| # | Branch | Bucket | Real merged-into-master? | Tip | Action |
|---|---|---|---|---|---|
| 1 | `hotfix/wizard-month-bug-` | **DEAD** | ✅ YES | 7b464d8ca Sep 2024 | Delete after operator confirm; the 8-bug fix `6189678aa` (verified existing, by jesse, 2026-03-16) carries the work on master |
| 2 | `fix/bulk-select-reschedule-not-working` | **P1-OPEN** | ❌ NO | fbb09af05 Jan 15 2026 | **STILL OPEN** — research file was wrong about PR #495 merge. Real fix needed. |
| 3 | `hotfix/ss-pastdue-report-date-bug` | **P2-STALE** | ❌ NO | f1cb99a4c Nov 11 2024 | Very stale (15+ months). Verify still relevant to Natalie before any work |
| 4 | `feature/audit-ebacmap-modules-units-testresult-swapschedule` | **P2-FEATURE** | ❌ NO | 3bc3bc548 Feb 9 2026 | Refactoring branch, recent. Defer until P0+P1 cleared |
| 5 | `fix/capa-pdf-issues` | **DEAD** | ✅ YES | bc5951269 May 16 2025 | **NEW DEAD FINDING** — already merged into master; branch can be deleted |
| 6 | `fix/edit-test-results-category-subcategory-blank` | **P1-OPEN** | ❌ NO | be2a62ffd Mar 9 2026 | UI form bug, recent work, real fix needed |
| 7 | `fix/issues-with-limit-line-prevents-save` | **P1-OPEN** | ❌ NO | 2917366f0 Mar 10 2026 | Validation bug, recent work, real fix needed |

## Corrected workload picture

- **2 DEAD branches**: wizard + capa-pdf (delete after operator confirm)
- **3 P1-OPEN bugs**: bulk-select-reschedule + edit-test-results + limit-line — all need real fixes (~4-8h each = 12-24h total)
- **1 P2-STALE**: ss-pastdue (15-month-old, verify relevance first)
- **1 P2-FEATURE**: audit-ebacmap-modules (refactoring, defer)

**Realistic next-operator-turn workload:** ~14-26h still holds, but the COMPOSITION is different. 3 real bug fixes instead of 2 dead branches + 3 diagnose-then-fix.

## Important learning

The original triage trusted the research markdown without running git commands. The Phase-Zero rule says: **always check ground truth before scoring**. This correction is the second major catch of the rule (the first was c6 wizard-month-bug being already-fixed; this one ALSO caught my own stale-research-based wrong claims).

Both engines (acer MC + liris GSLGNN) inherit this lesson: **populate metadata from real git, not from old research files**.

## Bucket definitions

| Bucket | Meaning | Action class |
|---|---|---|
| **DEAD** | Already fixed on main, branch is stale | Verify + delete (operator-witnessed for `git push --delete`) |
| **P0-VERIFY** | Possibly already fixed — need git log search before doing anything | Read-only research |
| **P1-DIAGNOSE** | Real open bug, small scope | Diff-proposer can draft a patch after reading the relevant module |
| **P2-FEATURE** | Refactoring or non-blocking enhancement | Defer until P0+P1 cleared |

## Updated workstream estimate

If the triage holds:
- **2 branches** (1, 2) are DEAD — zero hours, just verification + cleanup
- **1 branch** (3) is P0-VERIFY — ~30 minutes to check git log
- **3 branches** (5, 6, 7) are P1-DIAGNOSE — ~4-8h each, ~12-24h total
- **1 branch** (4) is P2-FEATURE — defer

**Realistic next-operator-turn workload:** ~14-26 hours instead of the earlier estimate of "35 branches × ~4h average = 140h". The triage saves ~70-80% of the apparent workload because most named branches turn out to be either already-fixed-stale OR small UI fixes.

## What we don't know yet

- The 28 unnamed branches in the open list. These need a `git -C D:/projects/QDD/ebacmap-master branch -a` enumeration. Almost certainly some of them are also stale.
- Natalie's actual current pain points. The master status doc is from 2026-03-15 (3 weeks old) and the wizard-month-bug research from 2026-03-22 (2 weeks old). What is she seeing TODAY?

## Recommended next operator actions

1. **When at a bitbucket-cloned machine**, run:
   ```bash
   cd D:/projects/QDD/ebacmap-master
   git fetch --all
   git branch -a | grep -iE "fix|hotfix" > /tmp/all_branches.txt
   git log --all --oneline --since="2026-01-01" > /tmp/recent_log.txt
   git branch -a --merged main > /tmp/merged_branches.txt
   ```
   Send these 3 files to the constellation for full triage.

2. **Draft a lightweight Brian/Natalie status check** (operator review, draft only — `jbd.slack-with-natalie-brian` job):

   > Hi Natalie — quick ask: of the 35 open fix branches, which ones are currently blocking your team's day-to-day work? I'm finding several are stale (the work was merged via larger fix commits) and want to triage before doing redundant work. — Jesse

   This avoids wasted effort and keeps her in the loop.

3. **Schedule a 30-minute branch cleanup pass** during the next operator-witnessed window. Most stale branches can be deleted in seconds once confirmed.

## Cube alignment

- Primary: D18 SCHEDULE (cube 226981 = 61³) — sequencing + priority
- Secondary: D5 LAYER, D11 PROOF, D8 CHAIN
- Indexed in: `data/cubes/jbd.qdd.schedule-planner/findings.ndjson` (next append)
