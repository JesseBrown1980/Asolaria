# System White-Glove Sweep

- Generated: 2026-03-02 16:35:09Z
- Host: DESKTOP-J99VCNH
- Elevated session: True
- Report JSON: C:\Users\acer\Asolaria\reports\system-white-glove-sweep-20260302-163509.json

## Findings
- [WARN][medium] edition_build_mismatch: Edition metadata says Windows 10 Home Single Language while build number is Windows 11-class.
- [WARN][high] python_resolution_collision: Multiple Python executables detected, with Microsoft Store shim taking precedence.
- [WARN][medium] java_home_collision: Machine and user JAVA_HOME values differ.
- [WARN][high] startup_bypass_usage: Startup entries use PowerShell ExecutionPolicy Bypass.
- [WARN][medium] scheduled_task_bypass_usage: Scheduled tasks include ExecutionPolicy Bypass actions.
- [WARN][medium] cross_drive_root_duplicates: Matching top-level directory names exist on both C: and D:.
- [WARN][medium] program_folder_duplicates: Program folder names are duplicated across program roots.
- [WARN][medium] path_duplicate_entries: PATH contains duplicate entries, which can cause ambiguous command resolution.

## Quick Stats
- Tests passed: 3
- Tests warning/fail: 8
- Root duplicate groups (C/D): 3
- Program duplicate groups: 23
- Startup bypass entries: 1
- Scheduled-task bypass actions: 7
- PATH duplicate entries: 12
- Reparse points in C:\\Users\\acer (depth<=4): 0

## Next Diagnostic Gate
- Elevated checks can run immediately: sfc /verifyonly, dism /online /cleanup-image /scanhealth, bcdedit /enum, chkdsk /scan.
