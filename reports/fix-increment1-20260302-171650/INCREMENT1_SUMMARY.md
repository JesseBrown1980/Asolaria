# Increment 1 Summary (Applied)

Date: 2026-03-02
Mode: minimal-risk, reversible

## Changes applied
1. Captured rollback artifacts:
   - env-path-before.json
   - hkcu-run-before.reg
   - hklm-run-before.reg
   - tasks/*.xml (29 exports)
   - baseline-before.json
2. Applied exact PATH duplicate deduplication only (no path reordering):
   - Machine PATH entries: 31 -> 26 (removed 5 exact duplicates)
   - User PATH entries: 24 -> 22 (removed 2 exact duplicates)
3. Preserved safety constraints:
   - Microsoft Store remains present
   - WindowsApps python shim remains present
   - python resolution order unchanged

## Validation (post-change)
- python --version: Python 3.13.12
- py --version: Python 3.13.2
- where python: WindowsApps + Python313 + Anaconda (unchanged order)
- where java/javac: JDK21 then JDK8 (unchanged)

## Rollback
- Restore PATH from env-path-before.json values (Machine + User scopes)
- Restore Run keys via:
  - reg import hkcu-run-before.reg
  - reg import hklm-run-before.reg
- Reimport scheduled tasks from tasks/*.xml if needed
