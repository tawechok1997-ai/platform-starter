[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$RepoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
$LocalRoot = Join-Path $RepoRoot '.local'
$EnvironmentPath = Join-Path $RepoRoot '.env.windows.local'
$ComposePath = Join-Path $RepoRoot 'compose.windows.yml'
$ProcessFile = Join-Path $LocalRoot 'windows-processes.json'

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

try {
  if (Test-Path -LiteralPath $ProcessFile) {
    try {
      $records = @(Get-Content -LiteralPath $ProcessFile -Raw | ConvertFrom-Json)
      foreach ($record in $records) {
        $process = Get-RecordedProcess -Record $record
        if ($process) {
          Write-Host "Stopping $($record.name)..." -ForegroundColor Cyan
          & taskkill.exe /PID $process.Id /T /F *> $null
        } else {
          Write-Host "Skipping stale process record for $($record.name)." -ForegroundColor Yellow
        }
      }
    } finally {
      Remove-Item -LiteralPath $ProcessFile -Force -ErrorAction SilentlyContinue
    }
  }

  if ((Test-Path -LiteralPath $EnvironmentPath) -and (Get-Command docker.exe -ErrorAction SilentlyContinue)) {
    Write-Host 'Stopping PostgreSQL and Redis containers...' -ForegroundColor Cyan
    & docker.exe compose --env-file $EnvironmentPath -f $ComposePath stop
    if ($LASTEXITCODE -ne 0) {
      throw 'Docker Compose could not stop the local infrastructure.'
    }
  }

  Write-Host 'Platform Starter stopped. Local database data was preserved.' -ForegroundColor Green
  exit 0
} catch {
  Write-Host "STOP FAILED: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}
