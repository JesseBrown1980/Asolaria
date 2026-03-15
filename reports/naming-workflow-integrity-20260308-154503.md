# Naming and Workflow Integrity Report

Generated at: 2026-03-08T15:45:03.6278606-03:00
Summary: pass=1 warn=6 fail=0

## Runtime
- Health fast: True
- Health full: True
- Worker router: True
- Symphony status: True (configured=True, running=False)
- Abacus status: True

## Startup Seed
- Active startup seed: SuperAdminTerminal.ps1" -Target admin -Port 4781 -RunOnce
- Active seed command-like: True
- Latest memory candidate at: 2026-03-08T18:21:17.438Z
- Latest memory candidate: Hello Brain
- Latest memory candidate command-like: False

## Checks
- [warn] startup_seed_quality: Startup seed currently looks command-like. - seed="SuperAdminTerminal.ps1" -Target admin -Port 4781 -RunOnce"
- [pass] memory_seed_candidate: Memory has a usable non-trivial user seed candidate. - text="Hello Brain"
- [warn] symphony_runtime: Symphony is configured but not running. - Dispatch to Symphony may queue but not execute.
- [warn] worker_router_symphony_alignment: Worker router sees Symphony configured but not running. - Long-running tasks should prefer local_codex until Symphony is up.
- [warn] phone_background_services: One or more phone background services are not running. - phoneBridgeKeeper=False; phoneTunnelMonitor=False
- [warn] task_ledger_actor_coverage: Task ledger tasks mostly lack actor attribution. - blankActorTasks=557/557 (100%)
- [warn] agent_colony_presence: Agent colony lanes are mostly offline. - online=1/6
