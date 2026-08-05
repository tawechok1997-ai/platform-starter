@echo off
setlocal
cd /d "%~dp0"
title Platform Starter - Verify

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\windows\verify.ps1"
set "EXIT_CODE=%ERRORLEVEL%"

echo.
if "%EXIT_CODE%"=="0" (
  echo Clean-machine verification passed.
) else (
  echo Clean-machine verification failed with exit code %EXIT_CODE%.
)
echo Evidence is stored under .local\evidence\windows-clean-machine-verification.json
pause

exit /b %EXIT_CODE%
