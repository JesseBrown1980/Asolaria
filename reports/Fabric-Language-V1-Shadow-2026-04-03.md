# Fabric Language V1 Shadow

This is the current shadow package for the first shared fabric. It does not mutate living language.

## Final Direction

- fabric/proof leads
- language stays derived
- living language remains frozen
- canon alone remains sovereign

## Minimal Language

Fields:

- `session_id`
- `node`
- `host`
- `drive`
- `device`
- `device_profile`
- `lane`
- `surface`
- `source_layer`
- `promotion_state`
- `route_proof`
- `delivery_proof`
- `control_proof`
- `reflection_state`
- `authority_class`

Allowed `source_layer`:

- `canon`
- `shadow`
- `runtime`
- `derived`

Allowed `authority_class`:

- `helper`
- `derived`
- `canon_bound`

Grammar:

```text
session_id=<id> | node=<node-id> | host=<host-id> | drive=<drive-id|none> | device=<device-id> | device_profile=<profile-id> | lane=<typed-lane> | surface=<surface-id> | source_layer=<canon|shadow|runtime|derived> | promotion_state=<mirrored_base|preserved|secondary_pending_local_proof|admitted_secondary|controllable|compute_peer_leased|blocked> | route_proof=<open|closed|blocked> | delivery_proof=<open|closed|blocked> | control_proof=<open|closed|blocked> | reflection_state=<quiet|observing|comparing|converged|blocked> | authority_class=<helper|derived|canon_bound>
```

## First Fabric Primitives

- `host_registry`
- `device_object_registry`
- `storage_object_registry`
- `device_profile_registry`
- `typed_lane_registry`
- `proof_ledger`
- `route_contract_store`
- `replayable_append_log`
- `helper_only_bus_adapters`
- `reflection_log`
- `promotion_gate`
- `rollback_demotion_record`

## Immediate Order

1. Close `rayssa-host` local route proof.
2. Close `rayssa-host` first local delivery proof.
3. Admit the relevant drives and storage roots as storage objects in the same fabric.
4. Bind device-specific profiles before wider promotion.
5. Seed the shared fabric from those proofs.
6. Keep `s22-ultra` helper-only until later control proof.

## Six-Wave Significance

The six-lane review closed one critical ambiguity: the language is not the first authority. The first authority remains proof carried by registries, ledgers, route contracts, append logs, and gates. The shadow language compresses and describes that truth. It does not mint it.

Multiple drives and multiple devices can belong to the same fabric, but only as explicit indexed objects. Device-specific awareness and reverberating self-reflection are valid only as governed advisory layers tied to proof.
