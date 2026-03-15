# Fix Increment 30 (White-Glove Controls + Supervisor)

Generated: 2026-03-02 21:13:41Z

## Scope
- Extended Test-System-WhiteGloveSweep.ps1 to include:
  - process pressure snapshot (memory/cpu + top processes)
  - installed program duplicate detection
  - cookie-store inventory (Chrome/Edge/Firefox)
  - Okta/iTop artifact checks
  - remote-access surface checks
- Added Asolaria supervisor scripts:
  - C:\Users\acer\Asolaria\tools\Keep-Asolaria-SystemSupervisor.ps1
  - C:\Users\acer\Asolaria\tools\Start-Asolaria-SystemSupervisor.ps1
  - C:\Users\acer\Asolaria\tools\Stop-Asolaria-SystemSupervisor.ps1
- Added media-sprawl snapshot script:
  - C:\Users\acer\Asolaria\tools\Test-Media-SprawlSnapshot.ps1

## Reports produced
- C:\Users\acer\Asolaria\reports\system-white-glove-sweep-20260302-210315.json
- C:\Users\acer\Asolaria\reports\system-white-glove-sweep-20260302-210315.md
- C:\Users\acer\Asolaria\reports\system-white-glove-post-control2-20260302-210836.json
- C:\Users\acer\Asolaria\reports\system-white-glove-post-control2-20260302-210836.md
- C:\Users\acer\Asolaria\reports\media-sprawl-snapshot-20260302-211002.json
- C:\Users\acer\Asolaria\reports\media-sprawl-snapshot-20260302-211002.md
- C:\Users\acer\Asolaria\reports\media-sprawl-snapshot-20260302-211002-top-buckets.csv
- C:\Users\acer\Asolaria\reports\media-sprawl-snapshot-20260302-211002-duplicates.csv

## Key outcomes
- Okta artifacts: 0
- iTop artifacts: 0
- Remote surface reduced from 5 -> 0 rows in post-control sweep.
- AnyDesk containment:
  - startup link removed from Startup root and parked in _disabled
  - service set to Disabled and stopped
- Chrome Remote Desktop containment:
  - chromoting service set to Manual and stopped
- Asolaria System Supervisor:
  - running now (C:\Users\acer\Asolaria\logs\system-supervisor.pid)
  - log: latest C:\Users\acer\Asolaria\logs\system-supervisor-20260302-210620.log
  - auto-start task created: Asolaria System Supervisor

## Guardrails validated
- Microsoft Store present: True
- WindowsApps python shim present: True

## Bridge coordination
- Sent status packet to solaria_bridge thread solaria-system-repair-20260302.
