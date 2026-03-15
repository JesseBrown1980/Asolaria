# Phone Full System Scan + Launch/Connectivity Validation

Generated: 2026-02-21T14:00:41-03:00

## Scope
- Phone launcher presence and function
- In-app launch button validation
- Connectivity checks: Wi-Fi, Tailscale (VPN), cellular/public fallback readiness
- Desktop launcher/routing checks
- Secure-folder/old-artifact cleanup status

## Launcher + App Status
- Native app package installed: `com.jessebrown.asolaria`
- APK source: `C:\Users\acer\Asolaria-Android\AsolariaCompanion\app\build\outputs\apk\debug\app-debug.apk`
- Launchable activity: `com.jessebrown.asolaria/.MainActivity`
- Visual evidence:
  - `C:\Users\acer\Asolaria\reports\phone-launcher-open.png`
  - `C:\Users\acer\Asolaria\reports\phone-after-permission.png`
  - `C:\Users\acer\Asolaria\reports\phone-after-permission.xml`

## In-App "Signal Open Asolaria" Button Test
- Cleanup before test: tracked windows closed (`/api/mobile/ui/cleanup`)
- Button tap executed from phone app UI automation (`signalOpenAsolariaBtn`)
- Result:
  - Pre matching Asolaria windows: `1`
  - Post matching Asolaria windows: `2`
  - Post active window: `127.0.0.1_/`
- Conclusion: launch signal flow is functional.

## Connectivity Validation
- Wi-Fi/private network check: PASS
  - Script: `tools/Test-Asolaria-PhoneTunnelPath.ps1 -Channel private_internet`
  - Report: `C:\Users\acer\Asolaria\reports\phone-tunnel-smoke-20260221-134439.md`
  - Remote base: `https://192.168.1.7:5443`

- Tailscale/VPN check: PASS
  - Recovery action: `tailscale switch 4e8e` (fixed prior `NoState` condition)
  - Tailscale IP: `100.75.63.31`
  - Tailnet DNS: `desktop-j99vcnh.tailb47e0e.ts.net`
  - Proxy configured by `tools/Start-Asolaria-Phone.ps1` on `:4782`
  - VPN smoke report: `C:\Users\acer\Asolaria\reports\phone-tunnel-smoke-20260221-135522.md`
  - Remote base updated to: `http://desktop-j99vcnh.tailb47e0e.ts.net:4782`

- Cellular/public-internet fallback check: NOT READY
  - No validated public tunnel endpoint was available in this run.
  - Public fallback automation remains an active fix item (see relay task thread below).

## Antenna-Only Validation (No Wi-Fi)
- Temporary test setup:
  - Disabled phone Wi-Fi (`adb shell svc wifi disable`)
  - Enabled mobile data (`adb shell svc data enable`)
  - Temporarily set remote base to `https://192.168.1.7:5443` for direct private-LAN check
- Result:
  - Cellular internet was available.
  - Private LAN host route was unreachable from antenna-only path.
  - Smoke check failed as expected for non-tunnel direct private host.
  - Smoke report: `C:\Users\acer\Asolaria\reports\phone-tunnel-smoke-20260221-140201.md`
- Restored state:
  - Wi-Fi re-enabled
  - Remote base restored to tailscale route: `http://desktop-j99vcnh.tailb47e0e.ts.net:4782`

## Desktop Launcher / Routing Status
- Confirmed desktop shortcuts:
  - `C:\Users\acer\Desktop\Asolaria (Admin).lnk`
  - `C:\Users\acer\Desktop\Asolaria Control Plane (Admin).lnk`
  - `C:\Users\acer\Desktop\Asolaria Control Plane + Sandbox (Admin).lnk`
- Main launcher target:
  - `C:\Users\acer\Asolaria\Start-Asolaria-OneButton.cmd`

## Secure Folder + Data Hygiene
- Secure Folder package present: `com.samsung.knox.securefolder`
- Android users present: only `UserInfo{0:Owner}` (no additional active user profile visible)
- Shared-storage debug artifacts in `/storage/emulated/0` were cleaned (test XML/PNG leftovers removed)
- Post-cleanup quick check for common debug file patterns at storage root: `0` remaining

## Relay Trigger to Asolaria
- Bridge restarted and healthy locally (`127.0.0.1:8788`)
- Task packet sent to collaboration room:
  - Message ID: `5454`
  - Thread: `phone-fix-20260221`
  - Target: `@other-codex`
- Requested next fixes:
  - public/cellular fallback routing
  - one-button auto-recovery for tailscale `NoState`
  - strict window/tab/process cleanup discipline
  - post-fix visual audit rerun with report paths

## Final Active URLs (One-Button)
- USB: `http://127.0.0.1:4781/mobile-console.html?token=...`
- VPN/Tailscale: `http://desktop-j99vcnh.tailb47e0e.ts.net:4782/mobile-console.html?token=...&channel=vpn`
- One-button report: `C:\Users\acer\Asolaria\reports\one-button-start-20260221-140256.md`

## Open Risk
- Public cellular route is still the remaining connectivity gap for true USB-off + Wi-Fi-off operation.
