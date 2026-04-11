# Phase-Zero Correction #6 — Security Commits NOT on Master

**Date:** 2026-04-07T09:30Z
**Source:** `D:\projects\QDD\ebacmap-master`, real `git branch --contains <full-hash>`
**Status:** ⚠️ **CORRECTION** — earlier "wizard-month-bug already fixed on master" finding was incomplete

---

## TL;DR

The security commits I previously claimed were "fixed on master" are actually **stranded on feature branches that haven't landed**. Verified via `git branch -a --contains` with full hashes:

| Commit | Description | Real branch placement | On master? |
|---|---|---|---|
| `6189678aa4178b403d0d1bc68a88819ae50e1075` | 8-bug scheduler fix (includes wizard-month-bug, bulk-select, daily/weekly date arith, Infinity sentinel, site-groups shuffle, days-mode toggle, FrequencyDays validation, SamplingDays input type) | `feature/ez-protect-admin-monorepo`, `pre-dev/qdd-ez-protect-20260327`, `pre-dev/qdd-queue-sftp-20260327`, `staging/ez-protect-pnpm10`, `remotes/origin/feature/ez-protect-admin-monorepo` | ❌ **NO** |
| `2972a4d19` | Docker `USER` directive + version pinning in queue-server Dockerfile | `remotes/origin/hotfix/security-audit-fixes` only | ❌ **NO** |

## What this changes

### Wizard-month-bug
- **Earlier claim**: "already fixed on master, branch is stale, just verify-and-close"
- **Real status**: **STILL OPEN ON MASTER**. The fix exists in the repo but lives on the EZ Protect monorepo feature branch waiting for that branch to merge.
- **Action**: when the EZ Protect monorepo PR lands on master, the wizard-month-bug fix will land with it. Until then, anyone running off master has the bug.

### Docker security hardening
- **Earlier claim**: "real Docker hardening at commit 2972a4d19, possibly already on master"
- **Real status**: **STRANDED** on `hotfix/security-audit-fixes` and nowhere else. The USER directive + version pinning are NOT in production master.
- **Action**: cherry-pick `2972a4d19` to a fresh focused branch (`hotfix/docker-user-and-pinning`) and PR cleanly to master, OR include it in the EZ Protect monorepo merge.

### Branch triage update
The previously-marked DEAD branches (16 total per the full enumeration) are still merged into master per the `--merged master` query. But **the work in `hotfix/security-audit-fixes` is NOT merged** even though I had it in the "stale and probably dead" bucket. Need to re-classify.

## Methodology error in earlier finding

My earlier process was:
1. `git cat-file -t 6189678a` → returns `commit` ✅ (commit exists)
2. *(skipped this step)* `git branch -a --contains 6189678a` → would have shown which branches contain it
3. Concluded "wizard-month-bug fix landed on master via 6189678aa"

The skipped step is the bug. **A commit existing in the repo doesn't mean it's reachable from master.** It can sit on any branch. The `cat-file -t` only tests existence in the object database; `branch --contains` tests reachability from a specific branch tip.

## Corrected Phase-Zero Ground-Truth Rule sub-step

The Phase-Zero rule (`feedback_ground_truth_check_before_scoring_candidates.md`) needs one more sub-step:

> 4. (NEW) After verifying a commit exists, ALSO run `git branch -a --contains <full-hash>` to confirm WHICH branches contain it, especially `master`. A commit existing != a fix being live in production.

This is the 6th Phase-Zero correction this session. The rule pays for itself again.

## What's still actionable RIGHT NOW

1. **Cherry-pick `2972a4d19` to `hotfix/docker-user-and-pinning`** — focused security fix, no migration baggage. Estimated 30-60 min including PR + review.
2. **Wait for EZ Protect monorepo PR to land**, OR cherry-pick `6189678aa` separately if the wizard-month-bug is high priority for Natalie.
3. **Re-brief Brian/Natalie** with the corrected ground truth: "the wizard-month-bug fix is in the repo but lives on the EZ Protect monorepo branch. When that lands, the bug fix lands with it. Should we cherry-pick it earlier as a hotfix, or wait for the migration?"

## Cube alignment

- Primary: D11 PROOF (cube 29791) — extends Phase-Zero with the new sub-step
- Secondary: D8 CHAIN (cube 6859) — chains back to original Phase-Zero rule
- Indexed in: `data/cubes/jbd.qdd.evidence-collector/findings.ndjson`

## Mirror status

To be mirrored to D: in same turn.
