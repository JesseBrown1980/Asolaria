# QDD Fix Wave 2 — Remaining Issues from 12-Agent Audit
# All fixes verified by TSC + full test suite after completion
# NO PUSH without Jesse approval

## WAVE 2A: Remaining Frontend Mismatches
- [ ] results/[id].tsx: deviceSerial→deviceSerialNumber, organization→organizationId, facility→facilityId
- [ ] All EZ Protect pages: audit every field reference against EzProtectNormalizedEvent domain model
- [ ] results.tsx: verify pagination response shape matches actual API response

## WAVE 2B: Schema Hardening
- [ ] EzProtect models: strict:false → strict:true (or remove strict to use default)
- [ ] EzProtectEvent: add required:true on clientId + locationId
- [ ] EzProtectEvent: add missing index {clientId:1, locationId:1, ingestedAt:-1}
- [ ] EzProtectMsaConfig: remove (no active consumers)

## WAVE 2C: Security Hardening
- [ ] Add rate limiting to auth endpoints (login, forgot, reset, SSO)
- [ ] Add rate limiting to EZ Protect ingest endpoint
- [ ] EZ Protect ingest: add events array size limit (max 1000)
- [ ] EZ Protect ingest: add inner event schema validation
- [ ] EZ Protect export: add row cap / pagination
- [ ] event/[id] route: add clientId tenant isolation guard
- [ ] Session TTL: set non-zero server-side expiration
- [ ] faqLinks/videoLinks: sanitize URLs (block javascript: URIs)

## WAVE 2D: Code Quality
- [ ] DomainEventBus.waitForEvents(): fix epoch*60000 infinite timeout bug
- [ ] DomainEventBus: fix undefined name variable in console.error
- [ ] validate.ts: fix .length vs 'undefined' string comparison
- [ ] logging.ts: fix DD/MMM/YYYY → dd/MMM/yyyy for date-fns v2
- [ ] UseCase.ts: add backoff + logging to VersionError retry loop
- [ ] Queue.ts: remove DB connection close after queueJob
- [ ] Queue.ts: fix race condition — use findOneAndUpdate
- [ ] Sentry SDK: @sentry/nextjs → @sentry/node in queue-server + sync-server

## WAVE 2E: Cleanup
- [ ] Remove duplicate CSV logic in ExportEvents vs GenerateEzProtectReport
- [ ] Fix EZP categorizeError() unused params
- [ ] Fix Notification.clientId ref: TestDefinition → Client
- [ ] Fix TestDefinition.organism ref: Organisms → Organism
- [ ] Remove TestDefinition duplicate fields (categoryId+category, organismId+organism)
- [ ] Admin next.config.js: remove ignoreBuildErrors:true, fix underlying type issues
- [ ] sync-server: version mismatch package.json 2.0.1 vs version.ts 1.1.1
