param(
  [string]$AsolariaRoot = 'C:\Users\amy\Asolaria',
  [string]$NodeId = 'amy',
  [string]$Executor = 'python',
  [string[]]$Args = @('--version')
)

Set-Location $AsolariaRoot

$jobId = "$NodeId-selftest-$((Get-Date).ToString('yyyyMMddHHmmss'))"
$topic = "asolaria/nodes/$NodeId/compute/request"

$payload = @{
  topic = $topic
  payload = @{
    jobId = $jobId
    requestedAt = (Get-Date).ToString('o')
    requestedBy = "$NodeId-local-selftest"
    title = "$NodeId self-test $Executor"
    spec = @{
      executor = $Executor
      args = $Args
      workingDirectory = $AsolariaRoot
      timeoutMs = 60000
      maxOutputChars = 8000
    }
  }
}

$json = $payload | ConvertTo-Json -Depth 8

Write-Host "Publishing self-test compute request to $topic"
$publish = Invoke-RestMethod `
  -Method Post `
  -Uri 'http://127.0.0.1:4781/api/integrations/mqtt/publish' `
  -ContentType 'application/json' `
  -Body $json

Start-Sleep -Seconds 3

$health = Invoke-RestMethod 'http://127.0.0.1:4781/api/health/fast'
$mqtt = Invoke-RestMethod 'http://127.0.0.1:4781/api/integrations/mqtt/status'
$compute = Invoke-RestMethod 'http://127.0.0.1:4781/api/shared-compute/status'
$workers = Invoke-RestMethod 'http://127.0.0.1:4781/api/shared-compute/workers'
$jobs = Invoke-RestMethod 'http://127.0.0.1:4781/api/shared-compute/jobs'
$federation = Invoke-RestMethod 'http://127.0.0.1:4781/api/federation/nodes'

[pscustomobject]@{
  checkedAt = (Get-Date).ToString('o')
  nodeId = $NodeId
  jobId = $jobId
  publish = $publish
  health = $health
  mqtt = $mqtt
  sharedComputeStatus = $compute
  sharedComputeWorkers = $workers
  jobs = $jobs
  federation = $federation
} | ConvertTo-Json -Depth 10
