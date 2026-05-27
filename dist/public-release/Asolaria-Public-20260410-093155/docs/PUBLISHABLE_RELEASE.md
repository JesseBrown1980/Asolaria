# Publishable Release

Asolaria OS is published as a sanitized release bundle, not by shipping the live operator runtime.

## One command

```powershell
cd C:\Users\acer\Asolaria
powershell -ExecutionPolicy Bypass -File .\tools\Invoke-Asolaria-PublishableRelease.ps1 -Zip
```

Equivalent npm script:

```powershell
cd C:\Users\acer\Asolaria
npm run release:publishable
```

## What the publishable release guarantees

- allowlisted source-only export from `config/public-release.manifest.json`
- leak scan written to `LEAK_SCAN_REPORT.json`
- no `data`, `logs`, `captures`, `reports`, `node_modules`, or `.git` inside the release stage
- startup scripts and public deployment docs included
- optional zip artifact with SHA-256 recorded by the verifier

## Verification

Run the verifier directly:

```powershell
cd C:\Users\acer\Asolaria
powershell -ExecutionPolicy Bypass -File .\tools\Test-Asolaria-PublishableRelease.ps1
```

The verifier writes:

- `reports\release-demo\publishable-release-report.json`

## Release posture

- publish from the public profile only
- keep the source repo `private`
- treat the release bundle as the publishable OS artifact
- never publish the live operator runtime, vault data, captures, or report trees
