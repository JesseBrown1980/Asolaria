# Phone + Desktop Auth and Connectivity Upgrade

Generated: 2026-02-21 14:43:42 -03:00

## Launchers
- Desktop primary icon: C:\Users\acer\Desktop\Asolaria.lnk
- Desktop extra utility icon kept: C:\Users\acer\Desktop\Stop Asolaria (Admin).lnk
- Phone package: com.jessebrown.asolaria (native launcher app installed)

## Security Gates
- Desktop launch gate: tools/Require-Asolaria-DesktopAuth.ps1 (Windows Hello first, password fallback).
- Desktop launcher now routes through Start-Asolaria.cmd auth gate before one-button startup.
- Phone launch gate: biometric/device-credential prompt added in MainActivity before WebView load.
- UI evidence dump: C:\Users\acer\Asolaria\reports\asolaria-auth-ui.xml

## Connectivity Routing
- Current remote base URL: http://desktop-j99vcnh.tailb47e0e.ts.net:4782
- Channel preference/order: usb > vpn > private_internet > public_internet
- Tailnet proxy enabled and verified on :4782 via Start-Asolaria-OneButton.
- Public tunnel detected and reachable: https://gaming-assured-endif-grams.trycloudflare.com

## Route Smoke Tests
- usb: reports/phone-tunnel-smoke-20260221-144022.md
- vpn: reports/phone-tunnel-smoke-20260221-144023.md
- private_internet: reports/phone-tunnel-smoke-20260221-144024.md
- public_internet: reports/phone-tunnel-smoke-20260221-144025.md
- public tunnel channel check: reports/phone-tunnel-smoke-20260221-144228.md

## One-button startup validation
- reports/one-button-start-20260221-144307.md

## Notes
- Start-Asolaria-OneButton now preserves remoteBaseUrl (no blank overwrite).
- Start-Asolaria-Phone defaults now enable tailnet proxy and keep all channels available.
