# Colony Memory Schema Slice

- Generated: `2026-03-22 22:18 -03:00`
- Scope: implement the first machine-readable colony-memory contract slice so layered memory and transport provenance stop living only in prose

## What Was Implemented

Added a new contract directory:

- `config/colony-memory/README.md`
- `config/colony-memory/colony-registry.schema.json`
- `config/colony-memory/transport-epoch.schema.json`
- `config/colony-memory/draft-promotion-policy.schema.json`
- `config/colony-memory/examples/colony-registry.example.json`
- `config/colony-memory/examples/transport-epoch.example.json`
- `config/colony-memory/examples/draft-promotion-policy.example.json`

Formalized the decision in:

- `docs/adr/ADR-0013-colony-memory-registry-and-transport-epoch.md`

Added validation:

- `tests/contracts/colony-memory-contract.test.js`

## Contract Meaning

The new slice separates four things:

1. shared canon via `colony-registry`
2. transport truth via `transport-epoch`
3. progressive memory via `draft-promotion-policy`
4. live runtime verification via separate packets, not by schema files alone

## Important Boundaries

- these files do not make any bridge live
- they do not assert `4799` is safe
- they do not override the current manual owner relay rule
- they only define how future reconnect truth must be represented

## Validation Result

Ran:

```powershell
node tests/contracts/colony-memory-contract.test.js
```

Result:

- `27` passed
- `0` failed

## Next Implementation Step

The next engineering slice should be one of:

1. load these contracts through workspace knowledge or MCP resources
2. enforce transport provenance fields in any future runtime mutation path
3. fix the broken Liris startup validator so live runtime packets can be processed against the new rules
