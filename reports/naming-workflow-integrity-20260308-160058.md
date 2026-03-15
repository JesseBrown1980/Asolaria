# Naming and Workflow Integrity Report

Generated at: 2026-03-08T16:00:58.5258649-03:00
Summary: pass=6 warn=1 fail=0

## Runtime
- Health fast: True
- Health full: True
- Worker router: True
- Symphony status: True (configured=True, running=True)
- Abacus status: True

## Startup Seed
- Active startup seed: Hello Brain
- Active seed command-like: False
- Latest memory candidate at: 2026-03-08T18:21:17.438Z
- Latest memory candidate: Hello Brain
- Latest memory candidate command-like: False

## Checks
- [pass] startup_seed_quality: Startup seed is not command-like.
- [pass] memory_seed_candidate: Memory has a usable non-trivial user seed candidate. - text="Hello Brain"
- [pass] symphony_runtime: Symphony runtime state is coherent with configuration.
- [pass] worker_router_symphony_alignment: Worker router Symphony status is aligned.
- [warn] phone_background_services: One or more phone background services are not running. - phoneBridgeKeeper=False; phoneTunnelMonitor=True
- [pass] task_ledger_attribution_coverage: Task ledger attribution coverage is within expected range. - tasksWithoutOwnerOrSource=0/557 (0%); eventsWithoutActor=0/2095 (0%)
- [pass] agent_colony_presence: Agent colony online count is acceptable. - online=6/6
