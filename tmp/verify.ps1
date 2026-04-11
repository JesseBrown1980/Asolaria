Write-Host "=== BROKER SERVICES ==="
$svcs = Get-Service -ErrorAction SilentlyContinue | Where-Object { $_.Name -match 'redis|memurai|mosquitto|mqtt' }
if ($svcs) { $svcs | Format-Table Name,Status,StartType -AutoSize } else { Write-Host "  none found" }

Write-Host ""
Write-Host "=== BROKER BINARIES ON PATH ==="
$cmds = Get-Command memurai,mosquitto,redis-server,redis-cli -ErrorAction SilentlyContinue
if ($cmds) { $cmds | Select-Object Name,Source | Format-Table -AutoSize } else { Write-Host "  none on PATH" }

Write-Host ""
Write-Host "=== BROKER INSTALL DIRS ==="
$dirs = Get-ChildItem 'C:\Program Files','C:\Program Files (x86)' -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -match 'redis|memurai|mosquitto' }
if ($dirs) { $dirs | Select-Object FullName } else { Write-Host "  none found" }

Write-Host ""
Write-Host "=== WSL ==="
try {
  $wsl = & wsl --list --quiet 2>&1
  Write-Host "  $wsl"
} catch { Write-Host "  wsl not available" }

Write-Host ""
Write-Host "=== DOCKER DESKTOP ==="
$dd = Get-Process 'Docker Desktop' -ErrorAction SilentlyContinue
if ($dd) { Write-Host "  Docker Desktop running pid=$($dd.Id)" } else { Write-Host "  Docker Desktop NOT running" }

Write-Host ""
Write-Host "=== PORTS 6379 / 1883 LIVE ==="
$r = Test-NetConnection -ComputerName 127.0.0.1 -Port 6379 -InformationLevel Quiet -WarningAction SilentlyContinue
$m = Test-NetConnection -ComputerName 127.0.0.1 -Port 1883 -InformationLevel Quiet -WarningAction SilentlyContinue
Write-Host "  Redis 6379: $(if ($r) {'UP'} else {'DOWN'})"
Write-Host "  MQTT 1883:  $(if ($m) {'UP'} else {'DOWN'})"

Write-Host ""
Write-Host "=== GNN RESULT FILES (verify exist + size) ==="
$gnn = @(
  'E:\sovereignty\research\gnn-patterns\gslgnn_archive_200k_results.json',
  'E:\sovereignty\research\gnn-patterns\training_results.json',
  'E:\sovereignty\research\gnn-patterns\gsl_model_archive_200k_shuffled.pt',
  'E:\sovereignty\research\gnn-patterns\inference_server_v2.py',
  'E:\sovereignty\research\gnn-patterns\train_gslgnn_archive.py'
)
foreach ($f in $gnn) {
  if (Test-Path $f) {
    $size = (Get-Item $f).Length
    Write-Host "  OK   $($size.ToString().PadLeft(10)) $f"
  } else {
    Write-Host "  MISS                $f"
  }
}

Write-Host ""
Write-Host "=== MEETING ROOM CODE EXISTS ==="
$mr = @(
  'E:\sovereignty\ix\grammar\meeting-room.js',
  'E:\sovereignty\ix\grammar\meeting-transport.js',
  'E:\sovereignty\ix\node_modules\ioredis\package.json',
  'E:\sovereignty\ix\node_modules\mqtt\package.json'
)
foreach ($f in $mr) {
  if (Test-Path $f) {
    Write-Host "  OK   $f"
  } else {
    Write-Host "  MISS $f"
  }
}
