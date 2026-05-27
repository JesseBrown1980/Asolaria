#requires -Version 5.0
<#
.SYNOPSIS
  Audit acer-side canonical PID-fabric indexers for WMI/CIM regression hazard.

.DESCRIPTION
  Acer-side mirror of liris L5. CI-style wrapper for
  tools/behcs/test-indexer-non-cim-regression.mjs (L4-mirror).
  Asserts that all 3 acer production indexers stay free of active
  Get-CimInstance / Get-WmiObject calls per Path B WMI rewrite canon
  (cosign seq=3367 row=e12940f6ab2c0ef3 acer-side device-pid rewrite +
  A2 system-surface rewrite 2026-05-26T00:46Z).

.PARAMETER Json
  Emit raw JSON to stdout (suitable for CI pipeline parsing).

.PARAMETER Quiet
  Suppress structured summary output (exit code only).

.EXAMPLE
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File tools/Test-Asolaria-IndexerHazardGuard.ps1

.OUTPUTS
  Exit code:
    0 = PASS (all 3 acer indexers CLEAN)
    1 = REGRESSION DETECTED (one or more indexers have active CIM calls)
    2 = AUDIT MODULE missing or node.exe not found
#>

[CmdletBinding()]
param(
  [switch]$Json,
  [switch]$Quiet
)

$ErrorActionPreference = 'Stop'

$auditModule = Join-Path $PSScriptRoot 'behcs\test-indexer-non-cim-regression.mjs'

if (-not (Test-Path $auditModule)) {
  Write-Error "Audit module not found at $auditModule"
  exit 2
}

$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
  Write-Error "node.exe not on PATH; cannot invoke audit module"
  exit 2
}

$rawJson = & node $auditModule 2>&1 | Out-String
$nodeExit = $LASTEXITCODE

if ($Json) {
  Write-Output $rawJson
  exit $nodeExit
}

try {
  $report = $rawJson | ConvertFrom-Json
} catch {
  Write-Error "Audit module produced non-JSON output (node exit=$nodeExit): $_"
  if (-not $Quiet) { Write-Output $rawJson }
  exit 2
}

if (-not $Quiet) {
  Write-Output ""
  Write-Output "=== Asolaria Indexer Hazard Guard (acer-side L5-mirror of liris L5 = L4-mirror wrap) ==="
  Write-Output ("  status:      {0}" -f $report.summary.overallStatus)
  Write-Output ("  total:       {0}" -f $report.summary.total)
  Write-Output ("  clean:       {0}" -f $report.summary.clean)
  Write-Output ("  regressions: {0}" -f $report.summary.regressions)
  Write-Output ("  notFound:    {0}" -f $report.summary.notFound)
  Write-Output ""
  if ($report.summary.overallStatus -ne 'PASS') {
    Write-Output "=== Regressions ==="
    foreach ($idx in $report.indexers) {
      if ($idx.status -eq 'REGRESSION') {
        Write-Output ("  {0}" -f $idx.path)
        foreach ($hit in $idx.hits) {
          Write-Output ("    line {0}: {1}" -f $hit.lineNumber, $hit.content)
        }
      }
    }
  }
}

if ($report.summary.overallStatus -eq 'REGRESSION_DETECTED') {
  exit 1
}
exit 0
