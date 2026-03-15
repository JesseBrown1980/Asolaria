# White-Glove Fix Master Index

Generated: 2026-03-02 20:10:15 -03:00

## Latest Diagnostics
- C:\Users\acer\Asolaria\reports\system-audit-okta-memory-cpu-gpu-20260302-200834.md
- C:\Users\acer\Asolaria\reports\dup-scan-c-userdata.md
- C:\Users\acer\Asolaria\reports\dup-scan-d-drive.md
- C:\Users\acer\Asolaria\reports\startup-health-snapshot-20260302-193933\snapshot.md

## Increments
- fix-increment10-20260302-181116
- fix-increment11-20260302-181330
- fix-increment1-20260302-171650
- fix-increment12-20260302-181402
- fix-increment12b-20260302-181900
- fix-increment12c-20260302-181915
- fix-increment13-20260302-182046
- fix-increment13-20260302-182053
- fix-increment14-20260302-182737
- fix-increment15-20260302-182813
- fix-increment16-20260302-183535: Removed inline -SharedToken argument from HKCU Run AgentBridgePC; retained env token usage
- fix-increment17-20260302-183608
- fix-increment17-20260302-183624
- fix-increment18-20260302-190332: Bridge loopback hardening: restarted pc_server on 127.0.0.1 and set startup script defaults to loopback
- fix-increment19-20260302-190420
- fix-increment20-20260302-190556
- fix-increment20-20260302-190621
- fix-increment20-20260302-190745: Restarted codex-bridge service stack (oli/asolaria relay path)
- fix-increment21-20260302-193745: Quarantined top 10 hash-verified copy-marker duplicates (no delete)
- fix-increment2-20260302-175235
- fix-increment22-20260302-193855: Quarantined remaining hash-verified copy-marker duplicates from bounded list
- fix-increment23-20260302-195958: Removed Okta Verify (program + startup task cleanup)
- fix-increment24-20260302-200610: Memory consolidation: terminated stale high-RAM powershell runner processes only
- fix-increment3-20260302-175404
- fix-increment3-20260302-175514
- fix-increment3-20260302-175542
- fix-increment4-20260302-180346
- fix-increment5-20260302-180421
- fix-increment6-20260302-180448
- fix-increment7-20260302-180528
- fix-increment8-20260302-180641
- fix-increment9-20260302-180827

## Full Rollback
- powershell -ExecutionPolicy Bypass -File .\restore-all-increments.ps1
