# Fix Increment 31 (Continue: Runtime + Dedupe, Keep Remote Tools)

Generated: 2026-03-02 21:55:01Z

## Guardrail
- AnyDesk: kept installed and enabled.
- Chrome Remote Desktop Host: kept installed and enabled.
- Microsoft Store: preserved.
- WindowsApps python shim: preserved.

## Changes applied

### 1) Runtime/PATH stabilization (reversible)
- Added tool: C:\Users\acer\Asolaria\tools\Repair-Asolaria-RuntimePath.ps1
- Applied actions:
  - deduped Machine/User PATH entries
  - removed User PATH entries already present in Machine PATH (cross-scope dedupe)
  - kept WindowsApps in PATH
  - moved Python313/Python313\\Scripts before WindowsApps in Machine PATH
  - aligned User JAVA_HOME to Machine JDK21
  - preserved old JDK8 as JAVA8_HOME
  - set JAVA21_HOME and PYTHON_REAL user vars
- Rollback snapshot file:
  - C:\Users\acer\Asolaria\reports\runtime-path-repair-20260302-215209-rollback.json

### 2) Deterministic runtime shims (no Store removal)
- Created:
  - C:\Users\acer\.local\bin\python-real.cmd
  - C:\Users\acer\.local\bin\java21.cmd
  - C:\Users\acer\.local\bin\java8.cmd
- Verified:
  - python-real --version -> Python 3.13.2
  - java21 -version -> OpenJDK 21
  - java8 -version -> OpenJDK 1.8.0_392

### 3) Media dedupe quarantine (hash-verified, no delete)
- Added tool: C:\Users\acer\Asolaria\tools\Start-MediaDedupeQuarantine.ps1
- Dry-run first, then applied batch with MaxMoves=40
- Actual moved to quarantine: **36 files**
- Staged size: **0.0161 GB**
- Quarantine batch:
  - C:\Users\acer\Asolaria\quarantine\batch-20260302-214626
- Primary moved class: duplicate screenshots from Downloads that already exist in OneDrive.

### 4) White-glove script stability fix
- Patched strict-mode .Count access issues in:
  - C:\Users\acer\Asolaria\tools\Test-System-WhiteGloveSweep.ps1
- Re-ran successfully.

## Verification snapshots
- C:\Users\acer\Asolaria\reports\runtime-path-repair-20260302-215209.md
- C:\Users\acer\Asolaria\reports\media-dedupe-quarantine-20260302-214626.md
- C:\Users\acer\Asolaria\reports\system-white-glove-post-increment31b-20260302-215416.md

## Current status highlights
- White-glove warnings/fails: **9** (down from 10 in prior pass).
- PATH duplicate entries: **0**.
- Java home collision: resolved (now aligned via JAVA_HOME + JAVA8_HOME fallback).
- AnyDesk/chromoting services: running/automatic.

