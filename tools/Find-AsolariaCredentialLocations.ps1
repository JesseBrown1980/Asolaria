param(
  [string[]]$Roots = @(
    "C:\Users\acer\Asolaria",
    "C:\Users\acer\.codex",
    "C:\Users\acer\automation-tools",
    "C:\Users\acer\codex-bridge"
  ),
  [string]$OutputRoot = "C:\Users\acer\Asolaria\reports\credential-location-map",
  [int]$MaxFiles = 200000,
  [switch]$IncludeLineNumbers
)

$ErrorActionPreference = "Stop"

function New-Directory {
  param([string]$Path)
  if (-not (Test-Path $Path)) {
    New-Item -ItemType Directory -Force -Path $Path | Out-Null
  }
}

function Convert-ToRelativePath {
  param([string]$Path, [string]$Root)
  if ($Path.StartsWith($Root, [System.StringComparison]::OrdinalIgnoreCase)) {
    return $Path.Substring($Root.Length).TrimStart("\", "/")
  }
  return $Path
}

function Test-SecretLikeName {
  param([string]$Name)
  return $Name -match "(?i)(vault|credential|credentials|secret|secrets|password|passwd|pwd|token|tokens|apikey|api-key|api_key|key|keys|liris|ptsqtie|rayss|auth|oauth|cookie|session)"
}

function Get-JsonKeyPaths {
  param(
    [Parameter(Mandatory = $true)]$Value,
    [string]$Prefix = "",
    [int]$Depth = 0
  )

  if ($Depth -gt 6 -or $null -eq $Value) { return @() }

  $paths = New-Object System.Collections.Generic.List[string]

  if ($Value -is [System.Collections.IDictionary]) {
    foreach ($key in $Value.Keys) {
      $path = if ($Prefix) { "$Prefix.$key" } else { [string]$key }
      [void]$paths.Add($path)
      foreach ($child in Get-JsonKeyPaths -Value $Value[$key] -Prefix $path -Depth ($Depth + 1)) {
        [void]$paths.Add($child)
      }
    }
    return $paths
  }

  $props = $Value.PSObject.Properties
  if ($props) {
    foreach ($prop in $props) {
      $path = if ($Prefix) { "$Prefix.$($prop.Name)" } else { [string]$prop.Name }
      [void]$paths.Add($path)
      foreach ($child in Get-JsonKeyPaths -Value $prop.Value -Prefix $path -Depth ($Depth + 1)) {
        [void]$paths.Add($child)
      }
    }
  }

  return $paths
}

function Get-CmdKeyTargets {
  try {
    $raw = cmdkey /list 2>$null
    $targets = @()
    foreach ($line in $raw) {
      if ($line -match "^\s*Target:\s*(.+)$") {
        $targets += $Matches[1].Trim()
      }
    }
    return $targets
  } catch {
    return @()
  }
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$runDir = Join-Path $OutputRoot "credential-location-map-$stamp"
New-Directory $runDir

$manifestPath = Join-Path $runDir "credential-locations.ndjson"
$summaryPath = Join-Path $runDir "summary.json"
$reportPath = Join-Path $runDir "report.md"

$targetTerms = @("DESKTOP-PTSQTIE", "LIRIS", "192.168.100.2", "rayss", "vault", "credential", "secret", "token", "password")
$allFindings = New-Object System.Collections.Generic.List[object]
$filesSeen = 0
$rootsSeen = @()

foreach ($root in $Roots) {
  if (-not (Test-Path $root)) { continue }
  $resolvedRoot = (Resolve-Path $root).Path
  $rootsSeen += $resolvedRoot

  Get-ChildItem -LiteralPath $resolvedRoot -Recurse -Force -File -ErrorAction SilentlyContinue | ForEach-Object {
    if ($filesSeen -ge $MaxFiles) { return }
    $filesSeen++

    $file = $_
    $secretLike = Test-SecretLikeName -Name $file.FullName
    if (-not $secretLike) { return }

    $finding = [ordered]@{
      path = $file.FullName
      root = $resolvedRoot
      relativePath = Convert-ToRelativePath -Path $file.FullName -Root $resolvedRoot
      name = $file.Name
      extension = $file.Extension
      length = $file.Length
      lastWriteTimeUtc = $file.LastWriteTimeUtc.ToString("o")
      attributes = [string]$file.Attributes
      secretLikeName = $true
      contentRead = $false
      valuePolicy = "redacted_no_secret_values_output"
      jsonKeyPaths = @()
      targetTermLineHits = @()
      parseError = $null
    }

    if ($file.Length -le 5242880 -and $file.Extension -match "(?i)^\.(json|code-workspace)$") {
      try {
        $jsonText = [System.IO.File]::ReadAllText($file.FullName)
        $json = $jsonText | ConvertFrom-Json -ErrorAction Stop
        $finding.contentRead = $true
        $finding.jsonKeyPaths = @(Get-JsonKeyPaths -Value $json | Select-Object -Unique | Select-Object -First 400)
      } catch {
        $finding.parseError = $_.Exception.Message
      }
    } elseif ($IncludeLineNumbers -and $file.Length -le 1048576 -and $file.Extension -match "(?i)^\.(txt|md|json|env|ini|ps1|js|mjs|ts|yml|yaml|toml|conf|config)$") {
      try {
        $lineNo = 0
        $hits = New-Object System.Collections.Generic.List[object]
        foreach ($line in [System.IO.File]::ReadLines($file.FullName)) {
          $lineNo++
          foreach ($term in $targetTerms) {
            if ($line -match [regex]::Escape($term)) {
              [void]$hits.Add([ordered]@{
                line = $lineNo
                term = $term
                snippet = "<redacted>"
              })
            }
          }
        }
        $finding.contentRead = $true
        $finding.targetTermLineHits = @($hits | Select-Object -First 200)
      } catch {
        $finding.parseError = $_.Exception.Message
      }
    }

    $jsonLine = ($finding | ConvertTo-Json -Depth 10 -Compress)
    Add-Content -LiteralPath $manifestPath -Value $jsonLine -Encoding UTF8
    [void]$allFindings.Add([pscustomobject]$finding)
  }
}

$cmdKeyTargets = @(Get-CmdKeyTargets)

$vaultMeta = @()
try {
  Push-Location "C:\Users\acer\Asolaria"
  $vaultJson = node -e "const { listSecretMeta, getVaultStatus } = require('./src/secureVault'); process.stdout.write(JSON.stringify({ status: getVaultStatus(), entries: listSecretMeta() }, null, 2));"
  $vaultMeta = ($vaultJson | ConvertFrom-Json).entries
} catch {
  $vaultMeta = @()
} finally {
  Pop-Location
}

$summary = [ordered]@{
  generatedAt = (Get-Date).ToUniversalTime().ToString("o")
  roots = $rootsSeen
  filesScanned = $filesSeen
  findings = $allFindings.Count
  cmdKeyTargets = $cmdKeyTargets
  asolariaVaultEntries = @($vaultMeta | ForEach-Object {
    [ordered]@{
      namespace = $_.namespace
      name = $_.name
      createdAt = $_.createdAt
      updatedAt = $_.updatedAt
      metaKeys = @($_.meta.PSObject.Properties.Name)
      value = "<redacted>"
    }
  })
  manifest = $manifestPath
  report = $reportPath
  valuePolicy = "No password, token, key, cookie, or ciphertext plaintext value is emitted by this report."
}

$summary | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $summaryPath -Encoding UTF8

$top = $allFindings | Select-Object -First 40
$report = @()
$report += "# Credential Location Map"
$report += ""
$report += "Generated: $($summary.generatedAt)"
$report += ""
$report += "This report maps credential locations and vault targets without printing secret values."
$report += ""
$report += "## Summary"
$report += ""
$report += "- Roots scanned: $($rootsSeen.Count)"
$report += "- Files scanned: $filesSeen"
$report += "- Credential-like file locations: $($allFindings.Count)"
$report += "- Windows Credential Manager targets found: $($cmdKeyTargets.Count)"
$report += "- Asolaria vault metadata entries: $(@($summary.asolariaVaultEntries).Count)"
$report += ""
$report += "## Windows Credential Manager Targets"
$report += ""
if ($cmdKeyTargets.Count -eq 0) {
  $report += "- none found"
} else {
  foreach ($target in $cmdKeyTargets) { $report += "- $target" }
}
$report += ""
$report += "## Asolaria Vault Entries"
$report += ""
if (@($summary.asolariaVaultEntries).Count -eq 0) {
  $report += "- none found"
} else {
  foreach ($entry in $summary.asolariaVaultEntries) {
    $report += "- $($entry.namespace)/$($entry.name) value=<redacted>"
  }
}
$report += ""
$report += "## First Credential-Like Paths"
$report += ""
foreach ($finding in $top) {
  $report += "- $($finding.path) ($($finding.length) bytes)"
}
$report += ""
$report += "Full redacted manifest: $manifestPath"

$report -join "`n" | Set-Content -LiteralPath $reportPath -Encoding UTF8

Write-Output ($summary | ConvertTo-Json -Depth 10)
