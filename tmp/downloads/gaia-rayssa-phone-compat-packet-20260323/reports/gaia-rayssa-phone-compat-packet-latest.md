# Rayssa Host Phone Compat Packet

Date: 2026-03-23
Scope: Rayssa host only

## Exact Index Wording

- Sub-colony: Liris is the Rayssa sub-colony identity, also called Kuromi.
- Liris bridge: on Rayssa host, the phone-side mobile and bridge surface defaults to liris.
- Falcon boundary: Falcon may exist as a broader colony phone-lane role in design language, but it is not the correct default label for Rayssa's phone.

## Live Rayssa-Host Gate

- proxy_4781 now serves `/api/mobile/bootstrap` with `200`
- bootstrap advertises `viewer=liris`
- `/api/mobile/session` and `/api/mobile/control/status` return `200`
- adb is authorized
- `adb reverse tcp:4781 tcp:4781` is present
- phone tunnel smoke is `pass`

## Use Rule

- Do not keep using the older Rayssa-host packet that says `/api/mobile/bootstrap` is `404`.
- Treat the current Rayssa-host phone compat lane as live and host-scoped under `liris/kuromi`.

## Included Support Files

- `data/agent-index/LX-196.md`
- `.claude/projects/C--Users-rayss/memory/project_rayssa_phone_compat_live_20260323.md`
- `reports/phone-tunnel-smoke-latest.md`
