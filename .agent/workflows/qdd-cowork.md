# Workflow: QDD eBacMap — Gaia + Liris Cowork
# Status: ACTIVE
# Started: 2026-03-25 ~09:00 UTC
# Gaia: pnpm 9 on Jesse machine (192.168.15.189)
# Liris: pnpm 10 on Rayssa machine (192.168.15.170)
# Comms: MQTT on 192.168.15.189:18883
# Branch: feature/ez-protect-admin-monorepo (pnpm 9) + chore/pnpm-10-upgrade (pnpm 10)

## GAIA TASKS — ALL COMPLETE
- [x] pnpm 9: 186/186 GREEN
- [x] pnpm 10: installed, merged EZ Protect, 97/97 GREEN, TSC clean
- [x] Wave 1 fixes: 8 agents, 31 files (frontend wiring, security, data corruption, DB models, CI/CD)
- [x] Wave 2 fixes: 8 agents, 25+ files (remaining fields, schemas, rate limiting, libs, queue, refs, cleanup)
- [x] Dev bypass created for local testing without staging DB
- [x] Test data seeded (50 events, 2 alert rules)
- [x] Jesse smoke test: App loads, nav works, admin saves, CSV export works, table settings work

## REMAINING
- [x] EZ Protect dashboard 500 FIXED — root cause: seeded user had clientId instead of client (ObjectId ref). Created scripts/seed-dev-user.js with correct schema. Dashboard API now returns 200 with data.
- [x] Correct seed script: scripts/seed-dev-user.js (dev@ebacmap.local / devpassword123)
- [x] All 9 API endpoints return 200
- [x] 102/102 tests pass (11 unit + 82 queue + 9 integration)
- [x] All Wave 1+2 fixes verified intact (10/10)
- [x] DB model fixes verified (9/9)
- [x] Deleted spec (SyncToLims/route.int.ts) restored
- [x] ObjectId cast fix for devices + corporate dashboard
- [x] Search debounce + Apply button rewrite (draft→committed pattern)
- [x] Device filter case-insensitive regex
- [x] alerts.tsx all 7 shape mismatches fixed
- [x] facility.tsx remapped to actual API response
- [x] docToNormalized adds id field
- [x] Alert history alertName field fixed
- [x] 300 events + 7 rules + 80 histories + reports + test results seeded
- [ ] Seed more complete test data (facilities, devices with proper schema)
- [ ] Test all EZ Protect sub-pages with data: results, alerts, devices, facility, compare, troubleshooting
- [ ] Remove dev-bypass files (dev-bypass.ts, me.ts patch) before any push
- [ ] Run full test suite one more time after all Wave 2 changes
- [ ] Present audit report + fixes to Brian

## LIRIS TASKS (pnpm 10 — Rayssa machine)
- [ ] Confirm dev server on localhost:3000
- [ ] Run EZ Protect unit tests — report count
- [ ] Run EZ Protect integration tests — report count
- [ ] Check queue-server jest.config.ts preset
- [ ] Write EvaluateEzProtectAlerts/UseCase.unit.ts
- [ ] Write ProcessEzProtectFile/UseCase.unit.ts
- [ ] Write SyncEzProtectToLims/UseCase.unit.ts
- [ ] Report all results via MQTT

## BLOCKED ON BRIAN
- CHARM_EZ_PROTECT_* env values
- DigitalOcean prod access
- LIMS API specs

## RULES
- NO PUSH without Jesse + Gaia + Liris all clear
- Pure code, no simulation
- Report after each task
