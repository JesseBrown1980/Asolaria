# Gaia Rayssa Phone Reauthorized Packet Ingest

- Ingested: `2026-03-23 17:45:51 -03:00`
- Source ZIP: `C:\Users\acer\Downloads\gaia-rayssa-phone-reauthorized-packet-20260323-173105.zip`
- SHA-256: `39AF385835E4EBD28223BA51CED53B7E8EBCAEE87001DFD99C05D96C129700FB`
- Extracted under: `C:\Users\acer\tmp\downloads\gaia-rayssa-phone-reauthorized-packet-20260323-173105`

## Classification

This is a narrow host-scoped recovery packet.

It refreshes live Rayssa phone authorization state. It does not alter the compute boundary already locked in `IX-300`.

## Current Accepted Proof

- `adb devices -l` shows both the USB serial and the wireless endpoint as authorized
  - USB serial: `RQCX907KFTK`
  - wireless endpoint: `192.168.15.47:5555`
- USB reverse is present for `tcp:4781`
- `GET /api/mobile/bootstrap` is healthy and advertises `viewer=liris`
- `GET /api/mobile/session?channel=usb` returns `200`
- `GET /api/mobile/control/status?channel=usb` returns `200`
- fresh phone tunnel smoke passes

Fresh smoke summary preserved from the packet:

- `ok=true`
- `effectiveChannel=usb`
- `authorizedCount=2`
- `usbAuthorizedCount=1`
- `selectedDevice=RQCX907KFTK`
- `reversePresent=true`

## Durable Boundary

Promote only this host-scoped update:

- the Rayssa-host USB phone lane is re-authorized and healthy again
- the default phone-side label remains `liris/kuromi`, not `falcon`
- this packet is recovery proof only
- this packet does not change `IX-300`

## Use Rule

- keep using the current Rayssa phone lane as live under `liris/kuromi`
- if a future phone failure appears, compare it against this packet at the failing probe layer
- do not let phone reauthorization proof expand into claims about `computeWorkerReady` or cross-host compute
