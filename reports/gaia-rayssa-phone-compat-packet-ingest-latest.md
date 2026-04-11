# Gaia Rayssa Phone Compat Packet Ingest

Generated: 2026-03-23 15:44:18 -03:00

## Source

- ZIP: `C:\Users\acer\Downloads\gaia-rayssa-phone-compat-packet-20260323.zip`
- Extracted files:
  - `reports/gaia-rayssa-phone-compat-packet-latest.md`
  - `data/agent-index/LX-196.md`
  - `memory/project_rayssa_phone_compat_live_20260323.md`
  - `reports/phone-tunnel-smoke-latest.md`

## What The Packet Changes

This packet supersedes the older Rayssa-host claim that `/api/mobile/bootstrap` is still `404`.

Three files in the bundle agree on the newer route-contract state:

- `reports/gaia-rayssa-phone-compat-packet-latest.md`
- `data/agent-index/LX-196.md`
- `memory/project_rayssa_phone_compat_live_20260323.md`

They all assert:

- `proxy_4781` serves `GET /api/mobile/bootstrap` with `200`
- bootstrap advertises `viewer=liris`
- `GET /api/mobile/session` returns `200`
- `GET /api/mobile/control/status` returns `200`
- the correct Rayssa-host phone-side label is `liris/kuromi`, not `falcon`

## Contradiction Inside The Packet

The bundled `reports/phone-tunnel-smoke-latest.md` does not match the newer state on every point.

It reports:

- `pass: True`
- remote checks healthy
- `/api/mobile/session` and `/api/mobile/control/status` true

But its ADB subsection still says:

- `authorized devices: 0`
- `reverse tcp:4781 present: False`
- “ADB interface is not active or not authorized yet”

So this ZIP contains a mixed state:

- the compat route contract looks advanced and live
- the bundled smoke file appears stale on at least part of the ADB/reverse evidence

## Durable Read

The safe memory/index update is:

1. The older Rayssa-host `bootstrap 404` claim is no longer current.
2. The Rayssa-host compat surface should now be treated as serving the mobile bootstrap/session/control contract under `liris/kuromi`.
3. The naming correction is durable:
   - `Liris` / `Kuromi` is the Rayssa sub-colony identity
   - `Falcon` is not the default label for Rayssa's phone
4. The ADB/reverse subsection in this bundle is internally inconsistent and should be treated as needing fresh single-source confirmation if it becomes operationally important.

## Operational Rule

Use this packet to replace the old Rayssa-host `404` bootstrap reading.

Do not use the bundled smoke file by itself as the final authority on ADB/reverse state, because the packet itself shows that part is lagging behind the newer compat-lane summary.
