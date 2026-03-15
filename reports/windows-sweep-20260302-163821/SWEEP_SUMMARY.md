# Windows Non-Destructive Sweep Summary

- Collected at: 2026-03-02T16:39:15.3268736-03:00
- Output folder: C:\Users\acer\Asolaria\reports\windows-sweep-20260302-163821
- Scope: diagnostics only (no fixes applied)

## Core Signals
- Drives detected: C (free 113.57 GB); D (free 789.04 GB)
- PATH entries: 48; duplicates: 5; missing: 2
- Installed programs present on both C and D (inferred): 0
- Program directory-name duplicates across C vs D roots: 0
- Duplicate file candidate groups across C and D (name+size): 0
- Hash-verified duplicate file groups across C and D: 0
- Windows Search: service=Running, startType=Automatic, events(7d)=0, errors=0, warnings=0, windows.edb exists=False
- Startup risk: high=0, medium=11
- Scheduled task risk: high=0, medium=21

## Top Startup Entries By Risk
- [medium/40] AgentBridgePC :: powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Users\acer\CrossDevice\agent-bridge\Start-AgentBridge-PC.ps1" -WorkDir "C:\Users\acer\CrossDevice\agent-bridge" -BindHost "0.0.0.0" -Port 8765 -SharedToken "change_me"
- [medium/40] com.squirrel.slack.slack :: "C:\Users\acer\AppData\Local\slack\slack.exe" --process-start-args --startup
- [medium/40] Teams :: "C:\Users\acer\AppData\Local\Microsoft\WindowsApps\MSTeams_8wekyb3d8bbwe\ms-teams.exe" msteams:system-initiated
- [medium/40] Microsoft Edge Update :: "C:\Users\acer\AppData\Local\Microsoft\EdgeUpdate\1.3.223.11\MicrosoftEdgeUpdateCore.exe"
- [medium/40] Enviar para o OneNote.lnk :: C:\Users\acer\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\Enviar para o OneNote.lnk
- [medium/40] Asolaria One Button Startup.lnk :: C:\Users\acer\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\Asolaria One Button Startup.lnk
- [medium/40] Open Codex CLI.lnk :: C:\Users\acer\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\Open Codex CLI.lnk
- [medium/30] ExpressVPN :: C:\Program Files (x86)\ExpressVPN\expressvpn-ui\ExpressVPN.exe
- [medium/30] Docker Desktop :: C:\Program Files\Docker\Docker\Docker Desktop.exe
- [medium/30] Microsoft.Lists :: C:\Program Files\Microsoft OneDrive\26.017.0126.0002\OneDrive.Sync.Service.exe

## Top Scheduled Tasks By Risk
- [medium/55] \Asolaria Core Boot Startup :: powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "C:\Users\acer\Asolaria\tools\Start-Asolaria.ps1" -Port 4781 -RequireInternet -NetworkBootstrapMaxWaitSeconds 180
- [medium/55] \Asolaria One Button Startup :: powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "C:\Users\acer\Asolaria\tools\Start-Asolaria-OneButton.ps1" -Port 4781 -StartupMode -SkipAutoStartupInstall -NetworkBootstrapMaxWaitSeconds 180
- [medium/45] \Asolaria Wake Display 1000 BRT :: powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\Users\acer\Asolaria\tools\Wake-Display-And-Resume.ps1"
- [medium/45] \Asolaria NotebookLM Build Loop :: powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:\Users\acer\Asolaria\tools\Run-NotebookBuildLoop-Scheduled.ps1
- [medium/40] \MicrosoftEdgeUpdateTaskUserS-1-5-21-1469047906-1918517011-520466592-1001Core{DC9900C6-A76E-4471-8152-7D531EE07298} :: C:\Users\acer\AppData\Local\Microsoft\EdgeUpdate\MicrosoftEdgeUpdate.exe /c
- [medium/35] \Microsoft\Windows\Workplace Join\Recovery-Check :: %SystemRoot%\System32\dsregcmd.exe /checkrecovery
- [medium/35] \GoogleSystem\GoogleUpdater\GoogleUpdaterTaskSystem147.0.7703.0{A89943F5-21A8-48A7-A845-CAA5B81BEE73} :: "C:\Program Files (x86)\Google\GoogleUpdater\147.0.7703.0\updater.exe" --wake --system
- [medium/35] \Microsoft\Windows\Device Setup\Driver Recovery on Reboot ::  
- [medium/35] \Microsoft\Windows\MemoryDiagnostic\AutomaticOfflineMemoryDiagnostic ::  
- [medium/35] \Microsoft\Windows\WindowsUpdate\RUXIM\PLUGScheduler :: "%ProgramFiles%\RUXIM\PLUGscheduler.exe" 
- [medium/35] \Microsoft\Windows\DirectX\DirectXDatabaseUpdater :: %windir%\system32\directxdatabaseupdater.exe 
- [medium/35] \Microsoft\Windows\Plug and Play\Device Install Reboot Required ::  
- [medium/35] \Microsoft\Windows\DiskDiagnostic\Microsoft-Windows-DiskDiagnosticResolver :: %windir%\system32\DFDWiz.exe 
- [medium/35] \Microsoft\Windows\DirectX\DXGIAdapterCache :: %windir%\system32\dxgiadaptercache.exe 
- [medium/35] \Microsoft\Windows\Management\Provisioning\MdmDiagnosticsCleanup :: %windir%\system32\MdmDiagnosticsTool.exe /clean

## Artifact Files
- summary.json
- path_entries.json / path_duplicates.json / path_missing_entries.json
- command_resolution.json, python_versions.json, java_versions.json
- python_path_collisions.json, java_path_collisions.json
- installed_programs.json, installed_programs_both_drives.json
- program_path_duplicates_c_vs_d.json
- duplicate_file_candidates_c_vs_d.json, duplicate_files_hash_verified_c_vs_d.json
- search_service.json, search_event_summary_7d.json, search_windows_edb.json
- startup_entries_risk_scored.json, scheduled_tasks_risk_scored.json
