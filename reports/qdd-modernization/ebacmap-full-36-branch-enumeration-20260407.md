# eBacMap Full 36-Branch Enumeration — Real Git Ground Truth

**Date:** 2026-04-07T00:30Z
**Source:** `D:\projects\QDD\ebacmap-master` via direct `git branch -r --merged master` per branch
**Phase-Zero status:** Round 4 of corrections — the original "35 open branches" claim from the master status doc was off by ~44%
**Constellation agents:** `jbd.qdd.architect` (D13 SPACE) + `jbd.qdd.schedule-planner` (D18 SCHEDULE) + Phase-Zero rule (D11 PROOF)

---

## TL;DR

| Bucket | Count | Action class |
|---|---|---|
| **DEAD** (merged into master, branches stale) | **16** | Delete after operator confirm |
| **STILL OPEN** (not merged, real work pending) | **20** | Triage by recency + scope |
| **TOTAL** | **36** | (was claimed as "35 open" in master status doc — overstated by 44%) |

The original master status doc estimated "35 open fix branches × ~4h average = 140h" of work. The corrected estimate is roughly **half that**, because nearly half the branches in remotes/origin are already merged into master and just haven't been deleted.

## DEAD branches (16 — merged into master)

| # | Branch | Tip date | Tip message |
|---|---|---|---|
| 1 | `fix/capa-pdf-issues` | May 16 2025 | fix pdf generation issues |
| 2 | `fix/capa-result-value` | May 29 2025 | fix test result value color on capa page |
| 3 | `fix/daily-report-nodata` | Dec 12 2024 | fixing y axis on stacked graph in pdf |
| 4 | `hotfix/ad-hoc-edit` | Jul 29 2024 | fixing validation issue with editing ad hoc schedules |
| 5 | `hotfix/bama-duplicates` | Apr 26 2025 | updating script |
| 6 | `hotfix/ftp-import-issues` | Apr 16 2025 | fixing cache issues with dashboard modules |
| 7 | `hotfix/ftp-user` | Jul 25 2024 | updating socket server unit log |
| 8 | `hotfix/import-errors` | Mar 25 2025 | including fieldMapping in ftp import |
| 9 | `hotfix/import-test-bug` | Mar 3 2025 | fixing ftp import not using correct result type |
| 10 | `hotfix/organism-missing` | Apr 2 2025 | wrote script to fix missing data in read only results |
| 11 | `hotfix/queue-stalled` | May 28 2025 | ensuring processing jobs stay under concurrent jobs max |
| 12 | `hotfix/report-filter-bugs` | Oct 18 2024 | fixing export for completed after scheduled date |
| 13 | `hotfix/reports-readonly` | Jan 20 2025 | updating script to generate read only table data |
| 14 | `hotfix/sync-locations-bug` | Feb 4 2025 | fixing issue with notes not syncing |
| 15 | `hotfix/test-import-errors` | Feb 6 2025 | adding scheduledTestId to testResult model |
| 16 | `hotfix/wizard-month-bug-` | Sep 6 2024 | fixing date issue with calendar months |

**Cleanup action:** all 16 can be deleted from `remotes/origin` after operator confirmation. Branch deletion is destructive (HD-3 hard-deny class) so each requires explicit operator authorization.

## STILL OPEN branches (20 — not merged into master)

Sorted by tip date descending (most recent first):

| # | Branch | Tip date | Bucket | Notes |
|---|---|---|---|---|
| 1 | `fix/sftp-issues` | Mar 15 2026 | P1-RECENT | "applying sftp fixes from Jessie's branch" |
| 2 | `fix/missing-detail-photos-column-selection-modal` | Mar 11 2026 | P1-RECENT | "addressing comments" — sounds like PR review iteration |
| 3 | `fix/clear-retest` | Mar 11 2026 | P1-RECENT | **"Add Charm EZ Protect rollout scaffolding"** — overlaps c3 CHARM_EZP work |
| 4 | `fix/issues-with-limit-line-prevents-save` | Mar 10 2026 | P1-RECENT | already in original 7 |
| 5 | `fix/new-user-form-not-client-select-field` | Mar 10 2026 | P1-RECENT | UI form bug |
| 6 | `fix/issues-edit-user-workflow` | Mar 10 2026 | P1-RECENT | "fix: build error" — possibly trivial |
| 7 | `fix/edit-test-results-category-subcategory-blank` | Mar 9 2026 | P1-RECENT | already in original 7 |
| 8 | `fix/my-profile-link-not-work` | Mar 9 2026 | P1-RECENT | trivial UI fix |
| 9 | `fix/toggle-vectors-on-off` | Mar 9 2026 | P1-RECENT | "fix: build error" — possibly trivial |
| 10 | `fix/results-edit-missing-detail-photo-form` | Mar 11 2026 | P1-RECENT | "addressing comments" |
| 11 | `fix/troubleshoot-missing-facility-map` | Mar 6 2026 | P1-RECENT | "fix: build error" — possibly trivial |
| 12 | `fix/unable-to-delete-user-client-details` | Feb 24 2026 | P2-OLDER | "Unable to Delete user" |
| 13 | `fix/admin-add-promary-email-address-domain` | Jan 28 2026 | P2-OLDER | typo in branch name (`promary` → `primary`) |
| 14 | `fix/bulk-select-reschedule-not-working` | Jan 15 2026 | P1-CONFIRMED-OPEN | original 7, **research file was wrong about merge** |
| 15 | `fix/sftp-errors` | Jan 5 2026 | P2-OLDER | "ensure folders exist in sftp connections" |
| 16 | `hotfix/ss-pastdue-report-date-bug` | Nov 11 2024 | P3-VERY-STALE | 17 months old, verify still relevant |
| 17 | `hotfix/security-audit-fixes` | Sep 25 2025 | P3-IMPORTANT-STALE | 6 months old, sounds important |
| 18 | `hotfix/safe-package-updates` | Apr 30 2025 | P3-STALE | 11 months old |
| 19 | `fix/disable-future-import` | Apr 16 2025 | P3-STALE | 12 months old |
| 20 | `fix/pipeline-issue` | Oct 21 2025 | P3-STALE | 5 months old, "pipeline memory size issue" |

