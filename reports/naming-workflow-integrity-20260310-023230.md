# Naming and Workflow Integrity Report

Generated at: 2026-03-10T02:32:30.1050127-03:00
Summary: pass=7 warn=0 fail=0

## Runtime
- Health fast: True
- Health full: True
- Worker router: True
- Symphony status: True (configured=True, running=True)
- Abacus status: True

## Startup Seed
- Active startup seed: STATUS CHECK: reply with a one-line summary of current system readiness.
- Active seed command-like: False
- Latest memory candidate at: 2026-03-10T05:08:08.293Z
- Latest memory candidate: STATUS CHECK: reply with a one-line summary of current system readiness.
- Latest memory candidate command-like: False

## Checks
- [pass] startup_seed_quality: Startup seed is not command-like.
- [pass] memory_seed_candidate: Memory has a usable non-trivial user seed candidate. - text="STATUS CHECK: reply with a one-line summary of current system readiness."
- [pass] symphony_runtime: Symphony runtime state is coherent with configuration.
- [pass] worker_router_symphony_alignment: Worker router Symphony status is aligned.
- [pass] phone_background_services: Phone background services are running. - source=health
- [pass] task_ledger_attribution_coverage: Task ledger attribution coverage is within expected range. - tasksWithoutOwnerOrSource=0/563 (0%); eventsWithoutActor=0/2105 (0%)
- [pass] agent_colony_presence: Agent colony online count is acceptable. - online=6/6
