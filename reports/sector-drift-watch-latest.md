# Sector Drift Watch - 2026-03-13 15:06:01 -03:00

## Mismatched Restart Instructions

- `C:\Users\acer\Asolaria\reports\qdd-codex-restart-packet-latest.md` still keeps `C:\Users\acer\Asolaria\reports\queue-server-sftp-troubleshooting-20260311.md` in `Read First`, still freezes the monorepo at `37f1a34d4a431a86d0c6864f7fa23ac03f8433f2`, and still frames the next QDD move as manual smoke or rollout evidence. Current repo head is already `7d188ae2cb86d6fec13bd16b9dd44914bfc82e08` (`fix(queue-server): SFTP import/export fixes and test coverage`), so the restart packet now understates landed work and overstates what remains.
- `C:\Users\acer\Asolaria\reports\qdd-monorepo-ez-protect-checkpoint-latest.md` is stale on the same old `37f1a34...` anchor and still says rollout evidence plus provisioning remain separate blockers. `C:\Users\acer\Asolaria\reports\qdd-ez-protect-rollout-evidence.md` now records green scoped verification and seeded browser smoke on 2026-03-13; the remaining open item is narrower owner-authenticated validation, not feature construction.
- `C:\Users\acer\Asolaria\TASKS.md` now conflicts with repo truth on the queue-server slice. It says the SFTP work is "done but still uncommitted" at 2026-03-13 11:06 -03:00, but the current monorepo `HEAD` is already the queue-server SFTP commit `7d188ae2c`.

## Stale Or Conflicting Source-Of-Truth Files

- `C:\Users\acer\Asolaria\reports\qdd-external-admin-handoff-latest.md` remains a secondary bootstrap note only. Keep it behind `C:\Users\acer\Asolaria\reports\qdd-codex-restart-packet-latest.md`, `C:\Users\acer\Asolaria\TASKS.md`, and live repo state.
- The earlier EZ Protect rollout-versus-permission conflict is now stale. `D:\projects\QDD\ebacmap-master\apps\web-ebacmap\src\utils\ezProtect.ts` makes `isEzProtectModuleEnabled()` permission-backed through `hasEzProtectEntitlement()`, and `C:\Users\acer\Asolaria\reports\qdd-ez-protect-rollout-evidence.md` records nav/page/API verification against the `EzProtect:view` contract.

## Overlapping Ownership

- QDD repo-writing authority remains `D:\projects\QDD\ebacmap-master`. Admin-terminal watch notes, relay packets, and secondary handoff documents must not redefine repo truth when `git log` and the monorepo tree disagree.
- The dirty monorepo worktree now spans admin, user, location, and shared-model files beyond the landed EZ Protect slice. Treat restart-packet cleanup as a controller documentation task, not a reason to revert or re-scope current repo edits.

## Completed Work Still Treated As Open

- The queue-server SFTP slice is still elevated in the QDD `Read First` path and still described in `C:\Users\acer\Asolaria\TASKS.md` as pending landing, even though it is already committed at `7d188ae2c`.
- The earlier EZ Protect access-contract blocker is cleared and should not remain in controller assumptions. The current open follow-up is owner-authenticated validation and provisioning proof, not permission-model redesign.

## Blocked Work Treated As Active Engineering

- The local Asolaria HTTP control plane on port `4781` is still wedged for read-only observation. On 2026-03-13, both `curl --max-time 8 http://127.0.0.1:4781/api/health/fast` and `/api/swarm/status` timed out with `0` bytes, while `netstat -ano` still shows `node.exe` PID `25140` listening on `0.0.0.0:4781` with multiple `ESTABLISHED` and `CLOSE_WAIT` connections. Treat runtime status as unreadable until the HTTP plane responds again.

## Sentinel Recommendations For Helm

- Refresh the QDD restart packet cluster (`C:\Users\acer\Asolaria\reports\qdd-codex-restart-packet-latest.md` and `C:\Users\acer\Asolaria\reports\qdd-monorepo-ez-protect-checkpoint-latest.md`) to the current branch reality: queue-server SFTP already committed, EZ Protect verification materially advanced, and only owner-authenticated validation still open.
- Correct `C:\Users\acer\Asolaria\TASKS.md` so the queue-server SFTP slice is no longer described as uncommitted.
- Remove the stale EZ Protect rollout/permission-conflict concern from watch assumptions. Keep the remaining EZ Protect follow-up bounded to owner-authenticated smoke and provisioning evidence.
- Treat port `4781` as a live watch blocker until the HTTP plane responds again.
