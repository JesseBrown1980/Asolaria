# Phone Reconnect Scan (2026-02-19)

## Scope
- Device connectivity and OS baseline over ADB
- Asolaria mobile API/auth path validation
- Phone package/runtime state for Asolaria, Termux, F-Droid, Tailscale
- USB bridge and in-app WebView reachability checks

## Device Baseline
- Device: `SM-S721U1` (Samsung)
- Serial: `R5CXA4MGQXV`
- Android: `16` (SDK `36`)
- Security patch: `2026-01-01`
- Verified boot: `green`
- Build type: `user`

## Installed Components (user 0)
- `com.jessebrown.asolaria` `0.1.0`
- `com.termux` `0.118.3`
- `org.fdroid.fdroid` `1.23.1`
- `com.tailscale.ipn` `1.94.1-t62c6f1cd7-g90f47bbf5`
- `com.maazm7d.termuxhub` `3.2.4`

## Profile/User Notes
- Users present: `0 (Owner)`, `95 (DUAL_APP)`, `150 (Secure Folder)`.
- User 95 has cloned installs of:
  - `com.jessebrown.asolaria`
  - `com.termux`
- `adb shell` cannot query user 150 package list (expected security restriction).

## Asolaria API Scan
- Asolaria health endpoint is live at `http://127.0.0.1:4781/api/health`.
- Mobile auth requires `x-asolaria-mobile-token` or `x-asolaria-token` header (not bearer auth).
- Token-protected endpoints returned healthy responses:
  - `/api/mobile/session`
  - `/api/mobile/control/status`
  - `/api/mobile/control/diagnostics`
  - `/api/mobile/screen/status`
  - `/api/mobile/screen/displays`
  - `/api/mobile/windows`
  - `/api/mobile/approvals`
  - `/api/mobile/push/status`

## Root Cause Found
- The USB reverse tunnel was missing (`adb reverse --list` empty).
- In-app Asolaria WebView logs showed failed fetch to `http://127.0.0.1:4781/...` when reverse mapping was absent.

## Immediate Fix Applied
- Executed:
  - `adb reverse tcp:4781 tcp:4781`
- Verified:
  - `adb reverse --list` now includes `tcp:4781 tcp:4781`
- After applying reverse, the same app launch no longer showed WebView fetch failures.

## Termux State
- `allow-external-apps = true` is set in `~/.termux/termux.properties`.
- `com.termux.permission.RUN_COMMAND` is granted to Asolaria app.
- Current package footprint is minimal after security clean:
  - Present: `openssh`, `curl`, `git`
  - Missing (for prior richer connector workflow): `nodejs`, `python`, `termux-api`, `jq`, `tmux`

## Tailscale State
- App installed, but no active tailscale process/network evidence during this scan.
- VPN traffic appears to be from other VPN tooling at scan time, not Tailscale.

## Cleanup/Rebuild Recommendations
1. Keep USB baseline stable:
   - Always start via `Start-Asolaria-Phone` (admin) or manually run `adb reverse tcp:4781 tcp:4781`.
2. Rebuild Termux runtime:
   - `pkg update && pkg upgrade`
   - `pkg install nodejs-lts python termux-api jq tmux`
   - Install Termux:API companion app if absent.
3. Decide legacy cleanup:
   - `com.maazm7d.termuxhub` appears legacy for current Asolaria path; remove only if no longer needed.
4. Restore private internet mode:
   - Re-login Tailscale and verify tailnet route before relying on private-internet channel.
5. Avoid profile confusion:
   - Use the Owner-profile Asolaria/Termux apps (not Dual App clones) for primary integration.

## Notebook Capture
- Saved notebook note:
  - ID: `note_1771528289639_oo3q3i`
  - Title: `Phone reconnect scan - USB/Termux/Tailscale (2026-02-19)`
