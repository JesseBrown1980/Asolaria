# Phone Closeout Pack

Generated: 2026-03-11
Thread: `shutdown-continuation-20260308-1208`

Evidence used for this pack:
- `reports/phone-tunnel-smoke-latest.md` and `reports/phone-tunnel-smoke-falcon-20260311-rerun.md`
- `reports/mobile-push-approvals-validation-20260224T191659.md`
- `TASKS.md` entries dated 2026-02-22 through 2026-03-08
- Live local checks run on 2026-03-11: `adb devices`, keeper PID check, `phoneProMirrorConnector.getPhoneProMirrorStatus()`, sanitized phone UI status extraction

## 1) Current diagnostics summary

### Pass/Fail matrix

| Area | State | Evidence | Closeout meaning |
|---|---|---|---|
| Push subscriptions | FAIL | Current sanitized phone UI shows `Push: server-ready | subscriptions=0 | permission=unsupported | native=ready`. Last full API validation also showed `enabled=true`, `reason=ready:vault`, `subscriptions=0`, and push test reason `no_mobile_subscriptions`. | Server side is ready; phone/browser is still not subscribed for alert delivery. |
| Approvals path | PARTIAL | Last full validation passed `deny`, `approve`, and `approve+run`; expected `manual_retry` behavior was returned for non-chat approve+run. Current sanitized phone UI shows `pending=0`, `guardian=off`, `approvals=smart/pay_priority`, `path=usb`, `push=on`, `control=off`. | API logic is working, but physical phone tap-through still needs fresh final confirmation. |
| Tunnel smoke | PARTIAL | Latest 2026-03-11 rerun: `mobile-console.html status=200`, `/api/mobile/session=True (route=usb)`, `/api/mobile/control/status=True`, keeper running, ping ok, authorized devices `1`, reverse `tcp:4781=True`; overall report still `pass=False` because local/remote `/api/health` probes timed out or returned HTTP status `0`. | Transport is mostly present; health probe noise is the remaining automation-side uncertainty. |
| Mirror / pro-mirror | PARTIAL | Live connector status: `scrcpyFound=true`, `adbFound=true`, device list contains the authorized phone, but `running=false` and `phone-pro-mirror.pid` is absent. | Pro mirror is available to start, but it is not active right now. This is not the main blocker. |
| Authorized device state | PASS | Live `adb devices` shows `R5CXA4MGQXV device`. Latest smoke report shows `authorized devices=1` and `reverse tcp:4781 present=True`. Keeper PID `16888` is running. | USB bridge and device authorization are healthy. |

### Diagnostics summary by topic

- Push subscriptions: the blocker is still on the phone/browser side, not the server. Backend readiness exists, but there is still no active subscription.
- Approvals path: server behavior is already validated. Deny, approve, and approve+run semantics are known-good, with non-chat approve+run correctly requiring a manual retry of the original action.
- Tunnel smoke: the tunnel is usable enough to reach mobile console and mobile session/control over USB-backed routing, but the smoke report still fails because the health probe path is noisy.
- Mirror / pro-mirror: the standard phone lane is available; pro-mirror is installed and discoverable but idle.
- Authorized device state: there is one authorized device and the reverse bridge is present, so the shutdown continuation is no longer blocked by ADB authorization.

## 2) Automatable fixes done now vs manual phone actions required

### Done now

- Reconfirmed the live authorized USB device state with `adb devices`.
- Reconfirmed the phone background keeper is running (`PID 16888`).
- Reconfirmed pro-mirror is available locally (`scrcpy 3.3.4` found) and currently inactive rather than broken.
- Reconfirmed the latest tunnel-smoke evidence still shows session/control working even though `/api/health` remains noisy.
- Reconfirmed the current phone UI status without exposing the mobile token.
- Produced this closeout pack with a fresh pass/fail matrix.

### Already automated and in place from earlier runs

- Private/USB phone routing hardening is already in place.
- Mobile approvals API behavior was already validated end to end.
- Push backend readiness was already validated end to end.
- USB reverse bridge maintenance is already handled by the running keeper.

### Manual phone actions still required

