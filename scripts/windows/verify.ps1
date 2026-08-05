[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$RepoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
$EnvironmentPath = Join-Path $RepoRoot '.env.windows.local'
$ComposePath = Join-Path $RepoRoot 'compose.windows.yml'
$ProcessFile = Join-Path $RepoRoot '.local\windows-processes.json'
$EvidenceRoot = Join-Path $RepoRoot '.local\evidence'
$EvidencePath = Join-Path $EvidenceRoot 'windows-clean-machine-verification.json'
$Checks = New-Object System.Collections.Generic.List[object]

function Add-Check {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][bool]$Passed,
    [Parameter(Mandatory = $true)][string]$Detail,
    [string]$Category = 'runtime'
  )

  $Checks.Add([pscustomobject]@{
    category = $Category
    name = $Name
    passed = $Passed
    detail = $Detail
  })

  $symbol = if ($Passed) { '[PASS]' } else { '[FAIL]' }
  $color = if ($Passed) { 'Green' } else { 'Red' }
  Write-Host ("{0} {1}: {2}" -f $symbol, $Name, $Detail) -ForegroundColor $color
}

function Invoke-CapturedCommand {
  param(
    [Parameter(Mandatory = $true)][string]$FilePath,
    [string[]]$Arguments = @()
  )

  $output = & $FilePath @Arguments 2>&1 | Out-String
  return [pscustomobject]@{
    exitCode = $LASTEXITCODE
    output = $output.Trim()
  }
}

function Get-FirstOutputLine {
  param([string]$Text)

  if ([string]::IsNullOrWhiteSpace($Text)) {
    return ''
  }

  $lines = @($Text -split "`r?`n" | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
  if ($lines.Count -eq 0) {
    return ''
  }
  return ([string]$lines[0]).Trim()
}

function Import-DotEnv {
  param([Parameter(Mandatory = $true)][string]$Path)

  $values = @{}
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
      $values[$name] = $value
      [Environment]::SetEnvironmentVariable($name, $value, 'Process')
    }
  }
  return $values
}

function Convert-ToFlatRecords {
  param($Value)

  $records = New-Object System.Collections.Generic.List[object]
  function Add-RecordValue {
    param($Item)
    if ($null -eq $Item) {
      return
    }
    if ($Item -is [System.Array]) {
      foreach ($nested in $Item) {
        Add-RecordValue -Item $nested
      }
      return
    }
    $records.Add($Item)
  }

  Add-RecordValue -Item $Value
  return @($records)
}

function Test-HttpEndpoint {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$Url
  )

  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
    $passed = [int]$response.StatusCode -ge 200 -and [int]$response.StatusCode -lt 400
    Add-Check -Name $Name -Passed $passed -Detail ("HTTP {0} from {1}" -f [int]$response.StatusCode, $Url) -Category 'application'
  } catch {
    Add-Check -Name $Name -Passed $false -Detail ("No successful response from {0}: {1}" -f $Url, $_.Exception.Message) -Category 'application'
  }
}

function Find-DockerDesktopExecutable {
  $candidates = @(
    (Join-Path $env:ProgramFiles 'Docker\Docker\Docker Desktop.exe'),
    (Join-Path $env:LOCALAPPDATA 'Docker\Docker Desktop.exe')
  )
  return $candidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
}

