# Liris Next-Phase Startup Order

- Generated: `2026-03-22 23:05 -03:00`
- Relay target: `Liris` / Rayssa machine
- Current return lane: manual owner relay only

## Why This Order Exists

- The friend bridge room `asolaria-friend-rayss` is still staged pack material, not a live registered room on this host.
- `4799` remains a dead/unaudited side channel and must not be used.
- The safest next move is bounded local Asolaria startup on the Rayssa machine, followed by manual report-back to Jesse.

## Exact Liris Order

1. Open PowerShell in `C:\Users\rayss\Asolaria`
2. Run exactly:
   - `pwd`
   - `dir`
   - `git branch --show-current`
   - `git rev-parse --short HEAD`
   - `git status --short`
   - `node --version`
   - `npm --version`
   - `codex --version`
3. Install local deps if needed:
   - `npm install`
   - If this fails, stop and report the exact error.
4. Start bounded local runtime in that same shell:
   - `$env:ASOLARIA_STARTUP_AUTORUN='false'`
   - `$env:ASOLARIA_HTTPS_ENABLE='false'`
   - `$env:ASOLARIA_MQTT_BIND_HOST='0.0.0.0'`
   - `npm start`
5. If startup says port is already in use:
   - `netstat -ano | findstr :4781`
   - report the PID; do not kill anything yet
6. Verify in a second PowerShell:
   - `Invoke-RestMethod http://127.0.0.1:4781/api/health/fast`
   - `Test-NetConnection 127.0.0.1 -Port 18883`
7. Write:
   - `C:\Users\rayss\Asolaria\reports\asolaria-next-phase-startup-20260322.md`
8. Required contents of that report:
   - branch
   - commit
   - node/npm/codex versions
   - `npm install` result
   - exact health JSON
   - MQTT port result
   - any blocking error
9. Return results through manual owner relay only:
   - WhatsApp or direct owner relay to Jesse
   - do not use `4799`
   - do not attempt the friend bridge until Jesse explicitly says the room/policy is live

## Failure Rule

- If `C:\Users\rayss\Asolaria` or `package.json` is missing, stop and report exactly what exists instead.

## Local Packetization

- Appended to `runtime/outbound-liris-inbox.ndjson` as `gaia_liris_next_phase_startup_20260322`
- This packet should still be manually relayed by Jesse because the live friend bridge path is not yet authoritative
