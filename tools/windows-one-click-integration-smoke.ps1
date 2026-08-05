[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$RepoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$StartScript = Join-Path $RepoRoot 'scripts\windows\start.ps1'
$StopScript = Join-Path $RepoRoot 'scripts\windows\stop.ps1'
$EnvironmentPath = Join-Path $RepoRoot '.env.windows.local'
$LocalRoot = Join-Path $RepoRoot '.local'
$ProcessFile = Join-Path $LocalRoot 'windows-processes.json'
$MockBin = Join-Path $LocalRoot 'windows-smoke-bin'
$OriginalMachinePath = [Environment]::GetEnvironmentVariable('Path', 'Machine')
$OriginalUserPath = [Environment]::GetEnvironmentVariable('Path', 'User')
$EnvironmentBackup = $null
$EnvironmentExisted = Test-Path -LiteralPath $EnvironmentPath

function Write-Utf8NoBom {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$Content
  )

  $encoding = New-Object System.Text.UTF8Encoding($false)
  [IO.File]::WriteAllText($Path, $Content, $encoding)
}

function Invoke-OwnerScript {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [string[]]$Arguments = @()
  )

  & powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File $Path @Arguments
  $exitCode = $LASTEXITCODE
  if ($exitCode -ne 0) {
    throw "$([IO.Path]::GetFileName($Path)) failed with exit code $exitCode."
  }
}

function Test-Endpoint {
  param([Parameter(Mandatory = $true)][string]$Url)

  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 1
    return [int]$response.StatusCode -eq 200
  } catch {
    return $false
  }
}

function Wait-EndpointState {
  param(
    [Parameter(Mandatory = $true)][string]$Url,
    [Parameter(Mandatory = $true)][bool]$ExpectedHealthy,
    [int]$Attempts = 60
  )

  for ($attempt = 0; $attempt -lt $Attempts; $attempt++) {
    if ((Test-Endpoint -Url $Url) -eq $ExpectedHealthy) {
      return
    }
    Start-Sleep -Milliseconds 250
  }

  throw "Endpoint $Url did not reach expected healthy state: $ExpectedHealthy."
}

function Read-ProcessRecords {
  if (-not (Test-Path -LiteralPath $ProcessFile)) {
    throw "Process record was not created: $ProcessFile"
  }

  $records = @(Get-Content -LiteralPath $ProcessFile -Raw | ConvertFrom-Json)
  if ($records.Count -ne 3) {
    throw "Expected three process records, found $($records.Count)."
  }
  return $records
}

function Convert-RecordsToMap {
  param([Parameter(Mandatory = $true)]$Records)

  $map = @{}
  foreach ($record in @($Records)) {
    $map[[string]$record.name] = [int]$record.pid
  }
  return $map
}

function Stop-ListenerOnPort {
  param([Parameter(Mandatory = $true)][int]$Port)

  $listener = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue |
    Select-Object -First 1
  if (-not $listener) {
    throw "No listener exists on port $Port."
  }

  & taskkill.exe /PID $listener.OwningProcess /F *> $null
  if ($LASTEXITCODE -ne 0) {
    throw "Could not stop listener PID $($listener.OwningProcess) on port $Port."
  }
}

function Remove-LeftoverListeners {
  foreach ($port in @(4000, 3000, 3001)) {
    $listener = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue |
      Select-Object -First 1
    if ($listener) {
      & taskkill.exe /PID $listener.OwningProcess /F *> $null
    }
  }
}

