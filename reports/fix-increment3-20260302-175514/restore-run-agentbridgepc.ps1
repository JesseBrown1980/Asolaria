$before = Get-Content -Raw -LiteralPath "C:\\Users\\acer\\Asolaria\\reports\\fix-increment3-20260302-175514\\agentbridgepc-command-before.txt"
Set-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run' -Name 'AgentBridgePC' -Value $before -Type String
