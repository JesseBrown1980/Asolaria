$state = Get-Content -Raw .\rollback-secret.json | ConvertFrom-Json
[Environment]::SetEnvironmentVariable('BRIDGE_SHARED_TOKEN', [string]$state.OldToken, 'User')
if([string]::IsNullOrWhiteSpace([string]$state.OldAllowlist)){
  [Environment]::SetEnvironmentVariable('BRIDGE_SHARED_TOKEN_ALLOWLIST', $null, 'User')
}else{
  [Environment]::SetEnvironmentVariable('BRIDGE_SHARED_TOKEN_ALLOWLIST', [string]$state.OldAllowlist, 'User')
}
