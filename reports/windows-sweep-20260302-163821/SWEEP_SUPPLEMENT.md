# Windows Sweep Supplement

- Purpose: correct log-source and parser edge cases from the first sweep summary.

## Search Integrity Correction
- `Microsoft-Windows-Search/Operational` channel is not present on this host; Search telemetry is in `Application` with provider `Microsoft-Windows-Search`.
- Application log (last 7 days): total events=38.
- Top warning signal: event id 10024 count=34 (filter host non-responsive auto-termination).
- Search DB files present: `Windows.db` and `Windows-gather.db` (modern format); legacy `Windows.edb` path check is not sufficient.

## Startup Path Correction
- Executable startup entries analyzed: 14; true missing executable paths: 0.
- Prior `C:\Program` missing-path flags were parser artifacts from unquoted paths with spaces; binaries exist.

## Asolaria Startup Overlap
- Asolaria auto-start scheduled tasks (boot/logon/startup trigger): 2.
- Asolaria startup-folder links: 1.
- This overlap can create duplicate launches and race conditions at logon.

## Added Artifacts
- search_application_event_summary_7d.json
- startup_executable_path_check.json
- asolaria_startup_tasks_snapshot.json
- startup_folder_shortcuts_snapshot.json
- search_db_files_snapshot.json
