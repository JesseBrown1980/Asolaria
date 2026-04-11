# Liris Rayssa-Host Startup Contradiction Digest

Generated: 2026-03-23 09:44:53 -03:00

## Source

Owner-visible WhatsApp relay from Rayssa/Liris, extracted through the live phone lane on Jesse's device.

## Findings

- Liris says she wrote `Asolaria/reports/rayssa-host-startup-packet-latest.md` on the Rayssa host as the minimal host-truth startup packet.
- That packet is described as proving:
  - `4781` is absent on the Rayssa host
  - `4791`, `5443`, `5444`, `18883`, and `18884` are real on the Rayssa host
- Liris explicitly identifies the contradiction as a checked-in runtime split:
  - `Asolaria/package.json` and `Asolaria/server.js` lead to `Asolaria/src/gateway/server.js`
  - that path defaults to `4791`
  - legacy wrappers like `Asolaria/Start-Asolaria.cmd` and `Asolaria/tools/Start-Asolaria-OneButton.ps1` still expect `4781`

## Operational Meaning

- Rayssa host startup truth is currently gateway-first, not legacy-`4781`-first.
- `Helm` should ingest the Rayssa-host packet only, not broader archaeology.
- Nobody should claim the Rayssa main app is up until either:
  - `4781` is actually restored there, or
  - startup contracts are deliberately rebased to `4791`

## Recommendation

Fastest safe path for QDD:

1. Treat `reports/rayssa-host-startup-packet-latest.md` as the only Rayssa-host startup truth packet.
2. Stop using bare `4781` as a cross-host assumption in relay packets.
3. On Rayssa host, choose one compatibility move:
   - preferred short-term: restore a compatibility listener/proxy on `4781` that fronts the real `4791` runtime
   - or: rebase startup wrappers and expectations to `4791`
4. Keep `Helm` startup compressed to this host-truth packet plus the IX chain.

## Jesse-Host Note

This does not overturn Jesse-host runtime truth. It is a Rayssa-host contradiction packet.
