# Rayssa PROXY_4781 Implementation In-Progress

Generated: 2026-03-23 11:59:52 -03:00

## Current Branch

- Chosen path: `PROXY_4781`
- Host scope: Rayssa host only
- Goal: restore a loopback-only `4781` compatibility listener in front of the live `4791` gateway so legacy startup expectations can survive QDD without rebasing broader wrappers first.

## Rayssa/Liris Current Work

Reported new files on the Rayssa host:

- `Asolaria\src\gateway\compat4781.js`
- `Asolaria\tools\Start-Asolaria-Compat4781.ps1`

Reported intent:

- bind listener to `127.0.0.1:4781`
- proxy safe read-side status/health surfaces to the live `4791` gateway
- avoid mutating bridge or claiming missing phone bootstrap exists

## Current Proof State

- `node --check C:\Users\rayss\Asolaria\src\gateway\compat4781.js`
  - reported clean (`no output`)
- PowerShell parser check for `Start-Asolaria-Compat4781.ps1`
  - reported `POWERSHELL_PARSE_OK`
- start command is now running:
  - `& 'C:\Users\rayss\Asolaria\tools\Start-Asolaria-Compat4781.ps1' | ConvertTo-Json -Depth 6`

## Required Remaining Proof

Still waiting on the exact requested bundle:

- `netstat -ano | findstr :4781`
- `Invoke-RestMethod http://127.0.0.1:4781/api/health/fast`
- `Invoke-WebRequest http://127.0.0.1:4791/health`
- exact file/path changed
- exact command run

## Operational Read

This is the right short-term QDD branch.

It minimizes drift because:

- `Helm` can keep consuming the compressed Rayssa-host truth packet
- legacy `4781` assumptions are satisfied locally without claiming a broader runtime rewrite
- wrapper rebase can be deferred until after the startup path is stable
