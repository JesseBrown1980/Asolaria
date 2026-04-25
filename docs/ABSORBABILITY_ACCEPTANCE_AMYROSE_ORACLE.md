# Absorbability Acceptance: Amy's Rose And Oracle

Status: plan only. Do not execute publication from this file.

Purpose: define the concrete artifacts, runnable paths, and acceptance criteria required so Amy's Rose and Oracle can both absorb the public Asolaria material without relying on private runtime context.

## Intent

Amy's Rose and Oracle need different entrypoints.

- Amy's Rose needs a guided narrative and a fast first success.
- Oracle needs formal structure, provenance, and deterministic validation.

Both packs must come entirely from tracked public trees.

## Amy's Rose Pack

Goal:

- understand what Asolaria is
- follow one believable public example
- reach a first success quickly without private artifacts

Required deliverables:

- `README.md` as a public-facing overview
- one short guided quickstart in `docs/`
- one visual example path under `examples/minimax-m27/`
- one limits section that clearly separates `LIVE`, `LOCAL_OBSERVED`, and `PROPOSAL`
- one public screenshot or diagram under `public/`

Planned happy path:

1. Read `README.md`.
2. Open the public quickstart.
3. Inspect the `MiniMax-M2.7` example packet and its projection map.
4. Run one public validator command against the example bundle.

Acceptance:

- time to first success should be under 10 minutes for a new reader
- no internal paths, ports, usernames, or local URLs
- one example path is complete end-to-end
- one validator path is named and explained
- one current-limits banner is visible

## Oracle Pack

Goal:

- inspect schemas and manifests
- trace provenance
- verify deterministic bundle integrity
- challenge unsupported claims

Required deliverables:

- `docs/PUBLIC_PROJECTION_MAP.md`
- `docs/RELEASE_INDEX_CONTRACT.md`
- one tracked `47D` public spec
- one tracked `49D` proposal spec
- one tracked HG256 or hookwall schema
- one deterministic public release index example
- one public validator entrypoint under `tools/`

Planned verification path:

1. Read the public projection map.
2. Read the release index contract.
3. Inspect one public example manifest and bundle hash set.
4. Run the public validator against the example.
5. Confirm proposal/live labels and provenance fields.

Acceptance:

- time to first structured verification should be under 15 minutes for a technical reviewer
- deterministic example hash output is documented
- provenance fields are present
- `SKIPPED` checks are explicit
- proposal/live labeling is machine-readable where possible

## Shared Constraints

These apply to both packs:

- no ignored/private tree dependencies
- no raw runtime evidence
- no waiver or override artifacts
- no extreme claims presented as settled fact
- no release/promotion language unless the real gates later pass

## Planned Public Validator Entry

The future public validator should be documented as a neutral command shape, for example:

```powershell
pwsh -File <REPO_ROOT>\tools\validate\Invoke-PublicBundle-Validate.ps1 -Manifest <REPO_ROOT>\config\public-release.manifest.json -Mode Preview
```

This is a planned interface only until the real validator is implemented and tracked.

## Fail Conditions

Absorbability is blocked if any of these remain true:

- README still points at private runtime artifacts
- examples require local unpublished topology
- validator instructions require private environment state
- proposal overlays are described as settled live facts
- public bundles cannot be verified without hidden evidence
