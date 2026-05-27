# EZ Protect Module — Task List
> Last updated: 2026-03-14
> Project: QDD eBacMap — Charm EZ Protect Integration

---

## COMPLETED

- [x] 29-field normalized event model (expanded from 15)
- [x] MongoDB collections: EzProtectEvent, EzProtectAlertRule, EzProtectAlertHistory, EzProtectMsaConfig
- [x] SFTP/CSV/JSON ingestion pipeline with parser
- [x] TOCTOU race fix on ingest (atomic findOneAndUpdate)
- [x] BOM stripping for CSV files
- [x] Result state normalization with aliases
- [x] Corporate dashboard ($facet aggregation, by-facility breakdown)
- [x] Facility dashboard (4 time-window cards: 1/7/14/30 days)
- [x] Device health monitoring (online/offline/error status)
- [x] Results table with filtering, pagination, sorting
- [x] Single event detail page
- [x] Alert rule CRUD (7 trigger types)
- [x] Alert dedup (prevents duplicate alerts within 5 min)
- [x] Device offline alert trigger type
- [x] Alert email delivery via Postmark (sendPlainEmail)
- [x] CSV export endpoint
- [x] Permission enforcement (Manage/View/NoAccess)
- [x] Feature flag gating (NEXT_PUBLIC_FEATURE_CHARM_EZP_MODULE)
- [x] Admin/clients page crash fix (null safety)
- [x] lockout/supervisorOverride null semantics fix

## COMPLETED (2026-03-14 agent run)

- [x] **PDF Report Generation** — real HTML-to-PDF via Playwright (generatePdfWithRetry), 4 report types, styled tables, device health + compliance sections
- [x] **Graph Comparison Page** — SVG time-series overlay, device selection, threshold line ranges, result state distribution bars, comparison summary cards
- [x] **Troubleshooting Page** — decision tree (3 categories), FAQ section (6 items), training video links (4 entries)
- [x] **MSA Result Routing** — anonymizeEvent() strips PII, Postmark delivery, audit trail in EzProtectAlertHistory
- [x] **Alert Email Delivery** — sendPlainEmail via Postmark, supports email/both/sms channels
- [x] **Device Offline Trigger** — MongoDB aggregation for last-event-per-device, configurable offlineMinutes threshold
- [x] **TypeScript Error Fixes** — ingestedAt type, lastErrorObject cast, UserSessionView._id → .id

## TODO — Code

- [ ] SMS alert delivery (needs Twilio provider configuration)
- [ ] Navigation sidebar — add EZ Protect submenu, gate behind isEzProtectModuleEnabled()
- [ ] Clock-triggered alert type (per Charm Slide 6)
- [ ] Operator group filtering on facility dashboard
- [ ] Error categorization visualization (procedural vs equipment on charts)
- [ ] Default alert rules seeding (auto-create on client onboarding)

## TODO — Integration

- [ ] LIMS integration (**BLOCKED** — client hasn't provided API specs)
- [ ] Anonymized data sharing with Charm (format/frequency/delivery TBD)
- [ ] MSA agreement template coordination (legal/contract)

## TODO — Testing & QA

- [ ] TypeScript compilation verification across all EZ Protect files
- [ ] Update existing 9 tests for 29-field model
- [ ] Integration tests for each API endpoint
- [ ] Unit tests for parser edge cases
- [ ] End-to-end test: SFTP ingest → DB → API → UI → alerts → export
- [ ] Permission boundary tests
- [ ] Seed script with codex pack fixture data (5 sample events)
- [ ] Seed script with realistic production-like data

## TODO — Deployment

- [ ] Git commit all current changes
- [ ] UAT environment setup
- [ ] Migration script for EzProtect collections + indexes
- [ ] Environment variables documentation (CHARM_EZ_PROTECT_* values)
- [ ] Brian's DigitalOcean deployment steps

## BLOCKED

| Item | Blocker | Owner |
|------|---------|-------|
| LIMS integration | Client hasn't provided LIMS API specs | Natalie → Client |
| Real device data | Need actual EZP+ device output files | Charm |
| Anonymized data sharing | Need format, frequency, delivery method spec | Charm |
| SMS alerts | Need Twilio account/credentials configured | Brian/Jesse |
| MSA template | Legal/contract coordination needed | Natalie |
| Deployment | Brian's DigitalOcean access | Brian |

## Requirements Traceability (27/35 done)

| # | Requirement | Status |
|---|------------|--------|
| 1 | EZP/EZP+ support | DONE |
| 2 | Real-time results | DONE |
| 3 | Communication modes | DONE |
| 4 | Secure tokens | DONE |
| 5 | Web access | DONE |
| 6 | Multilingual | DONE (next-intl) |
| 7 | Secure login | DONE |
| 8 | Multi-location results | DONE |
| 9 | PDF export | DONE |
| 10 | CSV export | DONE |
| 11 | Intuitive filtering | DONE |
| 12 | Automated PDF reports | DONE |
| 13 | Graph comparison | DONE |
| 14 | Line ranges on graphs | DONE |
| 15 | Default Invalid triggers | DONE |
| 16 | Dashboard + Trigger notifications | DONE |
| 17 | Email alerts | DONE |
| 18 | Customizable preferences | DONE |
| 19 | FAQ/video in notifications | DONE |
| 20 | Default alerts | DONE |
| 21 | Charm tech support opt-in (MSA) | DONE |
| 22 | Device connectivity (24h) | DONE |
| 23 | Positives 1/7/14 days | DONE |
| 24 | Invalids by facility | DONE |
| 25 | Error code / lot+roll | DONE |
| 26 | Procedural vs equipment errors | DONE |
| 27 | Daily PM by facility | DONE |
| 28 | Facility device connectivity | DONE |
| 29 | Positive breakdown (Initial/Presumptive/Product) | DONE |
| 30 | Invalids by SN/Operator | DONE |
| 31 | Daily PM by SN/Operator | DONE |
| 32 | Device health monitoring | DONE |
| 33 | Error diagnosis/troubleshooting | DONE |
| 34 | LIMS integration | BLOCKED |
| 35 | Anonymized data sharing | BLOCKED |
