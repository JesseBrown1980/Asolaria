# Queue-Server SFTP Troubleshooting 2026-03-11
Origin: C:\Users\acer\Asolaria\reports\queue-server-sftp-troubleshooting-20260311.md
# Queue-Server SFTP Troubleshooting - 2026-03-11

## Scope

- Monorepo target: `D:\projects\QDD\ebacmap-master`
- App: `apps/queue-server`
- Source request: Brian Birkhauser email, March 11, 2026
- Requested defect slice:
  - processed SFTP files should move to `imported/`
  - missing `sampleDate` should use the scheduled test date
  - pending test results should not be created in triplicate
  - imported times should not drift to the wrong timezone

## Implemented Result

The code slice was moved out of the legacy repo shape and into the monorepo `queue-server` app. The durable fix is now centered on a shared pending-result helper plus focused queue-server tests.

Files changed in the active slice:

- `D:\projects\QDD\ebacmap-master\apps\queue-server\src\utils\pendingTestResult.ts`
- `D:\projects\QDD\ebacmap-master\apps\queue-server\src\utils\pendingTestResult.unit.ts`
- `D:\projects\QDD\ebacmap-master\apps\queue-server\src\use-cases\ImportFtpResults\UseCase.ts`
- `D:\projects\QDD\ebacmap-master\apps\queue-server\src\use-cases\ImportFtpResults\UseCase.unit.ts`
- `D:\projects\QDD\ebacmap-master\apps\queue-server\src\use-cases\ImportTestResult\UseCase.ts`
- `D:\projects\QDD\ebacmap-master\apps\queue-server\src\use-cases\ImportTestResult\UseCase.unit.ts`
- `D:\projects\QDD\ebacmap-master\apps\queue-server\src\use-cases\ExportToFtp\UseCase.unit.ts`

## Technical Outcome

1. Pending-result dedupe was centralized in `pendingTestResult.ts`.
   - Canonical uniqueness now keys on the stable business fields instead of transient import payload fields.
   - Missing and null `scheduledDateId` values are treated as the same logical case.
   - `updateOne(..., { upsert: true })` with `$setOnInsert` is the write path, which prevents repeat failure handling from creating triplicates.

2. Missing `sampleDate` now falls back to the scheduled swab date.
   - `resolvePendingSampleDate()` checks the scheduled test row when `scheduledTestId` or `testId` is present.
   - If the schedule row is found, it uses `scheduledDate` or `originalDate` and normalizes it with `fixTimeZone()`.

3. Timezone handling stays on the same normalization path.
   - The queue-server invalid-result path and the import-test-result pending path now both go through the same date resolution helper.
   - This keeps explicit sample dates and scheduled-date fallback on one timezone-normalized path instead of mixing `new Date()` defaults with local-host interpretation.

4. Move/finalize behavior stayed in scope for verification.
   - Focused import tests cover the finalize path and retry-sensitive log state.
   - This slice improves confidence around Brian's first issue without claiming that every queue-server legacy red test is now green.

## Verification

Focused verification completed cleanly:

```powershell
corepack pnpm --dir D:\projects\QDD\ebacmap-master exec jest --config apps/queue-server/jest.config.js --runInBand --runTestsByPath `
  apps/queue-server/src/utils/pendingTestResult.unit.ts `
  apps/queue-server/src/use-cases/ImportFtpResults/UseCase.unit.ts `
  apps/queue-server/src/use-cases/ImportTestResult/UseCase.unit.ts `
  apps/queue-server/src/use-cases/ExportToFtp/UseCase.unit.ts

corepack pnpm --dir D:\projects\QDD\ebacmap-master exec tsc --noEmit --pretty false
```

Focused result:

- `PASS` `pendingTestResult.unit.ts`
- `PASS` `ImportFtpResults/UseCase.unit.ts`
- `PASS` `ImportTestResult/UseCase.unit.ts`
- `PASS` `ExportToFtp/UseCase.unit.ts`
- `PASS` `pnpm exec tsc --noEmit --pretty false`

Known unrelated red suites were not used as closeout criteria for Brian's four-item SFTP slice:

- `apps/queue-server/src/Queue.unit.ts`
- `apps/queue-server/src/use-cases/SendReportPdf/UseCase.unit.ts`
- `apps/queue-server/src/use-cases/SendIntervalReports/UseCase.unit.ts`

## Mistakes To Keep Indexed

1. Wrong repo target assumption.
   - Initial work happened against the old repo structure before Brian clarified that the authoritative target was the monorepo.
   - Preventive rule: verify the current build/deploy target from the latest owner message before editing.

2. Bridge delivery was treated as progress signal for too long.
   - Super swarm ACKs proved message delivery, not execution evidence.
   - Preventive rule: use local repo tests and direct file inspection as the source of truth; treat bridge replies as asynchronous supporting evidence.

3. Ambient queue-server test debt can hide the requested defect slice.
   - The full queue-server suite still has unrelated failures.
   - Preventive rule: close the requested defect slice with focused tests first, then list remaining unrelated reds explicitly.

## Tools And Skills Used

Tools used in this slice:

- `rg`
- `git`
- `corepack pnpm`
- `jest`
- `tsc`
- local Asolaria relay at `C:\Users\acer\codex-bridge`
- Asolaria indexing tools:
  - `C:\Users\acer\Asolaria\tools\Index-SkillsToolsMistakes.ps1`
  - `C:\Users\acer\Asolaria\tools\Sync-asolaria-NotebookLM.ps1`

Codex skills used:

- No special Codex skill was needed for the code fix itself.
- Indexing/knowledge capture was handled with Asolaria's local tooling rather than a separate Codex wrapper skill.

## Local / Project / NotebookLM Index Intent

This note is intended to exist in three retrieval surfaces:

- local Asolaria report memory
- repo-local queue-server troubleshooting docs
- Asolaria Enterprise Memory NotebookLM bundle

The matching project-local note is:

- `D:\projects\QDD\ebacmap-master\apps\queue-server\docs\sftp-troubleshooting-20260311.md`