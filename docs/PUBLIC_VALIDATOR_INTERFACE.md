# Public Validator Interface

Status: plan only. Do not execute validation from this file.

Purpose: define the planned public validator command surface, projected output paths, and fail-closed behavior for preview or public release bundles.

## Intent

The validator is the public proof entrypoint.

It must verify the bundle from tracked public trees only and must never rely on hidden runtime artifacts.

## Owners

- `Helm`: command surface and stage ownership
- `Brain`: implementation surface
- `Sentinel` + `Dasein`: leak checks and fail-closed rules
- `KR`: deny rules and integrity posture

## Planned Command Shape

Primary bundle validation:

```powershell
pwsh -File <REPO_ROOT>\tools\validate\Invoke-PublicBundle-Validate.ps1 -Manifest <REPO_ROOT>\config\public-release.manifest.json -Mode Preview
```

Optional release-index-only verification:

```powershell
pwsh -File <REPO_ROOT>\tools\validate\Invoke-PublicBundle-Validate.ps1 -ReleaseIndex <REPO_ROOT>\projections\hb\release-demo\release.index.public.json -Mode Preview
```

These are planned public interfaces only until the real validator exists.

## Expected Public Outputs

The validator should emit tracked public artifacts only:

- `projections/hb/release-demo/LEAK_SCAN_REPORT.public.json`
- `projections/hb/release-demo/gates.report.public.json`
- `projections/hb/release-demo/release.index.public.json`
- `projections/hb/release-demo/VALIDATOR_SUMMARY.public.json`

It may also reference:

- `config/public-release.manifest.json`
- `docs/PUBLIC_PROJECTION_MAP.md`
- `docs/PUBLIC_TREE_DIRECTORY_CONTRACT.md`
- `docs/DOC_LINK_CLOSURE_AUDIT.md`
- `docs/INSTANT_AGENT_PROVIDER_CONSUMPTION_SPEC.md`

## Expected Output Fields

The validator summary should include:

- `mode`
- `manifest_sha256`
- `bundle_sha256`
- `release_index_sha256`
- `artifact_count`
- `required_artifact_status`
- `leak_scan_status`
- `doc_link_closure_status`
- `skipped_checks`
- `deny_flags`
- `final_status`
- `provider_consumption_status`
- `cache_evidence_status`

## Fail-Closed Rules

Validation must fail closed if any of these are true:

- any tracked doc still points at `data/`, `runtime/`, `logs/`, `captures/`, or raw `reports/`
- any required projected gate artifact is missing
- any artifact hash mismatches
- any bundled artifact points back to raw `reports/`
- any private local path, username, port, hostname, IP, token, or device id leaks
- any proposal overlay is marketed as live fact
- any provider-consumption claim appears without the evidence bundle defined in `docs/INSTANT_AGENT_PROVIDER_CONSUMPTION_SPEC.md`
- any `SKIPPED` check is silently treated as `PASS`
- any deny flag from `KR` remains active

## Acceptance

This interface is planning-complete when:

- the command shape is neutral and uses `<REPO_ROOT>`
- expected public output paths are defined
- output fields are explicit
- fail-closed rules align with `docs/PUBLIC_TREE_DIRECTORY_CONTRACT.md`
- doc-link closure checks align with `docs/DOC_LINK_CLOSURE_AUDIT.md`

This interface is not the validator implementation. It is the contract the future validator must satisfy.