- Open the Asolaria mobile console in Chrome or the installed PWA on the phone.
- Tap `Enable Push` and grant the browser/app notification permission if prompted.
- Remove battery/background restrictions for the browser or app used for the mobile console.
- Tap `Test Push` and confirm an actual alert arrives while the phone screen is off.
- Generate one real pending approval and confirm the phone can open it and complete `deny`, `approve`, and `approve+run`.
- After `approve+run` on a non-chat action, retry the original action once; the earlier validation shows that retry is expected.
- If remote/private URL access is part of the shutdown closeout, open the remote mobile-console URL on the phone and confirm the page loads and refresh works from the phone itself.

## 3) One-pass user checklist

1. Connect the phone over USB, unlock it, and confirm it stays authorized.
2. Open Asolaria Mobile Console on the phone in Chrome/PWA.
3. Tap `Enable Push`; accept notification permission.
4. Exempt the browser/app from battery optimization and background sleep.
5. Tap `Test Push`; verify a visible notification with the screen off.
6. Open `Approval Center`; trigger one test approval.
7. Tap `Deny` on the first test and confirm the decision lands.
8. Trigger a second approval; tap `Approve` and confirm it lands.
9. Trigger a third approval; tap `Approve+Run`, then retry the original action once if the phone shows manual-retry behavior.
10. Refresh the mobile console and verify push is still on, pending approvals return to zero, and path remains USB/private.
11. If remote access is required, open the remote mobile console URL on the phone and confirm it loads without relying on the desktop browser.

## 4) Re-test commands and expected pass criteria

### ADB authorization

```powershell
& 'C:\Users\acer\AppData\Local\Microsoft\WinGet\Packages\Google.PlatformTools_Microsoft.Winget.Source_8wekyb3d8bbwe\platform-tools\adb.exe' devices
```

Expected pass criteria:
- The phone serial appears once.
- The state is `device`, not `unauthorized` or `offline`.

### Tunnel smoke

```powershell
Set-Location C:\Users\acer\Asolaria
powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\Test-Asolaria-PhoneTunnelPath.ps1 `
  -BaseUrl http://127.0.0.1:4781 `
  -ReportPath reports\phone-tunnel-smoke-closeout-rerun.md `
  -AllowInsecureRemoteTls $true
```

Expected pass criteria:
- `mobile-console.html status: 200`
- `/api/mobile/session: True`
- `/api/mobile/control/status: True`
- `authorized devices: 1`
- `reverse tcp:4781 present: True`
- Preferred final state: report summary `pass: True`
- If summary remains `False`, the only acceptable remaining failure is the `/api/health` probe while session/control and phone page load still pass

### Pro-mirror availability

```powershell
node -e "const x=require('C:/Users/acer/Asolaria/src/connectors/phoneProMirrorConnector.js'); console.log(JSON.stringify(x.getPhoneProMirrorStatus(), null, 2));"
```

Expected pass criteria:
- `scrcpyFound: true`
- `adbFound: true`
- `devices` contains the authorized phone
- `running` may remain `false` unless you intentionally start pro-mirror

### Sanitized phone UI status re-check

```powershell
[xml]$xml = Get-Content -Raw C:\Users\acer\Asolaria\captures\asolaria-after-signal.xml
$push = Select-Xml -Xml $xml -XPath "//*[@resource-id='pushStatus']" | Select-Object -First 1
$global = Select-Xml -Xml $xml -XPath "//*[@resource-id='globalStatus']" | Select-Object -First 1
[pscustomobject]@{ pushStatus = $push.Node.text; globalStatus = $global.Node.text } | ConvertTo-Json -Depth 4
```

Expected pass criteria after manual phone steps:
- `pushStatus` no longer shows `subscriptions=0`
- `globalStatus` still shows `Connected`
- `pending=0` after approval tests are finished
- `path=usb` or the intended private route remains visible

## Closeout judgment

This lane is no longer blocked by device authorization, reverse bridge, or missing mirror tooling. The remaining shutdown closeout is primarily a phone-side completion task:
- create at least one real push subscription,
- prove a screen-off push arrives,
- perform one fresh phone tap-through of the approval flow,
- optionally confirm the remote/private mobile-console page directly on the phone.