## Bucket distribution

| Bucket | Count | Definition |
|---|---|---|
| **P1-RECENT** | 11 | Activity in last 30 days; most likely actively-worked or recently-attempted |
| **P1-CONFIRMED-OPEN** | 1 | Bulk-select-reschedule (research file said merged, real git says not) |
| **P2-OLDER** | 4 | 1-3 months old; needs triage |
| **P3-VERY-STALE / IMPORTANT-STALE / STALE** | 4 | 5-17 months old; verify still relevant |

## Top observations

### 1. The "build error" pattern

Three recent branches have tip messages "fix: build error":
- `fix/issues-edit-user-workflow`
- `fix/toggle-vectors-on-off`
- `fix/troubleshoot-missing-facility-map`

These are likely **CI build error fixes that landed but never got merged**. They might be ready to merge as-is, or they might have been superseded. Worth ~10 minutes each to verify.

### 2. The Mar 9-11 sprint cluster

11 of the 20 open branches have tips from Mar 9-11 2026 (a 3-day window). This looks like a coherent sprint of UI bug fixes that didn't make it through review/merge before something interrupted. The cluster includes:
- 4 trivial UI/form fixes (my-profile-link, toggle-vectors, build-errors)
- 4 substantive fixes (limit-line, edit-test-results, missing-detail-photos, results-edit-missing-detail-photo)
- 1 NEW USER form fix
- 1 SFTP fix
- 1 CHARM EZP scaffolding (which overlaps c3)

A coordinated merge sweep could clear most of these in 1-2 days if reviewers approve.

### 3. `hotfix/security-audit-fixes` is the priority red flag

It's 6 months stale, the name suggests it touches actual security issues, AND it's not merged. **Recommended action:** read this branch's commits ASAP to understand what security work is sitting unmerged. Tip: `a8078692a` "cleaning up scripts folder, moved old to archived removed db info from notifications migration script."

### 4. `fix/clear-retest` overlaps c3

Tip message: "Add Charm EZ Protect rollout scaffolding" — this is the SAME EZP rollout work that the c3 flag investigation touches. Suggests the rollout-tracking flag (kept intentionally per the comment) was added by this branch. Worth reading both branches together for full context.

## Recommendations

### Operator-confirm + delete batch (low-risk cleanup)

Delete the 16 DEAD branches after a single operator-witnessed confirmation. Estimated time: 5 minutes total. Saves visual noise in the branch list and helps Natalie's tracker stay clean.

### Triage P3-IMPORTANT-STALE first

Read `hotfix/security-audit-fixes` immediately. If it has real security work, it should be merged or ported regardless of age.

### P1-RECENT 11-branch sprint sweep

Coordinate with Natalie/Brian on the Mar 9-11 cluster. If reviewers can be assigned, most should merge cleanly. Estimated: 8-16h total spread across reviewers.

### Defer P2 + P3 non-security

Old branches that aren't security need explicit "still relevant?" check before any work.

## Workload picture (corrected for the 4th time)

| Estimate | Hours | Notes |
|---|---|---|
| Original master status doc | 140h | "35 open × 4h" |
| Triage v1 (research file based) | 14-26h | wrong about which branches were dead |
| Triage v2 (real git, 7 branches only) | 14-26h | corrected the 7 named branches |
| **Triage v3 (real git, all 36 branches)** | **30-50h realistic** | covers all 20 open branches |

The "30-50h realistic" is still much less than 140h, but more than the v2 estimate because there are 20 open branches not 5. Most of the additional work is the Mar 9-11 sprint cluster, which could go fast with reviewer attention.

## Cube alignment

- Primary: D18 SCHEDULE (cube 226981 = 61³) — sequencing + priority
- Secondary: D13 SPACE (cube 68921 = 41³) — repo structure mapping
- Secondary: D11 PROOF (cube 29791 = 31³) — Phase-Zero verification

## Mirror status

To be mirrored to D: in same turn per rolling backup rule.
