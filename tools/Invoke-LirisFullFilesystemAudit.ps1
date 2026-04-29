param(
  [string[]]$Roots,
  [string]$OutputRoot,
  [int]$HashLimit = 25000,
  [switch]$IncludeContentHashes,
  [switch]$NoRecurse
)

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

function New-SafeDirectory {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) {
    New-Item -ItemType Directory -Force -Path $Path | Out-Null
  }
}

function ConvertTo-NdjsonLine {
  param([object]$Value)
  return ($Value | ConvertTo-Json -Compress -Depth 12)
}

function Write-Ndjson {
  param(
    [System.IO.StreamWriter]$Writer,
    [object]$Value
  )
  $Writer.WriteLine((ConvertTo-NdjsonLine $Value))
}

function Get-DefaultOutputRoot {
  $candidate = "C:\Asolaria-BEHCS-256\liris-full-filesystem-audit"
  try {
    $drives = Get-PSDrive -PSProvider FileSystem | Where-Object { $_.Free -gt 1GB } | Sort-Object Free -Descending
    if ($drives.Count -gt 0) {
      $root = Join-Path $drives[0].Root "Asolaria-BEHCS-256\liris-full-filesystem-audit"
      return $root
    }
  } catch {}
  return $candidate
}

function Test-CodeLikePath {
  param([string]$Path)
  return $Path -match '\\(Asolaria|BEHCS|Liris|OpenMythos|Hermes|Plan B|Class- copy|source|repos|projects|node_modules|packages|src|tools|scripts|sovereignty|shadow|runtime|glyph|cube|gnn|shannon|omnispindle|omniflywheel)(\\|$)'
}

function Test-SecretLikeName {
  param([string]$Name)
  return $Name -match '(^|[._-])(env|secret|secrets|token|tokens|key|keys|credential|credentials|vault|password|passwd|oauth|jwt)([._-]|$)'
}

function Test-InterestingHashName {
  param([string]$Name)
  return $Name -match '\.(js|mjs|cjs|ts|tsx|json|md|ps1|py|yml|yaml|toml|lock|cs|java|scala|rs|go|cpp|c|h|hpp|ndjson|txt)$' -or $Name -match '^(package-lock\.json|package\.json|TASKS\.md|AGENTS\.md|BROWN-HILBERT\.md|CLAUDE\.md|CODEX\.md|README|Dockerfile|Makefile)$'
}

function Get-HashSafe {
  param([string]$Path)
  try {
    return (Get-FileHash -Algorithm SHA256 -LiteralPath $Path).Hash
  } catch {
    return $null
  }
}

$startedAt = (Get-Date).ToUniversalTime().ToString("o")
if (-not $OutputRoot) { $OutputRoot = Get-DefaultOutputRoot }
$runId = "liris-full-fs-audit-" + (Get-Date -Format "yyyyMMdd-HHmmss")
$RunRoot = Join-Path $OutputRoot $runId
New-SafeDirectory $RunRoot

$filesManifest = Join-Path $RunRoot "filesystem-manifest.ndjson"
$dirsManifest = Join-Path $RunRoot "directory-manifest.ndjson"
$codeManifest = Join-Path $RunRoot "code-shadow-hidden-manifest.ndjson"
$errorManifest = Join-Path $RunRoot "errors.ndjson"
$summaryPath = Join-Path $RunRoot "summary.json"
$reportPath = Join-Path $RunRoot "report.md"

if (-not $Roots -or $Roots.Count -eq 0) {
  $Roots = @(Get-PSDrive -PSProvider FileSystem | Where-Object { Test-Path -LiteralPath $_.Root } | ForEach-Object { $_.Root })
}

