# Upgrade Blocker Checkpoint (2026-03-02 01:37 -03:00)

## Listener rotation validation
- `netstat -ano | findstr :4781` shows listener PID `5420` on `0.0.0.0:4781`.
- `Get-CimInstance Win32_Process -Filter "ProcessId = 5420"` shows command line:
  - `"C:\nvm4w\nodejs\node.exe" "C:\Users\acer\Asolaria\server.js"`
- `/api/health` returns `ok=true` with `networkPolicy.http.port=4781` and queue healthy (`queued=0`, `running=1`).
- Prior protected PID `17048` is no longer bound to port `4781`.

## Ollie/John relay + AnyDesk note
- Sent relay message `22011` in room `asolaria_bridge`, thread `owner-ollie-john-upgrade-20260302`:
  - Notified that AnyDesk path is not working and requested John-side upgrade continuation + online acknowledgment.
- Sent lane activation message `22012` for Rook/Forge/Falcon.
- Sent explicit supervisor task in same thread (`22015`, `22056`).
- No `@Oli`/`@john` reply observed in-thread through message `22080`.

## Agent/robot recovery actions
- Restarted night-ops monitors via `recover-night-ops.ps1`; fresh monitor notes posted:
  - `22013` (`john-build-008`)
  - `22014` (`john-build-009`)
- Restarted bridge stack (`bridgectl restart` then `bridgectl start`), restoring lane bots online:
  - `this-codex-bot` pid `10580`
  - `other-codex-bot` pid `3756`
  - `build-codex-bot` pid `9440`
  - `phone-codex-bot` pid `12756`
  - `watchdog` pid `15092`
- Watchdog startup events posted (`22016`..`22037`) confirming lane identities and heartbeat messages.

## Current blockers observed in this pass
- Relay tunnel health check from `bridgectl status` currently reports Cloudflare `530` for `https://course-vegetable-student-output.trycloudflare.com`.
- Worker lanes are online but still emitting readiness loops in prior threads; no direct `@Oli`/`@john` acknowledgment yet.
