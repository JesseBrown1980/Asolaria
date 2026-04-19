# A-017 Legacy Purge Plan (DRY-RUN)

Generated: 2026-04-19T04:45:56.809Z
Source commit: 7cf95ca50aff
Status: **DRY-RUN** — no files modified. Operator greenlight required for --execute.

## Summary

| Action | Count |
|---|---:|
| RECOMMEND_DELETE | 5 |
| PRESERVE_SYSTEM_FILE | 7 |
| RECOMMEND_ARCHIVE_THEN_DELETE | 1 |
| PRESERVE_IN_PLACE | 2 |

**Reclaim estimate:** 60 MB

## Orphans

| Path | Action | Size | Reason |
|---|---|---:|---|
| `C:/la.js` | RECOMMEND_DELETE | 319 | HTTP exec server stub, 319b, unreferenced (A-008 finding) |
| `C:/sc.ps1` | RECOMMEND_DELETE | 505 | Incomplete PowerShell screenshot script, 505b (A-008) |
| `C:/console.log('ACER` | RECOMMEND_DELETE | 19 | Debug payload stub, 19b shell-paste accident (A-008) |
| `C:/{J[id].status` | RECOMMEND_DELETE | 0 | Empty junk marker, 0b (A-008) |
| `C:/asolaria-gateway.log` | RECOMMEND_DELETE | 162271 | Stale gateway error log, 159kb (A-008) |
| `C:/DumpStack.log` | PRESERVE_SYSTEM_FILE | 12288 | Windows debug artifact (A-008) |
| `C:/DumpStack.log.tmp` | PRESERVE_SYSTEM_FILE | 0 | Windows debug artifact |
| `C:/hiberfil.sys` | PRESERVE_SYSTEM_FILE | 0 | Windows hibernate file — DO NOT DELETE, system-managed |
| `C:/pagefile.sys` | PRESERVE_SYSTEM_FILE | 0 | Windows swap file — DO NOT DELETE, system-managed |
| `C:/swapfile.sys` | PRESERVE_SYSTEM_FILE | 0 | Windows swap file — DO NOT DELETE, system-managed |
| `C:/appverifUI.dll` | PRESERVE_SYSTEM_FILE | 112136 | Windows artifact (A-008) — NOT asolaria |
| `C:/vfcompat.dll` | PRESERVE_SYSTEM_FILE | 66328 | Windows artifact (A-008) — NOT asolaria |

## Archive Candidates (archive-then-delete, requires operator greenlight)

- `C:/asolaria-from-liris` → archive to `D:/archive/asolaria-from-liris-pre-purge-2026-04-19.tar.gz` (~59.8 MB). Superseded by C:/asolaria-acer per A-008+A-009 (0 cross-tree dups with canonical). 59.8 MB archival archive candidate.

## Preserved In Place (intentional snapshots)

- `D:/Asolaria-RECOVERED` — Intentional pre-cleanup snapshot (memory: project_sovereignty_recovery). 950 MB.
- `D:/sovereignty-usb-rebuild` — USB reconstruction artifact (memory: project_sovereignty_recovery). 3.7 MB.

## How to execute (after operator greenlight)

```
# Review plan first:
cat C:/asolaria-acer/plans/A/A-017-purge-plan.json
# Then (FUTURE TRACK A-018):
node scripts/A-018-legacy-purge-execute.mjs --confirm --plan C:/asolaria-acer/plans/A/A-017-purge-plan.json
```

EVT-A-017-PURGE-PLAN · DRY-RUN · orphans=12 · archive=1 · preserve=2 · reclaim_estimate=60MB @ M-INDICATIVE .