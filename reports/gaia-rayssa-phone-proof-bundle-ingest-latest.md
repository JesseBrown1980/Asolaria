# Gaia Rayssa Phone Proof Bundle Ingest

Generated: 2026-03-23 16:07:36 -03:00

## Source

- ZIP: `C:\Users\acer\Downloads\gaia-rayssa-phone-proof-bundle-20260323-155948.zip`
- SHA-256: `38C8EBA8EB98308E9878BC84ED6C628FE74ECBA7FA8A53E18CE9C12B35BD8A45`
- Extracted files:
  - `reports/gaia-rayssa-phone-proof-bundle-latest.md`
  - `reports/phone-tunnel-smoke-20260323-155948.md`
  - `data/agent-index/LX-197.md`

## What This Bundle Resolves

This bundle resolves the contradiction preserved in `IX-294`.

Unlike the earlier compat packet, the fresh smoke file now agrees with the direct route-contract and ADB/reverse proof.

All three files in this bundle converge on the same Rayssa-host-only state:

- `GET /api/mobile/bootstrap` returns `200`
- bootstrap advertises `viewer=liris`
- `GET /api/mobile/session?channel=usb` returns `200`
- `GET /api/mobile/control/status?channel=usb` returns `200`
- `adb devices -l` shows both the USB serial `RQCX907KFTK` and the wireless endpoint `192.168.15.47:5555` as authorized devices
- `adb -s RQCX907KFTK reverse --list` shows `UsbFfs tcp:4781 tcp:4781`
- the fresh phone tunnel smoke report passes and reports `reverse tcp:4781 present: True`

## Naming And Scope

The packet keeps the Rayssa-host naming boundary explicit:

- scope: Rayssa host only
- default phone-side label: `liris/kuromi`
- do not use `falcon` as the default label for Rayssa's phone

## Minor Residual Detail

The smoke JSON still contains `hostVisiblePhoneCount: 0`.

That does not outweigh the explicit ADB facts in the same bundle:

- authorized device count is `2`
- USB-scoped authorized device count is `1`
- the selected USB device is `RQCX907KFTK`
- direct reverse proof is present for `tcp:4781`

So this field should be treated as a non-blocking telemetry detail unless a later failing probe points directly at it.

## Durable Read

1. The older Rayssa-host `/api/mobile/bootstrap = 404` packet remains superseded.
2. The stale smoke contradiction preserved in `IX-294` is now resolved by a fresh single-source proof bundle.
3. The current Rayssa-host phone compat lane should be treated as live and host-scoped under `liris/kuromi`.
4. Future disagreement should be compared only at the failing raw-proof layer, not by reopening older mixed packets.

## Operational Rule

Use this bundle as the current Rayssa-host phone proof authority.

Do not reopen the older `bootstrap 404` packet or the earlier stale-smoke contradiction unless fresh host-scoped proof forces it.
