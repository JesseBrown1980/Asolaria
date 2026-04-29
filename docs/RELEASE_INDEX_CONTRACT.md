# Release Index Contract

Status: plan only. Do not execute publication from this file.

Purpose: define the immutable record required for any future preview or public release bundle.

## Intent

The release pipeline should not publish a bundle that cannot later be proven to match the reviewed artifacts.

The release index is the single public record that binds:

- manifest version
- file list
- per-file SHA-256
- bundle SHA-256
- gate results
- signer
- skipped checks
- blocker state

## Bundle Tree Contract

A future public bundle should only ship tracked artifacts from these top-level buckets:

- `specs/`
- `projections/`
- `examples/`
- `tools/`
- `public/`
- `docs/`

These must never ship:

- `data/`
- `runtime/`
- `logs/`
- `captures/`
- raw `reports/`
- `.git/`
- secrets
- device proofs
- raw hookwall or GNN logs

Section owners:

- `Helm`: bundle stage ownership
- `Sentinel` + `Dasein`: public/private boundary rules
- `KR`: deny conditions and proof requirements

## Required Gate Artifacts

A release index is not valid unless all required artifacts exist.

Raw release-run reports may exist privately under `reports/` during generation, but the release bundle must only carry sanitized projected copies under tracked public trees. If a required gate artifact only exists as a raw private report, the release must fail closed.

Required tracked public artifacts:

- `config/public-release.manifest.json`
- `projections/hb/release-demo/LEAK_SCAN_REPORT.public.json`
- `projections/hb/release-demo/gates.report.public.json`
- `projections/hb/release-demo/release.index.public.json`
- `docs/INSTANT_AGENT_PROVIDER_CONSUMPTION_SPEC.md` when any instant-agent provider path is described or shipped
- sanitized white-room attest
- sanitized GC replay proof
- Omnishannon dict plus CRC
- mode policy:
  - preview
  - or public
- owner signature

Gate artifact owners and acceptance:

- `config/public-release.manifest.json`
  - owners: `Helm` + `Brain`
  - acceptance: present, tracked, hashed, referenced by release index
- `projections/hb/release-demo/LEAK_SCAN_REPORT.public.json`
  - owners: `Sentinel` + `Dasein`
  - acceptance: present, sanitized, no private-tree refs, hashed
- `projections/hb/release-demo/gates.report.public.json`
  - owners: `Helm` + `KR`
  - acceptance: present, hashed, explicit `SKIPPED`, explicit deny flags
- `projections/hb/release-demo/release.index.public.json`
  - owners: `Brain` + `KR`
  - acceptance: present, hashed, signed according to mode, references bundle hash
- sanitized white-room attest
  - owners: `Sentinel` + `Dasein`
  - acceptance: public-safe projection only, no raw operator evidence
- sanitized GC replay proof
  - owners: `KR` + `Rook`
  - acceptance: public-safe projection only, append-only posture stated
- Omnishannon dict plus CRC
  - owners: `Falcon` + `Brain`
  - acceptance: dictionary hash plus CRC recorded in the release index
- mode policy
  - owners: `Helm` + `KR`
  - acceptance: exactly one mode selected, preview/public rules enforced
- owner signature
  - owners: `Asolaria` + `KR`
  - acceptance: signer id present, signature target hash present, mode rules satisfied

## Release Index Schema

Minimum required fields:

- `version`
- `ts`
- `scope`
- `mode`
  - `preview`
  - `public`
- `manifest_sha256`
- `bundle_sha256`
- `artifacts`
  - `{ path, sha256, size, role, claims_class }`
- `proofs`
  - `{ id, path, sha256 }`
- `gate_results`
  - `{ gate, status, reason }`
- `skipped_checks`
  - `{ name, reason }`
- `deny_flags`
- `owner_sig`
  - signer id
  - signature type
  - signature target hash

Section owners:

- `Brain`: schema shape
- `KR`: integrity and signature rules
- `Helm`: stage fit with the release process

## Signing Rules

- All files use `SHA-256`.
- The bundle hash is the SHA-256 of the final zip bytes.
- Public release requires a cryptographic signature over the release index hash.
- Preview may use a clearly labeled non-crypto preview signature only if the bundle is marked `PREVIEW` everywhere and never marketed as a public release.

## Preview vs Public

Preview requirements:

- allowlist only
- read-only demo data
- telemetry opt-in only
- expiry date
- rollback plan
- preview banner

Public requirements:

- reproducible build
- full rollback runbook
- hardened defaults
- cryptographic signature
- no runtime/private trees
- support posture defined

## Verifier Interface

A future verifier should emit:

- pass/fail for manifest integrity
- pass/fail for artifact completeness
- pass/fail for leak scan
- pass/fail for required proofs
- explicit `SKIPPED` list
- bundle SHA-256
- release index SHA-256

Section owners:

- `Helm`: command surface and stage ownership
- `Brain`: implementation surface
- `Sentinel` + `Dasein`: leak and fail-closed rules
- `KR`: deny handling

Verifier output must fail closed if:

- any required artifact is missing
- any file hash mismatches
- any tracked doc references ignored/private trees
- any bundled artifact points back to raw `reports/`
- any instant-agent provider-consumption claim appears without the spec and proof bundle
- any skipped check is silently treated as pass
- any deny flag is active

## Immutability

Release records are append-only:

- never rewrite a release index
- never rewrite gate reports
- never rewrite owner signature records
- new run = new id

Every future publish action must reference a release index id. No id, no publish.

## Governance

Changes to this contract require:

- release owner
- reviewer
- rationale
- migration note

The contract is not the release itself. It is the proof envelope required before later execution.