$fileWriter = [System.IO.StreamWriter]::new($filesManifest, $false, [System.Text.UTF8Encoding]::new($false))
$dirWriter = [System.IO.StreamWriter]::new($dirsManifest, $false, [System.Text.UTF8Encoding]::new($false))
$codeWriter = [System.IO.StreamWriter]::new($codeManifest, $false, [System.Text.UTF8Encoding]::new($false))
$errorWriter = [System.IO.StreamWriter]::new($errorManifest, $false, [System.Text.UTF8Encoding]::new($false))

$counts = [ordered]@{
  roots = $Roots.Count
  files = 0
  directories = 0
  hidden = 0
  system = 0
  reparsePoints = 0
  codeLike = 0
  shadowLike = 0
  secretLike = 0
  hashes = 0
  errors = 0
}

$topExtensions = @{}
$topRoots = @{}

try {
  foreach ($root in $Roots) {
    $root = [string]$root
    if (-not (Test-Path -LiteralPath $root)) {
      Write-Ndjson $errorWriter ([ordered]@{ at = (Get-Date).ToUniversalTime().ToString("o"); root = $root; error = "root_not_found" })
      $counts.errors++
      continue
    }

    $items = if ($NoRecurse) {
      Get-ChildItem -LiteralPath $root -Force -ErrorAction SilentlyContinue
    } else {
      Get-ChildItem -LiteralPath $root -Force -Recurse -ErrorAction SilentlyContinue
    }

    foreach ($item in $items) {
      try {
        $attrs = [string]$item.Attributes
        $isHidden = ($item.Attributes -band [IO.FileAttributes]::Hidden) -ne 0
        $isSystem = ($item.Attributes -band [IO.FileAttributes]::System) -ne 0
        $isReparse = ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0
        $isShadow = $item.FullName -match '(\\|/)(shadow|\.shadow|shadow-files|shadow_mirror|ShadowCopy|System Volume Information|Recovery|\.git|\.claude|\.codex)(\\|$)' -or $item.Name -match 'shadow'
        $isSecret = Test-SecretLikeName $item.Name
        $isCode = Test-CodeLikePath $item.FullName -or (Test-InterestingHashName $item.Name)

        if ($isHidden) { $counts.hidden++ }
        if ($isSystem) { $counts.system++ }
        if ($isReparse) { $counts.reparsePoints++ }
        if ($isShadow) { $counts.shadowLike++ }
        if ($isSecret) { $counts.secretLike++ }
        if ($isCode) { $counts.codeLike++ }

        if ($item.PSIsContainer) {
          $counts.directories++
          $record = [ordered]@{
            kind = "directory"
            root = $root
            fullName = $item.FullName
            name = $item.Name
            attributes = $attrs
            hidden = $isHidden
            system = $isSystem
            reparsePoint = $isReparse
            shadowLike = $isShadow
            codeLike = $isCode
            createdUtc = $item.CreationTimeUtc.ToString("o")
            modifiedUtc = $item.LastWriteTimeUtc.ToString("o")
          }
          Write-Ndjson $dirWriter $record
          if ($isShadow -or $isCode -or $isHidden -or $isSystem) { Write-Ndjson $codeWriter $record }
          continue
        }

        $counts.files++
        $ext = if ($item.Extension) { $item.Extension.ToLowerInvariant() } else { "[none]" }
        if (-not $topExtensions.ContainsKey($ext)) { $topExtensions[$ext] = 0 }
        $topExtensions[$ext]++
        $rootKey = $root.ToUpperInvariant()
        if (-not $topRoots.ContainsKey($rootKey)) { $topRoots[$rootKey] = 0 }
        $topRoots[$rootKey]++

        $hash = $null
        if ($IncludeContentHashes -and -not $isSecret -and $counts.hashes -lt $HashLimit -and (Test-InterestingHashName $item.Name)) {
          $hash = Get-HashSafe $item.FullName
          if ($hash) { $counts.hashes++ }
        }

        $record = [ordered]@{
          kind = "file"
          root = $root
          fullName = $item.FullName
          directory = $item.DirectoryName
          name = $item.Name
          extension = $ext
          length = $item.Length
          attributes = $attrs
          hidden = $isHidden
          system = $isSystem
          reparsePoint = $isReparse
          shadowLike = $isShadow
          codeLike = $isCode
          secretLike = $isSecret
          sha256 = $hash
          createdUtc = $item.CreationTimeUtc.ToString("o")
          modifiedUtc = $item.LastWriteTimeUtc.ToString("o")
        }
        Write-Ndjson $fileWriter $record
        if ($isShadow -or $isCode -or $isHidden -or $isSystem -or $isSecret) { Write-Ndjson $codeWriter $record }
      } catch {
        Write-Ndjson $errorWriter ([ordered]@{ at = (Get-Date).ToUniversalTime().ToString("o"); root = $root; path = $item.FullName; error = $_.Exception.Message })
        $counts.errors++
      }
    }
  }
} finally {
  $fileWriter.Close()
  $dirWriter.Close()
  $codeWriter.Close()
  $errorWriter.Close()
}

