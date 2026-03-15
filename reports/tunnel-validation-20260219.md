# Tunnel Validation - 2026-02-19

## Scope
Validated current Asolaria private internet path using configured Tailscale remote base.

## Config Observed
- Remote base URL: `http://desktop-j99vcnh.tailb47e0e.ts.net:4782`
- Routing preference: `usb,vpn,private_internet`
- Remote auth required: `true`
- Encrypted remote required: `true`

## Desktop-side Validation (pass)
- `GET /api/mobile/bootstrap` returned remote mobile URLs using the tailnet base.
- `GET http://desktop-j99vcnh.tailb47e0e.ts.net:4782/api/health` returned `ok=true`.
- `GET http://desktop-j99vcnh.tailb47e0e.ts.net:4782/mobile-console.html?channel=vpn` returned HTTP `200`.
- Authenticated remote API checks passed:
  - `/api/mobile/session?channel=vpn` -> `ok=true`, selected channel `vpn`
  - `/api/mobile/control/status?channel=vpn` -> `ok=true`, keeper `running=true`

## Phone-side Network Checks (ADB shell)
- Tailnet DNS/ping from phone passes:
  - `desktop-j99vcnh.tailb47e0e.ts.net` -> `100.75.63.31`
  - ICMP reachable (`0% packet loss`)
- Android connectivity shows active Tailscale VPN network:
  - package: `com.tailscale.ipn`
  - VPN interface: `tun0`
  - tailnet route to desktop present in `dumpsys connectivity`

## Phone-side HTTP Probe Note
- A raw `toybox nc` HTTP probe from ADB shell to `desktop-j99vcnh.tailb47e0e.ts.net:4782` returned `502 Bad Gateway`.
- This appears to be a limitation/quirk of the raw `nc` probe path rather than network reachability (desktop-side HTTP pass + phone tailnet routing pass).

## Bridge Runtime State
- `adb reverse --list` includes `UsbFfs tcp:4781 tcp:4781`.
- Background keeper is running and preserving USB bridge.

## Next Verification (recommended)
- Confirm from phone browser/WebView client when convenient (without interrupting foreground gameplay):
  - open remote console URL with token + `channel=vpn`
  - run one refresh cycle and verify `session.connectionRouting.selected.channel = vpn`
