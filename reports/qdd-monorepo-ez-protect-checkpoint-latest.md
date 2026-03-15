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
- Focused unit lane:
  - `corepack pnpm --dir D:\projects\QDD\ebacmap-master exec jest --config apps/web-ebacmap/jest.ez-protect.unit.config.js --runInBand`
- Focused integration lane:
  - `corepack pnpm --dir D:\projects\QDD\ebacmap-master exec jest --config apps/web-ebacmap/jest.ez-protect.integration.config.js --runInBand`

## Focused Verification Shape

- Focused API-route coverage:
  - `apps/web-ebacmap/src/modules/ez-protect/use-cases/GetEzProtectDashboard/route.int.ts`
- Focused repo coverage:
  - `apps/web-ebacmap/src/modules/ez-protect/repos/EzProtectRepo.unit.ts`
- App-local scoped harness files:
  - `apps/web-ebacmap/jest.ez-protect.base.js`
  - `apps/web-ebacmap/jest.ez-protect.unit.config.js`
  - `apps/web-ebacmap/jest.ez-protect.integration.config.js`
  - `apps/web-ebacmap/tsconfig.ez-protect.integration.json`
  - `apps/web-ebacmap/test/ez-protect.integration.setup.ts`
  - `apps/web-ebacmap/test/ez-protect.integration.utils.ts`

The shared repo-wide Jest drift still exists, but the bounded EZ Protect verification lane is no longer blocked because it now uses app-local config and compat shims instead of a risky global alias patch.

## Constraints And Risks

- Do not revert the dirty monorepo worktree.
- Do not resume implementation in the old repo.
- Do not treat the pre-port checkpoint text as current state anymore.
- Rollout evidence and live `CHARM_EZ_PROTECT_*` provisioning are still separate blockers and are not solved by this fixture-backed slice.

## Next Action After Recovery

Resume in `D:\projects\QDD\ebacmap-master` and verify the landed slice, not re-port it.

Preferred next moves:

1. Run an authenticated manual smoke for `/ez-protect` and `/api/ez-protect/dashboard`.
2. Keep any further automated verification scoped to the app-local EZ Protect configs instead of widening into the shared Jest harness.
3. Keep rollout-evidence work separate from the monorepo feature slice.
