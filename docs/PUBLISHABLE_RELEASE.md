# Publishable Release

Planning note: this describes the sanitized release bundle path. The rollout framing, public/private split, omnispindle/flywheel coverage, and phase gates live in `docs/PUBLIC_ROLLOUT_DEEP_WAVE_SECOND_CASCADE.md`.

Asolaria OS is published as a sanitized release bundle, not by shipping the live operator runtime.

## One command

```powershell
pwsh -File <REPO_ROOT>\tools\Invoke-Asolaria-PublishableRelease.ps1 -Zip
```

Equivalent npm script:

```powershell
npm run release:publishable
```

## What the publishable release guarantees

- allowlisted source-only export from `config/public-release.manifest.json`
- leak scan projected to `projections/hb/release-demo/LEAK_SCAN_REPORT.public.json`
- gates report projected to `projections/hb/release-demo/gates.report.public.json`
- release index projected to `projections/hb/release-demo/release.index.public.json`
- no `data`, `logs`, `captures`, raw `reports`, `node_modules`, or `.git` inside the release stage
- startup scripts and public deployment docs included
- optional zip artifact with SHA-256 recorded by the verifier

## Verification

Run the verifier directly:

```powershell
pwsh -File <REPO_ROOT>\tools\Test-Asolaria-PublishableRelease.ps1
```

The verifier writes:

- `projections/hb/release-demo/LEAK_SCAN_REPORT.public.json`
- `projections/hb/release-demo/gates.report.public.json`
- `projections/hb/release-demo/release.index.public.json`

## Release posture

- publish from the sanitized bundle only
- keep the live operator runtime out of the release bundle
- treat the release bundle as the publishable artifact, not the live runtime
- never publish private trees, raw proof bundles, or raw report trees
- keep promotion denied until public proofs exist
