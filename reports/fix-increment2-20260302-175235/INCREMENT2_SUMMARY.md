# Increment 2 Summary (Applied)

Date: 2026-03-02
Mode: quarantine-first, reversible

## Change applied
- Moved only 3 hash-verified duplicate video files from `C:\Users\acer\Downloads` to quarantine.
- Files moved were the `"(1)"` copies, while original files without `"(1)"` were kept in place.
- No deletions were performed.

## Outcome
- Files moved: 3
- Space reclaimed from Downloads immediately: 742.89 MB
- Quarantine path: `C:\Users\acer\Asolaria\reports\fix-increment2-20260302-175235\quarantine`
- Move manifest: `moves.json`

## Rollback
- Run from this folder:
```powershell
powershell -ExecutionPolicy Bypass -File .\restore-moves.ps1
```
