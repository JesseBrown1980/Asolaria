# Naming and Workflow Integrity Report

Generated at: 2026-03-08T23:13:23.8156381-03:00
Summary: pass=7 warn=0 fail=0

## Runtime
- Health fast: True
- Health full: True
- Worker router: True
- Symphony status: True (configured=True, running=True)
- Abacus status: True

## Startup Seed
- Active startup seed: 
- Active seed command-like: False
- Latest memory candidate at: 2026-03-09T02:07:02.189Z
- Latest memory candidate: Write to vector to write "Please continue and use your best idea" into the text on the admin terminal on screen two. Then press enter so vector will wake up and continue and I can verify visually .
- Latest memory candidate command-like: False

## Checks
- [pass] startup_seed_quality: Startup seed is not command-like.
- [pass] memory_seed_candidate: Memory has a usable non-trivial user seed candidate. - text="Write to vector to write "Please continue and use your best idea" into the text on the admin terminal on screen two. Then press enter so vector will wake up and continue and I can verify visually ."
- [pass] symphony_runtime: Symphony runtime state is coherent with configuration.
- [pass] worker_router_symphony_alignment: Worker router Symphony status is aligned.
- [pass] phone_background_services: Phone background services are running. - source=health
- [pass] task_ledger_attribution_coverage: Task ledger attribution coverage is within expected range. - tasksWithoutOwnerOrSource=0/558 (0%); eventsWithoutActor=0/2100 (0%)
- [pass] agent_colony_presence: Agent colony online count is acceptable. - online=6/6
