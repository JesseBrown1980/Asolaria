# ebacmap / NovaLum Agent-Aware Control Plane — 2026-03-29 18:15 -03:00

## Core Insight

The right long-term direction is not more manual USB rituals. The right direction is an agent-aware, plug-and-play control plane for `ebacmap` and NovaLum systems:

- automatic availability
- explicit traceability
- bounded autonomy
- reversible mutations
- operator-visible authority

That turns the current NovaLum dashboard from a one-off repair utility into a safe device-runtime substrate.

## Why This Is Timely

We already have most of the design vocabulary locally:

- capability routing and selector posture work in `C:\Users\acer\Asolaria\src\selectorCatalogRegistry.js`
- scarce-lane execution control in `C:\Users\acer\Asolaria\src\modelLaneTumbler.js`
- approval and guardrail patterns in `C:\Users\acer\Asolaria\src\approvalEngine.js`, `C:\Users\acer\Asolaria\src\riskEngine.js`, and `C:\Users\acer\Asolaria\src\connectionPolicy.js`
- live NovaLum USB/device surfaces in `D:\projects\QDD\novalink-desktop-sync-app\Services\DeviceService.cs`
- live sync-server behavior in `D:\projects\QDD\ebacmap-master\apps\sync-server\src\SyncClient.ts`

The breakthrough is to apply those Asolaria patterns to device control instead of keeping NovaLum as a mostly manual tool.

## Product Shape

### 1. Device Identity + Registration

Every NovaLum or ebacmap-connected device should register as a typed runtime surface:

- USB present / absent
- Wi-Fi reachable / unreachable
- globals read / not read
- sync-ready / not ready
- firmware lane available / blocked
- restart needed / not needed

This becomes a real device registry instead of a hidden serial state machine.

### 2. Capability-Scoped Automation

Agents should never get raw unrestricted device control. They should get scoped capabilities such as:

- `device.detect`
- `device.read_globals`
- `device.sync`
- `device.force_restart`
- `device.update_firmware`
- `device.observe_only`

Each capability should carry:

- read-only vs mutating classification
- preconditions
- rollback or recovery expectation
- required approval mode

### 3. Traceability First

Every mutation should produce:

- who requested it
- which agent/lane executed it
- device identity
- exact command path
- before/after state
- outcome
- follow-up recovery note if needed

The goal is “automatic availability plus traceability,” not invisible automation.

### 4. Operator-Centered Safety

The operator should see:

- current device session state
- active authority level
- pending approvals
- last indexed action
- restart/sync/recovery suggestions
- why a dangerous action is blocked

That makes the system trustworthy instead of magical.

## Security / Legal Boundary

This direction is workable if it stays inside an authorized, auditable, safety-bounded lane:

- authorized systems only
- read-only by default
- explicit approval for mutating actions
- full logs for device-affecting operations
- no bypass of protected vendor controls without explicit legal and operational clearance
- stronger review if the surface touches regulated device behavior or protected data

## Immediate Three-Stage Rollout

### Stage A — Safe Device Registry

Turn NovaLum detection into a real device runtime surface:

- detect USB
- register device identity
- expose capabilities
- show safe/not-safe states without auto-hijacking the unit

### Stage B — Agent-Safe Command Plane

Wrap device actions behind typed policy gates:

- read-only lane
- repair lane
- sync lane
- firmware lane
- restart lane

### Stage C — Autonomous but Reversible Workflows

Allow agents to execute bounded playbooks such as:

- “discover device and report readiness”
- “read globals and validate sync target”
- “force restart and wait for recovery”
- “run sync if all gates pass”

Every workflow remains replayable and auditable.

## Durable Conclusion

This idea is not speculative fluff. It is a realistic convergence point between:

- Asolaria’s selector / approval / indexing discipline
- QDD’s ebacmap runtime surfaces
- NovaLum’s device/sync path

The next serious move is to treat NovaLum and ebacmap as agent-safe infrastructure, not just operator-driven utilities.
