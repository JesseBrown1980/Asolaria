# Liris To Jesse Handoff Spec

## Purpose

Define exactly what from the Liris kernel system should be shared with Jesse’s realigned system, what should stay local to Liris, what should become a Gaia/Jesse overlay, and what must never be baked into the shared core.

This is a portability boundary document.

## Core Rule

If it depends on `this host`, it is an overlay.

If it defines how the system:

- stores knowledge
- validates knowledge
- promotes knowledge
- resolves profiles
- executes typed kernel operations

then it belongs in the shared core.

## Shared With Jesse: Portable Core

These should be the foundation on Jesse’s machine too.

### Runtime and profile abstraction

- [runtimePaths.js](C:\Users\rayss\Asolaria\src\runtimePaths.js)
- [profile.js](C:\Users\rayss\Asolaria\src\index-kernel\profile.js)
- [runtime.js](C:\Users\rayss\Asolaria\src\index-kernel\runtime.js)
- [schema.js](C:\Users\rayss\Asolaria\src\index-kernel\schema.js)

Reason:

- these establish instance-root portability
- they define `dev`, `staging`, `running`, and `prod`
- they separate source-build profiles from promoted/manifest profiles

### Kernel compilation, query, validation, and state

- [compile.js](C:\Users\rayss\Asolaria\src\index-kernel\compile.js)
- [inventory.js](C:\Users\rayss\Asolaria\src\index-kernel\inventory.js)
- [query.js](C:\Users\rayss\Asolaria\src\index-kernel\query.js)
- [validate.js](C:\Users\rayss\Asolaria\src\index-kernel\validate.js)
- [state.js](C:\Users\rayss\Asolaria\src\index-kernel\state.js)
- [cache.js](C:\Users\rayss\Asolaria\src\index-kernel\cache.js)
- [textIds.js](C:\Users\rayss\Asolaria\src\index-kernel\textIds.js)

Reason:

- this is the portable compiler/gate/search/status layer
- none of it should need Jesse-machine assumptions to work

### ASO typed-ops kernel

- [aso.js](C:\Users\rayss\Asolaria\src\index-kernel\aso.js)
- [asoTables.js](C:\Users\rayss\Asolaria\src\index-kernel\asoTables.js)

Reason:

- this is the stable typed-operation layer
- it is the actual kernel logic for topics, observations, relations, outcomes, surfaces, evidence, and conflicts

### Promotion/source artifacts

- [data/agent-index](C:\Users\rayss\Asolaria\data\agent-index)
- [compiled-unified-agent-index.json](C:\Users\rayss\Asolaria\.history\staging\compiled-unified-agent-index.json)
- [compiled-unified-agent-index-20260326-174825313Z.json](C:\Users\rayss\Asolaria\.history\prod\unified-agent-index-snapshots\compiled-unified-agent-index-20260326-174825313Z.json)

Reason:

- this is the actual source/promoted proof chain
- Jesse should consume the validated core baseline, not only raw chat claims

### Portable tests

- [index-kernel.unit.test.js](C:\Users\rayss\Asolaria\tests\index-kernel.unit.test.js)
- [kernel-internals.unit.test.js](C:\Users\rayss\Asolaria\tests\kernel-internals.unit.test.js)
- [aso.unit.test.js](C:\Users\rayss\Asolaria\tests\aso.unit.test.js)
- [aso-boot.unit.test.js](C:\Users\rayss\Asolaria\tests\aso-boot.unit.test.js)
- [aso-conflict-detector.unit.test.js](C:\Users\rayss\Asolaria\tests\aso-conflict-detector.unit.test.js)
- [aso-connector-middleware.unit.test.js](C:\Users\rayss\Asolaria\tests\aso-connector-middleware.unit.test.js)

Reason:

- if it is shared core, it must travel with its proofs

## Keep On Liris: Local Machine State

These are useful locally but should not be copied into Jesse’s core as-is.

### Liris identity and local rules

- [liris-node-identity.json](C:\Users\rayss\Asolaria\config\liris-node-identity.json)
- [liris-rules.md](C:\Users\rayss\Asolaria\.agent\rules\liris-rules.md)
- [liris-agent-memory.md](C:\Users\rayss\Asolaria\config\liris-agent-memory.md)
- [liris-skill-tool-index.md](C:\Users\rayss\Asolaria\config\liris-skill-tool-index.md)

