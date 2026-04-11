---
name: rayssa-phone-compat-live-20260323
description: Rayssa host now serves the mobile compat contract on proxy_4781 with viewer=liris; the phone lane is live under the Liris/Kuromi surface and should not be default-labeled Falcon
type: project
---

## Rayssa Phone Compat Live

Date: 2026-03-23
Scope: Rayssa host only

## Verified State

- `C:\Users\rayss\Asolaria\src\gateway\compat4781.js` now serves the compat mobile contract on `127.0.0.1:4781`.
- `GET /api/mobile/bootstrap` returns `200` and advertises `viewer=liris`.
- `GET /api/mobile/session?channel=usb` returns `200` with session id `proxy_4781:liris:usb`.
- `GET /api/mobile/control/status?channel=usb` returns `200` and shows the compat control surface is healthy.
- `adb devices -l` shows one authorized USB device on Rayssa host.
- `adb reverse tcp:4781 tcp:4781` is active.
- `Asolaria/reports/phone-tunnel-smoke-latest.md` now passes.
- The phone keeper and tunnel monitor are running locally.

## Naming Boundary

- On Rayssa host, the phone-side sub-colony/mobile surface is `liris` (also called `kuromi`).
- `Falcon` remains a broader colony phone-lane design label, but it should not be used as the default name for Rayssa's phone or the Rayssa-host mobile surface.

## Clean Read

The older Rayssa-host blocker state in `LX-195` is historical now.

Rayssa host has moved past:
- missing bootstrap
- missing session/control contract
- missing ADB authorization

Current Rayssa-host truth is a live, host-scoped phone compat lane under the `liris/kuromi` identity.
