# QDD eBacMap — Push Plan 2026-03-26
# Status: ACTIVE
# Orchestrator: Gaia (Claude Opus 4.6)
# Branch: staging/ez-protect-pnpm10

## REVIEW RESULTS (6 reviewers completed)
- R-1 API Endpoints: 15/15 PASS
- R-2 Page Audit: 7/7 WILL RENDER (3 minor bugs)
- R-3 Wave Claims: 11/13 VERIFIED (SSO unverified, strict:true implicit)
- R-4 Data Quality: CLEAN (11,001 events, 427 devices, 14 locations)
- R-5 Push Plan: 9-step plan delivered
- R-6 Regressions: 0/7 — all shared libs SAFE

## TEST RESULTS
- Unit: 107/107 (12 suites)
- Integration: 9/9 (2 suites)
- Queue-server: 82/82 (11 suites, 7 teardown warnings)
- Total: 198/198 GREEN

## DATABASE
- Events: 11,001
- Devices: 427 unique
- Locations: 14
- Alert rules: 31
- Alert histories: 1,780
- Test results: 2,290
- Reports: 115

## PHASE A: Fix 3 Page Bugs + SSO (~30 min)
- [x] A1: devices.tsx — totalEvents null guard DONE
- [x] A2: compare.tsx — default date range → 180d DONE
- [x] A3: SSO SsoCallback — client-matching guard APPLIED (user.client.equals check)

## PHASE B: Write 5 Security Unit Tests (~30 min)
- [x] B1: Rate limiting test — 9 cases written, running
- [x] B2: URL sanitization test — 2 javascript: cases added, running
- [~] B3: Ingest cap test written, queue atomicity pending

## PHASE C: Clean + Push (R-5 plan)
- [ ] C1: Delete apps/web-ebacmap/src/pages/api/auth/dev-bypass.ts
- [ ] C2: Revert dev bypass in apps/web-ebacmap/src/pages/api/users/me.ts (lines 22-36)
- [ ] C3: Add scripts/seed-*.js to .gitignore
- [ ] C4: Stage all Wave 1-4 fixes + new tests + ErrorBoundary (git add specific files)
- [ ] C5: Run final test suite
- [ ] C6: Commit with full message
- [ ] C7: Push to staging/ez-protect-pnpm10

## PHASE D: Two-Model Review
- [ ] D1: Review by second frontier model before Bitbucket push
- [ ] D2: Review by third frontier model
- [ ] D3: Push to Bitbucket only after all clear

## BLOCKERS ON BRIAN
- CHARM_EZ_PROTECT_* env values
- DigitalOcean production access
- LIMS API specs
- Staging MongoDB connection string
