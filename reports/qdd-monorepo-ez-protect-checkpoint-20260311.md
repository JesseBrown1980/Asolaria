# QDD Monorepo EZ Protect Checkpoint - 2026-03-11

## Purpose

This checkpoint now reflects the post-port EZ Protect state in the monorepo so a restart does not send the next Codex back into the old "placeholder page" reconstruction loop.

## Authoritative Targets

- Canonical repo for active QDD work:
  - `D:\projects\QDD\ebacmap-master`
- Old repo kept only as historical reference:
  - `D:\projects\QDD\ebacmap`

## Verified Repo State

### Monorepo

- Path: `D:\projects\QDD\ebacmap-master`
- Branch: `feature/ez-protect-admin-monorepo`
- HEAD: `37f1a34d4a431a86d0c6864f7fa23ac03f8433f2`
- Status: dirty; do not discard unrelated local work

Key monorepo facts:

- The smallest fixture-backed EZ Protect dashboard/API/service/module slice is now landed in `apps/web-ebacmap`.
- The `/ez-protect` page is no longer the old placeholder.
- The monorepo now has:
  - `apps/web-ebacmap/src/modules/ez-protect/domain/EzProtectEvent.ts`
  - `apps/web-ebacmap/src/modules/ez-protect/repos/EzProtectRepo.ts`
  - `apps/web-ebacmap/src/modules/ez-protect/repos/index.ts`
  - `apps/web-ebacmap/src/modules/ez-protect/use-cases/GetEzProtectDashboard/UseCase.ts`
  - `apps/web-ebacmap/src/modules/ez-protect/use-cases/GetEzProtectDashboard/index.ts`
  - `apps/web-ebacmap/src/modules/ez-protect/use-cases/GetEzProtectDashboard/route.int.ts`
  - `apps/web-ebacmap/src/pages/api/ez-protect/dashboard.ts`
  - `apps/web-ebacmap/src/services/ezProtect.ts`
  - `apps/web-ebacmap/src/utils/ezProtect.ts`
  - real dashboard behavior in `apps/web-ebacmap/src/pages/ez-protect/index.tsx`

### Old repo

- Path: `D:\projects\QDD\ebacmap`
- Status: still useful as reference only

Historical source files that were ported from:

- `D:\projects\QDD\ebacmap\pages\ez-protect\index.tsx`
- `D:\projects\QDD\ebacmap\pages\api\ez-protect\dashboard.ts`
- `D:\projects\QDD\ebacmap\services\ezProtect.ts`
- `D:\projects\QDD\ebacmap\modules\ez-protect\domain\EzProtectEvent.ts`
- `D:\projects\QDD\ebacmap\modules\ez-protect\repos\EzProtectRepo.ts`
- `D:\projects\QDD\ebacmap\modules\ez-protect\use-cases\GetEzProtectDashboard\UseCase.ts`

## What Passed

- `corepack pnpm --dir D:\projects\QDD\ebacmap-master exec tsc --noEmit --pretty false`
- Direct `tsx` smoke of `EzProtectRepo.getDashboardSummary()` with expected fixture window counts:
  - 1 day: `1`
  - 7 days: `3`
  - 14 days: `4`
  - 30 days: `6`

## Verification Added But Still Blocked

- Added focused API-route coverage:
  - `apps/web-ebacmap/src/modules/ez-protect/use-cases/GetEzProtectDashboard/route.int.ts`
- Added focused repo coverage:
  - `apps/web-ebacmap/src/modules/ez-protect/repos/EzProtectRepo.unit.ts`

Current blocker is baseline test-harness drift, not the EZ Protect slice itself:

- The legacy integration harness fails before the new route test starts because `test/integration/setup.js` assumes missing `.env.test` / `MONGODB_URI` state and then fails on `common/core/models` resolution.
- The shared unit harness is also drifting: even existing unit tests expose unresolved alias problems for `@ebacmap/*`, and `@/` is app-specific across multiple apps, so a quick global Jest mapper would be risky.

## Constraints And Risks

- Do not revert the dirty monorepo worktree.
- Do not resume implementation in the old repo.
- Do not treat the pre-port checkpoint text as current state anymore.
- Rollout evidence and live `CHARM_EZ_PROTECT_*` provisioning are still separate blockers and are not solved by this fixture-backed slice.

## Next Action After Recovery

Resume in `D:\projects\QDD\ebacmap-master` and verify the landed slice, not re-port it.

Preferred next moves:

1. Run an authenticated manual smoke for `/ez-protect` and `/api/ez-protect/dashboard`.
2. If automated verification is needed next, repair the Jest harness in a scoped way instead of adding a risky global `@/` alias rule.
3. Keep rollout-evidence work separate from the monorepo feature slice.
