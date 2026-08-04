@echo off
setlocal
cd /d "%~dp0"
title Platform Starter - Windows Setup

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\windows\setup.ps1"
set "EXIT_CODE=%ERRORLEVEL%"

if not "%EXIT_CODE%"=="0" (
  echo.
  echo Setup failed with exit code %EXIT_CODE%.
  echo See .local\logs\windows-setup.log for details.
  pause
)

exit /b %EXIT_CODE%
