[CmdletBinding()]
param(
  [int]$AppPort = 4781,
  [string]$MqttHost = "127.0.0.1",
  [int]$MqttTcpPort = 18883,
  [int]$MqttWsPort = 18884
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Probe-TcpPort {
  param(
    [Parameter(Mandatory = $true)][string]$TargetHost,
    [Parameter(Mandatory = $true)][int]$Port,
    [int]$TimeoutMs = 1200
  )

  $client = $null
  try {
    $client = [System.Net.Sockets.TcpClient]::new()
    $async = $client.BeginConnect($TargetHost, $Port, $null, $null)
    if (-not $async.AsyncWaitHandle.WaitOne($TimeoutMs)) {
      return [ordered]@{
        ok = $false
        host = $TargetHost
        port = $Port
        error = "timeout"
      }
    }
    $client.EndConnect($async)
    return [ordered]@{
      ok = $true
      host = $TargetHost
      port = $Port
      error = ""
    }
  } catch {
    return [ordered]@{
      ok = $false
      host = $TargetHost
      port = $Port
      error = $_.Exception.Message
    }
  } finally {
    if ($null -ne $client) {
      try { $client.Dispose() } catch {}
    }
  }
}

function Get-FieldValue($obj, [string]$name) {
  if ($null -eq $obj) { return $null }
  if ($obj -is [System.Collections.IDictionary]) {
    if ($obj.Contains($name)) {
      return $obj[$name]
    }
    return $null
  }
  if ($obj.PSObject.Properties.Name -contains $name) {
    return $obj.$name
  }
  return $null
}

function New-ReadinessSummary {
  param(
    [Parameter(Mandatory = $true)]$ControlPlane,
    [Parameter(Mandatory = $true)]$MqttTcp,
    [Parameter(Mandatory = $true)]$MqttWs
  )

  $gatewayOk = [bool](Get-FieldValue -obj (Get-FieldValue -obj $ControlPlane -name "gateway") -name "ok")
  $sandboxOk = [bool](Get-FieldValue -obj (Get-FieldValue -obj $ControlPlane -name "sandbox") -name "ok")
  $memoryOk = [bool](Get-FieldValue -obj (Get-FieldValue -obj $ControlPlane -name "memory") -name "ok")
  $appOk = [bool](Get-FieldValue -obj (Get-FieldValue -obj $ControlPlane -name "app") -name "ok")
  $controlPlaneReady = $gatewayOk -and $sandboxOk -and $memoryOk
  $localMqttReady = [bool](Get-FieldValue -obj $MqttTcp -name "ok") -and [bool](Get-FieldValue -obj $MqttWs -name "ok")

  $primaryBlocker = ""
  $recommendedNextStep = ""
  $status = "not_ready"

  if (-not $gatewayOk) {
    $primaryBlocker = "gateway_control_plane_unhealthy"
    $recommendedNextStep = "Start or repair the gateway on 4791 before running the one-button launcher."
  } elseif (-not $sandboxOk) {
    $primaryBlocker = "sandbox_manager_unhealthy"
    $recommendedNextStep = "Restore the sandbox manager on 5443 before startup."
  } elseif (-not $memoryOk) {
    $primaryBlocker = "memory_indexer_unhealthy"
    $recommendedNextStep = "Restore the memory indexer on 5444 before startup."
  } elseif (-not $localMqttReady) {
    $primaryBlocker = "local_mqtt_broker_unhealthy"
    $recommendedNextStep = "Ensure the local MQTT broker is listening on 18883 and 18884 before startup."
  } elseif (-not $appOk) {
    $primaryBlocker = "owner_controlled_4781_listener_absent"
    $recommendedNextStep = "Wait for the owner-controlled restart of 4781 or restore the missing legacy main app shell before using one-button startup."
    $status = "ready_for_owner_restart"
  } else {
    $status = "ready"
    $recommendedNextStep = "The local listeners are healthy. It is safe to run the normal startup flow."
  }

  return [ordered]@{
    status = $status
    controlPlaneReady = $controlPlaneReady
    localMqttReady = $localMqttReady
    mainAppReady = $appOk
    ownerActionRequired = $controlPlaneReady -and $localMqttReady -and (-not $appOk)
    primaryBlocker = $primaryBlocker
    recommendedNextStep = $recommendedNextStep
    launcherContract = [ordered]@{
      oneButtonPort = $AppPort
      oneButtonUrl = ("http://127.0.0.1:{0}/?startup=1&uiMode=simple" -f $AppPort)
      healthUrl = ("http://127.0.0.1:{0}/api/health" -f $AppPort)
    }
  }
}

$statusScript = Join-Path $PSScriptRoot "Get-Asolaria-ControlPlaneStatus.ps1"
if (-not (Test-Path -LiteralPath $statusScript)) {
  throw ("Control-plane status script not found: " + $statusScript)
}

$controlPlaneJson = & $statusScript -AppPort $AppPort
$controlPlane = $controlPlaneJson | ConvertFrom-Json -Depth 12
$mqttTcp = Probe-TcpPort -TargetHost $MqttHost -Port $MqttTcpPort
$mqttWs = Probe-TcpPort -TargetHost $MqttHost -Port $MqttWsPort
$readiness = New-ReadinessSummary -ControlPlane $controlPlane -MqttTcp $mqttTcp -MqttWs $mqttWs

[ordered]@{
  timestamp = (Get-Date).ToString("o")
  readiness = $readiness
  app = Get-FieldValue -obj $controlPlane -name "app"
  gateway = Get-FieldValue -obj $controlPlane -name "gateway"
  sandbox = Get-FieldValue -obj $controlPlane -name "sandbox"
  memory = Get-FieldValue -obj $controlPlane -name "memory"
  mqtt = [ordered]@{
    host = $MqttHost
    tcp = [ordered]@{
      port = $MqttTcpPort
      ok = [bool](Get-FieldValue -obj $mqttTcp -name "ok")
      error = [string](Get-FieldValue -obj $mqttTcp -name "error")
    }
    ws = [ordered]@{
      port = $MqttWsPort
      ok = [bool](Get-FieldValue -obj $mqttWs -name "ok")
      error = [string](Get-FieldValue -obj $mqttWs -name "error")
    }
  }
} | ConvertTo-Json -Depth 10
