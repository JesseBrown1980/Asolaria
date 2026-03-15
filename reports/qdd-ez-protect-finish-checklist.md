# QDD EZ Protect — Finish Checklist

**Generated**: 2026-03-13
**Branch**: `feature/ez-protect-admin-monorepo`
**Repo**: `D:\projects\QDD\ebacmap-master`
**Status**: Feature slice landed, bounded green lane passing. Remaining work is manual smoke + rollout evidence.

---

## Pre-requisites (re-run before every closeout attempt)

- [ ] `tsc --noEmit` passes
- [ ] EZ Protect unit tests pass (`jest.ez-protect.unit.config.js`)
- [ ] EZ Protect integration tests pass (`jest.ez-protect.integration.config.js`)

## Manual Smoke (authenticated, facility-scoped)

Start the app: `pnpm ebacmap-dev` from `D:\projects\QDD\ebacmap-master`

- [ ] Sign in as a user with `EzProtect:view` permission
- [ ] Select a real facility context (not global)
- [ ] `/ez-protect` is visible in nav for permitted user (wired in `navItems.tsx`)
- [ ] With facility selected, page renders fixture-backed dashboard + window cards (`index.tsx`)
- [ ] `GET /api/ez-protect/dashboard?locationId=<facilityId>` returns 200 with expected summary shape (`UseCase.ts`, `EzProtectRepo.ts`)

### Negative checks (must match integration contract in `route.int.ts`):

- [ ] Missing `locationId` => 422
- [ ] Unauthenticated => 403
- [ ] No `EzProtect:view` permission => 401
- [ ] Permitted facility user => 200

## Rollout Evidence (capture separately from code lane)

- [ ] Document whether `NEXT_PUBLIC_FEATURE_CHARM_EZP_MODULE` and/or `FEATURE_CHARM_EZP_MODULE` are set (logic in `ezProtect.ts`)
- [ ] Proof of user/facility permission used for manual smoke (flag does NOT bypass permission checks)
- [ ] Record exact facility ID, user role, and expected results so smoke is repeatable
- [ ] Rollback notes: access is permission-backed, not just flag-backed — describe how to disable safely
- [ ] Seed logs if applicable
- [ ] Live validation checklist with credentials for re-verification

## Key Source Files

| File | Purpose |
|------|---------|
| `apps/web-ebacmap/src/pages/ez-protect/index.tsx` | Page — facility-scoped, permission-gated |
| `apps/web-ebacmap/src/pages/api/ez-protect/dashboard.ts` | API — requires `locationId` + `EzProtect:view` |
| `apps/web-ebacmap/src/modules/ez-protect/use-cases/GetEzProtectDashboard/UseCase.ts` | Use case |
| `apps/web-ebacmap/src/modules/ez-protect/repos/EzProtectRepo.ts` | Repository (fixture-backed) |
| `apps/web-ebacmap/src/utils/ezProtect.ts` | Rollout flag logic |
| `apps/web-ebacmap/src/components/Layout/navItems.tsx` | Nav wiring |
| `apps/web-ebacmap/src/utils/permissions.ts` | Permission definitions |

## Rules

- Do NOT revert unrelated edits in the dirty worktree
- Do NOT use the old repo at `D:\projects\QDD\ebacmap`
- Freeze the current tree and keep QDD scoped
