param()
Set-Location C:\Users\acer\CrossDevice\agent-bridge
.\Stop-AgentBridge-PC.ps1 | Out-Null
.\Start-AgentBridge-PC.ps1 -BindHost "0.0.0.0" -Port 8765 | Out-Null
Write-Host "Bridge restarted on 0.0.0.0:8765"
