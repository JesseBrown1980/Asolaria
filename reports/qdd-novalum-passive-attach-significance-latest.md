# QDD NovaLUM Passive Attach Significance

- Timestamp: 2026-03-29 19:42:13 -03:00
- Index: IX-459

## Summary

The March 29 live repair pass established a new trustworthy boundary:

- old behavior: `Connect USB` immediately pushed verification traffic and could trap the unit in remote configuration mode
- new behavior: `Connect USB` now performs passive attach only and the physical NovaLUM stayed on the normal main screen
- remaining fault: explicit `Read Globals` still fails to promote the passive session into a working maintenance/binary lane

## What the log proves

From `D:\projects\QDD\novalink-desktop-sync-app\bin\Debug\net9.0-windows10.0.19041.0\win10-x64\logs\NL2XSync_2026-03-29.log`:

- `18:30:57` to `18:31:02` shows the old pre-fix path
  - direct `READ_GLOBALS`
  - `Ctrl-C`
  - `#` binary-mode handshake
- `19:37:13` shows the new passive attach path
  - passive USB attach succeeded on `COM9`
  - no maintenance commands were sent
- `19:37:20` to `19:37:25` shows the current remaining fault
  - no response after binary-mode switch
  - no response to `READ_GLOBALS`
  - no response to `READ_FIRMWARE`
  - app now reports failure honestly and does not unlock sync

## Significance

This matters because it narrows the real defect:

- not a general USB-open problem
- not a host listener problem
- not a fake-success UI problem anymore
- specifically an explicit maintenance-promotion problem on `Read Globals`

The next code move is to promote passive attach into maintenance mode deliberately before `Read Globals`, likely with `Ctrl-C` wake-up before `#` binary switch.
