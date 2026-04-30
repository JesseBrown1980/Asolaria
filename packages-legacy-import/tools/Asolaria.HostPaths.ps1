Set-StrictMode -Version Latest

function Get-AsolariaRepoRoot {
  param(
    [string]$BasePath = $PSScriptRoot
  )

  return (Resolve-Path (Join-Path $BasePath "..")).Path
}

function Get-AsolariaRepoParentRoot {
  return (Split-Path -Parent (Get-AsolariaRepoRoot))
}

function Get-AsolariaRepoPath {
  param(
    [Parameter(Mandatory = $true)]
    [string]$RelativePath
  )

  return (Join-Path (Get-AsolariaRepoRoot) $RelativePath)
}

function Get-AsolariaUserHome {
  return [Environment]::GetFolderPath("UserProfile")
}

function Get-AsolariaLocalAppData {
  return [Environment]::GetFolderPath("LocalApplicationData")
}

function Get-AsolariaRoamingAppData {
  return [Environment]::GetFolderPath("ApplicationData")
}

function Get-AsolariaDesktopRoot {
  return [Environment]::GetFolderPath("Desktop")
}

function Get-AsolariaDocumentsRoot {
  return [Environment]::GetFolderPath("MyDocuments")
}

function Get-AsolariaPicturesRoot {
  return [Environment]::GetFolderPath("MyPictures")
}

function Get-AsolariaVideosRoot {
  return [Environment]::GetFolderPath("MyVideos")
}

function Get-AsolariaKnownFolderValue {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Name,
    [string]$Fallback = ""
  )

  try {
    $userShellFolders = Get-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders" -ErrorAction Stop
    $rawValue = [string]$userShellFolders.$Name
    if (-not [string]::IsNullOrWhiteSpace($rawValue)) {
      return [Environment]::ExpandEnvironmentVariables($rawValue)
    }
  } catch {
  }
  return $Fallback
}

function Get-AsolariaDownloadsRoot {
  $fallback = Join-Path (Get-AsolariaUserHome) "Downloads"
  return (Get-AsolariaKnownFolderValue -Name "{374DE290-123F-4565-9164-39C4925E467B}" -Fallback $fallback)
}

function Get-AsolariaOneDriveRoot {
  $oneDrive = [string]$env:OneDrive
  if (-not [string]::IsNullOrWhiteSpace($oneDrive)) {
    return $oneDrive
  }
  return (Join-Path (Get-AsolariaUserHome) "OneDrive")
}

function Get-AsolariaCrossDeviceRoot {
  return (Join-Path (Get-AsolariaUserHome) "CrossDevice")
}

function Get-AsolariaBridgeRoot {
  return (Join-Path (Get-AsolariaUserHome) "codex-bridge")
}

function Get-AsolariaSourceReposRoot {
  return (Join-Path (Get-AsolariaUserHome) "source\repos")
}

function Get-AsolariaSiblingPath {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Name
  )

  return (Join-Path (Get-AsolariaRepoParentRoot) $Name)
}

function Get-AsolariaAdminTerminalRuntimeRoot {
  return (Join-Path (Get-AsolariaRepoRoot) "runtime\admin-terminals")
}

function Get-AsolariaDataRoot {
  return (Get-AsolariaRepoPath -RelativePath "data")
}

function Get-AsolariaCapturesRoot {
  return (Get-AsolariaRepoPath -RelativePath "captures")
}

function Get-AsolariaReportsRoot {
  return (Get-AsolariaRepoPath -RelativePath "reports")
}

function Get-AsolariaRuntimeRoot {
  return (Get-AsolariaRepoPath -RelativePath "runtime")
}

function Get-AsolariaLogsRoot {
  return (Get-AsolariaRepoPath -RelativePath "logs")
}

function Get-AsolariaCertsRoot {
  return (Get-AsolariaRepoPath -RelativePath "certs")
}

function Get-AsolariaPublicRoot {
  return (Get-AsolariaRepoPath -RelativePath "public")
}

function Get-AsolariaVaultRoot {
  return (Join-Path (Get-AsolariaDataRoot) "vault")
}

function Get-AsolariaQuarantineRoot {
  return (Get-AsolariaRepoPath -RelativePath "quarantine")
}

function Get-AsolariaKnownMediaRoots {
  $userHome = Get-AsolariaUserHome
  $userName = Split-Path -Leaf $userHome
  $roots = [System.Collections.Generic.List[string]]::new()
  $seen = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
  $candidates = @(
    (Get-AsolariaPicturesRoot),
    (Get-AsolariaVideosRoot),
    (Get-AsolariaOneDriveRoot),
    (Get-AsolariaDownloadsRoot),
    (Get-AsolariaDesktopRoot),
    (Get-AsolariaDocumentsRoot),
    (Get-AsolariaCapturesRoot),
    (Get-AsolariaReportsRoot),
    (Get-AsolariaCrossDeviceRoot),
    "D:\Pictures",
    "D:\Videos",
    "D:\DCIM",
    "D:\Camera",
    ("D:\Users\{0}\Pictures" -f $userName),
    ("D:\Users\{0}\Videos" -f $userName)
  )
  foreach ($root in $candidates) {
    if (-not [string]::IsNullOrWhiteSpace($root)) {
      try {
        $normalizedRoot = [System.IO.Path]::GetFullPath($root).TrimEnd("\")
      } catch {
        $normalizedRoot = [string]$root
      }
      if ($seen.Add($normalizedRoot)) {
        $roots.Add($normalizedRoot)
      }
    }
  }
  return @($roots)
}

function Resolve-AsolariaMediaBucketName {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path,
    [string[]]$KnownRoots = @()
  )

  $normalized = [string]$Path
  if ([string]::IsNullOrWhiteSpace($normalized)) {
    return "unknown"
  }

  $roots = @($KnownRoots)
  if ($roots.Count -lt 1) {
    $roots = @(Get-AsolariaKnownMediaRoots)
  }

  foreach ($root in @($roots | Sort-Object Length -Descending)) {
    try {
      $rootPrefix = [System.IO.Path]::GetFullPath($root).TrimEnd("\")
      if ($normalized.Equals($rootPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
        return $root
      }
      if ($normalized.StartsWith($rootPrefix + "\", [System.StringComparison]::OrdinalIgnoreCase)) {
        return $root
      }
    } catch {
      continue
    }
  }

  if ($normalized.Length -ge 2 -and $normalized[1] -eq ':') {
    return ($normalized.Substring(0, 2) + "\")
  }
  return "other"
}

function Get-AsolariaVisionCaptureRoot {
  return (Join-Path (Join-Path (Get-AsolariaUserHome) "captures") "vision")
}

function Get-AsolariaAiHealthcareRoot {
  return (Get-AsolariaSiblingPath -Name "ai_healthcare_project")
}

function Get-AsolariaDefaultWorkdir {
  return (Get-AsolariaUserHome)
}

function Get-AsolariaToolPath {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Name
  )

  return (Join-Path (Join-Path (Get-AsolariaRepoRoot) "tools") $Name)
}
