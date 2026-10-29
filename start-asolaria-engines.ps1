# start-asolaria-engines.ps1
# Bring the Asolaria fabric engines up in their HELD / read-only state so the
# dashboard + fabric come up every boot and do not collapse when the machine is off.
# Idempotent: an engine is started ONLY if its port is not already listening.
# NO FIRE: these are servers/daemons; nothing here cranks 100B, crosses STEP-F,
# opens auto_fire, mints, or writes the cosign chain. The loop stays auto_fire=false.
# Reverse the boot autostart with:  Unregister-ScheduledTask -TaskName 'AsolariaEngines' -Confirm:$false

$ErrorActionPreference = 'SilentlyContinue'
$node = 'C:\nvm4w\nodejs\node.exe'
$py   = 'python'
$logs = 'C:\asolaria-acer\engine-logs'
New-Item -ItemType Directory -Force -Path $logs | Out-Null

# port · friendly name · working dir · exe · argument string   (boot order: infra -> dashboards -> host8 -> surfaces)
$engines = @(
  @{ Port=4947; Name='behcs-bus';        Cwd='C:\asolaria-acer';                                  Exe=$node; Args='"C:\asolaria-acer\tmp\aether-behcs-256-bundle\tools\behcs\behcs-bus.js"' }
  @{ Port=4953; Name='cosign-chain';     Cwd='C:\HyperBEHCS\bin';                                 Exe=$py;   Args='C:\HyperBEHCS\bin\asolaria-cosign-chain-daemon.py' }
  @{ Port=4952; Name='vote-quorum';      Cwd='C:\HyperBEHCS\bin';                                 Exe=$py;   Args='C:\HyperBEHCS\bin\asolaria-vote-quorum-daemon.py' }
  @{ Port=4949; Name='super-dashboard';  Cwd='C:\asolaria-acer';                                  Exe=$node; Args='--experimental-vm-modules "C:\asolaria-acer\packages\dashboard\src\super-os-viz\super-dashboard-server.mjs"' }
  @{ Port=4950; Name='omnidispatcher';   Cwd='C:\asolaria-acer\federation-remake-1024';           Exe=$node; Args='--experimental-vm-modules "C:\asolaria-acer\federation-remake-1024\tools\omnidispatcher\omnidispatcher.mjs" --boot --workers=8' }
  @{ Port=5088; Name='host8-serve';      Cwd='C:\asolaria-acer\federation-remake-1024';           Exe='C:\asolaria-acer\federation-remake-1024\target\debug\host8-serve.exe'; Args='--bind 127.0.0.1:5088' }
  @{ Port=4790; Name='maps-atlas';       Cwd='C:\asolaria-asi-on-metal-fabric\reports';           Exe=$py;   Args='-m http.server 4790 --bind 127.0.0.1' }
  @{ Port=4794; Name='fischer-live';     Cwd='C:\Users\acer\bigpickle-rebuild';                   Exe=$node; Args='src/fischer-live.mjs' }
  @{ Port=4792; Name='gnn-l0-edgelevel'; Cwd='C:\Users\acer\Asolaria\services\gnn-sidecar';       Exe=$py;   Args='inference_server.py' }
  @{ Port=4793; Name='gnn-gslgnn-w9-3';  Cwd='C:\Users\acer\Asolaria\services\gnn-sidecar';       Exe=$py;   Args='gslgnn_inference_server.py' }
)

Write-Host "=== Asolaria engines · boot-start (held / read-only · no fire) ==="
foreach ($e in $engines) {
  $up = Get-NetTCPConnection -State Listen -LocalPort $e.Port -ErrorAction SilentlyContinue |
    Where-Object { $_.LocalAddress -in @('127.0.0.1','0.0.0.0','::','::1') }
  if ($up) {
    Write-Host ("  [already up]  :{0,-5} {1}" -f $e.Port, $e.Name)
    continue
  }
  if (-not (Test-Path $e.Cwd)) { Write-Host ("  [skip·no-cwd] :{0,-5} {1}  ({2})" -f $e.Port, $e.Name, $e.Cwd); continue }
  $log = Join-Path $logs ("{0}.log" -f $e.Name)
  try {
    Start-Process -FilePath $e.Exe -ArgumentList $e.Args -WorkingDirectory $e.Cwd `
      -WindowStyle Hidden -RedirectStandardOutput $log -RedirectStandardError ("$log.err") | Out-Null
    Start-Sleep -Milliseconds 600
    Write-Host ("  [started   ]  :{0,-5} {1}" -f $e.Port, $e.Name)
  } catch {
    Write-Host ("  [FAILED    ]  :{0,-5} {1}  {2}" -f $e.Port, $e.Name, $_.Exception.Message)
  }
}
Write-Host "=== done · fabric on, nothing fired (auto_fire stays false; STEP-F not crossed) ==="
