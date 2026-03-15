# Master Fix Summary

Generated: 2026-03-02 18:26:19Z
Total reclaimed MB: 953.68
Increments tracked: 18

## Increments
- fix-increment10-20260302-181116 | moved=0 | reclaimMB=0 | restoreScripts=True
- fix-increment11-20260302-181330 | moved=0 | reclaimMB=0 | restoreScripts=True
- fix-increment1-20260302-171650 | moved=0 | reclaimMB=0 | restoreScripts=False
- fix-increment12-20260302-181402 | moved=0 | reclaimMB=0 | restoreScripts=False
- fix-increment12b-20260302-181900 | moved=0 | reclaimMB=0 | restoreScripts=True
- fix-increment12c-20260302-181915 | moved=0 | reclaimMB=0 | restoreScripts=True
- fix-increment13-20260302-182046 | moved=0 | reclaimMB=0 | restoreScripts=False
- fix-increment13-20260302-182053 | moved=0 | reclaimMB=0 | restoreScripts=False
- fix-increment2-20260302-175235 | moved=3 | reclaimMB=742.89 | restoreScripts=True
- fix-increment3-20260302-175404 | moved=0 | reclaimMB=0 | restoreScripts=False
- fix-increment3-20260302-175514 | moved=0 | reclaimMB=0 | restoreScripts=False
- fix-increment3-20260302-175542 | moved=0 | reclaimMB=0 | restoreScripts=False
- fix-increment4-20260302-180346 | moved=0 | reclaimMB=0 | restoreScripts=True
- fix-increment5-20260302-180421 | moved=0 | reclaimMB=0 | restoreScripts=False
- fix-increment6-20260302-180448 | moved=7 | reclaimMB=3.79 | restoreScripts=True
- fix-increment7-20260302-180528 | moved=10 | reclaimMB=207 | restoreScripts=True
- fix-increment8-20260302-180641 | moved=0 | reclaimMB=0 | restoreScripts=True
- fix-increment9-20260302-180827 | moved=0 | reclaimMB=0 | restoreScripts=True

## Master Rollback
- powershell -ExecutionPolicy Bypass -File .\restore-all-increments.ps1
