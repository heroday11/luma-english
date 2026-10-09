@echo off
set "WORDTRAIL_DIR=%~dp0"
powershell.exe -NoProfile -Command "$studyRoot = $env:WORDTRAIL_DIR; $studyPort = Get-NetTCPConnection -LocalPort 8765 -State Listen -ErrorAction SilentlyContinue; if (-not $studyPort) { Start-Process -FilePath 'C:\Users\Administrator\AppData\Local\Programs\Python\Python311\python.exe' -ArgumentList 'dev_server.py' -WorkingDirectory $studyRoot -WindowStyle Hidden; Start-Sleep -Seconds 1 }; Start-Process 'http://127.0.0.1:8765/'"
