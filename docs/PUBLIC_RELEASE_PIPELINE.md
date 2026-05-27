# Public Release Pipeline

For future release planning, read `docs/PUBLIC_ROLLOUT_DEEP_WAVE_SECOND_CASCADE.md` first. This file is the execution-side pipeline only, after the rollout plan has been approved and sanitized.

Use this from the repository root only:

`<REPO_ROOT>`

## Build command

```powershell
pwsh -File <REPO_ROOT>\tools\Build-PublicRelease.ps1 -Zip
```

## Publish/demo gates

Run this immediately after build and before any Play Console submission:

```powershell
pwsh -File <REPO_ROOT>\tools\Test-Asolaria-PublishDemoGates.ps1
```

The gate script must fail closed on leak findings or missing projected gate artifacts. Public-facing outputs belong under `projections/hb/release-demo/`, not under private operator evidence trees.

## What it does

- Copies allowlisted source folders/files into a staging folder.
- Removes excluded private artifacts.
- Sanitizes environment defaults that contain local network hints.
- Runs leak scan and writes `LEAK_SCAN_REPORT.public.json`.
- Writes `gates.report.public.json`.
- Writes or updates `release.index.public.json`.
- Optionally creates a zip archive.

## Manifest

Release scope is controlled by:

- `config/public-release.manifest.json`

Adjust this manifest instead of manually copying files.

## Execution posture

- Do not use PowerShell policy-bypass flags in public instructions.
- Do not ship ignored private trees or operator capture trees.
- Treat any `SKIPPED` gate as `SKIPPED`, not `PASS`.
