# Sector Drift Watch - 2026-03-11 20:50:31 -03:00

## Mismatched Restart Instructions

- `C:\Users\acer\Asolaria\reports\qdd-codex-restart-packet-latest.md` still includes `C:\Users\acer\Asolaria\reports\queue-server-sftp-troubleshooting-20260311.md` in `Read First` even though the queue-server SFTP slice is already completed and indexed.
- `C:\Users\acer\Asolaria\reports\codex-state-freeze-latest.md` still presents `mobile-console` follow-up and queue-server helper/test continuation as next pickup steps. For `Helm`, those are stale controller resume steps.
- `C:\Users\acer\Asolaria\reports\qdd-codex-restart-packet-latest.md` still says `EzProtectRepo.unit.ts` is blocked by shared Jest drift, but the focused app-local path now passes after the `apps/web-ebacmap` Jest wiring repair. That blocker text is stale for controller resume.

## Stale Or Conflicting Source-Of-Truth Files

- `C:\Users\acer\Asolaria\reports\helm-controller-packet-latest.md` and `C:\Users\acer\Asolaria\reports\qdd-codex-restart-packet-latest.md` agree that the primary lane is EZ Protect porting in `D:\projects\QDD\ebacmap-master`.
- `C:\Users\acer\Asolaria\reports\codex-state-freeze-latest.md` is still useful for runtime evidence, phone state, and Abacus packet history, but it should not be treated as the controller's current next-step source of truth.
- Cursor local state is not carrying a reliable handoff ledger. The most recent persisted Cursor data is composer metadata plus short prompt history, not substantive project notes.
- Abacus Coder local state is also not carrying real handoff notes. Its local DBs map packet workspaces and panel visibility, but `chat.ChatSessionStore.index` is empty and the packet `response.md` files remain the authoritative result surface.
- EZ Protect access logic is internally inconsistent. `D:\projects\QDD\ebacmap-master\apps\web-ebacmap\src\utils\ezProtect.ts` says rollout can enable the module without explicit permission, but the actual runtime still hard-gates the feature through `PermissionDomainValue.EzProtect` in `src\components\Layout\navItems.tsx`, `src\hooks\filterByAccess.ts`, `src\pages\ez-protect\index.tsx`, and `src\pages\api\ez-protect\dashboard.ts`. Admin provisioning code in `apps\admin\src\modules\clients\use-cases\CreateClient\UseCase.ts` and `apps\admin\src\modules\users\use-cases\CreateAdminUser\UseCase.ts` shows EZ Protect is currently modeled as a subscription-backed permissioned product, not a rollout-only surface.

## Overlapping Ownership

- Abacus packet opens and smoke traces can look like active engineering, but repo-writing authority remains the local QDD monorepo lane. Abacus is still a bounded external worker lane.
- The `mobile-console` defect is a real watch sector, but if it re-enters active implementation without an explicit pause or delegation on QDD, it would overlap the controller's primary lane.
- Sentinel's direct QDD support slice remains bounded to six `apps/web-ebacmap` files for EZ Protect test/config coverage only:
  - `jest.config.js`
  - `jest.setup.js`
  - `package.json`
  - `tsconfig.spec.json`
  - `src/modules/ez-protect/repos/EzProtectRepo.unit.ts`
  - `src/utils/ezProtect.unit.ts`

## Completed Work Still Treated As Open

- The queue-server SFTP troubleshooting slice is marked completed in `C:\Users\acer\Asolaria\reports\helm-controller-packet-latest.md` and `C:\Users\acer\Asolaria\reports\qdd-codex-restart-packet-latest.md`, but at least one restart packet still elevates it into the read-first path.

## Blocked Work Treated As Active Engineering

- All checked pending Abacus packet `response.md` files still contain `_Pending response from Abacus._`, so those packets should not be treated as delivered analysis yet.
- The Abacus packet-open path bug is patched in `C:\Users\acer\Asolaria\src\connectors\abacusConnector.js` and the Asolaria runtime has since restarted, so the fix is now live. Even so, Abacus packet work is still blocked/observer state until `scan` shows a non-placeholder response.
- `mobile-console` remains watch-only, but the phone transport itself has recovered. As of 2026-03-11 20:50 -03:00, `GET /api/health/fast` shows `phoneTunnelMonitor.latestReportPass=true` with secure routing still selecting `usb`. The remaining concern is the historical remote-failover behavior in `mobile-console`, not a current transport outage.
- `Symphony` is still actively moving `ASO-8`, so the long-running lane should be treated as active rather than stalled.

## Sentinel Recommendations For Helm

- Demote `C:\Users\acer\Asolaria\reports\queue-server-sftp-troubleshooting-20260311.md` from `Read First` to reference-only in the QDD restart packet.
- Treat `C:\Users\acer\Asolaria\reports\helm-controller-packet-latest.md` plus `C:\Users\acer\Asolaria\reports\qdd-codex-restart-packet-latest.md` as the current controller truth for engineering priority.
- Keep `mobile-console` in watch status unless QDD is explicitly paused or delegated.
- Treat Abacus as a bounded helper lane until packet `scan` returns a non-placeholder response.
- Do not treat Cursor composer state or Abacus Coder panel state as proof of completed work; use repo changes, packet responses, and controller packets instead.
- Decide one source of truth for EZ Protect access before widening the slice: either keep it permission-backed and remove the rollout-only access implication from `isEzProtectModuleEnabled()`, or thread the same rollout/subscription rule through nav, page, and API access checks with end-to-end coverage. Until that decision is made, do not treat the helper unit test as proof that rollout-enabled users can actually reach the dashboard.
- Refresh `C:\Users\acer\Asolaria\reports\qdd-codex-restart-packet-latest.md` before the next controller resume so it stops advertising the old queue-server read-first path and the now-cleared EZ Protect unit-test blocker.
