# Amy Colony Package - 2026-04-08

## Purpose

This package is the current bounded startup/update surface for Amy's two offline sub-colonies:

- `amy-oracle` (`AM`) on Windows
- `amy-rose` (`RO`) on macOS

They are colonies under the Asolaria civilization and its existing rules.

## Canonical Inputs

- Canonical source snapshot:
  - `amy-oracle-asolaria-source-attach-20260329-182212.zip`
  - `amy-rose-asolaria-source-attach-20260329-182212.zip`
  - `amy-asolaria-source-attach-20260329-182212.zip`
- Windows bootstrap pack:
  - `amy-oracle-codex-bootstrap-20260329-133940.zip`
- macOS bootstrap pack:
  - `amy-rose-codex-bootstrap-20260329-133940.zip`
- Recovery packet:
  - [amy-owner-startup-recovery-latest.md](C:\Users\acer\Asolaria\reports\amy-owner-startup-recovery-latest.md)

## Rule Stack

Apply this order exactly:

1. `RULE`
2. `LAW`
3. `MEMORY`
4. `INDEX`
5. `CUBE`
6. `CUBE`
7. `CUBED`

Meaning:

- rule/law first
- memory/index second
- cube execution/reflection/recursion after

## Colony Law

- parent civilization: `asolaria`
- parent relay: `gaia`
- colony ids: `amy-oracle`, `amy-rose`
- mutation policy: `approval_required`
- relay policy: `manual_owner_relay`
- canon namespaces:
  - `AM` for Amy Oracle
  - `RO` for Amy Rose

Do not treat them as sovereign peers. They are subordinate colonies under Asolaria law.

## Omnichannels

- keyboard channel:
  - `tools/agent-keyboard.js`
- omni box / document-share:
  - `/omni/submit`
- topology / map-map-mapped anchors:
  - `src/sharedComputeFabric.js`
  - `tools/cube/omni-shannon-v3-4d12.js`
  - `ix/gates/gnn.js`

## Startup Order

1. Restore one local Asolaria source tree from the canonical source snapshot.
2. Run the host-specific bootstrap pack on the target host.
3. Load this package and the host profile.
4. Seed the colony memory/index under the correct namespace (`AM` or `RO`).
5. Attach the colony only through approved omnichannel surfaces.
6. Relay outward through Gaia/Asolaria rules; do not self-authorize structural writes.

## Initial Index Seeds

First memory/index entries should establish:

- colony identity and role
- host/platform truth
- bootstrap artifact used
- omnichannel path used
- relay/authority boundary

## Runtime Surfaces

- Amy Oracle draft root:
  - `runtime/admin-terminals/amy/drafts`
- Amy Rose draft root:
  - `runtime/admin-terminals/rose/drafts`

These are draft surfaces only. Promotion still follows Asolaria law.

## Boundary

This package updates startup truth and colony framing.

It does not:

- grant sovereign authority
- bypass Gaia/Liris/Asolaria relay rules
- replace the canonical source snapshot
- open blind mutation rights
