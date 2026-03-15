# Naming and Workflow Integrity Report

Generated at: 2026-03-08T15:52:47.9674855-03:00
Summary: pass=5 warn=2 fail=0

## Runtime
- Health fast: True
- Health full: True
- Worker router: True
- Symphony status: True (configured=True, running=True)
- Abacus status: False

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
- [warn] agent_colony_presence: Agent colony lanes are mostly offline. - online=1/6
