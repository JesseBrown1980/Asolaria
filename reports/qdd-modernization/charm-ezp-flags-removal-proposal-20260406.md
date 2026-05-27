# CHARM_EZP_PROTECT Feature Flags — INVESTIGATION RESULT (Q-QDD-MOD-001 candidate c3)

**Date:** 2026-04-06 (revised 2026-04-07T00:22Z after Phase-Zero ground truth)
**Constellation agent:** `jbd.qdd.diff-proposer` (D4 OBJECT) + `jbd.qdd.compliance-guardian` (D16 SECURITY)
**Status:** ⚠️ **PROPOSAL INVERTED** — the flag should NOT be removed. It is intentionally retained.

---

## Summary of inversion

The original proposal (drafted from the master status doc + finish checklist) said the CHARM_EZP_PROTECT feature flags were dead code and should be removed. **The Phase-Zero ground-truth rule, applied via real read of `apps/web-ebacmap/src/utils/ezProtect.ts`, caught the error.**

The flag is functionally not in any access-control call path, BUT it is **deliberately kept** for evidence/planning purposes. The file's own comment (line 56-58) documents this:

> *"Access remains permission-backed today. The rollout flag is still useful for evidence/planning, but it must not imply reachability on its own while nav, page, and API routes enforce EzProtect permission checks."*

This is intentional design. The flag is a rollout-tracking artifact, not a gating mechanism. Removing it would erase the evidence/planning value documented by the comment.

## Real code structure (verified)

`apps/web-ebacmap/src/utils/ezProtect.ts` defines THREE related functions:

1. **`isEzProtectRolloutEnabled()`** — reads `NEXT_PUBLIC_FEATURE_CHARM_EZP_MODULE` and `FEATURE_CHARM_EZP_MODULE`. **NEVER CALLED outside of test files.** This is the rollout-tracking flag.

2. **`hasEzProtectEntitlement(user, location)`** — does the REAL access check via `hasPermission()` against `PermissionDomainValue.EzProtect` + `PermissionActionValue.View`. Falls back to global permission if no facility-specific permission. This is what gates access.

3. **`isEzProtectModuleEnabled(user, location)`** — public function that callers use to check module access. **It just returns `hasEzProtectEntitlement(user, location)` directly.** The flag is NOT in this call path. The comment above it explicitly documents that "access remains permission-backed today" and the flag "must not imply reachability on its own."

## Phase-Zero verification commands run

```bash
# Confirm flag refs exist
git grep -ln 'CHARM_EZP_MODULE\|FEATURE_CHARM_EZP'
# → only ezProtect.ts (definition) and ezProtect.unit.ts (test)

# Confirm no callers in non-test code
git grep -n 'isEzProtectRolloutEnabled' -- 'apps/web-ebacmap/src/' ':!*.unit.ts'
# → empty (no non-test callers)

# Confirm the actual access path uses permissions
# (read of ezProtect.ts confirms isEzProtectModuleEnabled = hasEzProtectEntitlement)
```

## Corrected action

**DO NOT remove the flag.** Instead:

### Option A — Document and verify (low effort, recommended)

1. Add a clarifying comment to `isEzProtectRolloutEnabled` itself (currently the comment is on `isEzProtectModuleEnabled`):
   ```typescript
   /**
    * Reads the CHARM_EZP_MODULE rollout flag for evidence/planning purposes.
    * NOTE: This is NOT used for access control. Access is permission-backed
    * via hasEzProtectEntitlement(). This flag tracks rollout phase only.
    */
   export const isEzProtectRolloutEnabled = (): boolean =>
     readFlag(process.env.NEXT_PUBLIC_FEATURE_CHARM_EZP_MODULE) ||
     readFlag(process.env.FEATURE_CHARM_EZP_MODULE);
   ```
2. Verify there are no other `isEzProtectRolloutEnabled` callers across the entire monorepo (not just web-ebacmap)
3. If indeed unused everywhere, ADD a unit test confirming it returns the expected boolean for the env var combinations
4. Leave the flag in place

### Option B — Rename for clarity (medium effort, optional)

Rename `NEXT_PUBLIC_FEATURE_CHARM_EZP_MODULE` and `FEATURE_CHARM_EZP_MODULE` to `NEXT_PUBLIC_CHARM_EZP_ROLLOUT_PHASE` and `CHARM_EZP_ROLLOUT_PHASE` so the name reflects the actual purpose (rollout tracking, not access gate). This would touch:
- `apps/web-ebacmap/src/utils/ezProtect.ts`
- `apps/web-ebacmap/src/utils/ezProtect.unit.ts`
- Any `.env.example`, Dockerfile, CI/CD config that sets these vars
- Any deploy documentation

Risk: env var renames can break deploys if any environment still sets the old name. Coordinate with Charm Sciences before changing the name.

### Option C — Investigate the "evidence/planning" use case (research)

The comment says the flag is "useful for evidence/planning" — but it's not clear from the code WHO uses that. Tasks:
1. Search the broader monorepo for any tooling that reads the flag (CI scripts, deployment dashboards, monitoring)
2. Ask Brian/Natalie what evidence/planning workflow uses the flag
3. If no one is reading it, the comment might be aspirational and Option A applies; if someone IS reading it, Option B is the right move

## What this proposal CANNOT do without more context

- Determine if the "evidence/planning" use case is currently active (need Brian/Natalie input)
- Decide between Options A/B/C without knowing the actual rollout-tracking workflow
- Estimate the rename safely without inventory of all env var consumers

## Corrected estimate

- **Original**: 4h to remove + test
- **Corrected**: 1-2h for Option A (comment + test), 4-6h for Option B (rename + coordination), 2-4h for Option C (research)

The previous estimate over-stated the work AND was directionally wrong. Phase-Zero saved us from making a destructive change to intentional code.

## Cube alignment

- Primary: D4 OBJECT (cube 343) — concrete file:line analysis
- Secondary: D11 PROOF (cube 29791) — verified ground truth
- Secondary: D16 SECURITY (cube 148877) — compliance guardian veto on the original removal proposal

## What changed vs original proposal

| Aspect | Original | Corrected |
|---|---|---|
| Action | Remove the flag | Keep the flag, optionally clarify |
| Reasoning | "Confirmed dead code per JBD analysis" | "Functionally bypassed BUT intentionally retained per file's own comment" |
| Effort | 4h | 1-2h (Option A) |
| Risk | Low (claimed) | Originally MEDIUM (we'd have removed intentional code); corrected version is LOW |
| Source of truth | Master status doc + finish checklist | Real read of ezProtect.ts on D:\projects\QDD\ebacmap-master |

## Cross-references

- `feedback_ground_truth_check_before_scoring_candidates.md` — the Phase-Zero rule that caught this
- `project_lx_488_total_federation_join.md` — LX-488 unlocked the real git access that made this verification possible
- `reports/qdd-master-status-20260315.md` — the source doc that contained the "dead code" claim (3 weeks stale at time of this reading)
- `reports/qdd-ez-protect-finish-checklist.md` — also said to "describe how to disable safely" — which matches Option A (clarify) better than the original removal proposal
