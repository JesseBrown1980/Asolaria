param(
    [ValidateSet('read-globals','send-hex')]
    [string]$Mode,
    [string]$Port = 'COM9',
    [string]$HexPath,
    [string]$OutPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

 function Open-NovaLumPort {
     param([string]$PortName)
    try {
        Add-Type -AssemblyName System.IO.Ports -ErrorAction Stop
    } catch {
        Add-Type -Path 'D:\projects\QDD\novalink-desktop-sync-app\bin\Debug\net9.0-windows10.0.19041.0\win10-x64\System.IO.Ports.dll'
    }
    $port = New-Object System.IO.Ports.SerialPort $PortName,115200,'None',8,'One'
    $port.ReadTimeout = 1200
    $port.WriteTimeout = 1200
    $port.Handshake = 'None'
    $port.DtrEnable = $false
    $port.RtsEnable = $false
    $port.Open()
    Start-Sleep -Milliseconds 200
    $port.DiscardInBuffer()
    $port.DiscardOutBuffer()
    return $port
}

function Read-AvailableHex {
    param(
        [System.IO.Ports.SerialPort]$Port,
        [int]$TotalWaitMs = 2200,
        [int]$PollMs = 80
    )
    $bytes = New-Object System.Collections.Generic.List[byte]
    $deadline = (Get-Date).AddMilliseconds($TotalWaitMs)
    while ((Get-Date) -lt $deadline) {
        Start-Sleep -Milliseconds $PollMs
        while ($Port.BytesToRead -gt 0) {
            $buffer = New-Object byte[] $Port.BytesToRead
            $read = $Port.Read($buffer,0,$buffer.Length)
            if ($read -gt 0) {
                for ($i = 0; $i -lt $read; $i++) { [void]$bytes.Add($buffer[$i]) }
            }
        }
    }
    return ($bytes.ToArray() | ForEach-Object { $_.ToString('x2') }) -join ''
}

function Enter-BinaryMode {
    param([System.IO.Ports.SerialPort]$Port)
    $Port.DiscardInBuffer()
    $Port.DiscardOutBuffer()
    # IX-459 wake-byte fix 2026-04-06: send Ctrl-C (0x03) first to wake the unit
    # out of any stale UI state, settle, discard any echo, THEN send the binary
    # mode hash (0x23). This restores the wake-byte step that the C# tool's dead
    # CTRL_C constant proves was originally intended.
    $ctrlc = [byte[]](0x03)
    $Port.Write($ctrlc,0,1)
    Start-Sleep -Milliseconds 150
    $Port.DiscardInBuffer()
    $hash = [byte[]](0x23)
    $Port.Write($hash,0,1)
    $hex = Read-AvailableHex -Port $Port -TotalWaitMs 1200
    return $hex
}

function Read-GlobalsHex {
    param([System.IO.Ports.SerialPort]$Port)
    $Port.DiscardInBuffer()
    $Port.DiscardOutBuffer()
    $cmd = [byte[]](0x02,0x30,0x00,0x00)
    $Port.Write($cmd,0,$cmd.Length)
    $hex = Read-AvailableHex -Port $Port -TotalWaitMs 2000
    if ($hex -eq '06') {
        $hex = Read-AvailableHex -Port $Port -TotalWaitMs 1500
    } elseif ($hex.StartsWith('06') -and $hex.Length -gt 2) {
        $hex = $hex.Substring(2)
    }
    return $hex
}

function Send-HexPacket {
    param(
        [System.IO.Ports.SerialPort]$Port,
        [string]$Hex
    )
    $clean = ($Hex -replace '\s','').ToLowerInvariant()
    if (($clean.Length % 2) -ne 0) { throw "Hex length must be even." }
    $bytes = New-Object byte[] ($clean.Length / 2)
    for ($i = 0; $i -lt $bytes.Length; $i++) {
        $bytes[$i] = [Convert]::ToByte($clean.Substring($i * 2, 2), 16)
    }
    $Port.DiscardInBuffer()
    $Port.DiscardOutBuffer()
    $Port.Write($bytes,0,$bytes.Length)
    return Read-AvailableHex -Port $Port -TotalWaitMs 2200
}

$serial = $null
try {
    $serial = Open-NovaLumPort -PortName $Port
    [void](Enter-BinaryMode -Port $serial)
    switch ($Mode) {
        'read-globals' {
            $hex = Read-GlobalsHex -Port $serial
            if ($OutPath) {
                Set-Content -LiteralPath $OutPath -Value $hex -NoNewline
            } else {
                $hex
            }
        }
        'send-hex' {
            if (-not $HexPath) { throw "HexPath is required for send-hex mode." }
            $hex = Get-Content -LiteralPath $HexPath -Raw
            $response = Send-HexPacket -Port $serial -Hex $hex
            if ($OutPath) {
                Set-Content -LiteralPath $OutPath -Value $response -NoNewline
            } else {
                $response
            }
        }
    }
}
finally {
    if ($serial -and $serial.IsOpen) {
        try { $serial.Close() } catch {}
    }
}
