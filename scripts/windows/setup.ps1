[CmdletBinding()]
param(
  [switch]$MachineBootstrap
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$RepoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
$LocalRoot = Join-Path $RepoRoot '.local'
$LogRoot = Join-Path $LocalRoot 'logs'
$LogPath = Join-Path $LogRoot 'windows-setup.log'
$EnvironmentPath = Join-Path $RepoRoot '.env.windows.local'
$ComposePath = Join-Path $RepoRoot 'compose.windows.yml'

New-Item -ItemType Directory -Force -Path $LogRoot | Out-Null

function Write-Step {
  param([string]$Message)
  $line = "[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Message
  Write-Host "`n==> $Message" -ForegroundColor Cyan
  Add-Content -LiteralPath $LogPath -Value $line -Encoding UTF8
}

function Write-SetupWarning {
  param([string]$Message)
  Write-Host "WARNING: $Message" -ForegroundColor Yellow
  Add-Content -LiteralPath $LogPath -Value "WARNING: $Message" -Encoding UTF8
}

function Test-Administrator {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($identity)
  return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
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

function Invoke-Native {
  param(
    [Parameter(Mandatory = $true)][string]$FilePath,
    [string[]]$Arguments = @(),
    [int[]]$SuccessCodes = @(0)
  )

  Write-Host ("> {0} {1}" -f $FilePath, ($Arguments -join ' ')) -ForegroundColor DarkGray
  & $FilePath @Arguments
  $exitCode = $LASTEXITCODE
  if ($SuccessCodes -notcontains $exitCode) {
    throw "Command failed with exit code ${exitCode}: $FilePath $($Arguments -join ' ')"
  }
  return $exitCode
}

function Assert-SupportedWindows {
  $os = Get-CimInstance Win32_OperatingSystem
  if ([int]$os.ProductType -ne 1) {
    throw 'This one-click package supports Windows 10/11 client editions. Docker Desktop does not support Windows Server. Use the Linux/WSL deployment path for Windows Server.'
  }

  $caption = [string]$os.Caption
  if ($caption -notmatch 'Windows 10|Windows 11') {
    throw "Unsupported Windows edition: $caption"
  }

  Write-Step "Detected $caption (build $($os.BuildNumber))"
}

function Set-ResumeAfterRestart {
  $setupCmd = Join-Path $RepoRoot 'Setup-Windows.cmd'
  $runOncePath = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\RunOnce'
  New-Item -Path $runOncePath -Force | Out-Null
  $command = 'cmd.exe /c ""{0}""' -f $setupCmd
  New-ItemProperty -Path $runOncePath -Name 'PlatformStarterWindowsSetup' -Value $command -PropertyType String -Force | Out-Null

  Write-Host ''
  Write-Host 'Windows must restart to finish WSL 2 setup.' -ForegroundColor Yellow
  Write-Host 'The installer will continue automatically after you sign in.' -ForegroundColor Yellow
  Write-Host 'Restarting in 30 seconds. Run "shutdown /a" to cancel.' -ForegroundColor Yellow
  shutdown.exe /r /t 30 /c 'Platform Starter is enabling WSL 2. Setup will resume after sign-in.' | Out-Null
}

function Enable-Wsl2 {
  Write-Step 'Checking WSL 2 and virtualization features'
  $restartRequired = $false
  foreach ($featureName in @('Microsoft-Windows-Subsystem-Linux', 'VirtualMachinePlatform')) {
    $feature = Get-WindowsOptionalFeature -Online -FeatureName $featureName
    if ($feature.State -ne 'Enabled') {
      Write-Step "Enabling Windows feature: $featureName"
      $result = Enable-WindowsOptionalFeature -Online -FeatureName $featureName -All -NoRestart
      if ($result.RestartNeeded) {
        $restartRequired = $true
      }
    }
  }

  if ($restartRequired) {
    Set-ResumeAfterRestart
    return $false
  }

  if (Test-Command 'wsl.exe') {
    try {
      Invoke-Native -FilePath 'wsl.exe' -Arguments @('--set-default-version', '2') -SuccessCodes @(0) | Out-Null
    } catch {
      Write-SetupWarning 'WSL default version could not be set yet. Docker Desktop will retry during startup.'
    }
  }

  return $true
}

function Get-InstallerDirectory {
  $path = Join-Path $env:TEMP 'platform-starter-windows-setup'
  New-Item -ItemType Directory -Force -Path $path | Out-Null
  return $path
}

function Install-WithWinget {
  param(
    [Parameter(Mandatory = $true)][string]$Id,
    [Parameter(Mandatory = $true)][string]$DisplayName
  )

  if (-not (Test-Command 'winget.exe')) {
    return $false
  }

  Write-Step "Installing $DisplayName with winget"
  & winget.exe install --id $Id --exact --silent --accept-package-agreements --accept-source-agreements --disable-interactivity
  if ($LASTEXITCODE -in @(0, -1978335189)) {
    return $true
  }

  Write-SetupWarning "winget could not install $DisplayName. Falling back to the official installer."
  return $false
}

function Install-Git {
  if (Test-Command 'git.exe') {
    Write-Step 'Git is already installed'
    return
  }

  if (-not (Install-WithWinget -Id 'Git.Git' -DisplayName 'Git for Windows')) {
    Write-Step 'Downloading the official Git for Windows installer'
    $release = Invoke-RestMethod -Uri 'https://api.github.com/repos/git-for-windows/git/releases/latest' -Headers @{ 'User-Agent' = 'platform-starter-setup' }
    $asset = $release.assets | Where-Object { $_.name -match '64-bit\.exe$' } | Select-Object -First 1
    if (-not $asset) {
      throw 'Unable to locate the Git for Windows x64 installer.'
    }
    $installer = Join-Path (Get-InstallerDirectory) 'Git-64-bit.exe'
    Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $installer -UseBasicParsing
    $process = Start-Process -FilePath $installer -ArgumentList @('/VERYSILENT', '/NORESTART', '/SP-') -Wait -PassThru
    if ($process.ExitCode -notin @(0, 3010)) {
      throw "Git installer failed with exit code $($process.ExitCode)."
    }
  }

  Refresh-ProcessPath
  if (-not (Test-Command 'git.exe')) {
    throw 'Git was installed but is not available on PATH.'
  }
}

function Install-Node22 {
  $nodeReady = $false
  if (Test-Command 'node.exe') {
    $major = [int]((& node.exe --version).TrimStart('v').Split('.')[0])
    $nodeReady = $major -eq 22
  }

  if ($nodeReady) {
    Write-Step 'Node.js 22 is already installed'
    return
  }

  if (-not (Install-WithWinget -Id 'OpenJS.NodeJS.22' -DisplayName 'Node.js 22')) {
    Write-Step 'Downloading the latest official Node.js 22 x64 MSI'
    $versions = Invoke-RestMethod -Uri 'https://nodejs.org/dist/index.json'
    $release = $versions | Where-Object {
      $_.version -match '^v22\.' -and $_.files -contains 'win-x64-msi'
    } | Select-Object -First 1
    if (-not $release) {
      throw 'Unable to locate a current Node.js 22 Windows x64 MSI.'
    }
    $version = [string]$release.version
    $installer = Join-Path (Get-InstallerDirectory) "node-$version-x64.msi"
    $url = "https://nodejs.org/dist/$version/node-$version-x64.msi"
    Invoke-WebRequest -Uri $url -OutFile $installer -UseBasicParsing
    $process = Start-Process -FilePath 'msiexec.exe' -ArgumentList @('/i', "`"$installer`"", '/qn', '/norestart') -Wait -PassThru
    if ($process.ExitCode -notin @(0, 3010)) {
      throw "Node.js installer failed with exit code $($process.ExitCode)."
    }
  }

  Refresh-ProcessPath
  if (-not (Test-Command 'node.exe')) {
    throw 'Node.js was installed but is not available on PATH.'
  }
  $installedMajor = [int]((& node.exe --version).TrimStart('v').Split('.')[0])
  if ($installedMajor -ne 22) {
    throw "Node.js 22 is required, but Node.js major version $installedMajor is active on PATH."
  }
}

function Find-DockerDesktopExecutable {
  $candidates = @(
    (Join-Path $env:ProgramFiles 'Docker\Docker\Docker Desktop.exe'),
    (Join-Path $env:LOCALAPPDATA 'Docker\Docker Desktop.exe')
  )
  return $candidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
}

function Install-DockerDesktop {
  if (Find-DockerDesktopExecutable) {
    Write-Step 'Docker Desktop is already installed'
    return
  }

  $installed = Install-WithWinget -Id 'Docker.DockerDesktop' -DisplayName 'Docker Desktop'
  if (-not $installed) {
    Write-Step 'Downloading the official Docker Desktop installer'
    $installer = Join-Path (Get-InstallerDirectory) 'DockerDesktopInstaller.exe'
    Invoke-WebRequest -Uri 'https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe' -OutFile $installer -UseBasicParsing
    $process = Start-Process -FilePath $installer -ArgumentList @(
      'install',
      '--quiet',
      '--accept-license',
      '--backend=wsl-2',
      '--always-run-service'
    ) -Wait -PassThru
    if ($process.ExitCode -notin @(0, 3010)) {
      throw "Docker Desktop installer failed with exit code $($process.ExitCode)."
    }
    if ($process.ExitCode -eq 3010) {
      Set-ResumeAfterRestart
      exit 3010
    }
  }

  Refresh-ProcessPath
  if (-not (Find-DockerDesktopExecutable)) {
    throw 'Docker Desktop was installed but its executable could not be found.'
  }
}

function Invoke-MachineBootstrap {
  Assert-SupportedWindows
  if (-not (Enable-Wsl2)) {
    exit 3010
  }
  Install-Git
  Install-Node22
  Install-DockerDesktop
}

function Start-DockerDesktopAndWait {
  Write-Step 'Starting Docker Desktop'
  Refresh-ProcessPath
  $desktop = Find-DockerDesktopExecutable
  if (-not $desktop) {
    throw 'Docker Desktop is not installed.'
  }

  $dockerReady = $false
  if (Test-Command 'docker.exe') {
    & docker.exe info *> $null
    $dockerReady = $LASTEXITCODE -eq 0
  }

  if (-not $dockerReady) {
    Start-Process -FilePath $desktop | Out-Null
  }

  for ($attempt = 0; $attempt -lt 180; $attempt++) {
    Start-Sleep -Seconds 2
    Refresh-ProcessPath
    if (Test-Command 'docker.exe') {
      & docker.exe info *> $null
      if ($LASTEXITCODE -eq 0) {
        return
      }
    }
  }

  throw 'Docker Desktop did not become ready. Confirm that hardware virtualization is enabled in BIOS/UEFI, then run Setup-Windows.cmd again.'
}

function New-HexSecret {
  param([int]$ByteCount = 32)
  $bytes = New-Object byte[] $ByteCount
  $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
  try {
    $rng.GetBytes($bytes)
  } finally {
    $rng.Dispose()
  }
  return -join ($bytes | ForEach-Object { $_.ToString('x2') })
}

function Write-WindowsEnvironment {
  if (Test-Path -LiteralPath $EnvironmentPath) {
    Write-Step '.env.windows.local already exists; preserving local secrets and database credentials'
    return
  }

  Write-Step 'Creating isolated Windows development environment'
  $examplePath = Join-Path $RepoRoot '.env.example'
  if (-not (Test-Path -LiteralPath $examplePath)) {
    throw '.env.example is missing.'
  }

  $databasePassword = New-HexSecret -ByteCount 24
  $replacements = @{
    'NODE_ENV' = 'development'
    'PORT' = '4000'
    'API_PORT' = '4000'
    'MEMBER_WEB_URL' = 'http://localhost:3000'
    'ADMIN_WEB_URL' = 'http://localhost:3001'
    'NEXT_PUBLIC_API_URL' = 'http://localhost:4000'
    'API_PUBLIC_URL' = 'http://localhost:4000'
    'DATABASE_URL' = "postgresql://platform:$databasePassword@127.0.0.1:55432/platform?schema=public"
    'REDIS_URL' = 'redis://127.0.0.1:56379'
    'PRIVATE_MEDIA_DIR' = '.local/private-media'
    'STORAGE_DRIVER' = 'local'
    'STORAGE_LOCAL_ROOT' = '.local/object-storage'
    'STORAGE_SIGNING_SECRET' = (New-HexSecret)
    'JWT_ACCESS_KEY' = (New-HexSecret)
    'TWO_FACTOR_ENCRYPTION_KEY' = (New-HexSecret)
    'GAME_CREDENTIAL_SECRET' = (New-HexSecret)
    'ANTIBOT_ENCRYPTION_KEY' = (New-HexSecret)
    'PASSWORD_RESET_DELIVERY_ENABLED' = 'false'
    'PASSWORD_RESET_DELIVERY_WEBHOOK_SECRET' = (New-HexSecret)
    'DEFAULT_ADMIN_SECRET' = (New-HexSecret)
  }

  $output = New-Object System.Collections.Generic.List[string]
  $output.Add('# Generated by Setup-Windows.cmd. Local development only.')
  $output.Add("WINDOWS_POSTGRES_PASSWORD=$databasePassword")
  foreach ($line in Get-Content -LiteralPath $examplePath) {
    if ($line -match '^([A-Za-z_][A-Za-z0-9_]*)=(.*)$') {
      $key = $Matches[1]
      if ($replacements.ContainsKey($key)) {
        $output.Add("$key=$($replacements[$key])")
        continue
      }
    }
    $output.Add($line)
  }

  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [IO.File]::WriteAllText($EnvironmentPath, (($output -join [Environment]::NewLine) + [Environment]::NewLine), $utf8NoBom)

  foreach ($directory in @(
    (Join-Path $LocalRoot 'private-media'),
    (Join-Path $LocalRoot 'object-storage'),
    (Join-Path $LocalRoot 'logs')
  )) {
    New-Item -ItemType Directory -Force -Path $directory | Out-Null
  }
}

function Import-DotEnv {
  param([Parameter(Mandatory = $true)][string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Environment file not found: $Path"
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

function Install-ProjectDependencies {
  Write-Step 'Preparing pnpm 11.18.0 with Corepack'
  Refresh-ProcessPath
  if (-not (Test-Command 'corepack.cmd')) {
    Invoke-Native -FilePath 'npm.cmd' -Arguments @('install', '--global', 'corepack') | Out-Null
    Refresh-ProcessPath
  }

  Invoke-Native -FilePath 'corepack.cmd' -Arguments @('enable') | Out-Null
  Invoke-Native -FilePath 'corepack.cmd' -Arguments @('prepare', 'pnpm@11.18.0', '--activate') | Out-Null
  Refresh-ProcessPath

  Write-Step 'Installing project dependencies'
  Set-Location $RepoRoot
  Invoke-Native -FilePath 'pnpm.cmd' -Arguments @('install', '--frozen-lockfile') | Out-Null
}

function Initialize-LocalDatabase {
  Write-Step 'Starting local PostgreSQL 16 and Redis containers'
  Import-DotEnv -Path $EnvironmentPath
  Invoke-Native -FilePath 'docker.exe' -Arguments @(
    'compose',
    '--env-file', $EnvironmentPath,
    '-f', $ComposePath,
    'up', '-d', '--wait'
  ) | Out-Null

  Write-Step 'Generating Prisma client and applying migrations'
  Set-Location $RepoRoot
  Invoke-Native -FilePath 'pnpm.cmd' -Arguments @('db:generate') | Out-Null
  Invoke-Native -FilePath 'pnpm.cmd' -Arguments @('db:migrate') | Out-Null

  Write-Step 'Seeding local settings and access data'
  Invoke-Native -FilePath 'pnpm.cmd' -Arguments @('db:seed') | Out-Null
  Invoke-Native -FilePath 'pnpm.cmd' -Arguments @('db:seed:access') | Out-Null
}

try {
  Set-Location $RepoRoot
  Write-Step 'Starting Platform Starter one-click Windows setup'

  if ($MachineBootstrap) {
    if (-not (Test-Administrator)) {
      throw 'Machine bootstrap must run as Administrator.'
    }
    Invoke-MachineBootstrap
    exit 0
  }

  if (-not (Test-Administrator)) {
    Write-Step 'Requesting Administrator permission for Windows features and application installation'
    $argumentLine = "-NoLogo -NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`" -MachineBootstrap"
    $elevated = Start-Process -FilePath 'powershell.exe' -Verb RunAs -ArgumentList $argumentLine -Wait -PassThru
    if ($elevated.ExitCode -eq 3010) {
      exit 0
    }
    if ($elevated.ExitCode -ne 0) {
      throw "Administrator bootstrap failed with exit code $($elevated.ExitCode)."
    }
  } else {
    Invoke-MachineBootstrap
  }

  Refresh-ProcessPath
  Start-DockerDesktopAndWait
  Write-WindowsEnvironment
  Import-DotEnv -Path $EnvironmentPath
  Install-ProjectDependencies
  Initialize-LocalDatabase

  Write-Step 'Starting API, Member, and Admin applications'
  $startScript = Join-Path $PSScriptRoot 'start.ps1'
  $startArguments = "-NoLogo -NoProfile -ExecutionPolicy Bypass -File `"$startScript`""
  $startProcess = Start-Process -FilePath 'powershell.exe' -ArgumentList $startArguments -Wait -PassThru
  if ($startProcess.ExitCode -ne 0) {
    throw "Application startup failed with exit code $($startProcess.ExitCode)."
  }

  Write-Step 'Windows setup completed successfully'
  Write-Host ''
  Write-Host 'Member: http://localhost:3000' -ForegroundColor Green
  Write-Host 'Admin : http://localhost:3001' -ForegroundColor Green
  Write-Host 'API   : http://localhost:4000/health' -ForegroundColor Green
  exit 0
} catch {
  $message = $_.Exception.Message
  Add-Content -LiteralPath $LogPath -Value "ERROR: $message`n$($_.ScriptStackTrace)" -Encoding UTF8
  Write-Host ''
  Write-Host "SETUP FAILED: $message" -ForegroundColor Red
  exit 1
}
