# Liris Validator Repair And Compute Template

Generated: 2026-03-23 16:48:01 -03:00

## What Was Fixed

`tools/Validate-LirisStartupReport.ps1` had a real parser/runtime break and could not be used for deterministic intake.

The local repair:

- replaced parser-breaking regex literals with PowerShell-safe forms
- removed invalid fallback shorthand
- flattened result collections into plain arrays before JSON emission
- revalidated the script against the existing startup report template

Current validation proof:

- command:
  - `pwsh -NoProfile -ExecutionPolicy Bypass -File tools/Validate-LirisStartupReport.ps1 -ReportPath reports/liris-next-phase-startup-report-template.md`
- result:
  - `ok=true`
  - `verdict=blocked_runtime`
  - artifacts written:
    - `reports/liris-startup-validation-20260323-164801.json`
    - `reports/liris-startup-validation-20260323-164801.md`

## New Narrow Template

Added:

- `reports/liris-compute-readiness-report-template.md`

Purpose:

- match the current `IX-296` order
- steer Liris toward:
  - compat launcher rerun PID hardening proof
  - local `liris` compute-readiness proof

## Durable Read

- deterministic startup-report intake is usable again on Jesse host
- the next Rayssa-side packet should target compute-readiness and rerun-hardening, not broad startup retelling
