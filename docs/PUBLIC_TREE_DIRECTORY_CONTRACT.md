# Public Tree Directory Contract

Status: plan only. Do not execute publication from this file.

Purpose: define the tracked public directory structure, ownership, and fail-closed rules for a later Asolaria preview or public release.

## Intent

The public tree must separate publishable projections from private runtime evidence.

Tracked public buckets are the only allowed source for preview or public bundles.

## Top-Level Buckets

### `specs/`

Owner:

- `Gaia` + `Liris`
- `Falcon` + `Vector`

Required contents:

- `47D` live base specifications
- `49D` proposal overlay specifications
- `HG256` language specifications
- hookwall, GC, confusables, and HB schemas

Forbidden contents:

- raw runtime exports
- local paths
- private ports or IPs
- unsigned runtime claims labeled as live

### `projections/`

Owner:

- `Sentinel` + `Dasein` + `Watchdogs`
- `Rook`

Required contents:

- sanitized maps
- sanitized catalogs
- sanitized indexes
- sanitized hashes and CRCs
- sanitized HB gate artifacts

Forbidden contents:

- raw `data/`
- raw `runtime/`
- raw `logs/`
- raw `captures/`
- raw `reports/`
- device proofs

### `examples/`

Owner:

- `Falcon` + `Vector` + `Brain`

Required contents:

- reproducible vendor capsules
- example packets
- example cubes
- example policy files
- deterministic sample manifests

Forbidden contents:

- operator-only artifacts
- private waivers
- local-only routes

### `tools/`

Owner:

- `Helm`
- `Brain`
- `KR`

Required contents:

- validators
- schema checkers
- redaction tooling
- hash and CRC tooling

Forbidden contents:

- tools that require hidden local topology in public mode
- scripts that hardcode absolute local paths in public instructions

### `public/`

Owner:

- `Asolaria`
- `Helm`
- `Sentinel`

Required contents:

- screenshots approved for public use
- static site assets
- public demo assets

Forbidden contents:

- runtime screenshots with private topology
- captures containing tokens, usernames, internal routes, or local window state

### `docs/`

Owner:

- `Asolaria`
- `Helm`

Required contents:

- public overview docs
- rollout and release contracts
- user-facing quickstarts
- governance notes

Forbidden contents:

- private operator runbooks presented as public docs
- internal-only launcher paths unless explicitly marked internal

## Naming And Versioning

Use these conventions:

- projections derived from private/runtime material should carry `.public.` in the filename when practical
- proposal overlays should carry `proposal` in the path or filename
- bundle contracts should use explicit versions such as `v1`
- example capsules should group by vendor or feature under stable folders, for example `examples/minimax-m27/`

Avoid:

- silent overwrites of schema shape
- unlabeled proposal/live transitions
- mixed public/private filenames in the same directory

## Required Supporting Files

The public tree contract assumes the presence of these tracked control artifacts:

- `docs/PUBLIC_PROJECTION_MAP.md`
- `docs/RELEASE_INDEX_CONTRACT.md`
- `docs/README_SANITIZATION_CHECKLIST.md`
- `docs/DOC_LINK_CLOSURE_AUDIT.md`

## Acceptance Gates

This contract is not satisfied unless all of these are true:

- no tracked public doc points at `data/`, `runtime/`, `logs/`, `captures/`, or raw `reports/`
- each top-level bucket has named owners
- required/forbidden contents are defined for each bucket
- proposal/live labeling rules are explicit
- validator and redaction tooling paths are planned under `tools/`
- example capsules do not rely on private local topology
- `SKIPPED` is never presented as `PASS`

If any gate fails, later publication planning must stop until the tree contract is updated or the offending docs are rewritten.
