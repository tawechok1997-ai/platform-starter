[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][int]$Port,
  [Parameter(Mandatory = $true)][string]$Name
)

$ErrorActionPreference = 'Stop'

$RepoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$ServicePath = Join-Path $RepoRoot 'tools\windows-one-click-smoke-service.mjs'
$NodePath = (Get-Command node.exe -ErrorAction Stop).Source
$Arguments = @(
  ('"{0}"' -f $ServicePath.Replace('"', '\"')),
  [string]$Port,
  ('"{0}"' -f $Name.Replace('"', '\"'))
)

$serviceProcess = Start-Process -FilePath $NodePath -ArgumentList $Arguments -WindowStyle Hidden -PassThru
try {
  Wait-Process -Id $serviceProcess.Id
  $serviceProcess.Refresh()
  exit $serviceProcess.ExitCode
} finally {
  if (-not $serviceProcess.HasExited) {
    Stop-Process -Id $serviceProcess.Id -Force -ErrorAction SilentlyContinue
  }
}
