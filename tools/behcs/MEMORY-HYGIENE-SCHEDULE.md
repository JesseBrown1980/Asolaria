# MEMORY.md Hygiene — Daily Schedule

Tool: `C:/Users/rayss/Asolaria/tools/behcs/memory-md-hygiene.mjs`

Mirrors acer's D11 daily auto-check. Read-only audit of `MEMORY.md` and the
liris memory dir (`C:/Users/rayss/.claude/projects/C--/memory/`).

## Drift criteria
- `MEMORY.md` size > 24400 bytes
- Any index entry line body > 200 chars (excluding leading `- `)
- Any `[..](file.md)` link whose basename is missing from memory dir
- Any `*.md` in memory dir (other than boot-layer files) not referenced
  in `MEMORY.md`

## CLI
```
node memory-md-hygiene.mjs                  # human summary, exit 1 on drift
node memory-md-hygiene.mjs --json           # machine-readable JSON
node memory-md-hygiene.mjs --alert          # send EVT-LIRIS-MEMORY-DRIFT envelope on drift
node memory-md-hygiene.mjs --quiet-if-clean # silent on green (cron-friendly)
node memory-md-hygiene.mjs --watch          # long-running, hourly tick + transition alert
```

Alerts log appended atomically to:
`C:/Users/rayss/Asolaria/logs/memory-hygiene-alerts.ndjson`

## Windows — Task Scheduler (09:00 daily)
Run once as the operator (do NOT run as SYSTEM — needs the liris ed25519 vault):
```
SCHTASKS /Create /SC DAILY /TN "AsolariaMemoryHygiene" /TR "node C:/Users/rayss/Asolaria/tools/behcs/memory-md-hygiene.mjs --alert --quiet-if-clean" /ST 09:00 /F
```

Verify:
```
SCHTASKS /Query /TN "AsolariaMemoryHygiene" /V /FO LIST
```

Remove:
```
SCHTASKS /Delete /TN "AsolariaMemoryHygiene" /F
```

## Linux / WSL — cron (09:00 daily)
```
0 9 * * * /usr/bin/node /mnt/c/Users/rayss/Asolaria/tools/behcs/memory-md-hygiene.mjs --alert --quiet-if-clean >> /mnt/c/Users/rayss/Asolaria/logs/memory-hygiene-cron.log 2>&1
```

## Constitutional notes
- Read-only. Tool never modifies `MEMORY.md` or any memory file.
- LAW-001 ports: posts envelope to `192.168.100.1:4947` (acer bus).
- D11=OBSERVED on every alert (audit produced direct measurements, not claims).
- Signed via `bus-sign.mjs` ed25519 / `dev-liris-4c19e180`.
