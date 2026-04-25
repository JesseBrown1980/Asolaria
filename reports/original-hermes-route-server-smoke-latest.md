# Original Hermes Route Server Smoke

Generated: 2026-04-25T01:10:18.227Z
Status: ORIGINAL_HERMES_ROUTE_SERVER_SMOKE_PASS
Pass: true
Digest: d5826338c91ecedd46575654f3a4da3a069bdd3562bd2084955ce84c4af59ef2

## Logical Coverage

- Logical agents represented: 10,000,000,000
- Gulp windows represented: 5,000,000
- Mode: compact_route_surface_coverage_no_process_storm

## Route Checks

- GET /api/worker-router/original-hermes-transport-contract: status=200 ok=true elapsedMs=7614
- GET /api/worker-router/original-hermes-learning-loop?limit=8: status=200 ok=true elapsedMs=380
- GET /api/worker-router/original-hermes-wal-state-contract: status=200 ok=true elapsedMs=14
- GET /api/worker-router/original-hermes-security-backport: status=200 ok=true elapsedMs=7
- GET /api/worker-router/original-hermes-runtime-index?learningLimit=8: status=200 ok=true elapsedMs=3711

## Hook Guard Checks

- legacy_benign_read: expected=allow actual=allow pass=true
- legacy_env_block: expected=block actual=block pass=true
- original_hermes_plugin_shell_denied: expected=block actual=block pass=true

## Main Server Mount Guards

- /api/hooks loopback-only: true
- /api/worker-router loopback-only: true

## Honesty Boundary

- Temporary loopback Express app only.
- No main server launch.
- No Git stage.
- No Git commit.
- No Git push.
- No external network call.
- No secret read.
- No shadow file edit.
