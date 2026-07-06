# Liris 502 Route Reconciliation - 2026-07-06

EVIDENCE|class=MEASURED_ACER|surface=Acer dashboard :4949|detail=/api/sister-organ selects Liris :4948 health with HTTP 200.
EVIDENCE|class=MEASURED_ACER|surface=stale mirror routes|detail=/api/devices/liris-mirror and /api/connectors/liris-mirror return HTTP 200 degraded compatibility payloads instead of 502.
EVIDENCE|class=MEASURED_ACER|surface=route boundary|detail=Legacy :4944 mirror payload endpoints are absent/unreachable; Liris :4948 fabric and :4947 bus are live.

## Changed

- Updated Acer dashboard Liris defaults from legacy :4944 / old LAN host to measured Liris :4948 dashboard and :4947 bus lanes.
- Replaced stale hard 502 handlers for devices/connectors Liris mirror routes with compatibility payloads.
- Updated /api/everything route labels to reflect Liris :4948/:4947 with legacy :4944 as fallback only.

## Boundary

This does not claim full legacy mirror payload recovery. It claims the false 502 is removed and replaced by an honest degraded state: Liris live, old mirror endpoint absent.

## Verification

- node --check super-dashboard-server.mjs: PASS
- node --check dashboard-introspect.mjs: PASS
- node --check fabric-mirror-audit.mjs: PASS
- git diff --check super-dashboard-server.mjs: PASS
- /api/sister-organ: HTTP 200, source http://192.168.15.16:4948/health
- /api/devices/liris-mirror: HTTP 200, degraded true, mirror_payload false
- /api/connectors/liris-mirror: HTTP 200, degraded true, mirror_payload false

## Files

- JSON: LIRIS-502-ROUTE-RECONCILIATION-2026-07-06.json
- HBP: LIRIS-502-ROUTE-RECONCILIATION-2026-07-06.hbp
- HBI: LIRIS-502-ROUTE-RECONCILIATION-2026-07-06.hbi
- Diff: LIRIS-502-ROUTE-RECONCILIATION-2026-07-06.diff
