# Admin Terminal Sidecar

This is the cooperative sidecar for managed admin-terminal identities.

Current named slots in the registry:

- `Helm`
- `Sentinel`
- `Gaia`
- `Liris`

The sidecar is registry-driven.

It gives each managed terminal:

- a stable call name
- an append-only transcript log
- a guarded input queue
- a status file with child pid, last input, and last output

## Important Boundary

The sidecar does not attach to an arbitrary existing shell just because that shell is visible.

If you want a managed identity such as `Liris`, you must launch the `Liris` sidecar slot.

That slot can use different child launchers over time, but the managed identity stays `Liris`.

## Tooling

- Start:
  - `C:\Users\acer\Asolaria\tools\Start-AdminTerminalSidecar.ps1`
- Run worker:
  - `C:\Users\acer\Asolaria\tools\Run-AdminTerminalSidecar.ps1`
- Send input:
  - `C:\Users\acer\Asolaria\tools\Send-AdminTerminalInput.ps1`
- Read status:
  - `C:\Users\acer\Asolaria\tools\Get-AdminTerminalSidecarStatus.ps1`
- Stop:
  - `C:\Users\acer\Asolaria\tools\Stop-AdminTerminalSidecar.ps1`

## Runtime Paths

Sidecar runtime root:

- `C:\Users\acer\Asolaria\runtime\admin-terminals`

Per terminal:

- `screen.txt`
- `transcript.log`
- `inbox.ndjson`
- `status.json`
- `sidecar.pid`
- `child.pid`

## Default Launch

Default child command:

```powershell
codex -a never -s danger-full-access
```

Default working directory:

- `C:\Users\acer`

## Example

### Start Liris

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\acer\Asolaria\tools\Start-AdminTerminalSidecar.ps1 -TerminalId Liris
```

## Guardrails

- Use only registry-defined admin-terminal identities.
- Treat the transcript as local admin-memory, not public relay content.
- Queue only bounded prompts, not endless chatter.
- If a sidecar did not launch the shell, it cannot take over that shell by name alone.
