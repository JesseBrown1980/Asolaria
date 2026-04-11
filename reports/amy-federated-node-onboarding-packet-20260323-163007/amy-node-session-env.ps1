# Session-only environment template for Amy federated node setup.
# Fill the broker values locally on Amy's machine.

param(
  [string]$AsolariaRoot = 'C:\Users\amy\Asolaria',
  [string]$BrokerUrl = '<BROKER_URL_FROM_OWNER>',
  [string]$BrokerUsername = '<BROKER_USERNAME_IF_REQUIRED>',
  [string]$BrokerPassword = '<BROKER_PASSWORD_IF_REQUIRED>',
  [string]$NodeId = 'amy'
)

Set-Location $AsolariaRoot

$env:ASOLARIA_MQTT_ENABLED = 'true'
$env:ASOLARIA_MQTT_BROKER_URL = $BrokerUrl
$env:ASOLARIA_MQTT_USERNAME = $BrokerUsername
$env:ASOLARIA_MQTT_PASSWORD = $BrokerPassword
$env:ASOLARIA_MQTT_CLIENT_ID = "asolaria-$NodeId-node"
$env:ASOLARIA_MQTT_BASE_TOPIC = "asolaria/nodes/$NodeId"
$env:ASOLARIA_MQTT_CONTROL_ENABLED = 'true'
$env:ASOLARIA_MQTT_COMPUTE_WORKER_ENABLED = 'true'
$env:ASOLARIA_MQTT_ALLOW_INSECURE_TLS = 'false'

Write-Host "Configured session for node id: $NodeId"
Write-Host "Base topic: $env:ASOLARIA_MQTT_BASE_TOPIC"
Write-Host "Root: $AsolariaRoot"
