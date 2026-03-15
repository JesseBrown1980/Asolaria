param()
$incDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$consentBefore = Join-Path $incDir 'itop-consent-before.json'
if(Test-Path $consentBefore){
  $rows = Get-Content $consentBefore -Raw | ConvertFrom-Json
  foreach($r in $rows){
    try {
      $path = Join-Path $r.Root $r.Key
      if(Test-Path $path){
        if([string]::IsNullOrWhiteSpace([string]$r.Value)){ Remove-ItemProperty -Path $path -Name Value -ErrorAction SilentlyContinue }
        else { Set-ItemProperty -Path $path -Name Value -Value $r.Value -Type String }
      }
    } catch {}
  }
}
$taskXml = Get-ChildItem -Path $incDir -Filter 'task_*.xml' -ErrorAction SilentlyContinue
foreach($x in $taskXml){
  try { schtasks /create /xml "$($x.FullName)" /tn "$($x.BaseName -replace '^task_','' -replace '_',' ')" /f | Out-Null } catch {}
}
