# Public Projection Map

Status: plan only. Do not execute publication from this file.

Purpose: define how ignored/private runtime artifacts are converted into tracked public projections for later release work.

## Scope

This file exists because tracked docs currently reference ignored/private trees such as `data/`, runtime-only logs, local paths, and internal topology details.

A public rollout must not point GitHub readers at artifacts they cannot access or at private runtime material they should not see.

## Rules

Public projections must obey all of these:

- no secrets
- no PII
- no internal IPs, ports, hostnames, usernames, session IDs, or command lines
- no raw logs
- no raw hookwall events
- no raw GNN edges
- no device proofs
- no waiver or override artifacts
- no unsealed `D49` claim packets

Public projections must preserve:

- scope
- timestamp
- source-of-record identity
- redaction method
- SHA-256 hash
- CRC or equivalent secondary integrity marker when required
- proposal/live labeling

## Owners

- `Sentinel` + `Dasein` + `Watchdogs`: policy and scrub rules
- `Gaia` + `Liris`: continuity and honesty rules
- `Rook`: shadow/projection consistency checks
- `Falcon` + `Vector` + `Brain`: path conventions and artifact shape
- `Helm`: stage ownership and gate binding
- `Asolaria`: final signoff

## Source Runtime Classes

Ignored/private sources that may require projections later:

- `data/**`
- `runtime/**`
- `logs/**`
- `captures/**`
- `reports/**` when they contain runtime-only evidence
- local absolute paths; public planning docs should use `<REPO_ROOT>\...` placeholders only
- local URLs and ports

## Projection Targets

Tracked public targets should land under these buckets:

- `specs/`
- `projections/catalogs/`
- `projections/maps/`
- `projections/index/`
- `projections/hashes/`
- `projections/crc/`
- `projections/hb/`
- `examples/`
- `public/`
- `tools/`

## Current Known Mappings

These are the first known projection replacements to create before any public rollout:

| Current private/runtime reference | Problem | Planned tracked public projection |
|---|---|---|
| `49D expansion-map runtime source` | ignored runtime path in public docs | `specs/49d-proposal/brown-hilbert-49D-expansion-map.public.json` |
| `HG256 atlas runtime source` | ignored runtime path in public docs | `projections/maps/hyperglyph-map.public.v1.json` |
| `MiniMax catalog runtime source` | ignored runtime path in public docs | `projections/catalogs/minimax.public-catalog.v1.json` |
| `MiniMax named-wave runtime source` | ignored runtime path in public docs | `examples/minimax-m27/MiniMaxM27NamedWave.public.md` |
| `49D schema runtime source` | ignored runtime path in public docs | `specs/hb/hypercube-49d.public.schema.json` |
| `MiniMax hookwall policy runtime source` | ignored runtime path in public docs | `projections/maps/minimax-m27-hookwall.public.json` |
| `MiniMax confusable-policy runtime source` | ignored runtime path in public docs | `specs/confusables/minimax-m27-confusables.public.json` |
| `MiniMax GC-policy runtime source` | ignored runtime path in public docs | `specs/gc/minimax-m27-gc.public.json` |
| `HG256 packet runtime source` | ignored runtime path in public docs | `examples/minimax-m27/hg256-minimax-catalog-ingest.public.packet.json` |
| internal loopback endpoints, `LOCALHOST_PORT_X`, host topology, local branch topology | private topology/runtime details | move to internal runbooks only; no public projection by default |

## Doc Reference Inventory

This inventory tracks the highest-priority tracked docs that still reference private/runtime material.

| File | Current private/runtime reference class | Planned projection or handling | Owner | Acceptance |
|---|---|---|---|---|
| `README.md` | ignored `data/...` links, internal ports, local URLs | rewrite to tracked `specs/`, `projections/`, `examples/`, and `tools/` only | `Asolaria` + `Sentinel` + `Falcon` | no private links, no internal topology, one public example path |
| `BROWN-HILBERT.md` | absolute local paths, ignored runtime overlays | replace with tracked public projections or mark internal-only in public scope | `Gaia` + `Liris` + `Helm` | no ignored runtime refs in public reading path |
| `CODEX.md` | absolute local paths, ignored runtime overlays | replace with tracked public projections or public/internal split | `Helm` + `Gaia` | no private-tree dependency for public boot notes |
| `CLAUDE.md` | absolute local paths, ignored runtime overlays | replace with tracked public projections or public/internal split | `Helm` + `Gaia` | no private-tree dependency for public boot notes |
| `docs/PUBLIC_RELEASE_PIPELINE.md` | absolute local paths, raw `reports/` assumptions | move to `<REPO_ROOT>` and tracked `projections/hb/` gate artifacts | `Helm` + `KR` | no raw `reports/` path in public bundle flow |
| `docs/PUBLISHABLE_RELEASE.md` | absolute local paths | move to `<REPO_ROOT>` and public-mode wording | `Helm` + `Sentinel` | no host-specific local pathing |

## Projection Generator Contract

Every projection later created must define:

- source path
- target path
- owner
- transform type
  - `copy`
  - `redact`
  - `summarize`
  - `schema_extract`
  - `example_rebuild`
- required redactions
- provenance fields
- validation rules

Minimum provenance fields:

- `source_path`
- `generated_at`
- `generated_by`
- `source_sha256`
- `target_sha256`
- `proposal_or_live`
- `claims_class`

## Validation Gates

These gates must fail closed:

- any tracked doc references ignored/private trees without a mapped public projection
- any projection missing `sha256`
- any projection missing proposal/live labeling
- any projection leaking local paths, ports, IPs, usernames, device IDs, or command lines
- any public doc linking to `data/`, `runtime/`, `logs/`, `captures/`, or raw `reports/`
- any `SKIPPED` check marketed as `PASS`

## Change Control

Changes to the projection map must include:

- who changed it
- why the new mapping is needed
- what public claim it supports
- what private class is being removed
- what validators are required

No projection may be added ad hoc during release packaging without first being listed here.
