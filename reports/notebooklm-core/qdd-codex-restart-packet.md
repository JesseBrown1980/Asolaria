# QDD Codex Restart Packet
Origin: C:\Users\acer\Asolaria\reports\qdd-codex-restart-packet-latest.md
# QDD Codex Restart Packet - 2026-03-11

## Read First

1. `C:\Users\acer\AGENTS.md`
2. `C:\Users\acer\Asolaria\TASKS.md`
3. `C:\Users\acer\Asolaria\reports\qdd-monorepo-ez-protect-checkpoint-latest.md`
4. `C:\Users\acer\Asolaria\reports\queue-server-sftp-troubleshooting-20260311.md`
5. `D:\projects\QDD\ebacmap-master\apps\web-ebacmap\docs\codex-restart-packet-20260311.md`

## Canonical Repo Target

Use:

- `D:\projects\QDD\ebacmap-master`

Do not resume EZ Protect implementation in:

- `D:\projects\QDD\ebacmap`

## Current Branch State

- branch: `feature/ez-protect-admin-monorepo`
- HEAD: `37f1a34d4a431a86d0c6864f7fa23ac03f8433f2`
- worktree: already dirty; do not revert unrelated edits

## Current Engineering State

The smallest fixture-backed EZ Protect slice is already landed in the monorepo web app.

What is in place now:

- `apps/web-ebacmap/src/modules/ez-protect/domain/EzProtectEvent.ts`
- `apps/web-ebacmap/src/modules/ez-protect/repos/EzProtectRepo.ts`
- `apps/web-ebacmap/src/modules/ez-protect/repos/EzProtectRepo.unit.ts`
- `apps/web-ebacmap/src/modules/ez-protect/repos/index.ts`
- `apps/web-ebacmap/src/modules/ez-protect/use-cases/GetEzProtectDashboard/UseCase.ts`
- `apps/web-ebacmap/src/modules/ez-protect/use-cases/GetEzProtectDashboard/index.ts`
- `apps/web-ebacmap/src/modules/ez-protect/use-cases/GetEzProtectDashboard/route.int.ts`
- `apps/web-ebacmap/src/pages/api/ez-protect/dashboard.ts`
- `apps/web-ebacmap/src/services/ezProtect.ts`
- `apps/web-ebacmap/src/utils/ezProtect.ts`
- real dashboard behavior in `apps/web-ebacmap/src/pages/ez-protect/index.tsx`

## Immediate Engineering Goal

Verify and harden the landed monorepo slice. Do not spend another cycle re-porting code that is already in tree.

## What Passed

- `corepack pnpm --dir D:\projects\QDD\ebacmap-master exec tsc --noEmit --pretty false`
- direct `tsx` smoke of `EzProtectRepo.getDashboardSummary()` with expected fixture counts:
  - 1 day: `1`
  - 7 days: `3`
  - 14 days: `4`
  - 30 days: `6`
- focused unit lane:
  - `corepack pnpm --dir D:\projects\QDD\ebacmap-master exec jest --config apps/web-ebacmap/jest.ez-protect.unit.config.js --runInBand`
- focused integration lane:
  - `corepack pnpm --dir D:\projects\QDD\ebacmap-master exec jest --config apps/web-ebacmap/jest.ez-protect.integration.config.js --runInBand`

## What Is Still Blocked

No bounded EZ Protect feature blocker remains in the local monorepo lane.

What still applies:

- shared repo-wide Jest drift still exists outside the scoped EZ Protect configs
- rollout evidence and live `CHARM_EZ_PROTECT_*` proof are still separate blockers

## Exact First Commands

```powershell
git -C D:\projects\QDD\ebacmap-master status -sb
Get-Content D:\projects\QDD\ebacmap-master\apps\web-ebacmap\src\pages\ez-protect\index.tsx
Get-Content D:\projects\QDD\ebacmap-master\apps\web-ebacmap\src\pages\api\ez-protect\dashboard.ts
Get-Content D:\projects\QDD\ebacmap-master\apps\web-ebacmap\src\modules\ez-protect\repos\EzProtectRepo.ts
Get-Content D:\projects\QDD\ebacmap-master\apps\web-ebacmap\src\modules\ez-protect\use-cases\GetEzProtectDashboard\route.int.ts
Get-Content D:\projects\QDD\ebacmap-master\apps\web-ebacmap\src\modules\ez-protect\repos\EzProtectRepo.unit.ts
Get-Content D:\projects\QDD\ebacmap-master\apps\web-ebacmap\jest.ez-protect.integration.config.js
```

Then verify in this order:

```powershell
corepack pnpm --dir D:\projects\QDD\ebacmap-master exec tsc --noEmit --pretty false
corepack pnpm --dir D:\projects\QDD\ebacmap-master exec jest --config apps/web-ebacmap/jest.ez-protect.unit.config.js --runInBand
corepack pnpm --dir D:\projects\QDD\ebacmap-master exec jest --config apps/web-ebacmap/jest.ez-protect.integration.config.js --runInBand
```

After that, choose one bounded lane:

1. manual smoke for `/ez-protect` and `/api/ez-protect/dashboard`
2. rollout evidence / live provisioning follow-up

## Do Not Waste Time Here

- Do not port the old EZ Protect slice again.
- Do not continue new implementation work in `D:\projects\QDD\ebacmap`.
- Do not widen the scoped EZ Protect Jest config into a risky repo-wide alias patch without need.
- Do not reopen the queue-server SFTP slice unless Brian explicitly asks for it.
- Do not revert the dirty monorepo worktree.

## Separate Outstanding Blockers

These remain real but separate from the current coding lane:

- live `CHARM_EZ_PROTECT_*` provisioning proof
- live seed logs
- rollback notes
- live validation credentials or checklist

## Recovery Surfaces

This restart packet also exists in:

- `C:\Users\acer\Asolaria\reports\qdd-codex-restart-packet-latest.md`
- `C:\Users\acer\Asolaria\reports\notebooklm-core\qdd-codex-restart-packet.md`
- `D:\projects\QDD\ebacmap-master\apps\web-ebacmap\docs\codex-restart-packet-20260311.md`

Bridge note:

- `asolaria_bridge` thread `qdd-ez-protect-monorepo-20260311`

## One-Sentence Resume Instruction

Resume in the monorepo, keep the landed EZ Protect slice intact, use the passing scoped EZ Protect verification commands first, and spend the next cycle on manual smoke or rollout evidence rather than re-porting old-repo code.