try {
  Set-Location $RepoRoot
  New-Item -ItemType Directory -Force -Path $MockBin | Out-Null

  if ($EnvironmentExisted) {
    $EnvironmentBackup = Get-Content -LiteralPath $EnvironmentPath -Raw
  }
  Write-Utf8NoBom -Path $EnvironmentPath -Content "NODE_ENV=development`r`n"

  $nodeExecutable = (Get-Command node.exe -ErrorAction Stop).Source
  $nodeDirectory = Split-Path -Parent $nodeExecutable
  $newMachinePath = @($MockBin, $nodeDirectory, $OriginalMachinePath) |
    Where-Object { -not [string]::IsNullOrWhiteSpace($_) } |
    Select-Object -Unique
  $newUserPath = @($MockBin, $nodeDirectory, $OriginalUserPath) |
    Where-Object { -not [string]::IsNullOrWhiteSpace($_) } |
    Select-Object -Unique
  [Environment]::SetEnvironmentVariable('Path', ($newMachinePath -join ';'), 'Machine')
  [Environment]::SetEnvironmentVariable('Path', ($newUserPath -join ';'), 'User')
  $env:Path = @($MockBin, $nodeDirectory, $env:Path) -join ';'

  $dockerSource = @'
using System;
public static class Program
{
    public static int Main(string[] args)
    {
        return 0;
    }
}
'@
  $dockerPath = Join-Path $MockBin 'docker.exe'
  Remove-Item -LiteralPath $dockerPath -Force -ErrorAction SilentlyContinue
  Add-Type -TypeDefinition $dockerSource -Language CSharp -OutputAssembly $dockerPath -OutputType ConsoleApplication

  $pnpmPath = Join-Path $MockBin 'pnpm.cmd'
  $pnpmShim = @'
@echo off
setlocal
set "REPO_ROOT=%~dp0..\.."
echo %* | findstr /C:"@platform/api" >nul
if %ERRORLEVEL%==0 (
  node.exe "%REPO_ROOT%\tools\windows-one-click-smoke-service.mjs" 4000 API
  exit /b
)
echo %* | findstr /C:"@platform/web-member" >nul
if %ERRORLEVEL%==0 (
  node.exe "%REPO_ROOT%\tools\windows-one-click-smoke-service.mjs" 3000 Member
  exit /b
)
echo %* | findstr /C:"@platform/web-admin" >nul
if %ERRORLEVEL%==0 (
  node.exe "%REPO_ROOT%\tools\windows-one-click-smoke-service.mjs" 3001 Admin
  exit /b
)
echo Unexpected pnpm smoke arguments: %* 1>&2
exit /b 2
'@
  Write-Utf8NoBom -Path $pnpmPath -Content $pnpmShim

  Remove-Item -LiteralPath $ProcessFile -Force -ErrorAction SilentlyContinue
  Remove-LeftoverListeners

  Write-Host 'Running first Windows launcher start...' -ForegroundColor Cyan
  Invoke-OwnerScript -Path $StartScript -Arguments @('-NoBrowser')
  foreach ($url in @('http://localhost:4000/health', 'http://localhost:3000', 'http://localhost:3001')) {
    Wait-EndpointState -Url $url -ExpectedHealthy $true
  }
  $firstRecords = Read-ProcessRecords
  $firstMap = Convert-RecordsToMap -Records $firstRecords

  Write-Host 'Running idempotent start to verify healthy process reuse...' -ForegroundColor Cyan
  Invoke-OwnerScript -Path $StartScript -Arguments @('-NoBrowser')
  $secondMap = Convert-RecordsToMap -Records (Read-ProcessRecords)
  foreach ($name in @('API', 'Member', 'Admin')) {
    if ($firstMap[$name] -ne $secondMap[$name]) {
      throw "$name terminal was replaced even though the recorded stack was healthy."
    }
  }

  Write-Host 'Stopping only the Member child service to verify recovery...' -ForegroundColor Cyan
  Stop-ListenerOnPort -Port 3000
  Wait-EndpointState -Url 'http://localhost:3000' -ExpectedHealthy $false

  Invoke-OwnerScript -Path $StartScript -Arguments @('-NoBrowser')
  foreach ($url in @('http://localhost:4000/health', 'http://localhost:3000', 'http://localhost:3001')) {
    Wait-EndpointState -Url $url -ExpectedHealthy $true
  }
  $recoveredMap = Convert-RecordsToMap -Records (Read-ProcessRecords)
  foreach ($name in @('API', 'Member', 'Admin')) {
    if ($firstMap[$name] -eq $recoveredMap[$name]) {
      throw "$name terminal was not replaced after one service became unhealthy."
    }
  }

  Write-Host 'Running Windows stop owner against the recovered stack...' -ForegroundColor Cyan
  Invoke-OwnerScript -Path $StopScript
  if (Test-Path -LiteralPath $ProcessFile) {
    throw 'Process record remained after a successful stop.'
  }
  foreach ($url in @('http://localhost:4000/health', 'http://localhost:3000', 'http://localhost:3001')) {
    Wait-EndpointState -Url $url -ExpectedHealthy $false
  }

  Write-Host 'Verifying stale PID records cannot terminate the smoke runner...' -ForegroundColor Cyan
  New-Item -ItemType Directory -Force -Path $LocalRoot | Out-Null
  $selfProcess = Get-Process -Id $PID
  $staleRecord = [pscustomobject]@{
    name = 'SmokeRunner'
    pid = $PID
    startedAt = $selfProcess.StartTime.AddMinutes(-10).ToUniversalTime().ToString('o')
  }
  Write-Utf8NoBom -Path $ProcessFile -Content ($staleRecord | ConvertTo-Json)
  Invoke-OwnerScript -Path $StopScript
  if (-not (Get-Process -Id $PID -ErrorAction SilentlyContinue)) {
    throw 'Stop owner terminated the smoke runner from a stale PID record.'
  }
  if (Test-Path -LiteralPath $ProcessFile) {
    throw 'Stale process record remained after stop.'
  }

  Write-Host 'Windows lifecycle integration smoke passed.' -ForegroundColor Green
} finally {
  try {
    if (Test-Path -LiteralPath $ProcessFile) {
      Invoke-OwnerScript -Path $StopScript
    }
  } catch {
    Write-Warning "Cleanup stop failed: $($_.Exception.Message)"
  }

  Remove-LeftoverListeners
  [Environment]::SetEnvironmentVariable('Path', $OriginalMachinePath, 'Machine')
  [Environment]::SetEnvironmentVariable('Path', $OriginalUserPath, 'User')

  if ($EnvironmentExisted) {
    Write-Utf8NoBom -Path $EnvironmentPath -Content $EnvironmentBackup
  } else {
    Remove-Item -LiteralPath $EnvironmentPath -Force -ErrorAction SilentlyContinue
  }

  Remove-Item -LiteralPath $ProcessFile -Force -ErrorAction SilentlyContinue
  Remove-Item -LiteralPath $MockBin -Recurse -Force -ErrorAction SilentlyContinue
}
