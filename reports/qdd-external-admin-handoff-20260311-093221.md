# External Codex Handoff: QDD under Asolaria

Generated: 2026-03-11 09:32:21 -03:00

## Identity and Control
- Asolaria is the control plane and owner-facing system.
- Vector is the main brain lane inside Asolaria.
- External Codex is an auxiliary helper, not a replacement brain.
- Do not rename Asolaria, Vector, Rook, Forge, Falcon, Watchdog, or the bridge room `asolaria_bridge`.
- Do not change profile-card naming, lane canon, or bridge identity files unless that is the explicit task.

## Read First
- C:\Users\acer\Asolaria\AGENTS.md
- C:\Users\acer\Asolaria\docs\CANONICAL_SOURCE.md
- C:\Users\acer\Asolaria\docs\AUTHORITY_MODES.md
- C:\Users\acer\Asolaria\docs\GATEWAY_TOOL_AUTHORITY.md
- C:\Users\acer\Asolaria\reports\morning-handoff-latest.md
- C:\Users\acer\Asolaria\reports\google-notebooklm-recovery-plan-latest.md
- C:\Users\acer\Asolaria\tools\External-Codex-QDD-SystemCard.prompt.md

## Live Runtime Snapshot
- Asolaria runtime: ok=True, uptimeSeconds=3391
- Queue: running=1, queued=0, total=4
- Brain leader: provider=codex, model=gpt-5.4, status=selected/ready
- Phone keeper: running=True
- Phone tunnel monitor: running=False, latestReportPass=False
- Connection routing: selected=usb, remoteBaseUrl=https://192.168.1.3:5443
- Named colony counts: online=1/6, active=1/6
- Bridge helpers: relay=False, tunnel=False, notify=False
- Only Asolaria appears live right now; the other named lanes are offline from the bridge and dashboard perspective.

## NotebookLM Snapshot
- Counts: ready=1, oauth-blocked=2, enterprise-degraded=1
- Ready account: plasmatoid@gmail.com (Asolaria Enterprise Memory available).
- Full report: C:\Users\acer\Asolaria\reports\google-notebooklm-recovery-plan-latest.md

## QDD Repo Snapshot
- Repo path: D:\projects\QDD\ebacmap
- Branch: fix/clear-retest
- HEAD: b5bfdc88f
- Status: ## fix/clear-retest...origin/fix/clear-retest [gone]
- Dirty files: modified=32, untracked=22

## Default Working Rules
- Default write scope is D:\projects\QDD\ebacmap unless the task is explicitly about Asolaria plumbing.
- Inspect before editing. Respect dirty worktrees and do not discard existing local work.
- When asked to help Asolaria, keep identity and runtime-stability paths unchanged unless the owner explicitly approves a naming or control-plane migration.
- If live owner conversation is needed, use the direct Asolaria terminal for conversation and the super-admin terminal for status.

## Local Operator Commands
```powershell
powershell -NoExit -NoProfile -ExecutionPolicy Bypass -File C:\Users\acer\Asolaria\tools\Talk-To-Asolaria.ps1 -ChatId main -RouteMode direct
powershell -NoExit -NoProfile -ExecutionPolicy Bypass -File C:\Users\acer\Asolaria\tools\Open-Asolaria-SuperAdminTerminal.ps1 -Target admin -Port 4781
```

## Immediate Intent
- Help with QDD without breaking Asolaria's naming model or profile cards.
- Treat Asolaria plus Vector as the organizing brain/control pair.
- Use this handoff only as a bootstrap; verify current state locally before making claims.

