# QDD EZ Protect — Rollout Evidence Report

**Date**: 2026-03-13
**Branch**: `feature/ez-protect-admin-monorepo`
**Repo**: `D:\projects\QDD\ebacmap-master`
**Brain Provider**: Anthropic/Claude (OpenAI offline until 2026-03-18)

---

## 1. Bounded Green Lane — PASS

All three verification steps pass on the current tree:

| Step | Result | Details |
|------|--------|---------|
| `tsc --noEmit` | PASS | Zero errors |
| Unit tests (`jest.ez-protect.unit.config.js`) | PASS | 2 suites, 5 tests |
| Integration tests (`jest.ez-protect.integration.config.js`) | PASS | 1 suite, 4 tests |

### Integration test contract verified:
- Missing `locationId` => **422** (pass)
- Unauthenticated => **403** (pass)
- No `EzProtect:view` permission => **401** (pass)
- Permitted facility user => **200** with fixture-backed dashboard summary (pass)

## 2. Rollout Flag State

### Environment variables:
- `NEXT_PUBLIC_FEATURE_CHARM_EZP_MODULE`: **not set** in `.env.example` or any checked-in env file
- `FEATURE_CHARM_EZP_MODULE`: **not set**

### Flag behavior (`ezProtect.ts`):
- `isEzProtectRolloutEnabled()` reads both flags; returns `true` only if either is `"true"`
- `isEzProtectModuleEnabled()` does **NOT** use the rollout flag — access is **purely permission-backed** via `hasEzProtectEntitlement()`
- The rollout flag is informational/planning only; it does not gate access

### Implication:
Setting the flag is not required for the feature to work. Access is controlled entirely by `EzProtect:view` permission on a per-facility or global basis.

## 3. Access Control Contract

| Component | Permission Check | Scope |
|-----------|-----------------|-------|
| Nav item (`navItems.tsx`) | `EzProtect:view` | facility or global |
| Page (`/ez-protect/index.tsx`) | `EzProtect:view` + facility context | facility-scoped |
| API (`/api/ez-protect/dashboard.ts`) | `EzProtect:view` + `locationId` param | facility-scoped |

### Permission resolution (`ezProtect.ts:22-50`):
1. Check facility-scoped `EzProtect:view` for the given `locationId`
2. Fall back to global `EzProtect:view`
3. No user => deny

## 4. Rollback Notes

**Rollback does NOT require a code change or flag flip.** Access is permission-backed:

- **To disable for a user/facility**: Remove the `EzProtect:view` permission from their role at that facility
- **To disable globally**: Remove all `EzProtect:view` permission grants
- **To hide from nav**: Same — nav visibility is permission-gated
- **Code rollback**: Revert the EZ Protect files from the monorepo (but unnecessary if permission-gating is sufficient)

The rollout flag (`NEXT_PUBLIC_FEATURE_CHARM_EZP_MODULE`) can optionally be set for audit/tracking purposes, but it has no effect on actual access.

## 5. Data Layer

- **Backend**: Fixture-backed via `EzProtectRepo.ts` (no live database dependency)
- **Dashboard use case**: `GetEzProtectDashboard` returns a summary shape with window cards
- **No migrations required** for this slice

## 6. Manual Smoke — PASS (2026-03-13)

Performed via Playwright browser automation against local dev server (`pnpm ebacmap-dev` on port 3000).

- [x] Start app with `pnpm ebacmap-dev`
- [x] Seed test user (`plasmatoid@gmail.com` / `D3velopment!`) with `EzProtect:view` permission via `/api/integration/seed`
- [x] Seed test location (`c17b2fd704734fc6f1cde832` / "Test Facility") and client (`30608169abc6d6e4fc4a31f7` / "Test Client")
- [x] Sign in as seeded user — header shows "Jesse Brown"
- [x] Set facility context to Test Facility (via location cookie + localStorage)
- [x] `/ez-protect` renders fixture-backed dashboard with 4 window cards:
  - 1-Day: 1 event (negative: 1)
  - 7-Day: 3 events (negative: 2, positive: 1)
  - 14-Day: 4 events (negative: 2, positive: 1, warning: 1)
  - 30-Day: 6 events (negative: 3, positive: 2, warning: 1)
- [x] Dashboard shows "Total normalized events: **6**" — matches integration test
- [x] Negative paths verified via curl:
  - `GET /api/ez-protect/dashboard` (no locationId) → **422** `{"message":"Invalid","errors":["locationId is a required field"]}`
  - `GET /api/ez-protect/dashboard?locationId=...` (unauthenticated) → **403** `{"message":"Forbidden","errors":["You are not authorized to access that area"]}`

### To reproduce:
```
cd D:\projects\QDD\ebacmap-master
pnpm ebacmap-dev
# Seed user: POST /api/integration/seed with user body (APP_ENV=test required)
# Set location cookie: { id: 'c17b2fd704734fc6f1cde832', name: 'Test Facility' }
# Navigate to http://localhost:3000/ez-protect
```

## 7. Files Changed in This Slice

| File | Type |
|------|------|
| `apps/web-ebacmap/src/modules/ez-protect/domain/EzProtectEvent.ts` | Domain model |
| `apps/web-ebacmap/src/modules/ez-protect/repos/EzProtectRepo.ts` | Repository |
| `apps/web-ebacmap/src/modules/ez-protect/repos/EzProtectRepo.unit.ts` | Unit test |
| `apps/web-ebacmap/src/modules/ez-protect/use-cases/GetEzProtectDashboard/UseCase.ts` | Use case |
| `apps/web-ebacmap/src/modules/ez-protect/use-cases/GetEzProtectDashboard/route.int.ts` | Integration test |
| `apps/web-ebacmap/src/pages/ez-protect/index.tsx` | Page |
| `apps/web-ebacmap/src/pages/api/ez-protect/dashboard.ts` | API route |
| `apps/web-ebacmap/src/utils/ezProtect.ts` | Utility/flag logic |
| `apps/web-ebacmap/src/utils/ezProtect.unit.ts` | Unit test |
| `apps/web-ebacmap/src/components/Layout/navItems.tsx` | Nav wiring |
| `apps/web-ebacmap/jest.ez-protect.unit.config.js` | Test config |
| `apps/web-ebacmap/jest.ez-protect.integration.config.js` | Test config |

---

**Conclusion**: The EZ Protect code slice is **complete and fully verified**. All automated checks pass. Manual smoke test passes. The feature is ready for rollout — enable by granting `EzProtect:view` permission to target users/facilities.
