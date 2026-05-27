#requires -Version 5.0
<#
.SYNOPSIS
  Audit liris-side canonical PID-fabric indexers for WMI/CIM regression hazard.

.DESCRIPTION
  CI-style wrapper for tools/behcs/test-indexer-non-cim-regression.mjs (Delta L4).
  Asserts that all 4 production indexers stay free of active Get-CimInstance /
  Get-WmiObject calls per the Class-1 feedback memory
  `feedback_avoid_WMI_CIM_probes_on_liris_causes_ethernet_adapter_drop_2026_05_12.md`.

  Exit codes:
    0  All indexers CLEAN (PASS)
    1  At least one indexer has active CIM call (REGRESSION)
    2  Audit module not found or node not installed

.PARAMETER Json
  Emit structured JSON of the audit report on stdout.

.PARAMETER Quiet
  Suppress human-readable summary lines (still emit on exit-1 regression).

.EXAMPLE
  .\Test-Asolaria-IndexerHazardGuard.ps1
  # Human-readable summary + appropriate exit code

.EXAMPLE
  .\Test-Asolaria-IndexerHazardGuard.ps1 -Json
  # Raw JSON for CI pipeline consumption

.NOTES
  Delta L5 — wires Delta L4 audit into Asolaria PowerShell tooling convention.
  Authored 2026-05-26 per operator-witness OP-JESSE within active quintuple-auth window.
#>

param(
  [switch]$Json,
  [switch]$Quiet
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$auditScript = Join-Path $repoRoot 'tools\behcs\test-indexer-non-cim-regression.mjs'

if (-not (Test-Path -LiteralPath $auditScript)) {
  Write-Error "Audit module not found at: $auditScript"
  exit 2
}

$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
  Write-Error "node.exe not found in PATH"
  exit 2
}

$rawJson = & node $auditScript 2>&1
$nodeExit = $LASTEXITCODE

try {
  $report = $rawJson | ConvertFrom-Json
} catch {
  Write-Error "Audit module output not valid JSON: $rawJson"
  exit 2
}

if ($Json) {
  $rawJson
} elseif (-not $Quiet) {
  Write-Host "=== Asolaria Indexer Hazard Guard (Delta L5 wrap of L4) ==="
  Write-Host ("  status:      {0}" -f $report.summary.overallStatus)
  Write-Host ("  total:       {0}" -f $report.summary.total)
  Write-Host ("  clean:       {0}" -f $report.summary.clean)
  Write-Host ("  regressions: {0}" -f $report.summary.regressions)
  Write-Host ("  not_found:   {0}" -f $report.summary.notFound)
  Write-Host ""

  if ($report.summary.regressions -gt 0) {
    Write-Host "REGRESSION DETAIL:"
    foreach ($r in $report.results) {
      if ($r.status -eq 'REGRESSION') {
        Write-Host ("  [{0}] {1}" -f $r.status, $r.path)
        foreach ($hit in $r.hits) {
          Write-Host ("    line {0}: {1}" -f $hit.lineNumber, $hit.line)
        }
      }
    }
  }
}

exit $nodeExit
