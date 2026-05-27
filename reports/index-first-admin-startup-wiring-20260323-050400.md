# Index-First Admin Startup Wiring

Generated: 2026-03-23 05:04:00 -03:00

## Summary

The startup drift was real and is now corrected in the live admin-terminal path.

`Helm` and `Sentinel` now boot from the compliant startup packet plus IX chain, not from archaeology-heavy bootstrap file lists.

## Implemented

- `server.js`
  - `Helm` and `Sentinel` bootstrap prompt builder now forces index-first compressed startup
- `tools/Start-Asolaria-OneButton.ps1`
  - explicit startup prompts for `Helm` and `Sentinel`
  - staged `Sentinel` support alongside `Helm` and real `Falcon`
  - no forced UAC escalation unless `ASOLARIA_ONEBUTTON_REQUIRE_ADMIN` is explicitly enabled
- `tools/Start-Asolaria-Phone.ps1`
  - no forced UAC escalation unless `ASOLARIA_ONEBUTTON_REQUIRE_ADMIN` is explicitly enabled
- `admin-helm-v1.profile.json`
  - `bootstrapOrder` now points at the compliant packet and IX chain
- `admin-sentinel-v1.profile.json`
  - `bootstrapOrder` now points at the compliant packet and IX chain
- live runtime prompt files
  - `runtime/admin-terminals/helm/bootstrap-prompt.txt`
  - `runtime/admin-terminals/sentinel/bootstrap-prompt.txt`

## Compliant Relay Surface

Asolaria wake now has a compliant carrier:

- `reports/asolaria-startup-compliance-packet-latest.md`
- `IX-279`
- `IX-280`

This means the correction is report-backed and IX-backed rather than chat-only.

## Live Verification

Direct live replacement succeeded:

- `Helm`
  - sidecar PID `9852`
  - child PID `5164`
  - state `running`
- `Sentinel`
  - sidecar PID `1392`
  - child PID `13520`
  - state `running`
- `Falcon`
  - Omnispindle status `running`
  - PID `4484`

Runtime view after replacement:

- `/api/health/fast` reports `agentColony.counts adminOnline=2 adminActive=2`
- phone keeper is running
- phone tunnel monitor is running
- private remote phone URL is restored on `desktop-j99vcnh.tailb47e0e.ts.net:4782`

## Remaining Blocker

The full one-button smoke is not yet fully clean.

Even after the UAC fixes, one bounded run still tripped the health-guardrail preflight during transition, despite the runtime recovering and later proving healthy. That path still needs stabilization before I can call the full one-button flow clean.

