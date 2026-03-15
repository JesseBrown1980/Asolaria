$before = Get-Content -Raw .\before.json | ConvertFrom-Json
[Environment]::SetEnvironmentVariable('PYTHON313_HOME', [string]$before.PYTHON313_HOME, 'User')
[Environment]::SetEnvironmentVariable('ANACONDA_HOME', [string]$before.ANACONDA_HOME, 'User')
