# Media Defaults Morning Handoff

- Updated: 2026-03-10 10:49:20 -03:00

## What Was Checked
- Exported default associations snapshot: `C:\Users\acer\Asolaria\reports\default-app-associations-20260310-023842.xml`
- Live current-user `UserChoice` registry state under `HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\...`
- Live protocol defaults under `HKCU\Software\Microsoft\Windows\Shell\Associations\UrlAssociations\...`
- Installed built-in media apps/features:
- `Microsoft.ZuneMusic_11.2512.10.0_x64__8wekyb3d8bbwe` (`Status=Ok`)
- `Microsoft.Windows.Photos_2025.11120.5001.0_x64__8wekyb3d8bbwe` (`Status=Ok`)
- `WindowsMediaPlayer` optional feature is still `Enabled`

## Live State
- `.mp3` -> `AppXqj98qxeaynz6dv4459ayz6bnqxbyaqcs` (Media Player)
- `.wav` -> `AppXqj98qxeaynz6dv4459ayz6bnqxbyaqcs` (Media Player)
- `.mp4` -> `WMP11.AssocFile.MP4` (Windows Media Player Legacy)
- `.jpg` -> `AppX43hnxtbyyps62jhe9sqpdzxn1790zetc` (Photos)
- `.pdf` -> `BraveFile`
- `http` / `https` -> `ChromeHTML`
- `.png` current-user `UserChoice` key is absent
- `.json` current-user `UserChoice` key is absent

## Notable Mismatches
- Exported XML says `.mp4` defaults to `Media Player`, but the live current-user `UserChoice` is `WMP11.AssocFile.MP4`.
- Exported XML says `.pdf` defaults to `Acrobat.Document.DC`, but the live current-user `UserChoice` is `BraveFile`.
- Exported XML says `.json` defaults to `Applications\wmplayer.exe` (`Windows Media Player Legacy`), which is abnormal for a text/data type and should be checked manually if JSON files open in the wrong app.

## Exact Remaining Guard
- Windows protects current-user file/protocol defaults in `...UserChoice` with a `Hash` value.
- Direct registry edits here are unsupported and can be reverted by Windows or trigger reset behavior.
- `DISM /Import-DefaultAppAssociations` is supported for the system baseline/new profiles, but it does not safely correct the live owner's current-user `UserChoice` state.
- There is no supported headless Microsoft CLI in this workspace that can safely rewrite the current user's guarded defaults overnight without interactive Settings/UI flow.

## Decision
- No unattended fix was applied.
- The machine was left in its current working state to avoid breaking owner defaults or tripping Windows default-app reset protections.

## Morning Owner-Safe Check
- Open `Settings > Apps > Default apps`.
- Verify `.mp4`, `.mp3`, `.wav`, and `.pdf` point to the apps you actually want.
- If you want one conservative built-in media baseline, set `.mp3`, `.mp4`, and `.wav` to `Media Player`.
- Check `.json` once; if it opens in the wrong app, set it to `Notepad` or your preferred editor from the UI.

