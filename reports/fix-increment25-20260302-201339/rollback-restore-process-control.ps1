param()
$incDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$runChanges = Join-Path $incDir 'run-changes.json'
if(Test-Path $runChanges){
  $rows = Get-Content $runChanges -Raw | ConvertFrom-Json
  foreach($r in $rows){
    try {
      if($r.Scope -eq 'HKCU'){
        $key='HKCU:\Software\Microsoft\Windows\CurrentVersion\Run'
        Set-ItemProperty -Path $key -Name $r.Name -Value $r.Value -Type String
        Remove-ItemProperty -Path $key -Name $r.DisabledName -ErrorAction SilentlyContinue
      }
    } catch {}
  }
}
$taskChanges = Join-Path $incDir 'task-changes.json'
if(Test-Path $taskChanges){
  $tasks = Get-Content $taskChanges -Raw | ConvertFrom-Json
  foreach($t in $tasks){
    try { Enable-ScheduledTask -TaskName $t.TaskName -ErrorAction SilentlyContinue | Out-Null } catch {}
  }
}
