$ErrorActionPreference = 'Stop'
$studyRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$dataDir = Join-Path $studyRoot '.study-data'
New-Item -ItemType Directory -Path $dataDir -Force | Out-Null
Write-Host 'DeepSeek official API setup. The key is saved with Windows user encryption and is never shown.'
$secret = Read-Host 'DeepSeek API Key' -AsSecureString
if ($secret.Length -eq 0) { throw 'API key cannot be empty' }
$protected = ConvertFrom-SecureString $secret
$settings = @{provider='deepseek-official';model='deepseek-flash';protectedApiKey=$protected}
$settings | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $dataDir 'ai-config.local.json') -Encoding utf8
Write-Host 'Saved. Return to WordTrail and refresh AI Tutor; no server restart is needed.'
