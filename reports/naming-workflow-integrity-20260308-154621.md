# Naming and Workflow Integrity Report

Generated at: 2026-03-08T15:46:21.5055866-03:00
Summary: pass=4 warn=2 fail=0

## Runtime
- Health fast: True
- Health full: False
- Worker router: True
- Symphony status: True (configured=True, running=True)
- Abacus status: True

## Startup Seed
- Active startup seed: 
- Active seed command-like: False
- Latest memory candidate at: 2026-03-08T18:21:17.438Z
- Latest memory candidate: Hello Brain
- Latest memory candidate command-like: False

## Checks
- [pass] startup_seed_quality: Startup seed is not command-like.
- [pass] memory_seed_candidate: Memory has a usable non-trivial user seed candidate. - text="Hello Brain"
- [pass] symphony_runtime: Symphony runtime state is coherent with configuration.
- [pass] worker_router_symphony_alignment: Worker router Symphony status is aligned.
- [warn] phone_background_services: One or more phone background services are not running. - phoneBridgeKeeper=False; phoneTunnelMonitor=False
- [warn] task_ledger_actor_coverage: Task ledger tasks mostly lack actor attribution. - blankActorTasks=557/557 (100%)
