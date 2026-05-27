# Selector Catalog Rollout Slice

Date: 2026-03-29
Status: active
Scope: first live execution slice after the selector catalog + tumbler architecture landing

## Three-agent conclusion

### Runtime/API surfacing

- `server.js` already mounts `/api/catalog` correctly.
- The route is API-only and authenticated.
- The main Asolaria runtime is currently down on `4781`, so live route validation still requires a controlled restart.
- `/api/catalog` itself is not a root probe; the real targets are subpaths such as `/api/catalog/summary` and `/api/catalog/selectors`.

### Worker-router integration

- The real lease integration point is `src/connectors/workerRouter.js`, not the route.
- The best safe scope is the truly executing lanes only:
  - `local_codex`
  - `claude_max`
- The lease should be acquired immediately before the scarce lane is consumed and released in `finally`.
- Non-executing packet/handoff paths such as `abacus`, `symphony`, and `executeNow=false` prompt generation should not hold leases.

### UI surfacing

- The selector catalog should be additive and truthful.
- Existing `Connection Mode` and `Work Org` controls should remain primary.
- A small read-only `Selector Catalog` card is the right next UI surface.
- The UI must not imply that `reference` selectors are executable controls.

## Implemented slice

The first real execution slice is now in place:

- `routes/workerRouter.js` now passes request/auth attribution into `dispatchWorkerTask`.
- `src/connectors/workerRouter.js` now preserves that request context and uses it to build tumbler requester identity.
- `src/connectors/workerRouter.js` now acquires/releases tumbler leases only for `executeNow` runs on:
  - `worker_lane.local_codex`
  - `worker_lane.claude_max`
- `src/modelLaneTumbler.js` now supports `queueIfBusy=false`, which throws a clean busy error instead of silently queueing work the current router cannot resume.

## Verified behavior

### Worker router smoke

A bounded `dispatchWorkerTask` smoke with `preferredWorker=local_codex` and `executeNow=false` still works and does not consume any tumbler slots.

Result:
- dispatch created successfully
- dispatch mode = `queued_local`
- `lease = null`

### Tumbler busy semantics

A direct tumbler smoke on `gpu_primary_model` now behaves correctly for no-queue execution:

- first lease granted
- second lease attempt with `queueIfBusy=false` throws `Tumbler "gpu_primary_model" is busy.`
- release succeeds cleanly

## Significance

This is the first place where the Omnispindle catalog becomes real runtime enforcement instead of static catalog metadata.

The current system now knows:
- selectors are typed and truthful
- worker lanes have declared hardware ceilings
- the router can enforce those ceilings for real execute-now lanes
- non-executing handoff surfaces are not falsely counted as active hardware consumption

## Next step

1. controlled restart of the main Asolaria runtime
2. validate authenticated `/api/catalog/summary` and `/api/catalog/selectors`
3. add a small truthful selector summary surface in mobile/admin UI
4. only then consider widening tumbler enforcement to other execution families