$finishedAt = (Get-Date).ToUniversalTime().ToString("o")
$volumes = @()
$disks = @()
$partitions = @()
try { $volumes = @(Get-Volume | Select-Object DriveLetter,FileSystemLabel,FileSystem,DriveType,HealthStatus,SizeRemaining,Size) } catch {}
try { $disks = @(Get-Disk | Select-Object Number,FriendlyName,SerialNumber,BusType,PartitionStyle,OperationalStatus,HealthStatus,Size) } catch {}
try { $partitions = @(Get-Partition | Select-Object DiskNumber,PartitionNumber,DriveLetter,Type,GptType,MbrType,IsActive,IsHidden,IsReadOnly,IsOffline,Size) } catch {}

$topExtRows = $topExtensions.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 40 | ForEach-Object { [ordered]@{ extension = $_.Key; count = $_.Value } }
$topRootRows = $topRoots.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object { [ordered]@{ root = $_.Key; files = $_.Value } }

$summary = [ordered]@{
  id = $runId
  startedAt = $startedAt
  finishedAt = $finishedAt
  host = $env:COMPUTERNAME
  user = $env:USERNAME
  outputRoot = $RunRoot
  roots = $Roots
  counts = $counts
  topExtensions = $topExtRows
  files = [ordered]@{
    filesystemManifest = $filesManifest
    directoryManifest = $dirsManifest
    codeShadowHiddenManifest = $codeManifest
    errors = $errorManifest
  }
  storage = [ordered]@{
    volumes = $volumes
    disks = $disks
    partitions = $partitions
  }
  boundaries = @(
    "Metadata inventory only",
    "Secret-like file contents are not read",
    "Content hashes are opt-in and skipped for secret-like names",
    "No file move/delete/write outside audit output"
  )
}

$summary | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $summaryPath -Encoding UTF8

$report = @"
# Liris Full Filesystem Audit

Run: $runId
Host: $($env:COMPUTERNAME)
Started: $startedAt
Finished: $finishedAt

## Counts

- Roots: $($counts.roots)
- Files: $($counts.files)
- Directories: $($counts.directories)
- Hidden items: $($counts.hidden)
- System items: $($counts.system)
- Reparse points: $($counts.reparsePoints)
- Code-like items: $($counts.codeLike)
- Shadow-like items: $($counts.shadowLike)
- Secret-like metadata records: $($counts.secretLike)
- Hashes: $($counts.hashes)
- Errors: $($counts.errors)

## Outputs

- Summary: $summaryPath
- Files: $filesManifest
- Directories: $dirsManifest
- Code/shadow/hidden: $codeManifest
- Errors: $errorManifest

## Boundaries

- Metadata inventory only.
- Secret-like file contents are not read.
- Content hashes are opt-in with -IncludeContentHashes and skipped for secret-like names.
- No file move/delete/write outside audit output.
"@

$report | Set-Content -LiteralPath $reportPath -Encoding UTF8

Write-Output ($summary | ConvertTo-Json -Depth 8)