try {
  Set-Location $RepoRoot
  Write-Host 'Platform Starter clean-machine verification' -ForegroundColor Cyan
  Write-Host 'No secrets are written to the evidence report.' -ForegroundColor DarkGray
  Write-Host ''

  $os = Get-CimInstance Win32_OperatingSystem
  $supportedClient = ([int]$os.ProductType -eq 1) -and ([string]$os.Caption -match 'Windows 10|Windows 11')
  Add-Check -Name 'Supported Windows client' -Passed $supportedClient -Detail ("{0}, build {1}" -f $os.Caption, $os.BuildNumber) -Category 'machine'

  $wslCommand = Get-Command wsl.exe -ErrorAction SilentlyContinue
  if ($wslCommand) {
    $wslStatus = Invoke-CapturedCommand -FilePath 'wsl.exe' -Arguments @('--status')
    $wslPassed = $wslStatus.exitCode -eq 0
    $wslDetail = if ($wslPassed) { 'wsl.exe --status succeeded' } else { "wsl.exe --status exited with code $($wslStatus.exitCode)" }
    Add-Check -Name 'WSL command and status' -Passed $wslPassed -Detail $wslDetail -Category 'machine'
  } else {
    Add-Check -Name 'WSL command and status' -Passed $false -Detail 'wsl.exe was not found on PATH' -Category 'machine'
  }

  $toolExpectations = @(
    @{ name = 'Git'; command = 'git.exe'; arguments = @('--version'); pattern = '^git version ' },
    @{ name = 'Node.js 22'; command = 'node.exe'; arguments = @('--version'); pattern = '^v22\.' },
    @{ name = 'pnpm 11.18.0'; command = 'pnpm.cmd'; arguments = @('--version'); pattern = '^11\.18\.0$' },
    @{ name = 'Docker CLI'; command = 'docker.exe'; arguments = @('--version'); pattern = '^Docker version ' }
  )

  foreach ($tool in $toolExpectations) {
    $command = Get-Command $tool.command -ErrorAction SilentlyContinue
    if (-not $command) {
      Add-Check -Name $tool.name -Passed $false -Detail "$($tool.command) was not found on PATH" -Category 'tooling'
      continue
    }

    $version = Invoke-CapturedCommand -FilePath $tool.command -Arguments $tool.arguments
    $firstLine = Get-FirstOutputLine -Text $version.output
    $passed = $version.exitCode -eq 0 -and $firstLine -match $tool.pattern
    $detail = if ($firstLine) { $firstLine } else { "exit code $($version.exitCode)" }
    Add-Check -Name $tool.name -Passed $passed -Detail $detail -Category 'tooling'
  }

  $dockerDesktop = Find-DockerDesktopExecutable
  $dockerDesktopPassed = $null -ne $dockerDesktop
  $dockerDesktopDetail = if ($dockerDesktopPassed) { 'Docker Desktop executable found' } else { 'Docker Desktop executable not found' }
  Add-Check -Name 'Docker Desktop installation' -Passed $dockerDesktopPassed -Detail $dockerDesktopDetail -Category 'tooling'

  if (-not (Test-Path -LiteralPath $EnvironmentPath)) {
    Add-Check -Name 'Generated Windows environment' -Passed $false -Detail '.env.windows.local is missing' -Category 'configuration'
    throw 'Run Setup-Windows.cmd before verification.'
  }

  $environmentValues = Import-DotEnv -Path $EnvironmentPath
  $requiredEnvironmentKeys = @(
    'WINDOWS_POSTGRES_PASSWORD',
    'DATABASE_URL',
    'REDIS_URL',
    'BOOTSTRAP_ADMIN_USERNAME',
    'BOOTSTRAP_ADMIN_EMAIL',
    'BOOTSTRAP_ADMIN_PASSWORD',
    'JWT_ACCESS_KEY',
    'TWO_FACTOR_ENCRYPTION_KEY',
    'GAME_CREDENTIAL_SECRET',
    'ANTIBOT_ENCRYPTION_KEY'
  )
  $placeholderPattern = '^(set_in_local_env|change_me|replace_me|placeholder|)$'

  foreach ($key in $requiredEnvironmentKeys) {
    $exists = $environmentValues.ContainsKey($key)
    $safeValue = if ($exists) { [string]$environmentValues[$key] } else { '' }
    $passed = $exists -and $safeValue -notmatch $placeholderPattern
    $detail = if ($passed) { 'present and non-placeholder' } else { 'missing or placeholder' }
    Add-Check -Name "Environment key $key" -Passed $passed -Detail $detail -Category 'configuration'
  }

  $dockerInfo = Invoke-CapturedCommand -FilePath 'docker.exe' -Arguments @('info')
  $dockerInfoPassed = $dockerInfo.exitCode -eq 0
  $dockerInfoDetail = if ($dockerInfoPassed) { 'docker info succeeded' } else { "docker info exited with code $($dockerInfo.exitCode)" }
  Add-Check -Name 'Docker engine readiness' -Passed $dockerInfoPassed -Detail $dockerInfoDetail -Category 'infrastructure'

  $composeArguments = @('compose', '--env-file', $EnvironmentPath, '-f', $ComposePath)
  $composeConfig = Invoke-CapturedCommand -FilePath 'docker.exe' -Arguments ($composeArguments + @('config', '--quiet'))
  $composePassed = $composeConfig.exitCode -eq 0
  $composeDetail = if ($composePassed) { 'compose config validated' } else { "compose config exited with code $($composeConfig.exitCode)" }
  Add-Check -Name 'Docker Compose configuration' -Passed $composePassed -Detail $composeDetail -Category 'infrastructure'

  $runningServices = Invoke-CapturedCommand -FilePath 'docker.exe' -Arguments ($composeArguments + @('ps', '--status', 'running', '--services'))
  $serviceNames = @(
    ($runningServices.output -split "`r?`n") |
      Where-Object { -not [string]::IsNullOrWhiteSpace($_) } |
      ForEach-Object { $_.Trim() }
  )
  foreach ($serviceName in @('postgres', 'redis')) {
    $servicePassed = $runningServices.exitCode -eq 0 -and $serviceNames -contains $serviceName
    $serviceDetail = if ($servicePassed) { 'running' } else { 'not reported as running' }
    Add-Check -Name "Container service $serviceName" -Passed $servicePassed -Detail $serviceDetail -Category 'infrastructure'
  }

  $postgresReady = Invoke-CapturedCommand -FilePath 'docker.exe' -Arguments ($composeArguments + @('exec', '-T', 'postgres', 'pg_isready', '-U', 'platform', '-d', 'platform'))
  $postgresPassed = $postgresReady.exitCode -eq 0
  $postgresDetail = if ($postgresPassed) { 'pg_isready succeeded' } else { "pg_isready exited with code $($postgresReady.exitCode)" }
  Add-Check -Name 'PostgreSQL readiness' -Passed $postgresPassed -Detail $postgresDetail -Category 'infrastructure'

  $redisReady = Invoke-CapturedCommand -FilePath 'docker.exe' -Arguments ($composeArguments + @('exec', '-T', 'redis', 'redis-cli', 'ping'))
  $redisLine = Get-FirstOutputLine -Text $redisReady.output
  $redisPassed = $redisReady.exitCode -eq 0 -and $redisLine -eq 'PONG'
  $redisDetail = if ($redisLine) { $redisLine } else { "exit code $($redisReady.exitCode)" }
  Add-Check -Name 'Redis readiness' -Passed $redisPassed -Detail $redisDetail -Category 'infrastructure'

  $prismaStatus = Invoke-CapturedCommand -FilePath 'pnpm.cmd' -Arguments @('--filter', '@platform/api', 'exec', 'prisma', 'migrate', 'status')
  $prismaPassed = $prismaStatus.exitCode -eq 0
  $prismaDetail = if ($prismaPassed) { 'Prisma reports the database schema as reachable and current' } else { "prisma migrate status exited with code $($prismaStatus.exitCode)" }
  Add-Check -Name 'Prisma migration status' -Passed $prismaPassed -Detail $prismaDetail -Category 'database'

  if (Test-Path -LiteralPath $ProcessFile) {
    try {
      $parsed = Get-Content -LiteralPath $ProcessFile -Raw | ConvertFrom-Json
      $records = Convert-ToFlatRecords -Value $parsed
      $recordNames = @($records | ForEach-Object { [string]$_.name })
      $requiredRecordNames = @('API', 'Member', 'Admin')
      $missingRecordNames = @($requiredRecordNames | Where-Object { $recordNames -notcontains $_ })
      $recordsPassed = $records.Count -eq 3 -and $missingRecordNames.Count -eq 0
      $recordsDetail = if ($recordsPassed) { 'API, Member, and Admin records are present' } else { 'process record does not contain exactly API, Member, and Admin' }
      Add-Check -Name 'Application process records' -Passed $recordsPassed -Detail $recordsDetail -Category 'application'
    } catch {
      Add-Check -Name 'Application process records' -Passed $false -Detail 'windows-processes.json could not be parsed' -Category 'application'
    }
  } else {
    Add-Check -Name 'Application process records' -Passed $false -Detail 'windows-processes.json is missing; run Start-Windows.cmd' -Category 'application'
  }

  Test-HttpEndpoint -Name 'API health endpoint' -Url 'http://localhost:4000/health'
  Test-HttpEndpoint -Name 'Member Web endpoint' -Url 'http://localhost:3000'
  Test-HttpEndpoint -Name 'Admin Web endpoint' -Url 'http://localhost:3001'
} catch {
  Add-Check -Name 'Verification execution' -Passed $false -Detail $_.Exception.Message -Category 'verification'
} finally {
  New-Item -ItemType Directory -Force -Path $EvidenceRoot | Out-Null
  $failedChecks = @($Checks | Where-Object { -not $_.passed })
  $report = [pscustomobject]@{
    schemaVersion = 1
    generatedAt = [DateTimeOffset]::UtcNow.ToString('o')
    machine = [pscustomobject]@{
      computerName = $env:COMPUTERNAME
      userName = $env:USERNAME
    }
    summary = [pscustomobject]@{
      passed = $Checks.Count - $failedChecks.Count
      failed = $failedChecks.Count
      total = $Checks.Count
      success = $failedChecks.Count -eq 0
    }
    checks = @($Checks)
  }

  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [IO.File]::WriteAllText($EvidencePath, ($report | ConvertTo-Json -Depth 6), $utf8NoBom)

  Write-Host ''
  Write-Host ("Evidence: {0}" -f $EvidencePath) -ForegroundColor Cyan
  $summaryColor = if ($report.summary.success) { 'Green' } else { 'Red' }
  Write-Host ("Result: {0} passed, {1} failed" -f $report.summary.passed, $report.summary.failed) -ForegroundColor $summaryColor

  if (-not $report.summary.success) {
    exit 1
  }
  exit 0
}
