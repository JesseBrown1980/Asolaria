# Original Hermes Route Server Smoke

Generated: 2026-04-25T02:54:37.515Z
Status: ORIGINAL_HERMES_ROUTE_SERVER_SMOKE_PASS
Pass: true
Digest: 8d7a49ea594f9f75a00efd738279124d8d065c7d8284a2688df6392ed8cc911c

## Logical Coverage

- Logical agents represented: 10,000,000,000
- Gulp windows represented: 5,000,000
- Mode: compact_route_surface_coverage_no_process_storm

## Route Checks

- GET /api/worker-router/original-hermes-transport-contract: status=200 ok=true elapsedMs=6931
- GET /api/worker-router/original-hermes-learning-loop?limit=8: status=200 ok=true elapsedMs=348
- GET /api/worker-router/original-hermes-wal-state-contract: status=200 ok=true elapsedMs=11
- GET /api/worker-router/original-hermes-security-backport: status=200 ok=true elapsedMs=6
- GET /api/worker-router/original-hermes-runtime-index?learningLimit=8: status=200 ok=true elapsedMs=3478

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
