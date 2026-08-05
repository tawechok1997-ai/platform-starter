[CmdletBinding()]
param(
  [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$RepoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
$LocalRoot = Join-Path $RepoRoot '.local'
$EnvironmentPath = Join-Path $RepoRoot '.env.windows.local'
$ComposePath = Join-Path $RepoRoot 'compose.windows.yml'
$ProcessFile = Join-Path $LocalRoot 'windows-processes.json'

function Write-Step {
  param([string]$Message)
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Refresh-ProcessPath {
  $machinePath = [Environment]::GetEnvironmentVariable('Path', 'Machine')
  $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
  $env:Path = @($machinePath, $userPath) -join ';'
}

function Test-Command {
  param([Parameter(Mandatory = $true)][string]$Name)
  return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

function Import-DotEnv {
  param([Parameter(Mandatory = $true)][string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) {
    throw 'Run Setup-Windows.cmd before starting the project.'
  }

  foreach ($line in Get-Content -LiteralPath $Path) {
    if ($line -match '^\s*#' -or [string]::IsNullOrWhiteSpace($line)) {
      continue
    }
    if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
      $name = $Matches[1]
      $value = $Matches[2]
      if ($value.Length -ge 2 -and (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'")))) {
        $value = $value.Substring(1, $value.Length - 2)
      }
      [Environment]::SetEnvironmentVariable($name, $value, 'Process')
    }
  }
}

function Find-DockerDesktopExecutable {
  $candidates = @(
    (Join-Path $env:ProgramFiles 'Docker\Docker\Docker Desktop.exe'),
    (Join-Path $env:LOCALAPPDATA 'Docker\Docker Desktop.exe')
  )
  return $candidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
}

function Start-DockerDesktopAndWait {
  Refresh-ProcessPath
  if (-not (Test-Command 'docker.exe')) {
    throw 'Docker is not installed. Run Setup-Windows.cmd first.'
  }

  & docker.exe info *> $null
  if ($LASTEXITCODE -eq 0) {
    return
  }

  $desktop = Find-DockerDesktopExecutable
  if (-not $desktop) {
    throw 'Docker Desktop could not be found. Run Setup-Windows.cmd again.'
  }

  Write-Step 'Starting Docker Desktop'
  Start-Process -FilePath $desktop | Out-Null
  for ($attempt = 0; $attempt -lt 180; $attempt++) {
    Start-Sleep -Seconds 2
    & docker.exe info *> $null
    if ($LASTEXITCODE -eq 0) {
      return
    }
  }

  throw 'Docker Desktop did not become ready.'
}

function Get-RecordedProcess {
  param([Parameter(Mandatory = $true)]$Record)

  $process = Get-Process -Id ([int]$Record.pid) -ErrorAction SilentlyContinue
  if (-not $process) {
    return $null
  }

  $startedAt = [string]$Record.startedAt
  if ([string]::IsNullOrWhiteSpace($startedAt)) {
    return $null
  }

  try {
    $expectedStart = [DateTimeOffset]::Parse($startedAt).UtcDateTime
    $actualStart = $process.StartTime.ToUniversalTime()
    if ([Math]::Abs(($actualStart - $expectedStart).TotalSeconds) -gt 1) {
      return $null
    }
  } catch {
    return $null
  }

  return $process
}

function Stop-RecordedProcesses {
  if (-not (Test-Path -LiteralPath $ProcessFile)) {
    return
  }

  try {
    $records = Get-Content -LiteralPath $ProcessFile -Raw | ConvertFrom-Json
    foreach ($record in @($records)) {
      $process = Get-RecordedProcess -Record $record
      if ($process) {
        & taskkill.exe /PID $process.Id /T /F *> $null
      }
    }
  } catch {
    Write-Host 'Ignoring a stale Windows process file.' -ForegroundColor Yellow
  } finally {
    Remove-Item -LiteralPath $ProcessFile -Force -ErrorAction SilentlyContinue
  }
}

function Test-AllRecordedProcessesAlive {
  if (-not (Test-Path -LiteralPath $ProcessFile)) {
    return $false
  }

  try {
    $records = @(Get-Content -LiteralPath $ProcessFile -Raw | ConvertFrom-Json)
    if ($records.Count -ne 3) {
      return $false
    }
    foreach ($record in $records) {
      if (-not (Get-RecordedProcess -Record $record)) {
        return $false
      }
    }
    return $true
  } catch {
    return $false
  }
}

function Assert-PortAvailable {
  param([int]$Port)
  $listener = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($listener) {
    throw "Port $Port is already used by PID $($listener.OwningProcess). Stop that program before starting Platform Starter."
  }
}

function Start-ServiceWindow {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Command
  )

  $script = @"
`$Host.UI.RawUI.WindowTitle = 'Platform Starter - $Name'
Set-Location -LiteralPath '$($RepoRoot.Replace("'", "''"))'
$Command
if (`$LASTEXITCODE -ne 0) {
  Write-Host ''
  Write-Host '$Name stopped with an error. Keep this window open for the log.' -ForegroundColor Red
}
"@
  $encoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($script))
  return Start-Process -FilePath 'powershell.exe' -ArgumentList @(
    '-NoLogo',
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-NoExit',
    '-EncodedCommand', $encoded
  ) -WorkingDirectory $RepoRoot -PassThru
}

function New-ProcessRecord {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][System.Diagnostics.Process]$Process
  )

  return [pscustomobject]@{
    name = $Name
    pid = $Process.Id
    startedAt = $Process.StartTime.ToUniversalTime().ToString('o')
  }
}