Reason:

- these encode this host, this node identity, and this operator context

### Liris-local memory/task surfaces

- [data/liris-index](C:\Users\rayss\Asolaria\data\liris-index)
- [data/liris-tasks](C:\Users\rayss\Asolaria\data\liris-tasks)
- [data/liris-mistakes](C:\Users\rayss\Asolaria\data\liris-mistakes)
- [data/liris-ideas](C:\Users\rayss\Asolaria\data\liris-ideas)

Reason:

- these are useful as local memory or migration input
- they should be mined, not mounted as the shared kernel source of truth

### Liris-local runtime traces

- mailbox files
- MQTT inbox traces
- local PID files
- local logs

Reason:

- these are observability artifacts, not portable kernel logic

## Convert Into Gaia Overlay

These should exist on Jesse’s machine only if rewritten as Jesse/Gaia-specific overlays.

### Node identity and local surfaces

Anything that describes:

- Jesse hostnames
- Jesse ports
- Jesse firewall rules
- Jesse secrets/tokens
- Jesse local service paths
- Jesse auth/provider assumptions

belongs in `Gaia overlay`, not in shared core.

### Gaia-specific sub-kernel pieces

If Gaia already has a “sub-kernel” that assumes Jesse’s machine layout, then:

- do not adopt it as shared foundation
- extract portable logic upward into core if truly generic
- keep machine-coupled behavior in `Gaia overlay`

The right transformation is:

- `portable logic` -> move to shared core
- `Jesse-machine assumptions` -> keep in Gaia overlay

### Gaia-only tools and routes

Any route, daemon, or local tool that only works because of Jesse’s specific environment should remain overlay-scoped until abstracted.

## Never Bake Into Shared Core

These should not become core assumptions.

### Machine-bound comms/runtime assumptions

- direct bridge host/IP assumptions
- MQTT host/port assumptions tied to one machine
- firewall-specific notes
- local-only paths
- hardcoded auth locations

### Generated outputs as truth

- graph exports
- copied ASO exports
- generated runtime snapshots
- transient mailbox payloads

These can be evidence, not the foundation.

### Host-specific manager/agent overlays

- anything like the deleted antigravity bridge layer
- machine-specific process control wrappers
- anything that only exists to make one host’s local operator setup easier

### Broad local permission/config artifacts

- root-scoped Claude approval files
- local CLI permission shims
- tool-specific desktop/editor state

## Recommended Structure On Jesse’s Machine

### Shared core

- `src/index-kernel/*`
- `src/runtimePaths.js`
- `data/agent-index/*`
- `.history/staging/*`
- selected `.history/prod/*`
- portable tests

### Gaia overlay

- Jesse node identity
- Jesse host-specific services
- Jesse provider/auth surfaces
- Jesse-only local adapters

### Federation layer

- transport
- bridge/MQTT/mailbox
- remote-node sync
- merge/conflict authority

This layer should call into the core, not redefine it.

## Decision Rule For Every File

Ask:

1. Would this still make sense on a different machine with different ports, paths, and auth?
2. Does it define the system’s logic, or just one host’s environment?
3. Can it be proven by tests outside Jesse’s machine?

If the answers are:

- `yes / logic / yes` -> shared core
- `no / environment / no` -> overlay

## Practical Recommendation

What Jesse should use from Liris:

- the portable kernel
- the promotion/integrity model
- the typed-op ASO layer
- the validated staging/prod artifacts
- the portable tests

What Jesse should not use from Liris as-is:

- Liris node identity
- Liris machine paths and comms assumptions
- Liris-local memory/task stores
- Liris-local runtime traces

What Jesse’s existing system should contribute:

- Gaia overlay pieces that are truly host-specific
- extracted portable logic only where it survives abstraction

## Conclusion

Liris’s kernel here is still worth continuing, and it is still the better candidate for shared foundation because it already has profile abstraction, promotion boundaries, integrity gates, and typed kernel operations.

Gaia’s sub-kernel is valuable if treated as a `Gaia overlay` plus a source of reusable abstractions.

It is the wrong base if it remains specific to Jesse’s machine.
