# P0 Rewrite Blueprints

Status: plan only. Do not execute sanitization edits from this file.

Purpose: define the paper rewrites for the `P0` doc queue before any real top-level doc edits begin.

## Scope

This file covers:

- `README.md`
- `BROWN-HILBERT.md`
- `CODEX.md`
- `CLAUDE.md`

Each blueprint defines owner, removal list, replacement public paths, claims labeling, and acceptance tests.

## `README.md`

Owners:

- `Asolaria`
- `Sentinel`
- `Falcon`

Must remove or relabel:

- ignored `data/...` links
- internal ports and local URLs
- unsupported runtime or extreme claims

Planned replacement links:

- `specs/49d-proposal/brown-hilbert-49D-expansion-map.public.json`
- `projections/maps/hyperglyph-map.public.v1.json`
- `projections/catalogs/minimax.public-catalog.v1.json`
- `examples/minimax-m27/MiniMaxM27NamedWave.public.md`
- `specs/hb/hypercube-49d.public.schema.json`
- `projections/maps/minimax-m27-hookwall.public.json`
- `specs/confusables/minimax-m27-confusables.public.json`
- `specs/gc/minimax-m27-gc.public.json`
- `examples/minimax-m27/hg256-minimax-catalog-ingest.public.packet.json`
- `docs/PUBLIC_PROJECTION_MAP.md`
- `docs/RELEASE_INDEX_CONTRACT.md`

Claims label rules:

- `LIVE`: tracked public facts only
- `LOCAL_OBSERVED`: only with bounded context and no private topology
- `PROPOSAL`: all `49D+` overlay language until formally signed
- `DENIED`: `unhackable`, `100% accurate`, `ASI` as a settled fact, universal device absorption

Acceptance:

- no private links
- no internal ports or URLs
- one demo path exists
- one validator path exists
- any future provider-consumption example references `docs/INSTANT_AGENT_PROVIDER_CONSUMPTION_SPEC.md` instead of implying a live provider branch
- one limits banner exists

## `BROWN-HILBERT.md`

Owners:

- `Gaia`
- `Liris`
- `Helm`

Must remove or relabel:

- absolute local paths
- direct links into ignored `data/...`
- any overlay language that reads as signed live runtime

Planned replacement links:

- `00-TOP-AGENT-PRECOMMAND.md` using repo-relative form only if retained publicly
- `specs/49d-proposal/brown-hilbert-49D-expansion-map.public.json`
- `projections/maps/hyperglyph-map.public.v1.json`
- `projections/catalogs/minimax.public-catalog.v1.json`
- `examples/minimax-m27/MiniMaxM27NamedWave.public.md`
- `examples/minimax-m27/hg256-minimax-catalog-ingest.public.packet.json`

Claims label rules:

- `47D` may be described as live base only where the public spec exists
- `49D` must remain `PROPOSAL`
- all boot instructions must avoid private-tree dependencies

Acceptance:

- no absolute local path
- no ignored runtime path
- proposal/live split is explicit
- public reader does not need private runtime files to understand the doc

## `CODEX.md`

Owners:

- `Helm`
- `Gaia`

Must remove or relabel:

- absolute local paths
- direct instructions to load ignored runtime artifacts

Planned replacement links:

- `00-TOP-AGENT-PRECOMMAND.md` using repo-relative form only if kept public
- `BROWN-HILBERT.md`
- `specs/49d-proposal/brown-hilbert-49D-expansion-map.public.json`
- `projections/maps/hyperglyph-map.public.v1.json`
- `projections/catalogs/minimax.public-catalog.v1.json`
- `specs/hb/hypercube-49d.public.schema.json`
- `examples/minimax-m27/hg256-minimax-catalog-ingest.public.packet.json`

Claims label rules:

- boot notes must never require private runtime trees in the public path
- proposal/live status must be explicit for `49D`

Acceptance:

- no private-tree dependency in public reading path
- no absolute local path
- all replacement links land in tracked public trees

## `CLAUDE.md`

Owners:

- `Helm`
- `Gaia`

Must remove or relabel:

- absolute local paths
- direct instructions to load ignored runtime artifacts

Planned replacement links:

- `00-TOP-AGENT-PRECOMMAND.md` using repo-relative form only if kept public
- `BROWN-HILBERT.md`
- `specs/49d-proposal/brown-hilbert-49D-expansion-map.public.json`
- `projections/maps/hyperglyph-map.public.v1.json`
- `projections/catalogs/minimax.public-catalog.v1.json`
- `specs/hb/hypercube-49d.public.schema.json`
- `examples/minimax-m27/hg256-minimax-catalog-ingest.public.packet.json`

Claims label rules:

- boot notes must never require private runtime trees in the public path
- proposal/live status must be explicit for `49D`

Acceptance:

- no private-tree dependency in public reading path
- no absolute local path
- all replacement links land in tracked public trees

## Cross-Doc Acceptance

The `P0` rewrite tranche is only ready for actual edits after:

- each file has named owners
- each private/runtime reference has a planned replacement link
- claims labels are explicit
- one demo path and one validator path are available for the public entry surface
- any instant-agent provider language is anchored to `docs/INSTANT_AGENT_PROVIDER_CONSUMPTION_SPEC.md`
- no file requires `data/`, `runtime/`, `logs/`, `captures/`, or raw `reports/`