function Wait-HttpEndpoint {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Url
  )

  Write-Step "Waiting for $Name"
  for ($attempt = 0; $attempt -lt 180; $attempt++) {
    try {
      $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3
      if ([int]$response.StatusCode -ge 200 -and [int]$response.StatusCode -lt 500) {
        return
      }
    } catch {
      Start-Sleep -Seconds 1
    }
  }

  throw "$Name did not respond at $Url. Check its PowerShell window for the actual error."
}

try {
  Set-Location $RepoRoot
  Refresh-ProcessPath
  Import-DotEnv -Path $EnvironmentPath
  Start-DockerDesktopAndWait

  Write-Step 'Starting PostgreSQL and Redis'
  & docker.exe compose --env-file $EnvironmentPath -f $ComposePath up -d --wait
  if ($LASTEXITCODE -ne 0) {
    throw 'Docker infrastructure failed to start.'
  }

  if (Test-AllRecordedProcessesAlive) {
    Write-Step 'API, Member, and Admin are already running'
  } else {
    Stop-RecordedProcesses
    Assert-PortAvailable -Port 4000
    Assert-PortAvailable -Port 3000
    Assert-PortAvailable -Port 3001

    Write-Step 'Opening application terminals'
    $apiProcess = Start-ServiceWindow -Name 'API' -Command 'pnpm.cmd --filter @platform/api dev'
    $memberProcess = Start-ServiceWindow -Name 'Member' -Command 'pnpm.cmd --filter @platform/web-member dev'
    $adminProcess = Start-ServiceWindow -Name 'Admin' -Command 'pnpm.cmd --filter @platform/web-admin dev'
    $records = @(
      (New-ProcessRecord -Name 'API' -Process $apiProcess),
      (New-ProcessRecord -Name 'Member' -Process $memberProcess),
      (New-ProcessRecord -Name 'Admin' -Process $adminProcess)
    )

    New-Item -ItemType Directory -Force -Path $LocalRoot | Out-Null
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [IO.File]::WriteAllText($ProcessFile, ($records | ConvertTo-Json), $utf8NoBom)
  }

  Wait-HttpEndpoint -Name 'API' -Url 'http://localhost:4000/health'
  Wait-HttpEndpoint -Name 'Member' -Url 'http://localhost:3000'
  Wait-HttpEndpoint -Name 'Admin' -Url 'http://localhost:3001'

  Write-Host ''
  Write-Host 'Platform Starter is running.' -ForegroundColor Green
  Write-Host 'Member: http://localhost:3000'
  Write-Host 'Admin : http://localhost:3001'
  Write-Host 'API   : http://localhost:4000/health'

  if (-not $NoBrowser) {
    Start-Process 'http://localhost:3000' | Out-Null
    Start-Process 'http://localhost:3001' | Out-Null
  }
  exit 0
} catch {
  Write-Host ''
  Write-Host "STARTUP FAILED: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
