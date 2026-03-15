# Sector Drift Watch - 2026-03-11 20:04:47 -03:00

## Mismatched Restart Instructions

- `C:\Users\acer\Asolaria\reports\qdd-codex-restart-packet-latest.md` still includes `C:\Users\acer\Asolaria\reports\queue-server-sftp-troubleshooting-20260311.md` in `Read First` even though the queue-server SFTP slice is already completed and indexed.
- `C:\Users\acer\Asolaria\reports\codex-state-freeze-latest.md` still presents `mobile-console` follow-up and queue-server helper/test continuation as next pickup steps. For `Helm`, those are stale controller resume steps.

## Stale Or Conflicting Source-Of-Truth Files

- `C:\Users\acer\Asolaria\reports\helm-controller-packet-latest.md` and `C:\Users\acer\Asolaria\reports\qdd-codex-restart-packet-latest.md` agree that the primary lane is EZ Protect porting in `D:\projects\QDD\ebacmap-master`.
- `C:\Users\acer\Asolaria\reports\codex-state-freeze-latest.md` is still useful for runtime evidence, phone state, and Abacus packet history, but it should not be treated as the controller's current next-step source of truth.

## Overlapping Ownership

- Abacus packet opens and smoke traces can look like active engineering, but repo-writing authority remains the local QDD monorepo lane. Abacus is still a bounded external worker lane.
- The `mobile-console` defect is a real watch sector, but if it re-enters active implementation without an explicit pause or delegation on QDD, it would overlap the controller's primary lane.

## Completed Work Still Treated As Open

- The queue-server SFTP troubleshooting slice is marked completed in `C:\Users\acer\Asolaria\reports\helm-controller-packet-latest.md` and `C:\Users\acer\Asolaria\reports\qdd-codex-restart-packet-latest.md`, but at least one restart packet still elevates it into the read-first path.

## Blocked Work Treated As Active Engineering

- All checked pending Abacus packet `response.md` files still contain `_Pending response from Abacus._`, so those packets should not be treated as delivered analysis yet.
- The Abacus packet-open path bug is patched locally in `C:\Users\acer\Asolaria\src\connectors\abacusConnector.js`, but the live Asolaria server has not been reloaded yet. Until reload plus `scan` shows real content, Abacus packet work is still blocked/observer state rather than active engineering progress.

## Sentinel Recommendations For Helm

- Demote `C:\Users\acer\Asolaria\reports\queue-server-sftp-troubleshooting-20260311.md` from `Read First` to reference-only in the QDD restart packet.
- Treat `C:\Users\acer\Asolaria\reports\helm-controller-packet-latest.md` plus `C:\Users\acer\Asolaria\reports\qdd-codex-restart-packet-latest.md` as the current controller truth for engineering priority.
- Keep `mobile-console` in watch status unless QDD is explicitly paused or delegated.
- Treat Abacus as a bounded helper lane until the server reload happens and packet `scan` returns a non-placeholder response.
