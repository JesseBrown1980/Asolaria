# System White-Glove Sweep

- Generated: 2026-03-02 21:03:15Z
- Host: DESKTOP-J99VCNH
- Elevated session: True
- Report JSON: C:\Users\acer\Asolaria\reports\system-white-glove-sweep-20260302-210315.json

## Findings
- [WARN][medium] edition_build_mismatch: Edition metadata says Windows 10 Home Single Language while build number is Windows 11-class.
- [WARN][high] python_resolution_collision: Multiple Python executables detected, with Microsoft Store shim taking precedence.
- [WARN][medium] java_home_collision: Machine and user JAVA_HOME values differ.
- [WARN][high] startup_bypass_usage: Startup entries use PowerShell ExecutionPolicy Bypass.
- [WARN][medium] scheduled_task_bypass_usage: Scheduled tasks include ExecutionPolicy Bypass actions.
- [WARN][medium] cookie_store_sprawl: Cookie stores are spread across many profiles or large in aggregate (stores=18, totalMB=2.68).
- [WARN][medium] remote_access_surface: Remote access/control software footprint is present.
- [WARN][medium] cross_drive_root_duplicates: Matching top-level directory names exist on both C: and D:.
- [WARN][medium] program_folder_duplicates: Program folder names are duplicated across program roots.
- [WARN][medium] cross_drive_file_duplicates: Potential duplicate files (same name and size) detected across C: and D: scanned work roots.
- [WARN][medium] path_duplicate_entries: PATH contains duplicate entries, which can cause ambiguous command resolution.

## Quick Stats
- Tests passed: 10
- Tests warning/fail: 11
- Memory used: 10.54 GB / 15.85 GB (66.5%)
- Instant CPU load: 0%
- Root duplicate groups (C/D): 3
- Program duplicate groups: 23
- Installed program duplicate names: 0
- Cross-drive duplicate file groups (name+size): 3
- Startup bypass entries: 1
- Scheduled-task bypass actions: 7
- PATH duplicate entries: 7
- Reparse points in C:\\Users\\acer (depth<=4): 0
- Cookie stores found: 18 (total 2.68 MB)
- Okta artifacts total: 0
- iTop installed artifacts: 0
- Remote access surface rows: 5

## Next Diagnostic Gate
- Elevated checks can run immediately: sfc /verifyonly, dism /online /cleanup-image /scanhealth, bcdedit /enum, chkdsk /scan.
