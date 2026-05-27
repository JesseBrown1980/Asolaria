# Liris Next Order After Rayssa Phone Proof

Generated: 2026-03-23 16:12:31 -03:00

## Current Read

`IX-295` closes the old Rayssa-host phone proof contradiction.

Current host-scoped truth is now stable enough that Liris should stop spending cycles on repeated proof of:

- `GET /api/mobile/bootstrap`
- `GET /api/mobile/session`
- `GET /api/mobile/control/status`
- ADB authorization
- `adb reverse tcp:4781 tcp:4781`

unless one of those layers fails again.

This proof establishes a live Rayssa-host phone compat/control lane under `liris/kuromi`.

It does **not** yet prove:

- live cross-host shared compute is flowing end to end
- Rayssa phone CPU/RAM sharing is live

## Ordered Next Work For Liris

### 1. Fix the Rayssa compat launcher rerun PID bug

This is the highest-value Rayssa-local bug still open.

Required change:

- rerun detection must key off the actual listening PID on `4781`
- a second launcher run must report reuse/no-duplicate-start when the same process is still holding `4781`

Required proof bundle:

- first launch result
- listening PID on `4781`
- second launch result
- proof that no duplicate listener was created
- `4781` and `4791` health after rerun

### 2. Stage a local `liris` compute-readiness packet

The shared-compute slice already exists in the Jesse checkout, but Jesse's live main runtime still needs its own rollout before Gaia can call cross-host dispatch truly live.

That means Liris should do **local preparation**, not mythology:

- verify the Rayssa checkout contains the shared-compute slice and MQTT compute topics
- keep node identity explicit: `liris`
- prepare a host-scoped proof that the Rayssa side can advertise `compute/capabilities`
- include `computeWorkerReady=true` only if the Rayssa side can actually execute an allowlisted bounded command
- capture one bounded local execution result suitable for the current allowlist

Good examples:

- `python --version`
- `pnpm --version`
- `rg --version`

Required packet contents:

- one report
- one LX entry
- raw output for capabilities and one bounded execution
- one zip for Gaia

### 3. Keep the boundary explicit

Liris should **not** claim any of these yet unless separately proved:

- live cross-host dispatch from Jesse to Rayssa is already working
- Rayssa phone CPU/RAM sharing is live
- `falcon` is the correct default label for Rayssa's phone

Current safe language is:

- Rayssa host phone compat lane is live under `liris/kuromi`
- cross-host compute is in preparation
- phone CPU sharing would require a separate Rayssa-side phone-worker or Termux-execution proof

## Operational Rule

The next Rayssa-side packet should be narrow and technical:

1. compat launcher rerun PID hardening proof
2. local `liris` compute-readiness proof

No notebook summary, no archaeology, no broad startup retelling.
