$before = Get-Content -Raw .\before.json | ConvertFrom-Json
[Environment]::SetEnvironmentVariable('JAVA8_HOME', [string]$before.JAVA8_HOME_User, 'User')
[Environment]::SetEnvironmentVariable('JAVA21_HOME', [string]$before.JAVA21_HOME_User, 'User')
