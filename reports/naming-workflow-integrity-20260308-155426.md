# Naming and Workflow Integrity Report

Generated at: 2026-03-08T15:54:26.6452259-03:00
Summary: pass=6 warn=1 fail=0

## Runtime
- Health fast: True
- Health full: True
- Worker router: True
- Symphony status: True (configured=True, running=True)
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
- [pass] symphony_runtime: Symphony runtime state is coherent with configuration.
- [pass] worker_router_symphony_alignment: Worker router Symphony status is aligned.
- [pass] phone_background_services: Phone background services are running.
- [pass] task_ledger_attribution_coverage: Task ledger attribution coverage is within expected range. - tasksWithoutOwnerOrSource=0/557 (0%); eventsWithoutActor=0/2095 (0%)
- [pass] agent_colony_presence: Agent colony online count is acceptable. - online=6/6
